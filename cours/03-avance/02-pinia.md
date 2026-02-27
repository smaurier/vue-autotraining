# 02 — Pinia (state management)

> **Le tableau blanc partagé de votre application** — Pinia permet à tous les composants
> d'accéder aux mêmes données, sans se les passer de main en main.

---

## C'est quoi le "state management" ?

Imagine une **colocation** de 5 personnes. Chacun est un composant Vue.

**Sans state management :** Si Alice (composant A) veut dire à Eve (composant E) qu'il n'y a
plus de lait, elle doit passer le message à Bob, qui le passe à Charlie, qui le passe à Diana,
qui le passe enfin à Eve. C'est le cauchemar du **"prop drilling"** — passer des props à
travers 5 niveaux de composants.

**Avec state management (Pinia) :** On met un **tableau blanc dans la cuisine** (le "store").
Alice écrit "plus de lait" dessus, et TOUT LE MONDE peut le voir instantanément.

```
Sans Pinia (prop drilling) :          Avec Pinia (store partagé) :

  App                                   App
  └── Parent                            └── Parent
      ├── Enfant A (a l'info)               ├── Enfant A ──┐
      │   └── Petit-enfant                  │               │ STORE
      │       └── Arrière-petit-enfant      └── Enfant B ──┘ (tableau blanc)
      └── Enfant B (veut l'info 😩)

      L'info doit descendre               Tout le monde lit/écrit
      de composant en composant            directement dans le store
```

---

## Quand utiliser un store ?

| Type de données                  | Où les mettre ?           | Analogie                                |
| -------------------------------- | ------------------------- | --------------------------------------- |
| Locales à 1 seul composant      | `ref` / `reactive`        | Un post-it sur TON bureau               |
| Partagées parent ↔ enfant       | `props` / `emits`         | Parler directement à ton voisin         |
| Partagées entre "frères"        | **Store Pinia**           | Le tableau blanc de la cuisine          |
| Globales (auth, thème, langue)  | **Store Pinia**           | L'affiche dans le hall d'entrée         |

**Règle simple :** Si 2+ composants qui ne sont pas parent/enfant direct ont besoin
de la même donnée → utilise un store Pinia.

---

## Installation

```bash
# On installe Pinia
pnpm add pinia
```

```ts
// main.ts — On branche Pinia à l'application

import { createApp } from 'vue'       // Pour créer l'appli Vue
import { createPinia } from 'pinia'    // Pour créer l'instance Pinia
import App from './App.vue'            // Le composant racine

const app = createApp(App)
app.use(createPinia())   // "Hé l'appli, utilise Pinia pour gérer les stores !"
app.mount('#app')        // On affiche l'appli
```

---

## 📝 Rappel JavaScript — `import` et `export`

Avant de créer un store, rappelons comment fonctionne le partage de code entre fichiers :

```ts
// fichier-a.ts — On EXPORTE (on rend disponible) une fonction
export function direBonjour() {   // export = "je partage ça avec les autres fichiers"
  return 'Bonjour !'
}

// fichier-b.ts — On IMPORTE (on récupère) la fonction
import { direBonjour } from './fichier-a'  // import = "je prends ça d'un autre fichier"
console.log(direBonjour())  // "Bonjour !"
```

C'est exactement ce qu'on fera avec les stores : on les EXPORTE depuis un fichier,
et on les IMPORTE dans les composants qui en ont besoin.

---

## L'analogie du restaurant 🍽️

Pour comprendre un store Pinia, imagine un **restaurant** :

| Concept Pinia | Dans le restaurant                      | Explication                                          |
| ------------- | --------------------------------------- | ---------------------------------------------------- |
| **State**     | Les **ingrédients dans le frigo**       | Les données brutes stockées (nombre d'articles, utilisateur connecté...) |
| **Getters**   | Le **menu** (ce qu'on peut commander)   | Des valeurs calculées à partir du state (total du panier, nom complet...) |
| **Actions**   | Le **chef qui cuisine**                 | Des fonctions qui modifient le state (ajouter au panier, se connecter...) |

- Le **frigo** (state) contient les ingrédients bruts
- Le **menu** (getters) les présente de manière utile ("salade composée" = prénom + nom)
- Le **chef** (actions) transforme les ingrédients (ajouter un plat, retirer un ingrédient)

---

## Premier store — Le plus simple possible

Commençons par un store ultra-basique : un **compteur**.

```ts
// stores/counter.ts — Notre premier store Pinia

import { defineStore } from 'pinia'       // La fonction pour créer un store
import { ref, computed } from 'vue'        // ref = variable réactive, computed = valeur calculée

// defineStore crée un store. On lui donne :
// 1. Un nom unique : 'counter' (comme un identifiant)
// 2. Une fonction qui retourne le state, les getters et les actions
export const useCounterStore = defineStore('counter', () => {

  // ========================
  // 🧊 STATE (le frigo)
  // Les données brutes du store
  // ========================
  const count = ref<number>(0)   // Un compteur qui commence à 0
                                  // ref<number> = "c'est une variable réactive de type nombre"

  // ========================
  // 📋 GETTERS (le menu)
  // Des valeurs calculées à partir du state
  // ========================
  const double = computed(() => count.value * 2)      // Le double du compteur
  const isPositive = computed(() => count.value > 0)   // Est-ce que le compteur est positif ?

  // ========================
  // 👨‍🍳 ACTIONS (le chef)
  // Des fonctions qui modifient le state
  // ========================
  function increment(): void {   // void = cette fonction ne retourne rien
    count.value++                // On augmente le compteur de 1
  }

  function decrement(): void {
    count.value--                // On diminue le compteur de 1
  }

  function reset(): void {
    count.value = 0              // On remet le compteur à zéro
  }

  // IMPORTANT : on doit RETOURNER tout ce qu'on veut rendre accessible
  // Si on oublie de retourner quelque chose, les composants ne pourront pas y accéder
  return { count, double, isPositive, increment, decrement, reset }
})
```

### Utiliser le store dans un composant

```vue
<!-- MonComposant.vue — On utilise le store compteur -->
<script setup lang="ts">
// On importe le store (comme n'importe quelle fonction)
import { useCounterStore } from '@/stores/counter'

// On "ouvre" le store — maintenant on a accès à tout ce qu'il contient
const counter = useCounterStore()
// counter.count     → le state (la valeur du compteur)
// counter.double    → un getter (le double)
// counter.increment → une action (une fonction)
</script>

<template>
  <!-- On accède aux données du store avec counter.xxx -->
  <p>Compteur : {{ counter.count }}</p>
  <p>Le double : {{ counter.double }}</p>

  <!-- On appelle les actions avec @click -->
  <button @click="counter.increment">+ 1</button>
  <button @click="counter.decrement">- 1</button>
  <button @click="counter.reset">Remettre à zéro</button>
</template>
```

> **Le plus important :** N'importe quel autre composant peut faire la même chose.
> Si `ComposantA` appelle `counter.increment()`, le compteur change et `ComposantB`
> voit le changement instantanément. C'est ça la magie du store partagé !

---

## Store concret — Authentification

Voici un store plus réaliste : gérer la connexion d'un utilisateur.

```ts
// stores/auth.ts — Store pour gérer l'authentification

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// On définit le TYPE d'un utilisateur avec TypeScript
// C'est comme dire "un utilisateur a obligatoirement ces propriétés"
interface User {
  id: number              // Un identifiant unique (ex: 42)
  name: string            // Son nom (ex: "Alice")
  email: string           // Son email (ex: "alice@mail.com")
  role: 'admin' | 'user'  // Son rôle : soit "admin", soit "user" (rien d'autre)
}

export const useAuthStore = defineStore('auth', () => {

  // 🧊 STATE
  // L'utilisateur connecté (null = personne n'est connecté)
  const user = ref<User | null>(null)
  // Le token d'authentification (un code secret qui prouve qu'on est connecté)
  // On essaie d'abord de le récupérer du localStorage (stockage du navigateur)
  // pour rester connecté même après avoir fermé l'onglet
  const token = ref<string | null>(localStorage.getItem('token'))

  // 📋 GETTERS
  // Est-ce que quelqu'un est connecté ? (true si on a un token)
  const isAuthenticated = computed(() => !!token.value)
  // Est-ce que c'est un admin ? (le ?. évite une erreur si user est null)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // 👨‍🍳 ACTIONS

  // Se connecter : on envoie l'email et le mot de passe au serveur
  async function login(email: string, password: string): Promise<void> {
    // fetch = fonction JavaScript pour appeler une API (un serveur)
    const response = await fetch('/api/login', {
      method: 'POST',                                    // POST = envoyer des données
      body: JSON.stringify({ email, password }),          // On convertit l'objet en texte JSON
      headers: { 'Content-Type': 'application/json' },   // On dit au serveur "c'est du JSON"
    })

    // Si la réponse n'est pas OK (ex: mauvais mot de passe), on lance une erreur
    if (!response.ok) throw new Error('Identifiants invalides')

    // On récupère les données renvoyées par le serveur
    const data = await response.json()

    // On stocke le token et l'utilisateur dans le state
    token.value = data.token
    user.value = data.user

    // On sauvegarde aussi le token dans le localStorage
    // pour rester connecté si on recharge la page
    localStorage.setItem('token', data.token)
  }

  // Se déconnecter : on efface tout
  function logout(): void {
    user.value = null                    // Plus d'utilisateur
    token.value = null                   // Plus de token
    localStorage.removeItem('token')     // On efface aussi du localStorage
  }

  // Récupérer le profil de l'utilisateur connecté
  async function fetchProfile(): Promise<void> {
    if (!token.value) return   // Pas de token ? On ne fait rien

    const response = await fetch('/api/me', {
      // On envoie le token dans les en-têtes pour prouver qu'on est connecté
      headers: { Authorization: `Bearer ${token.value}` },
    })

    if (response.ok) {
      user.value = await response.json()   // On met à jour les infos utilisateur
    } else {
      logout()   // Token invalide ? On déconnecte
    }
  }

  return { user, token, isAuthenticated, isAdmin, login, logout, fetchProfile }
})
```

### Utiliser le store auth dans un composant

```vue
<!-- NavBar.vue — La barre de navigation -->
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <!-- Si l'utilisateur est connecté, on affiche son nom et un bouton déconnexion -->
  <div v-if="auth.isAuthenticated">
    <span>Bonjour {{ auth.user?.name }} !</span>
    <button @click="auth.logout">Se déconnecter</button>
  </div>

  <!-- Sinon, on affiche un lien vers la page de connexion -->
  <div v-else>
    <RouterLink to="/login">Se connecter</RouterLink>
  </div>
</template>
```

---

## ⚠️ Piège courant — La déstructuration qui casse la réactivité

### 📝 Rappel JavaScript — La déstructuration

La **déstructuration**, c'est un raccourci pour extraire des valeurs d'un objet :

```ts
const personne = { nom: 'Alice', age: 30 }

// Sans déstructuration :
const nom = personne.nom   // "Alice"
const age = personne.age   // 30

// Avec déstructuration (raccourci) :
const { nom, age } = personne   // Fait la même chose en une seule ligne !
```

### Le problème avec Pinia

Quand on déstructure un store, les valeurs de **state** et les **getters** perdent leur
réactivité (elles ne se mettent plus à jour automatiquement). Les **actions** (fonctions)
ne sont pas concernées.

```ts
import { storeToRefs } from 'pinia'       // L'outil pour résoudre le problème
import { useCounterStore } from '@/stores/counter'

const store = useCounterStore()

// ❌ MAUVAIS — count et double ne sont plus réactifs !
// Ce sont de simples copies figées, elles ne se mettront jamais à jour
const { count, double } = store

// ✅ BON — storeToRefs garde la réactivité du state et des getters
const { count, double } = storeToRefs(store)

// Les ACTIONS (fonctions) ne sont PAS des refs
// On les déstructure directement du store, pas besoin de storeToRefs
const { increment, decrement } = store
```

> **Règle à retenir :**
> - State + Getters → `storeToRefs(store)`
> - Actions → directement depuis `store`

---

## Store avancé — CRUD générique (bonus)

Pour les curieux, voici comment créer une **fabrique de stores** réutilisable.
C'est une fonction qui crée un store adapté à n'importe quel type de données.

```ts
// stores/useEntityStore.ts — Une "fabrique" de stores

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Interface de base : toute entité doit avoir un id
interface Entity {
  id: number
}

// Cette FONCTION crée un store pour n'importe quel type d'entité
// <T extends Entity> = "T est un type qui a au moins un id"
export function createEntityStore<T extends Entity>(
  name: string,     // Le nom du store (ex: "products")
  apiUrl: string,   // L'URL de l'API (ex: "/api/products")
) {
  return defineStore(name, () => {
    // 🧊 STATE
    const items = ref<T[]>([])              // La liste des éléments (tableau vide au départ)
    const isLoading = ref(false)             // Est-ce qu'on est en train de charger ?
    const error = ref<string | null>(null)   // Message d'erreur (null = pas d'erreur)

    // 📋 GETTERS
    const count = computed(() => items.value.length)   // Le nombre total d'éléments

    // 👨‍🍳 ACTIONS

    // Récupérer tous les éléments depuis le serveur
    async function fetchAll(): Promise<void> {
      isLoading.value = true         // On indique qu'on charge
      error.value = null             // On reset l'erreur
      try {
        const res = await fetch(apiUrl)
        items.value = await res.json()
      } catch (err) {
        error.value = 'Erreur de chargement'
      } finally {
        isLoading.value = false      // Chargement terminé (succès ou échec)
      }
    }

    // Créer un nouvel élément
    async function create(data: Omit<T, 'id'>): Promise<void> {
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      })
      const created: T = await res.json()
      items.value.push(created)      // On ajoute l'élément créé à la liste
    }

    // Supprimer un élément par son id
    async function remove(id: number): Promise<void> {
      await fetch(`${apiUrl}/${id}`, { method: 'DELETE' })
      // On filtre la liste pour enlever l'élément supprimé
      items.value = items.value.filter(item => item.id !== id)
    }

    // Trouver un élément par son id
    function findById(id: number): T | undefined {
      return items.value.find(item => item.id === id)
    }

    return { items, isLoading, error, count, fetchAll, create, remove, findById }
  })
}
```

### Utilisation : créer un store de produits en 1 ligne

```ts
// stores/products.ts

import { createEntityStore } from './useEntityStore'

// On définit le type Product
interface Product {
  id: number
  name: string
  price: number
}

// On crée un store complet pour les produits — c'est tout !
// Il aura automatiquement fetchAll, create, remove, findById...
export const useProductStore = createEntityStore<Product>('products', '/api/products')
```

---

## Persister un store (plugin)

Par défaut, quand on recharge la page, les stores sont remis à zéro.
Pour **garder les données** entre les rechargements, on peut utiliser un plugin
qui sauvegarde automatiquement dans le `localStorage` du navigateur :

```ts
// plugins/piniaPersistedState.ts
import type { PiniaPluginContext } from 'pinia'

// Ce plugin sauvegarde/restaure automatiquement les stores
export function piniaPersistedState({ store }: PiniaPluginContext): void {
  const key = `pinia-${store.$id}`                    // Clé de stockage unique par store
  const saved = localStorage.getItem(key)              // On cherche des données sauvegardées

  if (saved) {
    store.$patch(JSON.parse(saved))   // Si on en trouve, on les restaure dans le store
  }

  // $subscribe = "préviens-moi à chaque changement du store"
  store.$subscribe((_, state) => {
    localStorage.setItem(key, JSON.stringify(state))   // On sauvegarde à chaque changement
  })
}
```

```ts
// main.ts — On branche le plugin
const pinia = createPinia()
pinia.use(piniaPersistedState)   // "Pinia, utilise ce plugin pour sauvegarder les stores"
```

---

## Résumé visuel

```
┌──────────────────────────────────────────────────┐
│                    STORE PINIA                    │
│                                                  │
│   🧊 STATE (le frigo)                            │
│   ┌──────────────────────────┐                   │
│   │ count = 5                │                   │
│   │ user = { name: "Alice" } │                   │
│   └──────────────────────────┘                   │
│                 │                                 │
│   📋 GETTERS (le menu)         👨‍🍳 ACTIONS (le chef)│
│   ┌──────────────────┐       ┌──────────────────┐│
│   │ double → 10      │       │ increment()      ││
│   │ isPositive → true│       │ decrement()      ││
│   └──────────────────┘       │ reset()          ││
│                               └──────────────────┘│
└──────────────┬───────────────────┬───────────────┘
               │                   │
        ┌──────┴──────┐    ┌──────┴──────┐
        │ Composant A │    │ Composant B │
        │ Lit count   │    │ Lit count   │
        │ Appelle ++  │    │ Voit le     │
        │             │    │ changement! │
        └─────────────┘    └─────────────┘
```

---

## 🎯 Pratique

### Exercice PI.1 — Définir un store simple

Crée un store `useCounterStore` avec Pinia :

```ts
// stores/counter.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  // State : un compteur qui commence à 0
  // ???

  // Getter : le double du compteur
  // ???

  // Actions : increment, decrement, reset
  // ???

  return { ??? }
})
```

<details>
<summary>Solution</summary>

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)

  const double = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  function decrement() {
    count.value--
  }

  function reset() {
    count.value = 0
  }

  return { count, double, increment, decrement, reset }
})
```
</details>

---

### Exercice PI.2 — Utiliser le store dans un composant

Complète ce composant pour utiliser le store créé :

```vue
<script setup lang="ts">
// Importe et utilise le store
// ???
</script>

<template>
  <div>
    <p>Compteur : {{ ??? }}</p>
    <p>Double : {{ ??? }}</p>
    <button @click="???">+1</button>
    <button @click="???">-1</button>
    <button @click="???">Reset</button>
  </div>
</template>
```

<details>
<summary>Solution</summary>

```vue
<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'

const counterStore = useCounterStore()
</script>

<template>
  <div>
    <p>Compteur : {{ counterStore.count }}</p>
    <p>Double : {{ counterStore.double }}</p>
    <button @click="counterStore.increment">+1</button>
    <button @click="counterStore.decrement">-1</button>
    <button @click="counterStore.reset">Reset</button>
  </div>
</template>
```
</details>

---

### Exercice PI.3 — Store avec state complexe

Crée un store `useCartStore` pour gérer un panier d'achat :

```ts
// stores/cart.ts
interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

export const useCartStore = defineStore('cart', () => {
  // State : tableau d'items
  const items = ref<CartItem[]>([])

  // Getter : total du panier (somme de price * quantity)
  // ???

  // Action : ajouter un item
  function addItem(item: Omit<CartItem, 'quantity'>) {
    // Si l'item existe déjà, augmente la quantité
    // Sinon, ajoute-le avec quantity = 1
    // ???
  }

  // Action : supprimer un item
  function removeItem(id: number) {
    // ???
  }

  return { items, total, addItem, removeItem }
})
```

<details>
<summary>Solution</summary>

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

  const total = computed(() => {
    return items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  })

  function addItem(item: Omit<CartItem, 'quantity'>) {
    const existing = items.value.find(i => i.id === item.id)
    if (existing) {
      existing.quantity++
    } else {
      items.value.push({ ...item, quantity: 1 })
    }
  }

  function removeItem(id: number) {
    const index = items.value.findIndex(i => i.id === id)
    if (index !== -1) {
      items.value.splice(index, 1)
    }
  }

  return { items, total, addItem, removeItem }
})
```
</details>

---

### Exercice PI.4 — Store avec action async

Ajoute une action async au store pour charger les données depuis une API :

```ts
export const useUsersStore = defineStore('users', () => {
  const users = ref<User[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Action async : charge les utilisateurs depuis /api/users
  async function fetchUsers() {
    // ???
  }

  return { users, isLoading, error, fetchUsers }
})
```

<details>
<summary>Solution</summary>

```ts
async function fetchUsers() {
  isLoading.value = true
  error.value = null

  try {
    const response = await fetch('/api/users')
    if (!response.ok) throw new Error('Erreur serveur')
    users.value = await response.json()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erreur inconnue'
  } finally {
    isLoading.value = false
  }
}
```
</details>

---

## Exercice

→ `exercices/11-store-pinia/ENONCE.md`

## Suite

→ `cours/03-avance/03-tests-unitaires.md`
