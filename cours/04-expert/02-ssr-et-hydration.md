# 02 — SSR et hydration

## Les modes de rendu

| Mode                     | Acronyme | Ou le HTML est généré      | SEO | Interactivite           |
| ------------------------ | -------- | -------------------------- | --- | ----------------------- |
| Client-Side Rendering    | CSR      | Navigateur                 | ❌  | Rapide apres chargement |
| Server-Side Rendering    | SSR      | Serveur (a chaque requête) | ✅  | Apres hydration         |
| Static Site Generation   | SSG      | Build time                 | ✅  | Apres hydration         |
| Incremental Static Regen | ISR      | Build + revalidation       | ✅  | Apres hydration         |

## Comment SSR fonctionne

```
1. Navigateur demande /about
2. Serveur Node execute Vue, genere le HTML complet
3. Serveur envoie le HTML au navigateur (affichage immediat)
4. Le navigateur charge le JS (bundle Vue)
5. Vue "hydrate" le HTML existant (attache les event listeners)
6. L'app devient interactive
```

## SSR avec Vue 3 (sans Nuxt)

```ts
// server.ts
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import App from "./App.vue";

export async function render(): Promise<string> {
  const app = createSSRApp(App);
  const html = await renderToString(app);
  return html;
}
```

```ts
// entry-client.ts
import { createSSRApp } from "vue";
import App from "./App.vue";

const app = createSSRApp(App);
app.mount("#app"); // Hydrate le HTML existant
```

## Erreurs d'hydration (mismatch)

Le HTML serveur **doit etre identique** au HTML que Vue genererait cote client.

### Causes frequentes

```vue
<!-- ❌ Date differente serveur vs client -->
<p>{{ new Date().toLocaleString() }}</p>

<!-- ✅ Fixer une date cote serveur -->
<script setup lang="ts">
const date = ref<string>("");
onMounted(() => {
  date.value = new Date().toLocaleString();
});
</script>
<p>{{ date }}</p>
```

```vue
<!-- ❌ Contenu conditionnel base sur window -->
<p v-if="window.innerWidth > 768">Desktop</p>

<!-- ✅ Detecter apres mount -->
<script setup lang="ts">
const isDesktop = ref(false);
onMounted(() => {
  isDesktop.value = window.innerWidth > 768;
});
</script>
```

### Règle : tout ce qui depend du navigateur → `onMounted`

## Nuxt 3 (framework SSR recommande)

Nuxt 3 gère automatiquement :

- SSR / SSG / ISR
- Routing base sur les fichiers
- Auto-imports
- Data fetching server-side

Voir module 05 pour le detail complet.

## Data fetching en SSR

```vue
<!-- Nuxt 3 : useAsyncData execute cote serveur -->
<script setup lang="ts">
const { data: posts } = await useAsyncData("posts", () => $fetch("/api/posts"));
</script>
```

Sans Nuxt, tu dois implementer un système de :

1. Fetch des donnees cote serveur
2. Serialisation dans le HTML (`<script>window.__DATA__ = ...</script>`)
3. Hydration des stores cote client

## Quand utiliser SSR ?

| Projet                  | Mode recommande               |
| ----------------------- | ----------------------------- |
| Dashboard admin interne | CSR (pas besoin de SEO)       |
| Site vitrine / blog     | SSG                           |
| E-commerce              | SSR ou ISR                    |
| SaaS applicatif         | CSR                           |
| Documentation           | SSG (VitePress, Nuxt Content) |

## En contexte ESN

- **La plupart des missions ESN** sont des dashboards/back-office → **CSR suffit**
- SSR est demande pour les projets **SEO-critical** (e-commerce, sites publics)
- Savoir expliquer les tradeoffs en entretien = point fort

## Suite

→ `cours/04-expert/03-architecture-front.md`
