# 03 — Architecture front

## Feature-based architecture

```
src/
  features/
    auth/
      components/
        LoginForm.vue
        RegisterForm.vue
      composables/
        useAuth.ts
      stores/
        auth.ts
      views/
        LoginPage.vue
      types.ts
      routes.ts
    products/
      components/
        ProductCard.vue
        ProductFilters.vue
      composables/
        useProducts.ts
        useProductFilters.ts
      stores/
        products.ts
      views/
        ProductListPage.vue
        ProductDetailPage.vue
      types.ts
      routes.ts
  shared/
    components/
      AppButton.vue
      AppInput.vue
      DataTable.vue
    composables/
      useDebounce.ts
      usePagination.ts
    utils/
      validators.ts
      formatters.ts
    types/
      common.ts
  router/
    index.ts
  stores/
    index.ts
  App.vue
  main.ts
```

### Règles

1. **Chaque feature est autonome** : composants, composables, store, types, routes
2. **`shared/` pour le code transverse** : design system, utilitaires
3. **Pas d'import croise entre features** (sauf via shared)
4. **Les routes sont declarees par feature** et aggregees dans `router/index.ts`

## Routes par feature

```ts
// features/auth/routes.ts
import type { RouteRecordRaw } from "vue-router";

export const authRoutes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "login",
    component: () => import("./views/LoginPage.vue"),
  },
  {
    path: "/register",
    name: "register",
    component: () => import("./views/RegisterPage.vue"),
  },
];
```

```ts
// router/index.ts
import { authRoutes } from "@/features/auth/routes";
import { productRoutes } from "@/features/products/routes";

const routes: RouteRecordRaw[] = [
  ...authRoutes,
  ...productRoutes,
  { path: "/:pathMatch(.*)*", name: "not-found", component: NotFound },
];
```

## Couches d'abstraction

```
Vue Components (UI)
      ↓
Composables (logique reactive)
      ↓
Services (API client, business logic pure)
      ↓
Types (interfaces, contrats)
```

### Service layer

```ts
// services/productService.ts
import type { Product, CreateProductDto } from "@/features/products/types";

const BASE_URL = "/api/products";

export const productService = {
  async getAll(): Promise<Product[]> {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async getById(id: number): Promise<Product> {
    const res = await fetch(`${BASE_URL}/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async create(dto: CreateProductDto): Promise<Product> {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
};
```

### Separation composable / service

```ts
// composables/useProducts.ts
import { productService } from "@/services/productService";

export function useProducts() {
  const { data, error, status, execute } = useAsyncData(() =>
    productService.getAll(),
  );

  return {
    products: data,
    error,
    isLoading: computed(() => status.value === "loading"),
    refresh: execute,
  };
}
```

Le service est **testable sans Vue**. Le composable ajoute la **reactivite**.

## Conventions d'équipe

### Nommage

| Élément            | Convention                  | Exemple                       |
| ------------------ | --------------------------- | ----------------------------- |
| Composant          | PascalCase                  | `ProductCard.vue`             |
| Composable         | camelCase + `use`           | `useProducts.ts`              |
| Store              | camelCase + `use` + `Store` | `useProductStore`             |
| Type/Interface     | PascalCase                  | `Product`, `CreateProductDto` |
| Constante          | SCREAMING_SNAKE             | `MAX_RETRY_COUNT`             |
| Fichier utilitaire | camelCase                   | `formatters.ts`               |

### Règles d'import

```ts
// ✅ Import explicite
import { useProducts } from "@/features/products/composables/useProducts";

// ✅ Barrel export par feature (optionnel)
// features/products/index.ts
export { useProducts } from "./composables/useProducts";
export type { Product } from "./types";
```

## Gestion de la dette technique

| Indicateur                   | Seuil d'alerte            |
| ---------------------------- | ------------------------- |
| Composant > 300 lignes       | Decouper                  |
| Composable > 200 lignes      | Extraire sous-composables |
| Store qui gère > 2 domaines  | Splitter                  |
| Import circulaire            | Refactorer immediatement  |
| `any` dans le code           | Supprimer                 |
| Composant sans test critique | Ajouter                   |

## Suite

→ `cours/04-expert/04-patterns-entreprise.md`
