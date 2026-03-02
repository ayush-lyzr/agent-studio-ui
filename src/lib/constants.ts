import { env } from "./env";

export const BASE_URL: string = env.VITE_BASE_URL ?? "";
export const PAGOS_URL: string = env.VITE_PAGOS_URL ?? "";
export const MARKETPLACE_URL: string = env.VITE_MARKETPLACE_URL ?? "";
export const RAG_URL: string = env.VITE_RAG_URL ?? "";
export const RAI_URL: string = env.VITE_RAI_URL ?? "";
export const MAIA_URL: string = env.VITE_BASE_MAIA_URL ?? "";
export const MAIA_FRONTEND_URL: string = env.VITE_MAIA_FRONTEND_URL ?? "";
export const RUN_API_URL: string = env.VITE_LAO_URL ?? "";
export const RUN_SOCKET_URL: string = env.VITE_LAO_SOCKET_URL ?? "";
export const WEBSOCKET_URL: string = "wss://metrics.studio.lyzr.ai";
export const METRICS_WS_URL: string = env.VITE_METRICS_WS_URL ?? "";
export const EVAL_SERVER_URL: string =
  env.VITE_EVAL_SERVER_URL ?? "http://localhost:8200";
export const CRAWL_URL: string =
  env.VITE_CRAWL_URL ??
  (import.meta.env.DEV ? "/api/crawl" : "http://52.3.225.193:8080");
export const AGENT_STUDIO_USER: string = "agent_studio_user";
export const TOP_UP_PRICEID = env.VITE_TOPUP_PLANID ?? "";
export const MEMBERSTACK_PUBLICKEY: string =
  env.VITE_MEMERSTACK_PUBLICKEY ?? "";
export const MEMBERSTACK_PLANID: string = env.VITE_MEMERSTACK_PLANID ?? "";
export const MIXPANEL_KEY: string = env.VITE_MIXPANEL_KEY ?? "";
export const MIXPANEL_MODE: string = env.VITE_MIXPANEL_MODE ?? "";
export const isMixpanelActive: boolean = MIXPANEL_MODE !== "dev";
export const isDevEnv: boolean = MIXPANEL_MODE === "dev";
export const FEATUREBASE_SECRET = env.VITE_FEATUREBASE_SECRET ?? "";
export const CRAWL_URL_API_KEY: string = env.VITE_CRAWL_API_KEY ?? "";
export const DEFAULT_ERROR_MESSAGE =
  "Sorry. Unknown internal issue. This event is logged and the team will look into this.";
export const BEDROCK_LAMBDA_URL: string = env.VITE_BEDROCK_LAMBDA_URL ?? "";
export const IS_ENTERPRISE_DEPLOYMENT =
  env.VITE_IS_ENTERPRISE_DEPLOYMENT ?? false;
export const IS_PROPHET_DEPLOYMENT = env.VITE_IS_PROPHET_DEPLOYMENT ?? false;
export const KEYCLOAK_URL = env.VITE_KEYCLOAK_URL ?? "http://localhost:8080";
export const KEYCLOAK_REALM = env.VITE_KEYCLOAK_REALM ?? "lyzr-dev";
export const KEYCLOAK_CLIENT_ID = env.VITE_KEYCLOAK_CLIENT_ID ?? "web-client";
export const PROMPT_BUILDER_AGENT_ID = env.VITE_PROMPT_BUILDER_AGENT_ID;
export const VOICE_API_URL: string = env.VITE_VOICE_API_URL ?? "";
export const LYZR_MCP_URL: string = env.VITE_LYZR_MCP_URL ?? "";
export const ACI_REDIRECT_URL: string =
  env.VITE_ACI_REDIRECT_URL ??
  "https://lyzr-aci.studio.lyzr.ai/v1/linked-accounts/oauth2/callback";
export const HCAPTCHA_SITE_KEY: string = env.VITE_HCAPTCHA_SITE_KEY ?? "";
export const SCHEDULER_URL: string =
  env.VITE_SCHEDULER_URL ?? "";

export enum PlanType {
  Community = "Community",
  Starter = "Starter",
  Pro = "Pro",
  Teams = "Teams",
  Organization = "Organization",
  Enterprise = "Enterprise",
  Pro_Yearly = "Pro Yearly",
  Teams_Yearly = "Teams Yearly",
  Organization_Yearly = "Organization Yearly",
  Enterprise_Yearly = "Enterprise Yearly",
  Custom = "Custom",
}

export const planBadgeColor = (plan: PlanType | undefined) => {
  switch (plan) {
    case PlanType.Community:
      return "bg-zinc-200 dark:bg-zinc-500";
    case PlanType.Starter:
      return "bg-purple-200 dark:bg-purple-500";
    case PlanType.Pro:
      return "bg-orange-200 dark:bg-orange-500";
    case PlanType.Organization:
      return "bg-emerald-200 dark:bg-emerald-500";
    case PlanType.Custom:
      return "bg-yellow-200 dark:bg-yellow-600";
    default:
      return "bg-primary";
  }
};

export const INDUSTRY_OPTIONS = [
  "Software & IT Services",
  "Banking & Financial Services",
  "Insurance",
  "Capital Markets",
  "Healthcare & Life Sciences",
  "Energy & Utilities",
  "Retail & E-commerce",
  "Media & Entertainment",
  "Professional Services",
  "Manufacturing",
  "Transportation & Logistics",
  "Education & EdTech",
  "Government & Public Sector",
  "Telecommunications",
  "Hospitality & Travel",
  "Construction & Real Estate",
  "Consumer Goods",
  "Nonprofits & NGOs",
  "Other",
];

export const FUNCTION_OPTIONS = [
  "Sales",
  "Marketing",
  "Finance",
  "Human Resources (HR)",
  "Customer Service",
  "Engineering & IT",
  "Strategy & Business Development",
  "Operations & Supply Chain",
  "Legal, Risk & Compliance",
  "Design & Creative",
  "Education & Training",
  "Data Analytics",
  "Research",
];

export const CATEGORY_OPTIONS = [
  "Productivity & Cost Savings",
  "Revenue Generation",
  "Customer Experience",
];

export const sampleJsonExample = {
  name: "user_data",
  strict: true,
  schema: {
    type: "object",
    properties: {
      tweet: {
        type: "string",
        description: "Content of the tweet",
      },
      title: {
        type: "string",
        description: "Title of the tweet",
      },
    },
    additionalProperties: false,
    required: ["tweet", "title"],
  },
};

export enum PlanCommunity {
  TOOL_LIMIT = Infinity, // 5,
  AGENT_LIMIT = Infinity, // 10,
  KB_LIMIT = Infinity, // 5,
}

export enum PlanStarter {
  TOOL_LIMIT = Infinity, // 10,
  AGENT_LIMIT = Infinity, // 15,
  KB_LIMIT = Infinity, // 10,
}

export enum PlanPro {
  TOOL_LIMIT = Infinity, // 25,
  AGENT_LIMIT = Infinity, // 25,
  KB_LIMIT = Infinity, // 15,
}

export enum PlanCustom {
  TOOL_LIMIT = Infinity,
  AGENT_LIMIT = Infinity,
  KB_LIMIT = Infinity,
}

export const DEFAULT_MAX_FILE_SIZE_DAG = 15;

export const CREDITS_DIVISOR = 100;

export const REASONING_MODELS = [
  "o1",
  "o1-preview",
  "o1-mini",
  "o3-mini",
  "deepseek/deepseek-reasoner",
];

export const KB_UPLOAD_DISCLAIMER_ONE = `
By uploading documents to Lyzr, you confirm that you have the right to share the information contained within them. 
You must not upload any documents that contain sensitive personal data (such as health records, financial information,
government IDs) unless you have obtained the necessary consents and comply with all applicable data protection laws.
`;

export const KB_UPLOAD_DISCLAIMER_TWO = `
By using this service, you agree to indemnify and hold harmless, Lyzr.ai and its affiliates, officers, employees, 
and agents from any claims, liabilities, damages, losses, or expenses (including legal fees) arising from your failure 
to comply with this policy, including but not limited to the unauthorized upload of sensitive personal data.
`;

export const LYZR_PHONE_NUMBERS = [
  "+14843312860",
  "+12494028652",
  "+12175681771",
  "+19148735520",
  "+19787802579",
  "+12175683787",
  "+61255642219",
  "+16067210709",
  "+61348328309",
  "+19189182033",
  "+18144858388",
  "+19189182033",
  "+12056541821",
];

export const nvidiaModelDisplayNames: Record<string, string> = {
  "nvidia_nim/abacusai/dracarys-llama-3.1-70b-instruct":
    "Dracarys Llama 3.1-70b Instruct",
  "nvidia_nim/ai21labs/jamba-1.5-large-instruct": "Jamba 1.5 Large Instruct",
  "nvidia_nim/ai21labs/jamba-1.5-mini-instruct": "Jamba 1.5 Mini Instruct",
  "nvidia_nim/deepseek-ai/deepseek-r1": "DeepSeek R1",
  "nvidia_nim/deepseek-ai/deepseek-r1-distill-llama-8b":
    "DeepSeek R1 Distill Llama 8b",
  "nvidia_nim/deepseek-ai/deepseek-r1-distill-qwen-7b":
    "DeepSeek R1 Distill Qwen 7b",
  "nvidia_nim/deepseek-ai/deepseek-r1-distill-qwen-14b":
    "DeepSeek R1 Distill Qwen 14b",
  "nvidia_nim/meta/llama-3.1-8b-instruct": "Llama 3.1 8b Instruct",
  "nvidia_nim/meta/llama-3.1-70b-instruct": "Llama 3.1 70b Instruct",
  "nvidia_nim/meta/llama-3.1-405b-instruct": "Llama 3.1 405b Instruct",
  "nvidia_nim/meta/llama-3.2-1b-instruct": "Llama 3.2 1b Instruct",
  "nvidia_nim/meta/llama-3.2-3b-instruct": "Llama 3.2 3b Instruct",
  "nvidia_nim/microsoft/phi-3.5-moe-instruct": "Phi 3.5 MoE Instruct",
  "nvidia_nim/microsoft/phi-4-mini-instruct": "Phi 4 Mini Instruct",
  "nvidia_nim/nvidia/llama-3.1-nemotron-nano-8b-v1":
    "Llama 3.1 Nemotron Nano 8b v1",
  "nvidia_nim/nvidia/llama-3.1-nemotron-51b-instruct":
    "Llama 3.1 Nemotron 51b Instruct",
  "nvidia_nim/nvidia/llama-3.1-nemotron-70b-instruct":
    "Llama 3.1 Nemotron 70b Instruct",
  "nvidia_nim/nvidia/llama3-chatqa-1.5-70b": "Llama3 ChatQA 1.5 70b",
  "nvidia_nim/nvidia/nemotron-4-mini-hindi-4b-instruct":
    "Nemotron 4 Mini Hindi 4b Instruct",
  "nvidia_nim/nvidia/nemotron-mini-4b-instruct": "Nemotron Mini 4b Instruct",
  "nvidia_nim/nv-mistralai/mistral-nemo-12b-instruct":
    "Mistral Nemo 12b Instruct",
  "nvidia_nim/qwen/qwen2.5-7b-instruct": "Qwen2.5 7b Instruct",
  "nvidia_nim/qwen/qwen2.5-coder-7b-instruct": "Qwen2.5 Coder 7b Instruct",
  "nvidia_nim/qwen/qwen2.5-coder-32b-instruct": "Qwen2.5 Coder 32b Instruct",
  "nvidia_nim/writer/palmyra-fin-70b-32k": "Palmyra Fin 70b 32k",
  "nvidia_nim/nvidia/llama-3.3-nemotron-super-49b-v1.5":
    "Llama 3.3 Nemotron Super 49b v1.5",
  "nvidia_nim/nvidia/nemotron-3-nano-30b-a3b": "Nemotron 3 Nano 30b A3b",
  "nvidia_nim/nvidia/riva-translate-4b-instruct-v1.1":
    "Riva Translate 4b Instruct v1.1",
};
