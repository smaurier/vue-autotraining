# 🚀 DevDesk — Le Projet Fil Rouge

> **Un vrai projet, construit brique par brique, du premier au dernier module.**

---

## 🎯 C'est quoi DevDesk ?

**DevDesk** est une application de gestion de tâches — dans le style de Trello ou Linear — que tu vas construire **progressivement tout au long de la formation**.

Chaque module ajoute une nouvelle couche au projet. À la fin, tu n'as pas juste "fait des exercices" : tu as **une vraie application**, prête à être déployée, que tu peux montrer dans ton portfolio.

### Ce que fait l'app finale

| Fonctionnalité | Description |
|---|---|
| 📋 Gestion de tâches | Titre, description, statut, priorité, assigné |
| 📊 Dashboard | Statistiques en temps réel |
| 🔍 Filtres & tri | Par statut, priorité, assigné, date |
| 📝 Formulaires | Création de tâche, profil utilisateur |
| 🌐 Données API | Fetch, cache, états de chargement |
| 🗺️ Multi-pages | Routing avec Vue Router |
| 🗃️ État global | Store Pinia partagé entre les pages |
| 🔐 Authentification | Login / register + rôles admin/user |
| 🌍 i18n | Interface en français et en anglais |
| ♿ Accessibilité | Audit complet, navigation clavier, ARIA |
| 🧪 Tests | Tests unitaires et d'intégration |
| ⚙️ CI/CD | Pipeline de déploiement automatisé |

---

## 📈 La progression module par module

Chaque module correspond à un **chapitre** de la formation. Tu retrouveras dans chaque dossier d'exercices la partie DevDesk associée, préfixée `devdesk-`.

| # | Module | Ce qu'on construit dans DevDesk | Exercices liés |
|---|--------|----------------------------------|----------------|
| 00 | **TypeScript** | Définir toutes les interfaces TypeScript du projet : `Task`, `User`, `Project`, `Priority`, `Status`... C'est la colonne vertébrale de tout ce qui suit. | `devdesk-types` |
| 01 | **Débutant** | Compteur de stats de tâches, liste de tâches (TodoList → TaskList), formulaire de profil (Contact), catalogue de tâches (Catalog), minuteur de travail (Stopwatch) | `devdesk-stats-counter`, `devdesk-task-list`, `devdesk-profile-form`, `devdesk-task-catalog`, `devdesk-work-timer` |
| 02 | **Intermédiaire** | Thème sombre/clair, filtres dashboard (statut/priorité), CRUD API pour les tâches, assistant de création en plusieurs étapes (Multi-step form), cartes profil, tableau réutilisable, transitions animées | `devdesk-theme`, `devdesk-filters`, `devdesk-api-crud`, `devdesk-task-wizard`, `devdesk-profile-card`, `devdesk-task-table`, `devdesk-transitions` |
| 03 | **Avancé** | Navigation multi-pages (Dashboard / Tâches / Profil), store Pinia pour l'état global des tâches, suite de tests complète | `devdesk-router`, `devdesk-store`, `devdesk-tests` |
| 04 | **Expert** | Optimisations de performance (lazy loading, memoïsation), concepts SSR/hydration, patterns d'architecture avancés | `devdesk-perf`, `devdesk-ssr-concepts`, `devdesk-architecture` |
| 05 | **Nuxt 3** | Version Nuxt complète de DevDesk avec SSR, pages générées statiquement, SEO | `devdesk-nuxt` |
| 06 | **Storybook** | Kit UI des composants DevDesk documentés et interactifs | `devdesk-storybook` |
| 07 | **CI/CD** | Pipeline GitHub Actions pour tester et déployer DevDesk automatiquement | `devdesk-cicd` |
| 08 | **API typées** | Client API TypeScript typé bout en bout pour DevDesk | `devdesk-typed-api` |
| 09 | **A11y** | Audit d'accessibilité complet, navigation clavier, rôles ARIA, contraste | `devdesk-a11y` |
| 10 | **i18n** | Traduction complète FR/EN de l'interface DevDesk | `devdesk-i18n` |
| 11 | **Auth** | Login / Register, JWT, RBAC : rôle admin (gère tout) vs user (gère ses tâches) | `devdesk-auth` |
| 12 | **Vue Query** | Migration des appels API vers TanStack Query : cache, refetch, pagination | `devdesk-query` |

---

## 🗂️ Architecture finale du projet

Voici la structure du dossier `devdesk/` à la fin du parcours complet :

```
devdesk/
├── public/
│   └── favicon.ico
│
├── src/
│   ├── main.ts                    # Point d'entrée, plugins (i18n, pinia, router)
│   ├── App.vue                    # Composant racine, layout, thème
│   │
│   ├── types/                     # 📐 Toutes les interfaces TypeScript (Module 00)
│   │   ├── task.ts
│   │   ├── user.ts
│   │   ├── project.ts
│   │   └── index.ts
│   │
│   ├── router/                    # 🗺️ Vue Router (Module 03)
│   │   └── index.ts
│   │
│   ├── stores/                    # 🗃️ Pinia stores (Module 03)
│   │   ├── taskStore.ts
│   │   ├── userStore.ts
│   │   └── authStore.ts
│   │
│   ├── composables/               # 🧩 Logique réutilisable
│   │   ├── useTaskFilters.ts
│   │   ├── useTheme.ts
│   │   ├── useAuth.ts
│   │   └── useWorkTimer.ts
│   │
│   ├── api/                       # 🌐 Couche API typée (Module 08)
│   │   ├── client.ts
│   │   ├── tasks.ts
│   │   ├── users.ts
│   │   └── auth.ts
│   │
│   ├── pages/                     # 📄 Pages principales
│   │   ├── DashboardPage.vue
│   │   ├── TasksPage.vue
│   │   ├── TaskDetailPage.vue
│   │   ├── ProfilePage.vue
│   │   ├── LoginPage.vue
│   │   └── RegisterPage.vue
│   │
│   ├── components/                # 🧱 Composants UI
│   │   ├── layout/
│   │   │   ├── AppHeader.vue
│   │   │   ├── AppSidebar.vue
│   │   │   └── AppFooter.vue
│   │   ├── task/
│   │   │   ├── TaskCard.vue
│   │   │   ├── TaskTable.vue
│   │   │   ├── TaskFilters.vue
│   │   │   ├── TaskBadge.vue
│   │   │   └── TaskWizard.vue
│   │   ├── dashboard/
│   │   │   ├── StatsCounter.vue
│   │   │   └── StatusChart.vue
│   │   ├── user/
│   │   │   ├── ProfileCard.vue
│   │   │   └── ProfileForm.vue
│   │   └── ui/
│   │       ├── BaseButton.vue
│   │       ├── BaseInput.vue
│   │       ├── BaseModal.vue
│   │       └── WorkTimer.vue
│   │
│   ├── locales/                   # 🌍 Traductions i18n (Module 10)
│   │   ├── fr.json
│   │   └── en.json
│   │
│   └── assets/
│       ├── styles/
│       │   ├── main.css
│       │   └── themes.css
│       └── images/
│
├── tests/                         # 🧪 Tests (Module 03)
│   ├── unit/
│   │   ├── taskStore.test.ts
│   │   └── useTaskFilters.test.ts
│   └── integration/
│       ├── TasksPage.test.ts
│       └── LoginPage.test.ts
│
├── .github/
│   └── workflows/
│       └── deploy.yml             # ⚙️ CI/CD (Module 07)
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🔷 Les types TypeScript du projet

Ces interfaces sont définies dès le **Module 00** et utilisées dans **tous les modules suivants**. C'est le contrat de données de toute l'application.

```typescript
// types/task.ts

export type TaskStatus = 'open' | 'in-progress' | 'closed'
export type Priority   = 'low' | 'medium' | 'high' | 'critical'

export interface Task {
  id:          string
  title:       string
  description: string
  status:      TaskStatus
  priority:    Priority
  assigneeId:  string | null
  projectId:   string
  createdAt:   string       // ISO date
  updatedAt:   string
  dueDate:     string | null
  tags:        string[]
}
```

```typescript
// types/user.ts

export type UserRole = 'admin' | 'user'

export interface User {
  id:        string
  username:  string
  email:     string
  avatarUrl: string | null
  role:      UserRole
  createdAt: string
}
```

```typescript
// types/project.ts

export interface Project {
  id:          string
  name:        string
  description: string
  ownerId:     string
  memberIds:   string[]
  createdAt:   string
}
```

```typescript
// types/index.ts  — re-export tout depuis un seul point d'entrée

export type { Task, TaskStatus, Priority } from './task'
export type { User, UserRole }            from './user'
export type { Project }                   from './project'
```

---

## 🖼️ Screenshots / Wireframes

Ces maquettes te donnent une idée de ce que tu vas construire. Chaque écran sera implémenté progressivement.

---

### 📊 Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  🟦 DevDesk        [ FR | EN ]    👤 Alice   [☀️ / 🌙]  │
├──────────────┬──────────────────────────────────────────┤
│              │  Tableau de bord                          │
│  📊 Dashboard│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  ✅ Tâches   │  │  12      │ │   5      │ │   3      │ │
│  👤 Profil   │  │ Ouvertes │ │ En cours │ │ Fermées  │ │
│              │  └──────────┘ └──────────┘ └──────────┘ │
│              │                                           │
│              │  Tâches récentes           [ + Nouvelle ] │
│              │  ┌───────────────────────────────────┐   │
│              │  │ 🔴 Fix login bug       🏷️ Critical │   │
│              │  │ 🟡 Update profile form 🏷️ Medium   │   │
│              │  │ 🟢 Add dark mode       🏷️ Low      │   │
│              │  └───────────────────────────────────┘   │
└──────────────┴──────────────────────────────────────────┘
```

---

### ✅ Liste des tâches

```
┌─────────────────────────────────────────────────────────┐
│  🟦 DevDesk        [ FR | EN ]    👤 Alice   [☀️ / 🌙]  │
├──────────────┬──────────────────────────────────────────┤
│              │  Tâches                     [ + Nouvelle ]│
│  📊 Dashboard│                                           │
│  ✅ Tâches   │  Statut: [Tous ▾]  Priorité: [Tous ▾]    │
│  👤 Profil   │  Assigné: [Tous ▾]  🔍 Rechercher...      │
│              │                                           │
│              │  ┌──┬──────────────────┬──────┬────────┐ │
│              │  │☑ │ Titre            │Statut│Priorité│ │
│              │  ├──┼──────────────────┼──────┼────────┤ │
│              │  │☐ │ Fix login bug    │🔵 IP │🔴 Crit.│ │
│              │  │☐ │ Update form      │🟡 New│🟠 High │ │
│              │  │☑ │ Add dark mode    │🟢 OK │🟢 Low  │ │
│              │  └──┴──────────────────┴──────┴────────┘ │
│              │  Affichage 1-10 sur 20   [ < ] Page 1 [ > ]│
└──────────────┴──────────────────────────────────────────┘
```

---

### 🔍 Détail d'une tâche

```
┌─────────────────────────────────────────────────────────┐
│  🟦 DevDesk        [ FR | EN ]    👤 Alice   [☀️ / 🌙]  │
├──────────────┬──────────────────────────────────────────┤
│              │  ← Retour   Fix login bug     [✏️][🗑️]  │
│  📊 Dashboard│                                           │
│  ✅ Tâches   │  Description                              │
│  👤 Profil   │  ┌─────────────────────────────────────┐ │
│              │  │ Le formulaire de connexion ne valide │ │
│              │  │ pas correctement les emails...       │ │
│              │  └─────────────────────────────────────┘ │
│              │                                           │
│              │  Statut      [🔵 En cours  ▾]            │
│              │  Priorité    [🔴 Critical  ▾]            │
│              │  Assigné     [👤 Bob       ▾]            │
│              │  Échéance    📅 05/03/2026                │
│              │                                           │
│              │  ⏱️  Temps passé : 1h 24min   [ Démarrer ]│
└──────────────┴──────────────────────────────────────────┘
```

---

### 👤 Profil utilisateur

```
┌─────────────────────────────────────────────────────────┐
│  🟦 DevDesk        [ FR | EN ]    👤 Alice   [☀️ / 🌙]  │
├──────────────┬──────────────────────────────────────────┤
│              │  Mon profil                               │
│  📊 Dashboard│                                           │
│  ✅ Tâches   │       ┌──────────┐                        │
│  👤 Profil   │       │  👤      │   Alice Martin         │
│              │       │  Avatar  │   alice@devdesk.io     │
│              │       └──────────┘   🏷️ Admin             │
│              │                                           │
│              │  ┌─────────────────────────────────────┐ │
│              │  │ Nom         [Alice Martin          ] │ │
│              │  │ Email       [alice@devdesk.io      ] │ │
│              │  │ Mot de passe[••••••••              ] │ │
│              │  │ Langue      [🇫🇷 Français          ▾] │ │
│              │  │                     [ Enregistrer ] │ │
│              │  └─────────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────────┘
```

---

## 💡 Pourquoi ce projet ?

> **Les exercices isolés, c'est bien. Un vrai projet, c'est mieux.**

Chaque concept que tu apprends a un **sens concret** dans DevDesk :

- Les `ref` et `computed` ? Tu les utiliseras pour les filtres et les compteurs.
- Les `composables` ? Tu en créeras pour la gestion du timer et des filtres.
- Pinia ? Tu gèreras l'état des tâches à travers toutes les pages.
- Les tests ? Tu testeras ton propre store, tes propres composants.
- Le CI/CD ? Tu déploieras **ta** vraie app.

À la fin de la formation, tu peux dire : **"J'ai construit DevDesk de A à Z."**

C'est ce qui fait la différence sur un CV. 🎯

---

## 🗺️ Pour commencer

Le dossier du projet fil rouge se trouve ici :

```
vue-autotraining/
└── projet-fil-rouge/
    ├── README.md           ← tu es ici
    └── devdesk/            ← le projet que tu vas construire
        └── ...             (créé au fil des modules)
```

Chaque module te dira exactement **quoi ajouter** à DevDesk, avec une référence aux exercices du module. Tu construis la même app, tu la fais grandir, et tu la vois prendre vie. 🚀
