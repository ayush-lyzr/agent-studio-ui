import { useState } from "react";
import axios from "axios";
import { z } from "zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/custom/button";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordian";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import useStore from "@/lib/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LabelWithTooltip from "@/components/custom/label-with-tooltip";

const formSchema = z.object({
  query: z.string().min(1, { message: "Query is required" }),
  top_k: z.number().min(1).max(100).default(10),
  retrieval_type: z.enum(["basic", "mmr", "rrf", "hyde"]).default("basic"),
  score_threshold: z.number().min(0).max(1).default(0),
});

interface Config {
  query: string;
  top_k: number;
  retrieval_type: "basic" | "mmr" | "rrf" | "hyde";
  score_threshold: number;
}

interface RagRetrievalProps {
  ragData?: string[];
  isGraphRag: boolean;
  ragId?: string;
}

const RagRetrieval = ({
  ragData = [],
  isGraphRag,
  ragId,
}: RagRetrievalProps) => {
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  // const location = useLocation();

  const apiKey = useStore((state) => state.api_key);

  // const ragId = location.pathname.split("/").pop();

  const form = useForm<Config>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: "",
      top_k: 10,
      retrieval_type: "basic",
      score_threshold: 0,
    },
    mode: "onChange",
  });

  async function onSubmit(data: Config) {
    setIsLoading(true);

    const baseURL = `${import.meta.env.VITE_RAG_URL}`;

    try {
      const response = await axios.get(`${baseURL}/v3/rag/${ragId}/retrieve/`, {
        params: {
          query: data.query,
          top_k: data.top_k,
          retrieval_type: data.retrieval_type,
          score_threshold: data.score_threshold,
        },
        headers: { "x-api-key": apiKey },
      });

      setResponse(response.data);

      toast({
        title: "Retrieval successful!",
      });
    } catch (error) {
      console.error("API Error:", error);
      setResponse(null);
      toast({
        title: "Retrieval failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleReset = () => {
    form.reset({
      query: "",
      top_k: 10,
      retrieval_type: "basic",
      score_threshold: 0,
    });
    setResponse(null);
  };

  const renderResults = () => {
    if (!response || !response.results) return null;

    return response.results.map((result: any, index: number) => {
      let metadata = result?.metadata;
      if (isGraphRag) {
        metadata = JSON.parse(metadata ?? "{}");
      }
      let source = metadata?.source;
      if (source?.startsWith("storage/")) {
        source = source.slice("storage/".length);
      }
      if (source && source.length > 80) {
        source = source.substring(0, 80) + "...";
      }

      return (
        <AccordionItem value={`item-${index}`} key={index}>
          <AccordionTrigger>
            <div className="flex w-full justify-between space-x-20">
              <span className="text-left">{source}</span>
              <span
                className={`ml-2 mr-6 text-xl ${
                  result?.score * 100 >= 80
                    ? "text-green-500"
                    : result?.score * 100 >= 50
                      ? "dark:text-white"
                      : "text-red-500"
                }`}
              >
                {(result?.score * 100).toFixed(2)}%
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <p>
              {result?.text?.length > 500
                ? result.text.substring(0, 500) + "..."
                : result?.text}
            </p>
          </AccordionContent>
        </AccordionItem>
      );
    });
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-4 px-4">
      {ragData?.length === 0 ? (
        <div className="flex h-[calc(100vh-250px)] flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-primary/10 p-6">
            <Search className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            No Files to Search
          </h1>
          <p className="text-center text-muted-foreground">
            Upload files to your knowledge base to start searching through them
          </p>
        </div>
      ) : (
        <div className="mb-4">
          <div className="px-0 pb-2">
            <CardTitle className="text-lg">Knowledge Base Retrieval</CardTitle>
            <CardDescription>
              Search through your knowledge base by entering a query below. The
              system will retrieve the most relevant chunks of information.
            </CardDescription>
          </div>
          <CardContent className="mt-5 p-0">
            <div className="space-y-4">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="query"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Type your query and press Enter to search..."
                            className="h-32 resize-none focus-visible:ring-2"
                            {...field}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                form.handleSubmit(onSubmit)();
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="top_k"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <LabelWithTooltip
                            tooltip="Number of most relevant chunks to retrieve from the knowledge base. Higher values provide more context but may increase noise and response time."
                            required={true}
                          >
                            Number of Chunks
                          </LabelWithTooltip>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={100}
                              step={1}
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="retrieval_type"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <LabelWithTooltip
                            tooltip="Basic: Simple similarity-based retrieval
                    MMR (Maximal Marginal Relevance): Balances relevance with diversity in results
                    HyDE (Hypothetical Document Embeddings): Generates a hypothetical answer first to improve retrieval accuracy"
                            required={true}
                          >
                            Retrieval Type
                          </LabelWithTooltip>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select retrieval type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="basic">Basic</SelectItem>
                                <SelectItem value="mmr">MMR</SelectItem>
                                <SelectItem value="hyde">HyDE</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="score_threshold"
                    render={({ field }) => (
                      <FormItem className="col-span-1">
                        <LabelWithTooltip
                          tooltip="Minimum similarity score (0-1) required for a chunk to be included in the results. Higher values ensure more relevant but fewer results."
                          required={true}
                        >
                          Score Threshold: {field.value.toFixed(1)}
                        </LabelWithTooltip>
                        <FormControl>
                          <Slider
                            min={0}
                            max={1}
                            step={0.1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            className="py-4"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mt-4 flex justify-end gap-3">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleReset}
                    >
                      Reset
                    </Button>
                    <Button type="submit" loading={isLoading}>
                      {isLoading ? "Retrieving ..." : "Retrieve"}
                    </Button>
                  </div>
                </form>
              </Form>

              <div className="mt-6 rounded-xl border border-input">
                <div className="flex flex-col space-y-1.5 p-6 pb-2">
                  <h3 className="text-lg">Retrieved Chunks</h3>
                  <p className="text-sm text-muted-foreground">
                    {!response &&
                      !isLoading &&
                      "Please query the Knowledge Base to view retrieved chunks."}
                  </p>
                </div>
                <div className="p-6 pt-0">
                  <div className="h-[25dvh] overflow-y-auto rounded-md">
                    {isLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : response ? (
                      <Accordion type="single" collapsible className="w-full">
                        {renderResults()}
                      </Accordion>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      )}
    </div>
  );
};

export default RagRetrieval;
