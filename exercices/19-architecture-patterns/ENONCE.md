# Exercice 19 — Architecture & Patterns

**Module** : 04-Expert · **Difficulté** : ⭐⭐⭐⭐⭐
**Cours** : `cours/04-expert/02` (SSR concepts), `cours/04-expert/03` (architecture), `cours/04-expert/04` (patterns entreprise)

## Objectif

Structurer une application Vue 3 selon les patterns d'architecture enterprise : feature-based, service layer, dependency injection, et patterns avancés.

## Consignes

### Partie 1 — Service Layer

1. Créer un `HttpService` abstrait :
   - Interface `IHttpService` : `get<T>`, `post<T>`, `put<T>`, `delete<T>`
   - Implémentation `MockHttpService` (données en mémoire)
   - Injection via `provide` / `inject` avec `InjectionKey`

2. `UserService` qui utilise `IHttpService` :
   - `getAll()`, `getById()`, `create()`, `update()`, `delete()`

### Partie 2 — Feature Module

3. Module `users/` auto-contenu :
   - `users/composables/useUsers.ts` — logique métier
   - `users/components/UserList.vue` — présentation liste
   - `users/components/UserForm.vue` — formulaire créer/éditer
   - `users/types.ts` — types du module

### Partie 3 — Patterns avancés

4. Patterns démontrés :
   - **Repository pattern** : abstraction de l'accès aux données
   - **Composable factory** : `createCrudComposable<T>(service)` — génère un composable CRUD pour n'importe quel type
   - **Event bus typé** : `useEventBus<Events>()` pour la communication cross-component

5. Composant racine `ArchitectureDemo.vue` assemble le tout

## Contraintes TypeScript

- Interfaces pour chaque service
- Generics sur le factory
- `InjectionKey` typées
- Zero `any`

## Fichiers

→ `src/exercises/ex19/ArchitectureDemo.vue`
→ `src/exercises/ex19/services/HttpService.ts`
→ `src/exercises/ex19/services/UserService.ts`
→ `src/exercises/ex19/features/users/composables/useUsers.ts`
→ `src/exercises/ex19/features/users/components/UserList.vue`
→ `src/exercises/ex19/features/users/components/UserForm.vue`
→ `src/exercises/ex19/features/users/types.ts`
→ `src/exercises/ex19/patterns/createCrudComposable.ts`
→ `src/exercises/ex19/patterns/useEventBus.ts`
→ `src/exercises/ex19/types.ts`
