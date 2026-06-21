# 02 — Stratégies avancees d'internationalisation

> **L'i18n ne se limite pas a traduire des chaines de caracteres.**
> SEO, RTL, tests, extraction de chaines, performances — ce sont ces details qui font la différence entre un projet "traduit" et un projet "internationalise".

---

> **🔄 Rappel du cours précédent**
> Avant de continuer, vérifié que tu peux repondre a ces questions :
>
> 1. Quelle option faut-il activer pour utiliser vue-i18n en Composition API ?
> 2. Comment géré-t-on la pluralisation dans vue-i18n ?
> 3. Quelles fonctions utilise-t-on pour formater les dates et les nombres ?
>
> <details>
> <summary>Verifier mes reponses</summary>
>
> 1. `legacy: false` dans `createI18n()`
> 2. Avec le separateur `|` dans la chaine de traduction : `"zero | un | plusieurs"`
> 3. `d()` pour les dates, `n()` pour les nombres
> </details>

---

## 🔍 SEO et i18n

### L'attribut `lang` sur `<html>`

Les moteurs de recherche et les lecteurs d'ecran utilisent l'attribut `lang` pour déterminer la langue de la page.

```ts
// composables/useLocale.ts
import { watch } from "vue";
import { useI18n } from "vue-i18n";

export function useLocale() {
  const { locale } = useI18n();

  watch(
    locale,
    (newLocale) => {
      // ✅ Synchroniser la langue du document HTML
      document.documentElement.setAttribute("lang", newLocale);
    },
    { immediate: true },
  );

  return { locale };
}
```

### Les balises `hreflang`

Pour le SEO multilingue, il faut indiquer aux moteurs de recherche que la même page existe dans plusieurs langues.

```vue
<script setup lang="ts">
import { useHead } from "@vueuse/head";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

const { locale, availableLocales } = useI18n();
const route = useRoute();
const baseUrl = "https://mon-site.com";

// Generer les balises hreflang pour chaque langue disponible
useHead({
  htmlAttrs: {
    lang: locale.value,
  },
  link: availableLocales.map((lang) => ({
    rel: "alternate",
    hreflang: lang,
    href: `${baseUrl}/${lang}${route.path}`,
  })),
});
</script>
```

**Résultat HTML :**

```html
<html lang="fr">
  <head>
    <link
      rel="alternate"
      hreflang="fr"
      href="https://mon-site.com/fr/products"
    />
    <link
      rel="alternate"
      hreflang="en"
      href="https://mon-site.com/en/products"
    />
  </head>
</html>
```

### Stratégies de routage i18n

| Stratégie        | URL                                   | Avantage                  | Inconvenient                  |
| ---------------- | ------------------------------------- | ------------------------- | ----------------------------- |
| **Prefixe**      | `/fr/produits`, `/en/products`        | SEO optimal, bookmarkable | Plus complexe a configurer    |
| **Sous-domaine** | `fr.site.com`, `en.site.com`          | Separation claire         | Infrastructure plus lourde    |
| **Sans prefixe** | `/produits` (langue en cookie/header) | URL plus simple           | Mauvais SEO, pas bookmarkable |
| **Paramètre**    | `/produits?lang=en`                   | Simple                    | Mauvais SEO                   |

> 💡 **Recommandation** : utilise la stratégie **prefixe** pour les sites publics (SEO) et **sans prefixe** pour les applications internes.

### Vue Router avec prefixe de langue

```ts
// router/index.ts
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { i18n, loadLocaleMessages } from "@/plugins/i18n";

const SUPPORTED_LOCALES = ["fr", "en"] as const;

const routes: RouteRecordRaw[] = [
  {
    path: "/:locale(fr|en)",
    children: [
      { path: "", name: "home", component: () => import("@/views/Home.vue") },
      {
        path: "products",
        name: "products",
        component: () => import("@/views/Products.vue"),
      },
      {
        path: "contact",
        name: "contact",
        component: () => import("@/views/Contact.vue"),
      },
    ],
  },
  {
    // Rediriger la racine vers la locale par defaut
    path: "/",
    redirect: () => `/${i18n.global.locale.value}`,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Guard : charger les traductions avant chaque navigation
router.beforeEach(async (to) => {
  const locale = to.params.locale as string;

  if (
    !SUPPORTED_LOCALES.includes(locale as (typeof SUPPORTED_LOCALES)[number])
  ) {
    return `/${i18n.global.locale.value}${to.path}`;
  }

  await loadLocaleMessages(locale);
  i18n.global.locale.value = locale;
  document.documentElement.setAttribute("lang", locale);
});

export default router;
```

---

## 🔄 Support RTL (Right-to-Left)

Certaines langues (arabe, hebreu, persan) s'ecrivent de droite a gauche. Ton application doit s'adapter.

```ts
// composables/useDirection.ts
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const RTL_LOCALES = ["ar", "he", "fa"] as const;

export function useDirection() {
  const { locale } = useI18n();

  const direction = computed(() => {
    return RTL_LOCALES.includes(locale.value as (typeof RTL_LOCALES)[number])
      ? "rtl"
      : "ltr";
  });

  const isRtl = computed(() => direction.value === "rtl");

  return { direction, isRtl };
}
```

```vue
<script setup lang="ts">
import { useDirection } from "@/composables/useDirection";

const { direction } = useDirection();
</script>

<template>
  <!-- La direction est appliquee au conteneur principal -->
  <div :dir="direction">
    <slot />
  </div>
</template>

<style scoped>
/* Utiliser les proprietes logiques CSS au lieu de left/right */
.sidebar {
  /* ❌ Ne fonctionne pas en RTL */
  /* margin-left: 1rem; */

  /* ✅ Fonctionne en LTR et RTL */
  margin-inline-start: 1rem;
}

.header {
  /* ❌ */
  /* padding-left: 2rem;
  padding-right: 1rem; */

  /* ✅ */
  padding-inline-start: 2rem;
  padding-inline-end: 1rem;
}

.icon-arrow {
  /* En RTL, inverser les icones directionnelles */
  [dir="rtl"] & {
    transform: scaleX(-1);
  }
}
</style>
```

### Proprietes logiques CSS — Aide-mémoire

| Propriété physique | Propriété logique       | Comportement RTL        |
| ------------------ | ----------------------- | ----------------------- |
| `margin-left`      | `margin-inline-start`   | Devient `margin-right`  |
| `margin-right`     | `margin-inline-end`     | Devient `margin-left`   |
| `padding-left`     | `padding-inline-start`  | Devient `padding-right` |
| `text-align: left` | `text-align: start`     | Devient `right`         |
| `float: left`      | `float: inline-start`   | Devient `right`         |
| `left: 0`          | `inset-inline-start: 0` | Devient `right: 0`      |

---

## 🧩 Traductions par composant

Pour les gros projets, on peut définir des traductions au niveau du composant plutot qu'en global.

```vue
<script setup lang="ts">
import { useI18n } from "vue-i18n";

// Les traductions locales au composant
const { t } = useI18n({
  messages: {
    fr: {
      title: "Formulaire de contact",
      name: "Votre nom",
      email: "Votre email",
      submit: "Envoyer le message",
    },
    en: {
      title: "Contact Form",
      name: "Your name",
      email: "Your email",
      submit: "Send message",
    },
  },
});
</script>

<template>
  <form @submit.prevent>
    <h2>{{ t("title") }}</h2>
    <label>
      {{ t("name") }}
      <input type="text" />
    </label>
    <label>
      {{ t("email") }}
      <input type="email" />
    </label>
    <button type="submit">{{ t("submit") }}</button>
  </form>
</template>
```

> **Avantage** : la traduction est collocated avec le composant, plus facile a maintenir.
> **Inconvenient** : pas réutilisable, pas extractible facilement par les outils.

---

## 🔑 Typage des clés i18n

En TypeScript strict, on peut typer les clés de traduction pour éviter les erreurs.

```ts
// types/i18n.d.ts
// Declarer le type des messages pour chaque locale

import fr from "@/locales/fr.json";

type MessageSchema = typeof fr;

// Augmenter le module vue-i18n
declare module "vue-i18n" {
  export interface DefineLocaleMessage extends MessageSchema {}
}
```

Avec cette declaration, `t('cle.inexistante')` produit une erreur TypeScript.

```vue
<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();

// ✅ TypeScript valide la cle
t("nav.home");

// ❌ Erreur TS : la cle n'existe pas
// t('nav.inexistant')
</script>
```

---

## 🧪 Tester l'internationalisation

### Test unitaire avec Vitest

```ts
// tests/i18n/ProductCard.spec.ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import ProductCard from "@/components/ProductCard.vue";

function createTestI18n(locale = "fr") {
  return createI18n({
    legacy: false,
    locale,
    messages: {
      fr: {
        product: {
          addToCart: "Ajouter au panier",
          price: "Prix",
          outOfStock: "Rupture de stock",
        },
      },
      en: {
        product: {
          addToCart: "Add to cart",
          price: "Price",
          outOfStock: "Out of stock",
        },
      },
    },
  });
}

describe("ProductCard", () => {
  it("affiche les labels en francais", () => {
    const wrapper = mount(ProductCard, {
      global: {
        plugins: [createTestI18n("fr")],
      },
      props: {
        name: "T-shirt",
        price: 29.99,
        inStock: true,
      },
    });

    expect(wrapper.text()).toContain("Ajouter au panier");
    expect(wrapper.text()).toContain("Prix");
  });

  it("affiche les labels en anglais", () => {
    const wrapper = mount(ProductCard, {
      global: {
        plugins: [createTestI18n("en")],
      },
      props: {
        name: "T-shirt",
        price: 29.99,
        inStock: false,
      },
    });

    expect(wrapper.text()).toContain("Out of stock");
  });
});
```

### Test E2E avec Playwright

```ts
// e2e/i18n.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Internationalisation", () => {
  test("change de langue via le selecteur", async ({ page }) => {
    await page.goto("/");

    // Verifier que la page est en francais par defaut
    await expect(page.locator("nav")).toContainText("Accueil");

    // Changer la langue en anglais
    await page.selectOption('[data-testid="locale-select"]', "en");

    // Verifier que la navigation est maintenant en anglais
    await expect(page.locator("nav")).toContainText("Home");
  });

  test("persiste la langue entre les visites", async ({ page }) => {
    await page.goto("/");

    // Changer en anglais
    await page.selectOption('[data-testid="locale-select"]', "en");
    await expect(page.locator("nav")).toContainText("Home");

    // Recharger la page
    await page.reload();

    // La langue doit etre conservee
    await expect(page.locator("nav")).toContainText("Home");
  });

  test("le formatage des prix respecte la locale", async ({ page }) => {
    await page.goto("/products");

    // En francais : format "XX,XX €"
    await expect(page.locator('[data-testid="price"]').first()).toHaveText(
      /\d+,\d{2}\s€/,
    );

    // Passer en anglais
    await page.selectOption('[data-testid="locale-select"]', "en");

    // En anglais : format "$XX.XX"
    await expect(page.locator('[data-testid="price"]').first()).toHaveText(
      /\$[\d,]+\.\d{2}/,
    );
  });
});
```

---

## 📝 Extraire les chaines d'un projet existant

Quand tu internationalises un projet existant, il faut trouver et extraire toutes les chaines en dur.

### Méthode manuelle (petits projets)

1. Chercher toutes les chaines dans les templates :

```bash
# Trouver les textes en dur dans les templates Vue
# Chercher les contenus entre > et < qui contiennent des lettres
rg '>[A-Za-zÀ-ÿ].*</' --type vue
```

2. Remplacer chaque chaine par `t('cle')` et ajouter la clé dans les fichiers de traduction.

### Convention de nommage des clés

| Pattern                | Exemple                                   | Utilisation                   |
| ---------------------- | ----------------------------------------- | ----------------------------- |
| `page.section.element` | `home.hero.title`                         | Cle spécifique à une page     |
| `component.element`    | `productCard.addToCart`                   | Cle spécifique à un composant |
| `common.action`        | `common.save`, `common.cancel`            | Cles réutilisables partout    |
| `validation.rule`      | `validation.required`, `validation.email` | Messages de validation        |
| `error.code`           | `error.notFound`, `error.unauthorized`    | Messages d'erreur             |

### Structure de fichiers recommandee

```
locales/
  fr/
    common.json       # Cles partagees (boutons, labels generiques)
    validation.json   # Messages de validation
    home.json         # Page d'accueil
    products.json     # Page produits
  en/
    common.json
    validation.json
    home.json
    products.json
```

```ts
// plugins/i18n.ts — charger les fichiers fractionnes
import { createI18n } from "vue-i18n";
import frCommon from "@/locales/fr/common.json";
import frValidation from "@/locales/fr/validation.json";
import frHome from "@/locales/fr/home.json";

const fr = {
  common: frCommon,
  validation: frValidation,
  home: frHome,
};

export const i18n = createI18n({
  legacy: false,
  locale: "fr",
  fallbackLocale: "fr",
  messages: { fr },
});
```

---

## 🎨 Composant `<i18n-t>` — Interpolation de composants

Parfois, une traduction contient un **composant Vue** (lien, texte en gras, etc.). Le composant `<i18n-t>` permet d'inserer des composants dans les traductions.

```ts
const messages = {
  fr: {
    // {link} sera remplace par un composant Vue
    terms: "En cliquant, vous acceptez nos {link}.",
  },
  en: {
    terms: "By clicking, you agree to our {link}.",
  },
};
```

```vue
<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <p>
    <i18n-t keypath="terms" tag="span">
      <template #link>
        <a href="/cgu">conditions generales</a>
      </template>
    </i18n-t>
  </p>
  <!-- Resultat : "En cliquant, vous acceptez nos <a href="/cgu">conditions generales</a>." -->
</template>
```

---

## 🎯 Pratique

### Exercice I18N-ADV.1 — SEO multilingue

Ajoute les balises `hreflang` a ton application pour 3 langues (FR, EN, ES) :

```vue
<script setup lang="ts">
// ???
</script>
```

<details>
<summary>Solution</summary>

```vue
<script setup lang="ts">
import { useHead } from "@vueuse/head";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

const { locale } = useI18n();
const route = useRoute();
const baseUrl = "https://mon-site.com";

useHead({
  htmlAttrs: { lang: locale.value },
  link: ["fr", "en", "es"].map((lang) => ({
    rel: "alternate",
    hreflang: lang,
    href: `${baseUrl}/${lang}${route.path}`,
  })),
});
</script>
```

</details>

---

### Exercice I18N-ADV.2 — Composable useLocale

Cree un composable `useLocale` qui :

1. Detecte la langue du navigateur au premier chargement
2. Persiste le choix en `localStorage`
3. Synchronise `document.documentElement.lang`

```ts
// composables/useLocale.ts
export function useLocale() {
  // ???
}
```

<details>
<summary>Solution</summary>

```ts
import { watch } from "vue";
import { useI18n } from "vue-i18n";

const STORAGE_KEY = "app-locale";
const SUPPORTED = ["fr", "en", "es"] as const;
type Locale = (typeof SUPPORTED)[number];

function isSupported(v: string): v is Locale {
  return SUPPORTED.includes(v as Locale);
}

function detectLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && isSupported(stored)) return stored;

  const browser = navigator.language.split("-")[0];
  if (isSupported(browser)) return browser;

  return "fr";
}

export function useLocale() {
  const { locale } = useI18n();

  locale.value = detectLocale();

  watch(
    locale,
    (val) => {
      localStorage.setItem(STORAGE_KEY, val);
      document.documentElement.setAttribute("lang", val);
    },
    { immediate: true },
  );

  function setLocale(lang: string): void {
    if (isSupported(lang)) locale.value = lang;
  }

  return { locale, setLocale, supportedLocales: SUPPORTED };
}
```

</details>

---

### Exercice I18N-ADV.3 — Tester le switch de langue

Ecris un test Vitest qui vérifié que le composant affiche le bon texte en français et en anglais :

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
// ???

describe("Switch de langue", () => {
  it("affiche le texte dans la bonne langue", () => {
    // ???
  });
});
```

<details>
<summary>Solution</summary>

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import { defineComponent } from "vue";
import { useI18n } from "vue-i18n";

const TestComponent = defineComponent({
  setup() {
    const { t } = useI18n();
    return { t };
  },
  template: '<p>{{ t("hello") }}</p>',
});

function makeI18n(locale: string) {
  return createI18n({
    legacy: false,
    locale,
    messages: {
      fr: { hello: "Bonjour" },
      en: { hello: "Hello" },
    },
  });
}

describe("Switch de langue", () => {
  it('affiche "Bonjour" en francais', () => {
    const wrapper = mount(TestComponent, {
      global: { plugins: [makeI18n("fr")] },
    });
    expect(wrapper.text()).toBe("Bonjour");
  });

  it('affiche "Hello" en anglais', () => {
    const wrapper = mount(TestComponent, {
      global: { plugins: [makeI18n("en")] },
    });
    expect(wrapper.text()).toBe("Hello");
  });
});
```

</details>

---

## Exercice

→ `exercices/25-i18n-multi-locale/ENONCE.md`

## Suite

→ `cours/11-auth-securite/01-authentification.md`

---

<!-- parcours-recommande -->

::: tip Parcours recommandé

1. **Exercice** : [25-i18n-multi-locale](../../exercices/25-i18n-multi-locale/ENONCE)
   :::
