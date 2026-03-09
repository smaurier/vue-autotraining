# Correction – Exercice 10 : CRUD API

## Concepts clés
- `onMounted()` : cycle de vie — s'exécute après que le composant est affiché
- `fetch()` avec `async/await` : appels HTTP sans callbacks complexes
- États de l'interface : `loading`, `error`, `data` — toujours les trois
- Mock de l'API JSONPlaceholder pour les tests

---

## Type et données initiales

```typescript
// types.ts
export interface User {
  id: number
  name: string
  email: string
  username: string
}
```

---

## Composant complet — `UserCrud.vue`

```vue
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import type { User } from './types'

// ─── BASE URL ────────────────────────────────────────────────────
// JSONPlaceholder est une fausse API REST gratuite pour la pratique
const API_URL = 'https://jsonplaceholder.typicode.com/users'

// ─── ÉTATS PRINCIPAUX ────────────────────────────────────────────
// On sépare les trois préoccupations : les données, le chargement, l'erreur
const users = ref<User[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// ─── MODE ÉDITION / CRÉATION ─────────────────────────────────────
// null = on ne crée/édite rien ; un objet = le formulaire est visible
const editingUser = ref<Partial<User> | null>(null)
const isCreating = ref(false)

// ─── FORMULAIRE ──────────────────────────────────────────────────
// reactive() pour un objet — plus pratique que plusieurs ref()
const form = reactive({
  name: '',
  email: '',
  username: '',
})

// ─── HELPERS ────────────────────────────────────────────────────

/** Réinitialise le formulaire et ferme le mode édition */
function closeForm() {
  editingUser.value = null
  isCreating.value = false
  form.name = ''
  form.email = ''
  form.username = ''
}

/** Affiche une erreur pendant 3 secondes puis l'efface */
function showError(msg: string) {
  error.value = msg
  setTimeout(() => { error.value = null }, 3000)
}

// ─── READ : charger la liste ─────────────────────────────────────

/**
 * onMounted() garantit que le DOM est prêt avant de lancer la requête.
 * async/await rend le code lisible : pas de .then().catch() imbriqués.
 */
onMounted(async () => {
  loading.value = true    // on affiche le spinner
  try {
    const response = await fetch(API_URL)
    // fetch() ne rejette PAS pour les erreurs HTTP (404, 500, etc.)
    // Il faut vérifier response.ok manuellement
    if (!response.ok) throw new Error(`Erreur serveur : ${response.status}`)

    const data: User[] = await response.json()
    // On ne prend que les 5 premiers pour ne pas surcharger l'interface
    users.value = data.slice(0, 5)
  } catch (err) {
    showError(err instanceof Error ? err.message : 'Erreur inconnue')
  } finally {
    // finally s'exécute toujours, succès ou erreur → on masque le spinner
    loading.value = false
  }
})

// ─── CREATE : créer un utilisateur ──────────────────────────────

function openCreateForm() {
  closeForm()        // ferme l'édition en cours si besoin
  isCreating.value = true
}

async function createUser() {
  loading.value = true
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      // Content-Type indique au serveur que le corps est du JSON
      headers: { 'Content-Type': 'application/json' },
      // JSON.stringify sérialise l'objet en chaîne JSON
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        username: form.username,
      }),
    })
    if (!response.ok) throw new Error(`Création échouée : ${response.status}`)

    const newUser: User = await response.json()
    // JSONPlaceholder renvoie l'objet créé avec un id fictif (toujours 11)
    // En production, cet id serait réel. On l'ajoute en tête de liste.
    users.value.unshift(newUser)
    closeForm()
  } catch (err) {
    showError(err instanceof Error ? err.message : 'Erreur création')
  } finally {
    loading.value = false
  }
}

// ─── UPDATE : modifier un utilisateur ───────────────────────────

function openEditForm(user: User) {
  closeForm()
  editingUser.value = { ...user }  // copie pour ne pas modifier l'original
  // On pré-remplit le formulaire avec les données actuelles
  form.name = user.name
  form.email = user.email
  form.username = user.username
}

async function updateUser() {
  if (!editingUser.value?.id) return

  loading.value = true
  try {
    // PUT remplace l'intégralité de la ressource (contrairement à PATCH)
    const response = await fetch(`${API_URL}/${editingUser.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingUser.value.id,  // PUT requiert l'id dans le body
        name: form.name,
        email: form.email,
        username: form.username,
      }),
    })
    if (!response.ok) throw new Error(`Mise à jour échouée : ${response.status}`)

    const updatedUser: User = await response.json()

    // On remplace l'utilisateur dans le tableau local
    // findIndex() retourne -1 si non trouvé — on vérifie avant de modifier
    const index = users.value.findIndex((u) => u.id === updatedUser.id)
    if (index !== -1) users.value[index] = updatedUser

    closeForm()
  } catch (err) {
    showError(err instanceof Error ? err.message : 'Erreur mise à jour')
  } finally {
    loading.value = false
  }
}

// ─── DELETE : supprimer un utilisateur ──────────────────────────

async function deleteUser(userId: number) {
  // Confirmation native du navigateur — simple mais efficace
  if (!confirm('Supprimer cet utilisateur ?')) return

  loading.value = true
  try {
    const response = await fetch(`${API_URL}/${userId}`, {
      method: 'DELETE',
    })
    // JSONPlaceholder retourne 200 pour les DELETE (pas 204 ici)
    if (!response.ok) throw new Error(`Suppression échouée : ${response.status}`)

    // On retire l'utilisateur du tableau local sans recharger toda la liste
    users.value = users.value.filter((u) => u.id !== userId)
  } catch (err) {
    showError(err instanceof Error ? err.message : 'Erreur suppression')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="crud-app">
    <div class="header">
      <h1>Gestion des utilisateurs</h1>
      <button @click="openCreateForm" class="btn btn-primary">+ Nouvel utilisateur</button>
    </div>

    <!-- ── Message d'erreur ───────────────────────────────────── -->
    <div v-if="error" class="alert alert-error" role="alert">
      ⚠️ {{ error }}
    </div>

    <!-- ── Spinner de chargement ─────────────────────────────── -->
    <div v-if="loading" class="loading-overlay">
      <span>Chargement...</span>
    </div>

    <!-- ── Formulaire création / édition ─────────────────────── -->
    <!--
      v-if retire complètement le formulaire du DOM quand il est fermé.
      On pourrait utiliser v-show pour le garder (mais masqué) si l'animation est importante.
    -->
    <div v-if="isCreating || editingUser" class="form-card">
      <h2>{{ isCreating ? 'Créer un utilisateur' : 'Modifier l\'utilisateur' }}</h2>

      <div class="form-group">
        <label>Nom</label>
        <!-- v-model : double liaison — l'input met à jour form.name ET vice-versa -->
        <input v-model="form.name" type="text" placeholder="Nom complet" />
      </div>
      <div class="form-group">
        <label>Email</label>
        <input v-model="form.email" type="email" placeholder="email@exemple.fr" />
      </div>
      <div class="form-group">
        <label>Nom d'utilisateur</label>
        <input v-model="form.username" type="text" placeholder="pseudo" />
      </div>

      <div class="form-actions">
        <!-- On appelle createUser ou updateUser selon le mode -->
        <button @click="isCreating ? createUser() : updateUser()" class="btn btn-primary">
          {{ isCreating ? 'Créer' : 'Sauvegarder' }}
        </button>
        <button @click="closeForm" class="btn btn-secondary">Annuler</button>
      </div>
    </div>

    <!-- ── Liste des utilisateurs ─────────────────────────────── -->
    <table class="users-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nom</th>
          <th>Email</th>
          <th>Username</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.id }}</td>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>@{{ user.username }}</td>
          <td class="actions-cell">
            <button @click="openEditForm(user)" class="btn btn-sm btn-edit">✏️</button>
            <button @click="deleteUser(user.id)" class="btn btn-sm btn-delete">🗑️</button>
          </td>
        </tr>
        <tr v-if="users.length === 0 && !loading">
          <td colspan="5" class="empty">Aucun utilisateur</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.crud-app { max-width: 900px; margin: 0 auto; padding: 1.5rem; font-family: system-ui, sans-serif; }

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.alert-error {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #dc2626;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.loading-overlay {
  text-align: center;
  padding: 1rem;
  color: #6b7280;
}

.form-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem; }
.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-actions { display: flex; gap: 0.5rem; }

.users-table { width: 100%; border-collapse: collapse; }
.users-table th, .users-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}
.users-table th { font-size: 0.8rem; color: #6b7280; text-transform: uppercase; }

.actions-cell { display: flex; gap: 0.5rem; }

.btn { padding: 0.4rem 1rem; border: none; border-radius: 5px; cursor: pointer; font-size: 0.9rem; }
.btn-primary { background: #3b82f6; color: white; }
.btn-secondary { background: #e5e7eb; color: #374151; }
.btn-sm { padding: 0.25rem 0.5rem; }
.btn-edit { background: #fef3c7; }
.btn-delete { background: #fee2e2; }
</style>
```

---

## Points d'attention

| Opération | Méthode HTTP | URL |
|-----------|-------------|-----|
| Lire la liste | `GET` | `/users` |
| Créer | `POST` | `/users` |
| Modifier | `PUT` | `/users/:id` |
| Supprimer | `DELETE` | `/users/:id` |

**Toujours** écrire le bloc `try / catch / finally` lors d'un appel API :
- `try` : le code optimiste (ça marche)
- `catch` : gestion de l'erreur  
- `finally` : nettoyage (arrêter le spinner) — s'exécute quoi qu'il arrive
