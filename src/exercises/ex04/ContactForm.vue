<script setup lang="ts">
import { ref, computed } from "vue";

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name: string | null;
  email: string | null;
  subject: string | null;
  message: string | null;
}

// TODO: ref form: Ref<ContactForm>
// TODO: computed errors: ComputedRef<FormErrors>
// TODO: computed isValid: ComputedRef<boolean>

// TODO: function handleSubmit()
</script>

<template>
  <div class="contact-form">
    <h2>Exercice 04 — Formulaire de contact</h2>
    <!-- TODO: Champs avec v-model et messages d'erreur -->
    <!-- TODO: Aperçu temps réel -->
    <!-- TODO: Bouton submit (disabled si invalide) -->
    <p>Ouvre le fichier et complète les TODO !</p>
  </div>
</template>
