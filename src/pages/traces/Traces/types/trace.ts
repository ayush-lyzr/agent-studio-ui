export interface InputMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OutputMessage {
  content: string;
  role: string;
  tool_calls: null | any;
  function_call: null | any;
  annotations: any[];
}

export interface AgentRun {
  _id: string;
  trace_id: string;
  agent_id: string;
  log_id: string;
  run_id: string;
  org_id: string;
  latency_ms: number;
  start_time: string;
  end_time: string;
  llm_provider: string;
  language_model: string;
  actions: number;
  input_messages: InputMessage[];
  output_messages: OutputMessage;
  agent_name: string;
  num_input_tokens: number;
  num_output_tokens: number;
}

export interface DialogProps {
  agent_name: string;
  trace_id: string;
  runs: string[];
  open: boolean;
  setOpen: (open: boolean) => void;
}
