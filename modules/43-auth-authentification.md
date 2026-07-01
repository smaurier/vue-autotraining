---
titre: Authentification
cours: 02-vue
notions: [flux d'authentification, JWT vs session cookie, stockage du token httpOnly cookie vs localStorage, OIDC et OAuth2 avec PKCE, store d'auth Pinia, guards de route authentifiée, rafraîchissement de token, déconnexion et expiration]
outcomes:
  - sait implémenter un flux d'authentification côté front Vue
  - sait choisir le stockage du token (cookie httpOnly vs localStorage) et pourquoi
  - sait protéger les routes avec un store d'auth et des guards
  - sait gérer le refresh token, l'expiration et la déconnexion
prerequis: [42-i18n-strategies-avancees]
next: 44-securite-front
libs: [{ name: vue, version: "3.5" }, { name: pinia, version: "2" }]
tribuzen: front-office TribuZen — authentification (store Pinia useAuthStore, guards, refresh), préparation OIDC/PKCE
last-reviewed: 2026-07
---

# Authentification

> **Outcomes — tu sauras FAIRE :** implémenter un flux d'authentification JWT côté front Vue 3, choisir le bon stockage pour les tokens (cookie httpOnly vs localStorage), protéger les routes avec `useAuthStore` Pinia et des guards Vue Router, gérer le refresh token et la déconnexion.
> **Difficulté :** :star::star::star::star:

## 1. Cas concret d'abord

Tu rejoins l'équipe TribuZen. La page `/dashboard` est accessible à tout le monde — même sans compte. La tâche du sprint : **sécuriser le dashboard** et toutes les pages protégées.

Le comportement attendu :

```
1. L'utilisateur non connecté visite /dashboard
   → guard Vue Router intercepte → redirige vers /login?redirect=/dashboard

2. L'utilisateur entre email + mot de passe sur /login
   → POST /api/auth/login → serveur répond { accessToken, user }
   → refreshToken set en cookie httpOnly par le serveur
   → useAuthStore stocke accessToken en mémoire + user en état Pinia

3. Vue Router confirme isAuthenticated → redirige vers /dashboard

4. 15 minutes plus tard, le dashboard fait un appel API
   → serveur répond 401 (accessToken expiré)
   → authFetch intercepte → POST /api/auth/refresh (cookie httpOnly envoyé automatiquement)
   → nouveau accessToken → requête retentée → succès

5. L'utilisateur clique "Déconnexion"
   → POST /api/auth/logout (invalide le refreshToken côté serveur)
   → useAuthStore.clear() → router.push('/login')
```

Trois questions à résoudre **avant** d'écrire le code :
- Où stocker l'`accessToken` ? (localStorage ❌ / cookie httpOnly ❌ / mémoire JS ✅)
- Comment protéger les routes sans dupliquer la logique dans chaque composant ?
- Que faire quand l'`accessToken` expire en milieu de session ?

Ce module répond à ces trois questions.

---

## 2. Théorie complète, concise

### 2.1 Authentification vs autorisation

**Authentification** : prouver qui tu es (email + mot de passe → identité confirmée).
**Autorisation** : vérifier ce que tu as le droit de faire une fois identifié (rôle `admin`, accès à `/admin`).

Les deux sont distincts. Ce module traite l'authentification. Les guards de rôle sont couverts dans le module suivant (44 — sécurité front).

### 2.2 JWT vs session cookie

| Critère | JWT (stateless) | Session cookie (stateful) |
|---------|----------------|--------------------------|
| Stockage serveur | Rien — le token est auto-porteur | Session en base / Redis |
| Scalabilité horizontale | Naturelle (pas d'état) | Requiert un store partagé |
| Révocation immédiate | Difficile (token valide jusqu'à expiration) | Facile (supprimer la session) |
| Taille requête | Plus grand (payload dans le token) | Juste un identifiant |
| Cas d'usage | SPA, API stateless, microservices | Rendu serveur (Nuxt SSR, apps traditionnelles) |

**Pour TribuZen (SPA Vue 3)** : JWT est le choix naturel. Le serveur NestJS (module 08) émet un `accessToken` + un `refreshToken`.

### 2.3 Structure d'un JWT

Un JWT est composé de trois parties encodées en Base64url, séparées par des points :

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI0MiIsInJvbGUiOiJlZGl0b3IiLCJleHAiOjE3MjAwMDAwMDB9.SIGNATURE
      HEADER                              PAYLOAD                                    SIGNATURE
```

Le **payload** est décodable par n'importe qui (`atob()` en JS) — il n'est PAS chiffré, seulement signé. Ne jamais y mettre de données sensibles (mot de passe, numéro de carte).

Champs standard utiles côté front :
- `sub` : identifiant de l'utilisateur
- `exp` : timestamp d'expiration (Unix seconds)
- `iat` : date d'émission
- `role` : champ custom (convention TribuZen)

### 2.4 Stockage du token — décision critique de sécurité

C'est **le** choix de sécurité le plus important côté front.

#### localStorage — pratique mais vulnérable

```ts
// ❌ NE PAS FAIRE en production
localStorage.setItem('accessToken', token)

// N'importe quel script JS sur la page peut lire localStorage :
// si une dépendance npm malveillante ou une injection XSS s'exécute,
// le token est volé en une ligne.
const stolen = localStorage.getItem('accessToken')
```

**Risque XSS** : une injection de script (via une dépendance compromise, un input non-échappé, etc.) peut exfiltrer le token vers un serveur attaquant. L'attaquant obtient une session complète.

#### Cookie httpOnly + SameSite — recommandé pour le refreshToken

```http
Set-Cookie: refreshToken=<token>; HttpOnly; Secure; SameSite=Strict; Path=/api/auth/refresh
```

- `HttpOnly` : JavaScript ne peut **pas** lire ce cookie (`document.cookie` ne le voit pas)
- `Secure` : transmis uniquement en HTTPS
- `SameSite=Strict` : protège contre le CSRF (le cookie n'est pas envoyé sur les requêtes cross-site)
- `Path=/api/auth/refresh` : limiter l'envoi automatique au seul endpoint de refresh

Le navigateur envoie le cookie automatiquement avec chaque requête correspondant au `Path`. Le JS de l'app n'a pas à le manipuler.

#### Mémoire JS — recommandé pour l'accessToken

```ts
// ✅ Dans le store Pinia — en mémoire, pas dans localStorage ni sessionStorage
const accessToken = ref<string | null>(null)
```

- Inaccessible aux scripts tiers (pas dans le DOM, pas dans localStorage)
- Durée de vie courte (~15 min) : si l'app redémarre (F5), l'utilisateur doit re-logger ou le refresh token (cookie httpOnly) renouvelle automatiquement

**Stratégie recommandée pour TribuZen :**
- `accessToken` → mémoire Pinia (durée courte, sécurisé contre XSS)
- `refreshToken` → cookie httpOnly posé par le serveur (durée longue, sécurisé contre XSS, SameSite contre CSRF)

### 2.5 OIDC et OAuth2 avec PKCE

**OAuth2** est un protocole d'autorisation délégué (« se connecter avec Google »). **OIDC** (OpenID Connect) est une couche d'identité par-dessus OAuth2 qui ajoute un `id_token` standardisé.

**PKCE** (Proof Key for Code Exchange, prononcé « pixy ») protège le flux OAuth2 sur les clients publics (SPA, apps mobiles) qui ne peuvent pas garder un secret client confidentiel.

#### Flux Authorization Code + PKCE (côté front)

```
1. L'utilisateur clique "Connexion avec Google"

2. Le front génère :
   - code_verifier  → chaîne aléatoire (43-128 chars)
   - code_challenge → SHA-256(code_verifier) encodé en Base64url

3. Redirection vers le provider (Google, Microsoft, Keycloak…)
   GET https://accounts.google.com/o/oauth2/v2/auth
     ?client_id=APP_ID
     &redirect_uri=https://app.tribuzen.com/auth/callback
     &response_type=code
     &code_challenge=<hash>
     &code_challenge_method=S256
     &scope=openid email profile

4. L'utilisateur s'authentifie sur Google
   → Google redirige vers /auth/callback?code=AUTH_CODE

5. Le front envoie au backend TribuZen :
   POST /api/auth/oidc-callback
   { code: AUTH_CODE, code_verifier: CODE_VERIFIER }

6. Le backend échange le code contre les tokens auprès de Google
   (il possède aussi le code_verifier pour valider le PKCE)
   → renvoie { accessToken, user } au front

7. Le front stocke comme pour le flux standard (mémoire + cookie httpOnly)
```

⚠️ Le `code_verifier` ne doit **jamais** être envoyé à Google directement depuis le front (seulement le hash `code_challenge`). C'est le backend qui complète l'échange, ce qui évite l'interception du code.

### 2.6 Store d'auth Pinia — `useAuthStore`

Pinia est préféré à un composable singleton pour l'état d'authentification car :
- DevTools intégrées (inspection de l'état, time-travel)
- `$reset()` natif pour la déconnexion
- Intégration officielle avec SSR (Nuxt)
- Composition store (setup syntax) compatible avec les composables Vue

```ts
// stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
}

export const useAuthStore = defineStore('auth', () => {
  // ── État ──────────────────────────────────────
  // accessToken en mémoire — pas dans localStorage (XSS)
  const accessToken = ref<string | null>(null)
  const user = ref<User | null>(null)

  // ── Getters (computed) ────────────────────────
  const isAuthenticated = computed(() => accessToken.value !== null && user.value !== null)
  const userRole = computed(() => user.value?.role ?? null)

  // ── Actions ───────────────────────────────────
  function setAuth(token: string, userData: User): void {
    accessToken.value = token
    user.value = userData
  }

  function clear(): void {
    accessToken.value = null
    user.value = null
  }

  function getAuthHeader(): Record<string, string> {
    if (!accessToken.value) return {}
    return { Authorization: `Bearer ${accessToken.value}` }
  }

  return { accessToken, user, isAuthenticated, userRole, setAuth, clear, getAuthHeader }
})
```

**Pourquoi `setup syntax` dans Pinia ?** Plus de cohérence avec `<script setup>`, meilleure inférence TypeScript, composables réutilisables directement dans le store.

### 2.7 Guards de route

Vue Router expose `beforeEach` pour intercepter chaque navigation.

```ts
// router/index.ts
import { useAuthStore } from '@/stores/auth'

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    // Préserver la destination pour y retourner après connexion
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})
```

Typage des meta de route (module augmentation) :

```ts
// env.d.ts ou router/types.ts
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}
```

Configuration des routes :

```ts
const routes = [
  { path: '/login', name: 'login', component: LoginPage },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardPage,
    meta: { requiresAuth: true },
  },
]
```

### 2.8 Rafraîchissement du token et déconnexion

L'`accessToken` expire vite (~15 min). Il faut renouveler silencieusement sans casser l'expérience.

**Pattern fetch avec retry automatique :**

```ts
// utils/authFetch.ts
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const auth = useAuthStore()

  const response = await fetch(url, {
    ...options,
    headers: { ...options.headers, ...auth.getAuthHeader() },
    credentials: 'include',   // envoie le cookie refreshToken automatiquement
  })

  if (response.status === 401) {
    const refreshed = await tryRefresh(auth)
    if (refreshed) {
      // Retenter la requête originale avec le nouveau token
      return fetch(url, {
        ...options,
        headers: { ...options.headers, ...auth.getAuthHeader() },
        credentials: 'include',
      })
    }
    // Refresh impossible → session expirée → déconnexion
    await logout(auth)
    throw new Error('Session expirée')
  }

  return response
}

async function tryRefresh(auth: ReturnType<typeof useAuthStore>): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',   // cookie httpOnly refreshToken envoyé automatiquement
    })
    if (!res.ok) return false
    const { accessToken, user } = await res.json()
    auth.setAuth(accessToken, user)
    return true
  } catch {
    return false
  }
}

async function logout(auth: ReturnType<typeof useAuthStore>): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
  } finally {
    // Vider l'état même si le serveur est indisponible
    auth.clear()
    router.push({ name: 'login' })
  }
}
```

**Expiration et déconnexion :**
- La déconnexion doit invalider le `refreshToken` côté serveur (appel `POST /api/auth/logout`) puis vider le store Pinia.
- Si le serveur est indisponible, on vide quand même le store (bloc `finally`) — l'utilisateur perd l'accès localement.
- Un `refreshToken` volé (exfiltré malgré le cookie httpOnly via MITM sur HTTP non-HTTPS) peut être révoqué en base par le serveur.

---

## 3. Worked examples

### Exemple 1 — `useAuthStore` complet + login (TribuZen)

```ts
// stores/auth.ts — version production TribuZen
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
  // État — accessToken en mémoire uniquement (pas de localStorage)
  const accessToken = ref<string | null>(null)
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => accessToken.value !== null && user.value !== null)
  const userRole = computed(() => user.value?.role ?? null)

  // Actions
  function setAuth(token: string, userData: User): void {
    accessToken.value = token
    user.value = userData
    error.value = null
  }

  function clear(): void {
    accessToken.value = null
    user.value = null
  }

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
        credentials: 'include',       // le serveur peut poser le cookie refreshToken ici
        body: JSON.stringify(credentials),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message ?? `Erreur ${res.status}`)
      }

      const data = await res.json()
      // data.user   → objet utilisateur
      // data.accessToken → JWT court-vécu (~15 min)
      // refreshToken → posé en cookie httpOnly par le serveur, pas dans data
      setAuth(data.accessToken, data.user)

    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Échec de connexion'
      throw e   // re-throw pour que LoginPage.vue puisse aussi réagir
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',       // envoie le refreshToken cookie pour l'invalider
      })
    } finally {
      clear()   // vider l'état dans tous les cas
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

**Usage dans `LoginPage.vue` :**

```vue
<!-- LoginPage.vue -->
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
    // Retourner à la page demandée initialement (si redirect présent)
    const redirect = (route.query.redirect as string) ?? '/dashboard'
    router.push(redirect)
  } catch {
    // auth.error est déjà rempli par le store — l'affichage est réactif
  }
}
</script>

<template>
  <form @submit.prevent="handleLogin">
    <input v-model="email" type="email" :disabled="auth.loading" />
    <input v-model="password" type="password" :disabled="auth.loading" />
    <p v-if="auth.error" class="error">{{ auth.error }}</p>
    <button type="submit" :disabled="auth.loading">
      {{ auth.loading ? 'Connexion…' : 'Se connecter' }}
    </button>
  </form>
</template>
```

### Exemple 2 — Guard + retry refresh end-to-end

Le guard vérifie `isAuthenticated` au moment de la navigation. Mais que se passe-t-il après un rechargement de page (F5) ? L'`accessToken` en mémoire est perdu. On initialise le store au démarrage en tentant un refresh silencieux :

```ts
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// Avant le premier rendu, tenter un refresh silencieux
// Si le cookie refreshToken est présent, le serveur renvoie un nouvel accessToken
const auth = useAuthStore()
fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
  .then(async (res) => {
    if (res.ok) {
      const { accessToken, user } = await res.json()
      auth.setAuth(accessToken, user)
    }
  })
  .catch(() => { /* pas connecté — comportement normal */ })
  .finally(() => {
    app.mount('#app')   // monter l'app seulement après la tentative
  })
```

**Ce que ce pattern garantit :**
- Rechargement de page → si le cookie refreshToken est valide → session restaurée silencieusement
- Rechargement de page → si le cookie est absent ou expiré → `isAuthenticated` reste `false` → guard redirige vers `/login`
- Pas de flash de contenu protégé (l'app monte après la vérification)

---

## 4. Pièges & misconceptions

### PIÈGE #1 — accessToken dans localStorage (le plus dangereux)

```ts
// ❌ NE JAMAIS FAIRE
localStorage.setItem('accessToken', data.accessToken)

// N'importe quel script JS sur la page lit localStorage.
// Une dépendance npm compromise (supply chain attack) ou une injection XSS
// suffit pour exfiltrer le token en une requête HTTP vers un serveur attaquant.
// Le token est valide jusqu'à son expiration — rien ne peut l'invalider immédiatement.
```

**Correct :** `accessToken` en mémoire dans le store Pinia. Durée courte + mémoire = fenêtre d'attaque minimale.

### PIÈGE #2 — Pas de refresh token → l'utilisateur est déconnecté toutes les 15 min

```ts
// ❌ Sans gestion de refresh, le 401 fait crasher l'app ou renvoie vers /login
// alors que l'utilisateur avait juste le token expiré — expérience cassée.

// ✅ Le pattern authFetch avec retry gère ça silencieusement.
// L'utilisateur ne voit rien : le token est renouvelé en arrière-plan.
```

Implémenter le refresh avant d'aller en production, pas après les premières plaintes.

### PIÈGE #3 — Déconnexion purement côté client

```ts
// ❌ Vider le store sans appeler le serveur
auth.clear()
router.push('/login')

// Le refreshToken dans le cookie est toujours valide !
// Si l'attaquant a extrait le cookie (MITM sur HTTP non-HTTPS),
// il peut obtenir un nouvel accessToken même après la "déconnexion".
```

**Correct :** toujours appeler `POST /api/auth/logout` pour que le serveur invalide le `refreshToken` en base. Puis vider le store.

### PIÈGE #4 — Confondre `credentials: 'include'` et `withCredentials`

```ts
// ✅ Avec fetch natif
fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })

// ✅ Avec axios (option différente)
axios.post('/api/auth/refresh', {}, { withCredentials: true })

// ❌ Oublier cette option → le cookie httpOnly n'est PAS envoyé
// → le serveur répond 401 ou 400 (refreshToken manquant)
// → boucle de redirect infinie vers /login
```

`credentials: 'include'` est requis sur toutes les requêtes qui doivent envoyer ou recevoir des cookies (login, refresh, logout).

### PIÈGE #5 — Guard qui appelle `useAuthStore()` avant l'installation de Pinia

```ts
// ❌ Dans router/index.ts en dehors de beforeEach
const auth = useAuthStore()   // Pinia n'est pas encore installée → erreur runtime

// ✅ Appeler useAuthStore() À L'INTÉRIEUR du guard
router.beforeEach((to) => {
  const auth = useAuthStore()   // Pinia est installée à ce moment
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})
```

La règle : les stores Pinia ne sont accessibles qu'après `app.use(pinia)`. Les guards `beforeEach` sont appelés lors de la navigation, pas à l'import du fichier router — donc `useAuthStore()` y est sûr.

---

## 5. Ancrage TribuZen

Le store `useAuthStore` est la colonne vertébrale du front-office TribuZen :

```
tribuzen/
  src/
    stores/
      auth.ts              ← useAuthStore (ce module)
    utils/
      authFetch.ts         ← fetch wrapper avec retry refresh
    router/
      index.ts             ← beforeEach guard
    pages/
      LoginPage.vue        ← consomme useAuthStore.login()
      DashboardPage.vue    ← route protégée meta.requiresAuth
    components/
      auth/
        LoginForm.vue      ← formulaire login (voir module 00)
```

**Interactions avec les autres modules TribuZen :**
- **Module 15 (Pinia)** : `useAuthStore` utilise la setup syntax de Pinia — assure-toi de l'avoir couvert.
- **Module 14 (Vue Router)** : le guard `beforeEach` + `RouteMeta` sont des extensions de Vue Router.
- **Cours NestJS module 08** : le serveur NestJS émet les tokens JWT, pose le cookie `refreshToken` via `Set-Cookie`.
- **Module 44 (sécurité front)** : les guards de rôle (`requiredRole`) et la politique CSP s'appuient sur `useAuthStore.userRole`.

**Commit cible TribuZen :**
```
feat(auth): useAuthStore Pinia + authFetch retry + guard requiresAuth
```

---

## 6. Points clés

1. Authentification = prouver son identité ; autorisation = vérifier ses droits — deux concepts distincts.
2. JWT est stateless (pas de stockage serveur) ; session cookie requiert un store serveur — JWT est naturel pour les SPA.
3. `localStorage` est vulnérable au XSS — ne jamais y stocker l'`accessToken`.
4. `accessToken` en mémoire Pinia (durée courte) + `refreshToken` en cookie httpOnly (durée longue, SameSite) = stratégie recommandée.
5. Le cookie httpOnly n'est pas accessible par `document.cookie` — le navigateur l'envoie automatiquement avec `credentials: 'include'`.
6. OIDC/PKCE : le front génère `code_verifier` + `code_challenge`, le backend échange le code — le secret ne transite jamais côté client.
7. Le guard `beforeEach` appelle `useAuthStore()` à l'intérieur du callback (pas à l'import) pour que Pinia soit déjà installée.
8. La déconnexion doit appeler le serveur (`POST /api/auth/logout`) pour invalider le `refreshToken` côté serveur avant de vider le store.
9. Au rechargement de page (F5), l'`accessToken` en mémoire est perdu — un refresh silencieux au `main.ts` restaure la session si le cookie est valide.
10. Sans retry sur le 401, l'utilisateur est déconnecté après 15 min d'inactivité — expérience cassée.

---

## 7. Seeds Anki

```
Pourquoi ne pas stocker l'accessToken dans localStorage ?|localStorage est accessible à tout script JS sur la page. Une injection XSS ou une dépendance compromise peut exfiltrer le token en une requête. Stocker en mémoire (store Pinia) élimine ce risque.
Quelle est la différence entre cookie httpOnly et cookie ordinaire ?|Un cookie httpOnly ne peut pas être lu par document.cookie ni par aucun script JS — le navigateur le gère seul. Un cookie ordinaire est lisible par JS et donc vulnérable au XSS.
Pourquoi utiliser deux tokens (accessToken + refreshToken) ?|L'accessToken a une durée courte (~15 min) pour limiter les dégâts en cas de vol. Le refreshToken longue durée (~7 jours) permet de renouveler l'accessToken sans redemander le mot de passe.
Que doit faire un guard beforeEach si meta.requiresAuth est true et que l'utilisateur n'est pas connecté ?|Retourner une redirection vers la route login en préservant la destination dans query.redirect — next({ name: 'login', query: { redirect: to.fullPath } }) ou return { name: 'login', query: { redirect: to.fullPath } }.
Quel est le rôle de credentials include dans fetch ?|Il indique au navigateur d'envoyer et de recevoir les cookies (dont les httpOnly) avec la requête. Sans cette option, le cookie refreshToken n'est pas envoyé et le serveur ne peut pas rafraîchir la session.
Pourquoi appeler POST /api/auth/logout côté serveur avant de vider le store ?|Pour invalider le refreshToken en base côté serveur. Vider uniquement le store laisse le refreshToken valide — un attaquant ayant obtenu le cookie pourrait encore obtenir de nouveaux accessTokens.
Qu'est-ce que PKCE protège dans un flux OAuth2 ?|PKCE empêche l'interception du authorization code. Sans PKCE, un attaquant qui intercepte le code peut l'échanger contre des tokens. Le code_verifier prouve que c'est le même client qui a initié la demande.
Pourquoi useAuthStore() doit-il être appelé DANS le callback de beforeEach ?|Les stores Pinia ne sont utilisables qu'après app.use(pinia). Les guards beforeEach sont exécutés lors des navigations, pas à l'import — Pinia est donc déjà installée à ce moment. L'appeler à l'import du router causerait une erreur runtime.
```

---

## Pont vers le lab

> Lab associé : `02-vue/labs/lab-43-auth-authentification/README.md`. Implémentation complète de `useAuthStore` Pinia + guard `requiresAuth` + retry refresh sur 401, avec un serveur mock MSW pour simuler les endpoints auth sans backend réel.

---

← [42 — Stratégies i18n avancées](42-i18n-strategies-avancees.md)
