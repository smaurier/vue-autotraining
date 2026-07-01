---
titre: Storybook — design system
cours: 02-vue
notions: [documenter un design system, docs autodocs et MDX, design tokens dans Storybook, tests de régression visuelle Chromatic, tests d'accessibilité addon a11y, organisation des composants, publication du design system]
outcomes:
  - sait documenter un design system avec autodocs et MDX
  - sait exposer les design tokens et variantes dans Storybook
  - sait mettre en place des tests visuels (Chromatic) et d'accessibilité (addon a11y)
  - sait organiser et publier un catalogue de composants
prerequis: [31-storybook-stories]
next: 33-cicd-pipeline
libs: [{ name: "@storybook/vue3-vite", version: "8" }, { name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — design system documenté (tokens, composants, contrôles a11y) comme la base UI partagée
last-reviewed: 2026-07
---

← Précédent : [31 — Storybook, écrire des stories](./31-storybook-stories.md)

# Storybook — design system

> **Outcomes — tu sauras FAIRE :** documenter un design system complet avec autodocs et MDX, exposer les design tokens dans Storybook, mettre en place les tests visuels Chromatic et les tests d'accessibilité addon-a11y, organiser et publier un catalogue de composants.
> **Difficulté :** :star::star::star:

---

## 1. Cas concret d'abord

TribuZen grossit. L'équipe compte maintenant 4 contributeurs. Le constat après deux semaines :

- Le bouton "Rejoindre" utilise `variant="primary"` sur la `FamilyPage`, `variant="default"` sur la `EventPage`, et `class="btn-blue"` (CSS inline) sur la `ProfilePage`.
- La couleur primaire `#3b82f6` est écrite en dur dans 11 fichiers.
- Un nouveau dev demande : « C'est quoi la différence entre `AppBadge` et `AppTag` ? » Personne ne sait répondre sans ouvrir les deux fichiers.

**Le problème n'est pas le code — c'est l'absence de contrat documenté.**

Ta mission : transformer le Storybook TribuZen en catalogue vivant. Quand le problème sera résolu :

1. Chaque composant aura une page de doc auto-générée (autodocs) qui liste toutes ses props/variantes.
2. Les design tokens CSS seront visibles et testables dans une story dédiée.
3. Chaque composant aura un score d'accessibilité axe-core affiché directement dans le panneau Storybook.
4. Un snapshot Chromatic détectera tout drift visuel avant le merge.

**Avant d'aller plus loin :** regarde le composant `AppButton.vue` de ton projet TribuZen. Combien de variantes a-t-il ? Est-ce documenté quelque part ? C'est l'état zéro que ce module résout.

---

## 2. Théorie complète, concise

### 2.1 Autodocs — génération automatique de documentation

Autodocs génère une page "Docs" pour chaque composant à partir de ses stories CSF et de ses types TypeScript. En Storybook 8, l'activation se fait par **tags**.

**Activation globale** — s'applique à tous les composants :

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/vue3-vite'

const preview: Preview = {
  tags: ['autodocs'],   // Ajoute l'onglet Docs à toutes les stories
  parameters: {
    docs: {
      toc: true,        // Table des matières dans la page Docs
    },
  },
}

export default preview
```

**Activation par composant** — dans le `meta` de la story :

```typescript
// AppButton.stories.ts
import type { Meta } from '@storybook/vue3'
import AppButton from './AppButton.vue'

const meta = {
  title: 'Atoms/AppButton',
  component: AppButton,
  tags: ['autodocs'],    // Docs uniquement pour ce composant
} satisfies Meta<typeof AppButton>

export default meta
```

**Ce qu'autodocs génère automatiquement :**
- Tableau de toutes les props avec leur type TS, valeur par défaut, description (depuis les commentaires JSDoc).
- Stories interactives avec panneau Controls.
- Description extraite du commentaire JSDoc du composant Vue.

**Enrichir les descriptions avec JSDoc :**

```typescript
// AppButton.vue — commentaires exploités par autodocs
/**
 * Bouton principal du design system TribuZen.
 * Supporte 4 variantes et 3 tailles.
 */
defineProps<{
  /** Variante visuelle du bouton */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  /** Taille : sm (32px), md (40px), lg (48px) */
  size?: 'sm' | 'md' | 'lg'
  /** Désactive l'interaction et grise le bouton */
  disabled?: boolean
  /** Affiche un spinner et désactive le clic */
  loading?: boolean
}>()
```

### 2.2 MDX — documentation narrative

MDX (Markdown + JSX/Vue) permet d'écrire une page de doc hybride : prose explicative + stories interactives intégrées. En Storybook 8, les composants MDX s'importent depuis `@storybook/blocks`.

**Structure d'un fichier MDX :**

```mdx
{/* AppButton.mdx */}
import { Meta, Canvas, Controls, ArgTypes } from '@storybook/blocks'
import * as AppButtonStories from './AppButton.stories'

<Meta of={AppButtonStories} />

# AppButton

Le bouton est l'atome le plus utilisé du design system TribuZen.
Utilise `variant="primary"` pour l'action principale, `variant="ghost"` pour les actions secondaires.

## Usage de base

<Canvas of={AppButtonStories.Default} />
<Controls of={AppButtonStories.Default} />

## Toutes les variantes

<Canvas of={AppButtonStories.AllVariants} />

## Table des props

<ArgTypes of={AppButtonStories} />
```

**Deux modes de documentation dans Storybook 8 :**

| Mode | Fichier | Quand l'utiliser |
|------|---------|-----------------|
| Autodocs | `.stories.ts` + tag `autodocs` | Documentation standard générée automatiquement |
| MDX | `.mdx` | Documentation narrative avec contexte, guides d'usage, décisions design |

> **Bonne pratique :** autodocs pour les atomes (props = contrat suffisant), MDX pour les organismes (contexte et guides d'usage indispensables).

**Configurer Storybook pour charger les `.mdx` :**

```typescript
// .storybook/main.ts
export default {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|ts)',
  ],
}
```

### 2.3 Design tokens dans Storybook

Les design tokens CSS ne sont pas "visibles" dans Storybook par défaut — il faut les exposer explicitement via une story dédiée ou un addon.

**Approche 1 — Story de tokens (sans addon supplémentaire) :**

```typescript
// src/stories/DesignTokens.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import DesignTokensDoc from './DesignTokens.vue'

const meta = {
  title: 'Design System/Tokens',
  component: DesignTokensDoc,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof DesignTokensDoc>

export default meta
type Story = StoryObj<typeof meta>

export const Colors: Story = { args: { category: 'colors' } }
export const Spacing: Story = { args: { category: 'spacing' } }
export const Typography: Story = { args: { category: 'typography' } }
```

```vue
<!-- src/stories/DesignTokens.vue — composant de visualisation des tokens -->
<script setup lang="ts">
defineProps<{ category: 'colors' | 'spacing' | 'typography' }>()

// Les tokens sont lus depuis les CSS custom properties au runtime
function getToken(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
}

const colorTokens = [
  '--color-primary', '--color-secondary', '--color-danger',
  '--color-success', '--color-text', '--color-bg',
]

const spacingTokens = [
  '--space-xs', '--space-sm', '--space-md', '--space-lg', '--space-xl',
]
</script>

<template>
  <div v-if="category === 'colors'" class="tokens-grid">
    <div v-for="token in colorTokens" :key="token" class="token-item">
      <span
        class="token-swatch"
        :style="{ background: `var(${token})` }"
      />
      <code>{{ token }}</code>
      <span class="token-value">{{ getToken(token) }}</span>
    </div>
  </div>

  <div v-if="category === 'spacing'" class="tokens-list">
    <div v-for="token in spacingTokens" :key="token" class="token-item">
      <span
        class="token-bar"
        :style="{ width: `var(${token})`, background: 'var(--color-primary)' }"
      />
      <code>{{ token }}</code>
      <span class="token-value">{{ getToken(token) }}</span>
    </div>
  </div>
</template>
```

**Approche 2 — Injecter les tokens dans le décorateur global :**

```typescript
// .storybook/preview.ts
import '../src/styles/tokens.css'   // Les tokens CSS sont chargés globalement
```

Les stories héritent automatiquement des variables CSS définies dans `tokens.css`. Tout composant qui utilise `var(--color-primary)` dans ses styles verra la vraie valeur dans Storybook.

### 2.4 Tests de régression visuelle Chromatic

Chromatic est le service officiel de tests visuels pour Storybook. Chaque story devient un snapshot visuel. À chaque push, Chromatic compare les snapshots et bloque le merge si un diff visuel est détecté.

**Installation et configuration :**

```bash
pnpm add -D chromatic
```

```bash
# Premier lancement — crée le projet sur chromatic.com et génère le token
npx chromatic --project-token=<your-project-token>
```

**Intégration CI (GitHub Actions) :**

```yaml
# .github/workflows/chromatic.yml
name: Chromatic

on: [push]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0    # Obligatoire : Chromatic a besoin du git history complet
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install
      - name: Run Chromatic
        uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          exitZeroOnChanges: true   # Ne bloque pas la CI si des changements visuels sont acceptés
```

**Workflow Chromatic :**
1. Premier push → baseline créée (référence).
2. Push suivant → diff calculé entre baseline et nouveau snapshot.
3. Si diff détecté → PR bloquée, review manuelle dans l'UI Chromatic.
4. Après validation → nouvelle baseline.

**Stocker le token en secret GitHub :**
- `Settings > Secrets and variables > Actions > New repository secret`
- Nom : `CHROMATIC_PROJECT_TOKEN`

### 2.5 Tests d'accessibilité — addon-a11y

`@storybook/addon-a11y` intègre **axe-core** directement dans le panneau Storybook. Pour chaque story rendue, axe-core lance une analyse WCAG et affiche les violations dans un panneau "Accessibility".

**Pourquoi c'est un atout pour le profil RGAA :**
Le RGAA (Référentiel Général d'Amélioration de l'Accessibilité) est le standard français d'accessibilité numérique, basé sur WCAG 2.1. axe-core couvre une large partie des critères automatisables (contraste, rôles ARIA, labels de formulaires, ordre de focus…). Avoir addon-a11y dans ton workflow = vérification WCAG/RGAA à chaque composant, sans sortir de Storybook. C'est un argument concret en entretien et en audit RGAA.

**Installation :**

```bash
npx storybook@latest add @storybook/addon-a11y
# Ajoute automatiquement l'addon dans .storybook/main.ts
```

**Configuration manuelle si nécessaire :**

```typescript
// .storybook/main.ts
export default {
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',     // Ajoute le panneau Accessibility
  ],
}
```

**Configurer les règles axe au niveau d'une story :**

```typescript
// AppButton.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import AppButton from './AppButton.vue'

const meta = {
  title: 'Atoms/AppButton',
  component: AppButton,
  tags: ['autodocs'],
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            // Désactiver une règle spécifique si faux positif documenté
            id: 'color-contrast',
            enabled: true,    // true = garder actif (défaut)
          },
        ],
      },
    },
  },
} satisfies Meta<typeof AppButton>
```

**Configurer globalement dans preview.ts :**

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/vue3-vite'

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    a11y: {
      // axe analyse le `body` par défaut — override si le composant
      // a besoin d'un contexte spécifique
      element: 'body',
    },
  },
}

export default preview
```

**Ce qu'axe vérifie automatiquement (exemples WCAG/RGAA) :**
- `button-name` — chaque bouton a un texte accessible (RGAA 11.9)
- `color-contrast` — ratio de contraste ≥ 4.5:1 pour le texte (RGAA 3.2)
- `label` — chaque input a un label associé (RGAA 11.1)
- `image-alt` — chaque image a un alt (RGAA 1.1)
- `landmark-one-main` — la page a une balise `<main>` (RGAA 9.2)

### 2.6 Organisation des composants

La structure de répertoire Storybook se reflète dans la sidebar. La propriété `title` dans le `meta` de chaque story définit la hiérarchie.

**Convention Atomic Design dans Storybook :**

```
src/
  components/
    ui/
      AppButton.vue
      AppButton.stories.ts       → title: 'Atoms/AppButton'
      AppInput.vue
      AppInput.stories.ts        → title: 'Atoms/AppInput'
      AppBadge.vue
      AppBadge.stories.ts        → title: 'Atoms/AppBadge'
    form/
      FormField.vue
      FormField.stories.ts       → title: 'Molecules/FormField'
      SearchBar.vue
      SearchBar.stories.ts       → title: 'Molecules/SearchBar'
    layout/
      AppHeader.vue
      AppHeader.stories.ts       → title: 'Organisms/AppHeader'
      FamilyCard.vue
      FamilyCard.stories.ts      → title: 'Organisms/FamilyCard'
  stories/
    DesignTokens.stories.ts      → title: 'Design System/Tokens'
    Typography.stories.ts        → title: 'Design System/Typography'
```

**Résultat dans la sidebar Storybook :**

```
Storybook
├── Design System
│   ├── Tokens
│   └── Typography
├── Atoms
│   ├── AppButton
│   ├── AppInput
│   └── AppBadge
├── Molecules
│   ├── FormField
│   └── SearchBar
└── Organisms
    ├── AppHeader
    └── FamilyCard
```

**Bonne pratique — index CSF barrel :**

```typescript
// src/stories/index.ts — importer dans .storybook/preview.ts pour
// s'assurer que toutes les stories sont chargées
export * from '../components/ui/AppButton.stories'
export * from '../components/ui/AppInput.stories'
// ...
```

### 2.7 Publication du design system

**Publier Storybook en statique :**

```bash
# Build statique (sortie dans storybook-static/)
pnpm dlx storybook build

# Prévisualiser le build en local
npx http-server storybook-static
```

**Publier sur Chromatic (hébergement inclus avec les tests visuels) :**

```bash
npx chromatic --project-token=<token> --build-script-name=build-storybook
```

Chromatic héberge le Storybook publié à une URL stable (ex: `https://www.chromatic.com/library?appId=xxx`). Chaque branche a sa propre URL — utile pour partager avec les designers.

**Publier comme package npm (monorepo) :**

```json
// packages/ui/package.json
{
  "name": "@tribuzen/ui",
  "version": "0.1.0",
  "exports": {
    ".": "./src/index.ts",
    "./tokens.css": "./src/styles/tokens.css"
  },
  "peerDependencies": {
    "vue": "^3.5.0"
  }
}
```

```typescript
// packages/ui/src/index.ts — barrel export
export { default as AppButton } from './components/AppButton.vue'
export { default as AppInput } from './components/AppInput.vue'
export { default as AppBadge } from './components/AppBadge.vue'
```

```typescript
// Dans une app consommatrice
import { AppButton } from '@tribuzen/ui'
import '@tribuzen/ui/tokens.css'
```

---

## 3. Worked examples

### Exemple 1 — AppButton documenté de A à Z (autodocs + a11y)

Story complète avec autodocs, contrôles, a11y configuré, et story "AllVariants" pour Chromatic.

```typescript
// src/components/ui/AppButton.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import AppButton from './AppButton.vue'

// Meta avec autodocs et a11y
const meta = {
  title: 'Atoms/AppButton',
  component: AppButton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ghost'],
      description: 'Variante visuelle',
      table: {
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
      description: 'Taille du bouton',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    loading: {
      control: 'boolean',
      description: 'Affiche un spinner, désactive le clic',
    },
    disabled: {
      control: 'boolean',
      description: 'Désactive le bouton',
    },
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          // Assure que le ratio de contraste est vérifié
          { id: 'color-contrast', enabled: true },
          // Vérifie que le bouton a un label accessible
          { id: 'button-name', enabled: true },
        ],
      },
    },
  },
} satisfies Meta<typeof AppButton>

export default meta
type Story = StoryObj<typeof meta>

// Story par défaut — Controls interactifs
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
    template: '<AppButton v-bind="args">Rejoindre la famille</AppButton>',
  }),
}

// Story "AllVariants" — snapshot Chromatic idéal : toutes les variantes en une vue
export const AllVariants: Story = {
  parameters: {
    // Désactiver les contrôles pour ce snapshot figé
    controls: { disable: true },
    // Indiquer à Chromatic de capturer cette story
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
        <AppButton variant="primary" loading>Loading</AppButton>
        <AppButton variant="primary" disabled>Disabled</AppButton>
      </div>
    `,
  }),
}

// Story d'accessibilité — cas problématique explicitement testé
export const WithoutLabel: Story = {
  name: 'A11y — bouton sans texte visible (doit échouer axe)',
  parameters: {
    chromatic: { disableSnapshot: true },  // Pas de snapshot sur les cas d'erreur
  },
  render: () => ({
    components: { AppButton },
    // Un bouton sans texte ni aria-label → axe signale button-name
    template: '<AppButton variant="primary" aria-label="Fermer" />',
  }),
}
```

### Exemple 2 — Page de tokens en MDX narrative

Une page MDX qui mêle explication du système de tokens et stories embarquées.

```mdx
{/* src/stories/DesignTokens.mdx */}
import { Meta, Canvas } from '@storybook/blocks'
import * as TokenStories from './DesignTokens.stories'

<Meta of={TokenStories} />

# Design Tokens TribuZen

Les design tokens sont les **valeurs de référence uniques** du design system.
Modifier un token change automatiquement tous les composants qui l'utilisent.

## Couleurs

Importer `tokens.css` dans votre app :

```css
import '@tribuzen/ui/tokens.css'
```

<Canvas of={TokenStories.Colors} />

## Espacements

L'échelle d'espacement suit une progression `4 → 8 → 16 → 24 → 32 px`.
Toujours utiliser un token, jamais une valeur en dur.

<Canvas of={TokenStories.Spacing} />

## Règle d'or

Ne jamais écrire `color: #3b82f6` dans un composant.
Toujours écrire `color: var(--color-primary)`.
```

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Confondre `autodocs` tag et `docs: { autodocs: 'tag' }` dans main.ts

Deux niveaux d'activation distincts :

```typescript
// ❌ Confusion fréquente : mettre autodocs dans main.ts ne suffit pas seul
// main.ts
export default {
  docs: { autodocs: 'tag' }   // Contrôle le COMPORTEMENT d'autodocs
}

// ✅ Le tag doit être ajouté dans preview.ts (global) OU dans le meta de la story
// preview.ts
export const tags = ['autodocs']  // Active la génération pour TOUTES les stories

// OU dans le meta de la story (activation au cas par cas)
const meta = { tags: ['autodocs'] }
```

`docs: { autodocs: 'tag' }` dans `main.ts` dit "active autodocs seulement quand le tag est présent". Sans le tag quelque part (preview.ts ou meta), aucune doc n'est générée.

### PIÈGE #2 — MDX importer depuis `@storybook/addon-docs` en Storybook 8

```typescript
// ❌ Import v6/v7 — encore vu dans beaucoup de tutos
import { Meta, Canvas } from '@storybook/addon-docs'

// ✅ Import correct Storybook 8
import { Meta, Canvas, Controls, ArgTypes } from '@storybook/blocks'
```

`@storybook/addon-docs` réexporte encore certains composants pour la rétrocompatibilité, mais l'import canonique en v8 est `@storybook/blocks`. Un import depuis `@storybook/addon-docs` peut produire des erreurs hydration ou des props manquantes dans certaines configurations.

### PIÈGE #3 — Oublier `fetch-depth: 0` dans le workflow Chromatic

```yaml
# ❌ Chromatic ne peut pas calculer les diffs sans l'historique git complet
- uses: actions/checkout@v4

# ✅ fetch-depth: 0 récupère tout l'historique
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
```

Sans cet option, Chromatic échoue silencieusement ou crée une nouvelle baseline à chaque run.

### PIÈGE #4 — addon-a11y ≠ audit RGAA complet

```
axe-core (addon-a11y) couvre ≈ 30-40% des critères RGAA automatisables.
Le reste requiert un audit manuel (navigation clavier, lecteur d'écran NVDA/VoiceOver).
```

Utiliser addon-a11y comme **filet de sécurité**, pas comme certificat d'accessibilité. Quand axe passe, des violations RGAA peuvent subsister (ex : ordre de lecture logique, compréhension des labels au lecteur d'écran). addon-a11y est un premier filtre puissant — les audits RGAA formels restent nécessaires.

### PIÈGE #5 — Story "AllVariants" sans délai Chromatic

```typescript
// ❌ Chromatic capture avant les animations CSS (transitions, fade-in)
export const AllVariants: Story = {
  parameters: { chromatic: {} }
}

// ✅ Ajouter un délai pour laisser le temps aux transitions
export const AllVariants: Story = {
  parameters: {
    chromatic: { delay: 300 }   // ms — adapter selon la durée des transitions CSS
  }
}
```

Les diffs de snapshot sur des composants en cours d'animation génèrent de faux positifs constants.

---

## 5. Ancrage TribuZen

Dans le repo `smaurier/tribuzen`, ce module s'ancre à trois endroits précis :

**`packages/ui/` — le package design system partagé**

```
tribuzen/
  packages/
    ui/
      src/
        components/
          AppButton.vue
          AppButton.stories.ts    ← autodocs + AllVariants Chromatic
          AppInput.vue
          AppInput.stories.ts
          AppBadge.vue
          AppBadge.stories.ts
        stories/
          DesignTokens.stories.ts  ← page tokens couleurs/spacing/typo
          DesignTokens.vue
          DesignTokens.mdx
        styles/
          tokens.css               ← variables CSS chargées dans preview.ts
        index.ts                   ← barrel export
      package.json                 ← @tribuzen/ui
      .storybook/
        main.ts
        preview.ts                 ← tags: ['autodocs'], import tokens.css, a11y global
```

**`FamilyCard` comme organisme cible :**
`FamilyCard.stories.ts` devient le premier organisme documenté en MDX : contexte d'usage (quand utiliser une `FamilyCard` vs une `FamilyRow`), story interactive avec Controls, et snapshot Chromatic de l'état "chargement" + l'état "données" + l'état "erreur".

**Valeur concrète pour TribuZen :**
- Designers → URL Chromatic stable par branche pour valider les maquettes.
- Devs → page autodocs = contrat de props sans ouvrir le fichier source.
- Accessibilité → score axe par composant visible avant tout merge.
- Futur intervenant → le Storybook est l'onboarding technique UI.

**Commit cible :**
```
feat(design-system): Storybook autodocs + tokens + addon-a11y + Chromatic CI
```

---

## 6. Points clés

1. **Autodocs** s'active par tag (`tags: ['autodocs']`) dans le `meta` ou globalement dans `preview.ts` — le tag dans `main.ts` contrôle le comportement, pas l'activation.
2. **MDX** importe les blocs depuis `@storybook/blocks` (v8), pas depuis `@storybook/addon-docs`.
3. **Design tokens** : injecter `tokens.css` dans `preview.ts` les rend disponibles dans toutes les stories ; une story dédiée les rend visibles et testables.
4. **Chromatic** a besoin de `fetch-depth: 0` dans GitHub Actions pour calculer les diffs git ; `exitZeroOnChanges: true` évite de bloquer la CI sur des changements visuels volontaires.
5. **addon-a11y** intègre axe-core — chaque story rendue est analysée automatiquement ; configurer les règles via `parameters.a11y.config.rules` au niveau du meta ou de la story.
6. **addon-a11y est un filtre, pas un audit RGAA complet** — il couvre ~30-40% des critères automatisables ; les tests de navigation clavier et lecteur d'écran restent nécessaires.
7. **Organisation** : la propriété `title` dans le `meta` CSF définit la hiérarchie sidebar (`'Atoms/AppButton'`, `'Molecules/FormField'`, `'Design System/Tokens'`).
8. **Publication** : `storybook build` produit un bundle statique ; Chromatic héberge ce bundle avec une URL par branche ; le barrel export `index.ts` + `package.json` publie les composants comme package npm.

---

## 7. Seeds Anki

```
Quelle est la différence entre le tag autodocs dans preview.ts et dans le meta d'une story ?|Dans preview.ts : active autodocs pour TOUTES les stories du projet. Dans le meta d'une story : active autodocs uniquement pour ce composant. Les deux écritures sont équivalentes — le tag dans main.ts (docs: { autodocs: 'tag' }) contrôle le comportement, pas l'activation.
Depuis quel module importe-t-on Meta, Canvas, Controls en MDX dans Storybook 8 ?|Depuis @storybook/blocks — pas depuis @storybook/addon-docs (import v6/v7 encore répandu dans les tutos mais incorrect en v8).
Pourquoi fetch-depth: 0 est-il obligatoire dans le workflow GitHub Actions de Chromatic ?|Chromatic a besoin de l'historique git complet pour calculer les diffs visuels entre baseline et snapshot actuel. Sans cela, il crée une nouvelle baseline à chaque run.
Quelle portion des critères RGAA addon-a11y (axe-core) couvre-t-il automatiquement ?|Environ 30 à 40 % des critères automatisables. Le reste (navigation clavier, lecteur d'écran, ordre de lecture) requiert un audit manuel.
Comment exposer les design tokens CSS dans Storybook sans addon supplémentaire ?|Importer tokens.css dans .storybook/preview.ts — les variables CSS :root sont alors disponibles dans toutes les stories. Créer en plus une story DesignTokens.vue qui lit les valeurs via getComputedStyle pour les rendre visibles.
Comment configurer Chromatic pour éviter les faux positifs sur des composants animés ?|Ajouter parameters: { chromatic: { delay: 300 } } dans la story — le délai en ms laisse le temps aux transitions CSS de se stabiliser avant la capture du snapshot.
Quelle propriété dans le meta CSF contrôle la hiérarchie de la sidebar Storybook ?|La propriété title — ex: 'Atoms/AppButton' crée un groupe Atoms avec un enfant AppButton. Le séparateur / définit les niveaux imbriqués.
Quelle commande installe addon-a11y dans un projet Storybook 8 existant ?|npx storybook@latest add @storybook/addon-a11y — cette commande installe le package ET ajoute l'entrée dans .storybook/main.ts automatiquement.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-32-storybook-design-system/README.md`. Pratique guidée : documenter `AppButton` avec autodocs, écrire une story de tokens, configurer addon-a11y, et lancer un premier snapshot Chromatic — corrigé commenté complet.
