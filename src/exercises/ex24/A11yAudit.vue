<script setup lang="ts">
import { ref } from "vue";
import type { WcagCheck } from "./types";
// TODO: Importer BrokenForm et AccessibleForm

// TODO: Checklist WCAG interactive
const checks = ref<WcagCheck[]>([
  {
    id: "labels",
    label: "Labels associés",
    description: 'Chaque input a un <label for="...">',
    passed: false,
  },
  {
    id: "aria-describedby",
    label: "aria-describedby",
    description: "Erreurs liées via aria-describedby",
    passed: false,
  },
  {
    id: "aria-live",
    label: "aria-live",
    description: "Annonces dynamiques pour lecteurs d'écran",
    passed: false,
  },
  {
    id: "focus",
    label: "Focus visible",
    description: "Outline visible au focus clavier",
    passed: false,
  },
  {
    id: "contrast",
    label: "Contrastes",
    description: "Ratio de contraste WCAG AA (4.5:1)",
    passed: false,
  },
  {
    id: "keyboard",
    label: "Navigation clavier",
    description: "Tab, Enter, Escape fonctionnent",
    passed: false,
  },
  {
    id: "semantic",
    label: "HTML sémantique",
    description: "Utilisation de <form>, <button>, rôles",
    passed: false,
  },
]);
</script>

<template>
  <div class="a11y-audit">
    <h2>Exercice 24 — Audit accessibilité</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem">
      <!-- TODO: BrokenForm à gauche -->
      <!-- TODO: AccessibleForm à droite -->
    </div>
    <!-- TODO: Checklist WCAG interactive -->
    <section>
      <h3>Checklist WCAG</h3>
      <ul>
        <li v-for="check in checks" :key="check.id">
          <label>
            <input type="checkbox" v-model="check.passed" />
            <strong>{{ check.label }}</strong> — {{ check.description }}
          </label>
        </li>
      </ul>
    </section>
  </div>
</template>
