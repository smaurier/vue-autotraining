# Exercice 09 — Dashboard avec composables

**Module** : 02-Intermédiaire · **Difficulté** : ⭐⭐⭐
**Cours** : `cours/02-intermediaire/02` (composables)

## Objectif

Extraire de la logique réutilisable dans des composables et les combiner dans un dashboard.

## Consignes

### Composables à créer

1. `useLocalStorage<T>(key, defaultValue): Ref<T>` — synchronise une ref avec localStorage
2. `useSearch<T>(items, searchFields): { query, filtered }` — recherche full-text
3. `usePagination<T>(items, perPage): { page, paged, total, totalPages, next, prev }` — pagination
4. `useSort<T>(items, defaultKey): { sortKey, sortOrder, sorted }` — tri par colonne

### Dashboard

5. Composant `DashboardFilters.vue` :
   - Données : tableau de 30+ entrées `Employee` (générées dans `data.ts`)
   - Barre de recherche → `useSearch`
   - Pagination → `usePagination`
   - Tri par colonne (nom, département, salaire) → `useSort`
   - Le filtre de recherche est persisté → `useLocalStorage`

## Contraintes TypeScript

- Chaque composable est une fonction générique typée
- `interface Employee { id: number; name: string; department: string; salary: number; startDate: string }`
- Retour de chaque composable typé explicitement

## Fichiers

→ `src/exercises/ex09/DashboardFilters.vue`
→ `src/exercises/ex09/composables/useLocalStorage.ts`
→ `src/exercises/ex09/composables/useSearch.ts`
→ `src/exercises/ex09/composables/usePagination.ts`
→ `src/exercises/ex09/composables/useSort.ts`
→ `src/exercises/ex09/data.ts`
→ `src/exercises/ex09/types.ts`
