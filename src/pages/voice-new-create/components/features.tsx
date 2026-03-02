import { useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Search } from "lucide-react";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { NOISE_CANCELLATION_TYPES, AVATAR_OPTIONS } from "./livekit-options";
import type { VoiceNewCreateFormValues } from "./types";
import { ConfigureRag } from "@/pages/create-agent/components/configure-rag";
import { ConfigureBackgroundAudio } from "./configure-background-audio";
import { ConfigureDynamicVariables } from "./configure-dynamic-variables";
import { ConfigurePronunciation } from "./configure-pronunciation";

type FeatureCard = {
  key:
    | "noise_cancellation"
    | "rag"
    | "avatar"
    | "background_audio"
    | "preemptive_generation"
    | "pronunciation_correction"
    | "dynamic_variables"
    | "screen_share"
    | "live_video";
  title: string;
  description: string;
  /** Optional secondary description shown below the feature toggle. */
  secondaryDescription?: string;
  /** If true, feature is permanently disabled (stub). */
  comingSoon?: boolean;
};

const CORE_FEATURES: FeatureCard[] = [
  {
    key: "avatar",
    title: "Virtual Avatar",
    description: "Display a live lip-synced virtual person during voice calls.",
  },
  {
    key: "rag",
    title: "Knowledge Base (RAG)",
    description:
      "Let the agent reference a knowledge base for grounded responses.",
  },
  {
    key: "noise_cancellation",
    title: "Noise cancellation",
    description: "Suppress background noise before audio hits the agent.",
    secondaryDescription: "Powered by Krisp",
  },
  {
    key: "background_audio",
    title: "SFX",
    description: "Configure Ambience & Tool Call sounds",
  },
  {
    key: "dynamic_variables",
    title: "Dynamic variables",
    description:
      "Set default values for prompt placeholders like {{company_name}}.",
  },
  {
    key: "preemptive_generation",
    title: "Preemptive generation",
    description:
      "The model will start thinking of a response before your turn ends.\nCosts More, Reduces latency.",
  },
  {
    key: "pronunciation_correction",
    title: "Pronunciation correction",
    description:
      "Automatically correct pronunciation of technical terms, acronyms, and abbreviations before TTS.",
  },
  {
    key: "screen_share",
    title: "Screen share",
    description: "Allow user to share their screen with the agent.",
    comingSoon: true,
  },
  {
    key: "live_video",
    title: "Camera Feed",
    description: "Enable live camera feed for visual context.",
    comingSoon: true,
  },
];

export function VoiceNewFeaturesPanel({
  form,
}: {
  form: UseFormReturn<VoiceNewCreateFormValues>;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [triggerRagDialog, setTriggerRagDialog] = useState(false);
  const kbEnabled = form.watch("knowledge_base_enabled");
  const kbConfig = form.watch("knowledge_base_config");
  const dynamicVariablesEnabled = form.watch("dynamic_variables_enabled");
  const backgroundAudioEnabled = Boolean(form.watch("background_audio")?.enabled);
  const kbIsAgentic = (kbConfig?.agentic_rag?.length ?? 0) > 0;
  const kbId = kbConfig?.lyzr_rag?.rag_id?.trim() ?? "";
  const kbNameRaw = kbConfig?.lyzr_rag?.rag_name?.trim() ?? "";
  const kbName = kbNameRaw ? kbNameRaw.slice(0, -4) : "";
  const kbTopK = kbConfig?.lyzr_rag?.params?.top_k;

  const filteredCoreFeatures = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return CORE_FEATURES;
    return CORE_FEATURES.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-none px-2">
        <div className="flex items-center rounded-md border border-input px-2">
          <Search className="size-5" />
          <Input
            placeholder="Search features..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="border-none bg-transparent shadow-none focus:outline-none focus:ring-0"
          />
        </div>
      </div>

      <div className="no-scrollbar mt-4 flex-1 overflow-y-auto px-2">
        <div className="grid grid-cols-1 gap-4 pr-1 sm:gap-6">
          <div>
            <div className="sticky top-0 z-20 mb-3 flex items-center gap-2 bg-background sm:mb-4 sm:gap-4">
              <h3 className="text-sm font-semibold text-primary">
                Core Features
              </h3>
              <div className="h-px flex-grow bg-gray-200 dark:bg-gray-700" />
              <div className="pr-4" />
            </div>

            <div className="grid grid-cols-1 gap-2">
              {filteredCoreFeatures.map((feature) => (
                <div
                  key={feature.key}
                  className="rounded-xl border border-input p-3 sm:p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <div className="flex cursor-help items-center gap-2">
                              <p className="text-[0.8rem] font-medium text-gray-600 underline decoration-muted-foreground/50 decoration-dotted underline-offset-2 hover:decoration-muted-foreground dark:text-gray-300">
                                {feature.title}
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-[200px] whitespace-pre-line">
                              {feature.description}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <div className="flex items-center gap-2">
                        {(() => {
                          switch (feature.key) {
                            case "noise_cancellation": {
                              return (
                                <FormField
                                  control={form.control}
                                  name="noise_cancellation_type"
                                  render={({ field }) => (
                                    <FormItem className="m-0">
                                      <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="h-9 w-[190px] text-sm">
                                            <SelectValue placeholder="Select noise cancellation" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {NOISE_CANCELLATION_TYPES.map(
                                            (opt) => (
                                              <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                              >
                                                {opt.label}
                                              </SelectItem>
                                            ),
                                          )}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              );
                            }
                            case "rag": {
                              return (
                                <FormField
                                  control={form.control}
                                  name="knowledge_base_enabled"
                                  render={({ field }) => (
                                    <FormItem className="m-0">
                                      <FormControl>
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={(checked) => {
                                            field.onChange(checked);
                                            if (checked) {
                                              const hasRagId = Boolean(
                                                form.getValues(
                                                  "knowledge_base_config",
                                                )?.lyzr_rag?.rag_id,
                                              );
                                              if (!hasRagId)
                                                setTriggerRagDialog(true);
                                            } else {
                                              setTriggerRagDialog(false);
                                              form.setValue(
                                                "knowledge_base_config",
                                                null,
                                                {
                                                  shouldDirty: true,
                                                },
                                              );
                                            }
                                          }}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              );
                            }
                            case "avatar": {
                              return (
                                <div className="flex items-center gap-2">
                                  <FormField
                                    control={form.control}
                                    name="avatar_id"
                                    render={({ field }) => (
                                      <FormItem className="m-0">
                                        <Select
                                          value={field.value}
                                          onValueChange={field.onChange}
                                          disabled={
                                            !form.watch("avatar_enabled")
                                          }
                                        >
                                          <FormControl>
                                            <SelectTrigger className="h-9 w-[130px] text-sm">
                                              <SelectValue placeholder="Select avatar" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {AVATAR_OPTIONS.map((opt) => (
                                              <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                              >
                                                {opt.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name="avatar_enabled"
                                    render={({ field }) => (
                                      <FormItem className="m-0">
                                        <FormControl>
                                          <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              );
                            }
                            case "background_audio": {
                              return (
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={backgroundAudioEnabled}
                                    onCheckedChange={(checked) => {
                                      const current =
                                        form.getValues("background_audio");
                                      form.setValue(
                                        "background_audio",
                                        {
                                          ...current,
                                          enabled: checked,
                                        },
                                        { shouldDirty: true },
                                      );
                                    }}
                                  />
                                </div>
                              );
                            }
                            case "preemptive_generation": {
                              return (
                                <FormField
                                  control={form.control}
                                  name="preemptive_generation"
                                  render={({ field }) => (
                                    <FormItem className="m-0">
                                      <FormControl>
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              );
                            }
                            case "pronunciation_correction": {
                              return (
                                <FormField
                                  control={form.control}
                                  name="pronunciation_correction"
                                  render={({ field }) => (
                                    <FormItem className="m-0">
                                      <FormControl>
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={(checked) => {
                                            field.onChange(checked);
                                            if (!checked) {
                                              form.setValue(
                                                "pronunciation_rules",
                                                {},
                                                { shouldDirty: true },
                                              );
                                            }
                                          }}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              );
                            }
                            case "dynamic_variables": {
                              return (
                                <FormField
                                  control={form.control}
                                  name="dynamic_variables_enabled"
                                  render={({ field }) => (
                                    <FormItem className="m-0">
                                      <FormControl>
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={(checked) => {
                                            field.onChange(checked);
                                            if (!checked) {
                                              form.setValue(
                                                "dynamic_variable_defaults",
                                                {},
                                                { shouldDirty: true },
                                              );
                                            }
                                          }}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              );
                            }
                            default: {
                              if (feature.comingSoon) {
                                return (
                                  <TooltipProvider>
                                    <Tooltip delayDuration={300}>
                                      <TooltipTrigger asChild>
                                        <div className="inline-flex cursor-help items-center gap-2">
                                          <Badge
                                            variant="outline"
                                            className="text-[10px]"
                                          >
                                            Coming soon
                                          </Badge>
                                          <Switch checked={false} disabled />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="top"
                                        align="end"
                                        className="max-w-[260px]"
                                      >
                                        <p>{feature.description}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                );
                              }

                              return (
                                <>
                                  <Switch checked={false} disabled />
                                </>
                              );
                            }
                          }
                        })()}
                      </div>
                    </div>

                    {/* Secondary description (e.g., "Powered by Krisp") */}
                    {feature.secondaryDescription && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {feature.secondaryDescription}
                      </p>
                    )}

                    {feature.key === "rag" && kbEnabled && (
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <ConfigureRag
                          value={kbConfig}
                          onChange={(next) => {
                            form.setValue("knowledge_base_config", next, {
                              shouldDirty: true,
                            });
                            if (next?.lyzr_rag?.rag_id) {
                              form.setValue("knowledge_base_enabled", true, {
                                shouldDirty: true,
                              });
                              setTriggerRagDialog(false);
                            }
                          }}
                          onDisable={() => {
                            form.setValue("knowledge_base_enabled", false, {
                              shouldDirty: true,
                            });
                            form.setValue("knowledge_base_config", null, {
                              shouldDirty: true,
                            });
                            setTriggerRagDialog(false);
                          }}
                          openDialog={triggerRagDialog}
                          disableAgenticRag={true}
                        />
                        <div className="min-w-0">
                          {(() => {
                            if (kbIsAgentic) {
                              return (
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                  <Badge variant="outline">Agentic RAG</Badge>
                                  <Badge variant="outline">
                                    {kbConfig?.agentic_rag?.length} Knowledge
                                    Base(s)
                                  </Badge>
                                </div>
                              );
                            }

                            if (kbId) {
                              return (
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                  <Badge
                                    variant="outline"
                                    className="max-w-[220px] truncate"
                                    title={kbNameRaw || kbId}
                                  >
                                    {kbName || kbNameRaw || kbId}
                                  </Badge>
                                  {typeof kbTopK === "number" ? (
                                    <Badge variant="outline">
                                      {kbTopK}{" "}
                                      {kbTopK === 1 ? "chunk" : "chunks"}
                                    </Badge>
                                  ) : null}
                                </div>
                              );
                            }

                            return (
                              <p className="text-right text-xs text-muted-foreground">
                                Select a knowledge base to enable grounded
                                answers.
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {feature.key === "pronunciation_correction" &&
                      form.watch("pronunciation_correction") && (
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <ConfigurePronunciation form={form} />
                          <div className="min-w-0">
                            <p className="text-right text-xs text-muted-foreground">
                              Define how specific terms should be spoken.
                            </p>
                          </div>
                        </div>
                      )}

                    {feature.key === "dynamic_variables" &&
                      dynamicVariablesEnabled && (
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <ConfigureDynamicVariables form={form} />
                          <div className="min-w-0">
                            <p className="text-right text-xs text-muted-foreground">
                              Add fallback values for placeholders used in
                              prompts and greetings.
                            </p>
                          </div>
                        </div>
                      )}

                    {feature.key === "background_audio" &&
                      backgroundAudioEnabled && (
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <ConfigureBackgroundAudio form={form} />
                          <div className="min-w-0">
                            <p className="text-right pl-1.5 text-xs text-muted-foreground">
                              Add ambience and tool-call sounds for a more
                              realistic experience.
                            </p>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              ))}

              {filteredCoreFeatures.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No matching features.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
