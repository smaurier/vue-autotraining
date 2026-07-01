# Lab 45 — RBAC et permissions

> **Outcome :** à la fin, tu sais câbler `usePermissions` (Pinia), la directive `v-can`, et un guard de route par permission sur un panneau famille TribuZen réel.
> **Vrai outil :** Vue 3.5 + Pinia 2 + Vue Router 4 (projet Vite existant).
> **Feedback :** le coach valide visuellement en session — les boutons conditionnels s'affichent ou non selon le rôle actif dans le store.

---

## Énoncé

Tu construis le mini panneau d'administration de famille TribuZen. Le cahier des charges :

1. Un store Pinia `useAuthStore` expose `user` avec un champ `familyRole` de type `'family-admin' | 'member' | 'guest'`.
2. Une table `ROLE_PERMISSIONS` associe chaque rôle à ses permissions (`family:invite`, `family:kick`, `post:delete-any`).
3. Un composable `usePermissions` expose `hasPermission(p)` — réactif sur le store.
4. La directive `v-can` masque un élément si l'utilisateur n'a pas la permission.
5. La route `/family/admin` est protégée par guard — accessible uniquement si `hasPermission('family:invite')`.
6. Un sélecteur de rôle (UI de dev) permet de basculer le rôle en live pour tester l'UI conditionnelle.

**Pas de gap-fill** — tu écris chaque fichier de A à Z à partir du starter.

### Starter minimal

Dans ton projet Vite (`pnpm create vite@latest tribuzen-rbac --template vue-ts`), installe Pinia et Vue Router :

```bash
pnpm add pinia vue-router@4
```

Structure cible à créer :

```
src/
  types/
    permissions.ts
  stores/
    auth.ts
  composables/
    usePermissions.ts
  directives/
    vCan.ts
  router/
    index.ts
  views/
    FamilyAdmin.vue
    Forbidden.vue
  components/
    DevRoleSwitcher.vue
  main.ts
  App.vue
```

Lance `pnpm dev` et garde le navigateur ouvert — les changements de rôle doivent se refléter instantanément.

---

## Étapes (en friction)

1. **Définis les types** — écris `src/types/permissions.ts` avec `FamilyRole`, `Permission`, et la table `ROLE_PERMISSIONS`. Trois rôles, au moins 5 permissions.

2. **Crée le store auth** — `src/stores/auth.ts` avec Pinia `defineStore`. Un `ref<AuthUser | null>` pour `user`, un `computed<Permission[]>` qui lit `ROLE_PERMISSIONS[user.familyRole]`. Expose une action `setRole(role: FamilyRole)` pour le sélecteur de dev.

3. **Écris `usePermissions`** — `src/composables/usePermissions.ts`. Lit les permissions depuis le store. Implémente `hasPermission`, `hasAnyPermission`, `hasAllPermissions`. Vérifie que si tu appelles `auth.setRole('guest')` depuis la console, `hasPermission('family:invite')` retourne `false` immédiatement.

4. **Écris la directive `v-can`** — `src/directives/vCan.ts`. Hooks `mounted` et `updated`. Enregistre-la globalement dans `main.ts` (`app.directive('can', vCan)`).

5. **Configure le router** — `src/router/index.ts`. Route `/family/admin` avec `meta.requiredPermission: 'family:invite'`. Guard `beforeEach` qui redirige vers `/forbidden` si la permission manque.

6. **Construis `FamilyAdmin.vue`** — affiche un bouton "Inviter" avec `v-can="'family:invite'"` ET un `v-if="hasPermission('family:invite')"` (compare les deux approches côte à côte). Ajoute un bouton "Exclure" avec `v-can="'family:kick'"`.

7. **Crée `DevRoleSwitcher.vue`** — trois boutons qui appellent `auth.setRole('family-admin' | 'member' | 'guest')`. Place-le dans `App.vue` pour tester en live.

8. **Vérifie les cas limites** :
   - Rôle `guest` → les deux boutons sont masqués, naviguer vers `/family/admin` redirige vers `/forbidden`.
   - Rôle `member` → aucun des deux boutons (invite/kick), route toujours interdite.
   - Rôle `family-admin` → les deux boutons visibles, route accessible.

---

## Corrigé complet commenté

### `src/types/permissions.ts`

```ts
// Les trois rôles possibles dans une famille TribuZen
export type FamilyRole = 'family-admin' | 'member' | 'guest'

// Permissions atomiques — format convention "ressource:action"
export type Permission =
  | 'family:invite'      // inviter un nouveau membre
  | 'family:kick'        // exclure un membre existant
  | 'family:edit'        // modifier nom et avatar de la famille
  | 'post:create'        // créer une publication
  | 'post:delete-own'    // supprimer sa propre publication
  | 'post:delete-any'    // supprimer n'importe quelle publication (modération)
  | 'event:create'       // créer un événement familial

// Source de vérité : quel rôle a quelles permissions
// Record<FamilyRole, Permission[]> garantit que tous les rôles sont couverts par TS
export const ROLE_PERMISSIONS: Record<FamilyRole, Permission[]> = {
  'family-admin': [
    'family:invite',
    'family:kick',
    'family:edit',
    'post:create',
    'post:delete-own',
    'post:delete-any',
    'event:create',
  ],
  'member': [
    'post:create',
    'post:delete-own',
    'event:create',
    // Pas d'accès aux actions d'administration famille
  ],
  'guest': [
    // Lecture seule — aucune permission d'écriture
    // Tableau vide explicite pour que Record<FamilyRole, ...> soit complet
  ],
}
```

### `src/stores/auth.ts`

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ROLE_PERMISSIONS } from '@/types/permissions'
import type { FamilyRole, Permission } from '@/types/permissions'

interface AuthUser {
  id: string
  name: string
  familyId: string
  familyRole: FamilyRole
}

export const useAuthStore = defineStore('auth', () => {
  // État initial : utilisateur connecté en tant que 'member' pour la démo
  const user = ref<AuthUser | null>({
    id: 'u1',
    name: 'Sylvain',
    familyId: 'f1',
    familyRole: 'member',
  })

  const isAuthenticated = computed(() => user.value !== null)

  // computed réactif — recalcule automatiquement si user.familyRole change
  // C'est ce computed que usePermissions va lire
  const permissions = computed<Permission[]>(() => {
    if (!user.value) return []
    // ROLE_PERMISSIONS[role] peut être undefined si le rôle est inconnu — ?? [] sécurise
    return ROLE_PERMISSIONS[user.value.familyRole] ?? []
  })

  // Action de dev pour tester le sélecteur de rôle
  function setRole(role: FamilyRole): void {
    if (!user.value) return
    // Vue réagit au changement de propriété dans un objet ref<T>
    user.value = { ...user.value, familyRole: role }
    // On réassigne user.value (pas une mutation interne) pour déclencher la réactivité
  }

  return { user, isAuthenticated, permissions, setRole }
})
```

### `src/composables/usePermissions.ts`

```ts
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { Permission } from '@/types/permissions'

export function usePermissions() {
  const auth = useAuthStore()

  // On lit directement depuis le computed du store
  // Si auth.permissions change (changement de rôle), ce computed se recalcule aussi
  const permissions = computed<Permission[]>(() => auth.permissions)

  // Vérification d'une permission unique
  // .includes() fait une comparaison stricte sur les strings — les typos sont interceptées par TS
  function hasPermission(permission: Permission): boolean {
    return permissions.value.includes(permission)
  }

  // OR logique : au moins une des permissions listées
  // rest parameter (...perms) permet : hasAnyPermission('family:invite', 'family:kick')
  function hasAnyPermission(...perms: Permission[]): boolean {
    return perms.some(p => permissions.value.includes(p))
  }

  // AND logique : toutes les permissions listées
  function hasAllPermissions(...perms: Permission[]): boolean {
    return perms.every(p => permissions.value.includes(p))
  }

  return { permissions, hasPermission, hasAnyPermission, hasAllPermissions }
}
```

### `src/directives/vCan.ts`

```ts
import type { Directive } from 'vue'
import type { Permission } from '@/types/permissions'
import { usePermissions } from '@/composables/usePermissions'

// Directive<HTMLElement, Permission> — TS vérifie que la valeur passée est bien une Permission
export const vCan: Directive<HTMLElement, Permission> = {
  mounted(el, binding) {
    // binding.value = la valeur passée dans le template, ex: 'family:invite'
    applyCanDirective(el, binding.value)
  },

  updated(el, binding) {
    // S'exécute si la valeur du binding change dynamiquement
    // binding.oldValue permet d'éviter le recalcul si rien n'a changé
    if (binding.value !== binding.oldValue) {
      applyCanDirective(el, binding.value)
    }
  },
}

function applyCanDirective(el: HTMLElement, permission: Permission): void {
  const { hasPermission } = usePermissions()
  const allowed = hasPermission(permission)

  if (allowed) {
    el.style.display = ''            // réinitialise au display CSS naturel
    el.removeAttribute('aria-hidden')
  } else {
    el.style.display = 'none'        // masque visuellement
    el.setAttribute('aria-hidden', 'true')  // cache aux lecteurs d'écran
    // ⚠️ L'élément reste dans le DOM — un utilisateur F12 peut le réafficher
    // Pour une suppression propre : utiliser v-if="hasPermission(...)" dans le template
  }
}
```

### `src/router/index.ts`

```ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/composables/usePermissions'
import type { Permission } from '@/types/permissions'

// Extension du type RouteMeta — typage des métadonnées de route
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiredPermission?: Permission
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/views/Home.vue'),
    },
    {
      path: '/family/admin',
      component: () => import('@/views/FamilyAdmin.vue'),
      meta: {
        requiresAuth: true,
        // Seule la permission 'family:invite' conditionne l'accès à cette route
        // (proxy raisonnable : si tu peux inviter, tu es admin)
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

  // Étape 1 — authentification
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    // Garde la destination en query pour rediriger après login
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // Étape 2 — permission sur la route
  const required = to.meta.requiredPermission
  if (required) {
    const { hasPermission } = usePermissions()
    if (!hasPermission(required)) {
      // Retourner un objet de route redirige sans ajouter à l'historique si on utilise replace
      return { path: '/forbidden' }
    }
  }

  // Étape 3 — accès autorisé
  // Retourner undefined ou true = continuer la navigation
  return true
})

export default router
```

### `src/views/FamilyAdmin.vue`

```vue
<script setup lang="ts">
import { usePermissions } from '@/composables/usePermissions'

const { hasPermission, hasAnyPermission } = usePermissions()

function invite(): void {
  // En vrai produit : ouvrir une modale, appeler l'API
  alert('Invitation envoyée ! (demo)')
}

function kick(memberId: string): void {
  alert(`Membre ${memberId} exclu ! (demo)`)
}
</script>

<template>
  <div class="admin-panel">
    <h1>Panneau admin — Famille TribuZen</h1>

    <!--
      APPROCHE 1 — v-if via composable (recommandée)
      Le nœud DOM est supprimé si pas la permission.
      Plus propre pour l'accessibilité et les performances.
    -->
    <section class="section">
      <h2>Via v-if + composable</h2>
      <button
        v-if="hasPermission('family:invite')"
        class="btn btn--primary"
        @click="invite"
      >
        Inviter un membre
      </button>
      <p v-else class="no-access">
        Vous n'avez pas la permission d'inviter.
      </p>

      <button
        v-if="hasPermission('family:kick')"
        class="btn btn--danger"
        @click="kick('member-42')"
      >
        Exclure un membre
      </button>
    </section>

    <!--
      APPROCHE 2 — directive v-can
      L'élément reste dans le DOM avec display:none.
      Utile pour des ajouts ponctuels sans refactorer le template.
    -->
    <section class="section">
      <h2>Via directive v-can</h2>
      <button v-can="'family:invite'" class="btn btn--primary" @click="invite">
        Inviter (via v-can)
      </button>
      <button v-can="'family:kick'" class="btn btn--danger" @click="kick('member-42')">
        Exclure (via v-can)
      </button>
    </section>

    <!--
      Section mixte — visible si peut inviter OU exclure
      hasAnyPermission remplace deux v-if imbriqués
    -->
    <section v-if="hasAnyPermission('family:invite', 'family:kick')" class="section">
      <h2>Actions avancées</h2>
      <p>Vous avez accès à au moins une action d'administration.</p>
    </section>
  </div>
</template>

<style scoped>
.admin-panel {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1rem;
  font-family: sans-serif;
}

.section {
  margin-bottom: 2rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.btn {
  margin-right: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn--primary { background: #3b82f6; color: white; }
.btn--danger  { background: #ef4444; color: white; }

.no-access {
  color: #94a3b8;
  font-style: italic;
}
</style>
```

### `src/components/DevRoleSwitcher.vue`

```vue
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/composables/usePermissions'
import type { FamilyRole } from '@/types/permissions'

const auth = useAuthStore()
const { permissions } = usePermissions()

const roles: FamilyRole[] = ['family-admin', 'member', 'guest']

function switchRole(role: FamilyRole): void {
  auth.setRole(role)
}
</script>

<template>
  <div class="role-switcher">
    <strong>Dev — Rôle actif :</strong>
    <span class="current-role">{{ auth.user?.familyRole ?? 'non connecté' }}</span>

    <div class="buttons">
      <button
        v-for="role in roles"
        :key="role"
        class="btn"
        :class="{ 'btn--active': auth.user?.familyRole === role }"
        @click="switchRole(role)"
      >
        {{ role }}
      </button>
    </div>

    <!-- Affiche les permissions actives — utile pour déboguer -->
    <details>
      <summary>Permissions actives ({{ permissions.length }})</summary>
      <ul>
        <li v-for="perm in permissions" :key="perm">{{ perm }}</li>
        <li v-if="permissions.length === 0" style="color: #94a3b8;">Aucune</li>
      </ul>
    </details>
  </div>
</template>

<style scoped>
.role-switcher {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background: #1e293b;
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  z-index: 9999;
}

.current-role {
  margin-left: 0.4rem;
  font-weight: 700;
  color: #60a5fa;
}

.buttons {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.btn {
  padding: 0.25rem 0.5rem;
  border: 1px solid #475569;
  border-radius: 4px;
  background: transparent;
  color: white;
  cursor: pointer;
  font-size: 0.75rem;
}

.btn--active {
  background: #3b82f6;
  border-color: #3b82f6;
}

details { margin-top: 0.5rem; }
ul { margin: 0.25rem 0 0 1rem; padding: 0; }
</style>
```

### `src/main.ts`

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { vCan } from '@/directives/vCan'
import App from './App.vue'
import router from './router'

const app = createApp(App)

// Ordre important : Pinia avant le router (les guards utilisent les stores)
app.use(createPinia())
app.use(router)

// Directive globale — v-can disponible dans tous les templates
app.directive('can', vCan)

app.mount('#app')
```

### `src/App.vue`

```vue
<script setup lang="ts">
import DevRoleSwitcher from '@/components/DevRoleSwitcher.vue'
</script>

<template>
  <RouterView />
  <DevRoleSwitcher />
</template>
```

---

## Variante J+30 (fading)

**Même objectif, en 30 minutes, contraintes ajoutées :**

1. Remplace la table `ROLE_PERMISSIONS` locale par des permissions retournées par l'API. Simule avec `useFetch` ou un `setTimeout` : après 500ms, le store reçoit `{ user, permissions: ['post:create'] }` depuis un faux endpoint.
2. Ajoute un composant `CanAccess.vue` (wrapper avec slot) en alternative à `v-can`. Props `permission`, `anyOf`, `allOf`. Le parent choisit la fallback via `<template #fallback>`.
3. Ajoute une permission `event:create` à `member` et vérifie avec `hasAllPermissions('post:create', 'event:create')` — le bouton "Agenda" n'apparaît que si les deux sont présentes.

**Critère de réussite :** le sélecteur de rôle fonctionne, les trois scénarios (admin / member / guest) affichent les bons boutons, la route `/family/admin` redirige pour guest et member.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, les fichiers créés ici vont directement dans la structure :

```
tribuzen/
  src/
    types/permissions.ts        ← copie directe du lab
    stores/auth.ts              ← enrichir avec les vraies données API
    composables/usePermissions.ts  ← identique, réutilisable
    directives/vCan.ts          ← identique
    router/index.ts             ← intégrer les guards dans le router existant
```

**Différences par rapport au lab :**

- `auth.setRole()` est une action de dev — retirer en production. Les permissions viendront de l'API de login.
- `DevRoleSwitcher.vue` est un composant de dev — le conditionner avec `import.meta.env.DEV`.
- Le store auth existant TribuZen gère aussi le JWT, le refresh token et la persistance `localStorage` — intégrer `permissions` dans cet état existant.

**Commit cible :**

```
feat(auth): RBAC — usePermissions, v-can, guards route famille
```
