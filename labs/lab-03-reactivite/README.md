# Lab 03 — Réactivité (Composition API)

> **Outcome :** à la fin, tu sais assembler les primitives de réactivité (`ref`/`reactive`/`computed`/`watch`), diagnostiquer une **perte de réactivité** et la corriger avec `toRefs`, le tout branché dans un SFC `<script setup>` et couvert par des tests Vitest.
> **Vrai outil :** Vue 3.5 + Vite + Vitest (tests unitaires de logique réactive).
> **Feedback :** le coach valide les tests en session (`vitest run` = vert).

> **Périmètre :** ce lab reste sur les **primitives de réactivité**. La communication parent-enfant (`defineProps`/`defineEmits`) est vue au module 05 ; le pattern **composable** complet (paramètres `Ref`, lifecycle, nettoyage) au module intermédiaire 02-composables. Ici, on extrait la logique dans une fonction uniquement pour la **tester en isolation** — c'est l'embryon d'un composable, sans en faire l'objet du lab.

---

## Énoncé

Tu construis l'état réactif de `FamilyMemberList` (catalogue de membres TribuZen) et tu apprends à repérer/corriger une perte de réactivité.

### Partie A — état réactif testable

Écris une fonction `useMembers(initial?)` qui retourne l'état réactif de la liste. Elle doit :
1. Tenir une liste réactive de membres (`ref<Member[]>`)
2. Exposer un filtre par nom (`query: ref<string>`) + la liste filtrée (`filtered: computed`)
3. Exposer `onlineCount: computed<number>` (membres avec `online: true`)
4. Permettre `addMember(name, role)` et `removeMember(id)`
5. Logger dans la console les recherches non vides après 300 ms (debounce via `watch` + `onCleanup`)

**Contrainte** : la fonction retourne des `ref`/`computed`, elle est destructurée directement — aucune perte de réactivité autorisée.

### Partie B — perte de réactivité et fix `toRefs`

Reproduis puis corrige le piège n°1 : partir d'un `reactive`, le destructurer (réactivité cassée), puis rétablir avec `toRefs`. Prouve les deux comportements par des tests.

Structure à créer dans le repo 02-vue (les dossiers existent déjà via Vite) :

```
02-vue/
  src/
    composables/
      useMembers.ts              ← Partie A
      useMembers.test.ts         ← tests Vitest (A + B)
      reactivityPitfall.ts       ← Partie B (démo destructuring / toRefs)
    components/
      FamilyMemberList.vue       ← intégration SFC
```

---

## Étapes (en friction)

**Étape 1 — Modélise le type `Member` et l'état initial**

Sans regarder la correction : écris l'interface `Member` (id, name, role, online) et initialise la liste avec `ref<Member[]>([])`. Pense au typage générique.

- Pourquoi `ref` et pas `reactive` pour un tableau ici ?
- Que se passe-t-il si tu fais `members.value.push(...)` directement au lieu de `members.value = [...members.value, newMember]` ? (Les deux fonctionnent avec `ref` sur tableau — mais lequel est plus prévisible / immuable ?)

**Étape 2 — Implémente `filtered` avec `computed`**

Écris le `computed` qui filtre par `query.value`. Cas à gérer : query vide → retourner tous les membres.

- Pourquoi ne pas utiliser une méthode `getFiltered()` à la place ?
- Le `computed` sera-t-il recalculé si un membre change son `online` status mais que `query` reste vide ? (Réfléchis aux dépendances trackées.)

**Étape 3 — Implémente le debounce avec `watch` + `onCleanup`**

Utilise `watch(query, (newQ, _, onCleanup) => { ... })` avec `setTimeout` / `clearTimeout`. Le cleanup doit annuler le timer précédent avant chaque nouvel appel.

- Pourquoi `watch` et pas `watchEffect` ici ?
- Si l'utilisateur tape "Ali" puis efface immédiatement, combien de logs console doivent apparaître ?

**Étape 4 — Retourne les valeurs**

La fonction retourne `{ members, query, filtered, onlineCount, addMember, removeMember }`. Toutes les valeurs doivent rester réactives après destructuration.

- Quel **type TypeScript** obtiens-tu si tu fais `const { filtered } = useMembers()` ? Une `Ref` ou une `ComputedRef` ?
- Faut-il appliquer `toRefs` ici ? Pourquoi ou pourquoi pas ? (Indice : on retourne déjà des refs.)

**Étape 5 — Partie B : casse puis répare la réactivité**

Dans `reactivityPitfall.ts`, crée un `reactive({ count: 0 })`, destructure-le, mute la copie, observe que rien ne bouge. Puis refais avec `toRefs`.

- Pourquoi le destructuring d'un `reactive` produit-il une valeur figée ?
- `toRef(state, 'count')` vs `toRefs(state)` : quand préférer l'un ?

**Étape 6 — Écris les tests Vitest**

Couvre l'état réactif (Partie A) ET la démo `toRefs` (Partie B). Les `ref`/`computed` sont synchrones : pas besoin de `nextTick` pour lire une valeur dérivée.

**Étape 7 — Crée `FamilyMemberList.vue`**

Crée le SFC avec `<script setup lang="ts">`, importe `useMembers`, utilise `v-model` sur `query`, `v-for` sur `filtered`. Ajoute un bouton "Ajouter un membre test". (Pas de `defineProps`/`defineEmits` ici — c'est le module 05.)

---

## Corrigé complet commenté

### `src/composables/useMembers.ts`

```ts
// useMembers.ts
import { ref, computed, watch } from 'vue'

// Typage du domaine — chaque membre de famille TribuZen
interface Member {
  id: string
  name: string
  role: 'parent' | 'enfant'
  online: boolean
}

export function useMembers(initialMembers: Member[] = []) {
  // ref<Member[]> : on remplace le tableau entier à chaque mutation
  // → Vue détecte le changement d'identité, rendu déclenché.
  // Alternative : reactive([]) marche aussi, mais ref reste destructurable
  // sans toRefs quand on retourne l'état → choix plus sûr.
  const members = ref<Member[]>(initialMembers)

  // Chaîne de recherche — ref<string> car c'est une primitive
  const query = ref('')

  // computed = valeur dérivée, mise en cache.
  // Recalcule UNIQUEMENT si members.value ou query.value change.
  // Accéder à m.name dans le filter crée la dépendance sur le contenu.
  const filtered = computed<Member[]>(() => {
    const q = query.value.toLowerCase().trim()
    if (q === '') return members.value
    return members.value.filter(m => m.name.toLowerCase().includes(q))
  })

  // Compteur membres en ligne — dépend de members.value.
  // Note : ref sur tableau utilise un Proxy profond en interne, donc
  // muter members.value[0].online = true déclenche aussi le recalcul.
  const onlineCount = computed<number>(() =>
    members.value.filter(m => m.online).length
  )

  // watch explicite sur query (pas watchEffect) car :
  // 1. on veut logguer seulement quand query CHANGE (pas au montage) ;
  // 2. onCleanup annule le timer précédent → debounce correct.
  watch(query, (newQ, _oldQ, onCleanup) => {
    const timer = setTimeout(() => {
      if (newQ.trim()) {
        // En production : remplacer par un vrai appel analytics
        console.log('[TribuZen analytics] member search:', newQ)
      }
    }, 300)
    // onCleanup est appelé juste AVANT la prochaine exécution du callback
    // → si l'utilisateur tape vite, seul le dernier setTimeout survit.
    onCleanup(() => clearTimeout(timer))
  })

  // Mutation : on remplace le tableau entier (immutabilité) plutôt que push()
  function addMember(name: string, role: Member['role'] = 'enfant'): void {
    members.value = [
      ...members.value,
      { id: crypto.randomUUID(), name: name.trim(), role, online: false },
    ]
  }

  function removeMember(id: string): void {
    members.value = members.value.filter(m => m.id !== id)
  }

  // On retourne des refs/computed directement : pas de toRefs nécessaire,
  // car ce ne sont pas les propriétés d'un reactive mais des refs autonomes.
  return {
    members,       // Ref<Member[]>
    query,         // Ref<string>
    filtered,      // ComputedRef<Member[]>
    onlineCount,   // ComputedRef<number>
    addMember,
    removeMember,
  }
}
```

### `src/composables/reactivityPitfall.ts` (Partie B)

```ts
// reactivityPitfall.ts — démonstration perte de réactivité + fix toRefs
import { reactive, toRefs, watchEffect } from 'vue'

// CAS CASSÉ : destructurer un reactive extrait une valeur primitive figée
export function brokenDestructuring() {
  const state = reactive({ count: 0 })
  const { count } = state // ❌ count = 0, un number ordinaire, plus lié au Proxy

  // Muter la copie n'affecte pas le Proxy source
  let local = count
  local++ // state.count reste 0
  return { stateCount: () => state.count, localCount: local }
}

// CAS CORRIGÉ : toRefs transforme chaque prop en Ref synchronisée
export function fixedWithToRefs() {
  const state = reactive({ count: 0, name: 'Alice' })
  const { count, name } = toRefs(state) // ✅ Ref<number>, Ref<string>

  count.value++         // state.count devient 1 (bidirectionnel)
  name.value = 'Bob'    // state.name devient 'Bob'

  // Preuve d'observabilité : watchEffect (flush sync = re-run immédiat)
  // ré-exécute sur mutation via la ref.
  const log: number[] = []
  watchEffect(() => log.push(count.value), { flush: 'sync' })
  count.value++ // déclenche le watchEffect → log = [1, 2]

  return { state, count, name, log }
}
```

### `src/composables/useMembers.test.ts`

```ts
import { describe, it, expect, vi } from 'vitest'
import { useMembers } from './useMembers'
import { brokenDestructuring, fixedWithToRefs } from './reactivityPitfall'

// Les Ref et computed sont synchrones — pas besoin de nextTick pour les lire.
describe('useMembers — état réactif (Partie A)', () => {
  it('initialise avec les membres fournis', () => {
    const initial = [{ id: '1', name: 'Alice', role: 'parent' as const, online: true }]
    const { members } = useMembers(initial)
    expect(members.value).toHaveLength(1)
    expect(members.value[0].name).toBe('Alice')
  })

  it('addMember ajoute un membre avec un id UUID', () => {
    const { members, addMember } = useMembers()
    addMember('Bob', 'enfant')
    expect(members.value).toHaveLength(1)
    expect(members.value[0].name).toBe('Bob')
    expect(members.value[0].online).toBe(false)
    expect(members.value[0].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
  })

  it('removeMember supprime par id sans altérer les autres', () => {
    const { members, addMember, removeMember } = useMembers()
    addMember('Alice')
    addMember('Bob')
    removeMember(members.value[0].id)
    expect(members.value).toHaveLength(1)
    expect(members.value[0].name).toBe('Bob')
  })

  it('filtered réagit à query.value de façon synchrone', () => {
    const { filtered, query, addMember } = useMembers()
    addMember('Alice')
    addMember('Albert')
    addMember('Bob')

    expect(filtered.value).toHaveLength(3) // query vide → tous

    query.value = 'al'
    expect(filtered.value.map(m => m.name)).toEqual(['Alice', 'Albert'])

    query.value = 'bob'
    expect(filtered.value).toHaveLength(1)
  })

  it('onlineCount compte uniquement les membres online', () => {
    const initial = [
      { id: '1', name: 'Alice', role: 'parent' as const, online: true },
      { id: '2', name: 'Bob',   role: 'enfant' as const, online: false },
    ]
    const { onlineCount } = useMembers(initial)
    expect(onlineCount.value).toBe(1)
  })

  it('le watch debounce loggue après 300 ms', async () => {
    vi.useFakeTimers()
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { query } = useMembers()

    query.value = 'Ali'
    vi.advanceTimersByTime(200)
    expect(spy).not.toHaveBeenCalled() // avant 300 ms : rien

    await vi.runAllTimersAsync()
    expect(spy).toHaveBeenCalledWith('[TribuZen analytics] member search:', 'Ali')

    spy.mockRestore()
    vi.useRealTimers()
  })
})

describe('perte de réactivité et fix toRefs (Partie B)', () => {
  it('destructurer un reactive fige la valeur (cassé)', () => {
    const { stateCount, localCount } = brokenDestructuring()
    expect(stateCount()).toBe(0)  // le Proxy source n'a pas bougé
    expect(localCount).toBe(1)    // la copie locale, elle, a bougé — désynchro
  })

  it('toRefs rétablit la liaison bidirectionnelle', () => {
    const { state, count, name, log } = fixedWithToRefs()
    expect(state.count).toBe(2)     // count.value++ x2 propagé au reactive
    expect(state.name).toBe('Bob')  // name.value = 'Bob' propagé
    expect(log).toEqual([1, 2])     // l'effect a bien re-tracké la ref
  })
})
```

### `src/components/FamilyMemberList.vue`

```vue
<script setup lang="ts">
import { useMembers } from '@/composables/useMembers'

// Pas de defineProps/defineEmits ici : props/emits = module 05.
// Destructuration directe : query/filtered/onlineCount sont des Ref/ComputedRef
// → réactivité conservée (ce sont des refs autonomes, pas un reactive).
const { query, filtered, onlineCount, addMember, removeMember } = useMembers()

function handleAddDemo() {
  addMember(`Membre ${Date.now()}`, 'enfant')
}
</script>

<template>
  <section class="family-members">
    <header>
      <h2>Membres de la famille</h2>
      <!-- onlineCount auto-unwrapped : pas de .value dans le template -->
      <span class="badge">{{ onlineCount }} en ligne</span>
    </header>

    <!-- v-model sur query — fonctionne car query est une Ref<string> -->
    <input
      v-model="query"
      type="search"
      placeholder="Filtrer par nom..."
      aria-label="Filtrer les membres"
    />

    <ul v-if="filtered.length > 0" role="list">
      <li v-for="member in filtered" :key="member.id" class="member-item">
        <span>{{ member.name }}</span>
        <span class="role">{{ member.role }}</span>
        <span v-if="member.online" class="online-dot" aria-label="En ligne" />
        <button
          @click="removeMember(member.id)"
          :aria-label="`Retirer ${member.name}`"
        >
          ✕
        </button>
      </li>
    </ul>
    <p v-else>Aucun membre ne correspond à la recherche.</p>

    <button @click="handleAddDemo">+ Ajouter un membre test</button>
  </section>
</template>
```

---

## Variante J+30 (fading)

**Même problème, une contrainte ajoutée : tu as 20 minutes et tu ne peux pas regarder le corrigé.**

Recrée `useMembers` de mémoire, mais cette fois :
1. Ajoute un état `loading: Ref<boolean>` et `error: Ref<string | null>`.
2. Ajoute une fonction `reload()` qui simule un fetch (`Promise` + `setTimeout`) et remplace `members.value` au retour, en basculant `loading`.
3. Écris 2 tests Vitest couvrant le passage `loading true → false`.

Contrainte bonus : reproduis la perte de réactivité de la Partie B **sans** regarder — puis corrige-la avec `toRef` (une seule propriété) au lieu de `toRefs`.

---

## Application TribuZen

**Objectif** : porter l'état réactif de la liste dans le vrai repo `smaurier/tribuzen`.

**Fichiers à créer :**

```bash
# Dans tribuzen/
touch src/composables/useMembers.ts
touch src/composables/useMembers.test.ts
touch src/components/FamilyMemberList.vue
```

**Steps concrets :**

1. Copie `useMembers.ts` du corrigé dans `tribuzen/src/composables/`. Adapte l'interface `Member` aux types existants dans `tribuzen/types/index.ts` (interfaces `User`, `Family` déjà commitées).
2. Branche `FamilyMemberList.vue` sur les données statiques (le fetch réel arrive avec le module async/props).
3. Lance `npm test` (= `vitest run`) dans tribuzen. Les tests de `useMembers.test.ts` doivent être verts.
4. Commit dans smaurier/tribuzen :
   ```bash
   git add src/composables/useMembers.ts src/composables/useMembers.test.ts src/components/FamilyMemberList.vue
   git commit -m "feat(vue): état réactif FamilyMemberList — filtered list + debounced search"
   ```

**Lien avec l'existant :** l'interface `Member` peut dériver de `UserPreview` (déjà dans `types/index.ts`) :
```ts
// types/index.ts (existant)
type UserPreview = Pick<User, 'id' | 'name' | 'avatar'>

// À ajouter pour ce lab
interface Member extends UserPreview {
  role: 'parent' | 'enfant'
  online: boolean
}
```

Ce commit est la preuve de transfert : les primitives de réactivité vues en cours existent dans un vrai produit, dans un vrai repo, avec de vrais tests.
