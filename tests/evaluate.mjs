#!/usr/bin/env node
// Exécute les analyses sur les fixtures et produit une synthèse mesurée des vrais positifs,
// faux négatifs et faux positifs. Usage : node tests/evaluate.mjs [--md tests/RESULTS.md]
// Les chiffres ne sont écrits qu'à partir d'une exécution réelle.
import { writeFileSync } from 'node:fs';
import { evaluateStatic, evaluateDynamic, findPlaywright } from './lib/evaluate.mjs';

const mdPath = process.argv.includes('--md') ? process.argv[process.argv.indexOf('--md') + 1] : null;
const lines = [];
const log = (s = '') => lines.push(s);

log('# Résultats mesurés sur les fixtures');
log('');
log(`Exécution : ${new Date().toISOString()} ; Node ${process.version}.`);
log('');
log('Ces chiffres portent uniquement sur les fixtures du dépôt, construites pour les défauts recherchés. Ils ne mesurent pas la fiabilité des outils sur des projets réels.');
log('');

for (const fx of ['inaccessible-app', 'accessible-app']) {
  const s = evaluateStatic(fx);
  log(`## Analyse statique : ${fx}`);
  log('');
  log(`- Attendus détectés avec la bonne catégorie : ${s.tp.length} / ${s.tp.length + s.fn.length}`);
  log(`- Faux négatifs : ${s.fn.length}${s.fn.length ? ` (${s.fn.map((x) => `${x.attendu.defaut} : ${x.obtenu}`).join(' ; ')})` : ''}`);
  log(`- Constats interdits produits : ${s.unexpected.length}`);
  log(`- Faux positifs (« Échec vérifié » ou « Risque potentiel » non attendus) : ${s.fp.length}${s.fp.length ? ` (${s.fp.map((f) => `${f.regle} ${f.fichier}:${f.ligne}`).join(' ; ')})` : ''}`);
  log(`- Autres constats non listés dans les attendus : ${s.unmatchedOther.length}${s.unmatchedOther.length ? ` (${s.unmatchedOther.map((f) => `${f.regle} [${f.categorie}]`).join(' ; ')})` : ''}`);
  log(`- Total des constats : ${s.result.constats.length}`);
  log('');
}

if (findPlaywright()) {
  for (const fx of ['inaccessible-app', 'accessible-app']) {
    const d = evaluateDynamic(fx);
    log(`## Analyse dynamique : ${fx}${d.runs.length > 1 ? ` (thèmes ${d.runs.map((r) => r.theme).join(', ')})` : ''}`);
    log('');
    log(`- Attendus détectés avec la bonne catégorie : ${d.tp.length} / ${d.tp.length + d.fn.length}`);
    log(`- Faux négatifs : ${d.fn.length}${d.fn.length ? ` (${d.fn.map((x) => `${x.attendu.defaut} : ${x.obtenu}`).join(' ; ')})` : ''}`);
    log(`- Constats interdits produits : ${d.unexpected.length}`);
    log(`- Faux positifs (catégories interdites) : ${d.fp.length}${d.fp.length ? ` (${d.fp.map((f) => `${f.theme || ''} ${f.regle} ${f.element}`).join(' ; ')})` : ''}`);
    log(`- Autres constats non listés dans les attendus : ${d.unmatchedOther.length}${d.unmatchedOther.length ? ` (${d.unmatchedOther.map((f) => `${f.regle} [${f.categorie}]`).join(' ; ')})` : ''}`);
    log('');
  }
} else {
  log('## Analyse dynamique');
  log('');
  log('Non exécutée : Playwright indisponible dans cet environnement.');
  log('');
}

const out = lines.join('\n');
if (mdPath) writeFileSync(mdPath, out + '\n');
console.log(out);
