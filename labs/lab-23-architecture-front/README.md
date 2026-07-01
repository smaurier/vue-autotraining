# Lab 23 — Architecture front

> **Outcome :** à la fin, tu sais migrer une codebase Vue plate (organisation type-based) vers une architecture feature-based avec couches composables/services séparées et barrel files — et tu sais expliquer pourquoi chaque fichier est où.
> **Vrai outil :** Vue 3.5 + Vite + vue-tsc (oracle de type) + lecture des imports pour détection de violations de frontières.
> **Feedback :** le coach valide l'arborescence et les imports en session — pas de test-runner auto-correcteur.

---

## Énoncé

On te donne une codebase TribuZen plate. Elle fonctionne, mais elle n'est pas structurée. Ton travail est de la **refactorer** vers l'architecture feature-based vue dans le module 23, **sans changer le comportement**.

### Codebase de départ

Crée ce projet dans ton dossier de travail (`pnpm create vite tribuzen-arch --template vue-ts`), puis reproduis cette structure plate à la main :

```
src/
  components/
    FamilyCard.vue
    FamilyList.vue
    FeedPost.vue
    FeedList.vue
    InvitationModal.vue
    AppButton.vue
    AppInput.vue
  composables/
    useFamily.ts
    useFeed.ts
    useInvitation.ts
    useAuth.ts
  stores/
    family.ts
    feed.ts
    auth.ts
  services/
    familyService.ts
    feedService.ts
    invitationService.ts
    authService.ts
  types/
    family.ts
    feed.ts
    invitation.ts
    common.ts
  App.vue
  main.ts
```

**Contenu minimal des fichiers stubs** (à copier tels quels — pas à modifier) :

```ts
// src/types/family.ts
export interface Family {
  id: string
  name: string
  members: Member[]
}
export interface Member {
  id: string
  name: string
  role: 'admin' | 'member'
}
export interface CreateFamilyDto {
  name: string
}
```

```ts
// src/types/feed.ts
export interface Post {
  id: string
  familyId: string
  content: string
  authorId: string
  createdAt: string
}
```

```ts
// src/types/invitation.ts
export interface Invitation {
  id: string
  familyId: string
  link: string
  expiresAt: string
}
```

```ts
// src/types/common.ts
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
}
export interface ApiError {
  message: string
  code: string
}
```

```ts
// src/services/familyService.ts
import type { Family, CreateFamilyDto } from '../types/family'
const BASE = '/api/families'
export const familyService = {
  async getById(id: string): Promise<Family> {
    const res = await fetch(`${BASE}/${id}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<Family>
  },
  async getMine(): Promise<Family[]> {
    const res = await fetch(`${BASE}/mine`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<Family[]>
  },
  async create(dto: CreateFamilyDto): Promise<Family> {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<Family>
  },
}
```

```ts
// src/services/feedService.ts
import type { Post } from '../types/feed'
import type { PaginatedResponse } from '../types/common'
const BASE = '/api/posts'
export const feedService = {
  async getByFamily(familyId: string, page = 1): Promise<PaginatedResponse<Post>> {
    const res = await fetch(`${BASE}?familyId=${familyId}&page=${page}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<PaginatedResponse<Post>>
  },
}
```

```ts
// src/services/invitationService.ts
import type { Invitation } from '../types/invitation'
const BASE = '/api/invitations'
export const invitationService = {
  async create(familyId: string): Promise<Invitation> {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ familyId }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<Invitation>
  },
}
```

```ts
// src/composables/useFamily.ts
import { ref } from 'vue'
import { familyService } from '../services/familyService'
import type { Family } from '../types/family'

export function useFamily() {
  const families = ref<Family[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadMine(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      families.value = await familyService.getMine()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur inconnue'
    } finally {
      loading.value = false
    }
  }

  return { families, loading, error, loadMine }
}
```

```ts
// src/composables/useFeed.ts
import { ref } from 'vue'
import { feedService } from '../services/feedService'
import type { Post } from '../types/feed'

export function useFeed(familyId: string) {
  const posts = ref<Post[]>([])
  const loading = ref(false)
  const page = ref(1)

  async function load(): Promise<void> {
    loading.value = true
    try {
      const res = await feedService.getByFamily(familyId, page.value)
      posts.value = res.data
    } finally {
      loading.value = false
    }
  }

  return { posts, loading, page, load }
}
```

```ts
// src/composables/useInvitation.ts
import { ref } from 'vue'
import { invitationService } from '../services/invitationService'
import type { Invitation } from '../types/invitation'

export function useInvitation() {
  const invitation = ref<Invitation | null>(null)
  const loading = ref(false)

  async function generate(familyId: string): Promise<void> {
    loading.value = true
    try {
      invitation.value = await invitationService.create(familyId)
    } finally {
      loading.value = false
    }
  }

  return { invitation, loading, generate }
}
```

```vue
<!-- src/components/AppButton.vue -->
<script setup lang="ts">
defineProps<{ label: string; variant?: 'primary' | 'secondary'; disabled?: boolean }>()
defineEmits<{ click: [] }>()
</script>
<template>
  <button
    :class="['app-btn', `app-btn--${variant ?? 'primary'}`]"
    :disabled="disabled"
    @click="$emit('click')"
  >{{ label }}</button>
</template>
<style scoped>
.app-btn { padding: 0.5rem 1rem; border-radius: 0.25rem; border: none; cursor: pointer; }
.app-btn--primary { background: #4f46e5; color: #fff; }
.app-btn--secondary { background: #e2e8f0; color: #1e293b; }
</style>
```

```vue
<!-- src/components/FamilyCard.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useFamily } from '../composables/useFamily'
const { families, loading, loadMine } = useFamily()
onMounted(loadMine)
</script>
<template>
  <div>
    <p v-if="loading">Chargement…</p>
    <ul v-else>
      <li v-for="f in families" :key="f.id">{{ f.name }}</li>
    </ul>
  </div>
</template>
```

Lance `pnpm dev` — l'app doit compiler sans erreur TypeScript (`vue-tsc --noEmit`).

---

## Étapes (en friction)

1. **Analyse les imports actuels.** Pour chaque fichier dans `src/`, note ce qu'il importe et depuis où. Repère les imports qui franchissent des domaines différents (`useFeed` importe-t-il quelque chose de `family` ? `FamilyCard` importe-t-il depuis `types/feed.ts` ?).

2. **Crée la structure cible.** Sans déplacer encore les fichiers, crée les dossiers vides :
   ```
   src/features/auth/
   src/features/family/components/ composables/ services/ stores/
   src/features/feed/components/ composables/ services/ stores/
   src/features/invitation/components/ composables/ services/
   src/shared/components/ composables/ styles/ types/
   ```

3. **Migre `shared/` en premier.** Déplace `AppButton.vue` et `AppInput.vue` vers `src/shared/components/`. Déplace `types/common.ts` vers `src/shared/types/common.ts`. Mets à jour tous les imports qui pointaient vers ces fichiers.

4. **Migre la feature `family`.** Déplace dans l'ordre : `types/family.ts` → `features/family/types.ts`, `services/familyService.ts` → `features/family/services/familyService.ts`, `composables/useFamily.ts` → `features/family/composables/useFamily.ts`, `components/FamilyCard.vue` et `FamilyList.vue` → `features/family/components/`. Corrige tous les chemins d'import au fur et à mesure. Lance `vue-tsc --noEmit` après chaque déplacement.

5. **Migre les features `feed` et `invitation`.** Même process. Attention : `useFeed.ts` importe depuis `feedService` — le chemin relatif change.

6. **Crée les barrel files.** Pour chaque feature, crée un `index.ts` qui ré-exporte les composants, composables et types (pas les services). Utilise des exports nommés, jamais `export *`.

7. **Vérifie les frontières.** Lis chaque fichier dans `features/family/` — aucun ne doit importer depuis `features/feed/` ou `features/invitation/`. Si c'est le cas, la donnée partagée doit aller dans `shared/types/common.ts`.

8. **Validation finale.** Lance `vue-tsc --noEmit` — zéro erreur. Ouvre `pnpm dev` — l'app fonctionne. Vérifie que `App.vue` importe maintenant depuis les barrels (`@/features/family`) plutôt que depuis les chemins internes.

---

## Corrigé complet commenté

### Structure finale attendue

```
src/
  features/
    family/
      components/
        FamilyCard.vue
        FamilyList.vue
      composables/
        useFamily.ts
      services/
        familyService.ts
      types.ts
      index.ts

    feed/
      components/
        FeedPost.vue
        FeedList.vue
      composables/
        useFeed.ts
      services/
        feedService.ts
      types.ts
      index.ts

    invitation/
      components/
        InvitationModal.vue
      composables/
        useInvitation.ts
      services/
        invitationService.ts
      types.ts
      index.ts

  shared/
    components/
      AppButton.vue
      AppInput.vue
    styles/
      tokens.css
    types/
      common.ts

  App.vue
  main.ts
```

### Barrel `features/family/index.ts`

```ts
// features/family/index.ts
// Ce fichier est la surface publique de la feature family.
// Les consommateurs extérieurs n'importent QUE depuis ici.
// Les services ne sont pas exportés — ils sont des détails d'implémentation.

export { default as FamilyCard } from './components/FamilyCard.vue'
export { default as FamilyList } from './components/FamilyList.vue'
export { useFamily } from './composables/useFamily'
export type { Family, Member, CreateFamilyDto } from './types'
```

### Barrel `features/feed/index.ts`

```ts
// features/feed/index.ts
export { default as FeedPost } from './components/FeedPost.vue'
export { default as FeedList } from './components/FeedList.vue'
export { useFeed } from './composables/useFeed'
export type { Post } from './types'
```

### Barrel `features/invitation/index.ts`

```ts
// features/invitation/index.ts
export { default as InvitationModal } from './components/InvitationModal.vue'
export { useInvitation } from './composables/useInvitation'
export type { Invitation } from './types'
```

### `features/family/composables/useFamily.ts` après migration

```ts
// Le chemin relatif change — le contenu logique reste identique
// Avant : import { familyService } from '../services/familyService'
// Après migration dans la feature :
import { ref } from 'vue'
import { familyService } from '../services/familyService'
// ↑ chemin relatif interne à la feature — correct
import type { Family } from '../types'
// ↑ types.ts est dans le même dossier features/family/ — pas d'import cross-feature

export function useFamily() {
  const families = ref<Family[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadMine(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      families.value = await familyService.getMine()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur inconnue'
    } finally {
      loading.value = false
    }
  }

  return { families, loading, error, loadMine }
}
```

### `App.vue` après migration (import via barrel)

```vue
<script setup lang="ts">
// ✅ Imports via barrels — pas de chemins internes exposés
import { FamilyCard, FamilyList } from '@/features/family'
import { FeedList } from '@/features/feed'
import { InvitationModal } from '@/features/invitation'
import { AppButton } from '@/shared/components/AppButton.vue'
</script>

<template>
  <main>
    <FamilyList />
    <FeedList />
  </main>
</template>
```

### `shared/styles/tokens.css` (à créer)

```css
/* shared/styles/tokens.css — variables partagées par toutes les features */
:root {
  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;
  --color-danger: #ef4444;
  --color-border: #e2e8f0;
  --color-text-muted: #94a3b8;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --radius-card: 0.5rem;
  --radius-btn: 0.25rem;
}
```

### Validation — commande oracle

```bash
# Vérifie les types après la migration — doit retourner 0 erreur
pnpm vue-tsc --noEmit

# Vérifie qu'aucune feature n'importe depuis une autre feature
# (recherche manuelle ou via eslint-plugin-import si configuré)
grep -r "from '@/features/feed'" src/features/family/
# → doit retourner vide

grep -r "from '@/features/family'" src/features/feed/
# → doit retourner vide (sauf si useFamilyStore est consommé — store autorisé)
```

**Pourquoi ce corrigé est correct :**

- Chaque feature est un module avec ses propres types, services, composables et composants. On peut supprimer `features/invitation/` sans toucher `features/family/`.
- Les barrel files n'exportent pas les services — ce sont des détails d'implémentation. Changer l'URL de l'API ou la lib HTTP ne casse aucun consommateur extérieur.
- `shared/types/common.ts` contient `PaginatedResponse<T>` et `ApiError` — types génériques sans lien à un domaine métier. Si `feedService` et `familyService` en ont besoin, ils importent depuis `@/shared/types/common`.
- Les tokens CSS dans `shared/styles/tokens.css` sont importés dans `main.ts` une seule fois — tous les composants de features y accèdent via les variables CSS sans import supplémentaire.

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées :**

Recrée la structure feature-based TribuZen **de mémoire, en 30 minutes**, pour une nouvelle feature `notifications/` qui n'existait pas :

1. Crée `features/notifications/` avec les couches types, services, composables, components.
2. Le type `Notification` a les champs `id`, `userId`, `type` (`'invitation' | 'post' | 'member_join'`), `readAt` (`string | null`), `createdAt`.
3. `notificationService.getUnread()` retourne `Notification[]`.
4. `useNotifications()` expose `notifications`, `loading`, `unreadCount` (computed), `load()`.
5. `NotificationBell.vue` affiche le badge avec le compteur — il consomme `useNotifications`.
6. Crée le barrel `features/notifications/index.ts`.
7. `shared/types/common.ts` doit contenir `Notification` ou `features/notifications/types.ts` ? Justifie.

**Sans ouvrir ce corrigé ni le module 23.**

**Critère de réussite :** `vue-tsc --noEmit` passe, aucune feature n'importe depuis une autre feature (grep le vérifie), le barrel n'utilise pas `export *`.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, cette migration correspond au refactor structurel de la codebase initiale :

```
tribuzen/src/
  features/
    family/
      components/FamilyCard.vue     ← module 05 (props/emits) + lab 05
      composables/useFamilyDetail.ts ← module 09 (composables) + lab 09
      services/familyService.ts      ← lab 10 (gestion async)
      stores/family.ts               ← module 15 (Pinia) + lab 15
      index.ts                       ← ce lab
    feed/
      [idem family]
    invitation/
      [idem sans store]
  shared/
    components/AppButton.vue         ← lab 05 (design system)
    styles/tokens.css                ← ce lab
    types/common.ts                  ← ce lab
```

**Différences par rapport au lab :**

- En production, les stores Pinia (`features/family/stores/family.ts`, `features/auth/stores/auth.ts`) sont initialisés dans `main.ts` avec `createPinia()` — le lab les stub.
- Les imports `@/features/*` nécessitent un alias Vite configuré dans `vite.config.ts` (`resolve.alias: { '@': path.resolve(__dirname, 'src') }`).
- Le design system TribuZen utilisera un fichier de tokens plus riche (dark mode, breakpoints) — le lab pose la base.

**Commit cible :**

```
refactor(arch): migrate to feature-based structure — family/feed/invitation/shared
```
