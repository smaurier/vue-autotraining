# Lab 01 — Réactivité & Composition API

> **Outcome :** à la fin, tu sais construire un composable Vue 3 réactif complet, diagnostiquer une perte de réactivité, et brancher le tout dans un SFC `<script setup>`.
> **Vrai outil :** Vue 3.5 + Vite + Vitest (tests de composable unitaires).
> **Feedback :** le coach valide les tests en session (vitest run = vert).

---

## Énoncé

Tu construis `useMembers` — le composable qui alimentera `FamilyMemberList.vue` dans TribuZen.

Le composable doit :
1. Tenir une liste réactive de membres (`ref<Member[]>`)
2. Exposer un filtre par nom (`query: ref<string>`) + la liste filtrée (`filtered: computed`)
3. Exposer `onlineCount: computed<number>` (membres avec `online: true`)
4. Permettre `addMember(name, role)` et `removeMember(id)`
5. Logger dans la console les recherches non vides après 300 ms (debounce via `watch` + cleanup)

**Contrainte** : le composable est importé et destructuré directement — aucune perte de réactivité autorisée.

Structure à créer dans le repo 02-vue (les dossiers existent déjà via Vite) :

```
02-vue/
  src/
    composables/
      useMembers.ts         ← à créer
    components/
      FamilyMemberList.vue  ← à créer
  src/composables/useMembers.test.ts  ← tests Vitest
```

---

## Étapes (en friction)

**Étape 1 — Modélise le type `Member` et l'état initial**

Sans regarder la correction : écris l'interface `Member` (id, name, role, online) et initialise la liste avec `ref<Member[]>([])`. Pense au typage générique.

- Pourquoi `ref` et pas `reactive` pour un tableau ici ?
- Que se passe-t-il si tu fais `members.push(...)` directement au lieu de `members.value = [...members.value, newMember]` ? (Les deux fonctionnent avec ref sur tableau — mais lequel est plus prévisible ?)

**Étape 2 — Implémente `filtered` avec `computed`**

Écris le `computed` qui filtre par `query.value`. Cas à gérer : query vide → retourner tous les membres.

- Pourquoi ne pas utiliser une méthode `getFiltered()` à la place ?
- Le `computed` sera-t-il recalculé si un membre change son `online` status mais que `query` reste vide ? (Réfléchis aux dépendances trackées.)

**Étape 3 — Implémente le debounce avec `watch` + cleanup**

Utilise `watch(query, (newQ, _, onCleanup) => { ... })` avec `setTimeout` / `clearTimeout`. Le cleanup doit annuler le timer précédent avant chaque nouvel appel.

- Pourquoi `watch` et pas `watchEffect` ici ?
- Si l'utilisateur tape "Ali" puis efface immédiatement, combien de logs console doivent apparaître ?

**Étape 4 — Retourne les valeurs depuis le composable**

Le composable retourne `{ members, query, filtered, onlineCount, addMember, removeMember }`. Toutes les valeurs doivent rester réactives après destructuration dans le composant.

- Quel type Python-like veux-tu voir si tu fais `const { filtered } = useMembers()` ? C'est une `Ref` ou une `ComputedRef` ?
- Faut-il appliquer `toRefs` ici ? Pourquoi ou pourquoi pas ?

**Étape 5 — Écris les tests Vitest**

Avant de créer le SFC, écris 4 tests unitaires dans `useMembers.test.ts` :

```ts
import { describe, it, expect } from 'vitest'
// à compléter
```

Tests minimum :
- `addMember` ajoute bien un membre à `members.value`
- `removeMember` supprime par id
- `filtered` retourne tous les membres quand `query` est vide
- `filtered` filtre correctement quand `query` change (sans await, les computed sont synchrones)

**Étape 6 — Crée `FamilyMemberList.vue`**

Crée le SFC avec `<script setup lang="ts">`, importe `useMembers`, utilise `v-model` sur `query`, `v-for` sur `filtered`. Ajoute un bouton "Ajouter un membre test".

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
  // → Vue détecte le changement d'identité, rendu déclenché
  // Alternative : reactive([]) fonctionne aussi, mais ref = plus safe
  // pour le retour destructuré depuis le composable (pas de toRefs nécessaire)
  const members = ref<Member[]>(initialMembers)

  // Chaîne de recherche — ref<string> car c'est une primitive
  const query = ref('')

  // computed = valeur dérivée, mise en cache
  // Recalcule UNIQUEMENT si members.value ou query.value change
  // → Accéder à m.online dans le filter crée aussi une dépendance
  //   (si un membre passe online, filtered recalcule même si query n'a pas changé)
  const filtered = computed<Member[]>(() => {
    const q = query.value.toLowerCase().trim()
    if (q === '') return members.value
    return members.value.filter(m =>
      m.name.toLowerCase().includes(q)
    )
  })

  // Compteur membres en ligne — dépend de members.value uniquement
  // Note : si members.value ne change pas mais qu'un member.online mute
  // directement (ex: members.value[0].online = true), computed SE recalcule
  // car Vue tracke les accès profonds via le Proxy interne de ref sur tableau
  const onlineCount = computed<number>(() =>
    members.value.filter(m => m.online).length
  )

  // watch explicite sur query (pas watchEffect) car :
  // 1. on veut log seulement quand query CHANGE (pas au montage)
  // 2. on n'a pas besoin de l'ancienne valeur mais watch est lazy par défaut
  // 3. onCleanup permet d'annuler le timer avant le prochain appel → debounce correct
  watch(query, (newQ, _oldQ, onCleanup) => {
    const timer = setTimeout(() => {
      if (newQ.trim()) {
        // En production : remplacer par un vrai appel analytics
        console.log('[TribuZen analytics] member search:', newQ)
      }
    }, 300)
    // onCleanup est appelé juste AVANT la prochaine exécution du callback
    // → si l'utilisateur tape vite, seul le dernier setTimeout s'exécute
    onCleanup(() => clearTimeout(timer))
  })

  // Mutation : on remplace le tableau entier pour garder une trace immutable
  // et éviter les surprises avec Vue 3 (même si push() sur ref fonctionne)
  function addMember(name: string, role: Member['role'] = 'enfant'): void {
    members.value = [
      ...members.value,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        role,
        online: false,
      }
    ]
  }

  function removeMember(id: string): void {
    members.value = members.value.filter(m => m.id !== id)
  }

  // On retourne des refs et computed directement (pas de toRefs nécessaire)
  // car members, query, filtered, onlineCount sont déjà des Ref/ComputedRef
  // → destructuration dans le composant sans perte de réactivité
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

### `src/composables/useMembers.test.ts`

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMembers } from './useMembers'

// Les Ref et computed sont synchrones — pas besoin de nextTick pour les tester
describe('useMembers composable', () => {
  it('initialise avec les membres fournis', () => {
    const initial = [{ id: '1', name: 'Alice', role: 'parent' as const, online: true }]
    const { members } = useMembers(initial)
    // members est un Ref → accès via .value dans les tests
    expect(members.value).toHaveLength(1)
    expect(members.value[0].name).toBe('Alice')
  })

  it('addMember ajoute un membre avec un id unique', () => {
    const { members, addMember } = useMembers()
    addMember('Bob', 'enfant')
    // Vérifie la longueur ET le contenu
    expect(members.value).toHaveLength(1)
    expect(members.value[0].name).toBe('Bob')
    expect(members.value[0].role).toBe('enfant')
    expect(members.value[0].online).toBe(false)
    // id doit exister (UUID format)
    expect(members.value[0].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
  })

  it('removeMember supprime par id sans altérer les autres', () => {
    const { members, addMember, removeMember } = useMembers()
    addMember('Alice')
    addMember('Bob')
    const aliceId = members.value[0].id
    removeMember(aliceId)
    // Alice supprimée, Bob reste
    expect(members.value).toHaveLength(1)
    expect(members.value[0].name).toBe('Bob')
  })

  it('filtered retourne tous les membres quand query est vide', () => {
    const { filtered, addMember } = useMembers()
    addMember('Alice')
    addMember('Bob')
    // query.value = '' par défaut
    // .value sur un ComputedRef = résultat calculé
    expect(filtered.value).toHaveLength(2)
  })

  it('filtered réagit à query.value de façon synchrone', () => {
    const { filtered, query, addMember } = useMembers()
    addMember('Alice')
    addMember('Albert')
    addMember('Bob')

    // Modifier une ref = synchrone → computed recalcule immédiatement
    query.value = 'al'
    expect(filtered.value).toHaveLength(2) // Alice + Albert
    expect(filtered.value.map(m => m.name)).toEqual(['Alice', 'Albert'])

    query.value = 'bob'
    expect(filtered.value).toHaveLength(1)
    expect(filtered.value[0].name).toBe('Bob')

    query.value = ''
    expect(filtered.value).toHaveLength(3) // tous
  })

  it('onlineCount compte uniquement les membres online', () => {
    const initial = [
      { id: '1', name: 'Alice', role: 'parent' as const, online: true },
      { id: '2', name: 'Bob',   role: 'enfant' as const, online: false },
    ]
    const { onlineCount } = useMembers(initial)
    expect(onlineCount.value).toBe(1)
  })

  it('le watch debounce loggue après 300ms (timer fake)', async () => {
    vi.useFakeTimers()
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { query } = useMembers()

    query.value = 'Ali'
    // Avant 300ms : pas de log
    vi.advanceTimersByTime(200)
    expect(consoleSpy).not.toHaveBeenCalled()

    // Après 300ms : log déclenché
    vi.advanceTimersByTime(100)
    // Note : en test unitaire, watch est synchrone ; nextTick pas nécessaire
    // mais le setTimeout lui est async → il faut avancer les fake timers
    await vi.runAllTimersAsync()
    expect(consoleSpy).toHaveBeenCalledWith('[TribuZen analytics] member search:', 'Ali')

    consoleSpy.mockRestore()
    vi.useRealTimers()
  })
})
```

### `src/components/FamilyMemberList.vue`

```vue
<script setup lang="ts">
import { useMembers } from '@/composables/useMembers'

// defineProps = macro compilateur, pas d'import
const props = defineProps<{
  familyId: string
}>()

const emit = defineEmits<{
  // Syntaxe Vue 3.3+ : tableau de types par événement
  memberAdded: [name: string]
}>()

// Destructuration directe : members, query, filtered sont des Ref/ComputedRef
// → réactivité conservée (pas de toRefs nécessaire car déjà des refs)
const {
  query,
  filtered,
  onlineCount,
  addMember,
  removeMember,
} = useMembers()

// Dans le template, Vue auto-unwrap les refs → pas de .value
function handleAddDemo() {
  const name = `Membre ${Date.now()}`
  addMember(name, 'enfant')
  // Communique vers le parent
  emit('memberAdded', name)
}
</script>

<template>
  <section class="family-members">
    <header>
      <h2>Membres de la famille</h2>
      <!-- onlineCount auto-unwrapped : pas de onlineCount.value -->
      <span class="badge">{{ onlineCount }} en ligne</span>
    </header>

    <!-- v-model sur query.value — fonctionne car query est une Ref<string> -->
    <input
      v-model="query"
      type="search"
      placeholder="Filtrer par nom..."
      aria-label="Filtrer les membres"
    />

    <!-- filtered est un ComputedRef<Member[]> — auto-unwrapped en tableau -->
    <ul v-if="filtered.length > 0" role="list">
      <li
        v-for="member in filtered"
        :key="member.id"
        class="member-item"
      >
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

    <button @click="handleAddDemo">
      + Ajouter un membre test
    </button>
  </section>
</template>
```

---

## Variante J+30 (fading)

**Même problème, une contrainte ajoutée : tu as 20 minutes et tu ne peux pas regarder le corrigé.**

Objectif : recréer `useMembers` de mémoire, mais cette fois :
1. Le composable doit accepter un `Ref<string>` en paramètre (le `familyId`) et **recharger** les membres depuis une fausse API à chaque changement de `familyId` (utilise `watch(familyId, fetchMembers, { immediate: true })`).
2. Ajoute un état `loading: Ref<boolean>` et `error: Ref<string | null>`.
3. Écris 2 tests Vitest couvrant le chargement (mocker le fetch avec `vi.fn()`).

Contrainte bonus : interdiction d'utiliser `watchEffect` — uniquement `watch`.

---

## Application TribuZen

**Objectif** : porter `useMembers` dans le vrai repo `smaurier/tribuzen`.

**Fichiers à créer :**

```bash
# Dans tribuzen/
touch src/composables/useMembers.ts
touch src/composables/useMembers.test.ts
touch src/components/FamilyMemberList.vue
```

**Steps concrets :**

1. Copie le contenu de `useMembers.ts` du corrigé dans `tribuzen/src/composables/useMembers.ts`. Adapte l'interface `Member` pour matcher les types existants dans `tribuzen/types/index.ts` (les interfaces `User`, `Family` déjà commitées).

2. Branche `FamilyMemberList.vue` sur un vrai appel `fetch('/api/families/:id/members')` — pour l'instant, mock avec `Promise.resolve([...])` ou utilise les données statiques.

3. Lance `npm test` (= `vitest run`) dans tribuzen. Les 6 tests de `useMembers.test.ts` doivent être verts.

4. Commit dans smaurier/tribuzen :
   ```bash
   git add src/composables/useMembers.ts src/composables/useMembers.test.ts src/components/FamilyMemberList.vue
   git commit -m "feat(vue): useMembers composable — filtered list + debounced search"
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

Ce commit est la preuve de transfert : le concept vu en cours existe dans un vrai produit, dans un vrai repo, avec de vrais tests.
