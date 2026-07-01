---
titre: SSR et hydration
cours: 02-vue
notions: [rendu côté serveur vs côté client, cycle SSR renderToString, hydration et hydration mismatch, code universel isomorphe, pièges accès window et document, état sérialisé serveur vers client, SSR vs SSG vs CSR, Suspense et données async au SSR, préparation à Nuxt]
outcomes:
  - sait expliquer ce que le serveur rend et ce que le client hydrate
  - sait éviter et diagnostiquer un hydration mismatch
  - sait écrire du code universel (garder l'accès window côté client)
  - sait choisir entre SSR, SSG et CSR selon le besoin
prerequis: [21-performance]
next: 23-architecture-front
libs: [{ name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — rendu SSR des pages publiques (comme le Front-Office Eudonet), éviter les mismatches d'hydratation sur le contenu dynamique
last-reviewed: 2026-07
---

# SSR et hydration

> **Outcomes — tu sauras FAIRE :** expliquer le cycle serveur→client (renderToString → HTML → hydration), écrire du code universel sans crash côté serveur, reproduire et corriger un hydration mismatch, choisir entre SSR/SSG/CSR selon le contexte projet.
> **Difficulté :** :star::star::star::star:

---

## 1. Cas concret d'abord

Tu rejoins la squad Core de Bedrock. Leur client vient de se plaindre : la page catalogue produits ne remonte pas dans Google, et sur mobile 3G, l'utilisateur voit une page blanche pendant 4 secondes. Le ticket dit : *"SSR à activer sur le front Vue — même problème qu'on avait sur Eudonet"*.

**Le diagnostic avant de toucher le code :**

Ouvre l'onglet Network (Slow 3G simulé), navigue vers `/catalogue`. Tu vois :

```
GET /catalogue → 200 OK
Content-Type: text/html
Body:
  <div id="app"></div>   ← page blanche. Le HTML est vide.
```

Le SEO bot de Google reçoit exactement ça. Il n'exécute pas JavaScript. Il indexe une page vide.

**Ce que tu vas construire dans ce module :**

```
GET /catalogue → 200 OK
Content-Type: text/html
Body:
  <div id="app">
    <h1>Catalogue</h1>
    <ul><li>Produit A — 29€</li><li>Produit B — 49€</li></ul>
  </div>
  <script>window.__INITIAL_STATE__ = {"products":[...]}</script>
```

L'utilisateur voit le contenu immédiatement. Google lit le HTML complet. Le JavaScript arrive ensuite et rend la page interactive — c'est l'**hydration**.

Ce module te donne les outils pour comprendre ce mécanisme, l'implémenter en Vue 3 brut, et le porter sur Nuxt.

---

## 2. Théorie complète, concise

### 2.1 Pourquoi SSR — SEO + First Contentful Paint

Deux problèmes distincts, une même solution :

**SEO.** La majorité des crawlers Google n'exécutent pas JavaScript (ou l'exécutent avec un délai). Avec une app Vue en CSR, le crawler reçoit `<div id="app"></div>` — rien à indexer. En SSR, il reçoit le HTML complet avec le contenu.

**First Contentful Paint (FCP).** En CSR, le navigateur doit : (1) télécharger le HTML vide, (2) télécharger le bundle JS, (3) parser et exécuter Vue, (4) rendre les composants. Sur mobile ou réseau lent, l'étape 2-3 dure plusieurs secondes. En SSR, le HTML est déjà là — le navigateur l'affiche en < 100ms et charge le JS en parallèle.

### 2.2 Cycle complet SSR

```
┌─────────────┐    1. requête GET /catalogue    ┌──────────────────┐
│   Navigateur │ ──────────────────────────────► │   Serveur Node   │
│             │                                  │                  │
│             │                                  │  createSSRApp()  │
│             │                                  │  renderToString()│
│             │                                  │  → HTML complet  │
│             │    2. HTML complet + CSS + JS    │                  │
│             │ ◄────────────────────────────── │  inject __STATE__│
│             │                                  └──────────────────┘
│  affiche    │
│  le HTML    │    3. navigateur affiche le HTML sans attendre JS
│  (visible!) │
│             │    4. bundle JS se télécharge en arrière-plan
│             │
│  hydration  │    5. app.mount('#app') → Vue HYDRATE (n'écrase pas,
│  (interactif│       attache les écouteurs sur le DOM existant)
└─────────────┘
```

**Ce que fait `renderToString` côté serveur :**

```ts
// server/render.ts — s'exécute sur Node.js, jamais dans le navigateur
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import App from '../src/App.vue'

export async function renderPage(url: string): Promise<string> {
  const app = createSSRApp(App)

  // renderToString attend toutes les async setup() résolues
  // avant de retourner le HTML — point de synchronisation critique
  const appHtml = await renderToString(app)

  return `<!DOCTYPE html>
<html lang="fr">
  <head><meta charset="UTF-8" /><title>Catalogue</title></head>
  <body>
    <div id="app">${appHtml}</div>
    <script type="module" src="/src/entry-client.ts"></script>
  </body>
</html>`
}
```

**Ce que fait `app.mount('#app')` côté client (hydration) :**

```ts
// src/entry-client.ts — s'exécute dans le navigateur uniquement
import { createSSRApp } from 'vue'
import App from './App.vue'

const app = createSSRApp(App)
// mount() détecte que le DOM est déjà là (rendu par le serveur)
// → HYDRATION : il n'écrase pas le HTML, il parcourt le DOM existant
// et y attache les écouteurs d'événements et la réactivité Vue
app.mount('#app')
```

> **Distinction critique :** `createApp()` → rendu CSR classique (efface le DOM, recrée tout).
> `createSSRApp()` → active le mode hydration. À utiliser **des deux côtés** (serveur ET client) dans une app SSR.

### 2.3 L'hydration — ce qui se passe vraiment

L'hydration est le processus par lequel Vue prend le HTML statique envoyé par le serveur et le "rend vivant" côté client.

Vue ne re-rend pas les composants. Il **réconcilie** : il parcoure le DOM existant et le Virtual DOM généré côté client, en vérifiant que les nœuds correspondent. Pour chaque nœud correspondant, il y attache les event listeners et initialise la réactivité.

Coût réel de l'hydration :
- Pas de création de nœuds DOM (ils existent déjà)
- Pas de paint/layout initial
- Une passe de vérification DOM vs VNode + attachement des listeners
- Coût : environ 2-3× plus rapide que le rendu CSR à froid

### 2.4 Hydration mismatch — causes et diagnostic

Un **hydration mismatch** survient quand l'HTML généré par le serveur diffère de l'HTML que Vue générerait côté client. Vue logge un warning en console :

```
[Vue warn]: Hydration node mismatch:
- Client vnode: <p>
- Server rendered DOM: <div>
```

En mode développement, Vue ajoute aussi des marqueurs visuels. En production, Vue tente de récupérer en re-rendant le composant incohérent (performance dégradée, flash de contenu).

**Cause 1 — Valeur non-déterministe : `Date.now()`, `Math.random()`**

```vue
<!-- ❌ Mismatch garanti : le timestamp serveur ≠ timestamp client -->
<template>
  <p>Rendu à : {{ Date.now() }}</p>
</template>

<!-- ✅ Rendu déterministe au SSR, valeur client-only dans onMounted -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
const timestamp = ref<number | null>(null)
onMounted(() => { timestamp.value = Date.now() })
</script>
<template>
  <p v-if="timestamp">Rendu à : {{ timestamp }}</p>
</template>
```

**Cause 2 — Accès à `window` ou `document` pendant le render**

```vue
<!-- ❌ window n'existe pas sur Node.js → crash serveur -->
<script setup lang="ts">
const width = window.innerWidth  // ReferenceError: window is not defined
</script>

<!-- ✅ onMounted ne s'exécute jamais côté serveur -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
const width = ref(0)
onMounted(() => { width.value = window.innerWidth })
</script>
```

**Cause 3 — HTML invalide côté serveur**

Un `<p>` imbriqué dans un autre `<p>` est HTML invalide. Le navigateur le normalise différemment du serveur → mismatch DOM.

```vue
<!-- ❌ HTML invalide — le navigateur va réinterpréter la structure -->
<p>
  Texte <p>imbriqué</p> interdit
</p>

<!-- ✅ HTML valide -->
<div>
  Texte <span>inline correct</span>
</div>
```

**Cause 4 — Différence d'environnement (cookie, locale, timezone)**

```vue
<!-- ❌ Mismatch si le serveur et le client ont des locales différentes -->
<p>{{ new Date().toLocaleDateString('fr-FR') }}</p>

<!-- ✅ Données formatées dans onMounted -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
const dateStr = ref('')
onMounted(() => { dateStr.value = new Date().toLocaleDateString('fr-FR') })
</script>
```

**Comment diagnostiquer un mismatch :**
1. Ouvrir la console devtools — le warning Vue liste le nœud incohérent
2. Comparer l'HTML dans "View Source" (ce que le serveur a envoyé) avec le DOM en live (après hydration)
3. Chercher dans le composant : `Date.now`, `Math.random`, `window`, `document`, `localStorage`, `navigator`, HTML invalide

### 2.5 Code universel (isomorphe)

Le code **universel** est le code qui peut s'exécuter à la fois sur Node.js (serveur) et dans le navigateur (client). C'est la contrainte centrale du SSR.

**Pattern recommandé — un fichier `createApp` partagé :**

```ts
// src/app.ts — code universel, importé par server.ts et entry-client.ts
import { createSSRApp } from 'vue'
import App from './App.vue'
import router from './router'

// Nouveau contexte applicatif à chaque requête serveur
// (évite la pollution d'état entre requêtes concurrentes)
export function createApp() {
  const app = createSSRApp(App)
  app.use(router)
  return { app, router }
}
```

```ts
// server/render.ts — côté serveur
import { createApp } from '../src/app'
import { renderToString } from 'vue/server-renderer'

export async function render(url: string) {
  const { app, router } = createApp()
  await router.push(url)
  await router.isReady()
  const html = await renderToString(app)
  return html
}
```

```ts
// src/entry-client.ts — côté client
import { createApp } from './app'

const { app, router } = createApp()
router.isReady().then(() => { app.mount('#app') })
```

**Règle :** ne jamais créer une instance d'app singleton partagée entre requêtes. Chaque requête serveur doit créer sa propre instance — sinon les états se contaminent entre utilisateurs concurrents.

### 2.6 Garder l'accès à `window` et `document` — pattern `onMounted`

`onMounted` est le filet de sécurité universel : il ne s'exécute **jamais** côté serveur, toujours côté client après l'hydration.

```ts
// Règle : toute lecture de window/document/localStorage/navigator
// doit être dans onMounted (ou dans un handler d'événement)

import { ref, onMounted } from 'vue'

const theme = ref<'light' | 'dark'>('light')        // valeur initiale déterministe
const scrollY = ref(0)
const isMobile = ref(false)

onMounted(() => {
  // Ici, window existe garantiement
  theme.value = (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light'
  scrollY.value = window.scrollY
  isMobile.value = window.innerWidth < 768

  // Écouter les événements navigateur → aussi dans onMounted
  window.addEventListener('scroll', () => { scrollY.value = window.scrollY })
})
```

**Alternative pour une garde explicite (utile dans les composables) :**

```ts
// Vérifie si on est côté client — utile dans un composable appelé au setup()
if (typeof window !== 'undefined') {
  // code client-only
}

// Équivalent Nuxt : import.meta.client (plus lisible)
if (import.meta.client) {
  // code client-only, Nuxt/Vite seulement
}
```

### 2.7 Sérialisation de l'état serveur → client

**Le problème :** le serveur récupère les données depuis l'API, génère le HTML. Le client charge Vue, se monte, et... refait la même requête API. L'utilisateur voit un flash de contenu vide.

**La solution :** injecter l'état dans le HTML sous forme de JSON, le client le lit au démarrage.

```ts
// server/render.ts
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'

export async function render(url: string) {
  const app = createSSRApp(App)

  // 1. Fetch des données côté serveur
  const products = await fetchProducts()

  // 2. Provision de l'état dans l'app (via provide ou store)
  app.provide('initialProducts', products)

  const html = await renderToString(app)

  // 3. Sérialisation dans le HTML — le client le lira avant hydration
  // JSON.stringify + escaping manuel contre XSS (< devient <)
  const serializedState = JSON.stringify({ products })
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026')

  return {
    html,
    // Injecté dans le template HTML entre les balises <script>
    stateScript: `<script>window.__INITIAL_STATE__ = ${serializedState}<\/script>`,
  }
}
```

```ts
// src/entry-client.ts — côté client
import { createSSRApp } from 'vue'
import App from './App.vue'

const app = createSSRApp(App)

// 4. Le client lit l'état injecté avant de monter l'app
if (window.__INITIAL_STATE__) {
  app.provide('initialProducts', window.__INITIAL_STATE__.products)
}

app.mount('#app')
// Vue hydrate le DOM existant avec l'état déjà disponible → pas de re-fetch
```

```ts
// Typage TypeScript pour window.__INITIAL_STATE__
// src/types/ssr.d.ts
export {}
declare global {
  interface Window {
    __INITIAL_STATE__?: {
      products?: Product[]
      [key: string]: unknown
    }
  }
}
```

> Ce pattern est ce que Nuxt appelle `useState` et `useAsyncData` — les deux automatisent exactement cette sérialisation/désérialisation.

### 2.8 SSR vs SSG vs CSR — tableau de décision

| Mode | Qui génère le HTML | Quand | Données | SEO | Cas d'usage |
|------|--------------------|-------|---------|-----|-------------|
| **CSR** | Navigateur | À chaque visite | Fetch côté client | Mauvais (page vide) | Dashboard admin, app derrière login |
| **SSR** | Serveur | À chaque requête | Fetch côté serveur | Excellent | E-commerce, pages publiques dynamiques |
| **SSG** | Build CI/CD | Une seule fois (build) | API au build | Excellent | Blog, docs, site vitrine stable |
| **ISR** | Build + revalidation | Build + TTL | API au build + cache | Excellent | Catalogue produits (prix = changent rarement) |

**Arbre de décision rapide :**

```
Le contenu est-il derrière un login ?
  Oui → CSR (pas de SEO nécessaire, dashboard, SaaS)
  Non → le contenu change-t-il souvent ?
         Rarement (< 1× / heure) → SSG ou ISR
         Souvent / par utilisateur → SSR
```

**Eudonet / Bedrock context :** les pages de contenu internes (back-office CRM) → CSR. Les pages publiques (portail client, catalogue) → SSR ou SSG.

### 2.9 Suspense et données async au SSR

En Vue 3, `renderToString` supporte les composants avec `async setup()`. Il attend que toutes les promises résolvent avant de retourner le HTML — à condition que les composants async soient wrappés dans `<Suspense>`.

```vue
<!-- CatalogueProductsAsync.vue — composant avec données async -->
<script setup lang="ts">
// async setup() → ce composant doit être wrappé dans <Suspense>
// renderToString attend la résolution avant de produire le HTML
const products = await fetchProducts()
</script>

<template>
  <ul>
    <li v-for="p in products" :key="p.id">{{ p.name }} — {{ p.price }}€</li>
  </ul>
</template>
```

```vue
<!-- App.vue — wrapping Suspense obligatoire pour async setup -->
<template>
  <Suspense>
    <!-- Contenu async — renderToString attend sa résolution -->
    <CatalogueProductsAsync />

    <!-- fallback — affiché si la résolution dépasse le rendu (streaming) -->
    <template #fallback>
      <p>Chargement du catalogue…</p>
    </template>
  </Suspense>
</template>
```

> **Point de vigilance :** sans `<Suspense>`, un `async setup()` est ignoré côté serveur — Vue rend le composant vide et continue. Le mismatch survient car le client aura les données mais le serveur avait rendu vide.

### 2.10 Nuxt — le pont automatique

En pratique, on n'écrit pas le code des sections 2.2 à 2.7 à la main. Nuxt 3 l'encapsule entièrement :

```vue
<!-- pages/catalogue.vue — Nuxt 3 : même résultat, zéro boilerplate SSR -->
<script setup lang="ts">
// useAsyncData = fetch SSR + sérialisation automatique de l'état
// équivaut à : fetchProducts() + window.__INITIAL_STATE__ + provide/inject
const { data: products } = await useAsyncData(
  'products',
  () => $fetch('/api/products')
)
</script>

<template>
  <ul>
    <li v-for="p in products" :key="p.id">{{ p.name }}</li>
  </ul>
</template>
```

Ce que Nuxt gère automatiquement :
- `createSSRApp` + `createApp` pattern (module `nuxt/app`)
- `renderToString` dans le serveur Nitro
- Sérialisation de l'état via `useNuxtApp().payload`
- Hydration côté client
- `useCookie`, `useRequestHeaders` — accès SSR-safe aux requêtes
- `useState` — état partagé serveur→client sans flash

Le module 23 (Architecture front) et le cours Nuxt (cours 03) détaillent ces APIs.

---

## 3. Worked examples

### Exemple 1 — Mismatch reproduit et corrigé

**Contexte :** un composant `CatalogueHeader.vue` affiche la date du jour et la largeur de fenêtre. Tel quel, il provoque deux mismatches.

**Version cassée :**

```vue
<!-- CatalogueHeader.vue — VERSION CASSÉE — deux mismatches -->
<script setup lang="ts">
// ❌ Mismatch 1 : Date au render — serveur = "2026-07-01 14:32:01"
//                              client = "2026-07-01 14:32:05" (quelques secondes plus tard)
const today = new Date().toLocaleString('fr-FR')

// ❌ Mismatch 2 : window n'existe pas sur Node.js → ReferenceError au build SSR
// Si on guard avec typeof window, le serveur rend "Largeur: 0px"
// mais le client rend "Largeur: 1440px" → mismatch DOM
const width = typeof window !== 'undefined' ? window.innerWidth : 0
</script>

<template>
  <header>
    <p>Page générée le : {{ today }}</p>
    <p>Largeur : {{ width }}px</p>
  </header>
</template>
```

**Console Vue en dev :**
```
[Vue warn]: Hydration text content mismatch in <p>
  - Client: "Page générée le : 2026-07-01 14:32:05"
  - Server: "Page générée le : 2026-07-01 14:32:01"

[Vue warn]: Hydration text content mismatch in <p>
  - Client: "Largeur : 1440px"
  - Server: "Largeur : 0px"
```

**Version corrigée — pattern onMounted systématique :**

```vue
<!-- CatalogueHeader.vue — VERSION CORRIGÉE -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

// ✅ Valeur initiale déterministe pour le SSR
// Le serveur et le client rendent tous les deux "" → pas de mismatch
const today = ref('')
const width = ref(0)

// ✅ onMounted : ne s'exécute JAMAIS côté serveur
// Après l'hydration, Vue met à jour le DOM côté client uniquement
// → pas de mismatch car Vue compare l'état APRÈS hydration
onMounted(() => {
  today.value = new Date().toLocaleString('fr-FR')
  width.value = window.innerWidth
})
</script>

<template>
  <header>
    <!-- v-if masque le contenu tant que la valeur n'est pas initialisée -->
    <!-- Alternative : afficher un placeholder cohérent -->
    <p v-if="today">Page générée le : {{ today }}</p>
    <p v-if="width">Largeur : {{ width }}px</p>
  </header>
</template>
```

**Pourquoi ça marche :** le serveur et l'entrée client rendent tous les deux des `<p>` vides ou masqués par `v-if`. Vue hydrate sans trouver de différence. Ensuite, `onMounted` s'exécute et met à jour les valeurs côté client — Vue re-rend les composants concernés sans mismatch.

### Exemple 2 — Composant client-only avec `<ClientOnly>` (pattern Nuxt / guard manuel)

Certains composants n'ont **aucun sens** côté serveur (widget chat, carte interactive, Player vidéo). Les forcer dans le SSR génère des mismatches systématiques.

**Pattern Vue 3 brut — guard `onMounted` + `v-if` :**

```vue
<!-- InteractiveMap.vue — rendu uniquement côté client -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

// isMounted reste false côté serveur → le composant lourd n'est pas rendu
// Le serveur envoie un placeholder — pas de mismatch
const isMounted = ref(false)
onMounted(() => { isMounted.value = true })
</script>

<template>
  <!-- Côté serveur : placeholder léger (bon pour le SSR) -->
  <div v-if="!isMounted" class="map-placeholder" aria-label="Carte en chargement">
    <!-- skeleton ou texte de fallback -->
  </div>

  <!-- Côté client seulement : le vrai composant lourd -->
  <LeafletMap v-else />
</template>
```

**Pattern Nuxt — `<ClientOnly>` (génère exactement le même output) :**

```vue
<!-- Dans Nuxt, <ClientOnly> est un composant built-in -->
<template>
  <ClientOnly fallback-tag="div" fallback="Carte en chargement…">
    <LeafletMap />
  </ClientOnly>
</template>
```

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Accès à `window`/`document` dans `setup()` ou au niveau racine du module

Le code de `setup()` s'exécute à la fois côté serveur et côté client. Node.js n'a pas `window` — toute lecture provoque un `ReferenceError` qui fait crasher le serveur.

```ts
// ❌ Crash serveur garanti — window n'existe pas sur Node.js
<script setup lang="ts">
const userAgent = navigator.userAgent          // ReferenceError
const token = localStorage.getItem('token')    // ReferenceError
document.title = 'Catalogue'                   // ReferenceError
</script>

// ✅ Tout dans onMounted
<script setup lang="ts">
import { onMounted } from 'vue'
onMounted(() => {
  const userAgent = navigator.userAgent        // OK
  const token = localStorage.getItem('token') // OK
  document.title = 'Catalogue'                // OK
})
</script>
```

**Signal d'alarme :** si tu vois `ReferenceError: window is not defined` dans les logs serveur, cherche un accès browser API hors de `onMounted`.

### PIÈGE #2 — Contenu non déterministe : ID aléatoire, timestamp, Math.random

```vue
<!-- ❌ Math.random() au render → valeur serveur ≠ valeur client -->
<template>
  <div :id="`tooltip-${Math.random()}`">...</div>
</template>

<!-- ✅ ID stable généré une fois dans setup() via une méthode déterministe -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
// Option A : ID passé en prop (préférable)
const props = defineProps<{ tooltipId: string }>()

// Option B : généré côté client uniquement
const tooltipId = ref('')
onMounted(() => { tooltipId.value = `tooltip-${Math.random().toString(36).slice(2)}` })
</script>
```

### PIÈGE #3 — Oublier de sérialiser l'état serveur → flash de contenu vide

```ts
// ❌ Le serveur fetch les données, génère le HTML, mais ne sérialise pas l'état
// Le client monte Vue, trouve des données undefined → re-fetch → flash vide → re-rendu
const products = await fetchProducts()
const html = await renderToString(app)
// → pas de window.__INITIAL_STATE__ → le client refetch → mismatch + UX dégradée

// ✅ Toujours sérialiser l'état dans le HTML
const serializedState = JSON.stringify({ products })
  .replace(/</g, '\\u003C')  // échappement XSS obligatoire
  .replace(/>/g, '\\u003E')
  .replace(/&/g, '\\u0026')

const stateScript = `<script>window.__INITIAL_STATE__ = ${serializedState}<\/script>`
// Injecter stateScript dans le template HTML avant </body>
```

### PIÈGE #4 — Confondre `createApp` et `createSSRApp`

```ts
// ❌ createApp en mode SSR : le client efface et recrée le DOM
// → l'HTML du serveur est jeté, l'utilisateur voit un flash
import { createApp } from 'vue'
createApp(App).mount('#app')  // ÉCRASE le DOM existant — pas d'hydration

// ✅ createSSRApp : mode hydration — parcourt et enrichit le DOM existant
import { createSSRApp } from 'vue'
createSSRApp(App).mount('#app')  // HYDRATE — attache les listeners sur le DOM du serveur
```

### PIÈGE #5 — Singleton d'état côté serveur (state contamination)

```ts
// ❌ État global défini au niveau module — partagé entre TOUTES les requêtes
// Utilisateur A voit les données de l'utilisateur B
const store = { user: null }

// ✅ Créer un nouvel état à chaque requête — isolation garantie
export function createApp() {
  const app = createSSRApp(App)
  // chaque appel à createApp() crée un store neuf
  const store = createPinia()
  app.use(store)
  return { app, store }
}
```

---

## 5. Ancrage TribuZen

Dans TribuZen, le SSR s'applique à deux couches du front-office public :

**Pages publiques SEO-critiques (`/communautes`, `/evenements`, `/inscription`) :**

Ces pages doivent remonter dans Google (acquisition organique). En CSR, elles seraient invisibles pour les crawlers. Avec SSR :
- Le crawler reçoit le HTML complet des communautés et des événements
- Le FCP tombe à < 500ms sur mobile
- La structure Vue reste identique — seule l'entrée serveur change

```ts
// tribuzen/server/render.ts — pattern exact à déployer
import { createApp } from '../src/app'
import { renderToString } from 'vue/server-renderer'

export async function renderPublicPage(url: string, ssrContext?: object) {
  const { app, router } = createApp()
  await router.push(url)
  await router.isReady()

  // Les composants avec async setup() sont attendus
  const html = await renderToString(app, ssrContext)
  return html
}
```

**Fichiers cibles dans `smaurier/tribuzen` :**

```
tribuzen/
  src/
    app.ts                          ← createApp() universel
    entry-client.ts                 ← hydration côté client
    pages/
      communautes/
        CommunautesList.vue         ← async setup() + <Suspense>
      evenements/
        EvenementDetail.vue         ← données sérialisées serveur
  server/
    render.ts                       ← renderToString + __INITIAL_STATE__
    index.ts                        ← Express + Vite SSR middleware
```

**Parallèle Eudonet/Bedrock :** le Front-Office Eudonet (portail client) est exactement ce cas — pages publiques exposées au SEO, contenu dynamique (données CRM), stack Vue/Nuxt. Comprendre ce cycle (renderToString → HTML → hydration → état sérialisé) est ce que l'équipe Core attend.

---

## 6. Points clés

1. SSR génère le HTML côté serveur via `renderToString(createSSRApp(App))` — l'utilisateur voit le contenu avant que le JS soit chargé.
2. L'hydration (`createSSRApp(App).mount('#app')`) ne recrée pas le DOM — elle attache les listeners sur le HTML existant.
3. Un hydration mismatch = HTML serveur ≠ HTML client. Causes principales : `Date.now()`, `Math.random()`, accès `window`/`document` pendant le render, HTML invalide.
4. Tout accès aux APIs navigateur (`window`, `document`, `localStorage`, `navigator`) doit être dans `onMounted` — jamais dans `setup()` au top-level.
5. Le code universel (isomorphe) doit exporter une fonction `createApp()` — jamais un singleton. Chaque requête serveur crée sa propre instance.
6. L'état serveur → client se sérialise via `window.__INITIAL_STATE__` pour éviter le double-fetch et le flash de contenu.
7. SSG (génération au build) = meilleur choix si les données changent moins d'une fois par heure. SSR = si le contenu est dynamique par requête. CSR = si derrière un login.
8. `<Suspense>` + `async setup()` = le mécanisme Vue pour charger des données avant le rendu SSR — `renderToString` attend la résolution.
9. Nuxt automatise tout ce pipeline (renderToString, sérialisation, hydration, `useAsyncData`).

---

## 7. Seeds Anki

```
Quelle est la différence entre createApp et createSSRApp côté client ?|createApp efface et recrée le DOM (mode CSR). createSSRApp active le mode hydration — il parcourt le DOM existant du serveur et y attache les listeners sans le réécrire.
Pourquoi accéder à window dans setup() crash le serveur SSR ?|Node.js n'a pas d'objet window. setup() s'exécute côté serveur lors du renderToString → ReferenceError. Solution : déplacer tout accès window/document/localStorage dans onMounted, qui ne s'exécute jamais côté serveur.
Que se passe-t-il lors d'un hydration mismatch en production ?|Vue logue un warning, tente de récupérer en re-rendant le sous-arbre incohérent (perf dégradée), et peut provoquer un flash de contenu. En dev, des marqueurs visuels aident au diagnostic.
Pourquoi faut-il sérialiser l'état serveur dans window.__INITIAL_STATE__ ?|Le serveur fetch les données et les rend en HTML. Sans sérialisation, le client refait le fetch → flash de contenu vide + double requête réseau. Avec __INITIAL_STATE__, le client réutilise les données déjà fetched par le serveur.
Quand choisir SSG plutôt que SSR ?|SSG = données changent rarement (blog, docs, site vitrine) — HTML généré une fois au build, servi depuis un CDN. SSR = données dynamiques par requête (e-commerce, personnalisation, prix en temps réel). SSR est plus lent à servir mais toujours à jour.
Quel est le rôle de Suspense dans le SSR Vue 3 ?|Suspense permet à renderToString d'attendre la résolution des async setup() dans l'arbre de composants. Sans Suspense autour d'un composant async, le serveur rend le composant vide → mismatch avec le client qui a les données.
Comment partager correctement la logique d'app entre server.ts et entry-client.ts ?|Exporter une fonction createApp() depuis un fichier partagé (src/app.ts). Chaque appel crée une nouvelle instance — évite la contamination d'état entre requêtes concurrentes (le singleton est le piège classique du SSR).
Que génère renderToString côté serveur ?|Une Promise<string> qui résout vers le HTML complet du composant Vue (sans les scripts, sans le <html> wrapper). C'est une chaîne de caractères à insérer dans le template HTML avant envoi au client.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-22-ssr-et-hydration/README.md`. Implémente un mini serveur Express + `renderToString`, diagnostique et corrige trois mismatches sur un vrai composant Vue 3, et sérialise l'état serveur vers le client — avec `vue/server-renderer` comme vrai outil.

---

← [Module 21 — Performance](21-performance.md)
