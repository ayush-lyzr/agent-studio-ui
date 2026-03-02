import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import { Plus, X, ChevronDown, ChevronUp, Shield, AlertCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/custom/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ContentFilterType,
  FilterStrength,
  BedrockPIIEntityType,
} from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useGuardrails } from "@/pages/configure/guardrails/guardrails-service";

type IBedrockGuardrails = {
  form: UseFormReturn<any, any, any>;
};

const CONTENT_FILTER_TYPES: { type: ContentFilterType; label: string; description: string }[] = [
  { type: "SEXUAL", label: "Sexual Content", description: "Blocks sexually explicit content" },
  { type: "VIOLENCE", label: "Violence", description: "Blocks violent content" },
  { type: "HATE", label: "Hate Speech", description: "Blocks hate speech and discrimination" },
  { type: "INSULTS", label: "Insults", description: "Blocks insulting language" },
  { type: "MISCONDUCT", label: "Misconduct", description: "Blocks content promoting illegal activities" },
  { type: "PROMPT_ATTACK", label: "Prompt Attack", description: "Blocks prompt injection attempts" },
];

const FILTER_STRENGTHS: FilterStrength[] = ["NONE", "LOW", "MEDIUM", "HIGH"];

const BEDROCK_PII_TYPES: { type: BedrockPIIEntityType; label: string }[] = [
  { type: "ADDRESS", label: "Address" },
  { type: "AGE", label: "Age" },
  { type: "AWS_ACCESS_KEY", label: "AWS Access Key" },
  { type: "AWS_SECRET_KEY", label: "AWS Secret Key" },
  { type: "CA_HEALTH_NUMBER", label: "CA Health Number" },
  { type: "CA_SOCIAL_INSURANCE_NUMBER", label: "CA Social Insurance Number" },
  { type: "CREDIT_DEBIT_CARD_CVV", label: "Credit/Debit Card CVV" },
  { type: "CREDIT_DEBIT_CARD_EXPIRY", label: "Credit/Debit Card Expiry" },
  { type: "CREDIT_DEBIT_CARD_NUMBER", label: "Credit/Debit Card Number" },
  { type: "DRIVER_ID", label: "Driver ID" },
  { type: "EMAIL", label: "Email" },
  { type: "INTERNATIONAL_BANK_ACCOUNT_NUMBER", label: "IBAN" },
  { type: "IP_ADDRESS", label: "IP Address" },
  { type: "LICENSE_PLATE", label: "License Plate" },
  { type: "MAC_ADDRESS", label: "MAC Address" },
  { type: "NAME", label: "Name" },
  { type: "PASSWORD", label: "Password" },
  { type: "PHONE", label: "Phone" },
  { type: "PIN", label: "PIN" },
  { type: "SWIFT_CODE", label: "SWIFT Code" },
  { type: "UK_NATIONAL_HEALTH_SERVICE_NUMBER", label: "UK NHS Number" },
  { type: "UK_NATIONAL_INSURANCE_NUMBER", label: "UK NI Number" },
  { type: "UK_UNIQUE_TAXPAYER_REFERENCE_NUMBER", label: "UK UTR Number" },
  { type: "URL", label: "URL" },
  { type: "USERNAME", label: "Username" },
  { type: "US_BANK_ACCOUNT_NUMBER", label: "US Bank Account Number" },
  { type: "US_BANK_ROUTING_NUMBER", label: "US Bank Routing Number" },
  { type: "US_INDIVIDUAL_TAX_IDENTIFICATION_NUMBER", label: "US ITIN" },
  { type: "US_PASSPORT_NUMBER", label: "US Passport Number" },
  { type: "US_SOCIAL_SECURITY_NUMBER", label: "US SSN" },
  { type: "VEHICLE_IDENTIFICATION_NUMBER", label: "VIN" },
];

const BedrockGuardrails: React.FC<IBedrockGuardrails> = ({ form }) => {
  // Watch the entire bedrock_guardrail object so the component re-renders
  // when any sub-field changes (getValues alone does NOT trigger re-renders)
  const bedrockValues = form.watch("bedrock_guardrail");
  const disabled = !bedrockValues?.enabled;

  const {
    credentials: guardrailCredentials = [],
    isFetchingCredentials,
  } = useGuardrails({
    enabled: true,
    providerId: "bedrock-guardrails",
  });

  const hasCredentials = !isFetchingCredentials && guardrailCredentials.length > 0;
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    contentFilters: true,
    topics: false,
    wordPolicy: false,
    pii: false,
    regex: false,
    grounding: false,
    messaging: false,
  });

  // Topic form state
  const [topicName, setTopicName] = useState("");
  const [topicDefinition, setTopicDefinition] = useState("");
  const [topicExamples, setTopicExamples] = useState("");

  // Blocked word form state
  const [blockedWord, setBlockedWord] = useState("");

  // Regex form state
  const [regexName, setRegexName] = useState("");
  const [regexPattern, setRegexPattern] = useState("");
  const [regexAction, setRegexAction] = useState<"BLOCK" | "ANONYMIZE">("BLOCK");

  const { fields: contentFilterFields, append: appendContentFilter, remove: removeContentFilter, update: updateContentFilter } = useFieldArray({
    name: "bedrock_guardrail.content_filters",
    control: form.control,
  });

  const { fields: topicFields, append: appendTopic, remove: removeTopic } = useFieldArray({
    name: "bedrock_guardrail.topics",
    control: form.control,
  });

  const { fields: regexFields, append: appendRegex, remove: removeRegex } = useFieldArray({
    name: "bedrock_guardrail.regex_patterns",
    control: form.control,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleAddTopic = () => {
    if (!topicName || !topicDefinition) return;
    appendTopic({
      name: topicName,
      definition: topicDefinition,
      examples: topicExamples ? topicExamples.split(",").map((e) => e.trim()) : [],
    });
    setTopicName("");
    setTopicDefinition("");
    setTopicExamples("");
  };

  const handleAddBlockedWord = () => {
    if (!blockedWord) return;
    const currentWords = form.getValues("bedrock_guardrail.blocked_words") || [];
    const newWords = blockedWord.split(",").map((w) => w.trim()).filter((w) => w);
    form.setValue("bedrock_guardrail.blocked_words", [...currentWords, ...newWords], {
      shouldDirty: true,
    });
    setBlockedWord("");
  };

  const handleRemoveBlockedWord = (index: number) => {
    const currentWords = form.getValues("bedrock_guardrail.blocked_words") || [];
    form.setValue(
      "bedrock_guardrail.blocked_words",
      currentWords.filter((_: string, i: number) => i !== index),
      { shouldDirty: true }
    );
  };

  const handleAddRegex = () => {
    if (!regexName || !regexPattern) return;
    appendRegex({
      name: regexName,
      pattern: regexPattern,
      action: regexAction,
    });
    setRegexName("");
    setRegexPattern("");
    setRegexAction("BLOCK");
  };

  const toggleContentFilter = (filterType: ContentFilterType, enabled: boolean) => {
    if (enabled) {
      const exists = contentFilterFields.find((f: any) => f.type === filterType);
      if (!exists) {
        appendContentFilter({ type: filterType, input_strength: "MEDIUM", output_strength: "MEDIUM" });
      }
    } else {
      const index = contentFilterFields.findIndex((f: any) => f.type === filterType);
      if (index >= 0) removeContentFilter(index);
    }
  };

  const updateContentFilterStrength = (
    filterType: ContentFilterType,
    field: "input_strength" | "output_strength",
    value: FilterStrength
  ) => {
    const index = contentFilterFields.findIndex((f: any) => f.type === filterType);
    if (index >= 0) {
      const current = form.getValues(`bedrock_guardrail.content_filters.${index}`);
      updateContentFilter(index, { ...current, [field]: value });
    }
  };

  const isFilterEnabled = (filterType: ContentFilterType) => {
    return contentFilterFields.some((f: any) => f.type === filterType);
  };

  const getFilterStrength = (filterType: ContentFilterType, field: "input_strength" | "output_strength") => {
    const filter = contentFilterFields.find((f: any) => f.type === filterType) as any;
    return filter?.[field] || "MEDIUM";
  };

  const togglePIIEntity = (piiType: BedrockPIIEntityType, action: "BLOCK" | "ANONYMIZE" | "disabled") => {
    const currentEntities = form.getValues("bedrock_guardrail.pii_entities") || [];
    if (action === "disabled") {
      form.setValue(
        "bedrock_guardrail.pii_entities",
        currentEntities.filter((e: any) => e.type !== piiType),
        { shouldDirty: true }
      );
    } else {
      const existing = currentEntities.find((e: any) => e.type === piiType);
      if (existing) {
        form.setValue(
          "bedrock_guardrail.pii_entities",
          currentEntities.map((e: any) => (e.type === piiType ? { ...e, action } : e)),
          { shouldDirty: true }
        );
      } else {
        form.setValue(
          "bedrock_guardrail.pii_entities",
          [...currentEntities, { type: piiType, action }],
          { shouldDirty: true }
        );
      }
    }
  };

  const getPIIEntityAction = (piiType: BedrockPIIEntityType): "BLOCK" | "ANONYMIZE" | "disabled" => {
    const entities = bedrockValues?.pii_entities || [];
    const entity = entities.find((e: any) => e.type === piiType);
    return entity?.action || "disabled";
  };

  const toggleManagedWordList = (enabled: boolean) => {
    if (enabled) {
      form.setValue("bedrock_guardrail.managed_word_lists", ["PROFANITY"], { shouldDirty: true });
    } else {
      form.setValue("bedrock_guardrail.managed_word_lists", [], { shouldDirty: true });
    }
  };

  const isProfanityEnabled = () => {
    const lists = bedrockValues?.managed_word_lists || [];
    return lists.includes("PROFANITY");
  };

  const toggleGroundingFilter = (filterType: "GROUNDING" | "RELEVANCE", enabled: boolean) => {
    const currentFilters = form.getValues("bedrock_guardrail.contextual_grounding_filters") || [];
    if (enabled) {
      const exists = currentFilters.find((f: any) => f.type === filterType);
      if (!exists) {
        form.setValue(
          "bedrock_guardrail.contextual_grounding_filters",
          [...currentFilters, { type: filterType, threshold: 0.7 }],
          { shouldDirty: true }
        );
      }
    } else {
      form.setValue(
        "bedrock_guardrail.contextual_grounding_filters",
        currentFilters.filter((f: any) => f.type !== filterType),
        { shouldDirty: true }
      );
    }
  };

  const isGroundingFilterEnabled = (filterType: "GROUNDING" | "RELEVANCE") => {
    const filters = bedrockValues?.contextual_grounding_filters || [];
    return filters.some((f: any) => f.type === filterType);
  };

  const getGroundingThreshold = (filterType: "GROUNDING" | "RELEVANCE") => {
    const filters = bedrockValues?.contextual_grounding_filters || [];
    const filter = filters.find((f: any) => f.type === filterType);
    return filter?.threshold ?? 0.7;
  };

  const updateGroundingThreshold = (filterType: "GROUNDING" | "RELEVANCE", threshold: number) => {
    const currentFilters = form.getValues("bedrock_guardrail.contextual_grounding_filters") || [];
    const updatedFilters = currentFilters.map((f: any) =>
      f.type === filterType ? { ...f, threshold } : f
    );
    form.setValue("bedrock_guardrail.contextual_grounding_filters", updatedFilters, { shouldDirty: true });
  };

  return (
    <Card className="border-2 border-dashed border-primary/20">
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex flex-col gap-2">
          <CardTitle className={cn("flex items-center gap-2", disabled && "text-primary/50")}>
            <Shield className="size-5" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="cursor-help underline decoration-muted-foreground/50 decoration-dotted underline-offset-2 hover:decoration-muted-foreground">
                    AWS Bedrock Guardrails
                  </p>
                </TooltipTrigger>
                <TooltipContent className="w-[320px]">
                  <p>
                    AWS Bedrock Guardrails provides enterprise-grade content moderation
                    powered by AWS. Configure content filters, topic restrictions, PII
                    detection, word policies, and more.
                  </p>
                  <p className="mt-2 italic">
                    Runs as the first check in the pipeline before other RAI modules.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Badge variant="secondary" className="ml-2 text-xs">AWS Managed</Badge>
          </CardTitle>
          <CardDescription className={cn(disabled && "text-muted-foreground/50")}>
            Enterprise content governance powered by AWS Bedrock
          </CardDescription>
        </div>
        <FormField
          name="bedrock_guardrail.enabled"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(value) => field.onChange(value)}
                  disabled={!hasCredentials}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </CardHeader>

      {isFetchingCredentials ? (
        <CardContent>
          <Skeleton className="h-9 w-full" />
        </CardContent>
      ) : !hasCredentials ? (
        <CardContent>
          <div className="flex items-center gap-2 rounded-md border border-dashed p-4">
            <AlertCircle className="size-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No guardrail credentials configured.{" "}
              <Link
                to="/configure/guardrails"
                className="text-primary underline-offset-4 hover:underline"
              >
                Set up a credential
              </Link>{" "}
              to enable Bedrock Guardrails.
            </p>
          </div>
        </CardContent>
      ) : !disabled ? (
        <CardContent className="space-y-4">
          {/* Credential Selection */}
          <div className="space-y-2">
            <FormField
              name="bedrock_guardrail.credential_id"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guardrail Credential</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a credential" />
                      </SelectTrigger>
                      <SelectContent>
                        {guardrailCredentials.map((cred) => (
                          <SelectItem
                            key={cred.credential_id}
                            value={cred.credential_id}
                          >
                            <span>{cred.name}</span>
                            {cred.credentials?.aws_region_name && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({cred.credentials.aws_region_name})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Content Filters Section */}
          <Collapsible open={openSections.contentFilters} onOpenChange={() => toggleSection("contentFilters")}>
            <CollapsibleTrigger asChild>
              <div className="flex cursor-pointer items-center justify-between rounded-md border p-3 hover:bg-accent">
                <div>
                  <p className="font-medium">Content Filters</p>
                  <p className="text-xs text-muted-foreground">
                    Filter harmful content types with configurable strength levels
                  </p>
                </div>
                {openSections.contentFilters ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-3 rounded-md border p-3">
              {CONTENT_FILTER_TYPES.map((filter) => (
                <div key={filter.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isFilterEnabled(filter.type)}
                        onCheckedChange={(checked) => toggleContentFilter(filter.type, !!checked)}
                      />
                      <div>
                        <p className="text-sm font-medium">{filter.label}</p>
                        <p className="text-xs text-muted-foreground">{filter.description}</p>
                      </div>
                    </div>
                  </div>
                  {isFilterEnabled(filter.type) && (
                    <div className="ml-6 grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Input Strength</label>
                        <Select
                          value={getFilterStrength(filter.type, "input_strength")}
                          onValueChange={(v) => updateContentFilterStrength(filter.type, "input_strength", v as FilterStrength)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FILTER_STRENGTHS.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Output Strength</label>
                        <Select
                          value={getFilterStrength(filter.type, "output_strength")}
                          onValueChange={(v) => updateContentFilterStrength(filter.type, "output_strength", v as FilterStrength)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FILTER_STRENGTHS.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Topics Section */}
          <Collapsible open={openSections.topics} onOpenChange={() => toggleSection("topics")}>
            <CollapsibleTrigger asChild>
              <div className="flex cursor-pointer items-center justify-between rounded-md border p-3 hover:bg-accent">
                <div>
                  <p className="font-medium">Denied Topics</p>
                  <p className="text-xs text-muted-foreground">
                    Define topics that should be blocked from discussion
                  </p>
                </div>
                {openSections.topics ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-3 rounded-md border p-3">
              <div className="space-y-2">
                <Input
                  placeholder="Topic name (e.g., Investment Advice)"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                />
                <Textarea
                  placeholder="Topic definition (e.g., Any advice about investing money in stocks, bonds, or other financial instruments)"
                  value={topicDefinition}
                  onChange={(e) => setTopicDefinition(e.target.value)}
                  rows={2}
                />
                <Input
                  placeholder="Examples (comma-separated, optional)"
                  value={topicExamples}
                  onChange={(e) => setTopicExamples(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddTopic();
                  }}
                >
                  <Plus className="mr-1 size-4" /> Add Topic
                </Button>
              </div>
              {topicFields.length > 0 && (
                <div className="space-y-2">
                  {topicFields.map((field: any, index: number) => (
                    <div key={field.id} className="flex items-start justify-between rounded-md bg-accent p-2">
                      <div>
                        <p className="font-medium">{field.name}</p>
                        <p className="text-xs text-muted-foreground">{field.definition}</p>
                        {field.examples?.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {field.examples.map((ex: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">{ex}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={(e) => {
                          e.preventDefault();
                          removeTopic(index);
                        }}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Word Policy Section */}
          <Collapsible open={openSections.wordPolicy} onOpenChange={() => toggleSection("wordPolicy")}>
            <CollapsibleTrigger asChild>
              <div className="flex cursor-pointer items-center justify-between rounded-md border p-3 hover:bg-accent">
                <div>
                  <p className="font-medium">Word Policy</p>
                  <p className="text-xs text-muted-foreground">
                    Block specific words and enable profanity filter
                  </p>
                </div>
                {openSections.wordPolicy ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-3 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isProfanityEnabled()}
                  onCheckedChange={(checked) => toggleManagedWordList(!!checked)}
                />
                <div>
                  <p className="text-sm font-medium">Enable Profanity Filter</p>
                  <p className="text-xs text-muted-foreground">Block common profane words (AWS managed list)</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter comma-separated words to block..."
                    value={blockedWord}
                    onChange={(e) => setBlockedWord(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddBlockedWord();
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddBlockedWord();
                    }}
                  >
                    <Plus className="mr-1 size-4" /> Add
                  </Button>
                </div>
                {(bedrockValues?.blocked_words || []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(bedrockValues?.blocked_words || []).map((word: string, index: number) => (
                      <Badge key={index} variant="outline" className="rounded-full">
                        {word}
                        <X
                          className="ml-1 size-3 cursor-pointer"
                          onClick={() => handleRemoveBlockedWord(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* PII Section */}
          <Collapsible open={openSections.pii} onOpenChange={() => toggleSection("pii")}>
            <CollapsibleTrigger asChild>
              <div className="flex cursor-pointer items-center justify-between rounded-md border p-3 hover:bg-accent">
                <div>
                  <p className="font-medium">Sensitive Information (PII)</p>
                  <p className="text-xs text-muted-foreground">
                    Block or anonymize 28+ types of PII (AWS managed)
                  </p>
                </div>
                {openSections.pii ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 rounded-md border p-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {BEDROCK_PII_TYPES.map((pii) => {
                  const action = getPIIEntityAction(pii.type);
                  return (
                    <div key={pii.type} className="flex items-center justify-between text-sm">
                      <p className="text-xs">{pii.label}</p>
                      <div className="flex items-center rounded-md border bg-accent text-xs">
                        <span
                          className={cn(
                            "cursor-pointer px-2 py-1",
                            action === "disabled" && "border rounded-md bg-background"
                          )}
                          onClick={() => togglePIIEntity(pii.type, "disabled")}
                        >
                          Off
                        </span>
                        <span
                          className={cn(
                            "cursor-pointer px-2 py-1",
                            action === "BLOCK" && "border rounded-md bg-background"
                          )}
                          onClick={() => togglePIIEntity(pii.type, "BLOCK")}
                        >
                          Block
                        </span>
                        <span
                          className={cn(
                            "cursor-pointer px-2 py-1",
                            action === "ANONYMIZE" && "border rounded-md bg-background"
                          )}
                          onClick={() => togglePIIEntity(pii.type, "ANONYMIZE")}
                        >
                          Mask
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Regex Patterns Section */}
          <Collapsible open={openSections.regex} onOpenChange={() => toggleSection("regex")}>
            <CollapsibleTrigger asChild>
              <div className="flex cursor-pointer items-center justify-between rounded-md border p-3 hover:bg-accent">
                <div>
                  <p className="font-medium">Custom Regex Patterns</p>
                  <p className="text-xs text-muted-foreground">
                    Define custom patterns to block or anonymize
                  </p>
                </div>
                {openSections.regex ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-3 rounded-md border p-3">
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Pattern name"
                  value={regexName}
                  onChange={(e) => setRegexName(e.target.value)}
                />
                <Input
                  placeholder="Regex pattern"
                  value={regexPattern}
                  onChange={(e) => setRegexPattern(e.target.value)}
                />
                <div className="flex gap-2">
                  <Select value={regexAction} onValueChange={(v) => setRegexAction(v as "BLOCK" | "ANONYMIZE")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BLOCK">Block</SelectItem>
                      <SelectItem value="ANONYMIZE">Anonymize</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddRegex();
                    }}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
              {regexFields.length > 0 && (
                <div className="space-y-2">
                  {regexFields.map((field: any, index: number) => (
                    <div key={field.id} className="flex items-center justify-between rounded-md bg-accent p-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{field.action}</Badge>
                        <span className="font-medium">{field.name}</span>
                        <code className="rounded bg-muted px-1 text-xs">{field.pattern}</code>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={(e) => {
                          e.preventDefault();
                          removeRegex(index);
                        }}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Contextual Grounding Section */}
          <Collapsible open={openSections.grounding} onOpenChange={() => toggleSection("grounding")}>
            <CollapsibleTrigger asChild>
              <div className="flex cursor-pointer items-center justify-between rounded-md border p-3 hover:bg-accent">
                <div>
                  <p className="font-medium">Contextual Grounding</p>
                  <p className="text-xs text-muted-foreground">
                    Ensure responses are grounded and relevant
                  </p>
                </div>
                {openSections.grounding ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-4 rounded-md border p-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isGroundingFilterEnabled("GROUNDING")}
                    onCheckedChange={(checked) => toggleGroundingFilter("GROUNDING", !!checked)}
                  />
                  <div>
                    <p className="text-sm font-medium">Grounding Check</p>
                    <p className="text-xs text-muted-foreground">
                      Verify responses are factually grounded in provided context
                    </p>
                  </div>
                </div>
                {isGroundingFilterEnabled("GROUNDING") && (
                  <div className="ml-6 flex items-center gap-4">
                    <FormLabel className="text-xs">Threshold: {getGroundingThreshold("GROUNDING").toFixed(2)}</FormLabel>
                    <Slider
                      value={[getGroundingThreshold("GROUNDING")]}
                      onValueChange={([v]) => updateGroundingThreshold("GROUNDING", v)}
                      max={1}
                      min={0}
                      step={0.01}
                      className="w-48"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isGroundingFilterEnabled("RELEVANCE")}
                    onCheckedChange={(checked) => toggleGroundingFilter("RELEVANCE", !!checked)}
                  />
                  <div>
                    <p className="text-sm font-medium">Relevance Check</p>
                    <p className="text-xs text-muted-foreground">
                      Ensure responses are relevant to the user's query
                    </p>
                  </div>
                </div>
                {isGroundingFilterEnabled("RELEVANCE") && (
                  <div className="ml-6 flex items-center gap-4">
                    <FormLabel className="text-xs">Threshold: {getGroundingThreshold("RELEVANCE").toFixed(2)}</FormLabel>
                    <Slider
                      value={[getGroundingThreshold("RELEVANCE")]}
                      onValueChange={([v]) => updateGroundingThreshold("RELEVANCE", v)}
                      max={1}
                      min={0}
                      step={0.01}
                      className="w-48"
                    />
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Blocked Messaging Section */}
          <Collapsible open={openSections.messaging} onOpenChange={() => toggleSection("messaging")}>
            <CollapsibleTrigger asChild>
              <div className="flex cursor-pointer items-center justify-between rounded-md border p-3 hover:bg-accent">
                <div>
                  <p className="font-medium">Blocked Messages</p>
                  <p className="text-xs text-muted-foreground">
                    Custom messages shown when content is blocked
                  </p>
                </div>
                {openSections.messaging ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-3 rounded-md border p-3">
              <FormField
                name="bedrock_guardrail.blocked_input_messaging"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Blocked Input Message</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Message shown when input is blocked"
                        rows={2}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                name="bedrock_guardrail.blocked_output_messaging"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Blocked Output Message</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Message shown when output is blocked"
                        rows={2}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Guardrail ID Display (Read-only) */}
          {form.watch("bedrock_guardrail.guardrail_id") && (
            <div className="rounded-md border border-green-500/20 bg-green-50/50 p-3 dark:bg-green-950/20">
              <p className="text-xs text-muted-foreground">AWS Guardrail ID</p>
              <p className="font-mono text-sm">{form.watch("bedrock_guardrail.guardrail_id")}</p>
            </div>
          )}
        </CardContent>
      ) : null}
    </Card>
  );
};

export default BedrockGuardrails;
