import React, { useState, useCallback, useEffect } from "react";
import axios from "axios";
import {
  FormControl,
  FormField,
  FormItem,
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
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import useStore from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { styles } from "../styles";
import { BasicDetailsProps } from "../types";
import ModelHelpDialog from "./model-help-dialog";
import AgentPromptSection from "./agent-prompt-section";
import { BASE_URL, nvidiaModelDisplayNames } from "@/lib/constants";
import { IProvider } from "@/lib/types";
import LabelWithTooltip from "@/components/custom/label-with-tooltip";
import { useModel } from "@/pages/configure/models/model-service";
import { ModelSelector } from "./model-selector";
import ToolsSection from "./tools-section";

const StyleTag = () => <style>{styles}</style>;

type Model = string[] | Record<string, string[]>;

export const BasicDetails: React.FC<BasicDetailsProps> = ({
  scrollRef,
  form,
  // @ts-ignore
  agent,
}) => {
  const apiKey = useStore((state) => state.api_key);
  const provider_id = form.getValues("provider_id");
  const [isToolDescriptionExpanded, setIsToolDescriptionExpanded] =
    useState(false);
  const [providers, setProviders] = useState<IProvider[]>([]);
  const [models, setModels] = useState<{
    [key: string]: Model;
  }>({});
  const [bedrockCredentials, setBedrockCredentials] = useState<any[]>([]);
  const [huggingfaceCredentials, setHuggingfaceCredentials] = useState<any[]>(
    [],
  );
  const [nvidiaCredentials, setNvidiaCredentials] = useState<any[]>([]);
  const [isModelHelpOpen, setIsModelHelpOpen] = useState(false);
  const [disabledModels, setDisabledModels] = useState<string[]>([]);

  // const _examples_visible = form.watch("examples_visible");
  const providerLabelMap: { [key: string]: string } = {
    nvidia: "Nvidia",
    huggingface: "Hugging Face",
    watsonx: "IBM Watson X",
    cohere: "Cohere",
  };

  const { getLyzrProviders, isFetchingLyzrProviders } = useModel({ apiKey });

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
  }, [form.formState.errors]);

  useEffect(() => {
    console.log("Credentials effect running");

    const fetchProvidersAndModels = async () => {
      try {
        const lyzrProvidersResponse = await getLyzrProviders();
        const providersResponse: { data: IProvider[] } = { data: [] };

        const lyzrProviders = lyzrProvidersResponse.data ?? [];
        const disableModels = lyzrProviders.reduce(
          (acc: string[], provider: any) => {
            if (provider.disabled && Array.isArray(provider.disabled)) {
              return [...acc, ...provider.disabled];
            }
            return acc;
          },
          [],
        );
        setDisabledModels(disableModels);

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

            // Add provider if not already present

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

  const getDisabledModel = ({
    model,
    providerId,
  }: {
    model: string;
    providerId: string;
  }): boolean => {
    const baseProviderId = providerId.toLowerCase();
    if (disabledModels.includes(model)) return true;

    // For AWS Bedrock models
    if (baseProviderId === "aws-bedrock") {
      const currentProvider = providers.find(
        (p) => p.provider_id?.toLowerCase() === "aws-bedrock",
      );

      if (
        currentProvider?.disabled &&
        typeof currentProvider.disabled === "object"
      ) {
        if (providerId === provider_id) {
          const llm_credential_id = form.getValues("llm_credential_id");
          const currentCredential = bedrockCredentials.find(
            (cred) => cred?.credential_id === llm_credential_id,
          );

          const region_name = currentCredential?.credentials?.aws_region_name
            ? currentCredential?.credentials?.aws_region_name?.startsWith("us")
              ? "us"
              : "eu"
            : "us";

          const regionDisabledModels =
            (currentProvider.disabled[region_name] as string[]) || [];
          return regionDisabledModels.includes(model);
        }
      }
    }
    return false;
  };

  // Unused function - keeping for future reference
  // const getModelsList = (): string[] => {
  //   const baseProviderId = provider_id.split(" [")[0]?.toLowerCase();
  //   const modelsList = models[baseProviderId];
  //   if (Array.isArray(modelsList)) {
  //     return modelsList;
  //   } else if (baseProviderId === "aws-bedrock" && typeof models === "object") {
  //     const llm_credential_id = form.getValues("llm_credential_id");
  //     const currentCredential = bedrockCredentials.find((cred) => cred?.credential_id === llm_credential_id);
  //     const aws_region_name = currentCredential?.credentials?.aws_region_name
  //       ? currentCredential?.credentials?.aws_region_name?.startsWith("us") ? "us" : "eu"
  //       : "us";
  //     return modelsList?.[aws_region_name] ?? [];
  //   }
  //   return [];
  // };

  const isModelDisabled = (modelValue: string): boolean => {
    const baseProviderId = provider_id.split(" [")[0]?.toLowerCase();
    return getDisabledModel({
      model: modelValue,
      providerId: baseProviderId,
    });
  };

  const isProviderDisabled = (provider: IProvider): boolean => {
    const baseProviderId = provider.provider_id.toLowerCase();
    let availableModels: string[] = [];

    if (Array.isArray(models[baseProviderId])) {
      availableModels = models[baseProviderId];
    } else if (
      baseProviderId === "aws-bedrock" &&
      typeof models[baseProviderId] === "object"
    ) {
      const regions = Object.keys(models[baseProviderId] as object);
      availableModels = regions.flatMap(
        (region) => (models[baseProviderId] as any)[region] || [],
      );
    }

    if (baseProviderId === "aws-bedrock") {
      const disabledObj = provider.disabled;
      if (!disabledObj || typeof disabledObj !== "object") {
        return disabledModels.some((model) => availableModels.includes(model));
      }

      return availableModels.every((model) => {
        const modelRegions = [];
        if ((models[baseProviderId] as any).us?.includes(model))
          modelRegions.push("us");
        if ((models[baseProviderId] as any).eu?.includes(model))
          modelRegions.push("eu");

        const isDisabledInAllRegions = modelRegions.every((region) => {
          const regionDisabledModels = (disabledObj as any)[region] || [];
          return regionDisabledModels.includes(model);
        });

        return isDisabledInAllRegions || disabledModels.includes(model);
      });
    }

    return availableModels.every((model) =>
      getDisabledModel({
        model,
        providerId: provider.provider_id,
      }),
    );
  };

  return (
    <>
      <StyleTag />
      <div className="no-scrollbar grid h-full grid-cols-4 gap-3 overflow-x-hidden overflow-y-scroll">
        <div className="col-span-4 flex flex-col gap-3">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <LabelWithTooltip
                  align="start"
                  tooltip="Enter a unique name for your agent"
                >
                  <span className="text-sm">Name</span>
                </LabelWithTooltip>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Agent name"
                    className="h-9 border text-sm"
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
                  <span className="text-sm">Description</span>
                </LabelWithTooltip>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Agent description"
                    className="h-9 border text-sm"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-4 flex items-center justify-start gap-3">
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem className="flex-1">
                <LabelWithTooltip
                  align="start"
                  tooltip="Voice agents are optimized for GPT-4o. This model cannot be changed."
                >
                  <span className="text-sm">LLM Provider & Model</span>
                </LabelWithTooltip>
                <FormControl>
                  {isFetchingLyzrProviders ? (
                    <Skeleton className="h-9 w-full" />
                  ) : provider_id?.toLowerCase().includes("huggingface") ? (
                    <Input
                      {...field}
                      value={field.value?.replace("huggingface/", "") || ""}
                      placeholder="Enter model name"
                      className="h-9 text-sm"
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value ? `huggingface/${value}` : "");
                        form.clearErrors("model");
                      }}
                    />
                  ) : (
                    <ModelSelector
                      value={field.value}
                      onValueChange={(fullValue, providerId, model) => {
                        console.log(
                          "Model changed to:",
                          fullValue,
                          providerId,
                          model,
                        );
                        // Update both provider and model
                        form.setValue("provider_id", providerId);
                        form.setValue("model", model);
                        form.clearErrors("model");
                        form.clearErrors("provider_id");

                        // Call the handler to update any dependent fields
                        handleProviderChange(providerId);
                      }}
                      providers={allProviders}
                      models={models}
                      providerLabelMap={providerLabelMap}
                      isModelDisabled={isModelDisabled}
                      isProviderDisabled={isProviderDisabled}
                      placeholder="Search provider and model..."
                      disabled={true}
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem className="flex-1">
                <LabelWithTooltip
                  align="start"
                  tooltip="Select the primary language for your agent's responses"
                >
                  <span className="text-sm">Language</span>
                </LabelWithTooltip>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue="English"
                >
                  <FormControl>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="English">🇬🇧 English</SelectItem>
                    <SelectItem value="Spanish">
                      🇪🇸 Spanish (Español)
                    </SelectItem>
                    <SelectItem value="French">🇫🇷 French (Français)</SelectItem>
                    <SelectItem value="German">🇩🇪 German (Deutsch)</SelectItem>
                    <SelectItem value="Chinese">🇨🇳 Chinese (中文)</SelectItem>
                    <SelectItem value="Japanese">
                      🇯🇵 Japanese (日本語)
                    </SelectItem>
                    <SelectItem value="Hindi">🇮🇳 Hindi (हिन्दी)</SelectItem>
                    <SelectItem value="Hebrew">🇮🇱 Hebrew (עברית)</SelectItem>
                    <SelectItem value="Arabic">🇸🇦 Arabic (العربية)</SelectItem>
                    <SelectItem value="Portuguese">
                      🇵🇹 Portuguese (Português)
                    </SelectItem>
                    <SelectItem value="Russian">
                      🇷🇺 Russian (Русский)
                    </SelectItem>
                    <SelectItem value="Kannada">🇮🇳 Kannada (ಕನ್ನಡ)</SelectItem>
                    <SelectItem value="Tamil">🇮🇳 Tamil (தமிழ்)</SelectItem>
                    <SelectItem value="Telugu">🇮🇳 Telugu (తెలుగు)</SelectItem>
                    <SelectItem value="Bengali">🇮🇳 Bengali (বাংলা)</SelectItem>
                    <SelectItem value="Marathi">🇮🇳 Marathi (मराठी)</SelectItem>
                    <SelectItem value="Gujarati">
                      🇮🇳 Gujarati (ગુજરાતી)
                    </SelectItem>
                    <SelectItem value="Korean">🇰🇷 Korean (한국어)</SelectItem>
                    <SelectItem value="Italian">
                      🇮🇹 Italian (Italiano)
                    </SelectItem>
                    <SelectItem value="Dutch">🇳🇱 Dutch (Nederlands)</SelectItem>
                    <SelectItem value="Turkish">🇹🇷 Turkish (Türkçe)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-4 flex flex-col gap-3">
          <FormField
            control={form.control}
            name="voice"
            render={({ field }) => (
              <FormItem>
                <LabelWithTooltip
                  align="start"
                  tooltip="Choose the voice for your agent"
                >
                  <span className="text-sm">Voice</span>
                </LabelWithTooltip>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue="sage"
                >
                  <FormControl>
                    <SelectTrigger className="h-9 text-sm focus:ring-0 focus:ring-offset-0 focus-visible:ring-0">
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="alloy">Alloy</SelectItem>
                    <SelectItem value="ash">Ash</SelectItem>
                    <SelectItem value="ballad">Ballad</SelectItem>
                    <SelectItem value="coral">Coral</SelectItem>
                    <SelectItem value="echo">Echo</SelectItem>
                    <SelectItem value="sage">Sage</SelectItem>
                    <SelectItem value="shimmer">Shimmer</SelectItem>
                    <SelectItem value="verse">Verse</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="who_speaks_first"
            render={({ field }) => (
              <FormItem>
                <LabelWithTooltip
                  align="start"
                  tooltip="Choose who initiates the conversation"
                >
                  <span className="text-sm">Who Speaks First</span>
                </LabelWithTooltip>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue="human"
                >
                  <FormControl>
                    <SelectTrigger className="h-9 text-sm focus:ring-0 focus:ring-offset-0 focus-visible:ring-0">
                      <SelectValue placeholder="Select who speaks first" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="human">Human Speaks First</SelectItem>
                    <SelectItem value="ai">AI Speaks First</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("who_speaks_first") === "ai" && (
            <FormField
              control={form.control}
              name="ai_intro_text"
              render={({ field }) => (
                <FormItem>
                  <LabelWithTooltip
                    align="start"
                    tooltip="Enter the greeting message AI will use to start the conversation"
                  >
                    <span className="text-sm">AI Introduction Text</span>
                  </LabelWithTooltip>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Hello! How can I help you today?"
                      className="resize-none border text-sm focus:ring-0 focus:ring-offset-0 focus-visible:ring-0"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="col-span-4">
          <AgentPromptSection form={form} />
        </div>

        <ToolsSection form={form} agent={agent} />

        <div ref={scrollRef} />
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
