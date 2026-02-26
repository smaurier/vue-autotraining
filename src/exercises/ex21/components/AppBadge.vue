<script setup lang="ts">
defineProps<{
  color?: "info" | "success" | "warning" | "error";
}>();
</script>

<template>
  <span class="app-badge" :class="color ?? 'info'">
    <slot />
  </span>
</template>
