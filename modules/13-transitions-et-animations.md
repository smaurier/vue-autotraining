---
titre: Transitions et animations
cours: 02-vue
notions: [composant Transition, classes de transition enter et leave, TransitionGroup et listes, transitions par la clé, hooks JavaScript de transition, animations avec bibliothèque, prefers-reduced-motion et accessibilité, performance des animations transform opacity]
outcomes:
  - sait animer l'apparition/disparition d'un élément avec Transition
  - sait animer une liste (ajout/retrait/réordonnancement) avec TransitionGroup
  - sait respecter prefers-reduced-motion (obligation d'accessibilité)
  - sait choisir des propriétés animées performantes (transform, opacity)
prerequis: [12-slots-avances]
next: 14-vue-router
libs: [{ name: vue, version: "3.5" }]
tribuzen: front-office TribuZen — transitions du feed famille (apparition des posts, réordonnancement de la liste), respect strict de prefers-reduced-motion (RGAA)
last-reviewed: 2026-07
---

← [Module 12 — Slots avancés](./12-slots-avances.md)

# Transitions et animations

> **Outcomes — tu sauras FAIRE :** animer l'apparition/disparition d'un élément avec `<Transition>`, animer une liste avec `<TransitionGroup>`, respecter `prefers-reduced-motion` (obligation médicale), choisir `transform`/`opacity` pour des animations performantes.
> **Difficulté :** :star::star::star:

---

## 1. Cas concret d'abord

Tu travailles sur le feed familial de TribuZen. Un nouveau post arrive en temps réel : sans animation, il "pop" brutalement en tête de liste. Tu dois l'animer pour qu'il glisse depuis le haut. Mais ta collègue Manon utilise TribuZen avec "Réduire les animations" activé dans iOS — elle souffre de troubles vestibulaires (vertiges déclenchés par le mouvement). Lui imposer des animations la rend physiquement malade.

Voici le feed aujourd'hui :

```vue
<!-- PostFeed.vue — AVANT : brutal, non accessible -->
<script setup lang="ts">
import { ref } from 'vue'

interface Post {
  id: string
  author: string
  content: string
}

const posts = ref<Post[]>([
  { id: 'p1', author: 'Alice', content: 'Belle journée !' },
])

function addPost(content: string): void {
  posts.value.unshift({ id: crypto.randomUUID(), author: 'Moi', content })
}
</script>

<template>
  <!-- ❌ Pas d'animation — apparition brutale -->
  <!-- ❌ Aucun respect de prefers-reduced-motion -->
  <ul>
    <li v-for="post in posts" :key="post.id">
      {{ post.author }} : {{ post.content }}
    </li>
  </ul>
</template>
```

**Deux problèmes à résoudre :**
1. Les posts apparaissent/disparaissent sans transition — mauvaise expérience visuelle.
2. Même si on ajoute des animations, elles ignoreront `prefers-reduced-motion` — obligation RGAA non remplie.

Ce module te donne les outils pour les deux.

---

## 2. Théorie complète, concise

### 2.1 Le composant `<Transition>`

`<Transition>` est un composant built-in Vue (pas d'import nécessaire). Il enveloppe **un seul enfant direct** et lui applique des classes CSS à l'entrée et à la sortie.

Déclencheurs valides : `v-if`, `v-show`, ou `<component :is="...">` dynamique.

```vue
<template>
  <button @click="show = !show">Afficher / Masquer</button>

  <!-- name="fade" → préfixe des classes CSS : .fade-enter-from, .fade-leave-active, etc. -->
  <Transition name="fade">
    <p v-if="show">Je suis là !</p>
  </Transition>
</template>
```

Règles :
- `<Transition>` doit avoir **exactement un enfant direct** — pas un fragment `<template>` contenant plusieurs éléments.
- L'enfant doit être conditionnel ou dynamique — une `<div>` toujours visible ne déclenche aucune animation.
- `name` est optionnel : sans `name`, les classes s'appellent `.v-enter-from`, `.v-leave-active`, etc.

#### Mode `out-in` et `in-out`

Par défaut, l'ancien élément sort **en même temps** que le nouveau entre. Pour les switchers de vues, ça donne une superposition indésirable.

```vue
<!-- mode="out-in" : l'ancien part → PUIS le nouveau arrive -->
<Transition name="fade" mode="out-in">
  <component :is="currentView" :key="currentView" />
</Transition>
```

`mode="in-out"` fait l'inverse (nouveau entre pendant que l'ancien attend — rare). `mode="out-in"` couvre 95% des cas.

---

### 2.2 Les 6 classes CSS enter / leave

Vue gère 6 classes automatiquement. Avec `name="post"` :

| Classe               | Phase          | Rôle                                                   |
|----------------------|----------------|--------------------------------------------------------|
| `.post-enter-from`   | Entrée — F0    | État initial avant que l'élément soit visible          |
| `.post-enter-active` | Entrée — durée | Définit la `transition` CSS pendant toute l'entrée     |
| `.post-enter-to`     | Entrée — fin   | État cible (l'état "normal" — souvent pas besoin de définir) |
| `.post-leave-from`   | Sortie — F0    | État initial de la sortie (état "normal")              |
| `.post-leave-active` | Sortie — durée | Définit la `transition` CSS pendant toute la sortie    |
| `.post-leave-to`     | Sortie — fin   | État final de la sortie (invisible, décalé...)         |

Chronologie d'une **entrée** :

```
Frame 0                  Pendant la transition          Fin
[.post-enter-from]  →  [.post-enter-active]  →  [.post-enter-to]
opacity: 0               transition: opacity            (état normal)
translateY(-12px)          0.3s ease
```

CSS minimal pour un fade :

```css
/* Durée et easing de la transition (entrée ET sortie) */
.post-enter-active,
.post-leave-active {
  transition: opacity 0.3s ease;
}

/* État de départ de l'entrée + état d'arrivée de la sortie */
.post-enter-from,
.post-leave-to {
  opacity: 0;
}

/* .post-enter-to et .post-leave-from = opacity: 1 par défaut — pas besoin de les définir */
```

---

### 2.3 `<TransitionGroup>` et listes

`<Transition>` n'anime qu'un seul élément. Pour une liste (`v-for`), Vue fournit `<TransitionGroup>`.

| | `<Transition>` | `<TransitionGroup>` |
|---|---|---|
| Nombre d'enfants | 1 | Plusieurs (liste) |
| Balise DOM générée | Aucune | Selon `tag` (défaut: aucune en Vue 3) |
| `:key` obligatoire | Non | **Oui** — sur chaque enfant |
| Classe `.xxx-move` | Non | **Oui** — repositionnement FLIP |

```vue
<!-- tag="ul" → génère un <ul> dans le DOM -->
<!-- Sans tag → aucun wrapper DOM (Vue 3) -->
<TransitionGroup name="post" tag="ul" class="feed-list">
  <li v-for="post in posts" :key="post.id">
    {{ post.content }}
  </li>
</TransitionGroup>
```

#### Classe `.xxx-move` — animation FLIP

Quand un élément est supprimé du milieu d'une liste, les éléments restants se repositionnent. Sans `.post-move`, ce repositionnement est brutal. La classe `.post-move` anime ce glissement en utilisant la technique FLIP (First Last Invert Play) — Vue calcule les positions avant/après, tu fournis juste la durée :

```css
.post-move {
  transition: transform 0.35s ease;
}
```

#### Astuce `position: absolute` sur `.xxx-leave-active`

Sans cette règle, l'élément qui sort **occupe encore de l'espace** dans le flux pendant son animation — les éléments restants ne peuvent pas se repositionner avant que la sortie soit terminée (saut brutal). La solution :

```css
.post-leave-active {
  position: absolute; /* sort du flux immédiatement → FLIP commence de suite */
  width: 100%;        /* ne pas oublier — sinon l'élément rétrécit à 0 */
}
```

Le conteneur `<TransitionGroup>` doit avoir `position: relative` pour que `position: absolute` des enfants se positionne correctement.

---

### 2.4 Transitions par la clé

Changer la `:key` d'un élément force Vue à le **détruire et recréer**, ce qui déclenche la transition même sans `v-if`. Utile pour les compteurs, les notifications, les slides.

```vue
<Transition name="fade" mode="out-in">
  <!-- Chaque fois que currentStep change → transition déclenchée -->
  <div :key="currentStep">
    Étape {{ currentStep }} sur 5
  </div>
</Transition>
```

| Technique | Déclencheur | Usage typique |
|---|---|---|
| `v-if` / `v-show` | Valeur booléenne | Apparition/disparition |
| `<component :is>` | Changement de composant | Onglets, routeur |
| `:key` | Changement de la valeur | Même élément, contenu différent |

---

### 2.5 Hooks JavaScript de transition

Pour des animations contrôlées par une lib externe ou des valeurs calculées à runtime, Vue expose des événements sur `<Transition>` :

```vue
<Transition
  @before-enter="onBeforeEnter"
  @enter="onEnter"
  @after-enter="onAfterEnter"
  @leave="onLeave"
  @after-leave="onAfterLeave"
  :css="false"
>
  <div v-if="show">Contenu</div>
</Transition>
```

```ts
// el est typé Element par Vue — cast en HTMLElement pour accéder à .style
function onBeforeEnter(el: Element): void {
  // Initialiser l'état de départ (avant le premier paint)
  ;(el as HTMLElement).style.opacity = '0'
}

function onEnter(el: Element, done: () => void): void {
  // done() DOIT être appelé pour signaler la fin à Vue
  const htmlEl = el as HTMLElement
  requestAnimationFrame(() => {
    htmlEl.style.transition = 'opacity 0.3s ease'
    htmlEl.style.opacity = '1'
  })
  setTimeout(done, 300) // 300ms = durée de la transition
}

function onLeave(el: Element, done: () => void): void {
  const htmlEl = el as HTMLElement
  htmlEl.style.transition = 'opacity 0.2s ease'
  htmlEl.style.opacity = '0'
  setTimeout(done, 200)
}
```

`:css="false"` est **obligatoire** quand tu gères l'animation en JS — ça empêche Vue d'ajouter les classes CSS qui interféreraient avec le code JS.

Tous les hooks disponibles :
- `@before-enter`, `@enter(el, done)`, `@after-enter`, `@enter-cancelled`
- `@before-leave`, `@leave(el, done)`, `@after-leave`, `@leave-cancelled`

---

### 2.6 Animations avec une bibliothèque

L'intégration d'une lib comme GSAP passe par les hooks JS. GSAP gère le timing — `done()` est passé en `onComplete` :

```ts
import { gsap } from 'gsap'

function onEnter(el: Element, done: () => void): void {
  gsap.from(el, {
    opacity: 0,
    y: -20,
    duration: 0.3,
    ease: 'power2.out',
    onComplete: done, // Vue sait que c'est fini quand GSAP termine
  })
}

function onLeave(el: Element, done: () => void): void {
  gsap.to(el, {
    opacity: 0,
    y: 20,
    duration: 0.2,
    ease: 'power2.in',
    onComplete: done,
  })
}
```

> ⚠️ À vérifier avec Context7 (`/vue`) si tu utilises GSAP 3.12+ — l'API `gsap.from` est stable mais les intégrations ScrollTrigger ont évolué depuis 3.5.

**Règle :** préfère la solution **CSS pure** pour les animations simples (90% des cas). GSAP n'est justifié que pour des séquences complexes (morphing SVG, physics, scroll-driven) impossibles en CSS.

---

### 2.7 `prefers-reduced-motion` — obligation médicale

`prefers-reduced-motion` est une préférence système que l'utilisateur active dans :
- **iOS** : Réglages → Accessibilité → Mouvement → Réduire le mouvement
- **Android** : Paramètres → Accessibilité → Enlever les animations
- **macOS / Windows** : Accessibilité → Réduire le mouvement

**Qui est concerné :** personnes atteintes de troubles vestibulaires (PPPD, névrite vestibulaire, Ménière, labyrintite), d'épilepsie photosensible, de migraines chroniques. Pour elles, les animations de parallaxe, les slides rapides ou les fondus longs peuvent déclencher vertiges, nausées, ou crises. Ce n'est **pas une préférence esthétique** — c'est une nécessité médicale.

**RGAA (France) :** critère 13.8 — tout contenu en mouvement doit pouvoir être arrêté ou pausé par l'utilisateur. `prefers-reduced-motion` est le mécanisme système reconnu pour satisfaire ce critère. Une animation non contrôlable détectée en audit = **non-conformité bloquante**.

**WCAG :** critère 2.3.3 (AAA) — Animation from Interactions.

#### Solution CSS (recommandée pour les transitions Vue)

```css
/* En fin de bloc d'animations — surpasse la spécificité via !important */
@media (prefers-reduced-motion: reduce) {
  .post-enter-active,
  .post-leave-active,
  .post-move {
    transition: none !important;
    animation: none !important;
  }
}
```

Déclaratif, zéro JS, aucun impact sur la logique Vue. C'est la solution standard.

#### Solution JS (pour les hooks d'animation)

Quand les animations passent par des hooks JS, vérifier la préférence en runtime :

```ts
// Lecture statique — ok si l'utilisateur ne change pas le réglage en cours de session
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function onEnter(el: Element, done: () => void): void {
  if (prefersReducedMotion) {
    done() // aucune animation — fin immédiate
    return
  }
  ;(el as HTMLElement).style.transition = 'opacity 0.3s ease'
  ;(el as HTMLElement).style.opacity = '1'
  setTimeout(done, 300)
}
```

Pour une réactivité aux changements en cours de session (l'utilisateur active le réglage sans recharger) :

```ts
import { ref, onUnmounted } from 'vue'

const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
const prefersReducedMotion = ref(mq.matches)

function handleChange(e: MediaQueryListEvent): void {
  prefersReducedMotion.value = e.matches
}
mq.addEventListener('change', handleChange)
onUnmounted(() => mq.removeEventListener('change', handleChange))
```

---

### 2.8 Performance — `transform` / `opacity` vs propriétés de layout

Le navigateur rend les pages en trois étapes : **Layout → Paint → Composite**. Toutes les propriétés CSS ne déclenchent pas les mêmes étapes quand elles changent :

| Propriété animée | Layout | Paint | Composite | Coût |
|---|---|---|---|---|
| `top`, `left`, `width`, `height`, `margin` | ✓ | ✓ | ✓ | Élevé — jank sur mobile |
| `background-color`, `border`, `box-shadow` | ✗ | ✓ | ✓ | Moyen |
| `transform`, `opacity` | ✗ | ✗ | ✓ | Faible — GPU, 60fps garanti |

`transform` et `opacity` sont traitées par le **compositor thread** (GPU) sans toucher au layout ni à la peinture. Résultat : animations fluides même sur mobile bas de gamme.

**Règle d'or :** animer `transform` + `opacity` uniquement.

```css
/* ❌ Déclenche Layout + Paint + Composite à chaque frame — jank */
.bad-enter-active {
  transition: top 0.3s, left 0.3s;
}
.bad-enter-from {
  top: -20px;
  left: 0;
}

/* ✅ Compositor uniquement — 60fps garanti */
.good-enter-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.good-enter-from {
  transform: translateY(-20px);
  opacity: 0;
}
```

Pour les effets de "zoom" ou "expand", préférer `transform: scale()` à `width`/`height`. Pour les clips, `clip-path` est animable sur le compositor dans les navigateurs modernes.

---

## 3. Worked examples

### Exemple 1 — Modale `PostModal.vue` avec `<Transition>`

Fade de l'overlay + légère montée de la boîte. Contenu interne avec `mode="out-in"` pour les navigations post-à-post.

```vue
<!-- PostModal.vue -->
<script setup lang="ts">
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
  <!-- Transition sur l'overlay complet — name="modal" -->
  <Transition name="modal">
    <div v-if="open" class="modal-overlay" @click="$emit('close')">
      <!-- @click.stop : clic dans la boîte ne propage pas vers l'overlay -->
      <div class="modal-box" @click.stop>

        <!--
          Transition sur le contenu interne.
          mode="out-in" : si post change pendant que la modale est ouverte,
          l'ancien contenu sort avant que le nouveau entre.
          :key="post?.id" force un re-enter quand le post change.
        -->
        <Transition name="fade" mode="out-in">
          <div v-if="post" :key="post.id">
            <p class="modal-author">{{ post.author }}</p>
            <p class="modal-text">{{ post.content }}</p>
          </div>
        </Transition>

        <button @click="$emit('close')">Fermer</button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Fade de l'overlay */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* La boîte monte légèrement à l'entrée (transform — compositor) */
.modal-enter-active .modal-box {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.modal-enter-from .modal-box {
  transform: translateY(16px);
  opacity: 0;
}

/* Fade du contenu interne */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* prefers-reduced-motion — OBLIGATOIRE */
@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active,
  .modal-enter-active .modal-box,
  .fade-enter-active,
  .fade-leave-active {
    transition: none !important;
  }
}

/* Layout */
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
}

.modal-author {
  font-weight: 600;
  margin: 0 0 0.5rem;
}

.modal-text {
  margin: 0 0 1rem;
}
</style>
```

**Points clés :**
- L'overlay et la boîte ont des transitions indépendantes — la boîte peut monter pendant que l'overlay fait son fade.
- `@click.stop` sur `.modal-box` empêche la fermeture accidentelle.
- `:key="post?.id"` est le pattern "transition par la clé" vu en 2.4.
- `prefers-reduced-motion` désactive **toutes** les transitions du composant en un bloc.

---

### Exemple 2 — Feed `PostFeed.vue` avec `<TransitionGroup>` et `prefers-reduced-motion`

```vue
<!-- PostFeed.vue — feed animé, accessible -->
<script setup lang="ts">
import { ref } from 'vue'

interface Post {
  id: string
  author: string
  content: string
}

const posts = ref<Post[]>([
  { id: 'p1', author: 'Alice', content: 'Belle journée !' },
  { id: 'p2', author: 'Bob', content: 'Brunch dimanche ?' },
])

let nextId = 3

function addPost(content: string): void {
  // unshift → nouveau post en tête, anime depuis le haut
  posts.value.unshift({ id: `p${nextId++}`, author: 'Moi', content })
}

function removePost(id: string): void {
  // filter : ne mute pas le ref source — plus sûr que splice
  posts.value = posts.value.filter(p => p.id !== id)
}

const draftContent = ref('')

function submitPost(): void {
  const text = draftContent.value.trim()
  if (!text) return
  addPost(text)
  draftContent.value = ''
}
</script>

<template>
  <div class="feed">
    <form @submit.prevent="submitPost" class="feed-form">
      <input v-model="draftContent" placeholder="Quoi de neuf ?" class="feed-input" />
      <button type="submit" :disabled="!draftContent.trim()">Publier</button>
    </form>

    <!--
      tag="ul" → génère un <ul> dans le DOM
      class="feed-list" → doit avoir position: relative pour les enfants en position: absolute
    -->
    <TransitionGroup name="post" tag="ul" class="feed-list">
      <li v-for="post in posts" :key="post.id" class="feed-item">
        <strong>{{ post.author }}</strong>
        <p>{{ post.content }}</p>
        <button @click="removePost(post.id)" aria-label="Supprimer">×</button>
      </li>
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* Durée commune entrée et sortie */
.post-enter-active,
.post-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

/* Entrée : vient du haut, invisible */
.post-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}

/* Sortie : part vers le bas, invisible */
.post-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* Repositionnement FLIP des éléments restants */
.post-move {
  transition: transform 0.35s ease;
}

/* Sort du flux → les autres commencent leur FLIP immédiatement */
.post-leave-active {
  position: absolute;
  width: 100%; /* conserver la largeur hors du flux */
}

/* prefers-reduced-motion — OBLIGATOIRE (RGAA 13.8) */
@media (prefers-reduced-motion: reduce) {
  .post-enter-active,
  .post-leave-active,
  .post-move {
    transition: none !important;
  }
}

/* Le conteneur doit être relative pour les enfants en position: absolute */
.feed-list {
  list-style: none;
  padding: 0;
  position: relative;
}

.feed-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
}

.feed-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.feed-input {
  flex: 1;
  padding: 0.4rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}
</style>
```

**Ce que ce composant fait correctement :**
- `unshift()` insère en tête → `translateY(-12px)` → 0 (glisse vers le bas en apparaissant) est cohérent avec la position d'insertion.
- `.post-leave-active { position: absolute }` + `.feed-list { position: relative }` : le combo obligatoire pour un FLIP sans saut.
- `.post-move` sur le repositionnement FLIP : la suppression au milieu anime les posts restants.
- `@media (prefers-reduced-motion: reduce)` en fin de style — toutes les transitions désactivées, aucun code JS supplémentaire.

---

## 4. Pièges & misconceptions

### PIÈGE #1 — Animer `top`/`left` au lieu de `transform`

```css
/* ❌ Layout + Paint + Composite à chaque frame — jank sur mobile */
.bad-enter-active {
  transition: top 0.3s ease;
}
.bad-enter-from {
  top: -20px; /* décale dans le flux → recalcul layout à chaque frame */
}

/* ✅ Compositor uniquement */
.good-enter-active {
  transition: transform 0.3s ease;
}
.good-enter-from {
  transform: translateY(-20px); /* pas de reflow */
}
```

Même erreur avec `width`/`height` pour des effets "expand" — utiliser `transform: scaleY()` ou `clip-path` à la place.

---

### PIÈGE #2 — Ignorer `prefers-reduced-motion`

```css
/* ❌ Fonctionnel mais non accessible — RGAA 13.8 non satisfait */
.post-enter-active { transition: opacity 0.3s, transform 0.3s; }

/* ✅ Toujours ajouter le media query à la fin des blocs d'animations */
@media (prefers-reduced-motion: reduce) {
  .post-enter-active,
  .post-leave-active,
  .post-move {
    transition: none !important;
  }
}
```

Un audit RGAA qui détecte une animation non contrôlable sur TribuZen = non-conformité bloquante. Cette règle n'est pas optionnelle.

---

### PIÈGE #3 — Oublier `:key` sur les enfants de `<TransitionGroup>`

```vue
<!-- ❌ Sans :key : Vue ne peut pas traquer les éléments — aucune animation -->
<TransitionGroup name="post" tag="ul">
  <li v-for="post in posts">{{ post.content }}</li>
</TransitionGroup>

<!-- ✅ :key sur id stable (pas l'index) -->
<TransitionGroup name="post" tag="ul">
  <li v-for="post in posts" :key="post.id">{{ post.content }}</li>
</TransitionGroup>
```

Utiliser un **id stable** (UUID, id de BDD) — jamais l'index du tableau. L'index change quand on supprime un élément au milieu, ce qui déclenche de fausses transitions sur tous les éléments suivants.

---

### PIÈGE #4 — Utiliser `<Transition>` pour une liste

```vue
<!-- ❌ Transition n'accepte qu'un seul enfant direct — v-for en génère plusieurs -->
<Transition name="post">
  <li v-for="post in posts" :key="post.id">{{ post.content }}</li>
</Transition>

<!-- ✅ TransitionGroup pour les listes -->
<TransitionGroup name="post" tag="ul">
  <li v-for="post in posts" :key="post.id">{{ post.content }}</li>
</TransitionGroup>
```

Vue émet un avertissement en dev mais ne plante pas — l'animation ne fonctionne tout simplement pas.

---

### PIÈGE #5 — Oublier `position: absolute` sur `.xxx-leave-active`

```css
/* ❌ L'élément qui sort occupe encore de l'espace → saut après la fin de l'animation */
.post-leave-active {
  transition: opacity 0.3s, transform 0.3s;
  /* pas de position: absolute → l'élément reste dans le flux pendant 0.3s */
}

/* ✅ Sort du flux immédiatement → FLIP commence de suite */
.post-leave-active {
  position: absolute;
  width: 100%; /* obligatoire — sinon rétrécit à 0 hors du flux */
  transition: opacity 0.3s, transform 0.3s;
}
```

Et toujours `position: relative` sur le conteneur `<TransitionGroup>`.

---

## 5. Ancrage TribuZen

Dans TribuZen, les transitions apparaissent à deux endroits clés du front-office :

**`PostFeed.vue`** — le composant central du fil familial. Chaque nouvelle publication (via WebSocket en temps réel ou polling) s'insère en tête avec `unshift()`. L'animation `translateY(-12px)` → 0 signale visuellement que le contenu est nouveau. La suppression d'un post anime la disparition et le repositionnement FLIP des posts restants.

**`PostModal.vue`** — la vue détaillée d'un post (commentaires, réactions). Fade + légère montée à l'ouverture. `mode="out-in"` sur le contenu interne pour les navigations post-à-post sans superposition.

**Point RGAA critique :** TribuZen cible une conformité RGAA 4.1. Le critère 13.8 exige que tout contenu en mouvement soit contrôlable. En pratique :
- Bloc `@media (prefers-reduced-motion: reduce)` **obligatoire** dans chaque composant qui anime.
- Hooks JS : vérifier `window.matchMedia('(prefers-reduced-motion: reduce)').matches` avant toute animation.
- Profil RGAA de Sylvain = atout : connaître ce critère en détail est différenciant en entretien et en audit.

Fichiers cibles dans `smaurier/tribuzen` :

```
tribuzen/
  src/
    components/
      feed/
        PostFeed.vue     ← TransitionGroup + prefers-reduced-motion
        PostModal.vue    ← Transition + mode="out-in"
```

---

## 6. Points clés

1. `<Transition>` enveloppe **un seul enfant** conditionnel ou dynamique — jamais une liste.
2. Les 6 classes CSS (`enter-from`, `enter-active`, `enter-to`, `leave-from`, `leave-active`, `leave-to`) suffisent pour 95% des animations.
3. `mode="out-in"` séquence les transitions lors du remplacement d'éléments — l'ancien sort avant que le nouveau entre.
4. `<TransitionGroup>` requiert `:key` stable sur chaque enfant (id métier, jamais l'index).
5. `.xxx-move` + `position: absolute` sur `.xxx-leave-active` + `position: relative` sur le conteneur = combo obligatoire pour FLIP sans saut.
6. Changer `:key` force une re-transition sans `v-if` — utile pour les compteurs et les slides.
7. Les hooks JS (`@enter(el, done)`, `@leave(el, done)`, `:css="false"`) permettent l'intégration de GSAP ou de toute lib d'animation.
8. `prefers-reduced-motion` n'est pas optionnel — obligation médicale (troubles vestibulaires) et critère RGAA 13.8 non négociable.
9. Animer `transform` et `opacity` uniquement — compositor thread (GPU), zéro impact sur layout, 60fps garanti.

---

## 7. Seeds Anki

```
Quelle est la différence fondamentale entre Transition et TransitionGroup ?|Transition anime un seul enfant direct (v-if, v-show, composant dynamique). TransitionGroup anime plusieurs enfants issus d'un v-for, avec support de la classe .xxx-move pour le repositionnement FLIP.
Quel est le rôle des classes .xxx-enter-active et .xxx-leave-active ?|Définir la propriété CSS transition (durée, easing) pendant toute la durée de l'animation. Les classes -from et -to définissent les états initial et final — active ne contient que la durée.
Pourquoi mettre position: absolute sur .xxx-leave-active dans TransitionGroup ?|Pour sortir l'élément du flux pendant sa sortie. Sans cela, il occupe encore de l'espace et bloque le repositionnement FLIP des éléments restants — l'animation se termine par un saut brusque.
Comment forcer une transition sans v-if — sur un élément dont le contenu change ?|En changeant l'attribut :key. Vue détruit et recrée l'élément quand :key change, ce qui déclenche la transition même sans v-if. Pattern utile pour les compteurs, les slides, les notifications.
Qu'est-ce que prefers-reduced-motion et pourquoi est-il obligatoire en France ?|Une préférence système activée par des personnes ayant des troubles vestibulaires (vertiges, nausées déclenchés par le mouvement) ou une épilepsie photosensible. Le critère RGAA 13.8 exige que tout contenu en mouvement soit contrôlable — ignorer cette préférence est une non-conformité bloquante.
Pourquoi animer transform et opacity plutôt que top, left ou width ?|transform et opacity sont composées par le GPU (compositor thread) sans déclencher Layout ni Paint — garantissent 60fps. top, left, width, height déclenchent un recalcul de layout à chaque frame, causant du jank sur mobile.
Quel est le rôle de :css="false" sur Transition quand on utilise les hooks JS ?|Désactiver l'ajout automatique des classes CSS par Vue. Obligatoire quand on gère l'animation entièrement en JS pour éviter les conflits entre les classes CSS et le code des hooks.
Quelle est la syntaxe CSS pour désactiver les transitions quand prefers-reduced-motion est activé ?|@media (prefers-reduced-motion: reduce) suivi du bloc avec les sélecteurs concernés et transition: none !important. Le !important est nécessaire pour surpasser la spécificité des classes Vue ajoutées dynamiquement.
```

---

## Pont vers le lab

> Lab associé : `02-vue/labs/lab-13-transitions-et-animations/README.md`. Tu construis `PostFeed.vue` + `PostModal.vue` depuis un starter minimal : TransitionGroup sur le feed (ajout/suppression/FLIP), Transition + mode="out-in" sur la modale, `prefers-reduced-motion` obligatoire dans les deux. Corrigé commenté ligne à ligne + variante J+30 inclus.
