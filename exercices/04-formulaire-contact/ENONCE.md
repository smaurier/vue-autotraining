# Exercice 04 — Formulaire de contact

**Module** : 01-Débutant · **Difficulté** : ⭐⭐
**Cours** : `cours/01-debutant/04` (événements, v-model)

## Objectif

Pratiquer `v-model` sur tous types d'inputs, la validation basique et le binding réactif.

## Consignes

1. Champs : nom, email, sujet (select parmi 3 options), message (textarea)
2. `v-model` sur chaque champ
3. Validation :
   - Nom requis (min 2 car.)
   - Email requis (format basique)
   - Sujet requis
   - Message requis (min 10 car.)
4. Erreurs affichées sous chaque champ en rouge
5. Bouton submit désactivé tant que invalide
6. Aperçu en temps réel du message formaté en dessous
7. Au submit : alerte de confirmation + reset du formulaire

## Contraintes TypeScript

- `interface ContactForm` et `interface FormErrors`
- `computed isValid: ComputedRef<boolean>`

## Bonus

- Compteur de caractères sur le textarea

## Fichiers

→ `src/exercises/ex04/ContactForm.vue`
