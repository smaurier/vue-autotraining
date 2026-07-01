---
titre: Pinia
cours: 02-vue
notions: [defineStore option store, defineStore setup store, state getters actions, usage d'un store dans un composant, storeToRefs et réactivité, actions asynchrones, composition de stores, plugins et persistance, comparaison avec Vuex]
outcomes:
  - sait définir un store Pinia (style setup et style options)
  - sait consommer un store sans perdre la réactivité (storeToRefs)
  - sait écrire des actions asynchrones qui mutent le state
  - sait composer plusieurs stores et gérer un état global proprement
prerequis: [14-vue-router]
next: 16-tests-unitaires
libs: [{ name: vue, version: "3.5" }, { name: pinia, version: "2" }]
tribuzen: front-office TribuZen — useFamilyStore (familles, membres) et useAuthStore (session), consommés par le dashboard et les guards
last-reviewed: 2026-07
---

# Pinia

> **Outcomes — tu sauras FAIRE :** définir un store Pinia en style setup et en style options, consommer un store sans perdre la réactivité avec `storeToRefs`, écrire des actions asynchrones, composer plusieurs stores pour gérer un état global cohérent.
> **Difficulté :** :star::star::star:

---

← [Module 14 — Vue Router](14-vue-router.md)

---

## 1. Cas concret d'abord

Tu travailles sur le dashboard TribuZen. Trois endroits du code ont besoin des mêmes données simultanément :

- `NavBar.vue` — affiche le nom de l'utilisateur connecté et son avatar
- `DashboardView.vue` — affiche les membres de la famille sélectionnée
- `router/index.ts` — redirige vers `/login` si l'utilisateur n'est pas authentifié

Le state pertinent pour tous : **qui est connecté** (session auth) et **quels membres sont chargés** (famille courante).

Avec des `ref` locales, tu as trois options, toutes mauvaises :

1. Dupliquer les refs dans chaque composant — les données divergent entre elles
2. Tout hisser dans `App.vue` et descendre en props à 4 niveaux — prop drilling, refactoring douloureux
3. `provide`/`inject` manuellement — possible, mais sans DevTools, sans convention, sans TypeScript natif

La solution : deux stores Pinia — `useAuthStore` et `useFamilyStore`. N'importe quel composant ou guard y accède directement. Toute mutation est immédiatement visible partout dans l'appli.

---

## 2. Théorie complète, concise

### 2.1 Installation et branchement

```bash
pnpm add pinia
```

```ts
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())   // Pinia doit être branché avant tout useXxxStore()
app.mount('#app')
```

Un seul `createPinia()` par application. Toutes les instances de store partagent ce contexte.

---

### 2.2 defineStore — style setup (recommandé, Vue 3)

La syntaxe "setup store" réutilise directement les primitives de la Composition API. Ce que tu sais déjà de `ref`, `computed` et des fonctions s'applique sans nouvelle API :

```ts
// stores/counter.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  // STATE — ref() pour les primitives et objets
  const count = ref(0)

  // GETTER — computed() ; TypeScript infère le type de retour
  const double = computed(() => count.value * 2)

  // ACTIONS — fonctions ordinaires (sync ou async)
  function increment(): void {
    count.value++
  }

  function reset(): void {
    count.value = 0
  }

  // Tout ce qui est retourné est exposé ; ce qui est omis est privé au store
  return { count, double, increment, reset }
})
```

Règles du style setup :
- `ref()` = state
- `computed()` = getter
- Fonctions = actions
- Le `return {}` est **obligatoire** — tout ce qui n'est pas retourné est inaccessible depuis les composants

---

### 2.3 defineStore — style options

La syntaxe "option store" ressemble à l'Options API Vue et à Vuex. Elle est utile pour migrer du code Vuex ou travailler avec l'Options API.

```ts
// stores/counter.ts — style options
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  // state doit être une fonction flèche — pour l'isolation entre instances SSR
  state: () => ({
    count: 0,
  }),

  getters: {
    // state est typé automatiquement depuis state()
    double(state): number {
      return state.count * 2
    },

    // Pour accéder à un autre getter : via 'this'
    // TypeScript exige une annotation de retour explicite dans ce cas
    quadruple(): number {
      return this.double * 2
    },
  },

  actions: {
    // this = l'instance du store (state + getters + autres actions)
    // Pas de .value : this.count, pas this.count.value
    increment(): void {
      this.count++
    },

    async fetchAndSet(url: string): Promise<void> {
      const data = await fetch(url).then(r => r.json())
      this.count = data.count
    },
  },
})
```

Différences clés vs le style setup :

| | Style setup | Style options |
|---|---|---|
| State | `const x = ref(0)` | `state: () => ({ x: 0 })` |
| Getter | `const g = computed(...)` | `getters: { g(state) {...} }` |
| Action | `function f() { x.value++ }` | `actions: { f() { this.x++ } }` |
| `.value` | Requis dans les actions | Non — `this.x` directement |
| `return {}` | Obligatoire | Non — tout est exposé automatiquement |

---

### 2.4 Utiliser un store dans un composant

```vue
<!-- NavBar.vue -->
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

// Appel du composable dans <script setup> — contexte Pinia actif
const auth = useAuthStore()

// auth.isAuthenticated, auth.user, auth.logout() — accès direct
// Pas besoin de .value : le proxy Pinia dé-ref automatiquement dans le script
</script>

<template>
  <nav>
    <div v-if="auth.isAuthenticated">
      <span>{{ auth.user?.name }}</span>
      <button @click="auth.logout">Déconnexion</button>
    </div>
    <RouterLink v-else to="/login">Connexion</RouterLink>
  </nav>
</template>
```

> Dans `<script setup>`, les propriétés du store sont accessibles via `auth.count` (pas `auth.count.value`). Le proxy Pinia gère le déballage — **sauf si tu déstructures** (voir 2.5).

---

### 2.5 storeToRefs — garder la réactivité en déstructurant

Déstructurer un store brise la réactivité du state et des getters : les valeurs deviennent des copies statiques au moment de la déstructuration.

```ts
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()

// BRISÉ — count et double sont des snapshots figés
// Le template ne se met JAMAIS à jour quand le store change
const { count, double } = store

// CORRECT — storeToRefs crée une ref pour chaque propriété réactive
// La réactivité est préservée : le template réagit aux mutations du store
const { count, double } = storeToRefs(store)

// Les ACTIONS sont des fonctions ordinaires — pas des refs
// Déstructuration directe depuis store (pas via storeToRefs)
const { increment, reset } = store
```

**Règle mémoire :** state + getters → `storeToRefs(store)` / actions → `store` directement.

---

### 2.6 Actions asynchrones

Une action Pinia est une fonction ordinaire — elle peut être `async` sans configuration supplémentaire.

```ts
// stores/family.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Member {
  id: string
  name: string
  isActive: boolean
}

export const useFamilyStore = defineStore('family', () => {
  const members = ref<Member[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getter — recompute automatiquement quand members change
  const activeCount = computed(() =>
    members.value.filter(m => m.isActive).length
  )

  // Action async — pattern isLoading / try / catch / finally
  async function fetchMembers(familyId: string): Promise<void> {
    isLoading.value = true    // signale le début du fetch
    error.value = null        // reset l'erreur précédente
    try {
      const res = await fetch(`/api/families/${familyId}/members`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      members.value = await res.json()
    } catch (e) {
      // e est 'unknown' en TS strict — instanceof Error avant .message
      error.value = e instanceof Error ? e.message : 'Erreur inconnue'
    } finally {
      isLoading.value = false   // s'exécute toujours, succès ou erreur
    }
  }

  async function addMember(name: string, familyId: string): Promise<void> {
    const res = await fetch(`/api/families/${familyId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const created: Member = await res.json()
    members.value.push(created)   // mise à jour optimiste — pas de re-fetch complet
  }

  return { members, isLoading, error, activeCount, fetchMembers, addMember }
})
```

Points importants :
- `isLoading` et `error` sont dans le state du store — tout composant peut les lire directement
- Le `try/catch/finally` dans l'action concentre la gestion d'erreur — les composants n'ont pas à la gérer
- Une action peut en appeler une autre : `addMember` peut appeler `fetchMembers` en fin si besoin

---

### 2.7 Composition de stores

Un store peut appeler un autre store à l'intérieur de son setup function. C'est le mécanisme qui remplace les modules imbriqués de Vuex.

```ts
// stores/family.ts — composition avec useAuthStore
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'    // import de l'autre store

export const useFamilyStore = defineStore('family', () => {
  // Appel du composable à l'intérieur du setup — contexte Pinia actif
  const auth = useAuthStore()

  const members = ref<Member[]>([])

  async function fetchMembers(familyId: string): Promise<void> {
    // Accès au token de auth sans prop drilling ni inject
    const res = await fetch(`/api/families/${familyId}/members`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
    members.value = await res.json()
  }

  return { members, fetchMembers }
})
```

Pour le style options, la composition se fait à l'intérieur des actions (pas dans `state` ni `getters`) :

```ts
// Style options — composition dans une action
actions: {
  async fetchMembers(familyId: string): Promise<void> {
    const auth = useAuthStore()   // appel ici, pas au niveau du module
    const res = await fetch(`/api/families/${familyId}/members`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
    this.members = await res.json()
  },
},
```

Règle absolue : appeler `useOtherStore()` **à l'intérieur** d'une fonction (setup function ou action), **jamais au niveau module**.

---

### 2.8 Plugins et persistance

Pinia expose un système de plugins — chaque plugin reçoit le contexte de chaque store à sa création.

**En production : `pinia-plugin-persistedstate`**

```bash
pnpm add pinia-plugin-persistedstate
```

```ts
// main.ts
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
```

Activation par store — troisième argument de `defineStore` :

```ts
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<User | null>(null)
  return { token, user }
}, {
  persist: true   // sauvegarde tout le state dans localStorage
})
```

Options fines — sauvegarder seulement certaines propriétés :

```ts
}, {
  persist: {
    key: 'tz-auth',       // clé localStorage personnalisée (défaut = store id)
    pick: ['token'],      // sauvegarder uniquement le token, pas l'objet user complet
  },
})
```

**Plugin custom minimal pour comprendre le mécanisme :**

```ts
// plugins/piniaLogger.ts
import type { PiniaPlugin } from 'pinia'

export const piniaLogger: PiniaPlugin = ({ store }) => {
  // $subscribe déclenche le callback à chaque mutation du state
  store.$subscribe((mutation) => {
    // mutation.type : 'direct' | 'patch object' | 'patch function'
    console.log(`[${store.$id}] mutation:`, mutation.type)
  })
}

// main.ts
pinia.use(piniaLogger)
```

`store.$id` est la clé unique passée en premier argument à `defineStore`.

---

### 2.9 Pinia vs Vuex — ce qui change

| | Vuex 4 | Pinia 2 |
|---|---|---|
| Mutations | Obligatoires (`commit`) | Supprimées — action directe |
| Modules imbriqués | Oui (namespacing) | Non — stores plats composés |
| Composition API | Partielle | Native (style setup) |
| TypeScript | Verbeux, inférence difficile | Natif, zéro boilerplate |
| DevTools | Oui | Oui (meilleur tracking) |
| Taille bundle | ~6 KB | ~1 KB |
| Statut Vue 3 | Maintenance uniquement | Recommandé officiel |

En Vuex, les mutations existaient pour garantir la traçabilité synchrone dans les DevTools. Pinia traque les mutations directement via le Proxy réactif — la traçabilité est native, les mutations sont superflues.

> Vuex 4 est en maintenance. Pour tout nouveau projet Vue 3, utiliser Pinia.

---

## 3. Worked examples

### Exemple — `useAuthStore` complet (style setup, TribuZen)

```ts
// stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'member'
}

export const useAuthStore = defineStore('auth', () => {
  // ── STATE ──────────────────────────────────────────────────────────────
  // null = personne n'est connecté
  const user = ref<User | null>(null)
  // Tente de récupérer un token persisté (connexion précédente)
  const token = ref<string | null>(localStorage.getItem('tz-token'))

  // ── GETTERS ────────────────────────────────────────────────────────────
  // !! (double négation) : convertit token.value en boolean strict
  const isAuthenticated = computed(() => !!token.value)
  // ?. : accès sûr si user.value est null (pas d'erreur runtime)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // ── ACTIONS ────────────────────────────────────────────────────────────

  async function login(email: string, password: string): Promise<void> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    // Erreur HTTP → on propage : le composant appelant gère l'affichage
    if (!res.ok) throw new Error(await res.text())

    const data = await res.json()   // { token: string, user: User }

    token.value = data.token
    user.value = data.user
    localStorage.setItem('tz-token', data.token)   // persistence manuelle du token
  }

  function logout(): void {
    user.value = null
    token.value = null
    localStorage.removeItem('tz-token')
  }

  // Appelé au démarrage de l'app — hydrate le user si un token localStorage existe
  async function fetchProfile(): Promise<void> {
    if (!token.value) return   // pas de token = rien à faire

    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token.value}` },
    })

    if (res.ok) {
      user.value = await res.json()
    } else {
      // Token expiré ou invalide — nettoyage propre
      logout()
    }
  }

  return { user, token, isAuthenticated, isAdmin, login, logout, fetchProfile }
})
```

Consommation dans un guard Vue Router :

```ts
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('@/views/LoginView.vue') },
    {
      path: '/dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// Le guard s'exécute APRÈS app.use(pinia) — useAuthStore() est sûr ici
// Appel dans la fonction du guard, pas au niveau module
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return '/login'
  }
})

export default router
```

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Déstructurer le store sans storeToRefs

```ts
const store = useCounterStore()

// BRISÉ — count et double sont des snapshots figés
// Le template affiche la valeur initiale et ne réagit plus jamais
const { count, double, increment } = store

// CORRECT — storeToRefs pour les propriétés réactives
const { count, double } = storeToRefs(store)
const { increment } = store   // actions : déstructuration directe
```

Symptôme classique : la valeur affichée dans le template reste figée même après l'appel d'une action. Le store a bien changé, mais la variable locale ne pointe plus vers la réactivité.

---

### PIÈGE #2 — Muter le state hors d'une action (habitude Vuex)

En Vuex, muter le state directement (hors mutation) déclenchait une erreur. En Pinia c'est **techniquement autorisé** mais perd la traçabilité DevTools.

```ts
const store = useCounterStore()

// Mutation directe — fonctionne mais n'apparaît pas comme action dans DevTools
store.count++

// $patch — pour muter plusieurs propriétés atomiquement
store.$patch({ count: store.count + 1 })

// RECOMMANDÉ — via une action (traçabilité complète, logique encapsulée)
store.increment()
```

En pratique : réserver la mutation directe aux `v-model` simples. Pour toute logique métier, passer par une action.

---

### PIÈGE #3 — Appeler le store au niveau module, hors setup

```ts
// AU NIVEAU MODULE — Pinia n'est peut-être pas encore installé
// Erreur : "getActivePinia() was called with no active Pinia"
const auth = useAuthStore()   // appelé au chargement du fichier, avant app.use()

export function setupGuards(router: Router) {
  // CORRECT — appel à l'intérieur d'une fonction, après app.use(pinia)
  router.beforeEach(() => {
    const auth = useAuthStore()   // Pinia est actif à ce moment
    if (!auth.isAuthenticated) return '/login'
  })
}
```

---

### PIÈGE #4 — Oublier le `return {}` dans un store setup

```ts
export const useFamilyStore = defineStore('family', () => {
  const members = ref<Member[]>([])
  const error = ref<string | null>(null)
  async function fetchMembers() { /* ... */ }

  // error et fetchMembers omis du return — invisibles pour les composants
  return { members }
})

// Dans un composant :
const store = useFamilyStore()
console.log(store.error)         // undefined — TypeScript ne le détecte pas toujours
store.fetchMembers('fam-1')      // TypeError : store.fetchMembers is not a function
```

---

## 5. Ancrage TribuZen

TribuZen utilise deux stores centraux qui couvrent tout l'état partagé du front-office.

**`useAuthStore`** (Worked example) — state de session. Consommé par :
- `NavBar.vue` — nom et avatar de l'utilisateur connecté
- Tous les guards (`requiresAuth`, `requiresAdmin`)
- `useFamilyStore` — pour envoyer le token Bearer dans les headers API

**`useFamilyStore`** — famille courante et ses membres. Consommé par :
- `DashboardView.vue` — affichage des membres, compteurs, formulaire d'ajout
- `FamilyMemberList.vue` — liste filtrée via `storeToRefs`

```
tribuzen/
  src/
    stores/
      auth.ts          ← useAuthStore — session et token
      family.ts        ← useFamilyStore — membres et état de chargement
    views/
      DashboardView.vue     ← consomme les deux stores
    router/
      index.ts              ← guards utilisent useAuthStore
```

Au démarrage (`App.vue` `onMounted`), `auth.fetchProfile()` est appelé pour hydrater `useAuthStore` depuis le token localStorage — TribuZen reste connecté entre les rechargements de page.

---

## 6. Points clés

1. `createPinia()` s'installe une fois dans `main.ts` via `app.use()` — avant tout appel à `useXxxStore()`.
2. Style setup : `ref()` = state, `computed()` = getter, fonctions = actions. Le `return {}` est obligatoire.
3. Style options : `state()`, `getters`, `actions` déclarés séparément — `this` dans les actions accède au state sans `.value`.
4. Dans un composant, appeler le composable dans `<script setup>` — accès direct via `store.propriété`.
5. Déstructurer un store brise la réactivité — `storeToRefs()` pour state + getters, déstructuration directe pour les actions.
6. Les actions peuvent être `async` — pattern `isLoading` + `error` dans le state pour exposer l'état de la requête à tous les consommateurs.
7. Un store compose un autre store en appelant son composable à l'intérieur du setup function — jamais au niveau module.
8. `pinia-plugin-persistedstate` active la persistance localStorage par store avec `persist: true` ou des options fines (`pick`, `key`).
9. Pinia remplace Vuex officiellement — plus de mutations, stores plats composés, TypeScript natif.

---

## 7. Seeds Anki

```
Quelle est la règle storeToRefs — quand l'utiliser et pour quoi ?|storeToRefs(store) pour déstructurer state et getters (préserve la réactivité). Actions directement depuis store car ce sont des fonctions, pas des refs.
Pourquoi la déstructuration directe d'un store Pinia brise-t-elle la réactivité ?|La déstructuration copie les valeurs primitives au moment de l'appel. storeToRefs() crée des refs liées au proxy réactif du store, pas des copies.
Quelle est la différence entre style setup et style options pour un store Pinia ?|Setup : ref/computed/fonctions + return {} obligatoire, .value requis dans les actions. Options : state()/getters/actions séparés, this dans les actions, tout exposé automatiquement.
Quelle erreur indique un store appelé hors contexte Pinia actif ?|"getActivePinia() was called with no active Pinia" — le composable est appelé avant app.use(createPinia()) ou au niveau module au lieu d'une fonction.
Comment un store Pinia compose un autre store ?|En appelant useOtherStore() à l'intérieur du setup function (style setup) ou d'une action (style options). Jamais au niveau module du fichier.
Pourquoi Pinia n'a-t-il plus de mutations contrairement à Vuex ?|Vuex avait besoin des mutations pour la traçabilité synchrone dans les DevTools. Pinia traque les mutations directement via le Proxy réactif — la traçabilité est native, les mutations sont superflues.
Comment activer la persistance localStorage sur un store Pinia spécifique ?|Avec pinia-plugin-persistedstate : pinia.use(piniaPluginPersistedstate) dans main.ts, puis persist: true comme troisième argument de defineStore. Option pick pour choisir quelles propriétés persister.
Que se passe-t-il si on omet une propriété du return dans un store setup Pinia ?|La propriété est privée au store — inaccessible depuis les composants. store.maProp vaut undefined, store.monAction est undefined (TypeError à l'appel). TypeScript ne détecte pas toujours l'omission.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-15-pinia/README.md`. Construire `useFamilyStore` et `FamilyDashboard.vue` avec Pinia 2 + Vue 3.5 — store setup complet, actions async, storeToRefs, corrigé commenté intégral.
