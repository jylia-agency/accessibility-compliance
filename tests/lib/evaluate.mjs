// Comparaison des résultats des scripts avec les résultats attendus des fixtures.
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { scan } from '../../scripts/static-scan.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, '..', '..');
export const FIXTURES = join(ROOT, 'tests', 'fixtures');

const norm = (p) => p.split('\\').join('/');

export function evaluateStatic(fixture) {
  const dir = join(FIXTURES, fixture);
  const expected = JSON.parse(readFileSync(join(dir, 'expected.json'), 'utf8'));
  const result = scan(dir);
  const matched = new Set();
  const tp = [];
  const fn = [];
  for (const e of expected.statique) {
    const f = result.constats.find((c) => !matched.has(c) && c.regle === e.regle && norm(c.fichier) === e.fichier && (c.extrait || '').includes(e.contient));
    if (f && f.categorie === e.categorie) {
      matched.add(f);
      tp.push({ attendu: e, constat: f.id });
    } else fn.push({ attendu: e, obtenu: f ? `catégorie « ${f.categorie} »` : 'aucun constat' });
  }
  const unexpected = [];
  for (const n of expected.nonAttendusStatique || []) {
    const f = result.constats.find((c) => (n.regle === '*' || c.regle === n.regle) && norm(c.fichier) === n.fichier && (c.extrait || '').includes(n.contient));
    if (f) unexpected.push({ interdit: n, constat: f });
  }
  const forbidden = expected.categoriesInterditesStatique || [];
  // Faux positifs : constats Échec/Risque non attendus
  const fp = result.constats.filter((c) => !matched.has(c) && (forbidden.includes(c.categorie) || (!forbidden.length && ['Échec vérifié', 'Risque potentiel'].includes(c.categorie))));
  const unmatchedOther = result.constats.filter((c) => !matched.has(c) && !fp.includes(c));
  return { fixture, result, tp, fn, fp, unexpected, unmatchedOther };
}

export function findPlaywright() {
  try {
    const root = execFileSync('npm', ['root', '-g'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (existsSync(join(root, 'playwright'))) return true;
  } catch {
    /* ignore */
  }
  return existsSync(join(ROOT, 'node_modules', 'playwright'));
}

export function runDynamic(fixture, { colorScheme, dialogTriggers = [] } = {}) {
  const dir = join(FIXTURES, fixture);
  const out = mkdtempSync(join(tmpdir(), `a11y-test-${fixture}-`));
  const args = [join(ROOT, 'scripts', 'dynamic-audit.mjs'), join(dir, 'index.html'), '--out', out, '--no-axe'];
  for (const t of dialogTriggers) args.push('--dialog-trigger', t);
  if (colorScheme) args.push('--color-scheme', colorScheme);
  try {
    execFileSync(process.execPath, args, { stdio: 'ignore', timeout: 240000 });
    return JSON.parse(readFileSync(join(out, 'resultats-dynamiques.json'), 'utf8'));
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

export function evaluateDynamic(fixture) {
  const expected = JSON.parse(readFileSync(join(FIXTURES, fixture, 'expected.json'), 'utf8')).dynamique;
  const themes = expected.themes || [null];
  const runs = themes.map((theme) => ({ theme, result: runDynamic(fixture, { colorScheme: theme, dialogTriggers: expected.declencheursDialogue }) }));
  const all = runs.flatMap((r) => r.result.constats.map((c) => ({ ...c, theme: r.theme })));
  const matched = new Set();
  const tp = [];
  const fn = [];
  for (const e of expected.attendus) {
    const f = all.find((c) => !matched.has(c) && c.regle === e.regle && (c.element || '').includes(e.element));
    if (f && f.categorie === e.categorie) {
      matched.add(f);
      tp.push({ attendu: e, constat: f.id });
    } else fn.push({ attendu: e, obtenu: f ? `catégorie « ${f.categorie} »` : 'aucun constat' });
  }
  const unexpected = [];
  for (const n of expected.nonAttendus || []) {
    const f = all.find((c) => c.regle === n.regle && (c.element || '').includes(n.element));
    if (f) unexpected.push({ interdit: n, constat: f });
  }
  const forbidden = expected.categoriesInterdites || [];
  const fp = all.filter((c) => !matched.has(c) && forbidden.includes(c.categorie));
  const unmatchedOther = all.filter((c) => !matched.has(c) && !fp.includes(c));
  return { fixture, runs, tp, fn, fp, unexpected, unmatchedOther };
}
