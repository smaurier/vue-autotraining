# 01 — Vue Router

## Installation

```bash
pnpm add vue-router@4
```

## Configuration de base

```ts
// router/index.ts
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("@/views/HomeView.vue"),
  },
  {
    path: "/about",
    name: "about",
    component: () => import("@/views/AboutView.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("@/views/NotFoundView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
```

```ts
// main.ts
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

createApp(App).use(router).mount("#app");
```

## `<RouterView>` et `<RouterLink>`

```vue
<!-- App.vue -->
<template>
  <nav>
    <RouterLink to="/">Accueil</RouterLink>
    <RouterLink :to="{ name: 'about' }">A propos</RouterLink>
  </nav>

  <RouterView />
</template>
```

### `:to` avec objet (recommande)

```vue
<!-- Par nom (decouple du path) -->
<RouterLink :to="{ name: 'user', params: { id: 42 } }">Profil</RouterLink>

<!-- Avec query -->
<RouterLink :to="{ name: 'search', query: { q: 'vue' } }">Recherche</RouterLink>
```

## Routes dynamiques

```ts
{
  path: '/users/:id',
  name: 'user',
  component: () => import('@/views/UserView.vue'),
}
```

```vue
<!-- UserView.vue -->
<script setup lang="ts">
import { useRoute } from "vue-router";

const route = useRoute();
const userId = computed(() => Number(route.params.id));
</script>
```

## Routes imbriquees (nested)

```ts
{
  path: '/dashboard',
  component: () => import('@/views/DashboardLayout.vue'),
  children: [
    {
      path: '',
      name: 'dashboard-home',
      component: () => import('@/views/DashboardHome.vue'),
    },
    {
      path: 'settings',
      name: 'dashboard-settings',
      component: () => import('@/views/DashboardSettings.vue'),
    },
  ],
}
```

```vue
<!-- DashboardLayout.vue -->
<template>
  <div class="dashboard">
    <aside>Menu</aside>
    <main>
      <RouterView />
      <!-- Affiche le composant enfant -->
    </main>
  </div>
</template>
```

## Navigation programmatique

```ts
import { useRouter } from "vue-router";

const router = useRouter();

// Naviguer
router.push({ name: "user", params: { id: 42 } });
router.push("/about");

// Remplacer (pas d'entree dans l'historique)
router.replace({ name: "home" });

// Retour
router.back();
router.go(-2);
```

## Guards de navigation

### Guard globale

```ts
// router/index.ts
router.beforeEach((to, from) => {
  const isAuthenticated = !!localStorage.getItem("token");

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: "login" };
  }
});
```

### Guard par route

```ts
{
  path: '/admin',
  name: 'admin',
  component: () => import('@/views/AdminView.vue'),
  meta: { requiresAuth: true, role: 'admin' },
  beforeEnter: (to) => {
    const userRole = getUserRole()
    if (userRole !== 'admin') return { name: 'forbidden' }
  },
}
```

### Typer les meta

```ts
// router/types.ts
declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    role?: "admin" | "user" | "manager";
    title?: string;
  }
}
```

## Lazy loading par feature

```ts
const routes: RouteRecordRaw[] = [
  {
    path: "/admin",
    component: () => import("@/features/admin/AdminLayout.vue"),
    children: [
      // Tout l'admin est dans un seul chunk
      {
        path: "users",
        component: () => import("@/features/admin/views/UsersView.vue"),
      },
      {
        path: "settings",
        component: () => import("@/features/admin/views/SettingsView.vue"),
      },
    ],
  },
];
```

## Composable `useRouteQuery`

```ts
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

export function useRouteQuery(key: string, defaultValue = "") {
  const route = useRoute();
  const router = useRouter();

  return computed({
    get: () => (route.query[key] as string) ?? defaultValue,
    set: (value: string) => {
      router.replace({
        query: { ...route.query, [key]: value || undefined },
      });
    },
  });
}
```

## Exercice

→ `exercices/10-app-multi-pages/ENONCE.md`

## Suite

→ `cours/03-avance/02-pinia.md`
