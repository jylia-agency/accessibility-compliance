# Responsive, mobile et PWA

Critères : WCAG 2.2 **1.3.4** Orientation (AA), **1.4.4**, **1.4.10**, **1.4.13**, **2.5.1** Pointer Gestures (A), **2.5.2** Pointer Cancellation (A), **2.5.4** Motion Actuation (A), **2.5.7** Dragging Movements (AA), **2.5.8** Target Size (Minimum) (AA), **2.5.5** (AAA), **3.2.3**, **4.1.3** ; RGAA **10.11**, **13.9**, **13.10**, **13.11**, **13.12**, **12.2**.

## Contrôles

| Point | Attendu | Méthode |
|---|---|---|
| Redistribution | Pas de défilement horizontal à 320 px CSS (hors contenus en deux dimensions) | `dynamic-audit.mjs` (capture `page-N-320px.png`) |
| Orientation | Contenu utilisable en portrait et paysage, sauf orientation essentielle (1.3.4 ; RGAA 13.9) | Statique (indices : `screen.orientation.lock`, CSS cachant le contenu selon `orientation`) + manuel |
| Zoom | Non bloqué ; contenu utilisable à 200 % | Statique + dynamique |
| Taille des cibles | **2.5.8 (AA)** : 24 × 24 px CSS **ou** exceptions (espacement, équivalent, en ligne, agent utilisateur, essentiel). **44 × 44 px est le seuil de 2.5.5, niveau AAA** : recommandation, pas exigence AA | `dynamic-audit.mjs` mesure la taille et l'espacement (cercle de 24 px) ; exceptions à juger |
| Gestes complexes | Alternative à pointeur unique pour les gestes multipoints ou à trajectoire (balayage, pincement) (2.5.1 ; RGAA 13.10) | Revue des composants (carrousels, cartes, galeries) + manuel |
| Annulation du pointeur | Activation au relâchement ou annulable (2.5.2 ; RGAA 13.11) | Statique (indices : action sur `mousedown`/`pointerdown`/`touchstart`) + manuel |
| Mouvement de l'appareil | Alternative et désactivation possibles (2.5.4 ; RGAA 13.12) | Statique (`devicemotion`, `deviceorientation`) + manuel |
| Glisser-déposer | Alternative à pointeur unique (2.5.7, nouveau 2.2) | Revue des composants de tri, curseurs, tableaux Kanban |
| Menus mobiles | Bouton nommé, `aria-expanded` synchronisé, focus géré, fermeture au clavier | Statique + dynamique + manuel |
| Navigation cohérente | Mêmes mécanismes de navigation au même endroit (3.2.3 ; RGAA 12.2) | Manuel |
| SPA : changements de route | Titre de page mis à jour, focus déplacé, annonce de la nouvelle vue | Manuel + scénario dynamique |
| PWA installée | Mode `standalone` : pas de barre d'adresse ni de bouton retour du navigateur ; navigation de retour fournie par l'application ; `lang` et titre corrects ; écran de démarrage sans information essentielle | Manuel ; inventaire statique (manifeste, service worker) |
| Hors ligne | Message de statut annoncé (4.1.3), page hors ligne accessible | Manuel |
| Notifications, dialogues | Messages de statut annoncés ; dialogues accessibles (voir `keyboard-navigation.md`) | Manuel |

## Applications mobiles natives

Les scripts du skill analysent des technologies web. Pour une application native (Android, iOS, Flutter, React Native compilé), voir `references/mobile-native.md` : l'inventaire signale le code natif, mais l'audit requiert les outils de la plateforme (Accessibility Scanner, Accessibility Inspector, TalkBack, VoiceOver) et la **clause 11 d'EN 301 549**. Ne jamais présenter un audit web d'une WebView comme un audit de l'application native.
