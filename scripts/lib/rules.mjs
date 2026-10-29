// Catalogue des règles heuristiques des scripts d'analyse.
//
// Chaque règle référence des critères existants :
// - WCAG 2.2 (identifiants vérifiés contre scripts/lib/wcag22.mjs) ;
// - RGAA 4.1.2 (identifiants vérifiés contre data/rgaa-4.1.2-criteres.json).
// Le test tests/unit/rules.test.mjs échoue si un identifiant n'existe pas.
//
// Catégories (voir references/audit-methodology.md) :
//   « Échec vérifié », « Risque potentiel », « À vérifier manuellement »,
//   « Conforme sur le périmètre testé », « Non applicable », « Non testé », « Bonne pratique ».
// Une règle d'analyse STATIQUE n'émet « Échec vérifié » que si le code suffit
// à démontrer l'échec du test (attribut obligatoire absent sans possibilité
// d'être injecté, par exemple).

export const CATEGORIES = {
  ECHEC: 'Échec vérifié',
  RISQUE: 'Risque potentiel',
  MANUEL: 'À vérifier manuellement',
  CONFORME: 'Conforme sur le périmètre testé',
  NA: 'Non applicable',
  NON_TESTE: 'Non testé',
  BONNE_PRATIQUE: 'Bonne pratique',
};

export const GRAVITES = ['Bloquante', 'Majeure', 'Mineure', 'Information'];

const R = (id, o) => ({ id, ...o });

export const RULES = Object.fromEntries(
  [
    // --- Images ------------------------------------------------------------
    R('img-alt-missing', {
      titre: 'Image sans alternative textuelle ni marquage décoratif',
      wcag: ['1.1.1'], rgaa: ['1.1', '1.2'], gravite: 'Majeure',
      impact: 'Un lecteur d’écran annonce le nom du fichier ou ignore une information portée par l’image.',
      correction: 'Image porteuse d’information : ajouter un attribut alt décrivant l’information. Image décorative : alt="" (sans autre attribut fournissant une alternative).',
      validation: 'Vérifier le nom accessible dans l’arbre d’accessibilité et la pertinence de l’alternative (RGAA 1.3) par une personne.',
    }),
    R('img-alt-suspicious', {
      titre: 'Alternative textuelle probablement non pertinente (nom de fichier, mot générique)',
      wcag: ['1.1.1'], rgaa: ['1.3'], gravite: 'Majeure',
      impact: 'L’alternative restituée ne transmet pas l’information de l’image.',
      correction: 'Rédiger une alternative décrivant la fonction ou l’information de l’image dans son contexte.',
      validation: 'Revue humaine de la pertinence de l’alternative dans le contexte de la page.',
    }),
    R('img-alt-review', {
      titre: 'Pertinence des alternatives textuelles à vérifier',
      wcag: ['1.1.1'], rgaa: ['1.2', '1.3'], gravite: 'Information',
      impact: 'Une alternative présente n’est pas forcément pertinente ; une image décorative avec un alt non vide est bruyante.',
      correction: 'Revoir chaque alternative : information équivalente pour les images porteuses d’information, alt vide pour les images de décoration.',
      validation: 'Revue humaine, image par image, dans le contexte de la page.',
    }),
    R('svg-informative-unnamed', {
      titre: 'SVG sans alternative ni masquage, hors bouton ou lien',
      wcag: ['1.1.1'], rgaa: ['1.1', '1.2'], gravite: 'Mineure',
      impact: 'Selon le navigateur, le SVG est ignoré ou restitué sans nom ; une information peut être perdue.',
      correction: 'SVG décoratif : aria-hidden="true". SVG porteur d’information : role="img" et aria-label ou <title> pertinent.',
      validation: 'Déterminer si le SVG est porteur d’information, puis contrôler l’arbre d’accessibilité.',
    }),

    // --- Cadres ------------------------------------------------------------
    R('iframe-title-missing', {
      titre: 'Cadre (iframe) sans attribut title',
      wcag: ['4.1.2'], rgaa: ['2.1'], gravite: 'Majeure',
      impact: 'Les utilisateurs de lecteur d’écran ne peuvent pas identifier le contenu du cadre.',
      correction: 'Ajouter un attribut title décrivant le contenu du cadre (ex. title="Carte d’accès au campus").',
      validation: 'Vérifier la présence et la pertinence du titre (RGAA 2.2).',
    }),

    // --- Couleurs ----------------------------------------------------------
    R('css-contrast-text', {
      titre: 'Contraste de texte insuffisant d’après les couleurs déclarées',
      wcag: ['1.4.3'], rgaa: ['3.2'], gravite: 'Majeure',
      impact: 'Texte difficile ou impossible à lire pour les personnes malvoyantes ou en environnement lumineux.',
      correction: 'Ajuster la couleur du texte ou du fond ; utiliser scripts/contrast.mjs --suggest pour une couleur vérifiée.',
      validation: 'Confirmer avec les styles calculés (analyse dynamique) dans tous les états et thèmes.',
    }),
    R('contrast-text', {
      titre: 'Contraste de texte insuffisant (styles calculés)',
      wcag: ['1.4.3'], rgaa: ['3.2'], gravite: 'Majeure',
      impact: 'Texte difficile ou impossible à lire pour les personnes malvoyantes ou en environnement lumineux.',
      correction: 'Ajuster la couleur du texte ou du fond ; vérifier la nouvelle paire avec scripts/contrast.mjs.',
      validation: 'Relancer scripts/dynamic-audit.mjs et vérifier les états survol, focus, erreur et le thème sombre.',
    }),
    R('contrast-undetermined', {
      titre: 'Contraste non calculable automatiquement (image, dégradé, superposition)',
      wcag: ['1.4.3'], rgaa: ['3.2'], gravite: 'Information',
      impact: 'Risque de texte illisible selon l’image ou le dégradé en arrière-plan.',
      correction: 'Garantir un fond de contraste suffisant sous le texte (voile, fond uni, ombre portée vérifiée).',
      validation: 'Mesure manuelle avec une pipette sur les zones les plus défavorables (outil type Colour Contrast Analyser).',
    }),

    // --- Liens -------------------------------------------------------------
    R('link-name-missing', {
      titre: 'Lien sans intitulé',
      wcag: ['2.4.4', '4.1.2'], rgaa: ['6.2'], gravite: 'Bloquante',
      impact: 'Le lien est annoncé sans nom (souvent par son URL) : sa destination est inconnue.',
      correction: 'Ajouter un texte visible, ou une alternative à l’image contenue, ou un aria-label reprenant l’intitulé visible.',
      validation: 'Vérifier le nom accessible du lien dans l’arbre d’accessibilité.',
    }),
    R('link-text-generic', {
      titre: 'Intitulé de lien générique à vérifier en contexte',
      wcag: ['2.4.4'], rgaa: ['6.1'], gravite: 'Mineure',
      impact: 'Hors contexte (liste des liens d’un lecteur d’écran), « en savoir plus » ne renseigne pas sur la destination.',
      correction: 'Rendre l’intitulé explicite ou s’assurer que le contexte du lien (RGAA, glossaire « contexte du lien ») suffit.',
      validation: 'Revue humaine du contexte du lien.',
    }),

    // --- Scripts / composants ---------------------------------------------
    R('button-name-missing', {
      titre: 'Bouton sans nom accessible',
      wcag: ['4.1.2'], rgaa: ['7.1', '11.9'], gravite: 'Bloquante',
      impact: 'Le bouton est annoncé « bouton » sans fonction identifiable.',
      correction: 'Ajouter un texte (visible ou visuellement masqué) ou aria-label ; masquer l’icône avec aria-hidden="true".',
      validation: 'Vérifier le nom accessible ; vérifier que le nom contient l’intitulé visible (2.5.3).',
    }),
    R('click-non-interactive', {
      titre: 'Élément non interactif avec gestionnaire de clic, sans rôle ni accès clavier',
      wcag: ['2.1.1', '4.1.2'], rgaa: ['7.1', '7.3'], gravite: 'Bloquante',
      impact: 'Fonction inutilisable au clavier et non identifiée par les technologies d’assistance.',
      correction: 'Utiliser un élément natif <button> (ou <a href> pour une navigation).',
      validation: 'Test clavier : atteindre l’élément avec Tab et l’activer avec Entrée et Espace.',
    }),
    R('role-interactive-not-focusable', {
      titre: 'Rôle interactif ARIA sur un élément non focalisable',
      wcag: ['2.1.1', '4.1.2'], rgaa: ['7.1', '7.3'], gravite: 'Bloquante',
      impact: 'Le composant est annoncé comme interactif mais ne peut pas être atteint au clavier.',
      correction: 'Préférer l’élément natif ; à défaut ajouter tabindex="0" et la gestion clavier attendue par le motif APG.',
      validation: 'Test clavier : atteinte, activation (Entrée/Espace selon le rôle), retour d’état.',
    }),
    R('role-interactive-no-key-handler', {
      titre: 'Rôle interactif ARIA avec gestionnaire de clic sans gestionnaire clavier',
      wcag: ['2.1.1'], rgaa: ['7.3'], gravite: 'Majeure',
      impact: 'L’élément reçoit le focus mais Entrée ou Espace ne l’activent probablement pas.',
      correction: 'Utiliser <button>, ou gérer keydown (Entrée et Espace pour role="button").',
      validation: 'Test clavier réel.',
    }),
    R('tabindex-positive', {
      titre: 'tabindex positif modifiant l’ordre de tabulation',
      wcag: ['2.4.3'], rgaa: ['12.8'], gravite: 'Mineure',
      impact: 'L’ordre de tabulation peut devenir incohérent par rapport à l’ordre visuel.',
      correction: 'Supprimer les tabindex positifs et ordonner le DOM selon l’ordre logique.',
      validation: 'Parcours au clavier de la page complète.',
    }),
    R('aria-hidden-focusable', {
      titre: 'Élément focalisable masqué aux technologies d’assistance (aria-hidden="true")',
      wcag: ['4.1.2'], rgaa: ['10.8'], gravite: 'Majeure',
      impact: 'Le focus atteint un élément que le lecteur d’écran ne restitue pas.',
      correction: 'Retirer aria-hidden, ou retirer l’élément de l’ordre de tabulation (inert, tabindex="-1", hidden).',
      validation: 'Parcours clavier avec lecteur d’écran.',
    }),
    R('aria-role-invalid', {
      titre: 'Valeur de rôle ARIA inexistante ou abstraite',
      wcag: ['4.1.2'], rgaa: ['7.1'], gravite: 'Majeure',
      impact: 'Le rôle est ignoré : le composant est restitué avec un rôle erroné.',
      correction: 'Utiliser un rôle concret défini par WAI-ARIA 1.2, ou un élément HTML natif.',
      validation: 'Contrôle de l’arbre d’accessibilité.',
    }),
    R('aria-reference-broken', {
      titre: 'Référence d’identifiant introuvable (for, aria-labelledby, aria-describedby, aria-controls)',
      wcag: ['1.3.1', '4.1.2'], rgaa: ['11.1', '7.1'], gravite: 'Majeure',
      impact: 'La relation (étiquette, description) n’est pas restituée.',
      correction: 'Faire correspondre la référence à l’id existant (unique) de l’élément visé.',
      validation: 'Contrôler la relation dans l’arbre d’accessibilité.',
    }),
    R('dialog-unlabelled', {
      titre: 'Fenêtre de dialogue sans nom accessible',
      wcag: ['4.1.2'], rgaa: ['7.1'], gravite: 'Majeure',
      impact: 'À l’ouverture, le lecteur d’écran n’annonce pas l’objet de la fenêtre.',
      correction: 'Ajouter aria-labelledby pointant vers le titre de la fenêtre (ou aria-label).',
      validation: 'Ouvrir la fenêtre avec un lecteur d’écran.',
    }),
    R('dialog-focus-management', {
      titre: 'Gestion du focus de la fenêtre de dialogue à vérifier',
      wcag: ['2.1.2', '2.4.3', '2.4.11'], rgaa: ['7.1', '12.8', '12.9'], gravite: 'Information',
      impact: 'Focus non déplacé dans la fenêtre, fuite du focus derrière la fenêtre modale ou focus perdu à la fermeture.',
      correction: 'Utiliser <dialog> et showModal(), ou suivre le motif « Dialog (Modal) » de l’APG : focus initial, maintien, Échap, retour au déclencheur.',
      validation: 'Test clavier : ouverture, Tab/Shift+Tab, Échap, position du focus après fermeture (scripts/dynamic-audit.mjs --dialog-trigger).',
    }),
    R('keyboard-shortcut-single-key', {
      titre: 'Raccourci clavier à touche unique probable',
      wcag: ['2.1.4'], rgaa: ['12.10'], gravite: 'Mineure',
      impact: 'Activation involontaire pour les utilisateurs de commande vocale.',
      correction: 'Permettre de désactiver ou reconfigurer le raccourci, ou l’activer seulement au focus du composant, ou ajouter une touche de modification.',
      validation: 'Revue du comportement et test avec la page active.',
    }),
    R('focus-removed-by-script', {
      titre: 'Script retirant le focus d’un élément',
      wcag: ['2.4.7', '2.1.1'], rgaa: ['7.3'], gravite: 'Majeure',
      impact: 'L’utilisateur clavier perd sa position.',
      correction: 'Supprimer l’appel à blur() déclenché à la prise de focus.',
      validation: 'Test clavier.',
    }),

    // --- Éléments obligatoires -------------------------------------------
    R('html-lang-missing', {
      titre: 'Langue par défaut absente',
      wcag: ['3.1.1'], rgaa: ['8.3'], gravite: 'Majeure',
      impact: 'La synthèse vocale peut lire le contenu avec une mauvaise prononciation.',
      correction: 'Ajouter lang="fr" (ou la langue principale) sur l’élément <html>.',
      validation: 'Vérifier l’attribut dans le DOM rendu et la pertinence du code (RGAA 8.4).',
    }),
    R('html-lang-invalid', {
      titre: 'Code de langue invalide ou vide',
      wcag: ['3.1.1'], rgaa: ['8.4'], gravite: 'Majeure',
      impact: 'La langue n’est pas reconnue par les technologies d’assistance.',
      correction: 'Utiliser un code BCP 47 valide (fr, fr-FR, en...).',
      validation: 'Vérifier le DOM rendu.',
    }),
    R('page-title-missing', {
      titre: 'Titre de page absent ou vide',
      wcag: ['2.4.2'], rgaa: ['8.5'], gravite: 'Majeure',
      impact: 'La page ne peut pas être identifiée (onglets, historique, lecteur d’écran).',
      correction: 'Ajouter un <title> pertinent ; dans une SPA, le mettre à jour à chaque changement de route.',
      validation: 'Vérifier le titre de chaque vue (RGAA 8.6 pertinence).',
    }),
    R('doctype-missing', {
      titre: 'Type de document absent',
      wcag: [], rgaa: ['8.1'], gravite: 'Mineure',
      impact: 'Mode de rendu « quirks » possible ; exigence propre au RGAA.',
      correction: 'Ajouter <!DOCTYPE html> en première ligne.',
      validation: 'Vérifier la source de la page.',
    }),
    R('presentational-markup', {
      titre: 'Balise obsolète de présentation ou de mouvement',
      wcag: ['2.2.2'], rgaa: ['13.8', '8.9'], gravite: 'Majeure',
      impact: 'Contenu en mouvement non contrôlable, distrayant pour les personnes ayant des troubles de l’attention.',
      correction: 'Supprimer <marquee>/<blink> ; si un défilement est nécessaire, fournir un bouton pause.',
      validation: 'Contrôle visuel du rendu.',
    }),

    // --- Structure ---------------------------------------------------------
    R('heading-structure', {
      titre: 'Hiérarchie des titres à vérifier (saut de niveau ou absence de titre de niveau 1)',
      wcag: ['1.3.1', '2.4.6'], rgaa: ['9.1'], gravite: 'Information',
      impact: 'La navigation par titres peut être moins efficace.',
      correction: 'Structurer les titres selon la hiérarchie du contenu.',
      validation: 'Revue humaine de la pertinence de la hiérarchie (RGAA 9.1).',
    }),
    R('landmark-main-missing', {
      titre: 'Zone de contenu principal non identifiée',
      wcag: ['1.3.1', '2.4.1'], rgaa: ['12.6'], gravite: 'Mineure',
      impact: 'Les utilisateurs de lecteur d’écran ne peuvent pas atteindre directement le contenu principal.',
      correction: 'Utiliser l’élément <main> (unique et visible).',
      validation: 'Contrôler les régions dans l’arbre d’accessibilité.',
    }),
    R('skip-link-missing', {
      titre: 'Lien d’évitement vers le contenu principal non détecté',
      wcag: ['2.4.1'], rgaa: ['12.7'], gravite: 'Mineure',
      impact: 'Les utilisateurs clavier doivent parcourir toute la navigation sur chaque page.',
      correction: 'Ajouter en début de page un lien « Aller au contenu » visible au moins à la prise de focus.',
      validation: 'Test clavier : premier Tab, activation, position du focus. RGAA 12.7 prévoit des cas particuliers.',
    }),
    R('table-structure', {
      titre: 'Tableau sans en-têtes déclarés',
      wcag: ['1.3.1'], rgaa: ['5.6', '5.8'], gravite: 'Majeure',
      impact: 'Les cellules sont lues sans leurs en-têtes : les données deviennent incompréhensibles.',
      correction: 'Tableau de données : <th scope="col|row">, <caption>. Tableau de mise en forme : role="presentation" et aucun élément de tableau de données.',
      validation: 'Déterminer la nature du tableau puis tester la restitution au lecteur d’écran.',
    }),

    // --- Présentation ------------------------------------------------------
    R('focus-outline-removed', {
      titre: 'Indicateur de focus supprimé sans style de remplacement détecté',
      wcag: ['2.4.7'], rgaa: ['10.7'], gravite: 'Bloquante',
      impact: 'Les utilisateurs clavier ne savent pas où se trouve le focus.',
      correction: 'Supprimer outline: none, ou définir un style :focus-visible visible (outline de 2 px contrasté, par exemple).',
      validation: 'Parcours au clavier : le focus doit être visible sur chaque élément (scripts/dynamic-audit.mjs compare l’état avec et sans focus).',
    }),
    R('focus-not-visible', {
      titre: 'Aucun changement visuel à la prise de focus',
      wcag: ['2.4.7'], rgaa: ['10.7'], gravite: 'Bloquante',
      impact: 'Les utilisateurs clavier ne savent pas où se trouve le focus.',
      correction: 'Définir un style :focus-visible visible et suffisamment contrasté (voir 1.4.11 et 2.4.13 AAA).',
      validation: 'Parcours au clavier, comparaison visuelle.',
    }),
    R('focus-obscured', {
      titre: 'Élément focalisé entièrement masqué par un autre contenu',
      wcag: ['2.4.11'], rgaa: [], gravite: 'Majeure',
      impact: 'L’utilisateur clavier ne voit pas l’élément qui a le focus (en-tête fixe, bannière cookies...).',
      correction: 'Utiliser scroll-padding, éviter les recouvrements par des éléments fixes ou permettre de fermer le contenu recouvrant.',
      validation: 'Parcours clavier en conditions réelles (dont zoom et petites fenêtres).',
    }),
    R('text-fixed-height-overflow', {
      titre: 'Conteneur à hauteur fixe avec débordement masqué',
      wcag: ['1.4.4', '1.4.12'], rgaa: ['10.4', '10.12'], gravite: 'Majeure',
      impact: 'À 200 % ou avec un espacement de texte augmenté, le texte risque d’être coupé.',
      correction: 'Remplacer height par min-height, ou supprimer overflow: hidden sur les conteneurs de texte.',
      validation: 'Zoom texte 200 % et bookmarklet d’espacement du texte (scripts/dynamic-audit.mjs).',
    }),
    R('css-fixed-width', {
      titre: 'Largeur minimale fixe supérieure à 320 px CSS',
      wcag: ['1.4.10'], rgaa: ['10.11'], gravite: 'Majeure',
      impact: 'À 320 px de large (zoom 400 %), le contenu impose un défilement horizontal.',
      correction: 'Remplacer width/min-width fixes par max-width, des grilles fluides ou des requêtes média.',
      validation: 'Fenêtre de 320 px CSS de large : aucun défilement horizontal hors exceptions (tableaux, cartes, schémas).',
    }),
    R('text-truncation', {
      titre: 'Texte tronqué par ellipse',
      wcag: ['1.4.4', '1.4.10'], rgaa: ['10.4', '10.11'], gravite: 'Information',
      impact: 'Information perdue si le texte complet n’est disponible par aucun autre moyen.',
      correction: 'Permettre l’affichage du texte complet (retour à la ligne, info-bulle accessible au clavier, page détail).',
      validation: 'Vérifier à 320 px de large et à 200 % que l’information reste disponible.',
    }),
    R('font-size-viewport-units', {
      titre: 'Taille de police en unités de viewport sans composante relative',
      wcag: ['1.4.4'], rgaa: ['10.4'], gravite: 'Majeure',
      impact: 'Le zoom du navigateur n’agrandit pas (ou peu) ce texte.',
      correction: 'Utiliser clamp(1rem, 0.8rem + 1vw, 2rem) ou des unités rem/em.',
      validation: 'Zoom 200 % : vérifier l’agrandissement effectif du texte.',
    }),
    R('viewport-zoom-disabled', {
      titre: 'Zoom utilisateur bloqué par la balise meta viewport',
      wcag: ['1.4.4'], rgaa: ['10.4'], gravite: 'Majeure',
      impact: 'Sur certains navigateurs mobiles, l’agrandissement est impossible.',
      correction: 'Supprimer user-scalable=no et maximum-scale (ou le fixer à 5 au moins).',
      validation: 'Test de zoom par pincement sur mobile.',
    }),
    R('hover-only-content', {
      titre: 'Contenu affiché au survol sans équivalent au focus détecté',
      wcag: ['1.4.13', '2.1.1'], rgaa: ['10.13', '10.14'], gravite: 'Majeure',
      impact: 'Menus ou infobulles inaccessibles au clavier.',
      correction: 'Ajouter :focus-within / :focus-visible, ou piloter l’affichage par un bouton (aria-expanded).',
      validation: 'Test clavier et vérification des conditions de 1.4.13 (masquable, survolable, persistant).',
    }),
    R('small-text-readability', {
      titre: 'Texte de très petite taille (lisibilité)',
      wcag: [], rgaa: [], gravite: 'Information',
      impact: 'Lisibilité réduite ; aucune taille minimale n’est imposée par WCAG ou RGAA.',
      correction: 'Envisager une taille plus grande pour les contenus de lecture ; garantir l’agrandissement à 200 %.',
      validation: 'Avis ergonomique ; ce n’est pas une non-conformité.',
    }),

    // --- Formulaires -------------------------------------------------------
    R('form-label-missing', {
      titre: 'Champ de formulaire sans étiquette',
      wcag: ['1.3.1', '3.3.2', '4.1.2'], rgaa: ['11.1'], gravite: 'Bloquante',
      impact: 'La nature de la saisie n’est pas annoncée aux utilisateurs de lecteur d’écran.',
      correction: 'Associer un <label for="id"> visible (ou aria-labelledby vers un texte visible).',
      validation: 'Vérifier le nom accessible et la pertinence de l’étiquette (RGAA 11.2).',
    }),
    R('form-placeholder-only', {
      titre: 'Champ dont la seule indication est le placeholder',
      wcag: ['3.3.2'], rgaa: ['11.1'], gravite: 'Majeure',
      impact: 'L’indication disparaît à la saisie ; le placeholder ne figure pas parmi les étiquettes admises par le test RGAA 11.1.1.',
      correction: 'Ajouter une étiquette visible associée au champ ; conserver le placeholder pour un exemple de format éventuellement.',
      validation: 'Vérifier l’étiquette et la restitution.',
    }),
    R('form-autocomplete-missing', {
      titre: 'Champ de donnée personnelle sans attribut autocomplete',
      wcag: ['1.3.5'], rgaa: ['11.13'], gravite: 'Mineure',
      impact: 'Remplissage automatique impossible : effort accru pour les personnes ayant des troubles moteurs ou cognitifs.',
      correction: 'Ajouter autocomplete avec la valeur adaptée (email, given-name, family-name, tel, postal-code...).',
      validation: 'Vérifier que le champ concerne bien l’utilisateur lui-même.',
    }),
    R('form-autocomplete-invalid', {
      titre: 'Valeur autocomplete non reconnue',
      wcag: ['1.3.5'], rgaa: ['11.13'], gravite: 'Mineure',
      impact: 'La finalité du champ n’est pas déterminable.',
      correction: 'Utiliser une valeur de la liste HTML « autofill field names ».',
      validation: 'Contrôle de la valeur.',
    }),
    R('form-error-association', {
      titre: 'Messages d’erreur à vérifier (association au champ, restitution)',
      wcag: ['3.3.1', '3.3.3', '4.1.3'], rgaa: ['11.10', '11.11', '7.5'], gravite: 'Information',
      impact: 'Erreurs non annoncées ou non reliées au champ concerné.',
      correction: 'Relier le message via aria-describedby, aria-invalid="true" ; annoncer le récapitulatif (role="alert" ou focus).',
      validation: 'Soumettre le formulaire avec erreurs au clavier et au lecteur d’écran.',
    }),

    // --- Multimédia --------------------------------------------------------
    R('media-autoplay-audio', {
      titre: 'Média en lecture automatique avec son',
      wcag: ['1.4.2'], rgaa: ['4.10'], gravite: 'Majeure',
      impact: 'Le son gêne la lecture du lecteur d’écran.',
      correction: 'Supprimer autoplay ou ajouter muted ; fournir des contrôles accessibles.',
      validation: 'Vérifier la durée (plus de 3 secondes) et la présence d’un contrôle.',
    }),
    R('media-autoplay-motion', {
      titre: 'Vidéo en lecture automatique sans contrôles natifs',
      wcag: ['2.2.2'], rgaa: ['13.8', '4.11'], gravite: 'Majeure',
      impact: 'Contenu en mouvement impossible à mettre en pause.',
      correction: 'Ajouter controls ou un bouton pause accessible ; respecter prefers-reduced-motion.',
      validation: 'Vérifier la durée (plus de 5 secondes) et le mécanisme de pause.',
    }),
    R('media-captions-check', {
      titre: 'Sous-titres et transcription à vérifier',
      wcag: ['1.2.1', '1.2.2', '1.2.3', '1.2.5'], rgaa: ['4.1', '4.3', '4.5'], gravite: 'Information',
      impact: 'Contenu audio inaccessible aux personnes sourdes, contenu visuel inaccessible aux personnes aveugles.',
      correction: 'Fournir sous-titres synchronisés (<track kind="captions">), transcription et audiodescription si nécessaire.',
      validation: 'Revue humaine du média et de ses alternatives.',
    }),

    // --- Consultation ------------------------------------------------------
    R('meta-refresh', {
      titre: 'Rafraîchissement ou redirection temporisée via meta refresh',
      wcag: ['2.2.1'], rgaa: ['13.1'], gravite: 'Majeure',
      impact: 'Changement de contenu non contrôlé par l’utilisateur.',
      correction: 'Supprimer la temporisation (redirection côté serveur ou immédiate).',
      validation: 'Contrôle de la source.',
    }),
    R('animation-infinite', {
      titre: 'Animation infinie ou longue démarrant automatiquement',
      wcag: ['2.2.2'], rgaa: ['13.8'], gravite: 'Majeure',
      impact: 'Distraction, difficulté de lecture ; mouvement non contrôlable.',
      correction: 'Fournir un moyen de mettre en pause, arrêter ou masquer ; limiter à 5 secondes ; respecter prefers-reduced-motion.',
      validation: 'Vérifier la durée réelle, la présence d’un contrôle, et le caractère « essentiel ».',
    }),
    R('reduced-motion-missing', {
      titre: 'Animations sans prise en compte de prefers-reduced-motion',
      wcag: ['2.3.3'], rgaa: [], gravite: 'Information',
      impact: 'Les personnes sensibles au mouvement (troubles vestibulaires) subissent les animations.',
      correction: 'Ajouter @media (prefers-reduced-motion: reduce) pour supprimer ou réduire les animations non essentielles.',
      validation: 'Activer « réduire les animations » dans le système et vérifier.',
    }),
    R('new-window-unannounced', {
      titre: 'Lien ouvrant une nouvelle fenêtre sans indication',
      wcag: [], rgaa: [], gravite: 'Information',
      impact: 'Désorientation (bouton retour inopérant).',
      correction: 'Indiquer « nouvelle fenêtre » dans l’intitulé ou le title du lien (technique WCAG G201, consultative).',
      validation: 'Revue des liens.',
    }),
    R('downloadable-document', {
      titre: 'Document en téléchargement à auditer',
      wcag: ['1.1.1', '1.3.1', '1.3.2', '2.4.1', '2.4.3', '3.1.1', '4.1.2'], rgaa: ['13.3', '13.4'], gravite: 'Information',
      impact: 'Un document non structuré ou scanné est inexploitable avec un lecteur d’écran.',
      correction: 'Fournir une version accessible (document balisé ou alternative HTML) ; indiquer format et poids dans le lien.',
      validation: 'Audit documentaire (balises, ordre de lecture, alternatives, langue, titre) : voir references/documents.md.',
    }),

    // --- Dynamiques ----------------------------------------------------------
    R('reflow-horizontal-scroll', {
      titre: 'Défilement horizontal à 320 px CSS de large',
      wcag: ['1.4.10'], rgaa: ['10.11'], gravite: 'Majeure',
      impact: 'Avec un zoom à 400 %, la lecture exige un défilement dans deux directions.',
      correction: 'Mise en page fluide (flex-wrap, grid avec minmax, max-width: 100 %).',
      validation: 'Fenêtre de 1280 px zoomée à 400 % ; exceptions : tableaux, cartes, schémas.',
    }),
    R('text-spacing-clipping', {
      titre: 'Contenu coupé avec l’espacement du texte augmenté',
      wcag: ['1.4.12'], rgaa: ['10.12'], gravite: 'Majeure',
      impact: 'Texte coupé ou superposé pour les utilisateurs qui adaptent l’espacement.',
      correction: 'Éviter les hauteurs fixes et overflow: hidden sur les conteneurs de texte.',
      validation: 'Appliquer les valeurs 1.4.12 et contrôler visuellement.',
    }),
    R('text-resize-clipping', {
      titre: 'Texte coupé lors de l’agrandissement à 200 %',
      wcag: ['1.4.4'], rgaa: ['10.4'], gravite: 'Majeure',
      impact: 'Les personnes malvoyantes qui agrandissent le texte perdent une partie du contenu.',
      correction: 'Supprimer les hauteurs fixes et overflow: hidden des conteneurs de texte ; utiliser des unités relatives.',
      validation: 'Zoom du navigateur à 200 % et agrandissement du texte seul (Firefox) : aucun texte coupé ni superposé.',
    }),
    R('contrast-non-text-field', {
      titre: 'Limites de champ de formulaire peu contrastées',
      wcag: ['1.4.11'], rgaa: ['3.3'], gravite: 'Mineure',
      impact: 'Les personnes malvoyantes ne repèrent pas la zone de saisie.',
      correction: 'Bordure ou fond du champ avec un contraste d’au moins 3:1 par rapport au fond adjacent.',
      validation: 'Vérifier si d’autres indices visuels permettent d’identifier le champ (le critère porte sur l’information nécessaire à l’identification).',
    }),
    R('target-size-minimum', {
      titre: 'Cible de pointage inférieure à 24 × 24 px CSS sans espacement suffisant',
      wcag: ['2.5.8'], rgaa: [], gravite: 'Mineure',
      impact: 'Activation difficile pour les personnes ayant des troubles moteurs.',
      correction: 'Agrandir la zone cliquable (padding, min-width/min-height) ou espacer les cibles.',
      validation: 'Vérifier les exceptions (en ligne dans une phrase, équivalent, agent utilisateur, essentiel).',
    }),
    R('keyboard-unreachable', {
      titre: 'Élément cliquable non atteignable au clavier',
      wcag: ['2.1.1'], rgaa: ['7.3', '12.8'], gravite: 'Bloquante',
      impact: 'Fonction inutilisable sans souris.',
      correction: 'Utiliser un élément natif focalisable (<button>, <a href>).',
      validation: 'Parcours Tab complet.',
    }),
    R('keyboard-trap', {
      titre: 'Piège au clavier probable',
      wcag: ['2.1.2'], rgaa: ['12.9'], gravite: 'Bloquante',
      impact: 'L’utilisateur clavier ne peut plus quitter le composant.',
      correction: 'Permettre la sortie par Tab/Shift+Tab ou Échap, sauf fenêtre modale correctement fermable.',
      validation: 'Test clavier manuel.',
    }),
    R('dialog-focus-not-moved', {
      titre: 'Focus non déplacé dans la fenêtre de dialogue à l’ouverture',
      wcag: ['2.4.3'], rgaa: ['12.8', '7.1'], gravite: 'Majeure',
      impact: 'L’utilisateur clavier ou de lecteur d’écran ne sait pas que la fenêtre est ouverte.',
      correction: 'Déplacer le focus dans la fenêtre à l’ouverture (showModal() le fait nativement).',
      validation: 'Test clavier et lecteur d’écran.',
    }),
    R('dialog-focus-escapes', {
      titre: 'Le focus sort de la fenêtre modale',
      wcag: ['2.4.3'], rgaa: ['12.8'], gravite: 'Majeure',
      impact: 'L’utilisateur atteint le contenu masqué derrière la fenêtre modale.',
      correction: 'Rendre le reste de la page inerte (inert) ou utiliser <dialog> avec showModal().',
      validation: 'Tab et Shift+Tab répétés dans la fenêtre.',
    }),
    R('dialog-focus-not-returned', {
      titre: 'Focus non restitué au déclencheur à la fermeture',
      wcag: ['2.4.3'], rgaa: ['12.8'], gravite: 'Majeure',
      impact: 'Après fermeture, l’utilisateur clavier repart du début de la page.',
      correction: 'Mémoriser le déclencheur et lui rendre le focus à la fermeture.',
      validation: 'Ouvrir, fermer (Échap et bouton), vérifier le focus.',
    }),
    R('dialog-escape', {
      titre: 'La touche Échap ne ferme pas la fenêtre modale',
      wcag: [], rgaa: [], gravite: 'Mineure',
      impact: 'Comportement attendu absent (motif APG Dialog).',
      correction: 'Fermer la fenêtre sur Échap.',
      validation: 'Test clavier. Recommandation APG, pas une exigence normative en soi.',
    }),
    R('axe-violation', {
      titre: 'Violation remontée par axe-core',
      wcag: [], rgaa: [], gravite: 'Majeure',
      impact: 'Voir la description de la règle axe-core.',
      correction: 'Voir la documentation de la règle axe-core.',
      validation: 'Relancer axe-core ; confirmer le critère concerné.',
    }),
  ].map((r) => [r.id, r]),
);
