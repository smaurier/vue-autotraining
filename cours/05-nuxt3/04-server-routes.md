# 04 — Server routes

## API dans le meme projet

Nuxt 3 permet de creer des endpoints dans `server/api/` :

```ts
// server/api/hello.get.ts
export default defineEventHandler(() => {
  return { message: "Hello from server!" };
});
// → GET /api/hello → { message: "Hello from server!" }
```

## Convention de nommage

```
server/api/
  users.get.ts       → GET    /api/users
  users.post.ts      → POST   /api/users
  users/[id].get.ts  → GET    /api/users/:id
  users/[id].put.ts  → PUT    /api/users/:id
  users/[id].delete.ts → DELETE /api/users/:id
```

## Lire le body (POST/PUT)

```ts
// server/api/users.post.ts
interface CreateUserDto {
  name: string;
  email: string;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateUserDto>(event);

  // Validation
  if (!body.name || !body.email) {
    throw createError({
      statusCode: 400,
      statusMessage: "name et email requis",
    });
  }

  // Creer l'utilisateur (simule)
  const user = { id: Date.now(), ...body };
  return user;
});
```

## Parametres de route

```ts
// server/api/users/[id].get.ts
export default defineEventHandler((event) => {
  const id = getRouterParam(event, "id");
  // Chercher l'utilisateur par id...
  return { id: Number(id), name: "Alice" };
});
```

## Query params

```ts
// server/api/search.get.ts
export default defineEventHandler((event) => {
  const query = getQuery(event);
  const q = query.q as string;
  const page = Number(query.page) || 1;

  // Recherche...
  return { results: [], query: q, page };
});
// → GET /api/search?q=vue&page=2
```

## Middleware serveur

```ts
// server/middleware/auth.ts
export default defineEventHandler((event) => {
  const token = getHeader(event, "authorization");

  if (event.path.startsWith("/api/admin") && !token) {
    throw createError({ statusCode: 401, statusMessage: "Non autorise" });
  }
});
```

## Runtime config

```ts
// server/api/external.get.ts
export default defineEventHandler(() => {
  const config = useRuntimeConfig();
  // config.apiSecret → uniquement cote serveur
  // config.public.apiBase → aussi cote client

  return $fetch("https://external-api.com/data", {
    headers: { "X-API-Key": config.apiSecret },
  });
});
```

## Database (exemple avec Drizzle)

```ts
// server/utils/db.ts
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

const sqlite = new Database("db.sqlite");
export const db = drizzle(sqlite);
```

```ts
// server/api/users.get.ts
import { db } from "@/server/utils/db";
import { users } from "@/server/db/schema";

export default defineEventHandler(async () => {
  return db.select().from(users);
});
```

## Suite

→ `cours/05-nuxt3/05-seo-et-meta.md`
