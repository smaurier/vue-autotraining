# 03 — Tests unitaires Vue (Vitest)

---

> **Prérequis : Testing Course**
> Les fondamentaux de Vitest (configuration, matchers, mocking, tests asynchrones) sont couverts en detail dans le **Testing Course** (modules 02-05).
> Ce module se concentre uniquement sur les **specificites Vue** : tester des composables et des fonctions utilitaires Vue.
>
> → [Testing Course — Vitest fondamentaux](https://github.com/smaurier/testing-course)

---

## Objectifs

- Tester des composables Vue 3 avec Vitest
- Tester des fonctions utilisant la réactivité Vue (`ref`, `computed`, `watch`)
- Configurer Vitest pour un projet Vue/Nuxt

---

## Configuration Vitest pour Vue

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: "jsdom",
  },
});
```

---

## Tester des composables

### Composable simple

```typescript
// composables/useCounter.ts
import { ref, computed } from "vue";

export function useCounter(initial = 0) {
  const count = ref(initial);
  const doubled = computed(() => count.value * 2);

  function increment() {
    count.value++;
  }
  function decrement() {
    count.value--;
  }
  function reset() {
    count.value = initial;
  }

  return { count, doubled, increment, decrement, reset };
}
```

```typescript
// composables/useCounter.test.ts
import { describe, it, expect } from "vitest";
import { useCounter } from "./useCounter";

describe("useCounter", () => {
  it("should start at 0 by default", () => {
    const { count } = useCounter();
    expect(count.value).toBe(0);
  });

  it("should accept initial value", () => {
    const { count } = useCounter(10);
    expect(count.value).toBe(10);
  });

  it("should increment", () => {
    const { count, increment } = useCounter();
    increment();
    expect(count.value).toBe(1);
  });

  it("should compute doubled", () => {
    const { doubled, increment } = useCounter(5);
    expect(doubled.value).toBe(10);
    increment();
    expect(doubled.value).toBe(12);
  });

  it("should reset to initial value", () => {
    const { count, increment, reset } = useCounter(5);
    increment();
    increment();
    reset();
    expect(count.value).toBe(5);
  });
});
```

### Composable avec lifecycle (nécessité un composant hote)

```typescript
// composables/useWindowSize.ts
import { ref, onMounted, onUnmounted } from "vue";

export function useWindowSize() {
  const width = ref(window.innerWidth);
  const height = ref(window.innerHeight);

  function update() {
    width.value = window.innerWidth;
    height.value = window.innerHeight;
  }

  onMounted(() => window.addEventListener("resize", update));
  onUnmounted(() => window.removeEventListener("resize", update));

  return { width, height };
}
```

```typescript
// composables/useWindowSize.test.ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { useWindowSize } from "./useWindowSize";

// Wrapper component pour lifecycle hooks
function withSetup<T>(composable: () => T) {
  let result: T;
  const Comp = defineComponent({
    setup() {
      result = composable();
      return {};
    },
    render() {
      return null;
    },
  });
  const wrapper = mount(Comp);
  return { result: result!, wrapper };
}

describe("useWindowSize", () => {
  it("should return current window dimensions", () => {
    const { result } = withSetup(() => useWindowSize());
    expect(result.width.value).toBe(window.innerWidth);
    expect(result.height.value).toBe(window.innerHeight);
  });
});
```

### Composable avec API (useAsyncData pattern)

```typescript
// composables/useFetch.ts
import { ref } from "vue";

export function useFetch<T>(url: string) {
  const data = ref<T | null>(null);
  const error = ref<Error | null>(null);
  const loading = ref(false);

  async function execute() {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data.value = await response.json();
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  }

  return { data, error, loading, execute };
}
```

```typescript
// composables/useFetch.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useFetch } from "./useFetch";

describe("useFetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch data successfully", async () => {
    const mockData = { id: 1, name: "Alice" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { data, loading, error, execute } = useFetch("/api/users/1");
    expect(loading.value).toBe(false);

    await execute();

    expect(data.value).toEqual(mockData);
    expect(error.value).toBeNull();
    expect(loading.value).toBe(false);
  });

  it("should handle HTTP errors", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    const { data, error, execute } = useFetch("/api/users/999");
    await execute();

    expect(data.value).toBeNull();
    expect(error.value?.message).toBe("HTTP 404");
  });
});
```

---

## Tester des utilitaires réactifs

```typescript
// utils/reactive-utils.ts
import { ref, watch } from "vue";

export function useDebounce<T>(source: Ref<T>, delay: number) {
  const debounced = ref(source.value) as Ref<T>;
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

```typescript
// utils/reactive-utils.test.ts
import { describe, it, expect, vi } from "vitest";
import { ref, nextTick } from "vue";
import { useDebounce } from "./reactive-utils";

describe("useDebounce", () => {
  it("should debounce value changes", async () => {
    vi.useFakeTimers();
    const source = ref("hello");
    const debounced = useDebounce(source, 300);

    source.value = "world";
    await nextTick();
    expect(debounced.value).toBe("hello"); // Pas encore change

    vi.advanceTimersByTime(300);
    await nextTick();
    expect(debounced.value).toBe("world"); // Maintenant oui

    vi.useRealTimers();
  });
});
```

---

## Exercice

→ `exercices/17-tests-complets/ENONCE.md`

---

## Navigation

| Précédent                                           | Suivant                                              |
| --------------------------------------------------- | ---------------------------------------------------- |
| [02 — Pinia avance](./02-pinia-state-management.md) | [04 — Tests de composants](./04-tests-composants.md) |
