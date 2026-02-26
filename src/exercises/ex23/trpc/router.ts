import type { User, Post } from "../types";
import { db } from "../graphql/schema";

/**
 * TODO: Définir un router tRPC simplifié avec inférence de types
 */

type ProcedureDef<TInput, TOutput> = {
  input: TInput;
  output: TOutput;
  resolve: (input: TInput) => Promise<TOutput>;
};

// TODO: Définir le routeur avec les procédures typées
export const appRouter = {
  user: {
    getAll: {
      resolve: async (): Promise<User[]> => db.users,
    },
    getById: {
      resolve: async (input: { id: number }): Promise<User | undefined> =>
        db.users.find((u) => u.id === input.id),
    },
    create: {
      resolve: async (input: Omit<User, "id">): Promise<User> => {
        const user: User = { ...input, id: db.users.length + 1 };
        db.users.push(user);
        return user;
      },
    },
  },
  post: {
    getAll: {
      resolve: async (): Promise<Post[]> => db.posts,
    },
    getByAuthor: {
      resolve: async (input: { authorId: number }): Promise<Post[]> =>
        db.posts.filter((p) => p.authorId === input.authorId),
    },
    create: {
      resolve: async (input: Omit<Post, "id">): Promise<Post> => {
        const post: Post = { ...input, id: db.posts.length + 1 };
        db.posts.push(post);
        return post;
      },
    },
  },
};

export type AppRouter = typeof appRouter;
