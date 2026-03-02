import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, TriangleAlert, Code, Copy, Check } from "lucide-react";

import { Button, buttonVariants } from "@/components/custom/button";
import { Separator } from "@/components/ui/separator";
import Toxicity from "./components/toxicity";
import { Form } from "@/components/ui/form";
import PromptInjection from "./components/prompt-injection";
import Secrets from "./components/secrets";
import NSFW from "./components/nsfw";
import Chat from "./components/chat";
import AllowedTopics from "./components/allowed-topics";
import Keywords from "./components/keywords";
import PII from "./components/pii";
import { useRAIPolicy } from "../rai.service";
import { cn } from "@/lib/utils";
import useStore from "@/lib/store";
import { RAI_URL } from "@/lib/constants";
import axios from "@/lib/axios";
import { IRAIPolicy, Path } from "@/lib/types";
import BannedTopics from "./components/banned-topics";
import BedrockGuardrails from "./components/bedrock-guardrails";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import mixpanel from "mixpanel-browser";
import { isMixpanelActive } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";

export const piiTypes: string[] = [
  "CREDIT_CARD",
  "EMAIL_ADDRESS",
  "PHONE_NUMBER",
  "PERSON",
  "LOCATION",
  "IP_ADDRESS",
  "US_SSN",
  "URL",
  "DATE_TIME",
];

export const raiPolicySchema = z.object({
  name: z.string(),
  description: z.string(),
  allowed_topics: z.object({
    enabled: z.boolean(),
    topics: z.array(z.object({ name: z.string() })),
  }),
  banned_topics: z.object({
    enabled: z.boolean(),
    topics: z.array(z.object({ name: z.string() })),
  }),
  keywords: z.object({
    enabled: z.boolean(),
    keywords: z.array(
      z.object({
        action: z.enum(["block", "redact"]),
        keyword: z.string(),
        replacement: z.string(),
        pattern_type: z.enum(["literal", "regex", "cucumber_expression"]).optional(),
      }),
    ),
  }),
  toxicity_check: z.object({ enabled: z.boolean(), threshold: z.number() }),
  prompt_injection: z.object({ enabled: z.boolean(), threshold: z.number() }),
  secrets_detection: z.object({ enabled: z.boolean(), action: z.string() }),
  pii_detection: z.object({
    enabled: z.boolean(),
    types: z.object({
      CREDIT_CARD: z.enum(["disabled", "block", "redact"]),
      EMAIL_ADDRESS: z.enum(["disabled", "block", "redact"]),
      PHONE_NUMBER: z.enum(["disabled", "block", "redact"]),
      PERSON: z.enum(["disabled", "block", "redact"]),
      LOCATION: z.enum(["disabled", "block", "redact"]),
      IP_ADDRESS: z.enum(["disabled", "block", "redact"]),
      US_SSN: z.enum(["disabled", "block", "redact"]),
      URL: z.enum(["disabled", "block", "redact"]),
      DATE_TIME: z.enum(["disabled", "block", "redact"]),
    }),
    custom_pii: z.array(
      z.object({
        action: z.enum(["block", "redact"]),
        label: z.string(),
        replacement: z.string(),
      }),
    ),
  }),
  fairness_and_bias: z.object({
    enabled: z.boolean(),
    model: z.string(),
    temperature: z.number(),
    top_p: z.number(),
    credential_id: z.string(),
    provider_id: z.string(),
  }).optional(),
  nsfw_check: z.object({
    enabled: z.boolean(),
    threshold: z.number(),
    validation_method: z.enum(["sentence", "full"]),
  }).optional(),
  bedrock_guardrail: z.object({
    enabled: z.boolean(),
    content_filters: z.array(z.object({
      type: z.enum(["SEXUAL", "VIOLENCE", "HATE", "INSULTS", "MISCONDUCT", "PROMPT_ATTACK"]),
      input_strength: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
      output_strength: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
    })).nullable().optional(),
    topics: z.array(z.object({
      name: z.string().default(""),
      definition: z.string().default(""),
      examples: z.array(z.string()).nullable().optional(),
    })).nullable().optional(),
    blocked_words: z.array(z.string()).nullable().optional(),
    managed_word_lists: z.array(z.enum(["PROFANITY"])).nullable().optional(),
    pii_entities: z.array(z.object({
      type: z.string(),
      action: z.enum(["BLOCK", "ANONYMIZE"]).default("BLOCK"),
    })).nullable().optional(),
    regex_patterns: z.array(z.object({
      name: z.string().default(""),
      pattern: z.string().default(""),
      action: z.enum(["BLOCK", "ANONYMIZE"]).default("BLOCK"),
    })).nullable().optional(),
    contextual_grounding_filters: z.array(z.object({
      type: z.enum(["GROUNDING", "RELEVANCE"]),
      threshold: z.number().default(0.7),
    })).nullable().optional(),
    blocked_input_messaging: z.string().nullable().optional(),
    blocked_output_messaging: z.string().nullable().optional(),
    guardrail_id: z.string().nullable().optional(),
    guardrail_arn: z.string().nullable().optional(),
    guardrail_version: z.string().nullable().optional(),
    credential_id: z.string().nullable().optional(),
  }).nullable().optional(),
});

const ResponseAIPage = () => {
  const params = useParams();
  const policyId = params?.id;
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("api");
  // const [tab, setTab] = useState<"policy" | "logs">("policy");

  const getCurlCommand = (policyId: string | undefined, apiKey: string) => {
    return policyId
      ? `curl -X POST '${import.meta.env.VITE_RAI_URL}/v1/rai/inference' \\
      -H 'Content-Type: application/json' \\
      -H 'x-api-key: ${apiKey}' \\
      -d '{
        "policy_id": "${policyId}",
        "input_text": "",
        "agent_id": "",
        "session_id": "",
        "run_id": ""
        }'`
      : "Please create your policy first to get the Inference endpoint";
  };
  const apiKey = useStore((state) => state.api_key);

  const { updatePolicy, isUpdatingPolicy } = useRAIPolicy();

  const {
    data: policy,
    isFetching: isFetchingPolicy,
    refetch: fetchPolicy,
  } = useQuery({
    queryKey: ["fetchPolicyById", policyId, apiKey],
    queryFn: () =>
      axios.get(`/v1/rai/policies/${policyId}`, {
        baseURL: RAI_URL,
        headers: { accept: "application/json", "x-api-key": apiKey },
      }),
    select: (res: AxiosResponse<IRAIPolicy, any>) => res.data,
    enabled: !!apiKey,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const form = useForm<z.infer<typeof raiPolicySchema>>({
    defaultValues: {
      toxicity_check: { enabled: false, threshold: 0.4 },
      prompt_injection: { enabled: false, threshold: 0.3 },
      secrets_detection: { enabled: false, action: "mask" },
      allowed_topics: { enabled: false, topics: [] },
      banned_topics: { enabled: false, topics: [] },
      keywords: { enabled: false, keywords: [] },
      pii_detection: {
        enabled: false,
        types: {
          CREDIT_CARD: "disabled",
          EMAIL_ADDRESS: "disabled",
          PHONE_NUMBER: "disabled",
          PERSON: "disabled",
          LOCATION: "disabled",
          IP_ADDRESS: "disabled",
          US_SSN: "disabled",
          URL: "disabled",
          DATE_TIME: "disabled",
        },
        custom_pii: [],
      },
      fairness_and_bias: {
        enabled: false,
        model: "gpt-4o-mini",
        temperature: 0.3,
        top_p: 1.0,
        credential_id: "lyzr_openai",
        provider_id: "OpenAI",
      },
      nsfw_check: {
        enabled: false,
        threshold: 0.8,
        validation_method: "sentence",
      },
      bedrock_guardrail: {
        enabled: false,
        content_filters: [],
        topics: [],
        blocked_words: [],
        managed_word_lists: [],
        pii_entities: [],
        regex_patterns: [],
        contextual_grounding_filters: [],
        blocked_input_messaging: "Sorry, I cannot process this request.",
        blocked_output_messaging: "Sorry, I cannot provide this response.",
        credential_id: "",
      },
    },
    resolver: zodResolver(raiPolicySchema),
  });
  const formValues = form.getValues();
  const formattedValue = JSON.stringify(formValues, null, 2);

  const handleCopy = async () => {
    const contentToCopy =
      activeTab === "api" ? formattedValue : getCurlCommand(policyId, apiKey);
    try {
      await navigator.clipboard.writeText(contentToCopy);
      setIsCopied(true);
      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
        mixpanel.track(`User copied ${activeTab}`);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        variant: "destructive",
      });
    }
  };

  const renderAgentAPI = (values: z.infer<typeof raiPolicySchema>) => {
    if (
      values?.allowed_topics?.enabled ||
      values?.banned_topics?.enabled ||
      values?.keywords?.enabled ||
      values?.secrets_detection?.enabled ||
      values?.toxicity_check?.enabled ||
      values?.prompt_injection?.enabled ||
      values?.pii_detection?.enabled ||
      values?.fairness_and_bias?.enabled ||
      values?.nsfw_check?.enabled ||
      values?.bedrock_guardrail?.enabled
    ) {
      return (
        <Dialog>
          <DialogTrigger className={buttonVariants({ variant: "outline" })}>
            <Code className="mr-2 size-4" />
            Responsible AI API
          </DialogTrigger>
          <DialogContent className="top-[50%] max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <p>Responsible AI API</p>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {isCopied ? (
                    <>
                      <Check className="mr-1 size-4" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 size-4" /> Copy
                    </>
                  )}
                </Button>
              </DialogTitle>
            </DialogHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="api">Responsible AI JSON</TabsTrigger>
                <TabsTrigger value="inference">Inference</TabsTrigger>
              </TabsList>
              <TabsContent value="api" className="h-[60vh] overflow-auto">
                <div className="h-[60vh] overflow-auto rounded-md border bg-secondary p-2">
                  <pre className="overflow-auto whitespace-pre-wrap text-xs leading-relaxed">
                    {formattedValue}
                  </pre>
                </div>
              </TabsContent>
              <TabsContent value="inference" className="h-[60vh] overflow-auto">
                <div className="h-[60vh] overflow-auto rounded-md border bg-secondary p-2">
                  <pre className="overflow-auto whitespace-pre-wrap text-xs leading-relaxed">
                    {getCurlCommand(policyId, apiKey)}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      );
    }
  };

  const onSubmit = async (values: z.infer<typeof raiPolicySchema>) => {
    if (
      !(
        values?.allowed_topics?.enabled ||
        values?.banned_topics?.enabled ||
        values?.keywords?.enabled ||
        values?.secrets_detection?.enabled ||
        values?.toxicity_check?.enabled ||
        values?.prompt_injection?.enabled ||
        values?.pii_detection?.enabled ||
        values?.fairness_and_bias?.enabled ||
        values?.nsfw_check?.enabled ||
        values?.bedrock_guardrail?.enabled
      )
    ) {
      toast({
        title: "Error",
        description: "Enable atleast 1 module to start testing",
        variant: "destructive",
      });
    } else {
      try {
        await updatePolicy({
          ...values,
          policy_id: policy?._id ?? "",
        });
        await fetchPolicy();
      } catch (error) {
        console.log("Error in update policy => ", error);
      }
    }
  };

  useEffect(() => {
    if (policy) {
      form.reset({
        name: policy.name,
        description: policy.description,
        toxicity_check: policy.toxicity_check ?? { enabled: false, threshold: 0.4 },
        prompt_injection: policy.prompt_injection ?? { enabled: false, threshold: 0.3 },
        secrets_detection: policy.secrets_detection ?? { enabled: false, action: "mask" },
        allowed_topics: policy.allowed_topics ?? { enabled: false, topics: [] },
        banned_topics: policy.banned_topics ?? { enabled: false, topics: [] },
        pii_detection: policy.pii_detection ?? {
          enabled: false,
          types: {
            CREDIT_CARD: "disabled",
            EMAIL_ADDRESS: "disabled",
            PHONE_NUMBER: "disabled",
            PERSON: "disabled",
            LOCATION: "disabled",
            IP_ADDRESS: "disabled",
            US_SSN: "disabled",
            URL: "disabled",
            DATE_TIME: "disabled",
          },
          custom_pii: [],
        },
        fairness_and_bias: policy.fairness_and_bias ?? {
          enabled: false,
          model: "gpt-4o-mini",
          temperature: 0.3,
          top_p: 1.0,
          credential_id: "lyzr_openai",
          provider_id: "OpenAI",
        },
        nsfw_check: policy.nsfw_check ?? {
          enabled: false,
          threshold: 0.8,
          validation_method: "sentence",
        },
        bedrock_guardrail: {
          enabled: policy.bedrock_guardrail?.enabled ?? false,
          content_filters: policy.bedrock_guardrail?.content_filters ?? [],
          topics: policy.bedrock_guardrail?.topics ?? [],
          blocked_words: policy.bedrock_guardrail?.blocked_words ?? [],
          managed_word_lists: policy.bedrock_guardrail?.managed_word_lists ?? [],
          pii_entities: policy.bedrock_guardrail?.pii_entities ?? [],
          regex_patterns: policy.bedrock_guardrail?.regex_patterns ?? [],
          contextual_grounding_filters: policy.bedrock_guardrail?.contextual_grounding_filters ?? [],
          blocked_input_messaging: policy.bedrock_guardrail?.blocked_input_messaging ?? "Sorry, I cannot process this request.",
          blocked_output_messaging: policy.bedrock_guardrail?.blocked_output_messaging ?? "Sorry, I cannot provide this response.",
          credential_id: policy.bedrock_guardrail?.credential_id ?? "",
          guardrail_id: policy.bedrock_guardrail?.guardrail_id ?? undefined,
          guardrail_arn: policy.bedrock_guardrail?.guardrail_arn ?? undefined,
          guardrail_version: policy.bedrock_guardrail?.guardrail_version ?? "DRAFT",
        },
        keywords: {
          enabled: policy.keywords?.enabled ?? false,
          keywords: (policy.keywords?.keywords ?? []).map((keyword) => ({
            ...keyword,
            pattern_type: keyword.pattern_type ?? "literal",
          })),
        },
      });
    }
  }, [policy]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="h-screen w-full space-y-4 px-6 py-4"
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.error("Form validation errors:", errors);
            toast({
              title: "Validation Error",
              description: "Please check your configuration and try again.",
              variant: "destructive",
            });
          })}
          className=" flex h-full w-full flex-col  gap-2"
        >
          <div className="col-span-1 flex h-10 w-full items-center justify-between">
            <div className="flex w-1/2 items-center">
              <Link
                to={Path.RESPONSIBLE_AI}
                className={cn(
                  "hover:bg-transparent",
                  buttonVariants({ size: "icon", variant: "link" }),
                )}
              >
                <ChevronLeft className="size-6" />
              </Link>

              {isFetchingPolicy ? (
                <Skeleton className="h-6 w-1/4 rounded-lg" />
              ) : (
                <p className="text-2xl font-medium tracking-tight">
                  {policy?.name}
                </p>
              )}
              <div className="ml-4 text-sm">
                <Link
                  to="https://youtu.be/Ccrn1pIwU7I?si=Bc7q8aRarwyDTjz"
                  target="_blank"
                  className="flex items-center text-link underline-offset-4 hover:underline"
                  onClick={() => {
                    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                      mixpanel.track("Video-clicked", {
                        feature: "Responsible AI",
                      });
                  }}
                >
                  Video
                  <ArrowTopRightIcon className="ml-1 size-3" />
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {Object.keys(form.formState.dirtyFields).length > 0 && (
                <div className="flex items-center text-yellow-500">
                  <TriangleAlert className="mr-2 h-5 w-5" />
                  <span className="mr-4 text-sm">You have unsaved changes</span>
                </div>
              )}
              {renderAgentAPI(form.getValues())}
              <Button type="submit" loading={isUpdatingPolicy}>
                Save
              </Button>
            </div>
          </div>
          {/* <Tabs
            value={tab}
            onValueChange={(tab) => setTab(tab as "policy" | "logs")}
          >
            <TabsList className="bg-transparent">
              <TabsTrigger
                value="policy"
                className="rounded-none border-primary py-2 data-[state=active]:border-b-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Policy
              </TabsTrigger>
              <TabsTrigger
                disabled
                value="logs"
                className="rounded-none border-primary py-2 data-[state=active]:border-b-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Logs
              </TabsTrigger>
            </TabsList>
            <Separator />
            <TabsContent value="policy" className="mt-0 h-[50rem]">
              
            </TabsContent>
            <TabsContent value="logs">Logs</TabsContent>
          </Tabs> */}
          <Separator className="col-span-1" />
          <div className="no-scrollbar col-span-1 flex h-full justify-between gap-4 overflow-hidden">
            <div className="no-scrollbar flex h-full w-3/5 flex-col gap-4 overflow-y-scroll py-4">
              {isFetchingPolicy || isUpdatingPolicy ? (
                <div className="h-full space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (
                <>
                  <BedrockGuardrails form={form} />
                  <Toxicity form={form} />
                  <PromptInjection form={form} />
                  <NSFW form={form} />
                  <Secrets form={form} />
                  <AllowedTopics form={form} />
                  <BannedTopics form={form} />
                  <Keywords form={form} />
                  <PII form={form} />
                </>
              )}
            </div>
            <div className="w-2/5 border-l pl-4">
              <Chat
                loading={isFetchingPolicy}
                policy={policy}
                form={form}
                onSubmit={onSubmit}
              />
            </div>
          </div>
        </form>
      </Form>
    </motion.div>
  );
};

export default ResponseAIPage;
