export interface WizardData {
  identity: {
    firstName: string;
    lastName: string;
    birthDate: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  preferences: {
    newsletter: boolean;
    frequency: "daily" | "weekly" | "monthly";
    interests: string[];
  };
}

export type StepKey = "identity" | "contact" | "preferences" | "summary";
