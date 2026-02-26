# Exercice 12 — Carte profil avec slots

**Module** : 02-Intermédiaire · **Difficulté** : ⭐⭐⭐
**Cours** : `cours/02-intermediaire/05` (slots, composants avancés)

## Objectif

Maîtriser les slots (default, nommés, scoped) pour créer des composants hautement réutilisables.

## Consignes

### BaseCard

1. Composant `BaseCard.vue` avec :
   - Slot `header` (nommé)
   - Slot `default` (contenu principal)
   - Slot `footer` (nommé, optionnel)
   - Slot `actions` (scoped slot, expose `{ isExpanded, toggle }`)

### Profils

2. `ProfileCards.vue` utilise `BaseCard` de 3 façons différentes :
   - **Profil simple** : header = nom, default = bio, footer = bouton contact
   - **Profil détaillé** : header = avatar + nom, actions scoped slot pour expand/collapse les détails
   - **Profil éditable** : scoped slot `actions` avec boutons Éditer/Sauvegarder, formulaire dans default

### DataTable slot

3. `DataTable.vue` générique :
   - Props : `columns: Column[]`, `rows: T[]`
   - Scoped slot par colonne : `#cell-{columnKey}="{ row, value }"`
   - Slot `empty` quand pas de données

## Contraintes TypeScript

- `defineSlots<{…}>()` pour typer les slots
- Scoped slots typés
- Generics sur `DataTable` : `<T extends Record<string, unknown>>`

## Fichiers

→ `src/exercises/ex12/ProfileCards.vue`
→ `src/exercises/ex12/components/BaseCard.vue`
→ `src/exercises/ex12/components/DataTable.vue`
→ `src/exercises/ex12/types.ts`
