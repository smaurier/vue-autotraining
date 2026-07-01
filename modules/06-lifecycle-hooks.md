---
titre: Lifecycle Hooks
cours: 02-vue
notions: [cycle de vie d'un composant, onMounted, onBeforeMount, onUpdated, onBeforeUnmount, onUnmounted, timing du setup, nettoyage des effets, hooks Composition vs Options API]
outcomes:
  - sait situer les étapes du cycle de vie d'un composant Vue
  - sait déclencher un effet au montage avec onMounted (ex fetch de données)
  - sait nettoyer un effet (listener, timer) avec onUnmounted pour éviter les fuites
  - sait mapper les hooks Composition API sur leurs équivalents Options API
prerequis: [05-composants-props-emits]
next: 07-options-vs-composition-api
libs: [{ name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — FamilyDashboard qui charge les données de la famille onMounted et nettoie un interval de refresh onUnmounted
last-reviewed: 2026-07
---

← [05 — Composants, Props & Emits](05-composants-props-emits.md)

# Lifecycle Hooks

> **Outcomes — tu sauras FAIRE :** situer les étapes du cycle de vie d'un composant Vue, déclencher un fetch au montage avec `onMounted`, nettoyer un timer ou un listener avec `onUnmounted`, mapper les hooks Composition API sur leurs équivalents Options API.
> **Difficulté :** :star::star:
>
> **Portée :** ce module couvre les hooks du cycle de vie d'un composant classique (`onMounted`, `onUnmounted`, etc.) et leur usage courant. Les hooks liés à `<KeepAlive>` (`onActivated`, `onDeactivated`) et à `<Suspense>` sont hors périmètre. Les composables qui encapsulent la logique setup+cleanup sont vus au module intermédiaire 02.

---

## 1. Cas concret d'abord

Tu intègres l'équipe TribuZen. Ta tâche : écrire `FamilyDashboard.vue`, le composant central de l'application. Ce composant doit :

1. **Charger les données de la famille depuis l'API** dès qu'il s'affiche.
2. **Rafraîchir ces données toutes les 30 secondes** pour rester synchronisé (les autres membres peuvent modifier les données pendant que tu regardes l'écran).
3. **Arrêter le rafraîchissement automatique** quand l'utilisateur navigue ailleurs — sinon l'appel API continue en arrière-plan même sur une page différente.

Un premier jet de la composante tente de tout faire dans `<script setup>` :

```vue
<!-- FamilyDashboard.vue — premier jet problématique -->
<script setup lang="ts">
import { ref } from 'vue'

interface Family {
  id: string
  name: string
  memberCount: number
}

const family = ref<Family | null>(null)

// ❌ Problème 1 : fetch exécuté pendant setup, avant que le composant
//    soit dans la page — les effets de bord ne sont pas au bon endroit
const res = await fetch('/api/families/current')
family.value = await res.json()

// ❌ Problème 2 : l'interval n'est jamais arrêté
setInterval(async () => {
  const r = await fetch('/api/families/current')
  family.value = await r.json()
}, 30_000)
</script>
```

Deux problèmes concrets :
1. Le `fetch` dans `setup` fonctionne parfois (grâce à `<Suspense>`), mais l'intent est flou : les effets de bord au montage appartiennent à `onMounted`, pas au corps de `setup`.
2. L'`setInterval` ne sera jamais nettoyé : quand l'utilisateur navigue vers une autre page, le composant est démonté mais le timer continue à appeler l'API — fuite mémoire garantie.

Ce module te donne les outils pour écrire la version correcte.

---

## 2. Théorie complète, concise

### 2.1 Le cycle de vie — vue d'ensemble

Un composant Vue traverse quatre phases : **création → montage → mises à jour → démontage**. À chaque transition, Vue appelle des fonctions de callback nommées **hooks** — des fonctions que tu enregistres et que Vue exécute automatiquement au bon moment.

```
setup()           ← Code de <script setup> — données réactives créées ici
                    Le DOM n'existe PAS encore

onBeforeMount     ← Juste avant la première insertion dans le DOM
onMounted         ← Le composant est dans le DOM et visible — point de départ des effets

── boucle tant que le composant est affiché ──
onBeforeUpdate    ← Une ref/prop a changé, le re-rendu va commencer
onUpdated         ← Le DOM reflète les nouvelles données

onBeforeUnmount   ← Le composant va disparaître, le DOM est encore là
onUnmounted       ← Le composant a disparu — nettoyer ici
```

### 2.2 Le timing de `<script setup>` — avant beforeCreate/created

Le code dans le corps de `<script setup>` s'exécute pendant la phase `setup()`, qui correspond à `beforeCreate` + `created` de l'Options API. À ce moment :

- Les refs et les computeds sont créés et disponibles.
- **Le DOM n'existe pas encore** — aucun élément HTML du template n'a été rendu.
- Les template refs (`useTemplateRef`, `ref="..."`) sont `null`.

C'est la raison pour laquelle les effets de bord qui nécessitent le DOM (fetch, focus, addEventListener, setInterval) se placent dans `onMounted` plutôt qu'en dehors.

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const count = ref(0)         // ✅ état réactif — disponible dès setup
console.log(count.value)     // ✅ 0 — accessible pendant setup

// ❌ document.querySelector('#app') ici retournerait null :
//    le template n'a pas encore été inséré dans le DOM

onMounted(() => {
  // ✅ maintenant le DOM existe — effets de bord ici
  console.log('composant monté')
})
</script>
```

### 2.3 `onBeforeMount` et `onMounted`

**`onBeforeMount`** — s'exécute juste avant la première insertion dans le DOM. Le rendu est calculé mais pas encore appliqué. Usage rare : bibliothèques qui ont besoin d'intervenir avant l'insertion (SSR, animation custom). En pratique, `onMounted` couvre 95 % des cas.

**`onMounted`** — s'exécute une seule fois, quand le composant est inséré dans le DOM et que le premier rendu est terminé. C'est le hook de travail principal pour :

- Fetch de données depuis une API
- Focus automatique sur un élément (`input.focus()`)
- Initialisation de bibliothèques externes (graphiques, cartes, players vidéo)
- Démarrage de timers et abonnements à des événements

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const users = ref<{ id: number; name: string }[]>([])
const loading = ref(true)

onMounted(async () => {
  // ✅ Le DOM existe — on peut faire des effets de bord
  const res = await fetch('/api/users')
  users.value = await res.json()
  loading.value = false
})
</script>
```

### 2.4 `onBeforeUpdate` et `onUpdated`

**`onBeforeUpdate`** — s'exécute juste avant que Vue applique les modifications au DOM suite à un changement de données réactives. Utile pour lire l'état du DOM avant un re-rendu (mémoriser une position de scroll, une dimension).

**`onUpdated`** — s'exécute après chaque re-rendu. À ce moment, le DOM reflète les nouvelles données.

```vue
<script setup lang="ts">
import { ref, onUpdated } from 'vue'

const messages = ref<string[]>([])
const listRef = ref<HTMLUListElement | null>(null)

onUpdated(() => {
  // Après ajout d'un message, scroller vers le bas
  // ⚠️ Ne jamais modifier un état réactif ici : boucle infinie garantie
  listRef.value?.scrollTo({ top: listRef.value.scrollHeight, behavior: 'smooth' })
})
</script>
```

`onUpdated` est rarement nécessaire. Si tu as besoin de réagir à un changement de données spécifique, préfère `watch` ou `watchEffect` (module 03) — ils sont plus précis et évitent les boucles accidentelles.

### 2.5 `onBeforeUnmount` et `onUnmounted`

**`onBeforeUnmount`** — s'exécute juste avant que le composant soit retiré du DOM. Le DOM est **encore accessible** à ce stade. Utile pour les bibliothèques qui ont besoin d'accéder aux éléments DOM pour se détruire proprement (ex : `chart.destroy()`, où la bibliothèque lit ses propres dimensions avant de se supprimer).

**`onUnmounted`** — s'exécute quand le composant a disparu du DOM. C'est ici que le nettoyage standard doit avoir lieu.

```vue
<script setup lang="ts">
import { onBeforeUnmount, onUnmounted } from 'vue'

// Si une bibliothèque externe a besoin du DOM pour se nettoyer
onBeforeUnmount(() => {
  chart?.destroy()     // chart est encore dans le DOM ici
})

// Nettoyage standard : timers, listeners, abonnements
onUnmounted(() => {
  clearInterval(intervalId)
  window.removeEventListener('resize', handleResize)
})
</script>
```

### 2.6 Nettoyage des effets — pourquoi c'est non-négociable

Quand un composant est démonté (l'utilisateur navigue, un `v-if` devient `false`), Vue retire le DOM — mais il n'annule pas automatiquement les timers et les event listeners créés en dehors de Vue. Ces ressources continuent de consommer CPU et mémoire.

**Règle d'or : tout ce qu'on démarre dans `onMounted`, on le stoppe dans `onUnmounted`.**

```
setInterval    ↔  clearInterval
setTimeout     ↔  clearTimeout  (si potentiellement non encore déclenché)
addEventListener ↔ removeEventListener
EventBus.on    ↔  EventBus.off
WebSocket.open ↔  WebSocket.close
```

Pattern canonique :

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

// Stocker la référence en dehors des hooks pour que les deux puissent y accéder
let intervalId: ReturnType<typeof setInterval>

function handleResize(): void {
  // La même référence de fonction doit être passée à add ET remove
  console.log(window.innerWidth)
}

onMounted(() => {
  intervalId = setInterval(() => console.log('tick'), 1_000)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  clearInterval(intervalId)
  window.removeEventListener('resize', handleResize)
})
</script>
```

Point important pour `removeEventListener` : la fonction passée doit être la **même référence** que celle passée à `addEventListener`. Une fonction définie inline (`() => ...`) crée une nouvelle référence à chaque appel — ne jamais faire `removeEventListener('resize', () => ...)`, ça ne désenregistre rien.

### 2.7 Table de correspondance Composition API ↔ Options API

En entretien ou en lisant une codebase legacy, la correspondance entre les deux APIs est indispensable.

| Moment dans le cycle | Composition API (`<script setup>`) | Options API |
|---|---|---|
| Création (données dispo, DOM absent) | Corps de `<script setup>` | `beforeCreate` + `created` |
| Avant insertion DOM | `onBeforeMount` | `beforeMount` |
| Après insertion DOM | `onMounted` | `mounted` |
| Avant re-rendu | `onBeforeUpdate` | `beforeUpdate` |
| Après re-rendu | `onUpdated` | `updated` |
| Avant suppression DOM | `onBeforeUnmount` | `beforeUnmount` |
| Après suppression DOM | `onUnmounted` | `unmounted` |

Les noms Composition API sont les noms Options API préfixés de `on` et mis en camelCase : `mounted` → `onMounted`, `beforeUnmount` → `onBeforeUnmount`.

> Il n'existe pas de `onBeforeCreate` / `onCreated` en Composition API : le corps de `<script setup>` remplace ces deux hooks, et ils seraient redondants.

---

## 3. Worked examples

### Exemple 1 — Fetch au montage avec état de chargement et nettoyage (TribuZen)

Le pattern le plus courant : charger des données quand le composant apparaît, gérer l'état intermédiaire (loading/error), et prévoir l'annulation si le composant est démonté avant la réponse.

```vue
<!-- FamilyDashboard.vue — fetch onMounted correct -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Family {
  id: string
  name: string
  memberCount: number
  lastActivity: string
}

const family = ref<Family | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// AbortController permet d'annuler le fetch si le composant se démonte
// avant que la réponse arrive (ex : navigation rapide)
let abortController: AbortController

async function loadFamily(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    // On passe le signal à fetch — si abort() est appelé, fetch lance une AbortError
    const res = await fetch('/api/families/current', {
      signal: abortController.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    family.value = await res.json() as Family
  } catch (e) {
    // AbortError = composant démonté en cours de route → pas une vraie erreur
    if (e instanceof Error && e.name === 'AbortError') return
    error.value = e instanceof Error ? e.message : 'Erreur inconnue'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Créer un AbortController par montage
  abortController = new AbortController()
  loadFamily()
})

onUnmounted(() => {
  // Annuler le fetch en cours si le composant disparaît avant la réponse
  abortController.abort()
})
</script>

<template>
  <div v-if="loading">Chargement…</div>
  <div v-else-if="error" class="error">{{ error }}</div>
  <div v-else-if="family">
    <h1>{{ family.name }}</h1>
    <p>{{ family.memberCount }} membres</p>
  </div>
</template>
```

**Ce qu'on a gagné vs le premier jet :** le fetch est au bon endroit (onMounted), l'AbortController empêche les mises à jour de state sur un composant déjà démonté (évite l'erreur "Cannot set properties of undefined").

### Exemple 2 — Timer de refresh automatique avec cleanup

Le deuxième besoin de TribuZen : rafraîchir les données périodiquement, et stopper ce refresh proprement.

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const family = ref<{ name: string; memberCount: number } | null>(null)

// Déclarée en dehors des hooks : les deux doivent accéder à la même variable
let refreshIntervalId: ReturnType<typeof setInterval>

async function refreshFamily(): Promise<void> {
  try {
    const res = await fetch('/api/families/current')
    if (res.ok) family.value = await res.json()
  } catch {
    // Erreur réseau sur un refresh de fond : on l'absorbe silencieusement
    // (l'UI continue d'afficher la dernière valeur connue)
  }
}

onMounted(() => {
  // Chargement initial
  refreshFamily()
  // Puis toutes les 30 secondes — stocker l'id pour pouvoir stopper
  refreshIntervalId = setInterval(refreshFamily, 30_000)
})

onUnmounted(() => {
  // Sans cette ligne, setInterval continue même si le composant n'est plus là
  clearInterval(refreshIntervalId)
})
</script>
```

**Points clés de cet exemple :**
- `refreshIntervalId` est déclarée avec `let` (pas `ref`) — c'est un identifiant système, pas de l'état affiché dans le template.
- `setInterval` retourne un `number` dans le navigateur. `ReturnType<typeof setInterval>` est préférable pour la compatibilité Node/browser.
- `clearInterval` avec un id déjà nettoyé est silencieux (pas d'erreur) — safe d'appeler plusieurs fois.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Accéder au DOM pendant `setup` (avant `onMounted`)

```vue
<script setup lang="ts">
import { ref } from 'vue'

// ❌ Le template n'est pas encore rendu — this returns null
const el = document.querySelector('.family-card')
console.log(el)  // null

// ❌ Même avec une template ref : null pendant setup
const cardRef = ref<HTMLDivElement | null>(null)
console.log(cardRef.value)  // null — pas encore monté
</script>

<template>
  <div class="family-card" ref="cardRef">...</div>
</template>
```

```vue
<!-- ✅ Attendre onMounted -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const cardRef = ref<HTMLDivElement | null>(null)

onMounted(() => {
  console.log(cardRef.value)  // ✅ <div class="family-card"> — le DOM existe
  cardRef.value?.focus()
})
</script>
```

Ce piège est particulièrement fréquent avec `useTemplateRef` : la valeur est toujours `null` jusqu'à ce que `onMounted` soit déclenché.

### PIÈGE #2 — Oublier le cleanup — fuite mémoire silencieuse

```vue
<script setup lang="ts">
import { onMounted } from 'vue'

// ❌ L'event listener n'est jamais retiré
// Chaque fois que ce composant est monté puis démonté (ex : via v-if),
// un nouveau listener s'accumule. Après 10 cycles : 10 listeners actifs.
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  // ← pas de onUnmounted correspondant
})
</script>
```

Le bug est silencieux : l'application ne plante pas immédiatement. Elle ralentit progressivement, surtout si le composant monte/démonte fréquemment (onglets, modals, listes paginées). Le navigateur DevTools Memory profiler révèle l'accumulation, mais le diagnostic est difficile.

Corriger : toujours écrire `onMounted` et `onUnmounted` en pair quand un effet perdure.

### PIÈGE #3 — Modifier un état réactif dans `onUpdated` → boucle infinie

```ts
import { ref, onUpdated } from 'vue'

const count = ref(0)

// ❌ count change → re-rendu → onUpdated → count change → re-rendu → ...
onUpdated(() => {
  count.value++   // modifie une ref → déclenche un nouveau re-rendu → onUpdated...
})
```

Vue ne détecte pas la boucle automatiquement — elle consomme 100 % du CPU et gèle l'onglet. Si tu dois réagir à un changement de données précis, utilise `watch` (module 03) plutôt qu'`onUpdated`.

### PIÈGE #4 — `removeEventListener` avec une fonction inline ne retire rien

```ts
// ❌ () => handleScroll() crée une NOUVELLE référence à chaque appel
// add et remove ne visent pas la même fonction → le listener reste actif
onMounted(() => {
  window.addEventListener('scroll', () => handleScroll())
})
onUnmounted(() => {
  window.removeEventListener('scroll', () => handleScroll())  // no-op !
})

// ✅ Utiliser la MÊME référence de fonction nommée
function handleScroll(): void { /* ... */ }

onMounted(() => { window.addEventListener('scroll', handleScroll) })
onUnmounted(() => { window.removeEventListener('scroll', handleScroll) })
```

---

## 5. Ancrage TribuZen

Dans TribuZen, le pattern onMounted + onUnmounted apparaît dans deux composants critiques du front-office :

**`FamilyDashboard.vue`** (Exemples 1 et 2 de ce module) — porte d'entrée principale après login. `onMounted` déclenche le premier fetch de la famille + démarre l'interval de refresh. `onUnmounted` stoppe l'interval et abort le fetch en cours. Sans ce nettoyage, chaque navigation vers/depuis le dashboard accumule des appels API fantômes.

**`FamilyTimeline.vue`** — affiche le fil des événements familiaux. Écoute les WebSocket events pour les mises à jour temps-réel :

```ts
// FamilyTimeline.vue (extrait)
import { onMounted, onUnmounted } from 'vue'

let ws: WebSocket

onMounted(() => {
  ws = new WebSocket('wss://api.tribuzen.app/timeline')
  ws.onmessage = (event) => {
    const update = JSON.parse(event.data)
    events.value.unshift(update)
  }
})

onUnmounted(() => {
  ws?.close()   // ferme la connexion WebSocket — sinon le serveur maintient la session
})
```

Fichiers cibles dans `smaurier/tribuzen` :
```
tribuzen/
  src/
    components/
      dashboard/
        FamilyDashboard.vue   ← onMounted fetch + interval, onUnmounted cleanup
        FamilyTimeline.vue    ← onMounted WebSocket, onUnmounted close
```

---

## 6. Points clés

1. Le corps de `<script setup>` s'exécute pendant `setup()` — équivalent `beforeCreate`/`created` en Options API — le DOM n'existe pas encore.
2. `onMounted` est le point de départ des effets de bord : fetch, focus, addEventListener, setInterval — jamais en dehors d'un hook.
3. `onUnmounted` est le miroir de `onMounted` : tout ce qui est démarré dans l'un doit être stoppé dans l'autre.
4. `clearInterval` / `removeEventListener` — utiliser la même référence de fonction pour remove que pour add.
5. `onBeforeUnmount` donne un dernier accès au DOM avant suppression — utile pour les bibliothèques externes qui ont besoin du DOM pour se détruire (`chart.destroy()`).
6. `onUpdated` : ne jamais modifier un état réactif à l'intérieur — boucle infinie garantie. Préférer `watch`.
7. Table Composition → Options : `onMounted` = `mounted`, `onUnmounted` = `unmounted`, `onBeforeUnmount` = `beforeUnmount`. Préfixe `on` + camelCase.
8. Il n'y a pas de `onBeforeCreate`/`onCreated` en Composition API — le corps de `<script setup>` les remplace.

---

## 7. Seeds Anki

```
Quel code de <script setup> s'exécute avant onMounted et que représente ce moment ?|Le corps entier de <script setup> s'exécute pendant la phase setup() — équivalent de beforeCreate+created en Options API. À ce moment le DOM n'existe pas encore et les template refs sont null.
Quelles sont les 3 choses à faire typiquement dans onMounted ?|1. Fetch de données API. 2. Focus sur un élément DOM (inputRef.value?.focus()). 3. Démarrer des effets persistants : setInterval, addEventListener, WebSocket.open.
Pourquoi doit-on clearInterval dans onUnmounted plutôt que laisser Vue gérer ?|Vue retire le DOM mais n'annule pas les ressources JS externes (timers, listeners, WebSocket). Sans cleanup, ils continuent en arrière-plan sur un composant démonté → fuite mémoire cumulative.
Quel est le hook à utiliser pour retirer un event listener ajouté dans onMounted ?|onUnmounted — et la fonction passée à removeEventListener doit être la MÊME référence que celle passée à addEventListener (une fonction nommée, pas inline).
Quelle est la correspondance Options API → Composition API pour mounted/beforeUnmount/unmounted ?|mounted → onMounted | beforeUnmount → onBeforeUnmount | unmounted → onUnmounted. Règle : préfixe on + camelCase.
Pourquoi ne faut-il jamais modifier un ref dans onUpdated ?|Modifier un état réactif dans onUpdated déclenche un nouveau re-rendu → onUpdated re-exécute → nouveau re-rendu : boucle infinie. Utiliser watch pour réagir à un changement précis.
Quelle est la différence entre onBeforeUnmount et onUnmounted ?|onBeforeUnmount : le composant va disparaître mais le DOM est encore présent (utile pour chart.destroy() qui a besoin du DOM). onUnmounted : le DOM est retiré — cleanup standard des timers et listeners.
Pourquoi les template refs sont-elles null pendant setup mais pas dans onMounted ?|Les template refs (ref="x", useTemplateRef) sont associées aux éléments DOM. Pendant setup(), le template n'a pas encore été rendu et inséré. onMounted() se déclenche après le premier rendu complet — les éléments existent dans le DOM.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-06-lifecycle-hooks/README.md`. Écrire `FamilyDashboard.vue` de A à Z — fetch onMounted avec AbortController, interval de refresh, cleanup onUnmounted — et valider l'absence de fuite mémoire avec les DevTools.
