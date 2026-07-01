# Lab 35 — CI/CD monitoring

> **Outcome :** à la fin, tu sais instrumenter une app Vue avec Sentry (capture d'erreurs + ErrorBoundary), collecter les Core Web Vitals via `web-vitals` + `sendBeacon`, et bloquer un merge CI si le budget Lighthouse est dépassé.
> **Vrai outil :** `@sentry/vue`, `web-vitals`, `@lhci/cli` — JAMAIS un harnais simulé.
> **Feedback :** le coach valide en session (dashboard Sentry, beacon visible dans DevTools Network, rapport Lighthouse CI en CLI).

---

## Énoncé

Tu travailles sur TribuZen front. La PM a ouvert trois tickets suite à des retours utilisateurs :

- **TZ-201** — "On ne sait jamais quand l'app plante chez un utilisateur"
- **TZ-202** — "Le LCP de la page `/familles` est signalé comme lent sur mobile par Google Search Console"
- **TZ-203** — "On a besoin d'un filet de sécurité pour ne pas régresser en performance à chaque PR"

Tu traites les trois tickets dans une app Vue 3 Vite existante.

**Données de départ** — une app Vue 3 minimal starter avec :

```
src/
  App.vue
  main.ts
  router/index.ts
  components/
    FamilleDetail.vue    ← composant qui lève une erreur simulée
```

L'app tourne sur `http://localhost:5173` en dev, `http://localhost:4173` après `pnpm build && pnpm preview`.

**Pas de gap-fill** — tu écris chaque fichier complet à partir des starters ci-dessous.

---

### Starter 1 — `main.ts` à instrumenter

```ts
// main.ts — AVANT monitoring
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')
```

### Starter 2 — `FamilleDetail.vue` avec bug simulé

```vue
<!-- FamilleDetail.vue — AVANT ErrorBoundary -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Famille {
  id: string
  nom: string
  membres: string[]
}

const famille = ref<Famille | null>(null)

onMounted(async () => {
  // Simule une API qui retourne null (404 non géré)
  famille.value = null
})

// Bug : explose si famille.value === null (TypeError en production)
const nombreMembres = computed(() => famille.value.membres.length)
</script>

<template>
  <div>
    <h1>{{ famille?.nom }}</h1>
    <p>{{ nombreMembres }} membres</p>
  </div>
</template>
```

### Starter 3 — `lighthouserc.js` vide

```js
// lighthouserc.js — à compléter
module.exports = {
  ci: {
    collect: {
      // À toi : URL, startServerCommand, numberOfRuns
    },
    assert: {
      assertions: {
        // À toi : seuils performance, accessibility, LCP, CLS
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
```

---

## Étapes (en friction)

### Ticket TZ-201 — Sentry + ErrorBoundary

1. **Installe les dépendances Sentry**

   ```bash
   pnpm add @sentry/vue
   pnpm add -D @sentry/vite-plugin
   ```

2. **Configure `vite.config.ts`** — ajoute `sentryVitePlugin` avec `sourcemaps.filesToDeleteAfterUpload`, `build.sourcemap: true`. (Pour ce lab, utilise `process.env.SENTRY_AUTH_TOKEN ?? ''` — on ne publie pas vraiment de source maps, mais la config doit être correcte.)

3. **Instrumente `main.ts`** — ajoute `Sentry.init()` avec `app`, `dsn: import.meta.env.VITE_SENTRY_DSN`, `environment: import.meta.env.MODE`, `browserTracingIntegration({ router })`, `tracesSampleRate: 0`, `replaysOnErrorSampleRate: 1.0`. Crée un `.env.local` avec `VITE_SENTRY_DSN=https://fake@sentry.io/123` (valeur fictive pour le lab — pas de compte Sentry requis).

4. **Corrige le bug dans `FamilleDetail.vue`** — `computed` avec optional chaining + valeur par défaut. Le composant ne doit plus lever de TypeError.

5. **Crée `ErrorBoundary.vue`** dans `src/components/shared/` — `onErrorCaptured`, `ref<Error | null>(null)`, slot fallback avec bouton "Réessayer", `return false` pour stopper la propagation.

6. **Wrappe `<FamilleDetail />` dans `App.vue`** avec `<ErrorBoundary>`. Introduis temporairement une erreur volontaire dans `FamilleDetail.vue` (ex: `throw new Error('Bug simulé TribuZen')`) pour valider que l'ErrorBoundary l'attrape et affiche le fallback. Retire l'erreur après validation.

7. **Ouvre DevTools > Console** en dev — Sentry (mode DSN fictif) logge un warning `[Sentry] DSN invalid` — c'est normal. L'important est que l'initialisation ne casse pas l'app.

### Ticket TZ-202 — Web Vitals RUM

8. **Installe `web-vitals`**

   ```bash
   pnpm add web-vitals
   ```

9. **Crée `src/composables/useWebVitals.ts`** — importe `onCLS`, `onINP`, `onLCP`, `onFCP`, `onTTFB`. Écris `sendMetric(metric)` qui appelle `navigator.sendBeacon('/api/vitals', JSON.stringify({ name, value, rating }))`. Exporte `initWebVitals()` qui enregistre les 5 handlers.

10. **Appelle `initWebVitals()` dans `main.ts`** après `app.mount('#app')`.

11. **Valide dans DevTools Network** — navigue sur la page, puis ferme et rouvre l'onglet. Tu dois voir des requêtes POST vers `/api/vitals` dans l'onglet Network (statut 404 est normal — pas d'endpoint backend dans ce lab, `sendBeacon` envoie quand même).

### Ticket TZ-203 — Budget Lighthouse CI

12. **Installe `@lhci/cli`**

    ```bash
    pnpm add -D @lhci/cli
    ```

13. **Complète `lighthouserc.js`** — `url: ['http://localhost:4173/']`, `startServerCommand: 'pnpm preview'`, `numberOfRuns: 1` (pour rapidité en lab), seuils : `categories:performance minScore: 0.7`, `largest-contentful-paint maxNumericValue: 3000`, `cumulative-layout-shift maxNumericValue: 0.1`.

14. **Ajoute le script dans `package.json`** — `"lhci": "lhci autorun"`.

15. **Lance le build et Lighthouse CI**

    ```bash
    pnpm build
    pnpm lhci
    ```

    Observe le rapport. Si le score performance est sous 0.7, il sort avec exit code 1 — c'est le comportement CI attendu.

---

## Corrigé complet commenté

### `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  plugins: [
    vue(),
    // sentryVitePlugin après vue() — il post-traite le build
    sentryVitePlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN ?? '',
      org: 'tribuzen',
      project: 'tribuzen-front',
      release: {
        // Utilise le SHA du commit comme identifiant de release
        name: process.env.VITE_APP_VERSION ?? 'dev',
      },
      sourcemaps: {
        // Supprime les .map du dossier public après upload
        // Les source maps ne sont jamais exposées aux utilisateurs
        filesToDeleteAfterUpload: ['dist/**/*.map'],
      },
    }),
  ],
  build: {
    // Génère les source maps (désactivé par défaut en prod Vite)
    sourcemap: true,
  },
})
```

### `main.ts` instrumenté

```ts
import { createApp } from 'vue'
import * as Sentry from '@sentry/vue'
import App from './App.vue'
import router from './router'
import { initWebVitals } from './composables/useWebVitals'

const app = createApp(App)

// ── Sentry — doit précéder app.use() et app.mount() ──────────────────────
// La condition évite un crash si la variable d'env est absente
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    app,
    dsn: import.meta.env.VITE_SENTRY_DSN,
    // MODE = 'development' en dev, 'production' après build
    environment: import.meta.env.MODE,
    integrations: [
      // browserTracingIntegration trace chaque navigation Vue Router
      // comme une transaction Sentry (durée, erreurs associées)
      Sentry.browserTracingIntegration({ router }),
    ],
    // 0 en dev pour ne pas polluer les quotas Sentry
    // 0.2 en production = 1 session sur 5 tracée pour la perf
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 0,
    // 100% des sessions avec erreur enregistrées pour replay
    replaysOnErrorSampleRate: 1.0,
  })
}

app.use(router)
app.mount('#app')

// initWebVitals APRÈS mount — LCP nécessite le DOM monté pour être mesuré
initWebVitals()
```

### `src/composables/useWebVitals.ts`

```ts
import type { Metric } from 'web-vitals'
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals'

// sendMetric reçoit chaque métrique et l'envoie vers le backend
// sendBeacon : non-bloquant, survit à la fermeture d'onglet
// (critique pour CLS et INP qui sont finalisés en fin de session)
function sendMetric(metric: Metric): void {
  const payload = JSON.stringify({
    name: metric.name,           // 'LCP', 'INP', 'CLS', 'FCP', 'TTFB'
    value: metric.value,         // valeur brute (ms ou score)
    rating: metric.rating,       // 'good' | 'needs-improvement' | 'poor'
    id: metric.id,               // identifiant unique de la mesure
  })
  // navigator.sendBeacon est disponible dans tous les navigateurs modernes
  // En test : l'endpoint /api/vitals peut ne pas exister (404 OK pour le lab)
  navigator.sendBeacon('/api/vitals', payload)
}

// initWebVitals enregistre tous les handlers
// À appeler après app.mount() dans main.ts
export function initWebVitals(): void {
  onCLS(sendMetric)   // Cumulative Layout Shift (stabilité visuelle)
  onINP(sendMetric)   // Interaction to Next Paint (remplace FID depuis mars 2024)
  onLCP(sendMetric)   // Largest Contentful Paint (chargement contenu principal)
  onFCP(sendMetric)   // First Contentful Paint (premier pixel)
  onTTFB(sendMetric)  // Time to First Byte (latence réseau)
}
```

### `src/components/shared/ErrorBoundary.vue`

```vue
<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

// Stocke l'erreur capturée — null = pas d'erreur, affiche le slot
const error = ref<Error | null>(null)

// onErrorCaptured se déclenche pour toute erreur dans l'arbre des enfants
// (rendu, lifecycle hooks, event handlers)
onErrorCaptured((err) => {
  error.value = err
  // return false stoppe la propagation ascendante
  // L'erreur n'atteint PAS app.config.errorHandler (Sentry)
  // ⚠️ Si tu veux que Sentry reçoive quand même l'erreur :
  // importer Sentry et appeler Sentry.captureException(err) ici
  // AVANT le return false
  return false
})
</script>

<template>
  <!-- Fallback affiché si une erreur est capturée -->
  <div v-if="error" class="error-boundary">
    <p>Quelque chose s'est mal passé.</p>
    <!-- Réinitialise l'erreur — Vue re-rend les enfants depuis le slot -->
    <button @click="error = null">Réessayer</button>
  </div>
  <!-- Contenu normal — <slot /> = emplacement des composants enfants -->
  <slot v-else />
</template>
```

### `FamilleDetail.vue` corrigé

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Famille {
  id: string
  nom: string
  membres: string[]
}

const famille = ref<Famille | null>(null)

onMounted(async () => {
  // En vrai : fetch('/api/familles/abc123')
  famille.value = null  // simule un 404 non géré
})

// ✅ Optional chaining + nullish coalescing — ne lève plus de TypeError
// famille.value peut être null : ?. court-circuite, ?? 0 donne un défaut sûr
const nombreMembres = computed(() => famille.value?.membres?.length ?? 0)
</script>

<template>
  <div>
    <h1>{{ famille?.nom ?? 'Famille inconnue' }}</h1>
    <p>{{ nombreMembres }} membres</p>
  </div>
</template>
```

### `lighthouserc.js`

```js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4173/'],
      // Lance le serveur de preview Vite avant les audits
      startServerCommand: 'pnpm preview',
      // 1 run en lab pour la rapidité — 3 en CI réel pour la stabilité
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        // Score Lighthouse performance minimum (0-1)
        'categories:performance': ['error', { minScore: 0.7 }],
        // Accessibilité — cible haute dès le départ
        'categories:accessibility': ['error', { minScore: 0.9 }],
        // Core Web Vitals en ms
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        // Avertissement (warn) sans bloquer
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
      },
    },
    upload: {
      // Stockage temporaire gratuit — remplacer par un serveur LHCI en production
      target: 'temporary-public-storage',
    },
  },
}
```

**Comment lire la sortie Lighthouse CI :**

```
✅ categories:performance  score=0.82 (seuil 0.70)
✅ categories:accessibility score=0.95 (seuil 0.90)
✅ largest-contentful-paint 1240ms (seuil 3000ms)
✅ cumulative-layout-shift  0.02 (seuil 0.1)
⚠️ first-contentful-paint   2100ms (seuil 1800ms — warning, non bloquant)

Run completed with 0 error(s) and 1 warning(s). Exit code 0.
```

Si une assertion `error` échoue, exit code 1 — la pipeline CI bloque le merge.

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées :**

Reproduis l'instrumentation complète **de mémoire, sans ouvrir ce corrigé, en 35 minutes**, avec les modifications suivantes :

1. Dans `useWebVitals.ts`, envoie les métriques **à Sentry** via `getCurrentScope().setMeasurement(metric.name, metric.value, 'millisecond')` au lieu de `sendBeacon`. (⚠️ vérifier l'API Sentry exacte via Context7 avant d'implémenter.)
2. Ajoute un **seuil INP** dans `lighthouserc.js` — `interactive` maxNumericValue: 3800 ms (Time to Interactive comme proxy INP en Lighthouse lab).
3. L'`ErrorBoundary` doit **aussi appeler `Sentry.captureException(err)`** avant de stopper la propagation, pour que les erreurs catchées localement soient quand même suivies dans Sentry.

**Critère de réussite :** `pnpm lhci` sort avec exit 0, les beacons Web Vitals apparaissent dans DevTools Network, et l'ErrorBoundary affiche le fallback sans console error non capturée.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, les fichiers créés dans ce lab s'intègrent directement :

```
tribuzen/
  src/
    main.ts                          ← Sentry.init() + initWebVitals()
    composables/
      useWebVitals.ts                ← collecte RUM
    components/
      shared/
        ErrorBoundary.vue            ← wrapper pages critiques
  vite.config.ts                     ← sentryVitePlugin source maps
  lighthouserc.js                    ← budget perf
  .github/workflows/
    lhci.yml                         ← CI bloquant sur budget
```

**Différences par rapport au lab :**

- `VITE_SENTRY_DSN` est un vrai DSN (compte Sentry TribuZen) stocké dans les GitHub Secrets — jamais en clair dans le repo.
- `SENTRY_AUTH_TOKEN` est un token Sentry avec scope `project:releases` et `org:read` — stocké dans les GitHub Secrets.
- Les Web Vitals sont aussi corrélés avec `Sentry.setUser()` pour identifier les utilisateurs qui ont de mauvaises performances.
- Lighthouse CI tourne sur l'URL de preview Vercel (générée par chaque PR) plutôt que `localhost:4173`.

**Commit cible :**

```
feat(monitoring): Sentry + Web Vitals RUM + ErrorBoundary + Lighthouse CI budget
```
