# 01 — Types de base et configuration strict

## Pourquoi TypeScript ?

En ESN, le code passe d'une équipe a l'autre. TypeScript :

- détecte les bugs **avant** l'exécution
- sert de **documentation vivante**
- accelere les **code reviews**

## Configuration minimale

Dans `tsconfig.json`, l'option critique :

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

`strict: true` active : `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, etc.
**Règle du parcours : on ne désactive jamais strict.**

## Les types primitifs

```ts
const name: string = "Alice";
const age: number = 30;
const isActive: boolean = true;
const nothing: null = null;
const missing: undefined = undefined;
```

## Inference de type

TypeScript devine le type quand c'est évident. Pas besoin d'annoter :

```ts
const name = "Alice"; // TS infere string
const age = 30; // TS infere number
```

**Règle : annote quand le type n'est pas évident. Laisse inférer quand c'est trivial.**

## Tableaux

```ts
const names: string[] = ["Alice", "Bob"];
const ages: number[] = [30, 25];
const mixed: (string | number)[] = ["Alice", 30]; // union
```

## Tuple

Un tableau a taille et types fixes :

```ts
const pair: [string, number] = ["Alice", 30];
// pair[0] est string, pair[1] est number
```

## Enums vs union literals

```ts
// ❌ Evite les enums en Vue 3 (tree-shaking, lisibilite)
enum Status {
  Active,
  Inactive,
}

// ✅ Prefere les union literals
type Status = "active" | "inactive" | "pending";

const status: Status = "active";
```

## Le type `unknown` vs `any`

```ts
// ❌ any : desactive tout check
let data: any = fetchSomething();
data.whatever(); // pas d'erreur → bug en prod

// ✅ unknown : oblige a verifier avant d'utiliser
let data: unknown = fetchSomething();
if (typeof data === "string") {
  console.log(data.toUpperCase()); // OK, TS sait que c'est string
}
```

**Règle du parcours : zero `any` sauf justification explicite.**

## Assertions de type

Quand tu sais mieux que TS (rare) :

```ts
const input = document.getElementById("name") as HTMLInputElement;
input.value = "Alice";
```

⚠️ A utiliser avec parcimonie. Préfère le narrowing (voir cours 04).

## Exercice rapide

Corrige ce code :

```ts
let count = "0";
count = count + 1; // Quel est le resultat ? Pourquoi ?

function greet(name) {
  // Quelle erreur en strict ?
  return "Hello " + name;
}
```

## Suite

→ `cours/00-typescript/02-interfaces-et-types.md`
