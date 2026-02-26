# Exercice 13b — Tableau réutilisable avancé

**Module** : 02-Intermédiaire · **Difficulté** : ⭐⭐⭐⭐
**Cours** : `cours/02-intermediaire/05` (Slots avancés), `cours/00-typescript/03` (Generics)
**Renforce** : exercice 13 (tableau-générique) — angle slots + composition

## Objectif

Construire un **composant DataTable** production-ready avec slots avancés, colonnes configurables et fonctionnalités d'édition inline. L'ex13 couvre le typage générique ; ici on pousse les **patterns de composition avec slots et provide/inject**.

## Consignes

1. Composant `DataTable<T>` qui accepte `rows: T[]` et `columns: ColumnDef<T>[]`
2. Type `ColumnDef<T>` : `{ key: keyof T; label: string; sortable?: boolean; width?: string; render?: (value: T[keyof T], row: T) => string }`
3. Slot `#header(column)` pour personnaliser chaque en-tête
4. Slot `#cell(column, row)` pour personnaliser chaque cellule
5. Slot `#empty` quand aucune donnée
6. Slot `#row-actions(row)` pour les boutons d'action par ligne
7. Édition inline : double-clic sur une cellule → input, Entrée → sauvegarde, Échap → annule
8. Événements : `@sort`, `@edit`, `@row-click`

## Contraintes TypeScript

- `DataTable` est un composant générique avec `generic="T extends Record<string, unknown>"`
- `ColumnDef<T>` exporte ses types
- Slots typés avec `defineSlots`
- Zéro `any`

## Bonus

- Sélection de lignes avec checkbox (multi-select)
- Export CSV des données affichées
- Responsive : passage en mode carte sur mobile

## Fichiers

→ `src/exercises/ex13b/DataTable.vue`
→ `src/exercises/ex13b/types.ts`
→ `src/exercises/ex13b/DataTableDemo.vue`
