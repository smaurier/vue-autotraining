# Lab 02 — Intervention : ajouter une capacité à un composant consommé

> **Outcome :** à la fin, `Bouton.vue` (déjà consommé par plusieurs écrans TribuZen) a un
> état de chargement complet — désactivé, `aria-busy`, indicateur visuel, ET plus aucun clic
> ne part pendant le chargement — sans rien casser de ce qui marche déjà.
> **Vrai geste :** ajouter une capacité à un composant EXISTANT et déjà utilisé ailleurs,
> preuve de non-régression à l'appui — pas un nouveau composant à côté.
> **Feedback :** `npm run lab:02` — RED tant que `src/Bouton.vue` ne satisfait pas l'oracle
> (10 tests, dont 6 passent déjà sur le code existant — la non-régression, par construction).
> `npm run solution:02` prouve l'oracle.

## Prérequis technique

```bash
cd 02-vue/labs
npm install
```

## Lire avant (une lecture bornée)

- Module [`05-composants-props-emits.md`](../../modules/05-composants-props-emits.md) —
  contrat de props, `defineEmits`, `withDefaults`.

## Énoncé

`Bouton.vue` EST L'EXISTANT, EN PRODUCTION. Ticket : « le bouton "Envoyer l'invitation" peut
être cliqué plusieurs fois pendant que la requête est en cours — invitations envoyées en
double. » Le prop `loading` existe déjà dans le contrat (pour ne pas casser les appelants qui
commencent à le passer) mais n'est PAS ENCORE respecté.

Lis les commentaires en tête de `src/Bouton.vue`. Implémente le comportement `loading` :
bouton `disabled`, `aria-busy="true"`, un `<span class="spinner" aria-hidden="true">` avant
le contenu du slot, et surtout — plus aucun `click` ne doit partir tant que `loading` est vrai.

**Le piège à éviter.** Ne casse pas ce qui marche déjà : la classe de variante
(`btn-primaire`/`btn-secondaire`) et l'émission normale de `click` sont déjà correctes et
testées — 4 des 10 tests de l'oracle passent SANS rien changer, exactement parce qu'ils
vérifient la non-régression, pas la nouvelle capacité.

## Étapes (en friction)

1. `npm run lab:02` : RED (4/10 — les tests de non-régression passent déjà, c'est normal).
2. `:disabled="loading"` et `:aria-busy="loading"` sur le `<button>`.
3. Un `<span class="spinner" aria-hidden="true">` affiché `v-if="loading"`, AVANT `<slot />`
   (le slot reste affiché, le spinner s'ajoute).
4. Dans le handler de clic : un garde `if (loading) return;` avant `emit('click')` — défense
   en profondeur, même si le `disabled` natif bloque déjà l'essentiel.

## Vérifier

```bash
cd 02-vue/labs
npm run lab:02
npm run solution:02
```

**Ce que l'oracle vérifie (10 tests)**

Non-régression (déjà correcte, 4 tests) : rendu du slot, classe de variante par défaut et
explicite, émission de `click` en usage normal. Nouvelle capacité (6 tests) : `disabled` posé,
`aria-busy="true"`, spinner présent en chargement, ABSENT hors chargement, `click` jamais émis
pendant le chargement, le slot reste affiché malgré le spinner.

## Variante J+30 (fading)

Ajoute un `timeout` optionnel (`loadingTimeoutMs`) qui repasse automatiquement `loading` à un
état "bloqué" visuel différent (pas juste désactivé) si le chargement dépasse ce délai — un
signal que quelque chose ne va pas, sans jamais réactiver le bouton tout seul (le parent
reste maître de `loading`).

## Application TribuZen

Même geste sur le vrai `Bouton.vue` de l'admin TribuZen, déjà consommé par l'écran
d'invitation ET l'écran de paiement — les deux non-régressés, la nouvelle capacité ajoutée
une seule fois. Commit :
`fix(bouton): état de chargement — plus d'invitation envoyée en double sur double-clic`.
