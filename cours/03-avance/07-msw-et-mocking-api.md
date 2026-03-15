# 07 — MSW avec Vue/Nuxt

---

> **Prérequis : Testing Course**
> Les fondamentaux de MSW (installation, handlers, server lifecycle, patterns de test) sont couverts en detail dans le **Testing Course** (module 08).
> Ce module se concentre uniquement sur l'**intégration MSW + Vue/Nuxt**.
>
> → [Testing Course — MSW Mock Service Worker](https://github.com/smaurier/testing-course)

---

## Objectifs

- Intégrer MSW avec les composables Vue (`useFetch`, `useAsyncData`)
- Configurer MSW pour le mode développement Nuxt
- Tester les composants Vue qui appellent des APIs

---

## MSW avec les composables Vue

### Tester un composant utilisant useFetch

```typescript
// components/UserList.vue
<script setup lang="ts">
const { data: users, pending, error } = await useFetch('/api/users');
</script>

<template>
  <div v-if="pending">Chargement...</div>
  <div v-else-if="error">Erreur : {{ error.message }}</div>
  <ul v-else>
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

```typescript
// components/UserList.test.ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import UserList from './UserList.vue';

const server = setupServer(
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('UserList', () => {
  it('should display users from API', async () => {
    const wrapper = mount(UserList);
    // Attendre le chargement
    await vi.waitFor(() => {
      expect(wrapper.findAll('li')).toHaveLength(2);
    });
    expect(wrapper.text()).toContain('Alice');
    expect(wrapper.text()).toContain('Bob');
  });

  it('should show error on API failure', async () => {
    server.use(
      http.get('/api/users', () => {
        return HttpResponse.error();
      })
    );

    const wrapper = mount(UserList);
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Erreur');
    });
  });
});
```

---

## MSW en mode développement Nuxt

```typescript
// plugins/msw.client.ts (Nuxt plugin)
export default defineNuxtPlugin(async () => {
  if (process.dev) {
    const { worker } = await import('~/mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
});
```

```typescript
// mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

```typescript
// mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'Alice (mock)' },
      { id: 2, name: 'Bob (mock)' },
    ]);
  }),
];
```

---

## Navigation

| Précédent | Suivant |
|-----------|---------|
| [06 — Tests E2E Playwright](./06-tests-e2e-playwright.md) | -- (Fin de la section avancee) |

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Exercice** : [15-app-multi-pages](../../exercices/15-app-multi-pages/ENONCE)
2. **Exercice** : [16-store-pinia](../../exercices/16-store-pinia/ENONCE)
3. **Exercice** : [17-tests-complets](../../exercices/17-tests-complets/ENONCE)
4. **Exercice** : [28-e2e-playwright](../../exercices/28-e2e-playwright/ENONCE)
5. **Renforcement** : [28b-msw-vitest](../../exercices/28b-msw-vitest/ENONCE)
:::
