---
titre: CI/CD — déploiement
cours: 02-vue
notions: [déploiement statique vs SSR, cibles Vercel Netlify et serveur Node Nitro, déploiement d'une app Nuxt, secrets et variables d'environnement, preview deployments par pull request, rollback, stratégies blue green et canary en survol]
outcomes:
  - sait déployer une SPA Vue et une app Nuxt SSR (cibles adaptées)
  - sait gérer secrets et variables d'environnement en déploiement
  - sait mettre en place des preview deployments par PR
  - sait faire un rollback et situer blue-green / canary
prerequis: [33-cicd-pipeline]
next: 35-cicd-monitoring
libs: [{ name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — déploiement de l'app Nuxt (build SSR sur cible Node, secrets runtimeConfig, preview par PR)
last-reviewed: 2026-07
---

← [33 — CI/CD pipeline](33-cicd-pipeline.md)

# CI/CD — déploiement

> **Outcomes — tu sauras FAIRE :** déployer une SPA Vue et une app Nuxt SSR sur la bonne cible, gérer secrets et variables d'environnement, mettre en place les preview deployments par PR, faire un rollback, situer blue-green et canary.
> **Difficulté :** :star::star::star:

---

## 1. Cas concret d'abord

Tu es en charge de mettre TribuZen en ligne. Le repo contient une app Nuxt 3 (SSR). Le CTO veut :

1. Chaque PR → une **URL de prévisualisation** accessible à toute l'équipe sans déployer en prod.
2. La branche `main` → déploiement automatique en **production**.
3. L'URL de l'API backend et le secret JWT **ne doivent jamais apparaître dans le code source**.
4. En cas de régression critique, **retour en arrière en < 2 min** sans pipeline.

Tu ouvres le repo et tu réalises que le `nuxt.config.ts` ne déclare aucun `nitro.preset`, qu'il n'y a pas de `runtimeConfig`, et que les secrets sont écrits en dur dans `useApi.ts`. Le pipeline CI ne fait que builder — il ne déploie rien.

Ce module te donne les outils pour corriger tout ça.

---

## 2. Théorie complète, concise

### 2.1 Déploiement statique vs SSR

**SPA Vue (déploiement statique)**

`pnpm build` produit un dossier `dist/` contenant des fichiers HTML, CSS et JS purs. Il n'y a **aucun processus Node.js** qui tourne en production : n'importe quel serveur capable de servir des fichiers statiques suffit (Nginx, un CDN, GitHub Pages, Vercel Edge Network, Netlify CDN).

- Le HTML initial est minimal — le navigateur exécute le JS pour tout construire (hydration côté client).
- SEO limité sans pre-rendering.
- Déploiement : copier `dist/` sur le CDN.

**App Nuxt SSR**

`pnpm build` produit `.output/` — un bundle complet comprenant un **serveur Node.js** (`server/index.mjs`) et les assets client. Le HTML est rendu **côté serveur** à chaque requête (ou au build, selon la stratégie).

- Le serveur Node doit rester **en fonctionnement** en production.
- SEO natif, temps de premier rendu plus rapide.
- Déploiement : copier `.output/` sur la cible et démarrer `node .output/server/index.mjs`.

| | SPA Vue | Nuxt SSR |
|---|---|---|
| Build output | `dist/` | `.output/` |
| Runtime requis | Aucun (fichiers statiques) | Node.js process actif |
| Serveur | CDN / fichiers statiques | Node.js (Nitro) |
| SEO | Limité | Natif |
| Variables d'env | `VITE_*` compilées dans le bundle | `NUXT_*` lues au runtime |

### 2.2 Cibles Vercel, Netlify et serveur Node via Nitro

Nuxt 3 utilise **Nitro** comme moteur de serveur universel. Nitro sait produire des bundles adaptés à chaque cible via des **presets**.

```ts
// nuxt.config.ts — choisir la cible de déploiement
export default defineNuxtConfig({
  nitro: {
    preset: 'node-server'  // ou 'vercel', 'netlify', 'cloudflare', etc.
  }
})
```

Presets courants :

| Preset | Cible | Output | Démarrage |
|---|---|---|---|
| `node-server` (défaut) | Serveur Node.js auto-hébergé | `.output/` | `node .output/server/index.mjs` |
| `vercel` | Vercel (Functions + Edge) | Format Vercel | Géré par la plateforme |
| `netlify` | Netlify (Functions) | Format Netlify | Géré par la plateforme |
| `static` | Sites purement statiques | `dist/` | Fichiers statiques uniquement |

> ⚠️ Les noms exacts des presets Nitro évoluent — vérifier la liste à jour via Context7 (nuxt/nuxt → "nitro presets").

**Vercel** : détecte Nuxt automatiquement quand le repo est connecté. Le preset `vercel` est recommandé pour un contrôle explicite. Vercel déploie sur son réseau Edge mondial.

**Netlify** : même principe — connecter le repo, Netlify détecte Nuxt et applique le bon build. Le preset `netlify` active les Netlify Functions pour le SSR.

**Serveur Node** (`node-server`) : cas auto-hébergé (VPS, VM, conteneur Docker). Tu gères toi-même le processus (PM2, systemd, Docker).

### 2.3 Déploiement d'une app Nuxt via Nitro

**Étapes build pour `node-server` :**

```bash
# 1. Installer les dépendances
pnpm install --frozen-lockfile

# 2. Builder pour la cible node-server
pnpm build
# → produit .output/ dans la racine du projet

# 3. Lancer le serveur (en production)
node .output/server/index.mjs
# → écoute sur le port défini par la variable PORT (défaut 3000)
```

Le dossier `.output/` contient tout ce qui est nécessaire — pas besoin du dossier `node_modules` en production.

**Pour Vercel :** le preset `vercel` découpe l'output en fonctions serverless. La commande de build reste `pnpm build` — Vercel s'occupe du déploiement après.

**Pour Docker + `node-server` :**

```dockerfile
# Étape 1 — build
FROM node:20-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Étape 2 — runtime (Node.js requis pour SSR)
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/.output ./
EXPOSE 3000
CMD ["node", "server/index.mjs"]
```

> **Différence avec Vue SPA :** l'étape 2 utilise `node:20-alpine` — pas `nginx:alpine`. Le SSR a besoin de Node.js en runtime pour rendre le HTML côté serveur.

### 2.4 Secrets et variables d'environnement

**SPA Vue — variables Vite (`VITE_*`)**

Les variables préfixées `VITE_` sont **compilées dans le bundle** au moment du build. Elles sont visibles dans les DevTools du navigateur — ne jamais y mettre de secrets.

```bash
# .env.production
VITE_API_BASE=https://api.tribuzen.app
```

```ts
// Dans le code Vue — accessible côté client
const apiBase = import.meta.env.VITE_API_BASE
```

**Nuxt — `runtimeConfig` (la bonne approche)**

Nuxt distingue explicitement les secrets serveur des valeurs publiques :

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // Clés privées — accessibles UNIQUEMENT côté serveur
    jwtSecret: '',        // surchargée par NUXT_JWT_SECRET
    dbUrl: '',            // surchargée par NUXT_DB_URL

    // Clés publiques — accessibles côté client ET serveur
    public: {
      apiBase: 'https://api.tribuzen.app',  // NUXT_PUBLIC_API_BASE
    }
  }
})
```

> **Convention de nommage des variables d'env :**
> - Clé privée `runtimeConfig.jwtSecret` → variable env `NUXT_JWT_SECRET`
> - Clé publique `runtimeConfig.public.apiBase` → variable env `NUXT_PUBLIC_API_BASE`
> Nuxt convertit automatiquement camelCase en SCREAMING_SNAKE_CASE avec le préfixe `NUXT_`.

**Accéder à `runtimeConfig` dans le code :**

```ts
// Dans un composable ou une server route — côté serveur
const config = useRuntimeConfig()
const secret = config.jwtSecret          // ✅ disponible serveur seulement
const base   = config.public.apiBase     // ✅ disponible partout

// Côté client (composant Vue / composable universel)
// config.jwtSecret === undefined  ← jamais exposé au client
// config.public.apiBase           ← disponible
```

**Configurer les secrets sur la plateforme :**

- **Vercel :** Settings → Environment Variables → ajouter `NUXT_JWT_SECRET`
- **Netlify :** Site settings → Environment variables → même chose
- **GitHub Actions :** Settings → Secrets and variables → Actions → ajouter le secret, puis l'injecter dans le workflow avec `${{ secrets.NUXT_JWT_SECRET }}`

Ne jamais committer de valeurs secrètes réelles dans `.env` ou `nuxt.config.ts`. Le fichier `.env` local doit être dans `.gitignore`.

### 2.5 Preview deployments par pull request

Un **preview deployment** est un déploiement automatique sur une URL temporaire à chaque ouverture ou mise à jour d'une PR.

**Sur Vercel ou Netlify (connecté au repo GitHub) :**

Aucune configuration requise — activé par défaut. Chaque PR reçoit une URL du type `https://tribuzen-pr-42.vercel.app`. L'URL est postée automatiquement en commentaire sur la PR.

**Via GitHub Actions + Vercel CLI :**

Pour un contrôle plus fin (ex: déployer seulement sur les PR vers `main`, injecter des secrets de staging) :

```yaml
# .github/workflows/preview.yml
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

      - run: pnpm install --frozen-lockfile

      - name: Deploy preview to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
        run: |
          pnpm dlx vercel pull --yes --environment=preview --token=$VERCEL_TOKEN
          pnpm dlx vercel build --token=$VERCEL_TOKEN
          pnpm dlx vercel deploy --prebuilt --token=$VERCEL_TOKEN
```

> ⚠️ La syntaxe exacte des commandes Vercel CLI évolue — vérifier via Context7 (vercel/vercel) avant de copier.

**Résultat :** chaque PR a sa propre URL de test, indépendante de la production.

### 2.6 Rollback

Un rollback est le retour à une version précédente du déploiement, sans re-builder.

**Vercel :**

```bash
# Liste les déploiements récents
vercel ls

# Rollback vers un déploiement précis (par son ID ou URL)
vercel rollback [deployment-url-or-id]
```

Ou via le dashboard Vercel : Deployments → choisir une version antérieure → "Promote to Production".

**Netlify :**

Via le dashboard : Site → Deploys → cliquer sur un ancien déploiement → "Publish deploy". Instantané — le CDN est mis à jour sans rebuild.

**Serveur Node (auto-hébergé) :**

Le rollback nécessite de conserver les builds précédents (ex: versioner les dossiers `.output/`) et de pointer le process manager (PM2) vers l'ancien dossier :

```bash
# Avec PM2 — pointer vers la version précédente
pm2 stop tribuzen
pm2 start /opt/tribuzen/releases/v1.2.3/.output/server/index.mjs --name tribuzen
```

La stratégie de rollback auto-hébergée requiert une organisation des releases (ex: Capistrano-style, ou un simple symlink `current/` → le bon dossier).

### 2.7 Stratégies blue-green et canary (survol)

Ces stratégies réduisent le risque en production lors d'une mise à jour.

**Blue-green**

Deux environnements de production identiques tournent en parallèle ("blue" = actuel, "green" = nouveau). La bascule est une redirection DNS ou de load balancer.

- ✅ Rollback instantané (pointer le trafic vers blue)
- ✅ Zero downtime
- ⚠️ Coût doublé pendant la phase de transition
- Vercel/Netlify font implicitement du blue-green via leurs slots de déploiement

```
[Traffic] → blue (v1.2)   →  [après validation]  →  [Traffic] → green (v1.3)
             green (v1.3) prêt                         blue (v1.2) en standby
```

**Canary**

Le trafic est dirigé progressivement vers la nouvelle version : 5% → 20% → 50% → 100%. En cas de problème détecté (erreurs, latence), on arrête avant d'aller plus loin.

```
[Traffic] →  95% → v1.2 (stable)
              5% → v1.3 (canary)
```

- ✅ Risque limité — problème détecté sur une faible fraction du trafic
- ⚠️ Les deux versions doivent cohabiter (migrations DB rétro-compatibles)
- Implémenté via des load balancers configurables (AWS ALB, Cloudflare) ou des plateformes comme Vercel avec split testing

> Pour TribuZen en phase beta, blue-green suffit — le canary devient pertinent à partir d'un trafic significatif ou de changements risqués en base de données.

---

## 3. Worked examples

### Exemple 1 — Déploiement Nuxt SSR sur Vercel via GitHub Actions (production)

Objectif : chaque push sur `main` déclenche un build Nuxt et un déploiement en production sur Vercel.

**nuxt.config.ts :**

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: 'vercel'
  },
  runtimeConfig: {
    jwtSecret: '',           // NUXT_JWT_SECRET
    public: {
      apiBase: ''            // NUXT_PUBLIC_API_BASE
    }
  }
})
```

**Secrets à configurer dans GitHub :**

- `VERCEL_TOKEN` — token généré dans Vercel dashboard → Settings → Tokens
- `VERCEL_ORG_ID` — visible dans `.vercel/project.json` après `vercel link`
- `VERCEL_PROJECT_ID` — idem

**Workflow de production :**

```yaml
# .github/workflows/deploy-production.yml
name: Deploy production

on:
  push:
    branches: [main]

jobs:
  deploy:
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

      - name: Build and deploy to Vercel (production)
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
          NUXT_JWT_SECRET: ${{ secrets.NUXT_JWT_SECRET }}
          NUXT_PUBLIC_API_BASE: ${{ secrets.NUXT_PUBLIC_API_BASE }}
        run: |
          pnpm dlx vercel pull --yes --environment=production --token=$VERCEL_TOKEN
          pnpm dlx vercel build --prod --token=$VERCEL_TOKEN
          pnpm dlx vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN
```

**Ce que ce workflow fait, étape par étape :**

1. `vercel pull` — télécharge la configuration du projet Vercel (infra, env vars déclarées côté Vercel).
2. `vercel build --prod` — lance `pnpm build` avec le bon preset et le flag production.
3. `vercel deploy --prebuilt --prod` — uploade l'output déjà buildé vers Vercel et le promeut en production.

Le `--prebuilt` est essentiel : sans lui, Vercel relancerait un build sur ses serveurs, ignorant le build qu'on vient de faire dans CI.

### Exemple 2 — Déploiement Nuxt SSR sur serveur Node auto-hébergé

Contexte : un VPS Linux avec Node.js 20 et PM2, accès SSH.

**nuxt.config.ts :**

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: 'node-server'
  },
  runtimeConfig: {
    jwtSecret: '',
    public: {
      apiBase: ''
    }
  }
})
```

**Workflow :**

```yaml
# .github/workflows/deploy-node.yml
name: Deploy to Node server

on:
  push:
    branches: [main]

jobs:
  deploy:
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

      - name: Install and build
        run: |
          pnpm install --frozen-lockfile
          pnpm build

      - name: Upload .output to server via rsync
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          SERVER_HOST: ${{ secrets.SERVER_HOST }}
        run: |
          mkdir -p ~/.ssh
          echo "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          rsync -az --delete .output/ deploy@$SERVER_HOST:/opt/tribuzen/current/

      - name: Restart server via SSH
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          SERVER_HOST: ${{ secrets.SERVER_HOST }}
        run: |
          ssh -i ~/.ssh/id_rsa deploy@$SERVER_HOST \
            "NUXT_JWT_SECRET='${{ secrets.NUXT_JWT_SECRET }}' \
             NUXT_PUBLIC_API_BASE='${{ secrets.NUXT_PUBLIC_API_BASE }}' \
             pm2 restart tribuzen || \
             pm2 start /opt/tribuzen/current/server/index.mjs --name tribuzen"
```

**Points-clés de cet exemple :**

- `.output/` seul est copié — pas `node_modules`, pas `src/`.
- Les secrets ne transitent pas par le repo : ils sont injectés comme variables d'environnement au moment du démarrage PM2.
- `pm2 restart || pm2 start` gère les deux cas : premier déploiement et rechargement.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Secrets en clair dans le code ou dans le bundle

```ts
// ❌ Secret hardcodé dans le composable — visible dans les DevTools
const config = useRuntimeConfig()
// En réalité, le dev a écrit :
const JWT_SECRET = 'super-secret-key-abc123'   // apparaît dans .output/server/index.mjs
```

```bash
# ❌ .env committé dans le repo
git add .env   # expose les secrets à tous les contributeurs
```

**Correct :**
- Valeurs sensibles → uniquement dans les secrets de la plateforme (Vercel, GitHub Secrets)
- `nuxt.config.ts` → valeurs vides par défaut, surchargées par les variables d'env au runtime
- `.env` local dans `.gitignore` ; un `.env.example` avec les clés mais sans valeurs pour guider les nouveaux devs

### PIÈGE #2 — Déployer une app Nuxt SSR sur une cible statique

```ts
// ❌ Preset 'static' pour une app qui utilise useAsyncData avec fetch dynamique
export default defineNuxtConfig({
  nitro: {
    preset: 'static'   // génère dist/ — aucun serveur Node au runtime
  }
})
```

Résultat : les routes dynamiques (`/famille/[id]`) ne sont pas générées, les server routes (`/api/*`) n'existent pas, `useRuntimeConfig()` côté serveur retourne des valeurs vides.

**Correct :** `preset: 'static'` seulement pour les apps sans données dynamiques au runtime. Pour le SSR TribuZen avec données utilisateur, utiliser `node-server` ou `vercel`.

### PIÈGE #3 — Pas de preview deployments → tests en production

```yaml
# ❌ Workflow qui ne déploie que sur push main — aucune preview par PR
on:
  push:
    branches: [main]
```

L'équipe merge sur `main` sans jamais voir le résultat sur une URL de staging. La première fois qu'on voit le bug en production, c'est trop tard.

**Correct :** ajouter un job `deploy-preview` déclenché sur `pull_request` (voir section 2.5). Ou connecter le repo directement à Vercel/Netlify pour les previews automatiques.

### PIÈGE #4 — `VITE_*` pour des secrets dans Nuxt

```bash
# ❌ Utiliser la convention Vite dans une app Nuxt
VITE_JWT_SECRET=trop-secret
```

Dans Nuxt, les variables préfixées `VITE_*` ne sont pas lues par `runtimeConfig` et peuvent être injectées côté client via le build Vite. Les secrets Nuxt doivent être préfixés `NUXT_` et déclarés dans `runtimeConfig` (sans `public`).

---

## 5. Ancrage TribuZen

Dans le repo `smaurier/tribuzen`, le déploiement couvre ces couches :

**`nuxt.config.ts` — configuration Nitro et runtimeConfig**

```ts
// tribuzen/nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: 'vercel'   // cible prod initiale
  },
  runtimeConfig: {
    jwtSecret: '',           // NUXT_JWT_SECRET — secret de signature des tokens
    dbUrl: '',               // NUXT_DB_URL — connexion PostgreSQL
    public: {
      apiBase: '/api',       // NUXT_PUBLIC_API_BASE — préfixe des appels API
      appEnv: 'production',  // NUXT_PUBLIC_APP_ENV — affiché dans les logs UI
    }
  }
})
```

**Fichiers de workflow :**

```
tribuzen/
  .github/
    workflows/
      deploy-production.yml    ← push main → Vercel prod
      deploy-preview.yml       ← PR → Vercel preview URL
```

**Points de contact dans le code :**

- `server/api/auth/login.post.ts` — lit `config.jwtSecret` via `useRuntimeConfig()`
- `composables/useApi.ts` — lit `config.public.apiBase` pour les fetch
- `app.vue` — affiche un badge "staging" si `config.public.appEnv !== 'production'`

Le premier déploiement TribuZen utilise Vercel (preset `vercel`, preview automatiques par PR). La migration vers un VPS auto-hébergé est prévue quand les besoins de performance l'exigent — le changement de preset de `vercel` à `node-server` est la seule modification dans `nuxt.config.ts`.

---

## 6. Points clés

1. SPA Vue → build statique `dist/`, n'importe quel CDN suffit. Nuxt SSR → `.output/` avec Node.js actif en runtime.
2. Nitro preset `node-server` pour auto-hébergé, `vercel` pour Vercel, `netlify` pour Netlify — un seul paramètre dans `nuxt.config.ts`.
3. `runtimeConfig` Nuxt sépare explicitement les secrets (root) des valeurs publiques (`.public`) — les secrets ne transitent jamais vers le client.
4. Convention de surcharge : clé camelCase `jwtSecret` → variable env `NUXT_JWT_SECRET` (automatique).
5. `VITE_*` dans les apps Vue = compilées dans le bundle et visibles côté client — ne jamais y mettre de secrets.
6. Preview deployments : activés automatiquement sur Vercel/Netlify dès que le repo est connecté, ou via Vercel CLI dans GitHub Actions.
7. Rollback Vercel : `vercel rollback [deployment]` ou dashboard → "Promote to Production". Instantané — pas de rebuild.
8. Blue-green = bascule totale instantanée (deux envs identiques). Canary = migration progressive du trafic (5% → 100%). Les deux exigent des migrations DB rétro-compatibles.

---

## 7. Seeds Anki

```
Quelle est la différence d'output entre pnpm build d'une SPA Vue et d'une app Nuxt SSR ?|SPA Vue → dist/ (fichiers statiques, aucun serveur requis). Nuxt SSR → .output/ (bundle Node.js, serveur requis en runtime avec node .output/server/index.mjs).
Quel Nitro preset utiliser pour déployer Nuxt sur un VPS Node.js auto-hébergé ?|preset: 'node-server' dans nitro: {} de nuxt.config.ts. Lance ensuite node .output/server/index.mjs sur le serveur.
Comment Nuxt traduit runtimeConfig.jwtSecret en variable d'environnement ?|Automatiquement : camelCase sans prefixe → NUXT_ + SCREAMING_SNAKE_CASE. Donc jwtSecret → NUXT_JWT_SECRET. Les clés public.apiBase → NUXT_PUBLIC_API_BASE.
Quelle est la règle de visibilité des clés runtimeConfig dans Nuxt ?|Clés à la racine (runtimeConfig.jwtSecret) → serveur seulement. Clés sous public (runtimeConfig.public.apiBase) → serveur ET client. Les clés privées ne transitent jamais vers le bundle client.
Comment déclencher un preview deployment par PR via GitHub Actions sur Vercel ?|Utiliser on: pull_request dans le workflow. Dans le job : vercel pull, vercel build, vercel deploy --prebuilt (sans --prod). Vercel retourne une URL temporaire par PR.
Comment faire un rollback instantané sur Vercel sans rebuild ?|Via CLI : vercel rollback [deployment-url-ou-id]. Ou dashboard : Deployments → ancienne version → "Promote to Production". Pas de rebuild — l'ancien build est réactivé.
Quelle est la différence entre blue-green et canary ?|Blue-green : deux envs identiques, bascule totale du trafic en un instant. Canary : un seul env cible recevant progressivement le trafic (5% → 100%) avec surveillance entre chaque palier.
Pourquoi VITE_MY_SECRET est un anti-pattern pour les secrets dans une SPA Vue ?|Les variables VITE_* sont compilées dans le bundle JS au moment du build et sont lisibles dans les DevTools du navigateur. Elles sont faites pour les URLs publiques, jamais pour des secrets.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-34-cicd-deploiement/README.md`. Configure le déploiement Nuxt SSR de TribuZen sur Vercel avec preview par PR, secrets via `runtimeConfig`, workflow GitHub Actions complet, et rollback simulé — vrai outil, corrigé intégral commenté.
