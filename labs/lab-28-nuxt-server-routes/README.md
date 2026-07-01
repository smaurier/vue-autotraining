# Lab 28 — Nuxt server routes et Nitro

> **Outcome :** à la fin, tu sais créer des routes API Nuxt dans `server/api/`, lire params/query/body, mettre en cache une réponse avec `cachedEventHandler`, poser un header `Cache-Control`, et sécuriser une clé API via `runtimeConfig`.
> **Vrai outil :** Nuxt 3 + Nitro (dev server). Les routes se testent via `curl` ou le navigateur sur `localhost:3000/api/...`.
> **Feedback :** le coach valide les réponses JSON en session avec `curl` — pas de test-runner auto-correcteur.

---

## Énoncé

Tu construis l'API de contenu de TribuZen — une mini-API de publication tribale. Le cahier des charges exact :

1. **Route liste** `GET /api/content` — retourne tous les articles (simulés). Cache Nitro 5 minutes, SWR activé.
2. **Route détail** `GET /api/content/[slug]` — retourne un article par son slug. Erreur 404 si introuvable.
3. **Cache HTTP** — header `Cache-Control: public, s-maxage=300, stale-while-revalidate=3600` sur la route liste.
4. **Secret** — une clé `contentApiKey` dans `runtimeConfig` (server-only). La route liste doit la lire et la loguer côté serveur (pas côté client).
5. **Variante POST** — route `POST /api/content` qui lit le body (`{ title, slug, body }`) et valide que `title` et `slug` sont présents (sinon 400).

**Données de départ à utiliser dans les routes** :

```ts
const articles = [
  { slug: 'bienvenue', title: 'Bienvenue dans TribuZen', body: 'Contenu de la tribu.' },
  { slug: 'premiers-pas', title: 'Premiers pas', body: 'Guide de démarrage.' },
  { slug: 'faq', title: 'FAQ', body: 'Questions fréquentes.' },
]
```

**Pas de gap-fill** — tu crées les fichiers serveur de zéro à partir du starter ci-dessous.

### Starter minimal

Dans un projet Nuxt 3 existant (ou créé avec `npx nuxi init lab-28`) :

```
# Structure cible à produire
server/
  api/
    content.get.ts        ← route liste (cachedEventHandler)
    content.post.ts       ← route création (readBody + validation)
    content/
      [slug].get.ts       ← route détail (getRouterParam + 404)
nuxt.config.ts            ← ajouter runtimeConfig.contentApiKey
```

Lance le dev server : `pnpm dev` (ou `npm run dev`). Tester avec :

```bash
curl http://localhost:3000/api/content
curl http://localhost:3000/api/content/bienvenue
curl http://localhost:3000/api/content/inexistant
curl -X POST http://localhost:3000/api/content \
  -H "Content-Type: application/json" \
  -d '{"title":"Nouveau","slug":"nouveau","body":"Texte"}'
curl -X POST http://localhost:3000/api/content \
  -H "Content-Type: application/json" \
  -d '{"body":"Pas de title ni slug"}'
```

---

## Étapes (en friction)

1. **Configure `runtimeConfig`** dans `nuxt.config.ts` — ajouter `contentApiKey: ''` au niveau racine (server-only). Ne pas le mettre dans `public`.
2. **Crée `server/api/content.get.ts`** — wrapper avec `cachedEventHandler`. Handler : lit `config.contentApiKey` via `useRuntimeConfig(event)`, logge la clé côté serveur (`console.log`), set le header `Cache-Control`, retourne les articles.
3. **Vérifie le cache** — appelle deux fois `GET /api/content` et observe dans les logs serveur que le `console.log` ne s'affiche qu'une seule fois (la deuxième requête sert depuis le cache).
4. **Crée `server/api/content/[slug].get.ts`** — `getRouterParam(event, 'slug')`, trouve l'article correspondant dans le tableau, lève `createError({ statusCode: 404, statusMessage: '...' })` si absent.
5. **Crée `server/api/content.post.ts`** — `await readBody<{ title: string; slug: string; body: string }>(event)`, valide `title` et `slug`, lève 400 si manquants, retourne le nouvel article avec un `id: Date.now()`.
6. **Teste les cas limites** : slug inexistant → 404, POST sans title → 400, POST complet → 201 (ou 200).

---

## Corrigé complet commenté

### `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  runtimeConfig: {
    // Server-only : jamais exposé dans le bundle client
    contentApiKey: '',  // override au runtime : NUXT_CONTENT_API_KEY=my-secret
    public: {
      // apiBase est accessible côté client — ok, pas de secret ici
      apiBase: '/api',
    },
  },
})
```

### `server/api/content.get.ts`

```ts
// Route : GET /api/content
// Wrappée avec cachedEventHandler — résultat stocké en mémoire Nitro 5 min

const articles = [
  { slug: 'bienvenue', title: 'Bienvenue dans TribuZen', body: 'Contenu de la tribu.' },
  { slug: 'premiers-pas', title: 'Premiers pas', body: 'Guide de démarrage.' },
  { slug: 'faq', title: 'FAQ', body: 'Questions fréquentes.' },
]

export default cachedEventHandler(
  async (event) => {
    // useRuntimeConfig(event) — passer event pour le bon contexte Nuxt 4
    const config = useRuntimeConfig(event)

    // La clé est lue côté serveur uniquement — jamais exposée dans la réponse
    // Ce console.log n'apparaît que lors d'un cache MISS (premier appel ou après expiration)
    console.log('[server] content API key used:', config.contentApiKey ? 'ok' : 'MISSING')

    // Couche 1 : header HTTP — CDN et navigateur cachent la réponse 5 min
    // s-maxage cible les CDN (Vercel Edge, Cloudflare), max-age cible le navigateur
    setResponseHeader(
      event,
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=3600'
    )

    // En vrai produit : appel vers une DB ou une API externe ici
    return articles
  },
  {
    // Couche 2 : storage Nitro (mémoire par défaut, Redis si configuré)
    maxAge: 60 * 5,            // TTL 5 minutes
    swr: true,                 // SWR : sert l'ancienne valeur pendant la revalidation
    name: 'content-list',      // namespace dans le storage Nitro
    // Pas de getKey custom : une seule clé pour toute la liste
  }
)
```

### `server/api/content/[slug].get.ts`

```ts
// Route : GET /api/content/:slug
// Paramètre dynamique [slug] — pas de cache (chaque slug est différent mais peu de variantes)

const articles = [
  { slug: 'bienvenue', title: 'Bienvenue dans TribuZen', body: 'Contenu de la tribu.' },
  { slug: 'premiers-pas', title: 'Premiers pas', body: 'Guide de démarrage.' },
  { slug: 'faq', title: 'FAQ', body: 'Questions fréquentes.' },
]

export default defineEventHandler((event) => {
  // getRouterParam lit le segment [slug] de l'URL
  // Retourne string | undefined — vérifier avant usage
  const slug = getRouterParam(event, 'slug')

  const article = articles.find((a) => a.slug === slug)

  if (!article) {
    // createError lance une H3Error → réponse JSON { statusCode: 404, message: '...' }
    throw createError({
      statusCode: 404,
      statusMessage: `Article "${slug}" introuvable`,
    })
  }

  return article
})
// GET /api/content/bienvenue → { slug: 'bienvenue', title: '...', body: '...' }
// GET /api/content/xyz      → 404 { statusCode: 404, statusMessage: 'Article "xyz" introuvable' }
```

### `server/api/content.post.ts`

```ts
// Route : POST /api/content
// Crée un article — lit le body, valide, retourne le nouvel article

interface CreateArticleDto {
  title: string
  slug: string
  body: string
}

export default defineEventHandler(async (event) => {
  // readBody parse le JSON du corps de la requête POST
  // Le générique <CreateArticleDto> type l'objet retourné — pas de validation runtime automatique
  const dto = await readBody<CreateArticleDto>(event)

  // Validation manuelle — en production, utiliser zod ou valibot pour un schéma robuste
  if (!dto.title || !dto.slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Les champs title et slug sont obligatoires',
    })
  }

  // Simulation de création — en vrai : INSERT en base, retourner l'entité persistée
  const newArticle = {
    id: Date.now(),          // ID auto-généré (ms depuis epoch) — unicité suffisante pour le lab
    title: dto.title,
    slug: dto.slug,
    body: dto.body ?? '',    // body optionnel — string vide si absent
    createdAt: new Date().toISOString(),
  }

  return newArticle
  // Note : Nuxt retourne 200 par défaut. Pour 201 Created :
  // setResponseStatus(event, 201)
  // return newArticle
})
// POST body: { title: 'X', slug: 'x', body: 'Y' } → { id: 123456, title: 'X', slug: 'x', ... }
// POST body: { body: 'Y' }                         → 400 { statusMessage: 'Les champs...' }
```

**Pourquoi ce corrigé est correct :**
- `cachedEventHandler` : le `console.log` ne s'affiche qu'au MISS — preuve que le cache fonctionne.
- `useRuntimeConfig(event)` : l'event est passé pour la compatibilité Nuxt 4 (résolution du contexte SSR).
- `getRouterParam` plutôt que `event.context.params?.slug` : API officielle, meilleur typage.
- `createError` : produit automatiquement une réponse JSON structurée avec le bon status HTTP.
- La clé `contentApiKey` n'apparaît jamais dans la réponse — elle reste côté serveur.

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — sans ouvrir ce corrigé, en 30 minutes :**

1. Ajoute un **paramètre de query** `?category=guides` à la route liste — le handler filtre les articles dont `category` match (ajoute un champ `category` aux données de départ). La clé de cache doit varier par catégorie (`getKey`).
2. Ajoute un **middleware** `server/middleware/01-log.ts` qui logge la méthode HTTP et le path de chaque requête (`event.method`, `event.path`).
3. Le header `Cache-Control` doit être différent selon que la catégorie est `'all'` (300 s) ou une catégorie spécifique (60 s).

**Critère de réussite :** deux appels `GET /api/content?category=guides` produisent un seul `console.log` dans les logs serveur (cache hit sur le deuxième). Le middleware logge bien toutes les requêtes.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, ces routes server s'intègrent ainsi :

```
tribuzen/
  server/
    api/
      tribes/[id]/posts.get.ts        ← cachedEventHandler, clé par id tribu
      tribes/[id]/posts.post.ts       ← readBody + auth middleware check
      content/[slug].get.ts           ← getRouterParam, 404 si inexistant
    middleware/
      01-auth.ts                      ← vérifie Bearer token pour /api/protected/*
    plugins/
      storage.ts                      ← mount Redis (credentials depuis runtimeConfig)
```

**Différences par rapport au lab :**
- Les données viendront d'une DB (Drizzle/Prisma) plutôt que d'un tableau en mémoire.
- Le `contentApiKey` sera une vraie clé API externe (ex : service de contenu headless).
- Le driver Redis sera monté via `server/plugins/storage.ts` pour le cache persistant multi-instance.
- La validation du body POST utilisera **Zod** (`z.object({ title: z.string().min(1), ... }).parse(body)`) plutôt qu'un `if` manuel.

**Commit cible :**
```
feat(server): routes content GET/POST + cachedEventHandler + runtimeConfig
```
