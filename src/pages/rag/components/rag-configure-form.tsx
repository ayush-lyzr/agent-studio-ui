import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface Config {
  _id: string;
  ragName: string;
  vectorStore: string;
  vectorStoreUrl: string;
  vectorStoreApiKey: string;
  vectorStoreHost: string;
  vectorStorePort: string;
  llmModel: string;
  llmApiKey: string;
  topK: number;
}

interface ConfigureRagProps {
  config: Config;
  setRagConfig: (data: Partial<Config>) => void;
}

const ConfigureRAG: React.FC<ConfigureRagProps> = ({
  config,
  setRagConfig,
}) => {
  const form = useForm<Config>({
    defaultValues: config,
  });

  useEffect(() => {
    form.reset(config);
  }, [config, form]);

  const handleChange = (field: keyof Config, value: string) => {
    setRagConfig({ [field]: value });
  };

  const vectorStore = form.watch("vectorStore");

  return (
    <Form {...form}>
      <form className="space-y-8">
        <div className="px-4">
          <div className="card-top-rectangle"></div>

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="ragName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RAG Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter a unique name"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleChange("ragName", e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Controller
              name="vectorStore"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vector Store</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleChange("vectorStore", value);
                    }}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <span>{field.value || "Select Vector Store"}</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weaviate">Weaviate</SelectItem>
                      <SelectItem value="qdrant">Qdrant</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {vectorStore === "qdrant" ? (
              <div className="flex flex-col justify-evenly gap-5 sm:flex-row">
                <FormField
                  control={form.control}
                  name="vectorStoreHost"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Vector Store Host</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Vector Store Host"
                          {...field}
                          value={config.vectorStoreHost}
                          onChange={(e) => {
                            field.onChange(e);
                            handleChange("vectorStoreHost", e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vectorStorePort"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Vector Store Port</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Vector Store Port"
                          {...field}
                          value={config.vectorStorePort}
                          onChange={(e) => {
                            field.onChange(e);
                            handleChange("vectorStorePort", e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <div className="flex flex-col justify-evenly gap-5 sm:flex-row">
                <FormField
                  control={form.control}
                  name="vectorStoreUrl"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Vector Store URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Vector Store URL"
                          {...field}
                          value={config.vectorStoreUrl}
                          onChange={(e) => {
                            field.onChange(e);
                            handleChange("vectorStoreUrl", e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vectorStoreApiKey"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Vector Store API Key</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Vector Store API Key"
                          {...field}
                          value={config.vectorStoreApiKey}
                          onChange={(e) => {
                            field.onChange(e);
                            handleChange("vectorStoreApiKey", e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex flex-col justify-evenly gap-5 sm:flex-row">
              <Controller
                name="llmModel"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>LLM Embedding Model</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleChange("llmModel", value);
                      }}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <span>{field.value || "text-embedding-ada-002"}</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text-embedding-ada-002">
                          text-embedding-ada-002
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="llmApiKey"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>LLM API Key</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter LLM API Key"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleChange("llmApiKey", e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="topK"
              render={({ field }) => (
                <FormItem className="w-full sm:w-1/2">
                  <FormLabel>Top K Similarity</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter maximum number of chunks to match"
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleChange("topK", e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </form>
    </Form>
  );
};

export default ConfigureRAG;
