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

  ignoreDeadLinks: true,

  themeConfig: {
    nav: [
      { text: 'Cours', link: '/cours/01-debutant/01-environnement-et-premier-composant' },
      { text: 'Exercices', link: '/exercices/README' },
      { text: 'Quizzes', link: '/quizzes/' },
      { text: 'Projet fil rouge', link: '/projet-fil-rouge/README' }
    ],

    sidebar: {
      '/cours/': [
        {
          text: 'Démarrage',
          items: [
            { text: 'Typer Vue 3', link: '/cours/01-debutant/00-typer-vue3' },
            { text: 'Pièges fréquents', link: '/cours/00-pieges-frequents' },
            { text: 'Parcours recommandé', link: '/cours/parcours' }
          ]
        },
        {
          text: 'Niveau 1 — Débutant',
          items: [
            { text: 'Environnement & Premier composant', link: '/cours/01-debutant/01-environnement-et-premier-composant' },
            { text: 'Template & Directives', link: '/cours/01-debutant/02-template-et-directives' },
            { text: 'Réactivité', link: '/cours/01-debutant/03-reactivite' },
            { text: 'Événements & v-model', link: '/cours/01-debutant/04-evenements-et-v-model' },
            { text: 'Composants, Props & Emits', link: '/cours/01-debutant/05-composants-props-emits' },
            { text: 'Lifecycle hooks', link: '/cours/01-debutant/06-lifecycle-hooks' },
            { text: 'Options API vs Composition API', link: '/cours/01-debutant/07-options-vs-composition-api' }
          ]
        },
        {
          text: 'Niveau 2 — Intermédiaire',
          items: [
            { text: 'Composition API avancée', link: '/cours/02-intermediaire/01-composition-api-avancee' },
            { text: 'Composables', link: '/cours/02-intermediaire/02-composables' },
            { text: 'Gestion async', link: '/cours/02-intermediaire/03-gestion-async' },
            { text: 'Formulaires & Validation', link: '/cours/02-intermediaire/04-formulaires-et-validation' },
            { text: 'Slots avancés', link: '/cours/02-intermediaire/05-slots-avances' },
            { text: 'Transitions & Animations', link: '/cours/02-intermediaire/06-transitions-et-animations' }
          ]
        },
        {
          text: 'Niveau 3 — Avancé',
          items: [
            { text: 'Vue Router', link: '/cours/03-avance/01-vue-router' },
            { text: 'Pinia', link: '/cours/03-avance/02-pinia' },
            { text: 'Tests unitaires', link: '/cours/03-avance/03-tests-unitaires' },
            { text: 'Tests composants', link: '/cours/03-avance/04-tests-composants' },
            { text: 'Tests intégration', link: '/cours/03-avance/05-tests-integration' },
            { text: 'Tests E2E Playwright', link: '/cours/03-avance/06-tests-e2e-playwright' },
            { text: 'MSW & Mocking API', link: '/cours/03-avance/07-msw-et-mocking-api' }
          ]
        },
        {
          text: 'Niveau 4 — Expert',
          items: [
            { text: 'Performance', link: '/cours/04-expert/01-performance' },
            { text: 'SSR & Hydration', link: '/cours/04-expert/02-ssr-et-hydration' },
            { text: 'Architecture front', link: '/cours/04-expert/03-architecture-front' },
            { text: 'Patterns entreprise', link: '/cours/04-expert/04-patterns-entreprise' }
          ]
        },
        {
          text: 'Nuxt 4',
          items: [
            { text: 'Introduction Nuxt', link: '/cours/05-nuxt3/01-introduction' },
            { text: 'Pages & Layouts', link: '/cours/05-nuxt3/02-pages-et-layouts' },
            { text: 'Data Fetching', link: '/cours/05-nuxt3/03-data-fetching' },
            { text: 'Server Routes', link: '/cours/05-nuxt3/04-server-routes' },
            { text: 'SEO & Meta', link: '/cours/05-nuxt3/05-seo-et-meta' }
          ]
        },
        {
          text: 'Storybook',
          items: [
            { text: 'Setup', link: '/cours/06-storybook/01-setup' },
            { text: 'Stories', link: '/cours/06-storybook/02-stories' },
            { text: 'Design System', link: '/cours/06-storybook/03-design-system' }
          ]
        },
        {
          text: 'CI/CD & Déploiement',
          items: [
            { text: 'Pipeline CI', link: '/cours/07-cicd/01-pipeline-ci' },
            { text: 'Déploiement', link: '/cours/07-cicd/02-deploiement' },
            { text: 'Monitoring', link: '/cours/07-cicd/03-monitoring' }
          ]
        },
        {
          text: 'API typées',
          items: [
            { text: 'GraphQL + Vue 3', link: '/cours/08-api-typees/01-graphql-vue3' },
            { text: 'tRPC', link: '/cours/08-api-typees/02-trpc' }
          ]
        },
        {
          text: 'Accessibilité',
          items: [
            { text: 'Fondamentaux WCAG', link: '/cours/09-accessibilite/01-fondamentaux-wcag' },
            { text: 'ARIA & Vue', link: '/cours/09-accessibilite/02-aria-et-vue' },
            { text: 'Audit a11y', link: '/cours/09-accessibilite/03-audit-a11y' }
          ]
        },
        {
          text: 'i18n',
          items: [
            { text: 'vue-i18n', link: '/cours/10-i18n/01-vue-i18n' },
            { text: 'Stratégies avancées', link: '/cours/10-i18n/02-strategies-avancees' }
          ]
        },
        {
          text: 'Auth & Sécurité',
          items: [
            { text: 'Authentification', link: '/cours/11-auth-securite/01-authentification' },
            { text: 'Sécurité front', link: '/cours/11-auth-securite/02-securite-front' },
            { text: 'RBAC & Permissions', link: '/cours/11-auth-securite/03-rbac-et-permissions' }
          ]
        },
        {
          text: 'TanStack Query',
          items: [
            { text: 'TanStack Query', link: '/cours/12-vue-query/01-tanstack-query' },
            { text: 'Patterns avancés', link: '/cours/12-vue-query/02-patterns-avances' }
          ]
        }
      ],
      '/quizzes/': [
        {
          text: 'Quizzes',
          items: [
            { text: 'Quiz — Accessibilité', link: '/quizzes/quiz-09-accessibilite.html' }
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
