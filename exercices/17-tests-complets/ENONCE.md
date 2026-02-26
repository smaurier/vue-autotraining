# Exercice 17 — Tests complets

**Module** : 03-Avancé · **Difficulté** : ⭐⭐⭐⭐
**Cours** : `cours/03-avance/03` à `05` (tests unitaires, composants, E2E)

## Objectif

Écrire des tests unitaires et de composants avec Vitest et Vue Test Utils.

## Consignes

> **Note** : Le composant `LoginForm.vue` est affiché dans App.vue. Les tests s'exécutent via `pnpm test`.

### Composant à tester

1. `LoginForm.vue` :
   - Input email + input password + bouton Submit
   - Validation : email requis (format), password min 6 chars
   - Émet `login` avec `{ email, password }` au submit valide
   - Émet `error` avec message si invalide
   - État loading (bouton désactivé + spinner)

### Tests

2. `LoginForm.spec.ts` :
   - Rendu initial (inputs présents, bouton présent)
   - Validation email invalide → message d'erreur affiché
   - Validation password trop court → message d'erreur
   - Submit valide → événement `login` émis avec bonnes données
   - Submit invalide → événement `error` émis
   - État loading → bouton désactivé

3. `validators.spec.ts` :
   - Tester les fonctions pures `validateEmail()`, `validatePassword()`

4. `useAuth.spec.ts` :
   - Tester le composable `useAuth` (login, logout, état)

## Contraintes TypeScript

- Tests typés avec Vitest
- `mount<typeof LoginForm>` typé
- No `any` dans les tests

## Fichiers

→ `src/exercises/ex17/LoginForm.vue`
→ `src/exercises/ex17/composables/useAuth.ts`
→ `src/exercises/ex17/utils/validators.ts`
→ `src/exercises/ex17/__tests__/LoginForm.spec.ts`
→ `src/exercises/ex17/__tests__/validators.spec.ts`
→ `src/exercises/ex17/__tests__/useAuth.spec.ts`
→ `src/exercises/ex17/types.ts`
