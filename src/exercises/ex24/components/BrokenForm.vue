<script setup lang="ts">
import { ref } from "vue";

const name = ref("");
const email = ref("");
const errors = ref<string[]>([]);

function submit(): void {
  errors.value = [];
  if (!name.value) errors.value.push("Nom requis");
  if (!email.value) errors.value.push("Email requis");
}
</script>

<template>
  <div class="broken-form">
    <h3>Formulaire INACCESSIBLE (à corriger)</h3>
    <!-- VOLONTAIREMENT CASSÉ: pas de labels, pas d'aria, pas de focus visible -->
    <div style="color: #ccc; background: #eee">
      <input v-model="name" placeholder="nom" style="outline: none" />
      <input v-model="email" placeholder="email" style="outline: none" />
      <div
        @click="submit"
        style="cursor: pointer; background: #999; color: #aaa; padding: 5px"
      >
        Envoyer
      </div>
      <div v-for="err in errors" style="color: orange; font-size: 10px">
        {{ err }}
      </div>
    </div>
  </div>
</template>
