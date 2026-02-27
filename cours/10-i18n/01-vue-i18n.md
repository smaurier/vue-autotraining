# 01 — Internationalisation avec vue-i18n

## C'est quoi l'internationalisation (i18n) ?

**L'internationalisation**, c'est le fait de rendre votre application disponible en **plusieurs langues**.

> 🤔 **Pourquoi "i18n" ?**
> Le mot "internationalization" en anglais commence par un **i**, se termine par un **n**, et il y a **18 lettres** entre les deux. Donc : **i + 18 + n = i18n**. C'est juste un raccourci pour ne pas écrire un mot très long !

### 🍽️ Analogie : le menu d'un restaurant touristique

Imaginez un restaurant dans une zone touristique. Les plats sont **exactement les mêmes** en cuisine, mais le menu est imprimé en **plusieurs langues** : français, anglais, allemand...

L'i18n dans une application, c'est **exactement pareil** :
- L'application (les plats) ne change pas
- Seuls les **textes affichés** (le menu) changent selon la langue choisie par l'utilisateur

### Pourquoi c'est important ?

- 🌍 Votre site est utilisé dans **plusieurs pays** (FR, EN, DE, ES…)
- 👥 Vos utilisateurs parlent **différentes langues**
- ⚖️ Parfois c'est **obligatoire légalement** (mentions légales dans la langue locale)

---

## Étape 1 : Installer vue-i18n

`vue-i18n` est la bibliothèque officielle pour gérer les traductions dans Vue.

```bash
# On installe la bibliothèque vue-i18n dans notre projet
pnpm add vue-i18n@next
```

> 📝 **Rappel** : `pnpm add` c'est comme aller chercher un outil dans un magasin et l'ajouter à votre boîte à outils (votre projet). Après cette commande, `vue-i18n` est disponible dans votre code.

---

## Étape 2 : Créer les fichiers de traduction

L'idée est simple : on crée un **gros objet** (un dictionnaire) qui contient **tous les textes** de notre application, organisés **par langue**.

```ts
// plugins/i18n.ts
// Ce fichier configure tout le système de traduction de notre app

import { createI18n } from "vue-i18n";
// On importe la fonction qui va créer notre système i18n

// Voici notre "dictionnaire" de traductions
// C'est un objet avec une clé par langue ("fr", "en"...)
const messages = {

  // === TRADUCTIONS FRANÇAISES ===
  fr: {
    // Les traductions sont organisées par "catégories" (comme des dossiers)
    nav: {
      // Catégorie "navigation" — les menus du site
      home: "Accueil",        // La clé "nav.home" affichera "Accueil" en français
      products: "Produits",   // La clé "nav.products" affichera "Produits"
      contact: "Contact",     // La clé "nav.contact" affichera "Contact"
    },
    common: {
      // Catégorie "commun" — les textes qu'on retrouve partout
      loading: "Chargement...",
      error: "Une erreur est survenue",
      save: "Enregistrer",
      cancel: "Annuler",
    },
    product: {
      // Catégorie "produit" — les textes de la page produits
      title: "Catalogue produits",
      price: "Prix : {price} €",
      // {price} est un "trou" qui sera rempli dynamiquement (on verra plus bas)
      addToCart: "Ajouter au panier",
      outOfStock: "Rupture de stock",
    },
  },

  // === TRADUCTIONS ANGLAISES ===
  // Même structure exacte, mais avec les textes en anglais
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
    },
    product: {
      title: "Product catalog",
      price: "Price: {price} €",
      addToCart: "Add to cart",
      outOfStock: "Out of stock",
    },
  },
};

// On crée le système i18n avec notre configuration
export const i18n = createI18n({
  legacy: false,
  // legacy: false = on utilise le mode moderne (Composition API)

  locale: "fr",
  // La langue par défaut au démarrage de l'app

  fallbackLocale: "en",
  // Si une traduction n'existe pas en français, on affiche la version anglaise
  // C'est un "filet de sécurité"

  messages,
  // On passe notre dictionnaire de traductions
});
```

> 💡 **Analogie** : `locale` c'est comme le **drapeau sélectionné** sur un site web. `fallbackLocale` c'est le drapeau de secours si un texte n'a pas été traduit dans la langue choisie.

---

## Étape 3 : Brancher i18n à l'application Vue

```ts
// main.ts — Le fichier d'entrée de notre application Vue

import { createApp } from "vue";
import App from "./App.vue";
import { i18n } from "./plugins/i18n";
// On importe notre configuration i18n créée à l'étape 2

const app = createApp(App);   // On crée l'application Vue
app.use(i18n);                 // On "branche" le système i18n sur l'app
// Maintenant TOUS les composants de l'app peuvent utiliser les traductions !
app.mount("#app");             // On affiche l'app dans la page HTML
```

> 📝 **Rappel** : `app.use(...)` c'est comme brancher un accessoire sur un appareil. Une fois branché, il est disponible partout dans l'application.

---

## Étape 4 : Utiliser les traductions dans un composant

### La fonction `t()` — Le traducteur

La fonction `t()` (comme **t**raduire) est le cœur du système. Vous lui donnez une **clé** (comme `"product.title"`) et elle retourne le **texte traduit** dans la langue active.

```vue
<script setup lang="ts">
// On importe le composable useI18n pour accéder aux traductions
import { useI18n } from "vue-i18n";

// On récupère les outils dont on a besoin :
const { t, locale } = useI18n();
// t      → la fonction pour traduire un texte (t = translate)
// locale → la langue actuellement active (ex: "fr", "en")
//          C'est un ref, donc on peut la lire ET la modifier

// Fonction pour changer de langue
function switchLocale(lang: string): void {
  locale.value = lang;
  // On change simplement la valeur de locale
  // Vue-i18n met à jour TOUS les textes automatiquement !
}
</script>

<template>
  <!-- t("product.title") cherche dans le dictionnaire :
       → en français : "Catalogue produits"
       → en anglais  : "Product catalog" -->
  <h1>{{ t("product.title") }}</h1>

  <!-- Ici on passe la valeur 29.99 pour remplir le "trou" {price} :
       → en français : "Prix : 29.99 €"
       → en anglais  : "Price: 29.99 €" -->
  <p>{{ t("product.price", { price: 29.99 }) }}</p>

  <!-- Un menu déroulant pour changer de langue -->
  <!-- v-model="locale" lie directement le select à la langue active -->
  <select v-model="locale">
    <option value="fr">Français</option>
    <option value="en">English</option>
  </select>
  <!-- Dès qu'on change la sélection, TOUS les textes de la page
       se mettent à jour instantanément ! C'est magique ✨ -->
</template>
```

> 🍽️ **Retour à l'analogie** : `t("product.title")` c'est comme dire au serveur "Lis-moi le nom du plat numéro 3"… il vous le lit dans la langue du menu que vous avez choisi !

---

## L'interpolation : insérer des valeurs dynamiques dans les traductions

Parfois un texte traduit a besoin de contenir une **valeur variable** (un nom, un prix, une date...). On utilise des **accolades `{}`** pour créer des "trous" à remplir.

> 📝 **Rappel JavaScript** : Un **objet** `{ name: "Alice" }` est une collection de paires clé/valeur. Ici on passe un objet à `t()` pour remplir les trous dans la traduction.

```ts
// Dans notre dictionnaire de traductions (messages fr)
{
  welcome: "Bienvenue, {name} !",
  // {name} sera remplacé par la valeur qu'on passe
  date: "Ajouté le {date}",
  // {date} sera remplacé par une date formatée
}
```

```vue
<template>
  <!-- On passe { name: user.name } → remplace {name} par le nom de l'utilisateur -->
  <!-- Si user.name = "Alice" → affiche "Bienvenue, Alice !" -->
  <p>{{ t("welcome", { name: user.name }) }}</p>

  <!-- On passe { date: d(new Date(), "short") } -->
  <!-- d() est la fonction de formatage de dates de vue-i18n -->
  <!-- Affiche par ex. "Ajouté le 26 févr. 2026" -->
  <p>{{ t("date", { date: d(new Date(), "short") }) }}</p>
</template>
```

> 💡 C'est comme un texte à trous qu'on remplit !
> `"Bienvenue, _____ !"` → on remplit le trou avec `"Alice"` → `"Bienvenue, Alice !"`

---

## La pluralisation : gérer le singulier et le pluriel

En français, on dit "1 élément" mais "42 éléments". Le **pluriel** change ! vue-i18n gère ça automatiquement grâce au caractère **pipe `|`**.

```ts
// Dans le dictionnaire de traductions
{
  items: "Aucun élément | {count} élément | {count} éléments"
  //      ^^^^^^^^^^^^^^   ^^^^^^^^^^^^^^^   ^^^^^^^^^^^^^^^^
  //      quand count = 0  quand count = 1   quand count >= 2
  //
  // Le pipe | sépare les 3 cas : zéro | un | plusieurs
}
```

```vue
<template>
  <!-- count = 0 → vue-i18n choisit la 1ère partie → "Aucun élément" -->
  <p>{{ t("items", { count: 0 }) }}</p>

  <!-- count = 1 → vue-i18n choisit la 2ème partie → "1 élément" -->
  <p>{{ t("items", { count: 1 }) }}</p>

  <!-- count = 42 → vue-i18n choisit la 3ème partie → "42 éléments" -->
  <p>{{ t("items", { count: 42 }) }}</p>
</template>
```

> 💡 C'est comme un aiguillage automatique : vue-i18n regarde le nombre et choisit la bonne formulation tout seul !

---

## Formater les dates et les nombres selon la langue

Saviez-vous que les pays n'écrivent pas les nombres et les dates de la même façon ?

- 🇫🇷 France : `1 234,56 €` et `26 février 2026`
- 🇺🇸 USA : `$1,234.56` et `February 26, 2026`

vue-i18n peut gérer ça automatiquement ! On configure les **formats** dans notre fichier i18n :

```ts
// plugins/i18n.ts — On ajoute les formats de nombres et de dates

export const i18n = createI18n({
  legacy: false,
  locale: "fr",

  // === FORMATS DE NOMBRES ===
  numberFormats: {
    fr: {
      // En France, on utilise l'Euro (€)
      currency: { style: "currency", currency: "EUR" },
      // Les pourcentages avec 1 décimale (ex: 12,5 %)
      percent: { style: "percent", minimumFractionDigits: 1 },
    },
    en: {
      // Aux USA, on utilise le Dollar ($)
      currency: { style: "currency", currency: "USD" },
      percent: { style: "percent", minimumFractionDigits: 1 },
    },
  },

  // === FORMATS DE DATES ===
  datetimeFormats: {
    fr: {
      // Format court : "26 févr. 2026"
      short: { day: "numeric", month: "short", year: "numeric" },
      // Format long : "26 février 2026 à 14:30"
      long: {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    },
    en: {
      // Format court US : "Feb 26, 2026"
      short: { month: "short", day: "numeric", year: "numeric" },
      // Format long US : "February 26, 2026, 02:30 PM"
      long: {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    },
  },

  messages,
  // (notre dictionnaire de traductions défini plus haut)
});
```

```vue
<template>
  <!-- n() = formater un Nombre selon la langue active -->
  <p>{{ n(1234.56, "currency") }}</p>
  <!-- En français → "1 234,56 €" -->
  <!-- En anglais  → "$1,234.56" -->

  <!-- d() = formater une Date selon la langue active -->
  <p>{{ d(new Date(), "long") }}</p>
  <!-- En français → "26 février 2026 à 14:30" -->
  <!-- En anglais  → "February 26, 2026, 02:30 PM" -->
</template>
```

> 💡 `n()` pour les **n**ombres, `d()` pour les **d**ates, `t()` pour les **t**extes. Facile à retenir !

---

## Sauvegarder le choix de langue de l'utilisateur

Quand un utilisateur choisit l'anglais, on veut que ce choix soit **mémorisé** même s'il ferme et rouvre le navigateur. On utilise `localStorage` pour ça.

> 📝 **Rappel** : `localStorage` est un petit espace de stockage dans le navigateur. C'est comme un post-it que le navigateur garde en mémoire même quand on ferme la page.

```ts
// composables/useLocale.ts
// Un composable = une fonction réutilisable qui contient de la logique Vue

import { useI18n } from "vue-i18n";
import { watch } from "vue";

// On définit le type de retour de notre composable avec une interface
interface UseLocaleReturn {
  locale: ReturnType<typeof useI18n>["locale"];
  // La langue active (un ref)
  availableLocales: string[];
  // La liste des langues disponibles (ex: ["fr", "en"])
  switchLocale: (lang: string) => void;
  // La fonction pour changer de langue
}

export function useLocale(): UseLocaleReturn {
  // On récupère la locale et les langues disponibles depuis vue-i18n
  const { locale, availableLocales } = useI18n();

  // Fonction pour changer de langue proprement
  function switchLocale(lang: string): void {
    // On vérifie d'abord que la langue demandée existe
    if (availableLocales.includes(lang)) {
      locale.value = lang;
      // Change la langue dans vue-i18n (tous les textes se mettent à jour)

      document.documentElement.lang = lang;
      // Met à jour l'attribut lang="fr" dans la balise <html>
      // Important pour l'accessibilité et le SEO

      localStorage.setItem("locale", lang);
      // Sauvegarde le choix dans le navigateur pour la prochaine visite
    }
  }

  // Au chargement : on restaure la langue sauvegardée précédemment
  const saved = localStorage.getItem("locale");
  // On lit le post-it "locale" dans le localStorage
  if (saved && availableLocales.includes(saved)) {
    locale.value = saved;
    // Si on trouve une langue valide, on l'applique
  }

  // On surveille les changements de langue pour garder le HTML synchronisé
  watch(locale, (lang) => {
    document.documentElement.lang = lang;
  });

  return { locale, availableLocales, switchLocale };
}
```

---

## (Avancé) Typage strict des clés de traduction

> ⚠️ Cette section est pour quand vous serez plus à l'aise avec TypeScript. Vous pouvez la sauter pour le moment.

On peut configurer TypeScript pour qu'il **vérifie** que les clés de traduction existent. Si vous écrivez `t("produit.tiitre")` (avec une faute), TypeScript vous préviendra !

```ts
// types/i18n.d.ts
import fr from "@/locales/fr.json";
// On importe le fichier de traductions français

type MessageSchema = typeof fr;
// On crée un type TypeScript basé sur la structure du fichier JSON

declare module "vue-i18n" {
  export interface DefineLocaleMessage extends MessageSchema {}
  // On dit à vue-i18n : "les clés valides sont celles du fichier fr.json"
}
```

Avec ce typage, `t('cle.inexistante')` provoque une **erreur TypeScript** avant même de lancer l'application. Très pratique pour éviter les fautes de frappe !

---

## Récapitulatif

| Concept | À quoi ça sert | Exemple |
|---|---|---|
| `t("clé")` | Traduire un texte | `t("nav.home")` → "Accueil" |
| `t("clé", { x: val })` | Texte avec valeur dynamique | `t("price", { price: 29 })` → "Prix : 29 €" |
| Pipe `\|` | Gérer singulier/pluriel | `"0 \| 1 item \| {count} items"` |
| `n(nombre, "format")` | Formater un nombre | `n(1234, "currency")` → "1 234 €" |
| `d(date, "format")` | Formater une date | `d(new Date(), "short")` → "26 févr. 2026" |
| `locale.value = "en"` | Changer la langue | Tous les textes se mettent à jour |
| `localStorage` | Sauvegarder le choix | La langue est mémorisée entre les visites |

---

## 🎯 Pratique

### Exercice I18N.1 — Première traduction

Crée un fichier de traductions et affiche un message localisé :

```ts
// locales/fr.json
{
  "welcome": "???"
}

// locales/en.json
{
  "welcome": "???"
}
```

```vue
<template>
  <!-- Affiche le message welcome -->
  <h1>???</h1>
</template>
```

<details>
<summary>Solution</summary>

```json
// locales/fr.json
{ "welcome": "Bienvenue sur notre site !" }

// locales/en.json
{ "welcome": "Welcome to our site!" }
```

```vue
<template>
  <h1>{{ t('welcome') }}</h1>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
```
</details>

---

### Exercice I18N.2 — Interpolation

Crée une traduction avec une variable dynamique :

```json
// Clé de traduction pour "Bonjour, {name} !" et "Hello, {name}!"
```

```vue
<template>
  <p>???</p>
</template>
```

<details>
<summary>Solution</summary>

```json
// fr.json
{ "greeting": "Bonjour, {name} !" }
// en.json
{ "greeting": "Hello, {name}!" }
```

```vue
<template>
  <p>{{ t('greeting', { name: userName }) }}</p>
</template>
```
</details>

---

### Exercice I18N.3 — Pluralisation

Crée une clé qui gère le singulier et le pluriel :

```json
// Pour : "Aucun article", "1 article", "5 articles"
{ "cart.items": "???" }
```

<details>
<summary>Solution</summary>

```json
{ "cart.items": "Aucun article | 1 article | {count} articles" }
```

```vue
{{ t('cart.items', itemCount) }}
```
</details>

---

### Exercice I18N.4 — Sélecteur de langue

Crée un composant de changement de langue :

```vue
<template>
  <select ???>
    <option value="fr">Français</option>
    <option value="en">English</option>
  </select>
</template>
```

<details>
<summary>Solution</summary>

```vue
<template>
  <select v-model="locale">
    <option value="fr">Français</option>
    <option value="en">English</option>
  </select>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { locale } = useI18n()
</script>
```
</details>

---

## Suite

→ `cours/10-i18n/02-strategies-avancees.md`
