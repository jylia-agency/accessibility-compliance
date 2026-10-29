// Fonctions injectées dans la page (contexte navigateur). Aucune dépendance.
// Ce fichier est lu par dynamic-audit.mjs et évalué via page.addInitScript / page.evaluate.
// Il ne modifie pas le DOM de façon persistante (sauf simulations explicitement annulées).

window.__a11y = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  /** Convertit toute couleur CSS calculée en RGBA 8 bits sRGB via le moteur du navigateur. */
  function toRgba(cssColor) {
    if (!cssColor || cssColor === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    const m = cssColor.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
    if (m) {
      let a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      return { r: +m[1], g: +m[2], b: +m[3], a };
    }
    // Espaces modernes (oklch, lab, color()...) : rendu via canvas
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = cssColor;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
  }

  function over(fg, bg) {
    const a = fg.a + bg.a * (1 - fg.a);
    if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
    return {
      r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a,
      g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a,
      b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a,
      a,
    };
  }

  function lum({ r, g, b }) {
    const f = (c) => {
      c /= 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }
  function ratio(a, b) {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  }
  const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();

  function cssPath(el) {
    if (!(el instanceof Element)) return '';
    const parts = [];
    while (el && el.nodeType === 1 && parts.length < 5) {
      let p = el.nodeName.toLowerCase();
      if (el.id) {
        parts.unshift(`${p}#${CSS.escape(el.id)}`);
        break;
      }
      const cls = [...el.classList].slice(0, 2).map((c) => '.' + CSS.escape(c)).join('');
      const parent = el.parentElement;
      if (parent) {
        const same = [...parent.children].filter((c) => c.nodeName === el.nodeName);
        if (same.length > 1) p += `:nth-of-type(${same.indexOf(el) + 1})`;
      }
      parts.unshift(p + cls);
      el = el.parentElement;
    }
    return parts.join(' > ');
  }

  function isVisible(el) {
    const st = getComputedStyle(el);
    if (st.visibility !== 'visible' || st.display === 'none') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  /** Contenu masqué visuellement (hors écran, rognage 1 px) : contraste non évaluable dans cet état. */
  function visuallyHidden(el) {
    const r = el.getBoundingClientRect();
    const docW = document.documentElement.scrollWidth;
    if (r.right + scrollX <= 0 || r.left + scrollX >= docW || r.bottom + scrollY <= 0) return true;
    if (r.width <= 1 || r.height <= 1) return true;
    for (let e = el; e; e = e.parentElement) {
      const st = getComputedStyle(e);
      if (/rect\(0(px)?,? 0(px)?,? 0(px)?,? 0(px)?\)/.test(st.clip) || /inset\(50%\)/.test(st.clipPath)) return true;
    }
    return false;
  }

  function effectiveOpacity(el) {
    let o = 1;
    for (let e = el; e; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity);
    return o;
  }

  /** Fond effectif : composition des fonds des ancêtres ; null si image, dégradé ou superposition. */
  function effectiveBackground(el) {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const st = getComputedStyle(e);
      if (st.backgroundImage && st.backgroundImage !== 'none') return { undetermined: `image ou dégradé de fond sur ${cssPath(e)}` };
      const c = toRgba(st.backgroundColor);
      if (c.a > 0) layers.push(c);
      if (c.a >= 1) break;
    }
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    const scheme = getComputedStyle(document.documentElement).colorScheme || '';
    const canvasNote = layers.length === 0 || layers[layers.length - 1].a < 1;
    if (canvasNote && /dark/.test(scheme) && matchMedia('(prefers-color-scheme: dark)').matches) {
      return { undetermined: 'fond du canevas sombre (color-scheme) non déterminable' };
    }
    for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
    return { color: bg, canvas: canvasNote };
  }

  function overlapping(el) {
    const r = el.getBoundingClientRect();
    const x = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1);
    const y = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
    if (r.bottom < 0 || r.top > innerHeight) return null;
    const stack = document.elementsFromPoint(x, y);
    const idx = stack.indexOf(el);
    const above = idx === -1 ? stack : stack.slice(0, idx);
    for (const s of above) {
      if (el.contains(s) || s.contains(el)) continue;
      const st = getComputedStyle(s);
      if (toRgba(st.backgroundColor).a > 0 || st.backgroundImage !== 'none') return cssPath(s);
    }
    for (const s of stack.slice(idx + 1)) {
      if (s.contains(el)) continue;
      const st = getComputedStyle(s);
      if (toRgba(st.backgroundColor).a > 0 || st.backgroundImage !== 'none') return `${cssPath(s)} (placé sous le texte, hors ancêtres)`;
    }
    return null;
  }

  function directText(el) {
    let t = '';
    for (const n of el.childNodes) if (n.nodeType === 3) t += n.textContent;
    return t.replace(/\s+/g, ' ').trim();
  }

  function contrastScan() {
    const results = { failures: [], undetermined: [], tested: 0, skippedDisabled: 0, skippedHidden: 0 };
    const all = document.body ? document.body.querySelectorAll('*') : [];
    for (const el of all) {
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'svg'].includes(el.nodeName)) continue;
      const text = directText(el);
      const isPlaceholder = (el.nodeName === 'INPUT' || el.nodeName === 'TEXTAREA') && el.placeholder && !el.value;
      const isInputValue = (el.nodeName === 'INPUT' && !['hidden', 'checkbox', 'radio', 'range', 'color', 'file', 'image'].includes(el.type) && el.value) || (el.nodeName === 'SELECT');
      if (!text && !isPlaceholder && !isInputValue) continue;
      if (!isVisible(el)) continue;
      if (visuallyHidden(el)) {
        results.skippedHidden++;
        continue;
      }
      if (el.closest(':disabled, [aria-disabled="true"]')) {
        results.skippedDisabled++;
        continue;
      }
      const st = getComputedStyle(el);
      const op = effectiveOpacity(el);
      const sample = (text || el.placeholder || el.value || '').slice(0, 60);
      const base = { selector: cssPath(el), texte: sample };
      if (op < 1) {
        results.undetermined.push({ ...base, raison: `opacité effective ${op.toFixed(2)}` });
        continue;
      }
      const bgInfo = effectiveBackground(el);
      if (bgInfo.undetermined) {
        results.undetermined.push({ ...base, raison: bgInfo.undetermined });
        continue;
      }
      const ov = overlapping(el);
      if (ov) {
        results.undetermined.push({ ...base, raison: `superposition d’un autre élément : ${ov}` });
        continue;
      }
      const pairs = [];
      if (text || isInputValue) pairs.push({ kind: 'texte', color: st.color });
      if (isPlaceholder) pairs.push({ kind: 'placeholder', color: getComputedStyle(el, '::placeholder').color });
      for (const p of pairs) {
        const fg0 = toRgba(p.color);
        const fg = fg0.a < 1 ? over(fg0, bgInfo.color) : fg0;
        const size = parseFloat(st.fontSize);
        const weight = parseInt(st.fontWeight, 10) || 400;
        const largeWcag = size >= 24 || (weight >= 700 && size >= 18.6666);
        const largeRgaa = size >= 24 || (weight >= 700 && size >= 18.5);
        const r = ratio(fg, bgInfo.color);
        results.tested++;
        const req = largeWcag ? 3 : 4.5;
        const reqRgaa = largeRgaa ? 3 : 4.5;
        if (r < req || r < reqRgaa) {
          results.failures.push({
            ...base,
            nature: p.kind,
            premierPlan: hex(fg),
            fond: hex(bgInfo.color),
            ratio: r,
            seuilWcag: req,
            seuilRgaa: reqRgaa,
            taillePx: size,
            graisse: weight,
            fondCanevas: bgInfo.canvas,
            ombreTexte: st.textShadow !== 'none' ? st.textShadow : null,
            logoProbable: /logo/i.test(el.className + ' ' + (el.closest('[class*="logo" i], [id*="logo" i]') ? 'logo' : '')),
          });
        }
      }
    }
    return results;
  }

  function nonTextContrastScan() {
    const out = [];
    for (const el of document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=submit]):not([type=button]), select, textarea')) {
      if (!isVisible(el) || el.disabled) continue;
      const st = getComputedStyle(el);
      const parentBg = effectiveBackground(el.parentElement || document.body);
      if (parentBg.undetermined) continue;
      const ownBgL = toRgba(st.backgroundColor);
      const ownBg = ownBgL.a > 0 ? over(ownBgL, parentBg.color) : parentBg.color;
      const bw = parseFloat(st.borderBottomWidth);
      const border = bw > 0 && st.borderBottomStyle !== 'none' ? over(toRgba(st.borderBottomColor), parentBg.color) : null;
      const rBorder = border ? ratio(border, parentBg.color) : 0;
      const rFill = ratio(ownBg, parentBg.color);
      if (Math.max(rBorder, rFill) < 3) {
        out.push({ selector: cssPath(el), bordure: border ? hex(border) : 'aucune', fondChamp: hex(ownBg), fondAdjacent: hex(parentBg.color), ratioBordure: rBorder, ratioFond: rFill });
      }
    }
    return out;
  }

  function describe(el) {
    if (!el || el === document.body || el === document.documentElement) return null;
    const r = el.getBoundingClientRect();
    const name = (el.getAttribute('aria-label') || el.innerText || el.value || el.getAttribute('title') || el.getAttribute('alt') || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    return {
      selector: cssPath(el),
      tag: el.nodeName.toLowerCase(),
      role: el.getAttribute('role'),
      nom: name,
      rect: { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height },
    };
  }

  function focusStyleSignature(el) {
    const st = getComputedStyle(el);
    return [st.outlineStyle, st.outlineWidth, st.outlineColor, st.boxShadow, st.borderColor, st.backgroundColor, st.color, st.textDecorationLine].join('|');
  }

  /** L'élément focalisé est-il entièrement masqué par d'autres contenus (2.4.11) ? */
  function obscured(el) {
    const r = el.getBoundingClientRect();
    const xs = [r.left + 2, r.left + r.width / 2, r.right - 2];
    const ys = [r.top + 2, r.top + r.height / 2, r.bottom - 2];
    let visiblePoints = 0;
    let total = 0;
    let coveredBy = null;
    for (const x of xs) for (const y of ys) {
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
      total++;
      const hit = document.elementFromPoint(x, y);
      if (hit && (hit === el || el.contains(hit) || hit.contains(el))) visiblePoints++;
      else coveredBy = hit ? cssPath(hit) : coveredBy;
    }
    if (total === 0) return { obscured: true, raison: 'hors de la zone visible' };
    return { obscured: visiblePoints === 0, coveredBy };
  }

  function focusables() {
    const sel = 'a[href], area[href], button, input:not([type=hidden]), select, textarea, iframe, summary, [tabindex], [contenteditable=""], [contenteditable="true"], audio[controls], video[controls]';
    return [...document.querySelectorAll(sel)].filter((e) => !e.disabled && isVisible(e) && e.tabIndex >= 0);
  }

  function targets() {
    const sel = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [role=checkbox], [role=radio], [role=switch], [role=tab], [role=menuitem], [onclick]';
    return [...document.querySelectorAll(sel)].filter((e) => isVisible(e));
  }

  function targetSizeScan() {
    const ts = targets().map((e) => ({ e, r: e.getBoundingClientRect() }));
    const small = ts.filter((t) => t.r.width < 24 || t.r.height < 24);
    const out = [];
    for (const t of small) {
      const el = t.e;
      // Exception « en ligne » : cible dans une phrase ou un bloc de texte
      const parent = el.parentElement;
      const inline = getComputedStyle(el).display === 'inline' && parent && [...parent.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (inline) continue;
      // Exception « agent utilisateur » : contrôle natif non stylé (approximation : case/radio sans style d'apparence)
      if (el.matches('input[type=checkbox], input[type=radio]') && getComputedStyle(el).appearance !== 'none') {
        out.push({ ...describe(el), taille: `${t.r.width.toFixed(1)} × ${t.r.height.toFixed(1)}`, exception: 'contrôle natif non stylé : exception « agent utilisateur » possible' });
        continue;
      }
      const cx = t.r.left + t.r.width / 2;
      const cy = t.r.top + t.r.height / 2;
      let conflict = null;
      for (const o of ts) {
        if (o === t || o.e.contains(el) || el.contains(o.e)) continue;
        const dx = Math.max(o.r.left - cx, 0, cx - o.r.right);
        const dy = Math.max(o.r.top - cy, 0, cy - o.r.bottom);
        if (Math.hypot(dx, dy) < 12) {
          conflict = cssPath(o.e);
          break;
        }
        const oSmall = o.r.width < 24 || o.r.height < 24;
        if (oSmall) {
          const ox = o.r.left + o.r.width / 2;
          const oy = o.r.top + o.r.height / 2;
          if (Math.hypot(ox - cx, oy - cy) < 24) {
            conflict = `${cssPath(o.e)} (cercles de 24 px qui se chevauchent)`;
            break;
          }
        }
      }
      if (conflict) out.push({ ...describe(el), taille: `${t.r.width.toFixed(1)} × ${t.r.height.toFixed(1)}`, conflit: conflict });
    }
    return out;
  }

  /** Éléments rognés (overflow hidden/clip) dont le contenu dépasse. */
  function clippedElements() {
    const out = [];
    for (const el of document.body.querySelectorAll('*')) {
      if (!isVisible(el) || !el.innerText || !el.innerText.trim()) continue;
      const st = getComputedStyle(el);
      const hidesX = /hidden|clip/.test(st.overflowX);
      const hidesY = /hidden|clip/.test(st.overflowY);
      if ((hidesY && el.scrollHeight > el.clientHeight + 2) || (hidesX && el.scrollWidth > el.clientWidth + 2) || (st.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 2)) {
        out.push({ selector: cssPath(el), texte: el.innerText.replace(/\s+/g, ' ').trim().slice(0, 60), dimensions: `${el.clientWidth}×${el.clientHeight} (contenu ${el.scrollWidth}×${el.scrollHeight})` });
      }
    }
    return out;
  }

  function horizontalOverflow() {
    const vw = document.documentElement.clientWidth;
    const overflow = document.documentElement.scrollWidth > vw + 1;
    const culprits = [];
    if (overflow) {
      for (const el of document.body.querySelectorAll('*')) {
        if (!isVisible(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.right > vw + 1 && !(el.parentElement && el.parentElement.getBoundingClientRect().right > vw + 1)) {
          culprits.push({ selector: cssPath(el), tag: el.nodeName.toLowerCase(), largeur: Math.round(r.width) });
        }
        if (culprits.length >= 10) break;
      }
    }
    return { overflow, scrollWidth: document.documentElement.scrollWidth, viewport: vw, culprits };
  }

  function pageFacts() {
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')].filter(isVisible).map((h) => ({ niveau: h.getAttribute('aria-level') || h.nodeName[1], texte: h.innerText.trim().slice(0, 80) }));
    const landmarks = [...document.querySelectorAll('header, nav, main, aside, footer, [role=banner], [role=navigation], [role=main], [role=complementary], [role=contentinfo], [role=search], form[aria-label], form[aria-labelledby], section[aria-label], section[aria-labelledby]')].map((l) => `${l.nodeName.toLowerCase()}${l.getAttribute('role') ? `[role=${l.getAttribute('role')}]` : ''}${l.getAttribute('aria-label') ? ` « ${l.getAttribute('aria-label')} »` : ''}`);
    return {
      lang: document.documentElement.getAttribute('lang'),
      titre: document.title,
      titres: headings,
      regions: landmarks,
      documents: [...document.querySelectorAll('a[href]')].map((a) => a.href).filter((h) => /\.(pdf|docx?|odt|xlsx?|ods|pptx?|odp|rtf|epub)(\?|#|$)/i.test(h)),
    };
  }

  function animations() {
    return document.getAnimations().filter((a) => a.playState === 'running').map((a) => {
      const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : {};
      const target = a.effect && a.effect.target;
      return { selector: target ? cssPath(target) : null, nom: a.animationName || a.transitionProperty || a.id || '', iterations: t.iterations === Infinity ? 'infinie' : t.iterations, dureeMs: t.duration };
    });
  }

  function clickableCandidates() {
    const out = [];
    for (const el of document.body.querySelectorAll('*')) {
      if (!isVisible(el)) continue;
      const st = getComputedStyle(el);
      const role = el.getAttribute('role');
      if (el.hasAttribute('onclick') || st.cursor === 'pointer' || ['button', 'link', 'checkbox', 'tab', 'menuitem', 'switch'].includes(role)) out.push(el);
    }
    window.__a11yCandidates = out;
    return out.length;
  }

  return { contrastScan, nonTextContrastScan, describe, focusStyleSignature, obscured, focusables, targetSizeScan, clippedElements, horizontalOverflow, pageFacts, animations, clickableCandidates, cssPath, isVisible };
})();
