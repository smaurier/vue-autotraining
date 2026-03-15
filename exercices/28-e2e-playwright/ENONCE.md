# Exercice 28 — Tests E2E Playwright + MSW

## Objectif

Écrire une suite de tests E2E complète avec **Playwright** pour une mini-app de gestion d'utilisateurs, en utilisant **MSW** (où `page.route()`) pour mocker l'API.

## Contexte ESN

En mission, les tests E2E sont la dernière barrière avant la mise en production. Tu vas tester un parcours utilisateur réaliste : **se connecter → consulter le dashboard → créer un utilisateur → vérifier la liste → se déconnecter**.

L'API sera entièrement mockée pour que les tests soient **rapides, déterministes et exécutables en CI** sans backend.

---

## Prérequis

- `cours/03-avance/06-tests-e2e-playwright.md`
- `cours/03-avance/07-msw-et-mocking-api.md`

## Stack

- Playwright
- MSW (handlers partagés) ou `page.route()` Playwright

---

## Partie 1 — Setup

1. Installer Playwright dans le projet :

   ```bash
   pnpm add -D @playwright/test
   npx playwright install
   ```

2. Créer un fichier `playwright.config.ts` :
   - Base URL : `http://localhost:5173`
   - Navigateurs : Chromium + Firefox
   - Screenshots on failure activés
   - Timeout global : 30 secondes

3. Créer le dossier `e2e/` avec le fichier `e2e/global-setup.ts` pour démarrer le dev server.

---

## Partie 2 — Helpers et mocks

4. Créer `e2e/mocks/api-data.ts` avec les données de test :
   - 3 utilisateurs (`Alice`, `Bob`, `Charlie`) avec id, name, email, role
   - 1 admin (`admin@test.com` / `password123`) pour le login

5. Créer un helper `e2e/helpers/mock-api.ts` qui expose des fonctions :
   ```ts
   async function mockGetUsers(page: Page, users: User[]): Promise<void>;
   async function mockPostUser(page: Page, response: User): Promise<void>;
   async function mockDeleteUser(page: Page, id: number): Promise<void>;
   async function mockLogin(page: Page, token: string): Promise<void>;
   async function mockLoginError(page: Page): Promise<void>;
   ```
   Chaque fonction utilise `page.route()` pour intercepter l'endpoint correspondant.

---

## Partie 3 — Tests E2E

### 3.1 — Tests d'authentification (`e2e/auth.spec.ts`)

6. Test « login avec identifiants valides » :
   - Mock `POST /api/auth/login` → `{ token: '...' }`
   - Remplir le formulaire email + mot de passe
   - Cliquer sur "Se connecter"
   - Vérifier la redirection vers `/dashboard`

7. Test « login avec identifiants invalides » :
   - Mock `POST /api/auth/login` → `401 Unauthorized`
   - Remplir et soumettre le formulaire
   - Vérifier le message d'erreur « Identifiants incorrects »

8. Test « redirection si non authentifié » :
   - Aller sur `/dashboard` sans token
   - Vérifier la redirection vers `/login`

### 3.2 — Tests du dashboard (`e2e/dashboard.spec.ts`)

9. Test « affiche la liste des utilisateurs » :
   - Mock `GET /api/users` → 3 utilisateurs
   - Naviguer vers `/dashboard`
   - Vérifier que les 3 noms apparaissent dans la page

10. Test « affiche un message si la liste est vide » :
    - Mock `GET /api/users` → `[]`
    - Vérifier le message « Aucun utilisateur »

11. Test « gère une erreur serveur » :
    - Mock `GET /api/users` → `500`
    - Vérifier le message d'erreur

### 3.3 — Tests CRUD (`e2e/crud.spec.ts`)

12. Test « créer un utilisateur » :
    - Mock `POST /api/users` → nouvel utilisateur créé
    - Cliquer sur "Ajouter un utilisateur"
    - Remplir le formulaire (nom, email, rôle)
    - Soumettre
    - Vérifier que le nouvel utilisateur apparaît dans la liste

13. Test « supprimer un utilisateur » :
    - Mock `DELETE /api/users/:id` → `204`
    - Cliquer sur le bouton supprimer d'un utilisateur
    - Confirmer la suppression dans la modale
    - Vérifier que l'utilisateur disparaît de la liste

14. Test « modifier un utilisateur » :
    - Mock `PUT /api/users/:id` → utilisateur mis à jour
    - Cliquer sur "Modifier" d'un utilisateur
    - Changer le nom
    - Soumettre
    - Vérifier le nom mis à jour dans la liste

### 3.4 — Test du parcours complet (`e2e/full-flow.spec.ts`)

15. Test « parcours complet utilisateur » :
    - Se connecter (mock login)
    - Vérifier le dashboard avec 3 utilisateurs
    - Créer un 4e utilisateur
    - Modifier le 4e utilisateur
    - Supprimer le 4e utilisateur
    - Se déconnecter
    - Vérifier la redirection vers `/login`

---

## Partie 4 — Qualité et CI

16. Ajouter des **Page Object Models** :
    - `e2e/pages/LoginPage.ts` — encapsule les interactions login
    - `e2e/pages/DashboardPage.ts` — encapsule la navigation et la liste
    - `e2e/pages/UserFormPage.ts` — encapsule le formulaire

17. Utiliser les **locators accessibles** partout :
    - `page.getByRole('button', { name: 'Se connecter' })`
    - `page.getByLabel('Email')`
    - `page.getByRole('heading', { name: 'Dashboard' })`
    - **Zéro** `page.locator('.css-class')` ou `page.locator('#id')`

18. Vérifier que les tests passent en mode CI :
    ```bash
    npx playwright test --reporter=html
    ```

---

## Bonus

- [ ] Ajouter un test de performance : la page dashboard doit se charger en moins de 2 secondes (avec `page.waitForLoadState('networkidle')` + timing)
- [ ] Tester le responsive : exécuter un test en viewport mobile (375×667)
- [ ] Ajouter un test de navigation clavier (Tab + Enter pour soumettre le formulaire)
- [ ] Simuler un réseau lent avec `page.route()` + `setTimeout` et vérifier l'affichage du loader

---

## Livrables

```
e2e/
  pages/
    LoginPage.ts
    DashboardPage.ts
    UserFormPage.ts
  mocks/
    api-data.ts
  helpers/
    mock-api.ts
  auth.spec.ts
  dashboard.spec.ts
  crud.spec.ts
  full-flow.spec.ts
playwright.config.ts
```

---

## Ce que tu apprends

| Compétence               | Pratiquée ici                     |
| ------------------------ | --------------------------------- |
| Configuration Playwright | Config multi-navigateurs + CI     |
| Tests E2E réalistes      | Login → CRUD → Logout complet     |
| API mocking (page.route) | Scénarios success + erreur + vide |
| Page Object Model        | Séparation logique / assertions   |
| Locators accessibles     | getByRole, getByLabel uniquement  |
| Gestion d'erreurs E2E    | Erreur 500, 401, réseau           |
