<script setup lang="ts">
import { ref, computed } from "vue";
import type { ListItem } from "../types";

// TODO: Générer 10000 éléments
const items = ref<ListItem[]>([]);
const search = ref("");

// VOLONTAIREMENT LENT: pas de debounce, recalcul à chaque frappe
const filteredItems = computed(() =>
  items.value.filter((item) =>
    item.name.toLowerCase().includes(search.value.toLowerCase()),
  ),
);

// VOLONTAIREMENT LENT: calcul coûteux simulé dans le template
function expensiveCalculation(value: number): string {
  let result = 0;
  for (let i = 0; i < 1000; i++) {
    result += Math.sqrt(value * i);
  }
  return result.toFixed(2);
}
</script>

<template>
  <div class="heavy-list">
    <h3>Version lente (non optimisée)</h3>
    <input v-model="search" placeholder="Rechercher..." />
    <div style="height: 400px; overflow-y: auto">
      <!-- VOLONTAIREMENT LENT: rend tout -->
      <div v-for="item in filteredItems" :key="item.id" class="list-item">
        {{ item.name }} — {{ expensiveCalculation(item.value) }}
      </div>
    </div>
  </div>
</template>
