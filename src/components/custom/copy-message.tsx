import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CopyMessageProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  content: string;
  withLabel?: boolean;
  withIcon?: boolean;
  iconSize?: number;
}

export const CopyMessage: React.FC<CopyMessageProps> = ({
  content,
  withLabel = true,
  withIcon = true,
  iconSize = 3,
  className,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <button
      className={cn("inline-flex items-center gap-1 p-1 text-xs", className)}
      onClick={handleCopy}
      type="button"
    >
      {withIcon && (
        <>
          {copied ? (
            <Check
              className="text-green-500"
              size={iconSize * 4}
              strokeWidth={4}
            />
          ) : (
            <Copy size={iconSize * 4} />
          )}
        </>
      )}
      {withLabel && <p>{copied ? "Copied" : "Copy"}</p>}
    </button>
  );
};
