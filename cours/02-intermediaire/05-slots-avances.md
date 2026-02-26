# 05 — Slots avances

## Rappel : slot par defaut

```vue
<!-- Card.vue -->
<template>
  <div class="card">
    <slot></slot>
  </div>
</template>

<!-- Parent -->
<Card>
  <p>Contenu injecte</p>
</Card>
```

## Slot avec contenu par defaut (fallback)

```vue
<!-- Button.vue -->
<template>
  <button class="btn">
    <slot>Cliquez ici</slot>
    <!-- fallback si rien n'est passe -->
  </button>
</template>

<!-- Parent -->
<Button />
<!-- Affiche "Cliquez ici" -->
<Button>Valider</Button>
<!-- Affiche "Valider" -->
```

## Slots nommes

```vue
<!-- PageLayout.vue -->
<template>
  <header class="header">
    <slot name="header"></slot>
  </header>
  <main class="content">
    <slot></slot>
  </main>
  <aside class="sidebar">
    <slot name="sidebar"></slot>
  </aside>
</template>

<!-- Parent -->
<PageLayout>
  <template #header>
    <h1>Mon App</h1>
  </template>

  <p>Contenu principal</p>

  <template #sidebar>
    <nav>Menu lateral</nav>
  </template>
</PageLayout>
```

`#header` est le raccourci de `v-slot:header`.

## Scoped slots — le pattern puissant

Le composant enfant **expose des donnees au parent** via le slot :

```vue
<!-- DataList.vue -->
<script setup lang="ts">
interface Props {
  items: any[];
}

const props = defineProps<Props>();
</script>

<template>
  <ul>
    <li v-for="(item, index) in props.items" :key="index">
      <slot :item="item" :index="index"></slot>
    </li>
  </ul>
</template>
```

```vue
<!-- Parent : le parent decide du rendu -->
<DataList :items="users">
  <template #default="{ item, index }">
    <span>{{ index + 1 }}. {{ item.name }} ({{ item.email }})</span>
  </template>
</DataList>
```

### Typer les scoped slots

```vue
<!-- DataList.vue -->
<script setup lang="ts" generic="T">
const props = defineProps<{
  items: T[];
}>();

defineSlots<{
  default(props: { item: T; index: number }): any;
}>();
</script>
```

## Cas concret : composant Table réutilisable

```vue
<!-- DataTable.vue -->
<script setup lang="ts" generic="T extends { id: number }">
interface Column<T> {
  key: keyof T;
  label: string;
}

const props = defineProps<{
  items: T[];
  columns: Column<T>[];
}>();

defineSlots<{
  cell(props: { item: T; column: Column<T>; value: T[keyof T] }): any;
  empty(): any;
}>();
</script>

<template>
  <table>
    <thead>
      <tr>
        <th v-for="col in columns" :key="String(col.key)">{{ col.label }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="items.length === 0">
        <td :colspan="columns.length">
          <slot name="empty">Aucune donnee</slot>
        </td>
      </tr>
      <tr v-for="item in items" :key="item.id">
        <td v-for="col in columns" :key="String(col.key)">
          <slot name="cell" :item="item" :column="col" :value="item[col.key]">
            {{ item[col.key] }}
          </slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>
```

```vue
<!-- Parent -->
<DataTable :items="products" :columns="columns">
  <template #cell="{ item, column, value }">
    <span v-if="column.key === 'price'">{{ value }} €</span>
    <span v-else-if="column.key === 'favorite'">{{ value ? '⭐' : '—' }}</span>
    <span v-else>{{ value }}</span>
  </template>

  <template #empty>
    <p>Aucun produit trouve.</p>
  </template>
</DataTable>
```

## Render functions (avance)

Pour des cas ou le template ne suffit pas :

```ts
import { h, defineComponent } from "vue";

export default defineComponent({
  props: {
    level: { type: Number, required: true },
    text: { type: String, required: true },
  },
  setup(props) {
    return () => h(`h${props.level}`, props.text);
  },
});
```

En pratique, les render functions sont rares. Utilise-les uniquement quand le template devient trop complexe.

## Exercice

→ `exercices/09-tableau-reutilisable/ENONCE.md`

## Suite

→ `cours/02-intermediaire/06-transitions-et-animations.md`
