# Correction – Exercice 07 : Options API vs Composition API

## Résultat attendu

Tu dois voir **deux listes d'utilisateurs côte à côte**, identiques en apparence et en comportement :
- **À gauche** : écrite en **Options API** (ancienne façon, toujours valide)
- **À droite** : écrite en **Composition API** (façon moderne, recommandée en Vue 3)

Chaque liste permet de :
- **Ajouter** un utilisateur (champ texte + bouton)
- **Filtrer** par nom (barre de recherche)
- **Basculer** l'état actif/inactif d'un utilisateur (clic sur le nom)
- **Supprimer** un utilisateur (bouton ✕)
- Voir le **total** d'utilisateurs dans la console (via un watcher)

---

## Structure des fichiers

```
07-options-vs-composition/
├── OptionsVsComposition.vue              ← composant parent (affiche les deux côte à côte)
├── components/
│   ├── UserListOptions.vue               ← liste en Options API
│   └── UserListComposition.vue           ← liste en Composition API (même comportement)
└── types.ts                              ← types TypeScript (déjà fourni)
```

---

## types.ts (rappel, déjà fourni)

```ts
// Interface User : un utilisateur a un id, un nom et un état actif/inactif.
export interface User {
  id: number;
  name: string;
  active: boolean;
}
```

---

## Fichier 1 — OptionsVsComposition.vue (composant parent)

```vue
<!-- OptionsVsComposition.vue -->
<!-- Composant parent qui affiche les deux implémentations côte à côte -->
<!-- Son seul rôle : importer et afficher les deux composants enfants -->

<script setup lang="ts">
// On importe les deux composants enfants
// Vue les reconnaîtra automatiquement avec <UserListOptions /> et <UserListComposition /> dans le template
import UserListOptions from "./components/UserListOptions.vue";
import UserListComposition from "./components/UserListComposition.vue";
// Ce composant parent n'a PAS de logique propre : il est purement "structurel"
</script>

<template>
  <div class="comparison">
    <h2>Options API vs Composition API</h2>
    <p class="subtitle">
      Même comportement, deux façons d'écrire le code.
    </p>

    <!-- Grille 2 colonnes : Options API à gauche, Composition API à droite -->
    <div class="columns">

      <!-- COLONNE GAUCHE : Options API -->
      <div class="column">
        <div class="column-header options-header">
          <h3>Options API</h3>
          <span class="badge">Vue 2 · Vue 3</span>
        </div>
        <!-- Le composant UserListOptions.vue s'affiche ici -->
        <UserListOptions />
      </div>

      <!-- COLONNE DROITE : Composition API -->
      <div class="column">
        <div class="column-header composition-header">
          <h3>Composition API</h3>
          <span class="badge">Vue 3 · Recommandé</span>
        </div>
        <!-- Le composant UserListComposition.vue s'affiche ici -->
        <UserListComposition />
      </div>

    </div>
  </div>
</template>

<style scoped>
.comparison {
  max-width: 900px;
  margin: 2rem auto;
  padding: 1rem;
  font-family: sans-serif;
}

.comparison h2 {
  text-align: center;
  margin-bottom: 0.5rem;
}

.subtitle {
  text-align: center;
  color: #6b7280;
  margin-bottom: 2rem;
}

.columns {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Deux colonnes égales */
  gap: 2rem;
}

/* Sur mobile, les colonnes s'empilent */
@media (max-width: 640px) {
  .columns {
    grid-template-columns: 1fr;
  }
}

.column {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden; /* Cache les coins du header qui dépasseraient */
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
}

.options-header {
  background: #fef3c7; /* Jaune clair → Options API */
}

.composition-header {
  background: #dbeafe; /* Bleu clair → Composition API */
}

.column-header h3 {
  margin: 0;
  font-size: 1rem;
}

.badge {
  font-size: 0.75rem;
  background: rgba(0,0,0,0.1);
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
}
</style>
```

---

## Fichier 2 — components/UserListOptions.vue (Options API)

```vue
<!-- UserListOptions.vue -->
<!-- Liste d'utilisateurs écrite en OPTIONS API -->
<!-- ═══════════════════════════════════════════════════════════════════════
     OPTIONS API : le code est organisé PAR TYPE d'option (data, computed, methods, watch).
     C'est la façon "classique" de Vue 2, toujours supportée en Vue 3.
     Avantage : structure claire et familière pour les débutants.
     Inconvénient : quand le composant grossit, la logique d'une même fonctionnalité
     est éparpillée entre data, computed, methods, watch → difficile à lire.
     ═══════════════════════════════════════════════════════════════════════ -->

<script lang="ts">
// En Options API, on utilise defineComponent() (pas <script setup>)
// defineComponent() est une fonction helper qui améliore l'inférence des types TypeScript
import { defineComponent } from "vue";
import type { User } from "../types";

// defineComponent({ ... }) : on passe un objet de configuration
// Toutes les options (data, computed, methods, watch) sont des propriétés de cet objet
export default defineComponent({

  // name : le nom du composant (utile pour le débogage dans Vue DevTools)
  name: "UserListOptions",

  // ─────────────────────────────
  // DATA : les données réactives
  // ─────────────────────────────
  // data() est une FONCTION qui retourne un objet.
  // Chaque propriété de cet objet devient une variable réactive.
  // Pourquoi une fonction et pas un objet direct ?
  //   → Pour que chaque instance du composant ait sa PROPRE copie des données.
  //   Si c'était un objet partagé, toutes les instances modifieraient les mêmes données !
  data() {
    return {
      // La liste des utilisateurs (avec quelques données initiales)
      users: [
        { id: 1, name: "Alice",   active: true  },
        { id: 2, name: "Bob",     active: false },
        { id: 3, name: "Charlie", active: true  },
      ] as User[], // "as User[]" = assertion de type TypeScript

      // Le texte du champ "Ajouter un utilisateur"
      newName: "" as string,

      // Le texte de la barre de recherche
      search: "" as string,

      // Compteur pour générer des IDs uniques
      nextId: 4 as number,
    };
  },

  // ─────────────────────────────
  // COMPUTED : valeurs calculées
  // ─────────────────────────────
  // Chaque computed est une propriété de l'objet computed.
  // On y accède avec this.filteredUsers (comme this.users pour les data).
  computed: {
    // filteredUsers : liste filtrée selon la recherche
    // "this" dans les Options API désigne l'instance du composant
    // On peut accéder à this.users, this.search, etc. depuis n'importe quelle option
    filteredUsers(): User[] {
      // Si la recherche est vide, on retourne tous les utilisateurs
      if (!this.search.trim()) return this.users;
      // Sinon on filtre par nom (insensible à la casse)
      return this.users.filter((user) =>
        user.name.toLowerCase().includes(this.search.toLowerCase().trim())
      );
    },
  },

  // ─────────────────────────────
  // METHODS : fonctions
  // ─────────────────────────────
  // Chaque méthode est une fonction de l'objet methods.
  // On peut les appeler depuis le template avec @click="addUser"
  // ou depuis d'autres méthodes avec this.addUser().
  methods: {
    // addUser() : ajoute un nouvel utilisateur à la liste
    addUser() {
      // this.newName → accès à la data "newName" via this
      if (this.newName.trim() === "") return; // Ne rien faire si vide

      // this.users → accès au tableau réactif via this
      this.users.push({
        id: this.nextId++,
        name: this.newName.trim(),
        active: true, // Nouvel utilisateur actif par défaut
      });

      this.newName = ""; // Vider le champ après ajout
    },

    // removeUser() : supprime un utilisateur par son ID
    removeUser(id: number) {
      // this.users = ... : on réassigne le tableau filtré
      this.users = this.users.filter((user) => user.id !== id);
    },

    // toggleActive() : bascule l'état actif/inactif d'un utilisateur
    toggleActive(id: number) {
      const user = this.users.find((u) => u.id === id);
      if (user) user.active = !user.active;
    },
  },

  // ─────────────────────────────
  // WATCH : surveiller des données
  // ─────────────────────────────
  // Chaque watcher est une propriété de l'objet watch.
  // Le nom de la propriété doit correspondre exactement au nom de la data/computed à surveiller.
  watch: {
    // Surveille "users" (la data déclarée plus haut)
    // handler : la fonction appelée quand users change
    // deep: true : surveille aussi les MUTATIONS internes du tableau
    //   (sans deep, Vue ne détecte que si on remplace tout le tableau,
    //    pas si on modifie un élément à l'intérieur)
    users: {
      handler(newUsers: User[]) {
        // this.users.length ne fonctionne pas ici (newUsers est le paramètre)
        console.log("[Options API] Total utilisateurs :", newUsers.length);
      },
      deep: true, // Surveille les modifications internes (active toggle, etc.)
    },
  },
});
</script>

<template>
  <!-- En Options API, le template fonctionne exactement pareil qu'en Composition API -->
  <!-- Les refs comme "this.users" sont accessibles directement sans "this" dans le template -->
  <div class="user-list">

    <!-- BARRE DE RECHERCHE -->
    <!-- v-model lie le champ à la data "search" -->
    <input
      v-model="search"
      type="search"
      placeholder="Rechercher..."
      class="search-input"
    />

    <!-- FORMULAIRE D'AJOUT -->
    <div class="add-form">
      <input
        v-model="newName"
        @keyup.enter="addUser"
        type="text"
        placeholder="Nom de l'utilisateur"
        class="name-input"
      />
      <button @click="addUser" class="btn-add">+ Ajouter</button>
    </div>

    <!-- LISTE DES UTILISATEURS -->
    <!-- On utilise filteredUsers (le computed) pour afficher les résultats filtrés -->
    <ul v-if="filteredUsers.length > 0">
      <li
        v-for="user in filteredUsers"
        :key="user.id"
        :class="{ inactive: !user.active }"
      >
        <!-- Clic sur le nom pour basculer actif/inactif -->
        <span @click="toggleActive(user.id)" class="user-name" title="Cliquer pour activer/désactiver">
          <!-- Indicateur visuel de l'état : ● actif · ○ inactif -->
          <span class="status-dot">{{ user.active ? "●" : "○" }}</span>
          {{ user.name }}
        </span>
        <button @click="removeUser(user.id)" class="btn-remove">✕</button>
      </li>
    </ul>
    <p v-else class="empty">Aucun utilisateur trouvé.</p>

    <!-- COMPTEUR -->
    <footer>
      {{ users.length }} utilisateur{{ users.length > 1 ? "s" : "" }} au total
    </footer>

  </div>
</template>

<style scoped>
/* Les styles sont identiques entre les deux composants pour bien montrer
   que la SEULE différence est dans le <script> */
.user-list {
  padding: 1rem;
}

.search-input,
.name-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.4rem 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.add-form {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.add-form .name-input {
  flex: 1;
  margin-bottom: 0; /* Annule le margin-bottom pour l'alignement horizontal */
}

.btn-add {
  white-space: nowrap;
  padding: 0.4rem 0.8rem;
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.btn-add:hover {
  background: #15803d;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0;
  border-bottom: 1px solid #f3f4f6;
}

/* Classe ajoutée via :class="{ inactive: !user.active }" */
li.inactive .user-name {
  opacity: 0.45;
  text-decoration: line-through;
}

.user-name {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.95rem;
}

.user-name:hover {
  color: #3b82f6;
}

.status-dot {
  font-size: 0.6rem;
  color: #6b7280;
}

.btn-remove {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.2rem;
}

footer {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: #6b7280;
  border-top: 1px solid #e5e7eb;
  padding-top: 0.5rem;
}

.empty {
  color: #9ca3af;
  font-style: italic;
  font-size: 0.9rem;
}
</style>
```

---

## Fichier 3 — components/UserListComposition.vue (Composition API)

```vue
<!-- UserListComposition.vue -->
<!-- Liste d'utilisateurs écrite en COMPOSITION API -->
<!-- ═══════════════════════════════════════════════════════════════════════
     COMPOSITION API : le code est organisé PAR FONCTIONNALITÉ.
     C'est la façon moderne recommandée en Vue 3.
     Avantage : toute la logique d'une fonctionnalité est au même endroit.
     Avantage : le code peut être extrait dans des "composables" (fonctions réutilisables).
     Syntaxe : plus proche du JavaScript "pur", pas besoin de "this".
     ═══════════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
// <script setup> : syntaxe "sucre syntaxique" (simplifiée) de la Composition API.
// Tout ce qu'on déclare ici est automatiquement disponible dans le template.
// Pas besoin de "return { ... }" comme on devrait le faire avec setup() classique.
import { ref, computed, watch } from "vue";
import type { User } from "../types";

// ─────────────────────────────────────────────
// DONNÉES RÉACTIVES : ref() au lieu de data()
// ─────────────────────────────────────────────
// ref() crée une variable réactive.
// On accède à sa valeur avec .value dans le <script>.
// Dans le template, Vue enlève automatiquement le .value (on écrit juste "users", pas "users.value").

const users = ref<User[]>([
  // Mêmes données initiales qu'en Options API → comportement identique
  { id: 1, name: "Alice",   active: true  },
  { id: 2, name: "Bob",     active: false },
  { id: 3, name: "Charlie", active: true  },
]);

const newName = ref(""); // Équivalent de newName: "" dans data()
const search = ref("");  // Équivalent de search: "" dans data()
let nextId = 4;          // Pas réactif (juste un compteur interne, pas affiché)

// ─────────────────────────────────────────────
// VALEURS CALCULÉES : computed() au lieu de l'option computed: { ... }
// ─────────────────────────────────────────────
// computed() prend une fonction et retourne une valeur calculée automatiquement.
// Pas de "this" : on accède directement aux refs avec .value.

const filteredUsers = computed<User[]>(() => {
  // search.value (et non this.search comme en Options API)
  if (!search.value.trim()) return users.value;
  return users.value.filter((user) =>
    user.name.toLowerCase().includes(search.value.toLowerCase().trim())
  );
});

// ─────────────────────────────────────────────
// FONCTIONS : déclarées directement au lieu de methods: { ... }
// ─────────────────────────────────────────────
// Ce sont des fonctions JavaScript normales.
// Pas de "this" : on accède aux refs avec .value.

function addUser() {
  // newName.value (et non this.newName comme en Options API)
  if (newName.value.trim() === "") return;

  users.value.push({
    id: nextId++,
    name: newName.value.trim(),
    active: true,
  });

  newName.value = ""; // Vider le champ
}

function removeUser(id: number) {
  // users.value = ... (et non this.users = ... comme en Options API)
  users.value = users.value.filter((user) => user.id !== id);
}

function toggleActive(id: number) {
  const user = users.value.find((u) => u.id === id);
  if (user) user.active = !user.active;
}

// ─────────────────────────────────────────────
// WATCHERS : watch() au lieu de l'option watch: { ... }
// ─────────────────────────────────────────────
// watch(source, callback, options) est une fonction appelée directement.
// Source : la ref à surveiller (on passe la ref elle-même, pas .value)
// Callback : la fonction appelée quand la valeur change
// Options : objet { deep, immediate, ... }

watch(
  users,          // On surveille la ref users (pas users.value !)
  (newUsers) => { // Callback appelé quand users change
    console.log("[Composition API] Total utilisateurs :", newUsers.length);
  },
  { deep: true }  // deep: true surveille aussi les mutations internes du tableau
);
</script>

<template>
  <!-- Le template est IDENTIQUE à celui de UserListOptions.vue -->
  <!-- C'est l'objectif de l'exercice : montrer que le template ne change pas,
       seul le <script> est différent entre les deux APIs -->
  <div class="user-list">

    <input
      v-model="search"
      type="search"
      placeholder="Rechercher..."
      class="search-input"
    />

    <div class="add-form">
      <input
        v-model="newName"
        @keyup.enter="addUser"
        type="text"
        placeholder="Nom de l'utilisateur"
        class="name-input"
      />
      <button @click="addUser" class="btn-add">+ Ajouter</button>
    </div>

    <ul v-if="filteredUsers.length > 0">
      <li
        v-for="user in filteredUsers"
        :key="user.id"
        :class="{ inactive: !user.active }"
      >
        <span @click="toggleActive(user.id)" class="user-name" title="Cliquer pour activer/désactiver">
          <span class="status-dot">{{ user.active ? "●" : "○" }}</span>
          {{ user.name }}
        </span>
        <button @click="removeUser(user.id)" class="btn-remove">✕</button>
      </li>
    </ul>
    <p v-else class="empty">Aucun utilisateur trouvé.</p>

    <!-- users.length fonctionne directement dans le template sans .value -->
    <footer>
      {{ users.length }} utilisateur{{ users.length > 1 ? "s" : "" }} au total
    </footer>

  </div>
</template>

<style scoped>
/* Styles identiques à UserListOptions.vue volontairement */
.user-list {
  padding: 1rem;
}

.search-input,
.name-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.4rem 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.add-form {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.add-form .name-input {
  flex: 1;
  margin-bottom: 0;
}

.btn-add {
  white-space: nowrap;
  padding: 0.4rem 0.8rem;
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.btn-add:hover {
  background: #15803d;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0;
  border-bottom: 1px solid #f3f4f6;
}

li.inactive .user-name {
  opacity: 0.45;
  text-decoration: line-through;
}

.user-name {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.95rem;
}

.user-name:hover {
  color: #3b82f6;
}

.status-dot {
  font-size: 0.6rem;
  color: #6b7280;
}

.btn-remove {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.2rem;
}

footer {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: #6b7280;
  border-top: 1px solid #e5e7eb;
  padding-top: 0.5rem;
}

.empty {
  color: #9ca3af;
  font-style: italic;
  font-size: 0.9rem;
}
</style>
```

---

## Tableau comparatif côte à côte

| | Options API | Composition API |
|---|---|---|
| **Syntaxe script** | `export default defineComponent({ ... })` | `<script setup lang="ts">` |
| **Données réactives** | `data() { return { name: "" } }` | `const name = ref("")` |
| **Accès aux données** | `this.name` dans le script | `name.value` dans le script |
| **Accès dans template** | `{{ name }}` (pas de `this`) | `{{ name }}` (pas de `.value`) |
| **Valeurs calculées** | `computed: { full() { return this.x } }` | `const full = computed(() => x.value)` |
| **Fonctions/méthodes** | `methods: { doThing() { this.x = 1 } }` | `function doThing() { x.value = 1 }` |
| **Surveiller des données** | `watch: { name(val) { ... }, deep: true }` | `watch(name, (val) => { ... }, { deep: true })` |
| **Cycle de vie** | `mounted() { ... }` | `onMounted(() => { ... })` |
| **Organisation du code** | Par type d'option (data / computed / methods) | Par fonctionnalité (tout ensemble) |
| **TypeScript** | Plus verbeux (`as User[]`, types via options) | Naturel (`ref<User[]>([])`) |
| **Réutilisabilité** | Mixins (difficiles, déconseillées) | Composables (fonctions `useXxx()`) |

---

## Ce que tu aurais pu oublier

### 1. Oublier `.value` dans le `<script>` (Composition API)
```ts
// ❌ FAUX : on oublie .value dans le script
const users = ref<User[]>([]);

function addUser() {
  users.push({ id: 1, name: "Alice", active: true }); // ← Erreur ! users est un objet Ref, pas un tableau
}

// ✅ CORRECT : .value donne accès au tableau sous-jacent
function addUser() {
  users.value.push({ id: 1, name: "Alice", active: true }); // ✓
}
```
> Dans le `<template>`, Vue "déballe" automatiquement les refs → pas besoin de `.value`. Mais dans le `<script>`, il faut toujours écrire `.value`.

---

### 2. Confondre `this` en Options API
```ts
// Options API : TOUJOURS utiliser "this" pour accéder aux données, computed, méthodes
export default defineComponent({
  data() {
    return { count: 0 };
  },
  methods: {
    increment() {
      this.count++; // ✓ this.count accède à la data "count"
      count++;      // ❌ count n'est pas défini dans ce scope
    }
  }
});
```

---

### 3. Oublier `deep: true` pour surveiller les mutations internes d'un tableau/objet
```ts
// ❌ Sans deep, Vue ne détecte que si on REMPLACE le tableau entier
watch(users, (newVal) => {
  console.log("users a changé");
});
// → Si on fait users.value.push(...) ou users.value[0].active = true,
//   le watcher NE SE DÉCLENCHE PAS car la référence du tableau n'a pas changé.

// ✅ Avec deep: true, Vue surveille aussi les modifications internes
watch(users, (newVal) => {
  console.log("users a changé (ou un de ses éléments)");
}, { deep: true });
// → Se déclenche aussi pour push(), pop(), et modifications de propriétés internes
```

---

### 4. Quelle API utiliser sur un nouveau projet ?
> **Recommandation officielle Vue 3** :
> - **Nouveau projet** → utilise la **Composition API** (`<script setup>`)
> - **Projet existant Vue 2** → reste en Options API ou migre progressivement
> - Les deux APIs sont **100% valides** et **supportées à long terme**
> - La Composition API est plus adaptée aux grands projets et à TypeScript

---

## Concepts clés utilisés

| Concept | Options API | Composition API |
|---|---|---|
| Données réactives | `data() { return { x: 0 } }` | `const x = ref(0)` |
| Accès aux données | `this.x` | `x.value` |
| Calculé | `computed: { y() { return this.x * 2 } }` | `const y = computed(() => x.value * 2)` |
| Méthode | `methods: { fn() { this.x++ } }` | `function fn() { x.value++ }` |
| Watcher | `watch: { x(val) { ... }, deep: true }` | `watch(x, val => { ... }, { deep: true })` |
| Lifecycle | `mounted() { ... }` | `onMounted(() => { ... })` |
| `defineComponent` | Obligatoire pour les types TypeScript | Non utilisé avec `<script setup>` |
| `export default` | Obligatoire | Non nécessaire avec `<script setup>` |
