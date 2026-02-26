import { ref, type Ref } from "vue";
import type { FetchReturn } from "../types";

/**
 * TODO: Simule le composable useFetch de Nuxt
 * Charge les données avec un délai et gère loading/error
 */
export function useFetch<T>(fetcher: () => Promise<T>): FetchReturn<T> {
  const data = ref<T | null>(null) as Ref<T | null>;
  const pending = ref(false);
  const error = ref<string | null>(null);

  async function refresh(): Promise<void> {
    // TODO: Appeler fetcher avec gestion loading/error
  }

  // TODO: Appeler refresh() immédiatement
  refresh();

  return { data, pending, error, refresh };
}
