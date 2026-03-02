import React, { useMemo, useCallback } from "react";

import { FeatureConfig, type FeatureDefinition } from "@/data/features";
import { Badge } from "@/components/ui/badge";

type IFeatureBadge = {
  features: FeatureConfig[];
  feature: FeatureDefinition;
};

const FeatureBadge: React.FC<IFeatureBadge> = React.memo(
  ({ features, feature }) => {
    const getConfig = useCallback(
      (type: string) => features.find((f) => f.type === type)?.config ?? {},
      [features],
    );

    const kbConfig = useMemo(() => getConfig("KNOWLEDGE_BASE"), [getConfig]);
    const isAgenticRag = useMemo(
      () => kbConfig?.agentic_rag?.length > 0,
      [kbConfig],
    );
    const isNotConfigured = useMemo(
      () => !features.some((f) => !!f.config),
      [features],
    );

    const badgeTitle = useMemo(() => {
      switch (feature.type) {
        case "KNOWLEDGE_BASE":
          return isAgenticRag
            ? "Agentic RAG"
            : getConfig(feature.type).lyzr_rag?.rag_name?.slice(0, -4);
        case "TEXT_TO_SQL":
          return getConfig(feature.type).lyzr_rag?.rag_name;
        case "RESPONSIBLE_AI":
        case "RAI":
          return getConfig(feature.type)?.policy_name;
        case "MEMORY": {
          const memoryConfig = getConfig(feature.type);
          if (memoryConfig?.provider === "cognis") return null;
          return memoryConfig?.max_messages_context_count
            ? `${memoryConfig.max_messages_context_count} messages`
            : null;
        }
        case "CONTEXT":
          return getConfig(feature.type)?.context_name;
        case "IMAGEASOUTPUT":
          const model = getConfig(feature.type)?.model;
          if (!model) return null;
          const modelName = model.includes("/")
            ? model.substring(model.indexOf("/") + 1)
            : model;
          return modelName;
        default:
          return null;
      }
    }, [feature.type, isAgenticRag, getConfig]);

    if (isNotConfigured) {
      return <Badge variant="destructive">Not configured</Badge>;
    }

    if (
      ![
        "KNOWLEDGE_BASE",
        "TEXT_TO_SQL",
        "RAI",
        "MEMORY",
        "CONTEXT",
        "IMAGEASOUTPUT",
      ].includes(feature.type)
    ) {
      return null;
    }

    return (
      <div className="flex items-center gap-2">
        {badgeTitle && <Badge variant="outline">{badgeTitle}</Badge>}

        {feature.type === "KNOWLEDGE_BASE" && (
          <>
            {isAgenticRag ? (
              <Badge variant="outline">
                {kbConfig?.agentic_rag?.length} Knowledge Base(s)
              </Badge>
            ) : (
              kbConfig?.lyzr_rag?.params && (
                <Badge variant="outline">
                  {kbConfig?.lyzr_rag?.params?.top_k}
                  {Number(kbConfig?.lyzr_rag?.params?.top_k) === 1
                    ? " chunk"
                    : " chunks"}
                </Badge>
              )
            )}
          </>
        )}
      </div>
    );
  },
);

export default FeatureBadge;
