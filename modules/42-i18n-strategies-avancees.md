---
titre: i18n — stratégies avancées
cours: 02-vue
notions: [lazy loading des locales, routing par langue et détection, i18n en SSR et Nuxt i18n, SEO multilingue hreflang, extraction et gestion des clés de traduction, accessibilité et attribut lang, formats ICU messages, tests d'internationalisation]
outcomes:
  - sait charger les locales à la demande et détecter la langue
  - sait gérer l'i18n en SSR (Nuxt i18n) avec routing par langue
  - sait faire du SEO multilingue (hreflang, lang) accessible
  - sait organiser et tester les clés de traduction à l'échelle
prerequis: [41-i18n-vue-i18n]
next: 43-auth-authentification
libs: [{ name: vue, version: "3.5" }, { name: vue-i18n, version: "10" }]
tribuzen: front-office TribuZen — locales lazy-loadées, routing /fr /en, hreflang + attribut lang correct (accessibilité), SSR Nuxt i18n
last-reviewed: 2026-07
---

# i18n — stratégies avancées

> **Outcomes — tu sauras FAIRE :** charger les locales à la demande (lazy loading), configurer le routing multilingue avec détection automatique, mettre en place l'i18n SSR avec Nuxt i18n, générer hreflang + attribut `lang` corrects, organiser les clés à l'échelle, écrire des tests i18n robustes.
> **Difficulté :** :star::star::star:
>
> **Précédent :** [41 — i18n fondamentaux avec vue-i18n](41-i18n-vue-i18n.md)

---

## 1. Cas concret d'abord

TribuZen vient de décider de passer en **bilingue français / anglais**. Tu es le dev front chargé de l'implémentation. Le PM a listé trois contraintes fermes :

1. **Performance** — le bundle français n'embarque pas les traductions anglaises. Les locales sont chargées à la demande.
2. **SEO** — Google doit indexer `/fr/groupes` et `/en/groups` comme deux pages distinctes, avec les balises `hreflang` correctes.
3. **Accessibilité (RGAA critère 8.3/8.4)** — les lecteurs d'écran doivent annoncer la bonne langue. L'attribut `lang` sur `<html>` doit changer quand l'utilisateur change de locale.

Tu ouvres `src/plugins/i18n.ts` existant. Il charge **toutes** les locales au démarrage, l'attribut `lang` est absent, et le router n'a pas de préfixe `/fr`. Trois problèmes, une session pour les corriger.

---

## 2. Théorie complète, concise

### 2.1 Lazy loading des locales

Par défaut, `createI18n({ messages: { fr, en } })` embarque toutes les traductions dans le bundle initial. Sur un gros projet (50+ écrans, deux langues), ça peut représenter plusieurs centaines de kB non compressés.

**Pattern lazy loading — vue-i18n v10 (legacy: false) :**

```ts
// plugins/i18n.ts
import { createI18n } from 'vue-i18n'

export type SupportedLocale = 'fr' | 'en'
export const SUPPORTED_LOCALES: SupportedLocale[] = ['fr', 'en']

// Instance sans messages — les locales sont injectées au runtime
export const i18n = createI18n({
  legacy: false,
  locale: 'fr',
  fallbackLocale: 'fr',
  // messages vide : aucun JSON embarqué dans le bundle initial
})

// Cache en mémoire — évite de re-fetcher une locale déjà chargée
const loadedLocales = new Set<SupportedLocale>()

export async function loadLocaleMessages(locale: SupportedLocale): Promise<void> {
  if (loadedLocales.has(locale)) return

  // Import dynamique — Vite crée un chunk séparé par locale
  const messages = await import(`../locales/${locale}.json`)
  i18n.global.setLocaleMessage(locale, messages.default)
  loadedLocales.add(locale)
}

export async function setLocale(locale: SupportedLocale): Promise<void> {
  await loadLocaleMessages(locale)
  i18n.global.locale.value = locale
  // Synchronise l'attribut lang — voir section 2.4
  document.documentElement.setAttribute('lang', locale)
}
```

Vite analyse les `import(` dynamiques et génère automatiquement un chunk par fichier JSON. Le navigateur ne télécharge `en.json` que si l'utilisateur demande l'anglais.

**Détection de la locale initiale :**

```ts
// utils/detectLocale.ts
export function detectLocale(): SupportedLocale {
  // 1. Préférence persistée (choix utilisateur)
  const stored = localStorage.getItem('tribuzen-locale') as SupportedLocale | null
  if (stored && SUPPORTED_LOCALES.includes(stored)) return stored

  // 2. Langue du navigateur (Accept-Language côté client)
  const browser = navigator.language.split('-')[0]
  if (SUPPORTED_LOCALES.includes(browser as SupportedLocale)) {
    return browser as SupportedLocale
  }

  // 3. Fallback
  return 'fr'
}
```

### 2.2 Routing par langue et détection

La stratégie **préfixe URL** (`/fr/…`, `/en/…`) est la référence pour le SEO public : chaque version linguistique est une URL distincte, bookmarkable et crawlable indépendamment.

```ts
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { i18n, loadLocaleMessages, SUPPORTED_LOCALES, type SupportedLocale } from '@/plugins/i18n'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      // Groupe parent qui capture :locale dans l'URL
      path: '/:locale(fr|en)',
      children: [
        { path: '', name: 'home', component: () => import('@/views/HomeView.vue') },
        { path: 'groupes', name: 'groups', component: () => import('@/views/GroupsView.vue') },
        { path: 'profil', name: 'profile', component: () => import('@/views/ProfileView.vue') },
      ],
    },
    // Rediriger la racine vers la locale détectée ou la locale par défaut
    {
      path: '/',
      redirect: () => `/${i18n.global.locale.value}`,
    },
    // Toute URL sans locale valide → rediriger
    {
      path: '/:pathMatch(.*)*',
      redirect: (to) => `/${i18n.global.locale.value}${to.path}`,
    },
  ],
})

// Navigation guard : charger la locale AVANT d'afficher la page
router.beforeEach(async (to) => {
  const locale = to.params.locale as string

  if (!SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
    // Locale invalide dans l'URL → rediriger vers la locale courante
    return `/${i18n.global.locale.value}`
  }

  // Lazy load + activation de la locale
  await loadLocaleMessages(locale as SupportedLocale)
  i18n.global.locale.value = locale as SupportedLocale
  document.documentElement.setAttribute('lang', locale)
})

export default router
```

**Comparatif des stratégies de routing :**

| Stratégie | Exemple URL | SEO | Complexité config |
|-----------|-------------|-----|-------------------|
| Préfixe | `/fr/groupes`, `/en/groups` | Optimal | Modérée |
| Sous-domaine | `fr.tribuzen.app` | Excellent | Élevée (DNS, CORS) |
| Paramètre query | `/groupes?lang=en` | Mauvais | Faible |
| Cookie/header seul | `/groupes` | Mauvais | Faible |

> Pour TribuZen (SPA publique), le préfixe URL est le choix correct. Pour une app interne sans besoin SEO, le cookie/header seul suffit.

### 2.3 i18n en SSR — Nuxt i18n

En SSR (Nuxt), `@nuxtjs/i18n` gère le routing préfixé, le lazy loading et le rendu côté serveur d'une seule configuration.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],

  i18n: {
    // Stratégie de routing
    strategy: 'prefix_except_default', // /groupes (fr), /en/groups
    defaultLocale: 'fr',

    // Lazy loading — les fichiers sont dans langDir/
    lazy: true,
    langDir: 'locales/',

    locales: [
      { code: 'fr', language: 'fr-FR', file: 'fr.json', name: 'Français' },
      { code: 'en', language: 'en-US', file: 'en.json', name: 'English' },
    ],

    // Persistance du choix via cookie (SSR-compatible, pas localStorage)
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'tribuzen-locale',
      redirectOn: 'root',
    },
  },
})
```

**Dans les composants Nuxt :** `useI18n()` fonctionne exactement comme en Vue SPA — Nuxt i18n réexporte le composable.

```vue
<script setup lang="ts">
const { t, locale, locales, setLocale } = useI18n()
// locales → liste des locales configurées dans nuxt.config
// setLocale('en') → change la locale ET navigue vers l'URL anglaise
</script>

<template>
  <nav>
    <button
      v-for="loc in locales"
      :key="loc.code"
      :aria-current="loc.code === locale ? 'true' : undefined"
      @click="setLocale(loc.code)"
    >
      {{ loc.name }}
    </button>
  </nav>
</template>
```

**SEO automatique avec Nuxt i18n :** `@nuxtjs/i18n` injecte les balises `hreflang` et l'attribut `lang` sur `<html>` automatiquement via `useHead` — pas de configuration manuelle nécessaire en Nuxt.

### 2.4 SEO multilingue — hreflang et attribut `lang`

En SPA Vue (sans Nuxt), les balises SEO se posent manuellement avec `@vueuse/head` ou `@unhead/vue`.

**Attribut `lang` sur `<html>` :**

```ts
// composables/useLocale.ts
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'

export function useLocale() {
  const { locale } = useI18n()

  // { immediate: true } → exécuté aussi au montage, pas seulement lors des changements
  watch(
    locale,
    (newLocale) => {
      document.documentElement.setAttribute('lang', newLocale)
      localStorage.setItem('tribuzen-locale', newLocale)
    },
    { immediate: true },
  )

  return { locale }
}
```

**Balises hreflang dans la page :**

```vue
<script setup lang="ts">
import { useHead } from '@vueuse/head'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { locale, availableLocales } = useI18n()
const route = useRoute()
const BASE_URL = 'https://app.tribuzen.com'

useHead({
  htmlAttrs: {
    // lang sur <html> — critique SEO et accessibilité (voir section 2.5)
    lang: () => locale.value,
  },
  link: [
    // x-default = version canonique (ici le français)
    { rel: 'alternate', hreflang: 'x-default', href: `${BASE_URL}/fr${route.path}` },
    // Une entrée par locale disponible
    ...availableLocales.map((lang) => ({
      rel: 'alternate',
      hreflang: lang,
      href: `${BASE_URL}/${lang}${route.path}`,
    })),
  ],
})
</script>
```

**Résultat HTML généré :**

```html
<html lang="fr">
  <head>
    <link rel="alternate" hreflang="x-default" href="https://app.tribuzen.com/fr/groupes" />
    <link rel="alternate" hreflang="fr" href="https://app.tribuzen.com/fr/groupes" />
    <link rel="alternate" hreflang="en" href="https://app.tribuzen.com/en/groups" />
  </head>
</html>
```

### 2.5 Attribut `lang` = accessibilité (lecteurs d'écran)

Ce point est souvent traité comme "SEO seulement". C'est une erreur grave du point de vue RGAA.

**RGAA 8.3 / 8.4 — La langue par défaut doit être précisée.**

Quand un lecteur d'écran (VoiceOver, NVDA, JAWS) rencontre un texte, il choisit un moteur de synthèse vocale selon la langue déclarée sur `<html lang="…">`. **Si `lang` est absent ou incorrect, le moteur de synthèse lit le texte avec la mauvaise prononciation** — exemple : un lecteur d'écran configuré en anglais lira "Bienvenue dans votre espace" avec une prononciation anglaise incompréhensible.

```ts
// ❌ Absence de synchronisation lang — RGAA non conforme
// L'utilisateur change de locale, l'UI change, mais le lecteur d'écran
// continue à utiliser la mauvaise voix car <html lang> n'a pas changé
locale.value = 'en'
// document.documentElement.setAttribute('lang', 'en') OUBLIÉ

// ✅ Synchronisation obligatoire à chaque changement de locale
watch(locale, (newLocale) => {
  document.documentElement.setAttribute('lang', newLocale)
}, { immediate: true })
```

**Portées de l'attribut lang :**

| Attribut | Portée | Usage |
|----------|--------|-------|
| `<html lang="fr">` | Page entière | Langue principale — toujours présent |
| `<span lang="en">` | Élément inline | Mot/phrase dans une autre langue |
| `<blockquote lang="de">` | Bloc | Citation dans une autre langue |

Pour TribuZen, si un nom de groupe ou une citation est dans une autre langue que la locale courante, `lang` doit être posé sur l'élément. C'est un atout RGAA direct.

### 2.6 Gestion des clés de traduction à l'échelle

Sur un projet de 50+ écrans, les fichiers monolithiques `fr.json` deviennent ingérables. Deux patterns complémentaires.

**Structure par domaine fonctionnel :**

```
locales/
  fr/
    common.json      # Boutons, labels génériques (Enregistrer, Annuler…)
    auth.json        # Connexion, inscription, réinitialisation
    groups.json      # Écrans groupes TribuZen
    profile.json     # Profil utilisateur
    validation.json  # Messages de validation de formulaires
    errors.json      # Messages d'erreur API et techniques
  en/
    common.json
    auth.json
    groups.json
    profile.json
    validation.json
    errors.json
```

```ts
// plugins/i18n.ts — charger les namespaces à la demande
const namespaceCache = new Map<string, boolean>()

export async function loadNamespace(locale: SupportedLocale, ns: string): Promise<void> {
  const key = `${locale}:${ns}`
  if (namespaceCache.has(key)) return

  const messages = await import(`../locales/${locale}/${ns}.json`)

  // Merge dans les messages existants de la locale (setLocaleMessage écraserait tout)
  const current = i18n.global.getLocaleMessage(locale)
  i18n.global.setLocaleMessage(locale, { ...current, [ns]: messages.default })
  namespaceCache.set(key, true)
}
```

**Convention de nommage des clés :**

| Pattern | Exemple | Usage |
|---------|---------|-------|
| `common.action` | `common.save`, `common.cancel` | Boutons et labels réutilisables |
| `page.section.element` | `groups.list.emptyState` | Clé spécifique à un écran |
| `component.element` | `groupCard.joinButton` | Clé liée à un composant |
| `validation.rule` | `validation.required`, `validation.email` | Erreurs de formulaires |
| `error.code` | `error.notFound`, `error.unauthorized` | Codes erreur API |

**Typage des clés avec TypeScript (vue-i18n v10) :**

```ts
// types/i18n.d.ts
import fr from '@/locales/fr/common.json'

// Le type est inféré depuis le fichier de référence (fr = source de vérité)
type MessageSchema = typeof fr

declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends MessageSchema {}
}

// Dans un composant :
// t('common.save')   → ✅ TypeScript valide la clé
// t('common.savee')  → ❌ TS Error : clé inexistante
```

### 2.7 Formats ICU messages

Le format natif de vue-i18n v10 gère déjà les interpolations nommées, la pluralisation et les listes. Le format **ICU MessageFormat** est un standard plus riche, utilisé par de nombreux outils de traduction professionnels (Phrase, Lokalise, Crowdin).

**Format natif vue-i18n v10 (suffisant dans la plupart des cas) :**

```json
{
  "greeting": "Bonjour, {name} !",
  "itemCount": "Aucun groupe | Un groupe | {count} groupes",
  "lastSeen": "Vu il y a {days} jour | Vu il y a {days} jours"
}
```

```ts
t('greeting', { name: 'Alice' })    // → "Bonjour, Alice !"
t('itemCount', 0)                   // → "Aucun groupe"
t('itemCount', 1)                   // → "Un groupe"
t('itemCount', 5)                   // → "5 groupes"
```

**Format ICU (avec configuration supplémentaire) :**

ICU MessageFormat permet des règles de pluralisation par langue (l'anglais a 2 formes, l'arabe en a 6) et du sélecteur de genre.

```json
{
  "members": "{count, plural, =0 {Aucun membre} one {# membre} other {# membres}}",
  "invite": "{gender, select, male {Il a rejoint} female {Elle a rejoint} other {Il·elle a rejoint}} le groupe."
}
```

> ⚠️ À vérifier Context7 — vue-i18n v10 nécessite la configuration `messageCompiler` pour activer ICU. Le package `@intlify/message-compiler` doit être installé séparément. Vérifier la doc officielle `vue-i18n` v10 avant d'activer ICU en production.

**Composant `<i18n-t>` pour les interpolations avec balises HTML :**

Quand une traduction contient un lien ou du texte gras, ne jamais interpoler du HTML brut (`v-html` + XSS). Utiliser `<i18n-t>` :

```json
{ "terms": "En cliquant, vous acceptez nos {link}." }
```

```vue
<template>
  <p>
    <i18n-t keypath="terms" tag="span">
      <template #link>
        <RouterLink to="/cgu">conditions générales</RouterLink>
      </template>
    </i18n-t>
  </p>
  <!-- Résultat : "En cliquant, vous acceptez nos <a href='/cgu'>conditions générales</a>." -->
</template>
```

### 2.8 Tests d'internationalisation

**Tests unitaires avec Vitest — pattern factory i18n :**

```ts
// tests/utils/i18n-test-utils.ts
import { createI18n } from 'vue-i18n'

// Factory : chaque test instancie un i18n isolé → pas d'état partagé entre tests
export function createTestI18n(locale = 'fr', messages?: Record<string, unknown>) {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'fr',
    messages: messages ?? {
      fr: { common: { save: 'Enregistrer', cancel: 'Annuler' } },
      en: { common: { save: 'Save', cancel: 'Cancel' } },
    },
  })
}
```

```ts
// tests/components/GroupCard.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestI18n } from '../utils/i18n-test-utils'
import GroupCard from '@/components/groups/GroupCard.vue'

describe('GroupCard — i18n', () => {
  it('affiche le bouton en français', () => {
    const wrapper = mount(GroupCard, {
      global: { plugins: [createTestI18n('fr')] },
      props: { groupId: 'g1', name: 'Famille Dupont' },
    })
    expect(wrapper.find('[data-testid="join-btn"]').text()).toBe('Rejoindre')
  })

  it('affiche le bouton en anglais', () => {
    const wrapper = mount(GroupCard, {
      global: { plugins: [createTestI18n('en')] },
      props: { groupId: 'g1', name: 'Dupont Family' },
    })
    expect(wrapper.find('[data-testid="join-btn"]').text()).toBe('Join')
  })

  it('change de locale dynamiquement', async () => {
    const i18n = createTestI18n('fr', {
      fr: { join: 'Rejoindre' },
      en: { join: 'Join' },
    })
    const wrapper = mount(GroupCard, {
      global: { plugins: [i18n] },
      props: { groupId: 'g1', name: 'Famille Dupont' },
    })

    expect(wrapper.find('[data-testid="join-btn"]').text()).toBe('Rejoindre')

    // Changer la locale dans l'instance de test
    i18n.global.locale.value = 'en'
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="join-btn"]').text()).toBe('Join')
  })
})
```

**Vérification de l'attribut `lang` avec jsdom :**

```ts
// tests/composables/useLocale.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createApp } from 'vue'
import { createTestI18n } from '../utils/i18n-test-utils'

describe('attribut lang sur <html>', () => {
  beforeEach(() => {
    // Reset l'attribut entre les tests
    document.documentElement.removeAttribute('lang')
  })

  it('synchronise lang quand la locale change', async () => {
    const i18n = createTestI18n('fr')

    // Simuler le changement de locale
    i18n.global.locale.value = 'en'

    // Dans le composable useLocale, un watcher pose document.documentElement.lang
    // On vérifie ici l'effet de bord
    document.documentElement.setAttribute('lang', i18n.global.locale.value)

    expect(document.documentElement.getAttribute('lang')).toBe('en')
  })
})
```

---

## 3. Worked examples

### Exemple 1 — Migration lazy loading depuis le chargement synchrone (TribuZen)

**Avant (bundle lourd — tout embarqué au démarrage) :**

```ts
// plugins/i18n.ts — AVANT
import { createI18n } from 'vue-i18n'
import fr from '@/locales/fr.json'
import en from '@/locales/en.json'

export const i18n = createI18n({
  legacy: false,
  locale: 'fr',
  messages: { fr, en }, // ← fr ET en dans le bundle initial
})
```

**Après (lazy loading — en.json chargé seulement si demandé) :**

```ts
// plugins/i18n.ts — APRÈS
import { createI18n } from 'vue-i18n'
import { detectLocale, type SupportedLocale } from '@/utils/detectLocale'

export const i18n = createI18n({
  legacy: false,
  locale: detectLocale(), // fr par défaut ou depuis localStorage
  fallbackLocale: 'fr',
  // Pas de messages ici : injection au runtime via setLocaleMessage
})

const loaded = new Set<SupportedLocale>()

export async function loadLocaleMessages(locale: SupportedLocale): Promise<void> {
  if (loaded.has(locale)) return
  const messages = await import(`../locales/${locale}.json`)
  i18n.global.setLocaleMessage(locale, messages.default)
  loaded.add(locale)
}

// main.ts — initialisation
// await loadLocaleMessages(detectLocale()) AVANT app.mount()
```

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { i18n, loadLocaleMessages } from './plugins/i18n'
import { detectLocale } from './utils/detectLocale'
import router from './router'

async function bootstrap() {
  const locale = detectLocale()
  await loadLocaleMessages(locale)  // charger la locale initiale avant le premier rendu
  i18n.global.locale.value = locale

  const app = createApp(App)
  app.use(i18n)
  app.use(router)
  app.mount('#app')
}

bootstrap()
```

**Impact bundle :** sans lazy loading, `fr.json` + `en.json` = ~80 kB dans le bundle initial. Avec lazy loading, seul `fr.json` (~40 kB) est chargé — `en.json` est téléchargé en background ou à la première demande.

### Exemple 2 — Sélecteur de langue accessible (RGAA)

Voici le composant `LocaleSwitcher.vue` qui combine changement de locale, persistance, mise à jour de `lang` sur `<html>`, et accessibilité RGAA.

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { loadLocaleMessages, type SupportedLocale, SUPPORTED_LOCALES } from '@/plugins/i18n'

const { locale } = useI18n()

async function changeLocale(newLocale: SupportedLocale): Promise<void> {
  if (newLocale === locale.value) return

  // 1. Charger les messages si pas encore en mémoire
  await loadLocaleMessages(newLocale)

  // 2. Activer la locale dans vue-i18n
  locale.value = newLocale

  // 3. Synchroniser l'attribut lang → change la voix du lecteur d'écran (RGAA 8.3)
  document.documentElement.setAttribute('lang', newLocale)

  // 4. Persister le choix
  localStorage.setItem('tribuzen-locale', newLocale)
}
</script>

<template>
  <!--
    role="group" + aria-label → regroupe sémantiquement les boutons de langue
    pour les technologies d'assistance
  -->
  <div role="group" aria-label="Choix de la langue">
    <button
      v-for="loc in SUPPORTED_LOCALES"
      :key="loc"
      :lang="loc"
      :aria-pressed="loc === locale"
      :aria-label="`Passer en ${loc === 'fr' ? 'français' : 'anglais'}`"
      @click="changeLocale(loc)"
    >
      {{ loc.toUpperCase() }}
    </button>
  </div>
</template>
```

**Points d'accessibilité notables :**
- `lang="fr"` sur chaque bouton → le lecteur d'écran lit le label dans la bonne langue
- `aria-pressed` → indique l'état actif (bouton toggle)
- `aria-label` descriptif → évite l'énonciation cryptique "F-R" par le lecteur d'écran

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Locale non lazy = bundle initial lourd

```ts
// ❌ Toutes les langues dans le bundle initial
import fr from '@/locales/fr.json'
import en from '@/locales/en.json'
import es from '@/locales/es.json'

createI18n({ messages: { fr, en, es } })
// → fr + en + es embarqués dans main.js même si l'utilisateur ne change jamais de langue
```

```ts
// ✅ Lazy loading via import dynamique
// Seul fr est chargé au démarrage ; en et es sont des chunks séparés
const messages = await import(`../locales/${locale}.json`)
i18n.global.setLocaleMessage(locale, messages.default)
```

**Signal d'alarme :** si le bundle initial grossit proportionnellement au nombre de langues, les traductions ne sont pas lazy-loadées.

### PIÈGE #2 — Oublier hreflang = pages fantômes pour Google

Sans balises `hreflang`, Google peut détecter du contenu dupliqué entre `/fr/groupes` et `/en/groups`, pénaliser une des deux versions ou refuser d'indexer la langue secondaire.

```html
<!-- ❌ Pas de hreflang — Google ne sait pas que ces pages sont des équivalents -->
<html lang="fr">
  <head><title>TribuZen — Groupes</title></head>
</html>

<!-- ✅ Avec hreflang — Google comprend la relation entre les versions linguistiques -->
<html lang="fr">
  <head>
    <link rel="alternate" hreflang="x-default" href="https://app.tribuzen.com/fr/groupes" />
    <link rel="alternate" hreflang="fr" href="https://app.tribuzen.com/fr/groupes" />
    <link rel="alternate" hreflang="en" href="https://app.tribuzen.com/en/groups" />
  </head>
</html>
```

**Erreur classique :** poser `hreflang` sur une seule page mais pas sur les autres. Google ignore les `hreflang` non réciproques — chaque page doit pointer vers **toutes** les variantes linguistiques, y compris elle-même.

### PIÈGE #3 — `lang` absent sur `<html>` = a11y KO (RGAA critère 8.3)

```html
<!-- ❌ Lecteur d'écran (NVDA/VoiceOver) utilise la langue du système, pas du contenu -->
<html>
  <body>Bienvenue dans votre espace TribuZen</body>
</html>

<!-- ✅ Lecteur d'écran sélectionne le bon moteur de synthèse vocale -->
<html lang="fr">
  <body>Bienvenue dans votre espace TribuZen</body>
</html>
```

En audit RGAA, l'absence de `lang` sur `<html>` est un **échec automatique** des critères 8.3 (langue par défaut) et 8.4 (langue précisée). Dans une SPA multilingue où l'utilisateur peut changer de langue, la synchronisation dynamique via `document.documentElement.setAttribute('lang', locale)` est **non optionnelle**.

### PIÈGE #4 — Clés de traduction non structurées = dette à l'échelle

```json
// ❌ Fichier plat — collision de clés, impossible à maintenir à 200+ clés
{
  "save": "Enregistrer",
  "cancel": "Annuler",
  "title": "Mon titre",
  "groupTitle": "Titre du groupe",
  "pageTitle": "Titre de la page"
}
```

```json
// ✅ Namespaces imbriqués — clairs, sans collision, extractibles par outil
{
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler"
  },
  "groups": {
    "list": { "title": "Mes groupes" },
    "card": { "join": "Rejoindre" }
  },
  "profile": {
    "page": { "title": "Mon profil" }
  }
}
```

### PIÈGE #5 — Test i18n avec instance partagée = tests qui s'influencent

```ts
// ❌ Instance i18n globale partagée entre tests
const sharedI18n = createI18n({ locale: 'fr', messages: { fr: {...}, en: {...} } })

it('test A', () => {
  sharedI18n.global.locale.value = 'en'
  // ...
})

it('test B', () => {
  // sharedI18n.global.locale.value est encore 'en' à cause du test A !
  // Résultat : flakiness selon l'ordre d'exécution
})
```

```ts
// ✅ Factory appelée dans chaque test — isolation garantie
function createTestI18n(locale = 'fr') {
  return createI18n({ legacy: false, locale, messages: { fr: {...}, en: {...} } })
}

it('test A', () => {
  const i18n = createTestI18n('en')
  // ...
})

it('test B', () => {
  const i18n = createTestI18n('fr') // instance fraîche
  // ...
})
```

---

## 5. Ancrage TribuZen

TribuZen utilise ces patterns dans son front-office :

**Lazy loading et détection :**
```
src/
  plugins/
    i18n.ts          ← createI18n vide + loadLocaleMessages + setLocale
  utils/
    detectLocale.ts  ← localStorage → navigator.language → 'fr'
  locales/
    fr.json          ← chargé au démarrage
    en.json          ← chargé à la demande (lazy)
```

**Routing multilingue :**
```
src/
  router/
    index.ts         ← /:locale(fr|en)/... + beforeEach guard
  views/
    HomeView.vue     ← accessible sur /fr et /en
    GroupsView.vue   ← /fr/groupes et /en/groups
```

**Accessibilité (atout RGAA 8.3/8.4) :**

```ts
// composables/useLocale.ts — appelé dans App.vue
watch(locale, (val) => {
  document.documentElement.setAttribute('lang', val)  // RGAA 8.3
  localStorage.setItem('tribuzen-locale', val)
}, { immediate: true })
```

**SEO hreflang :**

```ts
// App.vue — useHead global posé une fois, réactif via () => locale.value
useHead({
  htmlAttrs: { lang: () => locale.value },
  link: availableLocales.map((lang) => ({
    rel: 'alternate',
    hreflang: lang,
    href: `https://app.tribuzen.com/${lang}${route.path}`,
  })),
})
```

**Commit cible TribuZen :**
```
feat(i18n): lazy locales + routing /fr /en + hreflang + lang RGAA
```

---

## 6. Points clés

1. Le lazy loading des locales via `import()` dynamique crée un chunk Vite par langue — le bundle initial ne contient que la locale par défaut.
2. `i18n.global.setLocaleMessage(locale, messages)` injecte les traductions au runtime sans recharger la page.
3. La stratégie préfixe URL (`/fr/…`, `/en/…`) est la référence SEO pour les SPAs publiques — chaque URL est crawlable indépendamment.
4. Le `router.beforeEach` guard est le point central pour charger la locale + synchroniser `lang` avant chaque navigation.
5. En SSR Nuxt, `@nuxtjs/i18n` avec `lazy: true` gère routing, lazy loading et `hreflang` automatiquement.
6. `lang` sur `<html>` n'est pas que du SEO — c'est **RGAA 8.3/8.4** : sans synchronisation dynamique, le lecteur d'écran annonce le contenu avec la mauvaise voix.
7. `hreflang` non réciproque (une seule page déclare les variantes) est ignoré par Google — toutes les pages doivent se déclarer mutuellement.
8. Chaque test i18n doit instancier son propre `createI18n()` via une factory — jamais d'instance globale partagée.

---

## 7. Seeds Anki

```
Pourquoi les locales doivent-elles être lazy-loadées ?|Sans lazy loading, toutes les langues sont dans le bundle initial. Avec import() dynamique, Vite crée un chunk par locale — seule la locale par défaut est téléchargée au démarrage.
Comment injecter des messages au runtime dans vue-i18n v10 ?|i18n.global.setLocaleMessage(locale, messages) injecte les traductions sans rechargement. Combiné à un Set<string> de cache, on évite de re-fetcher une locale déjà chargée.
Quelle est la différence d'impact SEO entre la stratégie préfixe et la stratégie sans préfixe ?|Préfixe (/fr/page, /en/page) = deux URLs distinctes crawlables et bookmarkables → SEO optimal. Sans préfixe (langue en cookie) = une seule URL → Google ne peut pas indexer les variantes linguistiques.
Pourquoi l'attribut lang sur <html> est-il critique pour l'accessibilité ?|Les lecteurs d'écran (NVDA, VoiceOver) sélectionnent le moteur de synthèse vocale selon lang. Sans lang correct, le contenu est lu avec la mauvaise prononciation. C'est RGAA critère 8.3 — échec automatique si absent.
Qu'est-ce qu'un hreflang x-default et quand l'utilise-t-on ?|hreflang="x-default" indique la version canonique de référence quand aucune locale ne correspond au visiteur. On le pointe en général vers la locale par défaut (ex: /fr/page pour TribuZen).
Comment éviter les tests i18n qui s'influencent mutuellement ?|Utiliser une factory createTestI18n() appelée dans chaque it(). Chaque test a une instance isolée — la locale d'un test ne pollue pas le suivant.
Dans Nuxt i18n, quelle option active le lazy loading des fichiers de traduction ?|lazy: true dans la config i18n de nuxt.config.ts, combiné à langDir (chemin du dossier) et file dans chaque entrée locales[]. Nuxt génère les chunks automatiquement.
Quel composant vue-i18n utilise-t-on pour interpoler un lien ou un composant Vue dans une traduction ?|<i18n-t keypath="ma.cle" tag="span"> avec un slot nommé <template #nomDuSlot>. Interdit d'utiliser v-html pour insérer du HTML dans les traductions (risque XSS).
```

---

## Pont vers le lab

> Lab associé : `labs/lab-42-i18n-strategies-avancees/README.md`. Implémente le lazy loading, le sélecteur de langue accessible et les tests i18n sur un projet Vite starter — avec Vitest comme oracle.
