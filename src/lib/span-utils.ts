import {
  MessageSquare,
  Bot,
  Cpu,
  Database,
  Wrench,
  Search,
  FileText,
  Code,
  Sparkles,
  Brain,
  Settings,
  CircleDot,
  Timer,
  HardDrive,
  Shield,
  Network,
  Plug,
  Layers,
  type LucideIcon,
} from "lucide-react";

export interface SpanDisplay {
  name: string;
  icon: LucideIcon;
}

/**
 * Maps span names to user-friendly display names and icons
 * @param spanName - The raw span name from the trace
 * @param agentName - Optional agent name to use for inference spans
 */
export function getSpanDisplay(spanName: string, agentName?: string): SpanDisplay {
  const lowerSpanName = spanName.toLowerCase();

  // Inference span - use agent name if provided
  if (lowerSpanName === "inference" && agentName) {
    return { name: agentName, icon: Bot };
  }

  if (lowerSpanName === "inference") {
    return { name: "Agent Inference", icon: Bot };
  }

  // Responsible AI inference
  if (lowerSpanName === "rai_inference" || lowerSpanName == 'rai_create') {
    return { name: "Responsible AI", icon: Shield };
  }

  // Session span
  if (lowerSpanName === "session") {
    return { name: "Session", icon: Timer };
  }

  // Memory span
  if (lowerSpanName === "memory") {
    return { name: "Memory", icon: HardDrive };
  }

  // LLM and AI related spans
  if (lowerSpanName === "llm_generation" || lowerSpanName === "llm generation") {
    return { name: "AI Response", icon: Sparkles };
  }

  if (lowerSpanName === "llm_generation_stream") {
    return { name: "AI Response", icon: Sparkles };
  }

  if (lowerSpanName === "async_llm_generation" || lowerSpanName === "async llm generation") {
    return { name: "AI Response", icon: Sparkles };
  }

  if (lowerSpanName === "llm" || lowerSpanName === "model") {
    return { name: "Language Model", icon: Brain };
  }

  // Agent related spans
  if (lowerSpanName === "agent_orchestration" || lowerSpanName === "agent orchestration") {
    return { name: "Agent Orchestration", icon: Network };
  }

  if (lowerSpanName === "agent_execution" || lowerSpanName === "agent execution") {
    return { name: "Agent Execution", icon: Bot };
  }

  if (lowerSpanName === "agent") {
    return { name: "Agent Task", icon: Bot };
  }

  // Tool related spans
  if (lowerSpanName === "generate_response_with_tool_calling") {
    return { name: "Generate AI Response", icon: Sparkles };
  }

  if (lowerSpanName === "mcp_tool_call") {
    return { name: "MCP Tool Call", icon: Plug };
  }

  if (lowerSpanName === "composio_tool_call") {
    return { name: "Composio Tool", icon: Layers };
  }

  if (lowerSpanName === "tool_calling" || lowerSpanName === "tool call") {
    return { name: "Tool Execution", icon: Wrench };
  }

  if (lowerSpanName === "tool" || lowerSpanName === "function_call") {
    return { name: "Tool", icon: Wrench };
  }

  // RAG and retrieval spans
  if (lowerSpanName === "rag_retrieval") {
    return { name: "Knowledge Base Retrieval", icon: Search };
  }

  if (lowerSpanName === "rag_train") {
    return { name: "Knowledge Base Training", icon: Database };
  }

  if (lowerSpanName === "retrieval" || lowerSpanName === "retrieve") {
    return { name: "Knowledge Retrieval", icon: Search };
  }

  if (lowerSpanName === "rag" || lowerSpanName === "vector") {
    return { name: "Vector Search", icon: Database };
  }

  if (lowerSpanName === "embedding") {
    return { name: "Text Embedding", icon: Code };
  }

  if (lowerSpanName === "embed_documents") {
    return { name: "Document Embedding", icon: FileText };
  }

  // Document and content processing
  if (lowerSpanName === "document" || lowerSpanName === "doc") {
    return { name: "Document Processing", icon: FileText };
  }

  if (lowerSpanName === "parse" || lowerSpanName === "parsing") {
    return { name: "Content Parsing", icon: FileText };
  }

  // Message and communication
  if (lowerSpanName === "message" || lowerSpanName === "chat") {
    return { name: "Message Processing", icon: MessageSquare };
  }

  // Processing and computation
  if (lowerSpanName === "process" || lowerSpanName === "processing") {
    return { name: "Processing", icon: Cpu };
  }

  if (lowerSpanName === "compute" || lowerSpanName === "calculation") {
    return { name: "Computation", icon: Cpu };
  }

  // Configuration and setup
  if (lowerSpanName === "config" || lowerSpanName === "setup") {
    return { name: "Configuration", icon: Settings };
  }

  // Default fallback - format the span name nicely
  const formattedName = spanName
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return { name: formattedName, icon: CircleDot };
}
