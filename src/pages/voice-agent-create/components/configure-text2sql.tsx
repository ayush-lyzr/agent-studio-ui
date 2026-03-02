import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { Info, RefreshCw } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import useStore from "@/lib/store";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { RAG_URL } from "@/lib/constants";
import { AxiosResponse } from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import SchemaDocumentationAgentModal from "@/pages/knowledge-base/schema-documentation-agent-modal";

interface ConfigureText2SqlProps {
  featureName: string;
  openDialog?: boolean;
  updateFeatures: (
    name: string,
    enabled: boolean,
    ragId?: string,
    ragName?: string,
    config?: Record<string, string | number | boolean>,
  ) => void;
}

const LabelWithTooltip = ({
  children,
  tooltip,
  required,
}: {
  children: React.ReactNode;
  tooltip: string;
  required: boolean;
}) => {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger className="flex cursor-help items-center gap-1">
          <FormLabel className="inline-flex cursor-help">
            {children} {required && <p className="text-destructive">*</p>}
          </FormLabel>
          <Info className="h-4 w-4 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const ConfigureText2Sql: React.FC<ConfigureText2SqlProps> = ({
  featureName,
  openDialog,
  updateFeatures,
}) => {
  const parentForm = useFormContext();
  const [open, setOpen] = useState(false);
  const [documentationAgentModal, setDocumentationAgentModal] =
    useState<boolean>(false);

  const formSchema = z
    .object({
      docs_rag_id: z.string(),
      examples_rag_id: z.string().optional(),
      max_tries: z.number(),
      time_limit: z.number(),
      auto_train: z.boolean().optional(),
    })
    .superRefine((data, ctx) => {
      if (data?.auto_train && !data?.examples_rag_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "To auto train the agent, please select a knowledge base",
          path: ["examples_rag_id"],
        });
      }
    });

  const apiKey = useStore((state: any) => state.api_key);
  const existingFeatures = parentForm?.watch("features") || [];
  const existingTextToSqlConfig = existingFeatures.find(
    (feature: any) => feature.type === "DATA_QUERY",
  );

  const existingConfig = existingTextToSqlConfig?.config;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: existingConfig?.lyzr_rag?.rag_id
      ? existingConfig
      : {
          max_tries: 3,
          time_limit: 60,
          auto_train: false,
        },
  });

  const auto_train = form.watch("auto_train");

  const {
    refetch: fetchSemanticKbs,
    data: semanticKbs = [],
    isFetching: isFetchingSemanticKbs,
  } = useQuery({
    queryKey: ["getSemanticKnowledgeBases"],
    queryFn: () =>
      axios.get(`/v3/rag/user/${apiKey}/?semantic_data_models=true`, {
        baseURL: RAG_URL,
        headers: { "x-api-key": apiKey },
      }),
    select: (res: AxiosResponse) => res.data?.configs ?? [],
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: open,
  });

  const {
    refetch: fetchNonSemanticKbs,
    data: knowledgeBases = [],
    isFetching: isFetchingKbs,
  } = useQuery({
    queryKey: ["getKnowledgeBases"],
    queryFn: () =>
      axios.get(`/v3/rag/user/${apiKey}/?semantic_data_models=false`, {
        baseURL: RAG_URL,
        headers: { "x-api-key": apiKey },
      }),
    select: (res: AxiosResponse) => res.data?.configs ?? [],
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: open && auto_train,
  });

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && !form.getValues("docs_rag_id")) {
      updateFeatures(featureName, false);
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const rag_name = semanticKbs
      ?.find((kb: { _id: string }) => kb?._id === values.docs_rag_id)
      ?.collection_name?.slice(0, -4);
    updateFeatures(featureName, true, values.docs_rag_id, rag_name, {
      ...values,
      rag_url: RAG_URL,
    });
    form.reset({ docs_rag_id: values.docs_rag_id });
    setOpen(false);
  };

  useEffect(() => {
    if (openDialog) {
      setOpen(true);
    }
  }, [openDialog]);

  useEffect(() => {
    if (existingConfig) {
      Object.keys(existingConfig).forEach((key) => {
        // @ts-ignore
        form.setValue(key, existingConfig[key]);
      });
    }
  }, [existingConfig, form]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: "link" }),
          "p-0 text-indigo-600 animate-in slide-in-from-top-2 hover:text-indigo-500",
        )}
      >
        Configure
        <ArrowTopRightIcon className="size-4" />
      </DialogTrigger>
      <Form {...form}>
        <DialogContent className="max-w-2xl !rounded-xl data-[state=closed]:slide-out-to-bottom-[75%] data-[state=open]:slide-in-from-bottom-[75%]">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col space-y-4"
          >
            <DialogHeader>
              <DialogTitle>Configure Data Query</DialogTitle>
              <DialogDescription>
                Answers questions instantly by querying and reading data from
                your data source
              </DialogDescription>
            </DialogHeader>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="docs_rag_id"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="inline-flex">
                      Semantic Data Model
                      <p className="text-destructive">*</p>
                    </FormLabel>
                    <div className="flex gap-2">
                      <FormControl className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          {isFetchingSemanticKbs ? (
                            <Skeleton className="col-span-2 h-10 w-full" />
                          ) : (
                            <Select
                              value={field.value}
                              onValueChange={(value) => field.onChange(value)}
                              disabled={semanticKbs?.length === 0}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    semanticKbs?.length === 0
                                      ? "No agents to select"
                                      : "Select semantic model"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {semanticKbs?.map((agent: any) => (
                                  <SelectItem key={agent._id} value={agent._id}>
                                    {agent?.collection_name?.slice(0, -4)}
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
                              fetchSemanticKbs();
                            }}
                          >
                            <RefreshCw
                              className={cn(
                                "size-4",
                                status === "fetchingSemantic" && "animate-spin",
                              )}
                            />
                          </Button>
                        </div>
                      </FormControl>
                    </div>
                    <Link
                      to="/knowledge-base"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "link" }),
                        "mt-2 p-0 text-indigo-600 hover:text-indigo-500",
                      )}
                    >
                      Create New
                    </Link>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max_tries"
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <LabelWithTooltip
                      required
                      tooltip="Maximum number of times the system will try to generate the analysis. Minimum is 1."
                    >
                      Maximum number of tries
                    </LabelWithTooltip>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="3"
                        min={1}
                        {...field}
                        onChange={(e) => {
                          field.onChange(Number(e.target.value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time_limit"
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <LabelWithTooltip
                      required
                      tooltip="The total number of seconds used to generate the analysis. If this is zero or negative, it is disregarded."
                    >
                      Generation time limit (seconds)
                    </LabelWithTooltip>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="60"
                        min={1}
                        {...field}
                        onChange={(e) => {
                          field.onChange(Number(e.target.value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="auto_train"
                render={({ field }) => (
                  <FormItem className="col-span-2 flex items-center gap-2">
                    <LabelWithTooltip
                      required={false}
                      tooltip="Add generated queries to a vector store, to be used as reference for subsequent questions."
                    >
                      Automatically train the agent
                    </LabelWithTooltip>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("auto_train") && (
                <FormField
                  control={form.control}
                  name="examples_rag_id"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="inline-flex">
                        Auto training Knowledge Base
                      </FormLabel>
                      <div className="flex gap-2">
                        <FormControl className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            {isFetchingKbs ? (
                              <Skeleton className="col-span-2 h-10 w-full" />
                            ) : (
                              <Select
                                value={field.value}
                                onValueChange={(value) => field.onChange(value)}
                                disabled={knowledgeBases?.length === 0}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={
                                      knowledgeBases?.length === 0
                                        ? "No agents to select"
                                        : "Select knowledge base"
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {knowledgeBases?.map((agent: any) => (
                                    <SelectItem
                                      key={agent._id}
                                      value={agent._id}
                                    >
                                      {agent?.collection_name?.slice(0, -4)}
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
                                fetchNonSemanticKbs();
                              }}
                            >
                              <RefreshCw
                                className={cn(
                                  "size-4",
                                  status === "fetchingNonSemantic" &&
                                    "animate-spin",
                                )}
                              />
                            </Button>
                          </div>
                        </FormControl>
                      </div>
                      <Link
                        to="/knowledge-base"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          buttonVariants({ variant: "link" }),
                          "mt-2 p-0 text-indigo-600 hover:text-indigo-500",
                        )}
                      >
                        Create New
                        <ArrowTopRightIcon className="ml-2 size-4" />
                      </Link>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <Separator />
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => form.reset()}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Form>
      <SchemaDocumentationAgentModal
        open={documentationAgentModal}
        onOpen={setDocumentationAgentModal}
        onSuccess={() => fetchSemanticKbs()}
      />
    </Dialog>
  );
};
