---
titre: tRPC
cours: 02-vue
notions: [type safety bout en bout sans codegen, router et procedures, query et mutation, input validation avec zod, client tRPC dans Vue, intégration avec Nuxt et Nitro, inférence de types partagée, comparaison avec GraphQL et REST]
outcomes:
  - sait exposer des procédures tRPC typées (query, mutation) validées par zod
  - sait consommer tRPC côté Vue avec inférence de types automatique
  - sait intégrer tRPC dans un contexte Nuxt/Nitro
  - sait choisir tRPC vs GraphQL vs REST
prerequis: [36-graphql-vue3]
next: 38-accessibilite-fondamentaux-wcag
libs: [{ name: vue, version: "3.5" }, { name: "@trpc/server", version: "11" }]
tribuzen: front-office TribuZen — API interne typée bout-en-bout (procédures famille/invitation) partagée front et serveur, sans duplication de types
last-reviewed: 2026-07
---

# tRPC

> **Outcomes — tu sauras FAIRE :** exposer des procédures tRPC typées (query, mutation) validées par zod, consommer tRPC côté Vue avec inférence automatique, intégrer tRPC dans un contexte Nuxt/Nitro, choisir tRPC vs GraphQL vs REST.
> **Difficulté :** :star::star::star:
>
> **Portée :** ce module couvre tRPC côté serveur (router, procédures) et côté client Vue/Nuxt. La gestion du contexte d'authentification (`ctx` middleware) et les subscriptions (WebSocket) ne sont pas couverts ici.

---

## 1. Cas concret d'abord

TribuZen a un frontend Nuxt/Vue et un backend Nitro. L'équipe expose une API pour créer des invitations familiales. Avec REST, voici ce que tu dois maintenir en double :

```ts
// ❌ Approche REST — types dupliqués et désynchronisés

// server/routes/api/invitations/post.ts
interface CreateInvitationBody {
  familyId: string
  email: string
  role: 'admin' | 'member'
}

// pages/invite.vue — même interface, copiée-collée
interface CreateInvitationPayload {
  familyId: string
  email: string
  role: 'admin' | 'member'   // Quelqu'un ajoute 'viewer' côté serveur...
}                              // → le client compile encore, l'erreur est à l'exécution
```

Un développeur ajoute `'viewer'` à l'union `role` côté serveur. Le client ne le sait pas. Zéro erreur de compilation, bug en production.

**Avec tRPC :** l'interface n'existe qu'une seule fois — dans le router serveur. Le client en hérite automatiquement via les types TypeScript. Changer `role` côté serveur casse immédiatement le build côté client. Ce module te montre comment y arriver.

---

## 2. Théorie complète, concise

### 2.1 Type safety bout en bout sans codegen

tRPC exploite le système de types de TypeScript directement : le serveur exporte le **type** du router (`AppRouter = typeof appRouter`), et le client importe **uniquement ce type** (aucun code serveur ne se retrouve dans le bundle client). TypeScript calcule ensuite, à la compilation, le type exact de chaque procédure.

```
server/router.ts        client/utils/trpc.ts       Vue composant
      │                        │                        │
  appRouter ──── type ──► AppRouter ─── générique ──► trpc.family.list.query()
  (runtime)                (type seul)                 (typé automatiquement)
```

Contrairement à GraphQL (codegen nécessaire — `graphql-codegen`, un fichier `.graphql`, un build step), tRPC ne génère aucun fichier intermédiaire. Le type est **inféré à la volée** depuis la définition du router.

**Prérequis TypeScript :** ce mécanisme s'appuie sur `typeof`, les mapped types et l'inférence conditionnelle de TypeScript — les mêmes outils vus dans les modules 06-09 du cours TS. `inferRouterOutputs<AppRouter>` utilise exactement ce sous-système.

### 2.2 Router et procédures

`initTRPC.create()` initialise une instance tRPC. On en extrait deux primitives :

```ts
// server/trpc.ts
import { initTRPC } from '@trpc/server'

const t = initTRPC.create()

// router : regroupe des procédures en un objet imbriqué
export const router = t.router

// publicProcedure : base pour définir une procédure ouverte
// (pas d'auth — middleware auth viendrait s'ajouter ici)
export const publicProcedure = t.procedure
```

Les routers s'imbriquent pour organiser l'API en domaines métier :

```ts
// server/router.ts
import { router } from './trpc'
import { familyRouter } from './routers/family'
import { invitationRouter } from './routers/invitation'

export const appRouter = router({
  family: familyRouter,
  invitation: invitationRouter,
})

// Ce type est la seule chose que le client importe
export type AppRouter = typeof appRouter
```

### 2.3 Query et mutation

Deux types de procédures, avec une sémantique claire :

| Type | Rôle | Sémantique HTTP | Appel client |
|------|------|-----------------|--------------|
| `.query()` | Lecture, idempotent | GET | `trpc.family.list.query()` |
| `.mutation()` | Écriture | POST | `trpc.family.create.mutate({...})` |

Le handler reçoit `{ input, ctx }`. `input` est le payload validé par zod. `ctx` est le contexte (base de données, session — vide dans les exemples sans middleware).

```ts
// query sans input
getAll: publicProcedure.query(async () => {
  return await db.families.findAll()
})

// mutation avec input
create: publicProcedure
  .input(/* voir 2.4 */)
  .mutation(async ({ input }) => {
    return await db.families.create(input)
  })
```

### 2.4 Input validation avec zod

`.input(zodSchema)` attache un validateur Zod à la procédure :

- **Runtime :** si l'input ne respecte pas le schéma, tRPC renvoie automatiquement une `TRPCError` avec le code `BAD_REQUEST` — aucun code de validation manuel.
- **Compile time :** TypeScript infère le type de `input` depuis le schéma Zod (`z.infer<typeof schema>`).

```ts
import { z } from 'zod'
import { router, publicProcedure } from '../trpc'

export const invitationRouter = router({
  send: publicProcedure
    .input(
      z.object({
        familyId: z.string().uuid(),
        email: z.string().email(),
        role: z.enum(['admin', 'member']),
      })
    )
    .mutation(async ({ input }) => {
      // input.familyId  : string (uuid validé)
      // input.email     : string (email validé)
      // input.role      : 'admin' | 'member'
      // Tout ça est garanti par Zod + TypeScript — pas de cast, pas de garde manuelle
      return await db.invitations.create(input)
    }),
})
```

Zod valide aussi les types primitifs en entrée de query :

```ts
getById: publicProcedure
  .input(z.string().uuid())          // input est string
  .query(async ({ input }) => {
    return await db.families.findById(input)
  }),
```

### 2.5 Client tRPC dans Vue

tRPC n'a pas de package `@trpc/vue` officiel — on utilise le client vanilla `@trpc/client` directement dans un composable Vue.

```ts
// utils/trpc.ts — instanciation unique du client
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '../server/router'     // ⬅ type seul, pas de code runtime

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',    // URL du handler Nitro (voir 2.6)
    }),
  ],
})
```

> **tRPC v11 :** `createTRPCClient` remplace `createTRPCProxyClient` de v10. Le nom a changé, pas la sémantique. Voir piège #1.

Utilisation dans un composant Vue :

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { trpc } from '@/utils/trpc'
import type { RouterOutputs } from '@/utils/trpc-types'

// Type exact du tableau retourné par la procédure — aucune duplication
type FamilyList = RouterOutputs['family']['list']

const families = ref<FamilyList>([])
const loading = ref(false)
const error = ref<string | null>(null)

async function loadFamilies(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    families.value = await trpc.family.list.query()
    // TypeScript sait que families.value est FamilyList — pas de cast
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erreur inconnue'
  } finally {
    loading.value = false
  }
}

onMounted(loadFamilies)
</script>
```

### 2.6 Intégration avec Nuxt et Nitro

Dans un projet Nuxt, le backend tourne dans Nitro. tRPC v11 expose un **fetch adapter** compatible avec le modèle Request/Response standard, que Nitro peut wrapping via `h3`.

```ts
// server/api/trpc/[trpc].ts — catch-all Nitro pour toutes les procédures tRPC
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { toWebRequest } from 'h3'
import { appRouter } from '~/server/trpc/router'

export default defineEventHandler((event) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: toWebRequest(event),     // Convertit l'event H3 en Request standard
    router: appRouter,
    createContext: () => ({}),    // Context vide — ajouter session ici plus tard
  })
})
```

> ⚠️ `toWebRequest` est disponible depuis h3 1.13+ (Nuxt 3.14+). Sur une version antérieure, utiliser le package `trpc-nuxt` comme wrapper — à vérifier Context7 si ton projet est sur Nuxt < 3.14.

Avec Nuxt, le data fetching côté page utilise `useAsyncData` pour bénéficier du SSR :

```ts
// pages/families.vue
const { data: families } = await useAsyncData(
  'families',
  () => trpc.family.list.query()
)
// families.value est typé depuis AppRouter — aucune annotation manuelle
```

Le client reste le même fichier `utils/trpc.ts` (URL `/api/trpc`). Nitro gère la route `[trpc]` comme un catch-all.

### 2.7 Inférence de types partagée

`@trpc/server` expose des utilitaires génériques pour dériver les types d'inputs et d'outputs depuis le router :

```ts
// utils/trpc-types.ts — fichier partagé (frontend uniquement, pas de code serveur)
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '../server/router'

export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>

// Exemples d'utilisation :
// RouterInputs['invitation']['send']   → { familyId: string, email: string, role: 'admin' | 'member' }
// RouterOutputs['family']['list']      → Family[]
// RouterOutputs['family']['getById']   → Family | undefined
```

Ces types sont **dérivés automatiquement** depuis le router. Si une procédure change de signature, les types changent en cascade — les composants qui utilisent les anciens types cassent à la compilation.

**Connexion avec le cours TS :** `inferRouterOutputs<AppRouter>` est un mapped type conditionnel — exactement le mécanisme des modules TS 07-09. Comprendre `typeof appRouter` → `AppRouter` → `inferRouterOutputs<AppRouter>` c'est lire de la vraie inférence récursive TypeScript en action.

### 2.8 Comparaison REST vs GraphQL vs tRPC

| Critère | REST | GraphQL | tRPC |
|---------|------|---------|------|
| Type safety | Manuelle (interfaces dupliquées) | Via codegen (build step, schema .graphql) | Native (typeof + inférence, zéro codegen) |
| Backend requis | N'importe quel langage | N'importe quel langage | TypeScript uniquement |
| Courbe d'apprentissage | Faible | Élevée (SDL, resolvers, directives) | Moyenne (TypeScript nécessaire) |
| Sur-fetch / sous-fetch | Problème courant | Résolu (champs à la demande) | Non applicable (RPC — on appelle ce qu'on veut) |
| Idéal quand | API publique ou clients divers | Données imbriquées complexes, clients variés | Fullstack TypeScript, équipe qui contrôle front+back |
| Outillage Nuxt | `$fetch`, `useFetch` | `@nuxtjs/apollo` | Nitro catch-all + `createTRPCClient` |

**Règle de décision :**
- API publique consommée par des tiers → REST
- Données imbriquées complexes, apps mobiles iOS/Android en plus → GraphQL
- Fullstack TypeScript contrôlé (Nuxt + Nitro, Next.js + Node) → tRPC

---

## 3. Worked examples

### Exemple 1 — Router TribuZen famille complet (server + client Vue)

**Côté serveur (Nitro) :**

```ts
// server/trpc/trpc.ts
import { initTRPC } from '@trpc/server'

const t = initTRPC.create()
export const router = t.router
export const publicProcedure = t.procedure
```

```ts
// server/trpc/routers/family.ts
import { z } from 'zod'
import { router, publicProcedure } from '../trpc'

// Schémas Zod réutilisables — source de vérité unique
const FamilySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  createdAt: z.string(),
})

const CreateFamilyInput = z.object({
  name: z.string().min(2, 'Le nom doit avoir au moins 2 caractères').max(50),
})

// Base de données en mémoire pour l'exemple (remplacer par Prisma/PG en production)
const families: Array<{ id: string; name: string; createdAt: string }> = []

export const familyRouter = router({
  // QUERY — liste toutes les familles
  list: publicProcedure.query(() => {
    return families
  }),

  // QUERY — récupère une famille par ID
  getById: publicProcedure
    .input(z.string().uuid())
    .query(({ input }) => {
      // input est string (uuid) — garanti par zod
      const family = families.find((f) => f.id === input)
      if (!family) {
        // TRPCError propagée correctement au client avec code + message
        throw new Error(`Famille ${input} introuvable`)
      }
      return family
    }),

  // MUTATION — crée une nouvelle famille
  create: publicProcedure
    .input(CreateFamilyInput)
    .mutation(({ input }) => {
      // input.name est string avec contraintes validées — pas de cast
      const family = {
        id: crypto.randomUUID(),
        name: input.name,
        createdAt: new Date().toISOString(),
      }
      families.push(family)
      return family
    }),
})
```

```ts
// server/trpc/router.ts
import { router } from './trpc'
import { familyRouter } from './routers/family'

export const appRouter = router({
  family: familyRouter,
})

export type AppRouter = typeof appRouter
```

**Côté client Vue (composant `FamilyPage.vue`) :**

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { trpc } from '@/utils/trpc'
import type { RouterOutputs } from '@/utils/trpc-types'

// Type dérivé automatiquement — aucune interface à écrire manuellement
type Family = RouterOutputs['family']['list'][number]

const families = ref<Family[]>([])
const newFamilyName = ref('')
const loading = ref(false)
const creating = ref(false)
const error = ref<string | null>(null)

async function loadFamilies(): Promise<void> {
  loading.value = true
  try {
    // TypeScript infère que la valeur est Family[]
    families.value = await trpc.family.list.query()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erreur de chargement'
  } finally {
    loading.value = false
  }
}

async function createFamily(): Promise<void> {
  if (!newFamilyName.value.trim()) return
  creating.value = true
  try {
    // TypeScript vérifie que l'input correspond à CreateFamilyInput
    // Si on oublie `name`, ou si on passe un number — erreur de compilation
    const created = await trpc.family.create.mutate({ name: newFamilyName.value })
    families.value.push(created)    // created est typé comme Family
    newFamilyName.value = ''
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erreur de création'
  } finally {
    creating.value = false
  }
}

onMounted(loadFamilies)
</script>

<template>
  <div>
    <p v-if="error" class="error">{{ error }}</p>

    <form @submit.prevent="createFamily">
      <input v-model="newFamilyName" placeholder="Nom de la famille" :disabled="creating" />
      <button type="submit" :disabled="creating || !newFamilyName.trim()">
        {{ creating ? 'Création...' : 'Créer' }}
      </button>
    </form>

    <div v-if="loading">Chargement...</div>
    <ul v-else>
      <li v-for="family in families" :key="family.id">
        {{ family.name }} — {{ family.createdAt }}
      </li>
    </ul>
  </div>
</template>
```

**Ce que TypeScript vérifie ici, sans aucune annotation manuelle côté client :**
- `families.value` accepte uniquement `Family[]`
- `trpc.family.create.mutate({ name: 42 })` → erreur de compilation
- `trpc.family.nonExistent.query()` → erreur de compilation (procédure inconnue)
- `created.id` est `string` — pas besoin de cast

### Exemple 2 — Intégration Nuxt avec `useAsyncData` (SSR-safe)

```ts
// utils/trpc.ts
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '~/server/trpc/router'

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({ url: '/api/trpc' }),
  ],
})
```

```ts
// utils/trpc-types.ts
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '~/server/trpc/router'

export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>
```

```ts
// server/api/trpc/[trpc].ts — Nitro catch-all
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { toWebRequest } from 'h3'
import { appRouter } from '~/server/trpc/router'

export default defineEventHandler((event) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: toWebRequest(event),
    router: appRouter,
    createContext: () => ({}),
  })
})
```

```vue
<!-- pages/families.vue — rendu côté serveur (SSR) avec useAsyncData -->
<script setup lang="ts">
import { trpc } from '@/utils/trpc'

// useAsyncData gère SSR + hydration + cache Nuxt
// La clé 'families' évite les requêtes dupliquées
const { data: families, pending, error } = await useAsyncData(
  'families',
  () => trpc.family.list.query()
)
// families.value est Ref<Family[] | null> — typé depuis AppRouter
</script>

<template>
  <div>
    <div v-if="pending">Chargement...</div>
    <div v-else-if="error">Erreur : {{ error.message }}</div>
    <ul v-else-if="families">
      <li v-for="f in families" :key="f.id">{{ f.name }}</li>
    </ul>
  </div>
</template>
```

---

## 4. Pièges & misconceptions

### PIÈGE #1 — `createTRPCProxyClient` (v10) vs `createTRPCClient` (v11)

```ts
// ❌ tRPC v10 — API obsolète dans les anciens tutoriels et l'ancienne source de cours
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
const trpc = createTRPCProxyClient<AppRouter>({ links: [...] })

// ✅ tRPC v11 — API actuelle
import { createTRPCClient, httpBatchLink } from '@trpc/client'
const trpc = createTRPCClient<AppRouter>({ links: [...] })
```

La sémantique d'appel (`.query()`, `.mutate()`) est identique. Seul le nom du créateur change. Si tu copies des exemples issus de documentation pre-2024, vérifie le nom de la factory.

### PIÈGE #2 — Importer le code serveur côté client

```ts
// ❌ Import runtime — le code serveur (Prisma, secrets DB) se retrouve dans le bundle
import { appRouter } from '../server/trpc/router'

// ✅ Import de type uniquement — TreeShaking complet, zéro code serveur dans le bundle
import type { AppRouter } from '../server/trpc/router'
```

Le mot-clé `import type` est obligatoire. Sans lui, Vite/Rollup peut inclure le code serveur dans le bundle client, exposant les connexions DB et les secrets.

### PIÈGE #3 — `.mutation()` appelé comme `.query()`

```ts
// ❌ Une mutation ne s'appelle pas .query()
await trpc.family.create.query({ name: 'Les Dupont' })   // TRPCClientError à l'exécution

// ✅ Les mutations s'appellent .mutate()
await trpc.family.create.mutate({ name: 'Les Dupont' })
```

TypeScript détecte cette erreur à la compilation — `.query()` n'existe pas sur une mutation. En pratique, l'autocomplétion IDE le signale immédiatement.

### PIÈGE #4 — Procédure sans `.input()` et inférence `unknown`

```ts
// ❌ Pas de .input() — TypeScript infère input comme unknown
byId: publicProcedure.query(({ input }) => {
  return families.find((f) => f.id === input)  // TS Error: input est unknown
})

// ✅ .input() déclare le type attendu
byId: publicProcedure
  .input(z.string().uuid())
  .query(({ input }) => {
    return families.find((f) => f.id === input)  // input est string — ok
  })
```

Sans `.input(zodSchema)`, `input` est `unknown` et toute utilisation déclenche une erreur TS. Zod est indispensable pour que l'inférence fonctionne.

### PIÈGE #5 — `ref([])` pour stocker le résultat d'une query typée

```ts
// ❌ TS infère Ref<never[]> — ne peut rien contenir
const families = ref([])

// ✅ Annoter avec le type dérivé du router
type Family = RouterOutputs['family']['list'][number]
const families = ref<Family[]>([])
```

Ce piège est identique au piège #1 du module 00 (typage Vue/TS). La règle est la même : `ref([])` sans annotation = `Ref<never[]>`. Annoter avec le type exact du router maintient la cohérence end-to-end.

---

## 5. Ancrage TribuZen

Dans TribuZen, tRPC est la couche de communication entre le frontend Vue/Nuxt et le backend Nitro. Deux domaines sont exposés comme routers :

**`familyRouter`** — procédures de gestion des familles :
- `family.list.query()` — liste des familles de l'utilisateur connecté
- `family.getById.query(id)` — détail d'une famille
- `family.create.mutate({ name })` — création d'une famille

**`invitationRouter`** — procédures d'invitation :
- `invitation.send.mutate({ familyId, email, role })` — envoi d'une invitation
- `invitation.accept.mutate({ token })` — acceptation via lien email
- `invitation.list.query({ familyId })` — liste des invitations en attente

Structure fichiers dans `smaurier/tribuzen` :

```
tribuzen/
  server/
    api/
      trpc/
        [trpc].ts                  ← Catch-all Nitro (fetchRequestHandler)
    trpc/
      trpc.ts                      ← initTRPC + publicProcedure
      router.ts                    ← appRouter + export type AppRouter
      routers/
        family.ts                  ← familyRouter
        invitation.ts              ← invitationRouter
  utils/
    trpc.ts                        ← createTRPCClient<AppRouter>
    trpc-types.ts                  ← RouterInputs, RouterOutputs
  components/
    family/
      FamilyPage.vue               ← consomme trpc.family.*
    invitation/
      InviteForm.vue               ← consomme trpc.invitation.send.mutate()
```

Les types `RouterOutputs['family']['list'][number]` et `RouterInputs['invitation']['send']` remplacent toutes les interfaces dupliquées qui existaient en approche REST. Un changement de procédure côté serveur propage immédiatement les erreurs de compilation dans tous les composants concernés.

---

## 6. Points clés

1. `export type AppRouter = typeof appRouter` est la seule ligne qui crée le pont de types entre serveur et client — tout découle de là.
2. Le client importe `AppRouter` avec `import type` — aucun code serveur dans le bundle client.
3. `.query()` pour les lectures, `.mutate()` pour les écritures — symétrique à GET/POST en sémantique.
4. `.input(zodSchema)` est double : validation runtime (TRPCError si invalide) + inférence de type (`input` est typé depuis le schéma).
5. `createTRPCClient` (v11) remplace `createTRPCProxyClient` (v10) — les appels `.query()` / `.mutate()` restent identiques.
6. Dans Nuxt, le catch-all `server/api/trpc/[trpc].ts` avec `fetchRequestHandler` expose le router sur `/api/trpc`.
7. `inferRouterOutputs<AppRouter>` et `inferRouterInputs<AppRouter>` dérivent les types de chaque procédure — utilisables pour annoter les `ref<>` Vue sans duplication.
8. tRPC est réservé aux projets fullstack TypeScript — si l'API doit être publique ou consommée par des clients non-TS, REST reste le standard.

---

## 7. Seeds Anki

```
Quelle ligne côté serveur crée le pont de types entre tRPC server et client ?|export type AppRouter = typeof appRouter — TypeScript infère le type complet du router depuis l'objet runtime.
Quelle est la différence entre .query() et .mutation() en tRPC ?|.query() pour les lectures idempotentes (sémantique GET), .mutation() pour les écritures (sémantique POST). Côté client : trpc.proc.query() vs trpc.proc.mutate().
Pourquoi utiliser import type AppRouter côté client ?|Pour n'importer que l'information de type sans inclure le code runtime serveur dans le bundle client. Sans type, le code DB et les secrets peuvent fuiter dans le bundle.
Que se passe-t-il si on omet .input(zodSchema) sur une procédure ?|input est de type unknown — TypeScript ne peut pas inférer le type. Toute utilisation de input déclenche une erreur TS. Zod est indispensable pour l'inférence.
Comment dériver le type de retour d'une procédure tRPC dans un composant Vue ?|Via inferRouterOutputs<AppRouter> depuis @trpc/server. Ex: type Family = RouterOutputs['family']['list'][number] — aucune interface à écrire manuellement.
Quelle est l'API correcte en tRPC v11 pour créer le client vanilla ?|createTRPCClient<AppRouter>({ links: [httpBatchLink({ url: '/api/trpc' })] }) — createTRPCProxyClient est l'ancienne API v10.
Comment intégrer tRPC dans un server route Nitro (Nuxt) ?|Créer server/api/trpc/[trpc].ts avec fetchRequestHandler de @trpc/server/adapters/fetch, en convertissant l'event H3 avec toWebRequest(event) (h3 1.13+, Nuxt 3.14+).
Quand choisir tRPC plutôt que REST ou GraphQL ?|tRPC quand on contrôle front et back en TypeScript (ex: Nuxt + Nitro). REST pour API publique ou clients non-TS. GraphQL pour données imbriquées complexes avec clients mobiles variés.
```

---

## Pont vers le lab

> Lab associé : `02-vue/labs/lab-37-trpc/README.md`. Tu implémentes le router `invitationRouter` complet (2 queries, 1 mutation) avec zod, tu exposes le handler Nitro et tu consommes les procédures depuis un composant Vue — corrigé commenté intégral et variante J+30 inclus.

← Précédent : [36-graphql-vue3](36-graphql-vue3.md)
