# 03 — Les Génériques (Generics)

> **Niveau :** Ce chapitre est **le plus difficile** du cours TypeScript. C'est normal si tu ne comprends pas tout du premier coup. Relis-le, fais les exercices, et ça viendra ! 💪

---

> **🔄 Rappel du cours précédent**
> Avant de continuer, vérifie que tu peux répondre à ces questions :
> 1. Quelle est la différence entre `interface` et `type` en TypeScript ?
> 2. Comment rend-on une propriété optionnelle dans une interface ?
> 
> <details>
> <summary>Vérifier mes réponses</summary>
>
> 1. `interface` peut être étendue/fusionnée, `type` est plus flexible (unions, tuples)
> 2. En ajoutant `?` après le nom de la propriété : `name?: string`
> </details>

---

## 🧠 Rappel JavaScript : les fonctions qui marchent avec plusieurs types

Avant de parler de TypeScript, rappelons un truc en JavaScript.

En JavaScript, tu peux écrire une fonction qui marche avec n'importe quoi :

```js
// JavaScript pur — pas de types

// Cette fonction prend un tableau et retourne le premier élément
function premier(tableau) {
  return tableau[0]  // tableau[0] = le premier élément du tableau
}

// Elle marche avec des nombres :
premier([10, 20, 30])   // → 10

// Elle marche avec des strings :
premier(["chat", "chien", "poisson"])   // → "chat"

// Elle marche avec des objets :
premier([{ nom: "Alice" }, { nom: "Bob" }])   // → { nom: "Alice" }
```

**Le problème ?** JavaScript s'en fiche du type. Il ne te prévient jamais si tu te trompes. Tu pourrais écrire `premier(42)` (qui n'a pas de sens) et JavaScript ne dirait rien... jusqu'au bug à l'exécution.

**TypeScript** veut te protéger. Mais comment lui dire "cette fonction marche avec PLUSIEURS types" ?

C'est exactement à ça que servent les **génériques**.

---

## 🎯 Le problème : pourquoi on a besoin des génériques

Imaginons qu'on veut écrire une fonction `premier()` en TypeScript, qui retourne le premier élément d'un tableau.

### Tentative 1 : on fixe le type

```ts
// Cette fonction ne marche QUE avec des nombres
function premierNombre(tableau: number[]): number {
  //                           ^^^^^^^^  ^^^^^^
  //                           |         |
  //                           |         Le retour est un number
  //                           Le paramètre est un tableau de numbers
  return tableau[0]
}

premierNombre([10, 20, 30])           // ✅ OK → retourne 10
premierNombre(["chat", "chien"])      // ❌ Erreur ! C'est pas des numbers
```

Ça marche... mais **seulement pour les nombres**.

### Tentative 2 : on duplique pour chaque type

```ts
// Version pour les nombres
function premierNombre(tableau: number[]): number {
  return tableau[0]
}

// Version pour les strings
function premierString(tableau: string[]): string {
  return tableau[0]
}

// Version pour les User
function premierUser(tableau: User[]): User {
  return tableau[0]
}
```

**C'est horrible !** 😱 On a copié-collé 3 fois le même code ! Et si on a 20 types différents, on fait 20 fonctions ?

### Tentative 3 : on utilise `any`

```ts
// On met "any" partout pour accepter tout
function premier(tableau: any[]): any {
  return tableau[0]
}

premier([10, 20, 30])       // OK, mais le résultat est "any"
premier(["chat", "chien"])  // OK, mais le résultat est "any"
```

Ça compile, mais on a **perdu toute la sécurité de TypeScript**. Le résultat est `any`, donc TypeScript ne peut plus nous aider.

```ts
const resultat = premier([10, 20, 30])
// resultat est de type "any"
// TypeScript ne sait pas que c'est un number
// Donc il ne peut pas nous prévenir si on fait une bêtise :
resultat.toUpperCase()  // Pas d'erreur TS... mais CRASH à l'exécution !
//       ^^^^^^^^^^^^^ toUpperCase() n'existe pas sur un nombre !
```

### Le vrai problème

On veut **les deux en même temps** :
1. ✅ Une **seule** fonction qui marche avec **tous les types**
2. ✅ TypeScript **sait** quel type entre et quel type sort

**C'est exactement ce que font les génériques !**

---

## 💡 Analogie : La boîte universelle

Avant de voir le code, comprenons le concept avec une image.

Imagine une **boîte étiquetée**. Tu peux avoir :
- 📦 Une boîte étiquetée **"Chaussures"** → on met des chaussures dedans
- 📦 Une boîte étiquetée **"Livres"** → on met des livres dedans
- 📦 Une boîte étiquetée **"Jouets"** → on met des jouets dedans

La **forme** de la boîte est toujours la même, mais l'**étiquette** change, et donc le **contenu** change aussi.

En TypeScript, les génériques fonctionnent exactement comme ça :
- `Array<string>` → un tableau qui contient des **strings**
- `Array<number>` → un tableau qui contient des **numbers**
- `Array<User>` → un tableau qui contient des **Users**

Le **tableau** c'est la boîte. Le **type entre `< >`** c'est l'étiquette.

> **Règle :** "Même boîte, étiquette différente → contenu différent"

---

## ✅ La solution : les génériques

Un **générique**, c'est un **paramètre de type**. Au lieu de fixer le type en dur, on laisse un "trou" que TypeScript remplira automatiquement.

### Syntaxe de base

```ts
//      ↓ Le générique se met entre < > après le nom de la fonction
function premier<T>(tableau: T[]): T {
  //             ^          ^^^    ^
  //             |          |      |
  //             |          |      Le retour est de type T
  //             |          Le paramètre est un tableau de T
  //             On déclare un "paramètre de type" appelé T
  return tableau[0]
}
```

**Qu'est-ce que `T` ?** C'est un **placeholder** (un trou à remplir). Ça veut dire "un type qu'on ne connaît pas encore". TypeScript le remplacera par le vrai type quand on appellera la fonction.

### Comment ça marche en pratique

```ts
// Quand on appelle avec des nombres :
premier([10, 20, 30])
// TypeScript regarde : le tableau contient des number
// Donc T = number
// Donc le retour est number ✅

// Quand on appelle avec des strings :
premier(["chat", "chien", "poisson"])
// TypeScript regarde : le tableau contient des string
// Donc T = string
// Donc le retour est string ✅

// Quand on appelle avec des objets User :
premier([{ nom: "Alice", age: 25 }, { nom: "Bob", age: 30 }])
// TypeScript regarde : le tableau contient des { nom: string, age: number }
// Donc T = { nom: string, age: number }
// Donc le retour est { nom: string, age: number } ✅
```

### Le truc magique

TypeScript **devine** le type automatiquement ! Mais tu peux aussi le forcer :

```ts
// TypeScript devine tout seul (cas le plus courant) :
const a = premier([1, 2, 3])          // T est deviné comme number

// Tu peux aussi l'écrire explicitement si besoin :
const b = premier<string>(["a", "b"]) // T est forcé à string
//                ^^^^^^^ on force T = string
```

### Comparons les 3 approches

```ts
// ❌ SANS génériques : 3 fonctions identiques
function premierNombre(tab: number[]): number { return tab[0] }
function premierString(tab: string[]): string { return tab[0] }
function premierUser(tab: User[]): User { return tab[0] }

// ❌ Avec any : pas de sécurité
function premierAny(tab: any[]): any { return tab[0] }

// ✅ AVEC générique : 1 seule fonction, toujours typée
function premier<T>(tab: T[]): T { return tab[0] }
```

> **Retiens :** Un générique = "le même code pour plusieurs types, **sans perdre la sécurité**"

### 🎯 Pratique — Génériques simples

Dans `01-playground.ts` :

```ts
// Exercice 3.1 : Crée une fonction générique "dernier"
// qui retourne le dernier élément d'un tableau
function dernier<T>(tableau: ???): ??? {
  return ???;
}

// Tests :
dernier([1, 2, 3])              // doit retourner 3 (number)
dernier(["a", "b", "c"])        // doit retourner "c" (string)

// Exercice 3.2 : Crée une fonction "envelopper" qui met une valeur dans un tableau
function envelopper<T>(valeur: ???): ??? {
  return [valeur];
}

envelopper(42)       // doit retourner [42] de type number[]
envelopper("hello")  // doit retourner ["hello"] de type string[]
```

<details>
<summary>Solution</summary>

```ts
function dernier<T>(tableau: T[]): T {
  return tableau[tableau.length - 1];
}

function envelopper<T>(valeur: T): T[] {
  return [valeur];
}
```
</details>

---

## 🔒 Génériques avec contraintes (`extends`)

### 🧠 Rappel JavaScript : accéder aux propriétés d'un objet

```js
// En JavaScript, les objets ont des propriétés
const utilisateur = { id: 1, nom: "Alice" }

// On accède aux propriétés avec le point
utilisateur.id    // → 1
utilisateur.nom   // → "Alice"

// Le problème : certains objets n'ont pas certaines propriétés
const couleur = { nom: "rouge", code: "#FF0000" }
couleur.id        // → undefined (cette propriété n'existe pas !)
```

### Le problème

Parfois, dans ta fonction générique, tu veux **utiliser une propriété** de l'objet. Par exemple, tu veux chercher un élément par son `id` :

```ts
function trouverParId<T>(elements: T[], id: number): T | undefined {
  //                                                 ^^^^^^^^^^^^
  //                                                 T ou undefined si pas trouvé
  return elements.find((element) => element.id === id)
  //                                       ^^^
  //                    ❌ ERREUR ! TypeScript dit :
  //                    "T peut être n'importe quoi, même un number ou un string"
  //                    "Rien ne garantit que T a une propriété .id !"
}
```

TypeScript a raison ! Si quelqu'un appelle `trouverParId([1, 2, 3], 1)`, les nombres n'ont pas de propriété `id`.

### La solution : `extends` (contraindre le générique)

On dit à TypeScript : "T n'est pas n'importe quoi, c'est **au minimum** un objet qui a un `id`"

```ts
//                    ↓ "T doit au minimum avoir { id: number }"
function trouverParId<T extends { id: number }>(
  elements: T[],     // Un tableau de T
  id: number         // L'id qu'on cherche
): T | undefined {   // On retourne T ou undefined
  return elements.find((element) => element.id === id)
  //                                       ^^^
  //                    ✅ OK maintenant ! TypeScript sait que T a forcément un .id
}
```

### Analogie

C'est comme dire au déménageur :
- **Sans contrainte :** "Mets n'importe quoi dans la boîte" → il pourrait mettre de l'eau, et ça coulerait
- **Avec contrainte :** "Mets un objet **solide** dans la boîte" → maintenant on est sûr que ça tiendra

### Exemples concrets

```ts
// ✅ OK : l'objet a bien un id de type number
trouverParId([{ id: 1, nom: "Alice" }, { id: 2, nom: "Bob" }], 1)
// Résultat : { id: 1, nom: "Alice" }

// ✅ OK : l'objet a id ET d'autres propriétés (c'est autorisé)
trouverParId([{ id: 1, nom: "Alice", age: 25 }], 1)

// ❌ ERREUR : l'objet n'a PAS de propriété id
trouverParId([{ couleur: "rouge" }], 1)
// TypeScript dit : "{ couleur: string } n'a pas de propriété id !"

// ❌ ERREUR : ce ne sont même pas des objets
trouverParId([1, 2, 3], 1)
// TypeScript dit : "number n'a pas de propriété id !"
```

> **Retiens :** `<T extends X>` veut dire "T doit être **au moins** de type X (et peut avoir plus)"

### 🎯 Pratique — Contraintes extends

Dans `01-playground.ts` :

```ts
// Exercice 3.3 : Crée une fonction qui retourne le nom d'un objet
// Contrainte : l'objet doit avoir une propriété "name"
interface WithName {
  name: string;
}

function getNom<T extends ???>(obj: T): string {
  return obj.name;
}

// Tests :
getNom({ name: "Alice", age: 25 })  // ✅ doit fonctionner
getNom({ name: "Bob" })              // ✅ doit fonctionner  
getNom({ title: "Test" })            // ❌ doit échouer (pas de "name")

// Exercice 3.4 : Crée une fonction "comparer" pour des objets avec id
interface WithId {
  id: number;
}

function sontIdentiques<T extends ???>(a: T, b: T): boolean {
  return ???;
}
```

<details>
<summary>Solution</summary>

```ts
function getNom<T extends WithName>(obj: T): string {
  return obj.name;
}

function sontIdentiques<T extends WithId>(a: T, b: T): boolean {
  return a.id === b.id;
}
```
</details>

---

## 📋 Génériques sur les interfaces

### 🧠 Rappel JavaScript / TypeScript : les interfaces

```ts
// Une interface, c'est un "contrat" qui décrit la forme d'un objet
interface Utilisateur {
  nom: string     // doit avoir un nom (string)
  age: number     // doit avoir un age (number)
}

// Un objet qui respecte ce contrat :
const alice: Utilisateur = { nom: "Alice", age: 25 }  // ✅ OK

// Un objet qui ne respecte pas :
const bob: Utilisateur = { nom: "Bob" }  // ❌ Il manque "age" !
```

### Le problème

Imagine qu'on fait une API qui retourne toujours la même structure :

```ts
// La réponse contient toujours : les données, un statut, et un timestamp
// Mais les "données" changent selon l'endpoint !

// Pour une réponse avec un utilisateur :
interface ReponseUtilisateur {
  data: Utilisateur       // ← les données sont un Utilisateur
  status: number
  timestamp: string
}

// Pour une réponse avec une liste de produits :
interface ReponseProduits {
  data: Produit[]         // ← les données sont un tableau de Produits
  status: number
  timestamp: string
}

// Encore du copier-coller ! 😩
```

### La solution : interface générique

On fait **une seule interface** avec un paramètre `<T>` pour la partie qui change :

```ts
//                          ↓ T = le type des données (qui change)
interface ReponseApi<T> {
  data: T              // ← data est de type T (le type qu'on choisit)
  status: number       // ← toujours un number
  timestamp: string    // ← toujours un string
}
```

### Utilisation

```ts
// On "remplit" T avec le type qu'on veut :

// Une réponse qui contient un Utilisateur :
type ReponseUtilisateur = ReponseApi<Utilisateur>
// Équivaut à: { data: Utilisateur, status: number, timestamp: string }

// Une réponse qui contient un tableau de Produit :
type ReponseProduits = ReponseApi<Produit[]>
// Équivaut à: { data: Produit[], status: number, timestamp: string }

// Une réponse qui contient juste un string (message) :
type ReponseMessage = ReponseApi<string>
// Équivaut à: { data: string, status: number, timestamp: string }
```

### Exemple concret

```ts
// Fonction qui récupère la réponse d'une API
async function fetchApi<T>(url: string): Promise<ReponseApi<T>> {
  //                    ^                         ^^^^^^^^^^^^
  //                    |                         La réponse contient des données de type T
  //                    Un générique pour le type des données
  const response = await fetch(url)          // On appelle l'API
  const json = await response.json()         // On parse la réponse JSON
  return json as ReponseApi<T>               // On dit à TS que c'est une ReponseApi<T>
}

// Utilisation :
const users = await fetchApi<Utilisateur[]>("/api/users")
// users.data est de type Utilisateur[] ✅
// users.status est de type number ✅

const produit = await fetchApi<Produit>("/api/products/1")
// produit.data est de type Produit ✅
```

### 🎯 Pratique — Interfaces génériques

Dans `01-playground.ts` :

```ts
// Exercice 3.5 : Crée une interface générique "Boîte"
interface Boite<T> {
  contenu: T;
  dateAjout: Date;
}

// Utilise-la pour créer :
const boiteNombre: Boite<???> = { contenu: 42, dateAjout: new Date() };
const boiteTexte: Boite<???> = { contenu: "hello", dateAjout: new Date() };

// Exercice 3.6 : Crée une interface "Pagination" générique
interface Pagination<T> {
  items: ???;      // tableau d'éléments de type T
  total: number;   // nombre total d'éléments
  page: number;    // page actuelle
}

const pageUsers: Pagination<User> = {
  // ??? complète
};
```

<details>
<summary>Solution</summary>

```ts
const boiteNombre: Boite<number> = { contenu: 42, dateAjout: new Date() };
const boiteTexte: Boite<string> = { contenu: "hello", dateAjout: new Date() };

interface Pagination<T> {
  items: T[];
  total: number;
  page: number;
}

const pageUsers: Pagination<User> = {
  items: [{ id: 1, name: "Alice", email: "a@mail.com" }],
  total: 100,
  page: 1,
};
```
</details>

---

## 📝 Génériques sur les types (`type`)

Les `type` (alias de type) peuvent aussi être génériques. C'est exactement le même principe que pour les interfaces.

### Exemple simple : `Nullable`

Un cas très courant : "cette valeur peut être du type T **ou** null"

```ts
// On crée un type générique Nullable
type Nullable<T> = T | null
//   ^^^^^^^^ ^    ^^^^^^^^
//   |        |    |
//   |        |    T OU null (l'un ou l'autre)
//   |        Le paramètre de type
//   Le nom du type
```

### Utilisation

```ts
// Sans Nullable, on écrirait :
const utilisateur1: Utilisateur | null = null            // Verbeux
const nom1: string | null = "Alice"                      // Verbeux

// Avec Nullable, c'est plus propre :
const utilisateur2: Nullable<Utilisateur> = null         // ✅ Plus lisible
const nom2: Nullable<string> = "Alice"                   // ✅ Plus lisible
const score: Nullable<number> = null                     // ✅ Le score peut être null
```

### Autre exemple : `Resultat` (succès ou erreur)

```ts
// Un résultat peut être soit un succès (avec des données), soit une erreur (avec un message)
type Resultat<T> = 
  | { succes: true; donnees: T }             // Cas succès : on a les données de type T
  | { succes: false; erreur: string }        // Cas erreur : on a un message d'erreur

// Utilisation :
const ok: Resultat<Utilisateur> = {
  succes: true,
  donnees: { nom: "Alice", age: 25 }        // ✅ Les données sont de type Utilisateur
}

const echec: Resultat<Utilisateur> = {
  succes: false,
  erreur: "Utilisateur non trouvé"           // ✅ L'erreur est un string
}
```

### 🎯 Pratique — Types génériques

Dans `01-playground.ts` :

```ts
// Exercice 3.7 : Crée un type "Maybe" qui peut être T ou null
type Maybe<T> = ???;

const utilisateur: Maybe<User> = { id: 1, name: "Alice" };  // ✅
const pasDeUser: Maybe<User> = null;                         // ✅

// Exercice 3.8 : Crée un type "AsyncState" pour un état de chargement
type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: ??? }
  | { status: "error"; message: string };

const etatChargement: AsyncState<Product[]> = {
  status: "success",
  data: [] // doit être Product[]
};
```

<details>
<summary>Solution</summary>

```ts
type Maybe<T> = T | null;

type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string };
```
</details>

---

## 🔀 Plusieurs génériques (Multiple generics)

### 🧠 Rappel JavaScript : `.map()` sur un tableau

```js
// .map() transforme chaque élément d'un tableau
const nombres = [1, 2, 3]

// On transforme chaque nombre en string
const textes = nombres.map((n) => n.toString())
// textes = ["1", "2", "3"]

// L'entrée est un number, la sortie est un string
// Ce sont 2 types DIFFÉRENTS !
```

### Le concept

Parfois, une fonction a besoin de **plusieurs types différents**. On utilise alors **plusieurs paramètres de type**.

Par convention :
- `T` = le premier type (T comme "Type")
- `U` = le deuxième type
- `V` = le troisième type (si besoin)

```ts
// Cette fonction transforme un tableau de T en tableau de U
function transformer<T, U>(
  //                ^  ^
  //                |  |
  //                |  U = le type de SORTIE
  //                T = le type d'ENTRÉE
  tableau: T[],                    // Un tableau d'éléments de type T
  fn: (element: T) => U           // Une fonction qui prend un T et retourne un U
): U[] {                           // Le résultat est un tableau de U
  return tableau.map(fn)           // On applique la fonction à chaque élément
}
```

### Exemples concrets

```ts
// Transformer des nombres en strings
// T = number, U = string
const textes = transformer([1, 2, 3], (n) => n.toString())
// textes est de type string[] → ["1", "2", "3"]

// Transformer des utilisateurs en juste leurs noms
// T = Utilisateur, U = string
const noms = transformer(
  [{ nom: "Alice", age: 25 }, { nom: "Bob", age: 30 }],
  (u) => u.nom          // On extrait juste le nom
)
// noms est de type string[] → ["Alice", "Bob"]

// Transformer des strings en objets
// T = string, U = { valeur: string, longueur: number }
const enrichis = transformer(
  ["salut", "bonjour"],
  (mot) => ({
    valeur: mot,             // Le mot original
    longueur: mot.length     // Sa longueur (.length = nombre de caractères)
  })
)
// enrichis est de type { valeur: string, longueur: number }[]
```

### Analogie

C'est comme une **machine à transformer** :
- Tu mets des **oranges** (type T = Orange) dans la machine
- La machine produit du **jus** (type U = Jus)
- La machine est la même, mais ce qui entre et ce qui sort sont de types différents !

### 🎯 Pratique — Plusieurs génériques

Dans `01-playground.ts` :

```ts
// Exercice 3.9 : Crée une fonction "creerPaire" avec 2 génériques
function creerPaire<T, U>(premier: ???, second: ???): [T, U] {
  return [premier, second];
}

creerPaire("Alice", 25)    // doit retourner ["Alice", 25] de type [string, number]
creerPaire(true, [1, 2])   // doit retourner [true, [1,2]] de type [boolean, number[]]

// Exercice 3.10 : Crée une fonction "mapObject" 
// qui transforme un objet { key: T } en { key: U }
function mapObject<T, U>(
  obj: Record<string, T>,
  fn: (valeur: T) => U
): Record<string, U> {
  // ???
}

// Test:
const prix = { pomme: 1.5, banane: 2.0 };
const prixFormates = mapObject(prix, (p) => p + " €");
// doit retourner { pomme: "1.5 €", banane: "2 €" }
```

<details>
<summary>Solution</summary>

```ts
function creerPaire<T, U>(premier: T, second: U): [T, U] {
  return [premier, second];
}

function mapObject<T, U>(
  obj: Record<string, T>,
  fn: (valeur: T) => U
): Record<string, U> {
  const result: Record<string, U> = {};
  for (const key in obj) {
    result[key] = fn(obj[key]);
  }
  return result;
}
```
</details>

---

## 🟢 Les génériques dans Vue 3

### Pourquoi c'est important

Tu n'as peut-être pas encore vu Vue 3, mais sache que les génériques sont **partout** dans Vue. Si tu comprends les génériques, tu comprendras Vue beaucoup mieux.

### `ref<T>` — une valeur réactive

En Vue 3, `ref()` crée une valeur "réactive" (qui déclenche un re-rendu de la page quand elle change). C'est un générique !

```ts
import { ref, computed } from "vue"

// ref<T> crée une "boîte réactive" qui contient une valeur de type T

// ref avec un nombre
const compteur = ref<number>(0)
//                   ^^^^^^  ^
//                   |       Valeur initiale : 0
//                   Le type de la valeur : number
// compteur.value est de type number

// ref avec un utilisateur OU null
const utilisateur = ref<Utilisateur | null>(null)
//                      ^^^^^^^^^^^^^^^^^^  ^^^^
//                      |                   Valeur initiale : null (pas encore chargé)
//                      Le type : Utilisateur ou null
// utilisateur.value est de type Utilisateur | null
```

### `computed<T>` — une valeur calculée

```ts
// computed<T> crée une valeur calculée automatiquement à partir d'autres valeurs
const double = computed<number>(() => compteur.value * 2)
//                      ^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^
//                      |       La fonction de calcul
//                      Le type du résultat : number
// double.value est de type number

// Souvent, TypeScript devine le type tout seul :
const double2 = computed(() => compteur.value * 2)
// TypeScript devine que c'est un number → pas besoin de <number>
```

### En résumé pour Vue 3

```ts
// Les génériques qu'on voit le plus souvent en Vue :
const compteur = ref<number>(0)                  // Ref<number>
const nom = ref<string>("Alice")                 // Ref<string>
const user = ref<Utilisateur | null>(null)       // Ref<Utilisateur | null>
const liste = ref<Produit[]>([])                 // Ref<Produit[]>
const double = computed<number>(() => 2 * 2)     // ComputedRef<number>
```

### 🎯 Pratique — Génériques Vue 3

Dans `01-playground.ts` (syntaxe TS pure, sans Vue) :

```ts
// Exercice 3.11 : Simule le typage de ref
interface Ref<T> {
  value: T;
}

// Crée des "refs" typées
const compteur: Ref<number> = { value: 0 };
const utilisateur: Ref<??? | null> = { value: null }; // peut être User ou null
const panier: Ref<???[]> = { value: [] };             // tableau de Product

// Exercice 3.12 : Crée un type pour computed
interface ComputedRef<T> {
  readonly value: T;  // readonly = ne peut pas être modifié
}

const total: ComputedRef<number> = { value: 150 };
// total.value = 200;  // ❌ doit échouer (readonly !)
```

<details>
<summary>Solution</summary>

```ts
const utilisateur: Ref<User | null> = { value: null };
const panier: Ref<Product[]> = { value: [] };
```
</details>

---

## 🛠️ Cas concret : un composable générique

### 🧠 Rappel JavaScript : `localStorage`

```js
// localStorage permet de sauvegarder des données dans le navigateur
// Les données persistent même si on ferme le navigateur !

// Sauvegarder une valeur (ATTENTION : seulement des strings)
localStorage.setItem("theme", "dark")

// Récupérer une valeur
const theme = localStorage.getItem("theme")  // → "dark"

// Pour sauvegarder un objet, on le convertit en string JSON :
const panier = [{ nom: "T-shirt", prix: 20 }]
localStorage.setItem("panier", JSON.stringify(panier))
//                              ^^^^^^^^^^^^^^ Objet → String JSON

// Pour le récupérer, on reconvertit :
const panierTexte = localStorage.getItem("panier")        // → string JSON
const panierObjet = JSON.parse(panierTexte)                // → objet JavaScript
//                  ^^^^^^^^^^ String JSON → Objet
```

### Un composable, c'est quoi ?

En Vue 3, un **composable** c'est une fonction réutilisable qui encapsule de la logique. C'est un concept qu'on verra en détail plus tard. Pour l'instant, regardons juste comment les génériques rendent un composable **flexible**.

### Le composable `useLocalStorage`

On veut créer une fonction qui :
1. Lit une valeur depuis `localStorage`
2. La rend **réactive** (Vue met à jour la page quand elle change)
3. **Sauvegarde automatiquement** quand la valeur change

```ts
import { ref, watch } from "vue"

// La fonction est générique : T = le type de la donnée qu'on stocke
function useLocalStorage<T>(cle: string, valeurParDefaut: T) {
  //                     ^  ^^^^^^^^^^^  ^^^^^^^^^^^^^^^^ ^
  //                     |  |            |                Le type de la valeur par défaut
  //                     |  |            La valeur si rien n'est stocké
  //                     |  La clé dans localStorage (ex: "theme", "panier")
  //                     Le type de la donnée stockée
  
  // Étape 1 : On essaie de lire la valeur déjà stockée
  const stocke = localStorage.getItem(cle)  // Récupère le string ou null
  
  // Étape 2 : On crée la ref réactive
  // Si une valeur est stockée → on la parse (JSON → objet)
  // Sinon → on utilise la valeur par défaut
  const donnees = ref<T>(
    stocke                          // Si quelque chose est stocké...
      ? JSON.parse(stocke)          // ...on le convertit en objet
      : valeurParDefaut             // ...sinon on prend la valeur par défaut
  )
  
  // Étape 3 : On surveille les changements et on sauvegarde automatiquement
  watch(
    donnees,                         // On surveille cette variable
    (nouvelleValeur) => {            // Quand elle change...
      localStorage.setItem(          // ...on sauvegarde dans localStorage
        cle,                         // La clé
        JSON.stringify(nouvelleValeur) // La valeur convertie en string
      )
    },
    { deep: true }                   // deep: true = surveiller aussi les sous-propriétés
  )
  
  return donnees                     // On retourne la ref réactive
}
```

### Utilisation (la magie des génériques)

```ts
// Le thème : T = "light" | "dark" (seulement ces 2 valeurs possibles)
const theme = useLocalStorage<"light" | "dark">("theme", "light")
// theme.value est de type "light" | "dark"
// theme.value = "light"  ✅
// theme.value = "dark"   ✅
// theme.value = "blue"   ❌ TypeScript refuse !

// Le panier : T = Produit[] (un tableau de Produit)
const panier = useLocalStorage<Produit[]>("panier", [])
// panier.value est de type Produit[]
// panier.value.push({ nom: "T-shirt", prix: 20 })  ✅

// Les préférences : T = { langue: string, notifications: boolean }
const prefs = useLocalStorage("prefs", { langue: "fr", notifications: true })
// TypeScript DEVINE T automatiquement grâce à la valeur par défaut !
// prefs.value.langue est de type string ✅
```

> **Le pouvoir des génériques :** Une **seule** fonction qui marche avec des strings, des tableaux, des objets... et TypeScript sait **toujours** quel type on manipule.

### 🎯 Pratique — Composable générique

Dans `01-playground.ts` :

```ts
// Exercice 3.13 : Crée un composable générique "useStack" (pile)
// Une pile = on ajoute/retire des éléments par le dessus (LIFO)

function useStack<T>(initial: T[] = []) {
  const items: T[] = [...initial];
  
  return {
    // push : ajoute un élément au sommet
    push: (item: ???) => { items.push(item); },
    
    // pop : retire et retourne l'élément du sommet
    pop: (): ??? => items.pop(),
    
    // peek : regarde l'élément du sommet sans le retirer
    peek: (): ??? => items[items.length - 1],
    
    // size : nombre d'éléments
    size: () => items.length,
  };
}

// Tests :
const pileNombres = useStack<number>();
pileNombres.push(1);
pileNombres.push(2);
console.log(pileNombres.pop());  // 2

const pileUsers = useStack<User>();
pileUsers.push({ id: 1, name: "Alice" });
```

<details>
<summary>Solution</summary>

```ts
function useStack<T>(initial: T[] = []) {
  const items: T[] = [...initial];
  
  return {
    push: (item: T) => { items.push(item); },
    pop: (): T | undefined => items.pop(),
    peek: (): T | undefined => items[items.length - 1],
    size: () => items.length,
  };
}
```
</details>

---

## 🔍 Type Guards (Narrowing) — Vérifier les types à l'exécution

### C'est quoi le problème ?

TypeScript vérifie les types **avant** l'exécution (quand tu écris le code). Mais parfois, on reçoit des données dont on **ne connaît pas le type à l'avance** (par exemple, une réponse d'API, ou un paramètre qui peut être de plusieurs types).

On a besoin de **vérifier le type pendant l'exécution** du code. C'est ce qu'on appelle le **narrowing** (rétrécissement de type).

### 🧠 Rappel JavaScript : `typeof`

```js
// typeof donne le type d'une valeur en JavaScript
typeof "hello"     // → "string"
typeof 42          // → "number"
typeof true        // → "boolean"
typeof undefined   // → "undefined"
typeof null        // → "object"  ⚠️ Bug historique de JavaScript !
typeof { a: 1 }    // → "object"
typeof [1, 2]      // → "object"  ⚠️ Les tableaux sont des objets !
```

### Méthode 1 : `typeof` — pour les types simples

```ts
// La fonction accepte un string OU un number
function formater(valeur: string | number): string {
  
  // On vérifie le type avec typeof
  if (typeof valeur === "string") {
    // ICI, TypeScript SAIT que valeur est un string
    // Donc on peut utiliser les méthodes de string :
    return valeur.toUpperCase()   // Met en majuscules
    //           ^^^^^^^^^^^^^ ✅ OK car TypeScript sait que c'est un string
  }
  
  // ICI, TypeScript SAIT que valeur est un number
  // (car si c'était un string, on serait rentré dans le if)
  return valeur.toFixed(2)        // Affiche avec 2 décimales
  //           ^^^^^^^^^ ✅ OK car TypeScript sait que c'est un number
}

// Exemples :
formater("bonjour")   // → "BONJOUR"
formater(3.14159)     // → "3.14"
```

### Méthode 2 : `in` — pour vérifier si une propriété existe

```ts
// Deux interfaces qui ont des propriétés DIFFÉRENTES
interface Chien {
  aboyer(): void     // Un chien aboie (aboyer = bark en anglais)
}

interface Chat {
  miauler(): void    // Un chat miaule (miauler = meow en anglais)
}

function faireDuBruit(animal: Chien | Chat): void {
  //                          ^^^^^^^^^^^^
  //                          On ne sait pas si c'est un Chien ou un Chat
  
  // On vérifie si la propriété "aboyer" EXISTE dans l'objet
  if ("aboyer" in animal) {
    //         ^^ "in" vérifie si la propriété existe dans l'objet
    
    // ICI, TypeScript SAIT que animal est un Chien
    animal.aboyer()   // ✅ OK
  } else {
    // ICI, TypeScript SAIT que animal est un Chat
    // (car si "aboyer" n'existe pas, c'est forcément un Chat)
    animal.miauler()  // ✅ OK
  }
}
```

### Méthode 3 : Custom Type Guard — créer ses propres vérificateurs

Parfois, `typeof` et `in` ne suffisent pas. On peut créer notre **propre fonction de vérification**.

```ts
// Une interface Utilisateur
interface Utilisateur {
  id: number
  nom: string
}

// Un "type guard personnalisé"
// Le retour "obj is Utilisateur" dit à TypeScript :
// "Si cette fonction retourne true, alors obj est un Utilisateur"
function estUtilisateur(obj: unknown): obj is Utilisateur {
  //                    ^^^^^^^^^^^    ^^^^^^^^^^^^^^^^^
  //                    |              |
  //                    |              "obj EST un Utilisateur" (si retourne true)
  //                    Le paramètre est de type unknown (on ne sait pas)
  return (
    typeof obj === "object" &&    // C'est un objet (pas un string, number, etc.)
    obj !== null &&               // Ce n'est pas null (car typeof null === "object")
    "id" in obj &&                // L'objet a une propriété "id"
    "nom" in obj                  // L'objet a une propriété "nom"
  )
}
```

### Utilisation du type guard personnalisé

```ts
function traiterDonnee(donnee: unknown) {
  //                          ^^^^^^^
  //                          On ne sait pas du tout ce que c'est
  
  if (estUtilisateur(donnee)) {
    // ICI, TypeScript SAIT que donnee est un Utilisateur !
    console.log(donnee.nom)     // ✅ OK — TypeScript sait que .nom existe
    console.log(donnee.id)      // ✅ OK — TypeScript sait que .id existe
  } else {
    console.log("Ce n'est pas un utilisateur")
  }
}

// Exemples :
traiterDonnee({ id: 1, nom: "Alice" })  // → Affiche "Alice"
traiterDonnee({ couleur: "rouge" })      // → Affiche "Ce n'est pas un utilisateur"
traiterDonnee(42)                         // → Affiche "Ce n'est pas un utilisateur"
traiterDonnee(null)                       // → Affiche "Ce n'est pas un utilisateur"
```

### Résumé des 3 méthodes

| Méthode | Quand l'utiliser | Exemple |
|---------|-----------------|---------|
| `typeof` | Pour les types simples (string, number, boolean) | `typeof x === "string"` |
| `in` | Pour vérifier si une propriété existe dans un objet | `"nom" in obj` |
| Custom guard | Pour des vérifications complexes | `function isX(o): o is X` |

---

## ✏️ Exercice

Maintenant, c'est à toi de jouer ! Essaie de faire ces 3 exercices **sans regarder la solution** d'abord.

```ts
// EXERCICE 1 : Fonction groupBy
// ==============================
// Écris une fonction générique groupBy qui prend :
// - un tableau d'éléments
// - une clé par laquelle regrouper
// Et retourne un objet où chaque clé contient un tableau d'éléments
//
// Exemple :
// const users = [
//   { nom: "Alice", ville: "Paris" },
//   { nom: "Bob", ville: "Lyon" },
//   { nom: "Charlie", ville: "Paris" }
// ]
// groupBy(users, "ville")
// → { "Paris": [Alice, Charlie], "Lyon": [Bob] }
//
// Signature : function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]>


// EXERCICE 2 : Type PaginatedResponse
// ====================================
// Écris un type générique PaginatedResponse<T> qui représente une page de résultats
// avec : items (tableau de T), total (number), page (number)


// EXERCICE 3 : Type Guard isString
// ==================================
// Écris un type guard isString qui vérifie si une valeur est un string
// Signature : function isString(value: unknown): value is string
```

> **Conseil :** Relis les sections précédentes si tu es bloqué. C'est normal de devoir relire ! 😊

---

## Solution détaillée

### 1. Fonction `groupBy` — Explications étape par étape

Cet exercice est le plus dur des trois. Décomposons-le **très lentement**.

#### Étape 1 : Comprendre ce qu'on veut faire (en français, pas en code)

```
On a un tableau de personnes :
  Alice → Paris
  Bob → Lyon
  Charlie → Paris

On veut regrouper par ville :
  Paris → [Alice, Charlie]
  Lyon → [Bob]
```

#### Étape 2 : Version JavaScript simple (sans types)

```js
// D'abord, écrivons-le en JavaScript pur pour comprendre la logique
function groupBy(tableau, cle) {
  const resultat = {}                     // On crée un objet vide pour le résultat
  
  for (const element of tableau) {        // Pour chaque élément du tableau...
    const valeur = element[cle]           // On récupère la valeur de la clé
    //             ^^^^^^^^^^^^
    //             Si cle = "ville" et element = { nom: "Alice", ville: "Paris" }
    //             Alors valeur = "Paris"
    
    if (!resultat[valeur]) {              // Si cette catégorie n'existe pas encore...
      resultat[valeur] = []               // ...on crée un tableau vide
    }
    
    resultat[valeur].push(element)        // On ajoute l'élément dans la catégorie
  }
  
  return resultat                         // On retourne le résultat
}
```

#### Étape 3 : Ajoutons les types un par un

```ts
// 🧠 Rappels nécessaires :
// - keyof T = "toutes les clés possibles de T"
//   Si T = { nom: string, age: number }, alors keyof T = "nom" | "age"
//
// - Record<string, T[]> = un objet dont les clés sont des strings
//   et les valeurs sont des tableaux de T
//   Exemple : { "Paris": [alice, charlie], "Lyon": [bob] }

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  //             ^  ^^^^^^^^  ^^^^^^^^^^     ^^^^^^^^^^^^^^^^^^^
  //             |  |         |              |
  //             |  |         |              Le retour : un objet avec
  //             |  |         |              clés string → tableaux de T
  //             |  |         |
  //             |  |         key doit être une VRAIE propriété de T
  //             |  |         (pas n'importe quel string)
  //             |  |
  //             |  Un tableau d'éléments de type T
  //             |
  //             T = le type des éléments (deviné automatiquement)
  
  const resultat: Record<string, T[]> = {}
  //              ^^^^^^^^^^^^^^^^^^^
  //              On type aussi la variable locale
  
  for (const element of arr) {
    const valeur = String(element[key])
    //             ^^^^^^ ^^^^^^^^^^^^^
    //             |      |
    //             |      On accède à la propriété. Ex: element["ville"] → "Paris"
    //             On convertit en string (car les clés d'objet doivent être des strings)
    
    if (!resultat[valeur]) {
      resultat[valeur] = []           // Création du tableau si la catégorie n'existe pas
    }
    
    resultat[valeur].push(element)    // Ajout de l'élément dans sa catégorie
  }
  
  return resultat
}
```

#### Étape 4 : Utilisation et vérifications

```ts
const utilisateurs = [
  { nom: "Alice", age: 25, ville: "Paris" },
  { nom: "Bob", age: 30, ville: "Lyon" },
  { nom: "Charlie", age: 25, ville: "Paris" }
]

// Regrouper par ville
const parVille = groupBy(utilisateurs, "ville")
// TypeScript devine que T = { nom: string, age: number, ville: string }
// Résultat : { "Paris": [Alice, Charlie], "Lyon": [Bob] }

// Regrouper par age
const parAge = groupBy(utilisateurs, "age")
// Résultat : { "25": [Alice, Charlie], "30": [Bob] }

// ❌ Erreur : "couleur" n'est pas une propriété de l'objet !
const parCouleur = groupBy(utilisateurs, "couleur")
// TypeScript dit : "couleur" n'est pas dans "nom" | "age" | "ville"
```

### 2. Type `PaginatedResponse` — C'est simple !

```ts
// 🧠 Rappel : qu'est-ce qu'une page de résultats ?
// Quand tu cherches sur Google, tu ne vois pas TOUS les résultats d'un coup.
// Tu vois une "page" de 10 résultats, avec un bouton "Page suivante".
//
// C'est pareil pour les API : on demande les résultats page par page
// On a besoin de savoir :
// - items : les éléments de cette page
// - total : le nombre TOTAL d'éléments (toutes pages confondues)
// - page : le numéro de la page actuelle

type PaginatedResponse<T> = {
  items: T[]        // Le tableau des éléments de cette page (type T)
  total: number     // Le nombre total d'éléments dans toute la base
  page: number      // Le numéro de la page actuelle (1, 2, 3...)
}

// Exemples d'utilisation :

// Une page d'utilisateurs
type PageUtilisateurs = PaginatedResponse<Utilisateur>
// Équivaut à : { items: Utilisateur[], total: number, page: number }

// Une page de produits
type PageProduits = PaginatedResponse<Produit>
// Équivaut à : { items: Produit[], total: number, page: number }

// Usage concret (comme si on recevait ça d'une API) :
const pageUtilisateurs: PaginatedResponse<Utilisateur> = {
  items: [                                 // Les 2 utilisateurs de cette page
    { id: 1, nom: "Alice", age: 25 },
    { id: 2, nom: "Bob", age: 30 }
  ],
  total: 150,                              // Il y a 150 utilisateurs au total
  page: 1                                  // On est sur la page 1
}

// TypeScript nous protège :
pageUtilisateurs.items[0].nom              // ✅ OK, c'est un string
pageUtilisateurs.items[0].couleur          // ❌ Erreur ! "couleur" n'existe pas sur Utilisateur
```

### 3. Type Guard `isString` — Vérifier les types à l'exécution

```ts
// 🧠 Rappel : pourquoi on a besoin de ça ?
// Parfois, on reçoit une donnée et on ne sait pas son type
// Par exemple : une réponse d'API, un paramètre de fonction, etc.
// Le type "unknown" veut dire "on ne sait pas du tout ce que c'est"

// La fonction type guard
function isString(value: unknown): value is string {
  //               ^^^^^^^^^^^^^   ^^^^^^^^^^^^^^^
  //               |               |
  //               |               "value EST un string" (si la fonction retourne true)
  //               On ne sait pas ce que c'est
  return typeof value === "string"
  //     ^^^^^^^^^^^^^^^^^^^^^^^^
  //     On utilise typeof pour vérifier si c'est un string
}

// Exemples de ce que ça retourne :
isString("bonjour")     // → true   (c'est bien un string)
isString(42)            // → false  (c'est un number)
isString(null)          // → false  (c'est null)
isString(undefined)     // → false  (c'est undefined)
isString({ a: 1 })     // → false  (c'est un objet)

// Pourquoi c'est utile ? Pour le narrowing !
function traiter(donnee: unknown) {
  // Ici, TypeScript ne sait RIEN sur "donnee"
  // donnee.toUpperCase()  // ❌ Erreur : unknown n'a pas de méthode toUpperCase
  
  if (isString(donnee)) {
    // ICI, grâce au type guard, TypeScript SAIT que donnee est un string !
    console.log(donnee.toUpperCase())   // ✅ OK !
    console.log(donnee.length)          // ✅ OK ! (.length = nombre de caractères)
  } else {
    console.log("Ce n'est pas un string, c'est :", typeof donnee)
  }
}

// Exemples concrets :
traiter("salut")          // → "SALUT"
traiter(42)               // → "Ce n'est pas un string, c'est : number"
traiter(null)             // → "Ce n'est pas un string, c'est : object"
```

### Bonus : pourquoi pas juste `typeof` directement ?

```ts
// Tu pourrais te demander : pourquoi créer isString()
// alors qu'on peut utiliser typeof directement ?

// Pour des cas simples, c'est vrai que typeof suffit :
if (typeof donnee === "string") { /* ... */ }

// MAIS un type guard personnalisé est utile quand :
// 1. La vérification est COMPLEXE (comme estUtilisateur() plus haut)
// 2. On veut RÉUTILISER la vérification à plusieurs endroits
// 3. On veut un code plus LISIBLE

// Exemple : au lieu de répéter cette vérification partout...
if (typeof obj === "object" && obj !== null && "id" in obj && "nom" in obj) { }

// ...on crée un type guard et on l'utilise partout :
if (estUtilisateur(obj)) { }   // Beaucoup plus lisible ! ✅
```

---

## 🎯 Résumé — Ce qu'il faut retenir

| Concept | Syntaxe | Analogie |
|---------|---------|----------|
| Générique simple | `<T>` | La boîte avec une étiquette |
| Avec contrainte | `<T extends X>` | La boîte qui n'accepte QUE certaines choses |
| Interface générique | `interface Nom<T>` | Un formulaire avec un champ variable |
| Type générique | `type Nom<T>` | Même chose, syntaxe différente |
| Plusieurs génériques | `<T, U>` | Machine : entrée T → sortie U |
| Type guard | `value is Type` | Agent de sécurité qui vérifie l'identité |

**Les 3 choses à retenir absolument :**
1. `<T>` = "un type qu'on ne connaît pas encore, TypeScript le devinera"
2. `extends` = "T doit être **au moins** de ce type"
3. Type guard = "une fonction qui **prouve** à TypeScript quel est le type"

> **C'est normal de trouver ça difficile !** Les génériques sont le concept le plus abstrait de TypeScript. Avec la pratique, ça devient naturel. Relis ce chapitre autant de fois que nécessaire. 💪

---

## Suite

→ `cours/00-typescript/04-typer-vue3.md`
