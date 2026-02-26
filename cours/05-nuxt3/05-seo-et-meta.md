# 05 — SEO et meta

## `useHead` — meta par page

```vue
<script setup lang="ts">
useHead({
  title: "Mon Site - Accueil",
  meta: [
    { name: "description", content: "Description de la page pour Google" },
    { property: "og:title", content: "Mon Site" },
    { property: "og:description", content: "Description OpenGraph" },
    { property: "og:image", content: "/og-image.jpg" },
  ],
  link: [{ rel: "canonical", href: "https://monsite.com/" }],
});
</script>
```

## `useSeoMeta` — raccourci type-safe

```vue
<script setup lang="ts">
useSeoMeta({
  title: "Mon Produit",
  description: "Le meilleur produit du marche",
  ogTitle: "Mon Produit",
  ogDescription: "Le meilleur produit du marche",
  ogImage: "/images/product.jpg",
  twitterCard: "summary_large_image",
});
</script>
```

## Title template

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      titleTemplate: "%s | Mon Site",
    },
  },
});
```

```vue
<!-- pages/about.vue -->
<script setup lang="ts">
useHead({ title: "A propos" });
// → "A propos | Mon Site"
</script>
```

## Meta dynamiques

```vue
<script setup lang="ts">
const { data: product } = await useFetch(`/api/products/${route.params.id}`);

useHead({
  title: computed(() => product.value?.name ?? "Chargement..."),
  meta: [
    {
      name: "description",
      content: computed(() => product.value?.description ?? ""),
    },
  ],
});
</script>
```

## Sitemap

```bash
pnpm add @nuxtjs/sitemap
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@nuxtjs/sitemap"],
  site: {
    url: "https://monsite.com",
  },
});
```

## SSG (Static Site Generation)

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: true,
  nitro: {
    prerender: {
      routes: ["/"],
      crawlLinks: true, // Decouvre et pre-rend toutes les pages
    },
  },
});
```

```bash
pnpm generate # Genere le site statique dans .output/public/
```

## Exercice

→ `exercices/14-nuxt-blog/ENONCE.md`

## Suite

→ `cours/06-storybook/01-setup.md`
