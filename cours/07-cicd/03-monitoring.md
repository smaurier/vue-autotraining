# 03 — Monitoring et suivi des erreurs

## 📹 C'est quoi le monitoring ?

### Explication simple

Le **monitoring**, c'est **surveiller ton application** une fois qu'elle est en ligne
(en production), pour s'assurer qu'elle fonctionne bien.

> **Analogie** : C'est comme les **caméras de surveillance** dans un magasin 🏪.
> Tu ne peux pas être physiquement dans le magasin 24h/24, mais grâce aux caméras,
> tu vois ce qui se passe : est-ce que les clients trouvent ce qu'ils cherchent ?
> Est-ce que quelqu'un a un problème ? Est-ce qu'il y a un incident ?

### Pourquoi c'est important ?

Quand tu développes sur ton ordinateur, tu vois les erreurs immédiatement dans la console.
Mais en **production**, avec des dizaines/centaines d'utilisateurs :

- Tu ne vois **pas** les erreurs des utilisateurs
- Un bug peut toucher **certains navigateurs** mais pas d'autres
- L'app peut être **lente** pour des utilisateurs éloignés géographiquement
- Un pic de trafic peut **surcharger** le serveur

Le monitoring te permet de **détecter et résoudre les problèmes** avant que les utilisateurs
ne s'en plaignent.

### Les 3 piliers du monitoring

| Pilier | Ce que c'est | Analogie |
|--------|-------------|----------|
| **Error tracking** | Attraper les erreurs en production | 🚨 L'alarme incendie |
| **Performance** | Mesurer la vitesse de l'app | ⏱️ Le chronomètre |
| **Analytics** | Comprendre comment les utilisateurs utilisent l'app | 📊 Le compteur de visiteurs |

---

## 🚨 Error tracking avec Sentry

### C'est quoi Sentry ?

**Sentry** est un service qui **attrape automatiquement les erreurs** qui se produisent
dans ton app en production.

> **Analogie** : Imagine un **filet de sécurité** sous un trapéziste. Si ton code
> "tombe" (= une erreur se produit), Sentry attrape l'erreur et te prévient
> avec tous les détails : quel utilisateur, quel navigateur, quelle page, etc.
>
> Sans Sentry, l'utilisateur voit une page blanche ou un bug, et toi tu ne sais
> même pas que ça s'est passé. 😬

### Comment installer Sentry dans une app Vue 3

```bash
# On installe le package Sentry pour Vue
pnpm add @sentry/vue
```

```ts
// main.ts — le fichier d'entrée de notre app Vue 3
// C'est ici qu'on initialise Sentry au démarrage de l'app

// On importe Sentry
import * as Sentry from "@sentry/vue";
// On importe les outils Vue habituels
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

// On crée l'app Vue
const app = createApp(App);

// ── Configuration de Sentry ──────────────────────────────
Sentry.init({
  // L'app Vue à surveiller
  app,

  // "dsn" = l'adresse unique de ton projet Sentry
  // (comme un numéro de téléphone — Sentry sait où envoyer les erreurs)
  // ⚠️ On la met dans une variable d'environnement (pas en dur dans le code !)
  dsn: import.meta.env.VITE_SENTRY_DSN,

  // L'environnement actuel (development, staging, production)
  // Permet de filtrer les erreurs par environnement dans le dashboard Sentry
  environment: import.meta.env.MODE,

  // Active le suivi des performances de navigation
  // (combien de temps met chaque page à charger)
  integrations: [Sentry.browserTracingIntegration({ router })],

  // Enregistre 20% des visites pour le suivi de performance
  // (1.0 = 100%, 0.2 = 20% — on ne veut pas surcharger Sentry)
  tracesSampleRate: 0.2,

  // Si une erreur se produit, on enregistre TOUJOURS la session
  // (pour pouvoir rejouer ce que l'utilisateur a fait avant l'erreur)
  replaysOnErrorSampleRate: 1.0,
});

// On branche le routeur et on monte l'app (comme d'habitude)
app.use(router);
app.mount("#app");
```

### L'Error Boundary — attraper les erreurs dans un composant

> **C'est quoi ?** Un **Error Boundary** est un composant Vue qui "attrape"
> les erreurs de ses enfants et affiche un message d'erreur propre au lieu
> d'une page blanche.

> **Analogie** : C'est comme un **filet de sécurité** autour d'une zone.
> Si un composant enfant plante, au lieu de faire planter toute l'app,
> l'Error Boundary affiche un message "Oups, quelque chose s'est mal passé".

```vue
<!-- ErrorBoundary.vue — composant qui attrape les erreurs de ses enfants -->

<script setup lang="ts">
// Rappel : "import" permet de charger des outils depuis Vue
import { onErrorCaptured, ref } from "vue";

// On stocke l'erreur (null = pas d'erreur)
// ref() = variable réactive (Vue la surveille pour mettre à jour l'affichage)
const error = ref<Error | null>(null);

// onErrorCaptured = un "hook" Vue qui se déclenche quand un composant enfant a une erreur
// C'est comme un try/catch, mais pour les composants Vue
onErrorCaptured((err) => {
  // On stocke l'erreur pour l'afficher
  error.value = err;
  // "return false" = on empêche l'erreur de remonter plus haut
  // (sinon toute l'app pourrait planter)
  return false;
});
</script>

<template>
  <!-- Si une erreur existe → on affiche un message d'erreur -->
  <div v-if="error" class="error-boundary">
    <h2>Quelque chose s'est mal passé 😕</h2>
    <!-- On affiche le message de l'erreur -->
    <p>{{ error.message }}</p>
    <!-- Un bouton pour réessayer (remet l'erreur à null → le contenu réapparaît) -->
    <button @click="error = null">Réessayer</button>
  </div>

  <!-- Si pas d'erreur → on affiche le contenu normal (les composants enfants) -->
  <!-- <slot /> = "trou" où seront insérés les composants enfants -->
  <slot v-else />
</template>
```

**Comment l'utiliser :**

```vue
<!-- Dans un composant parent -->
<template>
  <!-- Tout ce qui est ENTRE les balises ErrorBoundary est protégé -->
  <ErrorBoundary>
    <!-- Si MonComposant plante, ErrorBoundary affiche un message d'erreur
         au lieu de faire planter toute l'app -->
    <MonComposant />
  </ErrorBoundary>
</template>
```

---

## ⏱️ Performance : les Web Vitals

### C'est quoi les Web Vitals ?

Les **Web Vitals** sont des **mesures de performance** définies par Google
pour évaluer l'expérience utilisateur sur un site web.

> **Analogie** : C'est comme les **indicateurs de santé** chez le médecin
> (tension, pouls, température). Les Web Vitals te disent si ton app est
> "en bonne santé" ou si elle a des problèmes de performance.

### Les métriques principales

| Métrique | Nom complet | Ce que ça mesure | Seuil acceptable |
|----------|------------|------------------|-----------------|
| **LCP** | Largest Contentful Paint | Temps avant que le contenu principal soit visible | < 2.5 secondes |
| **FID** | First Input Delay | Temps avant que l'app réagisse au premier clic | < 100 millisecondes |
| **CLS** | Cumulative Layout Shift | Est-ce que les éléments bougent/sautent pendant le chargement ? | < 0.1 |
| **FCP** | First Contentful Paint | Temps avant que quelque chose s'affiche | < 1.8 secondes |
| **TTFB** | Time To First Byte | Temps avant que le serveur réponde | < 800 millisecondes |

### Mesurer les Web Vitals dans ton app

```ts
// utils/webVitals.ts
// Ce fichier mesure les performances de l'app et les envoie à ton serveur

// On importe les fonctions de mesure depuis la librairie "web-vitals"
import { onCLS, onFID, onLCP, onFCP, onTTFB } from "web-vitals";

// On définit le type d'une métrique (nom + valeur numérique)
type Metric = { name: string; value: number };

// Fonction qui envoie une métrique à notre serveur
function sendMetric(metric: Metric): void {
  // sendBeacon = envoie des données au serveur sans bloquer la page
  // (même si l'utilisateur ferme l'onglet, les données sont envoyées)
  navigator.sendBeacon(
    "/api/metrics",              // L'URL de notre API qui reçoit les métriques
    JSON.stringify(metric),      // On convertit l'objet en texte JSON
  );
}

// Fonction à appeler au démarrage de l'app
export function initWebVitals(): void {
  // Chaque fonction mesure une métrique et appelle sendMetric automatiquement
  onCLS(sendMetric);   // Mesure la stabilité visuelle
  onFID(sendMetric);   // Mesure la réactivité au premier clic
  onLCP(sendMetric);   // Mesure le temps de chargement du contenu principal
  onFCP(sendMetric);   // Mesure le temps avant le premier affichage
  onTTFB(sendMetric);  // Mesure le temps de réponse du serveur
}
```

---

## 📝 Logging — les journaux de ton app

### C'est quoi le logging ?

Le **logging**, c'est **écrire un journal** de ce qui se passe dans ton app.

> **Analogie** : C'est comme le **journal de bord** d'un capitaine de bateau ⛵.
> Il note tout ce qui se passe : "10h : départ du port", "14h : tempête rencontrée",
> "15h : moteur en panne". Si quelque chose tourne mal, on peut relire le journal
> pour comprendre ce qui s'est passé.

### Rappel : `console.log` vs un vrai système de logs

En développement, tu utilises `console.log()` pour débugger. Mais en production :
- Les `console.log` **ne sont pas enregistrés** — ils disparaissent quand l'utilisateur ferme l'onglet
- Tu ne peux **pas les consulter** depuis ton ordinateur
- Il n'y a **pas de niveau d'importance** (info, warning, erreur)

Un système de logging structuré résout tout ça.

### Un logger structuré simple

```ts
// utils/logger.ts
// Un système de logs structuré pour notre app

// Les 3 niveaux de log (du moins grave au plus grave)
type LogLevel = "info" | "warn" | "error";
// "info"  = information normale (ex: "Utilisateur connecté")
// "warn"  = avertissement (ex: "Réponse API lente")
// "error" = erreur (ex: "Impossible de charger les données")

// La structure d'une entrée de log
interface LogEntry {
  level: LogLevel;                      // Le niveau (info, warn, error)
  message: string;                      // Le message humain
  context?: Record<string, unknown>;    // Des infos supplémentaires (optionnel)
  timestamp: string;                    // La date et l'heure exactes
}

// Fonction interne qui crée et envoie un log
function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
): void {
  // On crée l'entrée de log avec toutes les infos
  const entry: LogEntry = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),  // Ex: "2026-02-26T14:30:00.000Z"
  };

  // En développement → on affiche dans la console du navigateur
  if (import.meta.env.DEV) {
    // console[level] = console.info, console.warn, ou console.error
    console[level](entry);
  } else {
    // En production → on envoie au serveur de monitoring
    // (pour pouvoir consulter les logs depuis un dashboard)
    navigator.sendBeacon("/api/logs", JSON.stringify(entry));
  }
}

// On exporte un objet avec des méthodes pratiques
export const logger = {
  // logger.info("Utilisateur connecté", { userId: 42 })
  info: (msg: string, ctx?: Record<string, unknown>) => log("info", msg, ctx),
  // logger.warn("Réponse API lente", { duration: 3000 })
  warn: (msg: string, ctx?: Record<string, unknown>) => log("warn", msg, ctx),
  // logger.error("Échec du paiement", { orderId: 123, error: "timeout" })
  error: (msg: string, ctx?: Record<string, unknown>) => log("error", msg, ctx),
};
```

**Exemple d'utilisation dans un composant :**

```ts
import { logger } from "@/utils/logger";

// Quand l'utilisateur se connecte
logger.info("Utilisateur connecté", { userId: 42, email: "sophie@example.com" });

// Quand quelque chose est lent
logger.warn("Appel API lent", { url: "/api/products", duration: 3200 });

// Quand quelque chose échoue
logger.error("Erreur de chargement", { page: "/dashboard", status: 500 });
```

---

## 📊 Le tableau de bord : quoi surveiller ?

En production, voici les **métriques clés** à surveiller :

| Métrique | Ce que ça veut dire | Seuil acceptable | Si c'est au-dessus... |
|----------|--------------------|-----------------|-----------------------|
| **Error rate** | % de requêtes qui échouent | < 0.1% | Ton app a des bugs en production |
| **LCP** | Temps de chargement du contenu | < 2.5s | L'app est trop lente |
| **FID** | Temps de réaction au premier clic | < 100ms | L'app semble "gelée" |
| **CLS** | Éléments qui bougent pendant le chargement | < 0.1 | L'interface "saute" — mauvaise UX |
| **API response time (p95)** | Temps de réponse du serveur (pour 95% des requêtes) | < 500ms | Le backend est trop lent |

> **p95** signifie "95e percentile" — 95% des requêtes sont plus rapides que cette valeur.
> On utilise p95 plutôt que la moyenne car **une moyenne peut cacher des cas extrêmes**.

---

## 🎯 Par où commencer ? (Conseils pratiques)

Si tu débutes, voici l'ordre recommandé :

1. **Sentry** (gratuit en version basique) — le plus important. Attrape les erreurs automatiquement.
2. **Web Vitals** — Google les utilise pour le référencement (SEO). Ça vaut le coup.
3. **Logger structuré** — Quand ton app grandit, tu en auras besoin pour débugger.

> Ne te sens pas obligé(e) de tout mettre en place dès le premier jour.
> Commence par Sentry, et ajoute le reste progressivement. 👍

---

## 📝 Résumé

| Concept | Explication simple |
|---------|-------------------|
| **Monitoring** | Surveiller ton app en production (comme des caméras de sécurité) |
| **Sentry** | Service qui attrape les erreurs automatiquement et te prévient |
| **Error Boundary** | Composant Vue qui empêche une erreur d'enfant de casser toute l'app |
| **Web Vitals** | Mesures de performance (vitesse de chargement, réactivité) |
| **Logging** | Journal de bord de ton app (qui, quand, quoi, erreur ou pas) |
| **p95** | 95% des requêtes sont plus rapides que cette valeur |

---

## 🎯 Pratique

### Exercice MON.1 — Intégrer Sentry

Complète l'intégration de Sentry dans une app Vue :

```ts
// main.ts
import * as Sentry from '@sentry/vue'

const app = createApp(App)

// Initialise Sentry
Sentry.init({
  app,
  // DSN : l'adresse où envoyer les erreurs
  // ???
  
  // environnement : production, staging...
  // ???
})
```

<details>
<summary>Solution</summary>

```ts
Sentry.init({
  app,
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracesSampleRate: 0.1  // 10% des requêtes tracées
})
```
</details>

---

### Exercice MON.2 — Error Boundary

Crée un composant ErrorBoundary qui capture les erreurs de ses enfants :

```vue
<!-- ErrorBoundary.vue -->
<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)
const errorMessage = ref('')

// Capture les erreurs des composants enfants
// ???
</script>

<template>
  <div v-if="hasError" class="error">
    <p>Une erreur est survenue : {{ errorMessage }}</p>
    <button @click="hasError = false">Réessayer</button>
  </div>
  <slot v-else />
</template>
```

<details>
<summary>Solution</summary>

```vue
<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)
const errorMessage = ref('')

onErrorCaptured((error) => {
  hasError.value = true
  errorMessage.value = error.message
  return false  // empêche la propagation
})
</script>
```
</details>

---

### Exercice MON.3 — Web Vitals

Intègre la mesure des Web Vitals :

```ts
import { onLCP, onFID, onCLS } from 'web-vitals'

// Envoie les métriques à ton service d'analytics
function sendToAnalytics(metric: { name: string; value: number }) {
  // ???
}

// Mesure les 3 Core Web Vitals
// ???
```

<details>
<summary>Solution</summary>

```ts
import { onLCP, onFID, onCLS } from 'web-vitals'

function sendToAnalytics(metric: { name: string; value: number }) {
  console.log(`[Web Vitals] ${metric.name}: ${metric.value}`)
  // En production : envoyer à Google Analytics, Sentry, etc.
}

onLCP(sendToAnalytics)
onFID(sendToAnalytics)
onCLS(sendToAnalytics)
```
</details>

---

## Suite

→ `cours/08-api-typees/01-graphql-vue3.md`
