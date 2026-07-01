# Lab 11 — Formulaires et validation

> **Outcome :** à la fin, tu sais construire un formulaire Vue 3 typé avec `v-model`, valider les données avec un schéma `zod`, afficher des messages d'erreur accessibles (`aria-invalid`, `aria-describedby`, `role="alert"`) et guider l'utilisateur au submit raté avec un focus programmatique.
> **Vrai outil :** Vue 3.5 + zod 3 (pas de librairie de formulaire — validation manuelle pour ancrer les mécanismes).
> **Feedback :** le coach valide visuellement en session — pas de test-runner auto-correcteur.

---

## Énoncé

Tu construis `InvitationForm.vue`, le formulaire qui permet à l'admin d'une famille TribuZen d'inviter un nouveau membre. Voici le cahier des charges **exact** :

1. Deux champs : **email** (`<input type="email">`) et **rôle** (`<select>` avec `admin` / `membre`).
2. Validation via un schéma `zod` (`InvitationSchema`) — pas de regex manuelle, pas de `if` sur les longueurs.
3. Les erreurs n'apparaissent **pas** au premier rendu — uniquement après que le champ a été quitté (`@blur`) ou après un premier submit raté.
4. Chaque message d'erreur est **accessible** : `aria-invalid="true"` sur le champ, `aria-describedby` lié à l'`id` du message, `role="alert"` sur le paragraphe d'erreur.
5. Au submit raté, le focus est déplacé programmatiquement sur le premier champ invalide (`nextTick` + `.focus()`).
6. Le bouton submit est désactivé **seulement après** un premier submit raté (jamais par défaut).
7. Un message de succès remplace le formulaire après envoi.

**Pas de gap-fill** — tu écris le composant complet à partir du starter minimal ci-dessous.

### Données de départ

```ts
// Schéma zod à écrire dans <script setup>
// email : string, min 1 char ('Email requis'), format email ('Format email invalide')
// role  : enum ['admin', 'membre'], errorMap → 'Choisissez un rôle'
```

### Starter minimal

Crée `src/components/invitations/InvitationForm.vue` dans ton projet Vite :

```vue
<!-- InvitationForm.vue — starter -->
<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { useTemplateRef, nextTick } from 'vue'
import { z } from 'zod'

// À écrire :
// 1. InvitationSchema (zod)
// 2. type InvitationData + type FieldErrors
// 3. form (reactive), touched (reactive), hasSubmitted (ref), submitSuccess (ref), serverError (ref)
// 4. emailInput + roleSelect (useTemplateRef)
// 5. errors (computed via safeParse), isValid (computed)
// 6. touch(), touchAll()
// 7. handleSubmit()
</script>

<template>
  <!-- À construire :
       - div succès conditionnel (v-if submitSuccess)
       - form novalidate @submit.prevent="handleSubmit"
       - champ email avec v-model.trim, @blur, aria-invalid, aria-describedby, message d'erreur
       - champ rôle avec v-model, @blur, aria-invalid, aria-describedby, message d'erreur
       - erreur globale serveur
       - bouton submit avec :disabled
  -->
</template>

<style scoped>
/* À toi d'ajouter :
   .field, input[aria-invalid="true"], select[aria-invalid="true"], .field-error, .server-error
*/
</style>
```

Installe zod si besoin : `pnpm add zod`. Branche `InvitationForm` dans `App.vue` pour voir le résultat en direct.

---

## Étapes (en friction)

1. **Écris le schéma zod** `InvitationSchema` — `email` avec `.min(1, ...)` et `.email(...)`, `role` avec `z.enum(['admin', 'membre'], { errorMap: ... })`. Infère `InvitationData` avec `z.infer<typeof InvitationSchema>`.

2. **Déclare l'état du formulaire** — `form = reactive({ email: '', role: '' })` et `touched = reactive({ email: false, role: false })`. Aussi `hasSubmitted`, `submitSuccess`, `serverError` en `ref`.

3. **Branche les refs de template** — `emailInput = useTemplateRef<HTMLInputElement>('email-field')` et `roleSelect = useTemplateRef<HTMLSelectElement>('role-field')` (Vue 3.5 — pas de `ref="..."` dans le script, seulement dans le template).

4. **Écris le computed `errors`** — appelle `InvitationSchema.safeParse(form)`, retourne `{}` si succès, sinon `.error.flatten().fieldErrors` avec le premier message par champ (`flat.email?.[0]`). Écris aussi `isValid = computed(() => Object.keys(errors.value).length === 0)`.

5. **Écris `touch(field)` et `touchAll()`** — `touch` passe `touched[field] = true`, `touchAll` passe les deux à `true`.

6. **Écris le template** — le champ email doit avoir `:aria-invalid`, `:aria-describedby` conditionnels (uniquement si `touched.email && errors.email`), et un `<p>` avec `id="invite-email-error"` et `role="alert"` pour le message d'erreur. Idem pour le rôle.

7. **Écris `handleSubmit()`** — appelle `touchAll()`, `hasSubmitted.value = true`, vérifie `isValid.value`, si non valide : `await nextTick()` puis `.focus()` sur le premier champ en erreur et `return`. Si valide : `safeParse` défensif, `fetch` vers `/api/invitations`, gère le `!res.ok` avec `serverError`.

8. **Ajoute les styles** — contour rouge pour `input[aria-invalid="true"]` et `select[aria-invalid="true"]`, couleur rouge pour `.field-error` et `.server-error`.

9. **Teste les cas limites** : submit à vide → les deux erreurs apparaissent et le focus va sur l'email ; remplir l'email invalide puis blur → erreur format apparaît immédiatement ; corriger le format → erreur disparaît en temps réel ; submit valide → message de succès.

---

## Corrigé complet commenté

```vue
<!-- InvitationForm.vue — corrigé complet -->
<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { useTemplateRef, nextTick } from 'vue'
import { z } from 'zod'

// ── Schéma zod ──────────────────────────────────────────────────────────────
// Source unique de vérité : les règles ET le type viennent d'ici.
// Pas de regex email manuelle — zod's .email() couvre les cas standards.
const InvitationSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requis')           // min(1) attrape la chaîne vide avant .email()
    .email('Format email invalide'),
  role: z.enum(['admin', 'membre'], {
    errorMap: () => ({ message: 'Choisissez un rôle' }),
    // errorMap remplace le message d'erreur par défaut de z.enum
    // sans errorMap, le message serait "Invalid enum value. Expected ..."
  }),
})

// z.infer<typeof Schema> — le typeof est OBLIGATOIRE
// InvitationSchema est une valeur (instance), pas un type.
// typeof extrait le type statique pour que z.infer puisse l'utiliser.
type InvitationData = z.infer<typeof InvitationSchema>
// ≡ { email: string; role: 'admin' | 'membre' }

// Type des erreurs par champ — Partial car tous les champs peuvent être valides
type FieldErrors = Partial<Record<keyof InvitationData, string>>

// ── État du formulaire ───────────────────────────────────────────────────────
// reactive() pour les objets multi-champs : plus lisible que plusieurs ref()
const form    = reactive({ email: '', role: '' })
// touched : contrôle QUAND afficher une erreur (après que le champ a été quitté)
// Initialisé à false — aucune erreur visible au premier rendu
const touched = reactive({ email: false, role: false })

// hasSubmitted : bascule à true au premier clic sur Envoyer
// Sert à désactiver le bouton après un submit raté (pas avant)
const hasSubmitted  = ref(false)
// submitSuccess : true après un fetch réussi → affiche le message de succès
const submitSuccess = ref(false)
// serverError : message d'erreur global reçu du serveur (hors erreurs de champ)
const serverError   = ref<string | null>(null)

// ── Refs de template — Vue 3.5 ───────────────────────────────────────────────
// useTemplateRef(name) lie à ref="name" dans le template
// Permet d'appeler .focus() programmatiquement au submit raté
const emailInput = useTemplateRef<HTMLInputElement>('email-field')
const roleSelect = useTemplateRef<HTMLSelectElement>('role-field')

// ── Validation zod — computed ────────────────────────────────────────────────
// computed recalcule automatiquement à chaque frappe dans form.email / form.role
// safeParse ne lève jamais d'exception — retourne { success, data | error }
const errors = computed<FieldErrors>(() => {
  const result = InvitationSchema.safeParse(form)
  if (result.success) return {}          // aucune erreur → objet vide
  // flatten().fieldErrors = { email: string[], role: string[] }
  // On prend le premier message par champ (le plus spécifique)
  const flat = result.error.flatten().fieldErrors
  return {
    email: flat.email?.[0],   // undefined si email valide
    role:  flat.role?.[0],    // undefined si role valide
  }
})

// isValid : true quand errors est un objet vide
// Utilisé pour le :disabled du bouton et le guard dans handleSubmit
const isValid = computed(() => Object.keys(errors.value).length === 0)

// ── Helpers touched ──────────────────────────────────────────────────────────
// touch(field) : appelé par @blur — marque le champ comme "quitté"
// Après ça, l'erreur du champ s'affiche si elle existe
function touch(field: keyof typeof touched) {
  touched[field] = true
}

// touchAll() : appelé au submit — révèle toutes les erreurs en une fois
// Sans ça, un utilisateur qui clique directement sur Envoyer
// sans toucher les champs ne verrait aucune erreur (touched = false partout)
function touchAll() {
  touched.email = true
  touched.role  = true
}

// ── Soumission ───────────────────────────────────────────────────────────────
async function handleSubmit(): Promise<void> {
  serverError.value = null     // reset erreur serveur d'un submit précédent

  touchAll()                   // révèle toutes les erreurs avant de tester isValid
  hasSubmitted.value = true    // active le :disabled du bouton après ce premier essai

  if (!isValid.value) {
    // nextTick : Vue met à jour le DOM de façon asynchrone.
    // Sans await nextTick(), focus() s'exécute avant que le champ aria-invalid
    // soit mis à jour dans le DOM — le lecteur d'écran rate le contexte.
    await nextTick()
    // Focus sur le PREMIER champ invalide (ordre du formulaire, pas alphab.)
    // Un utilisateur clavier/lecteur d'écran est guidé directement vers la correction
    if (errors.value.email) {
      emailInput.value?.focus()
    } else if (errors.value.role) {
      roleSelect.value?.focus()
    }
    return   // stopper ici — ne pas envoyer de requête
  }

  // Deuxième safeParse défensif pour obtenir un type sûr (InvitationData)
  // isValid.value est déjà true ici, donc result.success sera toujours true.
  // Ce pattern évite un cast dangereux (form as InvitationData)
  const result = InvitationSchema.safeParse(form)
  if (!result.success) return   // garde défensive — ne devrait jamais arriver

  try {
    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.data),   // result.data = InvitationData typé
    })
    if (!res.ok) {
      const body = await res.json() as { message?: string }
      serverError.value = body.message ?? 'Erreur serveur'
      return
    }
    submitSuccess.value = true   // déclenche le message de succès dans le template
  } catch {
    serverError.value = 'Erreur réseau — réessayer'
  }
}
</script>

<template>
  <!--
    Message de succès — remplace le formulaire après envoi.
    role="status" + aria-live="polite" : annoncé par le lecteur d'écran
    sans interrompre la lecture en cours (polite, pas assertive)
  -->
  <div v-if="submitSuccess" role="status" aria-live="polite" class="success">
    Invitation envoyée avec succès.
  </div>

  <!--
    novalidate : désactive la bulle de validation HTML native du navigateur.
    On contrôle nous-mêmes les messages, leur placement et leurs attributs ARIA.
    Sans novalidate, le navigateur peut afficher ses propres messages AVANT les nôtres.
    @submit.prevent : intercepte la soumission native, appelle handleSubmit()
  -->
  <form v-else @submit.prevent="handleSubmit" novalidate>

    <!-- ── Champ Email ──────────────────────────────────────────────────── -->
    <div class="field">
      <!--
        for="invite-email" lie le label au champ via son id.
        Un clic sur le label met le focus sur l'input — RGAA 11.1 obligatoire.
      -->
      <label for="invite-email">Adresse email</label>

      <input
        ref="email-field"
        id="invite-email"
        v-model.trim="form.email"
        type="email"
        autocomplete="email"
        :aria-invalid="touched.email && errors.email ? 'true' : undefined"
        :aria-describedby="touched.email && errors.email ? 'invite-email-error' : undefined"
        @blur="touch('email')"
      />
      <!--
        aria-invalid="true" : annonce au lecteur d'écran que ce champ est invalide.
        undefined supprime l'attribut du DOM — préférable à "false" (redondant).

        aria-describedby="invite-email-error" : lie le champ à son message d'erreur.
        Le lecteur d'écran lit : "Adresse email, invalide, Format email invalide".
        Conditionnel : uniquement quand l'erreur est visible (touched + erreur).

        @blur="touch('email')" : marque touched.email = true quand l'utilisateur
        quitte le champ. Le computed errors recalcule et l'erreur peut s'afficher.
        v-model.trim : retire les espaces début/fin — "  user@a.com  " → "user@a.com"
      -->

      <!--
        role="alert" : le lecteur d'écran annonce ce nœud dès qu'il apparaît dans le DOM.
        Pas besoin d'interaction — l'annonce est automatique (live region implicite).
        id="invite-email-error" doit matcher aria-describedby sur l'input ci-dessus.
        v-if : le nœud disparaît quand l'erreur est résolue (pas v-show qui laisse un nœud vide).
      -->
      <p
        v-if="touched.email && errors.email"
        id="invite-email-error"
        role="alert"
        class="field-error"
      >{{ errors.email }}</p>
    </div>

    <!-- ── Champ Rôle ────────────────────────────────────────────────────── -->
    <div class="field">
      <label for="invite-role">Rôle</label>

      <select
        ref="role-field"
        id="invite-role"
        v-model="form.role"
        :aria-invalid="touched.role && errors.role ? 'true' : undefined"
        :aria-describedby="touched.role && errors.role ? 'invite-role-error' : undefined"
        @blur="touch('role')"
      >
        <!--
          value="" disabled : option placeholder — non sélectionnable après premier choix.
          Zod enum(['admin', 'membre']) n'accepte pas '' → déclenchera l'erreur 'Choisissez un rôle'
          si l'utilisateur n'a pas changé la sélection.
        -->
        <option value="" disabled>Choisir un rôle</option>
        <option value="admin">Admin</option>
        <option value="membre">Membre</option>
      </select>

      <p
        v-if="touched.role && errors.role"
        id="invite-role-error"
        role="alert"
        class="field-error"
      >{{ errors.role }}</p>
    </div>

    <!-- ── Erreur globale serveur ─────────────────────────────────────────── -->
    <!--
      serverError : erreur non liée à un champ (ex: "Email déjà membre", erreur réseau).
      role="alert" : annonce immédiate par le lecteur d'écran.
    -->
    <p v-if="serverError" role="alert" class="server-error">{{ serverError }}</p>

    <!-- ── Bouton submit ──────────────────────────────────────────────────── -->
    <!--
      :disabled="hasSubmitted && !isValid" :
      - hasSubmitted = false au chargement → bouton actif même si le formulaire est vide.
        L'utilisateur doit pouvoir tenter un submit pour découvrir les erreurs.
      - hasSubmitted = true après le premier clic → si invalide, bouton grisé.
        Empêche les double-soumissions et guide vers la correction.
      Ne jamais écrire :disabled="!isValid" seul — le bouton serait grisé dès le chargement.
    -->
    <button
      type="submit"
      :disabled="hasSubmitted && !isValid"
    >
      Inviter
    </button>

  </form>
</template>

<style scoped>
/* Chaque champ dans un flex-column pour empiler label, input et message d'erreur */
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1.25rem;
}

/*
  Contour rouge sur les champs invalides — signal visuel qui double aria-invalid.
  Le sélecteur CSS utilise l'attribut aria-invalid="true" directement :
  pas de class supplémentaire, l'attribut ARIA fait les deux rôles (a11y + style).
*/
input[aria-invalid="true"],
select[aria-invalid="true"] {
  border-color: #dc2626;
  outline-color: #dc2626;
}

/* Messages d'erreur — rouge, petite taille, pas de marge parasite */
.field-error,
.server-error {
  color: #dc2626;
  font-size: 0.875rem;
  margin: 0;
}

.server-error {
  margin-bottom: 1rem;
}

/* Message de succès — vert sobre */
.success {
  color: #16a34a;
  font-weight: 600;
  padding: 1rem 0;
}

/* Bouton désactivé — feedback visuel clair */
button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
```

**Pourquoi ce corrigé est correct :**

- `InvitationSchema.safeParse(form)` dans un `computed` — zod revalide à chaque frappe, sans aucune logique de condition manuelle. Le `computed` recalcule quand `form` change.
- `touched` sépare "est-ce que le champ est invalide ?" de "doit-on afficher l'erreur ?". Sans ça, le formulaire vide affiche des erreurs au premier rendu.
- Le sélecteur CSS `input[aria-invalid="true"]` fait double emploi : il signale visuellement ET garantit que le style ne peut s'appliquer que si l'attribut ARIA est là — aucun desync possible entre style et accessibilité.
- `await nextTick()` avant `.focus()` est non négociable : Vue applique ses changements de DOM de façon asynchrone. Sans `nextTick`, le focus peut s'exécuter avant que `aria-invalid` soit dans le DOM, et le lecteur d'écran manque le contexte d'erreur.

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — reproduire de mémoire en 30 minutes :**

1. Ajoute un troisième champ **message** (`<textarea>`, max 200 caractères, optionnel). Le schéma zod accepte `z.string().max(200).optional()`. Le compteur de caractères restants s'affiche en temps réel : `200 caractères restants` → `0 caractères restants` quand plein, classe `.counter--warning` sous 20 caractères.

2. Ajoute une **vérification async de l'email** au `@blur` du champ email : appel `GET /api/check-email?email=...` qui retourne `{ available: boolean }`. Si `available: false`, afficher "Email déjà membre de cette famille" en plus des erreurs zod. Utilise `safeParseAsync` (et non `safeParse`) si tu intègres ça dans le schéma, ou un `ref<string | null> emailAsyncError` séparé si tu le gères hors schéma.

3. **Sans ouvrir ce corrigé** ni le module 11.

**Critère de réussite :** le formulaire fonctionne dans le navigateur, les trois champs sont accessibles (aria-invalid + aria-describedby), le focus au submit raté cible le premier champ invalide.

---

## Application TribuZen

Dans `smaurier/tribuzen`, le composant et son schéma vivent ici :

```
tribuzen/
  src/
    components/
      invitations/
        InvitationForm.vue      ← composant de ce lab
    schemas/
      invitation.ts             ← InvitationSchema + InvitationData (exportés)
```

**Différences par rapport au lab :**

- `InvitationSchema` et `InvitationData` sont dans `src/schemas/invitation.ts` et importés dans le composant — le schéma est partageable avec le back NestJS si le repo est mono (même `z.object`).
- Le fetch vers `/api/invitations` passe par un composable `useInvitations()` (module 09 — composables), pas un appel brut dans le composant.
- Les styles utilisent les variables CSS du design system TribuZen — la logique `:aria-invalid` reste identique, seule la valeur des couleurs change.
- L'accessibilité des erreurs est **non négociable** dans TribuZen : les familles incluent des personnes âgées ou à mobilité réduite qui utilisent lecteurs d'écran et navigation clavier. Les critères RGAA 11.1 (label), 11.10 (message d'erreur lié), 11.11 (message d'erreur visible) s'appliquent.

**Commit cible :**

```
feat(invitations): InvitationForm — zod schema, touched states, aria-invalid + describedby, focus on error
```
