<script setup lang="ts">
import { ref } from "vue";
import type { Article } from "./types";
// TODO: Importer les pages

const currentPage = ref<"index" | "article">("index");
const selectedSlug = ref("");

// TODO: Données articles mock
const articles: Article[] = [
  {
    slug: "vue3-composition-api",
    title: "Maîtriser la Composition API",
    content: "La Composition API de Vue 3 permet...",
    date: "2024-01-15",
    author: "Alice Martin",
  },
  {
    slug: "typescript-vue",
    title: "TypeScript et Vue 3",
    content: "TypeScript apporte la sécurité des types...",
    date: "2024-02-01",
    author: "Bob Dupont",
  },
  {
    slug: "pinia-state",
    title: "Gestion d'état avec Pinia",
    content: "Pinia est le gestionnaire d'état...",
    date: "2024-02-15",
    author: "Claire Leroy",
  },
];

function navigateTo(slug: string): void {
  selectedSlug.value = slug;
  currentPage.value = "article";
}

function goBack(): void {
  currentPage.value = "index";
}
</script>

<template>
  <div class="nuxt-patterns">
    <h2>Exercice 20 — Patterns Nuxt (simulés)</h2>
    <button v-if="currentPage === 'article'" @click="goBack">← Retour</button>
    <!-- TODO: Afficher BlogIndex ou BlogArticle selon currentPage -->
    <p>Ouvre le fichier et complète les TODO !</p>
  </div>
</template>
