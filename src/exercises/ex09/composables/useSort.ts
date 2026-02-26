import { ref, computed, type Ref, type ComputedRef } from "vue";

interface UseSortReturn<T> {
  sortKey: Ref<keyof T | "">;
  sortOrder: Ref<"asc" | "desc">;
  sorted: ComputedRef<T[]>;
  toggleSort: (key: keyof T) => void;
}

/**
 * TODO: Tri d'un tableau par colonne
 */
export function useSort<T>(
  items: Ref<T[]> | ComputedRef<T[]>,
  defaultKey?: keyof T,
): UseSortReturn<T> {
  // TODO: ref sortKey, sortOrder
  // TODO: computed sorted
  // TODO: function toggleSort
  const sortKey = ref<keyof T | "">(defaultKey ?? "") as Ref<keyof T | "">;
  const sortOrder = ref<"asc" | "desc">("asc");
  const sorted = computed(() => items.value);
  const toggleSort = (_key: keyof T): void => {
    /* TODO */
  };
  return { sortKey, sortOrder, sorted, toggleSort };
}
