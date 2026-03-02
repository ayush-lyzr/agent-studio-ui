import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { ChevronDown } from "lucide-react";

import { getProviderModelLogo, ProviderId } from "@/assets/images";
import LabelWithTooltip from "@/components/custom/label-with-tooltip";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useProviderModel } from "@/hooks/useProviderModel";
import { nvidiaModelDisplayNames } from "@/lib/constants";
import useStore from "@/lib/store";
import { IProvider, Model } from "@/lib/types";
import { cn, resolveModelDisplayName } from "@/lib/utils";
import ModelHelpDialog from "./model-help-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfigureModel } from "./configure-model";

type ProviderModelProps = {
  form: UseFormReturn<any>;
  allowConfigure?: boolean;
};

const providerLabelMap: { [key: string]: string } = {
  nvidia: "Nvidia",
  huggingface: "Hugging Face",
  watsonx: "IBM Watson X",
  cohere: "Cohere",
  azure: "Azure",
};

export const ProviderModel: React.FC<ProviderModelProps> = ({
  form,
  allowConfigure = true,
}) => {
  const apiKey = useStore((state) => state.api_key);
  const [isModelHelpOpen, setIsModelHelpOpen] = useState<boolean>(false);
  const [modelConfig, setModelConfig] = useState<Model | null>(null);

  const provider_id = form.watch("provider_id");
  const llmCredId = form.watch("llm_credential_id");
  const model = form.watch("model");

  const {
    providers,
    models,
    rawModels,
    handleProviderChange,
    isFetchingLyzrProviders,
    isProviderDisabled,
    allProviders,
  } = useProviderModel({ apiKey, form });

  const getModelsForProvider = (provider: IProvider): string[] => {
    const baseProviderId = provider.provider_id.toLowerCase();

    // Check if this is a custom credential with models in meta_data
    // Custom credentials have type: "llm" and meta_data.models as an array of {name, type} objects
    const isCustomCredential = provider.type === "llm";
    if (isCustomCredential) {
      const customModels = (provider as any).meta_data?.models;
      if (Array.isArray(customModels) && customModels.length > 0) {
        // Filter for inference models and extract model names
        return customModels
          .filter((model: { name: string; type: string }) => model.type === "inference")
          .map((model: { name: string; type: string }) => model.name);
      }
    }

    // Fall back to default models from providers
    const modelsList = models[baseProviderId];

    if (Array.isArray(modelsList)) {
      return modelsList;
    } else if (
      baseProviderId === "aws-bedrock" &&
      typeof modelsList === "object"
    ) {
      // Try to get region from credential
      const region = provider.credentials?.aws_region_name;
      if (region) {
        const regionKey = region.startsWith("us") ? "us" : "eu";
        return (modelsList as any)[regionKey] || [];
      }
      // Fallback: return all models flattened or just 'us'
      return (modelsList as any)["us"] || [];
    }
    return [];
  };

  const getProviderDisplayName = (provider: IProvider) => {
    const isLyzrLlm = provider?.type === "lyzr-llm";
    return isLyzrLlm
      ? provider.display_name
      : `${providers.find(
        (p) => p.provider_id.toLowerCase() === provider.provider_id,
      )?.display_name ?? providerLabelMap[provider?.provider_id]
      } [${provider?.credentials?.name || provider?.name || "Default"}]`;
  };

  const getProviderValue = (provider: IProvider) => {
    const providerId = provider.provider_id.replace(
      /(^|-)([a-z])/g,
      (_: any, separator: any, letter: any) => separator + letter.toUpperCase(),
    );
    const isLlm = provider?.type === "llm";
    return isLlm
      ? `${providerId} [${provider?.credentials?.name || provider?.name || "Default"}]`
      : providerId;
  };

  const selectedProvider = allProviders.find((p) => {
    const credId = llmCredId ?? "";
    if (!credId.includes("lyzr")) {
      return (
        p.credential_id === credId &&
        p.provider_id?.toLowerCase?.() === provider_id?.toLowerCase?.()
      );
    }
    return getProviderValue(p) === provider_id;
  });

  const getDisplayNames = (provider?: IProvider) => {
    if (provider?.meta_data?.display_names) return provider.meta_data.display_names;
    // Fallback to lyzr provider's display_names for credential-based entries
    const lyzrProvider = providers.find(
      (p) => p.provider_id?.toLowerCase() === provider?.provider_id?.toLowerCase()
    );
    return lyzrProvider?.meta_data?.display_names;
  };

  const selectedModelDisplay = model
    ? resolveModelDisplayName(
      model,
      getDisplayNames(selectedProvider),
      nvidiaModelDisplayNames,
    )
    : "Select Model";

  useEffect(() => {
    if (provider_id && model && rawModels) {
      const selectedProvider = allProviders.find(
        (p) => getProviderValue(p) === provider_id,
      );

      if (selectedProvider) {
        const baseProviderId = selectedProvider.provider_id.toLowerCase();
        const providerRawModels = rawModels[baseProviderId];

        if (Array.isArray(providerRawModels)) {
          const modelArray = providerRawModels.find((m: any) => {
            if (Array.isArray(m)) {
              const name = typeof m[0] === "string" ? m[0] : m[0][0];
              return name === model;
            }
            return false;
          });

          if (modelArray && Array.isArray(modelArray)) {
            const lastItem = modelArray[modelArray.length - 1];
            if (
              typeof lastItem === "object" &&
              !Array.isArray(lastItem) &&
              lastItem !== null
            ) {
              setModelConfig(lastItem as Model);
            } else {
              setModelConfig(null);
            }
          }
        }
      }
    }
  }, [provider_id, model, rawModels]);

  return (
    <>
      <FormField
        control={form.control}
        name="provider_id"
        render={() => (
          <FormItem className="flex-1">
            <div className="flex items-center justify-between">
              <LabelWithTooltip
                align="start"
                tooltip="Select the LLM provider and model for your agent"
              >
                Model
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
              {isFetchingLyzrProviders ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between font-normal",
                        !provider_id && "text-muted-foreground",
                      )}
                    >
                      {provider_id ? (
                        <div className="flex items-center gap-2 truncate">
                          <img
                            src={getProviderModelLogo(
                              provider_id
                                .split(" [")[0]
                                ?.toLowerCase() as ProviderId,
                            )}
                            alt="Provider logo"
                            className="h-5 w-5 object-contain"
                          />
                          <span className="truncate">
                            {selectedProvider
                              ? getProviderDisplayName(selectedProvider)
                              : provider_id}
                          </span>
                          <span className="text-muted-foreground">/</span>
                          <span className="truncate">
                            {selectedModelDisplay}
                          </span>
                        </div>
                      ) : (
                        "Select Provider & Model"
                      )}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-[300px] w-[22rem] overflow-y-auto">
                    {allProviders.map((provider) => {
                      const providerValue = getProviderValue(provider);
                      const isDisabled = isProviderDisabled(provider);
                      const baseProviderId = provider.provider_id.toLowerCase();
                      const providerModels = getModelsForProvider(provider);

                      return (
                        <DropdownMenuSub key={providerValue}>
                          <DropdownMenuSubTrigger
                            disabled={isDisabled}
                            className="flex items-center gap-2"
                          >
                            <img
                              src={getProviderModelLogo(
                                baseProviderId as ProviderId,
                              )}
                              alt={provider.display_name}
                              className="h-5 w-5 object-contain"
                            />
                            <span>{getProviderDisplayName(provider)}</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto">
                            {providerModels.length > 0 ? (
                              providerModels.map((modelValue) => {
                                const isModelDisabled = false; // Add logic if needed
                                const modelDisplay = resolveModelDisplayName(
                                  modelValue,
                                  getDisplayNames(provider),
                                  nvidiaModelDisplayNames,
                                );

                                return (
                                  <DropdownMenuItem
                                    key={modelValue}
                                    disabled={isModelDisabled}
                                    onClick={() => {
                                      handleProviderChange(providerValue);
                                      form.setValue("model", modelValue, {
                                        shouldDirty: true,
                                      });
                                      form.clearErrors("model");
                                      form.setValue(
                                        "additional_model_params",
                                        null,
                                      );

                                      // Extract model configuration if available
                                      const baseProviderId =
                                        provider.provider_id.toLowerCase();
                                      const providerRawModels =
                                        rawModels[baseProviderId];

                                      if (Array.isArray(providerRawModels)) {
                                        const modelArray =
                                          providerRawModels.find((m: any) => {
                                            if (Array.isArray(m)) {
                                              const name =
                                                typeof m[0] === "string"
                                                  ? m[0]
                                                  : m[0][0];
                                              return name === modelValue;
                                            }
                                            return false;
                                          });

                                        if (
                                          modelArray &&
                                          Array.isArray(modelArray)
                                        ) {
                                          const lastItem =
                                            modelArray[modelArray.length - 1];
                                          if (
                                            typeof lastItem === "object" &&
                                            !Array.isArray(lastItem) &&
                                            lastItem !== null
                                          ) {
                                            console.log(
                                              "Model config extracted:",
                                              lastItem,
                                            );
                                            setModelConfig(lastItem as Model);
                                          } else {
                                            setModelConfig(null);
                                            form.setValue(
                                              "additional_model_params",
                                              null,
                                            );
                                          }
                                        } else {
                                          setModelConfig(null);
                                          form.setValue(
                                            "additional_model_params",
                                            null,
                                          );
                                        }
                                      } else {
                                        setModelConfig(null);
                                        form.setValue(
                                          "additional_model_params",
                                          null,
                                        );
                                      }
                                    }}
                                  >
                                    {modelDisplay}
                                  </DropdownMenuItem>
                                );
                              })
                            ) : (
                              <DropdownMenuItem disabled>
                                No models available
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {allowConfigure && modelConfig && (
        <ConfigureModel modelConfig={modelConfig} parentForm={form} />
      )}

      <ModelHelpDialog
        open={isModelHelpOpen}
        onOpenChange={setIsModelHelpOpen}
        providers={providers}
      />
    </>
  );
};
