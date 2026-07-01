---
titre: Nuxt — data fetching
cours: 02-vue
notions: [useFetch, useAsyncData, $fetch, différence serveur et client, clés et déduplication de requêtes, options lazy server transform pick, rafraîchissement refresh et watch, gestion erreur useFetch, payload et hydratation des données, ISR et stale-while-revalidate via route rules]
outcomes:
  - sait charger des données en SSR avec useFetch et useAsyncData
  - sait choisir entre useFetch, useAsyncData et $fetch selon le cas
  - sait éviter la double requête (clés, dédup, payload hydraté)
  - sait expliquer ISR et stale-while-revalidate et où les configurer
prerequis: [26-nuxt-pages-et-layouts]
next: 28-nuxt-server-routes
libs: [{ name: nuxt, version: "3" }, { name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — charger le contenu des pages en SSR (useAsyncData), ISR stale-while-revalidate sur les contenus dynamiques (comme Eudonet)
last-reviewed: 2026-07
---

← [26 — Nuxt : pages et layouts](26-nuxt-pages-et-layouts.md) | [28 — Nuxt : server routes](28-nuxt-server-routes.md) →

# Nuxt — data fetching

> **Outcomes — tu sauras FAIRE :** charger des données en SSR avec `useFetch`/`useAsyncData` sans double requête, choisir entre les trois outils selon le contexte, expliquer ISR et stale-while-revalidate et les configurer via `routeRules`.
> **Difficulté :** :star::star::star:

## 1. Cas concret d'abord

Tu rejoins l'équipe Bedrock. L'app Eudonet (CRM B2B) expose une API REST : contacts, contrats, historique. Ta mission : la page `/contacts/[id]` — une fiche contact complète chargée depuis l'API.

**Problème 1 — Le SEO manquant.** Un collègue a écrit :

```vue
<!-- pages/contacts/[id].vue — version naïve -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const route = useRoute()
const contact = ref(null)

onMounted(async () => {
  contact.value = await $fetch(`/api/contacts/${route.params.id}`)
})
</script>
```

Le crawl Google reçoit une page vide : les données arrivent *après* le montage client. Nuxt n'a rien à sérialiser côté serveur — le HTML initial ne contient aucune donnée. Zéro SEO.

**Problème 2 — La double requête malgré `useFetch`.** Tu corriges, mais sans clé explicite :

```vue
<script setup lang="ts">
const route = useRoute()
// Clé auto-générée = hash de l'URL + position dans le fichier (Nuxt 3)
// Si la position du code change (refactoring), la clé change
// → Nuxt ne retrouve pas les données dans le payload → refait la requête côté client
const { data: contact } = await useFetch(`/api/contacts/${route.params.id}`)
</script>
```

**Problème 3 — La liste `/contacts` qui frappe le serveur à chaque hit.** 500 contacts Eudonet chargés à chaque requête HTTP, alors que les données changent une fois par heure au plus. Il faut ISR : servir la version en cache, revalider en arrière-plan quand le TTL expire.

Ce module te donne les outils pour résoudre les trois.

---

## 2. Théorie complète, concise

### 2.1 SSR et le problème de la double requête

Nuxt exécute le code de `<script setup>` **deux fois** pour chaque page :

1. **Côté serveur** — génère le HTML initial. Les données récupérées via `useFetch`/`useAsyncData` sont sérialisées dans un **payload** embarqué dans la réponse HTML.
2. **Côté client (hydratation)** — Vue reprend le contrôle du HTML déjà rendu. Si Nuxt trouve les données dans le payload sous la bonne **clé**, il les réutilise directement — **aucune nouvelle requête réseau**.

```
Serveur                              Client (navigateur)
──────                               ─────────────────────────────────
useAsyncData('contact-42', handler)  HTML reçu contient :
  → handler() appelé                 <script>window.__NUXT__ = {
  → résultat { name: 'Alice' }         data: { "contact-42": { name: "Alice" } }
  → sérialisé dans le payload        }</script>
  → HTML généré                      
                                     Vue hydrate → lit __NUXT__["contact-42"]
                                     → data.value = { name: "Alice" }
                                     → AUCUNE requête réseau supplémentaire
```

**La clé** est le maillon critique : elle doit être identique entre le render serveur et l'hydratation client. Si elle change, Nuxt ne peut pas retrouver les données et relance la requête côté client.

### 2.2 `useFetch` — le wrapper universel

`useFetch` est un wrapper autour de `useAsyncData` + `$fetch` (ofetch). Il prend en charge automatiquement la génération de clé, l'exécution SSR, le payload et la réactivité.

```ts
const {
  data,     // Ref<DataT | null>           — données (null tant que non résolues)
  pending,  // Ref<boolean>                — true pendant le chargement
  error,    // Ref<FetchError | null>      — erreur ou null
  status,   // Ref<'idle' | 'pending' | 'success' | 'error'>
  refresh,  // () => Promise<void>         — re-déclenche manuellement
  execute,  // () => Promise<void>         — alias de refresh
  clear,    // () => void                  — vide data et error (Nuxt >= 3.10)
} = await useFetch<DataT>('/api/endpoint', options)
```

> **Nuxt 4 :** `data` est `Ref<DataT | undefined>` (pas `null`). L'option `getCachedData` permet une stratégie de cache personnalisée.

### 2.3 `useAsyncData` — contrôle explicite

`useFetch` est construit sur `useAsyncData`. La différence : `useAsyncData` prend une **clé explicite** (string) et un **handler arbitraire** — pas forcément un appel HTTP.

```ts
// Signature
useAsyncData(
  key: string,                    // clé explicite, stable, unique dans l'app
  handler: (nuxtApp) => Promise<DataT>,
  options?: AsyncDataOptions<DataT>
)

// Usage page dynamique
const route = useRoute()
const id = computed(() => String(route.params.id))

const { data: contact } = await useAsyncData(
  `contact-${id.value}`,                         // clé stable et déterministe
  () => $fetch<Contact>(`/api/contacts/${id.value}`)
)
```

**Quand utiliser `useAsyncData` plutôt que `useFetch` :**

| Situation | Outil |
|---|---|
| Page dynamique `/[id]` ou `/[slug]` | `useAsyncData` (clé explicite stable) |
| Combiner plusieurs requêtes (`Promise.all`) | `useAsyncData` |
| Source non-HTTP (cache store, DB directe) | `useAsyncData` |
| Transform complexe ou `getCachedData` (Nuxt 4) | `useAsyncData` |
| 90 % des pages simples (URL fixe) | `useFetch` suffit |

### 2.4 `$fetch` — pour les actions utilisateur

`$fetch` est le client HTTP de base de Nuxt (ofetch). Il n'est **pas** lié au cycle SSR — pas de payload, pas de dédup, pas de clé.

```ts
// Bon usage : action déclenchée par l'utilisateur
async function archiveContact(id: string): Promise<void> {
  await $fetch(`/api/contacts/${id}`, {
    method: 'PATCH',
    body: { archived: true },
  })
  await refresh() // actualiser l'affichage après mutation
}

// Mauvais usage : appel direct au top level de <script setup>
// const contact = await $fetch('/api/contacts/42')
// → s'exécute côté serveur ET côté client → double requête → perd SSR
```

**Tableau de décision :**

| Contexte | Outil |
|---|---|
| Données affichées dès le chargement (SSR) | `useFetch` ou `useAsyncData` |
| Page dynamique `/[slug]` ou `/[id]` | `useAsyncData` (clé explicite) |
| Combiner plusieurs requêtes | `useAsyncData` + `Promise.all` |
| Action utilisateur (clic, formulaire, mutation) | `$fetch` |

### 2.5 Clés et déduplication de requêtes

**`useFetch`** génère la clé automatiquement depuis un hash de l'URL + les options. Deux appels `useFetch('/api/posts')` dans la même page sont automatiquement dédupliqués — le second renvoie les données du cache.

**`useAsyncData`** utilise le premier argument string comme clé. Deux composants qui utilisent la même clé partagent les mêmes données réactives sans double fetch.

```ts
// Clé dupliquée → deuxième call retourne les données du premier (dédup)
const { data: a } = await useAsyncData('posts', () => $fetch('/api/posts'))
const { data: b } = await useAsyncData('posts', () => $fetch('/api/posts'))
// a.value === b.value — même objet réactif, une seule requête
```

**Option `dedupe` (Nuxt 3.9+, Nuxt 4) :**

```ts
// 'cancel' (défaut Nuxt 4) — annule la requête précédente si une nouvelle arrive avant qu'elle finisse
// 'defer' — attend que la requête en cours finisse avant de relancer
const { data } = await useFetch('/api/search', {
  query: { q: search },
  dedupe: 'cancel',
})
```

### 2.6 Options `lazy`, `server`, `transform`, `pick`, `default`

```ts
const { data, pending } = await useFetch('/api/contacts', {

  // lazy: false (défaut) — la page ATTEND les données avant d'afficher
  // lazy: true — la page s'affiche immédiatement, les données arrivent après
  //              (pending est true entre-temps, prévoir un état de chargement)
  lazy: false,

  // server: true (défaut) — fetch exécuté côté serveur → dans le payload → pas de double requête
  // server: false — fetch exécuté côté client uniquement → absent du HTML SSR → pas de SEO
  server: true,

  // transform — modifier la réponse avant stockage dans data
  // Si l'API retourne { items: Contact[], total: number } et qu'on veut seulement items :
  transform: (response) => response.items,

  // pick — sélectionner des clés au niveau RACINE de la réponse
  // Réduit le payload sérialisé serveur → client
  // Note : pick opère sur la réponse brute, avant transform
  pick: ['id', 'name', 'email'],

  // default — valeur initiale de data (évite les null checks dans le template)
  default: () => [] as Contact[],
})
```

**`lazy: true` ≠ `server: false` — distinction critique :**

| Option | Fetch côté serveur | Dans le payload SSR | Navigation bloquée |
|---|---|---|---|
| `lazy: false, server: true` (défaut) | Oui | Oui | Oui — attend les données |
| `lazy: true, server: true` | Oui | Oui | Non — page s'affiche d'abord |
| `lazy: false, server: false` | Non | Non | Non (côté client) |

`lazy: true` est bon pour le contenu non-critique sous la ligne de flottaison. `server: false` est réservé aux sections exclusivement privées/interactives (dashboard live, widget non-indexé).

### 2.7 `refresh`, `watch`, `refreshNuxtData`

```ts
// refresh — re-déclenche le handler de CE useFetch/useAsyncData
const { data: contacts, refresh } = await useFetch('/api/contacts')
await refresh()  // re-fetch, met à jour data

// watch — re-déclenche automatiquement quand une ref change
const page = ref(1)
const search = ref('')
const { data } = await useFetch('/api/contacts', {
  query: { page, q: search },
  watch: [page, search],  // re-fetch si page ou search changent
})

// refreshNuxtData() — rafraîchit TOUTES les asyncData de la page courante
await refreshNuxtData()

// refreshNuxtData('key') — rafraîchit par clé
await refreshNuxtData('contacts-list')

// clearNuxtData('key') — vide le cache sans re-fetch immédiat
clearNuxtData('contacts-list')
```

### 2.8 Gestion d'erreur

```ts
const { data, error, status } = await useFetch('/api/contacts/42')
// error est Ref<FetchError | null>
// FetchError expose : statusCode, statusMessage, data (body de la réponse erreur)
```

```vue
<template>
  <div v-if="status === 'pending'">Chargement…</div>

  <div v-else-if="error">
    <p v-if="error.statusCode === 404">Contact introuvable.</p>
    <p v-else>Erreur {{ error.statusCode }} — {{ error.statusMessage }}</p>
  </div>

  <ContactCard v-else-if="data" :contact="data" />
</template>
```

Pour les erreurs fatales (redirige vers la page d'erreur Nuxt) :

```ts
const { data } = await useFetch('/api/contacts/42', {
  onResponseError({ response }) {
    throw createError({
      statusCode: response.status,
      statusMessage: response.statusText,
      fatal: true,  // redirige vers pages/error.vue
    })
  },
})
```

### 2.9 Payload sérialisé — mécanisme interne (zéro double requête)

Quand `useFetch`/`useAsyncData` s'exécute côté serveur :

1. Le handler est appelé, le résultat `DataT` est obtenu.
2. Le résultat est sérialisé (JSON) et embarqué dans la réponse HTML :
   ```html
   <script>window.__NUXT__ = { data: { "contact-42": { id: 42, name: "Alice" } } }</script>
   ```
3. Le client hydrate, lit `window.__NUXT__["contact-42"]` → `data.value = { id: 42, name: "Alice" }`.
4. **Aucune requête réseau supplémentaire** — la clé `"contact-42"` était dans le payload.

Pour les routes ISR/SWR, un fichier `_payload.json` est généré aux côtés du HTML. Lors des navigations SPA côté client, Nuxt charge ce `_payload.json` depuis le cache (CDN ou serveur) au lieu de refaire les appels API — c'est ce qui rend la navigation ultra-rapide même sur des pages ISR.

**Conséquence sur les clés :** si la clé change entre le render serveur et l'hydratation client, Nuxt ne trouve pas les données dans `window.__NUXT__` → relance la requête → double fetch. Toujours construire les clés depuis des valeurs déterministes (paramètres de route, slugs) et non depuis des positions dans le fichier.

### 2.10 ISR et stale-while-revalidate via `routeRules`

Nuxt implémente le rendu hybride via `routeRules` dans `nuxt.config.ts`. Chaque règle s'applique à un pattern de route et définit la stratégie de rendu et de cache.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // SSG — pré-rendu à la build time, servi comme fichier statique
    '/about': { prerender: true },

    // SWR — cache 3600s sur serveur/reverse proxy
    // Sert le cache, revalide en arrière-plan après TTL
    '/blog/**': { swr: 3600 },

    // SWR sans TTL — header stale-while-revalidate sans max-age explicite
    '/feed': { swr: true },

    // ISR — comme SWR mais aussi mis en cache CDN (Vercel, Netlify, Cloudflare)
    // isr: 3600 → CDN cache 3600s puis revalide en arrière-plan
    '/contacts/**': { isr: 3600 },

    // ISR permanent — CDN cache jusqu'au prochain déploiement
    '/': { isr: true },

    // SSR classique — rendu à chaque requête, pas de cache
    '/dashboard': {},

    // Client-side only — pas de rendu serveur, pas d'indexation
    '/admin/**': { ssr: false },
  },
})
```

**Tableau comparatif des stratégies de rendu :**

| Stratégie | Config | Rendu | Cache | Fraîcheur des données | Cas d'usage |
|---|---|---|---|---|---|
| SSG | `prerender: true` | Build time | Fichier statique | Jusqu'au rebuild | Pages immuables |
| SSR | `{}` (défaut) | Chaque requête | Aucun | Toujours frais | Données user-specific |
| SWR | `swr: TTL` | Premier hit, puis cache | Serveur/proxy | Stale pendant TTL | Contenu partagé, change régulièrement |
| ISR | `isr: TTL` | Premier hit, puis cache CDN | CDN + serveur | Stale pendant TTL | Contenu public high-traffic |

**SWR vs ISR — même comportement, emplacement de cache différent :**
- `swr` → cache sur le serveur Nitro ou un reverse proxy (Nginx, Caddy, Varnish)
- `isr` → cache sur le serveur **ET** poussé sur le réseau CDN (Vercel Edge, Netlify CDN)
- `isr: true` sans TTL numérique → contenu reste en CDN **jusqu'au prochain déploiement**

**Flux ISR pour `/contacts/42` avec `isr: 3600` :**
1. **Première requête** → Nuxt/Nitro exécute `useAsyncData` serveur, génère HTML + `_payload.json`, met en cache CDN.
2. **Requêtes suivantes (TTL valide)** → CDN sert le HTML en cache, zéro exécution serveur.
3. **TTL expiré (après 3600s)** → CDN sert le HTML *périmé* (stale) à la requête courante, déclenche une **régénération en arrière-plan**.
4. **Régénération terminée** → CDN remplace le cache, aucun utilisateur n'a attendu.
5. **Navigation SPA** → Nuxt charge `_payload.json` depuis CDN, injecte les données sans API call.

> **Cas Eudonet/Bedrock :** la liste des contacts change rarement dans la journée. `isr: 3600` sur `/contacts/**` → première requête génère le HTML, les suivantes servent le CDN en quelques millisecondes, Nuxt regénère en arrière-plan quand le TTL expire.

---

## 3. Worked examples

### Exemple 1 — Fiche contact Eudonet avec `useAsyncData` (SSR garanti, clé stable)

```vue
<!-- pages/contacts/[id].vue -->
<script setup lang="ts">
interface Contract {
  id: string
  title: string
  status: 'active' | 'expired' | 'pending'
}

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  company: string
  contracts: Contract[]
}

const route = useRoute()

// computed pour le param : String() garantit string (route.params.id peut être string | string[])
const id = computed(() => String(route.params.id))

// useAsyncData — clé explicite construite depuis id.value
// Même valeur côté serveur et côté client → Nuxt retrouve les données dans le payload → pas de double requête
const {
  data: contact,
  pending,
  error,
  refresh,
} = await useAsyncData(
  `contact-${id.value}`,
  () => $fetch<Contact>(`/api/contacts/${id.value}`),
  {
    // watch : re-fetch si l'id change (navigation /contacts/42 → /contacts/43 sans rechargement de page)
    watch: [id],
    // default : valeur initiale de data (ici non-lazy donc pas critique, mais bonne pratique)
    default: () => null as Contact | null,
  }
)

// Erreur 404 → page d'erreur Nuxt (fatal: true interrompt le rendu)
if (!contact.value && !pending.value) {
  throw createError({ statusCode: 404, statusMessage: 'Contact introuvable', fatal: true })
}

// Mutation : $fetch direct (action utilisateur) + refresh pour réactualiser la fiche
async function archiveContact(): Promise<void> {
  await $fetch(`/api/contacts/${id.value}`, {
    method: 'PATCH',
    body: { archived: true },
  })
  await refresh()
}
</script>

<template>
  <div v-if="pending">Chargement de la fiche…</div>

  <div v-else-if="error">
    <p v-if="error.statusCode === 404">Contact introuvable.</p>
    <p v-else>Erreur {{ error.statusCode }} — {{ error.statusMessage }}</p>
  </div>

  <article v-else-if="contact">
    <h1>{{ contact.firstName }} {{ contact.lastName }}</h1>
    <p>{{ contact.company }}</p>
    <a :href="`mailto:${contact.email}`">{{ contact.email }}</a>

    <h2>Contrats ({{ contact.contracts.length }})</h2>
    <ul>
      <li v-for="c in contact.contracts" :key="c.id">
        {{ c.title }} — <span :class="`status--${c.status}`">{{ c.status }}</span>
      </li>
    </ul>

    <button @click="archiveContact">Archiver ce contact</button>
  </article>
</template>
```

**Ce que ce code garantit :**
- `contact-${id.value}` est stable et déterministe → données dans `window.__NUXT__` → pas de double fetch.
- `watch: [id]` → si l'utilisateur navigue de `/contacts/42` à `/contacts/43` sans rechargement, le `useAsyncData` relance la requête avec la nouvelle clé.
- `$fetch` pour la mutation + `refresh()` pour mettre à jour l'affichage — pas de rechargement de page.
- `createError({ fatal: true })` → redirige vers `pages/error.vue` si le contact n'existe pas.

### Exemple 2 — `routeRules` ISR dans `nuxt.config.ts`

```ts
// nuxt.config.ts — stratégie de cache Eudonet
export default defineNuxtConfig({
  routeRules: {
    // Fiches contact : ISR 1h
    // Premier accès → SSR + mise en cache CDN
    // Accès suivants → servis par CDN (<10ms, zéro serveur)
    // Après 3600s → prochaine requête sert le stale + déclenche régénération en arrière-plan
    '/contacts/**': { isr: 3600 },

    // Liste des contacts : SWR 5min (agrégation, refresh plus fréquent, pas forcément CDN)
    '/contacts': { swr: 300 },

    // Dashboard : SSR classique (données spécifiques à l'utilisateur connecté → pas de cache partagé)
    '/dashboard': {},

    // Admin : client-side only (pas d'indexation souhaitée, pas de SSR)
    '/admin/**': { ssr: false },
  },
})
```

**Vérifier le cache en développement :**
En dev, les `routeRules` sont ignorées (le cache Nitro n'est pas actif). Pour tester ISR/SWR, builder et prévisualiser :

```bash
nuxt build && nuxt preview
```

Puis observer les headers HTTP de la réponse (`Cache-Control`, `Age`, `X-Nitro-Cache`) dans DevTools Network.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — `$fetch` dans `onMounted` : perd le SSR, perd le SEO

```ts
// ❌ onMounted ne s'exécute QUE côté client — données absentes du HTML SSR
onMounted(async () => {
  contact.value = await $fetch('/api/contacts/42')
})

// ✅ useFetch ou useAsyncData au niveau top-level de <script setup>
const { data: contact } = await useAsyncData(
  'contact-42',
  () => $fetch('/api/contacts/42')
)
```

**Conséquences de `onMounted` :** HTML initial vide → crawler Google voit une page vide, FOUC (Flash Of Unstyled Content), `window.__NUXT__` ne contient pas les données → double requête systématique.

### PIÈGE #2 — Clé instable dans `useAsyncData`

```ts
// ❌ Sans clé : Nuxt 3 génère une clé depuis la position du code dans le fichier
// Si une ligne est ajoutée au-dessus, la clé change → cache invalidé entre déploiements
const { data } = await useAsyncData(() => $fetch('/api/contacts'))

// ❌ Clé avec route.params.id non casté : peut être string | string[]
const { data } = await useAsyncData(
  `contact-${route.params.id}`,   // si params.id = ['42'], clé = "contact-42" en string... parfois
  () => $fetch(`/api/contacts/${route.params.id}`)
)

// ✅ Clé explicite, castée, déterministe
const id = computed(() => String(route.params.id))
const { data } = await useAsyncData(
  `contact-${id.value}`,
  () => $fetch(`/api/contacts/${id.value}`),
  { watch: [id] }
)
```

### PIÈGE #3 — Confondre `lazy: true` et `server: false`

```ts
// lazy: true — TOUJOURS exécuté côté serveur, données dans le payload SSR
// Mais la navigation n'est PAS bloquée → composant rend d'abord avec data = null / default()
// → toujours prévoir pending et un default
const { data, pending } = await useFetch('/api/contacts', {
  lazy: true,
  default: () => [],
})

// server: false — JAMAIS exécuté côté serveur
// Données absentes du HTML → pas de SEO, client re-fetch obligatoire
// Usage légitime : widget "live" non-critique, section utilisateur privée
const { data } = await useFetch('/api/notifications', { server: false })
```

`lazy: true` + `server: true` (défaut) = SSR + non-bloquant. Optimal pour le contenu sous la ligne de flottaison tout en gardant les données dans le payload.

### PIÈGE #4 — `isr: true` vs `swr: true`

```ts
// isr: true → cache CDN PERMANENT jusqu'au prochain déploiement
// Si les données changent en production sans redéploiement → cache périmé indéfiniment
routeRules: { '/home': { isr: true } }

// swr: true → stale-while-revalidate sans max-age explicite
// Le cache expire selon la configuration du serveur amont / reverse proxy
routeRules: { '/home': { swr: true } }

// Recommandé : TTL explicite pour le contenu dynamique comme Eudonet
routeRules: { '/contacts/**': { isr: 3600 } }
// → jamais plus d'une heure de données périmées, revalide automatiquement
```

### PIÈGE #5 — `pick` opère sur la racine de la réponse, pas en profondeur

```ts
// Si l'API retourne { data: { id, name, secret }, meta: { total } }
// pick cherche les clés "id" et "name" à la RACINE → undefined
const { data } = await useFetch('/api/contact', {
  pick: ['id', 'name'],    // cherche response.id, response.name (inexistants ici)
})

// Utiliser transform pour extraire d'abord, puis sélectionner
const { data } = await useFetch('/api/contact', {
  transform: (r) => ({ id: r.data.id, name: r.data.name }),
})
```

---

## 5. Ancrage TribuZen

Dans TribuZen, le data fetching SSR s'applique dès le front-office public :

**Configuration `routeRules` TribuZen :**

```ts
// nuxt.config.ts — TribuZen
export default defineNuxtConfig({
  routeRules: {
    // Page d'accueil : ISR 1h (contenu éditorial stable, haute volumétrie)
    '/': { isr: 3600 },
    // Articles communauté : ISR 30min (créés par les membres, change modérément)
    '/articles/**': { isr: 1800 },
    // Profils publics : SWR 10min (mis à jour fréquemment, cache serveur suffisant)
    '/profils/**': { swr: 600 },
    // Espace membre : SSR classique (données user-specific, pas de cache partagé)
    '/espace/**': {},
  },
})
```

**`useAsyncData` sur les pages dynamiques TribuZen :**

```vue
<!-- pages/articles/[slug].vue — TribuZen -->
<script setup lang="ts">
interface Article {
  slug: string
  title: string
  body: string
  author: { name: string; avatar: string }
  publishedAt: string
}

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data: article, error } = await useAsyncData(
  `article-${slug.value}`,              // clé stable = slug de l'URL
  () => $fetch<Article>(`/api/articles/${slug.value}`),
  {
    watch: [slug],                       // re-fetch si navigation entre articles
    transform: (a) => ({
      ...a,
      publishedAt: new Date(a.publishedAt).toLocaleDateString('fr-FR'),
    }),
  }
)

if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article introuvable', fatal: true })
}
</script>
```

Fichiers cibles dans `smaurier/tribuzen` :

```
tribuzen/
  nuxt.config.ts                  ← routeRules ISR/SWR
  pages/
    index.vue                     ← useFetch (page d'accueil, clé auto suffisante)
    articles/
      [slug].vue                  ← useAsyncData + clé stable
    profils/
      [username].vue              ← useAsyncData + watch
    espace/
      index.vue                   ← useAsyncData SSR classique, données utilisateur
```

---

## 6. Points clés

1. `useFetch` = `useAsyncData` + `$fetch` : wrapper pratique, clé auto-générée depuis l'URL + options.
2. `useAsyncData` = contrôle total : clé explicite (obligatoire sur pages dynamiques `/[id]`), handler arbitraire.
3. `$fetch` = actions utilisateur uniquement : pas de payload SSR, pas de dédup, pas de clé.
4. La clé lie les données du payload serveur (`window.__NUXT__`) à l'hydratation client — une clé instable provoque une double requête.
5. `server: true` (défaut) + `lazy: false` (défaut) = SSR bloquant : données garanties au premier paint, idéal SEO.
6. `lazy: true` ≠ `server: false` : `lazy: true` est SSR + non-bloquant ; `server: false` exclut totalement le SSR.
7. `transform` modifie la réponse après réception ; `pick` sélectionne des clés de premier niveau — les deux réduisent le payload.
8. `watch: [ref]` relance la requête quand la ref change ; `refresh()` la relance manuellement après une mutation.
9. `routeRules: { '/path/**': { swr: 3600 } }` → SWR : cache serveur/proxy, stale-while-revalidate toutes les 3600s.
10. `routeRules: { '/path/**': { isr: 3600 } }` → ISR : comme SWR + cache CDN ; `isr: true` = CDN permanent jusqu'au prochain déploiement.

---

## 7. Seeds Anki

```
Pourquoi useFetch évite-t-il la double requête en SSR ?|Les données récupérées côté serveur sont sérialisées dans window.__NUXT__ (payload embarqué dans le HTML). Lors de l'hydratation client, Nuxt lit ce payload via la clé → aucun nouvel appel réseau.
Quelle est la différence principale entre useFetch et useAsyncData ?|useFetch = wrapper autour de useAsyncData + $fetch avec clé auto-générée depuis l'URL. useAsyncData prend une clé explicite + un handler arbitraire, offre plus de contrôle (multi-requêtes, source non-HTTP, getCachedData Nuxt 4).
Quand utiliser $fetch plutôt que useFetch ou useAsyncData ?|Pour les actions utilisateur (clic, formulaire, mutations POST/PUT/DELETE). $fetch n'est pas lié au cycle SSR — pas de payload, pas de clé, pas de dédup. L'utiliser au top-level de script setup provoque une double requête.
Quelle est la différence entre lazy: true et server: false ?|lazy: true = fetch exécuté côté serveur (données dans le payload SSR), mais la navigation n'est pas bloquée. server: false = fetch jamais exécuté côté serveur — données absentes du HTML, pas de SEO.
Quelle différence entre swr: 3600 et isr: 3600 dans routeRules ?|swr: 3600 = cache sur le serveur Nitro ou un reverse proxy, revalide en arrière-plan toutes les 3600s. isr: 3600 = idem + poussé sur le réseau CDN (Vercel, Netlify). Plus haute performance pour le trafic public.
Que se passe-t-il si la clé useAsyncData est instable entre serveur et client ?|Nuxt ne retrouve pas les données dans window.__NUXT__ → relance une requête côté client → double requête, perd l'avantage SSR. Construire la clé depuis des paramètres déterministes (route.params.id casté en String).
Que fait l'option transform dans useFetch et quand l'utiliser plutôt que pick ?|transform reçoit la réponse brute et retourne une valeur transformée stockée dans data. Utiliser transform pour extraire un sous-objet (response.data.items) ou reformater. pick sélectionne uniquement des clés de PREMIER NIVEAU de la réponse brute — insuffisant pour les réponses imbriquées.
Que signifie isr: true sans valeur numérique dans routeRules ?|Le contenu est mis en cache CDN de façon permanente jusqu'au prochain déploiement. Il n'y a pas de TTL — la revalidation n'arrive qu'à la prochaine mise en production. Attention aux contenus dynamiques qui peuvent devenir périmés sans redéploiement.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-27-nuxt-data-fetching/README.md`. Construire une page liste SSR avec `useAsyncData` (clé explicite, `transform`, `default`), une page détail dynamique `/contenus/[id]`, une mutation `$fetch` + `refresh`, et la configuration `routeRules` ISR dans `nuxt.config.ts`. Vérification anti-double-fetch via DevTools Network. Corrigé commenté intégral + variante J+30.
