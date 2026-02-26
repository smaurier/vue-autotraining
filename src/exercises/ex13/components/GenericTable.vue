<script setup lang="ts" generic="T extends Record<string, unknown>">
import { ref, computed } from "vue";
import type { ColumnDef } from "../types";

// TODO: defineProps<{ data: T[]; columns: ColumnDef<T>[]; searchable?: boolean; paginated?: boolean; pageSize?: number }>()
// TODO: ref searchQuery, currentPage
// TODO: computed filtered (search), sorted (colonnes), paginated
// TODO: function toggleSort(key)
</script>

<template>
  <div class="generic-table">
    <!-- TODO: Barre de recherche (si searchable) -->
    <!-- TODO: Table avec headers cliquables (tri) -->
    <!-- TODO: Scoped slots pour cellules -->
    <!-- TODO: Slot empty -->
    <!-- TODO: Pagination (si paginated) -->
    <p>TODO: GenericTable</p>
  </div>
</template>
