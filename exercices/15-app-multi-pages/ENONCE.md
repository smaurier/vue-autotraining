# Exercice 15 — Application multi-pages (Router)

**Module** : 03-Avancé · **Difficulté** : ⭐⭐⭐⭐
**Cours** : `cours/03-avance/01` (Vue Router)

## Objectif

Implémenter une navigation multi-pages avec Vue Router : routes dynamiques, guards, lazy loading, navigation imbriquée.

## Consignes

> **Note** : Cet exercice simule le routage via `component :is` et un état local pour rester lançable dans App.vue. Les concepts sont identiques à Vue Router.

### Système de navigation

1. Créer un mini-routeur basé sur un état réactif :
   - `currentRoute: Ref<string>`
   - `params: Ref<Record<string, string>>`
   - `navigate(route, params?)` function

2. Pages :
   - **Home** : page d'accueil avec liens
   - **Users** : liste d'utilisateurs (données mock)
   - **UserDetail** : détail dynamique `users/:id` → affiche 1 utilisateur
   - **Settings** : page protégée (nécessite `isAuthenticated`)
   - **NotFound** : page 404

3. Guards :
   - Guard global « before navigation » : log chaque navigation
   - Guard sur Settings : redirige vers Home si non authentifié
   - Bouton login/logout pour toggle `isAuthenticated`

4. Layout :
   - Navbar avec liens de navigation
   - Zone de contenu qui change selon la « route »
   - Breadcrumb dynamique

## Contraintes TypeScript

- `interface Route { path: string; component: Component; meta?: { requiresAuth?: boolean } }`
- Guard typé : `(to: string, from: string) => boolean | string`

## Bonus

- Transition entre les pages
- Historique de navigation (bouton retour)

## Fichiers

→ `src/exercises/ex15/RouterApp.vue`
→ `src/exercises/ex15/composables/useSimpleRouter.ts`
→ `src/exercises/ex15/pages/HomePage.vue`
→ `src/exercises/ex15/pages/UsersPage.vue`
→ `src/exercises/ex15/pages/UserDetailPage.vue`
→ `src/exercises/ex15/pages/SettingsPage.vue`
→ `src/exercises/ex15/pages/NotFoundPage.vue`
→ `src/exercises/ex15/components/NavBar.vue`
→ `src/exercises/ex15/types.ts`
