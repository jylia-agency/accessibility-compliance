import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseColor, contrastRatio, formatRatio, evaluatePair, isLargeText, suggestColor, composite, relativeLuminance } from '../../scripts/lib/color.mjs';

const r = (a, b) => contrastRatio(parseColor(a), parseColor(b));

test('valeurs de référence du rapport de contraste', () => {
  assert.equal(r('#000000', '#ffffff'), 21);
  assert.equal(r('#ffffff', '#ffffff'), 1);
  assert.equal(formatRatio(r('#767676', '#ffffff')), '4.54');
  assert.equal(formatRatio(r('#777777', '#ffffff')), '4.47');
  assert.equal(formatRatio(r('#999999', '#ffffff')), '2.84');
  assert.equal(formatRatio(r('#ffffff', '#73b9b0')), '2.25');
  // Symétrie
  assert.equal(r('#1a5fb4', '#ffffff'), r('#ffffff', '#1a5fb4'));
});

test('luminance relative WCAG (valeurs connues)', () => {
  assert.equal(relativeLuminance({ r: 255, g: 255, b: 255 }), 1);
  assert.equal(relativeLuminance({ r: 0, g: 0, b: 0 }), 0);
  assert.ok(Math.abs(relativeLuminance({ r: 128, g: 128, b: 128 }) - 0.2158605) < 1e-6);
});

test('le seuil 0,04045 et l’ancien seuil 0,03928 donnent le même résultat pour toutes les valeurs 8 bits', () => {
  for (let v = 0; v <= 255; v++) {
    const c = v / 255;
    const a = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    const b = c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    assert.equal(a, b, `valeur ${v}`);
  }
});

test('aucun arrondi favorable : 4,499 n’atteint pas 4,5', () => {
  assert.equal(formatRatio(4.4999), '4.49');
  const res = evaluatePair('#777777', '#ffffff', { sizePx: 16 });
  assert.equal(res.conforme, false);
});

test('formats de couleur', () => {
  assert.deepEqual(parseColor('#abc'), { r: 170, g: 187, b: 204, a: 1 });
  assert.equal(parseColor('rgb(10 20 30 / 50%)').a, 0.5);
  assert.equal(parseColor('rgba(10, 20, 30, .25)').a, 0.25);
  assert.deepEqual(parseColor('hsl(0, 100%, 50%)'), { r: 255, g: 0, b: 0, a: 1 });
  assert.deepEqual(parseColor('white'), { r: 255, g: 255, b: 255, a: 1 });
  // oklch Tailwind v4 blue-600 = #155dfc
  const c = parseColor('oklch(0.546 0.245 262.881)');
  assert.deepEqual([Math.round(c.r), Math.round(c.g), Math.round(c.b)], [0x15, 0x5d, 0xfc]);
  assert.throws(() => parseColor('var(--x)'), /non résolue/);
  assert.throws(() => parseColor('currentColor'), /non résolue/);
});

test('fond translucide : refus sans fond sous-jacent, composition sinon', () => {
  assert.throws(() => evaluatePair('#000', 'rgba(255,255,255,.5)'), /translucide/);
  const res = evaluatePair('#000', 'rgba(255,255,255,.5)', { backdrop: '#000' });
  assert.equal(res.fond, '#808080');
  assert.deepEqual(composite(parseColor('rgba(0,0,0,.5)'), parseColor('#fff')), { r: 127.5, g: 127.5, b: 127.5, a: 1 });
});

test('texte de grande taille : WCAG et RGAA', () => {
  assert.equal(isLargeText(24, 400), true);
  assert.equal(isLargeText(23.9, 400), false);
  assert.equal(isLargeText(18.67, 700), true);
  assert.equal(isLargeText(18.5, 700, 'wcag'), false);
  assert.equal(isLargeText(18.5, 700, 'rgaa'), true);
  // Un texte de 14 px n'est pas « non conforme » par nature : seul le contraste compte
  assert.equal(evaluatePair('#333333', '#ffffff', { sizePx: 14 }).conforme, true);
});

test('contraste non textuel : seuil 3:1', () => {
  assert.equal(evaluatePair('#949494', '#ffffff', { type: 'non-text' }).conforme, true);
  assert.equal(evaluatePair('#959595', '#ffffff', { type: 'non-text' }).conforme, false);
});

test('les suggestions de couleur atteignent réellement le seuil', () => {
  const fg = parseColor('#ffffff');
  const bg = parseColor('#73b9b0');
  for (const s of suggestColor(bg, fg, 4.5)) assert.ok(contrastRatio(parseColor(s.hex), fg) >= 4.5, s.hex);
  for (const s of suggestColor(parseColor('#999999'), parseColor('#ffffff'), 7)) assert.ok(contrastRatio(parseColor(s.hex), parseColor('#ffffff')) >= 7, s.hex);
});
