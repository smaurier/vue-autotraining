import { ref, type Ref } from "vue";

const cache = new Map<string, unknown>();

/**
 * TODO: Simule useAsyncData de Nuxt avec cache + déduplication
 */
export function useAsyncData<T>(key: string, handler: () => Promise<T>) {
  const data = ref<T | null>(null) as Ref<T | null>;
  const pending = ref(false);
  const error = ref<string | null>(null);

  async function refresh(): Promise<void> {
    // TODO: Vérifier le cache d'abord
    // TODO: Si pas en cache, appeler handler et mettre en cache
  }

  refresh();

  return { data, pending, error, refresh };
}
