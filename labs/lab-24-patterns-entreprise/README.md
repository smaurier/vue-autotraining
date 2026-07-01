# Lab 24 — Patterns d'entreprise

> **Outcome :** à la fin, tu sais monter un système provide/inject typé avec `InjectionKey`, un composant `ErrorBoundary` basé sur `onErrorCaptured`, et un plugin logger installé via `app.use` — le tout branché dans un projet Vite réel.
> **Vrai outil :** Vue 3.5 + Vite dev server (HMR). Pas de framework de test — validation visuelle dans le navigateur.
> **Feedback :** le coach valide en session — tu montres le comportement dans le navigateur (erreur capturée, fallback affiché, log dans la console).

---

## Énoncé

Tu construis la couche d'infrastructure du front TribuZen. Trois pièces à assembler :

**Pièce A — ApiClient injecté**
- Crée `src/injection-keys.ts` avec une `InjectionKey<ApiClient>`.
- Crée `src/services/createApiClient.ts` qui retourne un objet `ApiClient` wrappant `fetch`.
- Dans `App.vue`, `provide` l'`ApiClient`.
- Dans `src/composables/useFeedPosts.ts`, `inject` l'`ApiClient` et charge `/api/feed` (mock JSON local).

**Pièce B — ErrorBoundary**
- Crée `src/components/ErrorBoundary.vue` avec `onErrorCaptured`, un slot par défaut, et un fallback prop.
- Dans `FeedPage.vue`, entoure `<FeedList />` avec `<ErrorBoundary>`.
- Déclenche manuellement une erreur dans `FeedList.vue` (un `throw new Error('API down')`) pour vérifier que le fallback s'affiche sans casser le reste de la page.

**Pièce C — Plugin logger**
- Crée `src/plugins/logger.ts` avec un plugin qui installe un logger via `app.provide(LOGGER_KEY, ...)` et branche `app.config.errorHandler`.
- Dans `main.ts`, installe le plugin via `app.use(LoggerPlugin)`.
- Dans `ErrorBoundary.vue`, injecte le logger et log l'erreur capturée.

**Critère de réussite :** en déclenclant l'erreur du feed, le reste de la page reste intact, le fallback s'affiche, et la console affiche un message structuré `[TribuZen] ErrorBoundary [...]`.

---

## Étapes (en friction)

1. **Crée `src/injection-keys.ts`** — définis l'interface `ApiClient` (méthodes `get<T>` et `post<T>`) et l'`InjectionKey<ApiClient>`. Exporte les deux.

2. **Crée `src/services/createApiClient.ts`** — implémente `createApiClient()` qui retourne un `ApiClient`. Pour le lab, `get('/api/feed')` peut retourner des données mockées en dur (pas de vrai serveur nécessaire).

3. **Modifie `App.vue`** — appelle `createApiClient()` et `provide(API_CLIENT_KEY, client)` dans `<script setup>`.

4. **Crée `src/composables/useFeedPosts.ts`** — appelle `inject(API_CLIENT_KEY)`. Si `undefined`, lève une erreur. Expose `posts`, `loading`, `error`, `load`.

5. **Crée `src/plugins/logger.ts`** — définis `Logger` (interface avec `info`, `warn`, `error`), `LOGGER_KEY`, `createLogger()`, et `LoggerPlugin`. Branche `app.config.errorHandler` dans `install`.

6. **Modifie `main.ts`** — ajoute `app.use(LoggerPlugin)` avant le `mount`.

7. **Crée `src/components/ErrorBoundary.vue`** — `onErrorCaptured` qui met `hasError.value = true`, injecte `LOGGER_KEY` pour logger, retourne `false`. Slot par défaut + fallback via prop.

8. **Crée `src/pages/FeedPage.vue` et `src/components/FeedList.vue`** — `FeedList` utilise `useFeedPosts`, monte le feed. Ajoute un bouton "Simuler erreur" qui lance `throw new Error('API down')` dans un handler de click. Entoure `<FeedList />` avec `<ErrorBoundary>` dans `FeedPage`.

9. **Vérifie** : clique "Simuler erreur" — le fallback apparaît, la console affiche `[TribuZen] ErrorBoundary [...]`, aucune autre partie de la page n'est affectée.

---

## Corrigé complet commenté

### `src/injection-keys.ts`

```ts
import type { InjectionKey } from 'vue'

// Interface du contrat ApiClient — les composables dépendent de cette interface,
// pas d'une implémentation concrète
export interface ApiClient {
  get<T>(path: string): Promise<T>
  post<T>(path: string, body: unknown): Promise<T>
}

// Symbol unique comme clé — impossible de collisionner avec une autre clé string
// Le générique InjectionKey<T> est la pièce centrale du typage bout-en-bout
export const API_CLIENT_KEY: InjectionKey<ApiClient> = Symbol('apiClient')
```

---

### `src/services/createApiClient.ts`

```ts
import type { ApiClient } from '@/injection-keys'

// Dans ce lab : données mockées directement dans get() pour éviter un vrai serveur
// En prod : baseUrl viendrait de import.meta.env.VITE_API_BASE_URL
export function createApiClient(): ApiClient {
  return {
    async get<T>(path: string): Promise<T> {
      // Mock local — simule une réponse API pour /api/feed
      if (path === '/api/feed') {
        return [
          { id: '1', content: 'Alice a rejoint TribuZen 🎉', author: 'alice' },
          { id: '2', content: 'Bob a partagé une photo de famille', author: 'bob' },
        ] as unknown as T
      }
      throw new Error(`Route mockée inconnue: ${path}`)
    },

    async post<T>(path: string, body: unknown): Promise<T> {
      // Mock minimal pour les appels POST
      console.log(`[MockApiClient] POST ${path}`, body)
      return {} as T
    },
  }
}
```

---

### `src/plugins/logger.ts`

```ts
import type { App, InjectionKey } from 'vue'

// Interface du logger — permet de swapper l'implémentation (Sentry, Datadog…)
export interface Logger {
  info(msg: string, ctx?: Record<string, unknown>): void
  warn(msg: string, ctx?: Record<string, unknown>): void
  error(msg: string, err?: Error, ctx?: Record<string, unknown>): void
}

// Clé d'injection du logger — partagée entre le plugin et les composants
export const LOGGER_KEY: InjectionKey<Logger> = Symbol('logger')

// Factory — crée un logger avec un préfixe identifiable dans la console
function createLogger(prefix: string): Logger {
  return {
    info(msg, ctx) {
      // En dev seulement — inutile de polluer la console en prod
      if (import.meta.env.DEV) console.info(`[${prefix}] ${msg}`, ctx ?? '')
    },
    warn(msg, ctx) {
      console.warn(`[${prefix}] ${msg}`, ctx ?? '')
    },
    error(msg, err, ctx) {
      // En prod : remplacer par Sentry.captureException(err) ou équivalent
      console.error(`[${prefix}] ${msg}`, err ?? '', ctx ?? '')
    },
  }
}

// Le plugin — install reçoit l'instance app
export const LoggerPlugin = {
  install(app: App): void {
    // L'état (le logger) est créé ICI, pas au niveau module
    // → chaque instance d'app a son propre logger (important pour les tests)
    const logger = createLogger('TribuZen')

    // Injecte via app.provide — accessible dans toute l'arborescence
    app.provide(LOGGER_KEY, logger)

    // Handler global : filet de sécurité pour les erreurs non capturées par un ErrorBoundary
    app.config.errorHandler = (err, _instance, info) => {
      logger.error(`Unhandled Vue error [${info}]`, err as Error)
    }
  },
}
```

---

### `main.ts`

```ts
import { createApp } from 'vue'
import App from './App.vue'
import { LoggerPlugin } from './plugins/logger'

// Ordre : createApp → use (plugins) → mount
// Le plugin install() est appelé avant que l'app monte → provide disponible dès le premier rendu
createApp(App)
  .use(LoggerPlugin)
  .mount('#app')
```

---

### `src/App.vue`

```vue
<script setup lang="ts">
import { provide } from 'vue'
import { API_CLIENT_KEY } from '@/injection-keys'
import { createApiClient } from '@/services/createApiClient'

// Une seule instance d'ApiClient pour toute l'arborescence
// Si cette ligne est dans setup(), l'instance est créée à chaque remontage d'App
// → en pratique, App ne se remonte pas — acceptable
provide(API_CLIENT_KEY, createApiClient())
</script>

<template>
  <!-- En lab simple : FeedPage directement sans Router -->
  <FeedPage />
</template>
```

---

### `src/composables/useFeedPosts.ts`

```ts
import { ref, inject } from 'vue'
import { API_CLIENT_KEY } from '@/injection-keys'

export interface Post {
  id: string
  content: string
  author: string
}

export function useFeedPosts() {
  // inject() doit être appelé de façon synchrone au niveau racine
  // Si le composable est appelé hors d'un setup(), inject retourne undefined ET affiche un warning
  const api = inject(API_CLIENT_KEY)

  const posts = ref<Post[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(): Promise<void> {
    // Garde-fou : si l'ApiClient n'est pas fourni, l'erreur est claire
    if (!api) throw new Error('ApiClient non fourni — vérifie que App.vue appelle provide(API_CLIENT_KEY, ...)')

    loading.value = true
    error.value = null

    try {
      posts.value = await api.get<Post[]>('/api/feed')
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur inconnue'
      // Re-throw pour que onErrorCaptured puisse l'intercepter si on le souhaite
      throw e
    } finally {
      loading.value = false
    }
  }

  return { posts, loading, error, load }
}
```

---

### `src/components/ErrorBoundary.vue`

```vue
<script setup lang="ts">
import { ref, onErrorCaptured, inject } from 'vue'
import { LOGGER_KEY } from '@/plugins/logger'

// Prop optionnel : message affiché dans le fallback
const props = withDefaults(defineProps<{ fallback?: string }>(), {
  fallback: 'Une erreur est survenue.',
})

// Le logger est optionnel — l'ErrorBoundary fonctionne même sans le plugin installé
const logger = inject(LOGGER_KEY)

const hasError = ref(false)
const captured = ref<Error | null>(null)

onErrorCaptured((err: Error, _instance, info: string) => {
  // Stocke l'état d'erreur pour afficher le fallback
  hasError.value = true
  captured.value = err

  // Délègue au logger centralisé — le ?. absorbe le cas où le plugin n'est pas installé
  logger?.error(`ErrorBoundary [${info}]`, err)

  // CRUCIAL : return false stoppe la propagation
  // Sans ce return false, l'erreur remonterait vers les ancêtres ET vers app.config.errorHandler
  // → double traitement + risque d'affichage de deux fallbacks
  return false
})

// Permet à l'utilisateur de réessayer après une erreur
function reset(): void {
  hasError.value = false
  captured.value = null
}
</script>

<template>
  <!-- Le fallback remplace le slot si une erreur est capturée dans le sous-arbre -->
  <div v-if="hasError" role="alert" class="error-boundary">
    <p class="error-boundary__message">{{ fallback }}</p>
    <p class="error-boundary__detail">{{ captured?.message }}</p>
    <button class="error-boundary__retry" @click="reset">Réessayer</button>
  </div>

  <!-- Le slot par défaut : rendu normal quand pas d'erreur -->
  <slot v-else />
</template>

<style scoped>
.error-boundary {
  padding: 1.5rem;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  background: #fef2f2;
  color: #991b1b;
}

.error-boundary__message {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.error-boundary__detail {
  font-size: 0.875rem;
  opacity: 0.75;
  margin-bottom: 1rem;
  font-family: monospace;
}

.error-boundary__retry {
  padding: 0.4rem 1rem;
  border: 1px solid #991b1b;
  border-radius: 4px;
  background: transparent;
  color: #991b1b;
  cursor: pointer;
}

.error-boundary__retry:hover {
  background: #991b1b;
  color: #fff;
}
</style>
```

---

### `src/components/FeedList.vue`

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useFeedPosts } from '@/composables/useFeedPosts'

const { posts, loading, error, load } = useFeedPosts()

// Déclenche le chargement au montage du composant
onMounted(load)

// État local pour la simulation d'erreur — pas de la logique métier réelle
const shouldThrow = ref(false)
</script>

<template>
  <!-- Bouton de simulation — déclenche onErrorCaptured dans le parent ErrorBoundary -->
  <button
    style="margin-bottom: 1rem; padding: 0.4rem 0.8rem; background: #ef4444; color: #fff; border: none; border-radius: 4px; cursor: pointer"
    @click="shouldThrow = true"
  >
    Simuler une erreur API
  </button>

  <!--
    Le throw dans le rendu (pas dans un handler async) est intercepté par onErrorCaptured.
    Un throw dans un callback @click asynchrone ne serait PAS intercepté.
    Pour le lab : on utilise une condition de rendu qui throw dans le template.
  -->
  <template v-if="shouldThrow">
    {{ (() => { throw new Error('API down — simulée pour le lab') })() }}
  </template>

  <div v-else-if="loading">Chargement du fil…</div>
  <div v-else-if="error" style="color: #ef4444">{{ error }}</div>

  <ul v-else style="list-style: none; padding: 0">
    <li
      v-for="post in posts"
      :key="post.id"
      style="padding: 1rem; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 0.75rem"
    >
      <strong>{{ post.author }}</strong>
      <p style="margin: 0.25rem 0 0">{{ post.content }}</p>
    </li>
  </ul>
</template>
```

---

### `src/pages/FeedPage.vue`

```vue
<script setup lang="ts">
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import FeedList from '@/components/FeedList.vue'
</script>

<template>
  <div style="max-width: 640px; margin: 2rem auto; padding: 0 1rem">
    <h1>Fil d'actualité TribuZen</h1>
    <p style="color: #64748b; margin-bottom: 2rem">
      Ce bloc est isolé par un ErrorBoundary. Si FeedList crashe, le reste de la page tient.
    </p>

    <!--
      ErrorBoundary isole FeedList.
      Si FeedList ou l'un de ses enfants lève une erreur, seul ce bloc
      affiche le fallback — le h1 et le texte ci-dessus restent intacts.
    -->
    <ErrorBoundary fallback="Le fil d'actualité est temporairement indisponible.">
      <FeedList />
    </ErrorBoundary>

    <!-- Contenu hors ErrorBoundary — non affecté par une erreur dans FeedList -->
    <footer style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 0.875rem">
      TribuZen — le reste de la page reste fonctionnel
    </footer>
  </div>
</template>
```

---

**Vérification attendue dans la console après clic "Simuler une erreur API" :**

```
[TribuZen] ErrorBoundary [render function]  Error: API down — simulée pour le lab
```

**Et dans le navigateur :** le bloc `FeedList` est remplacé par le fallback rouge, le titre `h1` et le footer restent visibles.

---

## Variante J+30 (fading)

Reproduis le système complet **de mémoire, en 30 minutes**, avec ces ajouts :

1. **Thème injecté** — crée `THEME_KEY: InjectionKey<Ref<'light' | 'dark'>>` dans `injection-keys.ts`. Dans `App.vue`, fournis un `ref<'light' | 'dark'>('light')` avec un bouton de bascule. Dans `FeedPage.vue`, injecte le thème et applique une classe CSS conditionnelle sur le container.

2. **Factory de composables** — crée `createResourceComposable<T>(loader)` qui retourne un composable générique avec `data`, `loading`, `error`, `fetch`, `reset`. Réécris `useFeedPosts` en utilisant cette factory.

3. **Sans ouvrir ce corrigé** ni le module 24.

**Critère de réussite :** le thème bascule light/dark sans prop drilling, la factory est générique et réutilisable.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, les fichiers produits dans ce lab s'intègrent directement :

```
tribuzen/
  src/
    injection-keys.ts              ← Clé ApiClient + clé Thème
    config.ts                      ← import.meta.env.VITE_API_BASE_URL
    plugins/
      logger.ts                    ← LoggerPlugin
    services/
      createApiClient.ts           ← Appels fetch réels
    composables/
      useFeedPosts.ts
      createResourceComposable.ts  ← Factory réutilisée par useGroupDetails, useUserProfile
    components/
      ErrorBoundary.vue            ← Réutilisé sur chaque page critique
    pages/
      FeedPage.vue
```

**Différences par rapport au lab :**

- `createApiClient` utilise `config.apiBaseUrl` (depuis `import.meta.env.VITE_API_BASE_URL`) au lieu des données mockées.
- Le logger en prod envoie à Sentry via `Sentry.captureException(err)` dans la branche `app.config.errorHandler`.
- `FeedList` ne contient pas de bouton "Simuler erreur" — la simulation est réservée aux tests.

**Commit cible :**

```
feat(infra): provide/inject ApiClient typé + ErrorBoundary + LoggerPlugin
```
