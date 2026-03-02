import { z } from "zod";
import { RefObject, Dispatch, SetStateAction } from "react";

import { OpenAISchemaValidator } from "./components/openapi-schema-validator";

export const OpenApiSchema: z.ZodType<any> = z.object({
  title: z.string().optional(),
  multipleOf: z.number().optional(),
  maximum: z.number().optional(),
  exclusiveMaximum: z.boolean().optional(),
  minimum: z.number().optional(),
  exclusiveMinimum: z.boolean().optional(),
  maxLength: z.number().optional(),
  minLength: z.number().optional(),
  pattern: z.string().optional(),
  maxItems: z.number().optional(),
  minItems: z.number().optional(),
  uniqueItems: z.boolean().optional(),
  maxProperties: z.number().optional(),
  minProperties: z.number().optional(),
  required: z.array(z.string()).optional(),
  enum: z.array(z.any()).optional(),
  type: z
    .enum(["string", "number", "integer", "boolean", "array", "object"])
    .optional(),
  allOf: z.array(z.lazy(() => OpenApiSchema as z.ZodTypeAny)).optional(),
  oneOf: z.array(z.lazy(() => OpenApiSchema as z.ZodTypeAny)).optional(),
  anyOf: z.array(z.lazy(() => OpenApiSchema as z.ZodTypeAny)).optional(),
  not: z.lazy(() => OpenApiSchema as z.ZodTypeAny).optional(),
  items: z
    .union([
      z.lazy(() => OpenApiSchema as z.ZodTypeAny),
      z.array(z.lazy(() => OpenApiSchema as z.ZodTypeAny)),
    ])
    .optional(),
  properties: z
    .record(
      z.string(),
      z.lazy(() => OpenApiSchema as z.ZodTypeAny),
    )
    .optional(),
  additionalProperties: z
    .union([z.boolean(), z.lazy(() => OpenApiSchema as z.ZodTypeAny)])
    .optional(),
  description: z.string().optional(),
  format: z.string().optional(),
  default: z.any().optional(),
  nullable: z.boolean().optional(),
  discriminator: z
    .object({
      propertyName: z.string(),
      mapping: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
  readOnly: z.boolean().optional(),
  writeOnly: z.boolean().optional(),
  xml: z.any().optional(),
  externalDocs: z
    .object({
      description: z.string().optional(),
      url: z.string(),
    })
    .optional(),
  example: z.any().optional(),
  deprecated: z.boolean().optional(),
});

export const ResponseFormatSchema = z
  .object({
    name: z.string(),
    strict: z.boolean(),
    schema: z.any(),
  })
  .optional();

export const formSchema = ({
  scrollRef,
  setStructuredOpErrors,
}: {
  scrollRef: RefObject<HTMLDivElement>;
  setStructuredOpErrors: Dispatch<SetStateAction<string[]>>;
}) =>
  z
    .object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      agent_goal: z.string().optional(),
      agent_role: z.string().optional(),
      agent_instructions: z.string().optional(),
      optional_examples: z.string().optional(),
      store_messages: z.boolean().default(true),
      features: z
        .array(
          z.object({
            type: z.string(),
            config: z.record(z.any()).refine((config) => {
              if (
                config.type === "KNOWLEDGE_BASE" &&
                config.lyzr_rag &&
                (!config.lyzr_rag.rag_id || config.lyzr_rag.rag_id === "")
              ) {
                return false;
              }
              return true;
            }, "RAG ID is required for knowledge base"),
            priority: z.number(),
          }),
        )
        .default([]),
      tools: z
        .array(
          z.object({
            name: z.string(),
            usage_description: z.string(),
            tool_source: z.string().optional(),
            server_id: z.string().optional().nullable(),
            persist_auth: z.boolean().optional(),
            provider_uuid: z.string().optional(),
            credential_id: z.string().optional(),
          }),
        )
        .default([]),
      a2a_tools: z
        .array(
          z.object({
            base_url: z.string().min(5),
          }),
        )
        .default([]),
      tool_configs: z
        .array(
          z.object({
            tool_name: z.string(),
            action_names: z.array(z.string()).optional(),
            tool_source: z.string().optional(),
            persist_auth: z.boolean(),
            server_id: z.string().optional().nullable(),
            provider_uuid: z.string().optional(),
            credential_id: z.string().optional(),
          }),
        )
        .default([]),
      provider_id: z.string().min(1, "Provider is required"),
      model: z.string().optional(),
      temperature: z.number().min(0).max(1),
      top_p: z.number().min(0).max(1),
      llm_credential_id: z.string().optional(),
      examples: z.string().optional().nullable(),
      examples_visible: z.boolean().optional(),
      structured_output_visible: z.boolean().optional(),
      file_output: z.boolean().optional(),
      additional_model_params: z
        .record(z.string(), z.any())
        .nullable()
        .optional(),
      managed_agents: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            usage_description: z.string(),
          }),
        )
        .optional(),
      response_format: z.any().optional(),
      structured_output: z
        .string()
        .refine(
          (schema) => {
            try {
              // Validate that the schema is a valid JSON string
              let parsed;
              try {
                parsed = JSON.parse(schema);
              } catch {
                return false;
              }
              const responseFormatResult =
                ResponseFormatSchema.safeParse(parsed);
              const validator = new OpenAISchemaValidator();
              const result = validator.validate(
                responseFormatResult?.data?.schema ?? {},
              );
              console.log({ errosOP: result.errors });
              setStructuredOpErrors(result.errors);
              return result.isValid;
            } catch {
              scrollRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "end",
                inline: "nearest",
              });
              return false;
            }
          },
          {
            message: "Input must be a valid Open API Schema",
          },
        )
        .nullable()
        .optional(),
      max_iterations: z.number().min(1).max(50).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.provider_id && !data.model) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Model is required",
          path: ["model"],
        });
      }
    });
