---
titre: Audit d'accessibilité
cours: 02-vue
notions: [outils automatiques axe-core et Lighthouse, limites de l'automatique, tests manuels clavier et lecteur d'écran, jest-axe et vitest-axe en tests, addon a11y Storybook, audit dans le pipeline CI, méthodologie RGAA grille des critères, restitution d'un rapport d'audit]
outcomes:
  - sait combiner audit automatique (axe) et tests manuels (clavier, lecteur d'écran)
  - sait intégrer des tests d'accessibilité automatisés (vitest-axe) en CI
  - sait mener un audit selon la méthodologie RGAA et prioriser
  - sait restituer un rapport d'audit exploitable
prerequis: [39-accessibilite-aria-et-vue]
next: 41-i18n-vue-i18n
libs: [{ name: vue, version: "3.5" }, { name: "axe-core", version: "4" }]
tribuzen: front-office TribuZen — audit a11y automatisé (vitest-axe en CI) + audit manuel des parcours clés (invitation, feed) selon RGAA
last-reviewed: 2026-07
---

# Audit d'accessibilité

> 📐 **La méthode d'audit est désormais dans le cours 25 HTML & CSS**, module 20, qui en est la
> source unique du curriculum. Ce module garde ce qui est propre à cet écosystème : `vitest-axe`,
> l'extension Storybook, et l'intégration dans la chaîne d'intégration continue.


> **Outcomes — tu sauras FAIRE :** mener un audit a11y complet (auto + manuel + lecteur d'écran), intégrer vitest-axe en CI, conduire un audit RGAA 4.1 avec grille de critères et restituer un rapport exploitable.
> **Difficulté :** :star::star::star::star:
>
> **Précédent :** `39-accessibilite-aria-et-vue` — ARIA, rôles, aria-live, focus trap.

---

## 1. Cas concret d'abord

TribuZen passe en revue de code avant sa beta publique. L'équipe lance Lighthouse et obtient un score a11y de 97. Tout le monde est soulagé. Mais lors du premier test utilisateur avec une personne non-voyante, le parcours d'invitation s'avère inexploitable : le formulaire multi-étapes n'annonce pas les transitions d'étape, les erreurs de validation ne sont pas lues, et le bouton d'envoi est inatteignable au clavier depuis le deuxième champ.

**Lighthouse a détecté 3 % des problèmes réels.** Les 97 % restants n'ont pas de signature DOM statique : ils nécessitent une interaction, un lecteur d'écran ou une inspection experte.

C'est le problème central de l'audit a11y : l'automatique est rapide et nécessaire, mais il ne couvre structurellement que **~30-40 % des critères détectables**. Le reste exige une méthodologie.

Ce module te donne cette méthodologie — de l'outillage automatique jusqu'à la restitution d'un rapport RGAA 4.1.

---

## 2. Théorie complète, concise

### 2.1 Outils automatiques — axe-core et Lighthouse

Les deux outils de référence opèrent sur le DOM rendu et appliquent des règles vérifiables mécaniquement (rapport contraste, présence d'attribut `alt`, association label/input, etc.).

**Lighthouse**

Intégré à Chrome DevTools (onglet Lighthouse → cocher Accessibility → Analyze page load). Produit un score 0-100 basé sur un sous-ensemble pondéré des règles axe-core. Pratique pour une première passe rapide, mais le score seul est trompeur (un score de 97 avec des problèmes critiques est possible).

Ce que Lighthouse détecte : contrastes insuffisants, `<img>` sans `alt`, inputs sans label, hiérarchie de titres cassée, boutons sans nom accessible.

Ce que Lighthouse ne détecte pas : logique de focus incorrecte, annonces `aria-live` manquantes ou sur-chattering, pièges au focus, sémantique incorrecte du texte alternatif, navigation clavier non fonctionnelle.

**axe-core 4**

Bibliothèque open-source de Deque Systems. C'est le moteur sous-jacent de Lighthouse, de l'addon Storybook et de la plupart des outils a11y du marché. Elle s'intègre directement dans Vitest, Playwright, et le navigateur.

```bash
pnpm add -D axe-core
```

axe-core applique des règles taguées (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `best-practice`). Chaque violation comprend : `id` de la règle, `impact` (critical / serious / moderate / minor), `description`, `nodes` (éléments HTML concernés avec `failureSummary`).

```ts
// Utilisation directe dans le navigateur (pour debug)
import axe from 'axe-core'

const results = await axe.run(document, {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
})

for (const v of results.violations) {
  console.log(`[${v.impact}] ${v.id} — ${v.description}`)
  for (const node of v.nodes) {
    console.log('  Element:', node.html)
    console.log('  Fix:', node.failureSummary)
  }
}
```

**Outil complémentaire — feedback IDE en temps réel**

`eslint-plugin-vuejs-accessibility` ajoute des règles ESLint spécifiques aux composants Vue (images sans alt, boutons sans nom accessible, rôles ARIA invalides, etc.). Contrairement à axe-core qui analyse le DOM rendu, il remonte les erreurs **à l'écriture**, avant même le build.

```bash
pnpm add -D eslint-plugin-vuejs-accessibility
```

```js
// eslint.config.js (flat config)
import vueA11y from 'eslint-plugin-vuejs-accessibility'

export default [
  ...vueA11y.configs['flat/recommended'],
]
```

Ce plugin complète axe-core : l'un agit dans l'IDE (écriture), l'autre dans le navigateur ou les tests (exécution).

### 2.2 Limites de l'automatique, et 2.3 tests manuels

> 📐 **Traité dans le cours 25 HTML & CSS**, module 20, § 1 pour ce qu'un outil peut décider et ce qu'il ne peut pas, § 3 pour le protocole clavier en huit étapes, § 4 pour le protocole lecteur d'écran.
> ⚠️ **Divergence assumée à connaître :** ce module citait « 30 à 40 % » de détection
> automatique. Le cours 25 ne cite volontairement **aucun pourcentage** : les chiffres qui
> circulent varient selon la méthode de comptage et ne disent rien d'un site donné. Ce qui est
> utile, et ce que le module 20 donne, c'est la liste de ce qui **n'est pas** automatisable.

### 2.4 jest-axe et vitest-axe en tests automatisés

> Ce qui suit reste ici : c'est de l'outillage de test Vue, pas de la méthode d'audit.


`jest-axe` est la bibliothèque d'intégration axe-core pour Jest. Elle fonctionne nativement avec **Vitest** (qui est jest-compatible pour les matchers).

```bash
pnpm add -D jest-axe @types/jest-axe
```

**Intégration Vitest + @vue/test-utils**

```ts
// src/components/__tests__/InvitationForm.a11y.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { axe, toHaveNoViolations } from 'jest-axe'
import InvitationForm from '@/components/InvitationForm.vue'

// Étend les matchers vitest avec toHaveNoViolations
expect.extend(toHaveNoViolations)

describe('InvitationForm — accessibilité', () => {
  it('ne contient pas de violations axe-core (wcag2aa)', async () => {
    const wrapper = mount(InvitationForm, {
      // Props requises pour rendre un état complet
      props: { groupId: 'g-1', groupName: 'Famille Martin' },
    })

    // axe analyse le HTML rendu par Vue — élément DOM natif requis
    const results = await axe(wrapper.element, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })

    // Affiche les violations en détail si le test échoue
    expect(results).toHaveNoViolations()
  })

  it('affiche les erreurs de façon accessible après soumission invalide', async () => {
    const wrapper = mount(InvitationForm, {
      props: { groupId: 'g-1', groupName: 'Famille Martin' },
    })

    // Déclencher la soumission sans remplir les champs
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    const results = await axe(wrapper.element, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })

    expect(results).toHaveNoViolations()
  })
})
```

**Ce que vitest-axe détecte dans ce contexte :** labels manquants, attributs ARIA invalides, rôles incorrects, attributs `id` dupliqués, contrastes insuffisants (heuristique). Ce qu'il ne détecte pas : la pertinence sémantique, le comportement clavier, les live regions qui ne s'activent pas.

**Important :** `jest-axe` analyse le HTML statique au moment de l'appel. Pour les composants avec états dynamiques (erreurs après soumission, modales ouvertes), il faut appeler `axe()` après avoir déclenché l'état concerné — comme montré dans le deuxième test.

### 2.5 Addon a11y Storybook

`@storybook/addon-a11y` intègre axe-core dans Storybook. Il ajoute un onglet "Accessibility" dans le panneau d'inspection qui analyse chaque story en temps réel et liste les violations.

```bash
pnpm add -D @storybook/addon-a11y
```

```ts
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/vue3-vite'

const config: StorybookConfig = {
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',  // Ajouter ici
  ],
  // ...
}

export default config
```

**Configuration par story**

```ts
// src/components/InvitationForm.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import InvitationForm from './InvitationForm.vue'

const meta: Meta<typeof InvitationForm> = {
  component: InvitationForm,
  parameters: {
    a11y: {
      // Configurer les règles axe-core pour cette story
      config: {
        rules: [
          {
            // Désactiver une règle pour une raison documentée
            // (ex: couleur gérée par le design system, ratio vérifié manuellement)
            id: 'color-contrast',
            enabled: false,
          },
        ],
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof InvitationForm>

export const Default: Story = {
  args: { groupId: 'g-1', groupName: 'Famille Martin' },
}

export const WithErrors: Story = {
  args: { groupId: 'g-1', groupName: 'Famille Martin' },
  // Désactiver l'a11y sur une story instable (état transitoire)
  parameters: {
    a11y: { disable: true },
  },
}
```

**Valeur ajoutée de l'addon :** il tourne à chaque changement de story sans lancer de test — feedback immédiat pendant le développement de composants, avant même d'écrire les tests.

### 2.6 Audit dans le pipeline CI

L'objectif CI est de bloquer les régressions automatiquement détectables sans ralentir le pipeline. Deux niveaux complémentaires :

**Niveau 1 — Unit/Component (rapide, ~1-5 s par suite)**

vitest-axe dans les tests de composants (voir §2.4). Lance sur chaque PR. Coût quasi nul.

**Niveau 2 — E2E (plus lent, scènes réelles)**

```ts
// e2e/a11y/tribuzen.a11y.spec.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const PAGES = [
  { name: 'accueil', path: '/' },
  { name: 'connexion', path: '/login' },
  { name: 'invitation', path: '/invite/g-demo' },
  { name: 'feed', path: '/feed' },
]

for (const page of PAGES) {
  test(`[a11y] ${page.name} — aucune violation wcag2aa`, async ({ page: p }) => {
    await p.goto(page.path)

    const results = await new AxeBuilder({ page: p })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    // Log structuré pour le rapport CI
    if (results.violations.length > 0) {
      for (const v of results.violations) {
        console.error(`[${v.impact}] ${v.id}: ${v.description}`)
        for (const n of v.nodes) {
          console.error(`  → ${n.html}`)
        }
      }
    }

    expect(results.violations).toHaveLength(0)
  })
}
```

```bash
# package.json — scripts CI
pnpm add -D @axe-core/playwright
```

**Pipeline recommandé (GitHub Actions)**

```yaml
# .github/workflows/a11y.yml (extrait)
jobs:
  a11y-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm test --reporter=verbose
        # Les tests vitest-axe tournent ici

  a11y-e2e:
    runs-on: ubuntu-latest
    needs: [build]
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm playwright install --with-deps chromium
      - run: pnpm playwright test e2e/a11y/
```

**Stratégie de blocage :** les tests unitaires (vitest-axe) bloquent la PR. Les tests E2E a11y peuvent démarrer en `continue-on-error: false` dès que la baseline est établie — commencer en mode observation uniquement pour ne pas bloquer les premières itérations.

### 2.7 Méthodologie RGAA et 2.8 restitution d'un rapport

> 📐 **Traité dans le cours 25 HTML & CSS**, module 20, § 5 pour l'échantillonnage et § 6 pour les critères qui ne se testent qu'à la main.
> La méthode d'audit qui fait foi reste celle de la formation Access42, et le référentiel officiel pour les protocoles de test critère par critère.

## 3. Worked examples

### Exemple 1 — test vitest-axe du composant InvitationForm (TribuZen)

Contexte : `InvitationForm.vue` est le formulaire d'invitation à un groupe TribuZen. On veut garantir qu'il est sans violation axe-core dans les deux états importants : initial et après soumission invalide.

```ts
// src/components/invite/__tests__/InvitationForm.a11y.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { axe, toHaveNoViolations } from 'jest-axe'
import InvitationForm from '@/components/invite/InvitationForm.vue'

expect.extend(toHaveNoViolations)

// Stub de vue-router pour éviter les erreurs d'injection
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('InvitationForm — audit axe-core', () => {
  it('état initial — aucune violation wcag2aa', async () => {
    const wrapper = mount(InvitationForm, {
      props: { groupId: 'g-1', groupName: 'Famille Martin' },
      global: { stubs: { RouterLink: true } },
    })

    // Attendre le rendu complet (nextTick suffisant pour les composants sans fetch)
    await wrapper.vm.$nextTick()

    const results = await axe(wrapper.element, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })

    // Le rapport d'erreur de toHaveNoViolations est déjà lisible
    expect(results).toHaveNoViolations()
  })

  it('après soumission invalide — les erreurs sont accessibles', async () => {
    const wrapper = mount(InvitationForm, {
      props: { groupId: 'g-1', groupName: 'Famille Martin' },
      global: { stubs: { RouterLink: true } },
    })

    // Soumettre sans remplir — déclenche l'état d'erreur ARIA
    await wrapper.find('[data-testid="invite-form"]').trigger('submit')
    await wrapper.vm.$nextTick()

    const results = await axe(wrapper.element, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })

    // Les erreurs doivent être liées via aria-describedby et role="alert"
    expect(results).toHaveNoViolations()
  })
})
```

**Ce que ce test garantit :** tous les champs ont un label associé, les attributs ARIA sont valides (`aria-invalid`, `aria-describedby`), les rôles sont corrects, les IDs sont uniques, les contrastes dépassent le seuil AA.

**Ce qu'il ne garantit pas :** que `role="alert"` annonce effectivement l'erreur dans NVDA (comportement lecteur d'écran = test manuel), que le focus retourne sur le bon élément après soumission.

---

### Exemple 2 — checklist d'audit manuel du parcours invitation TribuZen

Voici comment conduire les 15 minutes de test manuel clavier + NVDA sur le parcours d'invitation.

**Préparation**

```
Navigateur  : Chrome (NVDA est calibré pour Chrome)
Lecteur     : NVDA (version actuelle, mode navigation activé)
URL testée  : https://tribuzen.app/invite/g-demo
Date        : 2026-07-01
Auditeur    : Sylvain M.
```

**Protocole clavier (sans NVDA)**

```
[ ] 1. Tab depuis le haut → focus sur le skip link ?
[ ] 2. Activer le skip link (Enter) → focus sur le contenu principal ?
[ ] 3. Tab séquentiel → ordre logique (titre > description > champ email > bouton) ?
[ ] 4. Focus visible sur chaque élément (contour net) ?
[ ] 5. Tab dans le champ email, saisir une adresse invalide, Tab vers le bouton, Enter →
        message d'erreur affiché ET focus géré ?
[ ] 6. Corriger l'adresse, soumettre → animation de chargement accessible
        (aria-busy ou aria-live) ?
[ ] 7. Après succès → focus géré vers le message de confirmation ?
[ ] 8. Aucun piège au clavier à aucune étape ?
```

**Protocole NVDA**

```
[ ] 1. Ouvrir NVDA, aller sur l'URL, mode navigation (par défaut)
[ ] 2. NVDA + Flèche bas → lire page entière, écouter l'ordre de lecture
[ ] 3. H → naviguer entre les titres, les niveaux sont-ils cohérents ?
[ ] 4. F → naviguer entre les champs de formulaire
        Chaque champ annonce son label, son type, son état obligatoire ?
[ ] 5. Tab vers le bouton d'envoi → le nom accessible est-il "Envoyer l'invitation" ?
        (pas "bouton" seul, ni "Envoyer" ambigu)
[ ] 6. Soumettre avec email invalide → l'erreur est-elle annoncée automatiquement ?
        (role="alert" ou aria-live="assertive" sur le message)
[ ] 7. Remplir correctement et soumettre → la confirmation est-elle annoncée ?
```

**Grille de résultat (extrait)**

| Critère RGAA | Test | Statut | Remarque |
|---|---|---|---|
| 11.1 | Label sur champ email | C | `<label for="email">` présent |
| 11.9 | Bouton avec intitulé | C | "Envoyer l'invitation" clair |
| 11.10 | Erreur identifiée | NC | `role="alert"` absent sur le bloc erreur |
| 12.11 | Gestion du focus | NC | Focus non géré après soumission |
| 10.3 | Contenu lisible sans CSS | À vérifier | Désactiver les styles |

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Croire que le score automatique prouve la conformité

```
Score Lighthouse : 97 ✓
Tests axe-core : 0 violation ✓
→ "Notre app est accessible." ✗
```

**Pourquoi c'est faux :** l'automatique ne couvre structurellement que ~30-40 % des critères vérifiables. Un score 100 Lighthouse est compatible avec un formulaire inexploitable au clavier, des live regions silencieuses, des modales sans focus trap, et des textes alternatifs non pertinents.

**Le correct :** l'automatique bloque les régressions détectables. Il ne remplace ni le test clavier, ni le test lecteur d'écran, ni l'audit RGAA.

---

### PIÈGE #2 — Auditer sans échantillon représentatif

```
// ❌ Auditer uniquement la page d'accueil
test('accueil accessible', async () => { ... })
// → rapport qui cache les NC sur les formulaires et les parcours
```

**Pourquoi c'est faux :** les violations les plus critiques se trouvent souvent sur les pages fonctionnelles (formulaires, tableaux, modales, flux multi-étapes), pas sur les pages vitrine. Un audit limité à la home sous-estime systématiquement le taux de non-conformité.

**Le correct :** constituer un échantillon représentatif de tous les types de pages et de toutes les fonctionnalités clés. Pour TribuZen : au minimum login, invitation, feed, profil.

---

### PIÈGE #3 — Rendre un rapport non actionnable

```markdown
❌ Exemple de NC inutilisable :
"Le formulaire n'est pas accessible. Il manque des attributs ARIA."

❌ Sans priorisation, sans exemple, sans recommandation concrète :
Le développeur ne sait pas quoi corriger en premier.
```

**Pourquoi c'est faux :** un rapport exhaustif sans priorisation et sans exemples de code défaillants + corrects conduit à un backlog non traité. C'est la cause principale des audits commandés mais non suivis d'effets.

**Le correct :** chaque NC doit inclure le critère RGAA, les pages et éléments concernés (avec code), l'impact utilisateur, la correction recommandée avec exemple de code, et l'effort estimé. La priorisation (P0 bloquant → P3 mineur) guide le sprint de corrections.

---

### PIÈGE #4 — Tester dans un seul navigateur + lecteur d'écran

```
❌ Testeur : "J'ai testé avec VoiceOver + Safari, tout fonctionne."
→ NVDA + Chrome révèle 5 nouvelles NC.
```

**Pourquoi c'est faux :** le comportement des lecteurs d'écran varie significativement selon le navigateur. Les combinaisons les plus utilisées en France sont NVDA + Chrome (marché dominant) et VoiceOver + Safari (iOS/macOS). Un audit professionnel couvre au minimum ces deux combinaisons.

**Le correct :** prioriser NVDA + Chrome pour le test de référence. Compléter avec VoiceOver + Safari pour les parcours critiques. Documenter la combinaison testée dans le rapport.

---

### PIÈGE #5 — Utiliser `placeholder` comme substitut de `<label>`

```vue
<!-- ❌ RGAA 11.1 non conforme : pas de label -->
<input type="email" placeholder="Votre adresse e-mail" />

<!-- ✅ Conforme — label associé par for/id -->
<label for="invite-email">Adresse e-mail</label>
<input id="invite-email" type="email" placeholder="alice@example.com" />
```

**Pourquoi c'est faux :** le `placeholder` disparaît à la saisie, n'est pas restitué par tous les lecteurs d'écran, et n'est pas considéré comme un label valide par RGAA 4.1 critère 11.1. C'est la non-conformité la plus fréquente dans les SPAs.

---

## 5. Ancrage TribuZen

Dans TribuZen, l'audit a11y s'applique à trois niveaux :

**Niveau 1 — vitest-axe en CI (continu)**

Chaque composant critique a un spec `*.a11y.spec.ts` :

```
tribuzen/src/components/
  invite/
    InvitationForm.vue
    InvitationForm.a11y.spec.ts   ← vitest-axe état initial + erreurs
  feed/
    FeedPost.vue
    FeedPost.a11y.spec.ts         ← axe sur le contenu dynamique
  auth/
    LoginForm.vue
    LoginForm.a11y.spec.ts        ← axe sur formulaire + état d'erreur
```

Ces tests tournent à chaque PR. Ils bloquent si une modification introduit une violation détectable automatiquement.

**Niveau 2 — Audit manuel des parcours clés (pré-release)**

Les deux parcours critiques de TribuZen avant chaque release :

1. **Parcours invitation** — `/invite/:groupId` : le cas qui a révélé les problèmes en début de module. Protocole complet clavier + NVDA.

2. **Parcours feed** — `/feed` : contenu dynamique avec `aria-live`, chargement infini, réactions aux posts. Vérification des annonces dynamiques.

**Niveau 3 — Déclaration d'accessibilité RGAA (obligatoire à terme)**

Quand TribuZen sera disponible au public, une déclaration d'accessibilité conforme au modèle DINUM sera requise. Elle inclut le taux de conformité, l'échantillon audité, et les engagements de correction.

Fichier cible dans le repo TribuZen :

```
tribuzen/
  public/
    accessibility.html          ← Déclaration d'accessibilité
  e2e/
    a11y/
      tribuzen.a11y.spec.ts     ← Tests Playwright axe-core
  src/
    components/
      invite/
        InvitationForm.a11y.spec.ts
      feed/
        FeedPost.a11y.spec.ts
```

---

## 6. Points clés

1. Les outils automatiques (axe-core, Lighthouse) détectent ~30-40 % des problèmes — ils bloquent les régressions mais ne remplacent pas l'audit.
2. `jest-axe` fonctionne avec Vitest (jest-compatible) — `expect.extend(toHaveNoViolations)` + `axe(wrapper.element)`.
3. Appeler `axe()` après avoir déclenché chaque état important du composant (erreurs, modale ouverte, après soumission).
4. `@storybook/addon-a11y` intègre axe-core dans le panneau Storybook — feedback immédiat pendant le développement sans lancer de test.
5. RGAA 4.1 = 13 thèmes, 106 critères. Taux de conformité = critères C / (C + NC) par page, puis moyenne.
6. L'échantillon d'audit doit couvrir tous les types de pages et tous les parcours fonctionnels clés.
7. Chaque NC dans le rapport doit inclure le critère RGAA, les éléments défaillants, l'impact, la correction recommandée avec code, et la priorité (P0-P3).
8. NVDA + Chrome est la combinaison de référence en France ; VoiceOver + Safari couvre iOS/macOS.
9. `placeholder` n'est pas un label valide selon RGAA 4.1 critère 11.1 — c'est la NC la plus répandue dans les SPAs.

---

## 7. Seeds Anki

```
Quel pourcentage de critères a11y est détectable automatiquement (axe-core/Lighthouse) ?|~30-40 %. Les 60-70 % restants requièrent interaction, jugement sémantique, navigation clavier ou test lecteur d'écran.
Comment intégrer jest-axe dans un test Vitest + @vue/test-utils ?|`expect.extend(toHaveNoViolations)` puis `const results = await axe(wrapper.element, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } })` puis `expect(results).toHaveNoViolations()`.
Quel est le seuil de conformité RGAA couramment retenu pour les organismes publics ?|75 % — interprétation pratique de « conformité substantielle » ; ce seuil numérique n'est pas fixé par la loi (le décret 2019-768 ne l'énonce pas). Obligation secteur public = directive 2016/2102 via LCEN art. 47 + décret 2019-768 ; l'EAA (2019/882 UE, ordonnance 2023-859) étend au secteur privé.
Comment se calcule le taux de conformité RGAA par page ?|Taux = critères Conformes / (critères Conformes + Non conformes) × 100. Les critères Non Applicables sont exclus.
Combien de thèmes et de critères comporte RGAA 4.1 ?|13 thèmes, 106 critères.
Pourquoi appeler axe() après avoir déclenché un état de composant (ex: erreurs) ?|jest-axe analyse le HTML statique au moment de l'appel. Un état non déclenché (erreurs cachées, modale fermée) n'est pas analysé.
Quelle combinaison navigateur + lecteur d'écran est la référence de test en France ?|NVDA + Chrome (marché dominant). Compléter avec VoiceOver + Safari pour iOS/macOS.
Pourquoi un placeholder n'est-il pas un label valide selon RGAA 4.1 ?|RGAA critère 11.1 exige un label persistant. Le placeholder disparaît à la saisie et n'est pas systématiquement restitué par les lecteurs d'écran.
```

---

## Pont vers le lab

> Lab associé : `02-vue/labs/lab-40-accessibilite-audit/README.md`. Audit réel d'un parcours TribuZen — vitest-axe, test clavier documenté, grille RGAA partielle, rapport NC actionnable.
