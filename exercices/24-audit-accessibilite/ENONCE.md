# Exercice 24 — Audit accessibilité

**Module** : 09-Accessibilité · **Difficulté** : ⭐⭐⭐⭐
**Cours** : `cours/09-accessibilite/01` à `03`

## Objectif

Auditer et corriger l'accessibilité d'une interface : rôles ARIA, navigation clavier, focus management, contrastes, lecteur d'écran.

## Consignes

### Partie 1 — Composant « cassé »

1. `BrokenForm.vue` — formulaire volontairement inaccessible :
   - Inputs sans labels associés
   - Pas de focus visible
   - Pas d'annonces d'erreur (`aria-live`)
   - Boutons sans texte accessible
   - Mauvais contrastes
   - Pas de navigation clavier sur les éléments custom

### Partie 2 — Version corrigée

2. `AccessibleForm.vue` — même formulaire, entièrement accessible :
   - `<label for="...">` sur chaque input
   - `aria-describedby` pour les messages d'erreur
   - `aria-live="polite"` pour les annonces dynamiques
   - Focus trap dans la modale
   - Navigation clavier complète (Tab, Enter, Escape)
   - Skip link
   - Contrastes WCAG AA

### Partie 3 — Composable

3. `useFocusTrap(containerRef)` :
   - Piège le focus dans un container
   - Tab cycle, Shift+Tab cycle inverse
   - Escape pour libérer

4. `useAnnouncer()` :
   - `announce(message, priority: 'polite' | 'assertive')`
   - Utilise `aria-live` region

### Partie 4 — Comparaison

5. `A11yAudit.vue` : affiche côte à côte la version cassée et la version corrigée, avec une checklist interactive WCAG.

## Contraintes TypeScript

- Composables typés
- `AriaRole`, `AriaLive` comme string literals
- Zero `any`

## Fichiers

→ `src/exercises/ex24/A11yAudit.vue`
→ `src/exercises/ex24/components/BrokenForm.vue`
→ `src/exercises/ex24/components/AccessibleForm.vue`
→ `src/exercises/ex24/composables/useFocusTrap.ts`
→ `src/exercises/ex24/composables/useAnnouncer.ts`
→ `src/exercises/ex24/types.ts`
