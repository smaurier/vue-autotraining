# 01 — Performance

## Les vrais goulots en Vue 3

1. **Re-renders inutiles** (le plus frequent)
2. **Bundle trop gros** (chargement initial lent)
3. **Listes volumineuses** sans virtualisation
4. **Watchers en cascade** (effets de bord en chaine)

## Diagnostiquer avec Vue DevTools

1. Installe l'extension **Vue DevTools** dans Chrome/Firefox
2. Onglet **Performance** : enregistre et analyse les re-renders
3. Onglet **Components** : inspecte les temps de render

## Éviter les re-renders inutiles

### `v-once` — rendu statique

```vue
<template>
  <!-- Ne sera rendu qu'une seule fois, jamais re-rendu -->
  <header v-once>
    <h1>{{ appTitle }}</h1>
  </header>
</template>
```

### `v-memo` — memo conditionnel (Vue 3.2+)

```vue
<template>
  <div v-for="item in list" :key="item.id" v-memo="[item.id, item.selected]">
    <!-- Re-rendu UNIQUEMENT si item.id ou item.selected change -->
    <ExpensiveComponent :item="item" />
  </div>
</template>
```

### `shallowRef` pour les gros objets

```ts
import { shallowRef } from "vue";

// Ne track PAS les mutations profondes (plus rapide)
const hugeList = shallowRef<DataPoint[]>([]);

// Pour update : reassigne
hugeList.value = [...hugeList.value, newItem];
```

## Lazy loading (code splitting)

### Routes

```ts
// Chaque route = un chunk separe
{
  path: '/admin',
  component: () => import('@/views/AdminView.vue'),
}
```

### Composants

```vue
<script setup lang="ts">
import { defineAsyncComponent } from "vue";

const HeavyChart = defineAsyncComponent(
  () => import("@/components/HeavyChart.vue"),
);
</script>

<template>
  <Suspense>
    <HeavyChart />
    <template #fallback>Chargement du graphique...</template>
  </Suspense>
</template>
```

### `defineAsyncComponent` avec options

```ts
const AsyncModal = defineAsyncComponent({
  loader: () => import("@/components/Modal.vue"),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorDisplay,
  delay: 200, // Affiche loading apres 200ms
  timeout: 10000, // Timeout apres 10s
});
```

## Virtualisation de listes

Pour des listes de 1000+ éléments, ne rend que les éléments visibles :

```bash
pnpm add @tanstack/vue-virtual
```

```vue
<script setup lang="ts">
import { useVirtualizer } from "@tanstack/vue-virtual";
import { ref } from "vue";

const parentRef = ref<HTMLDivElement | null>(null);
const items = ref<string[]>(
  Array.from({ length: 10000 }, (_, i) => `Item ${i}`),
);

const virtualizer = useVirtualizer({
  count: items.value.length,
  getScrollElement: () => parentRef.value,
  estimateSize: () => 35,
});
</script>

<template>
  <div ref="parentRef" style="height: 400px; overflow: auto">
    <div
      :style="{
        height: `${virtualizer.getTotalSize()}px`,
        position: 'relative',
      }"
    >
      <div
        v-for="row in virtualizer.getVirtualItems()"
        :key="row.key"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${row.size}px`,
          transform: `translateY(${row.start}px)`,
        }"
      >
        {{ items[row.index] }}
      </div>
    </div>
  </div>
</template>
```

## Bundle analysis

```bash
pnpm add -D rollup-plugin-visualizer
```

```ts
// vite.config.ts
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [vue(), visualizer({ open: true, gzipSize: true })],
});
```

```bash
pnpm build
# Ouvre un fichier HTML avec la carte du bundle
```

## Budgets de performance

Criteres ESN typiques :

| Metrique                 | Budget       |
| ------------------------ | ------------ |
| First Contentful Paint   | < 1.5s       |
| Largest Contentful Paint | < 2.5s       |
| Total Blocking Time      | < 200ms      |
| Bundle JS initial        | < 200KB gzip |

## `KeepAlive` — garder les composants en cache

```vue
<template>
  <KeepAlive :max="5">
    <component :is="currentTab" />
  </KeepAlive>
</template>
```

Les composants sont **caches en mémoire** au lieu d'etre detruits/recrees.

Hooks spécifiques :

```ts
import { onActivated, onDeactivated } from "vue";

onActivated(() => {
  // Le composant revient du cache
  refreshData();
});

onDeactivated(() => {
  // Le composant part en cache
});
```

## Exercice

→ `exercices/13-performance-audit/ENONCE.md`

## Suite

→ `cours/04-expert/02-ssr-et-hydration.md`
