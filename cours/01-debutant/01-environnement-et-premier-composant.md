# 01 — Environnement et premier composant

> **Objectif** : Installer les outils nécessaires, créer ton premier projet Vue 3 avec TypeScript, et comprendre comment un composant Vue fonctionne.

---

## Avant de commencer : c'est quoi le DOM ?

> 📖 **Rappel JavaScript**
>
> Quand tu ouvres une page web dans ton navigateur (Chrome, Firefox…),
> le navigateur transforme ton code HTML en un **arbre d'objets** qu'il peut manipuler.
> Cet arbre s'appelle le **DOM** (Document Object Model).
>
> **Analogie** : Imagine que ton HTML est un plan d'architecte.
> Le DOM, c'est la maison réelle construite à partir de ce plan.
> Quand tu veux changer la couleur d'un mur, tu modifies la maison (le DOM), pas le plan (le fichier HTML).
>
> En JavaScript classique, on manipulait le DOM à la main :
>
> ```ts
> // On cherche l'élément dans la maison (le DOM)
> const titre: HTMLElement | null = document.getElementById("mon-titre");
> // On change son contenu
> if (titre) titre.textContent = "Nouveau titre";
> ```
>
> Avec Vue, **tu n'as plus besoin de faire ça manuellement** : Vue s'occupe de mettre à jour le DOM pour toi quand tes données changent. C'est ça la « réactivité ».

---

## Ce qu'on installe (et pourquoi !)

| Outil              | C'est quoi ?                             | Analogie                                                  |
| ------------------ | ---------------------------------------- | --------------------------------------------------------- |
| **Node.js** (LTS)  | Runtime JavaScript                       | Un moteur qui fait tourner JavaScript en dehors du navigateur |
| **pnpm**           | Gestionnaire de paquets                  | Comme un **App Store** pour les bibliothèques de code     |
| **Vite**           | Bundler de développement                 | Un **chef cuisinier** qui prépare et sert ton code au navigateur |
| **VS Code**        | Éditeur de code                          | Ton atelier de travail avec des super-pouvoirs            |

### 🔍 Node.js — c'est quoi ?

> 📖 **Rappel JavaScript**
>
> JavaScript a été inventé pour les navigateurs web (Chrome, Firefox…).
> Pendant longtemps, on ne pouvait l'exécuter QUE dans un navigateur.
>
> **Node.js** est un programme qui permet de faire tourner du JavaScript **sur ton ordinateur**, hors du navigateur. C'est grâce à lui qu'on peut utiliser des outils de développement écrits en JavaScript (comme Vite, pnpm, etc.).
>
> **Analogie** : JavaScript, c'est comme un poisson qui ne vivait que dans l'eau (le navigateur). Node.js, c'est un aquarium portable qui permet au poisson de vivre n'importe où (ton ordinateur, un serveur…).

**Installe la version LTS** (Long Term Support = version stable recommandée) depuis [nodejs.org](https://nodejs.org).

### 🔍 pnpm — c'est quoi un gestionnaire de paquets ?

Quand tu codes, tu as souvent besoin de bibliothèques créées par d'autres développeurs (Vue, par exemple !). Un **gestionnaire de paquets** te permet de :

- **Télécharger** ces bibliothèques en une commande
- **Gérer les versions** (ne pas casser ton projet en mettant à jour)
- **Partager** la liste de tes dépendances avec ton équipe

> **Analogie** : C'est comme un **App Store pour développeurs**. Au lieu de chercher et télécharger chaque outil à la main sur des sites web, tu tapes une commande et c'est installé.

Il existe plusieurs gestionnaires : `npm` (installé avec Node.js), `yarn`, `pnpm`. On utilise **pnpm** car il est plus rapide et économise de l'espace disque.

```bash
# Installe pnpm globalement sur ton ordinateur
# ("globalement" = disponible partout, pas juste dans un dossier)
npm install -g pnpm
```

### 🔍 Vite — c'est quoi un bundler ?

> 📖 **Rappel JavaScript**
>
> Quand tu écris du code moderne (TypeScript, composants `.vue`, CSS avancé…),
> le navigateur ne comprend pas tout ça directement.
> Il faut **transformer** ton code en HTML/CSS/JavaScript classique que le navigateur sait lire.

Un **bundler** est l'outil qui s'occupe de cette transformation. **Vite** est un bundler ultra-rapide.

> **Analogie** : Imagine que tu écris un livre en français (ton code source). Le bundler est un **traducteur** qui le convertit dans la langue que le navigateur comprend. Vite est un traducteur très rapide. ⚡

### 🔍 VS Code + l'extension Vue

**VS Code** est l'éditeur de code qu'on utilise. Installe l'extension **Vue - Official** pour avoir :

- La coloration syntaxique des fichiers `.vue`
- L'autocomplétion
- La détection d'erreurs en temps réel

---

## Créer un projet Vue 3 + TypeScript

```bash
# Cette commande demande à pnpm de créer un nouveau projet Vue
# "create vue@latest" = utilise la dernière version du créateur de projet Vue
# "mon-projet" = le nom du dossier qui sera créé
pnpm create vue@latest mon-projet

# Pendant la création, on te pose des questions. Choisis :
# ✅ TypeScript (pour avoir les types)
# ✅ ESLint (pour détecter les erreurs de code)
# ✅ Prettier (pour formater ton code automatiquement)

# On entre dans le dossier du projet
cd mon-projet

# On télécharge toutes les bibliothèques nécessaires
# (elles sont listées dans le fichier package.json)
pnpm install

# On lance le serveur de développement
pnpm dev
```

> 💡 Dans ce parcours de formation, le projet est déjà créé pour toi. Tu as juste à lancer :
>
> ```bash
> # Télécharge les dépendances du projet
> pnpm install
>
> # Démarre le serveur de développement
> pnpm dev
> ```

---

## Structure d'un projet Vue 3

Après la création, voici les fichiers importants dans ton projet :

```
mon-projet/
│
├── index.html          ← La page HTML de base (le point de départ)
│
├── src/                ← Le dossier principal de TON code
│   ├── main.ts         ← Le fichier de démarrage de l'application
│   ├── App.vue         ← Le composant racine (le composant "parent" de tous les autres)
│   └── style.css       ← Les styles CSS globaux (pour toute l'app)
│
├── vite.config.ts      ← La configuration de Vite (le bundler)
├── tsconfig.json       ← La configuration de TypeScript
└── package.json        ← La liste des dépendances (bibliothèques) et des commandes
```

> 💡 **Tu passeras 99 % de ton temps dans le dossier `src/`**. C'est là que tu écris tes composants, ta logique, tes styles.

---

## Anatomie d'un composant Vue (SFC)

### C'est quoi un composant ?

> 📖 **Rappel JavaScript**
>
> En programmation, on aime bien **découper** les choses en petits morceaux réutilisables.
> Un **composant**, c'est un morceau indépendant d'interface : un bouton, un menu, un formulaire, une carte…
>
> **Analogie** : Pense aux **briques LEGO**. Chaque brique est un composant. Tu les assembles pour construire quelque chose de plus grand.

### C'est quoi un SFC (Single File Component) ?

Un fichier `.vue` s'appelle un **SFC** = **Single File Component** (Composant en Fichier Unique).

Il contient **3 parties dans un seul fichier** :

1. **`<script>`** → la logique (le cerveau 🧠)
2. **`<template>`** → le HTML (le corps/la structure 🏗️)
3. **`<style>`** → le CSS (l'apparence/les vêtements 👕)

> **Analogie avec une fiche recette** 🍳 :
>
> - **`<script>`** = la **liste des ingrédients** (les données et la logique)
> - **`<template>`** = les **étapes de la recette** (comment assembler / afficher)
> - **`<style>`** = la **photo de présentation** (comment ça doit être joli à la fin)
>
> Tout est sur la même fiche, bien organisé !

### Exemple complet commenté

```vue
<!-- ═══════════════════════════════════════════════ -->
<!-- PARTIE 1 : LE SCRIPT (la logique / le cerveau) -->
<!-- ═══════════════════════════════════════════════ -->
<script setup lang="ts">
// "setup" = syntaxe simplifiée de Vue 3 (Composition API)
//   → Tout ce qu'on déclare ici est automatiquement disponible dans le template
// "lang="ts"" = on utilise TypeScript au lieu de JavaScript
//   → TypeScript ajoute les types pour éviter les erreurs

// On importe la fonction "ref" depuis la bibliothèque Vue
// "ref" permet de créer une variable RÉACTIVE (Vue surveille ses changements)
import { ref } from "vue";

// On crée une variable réactive appelée "message"
// ref<string>(...) veut dire : cette variable contient du texte (string)
// La valeur initiale est "Bonjour Vue 3 !"
const message = ref<string>("Bonjour Vue 3 !");
</script>

<!-- ═══════════════════════════════════════════════ -->
<!-- PARTIE 2 : LE TEMPLATE (le HTML / la structure) -->
<!-- ═══════════════════════════════════════════════ -->
<template>
  <!-- {{ message }} = affiche la valeur de la variable "message" -->
  <!-- Si message change, le texte affiché changera automatiquement ! -->
  <h1>{{ message }}</h1>
</template>

<!-- ═══════════════════════════════════════════════ -->
<!-- PARTIE 3 : LE STYLE (le CSS / l'apparence) -->
<!-- ═══════════════════════════════════════════════ -->
<style scoped>
/* "scoped" = ces styles ne s'appliquent QU'À CE COMPOSANT */
/* Sans "scoped", la couleur s'appliquerait à TOUS les <h1> de l'application */
h1 {
  color: #42b883; /* Vert Vue.js */
}
</style>
```

### Les 3 blocs en détail

#### `<script setup lang="ts">`

- **`setup`** : c'est la syntaxe moderne et simplifiée de Vue 3. Tout ce que tu déclares dans ce bloc (variables, fonctions…) est **automatiquement utilisable** dans le `<template>`.
- **`lang="ts"`** : active TypeScript au lieu de JavaScript classique.
- C'est ici que tu mets toute ta **logique** : variables, calculs, fonctions, appels API…

#### `<template>`

- C'est du **HTML enrichi** avec la syntaxe Vue (directives, interpolation `{{ }}`…).
- En Vue 3, tu peux mettre **plusieurs éléments** côte à côte (pas besoin d'un `<div>` qui englobe tout). C'est ce qu'on appelle les **fragments**.

#### `<style scoped>`

- **`scoped`** signifie que les styles ne s'appliquent **qu'à ce composant**.
- Sans `scoped`, si tu écris `h1 { color: red }`, **tous les `<h1>` de toute l'application** deviendraient rouges. Avec `scoped`, seul le `<h1>` de CE composant est coloré.
- Très utile pour **éviter les conflits CSS** entre composants.

---

## Le fichier `main.ts` — le point de démarrage

C'est le **tout premier fichier** qui s'exécute quand ton application démarre.

```ts
// On importe la fonction "createApp" depuis la bibliothèque Vue
// createApp = "crée une application Vue"
import { createApp } from "vue";

// On importe le composant App (le composant racine, le "parent" de tout)
import App from "./App.vue";

// 1) createApp(App)  → On crée l'application en lui disant :
//    "le composant principal, c'est App.vue"
//
// 2) .mount('#app')  → On "monte" (= accroche) l'application
//    sur l'élément HTML qui a l'id "app" dans index.html
createApp(App).mount("#app");
```

### C'est quoi « monter » (mount) une application ?

> **Analogie** : Imagine que `index.html` contient un **cadre photo vide** :
>
> ```html
> <div id="app"></div>
> <!-- 👆 cadre vide, en attente d'une photo -->
> ```
>
> Quand Vue fait `.mount('#app')`, c'est comme si elle **insérait la photo** (ton application) dans le cadre. Tout ce que Vue affiche apparaîtra **à l'intérieur** de cette div.
>
> Sans le `.mount(...)`, Vue a créé l'application en mémoire, mais elle n'est accrochée nulle part — donc rien ne s'affiche à l'écran.

---

## L'interpolation `{{ }}` — afficher des données dans le HTML

> 📖 **Rappel JavaScript**
>
> En JavaScript, pour insérer une variable dans du texte, on utilise les backticks :
>
> ```ts
> const nom: string = "Alice";
> console.log(`Bonjour ${nom}`); // Affiche : Bonjour Alice
> ```
>
> En Vue, c'est le même principe mais dans le HTML, avec des **doubles accolades** `{{ }}`.

Les doubles accolades `{{ }}` servent à **afficher la valeur d'une expression JavaScript** dans le template HTML.

> **Analogie** : Imagine un modèle de lettre avec des trous :
>
> *« Cher {{ nom }}, votre commande n° {{ numCommande }} est prête. »*
>
> Vue remplit les trous avec les vraies valeurs. Si `nom` vaut `"Alice"` et `numCommande` vaut `42`, on obtient :
>
> *« Cher Alice, votre commande n° 42 est prête. »*

### Exemples

```vue
<script setup lang="ts">
// On déclare nos variables
const message = ref<string>("Bonjour");
</script>

<template>
  <!-- On peut afficher un calcul mathématique -->
  <p>{{ 1 + 1 }}</p>
  <!-- Résultat affiché : 2 -->

  <!-- On peut afficher la valeur d'une variable -->
  <p>{{ message }}</p>
  <!-- Résultat affiché : Bonjour -->

  <!-- On peut appeler des méthodes JavaScript -->
  <p>{{ message.toUpperCase() }}</p>
  <!-- Résultat affiché : BONJOUR -->
  <!-- toUpperCase() transforme le texte en MAJUSCULES -->
</template>
```

> ⚠️ **Attention** : entre les `{{ }}`, on met des **expressions** (quelque chose qui produit une valeur), pas des **instructions** (comme `if`, `for`, `let`…). Par exemple `{{ 1 + 1 }}` ✅ mais `{{ let x = 1 }}` ❌.

---

## Commandes utiles

```bash
# Lance le serveur de développement avec le HMR (voir ci-dessous)
pnpm dev

# Compile ton projet pour la mise en production (version optimisée)
pnpm build

# Vérifie les types TypeScript sans compiler
# (utile pour trouver les erreurs de types)
pnpm typecheck
```

### 🔍 C'est quoi le HMR (Hot Module Replacement) ?

Quand tu lances `pnpm dev`, Vite démarre un **serveur de développement** sur ton ordinateur.

Le **HMR** (Hot Module Replacement = Remplacement de Module à Chaud) signifie que **quand tu modifies un fichier et que tu sauvegardes, le navigateur se met à jour automatiquement** — sans que tu aies besoin de rafraîchir la page !

> **Analogie** : C'est comme un peintre qui travaille et dont le tableau se met à jour en temps réel dans la galerie. Tu changes une couleur dans ton code → tu vois immédiatement le résultat dans le navigateur.

C'est **extrêmement pratique** pour développer vite, car tu vois tes changements en une fraction de seconde.

---

## Exercice

→ `exercices/01-compteur-reactif/ENONCE.md`

---

## Suite

→ `cours/01-debutant/02-template-et-directives.md`
