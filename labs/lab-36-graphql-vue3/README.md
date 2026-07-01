# Lab 36 — GraphQL avec Vue (@urql/vue)

> **Outcome :** à la fin, tu sais construire deux composants Vue 3 qui consomment une API GraphQL réelle — un avec `useQuery` (liste réactive avec variable), un avec `useMutation` (formulaire avec gestion d'erreur fine) — et vérifier le typage avec `vue-tsc --noEmit`.
> **Vrai outil :** `@urql/vue` + `graphql-yoga` (serveur GraphQL local) + `vue-tsc`.
> **Feedback :** le coach valide en session — vérification visuelle dans le navigateur + `vue-tsc` vert.

---

## Énoncé

Tu construis deux composants pour la page famille de TribuZen.

**Composant 1 — `FamilyBrowser.vue`**
- Affiche une liste de familles via `useQuery`
- Un sélecteur (`<select>`) permet de filtrer par statut (`ALL | ACTIVE | ARCHIVED`)
- Le changement de statut relance automatiquement la query (variable réactive)
- États gérés : loading initial, erreur, données + indicateur de rafraîchissement

**Composant 2 — `InviteForm.vue`**
- Formulaire d'invitation (champ email + bouton)
- `useMutation` `InviteMember`
- Distingue erreur réseau et erreur GraphQL métier (ex : email déjà invité)
- Émet un événement `invited` au parent en cas de succès

Les deux composants passent `vue-tsc --noEmit` sans erreur.

---

## Setup du projet

### 1. Serveur GraphQL local (graphql-yoga)

Crée un mini-serveur pour le lab dans `lab-server/index.ts` :

```bash
mkdir lab-server
pnpm add -D graphql-yoga graphql tsx
```

```ts
// lab-server/index.ts
import { createServer } from 'node:http'
import { createSchema, createYoga } from 'graphql-yoga'

// Données en mémoire — suffisant pour le lab
const families = [
  { id: 'fam-1', name: 'Les Dupont', memberCount: 3, status: 'ACTIVE' },
  { id: 'fam-2', name: 'Les Martin', memberCount: 2, status: 'ACTIVE' },
  { id: 'fam-3', name: 'Les Durand', memberCount: 5, status: 'ARCHIVED' },
]

const invitations: { id: string; email: string; status: string; familyId: string }[] = []

const yoga = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      enum FamilyStatus { ALL ACTIVE ARCHIVED }

      type Family {
        id: ID!
        name: String!
        memberCount: Int!
        status: String!
      }

      type Invitation {
        id: ID!
        email: String!
        status: String!
        familyId: ID!
      }

      input InviteMemberInput {
        email: String!
        familyId: ID!
      }

      type Query {
        families(status: FamilyStatus): [Family!]!
      }

      type Mutation {
        inviteMember(input: InviteMemberInput!): Invitation!
      }
    `,
    resolvers: {
      Query: {
        families: (_: unknown, { status }: { status?: string }) => {
          if (!status || status === 'ALL') return families
          return families.filter(f => f.status === status)
        },
      },
      Mutation: {
        inviteMember: (_: unknown, { input }: { input: { email: string; familyId: string } }) => {
          // Simule erreur métier : email déjà invité
          if (invitations.some(i => i.email === input.email && i.familyId === input.familyId)) {
            throw new Error(`${input.email} est déjà invité dans cette famille`)
          }
          const invitation = { id: `inv-${Date.now()}`, ...input, status: 'PENDING' }
          invitations.push(invitation)
          return invitation
        },
      },
    },
  }),
})

const server = createServer(yoga)
server.listen(4000, () => {
  console.log('GraphQL server ready at http://localhost:4000/graphql')
})
```

Lance le serveur :

```bash
npx tsx lab-server/index.ts
```

### 2. Client Vue + @urql/vue

Dans ton projet Vite Vue 3 existant (ou `pnpm create vite@latest lab-36 --template vue-ts`) :

```bash
pnpm add @urql/vue graphql
```

Configure le client dans `main.ts` :

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import urql, { cacheExchange, fetchExchange } from '@urql/vue'

const app = createApp(App)

app.use(urql, {
  url: 'http://localhost:4000/graphql',
  exchanges: [cacheExchange, fetchExchange],
})

app.mount('#app')
```

Monte les deux composants dans `App.vue` pour les voir simultanément :

```vue
<!-- App.vue -->
<script setup lang="ts">
import FamilyBrowser from './components/FamilyBrowser.vue'
import InviteForm from './components/InviteForm.vue'
</script>

<template>
  <main>
    <FamilyBrowser />
    <hr />
    <InviteForm family-id="fam-1" @invited="(email) => console.log('Invité:', email)" />
  </main>
</template>
```

---

## Étapes (en friction)

**Bloc 1 — FamilyBrowser.vue**

1. Déclare les types TypeScript : `Family` (id, name, memberCount, status) et `GetFamiliesData` (familles : `Family[]`).
2. Écris le document GraphQL `GET_FAMILIES` avec une variable `$status: FamilyStatus` (optionnelle).
3. Déclare un `ref<string>('ALL')` pour le statut sélectionné.
4. Appelle `useQuery<GetFamiliesData>({ query: GET_FAMILIES, variables: { status: selectedStatus } })` — passe le `ref`, pas `.value`.
5. Extrait `families` via un `computed` avec valeur par défaut `[]`.
6. Écris le template : `<select>` pour choisir le statut, liste `v-for` des familles, états loading/error/rafraîchissement.
7. Vérifie : changer le `<select>` doit filtrer en direct sans rechargement de page.

**Bloc 2 — InviteForm.vue**

1. Déclare la prop `familyId: string` et l'emit `invited: [email: string]`.
2. Écris le document `INVITE_MEMBER` avec variable `$input: InviteMemberInput!`.
3. Appelle `useMutation(INVITE_MEMBER)` et destructure `{ executeMutation, fetching: inviting }`.
4. Écris `handleInvite()` : appelle `executeMutation`, inspecte `result.error.networkError` vs `result.error.graphQLErrors`, émet l'événement si succès.
5. Dans le template : champ email, bouton désactivé pendant `inviting`, messages d'erreur distincts réseau vs métier, message de succès.
6. Vérifie le cas d'erreur métier : invite deux fois le même email sur la même famille → le message du serveur doit s'afficher.

**Validation**

```bash
vue-tsc --noEmit
```

Zéro erreur TypeScript avant de soumettre.

---

## Corrigé complet commenté

### FamilyBrowser.vue

```vue
<!-- src/components/FamilyBrowser.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery, gql } from '@urql/vue'

// ── Types ─────────────────────────────────────────────────────────────────
// Représente une famille telle que retournée par le serveur GraphQL
interface Family {
  id: string
  name: string
  memberCount: number
  status: string
}

// Forme exacte de data.value quand la query réussit
interface GetFamiliesData {
  families: Family[]
}

// ── Document GraphQL ───────────────────────────────────────────────────────
// Variable $status optionnelle — null ou absent = toutes les familles
const GET_FAMILIES = gql`
  query GetFamilies($status: FamilyStatus) {
    families(status: $status) {
      id
      name
      memberCount
      status
    }
  }
`

// ── État ───────────────────────────────────────────────────────────────────
// ref passé directement à useQuery — urql observe les changements
const selectedStatus = ref<string>('ALL')

// ── Query ──────────────────────────────────────────────────────────────────
const { data, fetching, error } = useQuery<GetFamiliesData>({
  query: GET_FAMILIES,
  // selectedStatus est un ref — changer .value relance la query automatiquement
  // Si on avait écrit { status: selectedStatus.value }, pas de réactivité
  variables: { status: selectedStatus },
  // cache-and-network : affiche le cache immédiatement puis rafraîchit
  requestPolicy: 'cache-and-network',
})

// Extraction sécurisée — data.value est undefined pendant le premier chargement
const families = computed(() => data.value?.families ?? [])

// ── Helpers template ───────────────────────────────────────────────────────
// true uniquement pendant le premier chargement (pas pendant le rafraîchissement)
const isInitialLoading = computed(() => fetching.value && families.value.length === 0)
</script>

<template>
  <section class="family-browser">
    <h1>Mes familles</h1>

    <!-- Filtre statut — le v-model sur selectedStatus déclenche la query via la réactivité urql -->
    <label for="status-filter">Filtrer</label>
    <select id="status-filter" v-model="selectedStatus">
      <option value="ALL">Toutes</option>
      <option value="ACTIVE">Actives</option>
      <option value="ARCHIVED">Archivées</option>
    </select>

    <!-- Indicateur de rafraîchissement discret (quand on a déjà des données) -->
    <span v-if="fetching && !isInitialLoading" class="refresh-tag">
      Actualisation…
    </span>

    <!-- Loading initial — aucune donnée en cache -->
    <p v-if="isInitialLoading">Chargement…</p>

    <!-- Erreur réseau ou GraphQL -->
    <div v-else-if="error" class="error" role="alert">
      {{ error.message }}
    </div>

    <!-- Données disponibles -->
    <template v-else>
      <p v-if="families.length === 0" class="empty">
        Aucune famille pour ce filtre.
      </p>

      <ul v-else class="family-list">
        <!-- :key sur l'id métier stable — résistant au tri/filtre -->
        <li v-for="family in families" :key="family.id" class="family-item">
          <strong>{{ family.name }}</strong>
          <!-- Interpolation sécurisée — pas de v-html -->
          <span class="meta">{{ family.memberCount }} membres · {{ family.status }}</span>
        </li>
      </ul>
    </template>
  </section>
</template>
```

### InviteForm.vue

```vue
<!-- src/components/InviteForm.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMutation, gql } from '@urql/vue'

// ── Props et emits ─────────────────────────────────────────────────────────
const props = defineProps<{
  familyId: string
}>()

// Emit typé — le parent reçoit l'email de la personne invitée
const emit = defineEmits<{
  invited: [email: string]
}>()

// ── Types ──────────────────────────────────────────────────────────────────
interface Invitation {
  id: string
  email: string
  status: string
  familyId: string
}

interface InviteMemberData {
  inviteMember: Invitation
}

// ── Document GraphQL ───────────────────────────────────────────────────────
const INVITE_MEMBER = gql`
  mutation InviteMember($input: InviteMemberInput!) {
    inviteMember(input: $input) {
      id
      email
      status
      familyId
    }
  }
`

// ── Mutation ───────────────────────────────────────────────────────────────
// useMutation ne déclenche rien ici — attendr executeMutation()
const { executeMutation, fetching: inviting } = useMutation<InviteMemberData>(INVITE_MEMBER)

// ── État local ─────────────────────────────────────────────────────────────
const email = ref('')
const networkErrorMsg = ref<string | null>(null)
const graphqlErrorMsgs = ref<string[]>([])
const successMsg = ref<string | null>(null)

// Le bouton est actif seulement si l'email n'est pas vide et qu'on n'est pas en train d'envoyer
const canSubmit = computed(() => email.value.trim().length > 0 && !inviting.value)

// ── Handler ────────────────────────────────────────────────────────────────
async function handleInvite(): Promise<void> {
  // Reset des messages avant chaque tentative
  networkErrorMsg.value = null
  graphqlErrorMsgs.value = []
  successMsg.value = null

  const result = await executeMutation({
    input: {
      email: email.value.trim(),
      familyId: props.familyId,
    },
  })

  if (result.error) {
    // networkError : serveur inaccessible, CORS, timeout
    if (result.error.networkError) {
      networkErrorMsg.value = 'Connexion impossible — vérifie ta connexion réseau.'
    } else {
      // graphQLErrors : erreurs métier du serveur (email déjà invité, famille introuvable, etc.)
      // On mappe les messages pour les afficher dans une liste
      graphqlErrorMsgs.value = result.error.graphQLErrors.map(e => e.message)
    }
    return
  }

  // Succès : notifier le parent et réinitialiser le formulaire
  successMsg.value = `Invitation envoyée à ${result.data?.inviteMember.email}`
  emit('invited', email.value.trim())
  email.value = ''
}
</script>

<template>
  <section class="invite-section">
    <h2>Inviter un membre</h2>

    <form class="invite-form" @submit.prevent="handleInvite">
      <label for="invite-email">Email</label>
      <input
        id="invite-email"
        v-model="email"
        type="email"
        :disabled="inviting"
        placeholder="alice@example.com"
        autocomplete="email"
      />

      <!-- Désactivé si email vide ou mutation en cours -->
      <button type="submit" :disabled="!canSubmit">
        {{ inviting ? 'Envoi en cours…' : 'Inviter' }}
      </button>
    </form>

    <!-- Erreur réseau — problème d'infrastructure -->
    <p v-if="networkErrorMsg" class="error-network" role="alert">
      Erreur réseau : {{ networkErrorMsg }}
    </p>

    <!-- Erreurs GraphQL — problèmes métier retournés par le serveur -->
    <!-- v-if sur length pour ne pas rendre une <ul> vide dans le DOM -->
    <ul v-if="graphqlErrorMsgs.length" class="error-graphql" role="alert">
      <li v-for="(msg, i) in graphqlErrorMsgs" :key="i">{{ msg }}</li>
    </ul>

    <!-- Confirmation de succès -->
    <p v-if="successMsg" class="success" role="status">
      {{ successMsg }}
    </p>
  </section>
</template>
```

### Validation vue-tsc

```bash
# Depuis la racine du projet Vue
vue-tsc --noEmit
# Attendu : aucune sortie (zéro erreur)
```

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — 30 minutes, sans ouvrir ce corrigé :**

1. Dans `FamilyBrowser.vue`, ajoute un bouton **Rafraîchir** qui force une requête réseau (`requestPolicy: 'network-only'`) via `executeQuery()` — sans changer la variable de statut.
2. Dans `InviteForm.vue`, ajoute un `ref<string[]>` qui accumule les emails déjà invités avec succès dans la session, et affiche la liste sous le formulaire.
3. Écris un `computed<boolean>` `emailAlreadyInvited` qui bloque le submit si l'email est dans cette liste locale (avant même d'appeler le serveur).

**Critère de réussite :** `vue-tsc --noEmit` vert, les deux fonctionnalités visibles dans le navigateur.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen` :

```
tribuzen/
  src/
    gql/                          ← Généré par codegen (ne pas éditer)
      graphql.ts
    components/
      family/
        FamilyBrowser.vue         ← query GetFamilies + variable status réactive
        InviteForm.vue            ← mutation InviteMember + gestion erreurs
    pages/
      FamilyPage.vue              ← Monte FamilyBrowser
      FamilySettingsPage.vue      ← Monte InviteForm avec familyId depuis la route
```

**Différences par rapport au lab :**

- `familyId` dans `InviteForm` viendra de `useRoute().params.familyId` (Vue Router — module 14).
- Le JWT d'authentification est ajouté dans `fetchOptions` du client urql (voir module 36 section 5 — plugins/urql.ts TribuZen).
- Avec codegen actif, les types `GetFamiliesData`, `InviteMemberData` sont importés depuis `@/gql/graphql` — supprimer les interfaces manuelles du lab.

**Commit cible :**

```
feat(family): FamilyBrowser + InviteForm — useQuery/useMutation @urql/vue typés
```
