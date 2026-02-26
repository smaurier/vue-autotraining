<script setup lang="ts">
import type { Pipeline } from "../types";

defineProps<{ pipeline: Pipeline }>();
defineEmits<{ "select-job": [jobId: number] }>();
</script>

<template>
  <div class="pipeline-view">
    <!-- TODO: Afficher les stages en colonnes -->
    <!-- TODO: Jobs en lignes sous chaque stage -->
    <!-- TODO: Couleurs par statut -->
    <!-- TODO: Animation pulse sur "running" -->
    <p>TODO: Vue pipeline</p>
  </div>
</template>
