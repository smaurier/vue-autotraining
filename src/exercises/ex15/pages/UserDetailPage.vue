<script setup lang="ts">
// TODO: Recevoir l'id depuis les params du router
// TODO: Afficher le détail de l'utilisateur
defineProps<{ userId?: string }>();
</script>

<template>
  <div class="user-detail-page">
    <h3>Détail utilisateur</h3>
    <p>TODO: Détail de l'utilisateur {{ userId }}</p>
  </div>
</template>
