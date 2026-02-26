import type { InjectionKey } from "vue";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
}

export type CreateUserInput = Omit<User, "id">;

export interface IHttpService {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, data: unknown): Promise<T>;
  put<T>(url: string, data: unknown): Promise<T>;
  delete(url: string): Promise<void>;
}

export const HTTP_SERVICE_KEY: InjectionKey<IHttpService> =
  Symbol("HttpService");

export interface EventMap {
  "user:created": User;
  "user:deleted": number;
  notification: string;
}
