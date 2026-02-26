# Exercice 03 — Liste de tâches

**Module** : 01-Débutant · **Difficulté** : ⭐⭐
**Cours** : `cours/01-debutant/02` (directives), `cours/01-debutant/03` (réactivité), `cours/01-debutant/04` (événements)

## Objectif

Créer une todo list complète : pratiquer `v-for`, `v-if`, `v-model`, les événements et les computed.

## Consignes

1. Interface `Todo` : `id: number`, `text: string`, `done: boolean`
2. Input + bouton pour ajouter (empêcher si vide)
3. Liste avec `v-for` et `:key`
4. Checkbox pour toggle `done` (style barré via `:class`)
5. Bouton supprimer par tâche
6. `computed` : nombre de tâches restantes
7. Filtres : Toutes / Actives / Terminées

## Contraintes TypeScript

- Interface `Todo` dans `types.ts`
- `Ref<Todo[]>`
- Fonctions typées

## Bonus

- Persistance `localStorage` (avec `watch`)
- Bouton « Supprimer terminées »

## Fichiers

→ `src/exercises/ex03/TodoList.vue`
→ `src/exercises/ex03/types.ts`
