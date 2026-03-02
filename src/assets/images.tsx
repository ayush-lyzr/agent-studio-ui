// Provider logo paths
export const modelImagesMap = {
  // Default fallback image
  default: "/placeholder-avatar.png",

  // Provider logos mapped to their provider IDs
  anthropic: "/provider-logos/anthropic.png",
  "aws-bedrock": "/provider-logos/aws-bedrock.png",
  Cohere: "/provider-logos/cohere.webp",
  deepseek: "/provider-logos/deepseek.png",
  perplexity: "/provider-logos/perplexity-ai.webp",
  google: "/provider-logos/google.png",
  groq: "/provider-logos/groq.png",
  huggingface: "/provider-logos/huggingface.svg",
  nvidia: "/provider-logos/nvidia.png",
  openai: "/provider-logos/openai.png",
  ultravox: "/provider-logos/ultravox.svg",
  watsonx: "/provider-logos/watsonx.png",
  deepgram: "/provider-logos/deepgram.webp",
  elevenlabs: "/provider-logos/elevenlabs.png",
  switchboard: "/provider-logos/accenture.png",
  azure: "/provider-logos/azure.png",
} as const;

// Data connector logo paths
export const dataConnectorImagesMap = {
  // Default fallback image
  default: "/placeholder-avatar.png",

  // Data connector logos mapped to their provider IDs
  redshift: "/data-connector-logos/redshift.png",
  postgres: "/data-connector-logos/postgres.png",
  mysql: "/data-connector-logos/mysql.png",
  bigquery: "/data-connector-logos/bigquery.svg",
  file_upload: "/data-connector-logos/file_upload.jpg",
  mongodb: "/data-connector-logos/mongodb.png",
  azuresql: "/data-connector-logos/azuresql.png",
  mssql: "/data-connector-logos/mssql.png",
  // Vector database connectors
  qdrant: "/data-connector-logos/qdrant.png",
  weaviate: "/data-connector-logos/weaviate.png",
  pg_vector: "/data-connector-logos/pg_vector.png",
  milvus: "/data-connector-logos/milvus.png",
  // Graph and distributed databases
  singlestore: "/data-connector-logos/singlestore.png",
  neo4j: "/data-connector-logos/neo4j.png",
  neptune: "/data-connector-logos/neptune.png",
} as const;

// Type for provider IDs (excluding the default key)
export type ProviderId = Exclude<keyof typeof modelImagesMap, "default">;

// Type for data connector IDs (excluding the default key)
export type DataConnectorId = Exclude<
  keyof typeof dataConnectorImagesMap,
  "default"
>;

// Helper function to get provider logo path with fallback
export const getProviderModelLogo = (providerId?: ProviderId): string => {
  if (!providerId || !(providerId in modelImagesMap)) {
    return modelImagesMap.default;
  }
  return modelImagesMap[providerId];
};

// Helper function to get data connector logo path with fallback
export const getDataConnectorLogo = (connectorId?: DataConnectorId): string => {
  if (!connectorId || !(connectorId in dataConnectorImagesMap)) {
    return dataConnectorImagesMap.default;
  }
  return dataConnectorImagesMap[connectorId];
};

// Tool logo paths
export const toolImagesMap = {
  // Default fallback image
  default: "/placeholder-avatar.png",

  // Tool logos mapped to their tool IDs
  clickup: "/tools-logos/clickup.png",
  discord: "/tools-logos/discord.svg",
  github: "/tools-logos/github.png",
  googledrive: "/tools-logos/googledrive.svg",
  googlecalendar: "/tools-logos/googlecalendar.svg",
  twitter: "/tools-logos/twitter.png",
  slack: "/tools-logos/slack.svg",
  gmail: "/tools-logos/gmail.svg",
  perplexityai: "/tools-logos/perplexityai.png",
  youtube: "/tools-logos/youtube.svg",
  outlook: "/tools-logos/outlook.svg",
  googletasks: "/tools-logos/googletasks.png",
  notion: "/tools-logos/notion.svg",
  calendly: "/tools-logos/calendly.svg",
  spotify: "/tools-logos/spotify.png",
  servicenow: "/tools-logos/servicenow.webp",
  hubspot: "/tools-logos/hubspot.webp",
  apollo: "/tools-logos/apollo.webp",
  brave_search: "/tools-logos/brave_search.svg",
  hackernews: "/tools-logos/hackernews.png",
  arxiv: "/tools-logos/arxiv.svg",
  x: "/tools-logos/twitter.png",
  composio_search: "/tools-logos/composio.png",
} as const;

// Type for tool IDs (excluding the default key)
export type ToolId = Exclude<keyof typeof toolImagesMap, "default">;

// Helper function to get tool logo path with fallback
export const getToolLogo = (toolId?: ToolId): string => {
  if (!toolId || !(toolId in toolImagesMap)) {
    return toolImagesMap.default;
  }
  return toolImagesMap[toolId];
};
