# Lab 29 — Nuxt SEO et meta

> **Outcome :** à la fin, tu sais ajouter `useSeoMeta`, un canonical, un JSON-LD `Event` et un `titleTemplate` global à une page Nuxt 3 TribuZen.
> **Vrai outil :** Nuxt 3 + navigateur (`Ctrl+U` / vue source comme oracle de vérification SSR).
> **Feedback :** le coach valide en session — inspecte le HTML source pour confirmer que les balises sont dans le rendu serveur initial.

---

## Énoncé

Tu ajoutes le SEO complet à la page activité de TribuZen. Le projet Nuxt de départ a une page `/activites/[slug]` qui charge des données mais n'a aucune balise meta.

**Objectif :** quand Google ou LinkedIn crawle `https://tribuzen.app/activites/sortie-raquettes`, il voit dans le HTML initial :
- Un `<title>Sortie raquettes Vercors — TribuZen</title>`
- Des balises `og:title`, `og:description`, `og:image` correctes (image en URL absolue)
- Une balise `<link rel="canonical">`
- Un bloc `<script type="application/ld+json">` avec un Event schema.org

**Starter minimal** — utilise ton projet Nuxt 3 existant ou crée-en un :

```ts
// server/api/activites/[slug].ts
export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug')
  return {
    slug,
    nom: 'Sortie raquettes Vercors',
    description: 'Randonnée en raquettes au plateau du Vercors, tous niveaux, équipement fourni.',
    imageUrl: 'https://tribuzen.app/og/sortie-raquettes.jpg',
    dateDebut: '2027-01-15T09:00:00',
    dateFin: '2027-01-15T17:00:00',
    lieu: 'Plateau du Vercors, Isère',
  }
})
```

```vue
<!-- pages/activites/[slug].vue — STARTER sans SEO -->
<script setup lang="ts">
const route = useRoute()

interface Activite {
  slug: string
  nom: string
  description: string
  imageUrl: string
  dateDebut: string
  dateFin: string
  lieu: string
}

const { data: activite } = await useFetch<Activite>(`/api/activites/${route.params.slug}`)

// ← À toi d'ajouter : useSeoMeta, useHead (canonical + JSON-LD)
</script>

<template>
  <main v-if="activite">
    <h1>{{ activite.nom }}</h1>
    <p>{{ activite.description }}</p>
    <p>{{ activite.lieu }}</p>
  </main>
</template>
```

```vue
<!-- app.vue — STARTER sans titleTemplate -->
<script setup lang="ts">
// ← À toi d'ajouter : useHead titleTemplate + htmlAttrs lang
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

```ts
// nuxt.config.ts — extrait à ajouter
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      siteUrl: 'https://tribuzen.app',  // accessible via useRuntimeConfig().public.siteUrl
    },
  },
})
```

---

## Étapes (en friction)

1. **titleTemplate global** dans `app.vue` — `useHead` avec une **fonction** qui gère le cas vide (si aucune page ne définit de titre, afficher `'TribuZen'` proprement, sans tiret isolé). Ajoute `htmlAttrs: { lang: 'fr' }`.
2. **`useSeoMeta`** dans `pages/activites/[slug].vue` — titre, description, ogTitle, ogDescription, ogImage (URL absolue via `useRuntimeConfig()`), ogType `'article'`, ogUrl, twitterCard `'summary_large_image'`, twitterImage. Utilise des **getters** `() => ...` pour la réactivité.
3. **Canonical** — `useHead({ link: [{ rel: 'canonical', href: ... }] })` avec `route.path` (sans query params).
4. **JSON-LD Event** — `useHead({ script: [{ type: 'application/ld+json', innerHTML: ... }] })` avec `@type: 'Event'`, nom, dates ISO 8601, lieu (`@type: 'Place'`), organizer TribuZen. Vérifier : `innerHTML` et non `textContent`.
5. **Vérification SSR** — lance `pnpm dev`, navigue sur `/activites/sortie-raquettes`, puis `Ctrl+U` dans le navigateur. Les balises doivent apparaître dans le HTML source brut, pas seulement dans l'inspecteur DOM (qui exécute JS).
6. **Cas vide** — vérifie sur la page d'accueil (sans titre de page défini) que `<title>` vaut `TribuZen` et non ` — TribuZen`.

---

## Corrigé complet commenté

### `app.vue`

```vue
<script setup lang="ts">
// titleTemplate global — s'applique à toutes les pages de l'app
// La fonction reçoit le titre défini par la page courante (via useSeoMeta.title)
useHead({
  titleTemplate: (titleChunk) => {
    // Sans titre de page → titre racine propre, sans tiret isolé
    return titleChunk ? `${titleChunk} — TribuZen` : 'TribuZen'
  },
  htmlAttrs: {
    lang: 'fr',  // Obligatoire RGAA (critère 8.3) et signal SEO de langue
  },
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

### `pages/activites/[slug].vue`

```vue
<script setup lang="ts">
const route = useRoute()
// useRuntimeConfig expose les variables publiques déclarées dans nuxt.config
const config = useRuntimeConfig()

interface Activite {
  slug: string
  nom: string
  description: string
  imageUrl: string
  dateDebut: string
  dateFin: string
  lieu: string
}

const { data: activite } = await useFetch<Activite>(`/api/activites/${route.params.slug}`)

// ── 1. SEO + Open Graph + Twitter ─────────────────────────────────────────
// useSeoMeta : syntaxe directe, autocomplétion TypeScript, recommandé pour les balises SEO
// Getters () => ... : réévalués quand activite.value change (navigation client-side)
useSeoMeta({
  // title est passé au titleTemplate de app.vue
  // Résultat : "Sortie raquettes Vercors — TribuZen"
  title: () => activite.value?.nom ?? 'Activité',
  description: () => activite.value?.description ?? '',

  // Open Graph — utilisés par LinkedIn, Facebook, Discord, WhatsApp, Slack
  ogTitle: () => activite.value?.nom ?? 'Activité TribuZen',
  ogDescription: () => activite.value?.description ?? '',
  // og:image DOIT être une URL absolue — les crawlers sociaux ne résolvent pas les relatives
  ogImage: () => activite.value?.imageUrl ?? `${config.public.siteUrl}/og-default.jpg`,
  ogType: 'article',
  ogUrl: () => `${config.public.siteUrl}/activites/${activite.value?.slug ?? route.params.slug}`,

  // Twitter / X cards
  twitterCard: 'summary_large_image',  // grande image de prévisualisation
  twitterImage: () => activite.value?.imageUrl ?? `${config.public.siteUrl}/og-default.jpg`,
})

// ── 2. Canonical + JSON-LD ─────────────────────────────────────────────────
// useHead pour les éléments non couverts par useSeoMeta
useHead({
  link: [
    {
      rel: 'canonical',
      // route.path = chemin sans query params (/activites/sortie-raquettes)
      // Protège contre la duplication si l'URL contient ?ref=newsletter, ?page=1, etc.
      href: () => `${config.public.siteUrl}${route.path}`,
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      // innerHTML : injecté tel quel, sans encodage HTML
      // JAMAIS textContent : Nuxt encode < > & → JSON invalide pour les crawlers
      innerHTML: () => JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: activite.value?.nom,
        description: activite.value?.description,
        startDate: activite.value?.dateDebut,   // format ISO 8601 requis par schema.org
        endDate: activite.value?.dateFin,
        image: activite.value?.imageUrl,
        location: {
          '@type': 'Place',
          name: activite.value?.lieu,
        },
        organizer: {
          '@type': 'Organization',
          name: 'TribuZen',
          url: 'https://tribuzen.app',
        },
      }),
    },
  ],
})
</script>

<template>
  <main v-if="activite">
    <!--
      h1 = signal SEO principal ET repère de navigation lecteur d'écran (RGAA critère 9.1)
      Un seul h1 par page — son contenu doit correspondre au title dans les balises meta
    -->
    <h1>{{ activite.nom }}</h1>
    <p>{{ activite.description }}</p>

    <!--
      Dimensions explicites → pas de changement de layout après chargement
      → CLS (Cumulative Layout Shift) = 0 → score Core Web Vitals préservé
      alt descriptif → Google Images + WCAG 1.1.1
    -->
    <img
      :src="activite.imageUrl"
      :alt="`Photo de l'activité ${activite.nom}`"
      width="1200"
      height="630"
    />
    <p>{{ activite.lieu }}</p>
    <p>{{ activite.dateDebut }} → {{ activite.dateFin }}</p>
  </main>

  <p v-else>Activité introuvable.</p>
</template>
```

**Vérification attendue dans le HTML source (`Ctrl+U`) :**

```html
<head>
  <title>Sortie raquettes Vercors — TribuZen</title>
  <meta name="description" content="Randonnée en raquettes au plateau du Vercors..." />
  <meta property="og:title" content="Sortie raquettes Vercors" />
  <meta property="og:description" content="Randonnée en raquettes..." />
  <meta property="og:image" content="https://tribuzen.app/og/sortie-raquettes.jpg" />
  <meta property="og:type" content="article" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="canonical" href="https://tribuzen.app/activites/sortie-raquettes" />
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Event",...}</script>
</head>
```

Si ces balises apparaissent dans le HTML source brut (pas seulement dans l'inspecteur DOM), le SSR fonctionne et les crawlers les verront.

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — reproduis de mémoire en 30 minutes :**

1. Ajoute un **`BreadcrumbList` JSON-LD** en plus du JSON-LD `Event` sur la même page : `Accueil → Activités → Sortie raquettes Vercors`. Un seul appel `useHead` avec deux objets dans le tableau `script`.
2. Ajoute des balises **hreflang** (`fr` et `en`) dans `useHead` — simule un site bilingue même sans vraiment avoir les pages EN (URL fictives acceptées).
3. Sur la page d'accueil (`pages/index.vue`), ajoute un JSON-LD `Organization` décrivant TribuZen (nom, url, logo, description).
4. **Sans ouvrir ce corrigé ni le module 29.**

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, les fichiers cibles :

```
tribuzen/
  app/
    app.vue                         ← titleTemplate + htmlAttrs lang="fr"
    pages/
      index.vue                     ← useSeoMeta accueil + JSON-LD Organization
      activites/
        [slug].vue                  ← useSeoMeta + canonical + JSON-LD Event
      tribus/
        [slug].vue                  ← même pattern, JSON-LD Organization/Group
      evenements/
        [slug].vue                  ← JSON-LD Event + BreadcrumbList
  server/
    api/
      activites/
        [slug].ts                   ← handler (module 28 — server routes)
  public/
    robots.txt
  nuxt.config.ts                    ← runtimeConfig.public.siteUrl + @nuxtjs/sitemap
```

**Commit cible :**
```
feat(seo): useSeoMeta + JSON-LD Event + canonical sur pages/activites/[slug]
```
