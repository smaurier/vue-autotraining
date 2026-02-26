# 02 — Stratégies i18n avancées

## Lazy loading des traductions

Pour les gros projets, charger toutes les traductions au démarrage est coûteux.

```ts
// plugins/i18n.ts
import { createI18n } from "vue-i18n";
import fr from "@/locales/fr.json"; // Langue par défaut chargée immédiatement

export const i18n = createI18n({
  legacy: false,
  locale: "fr",
  fallbackLocale: "fr",
  messages: { fr },
});

// Charge une locale à la demande
const loadedLocales = new Set<string>(["fr"]);

export async function loadLocale(lang: string): Promise<void> {
  if (loadedLocales.has(lang)) return;

  const messages = await import(`@/locales/${lang}.json`);
  i18n.global.setLocaleMessage(lang, messages.default);
  loadedLocales.add(lang);
}
```

```ts
// composables/useLocale.ts
import { loadLocale } from "@/plugins/i18n";

export function useLocale() {
  const { locale } = useI18n();

  async function switchLocale(lang: string): Promise<void> {
    await loadLocale(lang); // Charge le JSON si pas déjà fait
    locale.value = lang;
    document.documentElement.lang = lang;
    localStorage.setItem("locale", lang);
  }

  return { locale, switchLocale };
}
```

## Organisation des fichiers

### Par langue (simple)

```
locales/
  fr.json
  en.json
  de.json
```

### Par feature (scalable)

```
locales/
  fr/
    common.json
    products.json
    checkout.json
    admin.json
  en/
    common.json
    products.json
    checkout.json
    admin.json
```

```ts
// Merge automatique des fichiers par feature
async function loadLocaleModules(
  lang: string,
): Promise<Record<string, string>> {
  const modules = import.meta.glob(`@/locales/${lang}/*.json`);
  const merged: Record<string, unknown> = {};

  for (const [path, loader] of Object.entries(modules)) {
    const mod = (await loader()) as { default: Record<string, unknown> };
    const namespace = path.split("/").pop()?.replace(".json", "") ?? "";
    merged[namespace] = mod.default;
  }

  return merged as Record<string, string>;
}
```

## Composant i18n-t (interpolation avancée)

Quand tu as besoin d'injecter des composants Vue dans une traduction :

```ts
// messages
{
  tos: "En continuant, vous acceptez les {tos} et la {privacy}.";
}
```

```vue
<template>
  <i18n-t keypath="tos" tag="p">
    <template #tos>
      <a href="/tos">{{ t("links.tos") }}</a>
    </template>
    <template #privacy>
      <a href="/privacy">{{ t("links.privacy") }}</a>
    </template>
  </i18n-t>
</template>
```

**Avantage** : pas besoin de `v-html` (pas de risque XSS).

## RTL (Right-to-Left)

Pour les langues arabes, hébraïques, etc. :

```ts
// composables/useLocale.ts
const RTL_LOCALES = new Set(["ar", "he", "fa"]);

watch(locale, (lang) => {
  document.documentElement.dir = RTL_LOCALES.has(lang) ? "rtl" : "ltr";
  document.documentElement.lang = lang;
});
```

```css
/* CSS adaptatif RTL */
.sidebar {
  margin-inline-start: 0;
  margin-inline-end: 16px;
}

/* Utiliser les propriétés logiques CSS */
.card {
  padding-inline: 16px; /* s'adapte auto en RTL */
  text-align: start; /* au lieu de "left" */
}
```

## i18n et Nuxt 3

```bash
pnpm add @nuxtjs/i18n
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@nuxtjs/i18n"],
  i18n: {
    locales: [
      { code: "fr", file: "fr.json", name: "Français" },
      { code: "en", file: "en.json", name: "English" },
    ],
    defaultLocale: "fr",
    lazy: true,
    langDir: "locales/",
    strategy: "prefix_except_default",
    // /about (fr) vs /en/about (en)
  },
});
```

Routes générées automatiquement :

```
/           → page d'accueil (fr, défaut)
/en         → page d'accueil (en)
/produits   → page produits (fr)
/en/products → page produits (en)
```

## Tests i18n

```ts
// Tester un composant avec i18n
import { mount } from "@vue/test-utils";
import { createI18n } from "vue-i18n";

function mountWithI18n(component: Component, locale = "fr") {
  const i18n = createI18n({
    legacy: false,
    locale,
    messages: {
      fr: { greeting: "Bonjour" },
      en: { greeting: "Hello" },
    },
  });

  return mount(component, {
    global: { plugins: [i18n] },
  });
}

it("affiche le texte en français", () => {
  const wrapper = mountWithI18n(MyComponent, "fr");
  expect(wrapper.text()).toContain("Bonjour");
});

it("affiche le texte en anglais", () => {
  const wrapper = mountWithI18n(MyComponent, "en");
  expect(wrapper.text()).toContain("Hello");
});
```

## Checklist i18n ESN

- [ ] Aucune chaîne en dur dans les templates
- [ ] Clés organisées par feature / namespace
- [ ] Pluralisation gérée (`|` syntax)
- [ ] Dates et nombres formatés via `d()` et `n()`
- [ ] Lazy loading si plus de 3 locales
- [ ] Locale persistée (localStorage ou cookie)
- [ ] `lang` et `dir` sur `<html>` synchronisés
- [ ] Tests avec locale paramétrée

## Suite

→ `cours/11-auth-securite/01-authentification.md`
