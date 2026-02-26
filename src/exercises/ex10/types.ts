export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
}

export type CreateUserData = Omit<User, "id">;
export type UpdateUserData = Partial<CreateUserData>;
