# 01 — Composition API avancée : surveiller et réagir aux données

## C'est quoi la "Composition API avancée" ?

Dans les chapitres précédents, tu as appris les bases : `ref()`, `reactive()`, `computed()`.
C'est comme apprendre à poser des briques. Maintenant, on va apprendre à **installer des caméras de surveillance** sur nos données, et quelques outils supplémentaires.

**Ce que tu vas apprendre ici :**

- `watch` et `watchEffect` → surveiller tes données et réagir quand elles changent
- `provide` / `inject` → passer des données en profondeur sans faire la chaîne
- `nextTick` → attendre que Vue ait fini de mettre à jour la page
- `effectScope` → regrouper et nettoyer tes surveillances proprement

---

## 📌 Rappel JavaScript : les callbacks (fonctions passées en argument)

Avant d'attaquer `watch`, il faut se rappeler ce qu'est un **callback** en JavaScript.

Un callback, c'est simplement **une fonction qu'on donne à une autre fonction**, pour qu'elle l'appelle plus tard.

```js
// Exemple simple de callback en JavaScript pur

// setTimeout appelle notre fonction après 1 seconde
// La fonction () => { ... } est le "callback"
setTimeout(() => {
  console.log("1 seconde est passée !"); // Ce message apparaît après 1s
}, 1000);

// addEventListener appelle notre fonction à chaque clic
document.addEventListener("click", () => {
  console.log("Tu as cliqué !"); // Ce message apparaît à chaque clic
});
```

**Retiens :** un callback c'est UNE FONCTION qu'on passe en paramètre pour dire "appelle-moi quand il se passe quelque chose".

---

## `watch` — la caméra de surveillance dirigée 🎥

### L'analogie

Imagine une **caméra de surveillance** braquée sur une porte précise.
Elle ne filme **que** cette porte. Dès que quelqu'un passe, elle déclenche une alerte.

`watch` fonctionne pareil : tu lui dis **quelle donnée surveiller**, et tu lui donnes **une fonction (callback) à exécuter** quand cette donnée change.

```ts
import { ref, watch } from "vue"; // On importe ref ET watch depuis Vue

// On crée une donnée réactive : le texte de recherche
const search = ref<string>(""); // search commence vide ("")

// watch() prend 2 arguments :
// 1. La donnée à surveiller (search)
// 2. Le callback : que faire quand ça change
watch(search, (newVal, oldVal) => {
  // newVal = la nouvelle valeur (ce que l'utilisateur vient de taper)
  // oldVal = l'ancienne valeur (ce qu'il y avait avant)
  console.log(`Recherche : "${oldVal}" → "${newVal}"`);
  fetchResults(newVal); // On lance une recherche avec la nouvelle valeur
});
```

**En résumé :** `watch(quoi_surveiller, que_faire_quand_ça_change)`

---

### Les options de watch

`watch` accepte un 3e argument : un objet d'options.

#### `immediate: true` — exécuter aussi au démarrage

Par défaut, `watch` attend que la donnée change. Avec `immediate: true`, il s'exécute **tout de suite** au montage du composant, comme si la donnée venait de changer.

```ts
watch(
  search,                    // 1. Quoi surveiller
  (val) => {                 // 2. Que faire (val = la valeur actuelle)
    fetchResults(val);       //    → on lance la recherche
  },
  { immediate: true },       // 3. Option : exécuter aussi immédiatement
);
// Sans immediate, il faudrait attendre que search change
// Avec immediate, la recherche se lance dès le chargement de la page
```

#### `deep: true` — surveiller en profondeur (pour les objets)

Par défaut, `watch` ne détecte que les changements "en surface".
Si tu surveilles un objet, changer une propriété à l'intérieur ne serait pas détecté.
`deep: true` dit à la caméra : "regarde AUSSI à l'intérieur de l'objet".

```ts
import { reactive, watch } from "vue";

// Un objet réactif avec plusieurs filtres
const filters = reactive({
  category: "tous",          // filtre par catégorie
  minPrice: 0,               // prix minimum
  maxPrice: 100,             // prix maximum
});

watch(
  filters,                   // 1. On surveille l'objet filters
  (val) => {                 // 2. Que faire quand ça change
    applyFilters(val);       //    → on applique les nouveaux filtres
  },
  { deep: true },            // 3. Surveiller AUSSI les changements internes
);
// Maintenant, si filters.minPrice passe de 0 à 20, le watch réagit
```

---

### Surveiller plusieurs données en même temps

Tu peux donner un **tableau** de données à surveiller. Le callback recevra des tableaux aussi.

```ts
import { ref, watch } from "vue";

const search = ref<string>("");   // Le texte de recherche
const page = ref<number>(1);      // Le numéro de page actuel

// On surveille search ET page en même temps
// Les valeurs arrivent sous forme de tableaux : [valeur1, valeur2]
watch(
  [search, page],                                        // Tableau de sources
  ([newSearch, newPage], [oldSearch, oldPage]) => {       // Tableaux de valeurs
    // newSearch = nouvelle valeur de search
    // oldSearch = ancienne valeur de search
    // newPage = nouvelle valeur de page
    // oldPage = ancienne valeur de page

    if (newSearch !== oldSearch) {
      // Si la recherche a changé, on revient à la page 1
      page.value = 1;
    }
    fetchResults(newSearch, newPage); // On relance la recherche
  }
);
```

---

### Surveiller une propriété d'un objet `reactive`

Si tu veux surveiller UNE SEULE propriété d'un objet `reactive`, il faut passer **une fonction fléchée** qui retourne cette propriété :

```ts
import { reactive, watch } from "vue";

const state = reactive({
  count: 0,     // Un compteur
  name: "",     // Un nom
});

// ⚠️ On ne peut pas écrire watch(state.count, ...)
//    car state.count est juste un nombre (pas réactif tout seul)

// ✅ On utilise une "fonction getter" : () => state.count
//    C'est une fonction qui retourne la valeur qu'on veut surveiller
watch(
  () => state.count,         // Fonction qui retourne la valeur à surveiller
  (newVal) => {              // Callback quand ça change
    console.log("count:", newVal);
  },
);
```

---

## `watchEffect` — la caméra intelligente 🤖

### L'analogie

Si `watch` est une caméra **braquée sur une porte précise**, alors `watchEffect` est une **caméra à détection de mouvement** : elle détecte automatiquement tout ce qui bouge dans son champ.

Tu n'as **pas besoin de lui dire quoi surveiller**. Elle le devine toute seule en regardant quelles données réactives tu utilises dans le code.

```ts
import { ref, watchEffect } from "vue";

const search = ref<string>("");   // Texte de recherche
const page = ref<number>(1);      // Numéro de page

// watchEffect exécute cette fonction immédiatement,
// et la ré-exécute automatiquement chaque fois que search OU page change.
// Il n'y a pas besoin de dire "surveille search et page" :
// Vue le détecte automatiquement car on utilise search.value et page.value
watchEffect(() => {
  console.log(`search = ${search.value}, page = ${page.value}`);
  // Dès que search.value OU page.value change → cette fonction se relance
});
```

---

### `watch` vs `watchEffect` — lequel choisir ?

| Critère              | `watch` 🎥                          | `watchEffect` 🤖                     |
| -------------------- | ----------------------------------- | ------------------------------------- |
| Dépendances          | Tu les déclares toi-même            | Détectées automatiquement             |
| Accès ancien/nouveau | ✅ Oui (`oldVal`, `newVal`)          | ❌ Non                                 |
| Exécution au départ  | ❌ Non (sauf `immediate: true`)      | ✅ Oui, toujours                       |
| Utilise quand...     | Tu veux comparer avant/après        | Tu veux juste réagir sans comparer    |

**Conseil :** commence par `watch` si tu as besoin de l'ancienne ET de la nouvelle valeur. Sinon, `watchEffect` est souvent plus simple.

---

## Stopper un watcher (éteindre la caméra) 🔴

`watch` et `watchEffect` retournent une **fonction** qui permet de les arrêter.
C'est utile pour économiser de la mémoire quand tu n'en as plus besoin.

```ts
// watch() retourne une fonction "stop"
const stop = watch(search, (val) => {
  fetchResults(val);          // Se lance à chaque changement de search
});

// Plus tard, quand on n'en a plus besoin...
stop(); // Arrête le watcher. Il ne réagira plus du tout.

// Pareil pour watchEffect :
const stopEffect = watchEffect(() => {
  console.log(search.value);
});
stopEffect(); // Arrête cet effet
```

---

## `watchEffect` avec nettoyage (cleanup)

### 📌 Rappel JavaScript : `fetch` et annulation de requêtes

```js
// En JS, fetch() envoie une requête HTTP (comme un courrier)
// AbortController permet d'ANNULER cette requête en cours de route

const controller = new AbortController(); // On crée un "interrupteur"

fetch("/api/data", {
  signal: controller.signal,  // On branche l'interrupteur sur la requête
});

controller.abort(); // On appuie sur l'interrupteur → la requête est annulée
```

### Le problème

Imagine : l'utilisateur tape "a", puis "ab", puis "abc" très vite.
Trois requêtes partent. Mais seule la dernière nous intéresse !
Il faut **annuler les anciennes** à chaque fois.

```ts
import { ref, watchEffect } from "vue";

const search = ref<string>("");

watchEffect((onCleanup) => {
  // onCleanup est une fonction fournie par Vue
  // Elle te permet de "nettoyer" avant la prochaine exécution

  const controller = new AbortController(); // Crée un interrupteur

  // Lance la requête HTTP avec l'interrupteur branché
  fetch(`/api/search?q=${search.value}`, {
    signal: controller.signal,
  });

  // Ce code s'exécutera AVANT la prochaine exécution du watchEffect
  // (ou quand le composant est détruit)
  onCleanup(() => {
    controller.abort(); // Annule la requête en cours
  });
});
// Résultat : à chaque frappe, l'ancienne requête est annulée proprement
```

---

## `provide` / `inject` — le tunnel de données 🚇

### Le problème : la "chaîne de props" (prop drilling)

Imagine un immeuble de 10 étages. Si le rez-de-chaussée veut envoyer un colis au 10e étage, il faut le passer d'étage en étage : 1er → 2e → 3e → ... → 10e. Chaque étage doit "transporter" le colis même s'il ne l'utilise pas.

En Vue, c'est pareil avec les props : si un grand-parent veut passer des données à un arrière-petit-enfant, chaque composant intermédiaire doit déclarer et passer le prop.

`provide` / `inject` résout ce problème : c'est comme un **ascenseur** qui transporte directement les données du grand-parent vers n'importe quel descendant.

### Étape 1 : Créer une clé typée

```ts
// types.ts — Ce fichier définit le "nom de l'ascenseur"
import type { InjectionKey, Ref } from "vue";

// On définit la forme de nos données utilisateur
export interface AuthUser {
  id: number;       // Identifiant unique
  name: string;     // Nom de l'utilisateur
  role: string;     // Rôle (admin, user, etc.)
}

// InjectionKey est une clé unique qui dit à TypeScript :
// "la donnée qui circule dans cet ascenseur est de type Ref<AuthUser | null>"
// Symbol("auth") crée un identifiant unique (impossible d'avoir des doublons)
export const AuthKey: InjectionKey<Ref<AuthUser | null>> = Symbol("auth");
```

### Étape 2 : Le parent "fournit" les données (provide)

```vue
<!-- GrandParent.vue — Le composant qui ENVOIE les données -->
<script setup lang="ts">
import { provide, ref } from "vue";
import { AuthKey } from "./types";       // On importe la clé
import type { AuthUser } from "./types"; // On importe le type

// On crée la donnée utilisateur
const user = ref<AuthUser | null>({
  id: 1,
  name: "Alice",
  role: "admin",
});

// provide() = "je mets cette donnée dans l'ascenseur"
// Tous mes descendants (enfants, petits-enfants, etc.) pourront y accéder
provide(AuthKey, user);
</script>
```

### Étape 3 : Un descendant "injecte" les données (inject)

```vue
<!-- DeepChild.vue — Un composant profondément imbriqué -->
<script setup lang="ts">
import { inject } from "vue";
import { AuthKey } from "./types"; // Même clé que le parent

// inject() = "je récupère la donnée depuis l'ascenseur"
// Grâce à AuthKey, TypeScript sait que user est Ref<AuthUser | null>
const user = inject(AuthKey);
// ⚠️ user peut aussi être undefined si aucun parent n'a fait provide()
</script>

<template>
  <!-- v-if vérifie que user existe avant d'afficher -->
  <p v-if="user">Connecté : {{ user.name }}</p>
  <p v-else>Non connecté</p>
</template>
```

### ✅ Règle d'or : toujours utiliser `InjectionKey<T>` pour le typage

Sans `InjectionKey`, TypeScript ne sait pas quel type de donnée circule, et tu perds l'autocomplétion et la vérification de types.

---

## `nextTick` — attendre que Vue ait fini de peindre 🖌️

### L'analogie

Quand tu changes une donnée réactive, Vue **ne met pas à jour le DOM immédiatement**.
C'est comme donner un ordre à un peintre : tu dis "peins le mur en bleu", mais le peintre ne peut pas finir instantanément. Il faut **attendre** qu'il ait fini avant de mesurer la couleur du mur.

`nextTick()` te permet d'attendre que Vue ait terminé de mettre à jour la page.

### 📌 Rappel JavaScript : `async` / `await`

```js
// async/await est une façon d'écrire du code qui "attend" un résultat

// async devant la fonction = "cette fonction contient des attentes"
async function exemple() {
  // await = "attends que cette opération soit finie avant de continuer"
  const resultat = await fetch("/api/data"); // On attend la réponse
  console.log(resultat); // Ce code ne s'exécute QU'APRÈS la réponse
}
```

### Utilisation de `nextTick`

```ts
import { nextTick, ref } from "vue";

const message = ref<string>("Bonjour"); // Le message affiché sur la page

async function updateAndMeasure(): Promise<void> {
  message.value = "Nouveau message"; // On change la donnée

  // ⚠️ ICI, le DOM (la page HTML) n'est PAS encore mis à jour !
  // Vue a reçu l'ordre mais n'a pas encore "peint"

  await nextTick(); // On attend que Vue ait fini de mettre à jour le DOM

  // ✅ MAINTENANT le DOM est à jour !
  const el = document.querySelector(".message"); // On récupère l'élément HTML
  console.log(el?.textContent); // "Nouveau message" — c'est bien le nouveau texte
}
```

### Quand utiliser `nextTick` ?

- Quand tu veux **mesurer un élément** après une mise à jour (hauteur, largeur, position)
- Quand tu veux **faire un scroll** vers un élément qui vient d'apparaître
- Quand tu veux **donner le focus** à un input qui vient d'être affiché

---

## `effectScope` — le chef d'équipe des watchers 👷

### L'analogie

Imagine que tu installes 5 caméras dans un bâtiment. Sans organisation, tu dois te souvenir de chacune pour les éteindre une par une.

`effectScope` crée un **groupe** : tu mets toutes tes caméras dedans, et quand tu veux tout arrêter, un seul ordre suffit.

```ts
import { effectScope, ref, watch, watchEffect, computed } from "vue";

// On crée un "groupe" pour regrouper plusieurs effets réactifs
const scope = effectScope();

const count = ref<number>(0); // Un compteur

// scope.run() exécute une fonction et "capture" tous les effets à l'intérieur
scope.run(() => {
  // Cet effet est automatiquement rattaché au scope
  watchEffect(() => {
    console.log("count =", count.value);
  });

  // Ce watch aussi est rattaché au scope
  watch(count, (newVal) => {
    console.log("count a changé :", newVal);
  });

  // Ce computed aussi !
  const double = computed(() => count.value * 2);
});

// Plus tard, quand on veut tout nettoyer d'un coup :
scope.stop(); // Arrête TOUS les watchers/effets/computed du groupe en une seule ligne
```

### Quand utiliser `effectScope` ?

- Quand tu crées des composables complexes avec plusieurs watchers
- Quand tu veux **nettoyer proprement** tous les effets d'un coup (par ex., quand un utilisateur se déconnecte)
- Dans les bibliothèques et les stores (Pinia l'utilise en interne)

---

## Récapitulatif

| Outil          | Rôle                                                   | Analogie                                |
| -------------- | ------------------------------------------------------ | --------------------------------------- |
| `watch`        | Surveille une donnée précise et réagit au changement   | 🎥 Caméra braquée sur une porte         |
| `watchEffect`  | Surveille automatiquement tout ce qui est utilisé      | 🤖 Caméra à détection de mouvement      |
| `provide`      | Fournit des données à tous les descendants             | 🚇 Met un colis dans l'ascenseur        |
| `inject`       | Récupère les données fournies par un ancêtre           | 🚇 Récupère le colis de l'ascenseur     |
| `nextTick`     | Attend que Vue ait fini de mettre à jour le DOM        | 🖌️ Attendre que le peintre ait fini    |
| `effectScope`  | Regroupe plusieurs effets pour les nettoyer ensemble   | 👷 Chef d'équipe qui gère les caméras   |

---

## 🎯 Pratique

### Exercice CA.1 — Watch simple

Complète ce code pour afficher un message quand `count` change :

```ts
import { ref, watch } from 'vue'

const count = ref(0)

// Affiche "count: ancienne valeur → nouvelle valeur" quand count change
// ???
```

<details>
<summary>Solution</summary>

```ts
import { ref, watch } from 'vue'

const count = ref(0)

watch(count, (newVal, oldVal) => {
  console.log(`count: ${oldVal} → ${newVal}`)
})
```
</details>

---

### Exercice CA.2 — Watch avec options

Complète ce code pour que la recherche soit lancée :
1. **Immédiatement** au chargement (pas besoin d'attendre un changement)
2. À chaque changement ultérieur de `search`

```ts
import { ref, watch } from 'vue'

const search = ref('')

function doSearch(term: string) {
  console.log('Recherche:', term)
}

// ???
```

<details>
<summary>Solution</summary>

```ts
import { ref, watch } from 'vue'

const search = ref('')

function doSearch(term: string) {
  console.log('Recherche:', term)
}

watch(search, (val) => {
  doSearch(val)
}, { immediate: true })
```
</details>

---

### Exercice CA.3 — watchEffect

Réécris ce code en utilisant `watchEffect` au lieu de `watch` :

```ts
import { ref, watch } from 'vue'

const firstName = ref('Jean')
const lastName = ref('Dupont')

watch([firstName, lastName], ([first, last]) => {
  document.title = `${first} ${last}`
}, { immediate: true })
```

<details>
<summary>Solution</summary>

```ts
import { ref, watchEffect } from 'vue'

const firstName = ref('Jean')
const lastName = ref('Dupont')

// watchEffect s'exécute immédiatement et détecte automatiquement les dépendances
watchEffect(() => {
  document.title = `${firstName.value} ${lastName.value}`
})
```
</details>

---

### Exercice CA.4 — provide/inject

Complète les composants suivants pour que `Child` affiche le thème fourni par `Parent` :

```vue
<!-- Parent.vue -->
<script setup lang="ts">
import { ref, ??? } from 'vue'
import Child from './Child.vue'

const theme = ref<'light' | 'dark'>('dark')

// Fournis "theme" à tous les descendants sous la clé "theme"
// ???
</script>
```

```vue
<!-- Child.vue -->
<script setup lang="ts">
import { ??? } from 'vue'

// Récupère la valeur fournie par l'ancêtre, ou 'light' par défaut
const theme = ???
</script>

<template>
  <p>Thème actuel : {{ theme }}</p>
</template>
```

<details>
<summary>Solution</summary>

```vue
<!-- Parent.vue -->
<script setup lang="ts">
import { ref, provide } from 'vue'
import Child from './Child.vue'

const theme = ref<'light' | 'dark'>('dark')

provide('theme', theme)
</script>
```

```vue
<!-- Child.vue -->
<script setup lang="ts">
import { inject, type Ref } from 'vue'

const theme = inject<Ref<'light' | 'dark'>>('theme', ref('light'))
</script>

<template>
  <p>Thème actuel : {{ theme }}</p>
</template>
```
</details>

---

### Exercice CA.5 — Arrêter un watcher

Complète ce code pour arrêter le watcher après 5 secondes :

```ts
import { ref, watchEffect } from 'vue'

const count = ref(0)

// ???

// Arrête le watcher après 5 secondes
setTimeout(() => {
  // ???
  console.log('Watcher arrêté')
}, 5000)
```

<details>
<summary>Solution</summary>

```ts
import { ref, watchEffect } from 'vue'

const count = ref(0)

const stopWatcher = watchEffect(() => {
  console.log('count =', count.value)
})

setTimeout(() => {
  stopWatcher()
  console.log('Watcher arrêté')
}, 5000)
```
</details>

---

## Suite

→ `cours/02-intermediaire/02-composables.md`
