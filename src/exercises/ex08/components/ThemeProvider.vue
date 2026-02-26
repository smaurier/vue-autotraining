<script setup lang="ts">
import { ref, computed, provide } from "vue";
import { THEME_KEY } from "../types";
import type { ThemeColors } from "../types";

// TODO: ref theme ('light' | 'dark')
// TODO: computed colors basé sur theme
// TODO: function toggleTheme
// TODO: provide(THEME_KEY, { theme, colors, toggleTheme })
</script>

<template>
  <div class="theme-provider">
    <!-- TODO: Slot default, appliquer les couleurs comme CSS vars -->
    <slot />
  </div>
</template>
