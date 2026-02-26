<script setup lang="ts">
import { ref, computed } from "vue";
import type { WizardData, StepKey } from "./types";
// TODO: Importer les composants de step

// TODO: ref currentStep
// TODO: ref formData: Ref<WizardData>
// TODO: computed isCurrentStepValid
// TODO: computed progress (pourcentage)

// TODO: functions nextStep, prevStep, handleSubmit
</script>

<template>
  <div class="multi-step-form">
    <h2>Exercice 11 — Formulaire multi-étapes</h2>
    <!-- TODO: Barre de progression -->
    <!-- TODO: Afficher le step courant avec component :is ou v-if -->
    <!-- TODO: Boutons Précédent / Suivant / Confirmer -->
    <p>Ouvre le fichier et complète les TODO !</p>
  </div>
</template>
