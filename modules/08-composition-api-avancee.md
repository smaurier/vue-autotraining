---
titre: Composition API avancée
cours: 02-vue
notions: [watch options deep immediate flush, watchEffect, watchPostEffect, arrêt d'un watcher, effectScope, toRef et toRefs, réactivité shallowRef shallowReactive, triggerRef, customRef, unref]
outcomes:
  - sait choisir entre watch et watchEffect selon le besoin (lazy vs auto-track)
  - sait régler un watcher (deep, immediate, flush post) et l'arrêter proprement
  - sait préserver la réactivité en passant des refs (toRef, toRefs) entre composables
  - sait quand descendre en réactivité superficielle (shallowRef/shallowReactive) pour la perf
prerequis: [07-options-vs-composition-api]
next: 09-composables
libs: [{ name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — logique réactive avancée du dashboard famille (watcher deep sur les routines, watchEffect pour recalculer la météo de charge)
last-reviewed: 2026-07
---

# Composition API avancée

> **Outcomes — tu sauras FAIRE :** choisir et configurer `watch`/`watchEffect` selon le besoin, arrêter un watcher proprement, regrouper des effets avec `effectScope`, passer la réactivité avec `toRef`/`toRefs`, et descendre en réactivité superficielle (`shallowRef`, `shallowReactive`) pour la performance.
> **Difficulté :** :star::star::star:

## 1. Cas concret d'abord

Tu prends en charge le dashboard famille TribuZen. La PM t'envoie ce message :

> "Le dashboard affiche les routines de la famille. Quand une routine change de statut (`done`, `skipped`, `pending`) ou que son heure change, il faut recalculer la **météo de charge** du jour (un indicateur visuel). Et quand l'utilisateur quitte la vue, tout doit être proprement nettoyé — pas de fuite mémoire."

Le state actuel du composant :

```ts
// DashboardFamille.vue — état actuel (avant ce module)
const routines = ref<Routine[]>([])        // tableau d'objets imbriqués
const meteoCharge = ref<'légère' | 'normale' | 'chargée'>('normale')
```

Deux problèmes immédiats :
1. `watch(routines, callback)` ne se déclenche **pas** quand une propriété d'une routine change (`routines.value[0].done = true`) — `watch` ne voit que le remplacement de la ref entière.
2. Si tu crées plusieurs watchers pour recalculer `meteoCharge`, comment les arrêter tous d'un coup à `onUnmounted` ?

Ce module te donne les outils : `deep`, `watchEffect`, `effectScope`.

---

## 2. Théorie complète, concise

### 2.1 `watch` — surveillance ciblée et lazy

`watch` surveille une ou plusieurs sources explicites. Il est **lazy** : le callback ne s'exécute pas au montage, seulement quand la source change.

```ts
import { ref, watch } from 'vue'

const search = ref('')

// Source unique (ref)
watch(search, (newVal, oldVal) => {
  console.log(`"${oldVal}" → "${newVal}"`)
})

// Source multiple (tableau)
const page = ref(1)
watch([search, page], ([newSearch, newPage], [oldSearch, oldPage]) => {
  if (newSearch !== oldSearch) page.value = 1
  fetchResults(newSearch, newPage)
})

// Source = propriété d'un reactive → utiliser un getter
import { reactive } from 'vue'
const state = reactive({ count: 0, name: '' })
watch(() => state.count, (newCount) => {
  console.log('count:', newCount)
})
```

**Règle :** pour une `ref`, passer la ref directement. Pour une propriété de `reactive`, passer un getter `() => state.prop`.

### 2.2 Options de `watch` — `deep`, `immediate`, `flush`

```ts
watch(source, callback, {
  deep: true,       // surveiller les propriétés imbriquées
  immediate: true,  // exécuter aussi au montage (avant tout changement)
  flush: 'post',    // timing du callback par rapport à la mise à jour du DOM
})
```

#### `deep: true`

Sans `deep`, `watch` sur un objet ou tableau réactif ne détecte que le **remplacement** de la ref entière, pas les mutations internes.

```ts
const routines = ref<Routine[]>([])

// ❌ Sans deep : ne réagit PAS si routines.value[0].done = true
watch(routines, () => recalcMeteo())

// ✅ Avec deep : réagit à toute mutation de la structure imbriquée
watch(routines, () => recalcMeteo(), { deep: true })
```

> **Coût** : `deep: true` traverse récursivement l'objet entier à chaque accès. Sur un grand arbre d'objets, préférer un getter ciblé `() => state.specific.path`.

#### `immediate: true`

Exécute le callback une fois immédiatement au setup, en plus des exécutions sur changement.

```ts
// Charger les données au montage ET à chaque changement d'userId
watch(userId, async (id) => {
  routines.value = await fetchRoutines(id)
}, { immediate: true })
```

#### `flush` — timing d'exécution

| Valeur | Quand le callback s'exécute | Cas d'usage |
|--------|----------------------------|-------------|
| `'pre'` (défaut) | **Avant** la mise à jour du DOM Vue | Modifier l'état avant le rendu |
| `'post'` | **Après** la mise à jour du DOM Vue | Lire des dimensions DOM mises à jour |
| `'sync'` | Synchronement dès que la source change | Débogage, rarement en production |

```ts
watch(count, () => {
  // Le DOM est déjà mis à jour ici
  console.log(document.querySelector('.counter')?.textContent)
}, { flush: 'post' })
```

### 2.3 `watchEffect` — auto-tracking et eager

`watchEffect` ne déclare pas de source. Il exécute la fonction **immédiatement**, enregistre toutes les dépendances réactives lues, et se ré-exécute quand l'une d'elles change.

```ts
import { ref, watchEffect } from 'vue'

const search = ref('')
const page = ref(1)

// Pas de déclaration de source — Vue détecte search.value et page.value
watchEffect(() => {
  console.log(`recherche: "${search.value}", page: ${page.value}`)
  fetchResults(search.value, page.value)
})
// Exécution immédiate + ré-exécution à chaque changement de search ou page
```

**Nettoyage avant la prochaine exécution** — le paramètre `onCleanup` :

```ts
watchEffect((onCleanup) => {
  const controller = new AbortController()

  fetch(`/api/search?q=${search.value}`, { signal: controller.signal })
    .then(r => r.json())
    .then(data => { results.value = data })

  // Avant la PROCHAINE exécution (ou à l'arrêt) : annuler la requête en cours
  onCleanup(() => controller.abort())
})
```

### 2.4 `watch` vs `watchEffect` — lequel choisir

| Critère | `watch` | `watchEffect` |
|---------|---------|---------------|
| Sources | Déclarées explicitement | Auto-détectées |
| Accès `oldVal` | ✅ Oui | ❌ Non |
| Exécution au montage | ❌ Non (sauf `immediate`) | ✅ Toujours |
| Comparaison avant/après | ✅ Facile | ❌ Impossible |
| Meilleur pour... | Réagir à UNE source, comparer | Synchroniser des effets multi-sources |

### 2.5 `watchPostEffect` — alias flush post

`watchPostEffect` est un alias de `watchEffect` avec `{ flush: 'post' }` déjà configuré. Pratique quand tu dois lire le DOM mis à jour dans l'effet.

```ts
import { watchPostEffect } from 'vue'

const listRef = useTemplateRef<HTMLUListElement>('list')

// S'exécute après chaque mise à jour du DOM — listRef.value est à jour
watchPostEffect(() => {
  if (listRef.value) {
    listRef.value.scrollTop = listRef.value.scrollHeight
  }
})
```

### 2.6 Arrêter un watcher

`watch` et `watchEffect` retournent une fonction d'arrêt. Si le watcher est créé dans un composant (`<script setup>` ou `setup()`), Vue l'arrête automatiquement à `onUnmounted`. Si créé en dehors (composable asynchrone, store), tu dois l'arrêter manuellement.

```ts
const stop = watch(source, callback)
stop() // stoppe le watcher — plus aucune réaction

const stopEffect = watchEffect(() => { /* ... */ })
stopEffect()

// Pattern composable : arrêt dans onUnmounted
import { onUnmounted } from 'vue'
const stop = watch(source, callback)
onUnmounted(stop)
```

```ts
// ⚠️ Watcher créé APRÈS un await → hors du setup synchrone → non auto-arrêté
async function setup() {
  await fetch('/api/init')
  // Ce watcher n'est PAS dans le scope du composant — fuite si non arrêté manuellement
  watch(source, callback)
}
```

### 2.7 `effectScope` — regrouper et arrêter en bloc

`effectScope` crée un groupe qui capture tous les effets réactifs (watch, watchEffect, computed) créés dans `scope.run()`. Un seul `scope.stop()` les arrête tous.

```ts
import { effectScope, watch, watchEffect, computed, ref } from 'vue'

const scope = effectScope()
const count = ref(0)

scope.run(() => {
  // Tous ces effets sont capturés par le scope
  const double = computed(() => count.value * 2)
  watch(count, (n) => console.log('count:', n))
  watchEffect(() => console.log('double:', double.value))
})

// Plus tard — arrêt de tous les effets du groupe
scope.stop()
```

**Cas d'usage principal :** composables réutilisables avec plusieurs effets internes, stores globaux, logique à durée de vie contrôlée (session utilisateur, connexion WebSocket).

```ts
// Composable avec effectScope
export function useFamilyDashboard() {
  const scope = effectScope()
  const routines = ref<Routine[]>([])
  const meteo = ref<'légère' | 'normale' | 'chargée'>('normale')

  scope.run(() => {
    watch(routines, () => { meteo.value = calcMeteo(routines.value) }, { deep: true })
    watchEffect(() => {
      // sync automatique avec un WebSocket
      if (routines.value.length > 0) connectWs(routines.value[0].familyId)
    })
  })

  function dispose() { scope.stop() }

  return { routines, meteo, dispose }
}
```

### 2.8 `toRef` et `toRefs` — préserver la réactivité

Quand on extrait une propriété d'un `reactive`, la réactivité se perd si on utilise la destructuration classique.

```ts
const state = reactive({ count: 0, name: 'Alice' })

// ❌ Réactivité perdue — count est un number ordinaire
const { count } = state
count // jamais mis à jour

// ✅ toRef : crée une Ref<T> liée à state.count
const countRef = toRef(state, 'count')
countRef.value // réactif — mis à jour si state.count change
countRef.value = 5 // modifie aussi state.count

// ✅ toRefs : crée un objet de Ref pour chaque propriété
const { count: countR, name: nameR } = toRefs(state)
```

**Vue 3.3+ — `toRef` accepte un getter** (read-only) :

```ts
// Crée une ref calculée read-only depuis un getter
const double = toRef(() => state.count * 2)
double.value // lecture seule, comme computed
```

**Usage typique dans les composables** — retourner `toRefs(state)` permet au consommateur de destructurer sans perdre la réactivité :

```ts
export function useRoutine() {
  const state = reactive({ title: '', done: false, priority: 1 })

  // ✅ Le consommateur peut écrire :
  // const { title, done } = useRoutine()
  // et title reste réactif
  return toRefs(state)
}
```

### 2.9 `shallowRef` et `shallowReactive` — réactivité superficielle

Par défaut, `ref()` et `reactive()` rendent **tout l'arbre** réactif (conversion récursive). Pour les grands objets lus souvent mais rarement mutés en profondeur, cette conversion coûte cher.

`shallowRef` — seul le remplacement de `.value` est réactif :

```ts
import { shallowRef } from 'vue'

// Un grand dataset — on ne veut pas que Vue traverse 10 000 éléments
const dataset = shallowRef<Row[]>([])

// ✅ Déclenche la réactivité — on remplace .value entier
dataset.value = await fetchRows()

// ❌ Ne déclenche PAS la réactivité — mutation interne silencieuse
dataset.value[0].label = 'nouveau'
// → le template ne se met pas à jour
```

`shallowReactive` — seules les propriétés de **premier niveau** sont réactives :

```ts
import { shallowReactive } from 'vue'

const state = shallowReactive({
  count: 0,              // ✅ réactif
  user: { name: 'Bob' } // ❌ user.name n'est pas réactif
})

state.count++           // ✅ déclenche le rendu
state.user.name = 'Alice' // ❌ silencieux pour Vue
state.user = { name: 'Alice' } // ✅ déclenche le rendu (remplacement top-level)
```

### 2.10 `triggerRef` — forcer la mise à jour d'un shallowRef

Quand tu mutes l'intérieur d'un `shallowRef` (par ex. après une opération impérative sur le tableau brut), `triggerRef` force les watchers et le rendu à se remettre à jour.

```ts
import { shallowRef, triggerRef } from 'vue'

const rows = shallowRef<Row[]>([])

// Mutation interne (impérative, ex. sort in-place)
rows.value.sort((a, b) => a.priority - b.priority)

// rows.value a été muté mais Vue ne le sait pas encore
triggerRef(rows) // force le rendu + déclenche les watchers sur rows
```

### 2.11 `customRef` — ref avec comportement personnalisé

`customRef` crée une ref dont les accesseurs `get` et `set` sont entièrement contrôlés. Les deux arguments `track` et `trigger` connectent la ref au système de réactivité Vue.

```ts
import { customRef } from 'vue'

// Ref debouncée : le setter n'appelle trigger() qu'après un délai
function useDebouncedRef<T>(initialValue: T, delay = 300) {
  let timeout: ReturnType<typeof setTimeout>

  return customRef<T>((track, trigger) => ({
    get() {
      track()          // déclare cette lecture comme dépendance
      return initialValue
    },
    set(newValue) {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        initialValue = newValue
        trigger()      // notifie Vue que la valeur a changé
      }, delay)
    },
  }))
}

// Utilisation
const search = useDebouncedRef('', 400)
// search.value = 'tri' → trigger() ne s'exécute qu'après 400ms sans nouvelle frappe
```

> **Règle :** appeler `track()` dans `get` et `trigger()` dans `set`. Ne pas appeler `trigger()` dans `get` (boucle infinie).

### 2.12 `unref` — dés-emballer une valeur ou une ref

`unref(val)` retourne `val.value` si `val` est une ref, sinon retourne `val` directement. Indispensable dans les composables qui acceptent un paramètre `MaybeRef<T>`.

```ts
import { ref, unref } from 'vue'
import type { MaybeRef } from 'vue'

// ✅ Fonctionne que l'argument soit une ref ou une valeur brute
function double(val: MaybeRef<number>): number {
  return unref(val) * 2
}

const count = ref(5)
double(count) // → 10
double(3)     // → 6
```

---

## 3. Worked examples

### Exemple 1 — `DashboardFamille.vue` : watcher deep + watchEffect

```vue
<script setup lang="ts">
import { ref, watch, watchEffect, onUnmounted } from 'vue'

interface Routine {
  id: string
  title: string
  done: boolean
  skipped: boolean
  scheduledAt: string // ISO string
  priority: number
}

const routines = ref<Routine[]>([])
const meteoCharge = ref<'légère' | 'normale' | 'chargée'>('normale')
const isSyncing = ref(false)

// ─── Watcher deep sur les routines ───────────────────────────────────────
// deep:true → détecte routine.done = true, pas seulement routines.value = []
// immediate:true → calcule la météo dès le montage du composant
const stopRoutineWatch = watch(
  routines,
  (updatedRoutines) => {
    const done    = updatedRoutines.filter(r => r.done).length
    const total   = updatedRoutines.length
    const ratio   = total === 0 ? 0 : done / total

    if (ratio >= 0.8)       meteoCharge.value = 'légère'
    else if (ratio >= 0.4)  meteoCharge.value = 'normale'
    else                    meteoCharge.value = 'chargée'
  },
  { deep: true, immediate: true },
)

// ─── watchEffect : synchroniser l'indicateur "en cours de sync" ──────────
// watchEffect détecte automatiquement routines comme dépendance
const stopSyncEffect = watchEffect((onCleanup) => {
  if (routines.value.length === 0) return

  isSyncing.value = true
  const controller = new AbortController()

  fetch('/api/routines/sync', {
    method: 'POST',
    body: JSON.stringify(routines.value),
    signal: controller.signal,
  })
    .then(() => { isSyncing.value = false })
    .catch(() => { /* AbortError ignorée */ })

  // Annule la requête précédente si routines change avant la réponse
  onCleanup(() => {
    controller.abort()
    isSyncing.value = false
  })
})

// Arrêt manuel à onUnmounted (garantie même si le composable est utilisé hors setup)
onUnmounted(() => {
  stopRoutineWatch()
  stopSyncEffect()
})

async function loadRoutines(familyId: string) {
  routines.value = await fetch(`/api/families/${familyId}/routines`).then(r => r.json())
}
</script>

<template>
  <div>
    <span class="meteo" :data-level="meteoCharge">Météo : {{ meteoCharge }}</span>
    <span v-if="isSyncing">Sync en cours…</span>
  </div>
</template>
```

**Ce que montre cet exemple :**
- `deep: true` + `immediate: true` sur `watch(routines, ...)` : calcul au montage ET à chaque mutation d'une propriété interne.
- `watchEffect` avec `onCleanup` : requête HTTP annulée proprement avant chaque ré-exécution.
- Arrêt manuel dans `onUnmounted` — pattern défensif.

### Exemple 2 — Composable `useRoutineList` avec `effectScope`, `toRefs`, `shallowRef`

```ts
// composables/useRoutineList.ts
import {
  shallowRef, reactive, toRefs,
  effectScope, watch, triggerRef,
  type Ref,
} from 'vue'

interface Routine {
  id: string
  title: string
  done: boolean
  priority: number
}

export function useRoutineList(familyId: Ref<string>) {
  // shallowRef : Vue ne traverse pas les 200 routines à chaque accès
  const rows = shallowRef<Routine[]>([])

  const meta = reactive({
    loading: false,
    error: null as string | null,
    total: 0,
  })

  const scope = effectScope()

  scope.run(() => {
    // Watcher sur familyId — recharge à chaque changement
    watch(familyId, async (id) => {
      meta.loading = true
      meta.error = null
      try {
        rows.value = await fetch(`/api/families/${id}/routines`).then(r => r.json())
        meta.total = rows.value.length
      } catch (e) {
        meta.error = e instanceof Error ? e.message : 'Erreur réseau'
      } finally {
        meta.loading = false
      }
    }, { immediate: true })
  })

  function toggleDone(id: string) {
    const row = rows.value.find(r => r.id === id)
    if (row) {
      row.done = !row.done
      // shallowRef ne détecte pas la mutation interne → on force
      triggerRef(rows)
    }
  }

  function sortByPriority() {
    rows.value.sort((a, b) => b.priority - a.priority)
    triggerRef(rows)  // tri in-place → Vue ne le voit pas sans triggerRef
  }

  function dispose() {
    scope.stop()
  }

  // toRefs(meta) → le consommateur peut destructurer { loading, error, total }
  // et conserver la réactivité
  return { rows, ...toRefs(meta), toggleDone, sortByPriority, dispose }
}
```

**Ce que montre cet exemple :**
- `shallowRef` pour un grand tableau : seul le remplacement de `.value` est coûteux, pas les accès de rendu.
- `triggerRef` nécessaire après `sort()` in-place ou toute mutation silencieuse.
- `effectScope` : un seul `dispose()` arrête tous les watchers du composable.
- `toRefs(meta)` : le consommateur peut `const { loading, error } = useRoutineList(id)` et rester réactif.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — `watch` sur un reactive sans `deep` : watcher silencieux

```ts
const routine = reactive({ title: 'Sport', done: false })

// ❌ Ne se déclenche JAMAIS — routine.done = true est une mutation interne
watch(routine, () => console.log('changé'))

// ✅ Option A : deep:true
watch(routine, () => console.log('changé'), { deep: true })

// ✅ Option B : getter ciblé (plus performant)
watch(() => routine.done, (newVal) => console.log('done:', newVal))
```

**Pourquoi :** sans `deep`, Vue compare la référence de l'objet (l'objet `reactive` lui-même ne change jamais, c'est un Proxy fixe). La mutation d'une propriété ne change pas la référence.

### PIÈGE #2 — Fuite de watcher créé après `await`

```ts
// ❌ Ce watcher est créé HORS du scope de setup synchrone
// Vue ne peut pas l'arrêter automatiquement à onUnmounted
onMounted(async () => {
  await fetch('/api/init')
  watch(source, callback) // fuite si le composant est détruit avant que stop() soit appelé
})

// ✅ Arrêt manuel obligatoire
onMounted(async () => {
  await fetch('/api/init')
  const stop = watch(source, callback)
  onUnmounted(stop) // enregistrement du cleanup
})
```

### PIÈGE #3 — `shallowRef` muté sans `triggerRef`

```ts
const items = shallowRef<Item[]>([])

// ❌ Sort in-place + pas de triggerRef → template ne voit rien
items.value.sort((a, b) => a.order - b.order)

// ✅ Forcer la mise à jour après mutation interne
items.value.sort((a, b) => a.order - b.order)
triggerRef(items)

// ✅ Alternative : remplacer .value entier (pas besoin de triggerRef)
items.value = [...items.value].sort((a, b) => a.order - b.order)
```

### PIÈGE #4 — `toRefs` sur un reactive puis mutation directe

```ts
const state = reactive({ count: 0 })
const { count } = toRefs(state)

// count est une Ref<number> liée à state.count
count.value++       // ✅ modifie state.count
state.count++       // ✅ modifie count.value aussi (liaison bidirectionnelle)

// ❌ Piège : réassigner la déstructurée locale casse le lien
let { count: c } = toRefs(state) // let, pas const
c = ref(99)  // c pointe maintenant vers une nouvelle ref — la liaison est perdue
```

---

## 5. Ancrage TribuZen

Dans TribuZen, la logique réactive avancée s'applique dès le dashboard famille :

**`DashboardFamille.vue`** — `watch(routines, ..., { deep: true, immediate: true })` recalcule la météo de charge à chaque changement d'une routine (statut, heure, priorité). `watchEffect` avec `onCleanup` synchronise l'état avec l'API sans race condition.

**`composables/useRoutineList.ts`** — `shallowRef` pour le tableau de 100-300 routines (Vue ne traverse pas l'arbre entier à chaque render). `triggerRef` après un tri in-place. `effectScope` pour arrêter proprement l'ensemble du composable lors de la déconnexion ou du changement de famille.

**`composables/useSearch.ts`** — `customRef` debounced sur le champ de recherche : `trigger()` n'est appelé qu'après 400ms d'inactivité, ce qui évite une requête à chaque frappe.

Fichiers cibles dans `smaurier/tribuzen` :
```
tribuzen/
  src/
    views/
      DashboardFamille.vue      ← watch deep + watchEffect + onCleanup
    composables/
      useRoutineList.ts         ← shallowRef + triggerRef + effectScope + toRefs
      useSearch.ts              ← customRef debounced
```

---

## 6. Points clés

1. `watch` est lazy (ne s'exécute pas au montage sauf `immediate: true`) ; `watchEffect` est eager (toujours au montage).
2. `watch` sans `deep: true` sur un reactive/ref d'objet ne détecte pas les mutations internes — utiliser `deep: true` ou un getter ciblé.
3. `flush: 'post'` (ou `watchPostEffect`) est nécessaire pour lire le DOM mis à jour dans le callback.
4. `watch` et `watchEffect` créés dans `<script setup>` sont auto-arrêtés ; créés après `await`, ils fuient — appeler `onUnmounted(stop)`.
5. `effectScope` : un seul `scope.stop()` arrête tous les effets capturés — indispensable dans les composables complexes.
6. `toRef(state, 'prop')` et `toRefs(state)` créent des refs liées bidirectionnellement — permettent la destructuration sans perte de réactivité.
7. `shallowRef` et `shallowReactive` ne rendent réactif que le niveau supérieur — perf sur les grands datasets.
8. `triggerRef(shallowRef)` force les mises à jour après mutation silencieuse de l'intérieur d'un `shallowRef`.
9. `customRef((track, trigger) => ({ get, set }))` : appeler `track()` dans `get`, `trigger()` dans `set`.
10. `unref(val)` : retourne `val.value` si ref, sinon `val` — utile pour les fonctions qui acceptent `MaybeRef<T>`.

---

## 7. Seeds Anki

```
Pourquoi watch(routineObj, cb) ne réagit pas si on mute routineObj.done = true ?|Sans deep:true, watch compare la référence de l'objet (Proxy). Une mutation interne ne change pas la référence — le callback n'est jamais appelé. Corriger : { deep: true } ou un getter ciblé () => routineObj.done.
Quelle est la différence entre watch (lazy) et watchEffect (eager) ?|watch ne s'exécute qu'au changement de source (jamais au montage, sauf immediate:true). watchEffect s'exécute immédiatement au setup, puis à chaque changement des dépendances auto-détectées.
Quand utiliser flush:'post' (ou watchPostEffect) ?|Quand le callback doit lire le DOM après la mise à jour Vue — ex. mesurer la hauteur d'un élément, scroller vers un nouveau nœud. Sans flush:'post', le DOM n'est pas encore mis à jour quand le callback s'exécute.
Comment arrêter proprement un watcher créé après un await dans onMounted ?|watch/watchEffect créés après await sont hors du scope de setup et ne sont pas auto-arrêtés. Stocker la fonction stop et l'enregistrer : const stop = watch(...); onUnmounted(stop).
À quoi sert effectScope et quand l'utiliser ?|effectScope() crée un groupe qui capture watch, watchEffect, computed créés dans scope.run(). Un seul scope.stop() les arrête tous. Utile dans les composables complexes et les stores pour nettoyer en une ligne.
Pourquoi toRefs est-il nécessaire quand on retourne un reactive d'un composable ?|La destructuration d'un reactive perd la réactivité (const { count } = state → count est un number fixe). toRefs crée une Ref liée pour chaque propriété, permettant const { count } = useComposable() avec count réactif.
Quelle est la différence entre shallowRef et ref pour un grand tableau ?|ref rend tout l'arbre réactif (conversion récursive de chaque élément). shallowRef ne surveille que le remplacement de .value. Pour 200+ éléments rarement mutés en profondeur, shallowRef est significativement plus performant.
Pourquoi faut-il appeler triggerRef après un sort() in-place sur un shallowRef ?|shallowRef ne détecte pas les mutations internes (sort, push, splice). triggerRef force les watchers et le rendu à se déclencher comme si .value avait été remplacé.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-08-composition-api-avancee/README.md`. Construire la logique réactive du tracker de routines TribuZen — watch deep + watchEffect + toRefs + shallowRef + triggerRef — dans un composant Vue 3.5 avec Vite.
