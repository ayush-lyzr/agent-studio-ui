import React, { useEffect } from "react";
import axios from "axios";
import { z } from "zod";
import { useForm } from "react-hook-form";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/custom/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectGroup,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import useStore from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";

interface Config {
  ragId: string;
  query: string;
}

interface ConfigureAIProps {
  config: Config;
  setAIConfig: (data: Partial<Config>) => void;
  onRagIdChange: (ragId: string) => void;
  onRetrievedResponse: (response: any) => void;
  onSubmit1: () => void;
}

const formSchema = z.object({
  ragId: z.string().min(1, { message: "RAG Store ID is required" }),
  query: z.string().min(1, { message: "Query is required" }),
});

const TestRag: React.FC<ConfigureAIProps> = ({
  config,
  setAIConfig,
  onRagIdChange,
  onRetrievedResponse,
  onSubmit1,
}) => {
  const { toast } = useToast();
  const apiKey = useStore((state) => state.api_key);

  const form = useForm<Config>({
    resolver: zodResolver(formSchema),
    defaultValues: config,
    mode: "onChange",
  });

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "ragId") {
        const selectedRag = rags.find((rag: any) => rag.name === value.ragId);
        const ragId = selectedRag ? selectedRag.id : "Not found";
        onRagIdChange(ragId);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onRagIdChange]);

  const rags = useStore((state: any) => state.rags);

  async function onSubmit(data: Config) {
    onSubmit1();
    toast({
      title: "Retrieval in progress...",
    });

    setAIConfig(data);

    const selectedRag = rags.find((rag: any) => rag.name === data.ragId);
    const ragId = selectedRag ? selectedRag.id : "Not found";

    const baseURL = `${import.meta.env.VITE_RAG_URL}/`;

    try {
      const response = await axios.get(`${baseURL}rag/retrieve/${ragId}`, {
        params: {
          query: data.query,
        },
        headers: { "x-api-key": apiKey },
      });

      onRetrievedResponse(response.data);

      toast({
        title: "Retrieval successful!",
      });
    } catch (error) {
      console.error("API Error:", error);
      onRetrievedResponse(null);
      toast({
        title: "Retrieval failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleReset = () => {
    form.reset({
      ragId: "",
      query: "",
    });
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="px-4">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="ragId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RAG Store Name</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                        }}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <span>{field.value || "Select..."}</span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {rags.length > 0 ? (
                              rags.map((rag: any, index: number) => (
                                <SelectItem
                                  key={index}
                                  value={rag.name.toString()}
                                >
                                  {rag.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-rags">
                                No RAGs available
                              </SelectItem>
                            )}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Query</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Type your query..."
                        className="h-64 flex-1 resize-none"
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
              <div className="flex justify-end gap-5 pb-2 pt-6">
                <Button variant="secondary" type="button" onClick={handleReset}>
                  Reset
                </Button>
                <Button type="submit">Retrieve</Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default TestRag;
