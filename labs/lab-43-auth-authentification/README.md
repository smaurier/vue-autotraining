# Lab 43 — Authentification

> **Outcome :** à la fin, tu sais implémenter `useAuthStore` (Pinia), un guard `requiresAuth`, et le retry automatique sur 401 avec MSW comme serveur mock — sans backend réel.
> **Vrai outil :** Vue 3.5 + Pinia 2 + Vue Router 4 + MSW 2 (Mock Service Worker).
> **Feedback :** le coach valide le comportement dans le navigateur (redirections, retry silencieux, déconnexion) — pas de test-runner auto-correcteur.

---

## Énoncé

Tu construis le socle d'authentification de TribuZen. Voici le cahier des charges exact :

1. `useAuthStore` (Pinia setup syntax) stocke `accessToken` en mémoire et `user` en état.
2. `login({ email, password })` appelle `POST /api/auth/login`, remplit le store.
3. `logout()` appelle `POST /api/auth/logout`, vide le store, redirige vers `/login`.
4. Un guard `beforeEach` redirige vers `/login?redirect=<url>` si `requiresAuth: true` et non connecté.
5. `authFetch` retente la requête originale après un refresh silencieux sur 401.
6. MSW intercepte tous les endpoints auth — pas de serveur réel nécessaire.

**Endpoints mockés par MSW :**

| Méthode | URL | Réponse succès | Réponse erreur |
|---------|-----|----------------|----------------|
| POST | `/api/auth/login` | `{ accessToken, user }` | `401 { message: 'Identifiants invalides' }` |
| POST | `/api/auth/refresh` | `{ accessToken, user }` | `401 {}` |
| POST | `/api/auth/logout` | `204` | — |
| GET | `/api/me` | `{ id, name, email, role }` | `401 {}` (si pas de token) |

**Pas de gap-fill** — le starter ci-dessous te donne la structure de fichiers. Tu écris le contenu.

### Starter minimal

Dans ton projet Vite Vue 3 (pnpm create vite@latest tribuzen-auth -- --template vue-ts) :

```
src/
  stores/
    auth.ts          ← à créer
  utils/
    authFetch.ts     ← à créer
  router/
    index.ts         ← à compléter (guard + routes)
  mocks/
    handlers.ts      ← à créer (MSW handlers)
    browser.ts       ← à créer (MSW worker setup)
  pages/
    LoginPage.vue    ← à créer
    DashboardPage.vue ← à créer
  main.ts            ← à modifier (MSW + refresh silencieux au démarrage)
  App.vue            ← déjà présent (router-view)
```

Installation des dépendances :

```bash
pnpm add pinia vue-router@4
pnpm add -D msw@2
pnpm dlx msw init public/ --save
```

---

## Étapes (en friction)

1. **Configure MSW** — Crée `src/mocks/handlers.ts` avec les quatre handlers. Lance MSW dans `main.ts` en mode développement uniquement (`if (import.meta.env.DEV)`). Vérifie dans la console du navigateur que MSW affiche `[MSW] Mocking enabled`.

2. **Écris `useAuthStore`** — Setup syntax Pinia. Champs `accessToken ref<string | null>`, `user ref<User | null>`. Computed `isAuthenticated`. Actions `setAuth`, `clear`, `getAuthHeader`, `login`, `logout`.

3. **Configure Vue Router** — Deux routes (`/login` et `/dashboard` avec `meta: { requiresAuth: true }`). Guard `beforeEach` qui lit `useAuthStore()` et redirige si non authentifié.

4. **Écris `authFetch`** — Ajoute le header `Authorization`, détecte le 401, tente le refresh, retente la requête originale. Si le refresh échoue, appelle `auth.logout()` et lance une erreur.

5. **Crée `LoginPage.vue`** — Formulaire email + password, appelle `auth.login()`, redirige vers `route.query.redirect` ou `/dashboard`. Affiche `auth.error` si présent.

6. **Crée `DashboardPage.vue`** — Affiche `auth.user.name` et un bouton Déconnexion qui appelle `auth.logout()`. Fait un appel `GET /api/me` via `authFetch` au montage pour afficher les données fraîches.

7. **Refresh silencieux au démarrage** — Dans `main.ts`, tente `POST /api/auth/refresh` avant de monter l'app. Si succès, appelle `auth.setAuth(...)`. Monte l'app dans le `finally`.

8. **Test manuel en navigateur :**
   - Visite `/dashboard` sans être connecté → doit rediriger vers `/login?redirect=/dashboard`
   - Connecte-toi avec `alice@tribuzen.com` / `password123` → doit afficher le dashboard
   - Recharge la page (F5) → doit rester sur le dashboard (refresh silencieux)
   - Clique Déconnexion → doit revenir sur `/login`
   - Simule un 401 en modifiant le handler MSW `/api/me` pour retourner 401 → doit retenter via refresh

---

## Corrigé complet commenté

### `src/mocks/handlers.ts`

```ts
import { http, HttpResponse } from 'msw'

// Données mock en mémoire (reset si la page est rechargée — comportement attendu en dev)
const MOCK_USER = { id: 1, name: 'Alice Dupont', email: 'alice@tribuzen.com', role: 'editor' as const }
const VALID_PASSWORD = 'password123'
// accessToken simulé — en prod, ce serait un JWT signé par le serveur
const MOCK_ACCESS_TOKEN = 'mock-access-token-abc123'
// Simule un refresh réussi à chaque appel (en prod, validé via le cookie refreshToken)
let refreshCallCount = 0

export const handlers = [
  // Login — vérifie le mot de passe, renvoie accessToken + user
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string }

    if (body.password !== VALID_PASSWORD) {
      return HttpResponse.json({ message: 'Identifiants invalides' }, { status: 401 })
    }

    return HttpResponse.json({ accessToken: MOCK_ACCESS_TOKEN, user: MOCK_USER })
  }),

  // Refresh — simulé comme toujours réussi (premier appel) puis échoué (pour tester l'expiration)
  http.post('/api/auth/refresh', () => {
    refreshCallCount++
    // Simule l'expiration du refreshToken après plusieurs refresh (pour tester le flux complet)
    // En prod, le serveur vérifie le cookie httpOnly
    return HttpResponse.json({ accessToken: MOCK_ACCESS_TOKEN, user: MOCK_USER })
  }),

  // Logout — invalide la session (ici, rien à faire côté mock)
  http.post('/api/auth/logout', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Route protégée — renvoie 401 si pas de header Authorization valide
  http.get('/api/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ message: 'Non autorisé' }, { status: 401 })
    }

    // En prod : vérifier la signature JWT. Ici, on accepte n'importe quel Bearer.
    return HttpResponse.json(MOCK_USER)
  }),
]
```

### `src/mocks/browser.ts`

```ts
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// Le worker MSW intercepte les requêtes réseau dans le navigateur via un Service Worker
export const worker = setupWorker(...handlers)
```

### `src/stores/auth.ts`

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
}

interface LoginCredentials {
  email: string
  password: string
}

export const useAuthStore = defineStore('auth', () => {
  // ── État ─────────────────────────────────────────────────────────────────
  // accessToken en mémoire — PAS dans localStorage (vulnérable XSS)
  const accessToken = ref<string | null>(null)
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── Getters ───────────────────────────────────────────────────────────────
  // isAuthenticated = vrai seulement si les deux sont présents
  const isAuthenticated = computed(() => accessToken.value !== null && user.value !== null)
  const userRole = computed(() => user.value?.role ?? null)

  // ── Actions ───────────────────────────────────────────────────────────────

  // Remplir l'état après un login ou un refresh réussi
  function setAuth(token: string, userData: User): void {
    accessToken.value = token
    user.value = userData
    error.value = null
  }

  // Vider l'état — utilisé par logout() et après un refresh échoué
  function clear(): void {
    accessToken.value = null
    user.value = null
  }

  // Construit le header Authorization à inclure dans chaque requête API
  function getAuthHeader(): Record<string, string> {
    if (!accessToken.value) return {}
    return { Authorization: `Bearer ${accessToken.value}` }
  }

  async function login(credentials: LoginCredentials): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',       // ← nécessaire pour recevoir le cookie refreshToken
        body: JSON.stringify(credentials),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { message?: string }).message ?? `Erreur ${res.status}`)
      }

      const data = await res.json() as { accessToken: string; user: User }
      // refreshToken : posé en cookie httpOnly par le serveur (Set-Cookie)
      // On ne le voit pas dans la réponse — le navigateur le gère seul
      setAuth(data.accessToken, data.user)

    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Échec de connexion'
      throw e   // re-throw pour que LoginPage puisse aussi réagir si nécessaire
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    try {
      // Invalider le refreshToken côté serveur AVANT de vider le store
      // Si on vide d'abord, le refreshToken reste valide même après "déconnexion"
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',   // envoie le cookie refreshToken pour que le serveur l'invalide
      })
    } finally {
      // Vider l'état dans tous les cas (même si le serveur est indisponible)
      clear()
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    userRole,
    login,
    logout,
    setAuth,
    clear,
    getAuthHeader,
  }
})
```

### `src/utils/authFetch.ts`

```ts
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// Remplace fetch() partout dans l'app — gère automatiquement le token et le refresh
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const auth = useAuthStore()

  // Première tentative avec le token actuel
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...auth.getAuthHeader(),   // ajoute Authorization: Bearer <token>
    },
    credentials: 'include',      // envoie les cookies (dont refreshToken si besoin)
  })

  // Si 401 → le token a probablement expiré → on tente un refresh silencieux
  if (response.status === 401) {
    const refreshed = await tryRefresh(auth)

    if (refreshed) {
      // Refresh réussi → retenter la requête originale avec le nouveau token
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          ...auth.getAuthHeader(),   // getAuthHeader() retourne maintenant le nouveau token
        },
        credentials: 'include',
      })
    }

    // Refresh échoué → session vraiment expirée → déconnecter et rediriger
    await auth.logout()
    router.push({ name: 'login' })
    throw new Error('Session expirée — reconnexion requise')
  }

  return response
}

// Tente d'obtenir un nouveau accessToken via le refreshToken (cookie httpOnly)
async function tryRefresh(auth: ReturnType<typeof useAuthStore>): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',   // le cookie refreshToken est envoyé automatiquement ici
    })

    if (!res.ok) return false

    const data = await res.json() as { accessToken: string; user: { id: number; name: string; email: string; role: 'admin' | 'editor' | 'viewer' } }
    auth.setAuth(data.accessToken, data.user)
    return true

  } catch {
    // Erreur réseau ou parsing — le refresh a échoué
    return false
  }
}
```

### `src/router/index.ts`

```ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/pages/DashboardPage.vue'),
    meta: { requiresAuth: true },
  },
  // Redirect par défaut
  { path: '/', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Guard global — vérifie l'authentification avant chaque navigation
router.beforeEach((to) => {
  // ✅ Appel DANS le callback, pas à l'import du fichier
  // Pinia est installée avant le premier beforeEach (voir main.ts)
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    // Préserver la destination pour y retourner après connexion
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  // Pas de return = navigation autorisée
})

// Augmentation de type pour les meta de route
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

export default router
```

### `src/pages/LoginPage.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')

async function handleLogin(): Promise<void> {
  try {
    await auth.login({ email: email.value, password: password.value })
    // Retourner à la page originale si redirect présent, sinon /dashboard
    const redirect = (route.query.redirect as string | undefined) ?? '/dashboard'
    router.push(redirect)
  } catch {
    // auth.error est rempli par le store — l'affichage est réactif, rien à faire ici
  }
}
</script>

<template>
  <main class="login-page">
    <h1>Connexion TribuZen</h1>

    <form @submit.prevent="handleLogin" novalidate>
      <label>
        Email
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          :disabled="auth.loading"
          required
        />
      </label>

      <label>
        Mot de passe
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          :disabled="auth.loading"
          required
        />
      </label>

      <!-- auth.error est string | null — Vue n'affiche rien si null -->
      <p v-if="auth.error" role="alert" class="error">{{ auth.error }}</p>

      <button type="submit" :disabled="auth.loading">
        {{ auth.loading ? 'Connexion…' : 'Se connecter' }}
      </button>
    </form>

    <p class="hint">Compte test : alice@tribuzen.com / password123</p>
  </main>
</template>

<style scoped>
.login-page {
  max-width: 360px;
  margin: 4rem auto;
  padding: 2rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
}

input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 1rem;
}

button {
  padding: 0.6rem 1rem;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #dc2626;
  font-size: 0.875rem;
}

.hint {
  margin-top: 1rem;
  font-size: 0.75rem;
  color: #94a3b8;
}
</style>
```

### `src/pages/DashboardPage.vue`

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authFetch } from '@/utils/authFetch'

const auth = useAuthStore()
const router = useRouter()

// Données fraîches depuis l'API (via authFetch — teste le retry sur 401)
const apiUser = ref<{ id: number; name: string; email: string; role: string } | null>(null)
const apiError = ref<string | null>(null)

onMounted(async () => {
  try {
    const res = await authFetch('/api/me')
    if (res.ok) {
      apiUser.value = await res.json()
    }
  } catch (e) {
    apiError.value = e instanceof Error ? e.message : 'Erreur API'
  }
})

async function handleLogout(): Promise<void> {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <main class="dashboard">
    <header class="dashboard-header">
      <h1>Dashboard TribuZen</h1>
      <button @click="handleLogout" class="btn-logout">Déconnexion</button>
    </header>

    <!-- Données du store Pinia (en mémoire) -->
    <section class="store-section">
      <h2>Depuis le store Pinia</h2>
      <p>Connecté en tant que : <strong>{{ auth.user?.name }}</strong></p>
      <p>Rôle : <code>{{ auth.userRole }}</code></p>
      <p>isAuthenticated : <code>{{ auth.isAuthenticated }}</code></p>
    </section>

    <!-- Données fraîches depuis l'API (teste authFetch + retry) -->
    <section class="api-section">
      <h2>Depuis GET /api/me (authFetch)</h2>
      <p v-if="apiError" class="error">Erreur : {{ apiError }}</p>
      <pre v-else-if="apiUser">{{ JSON.stringify(apiUser, null, 2) }}</pre>
      <p v-else>Chargement…</p>
    </section>
  </main>
</template>

<style scoped>
.dashboard {
  max-width: 640px;
  margin: 2rem auto;
  padding: 1.5rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

section {
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

h2 {
  margin-top: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #475569;
}

.btn-logout {
  padding: 0.4rem 0.8rem;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  cursor: pointer;
}

.error {
  color: #dc2626;
}

pre {
  background: #f8fafc;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  overflow: auto;
}
</style>
```

### `src/main.ts`

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

async function bootstrap(): Promise<void> {
  // Activer MSW en développement uniquement
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    await worker.start({
      onUnhandledRequest: 'bypass',   // laisser passer les requêtes non mockées (HMR, assets)
    })
  }

  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)

  // Tenter un refresh silencieux AVANT de monter l'app et APRÈS avoir installé Pinia
  // → si le cookie refreshToken est valide, la session est restaurée sans re-login
  const auth = useAuthStore()
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      auth.setAuth(data.accessToken, data.user)
    }
  } catch {
    // Pas connecté, ou erreur réseau — comportement normal, on monte quand même
  }

  // Monter l'app seulement après la tentative de refresh
  // → pas de flash de contenu protégé ni de redirect intempestif
  app.mount('#app')
}

bootstrap()
```

### `src/App.vue` (minimal)

```vue
<script setup lang="ts">
// Rien d'état global ici — tout est dans le store Pinia
</script>

<template>
  <RouterView />
</template>
```

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — 30 minutes, sans ouvrir ce corrigé :**

1. Ajoute un **deuxième rôle** `admin` au mock. Crée une route `/admin` avec `meta: { requiresAuth: true, requiredRole: 'admin' }`.
2. Écris un **second guard** `roleGuard` dans `beforeEach` qui vérifie `auth.userRole` contre `to.meta.requiredRole` et redirige vers une page `/forbidden` si le rôle est insuffisant.
3. Le compte `alice@tribuzen.com` a le rôle `editor` — visite `/admin` avec Alice → doit rediriger vers `/forbidden`.
4. Crée un compte `admin@tribuzen.com` dans les handlers MSW (rôle `admin`) — visite `/admin` avec ce compte → doit afficher la page admin.

**Critère de réussite :** les deux guards fonctionnent en chaîne, l'ordre est auth → rôle, et la page `/forbidden` s'affiche avec un message explicite.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, les fichiers produits dans ce lab s'intègrent directement :

```
tribuzen/
  src/
    stores/
      auth.ts              ← identique au lab (adapter les types User depuis src/types/user.ts)
    utils/
      authFetch.ts         ← identique au lab
    router/
      index.ts             ← étendre les routes existantes avec le guard
    pages/
      LoginPage.vue        ← à intégrer dans le design system TribuZen
      DashboardPage.vue    ← à remplacer par le vrai dashboard quand prêt
```

**Différences par rapport au lab :**
- Les types `User` et `LoginCredentials` viennent de `src/types/user.ts` (partagés entre composants).
- MSW est remplacé par l'API NestJS réelle (module 08) — supprimer le bloc MSW de `main.ts`.
- Le cookie `refreshToken` est posé par le vrai serveur NestJS (`Set-Cookie` dans le handler `/auth/login`).

**Commit cible :**
```
feat(auth): useAuthStore Pinia + authFetch retry + guard requiresAuth
```
