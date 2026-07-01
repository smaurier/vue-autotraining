# Lab 18 — Tests d'intégration

> **Outcome :** à la fin, tu sais écrire un test d'intégration Vitest qui monte `InvitePage` avec Pinia réelle et un `fetch` mocké, et vérifie que le flux invitation (formulaire → store → liste) fonctionne de bout en bout.
> **Vrai outil :** Vitest 3 + @vue/test-utils 2 + Pinia — JAMAIS un harnais simulé.
> **Feedback :** le coach valide en session les assertions et la stratégie de mock.

---

## Énoncé

TribuZen dispose d'un module d'invitation membres. Trois fichiers sont déjà écrits :

- `src/views/InvitePage.vue` — page parente, contient `<InviteForm>` et `<MemberList>`.
- `src/components/members/InviteForm.vue` — formulaire email + rôle + bouton Inviter.
- `src/components/members/MemberList.vue` — liste réactive des membres du store.
- `src/stores/invitation.ts` — store Pinia avec `members: Member[]` et `invite(email, role)`.

**Ta mission :** écrire `__tests__/integration/invite-flow.test.ts` qui couvre deux scénarios :

1. **Invitation réussie** — après soumission du formulaire, le serveur répond `200`, `Zara` apparaît dans la liste et le champ email est vidé.
2. **Invitation échouée** — le serveur répond `409`, le message `'Déjà membre'` s'affiche et la liste ne change pas.

**Contrainte :** utiliser `createPinia()` réel (pas `createTestingPinia` avec `stubActions: true`). Mocker uniquement `global.fetch`.

### Starter minimal

```ts
// __tests__/integration/invite-flow.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises }                  from '@vue/test-utils'
import { createPinia }                           from 'pinia'
import InvitePage                                from '@/views/InvitePage.vue'

// À toi : remplacer global.fetch par vi.fn()

describe('Flux invitation TribuZen', () => {

  beforeEach(() => {
    // À toi : réinitialiser les mocks avant chaque test
  })

  it('ajoute le membre à la liste après invitation réussie', async () => {
    // À toi :
    // 1. Programmer la réponse fetch — { id: 'm99', name: 'Zara', role: 'member' }
    // 2. Monter InvitePage avec createPinia()
    // 3. Remplir input[name="email"] avec 'zara@tribuzen.app'
    // 4. Soumettre le formulaire
    // 5. flushPromises()
    // 6. Asserter : 'Zara' dans le texte, champ email vide
  })

  it("affiche une erreur si le serveur rejette l'invitation", async () => {
    // À toi :
    // 1. Programmer la réponse fetch — ok: false, status: 409, message: 'Déjà membre'
    // 2. Monter InvitePage
    // 3. Soumettre le formulaire
    // 4. flushPromises()
    // 5. Asserter : 'Déjà membre' dans le texte, aucun [data-testid="member-item"]
  })
})
```

---

## Étapes (en friction)

1. **Mock global.fetch** — assigner `global.fetch = vi.fn()` au niveau module, et `vi.clearAllMocks()` dans `beforeEach`. Comprendre pourquoi `clearAllMocks` et pas `resetAllMocks`.
2. **Programmer la réponse du scénario succès** — `vi.mocked(fetch).mockResolvedValueOnce(...)`. Construire l'objet qui simule une `Response` avec `.ok = true` et `.json()` qui retourne une Promise.
3. **Monter `InvitePage`** avec `global.plugins: [createPinia()]` — pas de `shallowMount`, on veut les vrais enfants.
4. **Interagir** — `.setValue()` sur l'input email, `.trigger('submit')` sur le formulaire. Repérer les sélecteurs exacts depuis le HTML de `InviteForm`.
5. **Attendre** — `await flushPromises()` après le trigger. Observer ce qui se passe si on oublie cette ligne (test rouge).
6. **Asserter le succès** — `wrapper.text()` contient le nom, l'input est vide.
7. **Scénario d'erreur** — programmer `ok: false, status: 409`, refaire les étapes 4-5, asserter le message d'erreur ET l'absence de nouveau membre dans la liste.
8. **Refactoring** — extraire le montage en une fonction `mountInvitePage()` locale pour DRY.

---

## Corrigé complet commenté

```ts
// __tests__/integration/invite-flow.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises }                  from '@vue/test-utils'
import { createPinia }                           from 'pinia'
import InvitePage                                from '@/views/InvitePage.vue'

// Remplace global.fetch par une fonction espion pour tout le fichier.
// On le fait ici (niveau module) pour que le remplacement soit actif
// dès le premier rendu de chaque test.
global.fetch = vi.fn()

// Fonction utilitaire — évite de dupliquer mount() dans chaque test.
// createPinia() crée un store neuf à chaque appel → isolation garantie.
function mountInvitePage() {
  return mount(InvitePage, {
    global: {
      plugins: [createPinia()],  // store Pinia réel — les actions s'exécutent vraiment
    },
  })
}

describe('Flux invitation TribuZen', () => {

  beforeEach(() => {
    // clearAllMocks remet à zéro les compteurs d'appels ET les valeurs programmées.
    // À ne pas confondre avec resetAllMocks (remet aussi l'implémentation à undefined)
    // ou restoreAllMocks (restaure les originaux — inutile ici, on a remplacé fetch).
    vi.clearAllMocks()
  })

  it('ajoute Zara à la liste après invitation réussie', async () => {
    // 1. Programmer la réponse du "serveur fictif"
    //    mockResolvedValueOnce = retourne cette valeur UNE fois, puis redevient vide.
    //    On caste en Response pour satisfaire le type de fetch sans construire l'objet complet.
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'm99', name: 'Zara', role: 'member' }),
    } as Response)

    // 2. Monter la page — mount() (pas shallowMount) rend InviteForm ET MemberList réellement
    const wrapper = mountInvitePage()

    // 3. Remplir le formulaire comme un utilisateur
    //    setValue() dispatche l'événement 'input' et met à jour le v-model
    await wrapper.find('input[name="email"]').setValue('zara@tribuzen.app')
    await wrapper.find('select[name="role"]').setValue('member')

    // 4. Soumettre — trigger('submit') dispatch l'événement 'submit' sur le <form>
    //    @submit.prevent dans InviteForm intercepte et appelle invitationStore.invite()
    await wrapper.find('form').trigger('submit')

    // 5. Attendre la résolution des Promises imbriquées
    //    Sans flushPromises() : fetch n'est pas encore résolu, le store n'a pas muté,
    //    Vue n'a pas re-rendu MemberList → les assertions ci-dessous seraient fausses.
    await flushPromises()

    // 6. Assertions sur le résultat — on inspecte le DOM, pas le store directement.
    //    Tester via le DOM simule ce que voit l'utilisateur.
    expect(wrapper.text()).toContain('Zara')
    //    L'input doit être vidé par InviteForm après soumission réussie
    expect(
      (wrapper.find('input[name="email"]').element as HTMLInputElement).value
    ).toBe('')

    // Bonus — vérifier que fetch a été appelé avec les bons paramètres
    expect(fetch).toHaveBeenCalledWith(
      '/api/invitations',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'zara@tribuzen.app', role: 'member' }),
      })
    )
  })

  it("affiche une erreur si le serveur rejette l'invitation (409)", async () => {
    // Le serveur indique que l'email est déjà membre
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ message: 'Déjà membre' }),
    } as Response)

    const wrapper = mountInvitePage()

    await wrapper.find('input[name="email"]').setValue('alice@tribuzen.app')
    await wrapper.find('select[name="role"]').setValue('member')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    // Le message d'erreur du store remonte jusqu'au template d'InviteForm
    expect(wrapper.text()).toContain('Déjà membre')

    // Aucun membre fantôme ajouté à MemberList
    expect(wrapper.findAll('[data-testid="member-item"]')).toHaveLength(0)

    // L'input n'est PAS vidé en cas d'erreur — l'utilisateur peut corriger
    expect(
      (wrapper.find('input[name="email"]').element as HTMLInputElement).value
    ).toBe('alice@tribuzen.app')
  })

  it('réinitialise le message erreur au second essai réussi', async () => {
    // Premier appel : erreur
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ message: 'Déjà membre' }),
    } as Response)

    const wrapper = mountInvitePage()

    await wrapper.find('input[name="email"]').setValue('alice@tribuzen.app')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('Déjà membre')

    // Second appel : succès — le message erreur doit disparaître
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'm100', name: 'Zara', role: 'member' }),
    } as Response)

    await wrapper.find('input[name="email"]').setValue('zara@tribuzen.app')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).not.toContain('Déjà membre')   // erreur effacée
    expect(wrapper.text()).toContain('Zara')              // membre ajouté
  })
})
```

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — sans ouvrir ce corrigé, en 30 minutes :**

1. Ajouter un test qui vérifie la **redirection vers `/members`** après invitation réussie — tu devras brancher `createRouter({ history: createMemoryHistory() })` en plus de Pinia.
2. Ajouter un test qui vérifie qu'un **deuxième appel** à `invite()` pendant qu'un premier est en attente est bloqué (bouton disabled) — inspecter l'attribut `disabled` du bouton pendant la Promesse pendante (hint: ne pas `await` `trigger('submit')` immédiatement).
3. Écrire une **factory** `function mountInvitePage(options?: { initialMembers?: Member[] })` qui accepte un état initial via `createTestingPinia({ initialState })`.

**Critère de réussite :** les trois tests passent en vert avec `vitest run` sans modifier `InvitePage.vue`.

---

## Application TribuZen

Dans `smaurier/tribuzen`, ces tests vivent ici :

```
tribuzen/
  __tests__/
    integration/
      invite-flow.test.ts   ← tests de ce lab
  src/
    views/
      InvitePage.vue
    components/
      members/
        InviteForm.vue
        MemberList.vue
    stores/
      invitation.ts
```

**Différences par rapport au lab :**

- `invitation.ts` utilisera une couche `api/invitations.ts` (wrapping de `fetch` avec gestion d'erreur centralisée) plutôt qu'un `fetch` brut — le mock `global.fetch` reste valable car on mocke au plus bas niveau.
- `MemberList` recevra ses membres depuis le store `invitationStore` via `storeToRefs()` — le test d'intégration garantit que ce binding fonctionne sans avoir à tester `storeToRefs` séparément.

**Commit cible :**

```
test(integration): flux invitation — form + store + list, fetch mocké
```
