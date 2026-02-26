# 07 — MSW (Mock Service Worker)

## Le problème

Quand tu testes (unitaire, composant ou E2E), tu as besoin de données API. Les options classiques :

| Approche           | Problème                                               |
| ------------------ | ------------------------------------------------------ |
| Vrai serveur       | Lent, instable, données qui changent                   |
| `vi.mock('fetch')` | Couple le test à l'implémentation du fetch             |
| JSON statique      | Pas réaliste (pas de headers, status, latence)         |
| **MSW**            | ✅ Intercepte au niveau réseau, transparent pour l'app |

## Qu'est-ce que MSW ?

**Mock Service Worker** intercepte les requêtes HTTP **au niveau du réseau** (Service Worker dans le navigateur, intercepteur Node en tests). Ton app ne sait pas qu'elle parle à un mock.

```
App → fetch('/api/users') → [MSW intercepte] → réponse mockée
                              ↑ transparent
```

## Setup

```bash
pnpm add -D msw
```

### Handlers : définir les réponses

```ts
// mocks/handlers.ts
import { http, HttpResponse } from "msw";

interface User {
  id: number;
  name: string;
  email: string;
}

const users: User[] = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
];

export const handlers = [
  // GET /api/users
  http.get("/api/users", () => {
    return HttpResponse.json(users);
  }),

  // GET /api/users/:id
  http.get("/api/users/:id", ({ params }) => {
    const id = Number(params.id);
    const user = users.find((u) => u.id === id);

    if (!user) {
      return HttpResponse.json(
        { message: "Utilisateur introuvable" },
        { status: 404 },
      );
    }

    return HttpResponse.json(user);
  }),

  // POST /api/users
  http.post("/api/users", async ({ request }) => {
    const body = (await request.json()) as Omit<User, "id">;
    const newUser: User = { id: Date.now(), ...body };
    users.push(newUser);

    return HttpResponse.json(newUser, { status: 201 });
  }),

  // DELETE /api/users/:id
  http.delete("/api/users/:id", ({ params }) => {
    const id = Number(params.id);
    const index = users.findIndex((u) => u.id === id);

    if (index === -1) {
      return HttpResponse.json({ message: "Not found" }, { status: 404 });
    }

    users.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
```

### Serveur pour les tests (Node)

```ts
// mocks/server.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

### Setup Vitest

```ts
// vitest.setup.ts
import { beforeAll, afterEach, afterAll } from "vitest";
import { server } from "./mocks/server";

// Démarrer MSW avant les tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Reset les handlers après chaque test (pas d'état partagé)
afterEach(() => server.resetHandlers());

// Fermer après tous les tests
afterAll(() => server.close());
```

```ts
// vitest.config.ts (ou vite.config.ts)
export default defineConfig({
  test: {
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

## Utiliser MSW dans les tests unitaires

```ts
// composables/__tests__/useUsers.spec.ts
import { describe, it, expect } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { useUsers } from "../useUsers";

describe("useUsers", () => {
  it("charge la liste des utilisateurs", async () => {
    const { users, isLoading, fetchUsers } = useUsers();

    expect(isLoading.value).toBe(false);

    fetchUsers();
    expect(isLoading.value).toBe(true);

    await flushPromises();

    expect(isLoading.value).toBe(false);
    expect(users.value).toHaveLength(2);
    expect(users.value[0].name).toBe("Alice");
    // ← MSW a intercepté le fetch transparentement
  });
});
```

## Override par test (scénarios d'erreur)

```ts
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";

it("gère une erreur serveur", async () => {
  // Override le handler JUSTE pour ce test
  server.use(
    http.get("/api/users", () => {
      return HttpResponse.json(
        { message: "Internal Server Error" },
        { status: 500 },
      );
    }),
  );

  const { error, fetchUsers } = useUsers();
  await fetchUsers();

  expect(error.value).toBe("Erreur serveur");
  // Le handler original est restauré par afterEach → server.resetHandlers()
});

it("gère un timeout / erreur réseau", async () => {
  server.use(
    http.get("/api/users", () => {
      return HttpResponse.error(); // Simule une erreur réseau
    }),
  );

  const { error, fetchUsers } = useUsers();
  await fetchUsers();

  expect(error.value).toContain("réseau");
});
```

## MSW dans les tests de composants

```ts
import { mount, flushPromises } from "@vue/test-utils";
import UserList from "../UserList.vue";

it("affiche la liste des utilisateurs", async () => {
  const wrapper = mount(UserList);

  // Attendre le fetch (intercepté par MSW)
  await flushPromises();

  expect(wrapper.text()).toContain("Alice");
  expect(wrapper.text()).toContain("Bob");
});

it("affiche un message d'erreur si l'API échoue", async () => {
  server.use(
    http.get("/api/users", () => {
      return HttpResponse.json({ message: "Erreur" }, { status: 500 });
    }),
  );

  const wrapper = mount(UserList);
  await flushPromises();

  expect(wrapper.text()).toContain("Erreur");
});
```

## MSW dans le navigateur (dev mode)

Tu peux aussi utiliser MSW en développement pour travailler **sans backend** :

```bash
npx msw init public/ --save
# Crée public/mockServiceWorker.js
```

```ts
// mocks/browser.ts
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
```

```ts
// main.ts
async function start(): Promise<void> {
  if (import.meta.env.DEV && import.meta.env.VITE_MSW === "true") {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  }

  const app = createApp(App);
  app.mount("#app");
}

start();
```

```bash
# Lancer avec MSW activé
VITE_MSW=true pnpm dev
```

**Avantage** : le frontend est 100% fonctionnel sans backend. Idéal quand l'équipe back n'a pas encore livré l'API.

## MSW + Playwright (E2E)

Pour les tests E2E, MSW fonctionne via le Service Worker dans le navigateur :

```ts
// e2e/fixtures/msw.ts
import { test as base } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, use) => {
    // Attendre que le Service Worker MSW soit prêt
    await page.goto("/");
    await page.waitForFunction(() => {
      return (window as any).__MSW_READY__ === true;
    });
    await use(page);
  },
});
```

Alternative plus simple : utiliser `page.route()` de Playwright directement :

```ts
test("affiche les produits (API mockée)", async ({ page }) => {
  // Intercepter au niveau Playwright
  await page.route("/api/products", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { id: 1, name: "Produit A", price: 29.99 },
        { id: 2, name: "Produit B", price: 49.99 },
      ]),
    }),
  );

  await page.goto("/products");
  await expect(page.getByText("Produit A")).toBeVisible();
  await expect(page.getByText("29,99")).toBeVisible();
});

test("affiche une erreur si l'API échoue", async ({ page }) => {
  await page.route("/api/products", (route) =>
    route.fulfill({ status: 500, body: "Server Error" }),
  );

  await page.goto("/products");
  await expect(page.getByText("Erreur")).toBeVisible();
});
```

## MSW + TanStack Query

MSW s'intègre parfaitement avec Vue Query :

```ts
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query";
import { mount, flushPromises } from "@vue/test-utils";

function mountWithQuery(component: Component) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false }, // Pas de retry en test
    },
  });

  return mount(component, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
    },
  });
}

it("charge les données via TanStack Query + MSW", async () => {
  const wrapper = mountWithQuery(ProductList);

  // TanStack Query fetch → MSW intercepte → données retournées
  await flushPromises();
  await flushPromises(); // Double flush pour Query

  expect(wrapper.text()).toContain("Alice");
});
```

## Bonnes pratiques MSW

| Règle                                     | Pourquoi                                  |
| ----------------------------------------- | ----------------------------------------- |
| Un fichier `handlers.ts` central          | Source de vérité des mocks                |
| Override par test avec `server.use()`     | Scénarios d'erreur sans polluer le global |
| `server.resetHandlers()` dans `afterEach` | Isolation entre tests                     |
| `onUnhandledRequest: 'error'`             | Détecte les appels API non mockés         |
| Types sur les request/response bodies     | Cohérence avec les vrais types de l'app   |
| Même handlers pour dev et tests           | Un seul jeu de mocks à maintenir          |

## En contexte ESN

| Situation                      | Valeur MSW                                    |
| ------------------------------ | --------------------------------------------- |
| Backend pas encore prêt        | Développer le front sans attendre             |
| Tests instables (API flaky)    | Mocks déterministes, tests fiables            |
| CI sans infrastructure serveur | Zero dépendance externe dans le pipeline      |
| Onboarding nouveau dev         | `pnpm dev` fonctionne sans configurer le back |
| Démonstrations / démos PO      | Données prévisibles et contrôlables           |

## Suite

→ `cours/04-expert/01-performance.md`
