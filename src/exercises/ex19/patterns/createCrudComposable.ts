import { ref, type Ref } from "vue";

interface CrudComposable<T> {
  items: Ref<T[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  fetchAll: () => Promise<void>;
  create: (data: Omit<T, "id">) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

interface CrudService<T> {
  getAll(): Promise<T[]>;
  create(data: Omit<T, "id">): Promise<T>;
  delete(id: number): Promise<void>;
}

/**
 * TODO: Factory de composable CRUD générique
 */
export function createCrudComposable<T extends { id: number }>(
  service: CrudService<T>,
): () => CrudComposable<T> {
  return () => {
    const items = ref<T[]>([]) as Ref<T[]>;
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchAll(): Promise<void> {
      // TODO: Charger tous les items via service.getAll()
    }

    async function create(data: Omit<T, "id">): Promise<void> {
      // TODO: Créer un item via service.create()
    }

    async function remove(id: number): Promise<void> {
      // TODO: Supprimer un item via service.delete()
    }

    return { items, loading, error, fetchAll, create, remove };
  };
}
