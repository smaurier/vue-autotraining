# 05 — SEO et meta (être trouvé sur Google)

---

> **🔄 Rappel du cours précédent**
> Avant de continuer, vérifie que tu peux répondre à ces questions :
> 1. Où place-t-on les server routes dans un projet Nuxt 3 ?
> 2. Quelle fonction utilise-t-on pour définir un handler d'API serveur ?
> 
> <details>
> <summary>Vérifier mes réponses</summary>
>
> 1. Dans le dossier `server/api/` (ex: `server/api/users.ts` crée `/api/users`)
> 2. `defineEventHandler((event) => { ... })` qui reçoit l'événement HTTP
> </details>

---

## C'est quoi le SEO ?

**SEO** = **S**earch **E**ngine **O**ptimization (Optimisation pour les Moteurs de Recherche).

En termes simples : **c'est l'art de rendre votre site trouvable sur Google** (et Bing, Yahoo, etc.).

Quand quelqu'un tape "recettes de crêpes" sur Google, comment Google décide-t-il quels sites montrer en premier ? Il lit des **informations cachées** dans chaque page web. Si ces informations sont bien remplies, votre site a plus de chances d'apparaître.

---

## C'est quoi les "meta tags" ?

### L'analogie de la quatrième de couverture d'un livre 📖

Quand vous êtes en librairie, comment choisissez-vous un livre ?

1. **Le titre** sur la couverture → vous savez de quoi ça parle
2. **Le résumé** au dos (4ème de couverture) → une courte description du contenu
3. **L'image** de couverture → attire l'œil

Les **meta tags**, c'est exactement ça, mais pour une page web :

```
┌──────────────────────────────────────────┐
│  Google affiche :                        │
│                                          │
│  Mon Site - Recettes de crêpes  ← titre  │
│  monsite.com/recettes/crepes             │
│  Découvrez la meilleure recette de       │
│  crêpes bretonnes, facile et rapide...   │
│                         ↑ description    │
└──────────────────────────────────────────┘
```

Le **titre** et la **description** que Google affiche viennent des **meta tags** de votre page. Si vous ne les mettez pas, Google essaiera de deviner tout seul... et le résultat sera souvent décevant.

> **Important** : les meta tags sont **invisibles** pour le visiteur de votre page. Elles sont cachées dans le code HTML, mais Google et les réseaux sociaux les lisent.

---

## `useHead` — définir les meta pour chaque page

`useHead` est une fonction fournie par Nuxt qui permet de **remplir les informations** de votre page (titre, description, etc.).

```vue
<script setup lang="ts">
// useHead = "utilise le <head>" (la partie invisible du HTML)
// C'est comme remplir la fiche d'identité de votre page
useHead({
  // Le titre de la page (affiché dans l'onglet du navigateur ET sur Google)
  title: 'Mon Site - Accueil',

  // "meta" = les balises méta (les infos cachées)
  meta: [
    // description = le résumé qui apparaît sur Google sous le titre
    {
      name: 'description',                              // Le type de méta
      content: 'Bienvenue sur mon site de recettes',     // Le contenu
    },

    // og:title = le titre quand on partage le lien sur Facebook/LinkedIn
    // (on explique "og" plus bas, pas de panique !)
    { property: 'og:title', content: 'Mon Site' },

    // og:description = la description sur les réseaux sociaux
    { property: 'og:description', content: 'Les meilleures recettes' },

    // og:image = l'image de prévisualisation sur les réseaux sociaux
    { property: 'og:image', content: '/og-image.jpg' },
  ],

  // "link" = liens vers d'autres ressources
  link: [
    // "canonical" dit à Google : "voici l'URL officielle de cette page"
    // (utile si la même page est accessible via plusieurs URLs)
    { rel: 'canonical', href: 'https://monsite.com/' },
  ],
})
</script>
```

### Ce que ça produit dans le HTML (invisible pour le visiteur) :

```html
<head>
  <title>Mon Site - Accueil</title>
  <meta name="description" content="Bienvenue sur mon site de recettes">
  <meta property="og:title" content="Mon Site">
  <meta property="og:description" content="Les meilleures recettes">
  <meta property="og:image" content="/og-image.jpg">
  <link rel="canonical" href="https://monsite.com/">
</head>
```

---

## `useSeoMeta` — la version simplifiée (recommandée !)

`useHead` fonctionne, mais la syntaxe est un peu lourde avec tous ces objets `{ name: ..., content: ... }`. Nuxt propose **`useSeoMeta`**, une version plus lisible et avec de l'**autocomplétion TypeScript** (votre éditeur vous suggère les options) :

```vue
<script setup lang="ts">
// useSeoMeta = version simplifiée de useHead pour le SEO
// Chaque propriété a un nom clair et direct
useSeoMeta({
  // === Pour Google ===
  title: 'Recettes de crêpes',                          // Titre de la page
  description: 'La meilleure recette de crêpes bretonnes, '
             + 'facile et rapide à préparer',            // Description pour Google

  // === Pour les réseaux sociaux (Open Graph) ===
  ogTitle: 'Recettes de crêpes',                         // Titre sur Facebook/LinkedIn
  ogDescription: 'La meilleure recette de crêpes',       // Description sur les réseaux
  ogImage: '/images/crepes.jpg',                          // Image de prévisualisation

  // === Spécifique à Twitter/X ===
  twitterCard: 'summary_large_image',                     // Format de la carte Twitter
  // "summary_large_image" = une grande image de prévisualisation
})
</script>
```

> **Conseil** : préférez `useSeoMeta` à `useHead` pour le SEO. C'est plus lisible et TypeScript vous aide à ne rien oublier.

---

## C'est quoi "Open Graph" ? (les previews sur les réseaux sociaux)

Quand vous partagez un lien sur **Facebook**, **LinkedIn**, **Discord** ou **WhatsApp**, vous voyez une jolie carte avec un titre, une description et une image :

```
┌──────────────────────────────────────┐
│  ┌──────────────────────────────┐    │
│  │                              │    │
│  │    🖼️ Image de preview       │    │
│  │                              │    │
│  └──────────────────────────────┘    │
│  Mon Site - Recettes                 │  ← og:title
│  Les meilleures recettes de crêpes   │  ← og:description
│  monsite.com                         │
└──────────────────────────────────────┘
```

Cette carte est générée grâce aux balises **Open Graph** (`og:title`, `og:description`, `og:image`). Sans elles, le lien partagé sera triste et sans image — personne n'aura envie de cliquer.

Les propriétés **Open Graph** les plus importantes :

| Propriété          | Rôle                                    | Exemple                      |
|-------------------|-----------------------------------------|------------------------------|
| `og:title`        | Titre affiché dans la carte             | "Recettes de crêpes"        |
| `og:description`  | Description courte                      | "Facile et rapide"           |
| `og:image`        | URL de l'image de prévisualisation      | "/images/crepes.jpg"         |
| `og:url`          | L'URL canonique de la page              | "https://monsite.com/"       |
| `og:type`         | Le type de contenu                      | "website" ou "article"       |

---

## Title template (ajouter le nom du site automatiquement)

Sur la plupart des sites, les titres suivent un format comme : **"Nom de la page | Mon Site"**. Plutôt que de répéter " | Mon Site" dans chaque page, on le configure une seule fois :

```ts
// nuxt.config.ts — la configuration globale du projet
export default defineNuxtConfig({
  app: {
    head: {
      // %s sera remplacé par le titre de chaque page
      // C'est comme un "trou à remplir"
      titleTemplate: '%s | Mon Site',
    },
  },
})
```

```vue
<!-- pages/about.vue -->
<script setup lang="ts">
// On ne met QUE le titre de la page, sans le nom du site
useHead({ title: 'À propos' })

// Résultat dans l'onglet du navigateur : "À propos | Mon Site"
// Le %s a été remplacé par "À propos" automatiquement !
</script>

<template>
  <div>
    <h1>À propos de nous</h1>
  </div>
</template>
```

---

## Meta dynamiques (qui changent selon les données)

Souvent, le titre et la description dépendent des **données de la page**. Par exemple, sur une page produit, on veut afficher le nom du produit dans le titre.

```vue
<script setup lang="ts">
// On récupère l'ID du produit depuis l'URL
const route = useRoute()

// On charge les données du produit depuis notre API
// (useFetch fait une requête GET automatiquement)
const { data: product } = await useFetch(`/api/products/${route.params.id}`)

// Les meta sont "computed" (calculées) = elles se mettent à jour
// automatiquement quand les données changent
useHead({
  // computed() crée une valeur "réactive" qui se recalcule
  // quand product.value change
  title: computed(() => product.value?.name ?? 'Chargement...'),
  //                                   ↑↑
  //                     "?." = optional chaining
  //                     Si product.value est null, ça ne plante pas
  //                     "??" = nullish coalescing
  //                     Si la valeur à gauche est null/undefined,
  //                     on utilise celle de droite ("Chargement...")

  meta: [
    {
      name: 'description',
      content: computed(() => product.value?.description ?? ''),
    },
  ],
})
</script>

<template>
  <div v-if="product">
    <h1>{{ product.name }}</h1>
    <p>{{ product.description }}</p>
  </div>
  <div v-else>
    <p>Chargement du produit...</p>
  </div>
</template>
```

> **`?.`** et **`??`** sont des opérateurs JavaScript modernes :
> - `product.value?.name` → "si product.value existe, donne-moi .name, sinon donne undefined"
> - `undefined ?? 'Chargement...'` → "si c'est undefined, utilise 'Chargement...' à la place"

---

## Sitemap (le plan du site pour Google)

Un **sitemap**, c'est un fichier XML qui **liste toutes les pages de votre site**. C'est comme donner un **plan du bâtiment** à un visiteur pour qu'il trouve toutes les salles. Google utilise ce fichier pour découvrir et indexer toutes vos pages.

```bash
# Installation du module sitemap
pnpm add @nuxtjs/sitemap
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  // On ajoute le module à la liste des modules Nuxt
  modules: ['@nuxtjs/sitemap'],

  // On indique l'URL de notre site (obligatoire pour le sitemap)
  site: {
    url: 'https://monsite.com',
  },
})
// → Le sitemap sera accessible sur https://monsite.com/sitemap.xml
// → Google le lira pour trouver toutes vos pages
```

---

## SSG — Static Site Generation (générer un site statique)

Par défaut, Nuxt génère les pages **à chaque visite** (le serveur travaille à chaque requête). Avec le **SSG**, on peut **pré-générer toutes les pages** une seule fois sous forme de fichiers HTML.

C'est comme la différence entre :
- **Un restaurant** (SSR) : le plat est cuisiné à chaque commande
- **Un traiteur** (SSG) : tous les plats sont préparés à l'avance, il suffit de les servir

Avantage du SSG : **ultra rapide** (pas besoin de serveur), parfait pour les blogs et sites vitrines.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: true,    // Active le rendu côté serveur
  nitro: {
    prerender: {
      routes: ['/'],          // Pré-rend au minimum la page d'accueil
      crawlLinks: true,       // Découvre et pré-rend automatiquement
                               // toutes les pages liées
    },
  },
})
```

```bash
# Cette commande génère tout le site en fichiers HTML statiques
# Le résultat se trouve dans le dossier .output/public/
pnpm generate
```

---

## Résumé : checklist SEO pour chaque page

```
✅ Titre unique et descriptif (50-60 caractères)
✅ Meta description engageante (150-160 caractères)
✅ Open Graph : og:title, og:description, og:image
✅ Twitter Card configurée
✅ URL canonique définie
✅ Sitemap généré automatiquement
✅ Contenu accessible en SSR ou SSG (pas uniquement en JavaScript côté client)
```

---

## 🎯 Pratique

### Exercice SEO.1 — Meta basique

Configure les meta d'une page produit :

```vue
<!-- pages/products/[id].vue -->
<script setup lang="ts">
const route = useRoute()
const { data: product } = await useFetch(`/api/products/${route.params.id}`)

// Configure le titre et la description dynamiquement
// ???
</script>
```

<details>
<summary>Solution</summary>

```vue
<script setup lang="ts">
const route = useRoute()
const { data: product } = await useFetch(`/api/products/${route.params.id}`)

useHead({
  title: () => product.value?.name || 'Produit',
  meta: [
    { name: 'description', content: () => product.value?.description || '' }
  ]
})
</script>
```
</details>

---

### Exercice SEO.2 — Open Graph

Ajoute les balises Open Graph pour le partage social :

```ts
// Configure og:title, og:description et og:image
useSeoMeta({
  // ???
})
```

<details>
<summary>Solution</summary>

```ts
useSeoMeta({
  title: product.value?.name,
  ogTitle: product.value?.name,
  description: product.value?.description,
  ogDescription: product.value?.description,
  ogImage: product.value?.image,
  twitterCard: 'summary_large_image'
})
```
</details>

---

### Exercice SEO.3 — URL canonique

Définis l'URL canonique d'une page :

```vue
<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()

// Définis l'URL canonique
// ???
</script>
```

<details>
<summary>Solution</summary>

```vue
<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()

useHead({
  link: [
    {
      rel: 'canonical',
      href: `${config.public.siteUrl}${route.path}`
    }
  ]
})
</script>
```
</details>

---

## Exercice

→ `exercices/14-nuxt-blog/ENONCE.md`

## Suite

→ `cours/06-storybook/01-setup.md`
