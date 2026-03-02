import { useState } from "react";
import type { TrackReferenceOrPlaceholder } from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessageType } from "../chat/chat-tile";
import { TranscriptionTile } from "../transcriptions/transcription-tile";

interface ChatPanelProperties {
    agentAudioTrack?: TrackReferenceOrPlaceholder;
}

export function ChatPanel({ agentAudioTrack }: ChatPanelProperties) {
    const [inspectedItem, setInspectedItem] = useState<ChatMessageType | null>(null);

    return (
        <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-background">
            <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-12 bg-gradient-to-b from-background to-transparent backdrop-blur-[0.5px]" />
            <div
                className={cn(
                    "min-h-0 overflow-hidden p-4 transition-all",
                    inspectedItem ? "flex-[6]" : "flex-1",
                )}
            >
                <TranscriptionTile
                    agentAudioTrack={agentAudioTrack}
                    accentColor="indigo"
                    onInspect={setInspectedItem}
                />
            </div>

            <AnimatePresence>
                {inspectedItem && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "40%", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="flex flex-col border-t"
                    >
                        <div className="flex items-center justify-between px-4 py-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Inspect
                            </span>
                            <button
                                onClick={() => setInspectedItem(null)}
                                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground">
                                {JSON.stringify(inspectedItem.rawData ?? inspectedItem, null, 2)}
                            </pre>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
