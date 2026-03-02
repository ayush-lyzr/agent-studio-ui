import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import axiosLib from "axios";
import { Dispatch, RefObject, SetStateAction, useState } from "react";
import { toast } from "sonner";
import { validateFileUploadWithMessage } from "@/utils/fileUploadValidation";

import axios from "@/lib/axios";
import { BASE_URL } from "@/lib/constants";
import { AgentData, FileAttachment, Message, Session } from "@/types/chat";
import { useChatStore } from "./chat.store";
import { useManageAdminStore } from "../manage-admin/manage-admin.store";
import { useCredits } from "@/hooks/use-credits";

export const useChatService = ({
  apiKey,
  session_id,
  setAttachments,
  setPendingArtifacts,
  messagesEndRef,
}: {
  apiKey: string;
  session_id: string;
  setAttachments?: Dispatch<SetStateAction<FileAttachment[]>>;
  setPendingArtifacts?: Dispatch<SetStateAction<Map<string, any>>>;
  messagesEndRef?: RefObject<HTMLDivElement>;
}) => {
  const current_user = useManageAdminStore((state) => state.current_user);
  const user_id = current_user?.id;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );

  const removeFile = (index: number) => {
    setAttachments?.((prev) => prev.filter((_, i) => i !== index));
  };

  const { handleCredits } = useCredits();
  const { agent, setSesions } = useChatStore((state) => state);

  const { mutateAsync: uploadFiles, isPending: isUploadingFiles } = useMutation(
    {
      mutationKey: ["uploadFile", apiKey],
      mutationFn: (files: FileList) => {
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
          toast.warning("Invalid file type", {
            description: "Please upload only PDF, DOCX, PPTX, Excel, or image files.",
          });
          return Promise.reject(
            "Please upload only PDF, DOCX, PPTX, Excel, or image files.",
          );
        }
        const formData = new FormData();
        validFiles.forEach((file) => {
          formData.append("files", file);
        });

        return axios.post(`/v3/assets/upload`, formData, {
          baseURL: BASE_URL,
          headers: {
            "x-api-key": apiKey,
            "Content-Type": "multipart/form-data",
          },
        });
      },
      onSuccess: (response: AxiosResponse) => {
        const successfulUploads = response.data.results?.filter(
          (result: any) => result.success,
        );
        const failedUploads = response.data.results?.filter(
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

          setAttachments?.((prev: FileAttachment[]) => [
            ...prev,
            ...newAttachments,
          ]);
        }
      },
    },
  );

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

  const sendMessage = async ({
    query,
    setQuery,
    sessionId,
    attachments,
    agent,
  }: {
    query: string;
    setQuery: Dispatch<SetStateAction<string>>;
    sessionId: string;
    attachments: FileAttachment[];
    agent: Partial<AgentData>;
  }) => {
    if ((!query.trim() && attachments.length === 0) || isLoading) return;

    if (!validateFileUploadWithMessage(attachments.length > 0, query)) {
      return;
    }

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      content: query,
      role: "user",
      created_at: new Date(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = query;
    setQuery("");
    setAttachments?.([]);
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
      const response = await fetch(`${BASE_URL}/v3/inference/stream/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          user_id: agent?.user_id,
          agent_id: agent?.agent_id,
          session_id: sessionId,
          message: messageToSend,
          assets: userMessage.attachments?.map((att) => att.asset_id) || [],
        }),
      });

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
              // const finalMessages = [
              //   ...messages,
              //   userMessage,
              //   {
              //     ...aiMessage,
              //     content: buffer,
              //     isStreaming: false,
              //     isThinking: false,
              //   },
              // ];
              setIsLoading(false);
              setTimeout(handleCredits, 3 * 1000);
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
                ...prevMessages[prevMessages?.length - 1],
              };

              lastMessage.content = content;
              lastMessage.isThinking = Boolean(thinking);
              return [...prevMessages.slice(0, -1), lastMessage];
            });
            messagesEndRef?.current?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "start",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
      setStreamingMessageId(null);

      toast.error("Error", {
        description: "Failed to send message. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const { mutateAsync: createSession, isPending: isCreatingSession } =
    useMutation({
      mutationKey: ["createSession"],
      mutationFn: (payload: {
        agent_id: string;
        metadata: Record<string, any>;
      }) =>
        axios.post(
          `/v1/sessions/${payload?.agent_id}`,
          {
            user_id,
            ...payload,
          },
          {
            baseURL: BASE_URL,
            headers: { "x-api-key": apiKey },
          },
        ),
    });

  const {
    mutateAsync: updateSessionDetails,
    isPending: isUpdatingSessionDetails,
  } = useMutation({
    mutationKey: ["updateSessionDetails", session_id],
    mutationFn: (payload: {
      agent_id: string;
      session_id: string;
      metadata: Record<string, any>;
    }) =>
      axios.put(
        `/v1/sessions/${payload?.session_id}`,
        {
          user_id,
          ...payload,
        },
        {
          baseURL: BASE_URL,
          headers: { "x-api-key": apiKey },
        },
      ),
  });

  const {
    mutateAsync: deleteSessionDetails,
    isPending: isDeletingSessionDetails,
  } = useMutation({
    mutationKey: ["deleteSessionDetails"],
    mutationFn: (payload: { session_id: string }) =>
      axios.delete(`/v1/sessions/${payload?.session_id}`, {
        baseURL: BASE_URL,
        headers: { "x-api-key": apiKey },
      }),
  });

  const { refetch: getAgentSessions, isFetching: isFetchingSessions } =
    useQuery({
      queryKey: ["getAgentSessions", agent?.id],
      queryFn: () =>
        axios.get(`/v1/agent/${agent.agent_id}/published/sessions`, {
          baseURL: BASE_URL,
          headers: { "x-api-key": apiKey },
        }),
      select: (res: AxiosResponse) => res.data,
      enabled: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    });

  const { refetch: getSessionHistory, isFetching: isFetchingSessionHistory } =
    useQuery({
      queryKey: ["getSessionHistory", agent.id, session_id],
      queryFn: async () => {
        try {
          const res = await axiosLib.get(
            `/v1/sessions/${session_id}/${agent?.agent_id}/history`,
            {
              baseURL: BASE_URL,
              headers: { "x-api-key": apiKey },
            },
          );
          return res.data;
        } catch (error) {
          console.log("Error in fetching messages => ", error);
          setMessages([]);
        }
      },
      // select: (res: AxiosResponse) => res.data,
      enabled: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    });

  // TODO: This must be converted to a infinite scroll paginated API
  const {
    refetch: getSessionArtifacts,
    isFetching: isFetchingSessionArtifacts,
  } = useQuery({
    queryKey: ["getSessionArtifacts", session_id],
    queryFn: () =>
      axiosLib.get(`/v3/artifacts/`, {
        baseURL: BASE_URL,
        headers: { "x-api-key": apiKey },
        params: { page: 1, limit: 100, user_id: agent?.user_id, session_id },
      }),
    select: (res: AxiosResponse) => res.data?.artifacts,
    enabled: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const refetchSessions = async () => {
    try {
      const sessionsRes = await getAgentSessions();
      const sessions = sessionsRes.data;
      const filteredSessions = sessions?.filter(
        (session: Session) => session.metadata.published,
      );
      setSesions(filteredSessions);
    } catch (error) {
      console.error("Error fetching sessions => ", error);
    }
  };

  const refetchSessionHistory = async () => {
    try {
      const [historyRes, artifactsRes] = await Promise.all([
        getSessionHistory(),
        getSessionArtifacts(),
      ]);

      setMessages(historyRes.data);
      messagesEndRef?.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
      const artifactsMap = new Map();
      artifactsRes.data?.forEach((artifact: any) => {
        artifactsMap.set(artifact?.artifact_id, {
          ...artifact,
          timestamp: artifact?.created_at,
        });
      });
      setPendingArtifacts?.(artifactsMap);
    } catch (error: any) {
      setMessages([]);
      console.error("Error fetching sessions => ", error?.response?.data);
    }
  };

  return {
    uploadFiles,
    isUploadingFiles,
    removeFile,
    streamingMessageId,
    sendMessage,
    isLoading,
    messages,
    setMessages,
    createSession,
    isCreatingSession,
    updateSessionDetails,
    isUpdatingSessionDetails,
    deleteSessionDetails,
    isDeletingSessionDetails,
    getAgentSessions,
    isFetchingSessions,
    getSessionHistory,
    isFetchingSessionHistory,
    refetchSessions,
    getSessionArtifacts,
    isFetchingSessionArtifacts,
    refetchSessionHistory,
  };
};
