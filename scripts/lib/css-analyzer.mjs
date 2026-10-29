// Analyse CSS légère : règles, déclarations, contexte @media, propriétés personnalisées.
// Prend en charge CSS et, de façon approximative, SCSS/Less (imbrication simple).

/** Supprime les commentaires en conservant les retours à la ligne (numéros de ligne stables). */
function stripComments(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:"'])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length)); // commentaires SCSS
}

/**
 * Retourne une liste de règles : { selector, media: [..], declarations: [{prop, value, important, line}], line }
 * Les sélecteurs imbriqués (SCSS) sont concaténés de façon simple (« & » remplacé par le parent).
 */
export function parseCss(source, startLine = 1) {
  const css = stripComments(source);
  const rules = [];
  const stack = []; // { kind: 'rule'|'at', prelude, rule }
  let buf = '';
  let line = startLine;
  let bufLine = startLine;
  let quote = null;

  const currentSelector = () => {
    const sels = stack.filter((s) => s.kind === 'rule').map((s) => s.prelude);
    if (!sels.length) return null;
    return sels.reduce((parent, child) => {
      if (!parent) return child;
      return child
        .split(',')
        .map((c) => c.trim())
        .map((c) => (c.includes('&') ? parent.split(',').map((p) => c.replace(/&/g, p.trim())).join(', ') : parent.split(',').map((p) => `${p.trim()} ${c}`).join(', ')))
        .join(', ');
    }, null);
  };
  const currentMedia = () => stack.filter((s) => s.kind === 'at').map((s) => s.prelude);

  const flushDeclaration = (text, declLine) => {
    const t = text.trim();
    if (!t) return;
    const top = stack[stack.length - 1];
    if (!top || top.kind !== 'rule') return;
    const idx = t.indexOf(':');
    if (idx <= 0) return;
    const prop = t.slice(0, idx).trim().toLowerCase();
    let value = t.slice(idx + 1).trim();
    const important = /!important\s*$/i.test(value);
    value = value.replace(/!important\s*$/i, '').trim();
    top.rule.declarations.push({ prop, value, important, line: declLine });
  };

  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '\n') line++;
    if (quote) {
      buf += ch;
      if (ch === quote && css[i - 1] !== '\\') quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      buf += ch;
      continue;
    }
    if (ch === '{') {
      // Une déclaration terminée sans « ; » avant un bloc imbriqué est rare : on traite le tampon comme prélude
      const prelude = buf.trim();
      buf = '';
      if (prelude.startsWith('@')) {
        stack.push({ kind: 'at', prelude, line: bufLine });
      } else if (/^(from|to|\d+(\.\d+)?%)(\s*,\s*(from|to|\d+(\.\d+)?%))*$/i.test(prelude) && stack.some((s) => s.kind === 'at' && /keyframes/i.test(s.prelude))) {
        stack.push({ kind: 'keyframe', prelude, line: bufLine });
      } else {
        stack.push({ kind: 'rule', prelude, line: bufLine });
        const rule = { selector: currentSelector(), media: currentMedia(), declarations: [], line: bufLine };
        stack[stack.length - 1].rule = rule;
        rules.push(rule);
      }
      bufLine = line;
      continue;
    }
    if (ch === ';') {
      if (stack.length && stack[stack.length - 1].kind === 'rule') flushDeclaration(buf, bufLine);
      buf = '';
      bufLine = line;
      continue;
    }
    if (ch === '}') {
      if (stack.length && stack[stack.length - 1].kind === 'rule') flushDeclaration(buf, bufLine);
      buf = '';
      stack.pop();
      bufLine = line;
      continue;
    }
    if (!buf.trim()) bufLine = line;
    buf += ch;
  }
  // Règles @keyframes : on les renvoie à part
  return rules;
}

/** Liste des @keyframes et @media présents (pour les heuristiques globales). */
export function atRules(source) {
  const css = stripComments(source);
  return {
    keyframes: [...css.matchAll(/@(?:-webkit-)?keyframes\s+([\w-]+)/g)].map((m) => m[1]),
    reducedMotion: /prefers-reduced-motion/.test(css),
  };
}

/** Collecte les propriétés personnalisées (--x: valeur) par contexte. */
export function collectCustomProperties(rules) {
  const vars = new Map(); // nom -> [{ value, selector, media }]
  for (const r of rules) {
    for (const d of r.declarations) {
      if (d.prop.startsWith('--')) {
        if (!vars.has(d.prop)) vars.set(d.prop, []);
        vars.get(d.prop).push({ value: d.value, selector: r.selector, media: r.media });
      }
    }
  }
  return vars;
}

/**
 * Résout var(--x[, repli]) avec les valeurs définies dans un contexte compatible.
 * Stratégie prudente : si une variable a plusieurs valeurs différentes (thèmes),
 * on préfère celle du même sélecteur/média, sinon celle de :root/html sans média ;
 * on signale l'ambiguïté.
 */
export function resolveVars(value, vars, context = {}, depth = 0) {
  let ambiguous = false;
  if (depth > 10) return { value, unresolved: true, ambiguous };
  let unresolved = false;
  const out = value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g, (m, name, fallback) => {
    const defs = vars.get(name);
    if (!defs || !defs.length) {
      if (fallback) return fallback.trim();
      unresolved = true;
      return m;
    }
    const sameMedia = (d) => JSON.stringify(d.media) === JSON.stringify(context.media || []);
    let pick =
      defs.find((d) => d.selector === context.selector && sameMedia(d)) ||
      defs.find((d) => /(^|,\s*)(:root|html)(\s*,|$)/.test(d.selector || '') && sameMedia(d)) ||
      defs.find((d) => /(^|,\s*)(:root|html)(\s*,|$)/.test(d.selector || '') && !(d.media || []).length) ||
      defs[0];
    if (new Set(defs.map((d) => d.value)).size > 1) ambiguous = true;
    const r = resolveVars(pick.value, vars, context, depth + 1);
    if (r.unresolved) unresolved = true;
    if (r.ambiguous) ambiguous = true;
    return r.value;
  });
  return { value: out, unresolved, ambiguous };
}

/** Extrait une couleur d'une valeur de « background » abrégée (null si image ou dégradé). */
export function backgroundColorFrom(value) {
  if (/url\(|gradient\(|image-set\(/i.test(value)) return { color: null, image: true };
  const tokens = value.match(/#[0-9a-f]{3,8}\b|(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^)]*\)|\b[a-z]+\b/gi) || [];
  for (const t of tokens) {
    if (/^(none|repeat|no-repeat|repeat-x|repeat-y|center|top|bottom|left|right|fixed|scroll|local|cover|contain|auto|border-box|padding-box|content-box|initial|inherit|unset|space|round)$/i.test(t)) continue;
    return { color: t, image: false };
  }
  return { color: null, image: false };
}
