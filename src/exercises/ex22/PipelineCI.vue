<script setup lang="ts">
import { ref } from "vue";
import type { Pipeline, PipelineJob } from "./types";
// TODO: Importer les composants et usePipelineRunner

// TODO: ref pipeline avec données initiales
// TODO: ref selectedJob
// TODO: usePipelineRunner

const selectedJob = ref<PipelineJob | null>(null);
</script>

<template>
  <div class="pipeline-ci">
    <h2>Exercice 22 — Pipeline CI visuel</h2>
    <!-- TODO: PipelineView -->
    <!-- TODO: PipelineConfigurator -->
    <!-- TODO: JobDetail -->
    <!-- TODO: Bouton Lancer / Reset -->
    <!-- TODO: Logs d'exécution -->
    <p>Ouvre le fichier et complète les TODO !</p>
  </div>
</template>
