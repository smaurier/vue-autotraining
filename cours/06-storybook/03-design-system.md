# 03 — Design System : le guide de style de ton application

## 🧠 C'est quoi un design system ?

Imagine que tu travailles pour une grande marque (comme McDonald's ou Apple). Cette marque a un **guide de style** qui dit :

- Le rouge McDonald's, c'est exactement `#DA291C` (pas un autre rouge)
- Le logo doit toujours avoir 10 px d'espace autour
- Les titres sont en police **Helvetica bold**
- Les boutons ont des coins arrondis de 8 px

Ce guide de style s'appelle un **design system**. C'est un **ensemble de règles + composants réutilisables** qui garantissent que toute l'application a la même apparence.

> 💡 **Analogie :** Un design system, c'est comme une **charte graphique** pour un architecte : elle définit les matériaux, les couleurs et les formes à utiliser pour que tous les bâtiments d'un quartier aient un style cohérent.

### Pourquoi c'est important ?

Sans design system :

- Un dev met 16 px d'espace, un autre met 15 px, un troisième met 20 px
- Les boutons ont 3 styles différents sur 3 pages différentes
- Changer la couleur principale = modifier 47 fichiers

Avec un design system :

- Tout le monde utilise les **mêmes valeurs** définies à un seul endroit
- Les composants sont **identiques** partout
- Changer la couleur principale = modifier **une seule variable**

---

## 🎨 Les design tokens (jetons de design)

### C'est quoi un token ?

Un **design token**, c'est une **variable qui stocke une valeur de design**. Au lieu d'écrire la couleur `#3b82f6` partout dans ton code, tu crées une variable `--color-primary` et tu l'utilises partout.

> 💡 **Analogie :** C'est comme donner un **nom** à une couleur de peinture. Au lieu de dire "utilise le mélange 60% bleu + 30% blanc + 10% gris", tu dis juste "utilise Bleu Océan". Si un jour tu veux changer Bleu Océan, tu changes la recette une seule fois.

### Les tokens en CSS

En CSS, on utilise des **variables CSS** (aussi appelées "custom properties") pour créer les tokens :

```css
/* tokens.css */
/* Ce fichier est LE SEUL ENDROIT où on définit les valeurs de design */

:root {
  /* ":root" signifie "à la racine du document HTML"       */
  /* Les variables définies ici sont disponibles PARTOUT    */

  /* === COULEURS === */
  --color-primary: #3b82f6;         /* Bleu principal (boutons, liens)           */
  --color-primary-hover: #2563eb;   /* Bleu plus foncé quand on survole          */
  --color-secondary: #64748b;       /* Gris pour les éléments secondaires        */
  --color-danger: #ef4444;          /* Rouge pour les erreurs et suppressions     */
  --color-success: #22c55e;         /* Vert pour les confirmations               */
  --color-text: #1f2937;            /* Couleur du texte principal (presque noir)  */
  --color-text-muted: #6b7280;      /* Texte atténué (informations secondaires)  */
  --color-bg: #ffffff;              /* Fond de page (blanc)                      */
  --color-bg-muted: #f8fafc;        /* Fond légèrement grisé (pour les zones)    */
  --color-border: #e5e7eb;          /* Couleur des bordures                      */

  /* === ESPACEMENTS === */
  /* Au lieu de mettre des pixels au hasard, on utilise une échelle cohérente */
  --space-xs: 4px;   /* Très petit espace   (ex : entre une icône et son texte)    */
  --space-sm: 8px;   /* Petit espace        (ex : padding intérieur d'un badge)    */
  --space-md: 16px;  /* Espace moyen        (ex : padding d'un bouton, marge)      */
  --space-lg: 24px;  /* Grand espace        (ex : séparation entre deux sections)  */
  --space-xl: 32px;  /* Très grand espace   (ex : marge d'une page)                */

  /* === TYPOGRAPHIE (polices de caractères) === */
  --font-sans: "Inter", system-ui, sans-serif;    /* Police principale (texte)      */
  --font-mono: "JetBrains Mono", monospace;        /* Police à chasse fixe (code)    */
  --text-sm: 0.875rem;   /* Petite taille de texte (14px)    */
  --text-base: 1rem;     /* Taille de texte normale (16px)   */
  --text-lg: 1.125rem;   /* Grande taille de texte (18px)    */
  --text-xl: 1.25rem;    /* Très grande taille (20px)        */
  /* rem = unité relative à la taille de base du navigateur (souvent 16px) */

  /* === COINS ARRONDIS (border-radius) === */
  --radius-sm: 4px;       /* Légèrement arrondi  (ex : badge, tag)      */
  --radius-md: 8px;       /* Arrondi moyen       (ex : bouton, carte)   */
  --radius-lg: 12px;      /* Bien arrondi        (ex : modale, panneau) */
  --radius-full: 9999px;  /* Complètement rond   (ex : avatar, pastille)*/

  /* === OMBRES === */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);   /* Ombre légère (carte discrète)   */
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);     /* Ombre moyenne (carte surélevée) */
  /* rgba(0, 0, 0, 0.1) = noir avec 10% d'opacité = un gris très transparent */
}
```

### Comment utiliser un token dans un composant ?

```css
/* Au lieu d'écrire : */
.btn {
  background-color: #3b82f6;   /* ❌ Couleur "en dur" */
  padding: 16px;               /* ❌ Valeur arbitraire */
}

/* On écrit : */
.btn {
  background-color: var(--color-primary);   /* ✅ On utilise le token */
  padding: var(--space-md);                 /* ✅ On utilise le token */
}
```

> 💡 **`var(--nom-du-token)`** est la syntaxe CSS pour utiliser une variable. `var` = "va chercher la valeur de".

---

## 🧱 Organisation des composants : Atomes, Molécules, Organismes

Un design system organise les composants **du plus petit au plus grand**, comme des briques LEGO :

### La métaphore des LEGO

```
🔵 ATOME        = Une seule brique LEGO
                   → Un bouton, un input, un label, une icône

🧩 MOLÉCULE     = Quelques briques assemblées
                   → Un champ de formulaire (label + input + message d'erreur)

🏗️ ORGANISME    = Un ensemble de molécules
                   → Un formulaire complet, une barre de navigation, un header
```

> 💡 Cette approche s'appelle **Atomic Design** (design atomique). Elle a été inventée par Brad Frost.

### En pratique dans Storybook

Dans Storybook, on organise les stories pour refléter cette hiérarchie :

```
📁 Storybook (menu de gauche)
├── 🔵 Atoms/          ← Les briques de base
│   ├── AppButton
│   ├── AppInput
│   └── AppBadge
├── 🧩 Molecules/      ← Assemblage de quelques atomes
│   ├── FormField       (= label + input + erreur)
│   └── SearchBar       (= input + bouton)
└── 🏗️ Organisms/      ← Sections complètes
    ├── LoginForm       (= plusieurs FormField + bouton)
    └── AppHeader       (= logo + navigation + SearchBar)
```

---

## 🛠️ Composants de base : exemples concrets

### Atome : AppButton

```vue
<!-- src/components/ui/AppButton.vue -->
<!-- Un bouton réutilisable avec plusieurs variantes -->

<script setup lang="ts">
// On définit les props que le composant accepte
interface Props {
  // variant : le style du bouton (couleur/importance)
  variant?: "primary" | "secondary" | "danger" | "ghost";
  // size : la taille du bouton
  size?: "sm" | "md" | "lg";
  // disabled : le bouton est-il désactivé ?
  disabled?: boolean;
  // loading : le bouton est-il en cours de chargement ?
  loading?: boolean;
}

// withDefaults : définit les valeurs par défaut des props
// Si on ne passe pas de variant, il sera "primary"
// Si on ne passe pas de size, il sera "md"
const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  size: "md",
});

// defineEmits : déclare les événements que le composant peut envoyer
// Ici, un événement "click" qui contient un objet MouseEvent
const emit = defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<template>
  <!-- Le bouton HTML -->
  <!-- :class="[...]" applique des classes CSS dynamiques -->
  <!-- 'btn' est toujours présent -->
  <!-- `btn--${props.variant}` ajoute "btn--primary", "btn--danger", etc. -->
  <!-- `btn--${props.size}` ajoute "btn--sm", "btn--md", "btn--lg" -->
  <button
    :class="['btn', `btn--${props.variant}`, `btn--${props.size}`]"
    :disabled="props.disabled || props.loading"
    @click="emit('click', $event)"
  >
    <!-- Si le bouton est en chargement, affiche un spinner -->
    <span v-if="props.loading" class="btn__spinner"></span>
    <!-- <slot /> = le contenu que l'utilisateur met entre les balises -->
    <!-- Ex: <AppButton>Mon texte</AppButton> → "Mon texte" va dans le slot -->
    <slot />
  </button>
</template>
```

### Atome : AppInput

```vue
<!-- src/components/ui/AppInput.vue -->
<!-- Un champ de saisie réutilisable avec label et message d'erreur -->

<script setup lang="ts">
// Les props de notre composant
interface Props {
  label?: string;        // Le texte au-dessus du champ (ex: "Email")
  error?: string;        // Le message d'erreur (ex: "Email invalide")
  placeholder?: string;  // Le texte grisé dans le champ vide (ex: "Entrez votre email")
  type?: "text" | "email" | "password" | "number";  // Le type du champ
}

// Valeurs par défaut
const props = withDefaults(defineProps<Props>(), {
  type: "text",  // Par défaut, c'est un champ texte
});

// defineModel : crée un v-model automatique
// Ça permet d'écrire <AppInput v-model="monTexte" />
// et "monTexte" sera synchronisé avec la valeur du champ
const model = defineModel<string>({ default: "" });
</script>

<template>
  <div class="form-field">
    <!-- Le label s'affiche seulement si on a passé une prop "label" -->
    <label v-if="props.label" class="form-field__label">
      {{ props.label }}
    </label>

    <!-- Le champ de saisie -->
    <!-- v-model="model" lie la valeur du champ à la variable model -->
    <input
      v-model="model"
      :type="props.type"
      :placeholder="props.placeholder"
      :class="[
        'form-field__input',
        { 'form-field__input--error': props.error },
      ]"
    />
    <!-- ☝️ Si props.error existe, la classe --error est ajoutée (bordure rouge) -->

    <!-- Le message d'erreur s'affiche seulement s'il y a une erreur -->
    <span v-if="props.error" class="form-field__error">
      {{ props.error }}
    </span>
  </div>
</template>
```

---

## 📦 Partager son design system (monorepo)

> 💡 **Rappel :** Un **monorepo** est un seul dépôt Git qui contient plusieurs projets. C'est comme un immeuble avec plusieurs appartements : chaque projet a son espace, mais ils partagent le même bâtiment.

Quand ton design system est utilisé par **plusieurs applications** (un site web, un back-office, une app mobile…), tu peux le publier comme un **package** :

### Structure du dossier

```
packages/
  ui/                          ← 📁 Le package du design system
    src/
      components/
        AppButton.vue          ← Composant bouton
        AppInput.vue           ← Composant input
      tokens.css               ← Variables CSS (couleurs, espaces…)
      index.ts                 ← Point d'entrée : exporte tout
    package.json               ← Identité du package (nom, version)
```

### Le fichier d'export (barrel export)

```ts
// packages/ui/src/index.ts
// Ce fichier "exporte" tous les composants du design system
// C'est le "catalogue" : il liste tout ce que le package propose

// On réexporte chaque composant pour que les autres projets puissent faire :
// import { AppButton, AppInput } from "@monrepo/ui"
export { default as AppButton } from "./components/AppButton.vue";
export { default as AppInput } from "./components/AppInput.vue";
```

> 💡 **Barrel export** = un fichier qui ne fait qu'importer et réexporter. C'est comme un **sommaire** qui dit "voici tout ce qui est disponible dans ce package".

### Le fichier package.json

```json
// packages/ui/package.json
{
  "name": "@monrepo/ui",          // Le nom du package (préfixé par @monrepo/)
  "main": "./src/index.ts",       // Le point d'entrée principal
  "exports": {
    // Quand quelqu'un fait: import { AppButton } from "@monrepo/ui"
    ".": "./src/index.ts",

    // Quand quelqu'un fait: import "@monrepo/ui/tokens.css"
    "./tokens.css": "./src/tokens.css"
  }
}
```

### Comment l'utiliser dans une autre application ?

```ts
// Dans une application qui utilise le design system
import { AppButton, AppInput } from "@monrepo/ui";  // Les composants
import "@monrepo/ui/tokens.css";                      // Les tokens CSS
```

---

## ✅ Résumé

| Concept              | C'est quoi                                                         |
| -------------------- | ------------------------------------------------------------------ |
| **Design system**    | Un guide de style + composants réutilisables pour toute l'app      |
| **Design token**     | Une variable CSS qui stocke une valeur de design (couleur, taille) |
| **Atome**            | Le plus petit composant (bouton, input, icône)                     |
| **Molécule**         | Un assemblage de quelques atomes (champ de formulaire)             |
| **Organisme**        | Un assemblage de molécules (formulaire complet, header)            |
| **Barrel export**    | Un fichier index.ts qui réexporte tout le contenu d'un package     |
| **Monorepo**         | Un seul dépôt Git avec plusieurs projets qui partagent du code     |

---

## 🎯 Pratique

### Exercice DS.1 — Design tokens

Crée des design tokens CSS pour les couleurs principales :

```css
/* tokens.css */
:root {
  /* Couleurs primaires : bleu #3b82f6, hover #2563eb */
  /* ???
  
  /* Couleurs de succès : vert #22c55e */
  /* ???
  
  /* Couleurs d'erreur : rouge #ef4444 */
  /* ???
}
```

<details>
<summary>Solution</summary>

```css
:root {
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  
  --color-success: #22c55e;
  
  --color-error: #ef4444;
}
```
</details>

---

### Exercice DS.2 — Atomic Design

Classe ces composants selon la méthodologie Atomic Design :

1. `SearchInput.vue` (input + icône loupe)
2. `Button.vue`
3. `ProductCard.vue` (image + titre + prix + bouton)
4. `Header.vue` (logo + nav + search + avatar)
5. `Icon.vue`

<details>
<summary>Solution</summary>

```
Atomes (les plus petits) :
  - Button.vue
  - Icon.vue

Molécules (assemblage d'atomes) :
  - SearchInput.vue (input + Icon)

Organismes (assemblage de molécules) :
  - ProductCard.vue (image + texte + Button)
  - Header.vue (logo + nav + SearchInput + avatar)
```
</details>

---

### Exercice DS.3 — Barrel export

Crée un barrel file pour exporter ces composants :

```
components/
  ui/
    Button.vue
    Input.vue
    Badge.vue
    index.ts    ← à créer
```

<details>
<summary>Solution</summary>

```ts
// components/ui/index.ts
export { default as Button } from './Button.vue'
export { default as Input } from './Input.vue'
export { default as Badge } from './Badge.vue'
```

Utilisation :
```ts
import { Button, Input, Badge } from '@/components/ui'
```
</details>

---

## Exercice

→ `exercices/15-storybook-ui/ENONCE.md`

## Suite

→ `cours/07-cicd/01-pipeline-ci.md`
