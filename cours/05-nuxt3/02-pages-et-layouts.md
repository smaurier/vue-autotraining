# 02 — Pages et Layouts

## Comprendre le concept : Pages et Layouts

Avant de coder, comprenons ce que sont les **pages** et les **layouts** avec une analogie simple :

> **Analogie** : imagine un **cadre photo**.
> - Le **layout** = le cadre (la bordure, le passe-partout). Il ne change pas quand tu changes la photo.
> - La **page** = la photo à l'intérieur. Elle change quand tu navigues sur le site.
>
> Sur un site web, le **layout** c'est ce qui reste fixe (le menu de navigation en haut, le pied de page en bas), et la **page** c'est le contenu qui change quand tu cliques sur un lien.

```
┌──────────────────────────────────────────┐
│  🔗 Accueil   À propos   Contact        │  ← Layout (ne change pas)
├──────────────────────────────────────────┤
│                                          │
│     Bienvenue sur mon site !             │  ← Page (change selon l'URL)
│     Voici le contenu de la page...       │
│                                          │
├──────────────────────────────────────────┤
│  © 2026 Mon Site                         │  ← Layout (ne change pas)
└──────────────────────────────────────────┘
```

---

## Le routing basé sur les fichiers

### Rappel : c'est quoi une URL ?

L'URL, c'est l'adresse que tu tapes dans la barre du navigateur. Par exemple :
- `monsite.com/` → la page d'accueil
- `monsite.com/about` → la page "à propos"
- `monsite.com/users/42` → la page de l'utilisateur n°42

### Dans Nuxt : le nom du fichier = l'URL

Tu crées un fichier `.vue` dans le dossier `pages/`, et Nuxt crée automatiquement la route correspondante :

```
pages/                          URL correspondante :
│
├── index.vue                →  /                    (page d'accueil)
├── about.vue                →  /about               (page à propos)
├── contact.vue              →  /contact             (page contact)
│
├── blog/                       (un sous-dossier = un segment d'URL en plus)
│   ├── index.vue            →  /blog                (liste des articles)
│   └── [slug].vue           →  /blog/mon-article    (un article spécifique)
│
├── users/
│   ├── index.vue            →  /users               (liste des utilisateurs)
│   ├── [id].vue             →  /users/42            (un utilisateur spécifique)
│   └── [id]/
│       └── edit.vue         →  /users/42/edit       (modifier l'utilisateur 42)
│
└── [...slug].vue            →  (toute URL non trouvée → page 404)
```

> 💡 **Les crochets `[id]`** signifient "cette partie de l'URL est **variable**". On appelle ça une **route dynamique**. Le fichier `[id].vue` affichera le bon contenu que l'utilisateur visite `/users/1`, `/users/42`, ou `/users/999`.

> 💡 **`index.vue`** dans un dossier correspond toujours à l'URL du dossier sans rien après. C'est comme la page d'accueil de ce dossier.

---

## Créer une page simple

Voici ta première page Nuxt. Crée le fichier `pages/index.vue` :

```vue
<!-- pages/index.vue — c'est la page d'accueil de ton site (URL: /) -->
<script setup lang="ts">
// Grâce aux auto-imports de Nuxt, pas besoin d'écrire :
// import { ref } from 'vue'
// Nuxt le fait pour toi !

const count = ref(0)
// ref(0) crée une variable réactive initialisée à 0
// "réactive" veut dire que la page se met à jour automatiquement quand la valeur change
</script>

<template>
  <div>
    <!-- Le titre de la page -->
    <h1>Bienvenue sur mon site !</h1>

    <!-- Affiche la valeur actuelle du compteur -->
    <p>Compteur : {{ count }}</p>

    <!-- Quand on clique, le compteur augmente de 1 -->
    <!-- @click est un raccourci pour v-on:click (écouter l'événement "click") -->
    <button @click="count++">+1</button>
  </div>
</template>
```

> C'est tout ! Pas de configuration de route, pas d'import. Tu crées le fichier → la page existe.

---

## Créer une page dynamique (avec `[id]`)

### Le problème

Tu veux afficher la page d'un utilisateur. Mais tu ne vas pas créer un fichier par utilisateur (`user1.vue`, `user2.vue`, `user3.vue`...) — ce serait impossible !

### La solution : les routes dynamiques avec `[id]`

Le nom `[id].vue` dit à Nuxt : "cette partie de l'URL est une **variable** qui change".

```vue
<!-- pages/users/[id].vue — une page pour CHAQUE utilisateur -->
<!-- Ce fichier gère /users/1, /users/42, /users/999, etc. -->
<script setup lang="ts">
// useRoute() donne accès aux informations de l'URL actuelle
// C'est auto-importé par Nuxt, pas besoin d'import !
const route = useRoute()

// route.params.id contient la partie variable de l'URL
// Si l'URL est /users/42, alors route.params.id vaut "42" (c'est un string)
// Number() convertit le string "42" en nombre 42
const userId = computed(() => Number(route.params.id))
// computed() crée une valeur calculée qui se met à jour automatiquement

// useFetch() va chercher les données de l'utilisateur sur le serveur
// On verra useFetch en détail dans le prochain chapitre
const { data: user } = await useFetch(`/api/users/${userId.value}`)
// /api/users/42 → demande les infos de l'utilisateur 42 au serveur
</script>

<template>
  <!-- v-if="user" : affiche seulement si les données existent -->
  <!-- (elles pourraient être null si le serveur n'a pas encore répondu) -->
  <div v-if="user">
    <h1>{{ user.name }}</h1>
    <!-- {{ }} = affiche la valeur de l'expression JavaScript à l'intérieur -->
    <p>Email : {{ user.email }}</p>

    <!-- Lien pour revenir à la liste des utilisateurs -->
    <!-- NuxtLink est comme une balise <a> mais optimisée pour Nuxt -->
    <NuxtLink to="/users">← Retour à la liste</NuxtLink>
  </div>
</template>
```

### Comment ça marche en résumé :

```
L'utilisateur visite : /users/42
                              ^^
                              Ce "42" est capturé dans route.params.id
                              ↓
Le composant fait     : useFetch('/api/users/42')
                              ↓
Le serveur répond     : { name: "Alice", email: "alice@example.com" }
                              ↓
Le template affiche   : <h1>Alice</h1>
```

---

## Les Layouts : le cadre autour de tes pages

### Créer le layout par défaut

Le layout `default.vue` est automatiquement appliqué à **toutes les pages** (sauf si tu en spécifies un autre).

```vue
<!-- layouts/default.vue — le cadre par défaut de toutes les pages -->
<template>
  <div class="layout">

    <!-- ═══ PARTIE HAUTE : le menu de navigation ═══ -->
    <header>
      <nav>
        <!-- NuxtLink = lien de navigation optimisé par Nuxt -->
        <!-- "to" indique l'URL de destination -->
        <NuxtLink to="/">Accueil</NuxtLink>
        <NuxtLink to="/about">À propos</NuxtLink>
        <NuxtLink to="/contact">Contact</NuxtLink>
      </nav>
    </header>

    <!-- ═══ PARTIE CENTRALE : le contenu de la page ═══ -->
    <main>
      <slot />
      <!-- ⬆️ C'est ici que le contenu de la page s'affiche ! -->
      <!-- <slot /> est un "trou" dans le layout où Nuxt insère la page active -->
      <!-- Si l'URL est /, c'est pages/index.vue qui s'affiche ici -->
      <!-- Si l'URL est /about, c'est pages/about.vue qui s'affiche ici -->
    </main>

    <!-- ═══ PARTIE BASSE : le pied de page ═══ -->
    <footer>© 2026 Mon Super Site</footer>

  </div>
</template>
```

> **Rappel : c'est quoi `<slot />`?**
> C'est un **emplacement réservé**. Le layout dit : "Je gère le header et le footer, mais le contenu du milieu, c'est la page qui le fournit."
>
> **Analogie** : c'est comme un cadre photo avec un trou au milieu. Le cadre (layout) ne change pas, mais tu peux changer la photo (page) à l'intérieur.

### Créer un layout personnalisé (ex: admin)

Certaines pages ont besoin d'un cadre différent. Par exemple, les pages d'administration avec un menu latéral :

```vue
<!-- layouts/admin.vue — un layout spécial pour l'administration -->
<template>
  <div class="admin-layout">

    <!-- Un menu latéral (sidebar) à gauche -->
    <aside>
      <h2>Administration</h2>
      <NuxtLink to="/admin">Tableau de bord</NuxtLink>
      <NuxtLink to="/admin/users">Utilisateurs</NuxtLink>
      <NuxtLink to="/admin/settings">Paramètres</NuxtLink>
    </aside>

    <!-- Le contenu de la page admin s'affiche ici -->
    <main>
      <slot />
    </main>

  </div>
</template>
```

### Dire à une page d'utiliser un layout spécifique

Par défaut, toutes les pages utilisent `layouts/default.vue`. Pour utiliser un autre layout, on utilise `definePageMeta` :

```vue
<!-- pages/admin/index.vue — cette page utilise le layout "admin" -->
<script setup lang="ts">
// definePageMeta() configure les options de la page
// C'est auto-importé, pas besoin d'import !
definePageMeta({
  layout: 'admin',     // Utilise layouts/admin.vue au lieu de layouts/default.vue
})
</script>

<template>
  <div>
    <h1>Tableau de bord</h1>
    <p>Bienvenue dans l'administration.</p>
  </div>
</template>
```

### Schéma : quel layout pour quelle page ?

```
pages/index.vue          → layout: default  (par défaut)
pages/about.vue          → layout: default  (par défaut)
pages/admin/index.vue    → layout: admin    (spécifié avec definePageMeta)
pages/admin/users.vue    → layout: admin    (spécifié avec definePageMeta)
```

---

## La navigation entre les pages

### Avec un lien (dans le template)

```vue
<template>
  <!-- NuxtLink crée un lien cliquable (comme <a href="..."> en HTML) -->
  <!-- Mais NuxtLink est plus intelligent : il ne recharge pas toute la page -->
  <NuxtLink to="/about">À propos</NuxtLink>
</template>
```

### Par le code (navigation programmatique)

Parfois, tu veux naviguer **après une action** (un clic sur un bouton, la soumission d'un formulaire...) :

```vue
<template>
  <!-- Quand on clique ce bouton, on est redirigé vers /dashboard -->
  <button @click="navigateTo('/dashboard')">
    Aller au Dashboard
  </button>
</template>
```

> 💡 `navigateTo()` est auto-importé par Nuxt. C'est l'équivalent de `router.push()` en Vue classique.

---

## Les Middleware : le vigile à l'entrée

### C'est quoi un middleware ?

Un **middleware**, c'est du code qui s'exécute **AVANT** d'afficher une page. C'est comme un vigile à l'entrée d'une boîte de nuit : il vérifie si tu as le droit d'entrer.

> **Analogie** : tu veux entrer dans la page `/admin`. Le middleware vérifie si tu es connecté. Si oui → tu entres. Si non → tu es redirigé vers `/login`.

### Créer un middleware

```ts
// middleware/auth.ts — vérifie si l'utilisateur est connecté
export default defineNuxtRouteMiddleware((to) => {
  // "to" contient les informations sur la page que l'utilisateur veut visiter

  // useAuth() est un composable (fonction réutilisable) qui gère l'authentification
  const { isAuthenticated } = useAuth()

  // Si l'utilisateur N'EST PAS connecté ET qu'il ne va pas déjà vers /login...
  if (!isAuthenticated.value && to.path !== '/login') {
    // ...on le redirige vers la page de connexion
    return navigateTo('/login')
  }

  // Si on ne retourne rien, l'utilisateur peut accéder à la page normalement
})
```

### Appliquer un middleware à une page

```vue
<!-- pages/admin/index.vue — cette page est protégée par le middleware "auth" -->
<script setup lang="ts">
definePageMeta({
  middleware: 'auth',      // Le middleware "auth" s'exécute avant d'afficher cette page
  layout: 'admin',         // On peut combiner middleware ET layout
})
</script>
```

### Middleware global (s'applique à TOUTES les pages)

Si tu veux qu'un middleware s'exécute sur **chaque page** du site, ajoute `.global` au nom du fichier :

```ts
// middleware/auth.global.ts — le suffixe ".global" l'applique partout
export default defineNuxtRouteMiddleware((to) => {
  // Ce code s'exécute AVANT chaque changement de page
  console.log('Navigation vers :', to.path)
})
```

---

## Récapitulatif

| Concept     | C'est quoi ?                                         | Fichier                  |
|-------------|------------------------------------------------------|--------------------------|
| **Page**    | Le contenu qui change selon l'URL                    | `pages/about.vue`        |
| **Layout**  | Le cadre fixe autour de la page (header, footer)     | `layouts/default.vue`    |
| **Route dynamique** | Une page dont l'URL contient une partie variable | `pages/users/[id].vue` |
| **Middleware** | Code exécuté AVANT d'afficher une page (ex: auth) | `middleware/auth.ts`     |
| **NuxtLink** | Lien de navigation optimisé                         | `<NuxtLink to="/...">`  |

---

## Suite

→ `cours/05-nuxt3/03-data-fetching.md`
