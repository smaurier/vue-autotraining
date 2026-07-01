# Lab 09 — Composables

> **Outcome :** à la fin, tu sais extraire une logique réactive réutilisable dans un composable `useFamily`, accepter un argument réactif avec `toValue`, et vérifier que deux composants consommant le même composable ont bien des états indépendants.
> **Vrai outil :** Vue 3.5 + Vite dev server (HMR visible en direct dans le navigateur).
> **Feedback :** le coach valide visuellement en session — pas de test-runner auto-correcteur.

---

## Énoncé

Tu travailles sur TribuZen. Deux composants ont besoin de charger les données d'une famille depuis `/api/families/:id` : `FamilyCard.vue` (sidebar) et `FamilyPanel.vue` (panneau principal). Aujourd'hui la logique est dupliquée dans chacun.

**Ta mission :** écrire `useFamily` dans `composables/useFamily.ts`, puis le brancher dans les deux composants. À la fin, chaque composant aura une seule ligne de logique (`useFamily(...)`) au lieu des 20 lignes actuelles.

**Cahier des charges exact :**

1. `useFamily` accepte `familyId` sous trois formes : valeur `string | null`, `Ref<string | null>`, ou getter `() => string | null`.
2. Il expose trois refs : `family` (`Family | null`), `loading` (`boolean`), `error` (`string | null`).
3. Si `familyId` change (ex : navigation vers une autre famille), le fetch se relance automatiquement.
4. Si `familyId` est `null`, `family` est mis à `null` sans déclencher de fetch.
5. `FamilyCard` passe son `familyId` via une prop — utilise la forme getter.
6. `FamilyPanel` passe une `ref` sélectionnable depuis une liste — utilise la forme `Ref`.
7. Les états `loading` des deux composants sont **indépendants** : charger une famille dans `FamilyPanel` ne met pas `FamilyCard` en état de chargement.

**Données de test (à simuler avec un mock) :**

```ts
// src/mocks/families.ts — colle ce fichier pour simuler l'API
export const MOCK_FAMILIES: Record<string, Family> = {
  'fam-01': { id: 'fam-01', name: 'Les Martin', memberCount: 4, createdAt: '2025-01-15' },
  'fam-02': { id: 'fam-02', name: 'Les Dupont', memberCount: 2, createdAt: '2025-03-22' },
  'fam-03': { id: 'fam-03', name: 'Les Moreau', memberCount: 6, createdAt: '2024-11-08' },
}

export async function fetchFamily(id: string): Promise<Family> {
  // Simule une latence réseau (300ms)
  await new Promise(resolve => setTimeout(resolve, 300))
  const family = MOCK_FAMILIES[id]
  if (!family) throw new Error(`Famille ${id} introuvable`)
  return family
}
```

**Pas de gap-fill** — tu écris `useFamily` et les deux composants complets à partir du starter minimal.

### Interface `Family`

```ts
export interface Family {
  id: string
  name: string
  memberCount: number
  createdAt: string
}
```

### Starter minimal

Crée ces fichiers dans ton projet Vite :

```ts
// src/composables/useFamily.ts — à compléter
import { type MaybeRefOrGetter } from 'vue'
import type { Family } from '@/types/family'

export function useFamily(familyId: MaybeRefOrGetter<string | null>) {
  // 1. Déclarer les trois refs : family, loading, error
  // 2. Utiliser watchEffect + toValue pour déclencher le fetch
  // 3. Gérer la garde (id null), le loading, le try/catch, le finally
  // 4. Retourner les trois refs
}
```

```vue
<!-- src/components/family/FamilyCard.vue — à compléter -->
<script setup lang="ts">
import { useFamily } from '@/composables/useFamily'

const props = defineProps<{ familyId: string }>()

// Brancher useFamily avec la forme getter
// Destructurer family, loading, error
</script>

<template>
  <!-- Afficher loading, error, et les données family -->
</template>
```

```vue
<!-- src/components/family/FamilyPanel.vue — à compléter -->
<script setup lang="ts">
import { ref } from 'vue'
import { useFamily } from '@/composables/useFamily'

// selectedId : Ref<string | null> — l'utilisateur sélectionne depuis une liste
// Brancher useFamily avec la forme Ref
// Fournir une liste de boutons pour changer selectedId
</script>

<template>
  <!-- Boutons pour sélectionner fam-01, fam-02, fam-03 -->
  <!-- Afficher loading, error, et les données family -->
</template>
```

Lance le dev server (`pnpm dev`) et branche les deux composants dans `App.vue` côte à côte.

---

## Étapes (en friction)

1. **Crée `src/mocks/families.ts`** avec les données de test ci-dessus. Tu utiliseras `fetchFamily(id)` dans ton composable au lieu de `fetch()` pour éviter un vrai serveur.

2. **Crée `src/types/family.ts`** avec l'interface `Family` — elle sera partagée entre le composable et les composants.

3. **Écris `useFamily`** — importe `ref`, `watchEffect`, `toValue` depuis Vue. Déclare les trois refs. Dans `watchEffect`, appelle `toValue(familyId)` pour récupérer l'id courant, gère la garde `null`, et lance `fetchFamily(id)` dans un `try/catch/finally`.

4. **Vérifie la forme getter dans `FamilyCard`** — branche avec `useFamily(() => props.familyId)`. Dans `App.vue`, passe `familyId="fam-01"`. Tu dois voir "Les Martin" s'afficher après 300ms de loading.

5. **Vérifie la forme Ref dans `FamilyPanel`** — branche avec `const selectedId = ref<string | null>(null)` et `useFamily(selectedId)`. Ajoute trois boutons qui assignent `selectedId.value` à `fam-01`, `fam-02`, `fam-03`. Cliquer un bouton doit re-fetcher automatiquement.

6. **Vérifie l'indépendance des états** — ouvre les devtools Vue. Clique sur `fam-02` dans `FamilyPanel`. Observe que `FamilyCard` (toujours sur `fam-01`) ne passe pas en `loading`. Les deux instances de `useFamily` sont bien distinctes.

7. **Vérifie la garde `null`** — initialise `FamilyPanel` avec `selectedId = ref(null)`. Avant de sélectionner une famille, `family` doit être `null` et aucun fetch ne doit être lancé.

8. **Vérifie le cas d'erreur** — dans `FamilyPanel`, essaie `selectedId.value = 'fam-99'` (id inexistant). `fetchFamily` lance une erreur → `error.value` doit afficher le message, `loading` doit repasser à `false`.

---

## Corrigé complet commenté

### `src/mocks/families.ts`

```ts
import type { Family } from '@/types/family'

export const MOCK_FAMILIES: Record<string, Family> = {
  'fam-01': { id: 'fam-01', name: 'Les Martin',  memberCount: 4, createdAt: '2025-01-15' },
  'fam-02': { id: 'fam-02', name: 'Les Dupont',  memberCount: 2, createdAt: '2025-03-22' },
  'fam-03': { id: 'fam-03', name: 'Les Moreau',  memberCount: 6, createdAt: '2024-11-08' },
}

export async function fetchFamily(id: string): Promise<Family> {
  await new Promise(resolve => setTimeout(resolve, 300))
  const family = MOCK_FAMILIES[id]
  if (!family) throw new Error(`Famille "${id}" introuvable`)
  return family
}
```

### `src/types/family.ts`

```ts
export interface Family {
  id: string
  name: string
  memberCount: number
  createdAt: string
}
```

### `src/composables/useFamily.ts`

```ts
import { ref, watchEffect, toValue, type MaybeRefOrGetter } from 'vue'
import type { Family } from '@/types/family'
import { fetchFamily } from '@/mocks/families'

export function useFamily(familyId: MaybeRefOrGetter<string | null>) {
  // Trois refs : les données, l'état de chargement, l'erreur éventuelle
  const family = ref<Family | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  watchEffect(async () => {
    // toValue unwrap les trois formes : valeur brute, Ref, ou getter
    // watchEffect trace automatiquement toValue(familyId) comme dépendance :
    // si la Ref ou le getter renvoie une nouvelle valeur, watchEffect se ré-exécute
    const id = toValue(familyId)

    // Garde : si pas d'id, on reset sans fetcher
    if (!id) {
      family.value = null
      return
    }

    // Cycle loading standard
    loading.value = true
    error.value = null

    try {
      family.value = await fetchFamily(id)
      // fetchFamily lance une Error si id inconnu — le catch la récupère
    } catch (e) {
      family.value = null
      error.value = e instanceof Error ? e.message : 'Erreur inconnue'
    } finally {
      // finally s'exécute TOUJOURS — loading repasse à false même en cas d'erreur
      loading.value = false
    }
  })

  // On retourne des refs (pas .value) pour que la réactivité survive à la déstructuration
  return { family, loading, error }
}
```

### `src/components/family/FamilyCard.vue`

```vue
<script setup lang="ts">
import { useFamily } from '@/composables/useFamily'

// Props : familyId vient du parent (App.vue ou FamilyPage)
const props = defineProps<{ familyId: string }>()

// Forme getter () => props.familyId :
// - si props.familyId change (navigation), watchEffect relance automatiquement le fetch
// - c'est la forme idiomatique pour les props
const { family, loading, error } = useFamily(() => props.familyId)
</script>

<template>
  <div class="family-card">
    <p v-if="loading" class="loading">Chargement…</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <div v-else-if="family" class="card-content">
      <h3>{{ family.name }}</h3>
      <span class="badge">{{ family.memberCount }} membres</span>
    </div>
    <p v-else class="empty">Aucune famille sélectionnée</p>
  </div>
</template>

<style scoped>
.family-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  min-width: 200px;
}

.loading  { color: #94a3b8; font-style: italic; }
.error    { color: #ef4444; }
.empty    { color: #cbd5e1; }
.badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  background: #ede9fe;
  color: #6d28d9;
  border-radius: 99px;
  font-size: 0.8rem;
}
</style>
```

### `src/components/family/FamilyPanel.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useFamily } from '@/composables/useFamily'

// Ref form : l'utilisateur choisit depuis une liste
// null = rien de sélectionné (la garde dans useFamily empêche le fetch)
const selectedId = ref<string | null>(null)

// Nouvelle instance de useFamily — état totalement indépendant de FamilyCard
const { family, loading, error } = useFamily(selectedId)

// Familles disponibles (en prod, cette liste viendrait d'un autre composable)
const options = [
  { id: 'fam-01', label: 'Les Martin' },
  { id: 'fam-02', label: 'Les Dupont' },
  { id: 'fam-03', label: 'Les Moreau' },
  { id: 'fam-99', label: 'Famille inconnue (erreur)' },
]
</script>

<template>
  <div class="family-panel">
    <h2>Panneau famille</h2>

    <!-- Sélection : assigner selectedId.value déclenche le re-fetch dans useFamily -->
    <div class="family-selector">
      <button
        v-for="opt in options"
        :key="opt.id"
        :class="{ active: selectedId === opt.id }"
        @click="selectedId = opt.id"
      >
        {{ opt.label }}
      </button>
      <button @click="selectedId = null">Effacer</button>
    </div>

    <!-- États -->
    <div class="panel-content">
      <p v-if="!selectedId" class="hint">Sélectionne une famille ci-dessus</p>
      <p v-else-if="loading">Chargement de {{ selectedId }}…</p>
      <p v-else-if="error" class="error">{{ error }}</p>
      <div v-else-if="family">
        <h3>{{ family.name }}</h3>
        <p>{{ family.memberCount }} membre(s) · depuis {{ family.createdAt }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.family-panel {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
}

.family-selector {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.family-selector button {
  padding: 0.3rem 0.7rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  cursor: pointer;
  background: #fff;
}

.family-selector button.active {
  background: #4f46e5;
  color: #fff;
  border-color: #4f46e5;
}

.error  { color: #ef4444; }
.hint   { color: #94a3b8; font-style: italic; }
</style>
```

### `src/App.vue` — brancher les deux composants côte à côte

```vue
<script setup lang="ts">
import FamilyCard from '@/components/family/FamilyCard.vue'
import FamilyPanel from '@/components/family/FamilyPanel.vue'
</script>

<template>
  <main style="display: flex; gap: 2rem; padding: 2rem;">
    <!-- FamilyCard toujours fixée sur fam-01 — état indépendant du Panel -->
    <FamilyCard family-id="fam-01" />

    <!-- FamilyPanel avec sélection dynamique -->
    <FamilyPanel />
  </main>
</template>
```

**Ce que tu dois observer pour valider :**

- Au lancement : `FamilyCard` affiche "Chargement…" pendant 300ms, puis "Les Martin". `FamilyPanel` affiche "Sélectionne une famille".
- En cliquant "Les Dupont" dans `FamilyPanel` : le panel affiche "Chargement…" pendant 300ms. La `FamilyCard` ne bouge pas (état indépendant).
- En cliquant "Famille inconnue" : `error` s'affiche dans le panel. `loading` repasse bien à `false`.
- En cliquant "Effacer" : `family` repasse à `null` sans fetch.

---

## Variante J+30 (fading)

**Même objectif, contrainte ajoutée — de mémoire, en 30 minutes, sans rouvrir ce corrigé :**

1. Ajoute un **cache en mémoire** dans `useFamily` : si la même famille a déjà été chargée pendant la session, utilise la valeur en cache au lieu de refetcher. Indice : un `Map<string, Family>` au niveau du module.

2. Expose une fonction `refresh()` depuis `useFamily` qui **force le refetch** même si la famille est en cache (utile pour rafraîchir les données après une mutation).

3. Ajoute un `ref<number>` `retryCount` incrémenté à chaque erreur — affiche-le dans le template sous forme `Tentative N échouée`.

**Critère de réussite :** `FamilyPanel` n'affiche le spinner que lors du premier chargement d'une famille — les clics suivants sur la même famille sont instantanés (cache hit). `refresh()` force le spinner même pour une famille déjà en cache.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, les composables vivent ici :

```
tribuzen/
  src/
    composables/
      useFamily.ts       ← ce que tu viens d'écrire
      useAuth.ts         ← même pattern, état module scope
    components/
      family/
        FamilyCard.vue   ← useFamily(() => props.familyId)
        FamilyPanel.vue  ← useFamily(selectedId)
```

**Différences par rapport au lab :**

- `fetchFamily` est remplacé par l'appel réel à `fetch('/api/families/${id}')` avec le token d'auth depuis `useAuth`.
- `Family` est importée depuis `src/types/api.ts` (types générés depuis le schéma OpenAPI du backend NestJS — module 12).
- Le cache sera géré par Pinia (module 11) plutôt qu'un `Map` local, pour la persistance et les devtools.

**Commit cible :**

```
feat(composables): useFamily — toValue, async, guard null, états indépendants
```
