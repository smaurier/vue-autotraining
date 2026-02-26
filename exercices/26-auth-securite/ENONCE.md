# Exercice 26 — Authentification et permissions

**Module** : 11-Auth/Sécurité · **Difficulté** : ⭐⭐⭐⭐
**Cours** : `cours/11-auth-securite/01` à `03`

## Objectif

Implémenter un **système d'authentification complet** avec login, logout, refresh token simulé, guards de route et **RBAC** (contrôle d'accès par rôle).

## Consignes

### Partie 1 — Auth flow

1. Page **Login** avec formulaire email/password et validation Zod
2. Composable `useAuth()` : `login()`, `logout()`, `refreshToken()`, `isAuthenticated`, `user`, `role`
3. Simuler un backend (données en mémoire, `setTimeout` pour simuler la latence)
4. `accessToken` stocké en mémoire (variable réactive), `refreshToken` simulé
5. Auto-refresh : si le token expire (simulé avec un timer), rafraîchir automatiquement

### Partie 2 — RBAC

6. 3 rôles : `admin`, `editor`, `viewer`
7. Permissions granulaires : `users:read`, `users:write`, `products:read`, `products:write`, `settings:write`
8. Composable `usePermissions()` : `hasPermission()`, `hasAnyPermission()`
9. Composant `<CanAccess permission="...">` qui affiche/masque du contenu
10. Directive `v-can="'permission'"` en bonus

### Partie 3 — Guards et routes

11. Guard `authGuard` : redirige vers `/login` si non connecté
12. Guard `roleGuard` : redirige vers `/forbidden` si rôle insuffisant
13. Pages : Login, Dashboard (auth), Users (admin), Products (editor+), Forbidden

## Contraintes TypeScript

- Interface `User` avec `role: Role`
- Types `Permission`, `Role` union types
- `RouteMeta` augmenté avec `requiresAuth` et `requiredRole`
- Zéro `any`

## Bonus

- Page profil avec modification du mot de passe
- Rate limiting simulé sur le login (3 tentatives max)
- Redirect vers la page demandée après login (`?redirect=`)
- Directive `v-can`

## Fichiers

→ `src/exercises/ex26/AuthApp.vue`
→ `src/exercises/ex26/composables/useAuth.ts`
→ `src/exercises/ex26/composables/usePermissions.ts`
→ `src/exercises/ex26/components/CanAccess.vue`
→ `src/exercises/ex26/pages/LoginPage.vue`
→ `src/exercises/ex26/pages/DashboardPage.vue`
→ `src/exercises/ex26/pages/ForbiddenPage.vue`
→ `src/exercises/ex26/types.ts`
