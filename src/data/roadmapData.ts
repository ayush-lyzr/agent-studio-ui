export type RoadmapCategory =
  | "Core"
  | "Eval"
  | "Observability & Guardrails"
  | "RAG"
  | "Memory"
  | "Tools & Skills"
  | "UX"
  | "Voice";

export type RoadmapQuarter = "Q1 26" | "Q2 26";

export interface RoadmapItem {
  id: string;
  feature: string;
  description: string;
  category: RoadmapCategory;
  quarter: RoadmapQuarter;
}

export const categories: RoadmapCategory[] = [
  "Core",
  "Eval",
  "Observability & Guardrails",
  "RAG",
  "Memory",
  "Tools & Skills",
  "UX",
  "Voice",
];

export const quarters: RoadmapQuarter[] = ["Q1 26", "Q2 26"];

export const roadmapItems: RoadmapItem[] = [
  // Core (12)
  { id: "1", feature: "Conversational Agent Builder", description: "Create and configure AI agents simply by describing what you want in plain language.", category: "Core" ,quarter:"Q1 26"},
  { id: "2", feature: "Webhook based Triggers", description: "Fire agents automatically in response to external events via configurable webhook endpoints.", category: "Core" ,quarter:"Q1 26"},
  { id: "3", feature: "Agent Development Lifecycle", description: "Manage the full agent lifecycle with dev/prod environments and governed quality approvals.", category: "Core" ,quarter:"Q1 26"},
  { id: "4", feature: "Full end-to-end ADK", description: "A comprehensive SDK covering every layer of the stack for seamless programmatic agent building and management.", category: "Core", quarter: "Q1 26" },
  { id: "5", feature: "Asynchronous Human In the Loop", description: "Embed human review and intervention checkpoints at any step of an agent's workflow.", category: "Core", quarter:"Q2 26"},
  { id: "6", feature: "Improved OCR and Image parsers", description: "Extract and process text and structured data from images and scanned documents within agent workflows.", category: "Core" ,quarter:"Q1 26"},
  { id: "7", feature: "Agent Spawning", description: "Dynamically spin up child agents at runtime to handle parallel tasks or complex sub-workflows.", category: "Core" ,quarter:"Q1 26"},
  { id: "8", feature: "Anomaly Alerting System", description: "Email Alerts to users for high spike in usage or high failures, based on what's configured", category: "Core", quarter:"Q2 26"},
  { id: "9", feature: "Integrate within Slack, Teams", description: "Integrate Lyzr Agents directly into Slack, Teams or other mesasging Apps, where users can talk to agents directly from there", category: "Core", quarter:"Q2 26" },
  { id: "10", feature: "Email listeners for Triggering Agents", description: "Automatically trigger agents in response to incoming emails based on configurable rules and filters.", category: "Core",quarter:"Q2 26" },
  { id: "11", feature: "Rate limiting (Day, agent, user level)", description: "Granular usage controls to cap requests at the day, agent, or individual user level.", category: "Core" , quarter:"Q2 26"},
  { id: "12", feature: "Agent Mesh & OGI", description: "Enable agents to collaborate and interoperate across a distributed mesh with a unified Open Graph Interface.", category: "Core" , quarter:"Q2 26"},

  // Eval (5)
  { id: "13", feature: "Agent Improvement Engine", description: "Find & fix anomalies and failures by tracking usage of productionized agents.", category: "Eval", quarter:"Q1 26"},
  { id: "14", feature: "Model Selection for Eval", description: "Allow users to choose the right model to evaluate test cases", category: "Eval", quarter:"Q1 26"},
  { id: "15", feature: "Bulk Upload Test Cases", description: "Import large sets of test cases at once to accelerate evaluation setup and coverage.", category: "Eval", quarter:"Q1 26"},
  { id: "16", feature: "Improved Custom Eval Metrics", description: "Custom Judge Scorers, Multi-Grader support to combine multiple scorers with weighted formulas", category: "Eval", quarter:"Q2 26"},
  { id: "17", feature: "Multi-turn Evaluation", description: "Evaluate conversation as a whole session, for advanced evaluation", category: "Eval" ,quarter:"Q2 26"},

  // Observability & Guardrails (5)
  { id: "18", feature: "Query Based Trace Search", description: "Search across Traces in natural language", category: "Observability & Guardrails" ,quarter:"Q1 26"},
  { id: "19", feature: "Bring external traces to Lyzr Traces", description: "Manage traces as a first-class module with the ability to import trace data from third-party providers.", category: "Observability & Guardrails" ,quarter:"Q2 26"},
  { id: "20", feature: "Custom Analytics Dashboard", description: "Allow users to create custom dashboards, with metrics that matter to them", category: "Observability & Guardrails" ,quarter:"Q2 26"},
  { id: "21", feature: "Advanced reports for Org Owners", description: "Reports on Usage, Credit Consumption, Team members data and so on", category: "Observability & Guardrails" ,quarter:"Q2 26"},
  { id: "22", feature: "Third-party guardrails", description: "Plug in enterprise-grade safety and validation guardrails with a rich library of configurable policies.", category: "Observability & Guardrails" ,quarter:"Q1 26"},

  // RAG (6)
  { id: "23", feature: "Conversational way of managing KB", description: "Add and manage knowledge base files naturally through conversation, no manual uploads required.", category: "RAG", quarter:"Q1 26"},
  { id: "24", feature: "Scheduler for KB to update website", description: "Automatically keep knowledge bases up to date by scheduling periodic syncs from web sources.", category: "RAG", quarter:"Q1 26"},
  { id: "25", feature: "Excel as direct File Input", description: "Upload and parse Excel files directly as structured inputs for agents.", category: "RAG", quarter:"Q1 26"},
  { id: "26", feature: "KB Sync to Google Drive & SharePoint", description: "Keep knowledge bases automatically in sync with documents stored in Google Drive and SharePoint.", category: "RAG", quarter:"Q1 26"},
  { id: "27", feature: "Add more connectors to KB Sync", description: "Keep knowledge bases automatically in sync with documents from various tools and mediums", category: "RAG", quarter:"Q2 26"},
  { id: "28", feature: "Hybrid RAG", description: "Blend semantic vector search with keyword matching to improve retrieval precision across diverse query types.", category: "RAG", quarter: "Q2 26" },

  // Memory (5)
  { id: "29", feature: "Optimized Memory & retrieval", description: "Benchmark-grade memory retrieval that competes with industry leaders on speed and relevance quality.", category: "Memory", quarter:"Q1 26"},
  { id: "30", feature: "Categorisation of memories", description: "Organize agent memories into structured categories for more precise retrieval and context management.", category: "Memory", quarter:"Q2 26"},
  { id: "31", feature: "Agent to Agent Memory", description: "Enable agents to share and access each other's memory for seamless handoffs", category: "Memory", quarter:"Q1 26"},
  { id: "32", feature: "Memory migration from other Providers", description: "Import and migrate existing memory stores from third-party providers into Lyzr's memory layer.", category: "Memory", quarter:"Q2 26"},
  { id: "33", feature: "CRUD on memory", description: "Full create, read, update, and delete control over agent memory for precise context management.", category: "Memory", quarter:"Q1 26"},

  // Tools & Skills (5)
  { id: "34", feature: "Increased Tools and MCP Support", description: "Expand the library of supported tools and add native Model Context Protocol (MCP) integration.", category: "Tools & Skills" ,quarter:"Q1 26"},
  { id: "35", feature: "Skills", description: "Build, validate, and assign modular skills to agents to extend their capabilities in a structured way.", category: "Tools & Skills" ,quarter:"Q1 26"},
  { id: "36", feature: "Dynamic Skill and Tool Builder", description: "Blend agent-defined tool creation with runtime skill composition to extend capabilities across evolving task demands.", category: "Tools & Skills", quarter: "Q1 26" },
  { id: "37", feature: "Make the Remote MCP list exhaustive", description: "Provide ready-to-use MCP's across multiple tools.", category: "Tools & Skills", quarter: "Q2 26" },
  { id: "38", feature: "Support for local MCPs", description: "Ability to connect to local MCPs.", category: "Tools & Skills", quarter: "Q2 26" },

  // UX (5)
  { id: "39", feature: "Notification Module", description: "Centralized in-app notification system to keep users informed of agent events, alerts, and updates.", category: "UX", quarter:"Q2 26"},
  { id: "40", feature: "Revamp & Improve Blueprints Experience", description: "Redesign blueprint flow with better design, searchability, and usability", category: "UX", quarter:"Q2 26"},
  { id: "41", feature: "Admin console to manage sub-accounts", description: "Streamlined sub-account management with flexible, transparent credit allocation across teams and clients.", category: "UX", quarter:"Q2 26"},
  { id: "42", feature: "Product tours and guides", description: "Guide both first-time & existing users", category: "UX", quarter:"Q2 26"},
  { id: "43", feature: "Builder + Focus Mode Switchability", description: "Toggle between a full-featured builder view and a distraction-free focus mode for a tailored experience.", category: "UX", quarter:"Q1 26"},
  

  // Voice (8)
  { id: "44", feature: "Introduce Avatar for improved experience", description: "Add visual avatars to voice agents for more engaging experience", category: "Voice", quarter:"Q1 26" },
  { id: "45", feature: "Increased Model & multi-language support", description: "Support broad range of voice models, TTS and STT, with multi-language capabilities", category: "Voice", quarter:"Q1 26" },
  { id: "46", feature: "Add Custom Pronounciations", description: "Configure voice agent to use custom pronounication for domain specific or custom terminologies", category: "Voice", quarter:"Q1 26" },
  { id: "47", feature: "Integration with multiple phone call providers", description: "Connect voice agent with phone numbers of leading telephony providers", category: "Voice", quarter:"Q1 26" },
  { id: "48", feature: "Real-time listening & improved translation", description: "Enhance live-listening accuracy, and deliver real-time transcripts", category: "Voice", quarter:"Q2 26"},
  { id: "49", feature: "Traceability for Voice", description: "Traces for both real-time and sandwich architecture", category: "Voice" ,quarter:"Q1 26"},
  { id: "50", feature: "Live kit architecture", description: "Real-time, low-latency infrastructure enabling voice and video-capable agent interactions.", category: "Voice", quarter:"Q1 26"},
  { id: "51", feature: "Instant Voice Cloning", description: "Quickly replicate a voice from short audio samples.", category: "Voice", quarter: "Q2 26" },
];
