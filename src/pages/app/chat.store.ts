import { AgentData, Session, Message } from "@/types/chat";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface IChatStore {
  agent: Partial<AgentData>;
  sessions: Session[];
  currentSessionId: string;
  setAgent: (agent: Partial<AgentData>) => void;
  setCurrentSessionId: (currentSessionId: string) => void;
  setSesions: (sessions: Session[]) => void;
  updateSession: (
    sessionId: string,
    agentId: string,
    messages: Message[],
  ) => void;
}

export const useChatStore = create<IChatStore>()(
  persist(
    (set) => ({
      sessions: [],
      agent: {},
      currentSessionId: "",
      setAgent: (agent) => set({ agent }),
      setSesions: (sessions: Session[]) =>
        set(() => {
          if (sessions.length > 0) {
            sessions?.sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            );
          }

          return { sessions };
        }),
      setCurrentSessionId: (currentSessionId: string) =>
        set({ currentSessionId }),
      updateSession: (
        sessionId: string,
        agentId: string,
        messages: Message[],
      ) =>
        set((state) => {
          const sessionTitle =
            messages[0]?.content.substring(0, 30) || "New Chat";
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                id: sessionId,
                agentId,
                sessionId,
                title: sessionTitle,
                messages,
                createdAt: new Date(),
              },
            },
          };
        }),
    }),
    {
      name: "studio-app-sessions", // name of the item in the storage (must be unique)
    },
  ),
);
