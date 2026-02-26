# 01 — Internationalisation avec vue-i18n

## Pourquoi l'i18n en ESN ?

La majorite des projets ESN ciblent plusieurs marches. L'internationalisation (i18n) est rarement optionnelle :

- Sites multi-pays (FR, EN, DE, ES…)
- Applications internes multilingues
- Conformite legale (mentions dans la langue locale)

## Setup vue-i18n

```bash
pnpm add vue-i18n@next
```

```ts
// plugins/i18n.ts
import { createI18n } from "vue-i18n";

const messages = {
  fr: {
    nav: {
      home: "Accueil",
      products: "Produits",
      contact: "Contact",
    },
    common: {
      loading: "Chargement...",
      error: "Une erreur est survenue",
      save: "Enregistrer",
      cancel: "Annuler",
      delete: "Supprimer",
      confirm: "Confirmer",
    },
    product: {
      title: "Catalogue produits",
      price: "Prix : {price} €",
      stock: "En stock : {count} unité | En stock : {count} unités",
      addToCart: "Ajouter au panier",
      outOfStock: "Rupture de stock",
    },
  },
  en: {
    nav: {
      home: "Home",
      products: "Products",
      contact: "Contact",
    },
    common: {
      loading: "Loading...",
      error: "An error occurred",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      confirm: "Confirm",
    },
    product: {
      title: "Product catalog",
      price: "Price: {price} €",
      stock: "In stock: {count} unit | In stock: {count} units",
      addToCart: "Add to cart",
      outOfStock: "Out of stock",
    },
  },
};

export const i18n = createI18n({
  legacy: false, // Composition API mode
  locale: "fr",
  fallbackLocale: "en",
  messages,
});
```

```ts
// main.ts
import { i18n } from "./plugins/i18n";

const app = createApp(App);
app.use(i18n);
app.mount("#app");
```

## Utilisation basique

```vue
<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();

function switchLocale(lang: string): void {
  locale.value = lang;
}
</script>

<template>
  <h1>{{ t("product.title") }}</h1>
  <p>{{ t("product.price", { price: 29.99 }) }}</p>

  <select v-model="locale">
    <option value="fr">Français</option>
    <option value="en">English</option>
  </select>
</template>
```

## Interpolation et formatage

```ts
// messages fr
{
  welcome: "Bienvenue, {name} !",
  date: "Ajouté le {date}",
  html: "Acceptez les <a href='/cgu'>conditions</a>"
}
```

```vue
<template>
  <!-- Interpolation simple -->
  <p>{{ t("welcome", { name: user.name }) }}</p>

  <!-- Date avec formatage -->
  <p>{{ t("date", { date: d(new Date(), "short") }) }}</p>

  <!-- HTML (⚠️ attention XSS) -->
  <p v-html="t('html')"></p>
</template>
```

## Pluralisation

```ts
// messages fr
{
  items: "Aucun élément | {count} élément | {count} éléments";
  // pipe = 0 | 1 | 2+
}
```

```vue
<template>
  <p>{{ t("items", { count: 0 }) }}</p>
  <!-- Aucun élément -->
  <p>{{ t("items", { count: 1 }) }}</p>
  <!-- 1 élément -->
  <p>{{ t("items", { count: 42 }) }}</p>
  <!-- 42 éléments -->
</template>
```

## Typage strict des clés

```ts
// types/i18n.d.ts
import fr from "@/locales/fr.json";

type MessageSchema = typeof fr;

declare module "vue-i18n" {
  export interface DefineLocaleMessage extends MessageSchema {}
}
```

Avec ce typage, `t('cle.inexistante')` provoque une erreur TypeScript.

## Composable `useLocale`

```ts
// composables/useLocale.ts
import { useI18n } from "vue-i18n";
import { watch } from "vue";

interface UseLocaleReturn {
  locale: ReturnType<typeof useI18n>["locale"];
  availableLocales: string[];
  switchLocale: (lang: string) => void;
}

export function useLocale(): UseLocaleReturn {
  const { locale, availableLocales } = useI18n();

  function switchLocale(lang: string): void {
    if (availableLocales.includes(lang)) {
      locale.value = lang;
      document.documentElement.lang = lang;
      localStorage.setItem("locale", lang);
    }
  }

  // Restaurer la locale sauvegardée
  const saved = localStorage.getItem("locale");
  if (saved && availableLocales.includes(saved)) {
    locale.value = saved;
  }

  // Sync l'attribut lang du HTML
  watch(locale, (lang) => {
    document.documentElement.lang = lang;
  });

  return { locale, availableLocales, switchLocale };
}
```

## Dates et nombres

```ts
// Configuration des formats
export const i18n = createI18n({
  legacy: false,
  locale: "fr",
  numberFormats: {
    fr: {
      currency: { style: "currency", currency: "EUR" },
      percent: { style: "percent", minimumFractionDigits: 1 },
    },
    en: {
      currency: { style: "currency", currency: "USD" },
      percent: { style: "percent", minimumFractionDigits: 1 },
    },
  },
  datetimeFormats: {
    fr: {
      short: { day: "numeric", month: "short", year: "numeric" },
      long: {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    },
    en: {
      short: { month: "short", day: "numeric", year: "numeric" },
      long: {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    },
  },
});
```

```vue
<template>
  <p>{{ n(1234.56, "currency") }}</p>
  <!-- 1 234,56 € (fr) / $1,234.56 (en) -->
  <p>{{ d(new Date(), "long") }}</p>
  <!-- 26 février 2026 à 14:30 (fr) -->
</template>
```

## En contexte ESN

| Situation                  | Approche                               |
| -------------------------- | -------------------------------------- |
| Petit projet (2-3 langues) | Fichiers JSON inline                   |
| Gros projet (10+ langues)  | Lazy loading par locale                |
| Design system partagé      | Chaque composant exporte ses clés i18n |
| CMS avec contenu traduit   | API + locale dans les headers          |
| SEO multi-langue (Nuxt)    | `@nuxtjs/i18n` + routes localisées     |

## Suite

→ `cours/10-i18n/02-strategies-avancees.md`
