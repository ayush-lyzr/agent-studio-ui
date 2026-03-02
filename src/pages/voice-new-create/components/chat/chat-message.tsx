import { cn } from "@/lib/utils";

type ChatMessageProperties = {
    name: string;
    message: string;
    isSelf: boolean;
    hideName?: boolean;
    accentColor?: "indigo";
    interrupted?: boolean;
    onClick?: () => void;
};

export function ChatMessage({
    name,
    message,
    isSelf,
    hideName = false,
    interrupted = false,
    onClick,
}: ChatMessageProperties) {
    return (
        <div
            className={cn(
                "max-w-[80%] px-4 py-2.5 transition-colors",
                isSelf
                    ? "ml-auto rounded-2xl rounded-tr-md border border-border/60 bg-foreground/5"
                    : "mr-auto rounded-2xl rounded-tl-md bg-muted/80",
                hideName ? "mt-1" : "mt-0",
                onClick && "cursor-pointer hover:border-foreground/20",
            )}
            onClick={onClick}
        >
            {!hideName && (
                <div className="mb-1 text-[11px] font-medium text-muted-foreground">
                    {name}
                </div>
            )}
            <div className="whitespace-pre-line text-sm leading-relaxed">{message}</div>
            {interrupted && (
                <div className="mt-1 text-xs text-purple-400">interrupted</div>
            )}
        </div>
    );
}
