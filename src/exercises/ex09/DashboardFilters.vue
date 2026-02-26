<script setup lang="ts">
import { ref } from "vue";
import type { Employee } from "./types";
import { employees as rawEmployees } from "./data";
// TODO: Importer useLocalStorage, useSearch, usePagination, useSort

const employees = ref<Employee[]>(rawEmployees);

// TODO: Utiliser useSearch sur employees (champs: name, department)
// TODO: Utiliser useSort sur les résultats filtrés
// TODO: Utiliser usePagination sur les résultats triés
// TODO: Utiliser useLocalStorage pour persister la query
</script>

<template>
  <div class="dashboard">
    <h2>Exercice 09 — Dashboard avec composables</h2>
    <!-- TODO: Barre de recherche -->
    <!-- TODO: Tableau avec headers cliquables pour trier -->
    <!-- TODO: Pagination (Précédent / page X sur Y / Suivant) -->
    <p>Ouvre le fichier et complète les TODO !</p>
  </div>
</template>
