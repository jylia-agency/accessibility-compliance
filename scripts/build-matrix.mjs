#!/usr/bin/env node
// Consolide des résultats d'analyse (statique, dynamique) et produit :
//  - une liste de constats renumérotés A11Y-NNN (JSON) ;
//  - une matrice de conformité préliminaire RGAA 4.1.2 et/ou WCAG 2.2 (Markdown).
//
// La matrice n'attribue JAMAIS le statut « Conforme » : seuls un test effectif et documenté
// par l'auditeur le permettent. Statuts produits : « Non conforme (échec vérifié) »,
// « À confirmer (risque) », « À vérifier manuellement », « Non testé ».
//
// Usage :
//   node scripts/build-matrix.mjs <resultats.json>... [--referentiel rgaa|wcag|les-deux]
//        [--json constats-consolides.json] [--md matrice.md]
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WCAG22 } from './lib/wcag22.mjs';
import { CATEGORIES as C, RULES } from './lib/rules.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const RGAA = JSON.parse(readFileSync(join(HERE, '..', 'data', 'rgaa-4.1.2-criteres.json'), 'utf8'));

const argv = process.argv.slice(2);
const inputs = [];
const o = { referentiel: 'les-deux' };
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--json') o.json = argv[++i];
  else if (argv[i] === '--md') o.md = argv[++i];
  else if (argv[i] === '--referentiel') o.referentiel = argv[++i];
  else inputs.push(argv[i]);
}
if (!inputs.length) {
  console.log('Usage : node scripts/build-matrix.mjs <resultats.json>... [--referentiel rgaa|wcag|les-deux] [--json sortie.json] [--md sortie.md]');
  process.exit(2);
}

const order = [C.ECHEC, C.RISQUE, C.MANUEL, C.BONNE_PRATIQUE];
const gravity = ['Bloquante', 'Majeure', 'Mineure', 'Information'];
const all = [];
const covered = { rgaa: new Set(), wcag: new Set() };
for (const file of inputs) {
  const r = JSON.parse(readFileSync(file, 'utf8'));
  for (const id of r.couverture || []) {
    for (const c of RULES[id]?.rgaa || []) covered.rgaa.add(c);
    for (const c of RULES[id]?.wcag || []) covered.wcag.add(c);
  }
  for (const f of r.constats) all.push({ ...f, idOrigine: f.id, source: file, outil: r.meta?.outil });
}
all.sort((a, b) => order.indexOf(a.categorie) - order.indexOf(b.categorie) || gravity.indexOf(a.gravite) - gravity.indexOf(b.gravite));
all.forEach((f, i) => (f.id = `A11Y-${String(i + 1).padStart(3, '0')}`));

// Règles statiques et dynamiques qui portent sur le même défaut : les constats sont signalés
// comme « candidats de corroboration » (à confirmer par l'auditeur, qui peut les fusionner).
const RELATED = {
  'css-contrast-text': ['contrast-text'],
  'focus-outline-removed': ['focus-not-visible'],
  'click-non-interactive': ['keyboard-unreachable'],
  'role-interactive-not-focusable': ['keyboard-unreachable'],
  'text-fixed-height-overflow': ['text-spacing-clipping', 'text-resize-clipping'],
  'css-fixed-width': ['reflow-horizontal-scroll'],
  'animation-infinite': ['animation-infinite'],
  'html-lang-missing': ['html-lang-missing'],
  'page-title-missing': ['page-title-missing'],
  'dialog-focus-management': ['dialog-focus-not-moved', 'dialog-focus-escapes', 'dialog-focus-not-returned'],
};
for (const f of all) {
  const rel = RELATED[f.regle];
  if (!rel || !f.fichier) continue; // constats statiques uniquement (ils ont un fichier)
  const c = all.filter((g) => g !== f && !g.fichier && rel.includes(g.regle));
  if (c.length) f.corroborationCandidats = c.map((g) => g.id);
}

function status(list, isCovered) {
  if (!list.length) return isCovered ? 'Contrôle automatisé partiel sans échec détecté (non conclusif)' : 'Non testé';
  if (list.some((f) => f.categorie === C.ECHEC)) return 'Non conforme (échec vérifié)';
  if (list.some((f) => f.categorie === C.RISQUE)) return 'À confirmer (risque)';
  if (list.some((f) => f.categorie === C.MANUEL)) return 'À vérifier manuellement';
  return 'Non testé';
}
const fmt = (list) => list.map((f) => f.id).join(', ') || '';

const out = ['# Matrice de conformité préliminaire', ''];
out.push('> Matrice générée automatiquement à partir des constats outillés. Elle ne contient aucun statut « Conforme » : un critère ne peut être déclaré conforme qu’après un test effectif et documenté de chacun de ses tests sur chaque page de l’échantillon. « Non testé » signifie qu’aucune preuve n’a été collectée, pas que le critère est respecté. « Contrôle automatisé partiel sans échec détecté » signifie qu’une partie seulement des tests du critère a été automatisée.');
out.push('');
out.push(`Sources : ${inputs.join(', ')}. Constats consolidés : ${all.length}.`);
out.push('');

if (o.referentiel !== 'wcag') {
  out.push(`## RGAA ${RGAA.version} (${RGAA.nombreCriteres} critères)`);
  out.push('');
  out.push('| Critère | Intitulé | Statut préliminaire | Constats | Preuve à compléter par l’auditeur |');
  out.push('|---|---|---|---|---|');
  for (const c of RGAA.criteres) {
    const list = all.filter((f) => (f.rgaa || []).includes(c.id));
    const t = c.titre.length > 110 ? `${c.titre.slice(0, 107)}...` : c.titre;
    out.push(`| ${c.id} | ${t.replace(/\|/g, '\\|')} | ${status(list, covered.rgaa.has(c.id))} | ${fmt(list)} |  |`);
  }
  out.push('');
}
if (o.referentiel !== 'rgaa') {
  out.push('## WCAG 2.2, niveaux A et AA (55 critères)');
  out.push('');
  out.push('| Critère | Niveau | Statut préliminaire | Constats | Preuve à compléter par l’auditeur |');
  out.push('|---|---|---|---|---|');
  for (const c of WCAG22.filter((x) => !x.obsolete && x.level !== 'AAA')) {
    const list = all.filter((f) => (f.wcag || []).some((w) => w.startsWith(`${c.id} `)));
    out.push(`| ${c.id} ${c.title} | ${c.level} | ${status(list, covered.wcag.has(c.id))} | ${fmt(list)} |  |`);
  }
  out.push('');
  out.push('Note : 4.1.1 Parsing est obsolète et retiré de WCAG 2.2 ; il n’apparaît pas dans cette matrice.');
  out.push('');
}
const summary = {};
for (const f of all) summary[f.categorie] = (summary[f.categorie] || 0) + 1;
if (o.json) writeFileSync(o.json, JSON.stringify({ meta: { sources: inputs, date: new Date().toISOString() }, resume: summary, constats: all }, null, 2));
if (o.md) writeFileSync(o.md, out.join('\n'));
if (!o.md) console.log(out.join('\n'));
else console.log(`${all.length} constats consolidés. Matrice : ${o.md}${o.json ? ` ; constats : ${o.json}` : ''}`);
