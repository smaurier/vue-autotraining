# 02 — Pinia (state management)

## Installation

```bash
pnpm add pinia
```

```ts
// main.ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";

const app = createApp(App);
app.use(createPinia());
app.mount("#app");
```

## Quand utiliser un store ?

| Donnees                 | Ou les mettre             |
| ----------------------- | ------------------------- |
| Locales a 1 composant   | `ref` / `reactive`        |
| Partagees parent/enfant | `props` / `emits`         |
| Partagees entre freres  | Store Pinia               |
| Globales (auth, theme)  | Store Pinia               |
| Cache de donnees server | Store Pinia ou composable |

## Premier store

```ts
// stores/counter.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useCounterStore = defineStore("counter", () => {
  // State
  const count = ref<number>(0);

  // Getters (computed)
  const double = computed(() => count.value * 2);
  const isPositive = computed(() => count.value > 0);

  // Actions
  function increment(): void {
    count.value++;
  }

  function decrement(): void {
    count.value--;
  }

  function reset(): void {
    count.value = 0;
  }

  return { count, double, isPositive, increment, decrement, reset };
});
```

```vue
<!-- Composant -->
<script setup lang="ts">
import { useCounterStore } from "@/stores/counter";

const counter = useCounterStore();
</script>

<template>
  <p>Count: {{ counter.count }}</p>
  <p>Double: {{ counter.double }}</p>
  <button @click="counter.increment">+</button>
  <button @click="counter.decrement">-</button>
</template>
```

## Store métier : Auth

```ts
// stores/auth.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";

interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem("token"));

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === "admin");

  async function login(email: string, password: string): Promise<void> {
    const response = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Identifiants invalides");

    const data = await response.json();
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem("token", data.token);
  }

  function logout(): void {
    user.value = null;
    token.value = null;
    localStorage.removeItem("token");
  }

  async function fetchProfile(): Promise<void> {
    if (!token.value) return;
    const response = await fetch("/api/me", {
      headers: { Authorization: `Bearer ${token.value}` },
    });
    if (response.ok) {
      user.value = await response.json();
    } else {
      logout();
    }
  }

  return { user, token, isAuthenticated, isAdmin, login, logout, fetchProfile };
});
```

## Store métier : CRUD générique

```ts
// stores/useEntityStore.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";

interface Entity {
  id: number;
}

export function createEntityStore<T extends Entity>(
  name: string,
  apiUrl: string,
) {
  return defineStore(name, () => {
    const items = ref<T[]>([]);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    const count = computed(() => items.value.length);

    async function fetchAll(): Promise<void> {
      isLoading.value = true;
      error.value = null;
      try {
        const res = await fetch(apiUrl);
        items.value = await res.json();
      } catch (err) {
        error.value = "Erreur de chargement";
      } finally {
        isLoading.value = false;
      }
    }

    async function create(data: Omit<T, "id">): Promise<void> {
      const res = await fetch(apiUrl, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      const created: T = await res.json();
      items.value.push(created);
    }

    async function remove(id: number): Promise<void> {
      await fetch(`${apiUrl}/${id}`, { method: "DELETE" });
      items.value = items.value.filter((item) => item.id !== id);
    }

    function findById(id: number): T | undefined {
      return items.value.find((item) => item.id === id);
    }

    return {
      items,
      isLoading,
      error,
      count,
      fetchAll,
      create,
      remove,
      findById,
    };
  });
}
```

```ts
// stores/products.ts
import { createEntityStore } from "./useEntityStore";

interface Product {
  id: number;
  name: string;
  price: number;
}

export const useProductStore = createEntityStore<Product>(
  "products",
  "/api/products",
);
```

## Destructuring reactif

```ts
import { storeToRefs } from "pinia";

const store = useCounterStore();

// ❌ Perd la reactivite
const { count, double } = store;

// ✅ Garde la reactivite
const { count, double } = storeToRefs(store);

// Les actions ne sont PAS des refs, destructure-les directement
const { increment, decrement } = store;
```

## Persister un store (plugin)

```ts
// plugins/piniaPersistedState.ts
import type { PiniaPluginContext } from "pinia";

export function piniaPersistedState({ store }: PiniaPluginContext): void {
  const key = `pinia-${store.$id}`;
  const saved = localStorage.getItem(key);

  if (saved) {
    store.$patch(JSON.parse(saved));
  }

  store.$subscribe((_, state) => {
    localStorage.setItem(key, JSON.stringify(state));
  });
}

// main.ts
const pinia = createPinia();
pinia.use(piniaPersistedState);
```

## Exercice

→ `exercices/11-store-pinia/ENONCE.md`

## Suite

→ `cours/03-avance/03-tests-unitaires.md`
