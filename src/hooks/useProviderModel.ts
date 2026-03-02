import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { UseFormReturn } from "react-hook-form";
import { toast } from "@/components/ui/use-toast";
import { BASE_URL, nvidiaModelDisplayNames } from "@/lib/constants";
import { IProvider } from "@/lib/types";
import { useModel } from "@/pages/configure/models/model-service";

type ModelList = string[] | Record<string, string[]>;

interface UseProviderModelProps {
  apiKey: string;
  form: UseFormReturn<any>;
}

export const useProviderModel = ({ apiKey, form }: UseProviderModelProps) => {
  const provider_id = form.getValues("provider_id");
  const [providers, setProviders] = useState<IProvider[]>([]);
  const [models, setModels] = useState<{
    [key: string]: ModelList;
  }>({});
  const [rawModels, setRawModels] = useState<{ [key: string]: any[] }>({});
  const [bedrockCredentials, setBedrockCredentials] = useState<any[]>([]);
  const [huggingfaceCredentials, setHuggingfaceCredentials] = useState<any[]>(
    [],
  );
  const [nvidiaCredentials, setNvidiaCredentials] = useState<any[]>([]);
  const [azureCredentials, setAzureCredentials] = useState<any[]>([]);
  const [disabledModels, setDisabledModels] = useState<string[]>([]);

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
          azure: azureCredentials,
        };

        // Find credential and set credential ID
        const lowerProviderId = baseProviderId.toLowerCase();

        const credentialArray = credentialsMap[lowerProviderId]; // user creds
        const credential = credentialArray?.find(
          (cred) => (cred?.credentials?.name || cred?.name || "Default") === credentialName,
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
          let modelsList: string[] = [];

          // Check if this is a custom credential with models in meta_data
          // Custom credentials have type: "llm" and meta_data.models as {name, type} objects
          const isCustomCredential = credential?.type === "llm";
          const customModels = isCustomCredential ? (credential?.meta_data as any)?.models : undefined;

          if (Array.isArray(customModels) && customModels.length > 0) {
            // Filter for inference models and extract names
            modelsList = customModels
              .filter((model: { name: string; type: string }) => model.type === "inference")
              .map((model: { name: string; type: string }) => model.name);
          } else {
            const providerModels = models[lowerProviderId];
            if (providerModels) {
              if (Array.isArray(providerModels)) {
                modelsList = providerModels;
              } else {
                modelsList = (providerModels as Record<string, string[]>)[region_name] || [];
              }
            }
          }

          if (modelsList.length > 0 && lowerProviderId !== "aws-bedrock") {
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
      azureCredentials,
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
    ...azureCredentials,
  ];

  useEffect(() => {
    console.log("Credentials effect running");

    const fetchProvidersAndModels = async (): Promise<Record<string, ModelList>> => {
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
          (acc: Record<string, ModelList>, provider: IProvider) => {
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

        // Store raw models for configuration extraction
        const rawModelsMap = combinedProviders.reduce(
          (acc: Record<string, any[]>, provider: IProvider) => {
            const models = provider.meta_data.models;
            if (Array.isArray(models)) {
              acc[provider.provider_id?.toLowerCase()] = models;
            }
            return acc;
          },
          {},
        );

        setModels(() => ({ ...modelsMap }));
        setRawModels(() => ({ ...rawModelsMap }));

        return modelsMap;
      } catch (error) {
        console.error("Error fetching providers:", error);
        toast({
          title: "Error fetching providers",
          description: "Unable to load providers. Please try again.",
          variant: "destructive",
        });
        return {};
      }
    };

    const createCredentialFetcher = (
      providerKey: string,
      displayName: string,
      modelListGetter: (modelsMap: Record<string, ModelList>) => ModelList,
      setCredentials: React.Dispatch<React.SetStateAction<any[]>>,
    ) => {
      return async (modelsMap: Record<string, ModelList>) => {
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
            const modelsList = modelListGetter(modelsMap);
            // Update models
            if (
              modelsList &&
              (Array.isArray(modelsList)
                ? modelsList.length > 0
                : Object.keys(modelsList).length > 0)
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
      (modelsMap) => modelsMap["aws-bedrock"],
      setBedrockCredentials,
    );

    const fetchHuggingfaceCredentials = createCredentialFetcher(
      "huggingface",
      "Huggingface",
      (modelsMap) => (Array.isArray(modelsMap["huggingface"]) ? modelsMap["huggingface"] : []),
      setHuggingfaceCredentials,
    );

    const fetchNvidiaCredentials = createCredentialFetcher(
      "nvidia",
      "NVIDIA",
      () => Object.keys(nvidiaModelDisplayNames),
      setNvidiaCredentials,
    );

    const fetchAzureCredentials = createCredentialFetcher(
      "azure",
      "Azure",
      (modelsMap) => modelsMap["azure"],
      setAzureCredentials,
    );

    const fetchAllCredentials = async () => {
      const modelsMap = await fetchProvidersAndModels();

      await Promise.all([
        fetchBedrockCredentials(modelsMap),
        fetchHuggingfaceCredentials(modelsMap),
        fetchNvidiaCredentials(modelsMap),
        fetchAzureCredentials(modelsMap),
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

  const isModelDisabled = (modelValue: string): boolean => {
    const baseProviderId = provider_id.split(" [")[0]?.toLowerCase();
    return getDisabledModel({
      model: modelValue,
      providerId: baseProviderId,
    });
  };

  const isProviderDisabled = (provider: IProvider): boolean => {
    const baseProviderId = provider.provider_id.toLowerCase();

    // Check if this is a custom credential with models in meta_data
    // Models are {name, type} objects - check if there are any inference models
    const customModels = (provider as any).meta_data?.models;
    if (Array.isArray(customModels) && customModels.length > 0) {
      // Check if there are any inference models available
      const hasInferenceModels = customModels.some(
        (model: { name: string; type: string }) => model.type === "inference"
      );
      if (hasInferenceModels) {
        return false; // Custom credentials with inference models are not disabled
      }
    }

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

  return {
    providers,
    models,
    rawModels,
    handleProviderChange,
    isFetchingLyzrProviders,
    isModelDisabled,
    isProviderDisabled,
    allProviders,
    getModelsList,
  };
};
