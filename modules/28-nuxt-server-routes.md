---
titre: Nuxt — server routes et Nitro
cours: 02-vue
notions: [dossier server api, defineEventHandler, lire params query body, moteur Nitro, cachedEventHandler et cachedFunction, storage layer Nitro, headers et cache HTTP dans les handlers, middleware serveur, variables d'environnement runtimeConfig, déploiement Nitro presets]
outcomes:
  - sait créer une route API Nuxt (server/api) avec defineEventHandler
  - sait lire params, query et body d'une requête serveur
  - sait mettre en cache une réponse serveur (cachedEventHandler, storage Nitro)
  - sait exposer une config runtime et comprendre le déploiement Nitro
prerequis: [27-nuxt-data-fetching]
next: 29-nuxt-seo-et-meta
libs: [{ name: nuxt, version: "3" }, { name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — routes server/api pour le contenu, cache Nitro multi-couches (comme le cache 3 couches Eudonet)
last-reviewed: 2026-07
---

# Nuxt — server routes et Nitro

> **Outcomes — tu sauras FAIRE :** créer des routes API dans `server/api/`, lire params/query/body, mettre en cache des réponses serveur avec `cachedEventHandler` et le storage Nitro, sécuriser des secrets via `runtimeConfig`, choisir un preset de déploiement Nitro.
> **Difficulté :** :star::star::star:
>
> **Contexte Bedrock :** le "cache Nitro 3 couches" sur le CV (migration Eudonet) est directement couvert ici. Ce module est à niveau entretien — chaque notion est celle qu'on attend d'un dev Vue/Nuxt squad Core.

---

## 1. Cas concret d'abord

Tu arrives chez Bedrock sur le projet de migration Eudonet. Le front-office actuel appelle une API externe lente (300-500 ms par requête). Sur chaque page de contenu, `useFetch('/api/eudonet/items')` déclenche un appel réseau vers le vieux système. À 10 000 visiteurs/jour, c'est 10 000 appels inutiles — la réponse ne change qu'une fois par heure.

Le tech lead demande : "implémente le cache 3 couches." Tu dois :

1. Créer une route `server/api/eudonet/items.get.ts` qui proxifie l'API externe
2. La wrapper avec `cachedEventHandler` (cache stocké en mémoire ou Redis)
3. Renvoyer un header `Cache-Control` pour que le CDN cache également
4. Garder la clé API Eudonet **côté serveur uniquement** via `runtimeConfig`

Sans ce module, tu ne sais pas par où commencer. Après ce module, tu sais justifier chaque couche en entretien.

---

## 2. Théorie complète, concise

### 2.1 Dossier `server/api/` — convention de nommage

Nuxt auto-scan le dossier `server/` et enregistre les routes automatiquement. Aucune configuration supplémentaire.

```
server/
  api/
    items.get.ts          → GET    /api/items
    items.post.ts         → POST   /api/items
    items/[id].get.ts     → GET    /api/items/:id
    items/[id].delete.ts  → DELETE /api/items/:id
  middleware/
    auth.ts               → exécuté avant CHAQUE requête
  plugins/
    storage.ts            → plugin serveur (ex: mount Redis)
  utils/
    db.ts                 → utilitaires auto-importés dans server/
```

Le suffixe `.get`, `.post`, `.put`, `.delete`, `.patch` dans le nom du fichier restreint la route à la méthode HTTP correspondante. Un fichier sans suffixe répond à toutes les méthodes.

Les paramètres dynamiques s'écrivent entre crochets : `[id]`, `[slug]`, `[...catchAll]` pour un catch-all.

### 2.2 `defineEventHandler` — gestionnaire de route

`defineEventHandler` est la fonction centrale de H3 (le framework HTTP qui propulse Nitro). Elle enveloppe le handler et lui donne accès à l'objet `event`.

```ts
// server/api/hello.get.ts
export default defineEventHandler((event) => {
  // event contient la requête, la réponse, le contexte
  return { message: 'Hello from Nitro' }
  // L'objet retourné est sérialisé en JSON automatiquement
})

// Handler asynchrone — cas standard pour tout I/O
export default defineEventHandler(async (event) => {
  const data = await fetchSomeData()
  return data
})
```

Nuxt auto-importe `defineEventHandler` dans les fichiers `server/` — pas besoin d'`import`.

### 2.3 Lire params, query et body

**Paramètre de route dynamique** (`[id]` dans le nom de fichier) :

```ts
// server/api/items/[id].get.ts
export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id') // string | undefined
  // event.context.params?.id fonctionne aussi mais getRouterParam est l'API officielle
  return { id }
})
// GET /api/items/42  → { id: "42" }  (toujours une string)
```

**Query parameters** (`?q=vue&page=2`) :

```ts
// server/api/search.get.ts
export default defineEventHandler((event) => {
  const query = getQuery(event)
  // query est un objet dont toutes les valeurs sont string | string[]
  const q = query.q as string
  const page = Number(query.page) || 1
  return { q, page }
})
// GET /api/search?q=tribuzen&page=2  → { q: "tribuzen", page: 2 }
```

**Body (POST/PUT)** :

```ts
// server/api/items.post.ts
interface CreateItemDto {
  title: string
  category: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateItemDto>(event)
  // readBody parse automatiquement le JSON, form-urlencoded, multipart
  if (!body.title) {
    throw createError({ statusCode: 400, statusMessage: 'title requis' })
  }
  return { id: Date.now(), ...body }
})
```

> `createError` lance une H3Error qui se traduit en réponse HTTP avec le statusCode voulu — pas besoin de catch manuel.

### 2.4 Nitro — le moteur serveur universel

Nitro est le moteur serveur derrière Nuxt 3+. Il est **distinct de Vue** et peut être utilisé seul. Ses responsabilités :

| Rôle | Ce que fait Nitro |
|---|---|
| Runtime HTTP | H3 — framework HTTP léger et typé |
| Routing | File-based, auto-scan `server/` |
| Cache | `cachedEventHandler`, `cachedFunction`, storage abstraction |
| Storage | `useStorage` + drivers (mémoire, Redis, FS, KV Cloudflare…) |
| Déploiement | Presets : Node, Vercel, Cloudflare, AWS Lambda, Netlify… |
| Build | Tree-shaking, bundling, output adapté au preset |

Nitro rend Nuxt **universel** : le même code tourne sur un serveur Node, un edge worker Cloudflare, une Lambda AWS, ou en statique — selon le preset choisi.

### 2.5 `cachedEventHandler` et `cachedFunction` — cache serveur

Ces deux utilitaires sont auto-importés dans `server/`. Ils wrappent un handler/une fonction et mettent le résultat en cache dans le **storage Nitro** (mémoire par défaut, Redis ou autre si configuré).

**`cachedEventHandler`** — cache une route API complète :

```ts
// server/api/eudonet/items.get.ts
export default cachedEventHandler(
  async (event) => {
    // Ce bloc ne s'exécute que si le cache est froid
    const config = useRuntimeConfig(event)
    const data = await $fetch('https://eudonet.internal/api/items', {
      headers: { 'X-API-Key': config.eudonetApiKey },
    })
    return data
  },
  {
    maxAge: 60 * 60,       // TTL en secondes (1 heure)
    swr: true,             // Stale-While-Revalidate : sert l'ancienne valeur pendant la revalidation
    name: 'eudonet-items', // Nom du cache (clé de namespace dans le storage)
    // getKey: (event) => event.path, // clé calculée par requête (défaut : chemin + query)
  }
)
```

> **Nitro 2 vs Nitro 3 (Nuxt 4) :** le nom a changé. Nitro 2 (Nuxt 3) expose `cachedEventHandler`. Nitro 3 (Nuxt 4) utilise `defineCachedEventHandler`. Les deux sont fonctionnellement identiques — vérifie la version Nitro de ton projet. ⚠️ à gater Context7 si comportement inattendu en migration Nuxt 4.

**`cachedFunction`** — cache une fonction quelconque (utilitaire, fetch, calcul lourd) :

```ts
// server/utils/eudonet.ts
const fetchItemById = cachedFunction(
  async (id: string) => {
    const config = useRuntimeConfig()
    return await $fetch(`https://eudonet.internal/api/items/${id}`, {
      headers: { 'X-API-Key': config.eudonetApiKey },
    })
  },
  {
    maxAge: 60 * 30,      // 30 min
    name: 'eudonet-item', // namespace
    getKey: (id) => id,   // clé = le paramètre id
  }
)

// Utilisation dans une route
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  return await fetchItemById(id)
})
```

**Options communes :**

| Option | Type | Description |
|---|---|---|
| `maxAge` | `number` | TTL en secondes. Après expiration, le cache est revalidé. |
| `swr` | `boolean` | Stale-While-Revalidate. Sert l'ancienne valeur ET revalide en arrière-plan. |
| `staleMaxAge` | `number` | Durée pendant laquelle une valeur expirée est encore servie en SWR (défaut : -1 = infini). |
| `name` | `string` | Namespace du cache dans le storage. Deux handlers avec le même `name` partagent l'espace. |
| `getKey` | `Function` | Calcule la clé de cache depuis l'event ou les args. Par défaut : hash du path + query. |

### 2.6 Storage layer Nitro — les 3 couches de cache

Nitro expose une abstraction de stockage via `useStorage`. Elle s'appuie sur **unstorage**, une librairie cross-platform avec des drivers interchangeables.

**Couche 1 — HTTP/CDN (headers Cache-Control + ETag)** :

```ts
// server/api/content.get.ts
export default defineEventHandler(async (event) => {
  const data = { items: ['a', 'b', 'c'], version: 'v1' }

  // Headers cache HTTP : le CDN (Vercel Edge, Cloudflare) met en cache la réponse
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')
  setResponseHeader(event, 'ETag', '"v1-abc123"')
  // setHeaders (pluriel) pour setter plusieurs en une fois
  // setHeaders(event, { 'Cache-Control': '...', 'ETag': '"..."' })

  return data
})
```

**Couche 2 — Storage Nitro (mémoire/Redis/KV)** — `cachedEventHandler` écrit ici automatiquement. On peut aussi écrire/lire manuellement :

```ts
// server/api/manual-cache.get.ts
export default defineEventHandler(async (event) => {
  const storage = useStorage('cache') // driver 'cache' = mémoire par défaut

  const cached = await storage.getItem<string>('my-key')
  if (cached) return JSON.parse(cached)

  const fresh = await $fetch('https://external-api.com/data')
  await storage.setItem('my-key', JSON.stringify(fresh))
  return fresh
})
```

**Couche 3 — Mémoire applicative** — `cachedFunction` avec un LRU en mémoire du process Node.

**Configuration des drivers dans `nuxt.config.ts`** :

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    storage: {
      // Driver Redis pour le cache persisté
      redis: {
        driver: 'redis',
        port: 6379,
        host: '127.0.0.1',
        db: 0,
      },
      // Driver filesystem (dev local)
      fs: {
        driver: 'fs',
        base: './.cache/nitro',
      },
    },
  },
})
```

**Mount dynamique dans un plugin serveur** (recommandé pour injecter les credentials depuis `runtimeConfig`) :

```ts
// server/plugins/storage.ts
import redisDriver from 'unstorage/drivers/redis'

export default defineNitroPlugin(() => {
  const storage = useStorage()
  const config = useRuntimeConfig()

  storage.mount('redis', redisDriver({
    base: 'redis',
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
  }))
})
```

Puis dans `cachedEventHandler`, passer `base: 'redis'` pour que Nitro écrive dans Redis :

```ts
export default cachedEventHandler(async (event) => {
  return await $fetch('https://api.example.com/heavy')
}, {
  maxAge: 60 * 60,
  base: 'redis', // utilise le driver Redis monté ci-dessus
  name: 'heavy-endpoint',
  swr: true,
})
```

**Les 3 couches en résumé (claim CV Bedrock/Eudonet)** :

```
Requête →
  [1] CDN/Browser cache      (Cache-Control, ETag)          → hit: 0 ms
  [2] Nitro storage cache    (cachedEventHandler → Redis)   → hit: ~1 ms
  [3] Mémoire applicative    (cachedFunction → LRU)         → hit: <0.1 ms
  [4] Origine                (API externe Eudonet)          → hit: 300-500 ms
```

### 2.7 Middleware serveur

Un fichier dans `server/middleware/` s'exécute automatiquement avant **toutes** les requêtes serveur. Pas de configuration requise.

```ts
// server/middleware/auth.ts
export default defineEventHandler((event) => {
  // Protéger uniquement les routes /api/admin
  if (!event.path.startsWith('/api/admin')) return // laisser passer

  const token = getHeader(event, 'authorization')
  if (!token || !token.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'Token manquant' })
  }

  // Passer des données au handler suivant via event.context
  event.context.userId = verifyToken(token.replace('Bearer ', ''))
})
```

> Récupérer dans le handler : `const userId = event.context.userId`

Les middlewares s'exécutent dans l'ordre alphabétique des fichiers. Préfixer avec `01-`, `02-` pour contrôler l'ordre.

### 2.8 `runtimeConfig` et variables d'environnement

`runtimeConfig` sépare les secrets serveur des valeurs publiques. Les variables d'environnement **remplacent** les valeurs au runtime (pas au build).

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // Privé — accessible uniquement dans server/
    eudonetApiKey: '',         // override : NUXT_EUDONET_API_KEY=xxx
    redis: {
      host: 'localhost',       // override : NUXT_REDIS_HOST=prod-redis.internal
      port: 6379,              // override : NUXT_REDIS_PORT=6380
      password: '',            // override : NUXT_REDIS_PASSWORD=secret
    },
    // Public — accessible côté client ET serveur
    public: {
      apiBase: '/api',         // override : NUXT_PUBLIC_API_BASE=https://api.prod.com
    },
  },
})
```

La règle de nommage des variables d'env : `NUXT_` + chemin en SNAKE_CASE majuscules (`runtimeConfig.redis.host` → `NUXT_REDIS_HOST`).

```ts
// server/api/external.get.ts
export default defineEventHandler(async (event) => {
  // Nuxt 3 : useRuntimeConfig() sans argument
  // Nuxt 4 : passer event est recommandé pour le bon contexte SSR
  const config = useRuntimeConfig(event)

  // config.eudonetApiKey → string (valeur du .env ou de nuxt.config)
  // config.public.apiBase → string (accessible aussi côté client)
  return await $fetch(`${config.public.apiBase}/items`, {
    headers: { 'X-API-Key': config.eudonetApiKey },
  })
})
```

> **Règle d'or :** aucun secret dans `runtimeConfig.public`. Tout ce qui est dans `public` est exposé dans le bundle JS client.

### 2.9 Presets de déploiement Nitro

Un **preset** adapte le build Nitro à la plateforme cible. Il n'y a rien à changer dans le code applicatif — seule la config change.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: 'vercel',            // ou 'cloudflare-pages', 'netlify', 'aws-lambda', 'node-server'
  },
})
```

Ou via variable d'environnement au build : `NITRO_PRESET=vercel npx nuxi build`

| Preset | Plateforme | Particularités |
|---|---|---|
| `node-server` | VPS, Docker (défaut) | Serveur Node.js longue durée, toutes les features |
| `vercel` | Vercel | Edge Functions + ISR, `vercel.json` auto-généré |
| `cloudflare-pages` | Cloudflare Pages | Workers (runtime V8), pas de Node built-ins |
| `netlify` | Netlify | Edge Functions ou serverless |
| `aws-lambda` | AWS Lambda | Cold start à optimiser, pas de mémoire persistante |
| `static` | Hébergement statique | Pré-rendu complet, pas de route serveur |

> **Impact sur le cache :** en `cloudflare-pages` ou `aws-lambda`, la mémoire applicative (`cachedFunction`) est réinitialisée à chaque invocation (pas de processus long). Il faut **obligatoirement** un storage externe (Redis, KV Cloudflare) pour le cache persistant entre les requêtes.

---

## 3. Worked examples

### Exemple 1 — Route proxy avec cache 3 couches (scénario Eudonet)

```ts
// server/api/eudonet/items.get.ts
// Route : GET /api/eudonet/items?category=events

export default cachedEventHandler(
  async (event) => {
    const config = useRuntimeConfig(event)
    const query = getQuery(event)
    const category = (query.category as string) ?? 'all'

    // Appel vers l'API interne Eudonet (lente : 300-500 ms)
    const data = await $fetch<{ items: unknown[] }>(
      `https://eudonet.internal/api/items`,
      {
        query: { category },
        headers: { 'X-API-Key': config.eudonetApiKey },
      }
    )

    // Couche 1 : HTTP headers → CDN cache la réponse 1 heure
    setResponseHeader(event, 'Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')

    return data.items
  },
  {
    // Couche 2 : Nitro storage cache (Redis si monté, mémoire sinon)
    maxAge: 60 * 60,        // 1 heure
    swr: true,              // SWR : sert l'ancienne valeur pendant la revalidation
    staleMaxAge: -1,        // garder la valeur expirée indéfiniment en mode SWR
    name: 'eudonet-items',  // namespace dans le storage
    getKey: (event) => {
      // Clé unique par catégorie — un cache par valeur de query param
      const q = getQuery(event)
      return `category-${q.category ?? 'all'}`
    },
  }
)
```

**Flux d'une requête GET /api/eudonet/items?category=events :**

```
1. Nitro reçoit la requête
2. cachedEventHandler calcule la clé : "category-events"
3. Vérifie le storage → MISS (première requête)
4. Exécute le handler → appel Eudonet (300 ms)
5. Stocke le résultat dans storage["eudonet-items:category-events"]
6. Renvoie la réponse + Cache-Control au CDN

Requêtes suivantes (< 1 heure) :
→ cachedEventHandler → HIT → renvoie depuis storage (<1 ms)
→ Le CDN peut aussi servir depuis son cache (0 ms pour le client)
```

### Exemple 2 — `cachedFunction` + `useStorage` pour invalidation manuelle

```ts
// server/utils/content.ts
// Fonction cachée — réutilisable dans plusieurs routes

export const fetchArticle = cachedFunction(
  async (slug: string) => {
    const config = useRuntimeConfig()
    return await $fetch(`${config.contentApiBase}/articles/${slug}`)
  },
  {
    maxAge: 60 * 15,          // 15 min
    name: 'articles',
    getKey: (slug) => slug,   // clé = slug de l'article
  }
)
```

```ts
// server/api/content/[slug].get.ts
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  return await fetchArticle(slug)
})
```

```ts
// server/api/admin/invalidate.post.ts
// Route d'invalidation manuelle appelée par un webhook CMS

export default defineEventHandler(async (event) => {
  const body = await readBody<{ slug: string }>(event)

  // Supprimer l'entrée du cache storage directement
  const storage = useStorage()
  await storage.removeItem(`nitro:functions:articles:${body.slug}.json`)

  return { invalidated: body.slug }
})
```

> Le format de clé Nitro pour `cachedFunction` est `nitro:functions:<name>:<key>.json`. ⚠️ à gater Context7 si le format change en Nitro 3.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Secret dans `runtimeConfig.public` (fuite de données)

```ts
// ❌ DANGEREUX — config.public est injecté dans le bundle JS client
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      stripeSecretKey: 'sk_live_...',  // visible dans les DevTools du navigateur !
    },
  },
})

// ✅ Les secrets restent dans le scope privé (server uniquement)
export default defineNuxtConfig({
  runtimeConfig: {
    stripeSecretKey: '',  // accessible uniquement dans server/
    public: {
      stripePk: '',       // clé publique Stripe — ok côté client
    },
  },
})
```

**Signal d'alarme :** si tu accèdes à une clé API dans un composant Vue (côté client), elle est dans `runtimeConfig.public` — et donc visible dans le bundle.

### PIÈGE #2 — Pas de cache sur une route lourde

```ts
// ❌ Chaque requête vers /api/eudonet/items repart vers l'API externe
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  return await $fetch('https://eudonet.internal/api/items', {
    headers: { 'X-API-Key': config.eudonetApiKey },
  })
})

// ✅ Wrapper avec cachedEventHandler — 1 appel externe pour N requêtes Nuxt
export default cachedEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  return await $fetch('https://eudonet.internal/api/items', {
    headers: { 'X-API-Key': config.eudonetApiKey },
  })
}, { maxAge: 3600, name: 'eudonet-items', swr: true })
```

**Dans le contexte Bedrock/Eudonet :** sans cache, une page à fort trafic provoque une cascade de timeouts vers l'API legacy.

### PIÈGE #3 — Cache trop agressif sans invalidation

```ts
// ❌ maxAge très long sans mécanisme d'invalidation
export default cachedEventHandler(async (event) => {
  return await fetchCriticalData()
}, {
  maxAge: 60 * 60 * 24,  // 24 heures — les données peuvent être périmées des heures
  // pas de swr, pas de route d'invalidation, pas d'ETag
  name: 'critical',
})
```

Solution : combiner `swr: true` (revalidation silencieuse), une route d'invalidation POST (`/api/admin/invalidate`), et des `ETag` pour la couche HTTP. Définir `maxAge` selon la fréquence réelle de changement des données.

### PIÈGE #4 — Confondre `cachedEventHandler` et `cachedFunction` (Nitro 2 vs 3)

En Nuxt 3 (Nitro 2), l'API est `cachedEventHandler` et `cachedFunction`.
En Nuxt 4 (Nitro 3), les fonctions sont renommées `defineCachedEventHandler` et `defineCachedFunction`.

```ts
// Nuxt 3 / Nitro 2
export default cachedEventHandler(handler, options)
const fn = cachedFunction(fn, options)

// Nuxt 4 / Nitro 3 (noms recommandés)
export default defineCachedEventHandler(handler, options)
const fn = defineCachedFunction(fn, options)
```

Les options (`maxAge`, `swr`, `name`, `getKey`) sont identiques dans les deux versions. Vérifier la version Nitro avec `cat package.json | grep nitro` si un projet Nuxt 4 refuse l'ancienne forme.

### PIÈGE #5 — `useStorage` sans driver = mémoire locale non-partagée

```ts
// ❌ En multi-instance (load balancer), chaque process a sa propre mémoire
// Instance A peut avoir le cache, Instance B non
export default defineCachedEventHandler(async (event) => {
  return await fetchData()
}, { maxAge: 3600, name: 'data' })
// Par défaut → stocke en mémoire du process — pas partagé entre instances

// ✅ En production multi-instance : configurer un storage externe partagé
// nuxt.config.ts : nitro.storage.redis + base: 'redis' dans cachedEventHandler
```

---

## 5. Ancrage TribuZen

Dans TribuZen, les server routes couvrent deux cas d'usage directs :

**Route de contenu tribale (lecture publique cachée)** :
```
server/api/tribes/[id]/content.get.ts
```
Renvoie les contenus publics d'une tribu. Les données changent rarement (publications des membres, max 1/heure). `cachedEventHandler` avec `maxAge: 3600`, `swr: true`, clé par `id` tribu. Header `Cache-Control: public, s-maxage=3600` pour le CDN. C'est la couche 2 du cache 3 couches.

**Route d'authentification (POST, jamais mis en cache)** :
```
server/api/auth/login.post.ts
server/api/auth/refresh.post.ts
```
`readBody` pour les credentials. `runtimeConfig` pour la clé JWT (`jwtSecret`). Erreur 401 via `createError` si token invalide. Ce sont des routes POST — Nitro ne cache jamais les requêtes POST automatiquement.

**Middleware de vérification JWT** :
```
server/middleware/01-auth.ts
```
Vérifie le header `Authorization: Bearer <token>` sur toutes les routes `/api/protected/*`. Injecte `event.context.user` pour les handlers downstream.

**Config runtime TribuZen** :
```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    jwtSecret: '',           // NUXT_JWT_SECRET=...
    uploadSecret: '',        // NUXT_UPLOAD_SECRET=...
    redis: { host: 'localhost', port: 6379, password: '' },
    public: {
      apiBase: '/api',       // NUXT_PUBLIC_API_BASE=https://api.tribuzen.app
    },
  },
})
```

Fichiers cibles dans `smaurier/tribuzen` :
```
tribuzen/
  server/
    api/
      tribes/[id]/content.get.ts    ← cachedEventHandler + Cache-Control
      auth/login.post.ts            ← readBody + runtimeConfig.jwtSecret
    middleware/
      01-auth.ts                    ← vérification JWT global
    plugins/
      storage.ts                    ← mount Redis dynamique
```

---

## 6. Points clés

1. `server/api/name.method.ts` — la convention fichier détermine l'URL et la méthode HTTP sans configuration.
2. `defineEventHandler(event => ...)` — handler H3. `event` donne accès à params, query, body, headers.
3. `getRouterParam(event, 'id')` pour les segments `[id]`, `getQuery(event)` pour `?key=val`, `await readBody(event)` pour le body POST.
4. Nitro est le moteur serveur universel de Nuxt — il abstrait HTTP, cache, storage et déploiement.
5. `cachedEventHandler` wrape une route avec un TTL dans le storage Nitro. Options clés : `maxAge`, `swr`, `name`, `getKey`.
6. `cachedFunction` wrape toute fonction async — clé calculée depuis ses arguments via `getKey`.
7. Le storage layer (`useStorage`) abstrait mémoire/Redis/FS/KV via unstorage — les drivers se configurent dans `nitro.storage` ou via un plugin serveur.
8. `setResponseHeader(event, 'Cache-Control', '...')` pour la couche CDN/browser — couche 1 du cache 3 couches.
9. `runtimeConfig` : niveau racine = serveur uniquement, `.public` = client+serveur. Variables d'env `NUXT_*` overrident au runtime.
10. Les presets Nitro (`vercel`, `cloudflare-pages`, `node-server`…) adaptent le build à la plateforme sans changer le code.

---

## 7. Seeds Anki

```
Quelle est la convention de nommage d'une route GET /api/items/:id dans Nuxt ?|Créer server/api/items/[id].get.ts — le segment [id] devient un paramètre dynamique, .get restreint à la méthode GET.
Quelle est la différence entre cachedEventHandler et cachedFunction dans Nitro ?|cachedEventHandler wrape un handler de route API (reçoit event). cachedFunction wrape toute fonction async et calcule la clé depuis ses arguments via getKey. Les deux stockent dans le storage Nitro.
Quelle option de cachedEventHandler permet de servir une valeur expirée pendant la revalidation en arrière-plan ?|swr: true (Stale-While-Revalidate). Combiné avec staleMaxAge, la valeur expirée est servie immédiatement pendant qu'une revalidation silencieuse s'effectue.
Comment monter un driver Redis dynamiquement avec des credentials issus de runtimeConfig ?|Dans server/plugins/storage.ts — defineNitroPlugin(() => { const storage = useStorage(); storage.mount('redis', redisDriver({ host: useRuntimeConfig().redis.host, ... })) })
Pourquoi ne jamais mettre un secret (clé API, JWT) dans runtimeConfig.public ?|runtimeConfig.public est injecté dans le bundle JS client — visible dans les DevTools du navigateur. Les secrets restent dans le niveau racine de runtimeConfig, accessible uniquement dans server/.
Comment lire les paramètres d'un body POST dans une route Nuxt serveur ?|const body = await readBody<MyDto>(event) — Nitro parse automatiquement le JSON. Lancer createError({ statusCode: 400, statusMessage: '...' }) si la validation échoue.
Quel est l'impact du preset Nitro sur la stratégie de cache ?|En node-server (VPS/Docker), la mémoire persiste entre requêtes — cachedFunction peut utiliser le LRU mémoire. En cloudflare-pages ou aws-lambda, le process est réinitialisé — il faut un storage externe (Redis, KV) pour un cache persistant.
Comment surcharger une valeur runtimeConfig via variable d'environnement sans rebuild ?|Nommer la variable NUXT_ + chemin SNAKE_CASE majuscules. Ex: runtimeConfig.redis.host → NUXT_REDIS_HOST=prod-redis.internal. La valeur est lue au démarrage du serveur, pas au build.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-28-nuxt-server-routes/README.md`. Tu construis une mini-API de contenu avec deux routes (`GET /api/content` et `GET /api/content/[slug]`), un `cachedEventHandler`, un header `Cache-Control`, et un secret via `runtimeConfig`. Corrigé commenté complet + variante J+30.

← Précédent : `modules/27-nuxt-data-fetching.md`
