# Correction – Exercice 08 : Thème & Injection de dépendances

## Concepts clés
- `provide()` : injecte une valeur dans **tous** les composants enfants, sans prop drilling
- `inject()` : récupère une valeur fournie par un ancêtre
- `InjectionKey` : clé typée (TypeScript) pour éviter les erreurs d'injection
- `Ref<T>` : référence réactive — quand elle change, tout composant qui la lit se met à jour

---

## Fichier 1 — `ThemeProvider.vue`

Ce composant est le **fournisseur** (provider). Il détient l'état du thème et le partage vers le bas de l'arbre de composants.

```vue
<script setup lang="ts">
import { ref, provide } from 'vue'
// On importe les clés d'injection depuis un fichier partagé
// pour que provider et consumers utilisent EXACTEMENT la même clé
import { THEME_KEY, TOGGLE_THEME_KEY } from './injectionKeys'

// État réactif du thème. 'light' ou 'dark'
const theme = ref<'light' | 'dark'>('light')

// Fonction qui bascule le thème
function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

// provide() rend theme et toggleTheme disponibles pour TOUS les descendants
// On ne passe PAS theme.value mais theme lui-même (la Ref),
// ainsi les enfants reçoivent un objet réactif et seront mis à jour automatiquement
provide(THEME_KEY, theme)
provide(TOGGLE_THEME_KEY, toggleTheme)
</script>

<template>
  <!-- ThemeProvider ne fait qu'englober ses enfants, sans rendu visuel propre -->
  <slot />
</template>
```

---

## Fichier 2 — `injectionKeys.ts`

Centraliser les clés évite les fautes de frappe et permet à TypeScript de vérifier les types.

```typescript
import type { InjectionKey, Ref } from 'vue'

// InjectionKey<T> est un Symbol typé — TypeScript saura que
// inject(THEME_KEY) retourne Ref<'light' | 'dark'>
export const THEME_KEY: InjectionKey<Ref<'light' | 'dark'>> = Symbol('theme')

// La valeur injectée pour cette clé sera une fonction sans argument sans retour
export const TOGGLE_THEME_KEY: InjectionKey<() => void> = Symbol('toggleTheme')
```

---

## Fichier 3 — `ThemedHeader.vue`

Ce composant **consomme** le thème pour s'afficher différemment selon l'état.

```vue
<script setup lang="ts">
import { inject, computed } from 'vue'
import { THEME_KEY } from './injectionKeys'

// inject() peut recevoir une valeur par défaut en 2ème argument.
// Ici on fournit 'light' comme fallback si le composant est utilisé
// EN DEHORS d'un ThemeProvider (cas défensif)
const theme = inject(THEME_KEY, ref('light') as Ref<'light' | 'dark'>)

// computed() recalcule automatiquement les classes quand theme.value change
const headerClasses = computed(() => ({
  'themed-header': true,
  'themed-header--dark': theme.value === 'dark',
  'themed-header--light': theme.value === 'light',
}))

// Les props normales fonctionnent en parallèle de l'injection
const props = defineProps<{
  title: string
}>()
</script>

<template>
  <header :class="headerClasses">
    <h1>{{ props.title }}</h1>
    <!-- Petite indication visuelle du thème courant -->
    <span class="theme-badge">Thème : {{ theme }}</span>
  </header>
</template>

<style scoped>
.themed-header {
  padding: 1rem 2rem;
  transition: background-color 0.3s, color 0.3s; /* animation douce */
}
.themed-header--light {
  background-color: #ffffff;
  color: #1a1a1a;
  border-bottom: 2px solid #e0e0e0;
}
.themed-header--dark {
  background-color: #1e1e2e;
  color: #cdd6f4;
  border-bottom: 2px solid #45475a;
}
.theme-badge {
  font-size: 0.75rem;
  opacity: 0.6;
  margin-left: 1rem;
}
</style>
```

---

## Fichier 4 — `ThemedCard.vue`

```vue
<script setup lang="ts">
import { inject, ref, computed } from 'vue'
import { THEME_KEY } from './injectionKeys'
import type { Ref } from 'vue'

const theme = inject(THEME_KEY, ref('light') as Ref<'light' | 'dark'>)

const props = defineProps<{
  title: string
  content: string
}>()

const cardClasses = computed(() => [
  'themed-card',
  // Syntaxe alternative : tableau de chaînes conditionnelles
  theme.value === 'dark' ? 'themed-card--dark' : 'themed-card--light'
])
</script>

<template>
  <article :class="cardClasses">
    <h2 class="card-title">{{ props.title }}</h2>
    <p class="card-content">{{ props.content }}</p>
  </article>
</template>

<style scoped>
.themed-card {
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s, color 0.3s, box-shadow 0.3s;
}
.themed-card--light {
  background-color: #f8f9fa;
  color: #212529;
  border: 1px solid #dee2e6;
}
.themed-card--dark {
  background-color: #313244;
  color: #cdd6f4;
  border: 1px solid #45475a;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}
.card-title {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}
</style>
```

---

## Fichier 5 — `ThemeToggle.vue`

Ce composant ne connaît **pas** le thème actuel — il ne fait qu'appeler la fonction toggle.

```vue
<script setup lang="ts">
import { inject } from 'vue'
import { TOGGLE_THEME_KEY, THEME_KEY } from './injectionKeys'
import { ref } from 'vue'
import type { Ref } from 'vue'

// On injecte la FONCTION toggle. Si elle n'est pas disponible,
// on fournit une fonction vide comme fallback (ne fera rien)
const toggleTheme = inject(TOGGLE_THEME_KEY, () => {})

// On injecte aussi le thème courant pour l'afficher dans le bouton
const theme = inject(THEME_KEY, ref('light') as Ref<'light' | 'dark'>)
</script>

<template>
  <button
    class="toggle-btn"
    @click="toggleTheme"
    :aria-label="`Passer en mode ${theme === 'dark' ? 'clair' : 'sombre'}`"
  >
    <!-- Icônes emoji simples — dans un vrai projet on utiliserait des SVG -->
    <span v-if="theme === 'dark'">☀️ Mode clair</span>
    <span v-else>🌙 Mode sombre</span>
  </button>
</template>

<style scoped>
.toggle-btn {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  transition: transform 0.1s;
}
.toggle-btn:hover {
  transform: scale(1.05);
}
</style>
```

---

## Fichier 6 — `ThemeInjection.vue` (assemblage)

```vue
<script setup lang="ts">
// On importe tous les composants enfants
import ThemeProvider from './ThemeProvider.vue'
import ThemedHeader from './ThemedHeader.vue'
import ThemedCard from './ThemedCard.vue'
import ThemeToggle from './ThemeToggle.vue'
</script>

<template>
  <!--
    ThemeProvider entoure TOUT le reste.
    Tous les composants à l'intérieur peuvent appeler inject()
    pour accéder au thème et à la fonction toggle.
  -->
  <ThemeProvider>
    <div class="app-layout">
      <!-- ThemedHeader utilise inject(THEME_KEY) en interne -->
      <ThemedHeader title="Mon Application Vue 3" />

      <!-- ThemeToggle utilise inject(TOGGLE_THEME_KEY) en interne -->
      <div class="controls">
        <ThemeToggle />
      </div>

      <!-- Grille de cartes — chacune récupère le thème via inject -->
      <main class="cards-grid">
        <ThemedCard
          title="Composant A"
          content="Ce composant reçoit le thème via inject(), sans aucune prop."
        />
        <ThemedCard
          title="Composant B"
          content="Tous les ThemedCard se synchronisent car ils partagent la même Ref."
        />
        <ThemedCard
          title="Composant C"
          content="Provide/inject évite de faire passer des props à travers plusieurs niveaux."
        />
      </main>
    </div>
  </ThemeProvider>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  font-family: system-ui, sans-serif;
}
.controls {
  display: flex;
  justify-content: flex-end;
  padding: 1rem 2rem;
}
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  padding: 1rem 2rem;
  gap: 0.5rem;
}
</style>
```

---

## Résumé du flux de données

```
ThemeProvider (provide theme + toggleTheme)
  └── ThemedHeader   ← inject(THEME_KEY)
  └── ThemeToggle    ← inject(TOGGLE_THEME_KEY)
  └── ThemedCard     ← inject(THEME_KEY)
  └── ThemedCard     ← inject(THEME_KEY)
```

**Règle d'or :** on passe la `Ref` elle-même (pas `.value`) dans `provide()`, pour que la réactivité soit préservée chez les consumers.
