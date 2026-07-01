# Lab 15 — Pinia

> **Outcome :** à la fin, tu sais définir un store Pinia (style setup) avec state, getters et actions async, et le consommer dans un composant Vue 3 sans perdre la réactivité.
> **Vrai outil :** Pinia 2 + Vue 3.5 + Vite dev server.
> **Feedback :** le coach valide visuellement en session — pas de test-runner auto-correcteur.

---

## Énoncé

Tu construis la couche state management du dashboard TribuZen. Deux fichiers à produire :

1. `src/stores/family.ts` — le store `useFamilyStore`
2. `src/components/FamilyDashboard.vue` — le composant qui consomme le store

### Cahier des charges exact

**`useFamilyStore` doit exposer :**

| Propriété | Type | Description |
|---|---|---|
| `members` | `Member[]` | Liste de tous les membres |
| `isLoading` | `boolean` | Vrai pendant un fetch en cours |
| `error` | `string \| null` | Message d'erreur, ou null si pas d'erreur |
| `activeCount` | `number` (getter) | Nombre de membres avec `isActive: true` |
| `fetchMembers(familyId)` | `Promise<void>` | Charge les membres depuis l'API fictive |
| `addMember(name, familyId)` | `Promise<void>` | Ajoute un membre via POST API fictive |

**`FamilyDashboard.vue` doit afficher :**

1. Un indicateur de chargement (`isLoading`)
2. Un message d'erreur si `error !== null`
3. Le nombre de membres actifs (`activeCount`) sur le total
4. La liste complète des membres avec leur statut actif/inactif
5. Un formulaire d'ajout de membre (champ texte + bouton "Ajouter")

### Données de départ — mock API à coller dans `stores/family.ts`

```ts
interface Member {
  id: string
  name: string
  isActive: boolean
}

// Simule un appel réseau avec 200 ms de délai
async function mockFetch(familyId: string): Promise<Member[]> {
  await new Promise(r => setTimeout(r, 200))
  return [
    { id: 'm1', name: 'Alice', isActive: true  },
    { id: 'm2', name: 'Bob',   isActive: false },
    { id: 'm3', name: 'Cara',  isActive: true  },
  ]
}

async function mockPost(name: string): Promise<Member> {
  await new Promise(r => setTimeout(r, 150))
  return { id: `m${Date.now()}`, name, isActive: true }
}
```

**Pas de gap-fill** — tu écris les deux fichiers complets depuis les starters ci-dessous.

### Starters minimaux

Installe Pinia dans ton projet Vite si ce n'est pas déjà fait :

```bash
pnpm add pinia
# dans main.ts : app.use(createPinia())
```

```ts
// src/stores/family.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Colle ici interface Member + mockFetch + mockPost
// À toi d'écrire : state, getter, actions, return

export const useFamilyStore = defineStore('family', () => {
  // À compléter
})
```

```vue
<!-- src/components/FamilyDashboard.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useFamilyStore } from '@/stores/family'

// À compléter : destructurer le store correctement, appel onMounted
</script>

<template>
  <!-- À construire : indicateur chargement, erreur, activeCount, liste, formulaire -->
</template>
```

Lance le dev server (`pnpm dev`) et intègre `FamilyDashboard` dans `App.vue` pour voir le résultat.

---

## Étapes (en friction)

1. **Déclare les mocks** — colle `interface Member`, `mockFetch` et `mockPost` dans `stores/family.ts`.
2. **Écris le state** — `members`, `isLoading`, `error` avec les bons types (`ref<Member[]>`, `ref<string | null>`).
3. **Écris le getter** — `activeCount` via `computed()`, filtre `members.value` sur `isActive`.
4. **Écris `fetchMembers`** — pattern `isLoading = true` / try / catch (`error.value = ...`) / finally (`isLoading = false`).
5. **Écris `addMember`** — appelle `mockPost`, pousse le résultat dans `members.value` avec `.push()`.
6. **Retourne tout** — `members`, `isLoading`, `error`, `activeCount`, `fetchMembers`, `addMember`.
7. **Dans `FamilyDashboard.vue`** — appelle `useFamilyStore()`, déstructure avec `storeToRefs` pour state + getter, déstructure les actions directement depuis `store`.
8. **`onMounted`** — appelle `fetchMembers('fam-1')` au montage du composant.
9. **Construis le template** — indicateur de chargement, message d'erreur, compteur actifs/total, liste des membres, formulaire d'ajout.
10. **Vérifie les cas limites** — pendant le fetch (200 ms) : spinner visible ; modifier `mockFetch` pour lancer une erreur : message d'erreur affiché ; formulaire d'ajout : nouvelle ligne apparaît immédiatement sans rechargement.

---

## Corrigé complet commenté

```ts
// src/stores/family.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Member {
  id: string
  name: string
  isActive: boolean
}

// Mock API — remplacer par fetch('/api/families/:id/members') en vrai produit
async function mockFetch(familyId: string): Promise<Member[]> {
  await new Promise(r => setTimeout(r, 200))
  // familyId ignoré dans le mock
  return [
    { id: 'm1', name: 'Alice', isActive: true  },
    { id: 'm2', name: 'Bob',   isActive: false },
    { id: 'm3', name: 'Cara',  isActive: true  },
  ]
}

async function mockPost(name: string): Promise<Member> {
  await new Promise(r => setTimeout(r, 150))
  return { id: `m${Date.now()}`, name, isActive: true }
}

export const useFamilyStore = defineStore('family', () => {
  // ── STATE ─────────────────────────────────────────────────────────────────
  const members = ref<Member[]>([])           // liste vide au démarrage
  const isLoading = ref(false)                // vrai pendant un fetch
  const error = ref<string | null>(null)      // dernier message d'erreur

  // ── GETTER ────────────────────────────────────────────────────────────────
  // Se recalcule automatiquement quand members.value change
  const activeCount = computed(() =>
    members.value.filter(m => m.isActive).length
  )

  // ── ACTIONS ───────────────────────────────────────────────────────────────

  async function fetchMembers(familyId: string): Promise<void> {
    isLoading.value = true    // déclenche l'indicateur dans tous les composants consommateurs
    error.value = null        // reset l'erreur précédente avant toute nouvelle requête
    try {
      members.value = await mockFetch(familyId)
    } catch (e) {
      // e est 'unknown' en TypeScript strict — instanceof Error avant .message
      error.value = e instanceof Error ? e.message : 'Erreur de chargement'
    } finally {
      isLoading.value = false   // s'exécute toujours, succès ou erreur
    }
  }

  async function addMember(name: string, familyId: string): Promise<void> {
    try {
      const created = await mockPost(name)
      members.value.push(created)   // mise à jour optimiste : pas de re-fetch complet
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Erreur lors de l'ajout"
      throw e   // re-throw : le composant peut réagir (reset du formulaire, etc.)
    }
  }

  // ── RETOUR ────────────────────────────────────────────────────────────────
  // Tout ce qui est retourné est accessible depuis les composants
  // mockFetch et mockPost ne sont PAS retournés — privés au store
  return { members, isLoading, error, activeCount, fetchMembers, addMember }
})
```

```vue
<!-- src/components/FamilyDashboard.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useFamilyStore } from '@/stores/family'

const store = useFamilyStore()

// storeToRefs() pour state et getters — le template réagit aux mutations du store
// Sans storeToRefs : les valeurs seraient figées au rendu initial
const { members, isLoading, error, activeCount } = storeToRefs(store)

// Actions : déstructuration directe — ce sont des fonctions, pas des refs
const { fetchMembers, addMember } = store

// État local du formulaire — propre à ce composant, pas au store
const newMemberName = ref('')
const isSubmitting = ref(false)

// Chargement initial dès que le composant est monté dans le DOM
onMounted(() => {
  fetchMembers('fam-1')
})

async function handleAddMember(): Promise<void> {
  const name = newMemberName.value.trim()
  if (!name) return

  isSubmitting.value = true
  try {
    await addMember(name, 'fam-1')
    newMemberName.value = ''   // reset le champ après succès
  } finally {
    // finally garantit le reset même si addMember throw
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="dashboard">
    <h1>Dashboard TribuZen</h1>

    <!-- Indicateur de chargement — isLoading vient de storeToRefs, reste réactif -->
    <p v-if="isLoading" class="loading">Chargement des membres…</p>

    <!-- Message d'erreur — affiché si error !== null -->
    <p v-if="error" class="error">{{ error }}</p>

    <!-- Contenu principal : affiché même pendant un refresh si membres déjà chargés -->
    <div v-if="!isLoading || members.length > 0">
      <!-- activeCount est un getter — recompute automatiquement -->
      <p class="stats">
        Membres actifs : <strong>{{ activeCount }}</strong> / {{ members.length }}
      </p>

      <!-- Liste des membres -->
      <ul class="member-list">
        <li
          v-for="member in members"
          :key="member.id"
          :class="{ 'member--inactive': !member.isActive }"
        >
          {{ member.name }}
          <span v-if="!member.isActive" class="badge-inactive">inactif</span>
        </li>
      </ul>

      <!-- Formulaire d'ajout -->
      <form class="add-form" @submit.prevent="handleAddMember">
        <input
          v-model="newMemberName"
          type="text"
          placeholder="Prénom du membre"
          :disabled="isSubmitting"
        />
        <button type="submit" :disabled="isSubmitting || !newMemberName.trim()">
          {{ isSubmitting ? 'Ajout…' : 'Ajouter' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 1.5rem;
  max-width: 600px;
}

.loading {
  color: #64748b;
  font-style: italic;
}

.error {
  padding: 0.75rem 1rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 6px;
  border-left: 4px solid #ef4444;
}

.stats {
  font-size: 0.9rem;
  color: #475569;
  margin-bottom: 0.75rem;
}

.member-list {
  list-style: none;
  padding: 0;
  margin-bottom: 1.5rem;
}

.member-list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.member--inactive {
  opacity: 0.5;
}

.badge-inactive {
  font-size: 0.7rem;
  background: #e2e8f0;
  color: #64748b;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.add-form {
  display: flex;
  gap: 0.5rem;
}

.add-form input {
  flex: 1;
  padding: 0.4rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.95rem;
}

.add-form button {
  padding: 0.4rem 1rem;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.add-form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
```

**Pourquoi ce corrigé est correct :**

- `storeToRefs(store)` pour `members`, `isLoading`, `error`, `activeCount` — le template réagit à toute mutation du store.
- `fetchMembers` et `addMember` déstructurés directement depuis `store` — ce sont des fonctions, pas des refs, `storeToRefs` les ignore.
- `newMemberName` et `isSubmitting` restent en état local — ils concernent uniquement ce composant, pas le store.
- Le `try/finally` dans `handleAddMember` garantit que `isSubmitting` est remis à `false` même si `addMember` lance une erreur.
- `mockFetch` et `mockPost` ne sont pas dans le `return` du store — ils sont privés, invisibles des composants.

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées :**

Reproduis `useFamilyStore` et `FamilyDashboard.vue` **de mémoire, en 30 minutes**, avec les modifications suivantes :

1. Ajoute une action synchrone `deactivateMember(id: string): void` — met `isActive: false` sur le membre ciblé directement dans `members.value` (mutation in-place, pas d'appel API).
2. Ajoute un getter `inactiveCount` — nombre de membres inactifs.
3. Dans `FamilyDashboard.vue`, affiche les deux compteurs côte à côte et ajoute un bouton "Désactiver" sur chaque ligne de membre actif.
4. **Sans ouvrir ce corrigé ni le module 15.**

**Critère de réussite :** cliquer "Désactiver" sur Alice la grise immédiatement, `activeCount` descend de 1, `inactiveCount` monte de 1 — sans rechargement de page.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, les fichiers vivent ici :

```
tribuzen/
  src/
    stores/
      family.ts      ← useFamilyStore (ce lab)
      auth.ts        ← useAuthStore (module 15, Worked Example)
    components/
      FamilyDashboard.vue   ← consomme useFamilyStore (ce lab)
    views/
      DashboardView.vue     ← importe FamilyDashboard
```

**Différences par rapport au lab :**

- `mockFetch` et `mockPost` sont remplacés par de vrais `fetch('/api/...')` avec le token depuis `useAuthStore` (`Authorization: Bearer ...`)
- `useFamilyStore` compose `useAuthStore` pour les headers — `const auth = useAuthStore()` à l'intérieur du setup function
- L'interface `Member` est importée depuis `src/types/family.ts` (partagée entre composants)
- La persistance du token d'auth est gérée par `pinia-plugin-persistedstate` sur `useAuthStore`, pas manuellement via `localStorage`

**Commit cible :**

```
feat(stores): useFamilyStore — state membres, activeCount, fetchMembers async, addMember
```
