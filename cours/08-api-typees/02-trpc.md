# 02 — tRPC (TypeScript Remote Procedure Call)

> ⚠️ **tRPC est une technologie très moderne, pas encore mainstream.**
> Elle est passionnante mais pas encore utilisée partout en entreprise.
> C'est un outil à connaître pour ta culture, pas un prérequis.

---

## 📻 L'analogie : le talkie-walkie

Imagine que ton **frontend** (l'interface utilisateur) et ton **backend** (le serveur) communiquent par talkie-walkie :

| Technologie | Analogie |
|---|---|
| **REST** | Ton frontend envoie une **lettre** au serveur. Il faut connaître l'adresse exacte (`/api/users`), le format du courrier (`GET`, `POST`...), et espérer que la réponse corresponde à ce qu'on attend. |
| **GraphQL** | Ton frontend remplit un **bon de commande détaillé** : "Je veux le nom et l'email, rien d'autre." Mieux, mais il faut quand même apprendre le langage GraphQL. |
| **tRPC** | Ton frontend et ton backend parlent **la même langue** sur un talkie-walkie. Le frontend appelle directement les fonctions du serveur comme si elles étaient locales. Pas de traduction nécessaire ! |

**Le secret de tRPC :** comme le frontend ET le backend sont écrits en TypeScript, ils partagent les mêmes types. Pas besoin de schéma, pas besoin de génération de code.

---

## 📖 Rappel : c'est quoi "appeler une fonction" ?

En JavaScript/TypeScript, appeler une fonction c'est simple :

```ts
// Définir une fonction
function additionner(a: number, b: number): number {
  return a + b;   // Renvoie la somme de a et b
}

// Appeler la fonction
const resultat = additionner(3, 5); // resultat = 8
```

**Le rêve de tRPC :** que tu puisses appeler une fonction **du serveur** aussi simplement que ça, depuis ton navigateur. Et c'est exactement ce que ça fait !

```ts
// Avec tRPC, appeler le serveur ressemble à ça :
const users = await trpc.user.getAll.query();
// C'est AUSSI SIMPLE qu'un appel de fonction local !
// Et TypeScript connaît automatiquement le type du résultat
```

---

## 🔑 Les concepts clés

### Procédure = une fonction exposée par le serveur

En tRPC, chaque opération du serveur est appelée une **procédure**. Il en existe 2 types :

| Type | Rôle | Équivalent REST |
|---|---|---|
| **query** | Lire des données | `GET` |
| **mutation** | Créer / modifier / supprimer | `POST`, `PUT`, `DELETE` |

### Zod = un outil pour valider les données

**Zod** est une bibliothèque qui vérifie que les données reçues ont le bon format :

```ts
import { z } from "zod";

// On décrit la forme attendue des données
const UserInput = z.object({
  name: z.string().min(1),   // name doit être un texte d'au moins 1 caractère
  email: z.string().email(), // email doit être un texte au format email
});

// Si quelqu'un envoie { name: "", email: "pas-un-email" }
// → Zod rejette automatiquement avec un message d'erreur clair
```

---

## ⚙️ Mettre en place tRPC — côté serveur (backend)

> 💡 tRPC nécessite un backend en TypeScript (Node.js). Il ne fonctionne PAS avec un backend PHP, Python, Java, etc.

### Étape 1 : Initialiser tRPC

```ts
// server/trpc.ts
// Ce fichier initialise tRPC et exporte les outils de base

import { initTRPC } from "@trpc/server"; // L'outil principal de tRPC
import { z } from "zod";                  // Pour valider les données entrantes

// On initialise tRPC (une seule fois dans le projet)
const t = initTRPC.create();

// On exporte les outils qu'on va utiliser partout :
export const router = t.router;               // Pour regrouper les procédures
export const publicProcedure = t.procedure;   // Pour créer des procédures accessibles à tous
```

### Étape 2 : Créer des procédures (les "fonctions" du serveur)

```ts
// server/routers/user.ts
// Ce fichier contient toutes les opérations liées aux utilisateurs

import { z } from "zod";                            // Pour valider les données
import { router, publicProcedure } from "../trpc";  // Nos outils tRPC

export const userRouter = router({

  // --- QUERY : lire tous les utilisateurs ---
  getAll: publicProcedure
    .query(async () => {
      // En vrai, on irait chercher en base de données
      // Ici on retourne des données fictives pour l'exemple
      return [
        { id: 1, name: "Alice", email: "alice@test.com" },
        { id: 2, name: "Bob", email: "bob@test.com" },
      ];
    }),

  // --- QUERY : lire UN utilisateur par son id ---
  getById: publicProcedure
    .input(                          // .input() = "quelles données j'attends en entrée ?"
      z.object({ id: z.number() })   // On attend un objet avec un id numérique
    )
    .query(async ({ input }) => {    // input contient les données validées
      // input.id est garanti d'être un nombre grâce à Zod
      return { id: input.id, name: "Alice", email: "alice@test.com" };
    }),

  // --- MUTATION : créer un utilisateur ---
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),     // Le nom doit avoir au moins 1 caractère
        email: z.string().email(),   // L'email doit être un vrai email
      }),
    )
    .mutation(async ({ input }) => {
      // On crée l'utilisateur (en vrai : insertion en base de données)
      // Date.now() génère un id unique basé sur le timestamp
      return { id: Date.now(), ...input };
      // ...input = "copie toutes les propriétés de input ici" (spread operator)
    }),
});
```

### Étape 3 : Assembler le routeur principal

```ts
// server/index.ts
// Ce fichier assemble tous les routeurs en un seul

import { router } from "./trpc";                // L'outil router
import { userRouter } from "./routers/user";    // Le routeur des utilisateurs

// On crée le routeur principal de l'application
export const appRouter = router({
  user: userRouter,   // Toutes les procédures "user" sont regroupées ici
  // On pourrait ajouter : post: postRouter, comment: commentRouter, etc.
});

// ⭐ IMPORTANT : on exporte le TYPE du routeur
// C'est CE type que le frontend va importer pour avoir l'autocomplétion
export type AppRouter = typeof appRouter;
```

---

## 💻 Mettre en place tRPC — côté frontend (Vue 3)

### Installation

```bash
# On installe le client tRPC et le serveur (pour les types partagés)
pnpm add @trpc/client @trpc/server
```

### Créer le client tRPC

```ts
// utils/trpc.ts
// Ce fichier crée le "pont" entre le frontend et le backend

// createTRPCProxyClient = crée un client qui "mime" les fonctions du serveur
// httpBatchLink = envoie les requêtes par lot (optimisation)
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

// ⭐ On importe uniquement le TYPE du routeur backend
// Ça ne copie PAS le code du serveur, juste les informations de typage
import type { AppRouter } from "../server";

// On crée le client tRPC
export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/api/trpc",   // L'URL où le serveur tRPC écoute
    }),
  ],
});

// Maintenant, trpc.user.getAll.query() appelle automatiquement le serveur
// ET TypeScript sait exactement quel type de données sera renvoyé !
```

---

## 🖥️ Utiliser tRPC dans un composant Vue

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { trpc } from "@/utils/trpc";  // Notre client tRPC

// Le tableau d'utilisateurs (vide au départ)
// Awaited<ReturnType<...>> = "le type que renvoie cette fonction"
// C'est un peu verbeux, mais ça donne le typage automatique
const users = ref<Awaited<ReturnType<typeof trpc.user.getAll.query>>>([]);

// Un booléen pour savoir si on charge les données
const isLoading = ref(false);

// Fonction pour charger les utilisateurs depuis le serveur
async function loadUsers(): Promise<void> {
  isLoading.value = true;       // On commence à charger
  try {
    // ✨ LA MAGIE DE tRPC :
    // On appelle trpc.user.getAll.query() comme une fonction locale
    // Mais en réalité, ça envoie une requête HTTP au serveur !
    users.value = await trpc.user.getAll.query();
    // TypeScript sait que users.value est un tableau de { id, name, email }
  } finally {
    isLoading.value = false;    // Chargement terminé (même si erreur)
  }
}

// Fonction pour créer un nouvel utilisateur
async function createUser(name: string, email: string): Promise<void> {
  // .mutate() pour les mutations (écriture)
  const newUser = await trpc.user.create.mutate({ name, email });
  // TypeScript sait que newUser a les propriétés id, name, email
  // Pas besoin de deviner ou de lire la doc de l'API !

  users.value.push(newUser);   // On ajoute le nouvel utilisateur à la liste
}

// onMounted = "quand le composant apparaît à l'écran, exécute cette fonction"
onMounted(loadUsers);
</script>

<template>
  <div v-if="isLoading">Chargement...</div>
  <ul v-else>
    <li v-for="user in users" :key="user.id">
      {{ user.name }} — {{ user.email }}
    </li>
  </ul>
</template>
```

---

## 🧩 Bonus : créer un composable réutilisable pour tRPC

> ⚡ **Section avancée** — Utile quand tu maîtrises les composables Vue.

Si tu utilises tRPC souvent, tu peux créer un composable (comme `useQuery` d'Apollo) :

```ts
// composables/useTrpcQuery.ts
import { ref, onMounted } from "vue";
import type { Ref } from "vue";

// Ce composable prend une fonction qui renvoie une Promise
// et gère automatiquement le chargement, les erreurs, etc.
export function useTrpcQuery<T>(queryFn: () => Promise<T>) {
  const data = ref<T | null>(null) as Ref<T | null>;  // Les données reçues
  const error = ref<string | null>(null);              // Le message d'erreur éventuel
  const isLoading = ref(false);                        // Est-ce qu'on charge ?

  // Fonction qui exécute la requête
  async function execute(): Promise<void> {
    isLoading.value = true;    // Début du chargement
    error.value = null;        // On efface l'erreur précédente
    try {
      data.value = await queryFn();   // On exécute la fonction passée en paramètre
    } catch (err) {
      // Si erreur, on récupère le message
      error.value = err instanceof Error ? err.message : "Erreur inconnue";
    } finally {
      isLoading.value = false; // Fin du chargement
    }
  }

  // On exécute automatiquement quand le composant se monte
  onMounted(execute);

  // On retourne tout pour que le composant puisse les utiliser
  return { data, error, isLoading, refetch: execute };
}
```

**Utilisation simplifiée :**

```vue
<script setup lang="ts">
import { useTrpcQuery } from "@/composables/useTrpcQuery";
import { trpc } from "@/utils/trpc";

// Une seule ligne pour charger les données avec gestion d'erreur + loading !
const { data: users, isLoading, error } = useTrpcQuery(
  () => trpc.user.getAll.query()
);
</script>

<template>
  <div v-if="isLoading">Chargement...</div>
  <div v-else-if="error">Erreur : {{ error }}</div>
  <ul v-else-if="users">
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

---

## 📊 REST vs GraphQL vs tRPC — Le tableau comparatif

| | REST | GraphQL | tRPC |
|---|---|---|---|
| **Difficulté** | Facile | Moyen | Moyen |
| **Type safety** | Manuelle (tu écris les types toi-même) | Avec code generation (outil externe) | **Native** (automatique !) |
| **Langages backend** | Tous (PHP, Python, Java, Node...) | Tous | **TypeScript uniquement** |
| **Complexité à mettre en place** | Faible | Élevée (schéma, resolvers...) | Faible |
| **Écosystème** | Énorme (partout) | Large | En croissance |
| **Quand l'utiliser** | Par défaut, partout | Gros projets, données complexes | Projets full-stack TypeScript |

### En résumé :
- **REST** → Le standard. Commence toujours par là.
- **GraphQL** → Utile quand tu as beaucoup de données imbriquées et des clients variés (web, mobile).
- **tRPC** → Le rêve du développeur full-stack TypeScript. Parfait quand tu contrôles le frontend ET le backend.

---

## Suite

→ `cours/09-accessibilite/01-fondamentaux-wcag.md`
