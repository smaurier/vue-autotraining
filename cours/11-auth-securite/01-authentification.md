# 01 — Authentification

## 🔑 C'est quoi l'authentification ?

Imagine que tu arrives à l'entrée d'une boîte de nuit :

1. **Authentification** = Le videur te demande ta carte d'identité → « Qui es-tu ? »
2. **Autorisation** = Le videur regarde ta carte VIP → « As-tu le droit d'entrer en zone VIP ? »

Ce sont **deux choses différentes** :
- **Authentification** : prouver **qui** tu es (avec un email + mot de passe, par exemple)
- **Autorisation** : vérifier **ce que tu as le droit de faire** une fois identifié

> 💡 **Rappel** : Dans une application web, quand tu te connectes avec ton email et ton mot de passe,
> c'est l'authentification. Quand l'app décide si tu peux accéder à la page admin ou non,
> c'est l'autorisation.

---

## 📋 Les modèles d'authentification

Il existe plusieurs façons de gérer l'authentification. Voici les plus courantes :

| Modèle | Analogie | Comment ça marche | Quand l'utiliser |
| --- | --- | --- | --- |
| **Session/Cookie** | Comme un tampon sur la main à l'entrée d'un club | Le serveur se souvient de toi (stocke ta session). Un petit fichier (cookie) est mis dans ton navigateur | Apps avec rendu serveur (SSR, Nuxt) |
| **JWT** | Comme un bracelet de festival (voir ci-dessous) | Un "jeton" signé est stocké côté client | SPA (Single Page App), API stateless |
| **OAuth2 / OIDC** | Comme quand un site te dit "Se connecter avec Google" | Tu délègues l'identification à un service tiers (Google, Microsoft...) | SSO, apps entreprise |

---

## 🎫 JWT : le standard pour les SPA

### C'est quoi un JWT ?

**JWT** = **JSON Web Token** (prononcé "jot")

> **Analogie du bracelet de festival** :
> - Tu achètes ton billet (= tu entres ton email + mot de passe)
> - On te donne un **bracelet** (= le token JWT)
> - Chaque fois que tu veux entrer dans une zone, tu montres ton bracelet
> - Pas besoin de remontrer ton billet à chaque fois !
> - Le bracelet est **signé** (il a un code unique) → impossible à falsifier

Un JWT est simplement un **texte encodé** qui contient des informations sur toi (ton id, ton nom, ton rôle...) et une **signature** qui prouve que c'est le serveur qui l'a créé.

### Le flux d'authentification pas à pas

Voici ce qui se passe quand tu te connectes :

```
Étape 1 : Tu tapes ton email + mot de passe dans le formulaire
           → Le navigateur envoie ces infos au serveur (POST /api/auth/login)

Étape 2 : Le serveur vérifie que l'email et le mot de passe sont corrects
           → Si oui, il te renvoie deux tokens :
             • accessToken  (ton bracelet principal, durée courte : ~15 min)
             • refreshToken (un bracelet de secours, durée longue : ~7 jours)

Étape 3 : Ton app stocke ces tokens

Étape 4 : À chaque fois que tu veux accéder à des données protégées,
           ton app envoie le accessToken avec la requête
           (dans le header "Authorization: Bearer <token>")

Étape 5 : Si le accessToken a expiré (au bout de 15 min),
           ton app utilise automatiquement le refreshToken
           pour en obtenir un nouveau (POST /api/auth/refresh)

Étape 6 : Si même le refreshToken a expiré (au bout de 7 jours),
           tu es redirigé vers la page de connexion
```

> 💡 **Pourquoi deux tokens ?**
> Le `accessToken` a une durée de vie courte (15 min) pour limiter les dégâts si quelqu'un le vole.
> Le `refreshToken` permet d'obtenir un nouveau `accessToken` sans redemander le mot de passe.
> C'est comme un pass journée + un pass semaine au festival.

---

### 📦 Où stocker les tokens ?

C'est une question **très importante** pour la sécurité. Voyons les options :

| Stockage | C'est quoi ? | Sécurité | Pratique ? |
| --- | --- | --- | --- |
| `localStorage` | Un espace de stockage dans le navigateur, qui persiste même si tu fermes l'onglet | ❌ Vulnérable au XSS (un script malveillant peut le lire) | ✅ Très facile à utiliser |
| `sessionStorage` | Pareil que localStorage, mais vidé quand tu fermes l'onglet | ❌ Vulnérable au XSS | ✅ Facile, limité à l'onglet |
| Cookie `HttpOnly` | Un cookie que le navigateur envoie automatiquement, **mais que JavaScript ne peut PAS lire** | ✅ Sûr (pas accessible par les scripts) | ❌ Plus complexe à mettre en place |
| Mémoire (variable JS) | Stocké dans une variable de ton app Vue | ✅ Sûr (pas dans le navigateur) | ❌ Perdu si tu rafraîchis la page (F5) |

> 💡 **Rappel — C'est quoi `localStorage` ?**
> C'est un petit espace de stockage dans ton navigateur. Tu peux y mettre des données :
> ```js
> // Sauvegarder une valeur
> localStorage.setItem('nom', 'Alice')   // on stocke 'Alice' sous la clé 'nom'
> // Lire une valeur
> localStorage.getItem('nom')             // retourne 'Alice'
> // Supprimer
> localStorage.removeItem('nom')
> ```
> Le problème : **n'importe quel script JavaScript** sur ta page peut lire localStorage.
> Si un pirate injecte du code malveillant (XSS), il peut voler ton token !

**Recommandation** : `accessToken` en mémoire (variable JS) + `refreshToken` en cookie HttpOnly.

---

## 🧩 Composable `useAuth`

> **Rappel — C'est quoi un composable ?**
> Un composable est une **fonction réutilisable** en Vue 3 qui encapsule de la logique.
> Le nom commence toujours par `use` (ex: `useAuth`, `useCounter`...).
> C'est comme une boîte à outils spécialisée que tu peux utiliser dans n'importe quel composant.

Voici un composable complet pour gérer l'authentification :

```ts
// composables/useAuth.ts
// Ce fichier contient TOUTE la logique de connexion / déconnexion

import { ref, computed, readonly } from 'vue'
// ref        → crée une variable réactive (Vue la surveille pour mettre à jour l'affichage)
// computed   → crée une valeur calculée qui se met à jour automatiquement
// readonly   → empêche la modification depuis l'extérieur

// ──────────────────────────────────────────────
// 1. On définit les TYPES (la forme des données)
// ──────────────────────────────────────────────

// Un utilisateur a un id, un nom, un email et un rôle
interface User {
  id: number         // Identifiant unique (ex: 42)
  name: string       // Nom affiché (ex: "Alice Dupont")
  email: string      // Email (ex: "alice@example.com")
  role: 'admin' | 'editor' | 'viewer'
  // Le rôle ne peut être QUE l'une de ces 3 valeurs
  // C'est un "union type" en TypeScript
}

// Les informations nécessaires pour se connecter
interface LoginCredentials {
  email: string      // L'email saisi par l'utilisateur
  password: string   // Le mot de passe saisi
}

// L'état de l'authentification = est-ce qu'on est connecté, et si oui, qui sommes-nous ?
interface AuthState {
  user: User | null          // L'utilisateur connecté, ou null si personne
  accessToken: string | null // Le token JWT, ou null si pas connecté
}

// ──────────────────────────────────────────────
// 2. L'état global (partagé entre tous les composants)
// ──────────────────────────────────────────────

// On déclare l'état EN DEHORS de la fonction useAuth()
// Comme ça, TOUS les composants qui appellent useAuth() partagent le MÊME état
// (c'est comme une variable globale, mais réactive)
const state = ref<AuthState>({
  user: null,         // Au départ, personne n'est connecté
  accessToken: null,  // Pas de token au départ
})

// ──────────────────────────────────────────────
// 3. La fonction composable elle-même
// ──────────────────────────────────────────────

export function useAuth() {

  // --- Valeurs calculées (computed) ---

  // Est-ce que quelqu'un est connecté ?
  // Si state.user n'est pas null → true, sinon → false
  const isAuthenticated = computed(() => state.value.user !== null)

  // L'utilisateur connecté (ou null)
  const user = computed(() => state.value.user)

  // Le rôle de l'utilisateur connecté (ou null)
  // Le "?." c'est l'optional chaining : si user est null, ça retourne undefined
  // Le "??" c'est le nullish coalescing : si la valeur avant est null/undefined, on prend celle après
  const role = computed(() => state.value.user?.role ?? null)

  // --- Fonction de connexion ---

  async function login(credentials: LoginCredentials): Promise<void> {
    // "async" signifie que cette fonction contient des opérations asynchrones
    // (qui prennent du temps, comme un appel réseau)

    // On envoie l'email et le mot de passe au serveur
    const response = await fetch('/api/auth/login', {
      method: 'POST',                                  // On ENVOIE des données (pas un GET)
      headers: { 'Content-Type': 'application/json' }, // On dit au serveur qu'on envoie du JSON
      credentials: 'include',                          // On envoie aussi les cookies existants
      body: JSON.stringify(credentials),                // On convertit l'objet JS en texte JSON
    })
    // "await" = on attend la réponse du serveur avant de continuer

    // Si le serveur répond une erreur (mauvais mot de passe, etc.)
    if (!response.ok) {
      const error = await response.json()     // On lit le message d'erreur
      throw new Error(error.message ?? 'Échec de connexion')
      // "throw" lance une erreur que le code appelant pourra attraper avec try/catch
    }

    // Si tout va bien, on lit les données renvoyées par le serveur
    const data = await response.json()

    // On met à jour l'état : l'utilisateur est maintenant connecté !
    state.value = {
      user: data.user,
      accessToken: data.accessToken,
    }
  }

  // --- Fonction de déconnexion ---

  async function logout(): Promise<void> {
    // On prévient le serveur qu'on se déconnecte
    // (pour qu'il invalide le refreshToken côté serveur)
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',  // Envoie les cookies (dont le refreshToken)
    })

    // On vide l'état local : plus personne n'est connecté
    state.value = { user: null, accessToken: null }
  }

  // --- Rafraîchir le token ---

  async function refreshToken(): Promise<boolean> {
    // Cette fonction demande un nouveau accessToken en utilisant le refreshToken
    // Elle retourne true si ça a marché, false sinon

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',  // Le refreshToken est dans le cookie HttpOnly
        // Le navigateur l'envoie automatiquement, on n'a pas besoin de le gérer nous-mêmes
      })

      if (!response.ok) return false  // Le refresh a échoué

      const data = await response.json()
      state.value.accessToken = data.accessToken  // On met à jour le token
      return true  // Succès !

    } catch {
      // En cas d'erreur réseau ou autre
      return false
    }
  }

  // --- Créer le header d'autorisation ---

  function getAuthHeader(): Record<string, string> {
    // Record<string, string> = un objet où les clés ET les valeurs sont des strings
    // Ex: { "Authorization": "Bearer abc123..." }

    if (!state.value.accessToken) return {}  // Pas de token → objet vide

    // On retourne le header que fetch enverra au serveur
    return { Authorization: `Bearer ${state.value.accessToken}` }
    // "Bearer" est une convention : ça veut dire "je te montre mon jeton"
  }

  // --- On retourne tout ce dont les composants ont besoin ---

  return {
    user: readonly(user),                    // L'utilisateur (lecture seule)
    role: readonly(role),                    // Le rôle (lecture seule)
    isAuthenticated: readonly(isAuthenticated), // Connecté ou pas (lecture seule)
    login,          // Fonction pour se connecter
    logout,         // Fonction pour se déconnecter
    refreshToken,   // Fonction pour rafraîchir le token
    getAuthHeader,  // Fonction pour obtenir le header d'autorisation
  }
  // "readonly" empêche les composants de modifier directement ces valeurs
  // Ils doivent passer par login() ou logout()
}
```

---

## 🔄 Intercepteur fetch avec refresh automatique

> **C'est quoi un intercepteur ?**
> C'est une fonction qui **intercepte** toutes tes requêtes réseau pour ajouter
> automatiquement le token, et qui gère le cas où le token a expiré.
> Tu n'as pas à y penser dans chaque composant !

```ts
// utils/authFetch.ts
// Cette fonction remplace "fetch" pour ajouter automatiquement l'authentification

import { useAuth } from '@/composables/useAuth'

export async function authFetch(
  url: string,                  // L'URL de l'API (ex: "/api/users")
  options: RequestInit = {},    // Les options de fetch (méthode, body, etc.)
): Promise<Response> {          // Retourne la réponse du serveur

  // On récupère les outils d'authentification
  const { getAuthHeader, refreshToken, logout } = useAuth()

  // On ajoute le token aux headers de la requête
  const headers = {
    ...options.headers,    // On garde les headers existants (... = spread operator = "étaler")
    ...getAuthHeader(),    // On ajoute le header Authorization
  }

  // On fait la requête
  let response = await fetch(url, { ...options, headers })
  // "let" et pas "const" car on pourrait avoir besoin de refaire la requête

  // Si le serveur répond 401 (Non autorisé) → le token a peut-être expiré
  if (response.status === 401) {

    // On essaie de rafraîchir le token
    const refreshed = await refreshToken()

    if (refreshed) {
      // Le refresh a marché ! On refait la requête avec le nouveau token
      const newHeaders = {
        ...options.headers,
        ...getAuthHeader(),  // Maintenant getAuthHeader() retourne le NOUVEAU token
      }
      response = await fetch(url, { ...options, headers: newHeaders })
    } else {
      // Le refresh a échoué → la session est vraiment expirée
      await logout()                        // On déconnecte l'utilisateur
      throw new Error('Session expirée')    // On signale l'erreur
    }
  }

  return response  // On retourne la réponse (que ce soit la 1ère ou la 2ème tentative)
}
```

> 💡 **Comment l'utiliser ?** Partout dans ton app, au lieu d'écrire `fetch(url)`,
> tu écris `authFetch(url)`. Le token est ajouté automatiquement !

---

## 🚧 Guards de navigation

> **C'est quoi un guard ?**
> Un **guard** (gardien) est une fonction qui s'exécute **avant** chaque changement de page.
> Il vérifie si l'utilisateur a le droit d'accéder à la page demandée.
> Si non → il le redirige (vers la page de login, par exemple).
>
> C'est comme un videur devant chaque porte de l'application !

```ts
// router/guards.ts

import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
// RouteLocationNormalized = le type d'une route (avec son path, ses params, ses meta...)
// NavigationGuardNext     = la fonction pour dire "OK, tu peux passer" ou "va ailleurs"

import { useAuth } from '@/composables/useAuth'

// ── Guard 1 : Vérifier que l'utilisateur est connecté ──

export function authGuard(
  to: RouteLocationNormalized,     // "to" = la page où l'utilisateur veut aller
  _from: RouteLocationNormalized,  // "_from" = la page d'où il vient (le _ signifie qu'on ne l'utilise pas)
  next: NavigationGuardNext,       // "next" = la fonction pour continuer ou rediriger
): void {

  const { isAuthenticated } = useAuth()  // Est-ce qu'on est connecté ?

  // Si la page demande une connexion ET que l'utilisateur n'est PAS connecté
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    // On redirige vers la page de login
    // On garde l'URL originale dans "redirect" pour y revenir après connexion
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    // Sinon, tout va bien, on laisse passer
    next()
  }
}

// ── Guard 2 : Vérifier le rôle de l'utilisateur ──

export function roleGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
): void {

  const { role } = useAuth()
  // On récupère le rôle requis depuis les "meta" de la route
  const requiredRole = to.meta.requiredRole as string | undefined

  // Si un rôle est requis ET que l'utilisateur n'a pas ce rôle
  if (requiredRole && role.value !== requiredRole) {
    next({ name: 'forbidden' })  // Page "Accès interdit"
  } else {
    next()  // OK, tu peux passer
  }
}
```

### Configurer les routes avec les guards

```ts
// router/index.ts

const routes = [
  // La page de login → accessible à tous, pas de guard
  { path: '/login', name: 'login', component: LoginPage },

  {
    path: '/dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },  // Il faut être connecté
    // "meta" = des informations supplémentaires attachées à la route
    // Tu peux y mettre ce que tu veux !
  },

  {
    path: '/admin',
    component: AdminPanel,
    meta: {
      requiresAuth: true,        // Il faut être connecté
      requiredRole: 'admin',     // ET il faut être admin
    },
  },
]

// On active les guards pour TOUTES les routes
router.beforeEach(authGuard)    // D'abord : on vérifie la connexion
router.beforeEach(roleGuard)    // Ensuite : on vérifie le rôle
// "beforeEach" = "avant chaque changement de route"
```

---

## 🏷️ Typage des routes meta

> **Rappel — C'est quoi `declare module` ?**
> C'est un moyen d'**ajouter des types** à une librairie existante (ici vue-router).
> On dit à TypeScript : « Hé, les meta des routes peuvent aussi contenir ces champs ! »
> Comme ça, TypeScript nous aide avec l'autocomplétion et la vérification.

```ts
// router/types.ts
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean                        // Est-ce que la connexion est requise ?
    requiredRole?: 'admin' | 'editor' | 'viewer'  // Quel rôle est nécessaire ?
    title?: string                                 // Titre de la page (optionnel)
  }
  // Le "?" après chaque nom veut dire que le champ est OPTIONNEL
  // (pas toutes les routes ont besoin de ces infos)
}
```

---

## 📝 Résumé

| Concept | En une phrase |
| --- | --- |
| **Authentification** | Prouver qui tu es (email + mot de passe) |
| **Autorisation** | Vérifier tes droits (rôle admin, editor...) |
| **JWT** | Un bracelet signé que tu montres à chaque requête |
| **accessToken** | Token de courte durée (~15 min) pour accéder à l'API |
| **refreshToken** | Token de longue durée (~7 jours) pour renouveler l'accessToken |
| **Composable useAuth** | Toute la logique auth centralisée, réutilisable partout |
| **Guard** | Un videur qui vérifie tes droits avant chaque changement de page |

---

## 🎯 Pratique

### Exercice AUTH.1 — Composable useAuth

Complète ce composable d'authentification :

```ts
export function useAuth() {
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => ???)
  
  async function login(email: string, password: string) {
    const response = await fetch('/api/login', {
      method: '???',
      headers: { 'Content-Type': 'application/json' },
      body: ???
    })
    const data = await response.json()
    user.value = ???
  }
  
  function logout() {
    ???
  }
  
  return { user, isAuthenticated, login, logout }
}
```

<details>
<summary>Solution</summary>

```ts
export function useAuth() {
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => !!user.value)
  
  async function login(email: string, password: string) {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await response.json()
    user.value = data.user
  }
  
  function logout() {
    user.value = null
  }
  
  return { user, isAuthenticated, login, logout }
}
```
</details>

---

### Exercice AUTH.2 — Guard de route

Crée un guard qui redirige vers /login si non connecté :

```ts
router.beforeEach((to, from) => {
  const { isAuthenticated } = useAuth()
  
  if (to.meta.requiresAuth && ???) {
    return ???
  }
})
```

<details>
<summary>Solution</summary>

```ts
router.beforeEach((to, from) => {
  const { isAuthenticated } = useAuth()
  
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})
```
</details>

---

### Exercice AUTH.3 — Refresh token

Où stocker chaque token et pourquoi ?

- accessToken : ???
- refreshToken : ???

<details>
<summary>Solution</summary>

- **accessToken** : En **mémoire** (ref/state) → courte durée, disparaît au refresh de page, inaccessible aux scripts malveillants
- **refreshToken** : En **cookie HttpOnly** → inaccessible au JavaScript, envoyé automatiquement par le navigateur, protégé contre XSS
</details>

---

## Suite

→ `cours/11-auth-securite/02-securite-front.md`
