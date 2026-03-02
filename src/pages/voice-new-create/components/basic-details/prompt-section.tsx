import type { UseFormReturn } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LabelWithTooltip from "@/components/custom/label-with-tooltip";

import type { VoiceNewCreateFormValues } from "../types";
import { ManagerAgentsSection } from "./manager-agents-section";

export function PromptSection({
  form,
}: {
  form: UseFormReturn<VoiceNewCreateFormValues>;
}) {
  const whoSpeaksFirst = form.watch("who_speaks_first");

  return (
    <div className="col-span-4 space-y-3 rounded-lg border p-4">
      {/* Who Speaks First */}
      <div className="flex flex-col gap-3">
        <FormField
          control={form.control}
          name="who_speaks_first"
          render={({ field }) => (
            <FormItem>
              <LabelWithTooltip
                align="start"
                tooltip="Choose who initiates the conversation"
              >
                <span className="text-sm">Who Speaks First</span>
              </LabelWithTooltip>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                defaultValue="human"
              >
                <FormControl>
                  <SelectTrigger className="h-9 text-sm focus:ring-0 focus:ring-offset-0 focus-visible:ring-0">
                    <SelectValue placeholder="Select who speaks first" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="human">Human Speaks First</SelectItem>
                  <SelectItem value="ai">AI Speaks First</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {whoSpeaksFirst === "ai" && (
          <FormField
            control={form.control}
            name="ai_intro_text"
            rules={{
              validate: (value) =>
                whoSpeaksFirst !== "ai" ||
                Boolean(value?.trim()) ||
                "AI introduction text is required",
            }}
            render={({ field }) => (
              <FormItem>
                <LabelWithTooltip
                  align="start"
                  tooltip="Enter the greeting message AI will use to start the conversation"
                >
                  <span className="text-sm">AI Introduction Text</span>
                </LabelWithTooltip>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Hello! How can I help you today?"
                    className="resize-none border text-sm focus:ring-0 focus:ring-offset-0 focus-visible:ring-0"
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <FormField
          control={form.control}
          name="agent_goal"
          render={({ field }) => (
            <FormItem>
              <LabelWithTooltip
                align="start"
                tooltip="Defines what the agent is expected to achieve."
              >
                <span className="text-sm">Agent Goal</span>
              </LabelWithTooltip>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Your goal is to address and resolve customer inquiries."
                  className="h-9 border text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="agent_role"
          render={({ field }) => (
            <FormItem>
              <LabelWithTooltip
                align="start"
                tooltip="Define the role your agent will play in conversations"
              >
                <span className="text-sm">Agent Role</span>
              </LabelWithTooltip>
              <FormControl>
                <Input
                  {...field}
                  placeholder="You are an expert customer support agent."
                  className="h-9 border text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="agent_instructions"
        render={({ field }) => (
          <FormItem>
            <LabelWithTooltip
              align="start"
              tooltip="Provide specific instructions for how the agent should behave"
            >
              <span className="text-sm">Agent Instructions</span>
            </LabelWithTooltip>
            <FormControl>
              <Textarea
                {...field}
                placeholder="LISTEN to the customer and GATHER relevant information. PROVIDE clear and concise answers."
                className="resize-none border text-sm"
                rows={12}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Manager agents (sub-agent delegation) */}
      <ManagerAgentsSection form={form} />
    </div>
  );
}
