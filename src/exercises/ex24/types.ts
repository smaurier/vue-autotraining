export type AriaLivePriority = "polite" | "assertive" | "off";

export interface WcagCheck {
  id: string;
  label: string;
  description: string;
  passed: boolean;
}
