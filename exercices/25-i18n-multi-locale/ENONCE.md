# Exercice 25 — Application multilingue

**Module** : 10-i18n · **Difficulté** : ⭐⭐⭐
**Cours** : `cours/10-i18n/01` et `02`

## Objectif

Construire une mini-application e-commerce avec **internationalisation complète** : traductions, pluralisation, formatage de dates/nombres, et switch de locale persisté.

## Consignes

1. Créer les fichiers de traduction pour **3 langues** : `fr`, `en`, `es`
2. Sélecteur de langue dans le header (drapeau ou select) — la locale est persistée en `localStorage`
3. Page produit avec :
   - Titre traduit
   - Prix formaté selon la locale (`n()`)
   - Stock avec pluralisation (`0 | 1 | 2+`)
   - Date d'ajout formatée (`d()`)
4. Formulaire de contact avec labels, placeholders et messages de validation traduits
5. Composable `useLocale()` qui gère : switch de locale, persistence, sync `document.lang`
6. Toutes les chaînes visibles passent par `t()` — **aucune chaîne en dur**

## Contraintes TypeScript

- Clés i18n typées (déclaration `DefineLocaleMessage`)
- Composable `useLocale` avec types explicites
- Zéro `any`

## Bonus

- Lazy loading des traductions (la langue par défaut est inline, les autres chargées à la demandé)
- Composant `<i18n-t>` pour interpolation de composants dans les traductions

## Fichiers

→ `src/exercises/ex25/I18nApp.vue`
→ `src/exercises/ex25/locales/fr.ts`
→ `src/exercises/ex25/locales/en.ts`
→ `src/exercises/ex25/locales/es.ts`
→ `src/exercises/ex25/composables/useLocale.ts`
→ `src/exercises/ex25/components/ProductCard.vue`
→ `src/exercises/ex25/components/ContactForm.vue`
