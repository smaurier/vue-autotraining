# 02 — Interfaces et types

---

> **🔄 Rappel du cours précédent**
> Avant de continuer, vérifie que tu peux répondre à ces questions :
> 1. Quels sont les 3 types primitifs les plus courants en TypeScript ?
> 2. Quelle est la différence entre `any` et `unknown` ?
> 
> <details>
> <summary>Vérifier mes réponses</summary>
>
> 1. `string`, `number`, `boolean`
> 2. `any` désactive les vérifications de type, `unknown` oblige à vérifier le type avant utilisation
> </details>

---

## Rappel JavaScript : les objets

En JavaScript, un **objet** est comme une fiche d'identité : il regroupe plusieurs informations dans un seul conteneur.

```js
// Un objet JavaScript simple — comme une fiche contact
const user = {
  name: "Alice",          // propriété "name" → le nom de la personne
  age: 25,                // propriété "age" → son âge
  email: "alice@mail.com" // propriété "email" → son adresse mail
};

// Pour lire une propriété, on utilise le point (.)
console.log(user.name);  // Affiche : "Alice"
console.log(user.age);   // Affiche : 25
```

> **Analogie :** Pense à un objet comme un formulaire papier. Chaque champ (nom, âge, email) est une **propriété**, et la valeur écrite dans le champ est la **valeur de la propriété**.

### Le problème en JavaScript pur

Rien n'empêche de faire des erreurs. JavaScript ne se plaindra jamais :

```js
// ❌ Faute de frappe sur "name" → "nmae"
user.nmae = "Bob";    // Pas d'erreur ! Mais ça crée une NOUVELLE propriété "nmae"
                       // Le nom reste "Alice" → BUG silencieux !

// ❌ On peut mettre un nombre là où on attend du texte
user.email = 12345;   // Pas d'erreur ! Mais l'email est maintenant un nombre → BUG !
```

C'est exactement ce problème que TypeScript résout grâce aux **interfaces** 👇

---

## Interface : le contrat d'un objet

Une **interface** est comme un formulaire vierge qui définit **quels champs sont attendus** et **quel type de valeur** chaque champ doit contenir.

> **Analogie :** Imagine un formulaire administratif. Il y a des cases prédéfinies : "Nom (texte)", "Âge (nombre)", "Email (texte)", "Actif (oui/non)". Si tu essaies d'écrire ton âge dans la case "Email", ça ne passe pas. L'interface, c'est ce formulaire.

```ts
// On DÉFINIT le formulaire (= l'interface)
// Le mot-clé "interface" dit à TypeScript : "voici la forme que devra avoir un objet User"
interface User {
  id: number;          // "id" doit être un nombre
  name: string;        // "name" doit être du texte
  email: string;       // "email" doit être du texte
  isActive: boolean;   // "isActive" doit être vrai (true) ou faux (false)
}

// On CRÉE un objet qui respecte le formulaire
// Le ": User" après "alice" dit : "cet objet doit respecter l'interface User"
const alice: User = {
  id: 1,                       // ✅ nombre → OK
  name: "Alice",               // ✅ texte → OK
  email: "alice@example.com",  // ✅ texte → OK
  isActive: true,              // ✅ booléen → OK
};
```

### Que se passe-t-il si on fait une erreur ?

```ts
// ❌ Il manque la propriété "isActive" → TypeScript refuse !
const bob: User = {
  id: 2,
  name: "Bob",
  email: "bob@example.com",
  // Erreur : Property 'isActive' is missing
};

// ❌ Mauvais type : on met un texte au lieu d'un nombre pour "id"
const charlie: User = {
  id: "trois",              // Erreur : Type 'string' is not assignable to type 'number'
  name: "Charlie",
  email: "charlie@mail.com",
  isActive: true,
};

// ❌ Propriété inconnue : "phone" n'existe pas dans l'interface User
const diana: User = {
  id: 4,
  name: "Diana",
  email: "diana@mail.com",
  isActive: false,
  phone: "0612345678",      // Erreur : 'phone' does not exist in type 'User'
};
```

> **En résumé :** L'interface est un **gardien**. Elle vérifie que chaque objet a les bonnes propriétés avec les bons types. Plus de bugs silencieux !

### 🎯 Pratique — Interfaces

Dans `01-playground.ts` :

```ts
// Exercice 2.1 : Crée une interface Product
interface Product {
  // id : nombre
  // name : texte
  // price : nombre
  // inStock : booléen
}

// Exercice 2.2 : Crée un objet qui respecte cette interface
const iphone: Product = {
  // ??? complète ici
};

// Exercice 2.3 : Que dit TypeScript si tu oublies "inStock" ?
```

<details>
<summary>Solution</summary>

```ts
interface Product {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
}

const iphone: Product = {
  id: 1,
  name: "iPhone 15",
  price: 999,
  inStock: true,
};

// Erreur : Property 'inStock' is missing in type '...' but required in type 'Product'
```
</details>

---

## Propriétés optionnelles

Parfois, certaines informations ne sont pas obligatoires. Par exemple, tout le monde n'a pas forcément une photo de profil.

En TypeScript, on ajoute un **`?`** après le nom de la propriété pour dire "ce champ est facultatif".

```ts
interface User {
  id: number;          // obligatoire — chaque utilisateur a un id
  name: string;        // obligatoire — chaque utilisateur a un nom
  avatar?: string;     // OPTIONNEL — le "?" signifie "pas obligatoire"
                       // avatar sera de type "string | undefined"
                       // (soit du texte, soit "pas défini")
}

// ✅ Sans avatar → c'est valide car avatar est optionnel
const bob: User = {
  id: 2,
  name: "Bob",
  // pas de propriété "avatar" → aucune erreur !
};

// ✅ Avec avatar → c'est aussi valide
const alice: User = {
  id: 1,
  name: "Alice",
  avatar: "https://photos.com/alice.jpg",  // on fournit l'avatar cette fois
};
```

> **Analogie :** Sur un formulaire, certains champs ont la mention "(facultatif)". Le `?` en TypeScript, c'est exactement cette mention.

### Attention quand on utilise une propriété optionnelle

```ts
// Quand une propriété est optionnelle, elle peut être "undefined" (= pas définie)
// Il faut vérifier qu'elle existe avant de l'utiliser

console.log(bob.avatar);           // undefined (Bob n'a pas d'avatar)
console.log(bob.avatar.length);    // ❌ ERREUR ! On ne peut pas lire .length sur undefined

// ✅ La bonne façon : vérifier d'abord
if (bob.avatar) {
  console.log(bob.avatar.length);  // OK, on est sûr que avatar existe ici
}

// ✅ Alternative avec "?." (optional chaining)
console.log(bob.avatar?.length);   // Affiche "undefined" au lieu de planter
```

### 🎯 Pratique — Optionnel

Dans `01-playground.ts` :

```ts
// Exercice 2.4 : Ajoute une propriété optionnelle à Product
interface Product {
  id: number;
  name: string;
  price: number;
  description: ???;  // optionnel !
}

// Exercice 2.5 : Crée 2 produits, un avec description, un sans

// Exercice 2.6 : Affiche la longueur de la description (attention au undefined !)
function afficherDescription(p: Product) {
  // ???
}
```

<details>
<summary>Solution</summary>

```ts
interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
}

const avecDesc: Product = { id: 1, name: "iPhone", price: 999, description: "Le dernier modèle" };
const sansDesc: Product = { id: 2, name: "Coque", price: 29 };

function afficherDescription(p: Product) {
  console.log(p.description?.length ?? "Pas de description");
}
```
</details>

---

## Propriétés en lecture seule (`readonly`)

Parfois, on veut qu'une valeur **ne puisse jamais être changée** après sa création. Par exemple, l'URL d'une API ou un identifiant unique.

> **Analogie :** C'est comme un numéro de sécurité sociale : une fois attribué, il ne change plus jamais.

```ts
// Le mot "readonly" devant une propriété signifie :
// "On peut la lire, mais INTERDIT de la modifier après création"
interface Config {
  readonly apiUrl: string;     // URL de l'API → ne doit jamais changer
  readonly timeout: number;    // Délai max → ne doit jamais changer
}

// On crée l'objet config — tout est normal
const config: Config = {
  apiUrl: "/api",     // on donne la valeur à la création
  timeout: 5000,      // 5000 millisecondes = 5 secondes
};

// ✅ On peut LIRE les valeurs
console.log(config.apiUrl);    // "/api"
console.log(config.timeout);   // 5000

// ❌ Mais on ne peut PAS les MODIFIER
config.apiUrl = "/v2";         // Erreur : Cannot assign to 'apiUrl' because it is a read-only property
config.timeout = 10000;        // Erreur : Cannot assign to 'timeout' because it is a read-only property
```

> **Conseil :** Utilise `readonly` pour tout ce qui représente une configuration, un identifiant, ou toute valeur qui ne devrait pas changer.

---

## Rappel JavaScript : c'est quoi un "type" au sens large ?

Avant de voir les `type` alias de TypeScript, rappelons les types de base en JavaScript :

```js
// Les types de base en JavaScript :
"Alice"       // string → du texte (entre guillemets)
42            // number → un nombre
true          // boolean → vrai ou faux
undefined     // undefined → "pas encore défini"
null          // null → "volontairement vide"
[1, 2, 3]    // tableau (array) → une liste de valeurs
{ a: 1 }     // objet → un conteneur de propriétés
```

En TypeScript, le mot-clé `type` permet de **créer tes propres types personnalisés** avec un nom. C'est un "alias" (= un surnom) pour un type.

---

## Type alias

Le mot-clé `type` permet de donner un **nom** à n'importe quel type. C'est pratique pour ne pas réécrire la même chose partout.

```ts
// TYPE ALIAS SIMPLE : on donne le nom "Status" à une liste de valeurs possibles
// Le "|" signifie "OU" → Status peut être "idle" OU "loading" OU "error" OU "success"
type Status = "idle" | "loading" | "error" | "success";

// Maintenant on peut utiliser "Status" comme un type
let currentStatus: Status = "idle";    // ✅ OK, "idle" est dans la liste
currentStatus = "loading";              // ✅ OK, "loading" est dans la liste
currentStatus = "banana";               // ❌ Erreur ! "banana" n'est pas dans la liste
```

### Type alias pour un objet

```ts
// On peut aussi utiliser "type" pour décrire un objet (comme une interface)
type Point = {
  x: number;    // coordonnée x
  y: number;    // coordonnée y
};

const origin: Point = { x: 0, y: 0 }; // ✅ Valide
```

### Type alias pour une fonction

```ts
// On décrit la "forme" d'une fonction :
// "Formatter" est une fonction qui prend un nombre et renvoie du texte
type Formatter = (value: number) => string;

// Maintenant on peut typer une variable avec ce type
const formatEuro: Formatter = (value) => {
  return value + " €";    // transforme 42 en "42 €"
};

console.log(formatEuro(42));  // "42 €"
```

### 🎯 Pratique — Type alias

Dans `01-playground.ts` :

```ts
// Exercice 2.7 : Crée un type pour les devises
type Currency = ???;  // "EUR", "USD", "GBP"

// Exercice 2.8 : Crée un type pour une coordonnée
type Coordinate = {
  // x et y sont des nombres
};

// Exercice 2.9 : Crée un type pour une fonction de calcul
type Calculator = ???;  // prend 2 nombres, retourne 1 nombre

const additionner: Calculator = (a, b) => a + b;
```

<details>
<summary>Solution</summary>

```ts
type Currency = "EUR" | "USD" | "GBP";

type Coordinate = {
  x: number;
  y: number;
};

type Calculator = (a: number, b: number) => number;
```
</details>

---

## Union types (types "OU")

Un **union type** permet de dire : "cette valeur peut être de tel type **OU** de tel autre type".

> **Analogie :** C'est comme un feu tricolore qui peut être rouge **OU** orange **OU** vert. Il ne peut être que l'un des trois, jamais autre chose.

```ts
// Le "|" se lit "OU"
type Status = "idle" | "loading" | "error" | "success";
// ↑ Status peut être "idle" OU "loading" OU "error" OU "success"

// On peut aussi mélanger des types différents
type Id = number | string;
// ↑ Un Id peut être un nombre (42) OU du texte ("abc-123")

let userId: Id = 42;          // ✅ nombre → OK
userId = "user-abc-123";      // ✅ texte → OK
userId = true;                 // ❌ booléen → pas autorisé !
```

### 🎯 Pratique — Union types

Dans `01-playground.ts` :

```ts
// Exercice 2.10 : Un résultat de recherche peut être trouvé ou non
type SearchResult = ???;  // Product | null

function chercher(terme: string): SearchResult {
  if (terme === "iPhone") return { id: 1, name: "iPhone", price: 999, inStock: true };
  return null;
}

// Exercice 2.11 : Un input peut accepter texte ou nombre
type InputValue = ???;

function traiter(valeur: InputValue) {
  // Comment savoir si c'est un string ou un number ?
  // ???
}
```

<details>
<summary>Solution</summary>

```ts
type SearchResult = Product | null;

type InputValue = string | number;

function traiter(valeur: InputValue) {
  if (typeof valeur === "string") {
    console.log(valeur.toUpperCase());
  } else {
    console.log(valeur.toFixed(2));
  }
}
```
</details>

---

## Intersection types (types "ET")

Un **intersection type** permet de **combiner** plusieurs types en un seul. L'objet doit avoir **toutes** les propriétés de **tous** les types combinés.

> **Analogie :** C'est comme un employé qui est À LA FOIS un développeur ET un manager. Il a les compétences des deux rôles.

```ts
// On a un type User de base (défini via une interface)
interface User {
  id: number;
  name: string;
  email: string;
}

// Le "&" signifie "ET" → AdminUser a TOUT ce qu'a User, PLUS les propriétés supplémentaires
type AdminUser = User & {
  role: "admin";            // doit être exactement le texte "admin"
  permissions: string[];    // tableau de textes (ex: ["read", "write", "delete"])
};

// Un AdminUser doit avoir TOUTES les propriétés : celles de User + les nouvelles
const admin: AdminUser = {
  id: 1,                                   // vient de User
  name: "Alice",                           // vient de User
  email: "alice@admin.com",                // vient de User
  role: "admin",                           // propriété ajoutée
  permissions: ["read", "write", "delete"] // propriété ajoutée
};
```

### 🎯 Pratique — Intersection types

Dans `01-playground.ts` :

```ts
// Exercice 2.12 : Combine Product avec des infos de tracking
interface Trackable {
  createdAt: Date;
  updatedAt: Date;
}

type TrackedProduct = ???;  // Product & Trackable

// Exercice 2.13 : Crée un produit tracké
const produitSuivi: TrackedProduct = {
  // ??? complète toutes les propriétés
};
```

<details>
<summary>Solution</summary>

```ts
type TrackedProduct = Product & Trackable;

const produitSuivi: TrackedProduct = {
  id: 1,
  name: "MacBook",
  price: 1999,
  inStock: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};
```
</details>

---

## Interface vs Type — quand utiliser quoi ?

Les deux se ressemblent beaucoup ! Voici un guide simple :

| Situation                          | Utilise...    | Pourquoi ?                                         |
| ---------------------------------- | ------------- | -------------------------------------------------- |
| Décrire la forme d'un objet       | `interface`   | C'est son rôle principal, c'est le plus lisible     |
| Liste de valeurs possibles (union) | `type`        | `interface` ne peut pas faire ça                    |
| Combiner des types (intersection)  | `type`        | Plus lisible avec `&`                                |
| Étendre / hériter                  | `interface`   | Le mot-clé `extends` est très clair                  |
| Typer une fonction                 | `type`        | Syntaxe plus naturelle avec `=>`                     |

> **Règle simple pour Vue 3 :** Utilise `interface` pour les données métier (User, Product, Ticket...) et `type` pour tout le reste (unions, fonctions, utilitaires).

---

## Composition d'interfaces (`extends`)

Quand plusieurs interfaces partagent des propriétés communes, on peut créer une interface de **base** et la faire **hériter** par d'autres.

> **Analogie :** C'est comme un formulaire générique ("Nom", "Date de création") qu'on réutilise dans d'autres formulaires plus spécifiques. Le formulaire "Utilisateur" reprend les champs du formulaire de base + en ajoute.

```ts
// Interface de BASE : les propriétés communes à beaucoup d'objets
interface BaseEntity {
  id: number;            // tout objet en base de données a un identifiant
  createdAt: string;     // tout objet a une date de création
}

// Interface ENFANT : "extends" signifie "reprend tout de BaseEntity et ajoute le reste"
interface User extends BaseEntity {
  name: string;          // propriété spécifique à User
  email: string;         // propriété spécifique à User
}

// User a maintenant 4 propriétés : id, createdAt (héritées) + name, email (propres)
const alice: User = {
  id: 1,                           // vient de BaseEntity
  createdAt: "2025-01-15",         // vient de BaseEntity
  name: "Alice",                   // propre à User
  email: "alice@example.com",      // propre à User
};
```

### On peut hériter de PLUSIEURS interfaces

```ts
// Interface pour les dates
interface Timestamped {
  createdAt: string;
  updatedAt: string;
}

// Interface pour les objets supprimables
interface SoftDeletable {
  deletedAt?: string;    // optionnel → l'objet n'est peut-être pas supprimé
}

// Article hérite des DEUX interfaces à la fois
interface Article extends Timestamped, SoftDeletable {
  title: string;
  content: string;
}

// Article a : createdAt, updatedAt (de Timestamped)
//           + deletedAt? (de SoftDeletable)
//           + title, content (propres)
```

### 🎯 Pratique — Extends

Dans `01-playground.ts` :

```ts
// Exercice 2.14 : Crée une hiérarchie d'entités
interface Entity {
  id: number;
  createdAt: Date;
}

interface Person extends ??? {
  name: string;
  email: string;
}

interface Employee extends ??? {
  department: string;
  salary: number;
}

// Exercice 2.15 : Combien de propriétés a Employee au total ?
```

<details>
<summary>Solution</summary>

```ts
interface Entity {
  id: number;
  createdAt: Date;
}

interface Person extends Entity {
  name: string;
  email: string;
}

interface Employee extends Person {
  department: string;
  salary: number;
}

// Employee a 6 propriétés : id, createdAt, name, email, department, salary
```
</details>

---

## Index signatures

Parfois, on ne connaît **pas à l'avance** les noms des propriétés d'un objet. On sait juste que les clés seront du texte et les valeurs aussi.

> **Analogie :** Pense à un dictionnaire de traduction. On ne sait pas quels mots seront dedans, mais on sait que chaque entrée sera un mot (texte) associé à sa traduction (texte).

```ts
// "[key: string]" signifie : "n'importe quelle propriété dont le nom est du texte"
// ": string" après signifie : "et la valeur de chaque propriété est du texte"
interface Translation {
  [key: string]: string;    // clé = texte, valeur = texte
}

// On peut mettre autant de propriétés qu'on veut
const fr: Translation = {
  hello: "Bonjour",        // ✅ clé texte, valeur texte → OK
  goodbye: "Au revoir",    // ✅ clé texte, valeur texte → OK
  thanks: "Merci",         // ✅ on peut en ajouter autant qu'on veut
};

// ❌ Mais on ne peut PAS mettre une valeur qui n'est pas du texte
const bad: Translation = {
  hello: "Bonjour",
  count: 42,               // Erreur : Type 'number' is not assignable to type 'string'
};
```

### Autre exemple concret

```ts
// Un objet pour stocker des scores de joueurs (nom → score)
interface Scores {
  [playerName: string]: number;   // clé = nom du joueur (texte), valeur = score (nombre)
}

const leaderboard: Scores = {
  Alice: 150,
  Bob: 120,
  Charlie: 200,
};

// On peut accéder dynamiquement
const name = "Alice";
console.log(leaderboard[name]);  // 150
```

### 🎯 Pratique — Index signatures

Dans `01-playground.ts` :

```ts
// Exercice 2.16 : Crée un type pour un dictionnaire français/anglais
interface Dictionnaire {
  // clé = mot français (string), valeur = traduction (string)
}

const frToEn: Dictionnaire = {
  bonjour: "hello",
  merci: "thanks",
  // ???
};

// Exercice 2.17 : Crée un type pour stocker des prix par nom de produit
interface PrixProduits {
  // ???
}
```

<details>
<summary>Solution</summary>

```ts
interface Dictionnaire {
  [motFr: string]: string;
}

interface PrixProduits {
  [nomProduit: string]: number;
}

const prix: PrixProduits = {
  iPhone: 999,
  MacBook: 1999,
  AirPods: 199,
};
```
</details>

---

## Discriminated unions (unions discriminées)

C'est un pattern (= une technique récurrente) **très important** en Vue 3. Il permet de représenter un objet qui peut être dans **plusieurs états différents**, chacun avec des propriétés différentes.

> **Analogie :** Pense à une commande en ligne :
> - État "en attente" → on a juste l'info "en attente"
> - État "en livraison" → on a le numéro de suivi
> - État "livrée" → on a la date de livraison
> - État "erreur" → on a le message d'erreur
>
> Chaque état a un **champ commun** (`status`) qui permet de savoir dans quel cas on est.

```ts
// On définit CHAQUE état possible avec ses propriétés spécifiques
// Le "<T>" est un "générique" (on le verra en détail au chapitre suivant)
// Pour l'instant, comprends juste que T sera remplacé par le type des données
type ApiState<T> =
  | { status: "idle" }                          // état 1 : en attente, pas de données
  | { status: "loading" }                        // état 2 : chargement en cours
  | { status: "error"; error: string }           // état 3 : erreur → on a un message d'erreur
  | { status: "success"; data: T };              // état 4 : succès → on a les données

// Utilisation avec un switch sur le champ commun "status"
function render(state: ApiState<User[]>) {
  switch (state.status) {

    case "idle":
      // Ici, TypeScript sait qu'on est dans l'état { status: "idle" }
      // → pas de propriété "error" ni "data" disponible
      return "En attente...";

    case "loading":
      // État de chargement → pas encore de données
      return "Chargement...";

    case "error":
      // TypeScript sait qu'ici "error" existe (c'est garanti par le type)
      return `Erreur : ${state.error}`;

    case "success":
      // TypeScript sait qu'ici "data" existe et que c'est un User[]
      return `${state.data.length} utilisateurs trouvés`;
  }
}
```

### Pourquoi c'est si important en Vue 3 ?

Quand tu appelles une API dans un composant Vue, tu passes par ces états :
1. **idle** : la page vient de s'afficher, rien ne s'est encore passé
2. **loading** : la requête est en cours
3. **success** : les données sont arrivées → on les affiche
4. **error** : quelque chose a mal tourné → on affiche un message d'erreur

Ce pattern te permet de gérer **proprement** ces 4 cas sans oublier aucun scénario.

### 🎯 Pratique — Discriminated unions

Dans `01-playground.ts` :

```ts
// Exercice 2.18 : Modélise le résultat d'un paiement
type PaymentResult =
  | { status: "pending" }                           // en attente
  | { status: "success"; transactionId: string }    // réussi
  | { status: "failed"; ???: ??? };                 // échoué avec message d'erreur

// Exercice 2.19 : Écris une fonction qui traite le résultat
function handlePayment(result: PaymentResult): string {
  switch (result.status) {
    // ??? complète les 3 cas
  }
}
```

<details>
<summary>Solution</summary>

```ts
type PaymentResult =
  | { status: "pending" }
  | { status: "success"; transactionId: string }
  | { status: "failed"; errorMessage: string };

function handlePayment(result: PaymentResult): string {
  switch (result.status) {
    case "pending":
      return "Paiement en cours...";
    case "success":
      return `Paiement réussi ! Ref: ${result.transactionId}`;
    case "failed":
      return `Échec : ${result.errorMessage}`;
  }
}
```
</details>

---

## Rappel JavaScript : c'est quoi "transformer" un objet ?

Avant les utility types, rappelons quelques bases :

```js
// En JavaScript, on peut créer un nouvel objet à partir d'un autre
const user = { id: 1, name: "Alice", email: "alice@mail.com", avatar: "photo.jpg" };

// On veut un objet avec seulement id et name
const preview = { id: user.id, name: user.name };

// On veut un objet avec tout SAUF email
const { email, ...rest } = user;  // rest = { id: 1, name: "Alice", avatar: "photo.jpg" }
```

TypeScript propose des **Utility Types** qui font la même chose mais **au niveau des types** (pas des valeurs).

---

## Utility types essentiels

Les **utility types** sont des outils fournis par TypeScript pour **transformer** un type existant en un nouveau type. Pas besoin de les installer, ils sont intégrés.

### Préparation : notre interface de départ

```ts
// Notre interface de référence pour tous les exemples
interface User {
  id: number;        // identifiant unique
  name: string;      // nom de l'utilisateur
  email: string;     // adresse email
  avatar: string;    // URL de la photo de profil
}
```

### `Partial<T>` — Tout devient optionnel

> **Analogie :** C'est comme prendre un formulaire obligatoire et mettre "(facultatif)" sur tous les champs.

```ts
// Partial<User> = User mais TOUS les champs sont optionnels
type PartialUser = Partial<User>;

// Équivalent à écrire :
// interface PartialUser {
//   id?: number;
//   name?: string;
//   email?: string;
//   avatar?: string;
// }

// Utile pour les mises à jour partielles : on ne modifie que certains champs
const update: PartialUser = {
  name: "Bob",   // on ne change que le nom, les autres champs sont absents → OK
};
```

### `Required<T>` — Tout devient obligatoire

> C'est l'inverse de `Partial` : tous les champs optionnels deviennent obligatoires.

```ts
interface Settings {
  theme?: string;      // optionnel
  language?: string;   // optionnel
}

// Required<Settings> = Settings mais TOUT est obligatoire
type RequiredSettings = Required<Settings>;

const settings: RequiredSettings = {
  theme: "dark",       // obligatoire maintenant
  language: "fr",      // obligatoire maintenant
};
// Si on oublie un champ → erreur TypeScript
```

### `Pick<T, Keys>` — Garder seulement certaines propriétés

> **Analogie :** C'est comme photocopier un formulaire mais en ne gardant que 2 champs sur 10.

```ts
// On ne garde que "id" et "name" de User
type UserPreview = Pick<User, "id" | "name">;

// Équivalent à :
// interface UserPreview {
//   id: number;
//   name: string;
// }

const preview: UserPreview = {
  id: 1,
  name: "Alice",
  // pas d'email ni d'avatar → c'est ce qu'on veut !
};
```

### `Omit<T, Keys>` — Exclure certaines propriétés

> **Analogie :** C'est l'inverse de `Pick`. On garde tout **sauf** les champs spécifiés.

```ts
// On garde tout de User SAUF "email"
type UserWithoutEmail = Omit<User, "email">;

// Équivalent à :
// interface UserWithoutEmail {
//   id: number;
//   name: string;
//   avatar: string;
// }

const userNoEmail: UserWithoutEmail = {
  id: 1,
  name: "Alice",
  avatar: "photo.jpg",
  // pas de champ "email" → c'est ce qu'on veut !
};
```

### `Record<Keys, Value>` — Créer un objet avec des clés et valeurs typées

> **Analogie :** C'est comme créer un annuaire où chaque entrée (numéro) est associée à une fiche (User).

```ts
// Record<number, User> = un objet dont les clés sont des nombres
// et les valeurs sont des User
type UserMap = Record<number, User>;

const users: UserMap = {
  1: { id: 1, name: "Alice", email: "a@mail.com", avatar: "a.jpg" },
  2: { id: 2, name: "Bob", email: "b@mail.com", avatar: "b.jpg" },
  // La clé est un nombre, la valeur est un User → tout est typé !
};
```

### Résumé des utility types

| Utility Type      | Ce qu'il fait                           | Exemple concret              |
| ----------------- | --------------------------------------- | ---------------------------- |
| `Partial<T>`      | Tous les champs deviennent optionnels   | Formulaire de mise à jour    |
| `Required<T>`     | Tous les champs deviennent obligatoires | Validation complète          |
| `Pick<T, Keys>`   | Ne garde que certains champs            | Aperçu / résumé d'un objet  |
| `Omit<T, Keys>`   | Garde tout sauf certains champs         | Cacher des données sensibles |
| `Record<K, V>`    | Crée un dictionnaire typé               | Index de données par id       |

### 🎯 Pratique — Utility types

Dans `01-playground.ts` :

```ts
interface Article {
  id: number;
  title: string;
  content: string;
  author: string;
  publishedAt: Date;
}

// Exercice 2.20 : Crée un type pour mettre à jour un article (tout optionnel)
type ArticleUpdate = ???;

// Exercice 2.21 : Crée un aperçu d'article (juste id et title)
type ArticlePreview = ???;

// Exercice 2.22 : Crée un article sans la date de publication
type DraftArticle = ???;

// Exercice 2.23 : Crée un index d'articles par id
type ArticleIndex = ???;
```

<details>
<summary>Solution</summary>

```ts
type ArticleUpdate = Partial<Article>;
type ArticlePreview = Pick<Article, "id" | "title">;
type DraftArticle = Omit<Article, "publishedAt">;
type ArticleIndex = Record<number, Article>;
```
</details>

---

## Exercice : système de tickets

Mets en pratique tout ce que tu as appris ! Définis les types pour un système de tickets (comme un outil de suivi de bugs).

### Ce que tu dois créer :

```ts
// 1. Un type "TicketStatus" qui peut être 'open', 'in-progress' ou 'closed'
//    → Utilise un union type

// 2. Une interface "Ticket" avec :
//    - id : nombre ou texte (union type)
//    - title : texte (obligatoire)
//    - description : texte (obligatoire)
//    - status : utilise ton type TicketStatus
//    - assignee : texte (OPTIONNEL — un ticket peut ne pas être assigné)

// 3. Un type "TicketSummary" qui ne garde que "id" et "title" de Ticket
//    → Utilise Pick

// 4. Une interface "TicketFilters" pour filtrer les tickets :
//    - status : optionnel, utilise TicketStatus
//    - search : optionnel, du texte
```

### Indices

- Pour le point 1, pense à `type MonType = "valeur1" | "valeur2" | "valeur3"`
- Pour le point 2, pense à `interface MonInterface { ... }` avec `?` pour l'optionnel
- Pour le point 3, pense à `type MonType = Pick<SourceInterface, "prop1" | "prop2">`
- Pour le point 4, toutes les propriétés sont optionnelles (`?`)

---

## Solution de l'exercice

Voici la solution complète, commentée ligne par ligne :

```ts
// ──────────────────────────────────────────
// ÉTAPE 1 : Le type TicketStatus (union type)
// ──────────────────────────────────────────
// On liste les 3 statuts possibles, séparés par "|" (OU)
// Un ticket est soit ouvert, soit en cours, soit fermé — jamais autre chose
type TicketStatus = 'open' | 'in-progress' | 'closed';

// ──────────────────────────────────────────
// ÉTAPE 2 : L'interface Ticket
// ──────────────────────────────────────────
// C'est le "formulaire" qui décrit un ticket complet
interface Ticket {
  id: number | string;       // l'identifiant peut être un nombre (1, 2, 3)
                              // ou du texte ("TICKET-001") → union type
  title: string;              // le titre du ticket — obligatoire
  description: string;        // la description détaillée — obligatoire
  status: TicketStatus;       // le statut → on réutilise notre type défini à l'étape 1
  assignee?: string;          // la personne assignée — OPTIONNEL (le "?" rend ce champ facultatif)
                              // Un ticket peut exister sans être assigné à quelqu'un
}

// ──────────────────────────────────────────
// ÉTAPE 3 : Le type TicketSummary (avec Pick)
// ──────────────────────────────────────────
// On ne veut qu'un résumé : juste l'id et le titre
// Pick<Ticket, 'id' | 'title'> = "prends l'interface Ticket et ne garde que id et title"
type TicketSummary = Pick<Ticket, 'id' | 'title'>;

// ──────────────────────────────────────────
// ÉTAPE 4 : L'interface TicketFilters
// ──────────────────────────────────────────
// Les filtres pour rechercher des tickets
// Tous les champs sont optionnels (on peut filtrer par statut, par texte, ou les deux)
interface TicketFilters {
  status?: TicketStatus;     // filtrer par statut — optionnel
  search?: string;           // rechercher par mot-clé — optionnel
}

// ──────────────────────────────────────────
// EXEMPLES D'UTILISATION
// ──────────────────────────────────────────

// Créer un ticket complet (avec assignee)
const ticket: Ticket = {
  id: 1,                                           // nombre → OK (number | string)
  title: "Bug dans le login",                      // texte → OK
  description: "L'utilisateur ne peut pas se connecter",  // texte → OK
  status: "open",                                  // "open" → OK (fait partie de TicketStatus)
  assignee: "Alice"                                // texte → OK (optionnel mais fourni)
};

// Créer un ticket sans assignee (c'est permis car le champ est optionnel)
const unassignedTicket: Ticket = {
  id: "TICKET-002",                               // texte → OK (number | string)
  title: "Améliorer la page d'accueil",
  description: "La page est trop lente",
  status: "open",
  // pas de "assignee" → aucune erreur car c'est optionnel !
};

// Créer un résumé (seulement id et title grâce à Pick)
const summary: TicketSummary = {
  id: ticket.id,       // on copie l'id du ticket
  title: ticket.title  // on copie le titre du ticket
  // pas de description, status, assignee → c'est le but de Pick !
};

// Créer des filtres de recherche
const filters: TicketFilters = {
  status: "open",      // on filtre les tickets ouverts
  search: "login"      // qui contiennent le mot "login"
};

// On pourrait aussi ne filtrer que par statut
const statusOnly: TicketFilters = {
  status: "closed"     // pas de "search" → OK car optionnel
};

// Ou ne pas filtrer du tout (objet vide → tous les champs sont optionnels)
const noFilters: TicketFilters = {};
```

---

## Suite

→ `cours/00-typescript/03-generics.md`
