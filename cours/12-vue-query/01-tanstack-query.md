# 01 — TanStack Query (Vue Query)

## Pourquoi TanStack Query ?

La gestion du data fetching avec `ref` + `onMounted` + `try/catch` a des limites :

```ts
// ❌ Pattern naïf — chaque composant gère son loading/error/data
const users = ref<User[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  isLoading.value = true;
  try {
    users.value = await fetchUsers();
  } catch (e) {
    error.value = "Erreur";
  } finally {
    isLoading.value = false;
  }
});
// + pas de cache, pas de refetch, pas de déduplication, pas de retry…
```

TanStack Query résout tout ça :

| Problème                  | Solution TanStack Query             |
| ------------------------- | ----------------------------------- |
| Boilerplate loading/error | `useQuery` retourne tout            |
| Pas de cache              | Cache automatique par clé           |
| Requêtes dupliquées       | Déduplication automatique           |
| Données obsolètes         | Stale-while-revalidate              |
| Retry en cas d'erreur     | 3 retries par défaut                |
| Refetch en arrière-plan   | Window focus, interval, reconnect   |
| Mutations + invalidation  | `useMutation` + `invalidateQueries` |

## Setup

```bash
pnpm add @tanstack/vue-query
```

```ts
// main.ts
import { VueQueryPlugin } from "@tanstack/vue-query";

const app = createApp(App);
app.use(VueQueryPlugin);
app.mount("#app");
```

## useQuery — Lire des données

```vue
<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";

interface User {
  id: number;
  name: string;
  email: string;
}

// Fonction pure qui retourne une Promise
async function fetchUsers(): Promise<User[]> {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error("Erreur serveur");
  return res.json();
}

// useQuery gère loading, error, cache, refetch
const {
  data: users, // Ref<User[] | undefined>
  isLoading, // Ref<boolean> — premier chargement
  isFetching, // Ref<boolean> — tout refetch (incluant arrière-plan)
  isError, // Ref<boolean>
  error, // Ref<Error | null>
  refetch, // () => void
} = useQuery({
  queryKey: ["users"], // Clé de cache unique
  queryFn: fetchUsers, // Fonction de fetch
  staleTime: 5 * 60 * 1000, // Données fraîches pendant 5 min
});
</script>

<template>
  <div v-if="isLoading">Chargement...</div>
  <div v-else-if="isError">{{ error?.message }}</div>
  <ul v-else>
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

## Query Keys — La clé du cache

```ts
// Liste de tous les users
useQuery({ queryKey: ["users"], queryFn: fetchUsers });

// Un user spécifique
useQuery({ queryKey: ["users", userId], queryFn: () => fetchUser(userId) });

// Users filtrés
useQuery({
  queryKey: ["users", { role: "admin", page: 2 }],
  queryFn: () => fetchUsers({ role: "admin", page: 2 }),
});
```

**Règle** : la query key doit contenir **tous les paramètres** qui changent le résultat.

```ts
// ✅ Réactif avec une ref
const page = ref(1);
const role = ref<string>("admin");

const { data } = useQuery({
  queryKey: ["users", { page, role }], // Se refetch quand page ou role change
  queryFn: () => fetchUsers({ page: page.value, role: role.value }),
});
```

## useMutation — Écrire des données

```ts
import { useMutation, useQueryClient } from "@tanstack/vue-query";

const queryClient = useQueryClient();

const { mutate: createUser, isPending } = useMutation({
  mutationFn: (newUser: { name: string; email: string }) =>
    fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    }).then((r) => r.json()),

  onSuccess: () => {
    // Invalide le cache → refetch automatique de la liste
    queryClient.invalidateQueries({ queryKey: ["users"] });
  },

  onError: (error) => {
    console.error("Création échouée :", error.message);
  },
});
```

```vue
<template>
  <form @submit.prevent="createUser({ name, email })">
    <input v-model="name" placeholder="Nom" />
    <input v-model="email" placeholder="Email" />
    <button :disabled="isPending">
      {{ isPending ? "Création..." : "Créer" }}
    </button>
  </form>
</template>
```

## Stale, Fresh, Inactive

```
┌─────────────────────────────────────────────────────┐
│  fresh     │     stale          │    garbage         │
│  (< staleTime)  (>= staleTime)  (> gcTime, inactif) │
│  = pas de  │  = refetch en      │  = supprimé du     │
│    refetch │    arrière-plan    │    cache           │
└─────────────────────────────────────────────────────┘
```

```ts
useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
  staleTime: 5 * 60 * 1000, // Frais pendant 5 min
  gcTime: 30 * 60 * 1000, // Gardé en cache 30 min après dernière utilisation
  refetchOnWindowFocus: true, // Refetch quand l'onglet reprend le focus
  refetchInterval: 60_000, // Refetch toutes les 60s (polling)
  retry: 3, // 3 retries en cas d'erreur
});
```

## Composable typé par feature

```ts
// composables/useUsersQuery.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import type { Ref } from "vue";

interface User {
  id: number;
  name: string;
  email: string;
}

const USERS_KEY = ["users"] as const;

export function useUsersQuery() {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: async (): Promise<User[]> => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUserQuery(userId: Ref<number>) {
  return useQuery({
    queryKey: ["users", userId] as const,
    queryFn: async (): Promise<User> => {
      const res = await fetch(`/api/users/${userId.value}`);
      if (!res.ok) throw new Error("Utilisateur introuvable");
      return res.json();
    },
    enabled: computed(() => userId.value > 0), // Ne fetch que si l'ID est valide
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newUser: Omit<User, "id">): Promise<User> => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}
```

## En contexte ESN

| Pattern naïf                     | Avec TanStack Query                           |
| -------------------------------- | --------------------------------------------- |
| Chaque composant gère son state  | Cache partagé, zéro duplication               |
| Loading spinners partout         | Stale-while-revalidate (données instantanées) |
| Pas de retry                     | Retry automatique                             |
| Données obsolètes après mutation | Invalidation → refetch automatique            |
| Code boilerplate massif          | ~5 lignes par query                           |

**TanStack Query est le standard pour le data fetching en Vue 3 en 2025+.**

## Suite

→ `cours/12-vue-query/02-patterns-avances.md`
