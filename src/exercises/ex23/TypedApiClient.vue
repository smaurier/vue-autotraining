<script setup lang="ts">
import { ref } from "vue";
// TODO: Importer les clients GraphQL et tRPC

const mode = ref<"graphql" | "trpc">("graphql");

// TODO: Utiliser useQuery / trpc selon le mode
</script>

<template>
  <div class="typed-api-client">
    <h2>Exercice 23 — Client API typé</h2>
    <div>
      <button @click="mode = 'graphql'" :class="{ active: mode === 'graphql' }">
        GraphQL
      </button>
      <button @click="mode = 'trpc'" :class="{ active: mode === 'trpc' }">
        tRPC
      </button>
    </div>
    <!-- TODO: Liste des posts avec auteur -->
    <!-- TODO: Formulaire pour créer un post -->
    <p>Ouvre le fichier et complète les TODO !</p>
  </div>
</template>
