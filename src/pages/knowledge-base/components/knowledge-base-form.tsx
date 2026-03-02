import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, RefreshCw } from "lucide-react";
import useStore from "@/lib/store";
import axios, { AxiosResponse } from "axios";
import { toast } from "sonner";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import {
  useCredentials,
  useDataConnector,
} from "@/pages/configure/data-connectors/data-connector.service";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ICredential, Path } from "@/lib/types";
import { BASE_URL, RAG_URL } from "@/lib/constants";
import SchemaDocumentationAgentModal from "@/pages/knowledge-base/schema-documentation-agent-modal";
import LabelWithTooltip from "@/components/custom/label-with-tooltip";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { addAssetToGroup } from "@/services/groupsApiService";

const EMBEDDING_MODELS = [
  "text-embedding-3-small",
  "text-embedding-3-large",
  "text-embedding-ada-002",
  "nvidia/llama-3.2-nv-embedqa-1b-v2",
];

const generateRandomId = () => {
  const timestamp = Date.now().toString(36).slice(-2);
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const randomChars = Array(2)
    .fill(0)
    .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
    .join("");

  return timestamp + randomChars;
};

const formSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .regex(
        /^[a-z0-9_]*$/,
        "Name can only contain lowercase letters, numbers, and underscores",
      ),
    description: z.string().optional(),
    vector_db_credential_id: z.string().min(1, "Vector store is required"),
    vector_store_provider: z.string().min(1, "Vector store is required"),
    embedding_model: z.string().min(1, "Embedding model is required"),
    meta_data: z
      .object({
        database_id: z.string().optional(),
        database_name: z.string().optional(),
        database_provider_id: z.string().optional(),
        documentation_agent_id: z.string().optional(),
        documentation_agent_name: z.string().optional().nullable(),
      })
      .optional(),
    semantic_data_model: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.semantic_data_model && !data.meta_data?.database_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Database required for semantic knowledge base",
        path: ["meta_data.database_id"],
      });
    }
    if (data.semantic_data_model && !data.meta_data?.documentation_agent_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Description agent required for semantic knowledge base",
        path: ["meta_data.documentation_agent_id"],
      });
    }
  })
  .transform((obj) =>
    Object.entries(obj)
      .filter(([_, value]) => value !== undefined)
      .reduce((obj: any, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {}),
  );

export default function KnowledgeBaseForm({
  asSemantic,
  asGraph = false,
  onCancel,
  data,
  onSuccess,
}: {
  asSemantic: boolean;
  asGraph?: boolean;
  data?: any;
  onCancel: () => void;
  onSuccess?: (rag: any) => void;
}) {
  const navigate = useNavigate();
  const [params, _] = useSearchParams();
  const group_name = params.get("group_name");
  const [dataConnectors, setDataConnectors] = useState<any[]>([]);
  const [documentationAgentModal, setDocumentationAgentModal] =
    useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmbeddingCredential, setSelectedEmbeddingCredential] =
    useState<{ credentialId: string; providerId: string } | null>(null);

  const apiKey = useStore((state: any) => state.api_key);
  const token = useStore((state: any) => state.app_token);
  const current_organization = useManageAdminStore(
    (state) => state.current_organization,
  );
  const { getVectorStores } = useDataConnector({ apiKey });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: data ?? {
      name: data?.collection_name?.slice(0, -4),
      description: "",
      vector_db_credential_id: !asGraph ? "lyzr_qdrant_2" : "",
      vector_store_provider: !asGraph ? "Qdrant [Lyzr 2]" : "",
      embedding_model: "text-embedding-ada-002",
      semantic_data_model: asSemantic || false,
    },
  });

  const semantic_enabled = form.watch("semantic_data_model");

  const {
    data: databases = [],
    isFetching: isFetchingDatabases,
    refetch: getDatabases,
  } = useQuery({
    queryKey: ["getDatabases", apiKey],
    queryFn: (): Promise<AxiosResponse<ICredential, any>> =>
      axios.get(`/v3/providers/credentials/type/database`, {
        baseURL: BASE_URL,
        headers: { "x-api-key": apiKey },
      }),
    select: (res: AxiosResponse) => res.data?.credentials ?? [],
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: semantic_enabled && asSemantic && !!apiKey,
  });

  const {
    data: semantics = [],
    isFetching: isFetchingSemantics,
    refetch: getSemantics,
  } = useQuery({
    queryKey: ["getSemantics"],
    queryFn: () =>
      axios.get(`/v3/semantic_model/documentation_agents`, {
        baseURL: BASE_URL,
        headers: { "x-api-key": apiKey },
      }),
    select: (res: AxiosResponse) => res.data?.documentation_agents ?? [],
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: semantic_enabled && asSemantic && !!apiKey,
  });

  // For Weaviate credentials
  const { credentials: weaviateCredentials } = useCredentials({
    apiKey,
    providerType: "vector_store",
    providerId: "weaviate",
    enabled: !asGraph,
  });

  // For Qdrant credentials
  const { credentials: qdrantCredentials } = useCredentials({
    apiKey,
    providerType: "vector_store",
    providerId: "qdrant",
    enabled: !asGraph,
  });

  // For pg vector credentials
  const { credentials: pgVectorCredentials } = useCredentials({
    apiKey,
    providerType: "vector_store",
    providerId: "pg_vector",
    enabled: !asGraph,
  });

  // For singlestore credentials
  const { credentials: singlestoreCredentials } = useCredentials({
    apiKey,
    providerType: "vector_store",
    providerId: "singlestore",
    enabled: !asGraph,
  });

  // For milvus credentials
  const { credentials: milvusCredentials } = useCredentials({
    apiKey,
    providerType: "vector_store",
    providerId: "milvus",
    enabled: !asGraph,
  });

  // For yugabyte credentials
  const { credentials: yugabyteCredentials } = useCredentials({
    apiKey,
    providerType: "vector_store",
    providerId: "yugabyte",
    enabled: !asGraph,
  });

  // For neo4j credentials
  const { credentials: neo4jCredentials } = useCredentials({
    apiKey,
    providerType: "vector_store",
    providerId: "neo4j",
    enabled: asGraph,
  });

  // For neptune credentials
  const { credentials: neptuneCredentials } = useCredentials({
    apiKey,
    providerType: "vector_store",
    providerId: "neptune",
    enabled: asGraph,
  });

  // Fetch RAG credentials for embedding models
  const { data: ragCredentials = [] } = useQuery({
    queryKey: ["getRagCredentials", apiKey],
    queryFn: (): Promise<AxiosResponse<any, any>> =>
      axios.get(`${RAG_URL}/v3/credentials/`, {
        headers: { "x-api-key": apiKey },
      }),
    select: (res: AxiosResponse) => res.data?.credentials ?? [],
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: !!apiKey,
  });

  // Derive custom embedding models from RAG credentials
  const customEmbeddingModels = useMemo(() => {
    const embeddingModels: {
      model: string;
      credentialName: string;
      credentialId: string;
      providerId: string;
    }[] = [];

    for (const credential of ragCredentials) {
      // Only include embedding type credentials
      if (credential?.type !== "embedding") continue;

      // Use 'metadata' as returned by the API (models is an array of model names)
      const models = credential?.metadata?.models || [];
      const credentialName = credential?.name || "Custom";
      const credentialId = credential?.credential_id || credential?.id || "";
      const providerId = credential?.provider_id || "";

      // Add all models from credentials (models are strings)
      for (const model of models) {
        embeddingModels.push({ model, credentialName, credentialId, providerId });
      }
    }

    return embeddingModels;
  }, [ragCredentials]);

  const credentialMap: { [key: string]: any[] } = {
    weaviate: [
      {
        credential_id: "lyzr_weaviate",
        name: "Avanade",
        provider_id: "weaviate",
      },
      ...weaviateCredentials,
    ],
    qdrant: [
      {
        credential_id: "lyzr_qdrant_2",
        name: "Avanade 2",
        provider_id: "qdrant",
      },
      {
        credential_id: "lyzr_qdrant",
        name: "Avanade",
        provider_id: "qdrant",
      },
      ...qdrantCredentials,
    ],
    "pg_vector": pgVectorCredentials,
    singlestore: singlestoreCredentials,
    milvus: milvusCredentials,
    yugabyte: yugabyteCredentials,
    neo4j: neo4jCredentials,
    neptune: neptuneCredentials,
  };

  const handleVectorStoreChange = useCallback(
    (value: string) => {
      // Find matching store type
      const credential = Object.values(credentialMap)
        .reduce((acc, credentials) => acc.concat(credentials), [])
        .find((cred) => cred.credential_id === value);
      const dataConnector = dataConnectors?.find(
        (connector) => connector.provider_id === credential?.provider_id,
      );

      form.setValue("vector_db_credential_id", value);
      form.setValue(
        "vector_store_provider",
        `${dataConnector?.meta_data?.provider_name} [${credential?.name}]`,
      );
    },
    [credentialMap, dataConnectors],
  );

  const handleEmbeddingModelChange = useCallback(
    (value: string) => {
      form.setValue("embedding_model", value);

      // Check if this is a custom embedding model
      const customModel = customEmbeddingModels.find((m) => m.model === value);
      if (customModel) {
        setSelectedEmbeddingCredential({
          credentialId: customModel.credentialId,
          providerId: customModel.providerId,
        });
      } else {
        // Default model selected, use default credentials
        setSelectedEmbeddingCredential(null);
      }
    },
    [customEmbeddingModels, form],
  );

  const onSubmit = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      console.log(values);

      try {
        setIsSubmitting(true);

        const nameWithId = data
          ? data.collection_name
          : `${values.name}${generateRandomId()}`;

        const basePayload = {
          user_id: apiKey,
          description: values.description || "",
          semantic_data_model: values?.semantic_data_model,
        };

        const payload: any = data
          ? {
              ...basePayload,
              description: values.description || "",
            }
          : {
              ...basePayload,
              ...values,
              collection_name: nameWithId,
              // Use custom credential if a custom embedding model is selected
              llm_credential_id: selectedEmbeddingCredential
                ? selectedEmbeddingCredential.credentialId
                : "lyzr_openai",
              embedding_credential_id: selectedEmbeddingCredential
                ? selectedEmbeddingCredential.credentialId
                : "lyzr_openai",
              llm_model: selectedEmbeddingCredential
                ? `${selectedEmbeddingCredential.providerId}/gpt-4o-mini`
                : "gpt-4o-mini",
            };

        if (values?.meta_data) {
          payload.meta_data = values?.meta_data;
        }

        const url = data
          ? `${import.meta.env.VITE_RAG_URL}/v3/rag/${data.id}/`
          : `${import.meta.env.VITE_RAG_URL}/v3/rag/`;

        const method = data ? "put" : "post";
        console.log(payload);
        const response = await axios[method](url, payload, {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
        });

        if (response.status === 200) {
          toast.success(
            data
              ? "Knowledge base updated successfully"
              : "Knowledge base created successfully",
          );
          form.reset();
          // onOpenChange?.(false);
          if (data) {
            onSuccess?.(payload);
          } else {
            onSuccess?.(response.data);
            navigate(
              Boolean(response.data?.semantic_data_model)
                ? `/knowledge-base/semantic/${response.data?.id}`
                : `/knowledge-base/${response.data?.id}`,
              {
                state: {
                  collectionName: response.data?.collection_name,
                  meta_data: response.data?.meta_data ?? {},
                },
              },
            );
          }

          if (group_name && current_organization?._id && !data) {
            await addAssetToGroup(
              group_name,
              "knowledge_base",
              current_organization?._id,
              {
                asset_id: response.data?.id,
                asset_type: "knowledge_base",
                asset_name: values?.name,
                metadata: {
                  description: values?.description,
                },
              },
              token,
            );
          }
        }
      } catch (error: any) {
        toast.error(
          error.response?.data?.message ||
            `Failed to ${data ? "update" : "create"} knowledge base`,
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [apiKey, data, onSuccess, current_organization, token, selectedEmbeddingCredential],
  );

  const renderCredentials = (connector: ICredential) => {
    const providerName = connector.meta_data.provider_name;
    const credentials = credentialMap[connector.provider_id];

    if (credentials) {
      return credentials.map((cred) => {
        return (
          <SelectItem key={cred.credential_id} value={cred.credential_id}>
            {providerName} [{cred.meta_data?.name || cred?.name}]
          </SelectItem>
        );
      });
    }

    return null;
  };

  // Filter providers based on whether they're for graph or regular vector stores
  const filteredProviders = asGraph
    ? dataConnectors.filter((connector) =>
        ["neo4j", "neptune"].includes(connector.provider_id),
      )
    : dataConnectors.filter((connector) =>
        ["weaviate", "qdrant", "pg_vector", "singlestore", "milvus", "yugabyte"].includes(
          connector.provider_id,
        ),
      );

  useEffect(() => {
    if (data) {
      form.reset(data);
    } else {
      form.reset({
        name: "",
        description: "",
        vector_store_provider: "Qdrant [Lyzr 2]",
        vector_db_credential_id: "lyzr_qdrant_2",
        llm_embedding_model: EMBEDDING_MODELS[2],
        semantic_data_model: asSemantic,
      });
    }

    if (credentialMap["neo4j"]?.length && asGraph) {
      form.reset({
        vector_store_provider: `Neo4J [${credentialMap["neo4j"]?.[0]?.name}]`,
        vector_db_credential_id: credentialMap["neo4j"]?.[0]?.credential_id,
      });
    }
  }, [data, asSemantic, asGraph]);

  useEffect(() => {
    const fetchConnectors = async () => {
      try {
        const res = await getVectorStores();
        setDataConnectors(res.data);
      } catch (error) {
        toast.error("Failed to fetch data connectors");
      }
    };

    if (apiKey) {
      fetchConnectors();
    }

    return () => {
      form.reset();
    };
  }, [getVectorStores, apiKey]);

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-6"
        >
          <FormField
            control={form.control}
            name="name"
            defaultValue={data?.collection_name?.slice(0, -4)}
            render={({ field }) => (
              <FormItem className="col-span-1">
                <LabelWithTooltip
                  required
                  tooltip="Enter a unique name using only letters, numbers, and underscores"
                >
                  Name (Cannot be edited later)
                </LabelWithTooltip>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Name of your knowledge base"
                    disabled={!!data}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <LabelWithTooltip
                  required={false}
                  tooltip="Provide a brief description of your knowledge base"
                >
                  Description
                </LabelWithTooltip>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Description of your knowledge base"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="vector_db_credential_id"
              render={({ field }) => (
                <FormItem>
                  <LabelWithTooltip
                    required
                    tooltip="Select a vector store for storing and retrieving embeddings"
                  >
                    Vector Store
                  </LabelWithTooltip>
                  <FormControl>
                    <Select
                      value={field.value}
                      defaultValue={filteredProviders[0]?.credential_id}
                      disabled={!!data}
                      onValueChange={handleVectorStoreChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredProviders?.flatMap(renderCredentials)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="embedding_model"
              render={({ field }) => (
                <FormItem>
                  <LabelWithTooltip
                    required
                    tooltip="Choose the embedding model for converting text into vectors"
                  >
                    LLM Embedding Model
                  </LabelWithTooltip>
                  <FormControl>
                    <Select
                      value={field.value}
                      disabled={!!data}
                      onValueChange={handleEmbeddingModelChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMBEDDING_MODELS.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                        {customEmbeddingModels.map(({ model, credentialName }) => (
                          <SelectItem key={`${credentialName}-${model}`} value={model}>
                            {model} [{credentialName}]
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {semantic_enabled && (
              <>
                <FormField
                  control={form.control}
                  name="meta_data.database_id"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="inline-flex">
                        Connect a Database <p className="text-destructive">*</p>
                      </FormLabel>
                      <FormControl className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          {isFetchingDatabases ? (
                            <Skeleton className="col-span-2 h-10 w-full" />
                          ) : (
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue(
                                  "meta_data.database_provider_id",
                                  databases?.find(
                                    (db: ICredential) =>
                                      db.credential_id === value,
                                  )?.provider_id,
                                );
                                form.setValue(
                                  "meta_data.database_name",
                                  databases?.find(
                                    (db: ICredential) =>
                                      db.credential_id === value,
                                  )?.meta_data?.name,
                                );
                              }}
                              disabled={databases.length === 0}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    databases.length === 0
                                      ? "No databases to select"
                                      : "Select a database"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {databases?.map((db: any) => (
                                  <SelectItem
                                    key={db.credential_id}
                                    value={db.credential_id}
                                  >
                                    {db?.meta_data?.name ?? db?.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              getDatabases();
                            }}
                          >
                            <RefreshCw className="size-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <Link
                        to={Path.DATA_CONNECTORS}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          buttonVariants({ variant: "link" }),
                          "mt-2 p-0 text-sm text-indigo-600 hover:text-indigo-500",
                        )}
                      >
                        Create New
                        <ArrowTopRightIcon className="size-4" />
                      </Link>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meta_data.documentation_agent_id"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="inline-flex">
                        Schema Documentation Agent
                        <p className="text-destructive">*</p>
                      </FormLabel>
                      <div className="flex gap-2">
                        <FormControl className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            {isFetchingSemantics ? (
                              <Skeleton className="col-span-2 h-10 w-full" />
                            ) : (
                              <Select
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  form.setValue(
                                    "meta_data.documentation_agent_name",
                                    databases
                                      ?.find(
                                        (db: any) =>
                                          db._id === value || db.id === value,
                                      )
                                      ?.name?.slice(0, -21),
                                  );
                                }}
                                disabled={semantics.length === 0}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={
                                      semantics.length === 0
                                        ? "No agents to select"
                                        : "Select agent"
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {semantics?.map((semantic: any) => (
                                    <SelectItem
                                      key={semantic._id}
                                      value={semantic._id}
                                    >
                                      {semantic?.name?.slice(0, -21)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                getSemantics();
                              }}
                            >
                              <RefreshCw className="size-4" />
                            </Button>
                          </div>
                        </FormControl>
                      </div>
                      <FormDescription>
                        This agent is used to generate descriptions of tables
                        and columns in your database. Select an LLM below to
                        configure it automatically.
                      </FormDescription>
                      <Button
                        variant="link"
                        className={cn(
                          buttonVariants({ variant: "link" }),
                          "mt-2 p-0 text-sm text-indigo-600 hover:text-indigo-500",
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDocumentationAgentModal(true);
                        }}
                      >
                        Create New
                        <Plus className="size-4" />
                      </Button>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="inline-flex items-baseline gap-1">
              <p className="text-destructive">*</p>
              <p className="text-sm">marked as required</p>
            </span>
            <div className="flex items-center gap-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? data
                    ? "Updating..."
                    : "Creating..."
                  : data
                    ? "Update"
                    : "Create"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
      <SchemaDocumentationAgentModal
        open={documentationAgentModal}
        onOpen={setDocumentationAgentModal}
        onSuccess={() => {
          getSemantics();
        }}
      />
    </>
  );
}
