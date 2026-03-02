import { UseFormReturn } from "react-hook-form";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  FormItem,
  FormField,
  FormMessage,
  FormControl,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type INSFWProps = {
  form: UseFormReturn<any, any, any>;
};

const NSFW: React.FC<INSFWProps> = ({ form }) => {
  const disabled = !form.watch("nsfw_check.enabled");
  const threshold = form.watch("nsfw_check.threshold") ?? 0.8;
  const validationMethod =
    form.watch("nsfw_check.validation_method") ?? "sentence";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex flex-col gap-2">
          <CardTitle className={cn(disabled && "text-primary/50")}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="cursor-help underline decoration-muted-foreground/50 decoration-dotted underline-offset-2 hover:decoration-muted-foreground">
                    NSFW Detection
                  </p>
                </TooltipTrigger>
                <TooltipContent className="w-[280px]">
                  <p>
                    Detects and blocks Not Safe For Work (NSFW) content. Uses
                    AI to identify inappropriate, adult, or explicit content in
                    text.
                  </p>
                  <p className="mt-2 italic">
                    Example: Identifies explicit or adult content in user
                    messages and blocks them before processing.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription
            className={cn(disabled && "text-muted-foreground/50")}
          >
            Detects and blocks NSFW/inappropriate content
          </CardDescription>
        </div>
        <FormField
          name="nsfw_check.enabled"
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
        <FormField
          name="nsfw_check.threshold"
          control={form.control}
          render={({ field }) => (
            <FormItem className="w-full">
              <div className="flex items-center justify-between">
                <FormLabel className={cn(disabled && "text-primary/50")}>
                  Confidence Threshold
                </FormLabel>
                <span
                  className={cn(
                    "text-sm font-medium",
                    disabled && "text-primary/50",
                  )}
                >
                  {threshold.toFixed(2)}
                </span>
              </div>
              <FormControl>
                <Slider
                  disabled={disabled}
                  value={[field.value ?? 0.8]}
                  onValueChange={(value) => field.onChange(value[0])}
                  min={0}
                  max={1}
                  step={0.01}
                  className="w-full"
                />
              </FormControl>
              <p
                className={cn(
                  "text-xs text-muted-foreground",
                  disabled && "text-muted-foreground/50",
                )}
              >
                Content with NSFW score above this threshold will be blocked
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="nsfw_check.validation_method"
          control={form.control}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel className={cn(disabled && "text-primary/50")}>
                Validation Method
              </FormLabel>
              <Select
                disabled={disabled}
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select validation method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="sentence">Sentence-by-Sentence</SelectItem>
                  <SelectItem value="full">Full Text</SelectItem>
                </SelectContent>
              </Select>
              <p
                className={cn(
                  "text-xs text-muted-foreground",
                  disabled && "text-muted-foreground/50",
                )}
              >
                {validationMethod === "sentence"
                  ? "Check each sentence individually for NSFW content"
                  : "Check the entire text as a whole for NSFW content"}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardFooter>
    </Card>
  );
};

export default NSFW;
