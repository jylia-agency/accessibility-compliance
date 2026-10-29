#!/usr/bin/env node
// Consultation des critères de référence (lecture seule). Évite de citer un critère de mémoire.
//
//   node scripts/criteria.mjs rgaa 3.2          critère RGAA 4.1.2 avec ses tests
//   node scripts/criteria.mjs rgaa 3.2 --methodo   ... et la méthodologie de test officielle
//   node scripts/criteria.mjs wcag 1.4.3        critère WCAG 2.2 et critères RGAA associés
//   node scripts/criteria.mjs chercher focus    recherche plein texte dans les intitulés RGAA
//   node scripts/criteria.mjs liste-wcag AA     critères WCAG 2.2 requis au niveau AA (A + AA)
//   node scripts/criteria.mjs liste-rgaa        les 106 critères RGAA 4.1.2
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WCAG22, WCAG22_BY_ID } from './lib/wcag22.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const RGAA = JSON.parse(readFileSync(join(HERE, '..', 'data', 'rgaa-4.1.2-criteres.json'), 'utf8'));
const [cmd, arg, flag] = process.argv.slice(2);

const rgaaForWcag = (id) => RGAA.criteres.filter((c) => c.wcag.some((w) => w.startsWith(`${id} `)));

if (cmd === 'rgaa' && arg) {
  const c = RGAA.criteres.find((x) => x.id === arg);
  if (!c) {
    console.error(`Critère RGAA ${arg} inexistant dans RGAA ${RGAA.version} (106 critères, thématiques 1 à 13).`);
    process.exit(1);
  }
  console.log(`RGAA ${RGAA.version} : critère ${c.id} (thématique ${c.thematiqueNumero} « ${c.thematique} »)\n${c.titre}\n`);
  for (const [tid, t] of Object.entries(c.tests)) {
    console.log(`Test ${tid} : ${t.texte[0]}`);
    for (const line of t.texte.slice(1)) console.log(`  - ${line}`);
    if (flag === '--methodo' && t.methodologie) console.log(`  Méthodologie :\n    ${t.methodologie.replace(/\n/g, '\n    ')}`);
  }
  console.log(`\nCorrespondance WCAG déclarée par le RGAA (WCAG 2.1) : ${c.wcag.join(' ; ') || 'aucune'}`);
  console.log(`Source : ${RGAA.source.pagePublique} (dépôt ${RGAA.source.depot}, commit ${RGAA.source.commit.slice(0, 12)})`);
} else if (cmd === 'wcag' && arg) {
  const c = WCAG22_BY_ID.get(arg);
  if (!c) {
    console.error(`Critère WCAG 2.2 ${arg} inexistant.`);
    process.exit(1);
  }
  console.log(`WCAG 2.2 : ${c.id} ${c.title} ${c.obsolete ? '(obsolète et retiré en WCAG 2.2)' : `(niveau ${c.level})`}${c.new22 ? ' : nouveau en 2.2, aucune correspondance déclarée par le RGAA 4.1.2 (fondé sur WCAG 2.1)' : ''}`);
  console.log(`https://www.w3.org/WAI/WCAG22/Understanding/ (document « Understanding » du critère)`);
  const r = rgaaForWcag(arg);
  console.log(r.length ? `Critères RGAA 4.1.2 qui y renvoient : ${r.map((x) => x.id).join(', ')}` : 'Aucun critère RGAA 4.1.2 ne déclare de correspondance avec ce critère.');
} else if (cmd === 'chercher' && arg) {
  const q = process.argv.slice(3).join(' ').toLowerCase();
  for (const c of RGAA.criteres.filter((x) => x.titre.toLowerCase().includes(q))) console.log(`${c.id}\t${c.titre}`);
} else if (cmd === 'liste-rgaa') {
  for (const c of RGAA.criteres) console.log(`${c.id}\t${c.thematique}\t${c.titre}`);
  console.log(`${RGAA.criteres.length} critères (RGAA ${RGAA.version}).`);
} else if (cmd === 'liste-wcag') {
  const lvl = (arg || 'AA').toUpperCase();
  const keep = lvl === 'A' ? ['A'] : lvl === 'AAA' ? ['A', 'AA', 'AAA'] : ['A', 'AA'];
  const list = WCAG22.filter((c) => !c.obsolete && keep.includes(c.level));
  for (const c of list) console.log(`${c.id}\t${c.level}\t${c.title}${c.new22 ? '\t(nouveau 2.2)' : ''}`);
  console.log(`${list.length} critères.`);
} else {
  console.log('Usage : node scripts/criteria.mjs rgaa <id> [--methodo] | wcag <id> | chercher <mots> | liste-rgaa | liste-wcag [A|AA|AAA]');
  process.exit(2);
}
