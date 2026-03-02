export type NodeType =
  | "api"
  | "agent"
  | "inputs"
  | "gpt_conditional"
  | "gpt_router"
  | "loopNode"
  | "a2a";

export interface ParamValue {
  value?: string;
  input?: string;
  depends?: string;
  [key: string]: any; // Allow for additional properties
}

export interface NodeParams {
  [key: string]: ParamValue | string | number | boolean | Record<string, any>;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: {
    x: number;
    y: number;
  };
  data: {
    name: string;
    tag: string;
    function: string;
    params: NodeParams & { body?: Record<string, any> };
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
  condition?: string; // Added condition property for conditional edges
  animated: boolean; // Make animated required
  style: { strokeWidth: number; [key: string]: any }; // Make style more specific
  markerEnd: { type: any }; // Make markerEnd required
  data: Record<string, any>; // Make data required
}

export interface DefaultInput {
  [key: string]: any;
}

export interface WorkflowTask {
  name: string;
  tag: string;
  function: string;
  params: NodeParams;
}

export interface WorkflowEdgeDefinition {
  source: string;
  target: string;
  condition?: string; // Added condition for edge definitions
}

export interface Workflow {
  tasks: WorkflowTask[];
  default_inputs: Record<string, DefaultInput>;
  flow_name: string;
  run_name: string;
  edges?: WorkflowEdgeDefinition[]; // Added edges array for conditional flows
  flow_data?: {
    node_positions?: Record<string, { x: number; y: number }>;
  };
}

// API response types for workflows
export interface WorkflowResponse {
  flow_id: string;
  flow_name: string;
  flow_data: any;
  api_key: string;
  created_at: string;
  updated_at: string;
  description?: string; // Optional description field
}

export interface WorkflowListItem {
  id: string;
  name: string;
  updatedAt: string;
  createdAt: string;
}

export interface ApiNodeConfig {
  url: string;
  method: string;
  headers: Record<string, string>;
}

export interface AgentNodeConfig {
  user_id: string;
  session_id: string;
  agent_id: string;
  api_key: string;
  api_url: string;
  agent_name: string;
}

export interface InputsNodeConfig {
  keys: Record<string, string>;
}

export interface ConditionalNodeConfig {
  openai_api_key: string;
  model: string;
  temperature: number;
  message: string;
  condition: string;
  true?: string;
  false?: string;
}

export interface RouteExample {
  text: string;
}

export interface Route {
  name: string;
  description: string;
  examples: RouteExample[];
}

export interface RouterNodeConfig {
  openai_api_key: string;
  message: string;
  routes: Route[];
  fallback_route: string;
}
