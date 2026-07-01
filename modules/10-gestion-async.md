---
titre: Gestion de l'asynchrone
cours: 02-vue
notions: [états loading error data, async dans setup, await de premier niveau et Suspense, composant async defineAsyncComponent, annulation avec AbortController, race conditions et garde de dernière requête, retry et backoff, gestion d'erreur onErrorCaptured]
outcomes:
  - sait modéliser proprement les états d'un appel async (idle/loading/error/data)
  - sait charger des données au montage et afficher les états dans le template
  - sait éviter une race condition (ignorer une réponse périmée) et annuler une requête
  - sait charger un composant à la demande avec defineAsyncComponent (et Suspense en survol)
prerequis: [09-composables]
next: 11-formulaires-et-validation
libs: [{ name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — chargement async des données de la famille (états loading/error/empty du dashboard, annulation au changement de famille)
last-reviewed: 2026-07
---

# Gestion de l'asynchrone

> **Outcomes — tu sauras FAIRE :** modéliser les 4 états d'un appel réseau (idle/loading/error/data), charger des données au montage avec affichage correct des états, annuler une requête en cours avec `AbortController`, ignorer une réponse périmée (garde anti-race), charger un composant à la demande avec `defineAsyncComponent`.
> **Difficulté :** :star::star::star:

## 1. Cas concret d'abord

Tu arrives sur le dashboard TribuZen. La page doit afficher les données de la famille sélectionnée. Le PM te montre ce composant déjà en prod :

```vue
<!-- FamilyDashboard.vue — version naïve (3 bugs) -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const family = ref(null)   // ← Ref<null> — TypeScript ne sait rien du contenu futur

onMounted(async () => {
  const res = await fetch('/api/family/current')
  family.value = await res.json()  // ← si le réseau est lent ? si serveur répond 500 ?
})                                 // ← si l'user change de famille pendant le fetch ?
</script>

<template>
  <!-- ← family est null jusqu'à la réponse — accès à .name plante -->
  <h1>{{ family.name }}</h1>
  <ul>
    <li v-for="m in family.members" :key="m.id">{{ m.name }}</li>
  </ul>
</template>
```

**Trois bugs en vingt lignes :**

1. **États invisibles** — pendant le chargement, le template plante (`family` est `null`) ou affiche un écran vide sans indication. L'utilisateur ne sait pas si l'app est cassée ou lente.
2. **Erreur réseau avalée** — si le serveur répond `500`, `res.json()` peut échouer. Aucun `try/catch`, aucun message d'erreur affiché.
3. **Race condition** — si l'utilisateur change de famille avant que la première réponse arrive, deux requêtes coexistent. La plus lente peut écraser la réponse de la plus rapide — mauvaise famille affichée.

Ce module te donne les outils pour régler les trois.

---

## 2. Théorie complète, concise

### 2.1 Les 4 états d'un appel async

Tout appel réseau traverse exactement quatre états :

| État | Signification | Ce que l'UI doit montrer |
|------|--------------|--------------------------|
| `idle` | Aucune requête déclenchée | Rien — état initial |
| `loading` | Requête en cours | Spinner ou squelette |
| `error` | La requête a échoué | Message d'erreur + bouton retry |
| `data` | Réponse reçue avec succès | Le contenu (+ empty state si liste vide) |

**Modèle "3 refs" — simple, idiomatique Vue :**

```ts
const loading = ref(false)
const error   = ref<string | null>(null)
const data    = ref<FamilyData | null>(null)
// idle = état initial implicite (loading false, error null, data null)
```

**Modèle "discriminated union" — robuste, états impossibles éliminés :**

```ts
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'data'; value: T }

const state = ref<AsyncState<FamilyData>>({ status: 'idle' })
```

Le modèle discriminated union interdit les états impossibles (`loading: true` ET `error` non nul simultanément) mais demande plus de verbosité dans le template (`state.value.status === 'data' && state.value.value.name`). Ce module utilise les 3 refs — plus direct et courant dans les codebases Vue.

### 2.2 Async dans `setup()` — la voie sûre

La règle : ne jamais mettre un `await` directement à la racine de `<script setup>` sans `<Suspense>` intentionnel (voir § 2.3). La voie sûre pour charger des données au montage :

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const data    = ref<FamilyData | null>(null)
const loading = ref(false)
const error   = ref<string | null>(null)

// ✅ onMounted avec callback async — sûr, ne rend pas le composant "async"
// Le composant se monte et rend immédiatement (loading = true → spinner visible)
onMounted(async () => {
  loading.value = true
  error.value   = null
  try {
    const res = await fetch('/api/family/current')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    data.value = await res.json() as FamilyData
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erreur inconnue'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-if="loading">Chargement…</div>
  <div v-else-if="error">{{ error }}</div>
  <div v-else-if="data">{{ data.name }}</div>
</template>
```

Le template bascule immédiatement sur le spinner dès le montage — l'utilisateur voit l'état de chargement.

### 2.3 `await` de premier niveau et `<Suspense>` (experimental)

Vue 3 autorise un `await` à la **racine** de `<script setup>` :

```vue
<!-- ⚠️ Top-level await — rend le composant "async" -->
<script setup lang="ts">
const res  = await fetch('/api/family/current')
const data = await res.json() as FamilyData
// Le composant ne monte QUE quand ces awaits sont résolus
// → pas de spinner, pas d'état intermédiaire sans Suspense
</script>
```

Sans `<Suspense>`, le parent ne sait pas que le composant est en attente — l'interface reste simplement vide. Avec `<Suspense>` dans le parent, le slot `#fallback` gère la phase d'attente :

```vue
<!-- Parent -->
<Suspense>
  <template #default>
    <FamilyDashboard />
  </template>
  <template #fallback>
    <div>Chargement du dashboard…</div>
  </template>
</Suspense>
```

> **⚠️ `<Suspense>` est encore expérimental en Vue 3.5.** L'API peut changer dans une version future. Pour du code de production stable, préférer le pattern `onMounted` + 3 refs (§ 2.2). Adopter `<Suspense>` seulement si tu acceptes le risque de migration. ⚠️ Vérifier Context7 (`/vue`) avant d'adopter en prod.

### 2.4 Composant asynchrone — `defineAsyncComponent`

`defineAsyncComponent` résout un problème **différent** de l'async data : il **reporte le téléchargement du bundle JavaScript** d'un composant lourd jusqu'à ce qu'il soit nécessaire. Il ne charge pas des données — il charge du code.

```ts
import { defineAsyncComponent } from 'vue'

// ✅ Le bundle de HeavyChart.vue n'est téléchargé qu'à l'affichage
const HeavyChart = defineAsyncComponent({
  loader:           () => import('./HeavyChart.vue'),
  loadingComponent: ChartSkeleton,   // Affiché pendant le chargement du bundle
  errorComponent:   ChartError,      // Affiché si le chargement échoue
  delay:   200,    // ms avant d'afficher loadingComponent (évite le flash sur réseau rapide)
  timeout: 8_000,  // ms max avant de basculer sur errorComponent
})
```

Utilisation dans le template — aucune configuration `<Suspense>` requise :

```vue
<template>
  <!-- HeavyChart est chargé à la demande, géré en interne par defineAsyncComponent -->
  <HeavyChart :data="chartData" />
</template>
```

Avec `<Suspense>` (optionnel, experimental — le `#fallback` remplace `loadingComponent`) :

```vue
<Suspense>
  <HeavyChart :data="chartData" />
  <template #fallback>
    <ChartSkeleton />
  </template>
</Suspense>
```

**À retenir :** `defineAsyncComponent` = lazy-loading du **code** d'un composant (bundle splitting). Async data dans `setup()` = chargement des **données** réseau. Les deux sont orthogonaux et peuvent coexister.

### 2.5 Annulation — `AbortController`

`AbortController` permet d'interrompre une requête `fetch` en cours. Le mécanisme : on passe `controller.signal` à `fetch()` ; quand `abort()` est appelé, la requête est annulée et le `catch` reçoit une `DOMException` avec `name === 'AbortError'`.

```ts
import { onMounted, onUnmounted } from 'vue'

let controller: AbortController | null = null

onMounted(async () => {
  controller = new AbortController()
  loading.value = true
  try {
    const res = await fetch('/api/family/current', {
      signal: controller.signal,   // ← lien entre fetch et le contrôleur
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    data.value = await res.json() as FamilyData
  } catch (e) {
    // ✅ AbortError = annulation volontaire — ignorer silencieusement
    if (e instanceof DOMException && e.name === 'AbortError') return
    // Toute autre erreur → stocker pour affichage
    error.value = e instanceof Error ? e.message : 'Erreur inconnue'
  } finally {
    loading.value = false
  }
})

// ✅ Annuler à la destruction du composant — libère la ressource réseau
// et évite de mettre à jour l'état d'un composant démonté
onUnmounted(() => {
  controller?.abort()
})
```

### 2.6 Race conditions — garde "dernière requête gagne"

**Problème :** l'utilisateur clique sur "Famille A" puis "Famille B" rapidement. Deux requêtes partent. Si la réponse de A arrive après celle de B, elle écrase les données de B — la mauvaise famille est affichée.

**Solution A — AbortController (annulation active, recommandée) :**

```ts
let controller: AbortController | null = null

async function loadFamily(familyId: string): Promise<void> {
  // ✅ Annuler la requête précédente avant d'en lancer une nouvelle
  controller?.abort()
  controller = new AbortController()

  loading.value = true
  error.value   = null
  data.value    = null

  try {
    const res = await fetch(`/api/family/${familyId}`, {
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    data.value = await res.json() as FamilyData
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return
    error.value = e instanceof Error ? e.message : 'Erreur inconnue'
  } finally {
    // ✅ Ne baisser loading QUE si cette requête n'a pas été annulée
    // (si annulée, une requête plus récente est déjà en loading)
    if (controller && !controller.signal.aborted) {
      loading.value = false
    }
  }
}
```

**Solution B — garde requestId (ignorer les réponses périmées) :**

```ts
let lastRequestId = 0

async function loadFamily(familyId: string): Promise<void> {
  const requestId = ++lastRequestId  // ID unique, croissant — snapshot du compteur
  loading.value   = true
  error.value     = null

  try {
    const res  = await fetch(`/api/family/${familyId}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json() as FamilyData

    // ✅ N'appliquer que si c'est encore la dernière requête lancée
    if (requestId === lastRequestId) {
      data.value    = json
      loading.value = false
    }
    // Sinon : ignorer — une requête plus récente a déjà pris la main
  } catch (e) {
    if (requestId === lastRequestId) {
      error.value   = e instanceof Error ? e.message : 'Erreur inconnue'
      loading.value = false
    }
  }
}
```

**Quelle approche choisir ?** AbortController est préférable — il libère réellement les ressources réseau. La garde `requestId` est un bon fallback quand la source de données ne supporte pas l'annulation (XMLHttpRequest legacy, certains wrappers tiers, SDK qui n'expose pas de `signal`).

### 2.7 Retry et backoff exponentiel

**Retry simple :** réessayer après un délai fixe. Risque de surcharge si de nombreux clients réessaient simultanément.

**Backoff exponentiel :** doubler le délai à chaque tentative — `baseDelay × 2ⁿ`. Réduit la pression sur un serveur qui récupère d'un incident.

```ts
async function fetchWithBackoff<T>(
  fetcher:    () => Promise<T>,
  maxRetries = 3,
  baseDelay  = 500,  // ms — donne 500ms, 1s, 2s pour 3 tentatives
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetcher()
    } catch (err) {
      if (attempt === maxRetries - 1) throw err  // Dernière tentative — propager

      // Backoff exponentiel : 500 → 1000 → 2000 ms
      const delay = baseDelay * 2 ** attempt
      await new Promise<void>(resolve => setTimeout(resolve, delay))
    }
  }
  // TypeScript : chemin théoriquement inaccessible — le for lève ou retourne avant
  throw new Error('fetchWithBackoff — chemin inaccessible')
}
```

Utilisation :

```ts
// 3 tentatives max, backoff 500ms → 1s → 2s
const family = await fetchWithBackoff(
  () => fetch('/api/family/current').then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<FamilyData>
  }),
)
```

> **Jitter :** en production avec de nombreux clients simultanés, ajouter un délai aléatoire (`delay + Math.random() * delay`) pour éviter que tous réessaient exactement au même instant après un incident (thundering herd).

### 2.8 `onErrorCaptured` — intercepter les erreurs depuis le parent

`onErrorCaptured` est un lifecycle hook enregistré dans un composant **parent** pour intercepter les erreurs émises par ses **descendants** (enfants, petits-enfants…). Il capte notamment les erreurs async des composants enveloppés dans `<Suspense>` — c'est le mécanisme d'"Error Boundary" de Vue.

```vue
<!-- ErrorBoundary.vue — composant générique réutilisable -->
<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const capturedError = ref<Error | null>(null)

onErrorCaptured((err, _instance, info) => {
  // err    — l'erreur levée
  // info   — la phase Vue concernée ('setup', 'render', 'onMounted'…)
  capturedError.value = err instanceof Error ? err : new Error(String(err))
  console.error('[ErrorBoundary]', info, err)

  // Retourner false = STOPPER la propagation vers les parents de ce composant
  // Retourner true ou undefined = laisser l'erreur remonter
  return false
})
</script>

<template>
  <div v-if="capturedError" class="error-boundary">
    <p>Une erreur est survenue — {{ capturedError.message }}</p>
    <button @click="capturedError = null">Réessayer</button>
  </div>
  <slot v-else />
</template>
```

Utilisation — combinaison `ErrorBoundary` + `Suspense` :

```vue
<!-- DashboardPage.vue -->
<ErrorBoundary>
  <Suspense>
    <template #default>
      <FamilyDashboard />
    </template>
    <template #fallback>
      <div>Chargement…</div>
    </template>
  </Suspense>
</ErrorBoundary>
```

`onErrorCaptured` n'est pas réservé à `<Suspense>` — il intercepte aussi les erreurs dans les lifecycle hooks, les event handlers synchrones et les render functions des descendants.

---

## 3. Worked examples

### Exemple 1 — Composable `useAsyncData` minimal avec annulation

Ce composable encapsule le pattern "3 refs + AbortController" pour le rendre réutilisable dans n'importe quel composant, avec n'importe quelle source de données.

```ts
// composables/useAsyncData.ts
import { ref, onUnmounted } from 'vue'
import type { Ref } from 'vue'

interface UseAsyncDataReturn<T> {
  data:    Ref<T | null>
  loading: Ref<boolean>
  error:   Ref<string | null>
  execute: () => Promise<void>
  cancel:  () => void
}

export function useAsyncData<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
): UseAsyncDataReturn<T> {
  const data    = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error   = ref<string | null>(null)

  let controller: AbortController | null = null

  async function execute(): Promise<void> {
    // Annuler la requête précédente si encore en cours
    controller?.abort()
    controller = new AbortController()

    loading.value = true
    error.value   = null

    try {
      data.value = await fetcher(controller.signal)
    } catch (e) {
      // AbortError = annulation volontaire — ne pas traiter comme erreur
      if (e instanceof DOMException && e.name === 'AbortError') return
      error.value = e instanceof Error ? e.message : 'Erreur inconnue'
    } finally {
      // Baisser loading seulement si cette requête n'a pas été annulée
      if (controller && !controller.signal.aborted) {
        loading.value = false
      }
    }
  }

  function cancel(): void {
    controller?.abort()
  }

  // Annulation automatique à la destruction du composant appelant
  onUnmounted(cancel)

  return { data, loading, error, execute, cancel }
}
```

### Exemple 2 — `FamilyDashboard.vue` utilisant le composable

```vue
<!-- FamilyDashboard.vue -->
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useAsyncData } from '@/composables/useAsyncData'

interface FamilyMember {
  id:   string
  name: string
  role: 'admin' | 'member'
}

interface FamilyData {
  id:      string
  name:    string
  members: FamilyMember[]
}

// Famille sélectionnée — viendrait de useRoute().params.familyId en prod
const selectedFamilyId = ref('family-1')

// Le composable retourne 3 refs + execute() — aucune logique d'annulation à gérer ici
const { data: family, loading, error, execute } = useAsyncData<FamilyData>(
  async (signal) => {
    const res = await fetch(`/api/family/${selectedFamilyId.value}`, { signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<FamilyData>
  },
)

// Charger au montage
onMounted(execute)

// Recharger à chaque changement — execute() annule la requête précédente en interne
watch(selectedFamilyId, execute)
</script>

<template>
  <div class="dashboard">
    <!-- État loading -->
    <p v-if="loading">Chargement de la famille…</p>

    <!-- État error + bouton retry -->
    <div v-else-if="error">
      <p class="error">{{ error }}</p>
      <button @click="execute">Réessayer</button>
    </div>

    <!-- État data -->
    <template v-else-if="family">
      <h1>{{ family.name }}</h1>

      <!-- Empty state — distinct du state "data null" -->
      <p v-if="family.members.length === 0" class="empty">
        Aucun membre pour l'instant.
      </p>
      <ul v-else>
        <li v-for="m in family.members" :key="m.id">
          {{ m.name }}
          <span v-if="m.role === 'admin'" class="badge">Admin</span>
        </li>
      </ul>

      <button @click="selectedFamilyId = 'family-2'">Changer de famille</button>
    </template>
  </div>
</template>
```

**Ce que ce composant garantit :**
- `execute()` annule la requête précédente avant d'en lancer une nouvelle — pas de race condition.
- `onUnmounted` dans le composable annule automatiquement si l'utilisateur quitte la page.
- L'empty state (`family.members.length === 0`) est explicite — pas confondu avec `family === null`.
- Le bouton "Réessayer" appelle `execute()` — la même fonction que le chargement initial.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Mettre à jour l'état après démontage

```ts
// ❌ Si l'utilisateur quitte la page avant la fin du fetch,
// le composant est démonté mais data.value = ... s'exécute quand même
onMounted(async () => {
  const res = await fetch('/api/family/current')
  data.value = await res.json()  // ← composant peut déjà être détruit ici
})
```

Vue 3 ne lève pas d'avertissement pour ça (contrairement à React), mais c'est une fuite mémoire potentielle et peut produire des mises à jour fantômes si le composant est recyclé.

```ts
// ✅ Annuler dans onUnmounted via AbortController
// useAsyncData intègre ce pattern — onUnmounted(cancel) est dans le composable
```

### PIÈGE #2 — Race condition sans garde

```ts
// ❌ Deux appels rapides → deux requêtes en vol simultanément
// La réponse la plus lente peut arriver en dernier et écraser la bonne
async function loadFamily(id: string) {
  data.value = await fetch(`/api/family/${id}`).then(r => r.json())
}

// ✅ AbortController (annule la requête précédente)
// ✅ Garde requestId (ignore la réponse si une plus récente a déjà répondu)
```

Le symptôme est difficile à reproduire en dev (latence locale très faible) mais se manifeste sur réseau lent ou avec des API de cache/CDN à latence variable.

### PIÈGE #3 — Avaler les erreurs dans le catch

```ts
// ❌ L'erreur est consommée silencieusement
// L'utilisateur voit un écran vide sans explication
try {
  data.value = await fetch('/api/family/current').then(r => r.json())
} catch {
  // vide — aucune trace pour l'utilisateur, aucune en console
}

// ✅ Toujours stocker dans error.value et afficher dans le template
} catch (e) {
  error.value = e instanceof Error ? e.message : 'Erreur inconnue'
}
// + dans le template : <div v-else-if="error">{{ error }}</div>
```

Exception légitime : `AbortError` — elle est volontaire et peut être ignorée silencieusement (§ 2.5).

---

## 5. Ancrage TribuZen

Le pattern async de ce module s'applique à deux couches du front-office TribuZen :

**`useAsyncData.ts`** — composable partagé dans `src/composables/`. Réutilisé par `FamilyDashboard.vue` (données de la famille active), `ActivityFeed.vue` (historique des activités) et `BalanceSummary.vue` (totaux financiers). Un seul composable, trois contextes.

**`FamilyDashboard.vue`** — composant central de `src/views/FamilyPage.vue`. Charge les données de la famille active (membres, activités, solde). Utilise `useAsyncData` + `watch(selectedFamilyId, execute)` pour gérer le changement de famille sans race condition. C'est le premier composant que l'utilisateur voit après connexion.

`defineAsyncComponent` entre en jeu pour `SpendingChart.vue` (graphique mensuel), chargé à la demande uniquement quand l'utilisateur ouvre le panneau analytique — évite d'inclure le bundle Chart.js dans le bundle initial.

```
tribuzen/
  src/
    composables/
      useAsyncData.ts            ← Exemple 1 de ce module
    views/
      FamilyPage.vue
    components/
      family/
        FamilyDashboard.vue      ← Exemple 2 de ce module
        ActivityFeed.vue         ← réutilise useAsyncData
        BalanceSummary.vue       ← réutilise useAsyncData
      charts/
        SpendingChart.vue        ← chargé via defineAsyncComponent
```

---

## 6. Points clés

1. Tout appel async a 4 états — `idle` / `loading` / `error` / `data`. Les 3 refs (`loading`, `error`, `data`) en sont le modèle idiomatique Vue.
2. Charger des données dans `onMounted(async () => {...})` — le composant monte immédiatement et rend le spinner. Ne jamais mettre de top-level `await` sans `<Suspense>` intentionnel.
3. `<Suspense>` est encore **expérimental** en Vue 3.5 — préférer `onMounted` + 3 refs pour la prod.
4. `defineAsyncComponent` = lazy-loading du **bundle JS** d'un composant. Différent du chargement de données — les deux peuvent coexister.
5. `AbortController` annule une requête en cours — passer `signal` à `fetch()` et ignorer les `AbortError` dans le `catch`.
6. La race condition se résout par annulation active (`AbortController`) ou par garde `requestId` (ignorer les réponses périmées).
7. Le backoff exponentiel double le délai entre tentatives (`baseDelay × 2ⁿ`) — réduit la pression sur un serveur qui récupère d'une surcharge.
8. `onErrorCaptured` dans un parent intercepte les erreurs des descendants — pattern "Error Boundary" pour `<Suspense>` et lifecycle hooks.

---

## 7. Seeds Anki

```
Quels sont les 4 états d'un appel async à toujours modéliser ?|idle (initial), loading (requête en cours), error (échec), data (succès). En Vue on les représente avec 3 refs : loading/error/data — idle est l'état initial implicite (tout à false/null).
Pourquoi ne pas mettre un await de premier niveau dans script setup sans Suspense ?|Le composant devient "async" et ne rend rien jusqu'à la résolution des awaits. Sans Suspense dans le parent, l'utilisateur voit un écran blanc sans spinner ni gestion d'erreur.
Comment AbortController empêche-t-il une race condition entre deux requêtes ?|On appelle controller.abort() avant de créer un nouveau contrôleur pour la requête suivante. Le fetch précédent reçoit le signal et est interrompu — sa réponse n'arrive jamais et n'écrase pas la réponse de la requête courante.
Quelle est la différence entre defineAsyncComponent et un fetch dans onMounted ?|defineAsyncComponent reporte le téléchargement du bundle JS du composant (code splitting). Un fetch dans onMounted charge des données réseau. Les deux sont orthogonaux et peuvent être utilisés ensemble dans le même composant.
Pourquoi annuler la requête dans onUnmounted ?|Pour libérer les ressources réseau et éviter de mettre à jour l'état d'un composant déjà démonté — source de fuites mémoire et de mises à jour fantômes.
Que doit retourner onErrorCaptured pour empêcher la propagation de l'erreur vers les parents ?|Retourner false. Sans return false, l'erreur continue de remonter vers les ancêtres jusqu'au gestionnaire d'erreur global.
Quelle est la formule du backoff exponentiel et pourquoi ajouter du jitter ?|Délai = baseDelay × 2^attempt (500ms, 1s, 2s pour 3 tentatives). Le jitter (+ Math.random() × delay) évite que de nombreux clients réessaient exactement au même instant après un incident — thundering herd.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-10-gestion-async/README.md`. Construis `FamilyDashboard.vue` avec une API mockée (vraie latence simulée + AbortSignal), affiche les 4 états async, annule la requête au changement de famille — corrigé commenté intégral.

---

← [Module 09 — Composables](09-composables.md)
