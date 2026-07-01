# Lab 25 — Nuxt introduction

> **Outcome :** à la fin, tu sais initialiser un projet Nuxt, configurer `nuxt.config.ts` (modules, rendu, runtimeConfig), créer une première page SSR, et vérifier que le rendu serveur fonctionne (HTML non vide dans `view-source`).
> **Vrai outil :** Nuxt (nuxi) + navigateur (vérification `view-source`) + TypeScript strict.
> **Feedback :** le coach valide `view-source:http://localhost:3000` en session — le HTML de la page doit être présent dans la source, pas un `<div id="__nuxt"></div>` vide.

---

## Énoncé

Tu bootstrapes le front-office TribuZen comme une vraie application Nuxt. Cahier des charges :

1. Initialiser un projet Nuxt avec `nuxi init` (TypeScript, pnpm).
2. Configurer `nuxt.config.ts` : TypeScript strict, `runtimeConfig` avec une variable publique `appName`, `routeRules` qui pré-rend `/` en SSG et passe `/dashboard/**` en SPA.
3. Créer `pages/index.vue` : une page d'accueil TribuZen avec un titre `h1`, un compteur `ref`, et un affichage de `config.public.appName` via `useRuntimeConfig()` — le tout **sans aucun import manuel** (auto-imports Nuxt).
4. Créer `composables/useGreeting.ts` : un composable qui retourne un message de bienvenue personnalisé, auto-importé dans `pages/index.vue` **sans ligne `import`**.
5. Vérifier avec `view-source:http://localhost:3000` que le HTML est rendu côté serveur (le `h1` et le message sont visibles dans la source).

**Aucun gap-fill.** Tu écris tout à partir du starter minimal ci-dessous.

### Starter minimal

```bash
# Dans le dossier où tu travailles (ex: ~/projects/)
npx nuxi@latest init tribuzen-front
cd tribuzen-front
pnpm install
pnpm dev
```

Le projet démarre sur `http://localhost:3000`. Tu pars de ce projet vierge.

---

## Étapes (en friction)

1. **Configure `nuxt.config.ts`** — ajoute `typescript: { strict: true }`, `runtimeConfig: { public: { appName: 'TribuZen' } }`, et `routeRules: { '/': { prerender: true }, '/dashboard/**': { ssr: false } }`. Lance `pnpm dev` et vérifie qu'il n'y a pas d'erreur au démarrage.

2. **Crée `pages/index.vue`** — le fichier `app.vue` par défaut de nuxi remplace la page. Crée `pages/index.vue` et ajuste `app.vue` pour utiliser `<NuxtPage />` (qui affiche la page courante). Dans `pages/index.vue`, écris un `<script setup lang="ts">` **sans aucun `import`** : déclare `const count = ref(0)` et `const config = useRuntimeConfig()`.

3. **Écris le template** — affiche `config.public.appName` dans un `h1`, le compteur dans un `p`, et un bouton `+1` qui incrémente `count` avec `@click`.

4. **Crée `composables/useGreeting.ts`** — exporte une fonction `useGreeting(name: string)` qui retourne `{ message: computed(() => 'Bienvenue, ' + name + ' !') }`. Utilise `ref` ou `computed` sans `import`.

5. **Utilise `useGreeting` dans `pages/index.vue`** — appelle `const { message } = useGreeting('TribuZen')` sans ligne `import`. Affiche `message` dans le template.

6. **Vérifie le SSR** — dans Chrome/Firefox, `Clic droit → Afficher la source` sur `localhost:3000`. Le code source HTML doit contenir le texte `TribuZen` et `Bienvenue, TribuZen !` — pas `<div id="__nuxt"></div>` vide.

7. **Vérifie les auto-imports** — supprime temporairement toutes les lignes `import` de `pages/index.vue` et de `composables/useGreeting.ts`. Le projet doit continuer de fonctionner sans erreur. `pnpm build` ne doit pas échouer.

---

## Corrigé complet commenté

### `nuxt.config.ts`

```ts
// nuxt.config.ts
// defineNuxtConfig est lui-même auto-importé dans nuxt.config.ts — pas d'import nécessaire
export default defineNuxtConfig({
  // TypeScript strict dans les composants et les composables
  // Équivalent de "strict: true" dans tsconfig, appliqué par Nuxt partout
  typescript: {
    strict: true,
  },

  // SSR activé par défaut — on le rend explicite pour la lisibilité en équipe
  ssr: true,

  // Variables d'environnement accessibles dans l'app
  runtimeConfig: {
    // Niveau racine : côté serveur uniquement (jamais dans le bundle client)
    // Ex: databaseUrl: process.env.DATABASE_URL
    //
    // Niveau public : visible côté client ET serveur (ne jamais y mettre de secrets)
    public: {
      appName: process.env.APP_NAME ?? 'TribuZen',
    },
  },

  // Règles de rendu par route — mode hybrid
  routeRules: {
    // '/' est pré-rendue au build (SSG) : idéal pour la landing page
    // Elle sera dans .output/public/index.html — pas de serveur requis pour la servir
    '/': { prerender: true },

    // '/dashboard/**' désactive le SSR : comportement identique à Vue + Vite seul
    // Pas de rendu serveur → pas de SEO, mais pas de serveur Node.js requis
    '/dashboard/**': { ssr: false },
  },
})
```

### `app.vue`

```vue
<!-- app.vue — composant racine -->
<!-- NuxtPage affiche le composant correspondant à l'URL courante -->
<!-- Sans NuxtPage, les fichiers dans pages/ ne seraient jamais affichés -->
<template>
  <div>
    <NuxtPage />
  </div>
</template>
```

### `composables/useGreeting.ts`

```ts
// composables/useGreeting.ts
// Nuxt scanne ce dossier au démarrage et auto-importe toutes les exports nommées
// Pas besoin d'écrire "import { computed } from 'vue'" — Nuxt le gère

export function useGreeting(name: string) {
  // computed est auto-importé depuis Vue par Nuxt
  const message = computed(() => `Bienvenue, ${name} !`)

  // On retourne un objet pour permettre la déstructuration côté appelant
  // { message } = useGreeting('Alice') → message est un ComputedRef<string>
  return { message }
}
```

### `pages/index.vue`

```vue
<!-- pages/index.vue — page d'accueil TribuZen -->
<script setup lang="ts">
// Aucun import — tout est auto-importé par Nuxt :
//   ref          ← depuis Vue
//   useRuntimeConfig ← composable Nuxt
//   useGreeting  ← depuis composables/useGreeting.ts

// Accès aux variables runtimeConfig.public
// En SSR : disponible côté serveur ET client
const config = useRuntimeConfig()

// Compteur local — ref est auto-importé depuis Vue
const count = ref(0)

// Composable auto-importé — pas de ligne import
const { message } = useGreeting('TribuZen')

// useHead gère le <title> et les <meta> pour le SEO
// Fonctionne côté serveur (SSR) → le titre est dans le HTML source
useHead({
  title: `${config.public.appName} — votre espace famille`,
  meta: [
    {
      name: 'description',
      content: 'Organisez et partagez les moments de famille avec TribuZen.',
    },
  ],
})
</script>

<template>
  <main>
    <!-- config.public.appName est disponible dans le template SSR -->
    <!-- Vue auto-escape les interpolations — XSS safe -->
    <h1>{{ config.public.appName }}</h1>

    <!-- message est un ComputedRef<string> — auto-unwrap dans le template -->
    <p>{{ message }}</p>

    <!-- Compteur côté client — interactif après hydratation -->
    <p>Compteur : {{ count }}</p>

    <!-- @click — raccourci v-on:click — expression inline simple -->
    <button type="button" @click="count++">+1</button>

    <!-- NuxtLink remplace <router-link> — auto-importé -->
    <!-- href est géré par vue-router, pas de rechargement de page -->
    <NuxtLink to="/pricing">Voir les tarifs</NuxtLink>
  </main>
</template>
```

**Vérification `view-source` — ce que tu dois voir (extrait) :**

```html
<title>TribuZen — votre espace famille</title>
...
<h1>TribuZen</h1>
<p>Bienvenue, TribuZen !</p>
<p>Compteur : 0</p>
<button type="button">+1</button>
```

Si tu vois `<div id="__nuxt"></div>` vide dans la source, SSR n'est pas actif. Vérifie que `ssr: true` est dans `nuxt.config.ts` et que tu n'as pas désactivé le SSR accidentellement.

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — en 30 minutes, sans ouvrir ce corrigé :**

1. Ajoute une deuxième page `pages/pricing.vue` avec un titre `h1` "Tarifs TribuZen" et une liste statique de 3 offres (nom + prix). Navigue entre `/` et `/pricing` avec `<NuxtLink>`.
2. Crée `layouts/default.vue` avec un header commun (`<header><nav>…</nav></header>`) et un `<slot />` pour le contenu de la page. Assure-toi que les deux pages utilisent ce layout.
3. Dans `nuxt.config.ts`, ajoute `/pricing` aux routes pré-rendues (`prerender: true`). Lance `npx nuxi generate` et vérifie que `.output/public/` contient `index.html` et `pricing/index.html`.

**Critère de réussite :** `npx nuxi generate` se termine sans erreur, les deux fichiers HTML générés contiennent le contenu visible (pas juste le shell JS).

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, le bootstrap Nuxt vit ici :

```
tribuzen/
  app/                          ← structure Nuxt 4 (si compatibilityVersion: 4)
    pages/
      index.vue                 ← landing — prerender: true
      pricing.vue
    composables/
      useGreeting.ts
    app.vue
  nuxt.config.ts
```

**Différences par rapport au lab :**

- La structure sera Nuxt 4 (`app/pages/` au lieu de `pages/`) une fois `future.compatibilityVersion: 4` activé.
- `useRuntimeConfig().public.appName` viendra de la vraie variable d'env (`.env` fichier, non committé).
- Le layout `default.vue` inclura le vrai `AppHeader.vue` avec navigation et auth state (modules 26–29).
- `useFetch('/api/stats')` remplacera le compteur statique — les données viendront du vrai backend Nitro.

**Commit cible :**
```
feat(front): bootstrap Nuxt — landing SSR, routing auto, auto-imports, runtimeConfig
```
