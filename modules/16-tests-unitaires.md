---
titre: Tests unitaires (Vitest)
cours: 02-vue
notions: [configuration Vitest pour Vue, describe it expect, matchers courants, tester une fonction pure, tester un composable, mock avec vi.fn et vi.mock, tester la réactivité ref computed, coverage]
outcomes:
  - sait configurer Vitest dans un projet Vue 3
  - sait tester une fonction métier pure et un composable réactif
  - sait mocker une dépendance avec vi.fn / vi.mock
  - sait lire un rapport de coverage et cibler ce qui compte
prerequis: [15-pinia]
next: 17-tests-composants
libs: [{ name: vue, version: "3.5" }, { name: vitest, version: "3" }]
tribuzen: logique métier TribuZen — tests Vitest de la règle d'invitation famille (refus si déjà membre / auto-invitation) et d'un composable
last-reviewed: 2026-07
---

# Tests unitaires (Vitest)

> **Outcomes — tu sauras FAIRE :** configurer Vitest dans un projet Vue 3, écrire des tests pour une fonction pure et un composable réactif, mocker une dépendance avec `vi.fn`/`vi.mock`, lire un rapport de coverage.
> **Difficulté :** :star::star::star:
>
> **Portée :** ce module couvre les **tests unitaires de logique pure et de composables**. Les tests de composants Vue avec montage DOM (`mount`, interactions, slots) sont le sujet du **module 17**.

---

## 1. Cas concret d'abord

Tu travailles sur la logique d'invitation de TribuZen. Avant d'écrire un seul composant, tu dois valider deux règles métier :

1. **Refus si déjà membre** — inviter quelqu'un qui est déjà dans la famille doit retourner `{ ok: false, reason: 'already_member' }`.
2. **Refus d'auto-invitation** — un membre ne peut pas s'inviter lui-même.

Un collègue a écrit la fonction. Comment savoir si elle est correcte sans lancer toute l'UI ?

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

Sans tests, tu dois lancer l'app, naviguer jusqu'au formulaire, saisir des données — et recommencer pour chaque cas. Avec Vitest, chaque règle s'exécute en millisecondes, en isolation, sans navigateur.

Ce module te donne les outils pour écrire ces tests, puis pour tester le composable réactif qui consomme cette logique.

---

## 2. Théorie complète, concise

### 2.1 Configuration Vitest pour Vue 3

Vitest est un runner de tests Vite-natif. Il réutilise la config Vite de ton projet — pas de transformation séparée.

**Installation :**

```bash
pnpm add -D vitest @vitejs/plugin-vue jsdom
```

**`vitest.config.ts` minimal pour Vue 3 :**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,        // describe, it, expect sans import
    environment: 'jsdom', // DOM simulé — requis pour les composables avec lifecycle
  },
})
```

> **`globals: true`** : Vitest injecte `describe`, `it`, `expect`, `vi` en global. Sans cette option, il faut les importer explicitement depuis `'vitest'`. Les deux modes fonctionnent — les exemples de ce module importent explicitement pour la clarté.

**Script `package.json` :**

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "coverage": "vitest run --coverage"
  }
}
```

`vitest` (sans `run`) lance le watch mode — relance les tests affectés à chaque sauvegarde.

### 2.2 Structure d'un test — `describe`, `it`, `expect`

```ts
import { describe, it, expect } from 'vitest'
import { canInvite } from '../domain/invitation'

// describe : groupe logique de tests pour une unité (fonction, composable, classe)
describe('canInvite', () => {

  // it : un comportement attendu, formulé en langage naturel
  it('retourne ok si le target est un nouvel email', () => {
    const result = canInvite(
      'alice@tribuzen.app',
      'bob@tribuzen.app',
      ['carol@tribuzen.app']
    )
    // expect(valeurObtenue).matcher(valeurAttendue)
    expect(result.ok).toBe(true)
    expect(result.reason).toBe('ok')
  })
})
```

**Convention de nommage `it` :** commence par un verbe à la troisième personne ou par "retourne / lance / émet" — la suite forme une phrase lisible dans le rapport d'échec.

### 2.3 Matchers courants

| Matcher | Usage |
|---|---|
| `toBe(val)` | Égalité stricte (`===`) — pour les primitives |
| `toEqual(val)` | Égalité profonde — pour les objets et tableaux |
| `toBeNull()` | Valeur est `null` |
| `toBeTruthy()` / `toBeFalsy()` | Truthy/falsy JS |
| `toContain(item)` | Tableau contient l'élément (ou string contient substring) |
| `toHaveLength(n)` | Tableau ou string de longueur `n` |
| `toThrow(msg?)` | La fonction lance une erreur (optionnellement avec message) |
| `toBeCloseTo(n)` | Nombre flottant approximativement égal |
| `not.matcher` | Inverse n'importe quel matcher |

```ts
expect({ ok: false, reason: 'already_member' }).toEqual({
  ok: false,
  reason: 'already_member',
})
// toBe échouerait : deux objets différents même si contenu identique
// toEqual passe : comparaison structurelle profonde
```

### 2.4 Tester une fonction pure

Une fonction pure est le test unitaire le plus simple : entrée → sortie, pas d'effet de bord.

```ts
import { describe, it, expect } from 'vitest'
import { canInvite } from '../domain/invitation'

describe('canInvite', () => {
  it('refuse une auto-invitation', () => {
    const result = canInvite('alice@tz.app', 'alice@tz.app', [])
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('self_invitation')
  })

  it('refuse si le target est déjà membre', () => {
    const result = canInvite(
      'alice@tz.app',
      'bob@tz.app',
      ['bob@tz.app', 'carol@tz.app']
    )
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('already_member')
  })

  it('autorise si le target est un nouvel email', () => {
    const result = canInvite('alice@tz.app', 'dave@tz.app', ['bob@tz.app'])
    expect(result.ok).toBe(true)
  })
})
```

**Règle :** un `it` teste **un seul comportement**. Si tu as besoin de `and` dans le nom du test, scinde-le.

### 2.5 Tester un composable réactif avec `nextTick`

Les composables qui utilisent `ref`, `computed` ou `watch` sont testables directement — tu appelles le composable, tu modifies les refs, tu lis le résultat.

```ts
// src/composables/useInvitationStatus.ts
import { ref, computed } from 'vue'
import { canInvite } from '../domain/invitation'

export function useInvitationStatus(memberEmails: string[]) {
  const inviterId = ref('')
  const targetEmail = ref('')

  const status = computed(() =>
    inviterId.value && targetEmail.value
      ? canInvite(inviterId.value, targetEmail.value, memberEmails)
      : null
  )

  return { inviterId, targetEmail, status }
}
```

```ts
// src/composables/useInvitationStatus.test.ts
import { describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import { useInvitationStatus } from './useInvitationStatus'

describe('useInvitationStatus', () => {
  it('status est null tant que les champs sont vides', () => {
    const { status } = useInvitationStatus(['bob@tz.app'])
    expect(status.value).toBeNull()
  })

  it('status se met à jour quand inviterId et targetEmail sont remplis', async () => {
    const { inviterId, targetEmail, status } = useInvitationStatus(['bob@tz.app'])

    inviterId.value = 'alice@tz.app'
    targetEmail.value = 'bob@tz.app'

    // ⚠️ nextTick : Vue met à jour les computed de façon asynchrone (batch)
    // Sans await nextTick(), status.value reflète encore l'ancien état
    await nextTick()

    expect(status.value).toEqual({ ok: false, reason: 'already_member' })
  })
})
```

**Quand `nextTick` est-il nécessaire ?**
- Après avoir modifié un `ref` ou `reactive` et avant de lire un `computed` qui en dépend dans le même tick d'exécution.
- Après avoir modifié un état pour lire une valeur dérivée par `watch`.
- **Pas nécessaire** quand tu lis `computed.value` juste après avoir modifié sa ref source, dans certains cas synchrones simples — mais l'habitude `await nextTick()` prévient les faux négatifs.

### 2.6 Mocker avec `vi.fn`, `vi.mock`, `vi.spyOn`

Le mocking isole l'unité testée de ses dépendances (API, services externes, timers).

**`vi.fn()` — créer une fonction espion :**

```ts
import { vi, expect, it } from 'vitest'

const fetchMembers = vi.fn()

// Configurer le retour
fetchMembers.mockResolvedValue(['alice@tz.app', 'bob@tz.app'])

await fetchMembers('family-1')

expect(fetchMembers).toHaveBeenCalledWith('family-1')
expect(fetchMembers).toHaveBeenCalledTimes(1)
```

**`vi.mock()` — remplacer un module entier :**

```ts
// Au niveau racine du fichier de test — Vitest hisse ce bloc avant les imports
vi.mock('../services/familyService', () => ({
  fetchFamilyMembers: vi.fn().mockResolvedValue(['alice@tz.app'])
}))

import { fetchFamilyMembers } from '../services/familyService'
import { describe, it, expect } from 'vitest'

describe('composable avec fetchFamilyMembers mocké', () => {
  it('charge les membres', async () => {
    // fetchFamilyMembers est maintenant le vi.fn() défini dans vi.mock()
    const members = await fetchFamilyMembers('family-42')
    expect(members).toEqual(['alice@tz.app'])
  })
})
```

> **Hoisting :** `vi.mock()` est automatiquement déplacé en haut du fichier par Vitest, avant les `import`. C'est pourquoi la factory (second argument) ne peut pas utiliser les variables définies dans le fichier de test — elles ne sont pas encore déclarées.

**`vi.spyOn()` — espionner une méthode existante sans la remplacer :**

```ts
import { vi } from 'vitest'
import * as invitationModule from '../domain/invitation'

const spy = vi.spyOn(invitationModule, 'canInvite')
spy.mockReturnValue({ ok: false, reason: 'already_member' })

// Après le test, restaurer l'implémentation originale
spy.mockRestore()
```

**Résumé — quand utiliser quoi :**

| Outil | Usage |
|---|---|
| `vi.fn()` | Créer une dépendance fictive passée en argument (injection) |
| `vi.mock()` | Remplacer un module importé entier (fetch, service, logger) |
| `vi.spyOn()` | Observer (et optionnellement remplacer) une méthode existante |

### 2.7 Coverage — lire et cibler

Vitest supporte deux providers de coverage : `v8` (rapide, recommandé) et `istanbul`.

**Installation :**

```bash
pnpm add -D @vitest/coverage-v8
```

**Config :**

```ts
// vitest.config.ts
export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/domain/**', 'src/composables/**'],
      exclude: ['src/**/*.d.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
      },
    },
  },
})
```

**Rapport texte — ce que tu vois dans le terminal :**

```
 % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
---------|----------|---------|---------|-------------------
  100    |    75    |   100   |   100   | 12
```

- **Stmts** — instructions exécutées
- **Branch** — branches conditionnelles (chaque `if/else`, `?:`, `&&` compte comme deux branches)
- **Funcs** — fonctions appelées au moins une fois
- **Uncovered Line #s** — lignes jamais atteintes

**Ce qui compte :** couvrir les branches (`Branch %`) est plus utile que les lignes — une ligne exécutée mais avec un seul chemin conditionnel testé donne 100% Stmts mais 50% Branch.

**Ce qui ne compte pas :** viser 100% coverage sur du code de configuration, des fichiers de types, des composants UI — concentre le coverage sur `domain/` et `composables/`.

---

## 3. Worked examples

### Exemple 1 — Tests complets de `canInvite` (fonction pure TribuZen)

```ts
// src/domain/invitation.test.ts
import { describe, it, expect } from 'vitest'
import { canInvite } from './invitation'

describe('canInvite — règles métier TribuZen', () => {
  // ── Cas nominaux ──────────────────────────────────────────────
  it('autorise si le target est un email absent de la famille', () => {
    const result = canInvite(
      'alice@tz.app',
      'dave@tz.app',
      ['bob@tz.app', 'carol@tz.app']
    )
    // toEqual pour comparer l'objet entier plutôt que propriété par propriété
    expect(result).toEqual({ ok: true, reason: 'ok' })
  })

  // ── Refus auto-invitation ─────────────────────────────────────
  it('refuse si inviterId === targetEmail (auto-invitation)', () => {
    const result = canInvite('alice@tz.app', 'alice@tz.app', [])
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('self_invitation')
  })

  // ── Refus déjà membre ─────────────────────────────────────────
  it('refuse si targetEmail est dans memberEmails', () => {
    const result = canInvite(
      'alice@tz.app',
      'bob@tz.app',
      ['bob@tz.app']
    )
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('already_member')
  })

  // ── Priorité des règles ───────────────────────────────────────
  // Si les deux conditions sont vraies à la fois (auto-invitation ET déjà membre),
  // la règle auto-invitation doit prendre la priorité (ordre de vérification)
  it('donne la priorité à self_invitation quand les deux conditions sont vraies', () => {
    const result = canInvite(
      'alice@tz.app',
      'alice@tz.app',
      ['alice@tz.app'] // alice est dans sa propre liste
    )
    expect(result.reason).toBe('self_invitation')
  })

  // ── Cas limites ────────────────────────────────────────────────
  it('autorise si memberEmails est vide', () => {
    const result = canInvite('alice@tz.app', 'bob@tz.app', [])
    expect(result.ok).toBe(true)
  })
})
```

**Pourquoi ce test est complet :**
- Chaque règle métier a son propre `it`.
- Le test de priorité documente un comportement non-évident (que se passe-t-il quand les deux conditions sont vraies simultanément ?).
- Les cas limites (`memberEmails` vide) évitent les bugs de tableaux non initialisés.

### Exemple 2 — Test du composable `useInvitationStatus` avec mock de service

```ts
// src/composables/useInvitationStatus.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'

// vi.mock hoiste avant les imports — la factory ne peut pas référencer des variables externes
vi.mock('../services/familyService', () => ({
  fetchFamilyMembers: vi.fn(),
}))

// Après vi.mock, on peut importer le mock pour le configurer dans chaque test
import { fetchFamilyMembers } from '../services/familyService'
import { useInvitationStatus } from './useInvitationStatus'

describe('useInvitationStatus', () => {
  beforeEach(() => {
    // Réinitialise les appels et retours entre chaque test
    vi.mocked(fetchFamilyMembers).mockResolvedValue(['bob@tz.app', 'carol@tz.app'])
  })

  it('status est null si les champs sont vides', () => {
    const { status } = useInvitationStatus([])
    expect(status.value).toBeNull()
  })

  it('détecte un membre déjà présent après nextTick', async () => {
    const { inviterId, targetEmail, status } = useInvitationStatus([
      'bob@tz.app',
    ])

    inviterId.value = 'alice@tz.app'
    targetEmail.value = 'bob@tz.app'
    // Mutation synchrone → computed Vue recalcule dans le même tick micro-task
    // await nextTick() garantit que le cycle de réactivité est terminé
    await nextTick()

    expect(status.value?.ok).toBe(false)
    expect(status.value?.reason).toBe('already_member')
  })

  it('autorise un email absent de la famille', async () => {
    const { inviterId, targetEmail, status } = useInvitationStatus([
      'bob@tz.app',
    ])

    inviterId.value = 'alice@tz.app'
    targetEmail.value = 'dave@tz.app'
    await nextTick()

    expect(status.value?.ok).toBe(true)
  })
})
```

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Tester l'implémentation, pas le comportement

```ts
// ❌ Teste l'implémentation (ordre des branches dans canInvite)
it('vérifie que la condition if est évaluée en premier', () => {
  // Ce test est fragile : si on réordonne les if, le test casse
  // sans que le comportement change
})

// ✅ Teste le comportement observable (ce que le code FAIT, pas comment)
it('refuse une auto-invitation', () => {
  const result = canInvite('alice@tz.app', 'alice@tz.app', [])
  expect(result.ok).toBe(false)
  expect(result.reason).toBe('self_invitation')
})
```

**Règle :** un test doit passer si on réécrit l'implémentation sans changer le comportement. Si le test casse pour une refactorisation valide, il testait l'implémentation.

### PIÈGE #2 — Oublier `await nextTick()` sur la réactivité

```ts
// ❌ Sans nextTick — peut passer ou échouer selon l'ordre des micro-tasks
it('status mis à jour', () => {
  const { inviterId, targetEmail, status } = useInvitationStatus(['bob@tz.app'])
  inviterId.value = 'alice@tz.app'
  targetEmail.value = 'bob@tz.app'
  // computed n'est pas garanti recalculé ici — résultat instable
  expect(status.value?.ok).toBe(false) // flaky !
})

// ✅ Avec await nextTick — le cycle de réactivité Vue est terminé
it('status mis à jour', async () => {
  const { inviterId, targetEmail, status } = useInvitationStatus(['bob@tz.app'])
  inviterId.value = 'alice@tz.app'
  targetEmail.value = 'bob@tz.app'
  await nextTick() // attend la fin du cycle de mise à jour Vue
  expect(status.value?.ok).toBe(false) // déterministe
})
```

### PIÈGE #3 — Sur-mocker (mocker ce qui ne sort pas de l'unité)

```ts
// ❌ Sur-mocker canInvite dans le test de useInvitationStatus
vi.mock('../domain/invitation', () => ({
  canInvite: vi.fn().mockReturnValue({ ok: false, reason: 'already_member' })
}))
// Problème : on teste useInvitationStatus sans jamais valider la vraie logique.
// Si canInvite a un bug, ce test ne le capturera pas.

// ✅ Tester useInvitationStatus avec la vraie canInvite
// Seules les dépendances EXTERNES (API, fetch, timers) méritent un mock
// La logique domain pure = pas de mock
```

**Règle :** ne mocker que les dépendances qui franchissent une frontière (réseau, système de fichiers, timer, module tiers non-déterministe). La logique pure en TypeScript s'appelle telle quelle.

### PIÈGE #4 — `toBe` vs `toEqual` pour les objets

```ts
const result = canInvite('alice@tz.app', 'bob@tz.app', [])

// ❌ toBe compare par référence — deux objets littéraux distincts ne sont jamais ===
expect(result).toBe({ ok: true, reason: 'ok' })  // ÉCHOUE toujours

// ✅ toEqual compare par valeur profonde
expect(result).toEqual({ ok: true, reason: 'ok' })  // passe si contenu identique
```

### PIÈGE #5 — `vi.mock()` avec des variables du scope du test

```ts
// ❌ Vitest hisse vi.mock() avant les imports — this const n'existe pas encore
const MY_RETURN = { ok: false }
vi.mock('../domain/invitation', () => ({
  canInvite: vi.fn().mockReturnValue(MY_RETURN)  // ReferenceError : MY_RETURN is not defined
}))

// ✅ Valeur inline dans la factory — pas de référence externe
vi.mock('../domain/invitation', () => ({
  canInvite: vi.fn().mockReturnValue({ ok: false, reason: 'already_member' })
}))
```

---

## 5. Ancrage TribuZen

Dans TribuZen, la logique métier d'invitation vit dans `src/domain/invitation.ts` — séparée de l'UI, testable sans Vue :

```
tribuzen/
  src/
    domain/
      invitation.ts          ← canInvite — logique pure, 0 dépendance Vue
      invitation.test.ts     ← Exemple 1 de ce module
    composables/
      useInvitationStatus.ts ← consomme canInvite + refs réactives
      useInvitationStatus.test.ts  ← Exemple 2 de ce module
    services/
      familyService.ts       ← fetch /api/families/:id/members
```

Cette architecture **domain / composables / services** est une application directe du principe de séparation des préoccupations :
- `domain/` = logique pure, aucune dépendance framework → testable instantanément
- `composables/` = réactivité Vue + appels services → testable avec Vitest + `nextTick`
- `services/` = fetch HTTP → mocké dans les tests de composables

Les tests de `canInvite` documentent les règles métier aussi clairement qu'une spec — si la règle change (par exemple, permettre une auto-invitation sous condition), les tests échouent et attirent l'attention avant le déploiement.

**Commit cible :**
```
test(domain): canInvite — auto-invitation, déjà membre, priorité règles
test(composables): useInvitationStatus — réactivité ref/computed, nextTick
```

---

## 6. Points clés

1. `vitest.config.ts` avec `plugin-vue`, `globals: true`, `environment: 'jsdom'` — la config minimale pour tester des composables Vue.
2. `describe` groupe les tests d'une unité, `it` décrit un comportement unique, `expect(val).matcher(expected)` exprime l'assertion.
3. `toBe` pour les primitives (égalité stricte `===`), `toEqual` pour les objets et tableaux (comparaison profonde).
4. `toThrow` nécessite que la fonction soit enveloppée dans une arrow : `expect(() => fn()).toThrow()` — pas `expect(fn()).toThrow()`.
5. Après une mutation de `ref`/`reactive`, `await nextTick()` garantit que les `computed` et `watch` ont eu le temps de se recalculer.
6. `vi.fn()` = créer un espion passé en argument ; `vi.mock()` = remplacer un module entier (hoisté) ; `vi.spyOn()` = observer une méthode existante.
7. `vi.mock()` est hoisté avant les `import` — la factory ne peut pas référencer des `const` du fichier de test.
8. Coverage utile = couvrir les branches (`Branch %`) de `domain/` et `composables/` — pas les fichiers de config ni les composants UI.

---

## 7. Seeds Anki

```
Quelle config Vitest minimale permet de tester des composables Vue 3 ?|vitest.config.ts avec plugins: [vue()], test: { globals: true, environment: 'jsdom' }. Le plugin vue permet de traiter les SFC ; jsdom simule le DOM.
Pourquoi faut-il await nextTick() après avoir muté un ref avant de lire un computed ?|Vue batchise les recalculs de réactivité. Sans await nextTick(), le computed peut encore retourner l'ancienne valeur — le test devient flaky (passe ou échoue selon l'ordre des micro-tasks).
Quelle différence entre toBe et toEqual ?|toBe utilise === (identité de référence) — échoue sur deux objets distincts avec le même contenu. toEqual compare structurellement en profondeur — passe si le contenu est identique, même si les références sont différentes.
Quand utiliser vi.fn() vs vi.mock() vs vi.spyOn() ?|vi.fn() crée une fonction espion à passer en argument (injection). vi.mock() remplace un module entier importé (fetch, service). vi.spyOn() observe une méthode existante sur un objet sans la remplacer par défaut.
Pourquoi vi.mock() ne peut pas référencer des const définies dans le fichier de test ?|Vitest hisse vi.mock() avant tous les imports. Les const du fichier ne sont pas encore déclarées à ce moment — utiliser ReferenceError. La factory doit utiliser des valeurs inline.
Quelle est la différence entre tester l'implémentation et tester le comportement ?|Tester l'implémentation = vérifier comment le code est écrit (ordre des if, nom des variables internes). Tester le comportement = vérifier ce que le code produit (entrée → sortie). Un bon test survit à une refactorisation qui ne change pas le comportement.
Comment mesurer la couverture des branches plutôt que des lignes ?|vitest run --coverage avec provider v8 affiche Branch % séparément. Une branche = chaque chemin d'un if/else ou ternaire. 100% Stmts avec 50% Branch signifie qu'une moitié des conditions n'est jamais testée.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-16-tests-unitaires/README.md`. Écrire les tests complets de `canInvite` et de `useInvitationStatus` avec Vitest réel — corrigé complet commenté.

---

## Navigation

| Précédent | Suivant |
|---|---|
| [15 — Pinia](./15-pinia.md) | [17 — Tests composants](./17-tests-composants.md) |
