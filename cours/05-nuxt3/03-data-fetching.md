# 03 — Data Fetching (récupérer des données)

---

> **🔄 Rappel du cours précédent**
> Avant de continuer, vérifie que tu peux répondre à ces questions :
> 1. Où place-t-on les fichiers de pages dans un projet Nuxt ?
> 2. Quel composant utilise-t-on dans un layout pour afficher le contenu de la page ?
> 
> <details>
> <summary>Vérifier mes réponses</summary>
>
> 1. Dans le dossier `pages/` à la racine du projet
> 2. `<NuxtPage />` (ou `<slot />` dans les layouts)
> </details>

---

## C'est quoi le "Data Fetching" ?

Le **data fetching**, c'est le fait d'aller **chercher des données sur un serveur** pour les afficher sur ta page.

> **Analogie** : imagine un restaurant.
> - Toi (le navigateur) = le client assis à la table
> - Le serveur du restaurant (l'API) = la cuisine
> - Le data fetching = tu passes une **commande** à la cuisine, et la cuisine te **renvoie** ton plat
>
> En web, ça donne : ton site web **envoie une requête** à un serveur, et le serveur **renvoie des données** (souvent en format JSON).

---

## Rappel : C'est quoi une API ?

Une **API** (Application Programming Interface), c'est un point d'accès sur un serveur qui te permet de récupérer ou d'envoyer des données.

```
Ton site (le client)              Le serveur (l'API)
─────────────────                 ──────────────────

  "Donne-moi la liste            Le serveur cherche
   des articles"      ──────►    dans sa base de données
   GET /api/posts                       │
                                        ▼
  Reçoit les données   ◄──────   Renvoie les données
  [                                     en JSON
    { id: 1, title: "Mon article" },
    { id: 2, title: "Un autre" }
  ]
```

### Rappel : C'est quoi le JSON ?

Le **JSON** (JavaScript Object Notation), c'est un format de données. Ça ressemble beaucoup aux objets JavaScript :

```json
{
  "id": 1,
  "title": "Mon premier article",
  "body": "Le contenu de l'article..."
}
```

> C'est le format standard pour échanger des données entre un site web et un serveur.

---

## Pourquoi Nuxt a ses propres outils de data fetching ?

### En JavaScript classique, on utilise `fetch()` :

```ts
// ⚠️ Ceci fonctionne, mais n'est PAS recommandé dans Nuxt
const response = await fetch('/api/posts')  // Envoie la requête
const posts = await response.json()          // Convertit la réponse en JSON
```

### Le problème avec `fetch()` classique dans Nuxt :

Nuxt fait du **SSR** (rendu côté serveur). Ça veut dire que le code s'exécute **deux fois** :
1. D'abord sur le **serveur** (pour générer le HTML)
2. Puis sur le **client** (dans le navigateur)

Si tu utilises `fetch()` classique, les données sont récupérées **deux fois** — une fois inutilement. Les outils de Nuxt (`useFetch`, `useAsyncData`) sont intelligents : ils récupèrent les données **une seule fois** sur le serveur, puis les **transmettent** au client.

> **Analogie** : c'est comme si le serveur pré-remplissait ton formulaire avant de te l'envoyer, au lieu de t'envoyer un formulaire vide que tu dois remplir toi-même.

---

## `useFetch` — l'outil principal (le plus simple)

`useFetch` est la façon la plus courante de récupérer des données dans Nuxt. Il fait tout pour toi :

### Exemple simple : afficher une liste d'articles

```vue
<!-- pages/blog.vue — affiche la liste des articles -->
<script setup lang="ts">
// D'abord, on définit la FORME des données qu'on attend
// C'est du TypeScript : on décrit à quoi ressemble un article
interface Post {
  id: number       // Un identifiant unique (un nombre)
  title: string    // Le titre de l'article (du texte)
  body: string     // Le contenu de l'article (du texte)
}

// useFetch va chercher les données à l'URL "/api/posts"
// Il retourne un OBJET avec plusieurs propriétés utiles :
const {
  data: posts,     // Les données récupérées (la liste des articles)
  pending,         // true pendant le chargement, false quand c'est fini
  error,           // L'erreur s'il y en a une, sinon null
  refresh,         // Une fonction pour re-charger les données
} = await useFetch<Post[]>('/api/posts')
//                 ^^^^^^  = on dit à TypeScript que les données sont un tableau de Post

// 💡 "await" = on ATTEND que les données soient récupérées avant de continuer
// 💡 useFetch est auto-importé par Nuxt, pas besoin d'import !
</script>

<template>
  <!-- Cas 1 : les données sont en cours de chargement -->
  <div v-if="pending">
    ⏳ Chargement des articles...
  </div>

  <!-- Cas 2 : une erreur s'est produite -->
  <div v-else-if="error">
    ❌ Erreur : {{ error.message }}
  </div>

  <!-- Cas 3 : les données sont arrivées ! -->
  <ul v-else-if="posts">
    <!-- v-for parcourt le tableau "posts" et crée un <li> pour chaque article -->
    <!-- :key donne une identité unique à chaque élément (obligatoire avec v-for) -->
    <li v-for="post in posts" :key="post.id">
      {{ post.title }}
    </li>
  </ul>
</template>
```

### Ce que retourne `useFetch` (en détail)

```ts
const { data, pending, error, refresh, status } = await useFetch('/api/...')
```

| Propriété  | Type        | C'est quoi ?                                                |
|------------|-------------|-------------------------------------------------------------|
| `data`     | `Ref`       | Les données récupérées (ou `null` si pas encore arrivées)   |
| `pending`  | `Ref<boolean>` | `true` pendant le chargement, `false` quand c'est fini |
| `error`    | `Ref`       | L'erreur s'il y en a une, sinon `null`                      |
| `refresh`  | `Function`  | Une fonction pour re-charger les données                     |
| `status`   | `Ref<string>` | `'idle'`, `'pending'`, `'success'`, ou `'error'`        |

---

## Exemple avec des paramètres dynamiques

Parfois, tu veux que la recherche se mette à jour quand l'utilisateur tape quelque chose :

```vue
<!-- pages/search.vue — une page de recherche -->
<script setup lang="ts">
// La valeur tapée par l'utilisateur dans le champ de recherche
const search = ref('')
// ref('') crée une variable réactive initialisée à une chaîne vide

const { data: results } = await useFetch('/api/search', {
  // "query" = les paramètres envoyés dans l'URL
  // Si search vaut "chat", l'URL appelée sera : /api/search?q=chat
  query: { q: search },

  // "watch" = surveiller cette variable. Quand elle change, refaire la requête
  watch: [search],
  // Quand l'utilisateur tape "ch", puis "cha", puis "chat",
  // useFetch refait automatiquement la requête à chaque changement
})
</script>

<template>
  <!-- Un champ de saisie lié à la variable "search" -->
  <!-- v-model = synchronise le champ avec la variable (dans les deux sens) -->
  <input v-model="search" placeholder="Rechercher..." />

  <!-- Affiche les résultats -->
  <ul v-if="results">
    <li v-for="result in results" :key="result.id">
      {{ result.title }}
    </li>
  </ul>
</template>
```

---

## `useAsyncData` — plus de contrôle

`useFetch` est un raccourci pratique. Mais parfois, tu as besoin de **plus de contrôle** sur comment les données sont récupérées. C'est là qu'on utilise `useAsyncData`.

### Différence entre `useFetch` et `useAsyncData`

```ts
// ── useFetch : le raccourci (simple et rapide) ──
const { data } = await useFetch('/api/me')

// ── useAsyncData : la version détaillée (plus de contrôle) ──
const { data } = await useAsyncData(
  'user',                          // 1er argument : une "clé" unique (un nom pour identifier ces données)
  () => $fetch('/api/me')          // 2ème argument : une FONCTION qui retourne les données
)
// $fetch est la fonction de base de Nuxt pour faire des requêtes HTTP
```

### Quand utiliser quoi ?

| Situation                                        | Utilise           |
|--------------------------------------------------|-------------------|
| Récupérer des données depuis une URL simple      | `useFetch`        |
| Tu as besoin de transformer les données avant    | `useAsyncData`    |
| Tu veux combiner plusieurs requêtes              | `useAsyncData`    |
| Tu veux un contrôle total                        | `useAsyncData`    |
| 90% des cas                                      | `useFetch` suffit |

### Exemple avec `useAsyncData` : combiner deux requêtes

```vue
<script setup lang="ts">
// On récupère l'utilisateur ET ses articles en une seule fois
const { data: userWithPosts } = await useAsyncData('user-with-posts', async () => {
  // $fetch fait une requête HTTP (comme fetch() mais optimisé pour Nuxt)
  // On lance les deux requêtes EN PARALLÈLE avec Promise.all
  // (ça veut dire : envoie les deux en même temps, attends que les deux soient finies)
  const [user, posts] = await Promise.all([
    $fetch('/api/me'),              // Requête 1 : infos de l'utilisateur
    $fetch('/api/me/posts'),        // Requête 2 : articles de l'utilisateur
  ])

  // On retourne un objet combiné
  return { user, posts }
})
</script>

<template>
  <div v-if="userWithPosts">
    <h1>{{ userWithPosts.user.name }}</h1>
    <p>{{ userWithPosts.posts.length }} articles publiés</p>
  </div>
</template>
```

---

## `$fetch` — pour les appels directs (événements)

`useFetch` et `useAsyncData` sont faits pour charger des données **au chargement de la page**. Mais parfois, tu veux faire une requête **après une action** de l'utilisateur (clic sur un bouton, soumission de formulaire...). Dans ce cas, utilise `$fetch` directement :

```vue
<script setup lang="ts">
// Cette fonction est appelée quand l'utilisateur clique sur "Publier"
async function createPost(title: string): Promise<void> {
  // $fetch envoie une requête HTTP
  await $fetch('/api/posts', {
    method: 'POST',           // POST = envoyer/créer des données (pas GET = récupérer)
    body: { title },          // Le contenu envoyé au serveur (le titre de l'article)
  })
  // Promise<void> = cette fonction est asynchrone et ne retourne rien
}
</script>

<template>
  <button @click="createPost('Mon nouvel article')">
    Publier
  </button>
</template>
```

### Résumé : quand utiliser quoi ?

```
Chargement de page (données affichées dans le template)
  → useFetch  ou  useAsyncData

Action utilisateur (clic, formulaire, événement)
  → $fetch directement
```

---

## Les options utiles de `useFetch`

Voici les options que tu utiliseras le plus souvent, avec des commentaires :

```ts
const { data, pending, error, refresh } = await useFetch('/api/data', {

  // ── Transformer la réponse ──────────────────────────────────────
  // L'API retourne { items: [...], total: 100 }
  // Mais tu veux seulement le tableau "items"
  transform: (response) => response.items,

  // ── Valeur par défaut ───────────────────────────────────────────
  // En attendant que les données arrivent, "data" vaudra [] (tableau vide)
  // au lieu de null (ce qui évite des erreurs dans le template)
  default: () => [],

  // ── Clé de cache ────────────────────────────────────────────────
  // Un nom unique pour identifier ces données dans le cache
  // Utile si tu as plusieurs useFetch sur la même URL avec des options différentes
  key: 'my-data',

  // ── Mode lazy ───────────────────────────────────────────────────
  // lazy: true  → la page s'affiche IMMÉDIATEMENT (sans attendre les données)
  //               puis les données arrivent après
  // lazy: false → la page attend que les données soient là (par défaut)
  lazy: true,

  // ── Watch : re-exécuter automatiquement ─────────────────────────
  // Quand ces variables changent, les données sont rechargées automatiquement
  watch: [page, search],

  // ── Server only ─────────────────────────────────────────────────
  // server: true → exécuter SEULEMENT côté serveur (pas dans le navigateur)
  // Utile pour des données qui ne changent pas après le chargement initial
  server: true,

  // ── Headers personnalisés ───────────────────────────────────────
  // Des informations supplémentaires envoyées avec la requête
  // Ici, un token d'authentification
  headers: { Authorization: `Bearer ${token}` },
})
```

---

## Rafraîchir et mettre à jour les données

Parfois, tu veux **recharger** les données (par exemple après avoir créé un nouvel article) :

```ts
// ── 1. Rafraîchir des données spécifiques ──
// Tu gardes la fonction "refresh" retournée par useFetch
const { data: posts, refresh } = await useFetch('/api/posts')

// Plus tard, tu appelles refresh() pour recharger
await refresh()
// → refait la requête GET /api/posts et met à jour "posts"

// ── 2. Rafraîchir TOUTES les données de la page ──
await refreshNuxtData()
// → recharge TOUTES les données de tous les useFetch/useAsyncData de la page

// ── 3. Rafraîchir par clé ──
await refreshNuxtData('posts')
// → recharge uniquement les données identifiées par la clé "posts"

// ── 4. Vider le cache ──
clearNuxtData('posts')
// → supprime les données du cache (elles seront rechargées au prochain besoin)
```

### Exemple concret : ajouter un article puis rafraîchir la liste

```vue
<script setup lang="ts">
// On récupère la liste des articles ET la fonction refresh
const { data: posts, refresh } = await useFetch('/api/posts')

async function addPost() {
  // 1. On crée un nouvel article
  await $fetch('/api/posts', {
    method: 'POST',
    body: { title: 'Nouvel article' },
  })

  // 2. On rafraîchit la liste pour afficher le nouvel article
  await refresh()
  // Sans ce refresh(), la liste afficherait toujours les anciens articles
}
</script>

<template>
  <button @click="addPost">Ajouter un article</button>

  <ul v-if="posts">
    <li v-for="post in posts" :key="post.id">
      {{ post.title }}
    </li>
  </ul>
</template>
```

---

## Gérer les erreurs globalement

Tu peux configurer un **gestionnaire d'erreur global** qui intercepte toutes les erreurs de l'application :

```ts
// plugins/error-handler.ts — ce fichier est un "plugin" chargé au démarrage
export default defineNuxtPlugin((nuxtApp) => {
  // nuxtApp.hook() permet de réagir à des événements de l'application
  // 'vue:error' se déclenche à chaque erreur non gérée dans un composant Vue
  nuxtApp.hook('vue:error', (error) => {
    console.error('Une erreur est survenue :', error)
    // En production, tu enverrais cette erreur à un service de monitoring
    // comme Sentry, Datadog, etc.
  })
})
```

---

## Récapitulatif

| Outil          | Quand l'utiliser                          | Exemple                              |
|----------------|-------------------------------------------|--------------------------------------|
| `useFetch`     | Charger des données au chargement de page | Liste d'articles, profil utilisateur |
| `useAsyncData` | Comme useFetch mais avec plus de contrôle | Combiner plusieurs requêtes          |
| `$fetch`       | Après une action (clic, formulaire)       | Créer un article, supprimer un item  |
| `refresh()`    | Recharger des données déjà récupérées     | Après avoir créé/modifié des données |

---

## 🎯 Pratique

### Exercice NXF.1 — useFetch basique

Charge une liste de produits depuis `/api/products` :

```vue
<script setup lang="ts">
interface Product {
  id: number
  name: string
  price: number
}

// Charge les produits
const { data: products, status } = ???
</script>

<template>
  <div v-if="status === 'pending'">Chargement...</div>
  <ul v-else>
    <li v-for="p in products" :key="p.id">{{ p.name }}</li>
  </ul>
</template>
```

<details>
<summary>Solution</summary>

```vue
<script setup lang="ts">
interface Product {
  id: number
  name: string
  price: number
}

const { data: products, status } = await useFetch<Product[]>('/api/products')
</script>
```
</details>

---

### Exercice NXF.2 — Fetch avec paramètre

Charge un produit spécifique selon l'ID dans l'URL :

```vue
<!-- pages/products/[id].vue -->
<script setup lang="ts">
// Récupère l'id depuis l'URL et charge le produit
// ???
</script>
```

<details>
<summary>Solution</summary>

```vue
<script setup lang="ts">
const route = useRoute()
const { data: product } = await useFetch<Product>(`/api/products/${route.params.id}`)
</script>
```
</details>

---

### Exercice NXF.3 — $fetch pour une action

Crée une fonction pour ajouter un produit au panier :

```vue
<script setup lang="ts">
async function addToCart(productId: number) {
  // Envoie une requête POST à /api/cart avec le productId
  // ???
}
</script>
```

<details>
<summary>Solution</summary>

```vue
<script setup lang="ts">
async function addToCart(productId: number) {
  await $fetch('/api/cart', {
    method: 'POST',
    body: { productId }
  })
}
</script>
```
</details>

---

### Exercice NXF.4 — Refresh après action

Après avoir supprimé un produit, rafraîchis la liste :

```vue
<script setup lang="ts">
const { data: products, refresh } = await useFetch<Product[]>('/api/products')

async function deleteProduct(id: number) {
  // Supprime le produit et rafraîchit la liste
  // ???
}
</script>
```

<details>
<summary>Solution</summary>

```vue
<script setup lang="ts">
const { data: products, refresh } = await useFetch<Product[]>('/api/products')

async function deleteProduct(id: number) {
  await $fetch(`/api/products/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>
```
</details>

---

## Suite

→ `cours/05-nuxt3/04-server-routes.md`
