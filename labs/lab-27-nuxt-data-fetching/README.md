# Lab 27 — Nuxt : data fetching SSR

> **Outcome :** à la fin, tu sais charger des données en SSR avec `useAsyncData` (clé stable, `transform`, `default`), déclencher un re-fetch après une mutation `$fetch`, et configurer `routeRules` ISR dans `nuxt.config.ts` — sans double requête.
> **Vrai outil :** Nuxt 3.x (`nuxt dev` puis `nuxt build && nuxt preview` pour ISR).
> **Feedback :** le coach valide en session — DevTools Network prouve l'absence de double requête, DevTools Application vérifie `window.__NUXT__`.

---

## Énoncé

Tu construis la section **Contenus** de TribuZen : une page liste et une page détail chargées en SSR depuis une API publique. L'objectif est de maîtriser toute la chaîne : clé stable → payload → hydratation → pas de double fetch → ISR pour le cache CDN.

**API mock utilisée :** `https://jsonplaceholder.typicode.com`
- `GET /posts` → tableau de posts `{ id, title, body, userId }`
- `GET /posts/:id` → un post
- `POST /posts` → simule un ajout (retourne un objet avec `id: 101`)

**Pages à créer :**

1. `pages/contenus/index.vue` — liste des contenus (SSR + `useAsyncData`)
2. `pages/contenus/[id].vue` — détail d'un contenu (SSR + `useAsyncData` avec clé dynamique + `watch`)

**Configuration :**

3. `nuxt.config.ts` — `routeRules` avec ISR sur `/contenus/**`

**Pas de gap-fill** — tu écris les trois fichiers complets à partir du starter minimal ci-dessous.

### Starter minimal

Dans un projet Nuxt 3 existant (ou créé via `npx nuxi@latest init lab-27`) :

```
pages/
  contenus/
    index.vue       ← à créer
    [id].vue        ← à créer
nuxt.config.ts      ← à modifier
```

Lance `nuxt dev` et branche `/contenus` dans la navbar (ou accède directement par l'URL).

---

## Étapes (en friction)

### Partie A — Page liste avec `useAsyncData`

1. **Déclare l'interface `Post`** dans `pages/contenus/index.vue` :
   ```ts
   interface Post {
     id: number
     title: string
     body: string
     userId: number
   }
   ```

2. **Charge les posts avec `useAsyncData`** — clé explicite `'contenus-list'`, handler `$fetch`, `transform` pour ne garder que les 10 premiers posts et passer le titre en majuscules, `default: () => []`.

3. **Ajoute le template** : état de chargement (`pending`), état d'erreur (`error`), liste (`v-for` sur `data`, `:key` sur `post.id`), empty state si la liste est vide.

4. **Ajoute un bouton "Simuler un ajout"** qui :
   - Appelle `$fetch('https://jsonplaceholder.typicode.com/posts', { method: 'POST', body: { title: 'Nouveau contenu', userId: 1 } })`
   - Puis appelle `refresh()` pour déclencher un re-fetch de la liste

5. **Vérifie dans DevTools Network** : au rechargement de la page (`F5`), l'onglet Fetch/XHR ne montre **aucun appel** vers `jsonplaceholder.typicode.com/posts` — les données viennent de `window.__NUXT__`.

### Partie B — Page détail avec clé dynamique

6. **Dans `pages/contenus/[id].vue`** : récupère le paramètre `id` via `useRoute()`, caste-le en `computed` string.

7. **Charge le post avec `useAsyncData`** — clé `\`contenu-\${id.value}\``, handler `$fetch(\`.../${id.value}\`)`, option `watch: [id]`.

8. **Ajoute un lien "Contenu suivant"** qui navigue vers `/contenus/${post.id + 1}` — vérifie que le `watch` relance le fetch sans rechargement de page.

9. **Gère l'erreur 404** : si `data.value` est null après résolution, appelle `createError({ statusCode: 404, fatal: true })`.

### Partie C — ISR via `routeRules`

10. **Dans `nuxt.config.ts`**, ajoute `routeRules: { '/contenus/**': { isr: 3600 } }`.

11. **Builder et prévisualiser** : `nuxt build && nuxt preview`. Accède à `/contenus` et observe dans DevTools Network les headers de la réponse — cherche `Cache-Control` ou `X-Nitro-Cache`.

---

## Corrigé complet commenté

### `pages/contenus/index.vue`

```vue
<script setup lang="ts">
// Interface décrivant la forme d'un post JSONPlaceholder
interface Post {
  id: number
  title: string
  body: string
  userId: number
}

// useAsyncData avec clé explicite 'contenus-list'
// Clé fixe (page sans paramètre dynamique) → identique serveur et client → payload récupéré → pas de double fetch
const {
  data: posts,     // Ref<Post[] | null> — null jusqu'à résolution (Nuxt 3)
  pending,         // Ref<boolean>
  error,           // Ref<FetchError | null>
  refresh,         // () => Promise<void>
} = await useAsyncData<Post[]>(
  'contenus-list',  // clé explicite, stable, unique dans l'app
  () => $fetch<Post[]>('https://jsonplaceholder.typicode.com/posts'),
  {
    // transform : appelée UNE FOIS côté serveur après fetch, résultat stocké dans le payload
    // → le client reçoit les données déjà transformées, pas la réponse brute
    transform: (allPosts) =>
      allPosts
        .slice(0, 10)                         // garder seulement les 10 premiers
        .map((p) => ({ ...p, title: p.title.toUpperCase() })),  // titre en majuscules

    // default : valeur initiale de data avant résolution
    // Évite les null checks dans le template (v-for sur [] est sûr)
    default: () => [] as Post[],
  }
)

// Mutation simulée avec $fetch + refresh
// $fetch = appel direct, hors cycle SSR — utilisé ici pour une action utilisateur
async function simulerAjout(): Promise<void> {
  const nouveau = await $fetch<{ id: number }>('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    body: { title: 'Nouveau contenu TribuZen', body: 'Corps du contenu', userId: 1 },
  })
  console.log('Post créé (simulé) :', nouveau.id)

  // refresh() relance le useAsyncData 'contenus-list' → data.value mis à jour
  // Sans refresh(), l'affichage resterait sur les anciennes données
  await refresh()
}
</script>

<template>
  <div class="contenus">
    <h1>Contenus TribuZen</h1>

    <!-- État de chargement — visible en lazy ou sur clients lents -->
    <p v-if="pending">Chargement des contenus…</p>

    <!-- État d'erreur -->
    <div v-else-if="error" class="error">
      <p>Erreur {{ error.statusCode }} — {{ error.statusMessage }}</p>
    </div>

    <!-- Empty state — quand posts est vide (ne devrait pas arriver ici, mais bonne pratique) -->
    <p v-else-if="!posts || posts.length === 0">Aucun contenu pour l'instant.</p>

    <!-- Liste principale — v-else garantit que posts est non-null et non-vide -->
    <ul v-else>
      <!--
        v-for sur la ref posts (auto-unwrap dans le template)
        :key sur post.id — identifiant stable métier
        NuxtLink génère un <a> avec prefetch automatique en Nuxt
      -->
      <li v-for="post in posts" :key="post.id">
        <NuxtLink :to="`/contenus/${post.id}`">
          {{ post.title }}
        </NuxtLink>
      </li>
    </ul>

    <!-- Bouton mutation : $fetch POST + refresh de la liste -->
    <button @click="simulerAjout" :disabled="pending">
      Simuler un ajout
    </button>
  </div>
</template>

<style scoped>
.contenus { max-width: 640px; margin: 0 auto; padding: 1rem; }
ul { list-style: none; padding: 0; }
li { margin-bottom: 0.5rem; }
a { color: #3b82f6; text-decoration: none; }
a:hover { text-decoration: underline; }
.error { color: #ef4444; }
button { margin-top: 1rem; padding: 0.5rem 1rem; cursor: pointer; }
button:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
```

### `pages/contenus/[id].vue`

```vue
<script setup lang="ts">
interface Post {
  id: number
  title: string
  body: string
  userId: number
}

const route = useRoute()

// computed pour le paramètre : String() garantit string (route.params.id est string | string[])
// computed (et non const) : réactif → si route change sans rechargement, id.value se met à jour
const id = computed(() => String(route.params.id))

const {
  data: post,
  pending,
  error,
} = await useAsyncData<Post>(
  // Clé dynamique basée sur id.value — MÊME clé serveur et client pour ce même paramètre
  // Exemple : id = "3" → clé = "contenu-3" → payload contient window.__NUXT__["contenu-3"]
  `contenu-${id.value}`,
  () => $fetch<Post>(`https://jsonplaceholder.typicode.com/posts/${id.value}`),
  {
    // watch : quand id.value change (navigation /contenus/3 → /contenus/4 via NuxtLink),
    // useAsyncData re-exécute le handler avec la nouvelle valeur d'id
    watch: [id],
  }
)

// Erreur 404 — si l'API retourne une erreur ou si post est null après résolution
// createError avec fatal: true → interrompt le rendu, affiche pages/error.vue
if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 404,
    statusMessage: 'Contenu introuvable',
    fatal: true,
  })
}
</script>

<template>
  <div class="detail">
    <NuxtLink to="/contenus">← Retour à la liste</NuxtLink>

    <div v-if="pending">Chargement du contenu…</div>

    <article v-else-if="post">
      <h1>{{ post.title }}</h1>
      <p class="meta">Auteur #{{ post.userId }} · ID {{ post.id }}</p>
      <p>{{ post.body }}</p>

      <!-- Navigation entre contenus — NuxtLink déclenche une navigation SPA
           Le watch: [id] dans useAsyncData relancera le fetch automatiquement -->
      <div class="nav-entre-contenus">
        <NuxtLink v-if="post.id > 1" :to="`/contenus/${post.id - 1}`">
          ← Contenu précédent
        </NuxtLink>
        <NuxtLink v-if="post.id < 100" :to="`/contenus/${post.id + 1}`">
          Contenu suivant →
        </NuxtLink>
      </div>
    </article>
  </div>
</template>

<style scoped>
.detail { max-width: 640px; margin: 0 auto; padding: 1rem; }
.meta { color: #64748b; font-size: 0.875rem; margin-bottom: 1rem; }
.nav-entre-contenus { display: flex; gap: 1rem; margin-top: 2rem; }
a { color: #3b82f6; }
</style>
```

### `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  // devtools: { enabled: true },

  routeRules: {
    // ISR 1h sur toutes les pages /contenus/**
    // Premier accès → SSR + génération HTML + _payload.json → mis en cache CDN
    // Accès suivants (TTL valide) → servis par CDN, aucune exécution serveur
    // Après 3600s → prochaine requête sert le stale + régénération en arrière-plan
    '/contenus/**': { isr: 3600 },

    // La liste /contenus elle-même : SWR 5min (données agrégées, refresh plus fréquent)
    // Note : règle plus spécifique que '/contenus/**' — les deux s'appliquent selon Nitro,
    // la règle la plus spécifique gagne
    '/contenus': { swr: 300 },
  },
})
```

**Vérification anti-double-fetch (étape clé) :**

1. `nuxt dev` → accès à `/contenus` → ouvrir DevTools → onglet Network → filtre "Fetch/XHR"
2. Recharger la page (`F5`)
3. **Résultat attendu :** aucun appel vers `jsonplaceholder.typicode.com` dans Network — les données viennent de `window.__NUXT__` embarqué dans le HTML
4. Vérifier dans DevTools → onglet Application → Storage → `window.__NUXT__` → observer la clé `"contenus-list"` avec les données transformées

**Tester ISR :**

```bash
nuxt build && nuxt preview
```

Accéder à `/contenus`, observer les headers HTTP dans DevTools Network → `Cache-Control: max-age=3600, stale-while-revalidate`.

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — en 30 minutes, sans ouvrir le corrigé :**

1. **Pagination** : ajouter une ref `page = ref(1)`, passer `{ _page: page, _limit: 5 }` en `query` dans `useAsyncData`, ajouter des boutons "Page précédente / Page suivante" qui modifient `page.value`. Le `watch: [page]` doit relancer le fetch automatiquement.

2. **Filtrage côté client** : ajouter une ref `search = ref('')`, un `computed filteredPosts` qui filtre `posts.value` sur `post.title.toLowerCase().includes(search.value.toLowerCase())`. Afficher le résultat filtré (pas de re-fetch : filtre local sur les données déjà chargées).

3. **`getCachedData` (Nuxt 4)** : ajouter l'option suivante à `useAsyncData` pour éviter de re-fetcher si les données sont déjà dans le payload ou le cache de la page :
   ```ts
   getCachedData: (key, nuxtApp) =>
     nuxtApp.static.data[key] ?? nuxtApp.payload.data[key]
   ```

**Critère de réussite :** la pagination fonctionne avec re-fetch automatique, le filtre fonctionne en local (sans appel réseau supplémentaire), et DevTools Network ne montre toujours aucun double-fetch au chargement initial.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, les patterns de ce lab s'appliquent directement :

**Structure cible :**

```
tribuzen/
  nuxt.config.ts                  ← routeRules ISR/SWR (cf. Exemple 2 du module)
  pages/
    articles/
      index.vue                   ← useAsyncData('articles-list', ...) + transform
      [slug].vue                  ← useAsyncData(`article-${slug}`, ...) + watch
    profils/
      [username].vue              ← useAsyncData(`profil-${username}`, ...) + watch + createError 404
```

**Différences par rapport au lab :**

- L'API ne sera pas JSONPlaceholder mais les server routes NestJS (module 28) ou les API Nitro internes (`server/api/articles/index.get.ts`).
- `transform` sera plus riche : formatage de dates, jointure author → avatar URL, etc.
- La gestion d'erreur utilisera `<NuxtErrorBoundary>` au niveau du layout pour capturer les erreurs non-fatales sans rediriger vers `/error`.

**Commit cible :**

```
feat(contenus): pages liste+détail SSR — useAsyncData clé stable, transform, routeRules ISR
```
