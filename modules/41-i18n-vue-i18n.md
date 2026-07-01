---
titre: i18n — vue-i18n
cours: 02-vue
notions: [installation et setup vue-i18n Composition API, fonction de traduction t, interpolation et named params, pluralisation, formats date nombre monnaie, changement de locale réactif, chargement des messages, fichiers de traduction par locale]
outcomes:
  - sait configurer vue-i18n en Composition API dans une app Vue 3
  - sait traduire avec t, interpolation, pluralisation
  - sait formater dates, nombres et monnaies selon la locale
  - sait changer de langue de façon réactive
prerequis: [40-accessibilite-audit]
next: 42-i18n-strategies-avancees
libs: [{ name: vue, version: "3.5" }, { name: vue-i18n, version: "10" }]
tribuzen: front-office TribuZen — interface multilingue (fr par défaut, en), formats de date des posts selon la locale
last-reviewed: 2026-07
---

# i18n — vue-i18n

> **Outcomes — tu sauras FAIRE :** configurer vue-i18n en Composition API, traduire avec `t()`, interpoler des variables, gérer la pluralisation, formater dates et monnaies selon la locale, changer de langue de façon réactive.
> **Difficulté :** :star::star:

---

## 1. Cas concret d'abord

Tu rejoins la squad TribuZen. `PostCard.vue` affiche les posts des groupes famille. En ce moment, tout est câblé en dur en français :

```vue
<!-- PostCard.vue — AVANT i18n -->
<template>
  <article>
    <p class="meta">Publié le 15 déc. 2025 — 3 commentaires</p>
    <p class="author">par Alice</p>
    <button>Réagir</button>
    <button>Commenter</button>
  </article>
</template>
```

Un membre canadien passe son navigateur en anglais → il voit quand même "Publié le", "Réagir", "Commenter". Le format "15 déc. 2025" n'est pas le format anglophone attendu ("Dec 15, 2025").

**Ce que tu dois faire :**

1. Remplacer tous les libellés par des clés traduites via `t()`.
2. Formater la date selon la locale active avec `d()`.
3. Gérer la pluralisation pour le nombre de commentaires.
4. Ajouter un sélecteur de langue qui met à jour l'interface instantanément.

C'est ça, l'internationalisation avec vue-i18n.

---

## 2. Théorie complète, concise

### 2.1 Installation et setup — `createI18n` avec `legacy: false`

```bash
pnpm add vue-i18n
```

vue-i18n v9/v10 supporte Vue 3. La configuration se fait dans un plugin séparé :

```ts
// src/plugins/i18n.ts
import { createI18n } from 'vue-i18n'

// Messages inline (OK pour les petites apps, externalisés en JSON pour les grosses)
const messages = {
  fr: {
    post: {
      publishedOn: 'Publié le {date}',
      react: 'Réagir',
      comment: 'Commenter',
    },
  },
  en: {
    post: {
      publishedOn: 'Published on {date}',
      react: 'React',
      comment: 'Comment',
    },
  },
}

export const i18n = createI18n({
  legacy: false,        // ← OBLIGATOIRE pour Composition API (useI18n)
  locale: 'fr',        // locale par défaut
  fallbackLocale: 'en', // clé manquante en FR → cherche en EN
  messages,
})
```

```ts
// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './plugins/i18n'

const app = createApp(App)
app.use(i18n)   // enregistre le plugin globalement
app.mount('#app')
```

> **`legacy: false` est le seul interrupteur.** Sans lui, `useI18n()` dans un composant retourne des fonctions non fonctionnelles et aucune erreur n'est levée — l'app semble marcher mais les traductions ne s'appliquent pas.

### 2.2 La fonction `t()` — traduction de base

`useI18n()` expose `t()` : elle prend une clé (point-séparée pour le nesting) et retourne la string traduite dans la locale active.

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// useI18n() sans options → portée globale (messages + locale du plugin)
const { t, locale } = useI18n()
</script>

<template>
  <!-- t('post.react') → "Réagir" si locale = "fr" -->
  <button>{{ t('post.react') }}</button>

  <!-- t('post.comment') → "Comment" si locale = "en" -->
  <button>{{ t('post.comment') }}</button>
</template>
```

`t()` retourne toujours une `string`. Si la clé n'existe pas dans la locale active, `fallbackLocale` est tentée ; si toujours introuvable, la clé brute est retournée (ex. `"post.react"`).

### 2.3 Interpolation et named params

Les messages peuvent contenir des placeholders `{nomParam}`. On les substitue en passant un objet à `t()`.

```ts
// Messages
const messages = {
  fr: {
    greeting: 'Bonjour {name}, bienvenue dans le groupe {group} !',
    publishedBy: 'Publié par {author}',
  },
  en: {
    greeting: 'Hello {name}, welcome to the {group} group!',
    publishedBy: 'Published by {author}',
  },
}
```

```vue
<template>
  <!-- "Bonjour Alice, bienvenue dans le groupe Durand !" -->
  <p>{{ t('greeting', { name: 'Alice', group: 'Durand' }) }}</p>

  <!-- "Publié par Bob" -->
  <p>{{ t('publishedBy', { author: 'Bob' }) }}</p>
</template>
```

Les placeholders sont insensibles à l'ordre dans la string — c'est le nom qui compte, pas la position.

### 2.4 Pluralisation

Le séparateur `|` délimite les formes plurielles. vue-i18n choisit la forme selon le nombre passé.

**Deux formes (1 | autres) :**

```ts
const messages = {
  fr: { like: '{count} like | {count} likes' },
  en: { like: '{count} like | {count} likes' },
}
```

**Trois formes (0 | 1 | 2+) :**

```ts
const messages = {
  fr: {
    comment: 'Aucun commentaire | {count} commentaire | {count} commentaires',
  },
  en: {
    comment: 'No comments | {count} comment | {count} comments',
  },
}
```

```vue
<script setup lang="ts">
const { t } = useI18n()
const commentCount = ref(0)
</script>

<template>
  <!--
    t(clé, count) — count sélectionne la forme ET est auto-injecté comme {count}
    0 → "Aucun commentaire"
    1 → "1 commentaire"
    5 → "5 commentaires"
  -->
  <p>{{ t('comment', commentCount) }}</p>
</template>
```

Quand le placeholder s'appelle `{count}`, passer juste le nombre suffit — vue-i18n l'injecte automatiquement. Pour un placeholder personnalisé (`{n}`), passer un objet nommé explicitement :

```ts
// message: 'aucun item | {n} item | {n} items'
t('item', { n: count }, count)   // named { n } + count pour la sélection de forme
```

### 2.5 Formats date, nombre et monnaie — `d()` et `n()`

vue-i18n délègue le formatage à l'API native `Intl` du navigateur. Il faut déclarer les **formats nommés** dans `createI18n`.

**Configuration :**

```ts
// src/plugins/i18n.ts
const datetimeFormats = {
  fr: {
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
    long:  { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
  },
  en: {
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
    long:  { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
  },
} as const  // ← as const obligatoire pour que TypeScript accepte les littéraux Intl

const numberFormats = {
  fr: {
    currency: { style: 'currency', currency: 'EUR' },
    percent:  { style: 'percent', minimumFractionDigits: 1 },
  },
  en: {
    currency: { style: 'currency', currency: 'USD' },
    percent:  { style: 'percent', minimumFractionDigits: 1 },
  },
} as const

export const i18n = createI18n({
  legacy: false,
  locale: 'fr',
  fallbackLocale: 'en',
  messages,
  datetimeFormats,
  numberFormats,
})
```

**Utilisation dans un composant :**

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { d, n } = useI18n()

const publishedAt = new Date('2025-12-15')
const price = 9.99
const completion = 0.743
</script>

<template>
  <!-- d(valeur, 'nomFormat') -->
  <p>{{ d(publishedAt, 'short') }}</p>
  <!-- fr : "15/12/2025"  |  en : "12/15/2025" -->

  <p>{{ d(publishedAt, 'long') }}</p>
  <!-- fr : "lundi 15 décembre 2025"  |  en : "Monday, December 15, 2025" -->

  <!-- n(valeur, 'nomFormat') -->
  <p>{{ n(price, 'currency') }}</p>
  <!-- fr : "9,99 €"  |  en : "$9.99" -->

  <p>{{ n(completion, 'percent') }}</p>
  <!-- fr : "74,3 %"  |  en : "74.3%" -->
</template>
```

`d()` et `n()` réagissent automatiquement aux changements de `locale` — pas besoin de reforcer.

### 2.6 Changement de locale réactif

`locale` exposé par `useI18n()` est une `Ref<string>`. Modifier `.value` déclenche la réactivité Vue : tous les `t()`, `d()`, `n()` dans les templates se réévaluent.

```vue
<script setup lang="ts">
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

function setLocale(lang: string): void {
  locale.value = lang
  // accessibilité : aligner l'attribut lang du document
  document.documentElement.setAttribute('lang', lang)
  // persistance : sauvegarder le choix
  localStorage.setItem('tz-locale', lang)
}

// Restaurer la locale sauvegardée au montage
const saved = localStorage.getItem('tz-locale')
if (saved && ['fr', 'en'].includes(saved)) {
  setLocale(saved)
}
</script>

<template>
  <select :value="locale" @change="setLocale(($event.target as HTMLSelectElement).value)">
    <option value="fr">Français</option>
    <option value="en">English</option>
  </select>
</template>
```

> `locale` est un `Ref<string>`, pas une string brute. Écrire `locale = 'en'` (sans `.value`) ne fait rien — ça réassigne la variable locale JS, pas la ref vue-i18n.

### 2.7 Chargement des messages et fichiers de traduction par locale

**Fichiers JSON — structure recommandée :**

```
src/
  locales/
    fr.json
    en.json
```

```json
// src/locales/fr.json
{
  "post": {
    "publishedOn": "Publié le {date}",
    "react": "Réagir",
    "comment": "Aucun commentaire | {count} commentaire | {count} commentaires"
  },
  "nav": {
    "home": "Accueil",
    "groups": "Groupes",
    "profile": "Profil"
  }
}
```

**Import statique (simple, chargé au démarrage) :**

```ts
// src/plugins/i18n.ts
import { createI18n } from 'vue-i18n'
import fr from '@/locales/fr.json'
import en from '@/locales/en.json'

export const i18n = createI18n({
  legacy: false,
  locale: 'fr',
  fallbackLocale: 'en',
  messages: { fr, en },
})
```

**Import dynamique (lazy load — la locale EN n'est chargée que si demandée) :**

```ts
// src/plugins/i18n.ts
import { createI18n } from 'vue-i18n'
import fr from '@/locales/fr.json'   // FR chargé dès le départ

export const i18n = createI18n({
  legacy: false,
  locale: 'fr',
  fallbackLocale: 'fr',
  messages: { fr },
})

// Ensemble des langues déjà chargées
const loadedLocales = new Set<string>(['fr'])

export async function loadAndSetLocale(locale: string): Promise<void> {
  // Ne recharger que si nécessaire
  if (!loadedLocales.has(locale)) {
    // import() dynamique → Vite crée un chunk séparé par locale
    const messages = await import(`@/locales/${locale}.json`)
    i18n.global.setLocaleMessage(locale, messages.default)
    loadedLocales.add(locale)
  }

  // Changer la locale globale (en mode Composition API, c'est un Ref)
  i18n.global.locale.value = locale
  document.documentElement.setAttribute('lang', locale)
}
```

L'import statique est suffisant pour TribuZen (FR + EN, fichiers légers). Le lazy load devient pertinent à partir de 5+ langues ou de fichiers de traduction volumineux.

---

## 3. Worked examples

### Exemple 1 — `PostCard.vue` : traduction, date et pluralisation

```vue
<!-- src/components/post/PostCard.vue -->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Post {
  id: string
  authorName: string
  content: string
  publishedAt: Date
  commentCount: number
}

const props = defineProps<{ post: Post }>()

// useI18n() sans options → portée globale : messages et locale du plugin
const { t, d } = useI18n()
</script>

<template>
  <article class="post-card">
    <!--
      d(props.post.publishedAt, 'short')
      FR : "15/12/2025"  |  EN : "12/15/2025"
      Réactif : recalcule automatiquement si la locale change
    -->
    <header>
      <time :datetime="props.post.publishedAt.toISOString()">
        {{ t('post.publishedOn', { date: d(props.post.publishedAt, 'short') }) }}
      </time>
      <span>{{ t('post.by', { author: props.post.authorName }) }}</span>
    </header>

    <p>{{ props.post.content }}</p>

    <footer>
      <!--
        Pluralisation : t('post.comment', count)
        count est auto-injecté comme {count}
        0 → "Aucun commentaire"  / "No comments"
        1 → "1 commentaire"      / "1 comment"
        5 → "5 commentaires"     / "5 comments"
      -->
      <span>{{ t('post.comment', props.post.commentCount) }}</span>

      <button type="button">{{ t('post.react') }}</button>
      <button type="button">{{ t('post.comment_action') }}</button>
    </footer>
  </article>
</template>
```

Messages correspondants :

```json
// src/locales/fr.json
{
  "post": {
    "publishedOn": "Publié le {date}",
    "by": "par {author}",
    "comment": "Aucun commentaire | {count} commentaire | {count} commentaires",
    "react": "Réagir",
    "comment_action": "Commenter"
  }
}
```

```json
// src/locales/en.json
{
  "post": {
    "publishedOn": "Published on {date}",
    "by": "by {author}",
    "comment": "No comments | {count} comment | {count} comments",
    "react": "React",
    "comment_action": "Comment"
  }
}
```

### Exemple 2 — `LocaleSwitcher.vue` + composable `useLocale`

Le sélecteur de langue est un composant simple. La logique de persistance est extraite dans un composable.

```ts
// src/composables/useLocale.ts
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'

const STORAGE_KEY = 'tz-locale'
const SUPPORTED = ['fr', 'en'] as const
type SupportedLocale = typeof SUPPORTED[number]

function isSupportedLocale(v: string): v is SupportedLocale {
  return (SUPPORTED as readonly string[]).includes(v)
}

function detectInitialLocale(): SupportedLocale {
  // 1. Préférence sauvegardée
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && isSupportedLocale(stored)) return stored

  // 2. Langue du navigateur
  const browser = navigator.language.split('-')[0]
  if (isSupportedLocale(browser)) return browser

  // 3. Défaut
  return 'fr'
}

export function useLocale() {
  const { locale } = useI18n()

  // Initialiser au premier appel
  locale.value = detectInitialLocale()

  // Synchroniser localStorage + attribut lang à chaque changement
  watch(
    locale,
    (newLocale) => {
      localStorage.setItem(STORAGE_KEY, newLocale)
      document.documentElement.setAttribute('lang', newLocale)
    },
    { immediate: true }
  )

  function setLocale(lang: string): void {
    if (isSupportedLocale(lang)) {
      locale.value = lang
    }
  }

  return { locale, setLocale, supportedLocales: SUPPORTED }
}
```

```vue
<!-- src/components/ui/LocaleSwitcher.vue -->
<script setup lang="ts">
import { useLocale } from '@/composables/useLocale'

const { locale, setLocale, supportedLocales } = useLocale()

// Labels affichés dans le sélecteur — pas traduits via t() : l'utilisateur
// doit reconnaître sa langue même si l'interface est dans l'autre langue
const localeLabels: Record<string, string> = {
  fr: 'Français',
  en: 'English',
}
</script>

<template>
  <div class="locale-switcher">
    <!--
      :value lie le select à la locale réactive (pas v-model — locale est un Ref externe)
      @change extrait la valeur de l'événement DOM et appelle setLocale
    -->
    <label for="locale-select" class="sr-only">Langue / Language</label>
    <select
      id="locale-select"
      :value="locale"
      @change="setLocale(($event.target as HTMLSelectElement).value)"
    >
      <option
        v-for="lang in supportedLocales"
        :key="lang"
        :value="lang"
      >
        {{ localeLabels[lang] }}
      </option>
    </select>
  </div>
</template>
```

Ce composable est réutilisable dans n'importe quel composant qui a besoin de lire ou changer la locale.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — `legacy: true` est le défaut — le plus courant en entretien

```ts
// ❌ Sans legacy: false → useI18n() ne fonctionne PAS en Composition API
export const i18n = createI18n({
  locale: 'fr',
  messages,
  // legacy non spécifié → default = true → mode Options API
})

// Dans le composant : t() retourne la clé brute, pas la traduction
const { t } = useI18n()
t('post.react')  // retourne "post.react" — aucune erreur levée
```

```ts
// ✅ Toujours spécifier legacy: false pour Composition API
export const i18n = createI18n({
  legacy: false,  // ← explicite, toujours
  locale: 'fr',
  messages,
})
```

C'est le piège numéro un dans les projets qui migrent de Vue 2 ou qui copient de vieilles docs.

### PIÈGE #2 — `locale.value` vs `i18n.global.locale`

La façon de lire/écrire la locale dépend du mode :

```ts
// En mode Composition (legacy: false) :
// locale exposé par useI18n() est un Ref<string>
const { locale } = useI18n()
locale.value = 'en'          // ✅ correct
locale = 'en'                // ❌ réassigne la variable locale, rien ne change

// Sur l'instance globale en mode Composition :
i18n.global.locale.value = 'en'  // ✅ .value obligatoire

// En mode Legacy (legacy: true) :
// i18n.global.locale est une string directe (pas un Ref)
i18n.global.locale = 'en'    // ✅ en mode legacy
i18n.global.locale.value = 'en'  // ❌ erreur : string n'a pas .value
```

### PIÈGE #3 — Pluralisation et `{count}` auto-injecté vs named params

```ts
const messages = {
  fr: {
    // {count} est auto-injecté quand t(key, number) est appelé
    like: 'Aucun like | {count} like | {count} likes',

    // {n} est un named param personnalisé — ne s'auto-injecte PAS
    member: 'Aucun membre | {n} membre | {n} membres',
  },
}

// ✅ {count} — appel avec juste le nombre
t('like', 5)         // "5 likes" — count auto-injecté

// ❌ {n} — appel avec juste le nombre → {n} non substitué
t('member', 5)       // "5 membres"... mais {n} s'affiche tel quel si non injecté

// ✅ {n} — passer l'objet named ET le count séparément
t('member', { n: 5 }, 5)   // "5 membres" — forme 3 + {n} = 5
```

**Règle simple :** utiliser `{count}` pour la pluralisation — il est auto-injecté. Réserver les named params personnalisés (`{n}`, `{total}`) quand le contexte l'exige, et les passer toujours explicitement.

### PIÈGE #4 — Clé manquante affichée silencieusement

```ts
t('post.unknown_key')
// Renvoie "post.unknown_key" — pas d'erreur, pas de warning visible en production
```

vue-i18n tente d'abord `fallbackLocale`, puis retourne la clé brute. Ce comportement silencieux peut laisser des clés crues en prod sans le remarquer.

**Filets de sécurité :**
- Activer `missingWarn` et `fallbackWarn` en développement
- Utiliser TypeScript avec les types de messages (`vue-i18n` v10 supporte les types inférés)

```ts
export const i18n = createI18n({
  legacy: false,
  locale: 'fr',
  fallbackLocale: 'en',
  messages,
  missingWarn: import.meta.env.DEV,    // warning console en dev seulement
  fallbackWarn: import.meta.env.DEV,
})
```

### PIÈGE #5 — `datetimeFormats`/`numberFormats` sans `as const`

```ts
// ❌ Sans as const : TypeScript infère des types trop larges (string au lieu de littéraux)
const datetimeFormats = {
  fr: { short: { year: 'numeric', month: '2-digit', day: '2-digit' } },
}
// Erreur TS : Type 'string' is not assignable to type '"numeric" | "2-digit" | ...'

// ✅ as const : TypeScript infère les string littéraux exacts
const datetimeFormats = {
  fr: { short: { year: 'numeric', month: '2-digit', day: '2-digit' } },
} as const
```

---

## 5. Ancrage TribuZen

Dans TribuZen, l'internationalisation touche plusieurs couches du front-office :

**`PostCard.vue`** (Exemple 1) — Les libellés ("Réagir", "Commenter", "Publié le") et les dates des posts s'affichent selon la locale. La date de publication est le premier élément visible — un format incorrect ("12/15/2025" pour un utilisateur FR) casse la confiance immédiatement.

**`GroupHeader.vue`** — Le compte de membres utilise la pluralisation :
```json
{ "group": { "members": "Aucun membre | {count} membre | {count} membres" } }
```

**`ProfileStats.vue`** — Les statistiques (posts par semaine, taux de participation) utilisent `n(value, 'percent')` qui formate selon la locale : `74,3 %` (FR) vs `74.3%` (EN).

**`LocaleSwitcher.vue`** (Exemple 2) — Placé dans le header global (`AppHeader.vue`). La locale est persistée dans `localStorage` sous la clé `tz-locale` et restaurée au démarrage.

Structure des fichiers dans `smaurier/tribuzen` :

```
tribuzen/
  src/
    locales/
      fr.json          ← traductions françaises
      en.json          ← traductions anglaises
    plugins/
      i18n.ts          ← createI18n (legacy: false, datetimeFormats, numberFormats)
    composables/
      useLocale.ts     ← persistance + détection navigateur
    components/
      post/
        PostCard.vue   ← t(), d(), pluralisation commentaires
      ui/
        LocaleSwitcher.vue  ← sélecteur de langue
```

---

## 6. Points clés

1. `legacy: false` est l'unique bascule pour activer `useI18n()` en Composition API — sans lui, tout semble marcher mais rien ne se traduit.
2. `const { t, d, n, locale } = useI18n()` — ces quatre fonctions couvrent 95 % des besoins d'i18n.
3. `t(clé, named)` pour l'interpolation, `t(clé, count)` pour la pluralisation ; `{count}` est auto-injecté, les autres placeholders doivent être passés explicitement.
4. `d(date, 'nomFormat')` et `n(nombre, 'nomFormat')` délèguent à `Intl` — les formats sont nommés dans `createI18n`, les résultats varient automatiquement selon la locale.
5. `locale` est un `Ref<string>` en mode Composition — écrire `locale.value = 'en'` pour changer de langue, jamais `locale = 'en'`.
6. `fallbackLocale` est le filet de sécurité ; `missingWarn: true` en développement révèle les clés manquantes avant la prod.
7. Les fichiers JSON (`src/locales/fr.json`) sont le pattern scalable — un fichier par langue, importé statiquement ou lazy-loadé selon la taille.
8. `datetimeFormats` et `numberFormats` requièrent `as const` pour que TypeScript accepte les littéraux `Intl.DateTimeFormat`.

---

## 7. Seeds Anki

```
Pourquoi legacy: false est-il obligatoire avec useI18n() ?|Par défaut vue-i18n démarre en mode Legacy (Options API). Sans legacy: false, useI18n() ne fonctionne pas en Composition API — t() retourne la clé brute sans erreur.
Quelle est la signature de t() pour la pluralisation avec {count} ?|t(clé, count) où count est un number — vue-i18n sélectionne la forme plurielle ET auto-injecte count comme {count}. Pour un named param personnalisé {n}, utiliser t(clé, { n: count }, count).
Comment changer la locale de façon réactive en Composition API ?|locale.value = 'en' — locale exposé par useI18n() est un Ref<string>. Tous les t(), d(), n() dans les templates se réévaluent automatiquement.
À quoi servent d() et n() dans vue-i18n ?|d(date, 'nomFormat') formate une date selon la locale active (ex. "15/12/2025" en FR, "12/15/2025" en EN). n(nombre, 'nomFormat') formate un nombre, une monnaie ou un pourcentage via Intl.
Pourquoi datetimeFormats et numberFormats requièrent-ils as const ?|Sans as const TypeScript infère les valeurs comme string au lieu de string littéraux ('numeric', '2-digit'…) — l'API Intl attend des littéraux précis, le type trop large provoque une erreur TS.
Comment déclarer les formats de date et monnaie dans createI18n ?|Via les options datetimeFormats et numberFormats, chacun étant un objet indexé par locale avec des formats nommés (short, long, currency…) typés avec as const.
Que se passe-t-il si une clé de traduction est manquante ?|vue-i18n tente fallbackLocale, puis retourne la clé brute sans erreur. Activer missingWarn: true en dev pour détecter les oublis avant la production.
Quelle différence entre import statique et lazy load des messages JSON ?|Import statique (import fr from '@/locales/fr.json') charge toutes les langues au démarrage. Le lazy load (import() dynamique + setLocaleMessage) ne charge une langue que si l'utilisateur la demande — pertinent pour 5+ langues ou fichiers lourds.
```

---

## Pont vers le lab

> Lab associé : `labs/lab-41-i18n-vue-i18n/README.md`. Internationaliser `PostFeed.vue` de A à Z — setup vue-i18n, fichiers JSON FR/EN, `t()`, `d()`, pluralisation, sélecteur de langue réactif.

---

← [Module 40 — Accessibilité — audit](./40-accessibilite-audit.md)
