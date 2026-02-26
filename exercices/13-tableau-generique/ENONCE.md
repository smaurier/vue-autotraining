# Exercice 13 — Tableau réutilisable générique

**Module** : 02-Intermédiaire · **Difficulté** : ⭐⭐⭐
**Cours** : `cours/02-intermediaire/05` (composants avancés, generics)

## Objectif

Créer un composant tableau entièrement générique et réutilisable, avec tri, filtrage et pagination intégrés.

## Consignes

### Composant `GenericTable<T>`

1. Props typées avec generics :
   - `data: T[]`
   - `columns: ColumnDef<T>[]` (key, label, sortable, formatter)
   - `searchable: boolean`
   - `paginated: boolean` + `pageSize: number`

2. Fonctionnalités :
   - Headers cliquables pour trier (icône ▲▼)
   - Barre de recherche globale
   - Pagination en bas
   - Slot `#cell-{key}` pour personnaliser le rendu d'une cellule
   - Slot `#empty` quand pas de résultat

### Démonstration

3. `ReusableTable.vue` utilise `GenericTable` avec 2 jeux de données différents :
   - Liste de `Product` (id, name, price, stock)
   - Liste de `LogEntry` (timestamp, level, message)
   - Chaque usage personnalise certaines cellules via scoped slots

## Contraintes TypeScript

- `ColumnDef<T>` avec `key: keyof T`
- Le composant est générique (`generic="T"` ou via defineComponent)
- Formatter : `(value: T[keyof T], row: T) => string`

## Fichiers

→ `src/exercises/ex13/ReusableTable.vue`
→ `src/exercises/ex13/components/GenericTable.vue`
→ `src/exercises/ex13/types.ts`
→ `src/exercises/ex13/data.ts`
