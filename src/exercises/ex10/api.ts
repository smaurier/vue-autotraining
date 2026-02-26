import type { User, CreateUserData, UpdateUserData } from "./types";

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const maybeError = (): void => {
  if (Math.random() < 0.2) throw new Error("Erreur réseau simulée");
};

let users: User[] = [
  { id: 1, name: "Alice", email: "alice@example.com", role: "admin" },
  { id: 2, name: "Bob", email: "bob@example.com", role: "user" },
  { id: 3, name: "Claire", email: "claire@example.com", role: "user" },
];
let nextId = 4;

export async function fetchUsers(): Promise<User[]> {
  await delay(500 + Math.random() * 1000);
  maybeError();
  return [...users];
}

export async function createUser(data: CreateUserData): Promise<User> {
  await delay(500 + Math.random() * 1000);
  maybeError();
  const user: User = { ...data, id: nextId++ };
  users.push(user);
  return user;
}

export async function updateUser(
  id: number,
  data: UpdateUserData,
): Promise<User> {
  await delay(500 + Math.random() * 1000);
  maybeError();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) throw new Error("Utilisateur introuvable");
  users[index] = { ...users[index], ...data };
  return users[index];
}

export async function deleteUser(id: number): Promise<void> {
  await delay(500 + Math.random() * 1000);
  maybeError();
  users = users.filter((u) => u.id !== id);
}
