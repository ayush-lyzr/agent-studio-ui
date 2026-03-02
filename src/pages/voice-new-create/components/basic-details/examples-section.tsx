import type { UseFormReturn } from "react-hook-form";
import { MinusCircle, Plus } from "lucide-react";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import LabelWithTooltip from "@/components/custom/label-with-tooltip";

import type { VoiceNewCreateFormValues } from "../types";

export function ExamplesSection({
  form,
}: {
  form: UseFormReturn<VoiceNewCreateFormValues>;
}) {
  const examplesVisible = Boolean(form.watch("examples_visible"));

  return (
    <FormField
      control={form.control}
      name="examples"
      render={({ field }) => (
        <FormItem className="col-span-4">
          <div className="flex items-center justify-between gap-3">
            <LabelWithTooltip
              align="start"
              tooltip="Add example outputs to guide your agent"
            >
              <span className="text-sm">Examples (Text)</span>
            </LabelWithTooltip>
            <span
              className={`${buttonVariants({
                variant: "outline",
                size: "sm",
              })} cursor-pointer`}
              onClick={() => {
                const checked = Boolean(form.getValues("examples_visible"));
                form.setValue("examples_visible", !checked, {
                  shouldDirty: true,
                });
                if (checked) {
                  form.setValue("examples", "", { shouldDirty: true });
                }
              }}
            >
              {examplesVisible ? (
                <MinusCircle className="mr-1 size-4" />
              ) : (
                <Plus className="mr-1 size-4" />
              )}
              {examplesVisible ? "Remove" : "Add"}
            </span>
          </div>
          <FormControl>
            {examplesVisible && (
              <Textarea
                {...field}
                placeholder="Add example outputs to guide your agent"
                rows={5}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
