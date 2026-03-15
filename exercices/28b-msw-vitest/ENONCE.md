# Exercice 28b — MSW + Vitest : Mocking API en tests unitaires et composants

## Objectif

Pratiquer **MSW (Mock Service Worker)** dans le contexte des **tests unitaires** et **tests de composants** avec Vitest + Vue Test Utils. Pas de Playwright ici — on reste 100% côté Node/Vitest.

## Contexte ESN

En mission, tu testes des composants et des composables qui appellent une API REST. Au lieu de `vi.mock('fetch')`, tu utilises MSW pour intercepter les requêtes au niveau réseau — ton code ne sait pas qu'il parle à un mock.

---

## Prérequis

- `cours/03-avance/03-tests-unitaires.md`
- `cours/03-avance/04-tests-composants.md`
- `cours/03-avance/07-msw-et-mocking-api.md`

## Stack

- Vitest
- Vue Test Utils
- MSW (`msw/node`)

---

## Partie 1 — Setup MSW pour Vitest

1. Installer MSW :

   ```bash
   pnpm add -D msw
   ```

2. Créer `src/mocks/handlers.ts` — handlers pour une API REST `/api/products` :
   - `GET /api/products` → retourne une liste de 3 produits (`{ id, name, price, inStock }`)
   - `GET /api/products/:id` → retourne un produit par id (où 404)
   - `POST /api/products` → crée un produit (retourne 201 + body)
   - `PATCH /api/products/:id` → met à jour un produit
   - `DELETE /api/products/:id` → supprime (204)

3. Créer `src/mocks/server.ts` :

   ```ts
   import { setupServer } from "msw/node";
   import { handlers } from "./handlers";
   export const server = setupServer(...handlers);
   ```

4. Créer `vitest.setup.ts` :

   ```ts
   beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
   afterEach(() => server.resetHandlers());
   afterAll(() => server.close());
   ```

5. Référencer le setup dans `vitest.config.ts`.

---

## Partie 2 — Tests d'un composable `useProducts`

6. Créer le composable `src/composables/useProducts.ts` :
   - `products: Ref<Product[]>` — liste réactive
   - `isLoading: Ref<boolean>`
   - `error: Ref<string | null>`
   - `fetchProducts(): Promise<void>` — GET /api/products
   - `createProduct(data): Promise<Product>` — POST /api/products
   - `deleteProduct(id): Promise<void>` — DELETE /api/products/:id

7. Écrire les tests dans `src/composables/__tests__/useProducts.spec.ts` :

   **Test 1 — Happy path** :

   ```ts
   it("charge la liste des produits", async () => {
     const { products, fetchProducts, isLoading } = useProducts();
     expect(isLoading.value).toBe(false);
     await fetchProducts();
     expect(products.value).toHaveLength(3);
     expect(products.value[0].name).toBe("Clavier");
   });
   ```

   **Test 2 — Erreur serveur (override par test)** :

   ```ts
   it("gère une erreur 500", async () => {
     server.use(
       http.get("/api/products", () =>
         HttpResponse.json({ message: "Erreur" }, { status: 500 }),
       ),
     );
     const { error, fetchProducts } = useProducts();
     await fetchProducts();
     expect(error.value).toContain("Erreur");
   });
   ```

   **Test 3 — Erreur réseau** :

   ```ts
   it("gère un problème réseau", async () => {
     server.use(http.get("/api/products", () => HttpResponse.error()));
     const { error, fetchProducts } = useProducts();
     await fetchProducts();
     expect(error.value).toBeTruthy();
   });
   ```

   **Test 4 — Création** :

   ```ts
   it("crée un produit", async () => {
     const { createProduct } = useProducts();
     const newProduct = await createProduct({
       name: "Souris",
       price: 29.99,
       inStock: true,
     });
     expect(newProduct.id).toBeDefined();
     expect(newProduct.name).toBe("Souris");
   });
   ```

   **Test 5 — Suppression** :

   ```ts
   it("supprime un produit", async () => {
     const { deleteProduct } = useProducts();
     await expect(deleteProduct(1)).resolves.toBeUndefined();
   });
   ```

   **Test 6 — 404 sur suppression** :

   ```ts
   it("gère un 404 à la suppression", async () => {
     server.use(
       http.delete("/api/products/:id", () =>
         HttpResponse.json({ message: "Not found" }, { status: 404 }),
       ),
     );
     await expect(deleteProduct(999)).rejects.toThrow();
   });
   ```

---

## Partie 3 — Tests de composants avec MSW

8. Créer le composant `ProductList.vue` :
   - Appelle `useProducts().fetchProducts()` dans `onMounted`
   - Affiche un spinner si `isLoading`
   - Affiche un message d'erreur si `error`
   - Affiche la liste des produits avec nom et prix

9. Écrire les tests dans `src/components/__tests__/ProductList.spec.ts` :

   **Test 7 — Affiche les produits** :

   ```ts
   it("affiche la liste des produits", async () => {
     const wrapper = mount(ProductList);
     await flushPromises();
     expect(wrapper.text()).toContain("Clavier");
     expect(wrapper.text()).toContain("Écran");
   });
   ```

   **Test 8 — Affiche le loader** :

   ```ts
   it("affiche le spinner pendant le chargement", () => {
     const wrapper = mount(ProductList);
     expect(wrapper.find('[data-testid="spinner"]').exists()).toBe(true);
   });
   ```

   **Test 9 — Affiche l'erreur** :

   ```ts
   it("affiche un message d'erreur", async () => {
     server.use(
       http.get("/api/products", () =>
         HttpResponse.json({ message: "Boom" }, { status: 500 }),
       ),
     );
     const wrapper = mount(ProductList);
     await flushPromises();
     expect(wrapper.text()).toContain("Erreur");
   });
   ```

   **Test 10 — Liste vide** :

   ```ts
   it('affiche "Aucun produit" si la liste est vide', async () => {
     server.use(http.get("/api/products", () => HttpResponse.json([])));
     const wrapper = mount(ProductList);
     await flushPromises();
     expect(wrapper.text()).toContain("Aucun produit");
   });
   ```

---

## Partie 4 — Handlers avancés

10. Ajouter un handler avec **délai simulé** :

    ```ts
    http.get("/api/products", async () => {
      await delay(200); // import { delay } from 'msw'
      return HttpResponse.json(products);
    });
    ```

    Écrire un test qui vérifie que le spinner est visible pendant le délai.

11. Ajouter un handler **conditionnel** (query params) :
    ```ts
    http.get("/api/products", ({ request }) => {
      const url = new URL(request.url);
      const search = url.searchParams.get("q");
      const filtered = products.filter((p) =>
        p.name.toLowerCase().includes(search?.toLowerCase() ?? ""),
      );
      return HttpResponse.json(filtered);
    });
    ```
    Tester la recherche : `fetchProducts({ q: 'clavier' })` → 1 résultat.

---

## Bonus

- [ ] Tester un composable qui utilise `AbortController` pour annuler les requêtes
- [ ] Mocker un endpoint avec pagination (`?page=1&limit=10`) et tester `fetchNextPage()`
- [ ] Utiliser `server.events.on('request:start', ...)` pour logger les requêtes interceptées en debug
- [ ] Vérifier que `onUnhandledRequest: 'error'` lève une erreur si un endpoint non mocké est appelé

---

## Livrables

```
src/
  mocks/
    handlers.ts
    server.ts
  composables/
    useProducts.ts
    __tests__/
      useProducts.spec.ts
  components/
    ProductList.vue
    __tests__/
      ProductList.spec.ts
vitest.setup.ts
```

---

## Ce que tu apprends

| Compétence             | Pratiquée ici                           |
| ---------------------- | --------------------------------------- |
| Setup MSW pour Vitest  | server.listen, resetHandlers, close     |
| Handlers REST complets | GET, POST, PATCH, DELETE, params, query |
| Override par test      | server.use() pour scénarios d'erreur    |
| Tests composables      | Happy path, erreur 500, erreur réseau   |
| Tests composants + MSW | mount + flushPromises + MSW             |
| Handlers avancés       | delay, query params, conditions         |
| Isolation des tests    | resetHandlers garantit le nettoyage     |
