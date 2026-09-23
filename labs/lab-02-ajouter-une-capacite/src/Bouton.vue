<!-- Bouton.vue — L'EXISTANT, EN PRODUCTION (module 05 Composants/Props/Emits). Consommé DÉJÀ
par plusieurs écrans TribuZen (liste des sorties, formulaire d'invitation...). Ce composant
COMPILE et MARCHE : variante visuelle, émission de `click`, tout fonctionne aujourd'hui.

TICKET : « le bouton "Envoyer l'invitation" peut être cliqué plusieurs fois pendant que la
requête est en cours — on a eu des invitations envoyées en double. Il faut un état de
chargement : bouton désactivé, indicateur visuel, ET surtout plus aucun clic ne doit partir
tant que la requête précédente n'est pas terminée. »

Le prop `loading` existe déjà dans le contrat (pour ne pas casser les appelants qui
commencent déjà à le passer) mais N'EST PAS ENCORE RESPECTÉ — c'est le bug à corriger.

Contrat à respecter (signatures inchangées, les consommateurs existants ne changent pas) :
  - prop `variant?: 'primaire' | 'secondaire'` (défaut 'primaire') — INCHANGÉ, ne pas toucher.
  - prop `loading?: boolean` (défaut false) — à FAIRE RESPECTER.
  - emit `click` — INCHANGÉ dans le cas normal, mais NE DOIT PLUS jamais partir si `loading`
    est vrai (ni sur un bouton déjà `disabled`, ce qui est déjà le cas nativement).
  - quand `loading` est vrai : le bouton est `disabled`, porte `aria-busy="true"`, ET affiche
    un indicateur visuel (un `<span class="spinner" aria-hidden="true">` avant le contenu du
    slot).

NE CASSE PAS ce qui marche déjà : le rendu de la variante (classe `btn-primaire` /
`btn-secondaire`) et l'émission de `click` en usage normal (hors `loading`) sont déjà
corrects et testés — les tests de non-régression du lab le vérifient explicitement. -->
<script setup lang="ts">
withDefaults(defineProps<{ variant?: "primaire" | "secondaire"; loading?: boolean }>(), {
  variant: "primaire",
  loading: false,
});

const emit = defineEmits<{ click: [] }>();

function onClick() {
  emit("click");
}
</script>

<template>
  <button :class="variant === 'primaire' ? 'btn-primaire' : 'btn-secondaire'" @click="onClick">
    <slot />
  </button>
</template>
