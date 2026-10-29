#!/usr/bin/env node
// Calculateur de contraste WCAG 2.2 / RGAA 4.1.2 (lecture seule, sans dépendance).
//
// Exemples :
//   node scripts/contrast.mjs "#FFFFFF" "#73B9B0"
//   node scripts/contrast.mjs "#FFFFFF" "#73B9B0" --size 16px --weight 700 --suggest bg
//   node scripts/contrast.mjs "rgba(0,0,0,.6)" "#FFFFFF" --json
//   node scripts/contrast.mjs "#767676" "rgba(255,255,255,.8)" --backdrop "#1E1E1E"
//   node scripts/contrast.mjs "#949494" "#FFFFFF" --type non-text
//   node scripts/contrast.mjs --pairs paires.json --json
//
// Format de --pairs : [{ "id": "btn-valider", "fg": "#fff", "bg": "#73b9b0", "size": "16px", "weight": 400, "type": "text" }]

import { readFileSync } from 'node:fs';
import { evaluatePair, parseColor, suggestColor, contrastRatio, formatRatio, quantize, toPx } from './lib/color.mjs';

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) args[key] = true;
      else {
        args[key] = next;
        i++;
      }
    } else args._.push(a);
  }
  return args;
}

const HELP = `Usage : node scripts/contrast.mjs <premier-plan> <fond> [options]
Options :
  --size <n>px|<n>pt     Taille de texte calculée (sans elle, seuil du texte normal)
  --weight <n>           Graisse calculée (700 ou plus = gras)
  --type text|non-text   Texte (1.4.3 / RGAA 3.2) ou composant/graphique (1.4.11 / RGAA 3.3)
  --level AA|AAA         Niveau WCAG visé (défaut AA)
  --backdrop <couleur>   Fond opaque sous un fond translucide
  --suggest fg|bg|both   Proposer des couleurs corrigées vérifiées
  --pairs <fichier.json> Évaluer une liste de paires
  --json                 Sortie JSON`;

function evaluate(spec) {
  const sizePx = spec.size !== undefined ? toPx(spec.size) : undefined;
  const result = evaluatePair(spec.fg, spec.bg, {
    sizePx,
    weight: spec.weight !== undefined ? Number(spec.weight) : 400,
    type: spec.type || 'text',
    level: spec.level || 'AA',
    backdrop: spec.backdrop,
  });
  if (spec.id) result.id = spec.id;
  if (sizePx !== undefined) result.taillePx = Number(sizePx.toFixed(2));
  if (spec.suggest && !result.conforme) {
    const fg = quantize(parseColor(result.premierPlan));
    const bg = quantize(parseColor(result.fond));
    const target = result.seuil;
    result.suggestions = {};
    if (spec.suggest === 'fg' || spec.suggest === 'both' || spec.suggest === true) {
      result.suggestions.premierPlan = suggestColor(fg, bg, target).map((s) => ({
        ...s,
        ratioAffiche: `${formatRatio(s.ratio)}:1`,
        verification: contrastRatio(parseColor(s.hex), bg) >= target,
      }));
    }
    if (spec.suggest === 'bg' || spec.suggest === 'both' || spec.suggest === true) {
      result.suggestions.fond = suggestColor(bg, fg, target).map((s) => ({
        ...s,
        ratioAffiche: `${formatRatio(s.ratio)}:1`,
        verification: contrastRatio(fg, parseColor(s.hex)) >= target,
      }));
    }
  }
  return result;
}

function printHuman(r) {
  const lines = [];
  if (r.id) lines.push(`# ${r.id}`);
  lines.push(`Premier plan : ${r.premierPlan}   Fond : ${r.fond}`);
  lines.push(`Ratio calculé : ${r.ratioAffiche} (valeur exacte ${r.ratio.toFixed(4)}, non arrondie pour la comparaison)`);
  const kind = r.type === 'text' ? (r.grandTexte ? 'texte de grande taille' : 'texte normal') : 'composant ou élément graphique';
  lines.push(`Type : ${kind}   Seuil ${r.niveau} : ${r.seuil}:1   Critère : WCAG ${r.criteres.wcag}${r.criteres.rgaa ? ` / RGAA 4.1.2 critère ${r.criteres.rgaa}` : ''}`);
  lines.push(`Résultat WCAG : ${r.conforme ? 'seuil atteint' : 'SEUIL NON ATTEINT'}`);
  if (r.seuilRgaa !== r.seuil) lines.push(`Résultat RGAA (seuil ${r.seuilRgaa}:1) : ${r.conformeRgaa ? 'seuil atteint' : 'SEUIL NON ATTEINT'}`);
  for (const w of r.avertissements) lines.push(`Avertissement : ${w}`);
  if (r.suggestions) {
    for (const [cible, list] of Object.entries(r.suggestions)) {
      const label = cible === 'fond' ? 'fond' : 'premier plan';
      if (!list.length) lines.push(`Aucune couleur de ${label} de même teinte n'atteint le seuil.`);
      for (const s of list) {
        lines.push(`Suggestion (${label}, ${s.direction}) : ${s.hex} -> ${s.ratioAffiche} (vérifié : ${s.verification ? 'oui' : 'non'})`);
      }
    }
  }
  lines.push('Rappel : ce calcul porte sur les couleurs fournies. Il ne prouve pas que ce sont les couleurs réellement rendues (cascade, thèmes, états, images de fond).');
  console.log(lines.join('\n'));
}

const args = parseArgs(process.argv.slice(2));
if (args.help || args.h || (!args.pairs && args._.length < 2)) {
  console.log(HELP);
  process.exit(args.help || args.h ? 0 : 2);
}

try {
  if (args.pairs) {
    const specs = JSON.parse(readFileSync(args.pairs, 'utf8'));
    const results = specs.map((s) => {
      try {
        return evaluate({ ...s, suggest: s.suggest ?? args.suggest, level: s.level ?? args.level });
      } catch (e) {
        return { id: s.id, erreur: e.message };
      }
    });
    if (args.json) console.log(JSON.stringify(results, null, 2));
    else results.forEach((r) => (r.erreur ? console.log(`# ${r.id}\nErreur : ${r.erreur}`) : printHuman(r)) || console.log(''));
    process.exit(results.some((r) => r.erreur) ? 1 : 0);
  }
  const [fg, bg] = args._;
  const result = evaluate({ fg, bg, size: args.size, weight: args.weight, type: args.type, level: args.level, backdrop: args.backdrop, suggest: args.suggest });
  if (args.json) console.log(JSON.stringify(result, null, 2));
  else printHuman(result);
} catch (e) {
  console.error(`Erreur : ${e.message}`);
  process.exit(1);
}
