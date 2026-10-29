#!/usr/bin/env node
// Génère data/rgaa-4.1.2-criteres.json à partir du fichier officiel
// RGAA/criteres.json du dépôt DISIC/accessibilite.numerique.gouv.fr
// (licence Ouverte 2.0). Usage :
//   node scripts/build-rgaa-data.mjs <chemin/criteres.json> <chemin/methodologies.json> <commit-source> [sortie]
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const [, , criteresPath, methodoPath, commit, out = 'data/rgaa-4.1.2-criteres.json'] = process.argv;
if (!criteresPath || !methodoPath || !commit) {
  console.error('Usage : node scripts/build-rgaa-data.mjs <criteres.json> <methodologies.json> <commit> [sortie]');
  process.exit(2);
}

const raw = readFileSync(criteresPath);
const src = JSON.parse(raw.toString('utf8'));
const methodo = JSON.parse(readFileSync(methodoPath, 'utf8'));

// Supprime les liens Markdown vers le glossaire : [texte](#ancre) -> texte
const plain = (s) => s.replace(/\[([^\]]+)\]\((#[^)]+)\)/g, '$1');

const criteria = [];
for (const topic of src.topics) {
  for (const { criterium: c } of topic.criteria) {
    const id = `${topic.number}.${c.number}`;
    const refs = {};
    for (const r of c.references || []) Object.assign(refs, r);
    const tests = {};
    for (const [n, lines] of Object.entries(c.tests)) {
      const tid = `${id}.${n}`;
      tests[tid] = {
        texte: lines.map(plain),
        methodologie: methodo[tid] ? plain(methodo[tid]).trim() : null,
      };
    }
    criteria.push({
      id,
      thematique: topic.topic,
      thematiqueNumero: topic.number,
      titre: plain(c.title),
      wcag: refs.wcag || [],
      techniques: refs.techniques || [],
      tests,
    });
  }
}

const data = {
  referentiel: 'RGAA',
  version: '4.1.2',
  correspondanceWcag: `WCAG ${src.wcag?.version} (référence déclarée dans le fichier source)`,
  source: {
    depot: 'https://github.com/DISIC/accessibilite.numerique.gouv.fr',
    fichiers: ['RGAA/criteres.json', 'RGAA/methodologies.json'],
    commit,
    sha256CriteresJson: createHash('sha256').update(raw).digest('hex'),
    licence: 'Licence Ouverte 2.0 (Etalab) pour les contenus du référentiel',
    pagePublique: 'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/',
  },
  nombreThematiques: src.topics.length,
  nombreCriteres: criteria.length,
  criteres: criteria,
};
writeFileSync(out, JSON.stringify(data, null, 1) + '\n');
console.log(`${criteria.length} critères écrits dans ${out}`);
