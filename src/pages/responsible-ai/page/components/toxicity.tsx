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
import { UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type IToxicity = {
  form: UseFormReturn<any, any, any>;
};

const Toxicity: React.FC<IToxicity> = ({ form }) => {
  const disabled = !form.watch("toxicity_check.enabled");

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex flex-col gap-2">
          <CardTitle className={cn(disabled && "text-primary/50")}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="cursor-help underline decoration-muted-foreground/50 decoration-dotted underline-offset-2 hover:decoration-muted-foreground">
                    Toxicity
                  </p>
                </TooltipTrigger>
                <TooltipContent className="w-[280px]">
                  <p>
                    Monitors and prevents harmful or offensive responses. If the
                    LLM model generates toxic output, the system automatically
                    retries to get a safe, non-toxic version.
                  </p>
                  <p className="mt-2 italic">
                    Example: Identifies toxic responses from LLMs such as "You
                    can deal with annoying neighbors by shouting swear words"
                    and retries to get non-toxic response from LLM model
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription
            className={cn(disabled && "text-muted-foreground/50")}
          >
            Monitors and prevents toxic or harmful content
          </CardDescription>
        </div>
        <FormField
          name="toxicity_check.enabled"
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
      <CardFooter>
        <FormField
          name="toxicity_check.threshold"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex w-full items-center gap-6">
              <FormLabel
                className={cn("flex gap-2", disabled && "text-primary/50")}
              >
                Threshold{" "}
                <p className="text-xs font-normal">
                  {form.watch("toxicity_check.threshold")}
                </p>
              </FormLabel>
              <FormControl>
                <Slider
                  disabled={!form.watch("toxicity_check.enabled")}
                  value={[field.value]}
                  onValueChange={([value]) => field.onChange(value)}
                  max={1}
                  step={0.1}
                  className="w-1/2 transition-all ease-in-out"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardFooter>
    </Card>
  );
};

export default Toxicity;
