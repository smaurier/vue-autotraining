---
titre: Composables
cours: 02-vue
notions: [convention use*, extraction de logique réactive, retour d'un composable, arguments réactifs toValue, composables asynchrones, composables avec lifecycle, composables partagés vs par instance, règles d'appel dans setup, composables de la communauté VueUse]
outcomes:
  - sait extraire une logique réactive réutilisable dans un composable use*
  - sait accepter des arguments réactifs (ref ou getter) avec toValue
  - sait gérer le cycle de vie et le nettoyage dans un composable
  - sait distinguer un composable partagé (état module) d'un composable par instance
prerequis: [08-composition-api-avancee]
next: 10-gestion-async
libs: [{ name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — composables réutilisables useFamily (état d'une famille) et useAuth (session), consommés par plusieurs composants
last-reviewed: 2026-07
---

# Composables

> **Outcomes — tu sauras FAIRE :** extraire une logique réactive réutilisable dans un composable `use*`, accepter des arguments réactifs avec `toValue`, gérer le cycle de vie et le nettoyage, distinguer état partagé et état par instance.
> **Difficulté :** :star::star::star:

## 1. Cas concret d'abord

Dans TribuZen, deux composants ont besoin de la même logique : charger et afficher les données d'une famille.

`FamilyCard.vue` affiche un résumé dans la sidebar. `FamilyDashboard.vue` affiche la vue complète. Chacun a aujourd'hui son propre code de fetch, ses propres `ref` `loading`/`error`/`family`, son propre `onMounted` — 30 lignes dupliquées à l'identique.

```vue
<!-- FamilyCard.vue — AVANT extraction -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{ familyId: string }>()

const family = ref<Family | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetch(`/api/families/${props.familyId}`)
    family.value = await res.json()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erreur'
  } finally {
    loading.value = false
  }
})
</script>
```

```vue
<!-- FamilyDashboard.vue — IDENTIQUE, copié-collé -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
// ... exactement le même bloc de 20 lignes
</script>
```

**La solution :** extraire ce bloc dans `useFamily(familyId)`. Les deux composants n'auront plus qu'une ligne chacun. Ce module explique comment.

---

## 2. Théorie complète, concise

### 2.1 Convention `use*` et organisation

Un **composable** est une fonction TypeScript qui utilise les APIs de composition Vue (`ref`, `computed`, `watch`, hooks) et qui est appellée dans `setup` (ou `<script setup>`). La convention de nommage est universelle : préfixe **`use`** + nom en camelCase.

```
src/
  composables/
    useFamily.ts       ← logique famille (fetch, état, nettoyage)
    useAuth.ts         ← session utilisateur
    useMouse.ts        ← position curseur
    useDebounce.ts     ← retard de frappe
```

Le préfixe `use` est un signal fort pour le lecteur : cette fonction contient de la réactivité Vue et doit être appelée dans un contexte synchrone de `setup`. Sans ce préfixe, rien n'indique que la fonction utilise des lifecycle hooks ou crée des refs.

### 2.2 Ce qu'un composable retourne

Un composable retourne un **objet** contenant des refs, des computeds ou des fonctions. L'appelant déstructure ce qu'il veut :

```ts
// composables/useCounter.ts
import { ref, computed } from 'vue'

export function useCounter(initial = 0) {
  const count = ref(initial)
  const doubled = computed(() => count.value * 2)

  function increment() { count.value++ }
  function reset() { count.value = initial }

  // Retourner des refs (pas .value) — le composant a besoin de réactivité
  return { count, doubled, increment, reset }
}
```

```vue
<script setup lang="ts">
import { useCounter } from '@/composables/useCounter'

// Déstructuration : on prend uniquement ce dont ce composant a besoin
const { count, increment } = useCounter(10)
// count est une Ref<number> — réactif, auto-unwrap dans le template
</script>
```

**Règle de retour :** retourner les refs elles-mêmes (pas `.value`) pour que la réactivité survive à la déstructuration. Retourner uniquement ce qui est utile au consommateur — les variables internes de travail restent privées.

### 2.3 Arguments réactifs — `toValue` (Vue 3.3+)

Un composable robuste doit accepter ses arguments sous trois formes : valeur brute, `Ref`, ou getter (fonction `() => T`). Cela permet au consommateur de brancher une prop réactive ou un computed sans ré-écrire le composable.

Vue 3.3 introduit `toValue` et `MaybeRefOrGetter<T>` pour ce pattern :

```ts
import { toValue, type MaybeRefOrGetter } from 'vue'

// toValue unwrap :
//   - une Ref<T>   → ref.value
//   - un getter    → getter()  (appel de la fonction)
//   - une valeur T → T directement

function toValue<T>(source: MaybeRefOrGetter<T>): T

// MaybeRefOrGetter<T> = T | Ref<T> | (() => T)
```

Exemple concret — `useFamily` qui accepte `familyId` sous n'importe quelle forme :

```ts
// composables/useFamily.ts
import { ref, watchEffect, toValue, type MaybeRefOrGetter } from 'vue'

interface Family {
  id: string
  name: string
  memberCount: number
}

export function useFamily(familyId: MaybeRefOrGetter<string | null>) {
  const family = ref<Family | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // watchEffect se ré-exécute dès que familyId change (quelle que soit sa forme)
  watchEffect(async () => {
    const id = toValue(familyId)  // ← unwrap : ref, getter ou string brute
    if (!id) return

    loading.value = true
    error.value = null
    try {
      const res = await fetch(`/api/families/${id}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      family.value = await res.json()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur inconnue'
    } finally {
      loading.value = false
    }
  })

  return { family, loading, error }
}
```

Le même composable accepte maintenant les trois formes d'appel :

```ts
// Forme 1 — valeur brute (non réactive, ne se re-fetche pas si change)
const { family } = useFamily('fam-42')

// Forme 2 — Ref (se re-fetche quand selectedId.value change)
const selectedId = ref<string | null>('fam-42')
const { family } = useFamily(selectedId)

// Forme 3 — getter (se re-fetche quand la prop change)
const props = defineProps<{ familyId: string }>()
const { family } = useFamily(() => props.familyId)
```

> **Avant Vue 3.3 :** `unref()` existait déjà mais ne gère que les `Ref` — pas les getters. `toValue()` est le remplacement recommandé dès Vue 3.3 pour les composables qui veulent accepter les trois formes.

### 2.4 Composable asynchrone

Un composable peut encapsuler un cycle complet fetch/loading/error. Le pattern standard expose les trois refs + une fonction `execute` pour relancer manuellement :

```ts
// composables/useAsyncData.ts
import { ref, type Ref } from 'vue'

type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

interface UseAsyncDataReturn<T> {
  data: Ref<T | null>
  error: Ref<string | null>
  status: Ref<AsyncStatus>
  execute: () => Promise<void>
}

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
): UseAsyncDataReturn<T> {
  const data = ref<T | null>(null) as Ref<T | null>
  const error = ref<string | null>(null)
  const status = ref<AsyncStatus>('idle')

  async function execute(): Promise<void> {
    status.value = 'loading'
    error.value = null
    try {
      data.value = await fetcher()
      status.value = 'success'
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur inconnue'
      status.value = 'error'
    }
  }

  return { data, error, status, execute }
}
```

Les composables async ne sont **pas** des fonctions `async` elles-mêmes : la fonction `useAsyncData` est synchrone, c'est `execute` qui est async. Cela garantit que les lifecycle hooks enregistrés à l'intérieur s'attachent bien à l'instance active.

### 2.5 Lifecycle dans un composable

Les composables peuvent enregistrer leurs propres lifecycle hooks. Ces hooks s'attachent à l'**instance du composant qui a appelé le composable** — exactement comme si on les avait écrits dans le composant.

```ts
// composables/useMouse.ts
import { ref, onMounted, onUnmounted } from 'vue'

export function useMouse() {
  const x = ref(0)
  const y = ref(0)

  function update(event: MouseEvent) {
    x.value = event.pageX
    y.value = event.pageY
  }

  // Ces hooks s'attachent à l'instance du composant appelant
  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))

  return { x, y }
}
```

**Règle du nettoyage :** tout `addEventListener`, `setInterval`, `setTimeout`, subscription externe ajouté dans un composable **doit être supprimé** dans `onUnmounted`. Sans nettoyage, le listener survit au démontage du composant et continue de consommer de la mémoire (fuite mémoire).

### 2.6 État partagé vs état par instance

C'est le piège le plus subtil des composables. La différence tient à **l'emplacement de la déclaration des refs** :

```ts
// ─── ÉTAT PARTAGÉ (module scope) ────────────────────────────────────────────
// La ref est créée UNE FOIS au niveau du module, PAS dans la fonction
const sharedFamilies = ref<Family[]>([])

export function useFamilyStore() {
  // Tous les composants accèdent à la MÊME ref
  // Modifier depuis un composant A modifie la vue dans le composant B
  return { families: sharedFamilies }
}

// ─── ÉTAT PAR INSTANCE ───────────────────────────────────────────────────────
export function useFamilyLocal() {
  // Nouvelle ref créée à chaque appel de useFamilyLocal()
  // Chaque composant a son propre tableau, totalement indépendant
  const families = ref<Family[]>([])
  return { families }
}
```

**Quand utiliser quoi :**

| Pattern | Quand | Exemple TribuZen |
|---------|-------|-----------------|
| Module scope (partagé) | État global applicatif — une seule source de vérité | `useAuth` — la session est unique |
| Instance scope | État local à chaque composant | `useFamily(id)` — chaque composant charge sa propre famille |

> **Attention :** le module scope est un pattern de state management léger. Pour des cas complexes (persistance, devtools, SSR), préférer Pinia (module 11).

### 2.7 Règles d'appel dans `setup`

Les composables doivent être appelés **synchronement** lors de l'initialisation du composant. Vue utilise une variable globale (`currentInstance`) pour savoir à quel composant attacher les lifecycle hooks — cette variable n'existe que pendant l'exécution synchrone de `setup`.

```ts
// ✅ Valide — appel synchrone au niveau racine de script setup
const { family } = useFamily(props.familyId)

// ✅ Valide — composable dans un composable (synchrone)
export function useSearchFamily() {
  const query = ref('')
  const { family } = useFamily(query)  // ✅ synchrone dans setup du composable
  return { query, family }
}
```

```ts
// ❌ Invalide — appel dans un bloc conditionnel
if (props.familyId) {
  const { family } = useFamily(props.familyId)  // ❌ hooks conditionnels
}

// ❌ Invalide — appel après un await (instance déjà perdue)
async function init() {
  await somePromise()
  const { family } = useFamily(props.familyId)  // ❌ plus d'instance active
}

// ❌ Invalide — appel dans un callback
onMounted(() => {
  const { x } = useMouse()  // ❌ lifecycle hooks ne s'attachent pas correctement
})
```

**Solution pour les scénarios conditionnels :** passer l'argument conditionnel sous forme de getter ou de `Ref`, et gérer la condition à l'intérieur du composable (comme `if (!id) return` dans `useFamily`).

---

## 3. Worked examples

### Exemple 1 — `useMouse` avec lifecycle et cleanup

Composable qui trace la position de la souris en temps réel. Démontre le pattern lifecycle + nettoyage complet.

```ts
// composables/useMouse.ts
import { ref, onMounted, onUnmounted } from 'vue'

export function useMouse() {
  const x = ref(0)
  const y = ref(0)

  // Fonction nommée — indispensable pour pouvoir la passer à removeEventListener
  // Une arrow function anonyme dans addEventListener ne peut PAS être retirée
  function handleMouseMove(event: MouseEvent) {
    x.value = event.pageX
    y.value = event.pageY
  }

  // onMounted : l'élément DOM existe, on peut écouter window
  onMounted(() => {
    window.addEventListener('mousemove', handleMouseMove)
  })

  // onUnmounted : composant retiré du DOM — on nettoie
  // Sans ça, handleMouseMove continue de tourner indéfiniment
  onUnmounted(() => {
    window.removeEventListener('mousemove', handleMouseMove)
  })

  return { x, y }
}
```

```vue
<!-- PositionTracker.vue -->
<script setup lang="ts">
import { useMouse } from '@/composables/useMouse'

// Une ligne au lieu de 15 — la logique d'écoute est encapsulée
const { x, y } = useMouse()
</script>

<template>
  <p>Curseur : {{ x }}, {{ y }}</p>
</template>
```

**Ce qui se passe au démontage de `PositionTracker` :** Vue appelle `onUnmounted` → `removeEventListener` est exécuté → la fonction `handleMouseMove` est désenregistrée → plus de mises à jour des refs → pas de fuite mémoire.

### Exemple 2 — `useFamily` avec `toValue` (TribuZen)

Composable asynchrone complet qui accepte l'id sous les trois formes. C'est la version production de l'extraction vue en Section 1.

```ts
// composables/useFamily.ts
import { ref, watchEffect, toValue, type MaybeRefOrGetter } from 'vue'

export interface Family {
  id: string
  name: string
  memberCount: number
  createdAt: string
}

export function useFamily(familyId: MaybeRefOrGetter<string | null>) {
  const family = ref<Family | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // watchEffect retrace automatiquement toValue(familyId) comme dépendance
  // Dès que familyId change (ref, getter, ou valeur), watchEffect relance
  watchEffect(async () => {
    const id = toValue(familyId)

    // Garde : rien à charger si pas d'id
    if (!id) {
      family.value = null
      return
    }

    loading.value = true
    error.value = null

    try {
      const res = await fetch(`/api/families/${id}`)
      if (!res.ok) throw new Error(`Erreur serveur ${res.status}`)
      // Typage explicite du JSON — pas de inférence any
      family.value = (await res.json()) as Family
    } catch (e) {
      family.value = null
      error.value = e instanceof Error ? e.message : 'Erreur inconnue'
    } finally {
      loading.value = false
    }
  })

  return { family, loading, error }
}
```

**`FamilyCard.vue` après extraction :**

```vue
<script setup lang="ts">
import { useFamily } from '@/composables/useFamily'

const props = defineProps<{ familyId: string }>()

// Getter form — se re-fetche si props.familyId change (ex : navigation entre familles)
const { family, loading, error } = useFamily(() => props.familyId)
</script>

<template>
  <div v-if="loading">Chargement…</div>
  <div v-else-if="error" class="error">{{ error }}</div>
  <div v-else-if="family">
    <h3>{{ family.name }}</h3>
    <p>{{ family.memberCount }} membre(s)</p>
  </div>
</template>
```

**`FamilyDashboard.vue` — même composable, usage différent :**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useFamily } from '@/composables/useFamily'

// Ref form — l'utilisateur sélectionne la famille depuis une liste
const selectedId = ref<string | null>(null)
const { family, loading } = useFamily(selectedId)

function selectFamily(id: string) {
  selectedId.value = id  // → useFamily re-fetche automatiquement
}
</script>
```

Les deux composants partagent la même **logique** (`useFamily`) mais ont chacun leur propre **état** (instances indépendantes de `family`, `loading`, `error`).

### Exemple 3 — Composition de composables : `useSearchFamily`

Les composables se composent entre eux exactement comme des fonctions. Un composable de "haut niveau" peut assembler plusieurs composables plus petits. C'est le vrai pouvoir de la Composition API : la logique se compose verticalement.

```ts
// composables/useDebounce.ts
import { ref, watch } from 'vue'

export function useDebounce<T>(source: () => T, delay = 300) {
  const debounced = ref<T>(source())

  let timer: ReturnType<typeof setTimeout>
  watch(source, (val) => {
    clearTimeout(timer)
    timer = setTimeout(() => { debounced.value = val as T }, delay)
  })

  return { debounced }
}
```

```ts
// composables/useSearchFamily.ts
// Composition de 3 composables : useDebounce + useFamily + useAsyncData
import { ref, computed } from 'vue'
import { useDebounce }  from './useDebounce'
import { useFamily }    from './useFamily'
import { useAsyncData } from './useAsyncData'

export function useSearchFamily() {
  // État local : le texte brut tapé par l'utilisateur
  const query = ref('')

  // Composable 1 — debounce : on n'interroge l'API qu'après 400ms d'inactivité
  const { debounced: debouncedQuery } = useDebounce(() => query.value, 400)

  // Composable 2 — famille sélectionnée manuellement
  const selectedFamilyId = ref<string | null>(null)
  const { family, loading: familyLoading } = useFamily(() => selectedFamilyId.value)

  // Composable 3 — recherche paginée déclenchée sur la query debouncée
  const { data: results, loading: searchLoading, execute: search } = useAsyncData<string[]>(
    async (signal) => {
      const q = debouncedQuery.value
      if (!q) return []
      const res = await fetch(`/api/families/search?q=${encodeURIComponent(q)}`, { signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json() as Promise<string[]>
    },
  )

  // Computed dérivé des deux états — aucune logique dupliquée
  const isLoading = computed(() => familyLoading.value || searchLoading.value)

  return { query, debouncedQuery, results, family, isLoading, search, selectedFamilyId }
}
```

```vue
<!-- SearchPanel.vue -->
<script setup lang="ts">
import { watch } from 'vue'
import { useSearchFamily } from '@/composables/useSearchFamily'

// Une seule ligne, toute la logique encapsulée
const { query, results, family, isLoading, search, selectedFamilyId } = useSearchFamily()

// Relancer la recherche à chaque changement de la query debouncée
watch(query, () => search())
</script>

<template>
  <input v-model="query" placeholder="Rechercher une famille…" />
  <p v-if="isLoading">Recherche en cours…</p>
  <ul v-else>
    <li
      v-for="id in results"
      :key="id"
      @click="selectedFamilyId = id"
    >{{ id }}</li>
  </ul>
  <div v-if="family">{{ family.name }}</div>
</template>
```

**Ce que montre cet exemple :**
- `useSearchFamily` assemble `useDebounce` + `useFamily` + `useAsyncData` — chacun reste simple et testable indépendamment.
- Le composant final n'a aucune logique d'async ou de debounce — il consomme seulement des refs et des fonctions.
- Les composables sont transparents entre eux : `useFamily` ne sait pas qu'il est utilisé dans une recherche.

> **Note — `useApi` avec `inject` (voir module 08) :** dans une codebase avec un client HTTP centralisé, `useAsyncData` n'appelle pas `fetch` directement. Il injecte via `inject(ApiClientKey)` un client typé fourni par `provide` dans `AppShell.vue`. Cela permet de mocker le client en tests et de gérer les headers d'auth dans un seul endroit. Voir §2.13 du module 08 pour le pattern `provide`/`inject` + `InjectionKey<T>`.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Appeler un composable hors de `setup`

```ts
// ❌ Appel dans un callback — l'instance du composant n'existe plus
let cleanup: (() => void) | null = null

function initFeature() {
  // useMouse() appelle onMounted/onUnmounted → ces hooks cherchent l'instance active
  // Hors setup synchrone, currentInstance est null → les hooks sont perdus silencieusement
  const { x } = useMouse()  // ❌ onMounted/onUnmounted ne s'attachent à rien
}
```

```ts
// ✅ Appel synchrone dans setup — instance active, hooks bien attachés
const { x } = useMouse()  // ✅

// ✅ Si la logique doit être conditionnelle, gérer la condition dans le composable
const { x } = useMouseWhen(() => isEnabled.value)  // le composable gère la garde
```

**Signal d'alarme :** un composable avec des lifecycle hooks qui ne semble "pas se déclencher" est souvent appelé hors de `setup`.

### PIÈGE #2 — État partagé par accident via le module scope

```ts
// ❌ Bug subtil — families est créé UNE FOIS pour tout le module
const families = ref<Family[]>([])  // ← module scope

export function useFamilyList() {
  // Tous les composants partagent le MÊME tableau — modifier l'un modifie tous les autres
  function addFamily(f: Family) { families.value.push(f) }
  return { families, addFamily }
}
```

```ts
// ✅ État par instance — chaque composant a son propre tableau
export function useFamilyList() {
  const families = ref<Family[]>([])  // ← créé à chaque appel
  function addFamily(f: Family) { families.value.push(f) }
  return { families, addFamily }
}
```

**Seul cas valide du module scope :** quand l'état doit être partagé volontairement entre toutes les instances (ex : `useAuth` pour la session unique). Dans ce cas, documenter explicitement que l'état est global.

### PIÈGE #3 — Oublier le cleanup d'un side effect

```ts
// ❌ Fuite mémoire — le listener survit au démontage du composant
export function useWindowSize() {
  const width = ref(window.innerWidth)

  function update() { width.value = window.innerWidth }
  window.addEventListener('resize', update)  // ← jamais retiré !

  return { width }
}
```

```ts
// ✅ Nettoyage dans onUnmounted
export function useWindowSize() {
  const width = ref(window.innerWidth)

  function update() { width.value = window.innerWidth }
  onMounted(() => window.addEventListener('resize', update))
  onUnmounted(() => window.removeEventListener('resize', update))  // ✅ nettoyage

  return { width }
}
```

**Autres side effects à nettoyer :** `setInterval` → `clearInterval`, `setTimeout` → `clearTimeout`, WebSocket → `.close()`, IntersectionObserver → `.disconnect()`. Si un composable crée un effet externe, il doit le supprimer dans `onUnmounted`.

---

## 5. Ancrage TribuZen

TribuZen a deux composables fondamentaux consommés par de nombreux composants :

**`useAuth` — session utilisateur (état partagé)**

```ts
// composables/useAuth.ts
// État au niveau du MODULE — la session est unique pour toute l'app
const currentUser = ref<User | null>(null)
const sessionToken = ref<string | null>(null)

export function useAuth() {
  const isLoggedIn = computed(() => currentUser.value !== null)

  async function login(email: string, password: string): Promise<void> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) throw new Error('Identifiants invalides')
    const { user, token } = await res.json()
    currentUser.value = user
    sessionToken.value = token
  }

  function logout(): void {
    currentUser.value = null
    sessionToken.value = null
  }

  // currentUser et sessionToken sont des module-scoped refs :
  // se connecter depuis LoginForm met à jour le NavBar automatiquement
  return { currentUser, isLoggedIn, login, logout }
}
```

**`useFamily` — données d'une famille (état par instance)**

Vu dans les exemples précédents. Chaque `FamilyCard`, `FamilyDashboard` ou `FamilySettings` crée sa propre instance de `useFamily(id)` — leurs états de chargement sont indépendants.

**Arborescence cible dans `smaurier/tribuzen` :**

```
tribuzen/
  src/
    composables/
      useAuth.ts         ← module scope — session unique
      useFamily.ts       ← instance scope — chargement par id
    components/
      auth/
        LoginForm.vue    ← consomme useAuth()
      layout/
        NavBar.vue       ← consomme useAuth() — même ref partagée
      family/
        FamilyCard.vue   ← consomme useFamily(() => props.familyId)
        FamilyDashboard.vue ← consomme useFamily(selectedId)
```

---

## 6. Points clés

1. Un composable est une fonction TypeScript préfixée `use*` qui appelle les APIs de composition Vue — appelée synchronement dans `setup`.
2. Retourner les refs elles-mêmes (pas `.value`) pour que la déstructuration préserve la réactivité.
3. `toValue(source)` (Vue 3.3+) accepte une valeur brute, une `Ref`, ou un getter `() => T` — utiliser `MaybeRefOrGetter<T>` comme type de paramètre pour les composables flexibles.
4. Les lifecycle hooks enregistrés dans un composable s'attachent à l'instance du composant appelant — ils doivent être appelés synchronement lors de l'init du composant.
5. Tout side effect (addEventListener, setInterval, WebSocket) créé dans un composable doit être nettoyé dans `onUnmounted`.
6. État au niveau du module (module scope) = partagé entre toutes les instances. État dans la fonction = par instance. Ce choix est une décision d'architecture, pas un oubli.
7. Un composable async garde sa signature synchrone — c'est la fonction interne `execute` qui est `async`, pas le composable lui-même.
8. Les composables de la communauté VueUse (`@vueuse/core`) couvrent 200+ besoins courants — les utiliser pour localStorage, darkMode, IntersectionObserver, fetch réactif plutôt que de ré-implémenter.

---

## 7. Seeds Anki

```
Pourquoi préfixer un composable par use* ?|Convention signalant que la fonction contient de la réactivité Vue et doit être appelée synchronement dans setup. Elle permet aussi aux linters/outils de détecter les appels hors contexte.
Différence entre toValue() et unref() ?|unref() unwrap uniquement une Ref (retourne .value ou la valeur brute). toValue() (Vue 3.3+) unwrap aussi les getters (() => T) en les appelant. Utiliser toValue pour accepter les trois formes dans un composable.
Comment un composable accepte-t-il des arguments réactifs ?|En typant le paramètre MaybeRefOrGetter<T> et en appelant toValue(param) à l'intérieur. watchEffect retrace toValue(param) comme dépendance et se ré-exécute si la source change.
État partagé vs état par instance dans un composable — comment les distinguer ?|Ref créée HORS de la fonction (module scope) = partagée entre tous les appelants. Ref créée DANS la fonction = nouvelle instance à chaque appel. Le placement de la déclaration est la seule différence.
Peut-on appeler un composable dans un callback setTimeout ou dans un bloc if ?|Non. Les lifecycle hooks enregistrés dans le composable cherchent l'instance active (currentInstance). Cette variable n'est disponible que pendant l'exécution synchrone de setup. Hors setup, les hooks sont perdus silencieusement.
Pourquoi un composable async garde-t-il une signature synchrone ?|Si la fonction useX() est elle-même async, les hooks enregistrés après un await perdent l'instance active. La convention : useX() est synchrone et retourne execute() qui est async.
Que se passe-t-il si on oublie onUnmounted dans un composable avec addEventListener ?|Le listener survit au démontage du composant — fuite mémoire. La fonction de mise à jour continue de s'exécuter même après que le composant ait disparu du DOM.
Quand utiliser VueUse plutôt qu'écrire son propre composable ?|Pour les comportements courants (localStorage, darkMode, IntersectionObserver, fetch réactif) où VueUse gère les edge cases SSR, synchronisation multi-onglets, cleanup. Écrire son propre composable pour la logique métier spécifique à l'application.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-09-composables/README.md`. Tu construis `useFamily` de A à Z avec `toValue`, tu le branches dans deux composants distincts, et tu vérifies que les états restent bien indépendants — corrigé complet commenté inclus.

---

_Navigation : ← [08 — Composition API avancée](08-composition-api-avancee.md) | → [10 — Gestion async](10-gestion-async.md)_
