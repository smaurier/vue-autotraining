# 04 — Patterns d'entreprise : les recettes des gros projets

> **Niveau** : Avancé — Ce chapitre présente des "patterns" (des modèles d'organisation)
> utilisés dans les **gros projets** en entreprise.
>
> **Pas de panique !** Un petit projet n'a PAS besoin de tout ça.
> Lis ce chapitre pour comprendre les idées, et tu les appliqueras quand
> tu en auras besoin. C'est tout à fait normal de revenir ici plus tard.

---

## C'est quoi un "pattern d'entreprise" ?

### 🍔 L'analogie de la franchise de restaurants

Imagine une chaîne de restaurants comme McDonald's. Ils ont des **centaines**
de restaurants dans le monde, et pourtant :

- Les Big Mac ont **le même goût partout**
- Chaque employé suit **les mêmes procédures**
- Les cuisines sont organisées **de la même façon**
- Si un nouveau plat est ajouté, **toutes les équipes savent comment le préparer**

Comment c'est possible ? Grâce à des **recettes standardisées** et des
**procédures testées et approuvées**.

Les **patterns d'entreprise**, c'est exactement ça : des **façons éprouvées
d'organiser le code** qui fonctionnent dans les gros projets. Ce sont des
"recettes" que des milliers de développeurs utilisent et qui ont fait leurs preuves.

### Quand en a-t-on besoin ?

| Taille du projet       | Patterns nécessaires ?                      |
| ---------------------- | ------------------------------------------- |
| Projet perso / petit   | ❌ Non, c'est de la sur-ingénierie          |
| Projet moyen (5-10 pages) | ⚠️ Quelques-uns (services, types)        |
| Gros projet en équipe  | ✅ Oui, pour que tout le monde s'y retrouve |

---

## Pattern 1 : La couche Service (Service Layer)

### 🍽️ L'analogie

Dans un restaurant, le **serveur** ne va pas en cuisine pour cuisiner.
Il passe la **commande** à la cuisine, et la cuisine lui renvoie le plat.

Dans ton code, c'est pareil : un composant Vue ne devrait pas contenir
directement les appels au serveur. On crée un **service** qui s'en occupe.

### En pratique

```ts
// services/productService.ts
// Ce fichier s'occupe UNIQUEMENT de communiquer avec le serveur

// On définit l'adresse de base de notre API
const BASE_URL = '/api/products'

export const productService = {
  // Récupérer tous les produits
  async getAll(): Promise<Product[]> {
    const response = await fetch(BASE_URL)
    // fetch() envoie une requête HTTP au serveur
    // await = on attend la réponse

    if (!response.ok) {
      throw new Error(`Le serveur a répondu avec l'erreur ${response.status}`)
    }

    return response.json()
    // On convertit la réponse JSON en objet JavaScript
  },

  // Créer un nouveau produit
  async create(newProduct: CreateProductDto): Promise<Product> {
    const response = await fetch(BASE_URL, {
      method: 'POST',                                  // POST = envoyer des données
      headers: { 'Content-Type': 'application/json' }, // Format des données
      body: JSON.stringify(newProduct),                 // Les données du produit
    })

    if (!response.ok) {
      throw new Error(`Erreur lors de la création: ${response.status}`)
    }

    return response.json()
  },
}
```

### Pourquoi c'est utile ?

```ts
// ❌ SANS service : le composant fait tout (affichage + appel API)
const products = ref<Product[]>([])
onMounted(async () => {
  const res = await fetch('/api/products')   // Appel API dans le composant 😬
  products.value = await res.json()
})

// ✅ AVEC service : le composant reste simple
const products = ref<Product[]>([])
onMounted(async () => {
  products.value = await productService.getAll()  // Une seule ligne, bien lisible
})
```

> **Avantage** : si l'URL de l'API change, tu modifies UN seul fichier (le service),
> pas tous les composants qui l'utilisent.

---

## Pattern 2 : Le Repository (Repository Pattern)

### 📚 L'analogie de la bibliothèque

Quand tu veux un livre à la bibliothèque, tu demandes au **bibliothécaire**.
Tu ne vas pas fouiller toi-même dans les réserves !

- Le **bibliothécaire** = le Repository
- Les **réserves** = la base de données / l'API
- **Toi** = le code qui a besoin des données

Le Repository est comme un **contrat** : "je sais récupérer des produits,
les créer, les modifier, les supprimer — comment je le fais, c'est mon affaire".

### Étape 1 : Définir le contrat (l'interface)

```ts
// domain/ports/ProductRepository.ts
// Ce fichier définit CE QUE le repository doit savoir faire
// (mais pas COMMENT il le fait)

export interface ProductRepository {
  // interface = un contrat, une "liste de promesses"
  // "Celui qui implémente cette interface devra fournir ces méthodes"

  getAll(): Promise<Product[]>
  // Retourner tous les produits

  getById(id: number): Promise<Product>
  // Retourner un produit par son identifiant

  create(data: CreateProductDto): Promise<Product>
  // Créer un produit et le retourner

  update(id: number, data: UpdateProductDto): Promise<Product>
  // Modifier un produit existant

  delete(id: number): Promise<void>
  // Supprimer un produit (void = ne retourne rien)
}
```

### Étape 2 : L'implémentation réelle (celle qui parle au serveur)

```ts
// infrastructure/api/HttpProductRepository.ts
// Cette classe implémente le contrat en utilisant l'API HTTP

export class HttpProductRepository implements ProductRepository {
  // "implements ProductRepository" = "je m'engage à fournir toutes les méthodes du contrat"

  constructor(private readonly baseUrl: string) {}
  // Le constructeur reçoit l'URL de base (ex: "/api/products")
  // "private readonly" = on garde cette valeur, et elle ne changera pas

  async getAll(): Promise<Product[]> {
    const res = await fetch(this.baseUrl)
    // On appelle le serveur avec l'URL de base
    return res.json()
  }

  async getById(id: number): Promise<Product> {
    const res = await fetch(`${this.baseUrl}/${id}`)
    return res.json()
  }

  async create(data: CreateProductDto): Promise<Product> {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  }

  async update(id: number, data: UpdateProductDto): Promise<Product> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',      // PUT = remplacer/modifier une ressource
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  }

  async delete(id: number): Promise<void> {
    await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',    // DELETE = supprimer une ressource
    })
  }
}
```

### Étape 3 : Une implémentation pour les tests (en mémoire)

```ts
// C'est là que la magie du pattern opère !
// Pour les tests, on n'a pas besoin d'un vrai serveur.
// On crée un "faux" repository qui stocke tout en mémoire.

export class InMemoryProductRepository implements ProductRepository {
  // "implements ProductRepository" = même contrat, mais implémentation différente

  private items: Product[] = []
  // Un simple tableau JavaScript fait office de base de données

  async getAll(): Promise<Product[]> {
    return [...this.items]
    // On retourne une copie du tableau (spread operator ...)
  }

  async getById(id: number): Promise<Product> {
    const found = this.items.find(item => item.id === id)
    // .find() cherche dans le tableau l'élément qui correspond
    if (!found) throw new Error(`Produit ${id} non trouvé`)
    return found
  }

  async create(data: CreateProductDto): Promise<Product> {
    const newProduct = { id: Date.now(), ...data }
    // On crée un produit avec un id unique (le timestamp actuel)
    this.items.push(newProduct)
    // On l'ajoute au tableau
    return newProduct
  }

  async update(id: number, data: UpdateProductDto): Promise<Product> {
    const index = this.items.findIndex(item => item.id === id)
    // findIndex retourne la POSITION de l'élément (ou -1 si pas trouvé)
    if (index === -1) throw new Error(`Produit ${id} non trouvé`)
    this.items[index] = { ...this.items[index], ...data }
    return this.items[index]
  }

  async delete(id: number): Promise<void> {
    this.items = this.items.filter(item => item.id !== id)
    // filter() garde uniquement les éléments qui NE correspondent PAS à l'id
  }
}
```

### Pourquoi c'est puissant ?

```
Le code de ton application utilise le CONTRAT (l'interface),
pas l'implémentation concrète.

En prod  → HttpProductRepository   (parle au vrai serveur)
En test  → InMemoryProductRepository (tout en mémoire, ultra rapide)

Tu peux changer l'un sans toucher l'autre ! 🎉
```

---

## Pattern 3 : Les Value Objects (objets-valeur)

### 📧 L'analogie

Un email, c'est pas juste une chaîne de texte. C'est une chaîne
**qui respecte un format précis**. Un Value Object encapsule cette règle.

Au lieu de vérifier le format de l'email partout dans ton code,
tu crées un objet `Email` qui **garantit** qu'il est toujours valide.

```ts
// domain/value-objects/Email.ts

export class Email {
  // Le constructeur est "private" = on ne peut pas faire "new Email(...)"
  // directement depuis l'extérieur
  private constructor(private readonly value: string) {}

  // La seule façon de créer un Email, c'est avec cette méthode
  static create(raw: string): Email {
    const trimmed = raw.trim().toLowerCase()
    // trim() = enlève les espaces avant/après
    // toLowerCase() = convertit en minuscules

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      // Cette regex vérifie que le texte ressemble à "quelquechose@domaine.ext"
      throw new Error(`Email invalide : ${raw}`)
      // Si ce n'est pas un email valide, on lance une erreur
    }

    return new Email(trimmed)
    // Si tout est OK, on crée l'objet Email
  }

  // Convertir en texte
  toString(): string {
    return this.value
  }

  // Comparer deux emails
  equals(other: Email): boolean {
    return this.value === other.value
    // Deux emails sont égaux si leur texte est identique
  }
}
```

```ts
// Utilisation :
const email1 = Email.create('  Alice@Gmail.COM  ')
// → Crée un Email avec la valeur "alice@gmail.com" (nettoyé + minuscules)

const email2 = Email.create('pas-un-email')
// → ❌ Erreur ! "Email invalide : pas-un-email"

console.log(email1.toString())  // "alice@gmail.com"
```

> **Avantage** : la validation est faite UNE seule fois, à la création.
> Partout ailleurs dans le code, quand tu as un objet `Email`,
> tu SAIS qu'il est valide. Pas besoin de revérifier.

---

## Pattern 4 : La Clean Architecture (pour les très gros projets)

> ⚠️ **Ce pattern est avancé.** Il est utile dans les très gros projets
> avec plusieurs équipes. Pour un projet classique, les patterns
> précédents suffisent largement.

### L'idée : séparer le code en "anneaux"

```
┌─────────────────────────────────────────────────────────┐
│  📺 Présentation (Vue)                                  │
│  Composants, composables, stores                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  🔧 Infrastructure                              │    │
│  │  API HTTP, localStorage, services externes      │    │
│  │                                                  │    │
│  │  ┌─────────────────────────────────────────┐    │    │
│  │  │  📋 Application                         │    │    │
│  │  │  Cas d'usage (use cases)                │    │    │
│  │  │                                          │    │    │
│  │  │  ┌─────────────────────────────────┐    │    │    │
│  │  │  │  💎 Domaine                     │    │    │    │
│  │  │  │  Entités, règles métier pures   │    │    │    │
│  │  │  │  (ZERO dépendance Vue)          │    │    │    │
│  │  │  └─────────────────────────────────┘    │    │    │
│  │  └─────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### La structure de dossiers

```
src/
  domain/              ← 💎 Le cœur : les règles métier PURES
    entities/          ← Les objets principaux (User, Product…)
      User.ts
      Product.ts
    value-objects/     ← Les objets-valeur (Email, Money…)
      Email.ts
      Money.ts
    services/          ← La logique métier (calcul de prix…)
      PricingService.ts

  application/         ← 📋 Les cas d'usage : "que peut faire l'utilisateur ?"
    use-cases/
      CreateOrder.ts   ← Créer une commande
      ApplyDiscount.ts ← Appliquer une réduction

  infrastructure/      ← 🔧 Le monde extérieur : API, stockage…
    api/
      HttpProductRepository.ts     ← Appels HTTP
    storage/
      LocalStorageCartRepository.ts ← Stockage local du panier

  presentation/        ← 📺 Vue : composants, composables, stores
    features/
      ...              ← Organisation par feature (comme vu avant)
```

### Pourquoi cette séparation ?

- Le **domaine** ne dépend de RIEN (ni Vue, ni fetch, ni localStorage)
  → On peut le tester très facilement
- Si tu changes de framework (Vue → React), le domaine reste **identique**
- Si tu changes d'API, seule l'**infrastructure** change

> **En pratique** : la plupart des projets n'ont pas besoin de la Clean Architecture
> complète. Avoir des **services** et des **types** bien séparés est déjà très bien.

---

## Le Monorepo (pour les projets multi-applications)

### 📦 L'analogie de l'entrepôt

Imagine que tu gères 3 boutiques en ligne. Elles ont toutes besoin de :
- Les mêmes boutons, les mêmes formulaires (le design system)
- Les mêmes fonctions utilitaires (validation, formatage)

Au lieu de copier-coller ce code dans chaque boutique, tu mets tout
dans **un seul entrepôt** (un seul dépôt de code) et chaque boutique
y pioche ce dont elle a besoin.

### La structure

```
packages/              ← Les "boîtes" de code partagé
  ui/                  ← Le design system (boutons, inputs…)
    src/
      Button.vue       ← Composant bouton partagé
      Input.vue        ← Composant input partagé
    package.json

  shared/              ← Utilitaires et types communs
    src/
      types.ts         ← Types partagés
      validators.ts    ← Fonctions de validation
    package.json

apps/                  ← Les applications
  backoffice/          ← App d'administration (Vue 3)
    package.json

  customer-portal/     ← Portail client (Vue 3 ou Nuxt)
    package.json

pnpm-workspace.yaml    ← La config qui relie tout ça
```

```yaml
# pnpm-workspace.yaml
# Ce fichier dit à pnpm : "voici les dossiers qui font partie du projet"
packages:
  - "packages/*"    # Tout ce qui est dans packages/
  - "apps/*"        # Tout ce qui est dans apps/
```

### Les avantages

- **Code partagé sans publier de paquet npm** : les apps importent directement depuis les packages
- **Un seul `pnpm install`** : les dépendances sont gérées à un seul endroit
- **Changements synchronisés** : modifier un bouton + l'app qui l'utilise dans la même PR

> **Outils populaires** : **Turborepo** ou **Nx** pour gérer les builds et les tests
> de façon intelligente dans un monorepo.

---

## Les Micro-frontends (avancé)

> ⚠️ **Concept très avancé.** Pour la majorité des projets, ce n'est pas nécessaire.
> C'est mentionné ici pour ta culture, au cas où tu en entendrais parler.

### L'idée

Quand **plusieurs équipes** travaillent sur des parties **différentes**
d'un même produit, chaque équipe peut développer et déployer son morceau
**indépendamment**.

### Quand les utiliser ?

- **Oui** : 3 équipes ou plus, besoin de déploiement indépendant
- **Non** : équipe unique, petit ou moyen projet (la complexité n'en vaut pas la peine)
- **En entreprise** : la plupart du temps, une architecture par feature suffit largement

---

## Stratégies de migration

En entreprise, tu tomberas souvent sur des projets qui doivent **migrer**
d'une technologie à une autre (Vue 2 → Vue 3, Angular → Vue, etc.)

### Migration progressive Vue 2 → Vue 3

```
Étape 1 → Activer le mode compatibilité (@vue/compat)
           Permet de faire tourner du code Vue 2 dans Vue 3

Étape 2 → Migrer composant par composant
           On convertit les fichiers un à un, pas tout d'un coup

Étape 3 → Remplacer les mixins par des composables
           Les mixins (ancien système) → composables (nouveau système)

Étape 4 → Migrer de Vuex vers Pinia
           Vuex (ancien store) → Pinia (nouveau store)

Étape 5 → Supprimer @vue/compat
           Quand tout est migré, on enlève la couche de compatibilité
```

### Les règles d'or de la migration

1. **Jamais de gel du produit** : on continue à développer des features
   pendant la migration (les deux en parallèle)
2. **Feature flags** : on active le nouveau code progressivement
   (un bouton "on/off" pour chaque morceau migré)
3. **Tests de non-régression** : avant chaque étape, on vérifie
   que rien n'est cassé

---

## 📝 Résumé

| Pattern             | Analogie                     | Quand l'utiliser ?              |
| ------------------- | ---------------------------- | ------------------------------- |
| Service Layer       | Le serveur du restaurant     | Dès que tu appelles une API     |
| Repository          | Le bibliothécaire            | Projets moyens à gros           |
| Value Object        | Un email "garanti valide"    | Quand tu as des règles métier   |
| Clean Architecture  | Les anneaux d'un oignon      | Très gros projets               |
| Monorepo            | Un entrepôt pour 3 boutiques | Plusieurs apps qui partagent du code |
| Micro-frontends     | Des stands indépendants dans un food court | 3+ équipes, déploiement séparé |

> **Rappel** : tu n'as PAS besoin de tout ça pour démarrer.
> Commence simple, et ajoute des patterns quand le besoin se fait sentir.
> Le meilleur code est celui qui est **facile à comprendre** par toi et ton équipe.

---

## Suite

→ Module 05 : `cours/05-nuxt3/01-introduction.md`
