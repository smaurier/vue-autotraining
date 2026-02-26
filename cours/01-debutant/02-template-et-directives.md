# 02 — Template et directives

> **Objectif :** Comprendre comment Vue contrôle ce qui s'affiche dans la page grâce aux **directives** — ces petits mots magiques qu'on ajoute dans le HTML.

---

## 1. Qu'est-ce qu'une directive ?

### L'analogie 🏷️

Imagine que tu mets des **post-it** sur des éléments de ta page web. Chaque post-it donne une **instruction** à Vue :

- « Affiche cet élément seulement si… »
- « Répète cet élément pour chaque élément de la liste… »
- « Quand on clique ici, fais… »

### En pratique

Une **directive** est un attribut spécial qu'on ajoute sur une balise HTML. Toutes les directives Vue commencent par le préfixe **`v-`**.

```html
<!-- Ceci est du HTML normal -->
<p class="texte">Bonjour</p>

<!-- Ceci utilise une directive Vue (v-if) -->
<!-- Le "v-" au début dit : "Attention, c'est une instruction pour Vue !" -->
<p v-if="estConnecte">Bienvenue !</p>
```

> 💡 **Retiens :** quand tu vois `v-quelquechose` dans le HTML, c'est Vue qui travaille, pas le navigateur tout seul.

### Les directives qu'on va apprendre

| Directive | Ce qu'elle fait (en français simple)                |
| --------- | --------------------------------------------------- |
| `v-if`    | « Affiche ça SI la condition est vraie »            |
| `v-show`  | « Cache/montre ça (mais ça reste dans la page) »   |
| `v-for`   | « Répète ça pour chaque élément d'une liste »       |
| `v-bind`  | « Connecte cet attribut HTML à une variable »       |
| `v-on`    | « Quand cet événement arrive, fais quelque chose »  |

---

## 2. `v-if` / `v-else-if` / `v-else` — affichage conditionnel

### Rappel JavaScript 🔄 — Les conditions `if / else`

En JavaScript, on utilise `if` / `else` pour exécuter du code selon une condition :

```js
// On déclare une variable
const age = 20

// Si age est supérieur ou égal à 18...
if (age >= 18) {
  console.log("Majeur")     // ...on affiche "Majeur"
}
// Sinon...
else {
  console.log("Mineur")     // ...on affiche "Mineur"
}
```

### Le concept : "affichage conditionnel"

**Affichage conditionnel** = décider quel élément montrer selon une condition.

C'est comme un **panneau d'affichage** dans un magasin :
- Si le magasin est **ouvert** → on montre le panneau "Bienvenu !"
- Si le magasin est **fermé** → on montre le panneau "Revenez demain"
- On ne montre **jamais les deux** en même temps

### En Vue avec `v-if`

```vue
<script setup lang="ts">
// On importe ref pour créer des variables réactives (on verra ça en détail au cours 03)
import { ref } from 'vue'

// On crée une variable "magasinOuvert" qui vaut true (ouvert)
// ref() rend la variable "réactive" → Vue surveille les changements
const magasinOuvert = ref<boolean>(true)
</script>

<template>
  <!-- SI magasinOuvert est true → on affiche ce paragraphe -->
  <p v-if="magasinOuvert">🟢 Bienvenue, le magasin est ouvert !</p>

  <!-- SINON → on affiche ce paragraphe à la place -->
  <p v-else>🔴 Désolé, le magasin est fermé.</p>
</template>
```

> ⚠️ **Important :** `v-else` doit être sur l'élément **juste après** le `v-if`. On ne peut pas mettre du HTML entre les deux.

### Trois conditions avec `v-else-if`

Parfois on a **plus de deux cas**. C'est comme un feu tricolore :

```vue
<script setup lang="ts">
import { ref } from 'vue'

// On définit un type personnalisé : la variable ne peut contenir QUE ces 3 valeurs
// C'est TypeScript qui nous protège des fautes de frappe !
type Feu = 'rouge' | 'orange' | 'vert'

// La variable "feu" contient la couleur actuelle du feu
const feu = ref<Feu>('rouge')
</script>

<template>
  <!-- Cas 1 : si le feu est rouge -->
  <p v-if="feu === 'rouge'">🔴 Arrêtez-vous !</p>

  <!-- Cas 2 : sinon, si le feu est orange -->
  <p v-else-if="feu === 'orange'">🟠 Attention, ralentissez...</p>

  <!-- Cas 3 : sinon (forcément vert, car il ne reste plus que cette possibilité) -->
  <p v-else>🟢 Vous pouvez passer !</p>
</template>
```

### Ce que fait `v-if` en coulisses

Quand la condition est **fausse**, `v-if` **retire complètement** l'élément du HTML de la page. C'est comme si l'élément n'existait pas du tout.

```
Condition = true   →  <p>Je suis là !</p>     (l'élément EXISTE dans la page)
Condition = false  →  (rien, le vide)          (l'élément est SUPPRIMÉ de la page)
```

---

## 3. `v-show` — afficher/masquer sans supprimer

### La différence avec `v-if`

`v-show` fonctionne différemment : au lieu de **supprimer** l'élément, il le **cache** en le rendant invisible.

C'est la différence entre :
- **`v-if`** = enlever un livre de l'étagère (il n'est plus là)
- **`v-show`** = mettre un drap sur le livre (il est toujours là, mais on ne le voit pas)

```vue
<script setup lang="ts">
import { ref } from 'vue'

// Variable qui contrôle si le message est visible ou non
const messageVisible = ref<boolean>(true)
</script>

<template>
  <!-- Quand messageVisible est false, Vue ajoute "display: none" en CSS -->
  <!-- L'élément reste dans le HTML, il est juste invisible -->
  <p v-show="messageVisible">👋 Coucou, je suis un message !</p>

  <!-- Un bouton pour montrer/cacher le message -->
  <!-- Au clic, on inverse la valeur : true devient false, false devient true -->
  <button @click="messageVisible = !messageVisible">
    Montrer / Cacher
  </button>
</template>
```

### `v-if` vs `v-show` — Quand utiliser lequel ?

| Question                                          | Réponse        |
| ------------------------------------------------- | -------------- |
| L'élément change **souvent** (toggle fréquent) ?  | → `v-show` ✅  |
| L'élément change **rarement** ?                   | → `v-if` ✅    |
| Tu veux que l'élément **n'existe pas du tout** ?  | → `v-if` ✅    |

**Pourquoi ?**

| Aspect                  | `v-if`                                    | `v-show`                               |
| ----------------------- | ----------------------------------------- | -------------------------------------- |
| Quand la condition est fausse | L'élément est **supprimé** du HTML   | L'élément est **caché** (CSS `display: none`) |
| Coût au premier affichage | **Faible** si la condition commence à false | **Toujours présent**, même si caché   |
| Coût pour montrer/cacher | **Élevé** (crée/détruit l'élément à chaque fois) | **Faible** (change juste le CSS)  |
| Exemple d'utilisation   | Page d'erreur, contenu admin              | Menu déroulant, tooltip, panneau latéral |

> 💡 **Astuce simple :** si l'utilisateur clique souvent pour montrer/cacher → `v-show`. Si c'est une condition qui change rarement → `v-if`.

---

## 4. `v-for` — répéter des éléments (boucles)

### Rappel JavaScript 🔄 — Les boucles

En JavaScript, quand on veut **faire la même chose pour chaque élément** d'une liste, on utilise une boucle.

```js
// Un tableau (array) = une liste d'éléments
const fruits = ['Pomme', 'Banane', 'Cerise']

// === Boucle for classique ===
// i commence à 0, augmente de 1 à chaque tour, s'arrête quand i atteint la taille du tableau
for (let i = 0; i < fruits.length; i++) {
  console.log(fruits[i])  // Affiche : Pomme, puis Banane, puis Cerise
}

// === forEach (plus moderne, plus lisible) ===
// Pour chaque fruit dans le tableau, on exécute cette fonction
fruits.forEach((fruit) => {
  console.log(fruit)  // Affiche : Pomme, puis Banane, puis Cerise
})
```

### le concept de `v-for`

En Vue, **`v-for`** remplace ces boucles. Au lieu de créer des éléments dans le JavaScript, on dit directement **dans le HTML** : « Répète cette balise pour chaque élément de ma liste ».

C'est comme un **tampon encreur** : tu définis le modèle une seule fois, et Vue le reproduit pour chaque élément.

### Exemple simple

```vue
<script setup lang="ts">
import { ref } from 'vue'

// On crée un tableau de strings (chaînes de caractères)
// ref() le rend réactif : si on ajoute un fruit, Vue met à jour l'affichage
const fruits = ref<string[]>(['🍎 Pomme', '🍌 Banane', '🍒 Cerise'])
</script>

<template>
  <h3>Ma liste de fruits :</h3>

  <!-- <ul> = liste non ordonnée (à puces) -->
  <ul>
    <!--
      v-for="fruit in fruits" signifie :
      "Pour chaque élément du tableau 'fruits', appelle-le 'fruit'"

      :key="fruit" → on explique ça juste en dessous !
    -->
    <li v-for="fruit in fruits" :key="fruit">
      {{ fruit }}
    </li>
    <!--
      Résultat dans la page :
      • 🍎 Pomme
      • 🍌 Banane
      • 🍒 Cerise
    -->
  </ul>
</template>
```

### Pourquoi `:key` est obligatoire — l'analogie des badges 🏷️

Imagine une fête où les invités portent des **badges** avec leur nom. Si quelqu'un part, tu sais exactement **qui** est parti grâce au badge.

Sans badges, si quelqu'un part, tu ne sais plus qui est qui → c'est le bazar !

**`:key` c'est le badge.** C'est un identifiant **unique** qui permet à Vue de savoir quel élément est lequel.

```vue
<!-- ✅ BIEN : chaque élément a un identifiant unique (son id) -->
<!-- Vue sait exactement quel élément modifier/supprimer -->
<li v-for="todo in todos" :key="todo.id">

<!-- ❌ MAUVAIS : l'index change si on réordonne la liste -->
<!-- C'est comme si on numérotait les badges 1, 2, 3... -->
<!-- Si la personne n°2 s'en va, la n°3 devient n°2 → confusion ! -->
<li v-for="(todo, index) in todos" :key="index">
```

> 💡 **Règle simple :** utilise toujours un **identifiant unique** (comme un `id`) pour `:key`.

### Exemple complet avec des objets typés

```vue
<script setup lang="ts">
import { ref } from 'vue'

// On définit la forme (interface) d'une tâche
// Chaque tâche DOIT avoir ces 3 propriétés
interface Tache {
  id: number        // Identifiant unique (pour le :key)
  texte: string     // Le texte de la tâche
  terminee: boolean // Est-ce que la tâche est terminée ?
}

// On crée une liste de tâches (un tableau de Tache)
const taches = ref<Tache[]>([
  { id: 1, texte: 'Apprendre Vue', terminee: false },
  { id: 2, texte: 'Lire le cours', terminee: true },
  { id: 3, texte: 'Faire les exercices', terminee: false },
])
</script>

<template>
  <ul>
    <!--
      Pour chaque tache dans taches :
      - on utilise tache.id comme identifiant unique (:key)
      - on affiche le texte et un emoji selon l'état
    -->
    <li v-for="tache in taches" :key="tache.id">
      <!-- Si terminée → ✅, sinon → ⬜ -->
      {{ tache.terminee ? '✅' : '⬜' }} {{ tache.texte }}
    </li>
    <!--
      Résultat :
      • ⬜ Apprendre Vue
      • ✅ Lire le cours
      • ⬜ Faire les exercices
    -->
  </ul>
</template>
```

### Boucle avec l'index (le numéro de position)

Parfois on veut afficher le **numéro** de chaque élément :

```vue
<template>
  <ul>
    <!--
      (tache, index) → index est la position dans le tableau
      index commence à 0, donc on ajoute 1 pour afficher 1, 2, 3...
    -->
    <li v-for="(tache, index) in taches" :key="tache.id">
      {{ index + 1 }}. {{ tache.texte }}
    </li>
    <!--
      Résultat :
      1. Apprendre Vue
      2. Lire le cours
      3. Faire les exercices
    -->
  </ul>
</template>
```

### Boucle sur un objet (au lieu d'un tableau)

On peut aussi boucler sur les propriétés d'un objet :

```vue
<script setup lang="ts">
// Un objet simple (pas un tableau)
// Record<string, string | number> = un objet dont les clés sont des strings
// et les valeurs sont des strings ou des numbers
const personne: Record<string, string | number> = {
  nom: 'Alice',     // clé: "nom",  valeur: "Alice"
  age: 30,          // clé: "age",  valeur: 30
  ville: 'Paris'    // clé: "ville", valeur: "Paris"
}
</script>

<template>
  <ul>
    <!--
      (valeur, cle) → on récupère la valeur ET le nom de la propriété
      "cle" sert aussi de :key car chaque propriété a un nom unique
    -->
    <li v-for="(valeur, cle) in personne" :key="cle">
      <strong>{{ cle }}</strong> : {{ valeur }}
    </li>
    <!--
      Résultat :
      • nom : Alice
      • age : 30
      • ville : Paris
    -->
  </ul>
</template>
```

---

## 5. `v-bind` — connecter des attributs HTML à des variables (raccourci `:`)

### Rappel JavaScript 🔄 — Attributs HTML

En HTML, les **attributs** donnent des informations supplémentaires aux balises :

```html
<!-- "src" est un attribut qui dit quelle image afficher -->
<img src="/photo.jpg" />

<!-- "disabled" est un attribut qui désactive le bouton -->
<button disabled>Impossible de cliquer</button>

<!-- "href" est un attribut qui dit où mène le lien -->
<a href="https://vuejs.org">Site de Vue</a>
```

Le problème : ces valeurs sont **figées** (statiques). Elles ne changent jamais.

### Le concept : attributs dynamiques

Et si on veut que l'attribut **change** selon une variable ? Par exemple :
- L'URL de l'image vient d'une API
- Le bouton est désactivé seulement si le formulaire est invalide
- La couleur dépend du choix de l'utilisateur

C'est là qu'intervient **`v-bind`** : il **connecte** un attribut HTML à une variable JavaScript.

```
HTML statique :   <img src="/photo.jpg" />           ← toujours la même image
HTML dynamique :  <img :src="urlDeLImage" />         ← l'image change si la variable change
```

### Syntaxe

```vue
<script setup lang="ts">
import { ref } from 'vue'

// URL de l'image (peut changer plus tard)
const urlImage = ref<string>('/photo-profil.jpg')

// Le bouton est-il désactivé ? (oui par défaut)
const boutonDesactive = ref<boolean>(true)
</script>

<template>
  <!-- === Forme longue (v-bind:attribut) === -->
  <img v-bind:src="urlImage" />

  <!-- === Forme raccourcie (:attribut) — C'EST CELLE QU'ON UTILISE TOUJOURS === -->
  <!-- Les deux points ":" remplacent "v-bind:" -->
  <img :src="urlImage" />

  <!-- On peut lier n'importe quel attribut HTML -->
  <button :disabled="boutonDesactive">Envoyer</button>
  <!--
    Si boutonDesactive = true  → le bouton est grisé et non cliquable
    Si boutonDesactive = false → le bouton est cliquable
  -->
</template>
```

> 💡 **Retiens :** les deux points `:` devant un attribut = « la valeur vient d'une variable JavaScript ».

### Rappel CSS 🔄 — Les classes CSS

Avant de parler de classes dynamiques, petit rappel :

```html
<!-- En HTML, l'attribut "class" applique des styles CSS à un élément -->
<p class="rouge gras">Ce texte est rouge et gras</p>
```

```css
/* En CSS, on définit ce que fait chaque classe */
.rouge { color: red; }          /* Texte en rouge */
.gras  { font-weight: bold; }   /* Texte en gras */
.cache { display: none; }       /* Élément invisible */
```

### Classes dynamiques avec `:class`

On peut **ajouter ou retirer des classes CSS** selon des conditions :

```vue
<script setup lang="ts">
import { ref } from 'vue'

const estActif = ref<boolean>(true)       // L'élément est-il actif ?
const aUneErreur = ref<boolean>(false)    // Y a-t-il une erreur ?
</script>

<template>
  <!--
    === Syntaxe objet ===
    { nomDeLaClasse: condition }
    Si la condition est true → la classe est ajoutée
    Si la condition est false → la classe est retirée
  -->
  <div :class="{ active: estActif, erreur: aUneErreur }">
    Mon contenu
  </div>
  <!--
    Avec estActif = true et aUneErreur = false :
    Résultat HTML : <div class="active">Mon contenu</div>
    La classe "erreur" n'est PAS ajoutée car aUneErreur = false
  -->

  <!--
    === Syntaxe tableau ===
    On liste les classes à appliquer
    On peut mélanger des classes fixes et des conditions
  -->
  <div :class="['carte', estActif ? 'active' : '']">
    Mon contenu
  </div>
  <!--
    estActif ? 'active' : '' → c'est un opérateur ternaire (raccourci de if/else)
    Si estActif est true → ajoute 'active'
    Si estActif est false → ajoute '' (rien)
    Résultat : <div class="carte active">Mon contenu</div>
  -->
</template>
```

### Styles dynamiques avec `:style`

On peut aussi changer le **style CSS directement** (sans passer par des classes) :

```vue
<script setup lang="ts">
import { ref } from 'vue'

const couleurTexte = ref<string>('blue')    // La couleur du texte
const taille = ref<number>(20)              // La taille en pixels
</script>

<template>
  <!--
    :style attend un objet JavaScript
    Les noms de propriétés CSS sont en camelCase (pas de tiret)
    fontSize au lieu de font-size
    backgroundColor au lieu de background-color
  -->
  <p :style="{ color: couleurTexte, fontSize: taille + 'px' }">
    Ce texte change de couleur et de taille !
  </p>
  <!-- Résultat HTML : <p style="color: blue; font-size: 20px;">...</p> -->
</template>
```

---

## 6. `v-on` — écouter des événements (raccourci `@`)

### Rappel JavaScript 🔄 — Les événements

Un **événement** c'est quelque chose qui **se passe** dans la page. C'est comme une **sonnette** : quand quelqu'un appuie dessus, ça déclenche une action.

Exemples d'événements :
- **`click`** → l'utilisateur clique sur un élément (comme appuyer sur un bouton de sonnette)
- **`submit`** → l'utilisateur envoie un formulaire
- **`keyup`** → l'utilisateur relâche une touche du clavier
- **`mouseover`** → la souris passe au-dessus d'un élément

En JavaScript pur, on écoute un événement comme ça :

```js
// On dit au navigateur : "Quand on clique sur ce bouton, exécute cette fonction"
const bouton = document.querySelector('#monBouton')
bouton.addEventListener('click', () => {
  console.log('Le bouton a été cliqué !')
})
```

### En Vue avec `v-on` (raccourci `@`)

Vue simplifie énormément l'écoute des événements. Plus besoin de `querySelector` ni de `addEventListener` !

```vue
<script setup lang="ts">
import { ref } from 'vue'

// Compteur qui commence à 0
const compteur = ref<number>(0)

// Fonction appelée quand on clique sur le bouton "Salut"
function direBonjour(): void {
  // alert() affiche une petite fenêtre popup dans le navigateur
  alert('Bonjour ! 👋')
}
</script>

<template>
  <!-- === Forme longue : v-on:événement === -->
  <button v-on:click="direBonjour">Dis bonjour (forme longue)</button>

  <!-- === Forme raccourcie : @événement — C'EST CELLE QU'ON UTILISE === -->
  <!-- Le "@" remplace "v-on:" -->
  <button @click="direBonjour">Dis bonjour</button>

  <!-- === On peut aussi écrire du code directement (expression inline) === -->
  <!-- Ici, on incrémente le compteur directement dans le template -->
  <button @click="compteur++">
    Compteur : {{ compteur }}
  </button>
  <!-- Chaque clic → compteur passe de 0 à 1, puis 2, puis 3... -->
</template>
```

> 💡 **Retiens :** `@click="..."` = « Quand on clique, fais... »

### Les modificateurs d'événements

Les **modificateurs** sont des suffixes qu'on ajoute après le nom de l'événement avec un point (`.`). Ils modifient le comportement de l'événement.

#### `.prevent` — Empêcher le comportement par défaut

Le navigateur a des **comportements automatiques** pour certaines actions. Par exemple :
- Quand on soumet un formulaire → le navigateur **recharge la page**
- Quand on clique sur un lien → le navigateur **navigue vers l'URL**

Souvent, on ne veut **pas** ce comportement automatique. `.prevent` l'empêche.

```vue
<script setup lang="ts">
function envoyerFormulaire(): void {
  // On gère l'envoi nous-même (par exemple avec une requête API)
  // Sans .prevent, le navigateur rechargerait la page et notre code ne s'exécuterait pas !
  console.log('Formulaire envoyé sans rechargement !')
}
</script>

<template>
  <!--
    @submit.prevent = "Quand le formulaire est envoyé,
    EMPÊCHE le rechargement de la page, puis exécute envoyerFormulaire"
  -->
  <form @submit.prevent="envoyerFormulaire">
    <input type="text" placeholder="Ton nom" />
    <button type="submit">Envoyer</button>
  </form>
</template>
```

#### `.stop` — Arrêter la propagation

Quand on clique sur un élément **enfant**, l'événement "remonte" vers les éléments **parents** (c'est la **propagation**). `.stop` empêche ça.

```vue
<template>
  <!-- Si on clique sur le bouton, sans .stop, le @click du div se déclencherait AUSSI -->
  <div @click="alert('Clic sur le div parent')">
    <button @click.stop="alert('Clic sur le bouton seulement')">
      Clique-moi
    </button>
  </div>
  <!-- Avec .stop → seul "Clic sur le bouton seulement" s'affiche -->
  <!-- Sans .stop → les DEUX alertes s'afficheraient ! -->
</template>
```

#### `.once` — Écouter une seule fois

L'événement ne se déclenche qu'**une seule fois**, puis Vue arrête d'écouter.

```vue
<template>
  <!-- Après le premier clic, les clics suivants ne font plus rien -->
  <button @click.once="alert('Ceci ne s\'affiche qu\'une seule fois !')">
    Clique-moi (une seule fois)
  </button>
</template>
```

#### `.enter` et `.escape` — Touches spécifiques du clavier

On peut écouter des touches précises du clavier :

```vue
<script setup lang="ts">
function rechercher(): void {
  console.log('Recherche lancée !')
}

function annuler(): void {
  console.log('Action annulée')
}
</script>

<template>
  <!-- @keyup = "quand une touche est relâchée" -->
  <!-- .enter = "mais seulement si c'est la touche Entrée" -->
  <input
    placeholder="Tape quelque chose puis appuie sur Entrée"
    @keyup.enter="rechercher"
  />

  <!-- .escape = seulement si c'est la touche Échap -->
  <input
    placeholder="Appuie sur Échap pour annuler"
    @keyup.escape="annuler"
  />
</template>
```

### Résumé des modificateurs

| Modificateur | Ce qu'il fait                                       | Exemple courant                     |
| ------------ | --------------------------------------------------- | ----------------------------------- |
| `.prevent`   | Empêche le comportement par défaut du navigateur    | Formulaire sans rechargement        |
| `.stop`      | Empêche l'événement de remonter aux parents         | Bouton dans un conteneur cliquable  |
| `.once`      | L'événement ne se déclenche qu'une seule fois       | Bouton d'initialisation             |
| `.enter`     | Réagit uniquement à la touche Entrée                | Champ de recherche                  |
| `.escape`    | Réagit uniquement à la touche Échap                 | Fermer un popup                     |

---

## 7. `v-text` et `v-html` — alternatives à `{{ }}`

### `v-text` — Afficher du texte

`v-text` fait la même chose que les moustaches `{{ }}` :

```vue
<script setup lang="ts">
import { ref } from 'vue'

const message = ref<string>('Bonjour tout le monde !')
</script>

<template>
  <!-- Ces deux lignes font EXACTEMENT la même chose -->
  <p>{{ message }}</p>           <!-- Avec les moustaches (le plus courant) -->
  <p v-text="message"></p>       <!-- Avec v-text (moins utilisé) -->
  <!-- Résultat identique : "Bonjour tout le monde !" -->
</template>
```

> 💡 En pratique, on utilise presque toujours `{{ }}`. `v-text` existe mais est rarement nécessaire.

### `v-html` — Afficher du HTML brut

Parfois, une variable contient du **code HTML**. Par défaut, Vue affiche le HTML comme du texte brut (par sécurité). `v-html` dit à Vue de l'interpréter comme du vrai HTML.

```vue
<script setup lang="ts">
import { ref } from 'vue'

// Cette variable contient du code HTML (des balises)
const contenuHtml = ref<string>('<strong>Texte en gras</strong> et <em>en italique</em>')
</script>

<template>
  <!-- Sans v-html : affiche le HTML comme du texte brut -->
  <p>{{ contenuHtml }}</p>
  <!-- Résultat affiché : "<strong>Texte en gras</strong> et <em>en italique</em>" -->

  <!-- Avec v-html : le HTML est interprété et rendu visuellement -->
  <p v-html="contenuHtml"></p>
  <!-- Résultat affiché : "Texte en gras et en italique" (avec le formatage) -->
</template>
```

> ⚠️ **Attention danger !** N'utilise **JAMAIS** `v-html` avec du contenu venant d'un utilisateur (commentaires, formulaires...). Un utilisateur malveillant pourrait injecter du code dangereux (attaque **XSS**). Utilise `v-html` uniquement avec du contenu que **toi** tu contrôles.

---

## 8. Résumé de toutes les directives

| Directive | Raccourci | Ce qu'elle fait | Exemple |
| --------- | --------- | --------------- | ------- |
| `v-if`    | —         | Affiche l'élément SI la condition est vraie (sinon le supprime) | `<p v-if="estConnecte">Bienvenue</p>` |
| `v-else-if` | —      | Condition alternative (après un `v-if`) | `<p v-else-if="estAdmin">Admin</p>` |
| `v-else`  | —         | Sinon (après un `v-if` ou `v-else-if`) | `<p v-else>Inconnu</p>` |
| `v-show`  | —         | Cache/montre l'élément avec du CSS | `<p v-show="visible">Coucou</p>` |
| `v-for`   | —         | Répète l'élément pour chaque item d'une liste | `<li v-for="f in fruits" :key="f">` |
| `v-bind`  | `:`       | Connecte un attribut HTML à une variable | `<img :src="url" />` |
| `v-on`    | `@`       | Exécute du code quand un événement arrive | `<button @click="sauver">OK</button>` |
| `v-model` | —         | Liaison dans les deux sens (cours suivant !) | `<input v-model="nom" />` |
| `v-text`  | —         | Affiche du texte (comme `{{ }}`) | `<p v-text="msg"></p>` |
| `v-html`  | —         | Affiche du HTML brut (⚠️ danger XSS) | `<p v-html="html"></p>` |

---

## Suite

→ `cours/01-debutant/03-reactivite.md`
