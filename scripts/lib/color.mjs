// Calculs de couleur et de contraste conformes à la définition WCAG 2.2.
//
// Sources :
// - WCAG 2.2, définitions « relative luminance » et « contrast ratio » :
//   https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
//   https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio
// - RGAA 4.1.2, glossaire « Contraste » (même formule, seuil 0,03928).
//
// Note sur le seuil 0,04045 / 0,03928 : pour des composantes codées sur
// 8 bits (valeur/255), aucune valeur ne tombe entre ces deux seuils
// (10/255 = 0,0392 et 11/255 = 0,0431). Les deux formules donnent donc
// des résultats identiques pour les couleurs sRGB 8 bits.
//
// Aucune dépendance externe.

import { NAMED_COLORS } from './named-colors.mjs';

export class ColorParseError extends Error {}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Couleur RGBA : r, g, b dans [0, 255] (flottants admis), a dans [0, 1].
 * `outOfGamut` vaut true si la couleur source sortait du gamut sRGB et a été
 * écrêtée (les navigateurs appliquent un mappage de gamut qui peut différer).
 */
function rgba(r, g, b, a = 1, extra = {}) {
  return { r, g, b, a: clamp(a, 0, 1), ...extra };
}

function parseNumberOrPercent(token, max) {
  token = token.trim();
  if (token === 'none') return 0;
  if (token.endsWith('%')) return (parseFloat(token) / 100) * max;
  const v = parseFloat(token);
  if (Number.isNaN(v)) throw new ColorParseError(`Valeur numérique invalide : ${token}`);
  return v;
}

function parseAlpha(token) {
  if (token === undefined) return 1;
  token = token.trim();
  if (token.endsWith('%')) return parseFloat(token) / 100;
  const v = parseFloat(token);
  if (Number.isNaN(v)) throw new ColorParseError(`Alpha invalide : ${token}`);
  return v;
}

function parseHue(token) {
  token = token.trim();
  if (token === 'none') return 0;
  const v = parseFloat(token);
  if (token.endsWith('turn')) return v * 360;
  if (token.endsWith('grad')) return v * 0.9;
  if (token.endsWith('rad')) return (v * 180) / Math.PI;
  return v; // deg ou nombre seul
}

/** Sépare les arguments d'une fonction couleur CSS (syntaxes à virgules ou à espaces + « / alpha »). */
function splitArgs(inner) {
  let alpha;
  let body = inner.trim();
  const slash = body.lastIndexOf('/');
  if (slash !== -1) {
    alpha = body.slice(slash + 1).trim();
    body = body.slice(0, slash).trim();
  }
  const parts = body.includes(',') ? body.split(',').map((s) => s.trim()) : body.split(/\s+/);
  if (alpha === undefined && parts.length === 4) alpha = parts.pop();
  return { parts, alpha };
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 1);
  l = clamp(l, 0, 1);
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

function hwbToRgb(h, w, bl) {
  if (w + bl >= 1) {
    const g = (w / (w + bl)) * 255;
    return [g, g, g];
  }
  const [r, g, b] = hslToRgb(h, 1, 0.5);
  const f = (c) => (c / 255) * (1 - w - bl) + w;
  return [f(r) * 255, f(g) * 255, f(b) * 255];
}

// --- Espaces colorimétriques modernes (CSS Color 4) -----------------------

const linToGamma = (c) => {
  const sign = c < 0 ? -1 : 1;
  const abs = Math.abs(c);
  return abs > 0.0031308 ? sign * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055) : 12.92 * c;
};
const gammaToLin = (c) => {
  const sign = c < 0 ? -1 : 1;
  const abs = Math.abs(c);
  return abs <= 0.04045 ? c / 12.92 : sign * Math.pow((abs + 0.055) / 1.055, 2.4);
};

function linearSrgbToRgb255([r, g, b]) {
  const enc = [r, g, b].map(linToGamma);
  const outOfGamut = enc.some((c) => c < -1e-4 || c > 1 + 1e-4);
  return { rgb: enc.map((c) => clamp(c, 0, 1) * 255), outOfGamut };
}

function oklabToLinearSrgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

// CIE Lab (D50) -> XYZ D50 -> XYZ D65 (Bradford) -> sRGB linéaire
function labToLinearSrgb(L, a, b) {
  const k = 24389 / 27;
  const e = 216 / 24389;
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const xr = fx ** 3 > e ? fx ** 3 : (116 * fx - 16) / k;
  const yr = L > k * e ? fy ** 3 : L / k;
  const zr = fz ** 3 > e ? fz ** 3 : (116 * fz - 16) / k;
  const [X50, Y50, Z50] = [xr * 0.3457 / 0.3585, yr, zr * (1 - 0.3457 - 0.3585) / 0.3585];
  const X = 0.9554734527042182 * X50 - 0.023098536874261423 * Y50 + 0.0632593086610217 * Z50;
  const Y = -0.028369706963208136 * X50 + 1.0099954580058226 * Y50 + 0.021041398966943008 * Z50;
  const Z = 0.012314001688319899 * X50 - 0.020507696433477912 * Y50 + 1.3303659366080753 * Z50;
  return [
    3.2409699419045226 * X - 1.537383177570094 * Y - 0.4986107602930034 * Z,
    -0.9692436362808796 * X + 1.8759675015077202 * Y + 0.04155505740717559 * Z,
    0.05563007969699366 * X - 0.20397695888897652 * Y + 1.0569715142428786 * Z,
  ];
}

function displayP3ToLinearSrgb(r, g, b) {
  const [lr, lg, lb] = [r, g, b].map(gammaToLin);
  // P3 linéaire -> XYZ D65 -> sRGB linéaire (matrice combinée)
  return [
    1.2249401762805598 * lr - 0.22494017628055996 * lg,
    -0.04205695470968816 * lr + 1.0420569547096882 * lg,
    -0.019637554590334432 * lr - 0.07863604555063189 * lg + 1.0982736001409663 * lb,
  ];
}

/**
 * Analyse une couleur CSS et renvoie {r,g,b,a} en sRGB 0-255.
 * Formats pris en charge : #rgb, #rgba, #rrggbb, #rrggbbaa, rgb(), rgba(),
 * hsl(), hsla(), hwb(), lab(), lch(), oklab(), oklch(), color(srgb|srgb-linear|display-p3),
 * mots-clés nommés CSS et « transparent ».
 * Les valeurs non résolues (var(), currentColor, color-mix(), inherit...) sont refusées :
 * elles doivent être résolues dans un navigateur (styles calculés).
 */
export function parseColor(input) {
  if (typeof input !== 'string') throw new ColorParseError('Couleur absente');
  const s = input.trim().toLowerCase();
  if (!s) throw new ColorParseError('Couleur vide');

  if (/^(var|calc|color-mix|light-dark|env|attr)\(/.test(s) || /^(currentcolor|inherit|initial|unset|revert|revert-layer)$/.test(s)) {
    throw new ColorParseError(
      `Valeur non résolue « ${input} » : utiliser la couleur calculée par le navigateur (getComputedStyle) ou la valeur résolue du jeton.`,
    );
  }
  if (s === 'transparent') return rgba(0, 0, 0, 0);
  if (NAMED_COLORS[s]) return parseColor(NAMED_COLORS[s]);

  if (s.startsWith('#')) {
    const hex = s.slice(1);
    if (!/^[0-9a-f]+$/.test(hex) || ![3, 4, 6, 8].includes(hex.length)) {
      throw new ColorParseError(`Couleur hexadécimale invalide : ${input}`);
    }
    const full = hex.length <= 4 ? [...hex].map((c) => c + c).join('') : hex;
    const n = (i) => parseInt(full.slice(i, i + 2), 16);
    return rgba(n(0), n(2), n(4), full.length === 8 ? n(6) / 255 : 1);
  }

  const m = s.match(/^([a-z-]+)\((.*)\)$/);
  if (!m) throw new ColorParseError(`Format de couleur non reconnu : ${input}`);
  const [, fn, inner] = m;
  const { parts, alpha } = splitArgs(inner);
  const a = parseAlpha(alpha);

  switch (fn) {
    case 'rgb':
    case 'rgba': {
      if (parts.length !== 3) throw new ColorParseError(`rgb() attend 3 composantes : ${input}`);
      const [r, g, b] = parts.map((p) => clamp(parseNumberOrPercent(p, 255), 0, 255));
      return rgba(r, g, b, a);
    }
    case 'hsl':
    case 'hsla': {
      if (parts.length !== 3) throw new ColorParseError(`hsl() attend 3 composantes : ${input}`);
      const h = parseHue(parts[0]);
      const sat = parseNumberOrPercent(parts[1].endsWith('%') ? parts[1] : `${parts[1]}%`, 1);
      const lig = parseNumberOrPercent(parts[2].endsWith('%') ? parts[2] : `${parts[2]}%`, 1);
      return rgba(...hslToRgb(h, sat, lig), a);
    }
    case 'hwb': {
      const h = parseHue(parts[0]);
      const w = parseNumberOrPercent(parts[1].endsWith('%') ? parts[1] : `${parts[1]}%`, 1);
      const bl = parseNumberOrPercent(parts[2].endsWith('%') ? parts[2] : `${parts[2]}%`, 1);
      return rgba(...hwbToRgb(h, w, bl), a);
    }
    case 'oklab': {
      const L = parseNumberOrPercent(parts[0], 1);
      const A = parseNumberOrPercent(parts[1], 0.4);
      const B = parseNumberOrPercent(parts[2], 0.4);
      const { rgb, outOfGamut } = linearSrgbToRgb255(oklabToLinearSrgb(L, A, B));
      return rgba(...rgb, a, { outOfGamut });
    }
    case 'oklch': {
      const L = parseNumberOrPercent(parts[0], 1);
      const C = parseNumberOrPercent(parts[1], 0.4);
      const h = (parseHue(parts[2]) * Math.PI) / 180;
      const { rgb, outOfGamut } = linearSrgbToRgb255(oklabToLinearSrgb(L, C * Math.cos(h), C * Math.sin(h)));
      return rgba(...rgb, a, { outOfGamut });
    }
    case 'lab': {
      const L = parseNumberOrPercent(parts[0], 100);
      const A = parseNumberOrPercent(parts[1], 125);
      const B = parseNumberOrPercent(parts[2], 125);
      const { rgb, outOfGamut } = linearSrgbToRgb255(labToLinearSrgb(L, A, B));
      return rgba(...rgb, a, { outOfGamut });
    }
    case 'lch': {
      const L = parseNumberOrPercent(parts[0], 100);
      const C = parseNumberOrPercent(parts[1], 150);
      const h = (parseHue(parts[2]) * Math.PI) / 180;
      const { rgb, outOfGamut } = linearSrgbToRgb255(labToLinearSrgb(L, C * Math.cos(h), C * Math.sin(h)));
      return rgba(...rgb, a, { outOfGamut });
    }
    case 'color': {
      const [space, ...vals] = parts;
      const [x, y, z] = vals.map((v) => parseNumberOrPercent(v, 1));
      if (space === 'srgb') return rgba(clamp(x, 0, 1) * 255, clamp(y, 0, 1) * 255, clamp(z, 0, 1) * 255, a);
      if (space === 'srgb-linear') {
        const { rgb, outOfGamut } = linearSrgbToRgb255([x, y, z]);
        return rgba(...rgb, a, { outOfGamut });
      }
      if (space === 'display-p3') {
        const { rgb, outOfGamut } = linearSrgbToRgb255(displayP3ToLinearSrgb(x, y, z));
        return rgba(...rgb, a, { outOfGamut });
      }
      throw new ColorParseError(`Espace color() non pris en charge : ${space}`);
    }
    default:
      throw new ColorParseError(`Fonction couleur non prise en charge : ${fn}()`);
  }
}

/** Arrondit sur 8 bits, comme l'affichage final d'un navigateur en sRGB. */
export function quantize(c) {
  return { ...c, r: Math.round(c.r), g: Math.round(c.g), b: Math.round(c.b) };
}

/** Composite une couleur (éventuellement translucide) sur un fond opaque, en sRGB non linéaire (comportement CSS par défaut). */
export function composite(fg, bg) {
  if (bg.a < 1) throw new Error('Le fond doit être opaque pour composer : fournir le fond sous-jacent.');
  const a = fg.a;
  return rgba(fg.r * a + bg.r * (1 - a), fg.g * a + bg.g * (1 - a), fg.b * a + bg.b * (1 - a), 1);
}

/** Luminance relative WCAG 2.2. */
export function relativeLuminance({ r, g, b }) {
  const lin = (c8) => {
    const c = c8 / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Rapport de contraste WCAG entre deux couleurs opaques. */
export function contrastRatio(c1, c2) {
  const l1 = relativeLuminance(c1);
  const l2 = relativeLuminance(c2);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Formate un ratio pour l'affichage SANS arrondi supérieur : 4,4999 devient « 4.49 »,
 * jamais « 4.50 ». Les WCAG précisent que les ratios ne doivent pas être arrondis
 * pour atteindre le seuil.
 */
export function formatRatio(ratio, digits = 2) {
  const f = 10 ** digits;
  return (Math.floor(ratio * f + 1e-9) / f).toFixed(digits);
}

export function toHex({ r, g, b, a = 1 }) {
  const h = (v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}${a < 1 ? h(a * 255) : ''}`.toUpperCase();
}

// --- Seuils --------------------------------------------------------------

export const PX_PER_PT = 96 / 72;

/** Convertit une taille CSS absolue en px. Les unités relatives (em, rem, %) exigent le contexte : refusées. */
export function toPx(size) {
  if (typeof size === 'number') return size;
  const m = String(size).trim().match(/^([\d.]+)\s*(px|pt)?$/i);
  if (!m) throw new Error(`Taille « ${size} » non convertible sans contexte : fournir la taille calculée en px ou pt.`);
  const v = parseFloat(m[1]);
  return (m[2] || 'px').toLowerCase() === 'pt' ? v * PX_PER_PT : v;
}

/**
 * Détermine si un texte est « de grande taille ».
 * - WCAG 2.2 (définition « large scale ») : au moins 18 pt (24 px), ou au moins 14 pt
 *   (18,666 px) en gras.
 * - RGAA 4.1.2 (tests 3.2.1 à 3.2.4) : 24 px, ou 18,5 px en gras.
 * Le gras est approximé par font-weight >= 700 (à confirmer visuellement pour les
 * polices dont la graisse rendue diffère).
 */
export function isLargeText(sizePx, weight = 400, referentiel = 'wcag') {
  const bold = Number(weight) >= 700;
  if (sizePx >= 24) return true;
  if (!bold) return false;
  return referentiel === 'rgaa' ? sizePx >= 18.5 : sizePx >= 14 * PX_PER_PT;
}

/**
 * Seuil requis.
 * type : 'text' | 'non-text'
 * level : 'AA' | 'AAA'
 */
export function requiredRatio({ type = 'text', large = false, level = 'AA' }) {
  if (type === 'non-text') {
    if (level === 'AAA') throw new Error('Pas de critère AAA spécifique au contraste non textuel en WCAG 2.2 (1.4.11 est AA).');
    return 3;
  }
  if (level === 'AAA') return large ? 4.5 : 7;
  return large ? 3 : 4.5;
}

export function criterionFor({ type = 'text', level = 'AA' }) {
  if (type === 'non-text') return { wcag: '1.4.11 Non-text Contrast (AA)', rgaa: '3.3' };
  if (level === 'AAA') return { wcag: '1.4.6 Contrast (Enhanced) (AAA)', rgaa: null };
  return { wcag: '1.4.3 Contrast (Minimum) (AA)', rgaa: '3.2' };
}

// --- Suggestions de correction -------------------------------------------

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}

/**
 * Propose la couleur la plus proche (même teinte et saturation HSL, luminosité
 * ajustée) atteignant le seuil. Chaque proposition est re-vérifiée après
 * arrondi 8 bits : le ratio renvoyé est celui de la couleur hexadécimale finale.
 * @returns {Array<{direction, hex, ratio, deltaL}>} triées par écart de luminosité croissant
 */
export function suggestColor(toAdjust, fixed, target) {
  const { h, s, l } = rgbToHsl(toAdjust);
  const results = [];
  for (const direction of ['plus-sombre', 'plus-clair']) {
    const towards = direction === 'plus-sombre' ? 0 : 1;
    const make = (L) => quantize(rgba(...hslToRgb(h, s, L), 1));
    if (contrastRatio(make(towards), fixed) < target) continue; // impossible dans ce sens
    let lo = l;
    let hi = towards;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (contrastRatio(make(mid), fixed) >= target) hi = mid;
      else lo = mid;
    }
    let candidate = make(hi);
    // Sécurité : vérification finale après arrondi, pas à pas si nécessaire.
    let L = hi;
    while (contrastRatio(candidate, fixed) < target && L >= 0 && L <= 1) {
      L += towards === 0 ? -0.001 : 0.001;
      candidate = make(clamp(L, 0, 1));
    }
    const ratio = contrastRatio(candidate, fixed);
    if (ratio >= target) {
      results.push({ direction, hex: toHex(candidate), ratio, deltaL: Math.abs(L - l) });
    }
  }
  return results.sort((x, y) => x.deltaL - y.deltaL);
}

/**
 * Évaluation complète d'une paire de couleurs.
 * opts : { sizePx, weight, type, level, backdrop }
 */
export function evaluatePair(fgInput, bgInput, opts = {}) {
  const warnings = [];
  const fgRaw = parseColor(fgInput);
  let bg = parseColor(bgInput);
  if (bg.a < 1) {
    if (!opts.backdrop) {
      throw new Error(
        `Le fond « ${bgInput} » est translucide : indiquer le fond sous-jacent réel (--backdrop). Aucune hypothèse n'est faite sur la couleur de fond.`,
      );
    }
    const backdrop = parseColor(opts.backdrop);
    if (backdrop.a < 1) throw new Error('Le fond sous-jacent (--backdrop) doit être opaque.');
    bg = composite(bg, backdrop);
    warnings.push(`Fond translucide composé sur ${opts.backdrop}.`);
  }
  bg = quantize(bg);
  const fg = quantize(fgRaw.a < 1 ? composite(fgRaw, bg) : fgRaw);
  if (fgRaw.a < 1) warnings.push('Premier plan translucide composé sur le fond.');
  for (const [label, c] of [['premier plan', fgRaw], ['fond', bg]]) {
    if (c.outOfGamut) warnings.push(`La couleur de ${label} sort du gamut sRGB : valeur écrêtée, à confirmer dans le navigateur.`);
  }

  const type = opts.type || 'text';
  const level = opts.level || 'AA';
  let large = false;
  let largeRgaa = false;
  if (type === 'text') {
    if (opts.sizePx === undefined) {
      warnings.push('Taille de texte non fournie : seuil du texte normal appliqué (le plus exigeant).');
    } else {
      large = isLargeText(opts.sizePx, opts.weight, 'wcag');
      largeRgaa = isLargeText(opts.sizePx, opts.weight, 'rgaa');
      if (large !== largeRgaa) {
        warnings.push(
          'Classement « grand texte » différent entre WCAG (14 pt gras = 18,67 px) et RGAA 4.1.2 (18,5 px gras) : les deux résultats sont fournis.',
        );
      }
    }
  }
  const ratio = contrastRatio(fg, bg);
  const required = requiredRatio({ type, large, level });
  const requiredRgaa = type === 'text' && level === 'AA' ? requiredRatio({ type, large: largeRgaa, level }) : required;
  return {
    premierPlan: toHex(fg),
    fond: toHex(bg),
    ratio,
    ratioAffiche: `${formatRatio(ratio)}:1`,
    type,
    niveau: level,
    grandTexte: type === 'text' ? large : null,
    seuil: required,
    conforme: ratio >= required,
    seuilRgaa: requiredRgaa,
    conformeRgaa: ratio >= requiredRgaa,
    criteres: criterionFor({ type, level }),
    avertissements: warnings,
  };
}
