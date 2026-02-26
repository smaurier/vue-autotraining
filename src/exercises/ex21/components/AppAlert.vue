<script setup lang="ts">
defineProps<{
  type?: "info" | "success" | "warning" | "error";
  dismissible?: boolean;
}>();

const emit = defineEmits<{ dismiss: [] }>();
</script>

<template>
  <div class="app-alert" :class="type ?? 'info'" role="alert">
    <slot />
    <button v-if="dismissible" @click="emit('dismiss')" aria-label="Fermer">
      &times;
    </button>
  </div>
</template>
