# Checklist — Authentification et permissions

- [ ] Page Login avec validation Zod
- [ ] `useAuth()` : login, logout, refreshToken
- [ ] Token en mémoire (pas localStorage)
- [ ] Backend simulé avec latence
- [ ] Auto-refresh du token
- [ ] 3 rôles définis (admin, editor, viewer)
- [ ] Permissions granulaires (users:_, products:_, settings:\*)
- [ ] `usePermissions()` avec hasPermission, hasAnyPermission
- [ ] `<CanAccess>` composant fonctionnel
- [ ] authGuard redirige vers /login
- [ ] roleGuard redirige vers /forbidden
- [ ] RouteMeta augmenté avec types
- [ ] Types `Role`, `Permission` en union types
- [ ] Zéro `any`
- [ ] Bonus : redirect post-login
- [ ] Bonus : rate limiting
- [ ] Bonus : directive `v-can`
