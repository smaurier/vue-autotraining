---
titre: Environnement et premier composant
cours: 02-vue
notions: [pnpm create vue@latest, structure projet Vite, index.html, main.ts, createApp, mount, SFC, script setup lang ts, template, style scoped, interpolation, fragments Vue 3, HMR, Vue DevTools]
outcomes:
  - sait créer un projet Vue 3 + TypeScript avec pnpm create vue@latest
  - comprend le rôle de chaque fichier clé (main.ts, App.vue, index.html, vite.config.ts)
  - sait lire et écrire un SFC complet (script setup lang ts, template, style scoped)
  - sait afficher des données avec l'interpolation {{ }}
  - sait lancer et exploiter le serveur de développement Vite (HMR, Vue DevTools)
prerequis:
  - 00-typer-vue3
  - TypeScript fondamentaux — Modules 00-09 du cours TypeScript
next: 02-template-et-directives
libs: [{ name: vue, version: "3.5" }]
tribuzen: scaffold du front-office TribuZen — main.ts, App.vue racine, premier composant WelcomeBanner
last-reviewed: 2026-07
---

# Environnement et premier composant

> **Outcomes — tu sauras FAIRE :** créer un projet Vue 3 + TypeScript avec Vite, lire la structure du projet, écrire un SFC complet et le faire tourner dans le navigateur.
> **Difficulté :** :star:
>
> **Portée :** ce module couvre uniquement le **démarrage du projet** et l'**anatomie d'un composant de base**. Les directives (`v-if`, `v-for`, `v-bind`, `v-on`) sont vues au **module 02 (template-et-directives)**. La réactivité en profondeur (`ref`, `computed`, `watch`) est au **module 03**. La communication entre composants (`defineProps`, `defineEmits`) est au **module 05**. La réactivité de l'état local — `ref` — est ici utilisée dans les exemples car tu l'as déjà vue au **module 00** ; le mécanisme sous-jacent sera disséqué au module 03.

## 1. Cas concret d'abord

Tu rejoins l'équipe TribuZen. Le tech lead t'a ouvert l'accès au repo front-office et t'a demandé de **créer le projet from scratch** : outil configuré, TypeScript activé, premier composant en place avant ce soir.

Tu lances la commande de scaffold et tu te retrouves face à cette arborescence :

```
tribuzen-front/
├── index.html
├── src/
│   ├── main.ts          ← ???
│   ├── App.vue          ← ???
│   └── style.css
├── vite.config.ts
└── package.json
```

**Deux questions bloquent avant de commencer :**

1. `main.ts` contient `createApp(App).mount('#app')` — qu'est-ce que ça fait exactement, et où est ce `#app` ?
2. `App.vue` a trois blocs (`<script setup lang="ts">`, `<template>`, `<style scoped>`) — lequel s'exécute quand, et pourquoi `scoped` ?

Ce module répond à ces deux questions. En fin de session, tu livres `WelcomeBanner.vue` — premier SFC TribuZen, visible dans le navigateur, zéro erreur TypeScript.

---

## 2. Théorie complète, concise

### 2.1 Créer le projet : `pnpm create vue@latest`

La commande officielle scaffold un projet Vue 3 + Vite via `create-vue`, l'outil officiel de l'équipe Vue (confirmé dans la doc `vuejs.org/guide/quick-start`) :

```bash
pnpm create vue@latest tribuzen-front
```

L'assistant interactif pose plusieurs questions. Pour ce parcours :

| Question | Réponse |
|---|---|
| Add TypeScript? | **Yes** |
| Add JSX Support? | No |
| Add Vue Router? | No (module avancé) |
| Add Pinia? | No (module avancé) |
| Add Vitest? | No (module avancé) |
| Add ESLint? | **Yes** |
| Add Prettier? | **Yes** |

Puis :

```bash
cd tribuzen-front
pnpm install    # installe les dépendances listées dans package.json
pnpm dev        # lance le serveur de développement sur http://localhost:5173
```

> **`npm` ou `pnpm` ?** Les deux sont valides — `npm create vue@latest` produit un projet identique. `pnpm` est plus rapide et économise de l'espace disque grâce à la déduplication des modules via liens symboliques. Ce parcours utilise `pnpm` partout.

### 2.2 Structure du projet : les fichiers clés

```
tribuzen-front/
│
├── index.html              ← Point d'entrée HTML — contient <div id="app"></div>
│
├── src/
│   ├── main.ts             ← Bootstrap de l'app : createApp + mount
│   ├── App.vue             ← Composant racine (parent de tous les autres)
│   └── style.css           ← Styles globaux (reset CSS — rarement modifié)
│
├── vite.config.ts          ← Configuration du bundler Vite
├── tsconfig.json           ← Configuration TypeScript racine
├── tsconfig.app.json       ← TS config pour le code applicatif (src/)
└── package.json            ← Dépendances + scripts (dev, build, typecheck)
```

**Tu passeras 99 % du temps dans `src/`.** Les autres fichiers sont configurés une fois au scaffold et rarement modifiés.

### 2.3 `main.ts` — le bootstrap de l'application

`main.ts` est le **seul fichier exécuté directement** par Vite au démarrage. Il fait deux choses précises :

```ts
import { createApp } from 'vue'    // factory qui crée une instance Vue
import App from './App.vue'         // composant racine (le parent de tout)
import './style.css'                // import suffit pour les styles globaux

createApp(App).mount('#app')        // créer l'instance + l'accrocher au DOM
```

**Ce que fait chaque partie :**

`createApp(App)` — crée une **instance d'application Vue** en mémoire, en définissant `App.vue` comme composant racine. À ce stade, rien n'est visible dans le navigateur.

`.mount('#app')` — accroche l'instance sur l'élément HTML dont l'id est `app`. Cet élément existe dans `index.html`, généré par le scaffold :

```html
<!-- index.html -->
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
```

Vue prend le contrôle de cette `<div>`, la remplit avec le rendu de `App.vue`, et surveille toutes les mises à jour réactives. Tout ce que Vue affiche apparaîtra **à l'intérieur** de cette div.

> **Analogie :** `index.html` est un cadre photo vide accroché au mur. `createApp(App)` prépare la photo. `.mount('#app')` l'insère dans le cadre. Sans `.mount()`, la photo existe mais personne ne la voit.

`.mount()` retourne l'instance du composant racine (pas l'application elle-même). Chaîner est un idiome JavaScript courant, pas une magie Vue.

### 2.4 Anatomie d'un SFC (Single File Component)

Un fichier `.vue` s'appelle un **SFC** — Single File Component. Il réunit en un seul fichier les trois couches d'un composant :

```
┌─────────────────────────────────────┐
│  <script setup lang="ts">           │  ← Logique (TypeScript)
│  </script>                          │
├─────────────────────────────────────┤
│  <template>                         │  ← Structure (HTML augmenté)
│  </template>                        │
├─────────────────────────────────────┤
│  <style scoped>                     │  ← Apparence (CSS isolé)
│  </style>                           │
└─────────────────────────────────────┘
```

Les trois blocs sont **optionnels** (un SFC sans style est courant) mais l'ordre `script → template → style` est la convention communautaire.

### 2.5 `<script setup lang="ts">` — le cerveau du composant

`<script setup>` est la **syntaxe recommandée** en Vue 3 depuis la version 3.2. C'est du sucre syntaxique compilé vers la `setup()` function :

- Tout ce qui est déclaré au niveau racine (variables, fonctions, imports) est **automatiquement disponible** dans le `<template>` — pas de `return {}` manuel.
- `lang="ts"` active TypeScript dans ce bloc et dans le template. Sans `lang="ts"`, pas de vérification de types — voir Piège #5.

```vue
<script setup lang="ts">
import { ref } from 'vue'

// Toutes les déclarations racines sont exposées au template automatiquement
const appName = 'TribuZen'               // string (inféré par TS)
const version = ref<string>('1.0.0')     // Ref<string> — réactif (module 03)

function greet(name: string): string {
  return `Bienvenue sur ${appName}, ${name} !`
}
// greet est utilisable dans le template sans rien exporter
</script>
```

La réactivité (`ref`, `computed`, `watch`) est couverte en profondeur au **module 03**. Dans ce module, `ref` apparaît dans les exemples car tu l'as déjà vu au **module 00** — retenir pour l'instant que `ref(valeur)` crée une valeur que Vue surveille.

### 2.6 `<template>` — la structure HTML

Le bloc `<template>` contient du HTML standard augmenté de la syntaxe Vue. En Vue 3, le template peut avoir **plusieurs éléments racines** (fragments — pas besoin d'une `<div>` englobante inutile) :

```vue
<template>
  <!-- ✅ Vue 3 : fragments autorisés, pas de div wrapper obligatoire -->
  <header>TribuZen</header>
  <main>...</main>
</template>
```

Les directives (`v-if`, `v-for`, `v-bind`, `v-on`) qui augmentent le HTML sont le sujet du **module 02 (template-et-directives)**. Dans ce module, on se limite à l'interpolation `{{ }}`.

### 2.7 Interpolation `{{ }}` — afficher des données

Les doubles accolades `{{ }}` évaluent une **expression JavaScript** et insèrent le résultat dans le HTML. C'est le mécanisme d'affichage de base.

```vue
<script setup lang="ts">
const userName = 'Alice'
const year = new Date().getFullYear()
</script>

<template>
  <p>{{ userName }}</p>                  <!-- Alice -->
  <p>{{ userName.toUpperCase() }}</p>    <!-- ALICE -->
  <p>{{ 2 + 2 }}</p>                     <!-- 4 -->
  <p>Année {{ year }}</p>                <!-- Année 2026 -->
  <p>{{ year > 2025 ? 'récent' : 'ancien' }}</p>  <!-- récent -->
</template>
```

**Règle :** entre `{{ }}`, une **expression** (produit une valeur) — pas une **instruction** (déclare ou contrôle le flux). Voir Piège #3.

### 2.8 `<style scoped>` — CSS isolé

Sans `scoped`, un style `h1 { color: red }` dans un composant s'applique à **tous les `<h1>` de toute l'application**. Avec `scoped`, Vite ajoute un attribut unique au HTML (`data-v-xxxxxxxx`) et suffixe le sélecteur CSS avec cet attribut — le style ne s'applique qu'aux éléments de CE composant.

```vue
<style scoped>
/*
  Compilé par Vite vers :
  h1[data-v-3a1b2c3d] { color: #42b883; }

  Ce sélecteur ne peut jamais cibler un <h1> d'un autre composant.
*/
h1 {
  color: #42b883;
}
</style>
```

> **Quand ne pas mettre `scoped` ?** Dans `style.css` (reset global) ou dans `App.vue` pour des variables CSS globales (`:root { --color-primary: ... }`). Dans tous les autres composants : `scoped` par défaut.

### 2.9 Vite dev server, HMR et Vue DevTools

**`pnpm dev`** démarre un serveur de développement sur `http://localhost:5173`.

**HMR (Hot Module Replacement)** : à chaque sauvegarde d'un `.vue`, Vite pousse la mise à jour au navigateur — sans rechargement complet, en conservant l'état des composants non modifiés. Si tu modifies un `<style>`, le CSS s'applique immédiatement. Si tu modifies le `<template>` ou le `<script>`, Vue remplace le module modifié à chaud.

**Vue DevTools** : extension navigateur (Chrome/Firefox/Edge) qui permet d'inspecter la hiérarchie des composants, leurs données réactives, et les événements. À installer une fois, utilisable dans tout projet Vue.

```bash
pnpm dev        # serveur de développement avec HMR
pnpm build      # compile et optimise pour la production (génère dist/)
pnpm typecheck  # vérifie les types TS sans compiler (vue-tsc --noEmit)
```

---

## 3. Worked examples

### Exemple 1 — reconstruire `main.ts` de zéro

**Situation :** un collègue a supprimé `main.ts` par erreur. La page est blanche. Tu dois le recréer.

**Étape 1 — identifier les imports nécessaires.**

`createApp` vient de `'vue'` (bibliothèque). `App` vient de `'./App.vue'` (chemin relatif). `style.css` est importé sans variable pour déclencher l'injection globale.

**Étape 2 — créer l'instance d'application.**

```ts
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
// L'instance existe en mémoire — rien de visible dans le navigateur
```

**Étape 3 — monter sur le DOM.**

```ts
app.mount('#app')
// Vue prend le contrôle de <div id="app"> dans index.html
// App.vue est rendu à l'intérieur
```

**Version idiomatique finale :**

```ts
// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

createApp(App).mount('#app')
```

> **Vérification :** après sauvegarde, `pnpm dev` doit afficher le contenu de `App.vue` dans le navigateur. Si la page reste blanche et que la console affiche `[Vue warn]: Failed to mount app: mount target selector "#app" returned null`, l'id `app` ne correspond pas à l'élément dans `index.html`.

### Exemple 2 — `WelcomeBanner.vue` : premier SFC TribuZen

**Situation :** tu crées le composant de bienvenue de la page d'accueil TribuZen. Prénom utilisateur hardcodé pour l'instant (`'Alice'`), message contextuel selon l'heure.

```vue
<!-- src/components/WelcomeBanner.vue -->
<script setup lang="ts">
// Import OBLIGATOIRE — Vue ne fait pas d'auto-import par défaut
import { ref } from 'vue'

// ref<string> : valeur réactive. Vue la surveille pour mettre à jour le template.
// Module 03 dissèque le mécanisme — ici, retenir : ref() = valeur que Vue surveille.
const userName = ref<string>('Alice')

// Constante non réactive : pas de ref nécessaire si la valeur ne change jamais
const appVersion = '1.0.0'

// Fonction exposée automatiquement au template grâce à <script setup>
// Paramètre typé + retour explicite : bonne pratique TS (module 00)
function buildGreeting(name: string): string {
  const hour = new Date().getHours()
  if (hour < 12) return `Bonjour ${name} !`
  if (hour < 18) return `Bon après-midi ${name} !`
  return `Bonsoir ${name} !`
}
</script>

<template>
  <div class="welcome-banner">
    <!--
      buildGreeting(userName) : appel de fonction dans {{ }}
      userName est Ref<string> — Vue auto-unwrap les refs dans le template :
      buildGreeting reçoit la string 'Alice', pas l'objet Ref.
      (Règle : dans le template, écrire userName, pas userName.value)
    -->
    <h1>{{ buildGreeting(userName) }}</h1>

    <!-- userName auto-unwrappé = 'Alice' directement -->
    <p>Connecté en tant que <strong>{{ userName }}</strong></p>

    <!-- Expression simple : concaténation dans {{ }} -->
    <p class="version">TribuZen v{{ appVersion }}</p>
  </div>
</template>

<style scoped>
/*
  scoped : Vite compile vers .welcome-banner[data-v-xxxx], h1[data-v-xxxx]…
  Aucun de ces styles ne peut déborder sur un autre composant.
*/
.welcome-banner {
  padding: 2rem;
  border-radius: 0.75rem;
  background: #f0fdf4;
  max-width: 600px;
  margin: 2rem auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

h1 {
  /* Ce h1 = uniquement le <h1> de WelcomeBanner */
  color: #16a34a;
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

.version {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-top: 1rem;
}
</style>
```

**Brancher dans `App.vue` :**

```vue
<!-- src/App.vue -->
<script setup lang="ts">
// Avec <script setup>, l'import suffit — pas de components: {} à déclarer
import WelcomeBanner from './components/WelcomeBanner.vue'
</script>

<template>
  <!-- Fragment Vue 3 : deux éléments racines sans div wrapper -->
  <main>
    <WelcomeBanner />
  </main>
</template>
```

Vue DevTools (F12 → onglet Vue) montrera la hiérarchie `App → WelcomeBanner` et les valeurs actuelles de `userName` et `appVersion`.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — `.mount()` oublié → page blanche silencieuse

```ts
// ❌ L'application est créée mais jamais ancrée dans le DOM
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
// .mount('#app') oublié — aucune erreur dans la console, écran blanc

// ✅ Toujours chaîner .mount() après createApp()
createApp(App).mount('#app')
```

Symptôme insidieux : pas d'erreur JavaScript, juste une page blanche. Vérifier en premier que `mount` est présent et que le sélecteur `'#app'` correspond à l'id dans `index.html`.

### PIÈGE #2 — `<style>` sans `scoped` → CSS qui pollue toute l'app

```vue
<!-- CardComponent.vue -->
<style>
/* ❌ Sans scoped : s'applique à TOUS les <p> de toute l'application */
p { margin-bottom: 0; }
</style>

<style scoped>
/* ✅ Avec scoped : uniquement les <p> de CE composant -->
p { margin-bottom: 0; }
</style>
```

Symptôme classique : "j'ai modifié le style d'un composant et ça a cassé une autre page". Cause systématique : `scoped` absent. Ajouter `scoped` en premier réflexe à chaque nouveau `<style>`.

### PIÈGE #3 — instruction dans `{{ }}` au lieu d'une expression

```vue
<template>
  <!-- ❌ Instruction : let est une déclaration, non une expression -->
  {{ let x = 1 }}

  <!-- ❌ Instruction : if sans valeur de retour -->
  {{ if (count > 0) count }}

  <!-- ✅ Expression ternaire (produit une valeur) -->
  {{ count > 0 ? count : 'vide' }}

  <!-- ✅ Appel de méthode (produit une valeur) -->
  {{ userName.toUpperCase() }}

  <!-- ✅ Opération arithmétique -->
  {{ price * quantity }}
</template>
```

**Règle mémo :** si tu peux l'écrire à droite d'un `=` dans une assignation, c'est une expression. `let x = **ici**`. Les mots-clés `if`, `for`, `let`, `const`, `return` ne produisent pas de valeur et ne fonctionnent pas dans `{{ }}`.

### PIÈGE #4 — `ref` non importé → `ReferenceError` au runtime

```vue
<!-- ❌ Vue ne fait PAS d'auto-import de ref, computed... par défaut -->
<script setup lang="ts">
const count = ref(0)   // ReferenceError: ref is not defined
</script>

<!-- ✅ Import explicite requis -->
<script setup lang="ts">
import { ref } from 'vue'
const count = ref(0)   // ✅
</script>
```

L'IDE (VS Code + extension Vue - Official) signale l'absence d'import avec un soulignement rouge. Sans l'IDE, l'erreur n'apparaît qu'au runtime dans la console navigateur.

### PIÈGE #5 — `<script setup>` sans `lang="ts"` → TypeScript silencieusement désactivé

Rappel du module 00, crucial ici car facile à oublier lors de la création d'un nouveau fichier :

```vue
<!-- ❌ Pas de lang="ts" : TypeScript désactivé dans ce composant -->
<script setup>
import { ref } from 'vue'
const count = ref(0)
count.value = 'texte'   // Aucune erreur signalée — bug silencieux
</script>

<!-- ✅ lang="ts" obligatoire pour la vérification de types -->
<script setup lang="ts">
import { ref } from 'vue'
const count = ref(0)
count.value = 'texte'   // TS Error: Type 'string' is not assignable to type 'number'
</script>
```

**Signal d'alarme :** si TypeScript "ne détecte rien" dans un composant Vue, `lang="ts"` manquant est le premier suspect.

---

## 5. Ancrage TribuZen

Le scaffold et les fichiers créés ici sont la fondation du front-office TribuZen. Chaque module du parcours ajoute une couche à ce projet.

**`main.ts`** — identique à ce qui est construit dans ce module. Dans TribuZen, il sera progressivement enrichi avec les plugins router et store quand ceux-ci seront introduits :

```ts
// main.ts TribuZen — état final (modules avancés)
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'          // Vue Router — module avancé 01
import { createPinia } from 'pinia'   // Pinia store — module avancé 02

createApp(App)
  .use(router)
  .use(createPinia())
  .mount('#app')
```

Pour l'instant, le `main.ts` de ce module reste minimal : `createApp(App).mount('#app')`. Les `.use(plugin)` seront abordés plus tard.

**`WelcomeBanner.vue`** — c'est le composant construit dans ce module (et son lab). Dans TribuZen, il sera la bannière de la page d'accueil. Pour l'instant le prénom est hardcodé ; il sera récupéré depuis le store Pinia une fois celui-ci introduit.

**`App.vue`** — la racine de toute l'arborescence de composants TribuZen. À ce stade, elle ne fait qu'importer `WelcomeBanner`. Elle accueillera le `<RouterView>` dès que Vue Router est introduit.

```
tribuzen/
  src/
    main.ts                     ← createApp(App).mount('#app') — module 01
    App.vue                     ← racine, importe WelcomeBanner — module 01
    components/
      WelcomeBanner.vue         ← premier SFC TribuZen — module 01 + lab
      auth/
        LoginForm.vue           ← typage TS (module 00) + emits (module 05)
      family/
        FamilyMemberList.vue    ← réactivité ref/computed/watch (module 03)
```

---

## 6. Points clés

1. `pnpm create vue@latest` (ou `npm create vue@latest`) scaffold le projet avec Vite et `create-vue` — c'est la commande officielle.
2. `main.ts` est le seul point d'entrée : `createApp(App).mount('#app')` — deux étapes, un seul idiome à retenir.
3. `.mount('#app')` cible `<div id="app">` dans `index.html` — si l'id ne correspond pas, page blanche silencieuse sans erreur JS.
4. Un SFC (`.vue`) contient trois blocs : `<script setup lang="ts">`, `<template>`, `<style scoped>`.
5. `<script setup>` : tout ce qui est déclaré racine est auto-exposé au template — pas de `return {}` à écrire.
6. `{{ expression }}` = interpolation — évalue une expression JS et l'insère dans le HTML (expressions uniquement, pas d'instructions).
7. `<style scoped>` = CSS isolé au composant — sans `scoped`, le style pollue toute l'application.
8. HMR Vite : toute sauvegarde met à jour le navigateur instantanément, sans rechargement complet de la page.

---

## 7. Seeds Anki

```
Quelle commande crée officiellement un projet Vue 3 + Vite ?|pnpm create vue@latest (ou npm create vue@latest). Utilise create-vue, l'outil officiel de l'équipe Vue.
Que fait createApp(App).mount('#app') ligne par ligne ?|createApp(App) crée l'instance Vue en mémoire avec App.vue comme composant racine. .mount('#app') l'accroche sur <div id="app"> dans index.html — c'est là que Vue prend le contrôle du DOM et affiche le composant.
Pourquoi la page est-elle blanche si .mount() est oublié ?|createApp() crée l'instance en mémoire mais ne l'insère jamais dans le DOM. Aucune erreur console — juste silence. Le fix : chaîner .mount('#app') immédiatement après createApp().
Que signifie scoped dans <style scoped> ?|Vite ajoute un attribut unique (data-v-xxxx) aux éléments HTML du composant et suffixe les sélecteurs CSS avec cet attribut. Les styles ne peuvent donc s'appliquer qu'aux éléments de CE composant — pas d'effet de bord global.
Quelle est la règle pour le contenu de {{ }} ?|Une expression JavaScript qui produit une valeur — jamais une instruction (let, const, if, for, return). Valides : {{ userName.toUpperCase() }}, {{ price * qty }}, {{ ok ? 'oui' : 'non' }}.
Pourquoi <script setup> sans lang="ts" est dangereux ?|TypeScript est silencieusement désactivé : aucune erreur de type dans l'IDE ni via vue-tsc. Les bugs de type passent en production sans le moindre avertissement.
Quel est le rôle de main.ts dans un projet Vue 3 + Vite ?|C'est le seul fichier exécuté directement par Vite au démarrage. Il importe createApp, App.vue, les styles globaux, et monte l'application sur le DOM via .mount('#app').
Pourquoi n'y a-t-il pas de return {} dans <script setup> ?|<script setup> est du sucre syntaxique compilé par Vite : toutes les déclarations racines (variables, fonctions, imports de composants) sont automatiquement exposées au template. return {} n'est nécessaire que dans la setup() function classique.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-01-environnement/README.md`. Créer `WelcomeBanner.vue` de A à Z dans un vrai projet Vite, le brancher dans `App.vue`, et le vérifier dans le navigateur avec HMR et Vue DevTools — corrigé commenté intégral + variante J+30.
