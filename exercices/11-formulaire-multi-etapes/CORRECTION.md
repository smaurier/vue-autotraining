# Correction – Exercice 11 : Formulaire multi-étapes

## Concepts clés
- Étape courante gérée par un `ref<number>` (index)
- Validation par étape avant d'avancer
- `computed()` pour la progression et les données de l'étape courante
- Les données du formulaire sont un seul objet `reactive()`

---

## Composant complet — `MultiStepForm.vue`

```vue
<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

// ─── DÉFINITION DES ÉTAPES ───────────────────────────────────────
// Centraliser la config des étapes facilite l'ajout/suppression d'étapes
const steps = [
  { id: 1, label: 'Informations personnelles', icon: '👤' },
  { id: 2, label: 'Adresse',                   icon: '🏠' },
  { id: 3, label: 'Confirmation',               icon: '✅' },
]

// ─── ÉTAPE COURANTE ──────────────────────────────────────────────
// On utilise un index (0-based) pour simplifier les calculs
const currentStep = ref(0)

// ─── DONNÉES DU FORMULAIRE ───────────────────────────────────────
// reactive() regroupe toutes les données en un seul objet.
// Avantage : on peut facilement sérialiser ou réinitialiser.
const formData = reactive({
  // Étape 1
  firstName: '',
  lastName: '',
  email: '',
  // Étape 2
  street: '',
  city: '',
  zip: '',
})

// ─── ERREURS DE VALIDATION ───────────────────────────────────────
// Un objet dont les clés correspondent aux champs du formulaire
const errors = reactive<Record<string, string>>({})

// ─── ÉTAT FINAL ──────────────────────────────────────────────────
const submitted = ref(false)

// ─── COMPUTED ────────────────────────────────────────────────────

/** Pourcentage de progression pour la barre (0 à 100) */
const progressPercent = computed(() => {
  // On utilise currentStep + 1 pour que l'étape 1 ne soit pas à 0%
  return Math.round(((currentStep.value + 1) / steps.length) * 100)
})

/** L'étape courante est-elle la première ? */
const isFirstStep = computed(() => currentStep.value === 0)

/** L'étape courante est-elle la dernière (confirmation) ? */
const isLastStep = computed(() => currentStep.value === steps.length - 1)

// ─── VALIDATION ──────────────────────────────────────────────────

/**
 * Valide les champs de l'étape donnée.
 * Retourne true si tout est valide, false sinon.
 * Remplit l'objet errors avec les messages pour l'utilisateur.
 */
function validateStep(stepIndex: number): boolean {
  // On efface les erreurs précédentes avant de revalider
  Object.keys(errors).forEach((key) => delete errors[key])

  if (stepIndex === 0) {
    // Étape 1 : informations personnelles
    if (!formData.firstName.trim()) errors.firstName = 'Le prénom est requis.'
    if (!formData.lastName.trim())  errors.lastName = 'Le nom est requis.'
    if (!formData.email.trim()) {
      errors.email = 'L\'email est requis.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      // Regex minimaliste pour vérifier le format email
      errors.email = 'Format email invalide.'
    }
  }

  if (stepIndex === 1) {
    // Étape 2 : adresse
    if (!formData.street.trim()) errors.street = 'La rue est requise.'
    if (!formData.city.trim())   errors.city = 'La ville est requise.'
    if (!formData.zip.trim()) {
      errors.zip = 'Le code postal est requis.'
    } else if (!/^\d{5}$/.test(formData.zip)) {
      errors.zip = 'Le code postal doit contenir 5 chiffres.'
    }
  }

  // L'objet errors est vide → pas d'erreurs → valide !
  return Object.keys(errors).length === 0
}

// ─── NAVIGATION ──────────────────────────────────────────────────

function nextStep() {
  // On valide AVANT d'avancer — l'utilisateur ne peut pas passer à l'étape suivante avec des erreurs
  if (!validateStep(currentStep.value)) return
  if (!isLastStep.value) currentStep.value++
}

function prevStep() {
  // Retour en arrière : pas de validation nécessaire
  if (!isFirstStep.value) currentStep.value--
}

// ─── SOUMISSION ───────────────────────────────────────────────────

function handleSubmit() {
  // L'étape de confirmation (index 2) n'a pas de champs à valider
  // mais on pourrait ajouter une validation ici si besoin
  console.log('Formulaire soumis :', { ...formData })
  submitted.value = true
}

function resetForm() {
  // On remet tout à zéro
  currentStep.value = 0
  submitted.value = false
  Object.assign(formData, {
    firstName: '', lastName: '', email: '',
    street: '', city: '', zip: '',
  })
}
</script>

<template>
  <div class="multistep-form">

    <!-- ── Écran de succès ─────────────────────────────────────── -->
    <div v-if="submitted" class="success-screen">
      <div class="success-icon">🎉</div>
      <h2>Formulaire soumis avec succès !</h2>
      <div class="summary">
        <p><strong>{{ formData.firstName }} {{ formData.lastName }}</strong></p>
        <p>{{ formData.email }}</p>
        <p>{{ formData.street }}, {{ formData.zip }} {{ formData.city }}</p>
      </div>
      <button @click="resetForm" class="btn btn-primary">Recommencer</button>
    </div>

    <!-- ── Formulaire principal ────────────────────────────────── -->
    <template v-else>

      <!-- Indicateur d'étapes -->
      <div class="steps-indicator">
        <div
          v-for="(step, index) in steps"
          :key="step.id"
          class="step-item"
          :class="{
            'step-item--active':    index === currentStep,
            'step-item--completed': index < currentStep,
          }"
        >
          <div class="step-circle">
            <!-- Coche si étape passée, numéro sinon -->
            <span v-if="index < currentStep">✓</span>
            <span v-else>{{ step.icon }}</span>
          </div>
          <span class="step-label">{{ step.label }}</span>
        </div>
      </div>

      <!-- Barre de progression -->
      <div class="progress-bar-track">
        <div
          class="progress-bar-fill"
          :style="{ width: progressPercent + '%' }"
        />
      </div>
      <p class="progress-text">Étape {{ currentStep + 1 }} / {{ steps.length }}</p>

      <!-- ── ÉTAPE 1 : Informations personnelles ─────────────── -->
      <div v-if="currentStep === 0" class="step-content">
        <h2>Informations personnelles</h2>

        <div class="form-group">
          <label>Prénom</label>
          <input v-model="formData.firstName" type="text" placeholder="Jean" />
          <!-- v-if sur le message d'erreur : n'apparaît que si le champ a une erreur -->
          <p v-if="errors.firstName" class="error-msg">{{ errors.firstName }}</p>
        </div>

        <div class="form-group">
          <label>Nom</label>
          <input v-model="formData.lastName" type="text" placeholder="Dupont" />
          <p v-if="errors.lastName" class="error-msg">{{ errors.lastName }}</p>
        </div>

        <div class="form-group">
          <label>Email</label>
          <input v-model="formData.email" type="email" placeholder="jean@exemple.fr" />
          <p v-if="errors.email" class="error-msg">{{ errors.email }}</p>
        </div>
      </div>

      <!-- ── ÉTAPE 2 : Adresse ───────────────────────────────── -->
      <div v-else-if="currentStep === 1" class="step-content">
        <h2>Adresse</h2>

        <div class="form-group">
          <label>Rue</label>
          <input v-model="formData.street" type="text" placeholder="12 rue de la Paix" />
          <p v-if="errors.street" class="error-msg">{{ errors.street }}</p>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Code postal</label>
            <input v-model="formData.zip" type="text" placeholder="75001" maxlength="5" />
            <p v-if="errors.zip" class="error-msg">{{ errors.zip }}</p>
          </div>
          <div class="form-group">
            <label>Ville</label>
            <input v-model="formData.city" type="text" placeholder="Paris" />
            <p v-if="errors.city" class="error-msg">{{ errors.city }}</p>
          </div>
        </div>
      </div>

      <!-- ── ÉTAPE 3 : Confirmation ──────────────────────────── -->
      <div v-else-if="currentStep === 2" class="step-content">
        <h2>Confirmation</h2>
        <p class="confirm-intro">Vérifiez vos informations avant de soumettre.</p>

        <!-- Récapitulatif en lecture seule -->
        <div class="review-section">
          <h3>Informations personnelles</h3>
          <dl>
            <dt>Prénom</dt><dd>{{ formData.firstName }}</dd>
            <dt>Nom</dt><dd>{{ formData.lastName }}</dd>
            <dt>Email</dt><dd>{{ formData.email }}</dd>
          </dl>
        </div>

        <div class="review-section">
          <h3>Adresse</h3>
          <dl>
            <dt>Rue</dt><dd>{{ formData.street }}</dd>
            <dt>Code postal</dt><dd>{{ formData.zip }}</dd>
            <dt>Ville</dt><dd>{{ formData.city }}</dd>
          </dl>
        </div>
      </div>

      <!-- ── Navigation ─────────────────────────────────────── -->
      <div class="navigation">
        <button
          @click="prevStep"
          :disabled="isFirstStep"
          class="btn btn-secondary"
        >
          ← Précédent
        </button>

        <button
          v-if="!isLastStep"
          @click="nextStep"
          class="btn btn-primary"
        >
          Suivant →
        </button>

        <!-- Le bouton "Soumettre" ne s'affiche qu'à la dernière étape -->
        <button
          v-else
          @click="handleSubmit"
          class="btn btn-success"
        >
          ✅ Soumettre
        </button>
      </div>

    </template>
  </div>
</template>

<style scoped>
.multistep-form {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  font-family: system-ui, sans-serif;
}

/* ── Indicateur d'étapes ── */
.steps-indicator {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}
.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  opacity: 0.4;
  transition: opacity 0.3s;
}
.step-item--active, .step-item--completed { opacity: 1; }
.step-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}
.step-item--active    .step-circle { background: #3b82f6; color: white; }
.step-item--completed .step-circle { background: #10b981; color: white; }
.step-label { font-size: 0.7rem; text-align: center; }

/* ── Barre de progression ── */
.progress-bar-track {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}
.progress-bar-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.4s ease; /* animation fluide lors du changement d'étape */
  border-radius: 3px;
}
.progress-text { font-size: 0.8rem; color: #6b7280; margin-bottom: 1.5rem; }

/* ── Formulaire ── */
.step-content h2 { margin-bottom: 1.5rem; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem; }
.form-group input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-sizing: border-box;
  font-size: 1rem;
}
.form-group input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.2); }
.form-row { display: grid; grid-template-columns: 1fr 2fr; gap: 1rem; }
.error-msg { color: #dc2626; font-size: 0.8rem; margin-top: 0.25rem; }

/* ── Confirmation ── */
.review-section { background: #f9fafb; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
.review-section h3 { font-size: 0.9rem; color: #6b7280; margin-bottom: 0.5rem; }
dl { display: grid; grid-template-columns: 1fr 2fr; gap: 0.25rem 0.5rem; }
dt { font-weight: 600; font-size: 0.85rem; }
dd { margin: 0; font-size: 0.85rem; }

/* ── Navigation ── */
.navigation { display: flex; justify-content: space-between; margin-top: 2rem; }
.btn { padding: 0.6rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-size: 0.95rem; font-weight: 500; }
.btn-primary  { background: #3b82f6; color: white; }
.btn-secondary { background: #e5e7eb; color: #374151; }
.btn-success  { background: #10b981; color: white; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Succès ── */
.success-screen { text-align: center; padding: 2rem; }
.success-icon { font-size: 4rem; margin-bottom: 1rem; }
.summary { background: #f9fafb; border-radius: 8px; padding: 1rem; margin: 1.5rem 0; text-align: left; }
</style>
```

---

## Schéma du flux de validation

```
[Étape 1] →(nextStep)→ validateStep(0)
                          ├── OK  → currentStep++ → [Étape 2]
                          └── KO  → affiche errors, reste sur [Étape 1]

[Étape 2] →(nextStep)→ validateStep(1)
                          ├── OK  → currentStep++ → [Étape 3]
                          └── KO  → affiche errors, reste sur [Étape 2]

[Étape 3] →(handleSubmit)→ submitted = true → [Écran succès]
```
