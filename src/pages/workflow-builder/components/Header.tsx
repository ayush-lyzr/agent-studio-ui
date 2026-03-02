import React, { useState, useEffect } from "react";
import {
  Play,
  Save,
  Code,
  Info,
  Copy,
  Check,
  Clock,
  Video,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import WorkflowList from "./WorkflowList";
import {
  executeWorkflow,
  saveWorkflow,
  updateWorkflow,
} from "@/services/workflowApiService";
import { WorkflowResponse } from "@/types/workflow";
import { Tabs, TabsTrigger, TabsList, TabsContent } from "@/components/ui/tabs";
import useStore from "@/lib/store";
import mixpanel from "mixpanel-browser";
import { isMixpanelActive, RUN_API_URL } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import MarkdownRenderer from "@/components/custom/markdown";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface HeaderProps {
  flowName: string;
  runName: string; // Still keeping the prop for data flow consistency
  onFlowNameChange: (name: string) => void;
  onRunNameChange: (name: string) => void; // Still keeping the callback for data flow consistency
  onSaveWorkflow: () => void;
  onRunWorkflow: () => void;
  workflowJson: string;
  onUpdateFromJson?: (json: string) => void;
  currentWorkflow?: WorkflowResponse | null;
  onWorkflowLoaded?: (workflow: WorkflowResponse) => void;
}

type GuideItem =
  | { id: string; title: string; duration?: string; kind: "video"; src: string }
  | {
    id: string;
    title: string;
    duration?: string;
    kind: "text";
    content: string;
  };

const Header: React.FC<HeaderProps> = ({
  flowName,
  // Using underscore prefix to mark as intentionally unused variables
  // These props are kept for compatibility with the parent component
  runName: _runName,
  onFlowNameChange,
  onRunNameChange: _onRunNameChange,
  onSaveWorkflow,
  onRunWorkflow,
  workflowJson,
  onUpdateFromJson,
  currentWorkflow,
  onWorkflowLoaded,
}) => {
  const [isJsonDialogOpen, setIsJsonDialogOpen] = useState(false);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [editableJson, setEditableJson] = useState(workflowJson);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("api");
  const apiKey = useStore((state) => state.api_key);
  const [isCopied, setIsCopied] = useState(false);
  const [activeId, setActiveId] = useState<string>("introduction");
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [iframeRef, setIframeRef] = useState<HTMLIFrameElement | null>(null);

  const curlCommand = editableJson
    ? `curl -X POST '${RUN_API_URL}run-dag/' \\
            -H 'Content-Type: application/json' \\
            -H 'x-api-key: ${apiKey}' \\
            -d '${editableJson}'`
    : "Add something to canvas to get the Workflow API";

  // Update the editable JSON when the workflow JSON changes (one-way)
  useEffect(() => {
    if (isJsonDialogOpen) {
      setEditableJson(workflowJson);
    }
  }, [workflowJson, isJsonDialogOpen]);

  // Reset error state when dialog closes
  useEffect(() => {
    if (!isJsonDialogOpen) {
      setJsonError(null);
    }
  }, [isJsonDialogOpen]);

  const handleCopy = async () => {
    const contentToCopy = activeTab === "api" ? editableJson : curlCommand;

    try {
      await navigator.clipboard.writeText(contentToCopy);
      setIsCopied(true);
      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
        mixpanel.track(`User copied ${activeTab}`);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const sections: { title: string; items: GuideItem[] }[] = [
    {
      title: "Introduction",
      items: [
        {
          id: "introduction",
          title: "Introduction",
          duration: "—",
          kind: "text",
          content: `The Lyzr Studio Workflow Builder is a powerful visual interface that allows you to design, orchestrate, and manage AI-powered applications by chaining together agents and functional components. Using an intuitive drag-and-drop environment, you can define logical flows that let your AI agents interact, perform tasks, and respond intelligently based on predefined conditions.

Workflows are **single-shot** in nature. This means they start with one input, execute the complete flow, and return a result. Unlike chat agents, workflows are not conversational — they are best suited for structured, repeatable tasks.

Lyzr provides two orchestration approaches:
- **Manager**: Designed for **non-deterministic paths**, where the manager agent dynamically decides which agents to call and in what sequence.
- **Workflow**: Designed for **deterministic paths**, where the flow is predefined and executed step by step.

Together, these options give you flexibility in building both dynamic and rule-based AI systems.`,
        },
      ],
    },
    {
      title: "Advanced Topics",
      items: [
        {
          id: "basics",
          title: "Getting started",
          duration: "02:29",
          kind: "video",
          src: "https://www.youtube.com/embed/Fd9KfB7ZSbQ",
        },
        {
          id: "components",
          title: "Components",
          duration: "03:12",
          kind: "video",
          src: "https://www.youtube.com/embed/tvGkAV4BAYA",
        },
        {
          id: "integrate-workflows",
          title: "Integrate Workflows externally",
          duration: "—",
          kind: "text",
          content: `Once your workflow is built & saved, it automatically gets deployed, and you would be able to get the JSON as well as the Curl request on clicking the API button.
Then follow the steps mentioned in the document here to start using Workflows externally: 
[Docs](https://www.avanade.com/en-gb/services)`,
        },
      ],
    },
  ];

  // Handle play video for iframe from external button
  const handlePlayVideo = () => {
    if (iframeRef && active?.kind === "video") {
      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive) {
        mixpanel.track("Video-clicked", {
          feature: "Workflow Builder Guide",
          video: active.title,
        });
      }
      iframeRef.contentWindow?.postMessage(
        '{"event":"command","func":"playVideo","args":""}',
        "*",
      );
    }
  };

  const active = sections
    .flatMap((s) => s.items)
    .find((i) => i.id === activeId);

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableJson(e.target.value);
    setJsonError(null); // Clear error when user edits
  };

  const handleApplyJson = () => {
    try {
      // Validate JSON first
      JSON.parse(editableJson);

      // If we have an update handler, call it with the new JSON
      if (onUpdateFromJson) {
        onUpdateFromJson(editableJson);
        setIsJsonDialogOpen(false);
        toast.success("Workflow updated from JSON");
      }
    } catch (error) {
      setJsonError(`Invalid JSON: ${(error as Error).message}`);
    }
  };

  /* This function uses currentWorkflow but is currently not being used 
     as the Save to Server button is commented out in the JSX */
  // @ts-ignore: Kept for future use when Save to Server button is re-enabled
  async function handleSaveToServer() {
    // Changed to function declaration so unused vars don't trigger TS6133
    // First ensure the workflow is saved to generate the JSON
    onSaveWorkflow();

    try {
      // Parse the workflow JSON
      const workflowData = JSON.parse(workflowJson || "{}");

      if (!workflowData || Object.keys(workflowData).length === 0) {
        toast.error(
          "No workflow data to save. Please create a workflow first.",
        );
        return;
      }

      let response;

      if (currentWorkflow?.flow_id) {
        // Update existing workflow
        response = await updateWorkflow(
          currentWorkflow.flow_id,
          flowName,
          workflowData,
        );
      } else {
        // Create new workflow
        response = await saveWorkflow(flowName, workflowData);
      }

      if (response?.flow_id) {
        toast.success("Workflow saved to server successfully");
        if (onWorkflowLoaded) {
          onWorkflowLoaded(response);
        }
      }
    } catch (error) {
      console.error("Error saving workflow to server:", error);
      toast.error("Failed to save workflow to server");
    }
  }

  const handleSelectWorkflow = (workflow: WorkflowResponse) => {
    if (onUpdateFromJson && workflow.flow_data) {
      // Convert the flow_data to a string if it's not already
      const workflowJson =
        typeof workflow.flow_data === "string"
          ? workflow.flow_data
          : JSON.stringify(workflow.flow_data, null, 2);

      onUpdateFromJson(workflowJson);
      onFlowNameChange(workflow.flow_name);

      if (onWorkflowLoaded) {
        onWorkflowLoaded(workflow);
      }

      toast.success(`Loaded workflow: ${workflow.flow_name}`);
    }
  };

  const handleRunSavedWorkflow = async (flowId: string) => {
    try {
      const result = await executeWorkflow(flowId);
      toast.success("Workflow execution started");
      console.log("Workflow execution result:", result);
    } catch (error) {
      console.error("Error executing workflow:", error);
      toast.error("Failed to execute workflow");
    }
  };

  return (
    <header className="sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="mr-2 flex items-center space-x-4">
            <h1 className="flex items-center text-xl font-bold text-gray-900 dark:text-gray-50">
              <span className="mr-2 rounded-md bg-primary px-2 py-1 text-primary-foreground">
                LAO
              </span>
              <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
                Workflow
              </span>
            </h1>

            <div className="flex items-center space-x-2 rounded-lg bg-slate-100 px-3 py-1.5 dark:bg-slate-800/60">
              <input
                type="text"
                value={flowName}
                onChange={(e) => onFlowNameChange(e.target.value)}
                className="w-[180px] border-none bg-transparent px-2 py-1 text-sm font-medium focus:outline-none focus:ring-0 dark:text-gray-200"
                placeholder="Flow Name"
              />
              {/* Run name field removed as requested, now auto-generated and rotated after each run */}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* <div className="flex items-center mr-1 bg-slate-100 dark:bg-slate-800/50 rounded-md p-1">
              <Switch
                id="theme-toggle"
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
              <label htmlFor="theme-toggle" className="cursor-pointer px-1">
                {theme === 'dark' ? (
                  <Moon className="h-4 w-4 text-indigo-300" />
                ) : (
                  <Sun className="h-4 w-4 text-amber-500" />
                )}
              </label>
            </div> */}

            <WorkflowList
              onSelectWorkflow={handleSelectWorkflow}
              onRunWorkflow={handleRunSavedWorkflow}
            />

            <div className="flex items-stretch divide-x overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsHelpDialogOpen(true)}
                className="rounded-none px-3 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Info className="mr-2 h-4 w-4" /> Guide
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsJsonDialogOpen(true)}
                className="rounded-none px-3 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Code className="mr-2 h-4 w-4" /> Workflow API
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onSaveWorkflow}
                className="rounded-none px-3 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Save className="mr-2 h-4 w-4" /> Save
              </Button>
            </div>

            {/* <Button
              variant="outline"
              size="sm"
              onClick={handleSaveToServer}
              className="dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <Database className="h-4 w-4 mr-1" />
              Save to Server
            </Button> */}

            <Button
              variant="outline"
              onClick={onRunWorkflow}
              className="mr-2 flex items-center gap-2 px-4 py-2"
            >
              <Play className="h-4 w-4" />
              <span>Run</span>
            </Button>
          </div>
        </div>
      </div>

      {/* JSON Dialog */}
      <Dialog open={isJsonDialogOpen} onOpenChange={setIsJsonDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-2">
              <p>Workflow JSON</p>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {isCopied ? (
                  <>
                    <Check className="mr-1 size-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 size-4" /> Copy
                  </>
                )}
              </Button>
            </DialogTitle>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="api">Workflow JSON</TabsTrigger>
              <TabsTrigger value="run-workflow">Run Workflow API</TabsTrigger>
            </TabsList>
            <TabsContent value="api">
              <div className="p-2">
                <Textarea
                  value={editableJson}
                  onChange={handleJsonChange}
                  className="h-[55vh] resize-none overflow-auto font-mono text-sm"
                  spellCheck={false}
                />
                {jsonError && (
                  <p className="mt-2 text-sm text-red-500">{jsonError}</p>
                )}
              </div>
              <DialogFooter className="mt-4 flex items-center justify-between">
                {onUpdateFromJson && (
                  <Button onClick={handleApplyJson} disabled={!!jsonError}>
                    Apply JSON
                  </Button>
                )}
              </DialogFooter>
            </TabsContent>
            <TabsContent value="run-workflow">
              <div className="overflow-auto rounded-md border bg-secondary p-2">
                <pre className="h-[55vh] overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed">
                  {curlCommand}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
        <DialogContent className="h-[85vh] gap-2 overflow-hidden p-0 sm:max-w-5xl">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Workflow Guide
            </DialogTitle>
            <DialogDescription className="flex gap-2 text-sm font-normal text-muted-foreground">
              Learn to build powerful workflows.
              <Link
                to="https://www.avanade.com/en-gb/services"
                target="_blank"
                className="flex items-center text-link underline underline-offset-4"
                onClick={() => {
                  if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                    mixpanel.track("Docs-clicked", {
                      feature: "Workflow Builder Guide",
                    });
                }}
              >
                Docs
                <ExternalLink className="ml-1" size={14} />
              </Link>
            </DialogDescription>
          </DialogHeader>
          <div className="grid h-[70vh] grid-cols-[20rem_1fr]">
            <aside className="overflow-y-auto border-r">
              <ul className="px-2 py-2">
                {sections[0].items.map((item) => {
                  const selected = item.id === activeId;
                  return (
                    <li key={item.id}>
                      <Button
                        onClick={() => setActiveId(item.id)}
                        variant="ghost"
                        className={cn(
                          "w-full justify-between gap-2",
                          selected && "bg-secondary",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex h-6 w-6 items-center justify-center rounded-full border",
                              selected && "border-primary",
                            )}
                          >
                            {item.kind === "video" ? (
                              <Video className="h-3.5 w-3.5" />
                            ) : (
                              <FileText className="h-3.5 w-3.5" />
                            )}
                          </span>
                          <span className="text-sm">{item.title}</span>
                        </div>
                      </Button>
                    </li>
                  );
                })}
              </ul>

              <Separator />
              <div className="px-4 pb-2 pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {sections[1].title}
              </div>
              <ul className="px-2 pb-2">
                {sections[1].items.map((item) => {
                  const selected = item.id === activeId;
                  return (
                    <li key={item.id} className="mb-2">
                      <Button
                        onClick={() => setActiveId(item.id)}
                        variant="ghost"
                        className={cn(
                          "w-full justify-between",
                          selected && "bg-secondary",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex h-6 w-6 items-center justify-center rounded-full border",
                              selected && "border-primary",
                            )}
                          >
                            {item.kind === "video" ? (
                              <Video className="h-3.5 w-3.5" />
                            ) : (
                              <FileText className="h-3.5 w-3.5" />
                            )}
                          </span>
                          <span className="text-sm">{item.title}</span>
                        </div>
                        {item?.kind === "video" && (
                          <span className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {item.duration}
                          </span>
                        )}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            <main className="overflow-y-auto p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{active?.title}</h2>
                  {active?.kind === "video" && (
                    <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {active?.duration}
                      </span>
                    </div>
                  )}
                </div>
                {active?.kind === "video" && (
                  <Button onClick={handlePlayVideo}>
                    <Play className="mr-2 h-4 w-4" />
                    Play Video
                  </Button>
                )}
              </div>

              <div className="mt-3">
                {active?.kind === "video" ? (
                  <div className="rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950">
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted">
                      {isVideoLoading && (
                        <Skeleton className="absolute inset-0 h-full w-full" />
                      )}
                      <iframe
                        ref={setIframeRef}
                        title={active.title}
                        src={`${active.src}?enablejsapi=1`}
                        className="absolute inset-0 h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        onLoad={() => setIsVideoLoading(false)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border bg-background">
                    <div className="max-h-[min(56vh,520px)] overflow-y-auto px-2">
                      <div
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (
                            target.tagName === "A" ||
                            target.tagName === "svg"
                          ) {
                            if (
                              mixpanel.hasOwnProperty("cookie") &&
                              isMixpanelActive
                            )
                              mixpanel.track("Docs-clicked", {
                                feature: "Workflow Builder Guide",
                              });
                          }
                        }}
                      >
                        <MarkdownRenderer content={active?.content || ""} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
