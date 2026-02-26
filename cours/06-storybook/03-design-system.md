# 03 — Design System

## Qu'est-ce qu'un design system ?

Un ensemble de **composants UI réutilisables** + **règles de design** partages entre projets et équipes.

## Design tokens

Variables centralisees pour les couleurs, espacements, typographies :

```css
/* tokens.css */
:root {
  /* Couleurs */
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-secondary: #64748b;
  --color-danger: #ef4444;
  --color-success: #22c55e;
  --color-text: #1f2937;
  --color-text-muted: #6b7280;
  --color-bg: #ffffff;
  --color-bg-muted: #f8fafc;
  --color-border: #e5e7eb;

  /* Espacements */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;

  /* Typographie */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;

  /* Rayons */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Ombres */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

## Composants de base

### AppButton

```vue
<script setup lang="ts">
interface Props {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  size: "md",
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<template>
  <button
    :class="['btn', `btn--${props.variant}`, `btn--${props.size}`]"
    :disabled="props.disabled || props.loading"
    @click="emit('click', $event)"
  >
    <span v-if="props.loading" class="btn__spinner"></span>
    <slot />
  </button>
</template>
```

### AppInput

```vue
<script setup lang="ts">
interface Props {
  label?: string;
  error?: string;
  placeholder?: string;
  type?: "text" | "email" | "password" | "number";
}

const props = withDefaults(defineProps<Props>(), {
  type: "text",
});

const model = defineModel<string>({ default: "" });
</script>

<template>
  <div class="form-field">
    <label v-if="props.label" class="form-field__label">{{
      props.label
    }}</label>
    <input
      v-model="model"
      :type="props.type"
      :placeholder="props.placeholder"
      :class="[
        'form-field__input',
        { 'form-field__input--error': props.error },
      ]"
    />
    <span v-if="props.error" class="form-field__error">{{ props.error }}</span>
  </div>
</template>
```

## Publier en package (monorepo)

```
packages/
  ui/
    src/
      components/
        AppButton.vue
        AppInput.vue
      tokens.css
      index.ts         ← barrel export
    package.json
```

```ts
// packages/ui/src/index.ts
export { default as AppButton } from "./components/AppButton.vue";
export { default as AppInput } from "./components/AppInput.vue";
```

```json
// packages/ui/package.json
{
  "name": "@monrepo/ui",
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./tokens.css": "./src/tokens.css"
  }
}
```

## Exercice

→ `exercices/15-storybook-ui/ENONCE.md`

## Suite

→ `cours/07-cicd/01-pipeline-ci.md`
