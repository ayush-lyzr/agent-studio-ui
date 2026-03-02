import { z } from "zod";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect, useRef } from "react";
import { Circle, MinusCircle, PlusCircle, RefreshCw } from "lucide-react";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { useFormContext } from "react-hook-form";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogClose,
  DialogContent,
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
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import LabelWithTooltip from "@/components/custom/label-with-tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordian";
import { RAG_URL } from "@/lib/constants";
import { useRAGService } from "@/pages/knowledge-base/rag.service";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type RagModalValue = {
  lyzr_rag?: {
    base_url: string;
    rag_id: string;
    rag_name?: string;
    params?: {
      top_k?: number;
      retrieval_type?: string;
      score_threshold?: number;
    };
  };
  agentic_rag?: Array<{
    rag_id: string;
    top_k: number;
    retrieval_type: string;
    score_threshold: number;
  }>;
};

interface ConfigureRagProps {
  /**
   * Legacy mode (Agent Create): writes into parent form via updateFeatures + features[].
   */
  updateFeatures?: (
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
  featureName?: string;
  openDialog?: boolean;
  disableAgenticRag?: boolean;

  /**
   * Controlled mode (Voice New): caller owns the value; modal emits config via onChange.
   * This avoids requiring a features[] array in the parent form.
   */
  value?: RagModalValue | null;
  onChange?: (nextValue: RagModalValue | null) => void;
  /**
   * Called when the dialog closes without any selected KB (so the parent can toggle off).
   */
  onDisable?: () => void;
}

export const ConfigureRag: React.FC<ConfigureRagProps> = ({
  updateFeatures,
  featureName,
  openDialog,
  disableAgenticRag = false,
  value,
  onChange,
  onDisable,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [ragType, setRagType] = useState<"basic-rag" | "agentic-rag">(
    "basic-rag",
  );
  const [accordionItem, setAccordionItem] = useState<string[]>([]);
  const parentForm = useFormContext();
  const isAgenticRag = ragType === "agentic-rag" && !disableAgenticRag;

  const formSchema = z.object({
    rag_id: z
      .string({ required_error: "Please select a knowledge base" })
      .min(1, { message: "Please select a knowledge base" }),
    top_k: z.coerce.number().int().min(1).max(100).default(10),
    retrieval_type: z.string().default("basic"),
    score_threshold: z.coerce.number().min(0).max(1).default(0),
  });

  const agenticRagFormSchema = z.object({
    agentic_rag: formSchema.array().nonempty(),
  });

  const existingFeatures = parentForm?.watch("features") || [];

  const existingRagConfig = existingFeatures.find(
    (feature: any) => feature.type === "KNOWLEDGE_BASE",
  );

  const isControlled =
    typeof onChange === "function" || value !== undefined || typeof onDisable === "function";
  const existingLyzrRag = isControlled ? value?.lyzr_rag : existingRagConfig?.config?.lyzr_rag;
  const existingAgenticRag = isControlled ? value?.agentic_rag : existingRagConfig?.config?.agentic_rag;

  const existingRagId = existingLyzrRag?.rag_id;
  const existingTopK = existingLyzrRag?.params?.top_k || 5;
  const existingRetrievalType = existingLyzrRag?.params?.retrieval_type || "basic";
  const existingScoreThreshold = existingLyzrRag?.params?.score_threshold || 0;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rag_id: existingRagId || "",
      top_k: existingTopK,
      retrieval_type: existingRetrievalType,
      score_threshold: existingScoreThreshold,
    },
    mode: "onSubmit",
  });

  const agenticRagForm = useForm<z.infer<typeof agenticRagFormSchema>>({
    resolver: zodResolver(agenticRagFormSchema),
    defaultValues: {
      agentic_rag: [],
    },
    mode: "onSubmit",
  });

  const {
    fields: agentic_rags = [],
    append: appendAgenticRag,
    remove: removeAgenticRag,
  } = useFieldArray({
    name: "agentic_rag",
    control: agenticRagForm.control,
  });

  const addAgenticRAGRow = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    appendAgenticRag({
      rag_id: "",
      retrieval_type: "basic",
      score_threshold: 0,
      top_k: 5,
    });
    setAccordionItem([
      (agenticRagForm.watch("agentic_rag").length - 1).toString(),
    ]);
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const removeAgenticRAGRow = (index: number) => {
    removeAgenticRag(index);
  };

  const {
    ragConfigs: rags,
    getRagConfigs,
    isFetchingRagConfigs: isRefreshing,
  } = useRAGService({ params: { semantic_data_models: false } });

  const handleRefresh = () => getRagConfigs();

  const getRagName = (id: string) =>
    rags?.find((rag) => rag._id === id)?.collection_name?.slice(0, -4);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (values.rag_id) {
      const selectedRag = rags.find((rag: any) => rag.id === values.rag_id);

      if (!selectedRag) {
        console.error("Selected RAG not found:", values.rag_id);
        return;
      }

      const nextConfig = {
        lyzr_rag: {
          base_url: RAG_URL,
          rag_id: values.rag_id,
          rag_name: selectedRag?.collection_name,
          params: {
            top_k: values?.top_k || 10,
            retrieval_type: values?.retrieval_type || "basic",
            score_threshold: values?.score_threshold ?? 0,
          },
        },
        agentic_rag: [],
      };

      if (isControlled) {
        onChange?.(nextConfig);
      } else if (updateFeatures && featureName) {
        updateFeatures(
          featureName,
          true,
          undefined, // Don't pass ragId as separate parameter
          undefined, // Don't pass ragName as separate parameter
          nextConfig,
        );
      }

      form.reset({
        rag_id: values.rag_id,
        top_k: values.top_k,
        retrieval_type: values.retrieval_type,
        score_threshold: values.score_threshold,
      });

      setOpen(false);
    }
  };

  const onAgenticRagSubmit = (values: z.infer<typeof agenticRagFormSchema>) => {
    // Don't allow agentic RAG submission if disabled
    if (disableAgenticRag) {
      return;
    }
    
    if (values.agentic_rag.length) {
      const nextConfig = {
        lyzr_rag: {},
        agentic_rag: values.agentic_rag,
      };

      if (isControlled) {
        onChange?.(nextConfig as any);
      } else if (updateFeatures && featureName) {
        updateFeatures(
          featureName,
          true,
          "Agentic RAG",
          `${values.agentic_rag.length} knowledgebases****`,
          nextConfig,
        );
      }

      agenticRagForm.reset(values);

      setOpen(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    const hasExistingAgentic = Array.isArray(existingAgenticRag) && existingAgenticRag.length > 0;
    if (
      !isOpen &&
      !form.getValues("rag_id") &&
      !hasExistingAgentic
    ) {
      if (isControlled) {
        onChange?.(null);
        onDisable?.();
      } else if (updateFeatures && featureName) {
        updateFeatures(featureName, false);
      }
    }
  };

  useEffect(() => {
    if (openDialog) {
      setOpen(true);
      getRagConfigs();
    }
  }, [openDialog]);

  // Force basic RAG mode when agentic RAG is disabled
  useEffect(() => {
    if (disableAgenticRag && ragType === "agentic-rag") {
      setRagType("basic-rag");
    }
  }, [disableAgenticRag, ragType]);

  useEffect(() => {
    if (open) {
      const hasLyzrRag = Boolean(existingLyzrRag && Object.keys(existingLyzrRag).length > 0);
      const hasAgentic = Array.isArray(existingAgenticRag) && existingAgenticRag.length > 0;

      if (hasLyzrRag) {
        setRagType("basic-rag");
        form.reset({
          rag_id: existingLyzrRag?.rag_id,
          retrieval_type:
            existingLyzrRag?.params?.retrieval_type || "basic",
          score_threshold:
            existingLyzrRag?.params?.score_threshold || 0,
          top_k: existingLyzrRag?.params?.top_k || 5,
        });
      } else if (hasAgentic) {
        setRagType("agentic-rag");
        agenticRagForm.reset({
          agentic_rag: (existingAgenticRag as any) ?? [],
        });
      } else {
        setRagType("basic-rag");
      }
    }
  }, [
    open,
    existingRagId,
    existingTopK,
    existingRetrievalType,
    existingScoreThreshold,
    form,
    agenticRagForm,
  ]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: "link" }),
          "p-0 text-link animate-in slide-in-from-top-2 hover:text-link/80",
        )}
      >
        Configure
        <ArrowTopRightIcon className="size-4" />
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-3xl !rounded-xl">
        <DialogHeader>
          <DialogTitle>Configure Knowledge Base</DialogTitle>
        </DialogHeader>
        <Separator />
        <div className="flex items-center justify-between">
          {!disableAgenticRag && (
            <RadioGroup
              value={ragType}
              onValueChange={(value) => setRagType(value as typeof ragType)}
              className="flex items-center gap-4"
            >
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="basic-rag"
                id="basic-rag"
                icon={<Circle className="size-2.5 fill-primary" />}
              />
              <LabelWithTooltip
                onClick={() => {
                  setRagType("basic-rag");
                }}
                tooltip=" Retrieves relevant data from a knowledge base or knowledge graph. Best suited for direct Q&A over static content."
              >
                RAG
              </LabelWithTooltip>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="agentic-rag"
                id="agentic-rag"
                icon={<Circle className="size-2.5 fill-primary" />}
              />
              <LabelWithTooltip
                onClick={() => {
                  setRagType("agentic-rag");
                }}
                tooltip={
                  <span>
                    <p>
                      An enhanced version of RAG that uses the agent’s context
                      to retrieve the most relevant information.{" "}
                    </p>
                    <p>
                      It supports multiple knowledge bases and graphs, enabling
                      more dynamic, multi-source reasoning.
                    </p>
                  </span>
                }
              >
                Agentic RAG
              </LabelWithTooltip>
            </div>
          </RadioGroup>
          )}
          {isAgenticRag && (
            <Tooltip>
              <TooltipTrigger>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                >
                  <RefreshCw
                    className={cn(
                      "mx-auto size-3",
                      isRefreshing && "animate-spin",
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Updates the list of knowledgebases
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {rags?.length > 0 ? (
          ragType === "basic-rag" ? (
            <Form {...form}>
              <form
                className="grid grid-cols-1 gap-4"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  control={form.control}
                  name="rag_id"
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <LabelWithTooltip
                        tooltip="Select an existing knowledge base to use for retrieving relevant context."
                        required={true}
                      >
                        Knowledge Base
                      </LabelWithTooltip>
                      <div className="flex gap-2">
                        <FormControl className="flex-1">
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {rags?.map((rag: any) => (
                                <SelectItem key={rag.id} value={rag.id}>
                                  {rag.collection_name.slice(0, -4)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleRefresh}
                        >
                          <RefreshCw
                            className={cn(
                              "mx-auto size-4",
                              isRefreshing && "animate-spin",
                            )}
                          />
                        </Button>
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
                        <ArrowTopRightIcon className="size-4" />
                      </Link>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="top_k"
                    render={({ field }) => (
                      <FormItem>
                        <LabelWithTooltip
                          tooltip="Number of most relevant chunks to retrieve from the knowledge base. Higher values provide more context but may increase noise and response time."
                          required={true}
                        >
                          Number of Chunks
                        </LabelWithTooltip>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            step={1}
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="retrieval_type"
                    render={({ field }) => (
                      <FormItem>
                        <LabelWithTooltip
                          tooltip={
                            <span>
                              <p>
                                <strong>Basic:</strong> Simple similarity-based
                                retrieval
                              </p>
                              <p>
                                <strong>
                                  MMR (Maximal Marginal Relevance):
                                </strong>{" "}
                                Balances relevance with diversity in results
                              </p>
                              <p>
                                <strong>
                                  HyDE (Hypothetical Document Embeddings):{" "}
                                </strong>
                                Generates a hypothetical answer first to improve
                                retrieval accuracy
                              </p>
                            </span>
                          }
                          required={true}
                        >
                          Retrieval Type
                        </LabelWithTooltip>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select retrieval type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic">Basic</SelectItem>
                              <SelectItem value="mmr">MMR</SelectItem>
                              <SelectItem value="hyde">HyDE</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="score_threshold"
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <LabelWithTooltip
                        tooltip="Minimum similarity score (0-1) required for a chunk to be included in the results. Higher values ensure more relevant but fewer results."
                        required={true}
                      >
                        Score Threshold: {field.value.toFixed(1)}
                      </LabelWithTooltip>
                      <FormControl>
                        <Slider
                          min={0}
                          max={1}
                          step={0.1}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          ) : (
            <Form {...agenticRagForm}>
              <form
                onSubmit={agenticRagForm.handleSubmit(onAgenticRagSubmit)}
                className="grid grid-cols-1 gap-4"
              >
                <Accordion
                  type="multiple"
                  value={accordionItem}
                  onValueChange={(value) => setAccordionItem(value)}
                  className="max-h-[60vh] space-y-2 overflow-y-auto"
                >
                  {agentic_rags?.map((field, index) => (
                    <AccordionItem
                      value={index.toString()}
                      key={field.id}
                      className="rounded-lg bg-secondary px-2"
                    >
                      <AccordionTrigger
                        extraactions={
                          <Button
                            variant="ghost"
                            onClick={() => removeAgenticRAGRow(index)}
                          >
                            <MinusCircle className="size-4 text-destructive" />
                          </Button>
                        }
                      >
                        {getRagName(
                          agenticRagForm.watch(`agentic_rag.${index}.rag_id`),
                        ) ?? `Knowledge Base ${index + 1}`}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 gap-4">
                          <FormField
                            control={agenticRagForm.control}
                            name={`agentic_rag.${index}.rag_id`}
                            render={({ field }) => (
                              <FormItem className="col-span-1">
                                <LabelWithTooltip
                                  tooltip="Select an existing knowledge base to use for retrieving relevant context."
                                  required={true}
                                >
                                  Knowledge Base
                                </LabelWithTooltip>
                                <FormControl className="flex-1">
                                  <Select
                                    value={field.value}
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                    }}
                                    required
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(rags ?? [])?.map((rag: any) => (
                                        <SelectItem
                                          key={rag.id}
                                          value={rag.id}
                                          disabled={agentic_rags
                                            .map((r) => r.rag_id)
                                            .includes(rag._id)}
                                        >
                                          {rag.collection_name.slice(0, -4)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={agenticRagForm.control}
                              name={`agentic_rag.${index}.top_k`}
                              render={({ field }) => (
                                <FormItem>
                                  <LabelWithTooltip
                                    tooltip="Number of most relevant chunks to retrieve from the knowledge base. Higher values provide more context but may increase noise and response time."
                                    required={true}
                                  >
                                    Number of Chunks
                                  </LabelWithTooltip>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={100}
                                      step={1}
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={agenticRagForm.control}
                              name={`agentic_rag.${index}.retrieval_type`}
                              render={({ field }) => (
                                <FormItem>
                                  <LabelWithTooltip
                                    tooltip={
                                      <span>
                                        <p>
                                          Basic: Simple similarity-based
                                          retrieval
                                        </p>
                                        <p>
                                          MMR (Maximal Marginal Relevance):
                                          Balances relevance with diversity in
                                          results
                                        </p>
                                        <p>
                                          HyDE (Hypothetical Document
                                          Embeddings): Generates a hypothetical
                                          answer first to improve retrieval
                                          accuracy
                                        </p>
                                      </span>
                                    }
                                    required={true}
                                  >
                                    Retrieval Type
                                  </LabelWithTooltip>
                                  <FormControl>
                                    <Select
                                      value={field.value}
                                      onValueChange={field.onChange}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select retrieval type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="basic">
                                          Basic
                                        </SelectItem>
                                        <SelectItem value="mmr">MMR</SelectItem>
                                        <SelectItem value="hyde">
                                          HyDE
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={agenticRagForm.control}
                            name={`agentic_rag.${index}.score_threshold`}
                            render={({ field }) => (
                              <FormItem className="col-span-1">
                                <LabelWithTooltip
                                  tooltip="Minimum similarity score (0-1) required for a chunk to be included in the results. Higher values ensure more relevant but fewer results."
                                  required={true}
                                >
                                  Score Threshold: {field.value?.toFixed(1)}
                                </LabelWithTooltip>
                                <FormControl>
                                  <Slider
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    value={[field.value]}
                                    onValueChange={(value) =>
                                      field.onChange(value[0])
                                    }
                                    className="py-4"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                  <div ref={scrollRef} />
                </Accordion>

                <Button variant="outline" size="sm" onClick={addAgenticRAGRow}>
                  <PlusCircle className="mr-1 size-3" />
                  Add Knowldgebase
                </Button>
              </form>
            </Form>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="mb-4 flex gap-2">
              <p className="text-sm text-muted-foreground">
                No knowledge bases found
              </p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Link
                to="/knowledge-base"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="default">
                  Create New
                  <ArrowTopRightIcon className="ml-2 size-4" />
                </Button>
              </Link>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleRefresh}
              >
                <RefreshCw
                  className={cn(
                    "mx-auto size-4",
                    isRefreshing && "animate-spin",
                  )}
                />
              </Button>
            </div>
          </div>
        )}
        <Separator />
        <DialogFooter className="items-center">
          {Object.values(agenticRagForm.formState.errors).length > 0 && (
            <p className="text-sm text-destructive">
              *Please resolve erros in the form
            </p>
          )}
          <DialogClose asChild>
            <Button
              type="button"
              variant="secondary"
              onClick={() => form.reset()}
            >
              Cancel
            </Button>
          </DialogClose>
          {rags?.length > 0 && (
            <Button
              type="submit"
              onClick={
                isAgenticRag
                  ? agenticRagForm.handleSubmit(onAgenticRagSubmit)
                  : form.handleSubmit(onSubmit)
              }
              disabled={isAgenticRag && agentic_rags?.length === 0}
            >
              Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
