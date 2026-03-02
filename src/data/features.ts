import { JSX } from "react";
// import { ConfigurePromptInjection } from "@/pages/create-agent/components/configure-prompt-injection";
import { ConfigureGroundedness } from "@/pages/create-agent/components/configure-groundedness";

export interface UpdateFeaturesOptions {
  shouldDirty?: boolean;
}

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
    options?: UpdateFeaturesOptions,
  ) => void;
  featureName: string;
  openDialog?: boolean;
  openPauseDialog?: boolean;
  initialConfig?: Record<string, any>;
}

export interface ExtraMemoryComponentProps {
  updateFeatures: (
    name: string,
    enabled: boolean,
    ragId?: string,
    ragName?: string,
    config?: {
      params?: {
        max_messages_context_count?: number;
      };
    },
  ) => void;
  featureName: string;
  openDialog?: boolean;
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

export const FEATURES_SECTIONS: FeaturesSectionsType = {
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
      TEXT_TO_SQL: {
        name: "features.data_query",
        type: "DATA_QUERY",
        title: "Data Query",
        description:
          "Answers questions instantly by querying and reading data from your data source",
        isEnabled: true,
        beta: false,
        extraComponent: undefined,
        help_video: "https://www.youtube.com/watch?v=yzn6xOGs9lk&t=2s",
        doc_link: "https://www.avanade.com/en-gb/services",
        api_link:
          "https://www.avanade.com/en-gb/services",
      },
      SCHEDULER: {
        name: "features.scheduler",
        type: "SCHEDULER",
        title: "Scheduler",
        description: "Schedules agent actions and tasks",
        isEnabled: true,
        extraComponent: undefined,
      },
      TRIGGER: {
        name: "features.trigger",
        type: "TRIGGER",
        title: "Webhook Trigger",
        description: "Webhook to trigger your agent programmatically via HTTP requests.",
        isEnabled: true,
        extraComponent: undefined,
      },
      MEMORY: {
        name: "features.memory",
        type: "MEMORY",
        title: "Memory",
        description:
          "Retains contextual memory. Applicable for conversational agents. Uses a combination of Short term & long term memory dynamically.",
        isEnabled: true,
        extraComponent: undefined,
        help_video: "https://www.youtube.com/watch?v=uIeLSSKP94s",
        doc_link: "https://www.avanade.com/en-gb/services",
      },
      // SHORT_MEMORY: {
      //   name: "features.shortMemory",
      //   type: "SHORT_TERM_MEMORY",
      //   title: "Short Term Memory",
      //   description:
      //     "Retains contextual memory. Applicable for conversational agents.",
      //   isEnabled: true,
      //   // help_video: "",
      //   help_video: "https://www.youtube.com/watch?v=uIeLSSKP94s",
      // },
      // LONG_TERM_MEMORY: {
      //   name: "features.longTermMemory",
      //   type: "LONG_TERM_MEMORY",
      //   title: "Long Term Memory",
      //   description:
      //     "Retains long term memory using retrieval and summarization strategies. Applicable for conversational agents.",
      //   isEnabled: true,
      //   help_video: "https://www.youtube.com/watch?v=c6CqSv82n00",
      // },
      // HUMANIZER: {
      //   name: "features.humanizer",
      //   type: "HUMANIZER",
      //   title: "Humanizer",
      //   description: "Adds human-like responses to the agent",
      //   isEnabled: true,
      //   help_video: "https://www.youtube.com/watch?v=Xibz152Vyg8",
      // },
      VOICE: {
        name: "features.voice",
        type: "VOICE",
        title: "Voice Agent",
        description: "Adds human-like voice responses to the agent",
        isEnabled: true,
        needs_upgrade: false,
        extraComponent: undefined,
        doc_link: "https://www.avanade.com/en-gb/services",
      },
      CONTEXT: {
        name: "features.context",
        type: "CONTEXT",
        title: "Context",
        description:
          "Provides additional context information to guide the agent's responses",
        isEnabled: true,
        extraComponent: undefined,
        help_video: "https://www.youtube.com/watch?v=tXDSy8JLdAs",
      },
      FILEASOUTPUT: {
        name: "features.fileasoutput",
        type: "FILEASOUTPUT",
        title: "File as Output",
        description:
          "Enable File as Output so your agent can share results as downloadable Docx, PDFs, CSVs or PPTs — for instance, a travel plan or analytics report.",
        isEnabled: true,
        extraComponent: undefined,
      },
      IMAGEASOUTPUT: {
        name: "features.imageasoutput",
        type: "IMAGEASOUTPUT",
        title: "Image as Output",
        description:
          "Enable Image as Output to let your agent generate images. Uploading an image for editing will be supported soon.",
        isEnabled: true,
        extraComponent: undefined,
      },
    },
  },

  RESPONSIBLE_AI: {
    title: "Safe & Responsible AI",
    description: "Add guardrails to make your AI safe, fair, and reliable.",
    needs_upgrade: false,
    features: {
      RESPONSIBLE_AI: {
        name: "features.RESPONSIBLE_AI",
        type: "RAI",
        title: "Responsible AI",
        description:
          "Analyze and ensure safety, fairness, and reliability of AI interactions. Allows you to configure and choose from multiple guardrails. Define RAI policies with features like: \n\nToxicity filtering \nPrompt Injection protection \nSecrets and PII masking \nAllowed & Banned Topics \nBlocked and Redacted Keywords",
        isEnabled: true,
        extraComponent: undefined,
        help_video: "https://youtu.be/Ccrn1pIwU7I?si=Bc7q8aRarwyDTjz",
        doc_link:
          "https://www.avanade.com/en-gb/services",
        api_link:
          "https://www.avanade.com/en-gb/services",
      },
      FAIRNESS: {
        name: "features.fairness",
        type: "FAIRNESS",
        title: "Fairness & Bias",
        description: "Monitors and reduces potential biases in responses",
        isEnabled: true,
        help_video: "https://www.youtube.com/watch?v=1gACl_J3kbU",
      },
      HUMAN_IN_LOOP: {
        name: "features.humanInLoop",
        type: "HUMAN_IN_LOOP",
        title: "Human-in-loop",
        description:
          "Enables human oversight and intervention in critical decisions",
        isEnabled: false,
      },
    },
  },

  HALLUCINATION_MANAGER: {
    title: "Hallucination Manager",
    needs_upgrade: false,
    description:
      "Prevent agents from hallucinating with built-in control modules.",
    features: {
      REFLECTION: {
        name: "features.reflection",
        type: "REFLECTION",
        title: "Reflection",
        description:
          "Enables the agent to reflect on its responses and improve accuracy",
        isEnabled: true,
        help_video: "https://www.youtube.com/watch?v=y9VTa775bCo",
      },
      GROUNDEDNESS: {
        name: "features.groundedness",
        type: "GROUNDEDNESS",
        title: "Groundedness",
        description:
          "Ensures responses are grounded in provided context and knowledge",
        isEnabled: true,
        extraComponent: ConfigureGroundedness,
      },
      // CONTEXT_RELEVANCE: {
      //   name: "features.contextRelevance",
      //   type: "CONTEXT_RELEVANCE",
      //   title: "Context Relevance",
      //   description: "Maintains relevance to the conversation context",
      //   isEnabled: true,
      // },
      LLM_AS_JUDGE: {
        name: "features.llmAsJudge",
        type: "UQLM_LLM_JUDGE",
        title: "LLM as Judge",
        description:
          "The 'LLM as a Judge' module uses an external agent to evaluate responses based on prompt and instruction context. Currently in beta, it logs a score in credit report for now. In future versions, it will also suggest updates to agent instructions",
        isEnabled: true,
        beta: true,
      },
      // LLM_AS_PANEL: {
      //   name: "features.llmAsPanel",
      //   type: "UQLM_JUDGE_PANEL",
      //   title: "LLM as Panel",
      //   description:
      //     "The 'LLM as a Panel' module uses an external set of agents to evaluate responses based on prompt and instruction context. Currently in beta, it logs a score in credit report for now. In future versions, it will also suggest updates to agent instructions",
      //   isEnabled: true,
      //   beta: true,
      // },
    },
  },
  // ...(!isDevEnv
  //   ? {
  //       SAFE_AI: {
  //         title: "Safe AI",
  //         features: {
  //           FAIRNESS: {
  //             name: "features.fairness",
  //             type: "FAIRNESS",
  //             title: "Fairness & Bias",
  //             description: "Monitors and reduces potential biases in responses",
  //             isEnabled: true,
  //             help_video: "https://www.youtube.com/watch?v=1gACl_J3kbU",
  //           },
  //           TOXICITY_CHECK: {
  //             name: "features.toxicityCheck",
  //             type: "TOXICITY_CHECK",
  //             title: "Toxicity Check",
  //             description: "Monitors and prevents toxic or harmful content",
  //             isEnabled: true,
  //             help_video: "https://www.youtube.com/watch?v=g8URuu3nVXM",
  //           },
  //           PII_REDACTION: {
  //             name: "features.piiRedaction",
  //             type: "PII",
  //             title: "PII Redaction",
  //             description:
  //               "Automatically detects and redacts personal identifiable information",
  //             isEnabled: true,
  //             extraComponent: undefined,
  //           },
  //           PROMPT_INJECTION: {
  //             name: "features.promptInjection",
  //             type: "PROMPT_INJECTION",
  //             title: "Prompt Injection",
  //             description:
  //               "Protects against malicious prompts injected by the user",
  //             isEnabled: true,
  //             extraComponent: ConfigurePromptInjection,
  //           },
  //           HUMAN_IN_LOOP: {
  //             name: "features.humanInLoop",
  //             type: "HUMAN_IN_LOOP",
  //             title: "Human-in-loop",
  //             description:
  //               "Enables human oversight and intervention in critical decisions",
  //             isEnabled: false,
  //           },
  //         },
  //       },
  //     }
  //   : {}),
};

export const FEATURES_CONFIG: FeaturesConfig = Object.values(
  FEATURES_SECTIONS,
).reduce<FeaturesConfig>(
  (acc, section) => ({
    ...acc,
    ...section.features,
  }),
  {},
);

export const isToolCallingFeature = (feature: any) =>
  feature.type === "TOOL_CALLING";
