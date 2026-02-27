# 01 — Pipeline CI (Intégration Continue)

## 🏭 C'est quoi la CI/CD ? (Explication pour débutants)

### Rappel : le problème sans CI/CD

Imagine que tu travailles sur une app Vue avec 3 collègues. Chacun code de son côté.
Un jour, vous fusionnez tout votre code… et **rien ne marche**. Des erreurs partout,
des conflits, des bugs. C'est le chaos. 😱

**La CI/CD résout ce problème en automatisant les vérifications.**

### Analogie : la chaîne de montage d'une usine 🏭

Pense à une **usine automobile** :

1. **Poste 1** — On vérifie que les pièces sont conformes (= **Lint** : le code est-il bien écrit ?)
2. **Poste 2** — On vérifie que les pièces s'assemblent (= **Typecheck** : les types sont-ils corrects ?)
3. **Poste 3** — On teste que la voiture roule (= **Tests** : l'app fonctionne-t-elle ?)
4. **Poste 4** — On emballe la voiture (= **Build** : on crée le livrable final)
5. **Poste 5** — On livre au client (= **Deploy** : on met en ligne)

Si **un seul poste** échoue, la chaîne s'arrête → on ne livre pas un produit cassé.

### Les deux parties : CI et CD

| Terme | Signification | Ce que ça fait |
|-------|--------------|----------------|
| **CI** — Intégration Continue | Continuous Integration | Vérifie automatiquement ton code à chaque modification |
| **CD** — Déploiement Continu | Continuous Delivery/Deployment | Met automatiquement ton app en ligne si tout passe |

---

## 📋 C'est quoi un "pipeline" ?

Un **pipeline** = une **série d'étapes automatiques** qui s'exécutent les unes après les autres.

```
Tu fais un "push" sur GitHub
       ↓
   Étape 1 : Installer les dépendances (pnpm install)
       ↓
   Étape 2 : Vérifier le style du code (Lint)
       ↓
   Étape 3 : Vérifier les types TypeScript (Typecheck)
       ↓
   Étape 4 : Lancer les tests automatiques
       ↓
   Étape 5 : Construire l'app pour la production (Build)
       ↓
   ✅ Tout est vert → on peut déployer !
   ❌ Une étape échoue → on stoppe tout et on te prévient
```

---

## 🤖 C'est quoi GitHub Actions ?

**GitHub Actions** est un service **gratuit** intégré à GitHub qui exécute tes pipelines.

> **Analogie** : c'est comme un robot assistant qui, à chaque fois que tu envoies
> du code sur GitHub, va automatiquement vérifier que tout fonctionne. Tu n'as rien
> à faire manuellement — le robot s'en charge tout seul.

Il existe d'autres outils similaires :
- **GitLab CI** — la même chose, mais pour GitLab
- **Jenkins** — un outil plus ancien, auto-hébergé
- **CircleCI** — un service cloud

On va se concentrer sur **GitHub Actions** car c'est le plus utilisé.

---

## 📄 C'est quoi le YAML ?

Avant de voir le pipeline, il faut comprendre le **YAML** — c'est le format utilisé
pour écrire les fichiers de configuration de GitHub Actions.

### Rappel : tu connais peut-être le JSON ?

```json
{
  "nom": "Sophie",
  "age": 28,
  "langages": ["JavaScript", "TypeScript"]
}
```

Le **YAML** fait exactement la même chose, mais c'est **plus lisible** (pas d'accolades, pas de guillemets partout) :

```yaml
# Ceci est un commentaire en YAML (commence par #)

nom: Sophie            # Une clé: valeur (comme en JSON, mais sans guillemets)
age: 28                # Les nombres n'ont pas besoin de guillemets
langages:              # Une liste (chaque élément commence par un tiret -)
  - JavaScript
  - TypeScript
```

### Règles importantes du YAML

```yaml
# ⚠️ L'INDENTATION compte ! On utilise des ESPACES (pas des tabulations)
# Chaque niveau = 2 espaces supplémentaires

parent:                # Niveau 0
  enfant: valeur       # Niveau 1 (2 espaces)
    petit-enfant: ok   # Niveau 2 (4 espaces)

# Les listes utilisent des tirets -
fruits:
  - pomme
  - banane
  - cerise

# On peut aussi écrire une liste sur une ligne entre crochets
couleurs: [rouge, bleu, vert]
```

---

## 🔧 Notre premier pipeline GitHub Actions — pas à pas

Ce fichier doit être placé dans ton projet à cet emplacement exact :
`.github/workflows/ci.yml`

```yaml
# ============================================================
# Fichier : .github/workflows/ci.yml
# Rôle   : Pipeline CI — vérifie automatiquement le code
# ============================================================

# "name" = le nom affiché dans l'interface GitHub
name: CI

# ── QUAND déclencher le pipeline ? ──────────────────────────
# "on" = l'événement qui déclenche le pipeline
on:
  # Quand quelqu'un fait un "push" (envoie du code)
  push:
    # Seulement sur ces branches (pas sur les branches perso)
    branches: [main, develop]

  # Quand quelqu'un ouvre une "Pull Request" (demande de fusion)
  pull_request:
    branches: [main]

# ── QUE FAIRE quand c'est déclenché ? ──────────────────────
# "jobs" = les tâches à exécuter
jobs:
  # On nomme notre tâche "quality" (on aurait pu l'appeler autrement)
  quality:
    # "runs-on" = sur quelle machine exécuter ?
    # ubuntu-latest = une machine Linux virtuelle fournie gratuitement par GitHub
    runs-on: ubuntu-latest

    # "steps" = les étapes à suivre, dans l'ordre
    steps:
      # ── Étape 1 : Récupérer le code ──
      # "uses" = utiliser une action déjà faite par quelqu'un d'autre
      # actions/checkout = télécharge ton code depuis GitHub sur la machine virtuelle
      - uses: actions/checkout@v4

      # ── Étape 2 : Installer pnpm (le gestionnaire de paquets) ──
      - uses: pnpm/action-setup@v4
        with:
          version: 10        # On veut pnpm version 10

      # ── Étape 3 : Installer Node.js ──
      - uses: actions/setup-node@v4
        with:
          node-version: 20   # On veut Node.js version 20
          cache: pnpm        # Met en cache les dépendances (= plus rapide la prochaine fois)

      # ── Étape 4 : Installer les dépendances du projet ──
      # "run" = exécuter une commande dans le terminal
      # --frozen-lockfile = ne pas modifier le fichier pnpm-lock.yaml
      #   (on veut les MÊMES versions que sur notre machine locale)
      - run: pnpm install --frozen-lockfile

      # ── Étape 5 : Vérifier le style du code (Lint) ──
      # "name" = un nom lisible pour cette étape (affiché dans GitHub)
      - name: Lint
        # ESLint vérifie que le code suit les règles de style
        # (indentation, pas de variables inutilisées, etc.)
        run: pnpm lint

      # ── Étape 6 : Vérifier les types TypeScript ──
      - name: Typecheck
        # Vérifie que les types TypeScript sont corrects
        # (pas de string là où on attend un number, etc.)
        run: pnpm typecheck

      # ── Étape 7 : Lancer les tests ──
      - name: Tests
        # Lance tous les tests unitaires et mesure la couverture
        # (= quel pourcentage du code est testé ?)
        run: pnpm test:run --coverage

      # ── Étape 8 : Construire l'app ──
      - name: Build
        # Crée la version "production" de l'app
        # (fichiers optimisés, minifiés, prêts à être mis en ligne)
        run: pnpm build
```

### Ce qui se passe concrètement

Quand tu fais un `git push` sur GitHub :

1. GitHub **détecte** le push et lance le pipeline
2. Tu vois un **point orange** 🟠 à côté de ton commit (= en cours)
3. Si tout passe → **coche verte** ✅
4. Si quelque chose échoue → **croix rouge** ❌ et tu reçois un email

---

## 🛡️ Les "Quality Gates" (barrières de qualité)

Les quality gates sont des **outils qui vérifient la qualité de ton code**.
Le pipeline CI les lance automatiquement, mais tu peux aussi les utiliser en local.

### ESLint — le vérificateur de style et de bonnes pratiques

> **Analogie** : ESLint est comme un **correcteur orthographique** pour ton code.
> Il ne vérifie pas si ton code "marche", mais s'il est bien écrit.

```bash
# On installe ESLint et ses plugins pour Vue + TypeScript
# -D = "devDependency" (outil de développement, pas inclus dans l'app finale)
pnpm add -D eslint @eslint/js @vue/eslint-config-typescript eslint-plugin-vue
```

```js
// eslint.config.js — fichier de configuration d'ESLint
// Ce fichier dit à ESLint QUELLES RÈGLES appliquer

// On importe les règles spécifiques à Vue
import pluginVue from "eslint-plugin-vue";
// On importe les règles spécifiques à TypeScript
import tsConfig from "@vue/eslint-config-typescript";

export default [
  // On active les règles recommandées pour Vue
  ...pluginVue.configs["flat/recommended"],
  // On active les règles recommandées pour TypeScript
  ...tsConfig(),
  {
    // On personnalise certaines règles
    rules: {
      // "warn" = affiche un avertissement (jaune) si on utilise console.log
      // (en production, on ne veut pas de console.log qui traîne)
      "no-console": "warn",

      // "off" = désactive cette règle
      // (Vue recommande des noms à 2+ mots, mais c'est parfois contraignant)
      "vue/multi-word-component-names": "off",

      // "error" = erreur rouge si on utilise le type "any"
      // (any désactive TypeScript → on perd tout l'intérêt)
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
];
```

### Prettier — le formateur de code automatique

> **Analogie** : si ESLint est le correcteur orthographique, Prettier est le
> **metteur en page** — il s'occupe de l'indentation, des guillemets, des virgules, etc.

```bash
# On installe Prettier et son intégration avec ESLint
pnpm add -D prettier @vue/eslint-config-prettier
```

```json
// .prettierrc — fichier de configuration de Prettier
// Ce fichier dit à Prettier COMMENT formater le code
{
  "semi": false,            // Pas de point-virgule à la fin des lignes
  "singleQuote": true,      // Utiliser des apostrophes 'bonjour' au lieu de "bonjour"
  "trailingComma": "all",   // Virgule après le dernier élément d'une liste
  "printWidth": 100         // Couper les lignes à 100 caractères max
}
```

### Husky + lint-staged — vérifier AVANT le commit

> **Analogie** : c'est comme un **vigile à l'entrée** — avant que ton code
> soit envoyé (commit), il vérifie que tout est propre.

```bash
# Husky = intercepte les commandes Git (comme git commit)
# lint-staged = lance les vérifications uniquement sur les fichiers modifiés
pnpm add -D husky lint-staged

# Initialise Husky (crée le dossier .husky/)
npx husky init
```

```json
// Dans package.json — on configure lint-staged
// Ça dit : "avant chaque commit, vérifie les fichiers modifiés"
{
  "lint-staged": {
    // Pour les fichiers .ts et .vue → lancer ESLint puis Prettier
    "*.{ts,vue}": ["eslint --fix", "prettier --write"],
    // Pour les fichiers .css, .md, .json → juste Prettier
    "*.{css,md,json}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
# Ce script s'exécute automatiquement AVANT chaque "git commit"
pnpm lint-staged
```

### Seuils de couverture de tests

> **C'est quoi la couverture ?** C'est le pourcentage de ton code qui est vérifié
> par des tests. 80% de couverture = 80% de ton code est testé.

```ts
// vitest.config.ts — configuration des tests
// On définit les seuils MINIMAUX de couverture
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",    // Outil qui mesure la couverture
      thresholds: {
        statements: 80,  // 80% des instructions doivent être testées
        branches: 75,    // 75% des conditions (if/else) testées
        functions: 80,   // 80% des fonctions testées
        lines: 80,       // 80% des lignes testées
      },
      // Si on est en dessous → le pipeline échoue ❌
    },
  },
});
```

---

## 🔒 Protéger la branche principale (PR checks)

Dans les paramètres de ton dépôt GitHub, tu peux configurer des **règles de protection** :

| Règle | Ce que ça fait |
|-------|----------------|
| Require status checks to pass | La CI doit être ✅ verte avant de pouvoir fusionner |
| Require reviews (1+) | Au moins 1 collègue doit relire et approuver ton code |
| Require up-to-date branches | Ta branche doit être à jour avec `main` |

> **Pourquoi ?** Ça empêche de fusionner du code cassé dans la branche principale.
> C'est un filet de sécurité pour toute l'équipe.

---

## 📝 Résumé

| Concept | Explication simple |
|---------|-------------------|
| **CI** | Robot qui vérifie automatiquement ton code à chaque push |
| **Pipeline** | Série d'étapes automatiques (lint → test → build) |
| **GitHub Actions** | Service gratuit de GitHub pour exécuter les pipelines |
| **YAML** | Format de fichier pour la configuration (comme JSON, mais plus lisible) |
| **ESLint** | Correcteur orthographique pour le code |
| **Prettier** | Formateur automatique du code |
| **Husky** | Vigile qui vérifie le code avant chaque commit |

---

## 🎯 Pratique

### Exercice CI.1 — Créer un workflow

Crée un workflow qui s'exécute à chaque push et lance les tests :

```yaml
# .github/workflows/ci.yml
name: CI

# Déclencheur : à chaque push
# ???

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      # Récupérer le code
      # ???
      
      # Installer pnpm
      # ???
      
      # Installer les dépendances
      # ???
      
      # Lancer les tests
      # ???
```

<details>
<summary>Solution</summary>

```yaml
name: CI

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
```
</details>

---

### Exercice CI.2 — Jobs parallèles

Ajoute un job de lint qui s'exécute en parallèle des tests :

```yaml
jobs:
  test:
    # ... (comme avant)
  
  lint:
    # ???
```

<details>
<summary>Solution</summary>

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm test

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
```
</details>

---

### Exercice CI.3 — Configurer la couverture

Configure Vitest pour exiger 80% de couverture de code :

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      // ???
    }
  }
})
```

<details>
<summary>Solution</summary>

```ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80
      }
    }
  }
})
```
</details>

---

## Suite

→ `cours/07-cicd/02-deploiement.md`
