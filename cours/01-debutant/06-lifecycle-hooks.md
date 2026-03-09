# 06 — Lifecycle Hooks (les étapes de vie d'un composant)

## 🎯 Objectif de cette leçon

Comprendre **quand** un composant Vue naît, vit, se met à jour et disparaît,
et comment **exécuter du code** à chacun de ces moments.

---

> **🔄 Rappel du cours précédent**
> Avant de continuer, vérifie que tu peux répondre à ces questions :
> 1. Comment déclare-t-on des props dans un composant avec `<script setup>` ?
> 2. Comment un composant enfant peut-il envoyer un événement au parent ?
> 
> <details>
> <summary>Vérifier mes réponses</summary>
>
> 1. Avec `defineProps<{ maProps: string }>()`
> 2. Avec `defineEmits()` puis `emit('nomEvent', payload)`
> </details>

---

## L'analogie : la vie d'un être humain 🧑

Un composant Vue traverse des **étapes de vie**, exactement comme une personne :

| Étape humaine              | Étape du composant        | Ce qui se passe                                        |
| -------------------------- | ------------------------- | ------------------------------------------------------ |
| 🐣 **Naissance**          | **Création (setup)**      | Le composant est créé en mémoire, ses données existent |
| 🏠 **Emménagement**       | **Montage (mounted)**     | Le composant **apparaît sur la page** (dans le DOM)    |
| 📝 **Changement de look** | **Mise à jour (updated)** | Les données changent, la page se redessine             |
| 🚪 **Déménagement**       | **Démontage (unmounted)** | Le composant **disparaît de la page**                  |

---

## Rappel : c'est quoi le DOM ?

> Le **DOM** (Document Object Model) c'est la **page web telle que le navigateur la voit**.
> Quand on dit "le composant est dans le DOM", ça veut dire : **il est visible sur la page**.
>
> Imagine le DOM comme un **tableau blanc**. "Monter" un composant = **dessiner** quelque chose
> sur le tableau. "Démonter" = **effacer** ce dessin du tableau.

---

## Le cycle de vie complet (schéma ASCII)

```
  ╔══════════════════════════════════════════════════════════╗
  ║              CYCLE DE VIE D'UN COMPOSANT VUE            ║
  ╚══════════════════════════════════════════════════════════╝

  🐣 NAISSANCE
  │
  ├── setup()              ← C'est ici qu'on est avec <script setup>
  │                           Les données (ref, computed) sont créées
  │                           ⚠️ La page n'affiche RIEN encore !
  │
  🏠 EMMÉNAGEMENT (montage)
  │
  ├── onBeforeMount        ← Juste avant d'apparaître sur la page
  ├── ✅ onMounted          ← Le composant est SUR la page !
  │                           On peut toucher au DOM, charger des données
  │
  🔄 VIE QUOTIDIENNE (mises à jour) — se répète à chaque changement
  │
  ├── onBeforeUpdate       ← Les données ont changé, la page va se redessiner
  ├── onUpdated            ← La page s'est redessinée avec les nouvelles données
  │
  🚪 DÉMÉNAGEMENT (démontage) — quand le composant n'est plus nécessaire
  │
  ├── onBeforeUnmount      ← Dernier moment où le composant est encore visible
  └── ✅ onUnmounted        ← Le composant a DISPARU de la page
                              C'est le moment de TOUT NETTOYER
```

---

## Les hooks principaux

Un **hook** (crochet en anglais) c'est une **fonction** que Vue appelle **automatiquement**
à un moment précis de la vie du composant. Tu n'appelles jamais ces fonctions toi-même :
tu les **enregistres**, et Vue s'en charge.

```ts
// Tu dis à Vue : "Quand le composant apparaît, exécute CE code"
onMounted(() => {
  // ... ce code s'exécute automatiquement au bon moment
});
```

---

### `onMounted` — "Le composant vient d'apparaître sur la page"

C'est le hook **le plus utilisé**. Il s'exécute **une seule fois**, quand le composant
est affiché pour la première fois dans la page.

**Quand l'utiliser :**
- Aller **chercher des données** sur un serveur (API)
- **Donner le focus** à un champ de saisie (le curseur clignote dedans)
- Initialiser une librairie externe (un graphique, une carte...)

```vue
<script setup lang="ts">
// On importe les outils dont on a besoin depuis Vue
import { ref, onMounted } from 'vue'

// --- Données réactives ---

// Un tableau vide qui contiendra les données du serveur
// string[] veut dire : "un tableau de chaînes de caractères"
const data = ref<string[]>([])

// Une référence vers l'élément <input> dans le template
// Au départ c'est null (l'input n'existe pas encore dans la page)
const inputRef = ref<HTMLInputElement | null>(null)

// --- Hook onMounted ---
// Ce code s'exécute quand le composant APPARAÎT sur la page

onMounted(() => {
  // 1. Donner le focus à l'input (le curseur clignote dedans)
  //    inputRef.value = l'élément HTML <input> réel
  //    ?.focus() = "si l'élément existe, donne-lui le focus"
  inputRef.value?.focus()

  // 2. Aller chercher des données sur le serveur
  //    fetch() envoie une requête HTTP (comme taper une URL dans le navigateur)
  //    .then() = "quand la réponse arrive, fais ceci..."
  fetch('/api/items')                          // Envoie la requête
    .then((res) => res.json())                 // Convertit la réponse en données JS
    .then((items) => (data.value = items))     // Stocke les données dans notre ref
})
</script>

<template>
  <!-- ref="inputRef" connecte cet <input> à notre variable inputRef -->
  <input ref="inputRef" />
</template>
```

> 💡 **Pourquoi pas dans `setup` directement ?**
> Parce que pendant `setup`, le composant **n'est pas encore sur la page**.
> C'est comme essayer d'allumer la lumière dans un appartement
> **avant d'avoir emménagé** : l'interrupteur n'existe pas encore !

---

### `onUnmounted` — "Le composant vient de disparaître"

Ce hook s'exécute quand le composant est **retiré de la page**.
Son rôle principal : **nettoyer** ce qu'on a mis en place dans `onMounted`.

#### Rappel JavaScript : `setInterval` et `clearInterval`

> ```ts
> // setInterval = répéter une action toutes les X millisecondes
> // Ici, on affiche "tic" toutes les 1000ms (= 1 seconde)
> const id: ReturnType<typeof setInterval> = setInterval(() => {
>   console.log('tic')
> }, 1000)
>
> // clearInterval = ARRÊTER cette répétition
> // On passe l'identifiant (id) pour dire QUELLE répétition arrêter
> clearInterval(id)
> ```
>
> 🚰 **Analogie** : `setInterval` c'est comme ouvrir un robinet. L'eau coule
> en continu. Si tu ne fais jamais `clearInterval`, le robinet reste ouvert
> **même quand tu quittes la pièce** → gaspillage d'eau (= fuite mémoire).

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

// On déclare une variable pour stocker l'identifiant du timer
// ReturnType<typeof setInterval> = "le type de ce que retourne setInterval"
// (c'est du TypeScript pour être précis sur le type)
let intervalId: ReturnType<typeof setInterval>

onMounted(() => {
  // Quand le composant apparaît : on OUVRE le robinet (on lance le timer)
  intervalId = setInterval(() => {
    console.log('tic')     // Affiche "tic" dans la console toutes les secondes
  }, 1000)                  // 1000 millisecondes = 1 seconde
})

onUnmounted(() => {
  // Quand le composant disparaît : on FERME le robinet (on arrête le timer)
  // Sans cette ligne, le timer continuerait à tourner en fond
  // même si le composant n'est plus visible → fuite mémoire !
  clearInterval(intervalId)
})
</script>
```

#### ⚠️ Pourquoi le nettoyage est CRUCIAL — l'analogie de la fuite d'eau

> Imagine que chaque fois que tu ouvres une page, un robinet s'ouvre.  
> Si tu **ne fermes jamais le robinet** quand tu quittes la page :
>
> - 1 robinet ouvert → pas grave
> - 10 robinets ouverts → ça commence à consommer
> - 100 robinets ouverts → **inondation** (= ton appli rame, puis plante)
>
> C'est exactement ce qu'on appelle une **fuite mémoire** (memory leak).
> Le navigateur fait de plus en plus de travail inutile jusqu'à devenir très lent.
>
> **Règle d'or** : tout ce que tu **démarres** dans `onMounted`,
> tu le **nettoies** dans `onUnmounted`.

---

### `onBeforeUnmount` — "Dernière chance avant de disparaître"

Ce hook s'exécute **juste avant** que le composant soit retiré de la page.
La différence avec `onUnmounted` : **le DOM est encore là** !
C'est utile quand une librairie externe a besoin d'accéder aux éléments HTML
pour se nettoyer proprement.

```ts
import { onBeforeUnmount } from 'vue'

onBeforeUnmount(() => {
  // Le composant est encore visible sur la page
  // On peut accéder aux éléments HTML une dernière fois
  // Exemple : détruire un graphique créé avec une librairie externe
  chart?.destroy()   // chart = instance d'un graphique (Chart.js par ex.)
  //    ?.           = "si chart existe, appelle .destroy()"
})
```

---

### `onUpdated` — "La page vient de se redessiner"

Ce hook s'exécute **à chaque fois** que les données changent et que la page
se redessine pour refléter les nouvelles données.

```ts
import { onUpdated } from 'vue'

onUpdated(() => {
  // Le DOM reflète maintenant les nouvelles données
  // Utile par exemple pour scroller vers le bas après ajout d'un message

  // ⚠️ ATTENTION : ne modifie JAMAIS l'état (les ref) ici !
  // Sinon : données changent → redessine → onUpdated modifie données
  //       → redessine → onUpdated modifie données → ... BOUCLE INFINIE !
})
```

> 💡 Ce hook est rarement utilisé au quotidien. Tu peux t'en souvenir
> sans l'apprendre par cœur.

---

## Pattern courant : mettre en place + nettoyer (setup + cleanup)

On retrouve **très souvent** ce schéma en 2 temps :
1. **onMounted** → on met en place quelque chose
2. **onUnmounted** → on nettoie cette même chose

#### Rappel JavaScript : `addEventListener` et `removeEventListener`

> ```ts
> // addEventListener = dire au navigateur :
> // "Quand CET ÉVÉNEMENT arrive, exécute CETTE FONCTION"
>
> function direBonjour(): void {
>   console.log('Bonjour !')
> }
>
> // Quand l'utilisateur clique n'importe où, affiche "Bonjour !"
> window.addEventListener('click', direBonjour)
>
> // removeEventListener = ARRÊTER d'écouter cet événement
> // ⚠️ Il faut passer la MÊME fonction que celle enregistrée !
> window.removeEventListener('click', direBonjour)
> ```
>
> Pense à `addEventListener` comme **s'abonner** à une chaîne YouTube,
> et `removeEventListener` comme **se désabonner**.

#### Exemple : écouter le redimensionnement de la fenêtre

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

// On crée la fonction AVANT les hooks pour pouvoir
// utiliser la MÊME référence dans les deux
function handleResize(): void {
  // window.innerWidth = la largeur actuelle de la fenêtre en pixels
  console.log(window.innerWidth)
}

onMounted(() => {
  // Quand le composant apparaît :
  // on S'ABONNE à l'événement "resize" (redimensionnement de fenêtre)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // Quand le composant disparaît :
  // on SE DÉSABONNE de l'événement
  // Sans ça, la fonction continuerait à être appelée
  // même si le composant n'est plus là !
  window.removeEventListener('resize', handleResize)
})
</script>
```

> 📦 On verra plus tard comment extraire ce genre de logique dans un
> **composable** (une fonction réutilisable comme `useWindowResize`).
> Pour l'instant, retiens juste le schéma **setup + cleanup**.

---

## Erreurs courantes des débutants

### ❌ Erreur 1 : Accéder au DOM avant `onMounted`

```ts
// ❌ MAUVAIS — Ce code s'exécute pendant setup()
// Le composant n'est PAS ENCORE sur la page !
const el = document.querySelector('.my-class')
// el sera probablement null car l'élément n'existe pas encore

// ✅ BON — On attend que le composant soit sur la page
import { onMounted } from 'vue'

onMounted(() => {
  // Maintenant l'élément existe dans la page, on peut le trouver
  const el = document.querySelector('.my-class')
})
```

> 🏠 C'est comme chercher ton canapé dans l'appartement **avant d'y avoir emménagé**.
> Il faut attendre le jour du déménagement (`onMounted`) !

### ❌ Erreur 2 : Oublier de nettoyer

```ts
import { onMounted } from 'vue'

// ❌ MAUVAIS — on écoute un événement mais on ne se désabonne jamais !
onMounted(() => {
  window.addEventListener('scroll', onScroll)
  // Si le composant disparaît, cette écoute continue en arrière-plan
  // → fuite mémoire (le robinet reste ouvert !)
})

// ✅ BON — on ajoute le nettoyage correspondant
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  window.addEventListener('scroll', onScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)  // On ferme le robinet
})
```

### ❌ Erreur 3 : Modifier l'état dans `onUpdated`

```ts
import { ref, onUpdated } from 'vue'

const count = ref(0)

// ❌ MAUVAIS — Modifier une ref dans onUpdated → boucle infinie !
onUpdated(() => {
  count.value++
  // count change → la page se redessine → onUpdated se relance
  // → count change → la page se redessine → ... à l'infini !
})
```

---

## Résumé visuel

```
  onMounted          →  "Le composant est NÉ et visible"
  ────────────────      Utilise pour : fetch, focus, addEventListener

  onUnmounted        →  "Le composant est MORT"
  ────────────────      Utilise pour : clearInterval, removeEventListener

  onBeforeUnmount    →  "Le composant va bientôt mourir"
  ────────────────      Utilise pour : dernier accès au DOM

  onUpdated          →  "Le composant a changé d'apparence"
  ────────────────      Utilise pour : mesures DOM (rarement utilisé)
```

| Hook              | Quand                     | Usage principal                      |
| ----------------- | ------------------------- | ------------------------------------ |
| `onMounted`       | Composant visible (1 fois) | Fetch, focus, init librairies       |
| `onUnmounted`     | Composant retiré          | Cleanup (timers, listeners)          |
| `onBeforeUnmount` | Juste avant retrait       | Dernier accès au DOM                 |
| `onUpdated`       | Après chaque re-rendu     | Scroll, mesures (⚠️ pas d'état ici) |

### La règle d'or à retenir

> **Tout ce que tu DÉMARRES dans `onMounted`,**
> **tu le NETTOIES dans `onUnmounted`.**
>
> `addEventListener` ↔ `removeEventListener`
> `setInterval` ↔ `clearInterval`
> `subscribe` ↔ `unsubscribe`

---

## 🎯 Exercices pratiques

### Exercice L.1 — Chargement de données au montage

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface User {
  id: number
  name: string
}

const users = ref<User[]>([])
const loading = ref(true)

// Simule un appel API qui prend 1 seconde
async function fetchUsers(): Promise<User[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ])
    }, 1000)
  })
}

// Charge les utilisateurs au montage du composant
onMounted(async () => {
  // ???
})
</script>

<template>
  <p v-if="loading">Chargement...</p>
  <ul v-else>
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

### Exercice L.2 — Timer avec nettoyage

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const secondes = ref(0)
let intervalId: number | null = null

onMounted(() => {
  // Démarre un compteur qui incrémente chaque seconde
  // ???
})

onUnmounted(() => {
  // Nettoie le timer pour éviter les fuites mémoire
  // ???
})
</script>

<template>
  <p>⏱️ {{ secondes }} secondes</p>
</template>
```

### Exercice L.3 — Focus automatique sur un input

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  // Met le focus sur l'input au chargement
  // ???
})
</script>

<template>
  <input ref="inputRef" placeholder="Je reçois le focus automatiquement" />
</template>
```

<details>
<summary>Solutions</summary>

```ts
// L.1
onMounted(async () => {
  users.value = await fetchUsers()
  loading.value = false
})

// L.2
onMounted(() => {
  intervalId = setInterval(() => {
    secondes.value++
  }, 1000)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})

// L.3
onMounted(() => {
  inputRef.value?.focus()
})
```

</details>

---

## Suite

→ `cours/01-debutant/07-options-vs-composition-api.md`
