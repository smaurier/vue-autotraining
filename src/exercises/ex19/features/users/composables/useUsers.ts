import { inject } from "vue";
import { HTTP_SERVICE_KEY } from "../../../types";
import { UserService } from "../../../services/UserService";
import { createCrudComposable } from "../../../patterns/createCrudComposable";
import type { User } from "../types";

/**
 * TODO: Composable métier pour les utilisateurs
 * Utilise le service injecté via provide/inject
 */
export function useUsers() {
  const http = inject(HTTP_SERVICE_KEY);
  if (!http) throw new Error("HttpService non fourni");

  const service = new UserService(http);
  const useCrud = createCrudComposable<User>(service);
  return useCrud();
}
