---
titre: Nuxt — SEO et meta
cours: 02-vue
notions: [useHead et useSeoMeta, balises meta dynamiques, Open Graph et Twitter cards, title template, données structurées JSON-LD, sitemap et robots, canonical et hreflang, SEO et SSR le lien, performance et Core Web Vitals pour le SEO]
outcomes:
  - sait définir des meta dynamiques par page (useHead, useSeoMeta)
  - sait gérer Open Graph, Twitter cards et un title template global
  - sait ajouter des données structurées JSON-LD
  - sait relier SSR, performance et référencement
prerequis: [28-nuxt-server-routes]
next: 30-storybook-setup
libs: [{ name: nuxt, version: "3" }, { name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — meta et Open Graph par page de contenu, JSON-LD, canonical (comme le SEO du Front-Office Eudonet)
last-reviewed: 2026-07
---

# Nuxt — SEO et meta

> **Outcomes — tu sauras FAIRE :** définir des meta dynamiques par page avec `useHead` et `useSeoMeta`, configurer Open Graph et Twitter cards, injecter du JSON-LD, relier SSR et référencement.
> **Difficulté :** :star::star::star:

## 1. Cas concret d'abord

TribuZen a des pages de contenu publiques : page d'une tribu (`/tribus/[slug]`), page d'une activité (`/activites/[slug]`), page d'un événement (`/evenements/[slug]`). Ces pages doivent :

1. **Être indexées par Google** — pour qu'un parent cherchant "activités famille Lyon" trouve TribuZen.
2. **Générer une belle prévisualisation** sur LinkedIn, Slack, WhatsApp quand un membre partage un lien.
3. **Être reconnues par les moteurs** comme du contenu structuré (type d'événement, organisateur…).

Le problème : une application Vue 3 classique (SPA sans SSR) envoie au crawler Google un HTML presque vide — juste un `<div id="app"></div>`. Le JavaScript s'exécute après, mais Google ne l'attend pas. **Les pages ne sont pas indexées.**

**Question avant la théorie :** si tu inspectes le HTML source (`Ctrl+U`) d'une page TribuZen en mode SPA, que voit le crawler ? Et en mode SSR Nuxt ?

---

## 2. Théorie complète, concise

### 2.1 `useHead` vs `useSeoMeta` — choisir le bon outil

Les deux composables sont **auto-importés dans Nuxt** (pas besoin d'import).

**`useHead`** — API générique pour tout le `<head>` :

```ts
// Gère title, meta[], link[], script[], style[], bodyAttrs, htmlAttrs
useHead({
  title: 'Ma page',
  meta: [
    { name: 'description', content: 'Description de la page' },
    { property: 'og:title', content: 'Ma page' },  // Open Graph = property, pas name
  ],
  link: [
    { rel: 'canonical', href: 'https://tribuzen.app/tribus/alpins' },
  ],
  script: [
    { type: 'application/ld+json', innerHTML: JSON.stringify({ '@context': 'https://schema.org' }) },
  ],
})
```

**`useSeoMeta`** — sucre syntaxique **recommandé pour le SEO** :

```ts
// Clés directes, autocomplétion TypeScript, moins verbeux
useSeoMeta({
  title: 'Ma page',
  description: 'Description de la page',
  ogTitle: 'Ma page',              // équivalent à { property: 'og:title', content: ... }
  ogDescription: 'Description',
  ogImage: 'https://tribuzen.app/og/alpins.jpg',
  twitterCard: 'summary_large_image',
})
```

**Règle :** `useSeoMeta` pour les balises SEO/OG/Twitter. `useHead` pour le reste (canonical, JSON-LD, scripts, liens CSS).

### 2.2 Meta dynamiques réactives par page

Les meta suivent les données asynchrones avec des **getters** (fonctions `() => value`) ou des **refs** directes :

```vue
<script setup lang="ts">
// pages/activites/[slug].vue
const route = useRoute()
const { data: activite } = await useFetch(`/api/activites/${route.params.slug}`)

// Getter () => ... : Nuxt réévalue quand activite.value change
useSeoMeta({
  title: () => activite.value?.nom ?? 'Activité',
  description: () => activite.value?.description ?? '',
  ogTitle: () => activite.value?.nom ?? 'Activité TribuZen',
  ogDescription: () => activite.value?.description ?? '',
  ogImage: () => activite.value?.imageUrl ?? 'https://tribuzen.app/og-default.jpg',
  ogType: 'article',
  twitterCard: 'summary_large_image',
})

// canonical via useHead (useSeoMeta n'a pas de propriété canonical)
const config = useRuntimeConfig()
useHead({
  link: [
    { rel: 'canonical', href: () => `${config.public.siteUrl}/activites/${route.params.slug}` },
  ],
})
</script>
```

### 2.3 Open Graph + Twitter cards

**Open Graph** (utilisé par Facebook, LinkedIn, Discord, WhatsApp, Slack) :

| Propriété `useSeoMeta` | Meta HTML généré | Rôle |
|---|---|---|
| `ogTitle` | `og:title` | Titre dans la carte |
| `ogDescription` | `og:description` | Description courte |
| `ogImage` | `og:image` | Image de prévisualisation |
| `ogUrl` | `og:url` | URL canonique dans la carte |
| `ogType` | `og:type` | `'website'` ou `'article'` |

**Twitter / X cards** :

```ts
useSeoMeta({
  twitterCard: 'summary_large_image',  // format grande image
  twitterTitle: 'Titre sur Twitter',
  twitterDescription: 'Description',
  twitterImage: 'https://tribuzen.app/og/activite.jpg',
})
```

> `twitterCard: 'summary_large_image'` génère une carte avec grande image. `'summary'` = petite icône. Vérifier avec l'outil Twitter Card Validator ou cards.dev.

### 2.4 titleTemplate global

Objectif : chaque page affiche `"Titre de la page — TribuZen"` sans répéter le suffixe partout.

**Via `app.vue` (recommandé si tu veux une fonction) :**

```vue
<!-- app/app.vue ou app.vue -->
<script setup lang="ts">
useHead({
  titleTemplate: (titleChunk) => {
    // Si la page définit un titre, on l'inclut ; sinon, titre racine propre
    return titleChunk ? `${titleChunk} — TribuZen` : 'TribuZen'
  },
})
</script>
```

**Via `nuxt.config.ts` (string avec `%s`, pas de fonction) :**

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      titleTemplate: '%s — TribuZen',  // %s = titre défini par la page
    },
  },
})
```

> Les deux méthodes sont valides. `app.vue` + fonction permet de gérer le cas où `titleChunk` est vide (évite `" — TribuZen"` sans titre). La méthode `nuxt.config` est plus simple mais produit un titre bancal sur les pages sans `useHead({ title })`.

### 2.5 Données structurées JSON-LD

Les données structurées (schema.org) permettent à Google d'afficher des **rich snippets** : étoiles, dates d'événement, fil d'Ariane… Elles s'injectent via `useHead` dans un `<script type="application/ld+json">` :

```vue
<script setup lang="ts">
// pages/evenements/[slug].vue
const { data: evt } = await useFetch(`/api/evenements/${route.params.slug}`)

useHead({
  script: [
    {
      type: 'application/ld+json',
      // innerHTML : Nuxt injecte la string sans l'encoder (contrairement à textContent)
      innerHTML: () => JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: evt.value?.titre,
        startDate: evt.value?.dateDebut,
        endDate: evt.value?.dateFin,
        location: {
          '@type': 'Place',
          name: evt.value?.lieu,
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
```

Tester avec l'outil de test des résultats enrichis de Google (search.google.com/test/rich-results).

### 2.6 Sitemap et robots

**`@nuxtjs/sitemap`** génère `/sitemap.xml` automatiquement depuis les routes Nuxt :

```bash
pnpm add @nuxtjs/sitemap
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/sitemap'],
  site: {
    url: 'https://tribuzen.app',  // obligatoire pour les URLs absolues du sitemap
  },
})
// Résultat : https://tribuzen.app/sitemap.xml — à soumettre dans Google Search Console
```

**`robots.txt`** — fichier statique dans `public/` :

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://tribuzen.app/sitemap.xml
```

### 2.7 Canonical et hreflang

**Canonical** — déclare l'URL officielle d'une page (évite le contenu dupliqué) :

```ts
const config = useRuntimeConfig()
const route = useRoute()

useHead({
  link: [
    {
      rel: 'canonical',
      href: `${config.public.siteUrl}${route.path}`,
      // route.path = chemin sans query params — clé pour éviter la duplication
    },
  ],
})
```

**hreflang** — pour un site multilingue, indique aux moteurs quelle version afficher :

```ts
useHead({
  link: [
    { rel: 'alternate', hreflang: 'fr', href: 'https://tribuzen.app/fr/tribus/alpins' },
    { rel: 'alternate', hreflang: 'en', href: 'https://tribuzen.app/en/tribus/alpins' },
    { rel: 'alternate', hreflang: 'x-default', href: 'https://tribuzen.app/tribus/alpins' },
  ],
})
```

> `hreflang` est surtout pertinent si TribuZen ajoute `@nuxtjs/i18n` — le module le gère automatiquement dans ce cas.

### 2.8 Pourquoi le SSR est indispensable au SEO

**Ce que voit le crawler Google avec une SPA Vue 3 (sans SSR) :**

```html
<!DOCTYPE html>
<html>
  <head>
    <title></title>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
```

**Ce que voit le crawler Google avec Nuxt en mode SSR :**

```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <title>Alpinistes Lyonnais — TribuZen</title>
    <meta name="description" content="Tribu dédiée à l'escalade et randonnée..." />
    <meta property="og:image" content="https://tribuzen.app/og/alpins.jpg" />
    <link rel="canonical" href="https://tribuzen.app/tribus/alpins" />
    <script type="application/ld+json">{"@context":"https://schema.org",...}</script>
  </head>
  <body>
    <main>
      <h1>Alpinistes Lyonnais</h1>
      <p>Tribu dédiée à l'escalade...</p>
    </main>
  </body>
</html>
```

**Le SSR garantit :** titre et meta dans la réponse HTTP → crawlés sans JS → indexés → classés.

`useHead` et `useSeoMeta` appelés dans `<script setup>` d'une page Nuxt SSR sont exécutés **côté serveur** : les balises sont dans le HTML initial, pas injectées après coup par JS.

**Optimisation perf :** pour les meta statiques (indépendantes des données), les restreindre au rendu serveur :

```ts
// Meta qui ne dépendent pas de données réactives → server only
if (import.meta.server) {
  useSeoMeta({
    robots: 'index, follow',
    ogType: 'website',
  })
}
```

### 2.9 Performance et Core Web Vitals pour le SEO

Google intègre les **Core Web Vitals** dans son algorithme de classement depuis 2021 :

| Métrique | Ce qu'elle mesure | Seuil "bon" | Levier Nuxt |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | Chargement perçu | < 2.5 s | `<NuxtImg>` avec `preload`, SSR |
| **INP** (Interaction to Next Paint) | Réactivité clics | < 200 ms | Code splitting, lazy loading |
| **CLS** (Cumulative Layout Shift) | Stabilité visuelle | < 0.1 | Dimensions images explicites, font `display: swap` |

Nuxt améliore nativement le LCP via le SSR (HTML rendu avant JS). `<NuxtImg>` (module `@nuxt/image`) optimise automatiquement les images (WebP, lazy, dimensions déclarées).

### 2.10 HTML sémantique, SEO et accessibilité — le lien

> Sylvain, ta préparation RGAA et le SEO se renforcent mutuellement.

Google lit le HTML comme un lecteur d'écran : structure, hiérarchie, sens.

| Pratique HTML | Effet SEO | Effet accessibilité (RGAA/WCAG) |
|---|---|---|
| `<h1>` unique par page | Signal principal du sujet | Repère de navigation SR |
| Hiérarchie `h1 > h2 > h3` cohérente | Structuration du contenu | Navigation rapide SR |
| `alt` descriptif sur images | Google Images, contexte | WCAG 1.1.1 — non-text content |
| `<nav>`, `<main>`, `<article>` | Zones de contenu identifiées | Landmarks ARIA natifs |
| Textes de liens descriptifs | Ancre de lien = signal | WCAG 2.4.4 — link purpose |

**Règle :** si ton HTML est accessible (RGAA), il est bien structuré pour Google. Les deux audits partagent les mêmes critères.

---

## 3. Worked examples

### Exemple 1 — Page activité TribuZen complète (`useSeoMeta` + JSON-LD)

```vue
<!-- pages/activites/[slug].vue -->
<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()

interface Activite {
  nom: string
  description: string
  imageUrl: string
  dateDebut: string
  dateFin: string
  lieu: string
  slug: string
}

const { data: activite } = await useFetch<Activite>(`/api/activites/${route.params.slug}`)

// 1. Meta SEO + Open Graph + Twitter — useSeoMeta recommandé
useSeoMeta({
  title: () => activite.value?.nom ?? 'Activité',
  description: () => activite.value?.description ?? '',
  ogTitle: () => activite.value?.nom ?? 'Activité TribuZen',
  ogDescription: () => activite.value?.description ?? '',
  ogImage: () => activite.value?.imageUrl ?? `${config.public.siteUrl}/og-default.jpg`,
  ogType: 'article',
  ogUrl: () => `${config.public.siteUrl}/activites/${activite.value?.slug}`,
  twitterCard: 'summary_large_image',
  twitterImage: () => activite.value?.imageUrl ?? `${config.public.siteUrl}/og-default.jpg`,
})

// 2. Canonical + JSON-LD — useHead car useSeoMeta ne couvre pas ces clés
useHead({
  link: [
    {
      rel: 'canonical',
      href: () => `${config.public.siteUrl}${route.path}`,
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: () => JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: activite.value?.nom,
        description: activite.value?.description,
        startDate: activite.value?.dateDebut,
        endDate: activite.value?.dateFin,
        location: {
          '@type': 'Place',
          name: activite.value?.lieu,
        },
        organizer: {
          '@type': 'Organization',
          name: 'TribuZen',
          url: 'https://tribuzen.app',
        },
        image: activite.value?.imageUrl,
      }),
    },
  ],
})
</script>

<template>
  <main v-if="activite">
    <!-- h1 = signal SEO principal ET repère de navigation lecteur d'écran (RGAA) -->
    <h1>{{ activite.nom }}</h1>
    <p>{{ activite.description }}</p>
    <!-- Dimensions explicites : évite le CLS (Cumulative Layout Shift) -->
    <img
      :src="activite.imageUrl"
      :alt="`Photo de l'activité ${activite.nom}`"
      width="1200"
      height="630"
    />
  </main>
  <p v-else>Activité introuvable.</p>
</template>
```

### Exemple 2 — titleTemplate global dans `app.vue`

```vue
<!-- app.vue -->
<script setup lang="ts">
// titleTemplate s'applique à toutes les pages de l'app
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} — TribuZen` : 'TribuZen'
  },
  htmlAttrs: { lang: 'fr' },
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

```vue
<!-- pages/index.vue -->
<script setup lang="ts">
// Seul le titre de la page — le template ajoute " — TribuZen" automatiquement
useSeoMeta({ title: 'Accueil' })
// Résultat dans le navigateur : <title>Accueil — TribuZen</title>
</script>
```

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Meta définies côté client seulement = invisibles au crawler

```vue
<script setup lang="ts">
// ❌ onMounted s'exécute côté client APRÈS le rendu initial
// Le crawler reçoit le HTML sans ces balises
onMounted(() => {
  document.title = 'Ma page'
})

// ✅ useHead/useSeoMeta dans <script setup> = exécuté côté serveur en Nuxt SSR
useSeoMeta({ title: 'Ma page', description: '...' })
</script>
```

### PIÈGE #2 — Oublier le canonical sur les pages avec query params

Une page accessible via `/tribus/alpins` ET `/tribus/alpins?ref=newsletter` est vue comme **deux pages distinctes** par Google → pénalité de contenu dupliqué.

```ts
// ✅ route.path ne contient pas les query params
useHead({
  link: [{ rel: 'canonical', href: `${config.public.siteUrl}${route.path}` }],
})
```

### PIÈGE #3 — `og:image` sans URL absolue

```ts
// ❌ URL relative — les crawlers des réseaux sociaux ne peuvent pas résoudre
useSeoMeta({ ogImage: '/og/tribu-alpins.jpg' })

// ✅ URL absolue obligatoire pour og:image
useSeoMeta({ ogImage: `${config.public.siteUrl}/og/tribu-alpins.jpg` })
```

### PIÈGE #4 — `titleTemplate` en string dans nuxt.config ne gère pas le cas vide

```ts
// nuxt.config.ts
// app: { head: { titleTemplate: '%s — TribuZen' } }
// Si une page n'appelle pas useSeoMeta({ title: ... })
// → le titre devient " — TribuZen" (tiret seul sans titre)

// ✅ Préférer la fonction dans app.vue :
// titleTemplate: (chunk) => chunk ? `${chunk} — TribuZen` : 'TribuZen'
```

### PIÈGE #5 — JSON-LD avec `textContent` au lieu de `innerHTML`

```ts
useHead({
  script: [{
    type: 'application/ld+json',
    // ❌ textContent — Nuxt encode < > & → JSON invalide dans le HTML
    // textContent: JSON.stringify(data),

    // ✅ innerHTML — injecté tel quel, sans encodage HTML
    innerHTML: JSON.stringify(data),
  }],
})
```

---

## 5. Ancrage TribuZen

Dans TribuZen, le SEO s'applique aux pages de contenu public :

**`pages/tribus/[slug].vue`** — meta par tribu : nom, description, photo de couverture en OG, JSON-LD `Organization` ou `Group`. C'est la page la plus partagée sur les réseaux.

**`pages/activites/[slug].vue`** — meta par activité : JSON-LD `Event` avec dates et lieu. Les rich snippets Google Events augmentent la visibilité dans les résultats.

**`pages/evenements/[slug].vue`** — idem, priorité sur le JSON-LD `Event` + BreadcrumbList.

**`app.vue`** — `titleTemplate` global `(chunk) => chunk ? chunk + ' — TribuZen' : 'TribuZen'` + `htmlAttrs: { lang: 'fr' }`.

**Parallèle Eudonet :** le front-office Eudonet avait les mêmes besoins — pages de contenu référencées (fiches membres, événements), OG pour le partage interne, canonical pour éviter la duplication des URLs de filtres. La stack change, l'approche SEO est identique.

```
tribuzen/
  app/
    app.vue                       ← titleTemplate global
    pages/
      tribus/
        [slug].vue                ← useSeoMeta + JSON-LD Organization
      activites/
        [slug].vue                ← useSeoMeta + JSON-LD Event (Exemple 1)
      evenements/
        [slug].vue                ← useSeoMeta + JSON-LD Event + BreadcrumbList
  public/
    robots.txt
  nuxt.config.ts                  ← @nuxtjs/sitemap + runtimeConfig.public.siteUrl
```

---

## 6. Points clés

1. `useSeoMeta` est recommandé pour les balises SEO/OG/Twitter — autocomplétion TypeScript, syntaxe directe.
2. `useHead` complète `useSeoMeta` pour canonical, JSON-LD et toute balise non couverte.
3. Les meta dynamiques utilisent des getters `() => value` pour rester réactives après `useFetch`.
4. Le `titleTemplate` global se définit dans `app.vue` avec une fonction (gère le cas vide) ou dans `nuxt.config` avec `'%s — Site'`.
5. JSON-LD s'injecte via `useHead({ script: [{ type: 'application/ld+json', innerHTML: ... }] })` — `innerHTML`, pas `textContent`.
6. `canonical` est obligatoire sur toutes les pages pour éviter le contenu dupliqué (URLs avec query params).
7. `og:image` doit être une URL absolue — une URL relative n'est pas résolue par les crawlers sociaux.
8. Le SSR Nuxt est indispensable au SEO — `useHead` en SSR injecte les balises dans le HTML initial, visible au crawler sans JS.
9. HTML sémantique (`h1`, `alt`, landmarks) = bonne pratique SEO ET RGAA simultanément.

---

## 7. Seeds Anki

```
Quelle est la différence principale entre useHead et useSeoMeta en Nuxt ?|useHead est l'API générique pour tout le <head> (meta, link, script, style…). useSeoMeta est un sucre syntaxique orienté SEO avec des clés directes (ogTitle, twitterCard…) et autocomplétion TypeScript. Pour le SEO, préférer useSeoMeta ; pour canonical et JSON-LD, utiliser useHead.
Pourquoi le SSR Nuxt est-il indispensable pour le SEO ?|Le crawler Google lit le HTML de la réponse HTTP sans exécuter le JavaScript. En SPA Vue pure, il voit un <div id="app"></div> vide. En Nuxt SSR, useHead est exécuté côté serveur : title, meta et contenu sont dans le HTML initial, indexables immédiatement.
Comment définir des meta dynamiques réactives avec useSeoMeta ?|Passer des getters : useSeoMeta({ title: () => data.value?.nom ?? 'Défaut' }). Nuxt réévalue le getter quand la ref change. Sans getter, la valeur est évaluée une seule fois au rendu.
Comment configurer un titleTemplate global dans Nuxt ?|Dans app.vue : useHead({ titleTemplate: (chunk) => chunk ? chunk + ' — Site' : 'Site' }). Ou dans nuxt.config : app.head.titleTemplate: '%s — Site'. La fonction (app.vue) gère le cas où aucun titre n'est défini par la page.
Comment injecter du JSON-LD dans le <head> avec Nuxt ?|Via useHead({ script: [{ type: 'application/ld+json', innerHTML: JSON.stringify({...schema...}) }] }). Utiliser innerHTML (pas textContent) pour éviter l'encodage HTML des caractères spéciaux.
Pourquoi og:image doit-il être une URL absolue ?|Les crawlers des réseaux sociaux (Facebook, LinkedIn, Slack…) font une requête HTTP directe depuis leurs serveurs. Ils ne peuvent pas résoudre une URL relative (/og/image.jpg) sans connaître l'origine. L'URL doit être complète : https://tribuzen.app/og/image.jpg.
Que se passe-t-il si on oublie le canonical sur une page avec query params ?|Google considère /tribus/alpins et /tribus/alpins?ref=newsletter comme deux pages distinctes avec le même contenu → pénalité de contenu dupliqué, dilution du PageRank. Le canonical pointe toujours vers route.path (sans query params).
Comment HTML sémantique, SEO et accessibilité se recoupent-ils ?|Google lit le HTML comme un lecteur d'écran : h1 unique = signal principal du sujet, hiérarchie h2/h3 = structure, alt descriptif = Google Images + WCAG 1.1.1, landmarks (nav, main, article) = zones identifiées pour crawleurs ET SR. Un HTML accessible (RGAA) est bien structuré pour le SEO.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-29-nuxt-seo-et-meta/README.md`. Ajouter SEO complet (useSeoMeta, JSON-LD, canonical, titleTemplate) à une page Nuxt TribuZen — corrigé commenté intégral + variante J+30.

---

*Précédent : [28 — Nuxt server routes](28-nuxt-server-routes.md)*
