# 03 — Audit d'accessibilite

## Outils automatiques

### axe-core (dans le navigateur)

1. Installe l'extension **axe DevTools** (Chrome/Firefox)
2. Ouvre DevTools → onglet axe
3. Scan la page → liste des problèmes avec sévérité et fix suggéré

### eslint-plugin-vuejs-accessibility

```bash
pnpm add -D eslint-plugin-vuejs-accessibility
```

```js
// eslint.config.js
import vuejsAccessibility from "eslint-plugin-vuejs-accessibility";

export default [
  // ... autres configs
  ...vuejsAccessibility.configs["flat/recommended"],
];
```

Détecte dans le code :

- Images sans alt
- Labels manquants
- Handlers click sans equivalent clavier
- Roles incorrects

### Storybook addon a11y

```bash
pnpm add -D @storybook/addon-a11y
```

```ts
// .storybook/main.ts
addons: ["@storybook/addon-a11y"];
```

Chaque story affiche un onglet avec les violations d'accessibilite.

### vitest-axe (tests)

```bash
pnpm add -D vitest-axe
```

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { axe } from "vitest-axe";
import ContactForm from "@/components/ContactForm.vue";

describe("ContactForm a11y", () => {
  it("ne contient pas de violation WCAG", async () => {
    const wrapper = mount(ContactForm);
    const results = await axe(wrapper.element);
    expect(results.violations).toHaveLength(0);
  });
});
```

## Audit manuel (checklist)

Les outils automatiques détectent ~30% des problèmes. Le reste est manuel :

### Navigation clavier

- [ ] Tab parcourt tous les éléments interactifs dans l'ordre logique
- [ ] Enter/Space active les boutons
- [ ] Escape ferme les modals/dropdowns
- [ ] Fleches navigent dans les tabs/menus
- [ ] Pas de piege clavier (on peut toujours sortir)
- [ ] Le focus est visible (outline)

### Lecteur d'écran

Teste avec :

- **NVDA** (Windows, gratuit)
- **VoiceOver** (macOS, integre)
- **TalkBack** (Android)

Verification :

- [ ] Les titres sont en hierarchie logique (h1 → h2 → h3)
- [ ] Les images ont un alt pertinent (ou alt="" si decorative)
- [ ] Les formulaires sont navigables et les erreurs annoncees
- [ ] Les regions dynamiques sont annoncees (aria-live)
- [ ] Les liens et boutons ont des labels comprehensibles

### Visuel

- [ ] Contraste suffisant (4.5:1 minimum)
- [ ] Pas de dependance a la couleur seule (ajouter icone/texte)
- [ ] Zoom 200% sans perte de contenu
- [ ] Mode sombre respecte les contrastes

## Lighthouse

```bash
# CLI
pnpm add -D lighthouse
npx lighthouse http://localhost:5173 --only-categories=accessibility
```

Ou directement dans Chrome DevTools → onglet Lighthouse.

## Automatiser dans la CI

```yaml
# .github/workflows/a11y.yml
- name: A11y tests
  run: pnpm test:run -- --grep "a11y"

- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v11
  with:
    urls: |
      http://localhost:5173/
      http://localhost:5173/login
    budgets: '[{"resourceSizes": [{"resourceType": "script", "budget": 200}]}]'
```

## Exercice

→ `exercices/16-a11y-audit/ENONCE.md`
