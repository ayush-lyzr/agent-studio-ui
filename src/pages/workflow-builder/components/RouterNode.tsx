import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Shuffle } from "lucide-react";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { cn } from "@/lib/utils";
import { Route } from "@/types/workflow";

interface RouterNodeProps {
  data: {
    name: string;
    tag: string;
    function: string;
    params: {
      routes: Route[];
      message?: string;
      openai_api_key?: string;
      fallback_route?: string;
      [key: string]: any;
    };
  };
  selected: boolean;
}

const RouterNode: React.FC<RouterNodeProps> = ({ data, selected }) => {
  const { activeTasks } = useWorkflow();
  const isActive = activeTasks[data.name] || false;

  // Ensure routes is always an array, even if it comes as undefined or non-array
  const routes = Array.isArray(data.params.routes) ? data.params.routes : [];

  return (
    <div
      className={cn(
        "node-router relative w-72 rounded-xl border-2 border-orange-200 bg-white transition-all duration-300 dark:bg-gray-800",
        selected ? "scale-105" : "",
        isActive ? "node-active shadow-lg ring-2 ring-orange-400" : "",
      )}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: "12px",
          height: "12px",
          background: "#f97316",
          border: "2px solid white",
          zIndex: 10,
        }}
      />

      <div className="px-4 py-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={cn(
                "rounded-md p-1.5",
                isActive ? "animate-pulse bg-orange-100" : "bg-white",
              )}
            >
              <Shuffle
                className={cn(
                  "h-4 w-4",
                  isActive ? "text-orange-600" : "text-orange-500",
                )}
              />
            </div>
            <span className="text-sm font-medium">Router</span>
          </div>
        </div>

        <div className="text-left">
          {/* <span className="truncate text-sm">Click here to define routes</span> */}
          {/* <p className="truncate text-sm text-gray-500">{data.name}</p> */}
        </div>

        <div className="mt-3 rounded-md p-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Routes</span>
          </div>

          {routes.length > 0 ? (
            <div className="scrollbar-thin max-h-24 w-[120px] space-y-2 overflow-y-auto">
              {routes.map((route, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded border border-orange-100 p-2 text-sm"
                >
                  <span className="max-w-[60px] truncate font-medium">
                    {route.name}
                  </span>
                  {/* <div className="flex items-center">
                    <div className="mr-1 text-xs text-gray-500">
                      {route.examples?.length || 0}
                    </div>
                    <div className="rounded-full bg-orange-100 px-1 py-0.5 text-xs text-orange-500">
                      →
                    </div>
                  </div> */}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-2 text-center text-sm text-gray-500">
              Click here to define routes
            </div>
          )}
        </div>
      </div>

      {/* Route output handles */}
      {routes.map((route, index) => (
        <Handle
          key={route.name}
          id={route.name}
          type="source"
          position={Position.Right}
          style={{
            top: `${25 + index * 20}%`,
            width: "12px",
            height: "12px",
            background: "#f97316",
            border: "2px solid white",
            zIndex: 10,
          }}
        />
      ))}

      {/* Fallback route handle positioning container */}
      {data.params.fallback_route && (
        <div
          className="absolute right-0"
          style={{
            // top: `${Math.min(85, routes.length * 20 + 50)}%`,
            zIndex: 50,
            height: "20px",
            display: "flex",
            alignItems: "center",
            bottom: "10%",
          }}
        >
          <div className="absolute right-2 text-xs text-gray-500">
            <div className="flex items-center">
              <span className="mr-1">fallback</span>
            </div>
          </div>

          <Handle
            id={data.params.fallback_route}
            type="source"
            position={Position.Right}
            style={{
              width: "12px",
              height: "12px",
              background: "#6b7280",
              border: "2px solid white",
              // right: "-6px",
              // transform: "translateX(0)",
            }}
          />
        </div>
      )}

      {/* Route labels */}
      <div className="pointer-events-none absolute right-0 top-0 h-full">
        {routes.map((route, index) => (
          <div
            key={`label-${route.name}`}
            className="absolute text-xs font-medium text-orange-700"
            style={{
              top: `${25 + index * 20}%`,
              right: "20px",
              transform: "translateY(-50%)",
            }}
          >
            <div className="flex items-center">
              <span className="mr-1">{route.name}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Connection hint */}
      {/* {routes.length > 0 && (
        <div className="absolute right-[-5px] top-1/4 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full shadow-sm border border-orange-200 z-20">
          ← Drag from here
        </div>
      )} */}
    </div>
  );
};

export default RouterNode;
