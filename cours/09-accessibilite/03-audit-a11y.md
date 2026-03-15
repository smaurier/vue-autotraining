# 03 — Audit d'accessibilité

> **Un audit a11y, c'est comme un examen medical pour ton site.**
> Tu peux automatiser une partie (outils), mais l'expertise humaine reste indispensable.
> Les outils automatises ne detectent que ~30-40 % des problèmes d'accessibilité.

---

> **🔄 Rappel du cours précédent**
> Avant de continuer, vérifié que tu peux repondre a ces questions :
> 1. Quelle est la première regle d'ARIA ?
> 2. A quoi sert `aria-live="polite"` ?
> 3. Qu'est-ce qu'un focus trap et quand l'utiliser ?
>
> <details>
> <summary>Verifier mes reponses</summary>
>
> 1. Ne pas utiliser ARIA si le HTML natif suffit
> 2. A annoncer les changements de contenu aux lecteurs d'ecran quand l'utilisateur est inactif
> 3. Un mécanisme qui empeche le focus de sortir d'un conteneur (modale) — à utiliser quand une modale est ouverte
> </details>

---

## 🔍 Les 3 niveaux d'audit

| Niveau | Méthode | Couverture | Effort |
|--------|---------|-----------|--------|
| **Automatise** | Lighthouse, axe-core, eslint-plugin-vuejs-accessibility | ~30-40 % des criteres | Faible |
| **Manuel** | Navigation clavier, vérification visuelle, inspection du DOM | ~70-80 % | Moyen |
| **Lecteur d'ecran** | VoiceOver (Mac), NVDA (Windows), Orca (Linux) | ~95 %+ | Eleve |

> 💡 **En pratique**, on combine les 3 : les outils automatises en CI, les tests manuels en revue de code, et les tests lecteur d'ecran avant chaque release majeure.

---

## ⚡ Outils automatises

### 1. Lighthouse (intégré a Chrome DevTools)

Lighthouse est l'outil le plus accessible (sans jeu de mots). Il est intégré a Chrome.

**Comment l'utiliser :**
1. Ouvre Chrome DevTools (F12)
2. Onglet "Lighthouse"
3. Coche "Accessibility"
4. Clique "Analyze page load"

**Ce qu'il détecté :**
- Contrastes insuffisants
- Images sans `alt`
- Labels manquants sur les inputs
- Ordre des titres incorrect
- Éléments interactifs trop petits

**Ce qu'il ne détecté PAS :**
- Logique de focus incorrecte
- Annonces `aria-live` manquantes
- Navigation clavier non fonctionnelle
- Sens du texte alternatif

### 2. axe-core — Tests automatises en CI

**axe-core** est la bibliotheque de référence pour l'audit a11y automatise. On peut l'intégrer dans les tests Playwright ou Vitest.

```bash
pnpm add -D @axe-core/playwright
```

#### Avec Playwright

```ts
// e2e/a11y.spec.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Audit accessibilite', () => {
  test('la page d\'accueil ne contient pas de violation a11y', async ({ page }) => {
    await page.goto('/')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])  // Niveaux A et AA
      .analyze()

    // Afficher les violations dans le rapport de test
    if (results.violations.length > 0) {
      console.log('Violations a11y :')
      for (const violation of results.violations) {
        console.log(`  [${violation.impact}] ${violation.id}: ${violation.description}`)
        for (const node of violation.nodes) {
          console.log(`    → ${node.html}`)
          console.log(`    Fix: ${node.failureSummary}`)
        }
      }
    }

    expect(results.violations).toHaveLength(0)
  })

  test('la modale de contact est accessible', async ({ page }) => {
    await page.goto('/')
    await page.click('button[data-testid="open-contact"]')

    // Attendre que la modale soit visible
    await page.waitForSelector('[role="dialog"]')

    const results = await new AxeBuilder({ page })
      .include('[role="dialog"]')  // Scanner uniquement la modale
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(results.violations).toHaveLength(0)
  })
})
```

#### Avec Vitest + @vue/test-utils

```ts
// tests/a11y/FormA11y.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { axe, toHaveNoViolations } from 'jest-axe'
import ContactForm from '@/components/ContactForm.vue'

// Ajouter le matcher custom
expect.extend(toHaveNoViolations)

describe('ContactForm — a11y', () => {
  it('n\'a pas de violations a11y', async () => {
    const wrapper = mount(ContactForm)

    // axe analyse le HTML rendu
    const results = await axe(wrapper.element)

    expect(results).toHaveNoViolations()
  })
})
```

```bash
pnpm add -D jest-axe @types/jest-axe
```

### 3. eslint-plugin-vuejs-accessibility

Ce plugin ESLint signale les problèmes d'accessibilité directement dans ton editeur.

```bash
pnpm add -D eslint-plugin-vuejs-accessibility
```

```ts
// eslint.config.js (extrait)
import vueA11y from 'eslint-plugin-vuejs-accessibility'

export default [
  // ... autres configs
  {
    plugins: {
      'vuejs-accessibility': vueA11y,
    },
    rules: {
      'vuejs-accessibility/alt-text': 'error',
      'vuejs-accessibility/anchor-has-content': 'error',
      'vuejs-accessibility/click-events-have-key-events': 'error',
      'vuejs-accessibility/form-control-has-label': 'error',
      'vuejs-accessibility/label-has-for': 'error',
      'vuejs-accessibility/no-autofocus': 'warn',
      'vuejs-accessibility/no-distracting-elements': 'error',
      'vuejs-accessibility/tabindex-no-positive': 'error',
    },
  },
]
```

**Ce que le plugin détecté :**
- `<img>` sans `alt`
- `<a>` sans contenu textuel
- `<div @click>` sans `@keydown`
- Inputs sans label
- `tabindex` positif (mauvaise pratique)

---

## 🖐️ Audit manuel — La checklist

Les outils automatises ne suffisent pas. Voici la procedure de test manuel.

### Test clavier (5 minutes par page)

| Étape | Action | Attendu |
|-------|--------|---------|
| 1 | Appuie sur Tab depuis le haut de la page | Le focus se deplace dans l'ordre logique |
| 2 | Verifie le focus visible | Chaque élément focuse à un contour visible |
| 3 | Teste les boutons avec Enter et Space | Les deux touches activent le bouton |
| 4 | Teste Escape sur les modales/dropdowns | L'élément se ferme et le focus revient |
| 5 | Verifie qu'il n'y a pas de piege au focus | Tu peux toujours quitter un composant avec Tab |
| 6 | Teste le skip link | Il apparait au premier Tab et fonctionne |

### Test visuel (3 minutes par page)

| Étape | Action |
|-------|--------|
| 1 | Zoom a 200 % — le contenu reste lisible ? |
| 2 | Mode sombre / clair — les contrastes sont corrects ? |
| 3 | Les textes sont lisibles sans CSS ? (désactiver les styles) |
| 4 | Les animations respectent `prefers-reduced-motion` ? |

### Vérification `prefers-reduced-motion` en Vue

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const prefersReducedMotion = ref(false)

onMounted(() => {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion.value = mediaQuery.matches

  mediaQuery.addEventListener('change', (event) => {
    prefersReducedMotion.value = event.matches
  })
})
</script>

<template>
  <Transition :name="prefersReducedMotion ? '' : 'fade'">
    <div v-if="visible">Contenu anime</div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Alternative CSS pure */
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
```

---

## 🔊 Test avec lecteur d'ecran

### VoiceOver (macOS, gratuit)

| Action | Raccourci |
|--------|-----------|
| Activer/désactiver | Cmd + F5 |
| Élément suivant | VO + fleche droite (VO = Ctrl + Option) |
| Activer un élément | VO + Space |
| Lire la page | VO + A |
| Ouvrir le rotor | VO + U |

### NVDA (Windows, gratuit)

| Action | Raccourci |
|--------|-----------|
| Activer/désactiver | Ctrl + Alt + N |
| Élément suivant | Tab ou fleche bas |
| Lire la page | NVDA + fleche bas |
| Titre suivant | H |
| Region suivante | D |
| Liste des titres | NVDA + F7 |

### Ce qu'il faut vérifier avec un lecteur d'ecran

| Élément | Vérification |
|---------|-------------|
| Images | Le texte alternatif est lu et pertinent |
| Boutons | Le nom accessible est clair (pas juste "bouton") |
| Formulaires | Les labels sont annonces avec les inputs |
| Erreurs | Les messages d'erreur sont annonces automatiquement |
| Navigation | Les menus sont annonces avec leur role |
| Modales | Annoncee comme "dialogue", focus piege, Escape ferme |
| Contenu dynamique | Les changements sont annonces (`aria-live`) |

---

## 📋 Checklist WCAG AA pour composants Vue

Voici une checklist à intégrer dans ta revue de code :

```ts
// utils/a11yChecklist.ts
// A utiliser comme reference lors des code reviews

export const A11Y_CHECKLIST = {
  composant: [
    'Le composant utilise du HTML semantique',
    'Les elements interactifs sont des <button> ou <a>',
    'Chaque input a un <label> associe',
    'Les images informatives ont un alt descriptif',
    'Les icones decoratives ont aria-hidden="true"',
  ],
  clavier: [
    'Tous les elements interactifs sont focusables',
    'L\'ordre de tabulation est logique',
    'Le focus est visible sur chaque element',
    'Les modales ont un focus trap',
    'Escape ferme les overlays',
  ],
  dynamique: [
    'Les changements de contenu utilisent aria-live',
    'Les erreurs de formulaire sont liees par aria-describedby',
    'Le focus est gere apres les changements de vue',
    'Les chargements ont un indicateur accessible',
  ],
  visuel: [
    'Les contrastes respectent le ratio 4.5:1 (texte normal)',
    'Le contenu est lisible a 200% de zoom',
    'Les animations respectent prefers-reduced-motion',
    'Les couleurs ne sont pas le seul moyen de transmettre une info',
  ],
} as const
```

---

## 🔧 Corrections courantes

### Problème : contraste insuffisant

```vue
<style scoped>
/* ❌ Ratio 2.5:1 — insuffisant */
.text-light {
  color: #999;
  background: #fff;
}

/* ✅ Ratio 4.6:1 — conforme AA */
.text-accessible {
  color: #595959;
  background: #fff;
}
</style>
```

> 💡 Utilise https://webaim.org/resources/contrastchecker/ pour vérifier les ratios.

### Problème : structure de titres incorrecte

```vue
<template>
  <!-- ❌ Saut de niveau h1 → h3 -->
  <h1>Mon application</h1>
  <h3>Section</h3>

  <!-- ✅ Hierarchie correcte -->
  <h1>Mon application</h1>
  <h2>Section</h2>
  <h3>Sous-section</h3>
</template>
```

### Problème : formulaire sans gestion d'erreur accessible

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const name = ref('')
const submitted = ref(false)

const nameError = computed(() => {
  if (!submitted.value) return ''
  if (!name.value.trim()) return 'Le nom est obligatoire.'
  if (name.value.length < 2) return 'Le nom doit contenir au moins 2 caracteres.'
  return ''
})

function handleSubmit(): void {
  submitted.value = true
  if (!nameError.value) {
    // Envoyer le formulaire...
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" novalidate>
    <div>
      <label for="name-input">Nom complet</label>
      <input
        id="name-input"
        v-model="name"
        type="text"
        :aria-invalid="!!nameError"
        :aria-describedby="nameError ? 'name-error' : undefined"
        autocomplete="name"
      />
      <p
        v-if="nameError"
        id="name-error"
        role="alert"
        class="error"
      >
        {{ nameError }}
      </p>
    </div>
    <button type="submit">Envoyer</button>
  </form>
</template>
```

---

## 🎯 Pratique

### Exercice AUDIT.1 — Lancer un audit Lighthouse

1. Ouvre ton application Vue en mode dev
2. Lance un audit Lighthouse (onglet Lighthouse > Accessibility)
3. Note les problèmes trouves
4. Corrige-les un par un

### Exercice AUDIT.2 — Écrire un test a11y Playwright

Complete ce test pour vérifier l'accessibilité de la page d'accueil :

```ts
import { test, expect } from '@playwright/test'

test('audit a11y page accueil', async ({ page }) => {
  await page.goto('/')
  // ???
})
```

<details>
<summary>Solution</summary>

```ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('audit a11y page accueil', async ({ page }) => {
  await page.goto('/')

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()

  expect(results.violations).toHaveLength(0)
})
```
</details>

---

### Exercice AUDIT.3 — Test clavier

Parcours ton application **uniquement au clavier** (pas de souris) :

1. Le skip link fonctionne-t-il ?
2. Peux-tu naviguer dans le menu ?
3. Peux-tu remplir et soumettre un formulaire ?
4. Les modales sont-elles correctement piegeees (focus trap) ?
5. Escape ferme-t-il les modales et dropdowns ?

Note chaque problème trouve et corrige-le.

---

## Suite

→ `cours/10-i18n/01-vue-i18n.md`

---

<!-- parcours-recommande -->

::: tip Parcours recommandé
1. **Exercice** : [24-audit-accessibilité](../../exercices/24-audit-accessibilite/ENONCE)
2. **Quiz** : [quiz 09 accessibilité](../../quizzes/quiz-09-accessibilite.html)
:::
