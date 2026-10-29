import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { RULES, CATEGORIES } from '../../scripts/lib/rules.mjs';
import { WCAG22, WCAG22_BY_ID } from '../../scripts/lib/wcag22.mjs';

const rgaa = JSON.parse(readFileSync(new URL('../../data/rgaa-4.1.2-criteres.json', import.meta.url), 'utf8'));
const rgaaIds = new Set(rgaa.criteres.map((c) => c.id));

test('données RGAA 4.1.2 : 106 critères, 13 thématiques', () => {
  assert.equal(rgaa.version, '4.1.2');
  assert.equal(rgaa.criteres.length, 106);
  assert.equal(new Set(rgaa.criteres.map((c) => c.thematiqueNumero)).size, 13);
  assert.equal(rgaa.nombreThematiques, 13);
});

test('données WCAG 2.2 : 86 critères actifs, 55 aux niveaux A et AA, 9 nouveaux, 4.1.1 obsolète', () => {
  const active = WCAG22.filter((c) => !c.obsolete);
  assert.equal(active.length, 86);
  assert.equal(active.filter((c) => c.level !== 'AAA').length, 55);
  assert.equal(active.filter((c) => c.new22).length, 9);
  assert.equal(WCAG22_BY_ID.get('4.1.1').obsolete, true);
});

test('chaque règle référence uniquement des critères existants', () => {
  for (const r of Object.values(RULES)) {
    for (const w of r.wcag) assert.ok(WCAG22_BY_ID.has(w) && !WCAG22_BY_ID.get(w).obsolete, `${r.id} : WCAG ${w} inconnu ou obsolète`);
    for (const c of r.rgaa) assert.ok(rgaaIds.has(c), `${r.id} : RGAA ${c} inconnu`);
    for (const k of ['titre', 'impact', 'correction', 'validation', 'gravite']) assert.ok(r[k], `${r.id} : champ ${k} manquant`);
  }
});

test('les correspondances RGAA -> WCAG des données officielles citent des critères WCAG existants', () => {
  for (const c of rgaa.criteres) {
    for (const w of c.wcag) {
      const id = w.split(' ')[0];
      assert.ok(WCAG22_BY_ID.has(id), `RGAA ${c.id} cite ${w}`);
    }
  }
});

test('catégories de constats conformes à la méthodologie', () => {
  assert.deepEqual(Object.values(CATEGORIES), [
    'Échec vérifié', 'Risque potentiel', 'À vérifier manuellement', 'Conforme sur le périmètre testé', 'Non applicable', 'Non testé', 'Bonne pratique',
  ]);
});
