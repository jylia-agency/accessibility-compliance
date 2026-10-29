# Checklist des contrôles manuels : [Nom du service]

> Contrôles que les outils automatisés ne couvrent pas, ou pour lesquels leurs résultats ne sont pas conclusifs. **Ne cocher une case qu'après réalisation effective du test**, en indiquant qui l'a réalisé, quand, et avec quel environnement. Une case non cochée signifie « Non testé ».

Environnement de test : [navigateur et version, système, technologie d'assistance et version]. Testeur : [nom]. Date : [JJ/MM/AAAA].

## Images et médias

- [ ] Pertinence de chaque alternative d'image porteuse d'information, dans son contexte (RGAA 1.3 ; WCAG 1.1.1)
- [ ] Images décoratives correctement ignorées, y compris les SVG et les images CSS porteuses d'information (RGAA 1.2, 10.2)
- [ ] Descriptions détaillées des graphiques et schémas (RGAA 1.6, 1.7)
- [ ] Images texte remplaçables par du texte stylé (RGAA 1.8 ; WCAG 1.4.5)
- [ ] CAPTCHA : nature identifiable et alternative d'accès (RGAA 1.4, 1.5)
- [ ] Sous-titres synchronisés et pertinents (RGAA 4.3, 4.4 ; WCAG 1.2.2)
- [ ] Transcription et audiodescription (RGAA 4.1, 4.2, 4.5, 4.6 ; WCAG 1.2.1, 1.2.3, 1.2.5)
- [ ] Contrôles du lecteur utilisables au clavier et restitués (RGAA 4.11, 4.13)

## Couleurs

- [ ] Information non transmise par la seule couleur (RGAA 3.1 ; WCAG 1.4.1)
- [ ] Contraste des textes sur image ou dégradé, mesuré à la pipette (RGAA 3.2)
- [ ] Contraste des états survol, focus, actif, sélectionné, erreur et du thème sombre (RGAA 3.2, 3.3)
- [ ] Contraste des icônes fonctionnelles, bordures de champs, graphiques (RGAA 3.3 ; WCAG 1.4.11)

## Structure et sémantique

- [ ] Pertinence de la hiérarchie des titres (RGAA 9.1)
- [ ] Listes et citations correctement structurées (RGAA 9.3, 9.4)
- [ ] Titre de page pertinent, mis à jour à chaque vue d'une SPA (RGAA 8.6)
- [ ] Changements de langue indiqués (RGAA 8.7, 8.8)
- [ ] Ordre de lecture cohérent sans feuille de styles (RGAA 10.2, 10.3)
- [ ] Tableaux de données : titre, en-têtes, résumé des tableaux complexes (RGAA 5.1 à 5.7)
- [ ] Liens explicites dans leur contexte ; nom accessible contenant l'intitulé visible (RGAA 6.1 ; WCAG 2.4.4, 2.5.3)

## Clavier et focus

- [ ] Parcours complet au clavier de chaque page de l'échantillon, ordre cohérent (RGAA 12.8)
- [ ] Activation de chaque composant au clavier (Entrée, Espace, flèches selon le motif) (RGAA 7.3)
- [ ] Menus, onglets, accordéons, carrousels, listes déroulantes conformes à leur motif et états restitués (RGAA 7.1)
- [ ] Fenêtres modales : focus initial, maintien, fermeture, retour du focus (RGAA 7.1, 12.8, 12.9)
- [ ] Lien d'évitement fonctionnel (RGAA 12.7)
- [ ] Contenus au survol ou au focus : masquables, survolables, persistants (RGAA 10.13 ; WCAG 1.4.13)
- [ ] Focus jamais entièrement masqué (en-tête collant, bannière cookies) (WCAG 2.4.11)
- [ ] Raccourcis à une touche maîtrisables (RGAA 12.10 ; WCAG 2.1.4)

## Technologies d'assistance (environnement de test RGAA)

- [ ] Restitution des composants personnalisés : nom, rôle, valeur, états (RGAA 7.1)
- [ ] Messages de statut annoncés (ajout, recherche, erreurs, chargement) (RGAA 7.5 ; WCAG 4.1.3)
- [ ] Contenus cachés réellement ignorés ou restitués selon l'intention (RGAA 10.8)
- [ ] Navigation par titres, régions et liens cohérente (RGAA 12.6)

## Formulaires

- [ ] Étiquettes pertinentes et accolées (RGAA 11.2, 11.4)
- [ ] Champs obligatoires et formats indiqués (RGAA 11.10)
- [ ] Erreurs identifiées, reliées au champ, annoncées, avec suggestions (RGAA 11.10, 11.11)
- [ ] Prévention des erreurs pour les données juridiques, financières ou personnelles (RGAA 11.12)
- [ ] Saisie redondante évitée (WCAG 3.3.7)
- [ ] Authentification sans test cognitif ; collage autorisé (WCAG 3.3.8)
- [ ] Changements de contexte maîtrisés (RGAA 7.4)

## Présentation, zoom, mobile

- [ ] Agrandissement du texte à 200 % dans un navigateur réel, avec les deux modes (zoom de page, texte seul) (RGAA 10.4)
- [ ] Redistribution à 320 px CSS, exceptions justifiées (RGAA 10.11)
- [ ] Espacement du texte personnalisé sans perte (RGAA 10.12)
- [ ] Orientation portrait et paysage (RGAA 13.9)
- [ ] Gestes complexes et glisser-déposer : alternatives (RGAA 13.10 ; WCAG 2.5.1, 2.5.7)
- [ ] Annulation de l'action au pointeur (RGAA 13.11)
- [ ] Taille des cibles : exceptions « équivalent » et « essentiel » examinées (WCAG 2.5.8)
- [ ] PWA installée : navigation de retour, messages hors ligne

## Consultation

- [ ] Limites de temps contrôlables (RGAA 13.1)
- [ ] Contenus en mouvement ou clignotants contrôlables (RGAA 13.8)
- [ ] Absence de flashs dangereux (RGAA 13.7)
- [ ] Nouvelles fenêtres non ouvertes sans action de l'utilisateur (RGAA 13.2)
- [ ] Documents téléchargeables accessibles ou avec version accessible (RGAA 13.3, 13.4)
- [ ] Contenus cryptiques (émoticônes, art ASCII) avec alternative (RGAA 13.5, 13.6)

## Navigation (ensemble de pages)

- [ ] Deux systèmes de navigation au moins (RGAA 12.1)
- [ ] Menus et navigation à la même place (RGAA 12.2)
- [ ] Plan du site pertinent et accessible de manière identique (RGAA 12.3, 12.4)
- [ ] Moteur de recherche atteignable de manière identique (RGAA 12.5)
- [ ] Aide cohérente (WCAG 3.2.6)

## Contrôles issus des outils (à compléter)

| Constat | Contrôle à réaliser | Testeur | Date | Résultat |
|---|---|---|---|---|
| A11Y-NNN | | | | |
