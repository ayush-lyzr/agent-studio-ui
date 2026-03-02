import { useState, useMemo, useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import dayjs from "dayjs";
import { CalendarIcon } from "@radix-ui/react-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Wrench } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Model } from "@/lib/types";
import { cn } from "@/lib/utils";

type ConfigureModelProps = {
  modelConfig: Model | null;
  parentForm: UseFormReturn<any>;
};

// Generate Zod schema from model config
const generateZodSchema = (config: Model): z.ZodObject<any> => {
  const shape: Record<string, z.ZodTypeAny> = {};

  Object.entries(config).forEach(([key, value]) => {
    if (typeof value === "object" && value !== null && "type" in value) {
      if (value.type === "array" && value.items === "string") {
        shape[key] = z.array(z.string()).optional();
      } else if (value.type === "array" && value.items === "object") {
        if (value.options) {
          shape[key] = z.array(z.any()).optional();
        } else {
          shape[key] = z.array(z.object({})).optional();
        }
      } else if (value.type === "string") {
        if (value.options && Array.isArray(value.options)) {
          // Enum validation for select fields
          shape[key] = z
            .enum([...value.options, "___null___"] as unknown as [
              string,
              ...string[],
            ])
            .optional();
        } else if (value.format === "date") {
          shape[key] = z.string().optional();
        } else {
          shape[key] = z.string().optional();
        }
      } else if (value.type === "object" && value.properties) {
        const nestedShape: Record<string, z.ZodTypeAny> = {};
        Object.entries(value.properties).forEach(
          ([nestedKey, nestedValue]: [string, any]) => {
            if (nestedValue.type === "string") {
              if (nestedValue.options && Array.isArray(nestedValue.options)) {
                nestedShape[nestedKey] = z
                  .enum([...nestedValue.options, "___null___"] as unknown as [
                    string,
                    ...string[],
                  ])
                  .optional();
              } else {
                nestedShape[nestedKey] = z.string().optional();
              }
            }
          },
        );
        shape[key] = z.object(nestedShape).optional();
      }
    }
  });

  return z.object(shape);
};

// Extract default values from model config
const getDefaultValues = (config: Model): Record<string, any> => {
  const defaults: Record<string, any> = {};

  Object.entries(config).forEach(([key, value]) => {
    if (typeof value === "object" && value !== null && "type" in value) {
      if (value.default !== undefined) {
        defaults[key] = value.default;
      } else if (value.type === "array") {
        defaults[key] = [];
      } else if (value.type === "object" && value.properties) {
        const nestedDefaults: Record<string, any> = {};
        Object.entries(value.properties).forEach(
          ([nestedKey, nestedValue]: [string, any]) => {
            if (nestedValue.default !== undefined) {
              nestedDefaults[nestedKey] = nestedValue.default;
            } else {
              nestedDefaults[nestedKey] = "";
            }
          },
        );
        defaults[key] = nestedDefaults;
      } else {
        defaults[key] = "";
      }
    }
  });

  return defaults;
};

// Dynamic field renderer
type DynamicFieldProps = {
  name: string;
  config: any;
  form: any;
  disabled?: boolean;
};

const DynamicField: React.FC<DynamicFieldProps> = ({
  name,
  config,
  form,
  disabled,
}) => {
  const label = name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  // Object type (nested properties)
  if (config.type === "object" && config.properties) {
    return (
      <div className="space-y-4 rounded-md border p-4">
        <FormLabel className="text-base font-semibold">{label}</FormLabel>
        {Object.entries(config.properties).map(
          ([nestedKey, nestedConfig]: [string, any]) => (
            <DynamicField
              key={nestedKey}
              name={`${name}.${nestedKey}`}
              config={nestedConfig}
              form={form}
              disabled={disabled}
            />
          ),
        )}
      </div>
    );
  }

  // Array type (multi-input)
  if (
    config.type === "array" &&
    config.items === "object" &&
    Array.isArray(config?.options)
  ) {
    return (
      <FormField
        control={form.control}
        name={name}
        render={() => (
          <FormItem>
            <div className="mb-4">
              <FormLabel className="text-base">{label}</FormLabel>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {config.options?.map((option: any) => {
                const optionValue =
                  typeof option === "string" ? option : Object.keys(option)[0];
                return (
                  <FormField
                    key={optionValue}
                    control={form.control}
                    name={name}
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={optionValue}
                          className="flex flex-row items-start space-x-1 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.some(
                                (val: any) =>
                                  Object.keys(val)[0] === optionValue,
                              )}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([
                                      ...(field.value || []),
                                      option,
                                    ])
                                  : field.onChange(
                                      field.value?.filter(
                                        (val: any) =>
                                          Object.keys(val)[0] !== optionValue,
                                      ),
                                    );
                              }}
                              disabled={disabled}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {optionValue}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // Array type (multi-input)
  if (config.type === "array") {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Input
                placeholder={
                  config.example?.join(", ") ||
                  "Enter values separated by commas"
                }
                value={field.value?.join(", ") || ""}
                className="placeholder:text-muted-foreground"
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    field.onChange(undefined);
                    return;
                  }
                  const values = val
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean);
                  field.onChange(values);
                }}
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // Select type (with options)
  if (
    config.type === "string" &&
    config?.options &&
    Array.isArray(config?.options)
  ) {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger disabled={disabled}>
                  <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem
                  value="___null___"
                  className="text-muted-foreground"
                >
                  Default (None)
                </SelectItem>
                {config?.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // Date type
  if (config.format === "date") {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>{label}</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground",
                    )}
                    disabled={disabled}
                  >
                    {field.value ? (
                      dayjs(field.value).format("MMM D, YYYY")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value ? new Date(field.value) : undefined}
                  onSelect={(date) => {
                    field.onChange(
                      date ? dayjs(date).format("YYYY-MM-DD") : "",
                    );
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // Default: string input
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              placeholder={config.example || ""}
              {...field}
              onChange={(e) => {
                const val = e.target.value;
                field.onChange(val === "" ? undefined : val);
              }}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export const ConfigureModel: React.FC<ConfigureModelProps> = ({
  modelConfig,
  parentForm,
}) => {
  const additional_model_params = parentForm.watch("additional_model_params");

  const [open, setOpen] = useState(false);

  // Generate schema and defaults
  const schema = useMemo(
    () => (modelConfig ? generateZodSchema(modelConfig) : z.object({})),
    [modelConfig],
  );

  const defaultValues = useMemo(
    () => (modelConfig ? getDefaultValues(modelConfig) : {}),
    [modelConfig],
  );

  // Initialize form
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const [localEnabled, setLocalEnabled] = useState(false);

  // Sync localEnabled with additional_model_params when dialog opens or params change
  useEffect(() => {
    setLocalEnabled(!!additional_model_params);
  }, [additional_model_params, open]);

  const handleSwitchChange = (checked: boolean) => {
    setLocalEnabled(checked);
    // We don't update parentForm immediately anymore, we wait for Save
  };

  // Helper to clean object (remove undefined/null/empty strings recursively)
  const cleanData = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(cleanData).filter((v) => v !== undefined && v !== null);
    }
    if (typeof obj === "object" && obj !== null) {
      const newObj: any = {};
      Object.entries(obj).forEach(([key, value]) => {
        if (value === "___null___") return; // Skip explicit nulls from Select
        const cleaned = cleanData(value);
        if (cleaned !== undefined && cleaned !== null && cleaned !== "") {
          newObj[key] = cleaned;
        }
      });
      return Object.keys(newObj).length > 0 ? newObj : undefined;
    }
    return obj;
  };

  const onSubmit = (data: z.infer<typeof schema>) => {
    if (!localEnabled) {
      console.log("additional_model_params set : null");
      parentForm.setValue("additional_model_params", null, {
        shouldDirty: true,
      });
    } else {
      const cleanedData = cleanData(data);
      console.log("additional_model_params set : ", cleanedData);
      parentForm.setValue("additional_model_params", cleanedData, {
        shouldDirty: true,
      });
    }
    setOpen(false);
  };

  useEffect(() => {
    if (
      additional_model_params &&
      Object.keys(additional_model_params).length > 0
    ) {
      // Deep merge defaults with actual values to ensure nested fields are preserved
      const mergedValues = { ...defaultValues };

      Object.keys(additional_model_params).forEach((key) => {
        if (
          typeof additional_model_params[key] === "object" &&
          additional_model_params[key] !== null &&
          !Array.isArray(additional_model_params[key]) &&
          mergedValues[key] &&
          typeof mergedValues[key] === "object"
        ) {
          mergedValues[key] = {
            ...mergedValues[key],
            ...additional_model_params[key],
          };
        } else {
          mergedValues[key] = additional_model_params[key];
        }
      });

      form.reset(mergedValues);
    } else {
      form.reset(defaultValues);
    }
  }, [additional_model_params, defaultValues]);

  if (!modelConfig) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" type="button">
          <Wrench className="mr-2 h-4 w-4 text-primary" />
          Configure Model
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Additional Model Parameters</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-between py-4">
          <Label htmlFor="model-params-mode" className="text-base">
            Enable Additional Parameters
          </Label>
          <Switch
            id="model-params-mode"
            checked={localEnabled}
            onCheckedChange={handleSwitchChange}
          />
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {Object.entries(modelConfig).map(([key, config]) => {
              if (
                typeof config === "object" &&
                config !== null &&
                "type" in config
              ) {
                return (
                  <DynamicField
                    key={key}
                    name={key}
                    config={config}
                    form={form}
                    disabled={!localEnabled}
                  />
                );
              }
              return null;
            })}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit(onSubmit)(e);
                }}
              >
                Save Configuration
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
