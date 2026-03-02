import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ILoader extends React.HTMLAttributes<HTMLDivElement> {
  loadingText?: string;
}

export default function Loader({ className, loadingText = "" }: ILoader) {
  return (
    <div
      className={cn(
        "flex h-svh w-full flex-col items-center justify-center",
        className,
      )}
    >
      <Loader2 className="animate-spin" size={32} />
      {loadingText && <p className="text-muted-foreground">{loadingText}</p>}
      <span className="sr-only">loading</span>
    </div>
  );
}
