import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { CartItem, ProductInfo } from "../types";

/**
 * TODO: Store panier (setup syntax)
 */
export const useCartStore = defineStore("cart", () => {
  // TODO: state — items
  const items = ref<CartItem[]>([]);

  // TODO: getters — totalItems, totalPrice, isEmpty
  const totalItems = computed((): number => 0 /* TODO */);
  const totalPrice = computed((): number => 0 /* TODO */);
  const isEmpty = computed((): boolean => true /* TODO */);

  // TODO: actions — addItem, removeItem, updateQuantity, clearCart
  function addItem(_product: ProductInfo): void {
    /* TODO */
  }
  function removeItem(_id: number): void {
    /* TODO */
  }
  function updateQuantity(_id: number, _qty: number): void {
    /* TODO */
  }
  function clearCart(): void {
    /* TODO */
  }

  return {
    items,
    totalItems,
    totalPrice,
    isEmpty,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };
});
