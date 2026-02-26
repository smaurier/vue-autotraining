# 03 — RBAC et permissions

## Qu'est-ce que RBAC ?

**Role-Based Access Control** : contrôler ce qu'un utilisateur peut voir et faire en fonction de son rôle.

```
Admin    → tout
Editor   → lire + écrire
Viewer   → lire uniquement
```

## Définir les permissions

```ts
// types/permissions.ts
export type Role = "admin" | "editor" | "viewer";

export type Permission =
  | "users:read"
  | "users:write"
  | "users:delete"
  | "products:read"
  | "products:write"
  | "products:delete"
  | "settings:read"
  | "settings:write";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "users:read",
    "users:write",
    "users:delete",
    "products:read",
    "products:write",
    "products:delete",
    "settings:read",
    "settings:write",
  ],
  editor: ["users:read", "products:read", "products:write", "settings:read"],
  viewer: ["users:read", "products:read", "settings:read"],
};
```

## Composable `usePermissions`

```ts
// composables/usePermissions.ts
import { computed } from "vue";
import { useAuth } from "./useAuth";
import { ROLE_PERMISSIONS, type Permission } from "@/types/permissions";

export function usePermissions() {
  const { role } = useAuth();

  const permissions = computed<Permission[]>(() => {
    if (!role.value) return [];
    return ROLE_PERMISSIONS[role.value];
  });

  function hasPermission(permission: Permission): boolean {
    return permissions.value.includes(permission);
  }

  function hasAnyPermission(...perms: Permission[]): boolean {
    return perms.some((p) => permissions.value.includes(p));
  }

  function hasAllPermissions(...perms: Permission[]): boolean {
    return perms.every((p) => permissions.value.includes(p));
  }

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
```

## Composant conditionnel `<CanAccess>`

```vue
<!-- components/CanAccess.vue -->
<script setup lang="ts">
import { usePermissions } from "@/composables/usePermissions";
import type { Permission } from "@/types/permissions";

const props = defineProps<{
  permission?: Permission;
  anyOf?: Permission[];
  allOf?: Permission[];
}>();

const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

const allowed = computed(() => {
  if (props.permission) return hasPermission(props.permission);
  if (props.anyOf) return hasAnyPermission(...props.anyOf);
  if (props.allOf) return hasAllPermissions(...props.allOf);
  return false;
});
</script>

<template>
  <slot v-if="allowed" />
  <slot v-else name="fallback" />
</template>
```

```vue
<!-- Utilisation -->
<template>
  <CanAccess permission="users:delete">
    <button @click="deleteUser(user.id)">Supprimer</button>
    <template #fallback>
      <span class="text-muted">Accès refusé</span>
    </template>
  </CanAccess>

  <CanAccess :any-of="['products:write', 'products:delete']">
    <ProductActions :product="product" />
  </CanAccess>
</template>
```

## Directive `v-can`

```ts
// directives/vCan.ts
import type { Directive } from "vue";
import { usePermissions } from "@/composables/usePermissions";
import type { Permission } from "@/types/permissions";

export const vCan: Directive<HTMLElement, Permission> = {
  mounted(el, binding) {
    const { hasPermission } = usePermissions();

    if (!hasPermission(binding.value)) {
      el.style.display = "none";
    }
  },
  updated(el, binding) {
    const { hasPermission } = usePermissions();
    el.style.display = hasPermission(binding.value) ? "" : "none";
  },
};
```

```vue
<template>
  <!-- Affiche uniquement si l'utilisateur a la permission -->
  <button v-can="'users:delete'" @click="deleteUser">Supprimer</button>
</template>
```

## Guard de route avec permissions

```ts
// router/guards.ts
import type { RouteLocationNormalized } from "vue-router";
import { usePermissions } from "@/composables/usePermissions";

export function permissionGuard(
  to: RouteLocationNormalized,
): boolean | { name: string } {
  const requiredPermission = to.meta.permission as Permission | undefined;
  if (!requiredPermission) return true;

  const { hasPermission } = usePermissions();
  return hasPermission(requiredPermission) || { name: "forbidden" };
}
```

```ts
// Routes avec permissions
const routes = [
  {
    path: "/admin/users",
    component: UserManagement,
    meta: {
      requiresAuth: true,
      permission: "users:write" as const,
    },
  },
];
```

## Pattern avancé : permissions dynamiques

En ESN, les permissions viennent souvent de l'API (pas hardcodées) :

```ts
// composables/useAuth.ts
interface AuthResponse {
  user: User;
  accessToken: string;
  permissions: string[]; // Permissions dynamiques depuis le backend
}

async function login(credentials: LoginCredentials): Promise<void> {
  const data: AuthResponse = await authFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  }).then((r) => r.json());

  state.value = {
    user: data.user,
    accessToken: data.accessToken,
    permissions: data.permissions,
  };
}
```

## En contexte ESN

| Situation                 | Approche                      |
| ------------------------- | ----------------------------- |
| App interne simple        | Rôles statiques (admin/user)  |
| Gros projet multi-équipes | Permissions granulaires + API |
| SSO Azure AD / Keycloak   | Claims JWT + permissions      |
| Multi-tenant (SaaS)       | Permissions par tenant + rôle |

## Suite

→ `cours/12-vue-query/01-tanstack-query.md`
