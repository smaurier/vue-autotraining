# 04 — Événements et v-model

## Gérer les événements

```vue
<script setup lang="ts">
function handleClick(event: MouseEvent): void {
  console.log("Clic a", event.clientX, event.clientY);
}
</script>

<template>
  <button @click="handleClick">Clic</button>
</template>
```

L'objet `event` est automatiquement passe comme premier argument.

### Passer des arguments

```vue
<script setup lang="ts">
function deleteItem(id: number): void {
  // ...
}
</script>

<template>
  <!-- Avec arrow function pour passer un argument -->
  <button @click="deleteItem(item.id)">Supprimer</button>

  <!-- Si tu as aussi besoin de l'event -->
  <button @click="(e) => handleAction(item.id, e)">Action</button>
</template>
```

### Modificateurs utiles

```vue
<!-- Empeche le submit de recharger la page -->
<form @submit.prevent="onSubmit">

<!-- Arrete la propagation aux parents -->
<div @click.stop="onDivClick">

<!-- Execute une seule fois -->
<button @click.once="initialize">

<!-- Combinaison -->
<form @submit.prevent.once="onFirstSubmit">
```

### Événements clavier

```vue
<input @keyup.enter="submit" />
<input @keyup.escape="cancel" />
<input @keydown.ctrl.s="save" />
```

## `v-model` — liaison bidirectionnelle

`v-model` synchronise une variable reactive avec un élément de formulaire.

### Input texte

```vue
<script setup lang="ts">
const name = ref<string>("");
</script>

<template>
  <input v-model="name" placeholder="Ton nom" />
  <p>Tu as tape : {{ name }}</p>
</template>
```

`v-model` est un raccourci pour :

```vue
<input
  :value="name"
  @input="name = ($event.target as HTMLInputElement).value"
/>
```

### Textarea

```vue
<textarea v-model="description"></textarea>
```

### Checkbox

```vue
<script setup lang="ts">
const isAccepted = ref<boolean>(false);
const selectedFruits = ref<string[]>([]);
</script>

<template>
  <!-- Boolean unique -->
  <input type="checkbox" v-model="isAccepted" />

  <!-- Tableau de valeurs (checkboxes multiples) -->
  <label>
    <input type="checkbox" v-model="selectedFruits" value="pomme" /> Pomme
  </label>
  <label>
    <input type="checkbox" v-model="selectedFruits" value="banane" /> Banane
  </label>
  <!-- selectedFruits = ['pomme'] si pomme est cochee -->
</template>
```

### Radio

```vue
<script setup lang="ts">
const picked = ref<string>("");
</script>

<template>
  <label><input type="radio" v-model="picked" value="a" /> Option A</label>
  <label><input type="radio" v-model="picked" value="b" /> Option B</label>
</template>
```

### Select

```vue
<script setup lang="ts">
type Priority = "low" | "medium" | "high";
const priority = ref<Priority>("medium");
</script>

<template>
  <select v-model="priority">
    <option value="low">Basse</option>
    <option value="medium">Moyenne</option>
    <option value="high">Haute</option>
  </select>
</template>
```

### Modificateurs de `v-model`

```vue
<!-- Convertit en number -->
<input v-model.number="age" type="number" />

<!-- Trim les espaces -->
<input v-model.trim="name" />

<!-- Met a jour sur change (pas input) -->
<input v-model.lazy="search" />
```

## `v-model` sur un composant custom

On verra ca en detail dans le cours sur les composants, mais voici le principe :

```vue
<!-- Parent -->
<MyInput v-model="name" />

<!-- Equivalent a -->
<MyInput :modelValue="name" @update:modelValue="name = $event" />
```

## Résumé

| Concept         | Syntaxe                 |
| --------------- | ----------------------- |
| Événement click | `@click="handler"`      |
| Avec argument   | `@click="handler(arg)"` |
| Prevent default | `@submit.prevent`       |
| Input texte     | `v-model="variable"`    |
| Checkbox bool   | `v-model="boolRef"`     |
| Select          | `v-model="selected"`    |
| Trim            | `v-model.trim`          |
| Number          | `v-model.number`        |

## Suite

→ `cours/01-debutant/05-composants-props-emits.md`
