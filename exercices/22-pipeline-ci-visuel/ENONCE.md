# Exercice 22b — Pipeline CI visuel

**Module** : 07-CI/CD · **Difficulté** : ⭐⭐⭐
**Cours** : `cours/07-cicd/01` (Pipeline CI), `cours/07-cicd/02` (Déploiement)
**Renforce** : exercice 22 (pipeline-ci) — angle visualisation et monitoring

## Objectif

Construire un **dashboard visuel de pipeline CI/CD** qui affiche l'état des jobs, leurs logs et les métriques. L'ex22 se concentre sur la configuration de pipeline ; ici on visualise et monitore les résultats.

## Consignes

1. Composant `PipelineGraph` : affiche les stages du pipeline sous forme de graphe horizontal (lint → test → build → deploy)
2. Chaque stage à un statut : `pending | running | success | failed | skipped`
3. Composant `JobCard` : affiche un job avec son nom, durée, statut, et icône
4. Composant `LogViewer` : affiche les logs d'un job sélectionné (scroll auto, coloration syntaxique basique)
5. Composant `PipelineMetrics` : temps total, taux de succès, job le plus lent
6. Données simulées : au moins 3 exécutions de pipeline avec des résultats variés
7. Animation de progression : quand un pipeline est « running », les stages défilent

## Contraintes TypeScript

- Interfaces `Pipeline`, `Stage`, `Job`, `LogEntry` complètes
- Union types pour les statuts
- Zéro `any`

## Bonus

- Filtre par branche / statut
- Relancer un job (simule un changement de statut)
- Timeline d'exécution (diagramme de Gantt simplifié)

## Fichiers

→ `src/exercises/ex22b/PipelineDashboard.vue`
→ `src/exercises/ex22b/components/PipelineGraph.vue`
→ `src/exercises/ex22b/components/JobCard.vue`
→ `src/exercises/ex22b/components/LogViewer.vue`
→ `src/exercises/ex22b/components/PipelineMetrics.vue`
→ `src/exercises/ex22b/types.ts`
