import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn, resolveModelDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IProvider } from "@/lib/types";
import { nvidiaModelDisplayNames } from "@/lib/constants";

interface ModelSelectorProps {
  value?: string;
  onValueChange: (value: string, providerId: string, model: string) => void;
  providers: IProvider[];
  models: { [key: string]: string[] | Record<string, string[]> };
  providerLabelMap: { [key: string]: string };
  disabled?: boolean;
  placeholder?: string;
  isModelDisabled?: (model: string) => boolean;
  isProviderDisabled?: (provider: IProvider) => boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onValueChange,
  providers,
  models,
  providerLabelMap,
  disabled = false,
  placeholder = "Search models...",
  isModelDisabled = () => false,
  isProviderDisabled = () => false,
}) => {
  const [open, setOpen] = useState(false);
  const [allOptions, setAllOptions] = useState<
    Array<{
      searchKey: string;
      label: string;
      providerId: string;
      providerDisplay: string;
      model: string;
      modelDisplay: string;
      disabled: boolean;
    }>
  >([]);

  // Build all options when data changes
  useEffect(() => {
    console.log("ModelSelector: useEffect triggered");
    console.log("ModelSelector: providers:", providers?.length);
    console.log("ModelSelector: models keys:", Object.keys(models));

    const options: typeof allOptions = [];

    providers.forEach((provider) => {
      const isLyzrLlm = provider?.type === "lyzr-llm";
      const isLlm = provider?.type === "llm";

      const baseProviderName =
        providerLabelMap[provider?.provider_id] || provider.provider_id;
      const credentialName = provider?.credentials?.name || "Default";
      const providerDisplay = isLlm
        ? `${baseProviderName} [${credentialName}]`
        : isLyzrLlm
          ? provider.display_name
          : baseProviderName;

      console.log(
        "ModelSelector: Processing provider:",
        provider.provider_id,
        "display:",
        providerDisplay,
      );

      // Get models for this provider - try both exact match and lowercase
      const providerModels =
        models[provider.provider_id] ||
        models[provider.provider_id?.toLowerCase()];
      if (!providerModels) {
        console.log(
          "ModelSelector: No models found for provider:",
          provider.provider_id,
        );
        return;
      }

      let modelList: string[] = [];
      if (Array.isArray(providerModels)) {
        modelList = providerModels;
      } else if (typeof providerModels === "object") {
        modelList = Object.values(providerModels).flat();
      }

      console.log(
        "ModelSelector: Found",
        modelList.length,
        "models for",
        provider.provider_id,
      );

      modelList.forEach((model) => {
        const modelDisplay = resolveModelDisplayName(
          model,
          provider?.meta_data?.display_names
          || providers.find((p) => p.provider_id?.toLowerCase() === provider.provider_id?.toLowerCase() && p.type === "lyzr-llm")?.meta_data?.display_names,
          nvidiaModelDisplayNames,
        );

        const searchKey = `${providerDisplay} ${modelDisplay}`?.toLowerCase();

        options.push({
          searchKey,
          label: `${providerDisplay} - ${modelDisplay}`,
          providerId: provider.provider_id,
          providerDisplay,
          model,
          modelDisplay,
          disabled: isProviderDisabled(provider) || isModelDisabled(model),
        });
      });
    });

    console.log("ModelSelector: Built", options.length, "options");
    console.log("ModelSelector: Sample options:", options.slice(0, 3));
    setAllOptions(options);
  }, [
    providers,
    models,
    providerLabelMap,
    isModelDisabled,
    isProviderDisabled,
  ]);

  // Find selected option
  const selectedOption = allOptions.find((opt) => opt.model === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            disabled && "cursor-not-allowed opacity-50",
          )}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search provider and model..." />
          <CommandList>
            <CommandEmpty>
              {allOptions.length === 0
                ? "Loading models..."
                : "No model found."}
            </CommandEmpty>
            <CommandGroup>
              {allOptions.map((option, idx) => (
                <CommandItem
                  key={`${option.providerId}-${option.model}-${idx}`}
                  value={option.searchKey}
                  disabled={option.disabled}
                  onSelect={() => {
                    if (!option.disabled) {
                      onValueChange(
                        option.model,
                        option.providerId,
                        option.model,
                      );
                      setOpen(false);
                    }
                  }}
                  className={cn(
                    option.disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.model ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {option.providerDisplay}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {option.modelDisplay}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
