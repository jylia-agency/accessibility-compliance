import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateStatic, evaluateDynamic, findPlaywright } from './lib/evaluate.mjs';

const show = (list) => JSON.stringify(list.map((x) => x.attendu?.defaut || x.interdit?.raison || `${x.regle} ${x.fichier || x.element}:${x.ligne || ''}`), null, 1);

test('analyse statique : fixture inaccessible-app', () => {
  const r = evaluateStatic('inaccessible-app');
  assert.equal(r.fn.length, 0, `Faux négatifs : ${show(r.fn)}`);
  assert.equal(r.unexpected.length, 0, `Constats interdits : ${show(r.unexpected)}`);
});

test('analyse statique : fixture accessible-app (aucun échec ni risque)', () => {
  const r = evaluateStatic('accessible-app');
  assert.equal(r.fp.length, 0, `Faux positifs : ${show(r.fp)}`);
  assert.equal(r.fn.length, 0, `Contrôles manuels attendus manquants : ${show(r.fn)}`);
});

const hasPw = findPlaywright();
test('analyse dynamique : fixture inaccessible-app', { skip: !hasPw && 'Playwright indisponible : test non exécuté', timeout: 300000 }, () => {
  const r = evaluateDynamic('inaccessible-app');
  assert.equal(r.fn.length, 0, `Faux négatifs : ${show(r.fn)}`);
  assert.equal(r.unexpected.length, 0, `Constats interdits : ${show(r.unexpected)}`);
});

test('analyse dynamique : fixture accessible-app, thèmes clair et sombre', { skip: !hasPw && 'Playwright indisponible : test non exécuté', timeout: 300000 }, () => {
  const r = evaluateDynamic('accessible-app');
  assert.equal(r.fp.length, 0, `Faux positifs : ${JSON.stringify(r.fp.map((f) => `${f.theme} ${f.regle} ${f.element}`))}`);
});
