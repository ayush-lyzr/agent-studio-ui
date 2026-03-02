import React from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { Cable } from "lucide-react";

interface A2ANodeProps {
  data: {
    name: string;
    tag: string;
    function: string;
    params: Record<string, any>;
  };
  selected: boolean;
}

const A2ANode: React.FC<A2ANodeProps> = ({ data, selected }) => {
  const { activeTasks } = useWorkflow();
  const isActive = activeTasks[`a2a_${data.tag}`] || false;

  // Check if required parameters are present
  // Commented out as not currently used
  // const hasRequiredParams = data.params?.message &&
  //   data.params?.condition &&
  //   data.params?.openai_api_key &&
  //   data.params?.model;

  return (
    <div
      className={cn(
        "node-conditional border-workflow-conditional-border w-64 overflow-hidden rounded-xl border-2 bg-white px-4 py-2 dark:bg-gray-800",
        selected ? "scale-105" : "",
        isActive ? "node-active shadow-lg ring-2 ring-amber-400" : "",
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
          <div className="flex items-center space-x-2">
            <div
              className={cn(
                "rounded-md p-1.5",
                isActive ? "animate-pulse bg-purple-100" : "bg-white",
              )}
            >
              <Cable
                className={cn(
                  "h-4 w-4",
                  isActive ? "text-purple-600" : "text-purple-500",
                )}
              />
            </div>
            <span className="text-sm font-medium">A2A</span>
          </div>
        </div>
        {/* <span className="text-xs bg-amber-100 px-2 py-0.5 rounded-full text-amber-700 truncate max-w-[100px]">
          {data.function}
        </span> */}
      </div>

      <div className="overflow-hidden text-left">
        <h3 className="truncate text-lg font-semibold">{data.tag}</h3>
        {/* <p className="text-sm text-gray-500 truncate">{data.name}</p> */}
      </div>

      {/* {!hasRequiredParams && (
        <div className="mt-2 bg-red-50 p-2 rounded-md flex items-center text-xs text-red-700">
          <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
          <span className="truncate">Missing required parameters</span>
        </div>
      )} */}

      {/* <div className="mt-3 pt-3 border-t border-amber-100">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {Object.keys(data.params || {}).length} parameters
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

export default A2ANode;
