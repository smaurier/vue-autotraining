<script setup lang="ts">
import { ref, watch, watchEffect, onMounted, onUnmounted } from "vue";
import type { Lap } from "./types";

// TODO: ref elapsed (millisecondes)
// TODO: ref isRunning
// TODO: ref laps: Ref<Lap[]>
// TODO: ref color (vert/orange/rouge)
// TODO: let intervalId: number | null

// TODO: computed formattedTime → "MM:SS:ms"

// TODO: watch elapsed → changer color
// TODO: watchEffect → log en console

// TODO: fonctions start(), pause(), reset(), addLap()

// TODO: onMounted / onUnmounted pour cleanup
</script>

<template>
  <div class="stopwatch">
    <h2>Exercice 06 — Chronomètre</h2>
    <!-- TODO: Afficher temps formaté avec couleur -->
    <!-- TODO: Boutons Démarrer/Pause/Reset/Tour -->
    <!-- TODO: Liste des tours -->
    <p>Ouvre le fichier et complète les TODO !</p>
  </div>
</template>
