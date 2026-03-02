import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OptionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string[];
  onClick: () => void;
  className?: string;
  selected?: boolean;
}

export function OptionCard({
  icon,
  title,
  description,
  onClick,
  className,
  selected = false,
}: OptionCardProps) {
  return (
    <Card
      className={cn(
        "group relative cursor-pointer transition-all duration-200 hover:border-primary/20 hover:shadow-md",
        selected && "border-primary bg-primary/5",
        className,
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className={cn("flex items-start gap-2")}>
          <div
            className={cn(
              "flex flex-shrink-0 items-center justify-center rounded-md bg-muted p-1 transition-colors group-hover:bg-primary/10",
              selected && "bg-primary/20",
            )}
          >
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center justify-between">
              <h3
                className={cn(
                  "text-md font-semibold text-foreground transition-colors group-hover:text-primary",
                  selected && "text-primary",
                )}
              >
                {title}
              </h3>
            </div>
            <div
              className={cn(
                "gap-1 text-sm leading-relaxed text-muted-foreground",
              )}
            >
              {description.map((item, index) => (
                <p key={index}>{item}</p>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
