# Correction – Exercice 12 : Slots nommés

## Concepts clés
- **Slot par défaut** : `<slot />` — reçoit tout ce qui n'est pas dans un slot nommé
- **Slot nommé** : `<slot name="header" />` — reçoit `<template #header>`
- **Slot scoped** : `<slot :user="user" />` — expose des données au parent
- Le parent décide du **contenu**, le composant décide de la **mise en page**

---

## Le composant hôte — `ProfileCard.vue`

```vue
<script setup lang="ts">
// ProfileCard ne connaît pas le contenu qu'il affiche.
// Il définit uniquement la STRUCTURE et le STYLE.
// Le contenu vient de l'utilisateur du composant via les slots.

defineProps<{
  // On accepte une prop optionnelle pour le style de la carte
  variant?: 'default' | 'compact' | 'featured'
}>()
</script>

<template>
  <div class="profile-card" :class="`profile-card--${variant ?? 'default'}`">

    <!--
      Slot nommé "header" — destiné au nom + avatar.
      Le contenu entre les balises <slot> est le contenu PAR DÉFAUT :
      affiché si le parent ne fournit rien pour ce slot.
    -->
    <div class="card-header">
      <slot name="header">
        <!-- Contenu par défaut si #header n'est pas fourni -->
        <div class="default-avatar">?</div>
        <span>Utilisateur inconnu</span>
      </slot>
    </div>

    <!--
      Slot nommé "body" — destiné aux informations détaillées.
    -->
    <div class="card-body">
      <slot name="body">
        <p class="placeholder-text">Aucune information disponible.</p>
      </slot>
    </div>

    <!--
      Slot par défaut — pour du contenu supplémentaire libre.
      v-if sur le wrapper évite d'afficher une div vide si le slot n'est pas utilisé.
      $slots.default vérifie si du contenu a été fourni pour ce slot.
    -->
    <div v-if="$slots.default" class="card-extra">
      <slot />
    </div>

    <!--
      Slot nommé "actions" — destiné aux boutons d'action.
      Toujours en bas de la carte.
    -->
    <div v-if="$slots.actions" class="card-actions">
      <slot name="actions" />
    </div>

  </div>
</template>

<style scoped>
.profile-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  width: 320px;
  transition: box-shadow 0.2s;
}
.profile-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12); }

.profile-card--featured {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px #3b82f6, 0 4px 16px rgba(59,130,246,0.2);
}

.card-header {
  padding: 1.25rem 1.25rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.card-body {
  padding: 0.75rem 1.25rem;
}
.card-extra {
  padding: 0 1.25rem;
  border-top: 1px dashed #e5e7eb;
}
.card-actions {
  padding: 1rem 1.25rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}
.default-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem;
}
.placeholder-text { color: #9ca3af; font-style: italic; font-size: 0.9rem; }
</style>
```

---

## Exemple 1 — Carte développeur

```vue
<!-- DeveloperCard.vue -->
<script setup lang="ts">
import ProfileCard from './ProfileCard.vue'

const dev = {
  name: 'Alice Dupont',
  avatar: 'https://i.pravatar.cc/80?img=1',
  role: 'Développeuse Frontend',
  skills: ['Vue 3', 'TypeScript', 'Tailwind'],
  github: 'https://github.com/alice',
}
</script>

<template>
  <ProfileCard variant="default">

    <!-- Contenu du slot #header -->
    <template #header>
      <img :src="dev.avatar" alt="avatar" class="avatar" />
      <div>
        <h3 class="dev-name">{{ dev.name }}</h3>
        <span class="dev-role">{{ dev.role }}</span>
      </div>
    </template>

    <!-- Contenu du slot #body -->
    <template #body>
      <div class="skills">
        <span
          v-for="skill in dev.skills"
          :key="skill"
          class="skill-badge"
        >
          {{ skill }}
        </span>
      </div>
    </template>

    <!--
      Contenu du slot #actions.
      On utilise #actions comme raccourci de v-slot:actions.
    -->
    <template #actions>
      <a :href="dev.github" target="_blank" class="btn btn-outline">
        GitHub ↗
      </a>
      <button class="btn btn-primary">Contacter</button>
    </template>

    <!-- Slot par défaut : contenu libre en plus -->
    <p style="font-size: 0.8rem; color: #6b7280; padding: 0.5rem 0;">
      Disponible pour du freelance
    </p>

  </ProfileCard>
</template>

<style scoped>
.avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
.dev-name { margin: 0; font-size: 1rem; font-weight: 700; }
.dev-role { font-size: 0.8rem; color: #6b7280; }
.skills { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.skill-badge {
  background: #eff6ff; color: #2563eb;
  padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.75rem;
}
.btn { padding: 0.4rem 0.9rem; border-radius: 6px; border: none; cursor: pointer; font-size: 0.85rem; }
.btn-primary { background: #3b82f6; color: white; }
.btn-outline { background: transparent; border: 1px solid #d1d5db; color: #374151; }
</style>
```

---

## Exemple 2 — Carte équipe (style compact)

```vue
<!-- TeamMemberCard.vue -->
<script setup lang="ts">
import ProfileCard from './ProfileCard.vue'

const member = {
  name: 'Bob Martin',
  initials: 'BM',
  department: 'Marketing',
  email: 'bob@entreprise.fr',
  phone: '+33 6 12 34 56 78',
  status: 'En ligne',
}
</script>

<template>
  <ProfileCard variant="compact">

    <template #header>
      <!--
        Quand on n'a pas d'image, une div avec les initiales est une alternative accessible.
      -->
      <div class="initials-avatar">{{ member.initials }}</div>
      <div>
        <h3 class="member-name">{{ member.name }}</h3>
        <span class="status-dot" />
        <span class="status-text">{{ member.status }}</span>
      </div>
    </template>

    <template #body>
      <ul class="contact-list">
        <li>🏢 {{ member.department }}</li>
        <li>✉️ {{ member.email }}</li>
        <li>📞 {{ member.phone }}</li>
      </ul>
    </template>

    <template #actions>
      <button class="btn-icon" title="Envoyer un message">💬</button>
      <button class="btn-icon" title="Appeler">📞</button>
      <button class="btn-icon" title="Planifier">📅</button>
    </template>

    <!-- Pas de slot par défaut utilisé ici — la div .card-extra n'apparaîtra pas -->

  </ProfileCard>
</template>

<style scoped>
.initials-avatar {
  width: 48px; height: 48px; border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.member-name { margin: 0; font-size: 1rem; font-weight: 700; }
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981; margin-right: 4px; }
.status-text { font-size: 0.75rem; color: #10b981; }
.contact-list { list-style: none; padding: 0; margin: 0; font-size: 0.85rem; line-height: 2; }
.btn-icon { background: none; border: 1px solid #e5e7eb; border-radius: 6px; padding: 0.35rem; cursor: pointer; font-size: 1rem; }
</style>
```

---

## Exemple 3 — Carte produit mise en avant (featured)

```vue
<!-- FeaturedProductCard.vue -->
<script setup lang="ts">
import ProfileCard from './ProfileCard.vue'

const product = {
  name: 'Vue 3 Masterclass',
  author: 'Cursus Formation',
  price: '49 €',
  rating: 4.8,
  reviews: 312,
  description: 'Maîtrisez Vue 3 et TypeScript de zéro à production.',
  badge: '⭐ Bestseller',
}
</script>

<template>
  <!--
    La prop variant="featured" active un style spécial (bordure bleue).
    Le composant ProfileCard ne sait pas que c'est un produit — il reste générique.
  -->
  <ProfileCard variant="featured">

    <template #header>
      <div class="product-icon">📚</div>
      <div>
        <span class="product-badge">{{ product.badge }}</span>
        <h3 class="product-name">{{ product.name }}</h3>
        <span class="product-author">Par {{ product.author }}</span>
      </div>
    </template>

    <template #body>
      <p class="product-desc">{{ product.description }}</p>
      <div class="rating">
        <span class="rating-score">{{ product.rating }}</span>
        <span class="stars">★★★★★</span>
        <span class="reviews">({{ product.reviews }} avis)</span>
      </div>
    </template>

    <!-- Prix dans le slot par défaut -->
    <div class="price-section">
      <span class="price">{{ product.price }}</span>
    </div>

    <template #actions>
      <button class="btn-buy">🛒 Acheter maintenant</button>
    </template>

  </ProfileCard>
</template>

<style scoped>
.product-icon { font-size: 2rem; }
.product-badge { background: #fef3c7; color: #92400e; font-size: 0.7rem; padding: 0.1rem 0.5rem; border-radius: 8px; }
.product-name { margin: 0.2rem 0 0; font-size: 1rem; font-weight: 700; }
.product-author { font-size: 0.75rem; color: #6b7280; }
.product-desc { font-size: 0.85rem; color: #4b5563; margin-bottom: 0.5rem; }
.rating { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; }
.rating-score { font-weight: 700; color: #d97706; }
.stars { color: #f59e0b; }
.reviews { color: #9ca3af; }
.price-section { padding: 0.75rem 0; }
.price { font-size: 1.4rem; font-weight: 700; color: #1d4ed8; }
.btn-buy {
  width: 100%;
  padding: 0.6rem;
  background: #2563eb; color: white;
  border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-weight: 600;
}
</style>
```

---

## Résumé des slots utilisés

| Slot | Défini dans ProfileCard | Utilisé pour |
|------|------------------------|--------------|
| `#header` | `<slot name="header">` | Avatar + nom |
| `#body` | `<slot name="body">` | Informations de détail |
| *(default)* | `<slot />` | Contenu additionnel libre |
| `#actions` | `<slot name="actions">` | Boutons en bas de carte |

**Bonne pratique :** utiliser `v-if="$slots.nomDuSlot"` sur le conteneur pour ne pas rendre une div vide quand le slot n'est pas fourni.
