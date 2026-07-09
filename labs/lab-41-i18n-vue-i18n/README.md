# Lab 41 — i18n vue-i18n

> **Outcome :** à la fin, tu sais configurer vue-i18n v10 en Composition API, internationaliser un composant Vue 3 avec `t()`, `d()`, pluralisation et un sélecteur de langue réactif.
> **Vrai outil :** vue-i18n v10 + Vue 3.5 + Vite dev server.
> **Feedback :** le coach valide visuellement en session — le changement de langue doit mettre à jour tous les textes et les formats de date instantanément dans le navigateur.

---

## Énoncé

Tu internationalises le fil de posts TribuZen. La page `PostFeed.vue` affiche une liste de posts avec auteur, date, nombre de commentaires et deux actions. Tout est actuellement en français câblé en dur.

**Cahier des charges exact :**

1. Configurer vue-i18n (`legacy: false`, locale `fr` par défaut, fallback `en`).
2. Créer `src/locales/fr.json` et `src/locales/en.json` (structure par sections).
3. Construire `PostCard.vue` qui utilise `t()` pour les libellés, `d()` pour la date, `t()` avec pluralisation pour le compte de commentaires.
4. Construire `LocaleSwitcher.vue` qui bascule entre FR et EN — le changement met à jour toute l'interface sans rechargement.

**Données de départ (à copier dans `PostFeed.vue`) :**

```ts
interface Post {
  id: string
  authorName: string
  content: string
  publishedAt: Date
  commentCount: number
}

const posts = ref<Post[]>([
  {
    id: 'p1',
    authorName: 'Alice',
    content: 'Première photo des vacances !',
    publishedAt: new Date('2025-12-15'),
    commentCount: 0,
  },
  {
    id: 'p2',
    authorName: 'Bob',
    content: 'On se retrouve samedi pour le repas de famille.',
    publishedAt: new Date('2025-12-18'),
    commentCount: 1,
  },
  {
    id: 'p3',
    authorName: 'Cara',
    content: 'Nouvelle vidéo de Mila qui marche !',
    publishedAt: new Date('2025-12-20'),
    commentCount: 7,
  },
])
```

**Pas de gap-fill** — tu écris tous les fichiers à partir des starters ci-dessous.

### Starters minimaux

```bash
# Dans ton projet Vite Vue 3 existant
pnpm add vue-i18n
```

```ts
// src/plugins/i18n.ts — à compléter
import { createI18n } from 'vue-i18n'

// TODO: importer fr et en depuis @/locales/
// TODO: déclarer datetimeFormats (clé 'short' avec year/month/day)
// TODO: créer et exporter i18n avec legacy: false

export const i18n = createI18n({ /* ... */ })
```

```ts
// src/main.ts — à modifier
import { createApp } from 'vue'
import App from './App.vue'
// TODO: importer i18n et appeler app.use(i18n)
```

```vue
<!-- src/components/post/PostCard.vue — à écrire -->
<script setup lang="ts">
// TODO: defineProps<{ post: Post }>
// TODO: const { t, d } = useI18n()
</script>

<template>
  <!-- TODO: libellés avec t(), date avec d(), commentaires avec pluralisation -->
</template>
```

```vue
<!-- src/components/ui/LocaleSwitcher.vue — à écrire -->
<script setup lang="ts">
// TODO: const { locale } = useI18n()
// TODO: fonction setLocale qui modifie locale.value
</script>

<template>
  <!-- TODO: <select> avec FR / EN -->
</template>
```

Lance `pnpm dev` et branche les composants dans `App.vue` pour voir le résultat en direct.

---

## Étapes (en friction)

1. **Crée `src/locales/fr.json`** avec les clés : `post.publishedBy`, `post.comment` (3 formes plurielles), `post.react`, `post.comment_action`. Crée `en.json` avec les équivalents anglais.

2. **Déclare `datetimeFormats`** dans `i18n.ts` pour `fr` et `en`, avec un format `short` (`year: 'numeric', month: '2-digit', day: '2-digit'`). Ajoute `as const`.

3. **Configure `createI18n`** avec `legacy: false`, `locale: 'fr'`, `fallbackLocale: 'en'`, les messages importés et `datetimeFormats`.

4. **Enregistre le plugin** dans `main.ts` via `app.use(i18n)`.

5. **Écris `PostCard.vue`** :
   - `const { t, d } = useI18n()` dans `<script setup lang="ts">`
   - <code v-pre>{{ t('post.publishedBy', { author: post.authorName }) }}</code> pour l'auteur
   - <code v-pre>{{ d(post.publishedAt, 'short') }}</code> pour la date
   - <code v-pre>{{ t('post.comment', post.commentCount) }}</code> pour la pluralisation
   - Deux boutons avec `t('post.react')` et `t('post.comment_action')`

6. **Écris `LocaleSwitcher.vue`** avec un `<select>` lié à `locale` (`:value="locale"`) et un `@change` qui appelle `locale.value = event.target.value`.

7. **Branche dans `App.vue`** : `<LocaleSwitcher />` en haut, puis `<PostCard v-for="post in posts" :key="post.id" :post="post" />`.

8. **Teste les cas** :
   - Basculer en EN → tous les textes et les dates changent instantanément
   - Post avec 0 commentaire → "Aucun commentaire" / "No comments"
   - Post avec 1 commentaire → "1 commentaire" / "1 comment"
   - Post avec 7 commentaires → "7 commentaires" / "7 comments"

---

## Corrigé complet commenté

### `src/locales/fr.json`

```json
{
  "post": {
    "publishedBy": "par {author}",
    "publishedOn": "Publié le {date}",
    "comment": "Aucun commentaire | {count} commentaire | {count} commentaires",
    "react": "Réagir",
    "comment_action": "Commenter"
  },
  "nav": {
    "language": "Langue"
  }
}
```

### `src/locales/en.json`

```json
{
  "post": {
    "publishedBy": "by {author}",
    "publishedOn": "Published on {date}",
    "comment": "No comments | {count} comment | {count} comments",
    "react": "React",
    "comment_action": "Comment"
  },
  "nav": {
    "language": "Language"
  }
}
```

### `src/plugins/i18n.ts`

```ts
import { createI18n } from 'vue-i18n'
import fr from '@/locales/fr.json'
import en from '@/locales/en.json'

// as const obligatoire : TypeScript infère les string littéraux exacts
// ('numeric', '2-digit') que Intl.DateTimeFormat attend
const datetimeFormats = {
  fr: {
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
    long:  { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
  },
  en: {
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
    long:  { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
  },
} as const

export const i18n = createI18n({
  legacy: false,        // ← OBLIGATOIRE pour useI18n() en Composition API
  locale: 'fr',        // locale active au démarrage
  fallbackLocale: 'en', // clé manquante en FR → cherche en EN, retourne la clé si toujours absent
  messages: { fr, en },
  datetimeFormats,
  missingWarn: import.meta.env.DEV,    // warning console si clé introuvable (dev seulement)
  fallbackWarn: import.meta.env.DEV,
})
```

### `src/main.ts`

```ts
import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './plugins/i18n'

const app = createApp(App)
app.use(i18n)   // enregistre i18n globalement — useI18n() fonctionnel dans tous les composants
app.mount('#app')
```

### `src/components/post/PostCard.vue`

```vue
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

// useI18n() sans options → portée globale (messages et locale du plugin)
// t = traduction, d = formatage de date
const { t, d } = useI18n()
</script>

<template>
  <article class="post-card">
    <header class="post-header">
      <!--
        t('post.publishedOn', { date: d(...) })
        Le résultat de d() est une string — elle est passée comme named param {date}
        FR : "Publié le 15/12/2025"  |  EN : "Published on 12/15/2025"
        Réactif : si locale change, d() recalcule le format ET t() recharge la string
      -->
      <time :datetime="props.post.publishedAt.toISOString()">
        {{ t('post.publishedOn', { date: d(props.post.publishedAt, 'short') }) }}
      </time>

      <!--
        named param {author} injecté depuis props
        FR : "par Alice"  |  EN : "by Alice"
      -->
      <span class="post-author">
        {{ t('post.publishedBy', { author: props.post.authorName }) }}
      </span>
    </header>

    <p class="post-content">{{ props.post.content }}</p>

    <footer class="post-footer">
      <!--
        Pluralisation : t(clé, count)
        count est un number → sélection de forme + auto-injection comme {count}
        0 → "Aucun commentaire" / "No comments"
        1 → "1 commentaire"    / "1 comment"
        7 → "7 commentaires"   / "7 comments"
      -->
      <span class="post-comment-count">
        {{ t('post.comment', props.post.commentCount) }}
      </span>

      <!-- Boutons avec libellés traduits -->
      <button type="button" class="btn-secondary">
        {{ t('post.react') }}
      </button>
      <button type="button" class="btn-primary">
        {{ t('post.comment_action') }}
      </button>
    </footer>
  </article>
</template>

<style scoped>
.post-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.post-header {
  display: flex;
  gap: 1rem;
  color: #64748b;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.post-content {
  margin: 0.5rem 0;
}

.post-footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.post-comment-count {
  color: #64748b;
  font-size: 0.875rem;
  flex: 1;
}

.btn-primary,
.btn-secondary {
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  border: 1px solid;
}

.btn-primary {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.btn-secondary {
  background: #fff;
  color: #374151;
  border-color: #d1d5db;
}
</style>
```

### `src/components/ui/LocaleSwitcher.vue`

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// locale est un Ref<string> — le modifier déclenche la réactivité Vue
// tous les t(), d(), n() dans les templates enfants se réévaluent
const { locale, t } = useI18n()

// Libellés en dur (pas via t()) : l'utilisateur doit reconnaître
// sa langue même si l'interface est dans l'autre langue
const localeLabels: Record<string, string> = {
  fr: 'Français',
  en: 'English',
}

function setLocale(lang: string): void {
  locale.value = lang
  // Accessibilité : l'attribut lang du document doit correspondre
  document.documentElement.setAttribute('lang', lang)
  // Persistance : retrouver la préférence au prochain chargement
  localStorage.setItem('tz-locale', lang)
}
</script>

<template>
  <div class="locale-switcher">
    <!--
      :value lie le select à locale (Ref<string>) — lecture réactive
      @change extrait la string du DOM et appelle setLocale
      v-model ne marche pas directement ici car locale vient de useI18n
    -->
    <label for="locale-select" class="sr-only">
      {{ t('nav.language') }}
    </label>
    <select
      id="locale-select"
      :value="locale"
      @change="setLocale(($event.target as HTMLSelectElement).value)"
    >
      <option
        v-for="(label, lang) in localeLabels"
        :key="lang"
        :value="lang"
      >
        {{ label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.locale-switcher {
  display: inline-flex;
  align-items: center;
}

/* sr-only : classe utilitaire accessibilité — visible seulement pour les lecteurs d'écran */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

select {
  padding: 0.35rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 0.875rem;
}
</style>
```

### `src/App.vue` (extrait)

```vue
<script setup lang="ts">
import { ref } from 'vue'
import PostCard from './components/post/PostCard.vue'
import LocaleSwitcher from './components/ui/LocaleSwitcher.vue'

interface Post {
  id: string
  authorName: string
  content: string
  publishedAt: Date
  commentCount: number
}

const posts = ref<Post[]>([
  { id: 'p1', authorName: 'Alice',  content: 'Première photo des vacances !',             publishedAt: new Date('2025-12-15'), commentCount: 0 },
  { id: 'p2', authorName: 'Bob',    content: 'On se retrouve samedi pour le repas.',       publishedAt: new Date('2025-12-18'), commentCount: 1 },
  { id: 'p3', authorName: 'Cara',   content: 'Nouvelle vidéo de Mila qui marche !',        publishedAt: new Date('2025-12-20'), commentCount: 7 },
])
</script>

<template>
  <div class="app">
    <header>
      <h1>TribuZen</h1>
      <!-- Sélecteur de langue — visible dans toutes les pages -->
      <LocaleSwitcher />
    </header>

    <main>
      <PostCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
      />
    </main>
  </div>
</template>
```

**Critères de validation :**

- Basculer en EN → tous les textes passent en anglais, les dates changent de format instantanément, sans rechargement
- `commentCount: 0` → "Aucun commentaire" (FR) / "No comments" (EN)
- `commentCount: 1` → "1 commentaire" (FR) / "1 comment" (EN)
- `commentCount: 7` → "7 commentaires" (FR) / "7 comments" (EN)
- Aucune clé brute (`post.react`, `post.comment`…) visible dans l'interface

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — 30 minutes, sans ouvrir ce corrigé :**

1. **Ajoute `n()`** : dans `PostCard.vue`, affiche un indicateur de "score de popularité" formaté en pourcentage (`popularity: 0.73` → `74,3 %` en FR, `74.3%` en EN). Pense à ajouter `numberFormats` dans `i18n.ts`.

2. **Persiste la locale** : au chargement de l'app, restaurer la locale depuis `localStorage` si elle existe. Le `LocaleSwitcher` doit refléter la locale restaurée.

3. **Fallback visible** : supprime intentionnellement la clé `post.react` de `fr.json` → vérifie que le `fallbackLocale: 'en'` affiche "React" en FR. Remets la clé ensuite.

**Critère de réussite :** les trois points fonctionnent dans le navigateur et le rechargement de la page restaure la bonne locale.

---

## Application TribuZen

Dans `smaurier/tribuzen`, les fichiers de ce lab vivent ici :

```
tribuzen/
  src/
    locales/
      fr.json
      en.json
    plugins/
      i18n.ts
    components/
      post/
        PostCard.vue
      ui/
        LocaleSwitcher.vue
```

**Différences par rapport au lab :**

- Les `Post` viendront d'un composable `usePostFeed()` (Pinia + fetch API) — pas de données locales. La structure de l'interface `Post` sera importée depuis `src/types/post.ts`.
- `LocaleSwitcher` sera intégré dans `AppHeader.vue` (layout global), pas dans `App.vue`.
- La persistance de locale sera gérée par `useLocale` (composable, cf. module 41) avec détection de la langue navigateur en fallback.
- Les `datetimeFormats` et `numberFormats` seront partagés entre i18n.ts et Storybook (module 30).

**Commit cible :**

```
feat(i18n): setup vue-i18n — PostCard t/d/pluralisation, LocaleSwitcher réactif
```
