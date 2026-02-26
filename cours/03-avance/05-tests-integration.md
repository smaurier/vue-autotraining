# 05 — Tests d'integration

## Qu'est-ce qu'un test d'integration ?

Un test qui verifie que plusieurs unites fonctionnent **ensemble** :

- Composant + Store
- Composant + Router
- Feature complète (plusieurs composants + logique)

## Tester un flux complet : login + redirection

```ts
// __tests__/integration/login-flow.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import LoginPage from "@/views/LoginPage.vue";
import DashboardPage from "@/views/DashboardPage.vue";
import App from "@/App.vue";

// Mock fetch
global.fetch = vi.fn();

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/login", name: "login", component: LoginPage },
      { path: "/dashboard", name: "dashboard", component: DashboardPage },
    ],
  });
}

describe("Flux de login", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("redirige vers le dashboard apres login reussi", async () => {
    const router = createTestRouter();
    router.push("/login");
    await router.isReady();

    // Mock reponse API
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          token: "fake-token",
          user: { id: 1, name: "Alice", role: "user" },
        }),
    });

    const wrapper = mount(LoginPage, {
      global: {
        plugins: [router, createPinia()],
      },
    });

    // Remplir le formulaire
    await wrapper.find('input[name="email"]').setValue("alice@test.com");
    await wrapper.find('input[name="password"]').setValue("secret");
    await wrapper.find("form").trigger("submit");

    await flushPromises();

    // Verifier la redirection
    expect(router.currentRoute.value.name).toBe("dashboard");
  });

  it("affiche une erreur si identifiants invalides", async () => {
    const router = createTestRouter();
    router.push("/login");
    await router.isReady();
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    const wrapper = mount(LoginPage, {
      global: {
        plugins: [router, createPinia()],
      },
    });

    await wrapper.find('input[name="email"]').setValue("alice@test.com");
    await wrapper.find('input[name="password"]').setValue("wrong");
    await wrapper.find("form").trigger("submit");

    await flushPromises();

    expect(wrapper.text()).toContain("Identifiants invalides");
    expect(router.currentRoute.value.name).toBe("login");
  });
});
```

## Tester un CRUD complet

```ts
describe("Page produits", () => {
  it("charge, affiche et supprime un produit", async () => {
    // Mock GET
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          { id: 1, name: "Clavier", price: 89 },
          { id: 2, name: "Souris", price: 49 },
        ]),
    });

    const wrapper = mount(ProductPage, {
      global: { plugins: [createPinia()] },
    });

    await flushPromises();

    // Les produits sont affiches
    expect(wrapper.findAll(".product-card")).toHaveLength(2);
    expect(wrapper.text()).toContain("Clavier");

    // Mock DELETE
    (global.fetch as any).mockResolvedValueOnce({ ok: true });

    // Supprimer le premier
    await wrapper.findAll(".delete-btn")[0].trigger("click");
    await flushPromises();

    expect(wrapper.findAll(".product-card")).toHaveLength(1);
    expect(wrapper.text()).not.toContain("Clavier");
  });
});
```

## Helper : wrapper factory

Pour éviter de répéter le setup :

```ts
function createWrapper(options = {}) {
  const pinia = createPinia();
  const router = createTestRouter();

  return {
    wrapper: mount(App, {
      global: {
        plugins: [pinia, router],
        ...options,
      },
    }),
    pinia,
    router,
  };
}
```

## Tester les guards de route

```ts
describe("Route guard auth", () => {
  it("redirige vers login si non authentifie", async () => {
    const router = createTestRouter(); // avec guard dedans
    router.push("/dashboard");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("login");
  });

  it("autorise l acces si authentifie", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const authStore = useAuthStore();
    authStore.token = "valid-token";

    const router = createTestRouter();
    router.push("/dashboard");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("dashboard");
  });
});
```

## Quand ecrire un test d'integration vs unitaire ?

| Test unitaire    | Test d'integration       |
| ---------------- | ------------------------ |
| Fonction pure    | Flux utilisateur complet |
| Composable isole | Composant + store        |
| 1 composant      | Navigation + guards      |
| Rapide, isole    | Plus lent, plus realiste |

**En ESN :** un bon ratio est 70% unitaires, 25% integration, 5% E2E.

## Suite

→ Module 04 : `cours/04-expert/01-performance.md`
