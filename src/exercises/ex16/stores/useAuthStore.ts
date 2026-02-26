import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { User, LoginCredentials } from "../types";

/**
 * TODO: Store d'authentification (setup syntax)
 */
export const useAuthStore = defineStore("auth", () => {
  // TODO: state — user, token
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);

  // TODO: getters — isAuthenticated, userDisplayName
  const isAuthenticated = computed((): boolean => false /* TODO */);
  const userDisplayName = computed((): string => "" /* TODO */);

  // TODO: actions — login, logout, checkAuth
  async function login(_credentials: LoginCredentials): Promise<void> {
    // TODO: Simuler un login (délai + user mock)
  }

  function logout(): void {
    // TODO
  }

  return { user, token, isAuthenticated, userDisplayName, login, logout };
});
