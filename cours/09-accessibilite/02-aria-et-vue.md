# 02 — ARIA et Vue

---

> **🔄 Rappel du cours précédent**
> Avant de continuer, vérifie que tu peux répondre à ces questions :
> 1. Que signifie WCAG et quel est son rôle ?
> 2. Quels sont les 4 principes POUR de l'accessibilité web ?
> 
> <details>
> <summary>Vérifier mes réponses</summary>
>
> 1. Web Content Accessibility Guidelines — les règles internationales pour l'accessibilité web
> 2. Perceivable (perceptible), Operable (utilisable), Understandable (compréhensible), Robust (robuste)
> </details>

---

## C'est quoi ARIA ?

**ARIA** = **Accessible Rich Internet Applications**. C'est un ensemble d'**attributs HTML spéciaux** qui aident les **lecteurs d'écran** (logiciels qui lisent le contenu de l'écran à voix haute) à mieux comprendre ton interface.

### 🏗️ L'analogie des boutons d'ascenseur en Braille

Imagine un ascenseur. Les boutons ont des **numéros visuels** (1, 2, 3...) que tout le monde peut lire. Mais pour les personnes aveugles, on ajoute des **étiquettes en Braille** à côté de chaque bouton.

**ARIA, c'est le Braille de ton site web.** Ce sont des informations **invisibles à l'écran** mais que les lecteurs d'écran peuvent lire pour guider l'utilisateur.

> 📖 **Rappel : c'est quoi un lecteur d'écran ?**
>
> C'est un logiciel qui **lit à voix haute** le contenu affiché à l'écran. Par exemple :
> - **NVDA** (gratuit, Windows)
> - **VoiceOver** (intégré à macOS/iPhone)
> - **TalkBack** (intégré à Android)
>
> Quand un lecteur d'écran arrive sur un `<button>`, il dit : "Bouton, Sauvegarder".
> Quand il arrive sur un `<div>`, il ne dit... rien de spécial. D'où le problème.

## La règle n°1 d'ARIA : évite-le si tu peux !

Ça peut sembler contradictoire, mais **la première règle d'ARIA** est :

> ❝ N'utilise pas ARIA si du HTML sémantique fait le travail. ❞

Pourquoi ? Parce que le HTML sémantique est **nativement** compris par les lecteurs d'écran. ARIA, c'est un **patch** — il comble les manques, mais le HTML natif est toujours meilleur.

```html
<!-- ❌ ARIA inutile — on réinvente un bouton avec un <div> -->
<!-- On doit ajouter role, tabindex ET aria-label pour compenser -->
<div role="button" tabindex="0" aria-label="Fermer">X</div>

<!-- ✅ HTML sémantique — on utilise un <button>, c'est tout ! -->
<!-- Le navigateur gère déjà le focus clavier, le rôle, et l'annonce -->
<button aria-label="Fermer">X</button>
<!-- ici aria-label est utile car le texte "X" seul n'est pas clair -->
```

**Quand ARIA est-il vraiment nécessaire ?**

- Quand tu crées un **composant custom** (dropdown, onglets, modal...) qui n'existe pas en HTML natif
- Quand tu as des **zones dynamiques** qui changent sans rechargement de page
- Quand le **HTML sémantique seul ne suffit pas** pour décrire ce qui se passe

## Les attributs ARIA les plus courants

### 1. Les labels — « Ce bouton fait quoi ? »

Ce sont les attributs qui **donnent un nom** ou une **description** à un élément :

```vue
<!-- ===== aria-label ===== -->
<!-- Donne un label INVISIBLE aux yeux mais LU par le lecteur d'écran -->
<!-- Utile quand le texte visible n'est pas suffisant (ex : un simple "✕") -->
<button aria-label="Fermer le menu">✕</button>
<!-- Le lecteur d'écran dira : "Bouton, Fermer le menu" -->
<!-- Sans aria-label il dirait juste : "Bouton, fois" (le symbole ✕) -->

<!-- ===== aria-labelledby ===== -->
<!-- Pointe vers un AUTRE élément qui sert de titre/label -->
<!-- "labelledby" = "étiqueté par" -->
<h2 id="cart-title">Panier</h2>
<section aria-labelledby="cart-title">
  <!-- Le lecteur d'écran annoncera cette section comme "Panier" -->
  <!-- car on lui dit : "ton label, c'est l'élément avec id=cart-title" -->
  <p>3 articles dans votre panier</p>
</section>

<!-- ===== aria-describedby ===== -->
<!-- Ajoute une DESCRIPTION supplémentaire (lue après le label) -->
<input
  aria-describedby="password-hint"
  type="password"
  placeholder="Mot de passe"
/>
<p id="password-hint">Minimum 8 caractères, dont 1 majuscule</p>
<!-- Le lecteur d'écran lira : "Champ mot de passe, -->
<!-- Minimum 8 caractères dont 1 majuscule" -->
```

### 2. Les états — « Ce menu est ouvert ou fermé ? »

Ce sont les attributs qui décrivent l'**état actuel** d'un élément (ouvert/fermé, actif/inactif, en cours de chargement...) :

```vue
<script setup lang="ts">
import { ref } from 'vue'

// On crée une variable réactive pour savoir si le menu est ouvert
const isOpen = ref(false)      // false = menu fermé au départ
const isActive = ref(false)    // false = bouton pas activé
const isLoading = ref(true)    // true = données en cours de chargement
</script>

<template>
  <!-- ===== aria-expanded ===== -->
  <!-- Dit au lecteur d'écran : "ce bouton contrôle quelque chose qui est
       ouvert (true) ou fermé (false)" -->
  <button
    :aria-expanded="isOpen"
    @click="isOpen = !isOpen"
  >
    Menu
  </button>
  <!-- Le lecteur d'écran dira : "Bouton, Menu, réduit" ou "Bouton, Menu, développé" -->

  <!-- Le menu n'apparaît que si isOpen est true -->
  <nav v-show="isOpen">
    <a href="/profil">Mon profil</a>
    <a href="/parametres">Paramètres</a>
  </nav>

  <!-- ===== aria-pressed ===== -->
  <!-- Pour un bouton "toggle" (on/off), indique s'il est enfoncé ou pas -->
  <button :aria-pressed="isActive" @click="isActive = !isActive">
    Mode sombre
  </button>
  <!-- Le lecteur d'écran dira : "Bouton bascule, Mode sombre, enfoncé" -->

  <!-- ===== aria-busy ===== -->
  <!-- Indique qu'une zone est en cours de mise à jour (ex : chargement) -->
  <div :aria-busy="isLoading">
    <p v-if="isLoading">Chargement en cours...</p>
    <p v-else>Données chargées !</p>
  </div>
</template>
```

### 3. Les live regions — « Attention, quelque chose vient de changer ! »

Normalement, un lecteur d'écran lit seulement l'endroit où se trouve le **focus** (le curseur). Si une notification apparaît **ailleurs** sur la page, l'utilisateur ne le saura pas... sauf si tu utilises une **live region** :

```vue
<script setup lang="ts">
import { ref } from 'vue'

const notification = ref('')     // Message vide au départ
const errorMessage = ref('')     // Message d'erreur vide au départ

// Quand cette fonction est appelée, le message change
// et le lecteur d'écran l'annonce automatiquement !
function showNotification(message: string): void {
  notification.value = message
}
</script>

<template>
  <!-- ===== aria-live="polite" ===== -->
  <!-- "polite" = le lecteur d'écran ATTEND que l'utilisateur ait fini  -->
  <!-- ce qu'il fait avant d'annoncer le changement (pas d'interruption) -->
  <!-- aria-atomic="true" = lire TOUT le contenu, pas juste ce qui a changé -->
  <div aria-live="polite" aria-atomic="true">
    {{ notification }}
    <!-- Dès que "notification" change, le lecteur d'écran le lit ! -->
  </div>

  <!-- ===== role="alert" ===== -->
  <!-- C'est le mode URGENT — le lecteur d'écran INTERROMPT tout -->
  <!-- pour annoncer ce message immédiatement -->
  <!-- Utilise-le pour les erreurs critiques seulement -->
  <div role="alert">
    {{ errorMessage }}
  </div>
</template>
```

> 💡 **Résumé des live regions** :
> - `aria-live="polite"` → attend la fin de ce que dit le lecteur d'écran, puis annonce
> - `aria-live="assertive"` ou `role="alert"` → interrompt tout et annonce immédiatement
> - Utilise `polite` pour les notifications classiques, `alert` pour les erreurs

## Composants accessibles en Vue 3

Maintenant qu'on connaît les attributs ARIA, voyons comment construire des **composants Vue accessibles**.

### Modal accessible (fenêtre pop-up)

> 📖 **Rappel : c'est quoi une modal ?**
>
> Une modal (ou "dialogue"), c'est une fenêtre qui s'ouvre **par-dessus** le contenu de la page. Par exemple : "Êtes-vous sûr de vouloir supprimer ?" avec les boutons "Oui" / "Non".
>
> Le problème d'accessibilité : quand la modal s'ouvre, il faut que le **focus clavier reste à l'intérieur** (sinon on navigue dans la page derrière sans le voir).

```vue
<script setup lang="ts">
// On importe les outils Vue dont on a besoin
import { ref, watch, nextTick } from 'vue'

// --- Les props : les données que le parent envoie au composant ---
const props = defineProps<{
  open: boolean    // true = la modal est ouverte, false = fermée
  title: string    // Le titre affiché en haut de la modal
}>()

// --- Les événements : ce que ce composant peut dire au parent ---
const emit = defineEmits<{
  close: []        // "Je veux me fermer !" (pas de données envoyées)
}>()

// --- Référence vers le bouton "Fermer" dans le template ---
// On en a besoin pour y mettre le focus automatiquement à l'ouverture
const closeButtonRef = ref<HTMLButtonElement | null>(null)
// HTMLButtonElement = le type TypeScript d'un élément <button>
// null au départ car le bouton n'existe pas encore dans le DOM

// --- Gestion du clavier ---
function handleKeydown(e: KeyboardEvent): void {
  // KeyboardEvent = le type de l'événement clavier
  if (e.key === 'Escape') {
    // Quand l'utilisateur appuie sur Escape → on ferme la modal
    emit('close')
  }
}

// --- On surveille l'ouverture/fermeture de la modal ---
watch(
  () => props.open,          // On surveille la prop "open"
  async (isOpen) => {        // À chaque changement...
    if (isOpen) {
      // La modal vient de S'OUVRIR
      await nextTick()       // On attend que le DOM soit mis à jour
      closeButtonRef.value?.focus()  // On met le focus sur le bouton Fermer
      // Le "?" = si closeButtonRef.value existe, appelle .focus()
      document.addEventListener('keydown', handleKeydown)
      // On écoute les touches du clavier (pour détecter Escape)
    } else {
      // La modal vient de SE FERMER
      document.removeEventListener('keydown', handleKeydown)
      // On arrête d'écouter le clavier
    }
  }
)
</script>

<template>
  <!-- Teleport : envoie le HTML directement dans <body> -->
  <!-- (pour que la modal soit AU-DESSUS de tout le reste) -->
  <Teleport to="body">
    <!-- Le fond sombre derrière la modal -->
    <!-- @click.self = cliquer sur le fond (pas sur la modal) ferme la modal -->
    <div v-if="open" class="modal-overlay" @click.self="emit('close')">

      <!-- La modal elle-même -->
      <!-- role="dialog" = dit au lecteur d'écran "ceci est une boîte de dialogue" -->
      <!-- aria-modal="true" = dit "le reste de la page est bloqué" -->
      <!-- :aria-label = donne un nom à la modal (son titre) -->
      <div
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        class="modal"
      >
        <header>
          <h2>{{ title }}</h2>

          <!-- Le bouton fermer avec sa référence -->
          <button
            ref="closeButtonRef"
            aria-label="Fermer"
            @click="emit('close')"
          >
            ✕
          </button>
        </header>

        <div class="modal-body">
          <!-- <slot /> = ici sera injecté le contenu passé par le parent -->
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
```

**Les points clés d'accessibilité de cette modal :**

1. `role="dialog"` + `aria-modal="true"` → le lecteur d'écran sait que c'est une boîte de dialogue
2. `:aria-label="title"` → la modal a un nom (son titre)
3. `Escape` ferme la modal → comportement attendu par tous les utilisateurs
4. Le focus va automatiquement sur le bouton "Fermer" → pas de focus perdu dans le vide
5. Cliquer sur le fond sombre ferme la modal → sortie facile

### Tabs accessibles (onglets)

> 📖 **Rappel : c'est quoi des tabs ?**
>
> Des onglets, comme sur un navigateur. On clique sur un onglet pour voir le contenu correspondant. Avec le clavier, on utilise les **flèches gauche/droite** pour changer d'onglet.

```vue
<script setup lang="ts">
import { ref } from 'vue'

// La liste des onglets (un simple tableau de chaînes de caractères)
const tabs = ['Profil', 'Paramètres', 'Notifications']

// L'index de l'onglet actif (0 = premier onglet = "Profil")
const activeTab = ref(0)

// Gestion de la navigation clavier dans les onglets
function handleKeydown(e: KeyboardEvent, index: number): void {
  if (e.key === 'ArrowRight') {
    // Flèche droite → onglet suivant
    // Le "% tabs.length" permet de revenir au début après le dernier
    // Exemple : si on est à l'index 2 (dernier), (2+1) % 3 = 0 (retour au premier)
    activeTab.value = (index + 1) % tabs.length
  } else if (e.key === 'ArrowLeft') {
    // Flèche gauche → onglet précédent
    // Le "+ tabs.length" évite les nombres négatifs
    // Exemple : si on est à l'index 0, (0-1+3) % 3 = 2 (va au dernier)
    activeTab.value = (index - 1 + tabs.length) % tabs.length
  }
}
</script>

<template>
  <div>
    <!-- La barre d'onglets -->
    <!-- role="tablist" = dit au lecteur d'écran "ceci est une liste d'onglets" -->
    <div role="tablist">
      <button
        v-for="(tab, index) in tabs"
        :key="tab"
        role="tab"
        :aria-selected="activeTab === index"
        :tabindex="activeTab === index ? 0 : -1"
        @click="activeTab = index"
        @keydown="handleKeydown($event, index)"
      >
        <!-- role="tab" = "ceci est un onglet" -->
        <!-- :aria-selected = "cet onglet est-il le sélectionné ?" (true/false) -->
        <!-- :tabindex = seul l'onglet actif est focusable avec Tab (0) -->
        <!--   les autres ont -1 = pas atteignables par Tab, -->
        <!--   mais atteignables par les flèches -->
        <!-- @click = cliquer sélectionne cet onglet -->
        <!-- @keydown = les flèches naviguent entre les onglets -->
        {{ tab }}
      </button>
    </div>

    <!-- Les panneaux de contenu (un par onglet) -->
    <div
      v-for="(tab, index) in tabs"
      :key="tab"
      v-show="activeTab === index"
      role="tabpanel"
      :aria-labelledby="`tab-${index}`"
    >
      <!-- role="tabpanel" = "ceci est le contenu d'un onglet" -->
      <!-- :aria-labelledby = "ce panneau est étiqueté par l'onglet n°X" -->
      <!-- v-show = affiche uniquement le panneau de l'onglet actif -->
      <slot :name="tab.toLowerCase()" />
    </div>
  </div>
</template>
```

> 💡 **Petite explication sur `tabindex`** :
> - `tabindex="0"` → l'élément est **focusable** avec la touche Tab (ordre naturel)
> - `tabindex="-1"` → l'élément n'est **PAS** atteignable avec Tab, mais on peut y mettre le focus par code JavaScript
> - On n'utilise jamais `tabindex="2"` ou plus — ça casse l'ordre de navigation

### Formulaire accessible

```vue
<script setup lang="ts">
import { ref, reactive } from 'vue'

// reactive() crée un objet réactif — quand form.email change,
// le template se met à jour automatiquement
const form = reactive({
  email: ''         // Le champ email, vide au départ
})

// Les erreurs de validation (vide = pas d'erreur)
const errors = reactive({
  email: ''         // Message d'erreur pour l'email
})

// true quand le formulaire est en cours d'envoi
const isSubmitting = ref(false)

function handleSubmit(): void {
  // ... logique d'envoi du formulaire
}
</script>

<template>
  <!-- @submit.prevent = quand on soumet le formulaire, -->
  <!-- empêcher le rechargement de la page (comportement par défaut) -->
  <!-- puis appeler handleSubmit() -->
  <form @submit.prevent="handleSubmit">
    <div>
      <!-- Le label est ASSOCIÉ au champ grâce à for="email" / id="email" -->
      <!-- Le lecteur d'écran dira : "Champ de saisie, Email" -->
      <label for="email">Email</label>

      <input
        id="email"
        v-model="form.email"
        type="email"
        :aria-invalid="!!errors.email"
        :aria-describedby="errors.email ? 'email-error' : undefined"
      />
      <!-- v-model = lie la valeur du champ à form.email (dans les 2 sens) -->
      <!-- :aria-invalid = dit si le champ est en erreur (true/false) -->
      <!--   !! transforme une chaîne en booléen : "" → false, "Erreur" → true -->
      <!-- :aria-describedby = pointe vers le message d'erreur SI il y en a un -->
      <!--   sinon = undefined (pas de description) -->

      <!-- Le message d'erreur, affiché seulement s'il y a une erreur -->
      <p v-if="errors.email" id="email-error" role="alert">
        {{ errors.email }}
      </p>
      <!-- role="alert" = le lecteur d'écran l'annonce IMMÉDIATEMENT -->
      <!-- Exemple : "Alerte, Veuillez entrer une adresse email valide" -->
    </div>

    <button type="submit" :aria-busy="isSubmitting">
      {{ isSubmitting ? 'Envoi...' : 'Envoyer' }}
    </button>
    <!-- :aria-busy = dit au lecteur d'écran si le bouton est "occupé" -->
    <!-- Le texte dynamique change aussi visuellement : "Envoyer" → "Envoi..." -->
  </form>
</template>
```

## Le Skip Link — « Aller directement au contenu »

Imagine que tu es sur un site avec un gros menu de navigation (10 liens). Avec une souris, tu scrolles directement au contenu. Mais avec un clavier, tu dois appuyer sur **Tab 10 fois** pour passer tous les liens du menu avant d'atteindre le contenu.

Le **skip link** (lien d'évitement) est un lien **caché** qui apparaît quand on appuie sur Tab. Il permet de **sauter directement** au contenu principal :

```vue
<!-- App.vue — le composant racine de ton application -->
<template>
  <!-- Ce lien est caché par défaut (CSS : position hors écran) -->
  <!-- Quand on appuie sur Tab, il apparaît en haut de la page -->
  <!-- En cliquant dessus / Enter, le focus saute à <main> -->
  <a href="#main-content" class="skip-link">
    Aller au contenu principal
  </a>

  <nav>
    <!-- Imagine 10 liens de navigation ici... -->
    <!-- Sans skip link, il faut les passer un par un au clavier -->
  </nav>

  <!-- L'attribut id="main-content" est la "cible" du skip link -->
  <main id="main-content">
    <RouterView />
    <!-- RouterView affiche la page actuelle (Vue Router) -->
  </main>
</template>

<style>
/* Le skip link est positionné HORS de l'écran par défaut */
.skip-link {
  position: absolute;   /* Retiré du flux normal de la page */
  top: -40px;           /* Au-dessus de l'écran = invisible */
  left: 0;
  z-index: 100;         /* Au-dessus de tout quand il apparaît */
  background: #000;     /* Fond noir pour bien le voir */
  color: #fff;          /* Texte blanc */
  padding: 8px 16px;
}

/* Quand l'utilisateur met le focus dessus (Tab), il descend dans l'écran */
.skip-link:focus {
  top: 0;               /* Revient en haut de la page = visible ! */
}
</style>
```

> 💡 Essaie sur n'importe quel grand site (GitHub, Google) : appuie sur Tab dès le chargement de la page. Tu verras souvent apparaître un skip link !

## Résumé

```
✅ ARIA = des attributs pour aider les lecteurs d'écran
✅ Règle n°1 : préfère le HTML sémantique, ARIA est un complément
✅ aria-label → donne un nom invisible à un élément
✅ aria-expanded, aria-pressed → décrit l'état (ouvert/fermé, on/off)
✅ aria-live → annonce les changements dynamiques
✅ Modal : role="dialog", aria-modal, focus automatique, Escape pour fermer
✅ Tabs : role="tablist" + role="tab", flèches pour naviguer
✅ Formulaire : label + aria-invalid + aria-describedby + role="alert"
✅ Skip link : lien caché pour sauter la navigation
```

---

## 🎯 Pratique

### Exercice ARIA.1 — Bouton icône

Rends ce bouton icône accessible :

```vue
<button @click="deleteItem">
  <TrashIcon />
</button>
```

<details>
<summary>Solution</summary>

```vue
<button @click="deleteItem" aria-label="Supprimer l'élément">
  <TrashIcon aria-hidden="true" />
</button>
```
</details>

---

### Exercice ARIA.2 — Menu déroulant

Ajoute les attributs ARIA pour ce menu :

```vue
<template>
  <button @click="isOpen = !isOpen">
    Menu
  </button>
  <ul v-if="isOpen">
    <li><a href="/profile">Profil</a></li>
    <li><a href="/settings">Paramètres</a></li>
  </ul>
</template>
```

<details>
<summary>Solution</summary>

```vue
<template>
  <button 
    @click="isOpen = !isOpen"
    :aria-expanded="isOpen"
    aria-haspopup="true"
  >
    Menu
  </button>
  <ul v-if="isOpen" role="menu">
    <li role="menuitem"><a href="/profile">Profil</a></li>
    <li role="menuitem"><a href="/settings">Paramètres</a></li>
  </ul>
</template>
```
</details>

---

### Exercice ARIA.3 — Formulaire accessible

Ajoute les attributs pour rendre ce champ accessible en cas d'erreur :

```vue
<template>
  <label>Email</label>
  <input type="email" v-model="email">
  <span v-if="error">{{ error }}</span>
</template>
```

<details>
<summary>Solution</summary>

```vue
<template>
  <label for="email-input">Email</label>
  <input 
    id="email-input"
    type="email" 
    v-model="email"
    :aria-invalid="!!error"
    :aria-describedby="error ? 'email-error' : undefined"
  >
  <span v-if="error" id="email-error" role="alert">
    {{ error }}
  </span>
</template>
```
</details>

---

### Exercice ARIA.4 — Live region

Ajoute une live region pour annoncer le succès d'une action :

```vue
<template>
  <button @click="save">Sauvegarder</button>
  <span v-if="saved">Sauvegardé !</span>
</template>
```

<details>
<summary>Solution</summary>

```vue
<template>
  <button @click="save">Sauvegarder</button>
  <span v-if="saved" role="status" aria-live="polite">
    Sauvegardé !
  </span>
</template>
```
</details>

---

## Suite

→ `cours/09-accessibilite/03-audit-a11y.md`
