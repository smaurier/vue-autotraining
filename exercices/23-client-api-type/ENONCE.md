# Exercice 23 — Client API typé

**Module** : 08-API Typées · **Difficulté** : ⭐⭐⭐⭐⭐
**Cours** : `cours/08-api-typees/01` (GraphQL), `cours/08-api-typees/02` (tRPC)

## Objectif

Construire un client API typé end-to-end, simulant les patterns GraphQL et tRPC dans un contexte Vue 3.

## Consignes

### Partie 1 — Client GraphQL simulé

1. `graphql/schema.ts` : typer un schéma simplifié
   - Types : `User`, `Post`, `Comment`
   - Queries : `users`, `user(id)`, `posts`, `post(id)`
   - Mutations : `createPost`, `updatePost`, `deletePost`

2. `graphql/client.ts` : client typé
   - `useQuery<TData, TVars>(query, variables)` → `{ data, loading, error }`
   - `useMutation<TData, TVars>(mutation)` → `{ mutate, loading, error }`
   - Données en mémoire, typage strict des requêtes

### Partie 2 — Client tRPC simulé

3. `trpc/router.ts` : définir un router typé simplifié
   - `user.getAll`, `user.getById`, `user.create`
   - `post.getAll`, `post.getByAuthor`, `post.create`
   - Type inference automatique (input → output)

4. `trpc/client.ts` :
   - `const trpc = createTRPCClient(router)`
   - `trpc.user.getAll.useQuery()` — retourne un composable typé
   - Les types sont inférés du router

### Partie 3 — Démonstration

5. `TypedApiClient.vue` :
   - Toggle entre mode GraphQL et mode tRPC
   - Liste des posts avec auteur
   - Créer un nouveau post
   - Afficher les types inférés dans le template (pour pédagogie)

## Contraintes TypeScript

- Generics avancés, conditional types, infer
- Le client doit être type-safe : une mauvaise query ne compile pas
- Zero `any`

## Fichiers

→ `src/exercises/ex23/TypedApiClient.vue`
→ `src/exercises/ex23/graphql/schema.ts`
→ `src/exercises/ex23/graphql/client.ts`
→ `src/exercises/ex23/trpc/router.ts`
→ `src/exercises/ex23/trpc/client.ts`
→ `src/exercises/ex23/types.ts`
