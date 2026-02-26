# 01 — GraphQL avec Vue 3

## Qu'est-ce que GraphQL ?

Une alternative a REST ou le client **demande exactement les donnees dont il a besoin**.

```graphql
# REST : GET /api/users/1 → retourne TOUT le user
# GraphQL :
query {
  user(id: 1) {
    name
    email
    # Pas de avatar, pas de createdAt → pas envoye
  }
}
```

## Setup avec `@vue/apollo-composable`

```bash
pnpm add @apollo/client @vue/apollo-composable graphql
```

```ts
// plugins/apollo.ts
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
} from "@apollo/client/core";
import { provideApolloClient } from "@vue/apollo-composable";

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || "/graphql",
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
```

```ts
// main.ts
import { DefaultApolloClient } from "@vue/apollo-composable";
import { apolloClient } from "./plugins/apollo";

const app = createApp(App);
app.provide(DefaultApolloClient, apolloClient);
```

## Queries

```vue
<script setup lang="ts">
import { useQuery } from "@vue/apollo-composable";
import gql from "graphql-tag";

interface User {
  id: number;
  name: string;
  email: string;
}

interface UsersQuery {
  users: User[];
}

const USERS_QUERY = gql`
  query GetUsers {
    users {
      id
      name
      email
    }
  }
`;

const { result, loading, error } = useQuery<UsersQuery>(USERS_QUERY);
const users = computed(() => result.value?.users ?? []);
</script>

<template>
  <div v-if="loading">Chargement...</div>
  <div v-else-if="error">{{ error.message }}</div>
  <ul v-else>
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

## Mutations

```ts
import { useMutation } from "@vue/apollo-composable";

const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      name
      email
    }
  }
`;

const { mutate: createUser, loading: creating } = useMutation(CREATE_USER);

async function handleSubmit(): Promise<void> {
  await createUser({
    input: { name: form.name, email: form.email },
  });
}
```

## Code generation (type-safe)

```bash
pnpm add -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-vue-apollo
```

```yaml
# codegen.yml
schema: http://localhost:4000/graphql
documents: "src/**/*.graphql"
generates:
  src/generated/graphql.ts:
    plugins:
      - typescript
      - typescript-operations
      - typescript-vue-apollo
```

```bash
pnpm graphql-codegen
```

Resultat : des composables types automatiquement generes a partir de tes queries/mutations `.graphql`.

## Suite

→ `cours/08-api-typees/02-trpc.md`
