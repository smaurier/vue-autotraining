# Lab 37 — tRPC (router, procédures, client Vue)

> **Outcome :** à la fin, tu sais définir un router tRPC avec queries et mutations validées par zod, exposer le handler dans un server route Nitro, et consommer les procédures depuis un composant Vue avec inférence de types automatique.
> **Vrai outil :** tRPC 11 + zod + Nuxt 3 / Nitro (ou Vite + Express si hors Nuxt).
> **Feedback :** le coach valide en session — la preuve est que TypeScript compile sans erreur (`vue-tsc --noEmit`) et que les appels réseau aboutissent dans l'onglet Network du navigateur.

---

## Énoncé

Tu implémentes la couche API tRPC pour le module d'**invitations** de TribuZen. Une famille peut inviter des membres via email. L'API expose trois procédures :

1. `invitation.list` — query — liste les invitations d'une famille (filtre par `familyId`).
2. `invitation.getByToken` — query — récupère une invitation par son token (pour la page d'acceptation).
3. `invitation.send` — mutation — envoie une invitation (crée l'enregistrement, simule l'envoi email).

Tu exposes ensuite ces procédures via un handler Nitro et tu les consommes dans un composant `InviteForm.vue`.

**Contraintes :**
- Tout input doit être validé par un schéma zod.
- Le composant Vue ne duplique aucune interface — il utilise `RouterOutputs` et `RouterInputs`.
- `import type AppRouter` côté client — jamais d'import runtime du code serveur.

---

## Starter minimal

### Structure à créer

```
src/
  server/
    trpc/
      trpc.ts          ← à écrire
      router.ts        ← à écrire
      routers/
        invitation.ts  ← à écrire
    api/
      trpc/
        [trpc].ts      ← à écrire (Nuxt) ou server.ts (Vite+Express)
  utils/
    trpc.ts            ← à écrire
    trpc-types.ts      ← à écrire
  components/
    invitation/
      InviteForm.vue   ← à écrire
```

### Fichiers fournis (données en mémoire)

```ts
// Colle ce type et ce tableau dans server/trpc/routers/invitation.ts
// Simule une base de données en mémoire

export interface Invitation {
  id: string
  familyId: string
  email: string
  role: 'admin' | 'member'
  token: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
}

// Base en mémoire — dans un vrai projet, remplacer par Prisma/PostgreSQL
export const invitations: Invitation[] = []
```

### Schémas zod attendus (à implémenter)

```ts
// SendInvitationInput
// - familyId : string uuid
// - email : string email valide
// - role : 'admin' | 'member'

// ListInvitationsInput
// - familyId : string uuid

// GetByTokenInput
// - token : string (longueur minimale 10)
```

---

## Étapes (en friction)

1. **Initialise tRPC** dans `server/trpc/trpc.ts` — exporte `router` et `publicProcedure`.

2. **Définis les schémas zod** pour les trois inputs dans `invitation.ts`. Utilise `z.enum(['admin', 'member'])` pour le rôle.

3. **Implémente `invitationRouter`** avec les trois procédures. Pour `invitation.send` :
   - Génère un token avec `crypto.randomUUID()`
   - Crée l'invitation avec `status: 'pending'`
   - Retourne l'invitation créée (l'envoi email est simulé — log console)

4. **Assemble `appRouter`** dans `router.ts` et exporte `type AppRouter = typeof appRouter`.

5. **Crée le handler Nitro** dans `server/api/trpc/[trpc].ts` avec `fetchRequestHandler`.

6. **Crée le client** dans `utils/trpc.ts` avec `createTRPCClient` et `httpBatchLink` pointant sur `/api/trpc`.

7. **Exporte les types** dans `utils/trpc-types.ts` avec `inferRouterInputs` et `inferRouterOutputs`.

8. **Implémente `InviteForm.vue`** — un formulaire avec deux champs (`email`, `role` via select) et un bouton Inviter. Au submit, appelle `trpc.invitation.send.mutate(...)`. Affiche la liste des invitations envoyées en chargeant `trpc.invitation.list.query(...)` au montage.

9. **Vérifie avec TypeScript :** `vue-tsc --noEmit` (ou Volar dans l'IDE) doit être sans erreur. Teste dans le navigateur que le POST /api/trpc apparaît dans Network.

---

## Corrigé complet commenté

### `server/trpc/trpc.ts`

```ts
// Initialisation unique de tRPC — ne jamais appeler initTRPC.create() plusieurs fois
import { initTRPC } from '@trpc/server'

const t = initTRPC.create()

// Exporter les primitives pour les routers — pas l'instance t directement
export const router = t.router
export const publicProcedure = t.procedure
```

### `server/trpc/routers/invitation.ts`

```ts
import { z } from 'zod'
import { router, publicProcedure } from '../trpc'

// Type partagé dans ce fichier — en prod, vient de Prisma ou d'un fichier types/
interface Invitation {
  id: string
  familyId: string
  email: string
  role: 'admin' | 'member'
  token: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
}

// Base en mémoire — état local au module serveur
const invitations: Invitation[] = []

// Schémas Zod : source de vérité des contrats d'API
// z.string().uuid() valide le format UUID côté runtime
// z.string().email() valide le format email avec une regex RFC 5322
// z.enum() restreint à des valeurs précises ET infère l'union TypeScript
const SendInvitationInput = z.object({
  familyId: z.string().uuid(),
  email: z.string().email('Adresse email invalide'),
  role: z.enum(['admin', 'member']),
})

const ListInvitationsInput = z.object({
  familyId: z.string().uuid(),
})

const GetByTokenInput = z.object({
  token: z.string().min(10, 'Token trop court'),
})

export const invitationRouter = router({
  // QUERY — liste les invitations d'une famille
  // Filtre par familyId — l'input est garanti string (uuid validé)
  list: publicProcedure
    .input(ListInvitationsInput)
    .query(({ input }) => {
      // input.familyId : string — TS infère depuis ListInvitationsInput
      return invitations.filter((inv) => inv.familyId === input.familyId)
    }),

  // QUERY — récupère une invitation par token
  // Utilisé par la page /accept?token=... pour afficher le détail avant acceptation
  getByToken: publicProcedure
    .input(GetByTokenInput)
    .query(({ input }) => {
      const invitation = invitations.find((inv) => inv.token === input.token)
      // En tRPC, throw propagé comme TRPCError avec code INTERNAL_SERVER_ERROR
      // Pour un code précis : throw new TRPCError({ code: 'NOT_FOUND', message: '...' })
      if (!invitation) throw new Error(`Invitation avec token ${input.token} introuvable`)
      return invitation
    }),

  // MUTATION — envoie une invitation
  // Crée l'enregistrement + simule l'envoi email (log console)
  send: publicProcedure
    .input(SendInvitationInput)
    .mutation(({ input }) => {
      // input.familyId, input.email, input.role : tous typés depuis SendInvitationInput
      // crypto.randomUUID() disponible dans Node 14.17+ et tous les navigateurs modernes
      const invitation: Invitation = {
        id: crypto.randomUUID(),
        familyId: input.familyId,
        email: input.email,
        role: input.role,
        token: crypto.randomUUID(),    // Token d'acceptation unique
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
      invitations.push(invitation)

      // Simulation envoi email — en prod : appel SendGrid / Resend / etc.
      console.log(`[tRPC] Invitation envoyée à ${input.email} (token: ${invitation.token})`)

      return invitation
    }),
})
```

### `server/trpc/router.ts`

```ts
import { router } from './trpc'
import { invitationRouter } from './routers/invitation'

export const appRouter = router({
  invitation: invitationRouter,
  // Ajouter ici : family: familyRouter, user: userRouter, etc.
})

// Ce type EST tout le contrat d'API — ne jamais modifier cette ligne
// Les clients importent ce type, pas le code
export type AppRouter = typeof appRouter
```

### `server/api/trpc/[trpc].ts` (Nuxt / Nitro)

```ts
// Nitro catch-all : toute requête /api/trpc/* est routée ici
// fetchRequestHandler : adapter tRPC pour le modèle Request/Response standard
// toWebRequest : convertit l'event H3 (Nitro) en Request standard (Web API)
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { toWebRequest } from 'h3'
import { appRouter } from '~/server/trpc/router'

export default defineEventHandler((event) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',       // Doit correspondre à l'URL du client
    req: toWebRequest(event),    // Conversion H3 → Web Request (Nuxt 3.14+ / h3 1.13+)
    router: appRouter,
    createContext: () => ({}),   // Contexte vide — ajouter { session, db } plus tard
  })
})
```

### `utils/trpc.ts`

```ts
// createTRPCClient : API v11 (remplace createTRPCProxyClient de v10)
// httpBatchLink : groupe plusieurs appels simultanés en une seule requête HTTP
//                 Optimisation réseau gratuite — activer par défaut
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '~/server/trpc/router'   // import type — pas de code runtime

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
    }),
  ],
})
```

### `utils/trpc-types.ts`

```ts
// inferRouterInputs / inferRouterOutputs : mapped types récursifs de @trpc/server
// Ils parcourent le type AppRouter et extraient le type input/output de chaque procédure
// → Recoupe les mapped types conditionnels du cours TypeScript (modules 07-09)
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '~/server/trpc/router'

export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>

// Exemples des types dérivés (documentation inline) :
// RouterInputs['invitation']['send']      → { familyId: string, email: string, role: 'admin' | 'member' }
// RouterOutputs['invitation']['list']     → Invitation[]
// RouterOutputs['invitation']['getByToken'] → Invitation
```

### `components/invitation/InviteForm.vue`

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { trpc } from '@/utils/trpc'
import type { RouterInputs, RouterOutputs } from '@/utils/trpc-types'

// Types dérivés automatiquement — aucune interface dupliquée
type Invitation = RouterOutputs['invitation']['list'][number]
type SendInput = RouterInputs['invitation']['send']

// Props — en vrai produit, familyId vient du contexte de la page
const props = defineProps<{ familyId: string }>()

// État du formulaire — typé depuis SendInput pour cohérence totale
const form = ref<Omit<SendInput, 'familyId'>>({
  email: '',
  role: 'member',
})

const invitations = ref<Invitation[]>([])
const sending = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

// Charge la liste des invitations existantes au montage
async function loadInvitations(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    // TypeScript vérifie que familyId est bien un string (uuid attendu par zod)
    invitations.value = await trpc.invitation.list.query({
      familyId: props.familyId,
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erreur de chargement'
  } finally {
    loading.value = false
  }
}

// Envoie l'invitation et met à jour la liste locale
async function sendInvitation(): Promise<void> {
  if (!form.value.email.trim()) return
  sending.value = true
  error.value = null
  success.value = null
  try {
    const created = await trpc.invitation.send.mutate({
      familyId: props.familyId,    // string (uuid) — vérifié par zod côté serveur
      email: form.value.email,     // string email — validé par zod côté serveur
      role: form.value.role,       // 'admin' | 'member' — TS vérifie le type ici
    })
    // created est typé comme Invitation — pas de cast nécessaire
    invitations.value.push(created)
    success.value = `Invitation envoyée à ${created.email}`
    form.value.email = ''
    form.value.role = 'member'
  } catch (e) {
    // TRPCError (zod invalide, erreur serveur) capturé ici
    error.value = e instanceof Error ? e.message : 'Erreur d\'envoi'
  } finally {
    sending.value = false
  }
}

onMounted(loadInvitations)
</script>

<template>
  <div class="invite-form">
    <h2>Inviter un membre</h2>

    <!-- Feedback erreur / succès -->
    <p v-if="error" class="feedback feedback--error">{{ error }}</p>
    <p v-if="success" class="feedback feedback--success">{{ success }}</p>

    <!-- Formulaire d'invitation -->
    <form @submit.prevent="sendInvitation">
      <label>
        Email
        <input
          v-model="form.email"
          type="email"
          placeholder="alice@famille.fr"
          :disabled="sending"
          required
        />
      </label>

      <label>
        Rôle
        <!-- select typé : seuls 'admin' et 'member' sont des options valides -->
        <select v-model="form.role" :disabled="sending">
          <option value="member">Membre</option>
          <option value="admin">Admin</option>
        </select>
      </label>

      <button type="submit" :disabled="sending || !form.email.trim()">
        {{ sending ? 'Envoi...' : 'Inviter' }}
      </button>
    </form>

    <!-- Liste des invitations en attente -->
    <section class="invitations-list">
      <h3>Invitations envoyées</h3>
      <div v-if="loading">Chargement...</div>
      <p v-else-if="invitations.length === 0">Aucune invitation pour l'instant.</p>
      <ul v-else>
        <li v-for="inv in invitations" :key="inv.id">
          {{ inv.email }}
          <span class="badge badge--role">{{ inv.role }}</span>
          <span class="badge" :class="`badge--${inv.status}`">{{ inv.status }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.invite-form {
  max-width: 480px;
}

label {
  display: block;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
}

input,
select {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  padding: 0.4rem 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
}

button {
  margin-top: 0.5rem;
  padding: 0.45rem 1rem;
  background: #1e293b;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.feedback {
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
}

.feedback--error {
  background: #fee2e2;
  color: #991b1b;
}

.feedback--success {
  background: #dcfce7;
  color: #166534;
}

.invitations-list {
  margin-top: 1.5rem;
}

.badge {
  display: inline-block;
  margin-left: 0.4rem;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.badge--role {
  background: #e0f2fe;
  color: #075985;
}

.badge--pending {
  background: #fef9c3;
  color: #854d0e;
}

.badge--accepted {
  background: #dcfce7;
  color: #166534;
}

.badge--declined {
  background: #fee2e2;
  color: #991b1b;
}
</style>
```

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — reproduis de mémoire en 30 minutes :**

1. Ajoute une quatrième procédure `invitation.cancel` — mutation qui prend `{ id: string }` et passe le statut de l'invitation à `'declined'`. Lance une erreur si l'invitation n'est pas trouvée ou si son statut n'est pas `'pending'`.

2. Dans `InviteForm.vue`, ajoute un bouton Annuler sur chaque invitation `pending`. Au clic, appelle `trpc.invitation.cancel.mutate({ id: inv.id })` et met à jour la liste locale.

3. **Sans ouvrir ce corrigé.**

**Critère de réussite :** `vue-tsc --noEmit` sans erreur. Le statut de l'invitation passe à `'declined'` dans la liste affichée. TypeScript refuse `trpc.invitation.cancel.query(...)` (c'est une mutation, pas une query).

---

## Application TribuZen

Dans `smaurier/tribuzen`, ce lab s'applique directement :

**Fichiers à créer ou modifier :**

```
tribuzen/
  server/
    api/trpc/[trpc].ts        ← handler Nitro (lab étape 5)
    trpc/
      trpc.ts                 ← initTRPC (lab étape 1)
      router.ts               ← appRouter + AppRouter (lab étape 4)
      routers/invitation.ts   ← invitationRouter (lab étape 3)
  utils/
    trpc.ts                   ← createTRPCClient (lab étape 6)
    trpc-types.ts             ← RouterInputs/Outputs (lab étape 7)
  components/invitation/
    InviteForm.vue            ← composant Vue (lab étape 8)
```

**Différences par rapport au lab :**
- `createContext` inclura la session Nuxt (via `useAuth()` ou `getServerSession`) pour identifier l'utilisateur connecté.
- La base en mémoire sera remplacée par des appels Prisma (table `Invitation` — module PostgreSQL).
- `InviteForm.vue` recevra `familyId` comme prop depuis `FamilyPage.vue` via `defineProps`.

**Commit cible :**
```
feat(invitation): tRPC router invitation — list/getByToken/send + handler Nitro + InviteForm
```
