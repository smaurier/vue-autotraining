# Exercice 18 — Performance & Profiling

**Module** : 04-Expert · **Difficulté** : ⭐⭐⭐⭐⭐
**Cours** : `cours/04-expert/01` (performance et profiling)

## Objectif

Identifier et corriger des problèmes de performance courants dans une app Vue 3.

## Consignes

### Composant « volontairement lent »

1. `HeavyList.vue` :
   - Liste de 10 000 éléments
   - Chaque élément a un calcul coûteux dans le rendu (simulation)
   - Input de filtre qui re-rend toute la liste à chaque frappe

### Optimisations à appliquer

2. `OptimizedList.vue` — même fonctionnalité mais optimisée :
   - `v-memo` pour mémoriser les lignes inchangées
   - `shallowRef` pour les données qui ne changent pas en profondeur
   - `computed` avec cache plutôt que méthode dans le template
   - Debounce sur l'input de recherche
   - Virtual scrolling (afficher seulement les éléments visibles)
   - `defineAsyncComponent` pour le lazy loading d'un composant lourd

3. Composant parent `PerformanceAudit.vue` :
   - Toggle entre version lente et optimisée
   - Afficher le temps de rendu (via `onRenderTracked` / `onRenderTriggered`)
   - Compteur de re-renders

## Contraintes TypeScript

- Composable `useRenderTracker()` : retourne `{ renderCount, lastRenderTime }`
- Composable `useVirtualScroll(items, itemHeight, containerHeight)`
- Types stricts

## Fichiers

→ `src/exercises/ex18/PerformanceAudit.vue`
→ `src/exercises/ex18/components/HeavyList.vue`
→ `src/exercises/ex18/components/OptimizedList.vue`
→ `src/exercises/ex18/composables/useRenderTracker.ts`
→ `src/exercises/ex18/composables/useVirtualScroll.ts`
→ `src/exercises/ex18/types.ts`
