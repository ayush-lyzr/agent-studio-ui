import { useState, useEffect } from "react";
import { ArrowTopRightIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import LabelWithTooltip from "@/components/custom/label-with-tooltip";
import { Tooltip, TooltipContent } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModel } from "@/pages/configure/models/model-service";
import useStore from "@/lib/store";
import { IProvider } from "@/lib/types";

interface ConfigureImageAsOutputProps {
  updateFeatures: (
    name: string,
    enabled: boolean,
    ragId?: string,
    ragName?: string,
    config?: {
      image_provider_id?: string;
      [key: string]: any;
    },
  ) => void;
  featureName: string;
  openDialog?: boolean;
  config?: {
    model?: string;
    credential_id?: string;
  } | null;
}

export const ConfigureImageAsOutput: React.FC<ConfigureImageAsOutputProps> = ({
  updateFeatures,
  featureName,
  openDialog,
  config,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedImageProviderId, setSelectedImageProviderId] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const apiKey = useStore((state) => state.api_key);
  const { imageModelProviders = [] } = useModel({
    apiKey,
    imageModelProvidersEnabled: true,
  });

  const getProviderValue = (provider: IProvider) => {
    const providerId = provider.provider_id.replace(
      /(^|-)([a-z])/g,
      (_: any, separator: any, letter: any) => separator + letter.toUpperCase(),
    );
    const isLlm = provider?.type === "llm";
    return isLlm
      ? `${providerId} [${provider?.credentials?.name || "Default"}]`
      : providerId;
  };

  // Load saved config only when dialog first opens (not on every re-render)
  useEffect(() => {
    if (open && !hasUserInteracted) {
      if (config && config.model && imageModelProviders.length > 0) {
        const matchingProvider = imageModelProviders.find(
          (provider) =>
            provider.meta_data?.credential_id === config.credential_id,
        );

        if (matchingProvider) {
          const providerValue = getProviderValue(matchingProvider);
          setSelectedImageProviderId(providerValue);
          setSelectedModel(config.model);
        }
      } else {
        setSelectedImageProviderId("");
        setSelectedModel("");
      }
    }
  }, [open]);

  useEffect(() => {
    if (openDialog) {
      setOpen(true);
    }
  }, [openDialog]);

  const selectedProvider = imageModelProviders.find(
    (provider) => getProviderValue(provider) === selectedImageProviderId,
  );

  const handleProviderModelChange = (providerValue: string, model: string) => {
    setSelectedImageProviderId(providerValue);
    setSelectedModel(model);
    setHasUserInteracted(true);
  };

  const handleSave = () => {
    updateFeatures(featureName, true, undefined, undefined, {
      model: selectedModel,
      credential_id: selectedProvider?.meta_data?.credential_id,
    });
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setHasUserInteracted(false);
      setSelectedImageProviderId("");
      setSelectedModel("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: "link" }),
          "p-0 text-link animate-in slide-in-from-top-2",
        )}
      >
        Configure
        <ArrowTopRightIcon className="size-4" />
      </DialogTrigger>
      <DialogContent aria-describedby="dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Image as Output Configuration</span>
          </DialogTitle>
          <p
            id="dialog-description"
            className="mt-2 text-sm text-muted-foreground"
          >
            Select a image provider to use as output for your agent.
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-full">
              <div className="mb-2 flex items-center justify-between">
                <LabelWithTooltip tooltip="Choose a image provider to use as output for your agent">
                  Select Image Provider
                </LabelWithTooltip>
                <Tooltip>
                  <TooltipContent>Refresh image providers list</TooltipContent>
                </Tooltip>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between font-normal",
                      !selectedImageProviderId && "text-muted-foreground",
                    )}
                  >
                    {selectedImageProviderId && selectedModel ? (
                      <span className="truncate">
                        {selectedProvider?.display_name} / {selectedModel}
                      </span>
                    ) : (
                      "Select image provider & model"
                    )}
                    <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-[320px] w-[20rem] overflow-y-auto">
                  {imageModelProviders.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      No providers available
                    </div>
                  ) : (
                    imageModelProviders.map((provider) => {
                      const providerValue = getProviderValue(provider);

                      return (
                        <DropdownMenuSub key={provider.provider_id}>
                          <DropdownMenuSubTrigger className="flex items-center gap-2">
                            <span>{provider.display_name}</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="max-h-[280px] overflow-y-auto">
                            {provider.meta_data &&
                              Array.isArray(provider.meta_data.models) &&
                              provider.meta_data.models.map((model: any) => {
                                const modelToDisplay = model.substring(
                                  model.indexOf("/") + 1,
                                );
                                return (
                                  <DropdownMenuItem
                                    key={model}
                                    onClick={() => {
                                      handleProviderModelChange(
                                        providerValue,
                                        model,
                                      );
                                    }}
                                  >
                                    {modelToDisplay}
                                  </DropdownMenuItem>
                                );
                              })}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      );
                    })
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {selectedImageProviderId && selectedModel && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="mb-1 text-sm font-medium">
                Selected Image Provider
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedProvider?.display_name} / {selectedModel}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleSave}
            disabled={!selectedImageProviderId || !selectedModel}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
