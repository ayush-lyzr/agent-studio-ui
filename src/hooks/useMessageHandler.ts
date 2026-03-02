import { useState, useRef } from "react";
import { Message, FileAttachment } from "@/types/chat";
import { toast } from "sonner";
import axios from "axios";
import { validateFileUploadWithMessage } from "@/utils/fileUploadValidation";

export const useMessageHandler = (
  currentAgent: any,
  apiKey: string,
  onSessionUpdate: (messages: Message[], sessionId: string) => void,
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );
  const [uploadedFiles, setUploadedFiles] = useState<FileAttachment[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const separateThinkingContent = (content: string) => {
    const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
    if (thinkMatch) {
      const thinking = thinkMatch[1].trim();
      const actualContent = content
        .replace(/<think>[\s\S]*?<\/think>/, "")
        .trim();
      return { thinking, content: actualContent };
    }
    return { thinking: undefined, content };
  };

  const handleFileUpload = async (files: FileList) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    const validFiles = Array.from(files).filter((file) =>
      allowedTypes.includes(file.type),
    );

    if (validFiles.length === 0) {
      toast.error("Invalid file type", {
        description: "Please upload only PDF, DOCX, PPTX, Excel, or image files.",
      });
      return;
    }

    const formData = new FormData();
    validFiles.forEach((file) => {
      formData.append("files", file);
    });

    setIsUploading(true);

    try {
      const response = await axios.post(
        `${currentAgent.baseUrl}/v3/assets/upload`,
        formData,
        {
          headers: {
            "x-api-key": apiKey,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const successfulUploads = response.data.results.filter(
        (result: any) => result.success,
      );
      const failedUploads = response.data.results.filter(
        (result: any) => !result.success,
      );

      if (failedUploads.length > 0) {
        console.error("Some uploads failed:", failedUploads);
        const failedFileNames = failedUploads
          .map((result: any) => result.file_name)
          .join(", ");
        toast.error("Upload failed", {
          description: `Failed to upload: ${failedFileNames}`,
        });
      }

      if (successfulUploads.length > 0) {
        const newAttachments: FileAttachment[] = successfulUploads.map(
          (result: any) => ({
            asset_id: result.asset_id,
            name: result.file_name,
            type: result.type,
            size: result.file_size,
            url: result.url,
            mime_type: result.mime_type,
          }),
        );

        setUploadedFiles((prev) => [...prev, ...newAttachments]);
      }
    } catch (error) {
      console.error("File upload failed:", error);
      toast.error("Upload failed", {
        description: "File upload failed. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Stop inference: call stop endpoint, set isLoading to false, clear thinking
  const stopInference = async (sessionId: string, apiKey: string) => {
    if (!sessionId || !apiKey) return;
    try {
      await fetch(
        `${currentAgent.baseUrl}/v3/inference/session/${sessionId}/stop`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "x-api-key": apiKey,
          },
        },
      );
    } catch (error) {
      console.error("Failed to stop inference:", error);
    } finally {
      setIsLoading(false);
      // Clear thinking state on last AI message
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const lastIdx = prev.length - 1;
        const last = prev[lastIdx];
        if (last.role === "assistant" && last.isThinking) {
          return [...prev.slice(0, lastIdx), { ...last, isThinking: false }];
        }
        return prev;
      });
    }
  };

  const sendMessage = async (sessionId: string) => {
    if ((!inputValue.trim() && uploadedFiles.length === 0) || isLoading) return;

    if (!validateFileUploadWithMessage(uploadedFiles.length > 0, inputValue)) {
      return;
    }

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      content: inputValue,
      role: "user",
      created_at: new Date(),
      attachments: uploadedFiles.length > 0 ? uploadedFiles : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = inputValue;
    setInputValue("");
    setUploadedFiles([]);
    setIsLoading(true);

    const aiMessageId = Math.random().toString(36).substring(7);
    const aiMessage: Message = {
      id: aiMessageId,
      content: "",
      role: "assistant",
      created_at: new Date(),
      isStreaming: false,
      isThinking: true,
    };

    setMessages((prev) => [...prev, aiMessage]);
    setStreamingMessageId(aiMessageId);

    try {
      const response = await fetch(
        `${currentAgent.baseUrl}/v3/inference/stream/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            user_id: currentAgent.userId,
            agent_id: currentAgent.agentId,
            session_id: sessionId,
            message: messageToSend,
            assets: userMessage.attachments?.map((att) => att.asset_id) || [],
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Stream request failed with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      setStreamingMessageId(null);

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              return;
            }

            if (data.startsWith("[ERROR]")) {
              console.error(data);
              return;
            }

            const decodedData = data
              .replace(/\\n/g, "\n")
              .replace(/\\"/g, '"')
              .replace(/\\'/g, "'")
              .replace(/\\&/g, "&")
              .replace(/\\r/g, "\r")
              .replace(/\\\\/g, "\\")
              .replace(/\\t/g, "\t")
              .replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&amp;/g, "&")
              .replace(/\\u([0-9a-fA-F]{4})/g, (_, p1) =>
                String.fromCharCode(parseInt(p1, 16)),
              );

            if (!decodedData) continue;

            buffer += decodedData;

            const { thinking, content } = separateThinkingContent(buffer);

            setMessages((prevMessages) => {
              const lastMessage = {
                ...prevMessages[prevMessages.length - 1],
              };

              lastMessage.content = content;
              lastMessage.isThinking = Boolean(thinking);
              return [...prevMessages.slice(0, -1), lastMessage];
            });
          }
        }
      }

      const finalMessages = [
        ...messages,
        userMessage,
        {
          ...aiMessage,
          content: buffer,
          isStreaming: false,
          isThinking: false,
        },
      ];
      onSessionUpdate(finalMessages, sessionId);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== aiMessageId));
      setStreamingMessageId(null);

      toast.error("Error", {
        description: "Failed to send message. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    setMessages,
    inputValue,
    setInputValue,
    isLoading,
    streamingMessageId,
    messagesEndRef,
    sendMessage,
    uploadedFiles,
    isUploading,
    fileInputRef,
    handleFileUpload,
    removeFile,
    stopInference,
  };
};
