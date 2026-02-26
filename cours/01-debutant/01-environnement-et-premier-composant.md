# 01 — Environnement et premier composant

## Ce qu'on installe

| Outil             | Role                                     |
| ----------------- | ---------------------------------------- |
| **Node.js** (LTS) | Runtime JavaScript                       |
| **pnpm**          | Gestionnaire de paquets (rapide, strict) |
| **Vite**          | Bundler ultra-rapide pour le dev         |
| **VS Code**       | Editeur avec extension Vue - Official    |

## Creer un projet Vue 3 + TypeScript

```bash
pnpm create vue@latest mon-projet
# Choisis : TypeScript ✅, ESLint ✅, Prettier ✅
cd mon-projet
pnpm install
pnpm dev
```

Dans ce parcours, le projet est déjà créé. Lance :

```bash
pnpm install
pnpm dev
```

## Structure d'un projet Vue 3

```
index.html        ← point d'entree HTML
src/
  main.ts         ← bootstrap de l'app
  App.vue         ← composant racine
  style.css       ← styles globaux
vite.config.ts    ← config Vite
tsconfig.json     ← config TypeScript
```

## Anatomie d'un composant Vue (SFC)

Un fichier `.vue` = **Single File Component** (SFC). 3 blocs :

```vue
<script setup lang="ts">
// Logique (TypeScript)
import { ref } from "vue";

const message = ref<string>("Bonjour Vue 3 !");
</script>

<template>
  <!-- HTML reactif -->
  <h1>{{ message }}</h1>
</template>

<style scoped>
/* CSS scope au composant */
h1 {
  color: #42b883;
}
</style>
```

### `<script setup lang="ts">`

- `setup` : syntaxe simplifiee de la Composition API
- `lang="ts"` : active TypeScript
- Tout ce que tu declares ici est disponible dans `<template>`

### `<template>`

- HTML avec syntaxe Vue (directives, interpolation `{{ }}`)
- Un seul élément racine n'est plus obligatoire (Vue 3 supporte les fragments)

### `<style scoped>`

- `scoped` : les styles ne s'appliquent qu'a ce composant
- Évite les conflits CSS entre composants

## Le fichier `main.ts`

```ts
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
```

1. `createApp(App)` : créé l'application
2. `.mount('#app')` : injecte dans le DOM (l'élément `<div id="app">` dans `index.html`)

## Interpolation `{{ }}`

Affiche une expression JavaScript dans le template :

```vue
<template>
  <p>{{ 1 + 1 }}</p>
  <!-- 2 -->
  <p>{{ message }}</p>
  <!-- valeur de message -->
  <p>{{ message.toUpperCase() }}</p>
  <!-- BONJOUR -->
</template>
```

## Commandes utiles

```bash
pnpm dev        # lance le serveur de dev (HMR)
pnpm build      # compile pour la production
pnpm typecheck  # verifie les types sans compiler
```

## Exercice

→ `exercices/01-compteur-reactif/ENONCE.md`

## Suite

→ `cours/01-debutant/02-template-et-directives.md`
