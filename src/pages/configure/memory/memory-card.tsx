import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { CheckCircle } from "lucide-react";
import { MemorySetupDialog } from "./memory-setup-dialog";
import type { IMemoryCardProps } from "./types";
import {
  MEMORY_PROVIDER_TAGS,
  READY_TO_USE_PROVIDERS,
  DEFAULT_PROVIDERS,
} from "./types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const memoryProviderLogos: Record<string, { light: string; dark?: string }> = {
  "aws-agentcore": { light: "/provider-logos/aws-bedrock.png" },
  lyzr: { light: "/images/Lyzr-Logo.svg" },
  cognis: {
    light: "/images/cognis-logomark-dark.png",
    dark: "/images/cognis-logomark-light.png",
  },
  mem0: { light: "/memory-provider/mem0.png" },
  default: { light: "/placeholder-avatar.png" },
};

const getMemoryProviderLogo = (
  providerId: string,
): { light: string; dark: string | null } => {
  const entry = memoryProviderLogos[providerId] || memoryProviderLogos.default;
  return {
    light: entry.light,
    dark: entry.dark ?? null,
  };
};

export const MemoryCard: React.FC<IMemoryCardProps> = ({ provider }) => {
  const isLyzr =
    provider.provider_id === "lyzr" || provider.provider_id === "cognis";
  const features = provider.meta_data?.features || ["Memory Storage"];
  const { light: lightLogo, dark: darkLogo } = getMemoryProviderLogo(
    provider.provider_id,
  );
  const alt = provider.form?.title || "Memory Provider Logo";

  return (
    <Card className="h-[200px]">
      <CardContent className="flex h-full flex-col p-4">
        <div className="flex min-h-[3rem] items-center gap-3">
          <LazyImage
            src={lightLogo}
            alt={alt}
            width={30}
            height={30}
            className={cn(
              "h-[30px] w-[30px] shrink-0 object-contain",
              darkLogo && "dark:hidden",
            )}
          />
          {darkLogo && (
            <LazyImage
              src={darkLogo}
              alt={alt}
              width={30}
              height={30}
              className="hidden h-[30px] w-[30px] shrink-0 object-contain dark:block"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold leading-tight">
                {provider.form?.title}
              </p>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {DEFAULT_PROVIDERS.has(provider.provider_id) ? (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircle className="size-3.5" />
                  Default
                </span>
              ) : (
                MEMORY_PROVIDER_TAGS[provider.provider_id] && (
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {MEMORY_PROVIDER_TAGS[provider.provider_id]}
                  </Badge>
                )
              )}
              {READY_TO_USE_PROVIDERS.has(provider.provider_id) && (
                <Badge variant="secondary" className="shrink-0 text-xs">
                  <CheckCircle className="mr-1 size-3" /> Ready to use
                </Badge>
              )}
            </div>
          </div>
          {!isLyzr && (
            <div className="shrink-0">
              <MemorySetupDialog provider={provider} />
            </div>
          )}
        </div>
        <CardDescription className="mt-2 line-clamp-2 text-xs">
          {provider.form?.description}
        </CardDescription>

        {features && features?.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1 pt-2">
            {features?.slice(0, 1).map((feature) => (
              <Badge key={feature} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
            {features?.length > 1 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="secondary" className="text-xs">
                      +{features?.length - 1}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex flex-col gap-1">
                      {features
                        ?.slice(1)
                        .map((feature, index) => (
                          <span key={index}>{feature}</span>
                        ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
        {/* <div className="mt-auto flex flex-wrap gap-1 pt-2">
          {features.slice(0, 2).map((feature) => (
            <Badge key={feature} variant="secondary" className="text-xxs">
              {feature}
            </Badge>
          ))}
          {features.length > 2 && (
            <Badge variant="secondary" className="text-xxs">
              +{features.length - 2}
            </Badge>
          )}
        </div> */}
      </CardContent>
    </Card>
  );
};
