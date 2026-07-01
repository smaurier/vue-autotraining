---
titre: Tests de composants (Vue Test Utils)
cours: 02-vue
notions: [mount et shallowMount, trouver des éléments find findAll findComponent, tester le rendu, simuler des événements trigger, tester props et emits, tester les slots, tester l'asynchrone dans un composant, global.stubs et global.mocks, RouterLinkStub, unmount, Testing Library vue en survol]
outcomes:
  - sait monter un composant et vérifier son rendu avec Vue Test Utils
  - sait simuler une interaction utilisateur (clic, saisie) et vérifier l'effet
  - sait tester les props reçues et les événements émis
  - sait tester le comportement observable plutôt que l'implémentation
prerequis: [16-tests-unitaires]
next: 18-tests-integration
libs: [{ name: vue, version: "3.5" }, { name: "@vue/test-utils", version: "2" }, { name: vitest, version: "3" }]
tribuzen: composants TribuZen — tester FamilyCard (props famille, émission select au clic) avec Vue Test Utils
last-reviewed: 2026-07
---

# Tests de composants (Vue Test Utils)

> **Outcomes — tu sauras FAIRE :** monter un composant Vue avec Vue Test Utils et vérifier son rendu, simuler un clic ou une saisie et vérifier l'effet, tester les props reçues et les événements émis par un composant.
> **Difficulté :** :star::star::star:
>
> **Portée :** ce module couvre le test d'un composant Vue **isolé** — monter, inspecter, interagir, vérifier les emits et les slots. Les tests impliquant plusieurs composants en interaction, le routing et Pinia dans un user flow sont au **module 18**.
>
> **Prérequis :** module 16 — Vitest, `describe`/`it`/`expect`, `vi.fn()`. Ce module s'appuie directement sur cet outillage.

← Précédent : `16-tests-unitaires`

---

## 1. Cas concret d'abord

Tu rejoins TribuZen et tu trouves ce composant `FamilyCard.vue` dans la PR en cours :

```vue
<!-- src/components/family/FamilyCard.vue -->
<script setup lang="ts">
interface Family {
  id: string
  name: string
  memberCount: number
}

const props = defineProps<{ family: Family }>()
const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <div class="family-card">
    <h2 class="family-card__name">{{ family.name }}</h2>
    <p class="family-card__count">{{ family.memberCount }} membre(s)</p>
    <button class="family-card__btn" @click="emit('select', family.id)">
      Sélectionner
    </button>
  </div>
</template>
```

Le collègue qui a ouvert la PR n'a pas écrit de test. Avant de merger, tu dois vérifier **deux comportements** :

1. Quand on passe `{ id: 'f1', name: 'Les Martin', memberCount: 4 }` en prop, le composant affiche bien `"Les Martin"` et `"4"`.
2. Quand l'utilisateur clique sur **Sélectionner**, le composant émet l'événement `select` avec l'id `"f1"`.

Sans Vue Test Utils, vérifier ça manuellement dans le navigateur est long et non reproductible. Avec Vue Test Utils, c'est trois lignes par comportement, rejouables en < 100 ms.

```ts
// src/components/family/__tests__/FamilyCard.spec.ts — aperçu (détail section 3)
import { mount } from '@vue/test-utils'
import FamilyCard from '../FamilyCard.vue'

const famille = { id: 'f1', name: 'Les Martin', memberCount: 4 }

it('affiche le nom de la famille', () => {
  const wrapper = mount(FamilyCard, { props: { family: famille } })
  expect(wrapper.text()).toContain('Les Martin')
})

it('émet select avec l\'id au clic', async () => {
  const wrapper = mount(FamilyCard, { props: { family: famille } })
  await wrapper.find('button').trigger('click')
  expect(wrapper.emitted('select')![0]).toEqual(['f1'])
})
```

Ce module t'explique chaque brique de ce code.

---

## 2. Théorie complète, concise

### 2.1 Monter un composant — `mount` vs `shallowMount`

`mount` **crée le composant en mémoire** (pas de navigateur réel) et rend son arbre entier — composant racine **et** tous ses composants enfants.

`shallowMount` fait la même chose mais **remplace automatiquement les composants enfants par des stubs** (balises vides `<child-stub>`). C'est un alias de `mount(Component, { shallow: true })`.

```ts
import { mount, shallowMount } from '@vue/test-utils'
import FamilyPage from '@/components/family/FamilyPage.vue'

// mount : FamilyPage + FamilyCard + Button sont tous rendus réellement
const wrapper = mount(FamilyPage)

// shallowMount : FamilyPage est rendu, FamilyCard et Button sont des stubs
const shallow = shallowMount(FamilyPage)
// shallow.html() → <family-card-stub></family-card-stub>
```

Les deux retournent un **VueWrapper** — l'objet central qui expose tous les outils d'inspection et d'interaction.

**Règle de choix :**

| Situation | Monter avec |
|---|---|
| Tester un composant feuille (pas d'enfants Vue) | `mount` |
| Tester un composant parent, en isolant ses enfants | `shallowMount` |
| Tester l'intégration composant + enfants réels | `mount` |

> **Attention :** `shallowMount` est tentant pour la "vitesse", mais si le comportement que tu testes dépend d'un enfant réel (slot, événement remonté), les stubs cassent le test. Privilégier `mount` par défaut et `shallowMount` seulement quand les enfants sont des dépendances lourdes à isoler.

### 2.2 Trouver des éléments — `find`, `findComponent`, `get`

**`wrapper.find(selector)`** cible un **élément HTML** par sélecteur CSS. Retourne un DOMWrapper (vide si introuvable — ne lève pas d'erreur).

```ts
const btn = wrapper.find('button')             // premier <button>
const card = wrapper.find('.family-card')      // classe CSS
const input = wrapper.find('[data-test="q"]')  // attribut data-test (recommandé)
```

**`wrapper.findComponent(query)`** cible un **composant Vue** enfant. Supporte plusieurs formes de query :

```ts
import FamilyCard from '@/components/family/FamilyCard.vue'

wrapper.findComponent(FamilyCard)              // par référence au module importé (le plus sûr)
wrapper.findComponent({ name: 'FamilyCard' }) // par nom du composant
wrapper.findComponent({ ref: 'card' })        // par ref template <FamilyCard ref="card" />
wrapper.findComponent('.family-card')         // par sélecteur CSS (fragile — déconseillé)
```

**`wrapper.get(selector)`** est identique à `find` mais **lève une erreur immédiatement** si l'élément est introuvable, ce qui donne un message d'échec plus explicite qu'un `undefined` silencieux.

```ts
// ✅ Préférer get quand l'élément doit exister (sinon le test doit échouer)
const btn = wrapper.get('button')          // erreur claire si absent
const card = wrapper.findComponent(FamilyCard) // findComponent n'a pas d'équivalent get
```

**`wrapper.findAll(selector)`** retourne un **tableau de DOMWrapper** pour tous les éléments correspondant au sélecteur. Utile pour vérifier le nombre d'éléments et itérer sur leur contenu :

```ts
// Vérifier que FamilyList rend autant de cartes que de familles passées en prop
const cards = wrapper.findAll('.family-card')
expect(cards).toHaveLength(3)
expect(cards[0].text()).toContain('Les Martin')
expect(cards[2].text()).toContain('Les Dupont')

// findAll retourne un tableau vide si aucun élément — jamais undefined
const nonExistent = wrapper.findAll('.inexistant')
expect(nonExistent).toHaveLength(0)
```

### 2.3 Tester le rendu — inspecter le DOM et le contenu

Une fois le composant monté, plusieurs méthodes permettent d'inspecter ce qu'il rend :

```ts
wrapper.text()            // tout le texte visible (concaténé, sans balises)
wrapper.html()            // le HTML complet du composant (avec balises)
wrapper.classes()         // tableau des classes CSS de l'élément racine
wrapper.attributes('disabled')  // valeur d'un attribut HTML (undefined si absent)
wrapper.props()           // objet contenant toutes les props actuelles du composant
wrapper.props('family')   // valeur d'une prop précise
```

Exemples concrets :

```ts
const wrapper = mount(FamilyCard, { props: { family: famille } })

// wrapper.text() — vérifier le texte visible sans se soucier du HTML
expect(wrapper.text()).toContain('Les Martin')     // ✅
expect(wrapper.text()).toContain('4 membre(s)')    // ✅

// wrapper.html() — vérifier la structure HTML exacte (plus fragile)
expect(wrapper.html()).toContain('<h2 class="family-card__name">')

// wrapper.find() + .text() — cibler un élément précis
expect(wrapper.find('h2').text()).toBe('Les Martin')

// wrapper.classes() — vérifier les classes CSS du nœud racine
expect(wrapper.classes()).toContain('family-card')

// wrapper.attributes() — vérifier l'état d'un bouton désactivé
const btnWrapper = wrapper.find('button')
expect(btnWrapper.attributes('disabled')).toBeUndefined() // bouton actif
```

### 2.4 Simuler des événements — `trigger` et `setValue`

**`trigger(eventName)`** déclenche un événement DOM sur l'élément. Retourne une `Promise<void>` — **toujours `await`** pour que Vue mette à jour le DOM avant l'assertion.

```ts
await wrapper.find('button').trigger('click')
await wrapper.find('input').trigger('keyup.enter')
await wrapper.find('form').trigger('submit')
```

**`setValue(value)`** est le raccourci pour les champs de formulaire : il positionne `element.value`, déclenche les événements `input` et `change`, et retourne une `Promise<void>`.

```ts
const input = wrapper.find('input[type="text"]')
await input.setValue('Famille Martin')
// Équivalent à : input.element.value = 'Famille Martin' + trigger('input') + trigger('change')
```

Pour `<select>` et `<input type="checkbox">`, `setValue` fonctionne de la même façon.

### 2.5 Tester les props reçues

On passe les props dans l'option `props` au montage :

```ts
const wrapper = mount(FamilyCard, {
  props: {
    family: { id: 'f1', name: 'Les Martin', memberCount: 4 },
  },
})
```

On peut aussi mettre à jour les props après le montage avec `setProps()` (asynchrone) :

```ts
await wrapper.setProps({ family: { id: 'f2', name: 'Les Dupont', memberCount: 2 } })
// Vue met à jour le rendu — on peut ensuite asserter le nouveau rendu
expect(wrapper.find('h2').text()).toBe('Les Dupont')
```

`wrapper.props()` retourne les props **actuelles** du composant — utile pour vérifier ce que le composant a réellement reçu :

```ts
expect(wrapper.props('family').name).toBe('Les Martin')
```

### 2.6 Tester les événements émis — `emitted()`

`wrapper.emitted()` retourne un objet dont chaque clé est un nom d'événement et chaque valeur est un **tableau de tableaux** (un tableau par émission, chaque émission contenant ses arguments) :

```ts
// Structure de wrapper.emitted() :
// { 'select': [ ['f1'] ], 'hover': [ [], [] ] }
//              ^---------  première émission de 'select' avec arg 'f1'
//                                    ^--  deux émissions de 'hover' sans args

await wrapper.find('button').trigger('click')

// Vérifier que l'événement a été émis au moins une fois
expect(wrapper.emitted('select')).toBeTruthy()

// Vérifier le nombre d'émissions
expect(wrapper.emitted('select')).toHaveLength(1)

// Vérifier les arguments de la première émission
expect(wrapper.emitted('select')![0]).toEqual(['f1'])
// Le [0] = première émission ; [0] contient le tableau des arguments

// Le "!" est une assertion TypeScript : "select" n'est pas undefined ici
```

### 2.7 Tester les slots

On passe le contenu des slots dans l'option `slots` au montage. Chaque slot accepte une string HTML, un objet composant, ou un render function :

```ts
// Composant Card.vue avec <slot name="header"> et <slot> (default)
const wrapper = mount(Card, {
  slots: {
    default: '<p>Contenu principal</p>',
    header: '<h3>Titre de la carte</h3>',
  },
})

expect(wrapper.html()).toContain('Contenu principal')
expect(wrapper.html()).toContain('Titre de la carte')
```

Pour des slots avec contenu Vue (composants imbriqués), passer un render function :

```ts
import { h } from 'vue'
import FamilyCard from '@/components/family/FamilyCard.vue'

const wrapper = mount(FamilyList, {
  slots: {
    // Slot qui reçoit un composant Vue réel
    item: h(FamilyCard, { family: famille }),
  },
})
```

### 2.8 Tester l'asynchrone dans un composant

Un composant peut avoir des mises à jour de DOM asynchrones (après un clic, après une requête réseau). Deux outils pour gérer ça :

**`await trigger()` / `await setValue()`** — suffisant pour les mises à jour réactives simples (un clic qui toggle un `ref`). Ces méthodes attendent automatiquement le prochain `nextTick` de Vue.

**`await nextTick()`** (importé de `'vue'`) — forcer l'attente d'un tick de réactivité manuellement :

```ts
import { nextTick } from 'vue'

wrapper.find('button').trigger('click')  // sans await intentionnel ici
await nextTick()                         // attendre la mise à jour DOM
expect(wrapper.text()).toContain('1')
```

**`await flushPromises()`** (importé de `'@vue/test-utils'`) — attend que **toutes les promesses en attente** se résolvent. Indispensable quand le composant fait un `fetch` ou un appel API dans un `onMounted` ou après un clic :

```ts
import { flushPromises, mount } from '@vue/test-utils'
import { vi } from 'vitest'

// Mock du fetch
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve([{ id: 'f1', name: 'Les Martin', memberCount: 4 }]),
}))

const wrapper = mount(FamilyList)

// Le composant lance un fetch dans onMounted — on attend qu'il se termine
await flushPromises()

expect(wrapper.text()).toContain('Les Martin')
```

> **Ordre de priorité :** `await trigger()` en premier. Si ça ne suffit pas, `await flushPromises()`. `nextTick()` manuellement est rare — réservé aux cas où on veut un contrôle fin tick par tick.

### 2.9 Testing Library vue — survol

`@testing-library/vue` est une **couche d'abstraction au-dessus de Vue Test Utils** qui encourage à tester par le comportement utilisateur plutôt que par les sélecteurs CSS. Elle expose des requêtes sémantiques (`getByRole`, `getByText`, `getByLabelText`) qui correspondent à ce que l'utilisateur voit et perçoit.

```ts
// Avec @testing-library/vue
import { render, screen, fireEvent } from '@testing-library/vue'

render(FamilyCard, { props: { family: famille } })

expect(screen.getByText('Les Martin')).toBeTruthy()
await fireEvent.click(screen.getByRole('button', { name: /sélectionner/i }))
```

**Différences par rapport à Vue Test Utils pur :**

| | Vue Test Utils | Testing Library vue |
|---|---|---|
| Sélection | Sélecteurs CSS, refs | Rôles ARIA, texte, label |
| Philosophie | Accès total au wrapper | "Tester comme un utilisateur" |
| Cas d'usage | Tests bas niveau + emits | Tests user-centric |
| Dépendance | Directe | Wrapper sur Vue Test Utils |

Pour les tests de composants TribuZen de ce module, Vue Test Utils direct est suffisant et plus transparent. Testing Library vaut la peine si le projet adopte une approche "Behaviour Driven Testing" cohérente. Les deux peuvent coexister dans le même projet en ciblant des cas différents.

### 2.10 `global.stubs`, `global.mocks`, `RouterLinkStub` et `unmount`

**`global.stubs`** — remplace des composants enfants par des stubs légers. Essentiel quand le composant utilise `<RouterLink>` ou un composant lourd qui n'a pas besoin d'être rendu réellement. Vue Test Utils exporte `RouterLinkStub` — un stub minimal qui simule `<RouterLink>` sans router réel :

```ts
import { mount, RouterLinkStub } from '@vue/test-utils'
import FamilyCard from '../FamilyCard.vue'

it('affiche un lien vers la page famille', () => {
  const wrapper = mount(FamilyCard, {
    props: { family: famille },
    global: {
      stubs: {
        RouterLink: RouterLinkStub,   // RouterLink stubé, pas de createRouter() nécessaire
      },
    },
  })

  const link = wrapper.findComponent(RouterLinkStub)
  // Vérifier la prop :to sans naviguer réellement
  expect(link.props().to).toEqual({ name: 'family', params: { familyId: 'f1' } })
})
```

Syntaxe alternative avec tableau (stub par nom) :

```ts
global: {
  stubs: ['RouterLink', 'BaseIcon'],   // remplacés par <router-link-stub>, <base-icon-stub>
}
```

**`global.mocks`** — injecte des propriétés globales (`$t`, `$route`, `$store`) dans tous les composants montés. Utile pour mocker des injectables globaux sans charger le vrai plugin :

```ts
const wrapper = mount(FamilyCard, {
  global: {
    mocks: {
      $t: (key: string) => key,   // i18n — retourne la clé au lieu de la traduction
    },
  },
})
```

**`wrapper.unmount()`** — démonte explicitement le composant et déclenche `onUnmounted()`. Utile dans les tests impliquant des timers ou des subscriptions pour éviter les fuites entre tests :

```ts
const wrapper = mount(FamilyCard, { props: { family: famille } })

// ... test ...

wrapper.unmount()   // déclenche onUnmounted() — libère les event listeners et timers
```

> **Note sur le mocking réseau :** `global.fetch = vi.fn()` suffit pour des tests de composants simples. Pour partager des handlers entre plusieurs tests et entre Vitest et Playwright, la bonne approche est MSW — couvert au **module 20**.

---

## 3. Worked examples

### Exemple 1 — Tester le rendu de FamilyCard (props)

On teste que `FamilyCard` affiche correctement les données reçues en props.

```ts
// src/components/family/__tests__/FamilyCard.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FamilyCard from '../FamilyCard.vue'

// Donnée de test partagée entre les tests du describe
const famille = { id: 'f1', name: 'Les Martin', memberCount: 4 }

describe('FamilyCard — rendu', () => {
  it('affiche le nom de la famille', () => {
    // On monte le composant avec la prop family
    const wrapper = mount(FamilyCard, {
      props: { family: famille },
    })

    // wrapper.text() retourne tout le texte visible — pas de sélecteur nécessaire
    // pour une vérification basique du contenu
    expect(wrapper.text()).toContain('Les Martin')
  })

  it('affiche le nombre de membres', () => {
    const wrapper = mount(FamilyCard, {
      props: { family: famille },
    })

    // Cibler l'élément précis pour une assertion plus robuste
    // get() lève une erreur claire si .family-card__count est absent
    expect(wrapper.get('.family-card__count').text()).toBe('4 membre(s)')
  })

  it('affiche un bouton Sélectionner', () => {
    const wrapper = mount(FamilyCard, {
      props: { family: famille },
    })

    // Vérifier la présence et le texte du bouton
    const btn = wrapper.get('button')
    expect(btn.text()).toBe('Sélectionner')
    // Vérifier que le bouton n'est PAS désactivé (attribut disabled absent)
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('met à jour l\'affichage quand la prop change', async () => {
    const wrapper = mount(FamilyCard, {
      props: { family: famille },
    })

    // setProps() est async — Vue met à jour le DOM avant de résoudre
    await wrapper.setProps({
      family: { id: 'f2', name: 'Les Dupont', memberCount: 2 },
    })

    expect(wrapper.get('h2').text()).toBe('Les Dupont')
    expect(wrapper.text()).toContain('2 membre(s)')
  })
})
```

**Ce que ces tests vérifient :**
- Comportement observable (texte affiché), pas l'implémentation interne.
- `get()` plutôt que `find()` pour les éléments qui doivent exister — l'erreur est plus claire.
- `setProps()` couvre le cas dynamique : la prop change après montage.

### Exemple 2 — Tester l'émission d'événement (emit select au clic)

On vérifie que `FamilyCard` émet `select` avec le bon `id` quand l'utilisateur clique.

```ts
describe('FamilyCard — émission d\'événements', () => {
  it('émet l\'événement select avec l\'id de la famille au clic', async () => {
    const wrapper = mount(FamilyCard, {
      props: { family: famille },
    })

    // trigger() est async : Vue traite le clic et met à jour le DOM
    await wrapper.find('button').trigger('click')

    // wrapper.emitted('select') retourne un tableau ou undefined
    // Structure : [ ['f1'] ] — tableau des émissions, chaque émission est un tableau d'args
    expect(wrapper.emitted('select')).toBeTruthy()          // l'événement a été émis
    expect(wrapper.emitted('select')).toHaveLength(1)       // une seule fois
    expect(wrapper.emitted('select')![0]).toEqual(['f1'])   // avec l'id 'f1'
  })

  it('émet select à chaque clic (pas de déduplication)', async () => {
    const wrapper = mount(FamilyCard, {
      props: { family: famille },
    })

    // Deux clics successifs
    await wrapper.find('button').trigger('click')
    await wrapper.find('button').trigger('click')

    // Deux émissions distinctes dans le tableau
    expect(wrapper.emitted('select')).toHaveLength(2)
  })

  it('n\'émet pas select avant le clic', () => {
    const wrapper = mount(FamilyCard, {
      props: { family: famille },
    })

    // Sans trigger, emitted('select') doit être undefined
    expect(wrapper.emitted('select')).toBeUndefined()
  })
})
```

**Lecture de `emitted()` :**

```
wrapper.emitted('select')         → [ ['f1'], ['f1'] ]  (2 clics)
                          [0]     → ['f1']               (1ère émission)
                          [0][0]  → 'f1'                 (1er argument de la 1ère émission)
```

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Tester l'implémentation interne, pas le comportement

```ts
// ❌ Tester le nom d'une variable interne ou une propriété data privée
// Vue Test Utils expose vm pour accéder à l'instance — c'est une tentation
expect((wrapper.vm as any).isSelected).toBe(true)

// Pourquoi c'est faux : si tu renommes la variable interne en "selected",
// le test casse MÊME SI le composant fonctionne toujours correctement.

// ✅ Tester l'effet observable : est-ce que la classe CSS est appliquée ?
expect(wrapper.classes()).toContain('family-card--selected')
// Ou est-ce que le bon texte s'affiche ?
expect(wrapper.text()).toContain('Famille sélectionnée')
```

**Règle :** si tu utilises `wrapper.vm` pour lire un état interne, demande-toi d'abord si l'utilisateur peut observer cet état. Si non, teste l'effet visible (classe CSS, texte, aria-attribute, événement émis).

### PIÈGE #2 — Oublier `await` sur `trigger()` et `setValue()`

```ts
// ❌ Sans await : le test lit le DOM AVANT que Vue ait mis à jour
it('incrémente', () => {
  const wrapper = mount(Counter)
  wrapper.find('button').trigger('click')      // oubli de await
  expect(wrapper.text()).toContain('1')         // ÉCHOUE : DOM pas encore mis à jour
})

// ✅ Avec await : Vue traite le clic et met à jour le DOM avant l'assertion
it('incrémente', async () => {
  const wrapper = mount(Counter)
  await wrapper.find('button').trigger('click')
  expect(wrapper.text()).toContain('1')         // ✅
})
```

De même pour `setValue()` et `setProps()` — toujours `async/await` dans le test.

Si le composant fait un appel asynchrone (fetch, setTimeout) après le trigger, `await trigger()` ne suffit pas — utiliser `await flushPromises()` après.

### PIÈGE #3 — Utiliser `shallowMount` quand le comportement dépend d'un enfant réel

```ts
// ❌ FamilyList rend FamilyCard — on veut tester que les cartes s'affichent
const wrapper = shallowMount(FamilyList, {
  props: { families: [famille] },
})
// shallowMount remplace FamilyCard par <family-card-stub>
// wrapper.text() ne contiendra JAMAIS 'Les Martin' — le texte vient de FamilyCard réel
expect(wrapper.text()).toContain('Les Martin') // ÉCHOUE

// ✅ Utiliser mount pour que FamilyCard soit rendu réellement
const wrapper = mount(FamilyList, {
  props: { families: [famille] },
})
expect(wrapper.text()).toContain('Les Martin') // ✅
```

`shallowMount` est utile quand on teste **seulement le comportement de FamilyList elle-même** (sa logique de filtre, ses propres émissions) et qu'on veut isoler les enfants coûteux. Si le test doit vérifier ce que FamilyCard affiche, il faut `mount` complet.

---

## 5. Ancrage TribuZen

Dans TribuZen, `FamilyCard.vue` est le composant central de l'interface famille — la carte qui affiche le nom d'une famille, son nombre de membres, et permet de la sélectionner. Deux comportements critiques à couvrir :

**Test 1 — props et rendu :** quand l'API renvoie `{ id: 'f1', name: 'Les Martin', memberCount: 4 }`, la carte doit afficher ces données. Ce test protège contre une régression où une refactorisation renomme `family.name` en `family.label` dans le template sans mettre à jour les autres fichiers.

**Test 2 — émission de l'événement `select` :** quand l'utilisateur clique sur la carte, le parent `FamilyPage.vue` doit recevoir l'id pour naviguer vers la page détail. Ce test garantit que le "pont" entre FamilyCard et son parent fonctionne quand le composant évolue.

Fichiers cibles dans `smaurier/tribuzen` :

```
tribuzen/
  src/
    components/
      family/
        FamilyCard.vue
        __tests__/
          FamilyCard.spec.ts    ← tests de ce module
```

Les tests de `FamilyPage.vue` (plusieurs FamilyCard, routing, Pinia) relèvent du module 18. Dans ce module, on reste sur le test unitaire de `FamilyCard` seul.

---

## 6. Points clés

1. `mount(Component, options)` crée le composant en mémoire et retourne un VueWrapper — point d'entrée de tous les tests Vue Test Utils.
2. `shallowMount` remplace les composants enfants par des stubs — utile pour isoler, mais inutilisable si le test dépend du rendu d'un enfant.
3. `find(selector)` cible un élément HTML (retourne vide si absent) ; `get(selector)` lève une erreur claire (préférable quand l'élément doit exister).
4. `findComponent(query)` cible un composant Vue enfant — préférer la référence directe au module importé (`findComponent(FamilyCard)`) plutôt qu'un sélecteur CSS.
5. `trigger('click')` et `setValue('...')` retournent une `Promise<void>` — **toujours `await`** avant d'asserter.
6. `wrapper.emitted('select')` retourne `undefined` si jamais émis, ou un tableau de tableaux d'arguments sinon — structure `[args_émission_0, args_émission_1, ...]`.
7. `flushPromises()` de `@vue/test-utils` est nécessaire quand le composant fait des appels asynchrones (fetch, setTimeout) après une interaction.
8. Tester le comportement observable (texte, classes, événements) — jamais l'état interne via `wrapper.vm`.
9. `wrapper.findAll(selector)` retourne un tableau de DOMWrapper — utiliser `.toHaveLength(n)` pour vérifier le nombre d'éléments rendus.
10. `global.stubs: { RouterLink: RouterLinkStub }` stub `<RouterLink>` pour tester un composant avec des liens sans charger Vue Router complet.
11. `global.mocks: { $t: key => key }` injecte des propriétés globales sans monter les vrais plugins (utile pour vue-i18n).
12. `wrapper.unmount()` déclenche `onUnmounted()` et libère les event listeners — à appeler dans les tests impliquant des timers ou des subscriptions.

---

## 7. Seeds Anki

```
Quelle est la différence entre mount et shallowMount dans Vue Test Utils ?|mount rend le composant et TOUS ses enfants réels. shallowMount remplace les composants enfants par des stubs vides. Utiliser mount par défaut, shallowMount seulement pour isoler des enfants coûteux.
Comment vérifier qu'un composant Vue a émis un événement 'select' avec l'id 'f1' ?|await wrapper.find('button').trigger('click') puis expect(wrapper.emitted('select')![0]).toEqual(['f1']). Structure : emitted('select') = tableau d'émissions, [0] = 1ère émission, contient les arguments.
Quelle est la différence entre find() et get() dans Vue Test Utils ?|find() retourne un wrapper vide si l'élément est absent (le test peut continuer). get() lève une erreur immédiate si l'élément est absent — message d'échec plus clair. Préférer get() quand l'élément doit exister.
Pourquoi doit-on await wrapper.find('button').trigger('click') ?|trigger() retourne une Promise<void> — Vue met à jour le DOM de façon asynchrone après un événement. Sans await, l'assertion lit le DOM avant la mise à jour et le test échoue de façon aléatoire.
Quand utiliser flushPromises() plutôt que await trigger() ?|Quand le composant déclenche une opération asynchrone (fetch, setTimeout, store action) après l'interaction. await trigger() attend seulement le prochain tick Vue. flushPromises() attend que toutes les promesses en file soient résolues.
Comment passer des props à un composant dans Vue Test Utils ?|mount(Component, { props: { propName: valeur } }). Mettre à jour après montage avec await wrapper.setProps({ propName: nouvelleValeur }).
Comment tester le contenu d'un slot dans Vue Test Utils ?|mount(Component, { slots: { default: '<p>Contenu</p>', header: '<h3>Titre</h3>' } }) puis wrapper.html() ou wrapper.text() pour asserter le rendu du slot.
Que retourne wrapper.emitted('monEvent') si l'événement n'a jamais été émis ?|undefined. Toujours vérifier .toBeTruthy() avant d'accéder aux émissions pour éviter un TypeError. Pattern : expect(wrapper.emitted('select')).toBeTruthy() puis expect(wrapper.emitted('select')![0]).toEqual([args]).
Comment stubber RouterLink dans un test de composant sans charger Vue Router ?|import { mount, RouterLinkStub } from '@vue/test-utils' puis mount(Component, { global: { stubs: { RouterLink: RouterLinkStub } } }). RouterLinkStub est un composant minimal exporté par @vue/test-utils qui simule RouterLink sans router réel. Vérifier la prop :to avec wrapper.findComponent(RouterLinkStub).props().to.
Que retourne wrapper.findAll() si aucun élément ne correspond au sélecteur ?|Un tableau vide ([]) — jamais undefined. Contrairement à find() qui retourne un DOMWrapper vide, findAll() retourne toujours un tableau, ce qui permet d'utiliser .toHaveLength(0) directement.
```

---

## Pont vers le lab

> Lab associé : `02-vue/labs/lab-17-tests-composants/README.md`. Écriture complète des tests de `FamilyCard.vue` avec Vue Test Utils — rendu, emits, cas limite — avec `vitest --run` comme oracle. Corrigé commenté intégral.
>
> **Note réseau :** pour les composants qui appellent une API, ce module utilise `vi.spyOn(global, 'fetch')` ou `vi.stubGlobal('fetch', vi.fn())`. La bonne approche pour partager les mocks réseau entre plusieurs tests est MSW (`setupServer`) — couvert au **module 20**.
