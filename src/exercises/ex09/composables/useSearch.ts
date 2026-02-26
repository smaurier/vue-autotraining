import { ref, computed, type Ref, type ComputedRef } from "vue";

interface UseSearchReturn<T> {
  query: Ref<string>;
  filtered: ComputedRef<T[]>;
}

/**
 * TODO: Recherche full-text sur un tableau d'objets
 */
export function useSearch<T extends Record<string, unknown>>(
  items: Ref<T[]>,
  searchFields: (keyof T)[],
): UseSearchReturn<T> {
  // TODO: ref query
  // TODO: computed filtered qui filtre items selon query sur searchFields
  const query = ref("");
  const filtered = computed(() => items.value);
  return { query, filtered };
}
