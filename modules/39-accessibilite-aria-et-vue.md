---
titre: ARIA et Vue
cours: 02-vue
notions: [rôle states properties ARIA, première règle de l'ARIA ne pas utiliser ARIA, live regions aria-live, gestion du focus programmatique, composants riches accessibles modale menu onglets, liaisons dynamiques aria avec Vue, annonces de changement de route, pièges ARIA courants]
outcomes:
  - sait quand utiliser ARIA et quand préférer le HTML natif (1re règle)
  - sait annoncer un changement dynamique avec aria-live
  - sait gérer le focus (modale, menu) de façon accessible en Vue
  - sait construire un composant riche accessible (dialog, tabs)
prerequis: [38-accessibilite-fondamentaux-wcag]
next: 40-accessibilite-audit
libs: [{ name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — modale d'invitation accessible (focus trap, aria), annonces aria-live du feed, menu navigation accessible
last-reviewed: 2026-07
---

# ARIA et Vue

> **Outcomes — tu sauras FAIRE :** identifier quand ARIA est nécessaire (1re règle), annoncer un changement dynamique avec `aria-live`, construire une modale avec focus trap, lier dynamiquement les attributs ARIA dans des composants Vue 3.
> **Difficulté :** :star::star::star:

---

← Précédent : [38 — Accessibilité — Fondamentaux WCAG](38-accessibilite-fondamentaux-wcag.md)

---

## 1. Cas concret d'abord

Tu codes `InviteModal.vue` dans TribuZen — la modale qui permet à un membre d'inviter un proche à rejoindre sa tribu. Un collègue a laissé ce début :

```vue
<!-- InviteModal.vue — PREMIER JET (inaccessible) -->
<template>
  <div v-if="isOpen" class="overlay" @click="isOpen = false">
    <div class="modal" @click.stop>
      <h2>Inviter quelqu'un</h2>
      <input type="email" placeholder="Email de l'invité" />
      <div class="btn" @click="sendInvite">Envoyer</div>
      <div class="btn" @click="isOpen = false">Fermer</div>
    </div>
  </div>
</template>
```

**Trois problèmes bloquants pour un utilisateur de lecteur d'écran ou de navigation clavier :**

1. **Pas de sémantique** — la `div` n'est pas annoncée comme boîte de dialogue. L'AT (technologie d'assistance) ne sait pas qu'une modale est ouverte, ni comment elle s'appelle.
2. **Focus non géré** — à l'ouverture, le focus reste sur le bouton déclencheur, derrière la modale. L'utilisateur clavier ne peut pas atteindre le formulaire.
3. **`<div class="btn">`** au lieu de `<button>` — non focusable nativement, non activable avec Enter/Space, non annoncé comme bouton.

Ce module donne les outils pour corriger ces trois problèmes : taxonomie ARIA, 1re règle, `aria-live`, focus trap, et les liaisons dynamiques `:aria-*` avec Vue.

---

## 2. Théorie complète, concise

### 2.1 Taxonomie ARIA — rôles, états, propriétés

ARIA (Accessible Rich Internet Applications) est un ensemble d'attributs HTML qui enrichissent la sémantique pour les technologies d'assistance. ARIA 1.2 définit trois catégories :

| Catégorie | Attributs | Question à laquelle ils répondent |
|-----------|-----------|----------------------------------|
| **Rôles** | `role="dialog"`, `role="tab"`, `role="alert"`, `role="menu"` | Ce qu'EST l'élément (sa nature) |
| **Propriétés** | `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-controls` | Ce que l'élément SIGNIFIE (labels, relations) |
| **États** | `aria-expanded`, `aria-selected`, `aria-disabled`, `aria-hidden`, `aria-checked` | L'ÉTAT COURANT de l'élément (change au runtime) |

La distinction états/propriétés est sémantique : **les états changent fréquemment** en cours d'interaction (`aria-expanded` bascule à chaque ouverture de menu) ; **les propriétés sont plus stables** (`aria-labelledby` pointe vers un titre qui ne change pas).

**Rôles live implicites** — certains rôles définissent aussi un comportement de live region :

| Rôle | `aria-live` implicite | `aria-atomic` implicite |
|------|----------------------|------------------------|
| `role="status"` | `polite` | `true` |
| `role="alert"` | `assertive` | `true` |
| `role="log"` | `polite` | `false` |

### 2.2 Première règle de l'ARIA — ne pas utiliser ARIA si HTML natif suffit

La règle 1 de l'ARIA Authoring Practices Guide (APG, ARIA 1.2) :

> "If you can use a native HTML element or attribute with the semantics and behavior you require already built in, instead of re-purposing an element and adding an ARIA role, state or property to make it accessible, then do so."

En pratique :

```html
<!-- ❌ ARIA inutile — <button> inclut déjà role="button",
     focusabilité, réponse à Enter et Space -->
<button role="button">Valider</button>

<!-- ❌ role="button" sur div — oblige à gérer tabindex,
     keydown Enter/Space, styles focus manuellement -->
<div role="button" tabindex="0" @click="send" @keydown.enter.space.prevent="send">
  Envoyer
</div>

<!-- ✅ HTML natif — sémantique, focus, clavier : tout inclus -->
<button @click="send">Envoyer</button>
```

ARIA est conçu pour **combler les lacunes du HTML natif** :
- Widgets complexes sans équivalent HTML (`role="tablist"`, `role="combobox"`, `role="tree"`)
- Changements dynamiques que le HTML ne peut pas exprimer (`aria-live`, `aria-busy`)
- Relations inter-éléments sans marqueur HTML (`aria-controls`, `aria-owns`, `aria-describedby`)

Il ne remplace pas les éléments HTML sémantiques existants.

### 2.3 `aria-live` — live regions pour les changements dynamiques

En SPA, le DOM change sans rechargement de page. Les AT ne détectent pas ces mutations automatiquement. Les live regions signalent qu'une zone doit être annoncée quand son contenu change.

**Trois valeurs de `aria-live` :**

| Valeur | Comportement | Usage |
|--------|-------------|-------|
| `off` | Pas d'annonce (défaut) | Contenu statique |
| `polite` | Annonce quand l'utilisateur est inactif, entre deux utterances | Notifications, confirmations, compteurs, résultats de recherche |
| `assertive` | Interrompt l'annonce en cours immédiatement | Erreurs critiques, alertes urgentes uniquement |

**Règle d'or** : `assertive` interrompt brutalement l'utilisateur. Réserver aux alertes qui ne peuvent pas attendre (erreur de paiement, session expirée). Pour tout le reste → `polite`.

**`aria-atomic`** — contrôle le périmètre de l'annonce :
- `aria-atomic="true"` : toute la région est annoncée comme unité quand n'importe quelle partie change
- `aria-atomic="false"` (défaut) : seule la portion modifiée est annoncée

**`aria-relevant`** (rarement nécessaire) — contrôle quels types de changements DOM déclenchent l'annonce. Défaut : `"additions text"`. Laisser tel quel dans la majorité des cas.

**Piège critique — la région doit être dans le DOM avant le changement de contenu.** Si la région live est insérée dans le DOM avec du texte déjà présent (via `v-if`), certains AT ne lisent pas ce premier contenu.

```vue
<!-- ❌ Région conditionnelle — AT peut rater l'annonce si elle n'existait pas avant -->
<div v-if="message" aria-live="polite">{{ message }}</div>

<!-- ✅ Région toujours présente, contenu change dynamiquement -->
<div aria-live="polite" aria-atomic="true" class="sr-only">{{ message }}</div>
```

**Piège du double-tick** — si le même texte est annoncé deux fois de suite, certains AT ne le relisent pas. Vider puis remplir force la détection du changement :

```ts
// ✅ Vider d'abord → remplir au tick suivant
// L'AT détecte la transition VIDE → TEXTE, pas TEXTE → TEXTE
function announce(text: string): void {
  message.value = ''
  nextTick(() => {
    message.value = text
  })
}
```

### 2.4 Gestion du focus programmatique

**Trois règles pour les modales :**

1. **Ouverture** — déplacer le focus dans la modale sur le premier élément focusable (ou sur l'élément le plus pertinent : champ de formulaire, bouton d'action principal).
2. **Focus trap** — pendant que la modale est ouverte, Tab et Shift+Tab ne doivent pas sortir du conteneur modal. Le focus doit cycler parmi les éléments focusables de la modale.
3. **Fermeture** — restaurer le focus sur l'élément qui a déclenché l'ouverture.

**Éléments focusables — sélecteur standard :**

```ts
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')
```

**Sauvegarder le déclencheur avant d'ouvrir :**

```ts
// Avant d'ouvrir la modale
const trigger = document.activeElement as HTMLElement

// À la fermeture
trigger.focus()
```

### 2.5 Composants riches accessibles — dialog, menu, tabs

**Dialog (WAI-ARIA APG)**

Attributs minimum sur le conteneur de la modale :

```html
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
>
  <h2 id="dialog-title">Titre de la boîte de dialogue</h2>
  <!-- contenu -->
</div>
```

- `role="dialog"` : annonce la nature de l'élément aux AT
- `aria-modal="true"` : dit aux AT d'ignorer le contenu hors de la modale (ne remplace PAS le focus trap — voir section 2.4)
- `aria-labelledby` : pointe vers l'id du titre visible (préférable à `aria-label` quand un titre visible existe)
- `aria-describedby` (optionnel) : pointe vers un paragraphe descriptif

**Tabs (WAI-ARIA APG) — trois rôles liés :**

```html
<!-- Conteneur des onglets -->
<div role="tablist" aria-label="Paramètres du compte">

  <!-- Onglet actif : aria-selected="true", tabindex="0" -->
  <button
    role="tab"
    aria-selected="true"
    aria-controls="panel-general"
    id="tab-general"
    tabindex="0"
  >Général</button>

  <!-- Onglets inactifs : aria-selected="false", tabindex="-1" (roving tabindex) -->
  <button
    role="tab"
    aria-selected="false"
    aria-controls="panel-security"
    id="tab-security"
    tabindex="-1"
  >Sécurité</button>

</div>

<!-- Panneau actif : tabindex="0" pour être atteignable au Tab depuis les onglets -->
<div
  role="tabpanel"
  id="panel-general"
  aria-labelledby="tab-general"
  tabindex="0"
><!-- contenu --></div>
```

**Menu button (WAI-ARIA APG) :**

```html
<!-- Bouton déclencheur -->
<button aria-haspopup="menu" :aria-expanded="isOpen" :aria-controls="menuId">
  Actions
</button>

<!-- Menu -->
<ul :id="menuId" role="menu" :hidden="!isOpen">
  <li role="menuitem" tabindex="-1" @click="edit">Modifier</li>
  <li role="menuitem" tabindex="-1" @click="del">Supprimer</li>
</ul>
```

Navigation clavier du menu : Flèche haut/bas sur les `menuitem`, Escape ferme le menu et restaure le focus sur le bouton.

### 2.6 Liaisons `:aria-*` dynamiques avec Vue

Vue lie n'importe quel attribut HTML avec `v-bind` (`:` raccourci). Les attributs ARIA fonctionnent exactement comme les autres :

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const isOpen = ref(false)
const isLoading = ref(false)
const selectedId = ref<string | null>(null)
const items = ref([{ id: '1', label: 'Alice' }])

// Computed pour un label dynamique
const toggleLabel = computed(() =>
  isOpen.value ? 'Fermer le menu' : 'Ouvrir le menu'
)
</script>

<template>
  <!-- Boolean → "true" / "false" (string ARIA) -->
  <button
    :aria-expanded="isOpen"
    :aria-label="toggleLabel"
    :aria-controls="isOpen ? 'dropdown-menu' : undefined"
    @click="isOpen = !isOpen"
  >
    Menu
  </button>

  <!-- aria-busy pour les états de chargement -->
  <div role="status" :aria-busy="isLoading">
    <span v-if="isLoading">Chargement…</span>
    <slot v-else />
  </div>

  <!-- aria-selected dans un listbox -->
  <ul role="listbox" aria-label="Membres">
    <li
      v-for="item in items"
      :key="item.id"
      role="option"
      :aria-selected="item.id === selectedId"
      :tabindex="item.id === selectedId ? 0 : -1"
      @click="selectedId = item.id"
    >
      {{ item.label }}
    </li>
  </ul>
</template>
```

**Conversion Vue → HTML pour les attributs `aria-*` :**
- `true` (boolean) → `"true"` (string) — Vue convertit correctement pour ARIA
- `false` (boolean) → `"false"` (string) — diffère des attributs booléens HTML standards (`hidden`, `disabled` qui seraient retirés)
- `undefined` → attribut **absent** du DOM — utiliser `undefined` pour retirer un attribut ARIA conditionnel

```vue
<!-- ✅ aria-controls absent quand le menu est fermé -->
:aria-controls="isOpen ? 'menu-id' : undefined"
```

### 2.7 Annonces de changement de route en SPA

Vue Router ne notifie pas les AT lors d'une navigation. L'utilisateur de lecteur d'écran ne sait pas que la page a changé — il n'entend pas de titre, pas d'annonce.

**Pattern standard — watcher sur `route.fullPath` :**

```ts
// App.vue ou composant de layout racine
import { ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const routeAnnouncement = ref('')

watch(
  () => route.fullPath,
  async () => {
    // nextTick : attendre que le titre de la page soit mis à jour
    // (vue-router ou useHead de Nuxt ont mis à jour document.title)
    await nextTick()
    routeAnnouncement.value = ''
    await nextTick()
    routeAnnouncement.value = `Page chargée : ${document.title}`
  }
)
```

```html
<!-- Dans le template du layout — toujours présente, jamais conditionnelle -->
<div aria-live="polite" aria-atomic="true" class="sr-only">
  {{ routeAnnouncement }}
</div>
```

En Nuxt, `useHead({ title: '...' })` met à jour `document.title` avant la complétion de la navigation — le pattern ci-dessus fonctionne sans ajustement.

---

## 3. Worked examples

### Exemple 1 — Modale d'invitation accessible avec focus trap (TribuZen)

**Composable `useFocusTrap.ts` :**

```ts
// composables/useFocusTrap.ts
import { watch, onUnmounted, nextTick, type Ref } from 'vue'

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
  // Élément focalisé avant l'ouverture — pour la restauration
  let previouslyFocused: HTMLElement | null = null

  function getFocusable(): HTMLElement[] {
    if (!containerRef.value) return []
    return Array.from(
      containerRef.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    )
  }

  function handleTab(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return

    const focusable = getFocusable()
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      // Shift+Tab depuis le premier élément → aller au dernier
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      // Tab depuis le dernier élément → aller au premier
      event.preventDefault()
      first.focus()
    }
    // Dans tous les autres cas : comportement Tab natif (se déplace dans la modale)
  }

  async function activate(): Promise<void> {
    // Sauvegarder le déclencheur avant de déplacer le focus
    previouslyFocused = document.activeElement as HTMLElement
    document.addEventListener('keydown', handleTab)

    // nextTick : attendre que le DOM soit mis à jour (v-if a rendu le contenu)
    await nextTick()
    const focusable = getFocusable()
    if (focusable.length > 0) {
      focusable[0].focus()
    }
  }

  function deactivate(): void {
    document.removeEventListener('keydown', handleTab)
    // Restaurer le focus sur l'élément qui a ouvert la modale
    previouslyFocused?.focus()
    previouslyFocused = null
  }

  // flush: 'post' garantit que le DOM est à jour avant activate()
  watch(isActive, (active) => {
    if (active) activate()
    else deactivate()
  }, { flush: 'post' })

  // Nettoyage si le composant est démonté pendant que la modale est ouverte
  onUnmounted(deactivate)
}
```

**Composant `InviteModal.vue` :**

```vue
<!-- InviteModal.vue — modale d'invitation TribuZen accessible -->
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

// useTemplateRef (Vue 3.5) — découple le nom de variable du nom d'attribut ref
const dialogEl = useTemplateRef<HTMLElement>('dialog-el')

// Le focus trap s'active quand props.open est true
const isOpen = computed(() => props.open)
useFocusTrap(dialogEl, isOpen)

const emailInput = ref('')
const error = ref<string | null>(null)
const announcement = ref('')

function closeModal(): void {
  emailInput.value = ''
  error.value = null
  announcement.value = ''
  emit('close')
}

async function sendInvite(): Promise<void> {
  error.value = null

  if (!emailInput.value.trim()) {
    error.value = 'L\'adresse email est requise.'
    // role="alert" annonce déjà — pas besoin d'aria-live supplémentaire
    return
  }

  emit('invite', emailInput.value.trim())

  // Annonce de succès via live region polite
  announcement.value = ''
  await nextTick()
  announcement.value = `Invitation envoyée à ${emailInput.value.trim()}.`
}
</script>

<template>
  <!-- Teleport : rend la modale en dehors du flux normal,
       évite les problèmes de z-index et d'overflow hidden -->
  <Teleport to="body">
    <div
      v-if="open"
      class="overlay"
      @click.self="closeModal"
      @keydown.escape="closeModal"
    >
      <!--
        role="dialog"       : annonce la nature de l'élément
        aria-modal="true"   : dit aux AT d'ignorer le fond (ne remplace pas le focus trap)
        aria-labelledby     : pointe vers le titre visible de la modale
        aria-describedby    : pointe vers la description (contexte supplémentaire)
        ref="dialog-el"     : lié à useTemplateRef('dialog-el') dans le script
      -->
      <div
        ref="dialog-el"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-title"
        aria-describedby="invite-desc"
        class="modal"
      >
        <h2 id="invite-title">Inviter quelqu'un dans la tribu</h2>
        <p id="invite-desc">
          L'invité recevra un email avec un lien d'activation.
        </p>

        <!-- Label explicite associé via for/id -->
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
          role="alert" = aria-live="assertive" implicite + aria-atomic="true"
          Annonce immédiatement l'erreur — justifié ici car l'utilisateur
          vient de soumettre et l'erreur bloque l'action
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
          <button type="button" @click="sendInvite">
            Envoyer l'invitation
          </button>
          <button type="button" @click="closeModal">
            Annuler
          </button>
        </div>

        <!--
          Région live polite pour le succès — toujours présente dans le DOM
          Distincte de role="alert" car non urgente
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

/* Classe utilitaire — élément visible uniquement pour les AT */
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

**Ce que ce composant gère correctement :**

| Critère | Solution |
|---------|----------|
| Sémantique | `role="dialog"` + `aria-modal` + `aria-labelledby` + `aria-describedby` |
| Focus ouverture | `useFocusTrap` → `activate()` → `focusable[0].focus()` |
| Focus trap | `handleTab` intercepte Tab/Shift+Tab dans le conteneur |
| Focus fermeture | `deactivate()` → `previouslyFocused.focus()` |
| Clavier Escape | `@keydown.escape="closeModal"` sur l'overlay |
| Erreur inline | `role="alert"` + `aria-invalid` + `aria-describedby` sur l'input |
| Succès | `aria-live="polite"` distinct de l'alerte d'erreur |

### Exemple 2 — Tabs accessibles avec roving tabindex

```vue
<!-- AccessibleTabs.vue -->
<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'

interface Tab {
  id: string
  label: string
}

const props = defineProps<{ tabs: Tab[] }>()
const activeIndex = ref(0)

// useTemplateRef avec v-for → collecte un tableau de boutons (Vue 3.5)
const tabRefs = useTemplateRef<HTMLButtonElement[]>('tab-btns')

function activateTab(index: number): void {
  activeIndex.value = index
}

function handleKeydown(event: KeyboardEvent, index: number): void {
  const last = props.tabs.length - 1
  let next = index

  switch (event.key) {
    case 'ArrowRight':
      // Wrap : dernier → premier
      next = index < last ? index + 1 : 0
      break
    case 'ArrowLeft':
      // Wrap : premier → dernier
      next = index > 0 ? index - 1 : last
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = last
      break
    default:
      return // Ne pas prévenir le comportement par défaut pour les autres touches
  }

  event.preventDefault()
  activateTab(next)
  // Roving tabindex : déplacer le focus sur le nouvel onglet actif
  tabRefs.value?.[next]?.focus()
}
</script>

<template>
  <!-- role="tablist" sur le conteneur -->
  <div role="tablist" aria-label="Navigation par onglets">
    <button
      v-for="(tab, index) in tabs"
      :key="tab.id"
      ref="tab-btns"
      :id="`tab-${tab.id}`"
      role="tab"
      :aria-selected="index === activeIndex"
      :aria-controls="`panel-${tab.id}`"
      :tabindex="index === activeIndex ? 0 : -1"
      @click="activateTab(index)"
      @keydown="handleKeydown($event, index)"
    >
      {{ tab.label }}
    </button>
  </div>

  <!-- role="tabpanel" sur chaque panneau -->
  <div
    v-for="(tab, index) in tabs"
    :key="tab.id"
    :id="`panel-${tab.id}`"
    role="tabpanel"
    :aria-labelledby="`tab-${tab.id}`"
    :hidden="index !== activeIndex"
    tabindex="0"
  >
    <!-- Named slots par id d'onglet -->
    <slot :name="tab.id" />
  </div>
</template>
```

**Points clés du pattern Tabs APG :**
- `aria-selected` (et non `aria-checked`) — les tabs utilisent `aria-selected`
- Roving tabindex : un seul `tabindex="0"` dans le groupe, les autres à `-1`
- La touche Tab ne navigue PAS entre onglets — elle sort du groupe (vers le `tabpanel` qui a `tabindex="0"`)
- Flèches gauche/droite activent ET focalisent l'onglet simultanément (pattern "automatic activation" APG)
- `hidden` sur `tabpanel` (attribut HTML) : masque visuellement ET aux AT

---

## 4. Pièges & misconceptions

### PIÈGE #1 — `role="button"` sur `<div>` — iceberg de complexité

```html
<!-- ❌ Il manque au moins 3 choses pour approcher un vrai button -->
<div role="button" @click="open">Ouvrir</div>
```

Pour reproduire `<button>` avec une `<div>`, il faut AUSSI :
- `tabindex="0"` — la div n'est pas focusable nativement
- `@keydown.enter.space.prevent="open"` — la div ne réagit pas à Enter/Space nativement
- Styles de focus visibles — `:focus-visible` ne s'applique pas automatiquement

```html
<!-- ✅ <button> inclut tout nativement -->
<button @click="open">Ouvrir</button>
```

### PIÈGE #2 — ARIA redondant sur HTML natif

```html
<!-- ❌ Ces ARIA sont redondants — la sémantique est déjà dans l'élément HTML -->
<button role="button">Valider</button>
<nav role="navigation">...</nav>
<a href="/about" role="link">À propos</a>
<h1 role="heading" aria-level="1">Titre</h1>
```

Ces redondances sont inoffensives dans le meilleur cas, conflictuelles si une faute de frappe introduit un rôle incorrect (`role="botton"`). Supprimer toute ARIA que le HTML natif exprime déjà.

### PIÈGE #3 — Région `aria-live` conditionnelle avec `v-if`

```vue
<!-- ❌ La région apparaît dans le DOM AVEC le contenu déjà présent -->
<!-- Certains AT (VoiceOver notamment) ne lisent pas ce premier contenu -->
<div v-if="errorMsg" aria-live="assertive" role="alert">
  {{ errorMsg }}
</div>
```

```vue
<!-- ✅ Toujours présente dans le DOM, contenu vide par défaut -->
<div aria-live="assertive" role="alert" class="sr-only">
  {{ errorMsg }}
</div>
```

### PIÈGE #4 — Focus perdu à l'ouverture de modale

```vue
<!-- ❌ La modale s'ouvre, le focus reste sur le bouton "Ouvrir" derrière elle -->
<button @click="isOpen = true">Ouvrir la modale</button>
<div v-if="isOpen" role="dialog" aria-modal="true">
  <input type="text" />
  <button @click="isOpen = false">Fermer</button>
</div>
```

Sans appel à `.focus()` sur un élément de la modale après l'ouverture, l'utilisateur clavier ne peut pas interagir avec le contenu de la modale — le focus est piégé sur le déclencheur, "derrière" la modale.

Solution : `useFocusTrap` (Exemple 1), ou utiliser l'élément `<dialog>` natif avec `.showModal()` qui gère le focus nativement dans les navigateurs modernes.

### PIÈGE #5 — `aria-modal="true"` ne remplace pas le focus trap

`aria-modal="true"` indique aux AT d'ignorer le contenu hors de la modale dans leur arbre virtuel. Il ne bloque pas la navigation clavier Tab hors du conteneur modal. Un utilisateur peut encore Tab jusqu'aux éléments du fond de page.

Le focus trap (gestion de `keydown Tab` dans le composable) reste indispensable en complément de `aria-modal`.

### PIÈGE #6 — `aria-hidden="true"` sur un élément focusable

```html
<!-- ❌ L'AT ignore l'élément mais le clavier peut encore y atterrir -->
<button aria-hidden="true">Bouton "invisible" pour les AT</button>
```

Un utilisateur de lecteur d'écran qui navigue au clavier atterrira sur ce bouton sans annonce — désorientation totale. Si `aria-hidden="true"` est nécessaire, ajouter aussi `tabindex="-1"` pour retirer l'élément de l'ordre de tab.

---

## 5. Ancrage TribuZen

Trois couches du front-office TribuZen où ce module s'applique directement :

**`InviteModal.vue`** (Exemple 1 complet) — toute invitation passe par cette modale. C'est la pièce maîtresse de l'expérience "agrandir sa tribu". `role="dialog"` + `aria-modal` + focus trap + live region polite pour le succès.

**Feed principal `FeedView.vue`** — les nouvelles activités (nouveau membre, nouveau message) apparaissent dynamiquement dans le feed. Une région `aria-live="polite"` en `AppLayout.vue` annonce les nouveautés pertinentes sans interrompre l'utilisateur. Les annonces sont limitées aux événements importants (nouveau membre, non à chaque ligne du feed).

**Navigation principale `NavMenu.vue`** — menu de navigation avec sous-menus par contexte (Tribu, Agenda, Membres). Pattern menu button : `aria-expanded` sur le bouton + `aria-haspopup="menu"` + `role="menu"` / `role="menuitem"` sur le sous-menu + Escape pour fermer + flèches pour naviguer dans le menu.

**`AppLayout.vue`** — skip link ("Aller au contenu principal") + watcher de route pour annoncer les changements de page (section 2.7).

```
tribuzen/
  src/
    components/
      modal/
        InviteModal.vue          ← Exemple 1 complet
      layout/
        AppLayout.vue            ← skip link + aria-live route announcer
        NavMenu.vue              ← aria-expanded / aria-haspopup / role="menu"
      ui/
        AccessibleTabs.vue       ← Exemple 2 complet
    composables/
      useFocusTrap.ts            ← Exemple 1 composable
```

---

## 6. Points clés

1. Première règle ARIA — HTML natif d'abord : `<button>`, `<nav>`, `<dialog>`, `<input>`, `<select>`, `<details>` couvrent la majorité des cas sans ARIA supplémentaire.
2. Rôles = nature de l'élément, propriétés = relations et labels stables, états = valeur courante qui change au runtime.
3. `role="status"` = `aria-live="polite"` implicite ; `role="alert"` = `aria-live="assertive"` implicite — connaître ces raccourcis.
4. `aria-live="assertive"` interrompt l'utilisateur — réserver aux erreurs critiques ; tout le reste → `"polite"`.
5. La région live doit être présente dans le DOM AVANT tout changement de contenu — jamais sous `v-if` conditionnel.
6. Annonce répétée du même texte : vider d'abord, remplir au `nextTick` suivant pour forcer la détection du changement.
7. Focus modale : déplacer à l'ouverture, piéger (Tab/Shift+Tab), restaurer au déclencheur à la fermeture.
8. `aria-modal="true"` masque le fond aux AT mais ne bloque pas Tab — le focus trap (keydown) reste obligatoire.
9. Tabs : `aria-selected` (pas `aria-checked`), roving tabindex, flèches pour naviguer dans le groupe, Tab sort vers le panel.
10. Vue + ARIA : `undefined` retire l'attribut du DOM, `false` l'écrit `"false"` (string) — comportement différent des attributs booléens HTML natifs.
11. En SPA, watcher sur `route.fullPath` + `nextTick` + région `aria-live="polite"` pour annoncer les changements de page.

---

## 7. Seeds Anki

```
Quelle est la première règle de l'ARIA ?|Si un élément HTML natif (button, nav, input, dialog…) couvre la sémantique et le comportement requis, l'utiliser plutôt qu'ARIA sur un div. ARIA comble les lacunes du HTML, il ne le remplace pas.
Quelle est la différence entre aria-live polite et assertive ?|polite annonce quand l'utilisateur est inactif entre deux utterances — non intrusif. assertive interrompt l'annonce en cours immédiatement — réservé aux alertes critiques (erreur de paiement, session expirée). L'abus d'assertive est disruptif.
Pourquoi une région aria-live ne doit-elle pas être sous v-if ?|Certains AT ne lisent pas le contenu d'une région qui vient d'apparaître dans le DOM avec du texte déjà présent. La région doit être dans le DOM dès le montage, vide, et le texte doit changer dynamiquement.
Quelles sont les trois obligations d'une modale accessible ?|1. Sémantique : role="dialog" + aria-modal="true" + aria-labelledby. 2. Focus : déplacer dans la modale à l'ouverture, restaurer sur le déclencheur à la fermeture. 3. Focus trap : Tab et Shift+Tab restent dans la modale, Escape la ferme.
aria-modal="true" remplace-t-il le focus trap sur une modale ?|Non. aria-modal="true" indique aux AT d'ignorer le contenu hors de la modale dans leur arbre virtuel. Le focus clavier peut encore sortir de la modale via Tab. Le focus trap (gestion keydown) doit être implémenté séparément.
Quel attribut utilisent les tabs pour indiquer l'onglet actif — aria-selected ou aria-checked ?|aria-selected. aria-checked est réservé aux éléments de type checkbox, radio et menuitemcheckbox. Les composants tab et option utilisent aria-selected.
Comment Vue gère-t-il la conversion boolean → ARIA pour les attributs aria-* ?|true → "true" (string), false → "false" (string). Différent des attributs booléens HTML natifs (hidden, disabled) qui seraient retirés si false. undefined retire l'attribut du DOM — utiliser pour rendre un aria-* conditionnel absent.
Comment annoncer un changement de route en SPA Vue ?|Watcher sur route.fullPath avec await nextTick() (titre mis à jour), puis vider et remplir un ref dans une région aria-live="polite" présente dans AppLayout. Vider d'abord pour que l'AT détecte le changement même si le titre ne change pas.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-39-accessibilite-aria-et-vue/README.md`. Construire de A à Z `InviteModal.vue` avec focus trap + live region, valider avec l'arbre d'accessibilité Chrome DevTools et la navigation clavier.
