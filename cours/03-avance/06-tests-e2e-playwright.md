# 06 — Tests E2E Vue/Nuxt avec Playwright

---

> **Prérequis : Testing Course**
> Les fondamentaux de Playwright (installation, selecteurs, actions, assertions, Page Objects, fixtures, CI) sont couverts en detail dans le **Testing Course** (modules 10-11).
> Ce module se concentre uniquement sur les **specificites Vue/Nuxt** pour le E2E.
>
> → [Testing Course — Playwright fondamentaux et avance](https://github.com/smaurier/testing-course)

---

## Objectifs

- Configurer Playwright pour un projet Nuxt 3
- Tester les pages SSR et les transitions de route
- Gérer l'hydration dans les tests E2E

---

## Configuration Nuxt + Playwright

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npx nuxt dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:3000',
  },
});
```

---

## Tester le SSR et l'hydration

```typescript
// e2e/ssr.spec.ts
import { test, expect } from '@playwright/test';

test('page should be server-rendered', async ({ page }) => {
  // Intercepter la reponse HTML initiale
  const response = await page.goto('/products');
  const html = await response?.text();

  // Verifier que le contenu est dans le HTML initial (SSR)
  expect(html).toContain('Liste des produits');

  // Verifier que l'hydration fonctionne (interactions JS)
  await page.getByRole('button', { name: 'Filtrer' }).click();
  await expect(page.getByText('Resultats filtres')).toBeVisible();
});
```

---

## Tester les transitions de route

```typescript
test('navigation should work with Vue Router', async ({ page }) => {
  await page.goto('/');

  // Navigation client-side (pas de rechargement complet)
  await page.getByRole('link', { name: 'Produits' }).click();
  await expect(page).toHaveURL('/products');

  // Verifier que le contenu change sans rechargement
  await expect(page.getByRole('heading', { name: 'Produits' })).toBeVisible();
});
```

---

## Tester useFetch / useAsyncData

```typescript
test('async data should load on page', async ({ page }) => {
  await page.goto('/products');

  // Attendre que les donnees async soient chargees
  await expect(page.getByTestId('product-list')).toBeVisible();
  await expect(page.getByTestId('product-item')).toHaveCount(10);
});
```

---

## Navigation

| Précédent | Suivant |
|-----------|---------|
| [05 — Tests d'intégration](./05-tests-integration.md) | [07 — MSW et mocking API](./07-msw-et-mocking-api.md) |
