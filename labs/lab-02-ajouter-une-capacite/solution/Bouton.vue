<!-- Bouton.vue — SOLUTION DE RÉFÉRENCE (commentée). Ne l'ouvre pas avant ton GREEN. -->
<script setup lang="ts">
const props = withDefaults(defineProps<{ variant?: "primaire" | "secondaire"; loading?: boolean }>(), {
  variant: "primaire",
  loading: false,
});

const emit = defineEmits<{ click: [] }>();

function onClick() {
  // Le garde-fou du ticket : aucun clic ne part tant qu'une requête est en cours — évite
  // les invitations envoyées en double sur un double-clic pendant le chargement.
  if (props.loading) return;
  emit("click");
}
</script>

<template>
  <button
    :class="variant === 'primaire' ? 'btn-primaire' : 'btn-secondaire'"
    :disabled="loading"
    :aria-busy="loading"
    @click="onClick"
  >
    <span v-if="loading" class="spinner" aria-hidden="true"></span>
    <slot />
  </button>
</template>
