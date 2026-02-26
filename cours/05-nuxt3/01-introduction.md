# 01 — Nuxt 3 : Introduction

## Qu'est-ce que Nuxt 3 ?

Un **framework fullstack** base sur Vue 3 qui ajoute :

- Routing automatique (base sur les fichiers)
- SSR / SSG / ISR out of the box
- Auto-imports (pas besoin d'importer ref, computed, etc.)
- Server routes (API backend dans le meme projet)
- SEO et meta tags integres

## Installation

```bash
npx nuxi@latest init mon-projet-nuxt
cd mon-projet-nuxt
pnpm install
pnpm dev
```

## Structure d'un projet Nuxt 3

```
app.vue              ← composant racine
nuxt.config.ts       ← configuration
pages/               ← routing automatique
  index.vue          → /
  about.vue          → /about
  users/
    [id].vue         → /users/:id
    index.vue        → /users
layouts/             ← layouts reutilisables
  default.vue
components/          ← auto-importes
  AppHeader.vue
composables/         ← auto-importes
  useAuth.ts
server/              ← API server-side
  api/
    users.get.ts     → GET /api/users
    users.post.ts    → POST /api/users
middleware/           ← route middleware
  auth.ts
plugins/             ← plugins Vue
public/              ← fichiers statiques
```

## Differences cle avec Vue 3 "vanilla"

| Vue 3 SPA            | Nuxt 3                       |
| -------------------- | ---------------------------- |
| Routing manuel       | Routing automatique (pages/) |
| Imports explicites   | Auto-imports                 |
| CSR uniquement       | SSR/SSG/CSR au choix         |
| Pas de backend       | Server routes integrees      |
| Config Vite manuelle | Abstrait par Nuxt            |

## `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  devtools: { enabled: true },

  typescript: {
    strict: true,
  },

  modules: ["@pinia/nuxt", "@nuxtjs/tailwindcss"],

  runtimeConfig: {
    // Cote serveur uniquement
    apiSecret: process.env.API_SECRET,
    // Expose au client
    public: {
      apiBase: process.env.API_BASE || "/api",
    },
  },
});
```

## Quand choisir Nuxt vs Vue SPA ?

| Critere                 | Vue SPA (Vite)           | Nuxt 3                          |
| ----------------------- | ------------------------ | ------------------------------- |
| SEO nécessaire          | ❌ Difficile             | ✅ SSR/SSG natif                |
| Temps de setup          | 5 min                    | 5 min (même chose)              |
| Backend dans le projet  | ❌ Séparé                | ✅ Server routes intégrées      |
| Complexité              | Simple                   | Plus de conventions à connaître |
| Dashboard / back-office | ✅ Idéal                 | Overkill                        |
| Site public / blog      | ❌ Pas de SSR            | ✅ Idéal                        |
| E-commerce              | Possible avec SSR manuel | ✅ Natif                        |

**En ESN** : la majorité des missions sont des dashboards → Vue SPA suffit. Nuxt est demandé pour les projets SEO-critical ou fullstack.

## Modes de rendu

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  // SSR (défaut) — rendu serveur à chaque requête
  ssr: true,

  // SPA — rendu client uniquement
  // ssr: false,

  // SSG — pré-rendu au build (pnpm generate)
  // nitro: { prerender: { crawlLinks: true } },

  // Hybrid — certaines routes SSR, d'autres SSG
  routeRules: {
    "/": { prerender: true }, // SSG
    "/dashboard/**": { ssr: false }, // SPA
    "/blog/**": { isr: 3600 }, // ISR (revalidation 1h)
  },
});
```

## Suite

→ `cours/05-nuxt3/02-pages-et-layouts.md`
