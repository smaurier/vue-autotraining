# Checklist — Exercice 28b : MSW + Vitest (tests unitaires & composants)

## Setup MSW

- [ ] MSW installé (`pnpm add -D msw`)
- [ ] `src/mocks/handlers.ts` — 5 handlers REST (GET list, GET by id, POST, PATCH, DELETE)
- [ ] `src/mocks/server.ts` — `setupServer(...handlers)`
- [ ] `vitest.setup.ts` — `beforeAll(listen)`, `afterEach(resetHandlers)`, `afterAll(close)`
- [ ] `onUnhandledRequest: 'error'` configuré

## Composable useProducts

- [ ] `products`, `isLoading`, `error` — refs réactives
- [ ] `fetchProducts()` — GET /api/products
- [ ] `createProduct(data)` — POST /api/products
- [ ] `deleteProduct(id)` — DELETE /api/products/:id

## Tests composable (`useProducts.spec.ts`)

- [ ] Test 1 — Happy path : charge 3 produits
- [ ] Test 2 — Erreur 500 : `server.use()` override, `error.value` renseigné
- [ ] Test 3 — Erreur réseau : `HttpResponse.error()`
- [ ] Test 4 — Création : retourne le produit créé avec id
- [ ] Test 5 — Suppression : resolve sans erreur
- [ ] Test 6 — 404 à la suppression : rejects/throw

## Tests composant (`ProductList.spec.ts`)

- [ ] Test 7 — Affiche les noms des produits
- [ ] Test 8 — Affiche le spinner pendant le chargement
- [ ] Test 9 — Affiche un message d'erreur (override 500)
- [ ] Test 10 — Affiche "Aucun produit" (override liste vide)

## Handlers avancés

- [ ] Handler avec `delay()` — spinner visible pendant le délai
- [ ] Handler avec query params (`?q=`) — recherche filtrée

## Qualité

- [ ] TypeScript strict, zéro `any`
- [ ] Types `Product` partagés entre handlers et composable
- [ ] `server.resetHandlers()` dans `afterEach` (pas d'état partagé)
- [ ] Tous les tests passent avec `pnpm test`

## Bonus

- [ ] Test avec `AbortController` (annulation de requête)
- [ ] Pagination mockée (`?page=1&limit=10`)
- [ ] Logging des requêtes avec `server.events`
- [ ] Test `onUnhandledRequest: 'error'` bloque les appels non mockés
