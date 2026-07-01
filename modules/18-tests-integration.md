---
titre: Tests d'intégration
cours: 02-vue
notions: [portée d'un test d'intégration, tester composant plus store Pinia, tester composant plus router, monter avec des plugins global.plugins, tester un flux utilisateur multi-composants, doublures aux frontières, pyramide des tests]
outcomes:
  - sait situer le test d'intégration entre unitaire et E2E
  - sait monter un composant avec Pinia et Router réels pour tester un flux
  - sait tester une interaction traversant plusieurs composants et le store
  - sait décider quoi mocker (frontières) et quoi garder réel
prerequis: [17-tests-composants]
next: 19-tests-e2e-playwright
libs: [{ name: vue, version: "3.5" }, { name: "@vue/test-utils", version: "2" }, { name: vitest, version: "3" }]
tribuzen: flux TribuZen — tester le flux invitation (formulaire plus store plus mise à jour de la liste des membres) en intégration
last-reviewed: 2026-07
---

# Tests d'intégration

> **Outcomes — tu sauras FAIRE :** situer le test d'intégration dans la pyramide, monter un composant avec Pinia et Router réels via `global.plugins`, tester un flux utilisateur qui traverse plusieurs composants et le store, décider quoi mocker aux frontières.
> **Difficulté :** :star::star::star::star:
>
> **Portée :** ce module couvre les **tests d'intégration Vue — composant(s) + store + router** dans Vitest. Les tests E2E Playwright (vrai navigateur, vrai serveur) sont le sujet du **module 19**.

---

← Précédent : [17 — Tests de composants](17-tests-composants.md)

---

## 1. Cas concret d'abord

Tu travailles sur le module membres de TribuZen. Voici le flux d'invitation :

1. L'utilisateur remplit `InviteForm.vue` (email + rôle) et clique **Inviter**.
2. Le composant appelle `invitationStore.invite(email, role)`.
3. Le store fait un `POST /api/invitations`, reçoit le nouveau membre, l'ajoute à `members`.
4. `MemberList.vue` — branché sur le même store — affiche instantanément le nouveau membre.

Tu as **déjà testé `InviteForm` en isolation** (module 17) : le bouton émet bien l'événement, le champ de saisie se vide après soumission. Tu as **déjà testé `invitationStore` en unitaire** : `invite()` appelle bien `POST /api/invitations` et ajoute le membre.

Mais ces deux tests ne répondent pas à la question : **est-ce que `MemberList` se met réellement à jour quand l'utilisateur clique Inviter dans `InviteForm` ?** C'est exactement ça, un test d'intégration.

```ts
// __tests__/integration/invite-flow.test.ts — aperçu avant la théorie
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia }          from 'pinia'
import InvitePage               from '@/views/InvitePage.vue'

it('ajoute le membre à la liste après invitation réussie', async () => {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ id: 'm99', name: 'Zara', role: 'member' }),
  })

  const wrapper = mount(InvitePage, {
    global: { plugins: [createPinia()] },
  })

  await wrapper.find('input[name="email"]').setValue('zara@tribuzen.app')
  await wrapper.find('form').trigger('submit')
  await flushPromises()

  expect(wrapper.text()).toContain('Zara')   // MemberList a bien reçu le nouveau membre
})
```

Ce test passe par : formulaire → store → liste. Un seul test, un flux complet. Voilà pourquoi on en a besoin.

---

## 2. Théorie complète, concise

### 2.1 Portée du test d'intégration

La pyramide des tests classe les tests par **coût vs confiance** :

```
         ▲
        /E2E\       5%  — vrai navigateur, vrai serveur, lent, coûteux
       /─────\
      /Intégra-\   25%  — composant(s) + store/router réels, Vitest, rapide
     /──────────\
    / Unitaires  \ 70%  — fonction ou composant isolé, Vitest, très rapide
   ──────────────
```

**Test unitaire** — une fonction ou un composant, dépendances mockées, teste les détails internes.
**Test d'intégration** — plusieurs parties assemblées (composant + store, composant + router, page entière), seules les **frontières externes** (API HTTP, LocalStorage) sont mockées.
**Test E2E** — l'application complète dans un vrai navigateur, test de bout en bout.

La règle : **70 / 25 / 5**. Plus on monte dans la pyramide, plus les tests sont coûteux à écrire et lents à exécuter. Les tests d'intégration couvrent les **flux critiques** sans le coût de l'E2E.

### 2.2 Monter avec `global.plugins`

`@vue/test-utils` expose `global.plugins` pour brancher des plugins Vue à l'instance de test. La syntaxe accepte tout ce qu'`app.use()` accepte :

```ts
import { mount }        from '@vue/test-utils'
import { createPinia }  from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import MyPage           from '@/views/MyPage.vue'

const pinia  = createPinia()
const router = createRouter({
  history: createMemoryHistory(),   // pas d'URL réelle — navigation en mémoire
  routes: [
    { path: '/', component: MyPage },
    { path: '/members', name: 'members', component: { template: '<div />' } },
  ],
})

const wrapper = mount(MyPage, {
  global: {
    plugins: [pinia, router],       // les deux plugins sont branchés à l'instance de test
  },
})
```

`createMemoryHistory()` remplace `createWebHistory()` dans les tests : pas de dépendance au DOM `window.location`, navigation synchronisable.

### 2.3 Pinia réelle vs `createTestingPinia`

Deux stratégies pour Pinia en intégration :

**`createPinia()` — store réel**
Le store exécute ses vraies actions. C'est la bonne approche pour les tests d'intégration : on veut vérifier que la logique du store participe correctement au flux.

```ts
import { createPinia } from 'pinia'

const wrapper = mount(InvitePage, {
  global: { plugins: [createPinia()] },
})
// Les actions du store s'exécutent réellement
```

**`createTestingPinia()` — store contrôlé** (package `@pinia/testing`)
Stubbe toutes les actions par défaut, permet de pré-seeder l'état initial. Utile quand on veut tester un composant dont le store a été rempli par un autre flux (déjà testé).

```ts
// ⚠️ à gater Context7 — vérifier API exacte @pinia/testing v0.x
import { createTestingPinia } from '@pinia/testing'

const wrapper = mount(MemberList, {
  global: {
    plugins: [
      createTestingPinia({
        initialState: {
          invitation: {
            members: [
              { id: 'm1', name: 'Alice', role: 'admin' },
            ],
          },
        },
        stubActions: false,   // false = actions réelles (utile pour intégration)
      }),
    ],
  },
})
```

**Règle de décision :**
- Flux complet (formulaire → store → liste) → `createPinia()` réel + mocker l'API aux frontières.
- Tester un composant qui lit le store sans re-tester le flux de remplissage → `createTestingPinia` avec `initialState`.

### 2.4 Tester un flux multi-composants

Un flux multi-composants se teste en montant le **composant parent ou la page** qui inclut les enfants, plutôt que de monter chaque composant séparément. `mount()` (pas `shallowMount()`) rend l'arbre complet.

```ts
// InvitePage.vue contient <InviteForm> et <MemberList>
// On monte InvitePage — les deux enfants sont rendus réellement
const wrapper = mount(InvitePage, {
  global: { plugins: [createPinia()] },
})

// On interagit via le DOM (comme un utilisateur)
await wrapper.find('input[name="email"]').setValue('zara@tribuzen.app')
await wrapper.find('form').trigger('submit')
await flushPromises()   // attend que toutes les Promises (fetch, store) se résolvent

// On vérifie le résultat dans MemberList — toujours via le DOM
expect(wrapper.text()).toContain('Zara')
```

`flushPromises()` de `@vue/test-utils` vide la file des Promises en attente et déclenche le re-rendu de Vue. Indispensable dès qu'une action est asynchrone.

### 2.5 Doublures aux frontières

**Principe :** en intégration, on garde **tout le code applicatif réel** (composants, store, composables, router). On ne double que les **frontières externes** : HTTP, LocalStorage, IndexedDB, timers.

```
┌─────────────────────────────────────────────────────┐
│  Test d'intégration (tout réel)                     │
│  ┌──────────┐    ┌────────────────┐    ┌──────────┐ │
│  │InviteForm│ →  │invitationStore │ →  │MemberList│ │
│  └──────────┘    └────────────────┘    └──────────┘ │
│                          │                           │
└──────────────────────────┼───────────────────────────┘
                           ↓  ← frontière mockée ici
                    global.fetch = vi.fn()
```

Mocker `fetch` (ou `axios`) à la frontière HTTP est la seule doublure nécessaire. La logique du store, les computed, les watchers — tout reste réel.

```ts
// Doublure à la frontière HTTP uniquement
global.fetch = vi.fn()

// Pour chaque test, on programme la réponse attendue
vi.mocked(fetch).mockResolvedValueOnce({
  ok: true,
  json: () => Promise.resolve({ id: 'm99', name: 'Zara', role: 'member' }),
} as Response)
```

### 2.6 Pyramide des tests — le bon ratio

```
E2E          5% — flux de bout en bout critiques (connexion, paiement, onboarding)
Intégration 25% — flux utilisateur par page ou feature (invitation, CRUD membres...)
Unitaires   70% — fonctions pures, composables, composants simples
```

Un test d'intégration remplace **plusieurs tests unitaires croisés** qui ne garantissaient pas que les pièces fonctionnaient ensemble. Il ne remplace pas les tests unitaires des détails internes (cas limites, branches de logique).

---

## 3. Worked examples

### Exemple 1 — Flux d'invitation TribuZen (store réel + mocker fetch)

**Contexte :** `InvitePage.vue` contient `InviteForm` (formulaire email + rôle) et `MemberList` (liste des membres). Le store `invitationStore` gère l'état `members` et l'action `invite(email, role)`.

```ts
// __tests__/integration/invite-flow.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises }                  from '@vue/test-utils'
import { createPinia }                           from 'pinia'
import InvitePage                                from '@/views/InvitePage.vue'

// Doublure à la frontière HTTP — remplace le vrai fetch pour tous les tests du fichier
global.fetch = vi.fn()

describe('Flux invitation TribuZen', () => {

  beforeEach(() => {
    vi.clearAllMocks()   // remet les compteurs d'appels à zéro entre les tests
  })

  it('ajoute Zara à la liste des membres après soumission réussie', async () => {
    // 1. Préparer la réponse du serveur
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'm99', name: 'Zara', role: 'member' }),
    } as Response)

    // 2. Monter la page avec Pinia réelle (store exécutera sa vraie logique)
    const wrapper = mount(InvitePage, {
      global: { plugins: [createPinia()] },
    })

    // 3. Interagir comme un utilisateur
    await wrapper.find('input[name="email"]').setValue('zara@tribuzen.app')
    await wrapper.find('select[name="role"]').setValue('member')
    await wrapper.find('form').trigger('submit')

    // 4. Attendre la fin des Promises (fetch + mise à jour store + re-rendu Vue)
    await flushPromises()

    // 5. Vérifier le résultat dans MemberList — pas dans le store directement
    expect(wrapper.text()).toContain('Zara')           // le nom s'affiche
    expect(wrapper.find('input[name="email"]').element.value).toBe('')  // champ vidé
  })

  it("affiche un message d'erreur si le serveur rejette l'invitation", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 409,    // conflit — email déjà membre
      json: () => Promise.resolve({ message: 'Déjà membre' }),
    } as Response)

    const wrapper = mount(InvitePage, {
      global: { plugins: [createPinia()] },
    })

    await wrapper.find('input[name="email"]').setValue('alice@tribuzen.app')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    // L'erreur du store remonte et InviteForm l'affiche
    expect(wrapper.text()).toContain('Déjà membre')
    // MemberList n'a pas bougé — aucun nouveau membre
    expect(wrapper.findAll('[data-testid="member-item"]')).toHaveLength(0)
  })
})
```

**Ce que ce test garantit :**
- `InviteForm` soumet bien les données au store.
- `invitationStore.invite()` appelle bien `POST /api/invitations` avec les bons paramètres.
- `MemberList` réagit bien à la mutation du store et affiche le nouveau membre.
- En cas d'erreur, le message remonte jusqu'au formulaire et aucun membre fantôme n'est ajouté.

### Exemple 2 — Flux avec Vue Router (redirection après invitation)

```ts
// __tests__/integration/invite-redirect.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises }                  from '@vue/test-utils'
import { createPinia }                           from 'pinia'
import { createRouter, createMemoryHistory }     from 'vue-router'
import InvitePage                                from '@/views/InvitePage.vue'
import MembersPage                               from '@/views/MembersPage.vue'

global.fetch = vi.fn()

// Factory : crée un router de test avec les routes nécessaires
function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/invite',  name: 'invite',  component: InvitePage  },
      { path: '/members', name: 'members', component: MembersPage },
    ],
  })
}

describe('Redirection post-invitation', () => {

  beforeEach(() => vi.clearAllMocks())

  it('redirige vers /members après une invitation réussie', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'm99', name: 'Zara', role: 'member' }),
    } as Response)

    const router = createTestRouter()
    router.push('/invite')
    await router.isReady()

    const wrapper = mount(InvitePage, {
      global: { plugins: [createPinia(), router] },
    })

    await wrapper.find('input[name="email"]').setValue('zara@tribuzen.app')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    // Après succès, InvitePage appelle router.push('/members')
    expect(router.currentRoute.value.name).toBe('members')
  })
})
```

**Pattern factory router** : créer le router dans une fonction utilitaire évite de dupliquer la configuration dans chaque test. On peut l'étendre avec des paramètres (`initialRoute`, guards) selon les besoins.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Tout mocker = tester du vent

```ts
// ❌ Si on mocke le store, on ne teste plus l'intégration
const wrapper = mount(InvitePage, {
  global: {
    plugins: [
      createTestingPinia({ stubActions: true }),  // toutes les actions sont des no-ops
    ],
  },
})

await wrapper.find('form').trigger('submit')
await flushPromises()

// Ce test vérifie que InviteForm appelle l'action — mais l'action
// n'a rien fait. MemberList ne bougera jamais. Ce test unitaire
// déguisé ne garantit aucune intégration réelle.
```

**Règle :** en test d'intégration, `stubActions: false` (ou mieux, `createPinia()` réel). On ne mocke que la **frontière externe** (fetch), pas le code applicatif interne.

### PIÈGE #2 — Test trop large et fragile

```ts
// ❌ Tester l'intégralité de l'app dans un seul test
const wrapper = mount(App, { global: { plugins: [createPinia(), router] } })

// 30 assertions sur 5 features différentes...
expect(wrapper.text()).toContain('Login')
expect(router.currentRoute.value.name).toBe('home')
// ... 28 assertions de plus
```

Un test d'intégration trop large :
- Casse pour 10 raisons différentes → diagnostic impossible.
- Maintenu par personne car trop coûteux à faire évoluer.

**Règle :** un test d'intégration = un flux utilisateur identifiable. Le flux invitation est un test. Le flux connexion est un autre test. Pas de mélange.

### PIÈGE #3 — Confondre test d'intégration et test E2E

```
Test d'intégration (Vitest)   — Vrai navigateur ? NON (jsdom)
                              — Vrai serveur HTTP ? NON (fetch mocké)
                              — Vrai localStorage ? NON (jsdom simulé)
                              — Objectif : intégration code applicatif

Test E2E (Playwright)         — Vrai navigateur ? OUI (Chromium)
                              — Vrai serveur HTTP ? OUI (ou serveur de test)
                              — Objectif : flux complet utilisateur final
```

Les tests d'intégration Vitest tournent dans jsdom — un DOM simulé. Ils ne capturent pas les bugs de rendu spécifiques à Chrome/Firefox, les problèmes CSS ou les comportements de scroll. Ce sont des responsabilités E2E.

### PIÈGE #4 — Oublier `flushPromises` après une action async

```ts
// ❌ Le re-rendu Vue n'a pas encore eu lieu quand on assert
await wrapper.find('form').trigger('submit')
expect(wrapper.text()).toContain('Zara')  // false — fetch n'est pas résolu

// ✅ Attendre la résolution complète
await wrapper.find('form').trigger('submit')
await flushPromises()
expect(wrapper.text()).toContain('Zara')  // true
```

`trigger()` retourne une Promise résolue après le re-rendu **synchrone** de Vue. Les Promises imbriquées (fetch, actions Pinia async) nécessitent `flushPromises()`.

---

## 5. Ancrage TribuZen

Dans `smaurier/tribuzen`, les tests d'intégration couvrent les flux critiques du produit :

**Flux invitation** (ce module)

```
tribuzen/
  src/
    views/
      InvitePage.vue           ← composant parent monté dans le test
    components/
      members/
        InviteForm.vue         ← formulaire — rendu réellement via mount()
        MemberList.vue         ← liste — vérifie la mise à jour post-invitation
    stores/
      invitation.ts            ← store Pinia réel dans le test (pas stubbé)
  __tests__/
    integration/
      invite-flow.test.ts      ← tests de ce module
```

Ce test d'intégration remplace 3 tests croisés qui ne garantissaient pas que `MemberList` réagissait bien à la mutation du store déclenchée depuis `InviteForm`.

**Autres flux à couvrir en intégration TribuZen :**
- Flux connexion : `LoginForm` → `authStore.login()` → redirection vers `/dashboard`.
- Flux départ de membre : bouton dans `MemberList` → `memberStore.remove()` → la ligne disparaît.

Le signal pour écrire un test d'intégration : "plusieurs composants et le store sont impliqués, et le bug pourrait se cacher dans la coordination entre eux."

---

## 6. Points clés

1. Le test d'intégration vérifie que plusieurs parties fonctionnent **ensemble** — ni les détails internes (unitaire), ni le flux complet en vrai navigateur (E2E).
2. `global.plugins: [createPinia(), router]` branche le store et le router réels à l'instance de test.
3. `createPinia()` = store réel (actions s'exécutent) — préférer pour les tests d'intégration véritables.
4. `createTestingPinia({ initialState })` — utile pour pré-seeder l'état sans rejouer le flux de remplissage.
5. `flushPromises()` est indispensable après toute action asynchrone (fetch, action Pinia async) avant d'asserter.
6. Mocker uniquement aux **frontières externes** (HTTP, LocalStorage) — tout le code applicatif reste réel.
7. Un test d'intégration = un flux utilisateur identifiable — pas un test omnibus de toute l'app.
8. La pyramide 70/25/5 : les tests d'intégration complètent les tests unitaires, ils ne les remplacent pas.

---

## 7. Seeds Anki

```
Quelle est la différence entre test unitaire et test d'intégration en Vue ?|Le test unitaire isole une fonction ou un composant (dépendances mockées). Le test d'intégration monte plusieurs parties ensemble (composant + store Pinia + router) et ne mocke que les frontières externes (fetch).
Comment brancher Pinia et Vue Router dans un test @vue/test-utils ?|mount(Component, { global: { plugins: [createPinia(), router] } }) — createPinia() pour le store réel, createRouter({ history: createMemoryHistory() }) pour le router en mémoire.
Quand utiliser createTestingPinia vs createPinia en test d'intégration ?|createPinia() pour un vrai test d'intégration (actions s'exécutent réellement). createTestingPinia({ initialState }) pour pré-seeder l'état d'un store sans rejouer le flux de remplissage.
Pourquoi flushPromises() est-il nécessaire après trigger('submit') dans un test d'intégration ?|trigger() ne résout que le re-rendu Vue synchrone. Les Promises imbriquées (fetch, actions Pinia async, router navigation) nécessitent flushPromises() de @vue/test-utils pour se résoudre avant les assertions.
Quelles sont les frontières à mocker dans un test d'intégration Vue ?|Uniquement les frontières externes — global.fetch (HTTP), localStorage, IndexedDB, timers. Le store, les composables, les composants enfants restent réels.
Que se passe-t-il si on stubbe les actions Pinia dans un test d'intégration ?|stubActions: true remplace les actions par des no-ops — le store ne mute jamais. Le test vérifie que l'appel a eu lieu mais pas que MemberList réagit à la mutation. Ce n'est plus un test d'intégration réel.
Quelle est la règle de ratio de la pyramide des tests ?|70% unitaires (rapides, détails internes), 25% intégration (flux critiques composant+store+router), 5% E2E (vrai navigateur, vrai serveur). Plus on monte, plus le test est coûteux mais plus la confiance est élevée.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-18-tests-integration/README.md`. Tester le flux invitation TribuZen de bout en bout — `InviteForm` + `invitationStore` + `MemberList` — avec Vitest, `@vue/test-utils`, et un `fetch` mocké. Corrigé commenté intégral.
