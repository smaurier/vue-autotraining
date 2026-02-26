# Exercice 07 — Options → Composition API

**Module** : 01-Débutant · **Difficulté** : ⭐⭐
**Cours** : `cours/01-debutant/07` (Options API vs Composition API)

## Objectif

Comprendre la différence entre Options API et Composition API en convertissant un composant.

## Consignes

### Partie 1 — Options API

1. Créer `UserListOptions.vue` en Options API :
   - `data()` : `users: User[]`, `newName: string`, `search: string`
   - `computed` : `filteredUsers`
   - `methods` : `addUser()`, `removeUser(id)`, `toggleActive(id)`
   - `watch` : watcher sur `users` qui log le total

### Partie 2 — Composition API

2. Créer `UserListComposition.vue` — exactement le même comportement :
   - `ref`, `computed`, `watch` dans `<script setup>`
   - Même template, mêmes fonctionnalités

### Partie 3 — Comparaison

3. Le composant parent `OptionsVsComposition.vue` affiche les deux côte à côte avec un titre

## Contraintes TypeScript

- `interface User { id: number; name: string; active: boolean }`
- Options API : utiliser `defineComponent` avec types
- Composition API : types explicites partout

## Fichiers

→ `src/exercises/ex07/OptionsVsComposition.vue`
→ `src/exercises/ex07/components/UserListOptions.vue`
→ `src/exercises/ex07/components/UserListComposition.vue`
→ `src/exercises/ex07/types.ts`
