# Lab 00 — Typer Vue 3

> **Outcome :** à la fin, tu sais annoter `ref<T>()`, `reactive` avec interface, `computed` avec union de string littéraux, et rétrécir `catch (e)` — avec `vue-tsc --noEmit` comme seul juge.
> **Vrai outil :** Vue 3.5 + `vue-tsc --noEmit` (alias `pnpm typecheck`).
> **Feedback :** zéro erreur `vue-tsc` = lab réussi — le coach valide en session.

---

## Énoncé

Tu rejoins TribuZen. Un collègue t'a laissé `FamilyCard.vue` avec **5 erreurs de typage délibérées**. `vue-tsc --noEmit` refuse de passer en vert. Ta mission : corriger chaque erreur **sans changer la logique** du composant.

**Règle absolue :** tu ne contournes pas TypeScript pour faire taire l'erreur — tu corriges le type.

### Starter minimal

Crée `src/components/family/FamilyCard.vue` dans ton projet Vite (`02-vue/`) avec ce contenu exact :

```vue
<!-- FamilyCard.vue — starter avec 5 erreurs de typage intentionnelles -->
<script setup>
import { ref, reactive, computed } from 'vue'

// Erreur 1 : lang="ts" manquant — TS ne vérifie rien dans ce fichier

// Erreur 2 : ref(null) sans annotation de type final
const family = ref(null)

// Erreur 3 : reactive utilisé sur une primitive
const memberCount = reactive(0)

// Erreur 4 : computed sur union de string littéraux sans annotation
const status = computed(() => {
  if (!family.value) return 'loading'
  if (family.value.memberCount === 0) return 'empty'
  return 'active'
})

// Erreur 5 : catch (e) sans rétrécissement de type
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
    <button @click="loadFamily('demo-id')">Recharger</button>
  </div>
  <p v-else>Chargement…</p>
</template>
```

Lance `pnpm typecheck` dans `02-vue/`. Lis chaque message d'erreur (numéro de ligne, type attendu, type reçu). Corrige les erreurs une par une et relance après chaque correction.

---

## Étapes (en friction)

1. **Lance l'oracle** — `pnpm typecheck` (= `vue-tsc --noEmit`). Compte les erreurs initiales. Note que certaines sont invisibles tant que `lang="ts"` est absent.
2. **Erreur 1 — active TypeScript** — ajoute `lang="ts"` sur `<script setup>`. Relance. Observe combien d'erreurs *apparaissent en plus* maintenant que le vérificateur est activé sur ce fichier.
3. **Erreur 2 — annote `ref(null)`** — déclare l'interface `Family` (champs : `id: string`, `name: string`, `memberCount: number`, `createdAt: string`). Quelle annotation permet à la ref de contenir `Family` ou `null` ? Pourquoi `ref<Family>(null)` seul ne suffit-il pas ?
4. **Erreur 3 — corrige `reactive` sur la primitive** — `reactive(0)` est refusé par TS. Quelle primitive utiliser à la place ? La règle : `reactive` pour les objets, `ref` pour les scalaires. En bonus : comment regrouper `memberCount` et `expanded` dans un objet `reactive` annoté avec une interface ?
5. **Erreur 4 — annote le `computed`** — `computed(() => ...)` infère `ComputedRef<string>`. Annote le générique pour obtenir exactement `'loading' | 'empty' | 'active'`. Ensuite essaie d'ajouter `return 'unknown'` dans une des branches — TS doit le refuser immédiatement.
6. **Erreur 5 — rétrécis `catch (e)`** — `e` est `unknown` en TS strict. Ajoute `instanceof Error` avant `.message`. Prévois un fallback si `e` n'est pas une `Error`.
7. **Vérifie le green** — `pnpm typecheck` doit retourner zéro erreur. Le lab est terminé.

---

## Corrigé complet commenté

```vue
<!-- FamilyCard.vue — corrigé, commenté ligne à ligne -->

<!--
  Correction 1 : lang="ts" sur <script setup>
  Sans cet attribut, TypeScript est silencieusement désactivé pour tout le fichier.
  Les erreurs de type ne s'affichent ni dans l'IDE ni dans vue-tsc.
  C'est la seule configuration nécessaire — pas de tsconfig supplémentaire.
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
// reactive n'est plus importé : memberCount est maintenant un ref (primitive).
// Si on avait voulu regrouper l'état dans un reactive, l'import serait resté.

// ── Correction 2 : interface + ref<Family | null>(null) ──────────────────
// On déclare l'interface AVANT la ref qui l'utilise (ordre de lecture naturel).
// Family | null : null = état avant chargement, Family = données après réponse API.
// ref<Family>(null) seul est une erreur TS : null n'est pas assignable à Family.
interface Family {
  id: string
  name: string
  memberCount: number
  createdAt: string
}

const family = ref<Family | null>(null)
// Après cette déclaration, TS garantit que :
// • family.value peut être null (avant fetch) ✅
// • family.value peut être Family (après fetch) ✅
// • family.value.name est string si family.value est non-null ✅
// • family.value = 42 → TS Error (number pas assignable à Family | null) ✅

// ── Bonus reactive (non requis ici, mais le pattern du module) ────────────
// Si on voulait regrouper plusieurs scalaires, on utiliserait reactive avec une interface :
// interface FamilyCardState { memberCount: number; expanded: boolean }
// const state: FamilyCardState = reactive({ memberCount: 0, expanded: false })
// Note : l'annotation est sur la VARIABLE, pas sur reactive<T>() — idiome Vue recommandé.
// ─────────────────────────────────────────────────────────────────────────

// Correction 3 : ref pour les primitives, pas reactive
// reactive(0) → TS Error : Argument of type 'number' is not assignable to object.
// La règle fondamentale : ref pour les scalaires, reactive pour les objets/tableaux.
// L'inférence suffit ici : ref(0) donne Ref<number> — pas besoin d'annoter.
const memberCount = ref(0)

// Correction 4 : annotation de type union sur computed
// Sans annotation : computed<string> — TS ne sait pas quelles strings sont valides.
// Avec l'annotation générique : TS vérifie que CHAQUE branche retourne
// exactement une des trois valeurs du type union.
// Essaie d'ajouter `return 'unknown'` → TS Error immédiat ✅
const status = computed<'loading' | 'empty' | 'active'>(() => {
  if (!family.value) return 'loading'
  if (family.value.memberCount === 0) return 'empty'
  return 'active'
})

// Correction 5 : rétrécissement de e dans catch
// En TS strict (strict: true dans tsconfig), e est 'unknown' — pas Error.
// instanceof Error réduit e à Error dans ce bloc → .message est string ✅
// Le else couvre les cas où e est une string, un nombre ou autre chose jeté.
async function loadFamily(id: string): Promise<void> {
  try {
    const res = await fetch(`/api/families/${id}`)
    // res.json() retourne Promise<any> — le cast as Family est nécessaire :
    // TS ne peut pas inférer la forme d'une réponse réseau à la compilation.
    family.value = await res.json() as Family
  } catch (e) {
    if (e instanceof Error) {
      // Dans ce bloc, TS a rétréci e : Error → .message est string garanti ✅
      console.error(e.message)
    } else {
      // Fallback : e peut être une string ou un objet non-Error
      console.error('Erreur inconnue lors du chargement')
    }
  }
}
</script>

<template>
  <div v-if="family" class="family-card">
    <!--
      Vue auto-unwrap les refs de premier niveau dans le template.
      Écrire family.name (pas family.value.name) — Vue gère le déballage.
      v-if="family" agit comme type guard : dans ce bloc, family est Family (non-null).
      Écrire family.value dans le template retournerait l'objet Ref lui-même.
    -->
    <h2>{{ family.name }}</h2>

    <!--
      memberCount est Ref<number> — auto-unwrappé.
      Écrire memberCount, pas memberCount.value.
    -->
    <p>{{ memberCount }} membres</p>

    <!--
      status est ComputedRef<'loading' | 'empty' | 'active'> — auto-unwrappé.
      Vue affiche la valeur de la string union directement.
    -->
    <p>Statut : {{ status }}</p>

    <button @click="loadFamily('demo-id')">Recharger</button>
  </div>
  <p v-else>Chargement…</p>
</template>
```

**Pourquoi ce corrigé est correct :**
- `ref<Family | null>(null)` est le pattern TribuZen standard pour tout état chargé depuis l'API : `null` en attente, `Family` après réponse — TS t'empêche de mélanger les deux.
- L'annotation `computed<'loading' | 'empty' | 'active'>` transforme le type union en contrat vérifiable : ajouter une branche qui retourne autre chose est une erreur de compilation, pas un bug runtime découvert en prod.
- Le rétrécissement `instanceof Error` dans `catch` est la seule façon d'accéder à `.message` de façon sûre en TS strict — pas un contournement, une pratique standard depuis TS 4.0.

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — tu as 25 minutes, corrigé interdit.**

Écris `LoginForm.vue` à partir d'une page blanche dans `src/components/auth/` :

1. `ref<string | null>(null)` pour `error`, inférence seule pour `email`, `password`, `loading`.
2. `computed<boolean>` nommé `canSubmit` : email non vide ET password ≥ 8 caractères (`.trim()` sur email).
3. `async function login(): Promise<void>` avec `fetch('/api/auth/login')`, gestion `catch (e)` + `finally` pour remettre `loading` à `false`.
4. **Contrainte bonus :** utilise `useTemplateRef<HTMLInputElement>('email-field')` (Vue 3.5) pour focus automatiquement l'input email dans `onMounted`. Le nom de variable peut différer du nom d'attribut `ref="email-field"` — c'est l'avantage de `useTemplateRef` sur l'ancienne syntaxe.
5. Template minimal : 2 inputs, 1 bouton `:disabled="!canSubmit || loading"`, 1 `<p v-if="error">`.

**Critère de réussite :** `pnpm typecheck` vert **et** ces ajouts provoquent des erreurs TS :
- `canSubmit.value = true` → readonly (computed)
- `error.value = 42` → number pas assignable à `string | null`
- `e.message` sans `instanceof Error` → Object is of type 'unknown'

---

## Application TribuZen

Dans `smaurier/tribuzen`, les deux composants de ce lab trouvent leur place immédiate :

```
tribuzen/
  src/
    components/
      auth/
        LoginForm.vue      ← variante J+30 : ref<string|null>, canSubmit, useTemplateRef
      family/
        FamilyCard.vue     ← corrigé du lab : ref<Family|null>, computed union, catch narrowing
    types/
      family.ts            ← l'interface Family sera importée ici (partagée entre composants)
```

**Différences par rapport au lab :**

- `Family` sera importée depuis `src/types/family.ts` plutôt que définie inline — dans le lab, on la définit localement pour isoler l'exercice de typage.
- `loadFamily` viendra d'un composable `useFamilyStore` (module intermédiaire 01) — dans le lab, on garde le `fetch` inline pour se concentrer sur le typage.
- `defineProps` et `defineEmits` typés (communication parent-enfant) arrivent au **module 05** — dans ce lab, on reste sur l'état local.

Lance `vue-tsc --noEmit` dans tribuzen avant de committer — zéro erreur attendu.

**Commit cible :**

```
feat(types): FamilyCard + LoginForm typés TS — ref<T>, computed union, catch narrowing
```
