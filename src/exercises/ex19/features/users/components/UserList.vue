<script setup lang="ts">
import type { User } from "../types";

defineProps<{ users: User[]; loading: boolean }>();
defineEmits<{ delete: [id: number]; edit: [user: User] }>();
</script>

<template>
  <div class="user-list">
    <!-- TODO: Afficher la liste des utilisateurs -->
    <!-- TODO: Boutons éditer / supprimer -->
    <p>TODO: Liste des utilisateurs</p>
  </div>
</template>
