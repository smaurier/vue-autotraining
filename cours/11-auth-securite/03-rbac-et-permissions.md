# 03 — RBAC et permissions

---

> **🔄 Rappel du cours précédent**
> Avant de continuer, vérifie que tu peux répondre à ces questions :
> 1. Qu'est-ce qu'une attaque XSS et comment s'en protéger en Vue ?
> 2. Qu'est-ce qu'une attaque CSRF ?
> 
> <details>
> <summary>Vérifier mes réponses</summary>
>
> 1. Injection de code JavaScript malveillant — Vue échappe automatiquement, mais attention à `v-html` !
> 2. Cross-Site Request Forgery — un site malveillant envoie des requêtes en se faisant passer pour l'utilisateur
> </details>

---

## 🏢 C'est quoi le RBAC ?

**RBAC** = **Role-Based Access Control** = Contrôle d'accès basé sur les rôles

> **Analogie de l'entreprise** :
> Dans une entreprise, tout le monde n'a pas les mêmes droits :
>
> - Le **stagiaire** peut entrer dans le bâtiment et accéder à la salle de pause
> - Le **manager** peut aussi ouvrir les bureaux de son équipe
> - Le **PDG (CEO)** peut ouvrir toutes les portes, y compris le coffre-fort
>
> Chaque personne à un **badge** avec un **niveau d'accès** différent.
> C'est exactement ça le RBAC : **attribuer un rôle à chaque utilisateur**,
> et chaque rôle donne accès à certaines fonctionnalités.

### La différence entre rôle et permission

| Concept | C'est quoi ? | Exemple |
| --- | --- | --- |
| **Rôle** | Une "étiquette" donnée à un utilisateur | `admin`, `editor`, `viewer` |
| **Permission** | Un droit précis d'effectuer une action | `users:delete`, `products:write` |

Un **rôle** regroupe plusieurs **permissions** :

```
Rôle "viewer"  → peut lire les utilisateurs, les produits et les paramètres
Rôle "editor"  → peut lire ET modifier les produits
Rôle "admin"   → peut TOUT faire (lire, modifier, supprimer)
```

> 💡 **Pourquoi ne pas donner les permissions directement ?**
> Imagine une app avec 50 utilisateurs et 20 permissions.
> C'est plus simple de créer 3 rôles que de configurer 50 × 20 = 1000 combinaisons !

---

## 📋 Définir les permissions

La première étape est de lister **toutes les actions possibles** dans ton app,
et de dire **quel rôle** peut faire quoi.

```ts
// types/permissions.ts
// Ce fichier définit les types pour les rôles et les permissions

// Les 3 rôles possibles dans notre application
export type Role = 'admin' | 'editor' | 'viewer'
// "type" crée un alias de type en TypeScript
// Ici, Role ne peut être QUE 'admin', 'editor' ou 'viewer' (union type)

// Toutes les permissions possibles
// Le format est "ressource:action" (convention courante)
export type Permission =
  | 'users:read'       // Lire la liste des utilisateurs
  | 'users:write'      // Créer / modifier un utilisateur
  | 'users:delete'     // Supprimer un utilisateur
  | 'products:read'    // Lire les produits
  | 'products:write'   // Créer / modifier un produit
  | 'products:delete'  // Supprimer un produit
  | 'settings:read'    // Lire les paramètres
  | 'settings:write'   // Modifier les paramètres

// Quelle permission a chaque rôle ?
// Record<Role, Permission[]> = un objet avec une clé par rôle,
// et pour chaque rôle un tableau de permissions
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {

  // L'admin peut TOUT faire
  admin: [
    'users:read', 'users:write', 'users:delete',
    'products:read', 'products:write', 'products:delete',
    'settings:read', 'settings:write',
  ],

  // L'éditeur peut lire les users, lire + écrire les produits, et lire les paramètres
  editor: [
    'users:read',
    'products:read', 'products:write',
    'settings:read',
  ],

  // Le viewer peut uniquement LIRE (pas modifier, pas supprimer)
  viewer: [
    'users:read',
    'products:read',
    'settings:read',
  ],
}
```

### Visualisation des permissions

```
Permission          │ admin │ editor │ viewer
────────────────────┼───────┼────────┼────────
users:read          │  ✅   │   ✅   │   ✅
users:write         │  ✅   │   ❌   │   ❌
users:delete        │  ✅   │   ❌   │   ❌
products:read       │  ✅   │   ✅   │   ✅
products:write      │  ✅   │   ✅   │   ❌
products:delete     │  ✅   │   ❌   │   ❌
settings:read       │  ✅   │   ✅   │   ✅
settings:write      │  ✅   │   ❌   │   ❌
```

---

## 🧩 Composable `usePermissions`

Ce composable permet de **vérifier facilement** si l'utilisateur connecté a le droit
de faire quelque chose. Tu l'utiliseras partout dans ton app.

```ts
// composables/usePermissions.ts

import { computed } from 'vue'
import { useAuth } from './useAuth'               // Notre composable d'authentification
import { ROLE_PERMISSIONS, type Permission } from '@/types/permissions'
// On importe la table des permissions et le type Permission

export function usePermissions() {

  // On récupère le rôle de l'utilisateur connecté
  const { role } = useAuth()

  // On calcule les permissions de l'utilisateur à partir de son rôle
  const permissions = computed<Permission[]>(() => {
    if (!role.value) return []               // Pas connecté → aucune permission
    return ROLE_PERMISSIONS[role.value]       // On cherche dans la table
    // Ex: si role = 'editor', on obtient ['users:read', 'products:read', 'products:write', 'settings:read']
  })

  // Vérifie si l'utilisateur a UNE permission précise
  function hasPermission(permission: Permission): boolean {
    return permissions.value.includes(permission)
    // .includes() vérifie si le tableau contient cette valeur
    // Ex: ['users:read', 'products:read'].includes('users:delete') → false
  }

  // Vérifie si l'utilisateur a AU MOINS UNE des permissions listées
  function hasAnyPermission(...perms: Permission[]): boolean {
    // "...perms" = rest parameter → on peut passer autant d'arguments qu'on veut
    // Ex: hasAnyPermission('users:write', 'users:delete')
    return perms.some(p => permissions.value.includes(p))
    // .some() retourne true si AU MOINS UN élément passe le test
  }

  // Vérifie si l'utilisateur a TOUTES les permissions listées
  function hasAllPermissions(...perms: Permission[]): boolean {
    return perms.every(p => permissions.value.includes(p))
    // .every() retourne true si TOUS les éléments passent le test
  }

  return {
    permissions,        // La liste complète des permissions
    hasPermission,      // Vérifier 1 permission
    hasAnyPermission,   // Vérifier au moins 1 parmi plusieurs
    hasAllPermissions,  // Vérifier toutes
  }
}
```

---

## 🎭 Composant conditionnel `<CanAccess>`

Au lieu de mettre des `v-if` partout, on crée un **composant réutilisable** qui affiche
ou cache son contenu selon les permissions de l'utilisateur.

> **Analogie** : C'est comme un **cadenas intelligent** que tu mets sur une porte.
> Si l'utilisateur a le bon badge → la porte s'ouvre et il voit le contenu.
> Sinon → il voit un message "Accès refusé" (où rien du tout).

```vue
<!-- components/CanAccess.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { usePermissions } from '@/composables/usePermissions'
import type { Permission } from '@/types/permissions'

// Les props (paramètres) du composant
// On peut lui passer UNE permission, OU un tableau avec anyOf/allOf
const props = defineProps<{
  permission?: Permission     // Vérifier UNE permission (optionnel)
  anyOf?: Permission[]        // Vérifier si l'utilisateur a AU MOINS UNE de ces permissions
  allOf?: Permission[]        // Vérifier si l'utilisateur a TOUTES ces permissions
}>()

const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

// On calcule si l'utilisateur est autorisé
const allowed = computed(() => {
  // Si on a passé une seule permission → on vérifie celle-là
  if (props.permission) return hasPermission(props.permission)
  // Si on a passé "anyOf" → au moins une suffit
  if (props.anyOf) return hasAnyPermission(...props.anyOf)
  // Si on a passé "allOf" → il faut toutes les avoir
  if (props.allOf) return hasAllPermissions(...props.allOf)
  // Si rien n'est passé → par sécurité, on refuse
  return false
})
</script>

<template>
  <!-- Si autorisé → on affiche le contenu (le slot par défaut) -->
  <slot v-if="allowed" />
  <!-- Sinon → on affiche le contenu du slot "fallback" (s'il existe) -->
  <slot v-else name="fallback" />
</template>
```

> 💡 **Rappel — C'est quoi un slot ?**
> Un slot c'est un "trou" dans un composant, ou le parent peut injecter du contenu.
> C'est comme un cadre photo : le composant fournit le cadre, le parent fournit la photo.

### Comment l'utiliser

```vue
<template>
  <!-- Exemple 1 : Le bouton "Supprimer" n'apparaît QUE si on a la permission users:delete -->
  <CanAccess permission="users:delete">
    <!-- Ce contenu est affiché SI l'utilisateur a la permission -->
    <button @click="deleteUser(user.id)">🗑️ Supprimer</button>

    <!-- Ce contenu est affiché SI l'utilisateur N'A PAS la permission -->
    <template #fallback>
      <span class="text-gray-400">🔒 Suppression non autorisée</span>
    </template>
  </CanAccess>

  <!-- Exemple 2 : Afficher les actions produit si on peut écrire OU supprimer -->
  <CanAccess :any-of="['products:write', 'products:delete']">
    <ProductActions :product="product" />
  </CanAccess>

  <!--
    Résultat selon le rôle :
    - admin  → voit le bouton Supprimer ET les actions produit
    - editor → voit "Suppression non autorisée" + les actions produit
    - viewer → voit "Suppression non autorisée" et PAS les actions produit
  -->
</template>
```

---

## 🏷️ Directive `v-can`

> **Rappel — C'est quoi une directive ?**
> Une directive est un attribut spécial qu'on met sur un élément HTML.
> Vue fournit des directives comme `v-if`, `v-for`, `v-model`...
> On peut aussi créer les nôtres ! Ici on crée `v-can`.

`v-can` est une version plus concise que `<CanAccess>` : elle cache un élément si l'utilisateur n'a pas la permission.

```ts
// directives/vCan.ts

import type { Directive } from 'vue'
import { usePermissions } from '@/composables/usePermissions'
import type { Permission } from '@/types/permissions'

// On crée une directive personnalisée
// Directive<HTMLElement, Permission> signifie :
// - Elle s'applique sur un HTMLElement
// - La valeur qu'on lui passe est de type Permission

export const vCan: Directive<HTMLElement, Permission> = {

  // "mounted" s'exécute quand l'élément est ajouté au DOM (à la page)
  mounted(el, binding) {
    // el      = l'élément HTML sur lequel on a mis v-can
    // binding = contient la valeur passée (ex: 'users:delete')

    const { hasPermission } = usePermissions()

    // Si l'utilisateur N'A PAS la permission → on cache l'élément
    if (!hasPermission(binding.value)) {
      el.style.display = 'none'  // display: none rend l'élément invisible
    }
  },

  // "updated" s'exécute quand les données changent (ex: l'utilisateur change de rôle)
  updated(el, binding) {
    const { hasPermission } = usePermissions()
    // On montre ou cache selon la permission
    el.style.display = hasPermission(binding.value) ? '' : 'none'
    // '' = valeur par défaut → l'élément est visible
  },
}
```

### Comment l'utiliser

```vue
<template>
  <!-- Le bouton est visible uniquement si l'utilisateur a la permission 'users:delete' -->
  <button v-can="'users:delete'" @click="deleteUser">
    🗑️ Supprimer l'utilisateur
  </button>
  <!--
    Attention aux guillemets :
    - Les guillemets extérieurs "" sont pour Vue (syntaxe de template)
    - Les guillemets intérieurs '' sont pour JavaScript (c'est une string)
    Donc v-can="'users:delete'" passe la STRING 'users:delete' à la directive
  -->
</template>
```

> ⚠️ **Attention** : `v-can` cache l'élément visuellement, mais un utilisateur avancé
> pourrait utiliser les outils de développement (F12) pour le rendre visible.
> La vraie sécurité est **côté serveur** ! Le front masque pour le confort, le serveur
> vérifie pour la sécurité.

---

## 🚧 Guard de route avec permissions

En plus de vérifier les rôles (vu dans le chapitre précédent), on peut aussi vérifier
les **permissions** avant d'accéder à une page.

```ts
// router/guards.ts

import type { RouteLocationNormalized } from 'vue-router'
import { usePermissions } from '@/composables/usePermissions'
import type { Permission } from '@/types/permissions'

export function permissionGuard(
  to: RouteLocationNormalized,  // La page ou l'utilisateur veut aller
): boolean | { name: string } {
  // Cette fonction retourne :
  // - true              → OK, l'utilisateur peut accéder à la page
  // - { name: 'forbidden' } → INTERDIT, on le redirige vers la page "Accès refusé"

  // On récupère la permission requise depuis les "meta" de la route
  const requiredPermission = to.meta.permission as Permission | undefined
  // "as Permission | undefined" = on dit à TypeScript le type attendu

  // Si la route ne demande pas de permission particulière → OK
  if (!requiredPermission) return true

  // On vérifie si l'utilisateur a la permission
  const { hasPermission } = usePermissions()
  return hasPermission(requiredPermission) || { name: 'forbidden' }
  // Si hasPermission retourne true → true (accès OK)
  // Si hasPermission retourne false → { name: 'forbidden' } (redirection)
}
```

### Configurer les routes avec les permissions

```ts
// router/index.ts

const routes = [
  {
    path: '/admin/users',
    component: UserManagement,
    meta: {
      requiresAuth: true,                    // Il faut être connecté
      permission: 'users:write' as const,    // ET il faut avoir la permission users:write
      // "as const" dit à TypeScript que c'est une valeur exacte, pas juste un string
    },
  },
  {
    path: '/products',
    component: ProductList,
    meta: {
      requiresAuth: true,
      permission: 'products:read' as const,  // Juste besoin de lire les produits
    },
  },
]

// On active le guard pour toutes les routes
router.beforeEach(permissionGuard)
```

---

## 🔄 Pattern avancé : permissions dynamiques

Dans certains projets, les permissions ne sont **pas codées en dur** dans le front.
Elles viennent du **serveur** (l'API les envoie en même temps que les infos de connexion).

> **Pourquoi ?** Parce que l'admin peut modifier les rôles et permissions sans avoir à
> modifier et redéployer le code front-end.

```ts
// composables/useAuth.ts (version avec permissions dynamiques)

// La réponse de l'API de connexion contient les permissions
interface AuthResponse {
  user: User
  accessToken: string
  permissions: string[]  // Les permissions viennent du serveur !
  // Ex: ['users:read', 'products:read', 'products:write']
}

async function login(credentials: LoginCredentials): Promise<void> {
  // On appelle l'API de connexion
  const data: AuthResponse = await authFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }).then(r => r.json())
  // .then(r => r.json()) transforme la réponse HTTP en objet JavaScript

  // On stocke TOUT dans l'état : user, token ET permissions
  state.value = {
    user: data.user,
    accessToken: data.accessToken,
    permissions: data.permissions,  // Les permissions du serveur !
  }
  // Plus besoin de la table ROLE_PERMISSIONS côté front
  // Le serveur décide de tout
}
```

---

## 📝 Résumé

| Concept | En une phrase |
| --- | --- |
| **Rôle** | Une étiquette (admin, editor, viewer) attribuée à un utilisateur |
| **Permission** | Un droit précis (users:delete, products:write) |
| **RBAC** | Chaque rôle à un ensemble de permissions prédéfinies |
| **usePermissions** | Composable pour vérifier les permissions de l'utilisateur connecté |
| **`<CanAccess>`** | Composant qui affiche ou cache du contenu selon les permissions |
| **`v-can`** | Directive pour cacher un élément selon une permission |
| **permissionGuard** | Guard de route qui bloque l'accès aux pages non autorisées |
| **Permissions dynamiques** | Les permissions viennent du serveur (plus flexible) |

---

## 🎯 Pratique

### Exercice RBAC.1 — Mapping rôles/permissions

Complète ce mapping des permissions par rôle :

```ts
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ???,
  editor: ???,
  viewer: ???
}

type Permission = 'users:read' | 'users:write' | 'users:delete' 
                | 'products:read' | 'products:write'
```

<details>
<summary>Solution</summary>

```ts
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ['users:read', 'users:write', 'users:delete', 'products:read', 'products:write'],
  editor: ['users:read', 'products:read', 'products:write'],
  viewer: ['users:read', 'products:read']
}
```
</details>

---

### Exercice RBAC.2 — Composable usePermissions

Crée un composable pour vérifier les permissions :

```ts
export function usePermissions() {
  const { user } = useAuth()
  
  function hasPermission(permission: Permission): boolean {
    // ???
  }
  
  function hasAnyPermission(permissions: Permission[]): boolean {
    // ???
  }
  
  return { hasPermission, hasAnyPermission }
}
```

<details>
<summary>Solution</summary>

```ts
export function usePermissions() {
  const { user } = useAuth()
  
  function hasPermission(permission: Permission): boolean {
    if (!user.value) return false
    const userPermissions = ROLE_PERMISSIONS[user.value.role]
    return userPermissions.includes(permission)
  }
  
  function hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(p => hasPermission(p))
  }
  
  return { hasPermission, hasAnyPermission }
}
```
</details>

---

### Exercice RBAC.3 — Composant CanAccess

Crée un composant qui affiche son contenu seulement si l'utilisateur à la permission :

```vue
<!-- CanAccess.vue -->
<template>
  ???
</template>

<script setup lang="ts">
defineProps<{
  permission: Permission
}>()
</script>
```

<details>
<summary>Solution</summary>

```vue
<template>
  <slot v-if="hasPermission(permission)" />
</template>

<script setup lang="ts">
import { usePermissions } from '@/composables/usePermissions'

const props = defineProps<{
  permission: Permission
}>()

const { hasPermission } = usePermissions()
</script>
```

Utilisation :
```vue
<CanAccess permission="users:delete">
  <button>Supprimer l'utilisateur</button>
</CanAccess>
```
</details>

---

## Suite

→ `cours/12-vue-query/01-tanstack-query.md`

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Exercice** : [26-auth-sécurité](../../exercices/26-auth-securite/ENONCE)
:::
