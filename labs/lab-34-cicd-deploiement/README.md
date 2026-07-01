# Lab 34 — CI/CD déploiement

> **Outcome :** à la fin, tu sais configurer le déploiement SSR d'une app Nuxt sur Vercel avec preview par PR, gérer les secrets via `runtimeConfig`, écrire le workflow GitHub Actions complet, et simuler un rollback.
> **Vrai outil :** Nuxt 3 + Vercel CLI + GitHub Actions.
> **Feedback :** le coach valide en session — vérification de l'URL de preview générée par la PR et de l'absence de secrets dans le code.

---

## Énoncé

Tu reprends la base du front TribuZen : une app Nuxt 3 SSR qui expose un composable `useApi.ts` faisant des fetch vers `https://api.tribuzen.app`. Actuellement l'URL est hardcodée. Le `nuxt.config.ts` ne déclare ni `nitro.preset`, ni `runtimeConfig`.

**Cahier des charges :**

1. Configurer `nuxt.config.ts` avec le preset `vercel` et un `runtimeConfig` qui expose `apiBase` (public) et `jwtSecret` (privé).
2. Mettre à jour `composables/useApi.ts` pour lire `apiBase` depuis `runtimeConfig` au lieu de le hardcoder.
3. Écrire un workflow GitHub Actions `deploy-production.yml` qui déploie sur Vercel à chaque push sur `main`.
4. Écrire un workflow `deploy-preview.yml` qui génère une URL de preview à chaque PR vers `main`.
5. Lister les variables et secrets à configurer dans GitHub et dans Vercel.
6. Simuler un rollback : décrire les commandes exactes pour revenir à la version précédente sur Vercel.

**Pas de gap-fill** — tu produits tous les fichiers à partir du starter ci-dessous.

---

## Starter minimal

Structure de départ dans `smaurier/tribuzen` :

```
tribuzen/
  nuxt.config.ts           ← à compléter
  composables/
    useApi.ts              ← à refactorer (URL hardcodée)
  .github/
    workflows/             ← à créer (vide pour l'instant)
```

**`nuxt.config.ts` actuel (à corriger) :**

```ts
// nuxt.config.ts — AVANT (à ne pas garder tel quel)
export default defineNuxtConfig({
  // aucun nitro.preset → défaut node-server
  // aucun runtimeConfig → secrets absents
})
```

**`composables/useApi.ts` actuel (à refactorer) :**

```ts
// composables/useApi.ts — AVANT (URL hardcodée)
export function useApi() {
  const BASE = 'https://api.tribuzen.app'   // ❌ hardcodé

  async function get<T>(path: string): Promise<T> {
    const data = await $fetch<T>(`${BASE}${path}`)
    return data
  }

  return { get }
}
```

---

## Étapes (en friction)

1. **`nuxt.config.ts`** — Ajouter `nitro: { preset: 'vercel' }` et `runtimeConfig` avec `jwtSecret` (privé) et `public.apiBase` (public, valeur par défaut `'/api'`).

2. **`composables/useApi.ts`** — Remplacer la constante hardcodée par `useRuntimeConfig().public.apiBase`. Vérifier que `useRuntimeConfig()` est accessible dans un composable universel (client + serveur).

3. **`deploy-production.yml`** — Écrire le workflow déclenché sur `push: branches: [main]`. Jobs : checkout, setup pnpm + Node 20, install, puis les trois commandes Vercel CLI (`pull`, `build --prod`, `deploy --prebuilt --prod`). Injecter les secrets GitHub `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `NUXT_JWT_SECRET`, `NUXT_PUBLIC_API_BASE`.

4. **`deploy-preview.yml`** — Même structure mais déclenché sur `pull_request: branches: [main]`. Retirer le flag `--prod` des commandes Vercel CLI.

5. **Liste des secrets** — Dresser la liste complète : quels secrets vont dans GitHub Secrets, lesquels vont dans Vercel Environment Variables, et lesquels dans les deux.

6. **Rollback** — Écrire les deux commandes CLI permettant (a) de lister les déploiements récents et (b) de revenir au précédent. Décrire aussi l'équivalent dashboard.

---

## Corrigé complet commenté

### `nuxt.config.ts`

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    // Cible explicite : Vercel serverless + Edge Network
    // Sans ce preset, Nuxt utilise node-server par défaut
    // → incompatible avec le format d'output attendu par Vercel
    preset: 'vercel'
  },

  runtimeConfig: {
    // Clés PRIVÉES — accessibles uniquement côté serveur (server routes, middleware)
    // Valeur vide ici : surchargée au runtime par NUXT_JWT_SECRET
    jwtSecret: '',

    // Clés PUBLIQUES — accessibles côté client et serveur
    // Nuxt les inclut dans le payload envoyé au client lors de l'hydration
    public: {
      // NUXT_PUBLIC_API_BASE surcharge cette valeur en production
      // '/api' = valeur par défaut (dev local via server routes Nuxt)
      apiBase: '/api'
    }
  }
})
```

### `composables/useApi.ts`

```ts
// composables/useApi.ts
export function useApi() {
  // useRuntimeConfig() est disponible côté client ET serveur dans Nuxt 3
  // → pas besoin de guard process.server
  // En SSR : retourne les valeurs serveur (privées + publiques)
  // En CSR : retourne les valeurs publiques uniquement
  const config = useRuntimeConfig()

  // config.public.apiBase est garanti string (déclaré dans runtimeConfig.public)
  // En dev : '/api'
  // En prod : valeur de NUXT_PUBLIC_API_BASE (ex: 'https://api.tribuzen.app')
  const BASE = config.public.apiBase

  async function get<T>(path: string): Promise<T> {
    // $fetch est le fetch universel de Nuxt (ofetch sous le capot)
    // Fonctionne côté serveur ET client, gère les erreurs avec FetchError
    const data = await $fetch<T>(`${BASE}${path}`)
    return data
  }

  return { get }
}
```

### `.github/workflows/deploy-production.yml`

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      # Checkout complet du repo (fetch-depth: 0 pour avoir l'historique complet
      # si le build en a besoin — ex: génération de changelog)
      - uses: actions/checkout@v4

      # pnpm/action-setup installe pnpm en une ligne, version épinglée
      - uses: pnpm/action-setup@v3
        with:
          version: 9

      # cache: pnpm utilise pnpm store path pour mettre en cache node_modules
      # → évite de réinstaller à chaque run si pnpm-lock.yaml n'a pas changé
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        # --frozen-lockfile = erreur si pnpm-lock.yaml est désynchronisé
        # Empêche un install "silencieux" qui modifierait le lockfile en CI

      - name: Build and deploy to Vercel (production)
        env:
          # Secrets Vercel — générés via vercel link dans le projet local
          # puis ajoutés dans GitHub Settings → Secrets and variables → Actions
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
          # Secrets applicatifs — injectés dans l'env du build ET du runtime
          NUXT_JWT_SECRET: ${{ secrets.NUXT_JWT_SECRET }}
          NUXT_PUBLIC_API_BASE: ${{ secrets.NUXT_PUBLIC_API_BASE }}
        run: |
          # 1. Télécharge la config Vercel du projet (crée .vercel/project.json)
          # --environment=production : récupère les env vars production de Vercel
          pnpm dlx vercel pull --yes --environment=production --token=$VERCEL_TOKEN

          # 2. Build avec les bonnes env vars de production
          # --prod : active les optimisations production dans Vite/Nitro
          pnpm dlx vercel build --prod --token=$VERCEL_TOKEN

          # 3. Upload l'output vers Vercel et promeut en production
          # --prebuilt : dit à Vercel d'utiliser le build local (étape 2)
          # sans --prebuilt, Vercel relancerait pnpm build sur ses serveurs
          # --prod : promeut ce déploiement comme le déploiement de production actif
          pnpm dlx vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN
```

### `.github/workflows/deploy-preview.yml`

```yaml
# .github/workflows/deploy-preview.yml
name: Preview deployment

on:
  pull_request:
    branches: [main]

jobs:
  deploy-preview:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build and deploy preview to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
          # Secrets de staging — peuvent pointer vers un backend de staging
          NUXT_JWT_SECRET: ${{ secrets.NUXT_JWT_SECRET_STAGING }}
          NUXT_PUBLIC_API_BASE: ${{ secrets.NUXT_PUBLIC_API_BASE_STAGING }}
        run: |
          # --environment=preview : récupère les env vars preview de Vercel
          pnpm dlx vercel pull --yes --environment=preview --token=$VERCEL_TOKEN

          # Pas de --prod ici : build pour un environnement preview
          pnpm dlx vercel build --token=$VERCEL_TOKEN

          # Pas de --prod : déploie en preview, pas en production
          # Vercel retourne l'URL du preview dans stdout
          pnpm dlx vercel deploy --prebuilt --token=$VERCEL_TOKEN
```

### Liste des secrets à configurer

**Dans GitHub Settings → Secrets and variables → Actions :**

| Secret | Description |
|---|---|
| `VERCEL_TOKEN` | Token API Vercel (Vercel dashboard → Settings → Tokens) |
| `VERCEL_ORG_ID` | ID de l'organisation Vercel (`.vercel/project.json` après `vercel link`) |
| `VERCEL_PROJECT_ID` | ID du projet Vercel (`.vercel/project.json`) |
| `NUXT_JWT_SECRET` | Secret de signature des JWT (production) |
| `NUXT_PUBLIC_API_BASE` | URL du backend prod (`https://api.tribuzen.app`) |
| `NUXT_JWT_SECRET_STAGING` | Secret JWT staging (peut être différent ou identique) |
| `NUXT_PUBLIC_API_BASE_STAGING` | URL du backend staging (`https://api.staging.tribuzen.app`) |

**Dans Vercel Settings → Environment Variables :**

Les mêmes variables `NUXT_*` peuvent aussi être configurées directement dans Vercel (elles surchargent celles du workflow). Recommandation : n'en mettre qu'à un endroit pour éviter les conflits. Le workflow GitHub Actions est plus lisible et auditable.

### Rollback

```bash
# Étape 1 : lister les déploiements récents du projet
vercel ls tribuzen

# Sortie exemple :
# Age    URL                                             State
# 2h     tribuzen-abc123.vercel.app                      READY (Production)
# 1d     tribuzen-xyz789.vercel.app                      READY
# 3d     tribuzen-def456.vercel.app                      READY

# Étape 2 : rollback vers le déploiement précédent
vercel rollback tribuzen-xyz789.vercel.app
# → Vercel promeut tribuzen-xyz789 comme Production — instantané, pas de rebuild
```

**Via le dashboard Vercel :**

Deployments → cliquer sur le déploiement cible → bouton "Promote to Production".

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées :**

Reproduire le système de déploiement **de mémoire, en 30 minutes**, avec ces modifications :

1. Le workflow de production doit **poser un commentaire sur la PR** avec l'URL du déploiement de production (hint : `gh pr comment`).
2. Ajouter une **étape de smoke test** après le déploiement : un simple `curl -f https://tribuzen.app/api/health` qui fait échouer le workflow si le healthcheck ne répond pas 200.
3. **Sans ouvrir ce corrigé** ni le module 34.

**Critère de réussite :** les deux workflows passent en CI (ou sont syntaxiquement corrects et logiquement cohérents si tu n'as pas de projet Vercel connecté).

---

## Application TribuZen

Dans `smaurier/tribuzen`, les fichiers produits dans ce lab sont les fichiers de déploiement réels :

```
tribuzen/
  nuxt.config.ts                          ← runtimeConfig + preset vercel
  composables/
    useApi.ts                             ← apiBase depuis runtimeConfig
  .github/
    workflows/
      deploy-production.yml               ← push main → prod Vercel
      deploy-preview.yml                  ← PR → preview Vercel
```

**Différences par rapport au lab :**

- En production, `NUXT_JWT_SECRET` pointe vers un secret géré par un vault (ex: Doppler, Vercel Env Vars chiffrées) plutôt qu'un secret GitHub raw.
- Le smoke test post-déploiement appelle réellement `/api/health` qui vérifie la connexion PostgreSQL.
- Les previews sont revues par au moins un autre développeur avant merge — l'URL de preview est le lien de review standard dans les PR TribuZen.

**Commit cible :**

```
feat(deploy): config Vercel SSR + runtimeConfig + workflows preview et prod
```
