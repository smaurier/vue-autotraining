# 03 — Monitoring et error tracking

## Pourquoi monitorer ?

En ESN, ton app est en production avec des vrais utilisateurs. Tu dois :

- Detecter les erreurs avant les utilisateurs
- Mesurer les performances reelles (RUM)
- Avoir des alertes automatiques

## Error tracking : Sentry

```bash
pnpm add @sentry/vue
```

```ts
// main.ts (Vue 3 SPA)
import * as Sentry from "@sentry/vue";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

const app = createApp(App);

Sentry.init({
  app,
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [Sentry.browserTracingIntegration({ router })],
  tracesSampleRate: 0.2, // 20% des transactions
  replaysOnErrorSampleRate: 1.0,
});

app.use(router);
app.mount("#app");
```

### Error boundary

```vue
<script setup lang="ts">
import { onErrorCaptured, ref } from "vue";

const error = ref<Error | null>(null);

onErrorCaptured((err) => {
  error.value = err;
  return false; // Empeche la propagation
});
</script>

<template>
  <div v-if="error" class="error-boundary">
    <h2>Quelque chose s'est mal passe</h2>
    <p>{{ error.message }}</p>
    <button @click="error = null">Reessayer</button>
  </div>
  <slot v-else />
</template>
```

## Performance monitoring (Web Vitals)

```ts
// utils/webVitals.ts
import { onCLS, onFID, onLCP, onFCP, onTTFB } from "web-vitals";

type Metric = { name: string; value: number };

function sendMetric(metric: Metric): void {
  // Envoie a ton backend analytics
  navigator.sendBeacon("/api/metrics", JSON.stringify(metric));
}

export function initWebVitals(): void {
  onCLS(sendMetric);
  onFID(sendMetric);
  onLCP(sendMetric);
  onFCP(sendMetric);
  onTTFB(sendMetric);
}
```

## Logging structure

```ts
// utils/logger.ts
type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
): void {
  const entry: LogEntry = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };

  if (import.meta.env.DEV) {
    console[level](entry);
  } else {
    // En prod : envoie au service de monitoring
    navigator.sendBeacon("/api/logs", JSON.stringify(entry));
  }
}

export const logger = {
  info: (msg: string, ctx?: Record<string, unknown>) => log("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => log("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log("error", msg, ctx),
};
```

## Health check dashboard

Metriques a surveiller en production :

| Metrique                       | Seuil acceptable |
| ------------------------------ | ---------------- |
| Error rate                     | < 0.1%           |
| LCP (Largest Contentful Paint) | < 2.5s           |
| FID (First Input Delay)        | < 100ms          |
| CLS (Cumulative Layout Shift)  | < 0.1            |
| API response time (p95)        | < 500ms          |

## Suite

→ `cours/08-api-typees/01-graphql-vue3.md`
