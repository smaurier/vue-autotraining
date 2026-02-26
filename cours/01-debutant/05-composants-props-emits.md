# 05 — Composants, props et emits

## Pourquoi decouper en composants ?

- **Reutilisation** : un composant = une piece réutilisable
- **Lisibilite** : chaque fichier a un seul role
- **Testabilite** : on peut tester chaque composant isolement
- **Maintenabilite** : modification locale sans casser le reste

## Creer et utiliser un composant

```vue
<!-- components/UserCard.vue -->
<script setup lang="ts">
interface Props {
  name: string;
  email: string;
}

const props = defineProps<Props>();
</script>

<template>
  <div class="card">
    <h3>{{ props.name }}</h3>
    <p>{{ props.email }}</p>
  </div>
</template>
```

```vue
<!-- ParentPage.vue -->
<script setup lang="ts">
import UserCard from "./components/UserCard.vue";
</script>

<template>
  <UserCard name="Alice" email="alice@example.com" />
</template>
```

## Props — passer des donnees parent → enfant

### Syntaxe type-only (recommandee)

```vue
<script setup lang="ts">
interface Props {
  title: string;
  count: number;
  items: string[];
  variant?: "primary" | "secondary"; // optionnelle
}

const props = defineProps<Props>();
</script>
```

### Avec valeurs par defaut

```vue
<script setup lang="ts">
interface Props {
  title: string;
  count?: number;
  showIcon?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
  showIcon: true,
});
</script>
```

### Passer des props dynamiques

```vue
<template>
  <!-- String statique -->
  <UserCard name="Alice" />

  <!-- Valeur dynamique (bind) -->
  <UserCard :name="userName" />
  <UserCard :count="items.length" />

  <!-- Boolean: presence = true -->
  <UserCard show-icon />
  <UserCard :show-icon="false" />
</template>
```

### Règle : les props sont read-only

```ts
// ❌ INTERDIT - ne modifie jamais une prop
props.count = 5;

// ✅ Si besoin, cree une copie locale
const localCount = ref(props.count);
```

## Emits — envoyer des événements enfant → parent

### Declarer les emits

```vue
<!-- ChildComponent.vue -->
<script setup lang="ts">
const emit = defineEmits<{
  (event: "update", value: string): void;
  (event: "delete", id: number): void;
  (event: "close"): void;
}>();

function handleSave(): void {
  emit("update", "nouvelle valeur");
}

function handleDelete(): void {
  emit("delete", 42);
}
</script>

<template>
  <button @click="handleSave">Sauver</button>
  <button @click="handleDelete">Supprimer</button>
  <button @click="emit('close')">Fermer</button>
</template>
```

### Écouter les emits cote parent

```vue
<!-- Parent.vue -->
<script setup lang="ts">
import ChildComponent from "./ChildComponent.vue";

function onUpdate(value: string): void {
  console.log("Mis a jour:", value);
}

function onDelete(id: number): void {
  console.log("Supprime:", id);
}
</script>

<template>
  <ChildComponent
    @update="onUpdate"
    @delete="onDelete"
    @close="showModal = false"
  />
</template>
```

## Le pattern parent/enfant

```
Parent (source de verite)
  │
  ├── Props ↓ (donnees)
  │
  Child (affichage + interactions)
  │
  └── Emits ↑ (evenements)
```

**Le parent possede les donnees. L'enfant les affiche et remonte les actions.**

## `v-model` sur composant

`v-model` fonctionne aussi sur tes composants :

```vue
<!-- Parent -->
<CustomInput v-model="username" />

<!-- Equivalent a -->
<CustomInput :modelValue="username" @update:modelValue="username = $event" />
```

```vue
<!-- CustomInput.vue -->
<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();

function onInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.value);
}
</script>

<template>
  <input :value="modelValue" @input="onInput" />
</template>
```

### v-model nomme (Vue 3.4+)

```vue
<!-- Parent -->
<UserForm v-model:firstName="first" v-model:lastName="last" />
```

```vue
<!-- UserForm.vue -->
<script setup lang="ts">
const firstName = defineModel<string>("firstName");
const lastName = defineModel<string>("lastName");
</script>

<template>
  <input v-model="firstName" />
  <input v-model="lastName" />
</template>
```

## Slots — injecter du contenu

```vue
<!-- Card.vue -->
<template>
  <div class="card">
    <slot></slot>
    <!-- Le parent injecte du contenu ici -->
  </div>
</template>
```

```vue
<!-- Parent -->
<Card>
  <h2>Mon titre</h2>
  <p>Mon contenu</p>
</Card>
```

### Slots nommes

```vue
<!-- Layout.vue -->
<template>
  <header><slot name="header"></slot></header>
  <main><slot></slot></main>
  <footer><slot name="footer"></slot></footer>
</template>
```

```vue
<!-- Parent -->
<Layout>
  <template #header>
    <h1>Titre</h1>
  </template>

  <p>Contenu principal</p>

  <template #footer>
    <p>Pied de page</p>
  </template>
</Layout>
```

## Exercice

→ `exercices/04-catalogue-produits/ENONCE.md`

## Suite

→ `cours/01-debutant/06-lifecycle-hooks.md`
