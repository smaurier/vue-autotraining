<script setup lang="ts">
import { provide } from "vue";
import { HTTP_SERVICE_KEY } from "./types";
import { MockHttpService } from "./services/HttpService";
// TODO: Importer les composants du module users
// TODO: Importer useEventBus

// Fournir le service HTTP
provide(HTTP_SERVICE_KEY, new MockHttpService());

// TODO: Utiliser useUsers
// TODO: Utiliser useEventBus
</script>

<template>
  <div class="architecture-demo">
    <h2>Exercice 19 — Architecture & Patterns</h2>
    <!-- TODO: UserForm + UserList assemblés -->
    <!-- TODO: Zone de log des événements (event bus) -->
    <p>Ouvre le fichier et complète les TODO !</p>
  </div>
</template>
