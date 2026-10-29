import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { scan } from '../../scripts/static-scan.mjs';

function project(files) {
  const dir = mkdtempSync(join(tmpdir(), 'a11y-unit-'));
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), content);
  }
  try {
    return scan(dir).constats;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const rules = (list) => list.map((f) => f.regle);

test('JSX : un bouton au texte dynamique n’est pas signalé', () => {
  const c = project({ 'A.jsx': 'export const A = ({t}) => <button onClick={go}>{t("save")}</button>;' });
  assert.ok(!rules(c).includes('button-name-missing'));
});

test('JSX : un bouton vide est signalé', () => {
  const c = project({ 'A.jsx': 'export const A = () => <button onClick={go}></button>;' });
  assert.ok(rules(c).includes('button-name-missing'));
});

test('Vue : alt lié dynamiquement accepté, alt absent signalé', () => {
  const ok = project({ 'A.vue': '<template><img :src="u" :alt="d"></template>' });
  assert.ok(!rules(ok).includes('img-alt-missing'));
  const ko = project({ 'B.vue': '<template><img :src="u"></template>' });
  assert.ok(rules(ko).includes('img-alt-missing'));
});

test('Angular : [attr.aria-label] fournit un nom, (click) sur div signalé', () => {
  const c = project({ 'a.component.html': '<button [attr.aria-label]="label"><svg></svg></button><div (click)="go()">Go</div>' });
  assert.ok(!rules(c).includes('button-name-missing'));
  assert.ok(rules(c).includes('click-non-interactive'));
});

test('Svelte : on:click sur span signalé', () => {
  const c = project({ 'A.svelte': '<span on:click={go}>Go</span>' });
  assert.ok(rules(c).includes('click-non-interactive'));
});

test('étiquette englobante et étiquette dans un autre composant acceptées', () => {
  const c = project({
    'A.jsx': 'export const A = () => <label>Nom <input type="text" name="nom" autoComplete="family-name" /></label>;',
    'B.jsx': 'export const B = () => <><label htmlFor="q">Recherche</label><Field /></>;',
    'C.jsx': 'export const C = () => <input id="q" type="search" />;',
  });
  assert.ok(!rules(c).includes('form-label-missing'));
});

test('un texte de 14 px contrasté n’est jamais signalé comme non conforme', () => {
  const c = project({ 's.css': '.p { font-size: 14px; color: #333; background: #fff; }' });
  assert.equal(c.length, 0);
});

test('une taille de 11 px est une simple remarque de lisibilité', () => {
  const c = project({ 's.css': '.p { font-size: 11px; }' });
  assert.deepEqual(c.map((f) => [f.regle, f.categorie]), [['small-text-readability', 'Bonne pratique']]);
});

test('composant inactif exclu du contraste ; :focus:not(:focus-visible) accepté', () => {
  const c = project({ 's.css': 'button:disabled { color: #aaa; background: #fff; }\nbutton:focus:not(:focus-visible) { outline: none; }' });
  assert.equal(c.length, 0);
});

test('contraste entre 3:1 et 4,5:1 sans taille connue : confiance moyenne', () => {
  const c = project({ 's.css': '.t { color: #888; background-color: #fff; }' });
  assert.equal(c[0].regle, 'css-contrast-text');
  assert.equal(c[0].confiance, 'moyenne');
});
