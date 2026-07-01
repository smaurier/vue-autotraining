# Lab 19 — Tests E2E (Playwright)

> **Outcome :** à la fin, tu sais écrire des tests Playwright qui pilotent un vrai navigateur, cibler les éléments par rôle accessible, et déboguer un test qui échoue avec la trace.
> **Vrai outil :** Playwright 1.x + Vite dev server (le navigateur Chromium réel se lance).
> **Feedback :** le coach valide en session — le navigateur s'ouvre pendant les tests, les actions sont visibles.

---

## Énoncé

Tu testes le **parcours invitation TribuZen** de bout en bout. Le composant `InvitationForm.vue` existe déjà dans le projet starter. Ton travail : écrire les tests E2E qui valident ce parcours avec Playwright.

**Parcours à couvrir :**

1. L'utilisateur arrive sur `/members`.
2. Il clique "Inviter un membre" → un formulaire apparaît.
3. Il saisit un email valide (`camille@tribuzen.app`) → le bouton "Envoyer l'invitation" s'active.
4. Il clique "Envoyer l'invitation" → le formulaire se ferme et le membre apparaît dans la liste.
5. Cas d'erreur : email invalide → le bouton reste désactivé, un message d'erreur est visible.

**Pas de gap-fill** — tu écris tout, du `playwright.config.ts` aux assertions.

---

## Projet starter

Structure du projet starter (un projet Vite + Vue 3 minimal) :

```
lab-19-starter/
  src/
    components/
      InvitationForm.vue     ← composant existant (ne pas modifier)
      MemberList.vue         ← composant existant (ne pas modifier)
    pages/
      MembersPage.vue        ← page avec bouton + liste
    App.vue
    router.ts
  e2e/                       ← vide — tu crées les specs ici
  playwright.config.ts       ← vide — tu configures ici
  package.json               ← @playwright/test déjà installé
  vite.config.ts
```

**InvitationForm.vue — comportement attendu :**

- Rendu dans un `<dialog>` avec `aria-label="Inviter un membre"`
- Un `<label>` "Adresse email" associé à l'`<input type="email">`
- Bouton "Envoyer l'invitation" désactivé si l'email est invalide
- Après soumission réussie (POST `/api/invitations`) : ferme le dialog, émet un événement `invited`
- MemberList écoute cet événement et ajoute le membre à la liste

**Données mock disponibles :** le starter inclut un mock MSW minimal qui répond 201 à `POST /api/invitations`. Tu n'as pas besoin de serveur réel.

---

## Étapes (en friction)

1. **Configurer `playwright.config.ts`** — `testDir`, `webServer` (démarre `pnpm dev` sur le port 5173), `baseURL`, `trace: 'on-first-retry'`, `retries: 0` (pas de retry en local).

2. **Créer `e2e/invitation.spec.ts`** — importer `test` et `expect` de `@playwright/test`.

3. **Écrire `test.beforeEach`** qui navigue sur `/members`.

4. **Test 1 — "ouvrir le formulaire"** : cliquer le bouton d'invitation, vérifier que le dialog apparaît avec `getByRole('dialog', ...)`, vérifier que l'input email est visible et vide.

5. **Test 2 — "email invalide bloque la soumission"** : ouvrir le dialog, saisir `pas-un-email`, vérifier que le bouton est désactivé et qu'une erreur est visible. Puis corriger l'email et vérifier que le bouton s'active.

6. **Test 3 — "parcours complet"** : ouvrir, saisir un email valide, soumettre, vérifier que le dialog se ferme et que le membre apparaît dans la liste.

7. **Lancer les tests en mode UI** avec `npx playwright test --ui` — observer le navigateur piloté en temps réel.

8. **Provoquer un échec** : commenter la ligne `await expect(dialog).toBeHidden()`, re-lancer. Ouvrir la trace générée dans `test-results/`. Observer le DOM snapshot à l'instant de l'échec.

---

## Corrigé complet commenté

### playwright.config.ts

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  // Tous les fichiers *.spec.ts dans e2e/ sont des tests
  testDir: './e2e',

  // Timeout global par test (30 s)
  timeout: 30_000,

  // Pas de retry en local (évite de masquer les flaky tests pendant le dev)
  retries: 0,

  use: {
    // Toutes les goto('/...') utilisent cette base
    baseURL: 'http://localhost:5173',

    // La trace n'est enregistrée qu'en cas d'échec (1er retry en CI)
    // En local avec retries: 0, ajouter trace: 'on' pour toujours tracer
    trace: 'on-first-retry',

    // Screenshot si le test échoue
    screenshot: 'only-on-failure',
  },

  // Un seul projet (Chromium) pour la rapidité du lab
  projects: [
    { name: 'chromium' },
  ],

  // Playwright démarre Vite avant les tests
  // reuseExistingServer: true en local — si pnpm dev tourne déjà, Playwright le réutilise
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
})
```

### e2e/invitation.spec.ts

```ts
import { test, expect } from '@playwright/test'

test.describe('Parcours invitation TribuZen', () => {

  // beforeEach : naviguer sur /members avant chaque test
  // Évite de répéter page.goto('/members') dans chaque test
  test.beforeEach(async ({ page }) => {
    await page.goto('/members')
  })

  // ─── Test 1 : ouverture du formulaire ────────────────────────────────────
  test('ouvrir le formulaire d\'invitation', async ({ page }) => {
    // Le bouton doit exister avec ce nom accessible exact
    // Si le bouton n'a pas de texte ou un aria-label différent → ce test détecte le bug
    const inviteButton = page.getByRole('button', { name: 'Inviter un membre' })
    await expect(inviteButton).toBeVisible()

    await inviteButton.click()

    // Le dialog s'ouvre — ciblé par son rôle ARIA et son label
    // InvitationForm.vue doit rendre : <dialog aria-label="Inviter un membre">
    const dialog = page.getByRole('dialog', { name: 'Inviter un membre' })
    await expect(dialog).toBeVisible()

    // L'input email est dans le dialog, associé au label "Adresse email"
    // Si le <label> n'est pas associé à l'<input> → getByLabel échoue → bug d'accessibilité
    const emailInput = dialog.getByLabel('Adresse email')
    await expect(emailInput).toBeVisible()
    await expect(emailInput).toHaveValue('')   // vide à l'ouverture
  })

  // ─── Test 2 : validation email ───────────────────────────────────────────
  test('email invalide bloque la soumission', async ({ page }) => {
    await page.getByRole('button', { name: 'Inviter un membre' }).click()

    const dialog = page.getByRole('dialog', { name: 'Inviter un membre' })
    const emailInput = dialog.getByLabel('Adresse email')
    const submitButton = dialog.getByRole('button', { name: "Envoyer l'invitation" })

    // Avant toute saisie, le bouton est désactivé
    await expect(submitButton).toBeDisabled()

    // Email invalide : bouton toujours désactivé, message d'erreur visible
    await emailInput.fill('pas-un-email')
    await expect(submitButton).toBeDisabled()

    // Le composant affiche une erreur — on cible par rôle 'alert' (aria-live="assertive")
    // Cela teste aussi que le composant communique l'erreur de façon accessible
    await expect(dialog.getByRole('alert')).toContainText('Email invalide')

    // Corriger l'email : bouton s'active, message d'erreur disparaît
    await emailInput.fill('camille@tribuzen.app')
    await expect(submitButton).toBeEnabled()
    await expect(dialog.getByRole('alert')).not.toBeVisible()
  })

  // ─── Test 3 : parcours complet ───────────────────────────────────────────
  test('envoyer une invitation et voir le membre apparaître', async ({ page }) => {
    // Intercepter la requête POST /api/invitations
    // On retourne une réponse 201 mockée — le test ne dépend pas d'un serveur réel
    await page.route('**/api/invitations', async route => {
      // Vérifier que le corps de la requête contient l'email correct
      const body = await route.request().postDataJSON()
      expect(body.email).toBe('camille@tribuzen.app')

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

    // Ouvrir le formulaire
    await page.getByRole('button', { name: 'Inviter un membre' }).click()
    const dialog = page.getByRole('dialog', { name: 'Inviter un membre' })

    // Saisir un email valide
    await dialog.getByLabel('Adresse email').fill('camille@tribuzen.app')

    // Soumettre
    await dialog.getByRole('button', { name: "Envoyer l'invitation" }).click()

    // Le dialog se ferme après succès — l'auto-wait attend la disparition
    await expect(dialog).toBeHidden()

    // Toast de confirmation — <div role="status"> ou <div aria-live="polite">
    // toBeVisible() attend que le toast apparaisse (animations incluses)
    await expect(page.getByRole('status')).toContainText('Invitation envoyée')

    // Le membre apparaît dans la liste avec le statut "En attente"
    // On cible la liste par rôle ARIA pour ne pas dépendre d'un sélecteur CSS
    const memberList = page.getByRole('list', { name: 'Membres' })
    await expect(memberList).toContainText('camille@tribuzen.app')
    await expect(memberList.getByText('En attente')).toBeVisible()
  })

})
```

**Pourquoi ce corrigé est correct :**

- Chaque test est **autonome** : `beforeEach` navigue sur `/members`, pas de dépendance entre tests.
- Les sélecteurs `getByRole` et `getByLabel` testent l'accessibilité en même temps que la fonctionnalité — si un label est mal associé ou qu'un bouton manque de nom accessible, le test échoue avec un message clair.
- `page.route()` intercepte la requête réseau : le test est rapide et reproductible sans serveur.
- Les assertions web-first (`await expect(...).toBeVisible()`) attendent automatiquement — aucun `waitForTimeout`.

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées :**

Reproduis `e2e/invitation.spec.ts` **de mémoire, en 30 minutes**, avec les modifications suivantes :

1. **Ajouter un test de navigation** : depuis la page d'accueil `/`, cliquer sur le lien "Membres" dans la nav, vérifier l'URL `/members` et que le titre de page est correct.
2. **Transformer le setup en fixture** : extraire le login (si la page `/members` est protégée) dans un fichier `e2e/fixtures.ts` avec `test.extend`, et l'utiliser dans les specs.
3. **Intercepter et vérifier le corps de la requête** : dans le test parcours complet, utiliser `route.request().postDataJSON()` pour asserter que l'email envoyé à l'API est bien `camille@tribuzen.app`.

**Sans ouvrir ce corrigé ni le module 19.**

**Critère de réussite :** `npx playwright test` passe en vert, la trace s'affiche correctement avec `npx playwright show-trace`.

---

## Application TribuZen

Dans `smaurier/tribuzen`, les tests E2E Playwright vivent ici :

```
tribuzen/
  e2e/
    invitation.spec.ts     ← ce lab (parcours invitation)
    auth.spec.ts           ← parcours login/logout (next step)
    fixtures.ts            ← fixture login partagée
  playwright.config.ts
```

**Différences par rapport au lab :**

- La route `/members` est protégée par un guard Vue Router — les tests d'invitation nécessiteront la fixture d'authentification.
- Les données membres viendront d'une vraie API NestJS (pas d'un mock interne) — `page.route()` servira à isoler les tests des données de prod.
- Le design system TribuZen utilise des composants Radix Vue pour les dialogs — les rôles ARIA (`dialog`, `alertdialog`) sont déjà exposés par Radix. `getByRole` fonctionne sans adaptation.

**Commit cible :**

```
test(e2e): parcours invitation — ouverture formulaire, validation email, membre dans liste
```
