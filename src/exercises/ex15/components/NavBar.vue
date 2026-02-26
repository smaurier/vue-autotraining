<script setup lang="ts">
// TODO: Afficher les liens de navigation
// TODO: Indiquer la route active
defineProps<{ currentRoute: string; isAuthenticated: boolean }>();
defineEmits<{ navigate: [path: string]; toggleAuth: [] }>();
</script>

<template>
  <nav class="nav-bar">
    <!-- TODO: Liens Home, Users, Settings (si auth) -->
    <!-- TODO: Bouton Login/Logout -->
    <p>TODO: Navbar</p>
  </nav>
</template>
