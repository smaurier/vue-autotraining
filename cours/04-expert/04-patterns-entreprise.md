# 04 — Patterns d'entreprise

## Clean Architecture adaptée au front

```
src/
  domain/           ← Entites et regles metier pures (zero dependance Vue)
    entities/
      User.ts
      Product.ts
    value-objects/
      Email.ts
      Money.ts
    services/
      PricingService.ts
  application/       ← Cas d'usage (orchestration)
    use-cases/
      CreateOrder.ts
      ApplyDiscount.ts
  infrastructure/    ← Implementations concretes (API, storage)
    api/
      HttpProductRepository.ts
    storage/
      LocalStorageCartRepository.ts
  presentation/      ← Vue (composants, composables, stores)
    features/
      ...
```

### Exemple : Value Object

```ts
// domain/value-objects/Email.ts
export class Email {
  private constructor(private readonly value: string) {}

  static create(raw: string): Email {
    const trimmed = raw.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new Error(`Email invalide: ${raw}`);
    }
    return new Email(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

### Exemple : Repository pattern

```ts
// domain/ports/ProductRepository.ts (interface)
export interface ProductRepository {
  getAll(): Promise<Product[]>;
  getById(id: number): Promise<Product>;
  create(data: CreateProductDto): Promise<Product>;
  update(id: number, data: UpdateProductDto): Promise<Product>;
  delete(id: number): Promise<void>;
}
```

```ts
// infrastructure/api/HttpProductRepository.ts (implementation)
export class HttpProductRepository implements ProductRepository {
  constructor(private readonly baseUrl: string) {}

  async getAll(): Promise<Product[]> {
    const res = await fetch(this.baseUrl);
    return res.json();
  }

  // ... autres methodes
}
```

```ts
// Pour les tests
export class InMemoryProductRepository implements ProductRepository {
  private items: Product[] = [];

  async getAll(): Promise<Product[]> {
    return [...this.items];
  }

  // ... mock en memoire
}
```

## Monorepo

Pour les gros projets ESN avec plusieurs apps/libs :

```
packages/
  ui/              ← Design system partage
    src/
      Button.vue
      Input.vue
    package.json
  shared/          ← Utilitaires et types communs
    src/
      types.ts
      validators.ts
    package.json
apps/
  backoffice/      ← App Vue 3
    package.json
  customer-portal/ ← App Vue 3 ou Nuxt
    package.json
pnpm-workspace.yaml
```

```yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
  - "apps/*"
```

### Avantages

- Code partage sans publier sur npm
- Un seul `pnpm install`
- Changements atomiques (modifier la lib + l'app en une PR)

### Outils : **Turborepo** ou **Nx**

```json
// turbo.json
{
  "pipeline": {
    "build": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["build"] },
    "lint": {}
  }
}
```

## Micro-frontends

Quand plusieurs équipes travaillent sur des parties differentes d'un meme produit.

### Solution 1 : Module Federation (Webpack/Vite)

```ts
// remote app (equipe A)
export default defineConfig({
  plugins: [
    federation({
      name: "teamA",
      filename: "remoteEntry.js",
      exposes: {
        "./ProductWidget": "./src/ProductWidget.vue",
      },
    }),
  ],
});
```

```ts
// host app (shell)
const TeamAProduct = defineAsyncComponent(() => import("teamA/ProductWidget"));
```

### Solution 2 : iframes (plus simple, plus isole)

### Solution 3 : Web Components

```ts
import { defineCustomElement } from "vue";
import ProductWidget from "./ProductWidget.vue";

const ProductWidgetElement = defineCustomElement(ProductWidget);
customElements.define("product-widget", ProductWidgetElement);
```

### Quand utiliser les micro-frontends ?

- **Oui** : 3+ équipes, déploiement indépendant nécessaire
- **Non** : équipe unique, petit projet (overhead énorme)
- **En ESN** : la plupart du temps, une feature-based architecture suffit

## Strategies de migration

En ESN, tu tomberas sur des migrations (Vue 2 → 3, Angular → Vue, etc.)

### Migration progressive Vue 2 → Vue 3

1. Activer le mode compatibilite (`@vue/compat`)
2. Migrer composant par composant
3. Remplacer les mixins par des composables
4. Migrer vers Pinia (Vuex → Pinia)
5. Supprimer `@vue/compat`

### Règles de migration

- **Jamais de freeze produit** (migrer en parallele du dev)
- **Feature flags** pour activer le nouveau code progressivement
- **Tests de non-régression** avant chaque étape

## Suite

→ Module 05 : `cours/05-nuxt3/01-introduction.md`
