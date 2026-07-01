# Lab 44 — Sécurité front

> **Outcome :** à la fin, tu sais sécuriser un composant `v-html` avec DOMPurify, poser les en-têtes de sécurité via Nuxt `routeRules`, et auditer les dépendances avec `pnpm audit`.
> **Vrai outil :** DOMPurify 3.x + pnpm audit + Nuxt 3 `routeRules` (ou Vite `vite-plugin-html` si SPA).
> **Feedback :** le coach valide en session — vérification visuelle du rendu et inspection des headers HTTP dans DevTools Network.

---

## Énoncé

Tu travailles sur le feed de la page d'accueil TribuZen. Les posts de famille contiennent du HTML riche produit par Tiptap (gras, italique, liens). Le composant `PostContent.vue` doit afficher ce HTML **sans créer de faille XSS**.

Trois tâches indépendantes, à faire dans l'ordre :

**Tâche A — Sécuriser `PostContent.vue`**
Implémenter `PostContent.vue` qui affiche le HTML d'un post via `v-html`, sanitizé avec DOMPurify. Le composant reçoit deux props : `content: string` (HTML) et `authorName: string` (texte brut).

**Tâche B — Poser les en-têtes de sécurité**
Dans `nuxt.config.ts` (ou `vite.config.ts` si SPA via plugin), configurer les en-têtes : CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`.

**Tâche C — Audit des dépendances**
Lancer `pnpm audit`, interpréter la sortie, et configurer le script CI pour bloquer sur les vulnérabilités high/critical.

**Pas de gap-fill** — tu produis les fichiers complets à partir du starter minimal.

---

## Starter minimal

### Tâche A — `PostContent.vue`

Dans ton projet Nuxt/Vue, crée `src/components/post/PostContent.vue` :

```vue
<!-- PostContent.vue — starter -->
<script setup lang="ts">
// À toi : importer computed et DOMPurify, définir les props, créer safeContent
</script>

<template>
  <!-- À toi : afficher authorName en interpolation, content via v-html sanitizé -->
</template>
```

Installe DOMPurify si ce n'est pas déjà fait :

```bash
pnpm add dompurify
pnpm add -D @types/dompurify
```

Teste avec ces données dans un composant parent ou dans `app.vue` :

```ts
const testPost = {
  authorName: 'Alice',
  // HTML légitime mêlé à des payloads XSS
  content: `<p>Bonjour <strong>la famille</strong> !</p>
<img src=x onerror="document.title='XSS'">
<a href="javascript:alert('xss')">cliquez</a>
<script>document.title='pwned'<\/script>`
}
```

**Critère de réussite :** le navigateur affiche le texte et le gras, mais le titre de la page ne change pas à `'XSS'` ni `'pwned'`, et aucune alerte ne s'affiche.

### Tâche B — En-têtes de sécurité

Projet Nuxt : modifier `nuxt.config.ts` pour ajouter les headers via `routeRules`.
Projet Vite SPA : utiliser le middleware de serveur de développement ou configurer le serveur de prod (Nginx/Caddy).

### Tâche C — Audit

```bash
# Depuis la racine du projet
pnpm audit
```

---

## Étapes (en friction)

### Tâche A

1. **Installe DOMPurify** — `pnpm add dompurify && pnpm add -D @types/dompurify`.
2. **Définis les props** — `defineProps<{ content: string; authorName: string }>()`.
3. **Crée `safeContent`** — `computed(() => DOMPurify.sanitize(props.content))`. Importe `computed` depuis `vue` et `DOMPurify` depuis `dompurify`.
4. **Template** — `{{ props.authorName }}` pour le nom (interpolation, pas `v-html`), `v-html="safeContent"` pour le corps du post.
5. **Teste le payload XSS** — colle les données de test, inspecte le DOM dans DevTools. Vérifie que `onerror`, le `href="javascript:..."` et le `<script>` ont disparu.

### Tâche B

6. **Dans `nuxt.config.ts`** — ajoute une clé `nitro.routeRules` avec une règle `'/**'` contenant les headers.
7. **Inclure au minimum** : `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`.
8. **Vérifie** — `pnpm dev`, ouvre DevTools → Network → sélectionne une requête de page → onglet Headers → section Response Headers. Les headers doivent apparaître.

### Tâche C

9. **Lance `pnpm audit`** — lis la sortie : nombre de vulnérabilités, leur niveau (low/moderate/high/critical), le package concerné.
10. **Configure le script CI** — dans `package.json`, ajoute `"audit:ci": "pnpm audit --audit-level=high"`. Ce script retourne un code non-zéro si high ou critical est trouvé.
11. **Ajoute-le dans `.github/workflows/ci.yml`** — une étape `run: pnpm audit:ci` après l'installation des dépendances.

---

## Corrigé complet commenté

### Tâche A — `PostContent.vue`

```vue
<!-- src/components/post/PostContent.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import DOMPurify from 'dompurify'

// Props typées : content = HTML brut de l'API, authorName = texte brut
const props = defineProps<{
  content: string
  authorName: string
}>()

// DOMPurify.sanitize() est synchrone — safe to call in computed
// Par défaut : conserve les tags HTML de présentation (p, strong, em, ul, a href https)
//             retire : <script>, onclick, onerror, href="javascript:", data: URIs dangereuses
const safeContent = computed(() => DOMPurify.sanitize(props.content))
// Pas d'options supplémentaires nécessaires pour l'usage de base :
// DOMPurify est sûr par défaut (allowlist de tags, pas blocklist)
</script>

<template>
  <article class="post">
    <!-- authorName est du texte brut — {{ }} suffit, Vue échappe automatiquement -->
    <!-- Jamais v-html ici même si on voulait styler le nom -->
    <header class="post__author">{{ props.authorName }}</header>

    <!-- v-html UNIQUEMENT sur safeContent (computed DOMPurify) — jamais sur props.content brut -->
    <!-- Le computed garantit que la sanitization est rejouée si props.content change -->
    <div class="post__body" v-html="safeContent" />
  </article>
</template>

<style scoped>
.post {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
}

.post__author {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1e293b;
}

/* Les styles des balises internes (strong, em...) ne sont pas scoped
   car v-html injecte du DOM hors du scope Vue */
.post__body :deep(strong) { font-weight: 700; }
.post__body :deep(a) { color: #3b82f6; text-decoration: underline; }
</style>
```

**Vérification du payload de test :**

```ts
// Ce que DOMPurify fait sur le content de test :
DOMPurify.sanitize(`<p>Bonjour <strong>la famille</strong> !</p>
<img src=x onerror="document.title='XSS'">
<a href="javascript:alert('xss')">cliquez</a>
<script>document.title='pwned'<\/script>`)

// Résultat :
// <p>Bonjour <strong>la famille</strong> !</p>
// <img src="x">                         ← onerror retiré
// <a>cliquez</a>                         ← href javascript: retiré
//                                        ← script entièrement supprimé
```

### Tâche B — `nuxt.config.ts` avec en-têtes de sécurité

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    routeRules: {
      // Appliqué à toutes les routes
      '/**': {
        headers: {
          // CSP — toutes les directives sur une seule valeur string
          // object-src 'none' : bloque les plugins Flash/Java (obsolètes mais attaque encore possible)
          // frame-ancestors 'none' : bloque le clickjacking (iframes)
          // upgrade-insecure-requests : force HTTPS pour les sous-ressources
          'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline'",   // unsafe-inline nécessaire pour Nuxt SSR sans nonce configuré
            "img-src 'self' data: https://storage.tribuzen.app",
            "connect-src 'self' https://api.tribuzen.app",
            "font-src 'self'",
            "object-src 'none'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "upgrade-insecure-requests",
          ].join('; '),

          // HSTS — force HTTPS pour 1 an, incluant les sous-domaines
          // max-age en secondes : 31 536 000 = 365 jours
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

          // Empêche le navigateur de deviner le MIME type d'une réponse
          // protège contre les attaques MIME sniffing (ex: un .jpg qui contient du JS)
          'X-Content-Type-Options': 'nosniff',

          // Envoie l'origine (sans path) pour les requêtes cross-origin
          // n'envoie rien pour les navigations HTTP→HTTPS
          'Referrer-Policy': 'strict-origin-when-cross-origin',

          // Désactive les APIs navigateur non utilisées par TribuZen
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        },
      },
    },
  },
})
```

**Tester les headers :**
```bash
# Avec curl (dev server tournant sur port 3000)
curl -I http://localhost:3000 | grep -i "content-security\|strict-transport\|x-content"
```

### Tâche C — Audit et CI

```bash
# Sortie typique de pnpm audit
pnpm audit

# ┌──────────────────────────────────────────────────────────────┐
# │                       === audit report ===                    │
# │ found 0 vulnerabilities                                       │
# └──────────────────────────────────────────────────────────────┘
# → OK : aucune vulnérabilité

# Si vulnérabilités trouvées :
# ┌──────────┬───────────────┬──────────────────────────────────┐
# │ moderate │ GHSA-xxxx     │ prototype pollution in lodash    │
# │ high     │ GHSA-yyyy     │ ReDoS in some-package@1.2.3      │
# └──────────┴───────────────┴──────────────────────────────────┘
# pnpm audit --fix pour tenter une correction automatique
```

```json
// package.json — script CI
{
  "scripts": {
    "audit:ci": "pnpm audit --audit-level=high"
  }
}
```

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      # Échoue si une vulnérabilité high ou critical est détectée
      # moderate et low sont signalées mais ne bloquent pas le build
      - name: Security audit
        run: pnpm audit:ci
```

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — en 30 minutes, sans ouvrir ce corrigé :**

1. Ajoute une prop optionnelle `allowedTags: string[]` à `PostContent.vue`. Quand elle est fournie, passe-la à DOMPurify pour restreindre les tags autorisés au-delà du défaut. Exemple : `['p', 'strong', 'em']` pour un contexte encore plus restrictif.
   - API DOMPurify : `DOMPurify.sanitize(html, { ALLOWED_TAGS: allowedTags })`.
2. Ajoute `'nonce-abc123'` à `script-src` dans la CSP et retire `'unsafe-inline'` de `style-src`. Justifie pourquoi `unsafe-inline` dans `style-src` est moins critique que dans `script-src`.
3. Ecris un test unitaire Vitest qui vérifie que `PostContent.vue` n'exécute pas de XSS : monter le composant avec un `content` contenant `<script>window.__xss=1</script>` et vérifier que `window.__xss` reste `undefined` après rendu.

---

## Application TribuZen

```
tribuzen/
  src/
    components/
      post/
        PostContent.vue             ← Tâche A — DOMPurify sur v-html
  nuxt.config.ts                    ← Tâche B — CSP + headers Nitro
  package.json                      ← Tâche C — script audit:ci
  .github/workflows/ci.yml          ← Tâche C — step pnpm audit:ci
```

**Différences par rapport au lab :**
- En production, le nonce CSP est généré dynamiquement par Nuxt pour chaque requête SSR (via `useNuxtApp().$config.cspNonce` ou le module `nuxt-security`) — le lab utilise une valeur statique pour simplifier.
- `PostContent.vue` recevra `content` depuis le store Pinia (module 15) qui le charge via l'API — dans le lab, les props sont passées directement depuis le parent.

**Commit cible :**
```
feat(security): PostContent DOMPurify + CSP headers + pnpm audit CI
```
