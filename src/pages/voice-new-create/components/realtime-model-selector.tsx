import { useMemo } from "react";
import { ChevronDown } from "lucide-react";

import { getProviderModelLogo, type ProviderId } from "@/assets/images";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { RealtimeProviderOptions } from "@/lib/livekit/types";

function buildValue(providerId: string, modelId: string) {
  return `${providerId}/${modelId}`;
}

function parseProviderAndModelId(value: string): { providerId: string; modelId: string } | undefined {
  const normalized = (value ?? "").trim();
  if (!normalized) return;
  if (!normalized.includes("/")) return;

  const providerId = normalized.split("/", 1)[0]!;
  const modelId = normalized.slice(providerId.length + 1);
  if (!providerId || !modelId) return;
  return { providerId, modelId };
}

function getProviderLogoClassName(providerId?: string) {
  return cn(
    "h-5 w-5 object-contain",
    // The Gemini (google) asset has more internal padding than other provider logos,
    // which makes it read smaller at 20x20. Slightly scale it up for parity.
    providerId === "google" && "scale-[1.55] origin-center",
  );
}

export function RealtimeModelSelector({
  value,
  onValueChange,
  providers,
  disabled = false,
  placeholder = "Select realtime model...",
}: {
  value?: string;
  onValueChange: (value: string) => void;
  providers: RealtimeProviderOptions[];
  disabled?: boolean;
  placeholder?: string;
}) {
  const selected = useMemo(() => {
    const normalized = (value ?? "").trim();
    if (!normalized) return;

    if (!normalized.includes("/")) {
      // Backward compat: if a stored value is a bare OpenAI model id, treat as openai/<id>.
      const openai = providers.find((p) => p.providerId === "openai");
      const model = openai?.models.find((m) => m.id === normalized);
      if (openai && model) return { provider: openai, model };
      return;
    }

    // Important: some model ids can contain slashes (e.g. Ultravox `fixie-ai/ultravox`).
    // Always split on the FIRST slash only.
    const parsed = parseProviderAndModelId(normalized);
    if (!parsed) return;

    const provider = providers.find((p) => p.providerId === parsed.providerId);
    const model = provider?.models.find((m) => m.id === parsed.modelId);
    return provider && model ? { provider, model } : undefined;
  }, [providers, value]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            disabled && "cursor-not-allowed opacity-50",
          )}
          disabled={disabled}
        >
          {selected ? (
            <div className="flex items-center gap-2 truncate">
              <img
                src={getProviderModelLogo(
                  selected?.provider.providerId as ProviderId | undefined,
                )}
                alt="Provider logo"
                className={getProviderLogoClassName(selected.provider.providerId)}
              />
              <span className="truncate">{selected.provider.displayName}</span>
              <span className="text-muted-foreground">/</span>
              <span className="truncate">{selected.model.name}</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="max-h-[300px] w-[22rem] overflow-y-auto">
        {providers.map((provider) => {
          const providerModels = provider.models ?? [];
          const isProviderDisabled = disabled || providerModels.length === 0;
          const providerLabel = provider.warning
            ? `${provider.displayName} — ${provider.warning}`
            : provider.displayName;

          return (
            <DropdownMenuSub key={provider.providerId}>
              <DropdownMenuSubTrigger
                disabled={isProviderDisabled}
                className="flex items-center gap-2"
              >
                <img
                  src={getProviderModelLogo(provider.providerId as ProviderId)}
                  alt={provider.displayName}
                  className={getProviderLogoClassName(provider.providerId)}
                />
                <span className="truncate">{providerLabel}</span>
              </DropdownMenuSubTrigger>

              <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto">
                {providerModels.length > 0 ? (
                  providerModels.map((model) => {
                    const itemValue = buildValue(provider.providerId, model.id);
                    return (
                      <DropdownMenuItem
                        key={itemValue}
                        onClick={() => {
                          onValueChange(itemValue);
                        }}
                      >
                        {model.name}
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
  );
}
