# 02 — tRPC

## Qu'est-ce que tRPC ?

Un framework pour creer des APIs **100% type-safe** entre le backend et le frontend, **sans schema ni code generation**.

Le backend definit des procedures TypeScript → le frontend les appelle avec **autocompletion et verification de types**.

## Setup backend (Express ou Nuxt)

```ts
// server/trpc.ts
import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;
```

```ts
// server/routers/user.ts
import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const userRouter = router({
  getAll: publicProcedure.query(async () => {
    // return await db.select().from(users)
    return [{ id: 1, name: "Alice", email: "alice@test.com" }];
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      // return await db.select().from(users).where(eq(users.id, input.id))
      return { id: input.id, name: "Alice", email: "alice@test.com" };
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ input }) => {
      // const [user] = await db.insert(users).values(input).returning()
      return { id: Date.now(), ...input };
    }),
});
```

```ts
// server/index.ts
import { router } from "./trpc";
import { userRouter } from "./routers/user";

export const appRouter = router({
  user: userRouter,
});

export type AppRouter = typeof appRouter; // ← exporte le TYPE
```

## Setup frontend Vue 3

```bash
pnpm add @trpc/client @trpc/server
```

```ts
// utils/trpc.ts
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../server"; // Import du TYPE seulement

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/api/trpc",
    }),
  ],
});
```

## Utilisation dans un composant

```vue
<script setup lang="ts">
import { trpc } from "@/utils/trpc";

const users = ref<Awaited<ReturnType<typeof trpc.user.getAll.query>>>([]);
const isLoading = ref(false);

async function loadUsers(): Promise<void> {
  isLoading.value = true;
  try {
    users.value = await trpc.user.getAll.query();
    // ← type-safe ! TS sait que c'est User[]
  } finally {
    isLoading.value = false;
  }
}

async function createUser(name: string, email: string): Promise<void> {
  const newUser = await trpc.user.create.mutate({ name, email });
  // ← TS sait que newUser a id, name, email
  users.value.push(newUser);
}

onMounted(loadUsers);
</script>
```

## Composable tRPC

```ts
// composables/useTrpcQuery.ts
import { ref, onMounted } from "vue";

export function useTrpcQuery<T>(queryFn: () => Promise<T>) {
  const data = ref<T | null>(null) as Ref<T | null>;
  const error = ref<string | null>(null);
  const isLoading = ref(false);

  async function execute(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      data.value = await queryFn();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Erreur";
    } finally {
      isLoading.value = false;
    }
  }

  onMounted(execute);

  return { data, error, isLoading, refetch: execute };
}
```

```vue
<script setup lang="ts">
const { data: users, isLoading } = useTrpcQuery(() => trpc.user.getAll.query());
</script>
```

## GraphQL vs tRPC vs REST

|                 | REST     | GraphQL            | tRPC          |
| --------------- | -------- | ------------------ | ------------- |
| Type safety     | Manuelle | Avec codegen       | Native        |
| Overhead        | Faible   | Schema + resolvers | Faible        |
| Ecosysteme      | Enorme   | Large              | Croissant     |
| Cas d'usage ESN | Standard | Gros projets, BFF  | Full-stack TS |

## Suite

→ `cours/09-accessibilite/01-fondamentaux-wcag.md`
