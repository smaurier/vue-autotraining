# 01 — Pipeline CI

## Qu'est-ce qu'un pipeline CI ?

Une suite de verifications automatiques executees a chaque push/PR :

```
Push → Lint → Typecheck → Tests → Build → Deploy (CD)
```

## GitHub Actions (le plus courant en ESN)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Typecheck
        run: pnpm typecheck

      - name: Tests
        run: pnpm test:run --coverage

      - name: Build
        run: pnpm build
```

## Quality gates

### ESLint

```bash
pnpm add -D eslint @eslint/js @vue/eslint-config-typescript eslint-plugin-vue
```

```js
// eslint.config.js
import pluginVue from "eslint-plugin-vue";
import tsConfig from "@vue/eslint-config-typescript";

export default [
  ...pluginVue.configs["flat/recommended"],
  ...tsConfig(),
  {
    rules: {
      "no-console": "warn",
      "vue/multi-word-component-names": "off",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
];
```

### Prettier

```bash
pnpm add -D prettier @vue/eslint-config-prettier
```

```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

### Husky + lint-staged (pre-commit)

```bash
pnpm add -D husky lint-staged
npx husky init
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,vue}": ["eslint --fix", "prettier --write"],
    "*.{css,md,json}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
pnpm lint-staged
```

### Seuils de couverture

```ts
// vitest.config.ts (ou dans vite.config.ts)
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

## PR checks

Dans GitHub, configure les **branch protection rules** :

- Require status checks to pass (CI)
- Require reviews (1+)
- Require up-to-date branches

## Suite

→ `cours/07-cicd/02-deploiement.md`
