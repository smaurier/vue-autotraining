# Lab 32 — Storybook design system

> **Outcome :** à la fin, tu sais documenter un design system avec autodocs, exposer les design tokens, auditer l'accessibilité avec addon-a11y, et lancer un premier snapshot Chromatic.
> **Vrai outil :** Storybook 8 + `@storybook/vue3-vite` + `@storybook/addon-a11y` + Chromatic CLI.
> **Feedback :** le coach valide en session — panneau Accessibility visible dans Storybook, snapshot Chromatic créé sur chromatic.com.

---

## Énoncé

Tu reprends le projet Storybook TribuZen commencé au module 31. Le Storybook existe et `AppButton.stories.ts` a au moins une story. Ta mission : le transformer en catalogue documenté.

**Cahier des charges :**

1. **Autodocs** — `AppButton` doit avoir une page "Docs" auto-générée avec tableau de props, descriptions JSDoc, et Controls interactifs.
2. **Story AllVariants** — une story figée qui montre toutes les variantes de `AppButton` en une seule vue (utilisée par Chromatic).
3. **Design tokens** — une story `DesignTokens` affiche les jetons de couleurs en lisant les variables CSS au runtime.
4. **addon-a11y** — installé et visible dans le panneau Storybook ; chaque story `AppButton` obtient un score axe.
5. **Chromatic** — un premier snapshot baseline créé (compte gratuit chromatic.com).

**Starter :**

Le projet Storybook doit être en place (lab 31 complété ou starter ci-dessous). Si tu pars de zéro :

```bash
pnpm create vite tribuzen-storybook --template vue-ts
cd tribuzen-storybook
pnpm install
pnpm dlx storybook@latest init
pnpm add -D @storybook/addon-a11y
```

Assure-toi d'avoir un `AppButton.vue` minimal dans `src/components/ui/` :

```vue
<!-- src/components/ui/AppButton.vue -->
<script setup lang="ts">
/**
 * Bouton principal du design system TribuZen.
 * Supporte 4 variantes visuelles et 3 tailles.
 */
withDefaults(defineProps<{
  /** Variante visuelle */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  /** Taille du bouton */
  size?: 'sm' | 'md' | 'lg'
  /** Désactive le bouton */
  disabled?: boolean
  /** Affiche un spinner */
  loading?: boolean
}>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
})
</script>

<template>
  <button
    :class="['btn', `btn--${variant}`, `btn--${size}`]"
    :disabled="disabled || loading"
  >
    <span v-if="loading" class="btn__spinner">⏳</span>
    <slot />
  </button>
</template>

<style scoped>
.btn { padding: 0.5rem 1rem; border-radius: var(--radius-md, 8px); border: none; cursor: pointer; font-weight: 600; }
.btn--primary { background: var(--color-primary, #3b82f6); color: #fff; }
.btn--secondary { background: var(--color-secondary, #64748b); color: #fff; }
.btn--danger { background: var(--color-danger, #ef4444); color: #fff; }
.btn--ghost { background: transparent; border: 1px solid currentColor; }
.btn--sm { font-size: 0.75rem; padding: 0.25rem 0.5rem; }
.btn--lg { font-size: 1.125rem; padding: 0.75rem 1.5rem; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
```

Et un `tokens.css` de base :

```css
/* src/styles/tokens.css */
:root {
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-secondary: #64748b;
  --color-danger: #ef4444;
  --color-success: #22c55e;
  --color-text: #1f2937;
  --color-bg: #ffffff;
  --color-border: #e5e7eb;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
}
```

---

## Étapes (en friction)

### Étape 1 — Activer autodocs et injecter les tokens

Modifie `.storybook/preview.ts` pour :
- Ajouter le tag `autodocs` globalement.
- Importer `tokens.css`.
- Configurer a11y globalement.

**Fais-le toi-même. La configuration complète est dans le corrigé.**

### Étape 2 — Réécrire AppButton.stories.ts avec autodocs complet

Depuis `src/components/ui/AppButton.stories.ts` :

1. Ajoute `tags: ['autodocs']` dans le meta.
2. Ajoute `argTypes` pour `variant`, `size`, `loading`, `disabled` avec contrôles et descriptions.
3. Ajoute une story `Default` avec render function et args.
4. Ajoute une story `AllVariants` qui affiche toutes les variantes en une vue (sans Controls).

Vérifie dans Storybook (`pnpm storybook`) : l'onglet "Docs" doit exister et le tableau de props doit apparaître.

### Étape 3 — Créer la story de design tokens

Crée `src/stories/DesignTokens.vue` et `src/stories/DesignTokens.stories.ts`.

Le composant doit lire les valeurs des tokens via `getComputedStyle(document.documentElement).getPropertyValue(tokenName)` et les afficher avec leur swatch couleur.

### Étape 4 — Vérifier addon-a11y

Lance `pnpm storybook`, clique sur la story `Default` de `AppButton`. L'onglet "Accessibility" doit apparaître dans le panneau du bas. Si des violations sont signalées, corrige-les (ex: bouton sans texte visible → ajouter du texte dans le slot).

### Étape 5 — Premier snapshot Chromatic

```bash
# Installe Chromatic
pnpm add -D chromatic

# Crée un compte sur chromatic.com, crée un projet, récupère le token
npx chromatic --project-token=<ton-token>
```

Vérifie sur chromatic.com que la baseline est créée avec au moins 2 snapshots (Default + AllVariants).

---

## Corrigé complet commenté

### `.storybook/preview.ts`

```typescript
import type { Preview } from '@storybook/vue3-vite'
import '../src/styles/tokens.css'   // Tokens CSS disponibles dans toutes les stories

const preview: Preview = {
  // Tag global : génère un onglet Docs pour TOUTES les stories
  tags: ['autodocs'],
  parameters: {
    // Table des matières dans les pages Docs
    docs: { toc: true },
    // Configuration a11y globale : axe analyse le body par défaut
    a11y: { element: 'body' },
  },
}

export default preview
```

### `src/components/ui/AppButton.stories.ts`

```typescript
import type { Meta, StoryObj } from '@storybook/vue3'
import AppButton from './AppButton.vue'

const meta = {
  title: 'Atoms/AppButton',
  component: AppButton,
  // Tag autodocs ici redondant avec preview.ts — mais utile si on désactive le global un jour
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ghost'],
      description: 'Variante visuelle du bouton',
      table: {
        defaultValue: { summary: 'primary' },
        type: { summary: "'primary' | 'secondary' | 'danger' | 'ghost'" },
      },
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
      description: 'Taille : sm (32px), md (40px), lg (48px)',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    loading: {
      control: 'boolean',
      description: 'Affiche un spinner et désactive le clic pendant le chargement',
    },
    disabled: {
      control: 'boolean',
      description: 'Désactive toute interaction',
    },
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          // S'assurer que le contraste est toujours vérifié
          { id: 'color-contrast', enabled: true },
          // S'assurer que le bouton a toujours un label accessible
          { id: 'button-name', enabled: true },
        ],
      },
    },
  },
} satisfies Meta<typeof AppButton>

export default meta
type Story = StoryObj<typeof meta>

// Story principale : Controls interactifs, axe actif
export const Default: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
  },
  render: (args) => ({
    components: { AppButton },
    setup() { return { args } },
    // Le texte "Rejoindre la famille" est le label accessible — axe button-name passe
    template: '<AppButton v-bind="args">Rejoindre la famille</AppButton>',
  }),
}

// Story figée pour Chromatic : toutes les variantes en une capture
// delay: 300 pour laisser les transitions CSS se stabiliser
export const AllVariants: Story = {
  name: 'All Variants (Chromatic)',
  parameters: {
    controls: { disable: true },   // Pas de panneau Controls sur cette story figée
    chromatic: { delay: 300 },
  },
  render: () => ({
    components: { AppButton },
    template: `
      <div style="display: flex; gap: 1rem; flex-wrap: wrap; padding: 1rem;">
        <AppButton variant="primary">Primary</AppButton>
        <AppButton variant="secondary">Secondary</AppButton>
        <AppButton variant="danger">Danger</AppButton>
        <AppButton variant="ghost">Ghost</AppButton>
        <AppButton variant="primary" size="sm">Small</AppButton>
        <AppButton variant="primary" size="lg">Large</AppButton>
        <AppButton variant="primary" :loading="true">Loading</AppButton>
        <AppButton variant="primary" :disabled="true">Disabled</AppButton>
      </div>
    `,
  }),
}
```

### `src/stories/DesignTokens.vue`

```vue
<script setup lang="ts">
defineProps<{ category: 'colors' | 'spacing' }>()

// Lecture des valeurs CSS au runtime depuis :root
function getTokenValue(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
}

const colorTokens = [
  '--color-primary',
  '--color-primary-hover',
  '--color-secondary',
  '--color-danger',
  '--color-success',
  '--color-text',
  '--color-bg',
  '--color-border',
]

const spacingTokens = [
  '--space-xs',
  '--space-sm',
  '--space-md',
  '--space-lg',
  '--space-xl',
]
</script>

<template>
  <!-- Grille couleurs : swatch + nom du token + valeur hex -->
  <div v-if="category === 'colors'" class="tokens-grid">
    <div
      v-for="token in colorTokens"
      :key="token"
      class="token-item"
    >
      <span
        class="token-swatch"
        :style="{ background: `var(${token})`, border: '1px solid #e5e7eb' }"
      />
      <code class="token-name">{{ token }}</code>
      <!-- getTokenValue lit la valeur réelle après injection de tokens.css -->
      <span class="token-value">{{ getTokenValue(token) }}</span>
    </div>
  </div>

  <!-- Barres d'espacement : largeur proportionnelle + valeur px -->
  <div v-if="category === 'spacing'" class="tokens-list">
    <div
      v-for="token in spacingTokens"
      :key="token"
      class="spacing-item"
    >
      <span
        class="spacing-bar"
        :style="{ width: `var(${token})`, background: 'var(--color-primary)', height: '16px', display: 'inline-block' }"
      />
      <code>{{ token }}</code>
      <span class="token-value">{{ getTokenValue(token) }}</span>
    </div>
  </div>
</template>

<style scoped>
.tokens-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.token-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.token-swatch {
  width: 2rem;
  height: 2rem;
  border-radius: 4px;
  flex-shrink: 0;
}

.token-name {
  font-size: 0.8rem;
  color: #374151;
}

.token-value {
  font-size: 0.75rem;
  color: #6b7280;
}

.tokens-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
}

.spacing-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}
</style>
```

### `src/stories/DesignTokens.stories.ts`

```typescript
import type { Meta, StoryObj } from '@storybook/vue3'
import DesignTokensDoc from './DesignTokens.vue'

const meta = {
  title: 'Design System/Tokens',
  component: DesignTokensDoc,
  tags: ['autodocs'],
  argTypes: {
    category: {
      control: 'radio',
      options: ['colors', 'spacing'],
      description: 'Catégorie de tokens à afficher',
    },
  },
  parameters: {
    layout: 'padded',
    // Pas de test a11y sur la page de tokens elle-même (pas un composant UI)
    a11y: { disable: true },
    // Un seul snapshot Chromatic sur Colors suffit
    chromatic: { delay: 100 },
  },
} satisfies Meta<typeof DesignTokensDoc>

export default meta
type Story = StoryObj<typeof meta>

export const Colors: Story = {
  args: { category: 'colors' },
}

export const Spacing: Story = {
  args: { category: 'spacing' },
  parameters: {
    chromatic: { disableSnapshot: true },  // Éviter un double snapshot spacing
  },
}
```

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — en 30 minutes, de mémoire :**

1. Reproduis la configuration `preview.ts` (autodocs global + tokens.css + a11y).
2. Crée les stories `AppInput.stories.ts` depuis zéro pour un composant `AppInput` que tu auras écrit (props : `label`, `error`, `placeholder`, `type`, `modelValue`). Inclure : autodocs, story `WithError`, story `AllStates` pour Chromatic.
3. Ajoute une troisième story dans `DesignTokens.stories.ts` — catégorie `typography` — qui affiche les tokens `--font-sans`, `--text-sm`, `--text-base`, `--text-lg` avec un exemple de rendu textuel.
4. **Sans ouvrir ce corrigé.**

**Critère de réussite :** Storybook démarre sans erreur, les onglets "Docs" sont visibles, le panneau "Accessibility" affiche des scores sur les stories AppInput.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, ce lab crée la fondation UI partagée :

```
tribuzen/
  packages/
    ui/
      src/
        components/
          AppButton.vue
          AppButton.stories.ts    ← ce lab
        stories/
          DesignTokens.vue        ← ce lab
          DesignTokens.stories.ts ← ce lab
        styles/
          tokens.css
        index.ts
      .storybook/
        main.ts
        preview.ts                ← ce lab : autodocs + tokens + a11y
      package.json
```

**Différences par rapport au lab :**
- Les tokens seront plus nombreux (radius, ombres, z-index).
- `AppInput` et `AppBadge` auront leurs stories (itération suivante).
- Le workflow Chromatic sera déclenché sur chaque PR, pas seulement en push main.
- Le Storybook publié sera partagé avec l'équipe design via l'URL Chromatic par branche.

**Commit cible :**
```
feat(ui): Storybook design system — autodocs AppButton + tokens + addon-a11y + Chromatic baseline
```
