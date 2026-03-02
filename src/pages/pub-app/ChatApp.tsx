import { useParams } from "react-router-dom";

import ChatInterface from "./ChatInterface";
import { cn } from "@/lib/utils";

interface ChatAppProps {
  className?: string;
}

const ChatApp = ({ className = "" }: ChatAppProps) => {
  const { app_id } = useParams<{ app_id: string }>();

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {app_id && <ChatInterface initialAgentId={app_id} />}
    </div>
  );
};

export default ChatApp;
