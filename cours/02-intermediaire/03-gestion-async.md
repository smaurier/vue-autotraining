# 03 — Gestion async

## Le problème

Tout appel reseau peut :

- prendre du temps (loading)
- échouer (error)
- reussir (data)

Il faut **toujours** représenter ces 4 états : `idle`, `loading`, `error`, `success`.

## Pattern : discriminated union

```ts
type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "success"; data: T };
```

## Fetch basique avec gestion d'erreur

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";

interface Product {
  id: number;
  name: string;
  price: number;
}

const products = ref<Product[]>([]);
const error = ref<string | null>(null);
const isLoading = ref<boolean>(false);

async function fetchProducts(): Promise<void> {
  isLoading.value = true;
  error.value = null;

  try {
    const response = await fetch("/api/products");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    products.value = await response.json();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Erreur inconnue";
  } finally {
    isLoading.value = false;
  }
}

onMounted(fetchProducts);
</script>

<template>
  <div v-if="isLoading">Chargement...</div>
  <div v-else-if="error" class="error">{{ error }}</div>
  <ul v-else>
    <li v-for="p in products" :key="p.id">{{ p.name }} - {{ p.price }}€</li>
  </ul>
</template>
```

## Abort controller (annuler un fetch)

Quand l'utilisateur tape vite dans une recherche, il faut annuler les requêtes obsolètes :

```ts
let controller: AbortController | null = null;

async function search(query: string): Promise<void> {
  // Annule la requete precedente
  controller?.abort();
  controller = new AbortController();

  try {
    const res = await fetch(`/api/search?q=${query}`, {
      signal: controller.signal,
    });
    results.value = await res.json();
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return; // Ignore les requetes annulees
    }
    error.value = "Erreur recherche";
  }
}
```

## Optimistic update

Mettre a jour l'UI **avant** la reponse serveur, puis rollback si erreur :

```ts
async function toggleFavorite(productId: number): Promise<void> {
  const product = products.value.find((p) => p.id === productId);
  if (!product) return;

  // Sauvegarde l'ancien etat
  const wasFavorite = product.favorite;

  // Update optimiste
  product.favorite = !product.favorite;

  try {
    await fetch(`/api/products/${productId}/favorite`, {
      method: "PATCH",
      body: JSON.stringify({ favorite: product.favorite }),
    });
  } catch {
    // Rollback
    product.favorite = wasFavorite;
    error.value = "Impossible de mettre a jour";
  }
}
```

## Retry

```ts
async function fetchWithRetry<T>(
  fetcher: () => Promise<T>,
  maxRetries = 3,
  delay = 1000,
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetcher();
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      await new Promise((r) => setTimeout(r, delay * (attempt + 1)));
    }
  }
  throw new Error("Unreachable");
}
```

## Composable `useFetch` complet

```ts
// composables/useFetch.ts
import { ref, watchEffect, type Ref } from "vue";

interface UseFetchReturn<T> {
  data: Ref<T | null>;
  error: Ref<string | null>;
  isLoading: Ref<boolean>;
  refetch: () => Promise<void>;
}

export function useFetch<T>(url: Ref<string> | string): UseFetchReturn<T> {
  const data = ref<T | null>(null) as Ref<T | null>;
  const error = ref<string | null>(null);
  const isLoading = ref(false);

  async function doFetch(): Promise<void> {
    const urlValue = typeof url === "string" ? url : url.value;
    isLoading.value = true;
    error.value = null;

    try {
      const res = await fetch(urlValue);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data.value = await res.json();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Erreur";
    } finally {
      isLoading.value = false;
    }
  }

  if (typeof url !== "string") {
    watchEffect(() => {
      doFetch();
    });
  } else {
    doFetch();
  }

  return { data, error, isLoading, refetch: doFetch };
}
```

## Exercice

→ `exercices/07-crud-api/ENONCE.md`

## Suite

→ `cours/02-intermediaire/04-formulaires-et-validation.md`
