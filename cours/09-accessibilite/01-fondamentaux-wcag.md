# 01 — Fondamentaux WCAG et accessibilité en Vue

> **L'accessibilité n'est pas une option, c'est une obligation legale et ethique.**
> En Europe, la directive europeenne sur l'accessibilité (EAA 2025) impose aux entreprises de rendre leurs services numériques accessibles.
> En France, le RGAA impose la conformite WCAG 2.1 AA pour les services publics et, de plus en plus, pour le prive.

---

## 🎯 Pourquoi l'accessibilité ?

| Raison | Detail |
|--------|--------|
| **Legale** | RGAA (France), EAA (Europe), ADA (USA) — amendes possibles |
| **Ethique** | ~15 % de la population mondiale vit avec un handicap |
| **Business** | Un site accessible est mieux référence (SEO) et touche plus d'utilisateurs |
| **Qualite** | Un code accessible est un code semantique, mieux structure, plus maintenable |

---

## 📖 WCAG 2.1 — Les bases

**WCAG** (Web Content Accessibility Guidelines) est le standard international. Il définit 3 niveaux de conformite :

| Niveau | Description | Requis en pratique |
|--------|-------------|-------------------|
| **A** | Minimum vital — le site est utilisable | Oui, toujours |
| **AA** | Standard cible — bonne experience pour tous | Oui (cible legale RGAA) |
| **AAA** | Excellence — optimal mais pas toujours atteignable | Non requis, vise si possible |

---

## 🏗️ Les 4 principes POUR (WCAG)

Tout critere WCAG appartient a l'un de ces 4 principes :

### 1. Perceptible (Perceivable)

L'information doit etre presentee de manière perceptible par tous les sens.

```vue
<script setup lang="ts">
// Exemple : toujours fournir un texte alternatif pour les images
interface ImageProps {
  src: string
  alt: string  // Obligatoire ! Jamais vide pour une image informative
}

defineProps<ImageProps>()
</script>

<template>
  <!-- ✅ Correct : alt descriptif -->
  <img :src="src" :alt="alt" />

  <!-- ❌ Incorrect : alt vide sur une image informative -->
  <!-- <img :src="src" alt="" /> -->

  <!-- ✅ Correct : image decorative = alt vide + role presentation -->
  <!-- <img src="/decoration.svg" alt="" role="presentation" /> -->
</template>
```

**Regles clés :**
- Toute image informative à un `alt` descriptif
- Les videos ont des sous-titres
- Le contraste texte/fond respecte un ratio minimum (4.5:1 pour AA, 3:1 pour les gros textes)

### 2. Operable (Operable)

L'interface doit etre utilisable au clavier et avec des technologies d'assistance.

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isMenuOpen = ref(false)

function toggleMenu(): void {
  isMenuOpen.value = !isMenuOpen.value
}

// ✅ Gerer aussi la navigation clavier
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggleMenu()
  }
  if (event.key === 'Escape' && isMenuOpen.value) {
    isMenuOpen.value = false
  }
}
</script>

<template>
  <!-- ✅ Correct : bouton natif = clavier gratuit -->
  <button
    @click="toggleMenu"
    :aria-expanded="isMenuOpen"
    aria-controls="nav-menu"
  >
    Menu
  </button>

  <nav v-show="isMenuOpen" id="nav-menu">
    <ul role="list">
      <li><a href="/accueil">Accueil</a></li>
      <li><a href="/produits">Produits</a></li>
    </ul>
  </nav>
</template>
```

**Regles clés :**
- Tout élément interactif doit etre focusable et utilisable au clavier
- Utilise des `<button>` natifs, pas des `<div @click>`
- Pas de piege au clavier (sauf focus trap volontaire dans les modales)
- Delai suffisant pour interagir (pas d'auto-disparition trop rapide)

### 3. Understandable (Comprehensible)

Le contenu et le fonctionnement doivent etre comprehensibles.

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const email = ref('')
const emailError = computed(() => {
  if (!email.value) return 'L\'adresse email est obligatoire.'
  if (!email.value.includes('@')) return 'L\'adresse email doit contenir un @.'
  return ''
})
</script>

<template>
  <div>
    <!-- ✅ Label explicitement lie a l'input -->
    <label for="email-input">Adresse email</label>
    <input
      id="email-input"
      v-model="email"
      type="email"
      :aria-invalid="!!emailError"
      :aria-describedby="emailError ? 'email-error' : undefined"
    />
    <!-- ✅ Message d'erreur clair et lie a l'input -->
    <p
      v-if="emailError"
      id="email-error"
      role="alert"
      class="error"
    >
      {{ emailError }}
    </p>
  </div>
</template>
```

**Regles clés :**
- Les labels sont explicites et lies aux inputs
- Les messages d'erreur sont clairs et lies aux champs concernes
- La navigation est coherente d'une page a l'autre
- La langue de la page est declaree (`<html lang="fr">`)

### 4. Robuste (Robust)

Le contenu doit etre compatible avec les technologies d'assistance actuelles et futures.

**Regles clés :**
- HTML valide et semantique
- Roles ARIA utilises correctement (et seulement quand le HTML natif ne suffit pas)
- Composants compatibles avec les lecteurs d'ecran

---

## ⚠️ Erreurs frequentes en Vue 3

### 1. `v-for` sans information accessible

```vue
<template>
  <!-- ❌ Pas de contexte pour le lecteur d'ecran -->
  <div v-for="item in items" :key="item.id">
    {{ item.name }}
  </div>

  <!-- ✅ Utilise une liste semantique -->
  <ul aria-label="Liste des produits">
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </ul>
</template>
```

### 2. `<div @click>` au lieu de `<button>`

```vue
<template>
  <!-- ❌ Pas focusable, pas annonce comme bouton -->
  <div class="btn" @click="doSomething">Cliquer</div>

  <!-- ✅ Element natif : focus, Enter, Space, annonce correcte -->
  <button class="btn" @click="doSomething">Cliquer</button>
</template>
```

### 3. Pas de gestion du focus après changement de route

```ts
// composables/useRouteAnnounce.ts
import { watch } from 'vue'
import { useRoute } from 'vue-router'

export function useRouteAnnounce(): void {
  const route = useRoute()

  watch(() => route.path, () => {
    // Apres un changement de route, deplacer le focus vers le contenu principal
    const main = document.querySelector<HTMLElement>('main')
    if (main) {
      main.setAttribute('tabindex', '-1')
      main.focus()
      // Retirer le tabindex apres le focus pour ne pas perturber la navigation
      main.addEventListener('blur', () => {
        main.removeAttribute('tabindex')
      }, { once: true })
    }
  })
}
```

### 4. Contenu dynamique sans annonce

```vue
<script setup lang="ts">
import { ref } from 'vue'

const notification = ref('')

function addToCart(): void {
  // Logique d'ajout...
  notification.value = 'Produit ajoute au panier avec succes.'

  // Effacer apres 5 secondes
  setTimeout(() => {
    notification.value = ''
  }, 5000)
}
</script>

<template>
  <button @click="addToCart">Ajouter au panier</button>

  <!-- ✅ La region aria-live annonce automatiquement les changements -->
  <div aria-live="polite" aria-atomic="true" class="sr-only">
    {{ notification }}
  </div>
</template>

<style scoped>
/* Classe pour cacher visuellement tout en restant lisible par les lecteurs d'ecran */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
```

### 5. Skip link manquant

```vue
<template>
  <!-- ✅ Skip link : premier element focusable de la page -->
  <a href="#main-content" class="skip-link">
    Aller au contenu principal
  </a>

  <header><!-- Navigation longue --></header>

  <main id="main-content" tabindex="-1">
    <!-- Contenu de la page -->
  </main>
</template>

<style scoped>
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  z-index: 100;
  padding: 0.5rem 1rem;
  background: #000;
  color: #fff;
}

.skip-link:focus {
  top: 0;
}
</style>
```

---

## 📊 Checklist rapide WCAG AA pour Vue

| Critere | Comment vérifier |
|---------|-----------------|
| Contrastes >= 4.5:1 | DevTools > Accessibility > Contrast |
| Tous les inputs ont un label | Vérifier `<label for>` ou `aria-label` |
| Navigation clavier complete | Tester avec Tab uniquement |
| Images informatives ont un alt | Inspecter chaque `<img>` |
| Focus visible sur tous les interactifs | Tabulation et vérification visuelle |
| Langue declaree | `<html lang="fr">` |
| Structure de titres logique | h1 > h2 > h3, pas de saut |
| Erreurs de formulaire liees aux champs | `aria-describedby` + `aria-invalid` |

---

## 🎯 Pratique

### Exercice A11Y.1 — Corriger un bouton

Ce bouton est inaccessible. Corrige-le :

```vue
<template>
  <div class="close-btn" @click="close">X</div>
</template>
```

<details>
<summary>Solution</summary>

```vue
<template>
  <button
    class="close-btn"
    @click="close"
    aria-label="Fermer la fenetre"
  >
    <span aria-hidden="true">X</span>
  </button>
</template>
```

**Pourquoi :**
- `<button>` est focusable et annonce comme bouton
- `aria-label` donne un nom accessible clair
- `aria-hidden="true"` sur le "X" evite que le lecteur d'ecran lise "X" au lieu de "Fermer"
</details>

---

### Exercice A11Y.2 — Ajouter une annonce dynamique

Le composant suivant ajoute un produit au panier, mais le lecteur d'ecran ne sait pas que l'action a reussi :

```vue
<script setup lang="ts">
import { ref } from 'vue'

const cartCount = ref(0)

function addToCart(): void {
  cartCount.value++
}
</script>

<template>
  <button @click="addToCart">Ajouter ({{ cartCount }})</button>
</template>
```

<details>
<summary>Solution</summary>

```vue
<script setup lang="ts">
import { ref } from 'vue'

const cartCount = ref(0)
const announcement = ref('')

function addToCart(): void {
  cartCount.value++
  announcement.value = `Produit ajoute. ${cartCount.value} article${cartCount.value > 1 ? 's' : ''} dans le panier.`
}
</script>

<template>
  <button @click="addToCart">
    Ajouter au panier ({{ cartCount }})
  </button>
  <div aria-live="polite" class="sr-only">
    {{ announcement }}
  </div>
</template>
```
</details>

---

## Suite

→ `cours/09-accessibilite/02-aria-et-vue.md`
