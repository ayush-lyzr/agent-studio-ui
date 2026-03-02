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
import { Settings, Info } from "lucide-react";
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
import useStore from "@/lib/store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, resolveModelDisplayName } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { WandSparkles, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { styles } from "@/pages/create-agent/styles";
import {
  BASE_URL,
  nvidiaModelDisplayNames,
  isDevEnv,
} from "@/lib/constants";
import { IProvider } from "@/lib/types";
import LabelWithTooltip from "@/components/custom/label-with-tooltip";
import { useModel } from "@/pages/configure/models/model-service";

const StyleTag = () => <style>{styles}</style>;

type Model = string[] | Record<string, string[]>;

interface SimplifiedBasicDetailsProps {
  scrollRef: React.RefObject<HTMLDivElement>;
  form: any;
  agent?: any;
}

export const SimplifiedBasicDetails: React.FC<SimplifiedBasicDetailsProps> = ({
  scrollRef,
  form,
  // agent,
}) => {
  const apiKey = useStore((state) => state.api_key);
  const provider_id = form.getValues("provider_id");
  const [providers, setProviders] = useState<IProvider[]>([]);
  const [models, setModels] = useState<{
    [key: string]: Model;
  }>({});
  const [bedrockCredentials, setBedrockCredentials] = useState<any[]>([]);
  const [huggingfaceCredentials, setHuggingfaceCredentials] = useState<any[]>(
    [],
  );
  const [nvidiaCredentials, setNvidiaCredentials] = useState<any[]>([]);
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false);
  const [isPromptImproved, setIsPromptImproved] = useState(false);
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState(false);

  const providerLabelMap: { [key: string]: string } = {
    nvidia: "Nvidia",
    huggingface: "Hugging Face",
    watsonx: "IBM Watson X",
    cohere: "Cohere",
  };

  const { getLyzrProviders, isFetchingLyzrProviders } = useModel({ apiKey });

  const improvePrompt = async () => {
    setIsImprovingPrompt(true);
    setIsPromptImproved(false);
    try {
      const roleAndInstructions = `
        Agent Role : ${form.getValues("agent_role")}
        Agent Goal : ${form.getValues("agent_goal")}
        Agent Instructions : ${form.getValues("agent_instructions")}
      `;

      const response = await axios.post(
        `/v3/inference/chat/`,
        {
          user_id: "studio",
          agent_id: isDevEnv
            ? "6822ea3b8ee3fcec7d31c9c1"
            : "682d6c9dced2bfaff52a78e3",
          message: roleAndInstructions,
          session_id: isDevEnv
            ? "6822ea3b8ee3fcec7d31c9c1-ycsl1paihbe"
            : "682d6c9dced2bfaff52a78e3-9orjfopy1gg",
        },
        {
          baseURL: BASE_URL,
          headers: {
            accept: "application/json",
            "x-api-key": apiKey,
            "Content-Type": "application/json",
          },
        },
      );

      const responseText = response.data.response;
      const roleMatch = responseText.match(/ROLE:(.*?)(?=INSTRUCTIONS:|$)/s);
      const instructionsMatch = responseText.match(/INSTRUCTIONS:(.*?)$/s);

      if (roleMatch && instructionsMatch) {
        form.setValue("agent_role", roleMatch[1].trim());
        form.setValue("agent_instructions", instructionsMatch[1].trim());
        setIsPromptImproved(true);
        toast({
          title: "Prompt improved successfully!",
          description: "Your agent role and instructions have been enhanced.",
        });
      } else {
        toast({
          title: "Invalid response format from the improvement service.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "There was an issue improving the prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImprovingPrompt(false);
    }
  };

  const handleProviderChange = useCallback(
    async (value: string) => {
      console.log("handleProviderChange called with:", value);

      if (value) {
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

        // Find credential and set credential ID
        const lowerProviderId = baseProviderId.toLowerCase();

        const credentialArray = credentialsMap[lowerProviderId]; // user creds
        const credential = credentialArray?.find(
          (cred) => (cred?.name ?? "Default") === credentialName,
        ); // trying to find user cred
        const region_name = credential?.credentials?.aws_region_name
          ? credential?.credentials?.aws_region_name?.startsWith("us")
            ? "us"
            : "eu"
          : "us";

        if (credentialArray?.length) {
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
          const modelsList = Array.isArray(models[lowerProviderId])
            ? models[lowerProviderId]
            : models[lowerProviderId][region_name];

          if (modelsList?.length > 0) {
            setModels((prevModels) => ({
              ...prevModels,
              [baseProviderId]: modelsList,
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
        }
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

  const allProviders = [
    ...providers.slice(0, 2),
    ...bedrockCredentials,
    ...providers.slice(2, providers.length),
    ...nvidiaCredentials,
    ...huggingfaceCredentials,
  ];

  useEffect(() => {
    console.log("Credentials effect running");

    const fetchProvidersAndModels = async () => {
      try {
        const lyzrProvidersResponse = await getLyzrProviders();
        const providersResponse: { data: IProvider[] } = { data: [] };

        const lyzrProviders = lyzrProvidersResponse.data ?? [];
        const additionalProviders = (providersResponse.data ?? []).filter(
          (p: IProvider) => p.provider_id !== "openai",
        );

        const combinedProviders = [
          ...lyzrProviders,
          ...additionalProviders.filter(
            (p: IProvider) =>
              !lyzrProviders.some(
                (lp: IProvider) => lp.provider_id === p.provider_id,
              ),
          ),
        ];

        setProviders(
          combinedProviders.sort(
            (firstEl, secondEl) => firstEl.priority - secondEl.priority,
          ),
        );
        const modelsMap = combinedProviders.reduce(
          (acc: Record<string, Model>, provider: IProvider) => {
            const models = provider.meta_data.models;

            if (Array.isArray(models)) {
              const modelNames = models.map((model: any) => {
                if (Array.isArray(model)) {
                  return typeof model[0] === "string" ? model[0] : model[0][0];
                }
                return model;
              });
              acc[provider.provider_id?.toLowerCase()] = modelNames;
            }
            if (!Array.isArray(models)) {
              const modelNames = Object.entries(models).reduce(
                (acc: any, curr: any) => {
                  acc[curr[0]] = curr[1]?.map((model: string[]) =>
                    typeof model[0] === "string" ? model[0] : model[0][0],
                  );
                  return acc;
                },
                {},
              );
              acc[provider?.provider_id?.toLowerCase()] = modelNames;
            }

            return acc;
          },
          {},
        );
        setModels(() => ({ ...modelsMap }));
      } catch (error) {
        console.error("Error fetching providers:", error);
        toast({
          title: "Error fetching providers",
          description: "Unable to load providers. Please try again.",
          variant: "destructive",
        });
      }
    };

    const createCredentialFetcher = (
      providerKey: string,
      displayName: string,
      modelListGetter: () => Model,
      setCredentials: React.Dispatch<React.SetStateAction<any[]>>,
    ) => {
      return async () => {
        try {
          const response = await axios.get(
            `/v3/providers/credentials/user/llm/${providerKey}`,
            {
              baseURL: BASE_URL,
              headers: {
                accept: "application/json",
                "x-api-key": apiKey,
              },
            },
          );

          if (response.data.credentials?.length > 0) {
            // Set credentials
            setCredentials(response.data.credentials);

            // Get model list
            const modelsList = modelListGetter();
            // Update models
            if (
              Array.isArray(modelsList)
                ? modelsList?.length > 0
                : Object.keys(modelsList)?.length > 0
            ) {
              setModels((prevModels) => ({
                ...prevModels,
                [providerKey]: modelsList,
              }));
            }

            // Update current provider's models if needed
            const currentProvider = form.getValues("provider_id");
            if (currentProvider?.toLowerCase().includes(providerKey)) {
              setModels((prevModels) => ({
                ...prevModels,
                [providerKey]: modelsList,
              }));
            }
          }
        } catch (error) {
          console.error(`Error fetching ${displayName} credentials:`, error);
        }
      };
    };

    // Create fetcher functions using the factory
    const fetchBedrockCredentials = createCredentialFetcher(
      "aws-bedrock",
      "Aws-Bedrock",
      () => models["aws-bedrock"],
      setBedrockCredentials,
    );

    const fetchHuggingfaceCredentials = createCredentialFetcher(
      "huggingface",
      "Huggingface",
      () => (Array.isArray(models["huggingface"]) ? models["Huggingface"] : []),
      setHuggingfaceCredentials,
    );

    const fetchNvidiaCredentials = createCredentialFetcher(
      "nvidia",
      "NVIDIA",
      () => Object.keys(nvidiaModelDisplayNames),
      setNvidiaCredentials,
    );

    const fetchAllCredentials = async () => {
      await fetchProvidersAndModels();

      await Promise.all([
        fetchBedrockCredentials(),
        fetchHuggingfaceCredentials(),
        fetchNvidiaCredentials(),
      ]);
    };
    if (apiKey) fetchAllCredentials();
  }, [apiKey]);

  const getModelsList = (): string[] => {
    const baseProviderId = provider_id.split(" [")[0]?.toLowerCase();
    const modelsList = models[baseProviderId];

    if (Array.isArray(modelsList)) {
      return modelsList;
    } else if (baseProviderId === "aws-bedrock" && typeof models === "object") {
      const llm_credential_id = form.getValues("llm_credential_id");
      const currentCredential = bedrockCredentials.find(
        (cred) => cred?.credential_id === llm_credential_id,
      );

      const aws_region_name = currentCredential?.credentials?.aws_region_name
        ? currentCredential?.credentials?.aws_region_name?.startsWith("us")
          ? "us"
          : "eu"
        : "us";
      return modelsList?.[aws_region_name] ?? [];
    }

    return [];
  };

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

          {/* System Prompt Section */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">System Prompt</h3>
              <Button
                type="button"
                onClick={improvePrompt}
                disabled={isImprovingPrompt}
                variant="outline"
                size="sm"
                className={cn("transition-all duration-300")}
              >
                <WandSparkles className={cn("mr-2 h-4 w-4")} />
                {isImprovingPrompt ? "Improving..." : "Improve"}
              </Button>
            </div>

            <FormField
              control={form.control}
              name="agent_role"
              render={({ field }) => (
                <FormItem>
                  <LabelWithTooltip
                    align="start"
                    tooltip="Define the primary role of your agent"
                    tooltipExample="Example: You are an expert customer support agent. Your role is to understand customer queries and provide the right answers. Focus on solving problems."
                  >
                    Agent Role
                  </LabelWithTooltip>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder="You are an expert customer support agent."
                        className={`border
                          ${isImprovingPrompt ? "opacity-50" : ""}
                          ${isPromptImproved ? "border-green-500 bg-green-50" : ""}
                          transition-all duration-300`}
                        disabled={isImprovingPrompt}
                      />
                      {isImprovingPrompt && (
                        <div
                          className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                          style={{
                            backgroundSize: "200% 100%",
                            animation: "shimmer 2s infinite",
                          }}
                        />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agent_goal"
              render={({ field }) => (
                <FormItem>
                  <LabelWithTooltip
                    align="start"
                    tooltip="Defines what the agent is expected to achieve"
                    tooltipExample="Example: Your goal is to address and resolve the customer inquiry."
                  >
                    Agent Goal
                  </LabelWithTooltip>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Your goal is to address and resolve customer inquiries."
                      className="border"
                      disabled={isImprovingPrompt}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agent_instructions"
              render={({ field }) => (
                <FormItem>
                  <LabelWithTooltip
                    align="start"
                    tooltip="Define the instructions for your agent. This could include providing context, listing tasks the agent should perform, setting any constraints or guardrails, and specifying the desired tone and style of response."
                    tooltipExample="Example: Listen to the customer's concern and gather relevant information needed for resolution. Provide clear and concise action steps for the customer. Use a professional and soothing tone to answer."
                  >
                    Agent Instructions
                  </LabelWithTooltip>
                  <div className="relative">
                    <FormControl>
                      <div className="relative">
                        <Textarea
                          {...field}
                          rows={4}
                          placeholder="LISTEN to the customer's concern & GATHER all relevant information needed for resolution. PROVIDE clear and concise answers to the customer."
                          className={`resize-none border
                            ${isImprovingPrompt ? "opacity-50" : ""}
                            ${isPromptImproved ? "border-green-500 bg-green-50" : ""}
                            transition-all duration-300`}
                          disabled={isImprovingPrompt}
                        />
                        {isImprovingPrompt && (
                          <div
                            className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                            style={{
                              backgroundSize: "200% 100%",
                              animation: "shimmer 2s infinite",
                            }}
                          />
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute bottom-2 right-2"
                          onClick={() => setIsInstructionsExpanded(true)}
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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
                  {isFetchingLyzrProviders ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Select
                      value={field.value}
                      onValueChange={handleProviderChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Provider" />
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
                                    p.provider_id?.toLowerCase() ===
                                    provider.provider_id,
                                )?.display_name ??
                                providerLabelMap[provider?.provider_id]
                              } [${provider?.credentials?.name || "Default"}]`;

                          // Determine the value prop based on provider type
                          const selectValue = isLlm
                            ? `${providerId} [${provider?.credentials?.name || "Default"}]`
                            : providerId;
                          // Default case for providers without special credentials
                          return (
                            <SelectItem
                              key={selectValue}
                              value={selectValue}
                              className="w-full"
                            >
                              {displayText}
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
                    tooltip="Choose the LLM model for your agent"
                  >
                    LLM Model
                  </LabelWithTooltip>
                </div>
                <FormControl>
                  {isFetchingLyzrProviders ? (
                    <Skeleton className="h-9 w-full" />
                  ) : provider_id?.toLowerCase().includes("huggingface") ? (
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
                      disabled={!provider_id}
                    >
                      <SelectTrigger
                        className={cn(
                          !provider_id ? "cursor-not-allowed opacity-50" : "",
                        )}
                      >
                        <SelectValue
                          placeholder={
                            !provider_id
                              ? "Select a Provider First"
                              : "Select Model"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {getModelsList().map((value) => {
                          const baseProviderId = provider_id?.split(" [")[0];
                          const selectedProvider = providers.find((p) =>
                            p.provider_id?.toLowerCase() === baseProviderId?.toLowerCase() && p.type === "lyzr-llm"
                          );
                          const displayName = resolveModelDisplayName(
                            value,
                            selectedProvider?.meta_data?.display_names,
                            nvidiaModelDisplayNames,
                          );
                          return (
                            <SelectItem key={value} value={value}>
                              {displayName}
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

        <div ref={scrollRef} />
      </div>

      {/* Expanded Instructions Dialog */}
      <Dialog
        open={isInstructionsExpanded}
        onOpenChange={setIsInstructionsExpanded}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agent Instructions</DialogTitle>
          </DialogHeader>
          <FormField
            control={form.control}
            name="agent_instructions"
            render={({ field }) => (
              <Textarea {...field} rows={15} className="min-h-[300px] w-full" />
            )}
          />
          <div className="flex justify-end">
            <Button onClick={() => setIsInstructionsExpanded(false)}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SimplifiedBasicDetails;
