# Lab 42 — i18n stratégies avancées

> **Outcome :** à la fin, tu sais implémenter le lazy loading des locales, un sélecteur de langue accessible (RGAA 8.3), les balises `hreflang`, et des tests i18n isolés avec Vitest.
> **Vrai outil :** vue-i18n v10 + Vitest + @vue/test-utils — projet Vite existant (pas de simulateur).
> **Feedback :** le coach valide en session — vérification visuelle du sélecteur + Vitest en vert.

---

## Énoncé

TribuZen SPA (`smaurier/tribuzen`) doit passer bilingue FR/EN. Le code existant charge tout en synchrone et l'attribut `lang` n'est jamais posé. Tu as trois objectifs fermes :

1. **Lazy loading** — `en.json` ne doit PAS être dans le bundle initial. Seule la locale détectée est chargée avant `app.mount()`.
2. **Accessibilité RGAA 8.3** — `<html lang>` se synchronise à chaque changement de locale. Le composant `LocaleSwitcher.vue` utilise `aria-pressed` et `lang` sur chaque bouton.
3. **Tests isolés** — deux tests Vitest : un sur `GroupCard.vue` (texte FR vs EN), un sur la synchronisation de `document.documentElement.lang`.

**Pas de gap-fill** — tu construis à partir du starter ci-dessous.

### Starter minimal

```
src/
  locales/
    fr.json          ← fichier JSON fourni ci-dessous
    en.json          ← fichier JSON fourni ci-dessous
  plugins/
    i18n.ts          ← vide à écrire
  utils/
    detectLocale.ts  ← vide à écrire
  components/
    LocaleSwitcher.vue  ← vide à écrire
    groups/
      GroupCard.vue      ← composant existant, tu y ajoutes data-testid
  tests/
    GroupCard.spec.ts    ← vide à écrire
    lang-sync.spec.ts    ← vide à écrire
  main.ts              ← existant, à modifier pour le bootstrap async
```

**Fichiers de traduction de départ :**

```json
// src/locales/fr.json
{
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler"
  },
  "groups": {
    "card": {
      "join": "Rejoindre",
      "leave": "Quitter",
      "members": "Aucun membre | {count} membre | {count} membres"
    },
    "list": {
      "title": "Mes groupes",
      "empty": "Aucun groupe pour l'instant."
    }
  }
}
```

```json
// src/locales/en.json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel"
  },
  "groups": {
    "card": {
      "join": "Join",
      "leave": "Leave",
      "members": "No members | {count} member | {count} members"
    },
    "list": {
      "title": "My groups",
      "empty": "No groups yet."
    }
  }
}
```

---

## Étapes (en friction)

1. **Écris `detectLocale.ts`** — lit `localStorage('tribuzen-locale')`, sinon `navigator.language.split('-')[0]`, sinon retourne `'fr'`. Type de retour `'fr' | 'en'`.

2. **Écris `plugins/i18n.ts`** — `createI18n` sans messages initiaux (`legacy: false`). Exporte `loadLocaleMessages(locale)` avec le cache `Set`. Exporte `SUPPORTED_LOCALES` et `SupportedLocale`.

3. **Modifie `main.ts`** — rends `bootstrap()` asynchrone : appel `detectLocale()`, puis `loadLocaleMessages()`, puis `app.mount()`. L'app ne se monte pas avant que la locale initiale soit prête.

4. **Écris `LocaleSwitcher.vue`** — deux boutons FR / EN avec `aria-pressed`, `lang` sur chaque bouton, `@click` qui appelle `loadLocaleMessages` + change `locale.value` + pose `document.documentElement.setAttribute('lang', …)`.

5. **Pose `data-testid="join-btn"` dans `GroupCard.vue`** sur le bouton rejoindre.

6. **Écris `GroupCard.spec.ts`** — factory `createTestI18n`, deux tests : bouton en FR = "Rejoindre", en EN = "Join". Troisième test : change `i18n.global.locale.value` → texte du bouton change après `$nextTick`.

7. **Écris `lang-sync.spec.ts`** — test qui change `locale.value`, simule le watcher (`document.documentElement.setAttribute('lang', val)`), vérifie `document.documentElement.getAttribute('lang')`.

8. **Lance Vitest** (`pnpm test --run`) → tous les tests en vert.

---

## Corrigé complet commenté

### `src/utils/detectLocale.ts`

```ts
export type SupportedLocale = 'fr' | 'en'
export const SUPPORTED_LOCALES: SupportedLocale[] = ['fr', 'en']
const STORAGE_KEY = 'tribuzen-locale'

export function detectLocale(): SupportedLocale {
  // 1. Préférence persistée — priorité maximale (choix explicite de l'utilisateur)
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale)) {
    return stored as SupportedLocale
  }

  // 2. Langue du navigateur — split('-')[0] pour ignorer la région (ex: 'fr-BE' → 'fr')
  const browserLang = navigator.language.split('-')[0]
  if (SUPPORTED_LOCALES.includes(browserLang as SupportedLocale)) {
    return browserLang as SupportedLocale
  }

  // 3. Fallback — langue par défaut TribuZen
  return 'fr'
}
```

### `src/plugins/i18n.ts`

```ts
import { createI18n } from 'vue-i18n'
import { detectLocale, type SupportedLocale, SUPPORTED_LOCALES } from '@/utils/detectLocale'

export type { SupportedLocale }
export { SUPPORTED_LOCALES }

// Instance sans messages — toutes les locales sont lazy-loadées
// legacy: false = mode Composition API (useI18n() fonctionne dans <script setup>)
export const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'fr',
})

// Cache en mémoire : évite de re-fetcher une locale déjà chargée
const loadedLocales = new Set<SupportedLocale>()

export async function loadLocaleMessages(locale: SupportedLocale): Promise<void> {
  // Idempotent : aucune action si déjà chargée
  if (loadedLocales.has(locale)) return

  // Import dynamique → Vite génère un chunk séparé pour chaque locale
  const messages = await import(`../locales/${locale}.json`)

  // setLocaleMessage injecte dans l'instance existante sans rechargement
  i18n.global.setLocaleMessage(locale, messages.default)
  loadedLocales.add(locale)
}

// Helper combiné : load + activate + sync lang attr
export async function setLocale(locale: SupportedLocale): Promise<void> {
  await loadLocaleMessages(locale)
  i18n.global.locale.value = locale
  document.documentElement.setAttribute('lang', locale)
  localStorage.setItem('tribuzen-locale', locale)
}
```

### `src/main.ts`

```ts
import { createApp } from 'vue'
import App from './App.vue'
import { i18n, loadLocaleMessages } from './plugins/i18n'
import { detectLocale } from './utils/detectLocale'

async function bootstrap(): Promise<void> {
  const locale = detectLocale()

  // Charger la locale initiale AVANT le premier rendu
  // Sans cet await, le template s'affiche brièvement avec les clés brutes
  await loadLocaleMessages(locale)

  // Synchroniser l'attribut lang dès le démarrage (RGAA 8.3)
  document.documentElement.setAttribute('lang', locale)

  const app = createApp(App)
  app.use(i18n)
  app.mount('#app')
}

bootstrap()
```

### `src/components/LocaleSwitcher.vue`

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { setLocale, SUPPORTED_LOCALES, type SupportedLocale } from '@/plugins/i18n'

const { locale } = useI18n()

// Labels lisibles pour l'aria-label
const localeLabels: Record<SupportedLocale, string> = {
  fr: 'Passer en français',
  en: 'Switch to English',
}
</script>

<template>
  <!--
    role="group" + aria-label : regroupe les boutons de choix de langue
    pour les technologies d'assistance (lecteurs d'écran, navigation clavier)
  -->
  <div role="group" aria-label="Choix de la langue">
    <button
      v-for="loc in SUPPORTED_LOCALES"
      :key="loc"
      :lang="loc"
      :aria-pressed="loc === locale ? 'true' : 'false'"
      :aria-label="localeLabels[loc as SupportedLocale]"
      :class="{ 'locale-btn--active': loc === locale }"
      @click="setLocale(loc as SupportedLocale)"
    >
      {{ loc.toUpperCase() }}
    </button>
  </div>
</template>

<style scoped>
button {
  padding: 0.3rem 0.7rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-weight: 500;
}

/* État actif : indique visuellement quelle langue est sélectionnée */
.locale-btn--active {
  background: #1e40af;
  color: #fff;
  border-color: #1e40af;
}
</style>
```

### `src/components/groups/GroupCard.vue` — ajout data-testid

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{ groupId: string; name: string }>()
const { t } = useI18n()
</script>

<template>
  <div class="group-card">
    <h3>{{ name }}</h3>
    <!--
      data-testid="join-btn" : sélecteur stable pour les tests
      (pas de classe CSS qui peut changer avec le design system)
    -->
    <button data-testid="join-btn">{{ t('groups.card.join') }}</button>
  </div>
</template>
```

### `tests/GroupCard.spec.ts`

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import GroupCard from '@/components/groups/GroupCard.vue'

// Factory isolée : chaque test crée sa propre instance
// Jamais d'instance globale partagée → pas de contamination entre tests
function createTestI18n(locale: 'fr' | 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'fr',
    messages: {
      fr: { groups: { card: { join: 'Rejoindre', leave: 'Quitter' } } },
      en: { groups: { card: { join: 'Join', leave: 'Leave' } } },
    },
  })
}

describe('GroupCard — traductions', () => {
  it('affiche le bouton rejoindre en français', () => {
    const wrapper = mount(GroupCard, {
      global: { plugins: [createTestI18n('fr')] },
      props: { groupId: 'g1', name: 'Famille Dupont' },
    })

    // data-testid est le sélecteur recommandé — résistant aux refactos CSS
    expect(wrapper.find('[data-testid="join-btn"]').text()).toBe('Rejoindre')
  })

  it('affiche le bouton Join en anglais', () => {
    const wrapper = mount(GroupCard, {
      global: { plugins: [createTestI18n('en')] },
      props: { groupId: 'g1', name: 'Dupont Family' },
    })

    expect(wrapper.find('[data-testid="join-btn"]').text()).toBe('Join')
  })

  it('réagit au changement de locale dans la même instance', async () => {
    const i18n = createTestI18n('fr')

    const wrapper = mount(GroupCard, {
      global: { plugins: [i18n] },
      props: { groupId: 'g1', name: 'Famille Dupont' },
    })

    // Vérification initiale
    expect(wrapper.find('[data-testid="join-btn"]').text()).toBe('Rejoindre')

    // Changer la locale dans l'instance partagée avec le composant
    i18n.global.locale.value = 'en'

    // $nextTick : attendre que Vue propage la réactivité → template re-render
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="join-btn"]').text()).toBe('Join')
  })
})
```

### `tests/lang-sync.spec.ts`

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createI18n } from 'vue-i18n'
import { watch, nextTick } from 'vue'

// Simule le composable useLocale — teste l'effet de bord sur document.documentElement
function simulateLangSync(i18n: ReturnType<typeof createI18n>) {
  // Reproduit exactement le watch du composable useLocale
  // { immediate: true } → le watcher s'exécute aussi à la création
  return watch(
    i18n.global.locale,
    (newLocale) => {
      document.documentElement.setAttribute('lang', newLocale as string)
    },
    { immediate: true },
  )
}

describe('attribut lang — synchronisation RGAA 8.3', () => {
  beforeEach(() => {
    // Isolation : reset l'attribut avant chaque test
    document.documentElement.removeAttribute('lang')
  })

  it('pose lang="fr" immédiatement au démarrage', () => {
    const i18n = createI18n({ legacy: false, locale: 'fr', messages: {} })
    simulateLangSync(i18n)

    // immediate: true → lang doit être posé sans aucun changement de locale
    expect(document.documentElement.getAttribute('lang')).toBe('fr')
  })

  it('met à jour lang quand la locale change', async () => {
    const i18n = createI18n({ legacy: false, locale: 'fr', messages: {} })
    simulateLangSync(i18n)

    // Changer la locale
    i18n.global.locale.value = 'en'

    // Attendre la propagation du watcher
    await nextTick()

    expect(document.documentElement.getAttribute('lang')).toBe('en')
  })

  it('repasse à fr si la locale revient à fr', async () => {
    const i18n = createI18n({ legacy: false, locale: 'en', messages: {} })
    simulateLangSync(i18n)

    i18n.global.locale.value = 'fr'
    await nextTick()

    expect(document.documentElement.getAttribute('lang')).toBe('fr')
  })
})
```

---

## Variante J+30 (fading)

Même objectif, **de mémoire en 30 minutes**, avec les contraintes suivantes :

1. Ajoute une troisième locale `'es'` (espagnol) avec un fichier `es.json` minimal. Le `detectLocale()` doit la supporter.
2. `LocaleSwitcher.vue` doit afficher les trois boutons sans modifier sa logique `v-for` (seul `SUPPORTED_LOCALES` change).
3. Écris un quatrième test Vitest qui vérifie que `'es'` est bien détecté depuis `navigator.language = 'es-ES'`.
4. **Sans ouvrir ce corrigé ni le module 42.**

**Critère de réussite :** Vitest vert sur 4 tests, `lang="es"` posé sur `<html>` quand l'utilisateur choisit l'espagnol.

---

## Application TribuZen

Dans le repo `smaurier/tribuzen`, ces fichiers vivent ici :

```
tribuzen/
  src/
    plugins/
      i18n.ts                         ← lazy loading + setLocale
    utils/
      detectLocale.ts                  ← localStorage → navigator → 'fr'
    locales/
      fr.json                          ← locale de référence (source de vérité TS)
      en.json                          ← chunk lazy
    components/
      LocaleSwitcher.vue               ← accessible, aria-pressed, lang attr
      groups/
        GroupCard.vue                  ← data-testid sur le bouton join
    tests/
      GroupCard.spec.ts
      lang-sync.spec.ts
```

**Différences prod vs lab :**
- En prod, `@vueuse/head` ou `@unhead/vue` gère le `useHead` pour les balises `hreflang` dans chaque vue.
- Le routing préfixé `/:locale(fr|en)` sera configuré dans `router/index.ts` — le lab isole uniquement les pièces i18n pour rester focalisé.
- Les types de clés sont déclarés dans `types/i18n.d.ts` (module augmentation vue-i18n) pour bénéficier de l'autocomplétion TS.

**Commit cible :**
```
feat(i18n): lazy locales + LocaleSwitcher accessible + tests lang-sync
```
