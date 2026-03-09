# 07 — Options API vs Composition API

## 🎯 Objectif de cette leçon

Comprendre qu'il existe **deux façons d'écrire** un composant Vue 3,
savoir les **reconnaître**, et comprendre **pourquoi on utilise la Composition API**
dans ce parcours.

> 🧘 **Rassure-toi** : tu n'as pas besoin de maîtriser les deux styles.
> L'important c'est de **coder** en Composition API et de **reconnaître**
> l'Options API quand tu la croises dans du code existant.

---

> **🔄 Rappel du cours précédent**
> Avant de continuer, vérifie que tu peux répondre à ces questions :
> 1. Quel hook utilise-t-on pour exécuter du code quand un composant apparaît dans le DOM ?
> 2. Dans quel hook doit-on nettoyer un `setInterval` ou un event listener ?
> 
> <details>
> <summary>Vérifier mes réponses</summary>
>
> 1. `onMounted()`
> 2. `onUnmounted()` (pour éviter les fuites de mémoire)
> </details>

---

## L'analogie de la cuisine 🍳

Imagine que tu prépares un repas avec **une salade** et **une soupe**.  
Tu as besoin de : laitue, tomates, vinaigrette, oignons, carottes, bouillon.

### Options API = ranger par TYPE d'ingrédient

```
📦 Légumes      → laitue, tomates, oignons, carottes
📦 Liquides     → vinaigrette, bouillon
📦 Ustensiles   → saladier, casserole, couteau
```

Problème : pour préparer la salade, tu dois **aller chercher dans 3 tiroirs différents**.
La laitue est avec les carottes (qui sont pour la soupe), la vinaigrette est
avec le bouillon (qui est pour la soupe)...

### Composition API = ranger par RECETTE

```
📦 Salade       → laitue, tomates, vinaigrette, saladier
📦 Soupe        → oignons, carottes, bouillon, casserole
```

Tout ce dont tu as besoin pour la salade est **au même endroit** !
C'est beaucoup plus pratique quand le repas devient complexe.

---

## Les deux styles en Vue 3

Vue 3 supporte **deux approches** pour écrire un composant.
En entreprise (ESN), tu tomberas sur les deux, c'est pourquoi il faut
au moins **reconnaître** l'Options API même si on code en Composition API.

---

## Options API — le style "classique"

### Rappel JavaScript : c'est quoi `this` ?

> En JavaScript, **`this`** est un mot-clé spécial qui fait référence à
> **l'objet courant** — celui "dans lequel" tu te trouves.
>
> ```ts
> const personne = {
>   nom: 'Alice',
>   direBonjour() {
>     // Ici, "this" = l'objet "personne"
>     console.log('Bonjour, je suis ' + this.nom)
>   }
> }
> personne.direBonjour()  // "Bonjour, je suis Alice"
> ```
>
> En Options API, **`this`** fait référence au **composant Vue**.
> Donc `this.todos` veut dire "la donnée `todos` de ce composant".
>
> ⚠️ Le problème : `this` peut changer de valeur selon le contexte
> (dans une callback, dans un setTimeout...), ce qui cause des bugs
> difficiles à comprendre. C'est l'une des raisons pour lesquelles
> la Composition API a été créée : **pas de `this` du tout** !

### Exemple : une todo-list en Options API

```vue
<script lang="ts">
// En Options API, on exporte un objet avec des "options" prédéfinies
import { defineComponent } from 'vue'

// On définit le type d'une tâche
interface Todo {
  id: number       // Identifiant unique
  label: string    // Le texte de la tâche
  done: boolean    // true = terminée, false = pas encore
}

export default defineComponent({
  // ╔══════════════════════════════════════════╗
  // ║  📦 Tiroir "DONNÉES" — toutes ensemble  ║
  // ╚══════════════════════════════════════════╝
  data() {
    return {
      todos: [] as Todo[],      // La liste des tâches (tableau vide au départ)
      newLabel: '',              // Le texte tapé par l'utilisateur
    }
  },

  // ╔══════════════════════════════════════════╗
  // ║  📦 Tiroir "CALCULS" — tous ensemble    ║
  // ╚══════════════════════════════════════════╝
  computed: {
    remaining(): number {
      // "this" = le composant Vue
      // this.todos = la liste définie dans data()
      return this.todos.filter((t) => !t.done).length
    },
  },

  // ╔══════════════════════════════════════════╗
  // ║  📦 Tiroir "ACTIONS" — toutes ensemble  ║
  // ╚══════════════════════════════════════════╝
  methods: {
    addTodo(): void {
      // this.newLabel = accéder à la donnée "newLabel" du composant
      if (!this.newLabel.trim()) return    // Si le texte est vide, on ne fait rien
      this.todos.push({                    // On ajoute une tâche à la liste
        id: Date.now(),                    // Identifiant unique (timestamp)
        label: this.newLabel.trim(),       // Le texte nettoyé
        done: false,                       // Pas encore terminée
      })
      this.newLabel = ''                   // On vide le champ de saisie
    },

    removeTodo(id: number): void {
      // On garde toutes les tâches SAUF celle avec cet id
      this.todos = this.todos.filter((t) => t.id !== id)
    },
  },

  // ╔══════════════════════════════════════════╗
  // ║  📦 Tiroir "CYCLE DE VIE"              ║
  // ╚══════════════════════════════════════════╝
  mounted() {
    console.log('Composant monté')   // S'exécute quand le composant apparaît
  },
})
</script>

<template>
  <div>
    <!-- v-model connecte l'input à newLabel (Options API utilise this en interne) -->
    <input v-model="newLabel" @keyup.enter="addTodo" placeholder="Nouvelle tâche..." />
    <button @click="addTodo">Ajouter</button>

    <p>{{ remaining }} tâche(s) restante(s)</p>

    <ul>
      <li v-for="todo in todos" :key="todo.id">
        <input type="checkbox" v-model="todo.done" />
        <span :style="{ textDecoration: todo.done ? 'line-through' : 'none' }">
          {{ todo.label }}
        </span>
        <button @click="removeTodo(todo.id)">✕</button>
      </li>
    </ul>
  </div>
</template>
```

> 📌 **Observe** : la donnée `todos` est dans `data`, le calcul `remaining` est dans
> `computed`, l'action `addTodo` est dans `methods`. Tout ce qui concerne les todos
> est **éparpillé dans 3 tiroirs différents** !

---

## Composition API — le style "moderne"

### La même todo-list en Composition API

```vue
<script setup lang="ts">
// En Composition API, on importe les outils et on organise le code librement
import { ref, computed, onMounted } from 'vue'

// On définit le type d'une tâche (identique)
interface Todo {
  id: number       // Identifiant unique
  label: string    // Le texte de la tâche
  done: boolean    // true = terminée, false = pas encore
}

// ╔══════════════════════════════════════════════════════╗
// ║  📦 Tout ce qui concerne les TODOS est ENSEMBLE     ║
// ╚══════════════════════════════════════════════════════╝

// --- Données ---
const todos = ref<Todo[]>([])          // Liste des tâches (tableau vide au départ)
const newLabel = ref<string>('')       // Texte tapé par l'utilisateur

// --- Calcul dérivé ---
const remaining = computed<number>(
  () => todos.value.filter((t) => !t.done).length
  // .value car c'est une ref (on l'a vu dans les leçons précédentes)
)

// --- Actions ---
function addTodo(): void {
  if (!newLabel.value.trim()) return    // Si vide, on ne fait rien
  todos.value.push({                    // On ajoute une tâche
    id: Date.now(),                     // Identifiant unique
    label: newLabel.value.trim(),       // Texte nettoyé
    done: false,                        // Pas encore terminée
  })
  newLabel.value = ''                   // On vide le champ
}

function removeTodo(id: number): void {
  // On garde toutes les tâches SAUF celle avec cet id
  todos.value = todos.value.filter((t) => t.id !== id)
}

// --- Cycle de vie ---
onMounted(() => {
  console.log('Composant monté')       // S'exécute quand le composant apparaît
})
</script>

<template>
  <div>
    <input v-model="newLabel" @keyup.enter="addTodo" placeholder="Nouvelle tâche..." />
    <button @click="addTodo">Ajouter</button>

    <p>{{ remaining }} tâche(s) restante(s)</p>

    <ul>
      <li v-for="todo in todos" :key="todo.id">
        <input type="checkbox" v-model="todo.done" />
        <span :style="{ textDecoration: todo.done ? 'line-through' : 'none' }">
          {{ todo.label }}
        </span>
        <button @click="removeTodo(todo.id)">✕</button>
      </li>
    </ul>
  </div>
</template>
```

> 📌 **Observe** : les données, le calcul et les actions liés aux todos sont
> **tous au même endroit**, les uns à côté des autres. Pas besoin de sauter
> entre `data`, `computed` et `methods` !

---

## Comparaison visuelle : le même code, deux organisations

```
  OPTIONS API                          COMPOSITION API
  ────────────                         ─────────────────
  data() {                             // --- Feature: Todos ---
    todos: [],                         const todos = ref([])
    newLabel: '',                       const newLabel = ref('')
    searchQuery: '', ←── autre feature  const remaining = computed(...)
  },                                    function addTodo() { ... }
                                        function removeTodo() { ... }
  computed: {
    remaining() { ... },                // --- Feature: Recherche ---
    filteredResults() { ... }, ←── ??   const searchQuery = ref('')
  },                                    const filteredResults = computed(...)
                                        function search() { ... }
  methods: {
    addTodo() { ... },
    removeTodo() { ... },
    search() { ... }, ←── ??
  },

  Le code des todos est ÉPARPILLÉ       Le code de chaque feature
  dans data + computed + methods         est REGROUPÉ ensemble
```

---

## Tableau comparatif

| Critère                  | Options API                        | Composition API              |
| ------------------------ | ---------------------------------- | ---------------------------- |
| **Organisation du code** | Par type (data, methods, computed) | Par feature (todo, search…)  |
| **TypeScript**           | Fonctionne mais verbeux            | Naturel et agréable          |
| **Réutilisation**        | Mixins (source de bugs)            | Composables (propre et clair)|
| **`this`**               | Obligatoire et parfois piégeux     | **Pas de `this` !** 🎉      |
| **Testabilité**          | Moyenne                            | Excellente                   |
| **Apprentissage**        | Plus facile au tout début           | Un peu plus abstrait         |
| **Gros composants**      | Code éparpillé, dur à suivre       | Code regroupé, facile à lire |

---

## Quand utiliser quoi ?

| Contexte                                    | Choix recommandé                       |
| ------------------------------------------- | -------------------------------------- |
| 🆕 Nouveau projet Vue 3                    | **Composition API**                    |
| 🏚️ Code existant Vue 2 à maintenir        | Options API (c'est déjà écrit ainsi)   |
| 📏 Composant très simple (< 30 lignes)     | Les deux se valent                     |
| 🧩 Logique complexe partagée entre composants | **Composition API** (composables)   |

---

## Comment reconnaître chaque style d'un coup d'œil ?

```
Options API                           Composition API
──────────                            ─────────────────
<script lang="ts">                    <script setup lang="ts">
                                              ^^^^^
export default defineComponent({      import { ref, computed } from 'vue'
  data() { ... },                     const maVariable = ref(...)
  computed: { ... },
  methods: { ... },                   function maFonction() { ... }
  mounted() { ... },
})
</script>                             </script>
```

**Indices rapides :**
- Tu vois `<script setup>` → c'est la **Composition API**
- Tu vois `export default defineComponent({` → c'est l'**Options API**
- Tu vois `this.` partout → c'est l'**Options API**

---

## Position de ce parcours

- ✅ **On code en Composition API** (`<script setup lang="ts">`)
- 👁️ On sait **lire** et **reconnaître** l'Options API (code existant en mission)
- 📝 Les exercices utilisent **exclusivement** la Composition API
- 🧘 Pas de stress : en pratiquant la Composition API, tu pourras
  facilement comprendre l'Options API si tu la croises

> 💡 **Pourquoi la Composition API ?**
> - Meilleur support TypeScript
> - Code mieux organisé quand le composant grandit
> - Pas de `this` (moins de bugs)
> - Possibilité de créer des **composables** (fonctions réutilisables)
> - C'est le standard recommandé par l'équipe Vue depuis Vue 3.2

---

## 🎯 Exercice pratique — Conversion

### Exercice O.1 — Convertis ce composant Options API en Composition API

```vue
<!-- Options API (à convertir) -->
<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
      count: 0,
      name: 'Vue'
    }
  },
  computed: {
    greeting(): string {
      return `Hello ${this.name}!`
    },
    doubleCount(): number {
      return this.count * 2
    }
  },
  methods: {
    increment(): void {
      this.count++
    },
    reset(): void {
      this.count = 0
    }
  },
  mounted() {
    console.log('Component mounted!')
  }
})
</script>

<template>
  <p>{{ greeting }}</p>
  <p>Count: {{ count }} (double: {{ doubleCount }})</p>
  <button @click="increment">+1</button>
  <button @click="reset">Reset</button>
</template>
```

Réécris-le en Composition API (`<script setup lang="ts">`) :

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// ??? Convertis data en refs
// ??? Convertis computed
// ??? Convertis methods en functions
// ??? Convertis mounted en onMounted
</script>
```

<details>
<summary>Solution</summary>

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// data → refs
const count = ref(0)
const name = ref('Vue')

// computed
const greeting = computed(() => `Hello ${name.value}!`)
const doubleCount = computed(() => count.value * 2)

// methods → functions
function increment(): void {
  count.value++
}

function reset(): void {
  count.value = 0
}

// mounted → onMounted
onMounted(() => {
  console.log('Component mounted!')
})
</script>
```

</details>

---

## Suite

→ Module 02 : `cours/02-intermediaire/01-composition-api-avancee.md`
