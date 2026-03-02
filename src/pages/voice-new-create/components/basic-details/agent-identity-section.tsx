import type { UseFormReturn } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LabelWithTooltip from "@/components/custom/label-with-tooltip";

import type { VoiceNewCreateFormValues } from "../types";

export function AgentIdentitySection({
  form,
}: {
  form: UseFormReturn<VoiceNewCreateFormValues>;
}) {
  return (
    <div className="col-span-4 flex flex-col gap-3">
      <FormField
        control={form.control}
        name="name"
        rules={{ required: "Name is required" }}
        render={({ field }) => (
          <FormItem>
            <LabelWithTooltip
              align="start"
              tooltip="Enter a unique name for your voice agent"
            >
              <span className="text-sm">Name</span>
            </LabelWithTooltip>
            <FormControl>
              <Input
                {...field}
                placeholder="Agent name"
                className="h-9 border text-sm"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <LabelWithTooltip
              align="start"
              tooltip="Briefly describe what your agent does"
            >
              <span className="text-sm">Description</span>
            </LabelWithTooltip>
            <FormControl>
              <Input
                {...field}
                placeholder="Agent description"
                className="h-9 border text-sm"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
