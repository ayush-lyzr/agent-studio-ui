import { TooltipContentProps } from "@radix-ui/react-tooltip";

import { FormLabel } from "../ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { ReactElement } from "react";

const LabelWithTooltip = ({
  children,
  tooltip,
  tooltipExample,
  required = false,
  side,
  align,
  onClick,
}: {
  children: React.ReactNode;
  tooltip: string | ReactElement;
  tooltipExample?: string;
  required?: boolean;
  onClick?: () => void;
} & Partial<TooltipContentProps>) => {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger
          className="flex cursor-help items-center gap-1"
          asChild
          onClick={(e) => {
            e.preventDefault();
            onClick?.();
          }}
        >
          <FormLabel className="mb-1 inline-flex cursor-help items-center underline decoration-muted-foreground/50 decoration-dotted underline-offset-2 hover:decoration-muted-foreground">
            {children} {required && <p className="text-destructive">*</p>}
          </FormLabel>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className="max-w-[250px] whitespace-normal text-xs"
        >
          <div className="leading-relaxed">
            <p>{tooltip}</p>
            {tooltipExample && <p className="mt-2 italic">{tooltipExample}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LabelWithTooltip;
