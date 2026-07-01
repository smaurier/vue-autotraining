---
titre: Formulaires et validation
cours: 02-vue
notions: [v-model sur formulaire, validation synchrone et asynchrone, schéma de validation avec zod, VeeValidate en survol, messages d'erreur et états touched dirty, accessibilité des erreurs aria-invalid et aria-describedby, soumission et désactivation, validation au blur vs au submit]
outcomes:
  - sait construire un formulaire typé avec v-model et un état de validation
  - sait valider avec un schéma (zod) et afficher des messages d'erreur clairs
  - sait rendre les erreurs accessibles (aria-invalid, aria-describedby, focus)
  - sait choisir le bon moment de validation (blur, submit) et gérer la soumission
prerequis: [10-gestion-async]
next: 12-slots-avances
libs: [{ name: vue, version: "3.5" }, { name: zod, version: "3" }]
tribuzen: front-office TribuZen — InvitationForm (email + rôle) validée par schéma zod, erreurs accessibles RGAA
last-reviewed: 2026-07
---

← [Module 10 — Gestion asynchrone](10-gestion-async.md)

# Formulaires et validation

> **Outcomes — tu sauras FAIRE :** construire un formulaire typé avec `v-model`, valider avec un schéma `zod`, afficher des erreurs accessibles (`aria-invalid`, `aria-describedby`, focus), choisir le bon timing de validation.
> **Difficulté :** :star::star::star:
>
> **Portée :** ce module couvre la validation **côté client** avec un schéma zod et les patterns d'accessibilité WCAG. La validation serveur (réponse 422, affichage d'erreur back) est abordée en §2.5. VeeValidate est introduit en survol — un module dédié le couvre si ton projet l'adopte pleinement.

---

## 1. Cas concret d'abord

Tu travailles sur TribuZen. L'admin d'une famille veut inviter un nouveau membre. Le formulaire actuel ressemble à ça :

```vue
<!-- InvitationForm.vue — AVANT validation -->
<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const role  = ref('')

async function invite() {
  await fetch('/api/invitations', {
    method: 'POST',
    body: JSON.stringify({ email: email.value, role: role.value }),
  })
}
</script>

<template>
  <form @submit.prevent="invite">
    <input v-model="email" type="email" placeholder="Email" />
    <select v-model="role">
      <option value="">Choisir un rôle</option>
      <option value="admin">Admin</option>
      <option value="membre">Membre</option>
    </select>
    <button type="submit">Inviter</button>
  </form>
</template>
```

**Trois problèmes concrets :**
1. `email = ""` → la requête part quand même (email vide envoyé au serveur).
2. `role = ""` → le back reçoit une chaîne vide, renvoie une 422, mais le formulaire ne dit rien à l'utilisateur.
3. Un lecteur d'écran ne sait pas que `email` est en erreur — pas d'`aria-invalid`, pas de message lié.

Ce module te donne les outils pour corriger les trois, en ajoutant un schéma zod, des états `touched`/`dirty` et les attributs ARIA obligatoires.

---

## 2. Théorie complète, concise

### 2.1 `v-model` sur les éléments de formulaire

`v-model` est un raccourci pour `:value` + `@input` (ou `@change` selon l'élément). Il adapte automatiquement l'événement et la propriété selon le type d'élément.

```vue
<script setup lang="ts">
import { ref } from 'vue'

const email    = ref('')       // <input type="text|email">
const password = ref('')       // <input type="password">
const agree    = ref(false)    // <input type="checkbox">
const role     = ref('')       // <select>
const bio      = ref('')       // <textarea>
</script>

<template>
  <input  v-model="email"    type="email" />
  <input  v-model="password" type="password" />
  <input  v-model="agree"    type="checkbox" />
  <select v-model="role">
    <option value="admin">Admin</option>
    <option value="membre">Membre</option>
  </select>
  <textarea v-model="bio"></textarea>
</template>
```

**Modificateurs utiles :**

| Modificateur | Effet |
|---|---|
| `v-model.trim` | Retire les espaces début/fin avant de stocker |
| `v-model.number` | Convertit en `number` (utile pour `<input type="number">`) |
| `v-model.lazy` | Se met à jour sur `@change` (perte de focus) plutôt qu'`@input` |

```vue
<!-- Email sans espaces accidentels -->
<input v-model.trim="email" type="email" />

<!-- Âge converti en number -->
<input v-model.number="age" type="number" />
```

Pour un **groupe de checkboxes** lié à un tableau ou un **groupe de radios** lié à une valeur unique, `v-model` fonctionne identiquement — Vue gère la sémantique.

### 2.2 Validation synchrone avec `computed`

Le pattern le plus simple : un `computed` qui retourne un objet d'erreurs depuis l'état du formulaire.

```ts
import { reactive, computed } from 'vue'

interface InviteForm {
  email: string
  role: 'admin' | 'membre' | ''
}

const form = reactive<InviteForm>({ email: '', role: '' })

const errors = computed(() => {
  const e: Partial<Record<keyof InviteForm, string>> = {}
  if (!form.email.trim())               e.email = 'Email requis'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide'
  if (!form.role)                       e.role  = 'Rôle requis'
  return e
})

const isValid = computed(() => Object.keys(errors.value).length === 0)
```

**Limite :** le `computed` recalcule à chaque frappe. Si la règle fait un appel réseau, ce n'est pas le bon endroit — voir §2.5.

### 2.3 États `touched` et `dirty`

Ces deux états contrôlent **quand** montrer les erreurs :

- **`touched`** — l'utilisateur a quitté le champ au moins une fois (`@blur`). On ne montre l'erreur qu'après que le champ a été touché.
- **`dirty`** — la valeur diffère de la valeur initiale. Utile pour détecter des modifications non sauvegardées.

```ts
import { reactive } from 'vue'

const initialValues = { email: '', role: '' as 'admin' | 'membre' | '' }
const form    = reactive({ ...initialValues })
const touched = reactive({ email: false, role: false })

// dirty par champ — calculé en temps réel
const dirty = computed(() => ({
  email: form.email !== initialValues.email,
  role:  form.role  !== initialValues.role,
}))

function touch(field: keyof typeof touched) {
  touched[field] = true
}

function touchAll() {
  touched.email = true
  touched.role  = true
}
```

Dans le template, afficher l'erreur seulement si le champ est `touched` :

```vue
<span v-if="touched.email && errors.email">{{ errors.email }}</span>
```

Au moment du submit, `touchAll()` révèle toutes les erreurs en une fois.

### 2.4 Schéma de validation avec zod

**zod** définit un schéma de données typé depuis lequel on infère automatiquement le type TypeScript — pas besoin de dupliquer interface et règles.

```ts
import { z } from 'zod'

// Définir le schéma ONCE — le type en découle
const InvitationSchema = z.object({
  email: z.string()
    .min(1, 'Email requis')
    .email('Format email invalide'),
  role: z.enum(['admin', 'membre'], {
    errorMap: () => ({ message: 'Choisissez un rôle' }),
  }),
})

// Inférer le type TypeScript depuis le schéma — source unique de vérité
type InvitationData = z.infer<typeof InvitationSchema>
// ≡ { email: string; role: 'admin' | 'membre' }
```

**`safeParse` vs `parse` :**

```ts
// parse — lève une exception si invalide (utile en dehors des formulaires)
const data = InvitationSchema.parse(rawInput)   // ZodError si invalide

// safeParse — retourne un discriminated union, ne lève jamais
const result = InvitationSchema.safeParse(rawInput)

if (result.success) {
  result.data   // InvitationData — typé et validé
} else {
  result.error  // ZodError
  result.error.flatten().fieldErrors
  // { email: string[], role: string[] } — un tableau par champ
}
```

**Pattern Vue typique :** extraire les erreurs dans un objet plat :

```ts
import { ref, reactive, computed } from 'vue'
import { z } from 'zod'

const InvitationSchema = z.object({
  email: z.string().min(1, 'Email requis').email('Format email invalide'),
  role:  z.enum(['admin', 'membre'], { errorMap: () => ({ message: 'Rôle requis' }) }),
})

type InvitationData = z.infer<typeof InvitationSchema>
type FieldErrors    = Partial<Record<keyof InvitationData, string>>

const form    = reactive({ email: '', role: '' })
const touched = reactive({ email: false, role: false })

const errors = computed<FieldErrors>(() => {
  const result = InvitationSchema.safeParse(form)
  if (result.success) return {}
  // flatten().fieldErrors = { field: string[] } — on prend le premier message
  const flat = result.error.flatten().fieldErrors
  return {
    email: flat.email?.[0],
    role:  flat.role?.[0],
  }
})
```

`z.infer<typeof InvitationSchema>` — note le **`typeof`** devant le nom du schéma (variable, pas type). C'est la syntaxe zod standard.

### 2.5 Validation asynchrone

Certaines règles nécessitent un appel réseau — vérifier que l'email n'est pas déjà membre de la famille, par exemple. zod supporte les refinements asynchrones via `z.string().refine(async fn, options)`.

```ts
const InvitationSchemaAsync = z.object({
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Format email invalide')
    .refine(
      async (email) => {
        // ⚠️ à vérifier Context7 : z.string().refine async — zod v3
        const res = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`)
        const { available } = await res.json() as { available: boolean }
        return available
      },
      { message: 'Email déjà membre de cette famille' }
    ),
  role: z.enum(['admin', 'membre'], { errorMap: () => ({ message: 'Rôle requis' }) }),
})

// Avec un schéma async, on doit utiliser safeParseAsync (pas safeParse)
const result = await InvitationSchemaAsync.safeParseAsync(form)
```

**En pratique :** ne pas appeler la validation async à chaque frappe. Déclencher au `@blur` du champ email ou au submit, et gérer un état `checking` séparé.

Pour les **erreurs serveur** (422 après soumission) :

```ts
const serverErrors = ref<FieldErrors>({})

async function handleSubmit() {
  const result = InvitationSchema.safeParse(form)
  if (!result.success) { /* ... */ return }

  try {
    const res = await fetch('/api/invitations', {
      method: 'POST',
      body: JSON.stringify(result.data),
    })
    if (!res.ok) {
      const body = await res.json() as { errors?: FieldErrors }
      serverErrors.value = body.errors ?? {}
    }
  } catch {
    serverErrors.value = { email: 'Erreur réseau — réessayer' }
  }
}

// Fusionner dans les erreurs affichées
const displayErrors = computed<FieldErrors>(() => ({
  ...errors.value,
  ...serverErrors.value,   // les erreurs serveur écrasent le champ concerné
}))
```

### 2.6 VeeValidate en survol

**VeeValidate 4** est une librairie de gestion de formulaires Vue 3 qui s'intègre avec zod via `@vee-validate/zod`. Elle gère les états `touched`/`dirty`/`valid` et les messages d'erreur automatiquement.

```ts
// ⚠️ à vérifier Context7 : VeeValidate 4 + @vee-validate/zod — API exacte
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

const InvitationSchema = z.object({
  email: z.string().min(1, 'Email requis').email('Format email invalide'),
  role:  z.enum(['admin', 'membre']),
})

const { handleSubmit, errors, meta } = useForm({
  validationSchema: toTypedSchema(InvitationSchema),
})

const { value: email, errorMessage: emailError } = useField<string>('email')
const { value: role,  errorMessage: roleError  } = useField<string>('role')

const onSubmit = handleSubmit((values) => {
  // values est typé InvitationData grâce à toTypedSchema
  console.log(values)
})
```

**Quand utiliser VeeValidate vs validation manuelle ?**

| Cas | Recommandation |
|---|---|
| Formulaire simple (2-4 champs) | Validation manuelle + zod |
| Formulaire complexe (conditionnels, wizard, fieldArrays) | VeeValidate |
| Projet avec plusieurs formulaires | VeeValidate si l'équipe l'a adopté |
| Apprentissage / compréhension des mécanismes | Validation manuelle d'abord |

### 2.7 Accessibilité des erreurs — `aria-invalid`, `aria-describedby`, focus

C'est l'axe **RGAA** de ce module. Un formulaire accessible pour les lecteurs d'écran doit respecter trois règles :

**Règle 1 — `aria-invalid`** sur le champ en erreur.

```html
<!-- aria-invalid="true" annonce à VoiceOver/NVDA que ce champ est invalide -->
<!-- Ne pas mettre aria-invalid="false" explicitement — l'absence suffit -->
<input
  v-model="form.email"
  :aria-invalid="touched.email && errors.email ? 'true' : undefined"
/>
```

> `undefined` supprime l'attribut dans le DOM — préférable à `"false"` qui est redondant.

**Règle 2 — `aria-describedby` + `id` sur le message d'erreur.**

```html
<div>
  <label for="email">Adresse email</label>
  <input
    id="email"
    v-model="form.email"
    type="email"
    :aria-invalid="touched.email && errors.email ? 'true' : undefined"
    :aria-describedby="touched.email && errors.email ? 'email-error' : undefined"
    @blur="touch('email')"
  />
  <!-- role="alert" : le lecteur d'écran annonce automatiquement quand ce nœud apparaît -->
  <p
    v-if="touched.email && errors.email"
    id="email-error"
    role="alert"
    class="field-error"
  >
    {{ errors.email }}
  </p>
</div>
```

**Règle 3 — Focus sur le premier champ en erreur après un submit raté.**

Un utilisateur clavier ou de lecteur d'écran doit savoir où corriger. Au submit, si des erreurs existent, déplacer le focus vers le premier champ invalide.

```ts
import { useTemplateRef, nextTick } from 'vue'

const emailInput = useTemplateRef<HTMLInputElement>('email-field')
const roleSelect = useTemplateRef<HTMLSelectElement>('role-field')

async function handleSubmit() {
  touchAll()
  const result = InvitationSchema.safeParse(form)
  if (!result.success) {
    await nextTick()   // attendre que Vue mette à jour le DOM
    // Focus sur le premier champ en erreur (ordre du formulaire)
    if (errors.value.email) {
      emailInput.value?.focus()
    } else if (errors.value.role) {
      roleSelect.value?.focus()
    }
    return
  }
  // soumettre...
}
```

```html
<!-- ref="email-field" lie à useTemplateRef('email-field') — Vue 3.5 -->
<input ref="email-field" id="email" ... />
<select ref="role-field" id="role" ... />
```

### 2.8 Timing de validation — blur vs submit, désactivation

**Au `@blur` (recommandé pour UX) :** valider quand l'utilisateur quitte le champ. Feedback rapide, sans interrompre la saisie. Combiné avec `touched`.

**Au `@submit` uniquement :** valider tout au moment de l'envoi. Plus simple à implémenter, mais l'utilisateur ne sait pas qu'il y a des erreurs avant d'avoir tout rempli.

**Hybride (meilleure UX) :** `@blur` pour toucher et révéler l'erreur, puis le `computed` recalcule en temps réel pendant la correction.

```vue
<input
  v-model.trim="form.email"
  @blur="touch('email')"
/>
<!-- errors.email se recalcule à chaque frappe via computed — la correction est visible immédiatement -->
```

**Désactivation du bouton :**

```vue
<!-- ✅ Désactiver SEULEMENT après le premier submit raté (pas dès le chargement) -->
<button
  type="submit"
  :disabled="hasSubmitted && !isValid"
>
  Inviter
</button>
```

> Ne jamais désactiver le bouton submit par défaut. Un utilisateur qui arrive sur un formulaire vide voit un bouton grisé et ne comprend pas pourquoi. Désactiver seulement après une tentative échouée, ou utiliser un pattern "submit puis afficher les erreurs" sans désactivation du tout.

---

## 3. Worked examples

### Exemple complet — `InvitationForm.vue` avec zod et accessibilité

```vue
<!-- InvitationForm.vue — version validée, accessible -->
<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { useTemplateRef, nextTick } from 'vue'
import { z } from 'zod'

// ── Schéma zod — source unique de vérité pour le type ET les règles ──────
const InvitationSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Format email invalide'),
  role: z.enum(['admin', 'membre'], {
    errorMap: () => ({ message: 'Choisissez un rôle' }),
  }),
})

// Type inféré — pas besoin de dupliquer une interface
type InvitationData = z.infer<typeof InvitationSchema>

// ── État du formulaire ─────────────────────────────────────────────────
const form    = reactive({ email: '', role: '' })
const touched = reactive({ email: false, role: false })
const hasSubmitted  = ref(false)
const submitSuccess = ref(false)
const serverError   = ref<string | null>(null)

// ── Refs de template pour le focus (Vue 3.5) ──────────────────────────
const emailInput = useTemplateRef<HTMLInputElement>('email-field')
const roleSelect = useTemplateRef<HTMLSelectElement>('role-field')

// ── Erreurs zod — recalculées à chaque frappe ─────────────────────────
type FieldErrors = Partial<Record<keyof InvitationData, string>>

const errors = computed<FieldErrors>(() => {
  const result = InvitationSchema.safeParse(form)
  if (result.success) return {}
  const flat = result.error.flatten().fieldErrors
  return {
    email: flat.email?.[0],
    role:  flat.role?.[0],
  }
})

const isValid = computed(() => Object.keys(errors.value).length === 0)

// ── Helpers touched ───────────────────────────────────────────────────
function touch(field: keyof typeof touched) {
  touched[field] = true
}

function touchAll() {
  touched.email = true
  touched.role  = true
}

// ── Soumission ────────────────────────────────────────────────────────
async function handleSubmit(): Promise<void> {
  serverError.value = null
  touchAll()
  hasSubmitted.value = true

  if (!isValid.value) {
    // Focus sur le premier champ invalide — accessibilité clavier/lecteur d'écran
    await nextTick()
    if (errors.value.email) {
      emailInput.value?.focus()
    } else if (errors.value.role) {
      roleSelect.value?.focus()
    }
    return
  }

  // safeParse ici pour avoir un type sûr à envoyer au serveur
  const result = InvitationSchema.safeParse(form)
  if (!result.success) return   // sécurité défensive — ne devrait pas arriver

  try {
    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.data),
    })
    if (!res.ok) {
      const body = await res.json() as { message?: string }
      serverError.value = body.message ?? 'Erreur serveur'
      return
    }
    submitSuccess.value = true
  } catch {
    serverError.value = 'Erreur réseau — réessayer'
  }
}
</script>

<template>
  <div v-if="submitSuccess" role="status" aria-live="polite">
    Invitation envoyée avec succès.
  </div>

  <form v-else @submit.prevent="handleSubmit" novalidate>
    <!--
      novalidate : désactive la validation HTML native du navigateur.
      On gère les erreurs nous-mêmes pour contrôler les messages et l'accessibilité.
    -->

    <!-- ── Champ Email ──────────────────────────────────────── -->
    <div class="field">
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
        aria-describedby lie le champ à son message d'erreur.
        role="alert" : le lecteur d'écran annonce le message dès qu'il apparaît.
        id doit matcher aria-describedby.
      -->
      <p
        v-if="touched.email && errors.email"
        id="invite-email-error"
        role="alert"
        class="field-error"
      >
        {{ errors.email }}
      </p>
    </div>

    <!-- ── Champ Rôle ───────────────────────────────────────── -->
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
        <option value="" disabled>Choisir un rôle</option>
        <option value="admin">Admin</option>
        <option value="membre">Membre</option>
      </select>
      <p
        v-if="touched.role && errors.role"
        id="invite-role-error"
        role="alert"
        class="field-error"
      >
        {{ errors.role }}
      </p>
    </div>

    <!-- ── Erreur globale serveur ───────────────────────────── -->
    <p v-if="serverError" role="alert" class="server-error">
      {{ serverError }}
    </p>

    <!-- ── Submit — désactivé après un submit raté ─────────── -->
    <button
      type="submit"
      :disabled="hasSubmitted && !isValid"
    >
      Inviter
    </button>
  </form>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

/* Contour rouge sur le champ invalide — signal visuel + attribut aria */
input[aria-invalid="true"],
select[aria-invalid="true"] {
  border-color: #dc2626;
  outline-color: #dc2626;
}

.field-error,
.server-error {
  color: #dc2626;
  font-size: 0.875rem;
  margin: 0;
}
</style>
```

**Ce que ce composant garantit :**
- `InvitationSchema.safeParse` — zod valide email (format) + role (enum) sans code regex manuel.
- `touched` — les erreurs n'apparaissent qu'après interaction, pas au premier rendu.
- `aria-invalid="true"` + `aria-describedby` liés — VoiceOver/NVDA annonce "Adresse email, invalide, Format email invalide" quand le focus revient sur le champ.
- `focus()` au submit raté — un utilisateur clavier/lecteur d'écran est guidé vers le premier champ à corriger.
- `novalidate` — on désactive la bulle native du navigateur pour contrôler l'expérience.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Valider seulement au submit sans feedback au blur

```vue
<!-- ❌ L'utilisateur remplit tout, clique Envoyer, découvre toutes les erreurs d'un coup -->
<input v-model="form.email" />
<span v-if="hasSubmitted && errors.email">{{ errors.email }}</span>
```

L'utilisateur a déjà fait l'effort de remplir tous les champs. Découvrir l'email invalide à la toute fin est frustrant.

```vue
<!-- ✅ @blur révèle l'erreur dès que le champ est quitté -->
<input v-model.trim="form.email" @blur="touch('email')" />
<span v-if="touched.email && errors.email">{{ errors.email }}</span>
```

Le `computed` recalcule à chaque frappe — la correction est visible immédiatement sans autre code.

### PIÈGE #2 — Message d'erreur non relié au champ (lecteur d'écran)

```html
<!-- ❌ Le lecteur d'écran lit le champ, puis passe au suivant — il ne sait pas que l'erreur dessous le concerne -->
<input id="email" v-model="form.email" />
<p v-if="errors.email" class="error">{{ errors.email }}</p>
```

```html
<!-- ✅ aria-describedby + id + role="alert" — le message est annoncé automatiquement -->
<input
  id="email"
  v-model="form.email"
  :aria-invalid="touched.email && errors.email ? 'true' : undefined"
  :aria-describedby="touched.email && errors.email ? 'email-error' : undefined"
/>
<p v-if="touched.email && errors.email" id="email-error" role="alert">
  {{ errors.email }}
</p>
```

Sans `aria-describedby`, l'erreur est invisible pour un utilisateur de lecteur d'écran — c'est une non-conformité RGAA/WCAG 3.3.1.

### PIÈGE #3 — Bouton submit désactivé dès le chargement

```vue
<!-- ❌ Le bouton est grisé avant toute interaction — l'utilisateur ne sait pas pourquoi -->
<button :disabled="!isValid">Inviter</button>
```

Un formulaire vide a toujours `isValid = false`. L'utilisateur voit un bouton grisé et pense que la fonctionnalité est indisponible.

```vue
<!-- ✅ Désactiver seulement après un submit raté -->
<button :disabled="hasSubmitted && !isValid">Inviter</button>
```

Ou ne pas désactiver du tout et afficher les erreurs au submit — les deux approches sont valides selon l'UX choisie.

### PIÈGE #4 — `z.infer<Schema>` sans `typeof`

```ts
// ❌ ZodType est une valeur (une variable) — z.infer attend un TYPE
const InvitationSchema = z.object({ ... })
type Bad = z.infer<InvitationSchema>   // Erreur TS : 'InvitationSchema' refers to a value, not a type
```

```ts
// ✅ typeof transforme la valeur en son type pour z.infer
type Good = z.infer<typeof InvitationSchema>
```

`typeof` en position de type TS extrait le type statique de la variable — indispensable avec les schémas zod qui sont des instances, pas des types.

### PIÈGE #5 — `safeParse` pour un schéma async

```ts
// ❌ safeParse ignore les refinements async — ils sont silencieusement skippés
const result = InvitationSchemaAsync.safeParse(form)   // validation async ignorée !

// ✅ safeParseAsync pour tout schéma contenant un .refine() async
const result = await InvitationSchemaAsync.safeParseAsync(form)
```

Si le schéma contient un `z.string().refine(async fn)`, utiliser `safeParse` ne lance jamais le callback async — pas d'erreur visible, juste une validation silencieusement incomplète.

---

## 5. Ancrage TribuZen

**`InvitationForm.vue`** est la porte d'entrée des nouveaux membres dans une famille TribuZen. L'admin invite par email avec un rôle (`admin` ou `membre`).

Le schéma zod `InvitationSchema` est partagé entre front et back (si le back est Node/TypeScript) — une seule source de vérité pour les règles de validation.

```
tribuzen/
  src/
    components/
      invitations/
        InvitationForm.vue      ← composant de ce module (v-model, zod, aria)
    schemas/
      invitation.ts             ← InvitationSchema + InvitationData (partageable)
```

L'accessibilité est **non négociable pour TribuZen** : les familles incluent des personnes âgées qui utilisent des lecteurs d'écran ou une navigation clavier. `aria-invalid`, `aria-describedby` et le focus sur le premier champ en erreur sont des critères RGAA 11.x (formulaires).

```
feat(invitations): InvitationForm — zod schema, touched/dirty, aria-invalid + describedby
```

---

## 6. Points clés

1. `v-model` s'adapte au type d'élément (`input`, `select`, `textarea`, `checkbox`) — les modificateurs `.trim`, `.number`, `.lazy` affinent le comportement.
2. Un `computed` sur l'état du formulaire recalcule les erreurs à chaque frappe — pattern synchrone le plus simple.
3. `touched` (champ quitté) contrôle quand afficher une erreur ; `dirty` (valeur modifiée) détecte les changements non sauvegardés.
4. `zod` = schéma + type inféré en un seul endroit — `z.infer<typeof Schema>` (le `typeof` est obligatoire).
5. `safeParse` retourne `{ success, data | error }` sans lever d'exception — `.error.flatten().fieldErrors` pour les erreurs par champ.
6. Pour un schéma avec `.refine(async fn)`, utiliser `safeParseAsync` — `safeParse` ignore les callbacks async.
7. `aria-invalid="true"` sur le champ + `aria-describedby="id-error"` sur le champ lié à `id="id-error"` sur le message + `role="alert"` — les trois ensemble pour la conformité RGAA.
8. Focus sur le premier champ invalide au submit raté : `await nextTick()` puis `.focus()` — indispensable pour la navigation clavier.
9. Ne désactiver le bouton submit que **après** une tentative échouée, jamais par défaut.

---

## 7. Seeds Anki

```
Quelle est la différence entre touched et dirty dans un formulaire Vue ?|touched = le champ a été quitté au moins une fois (@blur). dirty = la valeur diffère de la valeur initiale. touched sert à contrôler quand afficher une erreur ; dirty sert à détecter des changements non sauvegardés.
Comment inférer un type TypeScript depuis un schéma zod ?|z.infer<typeof MonSchema> — le typeof est obligatoire car MonSchema est une valeur (instance), pas un type. Oublier typeof provoque une erreur TS.
Quelle est la différence entre safeParse et parse de zod ?|parse lève une ZodError si invalide. safeParse retourne toujours { success: true, data } ou { success: false, error } sans exception — à préférer dans les formulaires pour rester déclaratif.
Quelles sont les trois règles aria pour rendre les erreurs de formulaire accessibles ?|1. aria-invalid="true" sur le champ en erreur. 2. aria-describedby="id-error" sur le champ, id="id-error" sur le message. 3. role="alert" sur le message pour que le lecteur d'écran l'annonce automatiquement.
Pourquoi utiliser novalidate sur un <form> Vue ?|novalidate désactive la bulle de validation native du navigateur. On gère nous-mêmes les messages d'erreur pour contrôler leur style, leur placement et leur accessibilité (aria).
Pourquoi faut-il await nextTick() avant de focus() le premier champ en erreur ?|Vue met à jour le DOM de façon asynchrone après un changement de state. Sans nextTick(), focus() s'exécute avant que le champ soit visible/accessible dans le DOM.
Quand utiliser safeParseAsync plutôt que safeParse ?|Dès que le schéma contient un .refine(async fn). safeParse ignore silencieusement les callbacks async — safeParseAsync est requis pour que les refinements async s'exécutent.
Quel est le piège de désactiver le bouton submit avec :disabled="!isValid" ?|Le formulaire vide a toujours isValid = false, donc le bouton est grisé dès le chargement. L'utilisateur ne comprend pas pourquoi. Préférer :disabled="hasSubmitted && !isValid" pour désactiver seulement après une tentative échouée.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-11-formulaires-et-validation/README.md`. Construire `InvitationForm.vue` de zéro — schéma zod, touched/dirty, messages d'erreur accessibles ARIA, focus au submit raté. Corrigé commenté intégral.
