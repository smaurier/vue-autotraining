# 05 — Composants, props et emits

---

## L'analogie LEGO 🧱

Imagine que tu construis une maison en LEGO :

- Tu as des **briques** de différentes formes (porte, fenêtre, mur, toit)
- Chaque brique est **réutilisable** : tu peux mettre 10 fenêtres identiques
- Tu peux **combiner** les briques pour créer quelque chose de plus grand
- Si tu veux changer la couleur d'une fenêtre, tu changes **juste cette brique**, pas toute la maison

En Vue, les **composants** sont tes briques LEGO. Chaque composant est un fichier `.vue` qui contient un morceau d'interface (un bouton, une carte utilisateur, un menu, un formulaire...).

---

## Pourquoi découper en composants ?

| Avantage          | Explication                                                        |
| ----------------- | ------------------------------------------------------------------ |
| **Réutilisation** | Un composant `UserCard` peut être utilisé 50 fois dans ton app     |
| **Lisibilité**    | Chaque fichier a un seul rôle → plus facile à lire                 |
| **Testabilité**   | On peut tester chaque composant séparément                         |
| **Maintenabilité**| Modifier un composant ne casse pas le reste de l'application       |

---

## 🧠 Rappel JavaScript : import / export

Avant de créer des composants, il faut comprendre comment JavaScript partage du code entre fichiers.

### Exporter → rendre quelque chose disponible depuis un fichier

```js
// fichier : mathUtils.js

// 'export' = "je rends cette fonction disponible pour les autres fichiers"
export function addition(a, b) {
  return a + b
}

// 'export default' = "c'est l'export principal de ce fichier"
// Un fichier ne peut avoir qu'UN SEUL export default
export default function multiplication(a, b) {
  return a * b
}
```

### Importer → récupérer quelque chose depuis un autre fichier

```js
// fichier : app.js

// Import d'un export nommé → on met des accolades { }
import { addition } from './mathUtils.js'

// Import d'un export default → pas d'accolades, on choisit le nom qu'on veut
import multiplication from './mathUtils.js'

console.log(addition(2, 3))       // 5
console.log(multiplication(2, 3)) // 6
```

> 💡 En Vue, chaque fichier `.vue` est un **export default** (le composant entier). C'est pour ça qu'on l'importe sans accolades :
> ```js
> import UserCard from './components/UserCard.vue'  // pas de { }
> ```

---

## Créer et utiliser un composant

### Étape 1 : Créer le composant enfant

```vue
<!-- components/UserCard.vue -->
<!-- C'est notre "brique LEGO" : une carte qui affiche un utilisateur -->

<script setup lang="ts">
// On définit les "paramètres" du composant (les props)
// C'est comme les paramètres d'une fonction
interface Props {
  name: string   // Le nom de l'utilisateur (texte obligatoire)
  email: string  // L'email de l'utilisateur (texte obligatoire)
}

// defineProps() dit à Vue : "ce composant attend ces données de son parent"
const props = defineProps<Props>()
</script>

<template>
  <div class="card">
    <!-- props.name → la valeur envoyée par le parent -->
    <h3>{{ props.name }}</h3>
    <!-- props.email → idem -->
    <p>{{ props.email }}</p>
  </div>
</template>
```

### Étape 2 : Utiliser le composant dans un parent

```vue
<!-- ParentPage.vue -->

<script setup lang="ts">
// On importe le composant (comme on importe une fonction)
// Pas de { } car c'est un export default
import UserCard from './components/UserCard.vue'
</script>

<template>
  <!-- On utilise le composant comme une balise HTML personnalisée -->
  <!-- name="Alice" → on passe la valeur "Alice" à la prop 'name' -->
  <!-- email="alice@example.com" → on passe cette valeur à la prop 'email' -->
  <UserCard name="Alice" email="alice@example.com" />

  <!-- On peut le réutiliser autant de fois qu'on veut ! Comme un LEGO 🧱 -->
  <UserCard name="Bob" email="bob@example.com" />
  <UserCard name="Charlie" email="charlie@example.com" />
</template>
```

---

## Props — passer des données du parent vers l'enfant

Les **props** sont les **paramètres** de ton composant. C'est comme les arguments d'une fonction :

```
Fonction JavaScript :     addition(2, 3)        → 2 et 3 sont les arguments
Composant Vue :           <UserCard name="Alice" /> → "Alice" est la prop
```

### Syntaxe type-only (recommandée en TypeScript)

```vue
<script setup lang="ts">
// On déclare une interface qui liste TOUTES les props acceptées
interface Props {
  title: string              // Obligatoire : un texte
  count: number              // Obligatoire : un nombre
  items: string[]            // Obligatoire : un tableau de textes
  variant?: 'primary' | 'secondary'  // Optionnelle (le ? = pas obligatoire)
                             // Ne peut valoir que "primary" ou "secondary"
}

// defineProps<Props>() → dit à Vue "voici les données que j'attends"
const props = defineProps<Props>()

// On peut maintenant utiliser props.title, props.count, etc.
</script>
```

### Avec valeurs par défaut (withDefaults)

Quand une prop est **optionnelle** (`?`), on peut lui donner une **valeur par défaut** au cas où le parent ne la fournit pas :

```vue
<script setup lang="ts">
interface Props {
  title: string       // Obligatoire (pas de ?)
  count?: number      // Optionnelle → valeur par défaut ci-dessous
  showIcon?: boolean  // Optionnelle → valeur par défaut ci-dessous
}

// withDefaults() enveloppe defineProps() pour ajouter des valeurs par défaut
const props = withDefaults(defineProps<Props>(), {
  count: 0,        // Si le parent ne passe pas 'count', ce sera 0
  showIcon: true,  // Si le parent ne passe pas 'showIcon', ce sera true
})
</script>
```

---

### Passer des props dynamiques

```vue
<script setup lang="ts">
import { ref } from 'vue'
import UserCard from './components/UserCard.vue'

const userName = ref<string>('Alice')
const items = ref<string[]>(['pomme', 'banane'])
</script>

<template>
  <!-- STATIQUE : la valeur est écrite en dur (texte entre guillemets) -->
  <UserCard name="Alice" />

  <!-- DYNAMIQUE : on utilise ':' (ou v-bind:) pour passer une variable -->
  <!-- :name="userName" → la prop 'name' reçoit la VALEUR de la variable userName -->
  <UserCard :name="userName" />

  <!-- On peut passer des expressions JavaScript -->
  <!-- items.length calcule la taille du tableau → renvoie un nombre -->
  <UserCard :count="items.length" />

  <!-- Pour les booléens : juste écrire le nom = true -->
  <UserCard show-icon />
  <!-- Pour passer false, il faut le binder explicitement -->
  <UserCard :show-icon="false" />
</template>
```

> 💡 **`:name="userName"`** → avec les deux-points, Vue évalue `userName` comme du JavaScript.
> **`name="Alice"`** → sans deux-points, Vue prend le texte tel quel (string littérale).

---

### Règle importante : les props sont en lecture seule (read-only) 🔒

Une prop est une **donnée qui appartient au parent**. L'enfant peut la **lire** mais **jamais la modifier** :

```ts
// ❌ INTERDIT — ne modifie jamais une prop directement
props.count = 5
// Vue affichera une erreur dans la console !

// ✅ Si tu as besoin de modifier la valeur, crée une COPIE locale
const localCount = ref(props.count)
// Maintenant tu peux modifier localCount sans toucher à la prop
localCount.value = 5
```

> **Pourquoi ?** Parce que les données descendent du parent vers l'enfant. Si l'enfant modifie les props, le parent ne sait plus ce qui se passe → c'est le chaos !

---

## Emits — envoyer des événements de l'enfant vers le parent

### L'analogie du talkie-walkie 📻

Imagine le parent et l'enfant reliés par un **talkie-walkie** :

```
┌──────────────────────────────┐
│  PARENT                      │
│  "J'écoute les messages      │
│   de mon enfant"             │
│                              │
│  📻 @update="..."           │  ← Le parent ÉCOUTE
│  📻 @delete="..."           │
│  📻 @close="..."            │
└──────────┬───────────────────┘
           │  talkie-walkie
           │  (événements)
┌──────────┴───────────────────┐
│  ENFANT                      │
│  "Je préviens mon parent     │
│   quand quelque chose        │
│   se passe"                  │
│                              │
│  📻 emit('update', valeur)  │  ← L'enfant PARLE
│  📻 emit('delete', id)      │
│  📻 emit('close')           │
└──────────────────────────────┘
```

- **Props** = données qui **descendent** (parent → enfant) 📦⬇️
- **Emits** = événements qui **remontent** (enfant → parent) 📻⬆️

---

### Déclarer les emits dans le composant enfant

```vue
<!-- ChildComponent.vue -->

<script setup lang="ts">
// defineEmits() → déclare les événements que CE composant peut envoyer
// C'est comme dire : "voici les messages que je peux envoyer au parent"
const emit = defineEmits<{
  // (event: 'update', value: string): void
  //    → je peux envoyer un événement 'update' avec une valeur texte
  (event: 'update', value: string): void

  // → je peux envoyer un événement 'delete' avec un numéro (l'id)
  (event: 'delete', id: number): void

  // → je peux envoyer un événement 'close' sans données
  (event: 'close'): void
}>()

// Fonction appelée quand l'utilisateur clique sur "Sauver"
function handleSave(): void {
  // emit('update', 'nouvelle valeur')
  //   → envoie le message "update" au parent, avec la donnée "nouvelle valeur"
  emit('update', 'nouvelle valeur')
}

// Fonction appelée quand l'utilisateur clique sur "Supprimer"
function handleDelete(): void {
  // emit('delete', 42) → envoie le message "delete" avec l'id 42
  emit('delete', 42)
}
</script>

<template>
  <!-- Quand on clique → appelle handleSave → qui emit 'update' -->
  <button @click="handleSave">Sauver</button>

  <!-- Quand on clique → appelle handleDelete → qui emit 'delete' -->
  <button @click="handleDelete">Supprimer</button>

  <!-- On peut aussi émettre directement dans le template -->
  <button @click="emit('close')">Fermer</button>
</template>
```

---

### Écouter les emits côté parent

```vue
<!-- Parent.vue -->

<script setup lang="ts">
// On importe le composant enfant
import ChildComponent from './ChildComponent.vue'

// Cette fonction sera appelée quand l'enfant émet 'update'
// 'value' = la donnée envoyée par l'enfant
function onUpdate(value: string): void {
  console.log('Mis à jour :', value)
}

// Cette fonction sera appelée quand l'enfant émet 'delete'
// 'id' = le numéro envoyé par l'enfant
function onDelete(id: number): void {
  console.log('Supprimé :', id)
}
</script>

<template>
  <!-- @update="onUpdate" → quand l'enfant émet 'update', appelle onUpdate -->
  <!-- @delete="onDelete" → quand l'enfant émet 'delete', appelle onDelete -->
  <!-- @close="..." → quand l'enfant émet 'close', exécute ce code -->
  <ChildComponent
    @update="onUpdate"
    @delete="onDelete"
    @close="showModal = false"
  />
</template>
```

---

## Le pattern parent/enfant — vue d'ensemble

Voici comment les données circulent entre parent et enfant :

```
┌─────────────────────────────────────────────────┐
│                    PARENT                        │
│         (c'est LUI qui possède les données)      │
│                                                  │
│   const name = ref('Alice')                      │
│   function onRename(n: string) { name.value = n }│
│                                                  │
│   <Child :name="name" @rename="onRename" />     │
│            │                    ▲                 │
└────────────│────────────────────│─────────────────┘
             │                    │
       Props ↓ (données)    Emits ↑ (événements)
       "Tiens, voici          "Papa, l'utilisateur
        ton nom"               veut changer le nom"
             │                    │
┌────────────│────────────────────│─────────────────┐
│            ▼                    │                  │
│                    ENFANT                         │
│         (il AFFICHE et INTERAGIT)                 │
│                                                   │
│   <p>{{ props.name }}</p>                         │
│   <button @click="emit('rename', 'Bob')">        │
│                                                   │
└───────────────────────────────────────────────────┘
```

**Règle d'or** : Le parent est la **source de vérité**. L'enfant affiche les données et remonte les actions.

---

## `v-model` sur un composant

On a vu `v-model` sur les `<input>` HTML dans le cours précédent. Il fonctionne aussi sur **tes propres composants** !

### Utilisation côté parent

```vue
<!-- Parent -->
<script setup lang="ts">
import { ref } from 'vue'
import CustomInput from './CustomInput.vue'

const username = ref<string>('')
</script>

<template>
  <!-- v-model="username" sur un composant = liaison bidirectionnelle -->
  <CustomInput v-model="username" />

  <!-- C'est exactement la même chose que : -->
  <CustomInput
    :modelValue="username"
    @update:modelValue="username = $event"
  />
  <!--
    :modelValue="username" → on envoie la valeur en prop
    @update:modelValue     → on écoute quand l'enfant met à jour
    $event                 → la nouvelle valeur envoyée par l'enfant
  -->
</template>
```

### Implémentation côté enfant (méthode classique)

```vue
<!-- CustomInput.vue -->

<script setup lang="ts">
// On reçoit 'modelValue' en prop (c'est le nom spécial attendu par v-model)
const props = defineProps<{
  modelValue: string
}>()

// On déclare qu'on peut émettre 'update:modelValue'
// (c'est le nom spécial attendu par v-model)
const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

// Quand l'utilisateur tape dans l'input
function onInput(event: Event): void {
  // On récupère l'élément HTML
  const target = event.target as HTMLInputElement
  // On envoie la nouvelle valeur au parent via emit
  emit('update:modelValue', target.value)
}
</script>

<template>
  <!-- :value → affiche la valeur reçue du parent -->
  <!-- @input → quand on tape, on prévient le parent -->
  <input :value="modelValue" @input="onInput" />
</template>
```

---

### `defineModel` — la version simplifiée (Vue 3.4+)

Depuis Vue 3.4, `defineModel` remplace le combo prop + emit en **une seule ligne** :

```vue
<!-- Parent -->
<script setup lang="ts">
import { ref } from 'vue'
import UserForm from './UserForm.vue'

const first = ref<string>('')
const last = ref<string>('')
</script>

<template>
  <!-- v-model:firstName → lie 'first' à la prop 'firstName' du composant -->
  <!-- v-model:lastName → lie 'last' à la prop 'lastName' du composant -->
  <UserForm v-model:firstName="first" v-model:lastName="last" />
</template>
```

```vue
<!-- UserForm.vue -->

<script setup lang="ts">
// defineModel() crée automatiquement la prop ET l'emit !
// Plus besoin de defineProps + defineEmits séparément
const firstName = defineModel<string>('firstName')
// → crée la prop 'firstName' + l'emit 'update:firstName'

const lastName = defineModel<string>('lastName')
// → crée la prop 'lastName' + l'emit 'update:lastName'
</script>

<template>
  <!-- On peut utiliser v-model directement car defineModel retourne un ref -->
  <input v-model="firstName" placeholder="Prénom" />
  <input v-model="lastName" placeholder="Nom" />
</template>
```

> 💡 `defineModel` est la méthode recommandée à partir de Vue 3.4. Plus simple, moins de code !

---

## Slots — injecter du contenu dans un composant

### L'analogie du trou dans le mur 🕳️

Imagine que tu construis un **cadre photo** (un composant). Le cadre a une bordure, un style, mais **le trou au milieu est vide** → c'est au parent de décider quelle photo mettre dedans.

```
┌──────────────────────────────┐
│  Composant Card              │
│  ┌────────────────────────┐  │
│  │                        │  │
│  │   ← SLOT (trou) →     │  │  ← Le parent décide quoi mettre ici
│  │                        │  │
│  └────────────────────────┘  │
│  (style, bordure, ombre)     │
└──────────────────────────────┘
```

Un **slot** est un **espace réservé** dans un composant que le parent peut remplir avec le contenu qu'il veut.

### Slot par défaut

```vue
<!-- Card.vue — le composant "cadre" -->
<template>
  <div class="card">
    <!-- <slot> = "ici, le parent mettra ce qu'il veut" -->
    <!-- C'est le trou dans le mur 🕳️ -->
    <slot></slot>
  </div>
</template>
```

```vue
<!-- Parent — on remplit le slot -->
<script setup lang="ts">
import Card from './Card.vue'
</script>

<template>
  <Card>
    <!-- Tout ce qui est ENTRE <Card> et </Card> -->
    <!-- va remplacer le <slot> dans Card.vue -->
    <h2>Mon titre</h2>
    <p>Mon contenu personnalisé</p>
  </Card>
</template>
```

**Résultat HTML** :
```html
<div class="card">
  <h2>Mon titre</h2>
  <p>Mon contenu personnalisé</p>
</div>
```

---

### Slots nommés — plusieurs trous dans le mur

Parfois, tu veux **plusieurs emplacements** dans ton composant. C'est comme un mur avec plusieurs trous étiquetés :

```
┌──────────────────────────────────┐
│  Layout.vue                      │
│  ┌──────────────────────────┐    │
│  │  slot "header"   🏷️      │    │  ← trou pour l'en-tête
│  └──────────────────────────┘    │
│  ┌──────────────────────────┐    │
│  │  slot (défaut)            │    │  ← trou principal (sans nom)
│  └──────────────────────────┘    │
│  ┌──────────────────────────┐    │
│  │  slot "footer"   🏷️      │    │  ← trou pour le pied de page
│  └──────────────────────────┘    │
└──────────────────────────────────┘
```

```vue
<!-- Layout.vue — composant avec 3 emplacements -->
<template>
  <!-- slot nommé "header" → l'en-tête -->
  <header>
    <slot name="header"></slot>
  </header>

  <!-- slot par défaut (sans nom) → le contenu principal -->
  <main>
    <slot></slot>
  </main>

  <!-- slot nommé "footer" → le pied de page -->
  <footer>
    <slot name="footer"></slot>
  </footer>
</template>
```

```vue
<!-- Parent — on remplit chaque slot par son nom -->
<script setup lang="ts">
import Layout from './Layout.vue'
</script>

<template>
  <Layout>
    <!-- #header est un raccourci pour v-slot:header -->
    <!-- Ce contenu ira dans le slot nommé "header" -->
    <template #header>
      <h1>Bienvenue sur mon site</h1>
    </template>

    <!-- Le contenu sans template va dans le slot par défaut -->
    <p>Contenu principal de la page</p>

    <!-- Ce contenu ira dans le slot nommé "footer" -->
    <template #footer>
      <p>© 2026 Mon site</p>
    </template>
  </Layout>
</template>
```

**Résultat HTML** :
```html
<header>
  <h1>Bienvenue sur mon site</h1>
</header>
<main>
  <p>Contenu principal de la page</p>
</main>
<footer>
  <p>© 2026 Mon site</p>
</footer>
```

---

## Résumé — le flux complet

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│   Props ↓          Le parent envoie des données               │
│                    <Child :name="name" />                     │
│                                                               │
│   Emits ↑          L'enfant remonte des événements            │
│                    emit('update', valeur)                      │
│                    <Child @update="handler" />                │
│                                                               │
│   v-model ↕        Liaison bidirectionnelle (props + emits)   │
│                    <Child v-model="data" />                   │
│                                                               │
│   Slots 🕳️         Le parent injecte du contenu HTML          │
│                    <Child><p>contenu</p></Child>              │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

| Concept           | Direction       | Syntaxe                                | Analogie                  |
| ----------------- | --------------- | -------------------------------------- | ------------------------- |
| **Props**         | Parent → Enfant | `:name="value"`                        | Paramètres de fonction    |
| **Emits**         | Enfant → Parent | `emit('event', data)`                  | Talkie-walkie 📻          |
| **v-model**       | ↕ Bidirectionnel| `v-model="data"`                       | Miroir magique 🪞         |
| **Slots**         | Parent → Enfant | `<slot>` + contenu entre balises       | Trou dans le mur 🕳️      |
| **defineModel**   | ↕ Simplifié     | `const x = defineModel('name')`        | v-model en une ligne      |
| **withDefaults**  | Props par défaut| `withDefaults(defineProps(), {...})`    | Valeurs de secours        |

---

## Exercice

→ `exercices/04-catalogue-produits/ENONCE.md`

## Suite

→ `cours/01-debutant/06-lifecycle-hooks.md`
