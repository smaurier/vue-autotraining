---
layout: home

hero:
  name: "Vue 3 Course"
  text: "Vue 3.5 · Nuxt 4 · Pinia · Composition API"
  tagline: Maîtrisez l'écosystème Vue moderne — de débutant à staffable en ESN
  actions:
    - theme: brand
      text: Commencer le cours
      link: /cours/01-debutant/01-environnement-et-premier-composant
    - theme: alt
      text: Parcours recommandé
      link: /cours/parcours
    - theme: alt
      text: Exercices pratiques
      link: /exercices/README

features:
  - icon: 🟩
    title: Vue 3.5 + Composition API
    details: Réactivité fine, composables, Provide/Inject, Teleport et tous les patterns modernes Vue 3.
  - icon: 🍍
    title: Pinia — State Management
    details: Gestion d'état typée, devtools, persistance et architecture store modulaire.
  - icon: 🚀
    title: Nuxt 4 & SSR
    details: App universelle avec pages, layouts, data fetching, server routes, SEO et déploiement.
  - icon: 🧪
    title: Tests complets
    details: Vitest, Vue Test Utils, Testing Library, Playwright E2E et MSW pour le mocking API.
  - icon: ♿
    title: Accessibilité & i18n
    details: WCAG, ARIA, vue-i18n et stratégies de localisation prêtes pour la production.
  - icon: 🔐
    title: Auth & Patterns ESN
    details: JWT, RBAC, Storybook, CI/CD, TanStack Query et recettes applicables en mission.
---

## Structure du cours

| Phase | Module | Thèmes |
|-------|--------|--------|
| 1️⃣ | [Débutant](/cours/01-debutant/01-environnement-et-premier-composant) | Composants, réactivité, directives, props, lifecycle |
| 2️⃣ | [Intermédiaire](/cours/02-intermediaire/01-composition-api-avancee) | Composition API, composables, async, slots, animations |
| 3️⃣ | [Avancé](/cours/03-avance/01-vue-router) | Vue Router, Pinia, Tests unitaires, E2E Playwright |
| 4️⃣ | [Expert](/cours/04-expert/01-performance) | Performance, SSR, architecture, patterns entreprise |
| 🚀 | [Nuxt 4](/cours/05-nuxt3/01-introduction) | Pages, layouts, data fetching, server routes, SEO |
| 📖 | [Storybook](/cours/06-storybook/01-setup) | Stories, design system, documentation |
| ⚙️ | [CI/CD](/cours/07-cicd/01-pipeline-ci) | Pipeline, déploiement, monitoring |
| 🔗 | [API typées](/cours/08-api-typees/01-graphql-vue3) | GraphQL, tRPC |
| ♿ | [Accessibilité](/cours/09-accessibilite/01-fondamentaux-wcag) | WCAG, ARIA, audit |
| 🌍 | [i18n](/cours/10-i18n/01-vue-i18n) | vue-i18n, stratégies multi-langues |
| 🔐 | [Auth & Sécurité](/cours/11-auth-securite/01-authentification) | Authentification, RBAC, permissions |
| 📡 | [TanStack Query](/cours/12-vue-query/01-tanstack-query) | Data fetching avancé, cache, synchronisation |

## Démarrer en local

```bash
# dans 01-vue/
pnpm install
pnpm docs:dev    # → http://localhost:5171
```

> **Note :** `pnpm dev` lance l'application Vite/Vue de démonstration (port 5173).  
> `pnpm docs:dev` lance le site de cours VitePress (port 5171).
