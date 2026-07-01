---
titre: GraphQL avec Vue
cours: 02-vue
notions: [principes GraphQL query mutation, client Apollo ou urql pour Vue, useQuery et useMutation, variables et cache, typage généré codegen, gestion loading error, subscriptions en survol, comparaison avec REST]
outcomes:
  - sait interroger une API GraphQL depuis Vue (useQuery/useMutation)
  - sait typer les opérations avec la génération de types (codegen)
  - sait gérer cache, variables, loading et erreurs
  - sait choisir GraphQL vs REST selon le contexte
prerequis: [35-cicd-monitoring]
next: 37-trpc
libs: [{ name: vue, version: "3.5" }, { name: "@urql/vue", version: "1" }]
tribuzen: front-office TribuZen — requêter les données famille via GraphQL typé (query familles, mutation invitation)
last-reviewed: 2026-07
---

← [35 — CI/CD Monitoring](35-cicd-monitoring.md) | [37 — tRPC](37-trpc.md) →

# GraphQL avec Vue

> **Outcomes — tu sauras FAIRE :** interroger une API GraphQL depuis un composant Vue avec `useQuery`/`useMutation` (@urql/vue), typer les opérations avec codegen, gérer cache, variables, loading et erreurs, choisir entre GraphQL et REST selon le contexte.
> **Difficulté :** :star::star::star:

## 1. Cas concret d'abord

Tu travailles sur TribuZen. La page d'accueil doit afficher la liste des familles de l'utilisateur connecté, avec le nombre de membres de chaque famille. Tu as accès à l'API GraphQL du backend.

Un collègue a écrit ceci en REST :

```ts
// ❌ REST — 1 requête pour les familles, N requêtes pour les membres
const families = await fetch('/api/families').then(r => r.json())
// Pour chaque famille, une nouvelle requête :
const withMembers = await Promise.all(
  families.map(f => fetch(`/api/families/${f.id}/members`).then(r => r.json()))
)
// → N+1 requêtes réseau, over-fetching sur chaque famille
```

Avec GraphQL, une seule requête, précisément les champs nécessaires :

```graphql
query GetFamilies {
  families {
    id
    name
    memberCount
    members {
      id
      displayName
    }
  }
}
```

Réponse : exactement `{ families: [{ id, name, memberCount, members: [...] }] }` — pas de champs superflus, pas de N+1. Ce module te donne les outils pour écrire ça dans Vue.

---

## 2. Théorie complète, concise

### 2.1 Principes GraphQL — query et mutation

GraphQL est un **langage de requête pour API** (pas un protocole réseau). Le serveur expose un **schéma** (types + opérations disponibles) ; le client décrit exactement ce qu'il veut.

**Deux opérations fondamentales :**

`query` — lire des données (idempotent, comme GET) :

```graphql
# Variables déclarées en tête ($familyId = paramètre dynamique)
query GetFamily($familyId: ID!) {
  family(id: $familyId) {
    id
    name
    memberCount
    members {
      id
      displayName
      role
    }
  }
}
```

`mutation` — écrire / modifier des données (POST, PUT, DELETE) :

```graphql
mutation InviteMember($input: InviteMemberInput!) {
  inviteMember(input: $input) {
    id
    email
    status
  }
}
```

**Différences clés vs REST :**
- Une seule URL (`/graphql`), toutes les opérations passent par POST
- Le client choisit les champs — pas d'over-fetching, pas d'under-fetching
- Le schéma est introspectable : l'IDE peut autocompléter les requêtes
- N+1 REST → 1 requête GraphQL pour les données imbriquées

**Subscription** (temps réel — survol) : une troisième opération via WebSocket. Le client s'abonne à des événements serveur. Vu en section 2.7.

### 2.2 Choisir entre urql et Apollo pour Vue

Deux clients GraphQL matures pour Vue 3 :

| | **@urql/vue** | **@vue/apollo-composable** |
|---|---|---|
| Taille bundle | Léger (~26 kB) | Plus lourd (~80 kB) |
| API composable | `useQuery`, `useMutation` (retour objet) | `useQuery`, `useMutation` (retour objet) |
| Cache par défaut | `cacheExchange` (document) | `InMemoryCache` (normalisé) |
| Config | `app.use(urql, options)` | `app.provide(DefaultApolloClient, client)` |
| Flexibilité | Échanges composables | Middleware links |
| Usage typique | Apps neuves, bundle size critique | Apps existantes côté Apollo |

Ce module utilise **@urql/vue** (plus léger, API plus simple, recommandé pour les projets Vue 3 neufs). Les concepts (`useQuery`, `useMutation`, variables, cache) sont identiques entre les deux clients.

### 2.3 Setup du client urql dans Vue

Installation :

```bash
pnpm add @urql/vue graphql
```

Configuration dans `main.ts` :

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import urql, { cacheExchange, fetchExchange } from '@urql/vue'

const app = createApp(App)

// Enregistre urql comme plugin Vue — donne accès à useQuery/useMutation
// dans tous les composants sans import du client
app.use(urql, {
  url: import.meta.env.VITE_GRAPHQL_URL ?? '/graphql',
  // exchanges = pipeline de traitement des requêtes (ordre important)
  exchanges: [
    cacheExchange,  // Vérifie le cache avant d'aller réseau
    fetchExchange,  // Envoie la requête HTTP si pas en cache
  ],
})

app.mount('#app')
```

Variante sans plugin (pour fournir le client dans un composant parent) :

```ts
// Dans un composant parent ou App.vue
import { createClient, provideClient, cacheExchange, fetchExchange } from '@urql/vue'

const client = createClient({
  url: '/graphql',
  exchanges: [cacheExchange, fetchExchange],
})

// Fournit le client à tous les enfants (alternative à app.use)
provideClient(client)
```

### 2.4 useQuery — lire des données

```vue
<script setup lang="ts">
import { useQuery, gql } from '@urql/vue'
import { computed } from 'vue'

// Définir la requête avec gql (template tag — parse le GraphQL)
const GET_FAMILIES = gql`
  query GetFamilies {
    families {
      id
      name
      memberCount
    }
  }
`

// useQuery retourne un objet réactif
const { data, fetching, error } = useQuery({ query: GET_FAMILIES })

// data.value est null tant que la requête n'est pas terminée
// Extraire les données avec une valeur par défaut
const families = computed(() => data.value?.families ?? [])
</script>
```

Propriétés retournées par `useQuery` :

| Propriété | Type | Description |
|---|---|---|
| `data` | `Ref<T \| undefined>` | Données de la réponse |
| `fetching` | `Ref<boolean>` | `true` pendant la requête |
| `error` | `Ref<CombinedError \| undefined>` | Erreur réseau ou GraphQL |
| `isPaused` | `Ref<boolean>` | `true` si la query est en pause |
| `executeQuery(opts?)` | Méthode | Relancer manuellement la query |
| `pause()` / `resume()` | Méthodes | Suspendre / reprendre la query |

### 2.5 Variables et requêtes dynamiques

Les variables `useQuery` acceptent des `ref` réactifs — la query se relance automatiquement quand une variable change.

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery, gql } from '@urql/vue'

const GET_FAMILY = gql`
  query GetFamily($id: ID!) {
    family(id: $id) {
      id
      name
      members {
        id
        displayName
      }
    }
  }
`

// ref réactif — changer selectedId relance automatiquement la query
const selectedId = ref<string>('fam-1')

const { data, fetching, error } = useQuery({
  query: GET_FAMILY,
  variables: { id: selectedId }, // ref passé directement — urql observe la réactivité
})

const family = computed(() => data.value?.family ?? null)
</script>
```

**RequestPolicy** — stratégie de cache :

```ts
useQuery({
  query: GET_FAMILIES,
  // 'cache-first'       (défaut) : cache d'abord, réseau si absent
  // 'cache-and-network' : cache immédiat + rafraîchissement réseau
  // 'network-only'      : toujours réseau, met à jour le cache
  // 'cache-only'        : cache uniquement, erreur si absent
  requestPolicy: 'cache-and-network',
})
```

### 2.6 useMutation — écrire des données

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useMutation, gql } from '@urql/vue'

const INVITE_MEMBER = gql`
  mutation InviteMember($input: InviteMemberInput!) {
    inviteMember(input: $input) {
      id
      email
      status
    }
  }
`

// useMutation reçoit le document GraphQL
// executeMutation est la fonction à appeler, fetching est l'état en cours
const { executeMutation, fetching: inviting, error } = useMutation(INVITE_MEMBER)

const email = ref('')

async function handleInvite(): Promise<void> {
  const result = await executeMutation({
    input: { email: email.value, familyId: 'fam-1' },
  })

  // result.error = erreur réseau ou GraphQL
  // result.data  = données retournées par la mutation
  if (result.error) {
    console.error('Invitation échouée', result.error.message)
    return
  }

  // Succès
  email.value = ''
}
</script>
```

Différence clé : `useQuery` s'exécute **automatiquement** au montage du composant ; `useMutation` doit être déclenché **manuellement** via `executeMutation()`.

### 2.7 Typage généré — codegen

Le problème sans codegen : les types TypeScript (`data.value?.families`) sont `any` — aucune vérification. La solution : **GraphQL Code Generator** lit le schéma serveur et génère les types automatiquement.

Installation :

```bash
pnpm add -D @graphql-codegen/cli @graphql-codegen/client-preset
```

Configuration `codegen.ts` à la racine :

```ts
// codegen.ts
import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  // Schéma du serveur GraphQL (URL ou fichier .graphql)
  schema: 'http://localhost:4000/graphql',
  // Fichiers .graphql dans le projet (opérations)
  documents: ['src/**/*.graphql', 'src/**/*.vue'],
  generates: {
    // Dossier de sortie des types générés
    './src/gql/': {
      preset: 'client',
      // client-preset génère des types pour useQuery/useMutation urql
      presetConfig: {
        gqlTagName: 'gql',
      },
    },
  },
}

export default config
```

Script dans `package.json` :

```json
{
  "scripts": {
    "codegen": "graphql-codegen --config codegen.ts",
    "codegen:watch": "graphql-codegen --config codegen.ts --watch"
  }
}
```

Usage après génération :

```vue
<script setup lang="ts">
// Import depuis le dossier généré — types inclus
import { graphql } from '@/gql'
import { useQuery } from '@urql/vue'

// graphql() retourne un DocumentNode typé
// TypeScript connaît la forme exacte de data.value
const GET_FAMILIES = graphql(`
  query GetFamilies {
    families {
      id
      name
      memberCount
    }
  }
`)

const { data, fetching, error } = useQuery({ query: GET_FAMILIES })
// data.value est maintenant typé GetFamiliesQuery | undefined
// data.value?.families → Family[] | undefined — vérification complète
</script>
```

### 2.8 Gestion loading et erreurs

Pattern standard dans le template :

```vue
<template>
  <!-- 3 états exclusifs : loading / erreur / données -->
  <div v-if="fetching" class="loading">Chargement des familles…</div>

  <div v-else-if="error" class="error" role="alert">
    <!-- CombinedError urql regroupe networkError et graphQLErrors -->
    {{ error.message }}
  </div>

  <ul v-else>
    <li v-for="family in families" :key="family.id">
      {{ family.name }} — {{ family.memberCount }} membres
    </li>
  </ul>
</template>
```

`CombinedError` urql expose :
- `error.message` — message principal
- `error.networkError` — erreur réseau (fetch failed, CORS, etc.)
- `error.graphQLErrors` — erreurs métier retournées par le serveur (`[{ message, path, extensions }]`)

Distinguer les deux types d'erreur :

```ts
if (error.value?.networkError) {
  // Connexion impossible, serveur hors ligne
}
if (error.value?.graphQLErrors?.length) {
  // Erreur métier : permission refusée, entité introuvable, etc.
  const msg = error.value.graphQLErrors[0].message
}
```

### 2.9 Subscriptions — survol

Les subscriptions GraphQL envoient des mises à jour en temps réel via WebSocket. Avec urql, elles nécessitent l'échange `subscriptionExchange` + un transport WebSocket (`graphql-ws`).

```bash
# ⚠️ à vérifier Context7 — versions exactes peuvent varier
pnpm add graphql-ws @urql/core
```

```ts
import { createClient as createWsClient } from 'graphql-ws'
import { subscriptionExchange } from '@urql/core'

const wsClient = createWsClient({ url: 'ws://localhost:4000/graphql' })

app.use(urql, {
  url: '/graphql',
  exchanges: [
    cacheExchange,
    subscriptionExchange({
      forwardSubscription: (request) => ({
        subscribe: (sink) => ({
          unsubscribe: wsClient.subscribe(request, sink),
        }),
      }),
    }),
    fetchExchange,
  ],
})
```

Usage dans un composant (⚠️ à vérifier Context7 — API `useSubscription` peut différer selon version) :

```ts
import { useSubscription } from '@urql/vue'

const { data } = useSubscription({
  query: gql`
    subscription OnFamilyUpdated($familyId: ID!) {
      familyUpdated(familyId: $familyId) { id name memberCount }
    }
  `,
  variables: { familyId: selectedId },
})
```

Dans TribuZen, les subscriptions serviraient à notifier en temps réel l'acceptation d'une invitation par un membre de la famille. Pour ce module, REST/polling reste suffisant — les subscriptions sont à introduire quand ce besoin temps réel est avéré.

### 2.10 GraphQL vs REST — choisir selon le contexte

| Critère | REST | GraphQL |
|---|---|---|
| CRUD simple, 1 entité | Idéal — simple et lisible | Sur-ingénierie |
| Données imbriquées (familles → membres → activités) | N+1 requêtes ou endpoints spécialisés | 1 requête, champs précis |
| Équipes frontend/backend séparées | Contrat d'endpoints à négocier | Frontend autonome via schéma |
| Performances réseau (mobile) | Over-fetching fréquent | Précision des champs |
| Cache HTTP natif (CDN, ETags) | Transparent | Complexe (tout en POST) |
| Tooling en place (Swagger, OpenAPI) | Écosystème mature | GraphiQL, Apollo Studio |
| Équipe maîtrise REST | ROI immédiat | Courbe d'apprentissage |

**Règle pratique :** préférer REST pour les APIs CRUD simples et les petites équipes. GraphQL devient rentable dès que plusieurs clients (web, mobile) consomment des données avec des besoins différents, ou quand les relations de données sont profondes.

---

## 3. Worked examples

### Exemple 1 — FamilyList.vue : query avec variables et cache

Composant complet : liste des familles avec sélection pour voir les détails.

```vue
<!-- src/components/family/FamilyList.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery, gql } from '@urql/vue'

// ── Types ──────────────────────────────────────────────────────────────────
interface Member {
  id: string
  displayName: string
}

interface Family {
  id: string
  name: string
  memberCount: number
  members: Member[]
}

interface GetFamiliesData {
  families: Family[]
}

// ── Documents GraphQL ──────────────────────────────────────────────────────
const GET_FAMILIES = gql`
  query GetFamilies {
    families {
      id
      name
      memberCount
      members {
        id
        displayName
      }
    }
  }
`

// ── Query ──────────────────────────────────────────────────────────────────
// Le type générique <GetFamiliesData> donne à TS la forme de data.value
const { data, fetching, error } = useQuery<GetFamiliesData>({
  query: GET_FAMILIES,
  // cache-and-network : affiche le cache immédiatement, rafraîchit en fond
  requestPolicy: 'cache-and-network',
})

// Extraction sécurisée : data.value peut être undefined avant réponse
const families = computed(() => data.value?.families ?? [])

// État de sélection locale — pas besoin de Pinia pour une sélection locale
const selectedId = ref<string | null>(null)
const selectedFamily = computed(
  () => families.value.find(f => f.id === selectedId.value) ?? null
)
</script>

<template>
  <div class="family-list">
    <!-- Loading state -->
    <div v-if="fetching && families.length === 0" class="loading">
      Chargement…
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error" role="alert">
      Erreur : {{ error.message }}
    </div>

    <!-- Données disponibles (y compris pendant rafraîchissement cache-and-network) -->
    <template v-else>
      <!-- Indicateur discret pendant le rafraîchissement -->
      <span v-if="fetching" class="refresh-badge">Actualisation…</span>

      <ul class="families">
        <li
          v-for="family in families"
          :key="family.id"
          :class="{ 'family--selected': family.id === selectedId }"
          @click="selectedId = family.id"
        >
          <strong>{{ family.name }}</strong>
          <span class="count">{{ family.memberCount }} membres</span>
        </li>
      </ul>

      <!-- Détail famille sélectionnée -->
      <aside v-if="selectedFamily" class="family-detail">
        <h2>{{ selectedFamily.name }}</h2>
        <ul>
          <li v-for="m in selectedFamily.members" :key="m.id">
            {{ m.displayName }}
          </li>
        </ul>
      </aside>
    </template>
  </div>
</template>
```

**Points clés du worked example :**
- `useQuery<GetFamiliesData>` — le générique donne le type de `data.value`
- `data.value?.families ?? []` — optional chaining car `data.value` peut être `undefined`
- `fetching && families.length === 0` — loading initial seulement, pas pendant le rafraîchissement
- `requestPolicy: 'cache-and-network'` — affichage immédiat + fraîcheur des données

### Exemple 2 — InviteMemberForm.vue : mutation avec gestion d'erreur fine

```vue
<!-- src/components/family/InviteMemberForm.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMutation, gql } from '@urql/vue'

// ── Props ──────────────────────────────────────────────────────────────────
const props = defineProps<{
  familyId: string
}>()

const emit = defineEmits<{
  invited: [email: string]
}>()

// ── Types ──────────────────────────────────────────────────────────────────
interface InvitedMember {
  id: string
  email: string
  status: 'PENDING' | 'ACCEPTED'
}

interface InviteMemberData {
  inviteMember: InvitedMember
}

// ── Document GraphQL ───────────────────────────────────────────────────────
const INVITE_MEMBER = gql`
  mutation InviteMember($input: InviteMemberInput!) {
    inviteMember(input: $input) {
      id
      email
      status
    }
  }
`

// ── Mutation ───────────────────────────────────────────────────────────────
const { executeMutation, fetching: inviting } = useMutation<InviteMemberData>(INVITE_MEMBER)

// ── État local ─────────────────────────────────────────────────────────────
const email = ref('')
const networkError = ref<string | null>(null)
const graphqlErrors = ref<string[]>([])
const successMessage = ref<string | null>(null)

// Validation simple — le submit est bloqué si l'email est vide
const canSubmit = computed(() => email.value.trim().length > 0 && !inviting.value)

// ── Handlers ───────────────────────────────────────────────────────────────
async function handleInvite(): Promise<void> {
  // Reset des messages
  networkError.value = null
  graphqlErrors.value = []
  successMessage.value = null

  const result = await executeMutation({
    input: {
      email: email.value.trim(),
      familyId: props.familyId,
    },
  })

  if (result.error) {
    // Séparer erreur réseau et erreurs métier GraphQL
    if (result.error.networkError) {
      networkError.value = 'Connexion impossible — vérifie ta connexion réseau.'
    } else {
      graphqlErrors.value = result.error.graphQLErrors.map(e => e.message)
    }
    return
  }

  // Succès
  successMessage.value = `Invitation envoyée à ${result.data?.inviteMember.email}`
  emit('invited', email.value.trim())
  email.value = ''
}
</script>

<template>
  <form class="invite-form" @submit.prevent="handleInvite">
    <label for="invite-email">Email du membre</label>
    <input
      id="invite-email"
      v-model="email"
      type="email"
      :disabled="inviting"
      placeholder="alice@example.com"
    />

    <button type="submit" :disabled="!canSubmit">
      {{ inviting ? 'Envoi…' : 'Inviter' }}
    </button>

    <!-- Erreur réseau -->
    <p v-if="networkError" class="error-network" role="alert">
      {{ networkError }}
    </p>

    <!-- Erreurs GraphQL (métier) -->
    <ul v-if="graphqlErrors.length" class="error-graphql" role="alert">
      <li v-for="(msg, i) in graphqlErrors" :key="i">{{ msg }}</li>
    </ul>

    <!-- Succès -->
    <p v-if="successMessage" class="success" role="status">
      {{ successMessage }}
    </p>
  </form>
</template>
```

---

## 4. Pièges & misconceptions

### PIÈGE #1 — `data.value` sans optional chaining — le plus courant

```ts
const { data } = useQuery({ query: GET_FAMILIES })

// ❌ data.value est undefined avant la réponse — TypeError au montage
const families = data.value.families  // TypeError: Cannot read properties of undefined

// ✅ Optional chaining + valeur par défaut
const families = computed(() => data.value?.families ?? [])
```

La query est asynchrone. Pendant `fetching`, `data.value` est `undefined`. Ne jamais accéder directement à `data.value.xxx` — toujours via `computed` avec `?.` et `??`.

### PIÈGE #2 — useQuery s'exécute immédiatement, useMutation ne s'exécute pas

```ts
// ✅ useQuery : exécuté automatiquement au montage du composant
const { data, fetching } = useQuery({ query: GET_FAMILIES })
// → requête partie au montage, pas besoin d'appel explicite

// ❌ Confusion fréquente : penser que useMutation envoie la requête immédiatement
const { executeMutation } = useMutation(INVITE_MEMBER)
// → rien n'est envoyé ici — il faut appeler executeMutation() explicitement
await executeMutation({ input: { email: 'alice@example.com', familyId: 'fam-1' } })
```

`useQuery` = déclaratif (s'exécute seul). `useMutation` = impératif (attend `executeMutation()`).

### PIÈGE #3 — Variables statiques (objet litéral) vs réactives (ref)

```ts
const familyId = ref('fam-1')

// ❌ Objet litéral — la valeur est capturée une fois, jamais mise à jour
const { data } = useQuery({
  query: GET_FAMILY,
  variables: { id: familyId.value }, // ← .value copie la valeur initiale, pas réactive
})
// Changer familyId.value ne relance PAS la query

// ✅ Passer le ref directement — urql observe la réactivité Vue
const { data } = useQuery({
  query: GET_FAMILY,
  variables: { id: familyId }, // ← ref passé tel quel, réactif
})
// Changer familyId.value relance automatiquement la query
```

Même piège avec `computed` : passer `computed(() => route.params.id)` comme variable urql fonctionne correctement.

### PIÈGE #4 — Confondre erreur réseau et erreur GraphQL

```ts
// ❌ Traiter toutes les erreurs de la même façon
if (error.value) {
  showToast(error.value.message) // message peu informatif pour une erreur métier
}

// ✅ Distinguer les deux types
if (error.value?.networkError) {
  // Serveur inaccessible, timeout, CORS — erreur d'infrastructure
  showToast('Connexion impossible — réessaie dans quelques instants')
} else if (error.value?.graphQLErrors?.length) {
  // Erreur métier renvoyée par le serveur (accès refusé, entité introuvable, validation)
  showToast(error.value.graphQLErrors[0].message)
}
```

Un serveur GraphQL peut retourner `HTTP 200` avec des erreurs dans `{ errors: [...] }` — ce ne sont pas des erreurs réseau. `CombinedError` urql sépare les deux.

---

## 5. Ancrage TribuZen

Dans TribuZen, GraphQL est la couche de communication entre le front-office Vue et le backend NestJS (module 38 du cours NestJS). Les deux composants du module s'intègrent directement :

**`FamilyList.vue`** (Exemple 1) — page d'accueil post-connexion. Query `GetFamilies` — retourne toutes les familles de l'utilisateur authentifié (contexte JWT transmis dans les headers via `fetchOptions` urql).

**`InviteMemberForm.vue`** (Exemple 2) — formulaire d'invitation dans `FamilySettingsPage.vue`. Mutation `InviteMember` — crée une invitation avec statut `PENDING`, envoi d'email en arrière-plan.

```
tribuzen/
  src/
    gql/                         ← Types générés par codegen (ne pas éditer manuellement)
      graphql.ts
    components/
      family/
        FamilyList.vue           ← useQuery GetFamilies
        InviteMemberForm.vue     ← useMutation InviteMember
    pages/
      FamilyPage.vue             ← Monte FamilyList + FamilySettingsPage
      FamilySettingsPage.vue     ← Monte InviteMemberForm
```

Configuration urql TribuZen avec headers d'authentification :

```ts
// plugins/urql.ts
import urql, { cacheExchange, fetchExchange } from '@urql/vue'
import type { App } from 'vue'

export function installUrql(app: App): void {
  app.use(urql, {
    url: import.meta.env.VITE_GRAPHQL_URL ?? '/graphql',
    // fetchOptions : appelé à chaque requête — JWT toujours à jour
    fetchOptions: () => ({
      headers: {
        Authorization: `Bearer ${localStorage.getItem('tribuzen_token') ?? ''}`,
      },
    }),
    exchanges: [cacheExchange, fetchExchange],
  })
}
```

---

## 6. Points clés

1. GraphQL expose un schéma unique (`/graphql`) — le client choisit exactement les champs voulus, éliminant over-fetching et N+1 requêtes.
2. `useQuery({ query, variables, requestPolicy })` — s'exécute automatiquement au montage, retourne `{ data, fetching, error }` réactifs.
3. `useMutation(doc)` — retourne `{ executeMutation, fetching }` ; l'envoi est manuel via `executeMutation(variables)`.
4. Les variables passées à `useQuery` doivent être des `ref` (pas `ref.value`) pour rester réactives — changer une variable ref relance la query automatiquement.
5. `data.value` est `undefined` avant la réponse — toujours accéder via `computed(() => data.value?.xxx ?? fallback)`.
6. `CombinedError` urql distingue `networkError` (infrastructure) et `graphQLErrors` (métier) — les traiter séparément en UI.
7. `requestPolicy: 'cache-and-network'` : affichage immédiat depuis le cache + rafraîchissement en fond — idéal pour les listes en lecture.
8. Codegen (`@graphql-codegen/client-preset`) génère les types TypeScript depuis le schéma — plus d'interfaces manuelles à maintenir.
9. GraphQL vs REST — GraphQL rentable quand données imbriquées, plusieurs clients avec besoins différents, équipe frontend/backend séparée.
10. Subscriptions = GraphQL temps réel via WebSocket — à introduire seulement si le besoin temps réel est avéré.

---

## 7. Seeds Anki

```
Quelle différence fondamentale entre useQuery et useMutation dans urql/vue ?|useQuery s'exécute automatiquement au montage (déclaratif). useMutation attend un appel explicite à executeMutation(variables) (impératif).
Pourquoi data.value?.families ?? [] et pas data.value.families directement ?|data.value est undefined pendant le chargement (fetching). Sans optional chaining, TypeError au montage. Le ?? [] fournit une valeur par défaut safe.
Comment passer des variables réactives à useQuery pour relancer automatiquement la query ?|Passer le ref lui-même (pas .value) : useQuery({ query, variables: { id: familyId } }). Changer familyId.value relance la query. Passer familyId.value = snapshot figé, pas réactif.
Que retourne useMutation dans @urql/vue et comment déclencher la mutation ?|useMutation(doc) retourne { executeMutation, fetching, data, error }. On déclenche en appelant : const result = await executeMutation(variables). result.data et result.error contiennent le résultat.
Quelle est la différence entre networkError et graphQLErrors dans CombinedError urql ?|networkError = erreur d'infrastructure (serveur inaccessible, timeout, CORS). graphQLErrors = erreurs métier retournées par le serveur dans { errors: [...] } avec HTTP 200. À traiter séparément en UI.
Quel requestPolicy choisir pour afficher le cache immédiatement et rafraîchir en fond ?|requestPolicy: 'cache-and-network'. Affiche les données cachées sans attendre, puis émet une requête réseau pour mettre à jour. Idéal pour les listes rarement modifiées.
Quel avantage concret apporte codegen (@graphql-codegen/client-preset) avec urql ?|Génère automatiquement les types TypeScript depuis le schéma serveur. Plus d'interfaces manuelles à écrire et maintenir. useQuery<GetFamiliesQuery> donne un typage complet sur data.value sans effort.
Quand préférer GraphQL à REST pour une nouvelle API ?|Quand plusieurs clients (web, mobile) consomment des données avec des besoins différents, quand les relations de données sont profondes (N+1 REST), ou quand le frontend doit être autonome du backend pour choisir ses champs.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-36-graphql-vue3/README.md`. Pratique guidée : construire `FamilyBrowser.vue` (query avec variables) et `InviteForm.vue` (mutation + gestion d'erreur) avec `@urql/vue` contre un schéma GraphQL local, puis valider avec `vue-tsc --noEmit`. Corrigé complet commenté + variante J+30.
