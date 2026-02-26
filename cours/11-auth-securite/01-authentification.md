# 01 — Authentification

## Les modèles d'authentification

| Modèle         | Comment ça marche                                      | Quand l'utiliser         |
| -------------- | ------------------------------------------------------ | ------------------------ |
| Session/Cookie | Serveur stocke la session, cookie HttpOnly côté client | Apps SSR, Nuxt           |
| JWT            | Token signé, stocké côté client                        | SPA, API stateless       |
| OAuth2 / OIDC  | Délègue l'auth à un provider (Google, Azure AD…)       | SSO, apps entreprise ESN |

## JWT : le standard en SPA

### Flux d'authentification

```
1. User envoie email + password → POST /api/auth/login
2. Serveur vérifie, retourne { accessToken, refreshToken }
3. Client stocke les tokens
4. Chaque requête API envoie le accessToken dans Authorization header
5. Si accessToken expiré → POST /api/auth/refresh avec le refreshToken
6. Si refreshToken expiré → redirect vers /login
```

### Où stocker les tokens ?

| Stockage           | Sécurité | Accessibilité       |
| ------------------ | -------- | ------------------- |
| `localStorage`     | ❌ XSS   | ✅ Facile           |
| `sessionStorage`   | ❌ XSS   | ✅ Par onglet       |
| Cookie `HttpOnly`  | ✅ Sûr   | ❌ Pas en JS        |
| Mémoire (variable) | ✅ Sûr   | ❌ Perdu au refresh |

**Recommandation ESN** : `accessToken` en mémoire + `refreshToken` en cookie HttpOnly.

## Composable `useAuth`

```ts
// composables/useAuth.ts
import { ref, computed, readonly } from "vue";

interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
}

const state = ref<AuthState>({
  user: null,
  accessToken: null,
});

export function useAuth() {
  const isAuthenticated = computed(() => state.value.user !== null);
  const user = computed(() => state.value.user);
  const role = computed(() => state.value.user?.role ?? null);

  async function login(credentials: LoginCredentials): Promise<void> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // envoie les cookies
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message ?? "Échec de connexion");
    }

    const data = await response.json();
    state.value = {
      user: data.user,
      accessToken: data.accessToken,
    };
  }

  async function logout(): Promise<void> {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    state.value = { user: null, accessToken: null };
  }

  async function refreshToken(): Promise<boolean> {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include", // Le refreshToken est dans le cookie
      });

      if (!response.ok) return false;

      const data = await response.json();
      state.value.accessToken = data.accessToken;
      return true;
    } catch {
      return false;
    }
  }

  function getAuthHeader(): Record<string, string> {
    if (!state.value.accessToken) return {};
    return { Authorization: `Bearer ${state.value.accessToken}` };
  }

  return {
    user: readonly(user),
    role: readonly(role),
    isAuthenticated: readonly(isAuthenticated),
    login,
    logout,
    refreshToken,
    getAuthHeader,
  };
}
```

## Intercepteur fetch avec refresh automatique

```ts
// utils/authFetch.ts
import { useAuth } from "@/composables/useAuth";

export async function authFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const { getAuthHeader, refreshToken, logout } = useAuth();

  // Ajouter le token
  const headers = {
    ...options.headers,
    ...getAuthHeader(),
  };

  let response = await fetch(url, { ...options, headers });

  // Si 401 → tenter un refresh
  if (response.status === 401) {
    const refreshed = await refreshToken();

    if (refreshed) {
      // Retry avec le nouveau token
      const newHeaders = {
        ...options.headers,
        ...getAuthHeader(),
      };
      response = await fetch(url, { ...options, headers: newHeaders });
    } else {
      await logout();
      throw new Error("Session expirée");
    }
  }

  return response;
}
```

## Guards de navigation

```ts
// router/guards.ts
import type { RouteLocationNormalized, NavigationGuardNext } from "vue-router";
import { useAuth } from "@/composables/useAuth";

export function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
): void {
  const { isAuthenticated } = useAuth();

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next({ name: "login", query: { redirect: to.fullPath } });
  } else {
    next();
  }
}

export function roleGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
): void {
  const { role } = useAuth();
  const requiredRole = to.meta.requiredRole as string | undefined;

  if (requiredRole && role.value !== requiredRole) {
    next({ name: "forbidden" });
  } else {
    next();
  }
}
```

```ts
// router/index.ts
const routes = [
  { path: "/login", name: "login", component: LoginPage },
  {
    path: "/dashboard",
    component: Dashboard,
    meta: { requiresAuth: true },
  },
  {
    path: "/admin",
    component: AdminPanel,
    meta: { requiresAuth: true, requiredRole: "admin" },
  },
];

router.beforeEach(authGuard);
router.beforeEach(roleGuard);
```

## Typage des routes meta

```ts
// router/types.ts
import "vue-router";

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    requiredRole?: "admin" | "editor" | "viewer";
    title?: string;
  }
}
```

## Suite

→ `cours/11-auth-securite/02-securite-front.md`
