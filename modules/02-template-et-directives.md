---
titre: Template et directives
cours: 02-vue
notions: [interpolation moustache, v-bind et raccourci deux-points, v-if vs v-show, v-for et clé key, v-for sur objet, directives built-in, v-html, v-once, v-pre, liaison de classe et style, modificateurs de directive]
outcomes:
  - sait afficher des données réactives dans le template (interpolation, v-bind)
  - sait rendre conditionnellement (v-if/v-else vs v-show) et choisir le bon
  - sait boucler avec v-for en fournissant une key stable, et connaît le piège de l'index
  - sait lier classes et styles dynamiquement (objet, tableau)
prerequis: [01-environnement-et-premier-composant]
next: 03-reactivite
libs: [{ name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — rendu de la liste des membres/posts d'une famille (v-for + key), états conditionnels (v-if empty state)
last-reviewed: 2026-07
---

# Template et directives

> **Outcomes — tu sauras FAIRE :** afficher des données réactives (interpolation, `v-bind`), conditionner le rendu (`v-if`/`v-else` vs `v-show`) et choisir le bon outil, boucler avec `v-for` en fournissant une `key` stable, lier classes et styles dynamiquement.
> **Difficulté :** :star::star:
>
> **Portée :** ce module couvre la **syntaxe du template Vue 3** — tout ce qui vit dans `<template>`. L'interpolation <code v-pre>{{ }}</code> a été présentée en survol au **module 01** ; ici elle est disséquée. `v-model` (liaison bidirectionnelle) est introduit brièvement dans ce module mais disséqué avec `ref`/`computed` au **module 04**. `v-on` (`@`) est présenté dans les worked examples, mais la gestion avancée des événements (modificateurs, émissions parent-enfant) est au **module 05**. Les composants (`defineProps`, `defineEmits`) sont strictement hors périmètre ici.

---

## 1. Cas concret d'abord

Tu travailles sur le front-office TribuZen. La première page après connexion montre la **liste des membres de la famille** — un composant `FamilyMemberList.vue`. Le design demande :

- Afficher le prénom de chaque membre + un badge "Admin" si `isAdmin: true`.
- Si la liste est vide, afficher un **empty state** : « Aucun membre pour l'instant. »
- Griser les membres inactifs (`isActive: false`).

Voici le starter sans directives :

```vue
<!-- FamilyMemberList.vue — starter (ne compile pas encore correctement) -->
<script setup lang="ts">
interface Member {
  id: string
  name: string
  isAdmin: boolean
  isActive: boolean
}

const members: Member[] = [
  { id: 'm1', name: 'Alice', isAdmin: true,  isActive: true  },
  { id: 'm2', name: 'Bob',   isAdmin: false, isActive: false },
  { id: 'm3', name: 'Cara',  isAdmin: false, isActive: true  },
]
</script>

<template>
  <!-- ??? comment boucler sur members -->
  <!-- ??? comment afficher le badge admin conditionnellement -->
  <!-- ??? comment afficher l'empty state si members est vide -->
  <!-- ??? comment griser les membres inactifs via une classe -->
</template>
```

Tous les `???` ci-dessus se résolvent avec les directives de ce module. À la fin du module 02, tu sais écrire ce composant de A à Z — sans aide.

---

## 2. Théorie complète, concise

### 2.1 Interpolation moustache <code v-pre>{{ }}</code>

<code v-pre>{{ expression }}</code> évalue une expression JavaScript et insère le résultat en tant que **texte brut** dans le DOM. Toute expression valide fonctionne — appel de méthode, opérateur ternaire, accès imbriqué.

```vue
<script setup lang="ts">
const name = 'Alice'
const score = 87
const tags = ['Vue', 'TypeScript']
</script>

<template>
  <!-- Variable simple -->
  <p>{{ name }}</p>                         <!-- Alice -->

  <!-- Expression JS complète -->
  <p>{{ score >= 80 ? 'Excellent' : 'Passé' }}</p>   <!-- Excellent -->

  <!-- Appel de méthode natif -->
  <p>{{ name.toUpperCase() }}</p>           <!-- ALICE -->

  <!-- Accès à un tableau -->
  <p>{{ tags.join(', ') }}</p>              <!-- Vue, TypeScript -->
</template>
```

**Ce que <code v-pre>{{ }}</code> ne fait PAS :** il n'interprète pas le HTML. <code v-pre>{{ '&lt;strong&gt;gras&lt;/strong&gt;' }}</code> affiche la chaîne littérale. Pour insérer du HTML, voir `v-html` (§2.7) et ses avertissements de sécurité.

**`v-once` — rendu une seule fois :**

```vue
<!-- Rendu au premier montage ; les mises à jour de `name` sont ignorées ensuite -->
<p v-once>{{ name }}</p>
```

Utile pour le contenu statique (titres immuables) — évite que Vue surveille inutilement la valeur.

---

### 2.2 `v-bind` et le raccourci `:`

`v-bind` lie un **attribut HTML** à une expression JavaScript. Sans lui, les attributs sont des chaînes statiques.

```vue
<script setup lang="ts">
import { ref } from 'vue'
const imageUrl = ref('/avatar.jpg')
const isDisabled = ref(true)
</script>

<template>
  <!-- Forme longue — rarement écrite en pratique -->
  <img v-bind:src="imageUrl" />

  <!-- Raccourci : (utilisé partout) -->
  <img :src="imageUrl" />
  <button :disabled="isDisabled">Envoyer</button>
</template>
```

**Vue 3.4+ — raccourci same-name :** quand le nom de l'attribut et le nom de la variable sont identiques, on peut écrire juste `:id` au lieu de `:id="id"`. Même idiome que le shorthand objet JavaScript (`{ id }` = `{ id: id }`).

```vue
<script setup lang="ts">
const id = ref('user-42')
const disabled = ref(false)
</script>

<template>
  <!-- Avant Vue 3.4 -->
  <input :id="id" :disabled="disabled" />

  <!-- Vue 3.4+ — raccourci same-name -->
  <input :id :disabled />
</template>
```

**Lier plusieurs attributs d'un coup :**

```vue
<script setup lang="ts">
const attrs = { id: 'btn-submit', type: 'submit', disabled: false }
</script>

<template>
  <!-- v-bind sans argument = spread de l'objet sur l'élément -->
  <button v-bind="attrs">Envoyer</button>
</template>
```

---

### 2.3 `v-if` / `v-else-if` / `v-else` — rendu conditionnel

`v-if` **supprime** l'élément du DOM quand la condition est fausse. `v-else-if` et `v-else` doivent suivre immédiatement l'élément `v-if` — aucun nœud entre les deux.

```vue
<script setup lang="ts">
import { ref } from 'vue'
const role = ref<'admin' | 'member' | 'guest'>('member')
</script>

<template>
  <p v-if="role === 'admin'">Tableau de bord admin</p>
  <p v-else-if="role === 'member'">Espace membre</p>
  <p v-else>Veuillez vous connecter</p>
</template>
```

**Grouper sans élément parent** : `<template v-if>` permet d'encadrer plusieurs éléments sans introduire de `<div>` dans le DOM.

```vue
<template v-if="isLoaded">
  <h2>Bienvenue {{ name }}</h2>
  <p>Dernière connexion : {{ lastLogin }}</p>
</template>
```

---

### 2.4 `v-show` — masquer sans supprimer

`v-show` applique `display: none` quand la condition est fausse. L'élément **reste dans le DOM**.

```vue
<script setup lang="ts">
import { ref } from 'vue'
const panelOpen = ref(false)
</script>

<template>
  <button @click="panelOpen = !panelOpen">Paramètres</button>

  <!-- L'élément existe toujours ; seul display change -->
  <div v-show="panelOpen" class="panel">
    <p>Contenu du panneau</p>
  </div>
</template>
```

**Quand choisir `v-if` vs `v-show` :**

| Situation | Directive | Raison |
|---|---|---|
| L'élément bascule souvent (toggle fréquent) | `v-show` | Toggle CSS = coût minimal à chaque switch |
| L'élément est rarement visible | `v-if` | Pas de rendu initial — DOM plus léger |
| La condition est définitive (rôle admin) | `v-if` | Jamais construit si faux — meilleure sécurité |
| Empty state / chargement | `v-if` | Idiome Vue — l'état vide n'a aucune raison d'être dans le DOM |

**`v-show` a une limitation importante :** il n'a pas de `v-else`. Pour un rendu alternatif, il faut deux `v-show` avec des conditions inverses, ou utiliser `v-if`/`v-else`.

---

### 2.5 `v-for` — boucle sur un tableau

```vue
<script setup lang="ts">
import { ref } from 'vue'

interface Post { id: string; title: string; likes: number }

const posts = ref<Post[]>([
  { id: 'p1', title: 'Vue 3 est sorti', likes: 42 },
  { id: 'p2', title: 'Nuxt 3 en prod',  likes: 18 },
])
</script>

<template>
  <ul>
    <!-- Forme de base : item in items -->
    <li v-for="post in posts" :key="post.id">
      {{ post.title }} — {{ post.likes }} ♥
    </li>
  </ul>
</template>
```

**Récupérer l'index :** `(item, index) in items` — l'index commence à 0.

```vue
<li v-for="(post, index) in posts" :key="post.id">
  {{ index + 1 }}. {{ post.title }}
</li>
```

**`v-for` sur une plage numérique :**

```vue
<!-- n va de 1 à 5 (inclus) — Vue 3 commence à 1, pas 0 -->
<span v-for="n in 5" :key="n">{{ n }} </span>
<!-- Affiche : 1 2 3 4 5 -->
```

**`v-for` sur un objet :** Vue itère sur les valeurs. La signature complète est `(value, key, index)`.

```vue
<script setup lang="ts">
const profile = { name: 'Alice', city: 'Lyon', lang: 'FR' }
</script>

<template>
  <dl>
    <div v-for="(value, key) in profile" :key="key">
      <dt>{{ key }}</dt>
      <dd>{{ value }}</dd>
    </div>
  </dl>
</template>
```

**Grouper avec `<template v-for>` :** comme pour `v-if`, on peut utiliser `<template>` pour boucler sur plusieurs éléments sans `<div>` parasite. La `:key` se met sur le `<template>`.

```vue
<template v-for="post in posts" :key="post.id">
  <dt>{{ post.title }}</dt>
  <dd>{{ post.likes }} likes</dd>
</template>
```

---

### 2.6 La clé `:key` — obligatoire et stable

`:key` donne à Vue un identifiant unique par nœud dans une liste. Quand la liste change (ajout, suppression, tri), Vue retrouve chaque élément par sa clé au lieu de redessiner tout le bloc.

```vue
<!-- ✅ Clé stable — un id métier unique -->
<li v-for="member in members" :key="member.id">

<!-- ❌ Index comme clé — donne des bugs si la liste est triée ou filtrée -->
<li v-for="(member, index) in members" :key="index">
```

**Quand l'index comme clé est acceptable :** uniquement si la liste est **statique** (jamais triée, filtrée, ni réordonnée) et si les items n'ont pas d'état interne (formulaire, animation). En dehors de ces cas, toujours préférer un id stable.

---

### 2.7 Liaisons de classe (`:class`)

Vue permet de combiner des classes statiques et des classes conditionnelles sur le même élément.

**Syntaxe objet :** `{ nomClasse: condition }` — la classe est ajoutée si la condition est truthy.

```vue
<script setup lang="ts">
import { ref } from 'vue'
const isActive = ref(true)
const hasError = ref(false)
</script>

<template>
  <!-- "btn" est statique ; "active" et "error" sont conditionnelles -->
  <button class="btn" :class="{ active: isActive, error: hasError }">
    Enregistrer
  </button>
  <!-- Résultat si isActive=true, hasError=false : class="btn active" -->
</template>
```

**Syntaxe tableau :** liste d'expressions, chacune peut être une string, une expression ternaire ou un objet.

```vue
<div :class="['card', isAdmin ? 'card--admin' : 'card--member', { 'card--inactive': !isActive }]">
```

**Objet computed (recommandé pour la lisibilité) :** extraire la logique de classe dans un `computed` garde le template propre.

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
const isActive = ref(true)
const isAdmin = ref(false)

const cardClass = computed(() => ({
  'card--active': isActive.value,
  'card--admin':  isAdmin.value,
}))
</script>

<template>
  <div class="card" :class="cardClass">…</div>
</template>
```

---

### 2.8 Liaisons de style (`:style`)

```vue
<script setup lang="ts">
import { ref } from 'vue'
const textColor = ref('#3b82f6')  // bleu
const fontSize  = ref(16)
</script>

<template>
  <!-- Objet camelCase -->
  <p :style="{ color: textColor, fontSize: fontSize + 'px' }">
    Texte stylé
  </p>

  <!-- Tableau d'objets (fusion de styles) -->
  <p :style="[{ color: textColor }, { fontWeight: 'bold' }]">
    Texte bleu et gras
  </p>
</template>
```

Les propriétés CSS doivent être en **camelCase** (`backgroundColor`, `fontSize`, `borderRadius`). Vue accepte aussi les strings avec tiret (`'font-size'`) mais camelCase est plus idiomatique.

**Vue préfixe automatiquement** les propriétés nécessitant un vendor prefix (ex: `transform`) — pas besoin d'ajouter `-webkit-transform` manuellement.

---

### 2.9 Directives built-in complémentaires

| Directive | Rôle | Note |
|---|---|---|
| `v-model` | Liaison bidirectionnelle (`input` ↔ réf) | Sucre syntaxique `:value` + `@input` — détaillé au module 03 |
| `v-html` | Injecte du HTML brut | ⚠️ **XSS** si contenu utilisateur non sanitisé — n'utiliser qu'avec du HTML maîtrisé |
| `v-text` | Équivalent de <code v-pre>{{ }}</code> en attribut | Remplace tout le contenu textuel de l'élément — <code v-pre>{{ }}</code> est préférable |
| `v-once` | Rendu unique, pas de re-render | Optimisation pour le contenu statique (ex: titres immuables) |
| `v-pre` | Passe le bloc sans compilation Vue | Utile pour afficher des moustaches littérales <code v-pre>{{ }}</code> dans la doc |
| `v-cloak` | Cache le composant jusqu'à compilation | Évite le flash de <code v-pre>{{ nom }}</code> avant que Vue prenne le contrôle |

---

### 2.10 Modificateurs de directive

Les modificateurs s'ajoutent après le nom de l'événement avec un point : `@event.modifier`.

**Modificateurs d'événement :**

```vue
<!-- Empêche le rechargement de page par défaut du navigateur -->
<form @submit.prevent="handleSubmit">…</form>

<!-- Empêche la propagation vers les éléments parents -->
<button @click.stop="handleClick">…</button>

<!-- Se déclenche une seule fois, puis se désabonne -->
<button @click.once="initTour">Démarrer le tour</button>

<!-- Ne réagit que si l'événement vient directement de l'élément (pas d'un enfant) -->
<div @click.self="closeModal">…</div>
```

**Modificateurs de touche clavier :**

```vue
<!-- Enter uniquement -->
<input @keyup.enter="search" />

<!-- Escape uniquement -->
<input @keyup.escape="cancel" />
```

**Enchaîner des modificateurs :**

```vue
<!-- Empêche à la fois la propagation ET le comportement par défaut -->
<a @click.stop.prevent="doSomething">Lien spécial</a>
```

---

## 3. Worked examples

### Exemple 1 — `FamilyMemberList.vue` (résolution du cas concret)

Voici le composant TribuZen complet issu de la section 1 :

```vue
<!-- FamilyMemberList.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

interface Member {
  id: string
  name: string
  isAdmin: boolean
  isActive: boolean
}

const members = ref<Member[]>([
  { id: 'm1', name: 'Alice', isAdmin: true,  isActive: true  },
  { id: 'm2', name: 'Bob',   isAdmin: false, isActive: false },
  { id: 'm3', name: 'Cara',  isAdmin: false, isActive: true  },
])

// Computed : classe d'une ligne de membre
// Extrait la logique du template pour plus de lisibilité
function memberClass(m: Member) {
  return {
    'member-row': true,
    'member-row--inactive': !m.isActive,
  }
}
</script>

<template>
  <!-- Empty state : v-if quand le tableau est vide -->
  <p v-if="members.length === 0" class="empty-state">
    Aucun membre pour l'instant.
  </p>

  <!-- Liste : v-else-if ou v-else -->
  <ul v-else>
    <!--
      v-for + :key stable (id métier, pas index)
      :class dynamique selon isActive
    -->
    <li
      v-for="member in members"
      :key="member.id"
      :class="memberClass(member)"
    >
      <!-- Interpolation : texte brut, auto-escapé -->
      {{ member.name }}

      <!-- Badge admin : v-if conditionnel sur le champ booléen -->
      <span v-if="member.isAdmin" class="badge badge--admin">Admin</span>
    </li>
  </ul>
</template>
```

**Points clés de ce composant :**
- L'empty state (`v-if … v-else`) est la paire idiomatique Vue — pas deux `v-show`.
- `:key="member.id"` utilise l'id métier — résistant au tri ou au filtre futur.
- La fonction `memberClass()` extrait la logique de classe du template pour le garder lisible.
- <code v-pre>{{ member.name }}</code> est auto-escapé — si le nom contenait `<script>`, il s'afficherait comme texte brut.

---

### Exemple 2 — `PostFeed.vue` — v-for avec filtre et classes conditionnelles

```vue
<!-- PostFeed.vue — liste de posts avec filtre "épinglés en premier" -->
<script setup lang="ts">
import { ref, computed } from 'vue'

interface Post {
  id: string
  title: string
  pinned: boolean
  likes: number
}

const posts = ref<Post[]>([
  { id: 'p1', title: 'Bienvenue sur TribuZen',  pinned: true,  likes: 34 },
  { id: 'p2', title: 'Réunion famille juillet',  pinned: false, likes: 8  },
  { id: 'p3', title: 'Recette de mamie Huguette', pinned: true,  likes: 61 },
])

// Les posts épinglés apparaissent en premier
const sortedPosts = computed(() =>
  [...posts.value].sort((a, b) => Number(b.pinned) - Number(a.pinned))
)
</script>

<template>
  <section>
    <h2>Publications ({{ posts.length }})</h2>

    <article
      v-for="post in sortedPosts"
      :key="post.id"
      :class="{ 'post--pinned': post.pinned }"
    >
      <!-- v-if pour l'icône épingle — v-show serait excessif pour un badge statique -->
      <span v-if="post.pinned" aria-label="Épinglé">📌</span>

      <h3>{{ post.title }}</h3>
      <p>{{ post.likes }} ♥</p>
    </article>
  </section>
</template>
```

**Pourquoi `v-if` et pas `v-show` pour l'icône :** le badge n'apparaît qu'une fois par post et ne toggle pas — `v-if` est plus approprié car il évite de mettre dans le DOM un élément inutile sur les posts non épinglés.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — `v-if` et `v-for` sur le même élément

```vue
<!-- ❌ Ne jamais combiner v-if et v-for sur le même élément -->
<li v-for="member in members" v-if="member.isActive" :key="member.id">
  {{ member.name }}
</li>
<!--
  En Vue 3, v-if A PRIORITÉ sur v-for.
  Résultat : v-if s'évalue EN PREMIER, avant que v-for ne lie "member".
  "member" est undefined → erreur runtime.
-->
```

```vue
<!-- ✅ Envelopper dans un <template> intermédiaire -->
<template v-for="member in members" :key="member.id">
  <li v-if="member.isActive">{{ member.name }}</li>
</template>

<!-- ✅ Ou mieux : filtrer en amont avec un computed -->
<li v-for="member in activeMembers" :key="member.id">{{ member.name }}</li>
```

> **Note Vue 2 vs Vue 3 :** en Vue 2, `v-for` avait priorité sur `v-if`. En Vue 3, c'est l'inverse. Un composant migré peut produire des bugs silencieux sur ce point.

---

### PIÈGE #2 — Index comme `:key`

```vue
<!-- ❌ L'index change si la liste est triée, filtrée, ou si un item est supprimé -->
<li v-for="(item, index) in items" :key="index">{{ item.name }}</li>
```

Conséquence : Vue réutilise les nœuds DOM dans le mauvais ordre, causant des bugs d'animation, de focus, ou d'état interne (champs de formulaire dans un `v-for`).

```vue
<!-- ✅ Utiliser un id métier stable -->
<li v-for="item in items" :key="item.id">{{ item.name }}</li>
```

L'index comme `:key` est acceptable **uniquement** si la liste est statique (jamais triée ni filtrée) et si les items n'ont pas d'état interne.

---

### PIÈGE #3 — `v-show` sur un composant Vue

`v-show` applique `display: none` sur **l'élément racine** du composant. Le composant est tout de même **monté** — ses hooks `onMounted` s'exécutent et ses watchers sont actifs. Ce n'est pas une mise en pause.

```vue
<!-- ⚠️ Le composant HeavyChart est monté et ses timers tournent même quand isVisible=false -->
<HeavyChart v-show="isVisible" />

<!-- ✅ Si on veut réellement empêcher le montage, utiliser v-if -->
<HeavyChart v-if="isVisible" />
```

`v-show` n'est approprié sur un composant que si on veut **garder son état** entre les toggles et que le coût de montage est inférieur au coût du re-rendu.

---

### PIÈGE #4 — Oublier `:key` sur `v-for`

Vue affiche un warning en dev et fonctionne sans `:key`, mais les updates DOM peuvent être incorrectes — en particulier sur les listes avec état interne (inputs, checkboxes) ou avec des animations CSS/transition.

```vue
<!-- ❌ Pas de :key — warning en dev, bugs potentiels en prod -->
<li v-for="item in items">{{ item.name }}</li>

<!-- ✅ Toujours fournir :key -->
<li v-for="item in items" :key="item.id">{{ item.name }}</li>
```

---

## 5. Ancrage TribuZen

Les directives de ce module couvrent **deux couches concrètes** du front-office TribuZen :

**`FamilyMemberList.vue`** (Exemple 1) — composant affiché dès la page d'accueil après connexion. Chaque famille a entre 2 et 20 membres. L'empty state (`v-if members.length === 0`) gère le cas du nouveau compte sans membres invités. Le badge Admin (`v-if member.isAdmin`) est un pattern répété sur les posts, les albums, les événements.

**`PostFeed.vue`** (Exemple 2) — le fil de publications de la famille. `v-for` avec `:key` stable est critique ici car les posts peuvent être épinglés, filtrés, paginés — toute opération qui change l'ordre. Une `:key="index"` produirait des bugs de re-rendu visibles à l'œil.

Structure cible dans `smaurier/tribuzen` :

```
tribuzen/
  src/
    components/
      family/
        FamilyMemberList.vue    ← v-for + :key + v-if badge admin + empty state
      post/
        PostFeed.vue            ← v-for + :key + v-if icône + :class conditionnel
```

> La liaison de classes (`:class="{ 'member-row--inactive': !isActive }"`) est aussi utilisée dans `EventCard.vue` (événements passés vs futurs) et `AlbumGrid.vue` (album partagé vs privé) — même pattern, même directive.

---

## 6. Points clés

1. <code v-pre>{{ expression }}</code> évalue du JavaScript et insère du texte brut auto-escapé — jamais du HTML brut.
2. `:attr="expr"` (raccourci de `v-bind:attr`) connecte un attribut HTML à une expression JavaScript ; sans `:`, la valeur est une chaîne statique.
3. `v-if` supprime l'élément du DOM quand la condition est fausse ; `v-show` applique `display: none` — l'élément reste monté.
4. Choisir `v-show` pour les toggles fréquents (menu, panneau) ; `v-if` pour les conditions rares ou définitives (rôle, empty state, chargement).
5. `v-for="item in items"` boucle sur un tableau ; `v-for="(val, key) in obj"` sur un objet ; `v-for="n in 5"` sur une plage (n de 1 à 5 en Vue 3).
6. `:key` est obligatoire sur `v-for` — utiliser un id métier stable, jamais l'index si la liste peut être triée ou filtrée.
7. En Vue 3, `v-if` a **priorité plus haute** que `v-for` sur le même élément — ne jamais les combiner ; utiliser un `<template v-for>` intermédiaire.
8. `:class` accepte un objet (`{ active: cond }`), un tableau (`['cls', cond ? 'a' : 'b']`) ou les deux combinés avec la classe statique sur `class`.
9. `:style` attend des propriétés en camelCase ; Vue préfixe automatiquement les vendor prefixes.
10. Les modificateurs (`.prevent`, `.stop`, `.once`, `.enter`) s'enchaînent sur l'événement : `@submit.prevent`.

---

## 7. Seeds Anki

```
Quelle est la différence entre {{ valeur }} et v-html="valeur" ?|{{ }} insère du texte brut auto-escapé (sûr contre XSS). v-html injecte du HTML brut interprété — dangereux si le contenu vient d'un utilisateur.
En Vue 3, quand v-if et v-for sont sur le même élément, lequel a priorité ?|v-if a priorité. Il s'évalue avant que v-for ne lie la variable d'itération — "item" est undefined si v-if utilise "item". Solution : envelopper dans <template v-for> et mettre v-if sur l'élément enfant.
Quand utiliser v-show plutôt que v-if ?|v-show pour les toggles fréquents (menu, panneau latéral) : coût de switch minimal (juste display:none). v-if pour les conditions rares/définitives : pas de rendu DOM initial si faux — DOM plus léger.
Pourquoi l'index est-il un mauvais :key pour v-for ?|Si la liste est triée, filtrée ou qu'un item est supprimé, les index changent. Vue réutilise les nœuds DOM dans le mauvais ordre → bugs de focus, d'animation, de formulaires internes. Utiliser un id métier stable.
Comment lier plusieurs classes conditionnelles en Vue 3 ?|Syntaxe objet : :class="{ active: isActive, error: hasError }". Syntaxe tableau : :class="['btn', isActive ? 'active' : '']". Les deux se combinent avec class="static" sur le même élément.
Que fait v-once sur un élément ?|L'élément est rendu une seule fois au montage. Les mises à jour réactives ultérieures sont ignorées pour ce nœud. Utile pour le contenu statique (titres, labels immuables) pour éviter une surveillance inutile.
À quoi sert le raccourci same-name :id (sans valeur) introduit en Vue 3.4 ?|:id est équivalent à :id="id" quand la variable porte le même nom que l'attribut. Même idiome que le shorthand objet JavaScript { id } = { id: id }.
De quel nombre part v-for="n in 5" en Vue 3 ?|n commence à 1 et va jusqu'à 5 inclus (1, 2, 3, 4, 5). Contrairement à la plupart des boucles JS qui commencent à 0.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-02-template-et-directives/README.md`. Construire `FamilyMemberList.vue` de zéro avec `v-for`, `:key`, `v-if` et `:class` — sans gap-fill, corrigé commenté complet, variante J+30.
