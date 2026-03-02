import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { Info } from "lucide-react";

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { VoiceNewCreateFormValues } from "./types";
import { PronunciationRulesEditor } from "./pronunciation-rules-editor";

export function ConfigurePronunciation({
    form,
}: {
    form: UseFormReturn<VoiceNewCreateFormValues>;
}) {
    const [open, setOpen] = useState(false);
    const count = Object.keys(form.getValues("pronunciation_rules") ?? {}).length;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                className={cn(
                    buttonVariants({ variant: "link" }),
                    "flex items-center gap-2 p-0 text-indigo-600 animate-in slide-in-from-top-2 hover:text-indigo-500",
                )}
            >
                Configure
                <ArrowTopRightIcon className="size-4" />
            </DialogTrigger>

            <DialogContent className="max-w-3xl !rounded-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span>Pronunciation rules</span>
                        {count > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                                {count}
                            </Badge>
                        )}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Map terms to their spoken pronunciation. Rules are applied as text
                        replacement before TTS.{" "}
                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span
                                        role="button"
                                        tabIndex={-1}
                                        className="inline-flex cursor-help items-center gap-0.5 align-middle underline decoration-muted-foreground/50 decoration-dotted underline-offset-2 hover:decoration-muted-foreground"
                                    >
                                        SSML
                                        <Info className="size-3" />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="bottom"
                                    className="max-w-[280px] space-y-1.5 whitespace-normal text-xs leading-relaxed"
                                >
                                    <p className="font-semibold">
                                        Speech Synthesis Markup Language (SSML)
                                    </p>
                                    <p>
                                        SSML lets you control how text is spoken —
                                        pronunciation, emphasis, pauses, and more.
                                    </p>
                                    <p>
                                        Pronunciation rules run first: the agent replaces
                                        matching text, then sends the result to TTS.
                                    </p>
                                    <p>
                                        You can use plain text (e.g. &quot;A P I&quot;) or an
                                        SSML snippet if your TTS provider supports it.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </p>
                </DialogHeader>

                <Separator />

                <div className="space-y-8">
                    <PronunciationRulesEditor
                        value={form.getValues("pronunciation_rules") ?? {}}
                        onChange={(next) =>
                            form.setValue("pronunciation_rules", next, {
                                shouldDirty: true,
                            })
                        }
                    />
                </div>

                <Separator />
                <DialogFooter>
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
