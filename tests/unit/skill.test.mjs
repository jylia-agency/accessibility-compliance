import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const skill = readFileSync(join(ROOT, 'SKILL.md'), 'utf8');

test('SKILL.md : en-tête conforme au format Agent Skills', () => {
  const m = skill.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(m, 'en-tête YAML absent');
  const fm = m[1];
  const name = fm.match(/^name: (.+)$/m)?.[1];
  assert.equal(name, 'accessibility-audit');
  assert.match(name, /^[a-z0-9]+(-[a-z0-9]+)*$/);
  assert.ok(name.length <= 64);
  const desc = fm.match(/^description: (.+)$/m)?.[1];
  assert.ok(desc && desc.length > 0 && desc.length <= 1024, `description de ${desc?.length} caractères`);
  const compat = fm.match(/^compatibility: (.+)$/m)?.[1];
  assert.ok(!compat || compat.length <= 500);
  // Pas de « deux-points suivi d'une espace » dans les scalaires simples (YAML invalide)
  for (const line of fm.split('\n').filter((l) => /^[a-z-]+: /.test(l))) {
    assert.ok(!/^[a-z-]+: .*: /.test(line), `deux-points dans : ${line.slice(0, 50)}`);
  }
});

test('SKILL.md et README : tous les fichiers référencés existent', () => {
  for (const doc of ['SKILL.md', 'README.md', 'references/tooling.md', 'references/audit-methodology.md']) {
    const text = readFileSync(join(ROOT, doc), 'utf8');
    const paths = [...text.matchAll(/`((?:references|templates|scripts|data|examples|tests)\/[\w./-]+\.(?:md|mjs|js|json))`/g)].map((x) => x[1]);
    for (const p of paths) assert.ok(existsSync(join(ROOT, p)), `${doc} référence ${p}, introuvable`);
  }
});

test('fichiers exigés par la mission présents', () => {
  const required = [
    'SKILL.md', 'README.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'LICENSE', '.gitignore',
    'references/legal-framework.md', 'references/official-sources.md', 'references/rgaa.md', 'references/wcag.md',
    'references/en-301-549.md', 'references/applicability.md', 'references/contrasts.md', 'references/typography.md',
    'references/keyboard-navigation.md', 'references/semantic-html-aria.md', 'references/forms.md',
    'references/images-multimedia.md', 'references/responsive-mobile.md', 'references/animations.md',
    'references/audit-methodology.md', 'templates/audit-report.md', 'templates/compliance-matrix.md',
    'templates/remediation-plan.md', 'templates/manual-testing-checklist.md', 'templates/accessibility-statement.md',
    'examples/example-audit.md', 'tests/fixtures/inaccessible-app/EXPECTED.md', 'tests/fixtures/accessible-app/EXPECTED.md', 'tests/README.md',
  ];
  for (const f of required) assert.ok(existsSync(join(ROOT, f)), f);
});

test('convention éditoriale : aucun tiret cadratin dans les fichiers du dépôt', () => {
  const offenders = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir)) {
      if (['.git', 'node_modules'].includes(e)) continue;
      const p = join(dir, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (['.md', '.mjs', '.js', '.json', '.css', '.html', '.jsx', '.yml', ''].includes(extname(p))) {
        if (readFileSync(p, 'utf8').includes(String.fromCharCode(0x2014))) offenders.push(p.slice(ROOT.length + 1));
      }
    }
  };
  walk(ROOT);
  assert.deepEqual(offenders, []);
});
