# Lab 14 — Vue Router

> **Outcome :** à la fin, tu sais configurer Vue Router 4 dans une app Vue 3, définir des routes dynamiques, protéger des routes avec un guard `beforeEach`, et naviguer programmatiquement après une action utilisateur.
> **Vrai outil :** Vue Router 4 + Vue 3.5 + Vite (navigateur, HMR, Network tab pour vérifier le lazy loading).
> **Feedback :** le coach valide en session — pas de test-runner auto-correcteur.

---

## Énoncé

Tu construis le routeur du front-office TribuZen. L'objectif : transformer une app Vue vierge en SPA multi-écrans avec authentification simulée.

**Écrans à créer :**

| Route | Composant | Accès |
|-------|-----------|-------|
| `/` | `HomeView.vue` | Public |
| `/login` | `LoginView.vue` | Public |
| `/feed` | `FeedView.vue` | Auth requis |
| `/profile/:userId` | `ProfileView.vue` | Auth requis |
| `/family/:familyId` | `FamilyView.vue` | Auth requis |
| `/:pathMatch(.*)*` | `NotFoundView.vue` | Public |

**Comportements attendus :**

1. Naviguer vers `/feed` sans être connecté redirige vers `/login?redirect=/feed`.
2. Entrer un `userId` dans le champ du composant `ProfileView` change l'URL programmatiquement (`router.push`).
3. Depuis `FamilyView`, lire `familyId` de façon réactive — si l'URL change de `/family/42` à `/family/99` (ex : via un lien `RouterLink`), le composant affiche le nouvel id **sans rechargement**.
4. Tous les composants de vues sont chargés en lazy (`() => import(...)`).

**Authentification simulée (localStorage) :**

```ts
// Helpers à copier dans un fichier src/utils/auth.ts
export function isAuthenticated(): boolean {
  return localStorage.getItem('auth_token') !== null
}

export function fakeLogin(token: string): void {
  localStorage.setItem('auth_token', token)
}

export function fakeLogout(): void {
  localStorage.removeItem('auth_token')
}
```

### Starter minimal

Crée un projet Vite Vue 3 + TypeScript vierge si tu n'en as pas :

```bash
pnpm create vite tribuzen-router --template vue-ts
cd tribuzen-router
pnpm install
pnpm add vue-router@4
pnpm dev
```

Structure de départ :

```
src/
  utils/
    auth.ts          ← coller les helpers ci-dessus
  views/
    HomeView.vue     ← à créer (templates minimalistes, voir ci-dessous)
    LoginView.vue
    FeedView.vue
    ProfileView.vue
    FamilyView.vue
    NotFoundView.vue
  router/
    index.ts         ← à construire — c'est l'exercice principal
  App.vue            ← à modifier pour ajouter <RouterView> + nav
  main.ts            ← à modifier pour brancher le routeur
```

**Templates minimalistes pour chaque vue (copier-coller comme point de départ) :**

```vue
<!-- HomeView.vue -->
<template>
  <div>
    <h1>Accueil TribuZen</h1>
    <RouterLink :to="{ name: 'feed' }">Voir le fil</RouterLink>
  </div>
</template>
```

```vue
<!-- LoginView.vue — starter : compléter la logique dans les étapes -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fakeLogin } from '@/utils/auth'

const router = useRouter()
const route = useRoute()
const token = ref('demo-token-123')

function login(): void {
  fakeLogin(token.value)
  // TODO étape 5 : rediriger vers route.query.redirect ou 'feed'
}
</script>

<template>
  <div>
    <h1>Connexion</h1>
    <input v-model="token" placeholder="token simulé" />
    <button @click="login">Se connecter</button>
  </div>
</template>
```

```vue
<!-- FeedView.vue -->
<template>
  <div>
    <h1>Fil d'actualité</h1>
    <p>Contenu privé — visible seulement si connecté.</p>
    <RouterLink :to="{ name: 'family', params: { familyId: '42' } }">
      Famille 42
    </RouterLink>
  </div>
</template>
```

```vue
<!-- ProfileView.vue — starter : compléter dans les étapes -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
// TODO étape 3 : lire userId depuis route.params de façon réactive
</script>

<template>
  <div>
    <h1>Profil utilisateur</h1>
    <!-- TODO afficher userId -->
  </div>
</template>
```

```vue
<!-- FamilyView.vue — starter : compléter dans les étapes -->
<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
// TODO étape 4 : lire familyId de façon réactive, watcher pour "recharger"
</script>

<template>
  <div>
    <h1>Famille</h1>
    <!-- TODO afficher familyId + lien vers une autre famille -->
  </div>
</template>
```

```vue
<!-- NotFoundView.vue -->
<template>
  <div>
    <h1>404 — Page introuvable</h1>
    <RouterLink :to="{ name: 'home' }">Retour à l'accueil</RouterLink>
  </div>
</template>
```

---

## Étapes (en friction)

1. **Crée `src/router/index.ts`** — importe `createRouter`, `createWebHistory`, `RouteRecordRaw`. Déclare les 6 routes du tableau ci-dessus avec `() => import(...)` pour chaque composant. Ajoute `meta: { requiresAuth: true }` sur les routes privées. Exporte le routeur.

2. **Branche le routeur dans `main.ts`** — `.use(router)` avant `.mount('#app')`. Dans `App.vue`, remplace le contenu du template par une nav avec des `<RouterLink>` + un `<RouterView />`.

3. **Lis `userId` de façon réactive dans `ProfileView.vue`** — `computed(() => route.params.userId as string)`. Affiche-le dans le template. Teste : navigue vers `/profile/alice` puis `/profile/bob` en changeant l'URL à la main dans le navigateur — l'affichage doit changer sans rechargement.

4. **Rends `FamilyView.vue` réactif** — `computed(() => route.params.familyId as string)` + `watch(familyId, (id) => console.log('famille changed:', id), { immediate: true })`. Ajoute dans le template un `<RouterLink>` vers `/family/99` et un vers `/family/42` — en cliquant, le watch se déclenche dans la console.

5. **Ajoute le guard `beforeEach`** dans `router/index.ts` — avant de naviguer vers une route `requiresAuth`, vérifie `isAuthenticated()`. Si non authentifié, retourne `{ name: 'login', query: { redirect: to.fullPath } }`. Dans `LoginView.vue`, après `fakeLogin()`, navigue avec `router.replace(route.query.redirect as string ?? '/feed')`.

6. **Teste le flux complet** :
   - Démarre sans token (ouvre le navigateur en navigation privée ou vide localStorage).
   - Tente d'accéder à `/feed` → doit rediriger vers `/login?redirect=/feed`.
   - Clique "Se connecter" → doit rediriger vers `/feed` (pas vers `/`).
   - Vide `localStorage` (DevTools → Application → Local Storage) → actualise `/feed` → redirection.

7. **Vérifie le lazy loading** — ouvre DevTools → Network → filtre "JS". Navigue vers `/feed` : un chunk supplémentaire doit apparaître. Navigue vers `/family/42` : un autre chunk. Reviens sur `/feed` : aucun nouveau chunk (déjà en cache).

---

## Corrigé complet commenté

### `src/utils/auth.ts`

```ts
// Helpers d'authentification simulée
// En production, remplacé par un store Pinia (module 15)

export function isAuthenticated(): boolean {
  // localStorage.getItem retourne null si la clé n'existe pas
  return localStorage.getItem('auth_token') !== null
}

export function fakeLogin(token: string): void {
  localStorage.setItem('auth_token', token)
}

export function fakeLogout(): void {
  localStorage.removeItem('auth_token')
}
```

### `src/router/index.ts`

```ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { isAuthenticated } from '@/utils/auth'

// Étendre RouteMeta pour typer meta.requiresAuth
// À placer AVANT createRouter — sinon le guard voit RouteMeta sans requiresAuth
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean   // true = route protégée par auth
    title?: string           // titre de l'onglet (bonus)
  }
}

const routes: RouteRecordRaw[] = [
  // ── Routes publiques ─────────────────────────────────────────────────────
  {
    path: '/',
    name: 'home',
    // () => import(...) = lazy loading — Vite crée un chunk séparé
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'Accueil' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'Connexion' },
  },

  // ── Routes privées ───────────────────────────────────────────────────────
  {
    path: '/feed',
    name: 'feed',
    component: () => import('@/views/FeedView.vue'),
    // meta.requiresAuth = true → le guard beforeEach vérifiera l'auth
    meta: { requiresAuth: true, title: 'Fil d\'actualité' },
  },
  {
    path: '/profile/:userId',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true, title: 'Profil' },
  },
  {
    path: '/family/:familyId',
    name: 'family',
    component: () => import('@/views/FamilyView.vue'),
    meta: { requiresAuth: true, title: 'Famille' },
  },

  // ── Catch-all 404 — doit être la dernière route ──────────────────────────
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    // Pas de meta.requiresAuth — la 404 est accessible sans auth
  },
]

const router = createRouter({
  // createWebHistory : URLs propres sans #
  // import.meta.env.BASE_URL : lit la base de vite.config.ts (par défaut '/')
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// ── Guard global beforeEach ───────────────────────────────────────────────
// S'exécute avant CHAQUE navigation — to = destination, from = départ
router.beforeEach((to) => {
  // Mise à jour du titre de l'onglet navigateur
  if (to.meta.title) {
    document.title = `${to.meta.title} | TribuZen`
  }

  // Route publique → pas de vérification
  if (!to.meta.requiresAuth) return

  // Route protégée + non authentifié → redirection vers login
  if (!isAuthenticated()) {
    return {
      name: 'login',
      // fullPath inclut le path + query + hash : /feed?filter=recent
      // Stocké en query pour que LoginView puisse reprendre la navigation
      query: { redirect: to.fullPath },
    }
  }

  // Authentifié → navigation autorisée (return undefined implicite)
})

export default router
```

### `src/main.ts`

```ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App)
  .use(router)   // ← branche le plugin Vue Router
  .mount('#app')
```

### `src/App.vue`

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { isAuthenticated, fakeLogout } from '@/utils/auth'

const router = useRouter()

function logout(): void {
  fakeLogout()
  // replace() : l'utilisateur ne peut pas revenir en arrière vers une page privée
  router.replace({ name: 'home' })
}
</script>

<template>
  <header>
    <nav>
      <!-- RouterLink génère un <a> qui intercepte le clic -->
      <!-- :to avec objet name = résistant aux changements de path -->
      <RouterLink :to="{ name: 'home' }">Accueil</RouterLink>
      <RouterLink :to="{ name: 'feed' }">Fil</RouterLink>
      <RouterLink :to="{ name: 'profile', params: { userId: 'alice' } }">Mon profil</RouterLink>
      <button v-if="isAuthenticated()" @click="logout">Déconnexion</button>
      <RouterLink v-else :to="{ name: 'login' }">Connexion</RouterLink>
    </nav>
  </header>

  <!-- RouterView = slot où le composant de la route active est injecté -->
  <main>
    <RouterView />
  </main>
</template>
```

### `src/views/LoginView.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fakeLogin } from '@/utils/auth'

const router = useRouter()
const route  = useRoute()
const token  = ref('demo-token-123')

function login(): void {
  if (!token.value.trim()) return

  // Simuler la connexion
  fakeLogin(token.value.trim())

  // Lire la destination depuis la query
  // Le guard a stocké : /login?redirect=/feed → route.query.redirect = '/feed'
  const redirect = route.query.redirect as string | undefined

  // replace() : on remplace /login dans l'historique
  // L'utilisateur ne peut pas revenir en arrière vers /login avec Retour
  router.replace(redirect ?? { name: 'feed' })
}
</script>

<template>
  <div>
    <h1>Connexion</h1>
    <p v-if="$route.query.redirect" class="info">
      Connexion requise pour accéder à cette page.
    </p>
    <input v-model="token" placeholder="token simulé" />
    <button @click="login">Se connecter</button>
  </div>
</template>
```

### `src/views/ProfileView.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route  = useRoute()
const router = useRouter()

// ✅ computed sur route.params — réactif si l'URL change
// Sans computed : const { userId } = route.params → string statique non réactive
const userId = computed(() => route.params.userId as string)

// Navigation programmatique : aller vers un autre profil
function goToProfile(id: string): void {
  router.push({ name: 'profile', params: { userId: id } })
}
</script>

<template>
  <div>
    <h1>Profil de {{ userId }}</h1>

    <!-- Liens vers d'autres profils — le computed userId se met à jour -->
    <RouterLink :to="{ name: 'profile', params: { userId: 'alice' } }">Alice</RouterLink>
    <RouterLink :to="{ name: 'profile', params: { userId: 'bob' } }">Bob</RouterLink>

    <!-- Navigation programmatique depuis le code -->
    <button @click="goToProfile('cara')">Voir Cara</button>
  </div>
</template>
```

### `src/views/FamilyView.vue`

```vue
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

interface FamilyPost {
  id: string
  content: string
}

const route    = useRoute()
const posts    = ref<FamilyPost[]>([])
const loading  = ref(false)

// computed = source réactive du familyId courant
// Se met à jour si l'URL change de /family/42 à /family/99 sans démontage
const familyId = computed(() => route.params.familyId as string)

// watch avec immediate: true : couvre le premier chargement ET les navigations
// entre deux routes /family/:id (même composant réutilisé)
watch(familyId, async (id) => {
  loading.value = true
  posts.value = []
  console.log('famille changed:', id)

  // Simulation d'un appel API — en vrai : fetch(`/api/families/${id}/posts`)
  await new Promise<void>(resolve => setTimeout(resolve, 300))
  posts.value = [
    { id: '1', content: `Post de la famille ${id} - message 1` },
    { id: '2', content: `Post de la famille ${id} - message 2` },
  ]
  loading.value = false
}, { immediate: true })
</script>

<template>
  <div>
    <h1>Famille {{ familyId }}</h1>

    <!-- Liens vers d'autres familles — même composant, params différents -->
    <RouterLink :to="{ name: 'family', params: { familyId: '42' } }">Famille 42</RouterLink>
    <RouterLink :to="{ name: 'family', params: { familyId: '99' } }">Famille 99</RouterLink>

    <p v-if="loading">Chargement…</p>
    <ul v-else>
      <li v-for="post in posts" :key="post.id">{{ post.content }}</li>
    </ul>
  </div>
</template>
```

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — 30 minutes, sans ouvrir ce corrigé :**

1. **Guard par role** : ajoute une route `/admin` avec `meta: { requiresAuth: true, role: 'admin' }`. Étends `RouteMeta` avec `role?: 'admin'`. Dans `beforeEach`, si `to.meta.role === 'admin'` et que `localStorage.getItem('user_role') !== 'admin'`, redirige vers `/forbidden`. Crée `ForbiddenView.vue`.

2. **Transition entre routes** : dans `App.vue`, remplace `<RouterView />` par un slot `v-slot="{ Component }"` et enveloppe dans `<Transition name="fade" mode="out-in">`. Ajoute les classes CSS `.fade-enter-from`, `.fade-leave-to` (opacity 0) et `.fade-enter-active`, `.fade-leave-active` (transition 200ms) dans `App.vue` `<style>`.

3. **Titre dynamique** : dans le guard `beforeEach`, si la route n'a pas `meta.title`, construire le titre depuis les params — ex : `/profile/alice` → `Profil alice | TribuZen`.

**Critère de réussite :** les trois points fonctionnent dans le navigateur, le lazy loading est visible dans l'onglet Network, et le bouton Retour du navigateur fonctionne correctement sur toutes les routes.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, le routeur de ce lab est la base du routeur de production :

```
tribuzen/
  src/
    router/
      index.ts      ← corrigé de ce lab, étendu avec Pinia en module 15
    utils/
      auth.ts       ← remplacé par authStore.isAuthenticated (module 15)
    views/
      HomeView.vue
      FeedView.vue
      ProfileView.vue
      FamilyView.vue
      auth/
        LoginView.vue
```

**Différences par rapport au lab :**

- `isAuthenticated()` lira `authStore.isAuthenticated` depuis Pinia — pas `localStorage` directement.
- `FamilyView.vue` sera remplacé par `FamilyLayout.vue` + routes enfants (membres, settings) — voir la section routes imbriquées du module.
- `fakeLogin` sera remplacé par un appel API réel + stockage du JWT dans Pinia.

**Commit cible :**

```
feat(router): config routes TribuZen — lazy, guard auth, params réactifs
```
