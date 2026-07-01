---
titre: Nuxt — pages et layouts
cours: 02-vue
notions: [routing basé fichiers, routes dynamiques et params, routes imbriquées et pages enfants, layouts et NuxtLayout, NuxtPage, navigation NuxtLink et navigateTo, middleware de route, transitions de page, route rules en survol]
outcomes:
  - sait créer des routes via l'arborescence pages (dynamiques, imbriquées)
  - sait définir et appliquer des layouts (default, nommés)
  - sait naviguer (NuxtLink, navigateTo) et protéger via middleware
  - sait appliquer une transition de page
prerequis: [25-nuxt-introduction]
next: 27-nuxt-data-fetching
libs: [{ name: nuxt, version: "3" }, { name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — pages /family/[id], /feed, /profile via routing fichiers + layout par défaut, middleware auth
last-reviewed: 2026-07
---

# Nuxt — pages et layouts

> **Outcomes — tu sauras FAIRE :** créer des routes (statiques, dynamiques, imbriquées) via l'arborescence `pages/`, définir et appliquer des layouts, naviguer avec `NuxtLink` et `navigateTo`, protéger une route avec un middleware, appliquer une transition de page.
> **Difficulté :** :star::star::star:
>
> **Portée :** ce module couvre le système de routing et de layouts de Nuxt. La récupération de données (`useFetch`, `useAsyncData`) est vue au **module 27**. Les route rules avancées et le rendu hybride (ISR, SWR) sont au **module 28**.

---

## 1. Cas concret d'abord

Tu démarres la couche front-office de TribuZen. Le designer a livré trois écrans : la page d'accueil `/feed`, la page de profil `/profile`, et la page d'une famille `/family/[id]` — où `[id]` change selon la famille consultée.

Avec Vue Router classique, tu aurais écrit un fichier `router/index.ts` manuellement :

```ts
// ❌ Ce que tu ferais SANS Nuxt — fichier router à écrire et maintenir
import { createRouter, createWebHistory } from 'vue-router'
import FeedPage from '@/pages/FeedPage.vue'
import ProfilePage from '@/pages/ProfilePage.vue'
import FamilyPage from '@/pages/FamilyPage.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/feed', component: FeedPage },
    { path: '/profile', component: ProfilePage },
    { path: '/family/:id', component: FamilyPage },
  ],
})
```

Avec Nuxt, **tu ne touches pas à un fichier de router**. Tu crées les fichiers, les routes existent :

```
pages/
  feed.vue           →  /feed
  profile.vue        →  /profile
  family/
    [id].vue         →  /family/42  (ou tout autre id)
```

Ce module explique comment ça marche, jusqu'où ça va (imbriqué, layouts, middleware, transitions), et où s'arrête le routing-fichiers par rapport aux route rules config.

---

## 2. Théorie complète, concise

### 2.1 Routing basé fichiers — la règle de base

Nuxt scanne le dossier `pages/` au démarrage et génère automatiquement le router Vue. La règle est simple : **le chemin du fichier = le chemin de l'URL**.

```
pages/                          URL
├── index.vue               →  /
├── feed.vue                →  /feed
├── profile.vue             →  /profile
├── about.vue               →  /about
└── settings/
    ├── index.vue           →  /settings
    └── account.vue         →  /settings/account
```

`index.vue` dans un dossier = l'URL du dossier lui-même (sans segment supplémentaire).

> **Nuxt 4 / app/ directory :** dans Nuxt 4, le dossier `pages/` se trouve dans `app/pages/` si la structure `app/` est activée. La logique reste identique — seule la racine change. ⚠️ à vérifier Context7 si ton projet est en Nuxt 4.

### 2.2 Routes dynamiques — `[param].vue`

Les crochets `[param]` dans le nom du fichier définissent un **paramètre dynamique**. Le fichier s'applique à n'importe quelle valeur pour ce segment.

```
pages/
├── family/
│   ├── index.vue           →  /family
│   └── [id].vue            →  /family/42, /family/abc, etc.
├── users/
│   └── [slug]/
│       └── edit.vue        →  /users/alice/edit
└── [...slug].vue           →  catch-all (toute URL non matchée)
```

Pour lire le paramètre dans la page, Nuxt expose `useRoute()` (auto-importé) :

```vue
<!-- pages/family/[id].vue -->
<script setup lang="ts">
const route = useRoute()

// route.params.id est un string — le nom du param = le nom entre crochets
const familyId = route.params.id as string
// OU avec toute la sécurité TypeScript :
const familyId2 = String(route.params.id)
</script>

<template>
  <h1>Famille {{ familyId }}</h1>
</template>
```

**Catch-all** : `[...slug].vue` capture tout le reste du chemin dans un tableau :

```ts
// URL : /blog/2026/juin/article
// route.params.slug → ['2026', 'juin', 'article']
```

### 2.3 Routes imbriquées et `<NuxtPage>`

Quand tu veux qu'une page **enfant** s'affiche à l'intérieur d'une page **parente** (layouts de page, tabs), Nuxt utilise les routes imbriquées.

La règle : un **fichier `.vue` et un dossier du même nom** au même niveau créent une relation parent-enfant.

```
pages/
└── users/
    ├── [id].vue            →  /users/42  (parente)
    └── [id]/
        ├── posts.vue       →  /users/42/posts  (enfant)
        └── settings.vue    →  /users/42/settings  (enfant)
```

Dans la page parente `[id].vue`, tu places `<NuxtPage />` là où les enfants doivent s'afficher :

```vue
<!-- pages/users/[id].vue — page parente -->
<template>
  <div>
    <h1>Profil utilisateur {{ $route.params.id }}</h1>
    <nav>
      <NuxtLink :to="`/users/${$route.params.id}/posts`">Posts</NuxtLink>
      <NuxtLink :to="`/users/${$route.params.id}/settings`">Réglages</NuxtLink>
    </nav>

    <!-- Les pages enfants s'affichent ici -->
    <NuxtPage />
  </div>
</template>
```

`<NuxtPage />` est l'équivalent Nuxt de `<RouterView />`. Il s'utilise aussi dans `app.vue` pour le point d'entrée global quand tu n'utilises pas de layouts.

### 2.4 Layouts et `<NuxtLayout>`

Un **layout** est un composant enveloppant qui persiste entre les navigations. Il contient typiquement le header, la sidebar, le footer — tout ce qui ne doit pas re-rendre à chaque changement de page.

**Structure :**

```
layouts/
├── default.vue    ← appliqué automatiquement à toutes les pages
├── auth.vue       ← layout sans nav (pages de connexion)
└── dashboard.vue  ← layout avec sidebar admin
```

**`layouts/default.vue` — le layout implicite :**

```vue
<!-- layouts/default.vue -->
<template>
  <div class="app">
    <header class="navbar">
      <NuxtLink to="/feed">Feed</NuxtLink>
      <NuxtLink to="/profile">Profil</NuxtLink>
    </header>

    <main class="content">
      <!-- <slot /> = l'emplacement où la page active s'insère -->
      <slot />
    </main>

    <footer>TribuZen — 2026</footer>
  </div>
</template>
```

`<slot />` est le "trou" dans le layout. Nuxt y injecte le composant de la page active. Toutes les pages utilisent `default.vue` par défaut — sans rien déclarer.

**Layout nommé — spécifier avec `definePageMeta` :**

```vue
<!-- pages/login.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'auth',  // utilise layouts/auth.vue
})
</script>
```

```vue
<!-- pages/admin/dashboard.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',  // on peut combiner layout + middleware
})
</script>
```

**`<NuxtLayout>` explicite :** dans `app.vue`, si tu veux contrôler le rendu toi-même :

```vue
<!-- app.vue — usage explicite de NuxtLayout -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

`<NuxtLayout name="dashboard">` force un layout nommé depuis n'importe quel composant. On peut aussi passer des props au layout via des slots nommés :

```vue
<NuxtLayout name="custom">
  <template #header>
    Contenu du slot header
  </template>
</NuxtLayout>
```

**Layout `false` :** désactiver entièrement le layout pour une page :

```ts
definePageMeta({ layout: false })
```

### 2.5 Navigation — `NuxtLink` et `navigateTo`

**`<NuxtLink>` — navigation déclarative dans le template :**

`NuxtLink` est l'équivalent Nuxt de `<RouterLink>`. Il génère une balise `<a>` optimisée avec prefetching automatique.

```vue
<template>
  <!-- Lien statique -->
  <NuxtLink to="/feed">Feed</NuxtLink>

  <!-- Lien dynamique avec objet route -->
  <NuxtLink :to="{ name: 'family-id', params: { id: family.id } }">
    Voir la famille
  </NuxtLink>

  <!-- Lien externe — ouvre dans un nouvel onglet -->
  <NuxtLink to="https://nuxt.com" target="_blank" rel="noopener">
    Documentation Nuxt
  </NuxtLink>
</template>
```

Le nom de route généré par Nuxt suit la convention : `chemin-avec-tirets`. La page `pages/family/[id].vue` génère la route nommée `family-id`.

**`navigateTo()` — navigation programmatique :**

`navigateTo` est l'équivalent Nuxt de `router.push()`. Il est auto-importé et fonctionne côté client comme côté serveur.

```vue
<script setup lang="ts">
async function handleLogin() {
  const success = await login()
  if (success) {
    // Navigation après action réussie
    await navigateTo('/feed')
  }
}

// Redirection externe
await navigateTo('https://example.com', { external: true })

// Redirection avec code HTTP (utile en middleware SSR)
return navigateTo('/login', { redirectCode: 301 })
</script>
```

> **`navigateTo` vs `useRouter().push()`** : les deux fonctionnent côté client. `navigateTo` est préférable car il fonctionne aussi côté serveur (dans les middlewares SSR) et expose des options Nuxt supplémentaires (`redirectCode`, `external`).

### 2.6 Middleware de route — `defineNuxtRouteMiddleware`

Un middleware de route est une fonction qui s'exécute **avant** que la navigation aboutisse. Il permet de rediriger, d'annuler, ou d'effectuer des effets de bord (logs, analytics).

**Créer un middleware :**

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuthStore()

  // Si l'utilisateur n'est pas connecté et ne va pas vers /login
  if (!isAuthenticated.value && to.path !== '/login') {
    // return navigateTo() = redirection + arrêt de la navigation courante
    return navigateTo('/login')
  }

  // Sans return = la navigation continue normalement
})
```

`to` et `from` sont des objets `RouteLocationNormalized` (même API que Vue Router).

**Appliquer un middleware à une page :**

```ts
// Dans la page à protéger
definePageMeta({
  middleware: 'auth',           // nom = nom du fichier sans .ts
  // ou plusieurs :
  middleware: ['auth', 'role-check'],
})
```

**Middleware global :** ajouter le suffixe `.global` au nom du fichier — il s'exécute sur **toutes** les navigations, sans `definePageMeta` :

```ts
// middleware/logger.global.ts
export default defineNuxtRouteMiddleware((to) => {
  console.log('[nav]', to.path)
})
```

**Middleware inline :** directement dans `definePageMeta`, sans fichier séparé :

```ts
definePageMeta({
  middleware: defineNuxtRouteMiddleware((to) => {
    if (!to.query.token) return navigateTo('/unauthorized')
  }),
})
```

> **Important :** dans un middleware, un `return` sans valeur (ou sans `navigateTo`) **laisse la navigation continuer**. Un middleware qui ne retourne rien est un middleware pass-through — utile pour des effets de bord sans bloquer.

### 2.7 Transitions de page — `pageTransition`

Nuxt intègre les transitions Vue sur les changements de page. La configuration se fait à deux niveaux.

**Global — via `nuxt.config.ts` :**

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    pageTransition: {
      name: 'fade',
      mode: 'out-in',  // default — attend que la page sortante disparaisse avant d'entrer
    },
    layoutTransition: {
      name: 'slide',
      mode: 'out-in',
    },
  },
})
```

Il faut ensuite définir les classes CSS correspondantes (dans `assets/css/transitions.css` ou globalement) :

```css
/* assets/css/transitions.css */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
```

**Par page — via `definePageMeta` :**

```ts
definePageMeta({
  pageTransition: {
    name: 'slide-left',
    mode: 'out-in',
  },
})
```

**Désactiver la transition sur une page :**

```ts
definePageMeta({ pageTransition: false })
```

### 2.8 Route rules — survol (détail au module 28)

Les **route rules** permettent de configurer le comportement de rendu par route dans `nuxt.config.ts`. Ce sont des métadonnées de build, pas du code exécuté au runtime.

```ts
// nuxt.config.ts — aperçu, détail au module 28
export default defineNuxtConfig({
  routeRules: {
    '/feed': { ssr: true },              // SSR classique
    '/profile': { ssr: true },
    '/family/**': { swr: 60 },           // Stale-While-Revalidate 60s
    '/admin/**': { appLayout: 'dashboard' }, // layout via config (Nuxt 4)
    '/landing': { prerender: true },     // génération statique au build
  },
})
```

> **Module 28** couvrira le rendu hybride (SSR/SSG/ISR/SWR) en détail. Ici : retenir que `routeRules` contrôle le **mode de rendu par route**, pas la logique métier.

---

## 3. Worked examples

### Exemple 1 — Page dynamique `/family/[id]` avec layout et middleware

Construire la page famille de TribuZen : route dynamique, layout `default`, protégée par middleware `auth`.

**Étape 1 — Le middleware d'authentification :**

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  // useAuthStore() = composable Pinia (module 15)
  // Pour l'instant : simuler avec useState
  const isAuthenticated = useState<boolean>('auth', () => false)

  if (!isAuthenticated.value && to.path !== '/login') {
    return navigateTo('/login')
  }
  // Pas de return = navigation continue
})
```

**Étape 2 — Le layout par défaut avec navbar TribuZen :**

```vue
<!-- layouts/default.vue -->
<script setup lang="ts">
// Pas de logique ici — le layout est un shell pur
</script>

<template>
  <div class="layout">
    <header class="navbar">
      <NuxtLink to="/feed" class="nav-link">Feed</NuxtLink>
      <NuxtLink to="/profile" class="nav-link">Profil</NuxtLink>
    </header>

    <main class="page-content">
      <!-- La page active s'insère ici -->
      <slot />
    </main>
  </div>
</template>

<style scoped>
.layout { display: flex; flex-direction: column; min-height: 100vh; }
.navbar { display: flex; gap: 1rem; padding: 1rem; background: #1e293b; }
.nav-link { color: #e2e8f0; text-decoration: none; }
.page-content { flex: 1; padding: 2rem; }
</style>
```

**Étape 3 — La page dynamique `/family/[id]` :**

```vue
<!-- pages/family/[id].vue -->
<script setup lang="ts">
// definePageMeta est un compilateur macro — auto-importé, doit être au niveau racine
definePageMeta({
  middleware: 'auth',     // protégée par middleware/auth.ts
  // layout: 'default' est implicite — pas besoin de le déclarer
})

const route = useRoute()
// route.params.id est string | string[] pour les routes dynamiques
// Ici on sait que c'est un segment simple → cast string
const familyId = computed(() => String(route.params.id))

// NOTE : useFetch sera vu au module 27 — placeholder pour l'instant
// const { data: family } = await useFetch(`/api/families/${familyId.value}`)
</script>

<template>
  <div class="family-page">
    <h1>Famille #{{ familyId }}</h1>
    <p>Contenu de la famille chargé via useFetch (module 27)</p>

    <NuxtLink to="/feed">← Retour au feed</NuxtLink>
  </div>
</template>
```

**Ce que ce code produit :**
- URL `/family/abc123` → `familyId.value === 'abc123'`
- Le middleware `auth` s'exécute avant l'affichage — redirige vers `/login` si non authentifié
- Le layout `default.vue` entoure la page (navbar incluse)
- `NuxtLink` navigue sans rechargement complet

### Exemple 2 — Routes imbriquées pour le profil utilisateur

TribuZen veut une page `/profile` avec deux sous-sections : `/profile/info` et `/profile/settings`.

```
pages/
└── profile/
    ├── index.vue         →  /profile  (page parente avec tabs)
    ├── info.vue          →  /profile/info
    └── settings.vue      →  /profile/settings
```

```vue
<!-- pages/profile/index.vue — page parente avec NuxtPage -->
<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
</script>

<template>
  <div class="profile-wrapper">
    <h1>Mon profil</h1>

    <!-- Tabs de navigation -->
    <nav class="profile-tabs">
      <NuxtLink to="/profile/info">Informations</NuxtLink>
      <NuxtLink to="/profile/settings">Paramètres</NuxtLink>
    </nav>

    <!-- Les pages enfants (info.vue, settings.vue) s'affichent ici -->
    <NuxtPage />
  </div>
</template>
```

```vue
<!-- pages/profile/info.vue — page enfant -->
<template>
  <section>
    <h2>Mes informations</h2>
    <p>Nom, email, avatar...</p>
  </section>
</template>
```

```vue
<!-- pages/profile/settings.vue — page enfant -->
<template>
  <section>
    <h2>Paramètres</h2>
    <p>Notifications, confidentialité...</p>
  </section>
</template>
```

Quand l'utilisateur navigue de `/profile/info` à `/profile/settings` :
- `profile/index.vue` (le wrapper avec les tabs) **ne re-rende pas**
- Seule la zone `<NuxtPage />` change — `info.vue` est remplacé par `settings.vue`

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Configurer Vue Router manuellement dans un projet Nuxt

```ts
// ❌ Ne pas faire ça dans un projet Nuxt
// src/router/index.ts
import { createRouter } from 'vue-router'
export default createRouter({ routes: [...] })

// ✅ Laisser Nuxt générer le router depuis pages/
// Créer le fichier pages/feed.vue = la route /feed existe automatiquement
```

Nuxt génère et injecte le router automatiquement. Créer un fichier `router/index.ts` manuellement entre en conflit avec ce mécanisme. Si tu as besoin de modifier la config du router (ex : `scrollBehavior`), utilise `app/router.options.ts`.

### PIÈGE #2 — Middleware qui oublie le `return` avant `navigateTo`

```ts
// ❌ Redirection silencieusement ignorée
export default defineNuxtRouteMiddleware((to) => {
  if (!isAuth()) {
    navigateTo('/login')    // ← sans return, la navigation CONTINUE quand même !
  }
})

// ✅ return arrête la navigation courante et applique la redirection
export default defineNuxtRouteMiddleware((to) => {
  if (!isAuth()) {
    return navigateTo('/login')
  }
})
```

Le `return navigateTo(...)` est obligatoire pour bloquer la navigation. Sans `return`, le middleware s'exécute mais la navigation originale continue — l'utilisateur atteint la page protégée.

### PIÈGE #3 — Oublier `definePageMeta` pour le middleware ou le layout

```vue
<!-- ❌ middleware déclaré dans setup() — n'a aucun effet -->
<script setup lang="ts">
// Ceci est ignoré — middleware doit être dans definePageMeta
const middleware = 'auth'
</script>

<!-- ✅ definePageMeta est un compilateur macro, traité à la compilation -->
<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})
</script>
```

`definePageMeta` est une **macro compilateur** — elle est traitée par le compilateur Nuxt, pas à l'exécution. Elle doit se trouver au niveau racine de `<script setup>`, sans conditions ni wrapping dans une fonction.

### PIÈGE #4 — `route.params.id` est `string | string[]`, pas `string`

```ts
// ❌ TypeScript autorise mais le type réel peut être string[]
const id = route.params.id  // type : string | string[]

// ✅ Cast explicite pour les segments simples
const id = String(route.params.id)
// OU
const id = route.params.id as string  // acceptable si tu sais que c'est un segment simple
```

Pour les routes catch-all (`[...slug].vue`), `route.params.slug` est toujours `string[]`. Pour les segments simples (`[id].vue`), Vue Router le délivre comme `string` — mais TypeScript expose le type union. Normaliser avec `String()` ou typer explicitement.

### PIÈGE #5 — Confondre `<NuxtPage>` et `<slot />` dans un layout

```vue
<!-- ❌ Utiliser <NuxtPage /> dans un layout -->
<template>
  <div>
    <header>...</header>
    <NuxtPage />  <!-- ← fonctionne mais n'est PAS l'idiome des layouts -->
  </div>
</template>

<!-- ✅ Dans un layout : utiliser <slot /> -->
<template>
  <div>
    <header>...</header>
    <slot />  <!-- ← Nuxt injecte automatiquement la page active ici -->
  </div>
</template>
```

`<NuxtPage />` s'utilise dans `app.vue` ou dans une page parente (routes imbriquées). Dans un fichier `layouts/*.vue`, l'emplacement de la page est `<slot />`.

---

## 5. Ancrage TribuZen

Le routing-fichiers de Nuxt structure le front-office de TribuZen dès les premières pages.

**Structure de pages TribuZen :**

```
pages/
├── index.vue                →  /  (redirect vers /feed si authentifié)
├── login.vue                →  /login  (layout: 'auth', pas de middleware)
├── feed.vue                 →  /feed  (middleware: 'auth', layout: default)
├── profile/
│   ├── index.vue            →  /profile  (middleware: 'auth')
│   ├── info.vue             →  /profile/info
│   └── settings.vue         →  /profile/settings
└── family/
    ├── index.vue            →  /family  (liste des familles)
    └── [id].vue             →  /family/abc123  (détail famille)
```

**Layouts TribuZen :**

```
layouts/
├── default.vue              ← navbar + slot (toutes les pages authentifiées)
└── auth.vue                 ← shell minimaliste (login, register, forgot-password)
```

Le middleware `auth` protège toutes les pages sauf `/login` et `/`. Le layout `auth.vue` supprime la navbar pour les pages de connexion — via `definePageMeta({ layout: 'auth' })`.

La page `/family/[id]` illustre le pattern complet : route dynamique + paramètre lu via `useRoute()` + layout default + middleware auth + `useFetch` pour charger les données famille (module 27).

Fichiers cibles dans `smaurier/tribuzen` :

```
tribuzen/
  pages/
    feed.vue
    profile/
      index.vue
      info.vue
    family/
      [id].vue
  layouts/
    default.vue
    auth.vue
  middleware/
    auth.ts
```

---

## 6. Points clés

1. Fichier dans `pages/` = route automatique — pas de fichier router à maintenir.
2. `[param].vue` crée une route dynamique — `useRoute().params.param` lit la valeur (toujours string en segment simple).
3. Fichier + dossier du même nom = routes imbriquées — la parente doit contenir `<NuxtPage />` pour les enfants.
4. `layouts/default.vue` s'applique à toutes les pages par défaut — `<slot />` est l'emplacement de la page active.
5. `definePageMeta({ layout: 'nom' })` pour changer de layout — `layout: false` pour le désactiver.
6. `<NuxtLink to="/path">` pour la navigation déclarative — génère un `<a>` avec prefetching.
7. `navigateTo('/path')` pour la navigation programmatique — fonctionne client et serveur (utile en middleware).
8. `defineNuxtRouteMiddleware` crée un middleware — `return navigateTo(...)` est obligatoire pour bloquer/rediriger.
9. `pageTransition` dans `nuxt.config.ts` ou `definePageMeta` active les transitions CSS entre pages.
10. `routeRules` dans `nuxt.config.ts` contrôle le mode de rendu par route (SSR, SWR, prerender) — détail module 28.

---

## 7. Seeds Anki

```
Comment créer la route /family/[id] dans Nuxt sans toucher au router ?|Créer le fichier pages/family/[id].vue. Nuxt génère automatiquement la route dynamique. Lire l'id avec : const route = useRoute(); const id = String(route.params.id)
Quelle est la différence entre <slot /> et <NuxtPage /> dans Nuxt ?|<slot /> s'utilise dans les layouts (layouts/*.vue) — Nuxt y injecte la page active. <NuxtPage /> s'utilise dans app.vue ou dans une page parente pour afficher les routes enfants imbriquées.
Pourquoi return navigateTo('/login') et pas juste navigateTo('/login') dans un middleware ?|Sans return, le middleware s'exécute mais la navigation courante CONTINUE — l'utilisateur atteint quand même la page protégée. return arrête la navigation et applique la redirection.
Comment appliquer le layout 'auth' à la page /login ?|Dans pages/login.vue : definePageMeta({ layout: 'auth' }). definePageMeta est une macro compilateur — elle doit être au niveau racine de <script setup>, sans condition.
Quelle convention de nommage Nuxt utilise pour les routes nommées ?|Le chemin du fichier avec des tirets : pages/family/[id].vue → nom 'family-id'. Usage : <NuxtLink :to="{ name: 'family-id', params: { id: '42' } }">
Quelle est la différence entre navigateTo et useRouter().push() dans Nuxt ?|Les deux naviguent côté client. navigateTo fonctionne aussi côté serveur (middlewares SSR) et expose des options Nuxt (redirectCode, external). Préférer navigateTo dans les middlewares et composables universels.
Comment créer un middleware qui s'applique à toutes les pages sans definePageMeta ?|Nommer le fichier avec le suffixe .global : middleware/logger.global.ts. Il s'exécute sur chaque navigation automatiquement.
Comment activer une transition fade entre toutes les pages Nuxt ?|Dans nuxt.config.ts : app: { pageTransition: { name: 'fade', mode: 'out-in' } }. Puis définir les classes CSS .fade-enter-active, .fade-leave-active, .fade-enter-from, .fade-leave-to dans un CSS global.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-26-nuxt-pages-et-layouts/README.md`. Construire les trois pages TribuZen (`/feed`, `/profile`, `/family/[id]`) avec layout par défaut, middleware auth, et navigation `NuxtLink` — dans un projet Nuxt réel. Corrigé complet commenté inclus.

---

*Précédent : [25 — Introduction à Nuxt](25-nuxt-introduction.md)*
