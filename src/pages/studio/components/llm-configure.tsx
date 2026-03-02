import React, { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface Config {
  modelVendor: string;
  apiKey?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION_NAME?: string;
  temperature: number;
  top_p: number;
  model: string;
}

interface ConfigureLLMProps {
  config: Config;
  setAIConfig: (data: any) => void;
}

const generateSchema = (modelVendor: string) => {
  const baseSchema = {
    modelVendor: z.string().min(1, { message: "Vendor is required" }),
    temperature: z.number().min(0).max(1),
    top_p: z.number().min(0).max(1),
    model: z.string().min(1, { message: "Model is required" }),
  };

  if (modelVendor === "openai") {
    return z.object({
      ...baseSchema,
      apiKey: z.string().min(1, { message: "API Key is required" }),
    });
  } else if (modelVendor === "bedrock") {
    return z.object({
      ...baseSchema,
      AWS_ACCESS_KEY_ID: z
        .string()
        .min(1, { message: "AWS Access Key ID is required" }),
      AWS_SECRET_ACCESS_KEY: z
        .string()
        .min(1, { message: "AWS Secret Access Key is required" }),
      AWS_REGION_NAME: z
        .string()
        .min(1, { message: "AWS Region Name is required" }),
    });
  }

  return z.object(baseSchema);
};

const ConfigureLLM: React.FC<ConfigureLLMProps> = ({ config, setAIConfig }) => {
  const [modelVendor, setModelVendor] = useState(config.modelVendor);
  const formSchema = generateSchema(modelVendor);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: config,
    mode: "onChange",
  });

  useEffect(() => {
    const newConfig = {
      ...config,
      modelVendor,
      apiKey: modelVendor === "openai" ? config.apiKey : undefined,
      AWS_ACCESS_KEY_ID:
        modelVendor === "bedrock" ? config.AWS_ACCESS_KEY_ID : undefined,
      AWS_SECRET_ACCESS_KEY:
        modelVendor === "bedrock" ? config.AWS_SECRET_ACCESS_KEY : undefined,
      AWS_REGION_NAME:
        modelVendor === "bedrock" ? config.AWS_REGION_NAME : undefined,
    };

    if (
      modelVendor === "openai" &&
      !["gpt-4o", "gpt-4o-mini"].includes(config.model)
    ) {
      newConfig.model = "";
    } else if (
      modelVendor === "bedrock" &&
      config.model !== "bedrock/anthropic.claude-3-5-sonnet-20240620-v1:0"
    ) {
      newConfig.model = "";
    } else {
      newConfig.model = config.model;
    }

    form.reset(newConfig);
    setAIConfig(newConfig);
  }, [modelVendor]);

  function onSubmit(data: Config) {
    setAIConfig({
      ...data,
      modelVendor,
    });
  }

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          onChange={form.handleSubmit(onSubmit)}
          className="space-y-8 pb-4"
        >
          <div className="px-4 pt-2">
            <div className="card-top-rectangle"></div>

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="modelVendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Vendor</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) => {
                          setModelVendor(value);
                          field.onChange(value);
                        }}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <span>{field.value || "Select Vendor"}</span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="bedrock">AWS Bedrock</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {modelVendor === "openai" && (
                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LLM API Key</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter API Key" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {modelVendor === "bedrock" && (
                <>
                  <FormField
                    control={form.control}
                    name="AWS_ACCESS_KEY_ID"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AWS Access Key ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter AWS Access Key ID"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="AWS_SECRET_ACCESS_KEY"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AWS Secret Access Key</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter AWS Secret Access Key"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="AWS_REGION_NAME"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AWS Region Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter AWS Region Name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <span>{field.value || "Select Model"}</span>
                        </SelectTrigger>
                        <SelectContent>
                          {modelVendor === "openai" && (
                            <>
                              <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                              <SelectItem value="gpt-4o-mini">
                                gpt-4o-mini
                              </SelectItem>
                            </>
                          )}
                          {modelVendor === "bedrock" && (
                            <SelectItem value="bedrock/anthropic.claude-3-5-sonnet-20240620-v1:0">
                              Claude 3.5 Sonnet
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Temperature: {field.value?.toFixed(1)}
                    </FormLabel>
                    <FormControl>
                      <Slider
                        min={0}
                        max={1}
                        step={0.1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="top_p"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Top P: {field.value?.toFixed(1)}</FormLabel>
                    <FormControl>
                      <Slider
                        min={0}
                        max={1}
                        step={0.1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ConfigureLLM;
