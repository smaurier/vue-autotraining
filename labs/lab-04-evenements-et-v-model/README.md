# Lab 04 — Événements et v-model

> **Outcome :** à la fin, tu sais écouter des événements DOM avec modificateurs, faire du two-way binding avec `v-model`, et exposer un `v-model` custom sur un composant via `defineModel` (Vue 3.4+).
> **Vrai outil :** `vue-tsc --noEmit` (vérification de types) + Vite dev server (test visuel).
> **Feedback :** le coach valide en session (pas de test-runner auto-correcteur).

---

## Énoncé

Tu travailles sur le front-office TribuZen. Ta mission : implémenter deux composants depuis zéro.

### Composant A — `InvitationForm.vue`

Un formulaire d'invitation de membres à une famille TribuZen. Il doit :

1. Comporter un champ `email` (type email) lié en `v-model.trim`
2. Comporter un `select` pour le rôle (`membre` | `admin`) lié en `v-model`
3. Déclencher `sendInvitation()` à la soumission **sans rechargement de page**
4. Permettre d'effacer le champ email avec la touche `Échap`
5. Désactiver les champs et le bouton pendant l'envoi (`sending = true`)
6. Afficher un message d'erreur si l'email est vide à la soumission
7. Émettre un event `invited` vers le parent avec `(email, role)` après succès
8. Réinitialiser le champ email après l'envoi réussi

**Contrainte TypeScript :** utilise un type union `'membre' | 'admin'` pour le rôle — `vue-tsc` doit passer sans erreur.

### Composant B — `SearchInput.vue`

Un champ de recherche réutilisable qui expose un `v-model` custom. Il doit :

1. Utiliser `defineModel<string>({ required: true })` — **pas** `defineProps` + `defineEmits`
2. Afficher un bouton `✕` pour réinitialiser la valeur (visible seulement si la valeur n'est pas vide)
3. Être consommé dans un parent avec `<SearchInput v-model="query" />`

---

## Étapes (en friction)

### Partie A — `InvitationForm.vue`

1. Crée le fichier `src/components/family/InvitationForm.vue` avec `<script setup lang="ts">`.
2. Déclare les refs : `email` (string), `role` (type union), `sending` (boolean), `error` (string | null). Choisis les types sans regarder le corrigé — demande-toi : est-ce que la valeur initiale représente le type final ?
3. Déclare `defineEmits` pour l'événement `invited` avec ses deux paramètres typés.
4. Écris la fonction `sendInvitation()` : valide l'email, set `sending`, appelle `fetch`, émet l'event, reset le champ, gère les erreurs.
5. Écris le template : `<form @submit.prevent>`, `<input v-model.trim @keyup.esc>`, `<select v-model>`, `<button :disabled>`, `<p v-if="error">`.
6. Lance `vue-tsc --noEmit` depuis la racine du projet `02-vue` — corrige les erreurs une par une.

### Partie B — `SearchInput.vue`

1. Crée `src/components/shared/SearchInput.vue`.
2. Utilise `defineModel<string>({ required: true })` pour déclarer la liaison — une seule ligne.
3. Dans le template : `<input v-model="query" type="search">` et `<button v-if="query" @click="query = ''">✕</button>`.
4. Consomme `SearchInput` dans `App.vue` ou une page de test : `<SearchInput v-model="searchTerm" />`.
5. Vérifie que taper dans le champ met à jour la variable parente, et que ✕ la réinitialise.
6. Lance `vue-tsc --noEmit` — zéro erreur.

---

## Corrigé complet commenté

### `InvitationForm.vue`

```vue
<script setup lang="ts">
import { ref } from 'vue'

// Type union : seules ces deux valeurs sont acceptables pour le rôle
// TS refusera role.value = 'superadmin' à la compilation
type InvitationRole = 'membre' | 'admin'

// ref('') → Ref<string> — inférence suffisante
const email   = ref('')

// ref<InvitationRole>('membre') — annotation nécessaire pour restreindre le type
// Sans annotation, TS infère Ref<string> et accepte n'importe quelle string
const role    = ref<InvitationRole>('membre')

// ref(false) → Ref<boolean> — inférence suffisante
const sending = ref(false)

// ref<string | null>(null) — null seul serait Ref<null>, trop restrictif
const error   = ref<string | null>(null)

// defineEmits typé — signature exacte de l'événement 'invited'
// Le tableau [email: string, role: InvitationRole] décrit les arguments
const emit = defineEmits<{
  invited: [email: string, role: InvitationRole]
}>()

async function sendInvitation(): Promise<void> {
  // Validation côté client — email.value est déjà trimé grâce à v-model.trim
  if (!email.value) {
    error.value = 'L\'email est requis.'
    return
  }

  sending.value = true   // désactive les champs et le bouton dans le template
  error.value   = null   // réinitialise l'erreur précédente éventuelle

  try {
    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // role.value est typé InvitationRole — pas de string arbitraire envoyée à l'API
      body: JSON.stringify({ email: email.value, role: role.value }),
    })

    if (!res.ok) {
      // res.text() retourne Promise<string> — pas d'ambiguïté de type
      error.value = await res.text()
      return
    }

    // Notifie le parent : l'invitation a été créée
    emit('invited', email.value, role.value)

    // Reset du formulaire après succès
    email.value = ''
  } catch (e) {
    // e est 'unknown' en TS strict — rétrécissement requis avant d'accéder à .message
    error.value = e instanceof Error ? e.message : 'Erreur réseau inconnue'
  } finally {
    // S'exécute toujours, succès ou erreur — réactive les champs
    sending.value = false
  }
}
</script>

<template>
  <!--
    @submit.prevent : intercepte l'événement submit natif AVANT qu'il atteigne le navigateur.
    Sans .prevent, le navigateur enverrait une requête GET/POST standard et rechargerait la page.
    .prevent = event.preventDefault() appelé automatiquement par Vue.
  -->
  <form @submit.prevent="sendInvitation" class="invitation-form">

    <!--
      v-model.trim : two-way binding + suppression automatique des espaces en début/fin.
      :disabled="sending" : attribut HTML dynamique — le champ est inactif pendant l'envoi.
      @keyup.esc : écoute la touche Échap et réinitialise le champ (UX qualité).
    -->
    <input
      v-model.trim="email"
      type="email"
      placeholder="email@famille.fr"
      :disabled="sending"
      @keyup.esc="email = ''"
    />

    <!--
      v-model="role" sur un select : Vue synchronise la valeur de l'option sélectionnée
      avec la ref 'role'. La valeur initiale 'membre' présélectionne l'option correspondante.
    -->
    <select v-model="role" :disabled="sending">
      <option value="membre">Membre</option>
      <option value="admin">Admin</option>
    </select>

    <!--
      type="submit" + @submit.prevent sur le form = les deux déclenchent sendInvitation.
      :disabled sur deux conditions : envoi en cours OU champ vide (! sur string = falsy si vide)
    -->
    <button type="submit" :disabled="sending || !email">
      {{ sending ? 'Envoi en cours…' : 'Inviter' }}
    </button>

    <!--
      v-if="error" : affiche le message d'erreur seulement si error n'est pas null.
      null est falsy — Vue ne rend pas l'élément.
    -->
    <p v-if="error" class="error-message">{{ error }}</p>
  </form>
</template>
```

### `SearchInput.vue`

```vue
<script setup lang="ts">
/*
  defineModel<string>({ required: true }) remplace en UNE LIGNE :
    const props = defineProps<{ modelValue: string }>()
    const emit  = defineEmits<{ 'update:modelValue': [value: string] }>()

  'query' est une Ref<string> writable.
  Lire query.value → lit la prop 'modelValue' envoyée par le parent.
  Écrire query.value = 'x' → émet automatiquement 'update:modelValue' vers le parent.

  { required: true } → Vue avertit en dev si le parent n'envoie pas la prop.
*/
const query = defineModel<string>({ required: true })
</script>

<template>
  <div class="search-input">
    <!--
      v-model="query" sur l'input natif interne.
      query est une Ref<string> writable — v-model peut lire ET écrire .value.
      Chaque frappe → query.value mis à jour → update:modelValue émis → parent synchronisé.
    -->
    <input
      v-model="query"
      type="search"
      placeholder="Rechercher un membre..."
      class="search-field"
    />

    <!--
      v-if="query" : le bouton n'est visible que si la recherche est non vide.
      @click="query = ''" : réinitialise query.value → émis vers le parent.
      .stop : évite que le clic ne remonte vers d'éventuels parents cliquables.
    -->
    <button
      v-if="query"
      @click.stop="query = ''"
      class="clear-btn"
      type="button"
      aria-label="Effacer la recherche"
    >
      ✕
    </button>
  </div>
</template>
```

### Consommation dans `App.vue` (test visuel)

```vue
<script setup lang="ts">
import { ref } from 'vue'
import InvitationForm from './components/family/InvitationForm.vue'
import SearchInput    from './components/shared/SearchInput.vue'

const searchQuery = ref('')

// Handler de l'événement 'invited' émis par InvitationForm
function onInvited(email: string, role: string): void {
  console.log(`Invitation envoyée à ${email} avec le rôle ${role}`)
}
</script>

<template>
  <h1>TribuZen — Tests lab 04</h1>

  <h2>SearchInput</h2>
  <SearchInput v-model="searchQuery" />
  <p>Valeur parente : "{{ searchQuery }}"</p>

  <h2>InvitationForm</h2>
  <!--
    @invited="onInvited" écoute l'événement custom 'invited' émis par InvitationForm.
    $event n'est pas utilisé ici car le handler accepte directement les deux arguments.
  -->
  <InvitationForm @invited="onInvited" />
</template>
```

---

## Variante J+30 (fading)

**Même objectif, contraintes renforcées — 20 minutes chrono, sans relire le corrigé.**

1. Ré-implémente `SearchInput.vue` **mais avec l'ancienne syntaxe** (`defineProps` + `defineEmits` + cast `HTMLInputElement`) — puis refactorise vers `defineModel` sans regarder le corrigé ci-dessus.
2. Ajoute un **modificateur de touche** `@keyup.ctrl.a` sur l'input de `SearchInput` qui sélectionne tout le texte (`(event.target as HTMLInputElement).select()`).
3. Dans `InvitationForm`, ajoute une **troisième valeur de rôle** : `'lecture-seule'`. Mets à jour le type union et le select — `vue-tsc` doit rester à zéro erreur.
4. **Bonus :** expose un deuxième `v-model` nommé sur `SearchInput` : `v-model:placeholder` de type string, avec `defineModel<string>('placeholder', { default: 'Rechercher…' })`.

---

## Application TribuZen

Une fois le lab validé, porte les composants dans le repo `smaurier/tribuzen` :

```bash
# Dans tribuzen/src/
cp InvitationForm.vue  components/family/InvitationForm.vue
cp SearchInput.vue     components/shared/SearchInput.vue
```

**Intégration :**

- `FamilyDashboard.vue` consomme `<InvitationForm @invited="refreshMembers" />` — `refreshMembers` recharge la liste via `fetch('/api/families/:id/members')`.
- `FamilyMemberList.vue` consomme `<SearchInput v-model="memberSearch" />` — le filtrage est fait en `computed` sur la liste locale.
- `EventList.vue` réutilise `<SearchInput v-model="eventSearch" />` — même composant, contexte différent : c'est la valeur du composable réutilisable.

**Vérification avant commit :**

```bash
cd tribuzen
pnpm vue-tsc --noEmit   # zéro erreur
pnpm dev                # vérification visuelle dans le navigateur
```

Commit cible : `feat(family): InvitationForm + SearchInput avec defineModel`.
