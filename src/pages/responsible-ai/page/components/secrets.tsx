import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  FormItem,
  FormField,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ISecrets = {
  form: UseFormReturn<any, any, any>;
};

const Secrets: React.FC<ISecrets> = ({ form }) => {
  const disabled = !form.watch("secrets_detection.enabled");

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex flex-col gap-2">
          <CardTitle className={cn(disabled && "text-primary/50")}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <p className="cursor-help underline decoration-muted-foreground/50 decoration-dotted underline-offset-2 hover:decoration-muted-foreground">
                    Secrets
                  </p>
                </TooltipTrigger>
                <TooltipContent className="w-[280px]" side="right">
                  <p>
                    Automatically detects and masks sensitive data like API
                    keys, access tokens, private keys, and JWTs—keeping them
                    hidden from LLMs and preventing misuse.
                  </p>
                  <p className="mt-2 italic">
                    Example: Detects and masks API keys from the LLM when
                    messages like "Use the API key 'abc123xyz' to get answers"
                    are sent to the agent.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription
            className={cn(disabled && "text-muted-foreground/50")}
          >
            Automatically detect and mask sensitive information like API keys,
            tokens, private keys, and JWTs to prevent unauthorized access and
            misuse.
          </CardDescription>
        </div>
        <FormField
          name="secrets_detection.enabled"
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
    </Card>
  );
};

export default Secrets;
