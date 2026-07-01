# Lab 13 — Transitions et animations

> **Outcome :** à la fin, tu sais animer le feed TribuZen avec `<TransitionGroup>` (ajout/suppression/réordonnancement de posts), ouvrir une modale avec `<Transition>` + `mode="out-in"`, et respecter `prefers-reduced-motion` dans les deux composants.
> **Vrai outil :** Vue 3.5 + Vite dev server (validation visuelle dans le navigateur).
> **Feedback :** le coach valide visuellement en session — pas de test-runner auto-correcteur.

---

## Énoncé

Tu construis deux composants du front-office TribuZen :

1. **`PostFeed.vue`** — le fil des publications familiales. Chaque post s'anime à l'entrée (glisse depuis le haut) et à la sortie (fondu vers le bas). Les posts restants se repositionnent en douceur via l'animation FLIP.
2. **`PostModal.vue`** — la modale de détail d'un post. S'ouvre avec un fade + légère montée, se ferme en fade.

**Contrainte non négociable :** les deux composants respectent `prefers-reduced-motion` (RGAA 13.8).

**Données de départ :**

```ts
interface Post {
  id: string
  author: string
  content: string
  createdAt: string
}

const posts = ref<Post[]>([
  { id: 'p1', author: 'Alice', content: 'Belle journée !', createdAt: '2026-07-01T09:00' },
  { id: 'p2', author: 'Bob', content: 'Brunch dimanche ?', createdAt: '2026-07-01T08:30' },
  { id: 'p3', author: 'Cara', content: 'Photos du jardin bientôt.', createdAt: '2026-07-01T07:45' },
])
```

**Pas de gap-fill** — tu construis les deux composants complets depuis les starters minimaux ci-dessous.

### Starters minimaux

Crée les deux fichiers dans ton projet Vite :

```vue
<!-- src/components/feed/PostFeed.vue — starter -->
<script setup lang="ts">
import { ref } from 'vue'

interface Post {
  id: string
  author: string
  content: string
  createdAt: string
}

// Colle ici les données de départ
// À toi : draftContent ref, addPost(), removePost(), submitPost()
</script>

<template>
  <!-- À construire : formulaire, TransitionGroup avec v-for, boutons de suppression -->
</template>

<style scoped>
/* À toi : .post-enter-active/from, .post-leave-active/to, .post-move, prefers-reduced-motion */
</style>
```

```vue
<!-- src/components/feed/PostModal.vue — starter -->
<script setup lang="ts">
interface Post {
  id: string
  author: string
  content: string
}

defineProps<{ post: Post | null; open: boolean }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <!-- À construire : Transition name="modal", overlay, modal-box, Transition name="fade" mode="out-in" -->
</template>

<style scoped>
/* À toi : .modal-enter-*/leave-*, .fade-enter-*/leave-*, prefers-reduced-motion */
</style>
```

Dans `App.vue`, branche les deux composants et lance `pnpm dev` pour valider visuellement.

---

## Étapes (en friction)

1. **`PostFeed.vue` — état et logique** : déclare `posts` avec les données de départ, `draftContent ref<string>`, et les fonctions `addPost()` (unshift en tête), `removePost()` (filter sur l'id), `submitPost()` (trim + guard vide + addPost + reset draft).

2. **`PostFeed.vue` — template** : écris le formulaire (`@submit.prevent="submitPost"`, `v-model` sur l'input, `:disabled` si draft vide), puis le `<TransitionGroup name="post" tag="ul" class="feed-list">` avec `v-for` + `:key="post.id"` et un bouton de suppression dans chaque `<li>`.

3. **`PostFeed.vue` — CSS d'animation** : écris `.post-enter-active`/`.post-leave-active` (transition opacity + transform), `.post-enter-from` (opacity 0 + translateY(-12px)), `.post-leave-to` (opacity 0 + translateY(8px)), `.post-move` (transition transform). Ajoute `position: absolute; width: 100%` sur `.post-leave-active` et `position: relative` sur `.feed-list`.

4. **`PostFeed.vue` — prefers-reduced-motion** : ajoute le bloc `@media (prefers-reduced-motion: reduce)` qui met `transition: none !important` sur les trois classes d'animation.

5. **`PostModal.vue` — structure** : enveloppe l'overlay dans `<Transition name="modal">`, vérifie que le `v-if="open"` est sur l'overlay. Dans la boîte, ajoute `<Transition name="fade" mode="out-in">` sur le contenu avec `:key="post?.id"` et `v-if="post"`.

6. **`PostModal.vue` — CSS + prefers-reduced-motion** : écris les classes `.modal-enter-active`/`leave-active` (fade de l'overlay), `.modal-enter-active .modal-box` (transition transform + opacity), `.modal-enter-from .modal-box` (translateY(16px) + opacity 0), les classes `.fade-*` (fade simple 0.15s), puis le bloc `@media (prefers-reduced-motion: reduce)` qui couvre toutes les transitions.

7. **Validation manuelle** : active "Réduire les animations" dans ton OS → recharge → vérifie que les transitions ont disparu. Désactive → elles reviennent. Les deux composants doivent passer ce test.

---

## Corrigé complet commenté

### PostFeed.vue

```vue
<!-- PostFeed.vue — corrigé -->
<script setup lang="ts">
import { ref } from 'vue'

interface Post {
  id: string
  author: string
  content: string
  createdAt: string
}

// Données initiales — en production viendrait d'un composable useFeed()
const posts = ref<Post[]>([
  { id: 'p1', author: 'Alice', content: 'Belle journée !', createdAt: '2026-07-01T09:00' },
  { id: 'p2', author: 'Bob', content: 'Brunch dimanche ?', createdAt: '2026-07-01T08:30' },
  { id: 'p3', author: 'Cara', content: 'Photos du jardin bientôt.', createdAt: '2026-07-01T07:45' },
])

let nextId = 4

// draftContent : contrôlé par v-model — ref<string> inféré depuis ''
const draftContent = ref('')

function addPost(content: string): void {
  // unshift() → insère en tête de liste
  // Le nouveau post arrive du haut → translateY(-12px) → 0 est cohérent
  posts.value.unshift({
    id: `p${nextId++}`,
    author: 'Moi',
    content,
    createdAt: new Date().toISOString(),
  })
}

function removePost(id: string): void {
  // filter() → crée un nouveau tableau sans l'élément supprimé
  // Préférable à splice() : Vue détecte mieux le remplacement de la ref
  posts.value = posts.value.filter(p => p.id !== id)
}

function submitPost(): void {
  const text = draftContent.value.trim()
  if (!text) return // guard : ne pas publier un message vide
  addPost(text)
  draftContent.value = '' // vide le champ après publication
}
</script>

<template>
  <div class="feed">
    <!-- Formulaire de publication -->
    <form @submit.prevent="submitPost" class="feed-form">
      <input
        v-model="draftContent"
        placeholder="Quoi de neuf ?"
        class="feed-input"
      />
      <!-- :disabled quand le champ est vide (après trim) -->
      <button type="submit" :disabled="!draftContent.trim()">Publier</button>
    </form>

    <!--
      TransitionGroup :
      - name="post" → classes .post-enter-from, .post-leave-active, .post-move...
      - tag="ul" → génère un <ul> dans le DOM (pas de wrapper "fantôme")
      - class="feed-list" → doit avoir position: relative (voir CSS)
    -->
    <TransitionGroup name="post" tag="ul" class="feed-list">
      <!--
        :key="post.id" → id stable (UUID ou id BDD), jamais l'index.
        Vue traque chaque post individuellement pour l'animation.
        Si on utilisait :key="index", supprimer un post du milieu
        déclencherait de fausses transitions sur tous les posts suivants.
      -->
      <li v-for="post in posts" :key="post.id" class="feed-item">
        <header class="feed-item-header">
          <strong>{{ post.author }}</strong>
          <!-- datetime en ISO pour l'accessibilité (lecteurs d'écran) -->
          <time :datetime="post.createdAt">
            {{ new Date(post.createdAt).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' }) }}
          </time>
        </header>
        <p class="feed-item-content">{{ post.content }}</p>
        <!-- aria-label pour le bouton icône -->
        <button
          @click="removePost(post.id)"
          class="remove-btn"
          aria-label="Supprimer ce post"
        >×</button>
      </li>
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* ─── Animations ─────────────────────────────────────────────────────────── */

/*
  enter-active et leave-active : définissent COMMENT l'animation se déroule.
  On anime uniquement transform + opacity (compositor thread, 60fps garanti).
  Jamais top/left/width/height — déclenche un reflow à chaque frame.
*/
.post-enter-active,
.post-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

/*
  enter-from : état de DÉPART de l'entrée (appliqué pendant 1 frame).
  Le post vient du haut (-12px) et est invisible.
  translateY(-12px) → 0 = glissement vers le bas en apparaissant.
  Cohérent avec unshift() qui insère en tête.
*/
.post-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}

/*
  leave-to : état FINAL de la sortie.
  Le post part légèrement vers le bas en devenant invisible.
  Différencier la direction entrée (-12px) / sortie (+8px) = plus naturel.
*/
.post-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/*
  post-move : animation FLIP (First Last Invert Play) pour les éléments
  qui se repositionnent après une suppression.
  Vue calcule les positions avant/après automatiquement.
  On fournit juste la durée/easing.
*/
.post-move {
  transition: transform 0.35s ease;
}

/*
  CRITIQUE : position: absolute pendant la sortie.
  Sans ça : l'élément qui sort reste dans le flux → occupe de l'espace
  → les autres ne peuvent pas commencer leur FLIP avant la fin de la sortie
  → saut brusque visible.
  Avec position: absolute : sort du flux immédiatement → FLIP commence de suite.
*/
.post-leave-active {
  position: absolute;
  width: 100%; /* OBLIGATOIRE : sans ça, l'élément rétrécit à 0 hors du flux */
}

/*
  prefers-reduced-motion — OBLIGATOIRE (RGAA 13.8 + nécessité médicale).
  Désactive toutes les transitions pour les utilisateurs avec troubles
  vestibulaires, épilepsie photosensible, migraines.
  !important pour surpasser la spécificité des classes Vue appliquées en runtime.
*/
@media (prefers-reduced-motion: reduce) {
  .post-enter-active,
  .post-leave-active,
  .post-move {
    transition: none !important;
  }
}

/* ─── Layout ─────────────────────────────────────────────────────────────── */

/*
  position: relative OBLIGATOIRE sur le conteneur TransitionGroup.
  Les éléments en .post-leave-active { position: absolute } se positionnent
  par rapport à ce contexte de positionnement.
  Sans ça, ils s'échappent vers la page entière.
*/
.feed-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0 0;
  position: relative;
}

.feed-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
}

.feed-item-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.25rem;
}

.feed-item-content {
  margin: 0.25rem 0 0.5rem;
  color: #334155;
}

.remove-btn {
  display: block;
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  font-size: 1.1rem;
  padding: 0;
  margin-left: auto;
}

.feed-form {
  display: flex;
  gap: 0.5rem;
}

.feed-input {
  flex: 1;
  padding: 0.4rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.95rem;
}
</style>
```

### PostModal.vue

```vue
<!-- PostModal.vue — corrigé -->
<script setup lang="ts">
// Interface inline — importer depuis src/types/post.ts en production
interface Post {
  id: string
  author: string
  content: string
}

defineProps<{
  post: Post | null
  open: boolean
}>()

defineEmits<{ close: [] }>()
</script>

<template>
  <!--
    Transition sur l'overlay complet.
    name="modal" → classes .modal-enter-from, .modal-leave-active, etc.
    Pas de mode="out-in" ici : on anime l'overlay entier (pas deux états alternatifs).
  -->
  <Transition name="modal">
    <!--
      v-if="open" sur l'overlay : quand open passe à false,
      Vue déclenche la transition de sortie AVANT de retirer le DOM.
    -->
    <div v-if="open" class="modal-overlay" @click="$emit('close')">
      <!--
        @click.stop : empêche la propagation vers .modal-overlay.
        Sans ça, cliquer dans la boîte ferme la modale.
      -->
      <div class="modal-box" @click.stop>

        <!--
          Transition sur le contenu interne (pas sur la boîte elle-même).
          mode="out-in" : si l'utilisateur navigue d'un post à un autre
          pendant que la modale est ouverte, l'ancien contenu sort d'abord.
          :key="post?.id" : force un re-enter si le post change.
          L'opérateur ?. évite une erreur si post est null pendant la sortie.
        -->
        <Transition name="fade" mode="out-in">
          <div v-if="post" :key="post.id" class="modal-content">
            <p class="modal-author">{{ post.author }}</p>
            <p class="modal-text">{{ post.content }}</p>
          </div>
        </Transition>

        <button class="modal-close" @click="$emit('close')">Fermer</button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ─── Transition principale de la modale ─────────────────────────────────── */

/* Fade de l'overlay */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/*
  La boîte a sa propre transition en plus du fade de l'overlay.
  On cible .modal-box DANS .modal-enter-active (CSS scoped — valide).
  La boîte monte de 16px (translateY — compositor, pas de reflow).
  Note : on n'anime la montée qu'à l'ENTRÉE (pas de descente à la sortie,
  moins agréable visuellement).
*/
.modal-enter-active .modal-box {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.modal-enter-from .modal-box {
  transform: translateY(16px);
  opacity: 0;
}

/* ─── Transition du contenu interne ──────────────────────────────────────── */

/* Fade simple, plus court que la modale (0.15s vs 0.25s) */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ─── prefers-reduced-motion — OBLIGATOIRE ───────────────────────────────── */

/*
  Un seul bloc couvre tous les éléments animés du composant.
  !important nécessaire pour surpasser les classes Vue.
*/
@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active,
  .modal-enter-active .modal-box,
  .fade-enter-active,
  .fade-leave-active {
    transition: none !important;
  }
}

/* ─── Layout ─────────────────────────────────────────────────────────────── */

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-box {
  background: #fff;
  border-radius: 10px;
  padding: 1.5rem;
  max-width: 480px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.modal-author {
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem;
}

.modal-text {
  color: #475569;
  margin: 0 0 1rem;
}

.modal-close {
  display: block;
  margin-left: auto;
  padding: 0.4rem 1rem;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
}
</style>
```

---

## Variante J+30 (fading)

**Même objectif, contraintes ajoutées — en 30 minutes, de mémoire :**

1. **Hooks JS dans `PostFeed.vue`** : remplace les classes CSS par des hooks `@before-enter`/`@enter`/`@leave` avec `:css="false"`. L'animation visuelle reste identique (opacity + translateY), mais implémentée en `el.style.transition = ...` et `requestAnimationFrame`.
2. **prefers-reduced-motion en JS** : dans chaque hook, vérifier `window.matchMedia('(prefers-reduced-motion: reduce)').matches` et appeler `done()` immédiatement si `true` (aucune animation).
3. **Sans ouvrir ce corrigé** ni le module 13.

**Critère de réussite :** le feed s'anime visuellement dans le navigateur, et les animations sont absentes quand "Réduire les animations" est activé dans l'OS.

---

## Application TribuZen

Dans `smaurier/tribuzen`, les composants vivent ici :

```
tribuzen/
  src/
    components/
      feed/
        PostFeed.vue     ← TransitionGroup sur les posts (temps réel)
        PostModal.vue    ← Transition + mode="out-in" (vue détaillée)
```

**Différences par rapport au lab :**

- `posts` viendra d'un composable `useFeed()` (WebSocket + polling) au lieu d'un `ref` local — la structure de la liste et les animations sont identiques.
- L'interface `Post` sera importée depuis `src/types/post.ts` (partagée avec les types générés depuis le backend NestJS).
- `PostModal.vue` recevra la prop `post` depuis `FeedPage.vue` via `v-if` + `:key` — la gestion d'état de la modale (ouverte/fermée, post sélectionné) relève du module Vue Router (prochain module).

**Commit cible :**

```
feat(feed): PostFeed + PostModal — Transition/TransitionGroup + prefers-reduced-motion RGAA 13.8
```
