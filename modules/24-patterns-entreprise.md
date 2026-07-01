---
titre: Patterns d'entreprise
cours: 02-vue
notions: [injection de dépendances provide inject typé, error boundaries onErrorCaptured, feature flags, higher order components et composables de composition, plugin Vue et app.use, gestion centralisée des erreurs et logs, patterns de configuration par environnement, factory de composables, Repository pattern interface et implémentation, Monorepo pnpm-workspace Turborepo, migration Vue 2 vers Vue 3 @vue/compat]
outcomes:
  - sait injecter des dépendances typées avec provide/inject (InjectionKey)
  - sait capturer et gérer les erreurs d'un sous-arbre (onErrorCaptured)
  - sait écrire un plugin Vue réutilisable (app.use)
  - sait appliquer des patterns d'équipe (feature flags, config par env, logs centralisés)
prerequis: [23-architecture-front]
next: 25-nuxt-introduction
libs: [{ name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — provide/inject de l'ApiClient et du thème, error boundary sur le feed, plugin de logs centralisé
last-reviewed: 2026-07
---

# Patterns d'entreprise

> **Outcomes — tu sauras FAIRE :** injecter des dépendances typées avec `provide`/`inject` et `InjectionKey`, capturer les erreurs d'un sous-arbre Vue avec `onErrorCaptured`, écrire un plugin Vue avec `app.use`, mettre en place feature flags et logs centralisés.
> **Difficulté :** :star::star::star::star:

## 1. Cas concret d'abord

Tu intègres l'équipe TribuZen. La codebase grandit : 12 composants font des appels HTTP en instanciant directement `fetch`. Le `FeedPage.vue` crashe silencieusement quand l'API renvoie une erreur — toute la page devient blanche. Les logs `console.error` sont éparpillés partout, impossibles à désactiver en prod. Et la feature "réactions sur les posts" ne doit tourner que pour 10 % des utilisateurs bêta.

Quatre problèmes, quatre patterns :

1. **Qui crée l'`ApiClient` ?** — chaque composant l'instancie lui-même → `provide`/`inject`
2. **Le feed blanc** — une erreur enfant détruit le sous-arbre → `onErrorCaptured`
3. **Les logs** — `console.error` partout → plugin `app.use` + logger centralisé
4. **Réactions bêta** — code conditionnel dans des dizaines de composants → feature flags

Ce module te donne les patterns pour résoudre chacun de ces cas.

---

## 2. Théorie complète, concise

### 2.1 `provide` / `inject` — injection de dépendances typée

`provide` expose une valeur sur un ancêtre. `inject` la consomme dans n'importe quel descendant, sans prop drilling.

**Problème du prop drilling :**

```
App → FeedPage → FeedList → FeedCard → PostActions → ReplyForm
                                                        ↑
                                              besoin de l'ApiClient
```

Passer `apiClient` en prop à chaque niveau est fragile et verbeux. `provide`/`inject` coupe ce câble.

**Sans typage — fragile :**

```ts
// ❌ clé string non typée
provide('apiClient', client)
const client = inject('apiClient') // type: unknown — pas sûr
```

**Avec `InjectionKey<T>` — idiomatic Vue 3 :**

```ts
// src/injection-keys.ts
import type { InjectionKey } from 'vue'
import type { ApiClient } from '@/services/ApiClient'

// La clé EST le type — Symbol unique, jamais de collision
export const API_CLIENT_KEY: InjectionKey<ApiClient> = Symbol('apiClient')
```

```ts
// App.vue (ancêtre)
import { provide } from 'vue'
import { API_CLIENT_KEY } from '@/injection-keys'
import { createApiClient } from '@/services/ApiClient'

// Crée UNE instance et l'injecte dans toute l'arborescence
const apiClient = createApiClient(import.meta.env.VITE_API_BASE_URL)
provide(API_CLIENT_KEY, apiClient)
```

```ts
// ReplyForm.vue (descendant, n'importe quelle profondeur)
import { inject } from 'vue'
import { API_CLIENT_KEY } from '@/injection-keys'

// ✅ TypeScript infère ApiClient — type garanti par InjectionKey<ApiClient>
const apiClient = inject(API_CLIENT_KEY)
// apiClient : ApiClient | undefined — peut être undefined si aucun ancêtre ne provide
```

**Valeur par défaut — évite le `undefined` :**

```ts
// Avec default : TypeScript infère ApiClient (jamais undefined)
const apiClient = inject(API_CLIENT_KEY, createFallbackApiClient())

// Avec factory (évaluation paresseuse, utile si la création est coûteuse)
const apiClient = inject(API_CLIENT_KEY, () => createFallbackApiClient(), true)
```

**Reactive provide — la valeur injectée est réactive :**

```ts
// L'ancêtre peut fournir un ref ou un reactive — les descendants voient les mises à jour
const theme = ref<'light' | 'dark'>('light')
provide(THEME_KEY, theme)  // InjectionKey<Ref<'light' | 'dark'>>

// Descendant
const theme = inject(THEME_KEY)
// theme.value change automatiquement si l'ancêtre le modifie
```

**Convention d'équipe :** toutes les `InjectionKey` dans `src/injection-keys.ts`. Ne jamais utiliser de clé string nue dans une codebase TypeScript.

---

### 2.2 `onErrorCaptured` — error boundary

`onErrorCaptured` est un hook de cycle de vie qui se déclenche quand un composant **enfant** (direct ou descendant) lève une erreur. Il reçoit l'erreur, le composant source, et une string décrivant l'origine (`setup`, `render`, `watcher`, etc.).

**Comportement par défaut sans error boundary :**

Une erreur dans le rendu d'un enfant propage vers le haut jusqu'au handler global — Vue affiche un avertissement console, mais le composant corrompu reste dans le DOM ou toute la vue devient vide.

**Composant `ErrorBoundary.vue` réutilisable :**

```vue
<!-- src/components/ErrorBoundary.vue -->
<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

// Props : message de fallback optionnel
const props = withDefaults(defineProps<{ fallback?: string }>(), {
  fallback: 'Une erreur est survenue.',
})

const hasError = ref(false)
const errorMessage = ref('')

onErrorCaptured((err: Error, _instance, info: string) => {
  hasError.value = true
  errorMessage.value = err.message

  // Log centralisé — appel au plugin logger (section 2.5)
  console.error(`[ErrorBoundary] ${info}:`, err)

  // Retourner false = stopper la propagation vers les ancêtres
  // Retourner true (ou ne rien retourner) = laisser l'erreur remonter
  return false
})

function reset(): void {
  hasError.value = false
  errorMessage.value = ''
}
</script>

<template>
  <div v-if="hasError" class="error-boundary">
    <p>{{ fallback }}</p>
    <p class="error-detail">{{ errorMessage }}</p>
    <button @click="reset">Réessayer</button>
  </div>
  <slot v-else />
</template>
```

**Utilisation autour du feed :**

```vue
<!-- FeedPage.vue -->
<template>
  <ErrorBoundary fallback="Le fil d'actualité est temporairement indisponible.">
    <FeedList />
  </ErrorBoundary>
</template>
```

Si `FeedList` ou l'un de ses enfants lève une erreur, seul le bloc `ErrorBoundary` affiche le fallback — le reste de la page reste intact.

**Valeur de retour de `onErrorCaptured` :**

| Retour | Effet |
|--------|-------|
| `false` | Stoppe la propagation — l'erreur ne remonte pas aux ancêtres |
| `true` / `undefined` | Propagation vers le handler du composant parent ou vers `app.config.errorHandler` |

---

### 2.3 Feature flags

Un feature flag est une condition booléenne qui active ou désactive un bloc de fonctionnalité sans redéploiement ni branche de code séparée.

**Implémentation minimaliste via variables d'environnement :**

```ts
// src/feature-flags.ts
export const flags = {
  // Vite expose les variables VITE_* via import.meta.env
  feedReactions: import.meta.env.VITE_FF_FEED_REACTIONS === 'true',
  betaDashboard: import.meta.env.VITE_FF_BETA_DASHBOARD === 'true',
} as const
```

```vue
<!-- FeedCard.vue -->
<script setup lang="ts">
import { flags } from '@/feature-flags'
</script>

<template>
  <div class="feed-card">
    <PostContent />
    <!-- Le bloc Reactions ne compile même pas en prod si le flag est false -->
    <PostReactions v-if="flags.feedReactions" />
  </div>
</template>
```

**.env files :**

```
# .env.development
VITE_FF_FEED_REACTIONS=true
VITE_FF_BETA_DASHBOARD=false

# .env.production
VITE_FF_FEED_REACTIONS=false
VITE_FF_BETA_DASHBOARD=false
```

**Composable de feature flags (pour les flags dynamiques runtime) :**

```ts
// src/composables/useFeatureFlag.ts
import { inject, type InjectionKey, type Ref } from 'vue'

// Flags chargés depuis l'API au démarrage (ex: LaunchDarkly-lite)
export const FEATURE_FLAGS_KEY: InjectionKey<Ref<Record<string, boolean>>> =
  Symbol('featureFlags')

export function useFeatureFlag(name: string): boolean {
  const flags = inject(FEATURE_FLAGS_KEY)
  return flags?.value[name] ?? false
}
```

---

### 2.4 Composables de composition et pattern HOC-like

Vue 3 n'a pas de Higher-Order Components (HOC) au sens React — la composition se fait via les composables. Un composable peut en appeler un autre, créant des couches de comportement.

**Factory de composable — générique réutilisable :**

```ts
// src/composables/createResourceComposable.ts
import { ref, readonly } from 'vue'
import type { InjectionKey, Ref } from 'vue'

interface ResourceState<T> {
  data: Readonly<Ref<T | null>>
  loading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
  fetch: () => Promise<void>
  reset: () => void
}

// Factory : reçoit une fonction de chargement, retourne un composable
export function createResourceComposable<T>(
  loader: () => Promise<T>
): () => ResourceState<T> {
  return function useResource(): ResourceState<T> {
    const data = ref<T | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function fetch(): Promise<void> {
      loading.value = true
      error.value = null
      try {
        data.value = await loader()
      } catch (e) {
        error.value = e instanceof Error ? e.message : 'Erreur inconnue'
      } finally {
        loading.value = false
      }
    }

    function reset(): void {
      data.value = null
      loading.value = false
      error.value = null
    }

    return {
      data: readonly(data),
      loading: readonly(loading),
      error: readonly(error),
      fetch,
      reset,
    }
  }
}
```

```ts
// src/composables/useFeed.ts
import { createResourceComposable } from './createResourceComposable'
import type { Post } from '@/types'

// Un composable spécialisé créé par la factory
export const useFeed = createResourceComposable<Post[]>(
  () => fetch('/api/feed').then(r => r.json())
)
```

```ts
// Dans un composant
const { data: posts, loading, error, fetch: loadFeed } = useFeed()
```

Le pattern factory évite de dupliquer la logique loading/error/reset dans 20 composables différents.

---

### 2.5 Plugin Vue — `app.use`

Un plugin Vue expose une fonction `install(app: App)` et peut :
- fournir des composants globaux
- ajouter des propriétés sur `app.config.globalProperties`
- injecter des valeurs via `app.provide`
- enregistrer des directives globales

**Plugin de logger centralisé :**

```ts
// src/plugins/logger.ts
import type { App, InjectionKey } from 'vue'

export interface Logger {
  info(msg: string, ctx?: Record<string, unknown>): void
  warn(msg: string, ctx?: Record<string, unknown>): void
  error(msg: string, err?: Error, ctx?: Record<string, unknown>): void
}

export const LOGGER_KEY: InjectionKey<Logger> = Symbol('logger')

function createLogger(prefix: string): Logger {
  const isProd = import.meta.env.PROD

  return {
    info(msg, ctx) {
      if (!isProd) console.info(`[${prefix}] ${msg}`, ctx ?? '')
    },
    warn(msg, ctx) {
      console.warn(`[${prefix}] ${msg}`, ctx ?? '')
    },
    error(msg, err, ctx) {
      // En prod : envoyer à Sentry / Datadog plutôt que console
      console.error(`[${prefix}] ${msg}`, err ?? '', ctx ?? '')
    },
  }
}

// Le plugin lui-même
export const LoggerPlugin = {
  install(app: App): void {
    const logger = createLogger('TribuZen')

    // Injecte via provide → accessible partout avec inject(LOGGER_KEY)
    app.provide(LOGGER_KEY, logger)

    // Handler global : toutes les erreurs Vue non capturées passent ici
    app.config.errorHandler = (err, _instance, info) => {
      logger.error(`Unhandled Vue error [${info}]`, err as Error)
    }
  },
}
```

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { LoggerPlugin } from './plugins/logger'

createApp(App)
  .use(LoggerPlugin)
  .mount('#app')
```

```ts
// N'importe quel composant
import { inject } from 'vue'
import { LOGGER_KEY } from '@/plugins/logger'

const logger = inject(LOGGER_KEY)
logger?.error('Échec chargement feed', err)
```

**app.config.errorHandler vs onErrorCaptured :**

| | `onErrorCaptured` | `app.config.errorHandler` |
|-|-------------------|--------------------------|
| Portée | Sous-arbre du composant | Toute l'application |
| Contrôle propagation | `return false` stoppe | Pas de propagation à stopper |
| Usage typique | Error boundary local | Logging global (Sentry, etc.) |

---

### 2.6 Configuration par environnement — `import.meta.env`

Vite expose les variables d'environnement via `import.meta.env`. Seules les variables préfixées `VITE_` sont exposées au client (les autres restent côté serveur de build).

```ts
// Toujours disponibles (pas de préfixe VITE_ nécessaire) :
import.meta.env.MODE      // 'development' | 'production' | 'test'
import.meta.env.DEV       // boolean — true en développement
import.meta.env.PROD      // boolean — true en production
import.meta.env.BASE_URL  // base URL configurée dans vite.config

// Variables custom (VITE_ obligatoire) :
import.meta.env.VITE_API_BASE_URL   // string | undefined
import.meta.env.VITE_APP_VERSION    // string | undefined
```

**Typer les variables d'environnement :**

```ts
// src/vite-env.d.ts (généré par Vite, à enrichir)
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_FF_FEED_REACTIONS: string
  readonly VITE_APP_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

**Pattern de config centralisée :**

```ts
// src/config.ts
// Centralise toutes les variables d'env avec validation au démarrage
function requireEnv(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key]
  if (!value) throw new Error(`Variable d'environnement manquante: ${key}`)
  return value
}

export const config = {
  apiBaseUrl: requireEnv('VITE_API_BASE_URL'),
  appVersion: import.meta.env.VITE_APP_VERSION ?? '0.0.0',
  isProd: import.meta.env.PROD,
} as const
```

Importer `config` partout plutôt qu'accéder directement à `import.meta.env` dans les composants — facilite les tests (on peut mocker `config`).

---

### 2.7 Repository pattern — interface + implémentation HTTP + InMemory

Le Repository pattern sépare **le contrat** (l'interface) de **l'implémentation** (HTTP en prod, InMemory en test). Le code applicatif dépend du contrat — jamais de `fetch` directement dans les composables.

**Étape 1 — Le contrat (`src/domain/ports/PostRepository.ts`) :**

```ts
// Ce fichier définit CE QUE le repository sait faire — pas COMMENT
export interface PostRepository {
  findAll(): Promise<Post[]>
  findById(id: string): Promise<Post>
  create(data: CreatePostDto): Promise<Post>
  delete(id: string): Promise<void>
}
```

**Étape 2 — Implémentation HTTP (`src/infrastructure/HttpPostRepository.ts`) :**

```ts
import type { PostRepository } from '@/domain/ports/PostRepository'
import type { ApiClient } from '@/injection-keys'

export class HttpPostRepository implements PostRepository {
  constructor(private readonly api: ApiClient) {}

  async findAll(): Promise<Post[]> {
    return this.api.get<Post[]>('/posts')
  }

  async findById(id: string): Promise<Post> {
    return this.api.get<Post>(`/posts/${id}`)
  }

  async create(data: CreatePostDto): Promise<Post> {
    return this.api.post<Post>('/posts', data)
  }

  async delete(id: string): Promise<void> {
    await this.api.delete(`/posts/${id}`)
  }
}
```

**Étape 3 — Implémentation InMemory pour les tests (`src/infrastructure/InMemoryPostRepository.ts`) :**

```ts
import type { PostRepository } from '@/domain/ports/PostRepository'

export class InMemoryPostRepository implements PostRepository {
  private posts: Post[] = []

  // Pré-remplir pour les tests
  seed(posts: Post[]): this {
    this.posts = [...posts]
    return this
  }

  async findAll(): Promise<Post[]> {
    return [...this.posts]
  }

  async findById(id: string): Promise<Post> {
    const found = this.posts.find(p => p.id === id)
    if (!found) throw new Error(`Post ${id} introuvable`)
    return found
  }

  async create(data: CreatePostDto): Promise<Post> {
    const post: Post = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() }
    this.posts.push(post)
    return post
  }

  async delete(id: string): Promise<void> {
    this.posts = this.posts.filter(p => p.id !== id)
  }
}
```

**Injection via `provide`/`inject` (cohérence avec §2.1) :**

```ts
// src/injection-keys.ts
import type { InjectionKey } from 'vue'
import type { PostRepository } from '@/domain/ports/PostRepository'

export const POST_REPO_KEY: InjectionKey<PostRepository> = Symbol('postRepository')
```

```ts
// App.vue — injecte l'implémentation HTTP en prod
import { HttpPostRepository } from '@/infrastructure/HttpPostRepository'
provide(POST_REPO_KEY, new HttpPostRepository(apiClient))
```

```ts
// tests/FeedList.test.ts — InMemory, pas de fetch réseau
const repo = new InMemoryPostRepository().seed([{ id: '1', content: 'Test' }])
app.provide(POST_REPO_KEY, repo)
```

**Valeur :** un composable peut être testé sans serveur, sans MSW, sans `vi.fn()` sur `fetch` — l'implémentation InMemory est déterministe et ultra-rapide.

---

### 2.8 Monorepo — pnpm-workspace, Turborepo / Nx

Un monorepo regroupe plusieurs packages et applications dans un seul dépôt git. Les packages partagés (design system, utilitaires, types) sont importés directement sans passer par npm.

**Structure typique :**

```
tribuzen-monorepo/
  packages/
    ui/                   ← Design system Vue (ButtonPrimary, AvatarGroup…)
      src/
        index.ts          ← re-export barrel
      package.json        ← name: "@tribuzen/ui"
    shared/               ← Types TS et utilitaires partagés
      src/
        types.ts
      package.json        ← name: "@tribuzen/shared"
  apps/
    web/                  ← SPA Vue (front-office famille)
      package.json
    admin/                ← Nuxt (back-office)
      package.json
  pnpm-workspace.yaml
  turbo.json
```

**`pnpm-workspace.yaml` — déclare les packages :**

```yaml
packages:
  - "packages/*"
  - "apps/*"
```

**Import inter-packages :**

```ts
// apps/web/package.json — déclarer la dépendance locale
{
  "dependencies": {
    "@tribuzen/ui": "workspace:*",
    "@tribuzen/shared": "workspace:*"
  }
}
```

```ts
// apps/web/src/components/FeedCard.vue
import { AvatarGroup } from '@tribuzen/ui'
import type { Post } from '@tribuzen/shared'
```

**Turborepo / Nx — orchestration des builds :**

- **Turborepo** (`turbo.json`) : cache des tâches, pipeline de build parallèle. Si `@tribuzen/ui` n'a pas changé depuis le dernier build, Turborepo réutilise le cache — le build CI passe de 5 min à 30 s.
- **Nx** : similaire, plus complet pour les grandes équipes (générateurs, dependency graph visuel).

```json
// turbo.json — exemple minimal
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

**Quand adopter un monorepo :** dès qu'un composant ou un type doit être partagé entre deux apps. Le coût de setup (`pnpm-workspace.yaml` + Turborepo) est faible ; le gain de synchronisation entre packages est immédiat.

---

### 2.9 Migration Vue 2 → Vue 3 — `@vue/compat` et étapes progressives

En entreprise, la majorité des projets Vue existants sont en Vue 2. La migration n'est pas un big-bang — `@vue/compat` permet de faire tourner du code Vue 2 dans Vue 3 pendant la transition.

**Étapes progressives :**

```
Étape 1 — Installer @vue/compat
   pnpm add @vue/compat
   Aliaser "vue" vers "@vue/compat" dans vite.config.ts
   → L'app démarre en mode Vue 3 avec compatibilité Vue 2 activée
   → Des warnings apparaissent pour chaque API dépréciée utilisée

Étape 2 — Migrer composant par composant
   Traiter les warnings un à un : Options API → Composition API,
   $listeners → v-on inherit, .sync modifier → v-model:propName,
   Vue.set / Vue.delete → réactivité directe Vue 3

Étape 3 — Remplacer les mixins par des composables
   Les mixins (source de conflits de nommage) → composables Vue 3
   ex: mixin authMixin → composable useAuth()

Étape 4 — Migrer Vuex vers Pinia
   Vuex 4 fonctionne dans Vue 3, mais Pinia est la cible officielle
   Migration store par store, pas en une seule fois

Étape 5 — Désactiver @vue/compat
   Retirer l'alias dans vite.config.ts
   Corriger les derniers usages d'API Vue 2 non encore traités
```

**Configuration Vite pour activer `@vue/compat` :**

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  resolve: {
    alias: {
      // Remplace les imports de 'vue' par '@vue/compat' le temps de la migration
      'vue': '@vue/compat',
    },
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Active les warnings de compatibilité dans les templates
          compatConfig: { MODE: 2 },
        },
      },
    }),
  ],
})
```

**Règle d'or :** ne jamais geler les features en cours de migration. Utiliser les feature flags (§2.3) pour activer/désactiver le code migré par portion, et s'appuyer sur les tests de non-régression à chaque étape.

---

## 3. Worked examples

### Exemple 1 — InjectionKey ApiClient + ErrorBoundary (TribuZen)

Voici l'assemblage complet pour le feed TribuZen : `App.vue` fournit l'`ApiClient`, `FeedPage.vue` isole le sous-arbre dans un `ErrorBoundary`.

**`src/injection-keys.ts` :**

```ts
import type { InjectionKey } from 'vue'

export interface ApiClient {
  get<T>(path: string): Promise<T>
  post<T>(path: string, body: unknown): Promise<T>
}

export const API_CLIENT_KEY: InjectionKey<ApiClient> = Symbol('apiClient')
```

**`src/services/createApiClient.ts` :**

```ts
import type { ApiClient } from '@/injection-keys'
import { config } from '@/config'

export function createApiClient(): ApiClient {
  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${config.apiBaseUrl}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} on ${method} ${path}`)
    return res.json() as Promise<T>
  }

  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  }
}
```

**`src/App.vue` :**

```vue
<script setup lang="ts">
import { provide } from 'vue'
import { API_CLIENT_KEY } from '@/injection-keys'
import { createApiClient } from '@/services/createApiClient'

// Une seule instance pour toute l'arborescence
provide(API_CLIENT_KEY, createApiClient())
</script>

<template>
  <RouterView />
</template>
```

**`src/composables/useFeedPosts.ts` :**

```ts
import { ref } from 'vue'
import { inject } from 'vue'
import { API_CLIENT_KEY } from '@/injection-keys'
import type { Post } from '@/types'

export function useFeedPosts() {
  const api = inject(API_CLIENT_KEY)
  const posts = ref<Post[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(): Promise<void> {
    if (!api) throw new Error('ApiClient non fourni — AppProvider manquant')
    loading.value = true
    try {
      posts.value = await api.get<Post[]>('/feed')
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur réseau'
      throw e  // re-throw pour déclencher onErrorCaptured si nécessaire
    } finally {
      loading.value = false
    }
  }

  return { posts, loading, error, load }
}
```

**`src/pages/FeedPage.vue` :**

```vue
<script setup lang="ts">
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import FeedList from '@/components/FeedList.vue'
</script>

<template>
  <main>
    <h1>Fil d'actualité</h1>
    <!-- Seul ce bloc tombe si FeedList crashe, pas toute la page -->
    <ErrorBoundary fallback="Le fil d'actualité est temporairement indisponible.">
      <FeedList />
    </ErrorBoundary>
  </main>
</template>
```

**`src/components/FeedList.vue` :**

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useFeedPosts } from '@/composables/useFeedPosts'

const { posts, loading, error, load } = useFeedPosts()
onMounted(load)
</script>

<template>
  <div v-if="loading">Chargement…</div>
  <div v-else-if="error">{{ error }}</div>
  <ul v-else>
    <li v-for="post in posts" :key="post.id">{{ post.content }}</li>
  </ul>
</template>
```

---

### Exemple 2 — Plugin LoggerPlugin complet + intégration ErrorBoundary

On connecte le logger du plugin à l'`ErrorBoundary` pour que toute erreur capturée parte vers le système de logs centralisé.

**`src/components/ErrorBoundary.vue` (version connectée au logger) :**

```vue
<script setup lang="ts">
import { ref, onErrorCaptured, inject } from 'vue'
import { LOGGER_KEY } from '@/plugins/logger'

const props = withDefaults(defineProps<{ fallback?: string }>(), {
  fallback: 'Une erreur est survenue.',
})

const logger = inject(LOGGER_KEY)
const hasError = ref(false)
const captured = ref<Error | null>(null)

onErrorCaptured((err: Error, _instance, info: string) => {
  hasError.value = true
  captured.value = err

  // Délègue au logger centralisé du plugin
  logger?.error(`ErrorBoundary [${info}]`, err, { component: _instance?.$options.name })

  return false  // stoppe la propagation
})

function reset(): void {
  hasError.value = false
  captured.value = null
}
</script>

<template>
  <div v-if="hasError" role="alert" class="error-boundary">
    <p>{{ fallback }}</p>
    <button @click="reset">Réessayer</button>
  </div>
  <slot v-else />
</template>
```

L'`ErrorBoundary` est maintenant couplé au plugin via `inject(LOGGER_KEY)` — si le plugin n'est pas installé, le composant fonctionne quand même (le `?` absorbe `undefined`).

---

## 4. Pièges & misconceptions

### PIÈGE #1 — `inject` sans clé typée retourne `unknown`

```ts
// ❌ Clé string — TypeScript infère unknown
const client = inject('apiClient')
client.get('/feed')  // TS Error: Object is of type 'unknown'

// ❌ Cast forcé — dangereux, contourne les vérifications TS
const client = inject('apiClient') as ApiClient

// ✅ InjectionKey<T> — TypeScript infère ApiClient | undefined
const API_CLIENT_KEY: InjectionKey<ApiClient> = Symbol('apiClient')
const client = inject(API_CLIENT_KEY)
// Gérer le cas undefined avant d'appeler
if (!client) throw new Error('ApiClient non fourni')
client.get('/feed')  // ✅ ApiClient
```

Le Symbol `InjectionKey` est le seul moyen d'avoir un typage bout-en-bout entre `provide` et `inject`.

---

### PIÈGE #2 — `onErrorCaptured` retourne `true` au lieu de `false` — l'erreur remonte quand même

```ts
// ❌ Retourner true (ou ne rien retourner) laisse l'erreur remonter
onErrorCaptured((err) => {
  hasError.value = true
  return true   // L'erreur continue de se propager vers les ancêtres !
  // → L'ErrorBoundary affiche le fallback ET l'erreur remonte — double traitement
})

// ✅ Retourner false stoppe la propagation
onErrorCaptured((err) => {
  hasError.value = true
  return false  // Stoppe la chaîne ici
})

// ✅ Retourner false ET logger — stoppe + log sans double traitement
onErrorCaptured((err, _instance, info) => {
  hasError.value = true
  logger?.error(`[${info}]`, err)
  return false
})
```

La valeur de retour est la partie la plus contre-intuitive de `onErrorCaptured` — `false` = arrêter, tout le reste = continuer.

---

### PIÈGE #3 — Plugin avec état partagé involontaire entre applications

```ts
// ❌ État déclaré au niveau module — partagé entre toutes les instances d'app
let requestCount = 0  // ← module-level state

export const CounterPlugin = {
  install(app: App) {
    app.provide(COUNT_KEY, { get: () => requestCount, inc: () => requestCount++ })
  },
}
// En test, chaque app.use(CounterPlugin) partage le MÊME requestCount
// → les tests s'affectent mutuellement

// ✅ État créé dans install — une instance par app
export const CounterPlugin = {
  install(app: App) {
    let requestCount = 0  // ← local à install → isolé par app
    app.provide(COUNT_KEY, { get: () => requestCount, inc: () => requestCount++ })
  },
}
```

---

### PIÈGE #4 — `inject` appelé hors du cycle de setup

```ts
// ❌ inject hors de setup() ou <script setup> — retourne undefined et avertit
function someUtility() {
  const client = inject(API_CLIENT_KEY)  // Warning: inject() called outside setup()
}

// ❌ inject dans un callback asynchrone après le setup
const client = ref<ApiClient | null>(null)
onMounted(async () => {
  client.value = inject(API_CLIENT_KEY)  // ❌ — setup est terminé
})

// ✅ inject au niveau synchrone du setup
const client = inject(API_CLIENT_KEY)  // ✅ — exécuté pendant setup()
```

`inject` doit toujours être appelé de façon synchrone au niveau racine du `<script setup>` ou de `setup()`.

---

### PIÈGE #5 — `onErrorCaptured` n'intercepte PAS les erreurs async des event handlers

C'est le piège le plus fréquent quand on implémente un `ErrorBoundary` : les erreurs lancées dans un handler d'événement async ne remontent **pas** vers `onErrorCaptured`.

```ts
// ❌ ErrorBoundary parent NE reçoit PAS cette erreur
// Le handler @click asynchrone s'exécute hors du contexte de rendu Vue
<script setup lang="ts">
async function handleSubmit(): Promise<void> {
  const result = await api.post('/posts', formData.value)
  // Si api.post() rejette → l'erreur n'est PAS capturée par onErrorCaptured
  // Elle atterrit dans app.config.errorHandler ou reste non gérée
}
</script>

<template>
  <form @submit.prevent="handleSubmit">...</form>
</template>
```

**Pourquoi :** `onErrorCaptured` intercepte les erreurs dans `setup()`, la fonction `render()`, les watchers, et les lifecycle hooks. Les event handlers async (`@click`, `@submit`, `@change`) sont déclenchés par des événements DOM — ils s'exécutent en dehors du cycle de rendu Vue et Vue ne peut pas les intercepter automatiquement.

**Le correct — `try/catch` explicite dans chaque handler async :**

```ts
// ✅ Gérer l'erreur dans le handler lui-même
async function handleSubmit(): Promise<void> {
  try {
    await api.post('/posts', formData.value)
    emit('submitted')
  } catch (err) {
    // Option A : état d'erreur local dans le composant
    submitError.value = err instanceof Error ? err.message : 'Erreur lors de l\'envoi'

    // Option B : logger centralisé (plugin §2.5)
    logger?.error('handleSubmit failed', err as Error)

    // Option C : re-throw dans un rendu synchrone pour déclencher onErrorCaptured
    // (rare, pattern avancé — ne pas utiliser par défaut)
  }
}
```

**Règle :** toute `async function` déclenchée par un event handler (`@click`, `@submit`, `@change`…) doit avoir son propre `try/catch`. `onErrorCaptured` est pour les erreurs de **rendu et de cycle de vie**, pas pour les handlers async d'événements DOM.

---

## 5. Ancrage TribuZen

Dans TribuZen, ces quatre patterns s'emboîtent dans la couche front-office :

**`provide`/`inject` de l'ApiClient**

`App.vue` crée une seule instance d'`ApiClient` et la `provide`. Tous les composables (`useFeedPosts`, `useGroupDetails`, `useUserProfile`) l'injectent via `inject(API_CLIENT_KEY)`. Zéro import direct de `fetch` dans les composants.

**Thème injecté**

```ts
// App.vue
const theme = ref<'light' | 'dark'>('light')
provide(THEME_KEY, readonly(theme))

// Depuis n'importe quel composant UI
const theme = inject(THEME_KEY)  // InjectionKey<Readonly<Ref<'light' | 'dark'>>>
```

**`ErrorBoundary` sur le feed**

`FeedPage.vue` entoure `<FeedList />` dans `<ErrorBoundary>`. Si le feed plante (token expiré, panne API), seul le feed affiche le fallback — la navigation, le header et la sidebar restent fonctionnels.

**Plugin `LoggerPlugin`**

Installé dans `main.ts`. Branche `app.config.errorHandler` pour que toutes les erreurs non capturées partent vers le même système (en dev: console.error structuré ; en prod: Sentry). L'`ErrorBoundary` injecte `LOGGER_KEY` pour logger les erreurs capturées localement.

**Feature flags**

La feature "réactions sur les posts" (`VITE_FF_FEED_REACTIONS`) est activée en `.env.development` pour l'équipe, désactivée en `.env.production` jusqu'au rollout officiel.

Fichiers cibles dans `smaurier/tribuzen` :

```
tribuzen/
  src/
    injection-keys.ts              ← Toutes les InjectionKey
    config.ts                      ← Variables d'env centralisées
    feature-flags.ts               ← Flags compilés
    plugins/
      logger.ts                    ← LoggerPlugin + LOGGER_KEY
    services/
      createApiClient.ts
    composables/
      useFeedPosts.ts
      createResourceComposable.ts  ← Factory générique
    components/
      ErrorBoundary.vue
    pages/
      FeedPage.vue
```

---

## 6. Points clés

1. `InjectionKey<T>` est un Symbol typé — c'est la seule façon d'obtenir un typage bout-en-bout entre `provide` et `inject` en TypeScript.
2. `inject` retourne `T | undefined` quand aucune valeur par défaut n'est fournie — toujours gérer ce cas.
3. `onErrorCaptured` retourne `false` pour stopper la propagation ; tout autre retour (y compris `true`) laisse l'erreur remonter.
4. `onErrorCaptured` n'intercepte PAS les erreurs async des event handlers DOM — chaque `async function` déclenchée par `@click` ou `@submit` doit avoir son propre `try/catch`.
5. Un plugin Vue expose `{ install(app: App) {} }` — l'état doit être créé dans `install`, jamais au niveau module.
6. `app.config.errorHandler` est le filet de sécurité global ; `onErrorCaptured` est le contrôle local par sous-arbre.
7. Les feature flags compilés (`import.meta.env.VITE_FF_*`) sont évalués au build — tree-shaker peut éliminer le code mort. Les flags runtime (via `inject`) permettent le toggle sans redéploiement.
8. `import.meta.env.VITE_*` : seules les variables préfixées `VITE_` sont exposées au bundle client.
9. La factory de composables (`createResourceComposable`) évite de dupliquer la logique loading/error/reset — un seul endroit à corriger si le pattern change.
10. Le Repository pattern sépare l'interface (contrat) de l'implémentation (HTTP en prod, InMemory en test) — injecté via `provide`/`inject` pour la testabilité.
11. Un monorepo pnpm-workspace partage des packages sans publication npm — Turborepo ou Nx orchestrent les builds et le cache CI.
12. La migration Vue 2→3 se fait via `@vue/compat` (alias dans vite.config), composant par composant, avec feature flags pour activer/désactiver les portions migrées.

---

## 7. Seeds Anki

```
Quelle est la différence entre inject('clé') et inject(INJECTION_KEY) ?|inject('clé') retourne unknown, pas de typage TS. inject(KEY) avec InjectionKey<T> retourne T | undefined — TypeScript connaît le type exact.
Que retourner dans onErrorCaptured pour stopper la propagation ?|Retourner false. Retourner true ou undefined laisse l'erreur remonter vers les ancêtres et vers app.config.errorHandler.
Quelle est la signature minimale d'un plugin Vue ?|Un objet avec install(app: App): void — la fonction reçoit l'instance d'application et peut appeler app.provide, app.component, app.directive, app.config.errorHandler.
Pourquoi l'état d'un plugin ne doit-il pas être au niveau module ?|L'état module-level est partagé entre toutes les instances d'app (tests unitaires, SSR). Il faut créer l'état dans install() pour qu'il soit isolé par instance.
Quel préfixe rend une variable d'environnement Vite accessible côté client ?|VITE_ — seules les variables VITE_* sont incluses dans le bundle. Les autres restent côté build uniquement.
Quelle est la différence entre app.config.errorHandler et onErrorCaptured ?|app.config.errorHandler est global (toute l'app, dernier recours). onErrorCaptured est local à un composant et son sous-arbre, et peut stopper la propagation avec return false.
Comment injecter une valeur réactive via provide/inject ?|provide(KEY, ref(value)) ou provide(KEY, reactive(obj)). Le descendant inject(KEY) obtient la même référence réactive — les mutations sont visibles immédiatement.
À quel moment de l'exécution inject() doit-il être appelé ?|De façon synchrone au niveau racine de setup() ou <script setup>. Jamais dans un callback asynchrone, un setTimeout, ou un lifecycle hook — inject() serait undefined et Vue avertit.
Pourquoi onErrorCaptured ne capture-t-il pas les erreurs dans un handler @click async ?|Les event handlers async s'exécutent en dehors du cycle de rendu Vue (déclenchés par des événements DOM). onErrorCaptured n'intercepte que les erreurs de setup(), render(), watchers et lifecycle hooks. Solution : try/catch explicite dans chaque handler async.
Quelle est la valeur du Repository pattern pour la testabilité ?|Il sépare le contrat (interface) de l'implémentation. En prod : HttpRepository (vraie API). En test : InMemoryRepository (tableau en mémoire, pas de réseau, déterministe). Le composable dépend du contrat via inject() — swapper l'implémentation sans toucher le composable.
Quel fichier configure les packages d'un monorepo pnpm ?|pnpm-workspace.yaml — il liste les dossiers (packages: ["packages/*", "apps/*"]). pnpm résout les dépendances locales (workspace:*) sans publication npm. Turborepo ou Nx ajoutent le cache de build et l'orchestration.
Quel outil permet de migrer Vue 2 vers Vue 3 sans réécriture totale ?|@vue/compat — aliaser 'vue' vers '@vue/compat' dans vite.config.ts active le mode compatibilité. L'app tourne en Vue 3, les APIs Vue 2 dépréciées affichent des warnings. On migre composant par composant en traitant les warnings, puis on retire l'alias quand tout est migré.
```

---

## Vers le module 25 — Nuxt

Les patterns de ce module ont des équivalents directs dans Nuxt. La logique ne change pas — la plomberie d'injection change.

| Pattern Vue (module 24) | Équivalent Nuxt (modules 25-29) |
|---|---|
| `provide(API_CLIENT_KEY, client)` + `inject(API_CLIENT_KEY)` | `useNuxtApp().$fetch` — client HTTP fourni par Nuxt, SSR-aware |
| `provide(THEME_KEY, theme)` + `inject(THEME_KEY)` | `useNuxtApp().provide('theme', theme)` — auto-exposé via `useNuxtApp()` |
| Feature flags `import.meta.env.VITE_FF_*` (compilés) | `useRuntimeConfig()` — config exposée server + client, changeable sans rebuild |
| Plugin `app.use(LoggerPlugin)` (Vite/Vue) | Plugin Nuxt `plugins/logger.ts` + Nitro middleware pour le côté serveur |
| `app.config.errorHandler` | `nuxtApp.hook('app:error', handler)` — hook SSR-compatible |

Un `InjectionKey` Vue reste utilisable dans Nuxt via `provide`/`inject` natif ; `useNuxtApp()` en ajoute une couche automatique pour les dépendances du framework (router, payload, fetch).

---

## Pont vers le lab

> Lab associé : `02-vue/labs/lab-24-patterns-entreprise/README.md`. Construire un mini provider d'`ApiClient` avec `provide`/`inject` typé, un `ErrorBoundary` fonctionnel, et un plugin logger — corrigé commenté intégral + variante J+30.

---

← [23 — Architecture front](23-architecture-front.md)
