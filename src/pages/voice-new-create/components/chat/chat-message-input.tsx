import { useState } from "react";
import clsx from "clsx";

const ACCENT_RING_CLASSES: Record<string, string> = {
  indigo: "focus:ring-indigo-500 focus:border-indigo-500",
};

const ACCENT_BUTTON_CLASSES: Record<string, string> = {
  indigo:
    "text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950",
};

type ChatMessageInputProperties = {
  placeholder?: string;
  onSend?: (message: string) => Promise<unknown>;
  accentColor?: keyof typeof ACCENT_RING_CLASSES;
};

export function ChatMessageInput({
  placeholder = "Type a message",
  onSend,
  accentColor = "indigo",
}: ChatMessageInputProperties) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const ringClasses =
    ACCENT_RING_CLASSES[accentColor] ?? ACCENT_RING_CLASSES.indigo;
  const buttonClasses =
    ACCENT_BUTTON_CLASSES[accentColor] ?? ACCENT_BUTTON_CLASSES.indigo;

  const handleSend = async () => {
    if (!onSend || !message.trim()) {
      return;
    }

    try {
      setIsSending(true);
      await onSend(message.trim());
      setMessage("");
    } catch (error) {
      console.error("Failed to send chat message", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="border-t bg-background/80 pt-3 backdrop-blur">
      <div className="relative flex items-center gap-2">
        <input
          type="text"
          className={clsx(
            "flex-1 rounded-md border bg-background p-2 text-sm placeholder:text-muted-foreground focus:outline-none",
            ringClasses,
          )}
          placeholder={placeholder}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleSend();
            }
          }}
        />
        <button
          type="button"
          disabled={!onSend || !message.trim() || isSending}
          onClick={() => void handleSend()}
          className={clsx(
            "rounded-md px-3 py-2 text-xs font-semibold uppercase transition",
            buttonClasses,
            !onSend || !message.trim() || isSending
              ? "opacity-40"
              : "opacity-100",
          )}
        >
          {isSending ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}
