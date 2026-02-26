# Exercice 06 — Chronomètre

**Module** : 01-Débutant · **Difficulté** : ⭐⭐
**Cours** : `cours/01-debutant/06` (cycle de vie, watchers)

## Objectif

Pratiquer `onMounted`, `onUnmounted`, `watch`, `watchEffect` et la gestion des timers.

## Consignes

1. Chronomètre avec affichage `MM:SS:ms`
2. Boutons : Démarrer / Pause / Reset
3. Utiliser `setInterval` dans `onMounted` conditionnel ou dans un `watch`
4. Nettoyer le timer dans `onUnmounted` (pas de fuite mémoire)
5. `watchEffect` qui log la valeur en console à chaque changement
6. `watch` avec `{ immediate: true }` qui change la couleur :
   - Vert < 30s
   - Orange 30-60s
   - Rouge > 60s
7. Liste de « Tours » (lap) : bouton Tour qui enregistre le temps courant

## Contraintes TypeScript

- Types pour `Lap: { id: number; time: number }`
- Toutes les refs typées

## Bonus

- Compte à rebours configurable (en plus du chrono)
- `onBeforeUnmount` pour confirmer si le chrono tourne

## Fichiers

→ `src/exercises/ex06/StopWatch.vue`
→ `src/exercises/ex06/types.ts`
