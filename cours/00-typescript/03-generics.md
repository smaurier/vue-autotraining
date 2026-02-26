# 03 — Generics

## Le problème

```ts
function first(arr: number[]): number {
  return arr[0];
}
// Et pour string[] ? Et pour User[] ? On duplique ?
```

## La solution : les generics

```ts
function first<T>(arr: T[]): T {
  return arr[0];
}

first([1, 2, 3]); // T = number, retourne number
first(["a", "b"]); // T = string, retourne string
first<User>([alice]); // T = User, retourne User
```

`T` est un **parametre de type**. TS le deduit automatiquement la plupart du temps.

## Generics avec contraintes

```ts
// T doit avoir au moins un id
function findById<T extends { id: number }>(
  items: T[],
  id: number,
): T | undefined {
  return items.find((item) => item.id === id);
}

findById([{ id: 1, name: "Alice" }], 1); // OK
findById([{ color: "red" }], 1); // ❌ pas de propriete id
```

## Generics sur les interfaces

```ts
interface ApiResponse<T> {
  data: T;
  status: number;
  timestamp: string;
}

type UserResponse = ApiResponse<User>;
type ProductListResponse = ApiResponse<Product[]>;
```

## Generics sur les types

```ts
type Nullable<T> = T | null;

const user: Nullable<User> = null; // OK
const name: Nullable<string> = "Alice"; // OK
```

## Multiple generics

```ts
function map<T, U>(arr: T[], fn: (item: T) => U): U[] {
  return arr.map(fn);
}

map([1, 2, 3], (n) => n.toString()); // T=number, U=string
```

## Generics dans Vue 3

C'est partout :

```ts
import { ref, computed } from "vue";

// ref<T> : Ref<T>
const count = ref<number>(0); // Ref<number>
const user = ref<User | null>(null); // Ref<User | null>

// computed<T> : ComputedRef<T>
const double = computed<number>(() => count.value * 2);
```

## Cas concret : composable générique

```ts
function useLocalStorage<T>(key: string, defaultValue: T) {
  const stored = localStorage.getItem(key);
  const data = ref<T>(stored ? JSON.parse(stored) : defaultValue);

  watch(
    data,
    (val) => {
      localStorage.setItem(key, JSON.stringify(val));
    },
    { deep: true },
  );

  return data;
}

const theme = useLocalStorage<"light" | "dark">("theme", "light");
const cart = useLocalStorage<Product[]>("cart", []);
```

## Type guards (narrowing)

```ts
// typeof pour les primitifs
function format(value: string | number): string {
  if (typeof value === "string") {
    return value.toUpperCase(); // TS sait : string
  }
  return value.toFixed(2); // TS sait : number
}

// in pour les objets
interface Dog {
  bark(): void;
}
interface Cat {
  meow(): void;
}

function speak(pet: Dog | Cat): void {
  if ("bark" in pet) {
    pet.bark(); // TS sait : Dog
  } else {
    pet.meow(); // TS sait : Cat
  }
}

// Custom type guard
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === "object" && obj !== null && "id" in obj && "name" in obj
  );
}
```

## Exercice rapide

```ts
// 1. Ecris une fonction generique `groupBy<T>(arr: T[], key: keyof T): Record<string, T[]>`
// 2. Ecris un type PaginatedResponse<T> avec items: T[], total: number, page: number
// 3. Ecris un type guard isString(value: unknown): value is string
```

## Suite

→ `cours/00-typescript/04-typer-vue3.md`
