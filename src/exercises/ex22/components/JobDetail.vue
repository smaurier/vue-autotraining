<script setup lang="ts">
import type { PipelineJob } from "../types";

defineProps<{ job: PipelineJob | null }>();
</script>

<template>
  <div class="job-detail" v-if="job">
    <!-- TODO: Nom, statut, durée, script -->
    <p>TODO: Détail du job</p>
  </div>
</template>
