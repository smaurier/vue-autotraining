# 06 — Transitions et animations

## `<Transition>` — animer l'entree/sortie d'un élément

```vue
<template>
  <button @click="show = !show">Toggle</button>

  <Transition name="fade">
    <p v-if="show">Je suis la !</p>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

### Classes CSS generees

| Classe                | Quand              |
| --------------------- | ------------------ |
| `{name}-enter-from`   | Debut de l'entree  |
| `{name}-enter-active` | Pendant l'entree   |
| `{name}-enter-to`     | Fin de l'entree    |
| `{name}-leave-from`   | Debut de la sortie |
| `{name}-leave-active` | Pendant la sortie  |
| `{name}-leave-to`     | Fin de la sortie   |

### Slide + fade

```css
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
```

### Mode de transition

```vue
<!-- Par defaut, entree et sortie sont simultanees -->
<!-- Avec mode="out-in", l'ancien sort AVANT que le nouveau entre -->
<Transition name="fade" mode="out-in">
  <component :is="currentView" />
</Transition>
```

## `<TransitionGroup>` — animer des listes

```vue
<script setup lang="ts">
import { ref } from "vue";

interface Item {
  id: number;
  text: string;
}

const items = ref<Item[]>([
  { id: 1, text: "Premier" },
  { id: 2, text: "Deuxieme" },
]);

let nextId = 3;

function addItem(): void {
  items.value.push({ id: nextId++, text: `Item ${nextId}` });
}

function removeItem(id: number): void {
  items.value = items.value.filter((item) => item.id !== id);
}
</script>

<template>
  <button @click="addItem">Ajouter</button>

  <TransitionGroup name="list" tag="ul">
    <li v-for="item in items" :key="item.id">
      {{ item.text }}
      <button @click="removeItem(item.id)">×</button>
    </li>
  </TransitionGroup>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
/* Animation FLIP pour le repositionnement */
.list-move {
  transition: transform 0.4s ease;
}
/* Fix pour que les elements sortants ne poussent pas les autres */
.list-leave-active {
  position: absolute;
}
</style>
```

## Transitions JavaScript (hooks)

Pour des animations complexes (librairies comme GSAP) :

```vue
<Transition
  @before-enter="onBeforeEnter"
  @enter="onEnter"
  @leave="onLeave"
  :css="false"
>
  <div v-if="show">Contenu</div>
</Transition>

<script setup lang="ts">
function onBeforeEnter(el: Element): void {
  (el as HTMLElement).style.opacity = "0";
}

function onEnter(el: Element, done: () => void): void {
  // Animation avec requestAnimationFrame, GSAP, etc.
  const htmlEl = el as HTMLElement;
  htmlEl.style.transition = "opacity 0.5s";
  htmlEl.style.opacity = "1";
  setTimeout(done, 500);
}

function onLeave(el: Element, done: () => void): void {
  const htmlEl = el as HTMLElement;
  htmlEl.style.transition = "opacity 0.3s";
  htmlEl.style.opacity = "0";
  setTimeout(done, 300);
}
</script>
```

## Bonnes pratiques

1. Utilise `mode="out-in"` pour éviter les éléments superposés
2. Toujours un `:key` unique sur les éléments de `<TransitionGroup>`
3. Préfère les transitions CSS (plus performantes que JS)
4. Évite d'animer `width`/`height` (préfère `transform` et `opacity`)
5. Utilise `will-change: transform` pour les animations frequentes

## Suite

→ Module 03 : `cours/03-avance/01-vue-router.md`
