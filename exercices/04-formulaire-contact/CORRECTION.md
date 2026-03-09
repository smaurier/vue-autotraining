# Correction – Exercice 04 : Formulaire de contact

## Résultat attendu

Tu dois voir :
- Un **formulaire** avec 4 champs : nom, email, sujet (liste déroulante), message (zone de texte)
- Des **messages d'erreur en rouge** sous chaque champ invalide, affichés en temps réel
- Un **bouton « Envoyer »** grisé et non cliquable tant que le formulaire est invalide
- Un **aperçu en temps réel** du message formaté sous le formulaire
- Un **compteur de caractères** sur le textarea (`12 / 500`)
- À la soumission : une **alerte de confirmation** puis le formulaire se **réinitialise**

---

## Structure des fichiers

```
04-formulaire-contact/
└── ContactForm.vue      ← composant unique (tout en un)
```

---

## Interfaces TypeScript (rappel, déjà fournies dans le starter)

```ts
// ContactForm décrit la "forme" des données du formulaire.
// Chaque champ est une chaîne de caractères (string).
interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// FormErrors décrit les erreurs associées à chaque champ.
// string | null signifie : soit un message d'erreur (string), soit pas d'erreur (null).
interface FormErrors {
  name: string | null;
  email: string | null;
  subject: string | null;
  message: string | null;
}
```

---

## Code corrigé complet — ContactForm.vue

```vue
<!-- ContactForm.vue -->
<!-- Formulaire de contact avec validation en temps réel -->

<script setup lang="ts">
// ─────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────

// ref : pour stocker des données réactives simples (objet, booléen...)
// computed : pour calculer automatiquement une valeur à partir d'autres données
import { ref, computed } from "vue";

// ─────────────────────────────────────────────
// INTERFACES TYPESCRIPT
// ─────────────────────────────────────────────

// Une interface décrit la structure d'un objet.
// TypeScript vérifiera que nos objets respectent bien cette structure.
interface ContactForm {
  name: string;    // Le nom de l'expéditeur
  email: string;   // Son adresse email
  subject: string; // Le sujet choisi dans la liste
  message: string; // Le corps du message
}

interface FormErrors {
  name: string | null;    // null = pas d'erreur ; "texte" = message d'erreur à afficher
  email: string | null;
  subject: string | null;
  message: string | null;
}

// ─────────────────────────────────────────────
// ÉTAT RÉACTIF
// ─────────────────────────────────────────────

// ref<ContactForm>({...}) crée un objet réactif contenant toutes les valeurs du formulaire.
// On groupe les champs du formulaire dans un seul objet pour mieux s'organiser.
// Chaque champ commence vide (chaîne vide "").
const form = ref<ContactForm>({
  name: "",
  email: "",
  subject: "",
  message: "",
});

// Booléen qui indique si le formulaire a été soumis au moins une fois.
// Utile pour n'afficher les erreurs qu'après la première tentative de soumission.
// (On peut aussi choisir de les afficher dès la saisie — les deux approches sont valides.)
const submitted = ref(false);

// ─────────────────────────────────────────────
// VALEURS CALCULÉES (computed)
// ─────────────────────────────────────────────

// errors : calculé automatiquement à chaque changement des champs du formulaire.
// Retourne un objet FormErrors avec null (pas d'erreur) ou un message d'erreur (string).
const errors = computed<FormErrors>(() => {
  return {
    // VALIDATION DU NOM
    // trim() enlève les espaces au début/fin du texte : "  " devient ""
    // .length donne le nombre de caractères
    name:
      form.value.name.trim().length === 0
        ? "Le nom est requis."                    // Champ vide → erreur
        : form.value.name.trim().length < 2
        ? "Le nom doit contenir au moins 2 caractères." // Trop court → erreur
        : null,                                   // null = pas d'erreur

    // VALIDATION DE L'EMAIL
    // On utilise une expression régulière (regex) pour vérifier le format basique d'un email.
    // /regex/.test("chaîne") retourne true si le format correspond, false sinon.
    // Le regex ci-dessous vérifie : "quelquechose @ quelquechose . quelquechose"
    email:
      form.value.email.trim().length === 0
        ? "L'email est requis."
        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)
        ? "L'email n'est pas valide (ex: nom@domaine.fr)."
        : null,

    // VALIDATION DU SUJET
    // Le sujet commence vide "", donc on vérifie juste qu'il a été sélectionné.
    subject:
      form.value.subject === ""
        ? "Veuillez choisir un sujet."
        : null,

    // VALIDATION DU MESSAGE
    message:
      form.value.message.trim().length === 0
        ? "Le message est requis."
        : form.value.message.trim().length < 10
        ? "Le message doit contenir au moins 10 caractères."
        : null,
  };
});

// isValid : true si TOUS les champs sont valides (toutes les erreurs sont null).
// Object.values(obj) retourne un tableau de toutes les valeurs de l'objet.
// .every(fn) retourne true si la fonction fn retourne true pour TOUS les éléments.
// Ici : toutes les erreurs sont null → formulaire valide.
const isValid = computed(() => {
  return Object.values(errors.value).every((error) => error === null);
  // Equivalent plus explicite :
  // errors.value.name === null &&
  // errors.value.email === null &&
  // errors.value.subject === null &&
  // errors.value.message === null
});

// messagePreview : aperçu formaté du message à envoyer.
// Se recalcule automatiquement à chaque frappe dans les champs.
const messagePreview = computed(() => {
  // Au moins 1 champ rempli → on affiche l'aperçu
  if (!form.value.name && !form.value.email && !form.value.message) {
    return null; // Rien à afficher si tous les champs sont vides
  }
  // Template literal (backticks `) : permet d'insérer des variables avec ${}
  return `De : ${form.value.name || "(nom non renseigné)"}
Email : ${form.value.email || "(email non renseigné)"}
Sujet : ${form.value.subject || "(sujet non choisi)"}

${form.value.message || "(message vide)"}`;
});

// characterCount : nombre de caractères dans le textarea du message.
const characterCount = computed(() => form.value.message.length);

// ─────────────────────────────────────────────
// FONCTIONS
// ─────────────────────────────────────────────

// handleSubmit() : appelée quand le formulaire est soumis.
// Le @submit.prevent dans le template empêche le rechargement de la page.
function handleSubmit() {
  submitted.value = true; // On marque le formulaire comme "soumis"

  // Sécurité : on ne fait rien si le formulaire est invalide
  // (normalement le bouton est disabled, mais c'est une bonne pratique de vérifier côté logique aussi)
  if (!isValid.value) return;

  // alert() affiche une boîte de dialogue native du navigateur avec le message.
  // Les backticks permettent un message multi-lignes avec les valeurs réelles.
  alert(
    `✅ Message envoyé !\n\nDe : ${form.value.name}\nEmail : ${form.value.email}\nSujet : ${form.value.subject}\n\n${form.value.message}`
  );

  // On réinitialise le formulaire en réaffectant les données d'origine.
  // On ne peut pas juste faire form.value = {} car TypeScript exigerait tous les champs.
  form.value = {
    name: "",
    email: "",
    subject: "",
    message: "",
  };

  // On remet submitted à false pour cacher les erreurs après reset
  submitted.value = false;
}
</script>

<template>
  <div class="contact-form">
    <h2>Formulaire de contact</h2>

    <!-- ──── FORMULAIRE ──── -->
    <!-- @submit.prevent : écoute l'événement "submit" du formulaire -->
    <!-- .prevent est un modificateur qui appelle event.preventDefault() -->
    <!-- Sans lui, la page se rechargerait à la soumission (comportement HTML par défaut) -->
    <form @submit.prevent="handleSubmit" novalidate>

      <!-- ── CHAMP NOM ── -->
      <div class="field">
        <label for="name">Nom *</label>
        <!-- v-model lie le champ à form.name en temps réel -->
        <!-- Quand on tape dans le champ, form.value.name se met à jour automatiquement -->
        <!-- Et vice versa : si on change form.value.name dans le code, le champ se met à jour -->
        <input
          id="name"
          v-model="form.name"
          type="text"
          placeholder="Votre nom complet"
        />
        <!-- On n'affiche l'erreur que si le formulaire a été soumis ou si le champ a déjà du contenu -->
        <!-- Ici on affiche dès que submitted est true OU si le champ a perdu le focus (approche simplifiée) -->
        <!-- v-if n'affiche cet élément QUE si la condition est vraie -->
        <p v-if="submitted && errors.name" class="error">{{ errors.name }}</p>
      </div>

      <!-- ── CHAMP EMAIL ── -->
      <div class="field">
        <label for="email">Email *</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          placeholder="votre@email.fr"
        />
        <p v-if="submitted && errors.email" class="error">{{ errors.email }}</p>
      </div>

      <!-- ── CHAMP SUJET (SELECT) ── -->
      <div class="field">
        <label for="subject">Sujet *</label>
        <!-- v-model fonctionne aussi sur <select> : lie la valeur de l'option sélectionnée -->
        <!-- La première option a value="" ce qui correspond à la valeur initiale de form.subject -->
        <select id="subject" v-model="form.subject">
          <option value="">-- Choisissez un sujet --</option>
          <option value="question">Question générale</option>
          <option value="support">Support technique</option>
          <option value="partenariat">Proposition de partenariat</option>
        </select>
        <p v-if="submitted && errors.subject" class="error">{{ errors.subject }}</p>
      </div>

      <!-- ── CHAMP MESSAGE (TEXTAREA) ── -->
      <div class="field">
        <label for="message">
          Message *
          <!-- Compteur de caractères affiché dans le label -->
          <!-- {{ }} = interpolation : affiche la valeur de la variable -->
          <span class="char-count">{{ characterCount }} / 500</span>
        </label>
        <!-- v-model fonctionne aussi sur <textarea> -->
        <!-- maxlength limite la saisie à 500 caractères côté HTML -->
        <textarea
          id="message"
          v-model="form.message"
          placeholder="Écrivez votre message ici..."
          rows="5"
          maxlength="500"
        ></textarea>
        <p v-if="submitted && errors.message" class="error">{{ errors.message }}</p>
      </div>

      <!-- ── BOUTON SOUMISSION ── -->
      <!-- :disabled="!isValid" lie dynamiquement l'attribut disabled au résultat du computed isValid -->
      <!-- Si isValid vaut false, l'attribut disabled est ajouté → bouton grisé et non cliquable -->
      <!-- Si isValid vaut true, l'attribut disabled est retiré → bouton actif -->
      <button type="submit" :disabled="!isValid" class="submit-btn">
        Envoyer le message
      </button>

      <!-- Message d'aide quand le formulaire n'est pas encore valide -->
      <p v-if="!isValid" class="hint">
        * Remplissez tous les champs pour activer l'envoi.
      </p>

    </form>

    <!-- ──── APERÇU EN TEMPS RÉEL ──── -->
    <!-- v-if n'affiche ce bloc QUE si messagePreview n'est pas null -->
    <div v-if="messagePreview" class="preview">
      <h3>Aperçu de votre message</h3>
      <!-- <pre> : balise "preformatted" qui respecte les sauts de ligne et espaces -->
      <!-- Essentiel ici car notre computed messagePreview contient des \n (sauts de ligne) -->
      <pre>{{ messagePreview }}</pre>
    </div>

  </div>
</template>

<style scoped>
/* scoped = les styles ne s'appliquent qu'à ce composant, pas aux autres */
.contact-form {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1.5rem;
  font-family: sans-serif;
}

.field {
  display: flex;
  flex-direction: column; /* Empile label, input, erreur verticalement */
  gap: 0.3rem;
  margin-bottom: 1rem;
}

label {
  font-weight: bold;
  display: flex;
  justify-content: space-between; /* Place le compteur à droite du label */
  align-items: center;
}

.char-count {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: normal;
}

input,
select,
textarea {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit; /* textarea n'hérite pas de la police par défaut */
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #3b82f6; /* Bordure bleue au focus */
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* Classe .error pour les messages d'erreur */
.error {
  color: #ef4444; /* Rouge */
  font-size: 0.85rem;
  margin: 0;
}

.submit-btn {
  width: 100%;
  padding: 0.75rem;
  background: #3b82f6; /* Bleu */
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #2563eb; /* Bleu plus foncé au survol */
}

/* Quand :disabled est actif, on grise le bouton */
.submit-btn:disabled {
  background: #9ca3af; /* Gris */
  cursor: not-allowed; /* Curseur "interdit" */
}

.hint {
  margin-top: 0.5rem;
  color: #6b7280;
  font-size: 0.85rem;
  text-align: center;
}

/* Bloc d'aperçu */
.preview {
  margin-top: 2rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.preview h3 {
  margin: 0 0 0.75rem 0;
  color: #1f2937;
}

/* <pre> conserve les sauts de ligne mais on corrige la police */
pre {
  font-family: sans-serif;
  white-space: pre-wrap; /* Autorise le retour à la ligne automatique */
  margin: 0;
  color: #374151;
}
</style>
```

---

## Ce que tu aurais pu oublier

### 1. Oublier `.prevent` sur `@submit`
```html
<!-- ❌ FAUX : la page se recharge entièrement à la soumission -->
<form @submit="handleSubmit">

<!-- ✅ CORRECT : preventDefault() est appelé automatiquement -->
<form @submit.prevent="handleSubmit">
```
> Sans `.prevent`, le navigateur effectue sa soumission de formulaire HTML par défaut : il recharge la page et envoie les données dans l'URL. Avec SPA Vue, on veut gérer ça nous-mêmes en JavaScript.

---

### 2. Confondre `v-model` et `:value`
```html
<!-- ❌ FAUX : :value est unidirectionnel (JS → DOM uniquement) -->
<!-- Taper dans le champ NE MET PAS à jour la variable -->
<input :value="form.name" />

<!-- ✅ CORRECT : v-model est bidirectionnel (JS ↔ DOM) -->
<!-- Taper dans le champ met form.name à jour, et modifier form.name met le champ à jour -->
<input v-model="form.name" />
```
> `v-model` est un raccourci pour `:value="form.name" @input="form.name = $event.target.value"`. C'est la liaison bidirectionnelle.

---

### 3. Ne pas utiliser `computed` pour la validation
```ts
// ❌ FAUX : la validation n'est recalculée que quand on appelle la fonction
function getErrors() {
  return { name: form.value.name ? null : "Requis", ... }
}
// Dans le template : v-if="getErrors().name" → recalculé à CHAQUE re-render

// ✅ CORRECT : computed ne se recalcule que quand form change
const errors = computed(() => ({
  name: form.value.name.trim().length < 2 ? "..." : null,
  // ...
}));
```

---

### 4. Désactiver le bouton avec CSS au lieu de `:disabled`
```html
<!-- ❌ FAUX : aspect visuel seulement, le bouton reste cliquable ! -->
<button :class="{ 'disabled-style': !isValid }">Envoyer</button>

<!-- ✅ CORRECT : l'attribut HTML disabled empêche vraiment le clic + submit -->
<button :disabled="!isValid">Envoyer</button>
```

---

### 5. Oublier de vérifier le format de l'email
```ts
// ❌ FAUX : vérifie juste que l'email n'est pas vide
email: form.value.email.length === 0 ? "Requis" : null

// ✅ CORRECT : vérifie aussi le format avec une regex
email:
  form.value.email.length === 0
    ? "L'email est requis."
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)
    ? "L'email n'est pas valide."
    : null
```
> La regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` vérifie la structure de base : `truc@domaine.ext`. Ce n'est pas parfait (il existe des emails valides très complexes) mais c'est suffisant pour un exercice de débutant.

---

## Concepts clés utilisés

| Concept | Ce que ça fait |
|---|---|
| `ref<ContactForm>({})` | Objet réactif groupant tous les champs du formulaire |
| `computed<FormErrors>()` | Erreurs recalculées automatiquement à chaque frappe |
| `Object.values(obj).every()` | Vérifie que toutes les erreurs sont `null` |
| `v-model` | Liaison bidirectionnelle sur `input`, `select`, `textarea` |
| `@submit.prevent` | Écoute la soumission et bloque le rechargement de la page |
| `:disabled="!isValid"` | Désactive le bouton tant que le formulaire est invalide |
| `v-if="condition"` | Affiche le message d'erreur seulement si l'erreur existe |
| `string \| null` | Type union : soit un message d'erreur, soit rien |
| `string.trim()` | Enlève les espaces au début et à la fin |
| `/regex/.test(str)` | Teste si une chaîne correspond à un format (email ici) |
| `` `template ${literal}` `` | Construit une chaîne avec des variables insérées |
| `<pre>` | Balise HTML qui respecte les sauts de ligne (`\n`) |
