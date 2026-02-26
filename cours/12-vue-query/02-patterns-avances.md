# 02 — TanStack Query : patterns avancés

## Optimistic Updates

Mettre à jour l'UI **avant** que le serveur confirme, pour une UX instantanée :

```ts
const queryClient = useQueryClient();

const { mutate: updateUser } = useMutation({
  mutationFn: (updated: User) =>
    fetch(`/api/users/${updated.id}`, {
      method: "PUT",
      body: JSON.stringify(updated),
      headers: { "Content-Type": "application/json" },
    }).then((r) => r.json()),

  // Avant la mutation : mise à jour optimiste
  onMutate: async (updated) => {
    // Annuler les queries en cours pour éviter les conflits
    await queryClient.cancelQueries({ queryKey: ["users"] });

    // Snapshot de l'état précédent
    const previousUsers = queryClient.getQueryData<User[]>(["users"]);

    // Mise à jour optimiste du cache
    queryClient.setQueryData<User[]>(
      ["users"],
      (old) => old?.map((u) => (u.id === updated.id ? updated : u)) ?? [],
    );

    // Retourner le context pour rollback
    return { previousUsers };
  },

  // Si erreur → rollback
  onError: (_err, _updated, context) => {
    if (context?.previousUsers) {
      queryClient.setQueryData(["users"], context.previousUsers);
    }
  },

  // Toujours refetch pour synchroniser
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  },
});
```

## Pagination

```ts
import { useQuery, keepPreviousData } from "@tanstack/vue-query";

const page = ref(1);
const pageSize = ref(10);

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

const { data, isLoading, isPlaceholderData } = useQuery({
  queryKey: ["users", { page, pageSize }],
  queryFn: async (): Promise<PaginatedResponse<User>> => {
    const res = await fetch(
      `/api/users?page=${page.value}&limit=${pageSize.value}`,
    );
    return res.json();
  },
  placeholderData: keepPreviousData, // Garde les données précédentes pendant le fetch
});

const totalPages = computed(() => data.value?.totalPages ?? 0);

function nextPage(): void {
  if (page.value < totalPages.value) page.value++;
}

function prevPage(): void {
  if (page.value > 1) page.value--;
}
```

```vue
<template>
  <div :class="{ 'opacity-50': isPlaceholderData }">
    <ul>
      <li v-for="user in data?.items" :key="user.id">{{ user.name }}</li>
    </ul>
  </div>

  <div class="pagination">
    <button :disabled="page <= 1" @click="prevPage">Précédent</button>
    <span>{{ page }} / {{ totalPages }}</span>
    <button :disabled="page >= totalPages" @click="nextPage">Suivant</button>
  </div>
</template>
```

## Infinite Scroll

```ts
import { useInfiniteQuery } from "@tanstack/vue-query";

const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
  useInfiniteQuery({
    queryKey: ["users", "infinite"],
    queryFn: async ({ pageParam }): Promise<PaginatedResponse<User>> => {
      const res = await fetch(`/api/users?cursor=${pageParam}&limit=20`);
      return res.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.items.length === 20 ? lastPage.page + 1 : undefined,
  });

// Toutes les pages aplatties
const allUsers = computed(
  () => data.value?.pages.flatMap((p) => p.items) ?? [],
);
```

```vue
<template>
  <ul>
    <li v-for="user in allUsers" :key="user.id">{{ user.name }}</li>
  </ul>

  <button
    v-if="hasNextPage"
    :disabled="isFetchingNextPage"
    @click="fetchNextPage"
  >
    {{ isFetchingNextPage ? "Chargement..." : "Charger plus" }}
  </button>
</template>
```

## Dependent Queries

Lancer une query seulement quand une autre a retourné un résultat :

```ts
// 1. Charger le user
const { data: user } = useQuery({
  queryKey: ["user", userId],
  queryFn: () => fetchUser(userId.value),
});

// 2. Charger ses commandes — seulement quand user est chargé
const { data: orders } = useQuery({
  queryKey: ["orders", { userId }],
  queryFn: () => fetchOrders(userId.value),
  enabled: computed(() => !!user.value), // ← attend que user soit chargé
});
```

## Prefetching

Précharger les données avant que l'utilisateur en ait besoin :

```ts
const queryClient = useQueryClient();

// Sur hover d'un lien → prefetch la page
function prefetchUser(userId: number): void {
  queryClient.prefetchQuery({
    queryKey: ["users", userId],
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000,
  });
}
```

```vue
<template>
  <NuxtLink
    v-for="user in users"
    :key="user.id"
    :to="`/users/${user.id}`"
    @mouseenter="prefetchUser(user.id)"
  >
    {{ user.name }}
  </NuxtLink>
</template>
```

## Configuration globale

```ts
// main.ts
import {
  VueQueryPlugin,
  type VueQueryPluginOptions,
} from "@tanstack/vue-query";

const queryConfig: VueQueryPluginOptions = {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        staleTime: 2 * 60 * 1000, // 2 min par défaut
        gcTime: 10 * 60 * 1000, // 10 min en cache
        retry: 2, // 2 retries
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
      },
    },
  },
};

app.use(VueQueryPlugin, queryConfig);
```

## Devtools

```bash
pnpm add @tanstack/vue-query-devtools
```

```vue
<!-- App.vue -->
<script setup lang="ts">
import { VueQueryDevtools } from "@tanstack/vue-query-devtools";
</script>

<template>
  <RouterView />
  <VueQueryDevtools />
  <!-- Panel dans le coin, mode dev uniquement -->
</template>
```

## TanStack Query vs composable maison vs Pinia

| Critère                    | Composable maison | Pinia  | TanStack Query    |
| -------------------------- | ----------------- | ------ | ----------------- |
| Cache automatique          | ❌                | Manuel | ✅                |
| Déduplication requêtes     | ❌                | ❌     | ✅                |
| Stale-while-revalidate     | ❌                | ❌     | ✅                |
| Retry automatique          | ❌                | ❌     | ✅                |
| Devtools                   | ❌                | ✅     | ✅                |
| State client (formulaires) | ❌                | ✅     | ❌ (pas son rôle) |
| Boilerplate                | Beaucoup          | Modéré | Très peu          |

**Règle** : TanStack Query pour l'état **serveur** (données API), Pinia pour l'état **client** (UI, formulaires, préférences).

## Suite

→ `cours/09-accessibilite/01-fondamentaux-wcag.md` (ou module suivant selon le parcours)
