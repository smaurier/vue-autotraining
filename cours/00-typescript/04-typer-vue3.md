# 04 — Typer Vue 3 (ref, props, emits, slots)

## Typer `ref`

```ts
import { ref } from "vue";

// Inference simple
const count = ref(0); // Ref<number>

// Annotation explicite quand necessaire
const user = ref<User | null>(null); // Ref<User | null>
const items = ref<Product[]>([]); // Ref<Product[]>
```

**Règle : annote `ref` quand la valeur initiale ne suffit pas a inférer le type.**

## Typer `reactive`

```ts
import { reactive } from "vue";

interface FormState {
  name: string;
  email: string;
  age: number | null;
}

const form = reactive<FormState>({
  name: "",
  email: "",
  age: null,
});
```

## Typer `computed`

```ts
import { computed } from "vue";

// Inference automatique dans la plupart des cas
const double = computed(() => count.value * 2); // ComputedRef<number>

// Annotation explicite si necessaire
const status = computed<"idle" | "loading" | "done">(() => {
  if (!started.value) return "idle";
  if (pending.value) return "loading";
  return "done";
});
```

## Typer `watch`

```ts
import { watch } from "vue";

watch(count, (newVal, oldVal) => {
  // newVal et oldVal sont types automatiquement comme number
  console.log(`${oldVal} → ${newVal}`);
});

// Watcher sur plusieurs sources
watch([count, name], ([newCount, newName], [oldCount, oldName]) => {
  // newCount: number, newName: string
});
```

## Typer les props

```vue
<script setup lang="ts">
// Syntaxe type-only (recommandee)
const props = defineProps<{
  title: string;
  count: number;
  items: Product[];
  variant?: "primary" | "secondary"; // optionnelle
}>();
</script>
```

Avec valeurs par defaut :

```vue
<script setup lang="ts">
interface Props {
  title: string;
  count?: number;
  variant?: "primary" | "secondary";
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
  variant: "primary",
});
</script>
```

## Typer les emits

```vue
<script setup lang="ts">
// Syntaxe type-only
const emit = defineEmits<{
  (event: "update", id: number): void;
  (event: "delete", id: number): void;
  (event: "search", query: string): void;
}>();

// Utilisation
emit("update", 42); // ✅
emit("update", "42"); // ❌ string au lieu de number
emit("unknown", 1); // ❌ event inconnu
</script>
```

Syntaxe alternative (Vue 3.3+) :

```vue
<script setup lang="ts">
const emit = defineEmits<{
  update: [id: number];
  delete: [id: number];
  search: [query: string];
}>();
</script>
```

## Typer les slots

```vue
<script setup lang="ts">
defineSlots<{
  default(props: { item: Product; index: number }): any;
  header(props: { title: string }): any;
  empty(): any;
}>();
</script>
```

## Typer provide / inject

```ts
// types.ts
import type { InjectionKey, Ref } from "vue";

export const ThemeKey: InjectionKey<Ref<"light" | "dark">> = Symbol("theme");
export const ApiClientKey: InjectionKey<ApiClient> = Symbol("api");
```

```ts
// Parent : provide
import { provide, ref } from "vue";
import { ThemeKey } from "./types";

const theme = ref<"light" | "dark">("light");
provide(ThemeKey, theme);
```

```ts
// Child : inject
import { inject } from "vue";
import { ThemeKey } from "./types";

const theme = inject(ThemeKey); // Ref<'light' | 'dark'> | undefined
if (!theme) throw new Error("ThemeKey not provided");
```

## Typer les template refs

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";

const inputRef = ref<HTMLInputElement | null>(null);

onMounted(() => {
  inputRef.value?.focus();
});
</script>

<template>
  <input ref="inputRef" />
</template>
```

## Résumé : quand annoter ?

| Situation                 | Annoter ?                  |
| ------------------------- | -------------------------- |
| `ref(0)`, `ref('hello')`  | Non, inference OK          |
| `ref<User \| null>(null)` | Oui, initial ne suffit pas |
| Props                     | Toujours (defineProps)     |
| Emits                     | Toujours (defineEmits)     |
| Computed simple           | Non, inference OK          |
| Computed complexe (union) | Oui                        |
| Provide/Inject            | Toujours (InjectionKey)    |

## Suite

→ `cours/01-debutant/01-environnement-et-premier-composant.md`
