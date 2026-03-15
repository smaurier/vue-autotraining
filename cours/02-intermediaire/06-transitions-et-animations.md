# 06 — Transitions et animations : donner vie à ton interface

> **Note importante :** Les animations sont un "nice to have" (un bonus). Elles rendent ton interface plus agréable, mais ce n'est **pas essentiel** à maîtriser en priorité. Concentre-toi d'abord sur les composants, les props, les events, etc. Reviens ici quand tu te sens à l'aise avec le reste !

---

> **🔄 Rappel du cours précédent**
> Avant de continuer, vérifie que tu peux répondre à ces questions :
> 1. Quelle est la différence entre un slot par défaut et un slot nommé ?
> 2. Comment accède-t-on aux données exposées par un scoped slot ?
> 
> <details>
> <summary>Vérifier mes réponses</summary>
>
> 1. Slot par défaut : `<slot>`, slot nommé : `<slot name="header">` utilisé avec `#header`
> 2. Via `#default="{ item }"` ou `v-slot:default="{ item }"` pour déstructurer les props
> </details>

---

## 📝 Rappel CSS : les propriétés qu'on va utiliser

Avant de commencer, rappelons quelques propriétés CSS importantes :

```css
/* opacity : la transparence d'un élément */
/* 0 = invisible, 0.5 = semi-transparent, 1 = totalement visible */
opacity: 0;      /* L'élément est invisible */
opacity: 1;      /* L'élément est visible */

/* transform : déplacer, tourner, agrandir un élément */
/* SANS changer sa place dans le document (c'est performant !) */
transform: translateX(20px);   /* Décale de 20px vers la droite */
transform: translateY(-10px);  /* Décale de 10px vers le haut */
transform: scale(1.2);         /* Agrandit de 20% */

/* transition : dit au navigateur "quand une propriété change, */
/* fais-le progressivement au lieu d'un coup" */
transition: opacity 0.3s ease;
/*           │       │    └─ courbe de vitesse (ease = commence/finit doucement) */
/*           │       └────── durée (0.3 secondes) */
/*           └────────────── propriété à animer */

/* all = toutes les propriétés */
transition: all 0.3s ease;
```

> **Analogie :** Sans `transition`, c'est comme allumer/éteindre une lampe (ON/OFF brutal). Avec `transition`, c'est comme un variateur de lumière (changement progressif).

---

## C'est quoi une transition en Vue ?

Vue fournit un composant spécial appelé `<Transition>`. C'est un **emballage** (wrapper) que tu mets autour d'un élément pour lui ajouter des effets d'animation quand il **apparaît** ou **disparaît**.

> **Analogie :** `<Transition>` c'est comme un rideau de théâtre. Quand un acteur (ton élément) entre en scène, le rideau s'ouvre progressivement. Quand il sort, le rideau se ferme progressivement.

### Premier exemple : un fondu (fade)

```vue
<script setup lang="ts">
import { ref } from 'vue'

// ref() crée une variable réactive (Vue surveille ses changements)
const show = ref(true)   // true = le texte est visible au départ
</script>

<template>
  <!-- Quand on clique, show passe de true à false (ou l'inverse) -->
  <button @click="show = !show">Afficher / Masquer</button>

  <!-- <Transition> emballe l'élément qu'on veut animer -->
  <!-- name="fade" → Vue va chercher les classes CSS .fade-xxx -->
  <Transition name="fade">
    <!-- v-if="show" : l'élément existe seulement si show est true -->
    <p v-if="show">Je suis là ! 👋</p>
  </Transition>
</template>

<style scoped>
/* Pendant l'animation d'entrée ET de sortie, */
/* on active la transition CSS sur "opacity" pendant 0.3s */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

/* Point de départ de l'entrée : invisible (opacity 0) */
/* Point d'arrivée de la sortie : invisible (opacity 0) */
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Note : on n'a pas besoin de définir .fade-enter-to */
/* ni .fade-leave-from car par défaut opacity vaut 1 */
</style>
```

**Ce qui se passe :**
1. Au départ, le `<p>` est visible
2. On clique → `show` passe à `false`
3. Vue ajoute les classes CSS d'animation de **sortie**
4. Le texte disparaît en fondu sur 0.3 secondes
5. On reclique → `show` passe à `true`
6. Vue ajoute les classes CSS d'animation d'**entrée**
7. Le texte réapparaît en fondu

---

## Les 6 classes CSS de transition (le diagramme clé)

Quand tu donnes `name="fade"` à `<Transition>`, Vue ajoute automatiquement des classes CSS à ton élément à différents moments :

```
                    ENTRÉE (apparition)
    ─────────────────────────────────────────────
    
    Frame 0          Pendant              Terminé
    ┌─────────┐    ┌──────────────┐    ┌──────────┐
    │ .fade-   │    │ .fade-       │    │ .fade-   │
    │ enter-   │ → │ enter-       │ → │ enter-   │
    │ from     │    │ active       │    │ to       │
    └─────────┘    └──────────────┘    └──────────┘
    État initial    Transition en       État final
    (invisible)     cours               (visible)


                    SORTIE (disparition)
    ─────────────────────────────────────────────
    
    Frame 0          Pendant              Terminé
    ┌─────────┐    ┌──────────────┐    ┌──────────┐
    │ .fade-   │    │ .fade-       │    │ .fade-   │
    │ leave-   │ → │ leave-       │ → │ leave-   │
    │ from     │    │ active       │    │ to       │
    └─────────┘    └──────────────┘    └──────────┘
    État initial    Transition en       État final
    (visible)       cours               (invisible)
```

### Tableau récapitulatif

| Classe | Quand elle est appliquée | Rôle |
|--------|--------------------------|------|
| `.fade-enter-from` | 1 frame avant l'entrée | État de départ (ex: invisible) |
| `.fade-enter-active` | Pendant toute l'entrée | Définit la transition CSS |
| `.fade-enter-to` | À la fin de l'entrée | État d'arrivée (ex: visible) |
| `.fade-leave-from` | Au début de la sortie | État de départ (ex: visible) |
| `.fade-leave-active` | Pendant toute la sortie | Définit la transition CSS |
| `.fade-leave-to` | À la fin de la sortie | État d'arrivée (ex: invisible) |

> **Remplace "fade" par le `name` que tu as choisi.** Si `name="slide"`, les classes seront `.slide-enter-from`, `.slide-enter-active`, etc.

---

## Exemple : slide + fade (glissement avec fondu)

On combine un déplacement horizontal (`translateX`) avec un fondu (`opacity`) :

```vue
<template>
  <button @click="show = !show">Toggle</button>

  <!-- On change juste le name pour utiliser d'autres classes CSS -->
  <Transition name="slide-fade">
    <p v-if="show">Je glisse en apparaissant ! ➡️</p>
  </Transition>
</template>

<style scoped>
/* Pendant l'entrée : animation de 0.3s */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

/* Pendant la sortie : animation de 0.2s avec une courbe différente */
.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
  /* cubic-bezier = une courbe de vitesse personnalisée */
}

/* Point de départ de l'entrée ET point d'arrivée de la sortie : */
/* décalé de 20px à droite + invisible */
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);  /* Décalé de 20px vers la droite */
  opacity: 0;                   /* Invisible */
}

/* L'état "normal" (visible, non décalé) n'a pas besoin d'être défini */
/* car c'est la valeur par défaut */
</style>
```

---

## Le mode de transition : éviter les éléments superposés

Quand on passe d'un composant à un autre, par défaut les deux sont animés **en même temps** (l'ancien sort pendant que le nouveau entre). Ça peut donner un affichage bizarre.

La solution : `mode="out-in"` → l'ancien sort **d'abord**, puis le nouveau entre.

```vue
<template>
  <button @click="toggleView">Changer de vue</button>

  <!-- mode="out-in" : l'ancienne vue sort AVANT que la nouvelle entre -->
  <Transition name="fade" mode="out-in">
    <!-- :is="currentView" affiche dynamiquement un composant différent -->
    <component :is="currentView" />
  </Transition>
</template>
```

> **Analogie :** C'est comme une porte coulissante. Avec `mode="out-in"`, la première personne sort avant que la deuxième entre. Sans mode, les deux essaient de passer en même temps !

---

## `<TransitionGroup>` : animer des listes

`<Transition>` ne fonctionne que pour **un seul élément**. Pour animer une **liste d'éléments** (ajouts, suppressions, réorganisations), on utilise `<TransitionGroup>`.

```vue
<script setup lang="ts">
import { ref } from 'vue'

// On définit le type d'un élément de la liste
interface Item {
  id: number     // Identifiant unique (obligatoire pour :key)
  text: string   // Le texte affiché
}

// Notre liste réactive avec 2 éléments au départ
const items = ref<Item[]>([
  { id: 1, text: 'Premier' },
  { id: 2, text: 'Deuxième' },
])

let nextId = 3   // Compteur pour générer des ids uniques

// Fonction pour ajouter un élément à la fin de la liste
function addItem(): void {
  items.value.push({ id: nextId++, text: `Item ${nextId}` })
}

// Fonction pour supprimer un élément par son id
function removeItem(id: number): void {
  // filter() garde tous les éléments SAUF celui avec l'id donné
  items.value = items.value.filter((item) => item.id !== id)
}
</script>

<template>
  <button @click="addItem">Ajouter un élément</button>

  <!--
    TransitionGroup :
    - name="list" → utilise les classes .list-xxx
    - tag="ul" → génère une balise <ul> comme conteneur
  -->
  <TransitionGroup name="list" tag="ul">
    <!-- Chaque élément DOIT avoir un :key unique ! -->
    <li v-for="item in items" :key="item.id">
      {{ item.text }}
      <button @click="removeItem(item.id)">×</button>
    </li>
  </TransitionGroup>
</template>

<style scoped>
/* Animation d'entrée et de sortie des éléments */
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}

/* État initial d'entrée + état final de sortie :
   invisible et décalé vers la droite */
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* Animation FLIP : quand les éléments restants se repositionnent */
/* (ex: un élément au milieu est supprimé, les autres "glissent" pour combler le trou) */
.list-move {
  transition: transform 0.4s ease;
}

/* Astuce : les éléments qui sortent sont mis en position absolue */
/* pour ne pas "pousser" les autres pendant leur animation de sortie */
.list-leave-active {
  position: absolute;
}
</style>
```

### Différences entre `<Transition>` et `<TransitionGroup>`

| | `<Transition>` | `<TransitionGroup>` |
|---|---|---|
| **Nombre d'éléments** | 1 seul | Plusieurs (liste) |
| **Balise générée** | Aucune (invisible) | Oui, définie par `tag` |
| **`:key` obligatoire** | Non | Oui, sur chaque enfant |
| **Classe `.xxx-move`** | Non | Oui (animation de repositionnement) |

---

## Transitions JavaScript (hooks) — pour aller plus loin

Pour des animations plus complexes (avec des librairies comme GSAP), on peut utiliser des **hooks JavaScript** au lieu du CSS :

```vue
<template>
  <!--
    @before-enter, @enter, @leave : des événements que Vue déclenche
    :css="false" → dit à Vue de ne pas chercher de classes CSS
  -->
  <Transition
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @leave="onLeave"
    :css="false"
  >
    <div v-if="show">Contenu animé</div>
  </Transition>
</template>

<script setup lang="ts">
// Avant l'entrée : on prépare l'élément (invisible)
function onBeforeEnter(el: Element): void {
  (el as HTMLElement).style.opacity = '0'
}

// Pendant l'entrée : on anime vers l'état visible
function onEnter(el: Element, done: () => void): void {
  const htmlEl = el as HTMLElement
  htmlEl.style.transition = 'opacity 0.5s'  // Animation CSS de 0.5s
  htmlEl.style.opacity = '1'                // Vers visible
  setTimeout(done, 500)                     // On dit à Vue "c'est fini" après 0.5s
}

// Pendant la sortie : on anime vers invisible
function onLeave(el: Element, done: () => void): void {
  const htmlEl = el as HTMLElement
  htmlEl.style.transition = 'opacity 0.3s'  // Animation CSS de 0.3s
  htmlEl.style.opacity = '0'                // Vers invisible
  setTimeout(done, 300)                     // On dit à Vue "c'est fini" après 0.3s
}
</script>
```

> **Quand utiliser les hooks JS ?** Rarement ! Seulement si tu utilises une librairie d'animation comme GSAP, ou si tu as besoin de calculer des valeurs dynamiques. Préfère toujours le CSS, c'est plus simple et plus performant.

---

## Bonnes pratiques

1. **Utilise `mode="out-in"`** pour éviter que deux éléments se superposent pendant la transition
2. **Toujours mettre un `:key` unique** sur les éléments de `<TransitionGroup>`
3. **Préfère les transitions CSS** (plus performantes et plus simples que JavaScript)
4. **N'anime pas `width` ou `height`** → préfère `transform` et `opacity` (le navigateur les optimise mieux)
5. **Moins c'est plus** — des transitions subtiles de 0.2-0.3s sont souvent meilleures que des animations longues et complexes

---

## Résumé

| Concept | Ce que ça fait |
|---------|----------------|
| `<Transition>` | Anime l'entrée/sortie d'**un seul** élément |
| `<TransitionGroup>` | Anime l'entrée/sortie d'éléments dans une **liste** |
| `name="xxx"` | Définit le préfixe des classes CSS (`.xxx-enter-from`, etc.) |
| `mode="out-in"` | L'ancien élément sort avant que le nouveau entre |
| Classes `-enter-*` | Contrôlent l'animation d'**apparition** |
| Classes `-leave-*` | Contrôlent l'animation de **disparition** |
| Classe `-move` | Contrôle l'animation de **repositionnement** (TransitionGroup) |

---

## 🎯 Pratique

### Exercice TR.1 — Fade simple

Complète le CSS pour créer un effet de fondu :

```vue
<template>
  <button @click="show = !show">Toggle</button>
  <Transition name="fade">
    <p v-if="show">Contenu visible</p>
  </Transition>
</template>

<style scoped>
/* Complète les classes pour un fondu de 0.3s */
.fade-enter-active,
.fade-leave-active {
  /* ??? */
}

.fade-enter-from,
.fade-leave-to {
  /* ??? */
}
</style>
```

<details>
<summary>Solution</summary>

```vue
<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```
</details>

---

### Exercice TR.2 — Slide

Crée une transition "slide" qui fait glisser l'élément depuis la droite :

```vue
<style scoped>
/* L'élément arrive de 20px à droite et devient visible */
/* L'élément part vers 20px à droite en devenant invisible */
/* Animation de 0.3s */

.slide-enter-active,
.slide-leave-active {
  /* ??? */
}

.slide-enter-from,
.slide-leave-to {
  /* ??? */
}
</style>
```

<details>
<summary>Solution</summary>

```vue
<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
```
</details>

---

### Exercice TR.3 — TransitionGroup

Complète ce code pour animer une liste d'éléments :

```vue
<script setup lang="ts">
import { ref } from 'vue'

const items = ref([1, 2, 3])

function addItem() {
  items.value.push(items.value.length + 1)
}

function removeItem(index: number) {
  items.value.splice(index, 1)
}
</script>

<template>
  <button @click="addItem">Ajouter</button>

  <!-- Utilise TransitionGroup avec le nom "list" -->
  <!-- ??? -->
    <div v-for="item in items" :key="item" @click="removeItem(items.indexOf(item))">
      Item {{ item }}
    </div>
  <!-- ??? -->
</template>
```

<details>
<summary>Solution</summary>

```vue
<template>
  <button @click="addItem">Ajouter</button>

  <TransitionGroup name="list" tag="div">
    <div v-for="item in items" :key="item" @click="removeItem(items.indexOf(item))">
      Item {{ item }}
    </div>
  </TransitionGroup>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-move {
  transition: transform 0.3s ease;
}
</style>
```
</details>

---

### Exercice TR.4 — Mode out-in

Corrige ce code pour que l'ancien élément disparaisse AVANT que le nouveau apparaisse :

```vue
<template>
  <button @click="current = current === 'A' ? 'B' : 'A'">Switch</button>

  <Transition name="fade">
    <p v-if="current === 'A'" key="a">Contenu A</p>
    <p v-else key="b">Contenu B</p>
  </Transition>
</template>
```

<details>
<summary>Solution</summary>

```vue
<template>
  <button @click="current = current === 'A' ? 'B' : 'A'">Switch</button>

  <Transition name="fade" mode="out-in">
    <p v-if="current === 'A'" key="a">Contenu A</p>
    <p v-else key="b">Contenu B</p>
  </Transition>
</template>
```
</details>

---

## Suite

→ Module 03 : `cours/03-avance/01-vue-router.md`

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Exercice** : [08-theme-injection](../../exercices/08-theme-injection/ENONCE)
2. **Exercice** : [09-dashboard-composables](../../exercices/09-dashboard-composables/ENONCE)
3. **Exercice** : [09-dashboard-filtres](../../exercices/09-dashboard-filtres/ENONCE)
4. **Exercice** : [10-crud-api](../../exercices/10-crud-api/ENONCE)
5. **Exercice** : [11-formulaire-multi-étapes](../../exercices/11-formulaire-multi-etapes/ENONCE)
6. **Exercice** : [12-carte-profil-slots](../../exercices/12-carte-profil-slots/ENONCE)
7. **Exercice** : [13-tableau-générique](../../exercices/13-tableau-generique/ENONCE)
8. **Exercice** : [13-tableau-réutilisable](../../exercices/13-tableau-reutilisable/ENONCE)
9. **Exercice** : [14-galerie-animee](../../exercices/14-galerie-animee/ENONCE)
:::
