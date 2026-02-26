<script setup lang="ts">
// TODO: defineProps pour type, label, error, placeholder
defineProps<{
  type?: "text" | "email" | "password";
  label?: string;
  error?: string;
  placeholder?: string;
}>();

// TODO: defineModel pour v-model
const model = defineModel<string>();
</script>

<template>
  <div class="app-input">
    <!-- TODO: Label -->
    <!-- TODO: Input avec v-model -->
    <!-- TODO: Message d'erreur -->
    <label v-if="label">{{ label }}</label>
    <input :type="type ?? 'text'" v-model="model" :placeholder="placeholder" />
    <span v-if="error" class="error">{{ error }}</span>
  </div>
</template>
