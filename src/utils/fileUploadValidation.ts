import { toast } from "sonner";

export const validateFileUploadWithMessage = (
  hasFiles: boolean,
  messageText: string
): boolean => {
  if (hasFiles && !messageText.trim()) {
    toast.warning("Message required", {
      description: "Please enter a message along with the file to submit.",
    });
    return false;
  }
  return true;
};

export const shouldDisableSendButton = (
  hasFiles: boolean,
  messageText: string,
  isLoading: boolean = false
): boolean => {
  return isLoading || (!hasFiles && !messageText.trim());
};
