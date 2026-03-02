import React, { useState, useCallback, useEffect } from "react";
import axios from "axios";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Settings, Info, Plus, RefreshCw, X } from "lucide-react";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import useStore from "@/lib/store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, extractModelIds, resolveModelDisplayName } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { styles } from "../styles";
import { BasicDetailsProps, ToolsEmptyStateProps, Tool } from "../types";
import ModelHelpDialog from "./model-help-dialog";
import AgentPromptSection from "./agent-prompt-section";
import { sampleJsonExample, nvidiaModelDisplayNames } from "@/lib/constants";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { IProvider } from "@/lib/types";
import LabelWithTooltip from "@/components/custom/label-with-tooltip";
import { getProviderModelLogo, type ProviderId } from "@/assets/images";

const StyleTag = () => <style>{styles}</style>;

const ToolsEmptyState = ({ onRefresh, isRefreshing }: ToolsEmptyStateProps) => (
  <div className="flex gap-2">
    <Link
      to={`${window.location.origin}/configure/tools`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-1"
    >
      <Button variant="outline" size="sm" type="button" className="w-full">
        <Plus className="mr-2 size-4" />
        Add Tools
      </Button>
    </Link>
    <Button
      variant="outline"
      size="sm"
      type="button"
      onClick={onRefresh}
      disabled={isRefreshing}
    >
      <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
    </Button>
  </div>
);

const REASONING_MODELS = [
  "o1",
  "o1-preview",
  "o1-mini",
  "o3-mini",
  "deepseek/deepseek-reasoner",
];

const getBedrockModels = (providers: any[]) => {
  const bedrockProvider = providers.find(
    (p) => p.provider_id?.toLowerCase() === "aws-bedrock" && p.type === "lyzr-llm"
  );
  if (bedrockProvider?.meta_data?.models) {
    return extractModelIds(bedrockProvider.meta_data.models);
  }
  return [];
};

export const BasicDetails: React.FC<BasicDetailsProps> = ({
  scrollRef,
  form,
  providers,
  models,
  setModels,
  apiTools,
  userTools,
  setApiTools,
  setUserTools,
  toolsLoading,
  isExistingAgent = false,
  isModelFieldLoading,
}) => {
  console.log("BasicDetails rendering", {
    providers,
    models: Object.keys(models),
    apiTools,
    userTools,
  });

  const apiKey = useStore((state) => state.api_key);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isToolDescriptionExpanded, setIsToolDescriptionExpanded] =
    useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [, setIsNewAgent] = useState(!isExistingAgent);
  const [bedrockCredentials, setBedrockCredentials] = useState<any[]>([]);
  const [huggingfaceCredentials, setHuggingfaceCredentials] = useState<any[]>(
    [],
  );
  const [nvidiaCredentials, setNvidiaCredentials] = useState<any[]>([]);
  const [isInitialModelLoading, setIsInitialModelLoading] = useState(false);
  const [isModelHelpOpen, setIsModelHelpOpen] = useState(false);

  const hasContent =
    form.watch("agent_role")?.length > 0 ||
    form.watch("agent_goal")?.length > 0 ||
    form.watch("agent_instructions")?.length > 0;
  const examples = form.watch("examples");
  const examples_visible = form.watch("examples_visible");
  const providerLabelMap: { [key: string]: string } = {
    nvidia: "Nvidia",
    huggingface: "Hugging Face",
    watsonx: "IBM Watson X",
    cohere: "Cohere",
  };

  useEffect(() => {
    if (hasContent) {
      setIsNewAgent(false);
    }
  }, []);

  useEffect(() => {
    if (isExistingAgent) {
      setIsNewAgent(false);
    }
    const exampleErrors =
      Object.entries(form.formState.errors).findIndex(
        ([k, v]) => k === "examples" && Boolean(v),
      ) >= 0;
    const isExamplesEnable =
      !!form.getValues("examples") && !!form.getValues("examples_visible");

    if (!exampleErrors && isExamplesEnable) {
      form.setValue("examples_visible", true, { shouldDirty: false });
      scrollRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  }, [isExistingAgent, examples, form.formState.errors]);

  useEffect(() => {
    setIsLoadingProviders(providers.length === 0);
  }, [providers]);

  useEffect(() => {
    if (
      !isExistingAgent &&
      !form.getValues("provider_id") &&
      !form.getValues("model")
    ) {
      setIsInitialModelLoading(true);
      form.setValue("provider_id", "OpenAI", { shouldDirty: false });
      form.setValue("llm_credential_id", "lyzr_openai", { shouldDirty: false });
      setTimeout(() => {
        form.setValue("model", "gpt-4o-mini", { shouldDirty: false });
        setIsInitialModelLoading(false);
      }, 1000);
    }

    const currentTools = form.getValues("tools");
    if (!currentTools || currentTools.length === 0) {
      form.setValue("tools", [{ name: "", usage_description: "" }], {
        shouldDirty: false,
      });
    }
  }, [form, isExistingAgent]);

  useEffect(() => {
    const formTools = form.getValues("tools");

    if (Array.isArray(formTools) && formTools.length > 0) {
      const toolsNeedParsing = formTools.some(
        (tool) =>
          tool.usage_description && tool.usage_description.includes(": "),
      );

      if (toolsNeedParsing) {
        // @ts-ignore
        const newTools = [];

        formTools.forEach((tool) => {
          if (
            tool.name &&
            tool.usage_description &&
            tool.usage_description.includes(": ")
          ) {
            const lines = tool.usage_description.split("\n");

            if (lines.length > 1) {
              const parsedTools = {};
              // @ts-ignore
              lines.forEach((line) => {
                const match = line.match(/^([^:]+):\s*(.*)/);
                if (match && match.length >= 3) {
                  const toolName = match[1].trim();
                  const description = match[2].trim();
                  // @ts-ignore
                  parsedTools[toolName] = description;
                }
              });

              // @ts-ignore
              if (parsedTools[tool.name]) {
                newTools.push({
                  name: tool.name,
                  // @ts-ignore
                  usage_description: parsedTools[tool.name],
                });

                Object.keys(parsedTools).forEach((toolName) => {
                  if (toolName !== tool.name) {
                    newTools.push({
                      name: toolName,
                      // @ts-ignore
                      usage_description: parsedTools[toolName],
                    });
                  }
                });
              } else {
                newTools.push(tool);
              }
            } else {
              newTools.push(tool);
            }
          } else {
            newTools.push(tool);
          }
        });

        if (newTools.length > formTools.length) {
          // @ts-ignore
          form.setValue("tools", newTools, { shouldDirty: false });
        }
      }
    }
  }, [form]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const userToolsResponse = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/v3/tools/composio/user`,
        {
          headers: {
            accept: "application/json",
            "x-api-key": apiKey,
          },
        },
      );

      if (Array.isArray(userToolsResponse.data)) {
        setApiTools([]);
        setUserTools(userToolsResponse.data);
      }
    } catch (error) {
      console.error("Error fetching tools:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const createCredentialFetcher = (
    providerKey: string,
    displayName: string,
    modelListGetter: () => string[],
    setCredentials: React.Dispatch<React.SetStateAction<any[]>>,
  ) => {
    return async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/v3/providers/credentials/user/llm/${providerKey}`,
          {
            headers: {
              accept: "application/json",
              "x-api-key": apiKey,
            },
          },
        );

        if (response.data.credentials?.length > 0) {
          // Set credentials
          setCredentials(response.data.credentials);

          // Add provider if not already present

          // Get model list
          const modelsList = modelListGetter();

          // Update models
          if (modelsList?.length > 0) {
            setModels((prevModels) => ({
              ...prevModels,
              [displayName]: modelsList,
            }));
          }

          // Update current provider's models if needed
          const currentProvider = form.getValues("provider_id");
          if (currentProvider?.toLowerCase().includes(providerKey)) {
            setModels((prevModels) => ({
              ...prevModels,
              [currentProvider]: modelsList,
            }));
          }
        }
      } catch (error) {
        console.error(`Error fetching ${displayName} credentials:`, error);
      }
    };
  };

  // Create fetcher functions using the factory
  const fetchBedrockCredentials = useCallback(
    createCredentialFetcher(
      "aws-bedrock",
      "Aws-Bedrock",
      () => getBedrockModels(providers),
      setBedrockCredentials,
    ),
    [apiKey, providers, form, setModels],
  );

  const fetchHuggingfaceCredentials = useCallback(
    createCredentialFetcher(
      "huggingface",
      "Huggingface",
      () => models["Huggingface"] || [],
      setHuggingfaceCredentials,
    ),
    [apiKey, providers, form, setModels, models],
  );

  const fetchNvidiaCredentials = useCallback(
    createCredentialFetcher(
      "nvidia",
      "NVIDIA",
      () => Object.keys(nvidiaModelDisplayNames),
      setNvidiaCredentials,
    ),
    [apiKey, providers, form, setModels],
  );

  useEffect(() => {
    console.log("Credentials effect running");

    const fetchAllCredentials = async () => {
      await Promise.all([
        fetchBedrockCredentials(),
        fetchHuggingfaceCredentials(),
        fetchNvidiaCredentials(),
      ]);
    };
    if (apiKey) fetchAllCredentials();
  }, [
    apiKey,
    setBedrockCredentials,
    setHuggingfaceCredentials,
    setNvidiaCredentials,
  ]);

  const handleProviderChange = useCallback(
    async (value: string) => {
      console.log("handleProviderChange called with:", value);
      // Parse provider ID and credential name
      const baseProviderId = value.split(" [")[0];
      const credentialName = value.match(/\[(.*?)\]/)?.[1] || "";

      // Always reset model when changing provider
      form.setValue("model", "");

      // Define a mapping of provider IDs to their credential arrays

      const credentialsMap: Record<string, any[]> = {
        "aws-bedrock": bedrockCredentials,
        huggingface: huggingfaceCredentials,
        nvidia: nvidiaCredentials,
      };

      // Define a mapping of provider IDs to their model lists
      const providerModelMap: Record<string, string[]> = {
        "aws-bedrock": getBedrockModels(providers),
        huggingface: models["Huggingface"] ?? [],
        nvidia: models["NVIDIA"] ?? [],
      };

      // Find credential and set credential ID
      const lowerProviderId = baseProviderId.toLowerCase();

      const credentialArray = credentialsMap[lowerProviderId]; // user creds
      if (credentialArray?.length) {
        const credential = credentialArray.find(
          (cred) => (cred?.name ?? "Default") === credentialName,
        ); // trying to find user cred
        if (credential) {
          form.setValue("llm_credential_id", credential.credential_id);
        } else {
          // Default credential ID pattern for lyzr providers
          form.setValue("llm_credential_id", `lyzr_${lowerProviderId}`);
        }
      } else {
        // Default credential ID pattern for lyzr providers
        form.setValue("llm_credential_id", `lyzr_${lowerProviderId}`);
      }

      // Set the provider ID
      form.setValue("provider_id", value);

      // Update models for the selected provider
      try {
        setIsLoadingModels(true);

        const modelsList =
          providerModelMap[lowerProviderId] || models[value] || [];

        if (modelsList.length > 0) {
          setModels((prevModels) => ({
            ...prevModels,
            [value]: modelsList,
            ...(credentialArray ? { [baseProviderId]: modelsList } : {}),
          }));
        }
      } catch (error) {
        console.error("Error updating models for provider:", error);
        toast({
          title: "Error loading models",
          description: "Failed to load models for the selected provider",
          variant: "destructive",
        });
      } finally {
        setIsLoadingModels(false);
      }
    },
    [
      bedrockCredentials,
      huggingfaceCredentials,
      nvidiaCredentials,
      form,
      models,
      setModels,
    ],
  );

  const currentProviderId = React.useRef(form.getValues("provider_id"));
  const currentModel = React.useRef(form.getValues("model"));

  const allProviders = [
    ...providers.slice(0, 2),
    ...bedrockCredentials,
    ...providers.slice(2, providers.length),
    ...nvidiaCredentials,
    ...huggingfaceCredentials,
  ];

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "provider_id") {
        currentProviderId.current = value.provider_id;
      }
      if (name === "model") {
        currentModel.current = value.model;
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <>
      <StyleTag />
      <div className="no-scrollbar grid h-full grid-cols-4 gap-4 overflow-x-hidden overflow-y-scroll">
        <div className="col-span-4 flex flex-col gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <LabelWithTooltip
                  align="start"
                  tooltip="Enter a unique name for your agent"
                >
                  Name
                </LabelWithTooltip>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Agent name"
                    className="border"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <LabelWithTooltip
                  align="start"
                  tooltip="Briefly describe what your agent does"
                >
                  Description
                </LabelWithTooltip>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Agent description"
                    className="border"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-4 flex items-center justify-start gap-4">
          <FormField
            control={form.control}
            name="provider_id"
            render={({ field }) => (
              <FormItem className="flex-1">
                <LabelWithTooltip
                  align="start"
                  tooltip="Select the LLM provider for your agent"
                >
                  LLM Provider
                </LabelWithTooltip>
                <FormControl>
                  {isLoadingProviders ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        handleProviderChange(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Provider">
                          {field.value && (
                            <div className="flex items-center gap-2">
                              <img
                                src={getProviderModelLogo(field.value.split(" [")[0]?.toLowerCase() as ProviderId)}
                                alt="Provider logo"
                                className="h-5 w-5 object-contain"
                              />
                              <span>
                                {allProviders.find((p: IProvider) => {
                                  const providerId = p.provider_id.replace(
                                    /(^|-)([a-z])/g,
                                    (_: any, separator: any, letter: any) =>
                                      separator + letter.toUpperCase(),
                                  );
                                  const isLlm = p?.type === "llm";
                                  const selectValue = isLlm
                                    ? `${providerId} [${p?.credentials?.name || "Default"}]`
                                    : providerId;
                                  return selectValue === field.value;
                                })?.display_name || field.value}
                              </span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {allProviders.map((provider: IProvider) => {
                          // Determine the display value and value prop once
                          const providerId = provider.provider_id.replace(
                            /(^|-)([a-z])/g,
                            (_: any, separator: any, letter: any) =>
                              separator + letter.toUpperCase(),
                          );
                          const isLyzrLlm = provider?.type === "lyzr-llm";
                          const isLlm = provider?.type === "llm";
                          const displayText = isLyzrLlm
                            ? provider.display_name
                            : `${
                                providers.find(
                                  (p) =>
                                    p.provider_id.toLowerCase() ===
                                    provider.provider_id,
                                )?.display_name ??
                                providerLabelMap?.[provider.provider_id]
                              } [${provider?.credentials?.name || "Default"}]`;

                          // Determine the value prop based on provider type
                          const selectValue = isLlm
                            ? `${providerId} [${provider?.credentials?.name || "Default"}]`
                            : providerId;
                          // Get the base provider ID for logo lookup
                          const baseProviderId = provider.provider_id.toLowerCase();
                          // Default case for providers without special credentials
                          return (
                            <SelectItem
                              key={selectValue}
                              value={selectValue}
                              className="w-full"
                            >
                              <div className="flex items-center gap-2">
                                <img
                                  src={getProviderModelLogo(baseProviderId as ProviderId)}
                                  alt={displayText}
                                  className="h-5 w-5 object-contain"
                                />
                                <span>{displayText}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem className="flex-1">
                <div className="flex items-center justify-between">
                  <LabelWithTooltip
                    align="start"
                    tooltip={`Choose the LLM model for your agent
                ${
                  REASONING_MODELS.includes(field.value) &&
                  ". Note: This is a reasoning model which has higher latency"
                }`}
                  >
                    LLM Model
                  </LabelWithTooltip>
                  <button
                    type="button"
                    onClick={() => setIsModelHelpOpen(true)}
                    className="text-xs text-blue-700 text-primary hover:underline"
                  >
                    Need help choosing?
                  </button>
                </div>
                <FormControl>
                  {isLoadingModels ||
                  isModelFieldLoading ||
                  isInitialModelLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : form
                      .getValues("provider_id")
                      ?.toLowerCase()
                      .includes("huggingface") ? (
                    <Input
                      {...field}
                      value={field.value?.replace("huggingface/", "") || ""}
                      placeholder="Enter model name"
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value ? `huggingface/${value}` : "");
                        form.clearErrors("model");
                      }}
                    />
                  ) : (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        console.log("Model changed to:", value);
                        if (value) {
                          field.onChange(value);
                          form.clearErrors("model");
                        }
                      }}
                      disabled={!form.getValues("provider_id")}
                    >
                      <SelectTrigger
                        className={cn(
                          !form.getValues("provider_id")
                            ? "cursor-not-allowed opacity-50"
                            : "",
                        )}
                      >
                        <SelectValue
                          placeholder={
                            !form.getValues("provider_id")
                              ? "Select a Provider First"
                              : "Select Model"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {(models[form.getValues("provider_id")] || []).map(
                          (value) => {
                            const currentProv = form.getValues("provider_id");
                            const baseProviderId = currentProv?.split(" [")[0];
                            const selectedProvider = providers.find((p) =>
                              p.provider_id?.toLowerCase() === baseProviderId?.toLowerCase() && p.type === "lyzr-llm"
                            );
                            const displayName = resolveModelDisplayName(
                              value,
                              selectedProvider?.meta_data?.display_names,
                            );
                            return (
                              <SelectItem key={value} value={value}>
                                {displayName}
                              </SelectItem>
                            );
                          },
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-8">
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Popover>
                    <PopoverTrigger>
                      <Settings className="mt-1 size-5 transition-transform duration-200 hover:scale-110" />
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="temperature"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <p>Temperature</p>
                                  <TooltipProvider>
                                    <Tooltip delayDuration={300}>
                                      <TooltipTrigger asChild>
                                        <div className="inline-flex cursor-help items-center gap-2">
                                          <Info className="size-4 text-gray-400" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="top"
                                        align="start"
                                        className="max-w-[280px]"
                                      >
                                        <p>
                                          Controls randomness in the agent's
                                          responses. Higher values make the
                                          output more creative but less focused.
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <p>{field.value}</p>
                              </FormLabel>
                              <FormControl>
                                <Slider
                                  value={[field.value]}
                                  onValueChange={([value]) =>
                                    field.onChange(value)
                                  }
                                  min={0}
                                  max={1}
                                  step={0.1}
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
                              <FormLabel className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <p>Top P</p>
                                  <TooltipProvider>
                                    <Tooltip delayDuration={300}>
                                      <TooltipTrigger asChild>
                                        <div className="inline-flex cursor-help items-center gap-2">
                                          <Info className="size-4 text-gray-400" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="top"
                                        align="start"
                                        className="max-w-[280px]"
                                      >
                                        <p>
                                          Controls diversity of responses. Lower
                                          values make the output more focused
                                          and deterministic.
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <p>{field.value}</p>
                              </FormLabel>
                              <FormControl>
                                <Slider
                                  value={[field.value]}
                                  onValueChange={([value]) =>
                                    field.onChange(value)
                                  }
                                  min={0}
                                  max={1}
                                  step={0.1}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Advanced settings</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="col-span-4">
          <AgentPromptSection form={form} apiKey={apiKey} />
        </div>

        <FormField
          control={form.control}
          name="tools"
          render={({ field }) => (
            <FormItem className="col-span-4">
              <div className="mb-2 flex items-center justify-between">
                <FormLabel className="mb-0">
                  <TooltipProvider>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <div className="inline-flex cursor-help items-center gap-2">
                          Tool Configuration
                          <Info className="size-4 text-gray-400" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        align="start"
                        className="max-w-[280px]"
                      >
                        <p>Select and configure tools for your agent</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
              </div>
              {toolsLoading ? (
                <div className="flex gap-4">
                  <Skeleton className="h-10 w-[200px]" />
                  <Skeleton className="h-10 flex-1" />
                </div>
              ) : apiTools.length === 0 && userTools.length === 0 ? (
                <ToolsEmptyState
                  onRefresh={handleRefresh}
                  isRefreshing={isRefreshing}
                />
              ) : (
                <div className="space-y-4">
                  {Array.isArray(field.value) &&
                    field.value.map((tool: Tool, index: number) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="h-9"
                          >
                            <RefreshCw
                              className={cn(
                                "h-4 w-4",
                                isRefreshing && "animate-spin",
                              )}
                            />
                          </Button>
                          <Select
                            value={tool?.name || ""}
                            onValueChange={(value) => {
                              const newTools = [...field.value];
                              newTools[index] = {
                                ...(tool || {}),
                                name: value,
                              };
                              field.onChange(newTools);
                            }}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select a tool" />
                            </SelectTrigger>
                            <SelectContent>
                              {[...apiTools, ...userTools].map((tool) => (
                                <SelectItem
                                  key={
                                    typeof tool === "string"
                                      ? tool
                                      : tool.provider_id
                                  }
                                  value={
                                    typeof tool === "string"
                                      ? tool
                                      : tool.provider_id
                                  }
                                >
                                  {typeof tool === "string"
                                    ? tool.charAt(0).toUpperCase() +
                                      tool.slice(1)
                                    : tool.meta_data.schema.info.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-1 gap-2">
                          <div className="relative flex-1">
                            <Input
                              className="w-full pr-8"
                              placeholder="How would you use this tool?"
                              value={tool?.usage_description || ""}
                              onChange={(e) => {
                                const newTools = [...field.value];
                                newTools[index] = {
                                  ...(tool || {}),
                                  usage_description: e.target.value,
                                };
                                field.onChange(newTools);
                              }}
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            type="button"
                            onClick={() => {
                              const newTools = field.value.filter(
                                // @ts-ignore
                                (_, i) => i !== index,
                              );

                              field.onChange(newTools);
                            }}
                          >
                            <X className="h-4 w-4 hover:text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    // onClick={() => {
                    //   const newTool: Tool = { name: "", usage_description: "" };
                    //   field.onChange([
                    //     ...(Array.isArray(field.value)
                    //       ? field.value.filter((t) => t && t.name)
                    //       : []),
                    //     newTool,
                    //   ]);
                    // }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Tool
                  </Button>
                  {(apiTools.length > 0 || userTools.length > 0) && (
                    <Link
                      to={`${window.location.origin}/configure/tools`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({
                          variant: "link",
                          size: "sm",
                        }),
                        "mt-2 p-0 text-indigo-600 hover:text-indigo-500",
                      )}
                    >
                      Configure more tools
                      <ArrowTopRightIcon className="ml-1 size-3" />
                    </Link>
                  )}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* <div ref={scrollRef} /> */}

        <FormField
          control={form.control}
          name="examples"
          render={({ field }) => (
            <FormItem className="col-span-4" ref={scrollRef}>
              <FormLabel>
                <div className="flex items-center justify-between">
                  <LabelWithTooltip
                    align="start"
                    tooltip="Add example outputs to guide your agent"
                  >
                    Examples{" "}
                    {form.watch("response_format") !== "json_object"
                      ? "(Optional)"
                      : ""}
                  </LabelWithTooltip>
                  <FormField
                    control={form.control}
                    name="examples_visible"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (checked) {
                                setTimeout(
                                  () =>
                                    scrollRef.current?.scrollIntoView({
                                      behavior: "smooth",
                                      block: "end",
                                      inline: "nearest",
                                    }),
                                  400,
                                );
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                {examples_visible && (
                  <FormField
                    control={form.control}
                    name="response_format"
                    render={({ field }) => (
                      <FormItem className="mt-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue="text"
                            className="flex gap-2"
                          >
                            <FormItem className="flex items-center space-x-1 space-y-0">
                              <FormControl>
                                <RadioGroupItem
                                  value="text"
                                  iconClassname="size-2.5"
                                  className="size-3"
                                />
                              </FormControl>
                              <FormLabel className="text-xs font-normal">
                                Text
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-1 space-y-0">
                              <FormControl>
                                <RadioGroupItem
                                  value="json_object"
                                  iconClassname="size-2.5"
                                  className="size-3"
                                />
                              </FormControl>
                              <FormLabel className="text-xs font-normal">
                                JSON (For Structured Outputs)
                              </FormLabel>
                            </FormItem>
                            {form.watch("response_format") ===
                              "json_object" && (
                              <span
                                className={cn(
                                  buttonVariants({
                                    variant: "link",
                                    size: "sm",
                                  }),
                                  "m-0 h-4 cursor-pointer p-0 text-indigo-600 dark:text-indigo-400",
                                )}
                                onClick={() =>
                                  form.setValue("examples", sampleJsonExample)
                                }
                              >
                                Sample JSON
                              </span>
                            )}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </FormLabel>
              <FormControl>
                {examples_visible && (
                  <Textarea
                    {...field}
                    placeholder={
                      form.watch("response_format") === "json_object"
                        ? "Provide an example of structured output. The agent will respond in the given structured format."
                        : "Add example outputs to guide your agent"
                    }
                    rows={5}
                  />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <ModelHelpDialog
        open={isModelHelpOpen}
        onOpenChange={setIsModelHelpOpen}
        providers={providers}
      />
      <Dialog
        open={isToolDescriptionExpanded}
        onOpenChange={setIsToolDescriptionExpanded}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tool Usage Description</DialogTitle>
          </DialogHeader>
          <FormField
            control={form.control}
            name="tool_usage_description"
            render={({ field }) => (
              <Textarea
                {...field}
                rows={15}
                className="min-h-[300px] w-full"
                placeholder="Describe in detail how you would use this tool..."
              />
            )}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BasicDetails;
