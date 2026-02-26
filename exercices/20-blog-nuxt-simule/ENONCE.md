# Exercice 20b — Blog Nuxt simulé

**Module** : 05-Nuxt 3 · **Difficulté** : ⭐⭐⭐⭐
**Cours** : `cours/05-nuxt3/01` à `05`
**Renforce** : exercice 20 (nuxt-patterns) — angle projet complet

## Objectif

Construire un **blog complet** en simulant les patterns Nuxt 3 dans le projet Vue 3. Contrairement à l'ex20 qui isole les patterns individuels (`useFetch`, `useAsyncData`, `useHead`), ici on les **assemble dans un projet cohérent** avec SEO, layouts et navigation.

## Consignes

1. Page **liste d'articles** : affiche les articles avec pagination
2. Page **article** : affiche le contenu d'un article par son slug (route dynamique simulée)
3. Page **catégories** : filtre les articles par catégorie
4. Layout `default` avec header/nav/footer
5. Layout `article` avec sidebar « Articles récents »
6. Composable `useBlogFetch<T>` simulant `useFetch` avec loading/error
7. Composable `useSeo(title, description)` simulant `useHead` et `useSeoMeta`
8. Middleware `auth` simulé pour une page `/admin` (redirige si non connecté)
9. Données : au moins 10 articles avec titre, contenu, catégorie, date, auteur

## Contraintes TypeScript

- Interface `Article` complète (id, title, slug, content, category, date, author, tags)
- Tous les composables typés
- Zéro `any`

## Bonus

- Recherche plein texte dans les articles
- Mode sombre avec `provide/inject`
- Pagination avec composable dédié

## Fichiers

→ `src/exercises/ex20b/BlogApp.vue`
→ `src/exercises/ex20b/composables/useBlogFetch.ts`
→ `src/exercises/ex20b/composables/useSeo.ts`
→ `src/exercises/ex20b/layouts/DefaultLayout.vue`
→ `src/exercises/ex20b/layouts/ArticleLayout.vue`
→ `src/exercises/ex20b/pages/ArticleList.vue`
→ `src/exercises/ex20b/pages/ArticleDetail.vue`
→ `src/exercises/ex20b/types.ts`
