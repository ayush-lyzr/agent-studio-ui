import { useState, useEffect } from "react";
import { ChatSession, Message } from "@/types/chat";

export const useChatSession = () => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState("");

  useEffect(() => {
    const savedSessions = localStorage.getItem("chatSessions");
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions);
        const sessionsWithDates = parsedSessions.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setChatSessions(sessionsWithDates);
      } catch (error) {
        console.error("Error parsing saved sessions:", error);
        setChatSessions([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("chatSessions", JSON.stringify(chatSessions));
  }, [chatSessions]);

  const updateCurrentSession = (
    updatedMessages: Message[],
    sessionId: string,
  ) => {
    setChatSessions((prev) => {
      const existingSessionIndex = prev.findIndex(
        (session) => session.sessionId === sessionId,
      );
      const sessionTitle =
        updatedMessages[0]?.content.substring(0, 30) + "..." || "New Chat";

      const sessionData = {
        id: sessionId,
        sessionId: sessionId,
        title: sessionTitle,
        messages: updatedMessages,
        createdAt: new Date(),
      };

      if (existingSessionIndex >= 0) {
        const newSessions = [...prev];
        newSessions[existingSessionIndex] = sessionData;
        return newSessions;
      } else {
        return [sessionData, ...prev];
      }
    });
  };

  const generateSessionId = (agentId: string) => {
    const randomSuffix = Math.random().toString(36).substring(2, 12);
    return `${agentId}-${randomSuffix}`;
  };

  return {
    chatSessions,
    currentSessionId,
    setCurrentSessionId,
    updateCurrentSession,
    generateSessionId,
  };
};
