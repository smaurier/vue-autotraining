---
titre: Tests E2E (Playwright)
cours: 02-vue
notions: [configuration Playwright, locators et rôles accessibles, actions et assertions web-first, auto-waiting, sélecteurs getByRole getByLabel, isolation et fixtures, capture trace et debug, intégration CI]
outcomes:
  - sait écrire un test E2E qui pilote un vrai navigateur avec Playwright
  - sait cibler les éléments par rôle accessible (getByRole, getByLabel)
  - sait utiliser les assertions web-first et l'auto-waiting (pas de sleep)
  - sait déboguer un test avec la trace et l'intégrer en CI
prerequis: [18-tests-integration]
next: 20-msw-et-mocking-api
libs: [{ name: vue, version: "3.5" }, { name: "@playwright/test", version: "1" }]
tribuzen: parcours TribuZen — test E2E du parcours invitation (ouvrir le formulaire, saisir un email, valider, voir le membre apparaître)
last-reviewed: 2026-07
---

# Tests E2E (Playwright)

> **Outcomes — tu sauras FAIRE :** écrire un test qui pilote un vrai navigateur de bout en bout, cibler les éléments par rôle accessible avec `getByRole`/`getByLabel`, utiliser les assertions web-first sans `sleep`, et déboguer avec la trace Playwright.
> **Difficulté :** :star::star::star::star:
>
> **Portée :** ce module couvre les tests E2E (End-to-End) dans un projet Vue 3 avec Playwright. Les tests unitaires (Vitest) et d'intégration (Vue Test Utils) sont vus au **module 18**. Le mocking réseau (MSW) est le sujet du **module 20**.

---

## 1. Cas concret d'abord

TribuZen vient d'implémenter le **parcours invitation**. Un membre peut inviter quelqu'un par email : il ouvre la page Membres, saisit l'email de la personne, clique "Envoyer l'invitation", et le nouveau membre apparaît dans la liste.

Un collègue a cassé ce flux en refactorisant le composant `InvitationForm.vue`. Les tests unitaires passent toujours (la logique interne est correcte), mais le formulaire ne se soumet plus dans le navigateur. Les tests unitaires ne voient pas ça — ils ne pilotent pas de navigateur réel.

Tu dois écrire un test E2E qui joue ce parcours de bout en bout :

```ts
// e2e/invitation.spec.ts — ce qu'on veut écrire
import { test, expect } from '@playwright/test'

test('parcours invitation — ouvrir, saisir, valider, voir le membre', async ({ page }) => {
  await page.goto('/members')

  await page.getByRole('button', { name: 'Inviter un membre' }).click()

  await page.getByLabel('Adresse email').fill('camille@tribuzen.app')

  await page.getByRole('button', { name: "Envoyer l'invitation" }).click()

  await expect(page.getByText('camille@tribuzen.app')).toBeVisible()
})
```

Cinq lignes. Aucun `sleep`. Aucun sélecteur CSS fragile. C'est le style Playwright moderne — ce module explique pourquoi chaque choix est le bon.

---

## 2. Théorie complète, concise

### 2.1 Installation et configuration

```bash
# Installer Playwright dans un projet Vue/Vite existant
pnpm add -D @playwright/test
# Installer les navigateurs (Chromium, Firefox, WebKit)
npx playwright install
```

Le fichier de configuration central est `playwright.config.ts` à la racine du projet :

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // Dossier contenant les specs E2E (séparé des tests unitaires)
  testDir: './e2e',

  // Timeout global par test (ms)
  timeout: 30_000,

  // Relancer automatiquement une fois en CI si échec flaky
  retries: process.env.CI ? 1 : 0,

  // Nombre de workers parallèles
  workers: process.env.CI ? 1 : undefined,

  // Options communes à tous les tests
  use: {
    // URL de base : page.goto('/members') → http://localhost:5173/members
    baseURL: 'http://localhost:5173',

    // Trace : enregistrée uniquement au 1er retry (parfait pour CI)
    trace: 'on-first-retry',

    // Screenshot à chaque échec
    screenshot: 'only-on-failure',
  },

  // Projets = navigateurs cibles
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
  ],

  // Démarrer le serveur de dev automatiquement avant les tests
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

`webServer` est clé : Playwright démarre Vite, attend que le port soit prêt, puis lance les tests. En CI, on force le démarrage propre (`reuseExistingServer: false`).

### 2.2 Anatomie d'un test Playwright

```ts
import { test, expect } from '@playwright/test'

// test() prend : description + async callback ({ page })
test('description du scénario', async ({ page }) => {
  // page = l'objet qui pilote le navigateur (une fixture injectée)

  // 1. Naviguer
  await page.goto('/members')

  // 2. Interagir
  await page.getByRole('button', { name: 'Inviter' }).click()

  // 3. Asserter
  await expect(page.getByText('Invitation envoyée')).toBeVisible()
})
```

Tout est `async/await`. Playwright n'est pas synchrone — chaque action est une promesse qui attend que le navigateur réel réponde.

### 2.3 Locators — cibler les éléments

Un **locator** décrit un élément dans la page. Playwright en propose plusieurs familles ; l'ordre de préférence recommandé (du plus robuste au plus fragile) :

| Locator | Usage | Robustesse |
|---|---|---|
| `page.getByRole(role, { name })` | Élément par rôle ARIA + nom accessible | Très haute |
| `page.getByLabel(text)` | `<input>` par son `<label>` associé | Très haute |
| `page.getByPlaceholder(text)` | Input par son placeholder | Haute |
| `page.getByText(text)` | Élément contenant ce texte | Haute |
| `page.getByTestId(id)` | Élément avec `data-testid="..."` | Moyenne |
| `page.locator('css selector')` | Sélecteur CSS arbitraire | Faible |
| `page.locator('xpath')` | Expression XPath | Très faible |

**La règle d'or :** préférer `getByRole` et `getByLabel` partout où c'est possible.

#### 2.3.1 `getByRole` — accessibilité-first

`getByRole` cible un élément via son **rôle ARIA** (le même attribut utilisé par les lecteurs d'écran). C'est le sélecteur le plus stable car il survive aux refactorisations CSS et de structure DOM.

```ts
// Boutons
page.getByRole('button', { name: 'Envoyer' })           // <button>Envoyer</button>
page.getByRole('button', { name: /envoyer/i })           // regex, insensible à la casse

// Liens
page.getByRole('link', { name: 'Voir les membres' })

// Titres
page.getByRole('heading', { name: 'Liste des membres' })
page.getByRole('heading', { level: 2 })                  // <h2> spécifique

// Inputs (text, email, password…)
page.getByRole('textbox', { name: 'Email' })             // si le label est "Email"

// Checkboxes et radios
page.getByRole('checkbox', { name: 'Se souvenir de moi' })
page.getByRole('radio', { name: 'Admin' })

// Listes
page.getByRole('list')
page.getByRole('listitem')

// Dialog (modal)
page.getByRole('dialog', { name: 'Inviter un membre' })
```

> **Atout profil RGAA :** maîtriser `getByRole` = maîtriser les rôles ARIA de la WAI-ARIA spec. Quand tu écris un test avec `getByRole('button', { name: 'Envoyer' })`, tu vérifies implicitement que le bouton est **accessible aux lecteurs d'écran** — son nom accessible existe et est correctement calculé. Un bouton sans texte ni `aria-label` ferait échouer ce sélecteur. Les tests E2E par rôle sont un filet de sécurité accessibilité gratuit. Pour un profil RGAA, c'est un argument d'entretien fort.

#### 2.3.2 `getByLabel` — formulaires

`getByLabel` cible un `<input>` (ou `<select>`, `<textarea>`) via le texte de son `<label>` associé. L'association peut se faire par `for`/`id`, `aria-label`, `aria-labelledby`, ou imbrication.

```ts
// <label for="email">Adresse email</label><input id="email" type="email">
page.getByLabel('Adresse email')

// <label><input type="checkbox"> Rôle admin</label>
page.getByLabel('Rôle admin')

// aria-label direct sur l'input
// <input aria-label="Rechercher un membre" type="search">
page.getByLabel('Rechercher un membre')
```

> **Piège :** si le `<label>` n'est pas correctement associé à l'`<input>` (pas de `for`/`id`, pas d'imbrication, pas d'`aria-label`), `getByLabel` échoue. C'est un bug d'accessibilité que le test révèle — corriger le HTML, pas le test.

### 2.4 Actions

Les actions sont des méthodes asynchrones sur un locator (ou directement sur `page`) :

```ts
// Navigation
await page.goto('/members')                            // URL relative via baseURL
await page.goto('https://tribuzen.app/members')        // URL absolue

// Clic
await page.getByRole('button', { name: 'Inviter' }).click()

// Saisie dans un champ
await page.getByLabel('Email').fill('camille@tribuzen.app')   // remplace tout le contenu
await page.getByLabel('Email').pressSequentially('cam')       // simule frappe touche à touche

// Clavier
await page.getByLabel('Email').press('Tab')            // appui touche
await page.getByLabel('Email').press('Enter')

// Checkbox / radio
await page.getByRole('checkbox', { name: 'Admin' }).check()
await page.getByRole('checkbox', { name: 'Admin' }).uncheck()

// Select
await page.getByLabel('Rôle').selectOption('admin')
await page.getByLabel('Rôle').selectOption({ label: 'Administrateur' })

// Hover
await page.getByRole('button', { name: 'Options' }).hover()

// Upload de fichier
await page.getByLabel('Photo').setInputFiles('./avatar.png')
```

Toutes ces actions incluent l'**auto-waiting** — voir 2.6.

### 2.5 Assertions web-first

Les assertions Playwright sont **web-first** : elles attendent automatiquement que la condition soit vraie (avec un timeout configurable, 5 s par défaut). Pas besoin de `waitFor` manuel.

```ts
// Visibilité
await expect(locator).toBeVisible()
await expect(locator).toBeHidden()

// Texte
await expect(locator).toHaveText('Invitation envoyée')
await expect(locator).toHaveText(/invitation/i)             // regex
await expect(locator).toContainText('camille')              // sous-chaîne

// Valeur d'un input
await expect(page.getByLabel('Email')).toHaveValue('camille@tribuzen.app')

// URL courante
await expect(page).toHaveURL('/members')
await expect(page).toHaveURL(/\/members/)

// Titre de la page
await expect(page).toHaveTitle('TribuZen — Membres')

// Count
await expect(page.getByRole('listitem')).toHaveCount(3)

// État d'un élément interactif
await expect(page.getByRole('button', { name: 'Envoyer' })).toBeEnabled()
await expect(page.getByRole('button', { name: 'Envoyer' })).toBeDisabled()
await expect(page.getByRole('checkbox', { name: 'Admin' })).toBeChecked()

// Attribut
await expect(locator).toHaveAttribute('aria-expanded', 'true')

// Négation — ajouter .not
await expect(locator).not.toBeVisible()
await expect(page.getByText('Erreur')).not.toBeVisible()
```

**Règle :** toujours `await expect(locator).toBeVisible()`, jamais `expect(await locator.isVisible()).toBe(true)`. La forme sans await perd le retry automatique.

### 2.6 Auto-waiting — pourquoi jamais de `sleep`

Playwright attend **automatiquement** qu'un élément soit prêt avant chaque action. Pour `click()`, il vérifie que l'élément est : attaché au DOM, visible, stable (pas en animation), pas bloqué par un overlay, activé.

```ts
// ❌ Attendre un délai fixe — fragile, lent, ne garantit rien
await page.waitForTimeout(2000)
await page.getByRole('button', { name: 'Envoyer' }).click()

// ✅ Playwright attend automatiquement — click() ne s'exécute que quand le bouton est prêt
await page.getByRole('button', { name: 'Envoyer' }).click()

// ✅ Pour attendre un état réseau spécifique
await page.waitForResponse(resp => resp.url().includes('/api/invitations') && resp.status() === 201)

// ✅ Pour attendre qu'un locator soit visible (si nécessaire explicitement)
await expect(locator).toBeVisible()    // assertion web-first = attend + vérifie
```

Le `waitForTimeout` est presque toujours un signe que le test est mal écrit. La vraie question : qu'est-ce qu'on attend ? Si on attend une réponse réseau, on intercepte la réponse. Si on attend un élément, on utilise une assertion web-first.

### 2.7 Isolation et fixtures

Chaque test reçoit un **contexte navigateur isolé** : pas de cookies, localStorage, ni session partagés entre les tests. C'est la fixture `page` qui garantit ça.

```ts
// Fixtures intégrées — toujours disponibles via le destructuring
test('...', async ({ page }) => { /* isolé */ })

// browser : instance partagée (un Chromium pour tous les tests du worker)
// context : profil isolé (cookies, localStorage vides) — créé par test
// page : onglet isolé dans le context

// Fixture personnalisée — pour authentifier avant certains tests
import { test as base } from '@playwright/test'

const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    // Setup : se connecter
    await page.goto('/login')
    await page.getByLabel('Email').fill('admin@tribuzen.app')
    await page.getByLabel('Mot de passe').fill('secret')
    await page.getByRole('button', { name: 'Se connecter' }).click()
    await expect(page).toHaveURL('/dashboard')

    // Passer la page authentifiée au test
    await use(page)

    // Teardown optionnel (cleanup après le test)
  },
})

// Utilisation
test('dashboard accessible après login', async ({ authenticatedPage }) => {
  await expect(authenticatedPage.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})
```

**`test.beforeEach` et `test.afterEach`** pour du setup partagé dans un fichier :

```ts
test.beforeEach(async ({ page }) => {
  // Exécuté avant chaque test du fichier
  await page.goto('/members')
})

test.afterEach(async ({ page }) => {
  // Rarement utile — l'isolation par context le fait automatiquement
})
```

### 2.8 Trace viewer — déboguer un test qui échoue

La trace est un enregistrement complet du test : screenshots, DOM snapshots, logs réseau, erreurs console. Elle s'ouvre en une commande.

**Activer la trace :**

```ts
// playwright.config.ts
use: {
  trace: 'on-first-retry',   // ← recommandé pour CI
  // 'on'                   // toujours (lourd, utile en dev local)
  // 'off'                  // désactivé
}
```

**Enregistrer manuellement dans un test :**

```ts
test('debug', async ({ page, context }) => {
  await context.tracing.start({ screenshots: true, snapshots: true })

  await page.goto('/members')
  // ... actions du test ...

  await context.tracing.stop({ path: 'trace.zip' })
})
```

**Ouvrir la trace après échec :**

```bash
# Playwright génère test-results/*/trace.zip automatiquement si trace est activée
npx playwright show-trace test-results/invitation-spec/trace.zip
```

Le Trace Viewer s'ouvre dans le navigateur : on navigue dans la timeline, on voit exactement quel DOM existait à chaque instant, quelles requêtes réseau ont eu lieu, et le screenshot à l'instant de l'échec.

**Mode UI — encore plus rapide en dev local :**

```bash
npx playwright test --ui
```

Interface graphique : relance des tests individuels, mode "watch", accès direct à la trace.

### 2.9 Intégration CI (GitHub Actions)

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test

      # Uploader la trace si les tests échouent
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

Points clés CI :
- `--with-deps` installe aussi les dépendances système des navigateurs (indispensable sur ubuntu)
- `retries: 1` dans la config absorbe les tests flaky sans bloquer la CI
- `trace: 'on-first-retry'` + upload d'artefact = trace disponible dans GitHub Actions si échec

---

## 3. Worked examples

### Exemple 1 — Parcours invitation TribuZen complet

Le parcours : l'utilisateur est sur la page Membres, ouvre le formulaire d'invitation, saisit un email, valide, voit le membre dans la liste.

```ts
// e2e/invitation.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Parcours invitation TribuZen', () => {

  test.beforeEach(async ({ page }) => {
    // Point de départ commun à tous les tests du describe
    await page.goto('/members')
  })

  test('ouvrir le formulaire d\'invitation', async ({ page }) => {
    // Le bouton d'ouverture doit exister et être visible
    const inviteButton = page.getByRole('button', { name: 'Inviter un membre' })
    await expect(inviteButton).toBeVisible()

    await inviteButton.click()

    // Le formulaire apparaît — on cible le dialog par rôle ARIA
    const dialog = page.getByRole('dialog', { name: 'Inviter un membre' })
    await expect(dialog).toBeVisible()

    // Le champ email dans le dialog est visible et vide
    const emailInput = dialog.getByLabel('Adresse email')
    await expect(emailInput).toBeVisible()
    await expect(emailInput).toHaveValue('')
  })

  test('envoyer une invitation et voir le membre apparaître', async ({ page }) => {
    // Ouvrir le formulaire
    await page.getByRole('button', { name: 'Inviter un membre' }).click()

    const dialog = page.getByRole('dialog', { name: 'Inviter un membre' })

    // Saisir l'email
    await dialog.getByLabel('Adresse email').fill('camille@tribuzen.app')

    // Intercepter la requête API pour ne pas dépendre d'un serveur réel
    // (si on veut tester la couche réseau aussi, supprimer ce bloc)
    await page.route('**/api/invitations', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'inv-001',
          email: 'camille@tribuzen.app',
          status: 'pending',
        }),
      })
    })

    // Soumettre
    await dialog.getByRole('button', { name: "Envoyer l'invitation" }).click()

    // Le dialog se ferme après succès
    await expect(dialog).toBeHidden()

    // Le toast de confirmation apparaît
    await expect(page.getByRole('status')).toContainText('Invitation envoyée')

    // Le membre apparaît dans la liste (avec le statut "En attente")
    const memberList = page.getByRole('list', { name: 'Membres' })
    await expect(memberList).toContainText('camille@tribuzen.app')
    await expect(memberList.getByText('En attente')).toBeVisible()
  })

  test('valider la règle email invalide', async ({ page }) => {
    await page.getByRole('button', { name: 'Inviter un membre' }).click()

    const dialog = page.getByRole('dialog', { name: 'Inviter un membre' })
    const emailInput = dialog.getByLabel('Adresse email')
    const submitButton = dialog.getByRole('button', { name: "Envoyer l'invitation" })

    // Le bouton Envoyer est désactivé tant que l'email est invalide
    await expect(submitButton).toBeDisabled()

    // Saisir un email invalide
    await emailInput.fill('pas-un-email')
    await expect(submitButton).toBeDisabled()
    await expect(dialog.getByRole('alert')).toContainText('Email invalide')

    // Corriger l'email
    await emailInput.fill('camille@tribuzen.app')
    await expect(submitButton).toBeEnabled()
    await expect(dialog.getByRole('alert')).not.toBeVisible()
  })

})
```

**Ce que ce test vérifie de bout en bout :**
- Le parcours navigateur réel (Chromium par défaut)
- L'ouverture du dialog (Vue Teleport ou composant Modal)
- L'association label/input (si `getByLabel` échoue → bug d'accessibilité dans le HTML)
- La requête réseau (interceptée ici pour la rapidité — en vrai, on peut laisser passer)
- La mise à jour de la liste après succès

### Exemple 2 — Fixture d'authentification réutilisable

En vrai produit, la plupart des tests nécessitent un utilisateur authentifié. Créer une fixture évite de répéter le login dans chaque test.

```ts
// e2e/fixtures.ts
import { test as base, expect, type Page } from '@playwright/test'

// On étend la fixture de base avec une page déjà authentifiée
export const test = base.extend<{ memberPage: Page }>({
  memberPage: async ({ page }, use) => {
    // Setup : se connecter avec un compte de test fixe
    await page.goto('/login')
    await page.getByLabel('Email').fill('test@tribuzen.app')
    await page.getByLabel('Mot de passe').fill('testpassword')
    await page.getByRole('button', { name: 'Se connecter' }).click()

    // Attendre la redirection post-login (URL ou élément distinctif)
    await expect(page).toHaveURL('/dashboard')

    // Passer la page au test qui utilise cette fixture
    await use(page)

    // Teardown : déconnexion (optionnel — le context est isolé de toute façon)
  },
})

// Réexporter expect pour ne pas avoir à l'importer de deux endroits
export { expect }
```

```ts
// e2e/invitation.spec.ts — version avec fixture
import { test, expect } from './fixtures'

test('invitation depuis un compte authentifié', async ({ memberPage }) => {
  // memberPage est déjà connectée — on va directement sur /members
  await memberPage.goto('/members')
  await memberPage.getByRole('button', { name: 'Inviter un membre' }).click()
  // ...
})
```

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Sélecteurs CSS ou XPath au lieu des rôles

```ts
// ❌ Sélecteur CSS — fragile : casse si la classe change, si le HTML se restructure
await page.locator('.invitation-form button.submit-btn').click()

// ❌ XPath — encore plus fragile, couplé à la structure DOM exacte
await page.locator('//div[@class="form"]/button[2]').click()

// ✅ Rôle ARIA + nom accessible — stable, documente l'intention, teste l'accessibilité
await page.getByRole('button', { name: "Envoyer l'invitation" }).click()
```

Les sélecteurs CSS et XPath cassent à chaque refactorisation de composant Vue. Les rôles ARIA ne cassent que si le comportement sémantique change — ce qui est exactement ce qu'on veut détecter.

**Signal d'alarme :** si tu ne peux pas écrire un test avec `getByRole`, c'est souvent que le composant manque d'accessibilité (bouton sans texte, input sans label). Corriger le composant plutôt que de contourner avec un sélecteur CSS.

### PIÈGE #2 — `waitForTimeout` au lieu de l'auto-wait

```ts
// ❌ Attente aveugle — lent (ralentit toujours, même si l'élément est déjà là),
//    fragile (peut encore être trop court sur une machine lente)
await page.waitForTimeout(3000)
await expect(page.getByText('Invitation envoyée')).toBeVisible()

// ✅ L'assertion attend automatiquement (jusqu'à timeout, 5 s par défaut)
await expect(page.getByText('Invitation envoyée')).toBeVisible()

// ✅ Si on veut attendre une requête réseau spécifique
const responsePromise = page.waitForResponse(
  resp => resp.url().includes('/api/invitations') && resp.status() === 201
)
await page.getByRole('button', { name: "Envoyer l'invitation" }).click()
await responsePromise   // attend la réponse API, puis continue
```

`waitForTimeout` est interdit par convention dans la plupart des équipes. Le lint Playwright propose `no-wait-for-timeout`. Si tu te retrouves à l'écrire, demande-toi : qu'est-ce qu'on attend réellement ? Translate ça en assertion ou en `waitForResponse`.

### PIÈGE #3 — Tests dépendants entre eux

```ts
// ❌ Test 2 dépend du state laissé par Test 1 — si Test 1 échoue, Test 2 échoue aussi
test('Test 1 : créer un membre', async ({ page }) => {
  // ... crée un membre dans la base de données
})

test('Test 2 : supprimer le membre créé au Test 1', async ({ page }) => {
  // ❌ Si Test 1 a été skippé ou a échoué, il n'y a rien à supprimer
  await page.getByRole('button', { name: 'Supprimer' }).click()
})
```

```ts
// ✅ Chaque test est autonome — il crée son propre contexte
test('supprimer un membre', async ({ page }) => {
  // Setup : créer le membre dans ce test même (ou via API directe)
  await page.request.post('/api/members', {
    data: { email: 'to-delete@tribuzen.app' }
  })

  await page.goto('/members')
  // ... le test peut maintenant supprimer sans dépendre d'un autre test
})
```

Playwright peut exécuter les tests en parallèle (workers). Des tests dépendants plantent de façon aléatoire selon l'ordre d'exécution. **Règle :** chaque test doit pouvoir s'exécuter seul, dans n'importe quel ordre.

---

## 5. Ancrage TribuZen

Dans TribuZen, les tests E2E Playwright couvrent les parcours critiques que les tests unitaires ne peuvent pas détecter :

**Parcours invitation** (ce module) — `e2e/invitation.spec.ts`
- Ouvrir le formulaire modal depuis la page Membres
- Saisir l'email, valider, voir le membre dans la liste
- Tester la validation email en temps réel (bouton désactivé)

**Parcours authentification** — `e2e/auth.spec.ts`
- Login avec identifiants valides → redirection `/dashboard`
- Login avec identifiants invalides → message d'erreur visible
- Accès à `/members` sans être connecté → redirection `/login`

**Parcours famille** — `e2e/family.spec.ts`
- Créer une famille, la renommer, l'archiver
- Ce parcours vérifie que le routeur Vue fonctionne entre les pages

**Connexion avec `getByRole` et RGAA :** chaque fois qu'un test cible un bouton par `getByRole('button', { name: ... })`, il vérifie que ce bouton a un nom accessible calculé. Un bouton icône sans `aria-label` ferait échouer le test — et serait une non-conformité RGAA (critère 11.9). Les tests E2E sont donc un outil de régression accessibilité.

Fichiers dans `smaurier/tribuzen` :

```
tribuzen/
  e2e/
    invitation.spec.ts     ← parcours invitation (ce module)
    auth.spec.ts           ← authentification
    family.spec.ts         ← gestion famille
    fixtures.ts            ← fixture login partagée
  playwright.config.ts     ← config racine
```

---

## 6. Points clés

1. Playwright pilote un vrai navigateur (Chromium, Firefox, WebKit) — pas un DOM simulé.
2. `playwright.config.ts` configure `testDir`, `webServer` (démarre Vite), `baseURL`, `retries`, `trace`.
3. `getByRole` et `getByLabel` sont les sélecteurs préférés — stables, sémantiques, et testent l'accessibilité.
4. `getByRole('button', { name: 'Envoyer' })` vérifie implicitement que le bouton a un nom accessible ARIA — atout RGAA direct.
5. Les assertions web-first (`expect(locator).toBeVisible()`) attendent automatiquement — jamais de `waitForTimeout`.
6. Chaque test reçoit un contexte navigateur isolé (cookies, localStorage vides) — pas de dépendances entre tests.
7. La trace (`trace: 'on-first-retry'`) enregistre timeline + DOM snapshots + réseau — s'ouvre avec `npx playwright show-trace`.
8. En CI : `retries: 1`, `workers: 1`, `trace: 'on-first-retry'`, upload de `playwright-report/` en artefact.

---

## 7. Seeds Anki

```
Pourquoi getByRole est-il préféré aux sélecteurs CSS dans Playwright ?|getByRole cible le rôle ARIA — stable face aux refactorisations CSS/DOM. Il vérifie aussi implicitement que l'élément a un nom accessible, ce qui détecte des bugs d'accessibilité RGAA.
Quelle est la différence entre expect(locator).toBeVisible() et expect(await locator.isVisible()).toBe(true) ?|La forme web-first toBeVisible() attend automatiquement que la condition soit vraie (retry interne jusqu'au timeout). La forme await isVisible() prend un snapshot immédiat sans retry — si l'élément n'est pas encore là, ça échoue.
Comment configurer Playwright pour démarrer Vite automatiquement avant les tests ?|Via webServer dans playwright.config.ts : { command: 'pnpm dev', url: 'http://localhost:5173', reuseExistingServer: !process.env.CI }. Playwright attend que le port réponde avant de lancer les specs.
Pourquoi waitForTimeout est-il banni dans les tests Playwright modernes ?|Il est aveugle (délai fixe indépendant de l'état réel) et fragile (trop court sur machine lente, toujours trop lent quand l'élément est déjà prêt). Remplacer par des assertions web-first ou waitForResponse/waitForURL.
Comment getByLabel cible-t-il un input ? Quand échoue-t-il ?|Il cherche l'input associé au texte du label (via for/id, imbrication, aria-label, aria-labelledby). Il échoue si l'association label/input est absente — ce qui signale un bug d'accessibilité à corriger dans le HTML.
Qu'est-ce qu'une fixture Playwright et pourquoi utiliser une fixture d'authentification ?|Une fixture est un objet injecté dans le callback de test (page, context, browser). Une fixture custom pour l'authentification exécute le login une fois par test et passe la page connectée — sans dupliquer le code de login dans chaque spec.
Comment activer la trace Playwright pour le débogage CI sans la rendre systématique ?|trace: 'on-first-retry' dans playwright.config.ts — la trace n'est enregistrée qu'au premier retry d'un test qui a échoué. Combiner avec upload-artifact dans GitHub Actions pour la récupérer.
```

---

## Pont vers le lab

> Lab associé : `02-vue/labs/lab-19-tests-e2e-playwright/README.md`. Tu écris les tests E2E du parcours invitation TribuZen avec Playwright réel — de la config à la trace, avec un corrigé commenté complet.

---

| Précédent | Suivant |
|-----------|---------|
| [18 — Tests d'intégration](./18-tests-integration.md) | [20 — MSW et mocking API](./20-msw-et-mocking-api.md) |
