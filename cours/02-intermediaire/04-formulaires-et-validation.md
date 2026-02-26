# 04 — Formulaires et validation

## Structure d'un formulaire type

```vue
<script setup lang="ts">
import { reactive, computed } from "vue";

interface ContactForm {
  name: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

const form = reactive<ContactForm>({
  name: "",
  email: "",
  message: "",
});

const errors = computed<FormErrors>(() => {
  const e: FormErrors = {};
  if (!form.name.trim()) e.name = "Le nom est requis";
  if (!form.email.includes("@")) e.email = "Email invalide";
  if (form.message.length < 10) e.message = "Minimum 10 caracteres";
  return e;
});

const isValid = computed(() => Object.keys(errors.value).length === 0);

const submitted = ref(false);

function handleSubmit(): void {
  submitted.value = true;
  if (!isValid.value) return;

  // Envoyer les donnees
  console.log("Submit:", form);
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <label>Nom</label>
      <input v-model.trim="form.name" />
      <span v-if="submitted && errors.name" class="error">{{
        errors.name
      }}</span>
    </div>

    <div>
      <label>Email</label>
      <input v-model.trim="form.email" type="email" />
      <span v-if="submitted && errors.email" class="error">{{
        errors.email
      }}</span>
    </div>

    <div>
      <label>Message</label>
      <textarea v-model="form.message"></textarea>
      <span v-if="submitted && errors.message" class="error">{{
        errors.message
      }}</span>
    </div>

    <button type="submit" :disabled="submitted && !isValid">Envoyer</button>
  </form>
</template>
```

## Composable de validation

```ts
// composables/useFormValidation.ts
import { reactive, computed, type ComputedRef } from "vue";

type ValidationRule<T> = (value: T) => string | undefined;
type ValidationRules<T> = { [K in keyof T]?: ValidationRule<T[K]>[] };

interface UseFormReturn<T extends Record<string, any>> {
  form: T;
  errors: ComputedRef<Partial<Record<keyof T, string>>>;
  isValid: ComputedRef<boolean>;
  touched: Record<keyof T, boolean>;
  touch: (field: keyof T) => void;
  reset: () => void;
}

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  rules: ValidationRules<T>,
): UseFormReturn<T> {
  const form = reactive<T>({ ...initialValues }) as T;

  const touched = reactive(
    Object.fromEntries(Object.keys(initialValues).map((k) => [k, false])),
  ) as Record<keyof T, boolean>;

  const errors = computed(() => {
    const result: Partial<Record<keyof T, string>> = {};
    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = form[field as keyof T];
      for (const rule of fieldRules as ValidationRule<any>[]) {
        const error = rule(value);
        if (error) {
          result[field as keyof T] = error;
          break;
        }
      }
    }
    return result;
  });

  const isValid = computed(() => Object.keys(errors.value).length === 0);

  function touch(field: keyof T): void {
    touched[field] = true;
  }

  function reset(): void {
    Object.assign(form, initialValues);
    for (const key of Object.keys(touched)) {
      touched[key as keyof T] = false;
    }
  }

  return { form, errors, isValid, touched, touch, reset };
}
```

### Règles de validation réutilisables

```ts
// utils/validators.ts
export const required =
  (msg = "Champ requis") =>
  (value: string): string | undefined =>
    value.trim() ? undefined : msg;

export const minLength =
  (min: number, msg?: string) =>
  (value: string): string | undefined =>
    value.length >= min ? undefined : (msg ?? `Minimum ${min} caracteres`);

export const email =
  (msg = "Email invalide") =>
  (value: string): string | undefined =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : msg;

export const pattern =
  (regex: RegExp, msg: string) =>
  (value: string): string | undefined =>
    regex.test(value) ? undefined : msg;
```

### Utilisation

```vue
<script setup lang="ts">
import { useForm } from "@/composables/useFormValidation";
import { required, email, minLength } from "@/utils/validators";

const { form, errors, isValid, touched, touch, reset } = useForm(
  { name: "", email: "", message: "" },
  {
    name: [required()],
    email: [required(), email()],
    message: [required(), minLength(10)],
  },
);
</script>
```

## Formulaire multi-étapes

```vue
<script setup lang="ts">
const step = ref<number>(1);
const maxSteps = 3;

function nextStep(): void {
  if (step.value < maxSteps) step.value++;
}

function prevStep(): void {
  if (step.value > 1) step.value--;
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div v-if="step === 1">
      <!-- Etape 1 : infos personnelles -->
    </div>
    <div v-else-if="step === 2">
      <!-- Etape 2 : adresse -->
    </div>
    <div v-else>
      <!-- Etape 3 : confirmation -->
    </div>

    <div class="row">
      <button type="button" @click="prevStep" :disabled="step === 1">
        Precedent
      </button>
      <button type="button" @click="nextStep" v-if="step < maxSteps">
        Suivant
      </button>
      <button type="submit" v-else>Valider</button>
    </div>
  </form>
</template>
```

## Exercice

→ `exercices/08-formulaire-multi-etapes/ENONCE.md`

## Suite

→ `cours/02-intermediaire/05-slots-avances.md`
