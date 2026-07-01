# Lab 46 — TanStack Query (Vue Query)

> **Outcome :** à la fin, tu sais charger du server state avec `useQuery` (cache, staleTime, états), déclencher une mutation avec `useMutation`, et invalider le cache pour synchroniser automatiquement les composants concernés.
> **Vrai outil :** `@tanstack/vue-query` v5 + Vite dev server.
> **Feedback :** le coach valide visuellement en session — pas de test-runner auto-correcteur.

---

## Énoncé

Tu construis deux composables et deux composants pour le front-office TribuZen :

1. **`useFeedQuery`** — charge la liste des familles du feed via `useQuery`.
2. **`useInviteMutation`** — envoie une invitation via `useMutation` et invalide le cache du feed.
3. **`FeedPage.vue`** — affiche le feed avec gestion des états `isPending`, `isError`, `isFetching`.
4. **`InviteForm.vue`** — formulaire d'invitation qui déclenche la mutation.

**L'API est simulée avec MSW ou des fonctions locales** (voir starter ci-dessous). Pas besoin d'un vrai backend.

### Contrat d'API (à simuler)

```ts
// GET /api/families/feed → FeedFamily[]
interface FeedFamily {
  id: string
  name: string
  memberCount: number
  lastActivity: string   // ISO date string
}

// POST /api/invitations → InviteResponse
// Body: { familyId: string, inviteeEmail: string }
interface InviteResponse {
  invitationId: string
  status: 'pending' | 'sent'
}
```

### Starter minimal

Crée un projet Vite + Vue 3 (ou utilise celui du cours) avec `@tanstack/vue-query` installé.

```bash
pnpm add @tanstack/vue-query @tanstack/vue-query-devtools
```

**`main.ts` :**

```ts
import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'

const app = createApp(App)
app.use(VueQueryPlugin)
app.mount('#app')
```

**Fonctions fetch simulées à copier dans `src/api/feed.ts` :**

```ts
// src/api/feed.ts — simulation de l'API (pas de vrai serveur requis)
export interface FeedFamily {
  id: string
  name: string
  memberCount: number
  lastActivity: string
}

export interface InvitePayload {
  familyId: string
  inviteeEmail: string
}

export interface InviteResponse {
  invitationId: string
  status: 'pending' | 'sent'
}

// Simule un délai réseau de 800ms
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

let familyStore: FeedFamily[] = [
  { id: 'fam-001', name: 'Famille Martin', memberCount: 4, lastActivity: '2026-06-30T10:00:00Z' },
  { id: 'fam-002', name: 'Famille Dupont', memberCount: 2, lastActivity: '2026-06-29T14:30:00Z' },
]

export async function fetchFeed(): Promise<FeedFamily[]> {
  await delay(800)
  // Simule une erreur aléatoire 10% du temps — pour tester isError et retry
  if (Math.random() < 0.1) throw new Error('Erreur réseau simulée')
  return [...familyStore]
}

export async function postInvitation(payload: InvitePayload): Promise<InviteResponse> {
  await delay(600)
  // Simule l'ajout d'une famille après invitation
  familyStore.push({
    id: `fam-${Date.now()}`,
    name: `Famille de ${payload.inviteeEmail.split('@')[0]}`,
    memberCount: 1,
    lastActivity: new Date().toISOString(),
  })
  return { invitationId: `inv-${Date.now()}`, status: 'sent' }
}
```

**Structure à créer :**

```
src/
  api/
    feed.ts              ← starter fourni ci-dessus
  composables/
    useFeedQuery.ts      ← À écrire (étape 1)
    useInviteMutation.ts ← À écrire (étape 2)
  pages/
    FeedPage.vue         ← À écrire (étape 3)
  components/
    InviteForm.vue       ← À écrire (étape 4)
  App.vue                ← monter FeedPage + InviteForm
```

---

## Étapes (en friction)

1. **Écris `useFeedQuery.ts`** — `useQuery` avec `queryKey: ['families', 'feed']`, `queryFn: fetchFeed`, `staleTime: 30_000`. Exporte aussi un objet `familyKeys` avec les factories de clés.

2. **Écris `useInviteMutation.ts`** — `useMutation` avec `mutationFn: postInvitation`. Dans `onSuccess`, appelle `queryClient.invalidateQueries({ queryKey: familyKeys.feed() })`.

3. **Écris `FeedPage.vue`** — consomme `useFeedQuery()`. Affiche un loader sur `isPending`, un message d'erreur sur `isError`, la liste sur `data`. Ajoute un indicateur discret de rechargement sur `isFetching && !isPending`.

4. **Écris `InviteForm.vue`** — consomme `useInviteMutation()`. Un `<input type="email">` lié à une `ref<string>`, un `<button>` désactivé sur `isPending`. Affiche un message de succès sur `isSuccess`, d'erreur sur `isError`.

5. **Teste le flux complet dans le navigateur :** lance `pnpm dev`, ouvre les devtools Vue Query, vérifie que le cache passe en `fresh` → `stale` → que l'invalidation après mutation force un refetch.

6. **Vérifie les cas limites :** recharge la page (cache vide → `isPending` visible) — change d'onglet et reviens (background refetch déclenché) — patiente que l'erreur simulée (10% du temps) se produise et compte les tentatives de retry dans les devtools.

---

## Corrigé complet commenté

### `src/composables/useFeedQuery.ts`

```ts
import { useQuery } from '@tanstack/vue-query'
import { fetchFeed } from '@/api/feed'

// Factory de clés centralisée — partager avec useMutation garantit la cohérence
// as const = TypeScript verrouille le type littéral, évite les comparaisons instables
export const familyKeys = {
  all:    () => ['families'] as const,
  feed:   () => ['families', 'feed'] as const,
  detail: (id: string) => ['families', id] as const,
}

export function useFeedQuery() {
  return useQuery({
    queryKey: familyKeys.feed(),   // identifiant stable dans le cache

    queryFn: fetchFeed,            // la fonction qui charge les données

    staleTime: 30_000,             // fraîcheur 30 secondes — pas de refetch si données récentes

    // gcTime par défaut = 5 min : les données restent en mémoire 5 min
    // après que FeedPage est démonté, pour une navigation rapide suivante

    retry: 3,                      // 3 tentatives automatiques avant isError

    refetchOnWindowFocus: true,    // refetch au retour sur l'onglet (comportement par défaut)
  })
}
```

### `src/composables/useInviteMutation.ts`

```ts
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { postInvitation } from '@/api/feed'
import { familyKeys } from './useFeedQuery'

export function useInviteMutation() {
  // useQueryClient() donne accès au cache global créé par VueQueryPlugin
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: postInvitation,   // la fonction qui envoie la requête POST

    onSuccess: () => {
      // Invalide toutes les queries dont la clé commence par ['families', 'feed']
      // → Vue Query déclenche immédiatement un refetch de useFeedQuery
      // → FeedPage.vue se met à jour automatiquement, sans code supplémentaire
      queryClient.invalidateQueries({ queryKey: familyKeys.feed() })
    },

    onError: (err) => {
      // err est de type Error — Vue Query garantit que mutationFn rejette avec Error
      console.error('[useInviteMutation] Erreur :', err.message)
    },
  })
}
```

### `src/pages/FeedPage.vue`

```vue
<script setup lang="ts">
import { useFeedQuery } from '@/composables/useFeedQuery'

// Déstructure exactement ce dont le template a besoin
// Renommer data → families pour la lisibilité
const {
  data: families,
  isPending,    // premier chargement, pas de données en cache
  isFetching,   // toute requête en cours, y compris background
  isError,
  error,
} = useFeedQuery()
</script>

<template>
  <div class="feed-page">
    <header class="feed-header">
      <h1>Feed TribuZen</h1>

      <!--
        Indicateur discret de background update :
        isFetching && !isPending = on a déjà des données mais une requête tourne
        → on n'écrase pas le contenu avec un spinner, on affiche juste un bandeau léger
      -->
      <span v-if="isFetching && !isPending" class="refresh-badge">
        Actualisation…
      </span>
    </header>

    <!--
      isPending = true uniquement au premier chargement (pas de données en cache)
      → skeleton ou spinner plein écran justifié ici
    -->
    <div v-if="isPending" class="state-loading">
      Chargement du feed…
    </div>

    <!--
      isError = true quand retry (3 par défaut) est épuisé
      error est de type Error (non-null quand isError est true)
    -->
    <div v-else-if="isError" class="state-error">
      Erreur — {{ error?.message }}
    </div>

    <!--
      v-else : données disponibles (families est FeedFamily[], non undefined ici)
      Vue Query garantit que data est défini quand isError et isPending sont false
    -->
    <ul v-else class="feed-list">
      <li
        v-for="family in families"
        :key="family.id"
        class="feed-item"
      >
        <strong>{{ family.name }}</strong>
        <span class="meta">{{ family.memberCount }} membre(s)</span>
        <time class="meta">{{ new Date(family.lastActivity).toLocaleDateString('fr-FR') }}</time>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.feed-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.refresh-badge {
  font-size: 0.8rem;
  color: #64748b;
  font-style: italic;
}

.state-loading,
.state-error {
  padding: 2rem;
  text-align: center;
  color: #64748b;
}

.state-error {
  color: #ef4444;
}

.feed-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.feed-item {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.meta {
  font-size: 0.85rem;
  color: #94a3b8;
}
</style>
```

### `src/components/InviteForm.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useInviteMutation } from '@/composables/useInviteMutation'

const props = defineProps<{ familyId: string }>()

const email = ref('')

const {
  mutate: invite,
  isPending,   // mutation en cours (POST en vol)
  isError,
  error,
  isSuccess,
  reset,       // réinitialise isSuccess/isError pour permettre un nouvel essai
} = useInviteMutation()

function submit() {
  if (!email.value) return

  invite(
    { familyId: props.familyId, inviteeEmail: email.value },
    {
      // Callback local — s'exécute EN PLUS de onSuccess défini dans useInviteMutation
      // Utile pour des effets locaux au composant (vider le champ, naviguer…)
      onSuccess: () => {
        email.value = ''      // vide le champ après succès
      },
    }
  )
}
</script>

<template>
  <form class="invite-form" @submit.prevent="submit">
    <label for="invite-email">Email de l'invité</label>
    <input
      id="invite-email"
      v-model="email"
      type="email"
      placeholder="alice@exemple.fr"
      :disabled="isPending"
    />

    <button
      type="submit"
      :disabled="isPending || !email"
    >
      {{ isPending ? 'Envoi en cours…' : 'Inviter' }}
    </button>

    <!-- Messages de feedback -->
    <p v-if="isSuccess" class="msg-success">
      Invitation envoyée ! Le feed va se mettre à jour automatiquement.
    </p>
    <p v-if="isError" class="msg-error">
      {{ error?.message ?? 'Erreur lors de l'envoi' }}
      <button type="button" class="btn-retry" @click="reset">Réessayer</button>
    </p>
  </form>
</template>

<style scoped>
.invite-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
}

input {
  padding: 0.4rem 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 1rem;
}

input:disabled {
  background: #f1f5f9;
  color: #94a3b8;
}

button[type="submit"] {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button[type="submit"]:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.msg-success { color: #16a34a; }
.msg-error   { color: #dc2626; display: flex; align-items: center; gap: 0.5rem; }
.btn-retry   { background: none; border: 1px solid #dc2626; color: #dc2626; border-radius: 4px; padding: 0.1rem 0.4rem; cursor: pointer; }
</style>
```

### `src/App.vue` (pour le lab)

```vue
<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import FeedPage from '@/pages/FeedPage.vue'
import InviteForm from '@/components/InviteForm.vue'
</script>

<template>
  <main style="max-width: 600px; margin: 2rem auto; padding: 0 1rem;">
    <InviteForm family-id="fam-001" />
    <hr style="margin: 2rem 0;" />
    <FeedPage />
  </main>

  <!-- Devtools uniquement en développement — tree-shaken en production -->
  <VueQueryDevtools />
</template>
```

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — de mémoire, en 30 minutes :**

1. Ajoute un `useQuery` pour charger le **détail d'une famille** par ID — `queryKey: ['families', familyId]` avec `familyId` comme `Ref<string>`.
2. La query doit être **désactivée si `familyId.value` est vide** — utilise l'option `enabled: computed(() => familyId.value.length > 0)`.
3. L'invalidation après invitation doit aussi invalider le détail de la famille concernée — `queryClient.invalidateQueries({ queryKey: familyKeys.detail(variables.familyId) })`.
4. **Sans ouvrir ce corrigé.**

**Critère de réussite :** les devtools Vue Query montrent deux queries distinctes (`['families', 'feed']` et `['families', 'fam-001']`), et les deux passent en `stale` après invalidation.

---

## Application TribuZen

Dans `smaurier/tribuzen`, les fichiers créés dans ce lab correspondent directement aux fichiers de production :

```
tribuzen/
  src/
    composables/
      useFeedQuery.ts          ← identique, staleTime ajusté selon les besoins produit
      useInviteMutation.ts     ← identique, onSuccess invalide feed + invitations
    pages/
      FeedPage.vue             ← identique, styles remplacés par les tokens du design system
    components/
      family/
        InviteForm.vue         ← identique, intégré dans FamilyDetailPage
```

**Différences par rapport au lab :**
- `fetchFeed` et `postInvitation` appellent le vrai backend NestJS (pas de simulation).
- `FeedPage.vue` utilise un composant `FamilyCard.vue` (module 05) plutôt qu'un `<li>` brut.
- `InviteForm.vue` reçoit `familyId` depuis `useRoute()` (module 14 — Vue Router).

**Commit cible :**

```
feat(feed): useFeedQuery + useInviteMutation — cache server state TribuZen
```
