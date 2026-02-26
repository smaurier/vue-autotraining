import { ref, computed, type Ref, type ComputedRef } from "vue";

interface UseVirtualScrollReturn<T> {
  visibleItems: ComputedRef<T[]>;
  totalHeight: ComputedRef<number>;
  offsetY: ComputedRef<number>;
  onScroll: (event: Event) => void;
}

/**
 * TODO: Virtual scrolling pour grandes listes
 */
export function useVirtualScroll<T>(
  items: Ref<T[]>,
  itemHeight: number,
  containerHeight: number,
): UseVirtualScrollReturn<T> {
  // TODO: ref scrollTop
  // TODO: computed startIndex, endIndex
  // TODO: computed visibleItems (slice)
  // TODO: computed totalHeight, offsetY
  // TODO: function onScroll
  const scrollTop = ref(0);
  const visibleItems = computed(() => items.value.slice(0, 20));
  const totalHeight = computed(() => items.value.length * itemHeight);
  const offsetY = computed(() => 0);
  const onScroll = (_event: Event): void => {
    /* TODO */
  };
  return { visibleItems, totalHeight, offsetY, onScroll };
}
