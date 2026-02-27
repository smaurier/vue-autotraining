# 02 — Stratégies i18n avancées

> Ce chapitre approfondit les techniques vues dans le fichier précédent. Si vous n'avez pas lu le chapitre 01 (vue-i18n), commencez par là !

---

> **🔄 Rappel du cours précédent**
> Avant de continuer, vérifie que tu peux répondre à ces questions :
> 1. Quelle fonction utilise-t-on pour afficher un texte traduit dans le template ?
> 2. Comment gère-t-on la pluralisation avec vue-i18n ?
> 
> <details>
> <summary>Vérifier mes réponses</summary>
>
> 1. `$t('cle.traduction')` dans le template ou `t('cle')` avec `useI18n()` dans le script
> 2. Avec le pipe `|` dans les traductions : `"item": "0 items | 1 item | {count} items"`
> </details>

---

## Lazy loading des traductions (chargement à la demande)

### C'est quoi le problème ?

Imaginez que votre application supporte **10 langues**. Si vous chargez **toutes** les traductions au démarrage, l'utilisateur télécharge les 10 fichiers… alors qu'il n'en utilise qu'**un seul** !

> 🍽️ **Analogie** : C'est comme si le restaurant vous donnait les menus dans les 10 langues en même temps. Vous n'avez besoin que du menu en français ! Les autres sont du poids inutile.

### La solution : le lazy loading

Le **lazy loading** (chargement paresseux) signifie : on charge **seulement** la langue dont on a besoin, **au moment où on en a besoin**.

- Au démarrage → on charge le français (langue par défaut)
- L'utilisateur clique sur "English" → on charge l'anglais **à ce moment-là**
- L'utilisateur clique sur "Deutsch" → on charge l'allemand **à ce moment-là**

### Comment faire ?

```ts
// plugins/i18n.ts
// Configuration du système i18n avec lazy loading

import { createI18n } from "vue-i18n";
import fr from "@/locales/fr.json";
// On importe SEULEMENT le français au démarrage
// Les autres langues seront chargées plus tard si besoin

export const i18n = createI18n({
  legacy: false,           // Mode moderne (Composition API)
  locale: "fr",            // Langue par défaut
  fallbackLocale: "fr",    // Langue de secours
  messages: { fr },        // On ne fournit QUE le français pour commencer
});

// On garde en mémoire quelles langues ont déjà été chargées
// Set = une liste sans doublons (comme un ensemble en maths)
const loadedLocales = new Set<string>(["fr"]);
// "fr" est déjà chargé, on l'ajoute d'entrée

// Cette fonction charge une langue à la demande
export async function loadLocale(lang: string): Promise<void> {
  // Si la langue est déjà chargée, on ne fait rien (pas de téléchargement inutile !)
  if (loadedLocales.has(lang)) return;

  // import() dynamique : charge le fichier JSON de la langue demandée
  // C'est comme aller chercher le menu anglais dans le tiroir seulement quand un client le demande
  const messages = await import(`@/locales/${lang}.json`);

  // On injecte les traductions dans le système i18n
  i18n.global.setLocaleMessage(lang, messages.default);

  // On note que cette langue est maintenant chargée (pour ne pas la recharger)
  loadedLocales.add(lang);
}
```

> 📝 **Rappel** : `async / await` permet d'attendre qu'une opération lente (comme télécharger un fichier) soit terminée avant de continuer. `await import(...)` dit : "va chercher ce fichier et attends qu'il soit arrivé".

### Utiliser le lazy loading dans un composable

```ts
// composables/useLocale.ts
// On améliore notre composable useLocale pour intégrer le lazy loading

import { useI18n } from "vue-i18n";
import { loadLocale } from "@/plugins/i18n";

export function useLocale() {
  const { locale } = useI18n();
  // locale = la langue active (un ref Vue, modifiable)

  // Changer de langue avec chargement automatique
  async function switchLocale(lang: string): Promise<void> {
    await loadLocale(lang);
    // D'abord : on charge le fichier de traductions (si pas déjà fait)
    // await = on attend que le chargement soit fini

    locale.value = lang;
    // Ensuite : on change la langue active
    // Tous les textes se mettent à jour !

    document.documentElement.lang = lang;
    // On met à jour l'attribut lang="..." de la balise <html>

    localStorage.setItem("locale", lang);
    // On sauvegarde le choix pour la prochaine visite
  }

  return { locale, switchLocale };
}
```

---

## Organiser ses fichiers de traduction

Quand votre application grandit, il faut **bien organiser** les fichiers de traduction pour s'y retrouver. Il y a deux approches :

### Approche 1 : Un fichier par langue (simple, bon pour les petits projets)

```
locales/
  fr.json      ← Toutes les traductions françaises dans UN fichier
  en.json      ← Toutes les traductions anglaises dans UN fichier
  de.json      ← Toutes les traductions allemandes dans UN fichier
```

> 👍 Simple à comprendre
> 👎 Le fichier devient énorme quand l'app grandit

### Approche 2 : Par fonctionnalité (scalable, bon pour les gros projets)

```
locales/
  fr/
    common.json       ← Textes communs (boutons, messages d'erreur...)
    products.json     ← Textes de la page produits
    checkout.json     ← Textes du panier / paiement
    admin.json        ← Textes de l'espace admin
  en/
    common.json       ← Mêmes fichiers, mais en anglais
    products.json
    checkout.json
    admin.json
```

> 👍 Chaque fichier reste petit et facile à maintenir
> 👎 Un peu plus complexe à mettre en place

> 🍽️ **Analogie** : C'est la différence entre un **gros menu unique** (approche 1) et un menu séparé en **entrées / plats / desserts / boissons** (approche 2). Quand le restaurant a 200 plats, le menu séparé est bien plus pratique !

### (Avancé) Charger automatiquement les fichiers par fonctionnalité

```ts
// Cette fonction charge et fusionne tous les fichiers JSON d'une langue
async function loadLocaleModules(
  lang: string
): Promise<Record<string, string>> {

  // import.meta.glob charge tous les fichiers qui correspondent au motif
  // C'est comme dire "prends tous les .json dans le dossier de cette langue"
  const modules = import.meta.glob(`@/locales/${lang}/*.json`);

  const merged: Record<string, unknown> = {};
  // Un objet vide qu'on va remplir progressivement

  // On parcourt chaque fichier trouvé
  for (const [path, loader] of Object.entries(modules)) {
    // path = le chemin du fichier (ex: "/locales/fr/products.json")
    // loader = une fonction qui charge le contenu du fichier

    const mod = (await loader()) as { default: Record<string, unknown> };
    // On charge le contenu du fichier JSON

    const namespace = path.split("/").pop()?.replace(".json", "") ?? "";
    // On extrait le nom du fichier sans l'extension
    // "/locales/fr/products.json" → "products"

    merged[namespace] = mod.default;
    // On range le contenu sous la clé "products", "common", etc.
  }

  return merged as Record<string, string>;
  // Résultat : { common: {...}, products: {...}, checkout: {...} }
}
```

---

## Le composant `<i18n-t>` : insérer des liens et composants dans les traductions

### Le problème

Parfois, une traduction contient un **lien cliquable** ou un **composant Vue**. Par exemple :

> "En continuant, vous acceptez les **conditions d'utilisation** et la **politique de confidentialité**."

Les mots en gras doivent être des **liens**. Comment faire ?

### ❌ La mauvaise solution : `v-html`

On pourrait mettre du HTML dans la traduction… mais c'est **dangereux** (risque de faille XSS = un pirate peut injecter du code malveillant).

### ✅ La bonne solution : `<i18n-t>`

Le composant `<i18n-t>` permet d'insérer des éléments Vue (liens, boutons, etc.) à l'intérieur d'une traduction, **en toute sécurité**.

```ts
// Dans le dictionnaire de traductions
{
  tos: "En continuant, vous acceptez les {tos} et la {privacy}."
  // {tos} et {privacy} sont des "emplacements" (slots) qu'on va remplir avec des composants
}
```

```vue
<template>
  <!-- i18n-t = le composant spécial pour les traductions avec des slots -->
  <!-- keypath = la clé de traduction à utiliser -->
  <!-- tag="p" = on veut que le résultat soit dans une balise <p> -->
  <i18n-t keypath="tos" tag="p">

    <!-- #tos = on remplit l'emplacement {tos} avec ce contenu -->
    <template #tos>
      <a href="/tos">{{ t("links.tos") }}</a>
      <!-- Un vrai lien cliquable ! -->
    </template>

    <!-- #privacy = on remplit l'emplacement {privacy} avec ce contenu -->
    <template #privacy>
      <a href="/privacy">{{ t("links.privacy") }}</a>
    </template>

  </i18n-t>
  <!-- Résultat : "En continuant, vous acceptez les <a>CGU</a> et la <a>politique</a>." -->
  <!-- Avec de vrais liens cliquables, sans risque de sécurité ! -->
</template>
```

> 💡 **Avantage** : pas besoin de `v-html`, donc **aucun risque XSS**. C'est la méthode recommandée !

---

## RTL : les langues qui s'écrivent de droite à gauche

### C'est quoi le RTL ?

**RTL** = **R**ight **T**o **L**eft (droite à gauche).

Certaines langues s'écrivent **de droite à gauche** au lieu de gauche à droite :
- 🇸🇦 **Arabe** (ar)
- 🇮🇱 **Hébreu** (he)
- 🇮🇷 **Persan / Farsi** (fa)

Si votre application supporte ces langues, **toute la mise en page doit se "retourner"** comme dans un miroir : les menus passent à droite, le texte s'aligne à droite, etc.

### Comment gérer ça ?

```ts
// composables/useLocale.ts
// On définit la liste des langues RTL
const RTL_LOCALES = new Set(["ar", "he", "fa"]);
// Set = un ensemble (comme une liste sans doublons)

// On surveille les changements de langue
watch(locale, (lang) => {
  // Si la langue est dans la liste RTL → on passe en mode "rtl"
  // Sinon → on reste en mode "ltr" (left to right = gauche à droite)
  document.documentElement.dir = RTL_LOCALES.has(lang) ? "rtl" : "ltr";
  // Ça ajoute dir="rtl" ou dir="ltr" sur la balise <html>

  document.documentElement.lang = lang;
  // On met aussi à jour la langue
});
```

### CSS adapté pour RTL

Au lieu d'utiliser `left` et `right` dans votre CSS, utilisez les **propriétés logiques** qui s'adaptent automatiquement :

```css
/* ❌ AVANT : ça ne s'adapte PAS en RTL */
.sidebar {
  margin-left: 0;
  margin-right: 16px;
  text-align: left;
}

/* ✅ APRÈS : ça s'adapte AUTOMATIQUEMENT en RTL */
.sidebar {
  margin-inline-start: 0;
  /* "start" = gauche en LTR, droite en RTL */
  margin-inline-end: 16px;
  /* "end" = droite en LTR, gauche en RTL */
  text-align: start;
  /* "start" = aligné au début (gauche en FR, droite en arabe) */
}

.card {
  padding-inline: 16px;
  /* padding-inline = padding gauche ET droite, s'adapte auto en RTL */
}
```

> 💡 **Règle simple** : remplacez `left` par `start` et `right` par `end` dans votre CSS. Le navigateur fait le reste !

---

## (Avancé) i18n avec Nuxt 3

> ⚠️ Cette section est pour ceux qui utilisent **Nuxt** (un framework basé sur Vue). Si vous utilisez Vue "classique", vous pouvez la sauter.

Nuxt a un module officiel **@nuxtjs/i18n** qui ajoute des fonctionnalités puissantes automatiquement :

```bash
# Installation du module Nuxt i18n
pnpm add @nuxtjs/i18n
```

```ts
// nuxt.config.ts — Configuration de Nuxt

export default defineNuxtConfig({
  modules: ["@nuxtjs/i18n"],
  // On active le module i18n

  i18n: {
    locales: [
      // Liste des langues supportées
      { code: "fr", file: "fr.json", name: "Français" },
      { code: "en", file: "en.json", name: "English" },
    ],
    defaultLocale: "fr",      // Langue par défaut
    lazy: true,               // Lazy loading activé automatiquement !
    langDir: "locales/",      // Dossier contenant les fichiers JSON
    strategy: "prefix_except_default",
    // Cette stratégie ajoute un préfixe de langue dans l'URL
    // SAUF pour la langue par défaut (français)
  },
});
```

Nuxt génère automatiquement des **routes (URLs) par langue** :

```
/             → page d'accueil en français (pas de préfixe, c'est la langue par défaut)
/en           → page d'accueil en anglais
/produits     → page produits en français
/en/products  → page produits en anglais
```

> 💡 C'est super utile pour le **SEO** (référencement Google) : chaque langue a sa propre URL, et Google peut indexer chaque version séparément.

---

## (Avancé) Tester les traductions

> ⚠️ Cette section concerne les **tests automatisés**. Si vous débutez avec les tests, vous pouvez la lire rapidement et y revenir plus tard.

Quand on teste un composant qui utilise des traductions, il faut **fournir le système i18n** au composant pendant le test. Sinon, les appels à `t()` ne fonctionneront pas.

```ts
// Exemple de test avec i18n
import { mount } from "@vue/test-utils";
// mount = fonction qui "monte" (affiche) un composant dans un environnement de test
import { createI18n } from "vue-i18n";

// Fonction utilitaire : monte un composant AVEC le système i18n
function mountWithI18n(component: Component, locale = "fr") {
  // On crée un mini système i18n juste pour le test
  const i18n = createI18n({
    legacy: false,
    locale,
    // La langue à utiliser pour ce test
    messages: {
      fr: { greeting: "Bonjour" },
      en: { greeting: "Hello" },
      // On met juste les traductions dont on a besoin pour le test
    },
  });

  return mount(component, {
    global: { plugins: [i18n] },
    // On "branche" i18n sur le composant de test
  });
}

// Test 1 : vérifier que le texte s'affiche en français
it("affiche le texte en français", () => {
  const wrapper = mountWithI18n(MyComponent, "fr");
  // On monte le composant avec la locale "fr"
  expect(wrapper.text()).toContain("Bonjour");
  // On vérifie que "Bonjour" apparaît dans le texte du composant
});

// Test 2 : vérifier que le texte s'affiche en anglais
it("affiche le texte en anglais", () => {
  const wrapper = mountWithI18n(MyComponent, "en");
  // On monte le composant avec la locale "en"
  expect(wrapper.text()).toContain("Hello");
  // On vérifie que "Hello" apparaît dans le texte du composant
});
```

---

## Récapitulatif des stratégies

| Stratégie | Quand l'utiliser | Difficulté |
|---|---|---|
| Tout charger au démarrage | Petit projet, 2-3 langues | ⭐ Facile |
| Lazy loading | Plus de 3 langues | ⭐⭐ Moyen |
| Fichiers par fonctionnalité | Gros projet, beaucoup de textes | ⭐⭐ Moyen |
| `<i18n-t>` pour les liens | Traductions avec des liens/composants | ⭐⭐ Moyen |
| Support RTL | Langues arabes, hébraïques... | ⭐⭐⭐ Avancé |
| Nuxt i18n avec routes | Application Nuxt avec SEO multi-langue | ⭐⭐⭐ Avancé |

---

## Checklist i18n — Les bonnes pratiques

- [ ] ❌ Aucune chaîne de texte écrite "en dur" dans les templates (toujours utiliser `t()`)
- [ ] 📁 Traductions organisées par fonctionnalité (common, products, admin…)
- [ ] 🔢 Pluralisation gérée avec la syntaxe pipe `|`
- [ ] 📅 Dates formatées avec `d()` et nombres avec `n()`
- [ ] ⚡ Lazy loading activé si plus de 3 langues
- [ ] 💾 Choix de langue sauvegardé (localStorage)
- [ ] 🏷️ Attributs `lang` et `dir` sur `<html>` synchronisés avec la langue active
- [ ] 🧪 Tests écrits avec la locale paramétrée

---

## 🎯 Pratique

### Exercice I18N.5 — Lazy loading

Configure le chargement différé des locales :

```ts
// i18n.ts
export const loadLocaleMessages = async (locale: string) => {
  // Charge dynamiquement le fichier de traduction
  // ???
}
```

<details>
<summary>Solution</summary>

```ts
export const loadLocaleMessages = async (locale: string) => {
  const messages = await import(`./locales/${locale}.json`)
  i18n.global.setLocaleMessage(locale, messages.default)
  return messages
}
```
</details>

---

### Exercice I18N.6 — Composant i18n-t

Utilise `<i18n-t>` pour une traduction avec un lien :

```json
{ "terms": "En cliquant, vous acceptez nos {link}" }
```

```vue
<template>
  <!-- Affiche avec un lien cliquable sur "conditions" -->
  ???
</template>
```

<details>
<summary>Solution</summary>

```vue
<template>
  <i18n-t keypath="terms" tag="p">
    <template #link>
      <router-link to="/terms">conditions d'utilisation</router-link>
    </template>
  </i18n-t>
</template>
```
</details>

---

### Exercice I18N.7 — Formatage nombre et date

Formate un prix et une date :

```vue
<template>
  <p>Prix : ???</p>
  <p>Date de livraison : ???</p>
</template>

<script setup lang="ts">
const price = 1234.50
const deliveryDate = new Date('2024-12-25')
</script>
```

<details>
<summary>Solution</summary>

```vue
<template>
  <p>Prix : {{ n(price, 'currency') }}</p>
  <p>Date de livraison : {{ d(deliveryDate, 'long') }}</p>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { n, d } = useI18n()
const price = 1234.50
const deliveryDate = new Date('2024-12-25')
</script>
```

Avec config numberFormats/datetimeFormats :
- `n(1234.50, 'currency')` → "1 234,50 €"
- `d(date, 'long')` → "25 décembre 2024"
</details>

---

## Suite

→ `cours/11-auth-securite/01-authentification.md`
