# Exercice 27 — CRUD avec TanStack Query

**Module** : 12-Vue Query · **Difficulté** : ⭐⭐⭐⭐
**Cours** : `cours/12-vue-query/01` et `02`

## Objectif

Construire une application CRUD complète de gestion de produits utilisant **TanStack Query** pour tout le data fetching : queries, mutations, cache, optimistic updates et pagination.

## Consignes

### Partie 1 — Queries

1. Composable `useProductsQuery(filters)` avec query key réactive incluant les filtres
2. Composable `useProductQuery(id)` pour le détail d'un produit
3. Pagination avec `keepPreviousData` — navigation fluide entre les pages
4. Simuler un backend avec `setTimeout` et données en mémoire (pas de vrai serveur)

### Partie 2 — Mutations

5. `useCreateProductMutation()` avec invalidation du cache après succès
6. `useUpdateProductMutation()` avec **optimistic update** (UI mise à jour avant réponse serveur)
7. `useDeleteProductMutation()` avec confirmation et rollback en cas d'erreur
8. Toasts de feedback : succès / erreur sur chaque mutation

### Partie 3 — UX avancée

9. Prefetch au survol : quand l'utilisateur hover un produit dans la liste, précharger le détail
10. Indicateur de background refetch (petit spinner discret quand les données se rafraîchissent)
11. Recherche avec debounce — le query key réagit au texte de recherche après 300ms

## Contraintes TypeScript

- Interfaces `Product`, `PaginatedResponse<T>`, `CreateProductInput`
- Tous les composables typés (retour explicite)
- Query keys en `as const`
- Zéro `any`

## Bonus

- Infinite scroll au lieu de la pagination classique (`useInfiniteQuery`)
- Devtools TanStack Query intégrés
- Mode offline : les mutations en attente sont rejouées à la reconnexion

## Fichiers

→ `src/exercises/ex27/ProductsApp.vue`
→ `src/exercises/ex27/composables/useProductsQuery.ts`
→ `src/exercises/ex27/composables/useProductQuery.ts`
→ `src/exercises/ex27/composables/useProductMutations.ts`
→ `src/exercises/ex27/components/ProductList.vue`
→ `src/exercises/ex27/components/ProductForm.vue`
→ `src/exercises/ex27/components/ProductDetail.vue`
→ `src/exercises/ex27/api/fakeBackend.ts`
→ `src/exercises/ex27/types.ts`
