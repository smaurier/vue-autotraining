---
titre: Nuxt — introduction
cours: 02-vue
notions: [ce qu'apporte Nuxt sur Vue, rendu universel par défaut, structure de projet et auto-imports, nuxt.config, modes de rendu SSR SSG hybrid, moteur serveur Nitro, conventions vs configuration, différences Nuxt 3 et Nuxt 4]
outcomes:
  - sait expliquer ce que Nuxt automatise par rapport à Vue seul
  - sait lire la structure d'un projet Nuxt et le rôle des auto-imports
  - sait configurer les bases dans nuxt.config (modules, rendu)
  - sait situer les modes de rendu et le rôle de Nitro
prerequis: [24-patterns-entreprise]
next: 26-nuxt-pages-et-layouts
libs: [{ name: nuxt, version: "3" }, { name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — bootstrap de l'app Nuxt (rendu universel), comme le Front-Office Eudonet
last-reviewed: 2026-07
---

# Nuxt — introduction

> **Outcomes — tu sauras FAIRE :** expliquer ce que Nuxt automatise par rapport à Vue+Vite seul, lire une structure de projet Nuxt et identifier le rôle de chaque dossier, configurer `nuxt.config.ts` pour les cas courants (modules, rendu, runtimeConfig), situer les modes de rendu (SSR/SSG/hybrid) et le moteur Nitro.
> **Difficulté :** :star::star::star:
>
> **Portée :** ce module couvre le **bootstrap et la configuration** de Nuxt. Le routing pages/layouts, les composables Nuxt (`useFetch`, `useAsyncData`), et le server/ sont approfondis dans les modules 26–28.

---

← **Précédent :** `24-patterns-entreprise` | **Suivant :** `26-nuxt-pages-et-layouts`

---

## 1. Cas concret d'abord

Tu bootstrapes le front-office de TribuZen — la partie publique que les familles voient avant de se connecter : landing page, présentation des fonctionnalités, page tarifaire. Stack retenue : **Nuxt**.

Imagine que tu choisisses Vue 3 + Vite seul à la place. Voici ce que tu dois configurer **avant d'écrire une ligne de logique** :

```bash
# Vue 3 + Vite seul — liste des tâches manuelles
pnpm create vite tribuzen-front --template vue-ts

# 1. Installer et configurer vue-router
pnpm add vue-router
# → créer src/router/index.ts, déclarer chaque route à la main
# → enregistrer createRouter dans main.ts

# 2. Gérer le SSR pour le SEO
# → configurer vite-plugin-ssr ou passer à un setup custom
# → écrire le handler Node.js, gérer l'hydratation

# 3. Créer un backend séparé (Express/NestJS/Nitro)
# → gérer CORS, deux process en dev, deux déploiements en prod

# 4. Configurer les imports automatiques
pnpm add unplugin-auto-import unplugin-vue-components
# → configuration vite.config.ts non triviale
```

C'est 2–3 jours de setup pour les juniors. **Nuxt fait tout ça par convention.**

Dans le contexte Bedrock/Eudonet : le front-office Eudonet est une app Nuxt. Quand tu rejoins la squad Core, tu lis et modifies des fichiers `pages/`, `composables/`, `nuxt.config.ts` dès le premier jour. Ce module te donne le modèle mental pour ne pas être perdu.

---

## 2. Théorie complète, concise

### 2.1 Ce que Nuxt automatise par rapport à Vue seul

Nuxt est un **framework au-dessus de Vue 3**. Il ne remplace pas Vue — il l'orchestre, l'étend, et ajoute des couches que Vue délibérément n'inclut pas.

| Ce que tu veux | Vue 3 + Vite | Nuxt |
|---|---|---|
| Routing | `vue-router` + config manuelle | Automatique — fichiers = routes |
| Imports (`ref`, `computed`, etc.) | `import { ref } from 'vue'` à chaque fichier | Auto-importés — pas de ligne `import` |
| Rendu côté serveur | Setup Vite SSR complexe | SSR activé par défaut |
| Backend intégré | Projet séparé | Dossier `server/` dans le même repo |
| Optimisation images, SEO head | Config manuelle | Modules officiels (`@nuxt/image`, `@nuxt/seo`) |
| Déploiement multi-cible | Adapter Vite | Nitro détecte et adapte automatiquement |

> **Philosophie :** Vue te donne des **primitives** (réactivité, composants, directives). Nuxt te donne une **application** — routing, rendu, données, serveur, déploiement. Tu descends directement dans la logique produit.

### 2.2 Structure de projet Nuxt 3

```
mon-app/
├── nuxt.config.ts          ← configuration centrale
├── app.vue                 ← composant racine (remplace index.html + main.ts)
│
├── pages/                  ← routing automatique : 1 fichier = 1 route
│   ├── index.vue           →  /
│   ├── pricing.vue         →  /pricing
│   └── families/
│       ├── index.vue       →  /families
│       └── [id].vue        →  /families/:id   (route dynamique)
│
├── layouts/                ← gabarits réutilisables (header + footer + slot)
│   └── default.vue         ← layout par défaut (appliqué à toutes les pages)
│
├── components/             ← composants auto-importés (PascalCase dans templates)
│   └── AppHeader.vue       →  <AppHeader /> sans import
│
├── composables/            ← composables auto-importés
│   └── useTribuZenAuth.ts  →  const { user } = useTribuZenAuth() sans import
│
├── server/                 ← backend Nitro (API, middleware serveur)
│   └── api/
│       ├── families.get.ts →  GET /api/families
│       └── families.post.ts→  POST /api/families
│
├── middleware/             ← middleware de navigation (ex: redirection auth)
├── plugins/                ← plugins chargés au boot (ex: i18n, analytics)
├── public/                 ← fichiers statiques servis tels quels (favicon, robots.txt)
└── assets/                 ← assets traités par Vite (CSS globaux, images importées)
```

**Règle mnémotechnique :** tout ce qui est dans `pages/` est **navigable** (route), tout ce qui est dans `components/` est **réutilisable** (composant), tout ce qui est dans `server/` est **protégé** (exécuté uniquement côté serveur).

### 2.3 Auto-imports

En Vue 3 + Vite classique, chaque fichier nécessite ses imports explicites :

```ts
// Vue 3 + Vite — imports manuels à chaque fichier
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppHeader from '@/components/AppHeader.vue'
```

Avec Nuxt, tout est **auto-importé** :

```vue
<script setup lang="ts">
// Nuxt — aucun import nécessaire
const count = ref(0)                      // ref depuis Vue
const route = useRoute()                   // composable Nuxt Router
const { families } = await useFetch('/api/families')  // composable Nuxt data fetching

// Ton propre composable dans composables/ — aussi auto-importé
const { user, logout } = useTribuZenAuth()
</script>

<template>
  <!-- Composant dans components/ — auto-importé, pas d'import dans le script -->
  <AppHeader :user="user" @logout="logout" />
</template>
```

**Ce que Nuxt scanne automatiquement :**
- `composables/` — toutes les fonctions `use*` exportées (et leurs exports nommés)
- `components/` — tous les composants (sous-dossiers inclus, préfixe = chemin)
- `utils/` — toutes les fonctions utilitaires exportées
- Les primitives Vue (`ref`, `computed`, `watch`, `onMounted`…)
- Les composables Nuxt (`useFetch`, `useAsyncData`, `useRoute`, `useRuntimeConfig`…)

> **En entretien :** les auto-imports semblent "magiques" mais sont entièrement statiques — Nuxt génère un fichier `.nuxt/imports.d.ts` qui liste chaque import. L'IDE (avec `@nuxt/typescript-build`) voit tous les types. C'est du pur TypeScript sous le capot.

### 2.4 `nuxt.config.ts` — les bases

`defineNuxtConfig` est la fonction de configuration centrale. Elle est elle-même auto-importée dans `nuxt.config.ts`.

```ts
// nuxt.config.ts — configuration minimale commentée
export default defineNuxtConfig({
  // Compatibilité TypeScript stricte — toujours activer
  typescript: {
    strict: true,
  },

  // Modules Nuxt — extensions officielles ou community
  // Chaque module modifie nuxt.config et ajoute ses propres auto-imports
  modules: [
    '@pinia/nuxt',           // state management
    '@nuxt/image',           // optimisation images
    '@nuxtjs/tailwindcss',   // CSS utility-first
  ],

  // Rendu côté serveur — true par défaut
  // false = SPA (comme Vue + Vite seul, pas de SSR)
  ssr: true,

  // Nitro — moteur serveur (configuration avancée, survol ici)
  nitro: {
    // Cible de déploiement : node-server (défaut), cloudflare, vercel, etc.
    preset: 'node-server',
  },

  // Variables d'environnement accessibles dans l'app
  runtimeConfig: {
    // Côté serveur uniquement (jamais envoyé au client)
    jwtSecret: process.env.JWT_SECRET,

    // Côté client ET serveur (visible dans le bundle client — jamais de secrets)
    public: {
      apiBase: process.env.API_BASE ?? '/api',
      appName: 'TribuZen',
    },
  },

  // Règles de rendu par route — mode hybrid (survol, détail module 27)
  routeRules: {
    '/':            { prerender: true },   // SSG : pré-rendue au build
    '/dashboard/**': { ssr: false },       // SPA : client-side uniquement
    '/blog/**':     { isr: 3600 },        // ISR : regénérée toutes les heures
  },
})
```

> **`routeRules` en survol :** ce mécanisme permet d'adopter des modes de rendu différents **par route** dans la même app. C'est le mode hybrid. Il est couvert en détail au module 27.

### 2.5 Modes de rendu

Nuxt supporte 4 modes, configurables globalement ou par route :

**SSR — Server-Side Rendering (défaut)**

Le serveur génère le HTML complet à chaque requête. Le navigateur reçoit une page déjà construite, puis Vue "hydrate" (reprend le contrôle) côté client.

- Bonne SEO : les crawlers lisent le HTML directement
- First Contentful Paint rapide
- Requiert un serveur Node.js en production
- `ssr: true` (c'est le défaut — pas besoin de l'écrire)

**SPA — Single Page Application**

Comportement identique à Vue + Vite : le navigateur reçoit une page vide, JavaScript construit tout.

```ts
// nuxt.config.ts
export default defineNuxtConfig({ ssr: false })
```

- Idéal pour les dashboards sans SEO
- Hébergeable sur CDN (pas de serveur Node.js)
- Mauvaise SEO (page vide au crawl)

**SSG — Static Site Generation**

Toutes les pages sont générées au build. Résultat : dossier `.output/public/` avec des fichiers HTML statiques.

```bash
# Génère les fichiers statiques
npx nuxi generate
```

- Ultra rapide — pas de serveur, CDN pur
- Idéal pour landing pages, documentation, blog sans contenu dynamique
- Contenu figé au build (une mise à jour = un nouveau build)

**ISR — Incremental Static Regeneration**

Hybride entre SSG et SSR : la page est pré-générée puis regénérée automatiquement après X secondes.

```ts
routeRules: {
  '/blog/**': { isr: 3600 }, // regénérée toutes les heures
}
```

**Tableau de décision :**

| Mode | SEO | Serveur requis | Contenu dynamique | Cas TribuZen |
|---|---|---|---|---|
| SSR | ✅ | ✅ Oui | ✅ À chaque requête | Pages familles, profils |
| SPA | ❌ | ❌ Non | ✅ Côté client | Dashboard admin |
| SSG | ✅ | ❌ Non | ❌ Figé au build | Landing, pricing |
| ISR | ✅ | ✅ Oui | ✅ Période configurable | Blog, documentation |

### 2.6 Nitro — le moteur serveur

**Nitro** est le moteur qui alimente le layer serveur de Nuxt. Il n'est pas Nuxt lui-même — c'est une dépendance séparée (`unjs/nitro`) que Nuxt embarque.

Ce que Nitro fait :

1. **Sert les routes SSR** — reçoit les requêtes HTTP, exécute Vue server-side, envoie le HTML
2. **Expose les endpoints `server/api/`** — chaque fichier `server/api/foo.get.ts` devient `GET /api/foo`
3. **Adapte le déploiement** — un seul codebase déploie sur Node.js, Vercel Edge, Cloudflare Workers, Netlify, Docker, AWS Lambda… sans changement de code (`nitro.preset`)
4. **Gère le cache** — ISR, stale-while-revalidate, storage adapters (Redis, KV Cloudflare, mémoire)

```ts
// server/api/families.get.ts — un endpoint Nitro minimal
export default defineEventHandler(async (event) => {
  // Tout ici s'exécute UNIQUEMENT côté serveur
  // Accès à la base de données, variables d'env privées, etc.
  const families = await db.family.findMany()
  return families  // Nitro sérialise en JSON automatiquement
})
```

```vue
<!-- pages/index.vue — consomme l'endpoint via useFetch (auto-importé) -->
<script setup lang="ts">
const { data: families } = await useFetch('/api/families')
</script>
```

> **Point clé :** le code dans `server/` ne touche **jamais** le bundle client. Nuxt garantit l'isolation par design. Tu peux y mettre des secrets, des connexions DB, des logiques propriétaires — rien ne fuite.

Nitro expose aussi des **Server Utils** auto-importés dans `server/` : `defineEventHandler`, `getQuery`, `readBody`, `createError`, `setCookie`, `getHeader`…

### 2.7 Convention over configuration

Le principe fondateur de Nuxt est hérité de Rails/Laravel : **la structure des fichiers remplace la configuration explicite**.

Exemples concrets :

| Convention Nuxt | Ce que ça remplace |
|---|---|
| `pages/about.vue` existe | `{ path: '/about', component: About }` dans vue-router |
| Fichier `composables/useFoo.ts` | `import { useFoo } from '@/composables/useFoo'` dans chaque fichier |
| `server/api/users.get.ts` | Route Express `app.get('/api/users', handler)` + serveur séparé |
| `layouts/default.vue` | Wrapper manuel dans `App.vue` avec `<router-view>` |
| `middleware/auth.ts` | Garde de navigation `router.beforeEach(...)` dans vue-router |
| `[id].vue` dans `pages/` | Route dynamique `:id` dans la config vue-router |

> **Ce que ça change pour toi en équipe :** un dev qui rejoint un projet Nuxt sait exactement où chercher chaque type de code. La convention est la documentation implicite. Chez Bedrock, tous les projets Nuxt suivent ces conventions — lire le code d'un collègue est immédiat.

### 2.8 Nuxt 3 → Nuxt 4 : les vraies différences

Nuxt 4 est sorti en 2025. Les différences avec Nuxt 3 sont **confirmées via la documentation officielle Context7** (docs nuxt.com/4.x).

#### Différence 1 — Nouvelle structure de dossiers (`app/`)

**Nuxt 3 (défaut actuel) :**
```
pages/
components/
composables/
layouts/
middleware/
plugins/
app.vue
nuxt.config.ts
server/
public/
```

**Nuxt 4 (nouvelle structure par défaut) :**
```
app/                        ← NOUVEAU : tout le code app est dans app/
  pages/
  components/
  composables/
  layouts/
  middleware/
  plugins/
  utils/
  app.vue
  app.config.ts
  router.options.ts
shared/                     ← NOUVEAU : types et utils partagés app ↔ server
  types/
  utils/
server/                     ← inchangé (toujours à la racine)
public/                     ← inchangé
nuxt.config.ts              ← inchangé
```

Rétrocompatibilité : si Nuxt 4 détecte une structure Nuxt 3 (fichiers à la racine), il continue de l'utiliser sans erreur. La migration peut être progressive.

Pour tester les comportements Nuxt 4 dans un projet Nuxt 3 actuel :

```ts
// nuxt.config.ts — opt-in aux comportements Nuxt 4 dans Nuxt 3
export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
})
```

#### Différence 2 — Data fetching : `shallowRef` au lieu de `ref`

**Nuxt 3 :**
```ts
const { data: families } = await useFetch('/api/families')
// data est un Ref<Family[]> — réactivité profonde (deep)
// families.value[0].name = 'Alice' → Vue détecte le changement
```

**Nuxt 4 :**
```ts
const { data: families } = await useFetch('/api/families')
// data est un ShallowRef<Family[]> — réactivité superficielle (shallow)
// families.value[0].name = 'Alice' → Vue NE DÉTECTE PAS le changement

// ✅ Pour déclencher une mise à jour, remplacer l'objet entier :
families.value = [...families.value]  // force la réactivité
// ou utiliser triggerRef(families)
```

Ce changement améliore significativement les performances pour les gros datasets (listes de familles, messages, etc.) mais casse les patterns qui mutaient les données en place.

#### Différence 3 — Refs partagées pour la même clé

En Nuxt 4, tous les appels `useFetch`/`useAsyncData` avec la **même clé** partagent le même `data`, `error`, et `status`. Ce n'était pas le cas en Nuxt 3.

```ts
// Nuxt 4 — ces deux appels partagent exactement les mêmes refs
const { data: a } = await useFetch('/api/families', { key: 'families' })
const { data: b } = await useFetch('/api/families', { key: 'families' })
// a === b — même ShallowRef, pas deux copies
```

#### Différence 4 — Clés réactives

```ts
// Nuxt 4 — la clé peut être un ref ou un computed
const page = ref(1)
const { data } = await useFetch('/api/families', {
  key: () => `families-page-${page.value}`,  // getter réactif
  // → refetch automatique quand page.value change
})
```

En Nuxt 3, les clés étaient des strings statiques — le refetch sur changement de paramètre nécessitait un `watch` manuel.

#### Différence 5 — Nettoyage des données au démontage

En Nuxt 4, quand le dernier composant utilisant une clé `useAsyncData` est démonté, Nuxt supprime les données du cache interne. Cela évite les fuites mémoire sur les longues sessions (SPA avec navigation fréquente).

---

## 3. Worked examples

### Exemple 1 — `nuxt.config.ts` du front-office TribuZen (minimal, commenté)

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  // TypeScript strict — obligatoire pour TribuZen
  typescript: {
    strict: true,
  },

  // Modules officiels — installés au préalable avec pnpm add
  modules: [
    '@pinia/nuxt',       // state management (module 29)
    '@nuxt/image',       // optimisation images pour la landing
  ],

  // SSR activé (c'est le défaut, mais le rendre explicite pour la lisibilité)
  ssr: true,

  // Variables exposées à l'app
  runtimeConfig: {
    // Privé : jamais dans le bundle client
    databaseUrl: process.env.DATABASE_URL,

    // Public : visible côté client — ne jamais y mettre de secrets
    public: {
      apiBase: process.env.API_BASE ?? '/api',
      appVersion: '0.1.0',
    },
  },

  // Hybrid : landing en SSG, dashboard en SPA
  routeRules: {
    '/':          { prerender: true },
    '/pricing':   { prerender: true },
    '/dashboard/**': { ssr: false },
  },
})
```

### Exemple 2 — Page d'accueil TribuZen avec SSR et useFetch

Structure (Nuxt 3) :

```
pages/
  index.vue
composables/
  useTribuZenStats.ts
```

```ts
// composables/useTribuZenStats.ts
// Auto-importé partout — aucun import manuel nécessaire dans les pages
export function useTribuZenStats() {
  // useRuntimeConfig est auto-importé depuis Nuxt
  const config = useRuntimeConfig()

  const { data: stats, status } = useFetch<{ familyCount: number; memberCount: number }>(
    `${config.public.apiBase}/stats`,
    {
      // En Nuxt 4 : data est un ShallowRef — ne muter que via remplacement
      default: () => ({ familyCount: 0, memberCount: 0 }),
    }
  )

  return { stats, status }
}
```

```vue
<!-- pages/index.vue — page d'accueil TribuZen -->
<script setup lang="ts">
// useTribuZenStats est auto-importé depuis composables/
const { stats, status } = await useTribuZenStats()

// useHead est un composable Nuxt pour le SEO — auto-importé
useHead({
  title: 'TribuZen — votre espace famille',
  meta: [
    { name: 'description', content: 'Organisez et partagez les moments de famille.' },
  ],
})
</script>

<template>
  <main>
    <h1>Bienvenue sur TribuZen</h1>

    <!-- status : 'idle' | 'pending' | 'success' | 'error' -->
    <div v-if="status === 'pending'">Chargement…</div>

    <div v-else-if="stats">
      <p>{{ stats.familyCount }} familles nous font confiance</p>
      <p>{{ stats.memberCount }} membres actifs</p>
    </div>

    <!-- NuxtLink remplace <router-link> — auto-importé -->
    <NuxtLink to="/pricing">Voir les tarifs</NuxtLink>
  </main>
</template>
```

**Ce que SSR produit :** quand un crawler Google accède à `/`, il reçoit directement :

```html
<main>
  <h1>Bienvenue sur TribuZen</h1>
  <p>142 familles nous font confiance</p>
  <p>587 membres actifs</p>
  <a href="/pricing">Voir les tarifs</a>
</main>
```

Le HTML est indexable immédiatement. Avec Vue + Vite seul (CSR), le crawler voit une page vide jusqu'à ce que JavaScript s'exécute.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Croire que `<script setup>` s'exécute uniquement côté client

```vue
<!-- pages/profile.vue -->
<script setup lang="ts">
// ⚠️ Ce code s'exécute DEUX FOIS en SSR :
// 1. Côté serveur (Node.js) lors du rendu initial
// 2. Côté client (navigateur) lors de l'hydratation

// ❌ Accéder à window, document, localStorage directement — erreur en SSR
const saved = localStorage.getItem('theme')  // ReferenceError: localStorage is not defined

// ✅ Utiliser onMounted (s'exécute uniquement côté client)
import { onMounted } from 'vue'
onMounted(() => {
  const saved = localStorage.getItem('theme')
})

// ✅ Ou vérifier process.client (Nuxt)
if (process.client) {
  const saved = localStorage.getItem('theme')
}
```

Ce piège touche aussi : `window`, `document`, `navigator`, les APIs Web Storage, IndexedDB, DOM APIs en général.

### PIÈGE #2 — Importer manuellement ce que Nuxt auto-importe

```vue
<!-- ❌ Imports inutiles — Nuxt les gère -->
<script setup lang="ts">
import { ref, computed } from 'vue'          // auto-importé
import { useRoute } from 'vue-router'         // auto-importé
import { useFetch } from '#app'               // auto-importé
import AppHeader from '@/components/AppHeader.vue'  // auto-importé

// ✅ En Nuxt : écrire directement sans imports
const route = useRoute()
const count = ref(0)
</script>

<template>
  <AppHeader />  <!-- auto-importé -->
</template>
```

Les imports manuels ne cassent pas l'app, mais ils sont redondants et peuvent créer des confusions en équipe sur ce qui "vient de Nuxt" vs ce qu'on a importé.

### PIÈGE #3 — Mélanger les conventions Nuxt 3 et Nuxt 4

```
❌ Structure hybride — ne pas faire ça :
app/
  pages/         ← style Nuxt 4
pages/           ← style Nuxt 3 (au root)
  index.vue
```

Nuxt 4 utilise **soit** la structure racine (compatibilité Nuxt 3), **soit** la structure `app/`. Pas les deux. Si `app/pages/` et `pages/` coexistent, le comportement est indéfini.

En migration progressive : activer `future.compatibilityVersion: 4` dans nuxt.config, puis déplacer **tout** `pages/` vers `app/pages/` en une seule fois.

### PIÈGE #4 — Muter les données de `useFetch` en place (Nuxt 4)

```ts
// ❌ Nuxt 4 : data est un ShallowRef — muter une propriété imbriquée = pas de réactivité
const { data: families } = await useFetch('/api/families')

families.value[0].name = 'Alice'  // Vue ne voit pas ce changement !

// ✅ Remplacer l'objet entier pour déclencher la réactivité
families.value = families.value.map((f, i) =>
  i === 0 ? { ...f, name: 'Alice' } : f
)

// ✅ Ou utiliser triggerRef si le remplacement est impossible
import { triggerRef } from 'vue'
families.value[0].name = 'Alice'
triggerRef(families)
```

Ce piège est spécifique à Nuxt 4 — en Nuxt 3, `data` était un `ref` profond et la mutation directe fonctionnait.

### PIÈGE #5 — Mettre des secrets dans `runtimeConfig.public`

```ts
// ❌ runtimeConfig.public est inclus dans le bundle client — visible par tous
runtimeConfig: {
  public: {
    stripeSecretKey: process.env.STRIPE_SECRET,  // DANGER : fuite en prod
  },
}

// ✅ Les secrets vont dans le niveau racine (serveur seulement)
runtimeConfig: {
  stripeSecretKey: process.env.STRIPE_SECRET,  // serveur uniquement
  public: {
    stripePublishableKey: process.env.STRIPE_PK,  // clé publique OK côté client
  },
}
```

---

## 5. Ancrage TribuZen

Le front-office TribuZen est l'application directe de ce module. La structure cible (Nuxt 4) :

```
tribuzen/
  app/
    pages/
      index.vue          ← Landing — SSG (prerender: true dans routeRules)
      pricing.vue        ← Tarifs — SSG
      families/
        index.vue        ← Liste familles — SSR
        [id].vue         ← Détail famille — SSR
    layouts/
      default.vue        ← Header + Footer communs
    components/
      AppHeader.vue
      AppFooter.vue
    composables/
      useTribuZenAuth.ts
      useFamilies.ts
    app.vue
  server/
    api/
      families.get.ts
      stats.get.ts
  nuxt.config.ts
```

**Parallèle Eudonet :** le front-office Eudonet suit exactement cette convention Nuxt. Quand tu modifies une page Eudonet, tu travailles dans `app/pages/` (Nuxt 4) ou `pages/` (Nuxt 3) selon la version du projet. La logique est identique — seule la localisation des fichiers change.

Les `routeRules` TribuZen :
- `/` et `/pricing` → `prerender: true` (SSG, hébergeable sur CDN, SEO maximal)
- `/families/**` → SSR par défaut (contenu dynamique par famille)
- `/dashboard/**` → `ssr: false` (backoffice admin, pas de SEO requis)

---

## 6. Points clés

1. Nuxt est un framework **au-dessus de Vue 3** — il ajoute routing, SSR, auto-imports, backend intégré. Il ne remplace pas Vue, il l'orchestre.
2. La **convention over configuration** : la structure des fichiers remplace la configuration explicite (fichier dans `pages/` = route, fichier dans `composables/` = auto-import).
3. Les **auto-imports** couvrent : primitives Vue (`ref`, `computed`…), composables Nuxt (`useFetch`, `useRoute`…), tes propres composables et composants — sans aucun `import` à écrire.
4. `nuxt.config.ts` centralise modules, rendu (ssr), runtimeConfig et routeRules.
5. **4 modes de rendu :** SSR (défaut, SEO + dynamique), SPA (`ssr: false`, dashboard), SSG (`nuxi generate`, statique), ISR (`isr: N`, hybride).
6. **Nitro** est le moteur serveur de Nuxt — il fait tourner le SSR, expose `server/api/`, et adapte le déploiement (Node, Vercel, Cloudflare…) via `nitro.preset`.
7. **Nuxt 4** : nouvelle structure `app/` pour le code applicatif ; `server/` et `nuxt.config.ts` restent à la racine. Migration activable dans Nuxt 3 via `future: { compatibilityVersion: 4 }`.
8. **Nuxt 4 data fetching :** `data` de `useFetch`/`useAsyncData` est un `shallowRef` — ne pas muter les propriétés imbriquées directement, remplacer l'objet entier.
9. **Piège SSR #1 :** le `<script setup>` s'exécute côté serveur ET client — les APIs browser (`window`, `localStorage`) échouent côté serveur. Utiliser `onMounted` ou `process.client`.

---

## 7. Seeds Anki

```
Qu'est-ce que Nuxt ajoute à Vue 3 que Vue seul ne fournit pas ?|Routing automatique par fichiers, SSR activé par défaut, auto-imports (composants + composables + primitives Vue), backend intégré (server/), moteur de déploiement multi-cible (Nitro).
Quel est le rôle du dossier server/ dans un projet Nuxt ?|Contient le backend Nitro : endpoints API (server/api/*.ts), middleware serveur, plugins serveur. Ce code s'exécute uniquement côté serveur — jamais inclus dans le bundle client. Isolation garantie par Nuxt.
Comment Nuxt sait-il quoi auto-importer dans les composants ?|Il scanne components/, composables/, utils/ au démarrage et génère .nuxt/imports.d.ts. L'IDE voit tous les types. Les primitives Vue (ref, computed…) et composables Nuxt (useFetch, useRoute…) sont aussi auto-importées.
Quelle est la différence entre SSR, SSG et SPA dans Nuxt ?|SSR : serveur génère HTML à chaque requête (SEO + dynamique). SSG : pages générées au build une seule fois (statique, CDN). SPA : navigateur génère tout (ssr: false, comme Vue+Vite). ISR : SSG + regénération automatique après N secondes.
Quel est le rôle de Nitro dans Nuxt ?|Moteur serveur qui fait tourner le SSR, expose les routes server/api/, gère le cache ISR, et adapte le déploiement via nitro.preset (node-server, vercel, cloudflare-pages, netlify…).
Quelle est la principale différence de structure entre Nuxt 3 et Nuxt 4 ?|Nuxt 4 regroupe tout le code app dans un dossier app/ (pages/, components/, composables/, layouts/, app.vue…). server/ et nuxt.config.ts restent à la racine. Un dossier shared/ est ajouté pour les types partagés app/server.
Pourquoi data de useFetch est-il un shallowRef en Nuxt 4 et qu'est-ce que ça implique ?|Performance : évite la réactivité profonde sur les gros datasets. Implication : muter une propriété imbriquée (data.value[0].name = 'Alice') ne déclenche pas de mise à jour Vue. Corriger en remplaçant l'objet entier ou avec triggerRef(data).
Pourquoi accéder à localStorage directement dans <script setup> plante-t-il en SSR Nuxt ?|<script setup> s'exécute côté serveur (Node.js) ET côté client. localStorage n'existe pas dans Node — ReferenceError. Corriger avec onMounted (client uniquement) ou if (process.client).
```

---

## Pont vers le lab

> Lab associé : `labs/lab-25-nuxt-introduction/README.md`. Tu bootstrapes le front-office TribuZen comme une vraie app Nuxt — `nuxi init`, `nuxt.config.ts` configuré, première page SSR, composable auto-importé. L'oracle de validation : `view-source` sur `localhost:3000` doit montrer le HTML rendu (pas une page vide).
