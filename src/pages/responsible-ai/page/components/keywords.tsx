import { ArrowRight, Plus, X, Info } from "lucide-react";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import { useState } from "react";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/custom/button";
import { Badge } from "@/components/ui/badge";
import { TagsSection } from "@/components/custom/tags-section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PatternType } from "@/lib/types";
import PatternTestModal from "./pattern-test-modal";
import { Label } from "@/components/ui/label";

type IKeywords = {
  form: UseFormReturn<any, any, any>;
};

const Keywords: React.FC<IKeywords> = ({ form }) => {
  const disabled = !form.watch("keywords.enabled");
  const blockedKeywords = (form.getValues("keywords.keywords") ?? []).filter(
    (item: any) => item.action === "block",
  );
  const redactedKeywords = (form.getValues("keywords.keywords") ?? []).filter(
    (item: any) => item.action === "redact",
  );
  const [keywordType, setKeywordType] = useState<"block" | "redact">("block");
  const [words, setWords] = useState<string>("");
  const [replacement, setReplacement] = useState<string>("");
  const [patternType, setPatternType] = useState<PatternType>("literal");

  const { append: appendKeyword, remove: removeKeyword } = useFieldArray({
    name: "keywords.keywords",
    control: form.control,
  });

  const handleAdd = () => {
    if (words.length === 0) {
      return;
    }
    switch (keywordType) {
      case "block":
        words
          .split(",")
          .map((keyword) =>
            appendKeyword({
              action: "block",
              keyword: keyword.trim(),
              replacement: "",
              pattern_type: patternType,
            }),
          );
        break;
      case "redact":
        appendKeyword({
          action: "redact",
          keyword: words,
          replacement: replacement,
          pattern_type: patternType,
        });
        break;
      default:
        break;
    }

    setWords("");
    setReplacement("");
  };

  const getPatternTypeLabel = (type?: PatternType) => {
    switch (type) {
      case "regex":
        return "Regex";
      case "cucumber_expression":
        return "Cucumber";
      case "literal":
      default:
        return "Literal";
    }
  };

  const getPatternTypeColor = (type?: PatternType) => {
    switch (type) {
      case "regex":
        return "text-blue-600 dark:text-blue-400";
      case "cucumber_expression":
        return "text-purple-600 dark:text-purple-400";
      case "literal":
      default:
        return "text-green-600 dark:text-green-400";
    }
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
                    Keywords
                  </p>
                </TooltipTrigger>
                <TooltipContent className="w-[300px]" side="bottom">
                  <p>
                    Allows you to either block specific keywords or redact them
                    by replacing with safer alternatives.
                  </p>
                  <p className="mt-2 font-semibold">Pattern Types:</p>
                  <ul className="ml-4 mt-1 list-disc space-y-1 text-xs">
                    <li><strong>Literal:</strong> Simple text matching (e.g., "password")</li>
                    <li><strong>Regex:</strong> Advanced patterns (e.g., "\d{3}-\d{2}-\d{4}")</li>
                    <li><strong>Cucumber:</strong> Human-readable patterns (e.g., "password: {'{string}'}")</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription
            className={cn(disabled && "text-muted-foreground/50")}
          >
            Restrict or Redact specific keywords
          </CardDescription>
        </div>
        <FormField
          name="keywords.enabled"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(value) => field.onChange(value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardHeader>
      <CardFooter className="flex flex-col items-start gap-4">
        <div className="flex w-full items-end gap-2">
          <div className="flex flex-col gap-2 w-1/4">
            <Label className="text-xs">Pattern Type</Label>
            <Select
              disabled={disabled}
              value={patternType}
              onValueChange={(value) => setPatternType(value as PatternType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="literal">
                  <div className="flex flex-col items-start">
                    <span>Literal</span>
                    <span className="text-xs text-muted-foreground">Substring match</span>
                  </div>
                </SelectItem>
                <SelectItem value="regex">
                  <div className="flex flex-col items-start">
                    <span>Regex</span>
                    <span className="text-xs text-muted-foreground">Regular expression</span>
                  </div>
                </SelectItem>
                <SelectItem value="cucumber_expression">
                  <div className="flex flex-col items-start">
                    <span>Cucumber</span>
                    <span className="text-xs text-muted-foreground">Parameter extraction</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <span className="flex w-full items-center">
            <Select
              disabled={disabled}
              value={patternType}
              onValueChange={(value) =>
                setPatternType(value as "literal" | "regex" | "cucumber_expression")
              }
            >
              <SelectTrigger className="w-fit rounded-e-none">
                <SelectValue placeholder="Pattern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="literal">Literal</SelectItem>
                <SelectItem value="regex">Regex</SelectItem>
                <SelectItem value="cucumber_expression">Cucumber</SelectItem>
              </SelectContent>
            </Select>
            <Select
              disabled={disabled}
              value={keywordType}
              onValueChange={(value) =>
                setKeywordType(value as "block" | "redact")
              }
            >
              <SelectTrigger className="w-fit rounded-e-none rounded-s-none border-l-0">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="block">Blocked</SelectItem>
                <SelectItem value="redact">Redacted</SelectItem>
              </SelectContent>
            </Select>
            {keywordType === "redact" ? (
              <span className="flex h-9 w-full items-center rounded-md rounded-s-none border">
                <Input
                  disabled={disabled}
                  className="w-1/2 border-none bg-transparent shadow-none"
                  value={words}
                  onChange={(e) => setWords(e.target.value)}
                  placeholder={
                    patternType === "literal"
                      ? "password"
                      : patternType === "regex"
                        ? "\\b\\d{3}-\\d{2}-\\d{4}\\b"
                        : "password: {word}"
                  }
                  onKeyDown={(e) => handleEnter(e, handleAdd)}
                />
                <ArrowRight className="size-4 text-muted-foreground" />
                <Input
                  disabled={disabled}
                  className="w-1/2 border-none bg-transparent shadow-none"
                  value={replacement}
                  onChange={(e) => setReplacement(e.target.value)}
                  onKeyDown={(e) => handleEnter(e, handleAdd)}
                  placeholder={`[REDACTED]`}
                />
              </span>
            ) : (
              <Input
                disabled={disabled}
                className="h-9 w-full rounded-s-none"
                value={words}
                onChange={(e) => setWords(e.target.value)}
                onKeyDown={(e) => handleEnter(e, handleAdd)}
                placeholder={
                  patternType === "literal"
                    ? "password, secret, api-key"
                    : patternType === "regex"
                      ? "\\b\\d{3}-\\d{2}-\\d{4}\\b"
                      : "password: {word}"
                }
              />
            )}
          </span>
          <Button
            variant="outline"
            disabled={disabled}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAdd();
            }}
          >
            <Plus className="mr-1 size-4" /> Add
          </Button>
          <PatternTestModal disabled={disabled} />
        </div>
        {patternType !== "literal" && (
          <div className="flex items-start gap-2 rounded-md bg-blue-50 dark:bg-blue-950 p-3 text-sm">
            <Info className="size-4 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="text-blue-900 dark:text-blue-100">
              {patternType === "regex" ? (
                <p>
                  Using <strong>Regex</strong> patterns. Supports full regular expression syntax.
                  Example: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">\\b\\d{`{3}`}-\\d{`{2}`}-\\d{`{4}`}\\b</code> matches SSN format.
                </p>
              ) : (
                <p>
                  Using <strong>Cucumber Expression</strong> patterns with parameter extraction.
                  Supports: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{`{int}`}</code>,{" "}
                  <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{`{float}`}</code>,{" "}
                  <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{`{word}`}</code>,{" "}
                  <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{`{string}`}</code>.
                  Example: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">password: {`{word}`}</code>
                </p>
              )}
            </div>
          </div>
        )}
        {blockedKeywords.length > 0 && (
          <TagsSection<{ keyword: string; pattern_type?: PatternType }>
            title="Blocked"
            sectionTitle="keywords"
            tags={blockedKeywords}
            renderItem={(item, index: number) => (
              <Badge variant="outline" className="rounded-full font-light flex items-center gap-1">
                <span className={cn("text-[10px] font-semibold", getPatternTypeColor(item.pattern_type))}>
                  [{getPatternTypeLabel(item.pattern_type)}]
                </span>
                {item.keyword}{" "}
                <X
                  className="ml-1 size-3 cursor-pointer hover:text-destructive"
                  onClick={() => {
                    if (disabled) return;
                    removeKeyword(index);
                  }}
                />
              </Badge>
            )}
          />
        )}
        {redactedKeywords.length > 0 && (
          <TagsSection<{
            keyword: string;
            action: "block" | "redact";
            replacement: string;
            pattern_type?: PatternType;
          }>
            title="Redacted"
            sectionTitle="keywords"
            tags={redactedKeywords}
            renderItem={(item, index: number) => (
              <Badge
                variant="outline"
                className="flex gap-2 rounded-full font-light"
              >
                <span className={cn("text-[10px] font-semibold", getPatternTypeColor(item.pattern_type))}>
                  [{getPatternTypeLabel(item.pattern_type)}]
                </span>
                {item.keyword}
                <ArrowRight className="size-3 text-muted-foreground" />
                {item.replacement}
                <X
                  className="ml-1 size-3 cursor-pointer hover:text-destructive"
                  onClick={() => {
                    if (disabled) return;
                    removeKeyword(index);
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

export default Keywords;
