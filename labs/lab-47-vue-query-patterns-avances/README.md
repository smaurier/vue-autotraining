# Lab 47 — Vue Query : patterns avancés

> **Outcome :** à la fin, tu sais implémenter une mutation optimiste avec rollback et un feed en infinite scroll avec `@tanstack/vue-query` v5 dans un projet Vue 3 réel.
> **Vrai outil :** `@tanstack/vue-query` v5 + Vite + Vue 3.5 (pas de mock, pas de harnais simulé).
> **Feedback :** le coach valide en session — vérification manuelle dans le navigateur + DevTools Vue Query.

---

## Énoncé

Tu implémente deux fonctionnalités du front-office TribuZen dans un projet Vite+Vue 3 minimal :

**Partie A — Invitation optimiste**

Un composant `InviteForm.vue` permet d'inviter un membre par email. Cahier des charges :
1. L'invitation apparaît **immédiatement** dans la liste (statut `pending`, icône ⏳) sans attendre le serveur.
2. Si le serveur répond avec une erreur, la liste **revient** à l'état précédent et un message d'erreur s'affiche.
3. Dans tous les cas (succès ou erreur), la liste est resynchronisée depuis le serveur.

**Partie B — Feed infini**

Un composant `FamilyFeed.vue` charge les posts de la famille page par page. Cahier des charges :
1. Premier chargement : 10 posts.
2. Un bouton « Charger plus » charge les 10 suivants et les **ajoute** à la liste (pas de remplacement).
3. Quand il n'y a plus de posts, le bouton disparaît et un texte « Fin du feed. » s'affiche.
4. `isLoading` et `isFetchingNextPage` affichent des états de chargement distincts.

**Serveur de test : `json-server`** (ou une API locale mockée — voir Starter).

---

## Starter minimal

### Installation

```bash
pnpm create vite@latest lab-47 --template vue-ts
cd lab-47
pnpm install
pnpm add @tanstack/vue-query @tanstack/vue-query-devtools
```

### Configuration `main.ts`

```ts
// src/main.ts
import { createApp } from 'vue'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import App from './App.vue'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

createApp(App)
  .use(VueQueryPlugin, { queryClient })
  .mount('#app')
```

### Mock API (à coller dans `src/api/mock.ts`)

Ce module intercepts les appels `fetch` pour simuler un serveur local sans backend. Il introduit un délai de 400 ms et échoue aléatoirement (30 % du temps) pour tester le rollback.

```ts
// src/api/mock.ts
// Intercept fetch pour simuler l'API

interface Invitation {
  id: string
  email: string
  status: 'pending' | 'accepted'
}

interface Post {
  id: string
  content: string
  authorName: string
}

// État en mémoire
let invitations: Invitation[] = [
  { id: 'inv-1', email: 'alice@tribuzen.app', status: 'accepted' },
]

const POSTS: Post[] = Array.from({ length: 35 }, (_, i) => ({
  id: `post-${i + 1}`,
  content: `Post numéro ${i + 1} de la famille`,
  authorName: ['Alice', 'Bob', 'Cara'][i % 3],
}))

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

const originalFetch = window.fetch.bind(window)

window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = input.toString()
  await delay(400)

  // GET /api/invitations
  if (url === '/api/invitations' && (!init?.method || init.method === 'GET')) {
    return new Response(JSON.stringify(invitations), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // POST /api/invitations — échoue 30 % du temps pour tester le rollback
  if (url === '/api/invitations' && init?.method === 'POST') {
    const body = JSON.parse(init.body as string) as { email: string }
    if (Math.random() < 0.3) {
      return new Response(JSON.stringify({ error: 'Email déjà invité ou serveur en erreur' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const newInv: Invitation = { id: `inv-${Date.now()}`, email: body.email, status: 'pending' }
    invitations = [...invitations, newInv]
    return new Response(JSON.stringify(newInv), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // GET /api/posts?cursor=N&limit=10
  if (url.startsWith('/api/posts')) {
    const params = new URL(url, 'http://localhost').searchParams
    const cursor = parseInt(params.get('cursor') ?? '0', 10)
    const limit = parseInt(params.get('limit') ?? '10', 10)
    const items = POSTS.slice(cursor, cursor + limit)
    const nextCursor = cursor + limit < POSTS.length ? cursor + limit : null
    return new Response(JSON.stringify({ items, nextCursor }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return originalFetch(input, init)
}
```

### `App.vue` starter

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
// Importer le mock API (simulation serveur en local)
import './api/mock'

// TODO : importer et afficher InviteForm et FamilyFeed
</script>

<template>
  <main style="max-width: 640px; margin: 2rem auto; font-family: sans-serif">
    <h1>Lab 47 — Vue Query patterns avancés</h1>
    <!-- TODO : <InviteForm /> et <FamilyFeed /> ici -->
  </main>
  <VueQueryDevtools />
</template>
```

---

## Étapes (en friction)

### Partie A — Invitation optimiste

1. **Crée `src/components/InviteForm.vue`** avec un `<input type="email">` et un bouton « Inviter ».
2. **Lis les invitations** via `useQuery({ queryKey: ['invitations'], queryFn: ... })` et affiche-les dans une `<ul>`.
3. **Écris `useMutation`** avec `mutationFn` qui POSTe `/api/invitations`.
4. **Implémente `onMutate`** : `cancelQueries` + `getQueryData` (sauvegarde) + `setQueryData` (écriture optimiste avec id `opt-${Date.now()}`).
5. **Implémente `onError`** : rollback via `context.previous` + affiche un message d'erreur.
6. **Implémente `onSettled`** : `invalidateQueries({ queryKey: ['invitations'] })`.
7. **Distingue visuellement** les items optimistes (opacité 0.5 + ⏳) en testant `inv.id.startsWith('opt-')`.
8. **Teste le rollback** : le mock échoue 30 % du temps — vérifie que l'item optimiste disparaît bien en cas d'erreur.

### Partie B — Feed infini

1. **Crée `src/components/FamilyFeed.vue`**.
2. **Implémente `useInfiniteQuery`** avec :
   - `queryKey: ['posts']`
   - `queryFn: ({ pageParam }) => fetch('/api/posts?cursor=' + pageParam + '&limit=10').then(r => r.json())`
   - `initialPageParam: 0`
   - `getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined`
3. **Calcule `allPosts`** : `computed(() => data.value?.pages.flatMap(p => p.items) ?? [])`.
4. **Affiche la liste** en `v-for` sur `allPosts`.
5. **Ajoute le bouton « Charger plus »** avec `v-if="hasNextPage"` et `@click="fetchNextPage"`.
6. **Désactive le bouton** et affiche « Chargement… » quand `isFetchingNextPage` est vrai.
7. **Affiche « Fin du feed. »** quand `!hasNextPage && allPosts.length > 0`.
8. **Vérifie dans les DevTools** : le panneau Vue Query doit montrer `['posts']` avec les pages accumulées.

---

## Corrigé complet commenté

### `InviteForm.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useMutation, useQueryClient, useQuery } from '@tanstack/vue-query'

// Types locaux
interface Invitation {
  id: string
  email: string
  status: 'pending' | 'accepted'
}

const email = ref('')
const errorMsg = ref<string | null>(null)

const queryClient = useQueryClient()

// Lecture courante — affichée sous le formulaire
const { data: invitations } = useQuery<Invitation[]>({
  queryKey: ['invitations'],
  queryFn: () => fetch('/api/invitations').then(r => r.json()),
})

const { mutate: invite, isPending } = useMutation({
  mutationFn: (inviteeEmail: string) =>
    fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteeEmail }),
    }).then(r => {
      // Lancer une erreur sur les statuts non-2xx pour déclencher onError
      if (!r.ok) throw new Error('Invitation échouée (serveur en erreur)')
      return r.json() as Promise<Invitation>
    }),

  onMutate: async (inviteeEmail: string) => {
    // 1. Annuler les GET en vol — évite l'écrasement du cache optimiste
    await queryClient.cancelQueries({ queryKey: ['invitations'] })

    // 2. Sauvegarder l'état actuel pour pouvoir rollback
    const previous = queryClient.getQueryData<Invitation[]>(['invitations'])

    // 3. Écrire l'état optimiste immédiatement
    // L'id 'opt-...' permet de distinguer les items optimistes dans le template
    queryClient.setQueryData<Invitation[]>(
      ['invitations'],
      (old = []) => [
        ...old,
        { id: `opt-${Date.now()}`, email: inviteeEmail, status: 'pending' },
      ]
    )

    // Feedback UX immédiat
    email.value = ''
    errorMsg.value = null

    // 4. Retourner le contexte pour onError
    return { previous }
  },

  onError: (err: Error, _email: string, context) => {
    // Rollback : restaurer l'état sauvegardé dans onMutate
    if (context?.previous !== undefined) {
      queryClient.setQueryData(['invitations'], context.previous)
    }
    // Afficher le message d'erreur à l'utilisateur
    errorMsg.value = err.message
  },

  onSettled: () => {
    // Resynchroniser avec le serveur — dans tous les cas
    // Succès : confirmer que l'item optimiste correspond à l'item réel
    // Erreur : confirmer que le rollback est correct
    queryClient.invalidateQueries({ queryKey: ['invitations'] })
  },
})
</script>

<template>
  <section>
    <h2>Inviter un membre</h2>

    <form @submit.prevent="invite(email)">
      <input
        v-model="email"
        type="email"
        placeholder="email@famille.fr"
        :disabled="isPending"
      />
      <button type="submit" :disabled="isPending || !email.trim()">
        {{ isPending ? 'Envoi…' : 'Inviter' }}
      </button>
    </form>

    <!-- Message d'erreur (rollback déclenché) -->
    <p v-if="errorMsg" style="color: #ef4444">{{ errorMsg }}</p>

    <ul>
      <li
        v-for="inv in invitations"
        :key="inv.id"
        :style="{ opacity: inv.id.startsWith('opt-') ? 0.5 : 1 }"
      >
        {{ inv.email }} — {{ inv.status }}
        <!-- Indicateur visuel pour l'item optimiste en attente -->
        <span v-if="inv.id.startsWith('opt-')">⏳</span>
      </li>
    </ul>
  </section>
</template>
```

### `FamilyFeed.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useInfiniteQuery } from '@tanstack/vue-query'

interface Post {
  id: string
  content: string
  authorName: string
}

interface FeedPage {
  items: Post[]
  nextCursor: number | null  // null = dernière page
}

const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  isError,
} = useInfiniteQuery({
  queryKey: ['posts'],

  // pageParam est fourni par Vue Query : initialPageParam au premier appel,
  // puis la valeur retournée par getNextPageParam pour les suivants
  queryFn: ({ pageParam }: { pageParam: number }): Promise<FeedPage> =>
    fetch(`/api/posts?cursor=${pageParam}&limit=10`)
      .then(r => {
        if (!r.ok) throw new Error('Erreur lors du chargement du feed')
        return r.json()
      }),

  // Valeur du pageParam pour le tout premier appel
  initialPageParam: 0,

  // Calcule le pageParam de la prochaine page à partir de la dernière chargée
  // undefined = plus de pages → hasNextPage devient false
  getNextPageParam: (lastPage: FeedPage) => lastPage.nextCursor ?? undefined,
})

// Aplatir le tableau de pages en un seul tableau de posts
// data.value.pages = [FeedPage, FeedPage, ...] → allPosts = Post[]
const allPosts = computed<Post[]>(
  () => data.value?.pages.flatMap(page => page.items) ?? []
)
</script>

<template>
  <section>
    <h2>Feed de la famille</h2>

    <!-- État de chargement initial (première page) -->
    <div v-if="isLoading" style="color: #94a3b8">Chargement du feed…</div>

    <!-- Erreur lors du chargement -->
    <div v-else-if="isError" style="color: #ef4444">
      Impossible de charger le feed.
    </div>

    <template v-else>
      <!-- Liste de tous les posts chargés (toutes pages confondues) -->
      <ul>
        <li v-for="post in allPosts" :key="post.id">
          <strong>{{ post.authorName }}</strong> — {{ post.content }}
        </li>
      </ul>

      <!-- Bouton pour charger la page suivante -->
      <!-- v-if="hasNextPage" : disparaît quand getNextPageParam retourne undefined -->
      <button
        v-if="hasNextPage"
        :disabled="isFetchingNextPage"
        @click="fetchNextPage"
      >
        <!-- isFetchingNextPage : true pendant le chargement de la page suivante -->
        {{ isFetchingNextPage ? 'Chargement…' : 'Charger plus' }}
      </button>

      <!-- Message de fin : visible quand toutes les pages sont chargées -->
      <p
        v-if="!hasNextPage && allPosts.length > 0"
        style="color: #94a3b8; font-style: italic"
      >
        Fin du feed ({{ allPosts.length }} posts au total).
      </p>
    </template>
  </section>
</template>
```

### `App.vue` final

```vue
<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import './api/mock'
import InviteForm from './components/InviteForm.vue'
import FamilyFeed from './components/FamilyFeed.vue'
</script>

<template>
  <main style="max-width: 640px; margin: 2rem auto; font-family: sans-serif">
    <h1>Lab 47 — Vue Query patterns avancés</h1>
    <hr />
    <InviteForm />
    <hr />
    <FamilyFeed />
  </main>
  <VueQueryDevtools />
</template>
```

**Pourquoi ce corrigé est correct :**
- `onMutate` fait toujours `cancelQueries` avant `setQueryData` — le cache optimiste ne peut pas être écrasé par un GET en vol.
- `onError` utilise `context.previous` (retourné par `onMutate`) — le rollback est garanti même si `previous` est un tableau vide.
- `onSettled` invalide les queries dans tous les cas — le cache est toujours resynchronisé.
- `getNextPageParam` retourne `null → undefined` via `??` — le `null` du mock est correctement converti en signal de fin pour Vue Query.
- `allPosts` est un `computed` sur `data.value?.pages` — Vue Query met à jour `data` à chaque page chargée, le computed se recalcule automatiquement.

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées :**

Reproduis les deux composants **de mémoire, en 35 minutes**, avec les modifications suivantes :

1. **InviteForm** : ajoute une validation email côté client (regex basique) avant d'appeler `mutate`. Si l'email est invalide, affiche une erreur sans appeler la mutation.
2. **FamilyFeed** : remplace le bouton « Charger plus » par un **IntersectionObserver** sur un élément sentinel en bas de liste. `fetchNextPage` est appelé automatiquement quand le sentinel entre dans le viewport.
3. **Sans ouvrir ce corrigé** ni le module 47.

**Critère de réussite :** le rollback fonctionne visuellement (item optimiste disparaît en cas d'erreur), et le scroll infini charge automatiquement sans bouton.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen` :

```
tribuzen/
  src/
    components/
      family/
        InviteForm.vue     ← mutation optimiste (ce lab)
        FamilyFeed.vue     ← infinite scroll (ce lab)
```

**Différences par rapport au lab :**
- Les types `Invitation` et `Post` seront importés depuis `src/types/` (partagés entre composants).
- `familyId` sera une prop reçue du parent plutôt qu'une constante hardcodée dans la queryKey.
- Le mock `fetch` sera remplacé par l'API NestJS réelle — la logique Vue Query est identique.
- Les DevTools seront désactivés en production via `v-if="isDev"` ou la condition automatique du composant.

**Commit cible :**
```
feat(family): InviteForm optimistic update + FamilyFeed infinite scroll
```
