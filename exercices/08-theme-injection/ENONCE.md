# Exercice 08 — Thème & Injection

**Module** : 02-Intermédiaire · **Difficulté** : ⭐⭐⭐
**Cours** : `cours/02-intermediaire/01` (provide/inject, Composition API avancée)

## Objectif

Pratiquer `provide` / `inject` avec des `InjectionKey` typées pour un système de thème global.

## Consignes

1. Créer `ThemeProvider.vue` qui fournit un thème (`provide`) :
   - `theme: Ref<'light' | 'dark'>`
   - `toggleTheme(): void`
   - `colors: ComputedRef<ThemeColors>` (bg, text, primary, secondary)
2. Créer `InjectionKey` typée dans `types.ts`
3. Créer `ThemedCard.vue` qui injecte le thème et change ses styles
4. Créer `ThemeToggle.vue` qui injecte `toggleTheme` et l'appelle au clic
5. Créer `ThemedHeader.vue` qui affiche le mode courant + utilise les couleurs
6. Le composant racine `ThemeInjection.vue` assemble le tout

## Contraintes TypeScript

- `InjectionKey<ThemeContext>` typée strictement
- Gestion du cas où inject retourne `undefined` (composant non enveloppé)
- Zero `any`

## Bonus

- Persister le choix dans `localStorage`
- 3e thème « auto » basé sur `prefers-color-scheme`

## Fichiers

→ `src/exercises/ex08/ThemeInjection.vue`
→ `src/exercises/ex08/components/ThemeProvider.vue`
→ `src/exercises/ex08/components/ThemedCard.vue`
→ `src/exercises/ex08/components/ThemeToggle.vue`
→ `src/exercises/ex08/components/ThemedHeader.vue`
→ `src/exercises/ex08/types.ts`
