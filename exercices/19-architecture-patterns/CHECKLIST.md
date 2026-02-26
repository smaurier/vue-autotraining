# Checklist — Architecture & Patterns

- [ ] Interface `IHttpService` avec generics
- [ ] `MockHttpService` implémente l'interface
- [ ] Injection via `InjectionKey` typée
- [ ] `UserService` utilise `IHttpService`
- [ ] Module `users/` auto-contenu (composable, composants, types)
- [ ] Repository pattern fonctionnel
- [ ] `createCrudComposable<T>` factory
- [ ] `useEventBus<Events>` typé
- [ ] Composant racine assemble le tout
- [ ] Zero `any`
