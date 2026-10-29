import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMarkup, normalizeAttrName } from '../../scripts/lib/markup-parser.mjs';
import { parseCss, resolveVars, collectCustomProperties } from '../../scripts/lib/css-analyzer.mjs';

const tags = (root) => [...root.descendants()].map((n) => n.tag);

test('JSX : les génériques et comparaisons ne sont pas des balises', () => {
  const src = `const a = useState<string>(''); if (i < n && x<y) {}\nconst el = cond ? <div><span>ok</span></div> : null;\nfunction f() { return <Button onClick={() => a < b}>Go</Button>; }`;
  assert.deepEqual(tags(parseMarkup(src, 'jsx')), ['div', 'span', 'Button']);
});

test('JSX : expressions, fragments et props étalées', () => {
  const root = parseMarkup(`return (<><img {...props} /><a href="/x">{label}</a></>);`, 'jsx');
  const all = [...root.descendants()];
  const img = all.find((n) => n.name === 'img');
  const a = all.find((n) => n.name === 'a');
  assert.equal(img.spread, true);
  assert.equal(a.textContent().dynamic, true);
});

test('normalisation des attributs des frameworks', () => {
  assert.deepEqual(normalizeAttrName('className'), { name: 'class', dynamic: false });
  assert.deepEqual(normalizeAttrName('htmlFor'), { name: 'for', dynamic: false });
  assert.deepEqual(normalizeAttrName(':alt'), { name: 'alt', dynamic: true });
  assert.deepEqual(normalizeAttrName('[attr.aria-label]'), { name: 'aria-label', dynamic: true });
  assert.deepEqual(normalizeAttrName('@click'), { name: 'onclick', dynamic: true });
  assert.deepEqual(normalizeAttrName('(click)'), { name: 'onclick', dynamic: true });
  assert.deepEqual(normalizeAttrName('on:click'), { name: 'onclick', dynamic: true });
  assert.deepEqual(normalizeAttrName('onClick'), { name: 'onclick', dynamic: false });
});

test('HTML : texte, attributs et numéros de ligne', () => {
  const root = parseMarkup('<p>\n<button aria-label="Fermer"><svg aria-hidden="true"></svg></button>\n</p>', 'html');
  const b = [...root.descendants()].find((n) => n.name === 'button');
  assert.equal(b.line, 2);
  assert.equal(b.value('aria-label'), 'Fermer');
});

test('CSS : règles, médias, variables', () => {
  const rules = parseCss(':root{--fg:#111}\n@media (prefers-color-scheme: dark){:root{--fg:#eee}\n.a{color:var(--fg)}}\n.b{color:red;background:#fff url(x.png)}');
  const a = rules.find((r) => r.selector === '.a');
  assert.deepEqual(a.media, ['@media (prefers-color-scheme: dark)']);
  assert.equal(a.declarations[0].line, 3);
  const vars = collectCustomProperties(rules);
  assert.equal(resolveVars('var(--fg)', vars, { selector: '.a', media: a.media }).value, '#eee');
  assert.equal(resolveVars('var(--fg)', vars, { selector: '.x', media: [] }).value, '#111');
  assert.equal(resolveVars('var(--absent, #123)', vars, {}).value, '#123');
});
