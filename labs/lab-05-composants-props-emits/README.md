# Lab 05 — Composants, props et emits

> **Outcome :** à la fin, tu sais écrire un composant Vue 3 avec `defineProps<T>()` typé, `defineEmits` tuple syntax (3.3+) et vérifier le tout avec `vue-tsc --noEmit`.
> **Vrai outil :** `vue-tsc --noEmit` (= `pnpm typecheck`) — le vérificateur de types officiel pour les SFC Vue 3.
> **Feedback :** zéro erreur `vue-tsc` = lab réussi. Le coach valide en session les choix d'architecture (qui possède la donnée ? pourquoi cet emit ?).

---

## Énoncé

Tu construis deux composants TribuZen liés par la relation parent/enfant :

- **`FamilyCard.vue`** (enfant) : affiche une famille, émet `select` et `leave`.
- **`FamilyList.vue`** (parent) : fournit les données à chaque carte, réagit aux emits.

### Contraintes techniques

- `FamilyCard` doit déclarer une prop `family: Family` (required) et une prop `highlighted?: boolean` (optionnelle, défaut `false`) via `withDefaults`.
- `FamilyCard` doit déclarer ses emits avec la **syntaxe tuple Vue 3.3+** : `defineEmits<{ select: [id: string]; leave: [familyId: string] }>()`.
- `FamilyList` ne passe jamais la liste par mutation — seul un emit + handler parent modifie l'état.
- `pnpm typecheck` doit passer en vert (zéro erreur) sur les deux fichiers.

### Structure cible

```
02-vue/
  src/
    types/
      family.ts            ← interface Family (à créer)
    components/
      family/
        FamilyCard.vue     ← Partie A (à écrire)
        FamilyList.vue     ← Partie B (à écrire)
```

---

## Étapes (en friction)

**Étape 1 — Déclarer l'interface `Family`**

Crée `src/types/family.ts` avec l'interface `Family` :
- `id: string`
- `name: string`
- `memberCount: number`
- `createdAt: string`

`export` l'interface — elle sera importée dans les deux composants.

Reflexion : pourquoi ne pas redéclarer l'interface dans chaque composant ? Que se passe-t-il si tu changes un champ ?

**Étape 2 — Écrire `FamilyCard.vue` (enfant)**

Crée `src/components/family/FamilyCard.vue` à partir d'une **page blanche** :

1. Importe `Family` depuis `../../types/family`.
2. Déclare l'interface `Props` avec `family: Family` et `highlighted?: boolean`.
3. Utilise `withDefaults(defineProps<Props>(), { highlighted: false })`.
4. Déclare les emits avec la **syntaxe tuple 3.3+**.
5. Écris deux handlers : `handleSelect()` qui émet `select` avec `props.family.id`, et `handleLeave()` qui émet `leave` avec le même id.
6. Template minimal : h3 (nom), p (memberCount membres), deux boutons.

Lance `pnpm typecheck` après chaque étape. Corrige les erreurs avant de passer à la suivante.

**Étape 3 — Écrire `FamilyList.vue` (parent)**

Crée `src/components/family/FamilyList.vue` :

1. Déclare `families = ref<Family[]>([...])` avec 2-3 familles en dur.
2. Déclare `selectedId = ref<string | null>(null)`.
3. Écris `onFamilySelected(id: string)` et `onFamilyLeft(familyId: string)`.
4. Dans le template : `v-for` sur `families`, passe `:family`, `:highlighted="family.id === selectedId"`, `@select`, `@leave`.

Question de réflexion : TypeScript t'aide-t-il à typer le paramètre des handlers ? Que se passe-t-il si tu déclares `onFamilySelected(id: number)` ?

**Étape 4 — Vérifier la réactivité des props**

Dans `FamilyCard.vue`, ajoute un `watchEffect` qui log `props.family.name`. Observe qu'il se déclenche quand le parent met à jour la liste.

Ensuite, teste la différence :
- `const { name } = props` puis `watchEffect(() => console.log(name))` — se redéclenche-t-il ?
- `const { name } = toRefs(props)` puis `watchEffect(() => console.log(name.value))` — différence ?
- En Vue 3.5 : `const { name } = defineProps<...>()` — comportement ?

**Étape 5 — Typer un emit inexistant (test négatif)**

Dans `FamilyCard.vue`, essaie d'ajouter `emit('unknown', 'x')`. Lis le message d'erreur TS. Comprends comment `defineEmits` protège le contrat de l'interface du composant.

---

## Corrigé complet commenté

### `src/types/family.ts`

```ts
// Interface partagée — définie une fois, importée partout
// Si un champ change (ex: memberCount → members), l'erreur TS pointe tous les usages
export interface Family {
  id: string
  name: string
  memberCount: number
  createdAt: string   // ISO 8601 : "2025-01-15"
}
```

### `src/components/family/FamilyCard.vue`

```vue
<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import type { Family } from '../../types/family'

// ─── Interface Props ──────────────────────────────────────────────────────────
// family est required (pas de ?) — le composant ne peut pas fonctionner sans elle
// highlighted est optional (?) — le parent peut ne pas la passer
interface Props {
  family: Family
  highlighted?: boolean
}

// withDefaults : highlighted prend false si le parent omet la prop
// TypeScript resserre le type : highlighted est boolean (plus boolean | undefined)
const props = withDefaults(defineProps<Props>(), {
  highlighted: false,
})

// ─── Emits — syntaxe Vue 3.3+ (named tuple) ──────────────────────────────────
// select: [id: string]  → l'utilisateur veut rejoindre la famille 'id'
// leave:  [familyId: string] → l'utilisateur veut quitter la famille 'familyId'
// TS Error si on émet avec un mauvais type : emit('select', 42) → erreur
const emit = defineEmits<{
  select: [id: string]
  leave:  [familyId: string]
}>()

// ─── État local ───────────────────────────────────────────────────────────────
// On ne mute JAMAIS props.highlighted directement
// isLocalHighlighted est un état INTERNE — déconnecté volontairement de la prop
// (dans un vrai composant, cet état local serait plutôt piloté par le parent)
const isLocalHighlighted = ref(props.highlighted)

// ─── Handlers ────────────────────────────────────────────────────────────────
// Les fonctions émettent — elles ne modifient pas l'état de la liste
// C'est le parent (FamilyList) qui décide de ce qui se passe après l'emit

function handleSelect(): void {
  // emit vérifie que props.family.id est bien string (garanti par l'interface Family)
  emit('select', props.family.id)
}

function handleLeave(): void {
  emit('leave', props.family.id)
}
</script>

<template>
  <!-- :class conditionnel sur highlighted — booléen garanti par withDefaults -->
  <div
    class="family-card"
    :class="{ 'family-card--highlighted': isLocalHighlighted }"
  >
    <!-- props.family est garanti Family (non null/undefined) par la déclaration required -->
    <h3 class="family-card__name">{{ props.family.name }}</h3>
    <p class="family-card__count">{{ props.family.memberCount }} membres</p>
    <p class="family-card__date">Depuis {{ props.family.createdAt }}</p>

    <div class="family-card__actions">
      <!-- @click → handler → emit → FamilyList réagit -->
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

### `src/components/family/FamilyList.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue'
import FamilyCard from './FamilyCard.vue'
import type { Family } from '../../types/family'

// ─── Source de vérité ─────────────────────────────────────────────────────────
// Le parent (FamilyList) POSSÈDE la liste — les enfants (FamilyCard) ne font que l'afficher
const families = ref<Family[]>([
  { id: 'f1', name: 'Les Dupont', memberCount: 4, createdAt: '2025-01-10' },
  { id: 'f2', name: 'Les Martin', memberCount: 2, createdAt: '2025-06-20' },
  { id: 'f3', name: 'Les Petit',  memberCount: 6, createdAt: '2024-11-05' },
])

// selectedId : quelle carte est mise en évidence
const selectedId = ref<string | null>(null)

// ─── Handlers d'emits ─────────────────────────────────────────────────────────
// TypeScript infère string depuis defineEmits<{ select: [id: string] }> de FamilyCard
// Si on déclarait onFamilySelected(id: number) → TS Error ici

function onFamilySelected(id: string): void {
  // La logique est ICI dans le parent — l'enfant ne connaît pas cette logique
  selectedId.value = id
  console.log('[FamilyList] famille sélectionnée :', id)
  // En production : appel API pour rejoindre la famille
}

function onFamilyLeft(familyId: string): void {
  // Le parent filtre la liste — l'enfant a juste signalé son intention via emit
  families.value = families.value.filter(f => f.id !== familyId)
  if (selectedId.value === familyId) {
    selectedId.value = null    // désélectionner si la famille quittée était sélectionnée
  }
}
</script>

<template>
  <section class="family-list">
    <h2>Familles disponibles ({{ families.length }})</h2>

    <!-- v-for : key sur l'id unique — Vue optimise le DOM diffing -->
    <FamilyCard
      v-for="family in families"
      :key="family.id"
      :family="family"
      :highlighted="family.id === selectedId"
      @select="onFamilySelected"
      @leave="onFamilyLeft"
    />

    <p v-if="families.length === 0" class="family-list__empty">
      Aucune famille disponible.
    </p>
  </section>
</template>
```

---

## Variante J+30 (fading)

**Même problème, contrainte ajoutée — 25 minutes, corrigé interdit.**

Étends `FamilyCard.vue` avec une prop `tags?: string[]` (liste de catégories : `['sport', 'culture']`). Valeur par défaut : tableau vide.

Ajoute un composant `TagBadge.vue` (enfant de FamilyCard) qui :
- Reçoit `label: string` et `color?: 'blue' | 'green' | 'gray'` (défaut : `'gray'`)
- N'émet rien — composant de présentation pur

Dans `FamilyCard`, utilise **le destructuring réactif Vue 3.5** (pas `withDefaults` pour `tags`) :
```ts
const { family, highlighted = false, tags = [] } = defineProps<Props>()
```

Vérification `pnpm typecheck` — zéro erreur attendu.

Question bonus : si `tags` était `{ label: string; color: string }[]`, que change-t-on dans `withDefaults` ?

---

## Application TribuZen

**Objectif :** porter `FamilyCard.vue` + `FamilyList.vue` dans le vrai repo `smaurier/tribuzen`.

1. Copie les deux fichiers dans `tribuzen/src/components/family/`.
2. Assure-toi que l'interface `Family` est dans `tribuzen/src/types/family.ts` et correspond à la réponse réelle de l'API (`/api/families`).
3. Branche `@select` sur un vrai call API (`await joinFamily(id)`).
4. Lance `pnpm typecheck` dans tribuzen — zéro erreur attendu.
5. Commit :
   ```bash
   git add src/components/family/ src/types/family.ts
   git commit -m "feat(family): FamilyCard + FamilyList — props typées, emits tuple 3.3+"
   ```

**Vérification de transfert :** `pnpm typecheck` vert + un click "Rejoindre" déclenche le vrai call API et met à jour `selectedId` dans `FamilyList`.
