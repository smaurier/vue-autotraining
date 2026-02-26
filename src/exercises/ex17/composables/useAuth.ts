import { ref, computed } from "vue";
import type { AuthState, LoginCredentials } from "../types";

/**
 * TODO: Composable d'authentification
 */
export function useAuth() {
  const state = ref<AuthState>({
    isAuthenticated: false,
    user: null,
    error: null,
  });

  const isAuthenticated = computed(() => state.value.isAuthenticated);
  const user = computed(() => state.value.user);
  const error = computed(() => state.value.error);

  async function login(_credentials: LoginCredentials): Promise<void> {
    // TODO: Simuler un login
  }

  function logout(): void {
    // TODO: Reset state
  }

  return { isAuthenticated, user, error, login, logout };
}
