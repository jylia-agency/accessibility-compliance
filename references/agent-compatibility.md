# Compatibilité des agents et restrictions de sécurité

## Lecture seule : une consigne, pas une isolation

Le `SKILL.md` impose un fonctionnement en lecture seule par défaut. **C'est une instruction donnée au modèle, pas une garantie technique.** Un agent qui dispose d'outils d'écriture peut techniquement modifier des fichiers. Pour une isolation réelle, configurer l'agent :

| Agent | Mécanisme d'isolation | Remarques |
|---|---|---|
| Claude Code | Mode plan (lecture seule) ; règles de permission `deny` sur `Edit`, `Write` et sur les commandes Bash sensibles dans `.claude/settings.json` ; mode de permission par défaut (validation de chaque action) | Le champ `allowed-tools` du format Agent Skills est expérimental ; son interprétation varie selon les versions de Claude Code : ne pas s'y fier pour restreindre |
| OpenAI Codex (CLI) | Bac à sable en lecture seule (`--sandbox read-only`) et politique d'approbation | Vérifier les options dans la documentation officielle de Codex de la version utilisée |
| Autres agents compatibles Agent Skills | Selon l'agent : mode lecture seule, conteneur, compte sans droits d'écriture | En l'absence de mécanisme, exécuter l'agent sur une copie du projet |

## Capacités requises selon le mode

| Capacité | Statique | Dynamique | Remédiation |
|---|---|---|---|
| Lire les fichiers | Oui | Oui | Oui |
| Exécuter `node` sur les scripts du skill | Recommandé | Oui | Recommandé |
| Navigateur (Playwright + Chromium) | Non | Oui | Recommandé pour la contre-vérification |
| Réseau | Non | Seulement pour une URL distante | Non |
| Écrire dans le projet | **Non** | **Non** | Oui, sur demande explicite |

Sans exécution de commandes (agent « lecture seule stricte »), le skill reste utilisable : l'agent applique manuellement les contrôles des références, mais **ne doit produire aucun ratio de contraste** sans calcul effectif. Il signale alors les paires de couleurs à mesurer.

## Installation

### Claude Code

Le dossier d'installation doit porter le nom du skill (`accessibility-audit`), conformément au format Agent Skills :

```bash
# Skill personnel (tous les projets)
git clone https://github.com/jylia/accessibility-compliance.git ~/.claude/skills/accessibility-audit
# Skill de projet (partagé avec l'équipe via le dépôt)
git clone https://github.com/jylia/accessibility-compliance.git .claude/skills/accessibility-audit
```

Le skill est chargé automatiquement lorsque la demande correspond à sa description, ou explicitement via `/accessibility-audit`.

### OpenAI Codex

Codex prend en charge le format Agent Skills. Les installateurs de skills placent les skills dans `$CODEX_HOME/skills` (par défaut `~/.codex/skills`), d'après des sources secondaires ; la documentation officielle (https://developers.openai.com/codex/skills) n'a pas pu être consultée lors de la rédaction : **vérifier les emplacements** (utilisateur, dépôt) pour votre version.

```bash
git clone https://github.com/jylia/accessibility-compliance.git ~/.codex/skills/accessibility-audit
```

Redémarrer Codex pour qu'il découvre le skill.

### Autres agents

Copier le dossier (renommé `accessibility-audit`) dans le répertoire de skills de l'agent. Le `SKILL.md` n'utilise que les champs du format (`name`, `description`, `license`, `compatibility`, `metadata`).

## Données sensibles

- Les rapports peuvent contenir des URL de recette, des extraits de code et des captures d'écran : les stocker hors du dépôt public.
- Ne jamais saisir de vrais identifiants dans les scénarios dynamiques sans l'accord explicite de l'utilisateur ; préférer des comptes de test.
- Les captures d'écran peuvent contenir des données personnelles : les signaler à l'utilisateur.
