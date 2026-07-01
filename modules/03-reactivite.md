---
titre: Réactivité (Composition API)
cours: 02-vue
notions: [ref, reactive, computed, watch, watchEffect, toRef, toRefs, shallowRef, shallowReactive, script setup]
outcomes:
  - sait choisir ref vs reactive selon le cas
  - sait choisir computed / watch / watchEffect selon le besoin
  - sait diagnostiquer et corriger une perte de réactivité (toRefs)
prerequis: [00-typer-vue3, 02-template-et-directives, JavaScript ES6+]
next: 04-evenements-et-v-model
libs: [{ name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — catalogue de composants Vue réactifs
last-reviewed: 2026-07
---

# Réactivité (Composition API)

> **Outcomes — tu sauras FAIRE :** choisir `ref` vs `reactive` selon le contexte, choisir `computed` / `watch` / `watchEffect` selon le besoin, diagnostiquer et corriger une perte de réactivité (`toRefs`).
> **Difficulté :** :star::star::star:
>
> **Portée :** ce module couvre les **primitives de réactivité** de la Composition API. `defineProps` / `defineEmits` (communication parent-enfant) sont vus au **module 05**, et le pattern **composable** `use...` complet au **module intermédiaire 02-composables** — ici on ne fait que les esquisser comme motivation.

## 1. Cas concret d'abord

Tu intègres TribuZen. Le composant `FamilyMemberList` permet d'ajouter des membres à une famille et de les filtrer par nom. Le code actuel ne réagit à rien.

```vue
<!-- FamilyMemberList.vue — version cassée, à corriger -->
<script setup>
let members = [
  { id: 1, name: 'Alice', role: 'parent' },
  { id: 2, name: 'Bob',   role: 'enfant' },
]
let search = ''

// Bug 1 : members est un tableau JS ordinaire — Vue ne le surveille pas
function addMember(name) {
  members.push({ id: Date.now(), name, role: 'enfant' })
  // le template ne se met pas à jour
}

// Bug 2 : search est une variable primitive JS — Vue n'y réagit pas
function updateSearch(event) {
  search = event.target.value
}

// Bug 3 : filteredMembers recalcule seulement une fois (valeur plain)
const filteredMembers = members.filter(m =>
  m.name.toLowerCase().includes(search.toLowerCase())
)
</script>

<template>
  <input @input="updateSearch" placeholder="Filtrer..." />
  <ul>
    <li v-for="m in filteredMembers" :key="m.id">{{ m.name }}</li>
  </ul>
  <button @click="addMember('Charlie')">Ajouter Charlie</button>
</template>
```

**Trois problèmes distincts, trois primitives Vue à connaître.** Avant de lire la théorie : que manque-t-il ici ?

---

## 2. Théorie complète, concise

### 2.1 `ref` — envelopper n'importe quelle valeur

`ref` accepte **toute valeur** (primitive ou objet) et retourne un `Ref<T>` : un objet avec un `.value` qui déclenche le système réactif de Vue.

```ts
import { ref } from 'vue'

const count = ref(0)           // Ref<number>
const name  = ref('Alice')     // Ref<string>
const user  = ref({ id: 1 })  // Ref<{ id: number }>

count.value++                  // déclenche la réactivité
console.log(count.value)       // 1
```

Dans le `<template>`, Vue **auto-unwrap** les refs de premier niveau : écrire `{{ count }}`, pas `{{ count.value }}`.

### 2.2 `reactive` — Proxy profond sur un objet

`reactive` n'accepte que des **objets / tableaux / Map / Set**. Il retourne un Proxy ES2015 qui intercepte chaque lecture et écriture de propriété.

```ts
import { reactive } from 'vue'

const state = reactive({ count: 0, name: 'Alice' })

state.count++       // réactif, accès direct, pas de .value
state.name = 'Bob'  // réactif
```

Modification profonde incluse sans rien déclarer : `state.user.profile.avatar = '...'` déclenche la réactivité.

### 2.3 Sous le capot : RefImpl vs Proxy

| | `ref` | `reactive` |
|---|---|---|
| Mécanisme | `RefImpl` — classe avec `get/set value()` | ES2015 `Proxy` sur l'objet entier |
| Marqueur interne | `__v_isRef: true` | `__v_isReactive: true` |
| Accès | `.value` obligatoire en script | direct (`state.prop`) |
| Primitives | Oui | **Non** — les primitives ne peuvent pas être Proxy |
| Destructuring | Sûr (la ref reste une ref) | **Perd la réactivité** (voir Piège #2) |

Vue 3 utilise un système d'`effect scope` : chaque `ref` ou propriété `reactive` s'enregistre dans le graphe de dépendances actif. Toute lecture d'une valeur réactive pendant l'exécution d'un `effect` (render, computed, watch) crée un lien. Toute écriture notifie les effets abonnés.

### 2.4 Quand utiliser lequel

| Cas | Primitive à privilégier |
|-----|------------------------|
| Une valeur primitive (string, number, boolean) | `ref` — `reactive` ne peut pas les envelopper |
| Un objet dont on a besoin en entier (formulaire, entité) | `reactive` (ou `ref` selon préférence) |
| Dans un composable, valeur retournée | `ref` — permet la destructuration sans `toRefs` |
| État local simple dans un `<script setup>` | `ref` par convention (plus lisible, moins de pièges) |
| Collection (Array, Map, Set) | `reactive` (ou `ref` si l'array est remplacé en entier) |

### 2.5 `computed` — valeur dérivée, mise en cache

`computed` crée une ref **calculée** à partir d'autres valeurs réactives. Le résultat est mis en cache et ne recalcule que si une dépendance change.

```ts
import { ref, computed } from 'vue'

const count = ref(2)

// Lecture seule
const double = computed(() => count.value * 2)
console.log(double.value) // 4
// double.value++ → erreur TypeScript, readonly

// Lecture+écriture (getter + setter)
const doubleWritable = computed({
  get: () => count.value * 2,
  set: (val) => { count.value = val / 2 }
})
doubleWritable.value = 10 // count.value devient 5
```

**Différence computed vs method :**

```ts
// method : recalcule à CHAQUE render, même si count n'a pas changé
function getDouble() { return count.value * 2 }

// computed : recalcule uniquement quand count.value change
const double = computed(() => count.value * 2)
```

Si la valeur dérivée est utilisée plusieurs fois dans le template, ou si son calcul est coûteux → `computed`. Si elle dépend d'arguments → méthode.

### 2.6 `watch` — surveiller des sources explicites

```ts
import { watch } from 'vue'

// Une ref
watch(count, (newVal, oldVal) => {
  console.log(`${oldVal} → ${newVal}`)
})

// Getter (pour une propriété reactive)
watch(() => state.name, (name) => console.log(name))

// Plusieurs sources
watch([refA, refB], ([a, b], [prevA, prevB]) => { /* ... */ })

// Options
watch(count, callback, {
  immediate: true,   // exécuter tout de suite avec undefined comme oldVal
  deep: true,        // surveiller les mutations profondes (coûteux sur gros objets)
  flush: 'post',     // 'pre' (défaut) | 'post' (après rendu) | 'sync'
  once: true,        // Vue 3.4+ : callback appelé une seule fois puis stop automatique
})
```

**Cleanup** — annuler un effet secondaire avant la prochaine exécution :

```ts
watch(userId, (newId, oldId, onCleanup) => {
  const controller = new AbortController()
  fetch(`/api/users/${newId}`, { signal: controller.signal })
    .then(r => r.json())
    .then(data => { userData.value = data })
  onCleanup(() => controller.abort()) // appelé avant le prochain watch
})
```

La valeur retournée par `watch` est un `WatchHandle` avec `.stop()`, `.pause()`, `.resume()` (Vue 3.5).

### 2.7 `watchEffect` — effet auto-tracké

`watchEffect` exécute la fonction **immédiatement** et re-exécute dès qu'une dépendance réactive accédée à l'intérieur change. Pas de source explicite, pas d'accès à `oldVal`.

```ts
import { watchEffect } from 'vue'

watchEffect(() => {
  // Vue note que userId.value est lu ici → dépendance automatique
  document.title = `Membres de la famille ${familyId.value}`
})

// Avec cleanup
watchEffect((onCleanup) => {
  const abort = new AbortController()
  fetchMembers(familyId.value, abort.signal)
  onCleanup(() => abort.abort())
})
```

**watch vs watchEffect en un coup d'œil :**

| | `watch` | `watchEffect` |
|---|---|---|
| Sources | Explicites | Auto-trackées |
| Premier appel | Lazy (sauf `immediate: true`) | Immédiat toujours |
| Accès à `oldVal` | Oui | Non |
| Flush par défaut | `'pre'` | `'pre'` |
| Cas d'usage | Réagir à un changement précis, comparer old/new | Effets de synchronisation (fetch, DOM, timer) |

### 2.8 Perte de réactivité — trois pièges classiques

**Cas 1 : destructuring d'un `reactive`**

```ts
const state = reactive({ count: 0, name: 'Alice' })

const { count } = state // ❌ count est un number ordinaire, plus réactif
count++ // ne déclenche rien dans le template
```

**Cas 2 : réassigner une variable `reactive`**

```ts
let state = reactive({ count: 0 })
state = reactive({ count: 99 }) // ❌ le template tient toujours l'ancienne référence
```

**Cas 3 : sortir une primitive d'une `ref`**

```ts
const count = ref(0)
let n = count.value // ❌ n = 0, plain number
n++ // count.value inchangé, rien ne réagit
```

### 2.9 `toRef` et `toRefs` — le fix pour le destructuring

```ts
import { reactive, toRef, toRefs } from 'vue'

const state = reactive({ count: 0, name: 'Alice' })

// toRefs : convertit TOUTES les propriétés en Ref synchronisées
const { count, name } = toRefs(state)
count.value++ // state.count vaut 1 — bidirectionnel
name.value = 'Bob' // state.name vaut 'Bob' — bidirectionnel

// toRef : une propriété à la fois (utile dans les composables)
const countRef = toRef(state, 'count')

// Vue 3.3+ : toRef accepte aussi un getter
const doubleRef = toRef(() => state.count * 2) // readonly Ref
```

`toRefs` est le pattern standard pour retourner un `reactive` depuis un composable tout en permettant la destructuration :

```ts
// DANS LE COMPOSABLE
export function useCounter() {
  const state = reactive({ count: 0 })
  function increment() { state.count++ }
  return { ...toRefs(state), increment }
}

// DANS LE COMPOSANT
const { count, increment } = useCounter() // count est un Ref — ok
```

### 2.10 `shallowRef` et `shallowReactive`

Quand la réactivité profonde est inutile ou coûteuse (gros dataset, objet externe non maîtrisé) :

```ts
import { shallowRef, shallowReactive } from 'vue'

// shallowRef : SEUL le remplacement de .value est réactif
// les mutations internes ne le sont PAS
const bigList = shallowRef([{ id: 1 }, { id: 2 }])
bigList.value[0].id = 99  // ❌ pas de mise à jour du template
bigList.value = [...bigList.value] // ✅ remplacement complet → réactif

// shallowReactive : seules les propriétés de premier niveau sont réactives
const config = shallowReactive({ theme: 'dark', nested: { fontSize: 14 } })
config.theme = 'light'        // ✅ réactif
config.nested.fontSize = 16  // ❌ pas réactif
```

Cas d'usage : intégrer une bibliothèque externe qui gère son propre état interne, ou des tableaux de milliers d'entrées où le suivi profond serait trop coûteux.

### 2.11 `<script setup>` — le contexte d'exécution de la réactivité

`<script setup>` est la syntaxe recommandée. C'est du sucre syntaxique compilé vers `setup()` : tout ce qui est déclaré au niveau racine (refs, computed, fonctions) est automatiquement exposé au template. C'est ici que vivent toutes les primitives vues plus haut.

```vue
<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// État local réactif
const members = ref<Array<{ id: string; name: string }>>([])

// Valeur dérivée mise en cache
const count = computed(() => members.value.length)

// Effet déclenché sur changement
watch(count, (n) => console.log(`${n} membre(s)`))

async function loadMembers() {
  const data = await fetch('/api/members').then(r => r.json())
  members.value = data // remplacement → réactif
}
</script>

<template>
  <p>{{ count }} membre(s)</p>
</template>
```

> **Forward-reference — hors périmètre ici.** Passer des données au composant via `defineProps` et remonter des événements via `defineEmits` (deux **macros compilateur** de `<script setup>`) relèvent de la **communication entre composants → module 05 (composants-props-emits)**. Dans ce module, on reste sur l'état réactif local.

### 2.12 Vers les composables (motivation, pas encore le pattern complet)

Quand une logique réactive (état + dérivés + surveillance) doit être **réutilisée** entre composants, on l'extrait dans une fonction qui retourne des refs — un *composable*, conventionnellement préfixé `use...`.

```ts
// Aperçu — le pattern complet (paramètres réactifs, lifecycle,
// nettoyage, tests) est vu au module intermédiaire 02-composables.
function useCount() {
  const count = ref(0)
  const double = computed(() => count.value * 2)
  return { count, double } // des refs → destructurables sans toRefs
}
```

Retenir seulement, pour ce module : **une fonction qui retourne des `ref`/`computed` reste réactive après destructuration** — c'est justement pourquoi on retourne des refs, pas un `reactive` (voir 2.9). Le reste (hooks de cycle de vie, paramètres `Ref<T>`, conventions) est traité au module dédié.

---

## 3. Worked examples

### Exemple 1 — état réactif complet dans un composant (ref + computed + watch)

On corrige le composant cassé de la section 1, en assemblant les trois primitives : `ref` pour l'état mutable, `computed` pour la valeur dérivée, `watch` pour l'effet de bord (log de recherche debouncé).

```vue
<!-- FamilyMemberList.vue — version corrigée -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Member {
  id: string
  name: string
  role: 'parent' | 'enfant'
  online: boolean
}

// 1. ÉTAT — ref : le tableau est remplacé en entier à chaque mutation
const members = ref<Member[]>([
  { id: '1', name: 'Alice', role: 'parent', online: true },
  { id: '2', name: 'Bob',   role: 'enfant', online: false },
])
const query = ref('') // primitive → ref obligatoire

// 2. DÉRIVÉ — computed : recalcule seulement si members ou query change
const filtered = computed(() => {
  const q = query.value.toLowerCase().trim()
  return q === '' ? members.value
    : members.value.filter(m => m.name.toLowerCase().includes(q))
})
const onlineCount = computed(() => members.value.filter(m => m.online).length)

// 3. EFFET — watch explicite + cleanup pour debouncer le log de recherche
watch(query, (q, _oldQ, onCleanup) => {
  const timer = setTimeout(() => {
    if (q.trim()) console.log('[analytics] search:', q)
  }, 300)
  onCleanup(() => clearTimeout(timer)) // annule le timer précédent
})

function addMember(name: string) {
  // remplacement du tableau → identité change → Vue re-rend
  members.value = [
    ...members.value,
    { id: crypto.randomUUID(), name, role: 'enfant', online: false },
  ]
}
</script>

<template>
  <p>{{ onlineCount }} membre(s) en ligne</p>
  <input v-model="query" placeholder="Filtrer par nom..." />
  <ul>
    <li v-for="m in filtered" :key="m.id">{{ m.name }} — {{ m.role }}</li>
  </ul>
  <button @click="addMember('Charlie')">Ajouter Charlie</button>
</template>
```

Chaque fois que `query.value` change (via `v-model`), `filtered` se recalcule automatiquement. Chaque `addMember` remplace `members.value` en entier → Vue détecte le changement d'identité et re-rend. Les trois bugs de la section 1 sont corrigés par les trois primitives correspondantes.

### Exemple 2 — perte de réactivité et fix `toRefs`

Le piège n°1 en situation réelle : on regroupe l'état dans un `reactive`, on le destructure pour raccourcir le code, et tout casse silencieusement.

```ts
import { reactive, toRefs, watchEffect } from 'vue'

const form = reactive({ name: '', valid: false })

// ❌ AVANT — destructuring direct : name est un string figé
// const { name } = form
// watchEffect(() => console.log(name)) // ne re-log jamais

// ✅ APRÈS — toRefs : chaque propriété devient une Ref synchronisée
const { name, valid } = toRefs(form)

watchEffect(() => {
  // lit name.value → dépendance trackée
  valid.value = name.value.trim().length > 1
})

name.value = 'Alice'   // form.name = 'Alice' ET valid.value passe à true
console.log(form.valid) // true — la liaison est bidirectionnelle
```

Règle mémo : on ne destructure **jamais** un `reactive` sans le passer par `toRefs` (ou `toRef` propriété par propriété). Un `ref`, lui, se transporte sans risque.

### Exemple 3 — `computed` writable pour un filtre bidirectionnel

Contexte : un filtre "Rôle" dans TribuZen qui affiche des tags sélectionnables. L'URL query param et le filtre local doivent rester synchronisés.

```ts
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const route  = useRoute()
const router = useRouter()

// La vraie source de vérité : le query param URL
const selectedRole = computed<string>({
  get() {
    return (route.query.role as string) ?? ''
  },
  set(role: string) {
    router.replace({ query: { ...route.query, role: role || undefined } })
  }
})

// Dans le template : v-model="selectedRole" fonctionne directement
// Sélectionner "parent" → l'URL devient ?role=parent
// Revenir en arrière dans le navigateur → selectedRole se met à jour
```

Un `computed` writable est le bon outil quand la valeur dérivée a une source externe (URL, store, prop parent). Le setter normalise la mutation vers la vraie source.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — "ref = variable, reactive = fonction" — FAUX, le plus dangereux

Ce modèle mental est **incorrect et répandu**. Il génère des bugs subtils en entretien et en mission.

**La confusion** : certains pensent que `ref` sert aux "simples variables" et `reactive` aux "objets complexes ou à la logique". Ce n'est pas le critère.

**Le correct** :
- `ref` enveloppe **TOUTE valeur** — primitive ou objet — via `.value`.
- `reactive` enveloppe un **objet ou collection** via un Proxy (sans `.value`, mais fragile au destructuring).

```ts
// ref → primitive ✅
const count = ref(0)

// ref → objet ✅ (parfaitement valide, même recommandé dans les composables)
const user = ref({ id: 1, name: 'Alice' })
user.value.name = 'Bob' // réactif

// reactive → objet ✅
const state = reactive({ count: 0 })

// reactive → primitive ❌ — ne fonctionne pas, TypeScript le refuse
const count2 = reactive(0) // Argument of type 'number' is not assignable
```

La vraie règle de choix : **si tu dois retourner la valeur depuis un composable et la destructurer → `ref`**. Si tu regroupes plusieurs champs d'état liés et que tu ne destructures pas → `reactive` est lisible. Dans le doute, `ref` est le choix sûr.

### PIÈGE #2 — Destructuring un `reactive` = perte de réactivité immédiate

```ts
const state = reactive({ count: 0, name: 'Alice' })

// ❌ count et name sont des primitives JS extraites, plus trackées
const { count, name } = state
count++ // state.count reste à 0, le template ne réagit pas

// ✅ toRefs : chaque propriété devient une Ref synchronisée
const { count, name } = toRefs(state)
count.value++ // state.count = 1, le template réagit
```

Symptôme en entretien : "Mon composable fonctionne si je lis `state.count` directement, mais pas si je destructure." → manque de `toRefs`.

### PIÈGE #3 — `.value` dans le template

```vue
<template>
  <!-- ❌ affiche "[object Object]" ou des erreurs -->
  {{ count.value }}

  <!-- ✅ Vue auto-unwrap les refs de premier niveau dans le template -->
  {{ count }}
</template>
```

L'auto-unwrap s'applique **uniquement aux refs de premier niveau** dans `<script setup>`. Une ref imbriquée dans un objet (`state.countRef.value`) nécessite toujours `.value` dans le template.

### PIÈGE #4 — Réassigner une variable `let reactive`

```ts
let state = reactive({ count: 0 })

// ❌ le template pointe toujours vers l'ancienne référence Proxy
state = reactive({ count: 99 }) // nouvel objet, ancienne variable "state" dans le template

// ✅ modifier les propriétés existantes
state.count = 99

// ✅ remplacement massif
Object.assign(state, { count: 99, name: 'new' })
```

### PIÈGE #5 — `watchEffect` quand `watch` est nécessaire

`watchEffect` ne donne pas accès à la valeur précédente. Utiliser `watch` dès qu'on compare old/new, ou qu'on veut un déclenchement lazy (ne pas exécuter immédiatement).

```ts
// ❌ watchEffect ne peut pas comparer
watchEffect(() => {
  if (count.value > /* ??? ancienne valeur */) { /* ... */ }
})

// ✅ watch
watch(count, (newVal, oldVal) => {
  if (newVal > oldVal) sendAlert('augmentation détectée')
})
```

> **Piège entretien** : "Quelle est la différence entre `watch` et `watchEffect` ?" La réponse attendue couvre : (1) source implicite vs explicite, (2) accès à `oldVal`, (3) lazy vs immédiat par défaut. Donner seulement "watchEffect est immédiat" est insuffisant.

---

## 5. Ancrage TribuZen

**Assumption** : progress.md ne liste pas 02-vue dans le mapping explicite. Couche retenue : *front-office TribuZen — catalogue de composants Vue réactifs (prototype lab Vue avant adoption Nuxt)*.

Dans TribuZen, les primitives de réactivité vues ici pilotent la vue `FamilyMemberList.vue` — le catalogue de membres de famille :

**1. État de la liste — `ref<Member[]>`**
La liste des membres est un `ref` remplacé en entier après chaque fetch/mutation (Exemple 1). C'est la source de vérité réactive du catalogue.

**2. Recherche réactive — `query = ref('')` + `filtered = computed(...)`**
Le moteur de filtrage du catalogue : la saisie est un `ref`, la liste filtrée un `computed` mis en cache. Aucune dépendance externe → testable en isolation avec Vitest (c'est l'objet du lab).

**3. Effets — `watch` debouncé**
Le log analytics de recherche est un `watch(query, …)` avec `onCleanup` (debounce). Même mécanisme réutilisé plus tard pour déclencher un refetch au changement de famille.

> La réutilisation de cette logique entre composants (extraction en composable `useMembers`) et la communication parent→enfant (`MemberCard` via props/emits) arrivent aux modules **02-composables (intermédiaire)** et **05 (props/emits)**. Ici, on stabilise d'abord les primitives.

Fichier cible dans smaurier/tribuzen :
```
tribuzen/
  components/
    FamilyMemberList.vue   ← état réactif de l'Exemple 1
```

---

## 6. Points clés

1. `ref` enveloppe **toute valeur** (primitive ou objet) via `.value` — pas seulement les primitives.
2. `reactive` enveloppe uniquement des **objets** via un Proxy — pas de `.value`, mais fragile au destructuring.
3. Destructurer un `reactive` directement brise la réactivité — fix : `toRefs(state)` ou `toRef(state, 'prop')`.
4. `computed` met le résultat en **cache** entre les renders — une méthode ne cache pas.
5. `watch` = source explicite + accès à `oldVal` + lazy par défaut.
6. `watchEffect` = auto-tracking + immédiat — pas d'accès à `oldVal`.
7. `flush: 'post'` si le callback a besoin d'accéder au DOM mis à jour (après le rendu).
8. `shallowRef` / `shallowReactive` = réactivité de surface uniquement — pour les gros objets ou intégrations externes.
9. Une fonction qui retourne des `ref`/`computed` reste réactive après destructuration — base des composables (pattern complet au module 02-composables).
10. `defineProps` / `defineEmits` (props/emits) ne sont **pas** dans ce module — ils relèvent du module 05.

---

## 7. Seeds Anki

```
Quelle valeur ref() peut-il envelopper ?|N'importe quelle valeur : primitive (number, string, boolean) ou objet. Accès toujours via .value en script.
Pourquoi destructurer un reactive() brise la réactivité ?|Le destructuring extrait une valeur primitive JS ordinaire — la liaison avec le Proxy est coupée. Fix : toRefs(state) qui retourne des Ref synchronisées.
Différences clés watch vs watchEffect ?|watch = source explicite, lazy, accès à oldVal. watchEffect = auto-tracking, immédiat, pas d'oldVal.
Quand utiliser computed vs une méthode ?|computed si le calcul est coûteux ou utilisé plusieurs fois dans le template : résultat mis en cache jusqu'à changement de dépendance. Méthode si la valeur dépend d'arguments ou doit être recalculée à chaque appel.
Comment rendre un composable destructurable sans perdre la réactivité ?|Retourner des ref individuelles, pas un reactive. Si on part d'un reactive, appliquer toRefs(state) avant de retourner.
À quoi sert flush: 'post' dans watch / watchEffect ?|Exécuter le callback APRÈS le rendu Vue, quand les refs de template (DOM) sont à jour. Par défaut 'pre' = avant le rendu.
Différence shallowRef vs ref pour un tableau ?|ref suit les mutations profondes (push, splice). shallowRef ne réagit qu'au remplacement de .value en entier — mutations internes ignorées.
Comment passer une prop à un composable et garder la réactivité ?|Passer une Ref<T> ou un getter () => prop.value. Passer prop.value directement = valeur brute non réactive dans le composable.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-03-reactivite/README.md`. Construire l'état réactif de `FamilyMemberList` (ref/computed/watch), reproduire puis corriger une perte de réactivité avec `toRefs`, le tout couvert par des tests Vitest — corrigé commenté ligne à ligne.
