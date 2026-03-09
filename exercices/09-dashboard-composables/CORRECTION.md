# Correction – Exercice 09 : Dashboard avec composables

## Concepts clés
- **Composable** : fonction `useXxx()` qui encapsule de la logique réactive réutilisable
- **Chaînage** : on passe le résultat d'un composable en entrée du suivant
- `computed()` : recalcule automatiquement quand ses dépendances changent
- `watchEffect` / `watch` : réagit aux changements de valeurs réactives

---

## Architecture des composables

```
employees (données brutes)
    │
    ▼
useSearch(employees, ['name','department'])
    │  → filteredItems (computed)
    │  → searchQuery  (ref, bindée au champ de saisie)
    ▼
useSort(filteredItems)
    │  → sortedItems  (computed)
    │  → sortField    (ref)
    │  → sortOrder    (ref)
    ▼
usePagination(sortedItems, 5)
    │  → paginatedItems (computed, la page courante)
    │  → currentPage    (ref)
    │  → totalPages     (computed)
    ▼
Affichage dans le template
```

---

## Fichier 1 — `useSearch.ts`

```typescript
import { ref, computed } from 'vue'
import type { Ref } from 'vue'

/**
 * Filtre une liste d'objets selon une requête de recherche.
 * @param items  - liste réactive (Ref ou ComputedRef)
 * @param fields - les champs de l'objet dans lesquels chercher
 */
export function useSearch<T extends Record<string, unknown>>(
  items: Ref<T[]>,
  fields: (keyof T)[]
) {
  // ref() crée une valeur réactive mutable — on la lie au v-model de l'input
  const searchQuery = ref('')

  const filteredItems = computed(() => {
    // Si la recherche est vide, on retourne tout sans filtrer
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return items.value

    return items.value.filter((item) =>
      // Pour chaque champ demandé, on vérifie si la valeur contient la requête
      fields.some((field) => {
        const val = item[field]
        // On convertit en chaîne pour gérer les nombres, dates, etc.
        return String(val).toLowerCase().includes(query)
      })
    )
  })

  return { searchQuery, filteredItems }
}
```

---

## Fichier 2 — `useSort.ts`

```typescript
import { ref, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'

// Type union pour l'ordre de tri
type SortOrder = 'asc' | 'desc'

/**
 * Trie une liste réactive par un champ, dans un ordre donné.
 * @param items - peut être une Ref ou une ComputedRef (les deux sont valides)
 */
export function useSort<T extends Record<string, unknown>>(
  items: Ref<T[]> | ComputedRef<T[]>
) {
  const sortField = ref<keyof T | null>(null)
  const sortOrder = ref<SortOrder>('asc')

  /**
   * Appelé quand on clique sur un en-tête de colonne.
   * - Premier clic → tri ASC
   * - Deuxième clic sur la même colonne → tri DESC
   * - Clic sur une autre colonne → nouveau tri ASC
   */
  function toggleSort(field: keyof T) {
    if (sortField.value === field) {
      // Même colonne : on inverse l'ordre
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      // Nouvelle colonne : on repart en ASC
      sortField.value = field
      sortOrder.value = 'asc'
    }
  }

  const sortedItems = computed(() => {
    if (!sortField.value) return items.value

    // [...items.value] crée une copie — on NE modifie pas le tableau original
    return [...items.value].sort((a, b) => {
      const valA = a[sortField.value!]
      const valB = b[sortField.value!]

      // Comparaison universelle : fonctionne pour strings et numbers
      if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1
      return 0 // égaux
    })
  })

  return { sortField, sortOrder, sortedItems, toggleSort }
}
```

---

## Fichier 3 — `usePagination.ts`

```typescript
import { ref, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'

/**
 * Pagine une liste réactive.
 * @param items   - liste triée/filtrée en entrée
 * @param perPage - nombre d'éléments par page (défaut : 5)
 */
export function usePagination<T>(
  items: Ref<T[]> | ComputedRef<T[]>,
  perPage = 5
) {
  const currentPage = ref(1)

  // Recalcule le nombre total de pages dès que items change
  const totalPages = computed(() =>
    Math.max(1, Math.ceil(items.value.length / perPage))
  )

  // IMPORTANT : quand le filtre change, les items diminuent →
  // on remet à la page 1 pour éviter d'être sur une page vide
  watch(
    () => items.value.length,
    () => { currentPage.value = 1 }
  )

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * perPage
    const end = start + perPage
    // slice() retourne les éléments de l'index start (inclus) à end (exclus)
    return items.value.slice(start, end)
  })

  function goToPage(page: number) {
    // On s'assure de rester dans les bornes [1, totalPages]
    currentPage.value = Math.min(Math.max(1, page), totalPages.value)
  }

  return { currentPage, totalPages, paginatedItems, goToPage }
}
```

---

## Fichier 4 — `useLocalStorage.ts`

```typescript
import { ref, watch } from 'vue'

/**
 * Crée une ref synchronisée avec localStorage.
 * La valeur est persistée entre les rechargements de page.
 * @param key          - clé dans localStorage
 * @param defaultValue - valeur utilisée si rien n'est stocké
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  // On essaie de lire la valeur stockée au démarrage
  const storedValue = localStorage.getItem(key)

  // JSON.parse() convertit la chaîne stockée en objet JavaScript
  // Si rien n'est stocké, on utilise la valeur par défaut
  const value = ref<T>(
    storedValue !== null ? (JSON.parse(storedValue) as T) : defaultValue
  )

  // watch() surveille la ref et écrit dans localStorage à chaque changement
  watch(
    value,
    (newVal) => {
      // JSON.stringify() convertit l'objet en chaîne pour le stockage
      localStorage.setItem(key, JSON.stringify(newVal))
    },
    { deep: true } // deep: true surveille aussi les changements dans les objets/tableaux
  )

  return value
}
```

---

## Fichier 5 — `DashboardFilters.vue` (assemblage du chaînage)

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useSearch } from './composables/useSearch'
import { useSort } from './composables/useSort'
import { usePagination } from './composables/usePagination'
import { useLocalStorage } from './composables/useLocalStorage'
import type { Employee } from './types'

// Données d'entrée passées en props
const props = defineProps<{
  employees: Employee[]
}>()

// On convertit les props en Ref pour les passer aux composables
// (les composables attendent des Ref, pas des valeurs brutes)
const employeesRef = ref(props.employees)

// ① RECHERCHE : filtre sur nom et département
const { searchQuery, filteredItems } = useSearch(employeesRef, ['name', 'department'])

// ② TRI : reçoit filteredItems (ComputedRef) et retourne sortedItems (ComputedRef)
// Chaque composable ne connaît pas les autres — il fait juste son travail
const { sortField, sortOrder, sortedItems, toggleSort } = useSort(filteredItems)

// ③ PAGINATION : reçoit sortedItems et retourne la page courante
const { currentPage, totalPages, paginatedItems, goToPage } = usePagination(sortedItems, 5)

// ④ PERSISTANCE : sauvegarde les préférences de l'utilisateur
const savedPerPage = useLocalStorage('dashboard-per-page', 5)

// Indicateur visuel pour les colonnes triées
function getSortIcon(field: keyof Employee): string {
  if (sortField.value !== field) return '⇅'
  return sortOrder.value === 'asc' ? '↑' : '↓'
}

// Formatage de la date pour l'affichage
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR')
}

// Formatage du salaire avec séparateur de milliers
function formatSalary(salary: number): string {
  return salary.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}
</script>

<template>
  <div class="dashboard">
    <!-- Barre de recherche — v-model lie searchQuery à l'input -->
    <div class="toolbar">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Rechercher par nom ou département..."
        class="search-input"
      />
      <span class="result-count">
        {{ filteredItems.length }} résultat(s) sur {{ employees.length }}
      </span>
    </div>

    <!-- Tableau avec en-têtes cliquables pour le tri -->
    <table class="data-table">
      <thead>
        <tr>
          <!-- @click sur chaque colonne → appelle toggleSort avec le nom du champ -->
          <th @click="toggleSort('name')" class="sortable">
            Nom {{ getSortIcon('name') }}
          </th>
          <th @click="toggleSort('department')" class="sortable">
            Département {{ getSortIcon('department') }}
          </th>
          <th @click="toggleSort('salary')" class="sortable">
            Salaire {{ getSortIcon('salary') }}
          </th>
          <th @click="toggleSort('joinDate')" class="sortable">
            Date d'entrée {{ getSortIcon('joinDate') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <!--
          On boucle sur paginatedItems — uniquement les éléments de la page courante.
          :key doit être unique pour que Vue optimise les mises à jour du DOM.
        -->
        <tr v-for="employee in paginatedItems" :key="employee.id">
          <td>{{ employee.name }}</td>
          <td>{{ employee.department }}</td>
          <td>{{ formatSalary(employee.salary) }}</td>
          <td>{{ formatDate(employee.joinDate) }}</td>
        </tr>

        <!-- Ligne vide si aucun résultat -->
        <tr v-if="paginatedItems.length === 0">
          <td colspan="4" class="empty-state">Aucun employé trouvé</td>
        </tr>
      </tbody>
    </table>

    <!-- Contrôles de pagination -->
    <div class="pagination">
      <button @click="goToPage(1)" :disabled="currentPage === 1">«</button>
      <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">‹</button>

      <span>Page {{ currentPage }} / {{ totalPages }}</span>

      <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">›</button>
      <button @click="goToPage(totalPages)" :disabled="currentPage === totalPages">»</button>
    </div>
  </div>
</template>

<style scoped>
.dashboard { padding: 1rem; }

.toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-input {
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  width: 300px;
  font-size: 0.9rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.sortable {
  cursor: pointer;
  user-select: none;
}
.sortable:hover { background-color: #f5f5f5; }

.pagination {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  justify-content: center;
}

.pagination button {
  padding: 0.25rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}
.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
```

---

## Pourquoi ce chaînage fonctionne ?

`computed()` est **paresseux** et **réactif** :
1. `filteredItems` recalcule quand `searchQuery` change
2. `sortedItems` recalcule quand `filteredItems` change (car il dépend de lui)
3. `paginatedItems` recalcule quand `sortedItems` change

Modifier la recherche déclenche automatiquement une cascade de recalculs, sans aucun appel manuel.
