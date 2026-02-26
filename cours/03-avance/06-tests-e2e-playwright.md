# 06 — Tests E2E avec Playwright

## Pourquoi des tests E2E ?

La pyramide de tests :

```
        /  E2E  \        ← peu, lents, haute confiance
       / Intégration \
      /   Unitaires    \  ← beaucoup, rapides, confiance locale
```

Les tests unitaires vérifient des fonctions isolées. Les tests de composants vérifient le rendu.
Les tests **E2E** vérifient que **l'application entière fonctionne du point de vue de l'utilisateur** : navigation, formulaires, API, redirections.

## Pourquoi Playwright (et pas Cypress) ?

| Critère           | Cypress                | Playwright              |
| ----------------- | ---------------------- | ----------------------- |
| Multi-navigateurs | Chrome + Firefox       | Chrome, Firefox, Safari |
| Parallélisme      | Payant (Cypress Cloud) | Natif et gratuit        |
| Vitesse           | Moyen                  | Rapide                  |
| API               | Chaînée (jQuery-like)  | async/await natif       |
| TypeScript        | Support partiel        | First-class             |
| Maintenu par      | Cypress.io             | Microsoft               |
| Auto-wait         | Oui                    | Oui (meilleur)          |

**En 2026, Playwright est le standard pour les nouveaux projets.**

## Setup

```bash
pnpm add -D @playwright/test
npx playwright install
```

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [["html", { open: "never" }]],

  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile", use: { ...devices["iPhone 14"] } },
  ],

  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});
```

## Premier test

```ts
// e2e/home.spec.ts
import { test, expect } from "@playwright/test";

test("la page d'accueil s'affiche", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Mon App/);
  await expect(page.getByRole("heading", { name: "Accueil" })).toBeVisible();
});
```

## Navigation et routing

```ts
test("navigation entre les pages", async ({ page }) => {
  await page.goto("/");

  // Cliquer sur un lien
  await page.getByRole("link", { name: "Produits" }).click();

  // Vérifier l'URL
  await expect(page).toHaveURL("/products");

  // Vérifier le contenu
  await expect(page.getByRole("heading", { name: "Catalogue" })).toBeVisible();
});
```

## Formulaires

```ts
test("soumettre le formulaire de contact", async ({ page }) => {
  await page.goto("/contact");

  // Remplir les champs
  await page.getByLabel("Nom").fill("Alice Dupont");
  await page.getByLabel("Email").fill("alice@example.com");
  await page.getByLabel("Message").fill("Bonjour, ceci est un test.");

  // Soumettre
  await page.getByRole("button", { name: "Envoyer" }).click();

  // Vérifier le feedback
  await expect(page.getByText("Message envoyé")).toBeVisible();
});

test("validation du formulaire", async ({ page }) => {
  await page.goto("/contact");

  // Soumettre vide
  await page.getByRole("button", { name: "Envoyer" }).click();

  // Vérifier les erreurs
  await expect(page.getByText("Nom requis")).toBeVisible();
  await expect(page.getByText("Email invalide")).toBeVisible();
});
```

## Authentification

```ts
// e2e/fixtures/auth.ts
import { test as base, expect } from "@playwright/test";

// Fixture pour un utilisateur authentifié
export const test = base.extend<{ authenticatedPage: typeof base }>({
  storageState: async ({}, use) => {
    // Simuler un state authentifié
    const state = {
      cookies: [],
      origins: [
        {
          origin: "http://localhost:5173",
          localStorage: [{ name: "auth_token", value: "fake-jwt-token" }],
        },
      ],
    };
    await use(state as any);
  },
});
```

```ts
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test("login flow complet", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Mot de passe").fill("password123");
  await page.getByRole("button", { name: "Se connecter" }).click();

  // Redirigé vers le dashboard
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByText("Bienvenue")).toBeVisible();
});

test("accès protégé redirige vers login", async ({ page }) => {
  await page.goto("/dashboard");

  // Redirigé vers login
  await expect(page).toHaveURL(/\/login/);
});

test("logout", async ({ page }) => {
  // ... login d'abord ...
  await page.getByRole("button", { name: "Déconnexion" }).click();
  await expect(page).toHaveURL("/login");
});
```

## Locators — les bonnes pratiques

```ts
// ❌ Fragile : sélecteurs CSS/XPath
page.locator(".btn-primary");
page.locator("#submit-form");
page.locator("div > span:nth-child(3)");

// ✅ Robuste : rôles ARIA (accessibles + stables)
page.getByRole("button", { name: "Envoyer" });
page.getByRole("link", { name: "Accueil" });
page.getByRole("heading", { level: 1 });

// ✅ Labels de formulaire
page.getByLabel("Email");
page.getByPlaceholder("Rechercher...");

// ✅ Texte visible
page.getByText("Aucun résultat");

// ✅ Test ID en dernier recours
page.getByTestId("product-card");
```

**Règle** : privilégier `getByRole` > `getByLabel` > `getByText` > `getByTestId`.
C'est la même philosophie que Testing Library et ça encourage l'accessibilité.

## Assertions avancées

```ts
// Attendre qu'un élément apparaisse (auto-wait)
await expect(page.getByText("Chargement terminé")).toBeVisible();

// Vérifier qu'un élément a disparu
await expect(page.getByText("Chargement...")).toBeHidden();

// Compter des éléments
await expect(page.getByRole("listitem")).toHaveCount(5);

// Vérifier un attribut
await expect(page.getByRole("link", { name: "Docs" })).toHaveAttribute(
  "href",
  "/docs",
);

// Vérifier le contenu d'un input
await expect(page.getByLabel("Email")).toHaveValue("alice@example.com");

// Screenshot comparison (visual regression)
await expect(page).toHaveScreenshot("homepage.png");
```

## Page Object Model (POM)

Pour les gros projets, encapsuler les interactions dans des classes :

```ts
// e2e/pages/LoginPage.ts
import type { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel("Email");
    this.passwordInput = page.getByLabel("Mot de passe");
    this.submitButton = page.getByRole("button", { name: "Se connecter" });
    this.errorMessage = page.getByRole("alert");
  }

  async goto(): Promise<void> {
    await this.page.goto("/login");
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

```ts
// e2e/login.spec.ts
import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test("login réussi", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login("admin@example.com", "password123");

  await expect(page).toHaveURL("/dashboard");
});

test("login échoué", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login("admin@example.com", "wrong");

  await expect(loginPage.errorMessage).toContainText("Identifiants invalides");
});
```

## Playwright dans le CI

```yaml
# .github/workflows/ci.yml
e2e:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: pnpm

    - run: pnpm install --frozen-lockfile
    - run: npx playwright install --with-deps

    - name: Run E2E tests
      run: pnpm exec playwright test

    - uses: actions/upload-artifact@v4
      if: ${{ !cancelled() }}
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 7
```

## Quand écrire un test E2E ?

| Scénario                         | Type de test recommandé    |
| -------------------------------- | -------------------------- |
| Fonction utilitaire pure         | Unitaire (Vitest)          |
| Rendu d'un composant isolé       | Composant (Vue Test Utils) |
| Interaction formulaire simple    | Composant ou intégration   |
| **Parcours utilisateur complet** | **E2E (Playwright)**       |
| **Login → Dashboard → Action**   | **E2E**                    |
| **Navigation multi-pages**       | **E2E**                    |
| Responsive / multi-navigateurs   | **E2E**                    |

**Règle ESN** : couvrir les **3-5 parcours critiques** en E2E. Pas besoin de tout tester en E2E — c'est lent et fragile.

## Commandes utiles

```bash
# Lancer les tests
pnpm exec playwright test

# Mode UI (interactif, debug visuel)
pnpm exec playwright test --ui

# Un seul fichier
pnpm exec playwright test e2e/login.spec.ts

# Mode headed (voir le navigateur)
pnpm exec playwright test --headed

# Générer un test en enregistrant les actions
pnpm exec playwright codegen http://localhost:5173

# Voir le rapport HTML
pnpm exec playwright show-report
```

## Suite

→ `cours/03-avance/07-msw-et-mocking-api.md`
