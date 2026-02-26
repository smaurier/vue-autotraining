import type { User, Post, Comment } from "../types";

// Données en mémoire
export const db = {
  users: [
    { id: 1, name: "Alice", email: "alice@example.com" },
    { id: 2, name: "Bob", email: "bob@example.com" },
  ] as User[],
  posts: [
    {
      id: 1,
      title: "Intro Vue 3",
      content: "Vue 3 est un framework...",
      authorId: 1,
    },
    {
      id: 2,
      title: "TypeScript tips",
      content: "TypeScript permet...",
      authorId: 2,
    },
    {
      id: 3,
      title: "Pinia state",
      content: "Pinia remplace Vuex...",
      authorId: 1,
    },
  ] as Post[],
  comments: [
    { id: 1, postId: 1, text: "Super article !", author: "Charlie" },
    { id: 2, postId: 1, text: "Merci !", author: "Diana" },
  ] as Comment[],
};

/**
 * TODO: Définir les types pour les queries et mutations
 * Le but est de typer les opérations GraphQL de manière stricte
 */
export interface QueryMap {
  users: { variables: Record<string, never>; result: User[] };
  user: { variables: { id: number }; result: User | undefined };
  posts: { variables: Record<string, never>; result: Post[] };
  post: { variables: { id: number }; result: Post | undefined };
}

export interface MutationMap {
  createPost: { variables: Omit<Post, "id">; result: Post };
  deletePost: { variables: { id: number }; result: boolean };
}
