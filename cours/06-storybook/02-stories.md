# 02 — Écrire des stories

---

> **🔄 Rappel du cours précédent**
> Avant de continuer, vérifie que tu peux répondre à ces questions :
> 1. Ou se trouve la configuration principale de Storybook ?
> 2. À quoi sert le fichier `preview.ts` dans `.storybook/` ?
> 
> <details>
> <summary>Vérifier mes réponses</summary>
>
> 1. Dans le dossier `.storybook/` à la racine du projet
> 2. Il configure les décorateurs globaux, les paramètres par défaut et les addons pour toutes les stories
> </details>

---

## 🧠 C'est quoi une "story" ?

Une **story**, c'est **un exemple concret** de comment un composant peut s'afficher.

> 💡 **Analogie :** Pense à un catalogue de vêtements. Chaque photo montre le même t-shirt, mais porté différemment : en rouge, en bleu, en taille S, en taille XL, avec un jean, avec un short… **Chaque photo = une story.** Le t-shirt = ton composant Vue.

Par exemple, pour un composant `AppButton`, tu pourrais avoir :

- Une story "Bouton normal" (bleu, taille moyenne)
- Une story "Bouton danger" (rouge)
- Une story "Bouton désactivé" (grisé)
- Une story "Toutes les tailles"

Chaque story montre **une variante** ou **un état** du composant.

### Le format d'un fichier de stories

Un fichier de stories a toujours l'extension `.stories.ts` et contient :

1. **Un objet `meta`** : les informations générales sur le composant (son nom, ses réglages)
2. **Des exports nommés** : chaque export = une story (un exemple)

---

## 📝 Ta première story (la plus simple possible)

Imaginons qu'on à un composant `AppButton.vue`. Voici le fichier de stories **le plus simple** :

```ts
// src/components/AppButton.stories.ts
// Ce fichier crée les exemples (stories) pour le composant AppButton

// --- Imports ---
// Meta = le type pour les infos générales du composant
// StoryObj = le type pour une story individuelle
import type { Meta, StoryObj } from "@storybook/vue3";

// On importe le composant qu'on veut montrer dans Storybook
import AppButton from "./AppButton.vue";

// --- Configuration générale (meta) ---
// C'est la "fiche d'identité" du composant dans Storybook
const meta: Meta<typeof AppButton> = {
  // title : le nom affiché dans le menu de gauche de Storybook
  // "UI/AppButton" crée un dossier "UI" avec "AppButton" dedans
  title: "UI/AppButton",

  // component : le composant Vue qu'on documente
  component: AppButton,

  // tags : des étiquettes spéciales
  // "autodocs" génère automatiquement une page de documentation
  tags: ["autodocs"],
};

// On exporte la config comme export par défaut
// (Storybook a besoin de ça pour fonctionner)
export default meta;

// Ce type nous aide à écrire des stories sans erreurs
type Story = StoryObj<typeof meta>;

// --- Notre première story ! ---
// Chaque "export const" crée une story dans Storybook
// Le nom de la variable (Default) devient le nom de la story
export const Default: Story = {
  // args : les props qu'on passe au composant
  // C'est comme écrire <AppButton label="Cliquez ici" /> en HTML
  args: {
    label: "Cliquez ici",
  },
};
```

> 💡 **Rappel :** Les **props** sont les paramètres qu'on envoie à un composant. C'est comme les arguments d'une fonction : `AppButton(label, variant, size)`.

---

## 🎛️ Les argTypes : contrôler les réglages dans Storybook

Les **argTypes** définissent **comment modifier les props** dans le panneau de contrôle de Storybook.

> 💡 **Analogie :** Imagine les boutons de réglage sur une chaîne hi-fi. `argTypes` te permet de choisir si le réglage est un curseur, un menu déroulant, un interrupteur on/off, etc.

```ts
const meta: Meta<typeof AppButton> = {
  title: "UI/AppButton",
  component: AppButton,
  tags: ["autodocs"],

  // argTypes : on décrit comment chaque prop peut être modifiée
  argTypes: {
    // La prop "variant" sera un menu déroulant (select)
    // avec 3 choix possibles
    variant: {
      control: "select",                               // Type de contrôle : menu déroulant
      options: ["primary", "secondary", "danger"],      // Les choix disponibles
    },

    // La prop "size" sera aussi un menu déroulant
    size: {
      control: "select",                // Menu déroulant
      options: ["sm", "md", "lg"],      // sm = petit, md = moyen, lg = grand
    },

    // La prop "disabled" sera un interrupteur on/off (checkbox)
    disabled: {
      control: "boolean",   // boolean = vrai/faux = checkbox
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;
```

Avec ça, dans Storybook tu verras un **panneau de contrôle** en bas de la page ou tu pourras changer les props en temps réel !

---

## 📸 Créer plusieurs stories (variantes)

Chaque variante de ton composant mérite sa propre story :

```ts
// Story par défaut : le bouton dans son état normal
export const Default: Story = {
  args: {
    label: "Cliquez ici",    // Le texte du bouton
    variant: "primary",       // Style principal (bleu)
    size: "md",               // Taille moyenne
  },
};

// Variante secondaire (souvent grise ou avec bordure)
export const Secondary: Story = {
  args: {
    label: "Annuler",         // Un bouton "Annuler" est souvent secondaire
    variant: "secondary",
  },
};

// Variante danger (rouge, pour les actions irréversibles)
export const Danger: Story = {
  args: {
    label: "Supprimer",       // Supprimer = action dangereuse = rouge
    variant: "danger",
  },
};

// État désactivé (bouton grisé, non cliquable)
export const Disabled: Story = {
  args: {
    label: "Indisponible",
    disabled: true,            // true = le bouton est désactivé
  },
};
```

> 💡 Chaque story à un nom clair qui décrit ce qu'elle montre. Dans Storybook, tu verras une liste : Default, Secondary, Danger, Disabled.

---

## 🎨 Story avec rendu personnalisé (`render`)

Parfois, tu veux montrer **plusieurs composants en même temps** dans une seule story. Par exemple, voir toutes les tailles côte à côte :

```ts
// Cette story montre les 3 tailles de bouton en même temps
export const AllSizes: Story = {
  // render : on crée un mini-composant Vue pour l'affichage
  render: () => ({
    // On déclare quels composants on utilise dans le template
    components: { AppButton },

    // Le HTML qui s'affichera dans Storybook
    template: `
      <div style="display: flex; gap: 8px; align-items: center">
        <!-- On affiche 3 boutons avec des tailles différentes -->
        <AppButton label="Small" size="sm" />
        <AppButton label="Medium" size="md" />
        <AppButton label="Large" size="lg" />
      </div>
    `,
    // display: flex → les éléments s'affichent en ligne (côte à côte)
    // gap: 8px → espace de 8 pixels entre chaque bouton
    // align-items: center → tout est aligné verticalement au centre
  }),
};
```

---

## 🧱 Story avec slots

> 💡 **Rappel :** Un **slot** en Vue, c'est un "trou" dans un composant ou tu peux insérer du contenu. C'est comme une enveloppe : le composant est l'enveloppe, et le slot c'est l'ouverture ou tu mets ta lettre.

Pour montrer un bouton qui contient une icône (via un slot) :

```ts
export const WithIcon: Story = {
  // render reçoit "args" = les props passées à la story
  render: (args) => ({
    components: { AppButton },

    // setup() rend "args" disponible dans le template
    setup() {
      return { args };
    },

    // v-bind="args" passe toutes les props d'un coup au composant
    template: `
      <AppButton v-bind="args">
        <!-- Le slot "icon" reçoit un emoji feu -->
        <template #icon>🔥</template>
        Avec icône
      </AppButton>
    `,
  }),
};
```

---

## 📡 Story avec actions (capturer les événements)

Quand l'utilisateur clique sur un bouton, on veut **voir l'événement** dans Storybook. C'est comme brancher un micro pour entendre ce que le composant "dit".

```ts
// On importe "fn" qui crée une fausse fonction pour espionner les appels
import { fn } from "@storybook/test";

export const WithClick: Story = {
  args: {
    label: "Cliquez",
    // fn() crée une fonction "espion"
    // Quand le bouton est cliqué, l'événement apparaît
    // dans le panneau "Actions" en bas de Storybook
    onClick: fn(),
  },
};
```

> 💡 **fn()** est une fonction factice (mock). Elle ne fait rien de réel, mais elle **enregistre** chaque fois qu'elle est appelée. Très utile pour vérifier que les événements se déclenchent bien.

---

## 🖼️ Les décorateurs (decorators)

Un **décorateur** est un "cadre" qu'on met **autour de toutes les stories** d'un composant.

> 💡 **Analogie :** C'est comme mettre un cadre photo autour de chaque image. Le cadre ne change pas d'une photo à l'autre — il ajoute juste un contour ou un fond.

```ts
const meta: Meta<typeof AppButton> = {
  title: "UI/AppButton",
  component: AppButton,

  // decorators : un tableau de fonctions qui "enveloppent" chaque story
  decorators: [
    (story) => ({
      components: { story },
      // On ajoute un fond gris clair et du padding autour de chaque story
      // Comme ça, on voit mieux le composant
      template:
        '<div style="padding: 16px; background: #f5f5f5"><story /></div>',
    }),
  ],
};
```

Résultat : **chaque story** de ce composant s'affichera avec un fond gris clair et un espacement de 16 pixels.

---

## 📁 Organisation des fichiers

La convention est de mettre le fichier de stories **juste à côté** du composant :

```
src/
  components/
    ui/                              ← Composants réutilisables (boutons, inputs…)
      AppButton.vue                  ← Le composant
      AppButton.stories.ts           ← Ses stories (juste à côté !)
      AppInput.vue
      AppInput.stories.ts
    domain/                          ← Composants spécifiques au métier
      ProductCard.vue
      ProductCard.stories.ts
```

> 💡 **Pourquoi à côté ?** Quand tu modifies un composant, tu vois immédiatement son fichier de stories. Pas besoin de chercher dans un autre dossier.

---

## ✅ Résumé

| Concept         | C'est quoi                                                          |
| --------------- | ------------------------------------------------------------------- |
| **Story**       | Un exemple concret d'un composant (une photo dans le catalogue)     |
| **meta**        | La fiche d'identité du composant (titre, réglages, décorateurs)     |
| **args**        | Les props qu'on passe au composant dans une story                   |
| **argTypes**    | Comment les props sont éditables dans le panneau de contrôle        |
| **render**      | Un rendu personnalisé pour montrer plusieurs variantes              |
| **fn()**        | Une fausse fonction pour capturer et voir les événements            |
| **decorators**  | Un cadre visuel ajouté autour de chaque story                       |

---

## 🎯 Pratique

### Exercice ST.1 — Première story

Crée une story pour ce composant `Badge` :

```vue
<!-- Badge.vue -->
<script setup lang="ts">
defineProps<{
  label: string
  variant?: 'success' | 'warning' | 'error'
}>()
</script>

<template>
  <span :class="['badge', variant]">{{ label }}</span>
</template>
```

```ts
// Badge.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import Badge from './Badge.vue'

const meta: Meta<typeof Badge> = {
  // ???
}

export default meta
type Story = StoryObj<typeof Badge>

// Story "Success"
export const Success: Story = {
  // ???
}

// Story "Warning" et "Error"
// ???
```

<details>
<summary>Solution</summary>

```ts
import type { Meta, StoryObj } from '@storybook/vue3'
import Badge from './Badge.vue'

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs']
}

export default meta
type Story = StoryObj<typeof Badge>

export const Success: Story = {
  args: {
    label: 'Succès',
    variant: 'success'
  }
}

export const Warning: Story = {
  args: {
    label: 'Attention',
    variant: 'warning'
  }
}

export const Error: Story = {
  args: {
    label: 'Erreur',
    variant: 'error'
  }
}
```
</details>

---

### Exercice ST.2 — argTypes

Ajoute des contrôles interactifs pour tester les props :

```ts
const meta: Meta<typeof Badge> = {
  component: Badge,
  argTypes: {
    // label : champ texte
    // variant : sélecteur avec les 3 options
    // ???
  }
}
```

<details>
<summary>Solution</summary>

```ts
argTypes: {
  label: {
    control: 'text',
    description: 'Le texte du badge'
  },
  variant: {
    control: 'select',
    options: ['success', 'warning', 'error'],
    description: 'Le style du badge'
  }
}
```
</details>

---

### Exercice ST.3 — Decorator

Ajoute un decorator pour afficher les stories sur fond sombre :

```ts
const meta: Meta<typeof Badge> = {
  component: Badge,
  decorators: [
    // ???
  ]
}
```

<details>
<summary>Solution</summary>

```ts
decorators: [
  () => ({
    template: '<div style="padding: 20px; background: #1a1a1a"><story /></div>'
  })
]
```
</details>

---

## Suite

→ `cours/06-storybook/03-design-system.md`
