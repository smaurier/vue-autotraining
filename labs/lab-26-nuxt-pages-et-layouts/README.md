# Lab 26 — Nuxt : pages et layouts

> **Outcome :** à la fin, tu sais créer des pages Nuxt via l'arborescence `pages/`, appliquer un layout, protéger une route avec un middleware `auth`, et naviguer entre pages avec `NuxtLink` et `navigateTo` — dans un projet Nuxt 3 réel.
> **Vrai outil :** Nuxt 3 + `nuxi dev` (dev server SSR avec HMR).
> **Feedback :** le coach valide le comportement dans le navigateur en session — pas de test-runner auto-correcteur.

---

## Énoncé

Tu construis les trois premières pages du front-office TribuZen dans un projet Nuxt 3 :

1. **`/feed`** — page principale (authentifiée), layout `default` avec navbar.
2. **`/profile`** — page profil (authentifiée), avec deux sous-pages imbriquées : `/profile/info` et `/profile/settings`.
3. **`/family/[id]`** — page dynamique (authentifiée), affiche l'id de la famille.
4. **`/login`** — page de connexion, layout `auth` (sans navbar), **non protégée**.

**Comportement attendu :**
- Naviguer vers `/feed`, `/profile`, `/family/42` depuis une URL directe → redirige vers `/login` tant que l'utilisateur n'est pas marqué comme connecté.
- Après avoir cliqué "Se connecter" sur `/login` → redirige vers `/feed`, la navbar apparaît.
- Sur `/profile`, les onglets "Informations" et "Paramètres" affichent les sous-pages sans recharger la navbar.
- La page `/login` n'affiche **pas** de navbar (layout `auth`).

**Pas de gap-fill** — tu construis tout à partir du starter ci-dessous.

### Starter minimal

Initialise un projet Nuxt 3 (si pas déjà fait depuis le module 25) :

```bash
npx nuxi@latest init tribuzen-pages
cd tribuzen-pages
pnpm install
pnpm dev
```

Structure de départ à créer manuellement :

```
tribuzen-pages/
├── app.vue                  ← remplacer le contenu par défaut
├── layouts/
│   ├── default.vue          ← à créer
│   └── auth.vue             ← à créer
├── middleware/
│   └── auth.ts              ← à créer
└── pages/
    ├── login.vue            ← à créer
    ├── feed.vue             ← à créer
    ├── family/
    │   └── [id].vue         ← à créer
    └── profile/
        ├── index.vue        ← à créer
        ├── info.vue         ← à créer
        └── settings.vue     ← à créer
```

`app.vue` minimal pour activer les layouts :

```vue
<!-- app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

---

## Étapes (en friction)

1. **Crée `layouts/auth.vue`** — un shell minimaliste sans navbar, juste un `<slot />` centré.

2. **Crée `layouts/default.vue`** — navbar avec liens vers `/feed` et `/profile`, un `<slot />` comme zone de contenu.

3. **Crée `middleware/auth.ts`** — utilise `useState<boolean>('isAuth', () => false)` comme état d'authentification simulé. Si `!isAuth.value` et que `to.path !== '/login'`, rediriger vers `/login`.

4. **Crée `pages/login.vue`** — avec `definePageMeta({ layout: 'auth' })`. Ajoute un bouton "Se connecter" qui : (a) met `isAuth` à `true`, (b) navigue vers `/feed` via `navigateTo`.

5. **Crée `pages/feed.vue`** — avec `definePageMeta({ middleware: 'auth' })`. Contenu minimal : titre "Feed TribuZen" + un `NuxtLink` vers `/family/42`.

6. **Crée `pages/family/[id].vue`** — lit `route.params.id<code v-pre> et affiche "Famille #{{ familyId }}". </code>definePageMeta({ middleware: 'auth' })`. Ajoute un `NuxtLink` retour vers `/feed`.

7. **Crée les pages profil imbriquées** :
   - `pages/profile/index.vue` — deux onglets `NuxtLink` vers `/profile/info` et `/profile/settings`, puis `<NuxtPage />`.
   - `pages/profile/info.vue` — contenu statique "Mes informations".
   - `pages/profile/settings.vue` — contenu statique "Paramètres".
   - Le middleware `auth` va sur `profile/index.vue` uniquement (les enfants héritent).

8. **Valide manuellement dans le navigateur :**
   - Accès direct à `/feed` → redirige vers `/login`.
   - Clic "Se connecter" → redirige vers `/feed`, navbar visible.
   - Clic sur le lien `/family/42` → affiche "Famille #42", middleware passe.
   - Navigation entre `/profile/info` et `/profile/settings` → les onglets changent, la navbar **ne clignote pas** (pas de re-render du layout).
   - Accès direct à `/login` → pas de navbar (layout `auth`).

---

## Corrigé complet commenté

### `app.vue`

```vue
<!-- app.vue -->
<template>
  <!-- NuxtLayout lit definePageMeta({ layout }) de la page active
       et entoure NuxtPage du layout correspondant -->
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

### `layouts/default.vue`

```vue
<!-- layouts/default.vue — layout principal avec navbar -->
<template>
  <div class="layout">
    <header class="navbar">
      <!-- NuxtLink génère un <a> avec active-class automatique -->
      <NuxtLink to="/feed" class="nav-link">Feed</NuxtLink>
      <NuxtLink to="/profile" class="nav-link">Profil</NuxtLink>
    </header>

    <main class="page-content">
      <!-- Nuxt injecte la page active ici — PAS <NuxtPage /> dans un layout -->
      <slot />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.navbar {
  display: flex;
  gap: 1.5rem;
  padding: 1rem 2rem;
  background: #1e293b;
}
.nav-link {
  color: #e2e8f0;
  text-decoration: none;
  font-weight: 500;
}
/* NuxtLink ajoute la classe router-link-active automatiquement */
.nav-link.router-link-active {
  color: #38bdf8;
  text-decoration: underline;
}
.page-content {
  flex: 1;
  padding: 2rem;
}
</style>
```

### `layouts/auth.vue`

```vue
<!-- layouts/auth.vue — shell minimaliste pour les pages non authentifiées -->
<template>
  <!-- Pas de navbar : les pages login/register ne doivent pas avoir de navigation -->
  <div class="auth-shell">
    <slot />
  </div>
</template>

<style scoped>
.auth-shell {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f8fafc;
}
</style>
```

### `middleware/auth.ts`

```ts
// middleware/auth.ts
// defineNuxtRouteMiddleware est auto-importé par Nuxt
export default defineNuxtRouteMiddleware((to) => {
  // useState crée un état global réactif partagé entre composants
  // 'isAuth' est la clé — doit matcher celle de login.vue
  // () => false = valeur initiale (non authentifié par défaut)
  const isAuth = useState<boolean>('isAuth', () => false)

  // Si non authentifié ET pas déjà sur /login
  // (sans le check to.path, on créerait une boucle infinie de redirections)
  if (!isAuth.value && to.path !== '/login') {
    // return est OBLIGATOIRE — sans lui, la navigation continue malgré la redirection
    return navigateTo('/login')
  }

  // Pas de return = navigation autorisée — le middleware passe
})
```

### `pages/login.vue`

```vue
<!-- pages/login.vue — page de connexion, layout auth, non protégée -->
<script setup lang="ts">
// definePageMeta = macro compilateur, traitée à la compilation
// DOIT être au niveau racine de <script setup>, sans conditions
definePageMeta({
  layout: 'auth',    // utilise layouts/auth.vue — pas de navbar
  // pas de middleware : /login doit être accessible à tous
})

// useState avec la même clé 'isAuth' que dans le middleware
// Nuxt garantit que c'est le même état — pas de doublon
const isAuth = useState<boolean>('isAuth', () => false)

async function handleLogin() {
  // Simuler une connexion — en vrai : appel API (module 27)
  isAuth.value = true

  // navigateTo fonctionne côté client et serveur
  // await garantit que la navigation est terminée avant de continuer
  await navigateTo('/feed')
}
</script>

<template>
  <div class="login-card">
    <h1>TribuZen</h1>
    <p>Connexion à votre espace famille</p>

    <!-- @click sur le bouton déclenche handleLogin -->
    <button class="btn-login" @click="handleLogin">
      Se connecter
    </button>
  </div>
</template>

<style scoped>
.login-card {
  background: #fff;
  border-radius: 12px;
  padding: 2rem 3rem;
  text-align: center;
  box-shadow: 0 4px 24px rgb(0 0 0 / 0.08);
  min-width: 320px;
}
.btn-login {
  margin-top: 1.5rem;
  padding: 0.75rem 2rem;
  background: #1e293b;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
}
.btn-login:hover { background: #334155; }
</style>
```

### `pages/feed.vue`

```vue
<!-- pages/feed.vue — page principale, protégée, layout default -->
<script setup lang="ts">
definePageMeta({
  middleware: 'auth',    // redirige vers /login si non authentifié
  // layout implicite : 'default' — inutile de le déclarer
})
</script>

<template>
  <div>
    <h1>Feed TribuZen</h1>
    <p>Ici s'afficheront les activités des familles.</p>

    <!-- NuxtLink = <RouterLink> Nuxt — navigation sans rechargement -->
    <NuxtLink to="/family/42">
      Voir la famille #42
    </NuxtLink>
  </div>
</template>
```

### `pages/family/[id].vue`

```vue
<!-- pages/family/[id].vue — route dynamique, un fichier pour toutes les familles -->
<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const route = useRoute()

// route.params.id type TypeScript : string | string[]
// String() normalise en string dans tous les cas
const familyId = computed(() => String(route.params.id))

// En Nuxt, les computed dans le template sont auto-unwrapped
// (même comportement que Vue)
</script>

<template>
  <div class="family-page">
    <h1>Famille #{{ familyId }}</h1>
    <p>Les données seront chargées via useFetch au module 27.</p>

    <!-- Lien retour avec NuxtLink — pas de <a href> classique -->
    <NuxtLink to="/feed">← Retour au feed</NuxtLink>
  </div>
</template>
```

### `pages/profile/index.vue`

```vue
<!-- pages/profile/index.vue — page parente des sous-pages profil -->
<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  // Les pages enfants (info.vue, settings.vue) héritent du layout
  // mais PAS du middleware — chaque page doit déclarer le sien si nécessaire
  // Ici, le middleware est sur le parent uniquement par souci de simplicité
})
</script>

<template>
  <div class="profile-wrapper">
    <h1>Mon profil</h1>

    <!-- Onglets de navigation entre sous-pages -->
    <nav class="profile-tabs">
      <!-- NuxtLink reçoit active-class automatiquement quand l'URL matche -->
      <NuxtLink to="/profile/info" class="tab">Informations</NuxtLink>
      <NuxtLink to="/profile/settings" class="tab">Paramètres</NuxtLink>
    </nav>

    <!-- Les pages enfants (info.vue, settings.vue) s'affichent ici -->
    <!-- C'est le <NuxtPage /> de la page parente — PAS le <slot /> du layout -->
    <NuxtPage />
  </div>
</template>

<style scoped>
.profile-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.5rem;
}
.tab {
  color: #64748b;
  text-decoration: none;
  padding: 0.25rem 0.5rem;
}
.tab.router-link-active {
  color: #1e293b;
  font-weight: 600;
  border-bottom: 2px solid #1e293b;
}
</style>
```

### `pages/profile/info.vue`

```vue
<!-- pages/profile/info.vue — sous-page enfant, s'affiche dans <NuxtPage /> du parent -->
<template>
  <section>
    <h2>Mes informations</h2>
    <dl>
      <dt>Nom</dt><dd>Sylvain M.</dd>
      <dt>Email</dt><dd>sylvain@tribuzen.app</dd>
    </dl>
  </section>
</template>
```

### `pages/profile/settings.vue`

```vue
<!-- pages/profile/settings.vue — sous-page enfant -->
<template>
  <section>
    <h2>Paramètres</h2>
    <p>Notifications, confidentialité, suppression du compte...</p>
  </section>
</template>
```

---

## Variante J+30 (fading)

**Même objectif — contraintes ajoutées, en 30 minutes, sans rouvrir ce corrigé :**

1. Ajoute une **transition de page** `fade` entre toutes les pages — dans `nuxt.config.ts` et le CSS global associé.
2. Ajoute une page `/family/index.vue` (liste des familles) avec trois liens statiques vers `/family/1`, `/family/2`, `/family/3`.
3. Sur la page `/profile`, la sous-page active (`/profile/info` ou `/profile/settings`) doit être **préchargée** — ajoute `:prefetch="true"` aux `NuxtLink` des onglets et observe l'effet dans les DevTools (Network tab).
4. Écris un **middleware inline** directement dans `definePageMeta` de `pages/family/index.vue` qui log le chemin de la page précédente (`from.path`) dans la console.

**Critère de réussite :** les quatre points fonctionnent dans le navigateur, sans consulter le module ni ce corrigé.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, les fichiers créés dans ce lab constituent la **couche routing** du front-office.

**Différences par rapport au lab :**

- `useState<boolean>('isAuth')` sera remplacé par un composable Pinia `useAuthStore` (module 15) qui persiste la session via cookies/localStorage.
- Les pages `/profile/info` et `/profile/settings` contiendront des `useFetch` vers l'API NestJS (module 27).
- La page `/family/[id]` fera `useFetch('/api/families/' + familyId.value)` pour charger les données réelles.
- Les transitions de page seront configurées après validation du design system (dépend du module 21).

**Commit cible :**

```
feat(pages): routing TribuZen — feed, profile imbriqué, family/[id], middleware auth
```

Structure finale dans `smaurier/tribuzen` :

```
tribuzen/
  app.vue
  layouts/
    default.vue
    auth.vue
  middleware/
    auth.ts
  pages/
    login.vue
    feed.vue
    profile/
      index.vue
      info.vue
      settings.vue
    family/
      index.vue
      [id].vue
```
