# 02 — Template et directives

## Qu'est-ce qu'une directive ?

Une directive est un attribut special prefixe par `v-`. Elle dit a Vue comment manipuler le DOM.

## `v-if` / `v-else-if` / `v-else` — rendu conditionnel

```vue
<script setup lang="ts">
import { ref } from "vue";

type Status = "loading" | "error" | "success";
const status = ref<Status>("loading");
</script>

<template>
  <p v-if="status === 'loading'">Chargement...</p>
  <p v-else-if="status === 'error'">Erreur !</p>
  <p v-else>Donnees chargees</p>
</template>
```

**`v-if` retire l'élément du DOM.** Il n'existe pas tant que la condition est fausse.

## `v-show` — afficher/masquer

```vue
<template>
  <p v-show="isVisible">Je suis la (mais parfois cache)</p>
</template>
```

**Difference avec `v-if` :** `v-show` garde l'élément dans le DOM et toggle `display: none`.

|               | `v-if`                     | `v-show`        |
| ------------- | -------------------------- | --------------- |
| Cout initial  | Faible si faux             | Toujours rendu  |
| Cout toggle   | Eleve (create/destroy)     | Faible (CSS)    |
| Utilise quand | Condition rarement togglee | Toggle frequent |

## `v-for` — boucle

```vue
<script setup lang="ts">
interface Todo {
  id: number;
  label: string;
  done: boolean;
}

const todos = ref<Todo[]>([
  { id: 1, label: "Apprendre Vue", done: false },
  { id: 2, label: "Lire le cours", done: true },
]);
</script>

<template>
  <ul>
    <li v-for="todo in todos" :key="todo.id">
      {{ todo.label }}
    </li>
  </ul>
</template>
```

### `:key` est obligatoire

`:key` aide Vue a identifier chaque élément. **Toujours utiliser un identifiant unique** (jamais l'index sauf cas trivial).

```vue
<!-- ✅ -->
<li v-for="item in items" :key="item.id">

<!-- ❌ Evite -->
<li v-for="(item, index) in items" :key="index">
```

### Boucle avec index

```vue
<li v-for="(todo, index) in todos" :key="todo.id">
  {{ index + 1 }}. {{ todo.label }}
</li>
```

### Boucle sur un objet

```vue
<div v-for="(value, key) in { name: 'Alice', age: 30 }" :key="key">
  {{ key }}: {{ value }}
</div>
```

## `v-bind` — lier des attributs (raccourci `:`)

```vue
<script setup lang="ts">
const imageUrl = ref<string>("/photo.jpg");
const isDisabled = ref<boolean>(true);
</script>

<template>
  <!-- Forme longue -->
  <img v-bind:src="imageUrl" />

  <!-- Raccourci (utilise toujours ca) -->
  <img :src="imageUrl" />
  <button :disabled="isDisabled">Clic</button>
</template>
```

### Bind de classes dynamiques

```vue
<template>
  <!-- Objet : cle = classe, valeur = condition -->
  <div :class="{ active: isActive, disabled: isDisabled }">

  <!-- Tableau -->
  <div :class="[baseClass, isActive ? 'active' : '']">

  <!-- Avec computed (recommande pour logique complexe) -->
  <div :class="cardClasses">
</template>

<script setup lang="ts">
const cardClasses = computed(() => ({
  'card': true,
  'card--active': isActive.value,
  'card--error': hasError.value,
}))
</script>
```

### Bind de styles dynamiques

```vue
<template>
  <div :style="{ color: textColor, fontSize: size + 'px' }">
</template>
```

## `v-on` — écouter des événements (raccourci `@`)

```vue
<template>
  <!-- Forme longue -->
  <button v-on:click="handleClick">Clic</button>

  <!-- Raccourci (utilise toujours ca) -->
  <button @click="handleClick">Clic</button>

  <!-- Expression inline -->
  <button @click="count++">+1</button>
</template>
```

### Modificateurs d'événements

```vue
<!-- Empeche le comportement par defaut -->
<form @submit.prevent="onSubmit">

<!-- Arrete la propagation -->
<button @click.stop="doSomething">

<!-- Ecoute une seule fois -->
<button @click.once="init">

<!-- Touche specifique -->
<input @keyup.enter="submit">
<input @keyup.escape="cancel">
```

## `v-text` et `v-html`

```vue
<!-- Equivalent de {{ message }} -->
<p v-text="message"></p>

<!-- Rendu HTML brut (⚠️ risque XSS, evite si possible) -->
<p v-html="htmlContent"></p>
```

## Résumé des directives

| Directive | Raccourci | Role                            |
| --------- | --------- | ------------------------------- |
| `v-if`    | —         | Rendu conditionnel              |
| `v-show`  | —         | Afficher/masquer (CSS)          |
| `v-for`   | —         | Boucle                          |
| `v-bind`  | `:`       | Lier un attribut                |
| `v-on`    | `@`       | Écouter un événement            |
| `v-model` | —         | Two-way binding (cours suivant) |

## Suite

→ `cours/01-debutant/03-reactivite.md`
