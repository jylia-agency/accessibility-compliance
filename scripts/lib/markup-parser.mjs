// Analyseur de balisage tolérant pour HTML, JSX/TSX, gabarits Vue, Svelte et Angular.
//
// Ce n'est PAS un analyseur HTML conforme : il construit un arbre approximatif
// suffisant pour des heuristiques d'audit (présence d'attributs, contenu textuel,
// imbrication). Les résultats doivent être confirmés par l'analyse dynamique ou
// une vérification humaine lorsqu'ils dépendent du rendu.

const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
]);
const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title']);

export class Node {
  constructor(tag, attrs, line, parent) {
    this.tag = tag; // nom tel qu'écrit (casse conservée pour les composants)
    this.name = /^[a-z]/.test(tag) ? tag.toLowerCase() : tag;
    this.attrs = attrs; // Map nom normalisé -> { raw, value, dynamic, line }
    this.line = line;
    this.parent = parent;
    this.children = [];
    this.text = []; // fragments de texte directs : { value, dynamic }
    this.spread = attrs.has('...spread');
  }
  get isComponent() {
    return /^[A-Z]/.test(this.tag) || this.tag.includes('.') || (this.tag.includes('-') && !this.tag.startsWith('svg'));
  }
  attr(name) {
    return this.attrs.get(name);
  }
  has(name) {
    return this.attrs.has(name);
  }
  /** Valeur statique de l'attribut (undefined si absent, null si dynamique). */
  value(name) {
    const a = this.attrs.get(name);
    if (!a) return undefined;
    return a.dynamic ? null : a.value;
  }
  *descendants() {
    for (const c of this.children) {
      yield c;
      yield* c.descendants();
    }
  }
  ancestors() {
    const out = [];
    for (let p = this.parent; p && p.tag !== '#root'; p = p.parent) out.push(p);
    return out;
  }
  /** Texte visible approximatif : { text, dynamic } (dynamic = contient une expression non résolue). */
  textContent() {
    let text = '';
    let dynamic = false;
    const walk = (n) => {
      for (const t of n.text) {
        if (t.dynamic) dynamic = true;
        else text += t.value;
      }
      for (const c of n.children) {
        if (c.name === 'script' || c.name === 'style') continue;
        if (c.value('aria-hidden') === 'true') continue;
        if (c.isComponent) dynamic = true; // contenu rendu inconnu
        walk(c);
      }
    };
    walk(this);
    return { text: text.replace(/\s+/g, ' ').trim(), dynamic };
  }
}

/**
 * Normalise les noms d'attributs des différents frameworks :
 * className -> class, htmlFor -> for, tabIndex -> tabindex, :alt / v-bind:alt / [alt] / [attr.alt] / bind:alt -> alt,
 * @click / v-on:click / (click) / on:click / onClick -> onclick.
 * Retourne { name, dynamic } ; dynamic = la valeur est une expression.
 */
export function normalizeAttrName(raw) {
  let name = raw;
  let dynamic = false;
  let m;
  if ((m = name.match(/^v-bind:(.+)$/)) || (m = name.match(/^:(.+)$/))) {
    name = m[1];
    dynamic = true;
  } else if ((m = name.match(/^\[attr\.(.+)\]$/)) || (m = name.match(/^\[(.+)\]$/))) {
    name = m[1];
    dynamic = true;
  } else if ((m = name.match(/^bind:(.+)$/))) {
    name = m[1];
    dynamic = true;
  } else if ((m = name.match(/^(?:v-on:|@)([a-z]+)/i)) || (m = name.match(/^\(([a-z]+)[^)]*\)$/i)) || (m = name.match(/^on:([a-z]+)/i))) {
    name = `on${m[1].toLowerCase()}`;
    dynamic = true;
  } else if (/^on[A-Z]/.test(name)) {
    name = name.toLowerCase();
  }
  const aliases = { classname: 'class', htmlfor: 'for', tabindex: 'tabindex', autocomplete: 'autocomplete', autoplay: 'autoplay' };
  const lower = name.includes('-') || name.includes(':') ? name.toLowerCase() : name.toLowerCase();
  return { name: aliases[lower] || lower, dynamic };
}

/** Pour les fichiers JS/TS : un « < » ouvre-t-il du JSX ? */
function looksLikeJsxStart(src, i) {
  let j = i - 1;
  while (j >= 0 && /\s/.test(src[j])) j--;
  if (j < 0) return true;
  const prev = src[j];
  if ('(=,?:&|[{}>;!'.includes(prev)) return true;
  // mot-clé « return », « yield », « default », « case », « in »
  const before = src.slice(Math.max(0, j - 7), j + 1);
  return /(?:^|[^\w$])(return|yield|default|case|in|of|do|else)$/.test(before);
}

/**
 * Analyse un fichier et renvoie la racine de l'arbre.
 * mode : 'html' | 'jsx' | 'vue' | 'svelte' | 'angular'
 */
export function parseMarkup(source, mode = 'html', offsetLine = 1) {
  const root = new Node('#root', new Map(), offsetLine, null);
  let cur = root;
  let i = 0;
  let line = offsetLine;
  const n = source.length;
  const isJs = mode === 'jsx';

  const advance = (to) => {
    for (let k = i; k < to; k++) if (source.charCodeAt(k) === 10) line++;
    i = to;
  };

  const pushText = (value, dynamic = false) => {
    if (!value && !dynamic) return;
    cur.text.push({ value, dynamic });
  };

  // Lit une expression entre accolades équilibrées (JSX / Svelte / mustache), renvoie l'index après la fermeture
  const skipBraces = (start) => {
    let depth = 0;
    let k = start;
    let quote = null;
    while (k < n) {
      const ch = source[k];
      if (quote) {
        if (ch === '\\') k++;
        else if (ch === quote) quote = null;
      } else if (ch === '"' || ch === "'" || ch === '`') quote = ch;
      else if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return k + 1;
      }
      k++;
    }
    return n;
  };

  while (i < n) {
    const ch = source[i];

    // Commentaires HTML
    if (source.startsWith('<!--', i)) {
      const end = source.indexOf('-->', i + 4);
      advance(end === -1 ? n : end + 3);
      continue;
    }
    // Doctype et instructions
    if (source.startsWith('<!', i) || source.startsWith('<?', i)) {
      const end = source.indexOf('>', i);
      if (/^<!doctype/i.test(source.slice(i, i + 9))) root.doctype = true;
      advance(end === -1 ? n : end + 1);
      continue;
    }

    if (isJs && cur === root) {
      // En dehors du JSX : sauter chaînes et commentaires JS pour éviter les faux départs
      if (ch === '/' && source[i + 1] === '/') {
        const end = source.indexOf('\n', i);
        advance(end === -1 ? n : end);
        continue;
      }
      if (ch === '/' && source[i + 1] === '*') {
        const end = source.indexOf('*/', i + 2);
        advance(end === -1 ? n : end + 2);
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        let k = i + 1;
        while (k < n && source[k] !== ch) {
          if (source[k] === '\\') k++;
          k++;
        }
        advance(Math.min(n, k + 1));
        continue;
      }
    }

    if (ch === '{' && cur !== root && (isJs || mode === 'svelte' || mode === 'vue' || mode === 'angular')) {
      // Expression dans le contenu : texte dynamique. En JSX, l'expression peut contenir du JSX imbriqué.
      const end = skipBraces(i);
      const inner = source.slice(i + 1, end - 1);
      if (isJs && /<[A-Za-z]/.test(inner)) {
        const sub = parseMarkup(inner, 'jsx', line);
        for (const c of sub.children) {
          c.parent = cur;
          cur.children.push(c);
        }
        if (/\S/.test(inner.replace(/<[\s\S]*>/g, '').replace(/[()&|?:\s]|null|undefined|false|true/g, ''))) {
          pushText('', true);
        }
      } else if (!/^\s*(\/\*[\s\S]*\*\/)?\s*$/.test(inner)) {
        // {/* commentaire */} n'est pas du texte
        pushText('', true);
      }
      advance(end);
      continue;
    }

    if (ch === '<') {
      // Balise fermante
      if (source[i + 1] === '/') {
        const end = source.indexOf('>', i);
        const tag = source.slice(i + 2, end).trim();
        advance(end === -1 ? n : end + 1);
        if (cur === root) continue;
        // Fragment JSX </>
        const target = tag === '' ? '#fragment' : tag;
        let p = cur;
        while (p && p !== root && p.tag !== target && p.name !== target.toLowerCase()) p = p.parent;
        if (p && p !== root) cur = p.parent;
        continue;
      }
      // Fragment JSX ouvrant <>
      if (isJs && source[i + 1] === '>') {
        if (cur === root && !looksLikeJsxStart(source, i)) {
          advance(i + 1);
          continue;
        }
        const node = new Node('#fragment', new Map(), line, cur);
        cur.children.push(node);
        cur = node;
        advance(i + 2);
        continue;
      }
      const m = /^<([A-Za-z][\w.:-]*)/.exec(source.slice(i, i + 100));
      if (!m || (isJs && cur === root && !looksLikeJsxStart(source, i))) {
        if (cur !== root) pushText(ch);
        advance(i + 1);
        continue;
      }
      const tag = m[1];
      const tagLine = line;
      let k = i + m[0].length;
      const attrs = new Map();
      let selfClosing = false;
      // Lecture des attributs
      while (k < n) {
        while (k < n && /\s/.test(source[k])) k++;
        if (source[k] === '/' && source[k + 1] === '>') {
          selfClosing = true;
          k += 2;
          break;
        }
        if (source[k] === '>') {
          k++;
          break;
        }
        if (source[k] === '{') {
          // {...props} ou attribut Svelte abrégé {alt}
          const end = skipBraces(k);
          const inner = source.slice(k + 1, end - 1).trim();
          if (inner.startsWith('...')) attrs.set('...spread', { raw: inner, value: null, dynamic: true, line });
          else if (/^[\w$]+$/.test(inner)) attrs.set(inner.toLowerCase(), { raw: inner, value: null, dynamic: true, line });
          k = end;
          continue;
        }
        const am = /^[^\s=>/]+/.exec(source.slice(k, k + 200));
        if (!am) {
          k++;
          continue;
        }
        const rawName = am[0];
        k += rawName.length;
        while (k < n && /\s/.test(source[k])) k++;
        let value = '';
        let dynamic = false;
        let present = true;
        if (source[k] === '=') {
          k++;
          while (k < n && /\s/.test(source[k])) k++;
          const q = source[k];
          if (q === '"' || q === "'") {
            const end = source.indexOf(q, k + 1);
            value = source.slice(k + 1, end === -1 ? n : end);
            k = end === -1 ? n : end + 1;
          } else if (q === '{') {
            const end = skipBraces(k);
            const expr = source.slice(k + 1, end - 1).trim();
            // Littéraux simples : {"texte"} {'texte'} {`texte`} {-1} {false}
            const lit = expr.match(/^(["'`])([^"'`$]*)\1$/);
            if (lit) value = lit[2];
            else if (/^-?\d+$/.test(expr)) value = expr;
            else if (expr === 'true' || expr === 'false') value = expr;
            else {
              value = expr;
              dynamic = true;
            }
            k = end;
          } else {
            const vm = /^[^\s>]+/.exec(source.slice(k));
            value = vm ? vm[0] : '';
            k += value.length;
          }
          if (/\{\{.*\}\}/.test(value)) dynamic = true; // interpolation Vue/Angular
        } else {
          present = true;
          value = '';
        }
        const norm = normalizeAttrName(rawName);
        if (present) attrs.set(norm.name, { raw: rawName, value, dynamic: dynamic || norm.dynamic, line });
      }
      const node = new Node(tag, attrs, tagLine, cur);
      cur.children.push(node);
      advance(k);
      const lname = tag.toLowerCase();
      if (selfClosing || (VOID.has(lname) && /^[a-z]/.test(tag))) continue;
      if (RAW_TEXT.has(lname) && !isJs) {
        const close = source.toLowerCase().indexOf(`</${lname}`, i);
        const end = close === -1 ? n : close;
        node.text.push({ value: source.slice(i, end), dynamic: false });
        node.rawContent = source.slice(i, end);
        node.rawLine = line;
        advance(end);
        const gt = source.indexOf('>', i);
        advance(gt === -1 ? n : gt + 1);
        continue;
      }
      cur = node;
      continue;
    }

    if (cur !== root) {
      // Interpolations {{ }} Vue / Angular
      if (source.startsWith('{{', i)) {
        const end = source.indexOf('}}', i);
        pushText('', true);
        advance(end === -1 ? n : end + 2);
        continue;
      }
      // Texte brut jusqu'au prochain caractère spécial
      let k = i;
      while (k < n && source[k] !== '<' && source[k] !== '{') k++;
      if (k === i) k++;
      pushText(decodeEntities(source.slice(i, k)));
      advance(k);
      continue;
    }
    advance(i + 1);
  }
  return root;
}

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));
}

/** Extrait les blocs <template> (Vue), ou renvoie le fichier entier. */
export function extractTemplates(source, mode) {
  if (mode !== 'vue') return [{ code: source, line: 1 }];
  const blocks = [];
  const re = /<template(\s[^>]*)?>/g;
  const m = re.exec(source);
  if (!m) return blocks;
  // Trouver la fermeture correspondant au premier <template> (les <template> imbriqués sont comptés)
  let depth = 1;
  const tagRe = /<\/?template(\s[^>]*)?>/g;
  tagRe.lastIndex = m.index + m[0].length;
  let t;
  while ((t = tagRe.exec(source))) {
    depth += t[0].startsWith('</') ? -1 : 1;
    if (depth === 0) {
      const start = m.index + m[0].length;
      blocks.push({ code: source.slice(start, t.index), line: source.slice(0, start).split('\n').length });
      break;
    }
  }
  return blocks;
}

/** Extrait les styles embarqués (<style> HTML/Vue/Svelte) avec leur ligne de départ. */
export function extractStyleBlocks(source) {
  const out = [];
  const re = /<style(\s[^>]*)?>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = re.exec(source))) {
    const start = m.index + m[0].indexOf('>') + 1;
    out.push({ code: m[2], line: source.slice(0, start).split('\n').length });
  }
  return out;
}
