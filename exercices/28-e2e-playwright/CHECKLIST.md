# Checklist — Exercice 28 : Tests E2E Playwright + MSW

## Setup

- [ ] Playwright installé (`@playwright/test`)
- [ ] `playwright.config.ts` avec base URL, 2 navigateurs, screenshots on failure
- [ ] Dossier `e2e/` structuré (pages, mocks, helpers, specs)

## Mocks & Helpers

- [ ] `e2e/mocks/api-data.ts` — données de test (3 users + 1 admin)
- [ ] `e2e/helpers/mock-api.ts` — fonctions `mockGetUsers`, `mockPostUser`, `mockDeleteUser`, `mockLogin`, `mockLoginError`
- [ ] Chaque mock utilise `page.route()` avec `route.fulfill()`

## Tests Auth (`auth.spec.ts`)

- [ ] Login valide → redirection `/dashboard`
- [ ] Login invalide → message d'erreur « Identifiants incorrects »
- [ ] Accès `/dashboard` sans auth → redirection `/login`

## Tests Dashboard (`dashboard.spec.ts`)

- [ ] Affiche 3 utilisateurs mockés
- [ ] Affiche « Aucun utilisateur » si liste vide
- [ ] Affiche un message d'erreur si API retourne 500

## Tests CRUD (`crud.spec.ts`)

- [ ] Créer un utilisateur → apparaît dans la liste
- [ ] Supprimer un utilisateur → disparaît de la liste (modale de confirmation)
- [ ] Modifier un utilisateur → nom mis à jour

## Parcours complet (`full-flow.spec.ts`)

- [ ] Login → dashboard → créer → modifier → supprimer → logout → redirect /login
- [ ] Le test enchaîne les étapes sans interruption

## Page Object Models

- [ ] `LoginPage.ts` — `goto()`, `login(email, password)`, `getErrorMessage()`
- [ ] `DashboardPage.ts` — `getUserNames()`, `clickAddUser()`, `deleteUser(name)`
- [ ] `UserFormPage.ts` — `fillForm(data)`, `submit()`

## Locators accessibles

- [ ] Utilisation exclusive de `getByRole`, `getByLabel`, `getByText`, `getByPlaceholder`
- [ ] Zéro sélecteur CSS (`.class`) ou ID (`#id`)

## CI

- [ ] Tests passent avec `npx playwright test`
- [ ] Reporter HTML configuré

## Bonus

- [ ] Test performance : dashboard chargé en < 2s
- [ ] Test responsive : viewport mobile (375×667)
- [ ] Test navigation clavier (Tab + Enter)
- [ ] Test réseau lent : loader visible pendant le chargement
