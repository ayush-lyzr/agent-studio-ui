import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ConfigChip({
  label,
  value,
}: {
  label: string;
  value: string | undefined;
}) {
  const safeValue = value || "—";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="secondary"
          className="max-w-full cursor-default gap-1 truncate"
        >
          <span className="text-muted-foreground">{label}</span>
          <span className="truncate">{safeValue}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{safeValue}</TooltipContent>
    </Tooltip>
  );
}
