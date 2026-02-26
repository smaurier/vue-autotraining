<script setup lang="ts">
import { ref } from "vue";

// TODO: defineSlots pour typer les slots (header, default, footer, actions)
const isExpanded = ref(false);
const toggle = (): void => {
  isExpanded.value = !isExpanded.value;
};
</script>

<template>
  <div class="base-card">
    <!-- TODO: Slot header -->
    <!-- TODO: Slot default -->
    <!-- TODO: Slot actions (scoped: isExpanded, toggle) -->
    <!-- TODO: Slot footer -->
    <p>TODO: BaseCard avec slots</p>
  </div>
</template>
