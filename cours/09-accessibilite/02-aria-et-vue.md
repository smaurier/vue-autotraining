# 02 — ARIA et Vue

## Quand utiliser ARIA ?

**Première règle d'ARIA : n'utilise pas ARIA si tu peux utiliser du HTML sémantique.**

```html
<!-- ❌ ARIA inutile -->
<div role="button" tabindex="0" aria-label="Fermer">X</div>

<!-- ✅ HTML semantique suffit -->
<button aria-label="Fermer">X</button>
```

ARIA est nécessaire quand :

- Tu crees un widget custom (dropdown, tabs, modal)
- Tu as des zones dynamiques (live regions)
- Le HTML sémantique seul ne suffit pas

## Attributs ARIA essentiels

### Labels

```vue
<!-- aria-label : label invisible (lecteurs d'ecran uniquement) -->
<button aria-label="Fermer le menu">✕</button>

<!-- aria-labelledby : reference un autre element -->
<h2 id="cart-title">Panier</h2>
<section aria-labelledby="cart-title">...</section>

<!-- aria-describedby : description supplementaire -->
<input aria-describedby="password-hint" type="password" />
<p id="password-hint">Minimum 8 caracteres</p>
```

### États

```vue
<button :aria-expanded="isOpen" @click="isOpen = !isOpen">
  Menu
</button>
<nav v-show="isOpen">...</nav>

<button :aria-pressed="isActive">Toggle</button>

<div :aria-busy="isLoading">
  <p v-if="isLoading">Chargement...</p>
</div>
```

### Live regions

```vue
<!-- Annonce dynamiquement les changements aux lecteurs d'ecran -->
<div aria-live="polite" aria-atomic="true">
  {{ notification }}
</div>

<!-- Pour les alertes urgentes -->
<div role="alert">
  {{ errorMessage }}
</div>
```

## Composants accessibles en Vue 3

### Modal accessible

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";

const props = defineProps<{
  open: boolean;
  title: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const closeButtonRef = ref<HTMLButtonElement | null>(null);

// Trap focus dans la modal
function handleKeydown(e: KeyboardEvent): void {
  if (e.key === "Escape") {
    emit("close");
  }
}

// Focus le premier element a l'ouverture
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      await nextTick();
      closeButtonRef.value?.focus();
      document.addEventListener("keydown", handleKeydown);
    } else {
      document.removeEventListener("keydown", handleKeydown);
    }
  },
);
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-overlay" @click.self="emit('close')">
      <div role="dialog" aria-modal="true" :aria-label="title" class="modal">
        <header>
          <h2>{{ title }}</h2>
          <button
            ref="closeButtonRef"
            aria-label="Fermer"
            @click="emit('close')"
          >
            ✕
          </button>
        </header>
        <div class="modal-body">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
```

### Tabs accessibles

```vue
<script setup lang="ts">
const tabs = ["Profil", "Parametres", "Notifications"];
const activeTab = ref(0);

function handleKeydown(e: KeyboardEvent, index: number): void {
  if (e.key === "ArrowRight") {
    activeTab.value = (index + 1) % tabs.length;
  } else if (e.key === "ArrowLeft") {
    activeTab.value = (index - 1 + tabs.length) % tabs.length;
  }
}
</script>

<template>
  <div>
    <div role="tablist">
      <button
        v-for="(tab, index) in tabs"
        :key="tab"
        role="tab"
        :aria-selected="activeTab === index"
        :tabindex="activeTab === index ? 0 : -1"
        @click="activeTab = index"
        @keydown="handleKeydown($event, index)"
      >
        {{ tab }}
      </button>
    </div>
    <div
      v-for="(tab, index) in tabs"
      :key="tab"
      v-show="activeTab === index"
      role="tabpanel"
      :aria-labelledby="`tab-${index}`"
    >
      <slot :name="tab.toLowerCase()" />
    </div>
  </div>
</template>
```

### Formulaire accessible

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <label for="email">Email</label>
      <input
        id="email"
        v-model="form.email"
        type="email"
        :aria-invalid="!!errors.email"
        :aria-describedby="errors.email ? 'email-error' : undefined"
      />
      <p v-if="errors.email" id="email-error" role="alert">
        {{ errors.email }}
      </p>
    </div>

    <button type="submit" :aria-busy="isSubmitting">
      {{ isSubmitting ? "Envoi..." : "Envoyer" }}
    </button>
  </form>
</template>
```

## Skip link

```vue
<!-- App.vue -->
<template>
  <a href="#main-content" class="skip-link"> Aller au contenu principal </a>
  <nav>...</nav>
  <main id="main-content">
    <RouterView />
  </main>
</template>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  z-index: 100;
}
.skip-link:focus {
  top: 0;
}
</style>
```

## Suite

→ `cours/09-accessibilite/03-audit-a11y.md`
