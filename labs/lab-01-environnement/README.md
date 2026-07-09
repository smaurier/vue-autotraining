# Lab 01 — Environnement et premier composant

> **Outcome :** à la fin, tu sais créer un SFC Vue 3 complet (`<script setup lang="ts">`, `<template>`, `<style scoped>`) de A à Z, le brancher dans `App.vue`, et le vérifier dans le navigateur avec HMR et Vue DevTools.
> **Vrai outil :** Vite dev server (`pnpm dev`) + `pnpm typecheck` (vue-tsc) — le navigateur et TypeScript comme oracles.
> **Feedback :** le composant s'affiche dans le navigateur ET `pnpm typecheck` passe en vert.

---

## Énoncé

Tu crées `WelcomeBanner.vue`, le premier composant du front-office TribuZen. Voici le cahier des charges **exact** :

1. Un bloc `<script setup lang="ts">` avec :
   - `userName` : une `ref<string>` initialisée à `'Alice'`
   - `appVersion` : une constante string `'1.0.0'` (pas de `ref` — la valeur ne change pas)
   - `buildGreeting(name: string): string` : retourne `'Bonjour <name> !'` (0h–11h), `'Bon après-midi <name> !'` (12h–17h), `'Bonsoir <name> !'` (18h–23h)
2. Un `<template>` qui affiche :
   - le résultat de `buildGreeting(userName)` dans un `<h1>` via interpolation
   - `userName` dans un `<p>` (texte « Connecté en tant que **Alice** »)
   - `appVersion` dans un second `<p>` (texte « TribuZen v1.0.0 »)
3. Un `<style scoped>` avec au minimum : couleur `#16a34a` pour le `h1`, fond `#f0fdf4` et `padding: 2rem` pour `.welcome-banner`.
4. Branché dans `App.vue` — visible sur `http://localhost:5173`.

**Pas de gap-fill** — tu écris le composant complet à partir du starter minimal ci-dessous.

### Starter minimal

Scaffold le projet puis crée `src/components/WelcomeBanner.vue` :

```bash
pnpm create vue@latest tribuzen-lab01
# TypeScript ✅  ESLint ✅  Prettier ✅  — tout le reste : No
cd tribuzen-lab01 && pnpm install
```

```vue
<!-- src/components/WelcomeBanner.vue — starter -->
<script setup lang="ts">
import { ref } from 'vue'

// À toi : déclare userName (ref<string>), appVersion (constante), buildGreeting
</script>

<template>
  <div class="welcome-banner">
    <!-- À toi : h1 avec buildGreeting, p connecté, p version -->
  </div>
</template>

<style scoped>
/* À toi : .welcome-banner, h1, .version */
</style>
```

Lance `pnpm dev` et branche `WelcomeBanner` dans `App.vue` avant de regarder le corrigé.

---

## Étapes (en friction)

1. **Scaffold et nettoyage** — Crée le projet avec `pnpm create vue@latest`, installe, lance `pnpm dev`. Ouvre `src/App.vue` et vide-le (garde juste `<template><main></main></template>`). Le serveur se met à jour via HMR — page blanche attendue.
2. **Déclare l'état réactif** — Dans `<script setup lang="ts">`, importe `ref` depuis `'vue'` et déclare `userName = ref<string>('Alice')`. Déclare aussi `appVersion = '1.0.0'` sans `ref`.
3. **Écris `buildGreeting`** — Fonction typée `(name: string): string`. Utilise `new Date().getHours()` et deux `if` pour couvrir les trois plages horaires. Retourne le message avec le prénom interpolé via template literal.
4. **Écris le template** — Ajoute un `<h1>` avec <code v-pre>{{ buildGreeting(userName) }}</code>, un `<p>` avec <code v-pre>{{ userName }}</code>, un `<p class="version">` avec <code v-pre>{{ appVersion }}</code>. Entoure d'une `<div class="welcome-banner">`.
5. **Écris le style scoped** — Applique couleur, fond, padding. Vérifie dans les DevTools navigateur que l'attribut `data-v-xxxx` est bien présent sur les éléments — c'est la signature du scoping Vite.
6. **Branche dans `App.vue`** — Importe `WelcomeBanner` dans `<script setup lang="ts">`, utilise `<WelcomeBanner />` dans le template. Sauvegarde — le composant apparaît sans rechargement de page.
7. **Vérifie les types** — Lance `pnpm typecheck` dans un second terminal. Zéro erreur attendu. Erreurs courantes à ce stade : `lang="ts"` manquant sur le `<script>`, `ref` non importé.
8. **Explore les DevTools** — Ouvre F12 → onglet Vue. Vérifie la hiérarchie `App → WelcomeBanner` et la valeur `userName: "Alice"`. Modifie `userName` directement dans les DevTools — le template se met à jour : c'est la réactivité Vue en action.

---

## Corrigé complet commenté

### `src/main.ts` (généré par le scaffold — ne pas modifier)

```ts
// main.ts — seul fichier exécuté directement par Vite au démarrage
import { createApp } from 'vue'
import App from './App.vue'
import './style.css'    // import sans variable = injection du CSS global

// createApp(App) : crée l'instance Vue en mémoire, App.vue comme composant racine
// .mount('#app') : accroche l'instance sur <div id="app"> dans index.html
// Sans .mount(), l'application existe en mémoire mais rien ne s'affiche — page blanche silencieuse
createApp(App).mount('#app')
```

### `src/App.vue`

```vue
<!-- App.vue — composant racine, parent de tous les composants TribuZen -->
<script setup lang="ts">
// Import du composant suffit avec <script setup> — pas de components: {} à déclarer
// C'est un avantage clé de <script setup> par rapport à l'Options API
import WelcomeBanner from './components/WelcomeBanner.vue'
</script>

<template>
  <!-- Fragment Vue 3 : un seul élément racine suffit, pas de div wrapper obligatoire -->
  <main>
    <!-- Vue reconnaît le PascalCase (WelcomeBanner) comme composant
         vs les éléments HTML natifs en lowercase (div, main, p...) -->
    <WelcomeBanner />
  </main>
</template>

<!-- Pas de <style> ici : App.vue délègue le style à ses composants enfants -->
```

### `src/components/WelcomeBanner.vue`

```vue
<!-- WelcomeBanner.vue — premier SFC TribuZen -->
<script setup lang="ts">
// ─── Import ────────────────────────────────────────────────────────────────────
// Import OBLIGATOIRE : Vue ne fait pas d'auto-import de ref dans <script setup> par défaut
// Erreur classique si oublié : ReferenceError: ref is not defined au runtime
import { ref } from 'vue'

// ─── État réactif ──────────────────────────────────────────────────────────────
// ref<string>('Alice') : TypeScript sait que userName contient une string
// Dans le template, Vue auto-unwrap les refs :
//   on écrit {{ userName }} et non {{ userName.value }}
const userName = ref<string>('Alice')

// ─── Constante non réactive ────────────────────────────────────────────────────
// Pas de ref : la valeur ne changera jamais dans ce composant
// TypeScript infère string depuis la valeur initiale — annotation explicite inutile ici
const appVersion = '1.0.0'

// ─── Fonction utilitaire ────────────────────────────────────────────────────────
// Déclarée au niveau racine de <script setup> → auto-exposée au template (pas de return {})
// Paramètre et retour typés explicitement : bonne pratique TS (module 00)
function buildGreeting(name: string): string {
  const hour = new Date().getHours()
  // 0h–11h59 → matin
  if (hour < 12) return `Bonjour ${name} !`
  // 12h–17h59 → après-midi
  if (hour < 18) return `Bon après-midi ${name} !`
  // 18h–23h59 → soir (cas restant — pas de troisième if nécessaire)
  return `Bonsoir ${name} !`
}
</script>

<template>
  <!--
    La div racine reçoit un attribut data-v-xxxx par Vite (mécanisme <style scoped>)
    Cet attribut est invisible dans le HTML source — visible dans les DevTools navigateur
  -->
  <div class="welcome-banner">

    <!--
      buildGreeting(userName) : appel de fonction dans l'interpolation
      userName est Ref<string> — Vue auto-unwrap dans le template :
      buildGreeting reçoit la string 'Alice', pas l'objet RefImpl
      Idiome incorrect : buildGreeting(userName.value) fonctionne aussi
      mais n'est pas idiomatique — dans le template, on écrit userName sans .value
    -->
    <h1>{{ buildGreeting(userName) }}</h1>

    <!-- userName auto-unwrappé = 'Alice' directement dans le DOM -->
    <p>Connecté en tant que <strong>{{ userName }}</strong></p>

    <!--
      appVersion est une string ordinaire (pas un Ref) — pas d'auto-unwrap nécessaire
      L'expression insère simplement '1.0.0' dans le HTML
    -->
    <p class="version">TribuZen v{{ appVersion }}</p>

  </div>
</template>

<style scoped>
/*
  scoped : Vite ajoute un attribut unique (data-v-xxxx) aux éléments du composant
  et suffixe chaque sélecteur CSS avec cet attribut.
  Résultat compilé (exemple) :
    .welcome-banner[data-v-3a1b2c] { ... }
    h1[data-v-3a1b2c] { ... }
  Ces sélecteurs ne peuvent cibler aucun élément d'un autre composant,
  même si celui-ci a la même classe ou le même tag.
*/

.welcome-banner {
  padding: 2rem;
  border-radius: 0.75rem;
  background: #f0fdf4;          /* vert très pâle — palette TribuZen */
  max-width: 600px;
  margin: 2rem auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

h1 {
  /* Ce sélecteur ne cible QUE les <h1> de WelcomeBanner grâce à scoped */
  color: #16a34a;               /* vert TribuZen */
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

p {
  color: #374151;
  margin: 0.25rem 0;
}

.version {
  font-size: 0.8rem;
  color: #9ca3af;               /* gris clair — texte secondaire */
  margin-top: 1rem;
}
</style>
```

**Pourquoi ce corrigé est correct :**
- `ref<string>('Alice')` est typé explicitement : TypeScript sait que `userName.value` est une `string` — toute assignation d'un nombre ou booléen lèvera une erreur de type.
- `buildGreeting` reçoit `name: string` et retourne `string` — le type de retour explicite force la fonction à couvrir tous les cas (TS refuse un retour `undefined` implicite).
- `<style scoped>` sans l'attribut `scoped` aurait pollué le `h1` global de toute l'application — à ce stade du scaffold, ça casse le titre de la page de démo Vite.
- Le composant ne contient pas de `return {}` : c'est `<script setup>` qui auto-expose toutes les déclarations racines au template.

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées :**

Reproduis `WelcomeBanner.vue` **de mémoire, en 20 minutes**, avec les modifications suivantes :

1. Ajoute `familyName = ref<string>('Dupont')`.
2. Affiche le message de bienvenue avec le nom complet : `'Bonjour Alice Dupont !'`. Construis la concaténation dans le `<script>` — pas en inline dans le template.
3. `buildGreeting` retourne l'un des trois **types littéraux** `'Bonjour' | 'Bon après-midi' | 'Bonsoir'` — annote le type de retour en conséquence. Le message complet est assemblé séparément.
4. **Sans ouvrir ce corrigé** ni le module 01.

**Critère de réussite :** le composant fonctionne dans le navigateur ET `pnpm typecheck` passe en vert.

> **Piège intentionnel :** pour afficher le nom complet réactif, une simple constante `const fullName = \`${userName.value} ${familyName.value}\`` ne réagit **pas** aux changements ultérieurs de `userName` ou `familyName`. Pourquoi ? Réfléchis avant de chercher la réponse dans le module 03 (`computed`).

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, `WelcomeBanner.vue` vit ici :

```
tribuzen/
  src/
    main.ts                   ← createApp(App).mount('#app') — ne pas modifier
    App.vue                   ← racine, importe WelcomeBanner
    components/
      WelcomeBanner.vue       ← premier SFC TribuZen — ce lab
```

**Différences par rapport au lab :**

- `userName` viendra du store Pinia (module avancé 02) une fois celui-ci introduit. Pour l'instant, la valeur hardcodée `'Alice'` est acceptable.
- Le style sera progressivement remplacé par des variables CSS TribuZen (`--color-primary`, `--color-surface`) définis dans `App.vue` — mais la logique `<style scoped>` reste identique.
- `main.ts` dans TribuZen sera enrichi avec `.use(router)` et `.use(createPinia())` (modules avancés) — la ligne `createApp(App).mount('#app')` reste inchangée.

**Commit cible :**

```bash
git add src/components/WelcomeBanner.vue src/App.vue
git commit -m "feat(ui): WelcomeBanner — premier SFC TribuZen (lab-01)"
```

**Vérification de transfert :** ouvre les Vue DevTools sur `localhost:5173` dans le repo tribuzen. La hiérarchie `App → WelcomeBanner` doit être visible avec `userName` dans le panneau d'état — c'est la preuve que le composant fonctionne dans le vrai produit, pas seulement dans le lab.
