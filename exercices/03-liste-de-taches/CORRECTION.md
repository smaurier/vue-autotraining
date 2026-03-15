# Correction – Exercice 03 : Liste de Tâches

## Résultat attendu

Tu dois voir :
- Un **champ texte** + bouton **« Ajouter »** pour créer une tâche
- **3 boutons filtre** : Toutes / Actives / Terminées (le bouton actif est mis en valeur)
- La **liste des tâches** filtrée selon le filtre choisi
- Chaque tâche a : une **case à cocher** (✓ si terminée), le **texte** (barré si terminée), et un **bouton supprimer**
- En bas : **« X tâche(s) restante(s) »** (compte seulement les tâches non terminées)
- Appuyer sur **Entrée** dans le champ texte ajoute aussi la tâche
- On ne peut pas ajouter une tâche avec un texte vide

---

## Structure des fichiers

```
03-liste-de-taches/
├── TodoList.vue      ← composant principal
└── types.ts          ← types TypeScript (déjà fourni)
```

---

## types.ts (rappel, déjà fourni)

```ts
// FilterType est un "union type" : la variable ne peut valoir QUE l'une de ces trois chaînes.
// Cela évite les fautes de frappe et TypeScript nous prévient si on écrit autre chose.
export type FilterType = "all" | "active" | "done";

// Une interface décrit la "forme" d'un objet.
// Chaque tâche DOIT avoir ces 3 propriétés avec ces types précis.
export interface Todo {
  id: number;    // Identifiant unique (pour :key et pour retrouver la tâche)
  text: string;  // Le texte de la tâche
  done: boolean; // true = terminée, false = active
}
```

---

## Code corrigé complet — TodoList.vue

```vue
<!-- TodoList.vue -->
<!-- Composant complet de liste de tâches en Vue 3 Composition API -->

<script setup lang="ts">
// ─────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────

import { ref, computed } from "vue";
// On importe nos types depuis le fichier types.ts du même dossier
// Le mot-clé "type" précise qu'on importe UNIQUEMENT le type (pas du code qui s'exécute)
import type { Todo, FilterType } from "./types";

// ─────────────────────────────────────────────
// ÉTAT RÉACTIF
// ─────────────────────────────────────────────

// La liste complète des tâches.
// ref<Todo[]>([]) : un tableau réactif de Todo, initialement vide.
// On précise <Todo[]> pour que TypeScript sache ce que contient le tableau.
const todos = ref<Todo[]>([]);

// Le texte saisi dans le champ de saisie, lié avec v-model.
const newText = ref("");

// Le filtre actuellement actif. On commence par afficher "toutes" les tâches.
const filter = ref<FilterType>("all");

// Un compteur pour générer des IDs uniques.
// On incrémente ce nombre à chaque ajout → chaque tâche a un ID différent.
// On ne peut pas utiliser l'index du tableau comme ID car il change quand on supprime !
let nextId = 1;

// ─────────────────────────────────────────────
// VALEURS CALCULÉES (computed)
// ─────────────────────────────────────────────

// filteredTodos : la liste à afficher selon le filtre choisi.
// Se recalcule automatiquement quand todos ou filter changent.
const filteredTodos = computed(() => {
  // On utilise un switch pour tester la valeur de filter.value
  // C'est plus lisible qu'une série de if/else if quand on a plusieurs cas.
  switch (filter.value) {
    case "active":
      // filter() retourne un nouveau tableau avec seulement les éléments qui passent le test.
      // Ici on garde uniquement les tâches dont done === false (pas encore terminées).
      return todos.value.filter((todo) => !todo.done);

    case "done":
      // On garde uniquement les tâches terminées (done === true).
      return todos.value.filter((todo) => todo.done);

    default: // case "all"
      // On retourne toutes les tâches sans filtrer.
      return todos.value;
  }
});

// remainingCount : le nombre de tâches NON terminées.
// filter() compte les tâches ou done est false, puis .length donne le nombre.
const remainingCount = computed(() => {
  return todos.value.filter((todo) => !todo.done).length;
});

// ─────────────────────────────────────────────
// FONCTIONS
// ─────────────────────────────────────────────

// addTodo() : ajoute une nouvelle tâche à la liste.
function addTodo() {
  // trim() supprime les espaces au début et à la fin du texte.
  // Exemple : "  bonjour  ".trim() → "bonjour"
  // Si le texte est vide (ou que des espaces), on ne fait rien.
  if (newText.value.trim() === "") return; // "return" seul sort de la fonction immédiatement

  // On ajoute un nouvel objet Todo au tableau avec push().
  // push() ajoute un élément à la FIN du tableau.
  todos.value.push({
    id: nextId++,              // On utilise nextId puis on l'incrémente (nextId += 1)
    text: newText.value.trim(), // On trim() encore pour enlever les espaces superflus
    done: false,               // Une nouvelle tâche est toujours "active" (non terminée)
  });

  // On vide le champ de saisie après l'ajout.
  // Puisque newText est lié avec v-model, vider newText.value vide aussi le champ HTML.
  newText.value = "";
}

// toggleTodo() : bascule l'état d'une tâche (active ↔ terminée).
// On reçoit l'id de la tâche à modifier.
function toggleTodo(id: number) {
  // find() parcourt le tableau et retourne le PREMIER élément qui correspond au test.
  // Si aucun élément ne correspond, find() retourne undefined.
  const todo = todos.value.find((t) => t.id === id);

  // On vérifie que la tâche existe avant de la modifier (bonne pratique).
  if (todo) {
    // L'opérateur ! inverse un booléen : true devient false, false devient true.
    todo.done = !todo.done;
    // Vue détecte automatiquement ce changement car todos est réactif.
  }
}

// deleteTodo() : supprime une tâche de la liste.
function deleteTodo(id: number) {
  // filter() crée un NOUVEAU tableau sans l'élément à supprimer.
  // On garde tout sauf la tâche dont l'id correspond.
  // On réassigne le résultat à todos.value pour mettre à jour la ref.
  todos.value = todos.value.filter((todo) => todo.id !== id);
  // !== signifie "différent de" (l'opposé de ===)
}
</script>

<template>
  <div class="todo-app">
    <h1>Liste de tâches</h1>

    <!-- ──── FORMULAIRE D'AJOUT ──── -->

    <div class="add-todo">
      <!-- v-model lie le champ texte à la ref newText en temps réel -->
      <!-- @keyup.enter appelle addTodo() quand on appuie sur Entrée -->
      <!-- .enter est un "modificateur" : il filtre l'événement pour ne réagir qu'à la touche Entrée -->
      <input
        v-model="newText"
        @keyup.enter="addTodo"
        type="text"
        placeholder="Nouvelle tâche..."
      />

      <!-- @click appelle addTodo() quand on clique sur le bouton -->
      <button @click="addTodo">Ajouter</button>
    </div>

    <!-- ──── BOUTONS FILTRE ──── -->

    <div class="filters">
      <!-- On a 3 boutons, un pour chaque valeur possible de FilterType -->
      <!-- :class ajoute dynamiquement la classe "active" quand ce filtre est sélectionné -->
      <!-- La syntaxe { "active": condition } ajoute la classe "active" si la condition est vraie -->
      <button
        :class="{ active: filter === 'all' }"
        @click="filter = 'all'"
      >
        Toutes
      </button>

      <button
        :class="{ active: filter === 'active' }"
        @click="filter = 'active'"
      >
        Actives
      </button>

      <button
        :class="{ active: filter === 'done' }"
        @click="filter = 'done'"
      >
        Terminées
      </button>
    </div>

    <!-- ──── LISTE DES TÂCHES ──── -->

    <!-- v-if / v-else : affiche soit la liste, soit un message "vide" -->
    <!-- On utilise filteredTodos (le computed) et non todos directement -->
    <!-- car la liste affichée dépend du filtre actif -->
    <ul v-if="filteredTodos.length > 0">

      <!-- v-for répète un <li> pour chaque tâche dans filteredTodos -->
      <!-- :key="todo.id" utilise l'ID unique de la tâche (PAS l'index du tableau !) -->
      <!-- :class="{ done: todo.done }" ajoute la classe "done" si la tâche est terminée -->
      <li
        v-for="todo in filteredTodos"
        :key="todo.id"
        :class="{ done: todo.done }"
      >

        <!-- La case à cocher est liée à todo.done avec v-model -->
        <!-- Quand on coche/décoche, todo.done change automatiquement -->
        <!-- MAIS on pourrait aussi utiliser @change="toggleTodo(todo.id)" -->
        <!-- Les deux approches fonctionnent, v-model est plus concis -->
        <input
          type="checkbox"
          :checked="todo.done"
          @change="toggleTodo(todo.id)"
        />
        <!-- Note : on utilise :checked + @change plutôt que v-model car v-model sur un objet
             dans un tableau peut parfois ne pas déclencher la réactivité Vue correctement -->

        <!-- Le texte de la tâche -->
        <!-- La classe "done" via le li parent suffit pour le barrer avec CSS -->
        <span>{{ todo.text }}</span>

        <!-- Bouton supprimer -->
        <!-- @click.stop empêche l'événement de "remonter" aux éléments parents (bubbling) -->
        <!-- Ici ce n'est pas strictement nécessaire mais c'est une bonne habitude -->
        <button @click="deleteTodo(todo.id)" class="delete-btn">✕</button>

      </li>
    </ul>

    <!-- v-else s'affiche quand la condition du v-if est fausse (liste vide) -->
    <p v-else class="empty-message">Aucune tâche à afficher.</p>

    <!-- ──── COMPTEUR DE TÂCHES RESTANTES ──── -->

    <!-- On n'affiche le compteur que s'il y a au moins 1 tâche dans la liste totale -->
    <footer v-if="todos.length > 0">
      <!-- remainingCount est le computed qui compte les tâches non terminées -->
      <!-- On utilise une expression ternaire pour accorder "tâche" au pluriel -->
      {{ remainingCount }}
      {{ remainingCount <= 1 ? "tâche restante" : "tâches restantes" }}
    </footer>

  </div>
</template>

<style scoped>
.todo-app {
  max-width: 500px;
  margin: 2rem auto;
  padding: 1.5rem;
  font-family: sans-serif;
}

.add-todo {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.add-todo input {
  flex: 1; /* Prend tout l'espace disponible */
  padding: 0.5rem;
  font-size: 1rem;
}

.filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.filters button {
  padding: 0.3rem 0.8rem;
  cursor: pointer;
  border: 1px solid #ccc;
  background: white;
  border-radius: 4px;
}

/* La classe .active est ajoutée dynamiquement avec :class */
.filters button.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

ul {
  list-style: none; /* Supprime les puces par défaut */
  padding: 0;
  margin: 0;
}

li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
}

/* La classe .done est ajoutée quand todo.done === true */
li.done span {
  text-decoration: line-through; /* Texte barré */
  color: #9ca3af; /* Gris pour les tâches terminées */
}

.delete-btn {
  margin-left: auto; /* Pousse le bouton vers la droite */
  background: none;
  border: none;
  cursor: pointer;
  color: #ef4444;
  font-size: 1rem;
}

footer {
  margin-top: 1rem;
  color: #6b7280;
  font-size: 0.9rem;
}

.empty-message {
  color: #9ca3af;
  text-align: center;
  font-style: italic;
}
</style>
```

---

## Ce que tu aurais pu oublier

### 1. Utiliser l'index comme `:key` dans `v-for`
```html
<!-- ❌ FAUX : si on supprime la tâche n°2, les index changent → comportement bizarre -->
<li v-for="(todo, index) in todos" :key="index">

<!-- ✅ CORRECT : l'ID est stable et unique, il ne change pas -->
<li v-for="todo in todos" :key="todo.id">
```
> L'index change quand on supprime un élément. Si l'index est la clé, Vue peut "confondre" les éléments et mal gérer les animations, les inputs, etc. **Toujours utiliser un ID stable.**

---

### 2. Modifier directement un objet dans un tableau ref
```ts
// ❌ Parfois problématique : trouver puis modifier directement
const todo = todos.value.find(t => t.id === id);
todo.done = !todo.done; // Vue devrait détecter ça, mais...

// ✅ Plus explicite et toujours fiable avec findIndex + spread
const index = todos.value.findIndex(t => t.id === id);
if (index !== -1) {
  todos.value[index] = { ...todos.value[index], done: !todos.value[index].done };
}
// { ...objet, propriété: nouvelleValeur } crée un NOUVEL objet (spread operator)
// Vue détecte plus facilement le changement car c'est un nouvel objet

// ✅ Ou simplement (Vue 3 détecte très bien les mutations directes sur un ref de tableau) :
const todo = todos.value.find(t => t.id === id);
if (todo) todo.done = !todo.done;
```

---

### 3. Oublier de vider `newText` après l'ajout
```ts
// ❌ FAUX : le texte reste dans le champ après l'ajout
function addTodo() {
  todos.value.push({ id: nextId++, text: newText.value, done: false });
  // oubli de réinitialiser newText !
}

// ✅ CORRECT
function addTodo() {
  todos.value.push({ id: nextId++, text: newText.value.trim(), done: false });
  newText.value = ""; // Vide le champ
}
```

---

### 4. Appliquer le filtre directement sur `todos` au lieu d'utiliser un `computed`
```ts
// ❌ FAUX : créer une fonction qu'on appelle dans le template
// Le filtrage se rejoue à chaque re-render, même si rien n'a changé
function getFiltered() {
  return todos.value.filter(...)
}

// ✅ CORRECT : computed est mis en cache
// Il ne se recalcule QUE quand todos ou filter changent
const filteredTodos = computed(() => {
  // ...
});
```
> Un `computed` est "mis en cache" : Vue garde le résultat en mémoire et ne le recalcule que si les données dont il dépend ont changé. Une fonction classique, elle, est recalculée à chaque fois.

---

### 5. Autoriser l'ajout de tâches vides
```ts
// ❌ FAUX : une tâche avec juste des espaces peut être ajoutée
function addTodo() {
  if (newText.value === "") return; // "" ne capture pas "   "
  todos.value.push(...)
}

// ✅ CORRECT : trim() avant de vérifier
function addTodo() {
  if (newText.value.trim() === "") return; // "   ".trim() === ""
  todos.value.push({ text: newText.value.trim(), ... })
}
```

---

### 6. Confondre `v-if` et `v-show`
```html
<!-- v-if : L'élément n'existe PAS dans le DOM si la condition est fausse -->
<!-- À utiliser quand l'élément est rarement affiché -->
<ul v-if="filteredTodos.length > 0"> ... </ul>

<!-- v-show : L'élément existe TOUJOURS dans le DOM, mais est caché avec CSS -->
<!-- À utiliser quand l'élément bascule souvent entre visible/caché -->
<ul v-show="filteredTodos.length > 0"> ... </ul>
```
> Pour une liste de tâches, `v-if` est plus approprié car quand la liste est vide, on veut afficher un message différent avec `v-else`.

---

## Concepts clés utilisés

| Concept | Ce que ça fait |
|---|---|
| `ref<Todo[]>([])` | Tableau réactif avec type TypeScript explicite |
| `computed` | Liste filtrée calculée automatiquement, mise en cache |
| `array.filter()` | Retourne un nouveau tableau contenant seulement les éléments qui passent le test |
| `array.find()` | Retourne le premier élément qui correspond, ou `undefined` |
| `array.push()` | Ajoute un élément à la fin du tableau |
| `v-model` | Liaison bidirectionnelle input ↔ variable |
| `v-for` + `:key` | Répète un élément pour chaque item, avec ID stable |
| `v-if` / `v-else` | Affichage conditionnel (l'élément n'existe pas dans le DOM) |
| `:class="{ nom: condition }"` | Ajoute une classe CSS dynamiquement selon une condition |
| `@keyup.enter` | Écoute la touche Entrée sur un champ texte |
| `!valeur` | Inverse un booléen (`true` → `false`, `false` → `true`) |
| `!==` | "Différent de" (opposé de `===` "strictement égal à") |
