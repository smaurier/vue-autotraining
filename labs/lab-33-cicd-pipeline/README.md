# Lab 33 — CI/CD pipeline GitHub Actions

> **Outcome :** à la fin, tu sais créer un workflow GitHub Actions complet pour un projet Vue 3 + pnpm qui enchaîne lint, typecheck, tests Vitest avec couverture et build Vite, met en cache les dépendances, publie un artefact de build, et bloque le merge si un step échoue.
> **Vrai outil :** GitHub Actions réel — le workflow tourne sur les runners GitHub, pas dans un simulateur.
> **Feedback :** le coach valide en session sur le tab "Actions" de ton dépôt GitHub (vert = OK, rouge = à corriger).

---

## Énoncé

Tu travailles sur le front-office TribuZen. La branche `main` n'est pour l'instant protégée par rien : n'importe quel commit peut y entrer, même avec des erreurs TypeScript ou des tests qui échouent.

Ta mission : mettre en place le pipeline CI complet en **partant de zéro** sur un projet Vue 3 + Vite + pnpm existant.

**Cahier des charges :**

1. Le workflow se déclenche sur `push` vers `main` et sur toute `pull_request` ciblant `main`.
2. Le job `quality` exécute dans l'ordre : lint → typecheck → tests (avec couverture) → build.
3. Les dépendances pnpm sont mises en cache (le second run doit afficher "cache hit").
4. Le dossier `dist/` est publié comme artefact avec le SHA du commit dans le nom.
5. L'artefact est conservé 7 jours.
6. Une branch protection rule bloque le merge tant que le job `quality` est rouge.

**Projet starter :** utilise le repo TribuZen ou crée un projet Vite minimal :

```bash
pnpm create vite tribuzen-ci --template vue-ts
cd tribuzen-ci
pnpm install
git init && git add . && git commit -m "chore: init Vue 3 TS Vite"
```

Assure-toi que ces scripts sont dans `package.json` avant de commencer :

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext .ts,.vue --max-warnings 0",
    "typecheck": "vue-tsc --noEmit",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

Si ESLint n'est pas encore installé :

```bash
pnpm add -D eslint @eslint/js @vue/eslint-config-typescript eslint-plugin-vue
```

Si Vitest et le provider de couverture ne sont pas installés :

```bash
pnpm add -D vitest @vitest/coverage-v8 jsdom @vue/test-utils
```

---

## Étapes (en friction)

1. **Crée le répertoire du workflow** : `.github/workflows/` à la racine du projet.

2. **Crée le fichier `ci.yml`** dans ce dossier. Commence par écrire les clés de haut niveau : `name`, `on`, `jobs` — vides pour l'instant.

3. **Configure le déclencheur `on`** : push sur `main`, pull_request sur `main`. Réfléchis au type d'événement `pull_request` qui déclenche sur les commits de synchronisation d'une PR ouverte.

4. **Déclare le job `quality`** avec `runs-on: ubuntu-latest`. Ne mets pas encore de steps.

5. **Ajoute les steps d'environnement dans l'ordre correct** : checkout, pnpm/action-setup, setup-node avec cache pnpm. Vérifie l'ordre avant de continuer — le cache ne fonctionne que si pnpm est installé avant setup-node.

6. **Ajoute `pnpm install --frozen-lockfile`** comme step nommé "Install dependencies".

7. **Ajoute les quatre steps de vérification** : Lint, Typecheck, Tests, Build. Chaque step a un `name:` lisible et un `run:` qui appelle le script `package.json` correspondant.

8. **Ajoute le step `upload-artifact`** avec `actions/upload-artifact@v4`. Le nom de l'artefact doit inclure <code v-pre>${{ github.sha }}</code>.

9. **Push sur GitHub** et observe l'onglet "Actions". La CI doit être verte au premier run.

10. **Configure la branch protection rule** : Settings → Branches → Add rule → `main`. Active "Require status checks to pass" et ajoute `quality` dans la liste. Active aussi "Require branches to be up to date".

11. **Vérifie le gate de merge** : crée une branche `test/break-ci`, introduis une erreur TypeScript délibérée dans un composant (`const x: number = 'oops'`), pousse et ouvre une PR. Le bouton Merge doit être grisé tant que la CI est rouge.

---

## Corrigé complet commenté

### `.github/workflows/ci.yml`

```yaml
# Nom affiché dans l'onglet Actions de GitHub
name: CI

# Déclencheurs
on:
  # Déclenché sur push direct vers main (commits de merge, hotfix)
  push:
    branches: [main]

  # Déclenché sur chaque commit d'une PR ciblant main
  # types par défaut : opened, synchronize, reopened — couvre tous les cas
  pull_request:
    branches: [main]

jobs:
  # Nom du job = nom du statut dans les branch protection rules
  # → ajouter "quality" dans les statuts requis dans Settings → Branches
  quality:
    runs-on: ubuntu-latest

    steps:
      # Étape 1 — Checkout du code source
      # actions/checkout@v4 clone le repo sur la machine virtuelle CI
      # Pour les pull_request : clone le merge commit hypothétique (branche + main)
      - uses: actions/checkout@v4

      # Étape 2 — Installation de pnpm
      # DOIT précéder actions/setup-node pour que le cache pnpm fonctionne
      # version: 10 correspond à la version utilisée localement
      - uses: pnpm/action-setup@v4
        with:
          version: 10

      # Étape 3 — Installation de Node.js avec cache pnpm activé
      # cache: pnpm → GitHub calcule un hash de pnpm-lock.yaml et stocke node_modules
      # node-version: 20 → LTS stable, compatible Vue 3.5 + Vite 6
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      # Étape 4 — Installation des dépendances
      # --frozen-lockfile : interdit toute modification de pnpm-lock.yaml
      # Garantit que les versions CI == versions locales committées
      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      # Étape 5 — Lint ESLint
      # eslint . --ext .ts,.vue --max-warnings 0 dans package.json scripts.lint
      # --max-warnings 0 : les warnings deviennent des erreurs → step échoue si warning
      - name: Lint
        run: pnpm lint

      # Étape 6 — Typecheck TypeScript
      # vue-tsc --noEmit dans package.json scripts.typecheck
      # vue-tsc vérifie les types dans les SFC (template inclus)
      # NE PAS utiliser tsc --noEmit : les fichiers .vue ne sont pas compris
      - name: Typecheck
        run: pnpm typecheck

      # Étape 7 — Tests Vitest avec couverture
      # vitest run --coverage dans package.json scripts.test:coverage
      # Échoue si un test fail OU si les seuils de couverture ne sont pas atteints
      # (seuils configurés dans vitest.config.ts)
      - name: Tests
        run: pnpm test:coverage

      # Étape 8 — Build Vite
      # vite build dans package.json scripts.build
      # Produit dist/ en mode production (tree-shaking, minification)
      # S'exécute en dernier car le plus long et le moins informatif en cas d'échec
      - name: Build
        run: pnpm build

      # Étape 9 — Publication de l'artefact de build
      # actions/upload-artifact@v4 stocke dist/ sur les serveurs GitHub
      # name avec github.sha : chaque run produit un artefact unique
      # Téléchargeable via actions/download-artifact@v4 dans le job CD (module 34)
      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: tribuzen-dist-${{ github.sha }}
          path: dist/
          retention-days: 7
```

### `vitest.config.ts` — seuils de couverture

```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    // jsdom simule le DOM navigateur pour les composants Vue
    environment: 'jsdom',
    coverage: {
      // v8 utilise le moteur V8 de Node — plus rapide que istanbul
      provider: 'v8',
      thresholds: {
        // La CI échoue si l'un de ces seuils n'est pas atteint
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
})
```

### `eslint.config.js` — configuration ESLint Vue + TS

```js
import pluginVue from 'eslint-plugin-vue'
import tsConfig from '@vue/eslint-config-typescript'

export default [
  // Règles recommandées pour Vue 3
  ...pluginVue.configs['flat/recommended'],
  // Règles recommandées pour TypeScript
  ...tsConfig(),
  {
    rules: {
      // Pas de console.log en production (warning → erreur via --max-warnings 0)
      'no-console': 'warn',
      // Les composants page (LoginPage) ont un seul mot → off
      'vue/multi-word-component-names': 'off',
      // any désactive TypeScript → erreur bloquante
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
]
```

### Test de référence minimal (`src/composables/useCounter.spec.ts`)

Pour que la CI ne tombe pas sur "aucun test trouvé" :

```ts
import { describe, it, expect } from 'vitest'
import { ref, computed } from 'vue'

// Composable inline (pas besoin d'un fichier séparé pour ce test de référence)
function useCounter(initial = 0) {
  const count = ref(initial)
  const double = computed(() => count.value * 2)
  function increment() { count.value++ }
  function reset() { count.value = initial }
  return { count, double, increment, reset }
}

describe('useCounter', () => {
  it('initialise à la valeur passée', () => {
    const { count } = useCounter(5)
    expect(count.value).toBe(5)
  })

  it('incrémente de 1 à chaque appel', () => {
    const { count, increment } = useCounter()
    increment()
    increment()
    expect(count.value).toBe(2)
  })

  it('double est toujours count × 2', () => {
    const { count, double } = useCounter(3)
    expect(double.value).toBe(6)
    count.value = 7
    expect(double.value).toBe(14)
  })

  it('reset revient à la valeur initiale', () => {
    const { count, increment, reset } = useCounter(10)
    increment()
    reset()
    expect(count.value).toBe(10)
  })
})
```

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — reproduis de mémoire en 30 minutes :**

1. **Matrice de versions** : le job `quality` doit tourner sur Node 18 **et** Node 20 en parallèle. Les deux doivent être verts pour que la CI soit verte.

2. **Condition sur l'upload d'artefact** : l'artefact ne doit être publié que sur push vers `main`, pas sur les PRs. Utilise une condition `if:` sur le step upload.

3. **Path filter** : le workflow ne se déclenche que si des fichiers dans `src/`, `package.json` ou `.github/workflows/` ont changé — pas sur une modification de `README.md`.

**Sans ouvrir ce corrigé ni le module 33.**

**Critère de réussite :** l'onglet Actions GitHub montre les deux jobs Node 18 et Node 20 en parallèle, l'artefact n'est publié que sur les pushs directs, et un commit "docs: update README" ne déclenche pas la CI.

---

## Application TribuZen

Dans `smaurier/tribuzen`, le pipeline CI protège `main` depuis le début du projet. Chaque PR de feature (composant, composable, page Nuxt) doit passer la CI avant d'être mergeable.

**Structure cible :**

```
tribuzen/
  .github/
    workflows/
      ci.yml        ← ce lab
      cd.yml        ← module 34 (déploiement Vercel)
  src/
    composables/
      useAuth.ts
      useAuth.spec.ts    ← couverture ≥ 80%
    components/
      family/
        FamilyCard.vue
        FamilyCard.spec.ts
```

**Commit cible :**

```
ci: add GitHub Actions pipeline (lint, typecheck, vitest, build)
```

**Prochaine étape (module 34) :** ajouter un job `deploy` dans `cd.yml` qui récupère l'artefact <code v-pre>tribuzen-dist-${{ github.sha }}</code> et le déploie sur Vercel — uniquement sur push vers `main` et après que la CI est verte.
