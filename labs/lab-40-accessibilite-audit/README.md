# Lab 40 — Audit d'accessibilité

> **Outcome :** à la fin, tu sais conduire un audit a11y complet sur un composant Vue 3 — vitest-axe en CI, test clavier documenté, grille RGAA 4.1 partielle, rapport NC actionnable.
> **Vrai outil :** jest-axe + @vue/test-utils + Vitest. Navigateur + clavier pour le test manuel.
> **Feedback :** le coach valide le rapport de NC et les tests en session.

---

## Énoncé

TribuZen prépare sa beta publique. Tu es chargé de l'audit a11y du composant `InvitationForm.vue` — le parcours le plus critique de l'onboarding. Ce composant a été livré rapidement et n'a jamais été audité.

**Ta mission en 3 parties :**

1. **Automatique** — écrire les tests vitest-axe du composant dans les deux états clés (initial + erreurs après soumission invalide).
2. **Manuel** — conduire le test clavier sur le composant rendu dans le navigateur et documenter les non-conformités trouvées.
3. **Rapport** — rédiger un mini-rapport RGAA 4.1 avec au moins 3 NC, leur priorisation, et les corrections recommandées avec code.

**Pas de gap-fill** — tu produis les tests, le protocole de test, et le rapport à partir du starter.

---

## Starter minimal

### Composant à auditer

Crée `src/components/invite/InvitationForm.vue` dans ton projet Vite/Vue 3 :

```vue
<!-- InvitationForm.vue — starter délibérément non conforme -->
<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  groupId: string
  groupName: string
}>()

const email = ref('')
const submitting = ref(false)
const submitted = ref(false)
const emailError = ref('')

async function handleSubmit(): Promise<void> {
  emailError.value = ''

  if (!email.value.trim()) {
    emailError.value = 'Ce champ est obligatoire.'
    return
  }

  if (!email.value.includes('@')) {
    emailError.value = 'Adresse email invalide.'
    return
  }

  submitting.value = true
  // Simulation appel API
  await new Promise(resolve => setTimeout(resolve, 800))
  submitting.value = false
  submitted.value = true
}
</script>

<template>
  <div class="invitation-form">
    <h2>Rejoindre {{ groupName }}</h2>
    <p>Entrez votre email pour recevoir l'invitation.</p>

    <div v-if="submitted">
      <p>Invitation envoyée !</p>
    </div>

    <!-- ⚠️ Ce formulaire contient des NC intentionnelles à identifier -->
    <form v-else @submit.prevent="handleSubmit" data-testid="invite-form">
      <div class="field">
        <!-- NC #1 : placeholder utilisé à la place d'un label -->
        <input
          v-model="email"
          type="email"
          placeholder="Votre adresse email"
          :disabled="submitting"
        />
        <!-- NC #2 : erreur non liée au champ, sans rôle d'alerte -->
        <span v-if="emailError" class="error">{{ emailError }}</span>
      </div>

      <!-- NC #3 : bouton sans nom accessible clair lors du chargement -->
      <button type="submit" :disabled="submitting">
        <span v-if="submitting">...</span>
        <span v-else>Envoyer</span>
      </button>
    </form>
  </div>
</template>

<style scoped>
.invitation-form {
  max-width: 400px;
  padding: 1.5rem;
}

.field {
  margin-bottom: 1rem;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  /* NC #4 (visuel) : couleur de placeholder à vérifier pour le contraste */
}

.error {
  display: block;
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

button {
  padding: 0.5rem 1rem;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
```

### Installation des dépendances

```bash
pnpm add -D jest-axe @types/jest-axe
```

### Fichier de test à créer

```
src/components/invite/__tests__/InvitationForm.a11y.spec.ts
```

---

## Étapes (en friction)

### Partie 1 — Tests vitest-axe

1. **Crée le fichier de test** `InvitationForm.a11y.spec.ts`. Importe `axe`, `toHaveNoViolations` depuis `jest-axe` et étend les matchers.
2. **Écris le test de l'état initial** — monte le composant avec `groupId: 'g-1'` et `groupName: 'Famille Martin'`, analyse avec `axe(wrapper.element)` limité à `wcag2a` et `wcag2aa`.
3. **Lance le test** avec `pnpm test` — il doit échouer avec les violations du starter. Note les `id` de violation et leur `impact`.
4. **Écris le test de l'état erreur** — déclenche la soumission vide (trigger `submit`), attends le `$nextTick`, puis passe dans `axe()`.
5. **Note toutes les violations détectées automatiquement** — tu t'en serviras pour la partie 3.

### Partie 2 — Test clavier manuel

6. **Lance le dev server** (`pnpm dev`), branche `InvitationForm` dans `App.vue`.
7. **Exécute le protocole clavier** (sans souris, sans NVDA) sur le composant :
   - Tab depuis le haut → l'input est-il le premier élément focusable ?
   - Focus visible sur l'input ? Sur le bouton ?
   - Saisir un email invalide, Tab sur le bouton, Enter → l'erreur apparaît-elle ?
   - Le focus est-il géré après l'erreur (retour sur l'input) ?
   - Tab depuis le bouton → peut-on quitter le composant ?
8. **Documente chaque point** — conforme / non conforme / à vérifier — dans le fichier `RAPPORT.md` que tu crées dans le dossier `lab-40-accessibilite-audit/`.

### Partie 3 — Mini-rapport RGAA

9. **Identifie au moins 3 NC** à partir des violations axe-core et du test clavier.
10. **Pour chaque NC**, remplis le format du rapport (voir Corrigé complet) : critère RGAA, éléments défaillants, impact, recommandation + code corrigé, priorité P0-P3.
11. **Calcule le taux de conformité** sur les critères applicables que tu as testés (utilise uniquement les critères RGAA relevant du composant).
12. **Corrige les NC dans le composant** et relance les tests — ils doivent passer.

---

## Corrigé complet commenté

### Partie 1 — Tests vitest-axe

```ts
// src/components/invite/__tests__/InvitationForm.a11y.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { axe, toHaveNoViolations } from 'jest-axe'
import InvitationForm from '@/components/invite/InvitationForm.vue'

// Extension des matchers Vitest — à faire une seule fois par fichier
// (ou dans vitest.setup.ts pour l'avoir globalement)
expect.extend(toHaveNoViolations)

// Les props minimales pour rendre le composant
const defaultProps = {
  groupId: 'g-1',
  groupName: 'Famille Martin',
}

describe('InvitationForm — audit axe-core (wcag2aa)', () => {
  it('état initial — aucune violation', async () => {
    const wrapper = mount(InvitationForm, {
      props: defaultProps,
    })

    // nextTick : s'assurer que Vue a terminé le rendu initial
    await wrapper.vm.$nextTick()

    const results = await axe(wrapper.element, {
      // Limiter aux règles WCAG 2.0 AA et 2.1 AA
      // best-practice est utile en dev mais trop bruyant en CI
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })

    // toHaveNoViolations affiche les violations en détail si le test échoue :
    // [critical] label: Form elements must have labels
    //   → <input type="email" placeholder="Votre adresse email">
    //   Fix: Element does not have a label; use <label for=...>
    expect(results).toHaveNoViolations()
  })

  it('état erreur (soumission invalide) — aucune violation', async () => {
    const wrapper = mount(InvitationForm, {
      props: defaultProps,
    })

    // Déclencher la soumission sans email
    // → le composant passe dans l'état erreur (emailError !== '')
    await wrapper.find('[data-testid="invite-form"]').trigger('submit')
    await wrapper.vm.$nextTick()

    // axe analyse le DOM avec le message d'erreur visible
    // Les violations liées à aria-describedby manquant apparaîtront ici
    const results = await axe(wrapper.element, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })

    expect(results).toHaveNoViolations()
  })
})
```

### Partie 2 — Composant corrigé (toutes NC résolues)

```vue
<!-- InvitationForm.vue — version conforme -->
<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  groupId: string
  groupName: string
}>()

const email = ref('')
const submitting = ref(false)
const submitted = ref(false)
const emailError = ref('')

// ID unique pour le lien label/input et aria-describedby
// En pratique : utiliser un UUID ou un composable useId()
const fieldId = 'invite-email'
const errorId = 'invite-email-error'

const hasError = computed(() => emailError.value !== '')

async function handleSubmit(): Promise<void> {
  emailError.value = ''

  if (!email.value.trim()) {
    emailError.value = 'Ce champ est obligatoire.'
    return
  }

  if (!email.value.includes('@')) {
    emailError.value = 'Adresse email invalide.'
    return
  }

  submitting.value = true
  await new Promise(resolve => setTimeout(resolve, 800))
  submitting.value = false
  submitted.value = true
}
</script>

<template>
  <div class="invitation-form">
    <!-- ✅ H2 contextuel — niveau de titre à adapter selon la page parente -->
    <h2>Rejoindre {{ groupName }}</h2>
    <p>Entrez votre email pour recevoir l'invitation.</p>

    <!-- ✅ Confirmation — aria-live pour annoncer le succès sans rechargement -->
    <div v-if="submitted" aria-live="polite" role="status">
      <p>Invitation envoyée à {{ email }}. Vérifiez votre boîte mail.</p>
    </div>

    <form v-else @submit.prevent="handleSubmit" data-testid="invite-form" novalidate>
      <div class="field">
        <!-- ✅ NC #1 corrigée : label explicite associé via for/id -->
        <label :for="fieldId">
          Adresse email
          <!-- Marqueur visuel obligatoire — aria-required sur l'input suffit pour les AT -->
          <span aria-hidden="true">*</span>
        </label>

        <input
          :id="fieldId"
          v-model="email"
          type="email"
          autocomplete="email"
          :disabled="submitting"
          :aria-invalid="hasError"
          :aria-describedby="hasError ? errorId : undefined"
          aria-required="true"
        />

        <!-- ✅ NC #2 corrigée : role="alert" pour l'annonce automatique
             + id pour aria-describedby sur l'input -->
        <p
          v-if="hasError"
          :id="errorId"
          role="alert"
          class="error"
        >
          {{ emailError }}
        </p>
      </div>

      <!-- ✅ NC #3 corrigée : nom accessible clair à tout moment
           aria-busy indique l'état de chargement aux lecteurs d'écran -->
      <button
        type="submit"
        :disabled="submitting"
        :aria-busy="submitting"
        :aria-label="submitting ? 'Envoi en cours, veuillez patienter' : undefined"
      >
        <span aria-hidden="true" v-if="submitting">...</span>
        <span>{{ submitting ? 'Envoi en cours…' : 'Envoyer l\'invitation' }}</span>
      </button>
    </form>
  </div>
</template>

<style scoped>
.invitation-form {
  max-width: 400px;
  padding: 1.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

label {
  font-weight: 500;
  color: #1e293b;
}

input {
  padding: 0.5rem;
  border: 2px solid #cbd5e1;
  border-radius: 4px;
  font-size: 1rem;
}

/* ✅ Focus visible explicite (ne pas supprimer outline) */
input:focus-visible {
  outline: 3px solid #6366f1;
  outline-offset: 2px;
  border-color: #6366f1;
}

/* ✅ État d'erreur visible autrement que par la couleur seule (bordure + icône) */
input[aria-invalid="true"] {
  border-color: #dc2626;
}

.error {
  color: #dc2626;
  font-size: 0.875rem;
  /* ✅ NC #4 contraste : #dc2626 sur #fff = ratio 4.6:1 — conforme AA */
}

button {
  padding: 0.5rem 1rem;
  background: #4f46e5;
  /* ✅ #4f46e5 sur #fff = ratio 4.9:1 — conforme AA */
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

button:focus-visible {
  outline: 3px solid #4f46e5;
  outline-offset: 3px;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
```

### Partie 3 — Mini-rapport RGAA (exemple de rendu)

```markdown
# Rapport d'audit a11y — InvitationForm.vue
**Date :** 2026-07-01
**Composant :** InvitationForm.vue (parcours invitation TribuZen)
**Outils :** jest-axe 4 (wcag2a + wcag2aa) + test clavier Chrome 126
**Auditeur :** Sylvain M.

---

## Taux de conformité

| Critère RGAA | Intitulé | Statut |
|---|---|---|
| 11.1 | Chaque input a un label | NC |
| 11.9 | Intitulé du bouton | NC |
| 11.10 | Contrôle de saisie — erreur identifiée | NC |
| 10.3 | Contenu structuré sans CSS | C |
| 12.11 | Gestion du focus | NC |

Taux de conformité (5 critères applicables) : 1/5 = **20 %**
Objectif RGAA : 75 %

---

## NC #1 — Critère 11.1 — Label manquant (P0 bloquant)

**Élément défaillant :**
`<input type="email" placeholder="Votre adresse email" />`

**Impact :** Les utilisateurs de lecteurs d'écran ne peuvent pas identifier
le champ. NVDA lit "modifiable" sans préciser à quoi sert le champ.

**Correction :**
```html
<label for="invite-email">Adresse email</label>
<input id="invite-email" type="email" />
```

**Effort :** 10 min

---

## NC #2 — Critère 11.10 — Erreur non annoncée (P0 bloquant)

**Élément défaillant :**
`<span v-if="emailError" class="error">{{ emailError }}</span>`

**Impact :** L'erreur de validation apparaît visuellement mais n'est pas
annoncée par les lecteurs d'écran. L'utilisateur non-voyant ne sait pas
que sa saisie a échoué.

**Correction :**
```html
<p
  v-if="emailError"
  id="invite-email-error"
  role="alert"
>{{ emailError }}</p>
<!-- + sur l'input : :aria-invalid="hasError" :aria-describedby="errorId" -->
```

**Effort :** 15 min

---

## NC #3 — Critère 11.9 — Bouton sans nom accessible pendant le chargement (P1)

**Élément défaillant :**
`<button :disabled="submitting"><span v-if="submitting">...</span></button>`

**Impact :** Pendant le chargement, le nom accessible du bouton devient "..."
— NVDA annonce "... bouton désactivé" sans information sur l'action en cours.

**Correction :**
```html
<button
  :aria-busy="submitting"
  :aria-label="submitting ? 'Envoi en cours, veuillez patienter' : undefined"
>
  {{ submitting ? 'Envoi en cours…' : "Envoyer l'invitation" }}
</button>
```

**Effort :** 10 min

---

## Plan de correction

| Priorité | NC | Effort | Responsable |
|---|---|---|---|
| P0 | NC #1 — Label manquant | 10 min | Dev front |
| P0 | NC #2 — Erreur non annoncée | 15 min | Dev front |
| P1 | NC #3 — Bouton chargement | 10 min | Dev front |

**Estimation totale :** 35 min. Toutes les NC P0 doivent être corrigées
avant la release beta.
```

---

## Variante J+30 (fading)

**Même objectif, sans ouvrir ce corrigé, en 30 minutes :**

Audite `FeedPost.vue` (composant qui affiche un post du feed TribuZen avec boutons Réaction et Commenter) :

1. Identifie les NC potentielles à l'œil (lecture du code seul).
2. Écris les tests vitest-axe pour l'état initial et l'état "réaction ajoutée".
3. Lance les tests, note les violations.
4. Rédige 2 NC au format rapport avec code de correction.

**Contrainte supplémentaire :** les boutons de réaction utilisent des emojis comme seul contenu — propose la solution ARIA correcte pour les rendre accessibles.

---

## Application TribuZen

Dans `smaurier/tribuzen`, l'audit a11y s'intègre comme suit :

**Structure des fichiers**

```
tribuzen/
  src/
    components/
      invite/
        InvitationForm.vue
        __tests__/
          InvitationForm.a11y.spec.ts    ← ce lab
      feed/
        FeedPost.vue
        __tests__/
          FeedPost.a11y.spec.ts
  e2e/
    a11y/
      tribuzen.a11y.spec.ts              ← Playwright + @axe-core/playwright
  docs/
    audit-a11y-2026-07.md               ← rapport RGAA (format ce lab)
```

**Commit cible**

```
test(a11y): vitest-axe InvitationForm — label, role=alert, aria-invalid
fix(a11y): InvitationForm — label explicite, erreur role=alert, bouton aria-busy
```

**Pipeline GitHub Actions**

```yaml
# Ajouter dans .github/workflows/ci.yml
- name: Tests a11y composants
  run: pnpm vitest run --reporter=verbose src/**/*.a11y.spec.ts
```

Les tests a11y de composants doivent bloquer la PR — ils sont rapides (< 5 s) et bloquent les régressions les plus détectables automatiquement.
