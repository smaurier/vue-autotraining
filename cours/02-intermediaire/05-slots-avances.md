# 05 — Slots avancés : laisser le parent décider du contenu

## C'est quoi un slot ? (Rappel rapide)

Imagine un **cadre photo**. Le cadre, c'est ton composant. Mais la photo à l'intérieur ? C'est le **parent** qui la choisit.

Un **slot**, c'est un **trou** dans un composant que le parent peut remplir avec ce qu'il veut.

```vue
<!-- Card.vue — Le composant "cadre" -->
<template>
  <div class="card">
    <!-- Ce <slot> est le "trou" : le parent mettra ce qu'il veut ici -->
    <slot></slot>
  </div>
</template>
```

```vue
<!-- Parent — C'est lui qui décide quoi mettre dans le trou -->
<Card>
  <!-- Tout ce qu'on écrit entre <Card> et </Card> remplace le <slot> -->
  <p>Bonjour, je suis le contenu choisi par le parent !</p>
</Card>
```

> **Résultat :** Le navigateur affiche une `<div class="card">` contenant `<p>Bonjour...</p>`.

---

## Slot avec contenu par défaut (fallback)

Et si le parent ne met rien dans le trou ? On peut prévoir un **contenu par défaut** :

```vue
<!-- Button.vue -->
<template>
  <button class="btn">
    <!-- Si le parent ne passe rien, le texte "Cliquez ici" s'affiche -->
    <slot>Cliquez ici</slot>
  </button>
</template>
```

```vue
<!-- Parent -->

<!-- Cas 1 : le parent ne met rien → affiche "Cliquez ici" (le fallback) -->
<Button />

<!-- Cas 2 : le parent met du contenu → affiche "Valider" à la place -->
<Button>Valider</Button>
```

> **Analogie :** C'est comme un formulaire pré-rempli. Si tu ne changes rien, la valeur par défaut reste. Si tu écris quelque chose, ça remplace.

---

## Slots nommés : plusieurs trous dans un composant

### L'analogie de la maison 🏠

Imagine que ton composant est une **maison** avec plusieurs pièces :
- La **cuisine** (slot "header")
- Le **salon** (slot par défaut)
- La **chambre** (slot "sidebar")

Chaque pièce est un trou différent, et le parent décide quoi mettre dans chaque pièce.

```vue
<!-- PageLayout.vue — La "maison" avec 3 pièces -->
<template>
  <!-- Pièce 1 : le header (comme la cuisine) -->
  <header class="header">
    <slot name="header"></slot>
  </header>

  <!-- Pièce 2 : le contenu principal (comme le salon, c'est le slot par défaut) -->
  <main class="content">
    <slot></slot>
  </main>

  <!-- Pièce 3 : la sidebar (comme la chambre) -->
  <aside class="sidebar">
    <slot name="sidebar"></slot>
  </aside>
</template>
```

```vue
<!-- Parent — On "meuble" chaque pièce -->
<PageLayout>
  <!-- On cible le slot "header" avec #header -->
  <template #header>
    <h1>Mon Application</h1>
  </template>

  <!-- Sans #nom, ça va dans le slot par défaut (le "salon") -->
  <p>Contenu principal de la page</p>

  <!-- On cible le slot "sidebar" avec #sidebar -->
  <template #sidebar>
    <nav>Menu latéral</nav>
  </template>
</PageLayout>
```

### Syntaxe : `#header` c'est quoi ?

`#header` est le **raccourci** de `v-slot:header`. Les deux écritures font la même chose :

```vue
<!-- Écriture longue -->
<template v-slot:header> ... </template>

<!-- Écriture courte (raccourci) — on utilise toujours celle-ci -->
<template #header> ... </template>
```

---

## Scoped slots : quand l'enfant partage ses données avec le parent

### Le problème

Jusqu'ici, le parent décide **quoi afficher**, mais il ne connaît pas les données de l'enfant. Comment faire si l'enfant a des données et qu'on veut que le parent décide **comment** les afficher ?

### L'analogie de la fenêtre 🪟

Imagine un composant comme une **pièce fermée** contenant des objets (des données). Un **scoped slot**, c'est une **fenêtre** dans le mur : l'enfant pousse ses objets à travers la fenêtre, et le parent peut les voir et décider comment les présenter.

**L'enfant dit :** "Voici mes données, fais-en ce que tu veux !"
**Le parent répond :** "OK, je vais les afficher comme je veux."

### 📝 Rappel JavaScript : le destructuring (décomposition)

Avant de voir le code, un rappel important. En JavaScript, on peut **extraire des propriétés d'un objet** directement :

```js
// Sans destructuring — on accète chaque propriété une par une
const personne = { nom: 'Alice', age: 30 }
const nom = personne.nom     // 'Alice'
const age = personne.age     // 30

// Avec destructuring — on extrait tout d'un coup avec { }
const { nom, age } = personne
// nom vaut 'Alice', age vaut 30

// On peut aussi le faire dans les paramètres d'une fonction :
function saluer({ nom, age }) {
  console.log(`Bonjour ${nom}, tu as ${age} ans`)
}
saluer(personne) // "Bonjour Alice, tu as 30 ans"
```

> **Pourquoi c'est important ?** Parce que les scoped slots utilisent exactement cette syntaxe `{ item, index }` pour récupérer les données que l'enfant envoie.

### Exemple : une liste réutilisable

```vue
<!-- DataList.vue — L'enfant qui "pousse" ses données par la fenêtre -->
<script setup lang="ts">
// On définit les props : ce composant reçoit un tableau d'éléments
interface Props {
  items: any[]   // any[] = un tableau qui peut contenir n'importe quoi
}
const props = defineProps<Props>()
</script>

<template>
  <ul>
    <!-- On boucle sur chaque élément du tableau -->
    <li v-for="(item, index) in props.items" :key="index">
      <!-- SCOPED SLOT : on "pousse" item et index vers le parent -->
      <!-- C'est comme passer des objets par la fenêtre -->
      <slot :item="item" :index="index"></slot>
    </li>
  </ul>
</template>
```

```vue
<!-- Parent — Il reçoit les données et décide comment les afficher -->
<DataList :items="users">
  <!--
    #default="{ item, index }" signifie :
    - #default  → on cible le slot par défaut
    - "{ item, index }" → on récupère (destructure) les données
                           que l'enfant nous a passées
  -->
  <template #default="{ item, index }">
    <span>{{ index + 1 }}. {{ item.name }} ({{ item.email }})</span>
  </template>
</DataList>
```

> **Résultat :** Si `users` contient `[{name: 'Alice', email: 'alice@mail.com'}]`, on verra : "1. Alice (alice@mail.com)"

### Visualisation du flux de données

```
┌─────────────────────────────────────────┐
│  PARENT                                  │
│                                          │
│  <DataList :items="users">               │
│    <template #default="{ item, index }"> │  ← Reçoit les données
│      {{ item.name }}                     │  ← Décide de l'affichage
│    </template>                           │
│  </DataList>                             │
│         │                      ▲         │
│         │ :items="users"       │         │
│         ▼                      │         │
│  ┌──────────────────────┐      │         │
│  │  ENFANT (DataList)   │      │         │
│  │                      │      │         │
│  │  <slot :item="item"  │──────┘         │
│  │        :index="index">│  Pousse les   │
│  │                      │  données vers  │
│  │  Boucle sur items    │  le parent     │
│  └──────────────────────┘                │
└─────────────────────────────────────────┘
```

### Typer les scoped slots (TypeScript)

On peut dire à TypeScript **exactement quelles données** le slot va recevoir :

```vue
<!-- DataList.vue — Version typée -->
<script setup lang="ts" generic="T">
// generic="T" : T est un type "variable", il sera remplacé
// par le vrai type quand on utilise le composant

const props = defineProps<{
  items: T[]   // Un tableau de T (T sera défini à l'utilisation)
}>()

// defineSlots dit : "le slot par défaut reçoit un objet
// avec item de type T et index de type number"
defineSlots<{
  default(props: { item: T; index: number }): any
}>()
</script>
```

> **Pourquoi typer ?** Pour que l'autocomplétion fonctionne ! Quand tu tapes `item.` dans le parent, ton éditeur te proposera les bonnes propriétés.

---

## Cas concret : un composant Table réutilisable

C'est un exemple plus complet qui combine tout ce qu'on a vu. Ne t'inquiète pas si c'est dense — l'idée est de montrer la **puissance** des scoped slots.

```vue
<!-- DataTable.vue — Un tableau HTML réutilisable -->
<script setup lang="ts" generic="T extends { id: number }">
// T extends { id: number } signifie :
// "T peut être n'importe quel type, MAIS il doit avoir une propriété id"

// Interface pour décrire une colonne du tableau
interface Column<T> {
  key: keyof T    // keyof T = une des clés de T (ex: 'name', 'price'...)
  label: string   // Le titre affiché en haut de la colonne
}

const props = defineProps<{
  items: T[]           // Les données (lignes du tableau)
  columns: Column<T>[] // La description des colonnes
}>()

// On définit 2 slots :
// - "cell" : pour personnaliser l'affichage d'une cellule
// - "empty" : pour personnaliser le message "aucune donnée"
defineSlots<{
  cell(props: { item: T; column: Column<T>; value: T[keyof T] }): any
  empty(): any
}>()
</script>

<template>
  <table>
    <!-- En-tête du tableau -->
    <thead>
      <tr>
        <!-- Une colonne <th> pour chaque colonne définie -->
        <th v-for="col in columns" :key="String(col.key)">
          {{ col.label }}
        </th>
      </tr>
    </thead>

    <tbody>
      <!-- Si le tableau est vide, on affiche un message -->
      <tr v-if="items.length === 0">
        <td :colspan="columns.length">
          <!-- Slot "empty" avec un fallback -->
          <slot name="empty">Aucune donnée</slot>
        </td>
      </tr>

      <!-- Sinon, une ligne par élément -->
      <tr v-for="item in items" :key="item.id">
        <td v-for="col in columns" :key="String(col.key)">
          <!-- Slot "cell" : le parent décide comment afficher chaque cellule -->
          <!-- On passe l'item, la colonne, et la valeur de cette cellule -->
          <slot name="cell" :item="item" :column="col" :value="item[col.key]">
            <!-- Fallback : on affiche juste la valeur brute -->
            {{ item[col.key] }}
          </slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>
```

```vue
<!-- Parent — On utilise notre DataTable et on personnalise l'affichage -->
<DataTable :items="products" :columns="columns">
  <!-- On récupère item, column et value depuis le scoped slot -->
  <template #cell="{ item, column, value }">
    <!-- Si c'est la colonne "price", on ajoute le symbole € -->
    <span v-if="column.key === 'price'">{{ value }} €</span>
    <!-- Si c'est la colonne "favorite", on affiche une étoile ou un tiret -->
    <span v-else-if="column.key === 'favorite'">{{ value ? '⭐' : '—' }}</span>
    <!-- Pour toutes les autres colonnes, on affiche la valeur telle quelle -->
    <span v-else>{{ value }}</span>
  </template>

  <!-- Message personnalisé quand il n'y a aucun produit -->
  <template #empty>
    <p>Aucun produit trouvé. 😕</p>
  </template>
</DataTable>
```

---

## Renderless components (composants sans affichage)

### C'est quoi ?

Un **renderless component** est un composant qui ne produit **aucun HTML**. Il contient uniquement de la **logique** (données, fonctions) et laisse le parent décider de tout l'affichage via un scoped slot.

> **Analogie :** C'est comme un **moteur de voiture** sans carrosserie. Le moteur fait tout le travail (la logique), mais c'est toi qui choisis la carrosserie (l'affichage).

### Exemple simple : un compteur renderless

```vue
<!-- UseCounter.vue — Le "moteur" sans affichage -->
<script setup lang="ts">
import { ref } from 'vue'

// Toute la logique est ici
const count = ref(0)                          // La valeur du compteur
const increment = () => count.value++         // Fonction pour ajouter 1
const decrement = () => count.value--         // Fonction pour enlever 1
const reset = () => (count.value = 0)         // Fonction pour remettre à 0
</script>

<template>
  <!-- On ne crée AUCUN HTML visible -->
  <!-- On passe juste toute la logique au parent via le slot -->
  <slot
    :count="count"
    :increment="increment"
    :decrement="decrement"
    :reset="reset"
  ></slot>
</template>
```

```vue
<!-- Parent — C'est LUI qui décide de l'affichage -->
<UseCounter>
  <template #default="{ count, increment, decrement, reset }">
    <div class="mon-compteur">
      <button @click="decrement">-</button>
      <span>{{ count }}</span>
      <button @click="increment">+</button>
      <button @click="reset">Remettre à zéro</button>
    </div>
  </template>
</UseCounter>
```

> **Note :** Aujourd'hui, on préfère souvent utiliser des **composables** (`useCounter()`) plutôt que des renderless components. Mais c'est un pattern que tu rencontreras dans du code existant.

---

## Render functions (avancé — pour info)

Pour des cas très rares où le template ne suffit pas, on peut créer du HTML avec du JavaScript pur :

```ts
import { h, defineComponent } from 'vue'

export default defineComponent({
  props: {
    level: { type: Number, required: true },  // 1, 2, 3... pour h1, h2, h3...
    text: { type: String, required: true },
  },
  setup(props) {
    // h() crée un élément HTML
    // h('h2', 'Bonjour') → <h2>Bonjour</h2>
    return () => h(`h${props.level}`, props.text)
  },
})
```

> ⚠️ **En pratique, les render functions sont très rares.** Ne t'en préoccupe pas pour l'instant. Utilise-les uniquement si le template devient vraiment trop complexe.

---

## Résumé

| Concept | Description | Analogie |
|---------|-------------|----------|
| **Slot par défaut** | Un trou que le parent remplit | Un cadre photo |
| **Slot nommé** | Plusieurs trous avec des noms | Les pièces d'une maison |
| **Scoped slot** | L'enfant passe des données au parent via le slot | Une fenêtre pour passer des objets |
| **Renderless component** | Composant sans HTML, que de la logique | Un moteur sans carrosserie |

---

## Exercice

→ `exercices/09-tableau-reutilisable/ENONCE.md`

## Suite

→ `cours/02-intermediaire/06-transitions-et-animations.md`
