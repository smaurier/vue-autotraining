# 04 — Événements et v-model

---

> **🔄 Rappel du cours précédent**
> Avant de continuer, vérifie que tu peux répondre à ces questions :
>
> 1. Quelle est la différence entre `ref()` et `reactive()` ?
> 2. À quoi sert `computed()` et quand l'utiliser ?
>
> <details>
> <summary>Vérifier mes réponses</summary>
>
> 1. `ref()` pour les valeurs simples (accès via `.value`), `reactive()` pour les objets (accès direct)
> 2. `computed()` crée une valeur dérivée qui se recalcule automatiquement quand ses dépendances changent
> </details>

---

## 🧠 Rappel JavaScript : c'est quoi un "événement" ?

Un **événement**, c'est **quelque chose qui se passe** sur ta page web.

Exemples d'événements du quotidien :

- Tu **cliques** sur un bouton → c'est un événement `click`
- Tu **tapes** sur le clavier → c'est un événement `keyup` ou `keydown`
- Tu **soumets** un formulaire → c'est un événement `submit`
- Ta souris **passe** sur un élément → c'est un événement `mouseover`

En JavaScript pur (sans Vue), tu écoutes les événements comme ça :

```ts
// 1. On récupère le bouton dans le HTML
const bouton: HTMLElement | null = document.querySelector("#monBouton");

// 2. On lui dit : "quand quelqu'un clique sur toi, exécute cette fonction"
bouton?.addEventListener("click", function (event: MouseEvent) {
  // 'event' est un objet qui contient les détails de ce qui s'est passé
  // Par exemple : ou était la souris au moment du clic
  console.log("Le bouton a été cliqué !");
  console.log("Position de la souris :", event.clientX, event.clientY);
});
```

C'est fonctionnel, mais c'est **verbeux**. Vue simplifie tout ça avec `@` !

---

## Gérer les événements en Vue

En Vue, au lieu d'écrire `addEventListener`, on utilise `@` directement dans le template.

> **`@click`** est un raccourci pour `v-on:click`. Les deux fonctionnent, mais `@` est plus court et plus courant.

```vue
<script setup lang="ts">
// On déclare une fonction qui sera appelée quand on clique
// 'event: MouseEvent' → TypeScript nous dit que c'est un événement de souris
// ': void' → cette fonction ne retourne rien
function handleClick(event: MouseEvent): void {
  // event.clientX = position horizontale de la souris (en pixels)
  // event.clientY = position verticale de la souris (en pixels)
  console.log("Clic à", event.clientX, event.clientY);
}
</script>

<template>
  <!-- @click="handleClick" → quand on clique, appelle handleClick -->
  <!-- Vue passe automatiquement l'objet 'event' à la fonction -->
  <button @click="handleClick">Clique-moi !</button>
</template>
```

### Que contient `$event` ?

Quand un événement se produit, le navigateur crée un **objet événement** qui contient des informations :

| Propriété                | Ce qu'elle contient                       |
| ------------------------ | ----------------------------------------- |
| `event.clientX`          | Position X de la souris                   |
| `event.clientY`          | Position Y de la souris                   |
| `event.target`           | L'élément HTML sur lequel on a cliqué     |
| `event.key`              | La touche du clavier pressée (pour keyup) |
| `event.preventDefault()` | Empêche le comportement par défaut        |

Dans le template, cet objet s'appelle **`$event`** :

```vue
<template>
  <!-- $event est l'objet événement fourni par le navigateur -->
  <button @click="console.log($event)">Voir l'événement</button>
</template>
```

---

### Passer des arguments à la fonction

Parfois, tu veux envoyer tes propres données à la fonction (pas juste l'événement).

```vue
<script setup lang="ts">
// Cette fonction attend un 'id' de type number
function deleteItem(id: number): void {
  console.log("Suppression de l'élément numéro", id);
}

// Cette fonction attend un 'id' ET l'événement souris
function handleAction(id: number, event: MouseEvent): void {
  console.log("Action sur", id, "à la position", event.clientX);
}
</script>

<template>
  <!-- On appelle deleteItem en lui passant l'id directement -->
  <!-- item.id est une variable qui contient le numéro de l'élément -->
  <button @click="deleteItem(item.id)">Supprimer</button>

  <!-- Si on veut AUSSI l'événement, on utilise une arrow function -->
  <!-- (e) => ... crée une petite fonction anonyme -->
  <!-- 'e' reçoit l'événement, et on le passe à handleAction -->
  <button @click="(e) => handleAction(item.id, e)">Action</button>
</template>
```

> 💡 **Rappel arrow function** : `(e) => handleAction(item.id, e)` est une façon courte d'écrire :
>
> ```ts
> function(e: Event) { handleAction(item.id, e) }
> ```

---

### Modificateurs d'événements

Les **modificateurs** sont des petits mots ajoutés après le nom de l'événement avec un `.` pour modifier son comportement. C'est comme ajouter des options.

#### `.prevent` — Empêcher le comportement par défaut

Par défaut, quand tu soumets un formulaire, **le navigateur recharge la page**. C'est le comportement natif du HTML. En JavaScript pur, on écrit `event.preventDefault()` pour l'empêcher. Vue le fait pour toi avec `.prevent` :

```vue
<!-- SANS Vue (JavaScript pur) : -->
<!-- form.addEventListener('submit', function(event) { -->
<!--   event.preventDefault()  ← empêche le rechargement -->
<!--   onSubmit() -->
<!-- }) -->

<!-- AVEC Vue — une seule ligne ! -->
<!-- .prevent = "appelle event.preventDefault() automatiquement" -->
<form @submit.prevent="onSubmit">
  <button type="submit">Envoyer</button>
</form>
```

#### `.stop` — Arrêter la propagation

Imagine des poupées russes : si tu cliques sur la petite poupée à l'intérieur, le clic "remonte" aussi aux poupées qui l'entourent. `.stop` empêche cette remontée :

```vue
<!-- Sans .stop : cliquer sur le bouton déclenche AUSSI @click du div parent -->
<!-- Avec .stop : seul le bouton réagit -->
<div @click="onDivClick">
  <button @click.stop="onButtonClick">
    Cliquer ici ne déclenchera PAS onDivClick
  </button>
</div>
```

#### `.once` — Exécuter une seule fois

```vue
<!-- La fonction 'initialize' ne sera exécutée qu'au PREMIER clic -->
<!-- Les clics suivants seront ignorés -->
<button @click.once="initialize">Initialiser</button>
```

#### Combiner les modificateurs

On peut enchaîner plusieurs modificateurs :

```vue
<!-- .prevent ET .once → empêche le rechargement + ne fonctionne qu'une fois -->
<form @submit.prevent.once="onFirstSubmit">
  <button type="submit">Soumettre (une seule fois)</button>
</form>
```

---

### Événements clavier

Tu peux écouter les touches du clavier avec `@keyup` (quand on relâche) ou `@keydown` (quand on appuie) :

```vue
<!-- Quand l'utilisateur appuie sur Entrée dans ce champ → appelle submit -->
<input @keyup.enter="submit" />

<!-- Quand il appuie sur Échap → appelle cancel -->
<input @keyup.escape="cancel" />

<!-- Combinaison : Ctrl + S → appelle save -->
<!-- Utile pour un raccourci clavier "sauvegarder" -->
<input @keydown.ctrl.s="save" />
```

> 💡 Touches disponibles : `.enter`, `.tab`, `.delete`, `.escape`, `.space`, `.up`, `.down`, `.left`, `.right`, `.ctrl`, `.alt`, `.shift`, `.meta` (touche Windows/Cmd)

---

## 🧠 Rappel JavaScript : les formulaires en HTML/JS

Avant de voir `v-model`, rappelons comment les formulaires fonctionnent en HTML + JavaScript pur.

### Comment ça marche sans Vue

```html
<!-- Un formulaire HTML basique -->
<form>
  <label>Ton nom :</label>
  <input type="text" id="champNom" />
  <p id="affichage"></p>
</form>
```

```ts
// En TypeScript pur, pour afficher ce que l'utilisateur tape :
const champ: HTMLInputElement | null = document.querySelector("#champNom"); // 1. Récupérer l'input
const affichage: HTMLElement | null = document.querySelector("#affichage"); // 2. Récupérer le <p>

// 3. Écouter chaque frappe au clavier dans le champ
champ?.addEventListener("input", function (event: Event) {
  // 4. Récupérer la valeur actuelle du champ
  const valeur: string = (event.target as HTMLInputElement).value;
  // 5. L'afficher dans le <p>
  if (affichage) affichage.textContent = "Tu as tapé : " + valeur;
});
```

C'est beaucoup de code pour juste **synchroniser un champ avec un affichage**. Vue réduit tout ça à une seule ligne grâce à `v-model`.

---

## `v-model` — la liaison bidirectionnelle

### L'analogie du miroir 🪞

Imagine un **miroir magique** entre un champ de formulaire et une variable :

```
┌─────────────────┐        🪞        ┌─────────────────┐
│  Champ input     │  ←── miroir ──→  │  Variable ref    │
│  (ce que voit    │                  │  (dans ton code) │
│   l'utilisateur) │                  │                  │
└─────────────────┘                  └─────────────────┘
```

- Si l'utilisateur **tape dans le champ** → la variable se met à jour automatiquement
- Si ton code **change la variable** → le champ se met à jour automatiquement

C'est ça la **liaison bidirectionnelle** (two-way binding) : les deux côtés du miroir sont toujours synchronisés.

`v-model` fait ce miroir pour toi en **une seule directive** !

---

### Input texte

```vue
<script setup lang="ts">
import { ref } from "vue";

// On crée une variable réactive de type string, initialisée à ""
const name = ref<string>("");
</script>

<template>
  <!-- v-model="name" → lie le champ à la variable 'name' -->
  <!-- Quand on tape, 'name' change. Si 'name' change, le champ aussi. -->
  <input v-model="name" placeholder="Ton nom" />

  <!-- {{ name }} affiche la valeur en temps réel -->
  <p>Tu as tapé : {{ name }}</p>
</template>
```

### Ce que `v-model` fait en coulisses

`v-model` est en réalité un **raccourci** qui combine deux choses :

```vue
<!-- v-model="name" est EXACTEMENT pareil que : -->
<input
  :value="name"
  @input="name = ($event.target as HTMLInputElement).value"
/>
<!--
  :value="name"   → affiche la valeur de 'name' dans le champ (sens variable → champ)
  @input="..."    → quand on tape, met à jour 'name' (sens champ → variable)
  
  ($event.target as HTMLInputElement).value :
    - $event = l'événement 'input'
    - $event.target = l'élément HTML qui a déclenché l'événement (l'input)
    - as HTMLInputElement = on dit à TypeScript "c'est un input HTML"
    - .value = la valeur actuelle tapée dans le champ
-->
```

**Tu n'as pas besoin d'écrire tout ça ! `v-model` le fait pour toi.** Mais c'est bien de comprendre ce qui se passe sous le capot.

---

### Textarea (zone de texte multi-lignes)

```vue
<script setup lang="ts">
import { ref } from "vue";

// Variable pour stocker le texte de la description
const description = ref<string>("");
</script>

<template>
  <!-- v-model fonctionne pareil sur un textarea -->
  <textarea v-model="description" placeholder="Décris ton projet..."></textarea>
  <p>Description : {{ description }}</p>
</template>
```

---

### Checkbox (case à cocher)

Il y a **deux cas** pour les checkboxes :

#### Cas 1 : Une seule checkbox → booléen (true/false)

```vue
<script setup lang="ts">
import { ref } from "vue";

// Une seule checkbox = un booléen (cochée = true, décochée = false)
const isAccepted = ref<boolean>(false);
</script>

<template>
  <!-- Quand on coche → isAccepted passe à true -->
  <!-- Quand on décoche → isAccepted passe à false -->
  <label>
    <input type="checkbox" v-model="isAccepted" />
    J'accepte les conditions
  </label>

  <p>Accepté : {{ isAccepted }}</p>
  <!-- Affiche "Accepté : true" ou "Accepté : false" -->
</template>
```

#### Cas 2 : Plusieurs checkboxes → tableau de valeurs

```vue
<script setup lang="ts">
import { ref } from "vue";

// Plusieurs checkboxes = un tableau (array) qui stocke les valeurs cochées
const selectedFruits = ref<string[]>([]);
// string[] → un tableau de chaînes de caractères
// [] → initialement vide (rien n'est coché)
</script>

<template>
  <!-- Chaque checkbox a un 'value' différent -->
  <!-- Quand on la coche, sa value est AJOUTÉE au tableau -->
  <!-- Quand on la décoche, sa value est RETIRÉE du tableau -->
  <label>
    <input type="checkbox" v-model="selectedFruits" value="pomme" />
    Pomme
  </label>
  <label>
    <input type="checkbox" v-model="selectedFruits" value="banane" />
    Banane
  </label>
  <label>
    <input type="checkbox" v-model="selectedFruits" value="fraise" />
    Fraise
  </label>

  <p>Fruits sélectionnés : {{ selectedFruits }}</p>
  <!-- Si on coche pomme et fraise → affiche ["pomme", "fraise"] -->
</template>
```

---

### Radio (bouton radio — un seul choix possible)

```vue
<script setup lang="ts">
import { ref } from "vue";

// Un seul choix possible → une seule variable string
const picked = ref<string>("");
</script>

<template>
  <!-- Tous les radios partagent le MÊME v-model -->
  <!-- Mais chacun a un 'value' différent -->
  <!-- Quand on sélectionne un radio, 'picked' prend sa value -->
  <label>
    <input type="radio" v-model="picked" value="a" />
    Option A
  </label>
  <label>
    <input type="radio" v-model="picked" value="b" />
    Option B
  </label>

  <p>Tu as choisi : {{ picked }}</p>
  <!-- Affiche "a" ou "b" selon le choix -->
</template>
```

---

### Select (menu déroulant)

```vue
<script setup lang="ts">
import { ref } from "vue";

// On crée un type personnalisé pour les valeurs autorisées
// Seules les valeurs "low", "medium" ou "high" sont acceptées
type Priority = "low" | "medium" | "high";

// La variable commence à "medium"
const priority = ref<Priority>("medium");
</script>

<template>
  <!-- v-model sur le <select> → 'priority' prend la value de l'option choisie -->
  <select v-model="priority">
    <option value="low">Basse</option>
    <option value="medium">Moyenne</option>
    <option value="high">Haute</option>
  </select>

  <p>Priorité choisie : {{ priority }}</p>
</template>
```

---

### Modificateurs de `v-model`

Les modificateurs de `v-model` transforment automatiquement la valeur. On les ajoute avec un `.` après `v-model` :

#### `.number` — Convertir en nombre

```vue
<script setup lang="ts">
import { ref } from "vue";

// Sans .number, la valeur serait une string "25" (texte)
// Avec .number, elle est automatiquement convertie en number 25 (nombre)
const age = ref<number>(0);
</script>

<template>
  <!-- .number → convertit la saisie en nombre automatiquement -->
  <input v-model.number="age" type="number" placeholder="Ton âge" />
  <p>Âge : {{ age }} (type: {{ typeof age }})</p>
</template>
```

#### `.trim` — Supprimer les espaces en début et fin

```vue
<!-- Imagine que l'utilisateur tape "  Alice  " (avec des espaces) -->
<!-- .trim enlève les espaces au début et à la fin → "Alice" -->
<input v-model.trim="name" placeholder="Ton nom" />
```

#### `.lazy` — Mettre à jour seulement quand on quitte le champ

```vue
<!-- SANS .lazy → la variable se met à jour à chaque lettre tapée -->
<!-- AVEC .lazy → la variable se met à jour seulement quand on quitte le champ -->
<!-- (ou quand on appuie sur Entrée) -->
<!-- Utile pour éviter de lancer une recherche à chaque lettre -->
<input v-model.lazy="search" placeholder="Recherche..." />
```

---

## `v-model` sur un composant custom

> On verra les composants en détail dans le prochain cours, mais voici le principe de base.

`v-model` peut aussi fonctionner sur **tes propres composants** (pas seulement les `<input>` HTML) :

```vue
<!-- Parent -->
<!-- On utilise v-model sur notre composant MyInput -->
<MyInput v-model="name" />

<!-- C'est un raccourci pour : -->
<MyInput :modelValue="name" @update:modelValue="name = $event" />
<!--
  :modelValue="name"                    → on envoie la valeur au composant (prop)
  @update:modelValue="name = $event"   → quand le composant envoie une mise à jour,
                                          on met à jour 'name'
  $event ici = la nouvelle valeur envoyée par le composant enfant
-->
```

---

## Résumé

| Concept                | Syntaxe                 | Explication                             |
| ---------------------- | ----------------------- | --------------------------------------- |
| Événement click        | `@click="handler"`      | Appelle `handler` quand on clique       |
| Avec argument          | `@click="handler(arg)"` | Passe un argument à la fonction         |
| Prevent default        | `@submit.prevent`       | Empêche le comportement par défaut      |
| Stop propagation       | `@click.stop`           | Empêche l'événement de remonter         |
| Une seule fois         | `@click.once`           | N'écoute que le premier événement       |
| Touche clavier         | `@keyup.enter`          | Réagit à la touche Entrée               |
| Input texte            | `v-model="variable"`    | Lie un champ à une variable (miroir) 🪞 |
| Checkbox boolean       | `v-model="boolRef"`     | `true` si cochée, `false` sinon         |
| Checkbox multiples     | `v-model="arrayRef"`    | Tableau des valeurs cochées             |
| Radio                  | `v-model="stringRef"`   | La `value` du radio sélectionné         |
| Select                 | `v-model="selected"`    | La `value` de l'option choisie          |
| Convertir en nombre    | `v-model.number`        | La saisie est convertie en `number`     |
| Supprimer les espaces  | `v-model.trim`          | Enlève les espaces au début et à la fin |
| Mise à jour paresseuse | `v-model.lazy`          | Met à jour quand on quitte le champ     |

---

## 🎯 Exercices pratiques

### Exercice E.1 — Formulaire de contact

```vue
<script setup lang="ts">
import { ref } from "vue";

const nom = ref("");
const email = ref("");
const message = ref("");
const newsletter = ref(false);

function envoyerFormulaire(): void {
  // Affiche les données dans la console
  // ???
}
</script>

<template>
  <form @submit.prevent="???">
    <input v-model="???" placeholder="Votre nom" />
    <input v-model.???="email" type="email" placeholder="Email" />
    <textarea v-model="???" placeholder="Message"></textarea>
    <label>
      <input type="checkbox" v-model="???" />
      S'inscrire à la newsletter
    </label>
    <button type="submit">Envoyer</button>
  </form>
</template>
```

### Exercice E.2 — Sélecteur de quantité avec limites

```vue
<script setup lang="ts">
import { ref } from "vue";

const quantite = ref(1);

function incrementer(): void {
  // Max 10
  // ???
}

function decrementer(): void {
  // Min 1
  // ???
}
</script>

<template>
  <button @click="???" :disabled="quantite <= 1">-</button>
  <span>{{ quantite }}</span>
  <button @click="???" :disabled="quantite >= 10">+</button>
</template>
```

### Exercice E.3 — Champ de recherche avec Entrée

```vue
<script setup lang="ts">
import { ref } from "vue";

const recherche = ref("");
const resultats = ref<string[]>([]);

function lancerRecherche(): void {
  console.log("Recherche:", recherche.value);
  // Simuler des résultats
  resultats.value = ["Résultat 1", "Résultat 2"];
}
</script>

<template>
  <!-- Active la recherche avec Entrée ET avec le bouton -->
  <input
    v-model="recherche"
    @keyup.???="lancerRecherche"
    placeholder="Rechercher..."
  />
  <button @click="lancerRecherche">🔍</button>
</template>
```

<details>
<summary>Solutions</summary>

```vue
<!-- E.1 -->
<form @submit.prevent="envoyerFormulaire">
  <input v-model.trim="nom" placeholder="Votre nom" />
  <input v-model.trim="email" type="email" placeholder="Email" />
  <textarea v-model="message"></textarea>
  <input type="checkbox" v-model="newsletter" />
</form>

<!-- E.2 -->
function incrementer() { if (quantite.value < 10) quantite.value++ } function
decrementer() { if (quantite.value > 1) quantite.value-- }
<button @click="decrementer" :disabled="quantite <= 1">-</button>
<button @click="incrementer" :disabled="quantite >= 10">+</button>

<!-- E.3 -->
<input v-model="recherche" @keyup.enter="lancerRecherche" />
```

</details>

---

## Exercice

→ `exercices/04-formulaire-contact/ENONCE.md`

## Suite

→ `cours/01-debutant/05-composants-props-emits.md`
