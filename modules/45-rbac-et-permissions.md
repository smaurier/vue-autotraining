---
titre: RBAC et permissions
cours: 02-vue
notions: [modèle RBAC rôles et permissions, ABAC en survol, directive personnalisée v-can, composable usePermissions, composant déclaratif CanAccess avec slot fallback, masquage UI vs sécurité réelle serveur, guards de route par rôle, gestion fine par ressource, cohérence front et back]
outcomes:
  - sait modéliser des rôles et permissions (RBAC) côté front
  - sait conditionner l'UI par permission (directive, composable)
  - sait protéger les routes par rôle et comprendre que le front ne sécurise pas
  - sait garder la cohérence des permissions entre front et back
prerequis: [44-securite-front]
next: 46-vue-query-tanstack
libs: [{ name: vue, version: "3.5" }, { name: pinia, version: "2" }]
tribuzen: front-office TribuZen — RBAC famille (admin peut inviter/exclure, membre non), directive v-can et guards, UI conditionnelle
last-reviewed: 2026-07
---

# RBAC et permissions

> **Outcomes — tu sauras FAIRE :** modéliser des rôles et permissions (RBAC) côté front, conditionner l'UI par permission via directive `v-can` et composable `usePermissions`, protéger les routes par rôle, et expliquer pourquoi le front ne sécurise jamais — c'est le back qui autorise.
> **Difficulté :** :star::star::star:

---

## 1. Cas concret d'abord

Tu intègres TribuZen. Le Product Owner te confie cette tâche :

> « L'admin d'une famille peut inviter des membres et en exclure. Un membre simple n'a pas accès à ces actions. »

Ta première instinct : disperser des `v-if` partout.

```vue
<!-- AdminPanel.vue — AVANT RBAC -->
<template>
  <button v-if="user.role === 'admin'" @click="invite">Inviter</button>
  <button v-if="user.role === 'admin'" @click="kick">Exclure</button>
  <!-- Et dans 12 autres composants, la même condition... -->
</template>
```

Trois problèmes immédiats :
1. Si le rôle `moderator` est ajouté un jour, il faut chercher-remplacer dans toute la codebase.
2. La logique est éparpillée — pas de source de vérité unique.
3. Aucune protection réelle : un utilisateur peut ouvrir F12, virer le `display:none` et cliquer quand même.

Ce module te donne le bon modèle : **RBAC structuré côté front** + **conscience que le back autorise toujours**.

---

## 2. Théorie complète, concise

### 2.1 Modèle RBAC — rôles et permissions

**RBAC (Role-Based Access Control)** organise les droits en deux couches :

| Concept | Définition | Exemple TribuZen |
|---|---|---|
| **Rôle** | Étiquette attribuée à un utilisateur | `family-admin`, `member`, `guest` |
| **Permission** | Droit atomique sur une action précise | `family:invite`, `family:kick`, `post:delete` |

Un rôle regroupe plusieurs permissions. On ne gère plus 50 utilisateurs × 20 permissions = 1000 combinaisons, mais 3 rôles × 20 permissions = 60 règles.

**Types TypeScript — source de vérité unique :**

```ts
// src/types/permissions.ts
export type FamilyRole = 'family-admin' | 'member' | 'guest'

export type Permission =
  | 'family:invite'     // inviter un nouveau membre
  | 'family:kick'       // exclure un membre
  | 'family:edit'       // modifier le nom, avatar de la famille
  | 'post:create'       // créer une publication
  | 'post:delete-own'   // supprimer sa propre publication
  | 'post:delete-any'   // supprimer n'importe quelle publication (modération)
  | 'event:create'      // créer un événement familial
  | 'event:delete'      // supprimer un événement

// Table de correspondance rôle → permissions
export const ROLE_PERMISSIONS: Record<FamilyRole, Permission[]> = {
  'family-admin': [
    'family:invite',
    'family:kick',
    'family:edit',
    'post:create',
    'post:delete-own',
    'post:delete-any',
    'event:create',
    'event:delete',
  ],
  'member': [
    'post:create',
    'post:delete-own',
    'event:create',
  ],
  'guest': [
    // lecture seule — aucune action d'écriture
  ],
}
```

Cette table est la **source de vérité côté front**. Elle doit être cohérente avec celle du backend (section 2.8).

### 2.2 ABAC en survol

**ABAC (Attribute-Based Access Control)** va plus loin que RBAC : le droit dépend non seulement du rôle, mais aussi des **attributs du sujet, de la ressource et du contexte**.

Exemple RBAC seul :
> « L'admin peut exclure un membre. »

Exemple ABAC :
> « L'admin peut exclure un membre **de SA famille uniquement**. »

En pratique dans TribuZen : un utilisateur `family-admin` de la famille Dupont ne peut pas exclure un membre de la famille Martin, même s'il a le rôle `family-admin`. La condition ajoute une dimension ressource (`resource.familyId === user.familyId`).

```ts
// Vérification ABAC — au-delà du simple rôle
function canKickMember(actor: User, targetMember: Member): boolean {
  // Condition 1 — RBAC : l'acteur a la permission
  const { hasPermission } = usePermissions()
  if (!hasPermission('family:kick')) return false

  // Condition 2 — ABAC : la ressource appartient à la même famille
  return actor.familyId === targetMember.familyId
}
```

ABAC est utile pour les **ressources multi-tenant**. Pour un MVP, RBAC simple suffit souvent. La distinction est importante en entretien.

### 2.3 Directive personnalisée `v-can`

Une directive Vue 3 custom est un objet avec des hooks de cycle de vie (`mounted`, `updated`, `unmounted`). Elle s'applique sur un élément HTML.

```ts
// src/directives/vCan.ts
import type { Directive } from 'vue'
import type { Permission } from '@/types/permissions'
import { usePermissions } from '@/composables/usePermissions'

export const vCan: Directive<HTMLElement, Permission> = {
  mounted(el, binding) {
    // binding.value = la permission passée, ex: 'family:invite'
    const { hasPermission } = usePermissions()
    if (!hasPermission(binding.value)) {
      el.style.display = 'none'
      // Alternative plus accessible : el.setAttribute('aria-hidden', 'true')
      // Pour retirer du flux DOM complètement, utiliser v-if via composable
    }
  },
  updated(el, binding) {
    // Recalcule si le binding change (changement de rôle à chaud)
    const { hasPermission } = usePermissions()
    el.style.display = hasPermission(binding.value) ? '' : 'none'
  },
}
```

Enregistrement global dans `main.ts` :

```ts
// src/main.ts
import { createApp } from 'vue'
import { vCan } from '@/directives/vCan'
import App from './App.vue'

const app = createApp(App)
app.directive('can', vCan)   // disponible partout via v-can
app.mount('#app')
```

Utilisation dans les templates :

```vue
<template>
  <!-- Caché si l'utilisateur n'a pas 'family:invite' -->
  <button v-can="'family:invite'" @click="openInviteModal">
    Inviter un membre
  </button>

  <!-- Caché si pas 'family:kick' -->
  <button v-can="'family:kick'" @click="kickMember(member.id)">
    Exclure
  </button>
</template>
```

> **Rappel guillemets :** `v-can="'family:invite'"` — les `""` extérieurs sont la syntaxe Vue de binding, les `''` intérieurs sont la valeur JavaScript string. Sans les guillemets intérieurs, Vue chercherait une variable `family:invite` dans le composant.

### 2.4 Composable `usePermissions`

Le composable centralise toute la logique de vérification. Il lit le rôle depuis un store Pinia (`useAuthStore`) pour que les permissions soient réactives.

```ts
// src/composables/usePermissions.ts
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ROLE_PERMISSIONS } from '@/types/permissions'
import type { Permission } from '@/types/permissions'

export function usePermissions() {
  const auth = useAuthStore()

  // computed — réactif : se recalcule si auth.user change
  const permissions = computed<Permission[]>(() => {
    if (!auth.user?.familyRole) return []
    return ROLE_PERMISSIONS[auth.user.familyRole] ?? []
  })

  // Vérifie une permission unique
  function hasPermission(permission: Permission): boolean {
    return permissions.value.includes(permission)
  }

  // Vérifie si au moins une des permissions est présente (OR)
  function hasAnyPermission(...perms: Permission[]): boolean {
    return perms.some(p => permissions.value.includes(p))
  }

  // Vérifie si toutes les permissions sont présentes (AND)
  function hasAllPermissions(...perms: Permission[]): boolean {
    return perms.every(p => permissions.value.includes(p))
  }

  return { permissions, hasPermission, hasAnyPermission, hasAllPermissions }
}
```

Usage dans un composant :

```vue
<script setup lang="ts">
import { usePermissions } from '@/composables/usePermissions'

const { hasPermission, hasAnyPermission } = usePermissions()
</script>

<template>
  <!-- v-if via composable — supprime le nœud DOM (plus propre que display:none) -->
  <button v-if="hasPermission('family:invite')" @click="invite">
    Inviter
  </button>

  <!-- Afficher la section si peut écrire OU modérer -->
  <section v-if="hasAnyPermission('post:create', 'post:delete-any')">
    <PostEditor />
  </section>
</template>
```

**`v-if` vs `v-can` :** les deux ont leur place. `v-if` via `hasPermission()` **supprime le nœud DOM** — plus propre pour l'accessibilité et les performances. `v-can` (directive) est pratique pour **des ajouts ponctuels sur des éléments existants** sans refactorer le template.

### 2.5 Masquage UI vs sécurité réelle serveur

C'est le point le plus important du module. À retenir absolument :

> **Le front masque pour le confort. Le back autorise pour la sécurité.**

Un utilisateur avec les outils développeur (F12) peut :
- Inspecter l'élément caché par `display:none` et le rendre visible
- Appeler directement `fetch('/api/family/42/invite', { method: 'POST', ... })`
- Modifier le store Pinia via la console pour simuler un rôle `family-admin`

Si l'API `/family/:id/invite` ne vérifie pas le rôle côté serveur, l'invitation passera quand même.

**Architecture correcte :**

```
┌─────────────────────────────────────────┐
│  FRONT (Vue 3)                          │
│  • v-if / v-can → confort utilisateur  │
│  • Guards de route → redirection UX    │
│  ⚠️  Tout ça peut être contourné        │
└────────────────┬────────────────────────┘
                 │ requête HTTP
┌────────────────▼────────────────────────┐
│  BACK (NestJS / Express / ...)          │
│  • Middleware auth → token valide ?    │
│  • Guard permission → rôle autorisé ?  │
│  • Logique ABAC → ressource accessible?│
│  ✅ Source de vérité de la sécurité     │
└─────────────────────────────────────────┘
```

Le front est une **interface**, pas un rempart de sécurité.

### 2.6 Guards de route par rôle

Vue Router permet d'associer des métadonnées à une route et d'exécuter un guard `beforeEach` avant chaque navigation.

```ts
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/composables/usePermissions'

// Extend le type RouteMeta pour le typage
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiredPermission?: import('@/types/permissions').Permission
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/family/:id/admin',
      component: () => import('@/views/FamilyAdmin.vue'),
      meta: {
        requiresAuth: true,
        requiredPermission: 'family:invite',
      },
    },
    {
      path: '/forbidden',
      component: () => import('@/views/Forbidden.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  // 1. Authentification
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // 2. Permission sur la route
  const required = to.meta.requiredPermission
  if (required) {
    const { hasPermission } = usePermissions()
    if (!hasPermission(required)) {
      return { path: '/forbidden' }
    }
  }

  // 3. Accès autorisé
  return true
})

export default router
```

Le guard retourne `true` (continuer), une route (rediriger), ou `false` (annuler). Les guards ne **sécurisent pas l'API** — ils améliorent l'UX en évitant d'afficher une page vide après un appel API échoué.

### 2.7 Gestion fine par ressource (ABAC pratique)

Pour les cas où le rôle ne suffit pas, on ajoute une couche de vérification sur la ressource elle-même.

```ts
// src/composables/useFamilyPermissions.ts
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/composables/usePermissions'
import type { Member } from '@/types/family'

export function useFamilyPermissions() {
  const auth = useAuthStore()
  const { hasPermission } = usePermissions()

  // Peut-on exclure CE membre spécifique ?
  function canKick(member: Member): boolean {
    // Condition RBAC
    if (!hasPermission('family:kick')) return false
    // Condition ABAC — même famille
    if (auth.user?.familyId !== member.familyId) return false
    // On ne peut pas s'auto-exclure
    if (auth.user?.id === member.id) return false
    return true
  }

  // Peut-on supprimer CE post ?
  function canDeletePost(postAuthorId: string): boolean {
    // Modérateur peut tout supprimer
    if (hasPermission('post:delete-any')) return true
    // Auteur peut supprimer le sien
    return hasPermission('post:delete-own') && auth.user?.id === postAuthorId
  }

  return { canKick, canDeletePost }
}
```

### 2.8 Cohérence front et back

Le front définit `ROLE_PERMISSIONS` côté TypeScript, le back l'implémente côté NestJS/Express. La **dérive** entre les deux est une source de bugs UX (l'UI montre une action que l'API refuse silencieusement).

Stratégies de cohérence :

**Option A — contrat partagé via monorepo :**
```
packages/
  permissions/
    src/
      permissions.ts   ← importé par front ET back
```

**Option B — permissions servies par l'API :**
```ts
// L'API retourne les permissions de l'utilisateur à la connexion
interface LoginResponse {
  user: User
  accessToken: string
  permissions: Permission[]   // le back décide, le front consomme
}
```

Avec l'option B, `usePermissions` lit directement depuis le store sans table côté front :

```ts
// composables/usePermissions.ts — version API-driven
export function usePermissions() {
  const auth = useAuthStore()

  // permissions viennent du back — pas de table locale
  const permissions = computed<Permission[]>(() => auth.user?.permissions ?? [])

  function hasPermission(permission: Permission): boolean {
    return permissions.value.includes(permission)
  }

  return { permissions, hasPermission }
}
```

L'option B est plus robuste sur le long terme : le back est toujours la source de vérité, et les changements de permissions ne nécessitent pas de redeployer le front.

### 2.9 Composant déclaratif `<CanAccess>` avec slot `#fallback`

`v-if + hasPermission()` est lisible mais éparpille la logique de permission dans chaque template. Le composant `<CanAccess>` encapsule ce pattern et offre un slot `#fallback` pour afficher un état dégradé (message, bouton désactivé…) sans double condition dans le template.

```vue
<!-- src/components/ui/CanAccess.vue -->
<script setup lang="ts">
import { usePermissions } from '@/composables/usePermissions'
import type { Permission } from '@/types/permissions'

const props = defineProps<{ permission: Permission }>()
const { hasPermission } = usePermissions()
</script>

<template>
  <!-- Slot default : affiché si la permission est présente -->
  <slot v-if="hasPermission(props.permission)" />
  <!-- Slot fallback : affiché sinon (rien si le slot n'est pas fourni) -->
  <slot v-else name="fallback" />
</template>
```

**Usage dans les templates :**

```vue
<template>
  <!-- Cas simple : rien n'est rendu si pas la permission -->
  <CanAccess permission="family:invite">
    <button @click="openInviteModal">Inviter un membre</button>
  </CanAccess>

  <!-- Cas avec fallback explicite : le membre voit un message explicatif -->
  <CanAccess permission="family:kick">
    <button @click="kickMember(member.id)">Exclure</button>

    <template #fallback>
      <span class="text-muted text-sm">Réservé aux admins de la famille</span>
    </template>
  </CanAccess>

  <!-- Cas multi-permissions : combiner avec un composable -->
  <CanAccess permission="post:delete-any">
    <button @click="deletePost(post.id)">Supprimer (modération)</button>
  </CanAccess>
</template>
```

**`<CanAccess>` vs `v-if` via composable :**

| | `v-if + hasPermission()` | `<CanAccess>` |
|---|---|---|
| Lisibilité template | Bonne | Excellente — l'intention est nommée |
| Fallback explicite | `v-else` à écrire manuellement | Slot `#fallback` intégré |
| Réutilisabilité | Aucune — dupliqué par composant | Un seul composant, importé partout |
| Testabilité | Tester le composant parent | Tester `CanAccess` isolément |

> `<CanAccess>` est une **alternative déclarative** à `v-if + hasPermission()` — les deux suppriment le nœud DOM (contrairement à `v-can` qui utilise `display:none`). Préférer `<CanAccess>` quand un fallback visible est nécessaire, `v-if` direct quand c'est un simple masquage sans message.

---

## 3. Worked examples

### Exemple 1 — `usePermissions` complet avec Pinia (TribuZen)

Voici le flux complet depuis le store jusqu'au composant.

```ts
// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FamilyRole, Permission } from '@/types/permissions'
import { ROLE_PERMISSIONS } from '@/types/permissions'

interface AuthUser {
  id: string
  name: string
  familyId: string
  familyRole: FamilyRole
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const accessToken = ref<string | null>(null)

  const isAuthenticated = computed(() => user.value !== null && accessToken.value !== null)

  // Permissions dérivées du rôle — réactif
  const permissions = computed<Permission[]>(() => {
    if (!user.value) return []
    return ROLE_PERMISSIONS[user.value.familyRole] ?? []
  })

  async function login(email: string, password: string): Promise<void> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) throw new Error('Identifiants invalides')
    const data = await res.json()
    user.value = data.user
    accessToken.value = data.accessToken
  }

  function logout(): void {
    user.value = null
    accessToken.value = null
  }

  return { user, isAuthenticated, permissions, login, logout }
})
```

```ts
// src/composables/usePermissions.ts
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { Permission } from '@/types/permissions'

export function usePermissions() {
  const auth = useAuthStore()

  const permissions = computed<Permission[]>(() => auth.permissions)

  function hasPermission(permission: Permission): boolean {
    return permissions.value.includes(permission)
  }

  function hasAnyPermission(...perms: Permission[]): boolean {
    return perms.some(p => permissions.value.includes(p))
  }

  function hasAllPermissions(...perms: Permission[]): boolean {
    return perms.every(p => permissions.value.includes(p))
  }

  return { permissions, hasPermission, hasAnyPermission, hasAllPermissions }
}
```

```vue
<!-- src/components/family/FamilyAdminPanel.vue -->
<script setup lang="ts">
import { usePermissions } from '@/composables/usePermissions'
import { useFamilyStore } from '@/stores/family'

const { hasPermission } = usePermissions()
const familyStore = useFamilyStore()
</script>

<template>
  <div class="admin-panel">
    <h2>Gestion de la famille</h2>

    <!-- Invite — visible uniquement si l'utilisateur a la permission -->
    <button
      v-if="hasPermission('family:invite')"
      @click="familyStore.openInviteModal()"
    >
      Inviter un membre
    </button>

    <!-- Section modération — visible si peut modérer OU administrer -->
    <section v-if="hasAnyPermission('post:delete-any', 'family:kick')">
      <h3>Actions de modération</h3>
      <!-- ... liste des membres avec bouton Exclure conditionnel -->
    </section>
  </div>
</template>
```

**Ce que Vue fait ici :**
- `v-if="hasPermission('family:invite')"` — appel du composable, retourne un `boolean`. Vue supprime ou insère le nœud DOM selon la valeur.
- Si `auth.user` change dans Pinia (ex: logout puis login avec un autre compte), `permissions` est un `computed` réactif → le template se met à jour automatiquement.

### Exemple 2 — Directive `v-can` complète et enregistrement

```ts
// src/directives/vCan.ts
import type { Directive } from 'vue'
import type { Permission } from '@/types/permissions'
import { usePermissions } from '@/composables/usePermissions'

// Directive typée : s'applique sur HTMLElement, reçoit une Permission en valeur
export const vCan: Directive<HTMLElement, Permission> = {
  mounted(el, binding) {
    applyPermission(el, binding.value)
  },

  updated(el, binding) {
    // Utile si la permission passée change dynamiquement
    if (binding.value !== binding.oldValue) {
      applyPermission(el, binding.value)
    }
  },
}

function applyPermission(el: HTMLElement, permission: Permission): void {
  const { hasPermission } = usePermissions()
  const allowed = hasPermission(permission)

  if (!allowed) {
    // display:none masque visuellement mais reste dans le DOM
    // Pour retirer complètement, préférer v-if dans le template
    el.style.display = 'none'
    // Accessibilité : signaler que l'élément est caché
    el.setAttribute('aria-hidden', 'true')
  } else {
    el.style.display = ''
    el.removeAttribute('aria-hidden')
  }
}
```

```ts
// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { vCan } from '@/directives/vCan'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.directive('can', vCan)   // enregistrement global — v-can disponible partout

app.mount('#app')
```

Résultat dans un template existant sans refactorer la structure :

```vue
<template>
  <!-- Ajout de v-can sur un bouton sans toucher au reste du composant -->
  <div class="member-row" v-for="member in members" :key="member.id">
    <span>{{ member.name }}</span>

    <div class="actions">
      <!-- v-can s'utilise comme n'importe quelle directive Vue -->
      <button v-can="'family:kick'" @click="kick(member.id)">
        Exclure
      </button>
      <button v-can="'family:edit'" @click="editRole(member.id)">
        Changer le rôle
      </button>
    </div>
  </div>
</template>
```

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Croire que masquer un bouton = sécurité

```vue
<!-- ❌ Fausse sécurité : le bouton est caché, l'API n'est pas protégée -->
<button v-if="user.role === 'family-admin'" @click="deleteFamily">
  Supprimer la famille
</button>

<!-- Un utilisateur avec F12 peut appeler directement : -->
<!-- fetch('/api/family/42', { method: 'DELETE', headers: { Authorization: ... } }) -->
```

**Correct :** Le bouton est masqué pour l'UX. L'API `/api/family/:id` **doit** vérifier le rôle côté serveur, indépendamment du front. Les deux protections sont nécessaires et complémentaires — le front pour le confort, le back pour la sécurité.

### PIÈGE #2 — Permissions hardcodées dans les composants

```vue
<!-- ❌ String du rôle éparpillée dans 15 composants -->
<button v-if="user.role === 'family-admin'" @click="invite">Inviter</button>

<!-- Si le rôle est renommé 'admin' → 15 fichiers à modifier, 1 oublié = bug -->
```

**Correct :** centraliser dans `ROLE_PERMISSIONS` et `usePermissions`. La permission `family:invite` est une constante dans `types/permissions.ts` — typage strict, renommage en un seul endroit.

```vue
<!-- ✅ Utilise le composable — découplé du nom de rôle -->
<button v-if="hasPermission('family:invite')" @click="invite">Inviter</button>
```

### PIÈGE #3 — Incohérence entre table front et règles back

```ts
// Front — types/permissions.ts
'member': ['post:create', 'post:delete-own', 'event:create']

// Back — roles.guard.ts (NestJS)
case 'member':
  return ['post:create']   // event:create oublié !
```

Résultat : l'UI affiche le bouton "Créer un événement" pour les membres, mais l'API retourne 403. L'utilisateur voit un bouton qui ne fait rien — UX cassée.

**Correct :** soit un contrat partagé (monorepo), soit les permissions retournées par l'API à la connexion (option B section 2.8). Tester l'intégration avec un test E2E qui vérifie que les actions UI aboutissent.

### PIÈGE #4 — `v-can` sur un élément parent masque les enfants mais pas leur tab order

```vue
<!-- ❌ Le bouton est invisible mais reste accessible au clavier -->
<div v-can="'family:kick'">
  <button @click="kick">Exclure</button>
</div>
```

`display: none` sur un parent retire les enfants du tab order — c'est correct. Mais si on applique `v-can` sur le `<button>` lui-même avec `aria-hidden`, le bouton reste focusable. Préférer `v-if` via composable pour une suppression propre du DOM et du tab order.

---

## 5. Ancrage TribuZen

Dans TribuZen, le RBAC s'applique à deux endroits clés du front-office famille :

**`FamilyAdminPanel.vue`** — panneau de gestion visible seulement aux `family-admin` :

```ts
// La route est protégée par guard
{
  path: '/family/:id/admin',
  component: () => import('@/views/FamilyAdmin.vue'),
  meta: { requiresAuth: true, requiredPermission: 'family:invite' },
}
```

**`MemberList.vue`** — liste des membres avec actions conditionnelles :

```vue
<li v-for="member in members" :key="member.id">
  <span>{{ member.name }}</span>
  <!-- Bouton Exclure = visible seulement si canKick(member) — ABAC -->
  <button
    v-if="canKick(member)"
    @click="familyStore.kickMember(member.id)"
  >
    Exclure
  </button>
</li>
```

**`PostCard.vue`** — bouton suppression conditionnel :

```vue
<button
  v-if="canDeletePost(post.authorId)"
  @click="deletePost(post.id)"
>
  Supprimer
</button>
```

Structure cible dans `smaurier/tribuzen` :

```
tribuzen/
  src/
    types/
      permissions.ts           ← ROLE_PERMISSIONS + types
    composables/
      usePermissions.ts        ← hasPermission, hasAnyPermission
      useFamilyPermissions.ts  ← canKick, canDeletePost (ABAC)
    directives/
      vCan.ts                  ← directive globale
    stores/
      auth.ts                  ← user.familyRole + computed permissions
    router/
      index.ts                 ← guards beforeEach
    components/
      family/
        FamilyAdminPanel.vue   ← panneau admin conditionnel
        MemberList.vue         ← bouton Exclure conditionnel
      post/
        PostCard.vue           ← bouton Supprimer conditionnel
```

---

## 6. Points clés

1. **RBAC** = rôle → ensemble de permissions. La table `ROLE_PERMISSIONS` est la source de vérité côté front.
2. **ABAC** ajoute la dimension ressource : même rôle, mais la permission dépend aussi de l'objet cible (même famille ? même auteur ?).
3. **`usePermissions`** centralise `hasPermission`, `hasAnyPermission`, `hasAllPermissions` — toujours appeler le composable, jamais tester `user.role` dans les composants.
4. **`v-can`** (directive) masque via `display:none` — pratique pour des ajouts ponctuels. `v-if` via `hasPermission()` supprime le nœud DOM — préférable pour l'accessibilité et les performances.
5. **Le front masque pour le confort. Le back autorise pour la sécurité.** Un bouton caché ne protège pas l'API — la vérification du rôle doit exister côté serveur.
6. **Guards de route** protègent l'UX (pas l'API) en redirigeant vers `/forbidden` si la permission est absente.
7. **Cohérence front-back** : utiliser un contrat partagé (monorepo) ou des permissions retournées par l'API pour éviter la dérive.
8. Les **permissions hardcodées** (`v-if="user.role === 'admin'"`) sont un anti-pattern — fragiles au renommage, non centralisées, non testables.

---

## 7. Seeds Anki

```
Quelle est la différence entre rôle et permission en RBAC ?|Un rôle est une étiquette attribuée à un utilisateur (ex: family-admin). Une permission est un droit atomique sur une action (ex: family:invite). Un rôle regroupe plusieurs permissions.
Pourquoi v-can ne sécurise pas l'application ?|v-can masque l'élément via display:none côté navigateur. Un utilisateur peut rendre l'élément visible via F12 ou appeler l'API directement. La sécurité réelle est côté serveur — le back doit vérifier le rôle indépendamment.
Quelle différence entre v-can (directive) et v-if via hasPermission() ?|v-can applique display:none — l'élément reste dans le DOM. v-if via hasPermission() supprime le nœud DOM — plus propre pour l'accessibilité et les performances. Préférer v-if pour les cas principaux, v-can pour des ajouts ponctuels.
Comment rendre les permissions réactives dans usePermissions ?|Lire les permissions depuis un computed Pinia. Si auth.user change (déconnexion, changement de rôle), le computed se recalcule et les v-if/v-can se mettent à jour automatiquement.
Qu'est-ce que l'ABAC et quand l'utiliser ?|Attribute-Based Access Control — la permission dépend non seulement du rôle mais aussi des attributs de la ressource (ex: même familyId, même auteur). Utiliser quand RBAC seul ne suffit pas (multi-tenant, ressources propres).
Comment protéger une route Vue Router par permission ?|Ajouter meta.requiredPermission à la route, puis dans router.beforeEach appeler hasPermission() depuis usePermissions et retourner { path: '/forbidden' } si refusé.
Comment garantir la cohérence des permissions entre front et back ?|Soit partager la table ROLE_PERMISSIONS via un package commun (monorepo), soit faire retourner les permissions par l'API à la connexion — le back reste source de vérité, le front consomme.
Quel anti-pattern remplace usePermissions dans les codebases legacy ?|Tester user.role directement dans les composants (v-if="user.role === 'admin'"). Problème: la logique est éparpillée, fragile au renommage, non testable unitairement.
Quelle est la différence entre le composant CanAccess et v-if via hasPermission() ?|Les deux suppriment le nœud DOM. CanAccess encapsule le pattern et offre un slot #fallback pour afficher un état dégradé sans double condition dans le template — plus lisible quand un message "non autorisé" doit être affiché.
```

---

## Pont vers le lab

> Lab associé : `02-vue/labs/lab-45-rbac-et-permissions/README.md`. Tu câbles `usePermissions` + `v-can` + guard de route sur un mini panneau famille TribuZen — composable Pinia, directive, router guard. Corrigé commenté intégral + variante J+30.

---

<!-- Navigation -->
← Précédent : [44-securite-front](./44-securite-front.md) | Suivant : [46-vue-query-tanstack](./46-vue-query-tanstack.md) →
