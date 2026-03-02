import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { ChevronDown, RotateCcw } from "lucide-react";

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
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

import type { VoiceNewCreateFormValues } from "./types";
import {
  BACKGROUND_AMBIENCE_CLIPS,
  THINKING_SFX_CLIPS,
} from "./livekit-options";
import {
  normalizeBackgroundAudioConfig,
  DEFAULT_BACKGROUND_AUDIO,
  type BackgroundAudioConfig,
} from "./background-audio-defaults";

type SfxSource = { source: string; volume: number; probability: number };

function AmbienceSection({
  config,
  update,
}: {
  config: BackgroundAudioConfig;
  update: (function_: (previous: BackgroundAudioConfig) => BackgroundAudioConfig) => void;
}) {
  const ambientEnabled = Boolean(config.ambient?.enabled);
  const selectedSource = config.ambient?.source ?? "OFFICE_AMBIENCE";
  const volume = config.ambient?.volume ?? 0.6;

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Ambience</p>
          <p className="text-xs text-muted-foreground">
            Continuous room tone behind the agent
          </p>
        </div>
        <Switch
          checked={ambientEnabled}
          onCheckedChange={(checked) => {
            update((previous) => ({
              ...normalizeBackgroundAudioConfig(previous),
              ambient: {
                ...normalizeBackgroundAudioConfig(previous).ambient,
                enabled: checked,
              },
            }));
          }}
        />
      </div>

      {ambientEnabled && (
        <div className="space-y-4 animate-in fade-in-0 slide-in-from-top-1">
          <div className="flex gap-2">
            {BACKGROUND_AMBIENCE_CLIPS.map((clip) => (
              <button
                key={clip.value}
                type="button"
                onClick={() => {
                  update((previous) => ({
                    ...normalizeBackgroundAudioConfig(previous),
                    ambient: {
                      ...normalizeBackgroundAudioConfig(previous).ambient,
                      enabled: true,
                      source: clip.value,
                    },
                  }));
                }}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  selectedSource === clip.value
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-input hover:bg-muted/50",
                )}
              >
                <p className="text-xs font-medium">{clip.label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {clip.description}
                </p>
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              Volume{" "}
              <span className="font-normal text-muted-foreground/70">
                ({volume.toFixed(2)})
              </span>
            </Label>
            <Slider
              value={[volume]}
              onValueChange={([v]) => {
                update((previous) => ({
                  ...normalizeBackgroundAudioConfig(previous),
                  ambient: {
                    ...normalizeBackgroundAudioConfig(previous).ambient,
                    enabled: true,
                    volume: v,
                  },
                }));
              }}
              min={0}
              max={1}
              step={0.05}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ClipMixRow({
  clip,
  included,
  volume,
  probability,
  onToggle,
  onVolumeChange,
  onProbabilityChange,
}: {
  clip: (typeof THINKING_SFX_CLIPS)[number];
  included: boolean;
  volume: number;
  probability: number;
  onToggle: (checked: boolean) => void;
  onVolumeChange: (v: number) => void;
  onProbabilityChange: (p: number) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        !included && "opacity-50",
      )}
    >
      <div className="flex items-center gap-3">
        <Checkbox checked={included} onCheckedChange={onToggle} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium">{clip.label}</p>
          <p className="text-[11px] text-muted-foreground">
            {clip.description}
          </p>
        </div>
      </div>
      {included && (
        <div className="mt-3 grid grid-cols-2 gap-4 animate-in fade-in-0 slide-in-from-top-1">
          <div className="space-y-1">
            <Label className="text-[11px]">
              Volume{" "}
              <span className="text-muted-foreground/70">
                ({volume.toFixed(2)})
              </span>
            </Label>
            <Slider
              value={[volume]}
              onValueChange={([v]) => onVolumeChange(v)}
              min={0}
              max={1}
              step={0.05}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">
              Chance{" "}
              <span className="text-muted-foreground/70">
                ({probability.toFixed(2)})
              </span>
            </Label>
            <Slider
              value={[probability]}
              onValueChange={([p]) => onProbabilityChange(p)}
              min={0}
              max={1}
              step={0.05}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SfxEventSection({
  label,
  description,
  enabled,
  sources,
  onEnabledChange,
  onSourcesChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  sources: SfxSource[];
  onEnabledChange: (enabled: boolean) => void;
  onSourcesChange: (sources: SfxSource[]) => void;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const includedSources = new Map(sources.map((s) => [s.source, s]));

  function handleToggleClip(clipValue: string, checked: boolean) {
    if (checked) {
      onSourcesChange([
        ...sources,
        { source: clipValue, volume: 0.8, probability: 0.5 },
      ]);
    } else {
      onSourcesChange(sources.filter((s) => s.source !== clipValue));
    }
  }

  function handleUpdateClip(
    clipValue: string,
    field: "volume" | "probability",
    value: number,
  ) {
    onSourcesChange(
      sources.map((s) =>
        s.source === clipValue ? { ...s, [field]: value } : s,
      ),
    );
  }

  const activeCount = sources.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {enabled && activeCount > 0 && (
            <Badge variant="outline" className="text-[10px]">
              {activeCount} clip{activeCount === 1 ? "" : "s"}
            </Badge>
          )}
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>
      </div>

      {enabled && (
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform",
                advancedOpen && "rotate-180",
              )}
            />
            Clip mixer
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2 animate-in fade-in-0 slide-in-from-top-1">
            {THINKING_SFX_CLIPS.map((clip) => {
              const entry = includedSources.get(clip.value);
              return (
                <ClipMixRow
                  key={clip.value}
                  clip={clip}
                  included={Boolean(entry)}
                  volume={entry?.volume ?? 0.8}
                  probability={entry?.probability ?? 0.5}
                  onToggle={(checked) =>
                    handleToggleClip(clip.value, Boolean(checked))
                  }
                  onVolumeChange={(v) =>
                    handleUpdateClip(clip.value, "volume", v)
                  }
                  onProbabilityChange={(p) =>
                    handleUpdateClip(clip.value, "probability", p)
                  }
                />
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

export function ConfigureBackgroundAudio({
  form,
}: {
  form: UseFormReturn<VoiceNewCreateFormValues>;
}) {
  const [open, setOpen] = useState(false);

  const enabled = Boolean(form.watch("background_audio")?.enabled);
  const config = form.watch("background_audio");

  function setConfig(next: BackgroundAudioConfig) {
    form.setValue("background_audio", next, { shouldDirty: true });
  }

  function update(function_: (previous: BackgroundAudioConfig) => BackgroundAudioConfig) {
    const current = form.getValues("background_audio");
    setConfig(function_(current));
  }

  function handleToolCallEnabledChange(nextEnabled: boolean) {
    update((previous) => ({
      ...normalizeBackgroundAudioConfig(previous),
      tool_call: {
        ...normalizeBackgroundAudioConfig(previous).tool_call,
        enabled: nextEnabled,
      },
    }));
  }

  function handleToolCallSourcesChange(sources: SfxSource[]) {
    update((previous) => ({
      ...normalizeBackgroundAudioConfig(previous),
      tool_call: {
        ...normalizeBackgroundAudioConfig(previous).tool_call,
        enabled: true,
        sources,
      },
    }));
  }

  function handleTurnTakingEnabledChange(nextEnabled: boolean) {
    update((previous) => ({
      ...normalizeBackgroundAudioConfig(previous),
      turn_taking: {
        ...normalizeBackgroundAudioConfig(previous).turn_taking,
        enabled: nextEnabled,
      },
    }));
  }

  function handleTurnTakingSourcesChange(sources: SfxSource[]) {
    update((previous) => ({
      ...normalizeBackgroundAudioConfig(previous),
      turn_taking: {
        ...normalizeBackgroundAudioConfig(previous).turn_taking,
        enabled: true,
        sources,
      },
    }));
  }

  const normalizedConfig = normalizeBackgroundAudioConfig(config);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          update((previous) => normalizeBackgroundAudioConfig(previous));
        }
      }}
    >
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: "link" }),
          "flex items-center gap-2 p-0 text-indigo-600 animate-in slide-in-from-top-2 hover:text-indigo-500",
        )}
      >
        Configure
        <ArrowTopRightIcon className="size-4" />
      </DialogTrigger>

      <DialogContent className="max-w-lg !rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span>SFX & Ambience</span>
            <Badge variant={enabled ? "success" : "secondary"}>
              {enabled ? "Enabled" : "Disabled"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Add ambient room tone and sound effects to make calls feel
            realistic.
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {!enabled && (
          <div className="rounded-xl border bg-muted/30 p-4 text-sm">
            <p className="font-medium">SFX is off</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Enable it from the Features panel. Your settings here are still
              saved.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <AmbienceSection config={normalizedConfig} update={update} />

          <div className="space-y-4 rounded-xl border p-4">
            <div>
              <p className="text-sm font-medium">Sound Effects</p>
              <p className="text-xs text-muted-foreground">
                Short sounds played during agent activity
              </p>
            </div>

            <Separator />

            <SfxEventSection
              label="Tool-call"
              description="Plays while tools are executing"
              enabled={Boolean(normalizedConfig.tool_call?.enabled)}
              sources={normalizedConfig.tool_call?.sources ?? []}
              onEnabledChange={handleToolCallEnabledChange}
              onSourcesChange={handleToolCallSourcesChange}
            />

            <Separator />

            <SfxEventSection
              label="Thinking"
              description="Plays while the agent is formulating a response"
              enabled={Boolean(normalizedConfig.turn_taking?.enabled)}
              sources={normalizedConfig.turn_taking?.sources ?? []}
              onEnabledChange={handleTurnTakingEnabledChange}
              onSourcesChange={handleTurnTakingSourcesChange}
            />
          </div>
        </div>

        <Separator />

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfig(DEFAULT_BACKGROUND_AUDIO)}
          >
            <RotateCcw className="mr-2 size-3.5" />
            Reset defaults
          </Button>
          <DialogClose asChild>
            <Button variant="secondary" type="button">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
