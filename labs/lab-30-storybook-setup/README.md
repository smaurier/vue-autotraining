# Lab 30 — Storybook setup

> **Outcome :** à la fin, tu sais configurer Storybook 8 dans un projet Vue 3 Vite, connecter l'alias `@/`, importer les styles globaux, activer les addons essentiels et afficher la première story `AppButton` dans le navigateur.
> **Vrai outil :** Storybook 8 (`@storybook/vue3-vite`), Vue 3.5, pnpm.
> **Feedback :** le coach valide visuellement en session — la story `AppButton` doit s'afficher dans Storybook avec les styles de l'app.

---

## Énoncé

Tu pars d'un projet Vue 3 Vite **sans Storybook**. Tu dois le configurer pour TribuZen : alias `@/`, CSS global, addons a11y et interactions, composant `AppButton.vue` visible en story.

**Cahier des charges exact :**

1. Installer Storybook 8 avec `npx storybook@latest init`.
2. Corriger `main.ts` : alias `@/`, glob limité à `src/components/`, framework objet Storybook 8, addons `essentials` + `a11y`.
3. Corriger `preview.ts` : importer `src/assets/main.css`, ajouter un fond `light` par défaut dans `backgrounds`.
4. Créer `src/components/ui/AppButton.vue` (composant minimal).
5. Créer `src/components/ui/AppButton.stories.ts` (story minimale — **pas** encore de play function, ça c'est le module 31).
6. Lancer `pnpm storybook` → la story `AppButton` s'affiche avec les styles globaux.

**Starter minimal**

Utilise un projet Vue 3 Vite fraîchement créé via :

```bash
pnpm create vite tribuzen-storybook --template vue-ts
cd tribuzen-storybook
pnpm install
```

Ou utilise ton projet TribuZen existant — dans ce cas, adapte les chemins.

---

## Étapes (en friction)

1. **Lance l'init Storybook** — `npx storybook@latest init`. Observe les fichiers créés dans `.storybook/` et les scripts ajoutés à `package.json`.

2. **Examine `main.ts` généré** — repère le format du champ `framework` (string ou objet ?). Corrige-le en objet Storybook 8 avec `options: { docgen: 'vue-component-meta' }`.

3. **Ajoute l'alias `@/` dans `main.ts`** — importe `mergeConfig` de Vite et `fileURLToPath`, `URL` de `node:url`. Implémente `viteFinal`.

4. **Restreins le glob `stories`** — change pour `'../src/components/**/*.stories.@(ts|tsx)'` (supprimer le glob `src/stories/` des exemples).

5. **Configure `preview.ts`** — remplace l'import Preview par `@storybook/vue3-vite`, ajoute l'import `'../src/assets/main.css'`, ajoute les backgrounds.

6. **Crée `AppButton.vue`** — composant minimal (props : `label: string`, `variant: 'primary' | 'secondary'`, `disabled: boolean`). Style scoped basique.

7. **Crée `AppButton.stories.ts`** — story minimale avec `meta` + export `Default`. Utilise `@storybook/test` uniquement pour le type `StoryObj`.

8. **Lance `pnpm storybook`** — vérifie que `AppButton` apparaît dans la sidebar, que les styles main.css sont actifs, que le fond clair est le défaut.

---

## Corrigé complet commenté

### `.storybook/main.ts`

```ts
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/vue3-vite'
import { mergeConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

const config: StorybookConfig = {
  // Glob limité aux composants — exclut pages/, stores/, composables/
  // Storybook n'a pas besoin de voir les pages entières
  stories: ['../src/components/**/*.stories.@(ts|tsx)'],

  // Format objet Storybook 8 — obligatoire pour passer des options
  // docgen: 'vue-component-meta' génère la doc des props depuis les types TS
  framework: {
    name: '@storybook/vue3-vite',
    options: {
      docgen: 'vue-component-meta',
    },
  },

  addons: [
    '@storybook/addon-essentials',   // Controls, Actions, Docs, Backgrounds, Viewport
    '@storybook/addon-a11y',         // Audit axe-core dans le panneau Accessibility
    '@storybook/addon-interactions', // Play functions — simulation d'interactions
  ],

  // viteFinal : point d'entrée pour modifier la config Vite interne de Storybook
  // mergeConfig fusionne sans écraser les plugins existants de Storybook
  viteFinal(cfg) {
    return mergeConfig(cfg, {
      resolve: {
        alias: {
          // Même alias que vite.config.ts — Storybook ne le lit pas automatiquement
          '@': fileURLToPath(new URL('../src', import.meta.url)),
        },
      },
    })
  },
}

export default config
```

### `.storybook/preview.ts`

```ts
// .storybook/preview.ts
import type { Preview } from '@storybook/vue3-vite'
// ⚠️ Le type vient de @storybook/vue3-vite, pas de @storybook/vue3
// Les deux compilent, mais vue3-vite donne les types exacts pour le framework Vite

// Styles globaux — injectés dans l'iframe de preview
// Sans cet import, les composants s'affichent sans aucun style de l'app
import '../src/assets/main.css'

const preview: Preview = {
  parameters: {
    // Controls : règles d'affichage dans le panneau Args
    controls: {
      matchers: {
        // Props dont le nom finit par "color" ou "background" → color picker
        color: /(background|color)$/i,
        // Props dont le nom finit par "Date" → date picker
        date: /Date$/i,
      },
    },
    // Backgrounds : couleurs de fond disponibles dans le toolbar Storybook
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f8fafc' }, // fond clair TribuZen
        { name: 'dark',  value: '#0f172a' }, // fond sombre TribuZen
      ],
    },
  },
}

export default preview
```

### `src/components/ui/AppButton.vue`

```vue
<!-- src/components/ui/AppButton.vue -->
<script setup lang="ts">
// Props typées en TypeScript pur — defineProps avec générique
// variant: union string littéral — TS vérifie que seules 'primary' et 'secondary' sont passées
defineProps<{
  label: string
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}>()
</script>

<template>
  <!-- :disabled lié au prop — TS garantit que disabled est boolean -->
  <!-- :class objet — la classe active dépend du variant -->
  <button
    class="btn"
    :class="[`btn--${variant ?? 'primary'}`]"
    :disabled="disabled"
  >
    {{ label }}
  </button>
</template>

<style scoped>
/* Styles minimalistes — à remplacer par les tokens TribuZen */
.btn {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1.25rem;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Variante primary — action principale */
.btn--primary {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.btn--primary:hover:not(:disabled) {
  background: #2563eb;
}

/* Variante secondary — action secondaire */
.btn--secondary {
  background: transparent;
  color: #3b82f6;
  border-color: #3b82f6;
}

.btn--secondary:hover:not(:disabled) {
  background: #eff6ff;
}
</style>
```

### `src/components/ui/AppButton.stories.ts`

```ts
// src/components/ui/AppButton.stories.ts
// CSF 3 (Component Story Format 3) — format standard Storybook 8
import type { Meta, StoryObj } from '@storybook/vue3'
import AppButton from './AppButton.vue'

// Meta : métadonnées du composant pour la sidebar et le panneau Docs
const meta: Meta<typeof AppButton> = {
  title: 'UI/AppButton',      // Chemin dans la sidebar : UI > AppButton
  component: AppButton,       // Lien vers le composant Vue — Storybook peut lire les props
  tags: ['autodocs'],         // Active la page Docs générée automatiquement
  // argTypes permet de surcharger le contrôle généré pour un arg spécifique
  argTypes: {
    variant: {
      control: 'radio',       // Boutons radio au lieu d'un champ texte libre
      options: ['primary', 'secondary'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Story "Default" — état de base
// args = les props passées au composant dans la story
export const Default: Story = {
  args: {
    label: 'Créer un groupe',
    variant: 'primary',
    disabled: false,
  },
}

// Story "Secondary" — variante secondaire
export const Secondary: Story = {
  args: {
    label: 'Annuler',
    variant: 'secondary',
    disabled: false,
  },
}

// Story "Disabled" — état désactivé (feedback visuel critique)
export const Disabled: Story = {
  args: {
    label: 'Action indisponible',
    variant: 'primary',
    disabled: true,
  },
}
```

**Vérification finale :**

```bash
pnpm storybook
# → http://localhost:6006
# → Sidebar : UI > AppButton > Default / Secondary / Disabled
# → Panneau Controls : label (text), variant (radio), disabled (boolean)
# → Fond clair par défaut — les styles main.css sont appliqués
```

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — en 30 minutes, sans ouvrir ce corrigé :**

1. Ajoute un composant `AppInput.vue` (props : `modelValue: string`, `placeholder?: string`, `error?: string`) et sa story avec trois états : vide, remplie, erreur.
2. Ajoute un **décorateur global** dans `preview.ts` qui enveloppe toutes les stories dans un `<div style="padding: 2rem">` (margin de visualisation).
3. Installe `@storybook/addon-interactions` et `@storybook/test`, et écris une **play function** basique sur la story `AppInput / Default` qui simule une saisie avec `userEvent.type`.

**Critère de réussite :** les deux composants s'affichent dans Storybook, la play function tourne sans erreur dans le panneau Interactions.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, la structure cible après ce lab :

```
tribuzen/
  .storybook/
    main.ts          ← alias @/, docgen vue-component-meta, addons a11y + interactions
    preview.ts       ← assets/main.css, backgrounds, prêt pour décorateur Pinia (module 31)
  src/
    components/
      ui/
        AppButton.vue
        AppButton.stories.ts
```

**Différences prod vs lab :**

- `AppButton.vue` utilisera les tokens CSS de TribuZen (`var(--color-primary)`, etc.) plutôt que les valeurs hex brutes.
- Le `meta.title` suivra la convention TribuZen : `'Components/UI/AppButton'` (trois niveaux pour un design system avec 20+ composants).
- Quand Pinia sera en place (sprint 2), ajouter le décorateur Pinia dans `preview.ts` selon l'Exemple 2 du module 30.

**Commit cible :**

```
feat(storybook): setup Storybook 8 + AppButton story baseline
```
