# Correction – Exercice 05 : Catalogue produits

## Résultat attendu

Tu dois voir :
- Une **barre de recherche** qui filtre les produits par nom en temps réel
- Un **menu déroulant** pour filtrer par catégorie
- Une **grille de cartes produits** affichant le résultat du filtre
- Chaque carte affiche : emoji, nom, prix, badge « Rupture » si indisponible
- Le bouton **« Ajouter au panier »** est grisé/désactivé si le produit est en rupture
- Un **résumé du panier** en bas : liste des articles + total calculé
- Le bouton **« Retirer »** enlève un article du panier

---

## Structure des fichiers

```
05-catalogue-produits/
├── ProductCatalog.vue          ← composant parent (catalogue + panier)
├── components/
│   └── ProductCard.vue         ← composant enfant (une carte produit)
└── types.ts                    ← types TypeScript (déjà fourni)
```

---

## types.ts (rappel, déjà fourni)

```ts
// L'interface Product décrit la structure d'un produit.
// Le ? sur image signifie que ce champ est OPTIONNEL (peut être absent).
export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
  image?: string; // Optionnel : emoji ou URL d'image
}
```

---

## Code corrigé complet — components/ProductCard.vue

```vue
<!-- ProductCard.vue -->
<!-- Composant ENFANT qui affiche une seule carte produit -->
<!-- Il reçoit les données via "props" (données venant du parent) -->
<!-- Il communique avec le parent via "emits" (événements remontants) -->

<script setup lang="ts">
// On importe le type Product depuis le fichier types.ts du dossier parent
import type { Product } from "../types";

// ─────────────────────────────────────────────
// PROPS : données reçues du composant parent
// ─────────────────────────────────────────────
// defineProps<>() définit les données que le parent DOIT nous passer.
// <{ product: Product }> : le parent doit nous passer une prop nommée "product"
//   de type Product. Si le parent ne la passe pas, TypeScript affiche une erreur.
// Les props sont en LECTURE SEULE : un composant enfant NE DOIT PAS modifier ses props.
const props = defineProps<{
  product: Product;
}>();

// ─────────────────────────────────────────────
// EMITS : événements envoyés vers le composant parent
// ─────────────────────────────────────────────
// defineEmits<>() déclare les événements que ce composant peut émettre.
// 'add-to-cart': [product: Product] signifie :
//   - Nom de l'événement : 'add-to-cart' (avec tirets, convention Vue)
//   - Paramètre envoyé : un objet de type Product
// Le parent écoutera cet événement avec @add-to-cart="maFonction"
const emit = defineEmits<{
  "add-to-cart": [product: Product];
}>();

// ─────────────────────────────────────────────
// FONCTION
// ─────────────────────────────────────────────

// handleAddToCart() : appelée au clic du bouton "Ajouter au panier".
// Son rôle : émettre l'événement 'add-to-cart' vers le composant parent.
// On ne gère PAS le panier ici — c'est la responsabilité du parent.
// Un composant doit rester simple et déléguer la logique globale au parent.
function handleAddToCart() {
  // emit(nomEvenement, donnéeÀEnvoyer)
  // On envoie le produit complet au parent pour qu'il puisse l'ajouter au panier.
  emit("add-to-cart", props.product);
}
</script>

<template>
  <!-- La carte produit entière -->
  <div class="product-card">

    <!-- EMOJI / IMAGE -->
    <!-- product.image est optionnel, on affiche un emoji par défaut si absent -->
    <!-- L'opérateur ?? (nullish coalescing) : utilise la valeur de droite si la gauche est null/undefined -->
    <div class="product-image">{{ product.image ?? "📦" }}</div>

    <!-- CONTENU TEXTE -->
    <div class="product-info">
      <h3>{{ product.name }}</h3>

      <!-- toFixed(2) formate le nombre avec exactement 2 décimales -->
      <!-- Exemple : 9.9 → "9.90" ; 12.5 → "12.50" -->
      <p class="price">{{ product.price.toFixed(2) }} €</p>

      <p class="category">{{ product.category }}</p>

      <!-- BADGE RUPTURE DE STOCK -->
      <!-- v-if n'affiche cet élément QUE si inStock est false -->
      <!-- !product.inStock : l'opérateur ! inverse le booléen -->
      <span v-if="!product.inStock" class="badge-rupture">Rupture</span>
    </div>

    <!-- BOUTON AJOUTER AU PANIER -->
    <!-- :disabled lie dynamiquement l'attribut disabled à !product.inStock -->
    <!-- Si inStock = false, disabled = true → bouton grisé et non cliquable -->
    <!-- @click="handleAddToCart" : appelle notre fonction au clic -->
    <button
      :disabled="!product.inStock"
      @click="handleAddToCart"
      class="add-btn"
    >
      {{ product.inStock ? "Ajouter au panier" : "Indisponible" }}
    </button>

  </div>
</template>

<style scoped>
.product-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column; /* Empile les éléments verticalement */
  gap: 0.5rem;
  background: white;
  transition: box-shadow 0.2s;
}

.product-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* Ombre au survol */
}

.product-image {
  font-size: 3rem;
  text-align: center;
}

.product-info h3 {
  margin: 0;
  font-size: 1rem;
}

.price {
  font-weight: bold;
  color: #059669; /* Vert pour le prix */
  margin: 0;
}

.category {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0;
}

.badge-rupture {
  display: inline-block;
  background: #fee2e2; /* Rouge clair */
  color: #ef4444;
  font-size: 0.75rem;
  padding: 0.1rem 0.5rem;
  border-radius: 9999px; /* Arrondi parfait → "pill" shape */
}

.add-btn {
  margin-top: auto; /* Pousse le bouton vers le bas de la carte */
  padding: 0.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.add-btn:hover:not(:disabled) {
  background: #2563eb;
}

.add-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}
</style>
```

---

## Code corrigé complet — ProductCatalog.vue

```vue
<!-- ProductCatalog.vue -->
<!-- Composant PARENT qui affiche le catalogue et gère le panier -->

<script setup lang="ts">
import { ref, computed } from "vue";
// On importe le composant enfant ProductCard
// Vue le reconnaît automatiquement avec <ProductCard /> dans le template
import ProductCard from "./components/ProductCard.vue";
import type { Product } from "./types";

// ─────────────────────────────────────────────
// DONNÉES : liste des produits
// ─────────────────────────────────────────────
// Les données sont définies "en dur" (hardcoded) dans ce composant.
// En production, elles viendraient d'une API (fetch/axios).
// On utilise as const pour que TypeScript infère les types précisément.
const products: Product[] = [
  { id: 1, name: "Clavier mécanique",    price: 89.99,  category: "Informatique", inStock: true,  image: "⌨️" },
  { id: 2, name: "Souris ergonomique",   price: 45.50,  category: "Informatique", inStock: true,  image: "🖱️" },
  { id: 3, name: "Écran 27 pouces",      price: 349.00, category: "Informatique", inStock: false, image: "🖥️" },
  { id: 4, name: "Casque audio",         price: 120.00, category: "Audio",        inStock: true,  image: "🎧" },
  { id: 5, name: "Enceinte Bluetooth",   price: 59.95,  category: "Audio",        inStock: true,  image: "🔊" },
  { id: 6, name: "Microphone USB",       price: 79.00,  category: "Audio",        inStock: false, image: "🎙️" },
  { id: 7, name: "Webcam HD",            price: 95.00,  category: "Informatique", inStock: true,  image: "📷" },
  { id: 8, name: "Tapis de souris XXL",  price: 22.00,  category: "Accessoires",  inStock: true,  image: "🟫" },
];

// ─────────────────────────────────────────────
// ÉTAT RÉACTIF
// ─────────────────────────────────────────────

// Texte tapé dans la barre de recherche
const searchQuery = ref("");

// Catégorie sélectionnée dans le menu déroulant
// "" = "Toutes les catégories" (option par défaut)
const selectedCategory = ref("");

// Le panier : tableau de produits ajoutés.
// Un même produit peut apparaître plusieurs fois si on le clique plusieurs fois.
const cart = ref<Product[]>([]);

// ─────────────────────────────────────────────
// VALEURS CALCULÉES (computed)
// ─────────────────────────────────────────────

// categories : liste unique des catégories pour remplir le menu déroulant.
// Set est une structure de données qui ne peut contenir de doublons.
// [...new Set(array)] : crée un Set (supprime les doublons) puis le reconvertit en tableau.
const categories = computed(() => {
  // On extrait toutes les catégories (avec doublons) avec map()
  // map() transforme chaque produit en sa catégorie : [Product, Product, ...] → ["Audio", "Informatique", ...]
  const allCategories = products.map((p) => p.category);
  // new Set() crée un ensemble sans doublons
  // [...] (spread) reconvertit le Set en tableau ordinaire
  return [...new Set(allCategories)].sort(); // .sort() trie alphabétiquement
});

// filteredProducts : liste des produits à afficher selon recherche + catégorie.
// Se recalcule automatiquement quand searchQuery ou selectedCategory changent.
const filteredProducts = computed(() => {
  // On part de tous les produits puis on applique les filtres successivement
  return products.filter((product) => {
    // FILTRE PAR NOM : le nom du produit contient-il le texte recherché ?
    // toLowerCase() met en minuscules pour comparer sans tenir compte de la casse
    // Exemple : "Clavier" et "clavier" correspondent tous les deux à "lavier"
    // includes() retourne true si la chaîne contient la sous-chaîne
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.value.toLowerCase());

    // FILTRE PAR CATÉGORIE
    // Si selectedCategory est vide (""), l'utilisateur veut voir "toutes" → on ne filtre pas
    // Sinon, on vérifie que la catégorie du produit correspond à celle choisie
    const matchesCategory =
      selectedCategory.value === "" ||
      product.category === selectedCategory.value;

    // Le produit passe le filtre si LES DEUX conditions sont vraies
    // && = ET logique : les deux doivent être true pour que le résultat soit true
    return matchesSearch && matchesCategory;
  });
});

// cartTotal : somme du prix de tous les produits dans le panier.
// reduce() "réduit" un tableau à une seule valeur.
// (total, produit) => total + produit.price : fonction qui accumule les prix
// 0 : valeur de départ de l'accumulation
const cartTotal = computed(() => {
  return cart.value.reduce((total, product) => total + product.price, 0);
});

// ─────────────────────────────────────────────
// FONCTIONS
// ─────────────────────────────────────────────

// addToCart() : appelée quand le composant enfant émet 'add-to-cart'.
// Le produit émis par l'enfant est reçu en paramètre.
function addToCart(product: Product) {
  // push() ajoute le produit à la fin du tableau du panier.
  // On peut ajouter plusieurs fois le même produit (comportement simplifié).
  cart.value.push(product);
}

// removeFromCart() : retire UN exemplaire d'un produit du panier.
// On retire par l'index (position dans le tableau) pour ne supprimer qu'une occurrence.
function removeFromCart(index: number) {
  // splice(index, nombreDEléments) modifie le tableau en place.
  // splice(2, 1) : supprime 1 élément à partir de l'index 2.
  cart.value.splice(index, 1);
}
</script>

<template>
  <div class="catalog">
    <h2>Catalogue produits</h2>

    <!-- ──── FILTRES ──── -->
    <div class="filters">

      <!-- BARRE DE RECHERCHE -->
      <!-- v-model lie le champ à searchQuery en temps réel -->
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Rechercher un produit..."
        class="search-input"
      />

      <!-- MENU DÉROULANT DES CATÉGORIES -->
      <!-- v-model lie la valeur sélectionnée à selectedCategory -->
      <select v-model="selectedCategory" class="category-select">
        <option value="">Toutes les catégories</option>
        <!-- v-for génère une <option> pour chaque catégorie unique -->
        <!-- :key et :value sont liés à la même valeur car les catégories sont des chaînes uniques -->
        <option v-for="cat in categories" :key="cat" :value="cat">
          {{ cat }}
        </option>
      </select>

    </div>

    <!-- COMPTEUR DE RÉSULTATS -->
    <p class="results-count">
      <!-- Expression ternaire : condition ? siVrai : siFaux -->
      {{ filteredProducts.length }}
      {{ filteredProducts.length <= 1 ? "produit trouvé" : "produits trouvés" }}
    </p>

    <!-- ──── GRILLE DE PRODUITS ──── -->
    <!-- v-if / v-else : affiche soit la grille, soit un message -->
    <div v-if="filteredProducts.length > 0" class="product-grid">

      <!-- v-for : répète <ProductCard> pour chaque produit filtré -->
      <!-- :key="product.id" : identifiant unique STABLE (pas l'index !) -->
      <!-- :product="product" : passe le produit comme prop au composant enfant -->
      <!--   La prop s'appelle "product" car c'est ce qu'on a défini dans defineProps de ProductCard -->
      <!-- @add-to-cart="addToCart" : écoute l'événement émis par l'enfant -->
      <!--   Quand ProductCard émet 'add-to-cart', on appelle notre fonction addToCart -->
      <ProductCard
        v-for="product in filteredProducts"
        :key="product.id"
        :product="product"
        @add-to-cart="addToCart"
      />

    </div>

    <!-- Message quand aucun produit ne correspond -->
    <p v-else class="empty-catalog">
      Aucun produit ne correspond à votre recherche.
    </p>

    <!-- ──── PANIER ──── -->
    <div class="cart">
      <h3>🛒 Panier ({{ cart.length }} article{{ cart.length > 1 ? "s" : "" }})</h3>

      <!-- v-if / v-else : soit la liste du panier, soit un message "vide" -->
      <ul v-if="cart.length > 0">

        <!-- v-for avec index : la virgule donne accès à l'index de chaque élément -->
        <!-- :key="index" est acceptable ici car on affiche les articles dans l'ordre d'ajout -->
        <!-- et on supprime par index — l'index est donc un identifiant pertinent ici -->
        <li v-for="(item, index) in cart" :key="index">
          <span>{{ item.image ?? "📦" }} {{ item.name }}</span>
          <span class="item-price">{{ item.price.toFixed(2) }} €</span>
          <!-- @click appelle removeFromCart avec l'index de cet article -->
          <button @click="removeFromCart(index)" class="remove-btn">✕</button>
        </li>

      </ul>

      <p v-else class="cart-empty">Votre panier est vide.</p>

      <!-- TOTAL DU PANIER -->
      <!-- v-if : n'affiche le total que si le panier contient au moins 1 article -->
      <div v-if="cart.length > 0" class="cart-total">
        <strong>Total : {{ cartTotal.toFixed(2) }} €</strong>
      </div>

    </div>

  </div>
</template>

<style scoped>
.catalog {
  max-width: 900px;
  margin: 2rem auto;
  padding: 1rem;
  font-family: sans-serif;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap; /* Les filtres passent à la ligne sur petits écrans */
}

.search-input {
  flex: 1; /* Prend tout l'espace disponible */
  min-width: 200px;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 1rem;
}

.category-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 1rem;
}

.results-count {
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

/* CSS Grid : disposition en grille responsive */
/* auto-fill : crée autant de colonnes que possible */
/* minmax(220px, 1fr) : chaque colonne fait au minimum 220px, au maximum 1fr de l'espace */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.empty-catalog {
  text-align: center;
  color: #9ca3af;
  font-style: italic;
  padding: 2rem;
}

/* PANIER */
.cart {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  background: #f9fafb;
}

.cart h3 {
  margin: 0 0 1rem 0;
}

.cart ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.cart li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.cart li:last-child {
  border-bottom: none; /* Pas de bordure sur le dernier élément */
}

.item-price {
  margin-left: auto; /* Pousse le prix à droite */
  font-weight: bold;
  color: #059669;
}

.remove-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.2rem;
}

.cart-empty {
  color: #9ca3af;
  font-style: italic;
  text-align: center;
}

.cart-total {
  margin-top: 0.75rem;
  text-align: right;
  font-size: 1.1rem;
  color: #1f2937;
}
</style>
```

---

## Ce que tu aurais pu oublier

### 1. Confondre props et données locales
```ts
// Dans ProductCard.vue

// ❌ FAUX : essayer de modifier une prop directement
function handleAddToCart() {
  props.product.inStock = false; // ← INTERDIT ! Une prop est en lecture seule.
}

// ✅ CORRECT : émettre un événement pour que le PARENT fasse la modification
function handleAddToCart() {
  emit("add-to-cart", props.product); // Le parent décide quoi faire
}
```
> La règle d'or en Vue : les données descendent (parent → enfant via props), les événements remontent (enfant → parent via emit). Ce principe s'appelle le **"one-way data flow"**.

---

### 2. Oublier `:key` dans `v-for` ou utiliser l'index sur une liste modifiable
```html
<!-- ❌ FAUX : pas de :key → Vue ne peut pas optimiser les mises à jour -->
<ProductCard v-for="product in filteredProducts" :product="product" />

<!-- ⚠️ RISQUÉ : l'index change quand on filtre → Vue peut réutiliser les mauvais composants -->
<ProductCard v-for="(product, i) in filteredProducts" :key="i" :product="product" />

<!-- ✅ CORRECT : l'ID est stable même après filtrage -->
<ProductCard v-for="product in filteredProducts" :key="product.id" :product="product" />
```

---

### 3. Ne pas utiliser `computed` pour les catégories uniques
```ts
// ❌ FAUX : calculé à chaque re-render, et ne se met pas à jour si les produits changent
const categories = [...new Set(products.map(p => p.category))];

// ✅ CORRECT : computed est mis en cache ET réactif
const categories = computed(() => [...new Set(products.map(p => p.category))]);
```

---

### 4. Oublier de déclarer l'emit dans `defineEmits`
```ts
// ❌ FAUX : émettre sans déclarer → TypeScript ne peut pas valider les types
emit("add-to-cart", props.product); // Erreur : emit n'est pas défini !

// ✅ CORRECT : toujours déclarer les emits
const emit = defineEmits<{
  "add-to-cart": [product: Product];
}>();
emit("add-to-cart", props.product); // ✓ TypeScript vérifie le type du paramètre
```

---

### 5. Confondre `filter()`, `map()` et `reduce()`
```ts
const products = [
  { name: "Clavier", price: 90, inStock: true },
  { name: "Écran",   price: 350, inStock: false },
  { name: "Souris",  price: 45, inStock: true },
];

// filter() : retourne un NOUVEAU tableau avec seulement les éléments qui passent le test
const disponibles = products.filter(p => p.inStock);
// → [{ name: "Clavier", ... }, { name: "Souris", ... }]

// map() : retourne un NOUVEAU tableau avec la TRANSFORMATION de chaque élément
const noms = products.map(p => p.name);
// → ["Clavier", "Écran", "Souris"]

// reduce() : réduit le tableau à UNE SEULE valeur (ici, la somme des prix)
const total = products.reduce((somme, p) => somme + p.price, 0);
// → 485 (90 + 350 + 45)
```

---

## Concepts clés utilisés

| Concept | Ce que ça fait |
|---|---|
| `defineProps<{ product: Product }>()` | Déclare les données reçues du parent, avec types |
| `defineEmits<{ 'add-to-cart': [Product] }>()` | Déclare les événements envoyés au parent |
| `emit("add-to-cart", product)` | Envoie un événement avec une donnée vers le parent |
| `@add-to-cart="addToCart"` | Le parent écoute l'événement émis par l'enfant |
| `:product="product"` | Passe une prop au composant enfant |
| `computed` | Listes filtrées et totaux recalculés automatiquement |
| `array.filter()` | Garde seulement les éléments qui passent un test |
| `array.map()` | Transforme chaque élément en autre chose |
| `array.reduce()` | Calcule une valeur unique (total, somme...) |
| `[...new Set(array)]` | Supprime les doublons d'un tableau |
| `string.includes()` | Vérifie si une chaîne contient une sous-chaîne |
| `string.toLowerCase()` | Met en minuscules pour comparer sans tenir compte de la casse |
| `?.` | Accès optionnel : `product.image ?? "📦"` |
| `array.splice(i, 1)` | Supprime 1 élément à l'index `i` dans le tableau |
