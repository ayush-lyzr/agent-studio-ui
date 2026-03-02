import { useState, useEffect, useRef } from "react";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import axios from "axios";
import useStore from "@/lib/store";
import { BASE_URL } from "@/lib/constants";
import { RefreshCw, PlayCircle } from "lucide-react";
import { useForm, useFormContext } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface VoiceTags {
  accent: string;
  descriptive: string;
  age: string;
  gender: string;
  language: string;
  use_case: string;
}

interface Voice {
  name: string;
  voice_id: string;
  preview_url: string;
  tags: VoiceTags;
}

interface ConfigureVoiceAgentProps {
  featureName: string;
  openDialog?: boolean;
  updateFeatures: (
    name: string,
    enabled: boolean,
    ragId?: string,
    ragName?: string,
    config?: Record<string, any>,
  ) => void;
}

const formSchema = z.object({
  voice_id: z.string().min(1, "Please select a voice"),
  elevenlabs_key: z.string().min(1, "Required"),
  deepgram_key: z.string().min(1, "Required"),
});

export const ConfigureVoiceAgent: React.FC<ConfigureVoiceAgentProps> = ({
  featureName,
  openDialog,
  updateFeatures,
}) => {
  const [open, setOpen] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [elevenLabsCredentials, setElevenLabsCredentials] = useState<any[]>([]);
  const [deepgramCredentials, setDeepgramCredentials] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const apiKey = useStore((state) => state.api_key);
  const parentForm = useFormContext();

  const existingFeatures = parentForm?.watch("features") || [];
  const existingVoiceConfig = existingFeatures.find(
    (feature: any) => feature.type === "VOICE",
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      voice_id: existingVoiceConfig?.config?.voice_id || "",
      elevenlabs_key: existingVoiceConfig?.config?.elevenlabs_key || "",
      deepgram_key: existingVoiceConfig?.config?.deepgram_key || "",
    },
  });

  useEffect(() => {
    if (openDialog) {
      setOpen(true);
    }
  }, [openDialog]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);

    if (isOpen && existingVoiceConfig?.config) {
      form.reset({
        voice_id: existingVoiceConfig.config.voice_id || "",
        elevenlabs_key: existingVoiceConfig.config.elevenlabs_key || "",
        deepgram_key: existingVoiceConfig.config.deepgram_key || "",
      });
    }

    if (!isOpen && !form.getValues().voice_id) {
      updateFeatures(featureName, false);
    }
  };

  const fetchCredentials = async (
    providerKey: string,
    setCredentials: React.Dispatch<React.SetStateAction<any[]>>,
  ) => {
    try {
      const response = await axios.get(
        `/v3/providers/credentials/user/llm/${providerKey}`,
        {
          baseURL: BASE_URL,
          headers: {
            accept: "application/json",
            "x-api-key": apiKey,
          },
        },
      );
      setCredentials(response.data.credentials || []);
    } catch (err) {
      console.error(`Error fetching ${providerKey} credentials`, err);
    }
  };

  const fetchVoices = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/v3/inference/voices/`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            accept: "application/json",
          },
        },
      );
      const data = await response.json();
      setAvailableVoices(data);
    } catch (err) {
      console.error("Error fetching voices", err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchCredentials("elevenlabs", setElevenLabsCredentials),
      fetchCredentials("deepgram", setDeepgramCredentials),
      fetchVoices(),
    ]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchCredentials("elevenlabs", setElevenLabsCredentials);
    fetchCredentials("deepgram", setDeepgramCredentials);
    fetchVoices();
  }, []);

  const canShowVoiceSelector = !!(
    form.watch("elevenlabs_key") &&
    form.watch("deepgram_key") &&
    availableVoices.length > 0
  );

  const canSave = !!(
    form.watch("voice_id") &&
    form.watch("elevenlabs_key") &&
    form.watch("deepgram_key")
  );

  const onSubmit = () => {
    const values = form.getValues();
    if (!values.voice_id || !values.elevenlabs_key || !values.deepgram_key)
      return;

    updateFeatures(featureName, true, undefined, undefined, {
      voice_id: values.voice_id,
      elevenlabs_key: values.elevenlabs_key,
      deepgram_key: values.deepgram_key,
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: "link" }),
          "flex items-center gap-2 p-0 text-indigo-600 animate-in slide-in-from-top-2 hover:text-indigo-500",
        )}
      >
        Configure
        <ArrowTopRightIcon className="size-4" />
        {form.watch("voice_id") && (
          <span className="rounded border  border-muted-foreground bg-transparent px-2 py-0.5 text-[10px] font-bold text-black text-muted-foreground">
            {availableVoices.find((v) => v.voice_id === form.watch("voice_id"))
              ?.name || ""}
          </span>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg !rounded-xl">
        <DialogHeader>
          <DialogTitle>Configure Voice Agent</DialogTitle>
          <DialogDescription>
            Choose voice credentials and voice for your agent.
          </DialogDescription>
        </DialogHeader>

        <Separator />
        <div className="flex flex-col gap-4">
          {/* ElevenLabs Key */}
          <div className="flex items-center gap-2">
            <Select
              value={form.watch("elevenlabs_key")}
              onValueChange={(val) => {
                if (val === "create-new-eleven") {
                  window.open("/configure/models", "_blank");
                  return;
                }
                form.setValue("elevenlabs_key", val);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select ElevenLabs Key" />
              </SelectTrigger>
              <SelectContent>
                {elevenLabsCredentials.map((cred) => (
                  <SelectItem key={cred._id} value={cred._id}>
                    {cred.name || cred._id}
                  </SelectItem>
                ))}
                <SelectItem
                  value="create-new-eleven"
                  className="text-indigo-600"
                >
                  <div className="flex items-center gap-1">
                    Create New <ArrowTopRightIcon className="size-4" />
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleRefresh}
            >
              <RefreshCw
                className={cn("size-4", isRefreshing && "animate-spin")}
              />
            </Button>
          </div>

          {/* Deepgram Key */}
          <div className="flex items-center gap-2">
            <Select
              value={form.watch("deepgram_key")}
              onValueChange={(val) => {
                if (val === "create-new-deepgram") {
                  window.open("/configure/models", "_blank");
                  return;
                }
                form.setValue("deepgram_key", val);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Deepgram Key" />
              </SelectTrigger>
              <SelectContent>
                {deepgramCredentials.map((cred) => (
                  <SelectItem key={cred._id} value={cred._id}>
                    {cred.name || cred._id}
                  </SelectItem>
                ))}
                <SelectItem
                  value="create-new-deepgram"
                  className="text-indigo-600"
                >
                  <div className="flex items-center gap-1">
                    Create New <ArrowTopRightIcon className="size-4" />
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleRefresh}
            >
              <RefreshCw
                className={cn("size-4", isRefreshing && "animate-spin")}
              />
            </Button>
          </div>

          {/* Voice Selector */}
          <Select
            value={form.watch("voice_id")}
            onValueChange={(val) => form.setValue("voice_id", val)}
            disabled={!canShowVoiceSelector}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Voice" />
            </SelectTrigger>
            <SelectContent
              //@ts-ignore
              forceMount
            >
              {availableVoices.map((voice, index) => (
                <div key={voice.voice_id} className="px-2 py-1">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <SelectItem
                        value={voice.voice_id}
                        className="flex-1 !cursor-pointer !p-0 text-left"
                      >
                        <span className="text-sm font-semibold">
                          {voice.name}
                        </span>
                      </SelectItem>
                      {voice.preview_url && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (audioRef.current) {
                              audioRef.current.pause();
                              audioRef.current.currentTime = 0;
                            }
                            const newAudio = new Audio(voice.preview_url);
                            audioRef.current = newAudio;
                            newAudio.play();
                          }}
                          title="Play preview"
                        >
                          <PlayCircle className="h-5 w-5 text-blue-600 hover:text-blue-800" />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Object.values(voice.tags)
                        .filter(Boolean)
                        .map((tag, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  </div>
                  {index !== availableVoices.length - 1 && (
                    <div className="my-2 h-px w-full bg-border" />
                  )}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" type="button">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={onSubmit} disabled={!canSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
