import React, { useEffect, useCallback } from "react";
import axios from "axios";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/custom/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectGroup,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import useStore from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";

interface Config {
  ragId: string;
  files: File[];
  websiteUrl: string;
  crawlPages: string;
  crawlDepth: string;
  dynamicWait: string;
  youtubeUrl: string;
  rawText: string;
}

interface ConfigureAIProps {
  config: Config;
  setAIConfig: (data: Partial<Config>) => void;
  onRagIdChange: (ragId: string) => void;
}

const formSchema = z.object({
  ragId: z.string().min(1, { message: "RAG Store ID is required" }),
  files: z
    .array(z.instanceof(File))
    .max(5, { message: "Maximum 5 files allowed" }),
  websiteUrl: z.union([z.string().url(), z.string().max(0)]).optional(),
  crawlPages: z.string().transform(Number).optional(),
  crawlDepth: z.string().transform(Number).optional(),
  dynamicWait: z.string().transform(Number).optional(),
  youtubeUrl: z.union([z.string().url(), z.string().max(0)]).optional(),
  rawText: z.string().optional(),
});

const ConfigureRag: React.FC<ConfigureAIProps> = ({
  config,
  setAIConfig,
  onRagIdChange,
}) => {
  const { toast } = useToast();

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

  const rags = useStore((state) => state.rags);
  const apiKey = useStore((state) => state.api_key);
  // const ragsArray = Array.isArray(rags?.rags) ? rags.rags : [];

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      form.setValue("files", acceptedFiles.slice(0, 5));
    },
    [form],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 5,
  });

  async function onSubmit(data: Config) {
    toast({
      title: "Upload Started",
      description:
        "Please wait and refresh the list of documents after a few seconds.",
    });

    setAIConfig(data);

    const selectedRag = rags.find((rag: any) => rag.name === data.ragId);
    const ragId = selectedRag ? selectedRag.id : "Not found";

    const baseURL = `${import.meta.env.VITE_RAG_URL}/`;

    try {
      const parseResponses = [];

      for (let i = 0; i < Math.min(data.files.length, 5); i++) {
        const file = data.files[i];
        const formData = new FormData();
        formData.append("file", file);

        let endpoint = "";
        if (file.name.endsWith(".pdf")) {
          endpoint = "parse/pdf/";
        } else if (file.name.endsWith(".docx")) {
          endpoint = "parse/docx/";
        } else if (file.name.endsWith(".txt")) {
          endpoint = "parse/txt/";
        } else {
          console.warn(`Unsupported file type: ${file.name}`);
          continue;
        }

        const response = await axios.post(`${baseURL}${endpoint}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        parseResponses.push(response.data);
      }

      if (data.websiteUrl) {
        const payload = {
          urls: [data.websiteUrl],
          source: data.websiteUrl.replace(/^(https?:\/\/)/i, ""),
          max_crawl_pages: Number(data.crawlPages),
          max_crawl_depth: Number(data.crawlDepth),
          dynamic_content_wait_secs: Number(data.dynamicWait),
          actor: "apify/website-content-crawler",
          crawler_type: "cheerio",
        };

        const response = await axios.post(`${baseURL}parse/website/`, payload);
        parseResponses.push(response.data);
      }
      if (data.youtubeUrl) {
        const formData = new FormData();
        formData.append("urls", data.youtubeUrl);

        const response = await axios.post(`${baseURL}parse/youtube/`, formData);
        parseResponses.push(response.data);
      }

      if (data.rawText) {
        const response = await axios.post(`${baseURL}parse/text/`, [
          {
            text: data.rawText,
            source:
              data.rawText.length > 50
                ? data.rawText.slice(0, 50) + "..."
                : data.rawText,
          },
        ]);
        parseResponses.push(response.data);
      }

      const allDocuments = parseResponses.flatMap(
        (response) => response.documents || [],
      );

      if (allDocuments.length > 0) {
        const ragResponse = await axios.post(
          `${baseURL}rag/train/${ragId}`,
          allDocuments,
          { headers: { "x-api-key": apiKey } },
        );

        console.log("Final RAG response:", ragResponse.data);

        toast({
          title: "Upload Successful!",
          description:
            "Your data has been successfully uploaded and processed.",
          variant: "default",
        });
      } else {
        console.error("No documents found in any of the parse responses");
        toast({
          title: "Upload Failed",
          description:
            "No documents were found to process. Please check your input and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.response?.data || error.message);
      } else {
        console.error("Error:", error);
      }
      toast({
        title: "Upload Failed",
        description:
          "An error occurred while processing your request. Please make sure your inputs are valid and try again.",
        variant: "destructive",
      });
    }
  }

  const handleReset = () => {
    form.reset({
      ragId: "",
      files: [],
      youtubeUrl: "",
      rawText: "",
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
                name="files"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File Upload (.pdf, .docx, .txt)</FormLabel>
                    <FormControl>
                      <div {...getRootProps()} className="dropzone">
                        <input {...getInputProps()} />
                        <div className="cursor-pointer rounded-md border-2 border-dashed border-gray-300 p-6 text-center">
                          {isDragActive ? (
                            <p>Drop the files here ...</p>
                          ) : (
                            <p>
                              Drag 'n' drop up to 5 files here, or click to
                              select files
                            </p>
                          )}
                        </div>
                      </div>
                    </FormControl>
                    {field.value && field.value.length > 0 && (
                      <ul className="list-disc pl-5">
                        {field.value.map((file, index) => (
                          <li key={index}>{file.name}</li>
                        ))}
                      </ul>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator className="my-4 " />

              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        {...field}
                        placeholder="Enter a valid website URL"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between space-x-4">
                <FormField
                  control={form.control}
                  name="crawlPages"
                  render={({ field }) => (
                    <FormItem className="w-1/3">
                      <FormLabel>Max Crawl Pages</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          placeholder="Enter number of pages to crawl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="crawlDepth"
                  render={({ field }) => (
                    <FormItem className="w-1/3">
                      <FormLabel>Max Crawl Depth</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          placeholder="Enter crawl depth"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dynamicWait"
                  render={({ field }) => (
                    <FormItem className="w-1/3">
                      <FormLabel>Dynamic Wait (in s)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          placeholder="Enter dynamic wait time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-4" />

              <FormField
                control={form.control}
                name="youtubeUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube URL</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        {...field}
                        placeholder="Enter a valid YouTube video URL"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="my-4" />

              <FormField
                control={form.control}
                name="rawText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Raw Text</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter text here" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-5 pb-2 pt-6">
                <Button variant="secondary" type="button" onClick={handleReset}>
                  Reset
                </Button>
                <Button type="submit">Upload</Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ConfigureRag;
