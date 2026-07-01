# Lab 07 — Options API vs Composition API

> **Outcome :** à la fin, tu sais migrer un composant Options API vers `<script setup lang="ts">` et vérifier la conformité TypeScript avec `vue-tsc --noEmit`.
> **Vrai outil :** `vue-tsc --noEmit` — le compilateur TypeScript Vue. Zéro erreur = migration correcte.
> **Feedback :** le coach valide les choix de découpage en session (quoi extraire en composable, quoi garder local).

---

## Énoncé

Tu reçois `NotificationPanel.vue` — un composant hérité du CMS TribuZen, écrit en Options API. Il affiche les notifications d'un utilisateur, permet de les filtrer par type, et de les marquer toutes comme lues.

**Ta mission :** migrer ce composant vers `<script setup lang="ts">` en préservant le comportement exact. L'oracle est `vue-tsc --noEmit` : zéro erreur TypeScript = migration réussie.

### Starter : `NotificationPanel.vue` (Options API)

Crée ce fichier dans `src/components/notifications/NotificationPanel.vue` de ton projet TribuZen (ou d'un projet `pnpm create vue@latest` dédié).

```vue
<!-- NotificationPanel.vue — Options API legacy — NE PAS MODIFIER CE STARTER -->
<script lang="ts">
import { defineComponent } from 'vue'

type NotifType = 'info' | 'warning' | 'success'

interface Notification {
  id: number
  type: NotifType
  message: string
  read: boolean
  createdAt: string
}

export default defineComponent({
  data() {
    return {
      notifications: [] as Notification[],
      activeFilter: 'all' as NotifType | 'all',
      loading: false,
    }
  },

  computed: {
    filtered(): Notification[] {
      if (this.activeFilter === 'all') return this.notifications
      return this.notifications.filter(n => n.type === this.activeFilter)
    },
    unreadCount(): number {
      return this.notifications.filter(n => !n.read).length
    },
  },

  methods: {
    async fetchNotifications(): Promise<void> {
      this.loading = true
      try {
        const res = await fetch('/api/notifications')
        this.notifications = await res.json()
      } catch (e) {
        console.error('Fetch failed', e)
      } finally {
        this.loading = false
      }
    },

    setFilter(type: NotifType | 'all'): void {
      this.activeFilter = type
    },

    markAllRead(): void {
      this.notifications = this.notifications.map(n => ({ ...n, read: true }))
    },
  },

  mounted() {
    this.fetchNotifications()
  },
})
</script>

<template>
  <div class="notification-panel">
    <header>
      <h2>Notifications ({{ unreadCount }} non lues)</h2>
      <button @click="markAllRead" :disabled="unreadCount === 0">
        Tout marquer lu
      </button>
    </header>

    <nav>
      <button
        v-for="f in ['all', 'info', 'warning', 'success'] as const"
        :key="f"
        :class="{ active: activeFilter === f }"
        @click="setFilter(f)"
      >
        {{ f }}
      </button>
    </nav>

    <p v-if="loading">Chargement…</p>

    <ul v-else>
      <li
        v-for="n in filtered"
        :key="n.id"
        :class="['notif', n.type, { unread: !n.read }]"
      >
        <span>{{ n.message }}</span>
        <time>{{ n.createdAt }}</time>
      </li>
    </ul>
  </div>
</template>
```

---

## Étapes (en friction)

1. **Identifier les correspondances** — avant d'écrire une ligne, liste sur papier chaque option (`data`, `computed`, `methods`, `mounted`) et son équivalent Composition API. Utilise le tableau du module 07 comme référence, pas le corrigé ci-dessous.

2. **Migrer le bloc `<script>`** — remplace `<script lang="ts">` + `defineComponent({...})` par `<script setup lang="ts">`. Migre dans cet ordre : `data` → `computed` → `methods` → `mounted`. À chaque étape, note les `this.x` que tu dois transformer en `x.value`.

3. **Vérifier avec `vue-tsc --noEmit`** — depuis la racine du projet :
   ```bash
   pnpm vue-tsc --noEmit
   ```
   Résoudre chaque erreur TypeScript signalée avant de passer à l'étape suivante. Ne pas passer à l'étape 4 avec des erreurs restantes.

4. **Vérifier que le template n'a pas changé** — le `<template>` du composant migré doit être **byte-for-byte identique** au starter. Si tu as dû modifier le template, tu as un bug dans le script.

5. **Bonus — extraire `useNotificationFilter`** — si le temps le permet : extrais la logique `activeFilter + filtered` dans un composable `useNotificationFilter(notifications: Ref<Notification[]>)`. Lance `vue-tsc --noEmit` à nouveau pour valider.

---

## Corrigé complet commenté

```vue
<!-- NotificationPanel.vue — version Composition API migrée -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// ── Types ────────────────────────────────────────────────────────────────────
// Identiques au starter — les types ne changent pas lors d'une migration
type NotifType = 'info' | 'warning' | 'success'

interface Notification {
  id: number
  type: NotifType
  message: string
  read: boolean
  createdAt: string
}

// ── État (data → ref) ────────────────────────────────────────────────────────
// data() { return { notifications: [] } }  →  const notifications = ref<T[]>([])
// L'annotation générique est nécessaire : ref([]) serait Ref<never[]>
const notifications  = ref<Notification[]>([])

// data() { return { activeFilter: 'all' } }  →  ref avec union type
// On annote explicitement car la valeur initiale 'all' n'est pas représentative
// du type complet NotifType | 'all'
const activeFilter = ref<NotifType | 'all'>('all')

// data() { return { loading: false } }  →  inférence suffisante ici
const loading = ref(false)   // TypeScript infère Ref<boolean>

// ── État dérivé (computed: {} → computed()) ──────────────────────────────────
// computed: { filtered() { return this.notifications... } }
// → this disparaît, .value obligatoire dans le script
const filtered = computed<Notification[]>(() => {
  if (activeFilter.value === 'all') return notifications.value
  return notifications.value.filter(n => n.type === activeFilter.value)
})

// computed: { unreadCount() { return this.notifications.filter... } }
// Inférence suffisante : computed retourne number → pas besoin de computed<number>
const unreadCount = computed(() =>
  notifications.value.filter(n => !n.read).length
)

// ── Actions (methods: {} → fonctions plain) ──────────────────────────────────
// methods: { fetchNotifications() { this.loading = true; ... } }
// → function ordinaire, this.loading → loading.value
async function fetchNotifications(): Promise<void> {
  loading.value = true
  try {
    const res = await fetch('/api/notifications')
    notifications.value = await res.json()
  } catch (e) {
    // e est 'unknown' en TS strict — on ne fait pas e.message sans narrowing
    console.error('Fetch failed', e)
  } finally {
    loading.value = false
  }
}

// methods: { setFilter(type) { this.activeFilter = type } }
function setFilter(type: NotifType | 'all'): void {
  activeFilter.value = type
}

// methods: { markAllRead() { this.notifications = this.notifications.map(...) } }
function markAllRead(): void {
  notifications.value = notifications.value.map(n => ({ ...n, read: true }))
}

// ── Cycle de vie (mounted() → onMounted()) ───────────────────────────────────
// mounted() { this.fetchNotifications() }
// → onMounted reçoit une callback — pas de this
onMounted(() => { fetchNotifications() })
</script>

<!-- LE TEMPLATE EST IDENTIQUE AU STARTER — aucune modification requise -->
<!-- Vue auto-unwrap les refs de premier niveau dans le template            -->
<!-- notifications.value dans le script, mais notifications dans le template -->
<template>
  <div class="notification-panel">
    <header>
      <h2>Notifications ({{ unreadCount }} non lues)</h2>
      <button @click="markAllRead" :disabled="unreadCount === 0">
        Tout marquer lu
      </button>
    </header>

    <nav>
      <button
        v-for="f in ['all', 'info', 'warning', 'success'] as const"
        :key="f"
        :class="{ active: activeFilter === f }"
        @click="setFilter(f)"
      >
        {{ f }}
      </button>
    </nav>

    <p v-if="loading">Chargement…</p>

    <ul v-else>
      <li
        v-for="n in filtered"
        :key="n.id"
        :class="['notif', n.type, { unread: !n.read }]"
      >
        <span>{{ n.message }}</span>
        <time>{{ n.createdAt }}</time>
      </li>
    </ul>
  </div>
</template>
```

### Bonus — `useNotificationFilter.ts`

```ts
// src/composables/useNotificationFilter.ts
import { ref, computed, type Ref } from 'vue'

type NotifType = 'info' | 'warning' | 'success'

interface Notification {
  id: number
  type: NotifType
  message: string
  read: boolean
  createdAt: string
}

// Le composable reçoit ses dépendances en paramètre — pas de global implicite
export function useNotificationFilter(notifications: Ref<Notification[]>) {
  const activeFilter = ref<NotifType | 'all'>('all')

  const filtered = computed<Notification[]>(() => {
    if (activeFilter.value === 'all') return notifications.value
    return notifications.value.filter(n => n.type === activeFilter.value)
  })

  function setFilter(type: NotifType | 'all'): void {
    activeFilter.value = type
  }

  // Exports explicites : le consommateur sait exactement ce qu'il reçoit
  return { activeFilter, filtered, setFilter }
}
```

Usage dans le composant migré avec composable :

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNotificationFilter } from '@/composables/useNotificationFilter'

// ... types + notifications + loading + fetchNotifications + markAllRead ...

// Remplace activeFilter + filtered + setFilter locaux
const { activeFilter, filtered, setFilter } = useNotificationFilter(notifications)

// unreadCount reste local — spécifique à ce composant
const unreadCount = computed(() =>
  notifications.value.filter(n => !n.read).length
)

onMounted(() => { fetchNotifications() })
</script>
```

---

## Variante J+30 (fading)

Même composant, nouvelles contraintes :

1. **Contrainte temps :** migre en 20 minutes, sans regarder le corrigé.
2. **Contrainte TypeScript :** ajoute un `watch` sur `activeFilter` pour logger le changement dans la console, en TypeScript strict (`(newVal: NotifType | 'all') => void`). Lance `vue-tsc --noEmit` avant de considérer le lab terminé.
3. **Contrainte découplage :** extrait également `markAllRead` dans le composable `useNotificationFilter`, en faisant en sorte que le composable retourne une fonction `markAllRead` qui mute `notifications`. Assure-toi que la fonction reste testable sans monter de composant.

---

## Application TribuZen

Cible dans `smaurier/tribuzen` :

```
tribuzen/
  src/
    components/
      activity/
        ActivityFeed.vue          ← migrer de Options API vers <script setup>
    composables/
      useActivityFilter.ts        ← extraire depuis ActivityFeed après migration
```

Séquence de commits suggérée :

1. `test: ActivityFeed behavior before migration` — test de comportement avec `@vue/test-utils`
2. `refactor: migrate ActivityFeed to script setup` — migration pure, template inchangé
3. `refactor: extract useActivityFilter composable` — découplage de la logique filtre
4. `test: useActivityFilter unit tests` — tests du composable en isolation (Vitest, sans Vue)

Le commit 1 est le filet de sécurité. Sans lui, les commits 2-4 sont risqués.
