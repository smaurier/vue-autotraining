# Correction – Exercice 02 : Compteur Réactif

## Résultat attendu

Tu dois voir :
- Un grand nombre affiché au centre (le compteur, initialement **0**)
- La mention **"Pair"** ou **"Impair"** juste en dessous, qui change automatiquement
- Trois boutons radio pour choisir le **pas** (1, 5, 10)
- Trois boutons d'action : **« – »**, **« + »**, **« Réinitialiser »**
- Un encadré **Historique** qui affiche les 5 dernières valeurs (ex : `0 → 1 → 6 → 5 → 0`)
- Le bouton **« – »** ne descend jamais en dessous de 0

---

## Code corrigé complet

```vue
<!-- CounterReactive.vue -->
<!-- Un composant Vue 3 utilisant la Composition API avec <script setup> -->

<script setup lang="ts">
// ─────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────

// On importe les outils de Vue dont on a besoin :
// • ref      → crée une variable "réactive" (Vue surveille ses changements)
// • computed → crée une valeur calculée automatiquement à partir d'autres refs
import { ref, computed } from "vue";

// ─────────────────────────────────────────────
// ÉTAT RÉACTIF (les données du composant)
// ─────────────────────────────────────────────

// ref(0) crée une variable réactive initialisée à 0.
// Chaque fois que count.value change, Vue re-affiche le composant.
// ATTENTION : dans le script on écrit count.value, mais dans le template on écrit juste count.
const count = ref(0);

// Le pas courant : 1, 5 ou 10.
// On choisit 1 par défaut. TypeScript infère le type number.
const step = ref(1);

// L'historique des dernières valeurs.
// ref<number[]>([]) crée un tableau réactif vide.
// On précise le type explicitement car TypeScript ne peut pas le deviner tout seul.
const history = ref<number[]>([]);

// ─────────────────────────────────────────────
// VALEUR CALCULÉE (computed)
// ─────────────────────────────────────────────

// computed() recalcule automatiquement sa valeur chaque fois que count change.
// Ici, on vérifie si count.value est divisible par 2 (reste de la division = 0).
// L'opérateur % est le "modulo" : il donne le reste de la division entière.
// Exemple : 4 % 2 = 0 (pair), 5 % 2 = 1 (impair)
const parity = computed(() => {
  return count.value % 2 === 0 ? "Pair" : "Impair";
  // L'opérateur ternaire "condition ? valeurSiVrai : valeurSiFaux"
  // est un raccourci pour if/else sur une seule ligne.
});

// ─────────────────────────────────────────────
// FONCTIONS (la logique métier)
// ─────────────────────────────────────────────

// addToHistory() sauvegarde la valeur actuelle dans l'historique.
// On l'appellera AVANT de modifier le compteur, pour garder la trace.
function addToHistory(value: number) {
  // unshift() ajoute un élément AU DÉBUT du tableau (contrairement à push qui ajoute à la fin).
  // Ainsi, la valeur la plus récente est toujours en premier.
  history.value.unshift(value);

  // On limite l'historique aux 5 dernières valeurs.
  // slice(0, 5) retourne un nouveau tableau avec seulement les 5 premiers éléments.
  // On réassigne le résultat à history.value pour mettre à jour la ref.
  history.value = history.value.slice(0, 5);
}

// increment() augmente le compteur du pas choisi.
function increment() {
  addToHistory(count.value);      // On sauvegarde la valeur actuelle AVANT de changer
  count.value += step.value;      // += est un raccourci pour : count.value = count.value + step.value
}

// decrement() diminue le compteur, mais jamais en dessous de 0.
function decrement() {
  addToHistory(count.value);      // On sauvegarde la valeur actuelle AVANT de changer

  // Math.max(a, b) retourne le plus grand des deux nombres.
  // Ici : si (count.value - step.value) est négatif, on garde 0.
  // Exemple : Math.max(0, -3) = 0  |  Math.max(0, 7) = 7
  count.value = Math.max(0, count.value - step.value);
}

// reset() remet tout à zéro.
function reset() {
  addToHistory(count.value);      // On conserve la dernière valeur avant le reset
  count.value = 0;                // On remet le compteur à 0
  // Note : on ne vide PAS l'historique, c'est intentionnel pour voir "d'où on vient"
}
</script>

<template>
  <!-- Le template est le HTML affiché par le composant -->
  <!-- Il ne peut y avoir qu'UN SEUL élément racine en Vue 3 -->
  <div class="counter">

    <!-- ──── AFFICHAGE DU COMPTEUR ──── -->

    <!-- {{ count }} est une "interpolation" : Vue remplace {{ }} par la valeur de la variable -->
    <!-- Pas besoin d'écrire count.value ici, Vue le fait automatiquement dans le template -->
    <h1>{{ count }}</h1>

    <!-- parity est un computed, on l'affiche comme n'importe quelle variable -->
    <p>{{ parity }}</p>

    <!-- ──── CHOIX DU PAS (boutons radio) ──── -->

    <div class="step-selector">
      <span>Pas :</span>

      <!-- v-for répète l'élément pour chaque valeur du tableau [1, 5, 10] -->
      <!-- "s" est le nom de la variable locale (la valeur courante : 1, puis 5, puis 10) -->
      <!-- :key="s" est obligatoire avec v-for : Vue en a besoin pour identifier chaque élément -->
      <!-- Le : devant key est un raccourci pour v-bind: (lie une valeur dynamique) -->
      <label v-for="s in [1, 5, 10]" :key="s">

        <!-- type="radio" : c'est un bouton radio (un seul choix possible dans le groupe) -->
        <!-- v-model="step" lie ce bouton à la ref step : quand on coche, step.value = s -->
        <!-- :value="s" définit ce que vaut ce bouton quand il est coché -->
        <!-- Sans le : devant value, on lierait la chaîne "s" et non la variable s -->
        <input type="radio" v-model="step" :value="s" />
        {{ s }}
      </label>
    </div>

    <!-- ──── BOUTONS D'ACTION ──── -->

    <div class="actions">
      <!-- @click est un raccourci pour v-on:click -->
      <!-- Quand on clique, Vue appelle la fonction decrement() -->
      <button @click="decrement">–</button>

      <!-- :disabled lie l'attribut disabled à une expression booléenne -->
      <!-- Quand count.value === 0, le bouton est désactivé (grisé, non cliquable) -->
      <!-- BONUS : on pourrait aussi désactiver si count < step, mais ici on garde simple -->

      <button @click="reset">Réinitialiser</button>

      <button @click="increment">+</button>
    </div>

    <!-- ──── HISTORIQUE ──── -->

    <!-- v-if="history.length > 0" : cet élément n'est rendu que si l'historique n'est pas vide -->
    <!-- C'est une bonne pratique : ne pas afficher un titre "Historique" s'il n'y a rien dedans -->
    <div v-if="history.length > 0" class="history">
      <h3>Historique (5 dernières valeurs)</h3>

      <!-- On affiche les valeurs séparées par " → " -->
      <!-- join(' → ') est une méthode JavaScript qui colle les éléments d'un tableau avec un séparateur -->
      <!-- Exemple : [5, 3, 0].join(' → ') donne "5 → 3 → 0" -->
      <p>{{ history.join(" → ") }}</p>
    </div>

  </div>
</template>

<style scoped>
/* scoped : ces styles ne s'appliquent qu'à CE composant, pas aux autres */
.counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
}

h1 {
  font-size: 4rem;
  margin: 0;
}

.step-selector {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

button {
  padding: 0.5rem 1.5rem;
  font-size: 1.2rem;
  cursor: pointer;
}

.history {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  text-align: center;
}
</style>
```

---

## Ce que tu aurais pu oublier

### 1. `.value` dans le script, mais pas dans le template
```ts
// ✅ Dans le script (obligatoire) :
count.value += step.value;

// ✅ Dans le template (automatique, pas de .value) :
// {{ count }}   ← Vue déballe automatiquement la ref
```
> C'est la source d'erreur n°1 avec les `ref`. Vue "déballe" automatiquement les refs dans le template, mais PAS dans le script.

---

### 2. Oublier `:value` sur les boutons radio (le `:` est crucial)
```html
<!-- ❌ FAUX : lie la chaîne de caractères "s", pas la variable s -->
<input type="radio" v-model="step" value="s" />

<!-- ✅ CORRECT : lie la valeur de la variable s (1, 5 ou 10) -->
<input type="radio" v-model="step" :value="s" />
```
> Sans le `:`, `step` deviendrait la chaîne `"s"` au lieu du nombre `1`, `5` ou `10`.  
> TypeScript aurait d'ailleurs signalé une erreur de type ici.

---

### 3. Oublier `:key` dans `v-for`
```html
<!-- ❌ FAUX : Vue affiche un avertissement et peut mal gérer les mises à jour -->
<label v-for="s in [1, 5, 10]">

<!-- ✅ CORRECT -->
<label v-for="s in [1, 5, 10]" :key="s">
```
> `:key` est comme un badge d'identification pour chaque élément répété. Vue en a besoin pour savoir quel élément mettre à jour quand les données changent.

---

### 4. Retourner une valeur dans `computed`
```ts
// ❌ FAUX : la computed ne retourne rien → affichera toujours "undefined"
const parity = computed(() => {
  if (count.value % 2 === 0) {
    "Pair"; // oubli du return !
  }
});

// ✅ CORRECT
const parity = computed(() => {
  return count.value % 2 === 0 ? "Pair" : "Impair";
});
```

---

### 5. Utiliser `push` au lieu de `unshift` pour l'ordre de l'historique
```ts
// ❌ push ajoute à la FIN → la valeur la plus ancienne est en premier
history.value.push(count.value);  // résultat : [0, 1, 6, 5]

// ✅ unshift ajoute au DÉBUT → la valeur la plus récente est en premier
history.value.unshift(count.value);  // résultat : [5, 6, 1, 0]
```

---

### 6. `Math.max` pour garantir le minimum à 0
```ts
// ❌ FAUX : le compteur peut devenir négatif
count.value -= step.value;

// ✅ CORRECT : jamais en dessous de 0
count.value = Math.max(0, count.value - step.value);
```
> `Math.max(0, x)` : si `x` est négatif, renvoie `0`. Si `x` est positif, renvoie `x`. Simple et élégant.

---

## Concepts clés utilisés

| Concept | Ce que ça fait |
|---|---|
| `ref(valeurInitiale)` | Crée une variable réactive. Vue surveille ses changements. |
| `computed(() => ...)` | Valeur qui se recalcule automatiquement quand ses dépendances changent. |
| `{{ variable }}` | Affiche la valeur d'une variable dans le HTML (interpolation). |
| `v-model="variable"` | Synchronisation bidirectionnelle entre un input et une variable. |
| `v-for="x in tableau"` | Répète un élément HTML pour chaque valeur d'un tableau. |
| `:key` | Identifiant unique pour chaque élément d'un `v-for`. |
| `v-if="condition"` | N'affiche l'élément que si la condition est vraie. |
| `@click="fonction"` | Appelle une fonction quand on clique. |
| `:attribut="valeur"` | Lie dynamiquement un attribut HTML à une variable Vue. |
