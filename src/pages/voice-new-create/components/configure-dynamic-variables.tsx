import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";

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
import { cn } from "@/lib/utils";

import type { VoiceNewCreateFormValues } from "./types";
import { KeyValueMapEditor } from "./key-value-map-editor";

export function ConfigureDynamicVariables({
    form,
}: {
    form: UseFormReturn<VoiceNewCreateFormValues>;
}) {
    const [open, setOpen] = useState(false);
    const count = Object.keys(
        form.getValues("dynamic_variable_defaults") ?? {},
    ).length;

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
                        <span>Dynamic variables</span>
                        {count > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                                {count}
                            </Badge>
                        )}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Provide default values for prompt placeholders like{" "}
                        <span className="rounded bg-muted px-1 font-mono text-xs">
                            {`{{company_name}}`}
                        </span>
                        . Your API can override these at runtime; defaults are used as
                        fallbacks.
                    </p>
                </DialogHeader>

                <Separator />

                <div className="space-y-8">
                    <KeyValueMapEditor
                        title="Default dynamic variables"
                        description="Fallback values used when your API does not supply a dynamic variable for a placeholder."
                        value={form.getValues("dynamic_variable_defaults") ?? {}}
                        onChange={(next) =>
                            form.setValue("dynamic_variable_defaults", next, {
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
