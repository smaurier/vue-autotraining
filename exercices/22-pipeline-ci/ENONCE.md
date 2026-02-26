# Exercice 22 — Pipeline CI visuel

**Module** : 07-CI/CD · **Difficulté** : ⭐⭐⭐⭐
**Cours** : `cours/07-cicd/01` à `03`

## Objectif

Visualiser et configurer un pipeline CI/CD sous forme de composant interactif, appliquant les concepts de CI/CD dans un contexte Vue 3.

## Consignes

### Partie 1 — Modélisation du pipeline

1. Types pour modéliser un pipeline CI :
   - `PipelineStage` : `name`, `status: 'pending' | 'running' | 'success' | 'failed' | 'skipped'`
   - `PipelineJob` : `name`, `stage`, `script: string[]`, `duration?: number`
   - `Pipeline` : `stages: PipelineStage[]`, `jobs: PipelineJob[]`, `trigger: string`

### Partie 2 — Visualisation

2. `PipelineView.vue` :
   - Affichage graphique du pipeline (étapes en colonnes, jobs en lignes)
   - Couleurs par statut (vert/rouge/orange/gris)
   - Animation sur les jobs en cours (pulse)
   - Clic sur un job → détail (script, durée, logs simulés)

### Partie 3 — Configurateur

3. `PipelineConfigurator.vue` :
   - Formulaire pour créer un nouveau pipeline
   - Ajouter/supprimer des stages
   - Ajouter/supprimer des jobs par stage
   - Générer la config YAML (affichée en `<pre>`)

### Partie 4 — Simulation

4. Bouton « Lancer le pipeline » :
   - Les jobs s'exécutent séquentiellement par stage (avec délai simulé)
   - Échec aléatoire possible
   - Le pipeline s'arrête au premier échec (sauf si « allow_failure »)

## Contraintes TypeScript

- Tous les types dans `types.ts`
- State machine pour les statuts
- Zero `any`

## Fichiers

→ `src/exercises/ex22/PipelineCI.vue`
→ `src/exercises/ex22/components/PipelineView.vue`
→ `src/exercises/ex22/components/PipelineConfigurator.vue`
→ `src/exercises/ex22/components/JobDetail.vue`
→ `src/exercises/ex22/composables/usePipelineRunner.ts`
→ `src/exercises/ex22/types.ts`
