<script setup lang="ts" generic="T extends Record<string, unknown>">
import type { Column } from "../types";

// TODO: defineProps<{ columns: Column[]; rows: T[] }>()
// TODO: defineSlots pour les scoped slots par colonne et le slot empty
</script>

<template>
  <div class="data-table">
    <!-- TODO: Table avec headers -->
    <!-- TODO: Scoped slot #cell-{key} pour chaque cellule -->
    <!-- TODO: Slot #empty quand pas de rows -->
    <p>TODO: DataTable générique</p>
  </div>
</template>
