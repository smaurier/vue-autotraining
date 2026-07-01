# Lab 21 — Performance

> **Outcome :** à la fin, tu sais mesurer un problème de performance dans Vue DevTools, appliquer `v-memo` sur une liste longue, virtualiser ce feed avec `@tanstack/vue-virtual`, et charger un composant lourd en lazy via `defineAsyncComponent` — avec des mesures avant/après chaque étape.
> **Vrai outil :** Vue 3.5 + Vite dev server + Vue DevTools (extension navigateur) + `@tanstack/vue-virtual`.
> **Feedback :** le coach valide les mesures DevTools en session (FPS, re-rendus, taille de bundle) — pas de test-runner auto-correcteur.

---

## Énoncé

Le feed famille de TribuZen reçoit 500 posts simulés. Ta mission : **rendre ce feed fluide** en appliquant trois optimisations dans l'ordre, avec une mesure avant/après chacune.

**Les trois étapes dans l'ordre :**

1. `v-memo` sur `PostCard` — stopper les 500 re-rendus à chaque like
2. Virtualisation — ne garder que ~25 nœuds DOM au lieu de 500
3. Lazy loading — sortir `HeavyAnalytics` du bundle initial

**Pas de gap-fill** — tu écris les composants complets depuis les starters ci-dessous, tu mesures dans Vue DevTools et tu documentes les chiffres.

---

## Données de départ

Colle ce fichier dans `src/data/fakePosts.ts` de ton projet Vite :

```ts
// src/data/fakePosts.ts
export interface Post {
  id: string
  authorName: string
  title: string
  excerpt: string
  likeCount: number
  commentCount: number
  hasMedia: boolean
  isSelected: boolean
  createdAt: string
}

export const FAKE_POSTS: Post[] = Array.from({ length: 500 }, (_, i) => ({
  id: `post-${i}`,
  authorName: ['Alice', 'Bob', 'Cara', 'David', 'Eva'][i % 5],
  title: `Publication n°${i + 1}`,
  excerpt: `Contenu de la publication numéro ${i + 1}. Texte simulé pour le lab.`,
  likeCount: Math.floor(Math.random() * 50),
  commentCount: Math.floor(Math.random() * 20),
  hasMedia: i % 3 === 0,
  isSelected: false,
  createdAt: new Date(Date.now() - i * 3_600_000).toISOString(),
}))
```

---

## Starters minimaux

### Starter A — `PostCard.vue`

```vue
<!-- src/components/feed/PostCard.vue -->
<script setup lang="ts">
import type { Post } from '@/data/fakePosts'

defineProps<{ post: Post }>()
</script>

<template>
  <!-- À compléter : afficher post.authorName, post.title, post.excerpt,
       post.likeCount, post.commentCount, un badge "📷" si post.hasMedia -->
</template>

<style scoped>
/* À toi d'ajouter un minimum de style pour que les cartes soient visibles */
</style>
```

### Starter B — `NaiveFeed.vue` (baseline, sans optimisation)

```vue
<!-- src/components/feed/NaiveFeed.vue — point de départ intentionnellement naïf -->
<script setup lang="ts">
import { ref } from 'vue'
import type { Post } from '@/data/fakePosts'
import PostCard from './PostCard.vue'

const props = defineProps<{ posts: Post[] }>()

// Simulation d'un like — modifie un post dans la liste
const emit = defineEmits<{ like: [postId: string] }>()
</script>

<template>
  <!-- Pas de v-memo, pas de virtualisation — 500 PostCard dans le DOM -->
  <div class="naive-feed">
    <PostCard
      v-for="post in props.posts"
      :key="post.id"
      :post="post"
      @click="emit('like', post.id)"
    />
  </div>
</template>
```

### Starter C — `HeavyAnalytics.vue` (composant lourd simulé)

```vue
<!-- src/components/analytics/HeavyAnalytics.vue -->
<script setup lang="ts">
// Simule un composant lourd (graphiques, calculs) chargé à la demande
import { onMounted } from 'vue'

onMounted(() => {
  console.log('HeavyAnalytics monté — chunk chargé')
})
</script>

<template>
  <div class="heavy-analytics">
    <h2>Statistiques famille</h2>
    <p>Ce composant simule un import lourd (graphiques, data viz).</p>
    <!-- En vrai TribuZen : Chart.js ou D3 ici -->
  </div>
</template>
```

### Starter D — `FeedView.vue` (vue principale)

```vue
<!-- src/views/FeedView.vue — à compléter au fil des étapes -->
<script setup lang="ts">
import { ref } from 'vue'
import { FAKE_POSTS } from '@/data/fakePosts'
import type { Post } from '@/data/fakePosts'
// Importe NaiveFeed pour commencer — tu le remplaceras par VirtualFeed à l'étape 2
import NaiveFeed from '@/components/feed/NaiveFeed.vue'

const posts = ref<Post[]>(FAKE_POSTS)

// Simule un like : modifie likeCount du post ciblé
// Le reste de la liste ne devrait PAS se re-rendre après l'étape 1
function handleLike(postId: string): void {
  const post = posts.value.find(p => p.id === postId)
  if (post) post.likeCount++
}

// Toggle affichage des analytics (étape 3)
const showAnalytics = ref(false)
</script>

<template>
  <div class="feed-view">
    <header>
      <h1>Feed TribuZen — {{ posts.length }} publications</h1>
      <button @click="showAnalytics = !showAnalytics">
        {{ showAnalytics ? 'Masquer' : 'Voir les stats' }}
      </button>
    </header>

    <!-- Étape 3 : remplacer par le composant lazy -->
    <!-- <HeavyAnalytics v-if="showAnalytics" /> -->

    <NaiveFeed :posts="posts" @like="handleLike" />
  </div>
</template>
```

Lance `pnpm dev`, ouvre `FeedView` et prépare Vue DevTools pour mesurer.

---

## Étapes (en friction)

### Étape 0 — Baseline (mesurer avant toute optimisation)

1. Lance le dev server, ouvre `FeedView` dans le navigateur.
2. Ouvre Vue DevTools → onglet **Performance** → "Start recording".
3. Clique sur la première carte (déclenche `handleLike` sur `post-0`) → "Stop".
4. Note le nombre de composants re-rendus et le temps total.

**Cible à noter :**
- Nombre de `PostCard` re-rendus : ___
- Temps total : ___ ms

---

### Étape 1 — Appliquer `v-memo` sur `PostCard`

1. Modifie `NaiveFeed.vue` : ajoute `v-memo` sur `PostCard` avec le bon tableau de dépendances.
2. Identifie quelles propriétés de `Post` sont affichées dans `PostCard` — ce sont exactement celles qui doivent figurer dans `v-memo`.
3. Re-mesure le like dans Vue DevTools.

**Résultat attendu :** 1 seul `PostCard` re-rendu (celui dont `likeCount` a changé).

**Question de réflexion :** que se passe-t-il si tu ajoutes `post.excerpt` dans `PostCard.vue` mais que tu oublies de l'ajouter au tableau `v-memo` ? Comment le détecter ?

---

### Étape 2 — Virtualiser le feed

1. Installe `@tanstack/vue-virtual` : `pnpm add @tanstack/vue-virtual`.
2. Crée `src/components/feed/VirtualFeed.vue` — composant virtualisé complet avec `useVirtualizer`.
3. Dans `FeedView.vue`, remplace `<NaiveFeed>` par `<VirtualFeed>`.
4. Vérifie dans les DevTools (onglet Éléments) que le nombre de nœuds `PostCard` dans le DOM est autour de 25-30 (pas 500).
5. Enregistre un scroll de 5 secondes dans Chrome DevTools → Performance → compte les Long Tasks.

**Résultat attendu :** DOM passe de 500 nœuds à ~25. Long Tasks réduites.

**Paramètre à régler :** la hauteur estimée `estimateSize`. Inspecte une `PostCard` dans le navigateur pour mesurer sa hauteur réelle et ajuste.

---

### Étape 3 — Lazy loading de `HeavyAnalytics`

1. Dans `FeedView.vue`, remplace l'import statique de `HeavyAnalytics` par `defineAsyncComponent`.
2. Ajoute un `LoadingSpinner` inline (ou un composant simple) comme `loadingComponent` avec un `delay: 200`.
3. Affiche `HeavyAnalytics` derrière le bouton "Voir les stats" (`v-if="showAnalytics"`).
4. Vérifie dans l'onglet **Réseau** de Chrome DevTools que le chunk `HeavyAnalytics` est téléchargé seulement au premier clic sur "Voir les stats", pas au chargement initial.

**Bonus :** installe `rollup-plugin-visualizer`, lance `pnpm build` et ouvre `dist/bundle-stats.html`. Vérifie que `HeavyAnalytics.vue` est dans un chunk séparé.

---

## Corrigé complet commenté

### `PostCard.vue` — corrigé

```vue
<!-- src/components/feed/PostCard.vue -->
<script setup lang="ts">
import type { Post } from '@/data/fakePosts'

// Prop unique : l'objet post complet
// La sélection des propriétés affichées est dans le template
defineProps<{ post: Post }>()
</script>

<template>
  <article class="post-card">
    <header class="post-card__header">
      <span class="post-card__author">{{ post.authorName }}</span>
      <!-- Badge média : v-if (pas v-show) car la structure varie selon hasMedia -->
      <span v-if="post.hasMedia" class="post-card__media-badge">📷</span>
    </header>

    <h2 class="post-card__title">{{ post.title }}</h2>
    <p class="post-card__excerpt">{{ post.excerpt }}</p>

    <footer class="post-card__footer">
      <span>{{ post.likeCount }} ❤️</span>
      <span>{{ post.commentCount }} 💬</span>
    </footer>
  </article>
</template>

<style scoped>
.post-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  background: #fff;
}
.post-card__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.post-card__author {
  font-weight: 600;
  color: #1e293b;
}
.post-card__media-badge {
  font-size: 0.75rem;
}
.post-card__title {
  font-size: 1rem;
  margin: 0 0 0.25rem;
}
.post-card__excerpt {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 0.5rem;
}
.post-card__footer {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #94a3b8;
}
</style>
```

### `NaiveFeed.vue` avec `v-memo` — corrigé étape 1

```vue
<!-- src/components/feed/NaiveFeed.vue — avec v-memo -->
<script setup lang="ts">
import type { Post } from '@/data/fakePosts'
import PostCard from './PostCard.vue'

const props = defineProps<{ posts: Post[] }>()
const emit = defineEmits<{ like: [postId: string] }>()
</script>

<template>
  <div class="naive-feed">
    <!--
      v-memo="[post.id, post.title, post.excerpt, post.likeCount, post.commentCount, post.hasMedia, post.isSelected]"

      Liste EXHAUSTIVE de toutes les propriétés affichées dans PostCard.vue :
      - post.authorName : affiché dans le header
      - post.hasMedia : badge 📷 conditionnel
      - post.title, post.excerpt : contenus textuels
      - post.likeCount, post.commentCount : compteurs du footer
      - post.isSelected : si sélection visuelle dans PostCard (garde pour le futur)

      Si post.likeCount de post-0 change → seule la carte post-0 diff.
      Les 499 autres : v-memo identique → Vue saute le diff → 0 ms de travail.
    -->
    <PostCard
      v-for="post in props.posts"
      :key="post.id"
      v-memo="[post.id, post.authorName, post.title, post.excerpt, post.likeCount, post.commentCount, post.hasMedia, post.isSelected]"
      :post="post"
      @click="emit('like', post.id)"
    />
  </div>
</template>
```

### `VirtualFeed.vue` — corrigé étape 2

```vue
<!-- src/components/feed/VirtualFeed.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import type { Post } from '@/data/fakePosts'
import PostCard from './PostCard.vue'

const props = defineProps<{
  posts: Post[]
}>()

const emit = defineEmits<{ like: [postId: string] }>()

// Référence sur le conteneur scrollable
const scrollEl = ref<HTMLDivElement | null>(null)

const virtualizer = useVirtualizer({
  // Nombre d'items total — computed pour être réactif si props.posts change
  count: computed(() => props.posts.length),
  getScrollElement: () => scrollEl.value,
  // 140px = hauteur mesurée d'une PostCard avec contenu standard.
  // TanStack Virtual corrige dynamiquement après mesure réelle (layout measurement).
  estimateSize: () => 140,
  // Pré-rendre 5 items au-delà de la fenêtre (haut + bas) pour anticiper le scroll
  overscan: 5,
})

// Alias réactifs pour le template
const virtualItems = computed(() => virtualizer.value.getVirtualItems())
const totalHeight = computed(() => virtualizer.value.getTotalSize())
</script>

<template>
  <!--
    contain: strict : isolation du contexte de rendu.
    Indique au navigateur que rien à l'intérieur n'affecte la mise en page extérieure.
    Gain de performance au scroll car le navigateur évite les reflows globaux.
  -->
  <div
    ref="scrollEl"
    class="virtual-feed"
    style="height: 100vh; overflow-y: auto; contain: strict;"
  >
    <!--
      Div fantôme : hauteur = somme estimée de tous les 500 items.
      Donne une scrollbar proportionnelle à la liste entière.
      position: relative est nécessaire pour que les cartes absolues se positionnent ici.
    -->
    <div :style="{ height: `${totalHeight}px`, position: 'relative' }">
      <!--
        Boucle sur les ~25 items visibles (selon la hauteur du conteneur et des items).
        row.key : clé stable gérée par TanStack Virtual (pas row.index — résistant au tri).
        row.start : position en pixels depuis le haut du fantôme.
        row.size : hauteur mesurée (ou estimée) de cet item spécifique.
        transform: translateY est préférable à top: Xpx car il utilise le GPU
        et n'entraîne pas de reflow (layout) — seulement un repaint sur le layer composite.
      -->
      <PostCard
        v-for="row in virtualItems"
        :key="row.key"
        :post="props.posts[row.index]"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          transform: `translateY(${row.start}px)`,
        }"
        @click="emit('like', props.posts[row.index].id)"
      />
    </div>
  </div>
</template>
```

### `FeedView.vue` avec lazy loading — corrigé étape 3

```vue
<!-- src/views/FeedView.vue — version finale avec les trois optimisations -->
<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue'
import { FAKE_POSTS } from '@/data/fakePosts'
import type { Post } from '@/data/fakePosts'
import VirtualFeed from '@/components/feed/VirtualFeed.vue'

// Lazy loading de HeavyAnalytics.
// Vite crée automatiquement un chunk séparé : analytics~[hash].js
// Téléchargé seulement au premier clic sur "Voir les stats".
const HeavyAnalytics = defineAsyncComponent({
  loader: () => import('@/components/analytics/HeavyAnalytics.vue'),
  // Composant affiché pendant le téléchargement du chunk
  // Inline pour éviter un import supplémentaire dans ce lab
  loadingComponent: {
    template: '<div class="loading-placeholder">Chargement des statistiques…</div>',
  },
  // N'affiche le loadingComponent que si le chargement dure plus de 200 ms
  // Évite un flash de loader pour les connexions rapides
  delay: 200,
  // Affiche une erreur si le chunk ne se charge pas en 10 s
  timeout: 10_000,
})

// shallowRef : on remplace toujours posts.value en entier (depuis l'API en vrai)
// Pas besoin de deep reactivity sur chaque propriété de chaque Post
const posts = ref<Post[]>(FAKE_POSTS)

// Like : pattern immutable — remplace le post modifié dans un nouveau tableau
// shallowRef détecte l'assignation de .value et déclenche le re-rendu
function handleLike(postId: string): void {
  posts.value = posts.value.map(p =>
    p.id === postId ? { ...p, likeCount: p.likeCount + 1 } : p
  )
}

const showAnalytics = ref(false)
</script>

<template>
  <div class="feed-view">
    <header class="feed-view__header">
      <h1>Feed TribuZen — {{ posts.length }} publications</h1>
      <button class="btn-stats" @click="showAnalytics = !showAnalytics">
        {{ showAnalytics ? 'Masquer les stats' : 'Voir les stats' }}
      </button>
    </header>

    <!--
      HeavyAnalytics est chargé en lazy : le chunk analytics~[hash].js
      est téléchargé SEULEMENT au premier affichage de ce composant.
      v-if (pas v-show) : quand masqué, le composant est détruit et le chunk
      est déjà en cache navigateur — le prochain affichage est instantané.
    -->
    <HeavyAnalytics v-if="showAnalytics" class="feed-view__analytics" />

    <!-- VirtualFeed : virtualisation + v-memo côté PostCard -->
    <VirtualFeed :posts="posts" @like="handleLike" />
  </div>
</template>

<style scoped>
.feed-view {
  max-width: 680px;
  margin: 0 auto;
  padding: 1rem;
}
.feed-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.btn-stats {
  padding: 0.4rem 0.8rem;
  border: 1px solid #3b82f6;
  border-radius: 4px;
  background: #eff6ff;
  color: #1d4ed8;
  cursor: pointer;
}
.loading-placeholder {
  padding: 2rem;
  text-align: center;
  color: #94a3b8;
}
</style>
```

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — de mémoire, en 40 minutes, sans ouvrir ce corrigé :**

1. Le feed reçoit désormais des posts avec des hauteurs variables : les posts avec `hasMedia: true` font 200 px, les autres 100 px. Adapte `useVirtualizer` pour que `estimateSize` tienne compte de l'index (`(i) => posts[i].hasMedia ? 200 : 100`).

2. Ajoute un filtre "Posts avec média seulement" — un `computed` filtre `posts.value` et le résultat est passé à `VirtualFeed`. Vérifie que le virtualizer met bien à jour `count` après filtrage.

3. `v-memo` sur `PostCard` dans `VirtualFeed` — directement dans ce composant (pas dans le parent). Détermine si c'est plus ou moins flexible et pourquoi.

**Critère de réussite :** les trois points fonctionnent dans le navigateur, le scroll est fluide avec les hauteurs variables, et le filtre appliqué met à jour la scrollbar correctement.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, les composants de ce lab sont les fondations du front-office :

```
tribuzen/
  src/
    data/
      fakePosts.ts              ← seed de développement (remplacé par API en prod)
    components/
      feed/
        PostCard.vue            ← carte de publication — affichage seul, pas de logique métier
        VirtualFeed.vue         ← virtualisation + gestion du scroll
      analytics/
        HeavyAnalytics.vue      ← lazy — jamais dans le bundle initial
    views/
      FeedView.vue              ← orchestre feed + analytics + like handler
```

**Différences par rapport au lab :**

- `posts` viendra d'un composable `useFeed()` (Pinia + API call) — pas de données locales. Le type `Post` sera importé depuis `src/types/post.ts` partagé entre composants.
- Le handler `handleLike` appellera une action Pinia qui fait un appel API optimiste (met à jour localement, rollback si l'API échoue) — le pattern immutable du lab reste identique.
- `HeavyAnalytics` utilisera Chart.js ou Recharts pour Vue — le lazy loading est identique, seul le contenu du composant diffère.

**Commit cible :**
```
perf(feed): virtualiser le feed famille, v-memo PostCard, lazy HeavyAnalytics
```
