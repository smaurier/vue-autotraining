# Exercice 01 — TypeScript Labo

**Module** : 00-TypeScript · **Difficulté** : ⭐⭐
**Cours** : `cours/00-typescript/01` à `04`

## Objectif

Pratiquer tous les fondamentaux TypeScript orientés Vue 3 en un seul exercice : types, interfaces, generics, utility types, typage des API Vue.

## Consignes

### Partie 1 — Types et interfaces

1. Définir `UserProfile` : `id`, `name`, `email`, `role: 'admin' | 'editor' | 'viewer'`, `preferences: { theme: 'light' | 'dark'; lang: string }`, `createdAt: Date`
2. Définir `ApiResponse<T>` (discriminated union) : `{ status: 'success'; data: T } | { status: 'error'; message: string }`
3. Afficher un utilisateur dans le template en utilisant ces types

### Partie 2 — Generics et utility types

4. Fonction `pickFields<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>`
5. Type `FormFields<T>` qui transforme chaque champ en `string` (mapped type)
6. Démontrer `Omit`, `Partial`, `Required`, `Record` dans des cas concrets

### Partie 3 — Typage Vue 3

7. `ref<number>`, `computed<string>`, `watch` avec callback typé
8. Sous-composant `UserCard.vue` avec `defineProps<{…}>()` et `defineEmits<{…}>()`
9. Tout le résultat visible dans le template avec rendu conditionnel

## Contraintes

- Zero `any` — utiliser `unknown` + type guards si besoin
- Toutes les fonctions ont un type de retour

## Fichiers

→ `src/exercises/ex01/TypeScriptLabo.vue`
→ `src/exercises/ex01/types.ts`
