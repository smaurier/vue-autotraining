<script setup lang="ts">
import type { GalleryImage } from "../types";

defineProps<{ images: GalleryImage[] }>();
// TODO: TransitionGroup pour entrée/sortie/réorganisation des cartes
</script>

<template>
  <div class="image-grid">
    <!-- TODO: TransitionGroup avec move class -->
    <p>TODO: Grille d'images animée</p>
  </div>
</template>
