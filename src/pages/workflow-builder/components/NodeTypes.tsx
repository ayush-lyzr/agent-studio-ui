import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Cloud, Bot, Wrench } from "lucide-react";
import { NodeType, Route } from "@/types/workflow";
import InputsNode from "./InputsNode";
import ConditionalNode from "./ConditionalNode";
import RouterNode from "./RouterNode";
import ApprovalNode from "./ApprovalNode";
import A2ANode from "./A2ANode";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { cn } from "@/lib/utils";

interface NodeProps {
  data: {
    name: string;
    tag: string;
    function: string;
    params: Record<string, any>;
  };
  selected: boolean;
  type: NodeType;
}

export const ApiNode: React.FC<NodeProps> = ({ data, selected }) => {
  const { activeTasks } = useWorkflow();
  const isActive = activeTasks[`api_${data.tag}`] || false;

  // Extract API configuration details
  const apiConfig = data.params?.config || {};

  // Check if this is a mapped node (has depends property)
  const isMapped = !!apiConfig.depends;

  // Get method from appropriate location
  const method = isMapped
    ? apiConfig.default?.method || "GET"
    : apiConfig.method || "GET";

  // Get URL from appropriate location
  const apiUrl = isMapped ? apiConfig.default?.url || "" : apiConfig.url || "";

  // Count parameters based on whether it's mapped or not
  let queryParams = 0;
  let bodyParams = 0;
  let totalMappedParams = 0;

  if (isMapped && apiConfig.mapping) {
    // For mapped nodes, count parameters from mapping
    const mappingEntries = Object.entries(apiConfig.mapping);
    queryParams = mappingEntries.filter(([key]) =>
      key.startsWith("QUERY_"),
    ).length;
    bodyParams = mappingEntries.filter(([key]) =>
      key.startsWith("BODY_"),
    ).length;
    const headerParams = mappingEntries.filter(([key]) =>
      key.startsWith("HEADER_"),
    ).length;
    totalMappedParams = queryParams + bodyParams + headerParams;
  } else {
    // For regular nodes, count from direct params
    queryParams = Object.keys(data.params).filter((key) =>
      key.startsWith("QUERY_"),
    ).length;
    bodyParams = Object.keys(data.params).filter(
      (key) => !key.startsWith("QUERY_") && key !== "config",
    ).length;
  }

  return (
    <div
      className={cn(
        "node-api w-64 rounded-lg border border-blue-200 bg-white p-3 shadow-sm transition-all duration-300 dark:border-blue-900 dark:bg-gray-800",
        selected ? "scale-105" : "",
        isActive ? "node-active shadow-lg ring-2 ring-blue-400" : "",
      )}
    >
      <Handle type="target" position={Position.Left} />

      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div
            className={cn(
              "rounded-md p-1.5",
              isActive ? "animate-pulse bg-blue-100" : "bg-white",
            )}
          >
            <Cloud
              className={cn(
                "h-4 w-4",
                isActive ? "text-blue-600" : "text-blue-500",
              )}
            />
          </div>
          <span className="text-sm font-medium">API Call</span>
        </div>
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
          {method}
        </span>
      </div>

      <div className="text-left">
        <h3 className="truncate text-lg font-semibold">{data.tag}</h3>
        {/* <p className="truncate text-sm text-gray-500">{data.name}</p> */}
      </div>

      {/* Show mapping indicator if configured */}
      {data.params?.config?.depends && (
        <div className="mt-2 flex items-center gap-2 rounded-md bg-green-50 px-2 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
          <span className="text-xs text-green-700">
            Mapped to {data.params.config.depends}
          </span>
        </div>
      )}

      {/* Show API URL if configured and not mapped */}
      {apiUrl && !data.params?.config?.depends && (
        <div className="mt-2 rounded-md bg-blue-50 p-2 text-xs">
          <div className="flex items-center gap-1">
            <Cloud className="h-3 w-3 text-blue-500" />
            <span className="truncate text-blue-700" title={apiUrl}>
              {apiUrl.replace(/^https?:\/\//, "")}
            </span>
          </div>
        </div>
      )}

      <div className="mt-3 border-t border-blue-100 pt-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex gap-3">
            {isMapped ? (
              // For mapped nodes, show total mapped parameters
              totalMappedParams > 0 ? (
                <span>Mapped: {totalMappedParams}</span>
              ) : (
                <span>No mapping</span>
              )
            ) : (
              // For regular nodes, show parameter breakdown
              <>
                {queryParams > 0 && <span>Query: {queryParams}</span>}
                {bodyParams > 0 && <span>Body: {bodyParams}</span>}
                {queryParams === 0 && bodyParams === 0 && (
                  <span>No parameters</span>
                )}
              </>
            )}
          </div>
          <div className="flex gap-1">
            <span className="font-mono text-xs text-blue-600">{method}</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export const AgentNode: React.FC<NodeProps> = ({ data, selected }) => {
  // Extract tool information if available
  const agentConfig = data.params?.config;
  const toolInfo = agentConfig?.tool_info;
  const { activeTasks } = useWorkflow();

  // Match task_name from workflow events with node tag
  const isActive = activeTasks[`agent_${data.tag}`] || false;

  // Identify agent dependencies
  const agentDependencies = Object.entries(data.params || {})
    .filter(
      ([key, value]) =>
        key !== "config" &&
        typeof value === "object" &&
        value !== null &&
        "depends" in value,
    )
    .map(([key]) => key);

  return (
    <div
      className={cn(
        "node-agent w-64 rounded-lg border border-purple-200 bg-white p-3 shadow-sm transition-all duration-300 dark:border-purple-900 dark:bg-gray-800",
        selected ? "scale-105" : "",
        isActive ? "node-active shadow-lg ring-2 ring-purple-400" : "",
      )}
    >
      <Handle
        style={{
          padding: "4px",
        }}
        type="target"
        position={Position.Left}
      />

      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div
            className={cn(
              "rounded-md p-1.5",
              isActive ? "animate-pulse bg-purple-100" : "bg-white",
            )}
          >
            <Bot
              className={cn(
                "h-4 w-4",
                isActive ? "text-purple-600" : "text-purple-500",
              )}
            />
          </div>
          <span className="text-sm font-medium">Lyzr Agent</span>
        </div>
        {/* <span className="text-xs bg-purple-100 px-2 py-0.5 rounded-full text-purple-700">
          {data.function}
        </span> */}
      </div>

      <div className="text-left">
        <h3 className="truncate text-lg font-semibold">{data.tag}</h3>
        {/* <p className="truncate text-sm text-gray-500">{data.name}</p> */}
      </div>

      {toolInfo && (
        <div className="mt-2 flex items-center rounded-md bg-purple-50 p-2 text-xs text-purple-700">
          <Wrench className="mr-1 h-3 w-3 flex-shrink-0" />
          <span className="truncate">{toolInfo}</span>
        </div>
      )}

      {agentDependencies.length > 0 && (
        <div className="mt-2 rounded-md bg-purple-50/50 p-2 text-xs text-purple-700">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-medium">Dependencies:</span>
            <span className="text-xs text-purple-500">
              {agentDependencies.length}
            </span>
          </div>
          <div className="max-h-16 space-y-1 overflow-y-auto">
            {agentDependencies.map((dep) => (
              <div
                key={dep}
                className="truncate rounded bg-white/50 px-1.5 py-0.5"
              >
                {dep}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* <div className="mt-3 pt-3 border-t border-purple-100">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {Object.keys(data.params).length} parameters
          </span>
          <div className="flex gap-1">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div> */}

      <Handle
        style={{
          padding: "4px",
        }}
        type="source"
        position={Position.Right}
      />
    </div>
  );
};

// Export the RouterNode
export const GptRouterNode: React.FC<NodeProps> = ({ data, selected }) => {
  // Ensure routes is always a properly typed Route[] array
  const nodeData = {
    ...data,
    params: {
      ...data.params,
      routes: Array.isArray(data.params.routes)
        ? data.params.routes
        : ([] as Route[]),
    },
  };

  return <RouterNode data={nodeData} selected={selected} />;
};

// Export the ConditionalNode
export const GptConditionalNode = ({
  data,
  selected,
}: Omit<NodeProps, "type">) => {
  return <ConditionalNode data={data} selected={selected} />;
};

// Export the ApprovalNode
export const HumanApprovalNode = ({
  data,
  selected,
}: Omit<NodeProps, "type">) => {
  return <ApprovalNode data={data} selected={selected} />;
};

export const AgenttoAgentNode = ({
  data,
  selected,
}: Omit<NodeProps, "type">) => {
  return <A2ANode data={data} selected={selected} />;
};

// Export the InputsNode
export { InputsNode };

// Custom Edge component with simple styling, no animation
export const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  selected,
  label,
}: any) => {
  // Calculate path
  const edgePath = `M${sourceX} ${sourceY}C ${sourceX + 50} ${sourceY}, ${targetX - 50} ${targetY}, ${targetX} ${targetY}`;

  // Check if this is a conditional edge (True/False paths)
  const isConditionalEdge =
    label &&
    (label.includes("True") ||
      label.includes("False") ||
      label.includes("Route"));

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={2}
        stroke="#b1b1b7"
        strokeOpacity={selected ? 1 : 0.6}
        strokeDasharray={label ? "5,5" : undefined}
        style={{ pointerEvents: "all" }}
      />

      {/* Only show label for non-conditional edges */}
      {label && !isConditionalEdge && (
        <text
          className="react-flow__edge-text"
          style={{
            fill: "white",
            fontSize: "12px",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <textPath
            href={`#${id}`}
            startOffset="50%"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            <tspan dy={-10} dx={0}>
              <tspan
                className="edge-label-background"
                style={{
                  fill: "#6366f1",
                  stroke: "#6366f1",
                  strokeWidth: 10,
                  strokeLinejoin: "round",
                  paintOrder: "stroke",
                }}
              >
                {label}
              </tspan>
              <tspan style={{ fill: "white" }}>{label}</tspan>
            </tspan>
          </textPath>
        </text>
      )}
    </>
  );
};
