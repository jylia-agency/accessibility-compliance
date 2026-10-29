# Documents téléchargeables

Critères : RGAA **13.3**, **13.4** ; WCAG 2.2 appliqué aux documents (EN 301 549 **clause 10**) ; liens : RGAA **6.1**.

## Ce que le skill observe

- **Inventaire** : fichiers `.pdf`, `.doc(x)`, `.odt`, `.xls(x)`, `.ods`, `.ppt(x)`, `.odp`, `.rtf`, `.epub` présents dans le dépôt (`inventaire.documents`), liens vers ces formats dans le balisage (`downloadable-document`) et dans le DOM rendu (`faits.documents`).
- **Liens** : présence du format et du poids dans l'intitulé ou le contexte (bonne pratique répandue ; RGAA 6.1 pour la pertinence de l'intitulé).
- **Alternatives** : version HTML ou version accessible proposée à proximité.

## Ce que le skill ne conclut pas

- **Ne jamais conclure qu'un PDF est accessible parce que son texte est sélectionnable.** Un PDF peut contenir du texte sans balises de structure, avec un ordre de lecture incohérent, des images sans alternative, une langue non définie.
- L'accessibilité d'un document exige un **audit documentaire spécifique**.

## Audit documentaire (si des outils adaptés sont disponibles et autorisés)

| Point | PDF | Bureautique (DOCX, ODT) |
|---|---|---|
| Document balisé (structure logique) | Présence de l'arbre de balises (`/StructTreeRoot`, `/MarkInfo /Marked true`) | Styles de titres, listes, tableaux réels |
| Titre du document affiché | `/DisplayDocTitle` et métadonnée de titre | Propriétés du document |
| Langue | `/Lang` du catalogue et changements de langue | Langue définie |
| Ordre de lecture | Cohérent avec l'ordre visuel (vérification manuelle) | Ordre du flux |
| Alternatives des images | `/Alt` des figures | Textes de remplacement |
| Tableaux | En-têtes balisés | Lignes d'en-tête répétées, en-têtes déclarés |
| Formulaires | Champs nommés (`/TU`), ordre de tabulation | Contrôles de contenu étiquetés |
| Contraste et couleur | Comme pour le web | Comme pour le web |
| Document numérisé | Image seule sans texte : non accessible sans OCR et balisage | |

Outils possibles (seulement avec l'accord de l'utilisateur) : PAC (PDF Accessibility Checker), veraPDF (profil PDF/UA), vérificateurs d'accessibilité intégrés aux suites bureautiques, bibliothèques de lecture PDF (pour l'inventaire des métadonnées et des balises). Les résultats de ces outils sont des **indices** ; la vérification de l'ordre de lecture et de la pertinence des alternatives reste humaine.

## Qualification

- Exemption française des documents bureautiques publiés avant le 23/09/2018, **sauf** s'ils sont nécessaires à une démarche administrative (site RGAA, V1) : vérifier la date et l'usage avant de qualifier.
- Dans l'échantillon RGAA : au moins un document pertinent par type de service.
