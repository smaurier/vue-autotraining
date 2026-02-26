<script setup lang="ts">
// TODO: Utiliser Transition name="fade" pour apparition/disparition
defineProps<{ isOpen: boolean }>();
defineEmits<{ close: [] }>();
</script>

<template>
  <!-- TODO: Transition fade sur la modale -->
  <div v-if="false" class="fade-modal">
    <p>TODO: Modale avec transition fade</p>
  </div>
</template>
