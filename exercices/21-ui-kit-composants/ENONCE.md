# Exercice 21b — UI Kit composants avancés

**Module** : 06-Storybook · **Difficulté** : ⭐⭐⭐⭐
**Cours** : `cours/06-storybook/02` (Stories), `cours/06-storybook/03` (Design system)
**Renforce** : exercice 21 (ui-kit-storybook) — angle composants complexes

## Objectif

Aller au-delà des composants atomiques (bouton, input) pour construire des **composants composés** (compound components) utilisables dans un vrai design system. L'ex21 couvre le showcase UI de base ; ici on traite les **patterns avancés de composition de composants**.

## Consignes

### Composants composés

1. **Modal** : `AppModal` + `AppModalHeader` + `AppModalBody` + `AppModalFooter` (composition via slots nommés)
2. **Tabs** : `AppTabs` + `AppTab` (provide/inject pour le state partagé)
3. **Dropdown** : `AppDropdown` + `AppDropdownItem` (gestion du focus, clavier, fermeture externe)
4. **Toast** : `AppToast` + composable `useToast()` (notification system)

### Design tokens

5. Tous les composants utilisent des CSS custom properties (tokens)
6. Thème clair/sombre via une classe CSS sur le conteneur parent

### Documentation

7. Chaque composant a un fichier `.stories.ts` avec au minimum :
   - Story par défaut
   - Toutes les variantes
   - Story interactive (actions loguées)

## Contraintes TypeScript

- Chaque composant a ses `Props` et `Emits` typés
- `provide/inject` typé avec `InjectionKey`
- Zéro `any`

## Bonus

- Composant `AppFormField` qui wraps label + input + erreur avec validation
- Composant `AppConfirm` (modale de confirmation) avec promesse

## Fichiers

→ `src/exercises/ex21b/components/AppModal.vue`
→ `src/exercises/ex21b/components/AppTabs.vue`
→ `src/exercises/ex21b/components/AppTab.vue`
→ `src/exercises/ex21b/components/AppDropdown.vue`
→ `src/exercises/ex21b/components/AppToast.vue`
→ `src/exercises/ex21b/composables/useToast.ts`
→ `src/exercises/ex21b/UIKitDemo.vue`
