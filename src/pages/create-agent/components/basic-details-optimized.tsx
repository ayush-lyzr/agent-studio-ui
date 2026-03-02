import React, { useEffect, useState } from "react";
import { Settings, Plus, MinusCircle } from "lucide-react";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import useStore from "@/lib/store";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { styles } from "../styles";
import { BasicDetailsOptimizedProps } from "../types";
import AgentPromptSection from "./agent-prompt-section";
import LabelWithTooltip from "@/components/custom/label-with-tooltip";
import ToolsSection from "./tools-section";
import { Button, buttonVariants } from "@/components/ui/button";
import { StructuredOutputField } from "./structured-output-field";
import { ProviderModel } from "./provider-model";

const StyleTag = () => <style>{styles}</style>;

export const BasicDetails: React.FC<BasicDetailsOptimizedProps> = ({
  scrollRef,
  form,
  agent,
}) => {
  const apiKey = useStore((state) => state.api_key);
  const [isToolDescriptionExpanded, setIsToolDescriptionExpanded] =
    useState(false);

  const examples_visible = form.watch("examples_visible");

  useEffect(() => {
    const exampleErrors =
      Object.entries(form.formState.errors).findIndex(
        ([k, v]) => k === "examples" && Boolean(v),
      ) >= 0;
    const isExamplesEnable =
      !!form.getValues("examples") && !!form.getValues("examples_visible");

    if (!exampleErrors && isExamplesEnable && scrollRef?.current) {
      form.setValue("examples_visible", true, { shouldDirty: false });
      scrollRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  }, [form.formState.errors, scrollRef]);

  return (
    <>
      <StyleTag />
      <div className="no-scrollbar grid h-full grid-cols-4 gap-4 overflow-x-hidden overflow-y-scroll">
        <div className="col-span-4 flex flex-col gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <LabelWithTooltip
                  align="start"
                  tooltip="Enter a unique name for your agent"
                >
                  Name
                </LabelWithTooltip>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Agent name"
                    className="border"
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
                  Description
                </LabelWithTooltip>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Agent description"
                    className="border"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-4 flex items-end gap-4">
          <ProviderModel form={form} />

          <Popover>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild className="h-2/3">
                <PopoverTrigger asChild>
                  <Button
                    variant="link"
                    size="icon"
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Settings className="size-5 transition-transform duration-200 hover:scale-110" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Advanced settings</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <LabelWithTooltip
                          tooltip="Controls randomness in the agent's
                                          responses. Higher values make the
                                          output more creative but less focused."
                        >
                          Temperature
                        </LabelWithTooltip>
                        <p>{field.value}</p>
                      </div>
                      <FormControl>
                        <Slider
                          value={[field.value]}
                          onValueChange={([value]) => field.onChange(value)}
                          min={0}
                          max={1}
                          step={0.1}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="top_p"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <LabelWithTooltip
                          tooltip="Controls diversity of responses. Lower
                                              values make the output more focused
                                              and deterministic."
                        >
                          Top P
                        </LabelWithTooltip>
                        <p>{field.value}</p>
                      </div>

                      <FormControl>
                        <Slider
                          value={[field.value]}
                          onValueChange={([value]) => field.onChange(value)}
                          min={0}
                          max={1}
                          step={0.1}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="col-span-4">
          <AgentPromptSection form={form} apiKey={apiKey} />
        </div>

        <ToolsSection form={form} agent={agent} />

        <FormField
          control={form.control}
          name="examples"
          render={({ field }) => (
            <FormItem className="col-span-4">
              <FormLabel>
                <div className="flex items-center justify-between">
                  <LabelWithTooltip
                    align="start"
                    tooltip="Add example outputs to guide your agent"
                  >
                    Examples (Text)
                  </LabelWithTooltip>
                  <span
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                    onClick={() => {
                      const checked = examples_visible;
                      form.setValue("examples_visible", !checked);
                      if (!checked) {
                        setTimeout(
                          () =>
                            scrollRef.current?.scrollIntoView({
                              behavior: "smooth",
                              block: "end",
                              inline: "nearest",
                            }),
                          400,
                        );
                      } else {
                        form.setValue("examples", null, { shouldDirty: true });
                      }
                    }}
                  >
                    {examples_visible ? (
                      <MinusCircle className="mr-1 size-4" />
                    ) : (
                      <Plus className="mr-1 size-4" />
                    )}
                    {examples_visible ? "Remove" : "Add"}
                  </span>
                </div>
              </FormLabel>
              <FormControl>
                {examples_visible && (
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
        <StructuredOutputField form={form} />
        <div ref={scrollRef} />
      </div>

      <Dialog
        open={isToolDescriptionExpanded}
        onOpenChange={setIsToolDescriptionExpanded}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tool Usage Description</DialogTitle>
          </DialogHeader>
          <FormField
            control={form.control}
            name="tool_usage_description"
            render={({ field }) => (
              <Textarea
                {...field}
                rows={15}
                className="min-h-[300px] w-full"
                placeholder="Describe in detail how you would use this tool..."
              />
            )}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BasicDetails;
