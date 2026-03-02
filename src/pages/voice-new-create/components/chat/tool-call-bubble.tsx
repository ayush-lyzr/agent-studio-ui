import { cn } from "@/lib/utils";
import { Zap, Check, XCircle } from "lucide-react";

type ToolCallBubbleProperties = {
    type: "function_call" | "function_call_output";
    toolName?: string;
    isError?: boolean;
    onClick?: () => void;
};

export function ToolCallBubble({ type, toolName, isError, onClick }: ToolCallBubbleProperties) {
    const isFunctionCall = type === "function_call";

    return (
        <div className="flex justify-center">
            <button
                type="button"
                className={cn(
                    "flex items-center gap-2 rounded-full border border-border/50 bg-muted/30 px-4 py-1.5",
                    "text-xs text-muted-foreground transition-colors",
                    onClick && "cursor-pointer hover:border-foreground/20",
                )}
                onClick={onClick}
            >
                {isFunctionCall ? (
                    <>
                        <Zap className="h-3 w-3" />
                        <span className="font-mono">{toolName ?? "tool"}</span>
                    </>
                ) : (
                    <>
                        {isError ? (
                            <XCircle className="h-3 w-3 text-destructive" />
                        ) : (
                            <Check className="h-3 w-3" />
                        )}
                        <span className="font-mono">Result</span>
                    </>
                )}
            </button>
        </div>
    );
}
