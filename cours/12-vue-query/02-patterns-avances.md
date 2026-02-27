# 02 — TanStack Query : patterns avancés

> ⚠️ **Ce chapitre est avancé.** Si tu débutes, lis-le une première fois pour avoir une vue d'ensemble, puis **reviens-y plus tard** quand tu en auras besoin dans un vrai projet. Pas besoin de tout maîtriser maintenant !

> **Prérequis** : avoir lu le chapitre précédent sur `useQuery` et `useMutation`.

---

## 1. Optimistic Updates (mises à jour optimistes)

### C'est quoi ?

**Analogie** : tu envoies un message sur WhatsApp. L'application affiche ton message IMMÉDIATEMENT avec une petite horloge ⏳, **avant même** que le serveur confirme l'envoi. Si l'envoi échoue, le message passe en rouge ❌ et tu peux réessayer.

C'est exactement ça une **mise à jour optimiste** :
1. On met à jour l'écran **tout de suite** (on suppose que ça va marcher)
2. On envoie la requête au serveur en parallèle
3. Si ça marche → parfait, rien à faire
4. Si ça échoue → on **annule** le changement et on remet l'ancien état

### Pourquoi c'est utile ?

Sans optimistic update : tu cliques → tu vois un spinner → 500ms plus tard l'écran change. Ça se sent lent.
Avec optimistic update : tu cliques → l'écran change INSTANTANÉMENT. L'utilisateur est content.

### Exemple commenté pas à pas

```ts
import { useMutation, useQueryClient } from '@tanstack/vue-query'

// On récupère le gestionnaire de cache
const queryClient = useQueryClient()

const { mutate: updateUser } = useMutation({
  // --- Étape 1 : la fonction qui envoie au serveur ---
  mutationFn: (updated: User) =>
    fetch(`/api/users/${updated.id}`, {
      method: 'PUT',                                    // PUT = modifier
      body: JSON.stringify(updated),                     // L'utilisateur modifié, en JSON
      headers: { 'Content-Type': 'application/json' },
    }).then(r => r.json()),

  // --- Étape 2 : AVANT l'envoi au serveur (onMutate) ---
  // C'est ici qu'on fait la mise à jour optimiste
  onMutate: async (updated) => {
    // 2a. On annule les requêtes GET en cours sur 'users'
    // Pourquoi ? Pour éviter qu'un ancien GET écrase notre mise à jour optimiste
    await queryClient.cancelQueries({ queryKey: ['users'] })

    // 2b. On sauvegarde l'état actuel du cache (comme un "point de sauvegarde")
    // Si ça plante, on pourra revenir à cet état
    const previousUsers = queryClient.getQueryData<User[]>(['users'])

    // 2c. On modifie le cache DIRECTEMENT (sans attendre le serveur)
    // setQueryData = "Change les données en cache pour cette clé"
    queryClient.setQueryData<User[]>(
      ['users'],
      // .map parcourt chaque user : si c'est celui qu'on modifie, on le remplace
      (old) => old?.map(u => u.id === updated.id ? updated : u) ?? []
    )

    // 2d. On retourne la sauvegarde pour pouvoir faire un rollback si nécessaire
    return { previousUsers }
  },

  // --- Étape 3 : SI ÇA ÉCHOUE → on remet l'ancien état ---
  // _err = l'erreur, _updated = ce qu'on voulait envoyer, context = notre sauvegarde
  onError: (_err, _updated, context) => {
    // Si on a une sauvegarde, on remet les anciennes données
    if (context?.previousUsers) {
      queryClient.setQueryData(['users'], context.previousUsers)
    }
  },

  // --- Étape 4 : DANS TOUS LES CAS (succès OU erreur) ---
  // On demande un rechargement depuis le serveur pour être sûr d'être synchronisé
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] })
  },
})
```

### Schéma simplifié

```
Clic utilisateur
    │
    ├── 1. Cache mis à jour IMMÉDIATEMENT (écran change)
    │
    ├── 2. Requête envoyée au serveur en arrière-plan
    │
    ├── Si SUCCÈS ✅ → on recharge pour synchroniser
    │
    └── Si ERREUR ❌ → on remet l'ancien état (rollback)
```

---

## 2. Pagination

### C'est quoi ?

**Analogie** : les résultats de Google. Tu ne vois pas les millions de résultats d'un coup — tu vois la page 1 (10 résultats), puis tu cliques « Suivant » pour la page 2, etc.

La pagination, c'est **découper une grande liste en petites pages**.

### 📝 Rappel : c'est quoi `computed` ?

```ts
// computed = une valeur calculée automatiquement à partir d'autres valeurs
// Elle se met à jour toute seule quand ses dépendances changent
const totalPages = computed(() => data.value?.totalPages ?? 0)
// ça veut dire : "totalPages = le nombre de pages dans data, ou 0 si data n'existe pas encore"
// ?? = "si c'est null ou undefined, utilise la valeur après ??"
```

### Exemple avec TanStack Query

```ts
import { useQuery, keepPreviousData } from '@tanstack/vue-query'
import { ref, computed } from 'vue'

// La page actuelle (commence à 1)
const page = ref(1)

// Nombre d'éléments par page
const pageSize = ref(10)

// On décrit la forme de la réponse du serveur
// Le <T> est un "générique" = un type variable (ici T sera User)
interface PaginatedResponse<T> {
  items: T[]        // Les éléments de CETTE page
  total: number     // Nombre total d'éléments (toutes pages confondues)
  page: number      // La page actuelle
  totalPages: number // Le nombre total de pages
}

const { data, isLoading, isPlaceholderData } = useQuery({
  // La clé contient la page et la taille → change de clé = nouvelle requête
  queryKey: ['users', { page, pageSize }],

  queryFn: async (): Promise<PaginatedResponse<User>> => {
    // On ajoute les paramètres de pagination dans l'URL
    // Exemple : /api/users?page=2&limit=10
    const res = await fetch(
      `/api/users?page=${page.value}&limit=${pageSize.value}`
    )
    return res.json()    // On convertit la réponse en objet JavaScript
  },

  // keepPreviousData = garder l'ancienne page visible pendant le chargement de la nouvelle
  // Sans ça : tu verrais un écran vide à chaque changement de page (pas agréable)
  placeholderData: keepPreviousData,
})

// Nombre total de pages (calculé automatiquement depuis la réponse)
const totalPages = computed(() => data.value?.totalPages ?? 0)

// Fonction pour aller à la page suivante
function nextPage(): void {
  if (page.value < totalPages.value) {  // On ne peut pas dépasser la dernière page
    page.value++                         // page passe de 1 à 2 → TanStack Query refait la requête
  }
}

// Fonction pour aller à la page précédente
function prevPage(): void {
  if (page.value > 1) {                  // On ne peut pas aller avant la page 1
    page.value--
  }
}
```

### Le template

```vue
<template>
  <!-- Si on affiche les données de l'ancienne page en attendant, on les rend semi-transparentes -->
  <!-- isPlaceholderData = true quand on affiche les anciennes données pendant le chargement -->
  <div :class="{ 'opacity-50': isPlaceholderData }">
    <ul>
      <!-- data?.items = les utilisateurs de la page actuelle -->
      <li v-for="user in data?.items" :key="user.id">{{ user.name }}</li>
    </ul>
  </div>

  <!-- Boutons de navigation -->
  <div class="pagination">
    <!-- :disabled = grisé et non cliquable si on est déjà à la première page -->
    <button :disabled="page <= 1" @click="prevPage">Précédent</button>

    <!-- Affiche "2 / 5" par exemple -->
    <span>{{ page }} / {{ totalPages }}</span>

    <!-- Grisé si on est déjà à la dernière page -->
    <button :disabled="page >= totalPages" @click="nextPage">Suivant</button>
  </div>
</template>
```

---

## 3. Infinite Scroll (défilement infini)

### C'est quoi ?

**Analogie** : le fil d'actualité d'Instagram ou Twitter. Tu scrolles vers le bas et de nouveaux posts apparaissent automatiquement. Pas de bouton « Page suivante » — ça charge tout seul.

C'est comme la pagination, mais au lieu de cliquer « Suivant », les données suivantes se chargent automatiquement quand tu arrives en bas.

### Exemple commenté

```ts
// useInfiniteQuery = version spéciale de useQuery pour le scroll infini
import { useInfiniteQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

const {
  data,                // Toutes les pages chargées
  fetchNextPage,       // Fonction pour charger la page suivante
  hasNextPage,         // true/false : est-ce qu'il reste des pages ?
  isFetchingNextPage,  // true/false : est-ce qu'on est en train de charger la suite ?
} = useInfiniteQuery({
  queryKey: ['users', 'infinite'],

  // pageParam = le numéro de la page à charger (fourni automatiquement par TanStack Query)
  queryFn: async ({ pageParam }): Promise<PaginatedResponse<User>> => {
    // On demande 20 utilisateurs à partir du curseur (= position dans la liste)
    const res = await fetch(`/api/users?cursor=${pageParam}&limit=20`)
    return res.json()
  },

  // La première page commence à 0
  initialPageParam: 0,

  // Comment trouver la page suivante ?
  // Si la dernière page contenait 20 éléments → il y en a probablement d'autres
  // Si elle en contenait moins de 20 → c'était la dernière page (on retourne undefined)
  getNextPageParam: (lastPage) =>
    lastPage.items.length === 20
      ? lastPage.page + 1    // Il y a une page suivante
      : undefined,           // undefined = plus de pages → hasNextPage devient false
})

// On "aplatit" toutes les pages en un seul tableau
// Exemple : page 1 = [user1, user2], page 2 = [user3, user4]
// → allUsers = [user1, user2, user3, user4]
const allUsers = computed(
  () => data.value?.pages.flatMap(p => p.items) ?? []
  // .flatMap = comme .map mais "aplatit" les tableaux imbriqués
  // ?? [] = si pas encore de données, tableau vide
)
```

### Le template

```vue
<template>
  <!-- On affiche TOUS les utilisateurs chargés (toutes pages confondues) -->
  <ul>
    <li v-for="user in allUsers" :key="user.id">{{ user.name }}</li>
  </ul>

  <!-- Bouton "Charger plus" (visible seulement s'il reste des pages) -->
  <button
    v-if="hasNextPage"
    :disabled="isFetchingNextPage"
    @click="fetchNextPage"
  >
    <!-- Texte adapté selon l'état -->
    {{ isFetchingNextPage ? 'Chargement...' : 'Charger plus' }}
  </button>
</template>
```

> **Pour aller plus loin** : dans un vrai projet, on détecte automatiquement quand l'utilisateur arrive en bas de page (avec `IntersectionObserver`) au lieu d'afficher un bouton.

---

## 4. Dependent Queries (requêtes dépendantes)

### C'est quoi ?

**Analogie** : tu veux afficher les commandes d'un client. Mais pour ça, tu dois d'abord savoir QUI est le client. Donc :
1. D'abord → charger le client
2. Ensuite seulement → charger ses commandes

C'est une **chaîne de requêtes** : la deuxième attend que la première soit terminée.

### Exemple commenté

```ts
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

// --- Requête 1 : charger l'utilisateur ---
// Celle-ci se lance immédiatement
const { data: user } = useQuery({
  queryKey: ['user', userId],                  // Clé de cache pour cet utilisateur
  queryFn: () => fetchUser(userId.value),      // Appel API
})

// --- Requête 2 : charger ses commandes ---
// Celle-ci attend que la première soit terminée
const { data: orders } = useQuery({
  queryKey: ['orders', { userId }],            // Clé de cache pour ses commandes
  queryFn: () => fetchOrders(userId.value),    // Appel API

  // enabled = activer ou désactiver cette requête
  // !!user.value = convertit en true/false
  //   - Si user.value existe → true → la requête se lance
  //   - Si user.value est undefined (pas encore chargé) → false → la requête attend
  enabled: computed(() => !!user.value),
})

// Résultat :
// 1. La page s'ouvre → requête 1 se lance → on charge le user
// 2. Le user arrive → enabled devient true → requête 2 se lance → on charge les commandes
// 3. L'écran affiche le user ET ses commandes
```

### 📝 Rappel : c'est quoi `!!` (double négation) ?

```ts
// !! transforme n'importe quelle valeur en true ou false
!!undefined    // → false (pas de valeur)
!!null         // → false (pas de valeur)
!!''           // → false (texte vide)
!!0            // → false (zéro)

!!'Alice'      // → true (il y a une valeur)
!!42           // → true (il y a une valeur)
!!{ id: 1 }   // → true (il y a un objet)
```

---

## 5. Prefetching (préchargement)

### C'est quoi ?

**Analogie** : tu es au restaurant et tu regardes le menu. Le serveur intelligent commence DÉJÀ à préparer le plat que tu sembles vouloir commander, avant même que tu le dises. Quand tu commandes, c'est prêt immédiatement.

Le **prefetching**, c'est charger des données **avant que l'utilisateur en ait besoin**. Comme ça, quand il clique, c'est instantané.

### Exemple : précharger au survol de la souris

```ts
import { useQueryClient } from '@tanstack/vue-query'

// On récupère le gestionnaire de cache
const queryClient = useQueryClient()

// Cette fonction sera appelée quand la souris survole un lien
function prefetchUser(userId: number): void {
  // prefetchQuery = "charge ces données en arrière-plan et mets-les en cache"
  queryClient.prefetchQuery({
    queryKey: ['users', userId],           // Clé de cache
    queryFn: () => fetchUser(userId),      // Comment aller chercher
    staleTime: 5 * 60 * 1000,             // Garder "frais" pendant 5 min
  })
  // Quand l'utilisateur cliquera sur le lien, les données seront DÉJÀ en cache
  // → La page s'affichera instantanément !
}
```

### Le template

```vue
<template>
  <!-- Pour chaque utilisateur dans la liste -->
  <RouterLink
    v-for="user in users"
    :key="user.id"
    :to="`/users/${user.id}`"
    @mouseenter="prefetchUser(user.id)"
  >
    <!-- @mouseenter = "quand la souris entre sur cet élément" -->
    <!-- Donc : quand on survole le lien → on précharge les données de cet utilisateur -->
    {{ user.name }}
  </RouterLink>
</template>
```

### Quand utiliser le prefetching ?

- Au **survol** d'un lien (comme ci-dessus)
- Quand l'utilisateur est sur la **page 2**, on précharge la **page 3**
- Quand l'utilisateur arrive sur une page, on précharge les données des sous-pages

---

## 6. Query Invalidation (dire au cache de se rafraîchir)

### C'est quoi ?

**Analogie** : tu as un tableau blanc avec des informations. Quelqu'un modifie les informations à la source. Tu effaces le tableau et tu le recopies avec les nouvelles infos.

L'**invalidation**, c'est dire à TanStack Query : « ces données ne sont plus fiables, va les re-chercher sur le serveur ».

### Quand l'utiliser ?

Après une **mutation** (création, modification, suppression). Exemple : tu crées un nouvel utilisateur → tu invalides la liste des utilisateurs → TanStack Query recharge la liste → le nouvel utilisateur apparaît.

```ts
const queryClient = useQueryClient()

// Invalider une clé précise
queryClient.invalidateQueries({ queryKey: ['users'] })
// → Toutes les requêtes dont la clé commence par 'users' seront rechargées

// Invalider une clé plus précise
queryClient.invalidateQueries({ queryKey: ['users', 42] })
// → Seule la requête de l'utilisateur 42 sera rechargée

// Tout invalider (rare, mais possible)
queryClient.invalidateQueries()
// → TOUT le cache est invalidé, TOUT est rechargé
```

---

## 7. Configuration globale

Au lieu de répéter les mêmes options dans chaque `useQuery`, on peut les définir **une seule fois** pour toute l'application :

```ts
// main.ts — le fichier de démarrage

import { VueQueryPlugin, type VueQueryPluginOptions } from '@tanstack/vue-query'

// Les options par défaut pour TOUTES les requêtes de l'application
const queryConfig: VueQueryPluginOptions = {
  queryClientConfig: {
    defaultOptions: {

      // Options pour les lectures (useQuery)
      queries: {
        staleTime: 2 * 60 * 1000,      // Données fraîches pendant 2 min par défaut
        gcTime: 10 * 60 * 1000,         // Gardées en cache 10 min
        retry: 2,                        // 2 tentatives en cas d'erreur
        refetchOnWindowFocus: true,      // Recharger quand on revient sur l'onglet
        refetchOnReconnect: true,        // Recharger quand Internet revient
      },

      // Options pour les écritures (useMutation)
      mutations: {
        retry: 1,                        // 1 seule tentative en cas d'erreur
      },
    },
  },
}

// On passe cette configuration au plugin
app.use(VueQueryPlugin, queryConfig)
```

> **Astuce** : chaque `useQuery` individuel peut toujours surcharger ces options. La config globale donne juste des valeurs par défaut.

---

## 8. Devtools (outils de développement)

TanStack Query a un panneau de debug intégré qui te montre l'état de toutes tes requêtes en temps réel.

### Installation

```bash
pnpm add @tanstack/vue-query-devtools
```

### Activation

```vue
<!-- App.vue — le composant racine de l'application -->
<script setup lang="ts">
// On importe le composant Devtools
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
</script>

<template>
  <!-- Le routeur affiche la page actuelle -->
  <RouterView />

  <!-- Les Devtools apparaissent comme un petit bouton dans le coin de l'écran -->
  <!-- En cliquant dessus, un panneau s'ouvre avec toutes les infos de cache -->
  <!-- Ne s'affiche qu'en mode développement (pas en production) -->
  <VueQueryDevtools />
</template>
```

### Que voit-on dans les Devtools ?

- Toutes les **queryKey** actives
- Leur **état** : fresh, stale, fetching, inactive…
- Les **données** en cache
- Le nombre de **composants** qui utilisent chaque query
- Un bouton pour **invalider** ou **refetch** manuellement

---

## 9. Quand utiliser quoi ? TanStack Query vs Pinia vs composable maison

| Critère                          | Composable maison       | Pinia        | TanStack Query          |
| -------------------------------- | ----------------------- | ------------ | ----------------------- |
| Cache automatique                | ❌ À faire soi-même     | ❌ Manuel    | ✅ Automatique          |
| Déduplique les requêtes          | ❌ Non                  | ❌ Non       | ✅ Oui                  |
| Données périmées → recharge      | ❌ Non                  | ❌ Non       | ✅ Oui                  |
| Retry automatique                | ❌ Non                  | ❌ Non       | ✅ Oui                  |
| Devtools                         | ❌ Non                  | ✅ Oui       | ✅ Oui                  |
| État client (formulaires, UI)    | ❌ Pas fait pour ça     | ✅ Parfait   | ❌ Pas fait pour ça     |
| Complexité                       | 🔴 Beaucoup de code    | 🟡 Modéré   | 🟢 Très peu de code    |

### La règle simple

- **Données qui viennent du serveur** (API) → **TanStack Query**
- **Données qui restent dans le navigateur** (thème sombre, formulaire en cours, panier) → **Pinia**
- Les deux outils se **complètent**, ils ne se remplacent pas

---

## Résumé de ce chapitre avancé

| Concept               | En une phrase                                                       |
| --------------------- | ------------------------------------------------------------------- |
| Optimistic Updates    | Modifier l'écran avant la confirmation du serveur                   |
| Pagination            | Découper une grande liste en pages avec boutons Précédent/Suivant   |
| Infinite Scroll       | Charger la suite automatiquement quand on scrolle                   |
| Dependent Queries     | Attendre qu'une requête finisse avant d'en lancer une autre         |
| Prefetching           | Charger des données à l'avance pour que l'affichage soit instantané |
| Query Invalidation    | Dire au cache de se rafraîchir après une modification               |

> **Rappel** : ces patterns sont avancés. Commence par bien maîtriser `useQuery` et `useMutation` du chapitre précédent. Tu reviendras ici quand tu en auras besoin.

---

## 🎯 Pratique

### Exercice VQ.4 — Optimistic update

Ajoute une mise à jour optimiste pour cette mutation de like :

```ts
export function useLikePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (postId: number) => fetch(`/api/posts/${postId}/like`, { method: 'POST' }),
    onMutate: async (postId) => {
      // 1. Annuler les requêtes en cours
      // 2. Sauvegarder l'ancien état
      // 3. Mettre à jour le cache de façon optimiste
      ???
    },
    onError: (err, postId, context) => {
      // 4. Rollback en cas d'erreur
      ???
    }
  })
}
```

<details>
<summary>Solution</summary>

```ts
onMutate: async (postId) => {
  await queryClient.cancelQueries({ queryKey: ['posts'] })
  const previousPosts = queryClient.getQueryData(['posts'])
  queryClient.setQueryData(['posts'], (old: Post[]) =>
    old.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p)
  )
  return { previousPosts }
},
onError: (err, postId, context) => {
  queryClient.setQueryData(['posts'], context?.previousPosts)
}
```
</details>

---

### Exercice VQ.5 — Pagination

Crée une query paginée :

```ts
const page = ref(1)

const { data } = useQuery({
  queryKey: ???,
  queryFn: ???,
  placeholderData: ???  // Garder les anciennes données pendant le chargement
})
```

<details>
<summary>Solution</summary>

```ts
import { keepPreviousData } from '@tanstack/vue-query'

const page = ref(1)

const { data } = useQuery({
  queryKey: ['products', page],
  queryFn: () => fetch(`/api/products?page=${page.value}`).then(r => r.json()),
  placeholderData: keepPreviousData
})
```
</details>

---

### Exercice VQ.6 — Dependent query

Crée une query qui dépend du résultat d'une autre :

```ts
// D'abord : récupérer l'utilisateur
const { data: user } = useQuery({
  queryKey: ['user'],
  queryFn: fetchCurrentUser
})

// Puis : récupérer ses commandes (seulement si user existe)
const { data: orders } = useQuery({
  queryKey: ???,
  queryFn: ???,
  enabled: ???
})
```

<details>
<summary>Solution</summary>

```ts
const { data: orders } = useQuery({
  queryKey: ['orders', user.value?.id],
  queryFn: () => fetch(`/api/users/${user.value!.id}/orders`).then(r => r.json()),
  enabled: !!user.value
})
```
</details>

---

## Suite

→ [cours/09-accessibilite/01-fondamentaux-wcag.md](../09-accessibilite/01-fondamentaux-wcag.md) (ou module suivant selon le parcours)
