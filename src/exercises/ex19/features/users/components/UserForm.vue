<script setup lang="ts">
import type { CreateUserInput } from "../types";

// TODO: defineProps pour mode edit (user initial optionnel)
// TODO: defineEmits pour submit
defineEmits<{ submit: [data: CreateUserInput] }>();
</script>

<template>
  <div class="user-form">
    <!-- TODO: Formulaire nom, email, role -->
    <p>TODO: Formulaire utilisateur</p>
  </div>
</template>
