# 03 — Gestion de l'asynchrone (appels réseau, API...)

---

## 🔁 Rappel JavaScript : c'est quoi l'asynchrone ?

### L'analogie du restaurant

Imagine que tu vas au restaurant :

1. **Tu commandes** ton plat au serveur (= tu envoies une requête)
2. **Tu attends** — pendant ce temps, la cuisine prépare ton plat (= le serveur distant travaille)
3. **Tu reçois** ton plat (= la réponse arrive)

Pendant que tu attends, tu ne restes pas figé : tu parles, tu bois de l'eau. C'est **ça** l'asynchrone : ton programme **continue de tourner** pendant qu'il attend une réponse.

En JavaScript, quand on fait un appel réseau (chercher des données sur un serveur), ça prend du temps. Le code ne se met pas "en pause" — il continue, et quand la réponse arrive, il la traite.

### Les Promises (promesses)

Une **Promise** (promesse), c'est un objet qui représente une valeur **qui n'existe pas encore** mais qui arrivera plus tard.

```js
// Imagine : "je te PROMETS de te donner le résultat... plus tard"
const maPromesse = fetch("https://api.exemple.com/donnees");
// maPromesse ne contient PAS encore les données
// Elle contient une PROMESSE qu'elles arriveront
```

Une Promise peut avoir 3 états :
- **pending** (en attente) — la cuisine prépare encore
- **fulfilled** (résolue) — le plat est arrivé ! 🎉
- **rejected** (rejetée) — il y a eu un problème (plus de stock, four en panne...) ❌

### async / await : la façon simple d'attendre

`async` et `await` sont des mots-clés qui rendent le code asynchrone **plus lisible** :

```js
// Le mot "async" devant la fonction dit : "cette fonction contient du code asynchrone"
async function recupererDonnees() {
  // Le mot "await" dit : "ATTENDS que cette promesse soit terminée avant de continuer"
  const reponse = await fetch("https://api.exemple.com/donnees");
  // Ici, reponse contient VRAIMENT la réponse (on a attendu)

  // On transforme la réponse en objet JavaScript (JSON)
  const donnees = await reponse.json();
  // Maintenant "donnees" contient nos données utilisables
}
```

**Sans async/await**, on devrait écrire avec `.then()` (plus difficile à lire) :

```js
// Même chose mais moins lisible :
fetch("https://api.exemple.com/donnees")
  .then((reponse) => reponse.json()) // quand la réponse arrive, transforme en JSON
  .then((donnees) => console.log(donnees)); // quand le JSON est prêt, affiche-le
```

### try / catch / finally : gérer les erreurs

Quand on fait un appel réseau, **ça peut échouer** (pas d'internet, serveur en panne...). Il faut prévoir ce cas :

```js
try {
  // On ESSAIE d'exécuter ce code ("try" = "essayer")
  const reponse = await fetch("https://api.exemple.com/donnees");
  const donnees = await reponse.json();
  console.log("Succès !", donnees);
} catch (erreur) {
  // Si quelque chose échoue dans le try, on ATTRAPE l'erreur ici ("catch" = "attraper")
  console.log("Oups, erreur :", erreur.message);
} finally {
  // Ce bloc s'exécute TOUJOURS, que ça ait marché OU échoué ("finally" = "finalement")
  // Utile pour arrêter un indicateur de chargement par exemple
  console.log("Terminé (succès ou échec)");
}
```

**Analogie** : c'est comme un filet de sécurité au cirque. Le trapéziste (`try`) essaie son numéro. S'il tombe, le filet (`catch`) le rattrape. Et dans tous les cas (`finally`), le spectacle continue.

---

## 🌐 C'est quoi un appel API ?

**API** = Application Programming Interface.

C'est comme un **menu de restaurant** : le serveur (l'API) te propose une liste de plats (de données) que tu peux commander (demander).

Exemple concret :
- Tu appelles `https://api.monsite.com/produits` → tu reçois la **liste des produits**
- Tu appelles `https://api.monsite.com/produits/42` → tu reçois le **produit n°42**

L'outil pour faire ces appels en JavaScript, c'est la fonction `fetch()`.

### Ce que `fetch()` retourne

```js
// fetch() retourne une PROMESSE qui se résout en un objet "Response"
const reponse = await fetch("https://api.monsite.com/produits");

// L'objet Response contient :
reponse.ok;       // true si tout va bien (code 200-299), false sinon
reponse.status;   // Le code HTTP (200 = OK, 404 = pas trouvé, 500 = erreur serveur)
reponse.json();   // Une méthode pour transformer la réponse en objet JavaScript
```

---

## Le problème : les 4 états d'un appel réseau

Tout appel réseau peut se trouver dans **4 états** différents :

| État | Signification | Analogie restaurant |
|------|--------------|---------------------|
| `idle` | Rien ne s'est passé encore | Tu n'as pas encore commandé |
| `loading` | En cours de chargement | La cuisine prépare ton plat |
| `error` | Ça a échoué | Le plat est en rupture de stock |
| `success` | Les données sont arrivées | Ton plat est sur la table ! |

Il faut **toujours** gérer ces 4 cas dans ton interface, sinon l'utilisateur ne sait pas ce qui se passe.

### Représenter ces états en TypeScript

```ts
// On crée un type qui ne peut être QUE dans l'un de ces 4 états
// Le <T> veut dire "le type des données peut varier" (on verra les generics plus tard)
type AsyncState<T> =
  | { status: "idle" }                           // Pas encore commencé
  | { status: "loading" }                        // En cours de chargement
  | { status: "error"; error: string }           // Erreur avec un message
  | { status: "success"; data: T };              // Succès avec les données
```

---

## Fetch basique dans un composant Vue

Voici comment charger des données depuis une API dans un composant Vue, étape par étape :

```vue
<script setup lang="ts">
// On importe les outils Vue dont on a besoin
import { ref, onMounted } from "vue";

// On définit la forme d'un produit (typage TypeScript)
interface Product {
  id: number;       // Identifiant unique
  name: string;     // Nom du produit
  price: number;    // Prix en euros
}

// --- Les 3 variables réactives pour gérer nos états ---

// La liste des produits (tableau vide au début)
const products = ref<Product[]>([]);

// Le message d'erreur (null = pas d'erreur)
const error = ref<string | null>(null);

// Est-ce qu'on est en train de charger ? (false au début)
const isLoading = ref<boolean>(false);

// --- La fonction qui va chercher les produits ---
async function fetchProducts(): Promise<void> {
  isLoading.value = true;    // On passe en mode "chargement"
  error.value = null;         // On réinitialise l'erreur

  try {
    // On demande les produits au serveur
    const response = await fetch("/api/products");

    // On vérifie que le serveur a répondu "OK"
    if (!response.ok) {
      // Si le serveur a répondu avec une erreur (404, 500...), on lance une erreur
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    // On transforme la réponse en tableau de produits
    products.value = await response.json();

  } catch (err) {
    // Si quelque chose a échoué (réseau, serveur...), on stocke le message d'erreur
    // On vérifie que err est bien un objet Error pour accéder à .message
    error.value = err instanceof Error ? err.message : "Erreur inconnue";

  } finally {
    // Dans TOUS les cas (succès ou erreur), on arrête le chargement
    isLoading.value = false;
  }
}

// onMounted = "quand le composant apparaît à l'écran, exécute cette fonction"
onMounted(fetchProducts);
</script>

<template>
  <!-- État "loading" : on affiche un message de chargement -->
  <div v-if="isLoading">Chargement...</div>

  <!-- État "error" : on affiche l'erreur (v-else-if = sinon si) -->
  <div v-else-if="error" class="error">{{ error }}</div>

  <!-- État "success" : on affiche la liste des produits -->
  <ul v-else>
    <!-- v-for parcourt chaque produit, :key identifie chaque élément de façon unique -->
    <li v-for="p in products" :key="p.id">
      {{ p.name }} - {{ p.price }}€
    </li>
  </ul>
</template>
```

> **Remarque** : `v-if`, `v-else-if`, `v-else` fonctionnent comme un `if / else if / else` classique — un seul bloc s'affiche à la fois.

---

## Annuler une requête (AbortController)

### Le problème

Imagine un champ de recherche : l'utilisateur tape "c", "ch", "cha", "chat". À chaque lettre, on envoie une requête. Mais les réponses peuvent **arriver dans le désordre** ! La réponse pour "c" pourrait arriver APRÈS celle pour "chat" et écraser les bons résultats.

### La solution : AbortController

Un `AbortController` permet d'**annuler** une requête en cours, comme si tu disais au serveur "laisse tomber, j'ai changé d'avis".

```ts
// On stocke le contrôleur actuel (null = aucune requête en cours)
let controller: AbortController | null = null;

async function search(query: string): Promise<void> {
  // Si une requête précédente est en cours, on l'ANNULE
  // Le "?." veut dire "si controller existe, appelle abort()"
  controller?.abort();

  // On crée un NOUVEAU contrôleur pour la nouvelle requête
  controller = new AbortController();

  try {
    // On passe le "signal" du contrôleur au fetch
    // C'est ce signal qui permet d'annuler la requête
    const res = await fetch(`/api/search?q=${query}`, {
      signal: controller.signal,
    });
    // Si on arrive ici, la requête a réussi
    results.value = await res.json();

  } catch (err) {
    // Si la requête a été ANNULÉE (par nous), on ignore l'erreur
    if (err instanceof DOMException && err.name === "AbortError") {
      return; // C'est normal, on a annulé volontairement
    }
    // Sinon, c'est une vraie erreur
    error.value = "Erreur de recherche";
  }
}
```

---

## Mise à jour optimiste (Optimistic Update)

### Le concept

Normalement, on attend la réponse du serveur AVANT de mettre à jour l'interface. Avec une **mise à jour optimiste**, on fait l'inverse :

1. On met à jour l'interface **immédiatement** (on est optimiste, on pense que ça va marcher)
2. On envoie la requête au serveur
3. Si ça échoue, on **annule** le changement (rollback)

**Analogie** : c'est comme cocher "lu" un message avant même que le serveur confirme. Si ça rate, on décoche.

```ts
async function toggleFavorite(productId: number): Promise<void> {
  // On cherche le produit dans notre liste
  const product = products.value.find((p) => p.id === productId);
  if (!product) return; // Si le produit n'existe pas, on arrête

  // ÉTAPE 1 : On sauvegarde l'état actuel (au cas où il faudrait annuler)
  const wasFavorite = product.favorite;

  // ÉTAPE 2 : On change l'état IMMÉDIATEMENT dans l'interface (optimiste !)
  product.favorite = !product.favorite;

  try {
    // ÉTAPE 3 : On envoie le changement au serveur
    await fetch(`/api/products/${productId}/favorite`, {
      method: "PATCH",   // PATCH = modifier partiellement une ressource
      body: JSON.stringify({ favorite: product.favorite }), // On envoie le nouvel état
    });
    // Si on arrive ici, le serveur a confirmé, tout va bien !

  } catch {
    // ÉTAPE 4 (si échec) : On ANNULE le changement (rollback)
    product.favorite = wasFavorite;
    error.value = "Impossible de mettre à jour le favori";
  }
}
```

---

## Réessayer automatiquement (Retry)

Parfois, un appel réseau échoue juste parce que le réseau a eu un hoquet. On peut réessayer automatiquement :

```ts
// Cette fonction réessaie un appel jusqu'à "maxRetries" fois
// Si ça échoue à chaque fois, elle renvoie l'erreur
async function fetchWithRetry<T>(
  fetcher: () => Promise<T>,   // La fonction à réessayer
  maxRetries = 3,              // Nombre max de tentatives (3 par défaut)
  delay = 1000,                // Délai entre les tentatives en millisecondes (1s par défaut)
): Promise<T> {

  // On boucle sur le nombre de tentatives
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // On essaie d'exécuter la fonction
      return await fetcher(); // Si ça marche, on retourne le résultat et on sort
    } catch (err) {
      // Si c'est la DERNIÈRE tentative et ça échoue, on renvoie l'erreur
      if (attempt === maxRetries - 1) throw err;

      // Sinon, on attend un peu avant de réessayer
      // Le délai augmente à chaque tentative (1s, 2s, 3s...)
      await new Promise((resolve) => setTimeout(resolve, delay * (attempt + 1)));
    }
  }
  throw new Error("Unreachable"); // On n'arrive jamais ici, mais TypeScript a besoin de ça
}
```

**Utilisation** :

```ts
// On réessaie de charger les produits jusqu'à 3 fois
const produits = await fetchWithRetry(() => fetch("/api/products").then(r => r.json()));
```

---

## Composable `useFetch` : un outil réutilisable

### C'est quoi un composable ?

Un **composable**, c'est une fonction réutilisable qui encapsule de la logique Vue. Au lieu de copier-coller le même code `fetch + loading + error` dans chaque composant, on le met dans un composable qu'on peut réutiliser partout.

**Analogie** : c'est comme une machine à café. Au lieu de préparer le café à la main à chaque fois (moudre, chauffer l'eau, filtrer...), tu appuies sur un bouton et la machine fait tout.

```ts
// composables/useFetch.ts

// On importe les outils Vue nécessaires
import { ref, watchEffect, type Ref } from "vue";

// On décrit ce que notre composable va retourner
interface UseFetchReturn<T> {
  data: Ref<T | null>;          // Les données (null si pas encore chargées)
  error: Ref<string | null>;    // Le message d'erreur (null si pas d'erreur)
  isLoading: Ref<boolean>;      // Est-ce qu'on charge en ce moment ?
  refetch: () => Promise<void>; // Une fonction pour re-charger les données
}

// Le composable lui-même
// "url" peut être un string fixe OU un Ref<string> (qui peut changer)
export function useFetch<T>(url: Ref<string> | string): UseFetchReturn<T> {

  // On crée nos 3 variables réactives
  const data = ref<T | null>(null) as Ref<T | null>;  // Les données
  const error = ref<string | null>(null);               // L'erreur éventuelle
  const isLoading = ref(false);                          // L'état de chargement

  // La fonction qui effectue vraiment le fetch
  async function doFetch(): Promise<void> {
    // Si url est un Ref, on prend sa .value, sinon on prend le string directement
    const urlValue = typeof url === "string" ? url : url.value;

    isLoading.value = true;  // On commence à charger
    error.value = null;       // On efface les anciennes erreurs

    try {
      const res = await fetch(urlValue);                    // On appelle l'API
      if (!res.ok) throw new Error(`HTTP ${res.status}`);   // On vérifie la réponse
      data.value = await res.json();                         // On stocke les données
    } catch (err) {
      // En cas d'erreur, on stocke le message
      error.value = err instanceof Error ? err.message : "Erreur";
    } finally {
      isLoading.value = false; // On a fini de charger (succès ou échec)
    }
  }

  // Si l'URL est réactive (Ref), on utilise watchEffect pour
  // RE-CHARGER automatiquement quand l'URL change
  if (typeof url !== "string") {
    watchEffect(() => {
      doFetch(); // Se relance à chaque changement de url.value
    });
  } else {
    doFetch(); // URL fixe : on charge une seule fois
  }

  // On retourne tout ce dont le composant a besoin
  return { data, error, isLoading, refetch: doFetch };
}
```

### Utilisation dans un composant

```vue
<script setup lang="ts">
import { useFetch } from "@/composables/useFetch";

// Définition du type de données attendu
interface Product {
  id: number;
  name: string;
  price: number;
}

// Une seule ligne pour tout gérer ! 🎉
// On récupère data, error, isLoading et une fonction pour recharger
const { data: products, error, isLoading, refetch } = useFetch<Product[]>("/api/products");
</script>

<template>
  <div v-if="isLoading">Chargement...</div>
  <div v-else-if="error" class="error">{{ error }}</div>
  <ul v-else-if="products">
    <li v-for="p in products" :key="p.id">{{ p.name }} — {{ p.price }}€</li>
  </ul>

  <!-- Un bouton pour recharger les données -->
  <button @click="refetch">Recharger</button>
</template>
```

---

## Récapitulatif

| Concept | À quoi ça sert |
|---------|----------------|
| `async/await` | Attendre qu'une opération asynchrone se termine |
| `try/catch/finally` | Gérer les erreurs proprement |
| `fetch()` | Faire un appel réseau (API) |
| `loading/error/data` | Les 3 états à toujours gérer dans l'interface |
| `AbortController` | Annuler une requête en cours |
| Optimistic Update | Mettre à jour l'interface avant la confirmation serveur |
| Retry | Réessayer automatiquement en cas d'échec |
| Composable `useFetch` | Réutiliser la logique fetch dans tous les composants |

---

## 🎯 Pratique

### Exercice AS.1 — Fetch basique

Complète ce composant pour charger et afficher une liste d'utilisateurs :

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface User {
  id: number
  name: string
}

const users = ref<User[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// Charge les utilisateurs depuis /api/users
async function fetchUsers() {
  // ???
}

onMounted(() => {
  fetchUsers()
})
</script>
```

<details>
<summary>Solution</summary>

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface User {
  id: number
  name: string
}

const users = ref<User[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

async function fetchUsers() {
  isLoading.value = true
  error.value = null

  try {
    const response = await fetch('/api/users')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    users.value = await response.json()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erreur'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>
```
</details>

---

### Exercice AS.2 — Les 3 états de l'interface

Complète le template pour afficher les 3 états possibles :

```vue
<template>
  <!-- Affiche "Chargement..." si isLoading est true -->
  <!-- ??? -->

  <!-- Affiche l'erreur si error n'est pas null -->
  <!-- ??? -->

  <!-- Affiche la liste si tout va bien -->
  <!-- ??? -->
</template>
```

<details>
<summary>Solution</summary>

```vue
<template>
  <div v-if="isLoading">Chargement...</div>

  <div v-else-if="error" class="error">{{ error }}</div>

  <ul v-else>
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```
</details>

---

### Exercice AS.3 — AbortController

Complète ce code pour annuler les requêtes précédentes quand `search` change :

```ts
import { ref, watchEffect } from 'vue'

const search = ref('')
const results = ref<string[]>([])

watchEffect((onCleanup) => {
  // Crée un AbortController
  // ???

  // Lance la requête avec le signal
  fetch(`/api/search?q=${search.value}`, {
    // ???
  }).then(r => r.json()).then(data => {
    results.value = data
  })

  // Annule la requête si search change avant qu'elle finisse
  // ???
})
```

<details>
<summary>Solution</summary>

```ts
import { ref, watchEffect } from 'vue'

const search = ref('')
const results = ref<string[]>([])

watchEffect((onCleanup) => {
  const controller = new AbortController()

  fetch(`/api/search?q=${search.value}`, {
    signal: controller.signal
  }).then(r => r.json()).then(data => {
    results.value = data
  }).catch(() => {
    // Ignorer l'erreur d'abort
  })

  onCleanup(() => {
    controller.abort()
  })
})
```
</details>

---

### Exercice AS.4 — Type AsyncState

Définis un type `AsyncState` pour représenter les 4 états possibles d'un appel réseau :

```ts
// idle, loading, error (avec message), success (avec données)
type AsyncState<T> = ???
```

<details>
<summary>Solution</summary>

```ts
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; data: T }
```
</details>

---

## Exercice

→ `exercices/07-crud-api/ENONCE.md`

## Suite

→ `cours/02-intermediaire/04-formulaires-et-validation.md`
