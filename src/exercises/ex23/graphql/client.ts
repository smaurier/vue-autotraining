import { ref, type Ref } from "vue";
import type { QueryMap, MutationMap } from "./schema";
import { db } from "./schema";

/**
 * TODO: useQuery — composable typé pour les queries GraphQL
 */
export function useQuery<K extends keyof QueryMap>(
  _query: K,
  _variables?: QueryMap[K]["variables"],
): {
  data: Ref<QueryMap[K]["result"] | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
} {
  const data = ref(null) as Ref<QueryMap[K]["result"] | null>;
  const loading = ref(false);
  const error = ref<string | null>(null);

  // TODO: Résoudre la query en fonction de K
  // TODO: Simuler un délai

  return { data, loading, error };
}

/**
 * TODO: useMutation — composable typé pour les mutations GraphQL
 */
export function useMutation<K extends keyof MutationMap>(
  _mutation: K,
): {
  mutate: (
    variables: MutationMap[K]["variables"],
  ) => Promise<MutationMap[K]["result"]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
} {
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function mutate(
    _variables: MutationMap[K]["variables"],
  ): Promise<MutationMap[K]["result"]> {
    // TODO: Exécuter la mutation
    return undefined as unknown as MutationMap[K]["result"];
  }

  return { mutate, loading, error };
}
