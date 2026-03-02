import { Control, FieldPath, FieldValues } from "react-hook-form";
import { z } from "zod";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/custom/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DynamicFormFieldConfig {
  name: string;
  label: string;
  type: "text" | "select" | "number" | "password";
  required?: boolean;
  placeholder?: string;
  description?: string;
  default?: string;
  options?: { value: string; label: string }[];
}

interface DynamicFormFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  field: DynamicFormFieldConfig;
  className?: string;
}

export function DynamicFormField<TFieldValues extends FieldValues>({
  control,
  field,
  className,
}: DynamicFormFieldProps<TFieldValues>) {
  const isPasswordField =
    field.type === "password" ||
    field.name.toLowerCase().includes("password") ||
    field.name.toLowerCase().includes("api_key") ||
    field.name.toLowerCase().includes("secret");

  return (
    <FormField
      control={control}
      name={field.name as FieldPath<TFieldValues>}
      render={({ field: formField }) => (
        <FormItem className={className}>
          <FormLabel required={field.required}>{field.label}</FormLabel>
          <FormControl>
            {field.type === "select" ? (
              <Select
                value={formField.value}
                onValueChange={formField.onChange}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={field.placeholder || `Select ${field.label}`}
                  />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : isPasswordField ? (
              <PasswordInput {...formField} placeholder={field.placeholder} />
            ) : field.type === "number" ? (
              <Input
                type="number"
                {...formField}
                placeholder={field.placeholder}
              />
            ) : (
              <Input {...formField} placeholder={field.placeholder} />
            )}
          </FormControl>
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface DynamicFormFieldsProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  fields: DynamicFormFieldConfig[];
  className?: string;
}

export function DynamicFormFields<TFieldValues extends FieldValues>({
  control,
  fields,
  className,
}: DynamicFormFieldsProps<TFieldValues>) {
  return (
    <>
      {fields.map((field) => (
        <DynamicFormField
          key={field.name}
          control={control}
          field={field}
          className={className}
        />
      ))}
    </>
  );
}

export function createDynamicFormSchema(
  fields: DynamicFormFieldConfig[],
  additionalFields?: Record<string, z.ZodTypeAny>,
) {
  const schemaFields: Record<string, z.ZodTypeAny> = {
    ...additionalFields,
  };

  fields.forEach((field) => {
    if (field.type === "select") {
      schemaFields[field.name] = field.required
        ? z.string().min(1, `${field.label} is required`)
        : z.string().optional();
    } else if (field.type === "number") {
      schemaFields[field.name] = field.required
        ? z.coerce.number().min(0, `${field.label} is required`)
        : z.coerce.number().optional();
    } else {
      schemaFields[field.name] = field.required
        ? z.string().min(1, `${field.label} is required`)
        : z.string().optional();
    }
  });

  return z.object(schemaFields);
}

export function createDefaultValues(
  fields: DynamicFormFieldConfig[],
  additionalDefaults?: Record<string, string>,
): Record<string, string> {
  const defaults: Record<string, string> = {
    ...additionalDefaults,
  };

  fields.forEach((field) => {
    defaults[field.name] = field.default || "";
  });

  return defaults;
}
