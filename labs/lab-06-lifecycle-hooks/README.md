# Lab 06 — Lifecycle Hooks

> **Outcome :** à la fin, tu sais écrire un composant Vue 3 qui charge des données au montage avec `onMounted`, rafraîchit automatiquement avec `setInterval`, et nettoie les deux effets dans `onUnmounted` sans fuite mémoire.
> **Vrai outil :** Vue 3 dans le projet `02-vue` (Vite + TypeScript). Oracle : DevTools > Performance > Memory — aucun listener ni timer fantôme après démontage.
> **Feedback :** le coach valide en session : montage → données visibles, démontage → interval stoppé (confirmé en console).

---

## Énoncé

Tu écris `FamilyDashboard.vue`, le composant central de TribuZen. Il doit :

1. Charger les données de la famille depuis `/api/families/current` dès le montage.
2. Afficher un état de chargement (`loading`) et un état d'erreur (`error`).
3. Rafraîchir les données toutes les 30 secondes via `setInterval`.
4. Stopper le rafraîchissement et annuler le fetch en cours quand le composant se démonte.

**Starter — crée ce fichier :**

```
02-vue/src/components/dashboard/FamilyDashboard.vue
```

Avec ce contenu initial (interface + template déjà fournis, logique à compléter) :

```vue
<!-- FamilyDashboard.vue — starter -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Family {
  id: string
  name: string
  memberCount: number
  lastActivity: string
}

const family = ref<Family | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// À compléter : AbortController, loadFamily(), setInterval

// onMounted(() => { ... })
// onUnmounted(() => { ... })
</script>

<template>
  <div class="dashboard">
    <div v-if="loading" class="state-loading">Chargement des données famille…</div>
    <div v-else-if="error" class="state-error">{{ error }}</div>
    <div v-else-if="family" class="state-loaded">
      <h1>{{ family.name }}</h1>
      <p>{{ family.memberCount }} membres · Dernière activité : {{ family.lastActivity }}</p>
    </div>
    <div v-else class="state-empty">Aucune donnée disponible.</div>
  </div>
</template>
```

Pour simuler l'API sans backend, utilise cette fonction à placer dans le même fichier :

```ts
// Simulation API — à placer avant les hooks dans <script setup>
async function fakeFetch(signal?: AbortSignal): Promise<Family> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      resolve({
        id: 'fam-001',
        name: 'Famille Dupont',
        memberCount: 4,
        lastActivity: new Date().toISOString(),
      })
    }, 800)
    signal?.addEventListener('abort', () => {
      clearTimeout(id)
      reject(new DOMException('Fetch aborted', 'AbortError'))
    })
  })
}
```

---

## Étapes (en friction)

**Étape 1 — Installe le starter et ouvre le composant**

Ajoute `FamilyDashboard.vue` dans `02-vue/src/components/dashboard/`. Monte-le temporairement dans `App.vue` pour pouvoir le voir dans le navigateur (`pnpm dev`).

**Étape 2 — Fetch initial avec onMounted**

Écris la fonction `loadFamily()` qui appelle `fakeFetch()` et stocke le résultat dans `family.value`. Gère les états `loading` et `error`. Appelle `loadFamily()` dans `onMounted`.

- Vérifie que le texte "Chargement…" apparaît 800 ms avant les données.
- Que se passe-t-il si tu appelles `loadFamily()` directement dans le corps de `<script setup>` au lieu de `onMounted` ? (essaie, observe, revert)

**Étape 3 — Ajouter l'AbortController**

Déclare `let abortController: AbortController` en dehors des hooks. Dans `onMounted`, crée-en un nouveau et passe `abortController.signal` à `fakeFetch`. Dans `onUnmounted`, appelle `abortController.abort()`.

Pour tester : démonte le composant (enlève-le du template parent via `v-if`) pendant les 800 ms de chargement. Sans AbortController, la console affiche une erreur "Cannot set properties of undefined". Avec : rien (l'AbortError est intercepté et ignoré).

**Étape 4 — Ajouter le refresh périodique**

Dans `onMounted`, démarre un `setInterval` qui appelle `refreshFamily()` (une version allégée de `loadFamily` sans le flag `loading`) toutes les 5 secondes (pour tester — en prod ce serait 30 000).

Vérifie en console que `lastActivity` se met à jour toutes les 5 secondes.

**Étape 5 — Nettoyer le timer dans onUnmounted**

Ajoute `clearInterval(refreshIntervalId)` dans `onUnmounted`. Pour confirmer le nettoyage :
- Ouvre DevTools > Console.
- Monte le composant → observe les logs de refresh toutes les 5 s.
- Démonte le composant (via `v-if="false"`) → les logs doivent s'arrêter immédiatement.

Si les logs continuent : `clearInterval` n'est pas appelé ou vise le mauvais id.

---

## Corrigé complet commenté

```vue
<!-- FamilyDashboard.vue — solution complète -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// ─── Type ────────────────────────────────────────────────────────────────────
interface Family {
  id: string
  name: string
  memberCount: number
  lastActivity: string
}

// ─── État réactif ────────────────────────────────────────────────────────────
const family = ref<Family | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// ─── Ressources externes (pas réactives — pas dans le template) ───────────────
// AbortController : annule le fetch si le composant se démonte en cours de route
let abortController: AbortController
// Timer id : retourné par setInterval, nécessaire pour clearInterval
let refreshIntervalId: ReturnType<typeof setInterval>

// ─── Simulation API ──────────────────────────────────────────────────────────
async function fakeFetch(signal?: AbortSignal): Promise<Family> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      resolve({
        id: 'fam-001',
        name: 'Famille Dupont',
        memberCount: 4,
        lastActivity: new Date().toISOString(),
      })
    }, 800)
    signal?.addEventListener('abort', () => {
      clearTimeout(id)
      // DOMException avec name 'AbortError' = convention fetch standard
      reject(new DOMException('Fetch aborted', 'AbortError'))
    })
  })
}

// ─── Logique ─────────────────────────────────────────────────────────────────

// Chargement initial — affiche le skeleton loading
async function loadFamily(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    // On passe le signal : si abort() est appelé, fakeFetch lance une AbortError
    family.value = await fakeFetch(abortController.signal)
  } catch (e) {
    // AbortError = démontage en cours → pas une vraie erreur, on ignore
    if (e instanceof DOMException && e.name === 'AbortError') return
    error.value = e instanceof Error ? e.message : 'Erreur inconnue'
  } finally {
    // finally s'exécute même si on est passé par le return de l'AbortError
    loading.value = false
  }
}

// Refresh silencieux — pas de loading indicator (UI stable)
async function refreshFamily(): Promise<void> {
  try {
    // Nouveau signal pour chaque refresh (l'AbortController principal gère le démontage)
    const data = await fakeFetch(abortController.signal)
    family.value = data    // mise à jour silencieuse
    console.log('refresh —', data.lastActivity)
  } catch (e) {
    // Erreur réseau sur un refresh de fond : absorber silencieusement
    // L'UI conserve la dernière valeur connue
    if (e instanceof DOMException && e.name === 'AbortError') return
    console.warn('Refresh échoué, données conservées')
  }
}

// ─── Hooks ───────────────────────────────────────────────────────────────────
onMounted(() => {
  // Un AbortController par montage — recrée si le composant remonte
  abortController = new AbortController()

  // Chargement initial + démarrage du refresh périodique
  loadFamily()
  refreshIntervalId = setInterval(refreshFamily, 5_000)   // 30_000 en prod
})

onUnmounted(() => {
  // 1. Abort le fetch en cours (si loadFamily ou refreshFamily n'a pas répondu)
  abortController.abort()
  // 2. Stopper le timer — CRITIQUE : sans ça, refreshFamily continue en arrière-plan
  clearInterval(refreshIntervalId)
})
</script>

<template>
  <div class="dashboard">
    <div v-if="loading" class="state-loading">Chargement des données famille…</div>
    <div v-else-if="error" class="state-error">{{ error }}</div>
    <div v-else-if="family" class="state-loaded">
      <h1>{{ family.name }}</h1>
      <!-- lastActivity se met à jour à chaque refresh — visible sans rechargement page -->
      <p>{{ family.memberCount }} membres · Dernière activité : {{ family.lastActivity }}</p>
    </div>
    <div v-else class="state-empty">Aucune donnée disponible.</div>
  </div>
</template>
```

---

## Variante J+30 (fading)

**Même problème, contrainte ajoutée — 25 minutes, corrigé interdit.**

Écris un composant `NotificationBadge.vue` à partir d'une page blanche :
- Au montage : ouvre une connexion SSE (`new EventSource('/api/notifications/stream')`) et écoute les messages (`source.onmessage = ...`) pour incrémenter un compteur `unreadCount: ref<number>(0)`.
- Au démontage : ferme la connexion (`source.close()`).
- Bonus : affiche le badge seulement si `unreadCount > 0` via `v-if`.

Contrainte technique : `EventSource` ne supporte pas `AbortSignal` — tu dois stocker la référence directement (comme `let source: EventSource`) et appeler `source.close()` dans `onUnmounted`.

---

## Application TribuZen

**Objectif :** porter `FamilyDashboard.vue` dans le vrai repo `smaurier/tribuzen`.

**Steps :**

1. Copie la solution dans `tribuzen/src/components/dashboard/FamilyDashboard.vue`.
2. Remplace `fakeFetch()` par un vrai appel à l'API TribuZen (ou laisse le mock si l'endpoint n'est pas encore implémenté — la structure setup/cleanup reste identique).
3. Monte le composant dans le routeur ou dans `App.vue` selon l'avancement de l'app.
4. Teste le démontage en naviguant vers une autre route : confirme en console que les logs de refresh s'arrêtent.
5. Commit :
   ```bash
   git add src/components/dashboard/FamilyDashboard.vue
   git commit -m "feat(dashboard): FamilyDashboard avec fetch onMounted + cleanup onUnmounted"
   ```

**Vérification de transfert :** ouvrir DevTools > Memory > prendre un snapshot avant montage et après 3 cycles mount/unmount du dashboard. Le nombre de `setInterval` callbacks et d'`EventListener` doit rester constant (0 accumulation).
