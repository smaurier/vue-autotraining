<script setup lang="ts">
import { computed, ref } from "vue";
import type { Component } from "vue";

// 00-TypeScript
import TypeScriptLabo from "./exercises/ex01/TypeScriptLabo.vue";
// 01-Débutant
import CounterReactive from "./exercises/ex02/CounterReactive.vue";
import TodoList from "./exercises/ex03/TodoList.vue";
import ContactForm from "./exercises/ex04/ContactForm.vue";
import ProductCatalog from "./exercises/ex05/ProductCatalog.vue";
import StopWatch from "./exercises/ex06/StopWatch.vue";
import OptionsVsComposition from "./exercises/ex07/OptionsVsComposition.vue";
// 02-Intermédiaire
import ThemeInjection from "./exercises/ex08/ThemeInjection.vue";
import DashboardFilters from "./exercises/ex09/DashboardFilters.vue";
import CrudApi from "./exercises/ex10/CrudApi.vue";
import MultiStepForm from "./exercises/ex11/MultiStepForm.vue";
import ProfileCards from "./exercises/ex12/ProfileCards.vue";
import ReusableTable from "./exercises/ex13/ReusableTable.vue";
import AnimatedGallery from "./exercises/ex14/AnimatedGallery.vue";
// 03-Avancé
import RouterApp from "./exercises/ex15/RouterApp.vue";
import PiniaApp from "./exercises/ex16/PiniaApp.vue";
import LoginForm from "./exercises/ex17/LoginForm.vue";
// 04-Expert
import PerformanceAudit from "./exercises/ex18/PerformanceAudit.vue";
import ArchitectureDemo from "./exercises/ex19/ArchitectureDemo.vue";
// 05-Nuxt
import NuxtPatterns from "./exercises/ex20/NuxtPatterns.vue";
// 06-Storybook
import UIShowcase from "./exercises/ex21/UIShowcase.vue";
// 07-CI/CD
import PipelineCI from "./exercises/ex22/PipelineCI.vue";
// 08-API Typées
import TypedApiClient from "./exercises/ex23/TypedApiClient.vue";
// 09-Accessibilité
import A11yAudit from "./exercises/ex24/A11yAudit.vue";

type ExerciseKey =
  | "ex01"
  | "ex02"
  | "ex03"
  | "ex04"
  | "ex05"
  | "ex06"
  | "ex07"
  | "ex08"
  | "ex09"
  | "ex10"
  | "ex11"
  | "ex12"
  | "ex13"
  | "ex14"
  | "ex15"
  | "ex16"
  | "ex17"
  | "ex18"
  | "ex19"
  | "ex20"
  | "ex21"
  | "ex22"
  | "ex23"
  | "ex24";

interface ExerciseDefinition {
  title: string;
  component: Component;
  module: string;
}

const selected = ref<ExerciseKey>("ex01");

const exercises: Record<ExerciseKey, ExerciseDefinition> = {
  ex01: {
    title: "01 — TypeScript Labo",
    component: TypeScriptLabo,
    module: "00 TypeScript",
  },
  ex02: {
    title: "02 — Compteur réactif",
    component: CounterReactive,
    module: "01 Débutant",
  },
  ex03: {
    title: "03 — Liste de tâches",
    component: TodoList,
    module: "01 Débutant",
  },
  ex04: {
    title: "04 — Formulaire contact",
    component: ContactForm,
    module: "01 Débutant",
  },
  ex05: {
    title: "05 — Catalogue produits",
    component: ProductCatalog,
    module: "01 Débutant",
  },
  ex06: {
    title: "06 — Chronomètre",
    component: StopWatch,
    module: "01 Débutant",
  },
  ex07: {
    title: "07 — Options vs Composition",
    component: OptionsVsComposition,
    module: "01 Débutant",
  },
  ex08: {
    title: "08 — Thème & Injection",
    component: ThemeInjection,
    module: "02 Intermédiaire",
  },
  ex09: {
    title: "09 — Dashboard composables",
    component: DashboardFilters,
    module: "02 Intermédiaire",
  },
  ex10: {
    title: "10 — CRUD API",
    component: CrudApi,
    module: "02 Intermédiaire",
  },
  ex11: {
    title: "11 — Formulaire multi-étapes",
    component: MultiStepForm,
    module: "02 Intermédiaire",
  },
  ex12: {
    title: "12 — Carte profil (slots)",
    component: ProfileCards,
    module: "02 Intermédiaire",
  },
  ex13: {
    title: "13 — Tableau générique",
    component: ReusableTable,
    module: "02 Intermédiaire",
  },
  ex14: {
    title: "14 — Galerie animée",
    component: AnimatedGallery,
    module: "02 Intermédiaire",
  },
  ex15: {
    title: "15 — App multi-pages",
    component: RouterApp,
    module: "03 Avancé",
  },
  ex16: { title: "16 — Store Pinia", component: PiniaApp, module: "03 Avancé" },
  ex17: {
    title: "17 — Tests complets",
    component: LoginForm,
    module: "03 Avancé",
  },
  ex18: {
    title: "18 — Performance audit",
    component: PerformanceAudit,
    module: "04 Expert",
  },
  ex19: {
    title: "19 — Architecture patterns",
    component: ArchitectureDemo,
    module: "04 Expert",
  },
  ex20: {
    title: "20 — Patterns Nuxt",
    component: NuxtPatterns,
    module: "05 Nuxt",
  },
  ex21: { title: "21 — UI Kit", component: UIShowcase, module: "06 Storybook" },
  ex22: {
    title: "22 — Pipeline CI",
    component: PipelineCI,
    module: "07 CI/CD",
  },
  ex23: {
    title: "23 — Client API typé",
    component: TypedApiClient,
    module: "08 API Typées",
  },
  ex24: {
    title: "24 — Audit accessibilité",
    component: A11yAudit,
    module: "09 Accessibilité",
  },
};

const currentExercise = computed(() => exercises[selected.value]);

const modules = computed(() => {
  const groups: Record<string, { key: ExerciseKey; title: string }[]> = {};
  for (const [key, ex] of Object.entries(exercises)) {
    if (!groups[ex.module]) groups[ex.module] = [];
    groups[ex.module].push({ key: key as ExerciseKey, title: ex.title });
  }
  return groups;
});
</script>

<template>
  <main>
    <h1>Vue 3 par exemple</h1>
    <p>
      Sélectionne un exercice dans la barre latérale. Lis l'énoncé dans
      <code>exercices/</code> puis complète le code dans
      <code>src/exercises/</code>.
    </p>

    <div class="layout">
      <nav class="sidebar">
        <div
          v-for="(exs, moduleName) in modules"
          :key="moduleName"
          class="module-group"
        >
          <h3>{{ moduleName }}</h3>
          <button
            v-for="ex in exs"
            :key="ex.key"
            :class="{ active: selected === ex.key }"
            @click="selected = ex.key"
          >
            {{ ex.title }}
          </button>
        </div>
      </nav>

      <section class="content">
        <h2>{{ currentExercise.title }}</h2>
        <component :is="currentExercise.component" />
      </section>
    </div>
  </main>
</template>
