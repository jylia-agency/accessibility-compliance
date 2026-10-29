# Formulaires

Critères : WCAG 2.2 **1.3.1**, **1.3.5**, **2.4.6**, **2.5.3**, **3.2.2**, **3.3.1**, **3.3.2**, **3.3.3**, **3.3.4**, **3.3.7** (A), **3.3.8** (AA), **4.1.2**, **4.1.3** ; RGAA **11.1 à 11.13**, **7.4**, **7.5**.

## Contrôles

| Point | Attendu | Critères | Méthode |
|---|---|---|---|
| Étiquette | Chaque champ a une étiquette : `<label for>`, `aria-labelledby`, `aria-label`, `title`, ou bouton adjacent (cas particulier du test 11.1.1) | RGAA 11.1 ; WCAG 1.3.1, 3.3.2, 4.1.2 | Statique (échec démontré dans un document complet ; risque dans un composant partiel) |
| Placeholder seul | **Non admis** comme étiquette par le test RGAA 11.1.1 ; disparaît à la saisie | RGAA 11.1 ; WCAG 3.3.2 | Statique |
| Pertinence de l'étiquette | Décrit la saisie attendue ; contient l'intitulé visible | RGAA 11.2 ; WCAG 2.4.6, 2.5.3 | Manuel |
| Étiquette accolée au champ | Proximité visuelle | RGAA 11.4 | Manuel |
| Champs obligatoires | Indiqués dans l'étiquette ou avant le formulaire de façon perceptible (pas seulement par couleur ou astérisque non explicité) | RGAA 11.10 ; WCAG 3.3.2 | Manuel |
| Formats attendus | Indiqués (exemple de format) et reliés (`aria-describedby`) | RGAA 11.10 ; WCAG 3.3.2 | Manuel |
| Erreurs | Identifiées en texte, reliées au champ, annoncées ; `aria-invalid="true"` | RGAA 11.10, 7.5 ; WCAG 3.3.1, 4.1.3 | Manuel + scénario |
| Suggestions de correction | Proposées lorsqu'elles sont connues | RGAA 11.11 ; WCAG 3.3.3 | Manuel |
| Prévention des erreurs (données juridiques, financières, modification ou suppression de données, examens) | Réversible, ou vérifié, ou confirmé | RGAA 11.12 ; WCAG 3.3.4 | Manuel |
| Regroupements | `<fieldset>` et `<legend>` (ou `role="group"` nommé) pour les champs de même nature (boutons radio, adresse) | RGAA 11.5 à 11.7 ; WCAG 1.3.1 | Statique (indices) + manuel |
| Listes de choix | `<optgroup>` pertinents | RGAA 11.8 | Manuel |
| Boutons | Intitulé pertinent, contenant l'intitulé visible | RGAA 11.9 ; WCAG 2.5.3, 4.1.2 | Statique + manuel |
| Autocomplétion | `autocomplete` valide pour les champs **relatifs à l'utilisateur lui-même** | RGAA 11.13 ; WCAG 1.3.5 | Statique (valeur invalide : risque élevé ; absence : risque moyen) |
| Changement de contexte à la saisie | Pas de soumission ou navigation automatique à la sélection sans avertissement | RGAA 7.4 ; WCAG 3.2.2 | Manuel |
| Saisie redondante | Informations déjà fournies dans le processus pré-remplies ou sélectionnables | WCAG 3.3.7 (nouveau 2.2, pas d'équivalent RGAA 4.1.2) | Manuel sur les parcours multi-étapes |
| Authentification accessible | Pas de test cognitif sans alternative ; collage et gestionnaires de mots de passe permis ; CAPTCHA avec alternative | WCAG 3.3.8 (AA, nouveau 2.2) ; RGAA 1.4, 1.5 (CAPTCHA) | Statique (indices : `onpaste` bloquant, `autocomplete="off"` sur le mot de passe) + manuel |
| Délais | Sessions et limites de temps contrôlables | RGAA 13.1 ; WCAG 2.2.1 | Manuel |

## Parcours à tester en priorité

1. **Connexion** : étiquettes, `autocomplete="username"` et `current-password`, affichage du mot de passe (bouton nommé, état annoncé), erreurs, CAPTCHA, double authentification (saisie du code : `autocomplete="one-time-code"`, pas de limite de temps non contrôlable).
2. **Inscription** : `new-password`, règles de mot de passe annoncées avant la saisie, erreurs reliées.
3. **Paiement** : `cc-*`, prévention des erreurs (récapitulatif, confirmation), délais de session.
4. **Recherche** : nom du champ, bouton nommé, annonce du nombre de résultats (message de statut).
5. **Administration** : tableaux éditables, actions groupées, confirmations de suppression (3.3.4), messages de statut.

## Exemple de correction

```html
<!-- Défaut -->
<input type="email" id="email" placeholder="Votre adresse e-mail">

<!-- Correction -->
<label for="email">Adresse électronique (obligatoire)</label>
<p id="email-hint">Format attendu : nom@domaine.fr</p>
<input type="email" id="email" name="email" autocomplete="email" required
       aria-describedby="email-hint email-error">
<p id="email-error" hidden></p>
<!-- En cas d'erreur : texte explicite, aria-invalid="true", focus sur le champ ou récapitulatif annoncé -->
```

Effets de bord à signaler : modification de la mise en page (étiquette visible) ; tests de bout en bout fondés sur le placeholder ; traductions.
