# 02 — Composables

## Qu'est-ce qu'un composable ?

Une **fonction** qui encapsule de la logique reactive réutilisable. Convention : prefixe `use`.

## Premier composable : `useCounter`

```ts
// composables/useCounter.ts
import { ref, computed } from "vue";

export function useCounter(initial = 0, min = 0, max = Infinity) {
  const count = ref<number>(initial);

  const canDecrement = computed(() => count.value > min);
  const canIncrement = computed(() => count.value < max);

  function increment(): void {
    if (canIncrement.value) count.value++;
  }

  function decrement(): void {
    if (canDecrement.value) count.value--;
  }

  function reset(): void {
    count.value = initial;
  }

  return { count, canDecrement, canIncrement, increment, decrement, reset };
}
```

```vue
<!-- Utilisation -->
<script setup lang="ts">
import { useCounter } from "@/composables/useCounter";

const { count, increment, decrement, reset } = useCounter(0, 0, 10);
</script>
```

## Les règles d'un bon composable

1. **Signature claire** : parametres d'entree, retour explicite
2. **État minimal expose** : ne retourne que ce qui est utile
3. **Side effects maitrises** : cleanup dans `onUnmounted`
4. **Testable** : fonctionne sans composant (appel direct dans un test)

## Composable avec side effect : `useWindowSize`

```ts
// composables/useWindowSize.ts
import { ref, onMounted, onUnmounted } from "vue";

interface WindowSize {
  width: number;
  height: number;
}

export function useWindowSize(): WindowSize {
  const width = ref<number>(window.innerWidth);
  const height = ref<number>(window.innerHeight);

  function update(): void {
    width.value = window.innerWidth;
    height.value = window.innerHeight;
  }

  onMounted(() => window.addEventListener("resize", update));
  onUnmounted(() => window.removeEventListener("resize", update));

  return { width, height };
}
```

## Composable avec parametres reactifs

```ts
// composables/useDebounce.ts
import { ref, watch, type Ref } from "vue";

export function useDebounce<T>(source: Ref<T>, delay = 300): Ref<T> {
  const debounced = ref<T>(source.value) as Ref<T>;

  let timeout: ReturnType<typeof setTimeout>;

  watch(source, (val) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      debounced.value = val;
    }, delay);
  });

  return debounced;
}
```

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useDebounce } from "@/composables/useDebounce";

const search = ref<string>("");
const debouncedSearch = useDebounce(search, 500);

// debouncedSearch se met a jour 500ms apres que search arrete de changer
</script>
```

## Composable async : `useAsyncData`

```ts
// composables/useAsyncData.ts
import { ref, type Ref } from "vue";

type AsyncStatus = "idle" | "loading" | "error" | "success";

interface UseAsyncDataReturn<T> {
  data: Ref<T | null>;
  error: Ref<string | null>;
  status: Ref<AsyncStatus>;
  execute: () => Promise<void>;
}

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
): UseAsyncDataReturn<T> {
  const data = ref<T | null>(null) as Ref<T | null>;
  const error = ref<string | null>(null);
  const status = ref<AsyncStatus>("idle");

  async function execute(): Promise<void> {
    status.value = "loading";
    error.value = null;

    try {
      data.value = await fetcher();
      status.value = "success";
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Erreur inconnue";
      status.value = "error";
    }
  }

  return { data, error, status, execute };
}
```

```vue
<script setup lang="ts">
import { onMounted } from "vue";
import { useAsyncData } from "@/composables/useAsyncData";

interface User {
  id: number;
  name: string;
}

const {
  data: users,
  status,
  error,
  execute,
} = useAsyncData<User[]>(() => fetch("/api/users").then((r) => r.json()));

onMounted(execute);
</script>

<template>
  <p v-if="status === 'loading'">Chargement...</p>
  <p v-else-if="status === 'error'">{{ error }}</p>
  <ul v-else-if="users">
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

## Composable avec injection : `useApi`

```ts
// composables/useApi.ts
import { inject } from "vue";
import { ApiClientKey } from "@/types";

export function useApi() {
  const client = inject(ApiClientKey);
  if (!client) throw new Error("ApiClient non fourni via provide");
  return client;
}
```

## Composition de composables

Un composable peut utiliser d'autres composables :

```ts
export function useSearchUsers() {
  const search = ref<string>("");
  const debouncedSearch = useDebounce(search, 300);

  const {
    data: users,
    status,
    execute,
  } = useAsyncData<User[]>(() =>
    fetch(`/api/users?q=${debouncedSearch.value}`).then((r) => r.json()),
  );

  watch(debouncedSearch, () => execute());

  return { search, users, status };
}
```

## Exercice

→ `exercices/06-dashboard-filtres/ENONCE.md`

## Suite

→ `cours/02-intermediaire/03-gestion-async.md`
