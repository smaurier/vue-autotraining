# 00 — Les pièges fréquents en Vue 3 + TypeScript

> **Pour qui est ce fichier ?**
> Tu apprends Vue 3 et tu as le sentiment que ça "devrait marcher" mais ça ne marche pas ?
> Bienvenue dans le club. Cette page recense les **15 pièges les plus fréquents** rencontrés par les débutants.

---

## Pourquoi tombe-t-on dans ces pièges ?

La plupart de ces erreurs viennent de **3 sources** :

1. **Des habitudes JavaScript "classique"** qu'on essaie d'appliquer à Vue (par exemple : modifier un objet directement ne met pas l'interface à jour)
2. **La réactivité de Vue est "magique"** — elle fonctionne différemment de ce qu'on attend intuitivement
3. **TypeScript ajoute des règles** que le JS simple n'avait pas — et ses messages d'erreur sont parfois intimidants

**C'est tout à fait normal d'en faire.** Même les développeurs expérimentés tombent dans ces pièges en changeant d'habitudes. L'objectif de ce fichier : les reconnaître rapidement et s'en souvenir.

> 💡 Tu peux revenir sur cette page à chaque fois qu'un bug te semble inexplicable. La réponse est probablement ici.

---

## PIÈGE 1 : Oublier `.value` avec `ref` 🎁

### Le problème

C'est **l'erreur numéro 1** en Vue 3. Quand tu crées une variable réactive avec `ref()`, la valeur est **emballée** dans un objet. Pour lire ou modifier cette valeur, tu dois passer par `.value` dans le `<script>`.

### Pourquoi ça arrive

En JavaScript classique, une variable se lit et se modifie directement : `compteur = 5`. Vue ajoute un niveau d'emballage pour pouvoir surveiller les changements, et on oublie instinctivement d'ouvrir la boîte.

### ❌ Code incorrect

```ts
<script setup lang="ts">
import { ref } from 'vue'

const compteur = ref<number>(0)

function incrementer() {
  compteur++         // ❌ ERREUR : on essaie d'incrémenter l'objet ref lui-même
  console.log(compteur) // Affiche : RefImpl { value: 0 } — pas un nombre !
}

function doubler() {
  return compteur * 2  // ❌ NaN ou erreur TypeScript : ref n'est pas un number
}
</script>
```

### ✅ Code correct

```ts
<script setup lang="ts">
import { ref } from 'vue'

const compteur = ref<number>(0)

function incrementer() {
  compteur.value++          // ✅ On accède à la valeur via .value
  console.log(compteur.value) // Affiche : 1
}

function doubler() {
  return compteur.value * 2   // ✅ .value donne le nombre brut
}
</script>

<template>
  <!-- Dans le template, Vue déballe AUTOMATIQUEMENT — pas besoin de .value ! -->
  <p>{{ compteur }}</p>              <!-- ✅ Pas de .value dans le template -->
  <button @click="incrementer">+1</button>
</template>
```

### La règle à retenir

| Où ? | Écriture |
|------|----------|
| Dans `<script setup>` | `maRef.value` (toujours `.value`) |
| Dans `<template>` | `maRef` (Vue déballe automatiquement) |

### Astuce mnémotechnique 🎁

Pense à `ref` comme une **boîte-cadeau** : la boîte est la ref, le cadeau est ta valeur. Dans le script, tu dois **ouvrir la boîte** (`.value`) pour accéder au cadeau. Dans le template, un elfe Vue l'ouvre pour toi.

---

## PIÈGE 2 : Perdre la réactivité par destructuring 📦

### Le problème

Quand tu **déstructures** un objet `reactive()`, les propriétés obtenues **ne sont plus réactives**. Les modifications n'impactent plus l'interface.

> **📖 Rappel JavaScript — Le destructuring**
>
> Le destructuring, c'est une syntaxe raccourcie pour extraire des propriétés d'un objet :
> ```ts
> const personne: { nom: string; age: number } = { nom: "Alice", age: 25 }
>
> // Sans destructuring :
> const nom: string = personne.nom  // "Alice"
> const age: number = personne.age  // 25
>
> // Avec destructuring (même résultat, en plus court) :
> const { nom, age } = personne
> // nom → "Alice", age → 25
> ```
> Attention : ça copie les valeurs — ce ne sont plus des références vers l'objet original.

### Pourquoi ça arrive

En JavaScript, déstructurer un objet crée des **copies** des valeurs primitives. Vue ne peut plus surveiller ces copies — il ne sait pas qu'elles existaient dans un reactive.

### ❌ Code incorrect

```ts
<script setup lang="ts">
import { reactive } from 'vue'

const utilisateur = reactive({
  nom: 'Alice',
  age: 25
})

// ❌ PIÈGE : on déstructure l'objet reactive
const { nom, age } = utilisateur

function anniversaire() {
  age++  // ❌ Modifie une variable locale, PAS l'objet reactive
         //    L'affichage ne se mettra jamais à jour !
}
</script>

<template>
  <p>{{ nom }}, {{ age }} ans</p>  <!-- Restera figé même après anniversaire() -->
</template>
```

### ✅ Solution 1 : Accéder directement via l'objet

```ts
<script setup lang="ts">
import { reactive } from 'vue'

const utilisateur = reactive({
  nom: 'Alice',
  age: 25
})

function anniversaire() {
  utilisateur.age++  // ✅ On modifie l'objet reactive directement : réactivité préservée
}
</script>

<template>
  <p>{{ utilisateur.nom }}, {{ utilisateur.age }} ans</p>  <!-- Se met à jour ✅ -->
</template>
```

### ✅ Solution 2 : Utiliser `toRefs()` si tu veux déstructurer

```ts
<script setup lang="ts">
import { reactive, toRefs } from 'vue'

const utilisateur = reactive({
  nom: 'Alice',
  age: 25
})

// toRefs() convertit chaque propriété en ref individuelle — la réactivité est préservée
const { nom, age } = toRefs(utilisateur)
// Maintenant nom et age sont des refs liées à l'objet reactive original

function anniversaire() {
  age.value++  // ✅ .value parce que ce sont maintenant des refs
               //    Et l'objet reactive original est aussi mis à jour !
}
</script>
```

### Astuce mnémotechnique

Déstructurer un reactive, c'est comme **photocopier** une clé USB : tu as les données à l'instant T, mais les modifications sur la copie n'impactent pas l'original. `toRefs()` crée des **raccourcis** vers l'original (comme un alias Windows).

---

## PIÈGE 3 : Réassigner un `reactive` 🔄

### Le problème

Si tu **réassignes complètement** un objet `reactive`, tu perds toute la réactivité. La variable pointe maintenant vers un nouvel objet ordinaire.

### Pourquoi ça arrive

`reactive()` crée un Proxy autour d'un objet précis. Si tu remplaces cet objet, Vue surveille encore l'ancien Proxy — pas le nouvel objet que tu lui as substituté.

### ❌ Code incorrect

```ts
<script setup lang="ts">
import { reactive } from 'vue'

const filtres = reactive({
  categorie: 'all',
  page: 1
})

function reinitialiser() {
  // ❌ PIÈGE MAJEUR : on réassigne la variable entière
  filtres = { categorie: 'all', page: 1 }
  // TypeScript va même lever une erreur : "Cannot assign to 'filtres' because it is a constant"
  // Et même en let, la réactivité serait perdue
}

async function chargerDonnees() {
  const reponse = await fetch('/api/data')
  const data = await reponse.json()
  filtres = data  // ❌ Même problème : la réactivité est perdue
}
</script>
```

### ✅ Solution 1 : Modifier les propriétés une par une (recommandé)

```ts
<script setup lang="ts">
import { reactive } from 'vue'

const filtres = reactive({
  categorie: 'all',
  page: 1
})

function reinitialiser() {
  // ✅ On modifie chaque propriété individuellement
  filtres.categorie = 'all'
  filtres.page = 1
}
</script>
```

### ✅ Solution 2 : `Object.assign()` pour remplacer en masse

```ts
<script setup lang="ts">
import { reactive } from 'vue'

const filtres = reactive({
  categorie: 'all',
  page: 1
})

function reinitialiser() {
  // ✅ Object.assign() modifie les propriétés de l'objet EXISTANT
  //    = on ne remplace pas l'objet, on met à jour ses propriétés
  Object.assign(filtres, { categorie: 'all', page: 1 })
}
</script>
```

### ✅ Solution 3 : Préférer `ref` pour les objets qu'on remplace (meilleure pratique)

```ts
<script setup lang="ts">
import { ref } from 'vue'

// ref() avec un objet — on peut réassigner .value sans problème
const filtres = ref({
  categorie: 'all',
  page: 1
})

function reinitialiser() {
  filtres.value = { categorie: 'all', page: 1 }  // ✅ Réassigner .value est OK avec ref
}

async function chargerDonnees() {
  const reponse = await fetch('/api/data')
  filtres.value = await reponse.json()  // ✅ Vue surveille .value, pas l'objet interne
}
</script>
```

### Astuce mnémotechnique

`reactive` est comme une **piscine** : Vue surveille l'eau à l'intérieur. Si tu **construis une nouvelle piscine** (réassignation), Vue regarde toujours l'ancienne. Il faut **vider et remplir la même piscine** (modifier les propriétés), ou utiliser `ref` qui surveille "l'emplacement" plutôt que l'eau elle-même.

---

## PIÈGE 4 : Modifier les props directement ✋

### Le problème

Les **props** sont en **lecture seule**. Un composant enfant n'a pas le droit de modifier directement une prop reçue de son parent. Ça cause une erreur (ou un avertissement) Vue et crée un flux de données chaotique.

### Pourquoi ça arrive

Dans les anciennes habitudes JS (ou en Options API mal comprise), il était tentant de modifier directement une variable reçue. En Vue 3, les props sont **explicitement protégées en écriture**.

### ❌ Code incorrect

```vue
<!-- components/CompteurEnfant.vue -->
<script setup lang="ts">
const props = defineProps<{
  valeur: number
}>()

function incrementer() {
  props.valeur++  // ❌ ERREUR Vue : "Set operation on key "valeur" failed: target is readonly."
                  //    Vue émet un avertissement dans la console
}
</script>
```

### ✅ Solution 1 : Émettre un événement (pattern standard Vue)

```vue
<!-- components/CompteurEnfant.vue -->
<script setup lang="ts">
const props = defineProps<{
  valeur: number
}>()

// On déclare un événement "update:valeur" à émettre vers le parent
const emit = defineEmits<{
  'update:valeur': [nouvelleValeur: number]
}>()

function incrementer() {
  // ✅ On demande au PARENT de changer la valeur via un événement
  emit('update:valeur', props.valeur + 1)
}
</script>

<template>
  <button @click="incrementer">Valeur : {{ valeur }}</button>
</template>
```

```vue
<!-- ParentComponent.vue -->
<template>
  <!-- Le parent écoute l'événement et met à jour sa propre donnée -->
  <CompteurEnfant
    :valeur="monCompteur"
    @update:valeur="nouvelleVal => monCompteur = nouvelleVal"
  />
</template>
```

### ✅ Solution 2 : Copie locale (si tu n'as pas besoin de remonter la valeur)

```vue
<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  valeurInitiale: number
}>()

// ✅ On copie la prop dans une ref locale qu'on peut modifier librement
const valeurLocale = ref(props.valeurInitiale)
// Attention : valeurLocale ne se met pas à jour si la prop du parent change
</script>
```

### La règle d'or de Vue

> **Les données descendent, les événements remontent.**
> Parent → Enfant : via les props (en bas)
> Enfant → Parent : via les emits (en haut)

### Astuce mnémotechnique

Les props, c'est comme un **colis livré par le parent**. L'enfant peut **regarder** le colis (lire la prop), mais il ne peut pas **le renvoyer modifié** au livreur (modifier la prop). Si l'enfant veut que quelque chose change, il doit **appeler le parent** (émettre un événement).

---

## PIÈGE 5 : Utiliser `async/await` dans `computed` ⏳

### Le problème

Un `computed` doit être **synchrone** — il calcule une valeur immédiatement. On ne peut pas y faire de requête HTTP ni utiliser `await`. Vue n'exécutera pas la partie async et retournera une `Promise` en attente.

### Pourquoi ça arrive

`computed` ressemble à une fonction normale, et on a l'habitude d'utiliser `async/await` partout pour "récupérer des données". Le réflexe est naturel mais incorrect.

### ❌ Code incorrect

```ts
<script setup lang="ts">
import { ref, computed } from 'vue'

const userId = ref(1)

// ❌ Un computed async ne fonctionnera PAS comme attendu
const utilisateur = computed(async () => {
  const reponse = await fetch(`/api/users/${userId.value}`)
  return await reponse.json()
  // computed retourne une Promise non résolue, pas l'utilisateur !
})
// Dans le template, {{ utilisateur }} afficherait "[object Promise]"
</script>
```

### ✅ Solution : Utiliser `watch` + `ref` pour les données asynchrones

```ts
<script setup lang="ts">
import { ref, watch } from 'vue'

const userId = ref(1)
const utilisateur = ref<{ nom: string; email: string } | null>(null)
const chargement = ref(false)

// watch surveille userId et déclenche le fetch quand il change
watch(userId, async (nouvelId) => {
  chargement.value = true
  try {
    const reponse = await fetch(`/api/users/${nouvelId}`)
    utilisateur.value = await reponse.json()  // ✅ On met à jour une ref
  } finally {
    chargement.value = false
  }
}, { immediate: true }) // immediate: true = exécuter aussi au démarrage
</script>

<template>
  <p v-if="chargement">Chargement...</p>
  <p v-else-if="utilisateur">{{ utilisateur.nom }}</p>
</template>
```

### ✅ `computed` est réservé aux transformations synchrones

```ts
// ✅ computed est parfait pour ça :
const nomComplet = computed(() => `${prenom.value} ${nom.value}`)
const totalHT = computed(() => prix.value * quantite.value)
const utilisateursActifs = computed(() => liste.value.filter(u => u.actif))
const message = computed(() => compteur.value > 0 ? 'Positif' : 'Zéro ou négatif')
```

### Astuce mnémotechnique

Un `computed`, c'est comme une **calculatrice** : tu appuies sur "=" et tu as ton résultat **immédiatement**. Une calculatrice ne peut pas "attendre internet" pour te donner le résultat. Pour les données en ligne, utilise `watch` ou les composables comme `useFetch`.

---

## PIÈGE 6 : Oublier `await` (la promesse non tenue) 🤝

### Le problème

En JavaScript, les opérations asynchrones (fetch, lecture de fichier, timers…) retournent une `Promise`. Si tu **oublies `await`**, tu récupères la Promise elle-même, pas sa valeur. Résultat : `[object Promise]` ou `undefined` dans ton interface.

> **📖 Rappel JavaScript — Les Promises**
>
> Une Promise (= "promesse") est un objet qui représente une valeur **qui n'est pas encore disponible**.
> ```ts
> // fetch() ne retourne PAS les données directement
> // Il retourne une PROMESSE de données futures
> const promesse: Promise<Response> = fetch('/api/data')
> console.log(promesse) // → Promise { <pending> } — pas les données !
>
> // Pour avoir les données, il faut "attendre" la promesse :
> const reponse: Response = await fetch('/api/data')      // attend la réponse HTTP
> const donnees: { id: number; nom: string } = await reponse.json()           // attend le parsing JSON
> console.log(donnees) // → { id: 1, nom: "Alice" } — les vraies données !
> ```

### ❌ Code incorrect

```ts
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const articles = ref([])

onMounted(() => {
  // ❌ On oublie await — chargerArticles() retourne une Promise
  chargerArticles()
  // ↑ La fonction s'exécute, mais onMounted() ne l'attend pas
  //   articles.value est probablement encore [] quand le template se rend
})

async function chargerArticles() {
  const reponse = fetch('/api/articles') // ❌ Oubli de await — reponse est une Promise
  articles.value = reponse.json()         // ❌ Encore un oubli — retourne une Promise
  // articles.value contient maintenant une Promise, pas un tableau !
}
</script>
```

### ✅ Code correct

```ts
<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Article {
  id: number
  titre: string
}

const articles = ref<Article[]>([])
const erreur = ref<string | null>(null)

// ✅ onMounted peut recevoir une fonction async
onMounted(async () => {
  await chargerArticles()  // ✅ On attend la fin du chargement
})

async function chargerArticles() {
  try {
    const reponse = await fetch('/api/articles')  // ✅ await pour la réponse HTTP

    if (!reponse.ok) {
      throw new Error(`Erreur HTTP : ${reponse.status}`)
    }

    articles.value = await reponse.json()           // ✅ await pour le JSON
  } catch (e) {
    erreur.value = 'Impossible de charger les articles'
    console.error(e)
  }
}
</script>
```

### Liste de contrôle async ✅

Chaque fois que tu appelles une fonction asynchrone, vérifie :

- [ ] La fonction est-elle déclarée `async` ?
- [ ] Y a-t-il un `await` avant chaque appel async à l'intérieur ?
- [ ] Y a-t-il un `try/catch` autour des opérations qui peuvent échouer ?
- [ ] Le parent qui l'appelle utilise-t-il aussi `await` si nécessaire ?

### Astuce mnémotechnique

Une Promise sans `await`, c'est comme **commander une pizza** mais ne pas attendre le livreur. Tu te retrouves à dîner avec la **note de commande** (l'objet Promise) plutôt qu'avec la pizza (les données). `await`, c'est attendre le livreur à la porte.

---

## PIÈGE 7 : `v-for` sans `:key` (ou avec `index` comme clé) 🔑

### Le problème

Quand Vue met à jour une liste rendue par `v-for`, il a besoin d'**identifier** chaque élément pour savoir lequel a changé, bougé ou disparu. Sans `:key`, il fait des suppositions souvent incorrectes → bugs d'affichage, animations cassées, état perdu.

### ❌ Code incorrect — pas de key

```vue
<template>
  <!-- ❌ Pas de :key -->
  <div v-for="article in articles">
    {{ article.titre }}
  </div>
</template>
```

### ❌ Code incorrect — key avec l'index

```vue
<template>
  <!-- ❌ Utiliser l'index comme key semblr marcher... -->
  <div v-for="(article, index) in articles" :key="index">
    <!-- Mais si tu supprimes l'article en position 0, tous les indices décalent
         Vue pense que l'article 0 a juste "changé de contenu" → bugs subtils -->
    <input :value="article.titre" />  <!-- L'input gardait le focus sur le mauvais élément ! -->
  </div>
</template>
```

### ✅ Code correct — key avec un identifiant unique et stable

```vue
<template>
  <!-- ✅ On utilise l'ID unique de chaque article -->
  <div v-for="article in articles" :key="article.id">
    {{ article.titre }}
  </div>
</template>
```

### Quelles clés utiliser ?

| Situation | Key recommandée |
|-----------|-----------------|
| Données de BDD | `:key="item.id"` |
| Données sans ID | `:key="item.slug"` ou `:key="item.email"` |
| Données statiques qui ne changent jamais | `:key="index"` (acceptable) |
| Liste avec ajout/suppression/réordonnancement | **Jamais `index` !** |

### Astuce mnémotechnique

`:key`, c'est comme un **badge nominatif** dans une conférence. Quand les gens changent de place, les badges permettent à l'organisateur de savoir qui est qui. Sans badges (sans `:key`), confondre Pierre (parti) avec Paul (resté) est facile — et des erreurs se produisent.

---

## PIÈGE 8 : Accéder au DOM avant `onMounted` 🏗️

### Le problème

Vue construit l'interface de manière asynchrone. Quand le `<script setup>` s'exécute, le DOM n'existe pas encore. Tenter d'accéder à une `templateRef` ou à `document.querySelector` à la racine du script donnera `null`.

### Pourquoi ça arrive

En JavaScript classique (ou jQuery), on mettait son code directement dans un fichier `.js` et ça fonctionnait après le chargement de la page. La notion de "cycle de vie du composant" n'existait pas.

### ❌ Code incorrect

```vue
<script setup lang="ts">
import { ref } from 'vue'

const monInput = ref<HTMLInputElement | null>(null)

// ❌ On essaie d'utiliser la ref ANTES que le composant soit monté
// À ce stade, Vue n'a pas encore rendu le template → monInput.value est null
monInput.value?.focus()   // Ne fait rien (monInput.value === null)

// ❌ Même erreur avec querySelector
const element = document.querySelector('#mon-titre')
element.textContent = 'Bonjour'  // TypeError: Cannot set properties of null
</script>

<template>
  <input ref="monInput" type="text" />
</template>
```

### ✅ Code correct — attendre `onMounted`

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const monInput = ref<HTMLInputElement | null>(null)

// ✅ onMounted s'exécute APRÈS que Vue a rendu le template
//    À ce stade, le DOM existe et les templateRefs sont disponibles
onMounted(() => {
  monInput.value?.focus()              // ✅ L'input existe maintenant
  console.log(monInput.value)          // HTMLInputElement (pas null)
})
</script>

<template>
  <input ref="monInput" type="text" placeholder="Je prends le focus automatiquement" />
</template>
```

### Le cycle de vie simplifié

```
Création du composant (script setup s'exécute)
    ↓
Vue compile le template en mémoire
    ↓
[onMounted] → DOM créé, refs disponibles  ← TU PEUX ACCÉDER AU DOM ICI
    ↓
Vue surveille les changements et met à jour le DOM
    ↓
[onUnmounted] → Composant détruit (nettoyage)
```

### Astuce mnémotechnique

C'est comme essayer d'utiliser le four **avant** qu'il soit branché. `onMounted`, c'est le signal "branché et prêt" — seulement après ce signal tu peux cuisiner (manipuler le DOM).

---

## PIÈGE 9 : Fuite mémoire — oublier `onUnmounted` 🚰

### Le problème

Certaines opérations créent des ressources qui **continuent de fonctionner** même quand le composant est détruit : intervals, timers, event listeners. Si tu ne les nettoies pas, ils s'accumulent en mémoire → fuite mémoire, bugs, ralentissements.

### ❌ Code incorrect — intervalle qui "survit" au composant

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const heureActuelle = ref(new Date().toLocaleTimeString())

onMounted(() => {
  // ❌ On démarre un intervalle mais on ne le nettoie JAMAIS
  setInterval(() => {
    heureActuelle.value = new Date().toLocaleTimeString()
  }, 1000)
  // Si l'utilisateur navigue ailleurs (composant détruit) :
  // → L'intervalle continue de tourner en arrière-plan
  // → Il essaie de mettre à jour heureActuelle.value d'un composant qui n'existe plus
  // → Avertissement Vue + fuite mémoire
})
</script>
```

### ✅ Code correct — nettoyage dans `onUnmounted`

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const heureActuelle = ref(new Date().toLocaleTimeString())

// ✅ On stocke la référence à l'intervalle pour pouvoir le stopper
let intervalId: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  intervalId = setInterval(() => {
    heureActuelle.value = new Date().toLocaleTimeString()
  }, 1000)
})

// ✅ Quand le composant est détruit, on stoppe l'intervalle
onUnmounted(() => {
  if (intervalId !== null) {
    clearInterval(intervalId)
  }
})
</script>
```

### Checklist des ressources à nettoyer dans `onUnmounted`

```ts
// ✅ Toujours nettoyer ces types de ressources :
onUnmounted(() => {
  clearInterval(monInterval)           // Intervalles
  clearTimeout(monTimeout)             // Timeouts
  window.removeEventListener('resize', maFonction)  // Event listeners globaux
  document.removeEventListener('keydown', maFonction)
  abortController.abort()              // Requêtes fetch en cours
  maSubscription.unsubscribe()         // Abonnements (RxJS, WebSocket...)
})
```

### Astuce mnémotechnique

C'est comme louer un vélo en libre-service. Si tu **ne le raccroches pas** (onUnmounted), il compte toujours comme "loué" même si tu es rentré chez toi. Avec le temps, tous les vélos sont "loués" et le service est saturé (fuite mémoire). Toujours raccrocher le vélo !

---

## PIÈGE 10 : `any` vs `unknown` — le faux ami TypeScript 🔍

### Le problème

`any` est souvent utilisé pour "faire taire" TypeScript quand on ne sait pas quel type utiliser. C'est dangereux : ça **désactive complètement la vérification de type** sur cette variable, et tu peux avoir des erreurs à l'exécution.

### ❌ Code incorrect — `any` qui cache les erreurs

```ts
<script setup lang="ts">
// ❌ any désactive TypeScript sur cette variable
const donnees: any = await fetch('/api/user').then(r => r.json())

// TypeScript ne vérifiera RIEN de ce qui suit :
console.log(donnees.nomDeProprietéInexistante)  // undefined — pas d'erreur TypeScript
donnees.methodeQuiNexistePas()                   // TypeError à l'exécution — surprise !
donnees.split(',')                               // TypeError si ce n'est pas une string
</script>
```

### ✅ Solution 1 : Déclarer une interface (recommandé)

```ts
<script setup lang="ts">
// ✅ On décrit la shape attendue de nos données
interface Utilisateur {
  id: number
  nom: string
  email: string
}

const utilisateur = ref<Utilisateur | null>(null)

// TypeScript valide que la réponse correspond bien à Utilisateur
const reponse = await fetch('/api/user')
utilisateur.value = await reponse.json() as Utilisateur

// Maintenant TypeScript protège :
utilisateur.value.nomInexistant  // ❌ Erreur TypeScript (au moment d'écrire le code !)
utilisateur.value.nom            // ✅ OK, c'est dans l'interface
</script>
```

### ✅ Solution 2 : Utiliser `unknown` au lieu de `any`

```ts
<script setup lang="ts">
// ✅ unknown = "je ne sais pas encore, mais je vais vérifier avant d'utiliser"
async function traiterErreur(erreur: unknown) {
  // TypeScript nous OBLIGE à vérifier le type avant d'utiliser la valeur
  if (erreur instanceof Error) {
    console.error(erreur.message)  // ✅ TypeScript sait que c'est un Error
  } else if (typeof erreur === 'string') {
    console.error(erreur)          // ✅ TypeScript sait que c'est une string
  } else {
    console.error('Erreur inconnue:', erreur)
  }
}
</script>
```

### Comparaison `any` vs `unknown`

| | `any` | `unknown` |
|---|---|---|
| TypeScript vérifie ? | ❌ Non | ✅ Oui (après vérification) |
| Sécurité | ❌ Aucune | ✅ Obligé de vérifier |
| Usage | À éviter | Pour les données inconnues |
| Erreurs runtime | Possibles | Prévenues |

### Astuce mnémotechnique

`any` c'est signer un contrat **sans le lire** — tu fais confiance les yeux fermés, et la surprise peut être mauvaise. `unknown` c'est lire le contrat avant de signer — tu dois **vérifier** avant d'utiliser. Préfère toujours ne pas être surpris.

---

## PIÈGE 11 : Émettre un événement sans le déclarer avec `defineEmits` 📣

### Le problème

En Vue 3 (Composition API avec `<script setup>`), tu **dois déclarer** les événements que ton composant peut émettre via `defineEmits`. Omettre cette déclaration peut provoquer des avertissements et rend le composant opaque pour TypeScript.

### ❌ Code incorrect

```vue
<script setup lang="ts">
// ❌ On utilise emit sans le déclarer
// (dans une ancienne syntaxe ou si on l'a oublié)
// Si tu tapes juste emit(...) sans defineEmits, TypeScript dira
// "Cannot find name 'emit'"
</script>
```

### ✅ Code correct — avec typage complet

```vue
<!-- components/FormulaireRecherche.vue -->
<script setup lang="ts">
// ✅ On déclare TOUS les événements que ce composant peut émettre
// Le typage précise le nom de l'événement et les arguments attendus
const emit = defineEmits<{
  recherche: [terme: string]          // événement "recherche" avec un string
  annuler: []                          // événement "annuler" sans arguments
  'selection-changee': [ids: number[]] // événement avec des tirets → entre guillemets
}>()

function lancerRecherche(terme: string) {
  if (terme.trim().length === 0) return
  emit('recherche', terme)  // ✅ TypeScript vérifie que "terme" est bien un string
}

function annuler() {
  emit('annuler')  // ✅ TypeScript vérifie qu'il n'y a pas d'argument
}
</script>

<template>
  <input @keyup.enter="e => lancerRecherche((e.target as HTMLInputElement).value)" />
  <button @click="annuler">Annuler</button>
</template>
```

### Bénéfices de `defineEmits` avec le typage

- TypeScript t'alerte si tu émets un événement non déclaré
- L'IDE (VS Code) autocompléte les `@nomEvenement` dans le parent
- La documentation du composant est auto-générée
- Vue affiche un avertissement en dev si tu émets quelque chose d'inattendu

### Astuce mnémotechnique

`defineEmits`, c'est comme un **panneau de sonnettes** à l'entrée d'un immeuble. Tu listes toutes les sonnettes disponibles. Sonner une sonnette qui n'est pas sur le panneau (émettre un événement non déclaré), c'est prétendre que quelqu'un habite là alors que non — la confusion est inévitable.

---

## PIÈGE 12 : `watch` sur une valeur primitive (extraction incorrecte) 👀

### Le problème

`watch` doit recevoir une **source réactive** — une ref, un reactive, ou un **getter** (une fonction qui retourne une valeur). Passer directement une valeur primitive (un nombre, une chaîne) ne fonctionnera pas.

### ❌ Code incorrect

```ts
<script setup lang="ts">
import { reactive, watch } from 'vue'

const etat = reactive({ compteur: 0, nom: 'Alice' })

// ❌ PIÈGE : on passe la valeur directe (pas réactive) à watch
// Au moment où watch est configuré, etat.compteur vaut 0 (un nombre)
// watch reçoit 0, pas une ref, donc il ne peut pas surveiller les changements
watch(etat.compteur, (nouvelleValeur) => {
  console.log('Compteur changé :', nouvelleValeur)  // ❌ Ne sera jamais appelé !
})

// ❌ Même problème avec une ref déstructurée sans toRefs
const { compteur } = etat  // compteur est un nombre ordinaire — pas réactif
watch(compteur, () => { /* Ne se déclenche pas */ })
</script>
```

### ✅ Code correct — utiliser un getter (arrow function)

```ts
<script setup lang="ts">
import { ref, reactive, watch } from 'vue'

const etat = reactive({ compteur: 0, nom: 'Alice' })

// ✅ On passe une fonction getter () => etat.compteur
// watch réévalue cette fonction à chaque changement pour détecter les modifications
watch(
  () => etat.compteur,          // ← getter : surveille etat.compteur
  (nouvelleValeur, ancienneValeur) => {
    console.log(`Changé de ${ancienneValeur} à ${nouvelleValeur}`)  // ✅ Fonctionne !
  }
)

// ✅ Surveiller une ref directement → OK (les refs sont des sources valides)
const nom = ref('Alice')
watch(nom, (nouvNom) => {
  console.log('Nouveau nom :', nouvNom)  // ✅ Fonctionne !
  // Pas besoin de .value dans le callback — watch le déballe automatiquement
})

// ✅ Surveiller tout un objet reactive (attention : deep nécessaire pour les propriétés)
watch(etat, (nouvelEtat) => {
  console.log('État changé')
}, { deep: true })
</script>
```

### Résumé des sources valides pour `watch`

```ts
watch(maRef, callback)                    // ✅ Une ref
watch(() => monReactive.prop, callback)   // ✅ Un getter (arrow function)
watch(monReactive, callback, {deep:true}) // ✅ Un reactive entier (avec deep)
watch([ref1, ref2], callback)             // ✅ Un tableau de sources
watch(maRef.value, callback)              // ❌ La valeur brute — ne réagit pas
watch(etat.compteur, callback)            // ❌ La propriété directe — ne réagit pas
```

### Astuce mnémotechnique

`watch` a besoin d'une **adresse** pour surveiller un appartement, pas d'une photo de l'appartement. Une valeur primitive (`.value`, `.prop`) c'est une photo — c'est figé. Une ref ou un getter, c'est une adresse — `watch` peut y retourner régulièrement vérifier.

---

## PIÈGE 13 : `v-if` et `v-for` sur le même élément 🔀

### Le problème

Mettre `v-if` et `v-for` sur le **même élément HTML** est fortement déconseillé. En Vue 3, `v-if` a la priorité sur `v-for`, ce qui peut produire des comportements inattendus (ou une erreur TypeScript car `item` est inaccessible dans `v-if`).

### ❌ Code incorrect

```vue
<template>
  <!-- ❌ Sur le même élément : v-if est évalué en premier,
       mais "article" (variable de v-for) n'existe pas encore ! -->
  <li v-for="article in articles" v-if="article.actif" :key="article.id">
    {{ article.titre }}
  </li>
  <!-- En Vue 3 : erreur TypeScript + avertissement ESLint -->
  <!-- En Vue 2 : comportement différent et source de confusion -->
</template>
```

### ✅ Solution 1 : Utiliser une propriété calculée pour filtrer (recommandée)

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const articles = ref([
  { id: 1, titre: 'Vue 3', actif: true },
  { id: 2, titre: 'Brouillon', actif: false },
])

// ✅ On filtre d'abord dans un computed, puis on affiche la liste propre
const articlesActifs = computed(() =>
  articles.value.filter(a => a.actif)
)
</script>

<template>
  <li v-for="article in articlesActifs" :key="article.id">
    {{ article.titre }}
  </li>
</template>
```

### ✅ Solution 2 : Encapsuler le `v-if` dans un `<template>` wrapper

```vue
<template>
  <!-- ✅ v-for sur l'élément extérieur, v-if sur le sous-élément -->
  <!-- Ici on peut accéder à "article" dans v-if car c'est à l'intérieur du v-for -->
  <template v-for="article in articles" :key="article.id">
    <li v-if="article.actif">
      {{ article.titre }}
    </li>
  </template>
</template>
```

### Astuce mnémotechnique

C'est comme demander à quelqu'un de **choisir parmi les invités** avant que la liste d'invités soit connue. Filtre d'abord ta liste (computed), puis affiche-la — ou demande d'abord qui est là (`v-for`), et seulement après filtre (`v-if` dans l'enfant).

---

## PIÈGE 14 : Oublier les imports de Vue 📦

### Le problème

En Vue 3 avec `<script setup>`, les fonctions comme `ref`, `computed`, `watch`, `onMounted`… ne sont **pas disponibles automatiquement**. Il faut les importer explicitement depuis `'vue'`.

### ❌ Code incorrect

```vue
<script setup lang="ts">
// ❌ On utilise ref et computed sans les avoir importés
const compteur = ref(0)      // ReferenceError: ref is not defined
const double = computed(() => compteur.value * 2)  // même erreur
</script>
```

### ✅ Code correct

```vue
<script setup lang="ts">
// ✅ Tout ce dont tu as besoin doit être importé depuis 'vue'
import { ref, computed, watch, onMounted, onUnmounted, reactive, toRefs } from 'vue'

const compteur = ref(0)
const double = computed(() => compteur.value * 2)
</script>
```

### Liste des imports Vue 3 courants à connaître

```ts
import {
  // Réactivité
  ref,          // valeur simple réactive
  reactive,     // objet réactif
  computed,     // valeur calculée (synchrone)
  readonly,     // rend un reactive immuable
  toRefs,       // convertit un reactive en refs individuelles

  // Surveillance
  watch,        // surveille un source réactive
  watchEffect,  // re-exécute quand une dépendance change (sans source explicite)

  // Cycle de vie
  onMounted,    // après le montage du composant
  onUnmounted,  // avant la destruction du composant
  onUpdated,    // après chaque mise à jour du DOM
  onBeforeMount, // juste avant le montage

  // Utilitaires
  nextTick,     // attend le prochain cycle de rendu
  defineProps,  // déclare les props (macro — pas besoin d'import dans certaines configs)
  defineEmits,  // déclare les emits (macro — même chose)
} from 'vue'
```

> 💡 **Bon à savoir** : Dans les projets qui utilisent le plugin `unplugin-auto-import`, les imports Vue sont ajoutés automatiquement. Vérifie ta config `vite.config.ts` — si `AutoImport` est configuré, tu n'as pas besoin d'importer manuellement.

### Astuce mnémotechnique

Vue 3, c'est une **boîte à outils**. Les outils ne sautent pas dans ta main — tu dois les **sortir de la boîte** (importer). Pas d'import = pas d'outil.

---

## PIÈGE 15 : Mutation directe d'un tableau réactif 🗂️

### Le problème

Certaines méthodes JavaScript modifient un tableau "en place" (mutent le tableau) — Vue les détecte bien. D'autres créent un **nouveau tableau** — si tu réassignes sans passer par `.value`, Vue ne voit rien. Et certains patterns classiques JS ne déclenchent pas la réactivité.

> **📖 Rappel JavaScript — Méthodes de tableau**
>
> Deux catégories de méthodes de tableau :
> ```ts
> const arr: number[] = [1, 2, 3]
> const item: number = 4
> const i: number = 1
>
> // Méthodes MUTANTES (modifient le tableau en place) :
> arr.push(item)      // ajoute à la fin
> arr.pop()           // retire le dernier
> arr.shift()         // retire le premier
> arr.unshift(item)   // ajoute au début
> arr.splice(i, 1)    // supprime à l'index i
> arr.sort()          // trie sur place
> arr.reverse()       // inverse sur place
>
> // Méthodes NON-MUTANTES (retournent un NOUVEAU tableau) :
> arr.filter((n: number) => n > 1)      // → nouveau tableau filtré
> arr.map((n: number) => n * 2)         // → nouveau tableau transformé
> arr.slice(0, 3)     // → copie partielle
> arr.concat([5, 6])  // → nouveau tableau fusionné
> ```

### ❌ Code incorrect

```ts
<script setup lang="ts">
import { ref } from 'vue'

const taches = ref([
  { id: 1, titre: 'Acheter du pain', fait: false },
  { id: 2, titre: 'Coder en Vue', fait: false },
])

// ❌ Modifier par index direct (Vue 2 ne le détectait pas — Vue 3 le gère,
//    mais c'est un pattern à connaître)
taches.value[0] = { id: 1, titre: 'Fait !', fait: true }  // Fonctionne en Vue 3 ✅
// Mais attention à la forme suivante :

// ❌ Remplacer l'array entier sans passer par .value
// (si taches était un reactive et non une ref)
// taches = taches.value.filter(t => !t.fait)  → réassignation perdue

// ❌ Oublier que filter() ne mute PAS — le tableau original est inchangé
taches.value.filter(t => !t.fait)  // ❌ Résultat non utilisé ! Le tableau n'est PAS modifié
</script>
```

### ✅ Code correct — patterns courants

```ts
<script setup lang="ts">
import { ref } from 'vue'

interface Tache {
  id: number
  titre: string
  fait: boolean
}

const taches = ref<Tache[]>([
  { id: 1, titre: 'Acheter du pain', fait: false },
  { id: 2, titre: 'Coder en Vue', fait: false },
])

// ✅ Ajouter un élément
function ajouterTache(titre: string) {
  taches.value.push({              // push() mute — Vue le détecte
    id: Date.now(),
    titre,
    fait: false
  })
}

// ✅ Supprimer un élément
function supprimerTache(id: number) {
  // filter() retourne un nouveau tableau — on l'assigne à .value
  taches.value = taches.value.filter(t => t.id !== id)  // ✅ .value = nouveau tableau
}

// ✅ Mettre à jour un élément
function toggleFait(id: number) {
  // map() retourne un nouveau tableau transformé
  taches.value = taches.value.map(t =>
    t.id === id ? { ...t, fait: !t.fait } : t  // spread pour créer un nouvel objet
  )
  // OU : trouver et modifier directement (aussi valide avec Vue 3)
  // const tache = taches.value.find(t => t.id === id)
  // if (tache) tache.fait = !tache.fait  // ✅ Vue 3 détecte cette modification
}

// ✅ Filtrer (affichage) — utiliser un computed, pas modifier le tableau !
import { computed } from 'vue'
const tachesNonFaites = computed(() => taches.value.filter(t => !t.fait))
</script>
```

### Règle d'or pour les tableaux

```
Veux-tu MODIFIER le tableau de données ?
  → Méthode mutante (push, splice...) → Vue 3 le détecte directement ✅
  → Méthode non-mutante (filter, map...) → assigner le résultat à .value ✅

Veux-tu juste AFFICHER une version filtrée/triée ?
  → Utilise un computed() → le tableau original reste intact ✅
```

### Astuce mnémotechnique

`filter()` et `map()`, c'est comme une **photocopieuse** : ils copient et trient, mais l'**original reste dans le tiroir**. Si tu veux que la version modifiée soit "la vraie version", tu dois **remplacer le tiroir** par la photocopie (`taches.value = taches.value.filter(...)`).

---

## Tableau récapitulatif — Les 15 pièges 📋

| # | Piège | Symptôme | Solution rapide |
|---|-------|----------|-----------------|
| 1 | Oublier `.value` | Interface figée, `NaN`, `RefImpl` dans la console | Ajouter `.value` dans `<script>` (pas dans `<template>`) |
| 2 | Destructuring reactive | Interface figée malgré les modifications | Accéder via l'objet ou utiliser `toRefs()` |
| 3 | Réassigner reactive | Perte silencieuse de réactivité | `Object.assign()` ou utiliser `ref` avec `.value =` |
| 4 | Modifier les props | Avertissement Vue, comportement incohérent | Utiliser `emit` pour demander au parent de changer |
| 5 | async dans computed | `[object Promise]` dans le template | Utiliser `watch` + `ref` pour les données async |
| 6 | Oublier await | `[object Promise]` ou `undefined` | Ajouter `await` + `async` partout dans la chaîne |
| 7 | v-for sans :key | Bugs d'affichage, mauvais focus sur les inputs | `:key="item.id"` avec un ID stable et unique |
| 8 | DOM avant onMounted | `null`, `TypeError: Cannot read properties of null` | Accéder au DOM uniquement dans `onMounted()` |
| 9 | Fuite mémoire | Ralentissements croissants, bugs après navigation | Nettoyer dans `onUnmounted()` |
| 10 | any vs unknown | Erreurs runtime inattendues | Déclarer une interface TypeScript ou utiliser `unknown` |
| 11 | Emit non déclaré | Avertissement Vue, TypeScript "Cannot find name 'emit'" | `defineEmits<{ nomEvenement: [args] }>()` |
| 12 | watch sur primitive | Callback jamais déclenché | Passer un getter `() => reactive.prop` à `watch` |
| 13 | v-if + v-for ensemble | Erreur TypeScript, comportement inattendu | Filtrer dans `computed` ou séparer sur deux éléments |
| 14 | Import manquant | `ReferenceError: ref is not defined` | `import { ref, computed, ... } from 'vue'` |
| 15 | Mutation tableau | Interface non mise à jour, ou données perdues | Méthodes mutantes pour modifier, `filter/map` → assigner à `.value` |

---

## Pour aller plus loin

Ces pièges couvrent les situations les plus fréquentes. Au fur et à mesure de ta progression, tu en découvriras d'autres. Voici ce qui t'aidera le plus :

1. **Lire les messages d'erreur** — Vue et TypeScript donnent des messages souvent très explicites
2. **Vue DevTools** (extension navigateur) — inspecte la réactivité en temps réel
3. **Activer les règles ESLint Vue** (`plugin:vue/vue3-recommended`) — beaucoup de ces pièges sont détectés automatiquement
4. **Lire la doc officielle** : [vuejs.org/guide](https://vuejs.org/guide) — elle est excellente et en français partiel

> 💪 **Rappel** : Tomber dans ces pièges est une étape normale de l'apprentissage. Chaque erreur comprises est un réflexe de moins à acquérir. Tu y es presque !
