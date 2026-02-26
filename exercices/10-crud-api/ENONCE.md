# Exercice 10 — CRUD API simulée

**Module** : 02-Intermédiaire · **Difficulté** : ⭐⭐⭐
**Cours** : `cours/02-intermediaire/03` (gestion async, API)

## Objectif

Gérer des appels asynchrones (fetch simulé), les états loading/error/success, et implémenter un CRUD complet.

## Consignes

### Service API

1. Créer `api.ts` avec fonctions simulées (délai 500-1500ms via `setTimeout` + `Promise`) :
   - `fetchUsers(): Promise<User[]>`
   - `createUser(data): Promise<User>`
   - `updateUser(id, data): Promise<User>`
   - `deleteUser(id): Promise<void>`
   - Simuler une erreur aléatoire 1 fois sur 5

### Composable

2. `useFetchState<T>()` : gère `data`, `loading`, `error`, `execute()`

### Composant CRUD

3. `CrudApi.vue` :
   - Afficher la liste au chargement (`onMounted`)
   - Spinner pendant `loading`
   - Message d'erreur + bouton « Réessayer » si `error`
   - Modal d'ajout / édition (formulaire)
   - Bouton supprimer avec confirmation
   - Toast de succès après chaque opération

## Contraintes TypeScript

- `interface User { id: number; name: string; email: string; role: 'admin' | 'user' }`
- `interface FetchState<T> { data: Ref<T | null>; loading: Ref<boolean>; error: Ref<string | null> }`

## Fichiers

→ `src/exercises/ex10/CrudApi.vue`
→ `src/exercises/ex10/composables/useFetchState.ts`
→ `src/exercises/ex10/api.ts`
→ `src/exercises/ex10/types.ts`
