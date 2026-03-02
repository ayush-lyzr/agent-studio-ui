export interface FileAttachment {
  asset_id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  mime_type: string;
}

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  created_at: Date;
  isStreaming?: boolean;
  isThinking?: boolean;
  attachments?: FileAttachment[];
  artifacts?: Array<{
    id: string;
    name: string;
    description: string;
    format_type:
      | "code"
      | "json"
      | "markdown"
      | "matplotlib"
      | "chart"
      | "text"
      | "plotly";
    timestamp: string;
  }>;
}

export interface ChatSession {
  id: string;
  agentId?: string;
  sessionId: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

export interface Session {
  agent_id?: string;
  session_id: string;
  session_name: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AgentConfig {
  name: string;
  agentId: string;
  baseUrl: string;
  apiKey: string;
  userId: string;
  wsBaseUrl: string;
}

export interface AgentData {
  id: string;
  name: string;
  description: string;
  creator: string;
  user_id: string;
  agent_id: string;
  organization_id: any;
  public: boolean;
  categories: any[];
  created_at: string;
  updated_at: string;
  upvotes: number;
  welcome_message: string;
  tags: {
    industry: string;
    function: string;
    category: string;
  };
}

export interface ChatEvent {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  agentName?: string;
  isAutoDelete?: boolean;
  isStreaming?: boolean;
  isRemoving?: boolean;
}

export interface WebSocketMessage {
  level: string;
  event_type: string;
  message: string;
  feature: string;
  status: string;
  data: object | string | Array<any>;
  function_name: string;
  metadata: object;
  timestamp: string;
  arguments: object;
  response: any;
}

export interface ChatInterfaceProps {
  initialAgentId?: string;
}
