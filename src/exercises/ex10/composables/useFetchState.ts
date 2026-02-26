import { ref, type Ref } from "vue";

interface FetchState<T> {
  data: Ref<T | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  execute: () => Promise<void>;
}

/**
 * TODO: Composable pour gérer un appel async avec loading/error
 */
export function useFetchState<T>(fetcher: () => Promise<T>): FetchState<T> {
  // TODO: refs data, loading, error
  // TODO: function execute qui appelle fetcher avec try/catch
  const data = ref<T | null>(null) as Ref<T | null>;
  const loading = ref(false);
  const error = ref<string | null>(null);
  const execute = async (): Promise<void> => {
    // TODO
  };
  return { data, loading, error, execute };
}
