# 01 — GraphQL avec Vue 3

> ⚠️ **GraphQL est une ALTERNATIVE à REST, pas un remplacement obligatoire.**
> Tu peux très bien construire toute ta carrière avec REST uniquement.
> GraphQL est utile dans certains cas précis qu'on va voir ensemble.

---

## 🍽️ L'analogie : REST vs GraphQL

Imagine que tu vas au restaurant :

| | REST | GraphQL |
|---|---|---|
| **Principe** | Menu fixe : tu commandes un plat, tu reçois TOUT ce qui va avec (même la salade que tu ne voulais pas) | Buffet à volonté : tu choisis EXACTEMENT les ingrédients que tu veux dans ton assiette |
| **Exemple** | `GET /api/users/1` → tu reçois nom, email, avatar, adresse, date de création... TOUT | Tu demandes : "Je veux juste le nom et l'email" → tu ne reçois QUE ça |
| **Inconvénient** | Parfois trop de données (over-fetching), parfois pas assez (under-fetching) | Plus complexe à mettre en place |

---

## 📖 Rappel : c'est quoi une API ?

Une **API** (Application Programming Interface) c'est un "serveur" à qui ton application peut poser des questions et envoyer des ordres :
- "Donne-moi la liste des utilisateurs" → **lire** des données
- "Crée un nouvel utilisateur" → **écrire** des données

Avec **REST**, tu fais des requêtes HTTP classiques (`GET`, `POST`, `PUT`, `DELETE`) vers des URLs précises.

Avec **GraphQL**, tu envoies une **requête texte** qui décrit exactement ce que tu veux, toujours vers **une seule URL** (souvent `/graphql`).

---

## 🔑 Les 3 concepts clés de GraphQL

### 1. Query (lire des données)

Une **query** c'est une question : "Donne-moi ces données".

```graphql
# Ceci est une query GraphQL
# On demande l'utilisateur avec l'id 1
# Mais on ne veut QUE son nom et son email, rien d'autre
query {
  user(id: 1) {
    name       # ← Je veux le nom
    email      # ← Je veux l'email
    # On ne demande PAS avatar, createdAt, etc.
    # Donc le serveur ne les envoie PAS → économie de données !
  }
}
```

**Comparaison avec REST :**
```
REST :     GET /api/users/1  → { id, name, email, avatar, createdAt, address, phone... }
GraphQL :  query { user(id: 1) { name, email } }  → { name, email }  ← juste ce qu'on a demandé !
```

### 2. Mutation (écrire / modifier des données)

Une **mutation** c'est un ordre : "Crée / modifie / supprime quelque chose".

```graphql
# Ceci est une mutation GraphQL
# On demande au serveur de CRÉER un utilisateur
mutation {
  createUser(input: { name: "Alice", email: "alice@test.com" }) {
    id         # ← Après la création, renvoie-moi l'id du nouvel utilisateur
    name       # ← Et son nom (pour confirmer)
  }
}
```

**Équivalent REST :** `POST /api/users` avec un body JSON.

### 3. Fragment (réutiliser des morceaux de requête)

Un **fragment** c'est un "morceau de requête réutilisable" — comme une variable pour éviter de se répéter.

```graphql
# On définit un fragment = un groupe de champs qu'on réutilisera
fragment UserBasicInfo on User {
  id           # ← Ces 3 champs...
  name
  email
}

# Maintenant on peut l'utiliser dans plusieurs requêtes
query {
  user(id: 1) {
    ...UserBasicInfo    # ← "Inclus tous les champs du fragment ici"
  }
  allUsers {
    ...UserBasicInfo    # ← Réutilisé ! Pas besoin de réécrire id, name, email
  }
}
```

---

## ⚙️ Installer GraphQL dans un projet Vue 3

Pour utiliser GraphQL avec Vue 3, on utilise la bibliothèque **Apollo** (le client GraphQL le plus populaire).

```bash
# On installe 3 paquets :
# @apollo/client    → le client GraphQL (gère les requêtes)
# @vue/apollo-composable → les composables Vue 3 (useQuery, useMutation)
# graphql           → le langage GraphQL lui-même
pnpm add @apollo/client @vue/apollo-composable graphql
```

### Étape 1 : Configurer le client Apollo

```ts
// plugins/apollo.ts
// Ce fichier configure la connexion vers ton serveur GraphQL

// On importe les outils d'Apollo pour créer le client
import {
  ApolloClient,          // Le client principal qui gère tout
  InMemoryCache,         // Un "cache" = mémoire temporaire pour éviter de re-demander les mêmes données
  createHttpLink,        // Crée la connexion HTTP vers le serveur
} from "@apollo/client/core";

// On crée le "lien" HTTP = l'adresse de notre serveur GraphQL
const httpLink = createHttpLink({
  // import.meta.env.VITE_GRAPHQL_URL = variable d'environnement (dans .env)
  // Si elle n'existe pas, on utilise "/graphql" par défaut
  uri: import.meta.env.VITE_GRAPHQL_URL || "/graphql",
});

// On crée le client Apollo avec le lien et le cache
export const apolloClient = new ApolloClient({
  link: httpLink,          // ← Où envoyer les requêtes
  cache: new InMemoryCache(), // ← Garder les résultats en mémoire pour aller plus vite
});
```

### Étape 2 : Brancher Apollo à Vue

```ts
// main.ts
import { createApp } from "vue";
import App from "./App.vue";

// On importe le "symbole" qui permet à tous les composants d'accéder à Apollo
import { DefaultApolloClient } from "@vue/apollo-composable";
// Et notre client configuré juste au-dessus
import { apolloClient } from "./plugins/apollo";

const app = createApp(App);

// app.provide() rend apolloClient accessible à TOUS les composants
// C'est comme une variable globale, mais propre à Vue
app.provide(DefaultApolloClient, apolloClient);

app.mount("#app");
```

---

## 📖 Faire une Query (lire des données)

Maintenant qu'Apollo est installé, voici comment récupérer des données dans un composant Vue :

```vue
<script setup lang="ts">
// On importe le composable useQuery (fourni par Apollo)
import { useQuery } from "@vue/apollo-composable";
// gql = une fonction qui transforme du texte GraphQL en objet compréhensible par Apollo
import gql from "graphql-tag";
// computed = valeur calculée automatiquement (rappel Vue 3)
import { computed } from "vue";

// --- Typage TypeScript ---
// On décrit la forme d'un utilisateur
interface User {
  id: number;      // Un identifiant numérique
  name: string;    // Le nom (texte)
  email: string;   // L'email (texte)
}

// On décrit la forme de la réponse de notre query
interface UsersQuery {
  users: User[];   // La clé "users" contiendra un tableau d'utilisateurs
}

// --- La requête GraphQL ---
// On écrit notre query avec gql`...`
// (les backticks ` ` permettent d'écrire du texte sur plusieurs lignes)
const USERS_QUERY = gql`
  query GetUsers {
    users {
      id
      name
      email
    }
  }
`;

// --- Exécuter la query ---
// useQuery() envoie automatiquement la requête quand le composant se charge
// Il retourne 3 choses :
const { result, loading, error } = useQuery<UsersQuery>(USERS_QUERY);
// result  → les données reçues (ou null si pas encore chargé)
// loading → true pendant le chargement, false quand c'est fini
// error   → l'erreur s'il y en a une, sinon null

// On extrait la liste des utilisateurs depuis result
// result.value?.users = "si result a une valeur, prends .users"
// ?? [] = "sinon, utilise un tableau vide" (pour éviter les erreurs)
const users = computed(() => result.value?.users ?? []);
</script>

<template>
  <!-- Affichage conditionnel selon l'état -->

  <!-- Pendant le chargement -->
  <div v-if="loading">Chargement...</div>

  <!-- En cas d'erreur -->
  <div v-else-if="error">{{ error.message }}</div>

  <!-- Quand les données sont prêtes -->
  <ul v-else>
    <!-- On boucle sur chaque utilisateur -->
    <li v-for="user in users" :key="user.id">
      {{ user.name }}
    </li>
  </ul>
</template>
```

---

## ✏️ Faire une Mutation (écrire des données)

Pour créer, modifier ou supprimer des données, on utilise `useMutation` :

```ts
// On importe useMutation (pour les opérations d'écriture)
import { useMutation } from "@vue/apollo-composable";
import gql from "graphql-tag";

// La mutation GraphQL pour créer un utilisateur
// $input est une "variable" GraphQL (comme un paramètre de fonction)
// Le ! veut dire "obligatoire"
const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id       # On récupère l'id du user créé
      name     # Et son nom
      email    # Et son email
    }
  }
`;

// useMutation() nous donne :
// mutate    → la fonction pour exécuter la mutation (renommée en createUser)
// loading   → true pendant l'exécution (renommé en creating)
const { mutate: createUser, loading: creating } = useMutation(CREATE_USER);

// Fonction appelée quand l'utilisateur clique sur "Envoyer"
async function handleSubmit(): Promise<void> {
  // On exécute la mutation en passant les variables
  await createUser({
    input: {
      name: form.name,    // Le nom saisi dans le formulaire
      email: form.email,  // L'email saisi dans le formulaire
    },
  });
  // Si tout va bien, le serveur a créé l'utilisateur !
}
```

---

## 🧩 Rappel : `async` / `await`

Si tu as oublié :
- `async` devant une fonction = "cette fonction fait quelque chose qui prend du temps"
- `await` devant un appel = "attends que ce soit fini avant de continuer"

```ts
// Sans async/await (difficile à lire) :
createUser({ input: data }).then((result) => { /* ... */ });

// Avec async/await (plus lisible) :
const result = await createUser({ input: data });
```

---

## 🔧 Code Generation : créer les types automatiquement

> ⚡ **Section avancée** — À découvrir plus tard quand tu seras à l'aise avec GraphQL.

Le problème : quand on écrit nos interfaces TypeScript à la main (`interface User { ... }`), on peut se tromper ou oublier un champ.

La solution : **GraphQL Code Generator** lit le schéma de ton serveur GraphQL et **génère automatiquement** les types TypeScript + des composables Vue prêts à l'emploi.

### Installation

```bash
# On installe les outils de génération de code (en dépendances de développement)
pnpm add -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-vue-apollo
```

### Configuration

```yaml
# codegen.yml — fichier de configuration à la racine du projet

# L'adresse de ton serveur GraphQL (pour lire le schéma)
schema: http://localhost:4000/graphql

# Où chercher tes fichiers .graphql dans le projet
documents: "src/**/*.graphql"

# Ce qui sera généré
generates:
  src/generated/graphql.ts:    # ← Le fichier qui sera créé automatiquement
    plugins:
      - typescript               # ← Génère les types (User, Post, etc.)
      - typescript-operations    # ← Génère les types des queries/mutations
      - typescript-vue-apollo    # ← Génère les composables Vue (useGetUsersQuery, etc.)
```

### Lancer la génération

```bash
# Cette commande lit le schéma du serveur et crée le fichier src/generated/graphql.ts
pnpm graphql-codegen
```

**Résultat :** des composables Vue typés sont automatiquement générés. Plus besoin d'écrire les interfaces à la main — le code généré est toujours synchronisé avec le serveur.

---

## 📊 Quand utiliser GraphQL ?

| Situation | REST suffit ✅ | GraphQL utile 🔶 |
|---|---|---|
| Application simple (CRUD basique) | ✅ Oui | Pas nécessaire |
| Beaucoup de données imbriquées (users → posts → comments) | Plusieurs requêtes REST nécessaires | ✅ Une seule query |
| Application mobile (économie de bande passante) | Over-fetching fréquent | ✅ Données précises |
| Équipe backend et frontend séparées | Négociation des endpoints | ✅ Le frontend choisit ses données |

---

## 🎯 Pratique

### Exercice GQL.1 — Écrire une query

Écris une query GraphQL pour récupérer les utilisateurs avec leur nom et email :

```graphql
# ???
```

<details>
<summary>Solution</summary>

```graphql
query GetUsers {
  users {
    id
    name
    email
  }
}
```
</details>

---

### Exercice GQL.2 — Query avec paramètre

Écris une query pour récupérer un utilisateur spécifique par son ID :

```graphql
# ???
```

<details>
<summary>Solution</summary>

```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    posts {
      title
    }
  }
}
```
</details>

---

### Exercice GQL.3 — Mutation

Écris une mutation pour créer un utilisateur :

```graphql
# ???
```

<details>
<summary>Solution</summary>

```graphql
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
    email
  }
}
```
</details>

---

### Exercice GQL.4 — Utiliser useQuery

Complète ce composant pour charger et afficher les utilisateurs :

```vue
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'

const GET_USERS = gql`
  # ???
`

const { result, loading, error } = ???
</script>
```

<details>
<summary>Solution</summary>

```vue
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'

const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
      email
    }
  }
`

const { result, loading, error } = useQuery(GET_USERS)
</script>
```
</details>

---

## Suite

→ `cours/08-api-typees/02-trpc.md`
