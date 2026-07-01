# Lab 22 — SSR et hydration

> **Outcome :** à la fin, tu sais faire tourner un mini serveur Express avec `renderToString`, identifier et corriger trois mismatches d'hydration sur un composant Vue 3, et sérialiser l'état serveur vers le client via `window.__INITIAL_STATE__`.
> **Vrai outil :** `vue/server-renderer` (`renderToString`) + Express + Vite en mode SSR — pas de Nuxt, pas de boilerplate caché.
> **Feedback :** le coach valide en session (console propre = zéro warning `[Vue warn]: Hydration`).

---

## Énoncé

Tu travailles sur le front-office public de TribuZen. La page `/evenements` doit être rendue côté serveur pour le SEO. Un collègue a écrit un composant `EvenementsList.vue` — il fonctionne en CSR mais produit **trois mismatches** quand on le passe en SSR. Ton travail :

1. Bootstrapper le mini serveur SSR (Express + `renderToString`).
2. Faire tourner la page en SSR et observer les warnings dans la console.
3. Corriger les trois mismatches un par un.
4. Implémenter la sérialisation de l'état serveur → client pour éviter le double-fetch.

**Le composant starter (trois mismatches intentionnels) :**

```vue
<!-- src/components/EvenementsList.vue — STARTER avec 3 mismatches -->
<script setup lang="ts">
import { ref } from 'vue'

// Mismatch 1 : timestamp non-déterministe
const renderedAt = new Date().toLocaleTimeString('fr-FR')

// Mismatch 2 : accès window pendant setup() → crash serveur
const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0

// Mismatch 3 : Math.random() au render → valeur différente serveur/client
const sessionId = `session-${Math.random().toString(36).slice(2)}`

interface Evenement {
  id: string
  titre: string
  date: string
  participants: number
}

// Données fictives — seront remplacées par l'état sérialisé à l'étape 4
const evenements = ref<Evenement[]>([
  { id: 'e1', titre: 'Atelier Vue SSR', date: '2026-07-15', participants: 12 },
  { id: 'e2', titre: 'Meetup Nuxt Lyon', date: '2026-07-22', participants: 34 },
  { id: 'e3', titre: 'Workshop Hydration', date: '2026-08-05', participants: 8 },
])
</script>

<template>
  <section class="evenements">
    <header>
      <!-- Mismatch 1 : heure différente entre serveur et client -->
      <p class="meta">Page rendue à : {{ renderedAt }}</p>
      <!-- Mismatch 2 : 0 côté serveur, vraie valeur côté client -->
      <p class="meta">Viewport : {{ viewportWidth }}px</p>
      <!-- Mismatch 3 : ID aléatoire différent à chaque render -->
      <p class="meta" :data-session="sessionId">Session : {{ sessionId }}</p>
    </header>

    <ul>
      <li v-for="evt in evenements" :key="evt.id">
        <strong>{{ evt.titre }}</strong>
        <span>{{ evt.date }}</span>
        <span>{{ evt.participants }} participants</span>
      </li>
    </ul>
  </section>
</template>
```

**Pas de gap-fill** — tu construis le serveur et la correction complète à partir des starters ci-dessous.

---

## Starter du projet

Crée un projet Vite avec le template `vue-ts` :

```bash
pnpm create vite lab-22-ssr --template vue-ts
cd lab-22-ssr
pnpm install
pnpm add express
pnpm add -D @types/express
```

Structure finale attendue :

```
lab-22-ssr/
  src/
    app.ts                    ← createApp() partagé
    entry-client.ts           ← hydration côté client
    components/
      EvenementsList.vue      ← composant à corriger
  server/
    index.ts                  ← Express + renderToString
  index.html                  ← template HTML (placeholder <!--app-html-->)
  vite.config.ts
```

`index.html` starter — le serveur remplacera `<!--app-html-->` et `<!--initial-state-->` :

```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>TribuZen — Évènements</title>
  </head>
  <body>
    <div id="app"><!--app-html--></div>
    <!--initial-state-->
    <script type="module" src="/src/entry-client.ts"></script>
  </body>
</html>
```

---

## Étapes (en friction)

### Étape 1 — Bootstrapper le serveur SSR

Écris `src/app.ts` (logique partagée) et `server/index.ts` (Express).

**`src/app.ts` — tu l'écris sans aide :**

- Importer `createSSRApp` depuis `vue`
- Importer `EvenementsList` et le monter comme composant racine
- Exporter une fonction `createApp()` qui retourne `{ app }`

**`server/index.ts` — starter minimal :**

```ts
// server/index.ts — à compléter
import express from 'express'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderToString } from 'vue/server-renderer'
import { createApp } from '../src/app'

const app = express()

app.get('/', async (req, res) => {
  const { app: vueApp } = createApp()

  // TODO étape 1 : appeler renderToString(vueApp) et récupérer appHtml
  // TODO étape 1 : lire index.html, remplacer <!--app-html--> par appHtml
  // TODO étape 1 : res.send(html)
})

app.listen(3000, () => {
  console.log('SSR server → http://localhost:3000')
})
```

Lance le serveur : `npx ts-node server/index.ts` (ou `npx tsx server/index.ts`).

Ouvre `http://localhost:3000` et la console du navigateur. Tu dois voir les trois warnings `[Vue warn]: Hydration`.

### Étape 2 — Diagnostiquer les mismatches

Avant de corriger, **lis les warnings** et remplis ce tableau dans ta tête :

| Warning | Quel composant | Valeur serveur | Valeur client | Cause |
|---------|----------------|----------------|---------------|-------|
| Mismatch 1 | | | | |
| Mismatch 2 | | | | |
| Mismatch 3 | | | | |

Vérifier avec "View Source" (Ctrl+U) pour voir l'HTML que le serveur a envoyé.

### Étape 3 — Corriger les trois mismatches

Corrige `EvenementsList.vue` un mismatch à la fois, en rechargeant le serveur entre chaque.

**Ordre recommandé :**
1. Corriger le mismatch `sessionId` (Math.random) — le plus simple
2. Corriger le mismatch `renderedAt` (Date) — onMounted pattern
3. Corriger le mismatch `viewportWidth` (window) — onMounted pattern

Après chaque correction, vérifie que le warning correspondant a disparu de la console.

### Étape 4 — Sérialisation de l'état serveur → client

Actuellement les `evenements` sont hardcodés dans le composant. Simule un fetch côté serveur et sérialise les données dans le HTML.

1. Dans `server/index.ts`, déclare un tableau `evenements` (les mêmes données que dans le composant).
2. Injecte-les dans le HTML via `window.__INITIAL_STATE__` (avec l'escaping XSS obligatoire).
3. Dans `entry-client.ts`, lis `window.__INITIAL_STATE__` et passe les données à l'app via `provide`.
4. Dans `EvenementsList.vue`, remplace les données hardcodées par un `inject('initialEvenements')`.
5. Vérifie dans les Network DevTools : zéro requête fetch redondante côté client.

### Étape 5 — Valider que la console est propre

Critère de succès : ouvrir `http://localhost:3000` et voir **zéro** `[Vue warn]: Hydration` dans la console.

---

## Corrigé complet commenté

### `src/app.ts`

```ts
// src/app.ts — logique partagée serveur + client
// Ce fichier ne doit contenir AUCUN accès window/document/localStorage
import { createSSRApp, defineComponent, h } from 'vue'
import EvenementsList from './components/EvenementsList.vue'

export function createApp() {
  // createSSRApp (pas createApp) : active le mode hydration côté client
  // + produit le bon HTML pour renderToString côté serveur
  const app = createSSRApp(
    // Composant racine minimal — en vrai projet, importer App.vue
    defineComponent({
      setup() {
        return () => h(EvenementsList)
      }
    })
  )

  // Nouvelle instance à chaque appel → pas de contamination entre requêtes
  return { app }
}
```

### `server/index.ts`

```ts
// server/index.ts — Express SSR avec renderToString
import express from 'express'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path' 
import { renderToString } from 'vue/server-renderer'
import { createApp } from '../src/app'

const server = express()

// Données simulées (en vrai : appel DB / API)
const evenements = [
  { id: 'e1', titre: 'Atelier Vue SSR', date: '2026-07-15', participants: 12 },
  { id: 'e2', titre: 'Meetup Nuxt Lyon', date: '2026-07-22', participants: 34 },
  { id: 'e3', titre: 'Workshop Hydration', date: '2026-08-05', participants: 8 },
]

server.get('/', async (req, res) => {
  const { app } = createApp()

  // Provision des données dans l'app — accessible via inject() dans les composants
  app.provide('initialEvenements', evenements)

  // renderToString attend la résolution de tous les async setup()
  // avant de retourner le HTML
  const appHtml = await renderToString(app)

  // Lire le template HTML
  const template = readFileSync(resolve(__dirname, '../index.html'), 'utf-8')

  // Sérialisation XSS-safe — les caractères <, >, & dans le JSON
  // pourraient fermer prématurément la balise <script>
  const serializedState = JSON.stringify({ evenements })
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026')

  const stateScript = `<script>window.__INITIAL_STATE__ = ${serializedState}<\/script>`

  // Injection dans le template HTML
  const html = template
    .replace('<!--app-html-->', appHtml)
    .replace('<!--initial-state-->', stateScript)

  res.setHeader('Content-Type', 'text/html')
  res.send(html)
})

server.listen(3000, () => {
  console.log('SSR server → http://localhost:3000')
})
```

### `src/entry-client.ts`

```ts
// src/entry-client.ts — hydration côté client
// S'exécute dans le navigateur, jamais sur le serveur
import { createApp } from './app'

const { app } = createApp()

// Récupérer l'état sérialisé par le serveur
// window.__INITIAL_STATE__ est déjà disponible car le <script> inline
// s'exécute avant ce module (grâce à l'ordre dans index.html)
if (window.__INITIAL_STATE__?.evenements) {
  // Provision identique au serveur — l'inject() dans le composant
  // va récupérer ces données sans re-fetch
  app.provide('initialEvenements', window.__INITIAL_STATE__.evenements)
}

// mount() détecte le HTML existant (rendu par le serveur)
// → HYDRATION : attache les event listeners sur le DOM existant
// → ne recrée pas le DOM (createSSRApp active ce comportement)
app.mount('#app')
```

### `src/components/EvenementsList.vue` (corrigé)

```vue
<!-- EvenementsList.vue — CORRIGÉ : zéro mismatch -->
<script setup lang="ts">
import { ref, inject, onMounted } from 'vue'

interface Evenement {
  id: string
  titre: string
  date: string
  participants: number
}

// ✅ Correction mismatch 1 : valeur initiale déterministe (chaîne vide)
// Le serveur et le client rendent tous les deux "" → pas de mismatch
// onMounted ne s'exécute qu'après l'hydration côté client
const renderedAt = ref('')
onMounted(() => {
  renderedAt.value = new Date().toLocaleTimeString('fr-FR')
})

// ✅ Correction mismatch 2 : window interdit dans setup()
// Valeur initiale 0 = identique serveur et client → pas de mismatch
// onMounted → window existe ici
const viewportWidth = ref(0)
onMounted(() => {
  viewportWidth.value = window.innerWidth
})

// ✅ Correction mismatch 3 : ID généré une fois dans onMounted (côté client uniquement)
// Le serveur rend "" → pas de mismatch
// Le client génère l'ID APRÈS l'hydration → Vue met à jour le DOM sans mismatch
const sessionId = ref('')
onMounted(() => {
  sessionId.value = `session-${Math.random().toString(36).slice(2)}`
})

// ✅ Étape 4 : données injectées par le serveur (et par entry-client.ts)
// inject() est SSR-safe — s'exécute des deux côtés, pas d'accès browser
const initialData = inject<Evenement[]>('initialEvenements', [])
const evenements = ref<Evenement[]>(initialData)
// Pas de fetch redondant côté client : les données viennent de window.__INITIAL_STATE__
// via entry-client.ts → provide → inject ici
</script>

<template>
  <section class="evenements">
    <header>
      <!-- v-if masque le contenu jusqu'à l'initialisation côté client -->
      <!-- Le serveur rend l'élément absent → le client l'affiche après hydration -->
      <p v-if="renderedAt" class="meta">Page rendue à : {{ renderedAt }}</p>
      <p v-if="viewportWidth" class="meta">Viewport : {{ viewportWidth }}px</p>
      <p v-if="sessionId" class="meta" :data-session="sessionId">
        Session : {{ sessionId }}
      </p>
    </header>

    <ul>
      <!-- evenements est injecté depuis le serveur → disponible immédiatement -->
      <!-- Le SEO bot voit les <li> dans le HTML brut -->
      <li v-for="evt in evenements" :key="evt.id">
        <strong>{{ evt.titre }}</strong>
        <span>{{ evt.date }}</span>
        <span>{{ evt.participants }} participants</span>
      </li>
    </ul>
  </section>
</template>
```

### Typage `window.__INITIAL_STATE__`

```ts
// src/types/ssr.d.ts — déclaration globale pour TypeScript
export {}

interface Evenement {
  id: string
  titre: string
  date: string
  participants: number
}

declare global {
  interface Window {
    __INITIAL_STATE__?: {
      evenements?: Evenement[]
    }
  }
}
```

**Pourquoi ce corrigé est correct :**

- Tous les accès `window`/`Date`/`Math.random` sont dans `onMounted` — ils ne s'exécutent jamais côté serveur.
- Les valeurs initiales (`''`, `0`, `''`) sont déterministes : le serveur et le client rendent le même HTML au moment de l'hydration.
- `inject('initialEvenements')` reçoit les mêmes données côté serveur (via `app.provide` dans `server/index.ts`) et côté client (via `app.provide` dans `entry-client.ts`) — pas de double-fetch.
- L'escaping XSS sur `window.__INITIAL_STATE__` est obligatoire : un `</script>` dans les données fermerait prématurément la balise.

---

## Variante J+30 (fading)

**Même objectif, 30 minutes, sans ouvrir ce corrigé.**

Contraintes ajoutées :

1. Le composant `EvenementsList.vue` reçoit une **prop** `events: Evenement[]` au lieu d'un `inject`. Le serveur la passe via un composant wrapper, et `entry-client.ts` utilise `window.__INITIAL_STATE__` pour initialiser ce wrapper.
2. Ajoute un **deuxième composant** `EvenementsStats.vue` qui affiche le nombre total de participants (`computed` sur la prop) — ce composant doit aussi être SSR-safe (aucun accès navigateur).
3. Valide que `npx tsx server/index.ts` démarre sans erreur et que la console navigateur est propre.

**Critère de réussite :** "View Source" montre le HTML complet avec les données. Console navigateur = zéro `[Vue warn]`.

---

## Application TribuZen

Dans `smaurier/tribuzen`, cette logique SSR sera portée sur Nuxt (le module 23 et le cours 03 le couvrent). La correspondance directe :

| Lab (Vue brut) | TribuZen Nuxt |
|----------------|---------------|
| `server/index.ts` + `renderToString` | Serveur Nitro de Nuxt (automatique) |
| `app.provide('initialEvenements', data)` | `useAsyncData('evenements', ...)` |
| `window.__INITIAL_STATE__` | `useNuxtApp().payload` (Nuxt) |
| `onMounted(() => window.xxx)` | Identique dans Nuxt |
| `<ClientOnly>` | `<ClientOnly>` built-in Nuxt |

**Fichiers cibles immédiats dans `smaurier/tribuzen` :**

```
tribuzen/
  src/
    app.ts
    entry-client.ts
    components/
      evenements/
        EvenementsList.vue    ← version corrigée de ce lab
  server/
    index.ts                  ← à garder comme référence avant migration Nuxt
```

**Commit cible :**

```
feat(ssr): EvenementsList SSR-safe — corrige 3 mismatches, sérialise état serveur
```
