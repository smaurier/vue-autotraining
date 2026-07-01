---
titre: Architecture front
cours: 02-vue
notions: [organisation par fonctionnalité feature-based, couche composables et couche services, séparation UI et logique métier, gestion d'état locale vs globale, frontières de modules et dépendances, design system et composants partagés, conventions de nommage et barrels, scalabilité d'une codebase Vue]
outcomes:
  - sait structurer une app Vue par fonctionnalité (feature-based) et non par type
  - sait séparer UI, logique réactive (composables) et accès données (services)
  - sait décider état local vs global et poser des frontières de modules
  - sait faire évoluer une codebase sans qu'elle devienne ingérable
prerequis: [22-ssr-et-hydration]
next: 24-patterns-entreprise
libs: [{ name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — structurer le code par features (family, feed, invitation) avec couches composables/services partagées
last-reviewed: 2026-07
---

# Architecture front

> **Outcomes — tu sauras FAIRE :** structurer une app Vue par feature, séparer UI/composables/services, décider état local vs Pinia, poser des frontières de modules et les faire respecter.
> **Difficulté :** :star::star::star::star:

## 1. Cas concret d'abord

TribuZen grossit. Tu hérites de cette structure après 3 mois de développement solo :

```
src/
  components/
    FamilyCard.vue
    FamilyList.vue
    FamilyMemberRow.vue
    FeedPost.vue
    FeedList.vue
    FeedComposer.vue
    InvitationBanner.vue
    InvitationModal.vue
    InvitationLink.vue
    AppButton.vue
    AppInput.vue
    AppModal.vue
  composables/
    useFamily.ts
    useFeed.ts
    useInvitation.ts
    useAuth.ts
    useCurrentUser.ts
    useDebounce.ts
    useInfiniteScroll.ts
  stores/
    family.ts
    feed.ts
    invitation.ts
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
  views/
    FamilyPage.vue
    FeedPage.vue
    InvitationPage.vue
    LoginPage.vue
```

**Trois demandes arrivent en même temps :**

1. Le designer veut refactorer tous les composants `Invitation*` — il doit ouvrir 6 dossiers différents.
2. Une nouvelle recrue doit ajouter un composable `useInvitationExpiry` — elle ne sait pas si elle met ça dans `composables/` ou à côté du store ou dans le service.
3. Tu es en train de modifier `useFeed.ts` et tu remarques que ce fichier importe depuis `stores/family.ts` qui importe depuis `composables/useAuth.ts` qui lui-même importe depuis `stores/feed.ts`. Dépendance circulaire.

**Le problème n'est pas la taille** (32 fichiers — ce n'est pas beaucoup). Le problème est que l'organisation par type (`components/`, `composables/`, `stores/`) force à naviguer dans 5 dossiers pour toucher une seule feature. Et sans règles de dépendance explicites, les imports circulaires arrivent silencieusement.

Ce module te donne la structure et les règles pour que TribuZen reste maintenable à 100 fichiers comme à 10.

---

## 2. Théorie complète, concise

### 2.1 Feature-based vs type-based

**Type-based** regroupe les fichiers par nature technique : `components/`, `composables/`, `stores/`, `services/`. C'est la structure par défaut des tutoriels Vue. Elle fonctionne jusqu'à ~15 fichiers par dossier.

**Feature-based** regroupe par domaine métier : tout ce qui touche `family` est dans `features/family/`, qu'il s'agisse d'un composant, d'un composable ou d'un service. La navigation est verticale (dans une feature) plutôt qu'horizontale (entre types).

```
# Type-based — cohérent techniquement, incohérent métier
components/FamilyCard.vue
composables/useFamily.ts
stores/family.ts
services/familyService.ts
types/family.ts

# Feature-based — tout ce qui concerne "family" est ensemble
features/family/
  components/FamilyCard.vue
  composables/useFamily.ts
  stores/family.ts
  services/familyService.ts
  types.ts
```

**Règle de passage** : quand plus d'un développeur travaille sur la même feature, ou quand une feature a plus de 5 fichiers, passer en feature-based.

### 2.2 Couche composables — ce qu'elle fait, ce qu'elle ne fait pas

Un composable encapsule de la logique **réactive** Vue. Il retourne des refs, des computeds, des fonctions qui modifient des refs. Il peut appeler un service.

Ce qu'un composable ne doit PAS contenir :
- Des appels `fetch` directs (c'est le rôle du service)
- Du JSX ou du rendu (c'est le rôle du composant)
- De la logique métier partagée entre plusieurs features (c'est soit un composable partagé dans `shared/`, soit une règle dans un service)

```ts
// features/family/composables/useFamily.ts
import { ref, computed } from 'vue'
import { familyService } from '../services/familyService'
import type { Family } from '../types'

export function useFamily() {
  const family = ref<Family | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const memberCount = computed(() => family.value?.members.length ?? 0)

  async function load(familyId: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      family.value = await familyService.getById(familyId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur inconnue'
    } finally {
      loading.value = false
    }
  }

  return { family, loading, error, memberCount, load }
}
```

Le composable sait **quoi** afficher (refs réactives). Il délègue **comment récupérer** la donnée au service.

### 2.3 Couche services — JavaScript pur, sans Vue

Un service est une fonction ou un objet qui parle au réseau. Il n'importe rien de `vue`. Il ne connaît ni `ref` ni `computed`. C'est ce qui le rend testable sans monter de composant.

```ts
// features/family/services/familyService.ts
import type { Family, CreateFamilyDto } from '../types'

const BASE = '/api/families'

export const familyService = {
  async getById(id: string): Promise<Family> {
    const res = await fetch(`${BASE}/${id}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<Family>
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

  async addMember(familyId: string, userId: string): Promise<void> {
    const res = await fetch(`${BASE}/${familyId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  },
}
```

**Règle :** si un fichier importe depuis `vue`, ce n'est pas un service. Si un fichier fait un `fetch`, ce n'est pas un composable.

### 2.4 Séparation UI et logique métier

Un composant Vue a deux responsabilités légitimes :
1. **Présentation** — ce que l'utilisateur voit (template, styles)
2. **Orchestration locale** — appeler les composables et passer les données au template

Ce qu'un composant ne doit PAS faire :
- Appeler `fetch` directement
- Contenir de la logique de transformation de données (filtres, tris, calculs)
- Gérer un état qui devrait être global (Pinia)

```vue
<!-- features/family/components/FamilyCard.vue — composant bien délimité -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useFamily } from '../composables/useFamily'
import type { Family } from '../types'

const props = defineProps<{ familyId: string }>()
const emit = defineEmits<{ select: [family: Family] }>()

// Toute la logique est dans le composable — le composant orchestre seulement
const { family, loading, error, load } = useFamily()

onMounted(() => load(props.familyId))
</script>

<template>
  <div class="family-card">
    <p v-if="loading">Chargement…</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <div v-else-if="family" @click="emit('select', family)">
      <h2>{{ family.name }}</h2>
      <p>{{ family.members.length }} membre(s)</p>
    </div>
  </div>
</template>
```

Le template ne contient aucune logique de calcul. La logique de fetch est dans le service. La logique réactive est dans le composable.

### 2.5 État local vs global (Pinia)

**État local** — `ref` dans un composable ou directement dans `<script setup>` — est préférable par défaut. Il est isolé, prévisible, garbage-collected quand le composant est détruit.

**État global (Pinia)** est justifié quand :
- La donnée est **partagée entre des branches de l'arbre de composants non liées** (ex : l'utilisateur connecté, affiché dans le header ET dans la page profil)
- La donnée doit **persister lors de la navigation** entre routes (ex : panier, préférences)
- La donnée déclenche des **effets cross-features** (ex : modifier un membre de famille met à jour le feed)

```ts
// features/auth/stores/auth.ts — Pinia justifié
// L'utilisateur connecté est consommé par Header, Sidebar, FamilyPage, FeedPage...
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '../types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => user.value !== null)

  function setUser(u: User | null): void {
    user.value = u
  }

  return { user, isAuthenticated, setUser }
})
```

```ts
// features/family/composables/useFamilyDetail.ts — état local suffisant
// FamilyDetail n'est affiché que dans une seule vue — pas besoin de Pinia
export function useFamilyDetail(familyId: string) {
  const family = ref<Family | null>(null)   // local au composant qui l'utilise
  const loading = ref(false)
  // ...
  return { family, loading }
}
```

**Signal d'alarme :** si tu te retrouves à passer une prop 3 niveaux en profondeur, c'est peut-être un signe que la donnée devrait être dans un store. Mais vérifie d'abord si un composable partagé ne suffit pas — Pinia ajoute de la complexité.

### 2.6 Frontières de modules et règles de dépendance

Une feature ne doit importer que depuis :
- Son propre dossier (`./` relatif)
- `shared/` (`@/shared/`)
- Des bibliothèques externes (`vue`, `vue-router`, `pinia`)

**Interdit :** `features/feed` importe depuis `features/family`. Si les deux ont besoin de la même interface `User`, elle va dans `shared/types/`.

```
Règle de dépendance (sens autorisés) :

features/family  →  shared/
features/feed    →  shared/
features/family  ✗→  features/feed   ← import croisé interdit
shared/          ✗→  features/*      ← shared ne dépend jamais d'une feature
```

Pour détecter les violations, utiliser `eslint-plugin-import` avec la règle `no-restricted-imports`, ou `@nx/enforce-module-boundaries` dans un monorepo Nx.

### 2.7 Design system et composants partagés

`shared/components/` contient les composants génériques : ils ne connaissent aucun domaine métier TribuZen. Ils reçoivent uniquement des props primitives ou des types génériques.

```ts
// shared/components/AppButton.vue — pas de logique TribuZen
// Props : label, variant, disabled, loading
// Ce composant ne sait pas ce qu'est une "famille" ou un "feed"

// features/family/components/FamilyCard.vue — contient la logique métier
// Utilise AppButton, connaît les types Family, Member
```

Les tokens de design (couleurs, espacements, typographie) vivent dans `shared/styles/tokens.css` ou un fichier Tailwind config. Les composants de feature s'appuient sur ces tokens — jamais sur des valeurs hardcodées.

```css
/* shared/styles/tokens.css */
:root {
  --color-primary: #4f46e5;
  --color-danger: #ef4444;
  --spacing-md: 1rem;
  --radius-card: 0.5rem;
}
```

### 2.8 Conventions de nommage et barrels

Conventions standard Vue 3 / TypeScript :

| Élément | Convention | Exemple |
|---|---|---|
| Composant SFC | PascalCase | `FamilyCard.vue` |
| Composable | camelCase + `use` | `useFamily.ts` |
| Store Pinia | camelCase + `use` + `Store` | `useAuthStore` |
| Service | camelCase + `Service` | `familyService.ts` |
| Type / Interface | PascalCase | `Family`, `CreateFamilyDto` |
| Constante globale | SCREAMING_SNAKE_CASE | `MAX_MEMBERS_PER_FAMILY` |
| Barrel | `index.ts` à la racine du dossier | `features/family/index.ts` |

**Barrel files** — un `index.ts` qui centralise les exports d'une feature :

```ts
// features/family/index.ts
export { FamilyCard } from './components/FamilyCard.vue'
export { FamilyList } from './components/FamilyList.vue'
export { useFamily } from './composables/useFamily'
export { useFamilyDetail } from './composables/useFamilyDetail'
export type { Family, Member, CreateFamilyDto } from './types'
// NE PAS exporter les services — ils sont des détails internes
```

Usage :

```ts
// Avant barrel — 4 imports verbeux
import { FamilyCard } from '@/features/family/components/FamilyCard.vue'
import { useFamily } from '@/features/family/composables/useFamily'
import type { Family } from '@/features/family/types'

// Après barrel — 1 import propre
import { FamilyCard, useFamily } from '@/features/family'
import type { Family } from '@/features/family'
```

**Risque barrel :** les barrel files peuvent casser le tree-shaking si le bundler ne peut pas analyser les exports statiquement. Vite gère ça bien avec `export { X } from './X'` (re-export nommé). Éviter `export * from './X'` qui exporte tout et nuit au tree-shaking.

**Scalabilité :** une codebase Vue reste gérable si chaque feature est un module autonome (ses propres types, composables, services, composants, store) et si `shared/` ne dépend jamais d'une feature. Ajouter une feature = copier la structure d'une feature existante. Supprimer une feature = supprimer son dossier.

---

## 3. Worked examples

### Exemple 1 — Arborescence feature-based TribuZen complète

```
tribuzen/src/
  features/
    auth/
      components/
        LoginForm.vue
        RegisterForm.vue
      composables/
        useAuth.ts
      services/
        authService.ts
      stores/
        auth.ts               ← Pinia (user connecté = état global)
      types.ts
      routes.ts
      index.ts                ← barrel

    family/
      components/
        FamilyCard.vue
        FamilyList.vue
        FamilyMemberRow.vue
        FamilyCreateModal.vue
      composables/
        useFamily.ts
        useFamilyDetail.ts
        useFamilyMembers.ts
      services/
        familyService.ts
      stores/
        family.ts             ← Pinia (famille active partagée feed+header)
      types.ts
      routes.ts
      index.ts

    feed/
      components/
        FeedPost.vue
        FeedList.vue
        FeedComposer.vue
      composables/
        useFeed.ts
        useInfiniteScroll.ts  ← spécifique feed, pas shared car couplé au store feed
      services/
        feedService.ts
      stores/
        feed.ts               ← Pinia (posts chargés, pagination)
      types.ts
      routes.ts
      index.ts

    invitation/
      components/
        InvitationBanner.vue
        InvitationModal.vue
        InvitationLinkDisplay.vue
      composables/
        useInvitation.ts
        useInvitationExpiry.ts
      services/
        invitationService.ts
      types.ts
      routes.ts
      index.ts
      ← Pas de store Pinia — l'état d'invitation est local aux composants

  shared/
    components/
      AppButton.vue
      AppInput.vue
      AppModal.vue
      AppSpinner.vue
    composables/
      useDebounce.ts
      usePagination.ts
      useToast.ts
    styles/
      tokens.css
      reset.css
    types/
      common.ts               ← PaginatedResponse<T>, ApiError, etc.
    utils/
      formatDate.ts
      validators.ts

  router/
    index.ts                  ← spread authRoutes, familyRoutes, feedRoutes, invitationRoutes

  App.vue
  main.ts
```

**Pourquoi `family.ts` store Pinia et pas `invitation` ?**

La famille active (`currentFamily`) est consommée par le header, le feed (qui filtre par famille), et les composants invitation. C'est un état partagé cross-features. L'état d'invitation (lien en cours de génération, expiration) n'est utile qu'au moment où l'utilisateur est dans le modal — local suffit.

### Exemple 2 — Slice `family` complet (du service au composant)

**Types** (`features/family/types.ts`) :

```ts
export interface Member {
  id: string
  userId: string
  name: string
  role: 'admin' | 'member'
  joinedAt: string
}

export interface Family {
  id: string
  name: string
  members: Member[]
  createdAt: string
}

export interface CreateFamilyDto {
  name: string
}
```

**Service** (`features/family/services/familyService.ts`) :

```ts
import type { Family, CreateFamilyDto } from '../types'

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

**Store Pinia** (`features/family/stores/family.ts`) :

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { familyService } from '../services/familyService'
import type { Family } from '../types'

export const useFamilyStore = defineStore('family', () => {
  const families = ref<Family[]>([])
  const currentFamilyId = ref<string | null>(null)

  const currentFamily = computed(
    () => families.value.find(f => f.id === currentFamilyId.value) ?? null
  )

  async function loadMine(): Promise<void> {
    families.value = await familyService.getMine()
  }

  function setCurrentFamily(id: string): void {
    currentFamilyId.value = id
  }

  return { families, currentFamily, currentFamilyId, loadMine, setCurrentFamily }
})
```

**Composable local** (`features/family/composables/useFamilyDetail.ts`) :

```ts
import { ref } from 'vue'
import { familyService } from '../services/familyService'
import type { Family } from '../types'

// Ce composable gère le chargement d'une famille spécifique — état local
// Ne pas utiliser useFamilyStore ici : c'est un détail de vue, pas un état global
export function useFamilyDetail(familyId: string) {
  const family = ref<Family | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      family.value = await familyService.getById(familyId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur inconnue'
    } finally {
      loading.value = false
    }
  }

  return { family, loading, error, load }
}
```

**Composant** (`features/family/components/FamilyCard.vue`) :

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useFamilyDetail } from '../composables/useFamilyDetail'
import AppSpinner from '@/shared/components/AppSpinner.vue'
import type { Family } from '../types'

const props = defineProps<{ familyId: string }>()
const emit = defineEmits<{ select: [family: Family] }>()

const { family, loading, error, load } = useFamilyDetail(props.familyId)
onMounted(load)
</script>

<template>
  <div class="family-card">
    <AppSpinner v-if="loading" />
    <p v-else-if="error" class="error">{{ error }}</p>
    <button v-else-if="family" class="family-card__inner" @click="emit('select', family)">
      <h2 class="family-card__name">{{ family.name }}</h2>
      <span class="family-card__count">{{ family.members.length }} membre(s)</span>
    </button>
  </div>
</template>

<style scoped>
.family-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: var(--spacing-md);
}
.family-card__inner {
  background: none;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
}
</style>
```

**Ce que cette architecture garantit :**
- Le designer modifie `FamilyCard.vue` → touche uniquement `features/family/components/`
- Le dev backend change l'API families → modifie uniquement `familyService.ts`
- On ajoute un composable `useFamilySort` → il va dans `features/family/composables/`, pas dans `shared/`
- `feed` a besoin de la famille courante → importe `useFamilyStore` depuis `@/features/family` (via barrel) → import autorisé car c'est un store, pas un import circulaire de logique interne

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Organiser par type (`components/`, `composables/`, `stores/`) sur un gros projet

```
# ❌ À 30+ fichiers, impossible de travailler sur une feature sans sauter entre 5 dossiers
components/FamilyCard.vue
composables/useFamily.ts
stores/family.ts
services/familyService.ts
types/family.ts
```

La structure par type est tentante car elle semble "propre". Elle l'est pour 10 fichiers. À 50 fichiers, ouvrir la feature `invitation` implique d'aller dans `components/`, `composables/`, `stores/`, `services/`, `types/` — cinq allers-retours dans l'arborescence.

**Correct :** feature-based. Tout ce qui concerne `invitation` est dans `features/invitation/`.

### PIÈGE #2 — Mettre de la logique métier dans un composant

```vue
<!-- ❌ Le composant connaît les règles métier -->
<script setup lang="ts">
const canInvite = computed(() =>
  family.value?.members.length < 10
    && currentUser.value?.role === 'admin'
    && !family.value?.isFrozen
)
</script>
```

Ce computed contient des règles métier (`isFrozen`, limite de membres, rôle admin). Si ces règles changent, il faut les trouver dans les composants — impossible à maintenir.

```ts
// ✅ La règle vit dans le composable (ou le service si purement serveur)
// features/family/composables/useFamily.ts
const canInvite = computed(() =>
  family.value
    ? familyService.canInvite(family.value, currentUser.value)
    : false
)
```

### PIÈGE #3 — Dépendances circulaires entre features

```ts
// ❌ feed importe depuis family, family importe depuis feed
// features/feed/composables/useFeed.ts
import { useFamilyStore } from '@/features/family/stores/family'  // OK si store

// features/family/composables/useFamily.ts
import { useFeedStore } from '@/features/feed/stores/feed'         // ❌ circulaire !
```

Ce pattern crée une dépendance circulaire. Les bundlers la détectent rarement à la compilation — elle se manifeste en runtime avec des valeurs `undefined` difficiles à déboguer.

**Correct :** si `family` et `feed` ont besoin des mêmes données, extraire dans `shared/` ou repenser qui est propriétaire de la donnée. Un store ne doit jamais importer un autre store d'une feature partenaire — communication via événements ou via `shared/`.

### PIÈGE #4 — Barrel avec `export *` qui casse le tree-shaking

```ts
// ❌ export * empêche le bundler d'analyser les exports statiquement
export * from './components/FamilyCard.vue'
export * from './composables/useFamily'
```

Vite peut tree-shaker les exports nommés mais `export *` force le bundler à inclure tout le module. Sur une app de taille moyenne, ça peut ajouter plusieurs Ko inutiles au bundle.

```ts
// ✅ Exports nommés — le bundler sait exactement quoi inclure
export { FamilyCard } from './components/FamilyCard.vue'
export { useFamily } from './composables/useFamily'
export type { Family, Member } from './types'
```

---

## 5. Ancrage TribuZen

Dans TribuZen, la structure feature-based correspond directement aux trois domaines du produit :

**`features/family/`** — tout ce qui concerne la gestion d'une famille TribuZen. Le store Pinia `useFamilyStore` expose `currentFamily` — consommé par `FeedPage` (pour filtrer les posts de cette famille) et par `InvitationModal` (pour pré-remplir le lien d'invitation). C'est le seul cas justifié de store cross-features.

**`features/feed/`** — le fil d'actualité. `useFeed.ts` gère la pagination infinie et appelle `feedService`. `FeedComposer.vue` est un composant de présentation pur — il émet un event `post-created`, le composant parent déclenche le rechargement via `useFeed`.

**`features/invitation/`** — génération et validation des liens. Pas de store Pinia : le lien est généré à la demande, affiché une fois, non persisté en mémoire après fermeture du modal. État 100% local dans `useInvitation.ts`.

**`shared/components/`** — `AppButton`, `AppInput`, `AppModal`, `AppSpinner` — les quatre briques du design system TribuZen. Leurs tokens CSS (`--color-primary`, `--radius-card`) sont définis dans `shared/styles/tokens.css` et repris par tous les composants de features.

**Fichiers cibles :**

```
tribuzen/src/
  features/
    family/
      components/FamilyCard.vue
      composables/useFamilyDetail.ts
      services/familyService.ts
      stores/family.ts
      types.ts
      index.ts
    feed/
      composables/useFeed.ts
      services/feedService.ts
      stores/feed.ts
    invitation/
      composables/useInvitation.ts
      services/invitationService.ts
  shared/
    components/AppButton.vue
    styles/tokens.css
    types/common.ts
```

---

## 6. Points clés

1. Feature-based regroupe par domaine métier — type-based est un anti-pattern au-delà de 15 fichiers par dossier.
2. La couche services est du JavaScript pur (aucun import `vue`) — testable sans monter de composant.
3. La couche composables ajoute la réactivité Vue au-dessus des services — jamais de `fetch` direct.
4. Un composant Vue orchestre et présente — la logique métier vit dans les composables et les services.
5. L'état global Pinia est justifié quand des données sont partagées entre branches non liées de l'arbre de composants, ou quand elles persistent entre routes.
6. Les features ne s'importent pas entre elles — les données partagées vont dans `shared/` ou via un store.
7. Les barrel files (`index.ts`) simplifient les imports mais doivent utiliser des exports nommés pour préserver le tree-shaking.
8. La scalabilité s'obtient par la cohérence des règles, pas par la complexité de la structure.

---

## 7. Seeds Anki

```
Quelle est la différence entre organisation feature-based et type-based ?|Feature-based regroupe par domaine métier (features/family/, features/feed/) — type-based regroupe par nature technique (components/, composables/, stores/). Feature-based scale mieux au-delà de 15 fichiers par dossier.
Qu'est-ce qu'un service Vue et pourquoi ne doit-il pas importer depuis 'vue' ?|Un service est du JavaScript pur qui parle au réseau ou aux données. Il ne doit pas importer vue pour rester testable sans monter de composant — c'est la couche composable qui ajoute la réactivité au-dessus.
Quand utiliser un store Pinia plutôt qu'un composable local ?|Pinia est justifié quand la donnée est partagée entre branches non liées de l'arbre de composants (ex : currentUser dans header ET dans plusieurs pages), ou quand elle doit persister entre navigations. État utilisé dans un seul composant ou une seule vue = composable local.
Pourquoi les features ne doivent-elles pas s'importer entre elles ?|Pour éviter les dépendances circulaires (A importe B qui importe A) et pour rendre chaque feature indépendamment supprimable ou extractible. Si deux features ont besoin des mêmes données, elles vont dans shared/.
Quelle est la règle de dépendance dans une architecture feature-based ?|features/* → shared/ → librairies externes. Jamais features/* → features/*. Jamais shared/ → features/*. Les stores Pinia font exception car ils sont des singletons transverses.
Quel est le risque d'utiliser export * dans un barrel file ?|export * empêche le bundler d'analyser statiquement les exports et nuit au tree-shaking — le module entier est inclus dans le bundle même si seule une fonction est utilisée. Toujours préférer des exports nommés explicites.
Quel signal indique qu'une logique métier a tort d'être dans un composant ?|Si le computed ou la fonction utilise le mot "ET" dans sa description ("affiche ET filtre ET vérifie les règles") — ou si la modifier implique d'ouvrir plusieurs composants. La logique métier appartient au composable ou au service.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-23-architecture-front/README.md`. Refactor structurel guidé — migrer une codebase plate type-based vers une architecture feature-based avec couches composables/services et barrel files, vérification via import checker.

---

*Précédent : `22-ssr-et-hydration`*
