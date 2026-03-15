# 03 — Architecture front-end : bien organiser son code

> **Niveau** : Avancé — Ce chapitre aborde des sujets d'organisation de projet.
> Si tu débutes, lis-le une première fois pour comprendre les idées générales,
> puis reviens-y quand tu travailleras sur un vrai projet. C'est tout à fait normal
> de ne pas tout retenir du premier coup !

---

> **🔄 Rappel du cours précédent**
> Avant de continuer, vérifie que tu peux répondre à ces questions :
> 1. Quelle est la différence entre SSR (Server-Side Rendering) et CSR (Client-Side Rendering) ?
> 2. Qu'est-ce que l'hydration dans le contexte du SSR ?
> 
> <details>
> <summary>Vérifier mes réponses</summary>
>
> 1. SSR : le serveur génère le HTML complet. CSR : le navigateur construit la page via JavaScript
> 2. L'hydration "réactive" le HTML statique envoyé par le serveur en attachant les event listeners Vue
> </details>

---

## C'est quoi, l'« architecture » d'un projet ?

### 🏠 L'analogie de la maison

Imagine que tu construis une maison. Tu ne mets pas la cuisine dans la salle de bain,
le lit dans le garage, et la douche dans le salon. **Chaque pièce à un rôle précis**,
et tu sais toujours ou trouver ce que tu cherches.

L'**architecture** d'un projet, c'est exactement ça : **la façon dont tu organises
tes fichiers et tes dossiers** pour que tout le monde (toi inclus dans 6 mois !)
sache ou trouver quoi.

```
🏠 Une maison bien organisée :
├── 🍳 Cuisine        → on prépare les repas
├── 🛋️ Salon          → on se détend, on reçoit
├── 🛏️ Chambre        → on dort
├── 🚿 Salle de bain  → on se lave
└── 📦 Garage         → on stocke les outils

💻 Un projet bien organisé :
├── 📂 components/    → les morceaux d'interface (boutons, cartes, menus…)
├── 📂 composables/   → la logique réutilisable
├── 📂 services/      → les appels au serveur (API)
├── 📂 stores/        → les données partagées dans l'app
├── 📂 types/         → les définitions TypeScript
└── 📂 views/         → les pages complètes
```

### Pourquoi c'est important ?

Sans organisation :
- Tu perds du temps à chercher tes fichiers
- Tu ne sais plus quel fichier fait quoi
- Les autres développeurs ne comprennent pas ton projet
- Ton code devient un plat de spaghettis 🍝

---

## La séparation des responsabilités (separation of concerns)

### 🍽️ L'analogie du restaurant

Dans un **restaurant bien organisé**, chaque personne a UN rôle :

| Personne           | Rôle                          | Equivalent dans le code       |
| ------------------ | ----------------------------- | ----------------------------- |
| 👨‍🍳 Le chef           | Prépare les plats             | **Service** (logique métier)  |
| 🍽️ Le serveur        | Présente les plats aux clients | **Composant Vue** (affichage) |
| 📋 Le maître d'hôtel | Organise la salle, gère le flux | **Store** (gestion des données) |
| 🧹 Le plongeur       | Nettoie, prépare les outils   | **Utils** (fonctions utilitaires) |
| 📖 Le menu           | Décrit ce qui est disponible   | **Types** (définitions TypeScript) |

Le serveur ne fait pas la cuisine. Le chef ne sert pas les tables.
**Chaque fichier dans ton code devrait avoir UN seul travail.**

> **Règle d'or** : si tu dois décrire ce que fait un fichier et que tu utilises
> le mot "ET" ("ce fichier affiche la liste ET appelle l'API ET gère le cache"),
> c'est qu'il fait trop de choses. Il faut le découper.

---

## Étape 1 : Organisation simple (petits projets)

Quand ton projet est petit (5-10 composants), une structure plate suffit :

```
src/
├── components/          ← Tous les composants visuels
│   ├── AppButton.vue    ← Un bouton réutilisable
│   ├── AppHeader.vue    ← L'en-tête du site
│   └── ProductCard.vue  ← Une carte produit
├── composables/         ← Logique réutilisable
│   └── useProducts.ts   ← Logique liée aux produits
├── views/               ← Les pages (une par route/URL)
│   ├── HomePage.vue     ← La page d'accueil
│   └── ProductPage.vue  ← La page produit
├── App.vue              ← Le composant racine (le "conteneur" de l'app)
└── main.ts              ← Le point d'entrée (là où l'app démarre)
```

C'est simple, c'est clair, et c'est **largement suffisant** pour débuter.
Pas besoin de sur-organiser un petit projet !

---

## Étape 2 : Organisation par feature (projets moyens à gros)

Quand ton projet grandit (20+ composants), il vaut mieux regrouper les fichiers
**par fonctionnalité** plutôt que par type.

### Le problème de l'organisation "par type"

```
# ❌ Quand le projet grandit, c'est le bazar :
components/
├── LoginForm.vue
├── RegisterForm.vue
├── ProductCard.vue          ← 30 fichiers mélangés,
├── ProductFilters.vue          impossible de s'y retrouver !
├── CartItem.vue
├── CartSummary.vue
└── ... (encore 25 fichiers)
```

### La solution : regrouper par feature

```
# ✅ Chaque "feature" (fonctionnalité) a son propre dossier :
src/
  features/
    auth/                      ← Tout ce qui concerne la connexion
      components/
        LoginForm.vue          ← Formulaire de connexion
        RegisterForm.vue       ← Formulaire d'inscription
      composables/
        useAuth.ts             ← Logique de connexion/déconnexion
      stores/
        auth.ts                ← Données de l'utilisateur connecté
      views/
        LoginPage.vue          ← Page de connexion
      types.ts                 ← Types liés à l'authentification
      routes.ts                ← Routes (URLs) pour cette feature

    products/                  ← Tout ce qui concerne les produits
      components/
        ProductCard.vue        ← Carte d'un produit
        ProductFilters.vue     ← Filtres pour chercher un produit
      composables/
        useProducts.ts         ← Logique pour charger les produits
        useProductFilters.ts   ← Logique des filtres
      stores/
        products.ts            ← Liste des produits en mémoire
      views/
        ProductListPage.vue    ← Page qui liste tous les produits
        ProductDetailPage.vue  ← Page d'un seul produit
      types.ts                 ← Types liés aux produits
      routes.ts                ← Routes pour cette feature

  shared/                      ← Code partagé entre TOUTES les features
    components/
      AppButton.vue            ← Bouton réutilisable partout
      AppInput.vue             ← Champ de saisie réutilisable
      DataTable.vue            ← Tableau de données réutilisable
    composables/
      useDebounce.ts           ← Utilitaire : attendre avant d'agir
      usePagination.ts         ← Utilitaire : pagination de listes
    utils/
      validators.ts            ← Fonctions de validation (email, etc.)
      formatters.ts            ← Fonctions de formatage (dates, prix…)
    types/
      common.ts               ← Types utilisés partout

  router/
    index.ts                   ← Regroupe toutes les routes
  App.vue                      ← Composant racine
  main.ts                      ← Point d'entrée
```

### Les règles de cette organisation

1. **Chaque feature est autonome** : elle a ses composants, ses composables, son store, ses types, ses routes
2. **`shared/` pour le code partagé** : les composants génériques, les utilitaires
3. **Pas d'import entre features** : `auth/` n'importe jamais directement depuis `products/`. Si les deux ont besoin de la même chose, on la met dans `shared/`
4. **Les routes sont déclarées par feature** et rassemblées dans `router/index.ts`

---

## Les routes par feature

### 📝 Rappel : c'est quoi une route ?

Une **route**, c'est le lien entre une **URL** et un **composant page**.
Quand tu vas sur `/login`, Vue affiche le composant `LoginPage.vue`.

### Déclarer les routes dans chaque feature

```ts
// features/auth/routes.ts
// Ce fichier déclare les routes (URLs) pour tout ce qui concerne l'authentification

import type { RouteRecordRaw } from 'vue-router'
// RouteRecordRaw = le type TypeScript pour décrire une route

export const authRoutes: RouteRecordRaw[] = [
  // On exporte un tableau (array) de routes

  {
    path: '/login',            // L'URL dans le navigateur
    name: 'login',             // Un nom unique pour cette route
    component: () => import('./views/LoginPage.vue'),
    // ↑ On charge le composant uniquement quand l'utilisateur va sur /login
    //   (c'est du "lazy loading" = chargement paresseux)
  },
  {
    path: '/register',         // L'URL pour s'inscrire
    name: 'register',
    component: () => import('./views/RegisterPage.vue'),
  },
]
```

### Rassembler toutes les routes

```ts
// router/index.ts
// Ce fichier combine TOUTES les routes de TOUTES les features

import { authRoutes } from '@/features/auth/routes'
// On importe les routes de la feature "auth"

import { productRoutes } from '@/features/products/routes'
// On importe les routes de la feature "products"

const routes: RouteRecordRaw[] = [
  ...authRoutes,
  // ↑ L'opérateur "..." (spread) "étale" le tableau authRoutes ici
  //   C'est comme si on copiait chaque route une par une

  ...productRoutes,
  // Pareil pour les routes produits

  {
    path: '/:pathMatch(.*)*',  // Toute URL qui ne correspond à rien
    name: 'not-found',
    component: NotFound,       // On affiche une page "404 non trouvé"
  },
]
```

> **Avantage** : chaque équipe peut travailler sur ses routes sans créer de conflits.

---

## Les couches d'abstraction (les "étages" de ton code)

### 🏢 L'analogie de l'immeuble

Pense à un immeuble de bureaux :

```
🏢 Étage 4 — Vue (composants)     ← Ce que l'utilisateur VOIT (l'interface)
      ↓
🏢 Étage 3 — Composables          ← La logique RÉACTIVE (ref, computed…)
      ↓
🏢 Étage 2 — Services             ← Les appels au serveur (API)
      ↓
🏢 Étage 1 — Types                ← Les "contrats" (définitions TypeScript)
```

**Chaque étage ne communique qu'avec l'étage juste en dessous.**
Un composant n'appelle pas directement l'API : il passe par un composable,
qui lui-même utilise un service.

### Le Service : celui qui parle au serveur

```ts
// services/productService.ts
// Ce fichier contient UNIQUEMENT les appels au serveur pour les produits.
// Il ne sait RIEN de Vue, des ref, des composants, etc.

import type { Product, CreateProductDto } from '@/features/products/types'
// On importe les types pour savoir à quoi ressemble un "Product"

const BASE_URL = '/api/products'
// L'adresse de base de l'API sur le serveur

export const productService = {
  // On exporte un objet avec des méthodes

  // --- Récupérer TOUS les produits ---
  async getAll(): Promise<Product[]> {
    // async = cette fonction fait quelque chose qui prend du temps (appel réseau)
    // Promise<Product[]> = elle retournera un tableau de produits... plus tard

    const res = await fetch(BASE_URL)
    // fetch() = envoie une requête HTTP au serveur
    // await = on attend la réponse avant de continuer

    if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`)
    // Si le serveur répond avec une erreur (404, 500…), on lance une exception

    return res.json()
    // On convertit la réponse en données JavaScript (JSON → objet)
  },

  // --- Récupérer UN produit par son identifiant ---
  async getById(id: number): Promise<Product> {
    const res = await fetch(`${BASE_URL}/${id}`)
    // Ex: si id = 42, on appelle "/api/products/42"

    if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`)
    return res.json()
  },

  // --- Créer un nouveau produit ---
  async create(dto: CreateProductDto): Promise<Product> {
    // dto = "Data Transfer Object", les données envoyées au serveur

    const res = await fetch(BASE_URL, {
      method: 'POST',                                // POST = créer quelque chose
      headers: { 'Content-Type': 'application/json' }, // On dit qu'on envoie du JSON
      body: JSON.stringify(dto),                      // On convertit l'objet en texte JSON
    })

    if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`)
    return res.json()
    // Le serveur nous renvoie le produit créé (avec son id)
  },
}
```

### Le Composable : il ajoute la réactivité Vue

```ts
// composables/useProducts.ts
// Ce composable utilise le service ET ajoute la réactivité de Vue (ref, computed)

import { productService } from '@/services/productService'
// On importe le service qui sait appeler l'API

export function useProducts() {
  // On utilise un helper pour gérer l'appel asynchrone
  const { data, error, status, execute } = useAsyncData(
    () => productService.getAll()
    //   ↑ On dit "la donnée à charger, c'est TOUS les produits"
  )

  return {
    products: data,
    // ↑ La liste des produits (c'est un ref, donc réactif !)

    error,
    // ↑ L'erreur s'il y en a une (null sinon)

    isLoading: computed(() => status.value === 'loading'),
    // ↑ true quand les données sont en cours de chargement

    refresh: execute,
    // ↑ Une fonction pour recharger les données
  }
}
```

> **Pourquoi séparer service et composable ?**
>
> - Le **service** est du JavaScript pur → facile à tester sans monter de composant Vue
> - Le **composable** ajoute la couche Vue (ref, computed) → utilisable dans les composants
> - Si tu changes la façon d'appeler l'API, tu ne modifies QUE le service

---

## Les barrel files (fichiers "index.ts")

### 📝 Rappel JavaScript : les exports et imports

```ts
// Quand un fichier exporte quelque chose :
export function useProducts() { /* ... */ }

// Un autre fichier peut l'importer :
import { useProducts } from './composables/useProducts'
```

### Le problème : des imports à rallonge

```ts
// ❌ Sans barrel file, les imports sont très longs :
import { useProducts } from '@/features/products/composables/useProducts'
import { useProductFilters } from '@/features/products/composables/useProductFilters'
import type { Product } from '@/features/products/types'
// → 3 imports verbeux juste pour une feature !
```

### La solution : un fichier index.ts qui "ré-exporte" tout

Un **barrel file**, c'est un fichier `index.ts` qui **centralise les exports**
d'un dossier. C'est comme un **sommaire** à l'entrée d'un dossier.

```ts
// features/products/index.ts (le "barrel file")
// Ce fichier ne contient PAS de logique.
// Il dit juste : "voici ce que cette feature met à disposition"

export { useProducts } from './composables/useProducts'
// On ré-exporte useProducts

export { useProductFilters } from './composables/useProductFilters'
// On ré-exporte useProductFilters

export type { Product, CreateProductDto } from './types'
// On ré-exporte les types
```

```ts
// ✅ Avec le barrel file, les imports deviennent courts :
import { useProducts, useProductFilters } from '@/features/products'
import type { Product } from '@/features/products'
// → Beaucoup plus lisible !
```

> **Note** : les barrel files sont optionnels. C'est une convention courante dans
> les gros projets, mais pas obligatoire pour démarrer.

---

## Les conventions de nommage

Quand on travaille en équipe, il faut que tout le monde nomme les choses
**de la même façon**. Voici les conventions les plus courantes en Vue :

| Élément            | Convention                  | Exemple                       | Pourquoi ?                        |
| ------------------ | --------------------------- | ----------------------------- | --------------------------------- |
| Composant          | PascalCase                  | `ProductCard.vue`             | Norme Vue officielle              |
| Composable         | camelCase + `use`           | `useProducts.ts`              | Le `use` indique "composable"     |
| Store              | camelCase + `use` + `Store` | `useProductStore`             | On sait que c'est un store        |
| Type / Interface   | PascalCase                  | `Product`, `CreateProductDto` | Convention TypeScript              |
| Constante          | SCREAMING_SNAKE_CASE        | `MAX_RETRY_COUNT`             | Les MAJUSCULES = "ne pas modifier"|
| Fichier utilitaire | camelCase                   | `formatters.ts`               | Simple et lisible                 |

### 📝 Rappel : c'est quoi PascalCase et camelCase ?

```
PascalCase  → ChaqueMot commence par une Majuscule     → ProductCard
camelCase   → lePremierMot est en minuscule             → useProducts
SCREAMING_SNAKE_CASE → TOUT_EN_MAJUSCULES_AVEC_DES_TIRETS_BAS → MAX_RETRY
```

---

## Quand découper ? Les signaux d'alerte 🚨

Voici des indicateurs que ton code a besoin d'être réorganisé :

| Signal d'alerte 🚨                           | Que faire ?                                  |
| --------------------------------------------- | -------------------------------------------- |
| Un composant dépasse 300 lignes               | Le découper en sous-composants               |
| Un composable dépasse 200 lignes              | Extraire des sous-fonctions                  |
| Un store gère 2 sujets différents             | Le séparer en 2 stores                       |
| Un import "circulaire" (A importe B qui importe A) | Réorganiser immédiatement                |
| Tu utilises `any` à la place d'un vrai type   | Définir le bon type TypeScript               |
| Un composant critique n'a pas de test          | Ajouter un test                              |

> **Ne t'inquiète pas** : ces signaux d'alerte, tu apprendras à les détecter
> avec l'expérience. Au début, concentre-toi sur la lisibilité de ton code.

---

## 📝 Résumé

1. **Architecture = organisation**, comme les pièces d'une maison
2. **Séparation des responsabilités** : chaque fichier a UN seul travail (comme dans un restaurant)
3. **Petit projet** → structure simple (components/, views/, composables/)
4. **Gros projet** → organisation par feature (auth/, products/, shared/)
5. **Couches** : Composants → Composables → Services → Types
6. **Barrel files** (index.ts) : un "sommaire" pour simplifier les imports
7. **Conventions de nommage** : PascalCase pour les composants, camelCase + `use` pour les composables

---

## 🎯 Pratique

### Exercice ARCH.1 — Organiser les fichiers

Ou placerais-tu ces fichiers dans une architecture par feature ?

1. `LoginForm.vue` — Formulaire de connexion
2. `useAuth.ts` — Composable d'authentification
3. `Button.vue` — Bouton réutilisable partout
4. `authService.ts` — Appels API pour l'auth
5. `User.ts` — Type TypeScript pour un utilisateur

<details>
<summary>Solution</summary>

```
src/
  features/
    auth/
      components/
        LoginForm.vue      ← 1
      composables/
        useAuth.ts         ← 2
      services/
        authService.ts     ← 4
      types/
        User.ts            ← 5
  shared/
    components/
      Button.vue           ← 3 (réutilisable = shared)
```
</details>

---

### Exercice ARCH.2 — Barrel file

Crée un barrel file (index.ts) pour ce dossier :

```
composables/
  useCounter.ts
  useToggle.ts
  useLocalStorage.ts
```

<details>
<summary>Solution</summary>

```ts
// composables/index.ts
export { useCounter } from './useCounter'
export { useToggle } from './useToggle'
export { useLocalStorage } from './useLocalStorage'
```

Utilisation :
```ts
// Au lieu de 3 imports séparés
import { useCounter, useToggle, useLocalStorage } from '@/composables'
```
</details>

---

### Exercice ARCH.3 — Séparation des responsabilités

Ce composant fait trop de choses. Identifie ce qu'il faut extraire :

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const users = ref<User[]>([])
const isLoading = ref(false)
const search = ref('')

async function fetchUsers() {
  isLoading.value = true
  const res = await fetch('/api/users')
  users.value = await res.json()
  isLoading.value = false
}

const filteredUsers = computed(() =>
  users.value.filter(u => u.name.includes(search.value))
)

onMounted(fetchUsers)
</script>
```

<details>
<summary>Solution</summary>

Extraire :
1. **Service** : `userService.ts` → `fetchUsers()`
2. **Composable** : `useUsers.ts` → logique de chargement + filtre

```ts
// services/userService.ts
export async function getUsers(): Promise<User[]> {
  const res = await fetch('/api/users')
  return res.json()
}

// composables/useUsers.ts
export function useUsers() {
  const users = ref<User[]>([])
  const isLoading = ref(false)
  const search = ref('')

  const filteredUsers = computed(() =>
    users.value.filter(u => u.name.includes(search.value))
  )

  async function load() {
    isLoading.value = true
    users.value = await getUsers()
    isLoading.value = false
  }

  return { users, filteredUsers, isLoading, search, load }
}
```

Le composant devient :
```vue
<script setup lang="ts">
import { useUsers } from '@/composables/useUsers'
import { onMounted } from 'vue'

const { filteredUsers, isLoading, search, load } = useUsers()
onMounted(load)
</script>
```
</details>

---

## Suite

→ `cours/04-expert/04-patterns-entreprise.md`
