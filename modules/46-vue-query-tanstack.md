---
titre: TanStack Query (Vue Query)
cours: 02-vue
notions: [server state vs client state, useQuery clés et fetch, staleTime et gcTime cache, useMutation et invalidation, refetch et background updates, états loading error success, query keys structurées, devtools Vue Query]
outcomes:
  - sait distinguer server state et client state et pourquoi Vue Query
  - sait charger des données avec useQuery (clés, staleTime, cache)
  - sait muter et invalider le cache avec useMutation
  - sait gérer refetch, background updates et les états
prerequis: [45-rbac-et-permissions]
next: 47-vue-query-patterns-avances
libs: [{ name: vue, version: "3.5" }, { name: "@tanstack/vue-query", version: "5" }]
tribuzen: front-office TribuZen — server state du feed et des familles via Vue Query (cache, invalidation après invitation)
last-reviewed: 2026-07
---

# TanStack Query (Vue Query)

> **Outcomes — tu sauras FAIRE :** distinguer server state et client state, charger des données avec `useQuery` (clés, cache, staleTime), muter et invalider le cache avec `useMutation`, gérer les états `isPending`/`isError`/`isFetching` et les background updates.
> **Difficulté :** :star::star::star:

## 1. Cas concret d'abord

Tu intègres l'équipe TribuZen. La page d'accueil doit afficher le feed des familles invitées par l'utilisateur connecté. Un collègue t'a laissé ce début de composant :

```vue
<!-- FeedPage.vue — AVANT Vue Query -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Family {
  id: string
  name: string
  memberCount: number
}

const families = ref<Family[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  isLoading.value = true
  try {
    const res = await fetch('/api/families/feed')
    if (!res.ok) throw new Error('Erreur serveur')
    families.value = await res.json()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erreur inconnue'
  } finally {
    isLoading.value = false
  }
})
</script>
```

**Cinq problèmes que tu ne vois pas encore :**

1. Chaque fois que l'utilisateur navigue vers cette page, la requête repart — même si les données ont été chargées il y a 3 secondes.
2. Si deux composants ont besoin du feed, deux requêtes partent en parallèle.
3. Aucun retry si le serveur répond 503 en pic de charge.
4. Quand l'utilisateur envoie une invitation et revient sur le feed, les données sont périmées mais rien ne le signale.
5. ~20 lignes de boilerplate à répéter pour chaque endpoint.

Ce module te donne `useQuery` et `useMutation` pour éliminer ces cinq problèmes en une dizaine de lignes.

---

## 2. Théorie complète, concise

### 2.1 Server state vs client state — le point clé

C'est la distinction fondamentale qui justifie l'existence de Vue Query.

**Client state** = données qui appartiennent entièrement au navigateur et au composant. Elles sont synchrones, toujours à jour, contrôlées par toi.

```ts
// Client state typique — Pinia ou ref local
const sidebarOpen = ref(false)
const selectedTab = ref<'feed' | 'settings'>('feed')
const draftMessage = ref('')
```

**Server state** = données qui vivent sur le serveur. Elles sont asynchrones, potentiellement périmées, partagées par plusieurs utilisateurs, et tu n'en es pas propriétaire.

```ts
// Server state — tu demandes au serveur, il peut répondre une chose différente
// à t'avoir demandé il y a 5 secondes
const families = await fetch('/api/families/feed').then(r => r.json())
```

**Pourquoi cette distinction est cruciale :**

| Caractéristique | Client state | Server state |
|---|---|---|
| Propriétaire | Toi (navigateur) | Serveur / base de données |
| Synchronisation requise | Non | Oui (données peuvent changer) |
| Persiste entre sessions | Optionnel | Oui (en base) |
| Outils adaptés | Pinia, `ref` | Vue Query |

**L'erreur classique** : mettre du server state dans Pinia. Ça marche, mais tu réinventes la gestion du cache, de la fraîcheur et des erreurs à la main, pour chaque store.

### 2.2 Installation et setup

```bash
pnpm add @tanstack/vue-query
```

```ts
// main.ts
import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'

const app = createApp(App)
app.use(VueQueryPlugin)     // active Vue Query dans toute l'application
app.mount('#app')
```

`VueQueryPlugin` crée un `QueryClient` global (le moteur de cache). Tous les composables `useQuery`/`useMutation` s'y connectent automatiquement.

### 2.3 useQuery — charger des données

```ts
import { useQuery } from '@tanstack/vue-query'

const {
  data,        // les données (type inféré depuis queryFn, ou undefined avant réponse)
  isPending,   // true = PREMIER chargement, aucune donnée en cache — v5 remplace isLoading
  isFetching,  // true = requête en cours (y compris background refetch)
  isError,     // true = la dernière requête a échoué
  error,       // Error | null
  refetch,     // () => void — forcer un rechargement manuel
} = useQuery({
  queryKey: ['families', 'feed'],   // identifiant du cache
  queryFn: async () => {
    const res = await fetch('/api/families/feed')
    if (!res.ok) throw new Error('Erreur serveur')
    return res.json() as Promise<Family[]>
  },
  staleTime: 30_000,   // données fraîches pendant 30 secondes
})
```

> **v5 — renommage important :** `isLoading` de v4 s'appelle `isPending` en v5. En v5, `isLoading` existe toujours mais signifie `isPending && isFetching` (équivalent de l'ancien `isInitialLoading`). Pour « premier chargement sans donnée en cache », utiliser `isPending`.

### 2.4 Query keys structurées — l'identité du cache

La `queryKey` est un tableau qui identifie de façon unique une entrée de cache. Elle doit contenir **tout ce qui influence le résultat**.

```ts
// Clé simple — toutes les familles du feed
useQuery({ queryKey: ['families', 'feed'], queryFn: fetchFeed })

// Clé avec ID — une famille spécifique
useQuery({ queryKey: ['families', familyId], queryFn: () => fetchFamily(familyId) })

// Clé avec filtres — feed paginé avec un statut
useQuery({
  queryKey: ['families', 'feed', { page, status }],
  queryFn: () => fetchFeed({ page: page.value, status: status.value }),
})
```

**Convention recommandée (factory pattern) :**

```ts
// composables/queryKeys.ts
export const familyKeys = {
  all:        () => ['families'] as const,
  feed:       () => ['families', 'feed'] as const,
  detail:     (id: string) => ['families', id] as const,
  invitations:(id: string) => ['families', id, 'invitations'] as const,
}
```

Avantage : `invalidateQueries({ queryKey: familyKeys.all() })` invalide toutes les queries dont la clé commence par `['families']` — y compris `feed` et les détails.

**Clé avec ref réactive :** quand la clé contient une `ref`, Vue Query repart automatiquement en fetch quand la valeur change.

```ts
const familyId = ref<string>('fam-001')

useQuery({
  queryKey: ['families', familyId],        // ref directement dans la clé
  queryFn: () => fetchFamily(familyId.value),
})

// familyId.value = 'fam-002' → Vue Query refetch automatiquement
```

### 2.5 staleTime vs gcTime — les deux horloges du cache

Ces deux options contrôlent deux choses différentes.

**`staleTime`** (défaut : `0`) — combien de temps les données sont considérées **fraîches**. Pendant cette durée, Vue Query ne refetch pas, même si un composant se remonte ou que la fenêtre reprend le focus.

**`gcTime`** (défaut : `5 * 60 * 1000` soit 5 min) — combien de temps les données inactives restent **en mémoire** après que tous les composants qui les utilisent sont démontés. Après ce délai, elles sont supprimées.

```
Requête résolue
       │
       ▼
  ┌─────────┐ staleTime ┌─────────┐ gcTime (depuis inactivité) ┌──────────┐
  │  FRESH  │ ─────────▶│  STALE  │ ───────────────────────────▶│ GARBAGE  │
  │ pas de  │           │ affiché │                             │ supprimé │
  │ refetch │           │ + bg    │                             │ mémoire  │
  └─────────┘           │ refetch │                             └──────────┘
                        └─────────┘
```

```ts
useQuery({
  queryKey: familyKeys.feed(),
  queryFn: fetchFeed,
  staleTime: 30_000,          // fraîcheur 30 secondes
  gcTime: 5 * 60 * 1000,      // en mémoire 5 min après démontage
  refetchOnWindowFocus: true,  // refetch quand l'onglet reprend le focus (défaut: true)
  retry: 3,                    // 3 tentatives automatiques avant isError
})
```

> **gcTime remplace cacheTime en v5.** Si tu vois `cacheTime` dans du code, c'est de la v4.

### 2.6 useMutation — écrire et invalider

`useMutation` gère les opérations d'écriture (POST, PUT, PATCH, DELETE). La clé est le callback `onSuccess` qui invalide le cache pour forcer un refetch.

```ts
import { useMutation, useQueryClient } from '@tanstack/vue-query'

const queryClient = useQueryClient()   // accès au cache global

const {
  mutate,       // (variables) => void — déclenche la mutation
  mutateAsync,  // (variables) => Promise — version awaitable
  isPending,    // true = mutation en cours
  isError,      // true = la mutation a échoué
  error,        // Error | null
  reset,        // réinitialise l'état de la mutation
} = useMutation({
  mutationFn: async (inviteeId: string) => {
    const res = await fetch(`/api/families/feed/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteeId }),
    })
    if (!res.ok) throw new Error('Invitation échouée')
    return res.json()
  },
  onSuccess: () => {
    // invalide le cache du feed → Vue Query refetch automatiquement
    queryClient.invalidateQueries({ queryKey: familyKeys.feed() })
  },
  onError: (err) => {
    console.error('Invitation échouée :', err.message)
  },
})
```

### 2.7 Refetch et background updates — comment Vue Query maintient la fraîcheur

Vue Query refetch automatiquement dans trois cas :

1. **`refetchOnWindowFocus`** (défaut : `true`) — quand l'onglet revient au premier plan. Pratique si l'utilisateur a ouvert un autre onglet et modifié des données.
2. **`refetchInterval`** — polling à intervalle fixe (utile pour des données en temps quasi-réel).
3. **Invalidation explicite** via `queryClient.invalidateQueries()` — cas le plus courant après une mutation.

```ts
// Refetch manuel (bouton "Actualiser")
const { refetch } = useQuery({ queryKey: familyKeys.feed(), queryFn: fetchFeed })

// Polling toutes les 60 secondes
useQuery({
  queryKey: familyKeys.feed(),
  queryFn: fetchFeed,
  refetchInterval: 60_000,
})
```

**Background refetch :** quand les données sont `stale` et qu'un refetch se déclenche, Vue Query affiche les **données en cache pendant que la nouvelle requête tourne**. `isFetching` passe à `true`, `isPending` reste `false`. C'est ce qu'on appelle le background update — l'utilisateur voit toujours quelque chose, jamais un spinner de premier chargement pour une ressource déjà connue.

### 2.8 Devtools Vue Query

Vue Query embarque des devtools pour inspecter le cache en développement.

```bash
pnpm add @tanstack/vue-query-devtools
```

```vue
<!-- App.vue -->
<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
</script>

<template>
  <RouterView />
  <!-- affiché uniquement en développement (tree-shaken en production) -->
  <VueQueryDevtools />
</template>
```

Les devtools permettent de voir : l'état de chaque query (fresh/stale/fetching/error), le contenu du cache, l'âge des données, et de déclencher des refetch ou invalidations manuellement.

---

## 3. Worked examples

### Exemple 1 — useQuery feed TribuZen

Composable dédié qui encapsule la query du feed des familles.

```ts
// composables/useFeedQuery.ts
import { useQuery } from '@tanstack/vue-query'

export interface FeedFamily {
  id: string
  name: string
  memberCount: number
  lastActivity: string   // ISO date string
}

// Factory de clés centralisée — partagée avec useMutation
export const familyKeys = {
  feed: () => ['families', 'feed'] as const,
  detail: (id: string) => ['families', id] as const,
}

async function fetchFeed(): Promise<FeedFamily[]> {
  const res = await fetch('/api/families/feed')
  if (!res.ok) throw new Error(`Erreur serveur ${res.status}`)
  return res.json()
}

export function useFeedQuery() {
  return useQuery({
    queryKey: familyKeys.feed(),
    queryFn: fetchFeed,
    staleTime: 30_000,           // fraîcheur 30 secondes
    gcTime: 5 * 60 * 1000,       // en mémoire 5 min après démontage
    retry: 3,                     // 3 tentatives en cas d'erreur réseau
    refetchOnWindowFocus: true,   // refetch au retour sur l'onglet
  })
}
```

```vue
<!-- FeedPage.vue — avec Vue Query -->
<script setup lang="ts">
import { useFeedQuery } from '@/composables/useFeedQuery'

const { data: families, isPending, isError, error, isFetching } = useFeedQuery()
</script>

<template>
  <div class="feed">
    <!-- En-tête avec indicateur de rechargement en arrière-plan -->
    <header>
      <h1>Feed TribuZen</h1>
      <!-- isFetching = true même en background update (isPending serait false) -->
      <span v-if="isFetching && !isPending" class="refresh-indicator">
        Actualisation…
      </span>
    </header>

    <!-- Premier chargement : pas encore de données en cache -->
    <div v-if="isPending">Chargement du feed…</div>

    <!-- Erreur après épuisement des tentatives -->
    <div v-else-if="isError" class="error">
      {{ error?.message ?? 'Erreur inconnue' }}
    </div>

    <!-- Données disponibles (même si isFetching en background) -->
    <ul v-else>
      <li v-for="family in families" :key="family.id">
        <strong>{{ family.name }}</strong>
        <span>{{ family.memberCount }} membre(s)</span>
      </li>
    </ul>
  </div>
</template>
```

**Ce qu'on a gagné vs le code initial :** zéro `onMounted`, zéro gestion manuelle des états, cache partagé si le composant est monté deux fois, retry automatique, background update visible via `isFetching`.

### Exemple 2 — useMutation invitation avec invalidation

```ts
// composables/useInviteMutation.ts
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { familyKeys } from './useFeedQuery'

interface InvitePayload {
  familyId: string
  inviteeEmail: string
}

interface InviteResponse {
  invitationId: string
  status: 'pending' | 'sent'
}

async function sendInvitation(payload: InvitePayload): Promise<InviteResponse> {
  const res = await fetch('/api/invitations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Invitation échouée ${res.status}`)
  return res.json()
}

export function useInviteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: sendInvitation,
    onSuccess: (_data, variables) => {
      // Invalide le feed global (la liste des familles a peut-être changé)
      queryClient.invalidateQueries({ queryKey: familyKeys.feed() })

      // Invalide aussi le détail de la famille concernée
      queryClient.invalidateQueries({ queryKey: familyKeys.detail(variables.familyId) })
    },
    onError: (err) => {
      console.error('Invitation échouée :', err.message)
    },
  })
}
```

```vue
<!-- InviteForm.vue — formulaire d'invitation -->
<script setup lang="ts">
import { ref } from 'vue'
import { useInviteMutation } from '@/composables/useInviteMutation'

const props = defineProps<{ familyId: string }>()

const email = ref('')
const { mutate: invite, isPending, isError, error, isSuccess, reset } = useInviteMutation()

function submit() {
  invite(
    { familyId: props.familyId, inviteeEmail: email.value },
    {
      // callbacks locaux (onSuccess/onError peuvent aussi être passés ici)
      onSuccess: () => { email.value = '' },
    }
  )
}
</script>

<template>
  <form @submit.prevent="submit">
    <input
      v-model="email"
      type="email"
      placeholder="Email de l'invité"
      :disabled="isPending"
    />

    <button type="submit" :disabled="isPending || !email">
      {{ isPending ? 'Envoi…' : 'Inviter' }}
    </button>

    <p v-if="isError" class="error">{{ error?.message }}</p>
    <p v-if="isSuccess" class="success">Invitation envoyée !</p>
  </form>
</template>
```

**Flux complet :** l'utilisateur soumet → `mutationFn` envoie le POST → `onSuccess` appelle `invalidateQueries` sur `feed` et `detail` → Vue Query refetch automatiquement → `FeedPage` se met à jour sans aucun code supplémentaire.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Mettre du server state dans Pinia

```ts
// ❌ Server state dans Pinia — tu réinventes Vue Query, sans le cache ni le retry
export const useFamilyStore = defineStore('family', () => {
  const families = ref<Family[]>([])
  const loading = ref(false)

  async function fetchFamilies() {
    loading.value = true
    families.value = await fetch('/api/families').then(r => r.json())
    loading.value = false
    // Pas de retry, pas de cache, pas de staleTime, pas d'invalidation...
  }

  return { families, loading, fetchFamilies }
})

// ✅ Server state dans Vue Query — cache, retry, invalidation, states inclus
export function useFamiliesQuery() {
  return useQuery({ queryKey: ['families'], queryFn: fetchFamilies, staleTime: 30_000 })
}
// Pinia garde son rôle : UI state (sidebar, thème, préférences)
```

### PIÈGE #2 — Query key instable (objet recréé à chaque render)

```ts
// ❌ Objet littéral recréé à chaque appel → Vue Query pense que la clé change en permanence
useQuery({
  queryKey: ['families', { page: page.value, role: 'admin' }],  // recréé à chaque render
  queryFn: fetchFamilies,
})

// ✅ Clé avec ref — Vue Query détecte le changement de valeur, pas de recréation d'objet
const page = ref(1)
useQuery({
  queryKey: ['families', { page, role: 'admin' }],  // ref stable dans la clé
  queryFn: () => fetchFamilies({ page: page.value }),
})
```

### PIÈGE #3 — Confondre isPending et isFetching (v5)

```ts
const { isPending, isFetching, data } = useQuery({ queryKey: [...], queryFn: ... })

// isPending = true UNIQUEMENT au premier chargement, quand il n'y a aucune donnée en cache
// Utiliser pour afficher le spinner initial (skeleton, loader)

// isFetching = true dès qu'une requête est en cours, y compris les background updates
// Utiliser pour l'indicateur "Actualisation en cours" discret

// ❌ Afficher le spinner sur isFetching → spinner à chaque background update = UX dégradée
<div v-if="isFetching">Chargement…</div>

// ✅ Spinner sur isPending (premier chargement), indicateur discret sur isFetching
<div v-if="isPending">Chargement initial…</div>
<span v-else-if="isFetching">Actualisation…</span>
<ul v-else>...</ul>
```

### PIÈGE #4 — Sur-invalider le cache

```ts
// ❌ Invalider toutes les queries après chaque mutation — refetch massif inutile
queryClient.invalidateQueries()   // invalide TOUT — éviter sauf cas exceptionnel

// ✅ Invalider uniquement les queries affectées
queryClient.invalidateQueries({ queryKey: familyKeys.feed() })

// ✅ Invalider par préfixe hiérarchique (invalide feed, detail, invitations...)
queryClient.invalidateQueries({ queryKey: familyKeys.all() })
```

---

## 5. Ancrage TribuZen

Vue Query prend en charge tout le **server state du front-office TribuZen**.

**Feed des familles** (`FeedPage.vue`) — `useFeedQuery()` avec `staleTime: 30_000`. Le feed est long à construire côté serveur (agrégation de plusieurs familles) : la fraîcheur de 30 secondes évite de le reconstruire à chaque navigation.

**Détail d'une famille** (`FamilyDetailPage.vue`) — `useQuery({ queryKey: familyKeys.detail(id), queryFn: fetchFamily })`. Clé avec ID : chaque famille a son entrée de cache indépendante.

**Invitation** (`InviteForm.vue`) — `useInviteMutation()` invalide `familyKeys.feed()` et `familyKeys.detail(familyId)` dans `onSuccess`. Le feed et le détail se mettent à jour automatiquement après invitation — sans aucun code de synchronisation manuel.

**Ce qui reste dans Pinia :** `sidebarOpen`, `selectedTab`, `currentUserId` (chargé une fois à l'auth, pas re-fetché), notifications toast.

Fichiers cibles dans `smaurier/tribuzen` :

```
tribuzen/
  src/
    composables/
      useFeedQuery.ts          ← useQuery du feed, queryKeys factory
      useInviteMutation.ts     ← useMutation invitation + invalidation
    pages/
      FeedPage.vue             ← consomme useFeedQuery
    components/
      family/
        InviteForm.vue         ← consomme useInviteMutation
```

---

## 6. Points clés

1. **Server state** = données sur le serveur, potentiellement périmées — outil adapté : Vue Query. **Client state** = données locales au navigateur — outil adapté : Pinia ou `ref`.
2. `useQuery` prend un objet `{ queryKey, queryFn, staleTime, ... }` — seul format valide en v5 (plus d'overload positionnel).
3. `queryKey` doit contenir tout ce qui change le résultat — si un paramètre manque, le cache renverra des données incorrectes.
4. `staleTime` = durée de fraîcheur (pas de refetch pendant cette période). `gcTime` = durée de rétention en mémoire après démontage (remplace `cacheTime` de v4).
5. `isPending` = premier chargement sans donnée (anciennement `isLoading` en v4). `isFetching` = toute requête en cours y compris background.
6. `useMutation` + `invalidateQueries` dans `onSuccess` = le flux standard pour synchroniser server state après écriture.
7. Factory de query keys (`familyKeys`) = invalide par préfixe hierarchique, évite les strings éparpillées.
8. `VueQueryDevtools` = indispensable en développement pour inspecter le cache et diagnostiquer les problèmes de fraîcheur.

---

## 7. Seeds Anki

```
Quelle est la différence entre server state et client state dans Vue Query ?|Server state = données sur le serveur, asynchrones, potentiellement périmées → Vue Query. Client state = données locales au navigateur, synchrones, contrôlées → Pinia / ref.
Que fait staleTime dans useQuery et quelle est sa valeur par défaut ?|staleTime = durée pendant laquelle les données sont considérées fraîches (pas de refetch). Défaut : 0 (périmé immédiatement). Exemple : staleTime: 30_000 = fraîcheur 30 secondes.
Quelle est la différence entre isPending et isFetching en @tanstack/vue-query v5 ?|isPending = premier chargement, aucune donnée en cache (anciennement isLoading en v4). isFetching = toute requête en cours, y compris background updates. Utiliser isPending pour le spinner initial, isFetching pour l'indicateur discret.
Comment invalider le cache après une mutation dans useMutation ?|Via onSuccess : queryClient.invalidateQueries({ queryKey: ['ma-clé'] }). Cela force un refetch de toutes les queries dont la clé commence par ['ma-clé'].
Pourquoi gcTime remplace-t-il cacheTime en v5 et que fait-il ?|gcTime (garbage collection time) contrôle combien de temps les données inactives restent en mémoire après que tous les composants qui les utilisaient sont démontés. Défaut : 5 minutes. cacheTime était le nom v4 — même concept.
Pourquoi mettre du server state dans Pinia est-il un anti-pattern ?|Pinia ne gère ni le cache, ni la fraîcheur, ni le retry, ni l'invalidation automatique. On réinvente Vue Query manuellement, avec plus de code et moins de fiabilité. Server state → Vue Query. UI state → Pinia.
Qu'est-ce qu'une query key factory et pourquoi l'utiliser ?|C'est un objet de fonctions qui centralisent les queryKey (ex: familyKeys.feed(), familyKeys.detail(id)). Avantage : invalidateQueries({ queryKey: familyKeys.all() }) invalide toutes les queries familles par préfixe, sans dupliquer les strings.
Comment déclencher un refetch automatique quand un paramètre change dans useQuery ?|Mettre la ref directement dans la queryKey : queryKey: ['families', familyId]. Quand familyId.value change, Vue Query détecte le changement et refetch automatiquement. Ne pas mettre familyId.value dans la clé (valeur capturée, pas réactive).
```

---

## Pont vers le lab

> Lab associé : `labs/lab-46-vue-query-tanstack/README.md`. Construction pas-à-pas d'un composable `useFeedQuery` et d'une mutation d'invitation avec invalidation — vrai `@tanstack/vue-query` v5, corrigé commenté intégral.

---

**Navigation :** ← [Module 45 — RBAC et permissions](45-rbac-et-permissions.md) · → [Module 47 — Vue Query patterns avancés](47-vue-query-patterns-avances.md)
