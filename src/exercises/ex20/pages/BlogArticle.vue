<script setup lang="ts">
import type { Article } from "../types";
// TODO: Importer useAsyncData et useHead

defineProps<{ slug: string }>();

// TODO: Charger l'article par slug via useAsyncData
// TODO: useHead dynamique avec le titre de l'article
</script>

<template>
  <div class="blog-article">
    <!-- TODO: Titre, auteur, date, contenu de l'article -->
    <p>TODO: Détail de l'article</p>
  </div>
</template>
