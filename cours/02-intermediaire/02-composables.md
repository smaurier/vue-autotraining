# 02 — Les Composables : ta boîte à outils réutilisable 🧰

## C'est quoi un composable ?

Imagine une **boîte à outils** que tu peux emmener partout. Dedans, il y a un marteau, un tournevis, un mètre... Tu peux l'utiliser dans la cuisine, dans le salon, dans le garage — partout où tu en as besoin.

Un **composable** en Vue, c'est exactement ça : c'est une **fonction** qui contient de la **logique réactive** (des `ref`, des `computed`, des `watch`...) et que tu peux **réutiliser dans n'importe quel composant**.

Au lieu de copier-coller le même code dans 5 composants différents, tu le mets dans un composable et tu l'importes partout où tu en as besoin.

---

## 📌 Rappel JavaScript : les fonctions qui retournent des objets

Un composable est une **fonction qui retourne un objet**. Revoyons comment ça marche en JavaScript pur :

```js
// En JavaScript, une fonction peut retourner un objet
// Un objet, c'est un "sac" qui contient des valeurs et des fonctions

function createCounter() {
  let count = 0;                       // Une variable interne

  function increment() {               // Une fonction interne
    count++;
    console.log("count =", count);
  }

  function reset() {                   // Une autre fonction interne
    count = 0;
    console.log("count remis à 0");
  }

  // On retourne un objet avec ce qu'on veut rendre accessible
  return { count, increment, reset };
}

// Utilisation :
const counter = createCounter();       // On appelle la fonction
counter.increment();                   // count = 1
counter.increment();                   // count = 2
counter.reset();                       // count remis à 0
```

### 📌 Rappel JavaScript : la déstructuration d'objet

```js
// Au lieu de récupérer tout l'objet...
const counter = createCounter();
counter.increment();

// ...on peut extraire directement les propriétés qu'on veut
// C'est la "déstructuration" : on ouvre des { } pour nommer ce qu'on prend
const { count, increment, reset } = createCounter();
increment(); // Pas besoin de counter.increment()
```

**Retiens :** un composable est une fonction qui retourne un objet contenant des données et des fonctions. On utilise la déstructuration pour récupérer ce dont on a besoin.

---

## La convention de nommage : `use` + nom en camelCase

Tous les composables commencent par **`use`** suivi du nom en camelCase :

- `useCounter` → logique de compteur
- `useWindowSize` → taille de la fenêtre
- `useFetch` → requêtes HTTP
- `useAuth` → authentification

**Pourquoi `use` ?** C'est une convention popularisée par React Hooks et adoptée par Vue. Quand tu vois `use...`, tu sais immédiatement que c'est un composable qui contient de la logique réactive.

Les fichiers se placent dans un dossier `composables/` :
```
src/
  composables/
    useCounter.ts
    useWindowSize.ts
    useDebounce.ts
```

---

## Premier composable : `useCounter` (le plus simple possible)

Commençons par un composable minimaliste pour comprendre la structure :

```ts
// composables/useCounter.ts
import { ref } from "vue";                  // On importe ref depuis Vue

// Le composable est une simple fonction exportée
// Elle commence par "use" : c'est la convention
export function useCounter() {
  const count = ref<number>(0);              // On crée une donnée réactive (un compteur)

  function increment(): void {               // Fonction pour augmenter de 1
    count.value++;                           // On modifie la valeur de la ref
  }

  function decrement(): void {               // Fonction pour diminuer de 1
    count.value--;
  }

  // On retourne un objet avec tout ce qu'on veut rendre accessible
  return { count, increment, decrement };
}
```

```vue
<!-- MonComposant.vue — Utilisation du composable -->
<script setup lang="ts">
import { useCounter } from "@/composables/useCounter"; // On importe le composable

// On déstructure : on récupère count, increment et decrement
const { count, increment, decrement } = useCounter();
// count est une Ref<number>, increment et decrement sont des fonctions
// C'est prêt à utiliser !
</script>

<template>
  <div>
    <p>Compteur : {{ count }}</p>
    <button @click="increment">+1</button>
    <button @click="decrement">-1</button>
  </div>
</template>
```

**La magie :** si tu as 10 composants qui ont besoin d'un compteur, tu importes `useCounter` dans chacun. Chaque appel crée sa **propre instance** avec ses propres données. Modifier le compteur dans un composant ne touche pas les autres.

---

## Composable un peu plus complet : avec paramètres et `computed`

Ajoutons des paramètres et des valeurs calculées :

```ts
// composables/useCounter.ts — Version améliorée
import { ref, computed } from "vue";

// Les paramètres ont des valeurs par défaut (= "si non fourni, utilise ça")
// initial : valeur de départ du compteur (par défaut : 0)
// min : valeur minimum (par défaut : 0)
// max : valeur maximum (par défaut : Infinity = infini)
export function useCounter(initial = 0, min = 0, max = Infinity) {
  const count = ref<number>(initial);        // Le compteur commence à "initial"

  // computed = valeur calculée automatiquement
  // canDecrement sera true si count > min (on peut encore diminuer)
  const canDecrement = computed(() => count.value > min);
  // canIncrement sera true si count < max (on peut encore augmenter)
  const canIncrement = computed(() => count.value < max);

  function increment(): void {
    if (canIncrement.value) count.value++;    // Augmente seulement si on n'est pas au max
  }

  function decrement(): void {
    if (canDecrement.value) count.value--;    // Diminue seulement si on n'est pas au min
  }

  function reset(): void {
    count.value = initial;                    // Remet le compteur à sa valeur initiale
  }

  // On retourne tout ce qui peut être utile à l'extérieur
  return { count, canDecrement, canIncrement, increment, decrement, reset };
}
```

```vue
<script setup lang="ts">
import { useCounter } from "@/composables/useCounter";

// On crée un compteur qui va de 0 à 10
const { count, increment, decrement, reset, canIncrement, canDecrement } = useCounter(0, 0, 10);
// count commence à 0, ne peut pas descendre en dessous de 0 ni dépasser 10
</script>

<template>
  <div>
    <p>Compteur : {{ count }}</p>
    <!-- Les boutons sont désactivés quand on ne peut plus cliquer -->
    <button @click="decrement" :disabled="!canDecrement">-1</button>
    <button @click="increment" :disabled="!canIncrement">+1</button>
    <button @click="reset">Remettre à zéro</button>
  </div>
</template>
```

---

## Les 4 règles d'un bon composable

1. **Signature claire** : les paramètres d'entrée et le retour sont explicites et typés
2. **État minimal exposé** : ne retourne **que** ce qui est utile (pas tes variables internes privées)
3. **Side effects maîtrisés** : si tu crées un `addEventListener`, pense à le supprimer dans `onUnmounted` (nettoyage)
4. **Testable** : ton composable fonctionne même sans composant (tu peux l'appeler directement dans un test)

---

## Composable avec "side effect" : `useWindowSize`

### 📌 Rappel JavaScript : les événements du navigateur

```js
// Le navigateur peut écouter des événements (clic, redimensionnement, etc.)

// addEventListener = "quand cet événement arrive, exécute cette fonction"
window.addEventListener("resize", () => {
  console.log("La fenêtre a été redimensionnée !");
});

// removeEventListener = "arrête d'écouter cet événement"
// ⚠️ IMPORTANT : il faut TOUJOURS nettoyer quand on n'en a plus besoin
// Sinon, la fonction continue de tourner en arrière-plan = fuite de mémoire
```

### Le composable

Ce composable est un bon exemple de "side effect" : il écoute un événement du navigateur (`resize`), donc il doit **nettoyer** quand le composant est détruit.

```ts
// composables/useWindowSize.ts
import { ref, onMounted, onUnmounted } from "vue";

// Interface = la forme de l'objet qu'on va retourner
interface WindowSize {
  width: number;   // Largeur de la fenêtre en pixels
  height: number;  // Hauteur de la fenêtre en pixels
}

export function useWindowSize(): WindowSize {
  // On crée deux refs avec la taille actuelle de la fenêtre
  const width = ref<number>(window.innerWidth);   // Largeur actuelle
  const height = ref<number>(window.innerHeight); // Hauteur actuelle

  // Cette fonction met à jour nos refs quand la fenêtre est redimensionnée
  function update(): void {
    width.value = window.innerWidth;
    height.value = window.innerHeight;
  }

  // onMounted = "quand le composant apparaît sur la page"
  // → On commence à écouter les redimensionnements
  onMounted(() => window.addEventListener("resize", update));

  // onUnmounted = "quand le composant est retiré de la page"
  // → On arrête d'écouter (NETTOYAGE !)
  onUnmounted(() => window.removeEventListener("resize", update));

  return { width, height };
}
```

```vue
<script setup lang="ts">
import { useWindowSize } from "@/composables/useWindowSize";

// On récupère la largeur et la hauteur (réactives !)
const { width, height } = useWindowSize();
// Ces valeurs se mettent à jour automatiquement quand on redimensionne la fenêtre
</script>

<template>
  <p>Fenêtre : {{ width }}px × {{ height }}px</p>
</template>
```

---

## Composable avec paramètres réactifs : `useDebounce`

### 📌 Rappel JavaScript : `setTimeout` et le concept de "debounce"

```js
// setTimeout exécute une fonction APRÈS un délai
setTimeout(() => {
  console.log("Exécuté après 500ms");
}, 500);

// clearTimeout ANNULE un setTimeout avant qu'il s'exécute
const timer = setTimeout(() => console.log("..."), 500);
clearTimeout(timer); // Annulé ! Le console.log ne s'exécutera jamais.

// Le "debounce" c'est : "attend que l'utilisateur ait FINI de taper
// avant de lancer la recherche". On attend un certain délai sans activité.
// Exemple : l'utilisateur tape "b", "o", "n", "j", "o", "u", "r"
// On attend 500ms après le dernier "r" avant de chercher "bonjour"
```

### Le composable

```ts
// composables/useDebounce.ts
import { ref, watch, type Ref } from "vue";

// <T> = générique : ça veut dire "ça marche avec n'importe quel type"
// source = la ref à surveiller
// delay = combien de millisecondes attendre (par défaut 300ms)
export function useDebounce<T>(source: Ref<T>, delay = 300): Ref<T> {
  // On crée une nouvelle ref qui contiendra la valeur "retardée"
  const debounced = ref<T>(source.value) as Ref<T>;

  // Variable pour stocker le timer en cours
  let timeout: ReturnType<typeof setTimeout>;

  // On surveille la source : à chaque changement...
  watch(source, (val) => {
    clearTimeout(timeout);           // ...on annule le timer précédent
    timeout = setTimeout(() => {     // ...on lance un nouveau timer
      debounced.value = val;         // ...qui met à jour la valeur après le délai
    }, delay);
  });

  return debounced; // On retourne la ref "retardée"
}
```

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useDebounce } from "@/composables/useDebounce";

const search = ref<string>("");                      // Ce que l'utilisateur tape
const debouncedSearch = useDebounce(search, 500);    // Version "retardée" (500ms)

// Quand l'utilisateur tape "bonjour" caractère par caractère :
// search change à chaque lettre : "b", "bo", "bon", "bonj", "bonjo", "bonjou", "bonjour"
// debouncedSearch ne change qu'une fois : "bonjour" (500ms après la dernière lettre)
// → On évite d'envoyer 7 requêtes au serveur, on n'en envoie qu'UNE
</script>

<template>
  <input v-model="search" placeholder="Rechercher..." />
  <p>Tu tapes : {{ search }}</p>
  <p>Recherche envoyée : {{ debouncedSearch }}</p>
</template>
```

---

## Composable async : `useAsyncData` (charger des données)

### 📌 Rappel JavaScript : `async` / `await` et `try` / `catch`

```js
// async/await permet d'écrire du code asynchrone (qui attend des réponses)

async function chargerDonnees() {
  try {
    // try = "essaie d'exécuter ce code"
    const response = await fetch("/api/users"); // Envoie une requête HTTP
    const data = await response.json();         // Convertit la réponse en objet JS
    console.log(data);                          // Affiche les données
  } catch (err) {
    // catch = "si ça échoue, exécute ce code"
    console.error("Erreur :", err);             // Affiche l'erreur
  }
}
```

### Le composable

Ce composable est un **outil générique** pour charger des données depuis une API. Il gère automatiquement l'état (chargement, succès, erreur).

```ts
// composables/useAsyncData.ts
import { ref, type Ref } from "vue";

// Les 4 états possibles d'un chargement
type AsyncStatus = "idle"      // Pas encore lancé
                 | "loading"   // En cours de chargement
                 | "error"     // Échec
                 | "success";  // Succès

// L'interface décrit ce que le composable va retourner
interface UseAsyncDataReturn<T> {
  data: Ref<T | null>;           // Les données (null si pas encore chargées)
  error: Ref<string | null>;     // Le message d'erreur (null si tout va bien)
  status: Ref<AsyncStatus>;      // L'état actuel
  execute: () => Promise<void>;  // La fonction pour lancer le chargement
}

// fetcher = une fonction qui retourne une Promise (= une promesse de données)
// Exemple : () => fetch("/api/users").then(r => r.json())
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
): UseAsyncDataReturn<T> {
  const data = ref<T | null>(null) as Ref<T | null>;  // Les données (vide au départ)
  const error = ref<string | null>(null);              // L'erreur (aucune au départ)
  const status = ref<AsyncStatus>("idle");             // L'état (pas encore lancé)

  // La fonction qui lance le chargement
  async function execute(): Promise<void> {
    status.value = "loading";    // On passe en mode "chargement"
    error.value = null;          // On efface l'erreur précédente

    try {
      data.value = await fetcher();  // On attend les données
      status.value = "success";       // Tout s'est bien passé !
    } catch (err) {
      // Si ça échoue, on récupère le message d'erreur
      error.value = err instanceof Error ? err.message : "Erreur inconnue";
      status.value = "error";         // On passe en mode "erreur"
    }
  }

  return { data, error, status, execute };
}
```

### Utilisation dans un composant

```vue
<script setup lang="ts">
import { onMounted } from "vue";
import { useAsyncData } from "@/composables/useAsyncData";

// On définit la forme d'un utilisateur
interface User {
  id: number;     // Identifiant
  name: string;   // Nom
}

// On utilise le composable pour charger une liste d'utilisateurs
const {
  data: users,     // On renomme "data" en "users" pour plus de clarté
  status,          // L'état (idle, loading, error, success)
  error,           // Le message d'erreur éventuel
  execute,         // La fonction de chargement
} = useAsyncData<User[]>(
  // Le fetcher : une fonction qui va chercher les données
  () => fetch("/api/users").then((r) => r.json())
);

// onMounted = "quand le composant apparaît, lance le chargement"
onMounted(execute);
</script>

<template>
  <!-- On affiche un message différent selon l'état -->
  <p v-if="status === 'loading'">Chargement...</p>
  <p v-else-if="status === 'error'">{{ error }}</p>
  <ul v-else-if="users">
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

---

## Composable avec injection : `useApi`

Parfois, un composable a besoin de récupérer quelque chose fourni par un parent via `provide` / `inject` (voir chapitre précédent) :

```ts
// composables/useApi.ts
import { inject } from "vue";
import { ApiClientKey } from "@/types";  // La clé d'injection (voir provide/inject)

export function useApi() {
  // inject() récupère ce qu'un composant parent a fourni avec provide()
  const client = inject(ApiClientKey);

  // Si aucun parent n'a fait provide(), client sera undefined
  // On lève une erreur explicite pour que le développeur comprenne le problème
  if (!client) throw new Error("ApiClient non fourni via provide");

  return client; // On retourne le client API, prêt à être utilisé
}
```

---

## Composer des composables entre eux (la vraie puissance 💪)

Un composable peut **utiliser d'autres composables** ! C'est comme empiler des briques LEGO : chaque brique est simple, mais ensemble elles créent quelque chose de puissant.

```ts
// composables/useSearchUsers.ts
import { ref, watch } from "vue";
import { useDebounce } from "./useDebounce";       // Composable de debounce
import { useAsyncData } from "./useAsyncData";     // Composable de chargement

interface User {
  id: number;
  name: string;
}

export function useSearchUsers() {
  const search = ref<string>("");                   // Ce que l'utilisateur tape
  const debouncedSearch = useDebounce(search, 300); // Version retardée (300ms)

  // On configure le chargement des utilisateurs
  const {
    data: users,
    status,
    execute,
  } = useAsyncData<User[]>(
    // La requête utilise la recherche retardée
    () => fetch(`/api/users?q=${debouncedSearch.value}`).then((r) => r.json()),
  );

  // Quand la recherche retardée change → on relance le chargement
  watch(debouncedSearch, () => execute());

  // On ne retourne que ce qui est utile au composant
  return { search, users, status };
}
```

```vue
<script setup lang="ts">
import { useSearchUsers } from "@/composables/useSearchUsers";

// Une seule ligne et on a tout : recherche, données, état !
const { search, users, status } = useSearchUsers();
</script>

<template>
  <input v-model="search" placeholder="Chercher un utilisateur..." />
  <p v-if="status === 'loading'">Recherche en cours...</p>
  <ul v-else-if="users">
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

---

## Pourquoi les composables sont mieux que les "mixins" ?

### C'est quoi un mixin ? (l'ancienne façon de partager du code en Vue 2)

En Vue 2, pour partager de la logique entre composants, on utilisait les **mixins**. C'était une façon de "fusionner" le code d'un objet dans un composant. Mais ça posait beaucoup de problèmes.

### Comparaison : mixins vs composables

| Problème                        | Mixins ❌                                       | Composables ✅                                    |
| ------------------------------- | ----------------------------------------------- | ------------------------------------------------ |
| **D'où vient cette variable ?** | Impossible à savoir (fusionnée magiquement)     | Clair : `const { count } = useCounter()`         |
| **Conflits de noms**            | Si 2 mixins ont un `data.count`, ça casse       | Chaque composable a son propre scope             |
| **TypeScript**                  | Très mauvais support                            | Support parfait (tout est typé)                  |
| **Testabilité**                 | Difficile (dépend du composant)                 | Facile (fonction pure, testable seule)           |
| **Composition**                 | Les mixins ne se composent pas bien entre eux   | Les composables s'empilent comme des LEGO        |

**En résumé :** les composables sont plus clairs, plus sûrs, plus testables et plus flexibles. Il n'y a aucune raison d'utiliser des mixins en Vue 3.

---

## Récapitulatif

| Concept                  | Explication                                                                 |
| ------------------------ | --------------------------------------------------------------------------- |
| Composable               | Fonction `use...()` qui contient de la logique réactive réutilisable        |
| Convention de nommage    | `use` + nom en camelCase → `useCounter`, `useAuth`, `useFetch`              |
| Retour                   | Un objet avec des refs, computed, fonctions                                 |
| Paramètres               | Peuvent être des valeurs simples ou des refs (paramètres réactifs)          |
| Side effects             | Toujours nettoyer dans `onUnmounted` (removeEventListener, clearTimeout...) |
| Composition              | Un composable peut utiliser d'autres composables                            |
| Avantage vs mixins       | Clarté, typage, pas de conflits de noms, testable                           |

---

## 🎯 Pratique

### Exercice CP.1 — Premier composable

Crée un composable `useToggle` qui gère un état booleen (on/off) :

```ts
// composables/useToggle.ts
import { ref } from 'vue'

export function useToggle(initial = false) {
  // Crée une ref avec la valeur initiale
  // ???

  // Fonction pour inverser la valeur
  // ???

  // Fonction pour mettre à true
  // ???

  // Fonction pour mettre à false
  // ???

  return { ??? }
}
```

<details>
<summary>Solution</summary>

```ts
import { ref } from 'vue'

export function useToggle(initial = false) {
  const isActive = ref(initial)

  function toggle() {
    isActive.value = !isActive.value
  }

  function setTrue() {
    isActive.value = true
  }

  function setFalse() {
    isActive.value = false
  }

  return { isActive, toggle, setTrue, setFalse }
}
```
</details>

---

### Exercice CP.2 — Composable avec computed

Crée un composable `useFullName` qui combine prénom et nom :

```ts
// composables/useFullName.ts
import { ref, computed, type Ref } from 'vue'

export function useFullName(firstName: Ref<string>, lastName: Ref<string>) {
  // Crée un computed qui retourne "Prénom Nom"
  // ???

  // Crée un computed qui retourne les initiales "P.N."
  // ???

  return { ??? }
}
```

<details>
<summary>Solution</summary>

```ts
import { computed, type Ref } from 'vue'

export function useFullName(firstName: Ref<string>, lastName: Ref<string>) {
  const fullName = computed(() => `${firstName.value} ${lastName.value}`)

  const initials = computed(() => {
    const f = firstName.value.charAt(0).toUpperCase()
    const l = lastName.value.charAt(0).toUpperCase()
    return `${f}.${l}.`
  })

  return { fullName, initials }
}
```
</details>

---

### Exercice CP.3 — Composable avec cleanup

Complète ce composable `useInterval` qui exécute une fonction régulièrement :

```ts
// composables/useInterval.ts
import { onUnmounted } from 'vue'

export function useInterval(callback: () => void, delay: number) {
  // Lance l'intervalle
  // ???

  // Arrête l'intervalle quand le composant est détruit
  // ???
}
```

<details>
<summary>Solution</summary>

```ts
import { onUnmounted } from 'vue'

export function useInterval(callback: () => void, delay: number) {
  const intervalId = setInterval(callback, delay)

  onUnmounted(() => {
    clearInterval(intervalId)
  })
}
```
</details>

---

### Exercice CP.4 — Composable avec watch

Crée un composable `useLocalStorage` qui synchronise une ref avec le localStorage :

```ts
// composables/useLocalStorage.ts
import { ref, watch, type Ref } from 'vue'

export function useLocalStorage<T>(key: string, defaultValue: T): Ref<T> {
  // 1. Lis la valeur du localStorage (ou utilise la valeur par défaut)
  // ???

  // 2. Crée une ref avec cette valeur
  // ???

  // 3. Quand la ref change, sauvegarde dans localStorage
  // ???

  return ???
}
```

<details>
<summary>Solution</summary>

```ts
import { ref, watch, type Ref } from 'vue'

export function useLocalStorage<T>(key: string, defaultValue: T): Ref<T> {
  const stored = localStorage.getItem(key)
  const initial = stored ? JSON.parse(stored) : defaultValue

  const data = ref<T>(initial) as Ref<T>

  watch(data, (newVal) => {
    localStorage.setItem(key, JSON.stringify(newVal))
  }, { deep: true })

  return data
}
```
</details>

---

## Exercice

→ `exercices/06-dashboard-filtres/ENONCE.md`

## Suite

→ `cours/02-intermediaire/03-gestion-async.md`
