---
titre: Vue Router
cours: 02-vue
notions: [createRouter et history mode, scrollBehavior, routes et composants, routes dynamiques et params, routes imbriquées, navigation programmatique, navigation guards beforeEach, afterEach, meta et contrôle d'accès, lazy loading des routes, RouterLink et RouterView, onBeforeRouteUpdate, onBeforeRouteLeave]
outcomes:
  - sait configurer Vue Router (routes, history mode) dans une app Vue 3
  - sait créer des routes dynamiques et lire les params de façon réactive
  - sait protéger des routes avec un navigation guard (auth)
  - sait charger les composants de route en lazy pour la perf
prerequis: [13-transitions-et-animations]
next: 15-pinia
libs: [{ name: vue, version: "3.5" }, { name: vue-router, version: "4" }]
tribuzen: front-office TribuZen — routes /family/[id], /profile/[userId], /feed avec guard d'authentification et lazy loading
last-reviewed: 2026-07
---

# Vue Router

> **Outcomes — tu sauras FAIRE :** configurer Vue Router 4 dans une app Vue 3, créer des routes dynamiques et lire leurs params de façon réactive, protéger des routes avec un guard `beforeEach`, charger les composants de route en lazy pour la perf.
> **Difficulté :** :star::star::star:

---

## 1. Cas concret d'abord

Tu rejoins l'équipe TribuZen. L'app a actuellement un seul fichier `App.vue` qui affiche tout. Ta première tâche : transformer ça en vraie SPA avec plusieurs écrans — le fil d'actualité `/feed`, les profils `/profile/userId`, les pages famille `/family/familyId` — et protéger toutes ces routes derrière une authentification.

Voici le problème que tu poses dès le départ :

```ts
// main.ts — AVANT Vue Router : tout dans App.vue, pas de navigation possible
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
// L'URL reste "/" quelle que soit la "page" affichée.
// Le bouton Retour du navigateur ne fonctionne pas.
// Un lien externe vers /family/42 affiche une 404 (ou toujours l'accueil).
```

**Trois problèmes concrets sans routeur :**

1. Pas de lien partageable vers une famille ou un profil — l'URL ne reflète pas l'état de l'UI.
2. Le bouton Retour du navigateur est cassé — l'historique de navigation n'existe pas.
3. Impossible de protéger `/feed` pour les non-connectés — il n'existe pas en tant que "route".

Ce module installe Vue Router 4, définit les routes TribuZen, protège les routes privées avec un guard, et charge les composants à la demande (lazy loading).

---

## 2. Théorie complète, concise

### 2.1 `createRouter` et history mode

Vue Router 4 s'installe via npm et se crée avec `createRouter()`. Le choix du **history mode** détermine la forme des URLs.

```bash
pnpm add vue-router@4
```

```ts
// router/index.ts
import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', component: () => import('@/views/HomeView.vue') },
]

// Mode History — URLs propres : /feed, /family/42
// Nécessite que le serveur renvoie index.html pour TOUTES les routes
const router = createRouter({
  history: createWebHistory(),   // ← URLs propres, recommandé
  routes,
})

// Mode Hash — URLs avec # : /#/feed, /#/family/42
// Fonctionne sans configuration serveur (statique, Electron, file://)
// const router = createRouter({ history: createWebHashHistory(), routes })

export default router
```

**`createWebHistory(base?)`** — accepte une `base` optionnelle pour les apps déployées sous un sous-chemin :

```ts
// App déployée sur https://example.com/tribuzen/
createWebHistory('/tribuzen/')
```

**`createWebHashHistory()`** — le hash (`#`) sépare le chemin côté navigateur du chemin réel envoyé au serveur. Aucune configuration serveur nécessaire. Inconvénients : mauvais SEO, URL moins propre.

Le routeur se branche sur l'app avec `.use()` :

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App)
  .use(router)   // ← installation du plugin
  .mount('#app')
```

### 2.2 Routes et composants

Chaque route est un objet `RouteRecordRaw` qui associe un **`path`** à un **`component`** (et optionnellement un `name`).

```ts
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',                                        // nom de route (optionnel mais recommandé)
    component: () => import('@/views/HomeView.vue'),     // lazy — voir 2.8
  },
  {
    path: '/feed',
    name: 'feed',
    component: () => import('@/views/FeedView.vue'),
    meta: { requiresAuth: true },                        // voir 2.7
  },
  {
    path: '/:pathMatch(.*)*',                            // catch-all — 404
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]
```

Le `name` permet de naviguer par nom plutôt que par chemin — si le path change, les liens nommés continuent à fonctionner.

### 2.3 Routes dynamiques et params

Un segment précédé de `:` est un **paramètre dynamique** — il capture n'importe quelle valeur à cette position.

```ts
// router/index.ts
const routes: RouteRecordRaw[] = [
  {
    path: '/family/:familyId',          // :familyId est dynamique
    name: 'family',
    component: () => import('@/views/FamilyView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/:userId',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
]
```

Dans le composant, on lit les params via `useRoute()` :

```vue
<!-- FamilyView.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// ✅ computed — réactif si l'URL change sans démontage du composant
// (ex : navigation /family/42 → /family/99 avec les mêmes paramètres nommés)
const familyId = computed(() => route.params.familyId as string)
</script>

<template>
  <h1>Famille {{ familyId }}</h1>
</template>
```

`route.params` est **toujours une `string` ou `string[]`** — pas de number automatique. La conversion (`Number(route.params.id)`) est à la charge du composant.

**Params optionnels** avec `?` :

```ts
path: '/family/:familyId/member/:memberId?'
// /family/42/member/7  → memberId = "7"
// /family/42/member    → memberId = undefined
```

**Paramètre qui capture tout** (catch-all) :

```ts
path: '/:pathMatch(.*)*'   // ← les deux * sont nécessaires pour les slashes imbriqués
```

### 2.4 Routes imbriquées

Les routes imbriquées (`children`) permettent de composer un layout parent qui reste visible pendant que le contenu enfant change — pattern standard pour les dashboards et les sections d'app.

```ts
// router/index.ts
const routes: RouteRecordRaw[] = [
  {
    path: '/family/:familyId',
    name: 'family',
    component: () => import('@/views/FamilyLayout.vue'),   // ← layout parent
    meta: { requiresAuth: true },
    children: [
      {
        path: '',                                           // /family/:familyId
        name: 'family-feed',
        component: () => import('@/views/FamilyFeedView.vue'),
      },
      {
        path: 'members',                                   // /family/:familyId/members
        name: 'family-members',
        component: () => import('@/views/FamilyMembersView.vue'),
      },
      {
        path: 'settings',                                  // /family/:familyId/settings
        name: 'family-settings',
        component: () => import('@/views/FamilySettingsView.vue'),
        meta: { requiresAuth: true, role: 'admin' },
      },
    ],
  },
]
```

Le composant parent **doit contenir un `<RouterView>`** pour afficher ses enfants :

```vue
<!-- FamilyLayout.vue -->
<template>
  <div class="family-layout">
    <nav class="family-nav">
      <!-- :to avec name + params — résistant aux changements de path -->
      <RouterLink :to="{ name: 'family-feed', params: { familyId } }">Fil</RouterLink>
      <RouterLink :to="{ name: 'family-members', params: { familyId } }">Membres</RouterLink>
      <RouterLink :to="{ name: 'family-settings', params: { familyId } }">Paramètres</RouterLink>
    </nav>

    <!-- Zone de contenu enfant — le composant enfant actif s'affiche ici -->
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const familyId = computed(() => route.params.familyId as string)
</script>
```

### 2.5 Navigation programmatique

`useRouter()` donne accès à l'instance du routeur pour naviguer depuis le code (après soumission de formulaire, après login, etc.).

```ts
import { useRouter } from 'vue-router'

const router = useRouter()

// push() — ajoute une entrée dans l'historique (retour possible)
router.push('/feed')
router.push({ name: 'family', params: { familyId: '42' } })
router.push({ name: 'feed', query: { filter: 'recent' } })  // /feed?filter=recent

// replace() — remplace l'entrée courante (pas de retour possible)
// Cas d'usage : redirection après login — on ne veut pas que "Retour" ramène à /login
router.replace({ name: 'feed' })

// Historique navigateur
router.back()      // ← équivalent bouton Retour
router.forward()   // → équivalent bouton Suivant
router.go(-2)      // reculer de 2 entrées dans l'historique
```

**`push()` retourne une `Promise`** — elle se résout quand la navigation est complète ou échoue si un guard la bloque :

```ts
async function login(): Promise<void> {
  await authStore.login(credentials)
  // replace pour ne pas que "Retour" ramène à la page de login
  await router.replace({ name: 'feed' })
}
```

### 2.6 Navigation guards — `beforeEach`

Les guards sont des hooks exécutés avant (ou après) chaque navigation. Le guard global `beforeEach` est le plus courant — il intercepte **toutes les navigations**.

**Vue Router 4 — API retour** (différent de v3 où on appelait `next()`) :

```ts
// router/index.ts — à placer après createRouter(...)
router.beforeEach((to, from) => {
  // to   — RouteLocationNormalized : route de destination
  // from — RouteLocationNormalized : route de départ

  const token = localStorage.getItem('auth_token')
  const isAuthenticated = token !== null

  // Autoriser sans condition : login, accueil public
  if (to.name === 'login' || to.name === 'home') {
    return true    // ou undefined — laisse passer
  }

  // Route protégée + non authentifié → redirection
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
    // query.redirect permet de reprendre la destination après login
  }

  // Pas de return (ou return true) → navigation autorisée
})
```

**Valeurs de retour valides dans Vue Router 4 :**

| Retour | Effet |
|--------|-------|
| `undefined` ou `true` | Navigation autorisée |
| `false` | Navigation annulée |
| `{ name: 'login' }` ou une string | Redirection |

### 2.7 Meta et contrôle d'accès

`meta` est un objet arbitraire attaché à chaque route. Par défaut `RouteMeta` est `{}` — on l'étend via declaration merging TypeScript.

```ts
// router/types.ts — ou dans router/index.ts, avant createRouter
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean          // route protégée par authentification
    role?: 'admin' | 'member'      // rôle minimum requis
    title?: string                  // titre de l'onglet navigateur
  }
}
```

```ts
// Exemple d'utilisation dans le guard
router.beforeEach((to, from) => {
  // Mise à jour du titre de l'onglet depuis meta.title
  if (to.meta.title) {
    document.title = `${to.meta.title} | TribuZen`
  }

  if (to.meta.requiresAuth && !isAuthenticated()) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.role === 'admin' && !isAdmin()) {
    return { name: 'forbidden' }
  }
})
```

**Guard par route — `beforeEnter`** : logique spécifique à une seule route, sans polluer le guard global.

```ts
{
  path: '/family/:familyId/settings',
  name: 'family-settings',
  component: () => import('@/views/FamilySettingsView.vue'),
  meta: { requiresAuth: true },
  beforeEnter: (to) => {
    const familyId = to.params.familyId as string
    if (!userCanManageFamily(familyId)) {
      return { name: 'family-feed', params: { familyId } }
    }
  },
}
```

### 2.8 Lazy loading des routes

Sans lazy loading, Vite groupe tous les composants dans un seul bundle — l'utilisateur télécharge tout l'app au premier chargement, même les pages qu'il ne visitera jamais.

Avec lazy loading, chaque `() => import(...)` crée un **chunk séparé** que le navigateur ne télécharge que si la route est visitée.

```ts
// ❌ Import synchrone — le composant est dans le bundle principal
import FamilyView from '@/views/FamilyView.vue'
const routes = [{ path: '/family/:id', component: FamilyView }]

// ✅ Import dynamique — chunk séparé, chargé à la demande
const routes: RouteRecordRaw[] = [
  { path: '/family/:id', component: () => import('@/views/FamilyView.vue') },
]
```

**Grouper des chunks par feature** avec le commentaire Vite/Rollup `/* @vite-chunk-name: ... */` :

```ts
// Magic comment Vite/Rollup pour nommer explicitement les chunks (optionnel)
{
  path: '/family/:familyId/settings',
  component: () => import(/* @vite-chunk-name: "family" */ '@/views/FamilySettingsView.vue'),
}
```

En pratique, Vite crée automatiquement des chunks par import dynamique — le commentaire n'est utile que pour nommer explicitement les chunks dans les outils d'analyse de bundle (`vite build --report`).

### 2.9 RouterLink et RouterView

**`<RouterLink>`** remplace `<a href>` pour la navigation interne. Il intercepte le clic, empêche le rechargement de page, et met à jour l'URL via l'API History.

```vue
<template>
  <!-- ✅ RouterLink — navigation SPA sans rechargement -->
  <RouterLink to="/feed">Fil d'actualité</RouterLink>

  <!-- ✅ :to avec objet — recommandé pour les routes nommées + params -->
  <RouterLink :to="{ name: 'family', params: { familyId: '42' } }">
    Ma famille
  </RouterLink>

  <!-- ✅ active-class — classe appliquée quand la route est active -->
  <!-- Par défaut Vue Router applique .router-link-active (match partiel) -->
  <!-- et .router-link-exact-active (match exact) -->
  <RouterLink
    :to="{ name: 'feed' }"
    active-class="nav-active"
    exact-active-class="nav-exact-active"
  >
    Fil
  </RouterLink>
</template>
```

**Différence `router-link-active` vs `router-link-exact-active` :**

- `router-link-active` — s'applique si le path courant **commence par** le `to` du lien. Un lien `to="/"` est actif sur TOUTES les routes.
- `router-link-exact-active` — s'applique seulement si le path courant correspond **exactement** au `to`.

```vue
<!-- Pour les liens racines, toujours utiliser exactement le path : -->
<RouterLink to="/" exact-active-class="active">Accueil</RouterLink>
```

**`<RouterView>`** est le slot où le composant de la route active est rendu. Il peut recevoir des props via l'attribut `v-slot` :

```vue
<!-- App.vue -->
<template>
  <header>
    <nav>
      <RouterLink :to="{ name: 'feed' }">Fil</RouterLink>
    </nav>
  </header>

  <!-- RouterView simple -->
  <RouterView />

  <!-- RouterView avec transition (module 13) -->
  <RouterView v-slot="{ Component }">
    <Transition name="fade" mode="out-in">
      <component :is="Component" :key="route.fullPath" />
    </Transition>
  </RouterView>
</template>
```

### 2.10 `afterEach` et `scrollBehavior`

**`afterEach`** s'exécute après chaque navigation réussie. Contrairement à `beforeEach`, il ne peut ni bloquer ni rediriger — uniquement observer. Usage principal : analytics, mise à jour de titre, logging des échecs.

```ts
// router/index.ts — à placer après createRouter(...)
router.afterEach((to, from, failure) => {
  // Mise à jour du titre depuis meta.title
  if (to.meta.title) {
    document.title = `${to.meta.title} | TribuZen`
  }

  // Troisième argument optionnel — NavigationFailure si la navigation a été bloquée
  if (failure) {
    console.warn('[Router] navigation bloquée vers', to.fullPath, failure.type)
  }
})
```

**`scrollBehavior`** — option de `createRouter()` qui contrôle le scroll lors des navigations. Sans cette option Vue Router préserve la position — comportement différent d'un rechargement de page classique.

```ts
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // savedPosition est non-null quand l'utilisateur clique Retour/Suivant
    if (savedPosition) {
      return savedPosition                             // restaure la position mémorisée
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }      // scroll vers l'ancre
    }
    return { top: 0 }                                 // haut de page à chaque navigation
  },
})
```

### 2.11 Guards in-component — `onBeforeRouteUpdate` et `onBeforeRouteLeave`

Ces deux hooks s'importent depuis `'vue-router'` et se déclarent dans `<script setup>`. Ils agissent sur le composant actif sans polluer le guard global.

**`onBeforeRouteLeave`** — déclenché quand l'utilisateur va quitter le composant. Cas typique : formulaire à moitié rempli — demander une confirmation avant de perdre les données.

**`onBeforeRouteUpdate`** — déclenché quand la route change mais que le composant est réutilisé (mêmes paramètres nommés, valeurs différentes). Cas typique : navigation de `/family/42` vers `/family/99`.

```vue
<!-- InviteForm.vue — protection contre la perte de données non soumises -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'

const email = ref('')
const isDirty = computed(() => email.value.length > 0)

// Guard leave — intercepte avant le démontage du composant
onBeforeRouteLeave((to, from) => {
  if (isDirty.value) {
    const confirmed = window.confirm(
      'Des données non enregistrées seront perdues. Quitter quand même ?'
    )
    if (!confirmed) return false   // false = annule la navigation
  }
  // return undefined = laisse passer
})

// Guard update — rechargement des données si les params changent
onBeforeRouteUpdate(async (to, from) => {
  // Même composant réutilisé, familyId différent → recharger
  if (to.params.familyId !== from.params.familyId) {
    await loadFamilyData(to.params.familyId as string)
  }
})

async function loadFamilyData(familyId: string): Promise<void> {
  // fetch /api/families/:familyId ...
}
</script>
```

**Résumé des guards disponibles dans Vue Router 4 :**

| Guard | Portée | Déclaré dans |
|-------|--------|--------------|
| `router.beforeEach` | Global — toutes les navigations | `router/index.ts` |
| `router.afterEach` | Global — post-navigation | `router/index.ts` |
| `beforeEnter` | Par route | Objet `RouteRecordRaw` |
| `onBeforeRouteUpdate` | In-component (réutilisation) | `<script setup>` |
| `onBeforeRouteLeave` | In-component (quitter) | `<script setup>` |

---

## 3. Worked examples

### Exemple 1 — Configuration complète du routeur TribuZen

On construit le routeur complet avec toutes les routes TribuZen : accueil public, fil d'actualité protégé, pages famille imbriquées, profil, et 404.

```ts
// router/index.ts — TribuZen complet
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// Typage étendu de meta — à placer avant createRouter
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    role?: 'admin' | 'member'
    title?: string
  }
}

const routes: RouteRecordRaw[] = [
  // ── Routes publiques ──────────────────────────────────────────
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'Accueil' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { title: 'Connexion' },
  },

  // ── Routes privées — requiresAuth ─────────────────────────────
  {
    path: '/feed',
    name: 'feed',
    component: () => import('@/views/FeedView.vue'),
    meta: { requiresAuth: true, title: 'Fil d\'actualité' },
  },
  {
    path: '/profile/:userId',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true, title: 'Profil' },
  },

  // ── Section famille — routes imbriquées ───────────────────────
  {
    path: '/family/:familyId',
    component: () => import('@/views/family/FamilyLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',                          // /family/:familyId
        name: 'family-feed',
        component: () => import('@/views/family/FamilyFeedView.vue'),
        meta: { title: 'Famille — Fil' },
      },
      {
        path: 'members',                   // /family/:familyId/members
        name: 'family-members',
        component: () => import('@/views/family/FamilyMembersView.vue'),
        meta: { title: 'Famille — Membres' },
      },
      {
        path: 'settings',                  // /family/:familyId/settings
        name: 'family-settings',
        component: () => import('@/views/family/FamilySettingsView.vue'),
        meta: { requiresAuth: true, role: 'admin', title: 'Famille — Paramètres' },
        beforeEnter: (to) => {
          // Guard local : vérification du rôle admin dans la famille
          // En pratique, vient de Pinia (module 15)
          const isAdmin = localStorage.getItem('family_role') === 'admin'
          if (!isAdmin) {
            return { name: 'family-feed', params: to.params }
          }
        },
      },
    ],
  },

  // ── 404 ───────────────────────────────────────────────────────
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Page introuvable' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ── Guard global ──────────────────────────────────────────────
router.beforeEach((to) => {
  // Mise à jour du titre de l'onglet
  document.title = to.meta.title ? `${to.meta.title} | TribuZen` : 'TribuZen'

  const isAuthenticated = localStorage.getItem('auth_token') !== null

  if (to.meta.requiresAuth && !isAuthenticated) {
    // Sauvegarder la destination pour rediriger après login
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }
})

export default router
```

**Ce qu'on observe dans ce fichier :**
- `declare module 'vue-router'` étend `RouteMeta` — `to.meta.requiresAuth` est typé.
- Toutes les routes utilisent `() => import(...)` — zéro import synchrone.
- Le guard global gère l'auth ; `beforeEnter` sur `family-settings` gère le rôle.
- Le `redirect: to.fullPath` dans la query permet au composant Login de reprendre la navigation après connexion.

### Exemple 2 — FamilyFeedView réactif aux changements de params

Situation : l'utilisateur navigue de `/family/42` vers `/family/99`. Vue Router **réutilise** le composant (même composant, params différents) — le `created`/`onMounted` ne se redéclenche pas. Il faut réagir aux changements de params.

```vue
<!-- FamilyFeedView.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

interface FamilyPost {
  id: string
  content: string
  authorName: string
  createdAt: string
}

const route = useRoute()
const posts = ref<FamilyPost[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// computed — source de vérité réactive pour le familyId courant
const familyId = computed(() => route.params.familyId as string)

async function fetchPosts(id: string): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const res = await fetch(`/api/families/${id}/posts`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    posts.value = await res.json()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erreur réseau'
  } finally {
    loading.value = false
  }
}

// watch sur computed — se déclenche au montage ET à chaque changement de familyId
// immediate: true remplace le appel manuel dans onMounted
watch(familyId, (newId) => {
  fetchPosts(newId)
}, { immediate: true })
</script>

<template>
  <div>
    <p v-if="loading">Chargement…</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <ul v-else-if="posts.length > 0">
      <li v-for="post in posts" :key="post.id">
        <strong>{{ post.authorName }}</strong> — {{ post.content }}
      </li>
    </ul>
    <p v-else>Aucune publication dans cette famille.</p>
  </div>
</template>
```

**Ce que montre cet exemple :**
- `watch(familyId, fn, { immediate: true })` couvre à la fois le montage initial et les navigations entre familles — pas besoin de `onMounted` séparé.
- `familyId` est un `computed` sur `route.params.familyId` — si on avait destructuré `const { params } = route`, on aurait perdu la réactivité.
- `posts` et `loading` sont réinitialisés dans `fetchPosts` — le composant ne garde pas de données de la famille précédente pendant le chargement.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Déstructurer `route.params` et perdre la réactivité

```ts
import { useRoute } from 'vue-router'

const route = useRoute()

// ❌ Déstructuration — familyId est une string statique, pas réactive
const { familyId } = route.params
// Si l'URL change de /family/42 à /family/99, familyId reste "42"

// ✅ Lire via computed — réactif aux changements d'URL
const familyId = computed(() => route.params.familyId as string)

// ✅ Ou lire directement route.params.familyId dans le template
// (route est réactive, donc le template se met à jour)
```

**Pourquoi ça arrive :** `route` est un objet réactif, mais `route.params` est un objet JS ordinaire. En déstructurant, on crée une référence vers la valeur au moment de la déstructuration — la réactivité est perdue.

### PIÈGE #2 — Guard `beforeEach` qui ne retourne rien et bloque tout

Dans Vue Router 3, le guard appelait `next()`. Vue Router 4 utilise le **retour de valeur**. Oublier le comportement par défaut entraîne des navigations inattendues.

```ts
// ❌ Piège courant — le code retourne undefined implicitement dans TOUS les cas
// quand le if est false, undefined = autoriser → ok, mais c'est fragile
router.beforeEach((to, from) => {
  if (to.meta.requiresAuth) {
    // ... oups, on a oublié le cas "auth ok" qui devrait passer
    if (!isAuthenticated()) return { name: 'login' }
    // Pas de return ici → undefined → navigation autorisée (correct mais implicite)
  }
  // Pas de return → undefined → navigation autorisée (correct)
})

// ✅ Être explicite sur les cas — plus lisible et maintenable
router.beforeEach((to) => {
  if (!to.meta.requiresAuth) return   // route publique → pas de vérification
  if (isAuthenticated()) return        // authentifié → autorisé
  return { name: 'login', query: { redirect: to.fullPath } }  // sinon → login
})
```

**Note Vue Router 3 → 4 :** `next()` existe encore mais est déprécié. Ne pas mélanger `next()` et `return` dans le même guard.

### PIÈGE #3 — Import synchrone — bye bye le code splitting

```ts
// ❌ Import statique — le composant est dans le bundle principal (chargé au démarrage)
import FamilySettingsView from '@/views/family/FamilySettingsView.vue'

const routes = [
  { path: '/family/:id/settings', component: FamilySettingsView },
]

// ✅ Import dynamique — chunk séparé, chargé seulement si la route est visitée
const routes: RouteRecordRaw[] = [
  {
    path: '/family/:id/settings',
    component: () => import('@/views/family/FamilySettingsView.vue'),
  },
]
```

**Impact concret :** sur TribuZen, les pages admin et settings ne sont visitées que par les admins. Les charger pour tous les utilisateurs augmente le bundle inutilement. Avec lazy loading, le JS de ces pages est téléchargé uniquement à la première visite.

### PIÈGE #4 — Confondre `useRoute()` et `useRouter()`

```ts
import { useRoute, useRouter } from 'vue-router'

const route  = useRoute()   // ← l'objet route COURANT (params, query, meta, fullPath…)
const router = useRouter()  // ← l'instance du ROUTEUR pour naviguer

// useRoute : lecture des infos de la route
const id = route.params.id     // ✅
route.push('/foo')              // ❌ TypeError — route n'a pas push()

// useRouter : navigation
router.push({ name: 'feed' })  // ✅
const meta = router.meta       // ❌ router n'a pas meta (c'est sur route)
```

**Mémo :** `useRoute` = **R**ead (lire la route), `useRouter` = **R**oute**r** (naviguer).

### PIÈGE #5 — `createWebHistory()` sans base produit des 404 en production

```ts
// createWebHistory() sans argument suppose que l'app est à la racine du domaine
const router = createRouter({ history: createWebHistory() })

// Si déployé sur https://example.com/tribuzen/
// les routes /feed pointent vers https://example.com/feed → 404 serveur

// ✅ Passer la base
const router = createRouter({
  history: createWebHistory('/tribuzen/'),
})

// ✅ Ou lire depuis Vite (base configurée dans vite.config.ts)
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
})
```

---

## 5. Ancrage TribuZen

Vue Router 4 est la colonne vertébrale de navigation du front-office TribuZen. Les routes définies dans ce module sont les routes réelles du produit.

**Structure de navigation TribuZen :**

```
/                    → HomeView.vue      (public)
/login               → LoginView.vue     (public)
/feed                → FeedView.vue      (auth requis)
/profile/:userId     → ProfileView.vue   (auth requis)
/family/:familyId
  ├── (index)        → FamilyFeedView.vue   (auth requis)
  ├── /members       → FamilyMembersView.vue
  └── /settings      → FamilySettingsView.vue (admin seulement)
```

**Guard `beforeEach` + Pinia (module 15) :** en production, le guard lira l'état d'auth depuis le store Pinia (`authStore.isAuthenticated`) plutôt que `localStorage` — Pinia est la source de vérité de l'état utilisateur. Dans ce module, `localStorage` simule.

**Lazy loading :** toutes les vues TribuZen sont chargées en `() => import(...)`. L'accueil public et le login sont dans le bundle principal ; toutes les vues privées (feed, family, profile) sont des chunks séparés — l'utilisateur non connecté ne télécharge jamais ces fichiers.

**Pattern post-login :** quand le guard redirige vers `/login?redirect=/family/42`, le composant `LoginView.vue` lit `route.query.redirect` et appelle `router.replace(route.query.redirect)` après connexion réussie — l'utilisateur arrive directement sur sa destination initiale.

Fichiers cibles dans `smaurier/tribuzen` :

```
tribuzen/
  src/
    router/
      index.ts          ← Exemple 1 de ce module
    views/
      HomeView.vue
      FeedView.vue
      ProfileView.vue
      auth/
        LoginView.vue
      family/
        FamilyLayout.vue
        FamilyFeedView.vue   ← Exemple 2 de ce module
        FamilyMembersView.vue
        FamilySettingsView.vue
```

---

## 6. Points clés

1. `createRouter()` + `createWebHistory()` crée un routeur SPA avec des URLs propres — `createWebHashHistory()` pour les apps sans serveur.
2. Chaque route est un objet `RouteRecordRaw` avec `path`, `name`, `component`, `meta` optionnels.
3. `:param` dans un path capture une valeur dynamique — `route.params.param` retourne toujours une string.
4. Ne jamais déstructurer `route.params` — utiliser `computed(() => route.params.id)` pour garder la réactivité.
5. `children: []` définit des routes imbriquées — le composant parent doit avoir un `<RouterView>` intérieur.
6. `useRouter().push()` navigue (historique préservé), `.replace()` remplace l'entrée courante (pas de retour).
7. `beforeEach(to => { ... })` intercepte toutes les navigations — retourner `false` bloque, retourner un objet route redirige.
8. `meta.requiresAuth` est le pattern standard pour marquer les routes protégées — étendre `RouteMeta` via declare module pour le typage.
9. `() => import('@/views/Foo.vue')` crée un chunk Vite séparé chargé à la première visite de la route.
10. `<RouterLink>` est la balise `<a>` de la SPA — ajoute automatiquement `.router-link-active` et `.router-link-exact-active`.
11. `afterEach(to, from, failure)` s'exécute après chaque navigation réussie — pour analytics et logging ; ne peut pas bloquer ni rediriger.
12. `scrollBehavior(to, from, savedPosition)` dans `createRouter()` contrôle la position du scroll — `{ top: 0 }` pour toujours commencer en haut, `savedPosition` pour restaurer la position lors du retour arrière.
13. `onBeforeRouteLeave` protège un formulaire non sauvegardé (retourner `false` annule la navigation) ; `onBeforeRouteUpdate` recharge les données quand les params changent sans démonter le composant.

---

## 7. Seeds Anki

```
Quelle est la différence entre createWebHistory et createWebHashHistory ?|createWebHistory génère des URLs propres (/feed) et nécessite que le serveur renvoie index.html pour toutes les routes. createWebHashHistory utilise le hash (#/feed) et fonctionne sans configuration serveur.
Pourquoi ne pas déstructurer route.params ?|route est un objet réactif mais ses propriétés ne le sont pas après déstructuration. const { id } = route.params crée une string statique. Il faut computed(() => route.params.id) pour garder la réactivité lors des navigations entre routes de même composant.
Quelle est la valeur de retour d'un guard beforeEach pour bloquer, rediriger, ou autoriser ?|false bloque la navigation. Un objet route comme { name: 'login' } redirige. undefined ou true autorise. Ne pas utiliser next() — Vue Router 4 utilise le retour de valeur.
Comment définir des routes imbriquées (nested) ?|Ajouter un tableau children dans la route parente. Le composant parent doit contenir <RouterView /> pour afficher l'enfant actif. path vide dans children correspond à l'URL de la route parente.
Quelle est la différence entre useRoute() et useRouter() ?|useRoute() retourne la route courante en lecture (params, query, meta, fullPath). useRouter() retourne l'instance du routeur pour naviguer (push, replace, back). Mémo : Route = Read, Router = navigate.
Comment activer le lazy loading d'un composant de route ?|Utiliser () => import('@/views/FooView.vue') comme valeur de component — au lieu d'un import statique. Vite crée un chunk JS séparé chargé uniquement à la première visite de la route.
Comment protéger une route avec meta.requiresAuth ?|1. Ajouter meta: { requiresAuth: true } sur la route. 2. Étendre RouteMeta via declare module 'vue-router' { interface RouteMeta { requiresAuth?: boolean } }. 3. Dans beforeEach, vérifier to.meta.requiresAuth et rediriger si non authentifié.
Quel est le rôle de router.replace() vs router.push() ?|push() ajoute une entrée dans l'historique (bouton Retour disponible). replace() remplace l'entrée courante sans créer d'historique. Cas d'usage de replace : redirection après login — on ne veut pas que Retour ramène à la page de connexion.
Que font onBeforeRouteLeave et onBeforeRouteUpdate dans Vue Router 4 ?|onBeforeRouteLeave — déclenché quand le composant va être quitté (retourner false annule la navigation — protège un formulaire non sauvegardé). onBeforeRouteUpdate — déclenché quand la route change mais que le composant est réutilisé (params différents) — recharger les données sans redémonter.
Comment contrôler la position du scroll lors des navigations Vue Router ?|Définir scrollBehavior(to, from, savedPosition) dans createRouter(). Retourner savedPosition pour restaurer la position lors du retour arrière. Retourner { top: 0 } pour toujours commencer en haut de page. Retourner { el: to.hash, behavior: 'smooth' } pour scroller vers une ancre.
```

---

## Pont vers le lab

> Lab associé : `02-vue/labs/lab-14-vue-router/README.md`. Pratique guidée — configurer le routeur TribuZen, protéger les routes avec un guard, naviguer programmatiquement après login. Corrigé complet commenté inclus.

---

← [Module 13 — Transitions et animations](13-transitions-et-animations.md) | → Module 15 — Pinia
