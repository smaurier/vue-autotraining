---
titre: Options API vs Composition API
cours: 02-vue
notions: [Options API structure, Composition API script setup, comparaison des deux styles, réutilisation de logique composables vs mixins, quand choisir chaque style, migration Options vers Composition, organisation par fonctionnalité vs par option]
outcomes:
  - sait lire et écrire un composant dans les deux styles (Options et Composition)
  - sait expliquer pourquoi la Composition API améliore la réutilisation de logique (vs mixins)
  - sait migrer un composant simple d'Options API vers Composition API
  - sait choisir le style adapté à un contexte d'équipe / de projet
prerequis: [06-lifecycle-hooks]
next: 01-composition-api-avancee
libs: [{ name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — migrer un composant legacy Options API (hérité d'un CMS) vers Composition API script setup, comme sur une vraie migration d'app
last-reviewed: 2026-07
---

← [06 — Lifecycle hooks](06-lifecycle-hooks.md) · bloc débutant · module 7/7 — dernier module avant le bloc intermédiaire

# Options API vs Composition API

> **Outcomes — tu sauras FAIRE :** lire et écrire un composant dans les deux styles, expliquer l'avantage des composables sur les mixins, migrer un composant Options → `<script setup>` pas à pas, choisir le style adapté au contexte.
> **Difficulté :** :star::star:
>
> **Portée :** ce module clôt le bloc débutant. Tu travailles depuis le module 01 en Composition API — ici tu comprends **pourquoi**, tu apprends à lire l'Options API (code legacy), et tu pratiques la migration dans les deux sens. Les composables avancés (`useX` complets) sont au **bloc intermédiaire, module 01**.

---

## 1. Cas concret d'abord

Tu rejoint l'équipe qui reprend le front-office d'un CMS existant pour TribuZen. Le composant `MemberList.vue` a été écrit en Options API il y a 18 mois. Nouvelle demande : créer `FamilyList.vue` qui fait la même chose avec des familles.

Tu ouvres `MemberList.vue` :

```vue
<!-- MemberList.vue — Options API, hérité du CMS -->
<script lang="ts">
import { defineComponent } from 'vue'

interface Member { id: number; name: string; email: string }

export default defineComponent({
  data() {
    return {
      members: [] as Member[],
      query: '',
      loading: false,
      selectedId: null as number | null,
    }
  },
  computed: {
    filtered(): Member[] {
      return this.members.filter(m =>
        m.name.toLowerCase().includes(this.query.toLowerCase())
      )
    },
    count(): number {
      return this.filtered.length
    },
  },
  methods: {
    async fetchMembers(): Promise<void> {
      this.loading = true
      const res = await fetch('/api/members')
      this.members = await res.json()
      this.loading = false
    },
    select(id: number): void {
      this.selectedId = id
    },
  },
  mounted() {
    this.fetchMembers()
  },
})
</script>
```

**Problème** : pour `FamilyList.vue`, la logique `query + filtered + count` est identique. Avec Options API, deux options, toutes deux mauvaises :

- **Copier-coller** la logique → deux sources de vérité à maintenir.
- **Mixin** `searchMixin.ts` → collision de noms possible, source implicite (où vient `this.query` ?), difficile à tester en isolation.

Avec Composition API, tu extrairas `useSearch()` — une fonction pure, testable, importable. C'est ce que tu construiras à la fin de ce module.

---

## 2. Théorie complète, concise

### 2.1 Anatomie Options API

Un composant Options API est un **objet** exporté via `defineComponent`. Chaque clé de l'objet est une "option" : les membres de l'instance (`this`) sont assemblés automatiquement par Vue.

```vue
<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  // ── ÉTAT ────────────────────────────────────────
  data() {
    return {
      count: 0,   // this.count dans les autres options
    }
  },

  // ── ÉTAT DÉRIVÉ ─────────────────────────────────
  computed: {
    double(): number {
      return this.count * 2   // accès via this
    },
  },

  // ── EFFETS DE BORD ──────────────────────────────
  watch: {
    count(newVal: number) {
      console.log('count changed to', newVal)
    },
  },

  // ── ACTIONS ─────────────────────────────────────
  methods: {
    increment(): void {
      this.count++             // mutation via this
    },
  },

  // ── CYCLE DE VIE ────────────────────────────────
  mounted() {
    console.log('mounted, count =', this.count)
  },
  beforeUnmount() {
    console.log('cleanup here')
  },

  // ── INTERFACE PARENT/ENFANT ─────────────────────
  props: {
    initialValue: { type: Number, default: 0 },
  },
  emits: ['change'],
})
</script>
```

`this` référence l'**instance du composant** : Vue fusionne `data`, `computed`, `methods` et les props en un seul objet. C'est pratique pour un petit composant, piégeux dès qu'il grandit (voir §2.5).

### 2.2 Anatomie Composition API — `<script setup>`

`<script setup>` est du sucre syntaxique compilé par Vite : **tout ce qui est déclaré au niveau racine est automatiquement exposé au template**. Pas d'objet wrapper, pas de `this`, pas de `return`.

```vue
<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

// ── ÉTAT ────────────────────────────────────────
const count = ref(0)                  // Ref<number>

// ── ÉTAT DÉRIVÉ ─────────────────────────────────
const double = computed(() => count.value * 2)

// ── EFFETS DE BORD ──────────────────────────────
watch(count, (newVal) => {
  console.log('count changed to', newVal)
})

// ── ACTIONS ─────────────────────────────────────
function increment(): void {
  count.value++                        // pas de this
}

// ── CYCLE DE VIE ────────────────────────────────
onMounted(() => {
  console.log('mounted, count =', count.value)
})
onBeforeUnmount(() => {
  console.log('cleanup here')
})

// ── INTERFACE PARENT/ENFANT ─────────────────────
const props = defineProps<{ initialValue?: number }>()
const emit  = defineEmits<{ change: [value: number] }>()
</script>
```

### 2.3 Tableau de correspondance option ↔ Composition API

| Options API | Composition API (`<script setup>`) | Notes |
|---|---|---|
| `data() { return { x } }` | `const x = ref(...)` / `reactive({...})` | `ref` pour les primitives, `reactive` pour les objets |
| `computed: { y() }` | `const y = computed(() => ...)` | Identique, mais importé |
| `methods: { fn() }` | `function fn() { ... }` | Fonction plain JS, pas de `this` |
| `watch: { x(val) }` | `watch(x, (val) => { ... })` | Même sémantique |
| `watchEffect` | `watchEffect(() => { ... })` | Tracking automatique des dépendances |
| `mounted()` | `onMounted(() => { ... })` | Préfixe `on` |
| `created()` | Code au niveau racine du `<script setup>` | S'exécute à la création |
| `beforeUnmount()` | `onBeforeUnmount(() => { ... })` | Même moment |
| `unmounted()` | `onUnmounted(() => { ... })` | Même moment |
| `props: {}` | `defineProps<{}>()` | Macro compilateur — pas d'import |
| `emits: []` | `defineEmits<{}>()` | Macro compilateur — typage strict |
| `expose: []` | `defineExpose({})` | Ce que le parent peut appeler via ref |

### 2.4 Mixins vs composables — pourquoi les mixins sont problématiques

Un **mixin** est un objet qui fusionne ses options dans le composant consommateur. Vue 2 l'utilisait massivement. Vue 3 le supporte toujours mais le déconseille pour trois raisons :

**Problème 1 — Collision de noms silencieuse**

```ts
// searchMixin.ts
const searchMixin = {
  data() { return { query: '' } },        // ← query
  computed: { filtered() { ... } },
}

// sortMixin.ts
const sortMixin = {
  data() { return { query: 'default' } }, // ← aussi query !
}

// Dans le composant — lequel gagne ?
export default defineComponent({
  mixins: [searchMixin, sortMixin],        // query = 'default' (sortMixin écrase)
  // Vue ne t'avertit pas. Le bug est silencieux.
})
```

**Problème 2 — Source implicite**

```ts
// composant utilisant 3 mixins
export default defineComponent({
  mixins: [searchMixin, sortMixin, paginationMixin],
  methods: {
    doSomething() {
      this.query      // D'où vient query ? searchMixin ? sortMixin ?
      this.currentPage // paginationMixin ? Peut-être défini localement ?
    },
  },
})
// Un lecteur doit ouvrir les 3 fichiers mixin pour comprendre.
```

**Problème 3 — Impossible à tester en isolation**

Un mixin ne s'instancie pas seul : il faut monter un composant factice pour le tester.

**Le composable résout les trois problèmes :**

```ts
// useSearch.ts — composable
import { ref, computed } from 'vue'

export function useSearch<T>(items: Ref<T[]>, key: keyof T) {
  const query = ref('')                        // nom local, pas de collision
  const filtered = computed(() =>
    items.value.filter(item =>
      String(item[key]).toLowerCase().includes(query.value.toLowerCase())
    )
  )
  return { query, filtered }                   // exports explicites
}

// Dans le composant — source explicite :
const { query, filtered } = useSearch(members, 'name')
// On sait exactement d'où viennent query et filtered.

// Testable sans composant :
import { ref } from 'vue'
const items = ref([{ name: 'Alice' }, { name: 'Bob' }])
const { query, filtered } = useSearch(items, 'name')
query.value = 'ali'
console.log(filtered.value) // [{ name: 'Alice' }] — pas de Vue Test Utils requis
```

### 2.5 Organisation par option vs par fonctionnalité

C'est la différence de paradigme fondamentale. Avec Options API, le code est découpé **par type** (toutes les données ensemble, toutes les méthodes ensemble). Avec Composition API, il est découpé **par fonctionnalité** (*concern*).

```
OPTIONS API (par type)              COMPOSITION API (par concern)
───────────────────────             ─────────────────────────────
data() {                            // ── Recherche ──────────────
  query: '',        ← recherche     const query = ref('')
  members: [],      ← liste         const filtered = computed(...)
  page: 1,          ← pagination    function search() { ... }
},
computed: {                         // ── Liste membres ──────────
  filtered() { ... }, ← recherche  const members = ref<Member[]>([])
  pageCount() { ... }, ← pagination async function fetchMembers() { ... }
},
methods: {
  search() { ... },   ← recherche  // ── Pagination ─────────────
  fetchMembers() { }, ← liste      const page = ref(1)
  nextPage() { ... }, ← pagination const pageCount = computed(...)
},                                  function nextPage() { ... }
```

Dans un composant de 200 lignes, la version Options API oblige à scroller entre `data`, `computed` et `methods` pour comprendre une seule fonctionnalité. La version Composition API regroupe tout ce qui concerne la recherche au même endroit.

### 2.6 Quand choisir chaque style

| Contexte | Recommandation | Raison |
|---|---|---|
| Nouveau projet Vue 3 | **Composition API** | Standard depuis Vue 3.2, meilleur TS, composables |
| Codebase Vue 2 héritée | **Options API** (ne pas migrer sans raison) | Migration = risque sans bénéfice immédiat |
| Composant < 30 lignes, logique simple | Les deux conviennent | La différence est marginale |
| Logique partagée entre composants | **Composition API + composable** | Les mixins sont à proscrire |
| Équipe qui arrive de Vue 2 / React class components | Options API transitoire possible | Courbe d'apprentissage, puis migrer par composant |
| Mission en ESN — codebase inconnue | Savoir lire les deux | Tu rencontreras les deux en prod |

> **Règle d'or :** tout nouveau code écrit dans ce parcours est en `<script setup lang="ts">`. Savoir lire l'Options API est un prérequis de lisibilité en mission, pas un mode d'écriture.

---

## 3. Worked examples

### Migration pas-à-pas : `MemberList.vue` Options → `<script setup>`

On repart du composant de la section 1. On migre option par option, en expliquant chaque transformation.

**Étape 0 — Point de départ (Options API)**

```vue
<script lang="ts">
import { defineComponent } from 'vue'

interface Member { id: number; name: string; email: string }

export default defineComponent({
  data() {
    return {
      members: [] as Member[],
      query: '',
      loading: false,
      selectedId: null as number | null,
    }
  },
  computed: {
    filtered(): Member[] {
      return this.members.filter(m =>
        m.name.toLowerCase().includes(this.query.toLowerCase())
      )
    },
    count(): number { return this.filtered.length },
  },
  methods: {
    async fetchMembers(): Promise<void> {
      this.loading = true
      const res = await fetch('/api/members')
      this.members = await res.json()
      this.loading = false
    },
    select(id: number): void { this.selectedId = id },
  },
  mounted() { this.fetchMembers() },
})
</script>
```

**Étape 1 — Remplacer `data()` par des `ref`**

```ts
// data() { return { x } }  →  const x = ref(...)
// Pour les primitives : ref. Pour les objets complexes : ref<T>([]) ou reactive({}).

const members   = ref<Member[]>([])
const query     = ref('')
const loading   = ref(false)
const selectedId = ref<number | null>(null)
```

Règle : `data()` retournait un objet — chaque propriété devient une `ref` indépendante. Pas de `this.x` désormais : `x.value` dans le script, `x` dans le template (auto-unwrap Vue).

**Étape 2 — Remplacer `computed: {}` par des fonctions `computed()`**

```ts
// computed: { filtered() { return this.members.filter(...) } }
// →
const filtered = computed<Member[]>(() =>
  members.value.filter(m =>
    m.name.toLowerCase().includes(query.value.toLowerCase())
  )
)

const count = computed(() => filtered.value.length)
```

Le `this.` disparaît. `members.value` et `query.value` à la place. Le type peut être annoté sur `computed<T>()` quand l'inférence est ambiguë.

**Étape 3 — Remplacer `methods: {}` par des fonctions plain**

```ts
// methods: { fetchMembers() { this.loading = true; ... } }
// →
async function fetchMembers(): Promise<void> {
  loading.value = true
  const res = await fetch('/api/members')
  members.value = await res.json()
  loading.value = false
}

function select(id: number): void {
  selectedId.value = id
}
```

Aucun changement de logique. Seul changement : `this.loading` → `loading.value`, etc.

**Étape 4 — Remplacer le hook `mounted()` par `onMounted()`**

```ts
// mounted() { this.fetchMembers() }
// →
onMounted(() => { fetchMembers() })  // fetchMembers défini juste au-dessus
```

**Résultat final — `MemberList.vue` en Composition API**

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Member { id: number; name: string; email: string }

// État
const members    = ref<Member[]>([])
const query      = ref('')
const loading    = ref(false)
const selectedId = ref<number | null>(null)

// État dérivé
const filtered = computed<Member[]>(() =>
  members.value.filter(m =>
    m.name.toLowerCase().includes(query.value.toLowerCase())
  )
)
const count = computed(() => filtered.value.length)

// Actions
async function fetchMembers(): Promise<void> {
  loading.value = true
  const res = await fetch('/api/members')
  members.value = await res.json()
  loading.value = false
}

function select(id: number): void {
  selectedId.value = id
}

// Cycle de vie
onMounted(() => { fetchMembers() })
</script>

<template>
  <!-- Le template est IDENTIQUE — Vue gère l'auto-unwrap des refs -->
  <input v-model="query" placeholder="Rechercher…" />
  <p>{{ count }} membre(s)</p>
  <ul>
    <li
      v-for="m in filtered"
      :key="m.id"
      :class="{ selected: m.id === selectedId }"
      @click="select(m.id)"
    >{{ m.name }}</li>
  </ul>
  <p v-if="loading">Chargement…</p>
</template>
```

**Ce qu'on a gagné :** le template ne change pas d'une ligne. Le script est plus court (pas de boilerplate `defineComponent`, pas de `return`). Et surtout — la logique de recherche (`query + filtered + count`) peut maintenant être extraite :

```ts
// useSearch.ts — extrait du composant migré
import { ref, computed, type Ref } from 'vue'

export function useSearch<T extends Record<string, unknown>>(
  items: Ref<T[]>,
  key: keyof T,
) {
  const query = ref('')
  const filtered = computed<T[]>(() =>
    items.value.filter(item =>
      String(item[key]).toLowerCase().includes(query.value.toLowerCase())
    )
  )
  const count = computed(() => filtered.value.length)
  return { query, filtered, count }
}
```

`FamilyList.vue` peut maintenant appeler `useSearch(families, 'name')` sans dupliquer une ligne.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Traduire `this.x` mécaniquement sans comprendre le contexte

```ts
// ❌ Traduction mécanique : copier-coller this.query → this est undefined !
const filtered = computed(() => this.members.filter(...))
// ReferenceError: Cannot read properties of undefined (reading 'members')

// ✅ Pas de this en Composition API — on accède aux refs directement
const filtered = computed(() => members.value.filter(...))
```

Le `this` Options API référençait l'instance du composant. En Composition API, les variables sont des fermetures JS ordinaires. `this` n'existe pas dans `<script setup>`.

### PIÈGE #2 — Oublier `.value` dans le script (mais pas dans le template)

```ts
// ❌ Oublier .value dans le script
function increment() {
  count++           // count est une Ref, pas un number — NaN ou erreur silencieuse
}

// ✅ .value obligatoire dans le script
function increment() {
  count.value++     // mutation correcte
}
```

```vue
<template>
  <!-- ✅ Auto-unwrap : pas de .value dans le template -->
  {{ count }}

  <!-- ❌ .value dans le template = accès à l'objet Ref lui-même -->
  {{ count.value }}  <!-- affiche "[object Object]" -->
</template>
```

**Règle mnémotechnique :** `.value` dans le script, jamais dans le template pour les refs de premier niveau.

### PIÈGE #3 — Recréer un mixin en composable sans vraiment découpler

```ts
// ❌ Faux composable — dépend d'une ref externe passée par référence globale
import { globalMembers } from '@/store/members'  // couplage implicite

export function useBadSearch() {
  return computed(() =>
    globalMembers.value.filter(...)  // impossible à tester en isolation
  )
}

// ✅ Vrai composable — reçoit ses dépendances en paramètre
export function useSearch<T>(items: Ref<T[]>, key: keyof T) {
  // items est passé en argument → testable, réutilisable, découplé
}
```

Un composable qui accède à des globales implicites reproduit exactement le problème des mixins. La règle : **tout ce dont le composable dépend doit être un paramètre**.

### PIÈGE #4 — Migrer sans tests (casser le comportement sans filet)

La migration Options → Composition est un refactoring à risque : la logique ne change pas, mais l'implémentation si. Sans tests :

- On ne sait pas si `filtered` retourne les mêmes résultats qu'avant.
- On ne sait pas si `fetchMembers` se comporte de la même façon en cas d'erreur réseau.
- Un `this.loading = false` oublié dans un `catch` n'est pas détecté.

**Pratique recommandée :** avant de migrer, écrire un test de comportement avec Vitest + `@vue/test-utils` qui couvre le cas nominal. Le test devient le filet de sécurité de la migration. Si le test passe après migration → comportement préservé.

---

## 5. Ancrage TribuZen

Le front-office TribuZen hérite de composants écrits pour un CMS (Strapi-like) : Options API, `defineComponent`, `this` partout. La migration par composant est la tâche réelle d'un dev Vue senior en mission.

Composant cible dans `smaurier/tribuzen` :

```
tribuzen/
  src/
    components/
      activity/
        ActivityFeed.vue     ← Options API legacy (CMS Strapi)
```

`ActivityFeed.vue` affiche la liste des activités d'une famille, avec filtre par type (`post`, `event`, `file`). En Options API, la logique filtre est dans `computed`, les appels API dans `methods`, le type sélectionné dans `data`. La migration produit :

1. `ActivityFeed.vue` en `<script setup lang="ts">`
2. `useActivityFilter.ts` — composable réutilisable (`EventFeed.vue` en aura besoin)

C'est exactement la valeur ajoutée visible en entretien Bedrock : montrer qu'on maîtrise les deux styles **et** qu'on sait pourquoi la migration vaut la peine.

---

## 6. Points clés

1. Options API organise le code **par type** (data / computed / methods / watch) — Composition API organise par **fonctionnalité** (concern).
2. `<script setup>` est du sucre syntaxique : tout ce qui est déclaré au niveau racine est exposé au template, sans `return`.
3. **Correspondances clés :** `data()` → `ref()`, `computed:{}` → `computed()`, `methods:{}` → fonctions plain, `mounted()` → `onMounted()`, `this.x` → `x.value`.
4. Les **mixins** causent des collisions de noms silencieuses et une source implicite — les composables sont explicites, testables, découplés.
5. La migration Options → Composition ne change **pas** le template — seul le bloc `<script>` est retravaillé.
6. En Composition API, **pas de `this`** — les refs sont des fermetures JS ordinaires accessibles directement.
7. `.value` est obligatoire dans le script ; le template fait l'auto-unwrap des refs de premier niveau.
8. Migrer sans tests est risqué — écrire le test de comportement avant de migrer.

---

## 7. Seeds Anki

```
Quelle est la différence d'organisation entre Options API et Composition API ?|Options API organise par type (data / computed / methods). Composition API organise par fonctionnalité (concern) : tout ce qui concerne une feature est au même endroit.
Pourquoi les mixins sont-ils problématiques ? Cite deux raisons.|1) Collision de noms silencieuse : deux mixins peuvent définir la même clé data, le dernier écrase sans avertissement. 2) Source implicite : impossible de savoir d'où vient this.query sans ouvrir tous les mixins.
Convertis data() { return { count: 0 } } en Composition API.|const count = ref(0) — ref pour les primitives, accès via count.value dans le script.
Comment convertir computed: { double() { return this.count * 2 } } en Composition API ?|const double = computed(() => count.value * 2) — pas de this, accès via count.value.
Pourquoi peut-on écrire {{ count }} dans le template sans .value ?|Vue auto-unwrap les refs de premier niveau exposées par <script setup> dans le template. Écrire {{ count.value }} retourne l'objet Ref lui-même (bug).
Quel est le risque principal d'un composable qui accède à une globale implicite ?|Il reproduit le problème des mixins : couplage implicite, impossible à tester en isolation. Un composable doit recevoir toutes ses dépendances en paramètre.
Dans quel cas une migration Options → Composition est-elle risquée sans filet ?|Sans tests de comportement préalables : la logique peut casser silencieusement (this.x oublié, .value manquant, catch mal traduit). Écrire un test avant de migrer.
Quand garder l'Options API plutôt que de migrer ?|Dans une codebase Vue 2 existante, si la migration n'apporte pas de bénéfice concret immédiat (risque sans valeur). Migrer composant par composant lors des modifications, pas tout d'un coup.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-07-options-vs-composition-api/README.md`. Migration guidée d'un composant Options API complet (`NotificationPanel.vue`) vers `<script setup lang="ts">`, avec `vue-tsc --noEmit` comme oracle de conformité TypeScript — corrigé intégral commenté + variante J+30.
