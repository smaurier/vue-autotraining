# 03 — Reactivite (ref, reactive, computed)

## Le concept cle

La reactivite, c'est : **quand les donnees changent, l'UI se met a jour automatiquement.**

Vue 3 utilise des Proxy JavaScript pour tracker les acces et modifications.

## `ref` — valeur reactive simple

```ts
import { ref } from "vue";

const count = ref<number>(0);

// Pour lire ou modifier : .value
count.value++;
console.log(count.value); // 1
```

**Dans `<template>`, `.value` est implicite :**

```vue
<template>
  <p>{{ count }}</p>
  <!-- pas count.value -->
</template>
```

### Quand utiliser `ref` ?

- Primitifs : `string`, `number`, `boolean`
- References a des objets qu'on veut pouvoir reassigner (`ref<User | null>(null)`)

## `reactive` — objet reactif

```ts
import { reactive } from "vue";

interface FormData {
  name: string;
  email: string;
}

const form = reactive<FormData>({
  name: "",
  email: "",
});

// Pas de .value !
form.name = "Alice";
```

### Quand utiliser `reactive` ?

- Objets / formulaires que tu ne reassignes jamais
- État groupe logiquement

### Piege de `reactive` ⚠️

```ts
const state = reactive({ count: 0 });

// ❌ Perd la reactivite ! (nouvelle reference)
state = reactive({ count: 1 });

// ❌ Perd la reactivite ! (destructuring)
const { count } = state;
count++; // ne declenche rien

// ✅ Correct
state.count = 1;
```

**Règle du parcours : préfère `ref` dans 90% des cas. Utilise `reactive` seulement pour des formulaires.**

## `computed` — valeur derivee

Un `computed` recalcule automatiquement quand ses dépendances changent.

```ts
import { ref, computed } from "vue";

const price = ref<number>(100);
const quantity = ref<number>(3);

const total = computed<number>(() => price.value * quantity.value);
// total.value = 300
// Si price ou quantity change → total se recalcule
```

### Computed vs méthode

```ts
// Computed : mise en cache, recalcule seulement si dependances changent
const fullName = computed(() => `${firstName.value} ${lastName.value}`);

// Methode : executee a chaque render
function getFullName(): string {
  return `${firstName.value} ${lastName.value}`;
}
```

**Utilise `computed` quand tu derives une valeur. Utilise une méthode quand tu fais une action.**

### Computed writable (rare)

```ts
const fullName = computed({
  get: () => `${firstName.value} ${lastName.value}`,
  set: (val: string) => {
    const [first, last] = val.split(" ");
    firstName.value = first;
    lastName.value = last;
  },
});
```

## `shallowRef` — reactivite superficielle

Pour les gros objets ou tu veux controller quand la reactivite se declenche :

```ts
import { shallowRef, triggerRef } from "vue";

const bigList = shallowRef<Item[]>([]);

// ❌ Ne declenche pas de re-render (mutation profonde)
bigList.value.push(newItem);

// ✅ Reassignation = declenche
bigList.value = [...bigList.value, newItem];

// ✅ Ou force manuellement
bigList.value.push(newItem);
triggerRef(bigList);
```

## `toRef` / `toRefs` — garder la reactivite

```ts
import { reactive, toRef, toRefs } from "vue";

const state = reactive({ name: "Alice", age: 30 });

// Extraire UNE ref reactive
const nameRef = toRef(state, "name");
nameRef.value = "Bob"; // modifie aussi state.name

// Extraire TOUTES les refs
const { name, age } = toRefs(state);
name.value = "Charlie"; // modifie aussi state.name
```

Utile pour passer des proprietes reactives a des composables.

## Recapitulatif

| API            | Usage                            | `.value` ?    |
| -------------- | -------------------------------- | ------------- |
| `ref`          | Primitifs, valeurs reassignables | Oui           |
| `reactive`     | Objets groupes (formulaires)     | Non           |
| `computed`     | Valeur derivee cachee            | Oui (lecture) |
| `shallowRef`   | Gros objets, controle fin        | Oui           |
| `toRef/toRefs` | Extraire refs d'un reactive      | Oui           |

## Suite

→ `cours/01-debutant/04-evenements-et-v-model.md`
