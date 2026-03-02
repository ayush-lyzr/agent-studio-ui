import { Button } from "@/components/ui/button";
import { Tabs, TabsTrigger, TabsList, TabsContent } from "@/components/ui/tabs";
import { X, Settings } from "lucide-react";
import { useState } from "react";
import { useRagDocsService } from "@/pages/knowledge-base-files/rag-docs.service";
import RagRetrieval from "@/pages/knowledge-base-files/RagRetrieval";
import { Label } from "@/components/ui/label";

export default function KnowledgeBaseConfig({
  node,
  onClose,
}: {
  node: any;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState("info");

  const getRagIdFromParent = () => {
    if (node?.data?.parentAgent?.features) {
      const knowledgeBaseFeature = node.data.parentAgent.features.find(
        (feature: any) =>
          feature.type === "KNOWLEDGE_BASE" && feature.config?.lyzr_rag?.rag_id,
      );
      return knowledgeBaseFeature?.config?.lyzr_rag?.rag_id;
    }
    return null;
  };

  const ragId =
    getRagIdFromParent() ??
    (node?.type === "knowledgeBase" ? node?.id ?? node?.data?._id : null);
  const canFetchRag = node?.data?.isOwnBlueprint !== false;
  const { completeRagData, ragDocuments } = useRagDocsService({
    rag_id: ragId || "",
    fetchEnabled: canFetchRag,
  });

  return (
    <div className="absolute right-0 top-0 z-[70] flex h-full w-[500px] flex-col overflow-hidden border-l border-border bg-card shadow-xl">
      <div className="mb-3 flex items-center justify-between border-b p-4">
        <h2 className="text-base font-semibold">
          Knowledge Base Configuration
        </h2>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="mx-3 mb-2 mt-2 grid h-8 w-full flex-shrink-0 grid-cols-2 bg-secondary">
            <TabsTrigger value="info" className="h-6 px-2 text-xs">
              Info
            </TabsTrigger>
            <TabsTrigger value="retrieve" className="h-6 px-2 text-xs">
              Retrieve
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="flex-1 overflow-y-auto p-4">
            {ragId ? (
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-medium">
                    RAG Configuration
                  </h3>
                </div>

                {completeRagData && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-semibold">
                        Collection Name
                      </Label>
                      <div className="text-sm">
                        {completeRagData.collection_name?.slice(0, -4) || "N/A"}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">
                        Description
                      </Label>
                      <div className="text-sm">
                        {completeRagData.description || "No description"}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">
                        Vector Store
                      </Label>
                      <div className="text-sm">
                        {completeRagData.vector_store_provider || "N/A"}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">
                        Embedding Model
                      </Label>
                      <div className="text-sm">
                        {completeRagData.embedding_model || "N/A"}
                      </div>
                    </div>

                    {ragDocuments && (
                      <div>
                        <Label className="text-xs font-semibold">
                          Documents Count
                        </Label>
                        <div className="text-sm">
                          {ragDocuments.length || 0} documents
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t pt-4">
                  <h2 className="mb-4 text-center text-xl">File name</h2>
                  <ul className="space-y-2">
                    {ragDocuments.map((doc: any, index: number) => (
                      <li
                        key={index}
                        className="rounded bg-secondary px-4 py-2 transition"
                      >
                        {doc}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Settings className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p className="text-sm">No knowledge base configured</p>
                <p className="text-xs">
                  Configure KNOWLEDGE_BASE feature in parent agent
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="retrieve" className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <RagRetrieval
                ragId={ragId}
                ragData={ragDocuments}
                isGraphRag={
                  completeRagData?.vector_store_provider
                    ?.toLowerCase()
                    ?.includes("neo4j") ||
                  completeRagData?.vector_store_provider
                    ?.toLowerCase()
                    ?.includes("neptune")
                }
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
