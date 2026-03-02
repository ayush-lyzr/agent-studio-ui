import type { IProvider } from "@/lib/types";

export interface FormProperty {
  type: "string" | "number" | "boolean" | "dropdown";
  title: string;
  options?: { value: string; name: string }[];
  default?: string;
  pattern?: string;
}

export interface ProviderForm {
  title?: string;
  description?: string;
  help_link?: string;
  properties: Record<string, FormProperty>;
  required?: string[];
}

export type IModelCard = Partial<IProvider> & {
  className?: string;
  allowSetup?: boolean;
  form?: ProviderForm;
  disabled?: boolean;
  onUpgrade: (item: ProviderForm) => () => void;
  upgradeDisable?: boolean;
};
