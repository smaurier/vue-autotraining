# 01 — Storybook : Installation et configuration

## 🧠 C'est quoi Storybook ?

Imagine que tu construis des meubles pour une maison. Avant de tout assembler dans la maison, tu aimerais **voir chaque meuble individuellement** dans un showroom — un peu comme les pièces d'exposition chez IKEA.

**Storybook, c'est exactement ça pour tes composants Vue.**

C'est un outil qui te permet de :

- **Voir chaque composant tout seul**, en dehors de ton application
- **Tester différentes variantes** (bouton rouge, bouton bleu, bouton désactivé…)
- **Documenter** tes composants pour que d'autres développeurs les comprennent

> 💡 **Analogie :** Ton application Vue = la maison meublée. Storybook = le catalogue IKEA ou tu vois chaque meuble sous tous les angles.

### Pourquoi c'est utile ?

Sans Storybook, pour voir ton bouton, tu dois :

1. Lancer toute ton application
2. Naviguer jusqu'à la page qui utilise ce bouton
3. Espérer que les données soient dans le bon état

Avec Storybook, tu ouvres **une seule page web** et tu vois **tous tes composants** classés et testables immédiatement.

---

## 📦 Installation pas à pas

### Étape 1 : Se placer dans le projet

```bash
# Ouvre un terminal et va dans le dossier de ton projet Vue
cd mon-projet-vue
```

### Étape 2 : Lancer l'installation automatique

```bash
# Cette commande détecte que ton projet utilise Vue 3 + Vite
# et installe tout ce qu'il faut automatiquement
npx storybook@latest init
```

> 💡 **Rappel :** `npx` permet d'exécuter un package npm sans l'installer globalement. C'est comme dire "utilise cet outil juste pour cette commande".

Cette commande va :

- Installer les dépendances nécessaires
- Créer un dossier `.storybook/` avec la configuration
- Créer un dossier `src/stories/` avec des exemples

### Étape 3 : Vérifier la structure créée

Après l'installation, tu verras ces **nouveaux fichiers** dans ton projet :

```
mon-projet-vue/
├── .storybook/          ← 📁 Dossier de configuration de Storybook
│   ├── main.ts          ← ⚙️ Configuration principale (quoi afficher, quels plugins)
│   └── preview.ts       ← 🎨 Configuration visuelle (styles globaux, réglages d'affichage)
├── src/
│   └── stories/         ← 📖 Exemples de stories (tu peux les supprimer plus tard)
│       ├── Button.stories.ts
│       └── ...
```

> 💡 **Un dossier qui commence par un point** (`.storybook`) est un dossier de configuration. C'est une convention courante dans le monde JavaScript.

---

## ⚙️ Comprendre la configuration

### Le fichier principal : `.storybook/main.ts`

Ce fichier dit à Storybook **comment fonctionne ton projet** :

```ts
// .storybook/main.ts
// C'est le fichier de configuration PRINCIPAL de Storybook

// On importe le type pour avoir l'autocomplétion
import type { StorybookConfig } from "@storybook/vue3-vite";

// On crée un objet de configuration
const config: StorybookConfig = {
  // stories : OÙ trouver les fichiers de stories dans ton projet
  // "../src/**/*.stories.@(ts|tsx)" signifie :
  //   ../src/     → dans le dossier src
  //   **/         → dans n'importe quel sous-dossier
  //   *.stories.  → les fichiers qui finissent par ".stories."
  //   @(ts|tsx)   → avec l'extension .ts ou .tsx
  stories: ["../src/**/*.stories.@(ts|tsx)"],

  // framework : quel framework on utilise (Vue 3 avec Vite)
  framework: "@storybook/vue3-vite",

  // addons : les plugins qui ajoutent des fonctionnalités
  addons: [
    "@storybook/addon-essentials", // Boutons de contrôle, documentation, etc.
    "@storybook/addon-a11y",       // Vérification d'accessibilité (pour les malvoyants, etc.)
  ],
};

// On exporte la configuration pour que Storybook puisse la lire
export default config;
```

### Le fichier d'aperçu : `.storybook/preview.ts`

Ce fichier configure **l'apparence globale** des stories (styles, réglages visuels) :

```ts
// .storybook/preview.ts
// Ce fichier configure comment les stories s'AFFICHENT

// On importe le type Preview pour l'autocomplétion
import type { Preview } from "@storybook/vue3-vite";

// On importe les styles CSS de notre application
// Comme ça, les composants dans Storybook auront les mêmes styles
// que dans l'application réelle
import "../src/style.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        // Si une prop contient "color" ou "background" → affiche un sélecteur de couleur
        color: /(background|color)$/i,
        // Si une prop contient "Date" → affiche un sélecteur de date
        date: /Date$/i,
      },
    },
  },
};

// On exporte pour que Storybook utilise ces réglages
export default preview;
```

> 💡 **En résumé :** `main.ts` = "quoi et comment", `preview.ts` = "l'apparence".

---

## 🧩 Les addons (plugins)

Les **addons** sont des extensions qui ajoutent des fonctionnalités à Storybook. C'est comme des plugins pour un navigateur.

### Installation des addons recommandés

```bash
# On installe 4 addons utiles
# -D signifie "dépendance de développement" (pas besoin en production)
pnpm add -D @storybook/addon-essentials @storybook/addon-a11y @storybook/addon-interactions @storybook/test
```

### À quoi sert chaque addon ?

| Addon          | Ce qu'il fait                                                        | Analogie                                      |
| -------------- | -------------------------------------------------------------------- | --------------------------------------------- |
| `essentials`   | Panneau de contrôle pour modifier les props, voir les événements     | Les boutons de réglage d'une machine à laver  |
| `a11y`         | Vérifie que ton composant est accessible (lisible, navigable, etc.)  | Un correcteur d'accessibilité, comme un correcteur orthographique |
| `interactions` | Permet de simuler des clics et interactions dans les stories         | Un robot qui teste les boutons à ta place     |
| `test`         | Outils pour écrire des mini-tests dans les stories                   | Une checklist de vérification                 |

---

## 🔗 Configurer les alias (chemins raccourcis)

> 💡 **Rappel :** Dans un projet Vue, on utilise souvent `@/` comme raccourci pour le dossier `src/`. Au lieu d'écrire `../../components/AppButton.vue`, on écrit `@/components/AppButton.vue`. C'est plus court et plus lisible.

Storybook ne connaît pas ces raccourcis par défaut. Il faut les lui expliquer :

```ts
// .storybook/main.ts (version complète avec les alias)
import type { StorybookConfig } from "@storybook/vue3-vite";
import { mergeConfig } from "vite";   // Outil de Vite pour fusionner des configurations
import path from "path";              // Module Node.js pour manipuler les chemins de fichiers

const config: StorybookConfig = {
  // Ou chercher les fichiers de stories
  stories: ["../src/**/*.stories.@(ts|tsx)"],

  // On utilise Vue 3 avec Vite
  framework: "@storybook/vue3-vite",

  // Nos plugins
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
    "@storybook/addon-interactions",
  ],

  // viteFinal : permet de MODIFIER la configuration Vite utilisée par Storybook
  viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          // On dit à Storybook : quand tu vois "@/", remplace par le dossier "src/"
          // __dirname = le dossier ou se trouve CE fichier (.storybook/)
          // "../src" = on remonte d'un niveau puis on va dans src/
          "@": path.resolve(__dirname, "../src"),
        },
      },
    });
  },
};

export default config;
```

---

## 🚀 Lancer Storybook

### En mode développement (pour travailler)

```bash
# Lance Storybook en mode développement
# Il s'ouvre automatiquement dans ton navigateur
pnpm storybook

# Tu verras s'afficher :
#   Local: http://localhost:6006
# → C'est l'adresse pour voir ton Storybook dans le navigateur
```

### Construire une version statique (pour partager)

```bash
# Génère un site web statique dans le dossier storybook-static/
# Tu peux ensuite mettre ce dossier sur un serveur web
pnpm storybook build
```

> 💡 **Site statique** = des fichiers HTML/CSS/JS que n'importe quel serveur web peut afficher, sans avoir besoin de Node.js.

---

## 🏗️ Storybook dans l'intégration continue (CI)

> 💡 **Rappel :** L'intégration continue (CI) est un système qui exécute automatiquement des vérifications à chaque fois que tu envoies du code. C'est comme un contrôle qualité automatique en usine.

```yaml
# .github/workflows/ci.yml — job Storybook
# Ce fichier dit à GitHub : "à chaque push, fais ces étapes"

storybook:
  runs-on: ubuntu-latest          # Utilise un serveur Linux
  steps:
    - uses: actions/checkout@v4   # Récupère le code du projet
    - uses: pnpm/action-setup@v4  # Installe pnpm
    - run: pnpm install --frozen-lockfile  # Installe les dépendances
    - run: pnpm storybook build   # Construit Storybook
    # Si ça réussit → les composants sont documentables
    # Si ça échoue → il y a un problème dans les stories
```

---

## 🏢 Pourquoi Storybook est utile en entreprise (ESN)

| Situation                     | Ce que Storybook apporte                        |
| ----------------------------- | ----------------------------------------------- |
| Équipe de plus de 3 devs      | Tout le monde voit les composants disponibles    |
| Un designer valide le travail | Il peut voir les composants sans installer le code |
| Nouveau dev dans l'équipe     | Il découvre tous les composants rapidement       |
| Design system partagé         | Un catalogue interactif des composants UI        |
| Vérifier les régressions      | On voit immédiatement si un composant a changé   |

---

## ✅ Résumé

| Concept          | C'est quoi                                                  |
| ---------------- | ----------------------------------------------------------- |
| **Storybook**    | Un showroom pour voir tes composants Vue un par un          |
| **main.ts**      | La configuration : ou sont les stories, quels plugins       |
| **preview.ts**   | L'apparence : styles globaux, réglages d'affichage          |
| **Addon**        | Un plugin qui ajoute des fonctionnalités à Storybook        |
| **Alias @/**     | Un raccourci de chemin qu'il faut configurer dans Storybook |

---

## 🎯 Pratique

### Exercice SB.1 — Lancer Storybook

Quelles commandes utilises-tu pour :
1. Installer Storybook dans un projet Vue existant
2. Lancer Storybook en mode développement
3. Générer une version statique

<details>
<summary>Solution</summary>

```bash
# 1. Installer Storybook
pnpm exec storybook@latest init

# 2. Lancer en mode dev
pnpm storybook

# 3. Générer une version statique
pnpm storybook build
```
</details>

---

### Exercice SB.2 — Configuration main.ts

Complète cette configuration pour :
- Trouver les stories dans `src/components/`
- Activer les addons essentials et a11y

```ts
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/vue3-vite'

const config: StorybookConfig = {
  framework: '@storybook/vue3-vite',
  stories: [
    // ???
  ],
  addons: [
    // ???
  ]
}
```

<details>
<summary>Solution</summary>

```ts
const config: StorybookConfig = {
  framework: '@storybook/vue3-vite',
  stories: [
    '../src/components/**/*.stories.@(ts|tsx)'
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y'
  ]
}
```
</details>

---

## Suite

→ `cours/06-storybook/02-stories.md`
