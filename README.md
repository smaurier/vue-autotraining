# Vue 3 par exemple (TypeScript + pnpm)

![VitePress](https://img.shields.io/badge/-VitePress-646CFF?style=flat-square&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
[![fullstack-autotraining](https://img.shields.io/badge/curriculum-fullstack--autotraining-4C1?style=flat-square)](https://github.com/smaurier/fullstack-autotraining)

Projet d apprentissage progressif Vue 3 de débutant a expert, cible ESN.
Le format:

- cours en Markdown
- exercices pratiques dans le code
- correction par review (tu me partages tes fichiers, je corrige)

<!-- labs-gestes:start -->
## Labs — refonte du 22/09/2026 : un lab = un geste métier complet

> Règle qualité 5 du parcours : chaque lab est **un geste métier complet**, sous deux formes — **Zéro** (construire de zéro un artefact réel et entier) ou **Intervention** (modifier de l'existant avec consommateurs, findings avant code, non-régression). Un lab n'entre en file qu'avec un **oracle exécutable** (`src/` starter · `test/` · `solution/` séparée). Les labs historiques de ce cours (un concept par lab, sans oracle) restent dans `labs/` jusqu'à remplacement et **ne sont plus la file**. Cible détaillée : [`docs/gestes-complets.md`](../docs/gestes-complets.md). État : **1/2 avec oracle**.

| # | Lab | Forme | Geste | Oracle |
|---|-----|-------|-------|--------|
| 01 | [`lab-01-feature-de-zero`](labs/lab-01-feature-de-zero/README.md) | Zéro | une feature de bout en bout, Composition API + Pinia | ✅ vérifié |
| 02 | `lab-02-ajouter-une-capacite` | Intervention | composant consommé | · à écrire |

<!-- labs-gestes:end -->

## Stack imposee

- Package manager: `pnpm`
- Langage: `TypeScript` partout
- Vue APIs: Composition API + Options API (comparaison complète)

## Démarrage rapide

```bash
pnpm install
pnpm docs:dev    # → http://localhost:5171 — Voir les cours (VitePress)
```

Pour les exercices :

```bash
pnpm dev         # → Développer les exercices (Vite)
```

## Vérification qualite

```bash
pnpm typecheck
pnpm build
```

## Structure

- `cours/`: le parcours pedagogique
- `exercices/`: enonces et checklists
- `src/exercises/`: composants a modifier

## Méthode de travail

1. Lis la leçon correspondante dans `cours/`.
2. Ouvre l enonce dans `exercices/`.
3. Code en TypeScript dans `src/exercises/...`.
4. Lance l app et valide le comportement.
5. Envoie moi les fichiers modifies, je te fais une correction orientee niveau confirme/expert.

## Roadmap cible ESN

- Débutant solide: fondamentaux Vue 3 + TS + conventions d équipe
- Intermédiaire: composables, patterns async, formulaires, architecture de features
- Avance: routing, state management, tests unitaires/intégration
- Expert: performance, SSR/hydration, patterns d architecture front en contexte multi-projets

Le detail est dans `cours/parcours.md`.

## Format conseille pour demander une correction

```md
Module: debutant / exercice 01
Objectif: ce que j ai voulu faire
Blocages: points fragiles
Fichiers modifies:

- src/exercises/ex01/CounterReactive.vue
```

Je te repondrai avec:

- bugs et regressions
- qualite du code
- version corrigee proposee
- prochaine étape adaptée a ton niveau
