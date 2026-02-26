<script setup lang="ts">
import { ref, computed, shallowRef } from "vue";
import type { ListItem } from "../types";
// TODO: Importer useVirtualScroll, useRenderTracker

// TODO: shallowRef pour les données
// TODO: Debounce sur l'input
// TODO: useVirtualScroll
// TODO: useRenderTracker

const items = shallowRef<ListItem[]>([]);
const search = ref("");
</script>

<template>
  <div class="optimized-list">
    <h3>Version optimisée</h3>
    <!-- TODO: Input avec debounce -->
    <!-- TODO: Container avec virtual scroll -->
    <!-- TODO: Afficher renderCount et lastRenderTime -->
    <p>TODO: Liste optimisée</p>
  </div>
</template>
