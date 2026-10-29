#!/usr/bin/env node
// Analyse statique d'accessibilité (lecture seule, sans dépendance).
//
// Usage :
//   node scripts/static-scan.mjs <dossier-ou-fichier> [--json sortie.json] [--md sortie.md]
//        [--exclude <regex>]... [--quiet]
//
// Le script ne modifie aucun fichier du projet analysé. Les sorties ne sont écrites
// qu'aux chemins indiqués explicitement par --json et --md.
//
// IMPORTANT : une analyse statique ne permet pas de conclure à la conformité.
// Elle produit des constats « Échec vérifié » uniquement lorsque le code suffit à
// démontrer l'échec, des « Risque potentiel » à confirmer, et des « À vérifier
// manuellement » pour les contrôles non automatisables.

import { writeFileSync } from 'node:fs';
import { relative, extname, resolve } from 'node:path';
import { parseMarkup, extractTemplates, extractStyleBlocks } from './lib/markup-parser.mjs';
import { parseCss, atRules, collectCustomProperties, resolveVars, backgroundColorFrom } from './lib/css-analyzer.mjs';
import { walk, readText, markupMode, inventory, STYLE_EXT, DOC_EXT } from './lib/files.mjs';
import { RULES, CATEGORIES as C } from './lib/rules.mjs';
import { wcagLabel } from './lib/wcag22.mjs';
import {
  ARIA_ROLES, DPUB_ROLE, ABSTRACT_ROLES, INTERACTIVE_ROLES, ROLES_MANAGED_BY_CONTAINER, NATIVE_FOCUSABLE,
  validAutocomplete, PERSONAL_FIELD_HINT, GENERIC_LINK_TEXT,
} from './lib/aria.mjs';
import { parseColor, contrastRatio, composite, quantize, formatRatio, toHex, isLargeText } from './lib/color.mjs';

export const TOOL_VERSION = '1.0.0';

// Règles mises en œuvre par l'analyse statique (couverture déclarée dans les résultats)
const STATIC_RULES = [
  'img-alt-missing', 'img-alt-suspicious', 'img-alt-review', 'svg-informative-unnamed', 'iframe-title-missing', 'css-contrast-text',
  'link-name-missing', 'link-text-generic', 'button-name-missing', 'click-non-interactive', 'role-interactive-not-focusable',
  'role-interactive-no-key-handler', 'tabindex-positive', 'aria-hidden-focusable', 'aria-role-invalid', 'aria-reference-broken',
  'dialog-unlabelled', 'html-lang-missing', 'html-lang-invalid', 'page-title-missing', 'doctype-missing', 'presentational-markup',
  'landmark-main-missing', 'skip-link-missing', 'table-structure', 'focus-outline-removed', 'text-fixed-height-overflow',
  'css-fixed-width', 'font-size-viewport-units', 'viewport-zoom-disabled', 'hover-only-content', 'form-label-missing',
  'form-placeholder-only', 'form-autocomplete-missing', 'form-autocomplete-invalid', 'media-autoplay-audio', 'media-autoplay-motion',
  'meta-refresh', 'animation-infinite', 'keyboard-shortcut-single-key', 'focus-removed-by-script',
];

const CATEGORY_ORDER = [C.ECHEC, C.RISQUE, C.MANUEL, C.BONNE_PRATIQUE];
const GRAVITY_ORDER = ['Bloquante', 'Majeure', 'Mineure', 'Information'];

export function scan(target, opts = {}) {
  const root = resolve(target);
  const files = walk(root, { exclude: opts.exclude || [] });
  const findings = [];
  const notes = { nonConcluants: 0, fichiersIgnores: [] };
  const sources = new Map();

  const lineText = (file, line) => {
    const src = sources.get(file);
    if (!src) return '';
    const l = src.split('\n')[line - 1] || '';
    const t = l.trim();
    return t.length > 180 ? `${t.slice(0, 177)}...` : t;
  };

  const add = (ruleId, f) => {
    const rule = RULES[ruleId];
    if (!rule) throw new Error(`Règle inconnue : ${ruleId}`);
    findings.push({
      regle: ruleId,
      titre: f.titre || rule.titre,
      categorie: f.categorie,
      gravite: f.gravite || rule.gravite,
      confiance: f.confiance || 'moyenne',
      fichier: relative(root, f.file) || f.file,
      ligne: f.line,
      extrait: f.extrait ?? lineText(f.file, f.line),
      wcag: rule.wcag.map(wcagLabel),
      rgaa: rule.rgaa,
      versions: { wcag: '2.2', rgaa: '4.1.2' },
      preuve: f.preuve,
      impact: rule.impact,
      reproduction: f.reproduction || 'Ouvrir le fichier à la ligne indiquée ; confirmer sur le rendu (analyse dynamique ou test manuel).',
      correction: f.correction || rule.correction,
      validation: rule.validation,
      methode: 'Analyse statique',
    });
  };

  // ---- Lecture des fichiers --------------------------------------------
  const markupFiles = [];
  const styleSheets = []; // { file, code, line }
  for (const file of files) {
    const ext = extname(file).toLowerCase();
    const mode = markupMode(file);
    if (!mode && !STYLE_EXT.has(ext)) continue;
    let src;
    try {
      src = readText(file);
    } catch {
      src = null;
    }
    if (src == null) {
      notes.fichiersIgnores.push(relative(root, file));
      continue;
    }
    sources.set(file, src);
    if (STYLE_EXT.has(ext)) styleSheets.push({ file, code: src, line: 1 });
    if (mode) {
      markupFiles.push({ file, mode, src });
      if (['html', 'vue', 'svelte', 'angular'].includes(mode)) {
        for (const b of extractStyleBlocks(src)) styleSheets.push({ file, code: b.code, line: b.line });
      }
    }
  }

  // ---- Passe 1 : CSS -----------------------------------------------------
  const allRules = [];
  let reducedMotion = false;
  let firstAnimation = null;
  for (const s of styleSheets) {
    const rules = parseCss(s.code, s.line).map((r) => ({ ...r, file: s.file }));
    allRules.push(...rules);
    const at = atRules(s.code);
    if (at.reducedMotion) reducedMotion = true;
  }
  const vars = collectCustomProperties(allRules);
  const focusStyleRules = allRules.filter(
    (r) => /:focus(-visible|-within)?/.test(r.selector || '') &&
      r.declarations.some((d) => (d.prop.startsWith('outline') && !/^(none|0(px)?)$/i.test(d.value)) || (d.prop === 'box-shadow' && d.value !== 'none')),
  );

  // Paires de couleurs depuis le CSS
  const ruleBySelector = new Map();
  for (const r of allRules) {
    const key = `${r.selector}|${JSON.stringify(r.media)}`;
    if (!ruleBySelector.has(key)) ruleBySelector.set(key, []);
    ruleBySelector.get(key).push(r);
  }
  const stripState = (sel) => sel.replace(/::placeholder|:(hover|focus|focus-visible|focus-within|active|visited)\b/g, '').trim();

  const declValue = (rule, props) => {
    let found = null;
    for (const d of rule.declarations) if (props.includes(d.prop)) found = d;
    return found;
  };

  const checkContrastRule = (rule, { inheritedBg = null, inheritedColor = null, file, line, elementLabel } = {}) => {
    const sel = rule.selector || elementLabel || '';
    if (/:disabled|\[disabled\]|\[aria-disabled=["']?true/.test(sel)) return; // composants inactifs : exception 1.4.3
    const colorDecl = declValue(rule, ['color']) || inheritedColor;
    const bgDecl = declValue(rule, ['background-color', 'background']) || inheritedBg;
    if (!colorDecl || !bgDecl) return;
    const ctx = { selector: rule.selector, media: rule.media };
    const fgRes = resolveVars(colorDecl.value, vars, ctx);
    const bgRaw = bgDecl.prop === 'background' ? backgroundColorFrom(resolveVars(bgDecl.value, vars, ctx).value) : { color: resolveVars(bgDecl.value, vars, ctx).value, image: false };
    if (fgRes.unresolved || !bgRaw.color || bgRaw.image) return;
    let fg;
    let bg;
    try {
      fg = parseColor(fgRes.value);
      bg = parseColor(bgRaw.color);
    } catch {
      return;
    }
    if (bg.a < 1) return; // fond translucide : couleur réelle inconnue sans le rendu
    bg = quantize(bg);
    const fgC = quantize(fg.a < 1 ? composite(fg, bg) : fg);
    const ratio = contrastRatio(fgC, bg);
    if (ratio >= 4.5) return;
    const sizeDecl = declValue(rule, ['font-size']);
    const weightDecl = declValue(rule, ['font-weight']);
    let sizePx = null;
    if (sizeDecl) {
      const m = sizeDecl.value.match(/^([\d.]+)(px|pt)$/);
      if (m) sizePx = m[2] === 'pt' ? parseFloat(m[1]) * (96 / 72) : parseFloat(m[1]);
    }
    const weight = weightDecl ? (weightDecl.value === 'bold' ? 700 : parseInt(weightDecl.value, 10) || 400) : 400;
    const large = sizePx != null ? isLargeText(sizePx, weight, 'wcag') : null;
    if (large === true && ratio >= 3) return;
    let confiance = 'élevée';
    let note = '';
    if (large === null && ratio >= 3) {
      confiance = 'moyenne';
      note = ' Taille calculée inconnue : si le texte est de grande taille (24 px, ou 18,67 px en gras selon WCAG / 18,5 px selon RGAA), le seuil est 3:1 et serait atteint.';
    }
    if (fgRes.ambiguous || /var\(/.test(colorDecl.value + bgDecl.value)) confiance = confiance === 'élevée' ? 'moyenne' : 'faible';
    const mediaTxt = rule.media?.length ? ` dans ${rule.media.join(' et ')}` : '';
    const pairTxt = inheritedBg || inheritedColor ? ' (paire reconstituée avec la règle de base du même sélecteur)' : '';
    add('css-contrast-text', {
      categorie: C.RISQUE,
      confiance,
      file: file || rule.file,
      line: (colorDecl.line || line || rule.line),
      extrait: `${sel}${mediaTxt} { color: ${colorDecl.value}; ${bgDecl.prop}: ${bgDecl.value} }`,
      preuve: `Texte ${toHex(fgC)} sur fond ${toHex(bg)} : ratio ${formatRatio(ratio)}:1, seuil ${large ? '3' : '4,5'}:1 (WCAG 1.4.3 / RGAA 3.2).${note}${pairTxt} Couleurs déclarées, non calculées : la cascade, l’héritage ou un fond d’image peuvent modifier le rendu.`,
      correction: `Ajuster la paire de couleurs ; exemple de commande : node scripts/contrast.mjs "${toHex(fgC)}" "${toHex(bg)}" --suggest both`,
    });
  };

  for (const rule of allRules) {
    const sel = rule.selector || '';
    if (!sel || /^(from|to|\d)/.test(sel)) continue;
    const media = rule.media.join(' ');
    const inReduce = /prefers-reduced-motion\s*:\s*reduce/.test(media);

    // Contraste
    const hasColor = !!declValue(rule, ['color']);
    const hasBg = !!declValue(rule, ['background-color', 'background']);
    if (hasColor && hasBg) checkContrastRule(rule);
    else if (hasColor || hasBg) {
      const base = stripState(sel);
      if (base !== sel) {
        const baseRules = ruleBySelector.get(`${base}|${JSON.stringify(rule.media)}`) || ruleBySelector.get(`${base}|[]`) || [];
        for (const br of baseRules) {
          if (hasColor && declValue(br, ['background-color', 'background'])) {
            checkContrastRule(rule, { inheritedBg: declValue(br, ['background-color', 'background']) });
          } else if (hasBg && declValue(br, ['color'])) {
            checkContrastRule(rule, { inheritedColor: declValue(br, ['color']) });
          }
        }
      }
    }

    // Suppression de l'indicateur de focus
    for (const d of rule.declarations) {
      const removesOutline =
        (d.prop === 'outline' && /^(none|0|0px)(\s|$)/i.test(d.value)) ||
        (d.prop === 'outline-style' && d.value === 'none') ||
        (d.prop === 'outline-width' && /^0(px)?$/.test(d.value)) ||
        (d.prop === 'outline-color' && d.value === 'transparent');
      if (!removesOutline) continue;
      if (/:focus:not\(:focus-visible\)/.test(sel)) continue; // motif acceptable
      const isFocusSel = /:focus/.test(sel);
      const replacement = isFocusSel && rule.declarations.some(
        (x) => (x.prop === 'box-shadow' && x.value !== 'none') || /^border(-color|-bottom|-width)?$/.test(x.prop) || /^background(-color)?$/.test(x.prop) || (x.prop === 'text-decoration' && /underline/.test(x.value)),
      );
      if (replacement) continue;
      const appliesToFocusables = isFocusSel || /(^|[\s,>+~])(\*|a|button|input|select|textarea|summary|\[tabindex[^\]]*\])($|[\s,.:[#>+~])/.test(sel) || /^\*$/.test(sel.trim());
      if (!appliesToFocusables && !/btn|button|link|lien|input|field|control|nav|menu|tab/i.test(sel)) continue;
      const otherFocus = focusStyleRules.filter((r) => r !== rule);
      add('focus-outline-removed', {
        categorie: C.RISQUE,
        confiance: otherFocus.length ? 'moyenne' : 'élevée',
        file: rule.file,
        line: d.line,
        extrait: `${sel} { ${d.prop}: ${d.value} }`,
        preuve: `La règle supprime le contour de focus (${d.prop}: ${d.value}) sans style de remplacement dans la même règle.${otherFocus.length ? ` Le projet contient ${otherFocus.length} autre(s) règle(s) de focus visibles (ex. « ${otherFocus[0].selector} ») qui couvrent peut-être ces éléments : à confirmer dynamiquement.` : ' Aucune autre règle :focus/:focus-visible avec contour ou ombre n’a été trouvée dans le projet.'}`,
      });
    }

    // Hauteur fixe + débordement masqué
    const height = declValue(rule, ['height']);
    const overflow = rule.declarations.find((d) => /^overflow(-y)?$/.test(d.prop) && /hidden|clip/.test(d.value));
    if (height && overflow && /^[\d.]+(px|rem|em)$/.test(height.value) && !/img|icon|avatar|logo|video|svg|thumb|spinner|dot|bar|divider|separator/i.test(sel)) {
      add('text-fixed-height-overflow', {
        categorie: C.RISQUE,
        confiance: 'moyenne',
        file: rule.file,
        line: height.line,
        extrait: `${sel} { height: ${height.value}; ${overflow.prop}: ${overflow.value} }`,
        preuve: 'Hauteur fixe et débordement masqué sur le même sélecteur : un texte agrandi à 200 % ou avec un espacement augmenté risque d’être coupé (à confirmer si le sélecteur contient du texte).',
      });
    }
    for (const d of rule.declarations.filter((x) => x.prop === 'min-width' || x.prop === 'width')) {
      const m = d.value.match(/^(\d+(?:\.\d+)?)px$/);
      const inMinWidthQuery = rule.media.some((q) => /min-width/.test(q));
      if (m && parseFloat(m[1]) > 320 && !inMinWidthQuery && !/img|video|iframe|canvas|svg|table|map|chart|graph|modal|dialog/i.test(sel)) {
        add('css-fixed-width', {
          categorie: C.RISQUE,
          confiance: d.prop === 'min-width' ? 'élevée' : 'moyenne',
          file: rule.file,
          line: d.line,
          extrait: `${sel} { ${d.prop}: ${d.value} }`,
          preuve: `${d.prop}: ${d.value} hors requête média min-width : le conteneur ne peut pas se réduire à 320 px CSS${d.prop === 'width' ? ' (sauf si max-width ou une requête média le contraint ailleurs)' : ''}.`,
        });
      }
    }
    const textOverflow = declValue(rule, ['text-overflow']);
    if (textOverflow && /ellipsis/.test(textOverflow.value)) {
      add('text-truncation', {
        categorie: C.MANUEL,
        confiance: 'moyenne',
        file: rule.file,
        line: textOverflow.line,
        extrait: `${sel} { text-overflow: ${textOverflow.value} }`,
        preuve: 'Le texte peut être tronqué ; vérifier que l’information complète reste accessible (pas une non-conformité en soi).',
      });
    }

    // Tailles de police
    for (const d of rule.declarations.filter((x) => x.prop === 'font-size' || x.prop === 'font')) {
      const v = d.value;
      if (/\b[\d.]+(vw|vh|vmin|vmax)\b/.test(v) && !/(clamp|calc|min|max)\([^)]*(rem|em|px)/.test(v)) {
        add('font-size-viewport-units', {
          categorie: C.RISQUE,
          confiance: 'élevée',
          file: rule.file,
          line: d.line,
          extrait: `${sel} { ${d.prop}: ${v} }`,
          preuve: 'Une taille exprimée uniquement en unités de viewport ne grandit pas avec le zoom du navigateur (technique d’échec WCAG F94).',
        });
      }
      const m = d.prop === 'font-size' && v.match(/^([\d.]+)(px|rem)$/);
      if (m) {
        const px = m[2] === 'rem' ? parseFloat(m[1]) * 16 : parseFloat(m[1]);
        if (px < 12) {
          add('small-text-readability', {
            categorie: C.BONNE_PRATIQUE,
            confiance: m[2] === 'rem' ? 'moyenne' : 'élevée',
            gravite: 'Information',
            file: rule.file,
            line: d.line,
            extrait: `${sel} { font-size: ${v} }`,
            preuve: `Taille ${v}${m[2] === 'rem' ? ' (environ ' + px + ' px avec la taille racine par défaut de 16 px)' : ''}. Aucune taille minimale n’est imposée par WCAG 2.2 ni RGAA 4.1.2 : remarque de lisibilité uniquement.`,
          });
        }
      }
    }

    // Contenu au survol uniquement
    if (/:hover/.test(sel) && rule.declarations.some((d) => (d.prop === 'display' && d.value !== 'none') || (d.prop === 'visibility' && d.value === 'visible') || (d.prop === 'opacity' && parseFloat(d.value) > 0.5))) {
      const base = sel.split(',').map((s) => s.split(':hover')[0].trim()).filter(Boolean);
      const keyboardEquivalent = /:focus/.test(sel) || base.some((b) => allRules.some((r) => r.selector && (r.selector.includes(`${b}:focus`) || r.selector.includes(`${b}:focus-within`) || r.selector.includes(`${b}:focus-visible`))));
      if (!keyboardEquivalent) {
        add('hover-only-content', {
          categorie: C.RISQUE,
          confiance: 'moyenne',
          file: rule.file,
          line: rule.line,
          extrait: sel,
          preuve: `Un contenu est affiché au survol (« ${sel} ») et aucune règle :focus / :focus-within équivalente n’a été trouvée pour « ${base.join(', ')} ». Le script peut gérer le clavier : à confirmer.`,
        });
      }
    }

    // Animations
    for (const d of rule.declarations.filter((x) => x.prop === 'animation' || x.prop === 'animation-iteration-count' || x.prop === 'animation-name')) {
      if (!firstAnimation && d.prop !== 'animation-iteration-count') firstAnimation = { file: rule.file, line: d.line, sel };
      if (/\binfinite\b/.test(d.value) && !inReduce) {
        add('animation-infinite', {
          categorie: C.RISQUE,
          confiance: 'moyenne',
          file: rule.file,
          line: d.line,
          extrait: `${sel} { ${d.prop}: ${d.value} }`,
          preuve: 'Animation infinie : si elle démarre automatiquement, dure plus de 5 secondes et est présentée en parallèle d’autres contenus, un moyen de pause, arrêt ou masquage est requis (2.2.2), sauf si elle est essentielle. Vérifier aussi si l’animation est purement décorative (indicateur de chargement, par exemple).',
        });
      }
    }
  }
  if (firstAnimation && !reducedMotion) {
    add('reduced-motion-missing', {
      categorie: C.BONNE_PRATIQUE,
      confiance: 'élevée',
      file: firstAnimation.file,
      line: firstAnimation.line,
      extrait: firstAnimation.sel,
      preuve: 'Le projet déclare des animations mais aucune requête @media (prefers-reduced-motion). Le critère 2.3.3 est de niveau AAA : recommandation, pas une exigence AA.',
    });
  }

  // ---- Passe 2 : balisage ----------------------------------------------
  const parsed = [];
  const globalLabelFor = new Set();
  const globalIds = new Set();
  for (const mf of markupFiles) {
    const roots = extractTemplates(mf.src, mf.mode).map((t) => parseMarkup(t.code, mf.mode === 'vue' ? 'html' : mf.mode, t.line));
    for (const r of roots) {
      for (const n of r.descendants()) {
        if (n.name === 'label' && n.value('for')) globalLabelFor.add(n.value('for'));
        if (n.value('id')) globalIds.add(n.value('id'));
      }
    }
    parsed.push({ ...mf, roots });
  }

  for (const { file, mode, src, roots } of parsed) {
    const ids = new Set();
    const labelFor = new Set();
    for (const r of roots) for (const n of r.descendants()) {
      if (n.value('id')) ids.add(n.value('id'));
      if (n.name === 'label' && n.value('for')) labelFor.add(n.value('for'));
    }
    const isFullDoc = mode === 'html' && roots.some((r) => [...r.descendants()].some((n) => n.name === 'html'));
    const partial = !isFullDoc; // composant ou gabarit partiel : le contexte de rendu est inconnu
    let altReview = 0;
    let altReviewLine = null;

    for (const r of roots) {
      const all = [...r.descendants()];
      if (!all.length) continue;

      // --- Document complet ---------------------------------------------
      const htmlEl = all.find((n) => n.name === 'html');
      if (isFullDoc && htmlEl) {
        if (!r.doctype) {
          add('doctype-missing', { categorie: C.ECHEC, confiance: 'élevée', file, line: htmlEl.line, preuve: 'Aucune déclaration <!DOCTYPE> avant l’élément <html>.' });
        }
        const lang = htmlEl.attr('lang');
        if (!lang && !htmlEl.has('xml:lang')) {
          add('html-lang-missing', { categorie: htmlEl.spread ? C.RISQUE : C.ECHEC, confiance: 'élevée', file, line: htmlEl.line, preuve: 'L’élément <html> ne possède pas d’attribut lang.' });
        } else if (lang && !lang.dynamic && !/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{1,8})*$/.test(lang.value.trim())) {
          add('html-lang-invalid', { categorie: C.ECHEC, confiance: 'élevée', file, line: htmlEl.line, preuve: `Valeur lang="${lang.value}" non conforme à la syntaxe BCP 47.` });
        }
        const head = all.find((n) => n.name === 'head');
        const title = all.find((n) => n.name === 'title');
        if (head && (!title || !title.textContent().text)) {
          add('page-title-missing', { categorie: C.ECHEC, confiance: 'élevée', file, line: (title || head).line, preuve: title ? 'Élément <title> vide.' : 'Aucun élément <title> dans <head>.' });
        }
        const body = all.find((n) => n.name === 'body');
        const bodyEls = body ? [...body.descendants()].filter((n) => n.name !== 'script' && n.name !== 'noscript') : [];
        const spaShell = body && bodyEls.length <= 3 && all.some((n) => n.name === 'script');
        if (spaShell) {
          // Structure rendue par JavaScript : analyse dynamique requise
        } else if (body) {
          const hasMain = all.some((n) => n.name === 'main' || n.value('role') === 'main');
          if (!hasMain) add('landmark-main-missing', { categorie: C.RISQUE, confiance: 'moyenne', file, line: body.line, preuve: 'Ni élément <main> ni role="main" dans le document statique (le contenu peut être injecté par script).' });
          const links = bodyEls.filter((n) => n.name === 'a' && n.has('href')).slice(0, 3);
          if (!links.some((a) => (a.value('href') || '').startsWith('#'))) {
            add('skip-link-missing', { categorie: C.RISQUE, confiance: 'moyenne', file, line: body.line, preuve: 'Aucun lien interne (href="#...") parmi les trois premiers liens du document. RGAA 12.7 admet des cas particuliers ; WCAG 2.4.1 peut être satisfait par d’autres techniques (régions, titres).' });
          }
          const headings = bodyEls.filter((n) => /^h[1-6]$/.test(n.name) || n.value('role') === 'heading').map((n) => ({ n, level: /^h[1-6]$/.test(n.name) ? Number(n.name[1]) : Number(n.value('aria-level') || 2) }));
          const problems = [];
          if (headings.length && !headings.some((h) => h.level === 1)) problems.push('aucun titre de niveau 1');
          for (let k = 1; k < headings.length; k++) {
            if (headings[k].level > headings[k - 1].level + 1) problems.push(`saut de h${headings[k - 1].level} à h${headings[k].level} (ligne ${headings[k].n.line})`);
          }
          if (!headings.length) problems.push('aucun titre');
          if (problems.length) {
            add('heading-structure', { categorie: C.MANUEL, confiance: 'moyenne', file, line: (headings[0]?.n || body).line, preuve: `Structure de titres : ${problems.join(' ; ')}. La pertinence de la hiérarchie relève d’une évaluation humaine (RGAA 9.1).` });
          }
        }
        for (const meta of all.filter((n) => n.name === 'meta')) {
          const name = (meta.value('name') || '').toLowerCase();
          const content = meta.value('content') || '';
          if (name === 'viewport') {
            const ms = content.match(/maximum-scale\s*=\s*([\d.]+)/i);
            if (/user-scalable\s*=\s*(no|0)/i.test(content) || (ms && parseFloat(ms[1]) < 2)) {
              add('viewport-zoom-disabled', { categorie: C.RISQUE, confiance: 'élevée', file, line: meta.line, preuve: `meta viewport : « ${content} ». Certains navigateurs ignorent cette restriction (Safari iOS), d’autres l’appliquent.` });
            }
          }
          if ((meta.value('http-equiv') || '').toLowerCase() === 'refresh') {
            const delay = parseFloat(content);
            if (delay > 0) add('meta-refresh', { categorie: C.ECHEC, confiance: 'élevée', file, line: meta.line, preuve: `meta refresh avec un délai de ${delay} s (« ${content} ») : ni redirection immédiate ni contrôle utilisateur possible.` });
          }
        }
      }

      // --- Éléments --------------------------------------------------------
      for (const n of all) {
        if (n.isComponent && n.tag !== 'Image') continue;
        const name = n.name;
        const role = (n.value('role') || '').trim().toLowerCase();
        const hiddenFromAT = n.value('aria-hidden') === 'true' || n.ancestors().some((a) => a.value('aria-hidden') === 'true');
        const certainCat = (strong) => (n.spread ? C.RISQUE : strong);

        // Images
        if (name === 'img' || n.tag === 'Image' || (name === 'input' && n.value('type') === 'image') || (name === 'area' && n.has('href'))) {
          if (n.spread) {
            notes.nonConcluants++;
          } else {
            const hasAlt = n.has('alt') || n.has('aria-label') || n.has('aria-labelledby') || n.has('title');
            const decorative = ['presentation', 'none'].includes(role) || hiddenFromAT;
            if (!hasAlt && !decorative) {
              add('img-alt-missing', {
                categorie: C.ECHEC,
                confiance: 'élevée',
                file,
                line: n.line,
                preuve: `<${n.tag}> sans attribut alt, aria-label, aria-labelledby ni title, et non masquée (aria-hidden / role="presentation"). Qu’elle soit porteuse d’information (RGAA 1.1) ou décorative (RGAA 1.2.1 exige alt=""), le test échoue.`,
              });
            } else if (n.has('alt') && !n.attr('alt').dynamic) {
              const alt = n.attr('alt').value.trim();
              if (/\.(png|jpe?g|gif|svg|webp|avif|bmp)$/i.test(alt) || /^(image|img|photo|picture|logo|ic[oô]ne?|icon|graphic|untitled|sans titre|dsc_?\d+|img_?\d+|image\s*\d*)$/i.test(alt)) {
                add('img-alt-suspicious', { categorie: C.RISQUE, confiance: 'élevée', file, line: n.line, preuve: `alt="${alt}" ressemble à un nom de fichier ou à un mot générique.` });
              } else if (alt) {
                altReview++;
                altReviewLine ??= n.line;
              }
            }
          }
        }

        // SVG hors bouton/lien
        if (name === 'svg' && !hiddenFromAT && !n.spread) {
          const labelled = n.has('aria-label') || n.has('aria-labelledby') || [...n.children].some((c) => c.name === 'title') || ['presentation', 'none'].includes(role);
          const inControl = n.ancestors().some((a) => ['a', 'button'].includes(a.name) || ['button', 'link'].includes(a.value('role')));
          if (!labelled && !inControl) {
            add('svg-informative-unnamed', { categorie: C.MANUEL, confiance: 'moyenne', file, line: n.line, preuve: 'SVG sans aria-hidden="true" ni alternative (aria-label, <title>). Déterminer s’il est décoratif ou porteur d’information.' });
          } else if (labelled && !['img', 'presentation', 'none', 'graphics-document'].includes(role) && !inControl && n.has('aria-label')) {
            // aria-label sans role="img" : restitution inégale selon les navigateurs
            add('svg-informative-unnamed', { titre: 'SVG avec alternative mais sans role="img"', categorie: C.RISQUE, confiance: 'moyenne', file, line: n.line, preuve: 'RGAA 1.1.5 attend role="img" sur un SVG porteur d’information.' });
          }
        }

        // Cadres
        if ((name === 'iframe' || name === 'frame') && !n.spread && !hiddenFromAT) {
          const t = n.attr('title');
          if (!t || (!t.dynamic && !t.value.trim())) {
            add('iframe-title-missing', { categorie: C.ECHEC, confiance: 'élevée', file, line: n.line, preuve: `<${name}> sans attribut title${t ? ' (title vide)' : ''}.` });
          }
        }

        // Nom accessible des liens et boutons
        const isLink = (name === 'a' && n.has('href')) || role === 'link';
        const isButton = (name === 'button' && !role) || role === 'button' || (name === 'input' && n.value('type') === 'button');
        if ((isLink || isButton) && !hiddenFromAT) {
          const status = accessibleNameStatus(n);
          if (status.state === 'missing') {
            add(isLink ? 'link-name-missing' : 'button-name-missing', {
              categorie: certainCat(partial && status.componentChildren ? C.RISQUE : C.ECHEC),
              confiance: 'élevée',
              file,
              line: n.line,
              preuve: `${isLink ? 'Lien' : 'Bouton'} sans contenu textuel, sans alternative d’image et sans aria-label, aria-labelledby ni title.${status.detail ? ' ' + status.detail : ''}`,
            });
          } else if (status.state === 'named' && isLink && status.text && GENERIC_LINK_TEXT.test(status.text) && !n.has('aria-label') && !n.has('title')) {
            add('link-text-generic', { categorie: C.MANUEL, confiance: 'moyenne', file, line: n.line, preuve: `Intitulé « ${status.text} » : vérifier que le contexte du lien permet d’en comprendre la destination (RGAA 6.1).` });
          }
          if (isLink && n.value('target') === '_blank') {
            const txt = `${status.text || ''} ${n.value('title') || ''} ${n.value('aria-label') || ''}`;
            if (!/nouvel(le)? (fenêtre|onglet)|new (window|tab)/i.test(txt) && !status.dynamic) {
              add('new-window-unannounced', { categorie: C.BONNE_PRATIQUE, confiance: 'moyenne', file, line: n.line, preuve: 'target="_blank" sans mention de l’ouverture d’une nouvelle fenêtre dans l’intitulé ou le title.' });
            }
          }
          if (isLink) {
            const href = n.value('href') || '';
            const ext = (href.split(/[?#]/)[0].match(/\.[a-z0-9]+$/i) || [''])[0].toLowerCase();
            if (DOC_EXT.has(ext)) {
              add('downloadable-document', { categorie: C.MANUEL, confiance: 'élevée', file, line: n.line, preuve: `Lien vers un document ${ext} (${href}). Contrôler la version accessible du document et l’indication du format et du poids dans le lien.` });
            }
          }
        }

        // Gestionnaires de clic sur éléments non interactifs
        const hasClick = n.has('onclick') || n.has('onmousedown') || n.has('onmouseup');
        const nonInteractive = ['div', 'span', 'li', 'p', 'td', 'tr', 'section', 'article', 'img', 'i', 'b', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'header', 'footer'].includes(name);
        if (hasClick && nonInteractive && !role && !n.has('tabindex') && !n.spread) {
          add('click-non-interactive', { categorie: C.RISQUE, confiance: 'élevée', file, line: n.line, preuve: `<${name}> possède un gestionnaire de clic (${[...n.attrs.values()].find((a) => /^(onclick|@click|v-on:click|\(click\)|on:click|onClick)$/i.test(a.raw))?.raw || 'onclick'}) mais ni rôle, ni tabindex : il n’est pas atteignable au clavier, sauf alternative ailleurs dans la page.` });
        }

        // Rôles ARIA
        if (n.has('role') && !n.attr('role').dynamic) {
          const tokens = role.split(/\s+/).filter(Boolean);
          const valid = tokens.find((t) => ARIA_ROLES.has(t) || DPUB_ROLE.test(t));
          if (!valid || ABSTRACT_ROLES.has(tokens[0])) {
            add('aria-role-invalid', { categorie: C.RISQUE, confiance: 'élevée', file, line: n.line, preuve: `role="${role}" ${ABSTRACT_ROLES.has(tokens[0]) ? 'est un rôle abstrait (interdit dans le contenu)' : 'n’existe pas dans WAI-ARIA 1.2'}.` });
          }
          const r0 = valid || tokens[0];
          if (INTERACTIVE_ROLES.has(r0) && !ROLES_MANAGED_BY_CONTAINER.has(r0) && !NATIVE_FOCUSABLE(n) && !n.has('tabindex') && !n.spread && !hiddenFromAT && !n.has('aria-disabled')) {
            add('role-interactive-not-focusable', { categorie: C.RISQUE, confiance: 'élevée', file, line: n.line, preuve: `role="${r0}" sur <${name}> sans tabindex : l’élément n’est pas focalisable au clavier (sauf ajout du tabindex par script).` });
          } else if (INTERACTIVE_ROLES.has(r0) && hasClick && !n.has('onkeydown') && !n.has('onkeyup') && !n.has('onkeypress') && !NATIVE_FOCUSABLE(n) && ['button', 'link', 'checkbox', 'switch', 'menuitem', 'tab', 'option'].includes(r0)) {
            add('role-interactive-no-key-handler', { categorie: C.RISQUE, confiance: 'moyenne', file, line: n.line, preuve: `role="${r0}" avec gestionnaire de clic mais sans gestionnaire clavier sur l’élément (un gestionnaire global peut exister).` });
          }
        }

        // tabindex positif
        const tab = n.value('tabindex');
        if (tab != null && /^\d+$/.test(tab) && Number(tab) > 0) {
          add('tabindex-positive', { categorie: C.RISQUE, confiance: 'élevée', file, line: n.line, preuve: `tabindex="${tab}" place l’élément avant tous les éléments au tabindex nul ou implicite.` });
        }

        // aria-hidden sur élément focalisable
        if (n.value('aria-hidden') === 'true' && !n.has('inert')) {
          const focusables = [n, ...n.descendants()].filter((x) => (NATIVE_FOCUSABLE(x) || (x.value('tabindex') != null && Number(x.value('tabindex')) >= 0)) && x.value('tabindex') !== '-1');
          if (focusables.length) {
            add('aria-hidden-focusable', { categorie: C.RISQUE, confiance: 'élevée', file, line: n.line, preuve: `aria-hidden="true" sur un élément ${focusables[0] === n ? 'focalisable' : `contenant ${focusables.length} élément(s) focalisable(s) (ex. <${focusables[0].name}> ligne ${focusables[0].line})`}. Si l’élément est aussi masqué par display:none ou visibility:hidden, le constat ne s’applique pas.` });
          }
        }

        // Références d'identifiants (documents complets uniquement)
        if (isFullDoc) {
          for (const attr of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
            const a = n.attr(attr);
            if (a && !a.dynamic) {
              const missing = a.value.split(/\s+/).filter((id) => id && !ids.has(id));
              if (missing.length && !(attr === 'aria-controls' && n.value('aria-expanded') === 'false')) {
                add('aria-reference-broken', { categorie: C.ECHEC, confiance: 'élevée', file, line: n.line, preuve: `${attr} référence un identifiant absent du document : ${missing.join(', ')}.` });
              }
            }
          }
          if (name === 'label' && n.value('for') && !ids.has(n.value('for'))) {
            add('aria-reference-broken', { categorie: C.ECHEC, confiance: 'élevée', file, line: n.line, preuve: `<label for="${n.value('for')}"> ne correspond à aucun id du document.` });
          }
        }

        // Champs de formulaire
        const inputType = (n.value('type') || 'text').toLowerCase();
        const isField = (name === 'input' && !['hidden', 'submit', 'reset', 'button', 'image'].includes(inputType)) || name === 'select' || name === 'textarea' || ['textbox', 'combobox', 'searchbox', 'listbox', 'spinbutton', 'slider'].includes(role);
        if (isField && !hiddenFromAT) {
          if (n.spread || (n.attr('id')?.dynamic && !n.has('aria-label') && !n.has('aria-labelledby'))) {
            notes.nonConcluants++;
          } else {
            const id = n.value('id');
            const labelled =
              n.has('aria-label') || n.has('aria-labelledby') || (n.has('title') && (n.attr('title').dynamic || n.attr('title').value.trim())) ||
              n.ancestors().some((a) => a.name === 'label') ||
              (id && (labelFor.has(id) || (!isFullDoc && globalLabelFor.has(id))));
            if (!labelled) {
              const ph = n.attr('placeholder');
              const inLabelComponent = n.ancestors().some((a) => a.isComponent);
              const cat = isFullDoc ? C.ECHEC : C.RISQUE;
              if (ph) {
                add('form-placeholder-only', { categorie: cat, confiance: inLabelComponent ? 'moyenne' : 'élevée', file, line: n.line, preuve: `<${name}${id ? ` id="${id}"` : ''}> n’a pour indication que placeholder="${ph.dynamic ? '{…}' : ph.value}". Aucune des conditions du test RGAA 11.1.1 n’est remplie.${partial ? ' Composant partiel : une étiquette peut être fournie par le composant parent.' : ''}` });
              } else {
                add('form-label-missing', { categorie: cat, confiance: inLabelComponent ? 'moyenne' : 'élevée', file, line: n.line, preuve: `<${name}${id ? ` id="${id}"` : ''}> sans <label> associé, aria-label, aria-labelledby ni title.${partial ? ' Composant partiel : une étiquette peut être fournie par le composant parent.' : ''}` });
              }
            }
            // autocomplete
            if (name === 'input' && ['text', 'email', 'tel', 'url'].includes(inputType)) {
              const ac = n.attr('autocomplete');
              const hint = `${n.value('name') || ''} ${id || ''} ${inputType}`;
              if (ac && !ac.dynamic && !validAutocomplete(ac.value)) {
                add('form-autocomplete-invalid', { categorie: C.RISQUE, confiance: 'élevée', file, line: n.line, preuve: `autocomplete="${ac.value}" ne fait pas partie des valeurs définies par HTML.` });
              } else if (!ac && (inputType === 'email' || inputType === 'tel' || PERSONAL_FIELD_HINT.test(hint)) && !/search|recherche|query|\bq\b/i.test(hint)) {
                add('form-autocomplete-missing', { categorie: C.RISQUE, confiance: 'moyenne', file, line: n.line, preuve: `Champ « ${hint.trim()} » probablement relatif à l’utilisateur, sans attribut autocomplete. Applicable seulement si la donnée concerne l’utilisateur lui-même.` });
              }
            }
          }
        }
        if (name === 'form') {
          add('form-error-association', { categorie: C.MANUEL, confiance: 'élevée', file, line: n.line, preuve: 'Formulaire détecté : contrôler la présence, l’association (aria-describedby) et la restitution des messages d’erreur, ainsi que les suggestions de correction et la prévention des erreurs (RGAA 11.10 à 11.12).' });
        }

        // Balises de mouvement
        if (name === 'marquee' || name === 'blink') {
          add('presentational-markup', { categorie: C.ECHEC, confiance: 'élevée', file, line: n.line, preuve: `<${name}> produit un contenu en mouvement ou clignotant sans mécanisme de contrôle.` });
        }

        // Médias
        if (name === 'video' || name === 'audio') {
          const autoplay = n.has('autoplay') && n.value('autoplay') !== 'false';
          const muted = n.has('muted') && n.value('muted') !== 'false';
          if (autoplay && !muted) add('media-autoplay-audio', { categorie: C.RISQUE, confiance: 'élevée', file, line: n.line, preuve: `<${name} autoplay> sans muted : son déclenché automatiquement (constat si la piste dure plus de 3 secondes et contient du son).` });
          if (autoplay && name === 'video' && !n.has('controls')) add('media-autoplay-motion', { categorie: C.RISQUE, confiance: 'élevée', file, line: n.line, preuve: '<video autoplay> sans attribut controls : vérifier la présence d’un bouton pause accessible et la durée (plus de 5 secondes).' });
          const tracks = [...n.children].filter((c) => c.name === 'track');
          add('media-captions-check', { categorie: C.MANUEL, confiance: 'élevée', file, line: n.line, preuve: `Média <${name}>${tracks.length ? ` avec ${tracks.length} piste(s) <track>` : ' sans élément <track>'} : vérifier sous-titres, transcription et audiodescription selon la nature du média.` });
        }

        // Tableaux
        if (name === 'table') {
          const desc = [...n.descendants()];
          const hasTh = desc.some((d) => d.name === 'th' || ['columnheader', 'rowheader'].includes(d.value('role')));
          const layout = ['presentation', 'none'].includes(role);
          if (layout && (hasTh || desc.some((d) => ['caption', 'thead', 'tfoot'].includes(d.name)))) {
            add('table-structure', { titre: 'Tableau de mise en forme utilisant des éléments de tableau de données', categorie: C.ECHEC, confiance: 'élevée', file, line: n.line, preuve: 'role="presentation" avec <th>, <caption>, <thead> ou <tfoot> (RGAA 5.8).' });
          } else if (!layout && !hasTh) {
            const firstRow = desc.find((d) => d.name === 'tr');
            const cells = firstRow ? [...firstRow.children].filter((c) => c.name === 'td') : [];
            const fakeHeaders = cells.length > 1 && cells.every((c) => /head|titre|header|entete|en-tete/i.test(c.value('class') || '') || (c.children.length === 1 && ['b', 'strong'].includes(c.children[0].name)));
            add('table-structure', {
              categorie: fakeHeaders ? C.RISQUE : C.MANUEL,
              confiance: fakeHeaders ? 'élevée' : 'moyenne',
              file,
              line: n.line,
              preuve: fakeHeaders ? 'La première ligne est composée de <td> mis en forme comme des en-têtes (gras ou classe « header ») : en-têtes non déclarés pour un tableau de données probable.' : 'Tableau sans <th> : déterminer s’il s’agit d’un tableau de données (en-têtes requis) ou de mise en forme (role="presentation" requis).',
            });
          }
        }

        // Fenêtres de dialogue
        if (name === 'dialog' || role === 'dialog' || role === 'alertdialog') {
          const lab = n.attr('aria-label') || n.attr('aria-labelledby');
          if (!lab && !n.spread) {
            add('dialog-unlabelled', { categorie: isFullDoc ? C.ECHEC : C.RISQUE, confiance: 'élevée', file, line: n.line, preuve: `${name === 'dialog' ? '<dialog>' : `role="${role}"`} sans aria-label ni aria-labelledby.` });
          }
          const modalHint = name === 'dialog' ? 'élément natif <dialog> (focus géré nativement si ouvert avec showModal())' : `role="${role}"${n.value('aria-modal') === 'true' ? ' avec aria-modal="true"' : ' sans aria-modal'}`;
          add('dialog-focus-management', { categorie: C.MANUEL, confiance: 'élevée', file, line: n.line, preuve: `Fenêtre de dialogue (${modalHint}) : focus à l’ouverture, maintien dans la fenêtre modale, fermeture par Échap et retour du focus à vérifier dynamiquement.` });
        }
      }

      // Styles en ligne
      for (const n of all) {
        const st = n.attr('style');
        if (!st || st.dynamic) continue;
        const declarations = st.value.split(';').map((d) => d.trim()).filter(Boolean).map((d) => {
          const i = d.indexOf(':');
          return { prop: d.slice(0, i).trim().toLowerCase(), value: d.slice(i + 1).trim().replace(/!important$/, '').trim(), line: n.line };
        });
        checkContrastRule({ selector: `<${n.tag}> (attribut style)`, media: [], declarations, file, line: n.line }, { file, line: n.line });
      }
    }

    if (altReview) {
      add('img-alt-review', { categorie: C.MANUEL, confiance: 'élevée', file, line: altReviewLine, preuve: `${altReview} image(s) avec une alternative non vide dans ce fichier : la présence d’un alt ne garantit pas sa pertinence (RGAA 1.3) ni le bon traitement des images décoratives (RGAA 1.2).` });
    }

    // Scripts : raccourcis clavier, blur, style de focus
    const lines = src.split('\n');
    lines.forEach((l, idx) => {
      const m = l.match(/\b(?:e|ev|evt|event|key|k)\.key\s*===?\s*['"]([a-zA-Z0-9?/!.,;:\-+*#@$%&])['"]/) || l.match(/case\s+['"]([a-zA-Z0-9?/])['"]\s*:/);
      if (m) {
        const ctx = lines.slice(Math.max(0, idx - 6), idx + 6).join('\n');
        if (/keydown|keyup|keypress|hotkey|shortcut|raccourci/i.test(ctx) && !/ctrlKey|metaKey|altKey|modifier/i.test(ctx)) {
          add('keyboard-shortcut-single-key', { categorie: C.RISQUE, confiance: 'moyenne', file, line: idx + 1, preuve: `Gestion de la touche « ${m[1]} » sans touche de modification détectée à proximité : vérifier s’il s’agit d’un raccourci global (2.1.4) et s’il est désactivable, reconfigurable ou limité au focus du composant.` });
        }
      }
      if (/onfocus\s*=\s*["'{][^"'}]*\.?blur\(\)/i.test(l) || (/addEventListener\(\s*['"]focus['"]/.test(l) && /blur\(\)/.test(lines.slice(idx, idx + 4).join('\n')))) {
        add('focus-removed-by-script', { categorie: C.RISQUE, confiance: 'élevée', file, line: idx + 1, preuve: 'Appel à blur() à la prise de focus.' });
      }
      if (/\.style\.outline\s*=\s*['"](none|0)['"]/.test(l)) {
        add('focus-outline-removed', { categorie: C.RISQUE, confiance: 'moyenne', file, line: idx + 1, preuve: 'Le script supprime le contour de focus via style.outline.' });
      }
    });
  }

  // ---- Tri, identifiants, résumé ----------------------------------------
  findings.sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.categorie) - CATEGORY_ORDER.indexOf(b.categorie) ||
      GRAVITY_ORDER.indexOf(a.gravite) - GRAVITY_ORDER.indexOf(b.gravite) ||
      a.fichier.localeCompare(b.fichier) ||
      a.ligne - b.ligne,
  );
  findings.forEach((f, i) => (f.id = `A11Y-${String(i + 1).padStart(3, '0')}`));
  const parCategorie = {};
  const parRegle = {};
  for (const f of findings) {
    parCategorie[f.categorie] = (parCategorie[f.categorie] || 0) + 1;
    parRegle[f.regle] = (parRegle[f.regle] || 0) + 1;
  }
  return {
    meta: {
      outil: 'accessibility-audit / static-scan',
      version: TOOL_VERSION,
      date: new Date().toISOString(),
      cible: root,
      methode: 'Analyse statique heuristique du code source (aucune exécution, aucune modification)',
      referentiels: { wcag: 'WCAG 2.2', rgaa: 'RGAA 4.1.2' },
      fichiersAnalyses: sources.size,
      feuillesDeStyle: styleSheets.length,
      fichiersIgnores: notes.fichiersIgnores,
      elementsNonConcluants: notes.nonConcluants,
      avertissement:
        'Résultats d’analyse statique : ils ne constituent ni un audit de conformité ni une preuve de conformité. Les « Risque potentiel » doivent être confirmés par l’analyse dynamique ou un test manuel ; une absence de constat ne signifie pas une absence de problème.',
    },
    inventaire: inventory(root, files),
    // Règles exécutées : un critère couvert sans constat n'est PAS conforme, il est seulement « contrôlé partiellement ».
    couverture: STATIC_RULES,
    resume: { total: findings.length, parCategorie, parRegle },
    constats: findings,
  };
}

/** Nom accessible approximatif d'un lien ou bouton. */
function accessibleNameStatus(n) {
  if (n.spread) return { state: 'unknown' };
  for (const a of ['aria-label', 'aria-labelledby']) {
    const at = n.attr(a);
    if (at && (at.dynamic || at.value.trim())) return { state: 'named', dynamic: at.dynamic };
  }
  if (n.name === 'input') {
    const v = n.attr('value');
    if (v && (v.dynamic || v.value.trim())) return { state: 'named', text: v.value };
    return n.has('title') ? { state: 'named' } : { state: 'missing' };
  }
  const { text, dynamic } = n.textContent();
  if (text) return { state: 'named', text, dynamic };
  if (dynamic) return { state: 'unknown', dynamic: true };
  let componentChildren = false;
  let found = null;
  // Parcours des descendants en ignorant les sous-arbres aria-hidden="true"
  const visit = (node) => {
    for (const d of node.children) {
      if (found) return;
      if (d.value('aria-hidden') === 'true') continue;
      if (d.isComponent) componentChildren = true;
      if (d.spread) found = { state: 'unknown' };
      else if ((d.name === 'img' || d.tag === 'Image') && (d.has('aria-label') || (d.attr('alt') && (d.attr('alt').dynamic || d.attr('alt').value.trim())))) found = { state: 'named' };
      else if (d.name === 'svg' && (d.has('aria-label') || d.has('aria-labelledby') || [...d.children].some((c) => c.name === 'title' && c.textContent().text))) found = { state: 'named' };
      else if (d.has('aria-label') && d.value('role') === 'img') found = { state: 'named' };
      else visit(d);
    }
  };
  visit(n);
  if (found) return found;
  const t = n.attr('title');
  if (t && (t.dynamic || t.value.trim())) return { state: 'named', detail: 'Nom fourni uniquement par title (restitution variable selon les technologies d’assistance).' };
  if (componentChildren) return { state: 'unknown', componentChildren: true };
  return { state: 'missing', detail: n.children.some((c) => c.name === 'svg' || c.name === 'i' || c.name === 'img') ? 'Le contenu est une icône sans alternative.' : '' };
}

// ---- Rendu Markdown --------------------------------------------------------

export function toMarkdown(result) {
  const { meta, inventaire: inv, resume, constats } = result;
  const out = [];
  out.push(`# Résultats d’analyse statique d’accessibilité`);
  out.push('');
  out.push(`> ${meta.avertissement}`);
  out.push('');
  out.push(`- Cible : \`${meta.cible}\``);
  out.push(`- Date : ${meta.date}`);
  out.push(`- Méthode : ${meta.methode}`);
  out.push(`- Référentiels de correspondance : ${meta.referentiels.wcag}, ${meta.referentiels.rgaa}`);
  out.push(`- Fichiers analysés : ${meta.fichiersAnalyses} (dont ${meta.feuillesDeStyle} feuilles ou blocs de style)`);
  out.push(`- Éléments non concluants (props étalées, identifiants dynamiques) : ${meta.elementsNonConcluants}`);
  if (meta.fichiersIgnores.length) out.push(`- Fichiers ignorés (taille ou minification) : ${meta.fichiersIgnores.length}`);
  out.push('');
  out.push('## Inventaire');
  out.push('');
  out.push(`- Technologies : ${inv.technologies.join(', ') || 'non détectées (pas de package.json ?)'}`);
  out.push(`- Bibliothèques d’interface : ${inv.frameworksUi.join(', ') || 'aucune détectée'}`);
  out.push(`- Outils d’accessibilité déjà présents : ${inv.outilsA11yExistants.join(', ') || 'aucun détecté'}`);
  out.push(`- Pages ou routes détectées : ${inv.pagesOuRoutes.length}${inv.pagesOuRoutes.length ? ` (${inv.pagesOuRoutes.slice(0, 15).join(', ')}${inv.pagesOuRoutes.length > 15 ? ', ...' : ''})` : ''}`);
  out.push(`- Composants réutilisables : ${inv.composantsReutilisables.length}`);
  out.push(`- Jetons ou configuration de design system : ${inv.designSystem.join(', ') || 'aucun détecté'}`);
  out.push(`- Documents téléchargeables présents dans le dépôt : ${inv.documents.length}`);
  out.push(`- Médias présents dans le dépôt : ${inv.medias.length}`);
  out.push(`- PWA : manifeste ${inv.pwa.manifeste || 'non détecté'}, service worker ${inv.pwa.serviceWorker || 'non détecté'}`);
  if (inv.mobileNatif.length) out.push(`- Code mobile natif détecté (hors périmètre des contrôles web) : ${inv.mobileNatif.join(', ')}`);
  out.push('');
  out.push('## Synthèse');
  out.push('');
  out.push('| Catégorie | Nombre |');
  out.push('|---|---|');
  for (const c of CATEGORY_ORDER) out.push(`| ${c} | ${resume.parCategorie[c] || 0} |`);
  out.push('');
  out.push('| Règle | Nombre |');
  out.push('|---|---|');
  for (const [r, n] of Object.entries(resume.parRegle).sort((a, b) => b[1] - a[1])) out.push(`| ${r} : ${RULES[r].titre} | ${n} |`);
  out.push('');
  out.push('## Constats');
  for (const f of constats) {
    out.push('');
    out.push(`### ${f.id} : ${f.titre}`);
    out.push('');
    out.push(`- Catégorie : **${f.categorie}** ; gravité technique estimée : ${f.gravite} ; confiance : ${f.confiance}`);
    out.push(`- Emplacement : \`${f.fichier}:${f.ligne}\``);
    if (f.extrait) out.push(`- Extrait : \`${f.extrait.replace(/`/g, "'")}\``);
    out.push(`- WCAG 2.2 : ${f.wcag.length ? f.wcag.join(' ; ') : 'aucun critère (recommandation)'}`);
    out.push(`- RGAA 4.1.2 : ${f.rgaa.length ? f.rgaa.map((c) => `critère ${c}`).join(', ') : 'aucun critère correspondant'}`);
    out.push(`- Preuve : ${f.preuve}`);
    out.push(`- Impact utilisateur : ${f.impact}`);
    out.push(`- Correction recommandée : ${f.correction}`);
    out.push(`- Validation : ${f.validation}`);
  }
  out.push('');
  return out.join('\n');
}

// ---- CLI -----------------------------------------------------------------

const isMain = import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('static-scan.mjs');
if (isMain) {
  const argv = process.argv.slice(2);
  const opts = { exclude: [] };
  let target = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') opts.json = argv[++i];
    else if (a === '--md') opts.md = argv[++i];
    else if (a === '--exclude') opts.exclude.push(argv[++i]);
    else if (a === '--quiet') opts.quiet = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else target = a;
  }
  if (!target || opts.help) {
    console.log('Usage : node scripts/static-scan.mjs <dossier-ou-fichier> [--json sortie.json] [--md sortie.md] [--exclude <regex>] [--quiet]');
    process.exit(target ? 0 : 2);
  }
  const result = scan(target, opts);
  if (opts.json) writeFileSync(opts.json, JSON.stringify(result, null, 2));
  if (opts.md) writeFileSync(opts.md, toMarkdown(result));
  if (!opts.quiet) {
    if (!opts.json && !opts.md) console.log(toMarkdown(result));
    else {
      console.log(`${result.resume.total} constat(s) :`);
      for (const [c, n] of Object.entries(result.resume.parCategorie)) console.log(`  ${c} : ${n}`);
      if (opts.json) console.log(`JSON : ${opts.json}`);
      if (opts.md) console.log(`Markdown : ${opts.md}`);
    }
  }
}
