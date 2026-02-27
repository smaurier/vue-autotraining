# 04 — Formulaires et validation

---

> **🔄 Rappel du cours précédent**
> Avant de continuer, vérifie que tu peux répondre à ces questions :
> 1. Pourquoi utilise-t-on `async/await` dans un composable de fetch ?
> 2. Quels 3 états gère-t-on généralement lors d'un appel API ?
> 
> <details>
> <summary>Vérifier mes réponses</summary>
>
> 1. Pour attendre la réponse du serveur avant de continuer l'exécution
> 2. `isLoading` (chargement), `data` (résultat), `error` (erreur)
> </details>

---

## 📝 Rappel HTML : comment fonctionne un formulaire ?

Avant Vue, les formulaires étaient gérés **entièrement par HTML**. Petit rappel :

```html
<!-- Un formulaire HTML classique -->
<form method="POST" action="/envoyer">
  <!--
    method="POST" → comment envoyer les données (POST = dans le corps de la requête)
    action="/envoyer" → OÙ envoyer les données (l'URL du serveur)
  -->

  <!-- Chaque champ a un attribut "name" qui sert de clé -->
  <label>Nom :</label>
  <input type="text" name="nom" />
  <!-- Quand on soumet, ça envoie : { nom: "ce que l'utilisateur a tapé" } -->

  <label>Email :</label>
  <input type="email" name="email" />

  <!-- Le bouton type="submit" déclenche l'envoi du formulaire -->
  <button type="submit">Envoyer</button>
</form>
```

### Le problème avec les formulaires HTML classiques

Quand tu cliques sur "Envoyer", **la page se recharge complètement**. Le navigateur envoie les données et charge une nouvelle page. Dans une application Vue (ou React, Angular...), on ne veut **PAS** ça — on veut rester sur la même page et gérer l'envoi nous-mêmes.

### Comment empêcher le rechargement ?

En JavaScript classique :

```js
// L'événement "submit" se déclenche quand on clique sur le bouton d'envoi
formulaire.addEventListener("submit", function (event) {
  event.preventDefault(); // ← EMPÊCHE le rechargement de la page
  // Maintenant on peut gérer l'envoi nous-mêmes
});
```

En Vue, c'est plus simple grâce au modificateur `.prevent` :

```html
<!-- @submit.prevent = "quand le formulaire est soumis, empêche le rechargement" -->
<form @submit.prevent="maFonction">
  <!-- ... -->
</form>
```

---

## ✅ C'est quoi la validation de formulaire ?

### L'analogie du videur de boîte de nuit

La **validation**, c'est comme un **videur** devant une boîte de nuit. Avant de laisser entrer quelqu'un (envoyer les données au serveur), le videur vérifie des **règles** :

- "Tu as ta carte d'identité ?" → Le champ nom n'est **pas vide**
- "Tu as au moins 18 ans ?" → L'âge est **supérieur ou égal à 18**
- "Tu es sur la liste ?" → L'email a un **format valide**

Si une règle n'est pas respectée, le videur refuse l'entrée et **explique pourquoi** (message d'erreur).

### Les deux types de validation

1. **Validation côté client (front-end)** — Le videur à l'entrée. Rapide, bonne expérience utilisateur, mais contournable.
2. **Validation côté serveur (back-end)** — Le contrôle de sécurité à l'intérieur. Impossible à contourner. **Toujours obligatoire**.

> ⚠️ La validation front-end est là pour le confort de l'utilisateur. La validation back-end est là pour la sécurité. **Les deux sont nécessaires**.

---

## Formulaire simple avec validation manuelle

Commençons par un formulaire **sans aucune librairie**, pour bien comprendre les bases :

```vue
<script setup lang="ts">
import { reactive, computed, ref } from "vue";

// On définit la FORME de notre formulaire avec une interface TypeScript
// Cela décrit quels champs existent et leur type
interface ContactForm {
  name: string;      // Le nom (texte)
  email: string;     // L'email (texte)
  message: string;   // Le message (texte)
}

// On définit la FORME des erreurs possibles
// Chaque champ peut avoir une erreur (string) ou pas (undefined)
interface FormErrors {
  name?: string;     // "?" veut dire "ce champ est optionnel"
  email?: string;
  message?: string;
}

// reactive() crée un OBJET réactif (quand on modifie une propriété, Vue met à jour l'affichage)
const form = reactive<ContactForm>({
  name: "",       // Vide au départ
  email: "",      // Vide au départ
  message: "",    // Vide au départ
});

// computed() crée une valeur CALCULÉE qui se recalcule automatiquement
// quand les valeurs dont elle dépend changent
const errors = computed<FormErrors>(() => {
  const e: FormErrors = {}; // On commence avec un objet vide (pas d'erreurs)

  // Règle 1 : le nom ne doit pas être vide
  // .trim() enlève les espaces au début et à la fin
  if (!form.name.trim()) {
    e.name = "Le nom est requis";
  }

  // Règle 2 : l'email doit contenir un "@"
  if (!form.email.includes("@")) {
    e.email = "Email invalide";
  }

  // Règle 3 : le message doit faire au moins 10 caractères
  if (form.message.length < 10) {
    e.message = "Minimum 10 caractères";
  }

  return e; // On retourne l'objet des erreurs
});

// Le formulaire est valide si l'objet errors n'a AUCUNE clé
// Object.keys(obj) retourne un tableau des clés de l'objet
// Si le tableau est vide (length === 0), il n'y a pas d'erreur
const isValid = computed(() => Object.keys(errors.value).length === 0);

// "submitted" sert à ne montrer les erreurs QU'APRÈS le premier clic sur "Envoyer"
// (sinon l'utilisateur verrait des erreurs avant même d'avoir rempli le formulaire)
const submitted = ref(false);

// La fonction appelée quand on soumet le formulaire
function handleSubmit(): void {
  submitted.value = true;     // On note qu'on a essayé de soumettre

  if (!isValid.value) return; // Si le formulaire est invalide, on ARRÊTE ici

  // Si on arrive ici, tout est valide !
  console.log("Données envoyées :", form);
  // En vrai, on ferait un fetch() pour envoyer au serveur
}
</script>

<template>
  <!-- @submit.prevent empêche le rechargement de la page -->
  <form @submit.prevent="handleSubmit">

    <!-- Champ NOM -->
    <div>
      <label>Nom</label>
      <!-- v-model.trim lie le champ à form.name ET enlève les espaces -->
      <input v-model.trim="form.name" />
      <!-- On affiche l'erreur SEULEMENT si on a essayé de soumettre ET qu'il y a une erreur -->
      <span v-if="submitted && errors.name" class="error">
        {{ errors.name }}
      </span>
    </div>

    <!-- Champ EMAIL -->
    <div>
      <label>Email</label>
      <!-- type="email" ajoute une validation basique du navigateur -->
      <input v-model.trim="form.email" type="email" />
      <span v-if="submitted && errors.email" class="error">
        {{ errors.email }}
      </span>
    </div>

    <!-- Champ MESSAGE -->
    <div>
      <label>Message</label>
      <!-- textarea = zone de texte multi-lignes -->
      <textarea v-model="form.message"></textarea>
      <span v-if="submitted && errors.message" class="error">
        {{ errors.message }}
      </span>
    </div>

    <!-- Bouton de soumission (désactivé si on a essayé de soumettre mais c'est invalide) -->
    <button type="submit" :disabled="submitted && !isValid">
      Envoyer
    </button>
  </form>
</template>
```

---

## 🔤 Rappel JavaScript : les expressions régulières (regex)

### C'est quoi une regex ?

Une **regex** (expression régulière), c'est un **motif de recherche** — une façon de dire "je cherche un texte qui ressemble à ça".

**Analogie** : c'est comme un gabarit de forme. Tu as un moule en forme d'étoile et tu vérifies si un biscuit correspond à cette forme.

```js
// Une regex se met entre deux / (slashes)
const motif = /bonjour/;

// .test() vérifie si le texte correspond au motif
motif.test("bonjour le monde");  // true  (le mot "bonjour" est dedans)
motif.test("au revoir");          // false (pas de "bonjour" dedans)
```

### Les regex les plus courantes en validation

```js
// Vérifier un email : "quelquechose @ quelquechose . quelquechose"
const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// ^         = début du texte
// [^\s@]+   = un ou plusieurs caractères qui ne sont ni un espace ni un @
// @         = le symbole @
// \.        = un point (le \ "échappe" le point qui a un sens spécial en regex)
// $         = fin du texte

regexEmail.test("jean@email.com");   // true ✅
regexEmail.test("pas un email");      // false ❌

// Vérifier un numéro de téléphone français : 10 chiffres commençant par 0
const regexTel = /^0[1-9]\d{8}$/;
// ^0        = commence par 0
// [1-9]     = suivi d'un chiffre entre 1 et 9
// \d{8}     = suivi de exactement 8 chiffres
// $         = fin du texte

regexTel.test("0612345678");  // true ✅
regexTel.test("1234");         // false ❌
```

---

## Composable de validation : un outil réutilisable

### Pourquoi un composable ?

Le code de validation ci-dessus fonctionne, mais si tu as **10 formulaires différents** dans ton application, tu vas copier-coller le même code partout. Un **composable** permet de mutualiser cette logique.

```ts
// composables/useFormValidation.ts

import { reactive, computed, type ComputedRef } from "vue";

// --- Les types ---

// Une règle de validation : une fonction qui prend une valeur
// et retourne un message d'erreur (string) ou rien (undefined = pas d'erreur)
type ValidationRule<T> = (value: T) => string | undefined;

// L'ensemble des règles pour un formulaire
// Pour chaque champ, on a un TABLEAU de règles (on peut en avoir plusieurs)
type ValidationRules<T> = { [K in keyof T]?: ValidationRule<T[K]>[] };

// Ce que le composable retourne
interface UseFormReturn<T extends Record<string, any>> {
  form: T;                                           // Les données du formulaire
  errors: ComputedRef<Partial<Record<keyof T, string>>>; // Les erreurs calculées
  isValid: ComputedRef<boolean>;                     // Est-ce que tout est valide ?
  touched: Record<keyof T, boolean>;                 // Quels champs l'utilisateur a touchés
  touch: (field: keyof T) => void;                   // Fonction pour "toucher" un champ
  reset: () => void;                                 // Fonction pour tout remettre à zéro
}

// --- Le composable ---

export function useForm<T extends Record<string, any>>(
  initialValues: T,          // Les valeurs initiales du formulaire
  rules: ValidationRules<T>, // Les règles de validation
): UseFormReturn<T> {

  // On crée l'objet réactif du formulaire (copie des valeurs initiales)
  const form = reactive<T>({ ...initialValues }) as T;

  // "touched" garde en mémoire quels champs l'utilisateur a TOUCHÉS (cliqué/modifié)
  // Utile pour n'afficher les erreurs que sur les champs déjà touchés
  const touched = reactive(
    Object.fromEntries(
      Object.keys(initialValues).map((k) => [k, false]) // Tous à false au départ
    ),
  ) as Record<keyof T, boolean>;

  // On calcule les erreurs à partir des règles
  const errors = computed(() => {
    const result: Partial<Record<keyof T, string>> = {};

    // Pour chaque champ qui a des règles...
    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = form[field as keyof T]; // La valeur actuelle du champ

      // On teste chaque règle une par une
      for (const rule of fieldRules as ValidationRule<any>[]) {
        const error = rule(value);  // On appelle la règle avec la valeur
        if (error) {
          result[field as keyof T] = error; // Si erreur, on la stocke
          break;  // On s'arrête à la PREMIÈRE erreur (pas besoin d'afficher plusieurs)
        }
      }
    }
    return result;
  });

  // Valide si aucune erreur
  const isValid = computed(() => Object.keys(errors.value).length === 0);

  // Marquer un champ comme "touché"
  function touch(field: keyof T): void {
    touched[field] = true;
  }

  // Remettre le formulaire à zéro
  function reset(): void {
    Object.assign(form, initialValues);     // Remet les valeurs initiales
    for (const key of Object.keys(touched)) {
      touched[key as keyof T] = false;       // Remet tous les "touched" à false
    }
  }

  return { form, errors, isValid, touched, touch, reset };
}
```

---

## Règles de validation réutilisables

Au lieu d'écrire les conditions à la main à chaque fois, on crée des **petites fonctions** qu'on peut réutiliser :

```ts
// utils/validators.ts

// Champ requis (ne doit pas être vide)
export const required =
  (msg = "Champ requis") =>              // On peut personnaliser le message
  (value: string): string | undefined =>  // La fonction prend une valeur string
    value.trim() ? undefined : msg;       // Si le texte n'est pas vide → OK, sinon → erreur

// Longueur minimale
export const minLength =
  (min: number, msg?: string) =>
  (value: string): string | undefined =>
    value.length >= min
      ? undefined                                     // Assez long → OK
      : (msg ?? `Minimum ${min} caractères`);         // Trop court → erreur
    // ?? signifie "si msg est null/undefined, utilise le texte par défaut"

// Email valide (utilise la regex qu'on a vue plus haut)
export const email =
  (msg = "Email invalide") =>
  (value: string): string | undefined =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : msg;

// Correspond à un motif regex personnalisé
export const pattern =
  (regex: RegExp, msg: string) =>          // On passe la regex et le message
  (value: string): string | undefined =>
    regex.test(value) ? undefined : msg;    // Si ça correspond → OK, sinon → erreur
```

### Comment lire ces fonctions ?

Ce sont des **fonctions qui retournent des fonctions** (concept appelé "currying" en programmation). Exemple décomposé :

```ts
// required("Le nom est requis") retourne cette fonction :
// (value: string) => value.trim() ? undefined : "Le nom est requis"

// Ensuite, quand le composable appelle cette fonction avec la valeur du champ :
// ("Jean") => "Jean".trim() ? undefined : "Le nom est requis"
// "Jean" n'est pas vide, donc → undefined (pas d'erreur ✅)

// ("") => "".trim() ? undefined : "Le nom est requis"
// "" est vide, donc → "Le nom est requis" (erreur ❌)
```

---

## Utilisation du composable dans un composant

Voici comment tout assembler — remarque comme le code du composant est devenu **simple et lisible** :

```vue
<script setup lang="ts">
// On importe notre composable et nos règles
import { useForm } from "@/composables/useFormValidation";
import { required, email, minLength } from "@/utils/validators";

// On crée notre formulaire en UNE seule ligne !
const { form, errors, isValid, touched, touch, reset } = useForm(
  // Les valeurs initiales
  { name: "", email: "", message: "" },
  // Les règles de validation pour chaque champ
  {
    name: [required()],                      // Le nom est requis
    email: [required(), email()],            // L'email est requis ET doit être valide
    message: [required(), minLength(10)],    // Le message est requis ET minimum 10 caractères
  },
);

function handleSubmit(): void {
  if (!isValid.value) return;
  console.log("Formulaire valide :", form);
  // Ici, on enverrait les données au serveur avec fetch()
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <label>Nom</label>
      <input v-model="form.name" @blur="touch('name')" />
      <!-- @blur = "quand l'utilisateur quitte le champ" → on le marque comme touché -->
      <span v-if="touched.name && errors.name" class="error">
        {{ errors.name }}
      </span>
    </div>

    <div>
      <label>Email</label>
      <input v-model="form.email" type="email" @blur="touch('email')" />
      <span v-if="touched.email && errors.email" class="error">
        {{ errors.email }}
      </span>
    </div>

    <div>
      <label>Message</label>
      <textarea v-model="form.message" @blur="touch('message')"></textarea>
      <span v-if="touched.message && errors.message" class="error">
        {{ errors.message }}
      </span>
    </div>

    <button type="submit" :disabled="!isValid">Envoyer</button>
    <button type="button" @click="reset">Réinitialiser</button>
  </form>
</template>
```

---

## Formulaire multi-étapes

Pour les formulaires longs, on peut les découper en **étapes** (comme un processus d'inscription en 3 pages) :

```vue
<script setup lang="ts">
import { ref } from "vue";

// L'étape actuelle (commence à 1)
const step = ref<number>(1);

// Le nombre total d'étapes
const maxSteps = 3;

// Aller à l'étape suivante (si on n'est pas déjà à la dernière)
function nextStep(): void {
  if (step.value < maxSteps) step.value++;
}

// Revenir à l'étape précédente (si on n'est pas déjà à la première)
function prevStep(): void {
  if (step.value > 1) step.value--;
}

function handleSubmit(): void {
  console.log("Formulaire complet soumis !");
}
</script>

<template>
  <form @submit.prevent="handleSubmit">

    <!-- On affiche UN SEUL bloc à la fois selon l'étape -->
    <div v-if="step === 1">
      <h3>Étape 1 : Informations personnelles</h3>
      <!-- Champs nom, prénom, date de naissance... -->
    </div>

    <div v-else-if="step === 2">
      <h3>Étape 2 : Adresse</h3>
      <!-- Champs rue, ville, code postal... -->
    </div>

    <div v-else>
      <h3>Étape 3 : Confirmation</h3>
      <!-- Résumé de tout ce qui a été saisi -->
    </div>

    <!-- Navigation entre les étapes -->
    <div class="row">
      <!-- Bouton "Précédent" (désactivé si on est à l'étape 1) -->
      <button type="button" @click="prevStep" :disabled="step === 1">
        Précédent
      </button>

      <!-- Bouton "Suivant" (visible seulement si on n'est PAS à la dernière étape) -->
      <button type="button" @click="nextStep" v-if="step < maxSteps">
        Suivant
      </button>

      <!-- Bouton "Valider" (visible seulement à la dernière étape) -->
      <!-- C'est un type="submit", donc il déclenche le @submit.prevent du form -->
      <button type="submit" v-else>
        Valider
      </button>
    </div>
  </form>
</template>
```

---

## Récapitulatif

| Concept | À quoi ça sert |
|---------|----------------|
| `@submit.prevent` | Empêcher le rechargement de page et gérer l'envoi soi-même |
| `v-model` | Lier un champ de formulaire à une variable réactive |
| `computed()` | Calculer les erreurs automatiquement quand le formulaire change |
| Validation manuelle | Vérifier les données avec des conditions `if` |
| Composable `useForm` | Réutiliser la logique de validation dans tous les formulaires |
| Règles réutilisables | `required()`, `email()`, `minLength()` — des briques de validation |
| Regex | Un motif pour vérifier le format d'un texte (email, téléphone...) |
| Formulaire multi-étapes | Découper un long formulaire en plusieurs écrans |

---

## 🎯 Pratique

### Exercice FV.1 — Validation simple

Complète ce code pour valider que le champ `email` contient un "@" :

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const email = ref('')

// Retourne un message d'erreur si l'email est invalide, sinon undefined
const emailError = computed(() => {
  // ???
})
</script>
```

<details>
<summary>Solution</summary>

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const email = ref('')

const emailError = computed(() => {
  if (!email.value) return 'Email requis'
  if (!email.value.includes('@')) return 'Email invalide'
  return undefined
})
</script>
```
</details>

---

### Exercice FV.2 — Formulaire complet

Complète ce formulaire de contact avec validation :

```vue
<script setup lang="ts">
import { reactive, computed } from 'vue'

const form = reactive({
  name: '',
  email: '',
  message: ''
})

// Crée un computed "errors" qui retourne un objet { name?, email?, message? }
// - name: requis, min 2 caractères
// - email: requis, doit contenir @
// - message: requis, min 10 caractères
const errors = computed(() => {
  // ???
})

// Le formulaire est valide si aucune erreur
const isValid = computed(() => {
  // ???
})
</script>
```

<details>
<summary>Solution</summary>

```vue
<script setup lang="ts">
import { reactive, computed } from 'vue'

const form = reactive({
  name: '',
  email: '',
  message: ''
})

const errors = computed(() => {
  const errs: { name?: string; email?: string; message?: string } = {}

  if (!form.name) errs.name = 'Nom requis'
  else if (form.name.length < 2) errs.name = 'Minimum 2 caractères'

  if (!form.email) errs.email = 'Email requis'
  else if (!form.email.includes('@')) errs.email = 'Email invalide'

  if (!form.message) errs.message = 'Message requis'
  else if (form.message.length < 10) errs.message = 'Minimum 10 caractères'

  return errs
})

const isValid = computed(() => {
  return Object.keys(errors.value).length === 0
})
</script>
```
</details>

---

### Exercice FV.3 — Règle de validation réutilisable

Crée des fonctions de validation réutilisables :

```ts
// Une règle retourne un message d'erreur ou undefined si valide
type ValidationRule = (value: string) => string | undefined

// Crée une règle "required" qui vérifie que le champ n'est pas vide
export function required(message = 'Champ requis'): ValidationRule {
  // ???
}

// Crée une règle "minLength" qui vérifie la longueur minimum
export function minLength(min: number): ValidationRule {
  // ???
}

// Crée une règle "email" qui vérifie le format email
export function email(): ValidationRule {
  // ???
}
```

<details>
<summary>Solution</summary>

```ts
type ValidationRule = (value: string) => string | undefined

export function required(message = 'Champ requis'): ValidationRule {
  return (value) => value.trim() ? undefined : message
}

export function minLength(min: number): ValidationRule {
  return (value) => value.length >= min
    ? undefined
    : `Minimum ${min} caractères`
}

export function email(): ValidationRule {
  return (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(value) ? undefined : 'Email invalide'
  }
}
```
</details>

---

### Exercice FV.4 — Afficher les erreurs

Complète le template pour afficher les erreurs sous chaque champ :

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <input v-model="form.email" placeholder="Email" />
      <!-- Affiche l'erreur email si elle existe, en rouge -->
      <!-- ??? -->
    </div>

    <!-- Bouton désactivé si le formulaire n'est pas valide -->
    <button ???>Envoyer</button>
  </form>
</template>
```

<details>
<summary>Solution</summary>

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <input v-model="form.email" placeholder="Email" />
      <p v-if="errors.email" class="error">{{ errors.email }}</p>
    </div>

    <button :disabled="!isValid">Envoyer</button>
  </form>
</template>
```
</details>

---

## Exercice

→ `exercices/08-formulaire-multi-etapes/ENONCE.md`

## Suite

→ `cours/02-intermediaire/05-slots-avances.md`
