# Exercice 20 — Patterns Nuxt (simulés)

**Module** : 05-Nuxt · **Difficulté** : ⭐⭐⭐⭐
**Cours** : `cours/05-nuxt/01` à `05`

## Objectif

Comprendre les patterns Nuxt 3 (file-based routing, composables auto-importés, data fetching) en les simulant dans un environnement Vite standard.

> **Note** : Pas de vrai projet Nuxt — on simule les concepts pour rester lançable dans App.vue.

## Consignes

### Partie 1 — File-based routing simulé

1. Simuler une structure de routing basée sur les fichiers :
   - `routes` array généré à partir d'un objet « file tree »
   - Navigation entre « pages » via `component :is`
   - Layout système (default layout + custom layout)

### Partie 2 — Composables auto-import simulé

2. Simuler les composables Nuxt :
   - `useFetch<T>(url)` : retourne `{ data, pending, error, refresh }`
   - `useAsyncData<T>(key, handler)` : cache + déduplication
   - `useHead(meta)` : met à jour `document.title` (simplifié)

### Partie 3 — Blog SSR-ready

3. Mini-blog avec les patterns Nuxt :
   - Page index : liste des articles (via `useFetch` simulé)
   - Page article : détail par slug
   - `useHead` pour le titre dynamique
   - Composant `NuxtLink` simulé (simple bouton navigation)

## Contraintes TypeScript

- Tous les composables génériques typés
- `interface Article { slug: string; title: string; content: string; date: string; author: string }`

## Fichiers

→ `src/exercises/ex20/NuxtPatterns.vue`
→ `src/exercises/ex20/composables/useFetch.ts`
→ `src/exercises/ex20/composables/useAsyncData.ts`
→ `src/exercises/ex20/composables/useHead.ts`
→ `src/exercises/ex20/pages/BlogIndex.vue`
→ `src/exercises/ex20/pages/BlogArticle.vue`
→ `src/exercises/ex20/types.ts`
