# 01 — Composition API avancee

## `watch` — reagir aux changements

```ts
import { ref, watch } from "vue";

const search = ref<string>("");

// Surveille une ref
watch(search, (newVal, oldVal) => {
  console.log(`Recherche : "${oldVal}" → "${newVal}"`);
  fetchResults(newVal);
});
```

### Options de watch

```ts
// Execution immediate (aussi au mount)
watch(
  search,
  (val) => {
    fetchResults(val);
  },
  { immediate: true },
);

// Surveillance profonde (objets/tableaux)
watch(
  filters,
  (val) => {
    applyFilters(val);
  },
  { deep: true },
);
```

### Surveiller plusieurs sources

```ts
watch([search, page], ([newSearch, newPage], [oldSearch, oldPage]) => {
  if (newSearch !== oldSearch) {
    // Reset page si recherche change
    page.value = 1;
  }
  fetchResults(newSearch, newPage);
});
```

### Surveiller une propriete d'un reactive

```ts
const state = reactive({ count: 0, name: "" });

// ✅ Utilise une fonction getter
watch(
  () => state.count,
  (newVal) => {
    console.log("count:", newVal);
  },
);
```

## `watchEffect` — effet automatique

```ts
import { watchEffect } from "vue";

// Pas besoin de declarer les dependances : TS les detecte automatiquement
watchEffect(() => {
  console.log(`search = ${search.value}, page = ${page.value}`);
  // Se re-execute quand search OU page change
});
```

### watch vs watchEffect

|               | `watch`                  | `watchEffect`               |
| ------------- | ------------------------ | --------------------------- |
| Dépendances   | Explicites               | Automatiques                |
| Acces old/new | Oui                      | Non                         |
| Lazy          | Oui (par defaut)         | Non (execute immediatement) |
| Utilise quand | Tu veux comparer old/new | Tu veux juste reagir        |

## Stopper un watcher

```ts
const stop = watch(search, (val) => {
  fetchResults(val);
});

// Plus tard...
stop(); // arrete le watcher
```

## `watchEffect` avec cleanup

```ts
watchEffect((onCleanup) => {
  const controller = new AbortController();

  fetch(`/api/search?q=${search.value}`, {
    signal: controller.signal,
  });

  onCleanup(() => {
    controller.abort(); // annule le fetch precedent
  });
});
```

## `provide` / `inject` — communication profonde

Quand un parent doit passer des donnees a un descendant lointain sans faire du prop drilling :

```ts
// types.ts
import type { InjectionKey, Ref } from "vue";

export interface AuthUser {
  id: number;
  name: string;
  role: string;
}

export const AuthKey: InjectionKey<Ref<AuthUser | null>> = Symbol("auth");
```

```vue
<!-- GrandParent.vue -->
<script setup lang="ts">
import { provide, ref } from "vue";
import { AuthKey } from "./types";
import type { AuthUser } from "./types";

const user = ref<AuthUser | null>({ id: 1, name: "Alice", role: "admin" });
provide(AuthKey, user);
</script>
```

```vue
<!-- DeepChild.vue (n'importe quel niveau enfant) -->
<script setup lang="ts">
import { inject } from "vue";
import { AuthKey } from "./types";

const user = inject(AuthKey);
// user est Ref<AuthUser | null> | undefined
</script>

<template>
  <p v-if="user">Connecte : {{ user.name }}</p>
  <p v-else>Non connecte</p>
</template>
```

### Règle : toujours utiliser `InjectionKey<T>` pour le typage.

## `nextTick` — attendre le prochain rendu

```ts
import { nextTick, ref } from "vue";

const message = ref<string>("Bonjour");

async function updateAndMeasure(): Promise<void> {
  message.value = "Nouveau message";

  // Le DOM n'est pas encore mis a jour ici
  await nextTick();
  // Maintenant le DOM est a jour
  const el = document.querySelector(".message");
  console.log(el?.textContent); // "Nouveau message"
}
```

## Suite

→ `cours/02-intermediaire/02-composables.md`
