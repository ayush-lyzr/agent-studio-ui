import React, { useState } from "react";
import {
  Bot,
  BookOpen,
  Database,
  Shuffle,
  ChevronsLeft,
  ChevronsRight,
  Router,
  Cloud,
  // Download, // Commented out as it's unused
  ShieldCheck,
  Cable,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";

interface SidebarProps {
  onDragStart: (
    event: React.DragEvent<HTMLDivElement>,
    nodeType: string,
  ) => void;
  // exportWorkflow: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onDragStart,
  // exportWorkflow
}) => {
  const [activeTab, setActiveTab] = useState<"nodes">("nodes");
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const tabs = [
    { id: "nodes", icon: <BookOpen className="h-5 w-5" />, label: "Nodes" },
  ];

  return (
    <div
      className={`relative z-10 flex h-full flex-col border-r border-slate-200 bg-white shadow-lg transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 ${isCollapsed ? "w-16" : "w-72"}`}
    >
      {/* Collapse toggle button - modern floating button with better contrast */}
      <div className="relative">
        <button
          onClick={toggleCollapse}
          className="absolute right-[-16px] top-6 z-20 flex h-8 w-8 items-center justify-center
               rounded-full border border-slate-200 bg-white shadow-md transition-colors hover:bg-slate-50
               focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          {isCollapsed ? (
            <ChevronsRight className="h-4 w-4 text-primary" />
          ) : (
            <ChevronsLeft className="h-4 w-4 text-primary" />
          )}
        </button>
      </div>

      {/* Sidebar header - modernized with gradient accent */}

      {/* Sidebar tabs - modernized with better spacing and hover effects */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`flex flex-1 items-center justify-center gap-2 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
              activeTab === tab.id
                ? "dark:text-primary-light border-b-2 border-primary text-primary"
                : "text-slate-500 dark:text-slate-400"
            }`}
            onClick={() => setActiveTab(tab.id as "nodes")}
          >
            {tab.icon}
            {!isCollapsed && (
              <span className="text-sm font-medium">{tab.label}</span>
            )}
          </button>
        ))}
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto">
        <Collapsible open={!isCollapsed} className="w-full">
          <CollapsibleContent>
            <div className="space-y-4 p-4">
              <h3 className="mb-3 pl-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Drag Components
              </h3>
              <Card
                className="group cursor-grab overflow-hidden rounded-xl border-0 bg-gradient-to-r from-indigo-50 to-purple-50 hover:shadow-md dark:from-indigo-900/20 dark:to-purple-900/20"
                draggable
                onDragStart={(event) => onDragStart(event, "agent")}
              >
                <div className="relative p-4">
                  <div className="absolute right-0 top-0 z-0 -mr-10 -mt-10 h-20 w-20 rounded-full bg-indigo-500/10"></div>
                  <div className="relative z-10 flex items-center space-x-3">
                    <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-slate-800">
                      <Bot className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-slate-200">
                        Agent
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Lyzr Agent
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card
                className="group cursor-grab overflow-hidden rounded-xl border-0 bg-gradient-to-r from-amber-50 to-yellow-50 hover:shadow-md dark:from-amber-900/20 dark:to-yellow-900/20"
                draggable
                onDragStart={(event) => onDragStart(event, "gpt_conditional")}
              >
                <div className="relative p-4">
                  <div className="absolute right-0 top-0 z-0 -mr-10 -mt-10 h-20 w-20 rounded-full bg-amber-500/10"></div>
                  <div className="relative z-10 flex items-center space-x-3">
                    <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-slate-800">
                      <Shuffle className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-slate-200">
                        Conditional
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Branching logic
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Add GPT Router node */}
              <Card
                className="group cursor-grab overflow-hidden rounded-xl border-0 bg-gradient-to-r from-orange-50 to-rose-50 hover:shadow-md dark:from-orange-900/20 dark:to-rose-900/20"
                draggable
                onDragStart={(event) => onDragStart(event, "gpt_router")}
              >
                <div className="relative p-4">
                  <div className="absolute right-0 top-0 z-0 -mr-10 -mt-10 h-20 w-20 rounded-full bg-orange-500/10"></div>
                  <div className="relative z-10 flex items-center space-x-3">
                    <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-slate-800">
                      <Router className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-slate-200">
                        Router
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Multi-path routing
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card
                className="group cursor-grab overflow-hidden rounded-xl border-0 bg-gradient-to-r from-blue-50 to-sky-50 hover:shadow-md dark:from-blue-900/20 dark:to-sky-900/20"
                draggable
                onDragStart={(event) => onDragStart(event, "api")}
              >
                <div className="relative p-4">
                  <div className="absolute right-0 top-0 z-0 -mr-10 -mt-10 h-20 w-20 rounded-full bg-blue-500/10"></div>
                  <div className="relative z-10 flex items-center space-x-3">
                    <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-slate-800">
                      <Cloud className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-slate-200">
                        API Call
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        External API requests
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card
                className="group cursor-grab overflow-hidden rounded-xl border-0 bg-gradient-to-r from-emerald-50 to-green-50 hover:shadow-md dark:from-emerald-900/20 dark:to-green-900/20"
                draggable
                onDragStart={(event) => onDragStart(event, "inputs")}
              >
                <div className="relative p-4">
                  <div className="absolute right-0 top-0 z-0 -mr-10 -mt-10 h-20 w-20 rounded-full bg-emerald-500/10"></div>
                  <div className="relative z-10 flex items-center space-x-3">
                    <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-slate-800">
                      <Database className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-slate-200">
                        Default Inputs
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Parameter inputs
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card
                className="group cursor-grab overflow-hidden rounded-xl border-0 bg-gradient-to-r from-purple-50 to-violet-50 hover:shadow-md dark:from-purple-900/20 dark:to-violet-900/20"
                draggable
                onDragStart={(event) => onDragStart(event, "a2a")}
              >
                <div className="relative p-4">
                  <div className="absolute right-0 top-0 z-0 -mr-10 -mt-10 h-20 w-20 rounded-full bg-purple-500/10"></div>
                  <div className="relative z-10 flex items-center space-x-3">
                    <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-slate-800">
                      <Cable className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-slate-200">
                        A2A
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Agent to Agent
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Human Approval Node */}
              {/* <Card
                className="border-0 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 hover:shadow-md cursor-grab group rounded-xl overflow-hidden"
                draggable
                onDragStart={(event) => onDragStart(event, 'approval_block')}
              >
                <div className="p-4 relative">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10 z-0"></div>
                  <div className="flex items-center space-x-3 relative z-10">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                      <ShieldCheck className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-slate-200">Human Approval</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Approval checkpoint</p>
                    </div>
                  </div>
                </div>
              </Card> */}

              <div className="mt-8 space-y-2"></div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Collapsed view - show only icons */}
        {isCollapsed && (
          <div className="mt-6 flex flex-col items-center space-y-6">
            <div
              className="cursor-grab rounded-md bg-blue-50 p-2 shadow-sm hover:shadow-md"
              draggable
              onDragStart={(event) => onDragStart(event, "api")}
            >
              <Cloud className="h-5 w-5 text-blue-500" />
            </div>

            <div
              className="cursor-grab rounded-md bg-indigo-50 p-2 shadow-sm hover:shadow-md"
              draggable
              onDragStart={(event) => onDragStart(event, "agent")}
            >
              <Bot className="h-5 w-5 text-indigo-500" />
            </div>

            <div
              className="cursor-grab rounded-md bg-blue-100 p-2 shadow-sm hover:shadow-md"
              draggable
              onDragStart={(event) => onDragStart(event, "approval_block")}
            >
              <ShieldCheck className="h-5 w-5 text-blue-500" />
            </div>

            <div
              className="cursor-grab rounded-md bg-amber-50 p-2 shadow-sm hover:shadow-md"
              draggable
              onDragStart={(event) => onDragStart(event, "gpt_conditional")}
            >
              <Shuffle className="h-5 w-5 text-amber-500" />
            </div>

            {/* Add GPT Router node to collapsed view */}
            <div
              className="cursor-grab rounded-md bg-orange-50 p-2 shadow-sm hover:shadow-md"
              draggable
              onDragStart={(event) => onDragStart(event, "gpt_router")}
            >
              <Router className="h-5 w-5 text-orange-500" />
            </div>

            <div
              className="cursor-grab rounded-md bg-green-50 p-2 shadow-sm hover:shadow-md"
              draggable
              onDragStart={(event) => onDragStart(event, "inputs")}
            >
              <Database className="h-5 w-5 text-green-600" />
            </div>

            <div
              className="cursor-grab rounded-md bg-green-50 p-2 shadow-sm hover:shadow-md"
              draggable
              onDragStart={(event) => onDragStart(event, "a2a")}
            >
              <Cable className="h-5 w-5 text-purple-600" />
            </div>

            {/* <Button
              variant="outline"
              size="icon"
              onClick={exportWorkflow}
              className="mt-4"
            >
              <Download className="h-4 w-4" />
            </Button> */}
          </div>
        )}
      </div>

      {/* Sidebar footer */}
      {/* <div className="p-4 border-t">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">v1.0.0</span>
          <Button variant="ghost" size="sm" className="p-2 h-auto">
            <Settings className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      </div> */}
    </div>
  );
};

export default Sidebar;
