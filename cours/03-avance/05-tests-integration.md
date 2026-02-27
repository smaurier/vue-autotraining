# 05 — Tests d'intégration

---

> **🔄 Rappel du cours précédent**
> Avant de continuer, vérifie que tu peux répondre à ces questions :
> 1. Quelle est la différence entre `mount` et `shallowMount` ?
> 2. Comment vérifie-t-on qu'un composant a émis un événement ?
> 
> <details>
> <summary>Vérifier mes réponses</summary>
>
> 1. `mount` rend tous les composants enfants, `shallowMount` remplace les enfants par des stubs
> 2. Avec `wrapper.emitted('eventName')` qui retourne un tableau des émissions
> </details>

---

## C'est quoi un test d'intégration ?

Dans les chapitres précédents, on a appris à tester :
- des **fonctions** isolées (tests unitaires — chapitre 03)
- des **composants** isolés (tests de composants — chapitre 04)

Un **test d'intégration** vérifie que **plusieurs parties fonctionnent bien ensemble**.

> **Analogie avec une voiture** :
> - **Test unitaire** = tester le moteur seul sur un banc d'essai
> - **Test de composant** = tester le tableau de bord seul
> - **Test d'intégration** = monter le moteur dans la voiture, tourner la clé, et vérifier que la voiture démarre, que le compteur s'allume et que les roues tournent
>
> Le moteur peut fonctionner seul. Le tableau de bord aussi. Mais est-ce que tout fonctionne **quand on branche tout ensemble** ? C'est ce que vérifie le test d'intégration.

### Exemples concrets de tests d'intégration :

- Un **composant** qui utilise un **store Pinia** → est-ce que les données s'affichent ?
- Un **formulaire** qui fait un **appel API** → est-ce que le serveur reçoit les bonnes données ?
- Un **flux complet** : l'utilisateur se connecte → est redirigé vers le tableau de bord

---

## 📦 Rappel : les appels API "mockés" (simulés)

Quand on teste, on ne veut **jamais** appeler un vrai serveur. Pourquoi ?
- Le serveur peut être **en panne** → les tests échouent pour rien
- Le serveur peut être **lent** → les tests prennent des minutes
- Les données **changent** → les tests ne sont pas fiables

La solution : on remplace les vrais appels API par des **faux** (des "mocks"). On contrôle exactement ce que le "serveur" retourne.

```ts
import { vi } from "vitest"

// On remplace la fonction fetch du navigateur par une fausse version
// qui retourne exactement ce qu'on veut
global.fetch = vi.fn()  // global.fetch = le fetch de tout le programme

// Pour un test spécifique, on dit "quand fetch est appelé, retourne ça" :
;(global.fetch as any).mockResolvedValueOnce({
  ok: true,                    // Simule une réponse HTTP 200 (succès)
  json: () => Promise.resolve( // Simule la méthode .json() qui parse la réponse
    { token: "abc123", user: { id: 1, name: "Alice" } }
  ),
})
// mockResolvedValueOnce = retourne cette valeur une seule fois, puis redevient vide
```

> **Analogie** : c'est comme un acteur qui joue le rôle du serveur dans une pièce de théâtre. Il dit exactement ses répliques prévues, même si le "vrai" serveur est absent.

---

## Exemple complet 1 : Tester un flux de connexion (login)

C'est un test d'intégration classique : on va tester le flux complet de connexion d'un utilisateur — formulaire → appel API → redirection.

### Le setup (la préparation)

```ts
// __tests__/integration/login-flow.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mount, flushPromises } from "@vue/test-utils"
// flushPromises = attend que toutes les opérations async (Promises) soient terminées
import { createPinia, setActivePinia } from "pinia"
import { createRouter, createMemoryHistory } from "vue-router"
// createMemoryHistory = un faux historique de navigation (pas besoin de vrai navigateur)
import LoginPage from "@/views/LoginPage.vue"
import DashboardPage from "@/views/DashboardPage.vue"

// On remplace fetch par une fausse version
global.fetch = vi.fn()

// Fonction utilitaire : crée un router de test avec les routes dont on a besoin
function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),   // Navigation en mémoire (pas d'URL réelle)
    routes: [
      { path: "/login", name: "login", component: LoginPage },
      { path: "/dashboard", name: "dashboard", component: DashboardPage },
    ],
  })
}
```

### Test : connexion réussie → redirection

```ts
describe("Flux de connexion", () => {

  // Avant chaque test : on repart à zéro
  beforeEach(() => {
    setActivePinia(createPinia())  // Store Pinia neuf
    vi.clearAllMocks()             // Efface tous les faux appels précédents
  })

  it("redirige vers le tableau de bord après une connexion réussie", async () => {
    // 1. On prépare le router et on va sur la page login
    const router = createTestRouter()
    router.push("/login")          // Simule : l'utilisateur va sur /login
    await router.isReady()         // Attend que le router soit prêt

    // 2. On configure le faux serveur : "quand on m'appelle, je réponds succès"
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,                    // Réponse HTTP 200 (succès)
      json: () => Promise.resolve({
        token: "fake-token",       // Un faux token de connexion
        user: { id: 1, name: "Alice", role: "user" },
      }),
    })

    // 3. On monte la page de login
    const wrapper = mount(LoginPage, {
      global: {
        plugins: [router, createPinia()],  // On branche le router et Pinia
      },
    })

    // 4. On remplit le formulaire (comme un vrai utilisateur)
    await wrapper.find('input[name="email"]').setValue("alice@test.com")
    await wrapper.find('input[name="password"]').setValue("secret")

    // 5. On soumet le formulaire
    await wrapper.find("form").trigger("submit")

    // 6. On attend que toutes les Promises (appel API, redirection) soient terminées
    await flushPromises()

    // 7. On vérifie : l'utilisateur est bien redirigé vers le dashboard !
    expect(router.currentRoute.value.name).toBe("dashboard")  // ✅
  })
```

### Test : connexion échouée → message d'erreur

```ts
  it("affiche une erreur si les identifiants sont mauvais", async () => {
    // Préparation du router
    const router = createTestRouter()
    router.push("/login")
    await router.isReady()

    // Le faux serveur répond "échec" (code 401 = non autorisé)
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,       // false = la requête a échoué
      status: 401,     // 401 = identifiants invalides
    })

    const wrapper = mount(LoginPage, {
      global: {
        plugins: [router, createPinia()],
      },
    })

    // L'utilisateur remplit et soumet
    await wrapper.find('input[name="email"]').setValue("alice@test.com")
    await wrapper.find('input[name="password"]').setValue("mauvais-mdp")
    await wrapper.find("form").trigger("submit")

    await flushPromises()

    // Vérifications :
    expect(wrapper.text()).toContain("Identifiants invalides")  // ✅ Message d'erreur affiché
    expect(router.currentRoute.value.name).toBe("login")       // ✅ Pas de redirection, on reste sur login
  })
})
```

---

## Exemple complet 2 : Tester un CRUD (Créer, Lire, Supprimer)

Un **CRUD** (Create, Read, Update, Delete) est le modèle classique pour gérer des données. Testons l'affichage et la suppression de produits :

```ts
describe("Page des produits", () => {

  it("charge les produits depuis l'API, les affiche, puis en supprime un", async () => {

    // 1. Le faux serveur répond avec une liste de produits (simule GET /products)
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { id: 1, name: "Clavier", price: 89 },    // Produit 1
        { id: 2, name: "Souris", price: 49 },      // Produit 2
      ]),
    })

    // 2. On monte la page produits
    const wrapper = mount(ProductPage, {
      global: { plugins: [createPinia()] },
    })

    // 3. On attend que les données soient chargées
    await flushPromises()

    // 4. On vérifie que les 2 produits sont affichés
    expect(wrapper.findAll(".product-card")).toHaveLength(2)   // ✅ 2 cartes produit
    expect(wrapper.text()).toContain("Clavier")                // ✅ "Clavier" est visible

    // 5. Maintenant on va supprimer un produit
    // Le faux serveur répond "OK" à la suppression (simule DELETE /products/1)
    ;(global.fetch as any).mockResolvedValueOnce({ ok: true })

    // 6. On clique sur le bouton supprimer du premier produit
    await wrapper.findAll(".delete-btn")[0].trigger("click")
    await flushPromises()

    // 7. On vérifie qu'il ne reste plus qu'un seul produit
    expect(wrapper.findAll(".product-card")).toHaveLength(1)    // ✅ Plus qu'1 carte
    expect(wrapper.text()).not.toContain("Clavier")            // ✅ "Clavier" a disparu
  })
})
```

---

## Astuce : la "wrapper factory" (usine à wrappers)

Quand on écrit beaucoup de tests d'intégration, on répète souvent le même setup. On peut créer une **fonction utilitaire** pour simplifier :

```ts
// Fonction utilitaire : crée un wrapper avec tout le nécessaire déjà configuré
function createWrapper(options = {}) {
  const pinia = createPinia()         // Nouveau store
  const router = createTestRouter()    // Nouveau router

  return {
    // Le composant monté avec tout branché
    wrapper: mount(App, {
      global: {
        plugins: [pinia, router],      // Store + Router branchés
        ...options,                    // Options supplémentaires si besoin
      },
    }),
    pinia,   // On retourne aussi le store (pour le manipuler dans les tests)
    router,  // Et le router (pour vérifier la navigation)
  }
}

// Utilisation : beaucoup plus court !
it("mon test", async () => {
  const { wrapper, router } = createWrapper()
  // ... le test
})
```

---

## Tester les guards de route (protection des pages)

Un **guard** (gardien) de route empêche l'accès à certaines pages si l'utilisateur n'est pas connecté.

```ts
describe("Protection des routes", () => {

  it("redirige vers login si l'utilisateur n'est pas connecté", async () => {
    const router = createTestRouter()  // Le router a un guard qui vérifie l'authentification

    // On essaie d'aller directement sur /dashboard sans être connecté
    router.push("/dashboard")
    await router.isReady()

    // Le guard devrait nous rediriger vers /login
    expect(router.currentRoute.value.name).toBe("login")  // ✅ Redirigé !
  })

  it("autorise l'accès au dashboard si l'utilisateur est connecté", async () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    // On simule un utilisateur connecté en mettant un token dans le store
    const authStore = useAuthStore()
    authStore.token = "valid-token"    // L'utilisateur a un token = il est connecté

    const router = createTestRouter()
    router.push("/dashboard")
    await router.isReady()

    // Cette fois le guard laisse passer
    expect(router.currentRoute.value.name).toBe("dashboard")  // ✅ Accès autorisé !
  })
})
```

---

## Test unitaire vs test d'intégration : quand utiliser lequel ?

| | Test unitaire | Test d'intégration |
|---|---|---|
| **Quoi** | Une seule fonction ou un seul composant | Plusieurs parties ensemble |
| **Exemples** | `clamp()`, `formatPrice()`, un bouton seul | Login complet, page CRUD, navigation |
| **Vitesse** | Très rapide ⚡ | Plus lent 🐢 |
| **Fiabilité** | Teste bien les détails | Teste bien les interactions réelles |
| **Analogie** | Tester le moteur seul | Tester la voiture complète |

### Le bon ratio

```
70% — Tests unitaires      (fonctions, composables, composants simples)
25% — Tests d'intégration  (flux utilisateur, pages avec store/router)
 5% — Tests E2E            (l'application complète dans un vrai navigateur)
```

> **Conseil** : commence par les tests unitaires (rapides et faciles), puis ajoute des tests d'intégration pour les **flux critiques** de ton application (connexion, panier, paiement...).

---

## Résumé

| Concept | C'est quoi ? |
|---------|-------------|
| **Test d'intégration** | Vérifie que plusieurs parties fonctionnent ensemble |
| **Mock d'API** | Fausse réponse serveur pour ne pas dépendre d'un vrai serveur |
| `flushPromises()` | Attend que toutes les opérations async soient terminées |
| `createMemoryHistory()` | Faux historique de navigation pour les tests |
| **Guard de route** | Protection qui empêche l'accès à une page sans connexion |
| **Wrapper factory** | Fonction utilitaire pour simplifier le setup des tests |

---

## 🎯 Pratique

### Exercice TI.1 — Mocker une API

Complète ce test d'intégration qui mock un appel API :

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import UserList from '../UserList.vue'

// Mock global.fetch
global.fetch = vi.fn()

describe('UserList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche la liste des utilisateurs', async () => {
    // Configure le mock pour retourner 2 utilisateurs
    // ???

    const wrapper = mount(UserList)
    await flushPromises()

    // Vérifie que les 2 utilisateurs sont affichés
    // ???
  })
})
```

<details>
<summary>Solution</summary>

```ts
it('affiche la liste des utilisateurs', async () => {
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ])
  } as Response)

  const wrapper = mount(UserList)
  await flushPromises()

  expect(wrapper.text()).toContain('Alice')
  expect(wrapper.text()).toContain('Bob')
})
```
</details>

---

### Exercice TI.2 — Tester une erreur API

Ajoute un test pour vérifier que le composant gère bien les erreurs :

```ts
it('affiche un message d\'erreur si l\'API échoue', async () => {
  // Configure le mock pour simuler une erreur
  // ???

  const wrapper = mount(UserList)
  await flushPromises()

  // Vérifie qu'un message d'erreur est affiché
  // ???
})
```

<details>
<summary>Solution</summary>

```ts
it('affiche un message d\'erreur si l\'API échoue', async () => {
  vi.mocked(fetch).mockRejectedValue(new Error('Erreur réseau'))

  const wrapper = mount(UserList)
  await flushPromises()

  expect(wrapper.text()).toContain('Erreur')
})
```
</details>

---

### Exercice TI.3 — Test avec router

Complète ce test d'intégration avec Vue Router :

```ts
import { createRouter, createMemoryHistory } from 'vue-router'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      { path: '/about', name: 'about', component: { template: '<div>About</div>' } }
    ]
  })
}

describe('Navigation', () => {
  it('navigue vers la page About', async () => {
    const router = createTestRouter()
    const wrapper = mount(App, {
      global: {
        plugins: [router]
      }
    })

    await router.isReady()

    // Navigue vers /about
    // ???

    // Vérifie qu'on est sur la bonne route
    // ???
  })
})
```

<details>
<summary>Solution</summary>

```ts
it('navigue vers la page About', async () => {
  const router = createTestRouter()
  const wrapper = mount(App, {
    global: {
      plugins: [router]
    }
  })

  await router.isReady()

  await router.push('/about')
  await flushPromises()

  expect(router.currentRoute.value.name).toBe('about')
  expect(wrapper.html()).toContain('About')
})
```
</details>

---

### Exercice TI.4 — Wrapper factory

Crée une fonction factory pour simplifier le setup de tes tests :

```ts
// Crée une factory qui monte UserList avec le store et le router
function mountUserList(options = {}) {
  // ???
}

describe('UserList', () => {
  it('utilise la factory', async () => {
    const wrapper = mountUserList()
    // ...
  })
})
```

<details>
<summary>Solution</summary>

```ts
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

function mountUserList(options: { initialRoute?: string } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: UserList }]
  })

  if (options.initialRoute) {
    router.push(options.initialRoute)
  }

  return mount(UserList, {
    global: {
      plugins: [pinia, router]
    }
  })
}
```
</details>

---

## Suite

→ Module 04 : `cours/04-expert/01-performance.md`
