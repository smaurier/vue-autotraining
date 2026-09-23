<!-- AjouterSortieForm.vue — DONNÉ, déjà correct (pas le sujet du geste). Le formulaire est
un composant "bête" : toute la logique (validation, appel réseau, état) vit dans le store
Pinia `sorties.store.ts` — c'est LUI que tu dois implémenter. Une fois le store correct, ce
composant fonctionne sans y toucher. -->
<script setup lang="ts">
import { ref } from "vue";
import { useSortiesStore, type SortiesApi } from "./sorties.store";

const props = defineProps<{ api: SortiesApi }>();
const emit = defineEmits<{ created: [] }>();

const store = useSortiesStore();
const titre = ref("");
const date = ref("");

async function onSubmit() {
  const succes = await store.ajouterSortie({ titre: titre.value, date: date.value }, props.api);
  if (succes) {
    titre.value = "";
    date.value = "";
    emit("created");
  }
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <label for="titre">Titre</label>
    <input id="titre" v-model="titre" type="text" />

    <label for="date">Date</label>
    <input id="date" v-model="date" type="date" />

    <p v-if="store.error" role="alert">{{ store.error }}</p>

    <button type="submit" :disabled="store.isLoading">
      {{ store.isLoading ? "Création..." : "Créer la sortie" }}
    </button>
  </form>

  <ul aria-label="Sorties">
    <li v-for="sortie in store.sorties" :key="sortie.id">{{ sortie.titre }}</li>
  </ul>
</template>
