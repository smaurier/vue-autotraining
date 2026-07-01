---
titre: Composants, props et emits
cours: 02-vue
notions: [defineProps typé, props optionnelles et par défaut withDefaults, flux de données descendant unidirectionnel, defineEmits typé, syntaxe emits Vue 3.3+, communication enfant vers parent, réactivité des props toRef toRefs, props destructuring réactif Vue 3.5]
outcomes:
  - sait déclarer des props typées avec defineProps<T>() et withDefaults
  - sait remonter une information au parent avec defineEmits typé
  - sait expliquer et respecter le flux de données unidirectionnel (one-way data flow)
  - sait garder la réactivité en déstructurant des props (toRefs, ou destructuring réactif 3.5)
prerequis: [04-evenements-et-v-model]
next: 06-lifecycle-hooks
libs: [{ name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — FamilyCard (prop family typée) qui émet select/leave vers le parent FamilyList
last-reviewed: 2026-07
---

← [04 — Événements et v-model](04-evenements-et-v-model.md) | [06 — Lifecycle hooks →](06-lifecycle-hooks.md)

# Composants, props et emits

> **Outcomes — tu sauras FAIRE :** déclarer des props TypeScript avec `defineProps<T>()`, remonter un événement vers le parent avec `defineEmits` typé (syntaxe Vue 3.3+), expliquer le flux unidirectionnel, et garder la réactivité en déstructurant des props.
> **Difficulté :** :star::star::star:
>
> **Portée :** ce module couvre la communication **parent ↔ enfant** via props et emits. `v-model` sur un composant (qui est une surcouche props + emits) est vu au **module 04**. Les slots et `defineExpose` sont au **module intermédiaire 01**.

---

## 1. Cas concret d'abord

Dans TribuZen, la page `FamilyList` affiche une liste de familles. Tu dois extraire `FamilyCard.vue` en composant réutilisable : il reçoit une famille en données et prévient le parent quand l'utilisateur clique "Rejoindre" ou "Quitter".

Un collègue a laissé ce début :

```vue
<!-- FamilyCard.vue — AVANT props/emits typés -->
<script setup lang="ts">
// ❓ Comment recevoir la famille depuis le parent ?
// ❓ Comment prévenir FamilyList quand l'utilisateur clique ?
// ❓ Peut-on modifier la famille reçue directement ici ?

const family = ???          // données venant du parent
function selectFamily() {
  // ??? comment remonter l'id au parent ?
}
</script>

<template>
  <div class="family-card">
    <h3>???</h3>
    <p>??? membres</p>
    <button @click="selectFamily">Rejoindre</button>
  </div>
</template>
```

Trois questions ouvertes que ce module résout :
1. `defineProps<T>()` — déclarer ce que le composant attend de son parent.
2. `defineEmits<T>()` — déclarer ce que le composant peut dire à son parent.
3. Le flux unidirectionnel — pourquoi l'enfant ne peut jamais modifier ce qu'il reçoit.

---

## 2. Théorie complète, concise

### 2.1 `defineProps<T>()` — déclaration type-based

`defineProps<T>()` est une **macro compilateur** (elle n'existe pas à runtime, Vue la supprime à la compilation). Elle prend un type générique et produit une validation Vue + un type TypeScript exact pour les props.

```vue
<script setup lang="ts">
// On déclare d'abord l'interface des données attendues
interface Family {
  id: string
  name: string
  memberCount: number
  createdAt: string
}

// Forme compacte (type inline)
const props = defineProps<{ family: Family }>()

// Forme avec interface nommée (recommandé quand plusieurs props)
interface Props {
  family: Family
}
const props = defineProps<Props>()

// Accès : props.family.name, props.family.id, etc.
</script>
```

> **Pas d'import** : `defineProps`, `defineEmits`, `withDefaults` sont des macros compilateur — elles sont disponibles sans import dans `<script setup>`.

#### Props required vs optional

Une prop est **requise par défaut** dans la déclaration type-based. Le `?` la rend optionnelle :

```ts
interface Props {
  family: Family       // ✅ required — le parent DOIT la passer
  highlighted?: boolean  // ✅ optional — le parent peut l'omettre
  maxMembers?: number    // ✅ optional
}
const props = defineProps<Props>()
// props.highlighted : boolean | undefined
```

### 2.2 `withDefaults` — valeurs par défaut

Pour les props optionnelles, `withDefaults` enveloppe `defineProps` et déclare les valeurs par défaut. TypeScript restreint alors le type (supprime `| undefined`) pour les props qui ont une valeur par défaut.

```ts
interface Props {
  family: Family
  highlighted?: boolean
  maxMembers?: number
  tags?: string[]       // ← type mutable : la valeur par défaut doit être une factory
}

const props = withDefaults(defineProps<Props>(), {
  highlighted: false,    // primitif — valeur directe
  maxMembers: 10,        // primitif — valeur directe
  tags: () => [],        // ⚠️ tableau/objet : TOUJOURS une factory () => []
})

// props.highlighted : boolean  (plus undefined)
// props.maxMembers  : number   (plus undefined)
```

> **Règle :** les valeurs par défaut de type objet ou tableau **doivent être des fonctions** `() => ({...})` / `() => []` pour éviter le partage d'état entre instances.

### 2.3 Flux de données unidirectionnel (one-way data flow)

Les props descendent **du parent vers l'enfant**. L'enfant peut les lire, jamais les écrire. C'est une règle architecturale fondamentale de Vue.

```ts
// ❌ INTERDIT — mutation directe d'une prop
props.family.name = 'Nouveau nom'   // Vue avertit en dev (warning console)
props.highlighted = true             // TS Error : Cannot assign to 'highlighted' (readonly)

// ✅ Si l'enfant a besoin d'un état local dérivé de la prop
const isHighlighted = ref(props.highlighted)
// isHighlighted est LOCAL à l'enfant — ne touche pas à la prop

// ✅ Si l'enfant veut demander une modification → il ÉMET un événement
emit('leave', props.family.id)
// Le parent décide s'il modifie ou non
```

**Pourquoi ?** Le parent est la **source de vérité**. Si l'enfant mutait les props, le flux de données deviendrait non-traçable — impossible de déboguer "qui a changé quoi ?". Le pattern props-down / events-up (données descendantes / événements ascendants) rend le data flow prédictible et testable.

### 2.4 `defineEmits<T>()` — syntaxe Vue 3.3+

`defineEmits<T>()` déclare les événements que le composant peut émettre. Vue 3.3 a introduit la **syntaxe named tuple** — plus concise que les signatures de fonction :

```ts
// ✅ Syntaxe Vue 3.3+ (named tuple) — RECOMMANDÉE
const emit = defineEmits<{
  select: [id: string]           // événement 'select' avec un payload string
  leave: [familyId: string]      // événement 'leave' avec un payload string
  close: []                      // événement 'close' sans payload
}>()

// Ancienne syntaxe (toujours valide, Vue 3.0+) — encore dans beaucoup de codebases
const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'leave', familyId: string): void
  (e: 'close'): void
}>()
```

Les deux formes sont TypeScript-only (type-based). La forme 3.3+ est à privilégier pour le nouveau code — même sémantique, moins de bruit.

### 2.5 Émettre vers le parent

`emit` est la fonction retournée par `defineEmits`. Elle accepte le nom de l'événement suivi du payload.

```vue
<script setup lang="ts">
interface Family { id: string; name: string; memberCount: number }

const props = defineProps<{ family: Family }>()

const emit = defineEmits<{
  select: [id: string]
  leave: [familyId: string]
}>()

// L'enfant émet — le parent réagit via @select / @leave
function handleSelect(): void {
  emit('select', props.family.id)    // TypeScript vérifie que l'arg est string
}

function handleLeave(): void {
  emit('leave', props.family.id)
}
</script>

<template>
  <div class="family-card">
    <h3>{{ props.family.name }}</h3>
    <p>{{ props.family.memberCount }} membres</p>
    <button @click="handleSelect">Rejoindre</button>
    <button @click="handleLeave">Quitter</button>
  </div>
</template>
```

Côté parent, on écoute avec `@nom-event` :

```vue
<FamilyCard
  :family="family"
  @select="onFamilySelected"
  @leave="onFamilyLeft"
/>
```

TypeScript infère le type du paramètre dans le handler parent depuis les emits déclarés.

### 2.6 Réactivité des props — `toRef` et `toRefs`

Une prop accédée via `props.family` est réactive — Vue traque les accès. Mais si on **déstructure** le résultat de `defineProps()` (en dehors de Vue 3.5), on casse la réactivité :

```ts
const props = defineProps<{ count: number; label: string }>()

// ❌ Casse la réactivité (Vue < 3.5 et code non compilé pour 3.5)
const { count, label } = props
// count et label sont des primitives copiées — plus réactives
// un watchEffect qui lit count ne se redéclenche pas si props.count change
```

**Solution < Vue 3.5 : `toRefs` et `toRef`**

```ts
import { toRefs, toRef } from 'vue'

const props = defineProps<{ count: number; label: string }>()

// toRefs : convertit TOUTES les props en refs réactives
const { count, label } = toRefs(props)
// count.value === props.count, réactif — se met à jour avec la prop

// toRef : convertit UNE seule prop en ref réactive
const count = toRef(props, 'count')
// count.value === props.count, réactif

// Usage : passer une prop à un composable sans perdre la réactivité
const { data } = useFamilyDetails(toRef(props, 'familyId'))
```

### 2.7 Destructuring réactif de props (Vue 3.5, stable)

Depuis **Vue 3.5**, le compilateur gère le destructuring de `defineProps()` comme réactif nativement. Il n'est plus nécessaire d'utiliser `toRefs` pour ce cas.

```vue
<script setup lang="ts">
import { watchEffect } from 'vue'

// ✅ Vue 3.5+ — destructuring directement depuis defineProps()
const { count, label = 'valeur par défaut' } = defineProps<{
  count: number
  label?: string
}>()

// count et label RESTENT réactifs
// Le compilateur transforme les accès à count/label en props.count/props.label
watchEffect(() => {
  console.log(count)   // se redéclenche bien quand la prop count change
})
</script>

<template>
  <!-- count et label s'utilisent directement, sans .value -->
  <p>{{ label }} : {{ count }}</p>
</template>
```

> **Défaut inline vs `withDefaults` :** en Vue 3.5+, `const { label = 'défaut' } = defineProps<...>()` remplace avantageusement `withDefaults` pour les cas simples. `withDefaults` reste la seule option en Vue < 3.5, et reste valide en 3.5 pour les valeurs complexes ou la lisibilité.

> **Important :** le destructuring réactif ne fonctionne qu'avec la valeur retournée par `defineProps()` directement. Destructurer `props` après coup (`const props = defineProps<...>(); const { count } = props`) casse toujours la réactivité même en 3.5.

---

## 3. Worked examples

### Exemple 1 — `FamilyCard.vue` complet (enfant)

```vue
<!-- src/components/family/FamilyCard.vue -->
<script setup lang="ts">
import { ref } from 'vue'

// ─── Types ───────────────────────────────────────────────────────────────────
// Définis dans types/ en vrai projet — inlinés ici pour la lisibilité
interface Family {
  id: string
  name: string
  memberCount: number
  createdAt: string
}

// ─── Props ───────────────────────────────────────────────────────────────────
// Props typées : family est required, highlighted est optional avec défaut
interface Props {
  family: Family
  highlighted?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  highlighted: false,
})

// ─── Emits (syntaxe Vue 3.3+) ────────────────────────────────────────────────
const emit = defineEmits<{
  select: [id: string]           // l'utilisateur veut rejoindre cette famille
  leave:  [familyId: string]     // l'utilisateur veut quitter cette famille
}>()

// ─── État local ──────────────────────────────────────────────────────────────
// Copie locale de highlighted pour permettre un toggle visuel côté enfant
// La prop props.highlighted RESTE inchangée — seul le parent peut la modifier
const isHighlighted = ref(props.highlighted)

// ─── Handlers ────────────────────────────────────────────────────────────────
function handleSelect(): void {
  emit('select', props.family.id)   // TS vérifie : id est string ✅
}

function handleLeave(): void {
  emit('leave', props.family.id)    // TS vérifie : familyId est string ✅
}
</script>

<template>
  <div
    class="family-card"
    :class="{ 'family-card--highlighted': isHighlighted }"
  >
    <h3>{{ props.family.name }}</h3>
    <p>{{ props.family.memberCount }} membres</p>
    <p class="family-card__date">Depuis {{ props.family.createdAt }}</p>

    <div class="family-card__actions">
      <!-- @click → handler → emit → parent réagit -->
      <button class="btn btn-primary" @click="handleSelect">
        Rejoindre
      </button>
      <button class="btn btn-ghost" @click="handleLeave">
        Quitter
      </button>
    </div>
  </div>
</template>
```

### Exemple 2 — `FamilyList.vue` (parent qui écoute les emits)

```vue
<!-- src/components/family/FamilyList.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import FamilyCard from './FamilyCard.vue'

interface Family {
  id: string
  name: string
  memberCount: number
  createdAt: string
}

// Le parent EST la source de vérité — il possède la liste
const families = ref<Family[]>([
  { id: 'f1', name: 'Les Dupont', memberCount: 4, createdAt: '2025-01' },
  { id: 'f2', name: 'Les Martin', memberCount: 2, createdAt: '2025-06' },
])

const selectedId = ref<string | null>(null)

// TS infère le type depuis defineEmits<{ select: [id: string] }>
// → le paramètre id est string automatiquement
function onFamilySelected(id: string): void {
  selectedId.value = id
  console.log('Famille sélectionnée :', id)
}

function onFamilyLeft(familyId: string): void {
  // Le parent décide de la logique — l'enfant n'a fait que signaler l'intention
  families.value = families.value.filter(f => f.id !== familyId)
}
</script>

<template>
  <section class="family-list">
    <h2>Familles disponibles</h2>

    <FamilyCard
      v-for="family in families"
      :key="family.id"
      :family="family"
      :highlighted="family.id === selectedId"
      @select="onFamilySelected"
      @leave="onFamilyLeft"
    />
  </section>
</template>
```

**Ce que TypeScript vérifie ici :**
- `:family="family"` — `family` doit correspondre à l'interface `Family` déclarée dans la prop.
- `:highlighted="family.id === selectedId"` — expression booléenne, compatible avec `boolean`.
- `onFamilySelected(id: string)` — le type `string` est inféré depuis les emits de `FamilyCard`.
- `emit('select', 42)` dans l'enfant serait une **erreur TS** : `number` n'est pas `string`.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Muter une prop directement

```ts
// ❌ FAUX — ne jamais écrire dans une prop
props.family.name = 'Nouveau nom'   // warning Vue en dev
props.highlighted = true             // TS Error : readonly

// ✅ CORRECT — émettre et laisser le parent décider
emit('rename', props.family.id, 'Nouveau nom')

// ✅ OU copie locale si l'état n'a pas besoin de remonter
const localName = ref(props.family.name)  // local, déconnecté de la prop
```

**Pourquoi c'est faux :** le parent possède la donnée. Muter la prop côté enfant crée une désynchronisation silencieuse — le parent pense avoir la valeur d'origine, l'enfant a muté autre chose. En mode strict Vue (production), la mutation est ignorée.

### PIÈGE #2 — Déstructurer `props` sans `toRefs` (Vue < 3.5)

```ts
const props = defineProps<{ count: number }>()

// ❌ casse la réactivité — count est une copie de la valeur au moment de la déstructuration
const { count } = props

watchEffect(() => console.log(count))   // ne se redéclenche PAS quand props.count change

// ✅ Option A : toRefs
const { count } = toRefs(props)
watchEffect(() => console.log(count.value))   // ✅ réactif

// ✅ Option B (Vue 3.5+) : destructurer depuis defineProps() directement
const { count } = defineProps<{ count: number }>()
watchEffect(() => console.log(count))   // ✅ réactif (compilateur gère ça)
```

**Signal d'alarme :** si une valeur dérivée d'une prop ne se met pas à jour dans un `watchEffect` ou un `computed`, la première cause à vérifier est ce piège.

### PIÈGE #3 — Emits non typés (runtime-only)

```ts
// ❌ runtime-only — aucune vérification TypeScript
const emit = defineEmits(['select', 'leave'])
emit('select', 42)    // aucune erreur TS — le bug passe à la compilation

// ✅ type-based — TypeScript vérifie chaque emit
const emit = defineEmits<{
  select: [id: string]
  leave: [familyId: string]
}>()
emit('select', 42)    // TS Error : Argument of type 'number' is not assignable to type 'string'
```

**Pourquoi c'est faux :** sans typage, un refactor qui change le payload d'un événement ne sera pas détecté. On découvre le bug au runtime (ou pas du tout si le handler est permissif).

### PIÈGE #4 — `withDefaults` avec un tableau/objet sans factory

```ts
// ❌ valeur partagée entre toutes les instances du composant
const props = withDefaults(defineProps<{ tags?: string[] }>(), {
  tags: [],       // ← même tableau référencé par toutes les instances !
})

// ✅ factory : chaque instance reçoit son propre tableau
const props = withDefaults(defineProps<{ tags?: string[] }>(), {
  tags: () => [],
})
```

C'est le même piège que les valeurs `data()` partagées en Options API. En Vue 3, `withDefaults` suit la même règle : **objets et tableaux → factory function**.

---

## 5. Ancrage TribuZen

La communication props/emits est le pattern central du front-office TribuZen.

**`FamilyCard.vue`** (ce module, Exemples 1 & 2) :
- Reçoit `family: Family` en prop (données depuis l'API, gérées par le parent)
- Émet `select: [id: string]` → `FamilyList` met à jour `selectedId`
- Émet `leave: [familyId: string]` → `FamilyList` filtre la liste

**`FamilyList.vue`** → **`FamilyCard.vue`** → émit **`select`** → `FamilyList` → API call `/api/families/:id/join`

Ce flux est **unidirectionnel** : aucun composant ne modifie les données d'un autre directement. Le parent (`FamilyList`) est la source de vérité — il reçoit l'intention de l'enfant via l'emit et décide de la logique.

```
tribuzen/
  src/
    components/
      family/
        FamilyList.vue    ← parent, source de vérité
        FamilyCard.vue    ← enfant, props + emits (ce module)
    types/
      family.ts           ← interface Family partagée
```

---

## 6. Points clés

1. `defineProps<T>()` est une macro compilateur — déclaration type-based, aucun runtime overhead, TS exact.
2. Une prop sans `?` est **required** ; avec `?` elle est optionnelle (`undefined` si non fournie).
3. `withDefaults` donne des valeurs par défaut — types mutable (tableaux, objets) exigent une **factory** `() => []`.
4. Le flux est **unidirectionnel** : props descendent (parent → enfant), emits montent (enfant → parent). L'enfant ne mute jamais une prop.
5. `defineEmits<{ event: [payload] }>()` — syntaxe named tuple **Vue 3.3+** — plus concise que les signatures de fonction.
6. Déstructurer `props` directement casse la réactivité en **Vue < 3.5** — utiliser `toRefs(props)` ou `toRef(props, 'key')`.
7. En **Vue 3.5+**, la déstructuration depuis `defineProps()` est réactive nativement — le compilateur injecte `props.` automatiquement.
8. `withDefaults` reste valide en Vue 3.5 (bon pour les objets complexes) ; la syntaxe `const { x = défaut } = defineProps()` est son alternative native depuis 3.5.

---

## 7. Seeds Anki

```
Quelle est la syntaxe defineEmits recommandée en Vue 3.3+ pour un événement select avec un payload string ?|const emit = defineEmits<{ select: [id: string] }>(). Named tuple syntax — plus concise que les call signatures (e: 'select', id: string): void.
Pourquoi ne faut-il jamais muter une prop directement ?|Le parent est la source de vérité. L'enfant mute → désynchronisation silencieuse entre parent et enfant. Pattern correct : émettre un événement et laisser le parent décider de la modification.
Que se passe-t-il si on déstructure props directement en Vue 3.4 ?|const { count } = props → count est une primitive copiée, plus réactive. Les watchEffect/computed qui lisent count ne se redéclenchent plus. Utiliser toRefs(props) ou toRef(props, 'count') pour garder la réactivité.
Depuis quelle version Vue le destructuring de defineProps() est-il réactif nativement ?|Vue 3.5 (stable). Le compilateur transforme les accès aux variables destructurées en accès à props.xxx. Avant 3.5, il fallait toRefs.
Pourquoi les valeurs par défaut de tableau/objet dans withDefaults doivent-elles être des factories ?|Une valeur directe (tags: []) est partagée entre toutes les instances du composant. La factory (tags: () => []) crée un nouveau tableau pour chaque instance — même principe que data() en Options API.
Comment déclarer une prop optionnelle avec withDefaults ?|Marquer la prop avec ? dans l'interface : highlighted?: boolean. Puis withDefaults(defineProps<Props>(), { highlighted: false }). TypeScript supprime | undefined du type dans le composant.
Quelle est la différence entre toRef et toRefs pour les props ?|toRefs(props) convertit toutes les props en refs (const { a, b } = toRefs(props)). toRef(props, 'key') convertit une seule prop en ref. Les deux maintiennent la réactivité en Vue < 3.5.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-05-composants-props-emits/README.md`. Construire `FamilyCard.vue` + `FamilyList.vue` à partir de zéro avec `vue-tsc --noEmit` comme oracle — props typées, emits tuple Vue 3.3+, corrigé commenté intégral.
