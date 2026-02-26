# Checklist — Thème & Injection

- [ ] `InjectionKey<ThemeContext>` dans `types.ts`
- [ ] `ThemeProvider.vue` avec `provide`
- [ ] `ThemedCard.vue` injecte le thème
- [ ] `ThemeToggle.vue` injecte et appelle `toggleTheme`
- [ ] `ThemedHeader.vue` affiche le mode + couleurs
- [ ] Gestion du cas `undefined` (inject sans provider)
- [ ] Composant racine assemble le tout
- [ ] Zero `any`
- [ ] Bonus : localStorage
- [ ] Bonus : thème « auto »
