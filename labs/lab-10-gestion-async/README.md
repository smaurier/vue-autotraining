# Lab 10 — Gestion de l'asynchrone

> **Outcome :** à la fin, tu sais modéliser les 4 états d'un appel réseau (idle/loading/error/data), charger des données au montage avec affichage correct de chaque état, annuler une requête en cours via `AbortController`, et éliminer les race conditions au changement de famille.
> **Vrai outil :** Vue 3.5 + fetch réel sur un mock local (vraie latence simulée, vrai `AbortSignal` — pas de bibliothèque tierce).
> **Feedback :** le coach valide visuellement en session — pas de test-runner auto-correcteur.

---

## Énoncé

Tu construis deux fichiers qui deviendront le noyau async du front TribuZen :

1. `src/composables/useAsyncData.ts` — composable générique : 3 refs (loading/error/data) + `AbortController` encapsulé + `execute()` / `cancel()`.
2. `src/components/family/FamilyDashboard.vue` — composant qui utilise ce composable pour charger les membres d'une famille et gérer le changement de famille sans race condition.

**API mockée fournie** — à coller dans `src/mocks/familyApi.ts` :

```ts
// src/mocks/familyApi.ts

export interface FamilyMember {
  id:   string
  name: string
  role: 'admin' | 'member'
}

export interface FamilyData {
  id:      string
  name:    string
  members: FamilyMember[]
}

const DB: Record<string, FamilyData> = {
  'family-1': {
    id:      'family-1',
    name:    'Les Dupont',
    members: [
      { id: 'm1', name: 'Alice',  role: 'admin'  },
      { id: 'm2', name: 'Bob',    role: 'member' },
      { id: 'm3', name: 'Cara',   role: 'member' },
    ],
  },
  'family-2': {
    id:      'family-2',
    name:    'Les Martin',
    members: [],   // ← empty state à gérer !
  },
  'family-error': {
    id:      'family-error',
    name:    'ERREUR',
    members: [],
  },
}

/**
 * Simule un appel réseau avec latence réelle et support AbortSignal.
 * @param familyId   ID de la famille à charger
 * @param latency    Délai simulé en ms (default 1 200)
 * @param signal     AbortSignal passé par useAsyncData — annule réellement la promesse
 */
export function fetchFamily(
  familyId: string,
  latency = 1_200,
  signal?: AbortSignal,
): Promise<FamilyData> {
  return new Promise((resolve, reject) => {
    // Annulation immédiate si le signal est déjà déclenché avant même le démarrage
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const timer = setTimeout(() => {
      if (familyId === 'family-error') {
        reject(new Error('HTTP 500 — serveur indisponible'))
        return
      }
      const family = DB[familyId]
      if (!family) {
        reject(new Error(`HTTP 404 — famille "${familyId}" introuvable`))
        return
      }
      resolve(structuredClone(family))
    }, latency)

    // Écouter le signal : annuler le timer et rejeter la promesse
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}
```

**Pas de gap-fill** — tu écris les deux fichiers complets à partir des starters ci-dessous.

Lance le dev server (`pnpm dev`) et intègre `FamilyDashboard` dans `App.vue` pour voir les états en direct.

---

### Starter 1 — `useAsyncData.ts`

```ts
// src/composables/useAsyncData.ts
import { ref, onUnmounted } from 'vue'
import type { Ref } from 'vue'

// À toi de définir l'interface de retour UseAsyncDataReturn<T>
// À toi d'implémenter : data ref, loading ref, error ref, controller, execute(), cancel()
// Rappel : onUnmounted(cancel) — annulation automatique à la destruction du composant
```

### Starter 2 — `FamilyDashboard.vue`

```vue
<!-- src/components/family/FamilyDashboard.vue — starter -->
<script setup lang="ts">
// Imports à compléter : ref, watch, onMounted, useAsyncData, fetchFamily, types

// À toi de déclarer : selectedFamilyId ref
// À toi d'utiliser useAsyncData avec le bon fetcher (passe le signal !)
// À toi d'appeler execute() au montage et de watch selectedFamilyId
</script>

<template>
  <!-- À construire :
    - état loading  → message "Chargement…"
    - état error    → message d'erreur + bouton "Réessayer"
    - état data     → nom de la famille + liste membres (ou empty state)
    - sélecteur de famille (3 boutons : family-1, family-2, family-error)
  -->
</template>

<style scoped>
/* À toi d'ajouter : .error, .empty, .badge, .btn--active */
</style>
```

---

## Étapes (en friction)

1. **Écris `useAsyncData.ts` — les 3 refs** — déclare `data: Ref<T | null>`, `loading: Ref<boolean>`, `error: Ref<string | null>`. Initialise loading à false, les deux autres à null.

2. **Ajoute `AbortController`** — déclare `let controller: AbortController | null = null` en dehors de `execute`. Dans `execute()` : appelle `controller?.abort()` avant de créer un nouveau contrôleur — c'est le cœur de la garde anti-race.

3. **Écris `execute()`** — séquence exacte :
   - abort + nouveau contrôleur
   - `loading.value = true`, `error.value = null`
   - `try` : `data.value = await fetcher(controller.signal)`
   - `catch` : ignorer `AbortError` silencieusement, stocker les autres dans `error.value`
   - `finally` : baisser `loading` seulement si `!controller.signal.aborted`

4. **Écris `cancel()`** — une ligne : `controller?.abort()`. Enregistre `onUnmounted(cancel)` à la fin du composable.

5. **Écris `FamilyDashboard.vue` — le fetcher** — passe `signal` à `fetchFamily(selectedFamilyId.value, 1_200, signal)`. Sans ce `signal`, l'annulation n'arrive jamais au mock.

6. **Ajoute `watch(selectedFamilyId, execute)`** — `execute()` encapsule l'abort ; le watch n'a qu'à appeler `execute()`, sans gérer l'annulation lui-même.

7. **Écris le template — les 4 états** — dans l'ordre : `v-if="loading"`, `v-else-if="error"`, `v-else-if="family"` avec sous-states (membres / empty state), `v-else` pour l'idle initial.

8. **Vérifie la race condition manuellement** — clique rapidement sur "Les Martin" puis "Les Dupont" avant la fin du chargement. Seuls les Dupont doivent s'afficher. Si les Martin apparaissent brièvement, l'abort ne fonctionne pas.

9. **Vérifie l'état error** — clique sur "Famille erreur" (family-error). Le message d'erreur doit apparaître + le bouton "Réessayer" doit relancer `execute()`.

10. **Vérifie l'empty state** — clique sur "Les Martin" (family-2 a zéro membres). Le composant doit afficher le nom de la famille puis "Aucun membre pour l'instant." — pas un écran vide sans explication.

---

## Corrigé complet commenté

### `src/composables/useAsyncData.ts`

```ts
// src/composables/useAsyncData.ts
import { ref, onUnmounted } from 'vue'
import type { Ref } from 'vue'

// Interface de retour — typage explicite pour un DX correct chez le consommateur
interface UseAsyncDataReturn<T> {
  data:    Ref<T | null>
  loading: Ref<boolean>
  error:   Ref<string | null>
  execute: () => Promise<void>
  cancel:  () => void
}

// Générique <T> : le composable est réutilisable pour FamilyData, ActivityData, BalanceData…
// fetcher reçoit un AbortSignal et doit le passer à l'appel réseau sous-jacent
export function useAsyncData<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
): UseAsyncDataReturn<T> {

  // Les 3 refs — modèle idiomatique Vue pour les états async
  // Ref<T | null> via cast : TypeScript ne peut pas inférer T depuis null seul
  const data    = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error   = ref<string | null>(null)

  // Controller déclaré hors de execute pour persister entre les appels
  // null = aucune requête en cours
  let controller: AbortController | null = null

  async function execute(): Promise<void> {
    // ✅ GARDE ANTI-RACE : annuler la requête précédente AVANT d'en créer une nouvelle
    // Si deux execute() s'enchaînent, le premier fetch reçoit abort() et est interrompu
    // Sa réponse n'arrivera jamais — le deuxième fetch est le seul à écrire dans data.value
    controller?.abort()
    controller = new AbortController()

    // Réinitialiser les états avant chaque requête
    loading.value = true
    error.value   = null
    // Ne pas nullifier data.value ici — évite un flash "vide" si on reload la même famille

    try {
      // Passer controller.signal au fetcher — c'est lui qui le transmet à fetch() ou au mock
      // Sans ce signal, abort() n'a aucun effet sur la requête en vol
      data.value = await fetcher(controller.signal)
    } catch (e) {
      // AbortError = annulation VOLONTAIRE (on a appelé abort() nous-mêmes)
      // → ne pas traiter comme une erreur, ne pas afficher de message
      // → return early : on ne touche pas à error.value ni loading.value
      //   (une requête plus récente est probablement déjà en loading)
      if (e instanceof DOMException && e.name === 'AbortError') return

      // Toute autre erreur (HTTP 4xx/5xx, réseau coupé, timeout…) → stocker pour l'UI
      error.value = e instanceof Error ? e.message : 'Erreur inconnue'
    } finally {
      // Baisser loading seulement si CE contrôleur n'a PAS été annulé
      // Si annulé → une requête plus récente est déjà en loading, ne pas la couper
      if (controller && !controller.signal.aborted) {
        loading.value = false
      }
    }
  }

  function cancel(): void {
    // Annuler la requête courante (si elle existe) — usage externe ou cleanup
    controller?.abort()
  }

  // ✅ Annulation automatique à la destruction du composant appelant
  // Evite de mettre à jour data/error d'un composant déjà démonté (fuite mémoire potentielle)
  onUnmounted(cancel)

  return { data, loading, error, execute, cancel }
}
```

---

### `src/components/family/FamilyDashboard.vue`

```vue
<!-- src/components/family/FamilyDashboard.vue -->
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { fetchFamily } from '@/mocks/familyApi'
import type { FamilyData } from '@/mocks/familyApi'

// Famille sélectionnée — en prod, viendrait de useRoute().params.familyId
// ref<string> : toujours un ID, jamais null — pas de cas "aucune famille"
const selectedFamilyId = ref('family-1')

// useAsyncData retourne les 3 refs + execute() + cancel()
// Le fetcher reçoit le signal — CRITIQUE : sans ce signal, AbortController ne sert à rien
const { data: family, loading, error, execute } = useAsyncData<FamilyData>(
  (signal) => fetchFamily(selectedFamilyId.value, 1_200, signal),
  //                      ↑ snapshot de selectedFamilyId.value au moment de l'appel
  //                      ↑ latence 1 200 ms pour rendre la race condition observable
)

// Charger la famille sélectionnée au montage du composant
onMounted(execute)

// Recharger à chaque changement de famille sélectionnée
// execute() annule la requête précédente en interne — le watch n'a rien à gérer
watch(selectedFamilyId, execute)

// Labels pour les boutons de sélection — tableau constant, pas de ref
const familyOptions = [
  { id: 'family-1',     label: 'Les Dupont'      },
  { id: 'family-2',     label: 'Les Martin'      },
  { id: 'family-error', label: 'Famille erreur'  },
] as const
</script>

<template>
  <div class="dashboard">

    <!-- Sélecteur de famille — 3 boutons pour tester les 3 cas -->
    <!-- :class — la classe active signale quelle famille est sélectionnée -->
    <nav class="family-nav">
      <button
        v-for="opt in familyOptions"
        :key="opt.id"
        class="btn"
        :class="{ 'btn--active': selectedFamilyId === opt.id }"
        @click="selectedFamilyId = opt.id"
      >
        {{ opt.label }}
      </button>
    </nav>

    <!-- ─────── États async ─────── -->

    <!-- État loading : spinner textuel — visible dès le clic avant la réponse -->
    <p v-if="loading" class="loading">Chargement de la famille…</p>

    <!-- État error : message + bouton retry -->
    <!-- execute() est la même fonction que le chargement initial — réutilisable comme retry -->
    <div v-else-if="error" class="error-block">
      <p class="error">Erreur — {{ error }}</p>
      <button class="btn" @click="execute">Réessayer</button>
    </div>

    <!-- État data : famille chargée avec succès -->
    <!-- v-else-if="family" : null-check implicite — famille !== null && !== undefined -->
    <template v-else-if="family">
      <h1 class="family-name">{{ family.name }}</h1>

      <!-- Empty state — distinct du "data null" (la requête a réussi mais 0 membres) -->
      <!-- Exemple : Les Martin (family-2) → liste vide, but pas d'erreur -->
      <p v-if="family.members.length === 0" class="empty">
        Aucun membre pour l'instant.
      </p>

      <!-- Liste des membres — v-else car v-if ci-dessus couvre la liste vide -->
      <ul v-else class="member-list">
        <!--
          :key sur l'ID métier stable — résistant au tri ou à la mise à jour partielle
          v-if badge admin — seulement si role === 'admin', absent sinon (pas de nœud DOM vide)
        -->
        <li
          v-for="m in family.members"
          :key="m.id"
          class="member"
        >
          {{ m.name }}
          <span v-if="m.role === 'admin'" class="badge">Admin</span>
        </li>
      </ul>
    </template>

    <!-- État idle — visible uniquement avant le premier execute() (rare en pratique) -->
    <!-- onMounted(execute) déclenche immédiatement, donc idle passe en loading en <1 tick -->
    <p v-else class="idle">En attente de sélection…</p>

  </div>
</template>

<style scoped>
/* Espacement global */
.dashboard {
  max-width: 480px;
  margin: 2rem auto;
  font-family: system-ui, sans-serif;
}

/* Barre de navigation famille */
.family-nav {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

/* Bouton neutre */
.btn {
  padding: 0.4rem 0.8rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  cursor: pointer;
  background: #fff;
  font-size: 0.875rem;
}

/* Famille sélectionnée — fond sombre pour signaler l'état actif */
.btn--active {
  background: #1e293b;
  color: #fff;
  border-color: #1e293b;
}

/* État loading — discret, non intrusif */
.loading {
  color: #64748b;
  font-style: italic;
}

/* Bloc erreur — encadré pour attirer l'attention sans être alarmiste */
.error-block {
  padding: 1rem;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  background: #fef2f2;
}
.error {
  color: #dc2626;
  margin: 0 0 0.75rem;
}

/* Empty state — couleur atténuée, italique pour signaler l'absence de contenu */
.empty {
  color: #94a3b8;
  font-style: italic;
}

/* Nom de la famille */
.family-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

/* Liste membres — sans puce native */
.member-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.member {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Badge admin — rouge-orangé, compact */
.badge {
  display: inline-block;
  padding: 0.1rem 0.4rem;
  background: #ef4444;
  color: #fff;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.idle {
  color: #94a3b8;
}
</style>
```

---

**Pourquoi ce corrigé est correct :**

- `controller?.abort()` en tête de `execute()` garantit qu'une seule requête peut écrire dans `data.value` — la plus récente. Le fetch précédent reçoit `AbortError` et retourne sans toucher à l'état.
- `onUnmounted(cancel)` dans le composable libère la ressource réseau si l'utilisateur quitte la page avant la fin du chargement — pas de mise à jour fantôme sur un composant démonté.
- Le `finally` conditionnel (`!controller.signal.aborted`) évite de remettre `loading` à `false` alors qu'une requête plus récente est encore en vol — le spinner reste visible jusqu'à la vraie fin.
- L'empty state (`family.members.length === 0`) est explicite — il est structurellement distinct de `family === null` (données non encore chargées) et de `error !== null` (échec réseau).
- `execute` sert à la fois de chargement initial (`onMounted`) et de retry (`@click`) — une seule fonction, aucune duplication.

---

## Variante J+30 (fading)

**Même objectif, deux contraintes ajoutées — 30 minutes, sans ouvrir ce corrigé ni le module 10 :**

1. **Retry avec backoff** — modifie `execute()` pour retenter automatiquement jusqu'à 3 fois si la requête échoue (pas sur `AbortError`). Le délai entre tentatives suit un backoff exponentiel : 500 ms, 1 000 ms, 2 000 ms. Affiche le numéro de tentative en cours dans l'état loading : "Chargement… (tentative 2/3)".

2. **Délai de latence configurable** — expose une prop `latency: number` (default 1 200) sur `FamilyDashboard.vue` et passe-la au mock. Permet de simuler un réseau très lent (5 000 ms) pour rendre les états loading et l'annulation plus faciles à observer manuellement.

**Critère de réussite :** cliquer sur "Famille erreur" déclenche 3 tentatives espacées avec messages mis à jour en temps réel, puis affiche le message d'erreur final. Changer de famille pendant une série de retries annule proprement (pas de tentative fantôme après le changement).

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, les deux fichiers produits dans ce lab vivent ici :

```
tribuzen/
  src/
    composables/
      useAsyncData.ts         ← le composable générique du lab
    components/
      family/
        FamilyDashboard.vue   ← le composant du lab, adapté ci-dessous
    mocks/
      familyApi.ts            ← à supprimer quand l'API réelle est branchée
```

**Différences par rapport au lab :**

- `fetchFamily` sera remplacé par un appel à l'API REST TribuZen réelle — seul le fetcher change dans `FamilyDashboard.vue`, `useAsyncData` reste identique.
- `selectedFamilyId` viendra de `useRoute().params.familyId` (Vue Router, module 08) — plus de boutons de sélection inline.
- Le composant chargé de façon asynchrone (code splitting) sera `SpendingChart.vue` (graphiques analytiques, bundle Chart.js lourd) — via `defineAsyncComponent` une fois le panneau analytique ouvert.

**Commit cible :**

```
feat(family): useAsyncData composable + FamilyDashboard — 4 états async, AbortController, garde anti-race
```
