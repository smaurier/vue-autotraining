# 04 — Tests de composants (Vue Test Utils)

## C'est quoi un test de composant ?

Dans le chapitre précédent, on a testé des **fonctions** (comme `clamp` ou `formatPrice`). Maintenant, on va tester des **composants Vue** — c'est-à-dire les blocs visuels de notre application (boutons, formulaires, cartes...).

> **Analogie** : Tester une fonction, c'est comme tester un moteur sur un banc d'essai. Tester un composant, c'est comme tester le tableau de bord complet : on vérifie que les boutons fonctionnent, que les textes s'affichent, que les interactions marchent.

### Qu'est-ce qu'on vérifie dans un test de composant ?

- **L'affichage** : est-ce que le bon texte apparaît ?
- **Les interactions** : est-ce que cliquer sur un bouton fait la bonne chose ?
- **Les props** : est-ce que le composant affiche correctement les données qu'on lui passe ?
- **Les événements (emits)** : est-ce que le composant envoie les bons signaux au composant parent ?

---

## 📦 Rappel : c'est quoi une assertion ?

Une **assertion** c'est une affirmation qu'on vérifie dans un test. C'est le `expect(...).toBe(...)` qu'on a vu au chapitre précédent.

```ts
// Ceci est une assertion :
expect(2 + 2).toBe(4)         // "J'affirme que 2+2 vaut 4"

// Dans un test de composant :
expect(wrapper.text()).toContain("Bonjour")  // "J'affirme que le composant affiche 'Bonjour'"
```

---

## L'outil : Vue Test Utils

**Vue Test Utils** est la bibliothèque officielle pour tester les composants Vue. Elle permet de :
- **Monter** un composant (le créer en mémoire sans ouvrir un navigateur)
- **Inspecter** son contenu (lire le texte, trouver des éléments)
- **Interagir** avec lui (cliquer, remplir des champs)
- **Vérifier** les événements qu'il émet

---

## Monter un composant : `mount`

Pour tester un composant, il faut d'abord le **monter** — c'est-à-dire le créer en mémoire comme si le navigateur l'affichait.

```ts
import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"     // mount = "monter" un composant
import Counter from "@/components/Counter.vue"  // Le composant à tester

describe("Counter", () => {

  it("affiche la valeur initiale 0", () => {
    // mount() crée le composant en mémoire
    // "wrapper" est un objet qui entoure le composant et nous donne des outils
    const wrapper = mount(Counter)

    // wrapper.text() retourne TOUT le texte visible du composant
    // toContain vérifie qu'il contient "0" quelque part
    expect(wrapper.text()).toContain("0")
  })
})
```

> **Analogie** : `mount()` c'est comme mettre un composant sur une table d'examen. Le `wrapper` c'est la loupe qui te permet de l'inspecter sous tous les angles.

### `mount` vs `shallowMount`

Il existe deux façons de monter un composant :

| Méthode | Ce qu'elle fait | Quand l'utiliser |
|---------|----------------|------------------|
| `mount` | Monte le composant **et tous ses enfants** | Pour tester le composant comme un utilisateur le verrait |
| `shallowMount` | Monte le composant mais **remplace les enfants par des faux** (stubs) | Pour tester un composant isolé, sans se soucier de ses enfants |

```ts
import { mount, shallowMount } from "@vue/test-utils"

// mount : ProductPage + ProductCard + Button sont tous rendus
const full = mount(ProductPage)

// shallowMount : ProductPage est rendu, mais ProductCard et Button
// sont remplacés par des balises vides <product-card-stub>
const shallow = shallowMount(ProductPage)
```

> **Analogie** : `mount` c'est tester une voiture complète. `shallowMount` c'est tester la carrosserie avec des faux pneus et un faux moteur — on se concentre uniquement sur la carrosserie.

---

## Passer des props au composant

Les **props** sont les données qu'un composant parent envoie à un composant enfant. On peut les passer lors du montage :

```ts
it("affiche le titre passé en prop", () => {
  const wrapper = mount(Counter, {
    props: {                          // On passe les props ici
      title: "Mon compteur",          // Le composant reçoit title = "Mon compteur"
      initialValue: 5,                // Et initialValue = 5
    },
  })

  // On vérifie que le texte affiché contient bien nos props
  expect(wrapper.text()).toContain("Mon compteur")  // ✅ Le titre est affiché
  expect(wrapper.text()).toContain("5")             // ✅ La valeur 5 est affichée
})
```

---

## Interagir avec le composant : cliquer, remplir...

Les tests de composants ne se limitent pas à vérifier l'affichage. On peut **simuler des actions utilisateur** :

### Cliquer sur un bouton

```ts
it("incrémente le compteur quand on clique sur +", async () => {
  const wrapper = mount(Counter)

  // wrapper.find() cherche un élément dans le composant (comme querySelector en JS)
  // "button.increment" = un bouton avec la classe CSS "increment"
  // trigger("click") simule un clic de souris
  await wrapper.find("button.increment").trigger("click")
  // ⚠️ On utilise "await" car les mises à jour du DOM sont asynchrones en Vue

  // Après le clic, le compteur devrait afficher "1"
  expect(wrapper.text()).toContain("1")
})
```

### Vérifier qu'un bouton est désactivé

```ts
it("désactive le bouton + quand on atteint le maximum", async () => {
  const wrapper = mount(Counter, {
    props: { initialValue: 10, max: 10 },  // Déjà au maximum
  })

  // On cherche le bouton
  const bouton = wrapper.find("button.increment")

  // .attributes("disabled") vérifie si l'attribut HTML "disabled" existe
  expect(bouton.attributes("disabled")).toBeDefined()  // ✅ Le bouton est désactivé
})
```

---

## Tester les événements émis (emits)

En Vue, un composant enfant communique avec son parent via des **événements** (`emit`). On peut vérifier quels événements ont été émis :

```ts
it("émet l'événement toggle-favorite avec l'id du produit", async () => {
  const wrapper = mount(ProductCard, {
    props: {
      product: {
        id: 42,                  // L'id du produit
        name: "Clavier",
        price: 89,
        favorite: false
      },
    },
  })

  // On simule un clic sur le bouton favori
  await wrapper.find("button").trigger("click")

  // wrapper.emitted() retourne un objet avec TOUS les événements émis
  // wrapper.emitted("toggle-favorite") retourne un tableau des émissions de cet événement
  expect(wrapper.emitted("toggle-favorite")).toBeTruthy()  // ✅ L'événement a été émis

  // Le [0] = la première émission, et toEqual([42]) vérifie que l'id 42 a été envoyé
  expect(wrapper.emitted("toggle-favorite")![0]).toEqual([42])  // ✅ Avec l'id 42
  // Le "!" après emitted("toggle-favorite") dit à TypeScript "je suis sûr que c'est pas null"
})
```

---

## Tester les formulaires

Les formulaires sont un cas très courant. On peut remplir les champs et soumettre :

```ts
it("valide et soumet le formulaire correctement", async () => {
  const wrapper = mount(ContactForm)

  // setValue() simule la saisie dans un champ de formulaire
  // On cible les champs par leur attribut "name"
  await wrapper.find('input[name="name"]').setValue("Alice")
  await wrapper.find('input[name="email"]').setValue("alice@test.com")
  await wrapper.find("textarea").setValue("Un long message ici")

  // trigger("submit") simule la soumission du formulaire
  await wrapper.find("form").trigger("submit")

  // On vérifie que l'événement "submit" a été émis avec les bonnes données
  expect(wrapper.emitted("submit")).toBeTruthy()
  expect(wrapper.emitted("submit")![0]).toEqual([
    {
      name: "Alice",
      email: "alice@test.com",
      message: "Un long message ici",
    },
  ])
})

it("affiche les erreurs quand on soumet un formulaire vide", async () => {
  const wrapper = mount(ContactForm)

  // On soumet sans remplir les champs
  await wrapper.find("form").trigger("submit")

  // Le composant devrait afficher un message d'erreur
  expect(wrapper.text()).toContain("requis")  // ✅ "Ce champ est requis" par exemple
})
```

---

## Tester avec des slots

Les **slots** sont des "trous" dans un composant où le parent peut injecter du contenu HTML.

```ts
it("affiche le contenu passé dans les slots", () => {
  const wrapper = mount(Card, {
    slots: {
      // Le slot "default" = le contenu principal
      default: "<p>Mon contenu</p>",
      // Le slot "header" = l'en-tête
      header: "<h2>Titre de la carte</h2>",
    },
  })

  // wrapper.html() retourne le HTML complet du composant
  expect(wrapper.html()).toContain("Mon contenu")       // ✅ Le contenu est là
  expect(wrapper.html()).toContain("Titre de la carte") // ✅ Le titre aussi
})
```

---

## Tester avec provide/inject

`provide/inject` permet de passer des données à travers plusieurs niveaux de composants (sans passer par les props). Voici comment les simuler en test :

```ts
import { ref } from "vue"

it("utilise le thème injecté pour appliquer la bonne classe CSS", () => {
  const wrapper = mount(ThemeButton, {
    global: {
      provide: {
        // On simule l'injection d'un thème "dark"
        // Le composant ThemeButton utilise inject() pour lire cette valeur
        theme: ref("dark"),
      },
    },
  })

  // wrapper.classes() retourne la liste des classes CSS du composant
  expect(wrapper.classes()).toContain("theme-dark")  // ✅ La classe CSS correspond au thème
})
```

---

## Tester avec Pinia (le store)

Si ton composant utilise un **store Pinia** (un endroit centralisé pour stocker des données), il faut créer un store de test :

```ts
import { setActivePinia, createPinia } from "pinia"

describe("avec Pinia", () => {

  // beforeEach = "avant chaque test, fais ça"
  // On crée un store Pinia neuf pour chaque test (pour éviter que les tests se polluent entre eux)
  beforeEach(() => {
    setActivePinia(createPinia())  // Crée et active un nouveau store vide
  })

  it("affiche les produits qui sont dans le store", () => {
    // On récupère le store et on y met des données
    const store = useProductStore()
    store.items = [{ id: 1, name: "Clavier", price: 89 }]

    // On monte le composant — il va lire les données du store
    const wrapper = mount(ProductList)

    // Le composant devrait afficher "Clavier" car c'est dans le store
    expect(wrapper.text()).toContain("Clavier")  // ✅
  })
})
```

---

## Tester avec Vue Router

Si ton composant utilise le **router** (système de navigation entre pages), il faut en créer un pour les tests :

```ts
import { createRouter, createWebHistory } from "vue-router"

// On crée un faux router avec une route de test
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: { template: "<div>Accueil</div>" } }
  ],
})

it("affiche la barre de navigation avec les bons liens", async () => {
  const wrapper = mount(NavBar, {
    global: {
      plugins: [router],    // On "branche" le router au composant
    },
  })

  await router.isReady()    // On attend que le router soit initialisé
  // Maintenant on peut tester la navigation...
})
```

---

## Bonnes pratiques (les règles d'or des tests de composants)

1. **Teste le comportement, pas l'implémentation** — Vérifie ce que l'utilisateur *voit* et *fait*, pas les détails internes du code
2. **Un test = un comportement** — Chaque test vérifie une seule chose (ex : "le bouton est désactivé quand...")
3. **Nomme tes tests comme des phrases** — "affiche un message d'erreur quand le formulaire est vide"
4. **Évite les snapshots** — Sauf pour du HTML qui ne change jamais
5. **Cherche les éléments par leur rôle ou texte** — Plutôt que par des sélecteurs CSS fragiles

---

## Résumé

| Concept | C'est quoi ? |
|---------|-------------|
| `mount(Comp)` | Crée le composant en mémoire pour le tester |
| `shallowMount(Comp)` | Pareil mais remplace les composants enfants par des faux |
| `wrapper.text()` | Lit tout le texte visible du composant |
| `wrapper.find(selector)` | Trouve un élément HTML dans le composant |
| `.trigger("click")` | Simule un clic (ou autre événement) |
| `.setValue("...")` | Simule la saisie dans un champ |
| `wrapper.emitted()` | Vérifie les événements émis par le composant |

---

## 🎯 Pratique

### Exercice TC.1 — Monter un composant

Écris un test pour vérifier que ce composant affiche bien le message :

```vue
<!-- HelloWorld.vue -->
<script setup lang="ts">
defineProps<{ msg: string }>()
</script>

<template>
  <h1>{{ msg }}</h1>
</template>
```

```ts
// __tests__/HelloWorld.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HelloWorld from '../HelloWorld.vue'

describe('HelloWorld', () => {
  it('affiche le message passé en prop', () => {
    // Monte le composant avec msg="Hello Vue"
    // ???

    // Vérifie que le texte contient "Hello Vue"
    // ???
  })
})
```

<details>
<summary>Solution</summary>

```ts
describe('HelloWorld', () => {
  it('affiche le message passé en prop', () => {
    const wrapper = mount(HelloWorld, {
      props: { msg: 'Hello Vue' }
    })

    expect(wrapper.text()).toContain('Hello Vue')
  })
})
```
</details>

---

### Exercice TC.2 — Simuler un clic

Écris un test pour ce composant compteur :

```vue
<!-- Counter.vue -->
<script setup lang="ts">
import { ref } from 'vue'
const count = ref(0)
</script>

<template>
  <p data-test="count">{{ count }}</p>
  <button data-test="increment" @click="count++">+1</button>
</template>
```

```ts
describe('Counter', () => {
  it('incrémente le compteur au clic', async () => {
    // Monte le composant
    // ???

    // Vérifie que count = 0 au début
    // ???

    // Clique sur le bouton
    // ???

    // Vérifie que count = 1
    // ???
  })
})
```

<details>
<summary>Solution</summary>

```ts
describe('Counter', () => {
  it('incrémente le compteur au clic', async () => {
    const wrapper = mount(Counter)

    expect(wrapper.find('[data-test="count"]').text()).toBe('0')

    await wrapper.find('[data-test="increment"]').trigger('click')

    expect(wrapper.find('[data-test="count"]').text()).toBe('1')
  })
})
```
</details>

---

### Exercice TC.3 — Tester les emits

Écris un test pour vérifier que ce composant émet un événement :

```vue
<!-- SearchInput.vue -->
<script setup lang="ts">
const emit = defineEmits<{ search: [query: string] }>()
</script>

<template>
  <input @keyup.enter="emit('search', ($event.target as HTMLInputElement).value)" />
</template>
```

```ts
describe('SearchInput', () => {
  it('émet "search" avec la valeur quand on appuie sur Entrée', async () => {
    // ???
  })
})
```

<details>
<summary>Solution</summary>

```ts
describe('SearchInput', () => {
  it('émet "search" avec la valeur quand on appuie sur Entrée', async () => {
    const wrapper = mount(SearchInput)

    const input = wrapper.find('input')
    await input.setValue('vue 3')
    await input.trigger('keyup.enter')

    expect(wrapper.emitted('search')).toBeTruthy()
    expect(wrapper.emitted('search')![0]).toEqual(['vue 3'])
  })
})
```
</details>

---

### Exercice TC.4 — Tester avec un store

Complète ce test qui utilise un store Pinia :

```vue
<!-- CartTotal.vue -->
<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
const cart = useCartStore()
</script>

<template>
  <p>Total : {{ cart.total }} €</p>
</template>
```

```ts
import { setActivePinia, createPinia } from 'pinia'

describe('CartTotal', () => {
  beforeEach(() => {
    // Crée une nouvelle instance Pinia pour chaque test
    // ???
  })

  it('affiche le total du panier', () => {
    // Configure le store avec des items
    // ???

    const wrapper = mount(CartTotal)
    expect(wrapper.text()).toContain('30') // 10 * 2 + 5 * 2 = 30
  })
})
```

<details>
<summary>Solution</summary>

```ts
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '@/stores/cart'

describe('CartTotal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('affiche le total du panier', () => {
    const cart = useCartStore()
    cart.items = [
      { id: 1, name: 'Item 1', price: 10, quantity: 2 },
      { id: 2, name: 'Item 2', price: 5, quantity: 2 }
    ]

    const wrapper = mount(CartTotal)
    expect(wrapper.text()).toContain('30')
  })
})
```
</details>

---

## Exercice

→ `exercices/12-tests-complets/ENONCE.md`

## Suite

→ `cours/03-avance/05-tests-integration.md`
