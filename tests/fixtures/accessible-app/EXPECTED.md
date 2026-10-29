# Fixture `accessible-app` : absence de faux positifs

Version accessible du même tableau de bord. **Aucun constat « Échec vérifié » ni « Risque potentiel » ne doit être produit**, en analyse statique comme en analyse dynamique, en thème clair et en thème sombre. Version machine : `expected.json`.

## Cas de non-régression couverts

| Cas | Ce qui est testé | Mesure |
|---|---|---|
| Texte de 14 px (`.small-print`) | Une petite taille n'est **pas** un échec : seul le contraste compte | #333333 sur #FFFFFF : 12,63:1 |
| Thème sombre (`prefers-color-scheme: dark`) | Contrastes recalculés dans le thème sombre (`--color-scheme dark`) | #E8E8E8 sur #121212 : 15,28:1 ; #D0D0D0 sur #121212 : 12,14:1 ; liens #8AB4F8 sur #121212 : 8,88:1 |
| Variables CSS (`var(--text)`) | Résolution des propriétés personnalisées par contexte de média | |
| Bouton icône avec `aria-label`, SVG `aria-hidden` | Nom accessible fourni, icône masquée | |
| Onglets ARIA (motif APG) | `role="tab"` avec `tabindex="-1"` sur l'onglet inactif : pas de « rôle interactif non focalisable » | |
| `<dialog>` natif avec `showModal()` | Focus déplacé, maintenu, restitué ; la sortie vers l'interface du navigateur n'est pas une fuite de focus | |
| Formulaire étiqueté, aide et erreur reliées (`aria-describedby`), `autocomplete="email"` | Pas de constat d'étiquette ni d'autocomplétion | |
| Lien d'évitement masqué hors écran | Non évalué en contraste dans l'état non focalisé (texte masqué visuellement) | |
| `:focus-visible` avec contour de 3 px | Focus visible sur chaque élément | |
| `prefers-reduced-motion` | Transition limitée aux utilisateurs sans préférence de réduction | |
| Composant React `Field` avec `{...props}` | Élément non concluant, pas de faux positif | |

## Contrôles manuels attendus (statique)

| Règle | Raison |
|---|---|
| `img-alt-review` | La pertinence d'une alternative présente n'est jamais présumée |
| `form-error-association` | Les messages d'erreur exigent un test d'usage |
| `dialog-focus-management` | Gestion du focus à confirmer par un test dynamique ou manuel |

## Défaut découvert pendant la conception

La première version de cette fixture laissait les liens avec la couleur par défaut du navigateur (#0000EE) en thème sombre : **1,99:1** sur #121212. L'analyse dynamique en `--color-scheme dark` l'a détecté ; l'analyse statique ne pouvait pas le voir (aucune règle CSS ne déclarait cette couleur). La fixture a été corrigée (`a { color: var(--link) }`). Ce cas illustre la nécessité de combiner les méthodes et de tester chaque thème.
