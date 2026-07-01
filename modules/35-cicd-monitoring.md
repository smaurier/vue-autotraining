---
titre: CI/CD — monitoring
cours: 02-vue
notions: [suivi des erreurs front avec Sentry, capture d'erreurs Vue errorHandler, Core Web Vitals en production RUM, analytics respectueux de la vie privée, source maps et release tracking, alerting, budget de performance en CI Lighthouse]
outcomes:
  - sait instrumenter une app Vue pour le suivi d'erreurs (Sentry)
  - sait mesurer les Core Web Vitals en production (RUM)
  - sait uploader les source maps et suivre les releases
  - sait poser un budget de performance vérifié en CI
prerequis: [34-cicd-deploiement]
next: 36-graphql-vue3
libs: [{ name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — Sentry sur le front (erreurs + perf), Core Web Vitals suivis, budget Lighthouse en CI
last-reviewed: 2026-07
---

← [34 — CI/CD déploiement](34-cicd-deploiement.md)

# CI/CD — monitoring

> **Outcomes — tu sauras FAIRE :** instrumenter une app Vue avec Sentry (erreurs + source maps + release), mesurer les Core Web Vitals en production, poser un budget Lighthouse en CI.
> **Difficulté :** :star::star::star:

---

## 1. Cas concret d'abord

TribuZen vient de sortir en production. Deux jours plus tard, le support reçoit ce message d'un utilisateur :

> "L'app plante quand j'essaie d'accéder à ma famille. Écran blanc. Réessayé trois fois."

Tu ouvres les DevTools sur ton poste — tout fonctionne. Tu regardes les logs NestJS — aucune erreur serveur. L'utilisateur n'a pas précisé son navigateur ni la page exacte. Tu n'as **aucune visibilité** sur ce qui s'est passé côté front.

Trois problèmes se cumulent :

1. **Aucun error tracking** — l'exception JavaScript a été levée chez cet utilisateur et s'est évaporée dans le navigateur sans laisser de trace.
2. **Aucune source map en production** — même si tu avais un crash report, la stack trace ne montre que `main.js:1:38421`. Impossible à localiser.
3. **Aucun suivi de performance** — tu ne sais pas si le LCP de la page famille est à 1,2 s ou 8 s chez les utilisateurs mobiles.

Ce module te donne les outils pour résoudre ces trois angles morts, plus deux complémentaires (analytics privacy-first, alerting).

---

## 2. Théorie complète, concise

### 2.1 Sentry — suivi d'erreurs front

Sentry est un service SaaS (plan gratuit généreux) qui capture automatiquement les exceptions JavaScript non gérées, les Promise rejetées, et les erreurs Vue, puis les envoie à un dashboard avec contexte complet (user-agent, URL, breadcrumbs, stack trace).

**Installation**

```bash
pnpm add @sentry/vue
# Plugin Vite pour source maps + release tracking
pnpm add -D @sentry/vite-plugin
```

**Initialisation dans `main.ts`**

```ts
// main.ts
import { createApp } from 'vue'
import { createRouter } from 'vue-router'
import * as Sentry from '@sentry/vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

Sentry.init({
  app,
  // DSN unique à ton projet — ne jamais hardcoder, passer via variable d'env Vite
  dsn: import.meta.env.VITE_SENTRY_DSN,
  // Distingue production / staging / development dans le dashboard
  environment: import.meta.env.MODE,
  // Intègre Vue Router : chaque navigation devient une transaction Sentry
  integrations: [
    Sentry.browserTracingIntegration({ router }),
  ],
  // 20 % des sessions tracées pour la perf — ajuste selon volume
  tracesSampleRate: 0.2,
  // 100 % des sessions avec erreur enregistrées pour replay
  replaysOnErrorSampleRate: 1.0,
})

app.use(router)
app.mount('#app')
```

La ligne `app` passée à `Sentry.init()` est clé — elle branche Sentry sur le `app.config.errorHandler` de Vue automatiquement (voir §2.2).

### 2.2 `app.config.errorHandler` — le crochet global Vue

Vue expose `app.config.errorHandler` pour intercepter toutes les erreurs non gérées dans les composants (rendu, lifecycle hooks, event handlers). Sans Sentry, on peut l'utiliser seul pour logger ou envoyer vers un endpoint custom.

```ts
// main.ts — standalone, sans Sentry
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

// Signature : (err, instance, info)
// err      = l'erreur JS
// instance = l'instance de composant Vue (peut être null)
// info     = string décrivant le hook Vue concerné ('mounted hook', etc.)
app.config.errorHandler = (err, instance, info) => {
  // Envoyer vers un backend ou un service de monitoring
  fetch('/api/front-errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: err instanceof Error ? err.message : String(err),
      component: instance?.$options.name ?? 'unknown',
      vueInfo: info,
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {/* silently fail */})
}

app.mount('#app')
```

Quand Sentry est initialisé avec `app`, il pose son propre `errorHandler` qui capture l'erreur, l'envoie à Sentry, puis appelle l'éventuel handler précédent en chaîne.

**`onErrorCaptured` (niveau composant)** permet d'attraper les erreurs des enfants d'un composant spécifique — utile pour un ErrorBoundary :

```vue
<!-- ErrorBoundary.vue -->
<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const error = ref<Error | null>(null)

onErrorCaptured((err) => {
  error.value = err
  // false = stoppe la propagation (l'erreur n'atteint pas errorHandler global)
  return false
})
</script>

<template>
  <div v-if="error" class="error-boundary">
    <p>Une erreur est survenue.</p>
    <button @click="error = null">Réessayer</button>
  </div>
  <slot v-else />
</template>
```

### 2.3 Source maps et release tracking

Sans source maps, la stack trace en production ressemble à `at r (main.js:1:38421)`. Avec source maps, Sentry affiche le vrai fichier TypeScript, la vraie ligne, la vraie variable.

**Ne jamais exposer les source maps publiquement** — elles révèlent le code source. La bonne pratique : les générer, les uploader à Sentry, puis les supprimer du build final.

`@sentry/vite-plugin` automatise tout cela dans la pipeline CI/CD :

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  plugins: [
    vue(),
    // ⚠️ Ce plugin doit être APRÈS @vitejs/plugin-vue
    sentryVitePlugin({
      // Token d'accès Sentry (depuis Settings > Auth Tokens)
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: 'tribuzen',
      project: 'tribuzen-front',
      // Crée automatiquement une release Sentry avec le SHA du commit
      release: {
        name: process.env.VITE_APP_VERSION ?? 'unknown',
      },
      // Upload les source maps et les supprime du dossier dist
      sourcemaps: {
        filesToDeleteAfterUpload: ['dist/**/*.map'],
      },
    }),
  ],
  build: {
    // Génère les source maps (désactivé par défaut en prod)
    sourcemap: true,
  },
})
```

Dans GitHub Actions, exposer les secrets :

```yaml
# .github/workflows/deploy.yml (extrait)
- name: Build and upload source maps
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    VITE_APP_VERSION: ${{ github.sha }}
    VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}
  run: pnpm build
```

### 2.4 Core Web Vitals en production — RUM

Le RUM (Real User Monitoring) mesure les Core Web Vitals réels chez les vrais utilisateurs, pas dans un lab Lighthouse. Les deux approches sont complémentaires.

**Core Web Vitals actuels (2024+)** — INP remplace FID depuis mars 2024 :

| Métrique | Signification | Seuil "bon" |
|----------|---------------|-------------|
| LCP | Largest Contentful Paint — contenu principal visible | < 2,5 s |
| INP | Interaction to Next Paint — réactivité globale aux interactions | < 200 ms |
| CLS | Cumulative Layout Shift — stabilité visuelle | < 0,1 |
| FCP | First Contentful Paint — premier pixel affiché | < 1,8 s |
| TTFB | Time to First Byte — latence réseau/serveur | < 800 ms |

> ⚠️ À vérifier Context7 : `web-vitals` v3+ supporte `onINP` (INP remplace FID) — confirmer la signature exacte si la version change.

**Collecte avec la lib `web-vitals`**

```bash
pnpm add web-vitals
```

```ts
// composables/useWebVitals.ts
import type { Metric } from 'web-vitals'
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals'

function sendToSentry(metric: Metric): void {
  // Sentry accepte les mesures custom via captureEvent ou setMeasurement
  // ⚠️ À vérifier Context7 : API Sentry pour custom measurements
  import('@sentry/vue').then(({ getCurrentScope }) => {
    getCurrentScope().setTag(`vital.${metric.name}`, metric.rating)
  })
  // Fallback : beacon vers endpoint propre
  navigator.sendBeacon('/api/vitals', JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,  // 'good' | 'needs-improvement' | 'poor'
    id: metric.id,
  }))
}

export function initWebVitals(): void {
  onCLS(sendToSentry)
  onINP(sendToSentry)
  onLCP(sendToSentry)
  onFCP(sendToSentry)
  onTTFB(sendToSentry)
}
```

Appeler `initWebVitals()` dans `main.ts` après `app.mount()`.

**Pourquoi `sendBeacon` plutôt que `fetch`** : `sendBeacon` est non-bloquant et survit à la fermeture de l'onglet — critique pour les métriques collectées en fin de session (CLS, INP sont finalisés tard).

### 2.5 Analytics respectueux de la vie privée

Les analytics classiques (Google Analytics 4) impliquent des cookies tiers, du tracking cross-site, et une base de données aux États-Unis — problèmes RGPD réels.

Alternatives privacy-first :

| Outil | Hébergement | Cookies | RGPD |
|-------|-------------|---------|------|
| Plausible | Cloud ou self-hosted | Non | Oui — données EU |
| Umami | Self-hosted (PostgreSQL) | Non | Oui — données chez toi |
| PostHog | Cloud ou self-hosted | Session-only | Oui |
| Fathom | Cloud | Non | Oui |

**Intégration Plausible dans Vue (sans consent banner)**

```ts
// plugins/plausible.ts
// Plausible s'intègre via un script léger (<1 KB) — pas de SDK NPM nécessaire
export function initPlausible(domain: string): void {
  const script = document.createElement('script')
  script.defer = true
  script.dataset['domain'] = domain
  script.src = 'https://plausible.io/js/script.js'
  document.head.appendChild(script)
}

// Tracking d'un événement custom (ex: clic sur "Créer une famille")
export function trackEvent(name: string, props?: Record<string, string>): void {
  // window.plausible est injecté par le script Plausible
  if (typeof window !== 'undefined' && 'plausible' in window) {
    ;(window as unknown as { plausible: (n: string, o?: object) => void }).plausible(name, {
      props,
    })
  }
}
```

```ts
// main.ts
import { initPlausible } from './plugins/plausible'

// En production uniquement — pas de tracking en dev/staging
if (import.meta.env.PROD) {
  initPlausible('tribuzen.app')
}
```

### 2.6 Alerting

L'alerting est la boucle de feedback qui t'avertit activement sans que tu surveilles le dashboard.

**Sentry Alerts** (Settings > Alerts) — configurer au minimum :
- **Error spike** : si le nombre d'erreurs depasse X en 1 heure → Slack/email
- **New issue** : toute nouvelle erreur jamais vue → notification immédiate
- **Performance regression** : si LCP p75 dépasse 2,5 s sur 1 h glissante

**GitHub Actions — notification en cas d'échec**

```yaml
# .github/workflows/deploy.yml (extrait)
on:
  workflow_run:
    workflows: ["Deploy"]
    types: [completed]

jobs:
  notify:
    if: ${{ github.event.workflow_run.conclusion == 'failure' }}
    runs-on: ubuntu-latest
    steps:
      - name: Notify Slack on failure
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Deploy TribuZen FAILED on ${{ github.ref }} — ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 2.7 Budget de performance en CI — Lighthouse CI

Lighthouse CI (`@lhci/cli`) exécute Lighthouse à chaque pull request et bloque le merge si les scores descendent sous le seuil défini.

```bash
pnpm add -D @lhci/cli
```

```js
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      // URL à auditer — adapter à l'URL de preview Vercel/Netlify
      url: ['http://localhost:4173/'],
      // Lance le build preview avant l'audit
      startServerCommand: 'pnpm preview',
      numberOfRuns: 3,
    },
    assert: {
      // Seuils de score Lighthouse (0-1)
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'interactive': ['warn', { maxNumericValue: 3800 }],
      },
    },
    upload: {
      // Stocke les rapports sur lhci.tribuzen.app (serveur LHCI auto-hébergé)
      // ou 'temporary-public-storage' pour un stockage temporaire gratuit
      target: 'temporary-public-storage',
    },
  },
}
```

**GitHub Actions — intégration CI**

```yaml
# .github/workflows/lhci.yml
name: Lighthouse CI
on: [push, pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install
      - run: pnpm build
        env:
          VITE_SENTRY_DSN: ''
      - name: Run Lighthouse CI
        run: pnpm lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

Le token `LHCI_GITHUB_APP_TOKEN` permet à Lighthouse CI de poster les résultats comme status check sur la PR.

---

## 3. Worked examples

### Exemple 1 — Instrumenter `main.ts` de TribuZen de A à Z

Situation de départ : app Vue sans aucun monitoring. Objectif : Sentry + Web Vitals + Plausible en 50 lignes.

```ts
// main.ts — TribuZen front instrumenté complet
import { createApp } from 'vue'
import * as Sentry from '@sentry/vue'
import App from './App.vue'
import router from './router'
import { initWebVitals } from './composables/useWebVitals'
import { initPlausible } from './plugins/plausible'

const app = createApp(App)

// ── 1. Sentry — erreurs + performance navigation ──────────────────────────
// Sentry doit être initialisé AVANT app.use(router) et app.mount()
// pour capturer les erreurs dès le premier render
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    app,
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    // release est injecté par @sentry/vite-plugin au build time
    // (valeur = SHA du commit — tracabilité erreur → commit exact)
    integrations: [
      Sentry.browserTracingIntegration({ router }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 0,
    replaysOnErrorSampleRate: 1.0,
  })
}

// ── 2. Router ─────────────────────────────────────────────────────────────
app.use(router)

// ── 3. Mount ──────────────────────────────────────────────────────────────
app.mount('#app')

// ── 4. Web Vitals — après mount (les métriques démarrent après FCP) ──────
initWebVitals()

// ── 5. Analytics privacy-first — production uniquement ────────────────────
if (import.meta.env.PROD) {
  initPlausible('tribuzen.app')
}
```

**Pourquoi cet ordre ?**

- Sentry avant `app.use()` et `mount()` : capture les erreurs du router et du premier render.
- `initWebVitals()` après `mount()` : LCP ne peut être mesuré qu'après que le DOM est présent.
- Plausible en `PROD` uniquement : pas de données analytics en dev/staging qui polluent les stats.

### Exemple 2 — Diagnostiquer une erreur de production avec Sentry

Un utilisateur signale un crash sur `/famille/abc123`. Dans le dashboard Sentry, tu vois :

```
TypeError: Cannot read properties of undefined (reading 'membres')
  at FamilleDetailPage.vue:42:18
  at callWithErrorHandling (runtime-core.cjs:187:18)
```

Grâce aux source maps uploadées par `@sentry/vite-plugin`, Sentry affiche le vrai fichier et la vraie ligne. Tu ouvres `FamilleDetailPage.vue` ligne 42 :

```ts
// Avant correction — bug silencieux en dev (API mocke toujours une famille)
const famille = ref<Famille | null>(null)

onMounted(async () => {
  const res = await fetch(`/api/familles/${route.params.id}`)
  if (res.ok) {
    famille.value = await res.json()
  }
  // ← bug : si l'API retourne 404, famille.value reste null
})

// ligne 42 — null.membres explose si famille.value === null
const nombreMembres = computed(() => famille.value.membres.length)
```

Correction :

```ts
// Après correction — optional chaining + valeur par défaut
const nombreMembres = computed(() => famille.value?.membres?.length ?? 0)
```

Sentry te donne aussi les **breadcrumbs** (navigation avant le crash), le **user-agent** (Safari iOS 17), et les **context data** (user ID si tu as configuré `setUser`). En 5 minutes tu as localisé, corrigé, et tu peux cibler la release Sentry pour marquer le bug comme résolu.

**Marquer l'utilisateur dans Sentry (pour lier erreurs à un utilisateur)**

```ts
// composables/useAuth.ts — après login réussi
import * as Sentry from '@sentry/vue'

function onLoginSuccess(user: { id: string; email: string }): void {
  Sentry.setUser({ id: user.id, email: user.email })
}

function onLogout(): void {
  Sentry.setUser(null)  // effacer l'identité après déconnexion
}
```

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Pas de source maps = stack trace illisible

```
TypeError: Cannot read properties of undefined (reading 'v')
  at o (main.js:1:48291)
  at Object.fn (main.js:1:12043)
```

Sans source maps, ce crash est inexploitable. 30 minutes de grep ne suffisent pas pour retrouver `main.js:1:48291` dans le code source.

**Correction :** configurer `@sentry/vite-plugin` + `build.sourcemap: true` dans `vite.config.ts`. Les source maps sont uploadées à Sentry et supprimées du dossier public (`filesToDeleteAfterUpload`). Ton code source n'est jamais exposé aux utilisateurs.

**Signal d'alarme :** si une stack Sentry montre `main.js:1:XXXXX`, les source maps ne sont pas configurées.

### PIÈGE #2 — Logger trop = bruit, logger trop peu = aveugle

```ts
// ❌ Logger TOUT crée du bruit qui noie les vraies erreurs
app.config.errorHandler = (err) => {
  Sentry.captureException(err)  // OK pour les erreurs
}

// Mais aussi logger les événements normaux dans Sentry crée du bruit :
onMounted(() => {
  Sentry.captureMessage('Composant monté')  // ❌ inutile, remplit le quota
})
```

**Règle :** Sentry pour les **exceptions non gérées et les états anormaux**. Les événements métier normaux (login réussi, page visitée) vont en analytics (Plausible/Umami), pas en Sentry.

```ts
// ✅ Distinction claire
Sentry.captureException(err)          // erreur inattendue → Sentry
Sentry.addBreadcrumb({ message: '...' }) // contexte debug → Sentry breadcrumb
trackEvent('famille_créée')           // événement métier → Plausible
```

### PIÈGE #3 — Confondre Lighthouse lab et Web Vitals RUM

Lighthouse (outil de lab) mesure une simulation dans des conditions contrôlées (CPU throttling, réseau 3G simulé) depuis un seul endroit. Il ne reflète pas l'expérience réelle de tes utilisateurs.

```
Lighthouse : LCP = 1.2 s (machine de dev, wifi 1 Gbps, CPU i9)
RUM réel   : LCP p75 = 4.8 s (iPhone SE, 4G, réseau Outre-mer)
```

**Les deux sont nécessaires et complémentaires :**
- Lighthouse CI = budget ratchet en CI, bloque les régressions avant merge.
- RUM web-vitals = réalité terrain, identifie les vrais problèmes perçus par les utilisateurs.

**Ne pas remplacer l'un par l'autre.** Un score Lighthouse parfait en CI ne garantit pas de bonnes Web Vitals en production.

### PIÈGE #4 — INP a remplacé FID (Core Web Vitals, mars 2024)

```ts
// ❌ FID n'est plus un Core Web Vital depuis mars 2024
import { onFID } from 'web-vitals'
onFID(sendMetric)  // encore supporté par la lib, mais n'est plus le signal Google

// ✅ INP est le remplacement officiel
import { onINP } from 'web-vitals'
onINP(sendMetric)  // Interaction to Next Paint — p98 de toutes les interactions
```

`web-vitals` v3+ exporte `onINP`. `onFID` est toujours présent mais signale un indicateur déprécié. Mettre à jour les dashboards et les seuils d'alerte.

---

## 5. Ancrage TribuZen

Dans TribuZen, ce module s'applique à trois couches du front-office :

**1. `main.ts` — le point d'entrée**

`Sentry.init()` + `initWebVitals()` + `initPlausible()` s'ajoutent au `main.ts` de production. Voir Exemple 1. Aucun composant Vue n'est modifié — le monitoring est transparent pour le code métier.

**2. `components/shared/ErrorBoundary.vue`**

Composant wrapper autour des zones critiques (page famille, page événements). Si un composant enfant lève une exception non gérée, `onErrorCaptured` l'attrape, affiche un fallback UI, et Sentry la reçoit via `app.config.errorHandler` (la propagation est stoppée localement mais Sentry a déjà capturé l'erreur plus tôt dans la chaîne Vue).

**3. Pipeline CI (`lhci.yml`)**

La PR de chaque feature de TribuZen passe par Lighthouse CI. Si le LCP de la page `/familles` dépasse 2500 ms ou si le CLS dépasse 0,1, le merge est bloqué. Les régressions de performance sont détectées avant d'atteindre les utilisateurs.

Fichiers cibles dans `smaurier/tribuzen` :

```
tribuzen/
  src/
    main.ts                          ← Sentry + WebVitals + Plausible
    composables/
      useWebVitals.ts                ← collecte RUM → sendBeacon
    plugins/
      plausible.ts                   ← analytics privacy-first
    components/
      shared/
        ErrorBoundary.vue            ← onErrorCaptured + slot fallback
  vite.config.ts                     ← @sentry/vite-plugin (source maps)
  lighthouserc.js                    ← budget perf CI
  .github/workflows/
    lhci.yml                         ← Lighthouse CI sur chaque PR
```

---

## 6. Points clés

1. Sentry s'initialise avec `app` (instance Vue) pour se brancher automatiquement sur `app.config.errorHandler` — erreurs de tous les composants capturées sans code supplémentaire.
2. Sans source maps uploadées à Sentry, les stack traces en production sont des adresses mémoire inutilisables — `@sentry/vite-plugin` + `build.sourcemap: true` règle ça en CI.
3. `replaysOnErrorSampleRate: 1.0` enregistre la session complète avant toute erreur — permet de rejouer exactement ce que l'utilisateur a fait.
4. INP remplace FID dans les Core Web Vitals depuis mars 2024 — utiliser `onINP` de `web-vitals` v3+.
5. `sendBeacon` plutôt que `fetch` pour les métriques RUM — survit à la fermeture d'onglet, non-bloquant.
6. Lighthouse CI (lab) et RUM (terrain) sont complémentaires — l'un ne remplace pas l'autre.
7. Analytics privacy-first (Plausible, Umami) = conformité RGPD sans consent banner, contrairement à GA4.
8. Budget Lighthouse CI : bloquer le merge si `performance < 0.8` ou `LCP > 2500 ms` — ratchet qui empêche la dégradation progressive.

---

## 7. Seeds Anki

```
Pourquoi faut-il uploader les source maps à Sentry et les supprimer du build public ?|Sans upload : stack trace illisible (main.js:1:38421). Si laissées publiques : le code source TypeScript est exposé aux utilisateurs. @sentry/vite-plugin + filesToDeleteAfterUpload résout les deux.
Quelle est la différence entre app.config.errorHandler et onErrorCaptured ?|app.config.errorHandler est global (toutes les erreurs de l'app). onErrorCaptured est local à un composant et ses enfants — utilisé pour les ErrorBoundaries. Sentry se branche sur errorHandler global via l'option app passée à Sentry.init().
INP a remplacé quel Core Web Vital en mars 2024, et que mesure-t-il ?|INP remplace FID. FID mesurait la latence du premier clic uniquement. INP mesure la réactivité à toutes les interactions (p98) — plus représentatif de l'expérience globale.
Pourquoi utiliser sendBeacon plutôt que fetch pour envoyer les métriques RUM ?|sendBeacon est non-bloquant et garantit l'envoi même si l'utilisateur ferme l'onglet. fetch peut être annulé à la navigation ou fermeture. CLS et INP sont finalisés tard dans la session — sendBeacon les capture fiablement.
Comment configurer un budget de performance qui bloque le merge CI ?|Avec @lhci/cli : lighthouserc.js avec assertions sur les métriques (ex: largest-contentful-paint maxNumericValue: 2500). Lighthouse CI est exécuté dans GitHub Actions après le build — exit code non-zéro si budget dépassé.
Quelle valeur de tracesSampleRate utiliser en production pour Sentry, et pourquoi pas 1.0 ?|0.2 (20 %) est un bon défaut de départ. 1.0 envoie toutes les transactions à Sentry — coût élevé en volume, risque d'atteindre les limites du plan gratuit. replaysOnErrorSampleRate peut rester à 1.0 (déclenché seulement sur erreur).
Pourquoi les analytics privacy-first (Plausible, Umami) ne nécessitent-ils pas de consent banner RGPD ?|Ils ne posent pas de cookies tiers, ne trackent pas de données personnelles identifiantes, et ne transfèrent pas de données hors EU. Le consentement RGPD n'est requis que pour le traitement de données personnelles — la visite de page anonymisée ne l'est pas.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-35-cicd-monitoring/README.md`. Instrumenter une mini-app Vue avec Sentry (errorHandler + ErrorBoundary), collecter les Web Vitals via `sendBeacon`, et configurer un budget Lighthouse CI bloquant.
