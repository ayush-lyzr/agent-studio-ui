import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Database } from "lucide-react";
import { useRagDocsService } from "@/pages/knowledge-base-files/rag-docs.service";
import { useEffect, useState } from "react";

interface KnowledgeBaseNodeProps {
  data: any;
  onSettingsClick?: (data: any) => void;
  canEdit?: boolean;
}

const KnowledgeBaseNode: React.FC<KnowledgeBaseNodeProps> = ({ data }) => {
  const [ragData, setRagData] = useState<any>(null);

  const getRagId = () => {
    if (data?.parentAgent?.features) {
      const knowledgeBaseFeature = data.parentAgent.features.find(
        (feature: any) =>
          feature.type === "KNOWLEDGE_BASE" && feature.config?.lyzr_rag?.rag_id,
      );
      return knowledgeBaseFeature?.config?.lyzr_rag?.rag_id;
    }
    return null;
  };

  const ragId = getRagId() ?? data?._id ?? null;
  const canFetchRag = data?.isOwnBlueprint !== false;

  // Use the RAG service to fetch data (only when we own the blueprint / RAG)
  const { completeRagData } = useRagDocsService({
    rag_id: ragId || "",
    fetchEnabled: canFetchRag,
  });

  useEffect(() => {
    if (completeRagData) {
      setRagData(completeRagData);
    }
  }, [completeRagData]);

  const collectionName =
    ragData?.collection_name?.slice(0, -4) || data?.name || "Knowledge Base";
  const vectorStoreProvider = ragData?.vector_store_provider;
  const embeddingModel = ragData?.embedding_model;

  return (
    <div className="relative max-w-80 rounded-lg border border-success bg-card p-4 shadow-lg transition-shadow duration-200 hover:shadow-xl">
      <Handle
        type="target"
        position={Position.Top}
        className="h-3 w-3 border-2 border-border bg-muted"
      />

      {/* Node Header */}
      <div className="mb-3 flex items-start gap-3">
        <div className="flex-shrink-0 rounded-md bg-green-500/20 p-2 text-green-600 dark:text-green-400">
          <Database className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="mb-2 truncate text-sm font-medium text-foreground">
            {collectionName}
          </h3>
          {vectorStoreProvider && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Vector Store: {vectorStoreProvider}</span>
            </div>
          )}

          {embeddingModel && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Embedding: {embeddingModel}</span>
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="h-3 w-3 border-2 border-border bg-muted"
      />
    </div>
  );
};

export default KnowledgeBaseNode;
