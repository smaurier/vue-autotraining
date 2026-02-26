# Exercice 05 — Catalogue produits

**Module** : 01-Débutant · **Difficulté** : ⭐⭐
**Cours** : `cours/01-debutant/05` (composants, props, emits)

## Objectif

Décomposer une UI en composants avec communication parent → enfant (props) et enfant → parent (emits).

## Consignes

1. Interface `Product` : `id`, `name`, `price: number`, `category: string`, `inStock: boolean`, `image?: string`
2. Composant `ProductCard.vue` :
   - Props typées : `product: Product`
   - Emit `add-to-cart` avec le produit
   - Afficher nom, prix (€), disponibilité
   - Badge « Rupture » si `!inStock`, bouton « Ajouter » désactivé
3. Composant parent `ProductCatalog.vue` :
   - Liste de 6+ produits (données locales)
   - Filtrer par catégorie (select)
   - Recherche par nom (input)
   - Panier : compteur d'articles + total calculé

## Contraintes TypeScript

- `defineProps<{ product: Product }>()`
- `defineEmits<{ 'add-to-cart': [product: Product] }>()`
- Tout dans `types.ts`

## Bonus

- Tri par prix (croissant / décroissant)

## Fichiers

→ `src/exercises/ex05/ProductCatalog.vue`
→ `src/exercises/ex05/components/ProductCard.vue`
→ `src/exercises/ex05/types.ts`
