# Lab 01 — Environnement et premier composant

> **Outcome :** à la fin, tu sais créer un SFC Vue 3 de A à Z, le monter dans `App.vue`, et l'inspecter avec les Vue DevTools.
> **Vrai outil :** Vite dev server (`pnpm dev`) + `pnpm typecheck` (vue-tsc) — le navigateur et TypeScript comme oracles.
> **Feedback :** le composant s'affiche dans le navigateur ET `pnpm typecheck` passe en vert.

---

## Énoncé

Tu crées `WelcomeBanner.vue`, le premier composant du front-office TribuZen. Il affiche un message de bienvenue contextuel (selon l'heure) et le prénom de l'utilisateur.

**Contraintes :**
- `<script setup lang="ts">` obligatoire — TypeScript activé
- Le prénom est une `ref<string>` (valeur hardcodée `'Alice'` pour l'instant)
- Le message change selon l'heure du jour : Bonjour (0h-12h) / Bon après-midi (12h-18h) / Bonsoir (18h-23h)
- `<style scoped>` — pas de pollution CSS globale
- Branché dans `App.vue` et visible sur `http://localhost:5173`

**Starter :** tu pars d'un projet créé avec `pnpm create vue@latest`, effaces le contenu généré dans `App.vue`, et crées `src/components/WelcomeBanner.vue` de A à Z.

---

## Étapes (en friction)

**Étape 1 — Scaffold le projet**

```bash
pnpm create vue@latest tribuzen-lab01
# Sélectionner : TypeScript ✅, ESLint ✅, Prettier ✅ — tout le reste : No

cd tribuzen-lab01
pnpm install
pnpm dev
```

Ouvre `http://localhost:5173`. Tu vois la page de démo générée par le scaffold. Laisse le serveur tourner dans ce terminal.

**Étape 2 — Nettoyer `App.vue`**

Ouvre `src/App.vue`. Efface tout son contenu. Remplace-le par un squelette minimal sans importer encore `WelcomeBanner` :

```vue
<template>
  <main><!-- WelcomeBanner arrivera ici --></main>
</template>
```

Sauvegarde. Le navigateur se met à jour via HMR — page blanche, c'est normal.

**Étape 3 — Créer `src/components/WelcomeBanner.vue`**

Crée le fichier vide. Construis les trois blocs dans l'ordre :

1. **`<script setup lang="ts">`** — importe `ref` depuis `'vue'`, déclare `userName = ref<string>('Alice')` et une constante `appVersion = '1.0.0'`. Écris la fonction `buildGreeting(name: string): string` qui retourne un message différent selon `new Date().getHours()`.
2. **`<template>`** — affiche `{{ buildGreeting(userName) }}` dans un `<h1>` et `{{ userName }}` dans un `<p>`. Entoure tout d'une `<div class="welcome-banner">`.
3. **`<style scoped>`** — donne au `h1` la couleur `#16a34a`, à `.welcome-banner` un fond `#f0fdf4` et un `padding: 2rem`.

Ne regarde pas le corrigé avant d'avoir une version qui fonctionne dans le navigateur.

**Étape 4 — Brancher dans `App.vue`**

Dans `App.vue`, importe `WelcomeBanner` depuis `'./components/WelcomeBanner.vue'` dans le `<script setup lang="ts">` et utilise `<WelcomeBanner />` dans le template. Sauvegarde — le composant doit apparaître sans rechargement.

**Étape 5 — Vérifier les types TypeScript**

```bash
# Dans un second terminal (le premier fait tourner pnpm dev)
pnpm typecheck
```

Zéro erreur = vert. Si une erreur apparaît, lis le message : il indique le fichier, la ligne, et la nature du problème. Les erreurs courantes à ce stade : `lang="ts"` manquant, `ref` non importé.

**Étape 6 — Explorer avec Vue DevTools**

Installe l'extension Vue DevTools (Chrome/Firefox/Edge — recherche "Vue Devtools" dans le store de ton navigateur). Ouvre F12 → onglet "Vue". Tu dois voir :

- La hiérarchie `App → WelcomeBanner`
- Les valeurs `userName: "Alice"` et `appVersion: "1.0.0"` dans le panneau de détails

Modifie `userName` directement dans les DevTools — le template se met à jour en temps réel. C'est la réactivité en action.

---

## Corrigé complet commenté

### `src/main.ts` (généré par le scaffold — ne pas modifier)

```ts
// main.ts — point d'entrée unique, exécuté directement par Vite
import { createApp } from 'vue'
import App from './App.vue'
import './style.css'       // import sans variable = injection du CSS global

// createApp(App) : crée l'instance Vue en mémoire, App.vue comme racine
// .mount('#app') : accroche l'instance sur <div id="app"> dans index.html
// Sans .mount(), l'application existe en mémoire mais rien ne s'affiche
createApp(App).mount('#app')
```

### `src/App.vue` — version minimale

```vue
<script setup lang="ts">
// Avec <script setup>, l'import du composant suffit
// Pas de components: {} à déclarer — c'est un avantage majeur de <script setup>
import WelcomeBanner from './components/WelcomeBanner.vue'
</script>

<template>
  <!-- Fragment Vue 3 : <main> seul à la racine du template — pas de div wrapper -->
  <main>
    <!-- WelcomeBanner est utilisé comme un tag HTML standard -->
    <!-- Vue reconnaît les PascalCase (WelcomeBanner) comme des composants -->
    <WelcomeBanner />
  </main>
</template>

<!-- Pas de <style> ici : App.vue délègue le style à ses composants enfants -->
```

### `src/components/WelcomeBanner.vue` — corrigé complet

```vue
<script setup lang="ts">
// ─── Imports ──────────────────────────────────────────────────────────────────
// Import OBLIGATOIRE : Vue ne fait pas d'auto-import dans <script setup> par défaut
// ref() : enveloppe une valeur pour la rendre réactive (mécanisme détaillé au module 03)
import { ref } from 'vue'

// ─── État réactif ──────────────────────────────────────────────────────────────
// ref<string>('Alice') : TypeScript sait que userName contient une string
// Dans le template, Vue auto-unwrap les refs → on écrit {{ userName }}, pas {{ userName.value }}
const userName = ref<string>('Alice')

// ─── Constante non réactive ────────────────────────────────────────────────────
// Pas besoin de ref si la valeur ne change jamais dans ce composant
// TypeScript infère le type string depuis la valeur initiale
const appVersion = '1.0.0'

// ─── Fonction utilitaire ────────────────────────────────────────────────────────
// Toutes les déclarations racines dans <script setup> sont auto-exposées au template
// Paramètre et retour typés explicitement : bonne pratique TS (module 00)
function buildGreeting(name: string): string {
  const hour = new Date().getHours()
  // 0h–11h59 : matin
  if (hour < 12) return `Bonjour ${name} !`
  // 12h–17h59 : après-midi
  if (hour < 18) return `Bon après-midi ${name} !`
  // 18h–23h59 : soir
  return `Bonsoir ${name} !`
}
</script>

<template>
  <!--
    La div racine reçoit un attribut data-v-xxxx par Vite (mécanisme scoped CSS)
    Ce attribut est invisible dans le HTML source — visible dans les DevTools navigateur
  -->
  <div class="welcome-banner">

    <!--
      buildGreeting(userName) : appel de fonction dans {{ }}
      userName est Ref<string> — Vue auto-unwrap dans le template :
      buildGreeting reçoit la string 'Alice', pas l'objet RefImpl
      ERREUR CLASSIQUE : écrire buildGreeting(userName.value) dans le template
      — ça fonctionne aussi, mais ce n'est pas idiomatique Vue
    -->
    <h1>{{ buildGreeting(userName) }}</h1>

    <!-- userName auto-unwrappé = 'Alice' directement dans le template -->
    <p>Connecté en tant que <strong>{{ userName }}</strong></p>

    <!--
      Expression string dans {{ }} : concaténation directe
      appVersion est une string ordinaire (pas un Ref) — pas d'auto-unwrap nécessaire
    -->
    <p class="version">TribuZen v{{ appVersion }}</p>

  </div>
</template>

<style scoped>
/*
  scoped : Vite compile ce bloc en ajoutant un attribut unique à chaque sélecteur.
  Résultat compilé (exemple) :
    .welcome-banner[data-v-3a1b2c] { ... }
    h1[data-v-3a1b2c] { ... }

  Ces sélecteurs ne peuvent jamais cibler des éléments d'un autre composant,
  même si celui-ci a une classe .welcome-banner ou un <h1> identique.
*/

.welcome-banner {
  padding: 2rem;
  border-radius: 0.75rem;
  background: #f0fdf4;           /* vert très pâle — palette TribuZen */
  max-width: 600px;
  margin: 2rem auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

h1 {
  /* Ce sélecteur ne cible QUE les <h1> de WelcomeBanner */
  color: #16a34a;                /* vert TribuZen */
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

p {
  color: #374151;
  margin: 0.25rem 0;
}

.version {
  font-size: 0.8rem;
  color: #9ca3af;                /* gris clair — texte secondaire */
  margin-top: 1rem;
}
</style>
```

---

## Variante J+30 (fading)

**Même composant, page blanche, 20 minutes, corrigé interdit.**

Crée un `WelcomeBanner.vue` de mémoire avec ces contraintes (légèrement plus dures) :

- `userName = ref<string>('Alice')` et `familyName = ref<string>('Dupont')`
- `fullGreeting` : une **constante** (pas de ref) qui combine les deux en une expression — comment la déclarer pour qu'elle reste lisible dans le template avec `{{ }}`? (réfléchis avant de te souvenir du mécanisme approprié)
- `buildGreeting` retourne maintenant l'un des trois types littéraux `'Bonjour' | 'Bon après-midi' | 'Bonsoir'` — annote le type de retour en conséquence
- Le template affiche `{{ fullGreeting.toUpperCase() }}`
- `pnpm typecheck` doit passer en vert

> **Contrainte bonus :** si tu utilises `computed` pour `fullGreeting`, tu anticipes le module 03. C'est une solution valide — mais comprends pourquoi une simple constante `const fullGreeting = \`${userName.value} ${familyName.value}\`` ne fonctionnerait PAS dans ce contexte (réfléchis à ce qui se passe quand `userName.value` change).

---

## Application TribuZen

**Objectif :** faire tourner `WelcomeBanner.vue` dans le vrai repo `smaurier/tribuzen`.

**Steps :**

1. Copie `WelcomeBanner.vue` dans `tribuzen/src/components/WelcomeBanner.vue`.
2. Dans `tribuzen/src/App.vue`, importe et utilise `<WelcomeBanner />`.
3. Lance `pnpm dev` dans le repo tribuzen — le composant doit s'afficher sur `localhost:5173`.
4. Lance `pnpm typecheck` — zéro erreur attendu.
5. Commit :

```bash
git add src/components/WelcomeBanner.vue src/App.vue
git commit -m "feat(ui): WelcomeBanner — premier SFC TribuZen (lab-01)"
```

**Vérification de transfert :** ouvre les Vue DevTools sur `localhost:5173` dans le repo tribuzen. La hiérarchie `App → WelcomeBanner` doit être visible avec `userName` dans le panneau d'état. C'est la preuve que le composant fonctionne dans le vrai produit, pas seulement dans le lab.
