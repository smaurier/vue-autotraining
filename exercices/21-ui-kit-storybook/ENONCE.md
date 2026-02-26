# Exercice 21 — UI Kit (Storybook patterns)

**Module** : 06-Storybook · **Difficulté** : ⭐⭐⭐⭐
**Cours** : `cours/06-storybook/01` à `03`

## Objectif

Construire une bibliothèque de composants UI réutilisables avec les principes de Storybook : composants isolés, props variées, documentation visuelle.

> **Note** : Affiché comme un showcase dans App.vue (pas besoin d'installer Storybook).

## Consignes

### Composants UI

1. `AppButton.vue` :
   - Props : `variant: 'primary' | 'secondary' | 'danger' | 'ghost'`
   - Props : `size: 'sm' | 'md' | 'lg'`, `disabled`, `loading`
   - Slot default pour le label

2. `AppInput.vue` :
   - Props : `type: 'text' | 'email' | 'password'`, `label`, `error`, `placeholder`
   - `defineModel()` pour v-model
   - État focus, error

3. `AppBadge.vue` :
   - Props : `color: 'info' | 'success' | 'warning' | 'error'`
   - Slot default

4. `AppModal.vue` :
   - Props : `isOpen`, `title`
   - Emits : `close`
   - Slots : header, default, footer
   - Fermeture via Escape et clic overlay

5. `AppAlert.vue` :
   - Props : `type: 'info' | 'success' | 'warning' | 'error'`, `dismissible`
   - Emits : `dismiss`

### Showcase

6. `UIShowcase.vue` : affiche tous les composants dans toutes leurs variantes, comme un mini-Storybook visuel avec sections par composant.

## Contraintes TypeScript

- Toutes les props typées via `defineProps<{…}>()`
- Emits typés
- Zero `any`

## Fichiers

→ `src/exercises/ex21/UIShowcase.vue`
→ `src/exercises/ex21/components/AppButton.vue`
→ `src/exercises/ex21/components/AppInput.vue`
→ `src/exercises/ex21/components/AppBadge.vue`
→ `src/exercises/ex21/components/AppModal.vue`
→ `src/exercises/ex21/components/AppAlert.vue`
