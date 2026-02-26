<script setup lang="ts">
import { ref } from "vue";
// TODO: Importer useAnnouncer

const name = ref("");
const email = ref("");
const errors = ref<Record<string, string>>({});
const submitted = ref(false);

// TODO: useAnnouncer pour les annonces dynamiques

function validate(): boolean {
  errors.value = {};
  if (!name.value) errors.value.name = "Le nom est requis";
  if (!email.value) errors.value.email = "L'email est requis";
  else if (!email.value.includes("@"))
    errors.value.email = "Format d'email invalide";
  return Object.keys(errors.value).length === 0;
}

function submit(): void {
  if (validate()) {
    submitted.value = true;
    // TODO: announce('Formulaire envoyé avec succès', 'polite')
  } else {
    // TODO: announce('Erreurs dans le formulaire', 'assertive')
  }
}
</script>

<template>
  <div class="accessible-form">
    <h3>Formulaire ACCESSIBLE (corrigé)</h3>
    <!-- TODO: Skip link -->
    <form @submit.prevent="submit" novalidate>
      <div>
        <label for="a11y-name">Nom <span aria-hidden="true">*</span></label>
        <input
          id="a11y-name"
          v-model="name"
          type="text"
          required
          :aria-describedby="errors.name ? 'name-error' : undefined"
          :aria-invalid="!!errors.name"
        />
        <span v-if="errors.name" id="name-error" role="alert">{{
          errors.name
        }}</span>
      </div>
      <div>
        <label for="a11y-email">Email <span aria-hidden="true">*</span></label>
        <input
          id="a11y-email"
          v-model="email"
          type="email"
          required
          :aria-describedby="errors.email ? 'email-error' : undefined"
          :aria-invalid="!!errors.email"
        />
        <span v-if="errors.email" id="email-error" role="alert">{{
          errors.email
        }}</span>
      </div>
      <button type="submit">Envoyer</button>
    </form>
    <!-- TODO: aria-live region pour annonces -->
    <div v-if="submitted" role="status" aria-live="polite">
      Formulaire envoyé avec succès !
    </div>
  </div>
</template>
