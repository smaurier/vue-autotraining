---
titre: Storybook — stories
cours: 02-vue
notions: [Component Story Format CSF3, meta et story, args et argTypes, controls, actions et events, décorateurs, play function et interaction testing, stories pour états multiples]
outcomes:
  - sait écrire des stories au format CSF3 (meta + stories nommées)
  - sait piloter un composant avec args et argTypes (controls)
  - sait tester une interaction avec la play function
  - sait couvrir les états d'un composant (variants, edge cases)
prerequis: [30-storybook-setup]
next: 32-storybook-design-system
libs: [{ name: "@storybook/vue3-vite", version: "8" }, { name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — stories du composant FamilyCard (variants, empty state, interaction de sélection)
last-reviewed: 2026-07
---

# Storybook — stories (CSF3)

> **Outcomes — tu sauras FAIRE :** écrire des stories CSF3 complètes (meta + stories nommées), piloter un composant via args/argTypes/controls, tester une interaction avec la play function, couvrir tous les états d'un composant.
> **Difficulté :** :star::star:
>
> **Navigation :** ← [Module 30 — Storybook setup](30-storybook-setup.md)

---

## 1. Cas concret d'abord

Tu rejoins TribuZen. Le composant `FamilyCard.vue` vient d'être livré — il affiche le résumé d'une famille : nom, nombre de membres, état de sélection, et un bouton "Rejoindre". Le designer veut valider trois variantes avant la mise en production : carte normale, carte vide (0 membre), et carte sélectionnée. Le tech lead veut aussi un test automatique qui vérifie que le clic "Rejoindre" émet bien l'événement `select`.

Sans Storybook, la revue se fait à la main : bricoler `App.vue`, passer les props à la main, recharger la page. Avec Storybook, chaque variante est un export TypeScript autonome — la revue dure 2 minutes au lieu de 20.

**Problème posé avant la théorie :** comment écrire un fichier `FamilyCard.stories.ts` qui :
1. documente les trois variantes (Default, Empty, Selected)
2. expose des contrôles interactifs pour chaque prop
3. vérifie automatiquement que le clic émet `select`

Ce module te donne les outils pour répondre à ces trois points.

---

## 2. Théorie complète, concise

### 2.1 Component Story Format 3 (CSF3) — la structure de base

CSF3 est le format standard Storybook depuis la version 7. Un fichier `.stories.ts` contient toujours deux niveaux :

1. **`meta`** — objet de configuration exporté par défaut. Décrit le composant à toute la config Storybook.
2. **Stories nommées** — exports nommés. Chaque export = une variante du composant.

```ts
// src/components/family/FamilyCard.stories.ts

import type { Meta, StoryObj } from '@storybook/vue3'
import FamilyCard from './FamilyCard.vue'

// --- META ---
// Exporté par défaut : Storybook le lit en premier pour configurer l'iframe
const meta = {
  title: 'Family/FamilyCard',   // chemin affiché dans le menu latéral
  component: FamilyCard,         // composant Vue ciblé
  tags: ['autodocs'],            // génère une page de doc automatique
} satisfies Meta<typeof FamilyCard>

export default meta

// Alias de type — évite de répéter typeof meta partout
type Story = StoryObj<typeof meta>
```

> **`satisfies` vs `as`** : depuis TypeScript 4.9, `satisfies` est préférable à `as Meta<...>`. Il vérifie que l'objet *est conforme* au type sans l'élargir — les erreurs de typage sur `meta` sont détectées à l'écriture, pas à l'exécution.

### 2.2 `meta` — toutes les clés utiles

```ts
const meta = {
  title: 'Family/FamilyCard',          // obligatoire — chemin menu
  component: FamilyCard,               // obligatoire — composant cible
  tags: ['autodocs'],                  // optionnel — génère /docs automatique

  // argTypes : décrit comment chaque prop est présentée dans Controls
  argTypes: {
    memberCount: { control: 'number' },
    isSelected: { control: 'boolean' },
    variant: {
      control: 'select',
      options: ['default', 'highlighted', 'disabled'],
    },
  },

  // args par défaut — partagés par toutes les stories du fichier
  args: {
    familyName: 'Les Martin',
    memberCount: 4,
    isSelected: false,
  },

  // decorators : enveloppe visuelle appliquée à chaque story
  decorators: [
    () => ({
      template: '<div style="padding: 24px; max-width: 360px"><story /></div>',
    }),
  ],
} satisfies Meta<typeof FamilyCard>
```

### 2.3 Stories nommées — `args` et variants

Chaque export nommé hérite des `args` de `meta` et peut les surcharger :

```ts
// Story par défaut — utilise les args de meta tels quels
export const Default: Story = {}

// Variante "carte vide" — surcharge memberCount
export const Empty: Story = {
  args: {
    familyName: 'Nouvelle famille',
    memberCount: 0,
  },
}

// Variante "carte sélectionnée"
export const Selected: Story = {
  args: {
    isSelected: true,
    familyName: 'Les Martin',
    memberCount: 4,
  },
}
```

**Priorité des args (du plus faible au plus fort) :** global → meta → story → controls interactifs. Les controls du panneau Storybook écrasent tout en live, mais ne persistent pas entre les rechargements.

### 2.4 `argTypes` — controls interactifs

`argTypes` contrôle comment chaque arg est éditable dans le panneau Controls :

| `control` | Rendu dans Storybook | Cas d'usage |
|---|---|---|
| `'text'` | champ texte | string |
| `'number'` | champ numérique | number |
| `'boolean'` | checkbox | boolean |
| `'select'` | menu déroulant | union de strings |
| `'color'` | color picker | couleur CSS |
| `'date'` | date picker | Date |
| `{ type: 'range', min: 0, max: 10 }` | slider | number borné |

```ts
argTypes: {
  // Forme courte — Storybook infère le contrôle depuis le type TS du composant
  memberCount: { control: 'number' },

  // Forme longue — description visible dans la doc autodocs
  familyName: {
    control: 'text',
    description: 'Nom affiché sur la carte famille',
    table: { defaultValue: { summary: '"Les Martin"' } },
  },

  // Désactiver le contrôle pour une prop interne
  internalId: { control: false },
}
```

> **Inférence automatique** : si le composant est écrit avec `defineProps<T>()` (TypeScript), Storybook 8 infère les types et génère les contrôles sans `argTypes` manuel. `argTypes` sert à *affiner* ou *corriger* l'inférence, pas à tout redéclarer.

### 2.5 Actions et events — `fn()` de `@storybook/test`

Pour capturer les événements émis par un composant, Storybook 8 utilise `fn()` — une fonction espion importée depuis `@storybook/test` (remplace `@storybook/addon-actions` de SB 7).

```ts
import { fn } from '@storybook/test'

const meta = {
  component: FamilyCard,
  args: {
    // fn() crée un mock — chaque appel s'affiche dans le panneau "Actions"
    onSelect: fn(),   // correspond à l'emit 'select' du composant Vue
  },
} satisfies Meta<typeof FamilyCard>
```

**Convention Vue + Storybook** : un emit `select` dans Vue devient l'arg `onSelect` dans Storybook. La transformation est automatique — Storybook applique la convention `on` + PascalCase.

```ts
// Dans FamilyCard.vue
const emit = defineEmits<{ select: [id: string] }>()

// Dans FamilyCard.stories.ts — arg correspondant
args: {
  onSelect: fn(),   // fn() ← @storybook/test, pas @storybook/addon-actions
}
```

### 2.6 Décorateurs — enveloppes visuelles

Un décorateur est une fonction qui retourne un mini-composant Vue enveloppant la story. Ils s'appliquent :
- au niveau `meta` → à toutes les stories du fichier
- au niveau d'une story individuelle → à cette story seulement
- dans `.storybook/preview.ts` → à toutes les stories du projet

```ts
// Décorateur au niveau meta (toutes les stories du fichier)
const meta = {
  component: FamilyCard,
  decorators: [
    () => ({
      template: '<div style="padding: 24px; background: #f8fafc"><story /></div>',
    }),
  ],
} satisfies Meta<typeof FamilyCard>

// Décorateur sur une story individuelle (sombre — pour tester le contrast)
export const DarkBackground: Story = {
  args: { familyName: 'Les Martin', memberCount: 3 },
  decorators: [
    () => ({
      template: '<div style="padding: 24px; background: #0f172a"><story /></div>',
    }),
  ],
}
```

Les décorateurs se combinent : ceux de `meta` s'exécutent en dehors des décorateurs de la story.

### 2.7 `play` function — interaction testing

La `play` function est exécutée automatiquement après le rendu de la story. Elle permet de simuler des interactions utilisateur et d'en vérifier les effets — sans test runner séparé, directement dans Storybook.

Elle utilise `@storybook/test` (wrapper autour de `@testing-library` + `vitest`) :

```ts
import { expect, userEvent, within } from '@storybook/test'

export const SelectInteraction: Story = {
  args: {
    familyName: 'Les Martin',
    memberCount: 4,
    onSelect: fn(),
  },
  play: async ({ canvasElement, args }) => {
    // canvas = scope limité au canvasElement de la story
    const canvas = within(canvasElement)

    // Simuler un clic sur le bouton "Rejoindre"
    await userEvent.click(canvas.getByRole('button', { name: /rejoindre/i }))

    // Vérifier que l'emit 'select' a bien été déclenché
    expect(args.onSelect).toHaveBeenCalledOnce()
    expect(args.onSelect).toHaveBeenCalledWith('family-id-martin')
  },
}
```

**Anatomie de la play function :**
- `canvasElement` — élément DOM racine de la story (pour `within`)
- `args` — les args résolus de la story (accès aux `fn()` pour les assertions)
- `userEvent.click/type/tab` — interactions asynchrones (toutes sont `await`)
- `expect` — assertions Vitest/Testing Library disponibles nativement

> La play function s'exécute aussi dans le test runner Storybook (`storybook test`) et dans les tests CI via `@storybook/test-runner`.

### 2.8 Stories pour états multiples — render function

Pour afficher plusieurs instances d'un composant côte à côte (toutes les tailles, tous les variants), utiliser la `render` function :

```ts
export const AllVariants: Story = {
  render: (args) => ({
    components: { FamilyCard },
    setup() {
      return { args }
    },
    template: `
      <div style="display: flex; gap: 16px; flex-wrap: wrap">
        <FamilyCard v-bind="args" family-name="Famille A" :member-count="2" />
        <FamilyCard v-bind="args" family-name="Famille B" :member-count="0" />
        <FamilyCard v-bind="args" family-name="Famille C" :member-count="8" :is-selected="true" />
      </div>
    `,
  }),
}
```

La `render` function retourne un composant Vue inline. `setup()` expose `args` dans le template pour que les contrôles interactifs continuent de fonctionner sur les props partagées.

---

## 3. Worked examples

### Exemple 1 — `FamilyCard.stories.ts` complet (TribuZen)

Le composant cible :

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
    :class="{ 'family-card--selected': isSelected, 'family-card--empty': memberCount === 0 }"
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
```

Le fichier stories complet :

```ts
// src/components/family/FamilyCard.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import FamilyCard from './FamilyCard.vue'

// ─── META ─────────────────────────────────────────────────────────────────────
const meta = {
  title: 'Family/FamilyCard',
  component: FamilyCard,
  tags: ['autodocs'],

  // Controls : comment chaque prop apparaît dans le panneau
  argTypes: {
    familyName: {
      control: 'text',
      description: 'Nom de la famille affiché sur la carte',
    },
    memberCount: {
      control: { type: 'number', min: 0 },
      description: 'Nombre de membres — 0 affiche le message empty state',
    },
    isSelected: {
      control: 'boolean',
      description: 'Carte sélectionnée — désactive le bouton Rejoindre',
    },
  },

  // Args par défaut partagés par toutes les stories
  args: {
    familyName: 'Les Martin',
    memberCount: 4,
    isSelected: false,
    onSelect: fn(),  // fn() ← @storybook/test — capturé dans le panneau Actions
  },

  // Enveloppe visuelle : padding + largeur max pour toutes les stories
  decorators: [
    () => ({
      template: '<div style="padding: 24px; max-width: 360px"><story /></div>',
    }),
  ],
} satisfies Meta<typeof FamilyCard>

export default meta
type Story = StoryObj<typeof meta>

// ─── STORIES ──────────────────────────────────────────────────────────────────

// Variante par défaut — hérite de tous les args de meta
export const Default: Story = {}

// Empty state — famille sans membres
export const Empty: Story = {
  args: {
    familyName: 'Nouvelle famille',
    memberCount: 0,
  },
}

// Carte déjà sélectionnée — bouton désactivé
export const Selected: Story = {
  args: {
    isSelected: true,
  },
}

// Toutes les variantes côte à côte (revue design)
export const AllVariants: Story = {
  render: (args) => ({
    components: { FamilyCard },
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

// Interaction test — vérifie que le clic émet 'select'
export const SelectInteraction: Story = {
  args: {
    familyName: 'Les Martin',
    memberCount: 4,
    isSelected: false,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // Cliquer le bouton "Rejoindre"
    await userEvent.click(canvas.getByRole('button', { name: /rejoindre/i }))

    // L'emit 'select' doit avoir été déclenché avec le familyName
    expect(args.onSelect).toHaveBeenCalledOnce()
    expect(args.onSelect).toHaveBeenCalledWith('Les Martin')
  },
}
```

**Ce que ce fichier démontre :**
- `satisfies Meta<typeof FamilyCard>` — typage strict sans perte d'inférence
- `onSelect: fn()` dans `meta.args` — capturé dans Actions ET accessible dans `play`
- Stories héritant des `meta.args` via surcharge partielle (pas de duplication)
- `play` function vérifiant l'emit avec `toHaveBeenCalledWith`

### Exemple 2 — Story avec decorator par thème et argType `color`

Cas plus avancé : une story qui teste FamilyCard sur fond sombre avec un contrôle de couleur d'accentuation.

```ts
export const DarkTheme: Story = {
  args: {
    familyName: 'Les Dubois',
    memberCount: 3,
  },

  // Décorateur local — écrase le fond blanc du décorateur meta
  decorators: [
    () => ({
      template: `
        <div style="padding: 24px; background: #0f172a; border-radius: 8px">
          <story />
        </div>
      `,
    }),
  ],
}
```

> Les décorateurs se combinent dans l'ordre : décorateur global (preview.ts) → décorateur meta → décorateur story. Le résultat est imbriqué de l'extérieur vers l'intérieur.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — `StoryObj<typeof FamilyCard>` vs `StoryObj<typeof meta>`

```ts
// ❌ Type story lié au composant direct — perd les args de meta
type Story = StoryObj<typeof FamilyCard>

// ✅ Type story lié à meta — hérite de tous les args définis dans meta
// (y compris onSelect: fn() et les argTypes)
type Story = StoryObj<typeof meta>
```

Avec `StoryObj<typeof FamilyCard>`, les args définis dans `meta.args` (comme `onSelect`) ne sont pas visibles dans le type de la story — le compilateur ne peut pas vérifier qu'ils sont bien fournis. La forme `StoryObj<typeof meta>` est la convention CSF3 recommandée depuis Storybook 7.

### PIÈGE #2 — `fn()` de la mauvaise source

```ts
// ❌ Import depuis addon-actions (Storybook 6/7 legacy)
import { action } from '@storybook/addon-actions'
const onSelect = action('select')

// ✅ Import depuis @storybook/test (Storybook 7.4+ / 8)
import { fn } from '@storybook/test'
const onSelect = fn()
```

`action()` de `@storybook/addon-actions` ne retourne pas de mock compatible avec `expect().toHaveBeenCalled()` — il loggue seulement dans le panneau. `fn()` de `@storybook/test` est un mock complet (Vitest-compatible) qui peut être utilisé dans `play` pour des assertions.

### PIÈGE #3 — `.value` dans les args pour les refs Vue

```ts
// ❌ Ne jamais passer .value dans les args
args: {
  familyName: familyNameRef.value,  // capture la valeur au moment de la définition
}

// ✅ Les args sont des valeurs statiques, pas des refs réactives
args: {
  familyName: 'Les Martin',
}
```

Storybook gère ses propres `args` — ils ne sont pas liés au système de réactivité Vue. Les `args` sont des primitives ou des objets JSON sérialisables passés comme props. Toute réactivité vient des controls du panneau Storybook, pas de refs Vue.

### PIÈGE #4 — `play` sans `await` sur userEvent

```ts
play: async ({ canvasElement }) => {
  const canvas = within(canvasElement)

  // ❌ Sans await — l'assertion s'exécute avant le clic
  userEvent.click(canvas.getByRole('button', { name: /rejoindre/i }))
  expect(args.onSelect).toHaveBeenCalled()  // toujours faux

  // ✅ Toutes les interactions userEvent sont async — await obligatoire
  await userEvent.click(canvas.getByRole('button', { name: /rejoindre/i }))
  expect(args.onSelect).toHaveBeenCalled()  // correct
}
```

`userEvent` retourne des Promises — toujours `await` chaque interaction avant l'assertion suivante.

### PIÈGE #5 — Confondre `decorators` niveau meta et niveau global

```ts
// Dans meta — s'applique seulement aux stories de CE fichier
const meta = {
  decorators: [(story) => ({ template: '<div class="card-container"><story /></div>' })],
}

// Dans .storybook/preview.ts — s'applique à TOUTES les stories du projet
export const decorators = [
  (story) => ({ template: '<div class="app-shell"><story /></div>' }),
]
```

Un décorateur dans `meta` n'affecte pas les autres composants. Si tu veux un fond, un thème, ou un provider global (Pinia, Vue Router), c'est `preview.ts` qu'il faut modifier — pas le `meta` de chaque stories.

---

## 5. Ancrage TribuZen

Dans TribuZen, le pattern de ce module s'applique directement à `FamilyCard.vue` — le composant central du front-office (liste des familles disponibles à rejoindre).

**Fichiers cibles dans `smaurier/tribuzen` :**

```
tribuzen/
  src/
    components/
      family/
        FamilyCard.vue                ← composant documenté
        FamilyCard.stories.ts         ← fichier de ce module
```

**Stories à produire pour TribuZen :**

| Story | Description | Vérifie |
|---|---|---|
| `Default` | Carte normale, 4 membres | rendu de base |
| `Empty` | 0 membre, empty state | message "Aucun membre" |
| `Selected` | Carte déjà sélectionnée | bouton désactivé |
| `AllVariants` | 3 cartes côte à côte | cohérence visuelle |
| `SelectInteraction` | Clic "Rejoindre" | emit `select` avec familyName |

L'intérêt concret : le designer valide les variantes sans avoir à bricoler `App.vue`, et la play function `SelectInteraction` est reprise par le test runner CI — zéro duplication entre la doc et les tests.

**Commit cible :**
```
feat(storybook): FamilyCard — stories CSF3, controls, play function select
```

---

## 6. Points clés

1. Un fichier `.stories.ts` CSF3 = un `meta` exporté par défaut + des exports nommés (une story = un état du composant).
2. `satisfies Meta<typeof Component>` est préférable à `as Meta<...>` — TypeScript vérifie la conformité sans élargir le type.
3. `type Story = StoryObj<typeof meta>` — lier le type story à `meta` (pas au composant direct) pour hériter des args définis dans `meta`.
4. `args` dans `meta` = valeurs par défaut partagées par toutes les stories ; une story les surcharge partiellement.
5. `argTypes` définit le type de contrôle (text, number, boolean, select…) — Storybook 8 infère les contrôles depuis les types TypeScript du composant, `argTypes` sert à affiner.
6. `fn()` de `@storybook/test` remplace `action()` de `@storybook/addon-actions` — `fn()` est un mock Vitest-compatible utilisable dans les assertions `play`.
7. La `play` function est async — toujours `await` les interactions `userEvent` avant les assertions.
8. Les décorateurs s'imbriquent : global (preview.ts) > meta > story.

---

## 7. Seeds Anki

```
Quelle est la structure minimale d'un fichier CSF3 Storybook ?|Un export default `meta` (objet avec `component`) + au moins un export nommé (story). `type Story = StoryObj<typeof meta>` sert d'alias de type.
Pourquoi écrire `StoryObj<typeof meta>` plutôt que `StoryObj<typeof MonComposant>` ?|`StoryObj<typeof meta>` hérite des args définis dans meta (dont les fn() des events). `StoryObj<typeof MonComposant>` ne voit que les props du composant — les args supplémentaires comme onSelect sont invisibles au compilateur.
Quelle est la différence entre `fn()` de @storybook/test et `action()` de @storybook/addon-actions ?|`fn()` est un mock Vitest-compatible — il peut être passé à `expect().toHaveBeenCalled()` dans une play function. `action()` ne fait que logger dans le panneau Actions — pas d'assertion possible.
Comment un emit Vue `select` se mappe-t-il dans les args Storybook ?|Par convention `on` + PascalCase : l'emit `select` devient l'arg `onSelect`. Storybook applique cette transformation automatiquement.
Pourquoi faut-il toujours `await userEvent.click()` dans une play function ?|`userEvent` retourne une Promise. Sans `await`, l'assertion s'exécute avant que le DOM soit mis à jour — le test passe toujours faux.
Quelle est la priorité des args dans Storybook (du plus faible au plus fort) ?|global args → meta args → story args → contrôles interactifs du panneau. Les contrôles écrasent tout en live mais ne persistent pas.
À quoi sert le tag `autodocs` dans meta ?|Il demande à Storybook de générer automatiquement une page /docs pour ce composant — tableau des props, controls interactifs, et liste des stories intégrées.
Comment afficher plusieurs variantes d'un composant dans une seule story ?|Via la `render` function : elle retourne un composant Vue inline avec un template affichant plusieurs instances. `setup() { return { args } }` maintient les contrôles interactifs.
```

---

## Pont vers le lab

> Lab associé : `02-vue/labs/lab-31-storybook-stories/README.md`. Écrire le fichier `FamilyCard.stories.ts` complet depuis le starter, avec corrigé commenté et variante J+30.
