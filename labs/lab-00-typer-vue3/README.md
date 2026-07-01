# Lab 00 — TypeScript avec Vue 3 (`<script setup lang="ts">`)

> **Outcome :** à la fin, tu sais annoter `ref`/`reactive`/`computed` dans un SFC Vue 3 et lire les erreurs de `vue-tsc` pour diagnostiquer des problèmes de typage.
> **Vrai outil :** `vue-tsc --noEmit` (= `pnpm typecheck`) — le vérificateur de types officiel pour les SFC Vue.
> **Feedback :** zéro erreur `vue-tsc` = lab réussi.

---

## Énoncé

Tu reçois un composant `FamilyCard.vue` avec **5 erreurs de typage délibérées**. Tu dois les corriger sans changer la logique, puis écrire `LoginForm.vue` à partir de zéro.

### Partie A — Corriger les erreurs de typage dans `FamilyCard.vue`

Crée le fichier `src/components/FamilyCard.vue` avec ce contenu exact :

```vue
<!-- FamilyCard.vue — starter avec erreurs de typage intentionnelles -->
<!-- Objectif : corriger les 5 erreurs pour que vue-tsc passe en vert -->
<script setup>
import { ref, computed } from 'vue'

// Erreur 1 : lang="ts" manquant sur <script setup>

// Erreur 2 : ref(null) sans annotation
const family = ref(null)

// Erreur 3 : reactive avec une primitive
const memberCount = reactive(0)

// Erreur 4 : computed sur union de string sans annotation
const status = computed(() => {
  if (!family.value) return 'loading'
  if (family.value.memberCount === 0) return 'empty'
  return 'active'
})
// → si tu ajoutes status.value.toUpperCase() dans le template, TS doit
//   te garantir que c'est une string (le type union devrait être explicite)

// Erreur 5 : catch (e) sans rétrécissement
async function loadFamily(id: string): Promise<void> {
  try {
    const res = await fetch(`/api/families/${id}`)
    family.value = await res.json()
  } catch (e) {
    console.error(e.message)
  }
}
</script>

<template>
  <div v-if="family" class="family-card">
    <h2>{{ family.name }}</h2>
    <p>{{ memberCount }} membres</p>
    <p>Statut : {{ status }}</p>
  </div>
  <p v-else>Chargement…</p>
</template>
```

### Partie B — Écrire `LoginForm.vue` à partir de zéro

Sans regarder le corrigé du module, écris `src/components/auth/LoginForm.vue` avec :
- `<script setup lang="ts">`
- `email: ref<string>`, `password: ref<string>`, `loading: ref<boolean>`, `error: ref<string | null>`
- `canSubmit: computed<boolean>` (email non vide + password ≥ 8 caractères)
- `async function login(): Promise<void>` avec un `fetch('/api/auth/login')` et gestion de `catch (e)`
- Template minimal : 2 inputs, 1 bouton (`:disabled="!canSubmit || loading"`), 1 paragraphe d'erreur conditionnel

**Oracle :** lance `pnpm typecheck` après chaque modification. Zéro erreur = vert.

```
02-vue/
  src/
    components/
      FamilyCard.vue            ← Partie A (corriger)
      auth/
        LoginForm.vue           ← Partie B (écrire)
```

---

## Étapes (en friction)

**Étape 1 — Installe et lance le vérificateur de types**

```bash
# Dans 02-vue/
pnpm typecheck        # = vue-tsc --noEmit
```

Tu dois voir 5 erreurs (ou plus si lang="ts" est absent — `vue-tsc` peut rater des fichiers non-TS). Lis chaque message d'erreur attentivement : le numéro de ligne et le type attendu vs reçu sont dans le message.

**Étape 2 — Corriger Erreur 1 : `lang="ts"`**

Ajoute `lang="ts"` sur le `<script setup>`. Relance `pnpm typecheck`. Observe combien d'erreurs apparaissent maintenant — certaines n'étaient pas visibles sans TS activé.

**Étape 3 — Corriger Erreur 2 : `ref(null)`**

Quelle interface faut-il créer pour `Family` ? Que contient un objet famille : un `id` (string), un `name` (string), un `memberCount` (number). Écris l'interface, puis annote `ref<Family | null>(null)`.

- Pourquoi `ref<Family>(null)` ne suffit-il pas ? (`null` n'est pas assignable à `Family`)
- Quel est le type de `family.value` après la garde `v-if="family"` dans le template ?

**Étape 4 — Corriger Erreur 3 : `reactive` sur une primitive**

`reactive(0)` est refusé par TypeScript. Quelle primitive utiliser à la place ? Comment intégrer `memberCount` dans une interface `reactive` si on voulait regrouper l'état du composant ?

**Étape 5 — Corriger Erreur 4 : `computed` sans annotation d'union**

`computed(() => { ... })` infère `ComputedRef<string>` — c'est légal mais pas précis. Annote pour obtenir `ComputedRef<'loading' | 'empty' | 'active'>`. Vérifie que TypeScript t'empêche d'ajouter une branche qui retourne autre chose.

**Étape 6 — Corriger Erreur 5 : `catch (e)` sans rétrécissement**

`e.message` avec `e: unknown` est une erreur TS. Ajoute le rétrécissement `instanceof Error`. Que faire si `e` n'est pas une `Error` (erreur réseau brute, string, etc.) ? Valeur de fallback : `'Erreur inconnue'`.

**Étape 7 — Partie B : écrire `LoginForm.vue`**

Ouvre une page blanche. Ne copie pas le corrigé du module — essaie de mémoire. Objectifs vérifiables avec `vue-tsc` :
- `canSubmit.value++` → doit être une erreur TS (computed en lecture seule)
- `error.value = 42` → doit être une erreur TS (number pas assignable à `string | null`)
- `e.message` sans narrowing → doit être une erreur TS
- `loading.value = 'yes'` → doit être une erreur TS

Lance `pnpm typecheck`. Si tout est vert, le lab est complet.

---

## Corrigé complet commenté

### `src/components/FamilyCard.vue` — corrigé

```vue
<!-- FamilyCard.vue — version corrigée -->
<script setup lang="ts">
<!-- Correction 1 : lang="ts" ajouté sur le script setup -->
import { ref, computed } from 'vue'

// Correction 2 : interface déclarée + ref<Family | null>(null)
// Family | null : null = état de chargement, Family = données chargées
interface Family {
  id: string
  name: string
  memberCount: number
  createdAt: string
}

const family = ref<Family | null>(null)
// TypeScript sait maintenant que :
// - family.value peut être null (avant chargement)
// - family.value peut être Family (après chargement)
// - family.value.name est garanti string si family.value != null

// Correction 3 : reactive ne fonctionne pas sur les primitives
// Deux options valides :
// Option A — ref pour la primitive seule
const memberCount = ref(0)  // Ref<number>

// Option B — si on regroupe l'état dans un reactive (montré en commentaire)
// interface FamilyCardState { memberCount: number; expanded: boolean }
// const state: FamilyCardState = reactive({ memberCount: 0, expanded: false })

// Correction 4 : annotation du type union pour le computed
// Sans annotation : ComputedRef<string> — trop large
// Avec annotation : TypeScript vérifie que les branches retournent bien le type
const status = computed<'loading' | 'empty' | 'active'>(() => {
  if (!family.value) return 'loading'
  if (family.value.memberCount === 0) return 'empty'
  return 'active'
  // Essaie d'ajouter : return 'unknown' → TS Error immédiat
})

// Correction 5 : rétrécissement de e dans catch
async function loadFamily(id: string): Promise<void> {
  try {
    const res = await fetch(`/api/families/${id}`)
    family.value = await res.json() as Family  // le JSON n'est pas typé automatiquement
  } catch (e) {
    // e est 'unknown' en TS strict — impossible d'accéder à .message directement
    // instanceof Error réduit e à Error dans ce bloc
    if (e instanceof Error) {
      console.error(e.message)  // ✅ string garanti
    } else {
      console.error('Erreur inconnue lors du chargement')
    }
  }
}
</script>

<template>
  <div v-if="family" class="family-card">
    <!-- Dans le template, Vue auto-unwrap les refs : pas de .value -->
    <h2>{{ family.name }}</h2>
    <!-- memberCount est un Ref<number> — auto-unwrapped ici -->
    <p>{{ memberCount }} membres</p>
    <!-- status est ComputedRef<'loading' | 'empty' | 'active'> — auto-unwrapped -->
    <p>Statut : {{ status }}</p>
    <button @click="loadFamily('demo-id')">Recharger</button>
  </div>
  <p v-else>Chargement…</p>
</template>
```

### `src/components/auth/LoginForm.vue` — corrigé

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// ─── Types ────────────────────────────────────────────────────────────────
// Interface locale au composant — pas besoin de l'exporter
interface LoginCredentials {
  email: string
  password: string
}

// ─── État réactif ─────────────────────────────────────────────────────────
// Primitives : inférence suffisante (valeur initiale = type final)
const email    = ref('')      // Ref<string> — inféré
const password = ref('')      // Ref<string> — inféré
const loading  = ref(false)   // Ref<boolean> — inféré

// null ne représente pas le type final → annotation explicite obligatoire
const error = ref<string | null>(null)   // Ref<string | null>

// ─── Computed ─────────────────────────────────────────────────────────────
// Retourne boolean — inférence suffisante, pas besoin d'annoter computed<boolean>
// Essaie : canSubmit.value = true → TS Error (readonly)
const canSubmit = computed(() =>
  email.value.trim().length > 0 && password.value.length >= 8
)

// ─── Actions ──────────────────────────────────────────────────────────────
async function login(): Promise<void> {
  if (!canSubmit.value) return   // garde : TS sait que canSubmit.value est boolean

  loading.value = true
  error.value = null

  // Utiliser l'interface pour typer le payload : TS vérifie la forme de l'objet
  const credentials: LoginCredentials = {
    email: email.value,
    password: password.value,
    // uncomment : unknown: 'x' → TS Error (propriété non déclarée dans LoginCredentials)
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })

    if (!res.ok) {
      // res.text() retourne Promise<string> — assignable à string | null ✅
      error.value = await res.text()
    }
  } catch (e) {
    // Rétrécissement requis : e est 'unknown' en TS strict
    // instanceof Error couvre 99% des cas (fetch, JSON.parse, etc.)
    error.value = e instanceof Error ? e.message : 'Erreur réseau'
  } finally {
    // finally s'exécute même si une branche a retourné — loading revient à false
    loading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="login" novalidate>
    <div class="field">
      <label for="email">Email</label>
      <!-- v-model sur un Ref<string> — Vue auto-unwrap + deux-way binding -->
      <input
        id="email"
        v-model="email"
        type="email"
        autocomplete="email"
        :disabled="loading"
        placeholder="alice@tribuzen.app"
      />
    </div>

    <div class="field">
      <label for="password">Mot de passe</label>
      <input
        id="password"
        v-model="password"
        type="password"
        autocomplete="current-password"
        :disabled="loading"
        placeholder="8 caractères minimum"
      />
    </div>

    <!-- :disabled prend un boolean — TS vérifie que l'expression est bien boolean -->
    <button type="submit" :disabled="!canSubmit || loading">
      {{ loading ? 'Connexion en cours…' : 'Se connecter' }}
    </button>

    <!-- v-if="error" passe le type guard : error dans le slot est string (pas null) -->
    <p v-if="error" role="alert" class="error-message">
      {{ error }}
    </p>
  </form>
</template>
```

---

## Variante J+30 (fading)

**Même problème, une contrainte ajoutée — tu as 20 minutes, corrigé interdit.**

Écris un composant `RegisterForm.vue` à partir d'une page blanche :
- Champs : `email`, `password`, `confirmPassword`, `displayName`
- `computed<string | null>` nommé `passwordError` : retourne `null` si tout va bien, sinon un message (ex. `'Les mots de passe ne correspondent pas'`)
- `computed<boolean>` nommé `formValid` : tous les champs non vides ET `passwordError === null`
- `async function register(): Promise<void>` avec la même gestion d'erreur

Contrainte bonus : utilise `useTemplateRef<HTMLInputElement>('email-field')` (Vue 3.5) pour focus automatiquement l'input email au montage via `onMounted`.

Lance `pnpm typecheck` — zéro erreur attendu.

---

## Application TribuZen

**Objectif :** porter `LoginForm.vue` dans le vrai repo `smaurier/tribuzen`.

**Steps :**

1. Copie le corrigé de `LoginForm.vue` dans `tribuzen/src/components/auth/`.
2. Adapte l'URL du fetch à la vraie API TribuZen (ou laisse `/api/auth/login` si l'endpoint est déjà défini).
3. Lance `vue-tsc --noEmit` dans tribuzen — zéro erreur attendu.
4. Commit :
   ```bash
   git add src/components/auth/LoginForm.vue
   git commit -m "feat(auth): LoginForm typé TS (ref<string|null>, catch instanceof Error)"
   ```

**Vérification de transfert :** la commande `pnpm typecheck` dans tribuzen doit passer en vert avec `LoginForm.vue` inclus. C'est la preuve que le typage vu en cours fonctionne dans le vrai produit.
