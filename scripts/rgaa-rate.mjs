#!/usr/bin/env node
// Calcul du taux de conformité selon la méthode RGAA 4.1.2 (page « Évaluation de la
// conformité » : https://accessibilite.numerique.gouv.fr/obligations/evaluation-conformite/).
//
// Entrée : grille JSON remplie par l'auditeur après tests effectifs :
// {
//   "echantillon": { "pages": ["accueil", "contact", ...], "conformeMethodeRgaa": true, "justification": "..." },
//   "resultats": { "accueil": { "1.1": "C", "1.2": "NA", "3.2": "NC", ... }, ... },
//   "processus": [["panier", "paiement", "confirmation"]]
// }
// Valeurs : C (conforme), NC (non conforme), NA (non applicable), NT (non testé).
//
// Règles appliquées :
// - critère validé pour le service s'il est C sur toutes les pages où il est applicable ;
// - critère applicable s'il l'est sur au moins une page ;
// - page d'un processus : un critère n'est validé que s'il l'est sur toutes les pages du processus ;
// - taux = critères validés / critères applicables ; taux moyen = moyenne des taux par page.
// Le résultat n'est qualifié de « calcul selon la méthode RGAA » que si aucun critère n'est NT
// sur aucune page, que les 106 critères sont renseignés et que l'échantillon est déclaré conforme
// à la méthode. Sinon le taux est présenté comme PROVISOIRE.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const RGAA = JSON.parse(readFileSync(join(HERE, '..', 'data', 'rgaa-4.1.2-criteres.json'), 'utf8'));
const IDS = RGAA.criteres.map((c) => c.id);

export function computeRate(grid) {
  const pages = Object.keys(grid.resultats || {});
  const problems = [];
  if (!pages.length) problems.push('Aucune page dans la grille.');
  const res = structuredClone(grid.resultats);
  for (const p of pages) {
    for (const id of IDS) {
      const v = res[p][id];
      if (v === undefined) problems.push(`Page « ${p} » : critère ${id} non renseigné.`);
      else if (!['C', 'NC', 'NA', 'NT'].includes(v)) problems.push(`Page « ${p} » : valeur « ${v} » invalide pour ${id}.`);
    }
    for (const id of Object.keys(res[p])) if (!IDS.includes(id)) problems.push(`Page « ${p} » : critère ${id} inexistant dans le RGAA 4.1.2.`);
  }
  // Règle des processus
  for (const proc of grid.processus || []) {
    for (const id of IDS) {
      if (proc.some((p) => res[p]?.[id] === 'NC')) for (const p of proc) if (res[p] && res[p][id] === 'C') res[p][id] = 'NC';
    }
  }
  const nt = pages.flatMap((p) => IDS.filter((id) => res[p][id] === 'NT').map((id) => `${p}:${id}`));
  const perPage = {};
  for (const p of pages) {
    const applicable = IDS.filter((id) => ['C', 'NC'].includes(res[p][id]));
    const valid = applicable.filter((id) => res[p][id] === 'C');
    perPage[p] = { applicables: applicable.length, valides: valid.length, taux: applicable.length ? valid.length / applicable.length : null };
  }
  const applicable = IDS.filter((id) => pages.some((p) => ['C', 'NC'].includes(res[p][id])));
  const validated = applicable.filter((id) => pages.every((p) => res[p][id] !== 'NC' && res[p][id] !== 'NT'));
  const rate = applicable.length ? validated.length / applicable.length : null;
  const pageRates = Object.values(perPage).map((x) => x.taux).filter((x) => x !== null);
  const avg = pageRates.length ? pageRates.reduce((a, b) => a + b, 0) / pageRates.length : null;
  const methodOk = !problems.length && !nt.length && grid.echantillon?.conformeMethodeRgaa === true;
  let etat = null;
  if (methodOk && rate !== null) etat = rate === 1 ? 'totalement conforme' : rate >= 0.5 ? 'partiellement conforme' : 'non conforme';
  return {
    referentiel: 'RGAA 4.1.2',
    criteresApplicables: applicable.length,
    criteresValides: validated.length,
    criteresNonValides: applicable.length - validated.length,
    tauxCriteresRespectes: rate,
    tauxMoyenParPage: avg,
    parPage: perPage,
    nonTestes: nt,
    anomaliesGrille: problems,
    qualification: methodOk ? 'Calcul conforme à la méthode RGAA, sous réserve de la fiabilité des tests réalisés' : 'PROVISOIRE : non utilisable pour une déclaration d’accessibilité',
    etatDeConformiteCorrespondant: etat,
    raisons: methodOk ? [] : [
      ...(nt.length ? [`${nt.length} résultat(s) « non testé »`] : []),
      ...(problems.length ? [`${problems.length} anomalie(s) de grille`] : []),
      ...(grid.echantillon?.conformeMethodeRgaa === true ? [] : ['échantillon non déclaré conforme à la méthode RGAA']),
    ],
  };
}

const isMain = process.argv[1] && process.argv[1].endsWith('rgaa-rate.mjs');
if (isMain) {
  const file = process.argv[2];
  if (!file) {
    console.log('Usage : node scripts/rgaa-rate.mjs <grille.json>');
    process.exit(2);
  }
  const r = computeRate(JSON.parse(readFileSync(file, 'utf8')));
  const pct = (x) => (x === null ? 'n/a' : `${(Math.floor(x * 10000) / 100).toFixed(2)} %`);
  console.log(`Référentiel : ${r.referentiel}`);
  console.log(`Critères applicables : ${r.criteresApplicables} ; validés : ${r.criteresValides} ; non validés : ${r.criteresNonValides}`);
  console.log(`Taux de critères respectés : ${pct(r.tauxCriteresRespectes)}`);
  console.log(`Taux moyen de conformité (moyenne des pages) : ${pct(r.tauxMoyenParPage)}`);
  console.log(`Qualification : ${r.qualification}${r.raisons.length ? ` (${r.raisons.join(' ; ')})` : ''}`);
  if (r.etatDeConformiteCorrespondant) console.log(`État de conformité correspondant (mention RGAA) : ${r.etatDeConformiteCorrespondant}`);
  for (const p of r.anomaliesGrille.slice(0, 20)) console.log(`  - ${p}`);
}
