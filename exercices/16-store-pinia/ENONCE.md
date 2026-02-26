# Exercice 16 — Store Pinia

**Module** : 03-Avancé · **Difficulté** : ⭐⭐⭐⭐
**Cours** : `cours/03-avance/02` (state management, Pinia)

## Objectif

Implémenter une gestion d'état complète avec Pinia : store setup, getters, actions, persistance, et inter-store communication.

## Consignes

### Stores

1. `useAuthStore` (setup syntax) :
   - State : `user: User | null`, `token: string | null`
   - Getters : `isAuthenticated`, `userDisplayName`
   - Actions : `login(credentials)`, `logout()`, `checkAuth()`

2. `useCartStore` (setup syntax) :
   - State : `items: CartItem[]`
   - Getters : `totalItems`, `totalPrice`, `isEmpty`
   - Actions : `addItem(product)`, `removeItem(id)`, `updateQuantity(id, qty)`, `clearCart()`

3. `useNotificationStore` :
   - State : `notifications: Notification[]`
   - Actions : `notify(message, type)`, `dismiss(id)`, auto-dismiss après 5s

### Application

4. `PiniaApp.vue` :
   - Login form → `useAuthStore`
   - Liste de produits + panier → `useCartStore`
   - Toasts de notification → `useNotificationStore`
   - Inter-store : `addItem` déclenche une notification, `logout` vide le panier

## Contraintes TypeScript

- Interfaces `User`, `CartItem`, `Notification` dans `types.ts`
- Stores typés avec `defineStore` setup syntax
- Actions async typées

## Bonus

- Persistance du panier dans `localStorage` (plugin Pinia ou `watch`)
- `storeToRefs` utilisé côté composant

## Fichiers

→ `src/exercises/ex16/PiniaApp.vue`
→ `src/exercises/ex16/stores/useAuthStore.ts`
→ `src/exercises/ex16/stores/useCartStore.ts`
→ `src/exercises/ex16/stores/useNotificationStore.ts`
→ `src/exercises/ex16/types.ts`
