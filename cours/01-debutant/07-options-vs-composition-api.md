# 07 — Options API vs Composition API

## Les deux styles d'ecriture de Vue 3

Vue 3 supporte deux approches. Tu dois connaitre les deux car en ESN, tu tomberas sur les deux.

## Options API

```vue
<script lang="ts">
import { defineComponent } from "vue";

interface Todo {
  id: number;
  label: string;
  done: boolean;
}

export default defineComponent({
  data() {
    return {
      todos: [] as Todo[],
      newLabel: "",
    };
  },

  computed: {
    remaining(): number {
      return this.todos.filter((t) => !t.done).length;
    },
  },

  methods: {
    addTodo(): void {
      if (!this.newLabel.trim()) return;
      this.todos.push({
        id: Date.now(),
        label: this.newLabel.trim(),
        done: false,
      });
      this.newLabel = "";
    },

    removeTodo(id: number): void {
      this.todos = this.todos.filter((t) => t.id !== id);
    },
  },

  mounted() {
    console.log("Composant monte");
  },
});
</script>
```

**Logique organisee par type** : toutes les data ensemble, tous les computed ensemble, toutes les methods ensemble.

## Composition API

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

interface Todo {
  id: number;
  label: string;
  done: boolean;
}

const todos = ref<Todo[]>([]);
const newLabel = ref<string>("");

const remaining = computed<number>(
  () => todos.value.filter((t) => !t.done).length,
);

function addTodo(): void {
  if (!newLabel.value.trim()) return;
  todos.value.push({
    id: Date.now(),
    label: newLabel.value.trim(),
    done: false,
  });
  newLabel.value = "";
}

function removeTodo(id: number): void {
  todos.value = todos.value.filter((t) => t.id !== id);
}

onMounted(() => {
  console.log("Composant monte");
});
</script>
```

**Logique organisee par feature** : tout ce qui concerne les todos est ensemble.

## Comparaison

| Critere                | Options API                        | Composition API     |
| ---------------------- | ---------------------------------- | ------------------- |
| Organisation           | Par type (data, methods, computed) | Par feature         |
| TypeScript             | Acceptable mais verbeux            | Naturel             |
| Reutilisation          | Mixins (problematiques)            | Composables (clean) |
| Testabilite            | Moyenne                            | Excellente          |
| Courbe d'apprentissage | Plus douce                         | Plus raide au debut |
| Gros composants        | Code eclate                        | Code regroupe       |

## Quand utiliser quoi ?

| Contexte                           | Choix                             |
| ---------------------------------- | --------------------------------- |
| Nouveau projet Vue 3               | **Composition API**               |
| Code legacy Vue 2 a maintenir      | Options API                       |
| Composant tres simple (<30 lignes) | Les deux se valent                |
| Logique complexe partagee          | **Composition API** (composables) |

## Position du parcours

- **On code en Composition API** (`<script setup lang="ts">`)
- On sait **lire** et **maintenir** l'Options API (code existant en mission)
- Les exercices utilisent exclusivement Composition API

## Suite

→ Module 02 : `cours/02-intermediaire/01-composition-api-avancee.md`
