import { Paperclip, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dispatch, SetStateAction, useRef } from "react";
import { cn } from "@/lib/utils";
import { FileAttachment } from "@/types/chat";
import { useChatService } from "@/pages/app/chat.api";
import useStore from "@/lib/store";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { validateFileUploadWithMessage, shouldDisableSendButton } from "@/utils/fileUploadValidation";

type IChatInput = {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  attachments: FileAttachment[];
  setAttachments: Dispatch<SetStateAction<FileAttachment[]>>;
  className?: string;
  onSubmit: () => void;
  loading?: boolean;
};

export const ChatInput: React.FC<IChatInput> = ({
  query = "",
  setQuery,
  attachments = [],
  setAttachments,
  className = "",
  onSubmit,
  loading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiKey = useStore((state) => state.api_key);
  const { uploadFiles, isUploadingFiles, removeFile } = useChatService({
    apiKey,
    setAttachments,
    session_id: "",
  });

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (validateFileUploadWithMessage(attachments.length > 0, query)) {
        onSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (validateFileUploadWithMessage(attachments.length > 0, query)) {
      onSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cn(
        "w-full rounded-lg border border-border bg-secondary p-2 shadow-sm active:shadow-md",
        "duration-1000 animate-in slide-in-from-bottom-2",
        className,
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.jpg,.jpeg,.png,.pptx,.xlsx,.xls"
        onChange={(e) =>
          e.target.files && uploadFiles(e.target.files as FileList)
        }
        className="hidden"
      />
      {attachments.length > 0 && (
        <div className="flex max-h-24 flex-row flex-wrap items-start justify-start gap-2 overflow-y-auto">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex w-fit flex-shrink-0 items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs backdrop-blur-sm"
            >
              <Paperclip className="h-3 w-3 flex-shrink-0" />
              <div className="flex min-w-0 flex-col">
                <span className="max-w-[80px] truncate font-medium">
                  {file.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(1)}MB
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-1 flex-shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-2 w-2" />
              </button>
            </div>
          ))}
        </div>
      )}
      <Textarea
        rows={1}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Type your query here ..."
        className="resize-none border-none shadow-none focus-visible:ring-0"
      />
      <div className="flex items-center justify-between">
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="ghost"
              size="sm"
              disabled={loading || isUploadingFiles}
              loading={isUploadingFiles}
              onClick={() => fileInputRef.current?.click()}
              className="text-muted-foreground"
            >
              <Paperclip className="mr-1 size-4" />
              {isUploadingFiles ? "Uploading ..." : "Upload"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Supports .pdf, .docx, .pptx, .jpg, .jpeg, .png formats
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              disabled={shouldDisableSendButton(attachments.length > 0, query, loading)}
              loading={loading}
              onClick={handleSubmit}
            >
              <Send className="size-3" />
            </Button>
          </TooltipTrigger>
          {attachments.length > 0 && !query.trim() && (
            <TooltipContent>
              <p>Please enter a message along with the file</p>
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </motion.div>
  );
};
