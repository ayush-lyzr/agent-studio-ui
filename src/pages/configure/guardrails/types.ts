export interface GuardrailFormField {
  name: string;
  label: string;
  type: "text" | "select" | "number" | "password";
  required: boolean;
  placeholder?: string;
  description?: string;
  default?: string;
  options?: { value: string; label: string }[];
}

export interface GuardrailProviderForm {
  title: string;
  description: string;
  fields: GuardrailFormField[];
}

export interface GuardrailProviderMetaData {
  icon: string;
  category: string;
  supports_role_based_auth: boolean;
  lambda_registration_required: boolean;
  documentation_url: string;
  features?: string[];
}

export interface IGuardrailProvider {
  _id: string;
  provider_id: string;
  type: "guardrail";
  form: GuardrailProviderForm;
  meta_data: GuardrailProviderMetaData;
  createdAt?: string;
  updatedAt?: string;
}

export interface IGuardrailCredential {
  _id: string;
  credential_id: string;
  name: string;
  provider_id: string;
  type: "guardrail";
  credentials: Record<string, any>;
  meta_data: Record<string, any>;
  user_id: string;
  createdAt: string;
  updatedAt: string;
}

export interface IGuardrailCardProps {
  provider: IGuardrailProvider;
  className?: string;
}
