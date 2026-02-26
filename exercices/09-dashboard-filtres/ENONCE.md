# Exercice 09b — Dashboard avec filtres composables

**Module** : 02-Intermédiaire · **Difficulté** : ⭐⭐⭐
**Cours** : `cours/02-intermediaire/01` (Composition API avancée), `cours/02-intermediaire/02` (Composables)
**Renforce** : exercice 09 (dashboard-composables) — angle filtrage / tri

## Objectif

Créer un dashboard de données avec des **composables spécialisés dans le filtrage, le tri et la pagination**. Contrairement à l'ex09 qui se concentre sur la réutilisation générale, ici on pousse la logique de **composition de composables** entre eux.

## Consignes

1. Composable `useFilter<T>(items: Ref<T[]>, predicate: Ref<(item: T) => boolean>): ComputedRef<T[]>`
2. Composable `useSort<T>(items: Ref<T[]>, key: keyof T, direction: Ref<'asc' | 'desc'>): ComputedRef<T[]>`
3. Composable `usePagination<T>(items: Ref<T[]>, pageSize: Ref<number>)` qui retourne `{ page, totalPages, paginatedItems, next, prev, goTo }`
4. Composable `useDashboardPipeline<T>` qui **compose** les trois précédents : `filter → sort → paginate`
5. Données : liste de 50 produits (nom, prix, catégorie, stock, date)
6. UI : barre de filtres (catégorie, stock min), tri cliquable sur les colonnes, pagination en bas

## Contraintes TypeScript

- Tous les composables sont **génériques** (`<T>`)
- Chaque composable a ses types de retour explicites
- Zéro `any`

## Bonus

- Composable `useFilterPresets` pour sauvegarder/restaurer des configurations de filtres
- Debounce sur le filtre texte avec `useDebouncedRef`

## Fichiers

→ `src/exercises/ex09b/DashboardFiltres.vue`
→ `src/exercises/ex09b/composables/useFilter.ts`
→ `src/exercises/ex09b/composables/useSort.ts`
→ `src/exercises/ex09b/composables/usePagination.ts`
→ `src/exercises/ex09b/composables/useDashboardPipeline.ts`
