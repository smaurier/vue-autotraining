# 03 — Tests unitaires (Vitest)

## Installation

```bash
pnpm add -D vitest @vue/test-utils happy-dom
```

```ts
// vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "happy-dom",
    globals: true,
  },
});
```

```json
// package.json (ajout)
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Premier test

```ts
// utils/math.ts
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2) + " €";
}
```

```ts
// utils/__tests__/math.test.ts
import { describe, it, expect } from "vitest";
import { clamp, formatPrice } from "../math";

describe("clamp", () => {
  it("retourne la valeur si dans les bornes", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("retourne min si en dessous", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
  });

  it("retourne max si au dessus", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe("formatPrice", () => {
  it("formate les centimes en euros", () => {
    expect(formatPrice(1999)).toBe("19.99 €");
    expect(formatPrice(0)).toBe("0.00 €");
  });
});
```

## Tester un composable

```ts
// composables/__tests__/useCounter.test.ts
import { describe, it, expect } from "vitest";
import { useCounter } from "../useCounter";

describe("useCounter", () => {
  it("initialise avec la valeur par defaut", () => {
    const { count } = useCounter();
    expect(count.value).toBe(0);
  });

  it("incremente", () => {
    const { count, increment } = useCounter();
    increment();
    expect(count.value).toBe(1);
  });

  it("respecte le max", () => {
    const { count, increment } = useCounter(9, 0, 10);
    increment();
    increment(); // ne devrait pas depasser 10
    expect(count.value).toBe(10);
  });

  it("respecte le min", () => {
    const { count, decrement } = useCounter(1, 0, 10);
    decrement();
    decrement(); // ne devrait pas descendre sous 0
    expect(count.value).toBe(0);
  });

  it("reset remet a la valeur initiale", () => {
    const { count, increment, reset } = useCounter(5);
    increment();
    increment();
    reset();
    expect(count.value).toBe(5);
  });
});
```

## Matchers essentiels

```ts
// Egalite
expect(value).toBe(5); // strict ===
expect(obj).toEqual({ a: 1 }); // deep equal

// Verite
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeDefined();

// Nombres
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThanOrEqual(10);
expect(0.1 + 0.2).toBeCloseTo(0.3);

// Strings
expect(str).toContain("hello");
expect(str).toMatch(/regex/);

// Tableaux
expect(arr).toContain(item);
expect(arr).toHaveLength(3);

// Exceptions
expect(() => fn()).toThrow();
expect(() => fn()).toThrow("message");

// Async
await expect(asyncFn()).resolves.toBe(value);
await expect(asyncFn()).rejects.toThrow();
```

## Mocks

```ts
import { describe, it, expect, vi } from "vitest";

// Mock une fonction
const mockFn = vi.fn();
mockFn("arg");
expect(mockFn).toHaveBeenCalledWith("arg");
expect(mockFn).toHaveBeenCalledTimes(1);

// Mock avec retour
const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: () => [] });

// Mock un module
vi.mock("@/api/client", () => ({
  fetchUsers: vi.fn().mockResolvedValue([{ id: 1, name: "Alice" }]),
}));

// Spy sur une methode existante
const spy = vi.spyOn(localStorage, "getItem");
spy.mockReturnValue("some-value");
```

## Tester un composable async

```ts
// composables/__tests__/useAsyncData.test.ts
import { describe, it, expect, vi } from "vitest";
import { useAsyncData } from "../useAsyncData";

describe("useAsyncData", () => {
  it("gere le loading et success", async () => {
    const fetcher = vi.fn().mockResolvedValue([{ id: 1 }]);
    const { data, status, execute } = useAsyncData(fetcher);

    expect(status.value).toBe("idle");

    const promise = execute();
    expect(status.value).toBe("loading");

    await promise;
    expect(status.value).toBe("success");
    expect(data.value).toEqual([{ id: 1 }]);
  });

  it("gere les erreurs", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("Network error"));
    const { error, status, execute } = useAsyncData(fetcher);

    await execute();

    expect(status.value).toBe("error");
    expect(error.value).toBe("Network error");
  });
});
```

## Pyramide de tests

```
         /  E2E  \           ← peu, couteux, lents
        / Integra \          ← moderee
       /  Compo-   \         ← par composant critique
      /  nents      \
     /  Composables   \      ← beaucoup
    /   Utils / Pure    \    ← maximum, rapides
```

En ESN : concentre-toi sur les tests de **logique pure** et de **composables**. Test les composants seulement sur les comportements critiques.

## Suite

→ `cours/03-avance/04-tests-composants.md`
