import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { GuardrailsSetupDialog } from "./guardrails-setup-dialog";
import type { IGuardrailCardProps } from "./types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const guardrailProviderLogos: Record<string, string> = {
  "bedrock-guardrails": "/provider-logos/aws-bedrock.png",
  default: "/placeholder-avatar.png",
};

const getGuardrailProviderLogo = (providerId: string): string => {
  return guardrailProviderLogos[providerId] || guardrailProviderLogos.default;
};

export const GuardrailCard: React.FC<IGuardrailCardProps> = ({ provider }) => {
  const features = provider.meta_data?.features || ["Guardrails"];

  return (
    <Card className="h-[180px]">
      <CardContent className="flex h-full flex-col p-4">
        <div className="flex items-center justify-between">
          <div className="flex min-h-[3rem] items-center gap-4">
            <LazyImage
              src={getGuardrailProviderLogo(provider.provider_id)}
              alt={provider.form?.title || "Guardrail Provider Logo"}
              width={30}
              height={30}
              className="h-[30px] w-[30px] object-contain"
            />
            <div className="space-y-1">
              <p className="text-sm font-semibold">{provider.form?.title}</p>
            </div>
          </div>
          <GuardrailsSetupDialog provider={provider} />
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
      </CardContent>
    </Card>
  );
};
