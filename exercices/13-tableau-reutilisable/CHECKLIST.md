# Checklist — Tableau réutilisable avancé

- [ ] `DataTable<T>` générique fonctionnel
- [ ] `ColumnDef<T>` typé avec `keyof T`
- [ ] Slot `#header(column)` personnalisable
- [ ] Slot `#cell(column, row)` personnalisable
- [ ] Slot `#empty` affiché si aucune donnée
- [ ] Slot `#row-actions(row)` fonctionnel
- [ ] Édition inline (double-clic → input → Entrée/Échap)
- [ ] Événements `@sort`, `@edit`, `@row-click` émis
- [ ] `defineSlots` utilisé pour typer les slots
- [ ] Zéro `any`, types exportés
- [ ] Bonus : sélection multi-lignes
- [ ] Bonus : export CSV
