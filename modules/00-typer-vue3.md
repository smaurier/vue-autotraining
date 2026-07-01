---
titre: TypeScript avec Vue 3 (script setup)
cours: 02-vue
notions: [script setup lang ts, ref générique, reactive avec interface, computed inférence, signatures de fonctions, defineComponent, useTemplateRef, pièges TS+Vue débutant]
outcomes:
  - sait activer TypeScript dans un SFC Vue 3 avec <script setup lang="ts">
  - sait annoter ref<T>(), reactive, computed selon si l'inférence suffit ou non
  - sait distinguer defineComponent (Options API / setup()) et <script setup> sur le plan du typage
  - connaît 5 pièges TS+Vue du niveau débutant et sait les corriger
prerequis: [TypeScript fondamentaux — Modules 00-09 du cours TypeScript (génériques, interfaces, union types)]
next: 01-environnement-et-premier-composant
libs: [{ name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — typage de l'état local des premiers composants (LoginForm, FamilyCard)
last-reviewed: 2026-07
---

# TypeScript avec Vue 3 (`<script setup lang="ts">`)

> **Outcomes — tu sauras FAIRE :** activer TypeScript dans un SFC Vue 3, annoter `ref`/`reactive`/`computed` de façon appropriée, distinguer `defineComponent` et `<script setup>` sur le plan du typage.
> **Difficulté :** :star::star:
>
> **Portée :** ce module couvre le **typage de l'état local** d'un composant. `defineProps`/`defineEmits` (communication parent-enfant) sont vus au **module 05**, et les composables au **module intermédiaire 02**. La réactivité en profondeur (`watch`, `watchEffect`, `toRefs`, `shallowRef`) est le sujet du **module 03**.

## 1. Cas concret d'abord

Tu rejoins TribuZen. Ta première tâche : écrire le composant de connexion `LoginForm.vue`. Un collègue a laissé ce début de code :

```vue
<!-- LoginForm.vue — AVANT typage -->
<script setup>
import { ref, computed } from 'vue'

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref(null)      // ← que contient cette ref si tout va bien ? si erreur ?

const canSubmit = computed(() => {
  return email.value.length > 0 && password.value.length >= 8
})

async function login() {
  loading.value = true
  error.value = null
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.value, password: password.value }),
    })
    if (!res.ok) {
      error.value = await res.text()   // ← string ? Error ? autre ?
    }
  } catch (e) {
    error.value = e.message            // ← TS ne peut pas t'aider ici : e est 'unknown'
  } finally {
    loading.value = false
  }
}
</script>
```

**Trois endroits où TypeScript ne peut pas t'aider** si tu n'annoites pas :
1. `ref(null)` — TypeScript infère `Ref<null>`. Appeler `error.value.toUpperCase()` ne sera pas signalé comme erreur à la compilation.
2. `e.message` dans le `catch` — `e` est de type `unknown` en TypeScript strict. Accéder à `.message` directement est une erreur de type.
3. Sans `lang="ts"` sur le `<script>`, aucune de ces vérifications ne s'active.

Ce module te donne les outils pour corriger ça.

---

## 2. Théorie complète, concise

### 2.1 Activer TypeScript dans un SFC : `lang="ts"`

Un Single File Component (SFC) Vue par défaut n'active pas TypeScript. L'ajout de `lang="ts"` sur le `<script setup>` active :
- la vérification de types dans le bloc `<script>`
- la vérification de types dans le `<template>` (expressions, props d'événements)
- l'autocomplétion de l'IDE (Volar / Vue - Official)

```vue
<!-- ❌ Sans lang="ts" : TypeScript ignoré dans ce fichier -->
<script setup>
const count = ref(0)
count.value = 'hello' // pas d'erreur signalée
</script>

<!-- ✅ Avec lang="ts" : vérification complète -->
<script setup lang="ts">
import { ref } from 'vue'
const count = ref(0)
count.value = 'hello' // TS Error: Type 'string' is not assignable to type 'number'
</script>
```

C'est la seule configuration nécessaire pour démarrer — le reste est du TypeScript standard.

### 2.2 Typer `ref<T>()` — quand inférer, quand annoter

`ref()` déduit le type à partir de la valeur initiale. L'annotation explicite n'est nécessaire que quand **la valeur initiale n'est pas représentative du type final**.

```ts
import { ref } from 'vue'
import type { Ref } from 'vue'

// ✅ Inférence suffisante — TypeScript comprend seul
const count = ref(0)          // Ref<number>
const name  = ref('Alice')    // Ref<string>
const ready = ref(false)      // Ref<boolean>

// ❌ Inférence insuffisante — la valeur initiale est null ou []
const error = ref(null)            // Ref<null> — ne peut jamais contenir autre chose !
const items = ref([])              // Ref<never[]> — TS ne sait pas ce que contiendra le tableau

// ✅ Annoter avec le générique quand la valeur initiale est trompeuse
const error = ref<string | null>(null)        // Ref<string | null>
const items = ref<Product[]>([])              // Ref<Product[]>
const user  = ref<User | null>(null)          // Ref<User | null>
```

Les deux formes d'annotation sont équivalentes — préférer le générique (plus compact) :

```ts
// Générique (recommandé, plus court)
const year = ref<string | number>('2020')

// Type explicite sur la variable (aussi valide)
const year: Ref<string | number> = ref('2020')
```

**Règle :** annote `ref` seulement si la valeur initiale ne représente pas le type final (null, [], 0 quand une union est attendue).

### 2.3 Typer `reactive` — avec une interface

`reactive()` transforme un objet en Proxy réactif. TypeScript infère le type depuis l'objet littéral, mais pour les objets complexes, **annoter la variable avec une interface** est la pratique recommandée par les docs Vue :

```ts
import { reactive } from 'vue'

// ✅ Annotation via l'interface sur la variable (idiome Vue)
interface LoginForm {
  email: string
  password: string
  rememberMe: boolean
}

const form: LoginForm = reactive({
  email: '',
  password: '',
  rememberMe: false,
})

form.email = 'alice@tribuzen.app'  // ✅ string accepté
// form.email = 42                 // ❌ TS Error
// form.unknown = true             // ❌ propriété inexistante
```

> **Attention :** `reactive<LoginForm>({...})` (générique sur reactive) est aussi valide TypeScript, mais l'annotation variable `const form: LoginForm = reactive({...})` est préférable car elle donne une inférence plus précise et plus prévisible dans les cas complexes.

`reactive` n'accepte que des **objets, tableaux, Map, Set** — pas des primitives :

```ts
reactive(0)        // ❌ TS Error: Argument of type 'number' is not assignable
reactive('hello')  // ❌ même chose
reactive(null)     // ❌ même chose
```

### 2.4 Typer `computed` — inférence et annotation union

`computed()` déduit son type de retour depuis le getter. Annoter explicitement n'est utile que pour les **types union** ou quand l'inférence est trop large.

```ts
import { ref, computed } from 'vue'

const count = ref(2)

// Inférence : TypeScript comprend que double est ComputedRef<number>
const double = computed(() => count.value * 2)

// Annotation nécessaire pour un type union (string littéral)
const started = ref(false)
const pending = ref(false)

// Sans annotation, TS infère ComputedRef<string> — trop large
// Avec annotation : TS vérifie que les branches retournent bien le type attendu
const status = computed<'idle' | 'loading' | 'done'>(() => {
  if (!started.value) return 'idle'
  if (pending.value)  return 'loading'
  return 'done'
})

// Le computed est en lecture seule : .value++ est une erreur TS
// double.value++ // TS Error: Cannot assign to 'value' because it is a read-only property
```

### 2.5 Typer les signatures de fonctions dans un composant

Les fonctions définies dans `<script setup>` sont exposées au template. TypeScript les vérifie comme n'importe quelle fonction :

```ts
// Dans <script setup lang="ts">

// Paramètre typé, retour inféré (void ici)
function handleInput(event: Event): void {
  const target = event.target as HTMLInputElement
  email.value = target.value
}

// Fonction asynchrone — TypeScript infère Promise<void>
async function login(): Promise<void> {
  // le catch doit gérer le type 'unknown'
  try {
    await fetch('/api/auth/login')
  } catch (e) {
    // ❌ e.message — e est 'unknown' en TS strict
    // ✅ rétrécir le type avant d'accéder à .message
    if (e instanceof Error) {
      error.value = e.message
    } else {
      error.value = 'Erreur inconnue'
    }
  }
}

// Callback d'événement inline — TS vérifie le type de l'événement
// <button @click="handleClick"> → handleClick reçoit MouseEvent
function handleClick(e: MouseEvent): void {
  console.log(e.clientX, e.clientY)
}
```

### 2.6 `defineComponent` vs `<script setup>` — perspective TypeScript

Ces deux formes coexistent dans des codebases réelles. Comprendre leur différence TS est indispensable en entretien.

**`<script setup lang="ts">` — syntaxe recommandée (Vue 3)**

C'est du sucre syntaxique compilé. Tout ce qu'on déclare au niveau racine est automatiquement exposé au template. TypeScript voit l'intégralité du script.

```vue
<script setup lang="ts">
import { ref } from 'vue'

// La déclaration et le typage sont ici, directement
const count = ref(0)

function increment(): void {
  count.value++
}
</script>
```

Avantages TS :
- Pas de boilerplate : pas de `return` manuel pour exposer les variables
- Meilleure inférence (le compilateur voit directement les refs)
- `defineProps<{...}>()` et `defineEmits<{...}>()` (macros compilateur — module 05) utilisent des types purs

**`defineComponent` avec `setup()` — nécessaire sans `<script setup>`**

Quand on n'utilise pas `<script setup>`, `defineComponent` est obligatoire pour que TypeScript comprenne les types des `props` passés à `setup()`. Sans lui, `props` serait `{}`.

```ts
import { defineComponent, ref } from 'vue'

export default defineComponent({
  props: {
    message: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    // ✅ props.message est inféré comme string grâce à defineComponent
    const local = ref(props.message.toUpperCase())

    return { local } // doit retourner explicitement ce qu'on expose
  },
})
```

Sans `defineComponent`, `props` est typé `{}` et `props.message` est une erreur TS.

**Quand rencontrer `defineComponent` en pratique :**
- Composants écrits avant Vue 3.2 (`<script setup>` est stable depuis 3.2)
- Bibliothèques qui exportent des composants en TypeScript pur (sans SFC)
- Tests unitaires avec `mount(defineComponent({...}))` via Vue Test Utils
- Options API (encore utilisée dans des codebases legacy)

> **Pour tout nouveau code** : utiliser `<script setup lang="ts">` — c'est la convention officielle Vue 3 depuis 3.2.

### 2.7 `useTemplateRef` — accéder aux éléments DOM (Vue 3.5)

Quand tu dois accéder directement à un élément DOM ou un composant enfant, Vue expose une ref de template. Depuis Vue 3.5, `useTemplateRef` remplace le pattern `ref<HTMLElement | null>(null)` avec un nom de variable contraint.

```vue
<script setup lang="ts">
import { useTemplateRef, onMounted } from 'vue'

// ✅ Vue 3.5 : useTemplateRef prend le nom du ref en paramètre string
// La variable peut s'appeler n'importe quoi — le couplage est explicite
const emailInput = useTemplateRef<HTMLInputElement>('email-field')

onMounted(() => {
  // .value peut être null avant le montage du composant
  emailInput.value?.focus()
})
</script>

<template>
  <!-- L'attribut ref="email-field" lie l'élément à useTemplateRef('email-field') -->
  <input ref="email-field" type="email" />
</template>
```

Pattern classique (Vue 3.4 et antérieur — toujours valide, encore répandu) :

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

// ⚠️ Couplage implicite : le NOM de la variable doit matcher exactement
// l'attribut ref="emailInput" dans le template
const emailInput = ref<HTMLInputElement | null>(null)

onMounted(() => {
  emailInput.value?.focus()
})
</script>

<template>
  <input ref="emailInput" type="email" />
</template>
```

`useTemplateRef` est préférable pour le nouveau code car il découple le nom de variable du nom d'attribut ref.

---

## 3. Worked examples

### Exemple 1 — `LoginForm.vue` typé de A à Z (TribuZen)

On reprend le composant du cas concret et on corrige les trois problèmes de typage.

```vue
<!-- LoginForm.vue — version typée -->
<script setup lang="ts">
import { ref, computed } from 'vue'

// Interface pour les données du formulaire
// Définie ici (inline) car spécifique à ce composant — pas dans un fichier types/
interface LoginCredentials {
  email: string
  password: string
}

// ✅ ref : inférence suffisante pour les primitives
const email    = ref('')      // Ref<string>
const password = ref('')      // Ref<string>
const loading  = ref(false)   // Ref<boolean>

// ✅ Annotation nécessaire : null n'est pas représentatif du type final
const error = ref<string | null>(null)  // Ref<string | null>

// ✅ Inférence suffisante — computed retourne boolean
const canSubmit = computed(() =>
  email.value.trim().length > 0 && password.value.length >= 8
)

// ✅ Signature complète : paramètre typé, retour Promise<void>
async function login(): Promise<void> {
  if (!canSubmit.value) return

  loading.value = true
  error.value = null

  const credentials: LoginCredentials = {
    email: email.value,
    password: password.value,
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })

    if (!res.ok) {
      // res.text() retourne Promise<string> — pas d'ambiguïté
      error.value = await res.text()
    }
  } catch (e) {
    // ✅ e est 'unknown' en TS strict — rétrécissement requis
    error.value = e instanceof Error ? e.message : 'Erreur réseau'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="login">
    <input v-model="email" type="email" :disabled="loading" />
    <input v-model="password" type="password" :disabled="loading" />

    <!-- TS vérifie que canSubmit est bien un boolean pour :disabled -->
    <button type="submit" :disabled="!canSubmit || loading">
      {{ loading ? 'Connexion…' : 'Se connecter' }}
    </button>

    <!-- error est string | null — Vue affiche null comme "" -->
    <p v-if="error" class="error">{{ error }}</p>
  </form>
</template>
```

**Ce que TS vérifie dans ce composant :**
- `error.value = 42` → erreur (number pas assignable à `string | null`)
- `canSubmit.value++` → erreur (readonly, computed)
- `credentials.unknown = 'x'` → erreur (propriété inexistante dans `LoginCredentials`)
- `e.message` sans narrowing → erreur (`e` est `unknown`)

### Exemple 2 — `defineComponent` vs `<script setup>` côte à côte

Voir les deux formes pour un même composant aide à comprendre ce que `<script setup>` compile.

```ts
// ─── Forme A : defineComponent avec setup() ───────────────────────────
import { defineComponent, ref, computed } from 'vue'

export default defineComponent({
  // Sans defineComponent, props serait {} et props.title serait une erreur TS
  props: {
    initialCount: {
      type: Number,
      default: 0,
    },
  },
  setup(props) {
    // props.initialCount : number (inféré grâce à defineComponent + type: Number)
    const count = ref(props.initialCount)
    const double = computed(() => count.value * 2)

    function increment(): void {
      count.value++
    }

    // ⚠️ Return explicite obligatoire pour exposer au template
    return { count, double, increment }
  },
})
```

```vue
<!-- ─── Forme B : <script setup lang="ts"> ─── equivalent compilé -->
<script setup lang="ts">
import { ref, computed } from 'vue'

// Le typage des props se fait via defineProps<{}> — module 05
// Ici on simule avec une prop locale pour la comparaison
const props = defineProps<{ initialCount?: number }>()

// count est automatiquement exposé au template — pas de return
const count = ref(props.initialCount ?? 0)
const double = computed(() => count.value * 2)

function increment(): void {
  count.value++
}
</script>
```

**Différences concrètes pour le typage :**

| | `defineComponent` + `setup()` | `<script setup lang="ts">` |
|---|---|---|
| Typage des props | Via `type: Number` → inférence approximative | Via `defineProps<{prop: number}>()` → typage exact |
| Exposition au template | `return { ... }` manuel | Automatique — tout le niveau racine |
| Macros compilateur | Non disponibles | `defineProps`, `defineEmits`, `defineSlots`, `defineExpose` |
| Boilerplate | Plus verbeux | Minimal |
| Cas d'usage actuel | Legacy, bibliothèques, tests | **Tout nouveau code** |

---

## 4. Pièges & misconceptions

### PIÈGE #1 — `ref(null)` sans annotation — le plus courant

```ts
// ❌ TypeScript infère Ref<null>
const user = ref(null)
// user.value ne peut contenir QUE null — toute assignation d'un User est une erreur TS
user.value = { id: 1, name: 'Alice' }  // TS Error: not assignable to null

// ✅ Annoter avec le type final attendu
const user = ref<User | null>(null)
user.value = { id: 1, name: 'Alice' }  // ✅
```

Même piège avec les tableaux vides :

```ts
const items = ref([])          // Ref<never[]> — ne peut rien contenir !
const items = ref<Product[]>([]) // ✅ Ref<Product[]>
```

**Signal d'alarme :** si tu passes `null` ou `[]` à `ref()` sans générique, c'est presque toujours un bug de typage latent.

### PIÈGE #2 — `reactive` avec une primitive

```ts
// ❌ reactive n'accepte que les objets — TS refuse à la compilation
const count = reactive(0)    // Error: Argument of type 'number' is not assignable
const name  = reactive('Alice')  // même chose

// ✅ reactive pour les objets, ref pour les primitives
const count = ref(0)
const state = reactive({ count: 0, name: 'Alice' })
```

Ce piège est particulièrement trompeur car le message d'erreur TS est parfois cryptique sur ce point.

### PIÈGE #3 — `.value` dans le template

```vue
<script setup lang="ts">
const count = ref(0)
</script>

<template>
  <!-- ❌ affiche "[object Object]" ou une valeur incorrecte -->
  {{ count.value }}

  <!-- ✅ Vue auto-unwrap les refs de premier niveau dans le template -->
  {{ count }}
</template>
```

Vue "déballe" automatiquement les refs dans le `<template>` — ajouter `.value` double le déballage et retourne l'objet `Ref` lui-même. L'auto-unwrap s'applique **seulement aux refs de premier niveau** exposées par `<script setup>`. Une ref imbriquée dans un objet nécessite `.value` même dans le template.

### PIÈGE #4 — `e` dans `catch` est `unknown`, pas `Error`

```ts
try {
  await fetch('/api/data')
} catch (e) {
  // ❌ e est 'unknown' en TypeScript strict — .message n'est pas garanti
  console.error(e.message)   // TS Error: Object is of type 'unknown'

  // ✅ Rétrécir le type avant d'accéder aux propriétés
  if (e instanceof Error) {
    console.error(e.message)  // ✅ string
  }
}
```

En TypeScript strict (`strict: true` dans `tsconfig.json`), le paramètre `catch` est `unknown` depuis TypeScript 4.0. Le pattern `instanceof Error` est le rétrécissement standard.

### PIÈGE #5 — Confondre `lang="ts"` absent et TypeScript "qui ne marche pas"

Sans `lang="ts"` sur `<script setup>`, le fichier `.vue` est traité comme JavaScript. Les erreurs de type ne s'affichent ni dans l'IDE ni avec `vue-tsc`. Le fichier "compile" silencieusement même avec des erreurs de type.

```vue
<!-- ❌ Pas de lang="ts" : TypeScript est désactivé dans ce fichier -->
<script setup>
const count = ref(0)
count.value = 'hello'  // aucune erreur signalée
</script>

<!-- ✅ lang="ts" obligatoire pour la vérification -->
<script setup lang="ts">
import { ref } from 'vue'
const count = ref(0)
count.value = 'hello'  // TS Error signalé par l'IDE ET par vue-tsc
</script>
```

Vérifier systématiquement que `lang="ts"` est présent quand TypeScript "ne fait rien" dans un SFC.

---

## 5. Ancrage TribuZen

Dans TribuZen, le typage vu ici s'applique dès les premiers composants UI :

**`LoginForm.vue`** (Exemple 1 de ce module) — `ref<string | null>(null)` pour le message d'erreur, `computed<boolean>` pour la validation, `async function login(): Promise<void>`. C'est la porte d'entrée de tous les utilisateurs TribuZen.

**`FamilyCard.vue`** — affiche le résumé d'une famille. L'état local est :

```ts
// FamilyCard.vue — état local typé
const family = ref<Family | null>(null)    // chargement asynchrone
const expanded = ref(false)                // Ref<boolean> — inférence suffisante

interface Family {
  id: string
  name: string
  memberCount: number
  createdAt: string
}
```

Le `ref<Family | null>(null)` est la signature TribuZen standard pour tout état chargé depuis l'API : `null` en attente, `Family` après réponse.

> La communication de `FamilyCard` vers son parent (emit d'un événement `"select"`) relève du **module 05 (composants, props, emits)** — dans ce module, on reste sur l'état *local* au composant.

Fichiers cibles dans `smaurier/tribuzen` :
```
tribuzen/
  src/
    components/
      auth/
        LoginForm.vue        ← Exemple 1 de ce module
      family/
        FamilyCard.vue       ← ref<Family | null>(null) pattern
```

---

## 6. Points clés

1. `<script setup lang="ts">` est la seule activation nécessaire — l'IDE et `vue-tsc` font le reste.
2. `ref()` infère depuis la valeur initiale — annoter `ref<T>()` seulement quand `null` ou `[]` sont utilisés comme valeur initiale.
3. `reactive` s'annote via l'interface sur la variable (`const form: LoginForm = reactive({...})`), pas via le générique de `reactive<T>()`.
4. `computed` infère son type depuis le getter — annoter `computed<T>()` seulement pour les types union (string littéraux, etc.).
5. `defineComponent` est nécessaire pour le typage TS sans `<script setup>` — en pratique, uniquement pour du code legacy ou des bibliothèques.
6. `lang="ts"` absent = TypeScript silencieusement désactivé — vérifier en premier si TS "ne fait rien".
7. `e` dans `catch` est `unknown` en mode strict — `instanceof Error` avant d'accéder à `.message`.
8. `useTemplateRef<HTMLInputElement>('name')` (Vue 3.5) est préférable à `ref<HTMLInputElement | null>(null)` pour les refs de template.

---

## 7. Seeds Anki

```
Pourquoi ref(null) est-il presque toujours un bug de typage ?|TypeScript infère Ref<null> — la ref ne peut contenir QUE null. Il faut annoter : ref<User | null>(null) pour un type final correct.
Quelle est la différence de typage entre ref() et reactive() ?|ref() accepte toute valeur (primitives incluses) via .value. reactive() n'accepte que les objets/tableaux/Map/Set et retourne un Proxy — les primitives sont refusées par TS.
Comment annoter reactive pour un objet typé ?|Via l'interface sur la variable : const form: LoginForm = reactive({...}). Préférable à reactive<LoginForm>({}) pour une inférence plus fiable.
Quand annoter computed<T>() vs laisser TypeScript inférer ?|Laisser inférer pour les types simples (number, string, boolean). Annoter computed<'idle' | 'loading' | 'done'>() pour les unions de string littéraux ou quand le getter retourne des branches hétérogènes.
Pourquoi defineComponent est-il nécessaire avec setup() mais pas avec <script setup> ?|Sans defineComponent, props est {} pour TypeScript. defineComponent active l'inférence des props depuis l'option props:. Avec <script setup>, defineProps<{...}>() (macro compilateur) gère le typage directement.
Que se passe-t-il si on écrit count.value dans le template d'un <script setup> ?|Vue auto-unwrap les refs de premier niveau dans le template. Écrire count.value retourne l'objet Ref lui-même au lieu de la valeur — résultat : "[object Object]" ou comportement incorrect.
Quel est le type de e dans un bloc catch en TypeScript strict ?|unknown — depuis TS 4.0, le catch bind est unknown (pas Error). Il faut rétrécir le type avec if (e instanceof Error) avant d'accéder à e.message.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-00-typer-vue3/README.md`. Corriger et compléter le typage d'un composant Vue 3 starter avec `vue-tsc --noEmit` comme oracle — zéro gap-fill, corrigé commenté intégral.
