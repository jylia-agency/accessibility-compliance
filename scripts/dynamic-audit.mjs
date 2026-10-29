#!/usr/bin/env node
// Analyse dynamique d'accessibilité avec un navigateur automatisé (Playwright + Chromium).
//
// À N'EXÉCUTER QU'AVEC L'AUTORISATION DE L'UTILISATEUR : le script charge les pages
// indiquées dans un navigateur sans interface et exécute leur JavaScript. Pour une URL
// distante, des requêtes réseau sont émises vers le site.
//
// Le script n'installe rien et ne modifie aucun fichier du projet. Playwright doit déjà
// être disponible (dépendance du projet audité ou installation globale), sinon le
// script s'arrête en l'expliquant. axe-core est optionnel (--axe <chemin/axe.min.js>
// ou présent dans node_modules du répertoire courant).
//
// Usage :
//   node scripts/dynamic-audit.mjs <url-ou-fichier.html> [...] [--out <dossier>]
//        [--dialog-trigger "<sélecteur>"]... [--max-tabs 80] [--axe <chemin>] [--no-axe]
//        [--playwright <chemin-du-module>] [--viewport 1280x800] [--color-scheme dark|light]

import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { RULES, CATEGORIES as C } from './lib/rules.mjs';
import { wcagLabel } from './lib/wcag22.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const TOOL_VERSION = '1.0.0';

function parseArgs(argv) {
  const o = { targets: [], dialogTriggers: [], maxTabs: 80, viewport: '1280x800', axe: null, noAxe: false, colorScheme: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') o.out = argv[++i];
    else if (a === '--dialog-trigger') o.dialogTriggers.push(argv[++i]);
    else if (a === '--max-tabs') o.maxTabs = Number(argv[++i]);
    else if (a === '--axe') o.axe = argv[++i];
    else if (a === '--no-axe') o.noAxe = true;
    else if (a === '--playwright') o.playwright = argv[++i];
    else if (a === '--viewport') o.viewport = argv[++i];
    else if (a === '--color-scheme') o.colorScheme = argv[++i];
    else if (a === '--help' || a === '-h') o.help = true;
    else o.targets.push(a);
  }
  return o;
}

function loadPlaywright(explicit) {
  const req = createRequire(import.meta.url);
  const paths = [process.cwd(), HERE];
  try {
    paths.push(execFileSync('npm', ['root', '-g'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim());
  } catch {
    /* npm indisponible */
  }
  try {
    return req(explicit ? resolve(explicit) : req.resolve('playwright', { paths }));
  } catch {
    return null;
  }
}

function findAxe(explicit) {
  if (explicit) return existsSync(explicit) ? resolve(explicit) : null;
  const candidate = join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js');
  return existsSync(candidate) ? candidate : null;
}

const toUrl = (t) => (/^(https?|file):\/\//.test(t) ? t : pathToFileURL(resolve(t)).href);

async function auditPage(browser, url, opts, outDir, pageIndex, browserScript, axePath) {
  const [vw, vh] = opts.viewport.split('x').map(Number);
  const findings = [];
  const notes = [];
  const add = (ruleId, f) => {
    const rule = RULES[ruleId];
    findings.push({
      regle: ruleId,
      titre: f.titre || rule.titre,
      categorie: f.categorie,
      gravite: f.gravite || rule.gravite,
      confiance: f.confiance || 'moyenne',
      page: url,
      element: f.element || null,
      wcag: (f.wcag || rule.wcag).map(wcagLabel),
      rgaa: f.rgaa || rule.rgaa,
      versions: { wcag: '2.2', rgaa: '4.1.2' },
      preuve: f.preuve,
      impact: f.impact || rule.impact,
      reproduction: f.reproduction,
      correction: f.correction || rule.correction,
      validation: rule.validation,
      methode: 'Analyse dynamique (Chromium sans interface, Playwright)',
    });
  };

  const newPage = async (ctxOpts = {}) => {
    const context = await browser.newContext({ viewport: { width: vw, height: vh }, ...(opts.colorScheme ? { colorScheme: opts.colorScheme } : {}), ...ctxOpts });
    await context.addInitScript({ content: browserScript });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(300);
    return { context, page };
  };

  // ---------- 1. Page par défaut : faits, contraste, cibles, animations -------
  const { context, page } = await newPage();
  const facts = await page.evaluate(() => window.__a11y.pageFacts());
  await page.screenshot({ path: join(outDir, `page-${pageIndex}.png`), fullPage: true });
  let ariaSnapshot = null;
  try {
    ariaSnapshot = await page.locator('body').ariaSnapshot();
    writeFileSync(join(outDir, `arbre-accessibilite-${pageIndex}.yml`), ariaSnapshot);
  } catch {
    notes.push('Instantané de l’arbre d’accessibilité indisponible avec cette version de Playwright.');
  }

  if (!facts.lang) add('html-lang-missing', { categorie: C.ECHEC, confiance: 'élevée', element: 'html', preuve: 'Dans le DOM rendu, <html> n’a pas d’attribut lang.', reproduction: `Inspecter l’élément <html> de ${url}.` });
  if (!facts.titre || !facts.titre.trim()) add('page-title-missing', { categorie: C.ECHEC, confiance: 'élevée', element: 'title', preuve: 'document.title est vide dans le DOM rendu.', reproduction: 'Lire le titre de l’onglet.' });

  const contrast = await page.evaluate(() => window.__a11y.contrastScan());
  for (const f of contrast.failures) {
    const lowConfidence = f.fondCanevas || f.ombreTexte || f.logoProbable;
    const failsWcag = f.ratio < f.seuilWcag;
    add('contrast-text', {
      categorie: C.ECHEC,
      confiance: lowConfidence ? 'moyenne' : 'élevée',
      element: f.selector,
      preuve: `${f.nature === 'placeholder' ? 'Placeholder' : 'Texte'} « ${f.texte} » : ${f.premierPlan} sur ${f.fond}, ratio ${Math.floor(f.ratio * 100) / 100}:1 ; seuil ${failsWcag ? `WCAG ${f.seuilWcag}:1` : ''}${failsWcag && f.ratio < f.seuilRgaa ? ' et ' : ''}${f.ratio < f.seuilRgaa ? `RGAA ${f.seuilRgaa}:1` : ''} (taille ${f.taillePx} px, graisse ${f.graisse}).${f.fondCanevas ? ' Fond déduit du canevas blanc par défaut.' : ''}${f.ombreTexte ? ` Ombre de texte présente (${f.ombreTexte}) : vérifier visuellement.` : ''}${f.logoProbable ? ' Logotype probable : exception possible (1.4.3).' : ''} Mesure sur les styles calculés à l’état par défaut uniquement.`,
      reproduction: `Ouvrir ${url}, inspecter « ${f.selector} », mesurer avec scripts/contrast.mjs "${f.premierPlan}" "${f.fond}" --size ${f.taillePx}px --weight ${f.graisse}.`,
      correction: `node scripts/contrast.mjs "${f.premierPlan}" "${f.fond}" --size ${f.taillePx}px --weight ${f.graisse} --suggest both`,
    });
  }
  if (contrast.undetermined.length) {
    add('contrast-undetermined', {
      categorie: C.MANUEL,
      confiance: 'élevée',
      element: contrast.undetermined.slice(0, 10).map((u) => u.selector).join(' ; '),
      preuve: `${contrast.undetermined.length} texte(s) dont le fond n’est pas calculable : ${contrast.undetermined.slice(0, 5).map((u) => `« ${u.texte} » (${u.raison})`).join(' ; ')}${contrast.undetermined.length > 5 ? ' ...' : ''}.`,
      reproduction: 'Mesure à la pipette sur la zone la plus défavorable.',
    });
  }
  notes.push(`Contraste : ${contrast.tested} paire(s) texte/fond mesurée(s), ${contrast.failures.length} sous le seuil, ${contrast.undetermined.length} non déterminée(s), ${contrast.skippedDisabled} élément(s) inactif(s) exclu(s) (exception des composants inactifs), ${contrast.skippedHidden} texte(s) masqué(s) visuellement non évalué(s) dans cet état (ex. lien d’évitement : à contrôler à la prise de focus).`);

  for (const f of await page.evaluate(() => window.__a11y.nonTextContrastScan())) {
    add('contrast-non-text-field', {
      categorie: C.RISQUE,
      confiance: 'moyenne',
      element: f.selector,
      preuve: `Bordure ${f.bordure} (ratio ${f.ratioBordure.toFixed(2)}:1) et fond du champ ${f.fondChamp} (ratio ${f.ratioFond.toFixed(2)}:1) par rapport au fond adjacent ${f.fondAdjacent} : aucun des deux n’atteint 3:1.`,
      reproduction: `Inspecter « ${f.selector} ».`,
    });
  }

  for (const t of await page.evaluate(() => window.__a11y.targetSizeScan())) {
    add('target-size-minimum', {
      categorie: t.exception ? C.MANUEL : C.ECHEC,
      confiance: t.exception ? 'faible' : 'moyenne',
      element: t.selector,
      preuve: `Cible de ${t.taille} px CSS${t.conflit ? ` ; le cercle de 24 px centré sur la cible intersecte « ${t.conflit} »` : ''}.${t.exception ? ` ${t.exception}.` : ' Exceptions « équivalent » et « essentiel » non vérifiables automatiquement.'}`,
      reproduction: `Mesurer la boîte englobante de « ${t.selector} » (outils de développement).`,
    });
  }

  const anims = await page.evaluate(() => window.__a11y.animations());
  const infinite = anims.filter((a) => a.iterations === 'infinie');
  for (const a of infinite) {
    add('animation-infinite', {
      categorie: C.RISQUE,
      confiance: 'moyenne',
      element: a.selector,
      preuve: `Animation « ${a.nom} » en cours, itérations infinies (durée d’un cycle ${a.dureeMs} ms). Vérifier la présence d’un moyen de pause/arrêt/masquage et le caractère essentiel (2.2.2 / RGAA 13.8).`,
      reproduction: `Observer « ${a.selector} » au chargement.`,
    });
  }

  // ---------- 2. Clavier : ordre, visibilité du focus, masquage, pièges --------
  const focusableCount = await page.evaluate(() => {
    window.__a11yFocusables = window.__a11y.focusables();
    window.__a11yTabbed = new Set();
    return window.__a11yFocusables.length;
  });
  const baseline = new Map();
  const limit = Math.min(focusableCount, 150);
  for (let i = 0; i < limit; i++) {
    const rect = await page.evaluate((k) => window.__a11y.describe(window.__a11yFocusables[k])?.rect, i);
    if (!rect || rect.w <= 0 || rect.h <= 0) continue;
    const clip = { x: Math.max(0, rect.x - 6), y: Math.max(0, rect.y - 6), width: rect.w + 12, height: rect.h + 12 };
    try {
      baseline.set(i, { clip, png: await page.screenshot({ clip, fullPage: true, animations: 'disabled', caret: 'hide' }) });
    } catch {
      /* zone hors page */
    }
  }
  const sequence = [];
  const maxTabs = Math.max(opts.maxTabs, Math.min(focusableCount + 5, 300));
  let previous = null;
  let stuck = 0;
  let wrapped = false;
  for (let k = 0; k < maxTabs; k++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(40);
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body || el === document.documentElement) return null;
      window.__a11yTabbed.add(el);
      return { d: window.__a11y.describe(el), idx: window.__a11yFocusables.indexOf(el), obs: window.__a11y.obscured(el) };
    });
    if (!info) {
      if (sequence.length) break;
      continue;
    }
    if (sequence.length && info.d.selector === sequence[0].selector && k > 0) {
      wrapped = true;
      break;
    }
    if (previous && info.d.selector === previous) {
      stuck++;
      if (stuck >= 3) {
        add('keyboard-trap', { categorie: C.RISQUE, confiance: 'moyenne', element: info.d.selector, preuve: 'Le focus reste sur le même élément après plusieurs appuis sur Tab.', reproduction: `Atteindre « ${info.d.selector} » puis appuyer sur Tab.` });
        break;
      }
    } else stuck = 0;
    previous = info.d.selector;
    const repeatAt = sequence.findIndex((s) => s.selector === info.d.selector);
    if (repeatAt > 0) {
      add('keyboard-trap', {
        categorie: C.RISQUE,
        confiance: 'moyenne',
        element: info.d.selector,
        preuve: `La tabulation revient sur « ${info.d.selector} » (position ${repeatAt + 1}) sans repasser par le début de la page : cycle de ${sequence.length - repeatAt} élément(s). Acceptable uniquement dans une fenêtre modale fermable au clavier.`,
        reproduction: 'Parcourir la page avec Tab.',
      });
      break;
    }
    sequence.push({ ...info.d, idx: info.idx });
    // Visibilité du focus
    const base = baseline.get(info.idx);
    if (base) {
      try {
        const now = await page.screenshot({ clip: base.clip, fullPage: true, animations: 'disabled', caret: 'hide' });
        if (Buffer.compare(now, base.png) === 0) {
          add('focus-not-visible', {
            categorie: C.ECHEC,
            confiance: 'élevée',
            element: info.d.selector,
            preuve: `Aucun pixel ne change dans la zone de l’élément (boîte + 6 px) entre l’état sans focus et l’état focalisé au clavier (élément « ${info.d.nom || info.d.tag} »). Un indicateur placé hors de cette zone ne serait pas détecté : contrôle visuel recommandé.`,
            reproduction: `Atteindre « ${info.d.selector} » avec Tab et observer.`,
          });
        }
      } catch {
        /* capture impossible */
      }
    }
    if (info.obs.obscured) {
      add('focus-obscured', {
        categorie: C.ECHEC,
        confiance: 'moyenne',
        element: info.d.selector,
        preuve: `L’élément focalisé n’est visible en aucun point échantillonné${info.obs.coveredBy ? ` (recouvert par « ${info.obs.coveredBy} »)` : ` (${info.obs.raison || 'hors zone visible'})`}.`,
        reproduction: `Atteindre « ${info.d.selector} » avec Tab.`,
      });
    }
  }
  notes.push(`Clavier : ${sequence.length} arrêt(s) de tabulation enregistré(s) sur ${focusableCount} élément(s) focalisable(s) visibles${wrapped ? ', retour au premier élément constaté' : ''}.`);
  writeFileSync(join(outDir, `ordre-tabulation-${pageIndex}.json`), JSON.stringify(sequence, null, 2));

  // Éléments cliquables non atteignables (écouteurs détectés via le protocole DevTools)
  try {
    const count = await page.evaluate(() => window.__a11y.clickableCandidates());
    const cdp = await context.newCDPSession(page);
    for (let i = 0; i < Math.min(count, 400); i++) {
      const { result } = await cdp.send('Runtime.evaluate', { expression: `window.__a11yCandidates[${i}]` });
      if (!result.objectId) continue;
      const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId });
      const hasClick = listeners.some((l) => ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup'].includes(l.type));
      const info = await page.evaluate((k) => {
        const el = window.__a11yCandidates[k];
        const tabbed = [...window.__a11yTabbed];
        const reachable = tabbed.some((t) => t === el || t.contains(el) || el.contains(t));
        const isLabel = el.closest('label') !== null;
        return {
          d: window.__a11y.describe(el),
          reachable,
          isLabel,
          onclickAttr: el.hasAttribute('onclick'),
          role: el.getAttribute('role'),
          focusable: el.tabIndex >= 0,
          native: el.matches('a[href], button, input, select, textarea, summary'),
        };
      }, i);
      if (info.reachable || info.isLabel || info.native) continue;
      const interactiveRole = ['button', 'link', 'checkbox', 'tab', 'menuitem', 'switch'].includes(info.role);
      if (hasClick || info.onclickAttr || interactiveRole) {
        add('keyboard-unreachable', {
          categorie: C.ECHEC,
          confiance: hasClick || info.onclickAttr ? 'élevée' : 'moyenne',
          element: info.d.selector,
          preuve: `« ${info.d.nom || info.d.tag} » ${hasClick || info.onclickAttr ? 'possède un gestionnaire de clic' : `a role="${info.role}"`} mais n’a jamais reçu le focus au cours du parcours au clavier (${info.focusable ? 'focalisable mais non atteint' : 'non focalisable'}). Vérifier l’existence d’une alternative accessible au clavier dans la page (RGAA 7.3.1).`,
          reproduction: 'Parcourir la page avec Tab et tenter d’activer la fonction.',
        });
      }
    }
    await cdp.detach();
  } catch (e) {
    notes.push(`Détection des éléments cliquables non atteignables indisponible : ${e.message}`);
  }

  // ---------- 3. Fenêtres de dialogue ---------------------------------------
  for (const trigger of opts.dialogTriggers) {
    const { context: dctx, page: dpage } = await newPage();
    try {
      const exists = await dpage.$(trigger);
      if (!exists) {
        notes.push(`Déclencheur de dialogue « ${trigger} » introuvable.`);
        continue;
      }
      await dpage.focus(trigger);
      await dpage.keyboard.press('Enter');
      await dpage.waitForTimeout(400);
      const state = await dpage.evaluate(() => {
        const dialogs = [...document.querySelectorAll('dialog[open], [role=dialog], [role=alertdialog]')].filter((d) => window.__a11y.isVisible(d));
        const d = dialogs[0];
        if (!d) return null;
        window.__a11yDialog = d;
        return {
          selector: window.__a11y.cssPath(d),
          modal: d.getAttribute('aria-modal') === 'true' || (d.nodeName === 'DIALOG' && d.matches(':modal')),
          focusInside: d.contains(document.activeElement),
          active: window.__a11y.cssPath(document.activeElement),
          focusables: [...d.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')].length,
        };
      });
      if (!state) {
        notes.push(`Aucune fenêtre de dialogue visible après activation de « ${trigger} » au clavier (Entrée).`);
        continue;
      }
      if (!state.focusInside) {
        add('dialog-focus-not-moved', { categorie: C.ECHEC, confiance: 'élevée', element: state.selector, preuve: `Après activation de « ${trigger} » au clavier, le focus est sur « ${state.active} », hors de la fenêtre.`, reproduction: `Atteindre « ${trigger} » au clavier, appuyer sur Entrée.` });
      }
      let escaped = null;
      for (let k = 0; k < state.focusables * 2 + 2; k++) {
        await dpage.keyboard.press('Tab');
        await dpage.waitForTimeout(30);
        // Focus sur body/html : le focus est passé à l'interface du navigateur (comportement admis, ex. <dialog> natif)
        const out = await dpage.evaluate(() => {
          const a = document.activeElement;
          if (!a || a === document.body || a === document.documentElement || window.__a11yDialog.contains(a)) return null;
          return window.__a11y.cssPath(a);
        });
        if (out) {
          escaped = out;
          break;
        }
      }
      if (escaped) {
        add('dialog-focus-escapes', {
          categorie: state.modal ? C.ECHEC : C.RISQUE,
          confiance: 'élevée',
          element: state.selector,
          preuve: `En tabulant depuis la fenêtre ouverte, le focus atteint « ${escaped} » situé hors de la fenêtre.${state.modal ? '' : ' La fenêtre n’est pas déclarée modale (aria-modal) : constat à confirmer si elle est visuellement modale.'}`,
          reproduction: `Ouvrir la fenêtre via « ${trigger} » puis appuyer plusieurs fois sur Tab.`,
        });
      }
      await dpage.evaluate(() => window.__a11yDialog.querySelector('button, [href], input, [tabindex]')?.focus());
      await dpage.keyboard.press('Escape');
      await dpage.waitForTimeout(300);
      let open = await dpage.evaluate(() => window.__a11y.isVisible(window.__a11yDialog) && !window.__a11yDialog.hidden);
      if (open) {
        add('dialog-escape', { categorie: C.BONNE_PRATIQUE, confiance: 'élevée', element: state.selector, preuve: 'La fenêtre reste ouverte après Échap (recommandation du motif APG « Dialog (Modal) »).', reproduction: 'Ouvrir la fenêtre puis appuyer sur Échap.' });
        const closed = await dpage.evaluate(() => {
          const b = [...window.__a11yDialog.querySelectorAll('button, [role=button]')].find((x) => /fermer|close|annuler|cancel|×|✕/i.test(x.innerText + ' ' + (x.getAttribute('aria-label') || '')));
          if (!b) return false;
          b.focus();
          return true;
        });
        if (closed) {
          await dpage.keyboard.press('Enter');
          await dpage.waitForTimeout(300);
          open = await dpage.evaluate(() => window.__a11y.isVisible(window.__a11yDialog) && !window.__a11yDialog.hidden);
        }
      }
      if (!open) {
        const back = await dpage.evaluate((sel) => document.activeElement === document.querySelector(sel) ? null : window.__a11y.cssPath(document.activeElement) || 'body', trigger);
        if (back) {
          add('dialog-focus-not-returned', { categorie: C.ECHEC, confiance: 'élevée', element: state.selector, preuve: `Après fermeture, le focus est sur « ${back} » et non sur le déclencheur « ${trigger} ».`, reproduction: 'Ouvrir puis fermer la fenêtre au clavier.' });
        }
      } else {
        notes.push(`Fenêtre « ${state.selector} » : fermeture au clavier non obtenue automatiquement (ni Échap ni bouton de fermeture identifié).`);
      }
    } finally {
      await dctx.close();
    }
  }

  // ---------- 4. Espacement du texte (1.4.12) -----------------------------------
  const before = await page.evaluate(() => window.__a11y.clippedElements());
  if (before.length) {
    add('text-truncation', {
      categorie: C.MANUEL,
      confiance: 'moyenne',
      element: before.slice(0, 10).map((b) => b.selector).join(' ; '),
      preuve: `${before.length} élément(s) déjà tronqué(s) ou rognés à l’affichage par défaut : ${before.slice(0, 5).map((b) => `« ${b.texte} » (${b.dimensions})`).join(' ; ')}. Vérifier que l’information complète reste disponible.`,
      reproduction: 'Observer la page à 100 %.',
    });
  }
  await page.addStyleTag({ content: '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}' });
  await page.waitForTimeout(150);
  const afterSpacing = await page.evaluate(() => window.__a11y.clippedElements());
  const known = new Set(before.map((b) => b.selector));
  for (const c of afterSpacing.filter((x) => !known.has(x.selector))) {
    add('text-spacing-clipping', { categorie: C.ECHEC, confiance: 'moyenne', element: c.selector, preuve: `Avec les valeurs d’espacement du critère 1.4.12, le contenu de « ${c.texte} » dépasse son conteneur masqué (${c.dimensions}).`, reproduction: 'Appliquer le bookmarklet d’espacement du texte et observer.' });
  }
  await context.close();

  // ---------- 5. Agrandissement du texte (simulation texte seul 200 %) ----------
  {
    const { context: zctx, page: zpage } = await newPage();
    const base = await zpage.evaluate(() => window.__a11y.clippedElements());
    await zpage.evaluate(() => {
      const els = [...document.querySelectorAll('body, body *')];
      const sizes = els.map((e) => {
        const st = getComputedStyle(e);
        return [parseFloat(st.fontSize), st.lineHeight];
      });
      els.forEach((e, i) => {
        e.style.setProperty('font-size', `${sizes[i][0] * 2}px`, 'important');
        if (/px$/.test(sizes[i][1])) e.style.setProperty('line-height', `${parseFloat(sizes[i][1]) * 2}px`, 'important');
      });
    });
    await zpage.waitForTimeout(150);
    const zoomed = await zpage.evaluate(() => window.__a11y.clippedElements());
    const k2 = new Set(base.map((b) => b.selector));
    for (const c of zoomed.filter((x) => !k2.has(x.selector))) {
      add('text-resize-clipping', { categorie: C.RISQUE, confiance: 'moyenne', element: c.selector, preuve: `Simulation d’agrandissement du texte seul à 200 % (tailles calculées doublées dans le navigateur) : « ${c.texte} » est coupé (${c.dimensions}). À confirmer avec la fonction de zoom texte réelle d’un navigateur.`, reproduction: 'Firefox : Affichage > Zoom > Zoom texte seulement, puis 200 %.' });
    }
    await zctx.close();
  }

  // ---------- 6. Redistribution (1.4.10) à 320 px CSS ---------------------------
  {
    const rctx = await browser.newContext({ viewport: { width: 320, height: 640 } });
    await rctx.addInitScript({ content: browserScript });
    const rpage = await rctx.newPage();
    await rpage.goto(url, { waitUntil: 'load', timeout: 45000 });
    await rpage.waitForTimeout(300);
    const ov = await rpage.evaluate(() => window.__a11y.horizontalOverflow());
    await rpage.screenshot({ path: join(outDir, `page-${pageIndex}-320px.png`), fullPage: true });
    if (ov.overflow) {
      const exempt = ov.culprits.length && ov.culprits.every((c) => ['table', 'pre', 'code', 'canvas', 'svg', 'video', 'iframe', 'img', 'figure'].includes(c.tag));
      add('reflow-horizontal-scroll', {
        categorie: exempt ? C.MANUEL : C.ECHEC,
        confiance: exempt ? 'moyenne' : 'élevée',
        element: ov.culprits.map((c) => c.selector).join(' ; '),
        preuve: `À 320 px CSS de large, la page mesure ${ov.scrollWidth} px de large. Éléments en cause : ${ov.culprits.map((c) => `${c.selector} (${c.largeur} px)`).join(', ')}.${exempt ? ' Les éléments en cause peuvent relever de l’exception (contenu nécessitant une disposition en deux dimensions).' : ''} Capture : page-${pageIndex}-320px.png.`,
        reproduction: 'Fenêtre de 1280 px, zoom 400 % (ou mode responsive à 320 px).',
      });
    }
    const clipped320 = await rpage.evaluate(() => window.__a11y.clippedElements());
    const k3 = new Set(before.map((b) => b.selector));
    for (const c of clipped320.filter((x) => !k3.has(x.selector)).slice(0, 15)) {
      add('text-resize-clipping', { categorie: C.RISQUE, confiance: 'moyenne', element: c.selector, wcag: ['1.4.10', '1.4.4'], rgaa: ['10.11', '10.4'], preuve: `À 320 px CSS de large (équivalent zoom 400 %), « ${c.texte} » est coupé (${c.dimensions}).`, reproduction: 'Mode responsive à 320 px.' });
    }
    await rctx.close();
  }

  // ---------- 7. Préférence de réduction des animations ------------------------
  if (infinite.length) {
    const mctx = await browser.newContext({ viewport: { width: vw, height: vh }, reducedMotion: 'reduce' });
    await mctx.addInitScript({ content: browserScript });
    const mpage = await mctx.newPage();
    await mpage.goto(url, { waitUntil: 'load', timeout: 45000 });
    await mpage.waitForTimeout(300);
    const still = (await mpage.evaluate(() => window.__a11y.animations())).filter((a) => a.iterations === 'infinie');
    if (still.length) {
      add('reduced-motion-missing', { categorie: C.BONNE_PRATIQUE, confiance: 'élevée', element: still.map((a) => a.selector).join(' ; '), preuve: `Avec prefers-reduced-motion: reduce, ${still.length} animation(s) infinie(s) continuent. 2.3.3 (AAA) : recommandation.`, reproduction: 'Activer la réduction des animations dans le système.' });
    }
    await mctx.close();
  }

  // ---------- 8. axe-core (optionnel) ---------------------------------------
  let axeSummary = null;
  if (axePath) {
    const actx = await browser.newContext({ viewport: { width: vw, height: vh } });
    const apage = await actx.newPage();
    await apage.goto(url, { waitUntil: 'load', timeout: 45000 });
    await apage.addScriptTag({ content: readFileSync(axePath, 'utf8') });
    const res = await apage.evaluate(async () => {
      const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } });
      const slim = (x) => ({ id: x.id, impact: x.impact, tags: x.tags, help: x.help, helpUrl: x.helpUrl, nodes: x.nodes.slice(0, 10).map((n) => ({ target: n.target.join(' '), resume: n.failureSummary })) });
      return { version: window.axe.version, violations: r.violations.map(slim), incomplete: r.incomplete.map(slim), passes: r.passes.length, inapplicable: r.inapplicable.length };
    });
    writeFileSync(join(outDir, `axe-${pageIndex}.json`), JSON.stringify(res, null, 2));
    axeSummary = { version: res.version, violations: res.violations.length, incomplete: res.incomplete.length, passes: res.passes, inapplicable: res.inapplicable };
    const scFromTags = (tags) => tags.map((t) => t.match(/^wcag(\d)(\d)(\d+)$/)).filter(Boolean).map((m) => `${m[1]}.${m[2]}.${m[3]}`);
    for (const v of res.violations) {
      const sc = scFromTags(v.tags).filter((id) => { try { wcagLabel(id); return true; } catch { return false; } });
      add('axe-violation', {
        titre: `axe-core ${v.id} : ${v.help}`,
        categorie: sc.length ? C.ECHEC : C.BONNE_PRATIQUE,
        confiance: 'élevée',
        gravite: v.impact === 'critical' ? 'Bloquante' : v.impact === 'serious' ? 'Majeure' : 'Mineure',
        wcag: sc,
        rgaa: [],
        element: v.nodes.map((n) => n.target).join(' ; '),
        preuve: `${v.nodes.length} nœud(s). ${v.nodes[0]?.resume || ''} Documentation : ${v.helpUrl}. Correspondance RGAA à établir par l’auditeur (voir data/rgaa-4.1.2-criteres.json).`,
        reproduction: `Relancer axe-core ${res.version} sur ${url}.`,
        correction: `Voir ${v.helpUrl}`,
      });
    }
    for (const v of res.incomplete) {
      add('axe-violation', { titre: `axe-core ${v.id} (à revoir) : ${v.help}`, categorie: C.MANUEL, confiance: 'moyenne', gravite: 'Information', wcag: scFromTags(v.tags).filter((id) => { try { wcagLabel(id); return true; } catch { return false; } }), rgaa: [], element: v.nodes.map((n) => n.target).join(' ; '), preuve: `axe-core n’a pas pu conclure (« incomplete ») pour ${v.nodes.length} nœud(s).`, reproduction: `Relancer axe-core sur ${url}.` });
    }
    await actx.close();
  }

  return { url, faits: facts, notes, axe: axeSummary, constats: findings, arbreAccessibilite: ariaSnapshot ? `arbre-accessibilite-${pageIndex}.yml` : null };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !opts.targets.length) {
    console.log('Usage : node scripts/dynamic-audit.mjs <url-ou-fichier.html> [...] [--out <dossier>] [--dialog-trigger "<sélecteur>"] [--axe <axe.min.js>] [--no-axe] [--max-tabs N] [--viewport 1280x800] [--color-scheme dark|light]');
    process.exit(opts.help ? 0 : 2);
  }
  const pw = loadPlaywright(opts.playwright);
  if (!pw) {
    console.error('Playwright est introuvable. Ce script ne l’installe pas. Options : utiliser le Playwright du projet audité, une installation globale, ou --playwright <chemin>. Sans navigateur, se limiter à l’analyse statique et signaler les contrôles dynamiques comme « Non testé ».');
    process.exit(3);
  }
  const axePath = opts.noAxe ? null : findAxe(opts.axe);
  const outDir = resolve(opts.out || join(tmpdir(), `a11y-dynamique-${new Date().toISOString().replace(/[:.]/g, '-')}`));
  mkdirSync(outDir, { recursive: true });
  const browserScript = readFileSync(join(HERE, 'lib', 'browser-checks.js'), 'utf8');
  const browser = await pw.chromium.launch();
  const pages = [];
  try {
    for (const [i, t] of opts.targets.entries()) {
      const url = toUrl(t);
      process.stderr.write(`Analyse de ${url}...\n`);
      try {
        pages.push(await auditPage(browser, url, opts, outDir, i + 1, browserScript, axePath));
      } catch (e) {
        pages.push({ url, erreur: e.message, constats: [] });
      }
    }
  } finally {
    await browser.close();
  }
  const all = pages.flatMap((p) => p.constats);
  const order = [C.ECHEC, C.RISQUE, C.MANUEL, C.BONNE_PRATIQUE];
  all.sort((a, b) => order.indexOf(a.categorie) - order.indexOf(b.categorie));
  all.forEach((f, i) => (f.id = `A11Y-${String(i + 1).padStart(3, '0')}`));
  const result = {
    meta: {
      outil: 'accessibility-audit / dynamic-audit',
      version: TOOL_VERSION,
      date: new Date().toISOString(),
      navigateur: `Chromium ${browser.version ? browser.version() : ''}`.trim(),
      playwright: pw.chromium ? 'disponible' : 'inconnu',
      axeCore: axePath ? 'exécuté' : 'non exécuté (absent ou désactivé)',
      viewport: opts.viewport,
      themeEmule: opts.colorScheme || 'défaut du navigateur (clair)',
      dossierSorties: outDir,
      avertissement: 'Tests automatisés sur l’état par défaut des pages (sans connexion, sans interaction autre que le clavier et les déclencheurs fournis). Ils ne couvrent qu’une partie des critères WCAG et RGAA ; aucun résultat ne vaut preuve de conformité globale. Les états survol, erreur, thèmes alternatifs et parcours authentifiés ne sont pas couverts sans scénario dédié.',
    },
    pages: pages.map(({ constats, ...rest }) => ({ ...rest, nombreConstats: constats.length })),
    // Contrôles exécutés : un critère couvert sans constat n'est PAS conforme, il est seulement « contrôlé partiellement ».
    couverture: [
      'html-lang-missing', 'page-title-missing', 'contrast-text', 'contrast-non-text-field', 'target-size-minimum', 'animation-infinite',
      'focus-not-visible', 'focus-obscured', 'keyboard-trap', 'keyboard-unreachable', 'text-spacing-clipping', 'text-resize-clipping',
      'reflow-horizontal-scroll',
      ...(opts.dialogTriggers.length ? ['dialog-focus-not-moved', 'dialog-focus-escapes', 'dialog-focus-not-returned'] : []),
    ],
    constats: all,
  };
  writeFileSync(join(outDir, 'resultats-dynamiques.json'), JSON.stringify(result, null, 2));
  const counts = {};
  for (const f of all) counts[f.categorie] = (counts[f.categorie] || 0) + 1;
  console.log(`${all.length} constat(s) dynamique(s) :`);
  for (const [c, n] of Object.entries(counts)) console.log(`  ${c} : ${n}`);
  for (const p of pages) for (const n of p.notes || []) console.log(`  [${p.url}] ${n}`);
  if (pages.some((p) => p.erreur)) for (const p of pages.filter((x) => x.erreur)) console.log(`  ERREUR ${p.url} : ${p.erreur}`);
  console.log(`Résultats : ${join(outDir, 'resultats-dynamiques.json')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
