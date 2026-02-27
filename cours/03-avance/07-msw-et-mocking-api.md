# 07 — MSW (Mock Service Worker) — Simuler une API

---

> **🔄 Rappel du cours précédent**
> Avant de continuer, vérifie que tu peux répondre à ces questions :
> 1. Quelle méthode Playwright utilise-t-on pour naviguer vers une URL ?
> 2. Comment sélectionne-t-on un élément par son texte dans Playwright ?
> 
> <details>
> <summary>Vérifier mes réponses</summary>
>
> 1. `await page.goto('/ma-page')`
> 2. `page.getByText('Mon texte')` ou `page.locator('text=Mon texte')`
> </details>

---

## C'est quoi le « mocking » d'API ? 🎬

### Analogie : le décor de cinéma

Imagine que tu tournes un film qui se passe à New York. Tu as deux options :

1. **Aller à New York** → cher, compliqué, dépendant de la météo, des embouteillages...
2. **Construire un décor de cinéma** qui *ressemble* à New York → rapide, contrôlable, prévisible !

Le **mocking d'API**, c'est la même idée. Au lieu de parler à un **vrai serveur** (qui peut être lent, en panne, ou pas encore construit), on crée un **faux serveur** qui répond exactement ce qu'on veut.

### Rappel — C'est quoi une API ?

Une **API** (Application Programming Interface), c'est la manière dont ton application web **communique avec un serveur** pour récupérer ou envoyer des données.

```
Ton application Vue        Internet          Serveur
    (frontend)         ──────────────►      (backend)
                        "Donne-moi la
                        liste des users"
                       ◄──────────────
                        [{Alice}, {Bob}]
```

En JavaScript, on utilise `fetch()` pour faire ces appels :

```ts
// On demande au serveur la liste des utilisateurs
const response = await fetch("/api/users");
// ↑ await = on ATTEND la réponse (ça prend du temps, le serveur est loin)

// On transforme la réponse en données JavaScript
const users = await response.json();
// ↑ users = [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }]
```

---

## Pourquoi « mocker » (simuler) une API ? 🤔

Quand tu fais des tests, tu ne veux PAS dépendre d'un vrai serveur. Pourquoi ?

| Problème avec un vrai serveur            | Exemple                                    |
| ---------------------------------------- | ------------------------------------------ |
| 🐌 **Lent** : chaque requête prend du temps | Les tests prennent 10 minutes au lieu de 10 secondes |
| 💥 **Instable** : le serveur peut être en panne | Les tests échouent alors que ton code est bon ! |
| 🔄 **Données qui changent** : un autre dev a modifié les data | Ton test attendait "Alice" mais maintenant c'est "Charlie" |
| 🚧 **Pas encore prêt** : le backend n'existe pas encore | Tu ne peux pas travailler sur le front ! |

**La solution** : on remplace le vrai serveur par un **faux** qui renvoie toujours les mêmes données. C'est le **mocking** !

### Les différentes façons de mocker

| Approche           | Comment ça marche                                | Problème                                |
| ------------------ | ------------------------------------------------ | --------------------------------------- |
| Vrai serveur       | On utilise le vrai backend                       | Lent, instable, imprévisible            |
| `vi.mock('fetch')` | On remplace la fonction `fetch` dans le code     | Très technique, fragile                 |
| JSON statique      | On met les données en dur dans le test           | Pas réaliste (pas de status HTTP, etc.) |
| **MSW** ✅         | On intercepte les requêtes RÉSEAU                | Transparent, l'app ne sait même pas !   |

---

## C'est quoi MSW ? 🛡️

**MSW** = **Mock Service Worker**

MSW est un outil qui **intercepte les requêtes réseau** de ton application et renvoie de **fausses réponses** à la place. Le truc génial : **ton application ne sait même pas qu'elle parle à un faux serveur** !

```
Sans MSW :
  App → fetch('/api/users') → Internet → Vrai serveur → Réponse

Avec MSW :
  App → fetch('/api/users') → [MSW intercepte ici !] → Fausse réponse
                                ↑
                                L'app ne voit AUCUNE différence !
```

### C'est quoi un Service Worker ? 🔧

Un **Service Worker**, c'est un **intermédiaire** (un « middleman ») qui se place **entre ton application et Internet**.

Imagine un concierge d'hôtel :
- Tu demandes : « Je voudrais un taxi »
- Le concierge peut appeler un vrai taxi... ou te dire « Il est déjà devant la porte ! » (sans avoir appelé personne)

Le Service Worker fait pareil avec les requêtes réseau :
- Ton app fait `fetch('/api/users')`
- Le Service Worker **intercepte** la requête
- Il peut la laisser passer vers Internet... ou **répondre lui-même** avec de fausses données !

> **Note** : En mode test (Node.js), MSW n'utilise pas un vrai Service Worker mais un « intercepteur » qui fait la même chose. L'idée est la même : intercepter les requêtes réseau.

---

## Installation de MSW

```bash
# Installer MSW comme dépendance de développement
pnpm add -D msw
```

---

## Étape 1 — Créer les « handlers » (les réponses fictives) 📝

Un **handler** (gestionnaire), c'est une règle qui dit :
> « Quand l'app fait une requête vers CETTE URL, renvoie CETTE réponse. »

C'est comme écrire le script d'un acteur : « Quand on te demande X, réponds Y. »

```ts
// mocks/handlers.ts
// Ce fichier contient toutes les fausses réponses de notre API

// On importe les outils de MSW
import { http, HttpResponse } from "msw";
// http : permet de définir des handlers pour GET, POST, DELETE, etc.
// HttpResponse : permet de créer une réponse HTTP (comme le ferait un vrai serveur)

// On définit le type TypeScript d'un Utilisateur
interface User {
  id: number;       // identifiant unique
  name: string;     // nom de l'utilisateur
  email: string;    // adresse email
}

// Nos données fictives (comme une petite base de données en mémoire)
const users: User[] = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
];

// La liste des handlers : chaque entrée = une route de l'API simulée
export const handlers = [

  // ── GET /api/users ──
  // Quand l'app demande la liste des utilisateurs → on renvoie notre tableau
  http.get("/api/users", () => {
    // HttpResponse.json() crée une réponse JSON (comme le ferait un vrai serveur)
    return HttpResponse.json(users);
    // L'app reçoit : [{ id: 1, name: "Alice", ... }, { id: 2, name: "Bob", ... }]
  }),

  // ── GET /api/users/:id ──
  // Quand l'app demande UN utilisateur par son ID
  // :id est un paramètre dynamique (ex: /api/users/1, /api/users/2)
  http.get("/api/users/:id", ({ params }) => {
    // params.id contient la valeur du :id dans l'URL
    const id = Number(params.id);  // Convertir le texte "1" en nombre 1

    // Chercher l'utilisateur dans notre tableau
    const user = users.find((u) => u.id === id);
    // .find() parcourt le tableau et retourne le premier élément qui correspond

    // Si l'utilisateur n'existe pas → erreur 404 (Not Found)
    if (!user) {
      return HttpResponse.json(
        { message: "Utilisateur introuvable" },
        { status: 404 },  // 404 = "pas trouvé" (comme une page 404 sur le web)
      );
    }

    // Si trouvé → on renvoie l'utilisateur
    return HttpResponse.json(user);
  }),

  // ── POST /api/users ──
  // Quand l'app envoie un NOUVEL utilisateur à créer
  http.post("/api/users", async ({ request }) => {
    // On lit le corps de la requête (les données envoyées par l'app)
    const body = (await request.json()) as Omit<User, "id">;
    // Omit<User, "id"> signifie : un User SANS le champ id
    // (car c'est le serveur qui génère l'id, pas l'utilisateur)

    // On crée le nouvel utilisateur avec un id unique
    const newUser: User = { id: Date.now(), ...body };
    // Date.now() donne le nombre de millisecondes depuis 1970 → id unique
    // ...body "déverse" les propriétés de body dans l'objet (name, email)

    // On l'ajoute à notre tableau
    users.push(newUser);

    // On renvoie le nouvel utilisateur avec le status 201 (Created = "créé")
    return HttpResponse.json(newUser, { status: 201 });
  }),

  // ── DELETE /api/users/:id ──
  // Quand l'app veut SUPPRIMER un utilisateur
  http.delete("/api/users/:id", ({ params }) => {
    const id = Number(params.id);

    // Trouver l'INDEX (la position) de l'utilisateur dans le tableau
    const index = users.findIndex((u) => u.id === id);
    // findIndex retourne -1 si non trouvé

    if (index === -1) {
      return HttpResponse.json(
        { message: "Not found" },
        { status: 404 },
      );
    }

    // Supprimer l'élément à cette position
    users.splice(index, 1);
    // splice(position, nombre) supprime 'nombre' éléments à partir de 'position'

    // 204 = "No Content" (succès, mais rien à renvoyer)
    return new HttpResponse(null, { status: 204 });
  }),
];
```

### Rappel — Les codes HTTP

Les **codes de status HTTP** sont des nombres que le serveur renvoie pour dire si tout s'est bien passé :

| Code  | Signification           | Exemple                        |
| ----- | ----------------------- | ------------------------------ |
| `200` | ✅ OK (succès)          | La liste des users est renvoyée |
| `201` | ✅ Created (créé)       | Un nouvel utilisateur a été créé |
| `204` | ✅ No Content (rien)    | Suppression réussie, rien à dire |
| `404` | ❌ Not Found (introuvable) | L'utilisateur n'existe pas    |
| `500` | ❌ Server Error         | Le serveur a planté !           |

---

## Étape 2 — Créer le serveur MSW pour les tests

```ts
// mocks/server.ts
// Ce fichier crée un "faux serveur" qui utilise nos handlers

import { setupServer } from "msw/node";
// setupServer vient de "msw/node" car nos tests tournent dans Node.js
// (pas dans un vrai navigateur)

import { handlers } from "./handlers";
// On importe nos handlers (les fausses réponses définies plus haut)

// On crée le serveur avec tous les handlers
export const server = setupServer(...handlers);
// ...handlers "déverse" le tableau : comme si on passait chaque handler un par un
// C'est comme dire : "Voici toutes les routes que tu dois simuler"
```

---

## Étape 3 — Brancher MSW sur Vitest

On doit dire à Vitest : « Avant de lancer les tests, démarre le faux serveur MSW. »

```ts
// vitest.setup.ts
// Ce fichier est exécuté AVANT tous les tests

import { beforeAll, afterEach, afterAll } from "vitest";
// beforeAll  : s'exécute UNE fois avant TOUS les tests
// afterEach  : s'exécute après CHAQUE test
// afterAll   : s'exécute UNE fois après TOUS les tests

import { server } from "./mocks/server";

// ▶️ AVANT tous les tests : démarrer le faux serveur
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
// onUnhandledRequest: "error" → si l'app fait un fetch vers une URL
// qu'on n'a PAS mockée, le test échoue. Ça évite les oublis !

// 🔄 APRÈS CHAQUE test : remettre les handlers par défaut
afterEach(() => server.resetHandlers());
// Pourquoi ? Si un test modifie un handler (pour simuler une erreur par ex.),
// on ne veut pas que ça affecte les tests suivants !

// ⏹️ APRÈS TOUS les tests : éteindre le faux serveur
afterAll(() => server.close());
```

Ensuite, on indique ce fichier dans la configuration de Vitest :

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    // Vitest va exécuter ce fichier avant de lancer les tests
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

---

## Utiliser MSW dans les tests unitaires

Maintenant que tout est en place, voyons MSW en action !

```ts
// composables/__tests__/useUsers.spec.ts
import { describe, it, expect } from "vitest";
import { flushPromises } from "@vue/test-utils";
// flushPromises() = attend que TOUTES les opérations asynchrones soient terminées
// (comme les fetch, les setTimeout, etc.)

import { useUsers } from "../useUsers";

describe("useUsers", () => {
  it("charge la liste des utilisateurs", async () => {
    // On appelle notre composable qui fait un fetch vers /api/users
    const { users, isLoading, fetchUsers } = useUsers();

    // Au début, pas de chargement
    expect(isLoading.value).toBe(false);

    // On lance le fetch
    fetchUsers();

    // Pendant le fetch, isLoading est true
    expect(isLoading.value).toBe(true);

    // On attend que le fetch soit terminé
    await flushPromises();

    // Le fetch est fini → isLoading redevient false
    expect(isLoading.value).toBe(false);

    // Et on a bien reçu nos 2 utilisateurs (Alice et Bob) !
    expect(users.value).toHaveLength(2);
    expect(users.value[0].name).toBe("Alice");

    // ✨ La magie : l'app a fait un vrai fetch('/api/users')
    // MSW l'a intercepté et a renvoyé nos fausses données
    // L'app n'a vu AUCUNE différence avec un vrai serveur !
  });
});
```

---

## Simuler des erreurs (override par test)

Le vrai pouvoir de MSW : tu peux **changer les réponses pour un seul test** afin de tester les cas d'erreur.

### Rappel — Pourquoi tester les erreurs ?

En vrai, les serveurs plantent parfois. Ton app doit gérer ces cas ! Avec MSW, c'est facile de simuler une panne :

```ts
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";

it("gère une erreur serveur", async () => {
  // On remplace le handler normal par un handler qui renvoie une erreur 500
  // JUSTE pour ce test !
  server.use(
    http.get("/api/users", () => {
      return HttpResponse.json(
        { message: "Internal Server Error" },
        { status: 500 },  // 500 = le serveur a planté
      );
    }),
  );

  const { error, fetchUsers } = useUsers();
  await fetchUsers();

  // On vérifie que l'app affiche bien un message d'erreur
  expect(error.value).toBe("Erreur serveur");

  // 🔄 Après ce test, server.resetHandlers() (dans afterEach)
  // remet le handler normal. Les tests suivants ne sont PAS affectés !
});

it("gère une erreur réseau (pas d'internet)", async () => {
  server.use(
    http.get("/api/users", () => {
      // HttpResponse.error() simule une coupure réseau
      // (comme si l'utilisateur n'a plus internet)
      return HttpResponse.error();
    }),
  );

  const { error, fetchUsers } = useUsers();
  await fetchUsers();

  expect(error.value).toContain("réseau");
});
```

---

## MSW dans les tests de composants

MSW fonctionne aussi quand on teste des composants Vue entiers :

```ts
import { mount, flushPromises } from "@vue/test-utils";
import UserList from "../UserList.vue";

it("affiche la liste des utilisateurs", async () => {
  // On monte le composant (on le « rend » comme dans un navigateur)
  const wrapper = mount(UserList);

  // Le composant fait un fetch('/api/users') automatiquement
  // MSW intercepte et renvoie [Alice, Bob]
  await flushPromises(); // On attend la fin du fetch

  // On vérifie que les noms apparaissent dans le composant
  expect(wrapper.text()).toContain("Alice");
  expect(wrapper.text()).toContain("Bob");
});

it("affiche un message d'erreur si l'API échoue", async () => {
  // Pour CE test, on simule une erreur serveur
  server.use(
    http.get("/api/users", () => {
      return HttpResponse.json(
        { message: "Erreur" },
        { status: 500 },
      );
    }),
  );

  const wrapper = mount(UserList);
  await flushPromises();

  // Le composant doit afficher un message d'erreur
  expect(wrapper.text()).toContain("Erreur");
});
```

---

## MSW dans le navigateur — développer sans backend 🛠️

MSW n'est pas que pour les tests ! Tu peux l'utiliser **pendant le développement** pour travailler sans avoir besoin d'un vrai serveur backend.

C'est très utile quand :
- L'équipe backend n'a pas encore fini l'API
- Tu veux développer le front de manière indépendante
- Tu veux montrer une démo avec des données prévisibles

### Étape 1 — Initialiser le Service Worker

```bash
# Cette commande crée un fichier mockServiceWorker.js dans le dossier public/
# C'est le "concierge" qui interceptera les requêtes dans le navigateur
npx msw init public/ --save
```

### Étape 2 — Créer le worker pour le navigateur

```ts
// mocks/browser.ts
// Ce fichier est pour le NAVIGATEUR (contrairement à server.ts qui est pour Node/tests)

import { setupWorker } from "msw/browser";
// setupWorker (navigateur) au lieu de setupServer (Node)

import { handlers } from "./handlers";
// On réutilise les MÊMES handlers ! Pas de duplication.

export const worker = setupWorker(...handlers);
```

### Étape 3 — Activer MSW au démarrage de l'app

```ts
// main.ts
async function start(): Promise<void> {
  // On active MSW SEULEMENT en mode développement ET si VITE_MSW=true
  if (import.meta.env.DEV && import.meta.env.VITE_MSW === "true") {
    // On charge le worker (import dynamique = chargé seulement si nécessaire)
    const { worker } = await import("./mocks/browser");
    // On démarre le worker
    await worker.start({ onUnhandledRequest: "bypass" });
    // "bypass" = si une requête n'est PAS dans nos handlers,
    // on la laisse passer normalement (images, CSS, etc.)
  }

  // Démarrage normal de Vue
  const app = createApp(App);
  app.mount("#app");
}

start();
```

### Lancer l'app avec le faux serveur

```bash
# On définit la variable d'environnement VITE_MSW=true
# et on lance le serveur de développement normalement
VITE_MSW=true pnpm dev
```

L'application fonctionne **exactement** comme si un vrai serveur répondait. Tu peux naviguer, cliquer, remplir des formulaires... tout marche grâce aux handlers MSW !

---

## MSW + Playwright (tests E2E)

Pour les tests E2E (vu dans le chapitre précédent), tu peux aussi mocker l'API. Deux approches :

### Approche 1 — MSW via le Service Worker

```ts
// e2e/fixtures/msw.ts
import { test as base } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, use) => {
    // Aller sur l'app (qui a MSW activé)
    await page.goto("/");
    // Attendre que le Service Worker MSW soit prêt
    await page.waitForFunction(() => {
      return (window as any).__MSW_READY__ === true;
    });
    await use(page);
  },
});
```

### Approche 2 — Utiliser `page.route()` de Playwright (plus simple)

Playwright a sa propre façon d'intercepter les requêtes. C'est plus simple pour des cas simples :

```ts
test("affiche les produits (API mockée)", async ({ page }) => {
  // On dit à Playwright : "Quand l'app appelle /api/products,
  // renvoie ces fausses données"
  await page.route("/api/products", (route) =>
    route.fulfill({
      status: 200,                     // Tout va bien
      contentType: "application/json", // C'est du JSON
      body: JSON.stringify([           // Les données sous forme de texte JSON
        { id: 1, name: "Produit A", price: 29.99 },
        { id: 2, name: "Produit B", price: 49.99 },
      ]),
    }),
  );

  // On va sur la page produits
  await page.goto("/products");

  // On vérifie que les produits fictifs s'affichent
  await expect(page.getByText("Produit A")).toBeVisible();
  await expect(page.getByText("29,99")).toBeVisible();
});

test("affiche une erreur si l'API échoue", async ({ page }) => {
  // Simuler une panne serveur
  await page.route("/api/products", (route) =>
    route.fulfill({ status: 500, body: "Server Error" }),
  );

  await page.goto("/products");

  // L'app doit gérer l'erreur et afficher un message
  await expect(page.getByText("Erreur")).toBeVisible();
});
```

---

## MSW + TanStack Query (Vue Query)

Si tu utilises **TanStack Query** (une librairie populaire pour gérer les données API dans Vue), MSW fonctionne parfaitement avec :

```ts
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query";
import { mount, flushPromises } from "@vue/test-utils";

// Fonction utilitaire : monter un composant avec Vue Query configuré
function mountWithQuery(component: Component) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false }, // Pas de ré-essai en test (sinon c'est lent)
    },
  });

  return mount(component, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
    },
  });
}

it("charge les données via TanStack Query + MSW", async () => {
  // Monter le composant avec Vue Query
  const wrapper = mountWithQuery(ProductList);

  // TanStack Query fait un fetch → MSW intercepte → données renvoyées
  await flushPromises();
  await flushPromises(); // Double flush nécessaire pour Vue Query

  expect(wrapper.text()).toContain("Alice");
});
```

---

## Quand utiliser MSW vs autre chose ?

| Situation                                          | Outil recommandé                 |
| -------------------------------------------------- | -------------------------------- |
| Tester un composable qui fait un `fetch`           | **MSW** ✅                        |
| Tester un composant qui affiche des données d'API  | **MSW** ✅                        |
| Développer le front sans backend                   | **MSW dans le navigateur** ✅     |
| Mocker une fonction interne (pas un fetch)         | `vi.fn()` ou `vi.mock()` (Vitest) |
| Intercepter les requêtes dans un test E2E          | `page.route()` de Playwright ou MSW |

---

## Bonnes pratiques — checklist ✅

| Règle                                       | Pourquoi                                  |
| ------------------------------------------- | ----------------------------------------- |
| Un fichier `handlers.ts` central            | Toutes les fausses réponses au même endroit |
| Utiliser `server.use()` pour les cas spéciaux | Simuler une erreur sans casser les autres tests |
| `server.resetHandlers()` dans `afterEach`   | Chaque test repart à zéro (isolation)     |
| `onUnhandledRequest: 'error'`               | Si l'app fait un fetch non prévu → le test échoue → tu le vois tout de suite |
| Typer les request/response en TypeScript    | Cohérence entre les types du mock et ceux de l'app |
| Mêmes handlers pour le dev ET les tests     | Un seul endroit à maintenir               |

---

## Cas d'usage en entreprise

| Situation                      | Comment MSW aide                                |
| ------------------------------ | ----------------------------------------------- |
| Backend pas encore prêt        | Tu développes le front sans attendre l'API      |
| Tests instables (API en panne) | Les mocks sont toujours fiables et prévisibles  |
| CI sans serveur backend        | Aucune dépendance externe dans le pipeline      |
| Nouveau développeur dans l'équipe | `pnpm dev` fonctionne immédiatement sans rien configurer |
| Démonstrations au client       | Données contrôlables et reproductibles          |

---

## Résumé

| Concept              | Ce qu'il faut retenir                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| **Mocking d'API**    | Simuler un serveur pour ne pas dépendre d'un vrai backend               |
| **MSW**              | Un outil qui intercepte les requêtes réseau de façon transparente       |
| **Service Worker**   | Un intermédiaire entre ton app et internet (comme un concierge)         |
| **Handler**          | Une règle : « quand l'app demande X, réponds Y »                        |
| **server.use()**     | Changer une réponse pour un seul test (ex: simuler une erreur)          |
| **resetHandlers()**  | Remettre les réponses par défaut après chaque test                      |
| **Mode navigateur**  | MSW peut aussi servir pendant le développement, pas juste les tests     |

---

## 🎯 Pratique

### Exercice MSW.1 — Créer un handler GET

Crée un handler MSW pour intercepter `GET /api/users` :

```ts
// mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Intercepte GET /api/users et retourne une liste d'utilisateurs
  // ???
]
```

<details>
<summary>Solution</summary>

```ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ])
  })
]
```
</details>

---

### Exercice MSW.2 — Handler avec paramètre

Crée un handler pour `GET /api/users/:id` :

```ts
// Intercepte GET /api/users/42 et retourne l'utilisateur avec cet id
http.get('/api/users/:id', ({ params }) => {
  // ???
})
```

<details>
<summary>Solution</summary>

```ts
http.get('/api/users/:id', ({ params }) => {
  const { id } = params
  return HttpResponse.json({
    id: Number(id),
    name: `User ${id}`
  })
})
```
</details>

---

### Exercice MSW.3 — Simuler une erreur

Dans un test, utilise `server.use()` pour simuler une erreur 500 :

```ts
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

it('affiche une erreur quand l\'API échoue', async () => {
  // Configure le mock pour retourner une erreur 500
  // ???

  // ... reste du test
})
```

<details>
<summary>Solution</summary>

```ts
it('affiche une erreur quand l\'API échoue', async () => {
  server.use(
    http.get('/api/users', () => {
      return HttpResponse.json(
        { message: 'Erreur serveur' },
        { status: 500 }
      )
    })
  )

  // ... reste du test
})
```
</details>

---

### Exercice MSW.4 — Handler POST

Crée un handler pour `POST /api/users` qui crée un nouvel utilisateur :

```ts
http.post('/api/users', async ({ request }) => {
  // Récupère le body de la requête
  // ???

  // Retourne le nouvel utilisateur avec un id généré
  // ???
})
```

<details>
<summary>Solution</summary>

```ts
http.post('/api/users', async ({ request }) => {
  const body = await request.json() as { name: string }

  return HttpResponse.json(
    { id: Date.now(), name: body.name },
    { status: 201 }
  )
})
```
</details>

---

### Exercice MSW.5 — Setup dans les tests

Complète le setup MSW pour Vitest :

```ts
// mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = ???
```

```ts
// vitest.setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './mocks/server'

// Démarre le serveur avant tous les tests
// ???

// Reset les handlers après chaque test
// ???

// Arrête le serveur après tous les tests
// ???
```

<details>
<summary>Solution</summary>

```ts
// mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

```ts
// vitest.setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => server.resetHandlers())

afterAll(() => server.close())
```
</details>

---

## Suite

→ `cours/04-expert/01-performance.md`
