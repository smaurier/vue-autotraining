---
titre: CI/CD — pipeline
cours: 02-vue
notions: [rôle d'un pipeline CI, GitHub Actions workflow jobs steps, déclencheurs on push pull_request, cache des dépendances, lint typecheck tests build en CI, matrice de versions, artefacts, gate de merge et statuts requis]
outcomes:
  - sait écrire un workflow GitHub Actions pour un projet Vue
  - sait enchaîner lint, typecheck, tests et build dans la CI
  - sait mettre en cache les dépendances et publier des artefacts
  - sait bloquer un merge tant que la CI échoue
prerequis: [32-storybook-design-system]
next: 34-cicd-deploiement
libs: [{ name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — pipeline GitHub Actions (lint, typecheck, Vitest, build) bloquant le merge si rouge
last-reviewed: 2026-07
---

# CI/CD — pipeline

> **Outcomes — tu sauras FAIRE :** écrire un workflow GitHub Actions complet pour un projet Vue 3 (lint → typecheck → tests → build), mettre en cache les dépendances pnpm, publier des artefacts de build, et configurer les statuts requis pour bloquer un merge si la CI est rouge.
> **Difficulté :** :star::star::star:
>
> **Portée :** ce module couvre le pipeline CI (intégration continue). Le déploiement automatique (CD — Vercel, Netlify, VPS) est le sujet du **module 34**. Les stratégies de branching et GitFlow sont traitées au **module 35**.

← [Module 32 — Storybook & Design System](32-storybook-design-system.md)

---

## 1. Cas concret d'abord

L'équipe TribuZen est à trois développeurs. Pendant deux semaines, chacun travaille sur sa branche :

- `feat/family-card` — nouveau composant de carte famille
- `feat/event-form` — formulaire de création d'événement
- `fix/auth-redirect` — correction de la redirection après login

Le vendredi, les trois branches mergent dans `main` pour la démo client du lundi. Résultat :

```
✗ vue-tsc --noEmit
  src/components/family/FamilyCard.vue:18:5 — error TS2322:
  Type 'string' is not assignable to type 'number'

✗ vitest run
  FAIL  src/composables/useAuth.spec.ts
  AssertionError: expected '/login' to equal '/dashboard'
```

**Deux bugs introduits par le merge, découverts le vendredi soir.** La démo est compromise.

La CI résout ça : chaque branche est vérifiée automatiquement *avant* le merge. Si la CI est rouge, le merge est bloqué. Le bug n'entre jamais dans `main`.

Ce module te donne le workflow GitHub Actions complet pour TribuZen — du `git push` à l'artefact de build prêt au déploiement.

---

## 2. Théorie complète, concise

### 2.1 Rôle d'un pipeline CI

Un pipeline **CI (Continuous Integration)** est une séquence d'étapes automatiques déclenchées à chaque modification du code. Son rôle :

1. **Détecter les régressions tôt** — sur la branche, avant le merge, pas après
2. **Objectiver la qualité** — le résultat est vert ou rouge, pas "ça marche chez moi"
3. **Libérer les développeurs** — pas besoin de lancer manuellement lint + tests + build

Un pipeline CI est distinct du CD (Continuous Delivery/Deployment) qui s'occupe de mettre en ligne l'artefact produit par la CI.

```
push / PR
   ↓
Pipeline CI (ce module)
   ↓ vert           ↓ rouge
Merge autorisé    Merge bloqué
   ↓
Pipeline CD (module 34)
   ↓
Production
```

### 2.2 GitHub Actions — anatomie d'un workflow

GitHub Actions exécute les pipelines CI/CD. Un workflow est un fichier YAML dans `.github/workflows/`. Toute la terminologie :

```
Workflow  ← fichier .github/workflows/ci.yml
  └── on  ← déclencheurs (push, pull_request, schedule…)
  └── jobs
        └── job-name  ← unité d'exécution (machine virtuelle)
              └── runs-on  ← type de machine
              └── steps    ← liste d'étapes séquentielles
                    └── uses  ← action externe (actions/checkout@v4)
                    └── run   ← commande shell
                    └── with  ← paramètres de l'action
                    └── env   ← variables d'environnement de l'étape
```

**Workflow** — le fichier entier. Un repo peut en avoir plusieurs (ci.yml, release.yml, etc.).

**Job** — s'exécute sur une machine virtuelle isolée (`ubuntu-latest`, `windows-latest`, `macos-latest`). Les jobs sont **parallèles par défaut**. Pour les ordonner : `needs: [autre-job]`.

**Step** — étape séquentielle à l'intérieur d'un job. Chaque step partage le même système de fichiers que les autres steps du même job.

**Action** — module réutilisable (préfixe `uses:`). Syntaxe : `owner/repo@version`. Toujours épingler sur une version majeure stable (`@v4`).

### 2.3 Déclencheurs — `on`

La clé `on` définit quand le workflow s'exécute.

```yaml
on:
  # Déclenché sur push dans ces branches
  push:
    branches: [main, develop]
    # Optionnel : ne déclencher que si ces chemins changent
    paths:
      - 'src/**'
      - 'package.json'
      - '.github/workflows/**'

  # Déclenché quand une PR cible ces branches
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]

  # Déclenchement manuel (bouton "Run workflow" dans l'UI GitHub)
  workflow_dispatch:
```

**`push` vs `pull_request`**

| Déclencheur | Quand | Ce que ça vérifie |
|---|---|---|
| `push` | Après `git push` | Le commit pushé |
| `pull_request` | À chaque commit sur la branche PR | Le merge hypothétique branche → base |

Pour la CI : utiliser **les deux**. `push` protège `main`/`develop` directement. `pull_request` détecte les conflits de merge avant qu'ils n'entrent dans la base.

### 2.4 Cache des dépendances

Sans cache, chaque run de CI installe toutes les dépendances depuis npm. Sur un projet de taille moyenne, ça prend 30-90 secondes. Le cache réduit ça à 2-5 secondes.

`actions/setup-node@v4` intègre un mécanisme de cache natif pour npm, yarn et pnpm. Il utilise le lockfile comme clé de cache.

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: pnpm          # active le cache pnpm automatiquement
```

Quand le cache est actif, GitHub Actions :
1. Calcule un hash du `pnpm-lock.yaml`
2. Cherche un cache stocké pour ce hash
3. Si trouvé (cache hit) : restaure `node_modules` directement
4. Si non trouvé (cache miss) : installe via `pnpm install`, puis sauvegarde le cache

La clé de cache change automatiquement si le lockfile change (ajout/suppression de dépendance), forçant une reinstallation propre.

**pnpm/action-setup@v4** — action séparée nécessaire pour que pnpm soit disponible sur la machine CI avant `setup-node` :

```yaml
- uses: pnpm/action-setup@v4
  with:
    version: 10
```

### 2.5 Lint, typecheck, tests, build en CI

Chaque vérification est un step `run` avec la commande correspondante dans `package.json`.

**Scripts `package.json` standards pour Vue + Vite + Vitest :**

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.vue --max-warnings 0",
    "typecheck": "vue-tsc --noEmit",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "build": "vite build"
  }
}
```

**Dans le workflow :**

```yaml
- name: Lint
  run: pnpm lint

- name: Typecheck
  run: pnpm typecheck

- name: Tests
  run: pnpm test:coverage

- name: Build
  run: pnpm build
```

**Ordre d'importance** : lint et typecheck sont rapides (5-15 s), échouent tôt sur des erreurs fréquentes. Tests peuvent prendre 30-120 s. Build est en dernier car il implique tout le code.

`--max-warnings 0` sur ESLint transforme les warnings en erreurs — sinon la CI passe même si du code bâclé est présent.

`vue-tsc --noEmit` vérifie les types dans les SFC Vue (template inclus) sans émettre de fichiers. Différent de `tsc --noEmit` qui ne comprend pas les fichiers `.vue`.

### 2.6 Matrice de versions

La matrice (`strategy.matrix`) exécute le même job plusieurs fois en parallèle avec des paramètres différents. Utile pour valider sur plusieurs versions de Node.

```yaml
jobs:
  ci:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:run
```

Ce workflow lance **3 jobs en parallèle** (Node 18, 20, 22). Tous doivent être verts pour que la CI soit verte.

**Quand utiliser une matrice :**
- Bibliothèques publiées sur npm (doivent supporter plusieurs versions Node)
- Applications avec plusieurs environnements cibles

**Quand ne pas utiliser :**
- Applications avec une seule version Node cible (fixée dans `.nvmrc` ou `package.json engines`) — une matrice est du bruit sans valeur ajoutée

### 2.7 Artefacts

Un artefact est un fichier ou dossier produit par la CI et conservé après la fin du job. Deux actions standard :

**`actions/upload-artifact@v4`** — publie un artefact :

```yaml
- name: Build
  run: pnpm build

- name: Upload build artifact
  uses: actions/upload-artifact@v4
  with:
    name: dist-${{ github.sha }}
    path: dist/
    retention-days: 7     # conservé 7 jours (défaut: 90)
```

**`actions/download-artifact@v4`** — récupère un artefact dans un job suivant :

```yaml
jobs:
  build:
    # ... produit l'artefact

  deploy:
    needs: [build]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist-${{ github.sha }}
          path: dist/
      # ... déploie dist/
```

**Pourquoi séparer build et deploy en deux jobs ?**
- Le job `build` tourne sur chaque PR (CI)
- Le job `deploy` ne tourne que sur `main` (CD)
- L'artefact est le lien entre les deux — on déploie exactement ce qui a été vérifié

### 2.8 Gate de merge et statuts requis

La CI ne bloque le merge que si tu configures les **Branch Protection Rules** dans GitHub.

**Paramètres à activer (`Settings → Branches → Branch protection rules`) :**

| Paramètre | Effet |
|---|---|
| Require status checks to pass before merging | Le merge est grisé tant que la CI n'est pas verte |
| Require branches to be up to date before merging | Force un rebase/merge avec `main` avant de merger |
| Require a pull request before merging | Interdit le push direct sur `main` |
| Status checks requis | Sélectionner le(s) job(s) CI à exiger (ex: `quality`) |

**Comment GitHub sait quels checks exiger ?** Le nom du job dans le workflow (`quality`, `ci`, etc.) devient le nom du statut. Il faut l'écrire exactement dans la liste des statuts requis.

```yaml
jobs:
  quality:   # ← ce nom apparaît comme statut dans GitHub
    runs-on: ubuntu-latest
    steps: [...]
```

Dans les branch protection rules : ajouter `quality` dans "Status checks that are required".

**`github.sha`** — variable d'environnement GitHub Actions contenant le SHA du commit courant. Utile pour nommer des artefacts de façon unique.

**<code v-pre>${{ github.event_name }}</code>** — permet de conditionner un step selon le déclencheur :

```yaml
- name: Deploy (main only)
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  run: pnpm deploy
```

---

## 3. Worked examples

### Exemple 1 — Workflow CI complet pour TribuZen

Un seul job `quality` séquentiel : lint → typecheck → tests (avec couverture) → build → publication de l'artefact.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest

    steps:
      # 1. Récupère le code source sur la machine virtuelle CI
      - uses: actions/checkout@v4

      # 2. Installe pnpm (doit précéder setup-node pour que le cache fonctionne)
      - uses: pnpm/action-setup@v4
        with:
          version: 10

      # 3. Installe Node.js 20 et active le cache pnpm
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      # 4. Installe les dépendances avec les versions exactes du lockfile
      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      # 5. Lint ESLint — échoue si warning ou erreur (--max-warnings 0 dans le script)
      - name: Lint
        run: pnpm lint

      # 6. Typecheck vue-tsc — vérifie les types dans les SFC et les composables
      - name: Typecheck
        run: pnpm typecheck

      # 7. Tests Vitest + couverture — échoue si un test fail ou si seuils non atteints
      - name: Tests
        run: pnpm test:coverage

      # 8. Build Vite — produit dist/ en mode production
      - name: Build
        run: pnpm build

      # 9. Publie dist/ comme artefact (récupérable par le job CD du module 34)
      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: tribuzen-dist-${{ github.sha }}
          path: dist/
          retention-days: 7
```

**Ce que ce workflow garantit :** si le job `quality` est vert, le code a passé lint ESLint, typecheck vue-tsc, tous les tests Vitest avec les seuils de couverture, et le build Vite. L'artefact `dist/` est prêt au déploiement.

**Script `test:coverage` dans `package.json` :**

```json
{
  "scripts": {
    "test:coverage": "vitest run --coverage"
  }
}
```

**`vitest.config.ts` — seuils de couverture (le pipeline échoue si non atteints) :**

```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
})
```

---

### Exemple 2 — Jobs parallèles lint+typecheck / tests / build avec `needs`

Sur un projet plus grand, paralléliser réduit le temps de CI. Lint et typecheck sont rapides et indépendants. Les tests peuvent tourner en parallèle du lint. Le build attend que tout soit vert.

```yaml
# .github/workflows/ci-parallel.yml
name: CI (parallel)

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # Job A — lint + typecheck (rapide, ~20s)
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck

  # Job B — tests Vitest (peut prendre 30-120s selon le projet)
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Tests with coverage
        run: pnpm test:coverage

  # Job C — build Vite (attend lint ET test)
  build:
    runs-on: ubuntu-latest
    needs: [lint, test]   # s'exécute seulement si lint et test sont verts
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/upload-artifact@v4
        with:
          name: tribuzen-dist-${{ github.sha }}
          path: dist/
          retention-days: 7
```

**Chronologie :**

```
t=0s    lint démarre        test démarre
t=20s   lint ✅
t=45s   (lint fini)         test ✅
t=46s                       build démarre (needs: [lint, test] satisfaits)
t=70s                       build ✅ — artefact publié
```

Gain estimé vs séquentiel : ~40% de temps en moins sur ce projet.

**Pour les branch protection rules :** avec plusieurs jobs, il faut ajouter **chaque job** dans les statuts requis (`lint`, `test`, `build`) — ou utiliser un job `all-checks-passed` synthétique qui dépend de tous les autres :

```yaml
  all-checks-passed:
    runs-on: ubuntu-latest
    needs: [lint, test, build]
    steps:
      - run: echo "All checks passed"
```

Puis n'exiger que `all-checks-passed` dans les branch protection rules.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — `pnpm/action-setup` absent ou mal ordonné

```yaml
# ❌ setup-node avant pnpm/action-setup → le cache pnpm ne peut pas s'activer
# pnpm n'est pas encore connu au moment où setup-node cherche le lockfile
steps:
  - uses: actions/setup-node@v4
    with:
      cache: pnpm          # ← échoue : pnpm pas encore installé
  - uses: pnpm/action-setup@v4

# ✅ Ordre correct : checkout → pnpm/action-setup → setup-node
steps:
  - uses: actions/checkout@v4
  - uses: pnpm/action-setup@v4
    with:
      version: 10
  - uses: actions/setup-node@v4
    with:
      node-version: 20
      cache: pnpm          # ✅ pnpm est connu, le cache s'active
```

**Symptôme :** `Error: Cache folder path is retrieved for pnpm but pnpm is not installed`.

### PIÈGE #2 — `pnpm install` sans `--frozen-lockfile`

```yaml
# ❌ Sans --frozen-lockfile : pnpm peut mettre à jour pnpm-lock.yaml
# Les versions installées peuvent différer du lockfile commité
- run: pnpm install

# ✅ Avec --frozen-lockfile : garantit les versions exactes du lockfile
- run: pnpm install --frozen-lockfile
```

Sans `--frozen-lockfile`, une dépendance peut avoir publié une nouvelle version depuis le dernier commit et être installée en CI, créant une divergence invisible entre local et CI.

### PIÈGE #3 — `vue-tsc` vs `tsc` — les SFC ne sont pas vérifiés

```yaml
# ❌ tsc ne comprend pas les fichiers .vue — les templates ne sont pas vérifiés
- run: pnpm exec tsc --noEmit

# ✅ vue-tsc vérifie les SFC (template + script) — c'est l'outil requis pour Vue
- run: pnpm typecheck   # avec "typecheck": "vue-tsc --noEmit" dans package.json
```

Avec `tsc --noEmit`, une erreur de type dans le `<template>` d'un SFC passe silencieusement. `vue-tsc` est le seul outil qui vérifie les expressions de template.

### PIÈGE #4 — Branch protection sans statuts requis

```
# Scénario fréquent :
# ✅ CI configurée et qui tourne
# ❌ Branch protection rules non configurées
# Résultat : la CI est rouge mais le merge reste possible
```

La CI ne bloque rien par elle-même — elle produit un statut (vert/rouge). C'est la branch protection rule "Require status checks to pass" qui transforme ce statut en gate de merge. Les deux sont nécessaires.

**Vérification :** dans GitHub, tente de merger une branche dont la CI est rouge. Si le bouton "Merge" reste actif, les branch protection rules ne sont pas configurées.

### PIÈGE #5 — Jobs parallèles sans `needs` → build sans lint/test

```yaml
# ❌ Sans needs : lint, test, build tournent tous les trois EN PARALLÈLE
# build peut réussir même si lint ou test échouent
jobs:
  lint: [...]
  test: [...]
  build: [...]    # ← démarre en même temps que lint et test !

# ✅ Avec needs : build attend que lint ET test soient verts
jobs:
  lint: [...]
  test: [...]
  build:
    needs: [lint, test]   # bloque jusqu'à ce que les deux soient ✅
    [...]
```

Sans `needs`, un build réussi peut masquer des erreurs de lint ou de tests — l'artefact est publié même si la qualité n'est pas garantie.

### PIÈGE #6 — `ESLint --max-warnings 0` absent

Sans `--max-warnings 0`, ESLint sort avec le code 0 (succès) même en présence de warnings. Le step passe vert et le warning de type `no-unused-vars` ou `@typescript-eslint/no-explicit-any` n'est jamais traité. Le script `lint` dans `package.json` doit inclure `--max-warnings 0`.

---

## 5. Ancrage TribuZen

Dans TribuZen, le pipeline CI vit dans `.github/workflows/ci.yml` et protège la branche `main`. Chaque PR de feature ou fix doit passer la CI avant d'être mergeable.

**Fichiers concernés dans `smaurier/tribuzen` :**

```
tribuzen/
  .github/
    workflows/
      ci.yml           ← pipeline CI (ce module)
      cd.yml           ← déploiement Vercel (module 34)
  package.json         ← scripts lint, typecheck, test:coverage, build
  vitest.config.ts     ← seuils de couverture
  eslint.config.js     ← règles ESLint Vue + TS
```

**Le workflow CI de TribuZen vérifie :**

1. **Lint** — ESLint avec `eslint-plugin-vue` + `@vue/eslint-config-typescript`. La règle `vue/multi-word-component-names` est off (composants page comme `LoginPage.vue` sont acceptés), `@typescript-eslint/no-explicit-any` est en erreur.

2. **Typecheck** — `vue-tsc --noEmit`. Vérifie les types dans tous les SFC, y compris les expressions de template comme <code v-pre>{{ family.memberCount.toFixed(0) }}</code> (erreur si `memberCount` est `string`).

3. **Tests Vitest** — tous les composables (`useAuth`, `useFamily`, `useEvent`) et composants critiques sont testés. Seuil de couverture : 80% lignes/fonctions, 75% branches.

> **Lien modules 16-20 :** si tu n'as pas encore de specs dans TribuZen, pars du test fourni dans le lab associé à chaque module (tests unitaires M16, composants M17, intégration M18, e2e M19, MSW M20). La CI exécutera ces specs dès qu'elles existent dans le repo.

4. **Build Vite** — `vite build` avec `--mode production`. L'analyse du bundle (`vite-bundle-visualizer`) est optionnelle, activable via `workflow_dispatch`.

5. **Build Storybook** (module 30) — `pnpm build-storybook` vérifie que le design system compile sans erreur. À ajouter dans la CI dès que Storybook est intégré au projet.

**Branch protection rule configurée :**
- Statut requis : `quality` (ou `lint` + `test` + `build` si parallélisé)
- Require branches to be up to date : oui (force rebase avec `main` avant merge)
- Require pull request reviews : 1 review (projet solo TribuZen = désactivé pour l'instant)

**Workflow TribuZen complet (issu de l'Exemple 1 adapté) :**

```yaml
# .github/workflows/ci.yml — TribuZen
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Lint
        run: pnpm lint
      - name: Typecheck
        run: pnpm typecheck
      - name: Tests
        run: pnpm test:coverage
      - name: Build
        run: pnpm build
      - name: Build Storybook (design system — module 30)
        run: pnpm build-storybook
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: tribuzen-dist-${{ github.sha }}
          path: dist/
          retention-days: 7
```

---

## 6. Points clés

1. Un pipeline CI est une séquence d'étapes automatiques déclenchées à chaque push ou PR — il détecte les régressions avant le merge.
2. Un workflow GitHub Actions est un fichier `.github/workflows/*.yml` composé de jobs (machines virtuelles parallèles) et de steps (commandes séquentielles dans un job).
3. `pnpm/action-setup@v4` doit précéder `actions/setup-node@v4` pour que le cache pnpm (`cache: pnpm`) fonctionne.
4. `--frozen-lockfile` sur `pnpm install` garantit les versions exactes du lockfile commité — sans ça, la CI peut installer des versions différentes de l'environnement local.
5. `vue-tsc --noEmit` est requis pour vérifier les types dans les SFC Vue — `tsc --noEmit` ignore les templates.
6. `actions/upload-artifact@v4` publie l'artefact de build pour qu'il soit récupérable par le job de déploiement (module 34).
7. La CI ne bloque aucun merge par elle-même — il faut configurer les Branch Protection Rules (Settings → Branches) et y ajouter le nom du job CI comme statut requis.
8. `needs: [job-a, job-b]` ordonne les jobs parallèles — sans `needs`, tous les jobs démarrent simultanément indépendamment du résultat des autres.

---

## 7. Seeds Anki

```
Quel est l'ordre correct des actions setup dans un workflow pnpm ?|actions/checkout@v4 → pnpm/action-setup@v4 → actions/setup-node@v4 (avec cache: pnpm). pnpm doit être installé avant que setup-node cherche son lockfile pour activer le cache.
Pourquoi utiliser pnpm install --frozen-lockfile en CI ?|Garantit que les versions installées sont exactement celles du pnpm-lock.yaml commité. Sans ce flag, pnpm peut installer une version plus récente d'une dépendance, créant une divergence silencieuse entre local et CI.
Quelle commande vérifie les types TypeScript dans les SFC Vue (template inclus) ?|vue-tsc --noEmit — tsc --noEmit ignore les fichiers .vue et ne vérifie pas les expressions de template. vue-tsc est l'outil requis pour un typecheck complet d'un projet Vue.
Comment forcer un job CI à attendre que deux autres jobs soient verts avant de démarrer ?|needs: [job-a, job-b] dans la définition du job. Sans needs, tous les jobs d'un workflow sont parallèles et indépendants.
Pourquoi la CI seule ne suffit pas à bloquer un merge sur GitHub ?|La CI produit un statut (vert/rouge) mais ne bloque rien par défaut. Il faut configurer une Branch Protection Rule (Settings → Branches) avec "Require status checks to pass" et y sélectionner le nom du job CI.
Que fait actions/upload-artifact@v4 et pourquoi l'utiliser ?|Publie un dossier ou fichier (ex: dist/) comme artefact du run CI, conservé N jours. Permet à un job de déploiement (CD) de récupérer via actions/download-artifact@v4 exactement le build qui a été vérifié par la CI.
Quelle est la différence entre les déclencheurs push et pull_request dans GitHub Actions ?|push déclenche le workflow sur le commit pushé. pull_request déclenche sur le merge hypothétique branche→base, détectant les conflits avant le merge. Utiliser les deux : push protège main, pull_request détecte les problèmes sur les branches feature.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-33-cicd-pipeline/README.md`. Tu crées de zéro le fichier `.github/workflows/ci.yml` pour un projet Vue 3 + pnpm starter, vérifie que chaque step passe en local puis en CI réelle sur GitHub — corrigé complet commenté inclus.
