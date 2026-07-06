import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Vue 3 Course',
  description: 'Formation Vue 3.5 / Nuxt 4 : Composition API, Pinia, SSR — de débutant à staffable ESN',
  lang: 'fr-FR',
  srcDir: '.',

  vite: {
    server: {
      port: 5171,
      strictPort: false
    }
  },

  // ⚠️ DETTE CONNUE : cet override neutralise les moustaches Vue `{{ }}` enseignées en prose
  // MAIS casse aussi le `{{ }}` du thème par défaut (menu/outline affichés littéralement).
  // Fix propre à faire : retirer l'override + v-pre/escape les `{{ }}` de prose du contenu
  // (cours Vue = ~586 occurrences, majorité en blocs code déjà safe ; cf.
  // docs/curriculum/DETTE-vitepress-delimiters.md).
  vue: {
    template: {
      compilerOptions: {
        delimiters: ['(%(', ')%)']
      }
    }
  },

  ignoreDeadLinks: true,

  // Refonte v1 : le cours vit désormais dans `modules/` (théorie) + `labs/` (pratique).
  // L'ancien contenu (`cours/0N-*`, `exercices/`, `quizzes/`) est conservé sur disque
  // comme source d'audit / archive git, mais EXCLU du build pour éviter les pages en double.
  // `cours/00-pieges-frequents`, `cours/parcours`, `cours/GUIDE-APPRENANT` restent publiés.
  srcExclude: [
    'cours/01-debutant/**',
    'cours/02-intermediaire/**',
    'cours/03-avance/**',
    'cours/04-expert/**',
    'cours/05-nuxt3/**',
    'cours/06-storybook/**',
    'cours/07-cicd/**',
    'cours/08-api-typees/**',
    'cours/09-accessibilite/**',
    'cours/10-i18n/**',
    'cours/11-auth-securite/**',
    'cours/12-vue-query/**',
    'exercices/**',
    'quizzes/**'
  ],

  themeConfig: {
    nav: [
      { text: 'Cours', link: '/modules/00-typer-vue3' },
      { text: 'Labs', link: '/labs/lab-00-typer-vue3/README' },
      { text: 'Pièges fréquents', link: '/cours/00-pieges-frequents' },
      { text: 'Parcours', link: '/cours/parcours' }
    ],

    sidebar: {
      '/modules/': [
        {
          text: 'Débutant',
          items: [
            { text: '00 · Typer Vue 3', link: '/modules/00-typer-vue3' },
            { text: '01 · Environnement & premier composant', link: '/modules/01-environnement-et-premier-composant' },
            { text: '02 · Template & directives', link: '/modules/02-template-et-directives' },
            { text: '03 · Réactivité', link: '/modules/03-reactivite' },
            { text: '04 · Événements & v-model', link: '/modules/04-evenements-et-v-model' },
            { text: '05 · Composants, props & emits', link: '/modules/05-composants-props-emits' },
            { text: '06 · Lifecycle hooks', link: '/modules/06-lifecycle-hooks' },
            { text: '07 · Options API vs Composition API', link: '/modules/07-options-vs-composition-api' }
          ]
        },
        {
          text: 'Intermédiaire',
          items: [
            { text: '08 · Composition API avancée', link: '/modules/08-composition-api-avancee' },
            { text: '09 · Composables', link: '/modules/09-composables' },
            { text: '10 · Gestion de l\'asynchrone', link: '/modules/10-gestion-async' },
            { text: '11 · Formulaires & validation', link: '/modules/11-formulaires-et-validation' },
            { text: '12 · Slots avancés', link: '/modules/12-slots-avances' },
            { text: '13 · Transitions & animations', link: '/modules/13-transitions-et-animations' }
          ]
        },
        {
          text: 'Avancé',
          items: [
            { text: '14 · Vue Router', link: '/modules/14-vue-router' },
            { text: '15 · Pinia', link: '/modules/15-pinia' },
            { text: '16 · Tests unitaires', link: '/modules/16-tests-unitaires' },
            { text: '17 · Tests de composants', link: '/modules/17-tests-composants' },
            { text: '18 · Tests d\'intégration', link: '/modules/18-tests-integration' },
            { text: '19 · Tests E2E (Playwright)', link: '/modules/19-tests-e2e-playwright' },
            { text: '20 · MSW & mocking d\'API', link: '/modules/20-msw-et-mocking-api' }
          ]
        },
        {
          text: 'Expert',
          items: [
            { text: '21 · Performance', link: '/modules/21-performance' },
            { text: '22 · SSR & hydration', link: '/modules/22-ssr-et-hydration' },
            { text: '23 · Architecture front', link: '/modules/23-architecture-front' },
            { text: '24 · Patterns d\'entreprise', link: '/modules/24-patterns-entreprise' }
          ]
        },
        {
          text: 'Nuxt',
          items: [
            { text: '25 · Nuxt — introduction', link: '/modules/25-nuxt-introduction' },
            { text: '26 · Nuxt — pages & layouts', link: '/modules/26-nuxt-pages-et-layouts' },
            { text: '27 · Nuxt — data fetching', link: '/modules/27-nuxt-data-fetching' },
            { text: '28 · Nuxt — server routes & Nitro', link: '/modules/28-nuxt-server-routes' },
            { text: '29 · Nuxt — SEO & meta', link: '/modules/29-nuxt-seo-et-meta' }
          ]
        },
        {
          text: 'Storybook',
          items: [
            { text: '30 · Setup', link: '/modules/30-storybook-setup' },
            { text: '31 · Stories', link: '/modules/31-storybook-stories' },
            { text: '32 · Design system', link: '/modules/32-storybook-design-system' }
          ]
        },
        {
          text: 'CI/CD',
          items: [
            { text: '33 · Pipeline', link: '/modules/33-cicd-pipeline' },
            { text: '34 · Déploiement', link: '/modules/34-cicd-deploiement' },
            { text: '35 · Monitoring', link: '/modules/35-cicd-monitoring' }
          ]
        },
        {
          text: 'API typées',
          items: [
            { text: '36 · GraphQL avec Vue', link: '/modules/36-graphql-vue3' },
            { text: '37 · tRPC', link: '/modules/37-trpc' }
          ]
        },
        {
          text: 'Accessibilité',
          items: [
            { text: '38 · Fondamentaux WCAG/RGAA', link: '/modules/38-accessibilite-fondamentaux-wcag' },
            { text: '39 · ARIA & Vue', link: '/modules/39-accessibilite-aria-et-vue' },
            { text: '40 · Audit d\'accessibilité', link: '/modules/40-accessibilite-audit' }
          ]
        },
        {
          text: 'i18n',
          items: [
            { text: '41 · vue-i18n', link: '/modules/41-i18n-vue-i18n' },
            { text: '42 · Stratégies avancées', link: '/modules/42-i18n-strategies-avancees' }
          ]
        },
        {
          text: 'Auth & sécurité',
          items: [
            { text: '43 · Authentification', link: '/modules/43-auth-authentification' },
            { text: '44 · Sécurité front', link: '/modules/44-securite-front' },
            { text: '45 · RBAC & permissions', link: '/modules/45-rbac-et-permissions' }
          ]
        },
        {
          text: 'Vue Query',
          items: [
            { text: '46 · TanStack Query', link: '/modules/46-vue-query-tanstack' },
            { text: '47 · Patterns avancés', link: '/modules/47-vue-query-patterns-avances' }
          ]
        }
      ],
      '/labs/': [
        {
          text: 'Labs — pratique (énoncé + corrigé)',
          items: [
            { text: 'Lab 00 · Typer Vue 3', link: '/labs/lab-00-typer-vue3/README' },
            { text: 'Lab 01 · Environnement', link: '/labs/lab-01-environnement/README' },
            { text: 'Lab 02 · Template & directives', link: '/labs/lab-02-template-et-directives/README' },
            { text: 'Lab 03 · Réactivité', link: '/labs/lab-03-reactivite/README' },
            { text: 'Lab 04 · Événements & v-model', link: '/labs/lab-04-evenements-et-v-model/README' },
            { text: 'Lab 05 · Composants, props & emits', link: '/labs/lab-05-composants-props-emits/README' },
            { text: 'Lab 06 · Lifecycle hooks', link: '/labs/lab-06-lifecycle-hooks/README' },
            { text: 'Lab 07 · Options vs Composition', link: '/labs/lab-07-options-vs-composition-api/README' },
            { text: 'Lab 08 · Composition API avancée', link: '/labs/lab-08-composition-api-avancee/README' },
            { text: 'Lab 09 · Composables', link: '/labs/lab-09-composables/README' },
            { text: 'Lab 10 · Gestion async', link: '/labs/lab-10-gestion-async/README' },
            { text: 'Lab 11 · Formulaires & validation', link: '/labs/lab-11-formulaires-et-validation/README' },
            { text: 'Lab 12 · Slots avancés', link: '/labs/lab-12-slots-avances/README' },
            { text: 'Lab 13 · Transitions & animations', link: '/labs/lab-13-transitions-et-animations/README' },
            { text: 'Lab 14 · Vue Router', link: '/labs/lab-14-vue-router/README' },
            { text: 'Lab 15 · Pinia', link: '/labs/lab-15-pinia/README' },
            { text: 'Lab 16 · Tests unitaires', link: '/labs/lab-16-tests-unitaires/README' },
            { text: 'Lab 17 · Tests de composants', link: '/labs/lab-17-tests-composants/README' },
            { text: 'Lab 18 · Tests d\'intégration', link: '/labs/lab-18-tests-integration/README' },
            { text: 'Lab 19 · Tests E2E Playwright', link: '/labs/lab-19-tests-e2e-playwright/README' },
            { text: 'Lab 20 · MSW & mocking', link: '/labs/lab-20-msw-et-mocking-api/README' },
            { text: 'Lab 21 · Performance', link: '/labs/lab-21-performance/README' },
            { text: 'Lab 22 · SSR & hydration', link: '/labs/lab-22-ssr-et-hydration/README' },
            { text: 'Lab 23 · Architecture front', link: '/labs/lab-23-architecture-front/README' },
            { text: 'Lab 24 · Patterns d\'entreprise', link: '/labs/lab-24-patterns-entreprise/README' },
            { text: 'Lab 25 · Nuxt introduction', link: '/labs/lab-25-nuxt-introduction/README' },
            { text: 'Lab 26 · Nuxt pages & layouts', link: '/labs/lab-26-nuxt-pages-et-layouts/README' },
            { text: 'Lab 27 · Nuxt data fetching', link: '/labs/lab-27-nuxt-data-fetching/README' },
            { text: 'Lab 28 · Nuxt server routes', link: '/labs/lab-28-nuxt-server-routes/README' },
            { text: 'Lab 29 · Nuxt SEO & meta', link: '/labs/lab-29-nuxt-seo-et-meta/README' },
            { text: 'Lab 30 · Storybook setup', link: '/labs/lab-30-storybook-setup/README' },
            { text: 'Lab 31 · Storybook stories', link: '/labs/lab-31-storybook-stories/README' },
            { text: 'Lab 32 · Storybook design system', link: '/labs/lab-32-storybook-design-system/README' },
            { text: 'Lab 33 · CI/CD pipeline', link: '/labs/lab-33-cicd-pipeline/README' },
            { text: 'Lab 34 · CI/CD déploiement', link: '/labs/lab-34-cicd-deploiement/README' },
            { text: 'Lab 35 · CI/CD monitoring', link: '/labs/lab-35-cicd-monitoring/README' },
            { text: 'Lab 36 · GraphQL avec Vue', link: '/labs/lab-36-graphql-vue3/README' },
            { text: 'Lab 37 · tRPC', link: '/labs/lab-37-trpc/README' },
            { text: 'Lab 38 · A11y fondamentaux', link: '/labs/lab-38-accessibilite-fondamentaux-wcag/README' },
            { text: 'Lab 39 · ARIA & Vue', link: '/labs/lab-39-accessibilite-aria-et-vue/README' },
            { text: 'Lab 40 · Audit a11y', link: '/labs/lab-40-accessibilite-audit/README' },
            { text: 'Lab 41 · vue-i18n', link: '/labs/lab-41-i18n-vue-i18n/README' },
            { text: 'Lab 42 · i18n stratégies avancées', link: '/labs/lab-42-i18n-strategies-avancees/README' },
            { text: 'Lab 43 · Authentification', link: '/labs/lab-43-auth-authentification/README' },
            { text: 'Lab 44 · Sécurité front', link: '/labs/lab-44-securite-front/README' },
            { text: 'Lab 45 · RBAC & permissions', link: '/labs/lab-45-rbac-et-permissions/README' },
            { text: 'Lab 46 · TanStack Query', link: '/labs/lab-46-vue-query-tanstack/README' },
            { text: 'Lab 47 · Vue Query patterns avancés', link: '/labs/lab-47-vue-query-patterns-avances/README' }
          ]
        }
      ]
    },

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3],
      label: 'Sur cette page'
    },

    docFooter: {
      prev: 'Précédent',
      next: 'Suivant'
    }
  }
})
