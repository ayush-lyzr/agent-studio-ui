import { z } from "zod";
import { useState } from "react";
import { useForm, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExternalLink } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import LabelWithTooltip from "@/components/custom/label-with-tooltip";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";

interface ConfigureMemoryProps {
  updateFeatures: (
    name: string,
    enabled: boolean,
    ragId?: string,
    ragName?: string,
    config?: any,
  ) => void;
  featureName: string;
  openDialog?: boolean;
}

export const ConfigureMemory: React.FC<ConfigureMemoryProps> = ({
  updateFeatures,
  featureName,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const parentForm = useFormContext();

  const existingFeatures = parentForm?.watch("features") || [];
  const existingMemoryConfig = existingFeatures.find(
    (feature: any) => feature.type === "MEMORY",
  );
  const existingMemoryCount =
    existingMemoryConfig?.config?.max_messages_context_count || 10;

  const formSchema = z.object({
    max_messages_context_count: z.coerce
      .number()
      .int()
      .min(2)
      .max(50)
      .default(10),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      max_messages_context_count: existingMemoryCount,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateFeatures(
      featureName,
      true,
      String(values.max_messages_context_count),
      "",
      {
        ...values,
      },
    );

    form.reset(values);

    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setOpen(true);
    } else {
      if (
        form.getValues("max_messages_context_count") <= 2 ||
        form.getValues("max_messages_context_count") >= 50
      ) {
        updateFeatures(
          featureName,
          true,
          String(existingMemoryCount),
          "",
          existingMemoryConfig?.config,
        );
        form.reset(existingMemoryConfig?.config);
      }
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: "link" }),
          "p-0 text-link animate-in slide-in-from-top-2 hover:text-link/80",
        )}
      >
        Configure
        <ExternalLink className="size-4" />
      </DialogTrigger>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-4"
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure Memory</DialogTitle>
            </DialogHeader>
            <Separator />
            <FormField
              control={form.control}
              name="max_messages_context_count"
              render={({ field }) => (
                <FormItem>
                  <LabelWithTooltip
                    tooltip="Messages beyond this limit are summarized and stored as Long-term Memory."
                    required={true}
                  >
                    Max. messages stored as Short-term Memory
                  </LabelWithTooltip>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">2</span>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        min={2}
                        max={50}
                        className="py-6"
                        onValueChange={(value) => field.onChange(Number(value))}
                      />
                    </FormControl>
                    <span className="text-sm text-muted-foreground">50</span>
                  </div>
                  <p className="text-sm">{field.value} messages</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <DialogFooter>
              <DialogClose className={buttonVariants({ variant: "secondary" })}>
                Close
              </DialogClose>
              <Button onClick={form.handleSubmit(onSubmit)}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Form>
    </Dialog>
  );
};
