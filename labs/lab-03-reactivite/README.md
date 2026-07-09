# Lab 03 — Réactivité

> **Outcome :** à la fin, tu sais assembler `ref`, `computed` et `watch` dans un SFC Vue 3, diagnostiquer une perte de réactivité par destructuring et la corriger avec `toRefs`.
> **Vrai outil :** Vue 3.5 + Vite dev server (HMR visible en direct dans le navigateur).
> **Feedback :** le coach valide visuellement en session — pas de test-runner auto-correcteur.

---

## Énoncé

Tu pars du composant `FamilyMemberList.vue` **cassé** (extrait du module 03, section 1) et tu le répares entièrement. Voici le cahier des charges **exact** :

1. La liste des membres est un `ref<Member[]>` — toute mutation déclenche le rendu.
2. Un champ de recherche (câblé avec `v-model`) filtre les membres en temps réel via un `computed`.
3. Un compteur **en ligne** dérive du même `ref` via un second `computed` — affiché dans le titre.
4. Une recherche non vide loggue dans la console après **300 ms** de silence (debounce via `watch` + `onCleanup`). Si l'utilisateur tape puis efface immédiatement, aucun log ne sort.
5. Un bouton **Ajouter Charlie** ajoute un membre et la liste se met à jour instantanément.
6. Un empty state s'affiche si aucun membre ne correspond au filtre actif.

**Composant cassé à corriger (starter) :**

```vue
<!-- FamilyMemberList.vue — starter cassé -->
<script setup>
// ❌ Bug 1 : tableau JS ordinaire — Vue ne le surveille pas
let members = [
  { id: '1', name: 'Alice', role: 'parent', online: true  },
  { id: '2', name: 'Bob',   role: 'enfant', online: false },
  { id: '3', name: 'Cara',  role: 'parent', online: true  },
]

// ❌ Bug 2 : variable primitive — Vue n'y réagit pas
let search = ''

// ❌ Bug 3 : valeur plain calculée UNE SEULE FOIS au montage
const filteredMembers = members.filter(m =>
  m.name.toLowerCase().includes(search.toLowerCase())
)

function addMember(name) {
  members.push({ id: Date.now(), name, role: 'enfant', online: false })
  // le template ne se met PAS à jour
}
</script>

<template>
  <input @input="e => search = e.target.value" placeholder="Filtrer..." />
  <ul>
    <li v-for="m in filteredMembers" :key="m.id">{{ m.name }}</li>
  </ul>
  <button @click="addMember('Charlie')">Ajouter Charlie</button>
</template>
```

**Pas de gap-fill** — tu écris le composant complet depuis ce starter.

---

## Étapes (en friction)

1. **Corrige Bug 1** — déclare l'interface `Member` (`id`, `name`, `role`, `online`) et enveloppe `members` dans un `ref<Member[]>`. Dans `addMember`, remplace `push` par un remplacement entier : `members.value = [...members.value, newMember]`. Pourquoi ce remplacement est-il préférable à `push` pour la prévisibilité ?

2. **Corrige Bug 2** — remplace `let search = ''` par `const query = ref('')`. Câble `v-model="query"` sur l'input (supprime le `@input` manuel et `e.target.value`).

3. **Corrige Bug 3** — remplace `filteredMembers` par un `computed<Member[]>`. Guard clause : si `query.value.trim()` est vide, retourner toute la liste ; sinon filtrer sur `m.name.toLowerCase()`. Pourquoi un `computed` et pas une méthode `getFiltered()` appelée dans le template ?

4. **Ajoute `onlineCount`** — un second `computed<number>` qui compte les membres avec `online: true`. Affiche `onlineCount` membres en ligne dans un `<h2>`. (Rappel : auto-unwrap dans le template — pas de `.value`.)

5. **Ajoute le debounce** — un `watch(query, (newQ, _oldQ, onCleanup) => { ... })`. À l'intérieur : crée un `setTimeout` de 300 ms qui loggue `newQ` si non vide. Passe `onCleanup(() => clearTimeout(timer))` pour annuler le timer précédent avant chaque nouvelle frappe. Pourquoi `watch` et pas `watchEffect` ici ?

6. **Écris le template complet** — `v-model="query"` sur l'input, `v-for="member in filtered"` avec `:key="member.id"`, un span `v-if="member.online"` pour le point vert, `:class="{ 'member--offline': !member.online }"` sur chaque `<li>`. Empty state via `v-if="filtered.length === 0"` + `v-else` sur la liste.

7. **Vérifie les cas limites** — saisir "ali" → seule Alice reste ; taper "bo" puis effacer en moins de 300 ms → aucun log console ; cliquer le bouton → Charlie apparaît sans rechargement. Ajouter tous les membres offline → empty state si tu filtres sur un nom inexistant.

---

## Corrigé complet commenté

```vue
<!-- FamilyMemberList.vue — corrigé -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// Interface du domaine TribuZen — define ici, migrera vers src/types plus tard
interface Member {
  id: string
  name: string
  role: 'parent' | 'enfant'
  online: boolean
}

// Fix Bug 1 : ref<Member[]> — Vue installe un Proxy profond sur le tableau.
// On remplace le tableau entier à chaque mutation (spread + nouvel objet).
// push() déclencherait aussi le rendu avec ref, mais le remplacement
// est plus prévisible, immuable, et facilement testable en isolation.
const members = ref<Member[]>([
  { id: '1', name: 'Alice', role: 'parent', online: true  },
  { id: '2', name: 'Bob',   role: 'enfant', online: false },
  { id: '3', name: 'Cara',  role: 'parent', online: true  },
])

// Fix Bug 2 : ref<string> pour une primitive — reactive() ne peut pas
// envelopper un string directement (interdit par TypeScript + Vue).
// v-model dans le template lit et écrit query.value automatiquement.
const query = ref('')

// Fix Bug 3 : computed met le résultat en cache.
// Ne recalcule QUE si members.value OU query.value change.
// Une méthode getFiltered() recalculerait à CHAQUE render, même sans changement.
const filtered = computed<Member[]>(() => {
  const q = query.value.toLowerCase().trim()
  // Guard clause : query vide → toute la liste, sans parcourir chaque membre
  if (q === '') return members.value
  return members.value.filter(m => m.name.toLowerCase().includes(q))
})

// Compteur indépendant — dépend uniquement de members.value.
// Les deux computed sont mis en cache séparément : modifier query.value
// recalcule filtered mais PAS onlineCount (ses dépendances n'ont pas changé).
const onlineCount = computed<number>(() =>
  members.value.filter(m => m.online).length
)

// watch vs watchEffect :
// — watch = source EXPLICITE (query) → déclenché seulement sur changement
// — watch est LAZY : pas de log au montage, uniquement sur mutation
// — watchEffect aurait logué immédiatement au montage avec query vide
// onCleanup est appelé AVANT la prochaine exécution du callback :
// si l'utilisateur tape vite, clearTimeout annule le setTimeout précédent
// → seul le dernier appel après 300 ms de silence produit un log.
watch(query, (newQ, _oldQ, onCleanup) => {
  const timer = setTimeout(() => {
    if (newQ.trim()) {
      console.log('[TribuZen analytics] member search:', newQ)
    }
  }, 300)
  onCleanup(() => clearTimeout(timer))
})

// Remplacement entier (spread) → Vue détecte le nouvel identifiant de tableau
// et déclenche le rendu. crypto.randomUUID() : id UUID v4 garanti unique.
function addMember(name: string): void {
  members.value = [
    ...members.value,
    { id: crypto.randomUUID(), name, role: 'enfant', online: false },
  ]
}

// ─── Piège réactivité — à lire, pas à brancher dans le template ────────────
//
// CASSÉ — destructurer un reactive() extrait une primitive JS ordinaire :
//   const state = reactive({ count: 0 })
//   const { count } = state   // count = 0, un number brut, plus lié au Proxy
//   count++                   // state.count reste à 0, le template ne réagit pas
//
// FIX — toRefs() retourne un objet dont chaque prop est une Ref synchronisée :
//   import { toRefs } from 'vue'
//   const { count } = toRefs(state)
//   count.value++             // state.count = 1, liaison bidirectionnelle
//
// Dans ce composant, on retourne directement des ref/computed autonomes
// → pas besoin de toRefs (on n'a pas de reactive à destructurer).
// ────────────────────────────────────────────────────────────────────────────
</script>

<template>
  <section class="family-members">
    <!-- onlineCount est ComputedRef<number> — auto-unwrap dans le template,
         pas de .value requis. Affiche "2 en ligne" dès le premier rendu. -->
    <h2>Membres de la famille — {{ onlineCount }} en ligne</h2>

    <!-- v-model = liaison bidirectionnelle sur query.value.
         Dès que l'utilisateur tape, query.value change → filtered recalcule. -->
    <input
      v-model="query"
      type="search"
      placeholder="Filtrer par nom..."
    />

    <!-- Empty state : teste filtered.length (liste déjà filtrée),
         pas members.value.length — si le filtre ne matche rien, on l'affiche
         même si members n'est pas vide. -->
    <p v-if="filtered.length === 0" class="empty-state">
      Aucun membre ne correspond.
    </p>

    <!-- v-else : s'affiche uniquement quand filtered.length > 0 -->
    <ul v-else>
      <!--
        v-for sur filtered (le computed), pas sur members.value brut.
        :key="member.id" — id métier stable, résistant au tri/filtre futur.
        :class objet — syntaxe lisible pour une seule classe conditionnelle.
      -->
      <li
        v-for="member in filtered"
        :key="member.id"
        :class="{ 'member--offline': !member.online }"
      >
        <!-- Interpolation : auto-escapée par Vue, pas de risque XSS -->
        {{ member.name }}
        <span class="role">{{ member.role }}</span>
        <!-- v-if (pas v-show) : le nœud est ABSENT du DOM quand offline.
             v-show garderait un span vide — inutile ici, l'état ne toggle pas. -->
        <span v-if="member.online" class="dot-online" aria-label="En ligne" />
      </li>
    </ul>

    <!-- Expression inline suffisamment courte — au-delà d'un appel simple,
         extraire dans une fonction handleAdd() dans le script. -->
    <button @click="addMember('Charlie')">Ajouter Charlie</button>
  </section>
</template>

<style scoped>
/* Membres hors ligne : opacity plutôt que display:none
   pour garder la structure de liste visible (utile en mode admin) */
.member--offline {
  opacity: 0.45;
}

.role {
  margin-left: 0.5rem;
  font-size: 0.8rem;
  color: #64748b;
}

/* Point vert statut en ligne */
.dot-online {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
  margin-left: 0.5rem;
  vertical-align: middle;
}

.empty-state {
  color: #94a3b8;
  font-style: italic;
}
</style>
```

**Pourquoi ce corrigé est correct :**
- `ref<Member[]>` — Vue installe un Proxy profond sur le tableau. Remplacer `members.value` en entier (spread) est la mutation la plus prévisible : Vue détecte le changement d'identité et re-rend. `push()` fonctionnerait aussi, mais modifie en place et rend les tests moins déterministes.
- `filtered` et `onlineCount` sont deux `computed` indépendants, chacun mis en cache. Changer `query.value` ne recalcule que `filtered`, pas `onlineCount` — Vue ne suit que les dépendances réellement lues dans chaque getter.
- Le `watch(query, ...)` avec `onCleanup` implémente un debounce sans bibliothèque. `clearTimeout` dans `onCleanup` garantit qu'un seul log sort même si l'utilisateur tape plusieurs caractères en rafale — seul le dernier `setTimeout` à survivre 300 ms produit un log.
- `v-model="query"` fonctionne car `query` est une `Ref<string>` — Vue lit `.value` à l'affichage et l'écrit au changement d'input. Passer une primitive extraite (`let q = query.value`) casserait le binding immédiatement.

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées :**

Reproduis `FamilyMemberList.vue` **de mémoire, en 25 minutes**, avec les modifications suivantes :

1. Remplace `const query = ref('')` et `const members = ref<Member[]>(...)` par un seul `reactive` qui regroupe les deux : `const state = reactive({ members: [...], query: '' })`. Pour passer `members` et `query` au template et garder la réactivité, applique `toRefs(state)` — explique à voix haute pourquoi le destructuring direct briserait tout.
2. Remplace le `watch` par un `watchEffect` et identifie ce qui change : est-il déclenché au montage ? A-t-il accès à `oldVal` ? Pourquoi ce choix est-il moins adapté ici ?
3. Ajoute un filtre cumulatif **rôle** : un `ref<'parent' | 'enfant' | ''>` et un `computed` qui combine filtre nom + filtre rôle. <code v-pre>{{ filteredCount }} résultat(s)</code> affiché en temps réel.
4. **Sans ouvrir ce corrigé** ni le module 03.

**Critère de réussite :** les trois comportements fonctionnent dans le navigateur — filtre réactif, compteur en ligne, log debouncé — et le filtre rôle est indépendant du filtre nom.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, `FamilyMemberList.vue` vit ici :

```
tribuzen/
  src/
    components/
      family/
        FamilyMemberList.vue
```

**Différences par rapport au lab :**

- La logique `query` + `filtered` + `onlineCount` + `watch` sera extraite dans un composable `useMembers.ts` (module intermédiaire 02-composables). Pour l'instant, garde tout dans `<script setup>`.
- L'interface `Member` sera importée depuis `src/types/family.ts` — dans le lab, on la définit inline.
- Le log `console.log` dans le `watch` sera remplacé par un appel à un service analytics réel (même pattern `onCleanup`, service différent).
- Les membres viendront d'une prop `members: Member[]` passée par le parent `FamilyPage.vue` (module 05 — `defineProps`). Pour l'instant, garde les données locales.

**Commit cible :**

```
feat(family): FamilyMemberList — ref/computed/watch, filtre réactif, debounce analytics
```
