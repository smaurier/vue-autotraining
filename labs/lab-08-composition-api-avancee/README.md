# Lab 08 — Composition API avancée

> **Outcome :** à la fin, tu sais écrire un composable Vue 3 qui regroupe plusieurs effets dans un `effectScope`, expose son état via `toRefs`, utilise `shallowRef` + `triggerRef` pour la performance, surveille des changements profonds avec `watch({ deep, immediate })`, annule les requêtes en vol avec `watchEffect` + `onCleanup`, et implémente une recherche debouncée avec `customRef`.
> **Vrai outil :** Vue 3.5 + `vue-tsc --noEmit` (la vérification TypeScript est le feedback immédiat — pas de test-runner auto-correcteur).
> **Feedback :** le coach valide les comportements dans le navigateur en session.

---

## Énoncé

Tu construis la couche réactive du dashboard TribuZen. La PM t'a envoyé ce brief :

> "Quand un membre de la famille marque une routine comme `done` ou la trie par priorité, l'indicateur **météo de charge** doit se mettre à jour instantanément. Le champ de recherche ne doit pas déclencher de filtre à chaque frappe — 400 ms de délai. Et quand on quitte la vue, zéro fuite mémoire."

Tu produis **deux fichiers** :

1. `src/composables/useRoutineTracker.ts` — logique réactive (chargement, mutations, cleanup).
2. `src/components/family/RoutineTracker.vue` — présentation + effets locaux (météo, sync, recherche).

**Données et types de départ :**

```ts
export interface Routine {
  id: string
  title: string
  done: boolean
  skipped: boolean
  scheduledAt: string   // ISO string, ex. "2026-07-01T08:00:00Z"
  priority: number      // 1 = haute, 3 = basse
  familyId: string
}
```

**Pas de gap-fill** — tu écris les deux fichiers complets à partir des starters ci-dessous.

### Starters

#### `src/composables/useRoutineTracker.ts`

```ts
// useRoutineTracker.ts — starter
import {
  shallowRef, reactive, toRefs,
  effectScope, watch, triggerRef,
  type Ref,
} from 'vue'

export interface Routine {
  id: string
  title: string
  done: boolean
  skipped: boolean
  scheduledAt: string
  priority: number
  familyId: string
}

export function useRoutineTracker(familyId: Ref<string>) {
  // TODO 1 : rows en shallowRef (pas ref) — pourquoi ?
  // TODO 2 : meta en reactive avec { loading, error, total }
  // TODO 3 : effectScope → scope.run(() => { watch(familyId, ..., { immediate: true }) })
  // TODO 4 : toggleDone(id) — mutation interne + triggerRef
  // TODO 5 : sortByPriority() — sort in-place + triggerRef
  // TODO 6 : dispose() → scope.stop()
  // TODO 7 : return { rows, ...toRefs(meta), toggleDone, sortByPriority, dispose }
}
```

#### `src/components/family/RoutineTracker.vue`

```vue
<!-- RoutineTracker.vue — starter -->
<script setup lang="ts">
import { ref, computed, watch, watchEffect, customRef, onUnmounted } from 'vue'
import { useRoutineTracker } from '@/composables/useRoutineTracker'

// TODO A : ref familyId (simule la sélection de famille — ex. 'fam-42')
// TODO B : appel useRoutineTracker(familyId)
// TODO C : watch(rows, ..., { deep: true, immediate: true }) → calcule meteoCharge
// TODO D : useDebouncedRef<string> via customRef (delay = 400)
// TODO E : computed routinesFiltrées (search sur title)
// TODO F : watchEffect((onCleanup) => ...) → POST sync + AbortController
// TODO G : onUnmounted(dispose)
</script>

<template>
  <!-- TODO : météo, champ recherche, liste avec bouton toggle + tri -->
</template>

<style scoped>
/* TODO : .meteo--legere, .meteo--normale, .meteo--chargee */
</style>
```

Lance `pnpm dev`, branche `RoutineTracker` dans `App.vue`, et vérifie avec `vue-tsc --noEmit` avant de passer au corrigé.

---

## Étapes (en friction)

1. **`shallowRef` vs `ref`** — dans `useRoutineTracker.ts`, déclare `rows` comme `shallowRef<Routine[]>([])`. Explique mentalement (ou à voix haute) pourquoi `ref` serait plus coûteux ici : Vue traverserait récursivement chaque objet `Routine` à chaque rendu.

2. **`reactive` pour les métadonnées** — déclare `meta = reactive({ loading: false, error: null as string | null, total: 0 })`. C'est un objet plat de scalaires — `reactive` est approprié (pas besoin de `shallowReactive` ici).

3. **`effectScope` + `watch(familyId, ..., { immediate: true })`** — crée `const scope = effectScope()`. Dans `scope.run(() => { ... })`, écris un `watch` sur `familyId` avec `immediate: true`. Le callback doit : passer `meta.loading = true`, faire un `await fetch(...)`, remplir `rows.value` et `meta.total`, gérer `meta.error` en catch, et remettre `meta.loading = false` en finally. Pourquoi `immediate: true` ici ? Parce que le chargement doit se déclencher au premier rendu, pas seulement quand `familyId` change.

4. **`toggleDone(id)`** — cherche la routine dans `rows.value.find(...)`, bascule `row.done`, puis appelle `triggerRef(rows)`. Sans `triggerRef`, le template ne voit pas la mutation (le `shallowRef` ne détecte que le remplacement de `.value`).

5. **`sortByPriority()`** — `rows.value.sort((a, b) => a.priority - b.priority)` puis `triggerRef(rows)`. Même raison : sort in-place est silencieux pour Vue.

6. **`dispose()` + `return`** — écris `function dispose() { scope.stop() }`. Retourne `{ rows, ...toRefs(meta), toggleDone, sortByPriority, dispose }`. Pourquoi `toRefs(meta)` et pas `meta` directement ? Pour que le consommateur puisse destructurer `{ loading, error, total }` et conserver la réactivité.

7. **`watch` deep + immediate dans le composant** — dans `RoutineTracker.vue`, après l'appel du composable, écris `watch(rows, (updatedRows) => { /* calcul méteo */ }, { deep: true, immediate: true })`. Calcule `meteoCharge` selon le ratio `done/total`. Stocke-la dans un `ref<'légère' | 'normale' | 'chargée'>('normale')`.

8. **`customRef` debounced** — implémente `useDebouncedRef<T>(initialValue, delay = 300)` localement dans le composant (ou dans un fichier séparé). Rappel : `track()` dans `get`, `trigger()` dans `set` (après le timeout). Déclare `const search = useDebouncedRef('', 400)`.

9. **`computed` de filtrage** — `routinesFiltrées` filtre `rows.value` sur `r.title.toLowerCase().includes(search.value.toLowerCase())`. Si `search.value` est vide, retourne `rows.value` entier.

10. **`watchEffect` avec `onCleanup`** — écris un effet qui POST `/api/routines/sync` avec `AbortController`. Dans `onCleanup`, appelle `controller.abort()`. L'effet se ré-exécute à chaque changement de `rows.value`.

11. **Cleanup à `onUnmounted`** — appelle `onUnmounted(dispose)`. Vérifie avec `vue-tsc --noEmit` : zéro erreur TypeScript.

---

## Corrigé complet commenté

### `src/composables/useRoutineTracker.ts`

```ts
import {
  shallowRef, reactive, toRefs,
  effectScope, watch, triggerRef,
  type Ref,
} from 'vue'

export interface Routine {
  id: string
  title: string
  done: boolean
  skipped: boolean
  scheduledAt: string
  priority: number
  familyId: string
}

export function useRoutineTracker(familyId: Ref<string>) {
  // shallowRef : Vue ne convertit PAS récursivement les objets Routine en Proxy
  // Seul le remplacement de rows.value déclenchera la réactivité automatiquement
  // Pour 50-300 routines, la différence de perf est mesurable (pas de deep walk à chaque tick)
  const rows = shallowRef<Routine[]>([])

  // reactive pour des scalaires plats — aucune imbrication, pas besoin de shallowReactive
  const meta = reactive({
    loading: false,
    error: null as string | null,
    total: 0,
  })

  // effectScope : groupe tous les effets créés dans scope.run()
  // Un seul scope.stop() dans dispose() arrêtera watch + tout autre effet futur
  const scope = effectScope()

  scope.run(() => {
    // immediate: true → le chargement se déclenche dès le setup, pas seulement au changement
    // familyId est une Ref<string> — on la passe directement (pas un getter)
    watch(
      familyId,
      async (id) => {
        meta.loading = true
        meta.error = null
        try {
          // En vrai : fetch('/api/families/${id}/routines')
          // Ici on simule avec des données statiques pour que le lab tourne sans backend
          const fakeData: Routine[] = [
            { id: 'r1', title: 'Réveil 7h', done: false, skipped: false, scheduledAt: '2026-07-01T07:00:00Z', priority: 1, familyId: id },
            { id: 'r2', title: 'Petit-déjeuner', done: true, skipped: false, scheduledAt: '2026-07-01T07:30:00Z', priority: 2, familyId: id },
            { id: 'r3', title: 'Lecture 20 min', done: false, skipped: true, scheduledAt: '2026-07-01T20:00:00Z', priority: 3, familyId: id },
          ]
          // Remplacement de .value entier → réactivité automatique même avec shallowRef
          rows.value = fakeData
          meta.total = fakeData.length
        } catch (e) {
          meta.error = e instanceof Error ? e.message : 'Erreur réseau'
        } finally {
          // finally garantit que loading repasse à false même si le fetch échoue
          meta.loading = false
        }
      },
      { immediate: true },
    )
  })

  // toggleDone : mute l'objet interne (shallowRef ne le voit pas seul)
  // triggerRef force Vue à invalider les dépendances de rows comme si .value avait changé
  function toggleDone(id: string): void {
    const row = rows.value.find(r => r.id === id)
    if (row) {
      row.done = !row.done
      // Sans triggerRef → template figé, watch deep dans le composant parent ne réagit pas
      triggerRef(rows)
    }
  }

  // sortByPriority : sort in-place — rows.value n'est pas réassigné, d'où le triggerRef
  function sortByPriority(): void {
    rows.value.sort((a, b) => a.priority - b.priority)
    // Alternative sans triggerRef : rows.value = [...rows.value].sort(...)
    // L'alternative alloue un nouveau tableau — triggerRef est plus économique
    triggerRef(rows)
  }

  // dispose : arrête tous les effets capturés par le scope en une ligne
  // Appelé par le composant dans onUnmounted
  function dispose(): void {
    scope.stop()
  }

  // toRefs(meta) → chaque propriété de meta devient une Ref<T> liée bidirectionnellement
  // Le consommateur peut écrire const { loading, error } = useRoutineTracker(fid)
  // et ces variables restent réactives (contrairement à const { loading } = meta)
  return { rows, ...toRefs(meta), toggleDone, sortByPriority, dispose }
}
```

---

### `src/components/family/RoutineTracker.vue`

```vue
<!-- RoutineTracker.vue — corrigé -->
<script setup lang="ts">
import { ref, computed, watch, watchEffect, customRef, onUnmounted } from 'vue'
import { useRoutineTracker } from '@/composables/useRoutineTracker'

// ─── customRef debounced ──────────────────────────────────────────────────────
// Défini ici (ou dans composables/useDebouncedRef.ts pour le réutiliser)
// customRef donne un contrôle total sur track() et trigger()
function useDebouncedRef<T>(initialValue: T, delay = 300) {
  let timeout: ReturnType<typeof setTimeout>
  // La valeur interne est stockée dans la closure — pas dans une ref Vue
  let value = initialValue

  return customRef<T>((track, trigger) => ({
    get() {
      // track() : déclare cette lecture comme dépendance du système réactif Vue
      // Sans track(), les computed/watchEffect lisant cette ref ne se ré-exécutent pas
      track()
      return value
    },
    set(newValue) {
      clearTimeout(timeout)
      // trigger() est appelé APRÈS le délai — pas immédiatement
      // Effet : si l'utilisateur tape 5 lettres en 200ms, trigger() ne s'exécute qu'une fois
      timeout = setTimeout(() => {
        value = newValue
        trigger()  // notifie Vue que la ref a changé → recompute les dépendants
      }, delay)
    },
  }))
}

// ─── State local ─────────────────────────────────────────────────────────────
// familyId : en vrai produit, viendrait d'une prop ou d'un router param
const familyId = ref('fam-42')

// Composable : destructuration — loading, error, total sont des Ref<T> grâce à toRefs
const { rows, loading, error, total, toggleDone, sortByPriority, dispose } =
  useRoutineTracker(familyId)

// Météo de charge — Ref locale au composant (pas dans le composable car c'est de la UI)
const meteoCharge = ref<'légère' | 'normale' | 'chargée'>('normale')

// ─── watch deep sur rows : calcul de la météo ────────────────────────────────
// deep: true → détecte row.done = true (mutation interne après triggerRef dans le composable)
// immediate: true → calcule dès le montage (rows peut déjà être chargé via immediate du watch interne)
// Note : watch sur shallowRef avec deep:true fonctionne — deep traverse .value, pas le ref lui-même
watch(
  rows,
  (updatedRows) => {
    if (updatedRows.length === 0) {
      meteoCharge.value = 'normale'
      return
    }
    const done  = updatedRows.filter(r => r.done).length
    const ratio = done / updatedRows.length
    // Seuils métier TribuZen : >= 80% done = légère, >= 40% = normale, sinon chargée
    if (ratio >= 0.8)      meteoCharge.value = 'légère'
    else if (ratio >= 0.4) meteoCharge.value = 'normale'
    else                   meteoCharge.value = 'chargée'
  },
  { deep: true, immediate: true },
)

// ─── Recherche debouncée ──────────────────────────────────────────────────────
// 400 ms : l'utilisateur a fini de taper avant qu'on filtre
const search = useDebouncedRef('', 400)

// computed : ne se ré-exécute que quand rows ou search changent
// search.value déclenche le re-compute après le délai debounce
const routinesFiltrées = computed(() => {
  const q = search.value.toLowerCase()
  // Si vide : pas de filtre — on évite un .filter() inutile
  if (!q) return rows.value
  return rows.value.filter(r => r.title.toLowerCase().includes(q))
})

// ─── watchEffect : sync POST avec annulation des requêtes en vol ──────────────
// watchEffect détecte automatiquement rows.value comme dépendance (lecture dans le if)
// onCleanup s'exécute AVANT la prochaine ré-exécution de l'effet (ou à l'arrêt du scope)
watchEffect((onCleanup) => {
  // Garde : ne sync pas si la liste est vide (chargement initial en cours)
  if (rows.value.length === 0) return

  const controller = new AbortController()

  // En vrai produit : fetch('/api/routines/sync', { method: 'POST', body: ..., signal })
  // Ici on simule — le signal annule la requête si rows change avant la réponse
  console.log('[RoutineTracker] sync', rows.value.length, 'routines')

  // onCleanup : annule la requête précédente si rows change avant la fin du fetch
  // Sans onCleanup → race condition : une ancienne réponse peut écraser une nouvelle
  onCleanup(() => {
    controller.abort()
    console.log('[RoutineTracker] sync annulée (nouvelle exécution ou arrêt)')
  })
})

// ─── Cleanup ──────────────────────────────────────────────────────────────────
// dispose() appelle scope.stop() dans le composable → arrête watch(familyId) et tous les effets
// onUnmounted nécessaire même si le composable a été appelé dans <script setup> :
// dispose() est explicitement défensif pour les cas où le composable serait utilisé
// dans un contexte async ou hors setup synchrone
onUnmounted(dispose)
</script>

<template>
  <div class="routine-tracker">
    <!-- Indicateur météo — data-level utilisé comme hook CSS (pas de class dynamique nécessaire) -->
    <div class="meteo" :data-level="meteoCharge">
      Météo de charge : <strong>{{ meteoCharge }}</strong>
    </div>

    <!-- État de chargement et erreur -->
    <p v-if="loading" class="loading">Chargement des routines…</p>
    <p v-else-if="error" class="error">Erreur : {{ error }}</p>

    <template v-else>
      <!-- Contrôles -->
      <div class="controls">
        <!-- v-model sur search.value — le setter customRef débounce le trigger -->
        <input
          v-model="search"
          type="search"
          placeholder="Rechercher une routine…"
          class="search-input"
        />
        <button class="btn" @click="sortByPriority">Trier par priorité</button>
        <span class="count">{{ total }} routine(s)</span>
      </div>

      <!-- Liste filtrée -->
      <p v-if="routinesFiltrées.length === 0" class="empty">
        Aucune routine ne correspond à la recherche.
      </p>
      <ul v-else class="routine-list">
        <!--
          :key sur r.id : stable même après tri — pas de problème de réordonnancement DOM
          :class objet : la classe done--true s'ajoute si la routine est faite
        -->
        <li
          v-for="r in routinesFiltrées"
          :key="r.id"
          :class="{ 'routine--done': r.done, 'routine--skipped': r.skipped }"
        >
          <!-- Bouton inline : expression suffisamment courte pour rester dans le template -->
          <button class="toggle-btn" @click="toggleDone(r.id)">
            {{ r.done ? '✓' : '○' }}
          </button>
          <span class="routine-title">{{ r.title }}</span>
          <span class="routine-time">{{ r.scheduledAt.slice(11, 16) }}</span>
          <span class="routine-priority">P{{ r.priority }}</span>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
/* Météo : couleur selon l'attribut data-level — évite une classe CSS dynamique supplémentaire */
.meteo { padding: 0.5rem 0.8rem; border-radius: 4px; margin-bottom: 1rem; font-size: 0.95rem; }
.meteo[data-level="légère"]  { background: #dcfce7; color: #166534; }
.meteo[data-level="normale"] { background: #fef9c3; color: #854d0e; }
.meteo[data-level="chargée"] { background: #fee2e2; color: #991b1b; }

.controls { display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1rem; }
.search-input { flex: 1; padding: 0.35rem 0.6rem; border: 1px solid #cbd5e1; border-radius: 4px; }
.btn { padding: 0.35rem 0.75rem; border: 1px solid #94a3b8; border-radius: 4px; cursor: pointer; }
.count { color: #64748b; font-size: 0.85rem; }

.routine-list { list-style: none; padding: 0; margin: 0; }
.routine-list li {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.5rem 0; border-bottom: 1px solid #f1f5f9;
}

/* Routine faite : opacité réduite, titre barré */
.routine--done .routine-title { text-decoration: line-through; opacity: 0.5; }
/* Routine skippée : en italique grisé */
.routine--skipped .routine-title { font-style: italic; color: #94a3b8; }

.toggle-btn { background: none; border: 1px solid #cbd5e1; border-radius: 50%; width: 1.5rem; height: 1.5rem; cursor: pointer; font-size: 0.75rem; }
.routine-time { margin-left: auto; color: #64748b; font-size: 0.8rem; }
.routine-priority { color: #94a3b8; font-size: 0.75rem; }

.loading, .empty { color: #94a3b8; font-style: italic; }
.error { color: #ef4444; }
</style>
```

**Pourquoi ce corrigé est correct :**

- `shallowRef` dans le composable : Vue ne traverse pas l'arbre de chaque `Routine` à chaque tick — seul le remplacement de `.value` ou `triggerRef(rows)` déclenche la réactivité.
- `triggerRef(rows)` dans `toggleDone` et `sortByPriority` : les mutations in-place sur un `shallowRef` sont silencieuses pour Vue. `triggerRef` est l'équivalent explicite d'un remplacement de `.value`.
- `effectScope` + `scope.stop()` : un seul appel à `dispose()` arrête tous les effets du composable — aucune fuite possible même si plusieurs watchers sont ajoutés plus tard.
- `toRefs(meta)` au retour : `const { loading } = useRoutineTracker(id)` reste réactif. Sans `toRefs`, `loading` serait un booléen fixe snapshottéau moment de l'appel.
- `customRef` avec `track()` dans `get` et `trigger()` dans `set` (après timeout) : règle absolue. Appeler `trigger()` dans `get` crée une boucle infinie.
- `watchEffect` + `onCleanup` : `controller.abort()` est appelé avant chaque ré-exécution de l'effet, ce qui annule la requête en cours. Sans cela, une requête lente peut écraser les données d'une requête plus récente (race condition).
- `watch(rows, ..., { deep: true })` dans le composant : même si `rows` est un `shallowRef`, `deep: true` sur le watch traverse `.value` (le tableau) et ses éléments. Après `triggerRef(rows)`, le watcher se déclenche et voit les mutations internes.

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées :**

Reproduis `useRoutineTracker.ts` et `RoutineTracker.vue` **de mémoire, en 30 minutes**, avec ces modifications :

1. Dans le composable, ajoute un **second watcher dans le même `effectScope`** : `watch(familyId, (newId, oldId) => console.log('famille changée :', oldId, '→', newId))`. Observe que `scope.stop()` l'arrête aussi.
2. Dans le composant, remplace `useDebouncedRef` par `watch(search, fetchFiltered, { immediate: false })` avec un `setTimeout` manuel — et réfléchis pourquoi `customRef` est plus propre.
3. **Bonus :** ajoute `flush: 'post'` sur le `watch(rows, ...)` de météo et explique dans un commentaire pourquoi ça ne change rien ici (la météo ne lit pas le DOM).
4. **Sans ouvrir ce corrigé** ni le module 08.

**Critère de réussite :** `vue-tsc --noEmit` passe sans erreur, `scope.stop()` arrête bien les deux watchers (vérifie dans la console que les logs s'arrêtent quand le composant est détruit).

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, ces deux fichiers s'intègrent directement :

```
tribuzen/
  src/
    composables/
      useRoutineTracker.ts    ← shallowRef + triggerRef + effectScope + toRefs
    components/
      family/
        RoutineTracker.vue    ← watch deep + watchEffect + customRef + onUnmounted
```

**Différences par rapport au lab :**

- `familyId` viendra d'une prop `familyId: string` définie via `defineProps` (module 05). Pour l'instant, le `ref('fam-42')` local suffit.
- Le fetch simulé sera remplacé par le vrai appel au composable de data-fetching TribuZen (`useApi` — module 09).
- L'interface `Routine` sera importée depuis `src/types/family.ts` (partagée avec les autres composants).
- Le calcul de `meteoCharge` sera extrait dans un composable dédié `useMeteoCharge(routines)` quand d'autres vues en auront besoin.
- `useDebouncedRef` vivra dans `composables/useDebouncedRef.ts` pour être réutilisé sur le champ de recherche de `MemberList.vue`.

**Commit cible :**

```
feat(family): RoutineTracker — shallowRef+triggerRef, watch deep météo, watchEffect sync, customRef search
```
