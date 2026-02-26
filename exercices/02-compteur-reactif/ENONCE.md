# Exercice 02 — Compteur réactif

**Module** : 01-Débutant · **Difficulté** : ⭐
**Cours** : `cours/01-debutant/01` (environnement), `cours/01-debutant/03` (réactivité)

## Objectif

Premier composant Vue 3 : découvrir `ref()`, `computed()`, les événements et le template.

## Consignes

1. Afficher un compteur au centre de l'écran
2. Bouton **+** : incrémente de 1
3. Bouton **-** : décrémente de 1 (minimum 0, le compteur ne peut jamais être négatif)
4. Bouton **Reset** : remet à 0
5. `computed` qui affiche « Pair » ou « Impair »
6. Le pas d'incrémentation est configurable (1, 5 ou 10) via des boutons radio

## Contraintes TypeScript

- `count: Ref<number>`
- Toutes les fonctions typées `(): void`

## Bonus

- Historique des 5 dernières valeurs dans un tableau

## Fichiers

→ `src/exercises/ex02/CounterReactive.vue`
