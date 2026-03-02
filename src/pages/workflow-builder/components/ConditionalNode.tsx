import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkflow } from "@/contexts/WorkflowContext";

interface ConditionalNodeProps {
  data: {
    name: string;
    tag: string;
    function: string;
    params: Record<string, any>;
  };
  selected: boolean;
}

const ConditionalNode: React.FC<ConditionalNodeProps> = ({
  data,
  selected,
}) => {
  const { activeTasks } = useWorkflow();
  const isActive = activeTasks[`gpt_conditional_${data.tag}`] || false;

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
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !rounded-full !bg-amber-500"
      />

      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div
            className={cn(
              "rounded-md p-1.5",
              isActive ? "animate-pulse bg-amber-100" : "bg-white",
            )}
          >
            <Shuffle
              className={cn(
                "h-4 w-4",
                isActive ? "text-amber-600" : "text-amber-500",
              )}
            />
          </div>
          <span className="text-sm font-medium">Conditional</span>
        </div>
        {/* <span className="text-xs bg-amber-100 px-2 py-0.5 rounded-full text-amber-700 truncate max-w-[100px]">
          {data.function}
        </span> */}
      </div>

      <div className="overflow-hidden text-left">
        <h3 className="truncate text-lg font-semibold">{data.tag}</h3>
        {/* <p className="text-sm text-gray-500 truncate">{data.name}</p> */}
      </div>

      {data.params?.condition && (
        <div className="mt-2 overflow-hidden rounded-md bg-amber-50 p-2 text-xs text-amber-700">
          <span className="font-medium">Condition:</span>
          <p className="mt-1 truncate">{data.params.condition}</p>
        </div>
      )}

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
        id="true"
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !rounded-full !bg-green-500"
        style={{ top: "40%" }}
      >
        <div className="absolute right-4 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-semibold text-green-600">
          True
        </div>
      </Handle>

      <Handle
        id="false"
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !rounded-full !bg-red-500"
        style={{ top: "70%" }}
      >
        <div className="absolute right-4 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-semibold text-red-600">
          False
        </div>
      </Handle>
    </div>
  );
};

export default ConditionalNode;
