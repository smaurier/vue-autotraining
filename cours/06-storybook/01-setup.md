# 01 — Storybook : Setup avec Vue 3

## Qu'est-ce que Storybook ?

Un outil pour **developper, tester et documenter des composants UI en isolation**.

En ESN, Storybook sert a :

- Documenter le design system pour les developpeurs
- Permettre aux PO/designers de valider les composants
- Tester les états visuels sans lancer l'app complète

## Installation

```bash
npx storybook@latest init
# Detecte Vue 3 + Vite automatiquement
```

Structure ajoutee :

```
.storybook/
  main.ts        ← config Storybook
  preview.ts     ← config globale des stories
src/
  stories/       ← exemples (tu peux supprimer)
```

## Configuration

```ts
// .storybook/main.ts
import type { StorybookConfig } from "@storybook/vue3-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  framework: "@storybook/vue3-vite",
  addons: ["@storybook/addon-essentials", "@storybook/addon-a11y"],
};

export default config;
```

```ts
// .storybook/preview.ts
import type { Preview } from "@storybook/vue3";
import "../src/style.css"; // Importe tes styles globaux

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
};

export default preview;
```

## Addons essentiels

```bash
pnpm add -D @storybook/addon-essentials @storybook/addon-a11y @storybook/addon-interactions @storybook/test
```

| Addon          | Role                                               |
| -------------- | -------------------------------------------------- |
| `essentials`   | Controls, Actions, Viewport, Docs (inclus de base) |
| `a11y`         | Audit accessibilite automatique par story          |
| `interactions` | Play functions pour tester les interactions        |
| `test`         | Utilitaires de test dans les stories               |

## Alias et imports

Si ton projet utilise des alias (`@/`), configure-les dans Storybook :

```ts
// .storybook/main.ts
import type { StorybookConfig } from "@storybook/vue3-vite";
import { mergeConfig } from "vite";
import path from "path";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  framework: "@storybook/vue3-vite",
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
    "@storybook/addon-interactions",
  ],
  viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "../src"),
        },
      },
    });
  },
};

export default config;
```

## Storybook dans le CI

```yaml
# .github/workflows/ci.yml — job Storybook
storybook:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - run: pnpm install --frozen-lockfile
    - run: pnpm storybook build
    # Optionnel : deployer sur Chromatic pour review visuel
```

## Lancer Storybook

```bash
pnpm storybook
# Ouvre http://localhost:6006

pnpm storybook build
# Genere un site statique dans storybook-static/
```

## En contexte ESN

| Situation                    | Valeur Storybook                       |
| ---------------------------- | -------------------------------------- |
| Équipe front > 3 devs        | Documentation vivante des composants   |
| PO / designer dans la boucle | Validation visuelle sans lancer l'app  |
| Design system partage        | Catalogue interactif des composants UI |
| Onboarding nouveau dev       | Decouverte rapide des composants dispo |
| Regression visuelle          | Chromatic / tests visuels automatises  |

## Suite

→ `cours/06-storybook/02-stories.md`
