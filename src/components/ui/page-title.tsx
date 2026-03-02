import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { ReactNode } from "react";

interface PageTitleProps {
  title: string;
  description?: string | ReactNode;
  className?: string;
  beta?: boolean;
}

export function PageTitle({
  title,
  description,
  className,
  beta,
}: PageTitleProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {beta && (
          <Badge variant="secondary" className="bg-secondary/50">
            Beta
          </Badge>
        )}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
