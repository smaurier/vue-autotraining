<script setup lang="ts">
import { ref, computed } from "vue";
import { validateEmail, validatePassword } from "./utils/validators";
import type { LoginCredentials } from "./types";

const email = ref("");
const password = ref("");
const loading = ref(false);

const emailError = computed((): string | null => validateEmail(email.value));
const passwordError = computed((): string | null =>
  validatePassword(password.value),
);
const isValid = computed(
  (): boolean => !emailError.value && !passwordError.value,
);

const emit = defineEmits<{
  login: [credentials: LoginCredentials];
  error: [message: string];
}>();

// TODO: function handleSubmit
// - Si isValid: émettre 'login' avec { email, password }
// - Sinon: émettre 'error' avec le premier message d'erreur
// - Gérer l'état loading
async function handleSubmit(): Promise<void> {
  // TODO
}
</script>

<template>
  <div class="login-form">
    <h2>Exercice 17 — Tests complets</h2>
    <form @submit.prevent="handleSubmit">
      <div>
        <label for="email">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          placeholder="email@exemple.com"
        />
        <span v-if="emailError" class="error">{{ emailError }}</span>
      </div>
      <div>
        <label for="password">Mot de passe</label>
        <input
          id="password"
          v-model="password"
          type="password"
          placeholder="••••••"
        />
        <span v-if="passwordError" class="error">{{ passwordError }}</span>
      </div>
      <button type="submit" :disabled="!isValid || loading">
        <span v-if="loading">Chargement...</span>
        <span v-else>Se connecter</span>
      </button>
    </form>
  </div>
</template>
