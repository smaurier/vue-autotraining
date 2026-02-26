<script setup lang="ts">
// TODO: Utiliser Transition name="slide" pour glissement depuis la droite
defineProps<{ isOpen: boolean }>();
defineEmits<{ close: [] }>();
</script>

<template>
  <!-- TODO: Transition slide sur le panel latéral -->
  <div v-if="false" class="slide-panel">
    <p>TODO: Panel avec transition slide</p>
  </div>
</template>
