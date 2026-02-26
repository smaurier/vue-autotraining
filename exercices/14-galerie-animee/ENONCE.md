# Exercice 14 — Galerie animée

**Module** : 02-Intermédiaire · **Difficulté** : ⭐⭐⭐
**Cours** : `cours/02-intermediaire/06` (transitions et animations)

## Objectif

Maîtriser `<Transition>`, `<TransitionGroup>`, les hooks JavaScript d'animation et les animations CSS dans Vue 3.

## Consignes

### Partie 1 — Transition simple

1. Modale avec `<Transition name="fade">` : apparition/disparition en fondu
2. Panel latéral avec `<Transition name="slide">` : glissement depuis la droite

### Partie 2 — TransitionGroup

3. Galerie d'images (grille de cartes) :
   - Ajout d'une carte → animation d'entrée (scale + fade)
   - Suppression → animation de sortie
   - Filtre par catégorie → `<TransitionGroup>` avec `move` class pour réorganisation fluide

### Partie 3 — Hooks JS

4. Animation de compteur numérique qui s'incrémente progressivement (tween) :
   - Utiliser `onEnter`, `onLeave` avec `done` callback
   - Interpoler la valeur de 0 à N avec `requestAnimationFrame`

### Partie 4 — Composition

5. Composable `useTransitionState()` :
   - Gère `isVisible: Ref<boolean>`
   - `show()`, `hide()`, `toggle()`
   - Exposé les hooks pour tracking (`isAnimating`)

## Contraintes TypeScript

- Hooks d'animation typés : `(el: Element, done: () => void) => void`
- Composable typé

## Fichiers

→ `src/exercises/ex14/AnimatedGallery.vue`
→ `src/exercises/ex14/components/FadeModal.vue`
→ `src/exercises/ex14/components/SlidePanel.vue`
→ `src/exercises/ex14/components/ImageGrid.vue`
→ `src/exercises/ex14/components/TweenCounter.vue`
→ `src/exercises/ex14/composables/useTransitionState.ts`
→ `src/exercises/ex14/types.ts`
