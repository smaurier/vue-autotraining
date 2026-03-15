# 02 — ARIA et Vue 3

> **Premiere regle d'ARIA : ne pas utiliser ARIA si le HTML natif suffit.**
> Un `<button>` est toujours preferable a un `<div role="button">`.
> ARIA comble les lacunes du HTML natif, il ne le remplace pas.

---

> **🔄 Rappel du cours precedent**
> Avant de continuer, verifie que tu peux repondre a ces questions :
> 1. Quels sont les 4 principes de WCAG (POUR) ?
> 2. Quel est le ratio de contraste minimum pour le niveau AA ?
> 3. Pourquoi un `<button>` est-il preferable a un `<div @click>` ?
>
> <details>
> <summary>Verifier mes reponses</summary>
>
> 1. Perceptible, Operable, Comprehensible (Understandable), Robuste
> 2. 4.5:1 pour le texte normal, 3:1 pour les gros textes
> 3. Le `<button>` est nativement focusable, annonce comme bouton par les lecteurs d'ecran, et reagit a Enter/Space
> </details>

---

## 📖 Qu'est-ce qu'ARIA ?

**ARIA** (Accessible Rich Internet Applications) est un ensemble d'attributs HTML qui enrichissent la semantique pour les technologies d'assistance (lecteurs d'ecran, plages braille, etc.).

ARIA definit 3 types d'informations :

| Type | Exemples | Role |
|------|----------|------|
| **Roles** | `role="dialog"`, `role="tab"`, `role="alert"` | Ce qu'EST l'element |
| **Proprietes** | `aria-label`, `aria-describedby`, `aria-controls` | Ce que l'element SIGNIFIE |
| **Etats** | `aria-expanded`, `aria-selected`, `aria-disabled` | L'ETAT actuel de l'element |

---

## 🗣️ `aria-live` — Annonces dynamiques

En SPA (Single Page Application), le contenu change sans rechargement de page. Les lecteurs d'ecran ne detectent pas ces changements automatiquement. `aria-live` resout ce probleme.

### Les 3 valeurs

| Valeur | Comportement | Utilisation |
|--------|-------------|-------------|
| `off` | Pas d'annonce (defaut) | Contenu statique |
| `polite` | Annonce quand l'utilisateur est inactif | Notifications, confirmations |
| `assertive` | Interrompt immediatement | Erreurs critiques, alertes urgentes |

### Composable `useAnnouncer`

```ts
// composables/useAnnouncer.ts
import { ref, onMounted, onUnmounted } from 'vue'

type AriaPoliteness = 'polite' | 'assertive'

interface Announcer {
  announce: (message: string, priority?: AriaPoliteness) => void
  announcerProps: {
    role: string
    'aria-live': AriaPoliteness
    'aria-atomic': string
  }
  message: ReturnType<typeof ref<string>>
}

export function useAnnouncer(): Announcer {
  const message = ref('')
  const priority = ref<AriaPoliteness>('polite')
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  function announce(text: string, level: AriaPoliteness = 'polite'): void {
    // Vider d'abord pour forcer la re-annonce si meme texte
    message.value = ''
    priority.value = level

    // Remplir au prochain tick pour que le navigateur detecte le changement
    requestAnimationFrame(() => {
      message.value = text
    })

    // Nettoyer apres 5 secondes
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      message.value = ''
    }, 5000)
  }

  onUnmounted(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })

  return {
    announce,
    message,
    announcerProps: {
      role: 'status',
      'aria-live': priority.value,
      'aria-atomic': 'true',
    },
  }
}
```

### Utilisation dans un composant

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useAnnouncer } from '@/composables/useAnnouncer'

const { announce, message } = useAnnouncer()
const items = ref<string[]>([])

function addItem(name: string): void {
  items.value.push(name)
  announce(`${name} ajoute a la liste. ${items.value.length} element${items.value.length > 1 ? 's' : ''} au total.`)
}

function removeItem(index: number): void {
  const removed = items.value.splice(index, 1)[0]
  announce(`${removed} retire de la liste.`)
}
</script>

<template>
  <ul aria-label="Liste des elements">
    <li v-for="(item, index) in items" :key="item">
      {{ item }}
      <button @click="removeItem(index)" :aria-label="`Retirer ${item}`">
        Retirer
      </button>
    </li>
  </ul>

  <!-- Region d'annonce invisible -->
  <div aria-live="polite" aria-atomic="true" class="sr-only">
    {{ message }}
  </div>
</template>
```

---

## 🏷️ `aria-label` et `aria-labelledby`

Ces attributs donnent un **nom accessible** aux elements.

| Attribut | Quand l'utiliser | Exemple |
|----------|-----------------|---------|
| `aria-label` | Pas de texte visible pour nommer l'element | `<button aria-label="Fermer">X</button>` |
| `aria-labelledby` | Un element visible sert de label | `<dialog aria-labelledby="dialog-title">` |
| `aria-describedby` | Un element visible fournit une description supplementaire | `<input aria-describedby="email-help">` |

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(false)
</script>

<template>
  <!-- aria-labelledby pointe vers l'id du titre -->
  <dialog
    :open="isOpen"
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-title"
    aria-describedby="confirm-desc"
  >
    <h2 id="confirm-title">Confirmer la suppression</h2>
    <p id="confirm-desc">
      Cette action est irreversible. Voulez-vous vraiment supprimer cet element ?
    </p>
    <button @click="isOpen = false">Annuler</button>
    <button @click="isOpen = false">Supprimer</button>
  </dialog>
</template>
```

---

## 🔄 Roles dynamiques avec Vue

Les roles ARIA permettent de creer des widgets complexes. Voici les patterns les plus courants.

### Onglets (Tabs)

```vue
<script setup lang="ts">
import { ref } from 'vue'

interface Tab {
  id: string
  label: string
  content: string
}

const tabs: Tab[] = [
  { id: 'general', label: 'General', content: 'Parametres generaux...' },
  { id: 'security', label: 'Securite', content: 'Parametres de securite...' },
  { id: 'notifications', label: 'Notifications', content: 'Parametres de notification...' },
]

const activeTab = ref(tabs[0].id)

function selectTab(tabId: string): void {
  activeTab.value = tabId
}

function handleTabKeydown(event: KeyboardEvent, index: number): void {
  let newIndex = index

  switch (event.key) {
    case 'ArrowRight':
      newIndex = (index + 1) % tabs.length
      break
    case 'ArrowLeft':
      newIndex = (index - 1 + tabs.length) % tabs.length
      break
    case 'Home':
      newIndex = 0
      break
    case 'End':
      newIndex = tabs.length - 1
      break
    default:
      return // Ne pas prevenir le comportement par defaut
  }

  event.preventDefault()
  selectTab(tabs[newIndex].id)

  // Deplacer le focus vers le nouvel onglet
  const tabElement = document.getElementById(`tab-${tabs[newIndex].id}`)
  tabElement?.focus()
}
</script>

<template>
  <!-- Conteneur des onglets -->
  <div role="tablist" aria-label="Parametres">
    <button
      v-for="(tab, index) in tabs"
      :key="tab.id"
      :id="`tab-${tab.id}`"
      role="tab"
      :aria-selected="activeTab === tab.id"
      :aria-controls="`panel-${tab.id}`"
      :tabindex="activeTab === tab.id ? 0 : -1"
      @click="selectTab(tab.id)"
      @keydown="handleTabKeydown($event, index)"
    >
      {{ tab.label }}
    </button>
  </div>

  <!-- Panneaux de contenu -->
  <div
    v-for="tab in tabs"
    :key="tab.id"
    :id="`panel-${tab.id}`"
    role="tabpanel"
    :aria-labelledby="`tab-${tab.id}`"
    :hidden="activeTab !== tab.id"
    tabindex="0"
  >
    {{ tab.content }}
  </div>
</template>
```

**Points cles du pattern Tabs :**
- `role="tablist"` sur le conteneur
- `role="tab"` sur chaque onglet
- `role="tabpanel"` sur chaque panneau
- `aria-selected` sur l'onglet actif
- `tabindex="-1"` sur les onglets inactifs (un seul onglet dans le flux Tab)
- Fleches gauche/droite pour naviguer entre les onglets

---

## 🔒 Focus Trap — Pieger le focus dans une modale

Quand une modale est ouverte, le focus **ne doit pas sortir** du conteneur. C'est le pattern "focus trap".

```ts
// composables/useFocusTrap.ts
import { onMounted, onUnmounted, type Ref, watch } from 'vue'

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
  let previouslyFocused: HTMLElement | null = null

  function getFocusableElements(): HTMLElement[] {
    if (!containerRef.value) return []
    return Array.from(
      containerRef.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    )
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return

    const focusable = getFocusableElements()
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    // Shift+Tab sur le premier element → aller au dernier
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    }
    // Tab sur le dernier element → aller au premier
    else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  function activate(): void {
    previouslyFocused = document.activeElement as HTMLElement
    document.addEventListener('keydown', handleKeydown)

    // Focus le premier element focusable du conteneur
    const focusable = getFocusableElements()
    if (focusable.length > 0) {
      focusable[0].focus()
    }
  }

  function deactivate(): void {
    document.removeEventListener('keydown', handleKeydown)
    // Restaurer le focus precedent
    previouslyFocused?.focus()
  }

  watch(isActive, (active) => {
    if (active) activate()
    else deactivate()
  })

  onUnmounted(deactivate)
}
```

### Utilisation dans une modale Vue

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFocusTrap } from '@/composables/useFocusTrap'

const props = defineProps<{
  open: boolean
  title: string
}>()

const emit = defineEmits<{
  (_e: 'close'): void
}>()

const dialogRef = ref<HTMLElement | null>(null)
const isOpen = computed(() => props.open)

useFocusTrap(dialogRef, isOpen)

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="modal-overlay"
      @click.self="emit('close')"
      @keydown="handleKeydown"
    >
      <div
        ref="dialogRef"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`modal-title-${title}`"
      >
        <h2 :id="`modal-title-${title}`">{{ title }}</h2>
        <slot />
        <button @click="emit('close')">Fermer</button>
      </div>
    </div>
  </Teleport>
</template>
```

---

## ⌨️ Skip Links — Navigation rapide

Le **skip link** permet aux utilisateurs clavier de sauter la navigation pour acceder directement au contenu.

```vue
<script setup lang="ts">
// App.vue ou SiteScaffold.vue
function skipToContent(): void {
  const main = document.getElementById('main-content')
  if (main) {
    main.setAttribute('tabindex', '-1')
    main.focus()
  }
}
</script>

<template>
  <a
    href="#main-content"
    class="skip-link"
    @click.prevent="skipToContent"
  >
    Aller au contenu principal
  </a>

  <header>
    <nav aria-label="Navigation principale">
      <!-- ... liens de navigation ... -->
    </nav>
  </header>

  <main id="main-content">
    <slot />
  </main>
</template>

<style scoped>
.skip-link {
  position: absolute;
  top: -100%;
  left: 1rem;
  z-index: 9999;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary, #1a73e8);
  color: #fff;
  border-radius: 0 0 0.5rem 0.5rem;
  text-decoration: none;
  font-weight: 600;
}

.skip-link:focus {
  top: 0;
}
</style>
```

---

## 🎹 Navigation clavier — Les conventions

| Touche | Comportement attendu |
|--------|---------------------|
| **Tab** | Passer a l'element focusable suivant |
| **Shift+Tab** | Revenir a l'element focusable precedent |
| **Enter** | Activer un lien ou un bouton |
| **Space** | Activer un bouton, cocher une case |
| **Escape** | Fermer une modale, un dropdown, un tooltip |
| **Fleches** | Naviguer dans un groupe (onglets, menu, liste) |
| **Home / End** | Premier / dernier element d'un groupe |

### Pattern "Roving tabindex"

Dans un groupe d'elements (tabs, menu), un seul element a `tabindex="0"`. Les autres ont `tabindex="-1"`. Les fleches deplacent le focus au sein du groupe.

```ts
// composables/useRovingTabindex.ts
import { ref, type Ref } from 'vue'

export function useRovingTabindex(itemCount: Ref<number>) {
  const activeIndex = ref(0)

  function handleKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault()
        activeIndex.value = (activeIndex.value + 1) % itemCount.value
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault()
        activeIndex.value =
          (activeIndex.value - 1 + itemCount.value) % itemCount.value
        break
      case 'Home':
        event.preventDefault()
        activeIndex.value = 0
        break
      case 'End':
        event.preventDefault()
        activeIndex.value = itemCount.value - 1
        break
    }
  }

  function getTabindex(index: number): 0 | -1 {
    return index === activeIndex.value ? 0 : -1
  }

  return { activeIndex, handleKeydown, getTabindex }
}
```

---

## 🎯 Pratique

### Exercice ARIA.1 — Creer une region live

Cree un composant notification qui annonce les messages au lecteur d'ecran :

```vue
<script setup lang="ts">
import { ref } from 'vue'
// Ajoute une region aria-live et fais-la fonctionner
const message = ref('')
</script>

<template>
  <!-- ??? -->
</template>
```

<details>
<summary>Solution</summary>

```vue
<script setup lang="ts">
import { ref } from 'vue'

const message = ref('')

function notify(text: string): void {
  message.value = ''
  requestAnimationFrame(() => {
    message.value = text
  })
}
</script>

<template>
  <button @click="notify('Action effectuee avec succes')">
    Tester la notification
  </button>
  <div aria-live="polite" aria-atomic="true" class="sr-only">
    {{ message }}
  </div>
</template>
```
</details>

---

### Exercice ARIA.2 — Focus trap

Explique pourquoi ce code ne fonctionne pas correctement et corrige-le :

```vue
<template>
  <div v-if="isOpen" class="modal">
    <h2>Titre</h2>
    <input type="text" />
    <button @click="isOpen = false">Fermer</button>
  </div>
</template>
```

<details>
<summary>Solution</summary>

**Problemes :**
1. Pas de `role="dialog"` ni `aria-modal="true"`
2. Pas de focus trap — le Tab sort de la modale
3. Pas de `aria-labelledby` pour nommer la modale
4. Pas de gestion de Escape
5. Le focus n'est pas deplace dans la modale a l'ouverture
6. Le focus n'est pas restaure a la fermeture

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useFocusTrap } from '@/composables/useFocusTrap'

const isOpen = ref(false)
const modalRef = ref<HTMLElement | null>(null)

useFocusTrap(modalRef, isOpen)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      ref="modalRef"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-heading"
      @keydown.escape="isOpen = false"
    >
      <h2 id="modal-heading">Titre</h2>
      <input type="text" />
      <button @click="isOpen = false">Fermer</button>
    </div>
  </Teleport>
</template>
```
</details>

---

## Suite

→ `cours/09-accessibilite/03-audit-a11y.md`
