# Correction – Exercice 06 : Chronomètre

## Résultat attendu

Tu dois voir :
- Un **affichage `MM:SS:ms`** du temps qui défile (ex: `01:23:456`)
- **4 boutons** : Démarrer / Pause / Réinitialiser / Tour
- Le **bouton Démarrer** devient "Pause" quand le chrono tourne
- La **couleur du temps change** : vert < 30s · orange 30–60s · rouge > 60s
- Une **liste des tours** enregistrés avec numéro et temps
- Pas de **fuite mémoire** : le timer est bien nettoyé à la destruction du composant

---

## Structure des fichiers

```
06-chronometre/
├── StopWatch.vue   ← composant unique
└── types.ts        ← types TypeScript (déjà fourni)
```

---

## types.ts (rappel, déjà fourni)

```ts
// Un "tour" (lap) enregistre l'instant ou on a appuyé sur le bouton Tour.
export interface Lap {
  id: number;   // Numéro du tour (1, 2, 3...)
  time: string; // Temps formaté au moment du tour (ex: "01:23:456")
  elapsed: number; // Temps en millisecondes au moment du tour
}
```
> **Note :** Dans le starter original `types.ts`, le type `Lap` avait `time: number` au lieu de `time: string`. Dans cette correction on utilise `time: string` (temps déjà formaté) car c'est plus pratique à afficher. Si tu utilises le types.ts original, adapte simplement `Lap.time` en `number` et formate dans le template.

---

## Code corrigé complet — StopWatch.vue

```vue
<!-- StopWatch.vue -->
<!-- Chronomètre complet avec tours, couleurs dynamiques et nettoyage propre -->

<script setup lang="ts">
// ─────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────

// ref      : données réactives simples
// computed : valeurs calculées automatiquement
// watch    : surveiller une valeur et réagir à ses changements
// onMounted   : cycle de vie — s'exécute quand le composant est inséré dans le DOM
// onUnmounted : cycle de vie — s'exécute quand le composant est retiré du DOM
import { ref, computed, watch, onUnmounted } from "vue";
import type { Lap } from "./types";

// ─────────────────────────────────────────────
// ÉTAT RÉACTIF
// ─────────────────────────────────────────────

// elapsed : temps écoulé en millisecondes depuis le dernier démarrage/reset.
// On utilise les millisecondes comme unité interne car setInterval est précis à ~1ms.
const elapsed = ref(0);

// isRunning : true = le chrono tourne, false = il est en pause ou à l'arrêt.
const isRunning = ref(false);

// laps : tableau des tours enregistrés par l'utilisateur.
const laps = ref<Lap[]>([]);

// lapCounter : compteur pour générer les IDs de tours (1, 2, 3...).
let lapCounter = 1;

// ─────────────────────────────────────────────
// TIMER (setInterval)
// ─────────────────────────────────────────────

// intervalId stocke l'identifiant retourné par setInterval.
// On DOIT le conserver pour pouvoir arrêter le timer avec clearInterval.
// Type : ReturnType<typeof setInterval> = le type exact retourné par setInterval.
// null | ... : at départ aucun timer n'est actif.
let intervalId: ReturnType<typeof setInterval> | null = null;

// startTimer() : démarre ou reprend le chronomètre.
function startTimer() {
  if (isRunning.value) return; // Sécurité : ne pas démarrer si déjà en cours

  isRunning.value = true;

  // setInterval(fonction, délai) : appelle la fonction toutes les X millisecondes.
  // Ici, toutes les 10ms (100 fois par seconde) on ajoute 10ms à elapsed.
  // Note : setInterval n'est pas parfaitement précis, mais c'est suffisant pour un exercice.
  // Pour une précision maximale, on utiliserait Date.now() et calculerait la différence.
  intervalId = setInterval(() => {
    elapsed.value += 10; // On ajoute 10 ms à chaque tick
  }, 10);
}

// pauseTimer() : met en pause le chronomètre sans réinitialiser elapsed.
function pauseTimer() {
  if (!isRunning.value) return; // Rien à faire si déjà en pause

  isRunning.value = false;

  // clearInterval(id) : arrête le timer identifié par cet id.
  // Sans clearInterval, le timer continuerait à s'exécuter en arrière-plan → fuite mémoire !
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null; // On remet à null pour indiquer "pas de timer actif"
  }
}

// resetTimer() : remet tout à zéro.
function resetTimer() {
  pauseTimer(); // On arrête d'abord le timer (sinon il continue)
  elapsed.value = 0;
  laps.value = [];
  lapCounter = 1;
}

// addLap() : enregistre le temps actuel comme un "tour".
function addLap() {
  if (!isRunning.value) return; // On ne peut ajouter un tour que si le chrono tourne

  laps.value.push({
    id: lapCounter++,
    time: formattedTime.value, // On sauvegarde le temps formaté actuel
    elapsed: elapsed.value,    // Et la valeur brute en ms pour d'éventuels calculs
  });
}

// ─────────────────────────────────────────────
// VALEURS CALCULÉES (computed)
// ─────────────────────────────────────────────

// formattedTime : convertit elapsed (en ms) en chaîne "MM:SS:ms".
const formattedTime = computed(() => {
  const totalMs = elapsed.value;

  // Math.floor() : arrondit vers le bas (entier inférieur)
  // Exemple : Math.floor(1234 / 1000) = Math.floor(1.234) = 1

  // Calcul des minutes : 1 minute = 60 000 ms
  const minutes = Math.floor(totalMs / 60000);

  // Calcul des secondes : on retire les minutes complètes, puis on divise par 1000
  const seconds = Math.floor((totalMs % 60000) / 1000);
  // % = modulo : reste de la division entière
  // 75000 % 60000 = 15000 (reste après avoir retiré 1 minute complète)

  // Calcul des millisecondes restantes
  const ms = totalMs % 1000;

  // String.padStart(longueur, caractère) : complète la chaîne à gauche
  // "5".padStart(2, "0") → "05" (2 chiffres minimum)
  // "123".padStart(3, "0") → "123" (déjà 3 chiffres, rien à ajouter)
  // String(n) convertit le nombre en chaîne de caractères
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(ms).padStart(3, "0")}`;
});

// timeColor : classe CSS à appliquer selon le temps écoulé.
// Utilisé dans le template avec :class="timeColor" pour changer la couleur dynamiquement.
const timeColor = computed(() => {
  const seconds = elapsed.value / 1000; // On convertit ms en secondes pour les comparaisons

  if (seconds < 30) return "color-green";   // Vert si moins de 30 secondes
  if (seconds < 60) return "color-orange";  // Orange entre 30 et 60 secondes
  return "color-red";                       // Rouge au-delà de 60 secondes
});

// ─────────────────────────────────────────────
// WATCHERS
// ─────────────────────────────────────────────

// watch() surveille une valeur réactive et exécute une fonction quand elle change.
// Ici on surveille elapsed pour logger sa valeur en console.
// C'est une démonstration de watch — en production on l'enlèverait.
watch(elapsed, (newValue) => {
  // newValue est la nouvelle valeur (après le changement)
  // En commentant/décommentant cette ligne, on peut voir les mises à jour dans la console
  // console.log("Temps écoulé :", newValue, "ms");

  // Exemple pratique : on pourrait aussi déclencher une alarme si elapsed > 5 minutes
  // if (newValue >= 300000) { alert("5 minutes écoulées !"); pauseTimer(); }
});

// watchEffect() s'exécute immédiatement et à chaque fois qu'une dépendance change.
// Contrairement à watch(), il détecte automatiquement ses dépendances.
// Ici on l'utilise pour logger la couleur actuelle — essentiellement pédagogique.
// (On pourrait aussi utiliser watch(timeColor, ...) mais watchEffect est plus compact)
// Note : on décommente le console.log pour voir l'effet en dev
// const stopWatcher = watchEffect(() => {
//   console.log("Couleur actuelle :", timeColor.value);
// });

// ─────────────────────────────────────────────
// CYCLE DE VIE
// ─────────────────────────────────────────────

// onUnmounted : appelé quand le composant est RETIRÉ du DOM (navigation, fermeture...).
// CRUCIAL : on DOIT nettoyer le timer ici pour éviter les fuites mémoire.
// Si on ne fait pas ça, le setInterval continuerait à s'exécuter même après la navigation.
// Cela consommerait de la mémoire et pourrait causer des bugs difficiles à diagnostiquer.
onUnmounted(() => {
  // On arrête proprement le timer s'il tourne encore
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  // Si on avait un watchEffect, on l'arrêterait aussi ici :
  // stopWatcher();
});

// Note sur onMounted :
// On N'utilise PAS onMounted ici car on ne veut pas démarrer le chrono automatiquement.
// onMounted serait utile si on voulait, par exemple, focaliser un bouton au chargement :
// onMounted(() => { document.getElementById("start-btn")?.focus(); });
</script>

<template>
  <div class="stopwatch">
    <h2>Chronomètre</h2>

    <!-- ──── AFFICHAGE DU TEMPS ──── -->
    <!-- :class lie dynamiquement la classe CSS retournée par le computed timeColor -->
    <!-- La classe change automatiquement quand elapsed change -->
    <div class="time-display" :class="timeColor">
      {{ formattedTime }}
    </div>

    <!-- ──── BOUTONS DE CONTRÔLE ──── -->
    <div class="controls">

      <!-- Bouton Démarrer/Pause (bascule selon isRunning) -->
      <!-- On utilise une expression ternaire pour changer le texte selon l'état -->
      <!-- et on appelle la fonction appropriée -->
      <button
        v-if="!isRunning"
        @click="startTimer"
        class="btn btn-start"
      >
        ▶ Démarrer
      </button>

      <button
        v-else
        @click="pauseTimer"
        class="btn btn-pause"
      >
        ⏸ Pause
      </button>

      <!-- Bouton Réinitialiser -->
      <button @click="resetTimer" class="btn btn-reset">
        ↺ Réinitialiser
      </button>

      <!-- Bouton Tour : désactivé si le chrono ne tourne pas -->
      <!-- :disabled="!isRunning" : on ne peut prendre un tour que si le chrono tourne -->
      <button
        @click="addLap"
        :disabled="!isRunning"
        class="btn btn-lap"
      >
        ⚑ Tour
      </button>

    </div>

    <!-- ──── LISTE DES TOURS ──── -->
    <!-- v-if : n'affiche la section que s'il y a au moins 1 tour -->
    <div v-if="laps.length > 0" class="laps">
      <h3>Tours</h3>
      <ul>
        <!-- v-for avec :key sur l'ID stable du tour -->
        <!-- On affiche les tours dans l'ordre inverse (dernier en premier) avec .slice().reverse() -->
        <!-- .slice() crée une copie du tableau (on ne modifie pas l'original) -->
        <!-- .reverse() inverse l'ordre de la copie -->
        <li v-for="lap in [...laps].reverse()" :key="lap.id">
          <span class="lap-number">Tour {{ lap.id }}</span>
          <span class="lap-time">{{ lap.time }}</span>
        </li>
      </ul>
    </div>

  </div>
</template>

<style scoped>
.stopwatch {
  max-width: 400px;
  margin: 2rem auto;
  padding: 1.5rem;
  font-family: monospace; /* Police à chasse fixe : les chiffres ont tous la même largeur */
  text-align: center;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: #f9fafb;
}

/* Affichage principal du temps */
.time-display {
  font-size: 3.5rem;
  font-weight: bold;
  letter-spacing: 2px;
  margin: 1rem 0;
  transition: color 0.5s ease; /* Transition douce lors du changement de couleur */
}

/* Les 3 classes de couleur ajoutées dynamiquement par le computed timeColor */
.color-green  { color: #16a34a; } /* Vert */
.color-orange { color: #ea580c; } /* Orange */
.color-red    { color: #dc2626; } /* Rouge */

/* Zone des boutons */
.controls {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: sans-serif;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

/* Légère animation au clic */
.btn:active:not(:disabled) {
  transform: scale(0.96);
}

.btn-start  { background: #16a34a; color: white; }
.btn-pause  { background: #ea580c; color: white; }
.btn-reset  { background: #6b7280; color: white; }
.btn-lap    { background: #3b82f6; color: white; }

.btn-start:hover  { background: #15803d; }
.btn-pause:hover  { background: #c2410c; }
.btn-reset:hover  { background: #4b5563; }
.btn-lap:hover:not(:disabled)   { background: #2563eb; }

.btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

/* Liste des tours */
.laps {
  text-align: left;
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}

.laps h3 {
  font-family: sans-serif;
  margin: 0 0 0.75rem 0;
  color: #374151;
}

.laps ul {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 200px;
  overflow-y: auto; /* Scrollbar si trop de tours */
}

.laps li {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.95rem;
}

.lap-number {
  color: #6b7280;
}

.lap-time {
  font-weight: bold;
  color: #1f2937;
}
</style>
```

---

## Ce que tu aurais pu oublier

### 1. Ne pas nettoyer le timer avec `clearInterval` → fuite mémoire

```ts
// ❌ FAUX : le timer continue à s'exécuter après la destruction du composant !
// Si tu navigues vers une autre page, elapsed.value continue à s'incrémenter
// dans le vide → consommation mémoire, erreurs console, comportement imprévisible.
onMounted(() => {
  setInterval(() => { elapsed.value += 10; }, 10);
  // On a oublié de sauvegarder intervalId donc on ne peut pas l'arrêter !
});

// ✅ CORRECT : sauvegarder l'ID et nettoyer dans onUnmounted
let intervalId: ReturnType<typeof setInterval> | null = null;

function startTimer() {
  intervalId = setInterval(() => { elapsed.value += 10; }, 10);
}

onUnmounted(() => {
  if (intervalId !== null) clearInterval(intervalId);
});
```

---

### 2. Confondre `watch` et `watchEffect`
```ts
// watch(source, callback) : surveillance EXPLICITE d'une ou plusieurs sources
// Tu contrôles exactement quoi surveiller
watch(elapsed, (newVal, oldVal) => {
  console.log("Avant :", oldVal, "Après :", newVal);
});

// watchEffect(callback) : surveillance AUTOMATIQUE
// Vue détecte automatiquement les refs utilisées DANS le callback
// S'exécute IMMÉDIATEMENT au démarrage (comme watch avec { immediate: true })
watchEffect(() => {
  // elapsed.value est utilisé ici → Vue surveille automatiquement elapsed
  console.log("Temps :", elapsed.value);
});

// watch avec { immediate: true } : même comportement que watchEffect
watch(elapsed, (val) => {
  console.log("Temps :", val);
}, { immediate: true });
```

---

### 3. Utiliser `setTimeout` au lieu de `setInterval`
```ts
// ❌ FAUX : setTimeout ne s'exécute qu'UNE SEULE FOIS après le délai
setTimeout(() => {
  elapsed.value += 10;
}, 10);
// → elapsed augmente de 10 après 10ms, puis plus rien.

// ✅ CORRECT : setInterval s'exécute RÉPÉTITIVEMENT toutes les X ms
intervalId = setInterval(() => {
  elapsed.value += 10;
}, 10);
// → elapsed augmente de 10 toutes les 10ms, indéfiniment jusqu'à clearInterval
```

---

### 4. `padStart` pour le formatage du temps
```ts
// Sans padStart : les petites valeurs s'affichent avec 1 chiffre → saut visuel
// 0 secondes → "0:0:0" puis 10 secondes → "0:10:0" → le chrono "saute"

// ✅ CORRECT : padStart assure toujours le même nombre de chiffres
String(5).padStart(2, "0")    // → "05" (toujours 2 chiffres pour les secondes)
String(75).padStart(2, "0")   // → "75" (déjà 2 chiffres, pas de changement)
String(42).padStart(3, "0")   // → "042" (3 chiffres pour les ms)
String(1042).padStart(3, "0") // → "1042" (plus de 3 chiffres, padStart n'enlève pas)
```

---

### 5. Modifier le tableau `laps` en place avec `.reverse()`
```ts
// ❌ FAUX : .reverse() modifie le tableau ORIGINAL en place
// Le dernier tour deviendrait le premier dans laps.value → comportement imprévisible
laps.value.reverse(); // Inverse laps.value lui-même !

// ✅ CORRECT : créer une copie avant d'inverser
[...laps.value].reverse()    // Spread crée une copie, reverse() inverse la copie
// Ou :
laps.value.slice().reverse() // slice() sans arguments crée aussi une copie
```

---

## Concepts clés utilisés

| Concept | Ce que ça fait |
|---|---|
| `setInterval(fn, ms)` | Appelle `fn` toutes les `ms` millisecondes, en boucle |
| `clearInterval(id)` | Arrête le timer identifié par `id` |
| `onUnmounted()` | S'exécute quand le composant est détruit — nettoyage |
| `watch(source, fn)` | Surveille une ref et réagit quand elle change |
| `watchEffect(fn)` | Surveille automatiquement les refs utilisées dans `fn`, s'exécute immédiatement |
| `Math.floor()` | Arrondit vers le bas (entier inférieur ou égal) |
| `%` (modulo) | Reste de la division entière — isole minutes, secondes, ms |
| `String(n).padStart(n, "0")` | Complète un nombre avec des zéros à gauche |
| `:class="computedClass"` | Applique dynamiquement une classe CSS |
| `v-if / v-else` | Alterne entre deux éléments (ici Démarrer / Pause) |
| `[...array].reverse()` | Inverse une copie du tableau sans modifier l'original |
| `ReturnType<typeof fn>` | Type TypeScript : déduit le type de retour d'une fonction |
