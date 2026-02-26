# 03 — Data fetching

## `useFetch` — le plus utilise

```vue
<script setup lang="ts">
interface Post {
  id: number;
  title: string;
  body: string;
}

const {
  data: posts,
  pending,
  error,
  refresh,
} = await useFetch<Post[]>("/api/posts");
</script>

<template>
  <div v-if="pending">Chargement...</div>
  <div v-else-if="error">Erreur: {{ error.message }}</div>
  <ul v-else-if="posts">
    <li v-for="post in posts" :key="post.id">{{ post.title }}</li>
  </ul>
</template>
```

### Avec parametres dynamiques

```vue
<script setup lang="ts">
const search = ref("");

const { data: results } = await useFetch("/api/search", {
  query: { q: search }, // Reactif : refetch quand search change
  watch: [search],
});
</script>
```

## `useAsyncData` — plus de controle

```vue
<script setup lang="ts">
const { data: user } = await useAsyncData("user", () => $fetch("/api/me"));
</script>
```

### Difference avec `useFetch`

|                  | `useFetch`  | `useAsyncData` |
| ---------------- | ----------- | -------------- |
| URL reactif      | ✅          | Manuel         |
| Cle auto         | ✅          | Manuelle       |
| Personnalisation | Limitee     | Totale         |
| Cas d'usage      | CRUD simple | Logique custom |

## `$fetch` — appel direct

```ts
// Dans un event handler (pas dans setup)
async function createPost(title: string): Promise<void> {
  await $fetch("/api/posts", {
    method: "POST",
    body: { title },
  });
}
```

## Options communes

```ts
const { data, pending, error, refresh, status } = await useFetch("/api/data", {
  // Transformer la reponse
  transform: (raw) => raw.items,

  // Valeur par defaut
  default: () => [],

  // Cle de cache
  key: "my-data",

  // Executer seulement cote serveur
  server: true,

  // Lazy : ne bloque pas la navigation
  lazy: true,

  // Watch : re-execute quand ces refs changent
  watch: [page, search],

  // Headers
  headers: { Authorization: `Bearer ${token}` },
});
```

## Refresh et invalidation

```ts
// Refresh une donnee specifique
const { refresh } = await useFetch("/api/posts");
await refresh();

// Refresh toutes les donnees
await refreshNuxtData();

// Refresh par cle
await refreshNuxtData("posts");

// Clear cache
clearNuxtData("posts");
```

## Gestion d'erreur globale

```ts
// plugins/error-handler.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook("vue:error", (error) => {
    console.error("Vue error:", error);
    // Envoyer a un service de monitoring
  });
});
```

## Suite

→ `cours/05-nuxt3/04-server-routes.md`
