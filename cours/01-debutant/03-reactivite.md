# 03 — La réactivité (ref, reactive, computed)

---

> **🔄 Rappel du cours précédent**
> Avant de continuer, vérifie que tu peux répondre à ces questions :
> 1. Quelle directive utilise-t-on pour afficher un élément conditionnellement ?
> 2. Quelle est la syntaxe pour boucler sur un tableau dans le template ?
> 
> <details>
> <summary>Vérifier mes réponses</summary>
>
> 1. `v-if` (ou `v-show` pour cacher sans retirer du DOM)
> 2. `v-for="item in items"` avec un `:key` unique
> </details>

---

## C'est quoi la réactivité ? 🤔

### L'analogie du tableur Excel

Imagine un tableur Excel :

- Dans la cellule **A1**, tu écris `10` (le prix d'un article)
- Dans la cellule **A2**, tu écris `3` (la quantité)
- Dans la cellule **A3**, tu écris la **formule** `=A1 * A2` → elle affiche `30`

Maintenant, si tu changes **A1** de `10` à `15`... **A3 se met à jour toute seule** et affiche `45` !

**Tu n'as rien eu à faire.** Le tableur a "réagi" au changement.

**La réactivité dans Vue 3, c'est exactement ça :**
> Quand une donnée change, tout ce qui en dépend (l'affichage, les calculs…) **se met à jour automatiquement**.

Sans réactivité, tu devrais manuellement dire au navigateur "hey, la donnée a changé, re-dessine cette partie de la page". Avec Vue, c'est **automatique**.

### Comment Vue fait-il ça ? Les Proxy (le chien de garde invisible)

> **📖 Rappel JavaScript — Les objets**
>
> En JavaScript, un objet c'est un "sac" de propriétés :
> ```ts
> // Un objet simple avec deux propriétés
> const personne: { nom: string; age: number } = {
>   nom: "Alice",   // propriété "nom" qui vaut "Alice"
>   age: 25         // propriété "age" qui vaut 25
> };
>
> personne.nom;      // → "Alice" (on LIT la propriété)
> personne.age = 26; // → on MODIFIE la propriété
> ```

Pour que Vue sache **quand** tu lis ou modifies une donnée, il place un **Proxy** autour de tes données.

Imagine un **chien de garde invisible** devant ta boîte aux lettres :
- Chaque fois que quelqu'un **regarde** dans la boîte (lire une donnée) → le chien note "telle personne a regardé"
- Chaque fois que quelqu'un **met** ou **change** le courrier (modifier une donnée) → le chien prévient toutes les personnes qui avaient regardé : "hey, ça a changé !"

**Tu ne vois jamais ce chien de garde**, mais il travaille en coulisses. C'est grâce à lui que Vue sait quoi mettre à jour quand une donnée change.

---

## `ref` — Créer une valeur réactive simple

`ref` est **la fonction la plus importante** de Vue 3. Elle prend n'importe quelle valeur et la rend **réactive** (= surveillée par le chien de garde).

> **📖 Rappel JavaScript — Les variables**
>
> En JS moderne, on déclare des variables avec `const` ou `let` :
> ```ts
> const nom: string = "Alice";  // const = ne peut PAS être réassigné (on ne peut pas faire nom = "Bob")
> let age: number = 25;         // let = PEUT être réassigné (age = 26 → OK)
> ```
> Mais même avec `const`, si c'est un objet, on peut modifier ses propriétés internes.

### Exemple de base

```ts
// On importe la fonction ref depuis Vue
import { ref } from 'vue'

// On crée une variable réactive qui contient le nombre 0
// <number> dit à TypeScript : "cette ref contient un nombre"
const count = ref<number>(0)

// Pour LIRE la valeur, on utilise .value
console.log(count.value) // → 0

// Pour MODIFIER la valeur, on passe aussi par .value
count.value = 5
console.log(count.value) // → 5

// On peut faire des opérations
count.value++             // équivaut à : count.value = count.value + 1
console.log(count.value)  // → 6
```

### Pourquoi `.value` ? (le concept d'emballage) 🎁

C'est LA question que tout le monde se pose. Voici l'explication simple :

En JavaScript, les types simples (`number`, `string`, `boolean`) sont des **valeurs brutes**. On ne peut pas "surveiller" une valeur brute :

```ts
// TypeScript normal (PAS Vue)
let compteur: number = 0  // juste un nombre tout nu
compteur = 5      // TypeScript ne peut pas "savoir" que ça a changé
                   // Il n'y a aucun mécanisme de surveillance possible
```

La solution de Vue : **emballer** la valeur dans un petit objet (une boîte) :

```ts
// Ce que ref() fait en coulisses (simplifié) :
// Il crée un objet avec une propriété .value
// Et il place le chien de garde (Proxy) sur cet objet

const count = ref(0)
// count est maintenant un OBJET qui ressemble à : { value: 0 }
// Et cet objet est SURVEILLÉ par le Proxy

count.value = 5  // Le chien de garde VOIT ce changement → il prévient Vue
                  // → Vue met à jour l'affichage
```

**Pense à `ref` comme une boîte-cadeau 🎁 :**
- La boîte = l'objet ref (surveillé)
- Le cadeau à l'intérieur = ta valeur (accessible via `.value`)
- Pour voir ou changer le cadeau, tu dois **ouvrir la boîte** (`.value`)

### Bonne nouvelle : pas de `.value` dans le template !

Dans la partie `<template>` de Vue (le HTML), Vue **déballe automatiquement** la ref pour toi :

```vue
<script setup lang="ts">
// On importe ref depuis Vue
import { ref } from 'vue'

// On crée une ref avec le nombre 0
const count = ref<number>(0)

// Fonction pour ajouter 1 au compteur
// Ici on est dans le <script>, donc il FAUT .value
function increment(): void {
  count.value++
}
</script>

<template>
  <!-- Dans le template, PAS BESOIN de .value ! Vue le fait pour nous -->
  <p>Compteur : {{ count }}</p>

  <!-- Quand on clique, on appelle la fonction increment -->
  <button @click="increment">+1</button>
</template>
```

**Résumé :**
| Où tu es | Faut-il écrire `.value` ? |
|---|---|
| Dans `<script setup>` | ✅ **Oui**, toujours `count.value` |
| Dans `<template>` | ❌ **Non**, juste `count` |

### Quand utiliser `ref` ?

- **Nombres** : `const age = ref<number>(0)`
- **Textes** : `const nom = ref<string>('')`
- **Booléens** (vrai/faux) : `const visible = ref<boolean>(false)`
- **Valeur qui peut être null** : `const user = ref<User | null>(null)` *(null = "pas encore de valeur")*
- **Tableaux** : `const items = ref<string[]>([])` *(un tableau vide au départ)*

👉 En gros, **utilise `ref` pour TOUT**. C'est le choix par défaut.

### 🎯 Pratique — ref

```vue
<!-- Exercice R.1 : Crée un compteur de likes -->
<script setup lang="ts">
import { ref } from 'vue'

// Déclare une ref "likes" qui commence à 0
const likes = ???

function ajouterLike(): void {
  // Incrémente likes
  ???
}
</script>

<template>
  <p>❤️ {{ likes }} likes</p>
  <button @click="ajouterLike">J'aime</button>
</template>
```

```ts
// Exercice R.2 : Déclare ces refs avec les bons types
const nom = ref<???>("Alice")
const estConnecte = ref<???>(false)
const utilisateur = ref<??? | null>(null)  // User ou null
const produits = ref<???[]>([])            // tableau de Product
```

<details>
<summary>Solution</summary>

```vue
<!-- R.1 -->
const likes = ref<number>(0)

function ajouterLike(): void {
  likes.value++
}
```

```ts
// R.2
const nom = ref<string>("Alice")
const estConnecte = ref<boolean>(false)
const utilisateur = ref<User | null>(null)
const produits = ref<Product[]>([])
```
</details>

---

## `reactive` — Rendre un objet entier réactif

`reactive` est une alternative à `ref` pour les **objets**. Au lieu d'emballer dans une boîte, il met le chien de garde **directement** sur l'objet.

### Exemple concret : un formulaire

```ts
// On importe reactive depuis Vue
import { reactive } from 'vue'

// On définit la forme de notre formulaire avec une interface TypeScript
// (= on décrit quelles propriétés il a et de quel type)
interface FormulaireContact {
  nom: string       // le nom est un texte
  email: string     // l'email est un texte
  age: number       // l'âge est un nombre
  accepte: boolean  // la case "j'accepte" est vrai ou faux
}

// On crée notre objet réactif avec des valeurs par défaut
const formulaire = reactive<FormulaireContact>({
  nom: '',          // vide au départ
  email: '',        // vide au départ
  age: 0,           // 0 au départ
  accepte: false    // non coché au départ
})

// Pour modifier : on accède DIRECTEMENT aux propriétés
// PAS de .value ! L'objet entier est déjà surveillé
formulaire.nom = 'Alice'
formulaire.email = 'alice@example.com'
formulaire.age = 28
formulaire.accepte = true
```

### Utilisation dans un composant

```vue
<script setup lang="ts">
import { reactive } from 'vue'

// Notre formulaire réactif
const formulaire = reactive({
  nom: '',
  email: '',
  message: ''
})

// Fonction appelée quand l'utilisateur soumet le formulaire
function envoyer(): void {
  // On affiche les valeurs dans la console
  console.log('Nom :', formulaire.nom)
  console.log('Email :', formulaire.email)
  console.log('Message :', formulaire.message)
}
</script>

<template>
  <!-- v-model lie l'input au champ réactif (on verra ça en détail plus tard) -->
  <input v-model="formulaire.nom" placeholder="Votre nom" />
  <input v-model="formulaire.email" placeholder="Votre email" />
  <textarea v-model="formulaire.message" placeholder="Votre message" />

  <button @click="envoyer">Envoyer</button>
</template>
```

### Quand utiliser `reactive` ?

- **Formulaires** avec plusieurs champs liés entre eux
- Un **groupe de données** qui vont toujours ensemble

Mais attention aux pièges ci-dessous… 👇

---

## ⚠️ Les pièges de `reactive`

### Piège 1 : ne JAMAIS réassigner l'objet entier

```ts
let state = reactive({ count: 0 })

// ❌ INTERDIT — on remplace l'objet par un NOUVEL objet
// L'ancien objet (avec le chien de garde) est jeté à la poubelle
// Le nouveau n'est pas surveillé → la réactivité est PERDUE
state = reactive({ count: 1 })

// ✅ CORRECT — on modifie la propriété À L'INTÉRIEUR de l'objet
// Le chien de garde voit le changement → Vue met à jour l'affichage
state.count = 1
```

### Piège 2 : le destructuring casse la réactivité

> **📖 Rappel JavaScript — Le destructuring (décomposition)**
>
> Le destructuring permet d'**extraire** des valeurs d'un objet vers des variables séparées :
> ```ts
> const personne: { nom: string; age: number } = { nom: 'Alice', age: 25 }
>
> // Sans destructuring (classique) :
> const nom: string = personne.nom   // nom = 'Alice'
> const age: number = personne.age   // age = 25
>
> // Avec destructuring (raccourci) :
> const { nom, age } = personne  // fait la même chose en une ligne !
> // nom = 'Alice', age = 25
> ```
>
> **Attention** : le destructuring fait une **copie** de la valeur.
> Si tu changes `nom`, ça ne change PAS `personne.nom`.
> C'est comme photocopier un document : modifier la photocopie ne modifie pas l'original.

Maintenant, le piège avec `reactive` :

```ts
const state = reactive({ compteur: 0, nom: 'Alice' })

// ❌ PROBLÈME — on extrait "compteur" dans une variable normale
// C'est une COPIE du nombre 0, plus aucun lien avec state
const { compteur } = state
compteur++ // ← ça modifie la copie locale, PAS state.compteur
            // Vue ne voit RIEN → pas de mise à jour de l'affichage

// ✅ CORRECT — on modifie via l'objet réactif directement
state.compteur++  // le chien de garde voit le changement → Vue réagit
```

### Résumé des pièges

| Action | Résultat |
|---|---|
| `state.compteur = 5` | ✅ Réactif — le Proxy voit le changement |
| `state = { compteur: 5 }` | ❌ Cassé — on a remplacé l'objet surveillé |
| `const { compteur } = state` puis `compteur++` | ❌ Cassé — c'est une copie déconnectée |

### 🎯 Pratique — reactive

```vue
<!-- Exercice R.3 : Formulaire avec reactive -->
<script setup lang="ts">
import { reactive } from 'vue'

interface LoginForm {
  email: string
  password: string
  rememberMe: boolean
}

const form = reactive<LoginForm>({
  // ??? complète les valeurs initiales
})

function submit(): void {
  console.log('Email:', form.email)
  console.log('Password:', form.password)
}
</script>

<template>
  <input v-model="form.email" type="email" />
  <input v-model="form.password" type="password" />
  <label>
    <input type="checkbox" v-model="form.rememberMe" />
    Se souvenir de moi
  </label>
  <button @click="submit">Connexion</button>
</template>
```

```ts
// Exercice R.4 : Trouve l'erreur dans ce code
const state = reactive({ count: 0 })

function reset() {
  state = { count: 0 }  // ❌ Pourquoi ça ne marche pas ?
}

// Comment corriger ?
```

<details>
<summary>Solution</summary>

```ts
// R.3
const form = reactive<LoginForm>({
  email: '',
  password: '',
  rememberMe: false,
})

// R.4 - On ne peut pas réassigner un reactive !
function reset() {
  state.count = 0  // ✅ Modifier la propriété, pas l'objet
}
```
</details>

---

## 🏆 La règle d'or : préfère `ref` dans 90% des cas

> **Utilise `ref` pour tout.** Utilise `reactive` uniquement pour un formulaire avec beaucoup de champs liés.

Pourquoi ?
- `ref` peut contenir n'importe quoi (nombre, texte, objet, tableau, null…)
- `ref` peut être **réassigné** sans problème (`maRef.value = nouvelleValeur`)
- `ref` n'a pas les pièges de `reactive` (destructuring, réassignation)
- Le seul inconvénient (écrire `.value`) est un petit prix à payer pour la sécurité

---

## `computed` — Une valeur calculée automatiquement

### L'analogie de la formule Excel 📊

Tu te rappelles notre tableur du début ?

- **A1** = prix = `10`
- **A2** = quantité = `3`
- **A3** = formule `=A1 * A2` → affiche `30`

En Vue :
- **A1** et **A2** ce sont des `ref` (les données de base)
- **A3** c'est un `computed` (la formule qui dépend des données de base)

Un `computed` :
1. **Calcule** un résultat à partir d'autres données réactives
2. **Se recalcule automatiquement** quand ces données changent
3. **Met en cache** le résultat (= il ne recalcule que si nécessaire, pas à chaque affichage)

### Exemple concret

```ts
// On importe ref et computed depuis Vue
import { ref, computed } from 'vue'

// Nos données de base (comme les cellules A1 et A2)
const prix = ref<number>(10)       // prix d'un article : 10€
const quantite = ref<number>(3)    // on en veut 3

// Notre formule calculée (comme la cellule A3)
// computed() prend une FONCTION qui retourne le résultat du calcul
const total = computed<number>(() => {
  // Cette fonction est la "formule"
  // Elle UTILISE prix.value et quantite.value
  // → Vue sait donc que total DÉPEND de prix et quantite
  return prix.value * quantite.value
})

console.log(total.value) // → 30 (10 × 3)

// Si on change le prix...
prix.value = 15
// ... total se recalcule AUTOMATIQUEMENT !
console.log(total.value) // → 45 (15 × 3)

// Si on change la quantité...
quantite.value = 5
console.log(total.value) // → 75 (15 × 5)
```

### Exemple dans un composant : nom complet

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// Les données de base
const prenom = ref<string>('Jean')
const nomDeFamille = ref<string>('Dupont')

// La valeur calculée : le nom complet
// Elle se recalcule dès que prenom OU nomDeFamille change
const nomComplet = computed<string>(() => {
  return `${prenom.value} ${nomDeFamille.value}`
})
// nomComplet.value → "Jean Dupont"
</script>

<template>
  <!-- Quand on tape dans les inputs, prenom/nomDeFamille changent -->
  <!-- → nomComplet se recalcule → l'affichage se met à jour -->
  <input v-model="prenom" placeholder="Prénom" />
  <input v-model="nomDeFamille" placeholder="Nom" />

  <p>Nom complet : {{ nomComplet }}</p>
</template>
```

### `computed` vs fonction : quelle différence ?

> **📖 Rappel JavaScript — Les fonctions**
>
> Une fonction est un bloc de code réutilisable :
> ```ts
> // Déclarer une fonction
> function additionner(a: number, b: number): number {
>   return a + b  // return = "renvoie ce résultat"
> }
>
> // Appeler la fonction
> const resultat: number = additionner(3, 5) // → 8
> ```

Voici la différence entre `computed` et une simple fonction :

```ts
import { ref, computed } from 'vue'

const prenom = ref<string>('Jean')
const nomDeFamille = ref<string>('Dupont')

// ✅ COMPUTED — le résultat est MIS EN CACHE
// Il ne recalcule QUE si prenom ou nomDeFamille change
// Si tu affiches nomComplet 100 fois dans le template,
// le calcul n'est fait qu'UNE SEULE FOIS
const nomComplet = computed<string>(() => {
  return `${prenom.value} ${nomDeFamille.value}`
})

// ⚠️ FONCTION — PAS de cache
// Elle est ré-exécutée À CHAQUE FOIS qu'on l'appelle
// Si tu appelles getNomComplet() 100 fois, le calcul est fait 100 fois
function getNomComplet(): string {
  return `${prenom.value} ${nomDeFamille.value}`
}
```

**Règle simple :**
| Situation | Utilise |
|---|---|
| Tu veux **afficher** une valeur dérivée | `computed` (avec cache) |
| Tu veux **faire une action** (envoyer un formulaire, naviguer…) | Une fonction |

### Computed en écriture (avancé, rare)

Normalement, un `computed` est en **lecture seule** : tu ne peux pas faire `nomComplet.value = '...'`. Mais dans de rares cas, tu peux créer un `computed` avec un getter ET un setter :

```ts
import { ref, computed } from 'vue'

const prenom = ref<string>('Jean')
const nomDeFamille = ref<string>('Dupont')

const nomComplet = computed({
  // get = comment LIRE la valeur (comme un computed normal)
  get: () => `${prenom.value} ${nomDeFamille.value}`,

  // set = que faire quand on ÉCRIT une valeur
  // val = la nouvelle valeur qu'on essaie d'assigner
  set: (val: string) => {
    const parties = val.split(' ')  // "Marie Martin" → ["Marie", "Martin"]
    prenom.value = parties[0]       // "Marie"
    nomDeFamille.value = parties[1] // "Martin"
  }
})

// On peut maintenant écrire dedans !
nomComplet.value = 'Marie Martin'
// → prenom.value est maintenant "Marie"
// → nomDeFamille.value est maintenant "Martin"
```

> 💡 **Tu n'utiliseras quasiment jamais ça au début.** Retiens juste que ça existe.

### 🎯 Pratique — computed

```vue
<!-- Exercice R.5 : Calcul du prix total -->
<script setup lang="ts">
import { ref, computed } from 'vue'

const prixUnitaire = ref(25)
const quantite = ref(3)
const codePromo = ref(false)  // 10% de réduction si true

// Crée un computed "total" qui calcule :
// prixUnitaire * quantite, avec -10% si codePromo est activé
const total = computed(() => {
  // ???
})
</script>
```

```vue
<!-- Exercice R.6 : Filtrage avec computed -->
<script setup lang="ts">
import { ref, computed } from 'vue'

interface Task {
  id: number
  title: string
  done: boolean
}

const tasks = ref<Task[]>([
  { id: 1, title: 'Apprendre Vue', done: true },
  { id: 2, title: 'Faire les exos', done: false },
  { id: 3, title: 'Pratiquer', done: false },
])

// Crée un computed qui retourne seulement les tâches non terminées
const tachesRestantes = computed(() => {
  // ???
})
</script>
```

<details>
<summary>Solution</summary>

```ts
// R.5
const total = computed(() => {
  const sousTotal = prixUnitaire.value * quantite.value
  return codePromo.value ? sousTotal * 0.9 : sousTotal
})

// R.6
const tachesRestantes = computed(() => {
  return tasks.value.filter(t => !t.done)
})
```
</details>

---

## `shallowRef` — Réactivité de surface (avancé)

> 💡 **Section avancée** — Tu peux la survoler pour l'instant et y revenir plus tard.

`shallowRef` est comme `ref`, mais le chien de garde ne surveille que la **surface** de la boîte, pas ce qu'il y a à l'intérieur. C'est utile pour de très grosses listes où tu veux contrôler finement quand Vue recalcule.

```ts
import { shallowRef } from 'vue'

// Crée une ref "superficielle" contenant un tableau
const grosseListe = shallowRef<string[]>([])

// ❌ Modifier l'intérieur du tableau ne déclenche RIEN
// Le chien de garde ne surveille pas l'intérieur
grosseListe.value.push('nouvel élément')

// ✅ Remplacer le tableau entier DÉCLENCHE la mise à jour
// Car on change ce qui est dans la boîte (.value)
grosseListe.value = [...grosseListe.value, 'nouvel élément']
```

---

## `toRef` / `toRefs` — Extraire des refs depuis un reactive (avancé)

> 💡 **Section avancée** — Utile quand tu passeras des données à des composables (fonctions réutilisables).

Si tu as un objet `reactive` et que tu veux en extraire une propriété **en gardant la réactivité** (contrairement au destructuring qui la casse), tu utilises `toRef` ou `toRefs` :

```ts
import { reactive, toRef, toRefs } from 'vue'

const state = reactive({ nom: 'Alice', age: 30 })

// Extraire UNE propriété en ref réactive (liée à l'original)
const nomRef = toRef(state, 'nom')
nomRef.value = 'Bob'     // ← modifie aussi state.nom !

// Extraire TOUTES les propriétés en refs réactives
const { nom, age } = toRefs(state)
nom.value = 'Charlie'    // ← modifie aussi state.nom !
age.value = 31            // ← modifie aussi state.age !
```

**Contrairement au destructuring classique**, `toRef`/`toRefs` maintiennent le **lien** avec l'objet d'origine. La copie et l'original restent synchronisés.

---

## Récapitulatif

| API | C'est quoi | `.value` ? | Quand l'utiliser |
|---|---|---|---|
| `ref` | Une boîte réactive autour d'une valeur | ✅ Oui | **Partout — choix par défaut** |
| `reactive` | Un objet directement réactif | ❌ Non | Formulaires avec beaucoup de champs |
| `computed` | Une formule qui se recalcule auto | ✅ Oui (lecture seule) | Valeurs dérivées (total, nom complet…) |
| `shallowRef` | Une ref qui ne surveille que la surface | ✅ Oui | Grosses listes, optimisation (avancé) |
| `toRef/toRefs` | Extraire des refs depuis un `reactive` | ✅ Oui | Passer des props à des composables (avancé) |

### Les 3 choses à retenir absolument

1. **`ref` pour tout** — c'est ton outil principal, n'hésite pas à l'utiliser partout
2. **`.value` dans le script, pas dans le template** — Vue déballe automatiquement dans `<template>`
3. **`computed` pour les formules** — dès qu'une valeur dépend d'autres valeurs, utilise `computed`

---

## Suite

→ `cours/01-debutant/04-evenements-et-v-model.md`
