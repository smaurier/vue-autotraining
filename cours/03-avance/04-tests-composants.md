# 04 — Tests de composants (Vue Test Utils)

## Monter un composant

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Counter from "@/components/Counter.vue";

describe("Counter", () => {
  it("affiche la valeur initiale", () => {
    const wrapper = mount(Counter);
    expect(wrapper.text()).toContain("0");
  });
});
```

## Passer des props

```ts
it("affiche le titre passe en prop", () => {
  const wrapper = mount(Counter, {
    props: {
      title: "Mon compteur",
      initialValue: 5,
    },
  });

  expect(wrapper.text()).toContain("Mon compteur");
  expect(wrapper.text()).toContain("5");
});
```

## Interagir avec le DOM

```ts
it("incremente au clic", async () => {
  const wrapper = mount(Counter);

  await wrapper.find("button.increment").trigger("click");

  expect(wrapper.text()).toContain("1");
});

it("desactive le bouton au max", async () => {
  const wrapper = mount(Counter, {
    props: { initialValue: 10, max: 10 },
  });

  const btn = wrapper.find("button.increment");
  expect(btn.attributes("disabled")).toBeDefined();
});
```

## Tester les emits

```ts
it("emet toggle-favorite avec l id", async () => {
  const wrapper = mount(ProductCard, {
    props: {
      product: { id: 42, name: "Clavier", price: 89, favorite: false },
    },
  });

  await wrapper.find("button").trigger("click");

  expect(wrapper.emitted("toggle-favorite")).toBeTruthy();
  expect(wrapper.emitted("toggle-favorite")![0]).toEqual([42]);
});
```

## Tester les formulaires

```ts
it("valide et soumet le formulaire", async () => {
  const wrapper = mount(ContactForm);

  // Remplir les champs
  await wrapper.find('input[name="name"]').setValue("Alice");
  await wrapper.find('input[name="email"]').setValue("alice@test.com");
  await wrapper.find("textarea").setValue("Un long message ici");

  // Soumettre
  await wrapper.find("form").trigger("submit");

  // Verifier l'emit
  expect(wrapper.emitted("submit")).toBeTruthy();
  expect(wrapper.emitted("submit")![0]).toEqual([
    {
      name: "Alice",
      email: "alice@test.com",
      message: "Un long message ici",
    },
  ]);
});

it("affiche les erreurs de validation", async () => {
  const wrapper = mount(ContactForm);

  await wrapper.find("form").trigger("submit");

  expect(wrapper.text()).toContain("requis");
});
```

## Tester avec des slots

```ts
it("rend le contenu du slot", () => {
  const wrapper = mount(Card, {
    slots: {
      default: "<p>Mon contenu</p>",
      header: "<h2>Titre</h2>",
    },
  });

  expect(wrapper.html()).toContain("Mon contenu");
  expect(wrapper.html()).toContain("Titre");
});
```

## Tester avec provide/inject

```ts
import { ref } from "vue";
import { ThemeKey } from "@/types";

it("utilise le theme injecte", () => {
  const wrapper = mount(ThemeButton, {
    global: {
      provide: {
        [ThemeKey as symbol]: ref("dark"),
      },
    },
  });

  expect(wrapper.classes()).toContain("theme-dark");
});
```

## Tester avec Pinia

```ts
import { setActivePinia, createPinia } from "pinia";

describe("avec Pinia", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("affiche les produits du store", () => {
    const store = useProductStore();
    store.items = [{ id: 1, name: "Clavier", price: 89 }];

    const wrapper = mount(ProductList);
    expect(wrapper.text()).toContain("Clavier");
  });
});
```

## Tester avec le router

```ts
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: "/", component: { template: "<div>Home</div>" } }],
});

it("navigue correctement", async () => {
  const wrapper = mount(NavBar, {
    global: {
      plugins: [router],
    },
  });

  await router.isReady();
  // ... tester la navigation
});
```

## Bonnes pratiques

1. **Teste le comportement, pas l'implementation** (pas de test sur `ref.value` interne)
2. **Un test = un comportement** (un seul `expect` logique par test)
3. **Nomme tes tests comme des specs** : "affiche un message d'erreur quand..."
4. **Évite les snapshots** sauf pour du HTML statique
5. **Préfère `find` par role/text** plutot que par selector CSS

## Exercice

→ `exercices/12-tests-complets/ENONCE.md`

## Suite

→ `cours/03-avance/05-tests-integration.md`
