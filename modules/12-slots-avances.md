---
titre: Slots avancés
cours: 02-vue
notions: [slot par défaut, slots nommés, slots avec portée scoped slots, valeur de repli fallback, slots typés avec defineSlots, pattern renderless component, accès programmatique via useSlots, composition de composants par slots]
outcomes:
  - sait exposer des points d'extension avec slots nommés et valeur de repli
  - sait remonter des données au parent via un scoped slot
  - sait typer ses slots avec defineSlots pour une API de composant sûre
  - sait construire un composant renderless (logique sans markup imposé)
prerequis: [11-formulaires-et-validation]
next: 13-transitions-et-animations
libs: [{ name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — composants layout réutilisables par slots (Card avec header/body/footer, DataList renderless pour la liste des membres)
last-reviewed: 2026-07
---

# Slots avancés

> **Outcomes — tu sauras FAIRE :** exposer des points d'extension nommés avec valeur de repli, remonter des données de l'enfant vers le parent via un scoped slot, typer une API de composant avec `defineSlots`, construire un composant renderless.
> **Difficulté :** :star::star::star:
>
> **Portée :** ce module couvre les mécanismes de composition par slots. La communication parent→enfant (props) et enfant→parent (emits) est vue au **module 05**. Les composables (alternative au renderless pour la logique pure) sont au **module 09**.
>
> **Précédent :** [11 — Formulaires et validation](./11-formulaires-et-validation.md)

---

## 1. Cas concret d'abord

Tu rejoins TribuZen. La tâche : construire `MemberCard.vue`, une carte réutilisable affichant un membre de la tribu. Le design varie selon le contexte — en dashboard, la carte a un header avec avatar et badge de rôle, un body avec les informations, et des actions différentes selon que l'utilisateur est admin ou simple membre.

Si tu passes tout via des props (`headerContent`, `bodyContent`, `actionsContent`), tu te retrouves à passer du HTML comme string ou à multiplier les props booléennes pour chaque variante. C'est le signal que **le problème n'est pas un problème de données — c'est un problème de contenu**.

La solution : des **slots nommés**. Tu déclares des points d'extension dans `MemberCard.vue` (header, default, actions), et chaque parent qui utilise la carte décide ce qu'il met dedans. Le composant ne sait rien du contenu — il ne gère que le conteneur et le style.

```vue
<!-- MemberCard.vue — ce que tu veux obtenir -->
<template>
  <article class="member-card">
    <header class="member-card__header">
      <slot name="header">
        <!-- Fallback si le parent ne fournit pas de header -->
        <span class="member-card__avatar-placeholder"></span>
      </slot>
    </header>

    <div class="member-card__body">
      <slot />
    </div>

    <footer class="member-card__actions">
      <slot name="actions" />
    </footer>
  </article>
</template>
```

```vue
<!-- Dashboard.vue — le parent contrôle tout le contenu -->
<MemberCard>
  <template #header>
    <img :src="member.avatarUrl" :alt="member.name" />
    <span class="badge">{{ member.role }}</span>
  </template>

  <p>{{ member.name }}</p>
  <p class="text-muted">{{ member.email }}</p>

  <template #actions>
    <button @click="openProfile(member.id)">Voir profil</button>
  </template>
</MemberCard>
```

Ce module te donne les outils pour construire cela proprement — et pour aller plus loin avec les scoped slots, `defineSlots`, et le pattern renderless.

---

## 2. Théorie complète, concise

### 2.1 Slot par défaut

Le slot par défaut est la zone de projection la plus simple. Tout ce que le parent place entre les balises ouvrante et fermante du composant enfant est projeté à la position du `<slot>`.

```vue
<!-- Button.vue -->
<template>
  <button class="btn">
    <slot />
  </button>
</template>
```

```vue
<!-- Parent -->
<Button>Enregistrer</Button>
<!-- Rendu : <button class="btn">Enregistrer</button> -->
```

`<slot />` et `<slot></slot>` sont équivalents. La forme auto-fermante est idiomatique quand il n'y a pas de fallback.

### 2.2 Valeur de repli (fallback)

Un slot peut définir un contenu par défaut affiché si le parent ne projette rien. Ce contenu est écrit **entre les balises `<slot>` dans le composant enfant**.

```vue
<!-- Button.vue avec fallback -->
<template>
  <button class="btn">
    <slot>Cliquer</slot>
  </button>
</template>
```

```vue
<!-- Parent -->
<Button />              <!-- Affiche "Cliquer" (fallback) -->
<Button>Valider</Button> <!-- Affiche "Valider" (contenu parent) -->
```

Le fallback est évalué dans la portée de l'enfant — il peut utiliser des données du composant enfant.

### 2.3 Slots nommés

Un composant peut exposer **plusieurs points d'extension** en nommant ses slots avec `name`. Le slot sans `name` est le slot par défaut (nom implicite `"default"`).

**Dans le composant enfant** — déclarer les slots avec `name` :

```vue
<!-- Card.vue -->
<template>
  <article class="card">
    <header class="card__header">
      <slot name="header" />
    </header>

    <div class="card__body">
      <slot />
    </div>

    <footer class="card__footer">
      <slot name="footer">
        <!-- Fallback footer -->
        <button class="btn-close">Fermer</button>
      </slot>
    </footer>
  </article>
</template>
```

**Dans le parent** — cibler les slots avec `#name` (raccourci de `v-slot:name`) :

```vue
<!-- Parent -->
<Card>
  <template #header>
    <h2>Titre de la carte</h2>
  </template>

  <!-- Contenu sans #name → slot par défaut -->
  <p>Corps de la carte</p>

  <template #footer>
    <button @click="save">Sauvegarder</button>
    <button @click="cancel">Annuler</button>
  </template>
</Card>
```

`#header` est le raccourci de `v-slot:header`. Les deux formes sont équivalentes — utiliser `#` en pratique.

**Règle :** un `<template #name>` peut cibler n'importe quel slot nommé. Le contenu sans `<template>` va toujours au slot par défaut.

### 2.4 Scoped slots — remonter des données vers le parent

Par défaut, les données de l'enfant ne sont pas accessibles dans le contenu projeté par le parent. Les **scoped slots** renversent ce flux : l'enfant expose des données sur le `<slot>`, et le parent les consomme.

**Dans l'enfant** — passer des données sur le slot comme des attributs :

```vue
<!-- MemberList.vue -->
<script setup lang="ts">
defineProps<{ members: Member[] }>()
</script>

<template>
  <ul>
    <li v-for="member in members" :key="member.id">
      <!-- Expose member et index au parent via le slot -->
      <slot :member="member" :index="index" />
    </li>
  </ul>
</template>
```

**Dans le parent** — récupérer les données avec la syntaxe `#slotName="slotProps"` :

```vue
<!-- Parent -->
<MemberList :members="familyMembers">
  <template #default="{ member, index }">
    <span>{{ index + 1 }}. {{ member.name }}</span>
    <span v-if="member.isAdmin" class="badge">Admin</span>
  </template>
</MemberList>
```

`{ member, index }` est du destructuring JavaScript standard — on peut aussi écrire `#default="slotProps"` et accéder à `slotProps.member`.

**Pour un slot nommé avec scoped props** — la syntaxe combine `#name` et `="{ ... }"` :

```vue
<template #header="{ title, subtitle }">
  <h2>{{ title }}</h2>
  <p>{{ subtitle }}</p>
</template>
```

### 2.5 `defineSlots` — typer les slots pour une API sûre

`defineSlots` est une macro compilateur (stable depuis Vue 3.3) qui définit la signature TypeScript des slots d'un composant. Elle ne génère aucun code runtime — c'est uniquement pour le typage et l'autocomplétion.

```vue
<!-- DataList.vue — slot typé avec generic -->
<script setup lang="ts" generic="T">
defineProps<{ items: T[] }>()

defineSlots<{
  // Le slot "default" reçoit { item: T, index: number }
  // Le type de retour "any" est requis par la macro
  default(props: { item: T; index: number }): any
  // Slot nommé "empty" — aucune prop
  empty(): any
}>()
</script>

<template>
  <ul v-if="items.length > 0">
    <li v-for="(item, index) in items" :key="index">
      <slot :item="item" :index="index" />
    </li>
  </ul>
  <slot v-else name="empty">
    <p class="empty">Aucun élément.</p>
  </slot>
</template>
```

Avec ce typage, quand le parent utilise `DataList<Member>`, l'IDE sait que `item` est de type `Member` dans le scoped slot.

**`generic="T"`** déclare un paramètre de type générique sur le composant entier — `T` est résolu au moment de l'utilisation. La contrainte `generic="T extends { id: string }"` est possible pour restreindre les types acceptés.

### 2.6 Pattern renderless component

Un composant renderless expose de la logique via un scoped slot sans imposer aucun markup. Il rend uniquement le contenu du slot, laissant le parent contrôler intégralement la présentation.

```vue
<!-- UseList.vue — composant renderless -->
<script setup lang="ts" generic="T">
import { ref, computed } from 'vue'

const props = defineProps<{
  items: T[]
  filterFn?: (item: T) => boolean
}>()

const searchQuery = ref('')
const isFiltering = ref(false)

const visibleItems = computed(() => {
  if (!isFiltering.value || !props.filterFn) return props.items
  return props.items.filter(props.filterFn)
})

function toggleFilter() {
  isFiltering.value = !isFiltering.value
}

defineSlots<{
  default(props: {
    visibleItems: T[]
    searchQuery: string
    isFiltering: boolean
    toggleFilter: () => void
  }): any
}>()
</script>

<template>
  <!-- Aucun wrapper HTML : on rend directement le slot -->
  <slot
    :visibleItems="visibleItems"
    :searchQuery="searchQuery"
    :isFiltering="isFiltering"
    :toggleFilter="toggleFilter"
  />
</template>
```

Le parent reçoit la logique complète et l'applique à n'importe quel markup :

```vue
<!-- Parent — markup libre, logique fournie par UseList -->
<UseList :items="members" :filterFn="m => m.isActive">
  <template #default="{ visibleItems, isFiltering, toggleFilter }">
    <button @click="toggleFilter">
      {{ isFiltering ? 'Tous les membres' : 'Actifs seulement' }}
    </button>
    <ul>
      <li v-for="m in visibleItems" :key="m.id">{{ m.name }}</li>
    </ul>
  </template>
</UseList>
```

> **Note :** aujourd'hui, un composable (`useList()`) remplirait le même rôle avec moins de cérémonie. Le pattern renderless reste utile quand la logique doit être encapsulée dans l'arbre de composants (accès au cycle de vie, provide/inject) ou pour de la compatibilité avec du code qui n'utilise pas la Composition API.

### 2.7 Accès programmatique avec `useSlots`

`useSlots()` retourne un objet contenant les fonctions de rendu de chaque slot fourni par le parent. C'est utile pour **conditionner l'affichage d'un wrapper** selon que le slot est rempli ou non.

```vue
<!-- Card.vue — wrapper conditionnel selon la présence du slot -->
<script setup lang="ts">
import { useSlots } from 'vue'

const slots = useSlots()
// slots.header est une fonction si le parent a fourni ce slot, undefined sinon
</script>

<template>
  <article class="card">
    <!-- N'affiche le <header> HTML que si le parent fournit du contenu -->
    <header v-if="slots.header" class="card__header">
      <slot name="header" />
    </header>

    <div class="card__body">
      <slot />
    </div>

    <!-- Footer conditionnel : balise HTML absente du DOM si slot vide -->
    <footer v-if="slots.footer" class="card__footer">
      <slot name="footer" />
    </footer>
  </article>
</template>
```

Sans `useSlots`, le `<header>` serait rendu même vide, produisant un espace inutile dans le DOM. Avec `v-if="slots.header"`, la balise entière disparaît si aucun contenu n'est projeté.

`useSlots()` doit être appelé dans `<script setup>` ou dans `setup()` — pas dans un callback ou un lifecycle hook.

---

## 3. Worked examples

### Exemple 1 — `MemberCard.vue` multi-slots avec `useSlots` (TribuZen)

Composant de carte complète avec trois zones, wrapper conditionnel et fallback sur les actions.

```vue
<!-- MemberCard.vue -->
<script setup lang="ts">
import { useSlots } from 'vue'

// Aucune prop de contenu — tout passe par les slots
defineProps<{
  variant?: 'default' | 'compact'
}>()

const slots = useSlots()
</script>

<template>
  <article :class="['member-card', `member-card--${variant ?? 'default'}`]">
    <!-- Header rendu uniquement si le parent l'a rempli -->
    <header v-if="slots.header" class="member-card__header">
      <slot name="header" />
    </header>

    <!-- Corps principal — toujours présent -->
    <div class="member-card__body">
      <slot />
    </div>

    <!-- Footer avec fallback : bouton par défaut si le parent ne met rien -->
    <footer class="member-card__footer">
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
}
.member-card__header {
  padding: 1rem;
  background: #f8fafc;
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
}
</style>
```

**Utilisation dans `FamilyPage.vue` — vue admin :**

```vue
<!-- FamilyPage.vue -->
<script setup lang="ts">
import MemberCard from '@/components/family/MemberCard.vue'
import type { Member } from '@/types/family'

const member: Member = {
  id: 'm1',
  name: 'Alice Martin',
  email: 'alice@tribuzen.app',
  role: 'admin',
  avatarUrl: '/avatars/alice.jpg',
  isActive: true,
}

function openProfile(id: string) {
  console.log('ouvrir profil', id)
}
</script>

<template>
  <!-- Avec header personnalisé et actions admin -->
  <MemberCard>
    <template #header>
      <img :src="member.avatarUrl" :alt="member.name" class="avatar" />
      <div>
        <strong>{{ member.name }}</strong>
        <span class="badge badge--admin">{{ member.role }}</span>
      </div>
    </template>

    <!-- Slot par défaut — informations principales -->
    <p class="member-email">{{ member.email }}</p>
    <p :class="['member-status', member.isActive ? 'active' : 'inactive']">
      {{ member.isActive ? 'Actif' : 'Inactif' }}
    </p>

    <!-- Actions admin : remplace le fallback "Voir le profil" -->
    <template #actions>
      <button @click="openProfile(member.id)" class="btn btn--primary">
        Voir le profil
      </button>
      <button class="btn btn--ghost">Modifier</button>
      <button class="btn btn--danger">Désactiver</button>
    </template>
  </MemberCard>

  <!-- Vue compacte sans header ni actions (fallback s'affiche) -->
  <MemberCard variant="compact">
    <p>{{ member.name }} — {{ member.email }}</p>
  </MemberCard>
</template>
```

**Ce que ce code illustre :**
- `v-if="slots.header"` : le `<header>` DOM est absent quand le parent ne fournit rien — pas juste invisible, vraiment absent.
- Le slot `actions` a un fallback — la version compacte n'a pas besoin de `<template #actions>`, elle obtient "Voir le profil" gratuitement.
- Le prop `variant` contrôle le style du conteneur — les slots contrôlent le contenu. Les deux axes sont indépendants.

---

### Exemple 2 — `MemberDataList.vue` renderless (logique de filtre réutilisable)

Composant renderless qui encapsule la logique de filtrage d'une liste de membres et laisse le parent choisir le markup.

```vue
<!-- MemberDataList.vue — renderless, logique seule -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Member } from '@/types/family'

const props = defineProps<{
  members: Member[]
}>()

// État interne — invisible pour le parent
const hideInactive = ref(false)
const searchQuery = ref('')

// Logique de filtrage composée
const visibleMembers = computed(() => {
  let result = props.members
  if (hideInactive.value) {
    result = result.filter(m => m.isActive)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(m => m.name.toLowerCase().includes(q))
  }
  return result
})

function toggleFilter() {
  hideInactive.value = !hideInactive.value
}

defineSlots<{
  default(props: {
    visibleMembers: Member[]
    searchQuery: string
    hideInactive: boolean
    toggleFilter: () => void
    isEmpty: boolean
  }): any
}>()
</script>

<template>
  <!-- Aucun markup — tout le HTML vient du parent -->
  <slot
    :visibleMembers="visibleMembers"
    :searchQuery="searchQuery"
    :hideInactive="hideInactive"
    :toggleFilter="toggleFilter"
    :isEmpty="visibleMembers.length === 0"
  />
</template>
```

**Utilisation — deux vues différentes, même logique :**

```vue
<!-- VueListeSimple.vue -->
<MemberDataList :members="familyMembers">
  <template #default="{ visibleMembers, hideInactive, toggleFilter, isEmpty }">
    <button @click="toggleFilter">
      {{ hideInactive ? 'Tous les membres' : 'Actifs seulement' }}
    </button>

    <p v-if="isEmpty" class="empty">Aucun membre correspondant.</p>
    <ul v-else>
      <li v-for="m in visibleMembers" :key="m.id">{{ m.name }}</li>
    </ul>
  </template>
</MemberDataList>
```

```vue
<!-- VueGrilleCartes.vue — même logique, markup radicalement différent -->
<MemberDataList :members="familyMembers">
  <template #default="{ visibleMembers, isEmpty }">
    <div v-if="isEmpty" class="empty-grid">Aucun membre.</div>
    <div v-else class="member-grid">
      <MemberCard v-for="m in visibleMembers" :key="m.id">
        <p>{{ m.name }}</p>
      </MemberCard>
    </div>
  </template>
</MemberDataList>
```

**Ce que cet exemple illustre :** la logique de filtre est écrite une seule fois dans `MemberDataList`. Les deux vues n'ont pas à se soucier de la réactivité ou du calcul — elles reçoivent `visibleMembers` prêt à l'emploi.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Confondre props et slots pour le contenu structurel

```vue
<!-- ❌ Props pour passer du HTML — anti-pattern -->
<Card
  title="Alice Martin"
  :header-icon="'user-circle'"
  :show-admin-badge="member.isAdmin"
/>
<!-- Le composant doit gérer chaque variation dans son template -->

<!-- ✅ Slot nommé — le parent décide du contenu, l'enfant du conteneur -->
<Card>
  <template #header>
    <UserCircleIcon />
    <span>Alice Martin</span>
    <AdminBadge v-if="member.isAdmin" />
  </template>
</Card>
```

**Règle :** si une prop transporte du contenu qui va directement dans le template (texte riche, composants imbriqués, markup variable selon le contexte), c'est presque toujours un slot. Les props transportent des **données** (strings scalaires, nombres, booléens, objets métier). Les slots transportent du **contenu et du markup**.

### PIÈGE #2 — Oublier le fallback sur un slot critique

```vue
<!-- ❌ Slot sans fallback — rendu vide si le parent oublie -->
<footer class="card__footer">
  <slot name="actions" />
</footer>
<!-- Si le parent n'utilise pas #actions, le footer est rendu vide mais visible -->

<!-- ✅ Deux options selon le cas d'usage -->

<!-- Option A : fallback visible (bouton par défaut) -->
<footer class="card__footer">
  <slot name="actions">
    <button>Voir le profil</button>
  </slot>
</footer>

<!-- Option B : supprimer le wrapper si le slot est vide (useSlots) -->
<footer v-if="slots.actions" class="card__footer">
  <slot name="actions" />
</footer>
```

Choisir en fonction du comportement attendu : le fallback convient quand une action par défaut a du sens ; `useSlots` + `v-if` convient quand le wrapper vide est visuellement incorrect.

### PIÈGE #3 — Scoped slot mal typé (générique non propagé)

```ts
// ❌ defineSlots sans generic — item est any, pas d'autocomplétion
defineSlots<{
  default(props: { item: any }): any
}>()

// ❌ generic déclaré mais pas utilisé dans defineSlots
// <script setup lang="ts" generic="T">
defineSlots<{
  default(props: { item: string }): any // T est ignoré !
}>()

// ✅ generic proprement connecté aux props ET aux slots
// <script setup lang="ts" generic="T">
defineProps<{ items: T[] }>()
defineSlots<{
  default(props: { item: T; index: number }): any
}>()
```

Si le composant est `generic="T"` mais que `defineSlots` utilise `any` ou un type fixe, l'inférence du parent est perdue. L'IDE proposera `any` au lieu des propriétés réelles de `T`.

### PIÈGE #4 — `useSlots` appelé hors du contexte de setup

```ts
// ❌ useSlots() dans un lifecycle hook — erreur runtime
onMounted(() => {
  const slots = useSlots() // Warning: [Vue warn] getCurrentInstance is null
})

// ❌ useSlots() dans un callback asynchrone
async function load() {
  const slots = useSlots() // même problème
}

// ✅ useSlots() au niveau racine de <script setup> ou setup()
const slots = useSlots() // résultat réactif, utilisable partout dans le template
```

`useSlots()` est un composable Vue — comme tous les composables, il doit être appelé de façon synchrone dans le contexte de setup. La valeur retournée est réactive et peut être utilisée dans `computed` ou le template.

### PIÈGE #5 — Portée des données dans le contenu projeté

```vue
<!-- ❌ Tentative d'accéder aux données de l'enfant depuis le parent sans scoped slot -->
<MemberList :members="members">
  <!-- member n'est PAS disponible ici — c'est la portée du parent -->
  <template #default>
    {{ member.name }}  <!-- undefined -->
  </template>
</MemberList>

<!-- ✅ Les données de l'enfant arrivent via les props du slot -->
<MemberList :members="members">
  <template #default="{ member }">
    {{ member.name }}  <!-- ✅ member remontée par l'enfant via :member="member" -->
  </template>
</MemberList>
```

**Règle mémo :** le contenu d'un slot est **compilé dans la portée du parent**. Seules les variables exposées explicitement par l'enfant via les props du slot (`<slot :member="member">`) sont accessibles dans `#default="{ member }"`.

---

## 5. Ancrage TribuZen

### `MemberCard.vue` — composant layout central (Exemple 1)

`MemberCard` est utilisé dans trois contextes dans TribuZen :

1. **`FamilyDashboard.vue`** — carte complète avec avatar, badge de rôle, et actions admin/membre selon le contexte d'authentification.
2. **`SearchResults.vue`** — vue compacte sans header, slot par défaut seulement (nom + email), fallback sur `#actions`.
3. **`InvitationFlow.vue`** — carte sans footer (`v-if="slots.actions"` le supprime), body avec formulaire d'invitation inline.

Le même composant sert les trois usages sans aucune prop conditionnelle — les slots absorbent la variabilité.

```
tribuzen/
  src/
    components/
      family/
        MemberCard.vue        ← Exemple 1 — slots nommés + useSlots
        MemberDataList.vue    ← Exemple 2 — renderless + defineSlots générique
      shared/
        DataList.vue          ← Générique T, slot typé, réutilisé dans toute l'app
```

### `MemberDataList.vue` — renderless pour la liste des membres (Exemple 2)

La logique de filtrage (actifs/inactifs, recherche par nom) est factorisée dans `MemberDataList.vue`. La page `FamilyMembersPage.vue` utilise la vue grille, la page `FamilyAdminPage.vue` utilise la vue liste avec cases à cocher — même logique, deux markups radicalement différents, zéro duplication.

**Commit cible dans `smaurier/tribuzen` :**
```
feat(family): MemberCard slots nommés + MemberDataList renderless
```

---

## 6. Points clés

1. Le slot par défaut projette le contenu parent à la position `<slot />` dans l'enfant.
2. Le fallback (`<slot>contenu par défaut</slot>`) s'affiche si et seulement si le parent ne fournit aucun contenu pour ce slot.
3. Les slots nommés s'exposent avec `name="..."` dans l'enfant et se ciblent avec `#name` dans le parent.
4. `#header` est le raccourci de `v-slot:header` — toujours préférer `#`.
5. Un scoped slot expose des données de l'enfant vers le parent via les attributs du `<slot>` (`<slot :item="item" />`), récupérés avec `#default="{ item }"`.
6. `defineSlots<{...}>()` type les slots sans générer de code runtime — indispensable avec `generic="T"` pour l'autocomplétion.
7. Un composant renderless rend uniquement `<slot ... />` — aucun markup HTML propre — et passe toute sa logique au parent via les props du slot.
8. `useSlots()` retourne un objet réactif dont chaque clé est définie si le parent a fourni ce slot — utile pour les wrappers conditionnels (`v-if="slots.header"`).

---

## 7. Seeds Anki

```
Quelle est la différence entre un slot par défaut et un slot nommé ?|Le slot par défaut (name implicite "default") reçoit le contenu placé directement entre les balises du composant. Un slot nommé (<slot name="header" />) est ciblé par le parent avec <template #header>. Un composant peut avoir plusieurs slots nommés mais un seul slot par défaut.
Comment écrire un fallback pour un slot nommé "actions" ?|<slot name="actions"><button>Action par défaut</button></slot>. Le contenu entre les balises slot s'affiche si et seulement si le parent ne fournit pas de contenu pour ce slot.
Quelle syntaxe le parent utilise-t-il pour passer du contenu au slot "header" ?|<template #header>...</template> (raccourci de <template v-slot:header>). Le contenu sans <template> va au slot par défaut.
Comment remonter la donnée "item" de l'enfant vers le parent dans un scoped slot ?|Dans l'enfant : <slot :item="item" />. Dans le parent : <template #default="{ item }">{{ item.name }}</template>. Les props du slot sont extraites par destructuring.
À quoi sert defineSlots<{...}>() et quand est-il indispensable ?|defineSlots type l'API de slots d'un composant sans générer de code runtime. Il est indispensable avec generic="T" pour que l'IDE infère le vrai type de T dans les props du slot côté parent (autocomplétion correcte).
Qu'est-ce qu'un composant renderless et pourquoi s'y intéresser ?|Un composant renderless ne rend aucun markup propre — son template est uniquement <slot :data="data" :fn="fn" />. Il encapsule de la logique réactive et la délègue au parent via les props du slot. Utile quand la même logique doit s'appliquer à des markups radicalement différents.
Comment conditionner l'affichage d'un wrapper selon qu'un slot est rempli ou non ?|Avec useSlots() dans <script setup> : const slots = useSlots(). Puis v-if="slots.header" sur le wrapper. Si le parent n'a pas fourni de contenu pour #header, slots.header est undefined et le wrapper disparaît du DOM.
Quelle est la règle de portée du contenu projeté dans un slot ?|Le contenu projeté est compilé dans la portée du parent. Les données de l'enfant ne sont pas accessibles directement — uniquement celles exposées par le slot via ses props (<slot :item="item">). Le parent accède à item via #default="{ item }", pas autrement.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-12-slots-avances/README.md`. Construire `MemberCard.vue` avec trois slots nommés, `useSlots` conditionnel, et un composant renderless `MemberDataList.vue` avec `defineSlots` générique — corrigé commenté intégral.

← [11 — Formulaires et validation](./11-formulaires-et-validation.md) | [13 — Transitions et animations](./13-transitions-et-animations.md) →
