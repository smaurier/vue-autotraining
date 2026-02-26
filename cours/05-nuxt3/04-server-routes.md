# 04 — Server routes (les routes serveur)

## C'est quoi une "server route" ?

### L'analogie du restaurant 🍽️

Imagine un restaurant :

- **La salle (le navigateur / le front-end)** → c'est ce que le client voit : le menu, la décoration, les assiettes. C'est votre page Vue/Nuxt affichée dans le navigateur.
- **La cuisine (le serveur / le back-end)** → c'est là où on prépare les plats. Le client ne voit jamais la cuisine, mais c'est là que tout le travail se fait : chercher les ingrédients (les données), les cuisiner (les transformer), les envoyer au client.
- **Le serveur (la personne)** → c'est la "route API" : il fait le lien entre la salle et la cuisine. Le client demande "je veux une pizza", le serveur transmet la commande à la cuisine, et rapporte le plat.

**Une "server route"**, c'est du code qui tourne **sur le serveur** (la cuisine), pas dans le navigateur du visiteur. Le navigateur envoie une **requête** (une demande), et le serveur répond avec des **données** (souvent au format JSON).

### Pourquoi c'est utile ?

- Accéder à une **base de données** (impossible depuis le navigateur directement)
- Garder des **secrets** (clés API, mots de passe) cachés du navigateur
- Faire des **calculs lourds** sans ralentir le navigateur
- **Protéger** certaines opérations (vérifier qu'un utilisateur est connecté)

### La bonne nouvelle avec Nuxt 3

Normalement, pour avoir un serveur, il faut un projet séparé (en Node.js, PHP, Python...). Avec Nuxt 3, **le serveur est intégré dans le même projet** ! Il suffit de créer des fichiers dans le dossier `server/api/`.

---

## 📝 Rappel JavaScript : les fonctions fléchées et `async`

```ts
// Fonction fléchée simple (arrow function)
// C'est un raccourci pour écrire une fonction
const direBonjour = () => {            // () => signifie "fonction qui..."
  return { message: 'Bonjour !' }      // return = renvoyer un résultat
}

// Version encore plus courte (quand il n'y a qu'une ligne)
const direBonjour2 = () => ({ message: 'Bonjour !' })

// Fonction asynchrone (async)
// "async" signifie que la fonction fait quelque chose qui prend du temps
// (lire une base de données, appeler une autre API...)
// "await" signifie "attends que ce soit fini avant de continuer"
const recupererDonnees = async () => {
  const resultat = await uneOperationLente()  // On attend le résultat
  return resultat                               // Puis on le renvoie
}
```

---

## 📝 Rappel : les méthodes HTTP (comment on "parle" à un serveur)

Quand votre navigateur communique avec un serveur, il utilise des **méthodes HTTP**. Pensez-y comme des **verbes d'action** :

| Méthode    | Action         | Analogie restaurant                       | Exemple                    |
|-----------|----------------|-------------------------------------------|----------------------------|
| **GET**    | **Lire**       | "Montrez-moi le menu"                     | Voir la liste des articles |
| **POST**   | **Créer**      | "Je commande une pizza"                   | Créer un nouveau compte    |
| **PUT**    | **Modifier**   | "Changez ma pizza en calzone"             | Modifier son profil        |
| **DELETE** | **Supprimer**  | "Annulez ma commande"                     | Supprimer un article       |

---

## Première server route : "Hello World"

Le plus simple possible — on crée un fichier, et Nuxt fait le reste :

```ts
// server/api/hello.get.ts
// ^^^^^^^^^^^^^^^^^^^^^^^^
// Décortiquons le nom du fichier :
// - server/api/ → le dossier obligatoire pour les routes API
// - hello       → le nom de la route (accessible via /api/hello)
// - .get        → la méthode HTTP (ici GET = lecture)
// - .ts         → c'est du TypeScript

// defineEventHandler = fonction fournie par Nuxt qui dit
// "quand quelqu'un appelle cette route, fais ceci :"
export default defineEventHandler(() => {
  // On renvoie simplement un objet JavaScript
  // Nuxt le convertira automatiquement en JSON
  return { message: 'Hello from server!' }
})

// Résultat : quand on visite /api/hello dans le navigateur
// on voit : { "message": "Hello from server!" }
```

**Testez-le !** Après avoir créé ce fichier, ouvrez votre navigateur à l'adresse `http://localhost:3000/api/hello` — vous verrez la réponse JSON directement.

---

## Convention de nommage des fichiers

Le **nom du fichier** détermine **l'URL** et **la méthode HTTP**. C'est magique : pas besoin de configurer quoi que ce soit !

```
server/api/
  users.get.ts         → GET    /api/users         (lire tous les utilisateurs)
  users.post.ts        → POST   /api/users         (créer un utilisateur)
  users/[id].get.ts    → GET    /api/users/:id     (lire UN utilisateur par son id)
  users/[id].put.ts    → PUT    /api/users/:id     (modifier UN utilisateur)
  users/[id].delete.ts → DELETE /api/users/:id     (supprimer UN utilisateur)
```

> **`[id]`** entre crochets = un **paramètre dynamique**. C'est comme un trou à remplir.
> `/api/users/42` → `id` vaudra `"42"`
> `/api/users/107` → `id` vaudra `"107"`

---

## Exemple concret : une API de contacts

### Étape 1 — Lire tous les contacts (GET)

```ts
// server/api/contacts.get.ts

// Pour l'instant, on simule une "base de données" avec un simple tableau
// (en vrai, on utiliserait une vraie base de données — on verra ça plus bas)
const contacts = [
  { id: 1, name: 'Alice', email: 'alice@mail.com' },
  { id: 2, name: 'Bob', email: 'bob@mail.com' },
]

export default defineEventHandler(() => {
  // On renvoie la liste complète des contacts
  // Le navigateur recevra ce tableau au format JSON
  return contacts
})
// → GET /api/contacts
// → Réponse : [{ id: 1, name: "Alice", ... }, { id: 2, name: "Bob", ... }]
```

### Étape 2 — Lire un seul contact par son ID (GET avec paramètre)

```ts
// server/api/contacts/[id].get.ts
//                      ^^^^ ceci est un paramètre dynamique

export default defineEventHandler((event) => {
  // "event" contient toutes les informations sur la requête
  // (qui a appelé, avec quels paramètres, etc.)

  // getRouterParam récupère la valeur du paramètre [id] dans l'URL
  const id = getRouterParam(event, 'id')  // Résultat : une string comme "42"

  // On convertit en nombre avec Number()
  // car dans l'URL, tout est du texte
  const idNombre = Number(id)

  // En vrai, on chercherait dans une base de données
  // Ici on simule avec un objet en dur
  return { id: idNombre, name: 'Alice', email: 'alice@mail.com' }
})
// → GET /api/contacts/1
// → Réponse : { id: 1, name: "Alice", email: "alice@mail.com" }
```

---

## 📝 Rappel : c'est quoi un "body" de requête ?

Quand vous envoyez une **commande** au serveur (POST ou PUT), vous devez lui envoyer **des données**. Ces données sont dans le **"body"** (le corps) de la requête.

Pensez à un **formulaire papier** : quand vous remplissez un formulaire d'inscription, vous écrivez votre nom, email, etc. Le body, c'est ce formulaire rempli.

```
Le navigateur envoie :
┌──────────────────────────────┐
│ POST /api/contacts           │  ← la méthode et l'URL
│                              │
│ Body (le "formulaire") :     │
│ {                            │
│   "name": "Charlie",         │  ← les données envoyées
│   "email": "charlie@mail.com"│
│ }                            │
└──────────────────────────────┘
```

---

## Étape 3 — Créer un contact (POST avec body)

```ts
// server/api/contacts.post.ts

// On définit un "type" TypeScript pour décrire
// la forme des données qu'on attend dans le body
interface CreateContactDto {
  name: string     // On attend un nom (du texte)
  email: string    // On attend un email (du texte)
}
// "Dto" = Data Transfer Object, un nom courant pour dire
// "voilà la forme des données qu'on transfère"

export default defineEventHandler(async (event) => {
  // readBody lit le "formulaire" envoyé par le navigateur
  // <CreateContactDto> dit à TypeScript la forme attendue
  // "await" car lire le body prend un petit moment
  const body = await readBody<CreateContactDto>(event)

  // === Validation : on vérifie que les données sont correctes ===
  // C'est comme un serveur qui vérifie que vous avez bien rempli
  // tous les champs obligatoires du formulaire
  if (!body.name || !body.email) {
    // Si un champ manque, on renvoie une erreur
    throw createError({
      statusCode: 400,          // 400 = "Bad Request" (mauvaise demande)
      statusMessage: 'Le nom et l\'email sont obligatoires',
    })
  }

  // On crée le contact (ici on simule avec Date.now() comme ID)
  // Date.now() donne le nombre de millisecondes depuis le 1er janvier 1970
  // C'est un moyen rapide d'avoir un nombre unique
  const nouveauContact = {
    id: Date.now(),       // ID unique auto-généré
    ...body,              // ...body "étale" le contenu de body ici
                          // c'est comme écrire : name: body.name, email: body.email
  }

  // On renvoie le contact créé (avec son nouveau ID)
  return nouveauContact
})
```

> **Les codes de statut HTTP** (les nombres comme 400) sont des **codes de réponse standards** :
> - **200** = OK, tout va bien ✅
> - **400** = Mauvaise requête (il manque des infos) ❌
> - **401** = Non autorisé (il faut être connecté) 🔒
> - **404** = Pas trouvé (cette page/ressource n'existe pas) 🔍
> - **500** = Erreur serveur (bug dans le code du serveur) 💥

---

## 📝 Rappel : c'est quoi les "query params" ?

Les **query parameters** (paramètres de requête) sont des informations ajoutées **à la fin de l'URL** après un `?`.

```
https://monsite.com/api/search?q=vue&page=2
                               ^^^^^^^^^^^^^^^^
                               Ce sont les query params !

Décomposition :
- q=vue     → le paramètre "q" vaut "vue" (le terme de recherche)
- &         → séparateur entre les paramètres
- page=2    → le paramètre "page" vaut "2"
```

C'est comme les **filtres dans un catalogue** : "je veux les produits de la catégorie 'chaussures', triés par prix, page 3".

---

## Utiliser les query params

```ts
// server/api/search.get.ts

export default defineEventHandler((event) => {
  // getQuery lit tous les paramètres après le "?" dans l'URL
  const query = getQuery(event)

  // On récupère chaque paramètre individuellement
  const q = query.q as string          // "as string" dit à TypeScript "c'est du texte"
  const page = Number(query.page) || 1 // Convertir en nombre, ou 1 par défaut

  // En vrai on ferait une recherche en base de données ici
  // Pour l'instant on renvoie juste les infos reçues
  return {
    results: [],       // Les résultats de recherche (vide pour l'instant)
    query: q,          // Le terme cherché
    page: page,        // La page demandée
  }
})
// → GET /api/search?q=vue&page=2
// → Réponse : { results: [], query: "vue", page: 2 }
```

---

## Middleware serveur (le videur du restaurant)

Un **middleware**, c'est du code qui s'exécute **avant** chaque requête. C'est comme un **videur** à l'entrée du restaurant : il vérifie que vous avez le droit d'entrer avant de vous laisser passer.

```ts
// server/middleware/auth.ts
// Ce fichier est dans server/middleware/ (pas server/api/)
// Il s'exécute automatiquement AVANT chaque requête API

export default defineEventHandler((event) => {
  // On lit le header "authorization" de la requête
  // Un "header" c'est une info invisible envoyée avec la requête
  // (comme une carte d'identité qu'on montre au videur)
  const token = getHeader(event, 'authorization')

  // Si l'URL commence par /api/admin ET qu'il n'y a pas de token...
  if (event.path.startsWith('/api/admin') && !token) {
    // ...on bloque l'accès !
    throw createError({
      statusCode: 401,              // 401 = Non autorisé
      statusMessage: 'Accès refusé : vous devez être connecté',
    })
  }

  // Si tout est OK, le code continue et la vraie route API s'exécute
  // (pas besoin de "return" ici, on laisse juste passer)
})
```

---

## Runtime config (les secrets du chef)

Certaines informations sont **secrètes** et ne doivent **jamais** être visibles dans le navigateur : clés d'API, mots de passe de base de données, etc.

Nuxt offre un système de **configuration** qui sépare ce qui est secret de ce qui est public :

```ts
// nuxt.config.ts — la configuration du projet
export default defineNuxtConfig({
  runtimeConfig: {
    // ⚠️ Ceci est SECRET (uniquement accessible côté serveur)
    apiSecret: 'ma-cle-super-secrete',

    // Ceci est PUBLIC (accessible partout, y compris dans le navigateur)
    public: {
      apiBase: 'https://api.monsite.com',
    },
  },
})
```

```ts
// server/api/external.get.ts
// Exemple : appeler une API externe en utilisant notre clé secrète

export default defineEventHandler(() => {
  // useRuntimeConfig() récupère la configuration
  const config = useRuntimeConfig()

  // config.apiSecret → accessible UNIQUEMENT ici (côté serveur)
  // config.public.apiBase → accessible aussi côté client (navigateur)

  // $fetch = fonction de Nuxt pour faire des requêtes HTTP
  // C'est comme un navigateur interne qui va chercher des données
  return $fetch('https://external-api.com/data', {
    headers: {
      'X-API-Key': config.apiSecret,   // On envoie la clé secrète
    },                                   // Le navigateur ne la verra jamais !
  })
})
```

---

## Connexion à une base de données (le garde-manger)

Dans un vrai projet, on ne stocke pas les données dans des tableaux JavaScript (elles disparaîtraient à chaque redémarrage !). On utilise une **base de données**.

Pensez à la base de données comme le **garde-manger du restaurant** : c'est là que tous les ingrédients (données) sont rangés de façon organisée et permanente.

Voici un exemple avec **Drizzle ORM** (un outil qui simplifie les interactions avec la base de données) :

```ts
// server/utils/db.ts
// Ce fichier configure la connexion à la base de données
// Il est dans server/utils/ → accessible automatiquement dans toutes les routes serveur

import { drizzle } from 'drizzle-orm/better-sqlite3'  // L'outil pour parler à la BDD
import Database from 'better-sqlite3'                   // Le "moteur" de la BDD SQLite

// On ouvre (ou crée) un fichier de base de données
const sqlite = new Database('db.sqlite')

// On crée notre outil de communication avec la BDD
// "drizzle" simplifie l'écriture des requêtes
export const db = drizzle(sqlite)
```

```ts
// server/api/users.get.ts
// Route qui récupère tous les utilisateurs depuis la base de données

import { db } from '@/server/utils/db'       // Notre connexion à la BDD
import { users } from '@/server/db/schema'    // La "table" users (la structure)

export default defineEventHandler(async () => {
  // db.select().from(users) = "Sélectionne tout depuis la table users"
  // C'est l'équivalent de la requête SQL : SELECT * FROM users
  // "await" car accéder à la BDD prend du temps
  return await db.select().from(users)
})
```

> **Note pour les débutants** : ne vous inquiétez pas si la partie base de données semble complexe. Au début, vous pouvez utiliser des tableaux simples pour simuler les données, puis ajouter une vraie base de données quand vous serez plus à l'aise.

---

## Résumé visuel

```
Navigateur (la salle du restaurant)
    │
    │  Requête : GET /api/contacts
    ▼
┌───────────────────────────────┐
│  server/middleware/auth.ts    │  ← Le videur vérifie l'accès
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│  server/api/contacts.get.ts   │  ← La route traite la demande
│                               │
│  → Lit la base de données     │  ← La cuisine prépare le plat
│  → Renvoie les données JSON   │
└───────────────┬───────────────┘
                │
                ▼
    Réponse : [{ id: 1, name: "Alice" }, ...]
    → affichée dans le navigateur
```

---

## Suite

→ `cours/05-nuxt3/05-seo-et-meta.md`
