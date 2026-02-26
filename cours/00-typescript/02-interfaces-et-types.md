# 02 — Interfaces et types

## Interface : le contrat d'un objet

```ts
interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

const alice: User = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
  isActive: true,
};
```

TS refuse tout objet qui ne respecte pas le contrat.

## Proprietes optionnelles

```ts
interface User {
  id: number;
  name: string;
  avatar?: string; // optionnel (string | undefined)
}
```

## Proprietes en lecture seule

```ts
interface Config {
  readonly apiUrl: string;
  readonly timeout: number;
}

const config: Config = { apiUrl: "/api", timeout: 5000 };
// config.apiUrl = '/v2' → ❌ Erreur
```

## Type alias

`type` peut faire tout ce que `interface` fait, plus :

```ts
// Union
type Status = "idle" | "loading" | "error" | "success";

// Intersection
type AdminUser = User & { role: "admin"; permissions: string[] };

// Fonction
type Formatter = (value: number) => string;
```

## Interface vs Type — quand utiliser quoi ?

| Cas                             | Conseil                      |
| ------------------------------- | ---------------------------- |
| Objet / contrat de donnees      | `interface`                  |
| Union / intersection / tuple    | `type`                       |
| Extension par d'autres fichiers | `interface` (merge possible) |
| Types utilitaires               | `type`                       |

**En pratique dans Vue 3 :** `interface` pour les entités métier, `type` pour le reste.

## Composition d'interfaces

```ts
interface BaseEntity {
  id: number;
  createdAt: string;
}

interface User extends BaseEntity {
  name: string;
  email: string;
}

// User a id, createdAt, name, email
```

## Index signatures

Quand tu ne connais pas toutes les cles :

```ts
interface Translation {
  [key: string]: string;
}

const fr: Translation = {
  hello: "Bonjour",
  goodbye: "Au revoir",
};
```

## Discriminated unions (pattern critique)

```ts
type ApiState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "success"; data: T };

function render(state: ApiState<User[]>) {
  switch (state.status) {
    case "idle":
      return "En attente...";
    case "loading":
      return "Chargement...";
    case "error":
      return `Erreur: ${state.error}`; // TS sait que error existe
    case "success":
      return `${state.data.length} users`; // TS sait que data existe
  }
}
```

Ce pattern est **partout** en Vue 3 pour gérer les états async.

## Utility types essentiels

```ts
interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
}

// Tout optionnel
type PartialUser = Partial<User>;

// Tout obligatoire
type RequiredUser = Required<User>;

// Sous-ensemble
type UserPreview = Pick<User, "id" | "name">;

// Exclure des cles
type UserWithoutEmail = Omit<User, "email">;

// Record : objet avec cles typees
type UserMap = Record<number, User>;
```

## Exercice rapide

Definis les types pour un système de tickets :

```ts
// 1. Interface Ticket avec id, title, description, status, assignee (optionnel)
// 2. Type TicketStatus = 'open' | 'in-progress' | 'closed'
// 3. Type TicketSummary = Pick de Ticket avec seulement id et title
// 4. Interface TicketFilters avec status optionnel et search optionnel
```

## Suite

→ `cours/00-typescript/03-generics.md`
