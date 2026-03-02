import { useEffect, useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, AudioLines, Brain, Mic, Workflow } from "lucide-react";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import LabelWithTooltip from "@/components/custom/label-with-tooltip";
import { Codesandbox } from "@/components/custom/Codesandbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PipelineModelOption } from "@/lib/livekit/types";
import { cn } from "@/lib/utils";

import type { VoiceNewCreateFormValues } from "../types";
import { RealtimeModelSelector } from "../realtime-model-selector";
import {
  getLanguageOptionPresentation,
  type LanguageOptionPresentation,
} from "./language-display";
import { usePipelineOptions } from "./use-pipeline-options";
import { useRealtimeOptions } from "./use-realtime-options";
import { useRealtimeVoiceDefaulting } from "./use-realtime-voice-defaulting";

const AUTO_LANGUAGE_CODE = "auto";
const AUTO_ICON = "🌐";
const ELEVENLABS_SCRIBE_REALTIME_MODEL = "elevenlabs/scribe_v2_realtime";
const PIPELINE_AUTO_SUPPORTED_MODEL_IDS = new Set([
  "assemblyai/universal-streaming-multilingual",
  "deepgram/nova-3",
  "deepgram/nova-2",
  "elevenlabs/scribe_v2_realtime",
]);

function sortLanguageOptions(
  options: LanguageOptionPresentation[],
): LanguageOptionPresentation[] {
  const compare = (
    a: LanguageOptionPresentation,
    b: LanguageOptionPresentation,
  ) => a.label.localeCompare(b.label);
  const maybeToSorted = (
    options as LanguageOptionPresentation[] & {
      toSorted?: (
        compareFunction: (
          a: LanguageOptionPresentation,
          b: LanguageOptionPresentation,
        ) => number,
      ) => LanguageOptionPresentation[];
    }
  ).toSorted;
  if (typeof maybeToSorted === "function") {
    return maybeToSorted.call(options, compare);
  }

  const sorted: LanguageOptionPresentation[] = [];
  for (const option of options) {
    const insertionIndex = sorted.findIndex(
      (current) => compare(option, current) < 0,
    );
    if (insertionIndex === -1) {
      sorted.push(option);
      continue;
    }
    sorted.splice(insertionIndex, 0, option);
  }
  return sorted;
}

function parseInferenceDescriptor(value: string): {
  model: string;
  variant: string | undefined;
} {
  const raw = String(value ?? "").trim();
  if (!raw) return { model: "", variant: undefined };

  const [model, variant] = raw.split(":", 2);
  return {
    model: (model ?? "").trim(),
    variant: variant?.trim() || undefined,
  };
}

function getLanguageDisplayName(code: string): string {
  const normalizedCode = code.trim().toLowerCase();
  if (!normalizedCode) return "";

  try {
    let locale = "en";
    if (typeof navigator !== "undefined" && navigator.language) {
      locale = navigator.language;
    }
    const displayNames = new Intl.DisplayNames([locale], { type: "language" });
    return displayNames.of(normalizedCode) ?? normalizedCode;
  } catch {
    return normalizedCode;
  }
}

function buildPipelineAutoOptionLabel(
  model: PipelineModelOption | undefined,
): string | undefined {
  if (!model?.id) return undefined;

  const { model: descriptorModel } = parseInferenceDescriptor(model.id);
  const normalizedDescriptorModel = descriptorModel.toLowerCase();
  if (!PIPELINE_AUTO_SUPPORTED_MODEL_IDS.has(normalizedDescriptorModel)) {
    return undefined;
  }
  if (normalizedDescriptorModel === ELEVENLABS_SCRIBE_REALTIME_MODEL) {
    return "Auto (90+ languages supported)";
  }

  const baseLanguageCodes: string[] = [];
  for (const languageCode of model.languages ?? []) {
    const normalizedCode = String(languageCode ?? "").trim().toLowerCase();
    if (!normalizedCode || normalizedCode === "multi") continue;

    const baseCode = normalizedCode.split("-", 1)[0] ?? normalizedCode;
    if (!baseCode || baseLanguageCodes.includes(baseCode)) continue;
    baseLanguageCodes.push(baseCode);
  }

  if (baseLanguageCodes.length === 0) return "Auto";

  const languageNames = baseLanguageCodes.map((code) => getLanguageDisplayName(code));
  return `Auto (${languageNames.join(", ")})`;
}

function LanguageSelector({
  form,
  languages,
  disabled,
  autoOptionLabel,
}: {
  form: UseFormReturn<VoiceNewCreateFormValues>;
  languages: string[];
  disabled: boolean;
  autoOptionLabel?: string;
}) {
  const languageOptions = useMemo(() => {
    const cleaned = (languages ?? [])
      .map(
        (code) =>
          getLanguageOptionPresentation(String(code ?? "")).normalizedCode,
      )
      .filter(Boolean);
    const unique = [...new Set(cleaned)];
    const withFallback = unique.length > 0 ? unique : ["en"];
    const withAuto = autoOptionLabel
      ? [...withFallback, AUTO_LANGUAGE_CODE]
      : withFallback;

    // Sort by label for nicer UX.
    const options = withAuto.map((code) =>
      code === AUTO_LANGUAGE_CODE
        ? {
            normalizedCode: AUTO_LANGUAGE_CODE,
            label: autoOptionLabel ?? "Auto",
            icon: AUTO_ICON,
            isFallbackIcon: true,
          }
        : getLanguageOptionPresentation(code),
    );
    return sortLanguageOptions(options);
  }, [autoOptionLabel, languages]);
  const normalizedLanguages = useMemo(
    () => languageOptions.map((option) => option.normalizedCode),
    [languageOptions],
  );

  // Keep the current selection valid as provider/model changes.
  useEffect(() => {
    const current = getLanguageOptionPresentation(
      form.getValues("language") ?? "",
    ).normalizedCode;
    const isValid = Boolean(current) && normalizedLanguages.includes(current);
    if (isValid) return;

    const next =
      ["en", "en-US"].find((code) => normalizedLanguages.includes(code)) ??
      normalizedLanguages.find((code) => code.toLowerCase().startsWith("en")) ??
      normalizedLanguages[0] ??
      "en";
    form.setValue("language", next, { shouldDirty: false });
  }, [form, normalizedLanguages]);

  return (
    <FormField
      control={form.control}
      name="language"
      render={({ field }) => (
        <FormItem>
          <LabelWithTooltip
            align="start"
            tooltip="Select the language used for speech recognition / realtime language hints (provider-dependent)"
          >
            <span className="text-xs">Language</span>
          </LabelWithTooltip>
          <Select
            value={field.value}
            onValueChange={(value) => field.onChange((value ?? "").trim())}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {languageOptions.map((option) => (
                <SelectItem
                  key={option.normalizedCode}
                  value={option.normalizedCode}
                >
                  <span
                    aria-hidden
                    className="mr-2 inline-block w-5 text-center"
                  >
                    {option.icon}
                  </span>
                  {option.label}{" "}
                  <span className="text-muted-foreground">
                    ({option.normalizedCode})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Mode card                                                          */
/* ------------------------------------------------------------------ */

interface ModeCardProperties {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  badge: { label: string; className: string };
  children: React.ReactNode;
}

function ModeCard({
  selected,
  onClick,
  icon,
  title,
  badge,
  children,
}: ModeCardProperties) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex w-full flex-col gap-2.5 rounded-lg border p-3.5 text-left transition-all duration-200",
        selected
          ? "border-primary shadow-sm"
          : "border-border hover:border-primary/30 hover:bg-muted/40",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center justify-center rounded-md p-1.5 transition-colors",
              selected
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
            )}
          >
            {icon}
          </div>
          <span
            className={cn(
              "text-sm font-semibold transition-colors",
              selected
                ? "text-primary"
                : "text-foreground group-hover:text-primary",
            )}
          >
            {title}
          </span>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-medium",
            badge.className,
          )}
        >
          {badge.label}
        </span>
      </div>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Mini diagrams                                                      */
/* ------------------------------------------------------------------ */

function PipelineMiniDiagram({ selected }: { selected: boolean }) {
  const chipClass = cn(
    "rounded border px-1.5 py-0.5 text-[11px] font-medium transition-colors",
    selected
      ? "border-border bg-primary/10 text-primary"
      : "border-border bg-background text-muted-foreground",
  );
  const arrowClass = cn(
    "h-3 w-3 flex-shrink-0 transition-colors",
    selected ? "text-primary/50" : "text-muted-foreground/40",
  );

  return (
    <div className="flex items-center gap-1.5">
      <span className={chipClass}>STT</span>
      <ArrowRight className={arrowClass} />
      <span className={chipClass}>LLM</span>
      <ArrowRight className={arrowClass} />
      <span className={chipClass}>TTS</span>
    </div>
  );
}

function RealtimeMiniDiagram({ selected }: { selected: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[11px] font-medium transition-colors",
          selected
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
            : "border-border bg-background text-muted-foreground",
        )}
      >
        <AudioLines className="h-3 w-3" />
        Unified model
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mode chooser                                                       */
/* ------------------------------------------------------------------ */

function ModeChooser({
  activeMode,
  onChange,
}: {
  activeMode: VoiceNewCreateFormValues["active_mode"];
  onChange: (mode: VoiceNewCreateFormValues["active_mode"]) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <ModeCard
        selected={activeMode === "pipeline"}
        onClick={() => onChange("pipeline")}
        icon={<Workflow className="h-4 w-4" />}
        title="Pipeline"
        badge={{
          label: "Customizable",
          className:
            activeMode === "pipeline"
              ? "bg-primary/5 text-primary"
              : "bg-muted text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary",
        }}
      >
        <PipelineMiniDiagram selected={activeMode === "pipeline"} />
      </ModeCard>

      <ModeCard
        selected={activeMode === "realtime"}
        onClick={() => onChange("realtime")}
        icon={<Codesandbox className="h-4 w-4" />}
        title="Realtime"
        badge={{
          label: "Low latency",
          className:
            activeMode === "realtime"
              ? "bg-primary/5 text-primary"
              : "bg-muted text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary",
        }}
      >
        <RealtimeMiniDiagram selected={activeMode === "realtime"} />
      </ModeCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pipeline options panel                                             */
/* ------------------------------------------------------------------ */

function PipelinePanel({
  form,
  llmProviders,
  sttProviders,
  ttsProviders,
  isLoading,
}: {
  form: UseFormReturn<VoiceNewCreateFormValues>;
  llmProviders: ReturnType<typeof usePipelineOptions>["llmProviders"];
  sttProviders: ReturnType<typeof usePipelineOptions>["sttProviders"];
  ttsProviders: ReturnType<typeof usePipelineOptions>["ttsProviders"];
  isLoading: boolean;
}) {
  const selectedSttId = form.watch("stt");
  const selectedSttModel = useMemo(() => {
    const target = (selectedSttId ?? "").trim();
    if (!target) return;
    for (const provider of sttProviders) {
      const model = provider.models.find((candidate) => candidate.id === target);
      if (model) return model;
    }
    return;
  }, [selectedSttId, sttProviders]);
  const sttLanguages = useMemo(() => {
    if (selectedSttModel?.languages && selectedSttModel.languages.length > 0) {
      return selectedSttModel.languages;
    }
    return ["en"];
  }, [selectedSttModel]);
  const autoOptionLabel = useMemo(
    () => buildPipelineAutoOptionLabel(selectedSttModel),
    [selectedSttModel],
  );

  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Workflow className="h-3.5 w-3.5 text-primary/70" />
          Components
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <span>STT</span>
          <ArrowRight className="h-2.5 w-2.5" />
          <span>LLM</span>
          <ArrowRight className="h-2.5 w-2.5" />
          <span>TTS</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FormField
          control={form.control}
          name="stt"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-1.5">
                <Mic className="h-3.5 w-3.5 text-muted-foreground" />
                <LabelWithTooltip
                  align="start"
                  tooltip="Select the Speech-to-Text provider and model"
                >
                  <span className="mt-1 text-xs">STT</span>
                </LabelWithTooltip>
              </div>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue
                      placeholder={isLoading ? "Loading..." : "Select STT"}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sttProviders.map((p) => (
                    <SelectGroup key={p.providerId}>
                      <SelectLabel>{p.displayName}</SelectLabel>
                      {p.models.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="llm"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5 text-muted-foreground" />
                <LabelWithTooltip
                  align="start"
                  tooltip="Select the LLM model for your agent"
                >
                  <span className="mt-1 text-xs">LLM</span>
                </LabelWithTooltip>
              </div>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue
                      placeholder={isLoading ? "Loading..." : "Select LLM"}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {llmProviders.map((p) => (
                    <SelectGroup key={p.providerId}>
                      <SelectLabel>{p.displayName}</SelectLabel>
                      {p.models.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tts"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-1.5">
                <AudioLines className="h-3.5 w-3.5 text-muted-foreground" />
                <LabelWithTooltip
                  align="start"
                  tooltip="Select the Text-to-Speech provider and model"
                >
                  <span className="mt-1 text-xs">TTS</span>
                </LabelWithTooltip>
              </div>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue
                      placeholder={isLoading ? "Loading..." : "Select TTS"}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ttsProviders.map((p) => (
                    <SelectGroup key={p.providerId}>
                      <SelectLabel>{p.displayName}</SelectLabel>
                      {p.models.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3">
        <LanguageSelector
          form={form}
          languages={sttLanguages}
          disabled={isLoading}
          autoOptionLabel={autoOptionLabel}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Realtime options panel                                             */
/* ------------------------------------------------------------------ */

function RealtimePanel({
  form,
  realtimeProviders,
  realtimeVoices,
  isLoading,
  markUserInitiatedModelChange,
}: {
  form: UseFormReturn<VoiceNewCreateFormValues>;
  realtimeProviders: ReturnType<typeof useRealtimeOptions>["providers"];
  realtimeVoices: Array<{ id: string; name: string }>;
  isLoading: boolean;
  markUserInitiatedModelChange: () => void;
}) {
  const selectedRealtimeLlm = form.watch("realtime_llm");
  const realtimeLanguages = useMemo(() => {
    const raw = (selectedRealtimeLlm ?? "").trim();
    if (!raw) return ["en"];

    // Backwards compat: if value is a bare OpenAI model id, treat as openai/<id>.
    const normalized = raw.includes("/") ? raw : `openai/${raw}`;
    const providerId = normalized.split("/", 1)[0]!;
    const modelId = normalized.slice(providerId.length + 1);
    if (!providerId || !modelId) return ["en"];

    const provider = realtimeProviders.find((p) => p.providerId === providerId);
    const model = provider?.models.find((m) => m.id === modelId);
    if (model?.languages && model.languages.length > 0) return model.languages;
    return ["en"];
  }, [realtimeProviders, selectedRealtimeLlm]);

  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Codesandbox className="h-3.5 w-3.5" />
          Realtime engine
        </div>
        {/* <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
          Low latency
        </span> */}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="realtime_llm"
          render={({ field }) => (
            <FormItem>
              <LabelWithTooltip
                align="start"
                tooltip="Select a realtime provider and model"
              >
                <span className="text-xs">Realtime model</span>
              </LabelWithTooltip>
              <FormControl>
                <RealtimeModelSelector
                  value={field.value}
                  onValueChange={(value) => {
                    markUserInitiatedModelChange();
                    field.onChange(value);
                  }}
                  providers={realtimeProviders}
                  disabled={isLoading}
                  placeholder={
                    isLoading ? "Loading realtime models..." : undefined
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="realtime_voice"
          render={({ field }) => (
            <FormItem>
              <LabelWithTooltip
                align="start"
                tooltip="Select the voice preset for the chosen realtime provider"
              >
                <span className="text-xs">Voice</span>
              </LabelWithTooltip>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isLoading || realtimeVoices.length === 0}
              >
                <FormControl>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {realtimeVoices.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3">
        <LanguageSelector
          form={form}
          languages={realtimeLanguages}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main section                                                       */
/* ------------------------------------------------------------------ */

export function EngineModeSection({
  form,
}: {
  form: UseFormReturn<VoiceNewCreateFormValues>;
}) {
  const activeMode = form.watch("active_mode");
  const realtimeLlm = form.watch("realtime_llm");
  const { providers: realtimeProviders, isLoading: isLoadingRealtime } =
    useRealtimeOptions();
  const {
    sttProviders,
    ttsProviders,
    llmProviders,
    isLoading: isLoadingPipeline,
  } = usePipelineOptions();

  const selectedRealtimeProvider = useMemo(() => {
    const v = (realtimeLlm ?? "").trim();
    if (!v.includes("/")) return;
    const providerId = v.split("/", 1)[0];
    return realtimeProviders.find((p) => p.providerId === providerId);
  }, [realtimeLlm, realtimeProviders]);

  const realtimeVoices = selectedRealtimeProvider?.voices ?? [];
  const { markUserInitiatedModelChange } = useRealtimeVoiceDefaulting({
    form,
    activeMode,
    realtimeVoices,
  });

  return (
    <div className="col-span-4 space-y-3">
      <LabelWithTooltip
        align="start"
        tooltip="Switch between classic STT→LLM→TTS pipeline and realtime voice mode"
      >
        <span className="text-sm font-medium">Engine Mode</span>
      </LabelWithTooltip>

      <ModeChooser
        activeMode={activeMode}
        onChange={(mode) =>
          form.setValue("active_mode", mode, { shouldDirty: true })
        }
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeMode}
          initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
          transition={{
            type: "spring",
            bounce: 0.2,
            duration: 0.35,
          }}
        >
          {activeMode === "realtime" ? (
            <RealtimePanel
              form={form}
              realtimeProviders={realtimeProviders}
              realtimeVoices={realtimeVoices}
              isLoading={isLoadingRealtime}
              markUserInitiatedModelChange={markUserInitiatedModelChange}
            />
          ) : (
            <PipelinePanel
              form={form}
              llmProviders={llmProviders}
              sttProviders={sttProviders}
              ttsProviders={ttsProviders}
              isLoading={isLoadingPipeline}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
