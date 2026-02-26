<script setup lang="ts">
import { ref } from "vue";
// TODO: Importer AppButton, AppInput, AppBadge, AppModal, AppAlert

const modalOpen = ref(false);
const inputValue = ref("");
const showAlert = ref(true);
</script>

<template>
  <div class="ui-showcase">
    <h2>Exercice 21 — UI Kit</h2>

    <!-- TODO: Section Boutons — toutes variantes × toutes tailles -->
    <section>
      <h3>Boutons</h3>
      <p>TODO: Afficher tous les boutons</p>
    </section>

    <!-- TODO: Section Inputs -->
    <section>
      <h3>Inputs</h3>
      <p>TODO: Afficher les inputs (text, email, password, avec erreur)</p>
    </section>

    <!-- TODO: Section Badges -->
    <section>
      <h3>Badges</h3>
      <p>TODO: Afficher les 4 badges</p>
    </section>

    <!-- TODO: Section Modal -->
    <section>
      <h3>Modal</h3>
      <button @click="modalOpen = true">Ouvrir la modale</button>
      <p>TODO: AppModal</p>
    </section>

    <!-- TODO: Section Alerts -->
    <section>
      <h3>Alertes</h3>
      <p>TODO: Afficher les 4 types d'alertes</p>
    </section>
  </div>
</template>
