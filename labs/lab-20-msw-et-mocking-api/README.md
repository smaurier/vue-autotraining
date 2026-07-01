# Lab 20 — MSW et mocking d'API

> **Outcome :** à la fin, tu sais tester un composant Vue 3 qui appelle une API en interceptant les requêtes au niveau réseau avec MSW 2 — happy path, erreurs HTTP, erreur réseau, et override par test.
> **Vrai outil :** MSW 2 (`msw/node`) + Vitest + Vue Test Utils.
> **Feedback :** le coach valide en session — Vitest en mode watch (`pnpm test`) est l'oracle immédiat.

---

## Énoncé

Tu testes `InvitationPanel.vue`, le composant TribuZen qui permet d'inviter un proche dans une famille. Ce composant :

1. Charge le nom de la famille via `GET /api/families/:familyId` à l'initialisation.
2. Envoie une invitation via `POST /api/families/:familyId/invitations` au submit.
3. Affiche le succès (email confirmé) ou un message d'erreur selon la réponse.

**Ton rôle dans ce lab :**

- Écrire les handlers MSW pour ces deux endpoints.
- Écrire une suite de tests Vitest couvrant 4 scénarios : happy path GET, happy path POST, erreur 409, erreur réseau.

**Pas de gap-fill** — tu écris le setup MSW et les tests de zéro à partir du starter.

### Starter — `InvitationPanel.vue`

Crée ce composant dans `src/components/family/InvitationPanel.vue` :

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  familyId: string
}>()

interface Family {
  id: string
  name: string
}

interface InvitationResult {
  id: string
  email: string
}

const family = ref<Family | null>(null)
const email = ref('')
const success = ref<InvitationResult | null>(null)
const error = ref<string | null>(null)
const loading = ref(false)

onMounted(async () => {
  try {
    const res = await fetch(`/api/families/${props.familyId}`)
    if (!res.ok) throw new Error(`Erreur ${res.status}`)
    family.value = await res.json()
  } catch {
    error.value = 'Impossible de charger la famille'
  }
})

async function invite(): Promise<void> {
  error.value = null
  success.value = null
  loading.value = true

  try {
    const res = await fetch(`/api/families/${props.familyId}/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    })

    if (res.status === 409) {
      error.value = 'Cet email est déjà membre de la famille'
      return
    }

    if (!res.ok) {
      error.value = `Erreur serveur (${res.status})`
      return
    }

    success.value = await res.json()
  } catch {
    error.value = 'Erreur réseau — vérifiez votre connexion'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h2 v-if="family">{{ family.name }}</h2>
    <p v-if="error" data-testid="error" role="alert">{{ error }}</p>
    <div v-if="success" data-testid="success">
      Invitation envoyée à {{ success.email }}
    </div>
    <form v-if="!success" @submit.prevent="invite">
      <input
        v-model="email"
        type="email"
        placeholder="prenom@exemple.com"
        :disabled="loading"
      />
      <button type="submit" :disabled="loading || !email">
        {{ loading ? 'Envoi…' : 'Inviter' }}
      </button>
    </form>
  </div>
</template>
```

### Starter — fichiers MSW à créer

```
src/
  mocks/
    handlers.ts      ← à compléter
    node.ts          ← à compléter
  vitest.setup.ts    ← à compléter
```

**`vitest.setup.ts`** (squelette) :

```ts
// À compléter : importer server depuis mocks/node
// Écrire beforeAll, afterEach, afterAll

import { beforeAll, afterEach, afterAll } from 'vitest'
// ... à toi
```

**`vite.config.ts`** (à vérifier que setupFiles est configuré) :

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
})
```

---

## Étapes (en friction)

1. **Installe MSW** si ce n'est pas fait : `pnpm add -D msw`.

2. **Écris `mocks/handlers.ts`** — deux handlers :
   - `GET /api/families/:familyId` → `HttpResponse.json({ id, name: 'Les Dupont' })`
   - `POST /api/families/:familyId/invitations` → lit le body, retourne `{ id: 'inv-001', email }` en 201

3. **Écris `mocks/node.ts`** — importe `setupServer` depuis `msw/node`, exporte `server = setupServer(...handlers)`.

4. **Complète `vitest.setup.ts`** — le triplet `beforeAll listen / afterEach resetHandlers / afterAll close`.

5. **Écris `InvitationPanel.test.ts`** avec 4 tests :
   - **Test 1** : le nom "Les Dupont" apparaît après chargement.
   - **Test 2** : après submit avec un email valide, `[data-testid="success"]` est visible et contient l'email.
   - **Test 3** : override `server.use()` → POST répond 409 → `[data-testid="error"]` contient "déjà membre".
   - **Test 4** : override `server.use()` → POST répond `HttpResponse.error()` → `[data-testid="error"]` contient "réseau".

6. **Lance `pnpm test`** — les 4 tests doivent passer au vert.

7. **Vérifie l'isolation** : supprime temporairement `afterEach(() => server.resetHandlers())` de `vitest.setup.ts` et constate que le test suivant un override 409 échoue à son tour (contamination). Remets `resetHandlers`.

---

## Corrigé complet commenté

### `mocks/handlers.ts`

```ts
import { http, HttpResponse } from 'msw'

interface InvitationBody {
  email: string
}

export const handlers = [
  // Handler GET famille — paramètre :familyId capturé dans params
  // delay() non inclus ici pour ne pas ralentir les tests
  http.get('/api/families/:familyId', ({ params }) => {
    return HttpResponse.json({
      id: params.familyId as string,
      name: 'Les Dupont',
    })
    // HttpResponse.json() = shorthand pour new HttpResponse(JSON.stringify(...), { headers: Content-Type:json })
  }),

  // Handler POST invitation — lit le body pour retourner l'email confirmé
  http.post('/api/families/:familyId/invitations', async ({ request, params }) => {
    // request est un objet Request standard — .json() lit et parse le body
    const body = await request.json() as InvitationBody

    return HttpResponse.json(
      {
        id: 'inv-001',
        email: body.email,
        familyId: params.familyId as string,
      },
      { status: 201 }
      // status 201 → res.ok est true → la branche success dans le composant
    )
  }),
]
```

### `mocks/node.ts`

```ts
import { setupServer } from 'msw/node'
// msw/node = package path pour Node.js/Vitest (intercepteur Node, pas de Service Worker)
import { handlers } from './handlers'

// setupServer crée le serveur MSW avec les handlers de base
// On l'exporte pour pouvoir appeler server.use() dans les tests individuels
export const server = setupServer(...handlers)
```

### `vitest.setup.ts`

```ts
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './src/mocks/node'

// beforeAll : active l'intercepteur MSW avant la première suite de tests
// onUnhandledRequest: 'warn' — log les requêtes sans handler (aide au débogage)
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

// afterEach : CRUCIAL — retire les overrides server.use() ajoutés par chaque test
// Sans ce resetHandlers, un override d'un test contamine les tests suivants
afterEach(() => server.resetHandlers())

// afterAll : désactive l'intercepteur après tous les tests
afterAll(() => server.close())
```

### `InvitationPanel.test.ts`

```ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/node'
import InvitationPanel from './InvitationPanel.vue'

// Le lifecycle (listen/resetHandlers/close) est dans vitest.setup.ts
// Chaque describe/it commence avec les handlers de base (handlers.ts)

describe('InvitationPanel — chargement de la famille', () => {
  it('affiche le nom de la famille après le GET initial', async () => {
    // Monte le composant avec familyId — onMounted déclenche GET /api/families/fam-001
    const wrapper = mount(InvitationPanel, {
      props: { familyId: 'fam-001' },
    })

    // vi.waitFor attend que la condition devienne vraie (poll asynchrone)
    // Nécessaire car onMounted est async et le DOM ne se met à jour qu'après la réponse
    await vi.waitFor(() => {
      // Le handler GET retourne { name: 'Les Dupont' } → le composant l'affiche dans <h2>
      expect(wrapper.find('h2').text()).toBe('Les Dupont')
    })
  })
})

describe('InvitationPanel — envoi d\'invitation', () => {
  it('affiche le succès après un POST 201', async () => {
    const wrapper = mount(InvitationPanel, {
      props: { familyId: 'fam-001' },
    })

    // Remplit et soumet le formulaire
    await wrapper.find('input[type="email"]').setValue('alice@tribuzen.app')
    await wrapper.find('button[type="submit"]').trigger('click')

    await vi.waitFor(() => {
      // Le handler POST retourne 201 → success.value est défini → <div data-testid="success"> visible
      expect(wrapper.find('[data-testid="success"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('alice@tribuzen.app')
    })
  })

  it('affiche "déjà membre" sur un POST 409', async () => {
    // Override pour ce test uniquement — prend priorité sur le handler POST de base
    server.use(
      http.post('/api/families/:familyId/invitations', () => {
        // 409 Conflict — le composant teste explicitement res.status === 409
        return HttpResponse.json(
          { message: 'Déjà membre' },
          { status: 409 }
        )
      })
    )
    // Après ce test : afterEach → server.resetHandlers() retire cet override

    const wrapper = mount(InvitationPanel, {
      props: { familyId: 'fam-001' },
    })

    await wrapper.find('input[type="email"]').setValue('alice@tribuzen.app')
    await wrapper.find('button[type="submit"]').trigger('click')

    await vi.waitFor(() => {
      // Le composant branche sur status 409 → error.value = 'Cet email est déjà membre...'
      expect(wrapper.find('[data-testid="error"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('déjà membre')
    })
  })

  it('affiche "Erreur réseau" sur HttpResponse.error()', async () => {
    // Override erreur réseau — simule une perte de connexion
    server.use(
      http.post('/api/families/:familyId/invitations', () => {
        // HttpResponse.error() → fetch() lance TypeError: Failed to fetch
        // Le bloc catch dans le composant attrape cette erreur
        return HttpResponse.error()
      })
    )

    const wrapper = mount(InvitationPanel, {
      props: { familyId: 'fam-001' },
    })

    await wrapper.find('input[type="email"]').setValue('bob@tribuzen.app')
    await wrapper.find('button[type="submit"]').trigger('click')

    await vi.waitFor(() => {
      // Le catch définit error.value = 'Erreur réseau — vérifiez votre connexion'
      expect(wrapper.find('[data-testid="error"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('réseau')
    })
  })
})
```

**Pourquoi ce corrigé est correct :**

- `handlers.ts` utilise `:familyId` — matche `fam-001`, `fam-002`, n'importe quel ID. Une URL exacte casserait si le test passe un ID différent.
- `server.resetHandlers()` dans `afterEach` garantit que l'override 409 du test 3 ne contamine pas le test 4.
- `vi.waitFor()` est requis partout où le composant fait un `fetch` — le DOM se met à jour après la résolution de la Promise, pas de façon synchrone.
- `HttpResponse.error()` vs `new HttpResponse(null, { status: 500 })` : le premier déclenche le `catch` (TypeError), le second rentre dans la branche `!res.ok` — le composant doit gérer les deux.

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — 30 minutes chrono, sans relire ce corrigé :**

1. Ajoute un handler `GET /api/families/:familyId/members` qui retourne un tableau de 2 membres.
2. Modifie `InvitationPanel.vue` pour afficher la liste des membres existants avant le formulaire.
3. Ajoute un test qui vérifie que les membres s'affichent.
4. Ajoute un test qui overrides le GET membres avec une réponse vide et vérifie l'affichage du empty state.
5. Bonus : simule une latence de 200ms sur le GET membres avec `delay(200)` et teste l'état de chargement (`loading === true` pendant l'attente).

**Critère de réussite :** 4 tests verts (ou 5 avec le bonus) et `pnpm test` termine proprement.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, ce setup MSW vit ici :

```
tribuzen/
  src/
    mocks/
      handlers.ts           ← source de vérité (GET famille, POST invitation, GET membres)
      node.ts               ← setupServer pour Vitest
      browser.ts            ← setupWorker pour dev mode
    components/
      family/
        InvitationPanel.vue
        InvitationPanel.test.ts
  vitest.setup.ts
  public/
    mockServiceWorker.js    ← npx msw init public/ --save
```

**Différences par rapport au lab :**

- `browser.ts` est activé dans `main.ts` via `VITE_MSW=true` dans `.env.development.local` — le mock ne s'active qu'en dev et n'entre jamais dans le build de prod.
- Les handlers incluront l'authentification (`Authorization: Bearer ...` lu depuis `request.headers`) pour tester les routes protégées.
- `InvitationPanel` reçoit `familyId` depuis Pinia (store famille) plutôt que depuis une prop directe.

**Commit cible :**

```
feat(family): InvitationPanel + MSW handlers — tests happy path, 409, réseau
```
