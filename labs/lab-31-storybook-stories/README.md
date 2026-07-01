# Lab 31 — Storybook stories (CSF3)

> **Outcome :** à la fin, tu sais écrire un fichier `.stories.ts` CSF3 complet pour un composant Vue 3 — meta, variants, controls, actions et play function — avec Storybook 8.
> **Vrai outil :** Storybook 8 + `@storybook/vue3-vite` + `@storybook/test`.
> **Feedback :** le coach valide visuellement dans l'UI Storybook + la play function doit passer au vert.

---

## Énoncé

Tu as hérité du composant `FamilyCard.vue` ci-dessous. Ta mission : écrire `FamilyCard.stories.ts` qui satisfait ces quatre critères :

1. **Trois variantes documentées** : Default (carte normale), Empty (0 membre), Selected (carte déjà sélectionnée).
2. **Controls interactifs** : `familyName` (text), `memberCount` (number, min 0), `isSelected` (boolean).
3. **Action capturée** : l'emit `select` doit apparaître dans le panneau Actions de Storybook.
4. **Interaction test** : une story `SelectInteraction` avec une `play` function qui clique le bouton "Rejoindre" et vérifie que l'emit a bien été déclenché.

### Composant starter

Crée ou utilise ce `FamilyCard.vue` dans `src/components/family/` :

```vue
<!-- src/components/family/FamilyCard.vue -->
<script setup lang="ts">
defineProps<{
  familyName: string
  memberCount: number
  isSelected?: boolean
}>()

const emit = defineEmits<{ select: [familyName: string] }>()
</script>

<template>
  <div
    class="family-card"
    :class="{
      'family-card--selected': isSelected,
      'family-card--empty': memberCount === 0,
    }"
  >
    <h3 class="family-card__name">{{ familyName }}</h3>
    <p class="family-card__count">
      {{ memberCount === 0 ? 'Aucun membre' : `${memberCount} membre(s)` }}
    </p>
    <button
      class="family-card__btn"
      :disabled="isSelected"
      @click="emit('select', familyName)"
    >
      {{ isSelected ? 'Sélectionnée' : 'Rejoindre' }}
    </button>
  </div>
</template>

<style scoped>
.family-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
}

.family-card--selected {
  border-color: #6366f1;
  background: #eef2ff;
}

.family-card--empty .family-card__count {
  color: #94a3b8;
  font-style: italic;
}

.family-card__name {
  margin: 0 0 8px;
  font-size: 1rem;
  font-weight: 600;
}

.family-card__count {
  margin: 0 0 12px;
  font-size: 0.875rem;
  color: #475569;
}

.family-card__btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #6366f1;
  color: #fff;
  font-weight: 500;
  cursor: pointer;
}

.family-card__btn:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}
</style>
```

### Starter du fichier stories

Crée `src/components/family/FamilyCard.stories.ts` :

```ts
// FamilyCard.stories.ts — starter
import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import FamilyCard from './FamilyCard.vue'

// À toi de remplir : meta, argTypes, args par défaut, decorators
const meta = {
  // ???
} satisfies Meta<typeof FamilyCard>

export default meta
type Story = StoryObj<typeof meta>

// À toi : 3 variants + AllVariants (render fn) + SelectInteraction (play fn)
```

Lance Storybook (`pnpm storybook`) et vérifie visuellement chaque variante.

---

## Étapes (en friction)

1. **Déclare `meta`** — `title`, `component`, `tags: ['autodocs']`, un decorator de padding (`padding: 24px; max-width: 360px`).
2. **Déclare les `argTypes`** — `familyName` (text), `memberCount` (number min 0), `isSelected` (boolean). Ajoute une description courte à chacun.
3. **Déclare les `meta.args` par défaut** — `familyName: 'Les Martin'`, `memberCount: 4`, `isSelected: false`, `onSelect: fn()`.
4. **Écris la story `Default`** — hérite de tout depuis `meta`, aucun arg supplémentaire.
5. **Écris la story `Empty`** — surcharge `familyName` et `memberCount: 0`. Vérifie dans Storybook que "Aucun membre" s'affiche.
6. **Écris la story `Selected`** — surcharge `isSelected: true`. Vérifie que le bouton est grisé et non cliquable.
7. **Écris `AllVariants`** avec une `render` function affichant les 3 cartes côte à côte (Default, Empty, Selected).
8. **Écris `SelectInteraction`** avec une `play` function qui :
   - clique le bouton "Rejoindre" via `userEvent.click`
   - vérifie avec `expect(args.onSelect).toHaveBeenCalledOnce()`
   - vérifie que l'arg passé est bien `'Les Martin'`

---

## Corrigé complet commenté

```ts
// src/components/family/FamilyCard.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import FamilyCard from './FamilyCard.vue'

// ─── META ─────────────────────────────────────────────────────────────────────
const meta = {
  // Chemin dans le menu latéral Storybook — "Family" = dossier, "FamilyCard" = entrée
  title: 'Family/FamilyCard',
  component: FamilyCard,

  // autodocs : génère une page /docs avec tableau de props + stories intégrées
  tags: ['autodocs'],

  // argTypes : affine les contrôles générés automatiquement par Storybook
  // (Storybook 8 infère depuis defineProps<T>() — ici on ajoute min et descriptions)
  argTypes: {
    familyName: {
      control: 'text',
      description: 'Nom de la famille affiché en titre de carte',
    },
    memberCount: {
      // Forme objet pour passer min: 0 — évite les valeurs négatives dans le contrôle
      control: { type: 'number', min: 0 },
      description: 'Nombre de membres — 0 déclenche le message "Aucun membre"',
    },
    isSelected: {
      control: 'boolean',
      description: 'Carte déjà sélectionnée — désactive le bouton Rejoindre',
    },
  },

  // args partagés par toutes les stories — chaque story peut les surcharger
  args: {
    familyName: 'Les Martin',
    memberCount: 4,
    isSelected: false,
    // fn() de @storybook/test : mock Vitest-compatible
    // Convention Vue→Storybook : emit 'select' → arg 'onSelect'
    onSelect: fn(),
  },

  // Decorator meta : enveloppe visuelle appliquée à toutes les stories du fichier
  decorators: [
    () => ({
      template: '<div style="padding: 24px; max-width: 360px"><story /></div>',
    }),
  ],
} satisfies Meta<typeof FamilyCard>
// satisfies Meta<typeof FamilyCard> préférable à `as` :
// TypeScript vérifie la conformité sans élargir le type → erreurs détectées à l'écriture

export default meta

// StoryObj<typeof meta> et pas StoryObj<typeof FamilyCard> :
// hérite des args de meta (onSelect: fn() inclus) — le compilateur voit tout
type Story = StoryObj<typeof meta>

// ─── STORIES ──────────────────────────────────────────────────────────────────

// Default — hérite de tous les meta.args sans surcharge
// Résultat : carte "Les Martin", 4 membres, bouton "Rejoindre" actif
export const Default: Story = {}

// Empty — surcharge partielle des meta.args
// Seuls familyName et memberCount changent — onSelect: fn() est hérité
export const Empty: Story = {
  args: {
    familyName: 'Nouvelle famille',
    memberCount: 0,  // déclenche "Aucun membre" dans le template
  },
}

// Selected — bouton "Sélectionnée" désactivé, fond indigo
export const Selected: Story = {
  args: {
    isSelected: true,
    // familyName et memberCount hérités de meta.args
  },
}

// AllVariants — render function pour afficher plusieurs instances
// Utile pour la revue design : voir les 3 états côte à côte sans changer de page
export const AllVariants: Story = {
  render: (args) => ({
    components: { FamilyCard },
    // setup() expose args dans le template → les controls interactifs fonctionnent
    // sur les props partagées (celles non surchargées dans le template inline)
    setup() {
      return { args }
    },
    template: `
      <div style="display: flex; gap: 16px; flex-wrap: wrap">
        <FamilyCard v-bind="args" family-name="Les Martin" :member-count="4" />
        <FamilyCard v-bind="args" family-name="Nouvelle" :member-count="0" />
        <FamilyCard v-bind="args" family-name="Les Dupont" :member-count="6" :is-selected="true" />
      </div>
    `,
  }),
}

// SelectInteraction — play function : simule un clic et vérifie l'emit
// S'exécute automatiquement à l'affichage + dans le test runner CI
export const SelectInteraction: Story = {
  args: {
    familyName: 'Les Martin',
    memberCount: 4,
    isSelected: false,  // bouton actif — sinon le clic ne produit rien
  },
  play: async ({ canvasElement, args }) => {
    // within() scope les requêtes DOM au canvas de CETTE story
    // (évite les faux positifs si plusieurs stories sont dans la même page)
    const canvas = within(canvasElement)

    // getByRole avec name regex — résistant aux changements de casse
    // await obligatoire : userEvent retourne une Promise
    await userEvent.click(canvas.getByRole('button', { name: /rejoindre/i }))

    // Assertions sur le mock fn() passé via onSelect
    // toHaveBeenCalledOnce() : exactement 1 appel (pas 0, pas 2)
    expect(args.onSelect).toHaveBeenCalledOnce()

    // toHaveBeenCalledWith() : vérifie l'argument passé à l'emit
    // FamilyCard émet emit('select', familyName) → Storybook appelle onSelect(familyName)
    expect(args.onSelect).toHaveBeenCalledWith('Les Martin')
  },
}
```

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — de mémoire, en 30 minutes :**

1. Ajoute une **story `LongName`** avec un `familyName` de 40 caractères — vérifie visuellement que le texte ne déborde pas de la carte.
2. Ajoute un **décorateur local** sur la story `Selected` qui affiche la carte sur fond sombre (`#0f172a`) pour tester le contraste en mode dark.
3. Écris une **story `DoubleClick`** avec une `play` function qui clique le bouton deux fois et vérifie que `onSelect` a été appelé exactement deux fois (`toHaveBeenCalledTimes(2)`).

**Critère de réussite :** toutes les stories s'affichent sans erreur console, la play function `DoubleClick` passe au vert dans Storybook.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, `FamilyCard.stories.ts` vit ici :

```
tribuzen/
  src/
    components/
      family/
        FamilyCard.vue
        FamilyCard.stories.ts   ← produit dans ce lab
```

**Différences par rapport au lab :**

- `familyName` sera remplacé par un objet `family: Family` passé via prop (module 05 — `defineProps`). Les stories devront passer un objet complet au lieu d'une string.
- L'emit `select` transportera `family.id` (string UUID) plutôt que le nom — l'assertion `toHaveBeenCalledWith` devra s'adapter.
- Le design system TribuZen (tokens CSS, module 32) remplacera les styles inline des décorateurs par des classes utilitaires.

**Commit cible :**
```
feat(storybook): FamilyCard — stories CSF3, controls, play function select
```
