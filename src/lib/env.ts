import { z } from "zod";

const envSchema = z.object({
  VITE_BASE_URL: z.string(),
  VITE_AUTH_URL: z.string(),
  VITE_ACI_REDIRECT_URL: z.string(),
  VITE_RAG_URL: z.string(),
  VITE_RAI_URL: z.string(),
  VITE_LAO_URL: z.string(),
  VITE_LIVEKIT_BACKEND_URL: z.string().optional(),
  VITE_BASE_MAIA_URL: z.string().optional(),
  VITE_MAIA_FRONTEND_URL: z.string().optional(),
  VITE_LAO_SOCKET_URL: z.string(),
  VITE_PAGOS_URL: z.string(),
  VITE_MARKETPLACE_URL: z.string(),
  VITE_TOPUP_PLANID: z.string(),
  VITE_MEMERSTACK_PUBLICKEY: z.string(),
  VITE_MEMERSTACK_PLANID: z.string(),
  VITE_MIXPANEL_KEY: z.string(),
  VITE_MIXPANEL_MODE: z.string(),
  VITE_FEATUREBASE_SECRET: z.string(),
  VITE_CRAWL_URL: z.string(),
  VITE_USERBACK_SECRET: z.string(),
  VITE_EVAL_SERVER_URL: z.string().optional(),
  VITE_VOICE_API_URL: z.string(),
  VITE_BEDROCK_LAMBDA_URL: z.string(),
  VITE_SLACK_API_SECRET_KEY: z.string(),
  VITE_HCAPTCHA_SITE_KEY: z.string(),
  VITE_IS_ENTERPRISE_DEPLOYMENT: z.string().transform((val) => val === "true"),
  VITE_IS_PROPHET_DEPLOYMENT: z
    .string()
    .optional()
    .default("false")
    .transform((val) => val === "true"),
  VITE_PROMPT_BUILDER_AGENT_ID: z.string(),
  VITE_KEYCLOAK_URL: z.string().optional(),
  VITE_KEYCLOAK_REALM: z.string().optional(),
  VITE_KEYCLOAK_CLIENT_ID: z.string().optional(),
  VITE_METRICS_WS_URL: z.string(),
  VITE_LYZR_MCP_URL: z.string(),
  VITE_CRAWL_API_KEY: z.string(),
  VITE_SCHEDULER_URL: z.string().optional(),
});

export const env = envSchema.parse(import.meta.env);
