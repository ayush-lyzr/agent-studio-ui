import { Card, CardContent, CardDescription } from "@/components/ui/card";
import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LazyImage } from "@/components/ui/lazy-image";
import { getProviderModelLogo, type ProviderId } from "@/assets/images";
import { SetupDialog } from "./setup-dialog";
import { IModelCard } from "./types";
import { useAuthorization } from "@/hooks/use-authorization";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";

export const ModelCard: React.FC<IModelCard> = ({
  className = "",
  allowSetup = true,
  disabled = false,
  onUpgrade,
  upgradeDisable = false,
  ...props
}) => {
  const formatModelName = (model: string) => {
    const parts = model.split("/");
    return parts.length > 1
      ? parts.slice(1).join("/").toLowerCase()
      : model.toLowerCase();
  };

  const models: string[] =
    (typeof props.meta_data?.models === "object"
      ? Object.values(props.meta_data?.models ?? {}).flatMap((p) => p)
      : props.meta_data?.models) ?? [];

  const { isFreeStarterPro } = useAuthorization();
  const isBlockedByPlan = isFreeStarterPro;
  const isAwsBedrock = props?.provider_id === "aws-bedrock";

  const handleCardClick = () => {
    if (!upgradeDisable) {
      return;
    }
    if (props?.form) {
      onUpgrade(props.form)();
    }
  };

  return (
    <Card
      className={cn(
        className,
        disabled && "opacity-60",
        "h-[180px]",
        upgradeDisable && "cursor-pointer",
      )}
      onClick={handleCardClick}
    >
      <CardContent className="flex h-full flex-col p-4">
        <div className="flex items-center justify-between">
          <div className="flex min-h-[3rem] items-center gap-4">
            <LazyImage
              src={getProviderModelLogo(props?.provider_id as ProviderId)}
              alt={props.form?.title || "Provider Logo"}
              width={30}
              height={30}
              className="h-[30px] w-[30px] object-contain"
            />
            <div className="space-y-1">
              <p className="font-semibold">{props.form?.title}</p>
              {disabled && !upgradeDisable && (
                <span className="rounded bg-yellow-100 px-2 py-0.5 text-sm font-medium text-yellow-600">
                  Coming Soon
                </span>
              )}
            </div>
          </div>
          {allowSetup &&
            !disabled &&
            isBlockedByPlan &&
            !isAwsBedrock &&
            props?.form &&
            !upgradeDisable && (
              <Button variant="outline" onClick={onUpgrade(props?.form)}>
                <Settings2 className="mr-1 size-4" />
                Setup
              </Button>
            )}
          {allowSetup && !disabled && (!isBlockedByPlan || isAwsBedrock) && (
            <SetupDialog form={props.form} provider_id={props.provider_id} />
          )}
        </div>
        <CardDescription className="mt-2">
          {props.form?.description}
        </CardDescription>

        {models && models?.length > 0 && !upgradeDisable && (
          <div className="mt-auto flex flex-wrap gap-1 pt-2">
            {models?.slice(0, 1).map((model) => (
              <Badge key={model} variant="secondary" className="text-xs">
                {formatModelName(model)}
              </Badge>
            ))}
            {models?.length > 1 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="secondary" className="text-xs">
                      +{models?.length - 1}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex flex-col gap-1">
                      {models
                        ?.slice(1)
                        .map((model, index) => (
                          <span key={index}>{formatModelName(model)}</span>
                        ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
        {upgradeDisable && (
          <Badge variant="premium" className="mt-auto flex w-fit flex-wrap">
            Upgrade
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};
