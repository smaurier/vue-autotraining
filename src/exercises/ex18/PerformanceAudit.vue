<script setup lang="ts">
import { ref } from "vue";
// TODO: Importer HeavyList et OptimizedList

const showOptimized = ref(false);
</script>

<template>
  <div class="performance-audit">
    <h2>Exercice 18 — Performance & Profiling</h2>
    <div>
      <button @click="showOptimized = !showOptimized">
        {{ showOptimized ? "Version lente" : "Version optimisée" }}
      </button>
    </div>
    <!-- TODO: Afficher HeavyList ou OptimizedList selon toggle -->
    <p>Ouvre le fichier et complète les TODO !</p>
  </div>
</template>
