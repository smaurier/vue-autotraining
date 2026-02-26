# 02 — Ecrire des stories

## Première story

```ts
// src/components/AppButton.stories.ts
import type { Meta, StoryObj } from "@storybook/vue3";
import AppButton from "./AppButton.vue";

const meta: Meta<typeof AppButton> = {
  title: "UI/AppButton",
  component: AppButton,
  tags: ["autodocs"], // Genere la page de doc auto
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "danger"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Story par defaut
export const Default: Story = {
  args: {
    label: "Cliquez ici",
    variant: "primary",
    size: "md",
  },
};

// Variantes
export const Secondary: Story = {
  args: {
    label: "Annuler",
    variant: "secondary",
  },
};

export const Danger: Story = {
  args: {
    label: "Supprimer",
    variant: "danger",
  },
};

export const Disabled: Story = {
  args: {
    label: "Indisponible",
    disabled: true,
  },
};

export const AllSizes: Story = {
  render: () => ({
    components: { AppButton },
    template: `
      <div style="display: flex; gap: 8px; align-items: center">
        <AppButton label="Small" size="sm" />
        <AppButton label="Medium" size="md" />
        <AppButton label="Large" size="lg" />
      </div>
    `,
  }),
};
```

## Story avec slots

```ts
export const WithIcon: Story = {
  render: (args) => ({
    components: { AppButton },
    setup() {
      return { args };
    },
    template: `
      <AppButton v-bind="args">
        <template #icon>🔥</template>
        Avec icone
      </AppButton>
    `,
  }),
};
```

## Story avec actions (events)

```ts
import { fn } from "@storybook/test";

export const WithClick: Story = {
  args: {
    label: "Cliquez",
    onClick: fn(), // Log l'evenement dans le panel Actions
  },
};
```

## Story avec decorateurs

```ts
const meta: Meta<typeof AppButton> = {
  // ...
  decorators: [
    (story) => ({
      components: { story },
      template:
        '<div style="padding: 16px; background: #f5f5f5"><story /></div>',
    }),
  ],
};
```

## Organisation des stories

```
src/
  components/
    ui/
      AppButton.vue
      AppButton.stories.ts
      AppInput.vue
      AppInput.stories.ts
    domain/
      ProductCard.vue
      ProductCard.stories.ts
```

Convention : le fichier story est **a cote du composant**.

## Suite

→ `cours/06-storybook/03-design-system.md`
