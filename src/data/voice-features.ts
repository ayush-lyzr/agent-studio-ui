import { JSX } from "react";

export interface ExtraComponentProps {
  updateFeatures: (
    name: string,
    enabled: boolean,
    ragId?: string,
    ragName?: string,
    config?: {
      params?: {
        top_k?: number;
        retrieval_type?: string;
        score_threshold?: number;
      };
      [key: string]: any;
    },
  ) => void;
  featureName: string;
  openDialog?: boolean;
  openPauseDialog?: boolean;
  initialConfig?: Record<string, any>;
}

export interface FeatureConfig {
  type: string;
  priority: number;
  config: Record<string, any>;
}

export interface FeatureDefinition {
  name: string;
  type: string;
  title: string;
  description: string;
  isEnabled: boolean;
  needs_upgrade?: boolean;
  beta?: boolean;
  always_on?: boolean;
  help_video?: string;
  doc_link?: string;
  api_link?: string;
  extraComponent?: (props: ExtraComponentProps) => JSX.Element;
}

export interface FeatureSection {
  title: string;
  needs_upgrade?: boolean;
  description?: string;
  features: Record<string, FeatureDefinition>;
}

export type FeaturesConfig = Record<string, FeatureDefinition>;
export type FeaturesSectionsType = Record<string, FeatureSection>;

// Voice agent features - only Knowledge Base for now
export const VOICE_FEATURES_SECTIONS: FeaturesSectionsType = {
  CORE: {
    title: "Core Features",
    needs_upgrade: false,
    features: {
      RAG: {
        name: "features.rag",
        type: "KNOWLEDGE_BASE",
        title: "Knowledge Base",
        description:
          "Enables the agent to access a custom knowledge base for responses",
        isEnabled: true,
        extraComponent: undefined,
        help_video: "https://www.youtube.com/watch?v=wlc1diGPcdY",
        doc_link: "https://www.avanade.com/en-gb/services",
        api_link:
          "https://www.avanade.com/en-gb/services",
      },
    },
  },
};

export const VOICE_FEATURES_CONFIG: FeaturesConfig = Object.values(
  VOICE_FEATURES_SECTIONS,
).reduce<FeaturesConfig>(
  (acc, section) => ({
    ...acc,
    ...section.features,
  }),
  {},
);

export const isToolCallingFeature = (feature: any) =>
  feature.type === "TOOL_CALLING";
