<script setup lang="ts">
// TODO: defineProps pour variant, size, disabled, loading
defineProps<{
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
}>();
</script>

<template>
  <button class="app-button" :disabled="disabled || loading">
    <!-- TODO: Spinner si loading -->
    <!-- TODO: Slot default pour le label -->
    <slot />
  </button>
</template>
