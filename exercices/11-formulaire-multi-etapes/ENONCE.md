# Exercice 11 — Formulaire multi-étapes

**Module** : 02-Intermédiaire · **Difficulté** : ⭐⭐⭐
**Cours** : `cours/02-intermediaire/04` (formulaires avancés)

## Objectif

Construire un wizard multi-étapes avec validation par étape, navigation conditionnelle et récapitulatif.

## Consignes

### Structure

1. 4 étapes :
   - **Identité** : prénom, nom, date de naissance
   - **Coordonnées** : email, téléphone, adresse
   - **Préférences** : newsletter (checkbox), fréquence (select), centres d'intérêt (checkboxes multiples)
   - **Récapitulatif** : résumé de tout + bouton « Confirmer »

2. Barre de progression visuelle (step 1/4, 2/4…)
3. Boutons Précédent / Suivant
4. Suivant désactivé tant que l'étape courante n'est pas valide
5. Validation en temps réel (messages sous chaque champ)
6. Au submit final : afficher un message de confirmation

### Composants

- `MultiStepForm.vue` (orchestrateur)
- `StepIdentity.vue`, `StepContact.vue`, `StepPreferences.vue`, `StepSummary.vue`
- Chaque step reçoit ses données en props et émet les changements

## Contraintes TypeScript

- Interface `WizardData` regroupant toutes les données
- Chaque step a son interface de validation
- `defineModel()` ou `v-model` avec événements

## Bonus

- **Transition** entre les étapes (slide left/right)

## Fichiers

→ `src/exercises/ex11/MultiStepForm.vue`
→ `src/exercises/ex11/components/StepIdentity.vue`
→ `src/exercises/ex11/components/StepContact.vue`
→ `src/exercises/ex11/components/StepPreferences.vue`
→ `src/exercises/ex11/components/StepSummary.vue`
→ `src/exercises/ex11/types.ts`
