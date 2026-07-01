---
titre: MSW et mocking d'API
cours: 02-vue
notions: [pourquoi intercepter au niveau réseau, handlers http MSW, setupServer pour les tests, setupWorker pour le dev, réponses dynamiques et erreurs, override par test, mocking dans Vitest, mocking pour Playwright]
outcomes:
  - sait mocker une API au niveau réseau avec MSW (handlers http)
  - sait brancher MSW dans les tests Vitest (setupServer) et en dev (setupWorker)
  - sait simuler erreurs, latence et réponses conditionnelles
  - sait override un handler pour un test précis
prerequis: [19-tests-e2e-playwright]
next: 01-performance
libs: [{ name: vue, version: "3.5" }, { name: msw, version: "2" }]
tribuzen: tests TribuZen — mock de l'API famille/invitation avec MSW pour tester le front sans backend réel
last-reviewed: 2026-07
---

# MSW et mocking d'API

> **Outcomes — tu sauras FAIRE :** intercepter les requêtes HTTP au niveau réseau avec MSW 2, écrire des handlers `http.get/post`, brancher `setupServer` dans Vitest et `setupWorker` en dev, simuler erreurs et latence, overrider un handler pour un test précis.
> **Difficulté :** :star::star::star:
>
> **Portée :** ce module couvre MSW 2 (`http` + `HttpResponse`, API stable depuis v2.0). Les tests composants Vitest (montage, assertions DOM) sont couverts au module 18. Les tests E2E Playwright sont le module 19. Ce module se concentre sur la **couche réseau mockée**, commune aux deux.

---

## 1. Cas concret d'abord

Tu travailles sur `InvitationPanel.vue`, le composant TribuZen qui permet d'inviter un proche dans une famille. Il appelle deux endpoints :

- `GET /api/families/:familyId` — charge le nom de la famille
- `POST /api/families/:familyId/invitations` — envoie l'invitation par email

**Problème :** le backend n'est pas déployé. Tu ne peux pas écrire de tests sans un serveur réel — ou alors tu dois mocker `fetch` à la main dans chaque test. Les deux options sont douloureuses.

```ts
// Ce que fait le composant — tu veux tester ça sans backend réel
async function invite(email: string): Promise<void> {
  const res = await fetch(`/api/families/${props.familyId}/invitations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw new Error(`Erreur ${res.status}`)
  success.value = true
}
```

MSW résout ce problème : tu déclares un handler qui intercepte `POST /api/families/:familyId/invitations` au niveau réseau. Le composant appelle `fetch` normalement, sans modification — MSW intercepte la requête avant qu'elle parte sur le réseau et retourne la réponse mockée.

---

## 2. Théorie complète, concise

### 2.1 Interception réseau vs mock de `fetch`

La différence fondamentale entre MSW et `vi.mock('fetch')` ou `vi.spyOn(global, 'fetch')` :

| | Mock de `fetch` à la main | MSW |
|---|---|---|
| Niveau d'interception | API JS (`fetch`) | Réseau (Service Worker / Node interceptor) |
| Portée | Uniquement `fetch` | `fetch`, `XHR`, `axios`, `ky`, toute lib HTTP |
| Réalisme | Le code de prod ne voit pas une vraie `Response` | La vraie `Response` avec headers, status, body |
| Maintenance | Un spy par test, fragile si tu changes de lib | Handlers centralisés, indépendants de la lib |
| Dev mode | Impossible | `setupWorker` intercept dans le navigateur réel |

MSW v2 utilise :
- **`msw/node`** (Vitest, Jest, Node.js) — intercepteur Node natif, pas de Service Worker nécessaire
- **`msw/browser`** (dev mode, Playwright browser mode) — Service Worker dans le navigateur

### 2.2 Handlers `http.get/post` et `HttpResponse`

Un handler MSW v2 associe un pattern d'URL à une fonction resolver.

```ts
import { http, HttpResponse } from 'msw'

// GET simple — retourne du JSON avec status 200 implicite
http.get('/api/families/:familyId', ({ params }) => {
  return HttpResponse.json({
    id: params.familyId,
    name: 'Les Dupont',
  })
})

// POST — lit le body de la requête et retourne 201
http.post('/api/families/:familyId/invitations', async ({ request, params }) => {
  const body = await request.json() as { email: string }
  return HttpResponse.json(
    { id: 'inv-001', email: body.email, familyId: params.familyId },
    { status: 201 }
  )
})
```

**`HttpResponse.json(data, init?)`** : raccourci pour `new HttpResponse(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' }, ...init })`.

Le resolver reçoit `{ request, params, cookies }` :
- `params` : paramètres d'URL (`:familyId` → `params.familyId`)
- `request` : objet `Request` standard — `await request.json()`, `request.headers.get('Authorization')`

### 2.3 `setupServer` pour les tests — lifecycle

`setupServer` crée un serveur MSW pour Node (Vitest, Jest). Le lifecycle est toujours le même :

```ts
// mocks/node.ts — serveur partagé entre tous les tests
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

```ts
// vitest.setup.ts — branché dans vite.config.ts > test.setupFiles
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './mocks/node'

beforeAll(() => server.listen())        // Active l'intercepteur avant tous les tests
afterEach(() => server.resetHandlers()) // Efface les overrides ajoutés par test (crucial)
afterAll(() => server.close())          // Désactive l'intercepteur après tous les tests
```

```ts
// vite.config.ts
export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.ts'],
    environment: 'jsdom', // ou 'node' selon les besoins
  },
})
```

**Ordre des opérations :** `beforeAll listen` → `[test 1 → afterEach resetHandlers]` → `[test 2 → afterEach resetHandlers]` → `afterAll close`.

### 2.4 `setupWorker` pour le dev

En développement, MSW enregistre un Service Worker qui intercepte les requêtes dans le navigateur réel. L'application ne sait pas qu'elle parle à un mock.

```ts
// mocks/browser.ts
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
```

```ts
// main.ts — démarrage conditionnel en dev uniquement
async function enableMocking(): Promise<void> {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
    // 'bypass' : les requêtes sans handler passent au réseau réel
    // 'warn'   : log en console (utile pour débugger les handlers manquants)
    // 'error'  : throw si aucun handler ne correspond
  }
}

enableMocking().then(() => {
  createApp(App).mount('#app')
})
```

Le fichier Service Worker doit être copié à la racine du domaine :

```bash
npx msw init public/ --save
```

Cela crée `public/mockServiceWorker.js` et ajoute `"msw": { "workerDirectory": "public" }` au `package.json`.

### 2.5 Réponses dynamiques, erreurs et latence

**Erreur réseau** (équivalent d'une perte de connexion) :

```ts
http.get('/api/families/:familyId', () => {
  return HttpResponse.error()
  // fetch() lancera un TypeError: Failed to fetch
})
```

**Erreur HTTP** (4xx/5xx — le serveur répond mais avec un statut d'erreur) :

```ts
http.post('/api/families/:familyId/invitations', () => {
  return new HttpResponse(null, { status: 409 })
  // Le composant doit tester res.ok (false pour 4xx/5xx)
})
```

**Latence simulée** — utile pour tester les états de chargement :

```ts
import { http, HttpResponse, delay } from 'msw'

http.get('/api/families/:familyId', async () => {
  await delay(1500)    // millisecondes
  return HttpResponse.json({ id: 'fam-001', name: 'Les Dupont' })
})

// Latence "réaliste" — valeur aléatoire entre les bornes
http.get('/api/families/:familyId', async () => {
  await delay('real') // MSW simule une latence réaliste variable
  return HttpResponse.json({ id: 'fam-001', name: 'Les Dupont' })
})
```

**Réponse conditionnelle** — selon le body ou les params :

```ts
http.post('/api/families/:familyId/invitations', async ({ request }) => {
  const { email } = await request.json() as { email: string }

  if (email.endsWith('@blocked.com')) {
    return HttpResponse.json({ message: 'Domaine bloqué' }, { status: 422 })
  }

  return HttpResponse.json({ id: 'inv-001', email }, { status: 201 })
})
```

### 2.6 Override par test avec `server.use()`

`server.use()` **prépose** un handler temporaire : il est prioritaire sur les handlers de base, et `resetHandlers()` le retire après le test.

```ts
it('affiche une erreur si l\'invitation échoue', async () => {
  // Override uniquement pour ce test
  server.use(
    http.post('/api/families/:familyId/invitations', () => {
      return new HttpResponse(null, { status: 500 })
    })
  )

  // Le composant voit un 500 → doit afficher un message d'erreur
  // ... assertions ...
})
// Après ce test, afterEach → server.resetHandlers() retire l'override
// Le test suivant retrouve les handlers de base
```

Pattern recommandé : handlers "happy path" dans `mocks/handlers.ts` (base), overrides d'erreur dans chaque test via `server.use()`.

### 2.7 MSW dans Vitest — flux complet

```ts
// mocks/handlers.ts — happy path TribuZen
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/families/:familyId', ({ params }) => {
    return HttpResponse.json({
      id: params.familyId as string,
      name: 'Les Dupont',
    })
  }),

  http.post('/api/families/:familyId/invitations', async ({ request }) => {
    const { email } = await request.json() as { email: string }
    return HttpResponse.json({ id: 'inv-001', email }, { status: 201 })
  }),
]
```

```ts
// InvitationPanel.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { server } from '../mocks/node'
import { http, HttpResponse } from 'msw'
import InvitationPanel from './InvitationPanel.vue'

// server.listen/resetHandlers/close sont dans vitest.setup.ts

describe('InvitationPanel', () => {
  it('affiche le succès après invitation', async () => {
    const wrapper = mount(InvitationPanel, {
      props: { familyId: 'fam-001' },
    })

    await wrapper.find('input[type="email"]').setValue('alice@example.com')
    await wrapper.find('button[type="submit"]').trigger('click')

    // Handler de base répond 201 — le composant doit afficher le succès
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Invitation envoyée')
    })
  })

  it('affiche une erreur sur 409 (email déjà invité)', async () => {
    server.use(
      http.post('/api/families/:familyId/invitations', () => {
        return HttpResponse.json({ message: 'Déjà invité' }, { status: 409 })
      })
    )

    const wrapper = mount(InvitationPanel, {
      props: { familyId: 'fam-001' },
    })

    await wrapper.find('input[type="email"]').setValue('bob@example.com')
    await wrapper.find('button[type="submit"]').trigger('click')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Erreur')
    })
  })
})
```

### 2.8 MSW dans Playwright

Pour les tests E2E, `@msw/playwright` expose un fixture `network` qui wrappe `setupWorker` dans le contexte Playwright.

```ts
// playwright.setup.ts
import { test as testBase } from '@playwright/test'
import { defineNetworkFixture, type NetworkFixture } from '@msw/playwright'
import { type AnyHandler } from 'msw'
import { handlers } from './mocks/handlers'

interface Fixtures {
  handlers: Array<AnyHandler>
  network: NetworkFixture
}

export const test = testBase.extend<Fixtures>({
  handlers: [handlers, { option: true }],
  network: [
    async ({ context, handlers }, use) => {
      const network = defineNetworkFixture({
        context,
        handlers,
        onUnhandledRequest: 'bypass',
      })
      await network.enable()
      await use(network)
      await network.disable()
    },
    { auto: true },
  ],
})
```

```ts
// invitation.spec.ts
import { http, HttpResponse } from 'msw'
import { test, expect } from './playwright.setup'

test('affiche une erreur si le serveur est indisponible', async ({ network, page }) => {
  network.use(
    http.post('/api/families/:familyId/invitations', () => {
      return HttpResponse.error()
    })
  )

  await page.goto('/families/fam-001/invitations')
  await page.fill('input[type="email"]', 'alice@example.com')
  await page.click('button[type="submit"]')

  await expect(page.getByRole('alert')).toBeVisible()
})
```

L'avantage par rapport à `page.route()` natif Playwright : les mêmes handlers `mocks/handlers.ts` sont réutilisés entre Vitest et Playwright — une seule source de vérité.

---

## 3. Worked examples

### Exemple 1 — Handlers TribuZen complets

Structure cible du projet :

```
src/
  mocks/
    handlers.ts       ← handlers partagés Vitest + Playwright
    node.ts           ← setupServer (Vitest/Node)
    browser.ts        ← setupWorker (dev mode)
  components/
    family/
      InvitationPanel.vue
      InvitationPanel.test.ts
```

**`mocks/handlers.ts`** — handlers représentatifs du domaine TribuZen :

```ts
import { http, HttpResponse, delay } from 'msw'

interface InvitationBody {
  email: string
}

export const handlers = [
  // Charge la famille — simule une légère latence réseau
  http.get('/api/families/:familyId', async ({ params }) => {
    await delay(150)
    return HttpResponse.json({
      id: params.familyId as string,
      name: 'Les Dupont',
      memberCount: 3,
    })
  }),

  // Envoie une invitation — valide le format email côté mock
  http.post('/api/families/:familyId/invitations', async ({ request, params }) => {
    const body = await request.json() as InvitationBody

    // Validation basique dans le mock pour tester le happy path ET les erreurs
    if (!body.email || !body.email.includes('@')) {
      return HttpResponse.json(
        { message: 'Email invalide' },
        { status: 422 }
      )
    }

    return HttpResponse.json(
      {
        id: `inv-${Date.now()}`,
        email: body.email,
        familyId: params.familyId as string,
        sentAt: new Date().toISOString(),
      },
      { status: 201 }
    )
  }),

  // Liste les membres — retourne un tableau typé
  http.get('/api/families/:familyId/members', ({ params }) => {
    return HttpResponse.json([
      { id: 'mbr-001', name: 'Alice Dupont', role: 'admin' },
      { id: 'mbr-002', name: 'Bob Dupont',   role: 'member' },
    ])
  }),
]
```

**`mocks/node.ts`** :

```ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

**`mocks/browser.ts`** :

```ts
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
```

### Exemple 2 — Suite de tests `InvitationPanel.test.ts` pas à pas

```ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { server } from '../mocks/node'
import { http, HttpResponse } from 'msw'
import InvitationPanel from './InvitationPanel.vue'

// Rappel : server.listen() / resetHandlers() / close() sont dans vitest.setup.ts

describe('InvitationPanel — happy path', () => {
  it('charge et affiche le nom de la famille', async () => {
    const wrapper = mount(InvitationPanel, {
      props: { familyId: 'fam-001' },
    })

    // Le handler GET /api/families/fam-001 répond "Les Dupont"
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Les Dupont')
    })
  })

  it('envoie le POST et affiche le message de succès', async () => {
    const wrapper = mount(InvitationPanel, {
      props: { familyId: 'fam-001' },
    })

    await wrapper.find('input[type="email"]').setValue('alice@tribuzen.app')
    await wrapper.find('button[type="submit"]').trigger('click')

    await vi.waitFor(() => {
      // Le handler POST répond 201 — le composant affiche la confirmation
      expect(wrapper.find('[data-testid="success"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('alice@tribuzen.app')
    })
  })
})

describe('InvitationPanel — états d\'erreur', () => {
  it('affiche une erreur réseau (perte de connexion)', async () => {
    // Override pour ce test uniquement : simule une perte réseau
    server.use(
      http.post('/api/families/:familyId/invitations', () => {
        return HttpResponse.error()
      })
    )

    const wrapper = mount(InvitationPanel, {
      props: { familyId: 'fam-001' },
    })

    await wrapper.find('input[type="email"]').setValue('bob@tribuzen.app')
    await wrapper.find('button[type="submit"]').trigger('click')

    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="error"]').exists()).toBe(true)
    })
    // afterEach → server.resetHandlers() : le handler POST de base est restauré
  })

  it('affiche un message sur 409 (email déjà dans la famille)', async () => {
    server.use(
      http.post('/api/families/:familyId/invitations', () => {
        return HttpResponse.json(
          { message: 'Cet email est déjà membre de la famille' },
          { status: 409 }
        )
      })
    )

    const wrapper = mount(InvitationPanel, {
      props: { familyId: 'fam-001' },
    })

    await wrapper.find('input[type="email"]').setValue('alice@tribuzen.app')
    await wrapper.find('button[type="submit"]').trigger('click')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('déjà membre')
    })
  })
})
```

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Mocker `fetch` à la main au lieu du réseau

```ts
// ❌ Fragile : lie les tests à l'implémentation fetch
vi.spyOn(global, 'fetch').mockResolvedValueOnce({
  ok: true,
  json: async () => ({ id: 'inv-001' }),
} as Response)

// Si le composant passe de fetch à axios demain, le test casse
// La Response mockée n'a pas de headers, de status réaliste, etc.
```

```ts
// ✅ MSW intercepte au niveau réseau — la lib HTTP est interchangeable
http.post('/api/families/:familyId/invitations', () => {
  return HttpResponse.json({ id: 'inv-001' }, { status: 201 })
})
// fetch, axios, ky — peu importe, MSW intercepte tous
```

### PIÈGE #2 — Oublier `resetHandlers` entre les tests

```ts
// ❌ Sans resetHandlers dans afterEach :
describe('InvitationPanel', () => {
  it('test 1 — override erreur 500', async () => {
    server.use(http.post('/api/...', () => new HttpResponse(null, { status: 500 })))
    // Test 1 passe
  })

  it('test 2 — devrait voir le succès', async () => {
    // ❌ L'override 500 du test 1 est encore actif !
    // Le composant voit toujours 500 → test 2 échoue de façon mystérieuse
  })
})

// ✅ Dans vitest.setup.ts :
afterEach(() => server.resetHandlers())
// Les overrides server.use() sont retirés après chaque test
// Les handlers de base (mocks/handlers.ts) sont restaurés
```

### PIÈGE #3 — URL de handler trop rigide (sans paramètre)

```ts
// ❌ Ne matche que /api/families/fam-001/invitations — rien d'autre
http.post('/api/families/fam-001/invitations', resolver)

// Si le test monte le composant avec familyId="fam-002" : aucun handler → requête bloquée
```

```ts
// ✅ Paramètre dynamique avec :familyId
http.post('/api/families/:familyId/invitations', ({ params }) => {
  // params.familyId contient la valeur capturée (string)
  return HttpResponse.json({ id: 'inv-001', familyId: params.familyId })
})
// Matche /api/families/fam-001/invitations, /api/families/abc/invitations, etc.
```

---

## 5. Ancrage TribuZen

Dans TribuZen, MSW couvre deux niveaux :

**Niveau tests (Vitest)** — `mocks/node.ts` est branché dans `vitest.setup.ts`. Tous les tests composants qui appellent l'API (InvitationPanel, FamilyPage, MemberList) utilisent les handlers de `mocks/handlers.ts` sans aucune configuration par test. Les overrides `server.use()` couvrent les cas d'erreur (409 email déjà invité, 422 email invalide, 500 backend down, `HttpResponse.error()` réseau coupé).

**Niveau dev (Vite + setupWorker)** — pendant le sprint frontend, le backend peut ne pas être prêt. `main.ts` démarre le worker en mode DEV :

```ts
// main.ts — TribuZen
async function enableMocking(): Promise<void> {
  if (import.meta.env.DEV && import.meta.env.VITE_MSW === 'true') {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'warn' })
  }
}
```

La variable `VITE_MSW=true` dans `.env.development.local` active le mock sans l'inclure dans le build de prod.

**Fichiers cibles dans `smaurier/tribuzen` :**

```
tribuzen/
  src/
    mocks/
      handlers.ts           ← source de vérité des mocks
      node.ts               ← setupServer (Vitest)
      browser.ts            ← setupWorker (dev)
    components/
      family/
        InvitationPanel.vue
        InvitationPanel.test.ts
  vitest.setup.ts           ← lifecycle beforeAll/afterEach/afterAll
  public/
    mockServiceWorker.js    ← généré par npx msw init public/
```

---

## 6. Points clés

1. MSW intercepte au niveau réseau (Service Worker ou Node interceptor) — `fetch`, `axios`, `ky` sont tous couverts sans modification du code de prod.
2. `http.get/post(pattern, resolver)` — pattern avec `:param` pour les segments dynamiques ; `HttpResponse.json(data, init?)` pour la réponse.
3. `setupServer` (`msw/node`) pour Vitest : `beforeAll listen` → `afterEach resetHandlers` → `afterAll close` — ce triplet est non négociable.
4. `setupWorker` (`msw/browser`) pour le dev : `worker.start({ onUnhandledRequest: 'bypass' })` dans `main.ts`, conditionnel sur `import.meta.env.DEV`.
5. `HttpResponse.error()` = erreur réseau (TypeError `Failed to fetch`) ; `new HttpResponse(null, { status: 500 })` = erreur HTTP (statut reçu, `res.ok === false`).
6. `delay(ms)` ou `delay('real')` (import `msw`) pour simuler la latence et tester les états de chargement.
7. `server.use(handler)` prépose un override pour le test courant ; `server.resetHandlers()` le retire — toujours appeler dans `afterEach`.
8. `@msw/playwright` expose un fixture `network` — les mêmes handlers que Vitest, une seule source de vérité.

---

## 7. Seeds Anki

```
Quelle est la différence entre HttpResponse.error() et new HttpResponse(null, { status: 500 }) dans MSW 2 ?|HttpResponse.error() simule une erreur réseau (TypeError: Failed to fetch, pas de réponse HTTP). new HttpResponse(null, { status: 500 }) simule une réponse HTTP avec un code d'erreur — fetch() résout normalement mais res.ok est false.
Pourquoi utiliser MSW plutôt que vi.spyOn(global, 'fetch') pour tester les composants ?|MSW intercepte au niveau réseau — fetch, axios, ky sont tous couverts. vi.spyOn(fetch) est fragile (lie le test à l'implémentation), retourne une Response incomplète, et casse si on change de lib HTTP.
Quel est le triplet lifecycle obligatoire pour setupServer dans Vitest ?|beforeAll(() => server.listen()), afterEach(() => server.resetHandlers()), afterAll(() => server.close()). Oublier resetHandlers contamine les tests suivants avec les overrides du test courant.
Comment overrider un handler MSW pour un seul test sans affecter les autres ?|server.use(http.post('/api/...', () => new HttpResponse(null, { status: 409 }))) dans le test. afterEach → server.resetHandlers() retire l'override. Les handlers de base (mocks/handlers.ts) sont restaurés automatiquement.
Quelle est la différence entre setupServer (msw/node) et setupWorker (msw/browser) ?|setupServer est pour Node.js/Vitest — utilise un intercepteur Node, pas de Service Worker. setupWorker est pour le navigateur — enregistre un Service Worker qui intercepte les requêtes HTTP réelles en dev mode.
Comment simuler de la latence réseau dans un handler MSW 2 ?|import { delay } from 'msw'. Dans le resolver : await delay(1500) pour une latence fixe en ms, ou await delay('real') pour une latence réaliste variable simulée par MSW.
Pourquoi déclarer :familyId dans le pattern d'URL plutôt que l'URL exacte ?|http.post('/api/families/:familyId/invitations', ...) matche toute valeur de familyId. L'URL exacte /api/families/fam-001/invitations ne matche pas si le test utilise un autre ID — handler non trouvé, requête bloquée ou laissée passer sans mock.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-20-msw-et-mocking-api/README.md`. Tester `InvitationPanel.vue` avec MSW 2 — handlers TribuZen, états d'erreur, override par test, corrigé intégral commenté.

---

| Précédent | Suivant |
|-----------|---------|
| [19 — Tests E2E Playwright](./19-tests-e2e-playwright.md) | 01-performance (bloc expert) |
