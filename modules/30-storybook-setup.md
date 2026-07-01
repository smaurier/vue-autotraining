---
titre: Storybook — setup
cours: 02-vue
notions: [rôle de Storybook, installation dans un projet Vue Vite, structure des fichiers de config main et preview, addons essentiels, lancer et builder Storybook, intégration avec Vitest en survol]
outcomes:
  - sait installer et configurer Storybook dans un projet Vue 3 Vite
  - sait comprendre main.ts et preview.ts et le rôle des addons
  - sait lancer et builder Storybook pour un design system
  - sait situer Storybook dans un workflow d'équipe
prerequis: [29-nuxt-seo-et-meta]
next: 31-storybook-stories
libs: [{ name: "@storybook/vue3-vite", version: "8" }, { name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — catalogue de composants isolé (comme le catalogue atomique Eudonet) pour développer et documenter les composants UI
last-reviewed: 2026-07
---

← [29 — Nuxt SEO et meta](29-nuxt-seo-et-meta.md) · **30 — Storybook setup** · [31 — Storybook stories →](31-storybook-stories.md)

# Storybook — setup

> **Outcomes — tu sauras FAIRE :** installer et configurer Storybook dans un projet Vue 3 Vite, lire et modifier `main.ts` et `preview.ts`, activer les addons essentiels, lancer et builder Storybook, situer l'outil dans un workflow d'équipe.
> **Difficulté :** :star::star:

## 1. Cas concret d'abord

Tu rejoins l'équipe front TribuZen. Le product designer vient de finir la maquette des composants atomiques : `AppButton`, `AppInput`, `TagBadge`, `AvatarUser`. Avant de les intégrer dans les pages Nuxt, tu dois :

1. Permettre à chaque développeur de voir et tester ces composants **sans lancer l'appli entière**.
2. Permettre au designer de valider visuellement **chaque variante** (taille, état, couleur) sans accès au code.
3. Fixer un **bus de régression visuel** : si quelqu'un casse `AppButton`, on le voit immédiatement.

Le lead tech dit : _"Mets en place Storybook."_ Tu n'en as jamais configuré un de zéro. Ce module te donne les bases.

**Question à résoudre avant de lire la théorie :** à ton avis, quelle est la différence entre `main.ts` et `preview.ts` dans `.storybook/` ? Note ta réponse — tu vérifieras ensuite.

---

## 2. Théorie complète, concise

### 2.1 Rôle de Storybook

Storybook est un **atelier de développement UI isolé**. Il fait tourner tes composants Vue dans un environnement séparé de l'application — sans router, sans store global, sans données réelles.

Trois usages concrets dans une équipe :

| Usage | Sans Storybook | Avec Storybook |
|---|---|---|
| Développer un composant | Lancer l'appli, naviguer jusqu'à la page concernée | Ouvrir Storybook, itérer sur le composant seul |
| Valider avec le designer | Partager des screenshots Figma ou des environnements de staging | URL Storybook statique, variantes interactives |
| Régression visuelle | Tests manuels ou snapshot Jest fragiles | Stories comme source de vérité — Chromatic, Playwright |

Storybook ne remplace pas les tests Vitest ni Playwright : il complète. Les stories *décrivent* l'état ; les tests *vérifient* le comportement.

### 2.2 Installation dans un projet Vue 3 Vite

La commande d'initialisation automatique détecte le framework depuis `package.json` :

```bash
# À la racine du projet (là où se trouve package.json)
npx storybook@latest init
```

Ce que `init` fait :
1. Détecte `@vitejs/plugin-vue` → choisit `@storybook/vue3-vite` comme framework.
2. Installe les dépendances en `devDependencies`.
3. Crée `.storybook/main.ts` et `.storybook/preview.ts`.
4. Crée `src/stories/` avec des stories d'exemple (supprimables ensuite).
5. Ajoute `"storybook"` et `"build-storybook"` aux scripts `package.json`.

Si l'auto-détection échoue (monorepo, structure non standard), installation manuelle :

```bash
pnpm add -D @storybook/vue3-vite @storybook/addon-essentials
```

### 2.3 Structure des fichiers de config — `main.ts` et `preview.ts`

Après `init`, le dossier `.storybook/` contient deux fichiers avec des responsabilités distinctes.

**`.storybook/main.ts` — configuration de build**

Dit à Storybook *comment trouver les stories* et *quels outils utiliser*.

```ts
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/vue3-vite'

const config: StorybookConfig = {
  // Glob : cherche tous les fichiers *.stories.ts(x) dans src/
  stories: ['../src/**/*.stories.@(ts|tsx)'],

  // Framework : Vue 3 + Vite (objet en Storybook 8 — string déprécié)
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },

  // Addons : liste des plugins enregistrés
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
}

export default config
```

Points clés de `main.ts` :
- `stories` est un **glob** relatif à la position de `.storybook/`. Le `../src/` remonte d'un niveau depuis `.storybook/` pour atteindre `src/`.
- En Storybook 8, `framework` est un **objet** `{ name, options }`, pas une string. La string courte est encore acceptée mais l'objet est le format officiel.
- `options.docgen: 'vue-component-meta'` active la génération automatique de documentation de props depuis les types TypeScript (optionnel mais recommandé).

**`.storybook/preview.ts` — configuration de rendu**

Configure *comment les stories s'affichent* : styles globaux, paramètres visuels, décorateurs.

```ts
// .storybook/preview.ts
import type { Preview } from '@storybook/vue3-vite'

// Import des styles globaux de l'app — les composants auront leur CSS en contexte
import '../src/assets/main.css'

const preview: Preview = {
  parameters: {
    // controls : règles de rendu des contrôles dans le panneau Args
    controls: {
      matchers: {
        // Props contenant "color" ou "background" → color picker
        color: /(background|color)$/i,
        // Props contenant "Date" → date picker
        date: /Date$/i,
      },
    },
    // backgrounds : couleurs de fond disponibles dans le toolbar Storybook
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1e293b' },
      ],
    },
  },
}

export default preview
```

Points clés de `preview.ts` :
- `import type { Preview } from '@storybook/vue3-vite'` — le type vient du package framework (pas de `@storybook/vue3`).
- Les imports CSS ici sont injectés dans l'iframe de preview — c'est le seul endroit où brancher tes styles globaux pour Storybook.
- `decorators` (tableau optionnel au même niveau que `parameters`) permet d'envelopper toutes les stories dans un provider Vue (store Pinia, router, i18n).

**Alias Vite (`@/`) — configuration `viteFinal`**

Si ton projet utilise `@/` comme alias de `src/`, Storybook ne l'hérite pas automatiquement de `vite.config.ts`. Il faut le déclarer dans `main.ts` via `viteFinal` :

```ts
// .storybook/main.ts — avec alias @/
import type { StorybookConfig } from '@storybook/vue3-vite'
import { mergeConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  framework: { name: '@storybook/vue3-vite', options: {} },
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y'],

  viteFinal(cfg) {
    return mergeConfig(cfg, {
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('../src', import.meta.url)),
        },
      },
    })
  },
}

export default config
```

`viteFinal` reçoit la config Vite interne de Storybook et retourne la config fusionnée. `mergeConfig` (export de Vite) gère correctement les tableaux (plugins, etc.) sans écraser.

### 2.4 Addons essentiels

Les addons s'installent en `devDependencies` et se déclarent dans `addons[]` de `main.ts`.

| Addon | Package | Ce qu'il apporte |
|---|---|---|
| Essentials | `@storybook/addon-essentials` | Méta-paquet : Controls, Actions, Docs, Backgrounds, Viewport, Toolbars |
| Accessibilité | `@storybook/addon-a11y` | Audit axe-core dans le panneau Accessibility |
| Interactions | `@storybook/addon-interactions` | Play functions — simulation de clics, saisie dans la story |
| Test | `@storybook/test` | Assertions (`expect`) utilisables dans les play functions |

```bash
pnpm add -D @storybook/addon-essentials @storybook/addon-a11y @storybook/addon-interactions @storybook/test
```

**`@storybook/addon-essentials`** est un méta-paquet : il installe et enregistre automatiquement Controls, Actions, Docs, Backgrounds, Viewport. Ne pas ajouter ces sous-paquets séparément — essentials les gère.

### 2.5 Lancer et builder Storybook

```bash
# Mode développement — HMR actif, Storybook sur http://localhost:6006
pnpm storybook

# Build statique — génère storybook-static/ déployable sur tout hébergeur statique
pnpm build-storybook
```

Le port 6006 est le port par défaut. Modifier avec `--port` :

```bash
pnpm storybook --port 7007
```

**Build CI/CD :** le build statique peut servir de gate dans un pipeline GitHub Actions :

```yaml
# .github/workflows/storybook.yml
- name: Build Storybook
  run: pnpm build-storybook
# Si le build échoue → story cassée → PR bloquée
```

Le dossier `storybook-static/` est un site HTML/CSS/JS pur — déployable sur Vercel, Netlify, GitHub Pages, ou un bucket S3. Ajouter `storybook-static/` au `.gitignore`.

### 2.6 Intégration avec Vitest (survol)

Storybook 8 introduit `@storybook/experimental-addon-test` qui permet d'exécuter les **play functions** des stories directement dans Vitest (sans lancer Storybook en mode dev).

Principe : Vitest utilise `setProjectAnnotations` pour charger la config de preview, puis monte chaque story via `composeStories` et exécute la play function comme un test ordinaire.

```ts
// vitest.setup.ts — configuration minimale
import { setProjectAnnotations } from '@storybook/vue3-vite'
import * as previewAnnotations from './.storybook/preview'

setProjectAnnotations([previewAnnotations])
```

Bénéfice : un seul fichier `.stories.ts` sert à la fois de documentation interactive et de spec de test — sans duplication. Le module 31 (stories) et le module 32 (tests Storybook) couvrent ça en détail.

---

## 3. Worked examples

### Exemple 1 — Setup complet pour TribuZen (de zéro)

**Contexte :** projet Vue 3 Vite existant (`tribuzen/`), pnpm, alias `@/` configuré dans `vite.config.ts`.

**Étape 1 — Init et vérification**

```bash
cd tribuzen
npx storybook@latest init
# Accepter l'installation des dépendances
# Répondre "non" si on demande d'ajouter eslint-plugin-storybook (à faire séparément)
```

Après init, vérifier `package.json` :

```json
{
  "scripts": {
    "storybook": "storybook dev --port 6006",
    "build-storybook": "storybook build"
  },
  "devDependencies": {
    "@storybook/vue3-vite": "^8.x.x",
    "@storybook/addon-essentials": "^8.x.x"
  }
}
```

**Étape 2 — Corriger `main.ts` pour TribuZen**

```ts
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/vue3-vite'
import { mergeConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

const config: StorybookConfig = {
  // Cherche les stories dans src/components/ et src/ui/ — pas dans src/pages/
  stories: [
    '../src/components/**/*.stories.@(ts|tsx)',
    '../src/ui/**/*.stories.@(ts|tsx)',
  ],

  framework: {
    name: '@storybook/vue3-vite',
    options: {
      // Active la doc auto depuis les types TypeScript des props Vue
      docgen: 'vue-component-meta',
    },
  },

  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
  ],

  viteFinal(cfg) {
    return mergeConfig(cfg, {
      resolve: {
        alias: {
          // Même alias que vite.config.ts
          '@': fileURLToPath(new URL('../src', import.meta.url)),
        },
      },
    })
  },
}

export default config
```

**Étape 3 — Configurer `preview.ts` pour TribuZen**

```ts
// .storybook/preview.ts
import type { Preview } from '@storybook/vue3-vite'

// Styles globaux TribuZen (tokens CSS, reset, typo)
import '../src/assets/main.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f8fafc' },
        { name: 'dark',  value: '#0f172a' },
      ],
    },
  },
}

export default preview
```

**Étape 4 — Lancer et vérifier**

```bash
pnpm storybook
# → http://localhost:6006
# → Les stories d'exemple de src/stories/ s'affichent — preuve que le setup fonctionne
```

### Exemple 2 — Ajouter un provider Pinia global dans `preview.ts`

TribuZen utilise Pinia. Les composants qui consomment un store planteront dans Storybook si Pinia n'est pas installé. On utilise un décorateur global :

```ts
// .storybook/preview.ts
import type { Preview } from '@storybook/vue3-vite'
import { createPinia } from 'pinia'
import '../src/assets/main.css'

const pinia = createPinia()

const preview: Preview = {
  decorators: [
    (story) => ({
      components: { story },
      setup() {
        // Fournit Pinia à tous les composants de la story
        return { pinia }
      },
      template: '<story />',
    }),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
```

Le décorateur enveloppe chaque story dans un composant Vue qui installe Pinia via `provide`. Les composants qui font `useStore()` le trouvent dans l'arbre.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — `framework` en string vs objet en Storybook 8

```ts
// ⚠️ Form string — encore acceptée mais déconseillée en Storybook 8
framework: '@storybook/vue3-vite'

// ✅ Form objet — officielle Storybook 8, supporte les options (docgen, etc.)
framework: {
  name: '@storybook/vue3-vite',
  options: {},
}
```

La form string peut générer des warnings de dépréciation selon la version mineure. Utiliser l'objet par défaut dans tout nouveau projet.

### PIÈGE #2 — Import `Preview` depuis `@storybook/vue3` au lieu de `@storybook/vue3-vite`

```ts
// ❌ Package générique — types moins précis pour le framework Vite
import type { Preview } from '@storybook/vue3'

// ✅ Package framework — types exacts pour Vue 3 + Vite
import type { Preview } from '@storybook/vue3-vite'
```

`@storybook/vue3` est le package générique Vue 3 (utilisé par le framework Webpack). Dans un projet Vite, les types viennent de `@storybook/vue3-vite`. Les deux compilent, mais `@storybook/vue3-vite` donne une meilleure inférence des options spécifiques à Vite.

### PIÈGE #3 — Alias `@/` non déclaré dans Storybook

Si `vite.config.ts` déclare `resolve.alias: { '@': ... }`, Storybook ne lit **pas** ce fichier par défaut. Les imports `@/components/AppButton.vue` dans les stories plante au build Storybook.

```ts
// ❌ Storybook ne connaît pas @/ — erreur "Cannot find module '@/components/...'"
// (même si vite.config.ts l'a déclaré)

// ✅ Redéclarer explicitement dans viteFinal de main.ts
viteFinal(cfg) {
  return mergeConfig(cfg, {
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
  })
},
```

Alternative : importer `vite.config.ts` dans `viteFinal` et merger (plus DRY, mais crée un couplage fort).

### PIÈGE #4 — CSS global non importé dans `preview.ts`

Les stories s'affichent **sans les styles de l'app** si on oublie l'import CSS dans `preview.ts`. Les composants semblent cassés visuellement — c'est un faux positif.

```ts
// preview.ts — sans import CSS
// Les composants apparaissent sans typo, sans tokens — état trompeur

// ✅ Importer les styles globaux en tête de preview.ts
import '../src/assets/main.css'
```

### PIÈGE #5 — Confondre `pnpm storybook` et `pnpm build-storybook`

`pnpm storybook` = mode dev avec HMR sur port 6006 (ne génère pas de fichiers).
`pnpm build-storybook` = génère `storybook-static/` (déployable).

En CI on exécute `build-storybook`, jamais `storybook` (qui resterait en attente indéfiniment).

---

## 5. Ancrage TribuZen

Dans TribuZen, Storybook est le **catalogue interactif des composants UI atomiques** — analogue au catalogue interne Eudonet.

**Périmètre cible :** les composants de `src/components/ui/` et `src/components/shared/` :

```
tribuzen/
  .storybook/
    main.ts       ← config avec alias @/, docgen: vue-component-meta
    preview.ts    ← import assets/main.css, décorateur Pinia
  src/
    components/
      ui/
        AppButton.vue          ← première story lab-30
        AppInput.vue
        TagBadge.vue
        AvatarUser.vue
      shared/
        FamilyCard.vue
```

**Workflow design-dev sur TribuZen :**

1. Dev implémente `AppButton.vue` + `AppButton.stories.ts`.
2. `pnpm storybook` → le designer valide les variantes (taille, état disabled, couleurs) sans toucher au code.
3. `pnpm build-storybook` en CI → URL statique partageable par PR.
4. Chromatic (optionnel) compare les screenshots story par story → régression visuelle automatique.

---

## 6. Points clés

1. Storybook isole chaque composant dans un iframe séparé — pas de router, pas de store global, pas de données réelles nécessaires.
2. `npx storybook@latest init` auto-détecte Vue + Vite et installe `@storybook/vue3-vite`.
3. `main.ts` contrôle le build (glob de stories, framework, addons, alias Vite via `viteFinal`).
4. `preview.ts` contrôle le rendu (import CSS globaux, `parameters`, `decorators` pour les providers Vue).
5. En Storybook 8, `framework` est un objet `{ name, options }` — la form string est déconseillée.
6. L'import `Preview` dans `preview.ts` vient de `@storybook/vue3-vite`, pas de `@storybook/vue3`.
7. L'alias `@/` de `vite.config.ts` n'est pas hérité automatiquement — le redéclarer dans `viteFinal`.
8. `pnpm storybook` = dev HMR port 6006 ; `pnpm build-storybook` = site statique CI/CD.

---

## 7. Seeds Anki

```
Quelle commande installe et configure Storybook dans un projet Vue 3 Vite existant ?|npx storybook@latest init — détecte automatiquement Vue + Vite et installe @storybook/vue3-vite avec les fichiers .storybook/main.ts et preview.ts.
Quelle est la différence de responsabilité entre main.ts et preview.ts dans .storybook/ ?|main.ts = configuration de build (glob stories, framework, addons, alias Vite via viteFinal). preview.ts = configuration de rendu (import CSS globaux, parameters, decorators pour les providers Vue).
Pourquoi l'alias @/ déclaré dans vite.config.ts ne fonctionne-t-il pas dans Storybook sans configuration supplémentaire ?|Storybook ne lit pas vite.config.ts. Il faut redéclarer l'alias dans la fonction viteFinal de main.ts via mergeConfig(cfg, { resolve: { alias: { '@': ... } } }).
Quel format doit avoir la clé framework dans main.ts en Storybook 8 ?|Un objet { name: '@storybook/vue3-vite', options: {} } — la form string courte est déconseillée en Storybook 8. options peut contenir docgen: 'vue-component-meta' pour la doc auto.
Depuis quel package importe-t-on le type Preview dans preview.ts d'un projet Vue 3 Vite ?|import type { Preview } from '@storybook/vue3-vite' — le package framework Vite, pas le package générique @storybook/vue3.
Comment fournir Pinia à toutes les stories sans le déclarer dans chaque fichier .stories.ts ?|Ajouter un decorator global dans preview.ts : decorators: [(story) => ({ components: { story }, setup() { return { pinia } }, template: '<story />' })] avec createPinia() instancié en dehors.
Quelle commande génère le build statique de Storybook pour un déploiement CI/CD ?|pnpm build-storybook — génère le dossier storybook-static/ déployable sur tout hébergeur statique. En CI on n'utilise jamais pnpm storybook (mode dev bloquant).
```

---

## Pont vers le lab

> Lab associé : `labs/lab-30-storybook-setup/README.md`. Configurer Storybook from scratch dans un projet Vue 3 Vite, brancher l'alias `@/`, importer le CSS global et lancer la première story `AppButton` — corrigé complet commenté.
