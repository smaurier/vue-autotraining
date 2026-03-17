# 01 — Vue Router

> **Le GPS de votre application** — Vue Router permet de naviguer entre différentes "pages"
> sans jamais recharger le navigateur.

---

<details>
<summary>Rappel du cours précédent</summary>

1. **Quel composant Vue utilise-t-on pour animer l'entrée/sortie d'un seul élément ?**
   `<Transition>` avec un attribut `name` qui définit le préfixe des classes CSS (ex : `.fade-enter-from`).

2. **Quelle est la différence entre `<Transition>` et `<TransitionGroup>` ?**
   `<Transition>` anime un seul élément, `<TransitionGroup>` anime une liste d'éléments (ajouts, suppressions, repositionnements avec la classe `-move`).

3. **Pourquoi utiliser `mode="out-in"` sur une `<Transition>` ?**
   Pour que l'ancien élément disparaisse complètement avant que le nouveau apparaisse, évitant ainsi la superposition des deux éléments pendant l'animation.

</details>

---

## C'est quoi le "routing" ?

Imagine que ton application est un **grand immeuble**. Chaque appartement est une page différente
(Accueil, À propos, Contact, Profil utilisateur...).

Le **routeur** (router), c'est le **plan de l'immeuble** : il dit "si tu veux aller à l'appartement
'À propos', c'est au 2e étage, porte droite". En termes web : "si l'URL est `/about`, affiche
le composant `AboutView`".

**Sans routeur :** à chaque clic sur un lien, le navigateur recharge TOUTE la page depuis le serveur.
C'est lent, ça clignote.

**Avec routeur (SPA) :** la page ne se recharge JAMAIS. Le routeur change juste le composant affiché
à l'écran. C'est instantané et fluide, comme une appli mobile.

> **SPA = Single Page Application** (Application à Page Unique).
> Il n'y a qu'UN SEUL fichier HTML (`index.html`). Le routeur change le contenu affiché
> à l'intérieur de cette page unique.

---

## 📝 Rappel JavaScript — Les parties d'une URL

Avant de parler de routes, rappelons ce qu'est une URL :

```
https://monsite.com/users/42?sort=name#top
│         │            │       │        │
│         │            │       │        └── hash (ancre sur la page)
│         │            │       └── query (paramètres de recherche)
│         │            └── path (chemin — c'est ÇA que le routeur utilise)
│         └── domaine (nom du site)
└── protocole (https)
```

- **Le path** (`/users/42`) : c'est le "chemin" vers la page. Le routeur regarde ça pour savoir quel composant afficher.
- **La query** (`?sort=name`) : des paramètres en plus, comme des filtres de recherche.
- **Le hash** (`#top`) : un signet pour sauter à un endroit précis de la page.

---

## Installation

```bash
# On installe Vue Router version 4 (compatible avec Vue 3)
pnpm add vue-router@4
```

---

## Étape 1 — Créer le routeur (la "carte" de l'appli)

Le routeur, c'est un fichier ou on liste toutes les "routes" : chaque route associe
un **chemin URL** à un **composant Vue**.

```ts
// router/index.ts — Le fichier de configuration du routeur

// On importe les outils nécessaires depuis vue-router
import {
  createRouter,        // Fonction pour créer le routeur
  createWebHistory,    // Mode "history" : des URLs propres (sans #)
  type RouteRecordRaw, // Le type TypeScript pour décrire une route
} from 'vue-router'

// On définit la liste des routes : chaque objet = une "page"
const routes: RouteRecordRaw[] = [
  {
    path: '/',              // L'URL "/" = la page d'accueil
    name: 'home',           // Un petit nom pour cette route (pratique pour les liens)
    // Le composant à afficher. () => import(...) = "charge-le seulement quand on en a besoin"
    // C'est le "lazy loading" : ça évite de charger TOUTES les pages d'un coup
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/about',         // L'URL "/about" = la page À propos
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
  },
  {
    // Route "attrape-tout" : si aucune route ne correspond, on affiche une page 404
    // Le :pathMatch(.*) veut dire "n'importe quel chemin"
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

// On crée le routeur avec la configuration
const router = createRouter({
  history: createWebHistory(), // Utilise le mode "history" du navigateur
  routes,                      // On passe la liste des routes
})

// On exporte le routeur pour l'utiliser dans main.ts
export default router
```

## Étape 2 — Brancher le routeur à l'application

```ts
// main.ts — Le point d'entrée de l'application

import { createApp } from 'vue'   // Fonction pour créer l'appli Vue
import App from './App.vue'        // Le composant racine
import router from './router'      // Notre routeur qu'on vient de créer

// On crée l'appli, on branche le routeur avec .use(), puis on monte le tout
createApp(App)
  .use(router)    // "Hé l'appli, utilise ce routeur pour gérer la navigation !"
  .mount('#app')  // On affiche l'appli dans la div #app du HTML
```

---

## Étape 3 — Afficher les pages : `<RouterView>` et `<RouterLink>`

Maintenant qu'on à un routeur, il faut deux choses dans notre template :

1. **`<RouterView />`** — C'est l'**écran de télévision**. Le routeur "change la chaîne"
   en affichant le bon composant selon l'URL.
2. **`<RouterLink>`** — C'est la **télécommande**. Au lieu d'utiliser `<a href="...">`,
   on utilise `<RouterLink>` pour naviguer SANS recharger la page.

```vue
<!-- App.vue — Le composant principal de l'application -->
<template>
  <!-- La barre de navigation (comme un menu en haut du site) -->
  <nav>
    <!-- RouterLink crée un lien cliquable SANS rechargement de page -->
    <!-- to="/" veut dire "va à la route dont le path est /" -->
    <RouterLink to="/">Accueil</RouterLink>

    <!-- On peut aussi utiliser le NOM de la route au lieu du chemin -->
    <!-- C'est mieux car si on change le path plus tard, les liens marchent toujours -->
    <RouterLink :to="{ name: 'about' }">À propos</RouterLink>
  </nav>

  <!-- RouterView = l'endroit où le composant de la route active s'affiche -->
  <!-- Si l'URL est "/", HomeView s'affiche ici -->
  <!-- Si l'URL est "/about", AboutView s'affiche ici -->
  <RouterView />
</template>
```

> **Pourquoi `<RouterLink>` et pas `<a href="...">` ?**
> Un `<a>` classique recharge toute la page (le navigateur redemande tout au serveur).
> `<RouterLink>` change juste le composant affiché — c'est instantané !

### Utiliser `:to` avec un objet (recommandé)

```vue
<!-- Naviguer par NOM de route + paramètres -->
<!-- C'est comme dire "va à la page 'user', avec l'id 42" -->
<RouterLink :to="{ name: 'user', params: { id: 42 } }">Profil</RouterLink>

<!-- Naviguer avec des paramètres de recherche (query) -->
<!-- Ça donnera l'URL : /search?q=vue -->
<RouterLink :to="{ name: 'search', query: { q: 'vue' } }">Recherche</RouterLink>
```

> **Note :** Le `:` devant `to` signifie qu'on passe une expression JavaScript (un objet ici)
> au lieu d'une simple chaîne de texte. C'est la syntaxe `v-bind` qu'on a vue dans les cours précédents.

---

## Routes dynamiques — Des URLs avec des paramètres

### 📝 Rappel JavaScript — Les paramètres dans les URLs

Tu connais sûrement les URLs comme `youtube.com/watch?v=dQw4w9WgXcQ`. Le `v=dQw4w9` est un
**paramètre** qui identifie la vidéo. C'est pareil ici : on veut afficher un profil différent
selon l'utilisateur.

**Le problème :** On ne va pas créer une route pour `/users/1`, `/users/2`, `/users/3`...
Il faut une route **dynamique** qui accepte N'IMPORTE QUEL id.

**La solution :** On utilise `:id` dans le path. Le `:` veut dire "ce bout est variable".

```ts
// Dans router/index.ts, on ajoute cette route
{
  path: '/users/:id',    // :id est un PARAMÈTRE dynamique
  name: 'user',          // Il prendra la valeur qu'on met dans l'URL
  component: () => import('@/views/UserView.vue'),
}
// Exemples :
// URL /users/42  → id vaut "42"
// URL /users/7   → id vaut "7"
// URL /users/alice → id vaut "alice"
```

### Lire le paramètre dans le composant

```vue
<!-- UserView.vue — La page de profil d'un utilisateur -->
<script setup lang="ts">
import { computed } from 'vue'     // Pour créer une valeur calculée
import { useRoute } from 'vue-router'  // Pour accéder à la route actuelle

// useRoute() donne accès aux informations de la route actuelle
// (le path, les paramètres, la query, etc.)
const route = useRoute()

// On récupère le paramètre "id" de l'URL
// route.params.id est toujours une STRING (texte)
// Number(...) le convertit en nombre (42 au lieu de "42")
// computed() le rend réactif : si l'URL change, userId se met à jour automatiquement
const userId = computed(() => Number(route.params.id))
</script>

<template>
  <h1>Profil de l'utilisateur n°{{ userId }}</h1>
</template>
```

---

## Routes imbriquées (nested) — Des pages dans des pages

Imagine un **tableau de bord** (dashboard). Il à un menu latéral qui reste toujours visible,
et seul le contenu à droite change selon la sous-page choisie.

C'est comme une **poupée russe** : la page Dashboard contient d'autres pages à l'intérieur.

```
/dashboard            → Affiche DashboardLayout + DashboardHome à l'intérieur
/dashboard/settings   → Affiche DashboardLayout + DashboardSettings à l'intérieur
```

### Définir les routes imbriquées

```ts
// Dans router/index.ts
{
  path: '/dashboard',
  // Le composant "parent" qui contient le layout (menu + zone de contenu)
  component: () => import('@/views/DashboardLayout.vue'),
  // children = les routes "enfants" qui s'affichent DANS le parent
  children: [
    {
      path: '',              // Chemin vide = c'est la page par défaut de /dashboard
      name: 'dashboard-home',
      component: () => import('@/views/DashboardHome.vue'),
    },
    {
      path: 'settings',     // Correspond à /dashboard/settings
      name: 'dashboard-settings',
      component: () => import('@/views/DashboardSettings.vue'),
    },
  ],
}
```

### Le layout parent avec un `<RouterView>` intérieur

```vue
<!-- DashboardLayout.vue — Le "cadre" du dashboard -->
<template>
  <div class="dashboard">
    <!-- Le menu latéral reste TOUJOURS visible -->
    <aside>
      <h2>Menu</h2>
      <RouterLink :to="{ name: 'dashboard-home' }">Accueil</RouterLink>
      <RouterLink :to="{ name: 'dashboard-settings' }">Paramètres</RouterLink>
    </aside>

    <main>
      <!-- Ce RouterView affiche le composant ENFANT -->
      <!-- C'est un 2e "écran de télé" à l'intérieur du premier -->
      <RouterView />
    </main>
  </div>
</template>
```

---

## Navigation programmatique — Naviguer depuis le code

Parfois, on veut naviguer après une action (formulaire soumis, bouton cliqué, etc.)
et pas juste avec un lien dans le template. On utilise alors `useRouter()`.

> **Attention à ne pas confondre :**
> - `useRoute()` (sans "r" à la fin) = donne les **infos** de la route actuelle (params, query...)
> - `useRouter()` (avec "r") = donne le **routeur** pour **naviguer** vers d'autres pages

```ts
import { useRouter } from 'vue-router'

const router = useRouter()  // On récupère le routeur

// === NAVIGUER vers une page ===
// Méthode 1 : par nom de route + paramètres (recommandé)
router.push({ name: 'user', params: { id: 42 } })

// Méthode 2 : par chemin (plus simple mais moins flexible)
router.push('/about')

// === REMPLACER la page actuelle (pas de retour en arrière possible) ===
// L'historique ne gardera pas la page d'avant
router.replace({ name: 'home' })

// === NAVIGUER dans l'historique ===
router.back()    // Retour en arrière (comme le bouton ← du navigateur)
router.go(-2)    // Reculer de 2 pages dans l'historique
```

---

## Guards de navigation — Les "checkpoints de sécurité"

Les **guards** (gardes) sont comme des **agents de sécurité** postés devant certaines portes
de l'immeuble. Avant de laisser entrer quelqu'un, ils vérifient :
"As-tu le droit d'accéder à cette page ?"

**Exemple concret :** si un utilisateur non connecté essaie d'aller sur `/admin`,
le garde le redirige vers la page de connexion.

### Guard globale — Un garde à l'entrée de l'immeuble

Cette garde s'exécute **avant chaque navigation**, quelle que soit la page.

```ts
// router/index.ts — À ajouter APRÈS la création du routeur

// beforeEach = "avant chaque navigation"
// to = la route de DESTINATION (où on veut aller)
// from = la route de DÉPART (d'où on vient)
router.beforeEach((to, from) => {
  // On vérifie si l'utilisateur est connecté
  // localStorage est un petit espace de stockage dans le navigateur
  // !! transforme une valeur en true/false (rappel JS ci-dessous)
  const isAuthenticated = !!localStorage.getItem('token')

  // Si la route exige une authentification ET que l'utilisateur n'est pas connecté...
  if (to.meta.requiresAuth && !isAuthenticated) {
    // ...on le redirige vers la page de connexion au lieu de le laisser passer
    return { name: 'login' }
  }
  // Si on ne retourne rien, la navigation se fait normalement
})
```

> **📝 Rappel JavaScript — L'opérateur `!!`**
>
> `!!` transforme n'importe quelle valeur en `true` ou `false` :
> - `!!"hello"` → `true` (une chaîne non vide est "truthy")
> - `!!""` → `false` (une chaîne vide est "falsy")
> - `!!null` → `false` (null est "falsy")
>
> C'est un raccourci classique pour "est-ce que cette valeur existe ?"

### Guard par route — Un vigile devant UNE seule porte

On peut mettre une garde sur une route spécifique, par exemple la page admin :

```ts
// Dans la définition de la route
{
  path: '/admin',
  name: 'admin',
  component: () => import('@/views/AdminView.vue'),
  // meta = des données supplémentaires attachées à la route
  // On peut y mettre ce qu'on veut, ici on dit "cette page nécessite un admin"
  meta: { requiresAuth: true, role: 'admin' },
  // beforeEnter = garde spécifique à CETTE route uniquement
  beforeEnter: (to) => {
    const userRole = getUserRole()         // Fonction qui retourne le rôle de l'utilisateur
    if (userRole !== 'admin') {
      return { name: 'forbidden' }         // Pas admin ? → page "Accès interdit"
    }
    // Si on ne retourne rien, l'accès est autorisé
  },
}
```

### Typer les `meta` avec TypeScript

Par défaut, `to.meta` peut contenir n'importe quoi. Avec TypeScript, on peut
**déclarer** exactement ce que `meta` peut contenir pour éviter les erreurs :

```ts
// router/types.ts — On enrichit le type RouteMeta de Vue Router

// "declare module" permet d'ajouter des types à un module existant
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean                     // La page nécessite-t-elle une connexion ?
    role?: 'admin' | 'user' | 'manager'        // Quel rôle est requis ?
    title?: string                              // Titre de la page (pour l'onglet du navigateur)
  }
}
```

---

## Lazy loading — Charger les pages à la demandé

Par défaut, `() => import(...)` charge chaque composant seulement quand on en a besoin.
C'est comme un livre : on ne charge que le chapitre qu'on lit, pas tout le livre d'un coup.

On peut regrouper des routes par **feature** (fonctionnalité) :

```ts
const routes: RouteRecordRaw[] = [
  {
    path: '/admin',
    // Le layout de toute la section admin
    component: () => import('@/features/admin/AdminLayout.vue'),
    children: [
      {
        path: 'users',
        // Ces pages "admin" seront regroupées dans un même fichier JavaScript
        // Le navigateur les téléchargera ensemble quand on accède à /admin
        component: () => import('@/features/admin/views/UsersView.vue'),
      },
      {
        path: 'settings',
        component: () => import('@/features/admin/views/SettingsView.vue'),
      },
    ],
  },
]
```

---

## Bonus — Composable `useRouteQuery`

Un petit utilitaire pratique pour lire et modifier les paramètres de recherche de l'URL
(la partie `?key=value`) de manière **réactive** :

```ts
// composables/useRouteQuery.ts
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Ce composable synchronise un paramètre de l'URL avec une variable réactive
// Exemple : si l'URL est /search?q=vue, useRouteQuery('q') retourne "vue"
export function useRouteQuery(key: string, defaultValue = '') {
  const route = useRoute()     // Pour LIRE les paramètres actuels
  const router = useRouter()   // Pour MODIFIER l'URL

  return computed({
    // Quand on LIT la valeur : on prend le paramètre de l'URL (ou la valeur par défaut)
    get: () => (route.query[key] as string) ?? defaultValue,
    // Quand on ÉCRIT la valeur : on met à jour l'URL
    set: (value: string) => {
      router.replace({
        query: { ...route.query, [key]: value || undefined },
      })
    },
  })
}
```

```vue
<!-- Exemple d'utilisation -->
<script setup lang="ts">
import { useRouteQuery } from '@/composables/useRouteQuery'

// searchQuery est synchronisé avec ?q= dans l'URL
// Si l'URL est /search?q=hello → searchQuery.value vaut "hello"
const searchQuery = useRouteQuery('q')
</script>

<template>
  <!-- Quand on tape dans l'input, l'URL se met à jour automatiquement ! -->
  <input v-model="searchQuery" placeholder="Rechercher..." />
</template>
```

---

## Résumé visuel

```
┌─────────────────────────────────────────────┐
│  URL : /dashboard/settings?lang=fr          │
│         ──────┬──────────  ───┬───          │
│               │               │             │
│          path (chemin)    query (filtre)     │
│               │                             │
│   Le routeur cherche ──► route "dashboard"  │
│               │          └── enfant "settings"
│               ▼                             │
│   ┌───────────────────────┐                 │
│   │   DashboardLayout     │                 │
│   │  ┌─────────────────┐  │                 │
│   │  │ DashboardSettings│  │  ← RouterView  │
│   │  └─────────────────┘  │                 │
│   └───────────────────────┘                 │
└─────────────────────────────────────────────┘
```

---

## 🎯 Pratique

### Exercice VR.1 — Définir des routes

Complète la configuration du routeur :

```ts
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import About from '@/views/About.vue'
import Contact from '@/views/Contact.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Route "/" → Home
    // ???
    
    // Route "/about" → About
    // ???
    
    // Route "/contact" → Contact
    // ???
  ]
})
```

<details>
<summary>Solution</summary>

```ts
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
    { path: '/contact', component: Contact }
  ]
})
```
</details>

---

### Exercice VR.2 — Route avec paramètre

Crée une route pour afficher les détails d'un produit :

```ts
// La route doit être : /products/42 (42 = l'id du produit)
// ???
```

Et récupère le paramètre dans le composant :

```vue
<!-- ProductDetail.vue -->
<script setup lang="ts">
// Récupère l'id du produit depuis l'URL
const productId = ???
</script>

<template>
  <h1>Produit n°{{ productId }}</h1>
</template>
```

<details>
<summary>Solution</summary>

```ts
// Dans le routeur
{ path: '/products/:id', component: ProductDetail }
```

```vue
<!-- ProductDetail.vue -->
<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const productId = route.params.id
</script>

<template>
  <h1>Produit n°{{ productId }}</h1>
</template>
```
</details>

---

### Exercice VR.3 — Navigation programmatique

Complète ce composant pour naviguer vers la page de détails au clic :

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = ???

function goToProduct(id: number) {
  // Navigue vers /products/{id}
  // ???
}
</script>

<template>
  <button @click="goToProduct(42)">Voir le produit 42</button>
</template>
```

<details>
<summary>Solution</summary>

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goToProduct(id: number) {
  router.push(`/products/${id}`)
}
</script>

<template>
  <button @click="goToProduct(42)">Voir le produit 42</button>
</template>
```
</details>

---

### Exercice VR.4 — Guard de navigation

Crée un guard qui empêche l'accès à `/admin` si l'utilisateur n'est pas connecté :

```ts
// Suppose que isLoggedIn() retourne true/false
function isLoggedIn(): boolean {
  return localStorage.getItem('token') !== null
}

router.beforeEach((to, from) => {
  // Si on va vers /admin et qu'on n'est pas connecté → redirige vers /login
  // ???
})
```

<details>
<summary>Solution</summary>

```ts
router.beforeEach((to, from) => {
  if (to.path === '/admin' && !isLoggedIn()) {
    return '/login'
  }
})
```
</details>

---

## Exercice

→ `exercices/10-app-multi-pages/ENONCE.md`

## Suite

→ `cours/03-avance/02-pinia.md`
