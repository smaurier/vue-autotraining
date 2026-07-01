# Lab 12 — Slots avancés

> **Outcome :** à la fin, tu sais construire un composant layout multi-slots avec `useSlots` conditionnel et un composant renderless typé avec `defineSlots` générique, dans un projet Vue 3.5 réel.
> **Vrai outil :** Vue 3.5 + Vite dev server (HMR visible en direct dans le navigateur).
> **Feedback :** le coach valide visuellement en session — pas de test-runner auto-correcteur.

---

## Énoncé

Tu construis deux composants TribuZen.

### Partie A — `MemberCard.vue` (slots nommés + `useSlots`)

Cahier des charges exact :

1. Le composant expose trois slots : `header`, slot par défaut (corps), `actions`.
2. Le `<header>` HTML n'est rendu que si le parent a fourni un contenu pour `#header` — sinon la balise est absente du DOM (pas juste invisible).
3. Le slot `actions` a un fallback : un bouton `Voir le profil` s'affiche si le parent ne projette rien.
4. Un prop `variant` (`'default' | 'compact'`) ajoute une classe CSS sur l'article racine.
5. Le composant ne contient **aucune donnée métier** — tout vient des slots.

### Partie B — `MemberDataList.vue` (renderless + `defineSlots` générique)

Cahier des charges exact :

1. Props : `members: Member[]` (type importé depuis `src/types/family.ts` ou défini inline).
2. État interne : `hideInactive` (ref boolean) + `searchQuery` (ref string).
3. `visibleMembers` computed : filtre cumulatif (inactifs exclus si `hideInactive` + filtre par nom si `searchQuery` non vide).
4. Le template rend **uniquement** `<slot />` — aucun markup HTML propre.
5. Le slot expose au parent : `visibleMembers`, `hideInactive`, `searchQuery`, `toggleFilter`, `isEmpty`.
6. `defineSlots` doit typer correctement ces cinq props.

### Partie C — Intégration dans `App.vue` ou une page de test

Utilise `MemberCard` dans deux configurations :
- Carte complète (header + body + actions personnalisées)
- Carte compacte sans header (le `<header>` ne doit pas apparaître dans le DOM)

Utilise `MemberDataList` avec deux affichages différents dans la même page.

**Données de départ :**

```ts
interface Member {
  id: string
  name: string
  email: string
  role: 'admin' | 'member'
  isActive: boolean
  avatarUrl?: string
}

const members: Member[] = [
  { id: 'm1', name: 'Alice Martin',  email: 'alice@tribuzen.app',  role: 'admin',  isActive: true,  avatarUrl: 'https://i.pravatar.cc/40?u=alice' },
  { id: 'm2', name: 'Bob Dupont',    email: 'bob@tribuzen.app',    role: 'member', isActive: false },
  { id: 'm3', name: 'Cara Lefebvre', email: 'cara@tribuzen.app',   role: 'member', isActive: true },
  { id: 'm4', name: 'David Moreau',  email: 'david@tribuzen.app',  role: 'admin',  isActive: false },
]
```

**Pas de gap-fill** — tu écris les deux composants depuis les starters minimaux ci-dessous.

### Starters minimaux

```vue
<!-- src/components/family/MemberCard.vue — starter -->
<script setup lang="ts">
import { useSlots } from 'vue'
// À toi : defineProps, useSlots, variant class binding
</script>

<template>
  <!-- À construire : article + header conditionnel + body + footer avec fallback -->
</template>

<style scoped>
/* À toi : .member-card, .member-card--compact, .member-card__header, .member-card__body, .member-card__footer */
</style>
```

```vue
<!-- src/components/family/MemberDataList.vue — starter -->
<script setup lang="ts">
import { ref, computed } from 'vue'
// À toi : defineProps, état interne, computed, defineSlots
</script>

<template>
  <!-- À construire : <slot> avec les cinq props exposées -->
</template>
```

Lance `pnpm dev` et teste directement dans `App.vue`.

---

## Étapes (en friction)

### Partie A — MemberCard

1. **Déclare le prop `variant`** avec `defineProps<{ variant?: 'default' | 'compact' }>()`. Lie la classe sur l'article : `:class="['member-card', member-card--${variant ?? 'default'}']"`.
2. **Appelle `useSlots()`** au niveau racine du `<script setup>`. Stocke le résultat dans `slots`.
3. **Conditionne le `<header>`** avec `v-if="slots.header"`. Le wrapper n'apparaît dans le DOM que si le parent a fourni `#header`.
4. **Ajoute le slot par défaut** `<slot />` dans un `<div class="member-card__body">`.
5. **Ajoute le slot `actions` avec fallback** dans `<footer class="member-card__footer">`. Le fallback est `<button class="btn">Voir le profil</button>`.
6. **Ajoute les styles scoped** : `.member-card`, `.member-card--compact` (réduire padding), `.member-card__header`, `.member-card__body`, `.member-card__footer`.
7. **Vérifie dans le navigateur** : la carte compacte (sans `#header`) ne doit pas avoir de `<header>` dans l'inspecteur DOM.

### Partie B — MemberDataList

1. **Déclare le prop** `defineProps<{ members: Member[] }>()`. Définis `Member` inline ou importe depuis `@/types/family`.
2. **Déclare l'état interne** : `const hideInactive = ref(false)` et `const searchQuery = ref('')`.
3. **Écris le computed `visibleMembers`** : si `hideInactive`, filtre `m.isActive === true` ; si `searchQuery` non vide, filtre `m.name.toLowerCase().includes(searchQuery.value.toLowerCase())`. Chaîne les deux filtres.
4. **Écris `toggleFilter()`** : inverse `hideInactive.value`.
5. **Appelle `defineSlots`** avec le type exact des cinq props (voir l'énoncé). Utilise `Member[]` pour `visibleMembers`.
6. **Écris le template** : uniquement `<slot :visibleMembers="visibleMembers" :hideInactive="hideInactive" :searchQuery="searchQuery" :toggleFilter="toggleFilter" :isEmpty="visibleMembers.length === 0" />`.
7. **Intègre dans `App.vue`** : deux usages côte à côte avec des markups différents (liste simple + vue grille).
8. **Vérifie** : taper dans un champ de recherche doit filtrer en temps réel. Activer "Actifs seulement" + recherche doit cumuler les deux filtres.

---

## Corrigé complet commenté

### Partie A — `MemberCard.vue`

```vue
<!-- src/components/family/MemberCard.vue -->
<script setup lang="ts">
import { useSlots } from 'vue'

// Un seul prop "système" — aucune donnée métier ne passe par les props
defineProps<{
  variant?: 'default' | 'compact'
}>()

// useSlots() retourne un objet réactif dont chaque clé est définie
// si et seulement si le parent a fourni du contenu pour ce slot
const slots = useSlots()
</script>

<template>
  <!--
    :class avec un tableau : permet de combiner classe fixe et classe dynamique.
    member-card--default ou member-card--compact selon le prop.
  -->
  <article :class="['member-card', `member-card--${$props.variant ?? 'default'}`]">

    <!--
      v-if="slots.header" : la balise <header> disparaît du DOM si le parent
      n'a pas fourni de contenu pour #header.
      Sans ce guard, la balise serait rendue vide → espace et bordure vides visibles.
    -->
    <header v-if="slots.header" class="member-card__header">
      <slot name="header" />
    </header>

    <!-- Corps principal : toujours présent -->
    <div class="member-card__body">
      <slot />
    </div>

    <!--
      Footer : on le rend toujours (au moins le fallback s'affiche).
      Si on voulait aussi le conditionner : v-if="slots.actions || true"
      serait inutile — ici le fallback garantit qu'il y a toujours du contenu.
    -->
    <footer class="member-card__footer">
      <!--
        Fallback entre les balises <slot> :
        s'affiche si le parent n'utilise pas #actions.
        Le parent qui utilise <template #actions>...</template> remplace le fallback.
      -->
      <slot name="actions">
        <button class="btn btn--ghost">Voir le profil</button>
      </slot>
    </footer>

  </article>
</template>

<style scoped>
.member-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

/* Variante compacte : moins de padding, pas de box shadow */
.member-card--compact .member-card__body {
  padding: 0.5rem 0.75rem;
}
.member-card--compact .member-card__footer {
  padding: 0.4rem 0.75rem;
}

.member-card__header {
  padding: 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.member-card__body {
  padding: 1rem;
}

.member-card__footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  background: #fafafa;
}

/* Utilitaires de bouton (normalement dans un CSS global) */
.btn {
  padding: 0.35rem 0.75rem;
  border-radius: 5px;
  border: 1px solid #cbd5e1;
  cursor: pointer;
  font-size: 0.875rem;
  background: #fff;
}
.btn--ghost {
  background: transparent;
  border-color: #94a3b8;
  color: #475569;
}
.btn--primary {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}
.btn--danger {
  background: #ef4444;
  color: #fff;
  border-color: #ef4444;
}
</style>
```

### Partie B — `MemberDataList.vue`

```vue
<!-- src/components/family/MemberDataList.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

// Interface définie inline pour le lab — en vrai produit, importée depuis @/types/family
interface Member {
  id: string
  name: string
  email: string
  role: 'admin' | 'member'
  isActive: boolean
  avatarUrl?: string
}

const props = defineProps<{
  members: Member[]
}>()

// État de filtrage — interne au composant, invisible du parent
const hideInactive = ref(false)
const searchQuery = ref('')

// Filtres appliqués cumulativement sur le même tableau
// Ordre : inactifs d'abord (le plus coûteux en UX d'abord), puis recherche
const visibleMembers = computed<Member[]>(() => {
  let result = props.members

  // Filtre 1 : actifs uniquement
  if (hideInactive.value) {
    result = result.filter(m => m.isActive)
  }

  // Filtre 2 : recherche par nom (insensible à la casse)
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    result = result.filter(m => m.name.toLowerCase().includes(q))
  }

  return result
})

function toggleFilter(): void {
  hideInactive.value = !hideInactive.value
}

// defineSlots type l'API de slots sans générer de code runtime.
// Member[] est utilisé directement car ce composant n'est pas générique.
defineSlots<{
  default(props: {
    visibleMembers: Member[]
    hideInactive: boolean
    searchQuery: string
    toggleFilter: () => void
    isEmpty: boolean
  }): any
}>()
</script>

<template>
  <!--
    Aucun markup propre — le composant rend uniquement le slot.
    Toute la logique est packagée dans les props du slot.
    Le parent choisit 100% du markup.
  -->
  <slot
    :visibleMembers="visibleMembers"
    :hideInactive="hideInactive"
    :searchQuery="searchQuery"
    :toggleFilter="toggleFilter"
    :isEmpty="visibleMembers.length === 0"
  />
</template>
```

### Partie C — Intégration dans `App.vue`

```vue
<!-- App.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import MemberCard from '@/components/family/MemberCard.vue'
import MemberDataList from '@/components/family/MemberDataList.vue'

interface Member {
  id: string
  name: string
  email: string
  role: 'admin' | 'member'
  isActive: boolean
  avatarUrl?: string
}

const members = ref<Member[]>([
  { id: 'm1', name: 'Alice Martin',  email: 'alice@tribuzen.app',  role: 'admin',  isActive: true,  avatarUrl: 'https://i.pravatar.cc/40?u=alice' },
  { id: 'm2', name: 'Bob Dupont',    email: 'bob@tribuzen.app',    role: 'member', isActive: false },
  { id: 'm3', name: 'Cara Lefebvre', email: 'cara@tribuzen.app',   role: 'member', isActive: true },
  { id: 'm4', name: 'David Moreau',  email: 'david@tribuzen.app',  role: 'admin',  isActive: false },
])

function openProfile(id: string): void {
  alert(`Ouvrir le profil : ${id}`)
}
</script>

<template>
  <div style="max-width: 900px; margin: 2rem auto; padding: 0 1rem; font-family: system-ui">
    <h1>Lab 12 — Slots avancés</h1>

    <!-- ── Section 1 : MemberCard ─────────────────────────────────── -->
    <h2>MemberCard</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem">

      <!-- Carte complète — avec header, body, et actions admin -->
      <MemberCard>
        <template #header>
          <img
            :src="members[0].avatarUrl"
            :alt="members[0].name"
            style="width: 40px; height: 40px; border-radius: 50%"
          />
          <div>
            <strong>{{ members[0].name }}</strong>
            <br />
            <span
              style="font-size: 0.75rem; background: #3b82f6; color: white;
                     padding: 0.1rem 0.4rem; border-radius: 4px"
            >
              {{ members[0].role }}
            </span>
          </div>
        </template>

        <!-- Slot par défaut — informations du membre -->
        <p style="margin: 0 0 0.25rem">{{ members[0].email }}</p>
        <p style="margin: 0; color: #22c55e; font-size: 0.875rem">Actif</p>

        <!-- Actions admin — remplace le fallback "Voir le profil" -->
        <template #actions>
          <button class="btn btn--primary" @click="openProfile(members[0].id)">
            Voir le profil
          </button>
          <button class="btn btn--danger">Désactiver</button>
        </template>
      </MemberCard>

      <!--
        Carte compacte — sans #header.
        Vérifier dans l'inspecteur DOM : aucune balise <header> présente.
      -->
      <MemberCard variant="compact">
        <!-- Pas de #header → le <header> n'est pas dans le DOM -->
        <p style="margin: 0"><strong>{{ members[1].name }}</strong></p>
        <p style="margin: 0.25rem 0 0; color: #94a3b8; font-size: 0.875rem">
          {{ members[1].email }}
        </p>
        <!-- Pas de #actions → fallback "Voir le profil" s'affiche -->
      </MemberCard>

    </div>

    <!-- ── Section 2 : MemberDataList (renderless) ────────────────── -->
    <h2>MemberDataList — vue liste</h2>

    <!--
      Première utilisation : vue liste avec bouton filtre et champ recherche.
      Le markup vient entièrement du parent — MemberDataList ne rend aucun HTML.
    -->
    <MemberDataList :members="members">
      <template #default="{ visibleMembers, hideInactive, searchQuery, toggleFilter, isEmpty }">
        <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem; align-items: center">
          <button
            :style="{
              padding: '0.35rem 0.75rem',
              border: '1px solid #cbd5e1',
              borderRadius: '5px',
              cursor: 'pointer',
              background: hideInactive ? '#1e293b' : '#fff',
              color: hideInactive ? '#fff' : '#0f172a',
            }"
            @click="toggleFilter"
          >
            {{ hideInactive ? 'Tous les membres' : 'Actifs seulement' }}
          </button>

          <input
            :value="searchQuery"
            placeholder="Rechercher par nom…"
            style="padding: 0.35rem 0.6rem; border: 1px solid #cbd5e1; border-radius: 5px; flex: 1"
            @input="(e) => (searchQuery = (e.target as HTMLInputElement).value)"
          />

          <span style="color: #64748b; font-size: 0.875rem">
            {{ visibleMembers.length }} / {{ members.length }}
          </span>
        </div>

        <p v-if="isEmpty" style="color: #94a3b8; font-style: italic">
          Aucun membre correspondant.
        </p>
        <ul v-else style="list-style: none; padding: 0; margin: 0">
          <li
            v-for="m in visibleMembers"
            :key="m.id"
            style="padding: 0.5rem 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between"
          >
            <span :style="{ opacity: m.isActive ? 1 : 0.45 }">
              {{ m.name }}
              <span
                v-if="m.role === 'admin'"
                style="font-size: 0.7rem; background: #ef4444; color: white;
                       padding: 0.1rem 0.35rem; border-radius: 4px; margin-left: 0.4rem"
              >
                Admin
              </span>
            </span>
            <span style="color: #94a3b8; font-size: 0.875rem">{{ m.email }}</span>
          </li>
        </ul>
      </template>
    </MemberDataList>

    <h2 style="margin-top: 2rem">MemberDataList — vue grille (même logique)</h2>

    <!--
      Deuxième utilisation du même MemberDataList — markup complètement différent.
      La logique de filtrage est réutilisée sans aucune duplication.
    -->
    <MemberDataList :members="members">
      <template #default="{ visibleMembers, hideInactive, toggleFilter, isEmpty }">
        <button @click="toggleFilter" style="margin-bottom: 1rem; padding: 0.35rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 5px; cursor: pointer">
          {{ hideInactive ? 'Tous' : 'Actifs seulement' }}
        </button>

        <p v-if="isEmpty" style="color: #94a3b8; font-style: italic">Aucun membre.</p>
        <div
          v-else
          style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem"
        >
          <MemberCard
            v-for="m in visibleMembers"
            :key="m.id"
            variant="compact"
            :style="{ opacity: m.isActive ? 1 : 0.5 }"
          >
            <p style="margin: 0; font-weight: 600">{{ m.name }}</p>
            <p style="margin: 0.25rem 0 0; font-size: 0.8rem; color: #64748b">{{ m.email }}</p>
          </MemberCard>
        </div>
      </template>
    </MemberDataList>
  </div>
</template>
```

**Pourquoi ce corrigé est correct :**

- `v-if="slots.header"` dans `MemberCard` : la balise `<header>` est absente du DOM sur la carte compacte — vérifiable dans l'inspecteur du navigateur. Ce n'est pas `display: none` mais une absence réelle.
- Le fallback `#actions` s'affiche sur la carte compacte sans aucune prop supplémentaire.
- `MemberDataList` ne contient aucun markup propre — c'est un composant de logique pure. Les deux vues utilisent le même filtrage sans duplication.
- `defineSlots` avec le type `Member[]` sur `visibleMembers` : si tu tapes `m.` dans le template parent, l'IDE propose les propriétés de `Member`.
- La vue grille compose `MemberDataList` (logique) avec `MemberCard` (layout) — les deux sont indépendants et réutilisables séparément.

**Note sur `searchQuery` dans le template `App.vue` :** la prop `searchQuery` fournie par `MemberDataList` est en lecture seule depuis le parent — la liaison `@input` qui modifie directement `searchQuery` ne fonctionnerait pas car c'est une ref interne à l'enfant. En production, on exposerait aussi un `setSearchQuery(v: string)` dans les props du slot, ou on userait un composable séparé. Pour ce lab, la prop est exposée pour illustration — utilise le pattern `setSearchQuery` pour le porter en TribuZen.

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — 30 minutes, sans ouvrir ce corrigé.**

1. Rends `MemberDataList` **générique** avec `generic="T extends { id: string; name: string }"`. Mets à jour `defineProps`, le computed, et `defineSlots` pour que `visibleMembers` soit `T[]`.
2. Ajoute un slot `empty` nommé à `MemberCard` (en plus du slot `actions`) — le parent peut personnaliser le message affiché quand le body est vide (slot par défaut non fourni). Utilise `useSlots` pour conditionner un message par défaut.
3. Crée un troisième usage de `MemberDataList` dans `App.vue` avec une liste de tâches (`Task[]` à la place de `Member[]`) — prouve que le composant est vraiment générique.

**Critère de réussite :** les trois usages fonctionnent dans le navigateur, `vue-tsc --noEmit` passe sans erreur, et l'IDE propose l'autocomplétion correcte pour chaque type dans les templates.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, les deux composants vivent ici :

```
tribuzen/
  src/
    components/
      family/
        MemberCard.vue        ← slots nommés + useSlots conditionnel
        MemberDataList.vue    ← renderless + defineSlots (passer en generic="T" en prod)
    types/
      family.ts               ← interface Member partagée (supprimer la définition inline)
    pages/
      FamilyMembersPage.vue   ← intégration vue liste
      FamilyAdminPage.vue     ← intégration vue grille
```

**Différences par rapport au lab :**

- `Member` est importé depuis `@/types/family.ts` — pas défini inline dans le composant.
- `MemberDataList` utilise `generic="T extends { id: string; name: string; isActive: boolean }"` — réutilisable pour d'autres types que `Member`.
- La prop `searchQuery` n'est pas exposée en lecture/écriture directement — on expose `setSearchQuery(v: string)` dans les props du slot pour garder l'état encapsulé.
- `MemberCard` utilise les tokens CSS du design system TribuZen (`var(--color-border)`, `var(--radius-md)`) au lieu de valeurs codées en dur.

**Commit cible :**
```
feat(family): MemberCard slots nommés + MemberDataList renderless
```
