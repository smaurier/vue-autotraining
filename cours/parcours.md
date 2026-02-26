# Parcours Vue 3 — De zéro à senior ESN

> Format : théorie concise + exercice pratique à chaque étape.
> Stack : Vue 3 + TypeScript strict + Composition API.
> 51 cours · 34 exercices · Tous lançables dans `App.vue`.
> Les exercices de renforcement (suffixe b) revisitent un concept sous un angle différent.

---

## Module 00 — TypeScript pour Vue 3

1. `cours/00-typescript/01-types-de-base.md`
2. `cours/00-typescript/02-interfaces-et-types.md`
3. `cours/00-typescript/03-generics.md`
4. `cours/00-typescript/04-typer-vue3.md`

Exercice :

- `exercices/01-typescript-labo/` → ex01 — Types, generics, utility types, typage Vue 3

---

## Module 01 — Débutant

1. `cours/01-debutant/01-environnement-et-premier-composant.md`
2. `cours/01-debutant/02-template-et-directives.md`
3. `cours/01-debutant/03-reactivite.md`
4. `cours/01-debutant/04-evenements-et-v-model.md`
5. `cours/01-debutant/05-composants-props-emits.md`
6. `cours/01-debutant/06-lifecycle-hooks.md`
7. `cours/01-debutant/07-options-vs-composition-api.md`

Exercices :

- `exercices/02-compteur-reactif/` → ex02 — ref, computed, événements
- `exercices/03-liste-de-taches/` → ex03 — v-for, v-if, v-model, computed
- `exercices/04-formulaire-contact/` → ex04 — v-model, validation
- `exercices/05-catalogue-produits/` → ex05 — Props, emits, composants
- `exercices/06-chronometre/` → ex06 — Lifecycle hooks, watchers
- `exercices/07-options-vs-composition/` → ex07 — Comparer les deux API

---

## Module 02 — Intermédiaire

1. `cours/02-intermediaire/01-composition-api-avancee.md`
2. `cours/02-intermediaire/02-composables.md`
3. `cours/02-intermediaire/03-gestion-async.md`
4. `cours/02-intermediaire/04-formulaires-et-validation.md`
5. `cours/02-intermediaire/05-slots-avances.md`
6. `cours/02-intermediaire/06-transitions-et-animations.md`

Exercices :

- `exercices/08-theme-injection/` → ex08 — provide/inject, InjectionKey
- `exercices/09-dashboard-composables/` → ex09 — Composables réutilisables
- ⟳ `exercices/09-dashboard-filtres/` → ex09b — **Renforcement** : composables generiques (filter, sort, pagination)
- `exercices/10-crud-api/` → ex10 — Async, loading, error, CRUD
- `exercices/11-formulaire-multi-etapes/` → ex11 — Wizard avec validation
- `exercices/12-carte-profil-slots/` → ex12 — Slots nommés et scoped
- `exercices/13-tableau-generique/` → ex13 — Generics, composants réutilisables
- ⟳ `exercices/13-tableau-reutilisable/` → ex13b — **Renforcement** : DataTable avancé (slots, édition inline, composition)
- `exercices/14-galerie-animee/` → ex14 — Transition, TransitionGroup, hooks JS

---

## Module 03 — Avancé

1. `cours/03-avance/01-vue-router.md`
2. `cours/03-avance/02-pinia.md`
3. `cours/03-avance/03-tests-unitaires.md`
4. `cours/03-avance/04-tests-composants.md`
5. `cours/03-avance/05-tests-integration.md`
6. `cours/03-avance/06-tests-e2e-playwright.md`
7. `cours/03-avance/07-msw-et-mocking-api.md`

Exercices :

- `exercices/15-app-multi-pages/` → ex15 — Routage simulé, guards, navigation
- `exercices/16-store-pinia/` → ex16 — Pinia, inter-store, persistance
- `exercices/17-tests-complets/` → ex17 — Vitest, Vue Test Utils (tests via `pnpm test`)
- `exercices/28-e2e-playwright/` → ex28 — Tests E2E Playwright + API mocking (MSW / page.route)
- ⟳ `exercices/28b-msw-vitest/` → ex28b — **Renforcement** : MSW + Vitest (tests composables & composants, sans Playwright)

---

## Module 04 — Expert

1. `cours/04-expert/01-performance.md`
2. `cours/04-expert/02-ssr-et-hydration.md`
3. `cours/04-expert/03-architecture-front.md`
4. `cours/04-expert/04-patterns-entreprise.md`

Exercices :

- `exercices/18-performance-audit/` → ex18 — shallowRef, v-memo, virtual scroll
- `exercices/19-architecture-patterns/` → ex19 — Service layer, DI, event bus, factory

---

## Module 05 — Nuxt 3

1. `cours/05-nuxt3/01-introduction.md`
2. `cours/05-nuxt3/02-pages-et-layouts.md`
3. `cours/05-nuxt3/03-data-fetching.md`
4. `cours/05-nuxt3/04-server-routes.md`
5. `cours/05-nuxt3/05-seo-et-meta.md`

Exercices :

- `exercices/20-nuxt-patterns/` → ex20 — useFetch, useAsyncData, useHead (simulés)
- ⟳ `exercices/20-blog-nuxt-simule/` → ex20b — **Renforcement** : blog complet (layouts, SEO, middleware, navigation)

---

## Module 06 — Storybook & Design System

1. `cours/06-storybook/01-setup.md`
2. `cours/06-storybook/02-stories.md`
3. `cours/06-storybook/03-design-system.md`

Exercices :

- `exercices/21-ui-kit-storybook/` → ex21 — Composants UI réutilisables, showcase
- ⟳ `exercices/21-ui-kit-composants/` → ex21b — **Renforcement** : compound components (Modal, Tabs, Dropdown, Toast)

---

## Module 07 — CI/CD & DevOps Front

1. `cours/07-cicd/01-pipeline-ci.md`
2. `cours/07-cicd/02-deploiement.md`
3. `cours/07-cicd/03-monitoring.md`

Exercices :

- `exercices/22-pipeline-ci/` → ex22 — Pipeline visuel, configurateur, simulation
- ⟳ `exercices/22-pipeline-ci-visuel/` → ex22b — **Renforcement** : dashboard monitoring (graphe, logs, métriques)

---

## Module 08 — API Typées (GraphQL / tRPC)

1. `cours/08-api-typees/01-graphql-vue3.md`
2. `cours/08-api-typees/02-trpc.md`

Exercice :

- `exercices/23-client-api-type/` → ex23 — Client GraphQL et tRPC typé

---

## Module 09 — Accessibilité

1. `cours/09-accessibilite/01-fondamentaux-wcag.md`
2. `cours/09-accessibilite/02-aria-et-vue.md`
3. `cours/09-accessibilite/03-audit-a11y.md`

Exercice :

- `exercices/24-audit-accessibilite/` → ex24 — Audit WCAG, focus trap, aria-live

---

## Module 10 — Internationalisation (i18n)

1. `cours/10-i18n/01-vue-i18n.md`
2. `cours/10-i18n/02-strategies-avancees.md`

Exercice :

- `exercices/25-i18n-multi-locale/` → ex25 — vue-i18n, pluralisation, formatage, lazy loading

---

## Module 11 — Authentification & Sécurité

1. `cours/11-auth-securite/01-authentification.md`
2. `cours/11-auth-securite/02-securite-front.md`
3. `cours/11-auth-securite/03-rbac-et-permissions.md`

Exercice :

- `exercices/26-auth-securite/` → ex26 — JWT simulé, guards, RBAC, composant CanAccess

---

## Module 12 — TanStack Query (Vue Query)

1. `cours/12-vue-query/01-tanstack-query.md`
2. `cours/12-vue-query/02-patterns-avances.md`

Exercice :

- `exercices/27-vue-query-crud/` → ex27 — Queries, mutations, optimistic updates, pagination, cache

---

## Cadre pédagogique

- TypeScript strict partout, zéro `any`.
- Théorie concise → exercice immédiatement après.
- Contextes variés : UI, logique métier, intégration API.
- 34 exercices (dont 6 exercices de renforcement ⟳) tous lançables dans `App.vue`.
- Exercices de renforcement : même concept, angle différent (composition, cas réel, complexité accrue).
- Objectif : être opérationnel en mission ESN niveau senior sur Vue 3 + écosystème.
