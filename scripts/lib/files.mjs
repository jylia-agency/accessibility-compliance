// Parcours de fichiers en lecture seule.
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, extname, basename } from 'node:path';

export const IGNORED_DIRS = new Set([
  'node_modules', '.git', '.hg', '.svn', 'dist', 'build', 'out', '.next', '.nuxt', '.output', '.svelte-kit',
  'coverage', 'vendor', '.cache', '.turbo', '.vercel', '.angular', 'storybook-static', '.idea', '.vscode',
  'Pods', 'DerivedData', '.gradle', 'target', '__pycache__', '.venv', 'venv',
]);

export const MARKUP_EXT = new Set(['.html', '.htm', '.jsx', '.tsx', '.vue', '.svelte', '.astro', '.js', '.ts', '.mjs', '.cjs']);
export const STYLE_EXT = new Set(['.css', '.scss', '.sass', '.less', '.pcss']);
export const DOC_EXT = new Set(['.pdf', '.doc', '.docx', '.odt', '.xls', '.xlsx', '.ods', '.ppt', '.pptx', '.odp', '.rtf', '.epub']);
export const MEDIA_EXT = new Set(['.mp4', '.webm', '.ogg', '.ogv', '.mov', '.mp3', '.wav', '.m4a', '.vtt', '.srt']);

const MAX_SIZE = 1_500_000;

export function walk(root, { exclude = [] } = {}) {
  const files = [];
  const excludeRe = exclude.map((g) => new RegExp(g));
  const visit = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = join(dir, e.name);
      const rel = relative(root, full);
      if (excludeRe.some((re) => re.test(rel))) continue;
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) {
        if (IGNORED_DIRS.has(e.name)) continue;
        visit(full);
      } else if (e.isFile()) {
        files.push(full);
      }
    }
  };
  if (statSync(root).isFile()) return [root];
  visit(root);
  return files.sort();
}

export function readText(file) {
  const st = statSync(file);
  if (st.size > MAX_SIZE) return null;
  const txt = readFileSync(file, 'utf8');
  if (/\.min\.(js|css)$/.test(file)) return null;
  return txt;
}

export function markupMode(file) {
  const ext = extname(file).toLowerCase();
  if (ext === '.html' || ext === '.htm') return /\.component\.html$/.test(file) ? 'angular' : 'html';
  if (ext === '.vue') return 'vue';
  if (ext === '.svelte') return 'svelte';
  if (ext === '.astro') return 'html';
  if (['.jsx', '.tsx', '.js', '.ts', '.mjs', '.cjs'].includes(ext)) return 'jsx';
  return null;
}

/** Inventaire du projet : technologies, pages, composants, documents, PWA, mobile natif. */
export function inventory(root, files) {
  const rel = (f) => relative(root, f) || basename(f);
  const inv = {
    technologies: [],
    frameworksUi: [],
    fichiers: { balisage: 0, styles: 0, scripts: 0 },
    pagesOuRoutes: [],
    composantsReutilisables: [],
    documents: [],
    medias: [],
    pwa: { manifeste: null, serviceWorker: null },
    mobileNatif: [],
    designSystem: [],
    outilsA11yExistants: [],
  };
  const pkgPath = join(root, 'package.json');
  let deps = {};
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
    } catch {
      /* package.json illisible */
    }
  }
  const has = (name) => Object.prototype.hasOwnProperty.call(deps, name);
  const tech = [
    ['next', 'Next.js'], ['react', 'React'], ['nuxt', 'Nuxt'], ['vue', 'Vue'], ['@angular/core', 'Angular'],
    ['svelte', 'Svelte'], ['@sveltejs/kit', 'SvelteKit'], ['astro', 'Astro'], ['solid-js', 'Solid'],
    ['tailwindcss', 'Tailwind CSS'], ['react-native', 'React Native'], ['@capacitor/core', 'Capacitor'],
    ['@ionic/core', 'Ionic'], ['electron', 'Electron'], ['vite', 'Vite'], ['typescript', 'TypeScript'],
  ];
  for (const [d, label] of tech) if (has(d)) inv.technologies.push(`${label} (${deps[d]})`);
  const ui = [
    ['@mui/material', 'MUI'], ['@radix-ui/react-dialog', 'Radix UI'], ['@headlessui/react', 'Headless UI'],
    ['@chakra-ui/react', 'Chakra UI'], ['vuetify', 'Vuetify'], ['primevue', 'PrimeVue'], ['primereact', 'PrimeReact'],
    ['@angular/material', 'Angular Material'], ['@angular/cdk', 'Angular CDK'], ['react-aria', 'React Aria'],
    ['react-aria-components', 'React Aria Components'], ['@ark-ui/react', 'Ark UI'], ['antd', 'Ant Design'],
    ['bootstrap', 'Bootstrap'], ['@gouvfr/dsfr', 'DSFR (Système de design de l’État)'], ['@codegouvfr/react-dsfr', 'react-dsfr'],
    ['@mantine/core', 'Mantine'], ['@shadcn/ui', 'shadcn/ui'],
  ];
  for (const [d, label] of ui) if (has(d)) inv.frameworksUi.push(label);
  for (const d of ['axe-core', '@axe-core/playwright', '@axe-core/react', 'jest-axe', 'vitest-axe', 'eslint-plugin-jsx-a11y', 'eslint-plugin-vuejs-accessibility', '@angular-eslint/eslint-plugin-template', 'pa11y', 'lighthouse', '@storybook/addon-a11y']) {
    if (has(d)) inv.outilsA11yExistants.push(`${d} (${deps[d]})`);
  }
  for (const f of files) {
    const r = rel(f).split('\\').join('/');
    const ext = extname(f).toLowerCase();
    if (['.html', '.htm', '.vue', '.svelte', '.astro', '.jsx', '.tsx'].includes(ext)) inv.fichiers.balisage++;
    else if (STYLE_EXT.has(ext)) inv.fichiers.styles++;
    else if (['.js', '.ts', '.mjs', '.cjs'].includes(ext)) inv.fichiers.scripts++;
    if (DOC_EXT.has(ext)) inv.documents.push(r);
    if (MEDIA_EXT.has(ext)) inv.medias.push(r);
    // Pages et routes (conventions des frameworks)
    if (
      /(^|\/)app\/(.+\/)?page\.(jsx|tsx|js|ts|mdx)$/.test(r) ||
      /(^|\/)pages\/.+\.(jsx|tsx|js|ts|vue|astro|mdx)$/.test(r) ||
      /(^|\/)routes\/.+\+page\.svelte$/.test(r) ||
      /(^|\/)(views|screens)\/.+\.(vue|jsx|tsx)$/.test(r) ||
      (/\.html?$/.test(r) && !/\.component\.html$/.test(r) && !/(^|\/)(components?|partials?|templates?)\//.test(r))
    ) {
      if (!/(^|\/)pages\/(_app|_document|api\/)/.test(r)) inv.pagesOuRoutes.push(r);
    }
    if (/(^|\/)(components?|ui|design-system|ds)\//i.test(r) && ['.jsx', '.tsx', '.vue', '.svelte'].includes(ext)) inv.composantsReutilisables.push(r);
    if (/\.component\.(ts|html)$/.test(r)) inv.composantsReutilisables.push(r);
    if (/(manifest\.webmanifest|manifest\.json|site\.webmanifest)$/.test(r) && !/package/.test(r)) inv.pwa.manifeste = r;
    if (/(^|\/)(sw|service-worker|serviceworker)\.(js|ts)$/.test(r) || /workbox/.test(r)) inv.pwa.serviceWorker = r;
    if (/(^|\/)(tokens?|theme|design-tokens)\.(json|js|ts|css|scss)$/i.test(r) || /tailwind\.config\.(js|ts|cjs|mjs)$/.test(r)) inv.designSystem.push(r);
    if (/(^|\/)AndroidManifest\.xml$/.test(r)) inv.mobileNatif.push(`Android natif : ${r}`);
    if (/\.xcodeproj\//.test(r) || /(^|\/)Info\.plist$/.test(r)) inv.mobileNatif.push(`iOS natif : ${r}`);
    if (/(^|\/)pubspec\.yaml$/.test(r)) inv.mobileNatif.push(`Flutter : ${r}`);
  }
  inv.composantsReutilisables = [...new Set(inv.composantsReutilisables)];
  inv.mobileNatif = [...new Set(inv.mobileNatif)].slice(0, 20);
  return inv;
}
