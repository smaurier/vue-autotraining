# 02 — Pages et layouts

## Routing base sur les fichiers

```
pages/
  index.vue          → /
  about.vue          → /about
  contact.vue        → /contact
  blog/
    index.vue        → /blog
    [slug].vue       → /blog/:slug
  users/
    index.vue        → /users
    [id].vue         → /users/:id
    [id]/
      edit.vue       → /users/:id/edit
  [...slug].vue      → catch-all (404)
```

## Page basique

```vue
<!-- pages/index.vue -->
<script setup lang="ts">
// Pas besoin d'importer ref, computed, etc. (auto-imports)
const count = ref(0);
</script>

<template>
  <div>
    <h1>Accueil</h1>
    <p>Compteur: {{ count }}</p>
    <button @click="count++">+1</button>
  </div>
</template>
```

## Page dynamique

```vue
<!-- pages/users/[id].vue -->
<script setup lang="ts">
const route = useRoute();
const userId = computed(() => Number(route.params.id));

const { data: user } = await useFetch(`/api/users/${userId.value}`);
</script>

<template>
  <div v-if="user">
    <h1>{{ user.name }}</h1>
    <p>{{ user.email }}</p>
  </div>
</template>
```

## Layouts

```vue
<!-- layouts/default.vue -->
<template>
  <div class="layout">
    <header>
      <nav>
        <NuxtLink to="/">Accueil</NuxtLink>
        <NuxtLink to="/about">A propos</NuxtLink>
      </nav>
    </header>

    <main>
      <slot />
      <!-- Le contenu de la page -->
    </main>

    <footer>© 2026</footer>
  </div>
</template>
```

```vue
<!-- layouts/admin.vue -->
<template>
  <div class="admin-layout">
    <aside>Menu admin</aside>
    <main><slot /></main>
  </div>
</template>
```

### Utiliser un layout spécifique

```vue
<!-- pages/admin/index.vue -->
<script setup lang="ts">
definePageMeta({
  layout: "admin",
});
</script>
```

## Middleware

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated.value && to.path !== "/login") {
    return navigateTo("/login");
  }
});
```

```vue
<!-- Appliquer a une page -->
<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});
</script>
```

### Middleware global

```ts
// middleware/auth.global.ts (suffixe .global)
export default defineNuxtRouteMiddleware((to) => {
  // S'applique a TOUTES les pages
});
```

## Navigation

```vue
<template>
  <!-- Lien declaratif -->
  <NuxtLink to="/about">A propos</NuxtLink>

  <!-- Programmatique -->
  <button @click="navigateTo('/dashboard')">Dashboard</button>
</template>
```

## Suite

→ `cours/05-nuxt3/03-data-fetching.md`
