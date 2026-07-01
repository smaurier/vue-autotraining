---
titre: Performance
cours: 02-vue
notions: [coût du rendu réactif, v-once et v-memo, computed vs méthode, lazy loading de composants defineAsyncComponent, code splitting, virtualisation de longues listes, shallowRef pour grosses structures, mesurer avec les DevTools et Lighthouse, éviter les re-rendus inutiles, KeepAlive et cache de composants, onActivated et onDeactivated]
outcomes:
  - sait identifier un re-rendu ou un calcul inutile et le corriger
  - sait appliquer v-once, v-memo, computed au bon endroit
  - sait charger en lazy et découper le bundle (code splitting)
  - sait virtualiser une longue liste et mesurer l'impact
prerequis: [20-msw-et-mocking-api]
next: 22-ssr-et-hydration
libs: [{ name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — optimiser le feed famille (liste longue virtualisée, v-memo sur les cartes, lazy des vues lourdes)
last-reviewed: 2026-07
---

# Performance

> **Outcomes — tu sauras FAIRE :** identifier et corriger un re-rendu ou un calcul inutile, appliquer `v-once`/`v-memo`/`computed` au bon endroit, charger des composants en lazy et découper le bundle, virtualiser une longue liste et mesurer l'impact réel.
> **Difficulté :** :star::star::star::star:

← Précédent : `20-msw-et-mocking-api` | Suivant : `22-ssr-et-hydration`

---

## 1. Cas concret d'abord

Le feed TribuZen affiche les publications de la famille : photos, notes, événements. En développement avec une vingtaine de posts, tout va bien. Mais en recette avec un compte de test qui a 500 publications, le scroll est saccadé à 15 FPS, le chargement initial dépasse 4 secondes et l'onglet Chrome consomme 280 Mo de mémoire.

**Ce que tu vois dans Vue DevTools (onglet Performance) :**

```
PostCard × 500    re-render en 840 ms au premier affichage
PostCard × 500    re-render en 620 ms au moindre like (un seul post changé)
FeedView          re-render en 920 ms à chaque scroll
```

Trois problèmes distincts, trois corrections distinctes :

1. 500 `PostCard` se re-rendent tous quand un seul post change → **`v-memo`**
2. 500 nœuds DOM sont dans la page même si 490 sont hors écran → **virtualisation**
3. `FeedView` importe `HeavyAnalytics.vue` (90 Ko gzip) au démarrage même si l'utilisateur n'y accède jamais → **`defineAsyncComponent` + code splitting**

Ce module te donne les outils pour corriger ces trois cas, mesurer avant/après et reconnaître les pièges classiques.

---

## 2. Théorie complète, concise

### 2.1 Coût du rendu réactif

Vue maintient un graphe de dépendances : quand une ref ou une propriété reactive change, tous les composants qui l'ont lue lors de leur dernier rendu sont marqués "dirty" et re-rendus au prochain tick.

Le cycle complet d'un re-rendu :

```
1. Le getter de la ref change → Vue notifie les abonnés
2. Les composants abonnés sont mis en file d'attente (microtask)
3. Vue appelle la fonction render() de chaque composant → Virtual DOM (vnode tree)
4. Vue diff les vnodes (ancien vs nouveau)
5. Vue applique le patch DOM minimal
```

Chaque étape a un coût. Avec 500 `PostCard`, les étapes 3-4 sont exécutées 500 fois même si un seul post a changé, car chaque `PostCard` reçoit la liste entière en prop et Vue ne sait pas qu'elle n'en lit qu'un seul item.

**Règle fondamentale :** mesurer d'abord, optimiser ensuite. Une optimisation prématurée peut rendre le code illisible sans gain mesurable.

### 2.2 `v-once` — gel permanent

`v-once` rend l'élément ou le composant une seule fois, puis retire ses dépendances du système réactif. Tout ce qui est dans le sous-arbre est figé définitivement.

```vue
<template>
  <!-- Ce header ne dépend que de données statiques : titre de l'app, logo -->
  <!-- v-once : rendu une fois, jamais re-rendu même si appName changeait -->
  <header v-once class="feed-header">
    <img src="/logo.svg" alt="TribuZen" />
    <h1>{{ appName }}</h1>
  </header>

  <!-- Le feed, lui, doit rester réactif -->
  <FeedList :posts="posts" />
</template>
```

Cas d'usage : titres d'application, logos, textes légaux, menus de navigation qui ne changent pas après le montage.

À éviter : contenu qui peut changer en cours de session (données utilisateur, traductions dynamiques).

Vue 3.5 + le compilateur hoistent déjà les nœuds vraiment statiques (sans interpolation ni binding). `v-once` reste utile quand le nœud contient une interpolation mais dont la valeur ne changera plus après le montage.

### 2.3 `v-memo` — gel conditionnel

`v-memo` est plus fin que `v-once`. Il met en cache le sous-arbre tant que les valeurs de son tableau de dépendances n'ont pas changé.

```vue
<template>
  <!--
    v-memo="[post.id, post.likeCount, post.isSelected]"
    → Vue saute le diff et réutilise le vnode mis en cache
      TANT QUE ces trois valeurs ne changent pas.
    → Si post.updatedAt change mais pas ces trois valeurs,
      PostCard n'est PAS re-rendu. C'est intentionnel ici.
  -->
  <PostCard
    v-for="post in posts"
    :key="post.id"
    v-memo="[post.id, post.likeCount, post.isSelected]"
    :post="post"
  />
</template>
```

`v-memo` fonctionne par comparaison stricte (`===`) sur chaque élément du tableau. Si l'un change, le composant se re-rend normalement. Si aucun ne change, Vue réutilise le vnode précédent sans appeler la fonction render du composant.

**Avec `v-for` :** `v-memo` et `v-for` sont frères (sur le même élément). La directive `v-memo` est évaluée après que `v-for` a produit l'item courant.

**Tableau vide `v-memo="[]"` :** équivalent à `v-once` — le sous-arbre n'est jamais re-rendu. C'est rarement ce qu'on veut avec des données dynamiques.

**Edge case — liste réordonnée (tri) :** quand la liste est triée, `:key` peut changer pour une position donnée en même temps qu'une dépendance du tableau `v-memo`. Vue force un re-rendu complet dans ce cas — comportement correct mais qui peut surprendre. Si le tri est fréquent, inclure la propriété de tri dans le tableau `v-memo` ou reconsidérer si `v-memo` est pertinent sur une liste triée dynamiquement.

### 2.4 `computed` vs méthode — cache vs recalcul

C'est la distinction la plus fréquemment ratée en entretien.

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const posts = ref<Post[]>([])

// ✅ computed — résultat mis en cache
// Ne se recalcule QUE si posts.value change
// Appeler filteredPosts 100 fois dans le template → 1 seul calcul
const filteredPosts = computed(() =>
  posts.value.filter(p => p.isPublished)
)

// ❌ méthode — recalcul à chaque rendu
// Appeler getFilteredPosts() 1 fois dans le template → recalculé à chaque re-rendu du parent
function getFilteredPosts(): Post[] {
  return posts.value.filter(p => p.isPublished)
}
</script>

<template>
  <!-- computed : évalué une fois, mis en cache -->
  <PostCard v-for="p in filteredPosts" :key="p.id" :post="p" />

  <!-- ⚠️ Méthode dans v-for : appelée à chaque rendu du composant parent -->
  <!-- <PostCard v-for="p in getFilteredPosts()" :key="p.id" :post="p" /> -->
</template>
```

**Règle :** une valeur dérivée de l'état réactif = `computed`. Une action déclenchée par l'utilisateur = méthode.

**Cache invalidé quand :** une dépendance réactive lue PENDANT l'exécution du getter change. Vue détecte automatiquement les dépendances via le système de proxy.

### 2.5 `defineAsyncComponent` et code splitting Vite

Vite découpe automatiquement le bundle quand on utilise un import dynamique `() => import(...)`. `defineAsyncComponent` encapsule cet import pour l'utiliser comme un composant normal dans le template.

```ts
import { defineAsyncComponent } from 'vue'

// Forme simple — Vite crée un chunk séparé pour HeavyAnalytics
const HeavyAnalytics = defineAsyncComponent(
  () => import('@/components/analytics/HeavyAnalytics.vue')
)

// Forme complète — contrôle total du cycle de chargement
const HeavyAnalyticsFull = defineAsyncComponent({
  loader: () => import('@/components/analytics/HeavyAnalytics.vue'),
  // Affiché pendant le téléchargement du chunk
  loadingComponent: LoadingSpinner,
  // Affiché si le chargement échoue (réseau, 404...)
  errorComponent: ErrorBanner,
  // Délai avant d'afficher loadingComponent (évite un flash pour les chargements rapides)
  delay: 200,
  // Timeout après lequel errorComponent s'affiche
  timeout: 10_000,
})
```

```vue
<template>
  <!-- Suspense gère le fallback pendant le téléchargement -->
  <!-- Sans Suspense, il faut utiliser loadingComponent dans defineAsyncComponent -->
  <Suspense>
    <HeavyAnalytics :data="analyticsData" />
    <template #fallback>
      <LoadingSpinner />
    </template>
  </Suspense>
</template>
```

**Routes Vue Router :** le lazy loading par route est la forme la plus impactante — chaque vue est un chunk séparé téléchargé seulement quand l'utilisateur navigue vers elle.

```ts
// router/index.ts
const routes = [
  {
    path: '/feed',
    // Chunk séparé : feed~[hash].js — téléchargé seulement à /feed
    component: () => import('@/views/FeedView.vue'),
  },
  {
    path: '/admin',
    // Nommage du chunk Vite (commentaire magique)
    component: () => import(/* webpackChunkName: "admin" */ '@/views/AdminView.vue'),
  },
]
```

**Analyser le bundle :** `rollup-plugin-visualizer` génère une carte de chaleur des chunks après `pnpm build`. Identifier les dépendances qui pèsent plus de 50 Ko gzip est le premier geste de toute optimisation de bundle.

```ts
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    vue(),
    visualizer({ open: true, gzipSize: true, filename: 'dist/bundle-stats.html' }),
  ],
})
```

### 2.6 Virtualisation des longues listes

Afficher 500 nœuds DOM simultanément est toujours lent, quelle que soit l'optimisation côté Vue. La solution : ne rendre que les éléments **visibles à l'écran** (environ 20-30 selon la hauteur des items) et créer/détruire les autres à la volée pendant le scroll.

```bash
pnpm add @tanstack/vue-virtual
```

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'

const props = defineProps<{ posts: Post[] }>()

// Référence sur le conteneur scrollable
const scrollContainer = ref<HTMLDivElement | null>(null)

const virtualizer = useVirtualizer({
  // Nombre total d'items — pas forcément ceux dans le DOM
  count: computed(() => props.posts.length),
  // Élément HTML qui possède la scrollbar
  getScrollElement: () => scrollContainer.value,
  // Hauteur estimée d'une carte. Si les cartes ont des hauteurs variables,
  // utiliser estimateSize: (i) => estimatedHeights[i] ?? 120
  estimateSize: () => 120,
  // Marge de sécurité : pré-rendre N items supplémentaires hors écran
  overscan: 5,
})
</script>

<template>
  <!-- Conteneur scrollable : hauteur fixe obligatoire -->
  <div ref="scrollContainer" style="height: 600px; overflow-y: auto;">
    <!--
      Div "fantôme" : occupe la hauteur TOTALE de toute la liste (ex: 500 × 120px = 60 000px).
      Cela donne une scrollbar proportionnelle sans rendre tous les items.
    -->
    <div :style="{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }">
      <!--
        On boucle uniquement sur les items VISIBLES retournés par getVirtualItems().
        Chaque item est positionné de façon absolue via transform: translateY.
        La clé est row.key (stable même en cas de réordonnancement).
      -->
      <PostCard
        v-for="row in virtualizer.getVirtualItems()"
        :key="row.key"
        :post="props.posts[row.index]"
        :data-index="row.index"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${row.size}px`,
          transform: `translateY(${row.start}px)`,
        }"
      />
    </div>
  </div>
</template>
```

**Pourquoi `transform: translateY` et pas `top` :** `transform` utilise le GPU (layer composite) et ne provoque pas de layout recalculation. `top` dans un flux normal déclenche un reflow.

**API `@tanstack/vue-virtual` :** `getVirtualItems()` retourne les items visibles en tant que getter (tableau recalculé à chaque scroll). La propriété `virtualItems` était présente dans les versions antérieures à 3.x — utiliser `getVirtualItems()` dans les versions récentes.

### 2.7 `shallowRef` pour grosses structures immuables

`ref()` deep-track : chaque accès à une propriété imbriquée crée une dépendance. Sur un tableau de 500 posts avec 20 propriétés chacun, cela représente un graphe de dépendances lourd.

`shallowRef` ne surveille que l'assignation de `.value` lui-même, pas les mutations internes.

```ts
import { shallowRef, triggerRef } from 'vue'

// Utiliser shallowRef quand :
// - la structure est grande (500+ items)
// - on remplace toujours l'entière valeur (ex: rechargement depuis l'API)
// - on ne mute jamais les propriétés internes directement
const posts = shallowRef<Post[]>([])

// ✅ Remplacement complet → shallowRef le détecte, Vue re-rend
async function loadPosts(): Promise<void> {
  const data = await fetchPosts()
  posts.value = data   // Assignation de .value → réactif
}

// ❌ Mutation interne → shallowRef NE détecte PAS ce changement
// posts.value.push(newPost)       // silencieux : Vue ne re-rend pas

// ✅ Si mutation interne obligatoire → triggerRef pour forcer la notification
function addPostLocally(post: Post): void {
  posts.value.push(post)
  triggerRef(posts)  // Notifie Vue manuellement
}
```

**Quand préférer `shallowRef` à `ref` :** données rechargées en bloc depuis une API (liste de posts, résultats de recherche), structures de données immuables par convention (state Redux-like), données de visualisation (graphiques avec milliers de points).

**Quand garder `ref` :** formulaires avec champs imbriqués, objets fréquemment mutés propriété par propriété, toute situation où le deep tracking est une fonctionnalité (watchers sur propriétés imbriquées).

### 2.8 Mesurer — DevTools, Lighthouse, Core Web Vitals

**Règle d'or :** mesurer AVANT d'optimiser. Une optimisation non mesurée peut dégrader des performances ailleurs.

**Vue DevTools (onglet Performance) :**
1. Ouvrir l'app dans Chrome avec l'extension Vue DevTools installée
2. Aller dans l'onglet "Performance" des Vue DevTools (distinct du Performance de Chrome)
3. Cliquer "Start recording", déclencher l'action lente (scroll, like, navigation), "Stop"
4. Lire le flame chart : chaque barre = un composant re-rendu. La largeur = le temps CPU
5. Identifier les composants re-rendus sans raison (trop fréquents, trop longs)

**Chrome DevTools (onglet Performance) :**
- Enregistrer un profil pendant l'action problématique
- Chercher les "Long Tasks" (barres rouges au-dessus de 50 ms)
- Le panneau "Frames" montre les drops de FPS (objectif : 60 FPS = 16 ms/frame)

**Lighthouse (Chrome DevTools → Onglet Lighthouse) :**
- Audite la page complète et donne des scores (0-100) sur Performance, Accessibilité, SEO
- Métriques clés à surveiller :

| Métrique | Seuil "bon" | Description |
|----------|-------------|-------------|
| FCP (First Contentful Paint) | < 1.8 s | Premier contenu visible |
| LCP (Largest Contentful Paint) | < 2.5 s | Plus grand élément visible |
| TBT (Total Blocking Time) | < 200 ms | Thread principal bloqué |
| CLS (Cumulative Layout Shift) | < 0.1 | Stabilité visuelle |

**`performance.mark()` pour mesures custom :**

```ts
// Dans un composant Vue
onMounted(() => {
  performance.mark('feed-mounted')
  performance.measure('feed-load', 'navigationStart', 'feed-mounted')
  const [measure] = performance.getEntriesByName('feed-load')
  console.log(`Feed chargé en ${measure.duration.toFixed(0)} ms`)
})
```

### 2.9 Vue 3.5 + compilateur — ce que le compilateur fait déjà

Le compilateur Vue 3 effectue plusieurs optimisations automatiques qui réduisent le besoin de mémoïsation manuelle :

**Static hoisting :** les nœuds sans binding réactif sont extraits hors de la fonction render et réutilisés entre rendus sans recréation.

**Tree flattening (PatchFlag) :** le compilateur annote chaque nœud avec un `PatchFlag` qui indique quelles propriétés peuvent changer. Le diff ne vérifie QUE ces propriétés — pas l'arbre complet.

**v-once implicite pour le contenu vraiment statique :** un élément sans aucune expression ni binding est automatiquement traité comme statique. Pas besoin de `v-once` sur `<h1>TribuZen</h1>` par exemple.

**Vapor mode (expérimental, Vue 3.5+) :** nouveau mode de compilation qui élimine le Virtual DOM pour les composants opt-in. Génère du code impératif qui manipule le DOM directement. Gains mesurés : ~30-50% moins de mémoire, updates plus rapides pour les composants à haute fréquence.

```vue
<!-- Vapor est opt-in par composant — même syntaxe SFC, compilateur différent -->
<!-- Status 2026 : expérimental, pas recommandé en production -->
<script setup vapor lang="ts">
// Même code — le compilateur choisit la stratégie
</script>
```

**Implication pratique :** `v-once` et `v-memo` restent nécessaires pour les cas que le compilateur ne peut pas déduire (données potentiellement changeantes mais qu'on choisit volontairement de figer). Pour le contenu vraiment statique, le compilateur gère.

### 2.10 KeepAlive — conserver les composants entre navigations

`<KeepAlive>` est un composant Vue built-in qui met en **cache** les composants dynamiques au lieu de les détruire quand ils sont retirés du DOM. À la réactivation, l'état est restauré instantanément — aucune requête, aucun reset du formulaire, aucun recalcul.

**Cas d'usage principal — navigation par onglets :**

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import TabFeed from './TabFeed.vue'
import TabAlbums from './TabAlbums.vue'
import TabCalendar from './TabCalendar.vue'

const tabs = [
  { id: 'feed', label: 'Fil', component: TabFeed },
  { id: 'albums', label: 'Albums', component: TabAlbums },
  { id: 'calendar', label: 'Calendrier', component: TabCalendar },
]
// shallowRef : les composants eux-mêmes ne sont pas des données réactives à deep-tracker
const currentTab = shallowRef(TabFeed)
</script>

<template>
  <nav>
    <button
      v-for="tab in tabs"
      :key="tab.id"
      @click="currentTab = tab.component"
    >
      {{ tab.label }}
    </button>
  </nav>

  <!--
    Sans KeepAlive : chaque changement d'onglet détruit le composant actif
    et monte le nouveau → perte de l'état (scroll, données chargées, formulaire).

    Avec KeepAlive : le composant est mis en pause et conservé en mémoire.
    :max="3" = stratégie LRU — au-delà de 3 composants en cache,
    le moins récemment utilisé est détruit (onUnmounted appelé).
  -->
  <KeepAlive :max="3">
    <component :is="currentTab" />
  </KeepAlive>
</template>
```

**Hooks de cycle de vie spécifiques :**

Les composants mis en cache ne sont pas "montés" / "démontés" à chaque visite — ils sont **activés** et **désactivés**. `onMounted` et `onUnmounted` ne se déclenchent qu'une seule fois (au premier montage / à la destruction définitive par LRU).

```ts
// TabFeed.vue
import { onActivated, onDeactivated, onMounted } from 'vue'

onMounted(() => {
  // Exécuté UNE SEULE FOIS — premier montage dans le DOM
  console.log('TabFeed monté pour la première fois')
})

onActivated(() => {
  // Exécuté à CHAQUE activation (retour du cache ou premier montage)
  // → bon endroit pour rafraîchir des données time-sensitive
  //   (flux WebSocket, notifications, données avec TTL court)
  refreshFeed()
})

onDeactivated(() => {
  // Exécuté quand le composant part en cache (onglet quitté)
  // → bon endroit pour pauser les timers, les souscriptions WebSocket
  pauseWebSocketSubscription()
})
```

**Filtrage `include` / `exclude` :**

```vue
<!-- Ne met en cache QUE les composants dont le name option = TabFeed ou TabAlbums -->
<KeepAlive include="TabFeed,TabAlbums">
  <component :is="currentTab" />
</KeepAlive>

<!-- Cache tout SAUF TabCalendar (données fraîches à chaque visite obligatoire) -->
<KeepAlive exclude="TabCalendar">
  <component :is="currentTab" />
</KeepAlive>
```

`include` / `exclude` comparent le `name` du composant (défini via `defineOptions({ name: 'TabFeed' })` dans `<script setup>` ou implicitement par le nom du fichier SFC).

**Résumé KeepAlive :**

| Scénario | Recommandation |
|---|---|
| Navigation par onglets avec état formulaire | `<KeepAlive>` — évite le reset |
| Onglet avec données ultra-fraîches (chat en direct) | `exclude` ou pas de KeepAlive — forcer le rechargement |
| Mémoire limitée (mobile) | `:max="2"` ou `":max="3"` selon les composants |
| Onglet rarement visité | `exclude` — économise la mémoire |

---

## 3. Worked examples

### Exemple 1 — `v-memo` sur `PostCard` dans le feed TribuZen

**Problème :** un like sur n'importe quel post déclenche le re-rendu de tous les `PostCard`.

**Diagnostic :** Vue DevTools → Performance → "Start", liker un post, "Stop" → 500 composants marqués "re-rendered".

**Correction :**

```vue
<!-- FeedList.vue — avant -->
<script setup lang="ts">
import { defineProps } from 'vue'
import PostCard from './PostCard.vue'

const props = defineProps<{ posts: Post[] }>()
</script>

<template>
  <!-- ❌ Sans v-memo : tous les PostCard se re-rendent quand posts change -->
  <PostCard
    v-for="post in props.posts"
    :key="post.id"
    :post="post"
  />
</template>
```

```vue
<!-- FeedList.vue — après -->
<script setup lang="ts">
import PostCard from './PostCard.vue'

const props = defineProps<{ posts: Post[] }>()
</script>

<template>
  <!--
    v-memo="[post.id, post.likeCount, post.commentCount, post.isSelected]"

    Lecture : "ne re-rends cette PostCard que si l'une de ces quatre valeurs change".
    Un like sur le post m1 → post.likeCount de m1 change → seule la carte m1 re-rend.
    Les 499 autres cartes → v-memo identique → sauter le diff → 0 ms de travail.

    ⚠️ La liste de dépendances doit être EXHAUSTIVE :
    si une propriété affichée dans PostCard n'est pas listée ici,
    ses changements seront silencieusement ignorés (stale render).
  -->
  <PostCard
    v-for="post in props.posts"
    :key="post.id"
    v-memo="[post.id, post.likeCount, post.commentCount, post.isSelected]"
    :post="post"
  />
</template>
```

**Résultat mesuré (DevTools) :**

```
Avant : like → 500 re-rendus → 620 ms
Après : like → 1 re-rendu  →   3 ms
```

**Pourquoi `post.id` est dans le tableau :** si Vue réordonne la liste (nouveau post en tête), `post.id` change pour la position et force un rendu complet de la carte — comportement correct.

---

### Exemple 2 — Virtualisation du feed avec `@tanstack/vue-virtual`

**Problème :** 500 `PostCard` dans le DOM → 500 nœuds × N éléments internes chacun → layout coûteux au scroll.

**Baseline mesurée :** scroll de 5 secondes → 28 "Long Tasks" dans Chrome DevTools → 15 FPS moyen.

```vue
<!-- VirtualFeed.vue — composant de feed virtualisé complet -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import PostCard from './PostCard.vue'

const props = defineProps<{
  posts: Post[]
}>()

// Référence sur l'élément scrollable — useTemplateRef (Vue 3.5)
const scrollEl = ref<HTMLDivElement | null>(null)

// Hauteur estimée d'une PostCard. Les cartes avec image sont plus hautes (~200px),
// celles sans image (~100px). On prend une valeur médiane.
// TanStack Virtual corrige dynamiquement après mesure réelle.
const ESTIMATED_HEIGHT = 140

const virtualizer = useVirtualizer({
  count: computed(() => props.posts.length),
  getScrollElement: () => scrollEl.value,
  estimateSize: () => ESTIMATED_HEIGHT,
  overscan: 3, // Pré-rendre 3 items au-delà de la fenêtre visible (haut + bas)
})

// Items visibles — recalculés automatiquement à chaque scroll
const virtualItems = computed(() => virtualizer.value.getVirtualItems())
const totalHeight = computed(() => virtualizer.value.getTotalSize())
</script>

<template>
  <!-- Conteneur scrollable : hauteur fixe ou 100vh selon le layout -->
  <div
    ref="scrollEl"
    class="feed-scroll-container"
    style="height: 100vh; overflow-y: auto; contain: strict;"
  >
    <!--
      Le div "fantôme" représente la hauteur totale de tous les posts.
      La scrollbar reflète la liste entière (ex: 500 × 140px = 70 000px).
      Sans lui, la scrollbar serait trop courte ou inexistante.
    -->
    <div :style="{ height: `${totalHeight}px`, position: 'relative' }">
      <!--
        Boucle uniquement sur les items VISIBLES (~20-30 selon la hauteur).
        row.key : clé stable (≠ row.index si la liste est triée dynamiquement).
        row.start : position absolue en px depuis le haut du fantôme.
        row.size : hauteur mesurée ou estimée de cet item.
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
      />
    </div>
  </div>
</template>

<style scoped>
/* contain: strict indique au navigateur que ce conteneur est isolé :
   les changements internes ne provoquent pas de reflow global de la page. */
.feed-scroll-container {
  contain: strict;
}
</style>
```

**Résultat mesuré :**

```
Avant : 500 nœuds DOM, scroll → 28 Long Tasks, ~15 FPS
Après : ~25 nœuds DOM, scroll → 2 Long Tasks, ~58 FPS
```

**Combinaison avec `v-memo` :** les deux s'appliquent sur `PostCard`. La virtualisation réduit le nombre de nœuds dans le DOM. `v-memo` réduit le nombre de re-rendus sur les nœuds présents. Ce sont des axes orthogonaux — les deux valent.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Optimiser sans mesurer

```vue
<!-- ❌ Ajouter v-memo partout "par précaution" -->
<template>
  <!-- v-memo sur un composant simple qui se re-rend en 0.2 ms -->
  <!-- Overhead de v-memo : ~0.1 ms de comparaison par item -->
  <!-- Gain net négatif pour les composants légers -->
  <SimpleLabel
    v-for="tag in tags"
    :key="tag.id"
    v-memo="[tag.id, tag.label, tag.color, tag.icon, tag.tooltip, tag.href]"
    :tag="tag"
  />
</template>
```

**Le correct :** mesurer avec Vue DevTools avant d'ajouter `v-memo`. Si le composant se re-rend en moins de 1 ms, `v-memo` n'apporte rien. Il devient utile quand le composant est coûteux (rendu > 5 ms) et que les re-rendus inutiles sont nombreux.

---

### PIÈGE #2 — `computed` avec effet de bord

```ts
// ❌ Effet de bord dans un computed — comportement indéterminé
const filteredPosts = computed(() => {
  // ❌ Appel API dans un getter computed → appelé à chaque accès, pas qu'aux changements
  trackAnalytics('feed-filtered')          // effet de bord
  lastFilterTime.value = Date.now()        // mutation d'une autre ref → boucle potentielle

  return posts.value.filter(p => p.isPublished)
})
```

**Le correct :** un getter `computed` doit être **pur** — pas d'effet de bord, pas de mutation. Pour les effets déclenchés par un changement d'état, utiliser `watch` ou `watchEffect`.

```ts
// ✅ computed pur
const filteredPosts = computed(() =>
  posts.value.filter(p => p.isPublished)
)

// ✅ watch pour les effets de bord liés au changement
watch(filteredPosts, () => {
  trackAnalytics('feed-filtered')
  lastFilterTime.value = Date.now()
})
```

---

### PIÈGE #3 — `v-memo` avec dépendances incomplètes (stale render)

```vue
<!-- ❌ PostCard affiche post.title et post.mediaUrl,
     mais ils ne sont pas dans le tableau v-memo -->
<template>
  <PostCard
    v-for="post in posts"
    :key="post.id"
    v-memo="[post.id, post.likeCount]"
    :post="post"
  />
</template>
```

**Symptôme :** un utilisateur édite le titre d'un post (`post.title` change). Le tableau v-memo ne change pas (`post.id` et `post.likeCount` sont identiques). Vue réutilise le vnode mis en cache. L'ancien titre s'affiche — stale render silencieux.

**Le correct :** inclure dans le tableau TOUTES les propriétés affichées par `PostCard`.

```vue
<template>
  <PostCard
    v-for="post in posts"
    :key="post.id"
    v-memo="[post.id, post.title, post.mediaUrl, post.likeCount, post.commentCount, post.isSelected]"
    :post="post"
  />
</template>
```

Si la liste des propriétés est longue, envisager une propriété `post.updatedAt` (timestamp de dernière modification) comme proxy unique.

---

### PIÈGE #4 — `shallowRef` + mutation interne sans `triggerRef`

```ts
// ❌ Mutation interne d'un shallowRef — Vue ne détecte pas le changement
const posts = shallowRef<Post[]>([])

function likePost(postId: string): void {
  const post = posts.value.find(p => p.id === postId)
  if (post) {
    post.likeCount++    // Mutation interne : shallowRef ne voit pas ça
  }
  // Vue ne re-rend pas — l'interface reste figée sur l'ancien likeCount
}
```

**Le correct (option A — remplacement immutable) :**

```ts
function likePost(postId: string): void {
  posts.value = posts.value.map(p =>
    p.id === postId ? { ...p, likeCount: p.likeCount + 1 } : p
  )
  // Assignation de posts.value → shallowRef le détecte → Vue re-rend
}
```

**Le correct (option B — mutation + `triggerRef`) :**

```ts
import { triggerRef } from 'vue'

function likePost(postId: string): void {
  const post = posts.value.find(p => p.id === postId)
  if (post) post.likeCount++
  triggerRef(posts)  // Notifie Vue manuellement de vérifier posts.value
}
```

L'option A (immutable) est plus prévisible. L'option B est utile quand les mutations en place sont inévitables (performance critique, structures partagées).

---

## 5. Ancrage TribuZen

Dans le front-office TribuZen, ce module s'applique sur trois composants concrets :

**`VirtualFeed.vue`** — le feed famille est la vue la plus utilisée (première page après login). Avec des familles actives qui ont 200-1 000 posts, la virtualisation via `@tanstack/vue-virtual` est non négociable. La référence `scrollEl` pointe sur le conteneur scrollable, `useVirtualizer` ne rend que les `PostCard` visibles.

**`PostCard.vue`** dans `VirtualFeed.vue` — `v-memo` sur `[post.id, post.title, post.mediaUrl, post.likeCount, post.commentCount, post.isSelected]`. Un like en temps réel (WebSocket) ne re-rend que la carte concernée.

**`HeavyAnalytics.vue`** — accessible via le menu "Statistiques famille" (rarement visité). Chargé via `defineAsyncComponent` avec un `LoadingSpinner` en fallback et un `delay: 200` pour éviter le flash. Le bundle initial de TribuZen reste sous 180 Ko gzip grâce à ce split.

```
tribuzen/
  src/
    views/
      FeedView.vue              ← importe VirtualFeed.vue
    components/
      feed/
        VirtualFeed.vue         ← useVirtualizer + shallowRef posts
        PostCard.vue            ← reçoit :post, v-memo dans le parent
      analytics/
        HeavyAnalytics.vue      ← chargé en lazy via defineAsyncComponent
```

**Commit cible TribuZen :**
```
perf(feed): virtualiser le feed famille + v-memo sur PostCard
```

---

## 6. Points clés

1. Mesurer avant d'optimiser — Vue DevTools Performance tab, puis Chrome DevTools, puis Lighthouse.
2. `v-once` fige un sous-arbre définitivement — utile pour le contenu immuable après montage, superflu pour le contenu vraiment statique (compilateur le gère déjà).
3. `v-memo="[a, b, c]"` cache le sous-arbre tant que `a`, `b`, `c` sont `===` à leur valeur précédente — comparaison stricte, tableau EXHAUSTIF.
4. `computed` est mis en cache et ne se recalcule que si ses dépendances changent — une méthode appelée dans le template se recalcule à chaque rendu.
5. `defineAsyncComponent(() => import(...))` crée un chunk Vite séparé — chargé à la demande, pas au démarrage.
6. La virtualisation des listes (`@tanstack/vue-virtual`) ne rend que les items visibles — nécessaire dès 200-300 items avec des composants non triviaux.
7. `shallowRef` ne surveille que l'assignation de `.value` — pour les mutations internes, utiliser le pattern immutable ou `triggerRef`.
8. Vue 3.5 + compiler optimisations (static hoisting, PatchFlags) réduisent le besoin de `v-once` sur le contenu vraiment statique — Vapor mode reste expérimental en 2026.
9. `<KeepAlive :max="N">` met en cache les composants dynamiques — `onActivated` se déclenche à chaque retour du cache, `onDeactivated` quand le composant y entre. `onMounted` ne se déclenche qu'une fois.

---

## 7. Seeds Anki

```
Quelle est la différence entre v-once et v-memo ?|v-once fige le sous-arbre définitivement après le premier rendu (suppression des dépendances). v-memo le met en cache conditionnellement : re-rend seulement si une valeur du tableau de dépendances change (comparaison ===).
Pourquoi un computed est-il plus performant qu'une méthode dans un template ?|computed est mis en cache : le getter ne s'exécute que si ses dépendances réactives changent. Une méthode appelée dans le template s'exécute à chaque re-rendu du composant, même si les données n'ont pas changé.
Que se passe-t-il si le tableau de dépendances de v-memo est incomplet ?|Stale render silencieux : si une propriété affichée par le composant change mais n'est pas dans le tableau v-memo, Vue réutilise le vnode en cache et l'interface reste figée sur l'ancienne valeur.
Quand utiliser shallowRef plutôt que ref ?|Quand la structure est grande (tableau de 200+ objets), qu'on remplace toujours la valeur entière (ex: rechargement API) et qu'on n'a pas besoin de réactivité sur les propriétés internes. shallowRef réduit la charge du graphe de dépendances.
Comment forcer Vue à détecter une mutation interne d'un shallowRef ?|Appeler triggerRef(maRef) après la mutation. Alternative : pattern immutable (remplacer par une nouvelle valeur via map/spread) qui déclenche shallowRef naturellement.
Qu'est-ce que defineAsyncComponent apporte par rapport à un import dynamique brut ?|defineAsyncComponent encapsule l'import dynamique en un composant utilisable dans le template, avec gestion des états (loading, error) via loadingComponent/errorComponent, delay et timeout. Vite crée automatiquement un chunk séparé pour le fichier importé.
Quel outil Vue permet d'identifier les composants qui se re-rendent trop souvent ?|Vue DevTools → onglet Performance. On enregistre une action (scroll, interaction), puis le flame chart montre quels composants ont été re-rendus et combien de temps chacun a pris.
Pourquoi la virtualisation d'une longue liste utilise-t-elle un div "fantôme" à hauteur totale ?|Pour donner à la scrollbar une hauteur proportionnelle à la liste entière, même si seuls 20-30 items sont dans le DOM. Sans lui, la scrollbar reflète seulement les items rendus (~20) et non les 500 réels.
Quelle est la différence entre onMounted et onActivated dans un composant sous KeepAlive ?|onMounted s'exécute UNE SEULE FOIS au premier montage dans le DOM. onActivated s'exécute à chaque fois que le composant est réactivé depuis le cache (retour sur l'onglet). Pour rafraîchir des données à chaque visite, utiliser onActivated, pas onMounted.
À quoi sert l'attribut :max sur KeepAlive ?|:max="N" limite le nombre de composants simultanément en cache. Vue utilise une stratégie LRU (Least Recently Used) : quand la limite est atteinte, le composant le moins récemment affiché est détruit (onUnmounted appelé) pour libérer la mémoire.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-21-performance/README.md`. Tu pars d'un `FeedList` naïf avec 500 posts, tu mesures la baseline avec Vue DevTools, puis tu appliques `v-memo`, la virtualisation et le lazy loading de `HeavyAnalytics` — avec mesures avant/après à chaque étape.
