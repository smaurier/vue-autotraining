# 06 — Tests E2E avec Playwright

## C'est quoi un test E2E ? 🤔

**E2E** signifie **End-to-End** (de bout en bout).

Imagine que tu as construit une voiture. Tu peux :

1. **Tester chaque pièce séparément** (le moteur tourne ? les freins fonctionnent ?) → c'est un **test unitaire**
2. **Tester que le moteur + la boîte de vitesses fonctionnent ensemble** → c'est un **test d'intégration**
3. **Monter dans la voiture, démarrer, conduire sur la route et vérifier que tout va bien** → c'est un **test E2E** !

Un test E2E, c'est comme embaucher quelqu'un pour **utiliser ton application exactement comme un vrai utilisateur** : ouvrir un navigateur, cliquer sur des boutons, taper du texte, et vérifier que tout s'affiche correctement.

### La pyramide des tests

```
        /  E2E  \           ← Peu de tests, lents, mais TRÈS fiables
       /         \             (on teste tout le parcours utilisateur)
      / Intégration \
     /               \      ← Nombre moyen, vitesse moyenne
    /   Unitaires      \       (on teste que les pièces marchent ensemble)
   /___________________  \
                         \  ← Beaucoup de tests, très rapides
                            (on teste une fonction isolée)
```

**En résumé** :

| Type de test   | Que teste-t-on ?                         | Vitesse   | Exemple                                        |
| -------------- | ---------------------------------------- | --------- | ---------------------------------------------- |
| **Unitaire**   | Une seule fonction ou un seul composant  | ⚡ Rapide | « La fonction `addition(2, 3)` retourne 5 »    |
| **Intégration**| Plusieurs parties qui travaillent ensemble| 🏃 Moyen  | « Le formulaire envoie bien les données au store » |
| **E2E**        | L'application ENTIÈRE du point de vue utilisateur | 🐢 Lent | « L'utilisateur se connecte, voit sa liste, clique sur un élément » |

---

## C'est quoi Playwright ? 🤖

**Playwright** est un outil créé par Microsoft. C'est comme un **robot qui contrôle un vrai navigateur** (Chrome, Firefox, Safari) à ta place.

Tu lui donnes des instructions en code :
- « Va à cette page »
- « Clique sur ce bouton »
- « Tape ce texte dans ce champ »
- « Vérifie que ce message apparaît »

Et il exécute tout ça automatiquement dans un vrai navigateur, exactement comme le ferait un humain !

### Pourquoi Playwright (et pas d'autres outils) ?

| Critère           | Cypress (ancien outil) | Playwright (moderne)    |
| ----------------- | ---------------------- | ----------------------- |
| Navigateurs       | Chrome + Firefox       | Chrome, Firefox, Safari |
| Tests en parallèle| Payant                 | Gratuit                 |
| Vitesse           | Moyen                  | Rapide                  |
| TypeScript        | Support partiel        | Support complet         |
| Créé par          | Cypress.io             | Microsoft               |

**En 2026, Playwright est le standard pour les nouveaux projets.**

---

## Rappel JavaScript — `async` / `await` ⏳

Avant de continuer, un rappel important. En JavaScript, certaines opérations prennent du temps (charger une page, cliquer...). On utilise `async`/`await` pour **attendre** que l'action soit terminée avant de passer à la suivante.

```ts
// Sans await : le code continue SANS attendre → problème !
page.goto('/');          // On n'attend pas que la page charge...
page.click('button');    // ...et on clique alors que rien n'est affiché !

// Avec await : le code ATTEND que chaque étape soit finie ✅
await page.goto('/');          // On attend que la page charge...
await page.click('button');    // ...PUIS on clique. Parfait !
```

Pense à `await` comme dire au robot : **« Attends d'avoir fini avant de passer à la suite »**.

---

## Installation de Playwright

### Étape 1 — Installer le package

```bash
# On installe Playwright comme dépendance de développement
# (on en a besoin seulement pour les tests, pas en production)
pnpm add -D @playwright/test

# On télécharge les navigateurs que Playwright va piloter
# (Chrome, Firefox, Safari seront installés sur ton ordinateur)
npx playwright install
```

### Étape 2 — Créer le fichier de configuration

```ts
// playwright.config.ts
// Ce fichier dit à Playwright COMMENT lancer les tests

// On importe les outils de configuration de Playwright
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // 📁 Où sont les fichiers de test ?
  // Playwright va chercher tous les fichiers .spec.ts dans le dossier "e2e"
  testDir: "./e2e",

  // 🚀 Lancer les tests en parallèle ?
  // Oui → plusieurs tests tournent en même temps = plus rapide
  fullyParallel: true,

  // 🚫 Interdire test.only en CI
  // (test.only permet de lancer UN seul test, pratique en dev
  //  mais dangereux en CI car on oublierait de tester le reste)
  forbidOnly: !!process.env.CI,

  // 🔄 En cas d'échec, combien de fois ré-essayer ?
  // En CI (serveur) : 2 fois. En local : jamais (0 fois)
  retries: process.env.CI ? 2 : 0,

  // 👷 Combien de "workers" (robots) en parallèle ?
  // En CI : 1 seul (pour éviter la surcharge). En local : autant que possible
  workers: process.env.CI ? 1 : undefined,

  // 📊 Quel format de rapport ? Ici un rapport HTML
  reporter: [["html", { open: "never" }]],

  // ⚙️ Options communes à tous les tests
  use: {
    // L'URL de base de ton application en développement
    baseURL: "http://localhost:5173",
    // Enregistrer une "trace" si un test échoue (pour débugger)
    trace: "on-first-retry",
    // Prendre une capture d'écran seulement si un test échoue
    screenshot: "only-on-failure",
  },

  // 🌐 Sur quels navigateurs tester ?
  projects: [
    // Tester sur Chrome (navigateur de bureau)
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Tester sur Firefox
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    // Tester sur Safari
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    // Tester sur un écran de téléphone (iPhone 14)
    { name: "mobile", use: { ...devices["iPhone 14"] } },
  ],

  // 🖥️ Démarrer automatiquement ton serveur de dev avant les tests
  webServer: {
    command: "pnpm dev",                     // La commande pour démarrer l'app
    url: "http://localhost:5173",            // L'URL à attendre
    reuseExistingServer: !process.env.CI,    // Réutiliser le serveur si déjà lancé
  },
});
```

---

## Mon premier test E2E

Voici un test très simple : on va vérifier que la page d'accueil s'affiche correctement.

```ts
// e2e/home.spec.ts
// Les fichiers de test se terminent toujours par .spec.ts

// On importe les outils de Playwright :
// - test : la fonction pour écrire un test
// - expect : la fonction pour vérifier des choses
import { test, expect } from "@playwright/test";

// On écrit un test avec une description claire
test("la page d'accueil s'affiche", async ({ page }) => {
  // "page" est le navigateur robotisé que Playwright nous prête

  // Étape 1 : Aller à la page d'accueil
  // "/" signifie la racine du site (ex: http://localhost:5173/)
  await page.goto("/");

  // Étape 2 : Vérifier que le titre de la page contient "Mon App"
  // C'est le <title> dans le HTML, ce qui s'affiche dans l'onglet du navigateur
  await expect(page).toHaveTitle(/Mon App/);

  // Étape 3 : Vérifier qu'un titre <h1> avec le texte "Accueil" est visible
  // getByRole("heading") cherche un élément <h1>, <h2>, etc.
  await expect(
    page.getByRole("heading", { name: "Accueil" })
  ).toBeVisible();
});
```

**Que se passe-t-il quand tu lances ce test ?**
1. Playwright ouvre un navigateur (en arrière-plan, tu ne le vois pas)
2. Il va à l'adresse `http://localhost:5173/`
3. Il vérifie le titre de la page
4. Il vérifie qu'un titre "Accueil" est visible
5. Si tout est OK → ✅ test réussi. Sinon → ❌ test échoué.

---

## Navigation — tester les liens entre pages

```ts
test("navigation entre les pages", async ({ page }) => {
  // Aller à la page d'accueil
  await page.goto("/");

  // Trouver le lien nommé "Produits" et cliquer dessus
  // getByRole("link") cherche une balise <a> (un lien cliquable)
  await page.getByRole("link", { name: "Produits" }).click();

  // Vérifier que l'URL a changé pour "/products"
  // (le navigateur s'est bien déplacé vers la bonne page)
  await expect(page).toHaveURL("/products");

  // Vérifier qu'un titre "Catalogue" est visible sur cette nouvelle page
  await expect(
    page.getByRole("heading", { name: "Catalogue" })
  ).toBeVisible();
});
```

---

## Formulaires — tester la saisie et la soumission

Un scénario très courant : remplir un formulaire et vérifier le résultat.

```ts
test("soumettre le formulaire de contact", async ({ page }) => {
  // Aller à la page de contact
  await page.goto("/contact");

  // Remplir le champ "Nom"
  // getByLabel("Nom") trouve le <input> associé au <label>Nom</label>
  await page.getByLabel("Nom").fill("Alice Dupont");

  // Remplir le champ "Email"
  await page.getByLabel("Email").fill("alice@example.com");

  // Remplir le champ "Message"
  await page.getByLabel("Message").fill("Bonjour, ceci est un test.");

  // Cliquer sur le bouton "Envoyer"
  // getByRole("button") cherche un <button>
  await page.getByRole("button", { name: "Envoyer" }).click();

  // Vérifier que le message de confirmation apparaît
  await expect(page.getByText("Message envoyé")).toBeVisible();
});
```

On peut aussi tester que la **validation** fonctionne (quand le formulaire est vide) :

```ts
test("validation du formulaire", async ({ page }) => {
  await page.goto("/contact");

  // On clique sur "Envoyer" SANS remplir aucun champ
  await page.getByRole("button", { name: "Envoyer" }).click();

  // On vérifie que les messages d'erreur apparaissent
  await expect(page.getByText("Nom requis")).toBeVisible();
  await expect(page.getByText("Email invalide")).toBeVisible();
});
```

---

## Authentification — tester la connexion

Le test de login est un classique des tests E2E :

```ts
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test("login flow complet", async ({ page }) => {
  // Aller à la page de connexion
  await page.goto("/login");

  // Taper l'email
  await page.getByLabel("Email").fill("admin@example.com");

  // Taper le mot de passe
  await page.getByLabel("Mot de passe").fill("password123");

  // Cliquer sur "Se connecter"
  await page.getByRole("button", { name: "Se connecter" }).click();

  // Vérifier qu'on est redirigé vers le dashboard (tableau de bord)
  await expect(page).toHaveURL("/dashboard");

  // Vérifier qu'un message de bienvenue apparaît
  await expect(page.getByText("Bienvenue")).toBeVisible();
});

test("accès protégé redirige vers login", async ({ page }) => {
  // Si on essaye d'aller directement au dashboard SANS être connecté...
  await page.goto("/dashboard");

  // ...on devrait être redirigé vers la page de connexion
  await expect(page).toHaveURL(/\/login/);
});
```

### Simuler un utilisateur déjà connecté (fixture)

Parfois, tu veux tester une page qui nécessite d'être connecté **sans refaire le login à chaque test**. On utilise un « fixture » — une sorte de préparation automatique :

```ts
// e2e/fixtures/auth.ts
import { test as base, expect } from "@playwright/test";

// On étend le test de base pour ajouter un état "déjà connecté"
export const test = base.extend<{ authenticatedPage: typeof base }>({
  // storageState simule le "localStorage" du navigateur
  // (là où l'app stocke le token de connexion)
  storageState: async ({}, use) => {
    const state = {
      cookies: [],              // Pas de cookies spéciaux
      origins: [
        {
          origin: "http://localhost:5173",
          localStorage: [
            // On met un faux token → l'app croit qu'on est connecté !
            { name: "auth_token", value: "fake-jwt-token" },
          ],
        },
      ],
    };
    await use(state as any);
  },
});
```

---

## Les sélecteurs — comment trouver les éléments sur la page 🔍

Un **sélecteur**, c'est la méthode utilisée par Playwright pour trouver un élément dans la page (un bouton, un lien, un champ de texte...).

C'est comme donner des indications pour trouver quelqu'un dans une foule :
- ❌ « La personne en 3ème position à gauche » → fragile, ça change si quelqu'un bouge !
- ✅ « La personne avec le badge "Alice" » → robuste, ça ne change pas !

### Les mauvais sélecteurs (fragiles) ❌

```ts
// ❌ Sélecteurs CSS — ils cassent si tu changes le design
page.locator(".btn-primary");             // Classe CSS → change souvent
page.locator("#submit-form");             // ID → pas toujours présent
page.locator("div > span:nth-child(3)"); // Position → très fragile
```

### Les bons sélecteurs (robustes) ✅

```ts
// ✅ Par rôle ARIA — le MEILLEUR choix
// On cherche par le RÔLE de l'élément (bouton, lien, titre...)
page.getByRole("button", { name: "Envoyer" }); // Un bouton nommé "Envoyer"
page.getByRole("link", { name: "Accueil" });   // Un lien nommé "Accueil"
page.getByRole("heading", { level: 1 });        // Un titre <h1>

// ✅ Par label de formulaire — excellent pour les inputs
page.getByLabel("Email");                      // Le champ avec le label "Email"
page.getByPlaceholder("Rechercher...");         // Le champ avec ce placeholder

// ✅ Par texte visible — simple et intuitif
page.getByText("Aucun résultat");              // N'importe quel élément avec ce texte

// ✅ Par data-testid — en dernier recours
// (un attribut qu'on ajoute exprès dans le HTML pour les tests)
page.getByTestId("product-card");              // <div data-testid="product-card">
```

### L'ordre de préférence

| Priorité | Méthode             | Pourquoi                                     |
| -------- | ------------------- | -------------------------------------------- |
| 1 🥇     | `getByRole`         | Basé sur l'accessibilité, très stable        |
| 2 🥈     | `getByLabel`        | Parfait pour les formulaires                 |
| 3 🥉     | `getByText`         | Simple, basé sur ce que l'utilisateur VOIT   |
| 4        | `getByTestId`       | Dernier recours, nécessite de modifier le HTML |

---

## Les vérifications (assertions)

Après avoir fait une action, on **vérifie** le résultat. Voici les vérifications les plus courantes :

```ts
// Vérifier qu'un texte est VISIBLE à l'écran
// (Playwright attend automatiquement qu'il apparaisse — c'est le "auto-wait")
await expect(page.getByText("Chargement terminé")).toBeVisible();

// Vérifier qu'un texte a DISPARU
await expect(page.getByText("Chargement...")).toBeHidden();

// Vérifier le NOMBRE d'éléments dans une liste
// Exemple : une liste de 5 produits
await expect(page.getByRole("listitem")).toHaveCount(5);

// Vérifier qu'un lien pointe vers la bonne URL
await expect(
  page.getByRole("link", { name: "Docs" })
).toHaveAttribute("href", "/docs");

// Vérifier le contenu d'un champ de formulaire
await expect(page.getByLabel("Email")).toHaveValue("alice@example.com");

// Comparer une capture d'écran (pour détecter des changements visuels)
await expect(page).toHaveScreenshot("homepage.png");
```

> **Auto-wait** : Playwright est intelligent. Quand tu écris `toBeVisible()`, il **attend automatiquement** (quelques secondes) que l'élément apparaisse. Pas besoin de faire des `setTimeout` ou `sleep` !

---

## Le pattern Page Object — organiser ses tests 📦

### Rappel JavaScript — les classes

Une **classe** c'est un « plan de construction ». Elle décrit un objet avec ses propriétés et actions :

```ts
// Une classe, c'est comme le plan d'une voiture
class Voiture {
  marque: string;       // propriété : la marque

  constructor(marque: string) {
    this.marque = marque; // On initialise la marque à la création
  }

  demarrer() {          // méthode : une action que la voiture peut faire
    console.log(`La ${this.marque} démarre !`);
  }
}

const maVoiture = new Voiture("Renault"); // On crée une voiture
maVoiture.demarrer();                      // "La Renault démarre !"
```

### Le problème sans Page Object

Imagine que ta page de login change (le label "Email" devient "Adresse email"). Tu aurais **des dizaines de tests à modifier** partout ! 😱

### La solution : une classe par page

On crée une **classe** qui **regroupe** tous les éléments et actions d'une page. Si la page change, on modifie **un seul endroit**.

```ts
// e2e/pages/LoginPage.ts
// Cette classe "décrit" la page de login et ses actions possibles

import type { Page, Locator } from "@playwright/test";
// Page = le navigateur robotisé
// Locator = un pointeur vers un élément de la page

export class LoginPage {
  // Les propriétés : les éléments de la page
  readonly page: Page;               // Le navigateur
  readonly emailInput: Locator;      // Le champ email
  readonly passwordInput: Locator;   // Le champ mot de passe
  readonly submitButton: Locator;    // Le bouton de connexion
  readonly errorMessage: Locator;    // Le message d'erreur (si login échoue)

  // Le constructeur : on configure tout quand on crée l'objet
  constructor(page: Page) {
    this.page = page;
    // On définit UNE SEULE FOIS comment trouver chaque élément
    this.emailInput = page.getByLabel("Email");
    this.passwordInput = page.getByLabel("Mot de passe");
    this.submitButton = page.getByRole("button", { name: "Se connecter" });
    this.errorMessage = page.getByRole("alert");
  }

  // Méthode : aller à la page de login
  async goto(): Promise<void> {
    await this.page.goto("/login");
  }

  // Méthode : se connecter avec email et mot de passe
  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);       // Taper l'email
    await this.passwordInput.fill(password); // Taper le mot de passe
    await this.submitButton.click();          // Cliquer sur "Se connecter"
  }
}
```

### Utiliser le Page Object dans les tests

Maintenant les tests sont **courts, lisibles et faciles à maintenir** :

```ts
// e2e/login.spec.ts
import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test("login réussi", async ({ page }) => {
  // On crée un objet LoginPage qui "connaît" la page de login
  const loginPage = new LoginPage(page);

  // Aller à la page de login
  await loginPage.goto();

  // Se connecter
  await loginPage.login("admin@example.com", "password123");

  // Vérifier qu'on arrive au dashboard
  await expect(page).toHaveURL("/dashboard");
});

test("login échoué", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  // Mauvais mot de passe → login échoue
  await loginPage.login("admin@example.com", "wrong");

  // Vérifier le message d'erreur
  await expect(loginPage.errorMessage).toContainText("Identifiants invalides");
});
```

> **Avantage** : si demain le label « Email » change en « Adresse email », tu modifies **une seule ligne** dans `LoginPage.ts`, et **tous les tests continuent de fonctionner** !

---

## Playwright dans le CI (intégration continue)

Le **CI** (Continuous Integration), c'est un serveur qui lance tes tests automatiquement à chaque fois que tu pousses du code sur GitHub. Voici comment configurer Playwright :

```yaml
# .github/workflows/ci.yml
# Ce fichier dit à GitHub : "Lance ces étapes automatiquement"

e2e:
  runs-on: ubuntu-latest     # Utiliser un serveur Linux
  steps:
    # Récupérer le code du projet
    - uses: actions/checkout@v4

    # Installer pnpm (le gestionnaire de packages)
    - uses: pnpm/action-setup@v4

    # Installer Node.js
    - uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: pnpm

    # Installer les dépendances du projet
    - run: pnpm install --frozen-lockfile

    # Installer les navigateurs pour Playwright
    - run: npx playwright install --with-deps

    # 🚀 Lancer les tests E2E !
    - name: Run E2E tests
      run: pnpm exec playwright test

    # 📊 Sauvegarder le rapport HTML (même si des tests échouent)
    - uses: actions/upload-artifact@v4
      if: ${{ !cancelled() }}
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 7       # Le rapport est disponible pendant 7 jours
```

---

## Quand écrire un test E2E ?

Tous les tests ne doivent pas être des tests E2E ! Voici un guide :

| Scénario                              | Type de test recommandé    |
| ------------------------------------- | -------------------------- |
| Fonction utilitaire pure              | Unitaire (Vitest)          |
| Rendu d'un composant isolé            | Composant (Vue Test Utils) |
| Interaction formulaire simple         | Composant ou intégration   |
| **Parcours utilisateur complet**      | **E2E (Playwright)** ✅    |
| **Login → Dashboard → Action**        | **E2E** ✅                  |
| **Navigation entre plusieurs pages**  | **E2E** ✅                  |
| Responsive / multi-navigateurs        | **E2E** ✅                  |

> 💡 **Conseil** : Écris des tests E2E pour les **3 à 5 parcours les plus importants** de ton app. Pas besoin de TOUT tester en E2E — c'est lent. Les tests unitaires couvrent le reste.

---

## Commandes utiles

```bash
# 🚀 Lancer tous les tests E2E
pnpm exec playwright test

# 🖥️ Mode UI : une interface visuelle pour voir tes tests
pnpm exec playwright test --ui

# 📄 Lancer un seul fichier de test
pnpm exec playwright test e2e/login.spec.ts

# 👀 Mode "headed" : tu VOIS le navigateur s'ouvrir et cliquer tout seul !
pnpm exec playwright test --headed

# 🎬 Mode enregistrement : Playwright enregistre tes clics
# et génère le code du test automatiquement !
pnpm exec playwright codegen http://localhost:5173

# 📊 Afficher le rapport HTML des résultats
pnpm exec playwright show-report
```

---

## Résumé

| Concept              | Ce qu'il faut retenir                                            |
| -------------------- | ---------------------------------------------------------------- |
| **Test E2E**         | Teste l'app comme un vrai utilisateur (navigateur, clics, saisie)|
| **Playwright**       | Un robot qui pilote de vrais navigateurs                         |
| **Sélecteurs**       | Utiliser `getByRole` en priorité (stable + accessible)           |
| **Auto-wait**        | Playwright attend automatiquement que les éléments apparaissent  |
| **Page Object**      | Une classe par page pour organiser et ne pas se répéter          |
| **CI**               | Les tests tournent automatiquement à chaque push sur GitHub      |

## Suite

→ `cours/03-avance/07-msw-et-mocking-api.md`
