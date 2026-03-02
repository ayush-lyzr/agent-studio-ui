import React, { useState } from "react";
import { useFieldArray, UseFormReturn } from "react-hook-form";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/custom/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Plus, X } from "lucide-react";
import { TagsSection } from "@/components/custom/tags-section";
import { Badge } from "@/components/ui/badge";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type IPII = {
  form: UseFormReturn<any, any, any>;
};

const PII: React.FC<IPII> = ({ form }) => {
  const disabled = !form.watch("pii_detection.enabled");
  const blockedPii = (form.getValues("pii_detection.custom_pii") ?? []).filter(
    (item: any) => item.action === "block",
  );
  const redactedPii = (form.getValues("pii_detection.custom_pii") ?? []).filter(
    (item: any) => item.action === "redact",
  );
  const [piiType, setPiiType] = useState<"block" | "redact">("block");
  const [words, setWords] = useState<string>("");
  const [replacement, setReplacement] = useState<string>("");

  const { append: appendPii, remove: removePii } = useFieldArray({
    name: "pii_detection.custom_pii",
    control: form.control,
  });

  const handleAdd = () => {
    if (words.length === 0) {
      return;
    }
    switch (piiType) {
      case "block":
        words
          .split(",")
          .map((label) =>
            appendPii({ action: "block", label, replacement: "" }),
          );
        break;
      case "redact":
        appendPii({
          action: "redact",
          label: words,
          replacement: replacement,
        });
        break;
      default:
        break;
    }

    setWords("");
    setReplacement("");
  };

  const handleEnter = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    callback: () => void,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      callback();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex flex-col gap-2">
          <CardTitle className={cn(disabled && "text-primary/50")}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="cursor-help underline decoration-muted-foreground/50 decoration-dotted underline-offset-2 hover:decoration-muted-foreground">
                    Personally Identifiable Information (PII)
                  </p>
                </TooltipTrigger>
                <TooltipContent className="w-[280px]" side="bottom">
                  <p>
                    Redacts or blocks sensitive user data such as names, emails,
                    or phone numbers before it's sent to the LLM model.
                  </p>
                  <p className="mt-2 italic">
                    Example: "John Doe" becomes "Person."
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription
            className={cn(disabled && "text-muted-foreground/50")}
          >
            Block or redact personally identifiable information
          </CardDescription>
        </div>
        <FormField
          name="pii_detection.enabled"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(value) => field.onChange(value)}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </CardHeader>
      <CardFooter className="flex flex-col items-start gap-4">
        <div className="flex w-full items-center gap-2">
          <span className="flex w-full items-center">
            <Select
              disabled={disabled}
              value={piiType}
              onValueChange={(value) => setPiiType(value as "block" | "redact")}
            >
              <SelectTrigger className="w-fit rounded-e-none">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="block">Block</SelectItem>
                <SelectItem value="redact">Redact</SelectItem>
              </SelectContent>
            </Select>
            {piiType === "redact" ? (
              <span className="flex h-9 w-full items-center rounded-md rounded-s-none border">
                <Input
                  disabled={disabled}
                  className="w-1/2 border-none bg-transparent shadow-none"
                  value={words}
                  onChange={(e) => setWords(e.target.value)}
                  onKeyDown={(e) => handleEnter(e, handleAdd)}
                  placeholder={`Enter keyword ...`}
                />
                <ArrowRight className="size-4 text-muted-foreground" />
                <Input
                  disabled={disabled}
                  className="w-1/2 border-none bg-transparent shadow-none"
                  value={replacement}
                  onChange={(e) => setReplacement(e.target.value)}
                  placeholder={`Enter replacement word ...`}
                />
              </span>
            ) : (
              <Input
                disabled={disabled}
                className="h-9 w-full rounded-s-none"
                value={words}
                onChange={(e) => setWords(e.target.value)}
                onKeyDown={(e) => handleEnter(e, handleAdd)}
                placeholder={`Enter comma(,) separated keywords ...`}
              />
            )}
          </span>
          <Button
            variant="outline"
            disabled={disabled}
            onClick={(e) => {
              e.preventDefault();
              handleAdd();
            }}
          >
            <Plus className="mr-1 size-4" /> Add
          </Button>
          {/* <Button variant="outline" size="icon">
            <Upload className="size-4" />
          </Button> */}
        </div>
        <div className="grid w-full grid-cols-2 place-content-center gap-x-10 gap-y-4">
          {[
            { label: "Credit card numbers", value: "CREDIT_CARD" },
            { label: "Email Addresses", value: "EMAIL_ADDRESS" },
            { label: "Phone Numbers", value: "PHONE_NUMBER" },
            { label: "Names (person)", value: "PERSON" },
            { label: "Locations", value: "LOCATION" },
            { label: "IP Addresses", value: "IP_ADDRESS" },
            { label: "SU Social Security Numbers (SSN)", value: "US_SSN" },
            { label: "URLs", value: "URL" },
            { label: "Dates/Times", value: "DATE_TIME" },
          ].map((item) => {
            const value =
              form.getValues(`pii_detection.types.${item.value}` as any) ??
              "disabled";

            return (
              <div className="flex items-center justify-between text-sm">
                <p className="text-xs">{item.label}</p>
                <div>
                  <div className="flex items-center justify-between rounded-md border bg-accent text-xs">
                    <span
                      className={cn(
                        "cursor-pointer rounded-md rounded-e-none px-2 py-1",
                        value === "disabled" && "border bg-background",
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.setValue(
                          `pii_detection.types.${item.value}` as any,
                          "disabled",
                          { shouldDirty: true },
                        );
                      }}
                    >
                      Disabled
                    </span>
                    <span
                      className={cn(
                        "cursor-pointer rounded-md rounded-e-none px-2 py-1",
                        value === "block" && "border bg-background",
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.setValue(
                          `pii_detection.types.${item.value}` as any,
                          "block",
                          { shouldDirty: true },
                        );
                      }}
                    >
                      Blocked
                    </span>
                    <span
                      className={cn(
                        "cursor-pointer rounded-md rounded-e-none px-2 py-1",
                        value === "redact" && "border bg-background",
                      )}
                      onClick={() => {
                        form.setValue(
                          `pii_detection.types.${item.value}` as any,
                          "redact",
                          { shouldDirty: true },
                        );
                      }}
                    >
                      Redacted
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {blockedPii.length > 0 && (
          <TagsSection<{ label: string }>
            title="Blocked"
            sectionTitle="PII"
            tags={blockedPii}
            renderItem={(item, index) => (
              <Badge variant="outline" className="rounded-full font-light">
                {item.label}{" "}
                <X
                  className="ml-1 size-3"
                  onClick={() => {
                    if (disabled) return;
                    removePii(index);
                  }}
                />
              </Badge>
            )}
          />
        )}
        {redactedPii.length > 0 && (
          <TagsSection<{
            label: string;
            action: "block" | "redact";
            replacement: string;
          }>
            title="Redacted"
            sectionTitle="PII"
            tags={redactedPii}
            renderItem={(item, index) => (
              <Badge
                variant="outline"
                className="flex gap-2 rounded-full font-light"
              >
                {item.label}
                <ArrowRight className="size-3 text-muted-foreground" />
                {item.replacement}
                <X
                  className="ml-1 size-3"
                  onClick={() => {
                    if (disabled) return;
                    removePii(index);
                  }}
                />
              </Badge>
            )}
          />
        )}
      </CardFooter>
    </Card>
  );
};

export default PII;
