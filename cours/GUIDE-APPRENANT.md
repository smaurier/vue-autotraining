# Guide de l'apprenant -- Vue.js 3

> **Ce guide est ta boussole.** Vue.js est un framework progressif --
> et ce cours l'est aussi. Tu pars d'un composant basique et tu arrives
> a une application entreprise avec Nuxt, Storybook, et CI/CD.
>
> **Temps estime** : ~150-200h (4-6 mois a 8-10h/semaine)
>
> **Philosophie** : Vue se comprend en construisant, pas en lisant.
> Chaque concept doit se traduire par un composant qui tourne dans ton navigateur.
> Si tu n'as pas ouvert les DevTools, tu n'as pas appris.

---

## Avant de commencer -- Auto-diagnostic

### JavaScript / TypeScript -- le socle

- [ ] Tu sais utiliser `const`, `let`, les fonctions flechees
- [ ] Tu sais destructurer un objet et un tableau
- [ ] Tu comprends `async`/`await` et les Promises
- [ ] Tu sais ce qu'est un Proxy en JavaScript (meme vaguement)
- [ ] Tu as des bases en TypeScript (interfaces, generics)

**5/5** -> Tu es pret. La Composition API sera naturelle pour toi.
**3-4/5** -> Revise les points manquants (~2h). Le Proxy est important pour comprendre la reactivite Vue.
**< 3/5** -> Fais d'abord les bases JS/TS. Vue 3 + TypeScript sans bases TS, c'est frustrant.

### Frameworks front -- ou en es-tu ?

- [ ] Tu as deja utilise un framework front (React, Angular, Svelte, ou Vue 2)
- [ ] Tu sais ce qu'est un composant et le concept de props
- [ ] Tu comprends le concept de reactivite (l'UI se met a jour quand l'etat change)
- [ ] Tu as deja utilise `ref()` ou `reactive()` en Vue 3
- [ ] Tu as deja cree un composable (equivalent d'un custom hook React)

**5/5** -> Tu peux probablement demarrer a la Phase 3 (avance). Fais le diagnostic de la Phase 2 d'abord.
**3-4/5** -> Commence a la Phase 2 si tu connais deja les bases Vue 3, sinon Phase 1.
**0-2/5** -> Phase 1. Le cours couvre tout depuis le debut.

### Le test decisif

Ecris mentalement un composant Vue 3 avec la Composition API qui affiche un compteur
avec un bouton pour l'incrementer.

- Si tu ecris `ref(0)` dans un `<script setup>` avec un `@click` -> tu connais les bases. Verifie la Phase 2.
- Si tu ecris un `data()` avec `this.count` -> tu connais Vue 2 mais pas Vue 3. Commence a la Phase 1.
- Si tu ne sais pas par ou commencer -> parfait, la Phase 1 est faite pour toi.

---

## Les 5 phases de ta progression

### Phase 1 -- Debutant (dossier 01) ~25-35h

> **Objectif** : Maitriser les fondamentaux de Vue 3 avec la Composition API.
> Composants, reactivite, directives, evenements, lifecycle hooks.
>
> **Analogie** : Apprendre a parler Vue. Chaque lecon est un mot de vocabulaire.
> A la fin tu fais des phrases simples mais correctes.

| Fichier | Sujet | Temps | Note |
|---|---|---|---|
| 00-pieges-frequents.md | Pieges frequents | 1h | Lis-le MAINTENANT, ca t'evitera des heures de debug |
| 01-debutant/00-typer-vue3.md | TypeScript + Vue 3 | 2h | Comment typer les composants Vue |
| 01-debutant/01-environnement-et-premier-composant.md | Setup + premier composant | 2h | Vite, `<script setup>`, hello world |
| 01-debutant/02-template-et-directives.md | Templates et directives | 2h | `v-if`, `v-for`, `v-bind`, `v-show` |
| 01-debutant/03-reactivite.md | Reactivite | 3h | **Cours cle** -- `ref()`, `reactive()`, `computed()`, `watch()` |
| 01-debutant/04-evenements-et-v-model.md | Evenements et v-model | 2h | `@click`, `v-model`, custom events |
| 01-debutant/05-composants-props-emits.md | Composants, props, emits | 3h | **Cours cle** -- la communication parent-enfant |
| 01-debutant/06-lifecycle-hooks.md | Lifecycle hooks | 2h | `onMounted`, `onUnmounted`, quand les utiliser |
| 01-debutant/07-options-vs-composition-api.md | Options vs Composition | 1h | Pourquoi la Composition API a gagne |

**Conseil** : Le module reactivite (03) est LE concept central de Vue.
Si `ref()` vs `reactive()` te semble flou, arrete tout et relis-le.
Ouvre les Vue DevTools et observe les refs changer en temps reel.

**Checkpoint Phase 1** :
- [ ] Tu sais creer un composant avec `<script setup lang="ts">`
- [ ] Tu sais utiliser `ref()`, `computed()`, et `watch()` correctement
- [ ] Tu sais passer des props et emettre des evenements
- [ ] Tu sais quand utiliser `v-if` vs `v-show`
- [ ] Tu comprends le cycle de vie d'un composant (mount, update, unmount)

> **Test** : "Quelle est la difference entre `ref()` et `reactive()` ?"
> Si tu reponds que `ref` emballe une valeur primitive (ou non) dans un objet avec `.value`,
> tandis que `reactive` rend un objet profondement reactif mais ne peut pas etre reassigne, c'est bon.

---

### Phase 2 -- Intermediaire (dossier 02) ~25-30h

> **Objectif** : Composition API avancee, composables, gestion async,
> formulaires, slots avances, animations. Tu passes de "ca marche" a "c'est bien fait".
>
> **Analogie** : Tu sais parler. Maintenant tu ecris avec du style -- phrases complexes,
> figures de style, et une structure narrative.

| Fichier | Sujet | Temps | Note |
|---|---|---|---|
| 02-intermediaire/01-composition-api-avancee.md | Composition API avancee | 3h | `provide`/`inject`, patterns avances |
| 02-intermediaire/02-composables.md | Composables | 3h | **Cours cle** -- la killer feature de Vue 3 |
| 02-intermediaire/03-gestion-async.md | Gestion async | 3h | `Suspense`, loading states, error boundaries |
| 02-intermediaire/04-formulaires-et-validation.md | Formulaires et validation | 3h | VeeValidate, Zod, patterns de formulaires |
| 02-intermediaire/05-slots-avances.md | Slots avances | 2h | Scoped slots, render functions |
| 02-intermediaire/06-transitions-et-animations.md | Transitions | 2h | `<Transition>`, `<TransitionGroup>`, FLIP |

**Conseil** : Les composables (02) sont le pattern le plus puissant de Vue 3.
Un composable bien ecrit remplace un mixin, un HOC, et un store en meme temps.
Ecris au moins 3 composables custom pendant cette phase.

**Checkpoint Phase 2** :
- [ ] Tu sais ecrire un composable reutilisable (`useXxx`)
- [ ] Tu sais utiliser `provide`/`inject` pour la communication profonde
- [ ] Tu sais gerer un formulaire complexe avec validation
- [ ] Tu sais utiliser les scoped slots pour du contenu dynamique
- [ ] Tu sais animer l'entree/sortie d'un element avec `<Transition>`

> **Test** : "Ecris un composable `useFetch(url)` qui retourne `{ data, error, loading }`."
> Si tu ecris quelque chose avec `ref`, `watchEffect`, et un `try/catch` dans un `onMounted` (ou directement), c'est bon.

---

### Phase 3 -- Avance (dossier 03) ~30-35h

> **Objectif** : Vue Router, Pinia, testing. Les piliers d'une vraie application Vue.
>
> **Analogie** : Tu sais ecrire des composants. Maintenant tu construis une application
> complete avec navigation, etat global, et la certitude que ca ne casse pas.

| Fichier | Sujet | Temps | Note |
|---|---|---|---|
| 03-avance/01-vue-router.md | Vue Router | 3h | Routes, guards, lazy loading, navigation |
| 03-avance/02-pinia.md | Pinia | 3h | **Cours cle** -- state management moderne et type-safe |
| 03-avance/03-tests-unitaires.md | Tests unitaires | 3h | Vitest, tester un composable, tester un store |
| 03-avance/04-tests-composants.md | Tests de composants | 3h | Vue Test Utils, mount vs shallowMount |
| 03-avance/05-tests-integration.md | Tests d'integration | 2h | Tester un flow complet |
| 03-avance/06-tests-e2e-playwright.md | Tests E2E | 3h | Playwright, tester comme un utilisateur |
| 03-avance/07-msw-et-mocking-api.md | MSW et mocking | 2h | Mock Service Worker pour les tests |

**Attention** : Le testing (modules 03-07) represente la moitie de cette phase.
C'est voulu. Un composant sans test est un composant jetable.
Fais TOUS les exercices de testing -- c'est la que tu construis ta confiance.

**Checkpoint Phase 3** :
- [ ] Tu sais configurer Vue Router avec des routes dynamiques et des guards
- [ ] Tu sais creer un store Pinia avec state, getters, et actions
- [ ] Tu sais tester un composable avec Vitest
- [ ] Tu sais tester un composant avec Vue Test Utils
- [ ] Tu sais ecrire un test E2E avec Playwright
- [ ] Tu sais utiliser MSW pour mocker une API dans tes tests

> **Test** : "Un collegue met tout l'etat dans un seul store Pinia gigantesque. Que lui dis-tu ?"
> Si tu reponds "un store par domaine metier, avec des stores composes si necessaire", c'est bon.

---

### Phase 4 -- Expert (dossier 04) ~25-30h

> **Objectif** : Performance, SSR, architecture front, patterns entreprise.
> Tu ne codes plus des composants -- tu concois des applications.
>
> **Analogie** : Tu es un ecrivain publie. Maintenant tu deviens editeur --
> tu concois la structure du livre, pas juste les chapitres.

| Fichier | Sujet | Temps | Note |
|---|---|---|---|
| 04-expert/01-performance.md | Performance | 4h | `shallowRef`, `v-memo`, virtual scrolling, profiling |
| 04-expert/02-ssr-et-hydration.md | SSR et hydration | 4h | **Cours cle** -- rendu serveur, hydration, streaming |
| 04-expert/03-architecture-front.md | Architecture front | 3h | Feature-based structure, hexagonale front |
| 04-expert/04-patterns-entreprise.md | Patterns entreprise | 3h | Monorepo, design system, micro-frontends |

**Conseil** : Le SSR (02) est complexe mais essentiel. Ne le survole pas.
Comprendre l'hydration est ce qui separe un dev Vue junior d'un senior.
Si tu prevois d'utiliser Nuxt (Phase 5), cette base est obligatoire.

**Checkpoint Phase 4** :
- [ ] Tu sais identifier et corriger un probleme de performance Vue (re-renders inutiles)
- [ ] Tu comprends le SSR : rendu serveur, hydration, et les pieges (hydration mismatch)
- [ ] Tu sais structurer un projet Vue en features avec une architecture claire
- [ ] Tu sais quand un design system maison vaut le coup vs une lib existante
- [ ] Tu sais argumenter pour ou contre les micro-frontends

> **Test** : "L'app Vue met 4 secondes a devenir interactive. Par ou tu commences ?"
> Si tu parles de bundle analysis, code splitting par route, SSR pour le premier paint,
> et lazy loading des composants lourds, c'est bon.

---

### Phase 5 -- Specialisations (dossiers 05-12) ~40-60h

> **Objectif** : Les outils et pratiques de l'ecosysteme Vue en production.
> Nuxt 3, Storybook, CI/CD, APIs typees, accessibilite, i18n, securite, Vue Query.
>
> **Analogie** : Tu as bati la maison. Maintenant tu choisis les finitions,
> l'isolation, l'alarme, et la deco. Chaque specialisation est independante.

| Dossier | Sujet | Temps | Prerequis |
|---|---|---|---|
| 05-nuxt3 | Nuxt 3 | 8h | Phase 4 (SSR) |
| 06-storybook | Storybook | 5h | Phase 2 |
| 07-cicd | CI/CD et deploiement | 5h | Phase 3 (tests) |
| 08-api-typees | GraphQL + tRPC | 5h | Phase 2 |
| 09-accessibilite | WCAG et a11y | 5h | Phase 1 |
| 10-i18n | Internationalisation | 4h | Phase 2 |
| 11-auth-securite | Auth et securite | 5h | Phase 3 |
| 12-vue-query | TanStack Query | 4h | Phase 2 |

**Conseil** : Tu n'es PAS oblige de tout faire. Choisis en fonction de tes besoins :
- **Projet perso** -> Nuxt 3 + Vue Query
- **Entreprise** -> Storybook + CI/CD + Accessibilite
- **API-first** -> APIs typees (tRPC) + Auth
- **International** -> i18n + Accessibilite

**Checkpoint Phase 5** (par specialisation) :
- [ ] **Nuxt 3** : Tu sais creer une app Nuxt avec pages, layouts, data fetching, et server routes
- [ ] **Storybook** : Tu sais documenter un composant avec des stories et des controles
- [ ] **CI/CD** : Tu sais configurer un pipeline qui lint, teste, et deploie
- [ ] **a11y** : Tu sais auditer un composant pour l'accessibilite (aria, focus, contraste)
- [ ] **Vue Query** : Tu sais remplacer un `useFetch` maison par TanStack Query avec cache et invalidation

---

## Quand tu bloques

### "Mon composant ne se met pas a jour"
1. Verifie que tu utilises `.value` sur tes `ref()` dans le `<script>` (pas dans le template)
2. Verifie que tu ne reassignes pas un `reactive()` -- ca casse la reactivite
3. Ouvre les Vue DevTools et verifie que la ref a bien change
4. Si c'est un objet imbrique, verifie que tu modifies la propriete, pas la reference

### "Mon composable ne fonctionne pas"
1. Verifie qu'il est appele dans le `setup()` (ou `<script setup>`), pas dans un callback
2. Les lifecycle hooks (`onMounted`) doivent etre appeles dans le contexte setup
3. Si tu retournes un `ref`, le consommateur doit utiliser `.value` -- verifie
4. Teste le composable isolement avec Vitest avant de l'utiliser dans un composant

### "Mon test de composant echoue bizarrement"
1. Verifie que tu montes le composant avec les bons props
2. Utilise `await nextTick()` ou `await flushPromises()` apres un changement d'etat
3. Si le composant utilise un router ou un store, fournis des mocks dans le mount
4. Preference : teste le comportement (ce que l'utilisateur voit), pas l'implementation

### "L'hydration SSR ne marche pas"
1. `Hydration mismatch` = le HTML serveur != le HTML client. Cherche la difference.
2. Coupable frequent : `Date.now()`, `Math.random()`, ou `window` utilise pendant le render
3. Utilise `<ClientOnly>` pour les composants qui ne peuvent pas etre rendus cote serveur
4. Verifie que tes composables n'appellent pas d'API browser dans le setup (utilise `onMounted`)

### "Je ne sais pas comment structurer mon projet"
1. Phase 1-2 : un dossier `components/` et un dossier `composables/` suffisent
2. Phase 3+ : structure par feature (`features/auth/`, `features/cart/`, etc.)
3. Ne structure pas trop tot. Un fichier de 200 lignes n'a pas besoin d'etre decoupe
4. Regle simple : si tu importes un fichier depuis plus de 2 niveaux de `../`, reorganise

---

## Auto-evaluation globale

**Apres Phase 1** : "Quand utiliser `ref()` et quand utiliser `computed()` ?"
-> Si tu reponds que `ref` est pour l'etat mutable et `computed` est pour les valeurs derivees (qui se recalculent automatiquement), c'est bon.

**Apres Phase 2** : "C'est quoi un composable et pourquoi c'est mieux qu'un mixin ?"
-> Si tu parles de transparence (pas de collision de noms), de typage, et de composabilite (un composable peut en utiliser un autre), c'est bon.

**Apres Phase 3** : "Pourquoi tester un composant avec `mount` plutot que `shallowMount` ?"
-> Si tu reponds que `mount` teste le composant comme l'utilisateur le voit (avec ses enfants), tandis que `shallowMount` isole mais peut manquer des bugs d'integration, c'est bon.

**Apres Phase 4** : "Qu'est-ce que l'hydration et pourquoi ca peut casser ?"
-> Si tu expliques que le serveur genere du HTML statique, le client le "reactive" en attachant les event listeners, et que si le HTML differe ca casse, c'est bon.

**Apres Phase 5** : "Tu dois choisir entre Nuxt et une SPA classique. Comment tu decides ?"
-> Si tu parles de SEO, de performance au premier chargement, de complexite du deploy, et de besoins en SSR vs CSR, c'est bon.

---

## Rythme recommande

| Rythme | Par semaine | Duree totale |
|---|---|---|
| **Decouverte** (a cote du boulot) | 5-7h | 6-7 mois |
| **Regulier** (motivation) | 8-10h | 4-5 mois |
| **Intensif** (projet pro) | 12-15h | 3 mois |

### Conseils concrets

- **Phase 1 : 2-3 semaines max.** Les fondamentaux doivent etre solides, pas eternels.
- **Phase 2 : concentre-toi sur les composables.** C'est LE skill qui te rend productif en Vue 3.
- **Phase 3 : ne saute pas les tests.** 50% du temps de cette phase, c'est du testing. C'est normal.
- **Phase 4 : prends ton temps sur le SSR.** Relis-le deux fois si necessaire.
- **Phase 5 : choisis 3-4 specialisations max.** Mieux vaut 3 bien maitrises que 8 survoles.
- **Ouvre les Vue DevTools a chaque session.** C'est ton debugger numero 1.

### La session ideale (1h30)

1. **10 min** : Relis tes notes de la session precedente
2. **30 min** : Lis le cours du jour
3. **40 min** : Fais l'exercice (sans regarder la correction)
4. **10 min** : Compare avec la correction, note ce qui t'a surpris

---

## Ressources complementaires

### References essentielles
- [Documentation Vue.js](https://vuejs.org/) -- excellente, interactive, avec un playground
- [Vue DevTools](https://devtools.vuejs.org/) -- installe-les MAINTENANT si ce n'est pas fait
- [VueUse](https://vueuse.org/) -- collection de composables utilitaires (inspiration pour les tiens)

### Pour approfondir
- [Vue.js Design and Implementation](https://www.amazon.com/dp/1032354631) -- comment Vue fonctionne en interne
- [Pinia Documentation](https://pinia.vuejs.org/) -- courte et claire
- [Nuxt 3 Documentation](https://nuxt.com/) -- pour la Phase 5

---

## Et apres ?

Tu as fini les 5 phases ? Tu es un dev Vue.js 3 complet.

Prochaines etapes :
1. **Contribue a un projet open source Vue** -- VueUse, Nuxt modules, ou un composant de la communaute
2. **Explore le cours Architecture (10)** -- penser au-dela du framework
3. **Construis un side project avec Nuxt 3** -- le portfolio parfait pour un dev Vue senior
4. **Lis le code source de Vue 3** -- comprendre le `Proxy`-based reactivity system, c'est le niveau final
