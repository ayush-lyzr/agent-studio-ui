import { useState } from "react";
import { Code, Copy, Check } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { RAG_URL } from "@/lib/constants";
import mixpanel from "mixpanel-browser";
import { isMixpanelActive } from "@/lib/constants";

interface KnowledgeBaseApiDialogProps {
  ragId: string;
  apiKey: string;
  completeRagData: any;
  triggerClassName?: string;
  triggerText?: string;
  triggerIcon?: React.ReactNode;
}

export const KnowledgeBaseApiDialog = ({
  ragId,
  apiKey,
  completeRagData,
  triggerClassName,
  triggerText = "Knowledge Base API",
  triggerIcon = <Code className="mr-2 size-4" />,
}: KnowledgeBaseApiDialogProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("api");
  const { toast } = useToast();

  const getCurlCommand = (
    rag_id: string | undefined,
    query: string | undefined,
    apiKey: string,
  ): string => {
    if (!rag_id || query === undefined) return "";

    const baseUrl = `${RAG_URL}/v3/rag/${rag_id}/retrieve`;

    const searchParams = new URLSearchParams({
      query: "Mention users query here",
      top_k: "10",
      retrieval_type: "mmr",
      score_threshold: "0",
    });

    return `curl -X GET '${baseUrl}/?${searchParams.toString()}' \\
    -H 'Content-Type: application/json' \\
    -H 'x-api-key: ${apiKey}'`;
  };

  const handleCopy = async () => {
    const dataValues = JSON.stringify(completeRagData, null, 2);
    const contentToCopy =
      activeTab === "api" ? dataValues : getCurlCommand(ragId, "", apiKey);

    try {
      await navigator.clipboard.writeText(contentToCopy);
      setIsCopied(true);
      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive) {
        mixpanel.track(`User copied ${activeTab}`);
      }
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        variant: "destructive",
      });
    }
  };

  const dataValues = JSON.stringify(completeRagData, null, 2);

  return (
    <Dialog>
      <DialogTrigger
        className={triggerClassName || buttonVariants({ variant: "outline" })}
      >
        {triggerIcon}
        {triggerText}
      </DialogTrigger>
      <DialogContent className="top-[50%] max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <p>Knowledge Base API</p>
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
            <TabsTrigger value="api">Knowledge Base API JSON</TabsTrigger>
            <TabsTrigger value="inference">Inference</TabsTrigger>
          </TabsList>
          <TabsContent value="api" className="h-[40vh] overflow-auto">
            <div className="h-full overflow-auto rounded-md border bg-secondary p-2">
              <pre className="overflow-auto whitespace-pre-wrap break-all text-xs leading-relaxed">
                {dataValues}
              </pre>
            </div>
          </TabsContent>
          <TabsContent value="inference" className="h-[40vh] overflow-auto">
            <div className="h-full overflow-auto rounded-md border bg-secondary p-2">
              <pre className="whitespace-pre-wrap break-all text-xs leading-relaxed [overflow-wrap:anywhere]">
                {getCurlCommand(ragId, "", apiKey)}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
