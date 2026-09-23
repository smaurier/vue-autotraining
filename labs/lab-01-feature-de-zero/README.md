# Lab 01 — De zéro : une feature de bout en bout (Composition API + Pinia)

> **Outcome :** à la fin, TribuZen sait proposer une nouvelle sortie — formulaire, validation,
> appel réseau, état de chargement, gestion d'erreur — avec la logique métier dans un store
> Pinia (Composition API), pas éparpillée dans le composant.
> **Vrai geste :** `defineStore` en style Composition (`setup()`), validation métier séparée
> et testable isolément, injection de l'API (testable sans vrai `fetch`).
> **Feedback :** `npm run lab:01` — RED tant que `src/sorties.store.ts` ne satisfait pas
> l'oracle (12 tests). `npm run solution:01` prouve l'oracle.

## Prérequis technique

```bash
cd 02-vue/labs
npm install
```

## Lire avant (une lecture bornée)

- Module [`09-composables.md`](../../modules/09-composables.md) — extraire une logique
  réactive réutilisable.
- Module [`15-pinia.md`](../../modules/15-pinia.md) — `defineStore`, style Composition vs
  Options, actions async.
- Module [`10-gestion-async.md`](../../modules/10-gestion-async.md) — état de chargement,
  gestion d'erreur, pièges de comparaison de dates.

## Énoncé

`AjouterSortieForm.vue` est DONNÉ et déjà correct — un composant "bête" qui délègue toute la
logique au store `sorties.store.ts`. Lis les commentaires en tête de ce fichier et
implémente :

1. `validerNouvelleSortie` — titre requis, date requise et pas dans le passé (comparaison à
   la journée près, pas à l'heure).
2. `useSortiesStore` — état (`sorties`, `isLoading`, `error`) et l'action `ajouterSortie` :
   valide d'abord (jamais d'appel réseau sur une entrée invalide), gère le chargement,
   insère la nouvelle sortie en tête de liste au succès, message d'erreur générique à
   l'échec, `isLoading` toujours remis à `false` en sortie — succès ou échec.

**Le piège à éviter.** Un `isLoading` qui reste bloqué à `true` sur le chemin d'erreur (pas
de `finally`) rend l'UI figée en "Création..." pour toujours — un bug classique invisible
tant qu'on ne teste que le chemin heureux.

## Étapes (en friction)

1. `npm run lab:01` : RED.
2. `validerNouvelleSortie` : trois règles, testées isolément (pas besoin de monter le
   composant pour ça).
3. `useSortiesStore` : `ref` pour l'état, l'action `ajouterSortie` avec un `try/finally`.

## Vérifier

```bash
cd 02-vue/labs
npm run lab:01
npm run solution:01
```

**Ce que l'oracle vérifie (12 tests)**

`validerNouvelleSortie` : titre vide, date vide, date passée, entrée valide, date du jour
acceptée (piège de comparaison horaire). Le store : entrée invalide → pas d'appel API ;
`isLoading` vrai PENDANT l'appel (pas seulement avant/après) ; succès → sortie en tête de
liste ; échec → message d'erreur générique, liste inchangée, `isLoading` revenu à `false`.
Le composant monté avec un vrai store Pinia : validation affichée sans appel API, succès qui
vide le formulaire et émet `created`, échec qui affiche l'erreur SANS vider le formulaire
(pour permettre de corriger et renvoyer).

## Variante J+30 (fading)

Ajoute une deuxième action `supprimerSortie(id)` au store, qui retire l'entrée de la liste —
et vérifie qu'elle ne casse jamais l'ordre des sorties restantes.

## Application TribuZen

Même geste sur le vrai `SortiesStore` de l'admin TribuZen (Vue), consommé par l'écran de
création de sortie. Commit :
`feat(sorties): proposer une sortie de bout en bout (store Pinia + formulaire)`.
