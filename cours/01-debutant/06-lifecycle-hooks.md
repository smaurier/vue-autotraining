# 06 — Lifecycle hooks

## Le cycle de vie d'un composant

```
Creation
  │
  ├── setup() ← tu es ici avec <script setup>
  │
  ├── onBeforeMount
  ├── onMounted        ← DOM disponible
  │
  ├── onBeforeUpdate   ← avant re-render
  ├── onUpdated        ← apres re-render
  │
  ├── onBeforeUnmount  ← avant destruction
  └── onUnmounted      ← composant detruit
```

## Les hooks principaux

### `onMounted` — le plus utilise

Exécuté quand le composant est insere dans le DOM :

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";

const data = ref<string[]>([]);
const inputRef = ref<HTMLInputElement | null>(null);

onMounted(() => {
  // Le DOM existe maintenant
  inputRef.value?.focus();

  // Fetch de donnees initiales
  fetch("/api/items")
    .then((res) => res.json())
    .then((items) => (data.value = items));
});
</script>

<template>
  <input ref="inputRef" />
</template>
```

### `onUnmounted` — nettoyage

Exécuté quand le composant est détruit :

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

let intervalId: ReturnType<typeof setInterval>;

onMounted(() => {
  intervalId = setInterval(() => {
    console.log("tick");
  }, 1000);
});

onUnmounted(() => {
  // Nettoie pour eviter les fuites memoire
  clearInterval(intervalId);
});
</script>
```

### `onBeforeUnmount` — dernier acces au DOM

```ts
onBeforeUnmount(() => {
  // Le DOM est encore la, utile pour cleanup de librairies tiers
  chart?.destroy();
});
```

### `onUpdated` — apres un re-render

```ts
onUpdated(() => {
  // Le DOM reflète les nouvelles données
  // ⚠️ Evite de modifier l'etat ici (boucle infinie)
});
```

## Pattern courant : setup + cleanup

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

function handleResize(): void {
  console.log(window.innerWidth);
}

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>
```

On verra plus tard comment extraire ca dans un composable (`useWindowResize`).

## Erreurs courantes

```ts
// ❌ Acceder au DOM avant onMounted
const el = document.querySelector(".my-class"); // peut etre null

// ✅ Attendre onMounted
onMounted(() => {
  const el = document.querySelector(".my-class");
});

// ❌ Oublier de nettoyer (event listeners, timers, subscriptions)
onMounted(() => {
  window.addEventListener("scroll", onScroll);
  // Si onUnmounted manque → fuite memoire
});
```

## Résumé

| Hook              | Quand             | Usage                         |
| ----------------- | ----------------- | ----------------------------- |
| `onMounted`       | DOM pret          | Fetch, focus, init librairies |
| `onUnmounted`     | Composant détruit | Cleanup (timers, listeners)   |
| `onBeforeUnmount` | Avant destruction | Dernier acces DOM             |
| `onUpdated`       | Apres re-render   | Scroll, mesures DOM           |

## Suite

→ `cours/01-debutant/07-options-vs-composition-api.md`
