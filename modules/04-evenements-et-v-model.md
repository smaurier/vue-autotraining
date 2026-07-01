---
titre: Événements et v-model
cours: 02-vue
notions: [v-on et raccourci arobase, gestion d'événements, modificateurs d'événement, modificateurs de touche, v-model sur input natif, defineModel Vue 3.4+, v-model custom composant, plusieurs v-model nommés]
outcomes:
  - sait écouter un événement DOM et appeler un handler typé
  - sait utiliser les modificateurs (.prevent, .stop, .enter…) sans réécrire la logique
  - sait faire un two-way binding avec v-model sur un input natif
  - sait exposer un v-model sur un composant custom avec defineModel (Vue 3.4+)
prerequis: [03-reactivite]
next: 05-composants-props-emits
libs: [{ name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — InvitationForm (champs email/rôle en v-model), composant SearchInput avec v-model custom via defineModel
last-reviewed: 2026-07
---

# Événements et v-model

> **Outcomes — tu sauras FAIRE :** écouter un événement DOM avec `@` et un handler typé, utiliser les modificateurs d'événement et de touche sans réécrire la logique, faire un two-way binding avec `v-model` sur les inputs natifs, exposer un `v-model` custom sur un composant avec `defineModel` (Vue 3.4+).
> **Difficulté :** :star::star:
>
> **Portée :** ce module couvre **l'interaction utilisateur** — écoute d'événements et liaison formulaire. La communication parent-enfant via `defineProps` / `defineEmits` est au **module 05**. `defineModel` est introduit ici car c'est la façon moderne de gérer `v-model` sur un composant custom — sa compréhension approfondie (validation, transformers) est au module 05. Module précédent : **03 — Réactivité**.

---

## 1. Cas concret d'abord

Tu travailles sur TribuZen. La fonctionnalité d'invitation de famille est prioritaire : un utilisateur doit pouvoir saisir l'email d'un proche, choisir son rôle (`membre` ou `admin`), et envoyer l'invitation en appuyant sur Entrée ou en cliquant le bouton.

Un collègue a déposé ce brouillon :

```vue
<!-- InvitationForm.vue — AVANT (ne fonctionne pas encore) -->
<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const role = ref('membre')

function sendInvitation(): void {
  // Problème 1 : le formulaire recharge la page à la soumission
  // Problème 2 : pas de raccourci clavier Entrée sur l'input email
  // Problème 3 : le champ email n'est pas synchronisé avec la variable
  console.log('Inviter :', email.value, role.value)
}
</script>

<template>
  <form>
    <!-- Le champ n'est PAS lié à 'email' : la variable ne se met jamais à jour -->
    <input type="email" placeholder="email@famille.fr" />

    <!-- Le select n'est PAS lié à 'role' -->
    <select>
      <option value="membre">Membre</option>
      <option value="admin">Admin</option>
    </select>

    <button type="submit" @click="sendInvitation">Inviter</button>
  </form>
</template>
```

**Trois problèmes à résoudre avec ce module :**
1. Lier les champs au state avec `v-model` (two-way binding)
2. Empêcher le rechargement de page avec `.prevent` sur `@submit`
3. Déclencher `sendInvitation` au pressage de la touche Entrée avec `.enter`

La solution complète est dans la section Worked examples.

---

## 2. Théorie complète, concise

### 2.1 `v-on` et le raccourci `@` — écouter les événements DOM

`v-on:click="handler"` et `@click="handler"` sont **rigoureusement identiques**. `@` est le raccourci universel — utilise-le.

**Handler méthode** (recommandé dès que la logique dépasse une expression) :

```vue
<script setup lang="ts">
function handleClick(event: MouseEvent): void {
  console.log('clic à', event.clientX, event.clientY)
}
</script>

<template>
  <!-- Vue injecte automatiquement l'objet Event -->
  <button @click="handleClick">Clique-moi</button>
</template>
```

**Handler inline** (acceptable pour une expression très courte) :

```vue
<template>
  <!-- count doit être une ref déclarée dans <script setup> -->
  <button @click="count++">+1</button>
</template>
```

**Handler inline avec argument custom + accès à `$event`** :

Quand tu veux passer tes propres arguments ET l'objet événement, utilise une arrow function dans le template :

```vue
<script setup lang="ts">
function deleteItem(id: number, event: MouseEvent): void {
  event.stopPropagation()
  console.log('Supprimer', id)
}
</script>

<template>
  <!-- Arrow function : tu contrôles les arguments -->
  <button @click="(e) => deleteItem(item.id, e)">Supprimer</button>

  <!-- Sans arrow function, $event est l'objet événement natif -->
  <button @click="deleteItem(item.id, $event)">Supprimer</button>
</template>
```

> **Règle :** si la fonction ne prend que l'événement (ou rien), utilise la référence directe (`@click="handler"`). Si tu passes des arguments custom, utilise une arrow function ou `$event`.

---

### 2.2 Modificateurs d'événements

Les modificateurs s'ajoutent après le nom de l'événement avec `.` et remplacent le code boilerplate que tu écrirais sinon.

| Modificateur | Équivalent JS manuel | Cas d'usage |
|---|---|---|
| `.prevent` | `event.preventDefault()` | Formulaires (empêcher rechargement), liens |
| `.stop` | `event.stopPropagation()` | Empêcher la remontée (bubbling) vers le parent |
| `.self` | `if (event.target !== event.currentTarget) return` | Réagir seulement si l'élément est lui-même la cible |
| `.once` | `removeEventListener` après premier déclenchement | Initialisation one-shot |
| `.capture` | `addEventListener(..., { capture: true })` | Écouter en phase capture (avant bubbling) |
| `.passive` | `addEventListener(..., { passive: true })` | Scroll performant (indique qu'on n'appellera pas `preventDefault`) |

```vue
<!-- .prevent : indispensable sur les formulaires Vue -->
<form @submit.prevent="sendInvitation">
  <button type="submit">Envoyer</button>
</form>

<!-- .stop : bouton dans une carte cliquable — évite le double déclenchement -->
<div @click="openCard">
  <button @click.stop="deleteCard">Supprimer</button>
</div>

<!-- .self : le handler ne se déclenche que si on clique sur le div, pas sur ses enfants -->
<div @click.self="closeModal">
  <dialog>Contenu du modal</dialog>
</div>

<!-- .once : initialisation déclenchée une seule fois -->
<button @click.once="initMap">Charger la carte</button>

<!-- .passive : scroll natif sans vérification de preventDefault — meilleure perf -->
<div @scroll.passive="onScroll">...</div>

<!-- Chaîner : ordre compte — .prevent puis .stop -->
<a @click.prevent.stop="navigate">Lien</a>
```

---

### 2.3 Modificateurs de touche (key modifiers)

S'utilisent avec `@keyup` ou `@keydown`. Évitent de vérifier `event.key` manuellement.

**Touches nommées :**

```vue
<input @keyup.enter="submit" />   <!-- Entrée -->
<input @keyup.esc="cancel" />     <!-- Échap (alias .escape) -->
<input @keyup.tab="nextField" />  <!-- Tab -->
<input @keyup.delete="clear" />   <!-- Suppr OU Retour arrière -->
<input @keyup.space="toggle" />   <!-- Espace -->
<input @keyup.up="increment" />   <!-- Flèche haut -->
<input @keyup.down="decrement" /> <!-- Flèche bas -->
```

**Touches de système (modifieurs) :**

```vue
<!-- Ctrl+S — @keydown car on veut capter pendant la frappe -->
<input @keydown.ctrl.s="save" />

<!-- Alt+Entrée -->
<input @keydown.alt.enter="newLine" />

<!-- Shift+Clic -->
<button @click.shift="selectRange">Sélectionner</button>

<!-- Meta = touche Windows ou Cmd macOS -->
<input @keydown.meta.s="save" />
```

**`.exact` — exactement ces touches, pas d'autres :**

```vue
<!-- Se déclenche SEULEMENT si Ctrl est pressé, rien d'autre -->
<button @click.ctrl.exact="ctrlOnly">Ctrl seul</button>

<!-- Se déclenche si aucun modificateur système n'est pressé -->
<button @click.exact="noModifier">Clic simple</button>
```

---

### 2.4 Modificateurs de souris

```vue
<!-- Seulement le clic gauche -->
<button @click.left="select">Sélectionner</button>

<!-- Clic droit (context menu) -->
<div @click.right.prevent="showContextMenu">Zone</div>

<!-- Clic molette -->
<button @click.middle="openNewTab">Ouvrir</button>
```

---

### 2.5 `v-model` sur les inputs natifs

`v-model` est un raccourci qui crée un **two-way binding** : quand l'utilisateur interagit avec l'input, la ref Vue se met à jour ; quand la ref change via le code, l'input se met à jour.

**Ce que `v-model` fait vraiment sous le capot (input texte) :**

```vue
<!-- Ces deux formes sont strictement équivalentes -->
<input v-model="email" type="email" />

<input
  :value="email"
  @input="email = ($event.target as HTMLInputElement).value"
  type="email"
/>
```

#### Input texte et textarea

```vue
<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')        // Ref<string>
const message = ref('')      // Ref<string>
</script>

<template>
  <input v-model="email" type="email" placeholder="email@tribuzen.app" />
  <textarea v-model="message" placeholder="Message..."></textarea>
  <p>Email : {{ email }}</p>
</template>
```

#### Checkbox

```vue
<script setup lang="ts">
import { ref } from 'vue'

// Une seule checkbox → booléen
const accepted = ref(false)

// Plusieurs checkboxes → tableau des valeurs cochées
const roles = ref<string[]>([])
</script>

<template>
  <!-- Booléen -->
  <label>
    <input type="checkbox" v-model="accepted" />
    J'accepte les conditions
  </label>

  <!-- Tableau : chaque checkbox ajoute/retire sa value -->
  <label><input type="checkbox" v-model="roles" value="read" /> Lecture</label>
  <label><input type="checkbox" v-model="roles" value="write" /> Écriture</label>
  <label><input type="checkbox" v-model="roles" value="admin" /> Admin</label>

  <p>Rôles : {{ roles }}</p>
  <!-- Ex : ["read", "admin"] si les deux sont cochées -->
</template>
```

#### Radio

```vue
<script setup lang="ts">
import { ref } from 'vue'

type Role = 'membre' | 'admin' | 'invite'
const role = ref<Role>('membre')
</script>

<template>
  <!-- Tous les radios partagent le même v-model -->
  <label><input type="radio" v-model="role" value="membre" /> Membre</label>
  <label><input type="radio" v-model="role" value="admin" /> Admin</label>
  <label><input type="radio" v-model="role" value="invite" /> Invité</label>

  <p>Rôle choisi : {{ role }}</p>
</template>
```

#### Select

```vue
<script setup lang="ts">
import { ref } from 'vue'

const priority = ref<'low' | 'medium' | 'high'>('medium')
</script>

<template>
  <select v-model="priority">
    <option value="low">Basse</option>
    <option value="medium">Moyenne</option>
    <option value="high">Haute</option>
  </select>
</template>
```

#### Modificateurs de `v-model`

```vue
<!-- .trim — supprime les espaces en début et fin -->
<input v-model.trim="name" />

<!-- .number — convertit la saisie string en number -->
<input v-model.number="age" type="number" />

<!-- .lazy — synchronise sur 'change' plutôt que sur 'input'
     (= seulement quand on quitte le champ ou appuie sur Entrée) -->
<input v-model.lazy="search" />
```

> **`.number` vs `type="number"`** : `type="number"` contrôle l'affichage et la saisie côté HTML mais retourne quand même une string en JavaScript. `.number` garantit que `v-model` retourne un `number`.

---

### 2.6 `defineModel` Vue 3.4+ — exposer un `v-model` sur un composant custom

#### Pourquoi un composant custom a besoin de sa propre mécanique

`v-model` sur un `<input>` natif fonctionne automatiquement. Sur un **composant Vue custom**, il faut déclarer explicitement la prop et l'événement de mise à jour — c'est le contrat que Vue exige pour que le parent puisse écrire `<SearchInput v-model="query" />`.

#### AVANT Vue 3.4 — props + emit `update:modelValue` (toujours valide)

```vue
<!-- SearchInput.vue — ancienne syntaxe -->
<script setup lang="ts">
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <input :value="props.modelValue" @input="onInput" type="search" />
</template>
```

Utilisation dans le parent :
```vue
<!-- Parent -->
<SearchInput v-model="query" />
<!-- équivaut à : -->
<SearchInput :modelValue="query" @update:modelValue="query = $event" />
```

C'est verbeux. Vue 3.4 introduit `defineModel` pour condenser tout ça.

#### APRÈS Vue 3.4 — `defineModel` (syntaxe recommandée)

`defineModel` est une macro compilateur comme `defineProps`. Elle déclare automatiquement la prop `modelValue` **ET** émet `update:modelValue` quand tu mutes `.value`.

```vue
<!-- SearchInput.vue — syntaxe moderne (Vue 3.4+) -->
<script setup lang="ts">
// Déclare la prop modelValue + l'emit update:modelValue en une ligne
const query = defineModel<string>()
// query est une Ref<string | undefined> — on peut lire et écrire query.value directement
</script>

<template>
  <!-- v-model sur l'input natif interne — query se synchronise avec le parent -->
  <input v-model="query" type="search" placeholder="Rechercher..." />
</template>
```

Utilisation dans le parent : **inchangée** — `<SearchInput v-model="searchTerm" />` fonctionne exactement pareil.

**Avec options :**

```vue
<script setup lang="ts">
// required : Vue avertit si le parent n'envoie pas la prop
const query = defineModel<string>({ required: true })

// default : valeur par défaut si le parent n'envoie rien
const label = defineModel<string>({ default: '' })
</script>
```

> **Attention :** `default` sur un `defineModel` peut désynchroniser le composant si le parent passe `undefined`. Préfère `required: true` quand la prop est indispensable.

#### Plusieurs `v-model` nommés

```vue
<!-- FullNameInput.vue — deux v-model distincts -->
<script setup lang="ts">
const firstName = defineModel<string>('firstName', { required: true })
const lastName  = defineModel<string>('lastName',  { required: true })
</script>

<template>
  <input v-model="firstName" placeholder="Prénom" />
  <input v-model="lastName"  placeholder="Nom" />
</template>
```

Utilisation dans le parent :

```vue
<FullNameInput
  v-model:firstName="user.firstName"
  v-model:lastName="user.lastName"
/>
```

Chaque `defineModel('nomArg')` correspond à un `v-model:nomArg` côté parent.

---

## 3. Worked examples

### Exemple 1 — `InvitationForm.vue` complet (TribuZen)

On reprend le brouillon du cas concret et on applique tout ce qui précède.

> **Preview — `defineEmits` (module 05) :** cet exemple utilise `defineEmits` pour signaler au composant parent qu'une invitation a été envoyée. `defineEmits` fait partie de la communication parent-enfant, expliquée en détail au **module 05 — Composants, props et emits**. Pour ce module, retiens seulement que c'est la façon dont un composant enfant remonte un événement vers son parent — tu n'as pas besoin de comprendre le mécanisme complet maintenant.

```vue
<!-- InvitationForm.vue — version corrigée -->
<script setup lang="ts">
import { ref } from 'vue'

type InvitationRole = 'membre' | 'admin'

const email   = ref('')
const role    = ref<InvitationRole>('membre')
const sending = ref(false)
const error   = ref<string | null>(null)

// emit vers le parent pour signaler qu'une invitation a été envoyée
const emit = defineEmits<{ invited: [email: string, role: InvitationRole] }>()

async function sendInvitation(): Promise<void> {
  if (!email.value.trim()) {
    error.value = 'L\'email est requis.'
    return
  }

  sending.value = true
  error.value   = null

  try {
    await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value.trim(), role: role.value }),
    })
    emit('invited', email.value.trim(), role.value)
    email.value = ''   // reset après envoi
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erreur réseau'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <!--
    @submit.prevent : intercepte l'événement submit natif et empêche le rechargement
    de la page. Sans .prevent, le navigateur rechargerait la page à chaque envoi.
  -->
  <form @submit.prevent="sendInvitation">

    <!--
      v-model.trim="email" : lie le champ à la ref 'email' et supprime les espaces.
      @keyup.enter="sendInvitation" : envoie aussi via la touche Entrée.
      Note : @keyup.enter est redondant ici car l'input est dans un <form type="submit">
      mais c'est une pratique courante pour les champs isolés hors formulaire.
    -->
    <input
      v-model.trim="email"
      type="email"
      placeholder="email@famille.fr"
      :disabled="sending"
      @keyup.esc="email = ''"
    />

    <!-- v-model="role" : synchronise le select avec la ref 'role' -->
    <select v-model="role" :disabled="sending">
      <option value="membre">Membre</option>
      <option value="admin">Admin</option>
    </select>

    <button type="submit" :disabled="sending || !email">
      {{ sending ? 'Envoi…' : 'Inviter' }}
    </button>

    <p v-if="error" class="error">{{ error }}</p>
  </form>
</template>
```

**Ce que TS vérifie ici :**
- `role.value = 'superadmin'` → erreur (`'superadmin'` n'est pas assignable à `InvitationRole`)
- `emit('invited', email.value, 42)` → erreur (second argument doit être `InvitationRole`)
- `sending.value = 'yes'` → erreur (string pas assignable à boolean)

---

### Exemple 2 — `SearchInput.vue` avec `defineModel` (AVANT vs APRÈS)

**AVANT Vue 3.4 :**

```vue
<!-- SearchInput.vue — ancienne syntaxe -->
<script setup lang="ts">
const props = defineProps<{ modelValue: string }>()
const emit  = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="search-input">
    <input
      :value="props.modelValue"
      type="search"
      placeholder="Rechercher un membre..."
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <!-- Bouton reset -->
    <button
      v-if="props.modelValue"
      @click="emit('update:modelValue', '')"
    >
      ✕
    </button>
  </div>
</template>
```

**APRÈS Vue 3.4 avec `defineModel` :**

```vue
<!-- SearchInput.vue — syntaxe moderne -->
<script setup lang="ts">
// Une ligne remplace defineProps + defineEmits + le cast HTMLInputElement
const query = defineModel<string>({ required: true })
</script>

<template>
  <div class="search-input">
    <!--
      v-model="query" : query est une Ref<string> writable.
      Écrire query.value = 'x' émet automatiquement update:modelValue vers le parent.
    -->
    <input v-model="query" type="search" placeholder="Rechercher un membre..." />

    <!-- Réinitialisation directe : mutation de query.value → synchro parent automatique -->
    <button v-if="query" @click="query = ''">✕</button>
  </div>
</template>
```

Utilisation dans le parent (identique dans les deux cas) :

```vue
<script setup lang="ts">
import { ref } from 'vue'
import SearchInput from './SearchInput.vue'

const searchQuery = ref('')
</script>

<template>
  <SearchInput v-model="searchQuery" />
  <p>Recherche : {{ searchQuery }}</p>
</template>
```

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Mutation directe de prop au lieu de `defineModel` / `emit`

```vue
<!-- ❌ Composant enfant qui mute directement une prop -->
<script setup lang="ts">
const props = defineProps<{ modelValue: string }>()

function clear(): void {
  // Vue émet un avertissement en dev ET le parent n'est pas mis à jour
  props.modelValue = ''   // TS Error + warning Vue runtime
}
</script>

<!-- ✅ Passer par defineModel (Vue 3.4+) ou émettre un event -->
<script setup lang="ts">
const query = defineModel<string>()

function clear(): void {
  query.value = ''   // ✅ met à jour la ref ET notifie le parent
}
</script>
```

Les props sont **en lecture seule** dans l'enfant — c'est une règle fondamentale Vue. `defineModel` gère le cycle lecture/écriture proprement.

### PIÈGE #2 — Oublier `.prevent` sur `@submit`

```vue
<!-- ❌ Sans .prevent : la page recharge à chaque soumission -->
<form @submit="sendForm">
  <button type="submit">Envoyer</button>
</form>

<!-- ✅ .prevent intercepte le comportement HTML natif -->
<form @submit.prevent="sendForm">
  <button type="submit">Envoyer</button>
</form>
```

Ce bug est particulièrement traitre en développement local car le rechargement est quasi instantané et la console se vide. Symptôme : la page "clignote" et les logs disparaissent.

### PIÈGE #3 — Confondre `@input` et `v-model`

```vue
<!-- @input → déclenche un handler à chaque frappe, mais ne met PAS à jour la ref -->
<input @input="handleInput" />  <!-- email.value n'est PAS modifié ici -->

<!-- v-model → two-way binding complet : la ref est mise à jour ET l'input est synchronisé -->
<input v-model="email" />

<!-- Cas d'usage légitime de @input : valider en temps réel EN PLUS de v-model -->
<input v-model="email" @input="validateEmail" />
```

Utiliser `@input` pour "remplacer" `v-model` oblige à extraire `event.target.value` manuellement et à forcer la mise à jour — boilerplate inutile que `v-model` évite.

### PIÈGE #4 — Confondre `defineModel()` (sans nom) et `defineModel('nom')`

```vue
<script setup lang="ts">
// ✅ Pour v-model="value" → prop 'modelValue'
const value = defineModel<string>()

// ✅ Pour v-model:title="t" → prop 'title'
const title = defineModel<string>('title')

// ❌ Erreur courante : deux defineModel() sans nom → conflit sur 'modelValue'
const a = defineModel<string>()
const b = defineModel<number>()  // ← écrase 'a' : les deux bind 'modelValue'
</script>
```

Quand un composant gère plusieurs `v-model`, chaque `defineModel` au-delà du premier **doit** avoir un nom.

---

## 5. Ancrage TribuZen

Deux composants du front-office TribuZen utilisent directement ce module :

**`InvitationForm.vue`** — (Exemple 1 de ce module) : `@submit.prevent`, `v-model.trim`, `@keyup.esc`, `v-model` sur select. C'est l'entrée principale du flux d'invitation famille — chaque session TribuZen passe par ce formulaire.

**`SearchInput.vue`** — (Exemple 2) : composant réutilisable exposant un `v-model` custom via `defineModel`. Utilisé dans `FamilyMemberList` (filtrage des membres) et dans `EventList` (filtrage des événements familiaux).

```
tribuzen/src/
  components/
    family/
      InvitationForm.vue     ← @submit.prevent + v-model + @keyup.esc
      FamilyMemberList.vue   ← consomme <SearchInput v-model="query" />
    shared/
      SearchInput.vue        ← defineModel<string>({ required: true })
    events/
      EventList.vue          ← consomme <SearchInput v-model="eventSearch" />
```

> `SearchInput` illustre le principe de **composant headless de saisie** : il ne sait rien du contexte (famille ou événement), il expose juste un `v-model` et le parent gère la logique.

---

## 6. Points clés

1. `@click` est le raccourci de `v-on:click` — utilise toujours `@` en pratique.
2. Pour passer tes propres arguments + l'objet événement, utilise une arrow function dans le template : `@click="(e) => handler(id, e)"`.
3. `.prevent` remplace `event.preventDefault()` — indispensable sur `@submit` pour empêcher le rechargement de page.
4. `.stop` remplace `event.stopPropagation()` — utile pour les éléments cliquables imbriqués.
5. `.enter`, `.esc`, `.tab`… remplacent les vérifications manuelles de `event.key` sur `@keyup`/`@keydown`.
6. `v-model` sur un input natif est un raccourci pour `:value` + `@input` — il gère le two-way binding automatiquement.
7. Sur une checkbox seule, `v-model` bind un booléen ; sur plusieurs checkboxes liées au même tableau, il gère les ajouts/retraits.
8. `defineModel<T>()` (Vue 3.4+) remplace `defineProps<{ modelValue: T }>()` + `defineEmits<{ 'update:modelValue': [T] }>()` en une ligne.
9. `defineModel('nom')` expose `v-model:nom` côté parent — plusieurs `defineModel` nommés = plusieurs `v-model` nommés.
10. Muter `props.modelValue` directement est une erreur — toujours passer par `defineModel` ou `emit('update:modelValue', val)`.

---

## 7. Seeds Anki

```
Quelle est la différence entre @click="handler" et @click="handler()"?|Avec parenthèses, tu appelles la fonction immédiatement au rendu — handler() retourne undefined, pas la fonction. Sans parenthèses, @click="handler" passe la référence : Vue l'appelle à chaque clic avec l'objet MouseEvent.
Que fait .prevent dans @submit.prevent?|Appelle automatiquement event.preventDefault() avant le handler, empêchant le rechargement de page (comportement HTML natif du formulaire). Équivalent à écrire event.preventDefault() en premier dans le handler.
Comment passer un argument custom ET l'objet événement dans un handler @click?|Arrow function dans le template : @click="(e) => handler(id, e)". Ou avec $event : @click="handler(id, $event)".
Quelle est la différence entre @input et v-model sur un input?|@input déclenche un callback mais ne met pas à jour de ref. v-model crée un two-way binding : il écoute @input ET met à jour la ref ET synchronise le DOM quand la ref change via le code.
Que retourne v-model sur une checkbox : booléen ou string?|Booléen (true/false) si une seule checkbox est liée à la ref. Tableau des values cochées si plusieurs checkboxes partagent le même v-model lié à un ref<string[]>([]).
Quelle est la syntaxe defineModel pour un v-model:title côté parent?|const title = defineModel<string>('title') — l'argument string 'title' correspond au nom du v-model dans le parent : <MonComposant v-model:title="pageTitle" />.
Pourquoi ne peut-on pas muter props.modelValue directement dans un enfant?|Les props sont en lecture seule dans Vue — les muter viole le flux unidirectionnel. Avec defineModel, on mute model.value qui émet update:modelValue automatiquement. Sans defineModel, on émet l'événement : emit('update:modelValue', newVal).
```

---

## Pont vers le lab

> Lab associé : `labs/lab-04-evenements-et-v-model/README.md`. Construire `InvitationForm.vue` et `SearchInput.vue` de A à Z avec `vue-tsc --noEmit` comme oracle — corrigé commenté intégral + variante J+30.
