import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { ShieldCheck, User, ChevronDown } from "lucide-react";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { cn } from "@/lib/utils";

interface ApprovalNodeProps {
  data: {
    name: string;
    tag: string;
    function: string;
    params: {
      owner_user_id?: string;
      approvals?: Array<{
        user_id: string;
        user_email: string;
        approval_status: string;
      }>;
      [key: string]: any;
    };
  };
  selected: boolean;
}

const ApprovalNode: React.FC<ApprovalNodeProps> = ({ data, selected }) => {
  const { activeTasks } = useWorkflow();
  const isActive = activeTasks[data.name] || false;
  const [isParamsOpen, setIsParamsOpen] = useState(false);

  // Get approver from params or set default values
  const approvals = data.params.approvals || [
    {
      user_id: "",
      user_email: "approver@example.com",
      approval_status: "pending",
    },
  ];

  // Get owner from params or use default
  const owner = data.params.owner_user_id || "default_owner";

  return (
    <div
      className={cn(
        "node-approval w-64 overflow-hidden rounded-xl border-2 border-blue-200 bg-white px-4 py-2 dark:bg-gray-800",
        selected ? "scale-105" : "",
        isActive ? "node-active shadow-lg ring-2 ring-blue-400" : "",
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !rounded-full !bg-blue-500"
      />

      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div
            className={cn(
              "rounded-md p-1.5",
              isActive ? "animate-pulse bg-blue-100" : "bg-white",
            )}
          >
            <ShieldCheck
              className={cn(
                "h-4 w-4",
                isActive ? "text-blue-600" : "text-blue-500",
              )}
            />
          </div>
          <span className="text-sm font-medium">Human Approval</span>
        </div>
      </div>

      <div className="overflow-hidden text-left">
        <h3 className="truncate text-lg font-semibold">{data.tag}</h3>
      </div>

      <div className="mt-2 rounded-md bg-blue-50 p-2 text-xs text-blue-700">
        <div className="mb-1 flex items-center">
          <User className="mr-1 h-3 w-3" />
          <span className="font-medium">Approver:</span>
          <span className="ml-1 truncate">
            {approvals[0]?.user_id || "Not set"}
          </span>
        </div>
        <div className="flex items-center">
          <span className="font-medium">Owner:</span>
          <span className="ml-1 truncate">{owner}</span>
        </div>
      </div>

      <div
        className="mt-3 cursor-pointer border-t border-blue-100 pt-3"
        onClick={() => setIsParamsOpen(!isParamsOpen)}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Configuration</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-gray-400 transition-transform",
              isParamsOpen ? "rotate-180 transform" : "",
            )}
          />
        </div>
      </div>

      {isParamsOpen && (
        <div className="mt-2 rounded-md bg-gray-50 p-2 text-xs">
          <div className="mb-2">
            <label className="mb-1 block text-gray-700">Approver ID</label>
            <input
              type="text"
              className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
              placeholder="Enter approver ID"
              value={approvals[0]?.user_id || ""}
              readOnly
            />
          </div>
          <div className="mb-2">
            <label className="mb-1 block text-gray-700">Email</label>
            <input
              type="text"
              className="w-full rounded border border-gray-300 bg-gray-100 px-2 py-1 text-xs"
              value={approvals[0]?.user_email || "approver@example.com"}
              readOnly
            />
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !rounded-full !bg-blue-500"
      />
    </div>
  );
};

export default ApprovalNode;
