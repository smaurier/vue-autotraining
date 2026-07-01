# Lab 16 — Tests unitaires (Vitest)

> **Outcome :** à la fin, tu sais écrire des tests Vitest complets pour une fonction pure et un composable réactif Vue 3, avec mocking d'un service externe.
> **Vrai outil :** Vitest 3 — `pnpm test` lance le runner réel, les tests passent ou échouent dans le terminal.
> **Feedback :** le coach valide la suite de tests en session — l'oracle est le terminal Vitest, pas un auto-correcteur.

---

## Énoncé

Tu testes deux unités de la logique d'invitation TribuZen.

**Unité 1 — `canInvite` (fonction pure)**

```ts
// src/domain/invitation.ts
export interface InvitationResult {
  ok: boolean
  reason?: 'already_member' | 'self_invitation' | 'ok'
}

export function canInvite(
  inviterId: string,
  targetEmail: string,
  memberEmails: string[]
): InvitationResult {
  if (inviterId === targetEmail) {
    return { ok: false, reason: 'self_invitation' }
  }
  if (memberEmails.includes(targetEmail)) {
    return { ok: false, reason: 'already_member' }
  }
  return { ok: true, reason: 'ok' }
}
```

**Unité 2 — `useInvitationStatus` (composable réactif)**

```ts
// src/composables/useInvitationStatus.ts
import { ref, computed } from 'vue'
import { canInvite, type InvitationResult } from '../domain/invitation'

export function useInvitationStatus(memberEmails: string[]) {
  const inviterId = ref('')
  const targetEmail = ref('')

  const status = computed<InvitationResult | null>(() =>
    inviterId.value && targetEmail.value
      ? canInvite(inviterId.value, targetEmail.value, memberEmails)
      : null
  )

  return { inviterId, targetEmail, status }
}
```

**Ce que tu dois écrire :**

1. `src/domain/invitation.test.ts` — suite de tests pour `canInvite` (5 cas minimum).
2. `src/composables/useInvitationStatus.test.ts` — suite de tests pour `useInvitationStatus` (3 cas minimum, avec `nextTick`).

**Pas de gap-fill** — tu crées les fichiers de test de zéro.

---

## Setup

Si tu pars d'un projet Vue 3 + Vite existant, installe Vitest et crée la config :

```bash
pnpm add -D vitest @vitejs/plugin-vue jsdom @vitest/coverage-v8
```

```ts
// vitest.config.ts (à la racine du projet)
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: ['src/domain/**', 'src/composables/**'],
    },
  },
})
```

```json
// package.json — ajout dans scripts
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "coverage": "vitest run --coverage"
  }
}
```

Lance `pnpm test` en watch mode pendant que tu écris les tests.

---

## Étapes (en friction)

1. **Crée `src/domain/invitation.ts`** avec le code fourni. Lance `pnpm test` — aucun test pour l'instant, mais vérifie que Vitest démarre sans erreur.

2. **Crée `src/domain/invitation.test.ts`**. Commence par le cas le plus simple : l'invitation autorisée avec une liste vide.

3. **Ajoute le cas auto-invitation.** Soumets `inviterId === targetEmail` et vérifie `reason`.

4. **Ajoute le cas déjà membre.** Passe un tableau `memberEmails` qui contient l'email target.

5. **Teste la priorité des règles.** Que se passe-t-il si `inviterId === targetEmail` ET l'email est dans `memberEmails` ? La fonction doit retourner `self_invitation`. Écris le test avant de vérifier dans le code source.

6. **Crée `src/composables/useInvitationStatus.ts`** avec le code fourni.

7. **Crée `src/composables/useInvitationStatus.test.ts`**. Premier test : `status` est `null` quand les champs sont vides.

8. **Ajoute le test de réactivité.** Mute `inviterId.value` et `targetEmail.value`, ajoute `await nextTick()`, puis lis `status.value`. Teste le cas "déjà membre".

9. **Lance `pnpm coverage`** et lis le rapport Branch %. Identifie les branches non couvertes et ajoute les tests manquants jusqu'à atteindre 100% Branch sur `domain/`.

---

## Corrigé complet commenté

### `src/domain/invitation.test.ts`

```ts
// Imports explicites — fonctionne que globals soit true ou false dans vitest.config
import { describe, it, expect } from 'vitest'
import { canInvite } from './invitation'

describe('canInvite — règles métier TribuZen', () => {

  // ── Cas nominal ────────────────────────────────────────────────────────────
  it('autorise si targetEmail est absent de la famille', () => {
    const result = canInvite(
      'alice@tz.app',
      'dave@tz.app',
      ['bob@tz.app', 'carol@tz.app']
    )
    // toEqual compare la structure de l'objet (pas la référence)
    // toBe échouerait ici : deux objets distincts même si contenu identique
    expect(result).toEqual({ ok: true, reason: 'ok' })
  })

  it('autorise si memberEmails est vide', () => {
    const result = canInvite('alice@tz.app', 'bob@tz.app', [])
    expect(result.ok).toBe(true)
    // toBe sur une primitive : strict ===, correct ici
  })

  // ── Auto-invitation ────────────────────────────────────────────────────────
  it('refuse si inviterId === targetEmail (auto-invitation)', () => {
    const result = canInvite('alice@tz.app', 'alice@tz.app', [])
    // Tester .ok ET .reason séparément : si ok est faux pour la mauvaise raison,
    // le second expect le révèle
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('self_invitation')
  })

  // ── Déjà membre ───────────────────────────────────────────────────────────
  it('refuse si targetEmail est déjà dans memberEmails', () => {
    const result = canInvite(
      'alice@tz.app',
      'bob@tz.app',
      ['bob@tz.app'] // bob est déjà là
    )
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('already_member')
  })

  it('refuse même si target est au milieu d'un grand tableau', () => {
    const members = Array.from({ length: 50 }, (_, i) => `member${i}@tz.app`)
    members[25] = 'bob@tz.app' // bob au milieu
    const result = canInvite('alice@tz.app', 'bob@tz.app', members)
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('already_member')
  })

  // ── Priorité des règles ────────────────────────────────────────────────────
  // Si inviterId === targetEmail ET l'email est dans memberEmails,
  // self_invitation doit prendre la priorité (c'est le premier if dans la fonction)
  it('donne la priorité à self_invitation quand les deux conditions sont vraies', () => {
    const result = canInvite(
      'alice@tz.app',
      'alice@tz.app',
      ['alice@tz.app'] // alice est dans sa propre liste
    )
    // Ce test documente un choix de conception non-évident.
    // Il doit rester vert même si on réordonne les conditions par accident —
    // si self_invitation devient already_member, c'est un bug.
    expect(result.reason).toBe('self_invitation')
  })
})
```

### `src/composables/useInvitationStatus.test.ts`

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { useInvitationStatus } from './useInvitationStatus'

// Pas de mock ici : canInvite est une fonction pure sans effet de bord.
// Mocker canInvite dans ce test ajouterait de la complexité sans valeur —
// on teste le composable ET la logique de canInvite, ce qui est correct.

describe('useInvitationStatus', () => {
  // ── État initial ────────────────────────────────────────────────────────────
  it('status est null tant que inviterId ou targetEmail est vide', () => {
    const { status } = useInvitationStatus(['bob@tz.app'])
    // computed retourne null si l'une des deux refs est vide
    // Pas de nextTick nécessaire ici : on lit status sans l'avoir muté
    expect(status.value).toBeNull()
  })

  it('status est null si seulement inviterId est rempli', async () => {
    const { inviterId, status } = useInvitationStatus(['bob@tz.app'])
    inviterId.value = 'alice@tz.app'
    await nextTick()
    expect(status.value).toBeNull()
  })

  // ── Réactivité : déjà membre ───────────────────────────────────────────────
  it('détecte un email déjà membre après mutation des refs', async () => {
    const { inviterId, targetEmail, status } = useInvitationStatus([
      'bob@tz.app',
    ])

    inviterId.value = 'alice@tz.app'
    targetEmail.value = 'bob@tz.app'

    // ⚠️ nextTick obligatoire : Vue batchise les recalculs computed.
    // Sans await nextTick(), status.value peut encore être null (ancien état).
    await nextTick()

    expect(status.value?.ok).toBe(false)
    expect(status.value?.reason).toBe('already_member')
  })

  // ── Réactivité : invitation autorisée ──────────────────────────────────────
  it('retourne ok pour un email absent de la famille', async () => {
    const { inviterId, targetEmail, status } = useInvitationStatus([
      'bob@tz.app',
    ])

    inviterId.value = 'alice@tz.app'
    targetEmail.value = 'dave@tz.app' // dave n'est pas dans la liste
    await nextTick()

    expect(status.value?.ok).toBe(true)
    expect(status.value?.reason).toBe('ok')
  })

  // ── Réactivité : mise à jour après changement ──────────────────────────────
  it('recalcule status quand targetEmail change', async () => {
    const { inviterId, targetEmail, status } = useInvitationStatus([
      'bob@tz.app',
    ])

    inviterId.value = 'alice@tz.app'
    targetEmail.value = 'dave@tz.app'
    await nextTick()
    expect(status.value?.ok).toBe(true)

    // On change targetEmail vers un membre existant
    targetEmail.value = 'bob@tz.app'
    await nextTick()
    // Le computed se recalcule automatiquement — c'est la valeur de la réactivité Vue
    expect(status.value?.ok).toBe(false)
    expect(status.value?.reason).toBe('already_member')
  })
})
```

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — en 30 minutes, de mémoire :**

1. Ajoute une règle à `canInvite` : refuser si `targetEmail` ne contient pas `@` (email invalide). La raison retournée est `'invalid_email'`.
2. Écris les tests de cette nouvelle règle **avant** d'implémenter la règle dans la fonction (TDD pur — les tests doivent d'abord échouer).
3. Ajoute un test de réactivité dans `useInvitationStatus.test.ts` qui vérifie que le status passe de `null` à `invalid_email` puis à `ok` en trois mutations successives avec `await nextTick()` entre chaque.
4. **Sans ouvrir ce corrigé ni le module 16.**

**Critère de réussite :** `pnpm test:run` passe sans erreur, `pnpm coverage` affiche 100% Branch sur `src/domain/invitation.ts`.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, ces fichiers vivent ici :

```
tribuzen/
  src/
    domain/
      invitation.ts
      invitation.test.ts       ← corrigé Exemple 1 du lab
    composables/
      useInvitationStatus.ts
      useInvitationStatus.test.ts  ← corrigé Exemple 2 du lab
  vitest.config.ts
```

**Différences par rapport au lab :**

- `memberEmails` viendra d'un store Pinia (`useFamilyStore().memberEmails`) plutôt qu'être passé en argument direct — le composable sera adapté pour lire le store.
- La règle `canInvite` sera enrichie (vérification de quota de membres, vérification d'email valide) — les tests existants restent valides pour les cas déjà couverts.
- Le coverage minimum est enforced en CI via `thresholds: { branches: 80 }` dans `vitest.config.ts`.

**Commit cible :**
```
test(domain): canInvite — suite complète (auto-invitation, déjà membre, priorité)
test(composables): useInvitationStatus — réactivité ref/computed, nextTick
```
