import { useState } from "react";
import { Code, Copy, Check } from "lucide-react";

import { Button } from "@/components/custom/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/custom/button";
import { BASE_URL, isMixpanelActive } from "@/lib/constants";
import mixpanel from "mixpanel-browser";
import { useToast } from "@/components/ui/use-toast";
import { IAgent } from "@/lib/types";

type IAgentApiDialog = {
  agentId?: string;
  sessionId: string;
  apiKey: string;
  payload: Partial<IAgent>;
  userName: string;
  hasUnsavedChanges: boolean;
};

const AgentApiDialog: React.FC<IAgentApiDialog> = ({
  agentId,
  sessionId,
  apiKey,
  payload: values,
  userName,
  hasUnsavedChanges,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("api");
  const [isCopied, setIsCopied] = useState(false);

  const curlCommand = agentId
    ? `curl -X POST '${BASE_URL}/v3/inference/chat/' \\
            -H 'Content-Type: application/json' \\
            -H 'x-api-key: ${apiKey}' \\
            -d '{
              "user_id": "${userName}",
              "agent_id": "${agentId}",
              "session_id": "${sessionId}",
              "message": ""
              }'`
    : "Please create your agent first to get the Inference endpoint";

  const getAgentAPIJson = () => {
    if (!agentId) {
      return "Agent JSON will appear once you create your agent.";
    }

    let payload = structuredClone(values);

    delete (payload as any).examples_visible;
    delete (payload as any).structured_output;
    delete (payload as any).structured_output_visible;

    return JSON.stringify(
      {
        ...payload,
        temperature: payload.temperature?.toString() ?? "",
        top_p: payload.top_p?.toString() ?? "",
      },
      null,
      2,
    );
  };

  const handleCopy = async () => {
    const contentToCopy = activeTab === "api" ? getAgentAPIJson() : curlCommand;

    try {
      await navigator.clipboard.writeText(contentToCopy);
      setIsCopied(true);
      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
        mixpanel.track(`User copied ${activeTab}`);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-none">
      <div className="flex justify-between">
        <Dialog>
          <DialogTrigger className={buttonVariants({ variant: "outline" })}>
            <Code className="mr-2 size-4" />
            Agent API
          </DialogTrigger>
          <DialogContent className="top-[50%] max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between pr-2">
                <p>Agent API</p>
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
              {hasUnsavedChanges && (
                <DialogDescription className="text-xs text-yellow-600">
                  Your agent changes are not saved. Update to view the latest
                  Agent JSON
                </DialogDescription>
              )}
            </DialogHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="api">Agent JSON</TabsTrigger>
                <TabsTrigger value="inference">Inference</TabsTrigger>
              </TabsList>
              <TabsContent
                value="api"
                className="h-[60vh] w-full overflow-auto"
              >
                <div className="h-[60vh] max-w-full overflow-auto rounded-md border bg-secondary p-2">
                  <pre
                    className="word-break whitespace-pre-wrap text-wrap break-words font-mono text-xs leading-relaxed"
                    style={{
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {getAgentAPIJson()}
                  </pre>
                </div>
              </TabsContent>
              <TabsContent value="inference" className="h-[60vh] overflow-auto">
                <div className="h-[60vh] overflow-auto rounded-md border bg-secondary p-2">
                  <pre className="overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed">
                    {curlCommand}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AgentApiDialog;
