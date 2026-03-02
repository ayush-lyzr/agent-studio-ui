import { History, MessageSquare, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface ChatSession {
  id: string;
  sessionId: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

interface ChatHistoryProps {
  sessions: ChatSession[];
  onLoadSession: (session: ChatSession) => void;
  onNewChat: () => void;
  onClose: () => void;
}

const ChatHistory = ({
  sessions,
  onLoadSession,
  onNewChat,
  onClose,
}: ChatHistoryProps) => {
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return "Invalid date";
    }

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return dateObj.toLocaleDateString();
  };

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-slate-100 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <History className="h-6 w-6 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Chat History
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full border-0 text-slate-600 hover:bg-slate-200"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Button
          onClick={onNewChat}
          className="w-full rounded-full border-0 bg-slate-600 py-3 font-medium text-white shadow-sm transition-all hover:bg-slate-700 hover:shadow-md"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <div className="py-12 text-center">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 text-slate-600" />
                <p className="mb-1 font-medium text-slate-900">
                  No chat history
                </p>
                <p className="text-sm text-slate-600">
                  Start a conversation to see it here
                </p>
              </div>
            ) : (
              sessions.map((session) => (
                <Card
                  key={session.id}
                  className="animate-fade-in cursor-pointer rounded-2xl border-0 border-l-4 border-l-slate-400 bg-white p-4 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:shadow-md"
                  onClick={() => onLoadSession(session)}
                >
                  <div className="flex items-start space-x-3">
                    <MessageSquare className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-600" />
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-2 truncate text-sm font-medium text-slate-900">
                        {session.title}
                      </h3>
                      <p className="mb-1 text-xs text-slate-600">
                        {session.messages.length} messages
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(session.createdAt)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ChatHistory;
