# Correction – Exercice 14 : Galerie animée

## Concepts clés
- `<Transition>` : anime l'apparition / disparition d'**un seul** élément
- `<TransitionGroup>` : anime une **liste** d'éléments (avec gestion du déplacement via FLIP)
- Classes CSS automatiques : `v-enter-from`, `v-enter-active`, `v-leave-to`, etc.
- `name` sur `<Transition>` préfixe les classes avec ce nom (ex: `modal-enter-from`)

---

## Classes de transition CSS — rappel visuel

```
ENTRÉE :
  ┌─────────────────────────────────────────────────────────────────┐
  │ v-enter-from  →  v-enter-active  →  v-enter-to                 │
  │  (état avant)      (animation)       (état final)              │
  └─────────────────────────────────────────────────────────────────┘

SORTIE :
  ┌─────────────────────────────────────────────────────────────────┐
  │ v-leave-from  →  v-leave-active  →  v-leave-to                 │
  │  (état avant)      (animation)       (état final)              │
  └─────────────────────────────────────────────────────────────────┘
```

---

## Composant complet — `AnimatedGallery.vue`

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// ─── TYPES ───────────────────────────────────────────────────────

interface GalleryImage {
  id: number
  src: string
  alt: string
  category: string
  title: string
}

// ─── DONNÉES ─────────────────────────────────────────────────────
// On utilise picsum.photos pour des vraies images de démonstration

const images: GalleryImage[] = [
  { id: 1,  src: 'https://picsum.photos/seed/nature1/400/300',    alt: 'Forêt',        category: 'Nature',       title: 'Forêt enchantée' },
  { id: 2,  src: 'https://picsum.photos/seed/city1/400/300',      alt: 'Ville',         category: 'Ville',        title: 'Skyline nocturne' },
  { id: 3,  src: 'https://picsum.photos/seed/nature2/400/300',    alt: 'Montagne',      category: 'Nature',       title: 'Cimes alpines' },
  { id: 4,  src: 'https://picsum.photos/seed/portrait1/400/300',  alt: 'Portrait',      category: 'Portraits',    title: 'Regard lointain' },
  { id: 5,  src: 'https://picsum.photos/seed/city2/400/300',      alt: 'Architecture',  category: 'Ville',        title: 'Façade baroque' },
  { id: 6,  src: 'https://picsum.photos/seed/portrait2/400/300',  alt: 'Portrait',      category: 'Portraits',    title: 'Lumière dorée' },
  { id: 7,  src: 'https://picsum.photos/seed/nature3/400/300',    alt: 'Mer',           category: 'Nature',       title: 'Vague au crépuscule' },
  { id: 8,  src: 'https://picsum.photos/seed/abstract1/400/300',  alt: 'Abstrait',      category: 'Abstrait',     title: 'Géométrie' },
  { id: 9,  src: 'https://picsum.photos/seed/city3/400/300',      alt: 'Rue',           category: 'Ville',        title: 'Passage secret' },
]

// ─── CATÉGORIES ──────────────────────────────────────────────────

// Set élimine les doublons, Array.from() le reconvertit en tableau
const categories = ['Toutes', ...Array.from(new Set(images.map((img) => img.category)))]

const activeCategory = ref('Toutes')

// computed() recalcule la liste filtrée à chaque changement de catégorie
const filteredImages = computed(() => {
  if (activeCategory.value === 'Toutes') return images
  return images.filter((img) => img.category === activeCategory.value)
})

// ─── MODAL ───────────────────────────────────────────────────────

// null = modal fermée ; une image = modal ouverte avec cette image
const selectedImage = ref<GalleryImage | null>(null)

function openModal(image: GalleryImage) {
  selectedImage.value = image
  // On bloque le scroll de la page quand la modal est ouverte
  document.body.style.overflow = 'hidden'
}

function closeModal() {
  selectedImage.value = null
  document.body.style.overflow = ''
}

// ─── PANNEAU LATÉRAL ─────────────────────────────────────────────

const sidePanelOpen = ref(false)

// Navigation dans la modal : image précédente
function prevImage() {
  if (!selectedImage.value) return
  const currentIndex = images.findIndex((img) => img.id === selectedImage.value!.id)
  // L'opérateur % (modulo) + images.length gère le passage de la première à la dernière
  const prevIndex = (currentIndex - 1 + images.length) % images.length
  selectedImage.value = images[prevIndex]
}

// Navigation dans la modal : image suivante
function nextImage() {
  if (!selectedImage.value) return
  const currentIndex = images.findIndex((img) => img.id === selectedImage.value!.id)
  const nextIndex = (currentIndex + 1) % images.length
  selectedImage.value = images[nextIndex]
}
</script>

<template>
  <div class="gallery-app">

    <!-- ── Bouton ouverture panneau ──────────────────────────── -->
    <div class="top-bar">
      <h1>Galerie Animée</h1>
      <button @click="sidePanelOpen = !sidePanelOpen" class="panel-toggle-btn">
        {{ sidePanelOpen ? '✕ Fermer' : '☰ Infos' }}
      </button>
    </div>

    <!-- ── Filtres de catégorie ──────────────────────────────── -->
    <div class="filters">
      <button
        v-for="cat in categories"
        :key="cat"
        @click="activeCategory = cat"
        class="filter-btn"
        :class="{ 'filter-btn--active': activeCategory === cat }"
      >
        {{ cat }}
      </button>
    </div>

    <!-- ── Grille d'images avec TransitionGroup ──────────────── -->
    <!--
      <TransitionGroup> gère une LISTE d'éléments qui apparaissent/disparaissent.
      name="gallery" → les classes seront "gallery-enter-from", "gallery-leave-to", etc.
      tag="div" → TransitionGroup rend un div à la place de son wrapper invisible.

      IMPORTANT : chaque élément DOIT avoir une :key unique et stable.
      Vue utilise la key pour savoir quel élément a disparu/apparu/bougé.
    -->
    <TransitionGroup
      name="gallery"
      tag="div"
      class="images-grid"
    >
      <div
        v-for="image in filteredImages"
        :key="image.id"
        class="image-item"
        @click="openModal(image)"
      >
        <img :src="image.src" :alt="image.alt" loading="lazy" />
        <div class="image-overlay">
          <span class="image-title">{{ image.title }}</span>
          <span class="image-category">{{ image.category }}</span>
        </div>
      </div>
    </TransitionGroup>

    <!--
      ── Modal image ── avec <Transition> ────────────────────────
      <Transition> anime UN SEUL élément (ou un groupe v-if/v-show).
      name="modal" → classes "modal-enter-from", "modal-leave-to"...
    -->
    <Transition name="modal">
      <!--
        v-if retire complètement le modal du DOM quand il est fermé.
        L'animation de sortie est jouée AVANT la suppression du DOM.
      -->
      <div v-if="selectedImage" class="modal-backdrop" @click.self="closeModal">
        <div class="modal-content">
          <button class="modal-close" @click="closeModal">✕</button>

          <button class="modal-nav modal-nav--prev" @click="prevImage">‹</button>

          <!--
            Transition imbriquée pour le changement d'image dans la modal.
            mode="out-in" attend que l'ancienne image parte AVANT d'afficher la nouvelle.
          -->
          <Transition name="image-swap" mode="out-in">
            <img
              :key="selectedImage.id"
              :src="selectedImage.src"
              :alt="selectedImage.alt"
              class="modal-image"
            />
          </Transition>

          <button class="modal-nav modal-nav--next" @click="nextImage">›</button>

          <div class="modal-caption">
            <h3>{{ selectedImage.title }}</h3>
            <span>{{ selectedImage.category }}</span>
          </div>
        </div>
      </div>
    </Transition>

    <!--
      ── Panneau latéral ── avec <Transition> ────────────────────
      name="slide-left" → classes "slide-left-enter-from", etc.
      Le panneau glisse depuis la droite.
    -->
    <Transition name="slide-left">
      <aside v-if="sidePanelOpen" class="side-panel">
        <h2>À propos</h2>
        <p>Cette galerie contient <strong>{{ images.length }}</strong> photos.</p>
        <p>Catégories disponibles :</p>
        <ul>
          <li v-for="cat in categories.slice(1)" :key="cat">{{ cat }}</li>
        </ul>
        <hr />
        <p>Filtre actif : <strong>{{ activeCategory }}</strong></p>
        <p>Photos visibles : <strong>{{ filteredImages.length }}</strong></p>
      </aside>
    </Transition>

  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════════ */
/*  STRUCTURE                                                      */
/* ═══════════════════════════════════════════════════════════════ */

.gallery-app {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.5rem;
  font-family: system-ui, sans-serif;
  position: relative;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.filter-btn {
  padding: 0.35rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  font-size: 0.85rem;
}
.filter-btn--active {
  background: #1d4ed8;
  color: white;
  border-color: #1d4ed8;
}

/* ═══════════════════════════════════════════════════════════════ */
/*  GRILLE                                                         */
/* ═══════════════════════════════════════════════════════════════ */

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.image-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  aspect-ratio: 4/3;
  background: #f3f4f6;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s;
}
.image-item:hover img { transform: scale(1.05); }

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: white;
  padding: 2rem 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  opacity: 0;
  transition: opacity 0.3s;
}
.image-item:hover .image-overlay { opacity: 1; }

.image-title { font-weight: 600; font-size: 0.9rem; }
.image-category { font-size: 0.75rem; opacity: 0.8; }

/* ═══════════════════════════════════════════════════════════════ */
/*  ANIMATION GRILLE — TransitionGroup name="gallery"             */
/*  Effet : fade + scale (apparition) et fade + scale (disparition)
/* ═══════════════════════════════════════════════════════════════ */

/*
  État de DÉPART de l'entrée : invisible et réduit.
  Vue applique cette classe juste avant que l'élément soit inséré.
*/
.gallery-enter-from,
.gallery-leave-to {
  opacity: 0;
  transform: scale(0.85);
}

/*
  Définit la transition CSS pendant l'animation d'entrée et de sortie.
  "ease" donne une accélération/décélération naturelle.
*/
.gallery-enter-active,
.gallery-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}

/*
  .gallery-move est spécifique à TransitionGroup.
  Il s'applique quand les éléments EXISTANTS se DÉPLACENT
  (par exemple, quand un élément filtré disparaît et les autres se repositionnent).
  Vue calcule la position initiale et finale (FLIP) et anime le déplacement.
*/
.gallery-move {
  transition: transform 0.4s ease;
}

/* ═══════════════════════════════════════════════════════════════ */
/*  MODAL                                                          */
/* ═══════════════════════════════════════════════════════════════ */

.modal-backdrop {
  position: fixed;
  inset: 0;                        /* shorthand pour top/right/bottom/left: 0 */
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  max-width: 900px;
  width: 90vw;
  background: #1a1a2e;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.modal-image {
  width: 100%;
  max-height: 70vh;
  object-fit: contain;
  display: block;
}

.modal-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(0,0,0,0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 1rem;
  z-index: 10;
}

.modal-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(4px);
  border: none;
  color: white;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-nav--prev { left: 1rem; }
.modal-nav--next { right: 1rem; }

.modal-caption {
  padding: 1rem;
  color: white;
  text-align: center;
  width: 100%;
  background: rgba(0,0,0,0.4);
}
.modal-caption h3 { margin: 0 0 0.25rem; font-size: 1.1rem; }
.modal-caption span { font-size: 0.8rem; opacity: 0.7; }

/* ─── Animation Modal — name="modal" ─── */

/*
  La modal entre en glissant vers le haut et en s'agrandissant légèrement.
  Elle sort en sens inverse.
*/
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.92) translateY(20px);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

/* ─── Swap d'image dans la modal — name="image-swap" ─── */

/*
  mode="out-in" sur <Transition> :
  1. L'ancienne image fait sa sortie complète (leave)
  2. Ensuite la nouvelle image entre (enter)
  → Pas de chevauchement entre les deux images
*/
.image-swap-enter-from { opacity: 0; transform: translateX(30px); }
.image-swap-leave-to   { opacity: 0; transform: translateX(-30px); }
.image-swap-enter-active,
.image-swap-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }

/* ═══════════════════════════════════════════════════════════════ */
/*  PANNEAU LATÉRAL                                               */
/* ═══════════════════════════════════════════════════════════════ */

.side-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 280px;
  height: 100vh;
  background: white;
  box-shadow: -4px 0 24px rgba(0,0,0,0.15);
  padding: 2rem 1.5rem;
  overflow-y: auto;
  z-index: 900;
}

.panel-toggle-btn {
  padding: 0.4rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

/* ─── Animation Panneau — name="slide-left" ─── */

/*
  Le panneau entre depuis la droite (translateX(100%) = hors écran à droite)
  et sort vers la droite.
*/
.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
  /* cubic-bezier donne une décélération naturelle ("ease-in-out material") */
}
</style>
```

---

## Tableau comparatif `<Transition>` vs `<TransitionGroup>`

| | `<Transition>` | `<TransitionGroup>` |
|---|---|---|
| Nombre d'éléments | **1** (avec `v-if`/`v-show`) | **Liste** (avec `v-for`) |
| Rendu | Aucun élément wrapper rendu | Rend un `<div>` (configurable avec `tag`) |
| Classe supplémentaire | — | `.v-move` pour les déplacements |
| `:key` obligatoire | Non (mais utile pour mode="out-in") | **Oui, unique et stable** |
| `mode="out-in"` | ✅ Oui | ❌ Non supporté |

## Ordre des classes CSS

```
Entrée  :  enter-from → enter-active → enter-to
Sortie  :  leave-from → leave-active → leave-to
```

`*-from` / `*-to` : état de départ / fin de l'animation (snapshot).  
`*-active` : contient la règle `transition:` CSS qui définit la durée et l'easing.
