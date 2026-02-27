# 01 — Types de base et configuration strict

---

## Pourquoi TypeScript ?

Imagine que tu construis un meuble IKEA. JavaScript, c'est comme monter le meuble **sans la notice** : tu peux y arriver, mais tu risques de mettre des pièces au mauvais endroit et de ne t'en rendre compte qu'à la fin (quand le meuble s'écroule 😬).

TypeScript, c'est la **notice de montage**. Il te prévient **avant** que tu fasses une erreur.

Concrètement, TypeScript c'est :

- **Un détecteur de bugs** — Il te dit "attention, ça va planter" **avant** que tu lances ton site
- **Une documentation vivante** — Quand un collègue lit ton code, il voit immédiatement quel type de donnée chaque variable contient
- **Un assistant intelligent** — Ton éditeur (VS Code) peut te proposer de l'autocomplétion bien plus précise

> **En résumé** : TypeScript = JavaScript + un système de vérification des types de données.
> Tu écris du TypeScript, et il est **transformé** en JavaScript avant d'être exécuté par le navigateur.

---

## Configuration minimale

Quand tu crées un projet TypeScript (ou Vue 3 avec TypeScript), il y a un fichier de configuration appelé `tsconfig.json` à la racine du projet. C'est lui qui dit à TypeScript **comment** vérifier ton code.

L'option la plus importante :

```json
{
  "compilerOptions": {
    "strict": true   // Active TOUTES les vérifications strictes
  }
}
```

### Qu'est-ce que `strict: true` fait ?

Il active un ensemble de règles qui obligent à être précis dans ton code :

- **`noImplicitAny`** — Interdit les variables dont TypeScript ne peut pas deviner le type (on verra `any` plus bas)
- **`strictNullChecks`** — Oblige à gérer les cas où une valeur peut être `null` ou `undefined`
- **`strictFunctionTypes`** — Vérifie que les fonctions reçoivent les bons types de paramètres

> **🔒 Règle du parcours : on ne désactive JAMAIS `strict`.** C'est comme enlever la ceinture de sécurité : ça semble plus confortable, mais ça finit mal.

---

## Rappel JavaScript : les variables

Avant de parler des types TypeScript, rappelons comment on crée des variables en JavaScript :

```js
// 📦 "let" crée une variable qu'on peut MODIFIER plus tard
let age = 25;         // On crée une boîte "age" qui contient 25
age = 26;             // OK : on peut changer le contenu de la boîte

// 🔒 "const" crée une variable qu'on ne peut PAS modifier
const prenom = "Alice";  // On crée une boîte "prenom" qui contient "Alice"
// prenom = "Bob";       // ❌ ERREUR ! const = constant = ne change pas
```

> **Pourquoi pas `var` ?** C'est l'ancienne syntaxe JavaScript. Elle a des comportements bizarres (les variables "remontent" en haut du code toutes seules, un truc appelé "hoisting"). **On ne l'utilise plus.** Toujours `let` ou `const`.

### Quand utiliser `let` vs `const` ?

- **`const`** par défaut (la plupart du temps) → plus sûr
- **`let`** uniquement quand la valeur doit changer (un compteur, un score, etc.)

---

## Rappel JavaScript : les types de données de base

En JavaScript, chaque valeur a un **type**. C'est la "nature" de la donnée :

```js
"Alice"       // → string   (du texte, toujours entre guillemets)
42            // → number   (un nombre, entier ou décimal)
true          // → boolean  (vrai ou faux, comme un interrupteur ON/OFF)
null          // → null     (vide volontairement : "je sais qu'il n'y a rien")
undefined     // → undefined (pas encore défini : "on n'a rien mis dedans")
```

> **Analogie** : Pense aux types comme des **catégories de boîtes**.
> Une boîte "texte" ne peut pas faire des calculs. Une boîte "nombre" ne peut pas être mise en majuscules.
> Les types aident l'ordinateur (et toi !) à savoir **quoi faire** avec chaque donnée.

---

## Les types primitifs en TypeScript

En TypeScript, on peut **indiquer le type** d'une variable avec `: type` après le nom :

```ts
// La syntaxe : nomVariable: type = valeur

const prenom: string = "Alice";       // string  = du texte
// "prenom" est une boîte qui ne peut contenir QUE du texte

const age: number = 30;               // number  = un nombre
// "age" est une boîte qui ne peut contenir QUE des nombres

const estActif: boolean = true;       // boolean = vrai (true) ou faux (false)
// "estActif" est un interrupteur : soit ON (true), soit OFF (false)

const rien: null = null;              // null    = volontairement vide
// Utile pour dire "cette variable existe mais n'a pas de valeur pour l'instant"

const pasDéfini: undefined = undefined; // undefined = pas encore de valeur
// La différence avec null : undefined = "on n'a rien mis", null = "on a mis 'rien' exprès"
```

### Qu'est-ce que ça change par rapport à JavaScript ?

En JavaScript pur, rien ne t'empêche de faire ça :

```js
let age = 30;       // age est un nombre
age = "trente";     // age est maintenant du texte ?! → Aucune erreur en JS 😱
```

En TypeScript, c'est interdit :

```ts
let age: number = 30;   // age est un nombre
// age = "trente";      // ❌ ERREUR TypeScript : "trente" n'est pas un number !
```

> **C'est le super-pouvoir de TypeScript** : il empêche de mélanger les types par accident.

### 🎯 Pratique — Types primitifs

Ouvre `01-playground.ts` et écris :

```ts
// Exercice 1.1 : Déclare ces variables avec leur type
const nomProduit: ??? = "iPhone 15";
const prix: ??? = 999.99;
const enStock: ??? = true;

// Exercice 1.2 : Corrige cette erreur
let score: number = 100;
score = "cent"; // ❌ Que dit TypeScript ?
```

<details>
<summary>Solution</summary>

```ts
const nomProduit: string = "iPhone 15";
const prix: number = 999.99;
const enStock: boolean = true;

// L'erreur : Type 'string' is not assignable to type 'number'
```
</details>

---

## L'inférence de type (TypeScript devine tout seul)

Tu n'es pas obligé d'écrire le type à chaque fois. Si TypeScript peut le **deviner**, il le fait automatiquement. C'est ce qu'on appelle l'**inférence** :

```ts
const prenom = "Alice";  // TypeScript devine : c'est un string ✅
const age = 30;           // TypeScript devine : c'est un number ✅
const estActif = true;    // TypeScript devine : c'est un boolean ✅
```

C'est exactement pareil que d'écrire :

```ts
const prenom: string = "Alice";
const age: number = 30;
const estActif: boolean = true;
```

### Quand écrire le type explicitement ?

- **Ne l'écris PAS** quand c'est évident (comme ci-dessus) → le code est plus court et lisible
- **Écris-le** quand TypeScript ne peut pas deviner, par exemple pour les paramètres de fonctions :

```ts
// ❌ TypeScript ne peut pas deviner le type de "nom" ici
// function saluer(nom) { ... }  → Erreur en mode strict !

// ✅ On indique que "nom" est un string
function saluer(nom: string) {
  return "Bonjour " + nom;   // TypeScript sait que "nom" est du texte
}
```

> **Règle simple** : Laisse TypeScript deviner quand il peut. Aide-le quand il ne peut pas.

### 🎯 Pratique — Inférence

Dans `01-playground.ts` :

```ts
// Exercice 1.3 : Sans exécuter, devine le type inféré par TypeScript
const ville = "Paris";              // Type inféré : ???
const temperature = -5;              // Type inféré : ???
const estGele = temperature < 0;    // Type inféré : ???

// Exercice 1.4 : Écris une fonction qui calcule le double d'un nombre
function double(n: ???): ??? {
  return n * 2;
}
```

<details>
<summary>Solution</summary>

```ts
const ville = "Paris";              // string
const temperature = -5;              // number
const estGele = temperature < 0;    // boolean

function double(n: number): number {
  return n * 2;
}
```
</details>

---

## Rappel JavaScript : les tableaux (arrays)

Un tableau, c'est une **liste ordonnée** de valeurs :

```js
const prenoms = ["Alice", "Bob", "Charlie"];
// C'est une liste de 3 textes

console.log(prenoms[0]);  // "Alice"  → le premier élément (on compte à partir de 0)
console.log(prenoms[1]);  // "Bob"    → le deuxième élément
console.log(prenoms.length); // 3     → le nombre d'éléments
```

> **Attention** : en programmation, on commence à compter à **0**, pas à 1 !

---

## Les tableaux en TypeScript

En TypeScript, on précise le type des éléments du tableau avec `type[]` :

```ts
// Un tableau qui ne peut contenir QUE des strings (textes)
const prenoms: string[] = ["Alice", "Bob"];
// prenoms.push(42);  // ❌ ERREUR : 42 n'est pas un string !
// prenoms.push("Charlie");  // ✅ OK

// Un tableau qui ne peut contenir QUE des numbers (nombres)
const ages: number[] = [30, 25, 42];
// ages.push("trente");  // ❌ ERREUR : "trente" n'est pas un number !

// Un tableau qui peut contenir des strings OU des numbers (union de types)
const melange: (string | number)[] = ["Alice", 30];
// Le symbole | signifie "OU" : string OU number
```

> **Le symbole `|`** : c'est comme dire "type A **ou** type B". On appelle ça une **union de types**.

### 🎯 Pratique — Tableaux

Dans `01-playground.ts` :

```ts
// Exercice 1.5 : Crée un tableau de prix (nombres uniquement)
const prixProduits: ??? = [29.99, 49.99, 99.99];

// Exercice 1.6 : Crée un tableau qui accepte texte OU nombre
const donneesMixtes: ??? = ["Alice", 25, "Bob", 30];

// Exercice 1.7 : Que se passe-t-il si tu fais ça ?
prixProduits.push("gratuit"); // ???
```

<details>
<summary>Solution</summary>

```ts
const prixProduits: number[] = [29.99, 49.99, 99.99];
const donneesMixtes: (string | number)[] = ["Alice", 25, "Bob", 30];

// Erreur : Argument of type 'string' is not assignable to parameter of type 'number'
```
</details>

---

## Les Tuples (tableaux à taille fixe)

Un **tuple**, c'est un tableau spécial où :
- Le **nombre** d'éléments est fixe
- Le **type de chaque position** est défini à l'avance

> **Analogie** : Pense à un formulaire papier avec des cases numérotées.
> Case 1 = ton nom (texte), Case 2 = ton âge (nombre).
> Tu ne peux pas mettre un nombre dans la case "nom".

```ts
// On définit un tuple : [string, number]
// → Position 0 = un texte, Position 1 = un nombre
const personne: [string, number] = ["Alice", 30];

console.log(personne[0]); // "Alice" → TypeScript sait que c'est un string
console.log(personne[1]); // 30      → TypeScript sait que c'est un number

// personne[0] = 42;         // ❌ ERREUR : la position 0 attend un string !
// personne[2];              // ❌ ERREUR : il n'y a pas de position 2 !
```

### Différence tableau vs tuple

```ts
const tableau: string[] = ["Alice", "Bob", "Charlie"]; // Longueur libre, tout est string
const tuple: [string, number] = ["Alice", 30];          // Exactement 2 éléments, types fixés
```

### 🎯 Pratique — Tuples

Dans `01-playground.ts` :

```ts
// Exercice 1.8 : Crée un tuple pour une coordonnée GPS [latitude, longitude]
const paris: ??? = [48.8566, 2.3522];

// Exercice 1.9 : Crée un tuple pour [nom, age, estMembre]
const membre: ??? = ["Alice", 28, true];

// Exercice 1.10 : Ceci est-il valide ? Pourquoi ?
const test: [string, number] = [42, "oups"];
```

<details>
<summary>Solution</summary>

```ts
const paris: [number, number] = [48.8566, 2.3522];
const membre: [string, number, boolean] = ["Alice", 28, true];

// Non valide : l'ordre des types ne correspond pas
// Type 'number' is not assignable to type 'string'
```
</details>

---

## Enums vs Union Literals (comment représenter des choix)

Parfois, une variable ne peut prendre que **certaines valeurs précises**. Par exemple, un statut qui est soit "actif", soit "inactif", soit "en attente".

### La méthode enum (❌ à éviter en Vue 3)

```ts
// Un enum crée un ensemble de valeurs nommées
enum Statut {
  Actif,      // = 0 (par défaut, les enums sont des nombres)
  Inactif,    // = 1
  EnAttente,  // = 2
}

const monStatut: Statut = Statut.Actif;
```

> **Pourquoi éviter les enums en Vue 3 ?**
> - Ils génèrent du code JavaScript supplémentaire (mauvais pour la performance)
> - Ils compliquent le "tree-shaking" (la suppression du code inutilisé)
> - Les union literals (ci-dessous) font la même chose en plus simple

### La méthode union literal (✅ recommandée)

```ts
// On crée un type qui n'accepte QUE ces 3 valeurs exactes
type Statut = "actif" | "inactif" | "en_attente";
// Le | signifie "OU" : la variable peut être "actif" OU "inactif" OU "en_attente"

const monStatut: Statut = "actif";       // ✅ OK
// const erreur: Statut = "supprimé";    // ❌ ERREUR : "supprimé" n'est pas dans la liste !
```

> **Analogie** : C'est comme un menu déroulant dans un formulaire.
> Tu ne peux choisir QUE parmi les options proposées, pas taper n'importe quoi.

### 🎯 Pratique — Union Literals

Dans `01-playground.ts` :

```ts
// Exercice 1.11 : Crée un type pour les tailles de vêtements
type Taille = ???; // "XS", "S", "M", "L", "XL"

let maTaille: Taille = "M";    // ✅ doit marcher
maTaille = "XXL";               // ❌ doit échouer

// Exercice 1.12 : Crée un type pour les modes d'un lecteur vidéo
type ModeVideo = ???; // "play", "pause", "stop"

function changerMode(mode: ModeVideo) {
  console.log("Mode:", mode);
}
```

<details>
<summary>Solution</summary>

```ts
type Taille = "XS" | "S" | "M" | "L" | "XL";
type ModeVideo = "play" | "pause" | "stop";
```
</details>

---

## Le type `unknown` vs `any` (gérer les données inconnues)

Parfois, tu ne sais pas quel type de donnée tu vas recevoir (par exemple, une réponse d'API). TypeScript propose deux approches :

### `any` — Le mode "je m'en fiche" (❌ dangereux)

```ts
let donnee: any = "un texte";     // OK
donnee = 42;                       // OK
donnee = true;                     // OK
donnee.pipoMethode();             // Pas d'erreur TypeScript... mais CRASH en production ! 💥
// Avec "any", TypeScript ne vérifie PLUS RIEN. C'est comme enlever l'alarme incendie.
```

### `unknown` — Le mode "je ne sais pas encore" (✅ sûr)

```ts
let donnee: unknown = "un texte";  // OK : on ne sait pas encore ce que c'est

// donnee.toUpperCase();           // ❌ ERREUR : TypeScript refuse, on n'a pas vérifié le type !

// Il faut d'abord VÉRIFIER le type avec typeof :
if (typeof donnee === "string") {
  // Ici, TypeScript SAIT que "donnee" est un string
  console.log(donnee.toUpperCase()); // ✅ OK ! "UN TEXTE"
}

if (typeof donnee === "number") {
  // Ici, TypeScript SAIT que "donnee" est un number
  console.log(donnee.toFixed(2)); // ✅ OK !
}
```

> **Analogie** : `any` c'est un colis sans étiquette qu'on ouvre sans précaution.
> `unknown` c'est un colis sans étiquette qu'on **inspecte d'abord** avant de l'ouvrir.

> **🔒 Règle du parcours : zéro `any` sauf justification explicite.** Utilise `unknown` et vérifie le type.

### 🎯 Pratique — unknown vs any

Dans `01-playground.ts` :

```ts
// Exercice 1.13 : Corrige cette fonction pour qu'elle soit sûre
function afficherLongueur(valeur: any) {
  console.log(valeur.length); // 💥 Peut crasher !
}

// Réécris avec unknown + vérification typeof
function afficherLongueurSafe(valeur: ???) {
  // ???
}

// Exercice 1.14 : Cette donnée vient d'une API, traite-la proprement
const reponseAPI: unknown = JSON.parse('{"nom": "Alice"}');
// Comment accéder à reponseAPI.nom en toute sécurité ?
```

<details>
<summary>Solution</summary>

```ts
function afficherLongueurSafe(valeur: unknown) {
  if (typeof valeur === "string") {
    console.log(valeur.length);
  } else {
    console.log("Pas un string !");
  }
}

// Pour l'API : vérifier la structure
if (
  typeof reponseAPI === "object" &&
  reponseAPI !== null &&
  "nom" in reponseAPI
) {
  console.log((reponseAPI as { nom: string }).nom);
}
```
</details>

---

## Rappel JavaScript : accéder aux éléments du DOM

En JavaScript, on peut récupérer un élément HTML de la page avec `document.getElementById` :

```js
// Récupère l'élément HTML qui a l'attribut id="nom"
const champNom = document.getElementById("nom");
// champNom peut être l'élément HTML... ou null (si aucun élément n'a cet id)
```

Le problème : JavaScript ne sait pas quel **type** d'élément HTML c'est (un `<input>` ? un `<div>` ? un `<p>` ?).

---

## Les assertions de type (`as`)

Parfois, **toi** tu sais quelque chose que TypeScript ne peut pas deviner. Par exemple, tu sais que l'élément avec l'id "nom" est un `<input>` :

```ts
// Sans assertion : TypeScript pense que c'est un HTMLElement générique
const champNom = document.getElementById("nom");
// champNom.value = "Alice";  // ❌ ERREUR : HTMLElement n'a pas de propriété "value"

// Avec assertion "as" : on DIT à TypeScript "c'est un input, fais-moi confiance"
const champNom2 = document.getElementById("nom") as HTMLInputElement;
champNom2.value = "Alice";    // ✅ OK : HTMLInputElement a bien une propriété "value"
```

### ⚠️ Attention !

L'assertion `as` c'est comme dire à TypeScript : **"Tais-toi, je sais ce que je fais"**. Si tu te trompes, TypeScript ne te protège plus :

```ts
// Si l'élément est en réalité un <div> et pas un <input>...
const element = document.getElementById("monDiv") as HTMLInputElement;
element.value = "test"; // TypeScript ne dit rien... mais ça CRASH en production ! 💥
```

> **Règle** : Utilise `as` le moins possible. Préfère vérifier le type (on verra le "narrowing" dans le cours 04).

---

## Exercice pratique

Voici du code avec des problèmes. Essaie de comprendre ce qui ne va pas **avant** de lire la solution :

```ts
// ---- Problème 1 ----
let compteur = "0";              // Quel est le type de "compteur" ici ?
compteur = compteur + 1;         // Quel sera le résultat ? "01" ou 1 ?
// Indice : en JavaScript, "0" + 1 donne "01" (concaténation de texte !)
// car quand on additionne un string + un number, JS convertit le nombre en texte

// ---- Problème 2 ----
function saluer(nom) {           // Quelle erreur en mode strict ?
  return "Bonjour " + nom;
}
// Indice : en mode strict, TypeScript exige que chaque paramètre ait un type
```

### Solutions détaillées

**Problème 1 — le piège du string + number :**

```ts
// ❌ Version buguée
let compteur = "0";          // TypeScript infère : compteur est un string
compteur = compteur + 1;     // "0" + 1 = "01" (texte !), pas 1 (nombre)

// ✅ Version corrigée
let compteur2: number = 0;   // On déclare explicitement que c'est un number
compteur2 = compteur2 + 1;   // 0 + 1 = 1 ✅
```

> **Leçon** : TypeScript t'aurait protégé si tu avais typé `compteur` comme `number` dès le départ.
> Avec `: number`, l'assignation de `"0"` (un string) aurait été refusée.

**Problème 2 — le paramètre sans type :**

```ts
// ❌ Erreur en mode strict : "Parameter 'nom' implicitly has an 'any' type"
// function saluer(nom) { ... }

// ✅ Version corrigée : on ajoute le type du paramètre
function saluer(nom: string): string {
  // "nom: string"    → le paramètre "nom" doit être du texte
  // ": string" final → la fonction retourne du texte
  return "Bonjour " + nom;
}

saluer("Alice");    // ✅ OK → "Bonjour Alice"
// saluer(42);      // ❌ ERREUR : 42 n'est pas un string !
```

> **Leçon** : En mode `strict`, TypeScript refuse les paramètres sans type.
> C'est une **bonne chose** : ça t'oblige à réfléchir à ce que ta fonction attend.

---

## Résumé

| Concept | Ce que c'est | Exemple |
|---|---|---|
| Type primitif | La nature d'une donnée | `string`, `number`, `boolean` |
| Inférence | TypeScript devine le type tout seul | `const x = 42` → `number` |
| Tableau typé | Une liste où tous les éléments ont le même type | `string[]`, `number[]` |
| Tuple | Un tableau à taille et types fixés | `[string, number]` |
| Union literal | Un type qui n'accepte que certaines valeurs | `"a" \| "b" \| "c"` |
| `unknown` | Type inconnu mais sûr (oblige à vérifier) | `if (typeof x === "string")` |
| `any` | Type inconnu et dangereux (désactive les vérifications) | ❌ À éviter |
| Assertion `as` | Dire à TypeScript "c'est tel type" | `x as HTMLInputElement` |

---

## Suite

→ `cours/00-typescript/02-interfaces-et-types.md`
