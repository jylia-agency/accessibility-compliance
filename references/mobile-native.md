# Applications mobiles natives (extension prévue)

Le skill audite des technologies **web**. L'architecture prévoit l'extension aux applications natives sans prétendre les couvrir aujourd'hui.

## Ce que fait le skill actuellement

- L'inventaire détecte le code natif : `AndroidManifest.xml`, projets Xcode, `Info.plist`, `pubspec.yaml` (Flutter), dépendances React Native, Capacitor, Ionic.
- Les **WebView** et applications hybrides (Capacitor, Ionic, Cordova) peuvent être auditées pour leur partie web, en le précisant.
- Le rapport classe toute la partie native en « **Non testé** » avec la mention « hors périmètre des outils web ».

## Référentiels applicables aux applications

- **EN 301 549, clause 11** (logiciels) et clause 9 transposée ; **WCAG 2.2** appliquées aux applications selon le document W3C « Guidance on Applying WCAG 2.2 to Non-Web ICT » (WCAG2ICT).
- **RGAA 4.1.2** : les écrans d'applications mobiles comptent comme des pages (échantillon), mais les tests du RGAA 4.1.2 sont rédigés pour le HTML. Le RGAA 5 annonce des critères pour les applications mobiles (V2, non publié au 29/10/2026).
- Article 47 : les applications mobiles des organismes concernés entrent dans le champ.

## Pistes d'extension (non implémentées)

| Plateforme | Outils de la plateforme | Contrôles automatisables |
|---|---|---|
| Android | Accessibility Scanner, Espresso Accessibility Checks, TalkBack, Layout Inspector | `contentDescription`, `importantForAccessibility`, tailles de cible (48 dp recommandé par Google, recommandation de plateforme), contrastes |
| iOS | Accessibility Inspector, XCUITest `performAccessibilityAudit()`, VoiceOver | `accessibilityLabel`, `accessibilityTraits`, Dynamic Type |
| Flutter | `flutter test` avec `meetsGuideline` (`androidTapTargetGuideline`, `textContrastGuideline`, `labeledTapTargetGuideline`) | Libellés sémantiques, cibles, contraste |
| React Native | `accessibilityLabel`, `accessibilityRole`, outils de test de la plateforme | Analyse statique JSX adaptable |

Une extension doit : ajouter des règles dédiées dans `scripts/lib/rules.mjs` (préfixe `native-`), des fixtures natives, et documenter les critères EN 301 549 clause 11 visés. Les tailles recommandées par les plateformes (48 dp, 44 pt) sont des **recommandations de plateforme**, pas des exigences WCAG.
