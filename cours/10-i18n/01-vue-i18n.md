# 01 — vue-i18n — Internationalisation avec Vue 3

> **i18n = "internationalization" (i + 18 lettres + n).**
> C'est le processus de conception d'un logiciel pour qu'il puisse s'adapter a différentes langues et regions sans modification du code source.
> Ne pas confondre avec **l10n** (localization) = l'adaptation effective à une langue/region spécifique.

---

## 🌍 Pourquoi internationaliser ?

| Raison | Detail |
|--------|--------|
| **Marche** | Un site multilingue touche un public plus large |
| **Legal** | Certains pays imposent la langue locale (ex. loi Toubon en France) |
| **UX** | Les utilisateurs preferent naviguer dans leur langue maternelle |
| **SEO** | Les moteurs de recherche indexent mieux le contenu dans la langue de l'utilisateur |

---

## ⚙️ Installer vue-i18n

```bash
# vue-i18n v9+ est compatible avec Vue 3
pnpm add vue-i18n
```

### Configuration de base

```ts
// plugins/i18n.ts
import { createI18n } from 'vue-i18n'

// Les messages de traduction — chaque cle de langue contient un objet de traductions
const messages = {
  fr: {
    nav: {
      home: 'Accueil',
      products: 'Produits',
      contact: 'Contact',
    },
    common: {
      loading: 'Chargement...',
      error: 'Une erreur est survenue.',
      save: 'Enregistrer',
      cancel: 'Annuler',
    },
  },
  en: {
    nav: {
      home: 'Home',
      products: 'Products',
      contact: 'Contact',
    },
    common: {
      loading: 'Loading...',
      error: 'An error occurred.',
      save: 'Save',
      cancel: 'Cancel',
    },
  },
}

// Creer l'instance i18n
export const i18n = createI18n({
  legacy: false,         // ← IMPORTANT : active le mode Composition API
  locale: 'fr',          // Langue par defaut
  fallbackLocale: 'en',  // Si une cle manque en FR, chercher en EN
  messages,
})
```

### Brancher i18n a Vue

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './plugins/i18n'

const app = createApp(App)
app.use(i18n)   // ← Enregistre le plugin i18n
app.mount('#app')
```

---

## 📖 La fonction `t()` — Traduire du texte

`t()` est la fonction centrale de vue-i18n. Elle prend une clé et retourne la traduction dans la langue active.

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// useI18n() donne acces a t(), locale, et d'autres utilitaires
const { t, locale } = useI18n()

function switchLocale(lang: string): void {
  locale.value = lang
}
</script>

<template>
  <nav>
    <!-- t('nav.home') retourne "Accueil" si locale = "fr" -->
    <a href="/">{{ t('nav.home') }}</a>
    <a href="/products">{{ t('nav.products') }}</a>
    <a href="/contact">{{ t('nav.contact') }}</a>
  </nav>

  <!-- Selecteur de langue -->
  <select :value="locale" @change="switchLocale(($event.target as HTMLSelectElement).value)">
    <option value="fr">Francais</option>
    <option value="en">English</option>
  </select>
</template>
```

### Interpolation de variables

```ts
// messages
const messages = {
  fr: {
    greeting: 'Bonjour {name}, bienvenue !',
    items: 'Vous avez {count} article(s) dans votre panier.',
  },
  en: {
    greeting: 'Hello {name}, welcome!',
    items: 'You have {count} item(s) in your cart.',
  },
}
```

```vue
<template>
  <!-- Resultat : "Bonjour Alice, bienvenue !" -->
  <p>{{ t('greeting', { name: 'Alice' }) }}</p>

  <!-- Resultat : "Vous avez 3 article(s) dans votre panier." -->
  <p>{{ t('items', { count: 3 }) }}</p>
</template>
```

---

## 🔢 Pluralisation

La pluralisation géré les cas où le texte change selon un nombre. Les regles varient selon la langue.

```ts
const messages = {
  fr: {
    // Separateur | pour les formes : 0 | 1 | 2+
    cart: 'Panier vide | {count} article | {count} articles',
    notifications: 'Aucune notification | {count} notification | {count} notifications',
  },
  en: {
    cart: 'Empty cart | {count} item | {count} items',
    notifications: 'No notifications | {count} notification | {count} notifications',
  },
}
```

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const cartCount = ref(0)
</script>

<template>
  <!-- t() avec un nombre choisit automatiquement la bonne forme -->
  <p>{{ t('cart', cartCount, { count: cartCount }) }}</p>

  <!-- 0 → "Panier vide" -->
  <!-- 1 → "1 article" -->
  <!-- 5 → "5 articles" -->

  <button @click="cartCount++">Ajouter</button>
</template>
```

---

## 📅 Formatage de dates et nombres

vue-i18n intégré l'API `Intl` de JavaScript pour formater les dates et nombres selon la locale.

### Configuration des formats

```ts
// plugins/i18n.ts
import { createI18n } from 'vue-i18n'

const datetimeFormats = {
  fr: {
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
    long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
  },
  en: {
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
    long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
  },
} as const

const numberFormats = {
  fr: {
    currency: { style: 'currency', currency: 'EUR' },
    percent: { style: 'percent', minimumFractionDigits: 1 },
  },
  en: {
    currency: { style: 'currency', currency: 'USD' },
    percent: { style: 'percent', minimumFractionDigits: 1 },
  },
} as const

export const i18n = createI18n({
  legacy: false,
  locale: 'fr',
  fallbackLocale: 'en',
  messages: { /* ... */ },
  datetimeFormats,
  numberFormats,
})
```

### Utilisation dans un composant

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { d, n } = useI18n()
// d() = formater une date
// n() = formater un nombre

const now = new Date()
const price = 42.99
const progress = 0.756
</script>

<template>
  <!-- Dates -->
  <p>{{ d(now, 'short') }}</p>
  <!-- FR : "15/03/2026" — EN : "03/15/2026" -->

  <p>{{ d(now, 'long') }}</p>
  <!-- FR : "dimanche 15 mars 2026" — EN : "Sunday, March 15, 2026" -->

  <!-- Nombres -->
  <p>{{ n(price, 'currency') }}</p>
  <!-- FR : "42,99 €" — EN : "$42.99" -->

  <p>{{ n(progress, 'percent') }}</p>
  <!-- FR : "75,6 %" — EN : "75.6%" -->
</template>
```

---

## 💾 Persister la langue choisie

La langue selectionnee doit etre persistee entre les visites.

```ts
// composables/useLocale.ts
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'

const LOCALE_STORAGE_KEY = 'app-locale'
const SUPPORTED_LOCALES = ['fr', 'en'] as const
type SupportedLocale = typeof SUPPORTED_LOCALES[number]

function isSupportedLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale)
}

function getInitialLocale(): SupportedLocale {
  // 1. Verifier localStorage
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (stored && isSupportedLocale(stored)) return stored

  // 2. Verifier la langue du navigateur
  const browserLang = navigator.language.split('-')[0]
  if (isSupportedLocale(browserLang)) return browserLang

  // 3. Langue par defaut
  return 'fr'
}

export function useLocale() {
  const { locale, availableLocales } = useI18n()

  // Initialiser avec la langue persistee
  locale.value = getInitialLocale()

  // Persister et synchroniser a chaque changement
  watch(locale, (newLocale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
    document.documentElement.setAttribute('lang', newLocale)
  }, { immediate: true })

  function setLocale(lang: string): void {
    if (isSupportedLocale(lang)) {
      locale.value = lang
    }
  }

  return {
    locale,
    availableLocales,
    setLocale,
    supportedLocales: SUPPORTED_LOCALES,
  }
}
```

---

## 📦 Lazy loading des traductions

Pour les grosses applications, charger toutes les traductions au démarrage est penalisant. On peut charger les langues à la demandé.

```ts
// plugins/i18n.ts
import { createI18n } from 'vue-i18n'
import fr from '@/locales/fr.json'  // Seul le francais est charge au demarrage

export const i18n = createI18n({
  legacy: false,
  locale: 'fr',
  fallbackLocale: 'fr',
  messages: { fr },
})

// Fonction pour charger une langue a la demande
const loadedLanguages = new Set<string>(['fr'])

export async function loadLocaleMessages(locale: string): Promise<void> {
  if (loadedLanguages.has(locale)) return

  // import() dynamique → Vite cree un chunk separe par langue
  const messages = await import(`@/locales/${locale}.json`)

  i18n.global.setLocaleMessage(locale, messages.default)
  loadedLanguages.add(locale)
}

export async function setI18nLanguage(locale: string): Promise<void> {
  await loadLocaleMessages(locale)
  i18n.global.locale.value = locale
  document.documentElement.setAttribute('lang', locale)
}
```

### Utilisation avec le composable

```ts
// composables/useLocale.ts (version lazy)
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { setI18nLanguage } from '@/plugins/i18n'

export function useLocale() {
  const { locale } = useI18n()

  async function switchLocale(lang: string): Promise<void> {
    await setI18nLanguage(lang)
    localStorage.setItem('app-locale', lang)
  }

  return { locale, switchLocale }
}
```

---

## 🎯 Pratique

### Exercice I18N.1 — Configuration de base

Configure vue-i18n avec 2 langues (FR/EN) et un composant qui affiche un message traduit :

```ts
// plugins/i18n.ts
import { createI18n } from 'vue-i18n'

const messages = {
  // ???
}

export const i18n = createI18n({
  // ???
})
```

<details>
<summary>Solution</summary>

```ts
import { createI18n } from 'vue-i18n'

const messages = {
  fr: {
    hello: 'Bonjour le monde !',
  },
  en: {
    hello: 'Hello world!',
  },
}

export const i18n = createI18n({
  legacy: false,
  locale: 'fr',
  fallbackLocale: 'en',
  messages,
})
```
</details>

---

### Exercice I18N.2 — Pluralisation

Ecris une traduction avec pluralisation pour un compteur de messages :

```ts
const messages = {
  fr: {
    // 0 → "Aucun message"
    // 1 → "1 nouveau message"
    // 5 → "5 nouveaux messages"
    inbox: '???',
  },
}
```

<details>
<summary>Solution</summary>

```ts
const messages = {
  fr: {
    inbox: 'Aucun message | {count} nouveau message | {count} nouveaux messages',
  },
  en: {
    inbox: 'No messages | {count} new message | {count} new messages',
  },
}
```

```vue
<template>
  <p>{{ t('inbox', messageCount, { count: messageCount }) }}</p>
</template>
```
</details>

---

### Exercice I18N.3 — Formatage de prix

Affiche un prix formate selon la locale active :

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { n } = useI18n()
const price = 1299.99
</script>

<template>
  <!-- Affiche "1 299,99 €" en FR et "$1,299.99" en EN -->
  <p>???</p>
</template>
```

<details>
<summary>Solution</summary>

```vue
<template>
  <p>{{ n(price, 'currency') }}</p>
</template>
```

Avec la configuration `numberFormats` qui définit `currency` pour chaque locale.
</details>

---

## Suite

→ `cours/10-i18n/02-strategies-avancees.md`
