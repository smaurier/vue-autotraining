---
titre: Vue Query — patterns avancés
cours: 02-vue
notions: [mises à jour optimistes optimistic updates, pagination et keepPreviousData placeholderData, infinite queries useInfiniteQuery, prefetching, dependent queries, SSR et hydratation avec Nuxt, gestion d'erreur avancée et retry, intégration Vue Query et vue-i18n]
outcomes:
  - sait faire une mise à jour optimiste avec rollback en cas d'échec
  - sait paginer et faire de l'infinite scroll (useInfiniteQuery)
  - sait prefetch et gérer des requêtes dépendantes
  - sait utiliser Vue Query en SSR (hydratation Nuxt)
prerequis: [46-vue-query-tanstack, 27-nuxt-data-fetching]
next: fin-parcours-02-vue
libs: [{ name: vue, version: "3.5" }, { name: "@tanstack/vue-query", version: "5" }]
tribuzen: front-office TribuZen — feed en infinite scroll, invitation en optimistic update, prefetch du détail famille au survol
last-reviewed: 2026-07
---

# Vue Query — patterns avancés

> **Outcomes — tu sauras FAIRE :** implémenter une mise à jour optimiste avec rollback, paginer et faire de l'infinite scroll avec `useInfiniteQuery`, prefetch des données au survol, chaîner des requêtes dépendantes, hydrater Vue Query en SSR avec Nuxt.
> **Difficulté :** :star::star::star::star:

## 1. Cas concret d'abord

Tu travailles sur le feed TribuZen. Trois problèmes à résoudre aujourd'hui :

**Problème 1 — l'invitation freeze l'UI.** Quand un membre envoie une invitation à rejoindre sa famille, il clique sur « Inviter », puis attend 600 ms le spinner, puis voit la liste mise à jour. Le chef produit dit : « ça fait vieux ».

**Problème 2 — le feed charge tout d'un coup.** La liste des posts de la famille fait 300 items. Charger tout au premier rendu est lent et coûteux. Il faut de l'infinite scroll : charger 20 items, puis 20 de plus quand l'utilisateur arrive en bas.

**Problème 3 — le détail famille est lent au clic.** Quand l'utilisateur passe la souris sur une carte famille, il n'y a pas de raison d'attendre le clic pour charger les détails. Le survol prédit l'intention.

Vue Query v5 a un pattern exact pour chacun de ces trois cas. Ce module les couvre tous, plus SSR/Nuxt, retry avancé et vue-i18n.

---

## 2. Théorie complète, concise

### 2.1 Mises à jour optimistes (optimistic updates)

Une mise à jour optimiste modifie le cache **immédiatement** lors du clic, envoie la requête en parallèle, et **rollback** si le serveur répond avec une erreur. L'utilisateur voit l'effet instantanément.

Le cycle se joue dans trois callbacks de `useMutation` :

| Callback | Rôle | Argument clé |
|----------|------|-------------|
| `onMutate` | Sauvegarde le cache, applique la mise à jour optimiste | Reçoit les mêmes args que `mutationFn` |
| `onError` | Rollback via le contexte retourné par `onMutate` | `context` = ce que `onMutate` a retourné |
| `onSettled` | Invalide les queries pour resynchroniser avec le serveur | S'exécute succès ET erreur |

```ts
import { useMutation, useQueryClient } from '@tanstack/vue-query'

interface Invitation {
  familyId: string
  inviteeEmail: string
}

interface FamilyInvitation {
  id: string
  email: string
  status: 'pending' | 'accepted' | 'declined'
}

const queryClient = useQueryClient()

const { mutate: sendInvitation } = useMutation({
  mutationFn: (inv: Invitation) =>
    fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inv),
    }).then(r => {
      if (!r.ok) throw new Error('Invitation échouée')
      return r.json() as Promise<FamilyInvitation>
    }),

  // --- onMutate : s'exécute AVANT la requête ---
  onMutate: async (inv: Invitation) => {
    // 1. Annuler les GET en vol sur cette clé — évite qu'un refetch
    //    écrase le cache optimiste avant que la mutation termine
    await queryClient.cancelQueries({ queryKey: ['invitations', inv.familyId] })

    // 2. Sauvegarder l'état actuel du cache (rollback target)
    const previous = queryClient.getQueryData<FamilyInvitation[]>(
      ['invitations', inv.familyId]
    )

    // 3. Écrire l'état optimiste dans le cache
    queryClient.setQueryData<FamilyInvitation[]>(
      ['invitations', inv.familyId],
      old => [
        ...(old ?? []),
        { id: `optimistic-${Date.now()}`, email: inv.inviteeEmail, status: 'pending' },
      ]
    )

    // 4. Retourner le contexte pour pouvoir rollback dans onError
    return { previous, familyId: inv.familyId }
  },

  // --- onError : rollback ---
  onError: (_err, _inv, context) => {
    if (context?.previous !== undefined) {
      queryClient.setQueryData(
        ['invitations', context.familyId],
        context.previous
      )
    }
  },

  // --- onSettled : resynchroniser quoi qu'il arrive ---
  onSettled: (_data, _err, inv) => {
    queryClient.invalidateQueries({ queryKey: ['invitations', inv.familyId] })
  },
})
```

**Pourquoi `cancelQueries` avant `setQueryData` ?** Sans cette annulation, un GET en vol qui se termine après le `setQueryData` écrase le cache optimiste — l'UI flashe et revient en arrière. `cancelQueries` coupe les vols en cours pour que le cache optimiste tienne jusqu'à `onSettled`.

### 2.2 Pagination avec `placeholderData: keepPreviousData`

En Vue Query v5, l'option `keepPreviousData` de la v4 a été supprimée comme option autonome. Elle s'exprime désormais via `placeholderData: keepPreviousData` où `keepPreviousData` est une fonction importée du package.

```ts
import { useQuery, keepPreviousData } from '@tanstack/vue-query'
import { ref, computed } from 'vue'

interface PaginatedFeed<T> {
  items: T[]
  total: number
  page: number
  totalPages: number
}

interface Post {
  id: string
  content: string
  authorId: string
  createdAt: string
}

const page = ref(1)
const pageSize = ref(20)

const { data, isLoading, isPlaceholderData } = useQuery({
  // La queryKey réactive : page change → nouvelle requête, clé différente
  queryKey: computed(() => ['feed', { page: page.value, pageSize: pageSize.value }]),

  queryFn: (): Promise<PaginatedFeed<Post>> =>
    fetch(`/api/feed?page=${page.value}&limit=${pageSize.value}`).then(r => r.json()),

  // keepPreviousData (importée) : pendant le chargement de la page 2,
  // les données de la page 1 restent visibles (isPlaceholderData = true)
  // Au lieu d'un écran vide entre les pages
  placeholderData: keepPreviousData,
})

const totalPages = computed(() => data.value?.totalPages ?? 0)

function nextPage(): void {
  if (page.value < totalPages.value && !isPlaceholderData.value) {
    page.value++
  }
}

function prevPage(): void {
  if (page.value > 1) {
    page.value--
  }
}
```

**`isPlaceholderData`** est `true` quand Vue Query affiche les données de la page précédente en attendant la nouvelle. Utilise-le pour griser l'UI ou désactiver le bouton « Suivant » pendant le chargement.

### 2.3 Infinite scroll avec `useInfiniteQuery`

`useInfiniteQuery` accumule les pages dans `data.value.pages` (tableau de tableaux). La clé `getNextPageParam` indique à Vue Query comment calculer le curseur suivant. Si elle retourne `undefined`, `hasNextPage` passe à `false`.

```ts
import { useInfiniteQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

interface FeedPage {
  items: Post[]
  nextCursor: string | null  // null = dernière page
}

const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
} = useInfiniteQuery({
  queryKey: ['feed', 'infinite'],

  // pageParam est fourni par Vue Query à partir de getNextPageParam
  // initialPageParam est la valeur initiale (avant le premier fetch)
  queryFn: ({ pageParam }: { pageParam: string | null }): Promise<FeedPage> =>
    fetch(`/api/feed?cursor=${pageParam ?? ''}&limit=20`).then(r => r.json()),

  initialPageParam: null,

  // Calcule le pageParam pour la prochaine page à partir de la DERNIÈRE page chargée
  // Retourner undefined = plus de pages → hasNextPage devient false
  getNextPageParam: (lastPage: FeedPage) => lastPage.nextCursor ?? undefined,
})

// Aplatir toutes les pages en un seul tableau
const allPosts = computed<Post[]>(
  () => data.value?.pages.flatMap(page => page.items) ?? []
)
```

Template minimal avec bouton de chargement :

```vue
<template>
  <ul>
    <li v-for="post in allPosts" :key="post.id">{{ post.content }}</li>
  </ul>

  <button
    v-if="hasNextPage"
    :disabled="isFetchingNextPage"
    @click="fetchNextPage"
  >
    {{ isFetchingNextPage ? 'Chargement…' : 'Charger plus' }}
  </button>

  <p v-if="!hasNextPage && allPosts.length > 0">Fin du feed.</p>
</template>
```

Pour l'auto-scroll (sans bouton), utiliser `IntersectionObserver` sur un élément sentinel en bas de liste qui appelle `fetchNextPage()` quand il entre dans le viewport.

### 2.4 Prefetching

`queryClient.prefetchQuery` charge des données en arrière-plan et les écrit dans le cache. Quand le composant les demande ensuite via `useQuery`, elles sont déjà là — affichage instantané.

```ts
import { useQueryClient } from '@tanstack/vue-query'

const queryClient = useQueryClient()

function prefetchFamilyDetail(familyId: string): void {
  queryClient.prefetchQuery({
    queryKey: ['family', familyId],
    queryFn: () => fetch(`/api/families/${familyId}`).then(r => r.json()),
    // staleTime : si les données existent déjà en cache et sont plus récentes
    // que cette durée, prefetchQuery ne refetch pas — évite le réseau inutile
    staleTime: 5 * 60 * 1000,  // 5 minutes
  })
}
```

```vue
<template>
  <div
    v-for="family in families"
    :key="family.id"
    @mouseenter="prefetchFamilyDetail(family.id)"
    @click="navigateTo(`/families/${family.id}`)"
  >
    {{ family.name }}
  </div>
</template>
```

### 2.5 Requêtes dépendantes (dependent queries)

L'option `enabled` accepte un `ComputedRef<boolean>` ou un `boolean`. Quand `enabled` est `false`, la query ne se lance pas. Elle se lance dès que `enabled` repasse à `true`.

```ts
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

// Requête 1 : profil courant (se lance immédiatement)
const { data: profile } = useQuery({
  queryKey: ['profile'],
  queryFn: () => fetch('/api/me').then(r => r.json()),
})

// Requête 2 : familles de l'utilisateur (attend que profile soit chargé)
const { data: families } = useQuery({
  // La queryKey est reactive : si profile.value?.id change, la query refetch
  queryKey: computed(() => ['families', profile.value?.id]),
  queryFn: () => fetch(`/api/users/${profile.value!.id}/families`).then(r => r.json()),
  // !! = coerce en boolean : undefined/null → false, objet → true
  enabled: computed(() => !!profile.value?.id),
})

// Requête 3 : membres de la première famille (double dépendance)
const firstFamilyId = computed(() => families.value?.[0]?.id)

const { data: members } = useQuery({
  queryKey: computed(() => ['members', firstFamilyId.value]),
  queryFn: () => fetch(`/api/families/${firstFamilyId.value}/members`).then(r => r.json()),
  enabled: computed(() => !!firstFamilyId.value),
})
```

**Important :** `queryFn` s'exécute seulement quand `enabled` est `true`. Le `!` non-null assertion dans `queryFn` est donc sûr — Vue Query ne le lancera jamais avec `profile.value` undefined.

### 2.6 SSR et hydratation avec Nuxt

En SSR, le serveur exécute les queries, sérialise le cache (`dehydrate`) et l'envoie au client dans le HTML. Le client le relit (`hydrate`) pour éviter un double fetch.

**Plugin Nuxt (⚠️ à vérifier via Context7 pour l'API exacte de la v5 + Nuxt 3) :**

```ts
// plugins/vue-query.client.ts + plugins/vue-query.server.ts
// Approche recommandée : un plugin unique avec process.server / process.client

// plugins/vue-query.ts
import {
  VueQueryPlugin,
  QueryClient,
  hydrate,
  dehydrate,
} from '@tanstack/vue-query'

export default defineNuxtPlugin((nuxtApp) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5000,  // Évite les refetch immédiats après hydratation
      },
    },
  })

  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient })

  if (import.meta.server) {
    // Après le rendu serveur, sérialiser l'état du cache
    nuxtApp.hooks.hook('app:rendered', () => {
      nuxtApp.payload.vueQueryState = dehydrate(queryClient)
    })
  }

  if (import.meta.client) {
    // Au démarrage client, restaurer l'état depuis le payload
    nuxtApp.hooks.hook('app:created', () => {
      hydrate(queryClient, nuxtApp.payload.vueQueryState)
    })
  }
})
```

Sur le serveur, les composants qui appellent `useQuery` doivent préfetch les données pour qu'elles soient dans le cache au moment de `dehydrate`. Utiliser `prefetchQuery` dans `setup()` serveur ou dans un `useAsyncData` Nuxt en parallèle.

### 2.7 Gestion d'erreur avancée et retry

Vue Query retente les requêtes en erreur automatiquement. La configuration par défaut est `retry: 3`. En production, on affine :

```ts
import { QueryClient } from '@tanstack/vue-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Fonction retry : contrôle fin par type d'erreur
      // failureCount = nombre d'échecs déjà survenus (0-based)
      // error = l'erreur throwée par queryFn
      retry: (failureCount, error) => {
        // Ne pas retenter sur les erreurs 401 (auth) ou 403 (droits)
        if (error instanceof Response && (error.status === 401 || error.status === 403)) {
          return false
        }
        // Retenter jusqu'à 3 fois pour les autres erreurs (réseau, 5xx)
        return failureCount < 3
      },

      // Délai exponentiel entre les tentatives : 1s, 2s, 4s, max 30s
      retryDelay: (attemptIndex) =>
        Math.min(1000 * 2 ** attemptIndex, 30_000),
    },
    mutations: {
      // Les mutations : 1 seul retry par défaut (les mutations ne sont
      // pas idempotentes — retenter crée souvent des doublons)
      retry: 1,
    },
  },
})
```

**Erreur typée dans `queryFn` :** Vue Query capture n'importe quel throw. La bonne pratique est de créer une classe d'erreur avec le statut HTTP pour que la fonction `retry` puisse filtrer.

```ts
class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiFetch<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new ApiError(r.status, `HTTP ${r.status}`)
  return r.json()
}
```

### 2.8 Intégration Vue Query et vue-i18n

Quand le contenu de l'API varie selon la locale (labels traduits par le serveur, contenus localisés), inclure la locale dans la `queryKey`. Vue Query refetch automatiquement quand la locale change.

```ts
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

const { locale } = useI18n()

const { data: categories } = useQuery({
  // La locale fait partie de la clé : fr → en = nouvelle requête
  queryKey: computed(() => ['categories', locale.value]),
  queryFn: () =>
    fetch(`/api/categories?lang=${locale.value}`).then(r => r.json()),
})
```

**Quand la locale change :** la `queryKey` change (reactive) → Vue Query lance une nouvelle requête → le cache garde les deux locales (fr et en) → retour à fr = affichage instantané depuis le cache.

**Cas où le contenu est le même quelle que soit la locale** (id, slug…) : ne pas inclure la locale dans la queryKey — inutile de dupliquer les entrées de cache.

---

## 3. Worked examples

### Exemple 1 — Invitation optimiste dans TribuZen

Scénario complet : Alice clique « Inviter Bob ». L'invitation apparaît immédiatement dans la liste, badge `pending`. Si le serveur répond 500, la liste revient à l'état précédent et un toast d'erreur s'affiche.

```vue
<!-- InviteForm.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useMutation, useQueryClient, useQuery } from '@tanstack/vue-query'

const props = defineProps<{ familyId: string }>()

const email = ref('')
const errorMsg = ref<string | null>(null)

const queryClient = useQueryClient()

// Lecture courante des invitations (affichée en dessous du formulaire)
const { data: invitations } = useQuery({
  queryKey: ['invitations', props.familyId],
  queryFn: () =>
    fetch(`/api/families/${props.familyId}/invitations`).then(r => r.json()),
})

const { mutate: invite, isPending } = useMutation({
  mutationFn: (inviteeEmail: string) =>
    fetch(`/api/families/${props.familyId}/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteeEmail }),
    }).then(r => {
      if (!r.ok) throw new Error('Erreur serveur — invitation non envoyée')
      return r.json()
    }),

  onMutate: async (inviteeEmail) => {
    // Couper les GET en vol pour ne pas écraser le cache optimiste
    await queryClient.cancelQueries({ queryKey: ['invitations', props.familyId] })

    const previous = queryClient.getQueryData<{ id: string; email: string; status: string }[]>(
      ['invitations', props.familyId]
    )

    // Écriture optimiste : l'invitation apparaît tout de suite
    queryClient.setQueryData(
      ['invitations', props.familyId],
      (old: { id: string; email: string; status: string }[] = []) => [
        ...old,
        { id: `opt-${Date.now()}`, email: inviteeEmail, status: 'pending' },
      ]
    )

    email.value = ''  // Vider le champ immédiatement (feedback UX)
    errorMsg.value = null

    return { previous }
  },

  onError: (err, _email, context) => {
    // Rollback : remettre l'ancien état du cache
    if (context?.previous !== undefined) {
      queryClient.setQueryData(['invitations', props.familyId], context.previous)
    }
    // Afficher le message d'erreur
    errorMsg.value = err instanceof Error ? err.message : 'Erreur inconnue'
  },

  onSettled: () => {
    // Toujours resynchroniser avec le serveur après mutation
    queryClient.invalidateQueries({ queryKey: ['invitations', props.familyId] })
  },
})
</script>

<template>
  <form @submit.prevent="invite(email)">
    <input v-model="email" type="email" placeholder="email@famille.fr" />
    <button type="submit" :disabled="isPending || !email">
      {{ isPending ? 'Envoi…' : 'Inviter' }}
    </button>
    <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
  </form>

  <ul>
    <li
      v-for="inv in invitations"
      :key="inv.id"
      :class="{ 'opacity-50': inv.id.startsWith('opt-') }"
    >
      {{ inv.email }} — {{ inv.status }}
      <span v-if="inv.id.startsWith('opt-')">⏳</span>
    </li>
  </ul>
</template>
```

**Lecture du code :**
1. `onMutate` s'exécute en synchrone (sauf le `await cancelQueries`) — le cache est mis à jour avant même que la requête parte.
2. L'item optimiste a un id préfixé `opt-` pour le distinguer — le template lui ajoute une opacité réduite et une icône ⏳.
3. `onError` rollback + affiche le message. `onSettled` invalide quoi qu'il arrive.

### Exemple 2 — Feed infini TribuZen

```vue
<!-- FamilyFeed.vue -->
<script setup lang="ts">
import { computed, useTemplateRef, watchEffect } from 'vue'
import { useInfiniteQuery } from '@tanstack/vue-query'

const props = defineProps<{ familyId: string }>()

interface Post {
  id: string
  content: string
  authorName: string
}

interface FeedPage {
  items: Post[]
  nextCursor: string | null
}

const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  isError,
} = useInfiniteQuery({
  queryKey: computed(() => ['feed', props.familyId]),
  queryFn: ({ pageParam }: { pageParam: string | null }): Promise<FeedPage> =>
    fetch(`/api/families/${props.familyId}/posts?cursor=${pageParam ?? ''}&limit=20`)
      .then(r => {
        if (!r.ok) throw new Error('Impossible de charger le feed')
        return r.json()
      }),
  initialPageParam: null,
  getNextPageParam: (last: FeedPage) => last.nextCursor ?? undefined,
})

const allPosts = computed<Post[]>(
  () => data.value?.pages.flatMap(p => p.items) ?? []
)

// IntersectionObserver sur un sentinel en bas de liste
const sentinel = useTemplateRef<HTMLDivElement>('sentinel')

watchEffect((onCleanup) => {
  if (!sentinel.value) return

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && hasNextPage.value && !isFetchingNextPage.value) {
        fetchNextPage()
      }
    },
    { threshold: 0.1 }
  )

  observer.observe(sentinel.value)
  onCleanup(() => observer.disconnect())
})
</script>

<template>
  <div v-if="isLoading" class="skeleton">Chargement…</div>

  <div v-else-if="isError" class="error">Impossible de charger le feed.</div>

  <ul v-else>
    <li v-for="post in allPosts" :key="post.id">
      <strong>{{ post.authorName }}</strong> — {{ post.content }}
    </li>
  </ul>

  <!-- Sentinel : déclenche fetchNextPage via l'observer quand visible -->
  <div ref="sentinel" class="sentinel">
    <span v-if="isFetchingNextPage">Chargement…</span>
    <span v-else-if="!hasNextPage && allPosts.length > 0">Fin du feed.</span>
  </div>
</template>
```

**Points clés :**
- `getNextPageParam` retourne `null → undefined` (coercé par `??`) pour signaler la fin — Vue Query fait la différence entre `undefined` (pas de page suivante) et `null` (curseur de page 1).
- `watchEffect` + `onCleanup` : l'observer est disconnecté si `sentinel` disparaît (démontage du composant).
- `initialPageParam: null` correspond au type `string | null` du curseur.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Optimistic update sans `cancelQueries` → flash

```ts
// ❌ Pas de cancelQueries avant setQueryData
onMutate: async (inv) => {
  const previous = queryClient.getQueryData(['invitations'])
  queryClient.setQueryData(['invitations'], old => [...(old ?? []), newItem])
  return { previous }
}
// Si un GET est en vol et se termine APRÈS setQueryData → il écrase
// le cache optimiste → l'UI flashe (l'item disparaît puis réapparaît)

// ✅ Toujours annuler les queries en vol AVANT d'écrire le cache
onMutate: async (inv) => {
  await queryClient.cancelQueries({ queryKey: ['invitations'] })  // ← clé
  const previous = queryClient.getQueryData(['invitations'])
  queryClient.setQueryData(['invitations'], old => [...(old ?? []), newItem])
  return { previous }
}
```

### PIÈGE #2 — `keepPreviousData: true` (syntaxe v4 morte en v5)

```ts
// ❌ Vue Query v5 : option supprimée — compilateur/runtime silencieux, mais ignorée
const { data } = useQuery({
  queryKey: ['feed', page],
  queryFn: fetchFeed,
  keepPreviousData: true,  // ← IGNORÉE en v5 — écran vide entre les pages
})

// ✅ Vue Query v5 : importer la fonction keepPreviousData et la passer
import { keepPreviousData } from '@tanstack/vue-query'

const { data } = useQuery({
  queryKey: ['feed', page],
  queryFn: fetchFeed,
  placeholderData: keepPreviousData,  // ← correct v5
})
```

### PIÈGE #3 — `useInfiniteQuery` sans `getNextPageParam` → infinite loop ou stuck

```ts
// ❌ Sans getNextPageParam : hasNextPage vaut toujours true → boucle infinie
const { data } = useInfiniteQuery({
  queryKey: ['feed'],
  queryFn: ({ pageParam }) => fetchPage(pageParam),
  initialPageParam: 0,
  // ← getNextPageParam absent : Vue Query ne sait jamais quand s'arrêter
})

// ✅ Toujours définir getNextPageParam, retourner undefined pour la fin
getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
//                                              ↑
//                               null → undefined = signal "plus de pages"
```

### PIÈGE #4 — Dependent query avec `enabled: !!user.value` (non reactive)

```ts
// ❌ !!user.value est évalué une seule fois au setup → enabled reste false
const { data: orders } = useQuery({
  queryKey: ['orders'],
  queryFn: fetchOrders,
  enabled: !!user.value,  // ← évalué au montage, user.value est undefined → false
                           // même quand user charge, enabled ne se met pas à jour
})

// ✅ Wraper dans computed() pour que enabled soit réactif
enabled: computed(() => !!user.value),
```

### PIÈGE #5 — Pagination qui saute (queryKey non-réactive)

```ts
// ❌ queryKey statique : changer page.value ne déclenche aucun refetch
const { data } = useQuery({
  queryKey: ['feed', page.value],  // ← évalué une fois au setup
  queryFn: () => fetchFeed(page.value),
  placeholderData: keepPreviousData,
})

// ✅ queryKey en computed() pour rester réactive
queryKey: computed(() => ['feed', page.value]),
```

---

## 5. Ancrage TribuZen

Les trois cas concrets du début de module correspondent à des fonctionnalités réelles de TribuZen :

**Feed en infinite scroll** (`FamilyFeed.vue`) — les posts de la famille chargent par tranches de 20 via `useInfiniteQuery`. Le sentinel `IntersectionObserver` déclenche `fetchNextPage` automatiquement. Quand l'utilisateur revient sur l'onglet, Vue Query refetch la première page si le cache est périmé (stale).

**Invitation en optimistic update** (`InviteForm.vue`) — l'invitation apparaît dans la liste avant la réponse serveur. En cas d'échec réseau ou d'email déjà invité (409), le rollback remet la liste à l'état précédent et un toast d'erreur s'affiche. UX perçue : instantané.

**Prefetch du détail famille** (`FamilyCard.vue`) — au survol d'une carte famille, `prefetchQuery` charge `['family', familyId]` en arrière-plan. Quand l'utilisateur clique et arrive sur `FamilyDetailPage.vue`, `useQuery` trouve les données en cache → zéro spinner.

**Requêtes dépendantes** (`FamilyDetailPage.vue`) — la page charge d'abord le profil (`['profile']`), puis les familles de l'utilisateur (`['families', userId]`), puis les membres de la famille sélectionnée (`['members', familyId]`). Chaque étape est bloquée par `enabled` jusqu'à ce que l'étape précédente soit résolue.

**SSR Nuxt** (Bedrock) — le plugin `vue-query.ts` dehydrate le cache sur le serveur et l'hydrate sur le client. Les pages qui utilisent `useQuery` en SSR n'envoient pas de requête réseau au chargement client — l'état est déjà là dans `nuxtApp.payload`.

```
tribuzen/
  src/
    components/
      family/
        FamilyFeed.vue          ← useInfiniteQuery, IntersectionObserver
        FamilyCard.vue          ← prefetchQuery au mouseenter
        InviteForm.vue          ← useMutation optimiste + rollback
      profile/
        FamilyDetailPage.vue    ← dependent queries (profile → families → members)
  plugins/
    vue-query.ts                ← dehydrate/hydrate SSR (Nuxt)
```

---

## 6. Points clés

1. L'optimistic update suit le cycle `onMutate` (cancel + sauvegarde + write) → `onError` (rollback) → `onSettled` (invalidate).
2. `await queryClient.cancelQueries()` AVANT `setQueryData` est obligatoire — sans ça, un GET en vol écrase le cache optimiste.
3. En Vue Query v5, `keepPreviousData: true` est supprimée — utiliser `placeholderData: keepPreviousData` (fonction importée).
4. `useInfiniteQuery` requiert `initialPageParam` et `getNextPageParam` ; retourner `undefined` dans `getNextPageParam` déclenche `hasNextPage = false`.
5. `enabled` doit être un `computed()` pour rester réactif — `enabled: !!ref.value` est évalué une seule fois et reste figé.
6. La `queryKey` réactive (`computed(() => [..., page.value])`) est la condition pour que la pagination ou la locale change déclenche un refetch.
7. `prefetchQuery` avec `staleTime` n'envoie pas de requête si les données en cache sont encore fraîches — l'option évite les prefetch redondants.
8. En SSR Nuxt, `dehydrate(queryClient)` sérialise le cache côté serveur, `hydrate(queryClient, payload)` le restaure côté client — zéro double fetch.

---

## 7. Seeds Anki

```
Quel est l'ordre des callbacks d'une mutation optimiste dans Vue Query ?|onMutate (cancelQueries + save + write optimiste) → onError (rollback) → onSettled (invalidate). onSettled s'exécute toujours, succès ou erreur.
Pourquoi cancelQueries est-il nécessaire avant setQueryData dans onMutate ?|Un GET en vol qui se termine après setQueryData écrase le cache optimiste. cancelQueries coupe les requêtes en vol pour que l'état optimiste tienne jusqu'à onSettled.
Comment exprimer keepPreviousData en Vue Query v5 ?|L'option standalone keepPreviousData a été supprimée. En v5 : import { keepPreviousData } from '@tanstack/vue-query' puis placeholderData: keepPreviousData dans useQuery.
Quelle valeur retourne getNextPageParam pour signaler qu'il n'y a plus de page ?|undefined. Retourner undefined fait passer hasNextPage à false et arrête fetchNextPage. null ou 0 sont considérés comme des pageParams valides.
Pourquoi enabled doit-il être un computed() et non !!ref.value ?|!!ref.value est évalué une fois au setup et reste figé. computed(() => !!ref.value) crée une valeur réactive qui se met à jour quand ref change — Vue Query relit enabled à chaque mise à jour.
Comment inclure la locale vue-i18n dans une queryKey pour refetch automatique ?|queryKey: computed(() => ['resource', locale.value]). Quand locale.value change, la queryKey change → Vue Query lance une nouvelle requête. Les deux locales sont cachées séparément.
Que font dehydrate et hydrate dans l'intégration SSR Vue Query + Nuxt ?|dehydrate(queryClient) sérialise l'état du cache en objet JSON après le rendu serveur. hydrate(queryClient, state) le restaure dans le QueryClient client. Résultat : les composants trouvent les données en cache au premier rendu client — pas de double fetch.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-47-vue-query-patterns-avances/README.md`. Implémente l'optimistic update complet et l'infinite scroll sur un projet Vite+Vue 3 minimal — vrai `@tanstack/vue-query` v5, corrigé commenté intégral, variante J+30.

---

> **Note :** ce module est le **dernier module du parcours 02-vue**. Le `next` pointe vers `fin-parcours-02-vue` — tu as couvert l'intégralité du curriculum Vue 3 / Nuxt.

← [Module 46 — Vue Query TanStack](46-vue-query-tanstack.md)
