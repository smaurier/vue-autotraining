# Correction – Exercice 13 : Tableau générique

## Concepts clés
- **Generics TypeScript** : `<T>` permet de réutiliser le composant avec n'importe quel type de données
- **Scoped slots** : le composant expose des données dans le slot, le parent contrôle le rendu
- `defineProps` avec un generic permet de typer les colonnes et données ensemble
- `keyof T` : restreint les clés de colonnes aux champs qui existent réellement sur T

---

## Le composant générique — `GenericTable.vue`

```vue
<script setup lang="ts" generic="T extends Record<string, unknown>">
/**
 * Le mot-clé `generic="T extends ..."` (Vue 3.3+) permet de définir un
 * paramètre de type directement dans le SFC.
 * T représente le type d'une ligne du tableau (ex: Product, LogEntry...).
 */
import { ref, computed } from 'vue'

// ─── TYPES ───────────────────────────────────────────────────────

export interface Column<T> {
  key: keyof T           // doit être une clé existante du type T
  label: string          // texte de l'en-tête
  sortable?: boolean     // la colonne est-elle triable ?
  render?: (value: T[keyof T], row: T) => string  // transformation d'affichage
}

// ─── PROPS ───────────────────────────────────────────────────────

const props = defineProps<{
  data: T[]
  columns: Column<T>[]
  // Nombre de lignes par page (0 = pas de pagination)
  pageSize?: number
}>()

// ─── SLOTS ───────────────────────────────────────────────────────
// defineSlots() documente les slots scoped disponibles.
// Ici on expose un slot "cell" qui reçoit la colonne, la valeur et la ligne.
defineSlots<{
  // Slot optionnel pour personnaliser le rendu d'une cellule
  cell?: (props: { column: Column<T>; value: T[keyof T]; row: T }) => unknown
  // Slot optionnel pour une ligne vide
  empty?: () => unknown
}>()

// ─── TRI ─────────────────────────────────────────────────────────

const sortKey = ref<keyof T | null>(null)
const sortOrder = ref<'asc' | 'desc'>('asc')

function handleSort(column: Column<T>) {
  if (!column.sortable) return
  if (sortKey.value === column.key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = column.key
    sortOrder.value = 'asc'
  }
}

function getSortIcon(column: Column<T>): string {
  if (!column.sortable) return ''
  if (sortKey.value !== column.key) return ' ⇅'
  return sortOrder.value === 'asc' ? ' ↑' : ' ↓'
}

// ─── DONNÉES TRAITÉES ────────────────────────────────────────────

const sortedData = computed<T[]>(() => {
  if (!sortKey.value) return props.data

  return [...props.data].sort((a, b) => {
    const valA = a[sortKey.value!]
    const valB = b[sortKey.value!]
    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
})

// ─── PAGINATION ──────────────────────────────────────────────────

const currentPage = ref(1)

const totalPages = computed(() => {
  if (!props.pageSize) return 1
  return Math.max(1, Math.ceil(sortedData.value.length / props.pageSize))
})

const paginatedData = computed<T[]>(() => {
  if (!props.pageSize) return sortedData.value
  const start = (currentPage.value - 1) * props.pageSize
  return sortedData.value.slice(start, start + props.pageSize)
})

// ─── HELPER D'AFFICHAGE ───────────────────────────────────────────

/**
 * Retourne la valeur à afficher pour une cellule.
 * Si la colonne a un render(), on l'applique.
 * Sinon on convertit la valeur en chaîne.
 */
function getCellValue(column: Column<T>, row: T): string {
  const raw = row[column.key]
  if (column.render) return column.render(raw, row)
  if (raw === null || raw === undefined) return '—'
  return String(raw)
}
</script>

<template>
  <div class="generic-table-wrapper">

    <!-- ── Tableau ──────────────────────────────────────────── -->
    <table class="generic-table">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="String(column.key)"
            :class="{ sortable: column.sortable }"
            @click="handleSort(column)"
          >
            {{ column.label }}{{ getSortIcon(column) }}
          </th>
        </tr>
      </thead>

      <tbody>
        <!-- Ligne "aucune donnée" -->
        <tr v-if="paginatedData.length === 0">
          <td :colspan="columns.length" class="empty-cell">
            <!--
              Slot "empty" personnalisable — si non fourni, affiche le message par défaut.
            -->
            <slot name="empty">
              <span>Aucune donnée à afficher.</span>
            </slot>
          </td>
        </tr>

        <tr v-for="(row, rowIndex) in paginatedData" :key="rowIndex">
          <td v-for="column in columns" :key="String(column.key)">
            <!--
              Slot "cell" scoped : le parent peut surcharger le rendu d'une cellule.
              On expose : la colonne, la valeur brute et la ligne complète.

              Si le parent ne fournit PAS de slot "cell", on utilise getCellValue().
              Syntaxe : v-if/$slots.cell vérifie si le slot a été fourni.
            -->
            <slot
              name="cell"
              :column="column"
              :value="row[column.key]"
              :row="row"
            >
              <!-- Rendu par défaut : texte simple -->
              {{ getCellValue(column, row) }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- ── Pagination ───────────────────────────────────────── -->
    <div v-if="pageSize && totalPages > 1" class="pagination">
      <button @click="currentPage--" :disabled="currentPage === 1">‹</button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button @click="currentPage++" :disabled="currentPage === totalPages">›</button>
    </div>

  </div>
</template>

<style scoped>
.generic-table-wrapper { overflow-x: auto; }
.generic-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.generic-table th, .generic-table td {
  padding: 0.7rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}
.generic-table th { background: #f9fafb; font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
.generic-table tbody tr:hover { background: #f9fafb; }
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { background: #f1f5f9; }
.empty-cell { text-align: center; color: #9ca3af; padding: 2rem; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; padding: 1rem; }
.pagination button { padding: 0.3rem 0.8rem; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; }
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
```

---

## Utilisation 1 — Tableau Produits

```vue
<!-- ProductsTable.vue -->
<script setup lang="ts">
import GenericTable from './GenericTable.vue'
import type { Column } from './GenericTable.vue'

interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
}

const products: Product[] = [
  { id: 1, name: 'Clavier mécanique',  category: 'Périphériques', price: 129.99, stock: 42 },
  { id: 2, name: 'Écran 4K 27"',       category: 'Écrans',        price: 599.00, stock: 8  },
  { id: 3, name: 'Souris ergonomique', category: 'Périphériques', price: 79.99,  stock: 0  },
  { id: 4, name: 'Casque audio',        category: 'Audio',         price: 199.00, stock: 15 },
]

// Type-safe : la clé doit être `keyof Product`
const columns: Column<Product>[] = [
  { key: 'id',       label: 'ID',        sortable: true },
  { key: 'name',     label: 'Produit',   sortable: true },
  { key: 'category', label: 'Catégorie', sortable: true },
  {
    key: 'price',
    label: 'Prix',
    sortable: true,
    // render() formate le nombre en euros — le tableau reste générique
    render: (val) => Number(val).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
  },
  { key: 'stock', label: 'Stock', sortable: true },
]
</script>

<template>
  <!--
    On utilise le slot scoped "cell" pour personnaliser
    l'affichage des colonnes "price" et "stock".
    La destructuration { column, value, row } donne accès aux données exposées.
  -->
  <GenericTable :data="products" :columns="columns" :page-size="3">
    <template #cell="{ column, value, row }">

      <!-- Colonne stock : badge coloré selon la valeur -->
      <template v-if="column.key === 'stock'">
        <span
          class="stock-badge"
          :class="{
            'stock-badge--out':  Number(value) === 0,
            'stock-badge--low':  Number(value) > 0 && Number(value) < 10,
            'stock-badge--ok':   Number(value) >= 10,
          }"
        >
          {{ Number(value) === 0 ? 'Rupture' : `${value} unités` }}
        </span>
      </template>

      <!-- Toutes les autres colonnes : rendu standard -->
      <template v-else>
        <!-- On applique render() si défini, sinon la valeur brute -->
        {{ column.render ? column.render(value, row) : value }}
      </template>

    </template>
  </GenericTable>
</template>

<style scoped>
.stock-badge { padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
.stock-badge--out { background: #fee2e2; color: #dc2626; }
.stock-badge--low { background: #fef3c7; color: #d97706; }
.stock-badge--ok  { background: #d1fae5; color: #065f46; }
</style>
```

---

## Utilisation 2 — Tableau Logs

```vue
<!-- LogsTable.vue -->
<script setup lang="ts">
import GenericTable from './GenericTable.vue'
import type { Column } from './GenericTable.vue'

interface LogEntry {
  timestamp: string
  level: 'INFO' | 'WARN' | 'ERROR'
  service: string
  message: string
}

const logs: LogEntry[] = [
  { timestamp: '2026-02-26T10:00:00Z', level: 'INFO',  service: 'auth',    message: 'Connexion réussie' },
  { timestamp: '2026-02-26T10:01:15Z', level: 'WARN',  service: 'api',     message: 'Réponse lente (800ms)' },
  { timestamp: '2026-02-26T10:02:30Z', level: 'ERROR', service: 'payment', message: 'Paiement refusé' },
  { timestamp: '2026-02-26T10:03:00Z', level: 'INFO',  service: 'cache',   message: 'Cache vidé' },
]

const columns: Column<LogEntry>[] = [
  {
    key: 'timestamp',
    label: 'Horodatage',
    sortable: true,
    render: (val) => new Date(String(val)).toLocaleString('fr-FR'),
  },
  { key: 'level',   label: 'Niveau',  sortable: true },
  { key: 'service', label: 'Service', sortable: true },
  { key: 'message', label: 'Message' },
]

// Map de couleurs par niveau de log
const levelColors: Record<string, string> = {
  INFO:  '#d1fae5',
  WARN:  '#fef3c7',
  ERROR: '#fee2e2',
}
const levelTextColors: Record<string, string> = {
  INFO:  '#065f46',
  WARN:  '#92400e',
  ERROR: '#991b1b',
}
</script>

<template>
  <GenericTable :data="logs" :columns="columns">
    <template #cell="{ column, value, row }">

      <!-- Le niveau de log est coloré selon sa sévérité -->
      <template v-if="column.key === 'level'">
        <span
          class="level-badge"
          :style="{
            background: levelColors[String(value)],
            color: levelTextColors[String(value)],
          }"
        >
          {{ value }}
        </span>
      </template>

      <template v-else>
        {{ column.render ? column.render(value, row) : value }}
      </template>

    </template>

    <!-- Slot "empty" personnalisé -->
    <template #empty>
      <span>✅ Aucune entrée de log — tout fonctionne correctement !</span>
    </template>
  </GenericTable>
</template>

<style scoped>
.level-badge {
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}
</style>
```

---

## Résumé de la mécanique des scoped slots

```
GenericTable expose dans le slot "cell" :
  - column  → la définition de la colonne (clé, label, render...)
  - value   → la valeur brute de la cellule
  - row     → toute la ligne (utile pour croiser plusieurs champs)

Le parent les reçoit via :
  <template #cell="{ column, value, row }">
    ... rendu personnalisé ici ...
  </template>
```

**Pourquoi scoped slots ?**
Le composant générique connaît les données mais **pas** comment les présenter visuellement.
Le parent connaît la présentation mais **pas** la structure interne du tableau.
Les scoped slots permettent ces deux responsabilités de coexister proprement.
