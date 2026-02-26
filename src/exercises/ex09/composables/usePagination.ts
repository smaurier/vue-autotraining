import { ref, computed, type Ref, type ComputedRef } from "vue";

interface UsePaginationReturn<T> {
  page: Ref<number>;
  paged: ComputedRef<T[]>;
  total: ComputedRef<number>;
  totalPages: ComputedRef<number>;
  next: () => void;
  prev: () => void;
}

/**
 * TODO: Pagination d'un tableau
 */
export function usePagination<T>(
  items: Ref<T[]> | ComputedRef<T[]>,
  perPage: number = 10,
): UsePaginationReturn<T> {
  // TODO: ref page (1-indexed)
  // TODO: computed paged, total, totalPages
  // TODO: functions next, prev
  const page = ref(1);
  const total = computed(() => items.value.length);
  const totalPages = computed(() => Math.ceil(total.value / perPage));
  const paged = computed(() => items.value);
  const next = (): void => {
    /* TODO */
  };
  const prev = (): void => {
    /* TODO */
  };
  return { page, paged, total, totalPages, next, prev };
}
