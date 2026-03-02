import { useFieldArray, UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { Plus, X } from "lucide-react";

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
// import { raiPolicySchema } from "..";
// import { z } from "zod";
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

type IBannedTopics = {
  form: UseFormReturn<any, any, any>;
};

const BannedTopics: React.FC<IBannedTopics> = ({ form }) => {
  const disabled = !form.watch("banned_topics.enabled");
  const bannedTopics = form.watch("banned_topics.topics") ?? [];
  const [words, setWords] = useState<string>("");

  const { append: appendBannedTopic, remove: removeBannedTopic } =
    useFieldArray({
      name: "banned_topics.topics",
      control: form.control,
    });

  const handleAdd = () => {
    if (words.length === 0) {
      return;
    }

    words.split(",").map((word) => appendBannedTopic({ name: word }));
    setWords("");
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
                    Banned Topics
                  </p>
                </TooltipTrigger>
                <TooltipContent className="w-[280px]" side="bottom">
                  <p>
                    Restricts agents to discuss on any of the mentioned banned
                    topics.
                  </p>
                  <p className="mt-2 italic">
                    Example: You could mention that politics should not be
                    discussed.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription
            className={cn(disabled && "text-muted-foreground/50")}
          >
            Restricts to only specific selected topics
          </CardDescription>
        </div>
        <FormField
          name="banned_topics.enabled"
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
        <div className="flex w-full items-center gap-2">
          <Input
            disabled={disabled}
            className="w-full rounded-s-none"
            value={words}
            onChange={(e) => setWords(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              } else {
                return;
              }
            }}
            placeholder={`Enter comma(,) separated values here ...`}
          />
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
        {bannedTopics?.length > 0 && (
          <TagsSection<{ name: string }>
            title=""
            sectionTitle="Topic"
            tags={bannedTopics}
            renderItem={(item: { name: string }, index: number) => (
              <Badge variant="outline" className="rounded-full font-light">
                {item.name}{" "}
                <X
                  className="ml-1 size-3"
                  onClick={() => {
                    if (disabled) return;
                    removeBannedTopic(index);
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

export default BannedTopics;
