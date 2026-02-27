# 01 — TanStack Query (Vue Query)

> **Ce chapitre suppose que tu sais ce qu'est une API** (un serveur qui renvoie des données quand on lui demande) **et que tu as déjà vu `fetch`** (la fonction JavaScript pour appeler une API). Si ce n'est pas clair, relis d'abord le module sur les composables et le fetch.

---

## C'est quoi TanStack Query ?

**Analogie** : Imagine que tu commandes un café dans un restaurant.

- **Sans TanStack Query** : tu vas toi-même en cuisine, tu vérifies si le café est prêt, tu gères les erreurs si la machine est en panne, tu te souviens de ce que tu as déjà commandé pour ne pas recommander deux fois… Épuisant.
- **Avec TanStack Query** : tu appelles le serveur (le vrai, celui du restaurant 😄). Tu lui dis « je veux un café ». Il s'occupe de TOUT : aller en cuisine, vérifier si c'est prêt, te prévenir en cas de problème, et même te resservir automatiquement quand ton café est froid.

**TanStack Query est une bibliothèque (un outil prêt à l'emploi) qui gère automatiquement toutes les interactions avec ton API** : récupérer des données, les mettre en cache (= les garder en mémoire), gérer les erreurs, recharger quand c'est nécessaire…

Son ancien nom était "Vue Query" — c'est la même chose.

---

## Pourquoi en a-t-on besoin ?

### 📝 Rappel : comment on fait sans TanStack Query

Quand tu veux récupérer des données d'un serveur en Vue, tu écris quelque chose comme ça :

```ts
// --- SANS TanStack Query : on gère TOUT manuellement ---

// On crée une variable réactive pour stocker la liste des utilisateurs
const users = ref<User[]>([])        // ref = variable réactive Vue (elle met à jour l'écran quand elle change)

// Une variable pour savoir si on est en train de charger
const isLoading = ref(false)          // false = pas en chargement au départ

// Une variable pour stocker un éventuel message d'erreur
const error = ref<string | null>(null) // null = pas d'erreur au départ

// onMounted = "quand le composant apparaît à l'écran, fais ceci :"
onMounted(async () => {
  isLoading.value = true               // On dit "chargement en cours"

  try {
    // fetch = aller chercher les données sur le serveur (comme demander le café)
    users.value = await fetchUsers()    // On attend la réponse et on la stocke
  } catch (e) {
    // Si ça plante, on attrape l'erreur
    error.value = 'Erreur de chargement'
  } finally {
    // Dans tous les cas (succès ou erreur), on arrête le chargement
    isLoading.value = false
  }
})

// Problèmes :
// ❌ Pas de cache (si on revient sur cette page, on refait la requête)
// ❌ Pas de retry automatique (si ça échoue, tant pis)
// ❌ Pas de rechargement en arrière-plan
// ❌ Beaucoup de code répétitif pour chaque écran
```

C'est **beaucoup de travail** pour chaque composant. Et on oublie plein de choses utiles.

### ✅ Ce que TanStack Query fait pour toi automatiquement

| Problème que tu avais                       | TanStack Query le résout comment                        |
| ------------------------------------------- | ------------------------------------------------------- |
| Tu dois créer `isLoading`, `error`…         | `useQuery` te donne tout ça automatiquement             |
| Pas de **cache** (mémoire)                  | Les données sont gardées en mémoire, identifiées par clé |
| Requêtes **dupliquées** (2 composants = 2×) | Une seule requête est envoyée, partagée entre tous      |
| Données **périmées** sans le savoir         | Rechargement automatique en arrière-plan                |
| Ça plante et c'est fini                     | **3 tentatives** automatiques en cas d'erreur           |
| Tu changes d'onglet et tu reviens           | Rechargement automatique au retour                      |
| Tu modifies des données → liste pas à jour  | Invalidation du cache → rechargement                    |

---

## Étape 1 : Installation

On installe la bibliothèque avec le gestionnaire de paquets :

```bash
# pnpm est un gestionnaire de paquets (comme npm)
# "add" = ajouter une bibliothèque au projet
pnpm add @tanstack/vue-query
```

---

## Étape 2 : Configuration dans main.ts

Il faut dire à Vue « utilise TanStack Query dans toute l'application » :

```ts
// main.ts — le fichier de démarrage de ton application Vue

import { createApp } from 'vue'              // createApp = créer l'application Vue
import { VueQueryPlugin } from '@tanstack/vue-query'  // Le plugin TanStack Query
import App from './App.vue'                   // Ton composant racine

const app = createApp(App)   // On crée l'application

app.use(VueQueryPlugin)      // On active TanStack Query (comme brancher un accessoire)

app.mount('#app')             // On affiche l'application dans la page HTML
```

> **C'est tout pour la config !** Maintenant on peut utiliser `useQuery` dans n'importe quel composant.

---

## useQuery — Lire des données (GET)

`useQuery` c'est **LA** fonction principale. Tu lui dis :
1. **Où chercher dans le cache** (la `queryKey` — comme un nom de fichier)
2. **Comment aller chercher les données** (la `queryFn` — la fonction qui appelle l'API)

Et elle te rend tout ce dont tu as besoin.

### 📝 Rappel : c'est quoi `interface` ?

```ts
// Une interface décrit la FORME d'un objet
// C'est comme un formulaire vide : on décrit les champs qui doivent exister
interface User {
  id: number       // Un identifiant numérique
  name: string     // Un nom (texte)
  email: string    // Un email (texte)
}
// Ça veut dire : "un User, c'est un objet avec id, name et email"
```

### Exemple complet commenté

```vue
<script setup lang="ts">
// On importe useQuery depuis TanStack Query
import { useQuery } from '@tanstack/vue-query'

// On décrit la forme d'un utilisateur
interface User {
  id: number        // Identifiant unique (ex: 1, 2, 3…)
  name: string      // Nom de l'utilisateur
  email: string     // Email de l'utilisateur
}

// --- La fonction qui va chercher les données ---
// C'est une fonction "async" = elle prend du temps (elle attend le serveur)
// Elle retourne une Promise<User[]> = "une promesse de donner un tableau d'utilisateurs"
async function fetchUsers(): Promise<User[]> {
  // fetch = envoyer une requête HTTP au serveur (comme taper une URL dans le navigateur)
  const res = await fetch('/api/users')    // On attend la réponse du serveur

  // Si la réponse n'est pas "ok" (code 200), on lance une erreur
  if (!res.ok) throw new Error('Erreur serveur')

  // On convertit la réponse en JSON (= en objets JavaScript)
  return res.json()
}

// --- useQuery : la magie opère ---
// On "déstructure" le résultat = on récupère plusieurs variables d'un coup
const {
  data: users,   // Les données reçues (tableau d'utilisateurs ou undefined si pas encore chargé)
  isLoading,     // true/false : est-ce que c'est le PREMIER chargement ?
  isFetching,    // true/false : est-ce qu'un chargement est en cours (même en arrière-plan) ?
  isError,       // true/false : est-ce qu'il y a eu une erreur ?
  error,         // L'erreur elle-même (ou null si pas d'erreur)
  refetch,       // Une fonction pour forcer le rechargement manuellement
} = useQuery({
  // queryKey : le "nom de fichier" du cache
  // C'est un tableau qui identifie ces données de manière unique
  // Pense à ça comme une étiquette sur un dossier : ['users']
  queryKey: ['users'],

  // queryFn : la fonction qui va chercher les données
  // TanStack Query l'appellera automatiquement quand nécessaire
  queryFn: fetchUsers,

  // staleTime : combien de temps les données sont considérées "fraîches"
  // 5 * 60 * 1000 = 5 minutes en millisecondes
  // Pendant 5 min, pas besoin de re-demander au serveur
  staleTime: 5 * 60 * 1000,
})
</script>

<template>
  <!-- v-if / v-else-if / v-else : afficher une chose OU une autre -->

  <!-- Si c'est en train de charger (première fois) -->
  <div v-if="isLoading">Chargement...</div>

  <!-- Sinon, s'il y a une erreur -->
  <div v-else-if="isError">{{ error?.message }}</div>

  <!-- Sinon, on affiche les données -->
  <ul v-else>
    <!-- v-for = boucle : pour chaque user dans users, créer un <li> -->
    <li v-for="user in users" :key="user.id">
      {{ user.name }}
    </li>
  </ul>
</template>
```

> **Résumé** : avec ~10 lignes de code, on a le chargement, les erreurs, le cache, le retry automatique… tout est géré.

---

## queryKey — Le nom de fichier du cache

La `queryKey` est **le concept le plus important** de TanStack Query.

**Analogie** : Imagine un classeur avec des dossiers étiquetés. Chaque queryKey est une étiquette.

```ts
// Étiquette simple : "le dossier des utilisateurs"
useQuery({ queryKey: ['users'], queryFn: fetchUsers })

// Étiquette plus précise : "le dossier de l'utilisateur n°42"
useQuery({ queryKey: ['users', 42], queryFn: () => fetchUser(42) })

// Étiquette avec des filtres : "les utilisateurs admin, page 2"
useQuery({
  queryKey: ['users', { role: 'admin', page: 2 }],
  queryFn: () => fetchUsers({ role: 'admin', page: 2 }),
})
```

**Règle d'or** : la queryKey doit contenir **tout ce qui change le résultat**. Si tu filtres par rôle, le rôle doit être dans la clé. Sinon le cache sera incorrect.

### queryKey réactive (avec des ref)

```ts
// page et role sont des ref = des variables réactives
const page = ref(1)                    // page actuelle
const role = ref<string>('admin')      // rôle sélectionné

const { data } = useQuery({
  // On met les ref directement dans la queryKey
  // Quand page ou role change → TanStack Query refait automatiquement la requête !
  queryKey: ['users', { page, role }],

  // .value = accéder à la valeur d'une ref (rappel Vue)
  queryFn: () => fetchUsers({ page: page.value, role: role.value }),
})

// Si l'utilisateur clique "Page 2", page.value passe à 2
// → TanStack Query détecte le changement
// → Il relance fetchUsers avec page: 2
// → L'écran se met à jour automatiquement
```

---

## useMutation — Envoyer des données (POST, PUT, DELETE)

`useQuery` sert à **lire** (GET). `useMutation` sert à **écrire** : créer, modifier, supprimer.

**Analogie** : `useQuery` = ouvrir un dossier pour le lire. `useMutation` = écrire une nouvelle fiche et la ranger dans le dossier.

### 📝 Rappel : c'est quoi une requête POST ?

```
GET  = "donne-moi des données"         (lire)
POST = "voici de nouvelles données"     (créer)
PUT  = "voici des données modifiées"    (modifier)
DELETE = "supprime ces données"         (supprimer)
```

### Exemple : créer un utilisateur

```ts
// On importe useMutation et useQueryClient
import { useMutation, useQueryClient } from '@tanstack/vue-query'

// useQueryClient() nous donne accès au "gestionnaire de cache"
// C'est lui qui sait quelles données sont en mémoire
const queryClient = useQueryClient()

// useMutation retourne un objet avec :
// - mutate : la fonction pour déclencher l'envoi
// - isPending : true/false, est-ce que l'envoi est en cours ?
const { mutate: createUser, isPending } = useMutation({

  // mutationFn : la fonction qui envoie les données au serveur
  // Elle reçoit les données à envoyer en paramètre
  mutationFn: (newUser: { name: string; email: string }) =>
    fetch('/api/users', {
      method: 'POST',                                    // POST = créer
      headers: { 'Content-Type': 'application/json' },   // On envoie du JSON
      body: JSON.stringify(newUser),                      // On convertit l'objet en texte JSON
    }).then(r => r.json()),                               // On lit la réponse

  // Que faire si ça réussit ?
  onSuccess: () => {
    // On dit au cache : "les données des 'users' ne sont plus à jour"
    // → TanStack Query va automatiquement refaire un GET pour mettre à jour la liste
    queryClient.invalidateQueries({ queryKey: ['users'] })
  },

  // Que faire si ça échoue ?
  onError: (error) => {
    console.error('Création échouée :', error.message)  // On affiche l'erreur dans la console
  },
})
```

### Le template du formulaire

```vue
<template>
  <!-- @submit.prevent = quand on soumet le formulaire, ne pas recharger la page -->
  <form @submit.prevent="createUser({ name, email })">

    <!-- v-model = lie la valeur du champ à une variable -->
    <input v-model="name" placeholder="Nom" />
    <input v-model="email" placeholder="Email" />

    <!-- :disabled = désactiver le bouton si isPending est true -->
    <button :disabled="isPending">
      <!-- Texte conditionnel : si en cours → "Création...", sinon → "Créer" -->
      {{ isPending ? 'Création...' : 'Créer' }}
    </button>
  </form>
</template>
```

---

## Le cycle de vie du cache : Fresh → Stale → Garbage

Les données en cache passent par 3 états :

```
 ┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐
 │   FRESH      │    │    STALE         │    │   GARBAGE        │
 │  (frais)     │───▶│  (périmé)        │───▶│  (poubelle)      │
 │              │    │                  │    │                  │
 │ Pas besoin   │    │ On les affiche   │    │ Supprimé de la   │
 │ de recharger │    │ MAIS on recharge │    │ mémoire          │
 │              │    │ en arrière-plan  │    │                  │
 └──────────────┘    └──────────────────┘    └──────────────────┘
  < staleTime          >= staleTime           > gcTime et inactif
```

**Analogie** :
- **Fresh** = ton café vient d'être servi, il est chaud → pas besoin d'en recommander
- **Stale** = ton café est tiède → tu le bois quand même mais le serveur va t'en refaire un chaud
- **Garbage** = le café est là depuis des heures, le serveur le jette

```ts
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,

  // Données considérées "fraîches" pendant 5 minutes
  // Pendant ce temps : pas de rechargement
  staleTime: 5 * 60 * 1000,      // 5 minutes en millisecondes

  // Données gardées en cache pendant 30 min après le dernier usage
  // Après : elles sont supprimées de la mémoire
  gcTime: 30 * 60 * 1000,        // 30 minutes (gc = garbage collection)

  // Recharger quand l'utilisateur revient sur l'onglet ?
  refetchOnWindowFocus: true,     // true = oui (comportement par défaut)

  // Recharger automatiquement toutes les 60 secondes ?
  refetchInterval: 60_000,        // 60 000 ms = 60 secondes (polling)

  // Combien de tentatives en cas d'erreur ?
  retry: 3,                       // 3 essais avant d'abandonner
})
```

---

## Bonne pratique : un composable par fonctionnalité

### 📝 Rappel : c'est quoi un composable ?

Un composable est une **fonction réutilisable** qui commence par `use`. C'est comme un outil spécialisé qu'on range dans une boîte : n'importe quel composant peut l'utiliser.

Plutôt que d'écrire les requêtes TanStack Query directement dans chaque composant, on les regroupe dans un fichier dédié :

```ts
// composables/useUsersQuery.ts
// Ce fichier regroupe TOUTES les requêtes liées aux utilisateurs

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import type { Ref } from 'vue'     // Ref = le type d'une variable réactive

// La forme d'un utilisateur
interface User {
  id: number
  name: string
  email: string
}

// La clé de cache, partagée entre toutes les fonctions
// "as const" = TypeScript verrouille la valeur (ne peut pas être modifiée)
const USERS_KEY = ['users'] as const

// ──────────────────────────────────────────
// Composable 1 : récupérer TOUS les utilisateurs
// ──────────────────────────────────────────
export function useUsersQuery() {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: async (): Promise<User[]> => {
      const res = await fetch('/api/users')     // Appel API
      if (!res.ok) throw new Error('Erreur')    // Gérer les erreurs
      return res.json()                         // Convertir la réponse
    },
    staleTime: 5 * 60 * 1000,   // 5 min de fraîcheur
  })
}

// ──────────────────────────────────────────
// Composable 2 : récupérer UN utilisateur par son ID
// ──────────────────────────────────────────
export function useUserQuery(userId: Ref<number>) {
  // userId est une Ref = une variable réactive passée en paramètre
  return useQuery({
    queryKey: ['users', userId] as const,    // Clé unique par utilisateur
    queryFn: async (): Promise<User> => {
      const res = await fetch(`/api/users/${userId.value}`)   // userId.value pour accéder à la valeur
      if (!res.ok) throw new Error('Utilisateur introuvable')
      return res.json()
    },
    // enabled = activer/désactiver la requête
    // computed = valeur calculée qui se met à jour automatiquement
    // Ici : ne faire la requête que si l'ID est > 0 (= valide)
    enabled: computed(() => userId.value > 0),
  })
}

// ──────────────────────────────────────────
// Composable 3 : CRÉER un utilisateur
// ──────────────────────────────────────────
export function useCreateUserMutation() {
  const queryClient = useQueryClient()   // Accès au gestionnaire de cache

  return useMutation({
    // Omit<User, 'id'> = un User SANS le champ id (l'id sera créé par le serveur)
    mutationFn: async (newUser: Omit<User, 'id'>): Promise<User> => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })
      return res.json()
    },
    onSuccess: () => {
      // Après création → on invalide le cache pour recharger la liste
      queryClient.invalidateQueries({ queryKey: USERS_KEY })
    },
  })
}
```

### Utilisation dans un composant

```vue
<script setup lang="ts">
// On importe NOS composables personnalisés
import { useUsersQuery, useCreateUserMutation } from '@/composables/useUsersQuery'

// C'est propre : une ligne pour chaque besoin
const { data: users, isLoading } = useUsersQuery()
const { mutate: createUser, isPending } = useCreateUserMutation()
</script>
```

---

## Résumé : avant vs après TanStack Query

| Sans TanStack Query ❌                       | Avec TanStack Query ✅                         |
| -------------------------------------------- | ---------------------------------------------- |
| Chaque composant gère son propre chargement  | Cache partagé, zéro duplication                |
| Spinners de chargement longs                 | Données instantanées depuis le cache           |
| Pas de retry si ça plante                    | 3 tentatives automatiques                      |
| Données périmées après une modification      | Invalidation → rechargement automatique        |
| ~20 lignes de code par requête               | ~5 lignes par requête                          |

### Les 3 choses à retenir

1. **`useQuery`** = lire des données (GET) → donne `data`, `isLoading`, `isError`
2. **`useMutation`** = écrire des données (POST/PUT/DELETE) → donne `mutate`, `isPending`
3. **`queryKey`** = l'étiquette du cache → doit contenir tout ce qui change le résultat

---

## 🎯 Pratique

### Exercice VQ.1 — Premier useQuery

Crée une query pour récupérer une liste de produits :

```ts
import { useQuery } from '@tanstack/vue-query'

export function useProducts() {
  return useQuery({
    queryKey: ???,
    queryFn: ???
  })
}
```

<details>
<summary>Solution</summary>

```ts
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => fetch('/api/products').then(r => r.json())
  })
}
```
</details>

---

### Exercice VQ.2 — Query avec paramètre

Crée une query pour récupérer un produit par son ID :

```ts
export function useProduct(id: Ref<number>) {
  return useQuery({
    queryKey: ???,
    queryFn: ???
  })
}
```

<details>
<summary>Solution</summary>

```ts
export function useProduct(id: Ref<number>) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetch(`/api/products/${id.value}`).then(r => r.json())
  })
}
```
</details>

---

### Exercice VQ.3 — Mutation avec invalidation

Crée une mutation pour supprimer un produit et invalider le cache :

```ts
export function useDeleteProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ???,
    onSuccess: () => {
      ???
    }
  })
}
```

<details>
<summary>Solution</summary>

```ts
export function useDeleteProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => fetch(`/api/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })
}
```
</details>

---

## Suite

→ [cours/12-vue-query/02-patterns-avances.md](../12-vue-query/02-patterns-avances.md)
