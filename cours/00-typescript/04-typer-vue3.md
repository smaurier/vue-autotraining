# 04 — Typer Vue 3 (ref, props, emits, slots)

> **Pour les débutants :** Ce chapitre explique comment typer les concepts principaux de Vue 3. Si vous ne connaissez pas encore Vue, ces concepts peuvent sembler étranges, mais c'est normal !

## Qu'est-ce que Vue 3 ? (rappel rapide)

Vue 3 est un framework JavaScript pour créer des interfaces utilisateur. Il utilise des **composants** (comme des morceaux d'interface réutilisables) et de la **réactivité** (quand une donnée change, l'interface se met à jour automatiquement).

## 1. Typer `ref` - La réactivité simple

### Qu'est-ce que `ref` ?

`ref` est la façon la plus simple de créer une **donnée réactive** dans Vue 3. "Réactive" signifie que si vous changez cette donnée, Vue va automatiquement mettre à jour l'interface utilisateur.

```ts
import { ref } from "vue";

// ❌ Variable normale JavaScript (pas réactive)
let count = 0;
count = 5; // L'interface ne se met PAS à jour

// ✅ Variable réactive Vue (se met à jour automatiquement)
const count = ref(0); // Ref<number>
count.value = 5; // L'interface SE MET À JOUR !
```

### Comment TypeScript comprend `ref`

```ts
import { ref } from "vue";

// TypeScript devine automatiquement le type
const count = ref(0); // Il comprend : Ref<number>
const name = ref("Alice"); // Il comprend : Ref<string>
const isVisible = ref(true); // Il comprend : Ref<boolean>

// Mais parfois il faut l'aider...
const user = ref(null); // Il comprend : Ref<null> ❌ Pas assez précis !

// Solution : dire explicitement ce qu'on veut
const user = ref<User | null>(null); // Ref<User | null> ✅
const items = ref<Product[]>([]); // Ref<Product[]> ✅
```

**Pourquoi `.value` ?** Dans Vue 3, pour accéder/modifier une ref, on utilise `.value` :

```ts
const count = ref(0);
console.log(count.value); // 0
count.value = 10; // Modification
```

### Règle simple pour `ref`

**Annotez `ref` seulement si la valeur initiale ne suffit pas à TypeScript pour comprendre le type final.**

## 2. Typer `reactive` - Pour les objets complexes

### Qu'est-ce que `reactive` ?

`reactive` est utilisé pour rendre des **objets entiers** réactifs. Contrairement à `ref`, pas besoin de `.value`.

```ts
import { reactive } from "vue";

// Objet classique JavaScript (pas réactif)
const user = { name: "Alice", age: 25 };
user.age = 26; // L'interface ne se met PAS à jour

// Objet réactif Vue
const user = reactive({ name: "Alice", age: 25 });
user.age = 26; // L'interface SE MET À JOUR !
```

### Typage avec `reactive`

```ts
import { reactive } from "vue";

// Définir d'abord la structure qu'on veut
interface FormState {
  name: string;           // Obligatoire
  email: string;          // Obligatoire  
  age: number | null;     // Peut être nombre ou null
}

// Créer l'objet réactif avec cette structure
const form = reactive<FormState>({
  name: "",      // String vide pour commencer
  email: "",     // String vide pour commencer
  age: null,     // null pour commencer (pas encore rempli)
});

// Usage
form.name = "Alice";     // ✅ string
form.age = 30;           // ✅ number
form.age = null;         // ✅ null aussi
// form.age = "30";      // ❌ string refusé !
```

## 3. Typer `computed` - Les données calculées

### Qu'est-ce que `computed` ?

`computed` crée une **valeur calculée** qui se met à jour automatiquement quand ses dépendances changent. C'est comme une formule Excel !

```ts
import { computed, ref } from "vue";

const firstName = ref("Jean");
const lastName = ref("Dupont");

// computed se recalcule automatiquement si firstName ou lastName change
const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`;
});

console.log(fullName.value); // "Jean Dupont"
firstName.value = "Marie";
console.log(fullName.value); // "Marie Dupont" (mis à jour automatiquement !)
```

### Typage avec `computed`

```ts
import { computed, ref } from "vue";

const count = ref(0);

// TypeScript devine automatiquement : ComputedRef<number>
const double = computed(() => count.value * 2);

// Parfois il faut l'aider pour des types complexes
const started = ref(false);
const pending = ref(false);

const status = computed<"idle" | "loading" | "done">(() => {
  if (!started.value) return "idle";      // Pas encore commencé
  if (pending.value) return "loading";    // En cours
  return "done";                          // Terminé
});
```

## 4. Typer `watch` - Observer les changements

### Qu'est-ce que `watch` ?

`watch` permet d'exécuter du code quand une valeur change. C'est comme dire "surveille cette variable et préviens-moi quand elle change".

```ts
import { watch, ref } from "vue";

const count = ref(0);

// Surveiller count et réagir aux changements
watch(count, (newValue, oldValue) => {
  console.log(`Changement : ${oldValue} → ${newValue}`);
});

count.value = 5; // Console affichera : "Changement : 0 → 5"
```

### Typage avec `watch`

```ts
import { watch, ref } from "vue";

const count = ref(0);
const name = ref("Alice");

// TypeScript devine les types automatiquement
watch(count, (newVal, oldVal) => {
  // newVal et oldVal sont automatiquement typés comme number
  console.log(`${oldVal} → ${newVal}`);
});

// Surveiller plusieurs variables à la fois
watch([count, name], ([newCount, newName], [oldCount, oldName]) => {
  // newCount: number, newName: string (tipos automatiquement)
  console.log(`Count: ${oldCount} → ${newCount}`);
  console.log(`Name: ${oldName} → ${newName}`);
});
```

## 5. Typer les `props` - Recevoir des données

### Qu'est-ce que les props ?

Les **props** (propriétés) permettent à un composant parent de passer des données à un composant enfant. C'est comme des paramètres de fonction, mais pour les composants.

```vue
<!-- Composant parent -->
<template>
  <UserCard 
    title="Profil utilisateur" 
    :count="5" 
    :items="products"
    variant="primary" 
  />
</template>

<!-- Composant UserCard reçoit ces props -->
```

### Typer les props

```vue
<script setup lang="ts">
// Définir explicitement quelles props on accepte et leurs types
const props = defineProps<{
  title: string;                           // Obligatoire : texte
  count: number;                          // Obligatoire : nombre
  items: Product[];                       // Obligatoire : tableau de Product
  variant?: "primary" | "secondary";     // Optionnel : soit "primary" soit "secondary"
}>();

// Usage dans le composant
console.log(props.title);    // string
console.log(props.count);    // number
console.log(props.variant);  // "primary" | "secondary" | undefined
</script>
```

### Props avec valeurs par défaut

```vue
<script setup lang="ts">
// 1. Définir l'interface des props
interface Props {
  title: string;
  count?: number;                        // Optionnel
  variant?: "primary" | "secondary";    // Optionnel
}

// 2. Définir les props avec valeurs par défaut
const props = withDefaults(defineProps<Props>(), {
  count: 0,           // Si count n'est pas fourni, utiliser 0
  variant: "primary", // Si variant n'est pas fourni, utiliser "primary"
});
</script>
```

## 6. Typer les `emits` - Envoyer des événements

### Qu'est-ce que les emits ?

Les **emits** permettent à un composant enfant d'envoyer des informations vers son parent. C'est l'inverse des props : enfant → parent.

```vue
<!-- Composant enfant -->
<script setup lang="ts">
const emit = defineEmits<{
  (event: "update", id: number): void;      // Événement "update" avec un id (number)
  (event: "delete", id: number): void;      // Événement "delete" avec un id (number)
  (event: "search", query: string): void;   // Événement "search" avec une query (string)
}>();

// Envoyer un événement vers le parent
function handleClick() {
  emit("update", 42);     // ✅ Correct
  // emit("update", "42"); // ❌ Erreur : string au lieu de number
  // emit("unknown", 1);   // ❌ Erreur : événement inexistant
}
</script>

<!-- Composant parent qui écoute -->
<template>
  <MonComposant 
    @update="handleUpdate"   
    @delete="handleDelete"
    @search="handleSearch"
  />
</template>
```

### Nouvelle syntaxe (Vue 3.3+)

```vue
<script setup lang="ts">
// Syntaxe plus courte et plus claire
const emit = defineEmits<{
  update: [id: number];           // [paramètres] au lieu de (event: ..., ...): void
  delete: [id: number];
  search: [query: string];
}>();
</script>
```

## 7. Typer les `slots` - Contenu personnalisable

### Qu'est-ce que les slots ?

Les **slots** permettent au composant parent de passer du **contenu HTML/composants** à l'enfant. C'est comme des "trous" qu'on peut remplir.

```vue
<!-- Composant enfant avec slots -->
<template>
  <div class="card">
    <header>
      <slot name="header" :title="cardTitle"></slot>
    </header>
    
    <main>
      <slot :item="product" :index="0"></slot>  <!-- slot par défaut -->
    </main>
    
    <footer>
      <slot name="empty" v-if="!product"></slot>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Typer ce que chaque slot reçoit comme données
defineSlots<{
  default(props: { item: Product; index: number }): any;  // Slot principal
  header(props: { title: string }): any;                  // Slot header
  empty(): any;                                           // Slot vide (pas de données)
}>();
</script>
```

## 8. Typer `provide/inject` - Partager des données

### Qu'est-ce que provide/inject ?

`provide/inject` permet de partager des données entre un composant parent et n'importe quel composant descendant, même très profond. C'est comme des "variables globales" mais limitées à une partie de l'application.

```ts
// types.ts - Définir les "clés" typées
import type { InjectionKey, Ref } from "vue";

export const ThemeKey: InjectionKey<Ref<"light" | "dark">> = Symbol("theme");
export const ApiClientKey: InjectionKey<ApiClient> = Symbol("api");
```

```ts
// Composant parent : provide (fournir)
import { provide, ref } from "vue";
import { ThemeKey } from "./types";

const theme = ref<"light" | "dark">("light");
provide(ThemeKey, theme); // Fournir le thème à tous les descendants
```

```ts
// Composant enfant (n'importe où dans l'arbre) : inject (injecter)
import { inject } from "vue";
import { ThemeKey } from "./types";

const theme = inject(ThemeKey); // Ref<'light' | 'dark'> | undefined

// Vérification de sécurité
if (!theme) {
  throw new Error("ThemeKey not provided");
}

// Maintenant on peut utiliser theme en sécurité
console.log(theme.value); // "light" ou "dark"
```

## 9. Typer les template refs - Accéder aux éléments DOM

### Qu'est-ce qu'une template ref ?

Une **template ref** permet d'accéder directement à un élément HTML ou un composant depuis le JavaScript. C'est comme `document.getElementById()` mais en mieux.

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";

// Créer une référence vers un élément HTML input
const inputRef = ref<HTMLInputElement | null>(null);

// Quand le composant est monté (affiché), focus sur l'input
onMounted(() => {
  inputRef.value?.focus(); // Le ? évite l'erreur si l'élément n'existe pas
});
</script>

<template>
  <!-- Lier l'input à notre référence -->
  <input ref="inputRef" type="text" placeholder="Tapez ici..." />
</template>
```

### Différents types d'éléments

```vue
<script setup lang="ts">
const buttonRef = ref<HTMLButtonElement | null>(null);
const divRef = ref<HTMLDivElement | null>(null);
const imgRef = ref<HTMLImageElement | null>(null);

// Pour un composant Vue
const childComponentRef = ref<InstanceType<typeof ChildComponent> | null>(null);
</script>

<template>
  <button ref="buttonRef">Click me</button>
  <div ref="divRef">Some content</div>
  <img ref="imgRef" src="image.jpg" alt="Image" />
  <ChildComponent ref="childComponentRef" />
</template>
```

## Résumé : Quand annoter les types ?

| Situation                 | Annoter ?                  | Pourquoi ?                    |
| ------------------------- | -------------------------- | ----------------------------- |
| `ref(0)`, `ref('hello')`  | Non                       | TypeScript devine tout seul   |
| `ref<User \| null>(null)` | Oui                       | Valeur initiale pas assez précise |
| Props                     | Toujours                  | Sécurité et documentation     |
| Emits                     | Toujours                  | Éviter les erreurs d'événements |
| Computed simple           | Non                       | TypeScript devine bien        |
| Computed complexe (union) | Parfois                   | Pour des types précis         |
| Provide/Inject            | Toujours                  | Éviter les erreurs de typage  |
| Template refs             | Toujours                  | Accès sécurisé au DOM         |

## Ce qu'il faut retenir

1. **Vue 3 + TypeScript** : La plupart du temps, TypeScript devine automatiquement les types
2. **ref vs reactive** : `ref` pour valeurs simples, `reactive` pour objets
3. **Props/Emits** : Toujours typer pour la sécurité
4. **Le `.value`** : Avec `ref`, toujours utiliser `.value` pour accéder/modifier
5. **Type safety** : TypeScript vous protège des erreurs courantes

## Suite

→ `cours/01-debutant/01-environnement-et-premier-composant.md`
