#!/usr/bin/env node
// Veille documentaire : signale les sources à revérifier.
//   node scripts/check-sources.mjs [--max-age 180] [--online]
// --online interroge chaque URL (requêtes réseau : à lancer avec l'accord de l'utilisateur)
// et recherche les indices de changement listés dans « surveiller ». Ce ne sont que des indices :
// toute mise à jour exige la lecture humaine du texte officiel.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const reg = JSON.parse(readFileSync(join(HERE, '..', 'data', 'sources.json'), 'utf8'));
const argv = process.argv.slice(2);
const maxAge = argv.includes('--max-age') ? Number(argv[argv.indexOf('--max-age') + 1]) : 180;
const online = argv.includes('--online');
const now = Date.now();

let alerts = 0;
console.log(`Registre vérifié le ${reg.dateVerification} ; seuil d'ancienneté : ${maxAge} jours.\n`);
for (const s of reg.sources) {
  const age = Math.floor((now - Date.parse(s.date)) / 86400000);
  const flags = [];
  if (age > maxAge) flags.push(`vérification ancienne (${age} j)`);
  if (s.verification === 'NV') flags.push('non vérifié');
  if (/confirmer/.test(`${s.versionRetenue} ${s.note || ''}`)) flags.push('point à confirmer');
  if (flags.length) alerts++;
  console.log(`${flags.length ? 'À REVOIR' : 'ok      '}  [${s.verification}] ${s.titre} : ${s.versionRetenue}${flags.length ? ` (${flags.join(', ')})` : ''}`);
}

if (online) {
  console.log('\nContrôle en ligne (indices uniquement) :');
  for (const s of reg.sources) {
    try {
      const res = await fetch(s.url, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
      const text = res.ok ? await res.text() : '';
      const hits = (s.surveiller || []).filter((k) => text.toLowerCase().includes(k.toLowerCase()));
      console.log(`${res.status}  ${s.id}${hits.length ? ` : indices trouvés : ${hits.join(', ')}` : ''}${res.headers.get('last-modified') ? ` ; Last-Modified ${res.headers.get('last-modified')}` : ''}`);
    } catch (e) {
      console.log(`ERR  ${s.id} : ${e.message}`);
    }
  }
}
console.log(`\n${alerts} source(s) à revoir. Procédure : references/maintenance.md`);
