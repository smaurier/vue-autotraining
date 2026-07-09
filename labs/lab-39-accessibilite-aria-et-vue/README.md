# Lab 39 — Accessibilité ARIA et Vue

> **Outcome :** à la fin, tu sais construire `InviteModal.vue` accessible de A à Z — focus trap, `aria-*` dynamiques, live region — et valider le résultat avec l'arbre d'accessibilité Chrome DevTools et la navigation clavier seule.
> **Vrai outil :** Vue 3.5 + Vite dev server + Chrome DevTools Accessibility tree (onglet Elements → Accessibility).
> **Feedback :** le coach valide en session — navigation clavier en direct, arbre d'accessibilité inspecté ensemble.

---

## Énoncé

Tu construis `InviteModal.vue` dans un projet Vite Vue 3.5. C'est la modale d'invitation de TribuZen : un bouton l'ouvre, l'utilisateur saisit un email, valide, la modale se ferme.

**Cahier des charges fonctionnel :**

1. Un bouton "Inviter un membre" ouvre la modale.
2. La modale contient : titre visible, description courte, champ email labellisé, bouton "Envoyer", bouton "Annuler".
3. À l'ouverture : le focus se déplace sur le premier élément focusable de la modale.
4. Pendant que la modale est ouverte : Tab et Shift+Tab restent dans la modale (focus trap).
5. Escape ou clic sur l'overlay ferment la modale.
6. À la fermeture : le focus revient sur le bouton "Inviter un membre".
7. Si l'email est vide à la validation : un message d'erreur s'affiche et est annoncé immédiatement aux AT.
8. Si la validation réussit : un message de succès est annoncé de façon non intrusive.

**Cahier des charges accessibilité :**

- `role="dialog"` + `aria-modal="true"` + `aria-labelledby` + `aria-describedby` sur le conteneur modal.
- `aria-invalid` + `aria-describedby` sur le champ email quand il est en erreur.
- `role="alert"` pour le message d'erreur (annonce immédiate).
- Région `aria-live="polite"` persistante pour le message de succès.
- Boutons natifs `<button>` — aucun `<div role="button">`.

**Pas de gap-fill** — tu écris le composant complet à partir du starter ci-dessous.

### Starter minimal

Crée dans ton projet Vite :
- `src/components/modal/InviteModal.vue`
- `src/composables/useFocusTrap.ts`

```ts
// src/composables/useFocusTrap.ts — starter
import type { Ref } from 'vue'

export function useFocusTrap(
  containerRef: Ref<HTMLElement | null>,
  isActive: Ref<boolean>,
): void {
  // À implémenter : activate(), deactivate(), handleTab(), watcher
}
```

```vue
<!-- src/components/modal/InviteModal.vue — starter -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTemplateRef } from 'vue'
import { useFocusTrap } from '@/composables/useFocusTrap'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  close: []
  invite: [email: string]
}>()

// À toi : ref pour le conteneur dialog, useFocusTrap, état email/error/announcement
</script>

<template>
  <!-- À construire : Teleport + overlay + role="dialog" + focus trap + live regions -->
</template>
```

Lance le dev server (`pnpm dev`) et intègre la modale dans `App.vue` pour tester en direct.

---

## Étapes (en friction)

1. **Implémente `useFocusTrap.ts`** — `FOCUSABLE_SELECTOR`, `getFocusable()`, `handleTab()`, `activate()` avec `nextTick`, `deactivate()` avec restauration du focus, `watch(isActive, ..., { flush: 'post' })`, `onUnmounted(deactivate)`.

2. **Structure la modale** — `<Teleport to="body">` + `v-if="open"` sur l'overlay + `role="dialog"` + `aria-modal="true"` + `aria-labelledby` + `aria-describedby` sur le div intérieur.

3. **Branche `useFocusTrap`** — `useTemplateRef` sur le div dialog, `computed(() => props.open)` pour `isActive`, appel du composable.

4. **Fermeture** — `@click.self="closeModal"` sur l'overlay + `@keydown.escape="closeModal"` + fonction `closeModal()` qui émet `close`.

5. **Formulaire email** — `<label for="...">` + `<input id="..." type="email">` + `:aria-describedby` conditionnel (pointe vers l'id du message d'erreur si erreur) + `:aria-invalid`.

6. **Message d'erreur** — `<p v-if="error" id="..." role="alert">` — `role="alert"` suffit, pas besoin de `aria-live` supplémentaire.

7. **Message de succès** — <code v-pre>&lt;div aria-live="polite" aria-atomic="true" class="sr-only"&gt;{{ announcement }}&lt;/div&gt;</code> — toujours présent dans le DOM, jamais sous `v-if`. Vider puis remplir au `nextTick` dans `sendInvite()`.

8. **Valide avec la navigation clavier seule** :
   - Tab depuis la page : atterrir sur "Inviter un membre", Enter ouvre la modale
   - Tab dans la modale : email → Envoyer → Annuler → revient à email
   - Shift+Tab depuis email : aller à Annuler
   - Escape : modale fermée, focus sur "Inviter un membre"

9. **Valide avec l'arbre d'accessibilité** (Chrome DevTools → Elements → Accessibility) :
   - Le div dialog doit montrer `role: dialog`, `modal: true`, `name: <titre de la modale>`
   - Le champ email doit montrer `invalid: true` + `describedby` quand en erreur
   - La région `aria-live` doit être présente dans l'arbre même quand vide

---

## Corrigé complet commenté

### `src/composables/useFocusTrap.ts`

```ts
import { watch, onUnmounted, nextTick, type Ref } from 'vue'

// Sélecteur standard des éléments focusables (WAI-ARIA APG)
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function useFocusTrap(
  containerRef: Ref<HTMLElement | null>,
  isActive: Ref<boolean>,
): void {
  // Mémoriser l'élément qui avait le focus avant l'ouverture
  let previouslyFocused: HTMLElement | null = null

  function getFocusable(): HTMLElement[] {
    if (!containerRef.value) return []
    return Array.from(
      containerRef.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    )
  }

  function handleTab(event: KeyboardEvent): void {
    // N'intercepter que Tab — laisser passer les autres touches
    if (event.key !== 'Tab') return

    const focusable = getFocusable()
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      // Shift+Tab depuis le premier → cycler au dernier
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      // Tab depuis le dernier → cycler au premier
      event.preventDefault()
      first.focus()
    }
    // Cas intermédiaire : Tab natif se déplace dans la modale — ne rien faire
  }

  async function activate(): Promise<void> {
    // Sauvegarder AVANT de déplacer le focus
    previouslyFocused = document.activeElement as HTMLElement
    // Écouter Tab sur tout le document
    document.addEventListener('keydown', handleTab)

    // nextTick : garantir que v-if a rendu le DOM de la modale
    await nextTick()
    const focusable = getFocusable()
    if (focusable.length > 0) {
      focusable[0].focus()
    }
  }

  function deactivate(): void {
    document.removeEventListener('keydown', handleTab)
    // Restaurer le focus sur le déclencheur (bouton "Inviter un membre")
    previouslyFocused?.focus()
    previouslyFocused = null
  }

  // flush: 'post' : watcher s'exécute après la mise à jour du DOM
  // Sans ça, activate() peut trouver containerRef.value === null si v-if vient de passer à true
  watch(isActive, (active) => {
    if (active) activate()
    else deactivate()
  }, { flush: 'post' })

  // Nettoyage si le composant parent est démonté pendant que la modale est ouverte
  onUnmounted(deactivate)
}
```

### `src/components/modal/InviteModal.vue`

```vue
<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useTemplateRef } from 'vue'
import { useFocusTrap } from '@/composables/useFocusTrap'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  invite: [email: string]
}>()

// useTemplateRef (Vue 3.5) — découple le nom de variable de l'attribut ref du template
const dialogEl = useTemplateRef<HTMLElement>('dialog-el')

// Le focus trap réagit à props.open via un computed
const isOpen = computed(() => props.open)
useFocusTrap(dialogEl, isOpen)

const emailInput = ref('')
const error = ref<string | null>(null)
// Région live : toujours un ref, jamais conditionnel dans le template
const announcement = ref('')

function closeModal(): void {
  // Réinitialiser l'état avant d'émettre — le parent re-rendra
  emailInput.value = ''
  error.value = null
  announcement.value = ''
  emit('close')
}

async function sendInvite(): Promise<void> {
  error.value = null

  if (!emailInput.value.trim()) {
    // role="alert" annonce immédiatement — pas de nextTick nécessaire
    error.value = 'L\'adresse email est requise.'
    return
  }

  // Émettre l'email vers le parent (qui fait l'appel API réel)
  emit('invite', emailInput.value.trim())

  // Double-tick pour forcer la détection du changement par les AT
  // même si la même adresse était annoncée au tour précédent
  announcement.value = ''
  await nextTick()
  announcement.value = `Invitation envoyée à ${emailInput.value.trim()}.`
}
</script>

<template>
  <!--
    Teleport to="body" : rend la modale en dehors du flux DOM du composant parent
    Évite les problèmes de z-index, d'overflow hidden et de stacking context
  -->
  <Teleport to="body">
    <div
      v-if="open"
      class="overlay"
      @click.self="closeModal"
      @keydown.escape="closeModal"
    >
      <!--
        role="dialog"           — annonce la nature de l'élément aux AT
        aria-modal="true"       — dit aux AT d'ignorer le contenu derrière la modale
                                  (ne remplace PAS le focus trap)
        aria-labelledby         — pointe vers le titre visible (préférable à aria-label)
        aria-describedby        — pointe vers la description pour un contexte supplémentaire
        ref="dialog-el"         — capturé par useTemplateRef('dialog-el')
      -->
      <div
        ref="dialog-el"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-title"
        aria-describedby="invite-desc"
        class="modal"
      >
        <!-- Titre nommant la modale — id lié à aria-labelledby -->
        <h2 id="invite-title">Inviter quelqu'un dans la tribu</h2>

        <!-- Description — id lié à aria-describedby -->
        <p id="invite-desc">
          L'invité recevra un email avec un lien d'activation valable 48 h.
        </p>

        <!-- Label explicite associé au champ via for/id -->
        <label for="invite-email">Adresse email de l'invité</label>

        <input
          id="invite-email"
          v-model="emailInput"
          type="email"
          autocomplete="email"
          :aria-describedby="error ? 'invite-error' : undefined"
          :aria-invalid="error ? 'true' : undefined"
        />
        <!--
          aria-describedby conditionnel :
          - en erreur → pointe vers le message d'erreur (id="invite-error")
          - sans erreur → undefined → attribut absent du DOM
          aria-invalid conditionnel :
          - en erreur → "true" (string — ARIA attend des strings, pas des booléens)
          - sans erreur → undefined → attribut absent
        -->

        <!--
          role="alert" = aria-live="assertive" + aria-atomic="true" implicites
          Annonce immédiatement l'erreur — justifié car l'utilisateur vient
          de valider et l'erreur bloque son action
          id="invite-error" : référencé par aria-describedby de l'input
        -->
        <p
          v-if="error"
          id="invite-error"
          role="alert"
          class="error-msg"
        >
          {{ error }}
        </p>

        <div class="actions">
          <!-- Boutons natifs : focusables, activables Enter/Space, annoncés "button" -->
          <button type="button" @click="sendInvite">
            Envoyer l'invitation
          </button>
          <button type="button" @click="closeModal">
            Annuler
          </button>
        </div>

        <!--
          Région live polite pour le succès
          JAMAIS sous v-if : doit être présente dans le DOM avant tout changement
          sr-only : masquée visuellement, visible pour les AT
        -->
        <div aria-live="polite" aria-atomic="true" class="sr-only">
          {{ announcement }}
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: #fff;
  border-radius: 8px;
  padding: 2rem;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 20px 60px rgb(0 0 0 / 0.3);
}

.modal h2 {
  margin-top: 0;
  font-size: 1.25rem;
}

label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.25rem;
  margin-top: 1rem;
}

input[type='email'] {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

/* Indicateur visuel de l'état invalide en complément de aria-invalid */
input[aria-invalid='true'] {
  border-color: #dc2626;
  outline-color: #dc2626;
}

.error-msg {
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
}

button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  border: 1px solid #cbd5e1;
  background: #fff;
}

button:first-child {
  background: #1e293b;
  color: #fff;
  border-color: #1e293b;
}

/* Focus visible obligatoire — ne jamais retirer outline sans alternative */
button:focus-visible,
input:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

/* Utilitaire screen-reader only */
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

### `src/App.vue` — intégration minimale pour tester

```vue
<script setup lang="ts">
import { ref } from 'vue'
import InviteModal from '@/components/modal/InviteModal.vue'

const isModalOpen = ref(false)
const inviteLog = ref<string[]>([])

function handleInvite(email: string): void {
  inviteLog.value.push(email)
  isModalOpen.value = false
}
</script>

<template>
  <main>
    <h1>TribuZen — Test Lab 39</h1>

    <button @click="isModalOpen = true">
      Inviter un membre
    </button>

    <ul v-if="inviteLog.length > 0" aria-label="Invitations envoyées">
      <li v-for="email in inviteLog" :key="email">{{ email }}</li>
    </ul>

    <InviteModal
      :open="isModalOpen"
      @close="isModalOpen = false"
      @invite="handleInvite"
    />
  </main>
</template>
```

**Pourquoi ce corrigé est correct :**

- `useFocusTrap` avec `flush: 'post'` — le watcher s'exécute après la mise à jour du DOM ; sans ça, `containerRef.value` est `null` quand `v-if` vient de passer à `true`.
- `role="alert"` sur le message d'erreur — annonce immédiate sans région `aria-live` séparée. Distinct de la région `polite` du succès.
- `aria-live="polite"` présent dans le DOM dès le montage — le `v-if="open"` est sur l'overlay, pas sur la région live elle-même.
- Le double-tick (`announcement = '' → nextTick → announcement = email`) — force la détection du changement par les AT même si la même adresse était annoncée précédemment.
- `undefined` (pas `false`) pour les `aria-*` conditionnels — retire l'attribut du DOM quand la condition est fausse.

---

## Variante J+30 (fading)

**Même objectif, contrainte ajoutée :**

Reproduis `InviteModal.vue` et `useFocusTrap.ts` **de mémoire, en 30 minutes**, avec cette extension :

Ajoute un composant `ConfirmDialog.vue` **générique** qui réutilise `useFocusTrap` — il reçoit `title: string`, `message: string`, `confirmLabel: string` en props, émet `confirm` ou `cancel`. Le focus trap doit fonctionner indépendamment de `InviteModal` (les deux peuvent coexister sur la page, mais pas être ouverts simultanément dans ce lab).

**Critère de réussite :** navigation clavier complète des deux modales, arbre d'accessibilité Chrome DevTools montre les bons rôles et états, aucun `<div role="button">` dans le code.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen` :

```
tribuzen/
  src/
    composables/
      useFocusTrap.ts              ← Corrigé du lab, partagé par toutes les modales
    components/
      modal/
        InviteModal.vue            ← Corrigé du lab
        ConfirmDialog.vue          ← Variante J+30 — réutilise useFocusTrap
      layout/
        AppLayout.vue              ← Watcher route + aria-live pour annonces de navigation
```

**Différences par rapport au lab :**

- `handleInvite` en `App.vue` → `handleInvite` dans le composable `useInvite.ts` qui appelle l'API Nest (`POST /tribuzen/:id/invite`).
- Le résultat succès/erreur vient de la réponse API — la live region reçoit le message du serveur, pas un message local.
- `ConfirmDialog.vue` remplace les `window.confirm()` pour les actions destructives (quitter une tribu, supprimer un post).

**Commit cible :**

```
feat(a11y): InviteModal accessible — focus trap, aria-live, role=dialog
```
