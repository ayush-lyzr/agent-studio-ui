import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import mixpanel from "mixpanel-browser";
import { Settings2, ExternalLink, Plus, X, Trash2, Info } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/custom/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useModel } from "./model-service";
import { CredentialsList } from "./credentials-list";
import { useToast } from "@/components/ui/use-toast";
import useStore from "@/lib/store";
import axios from "@/lib/axios";
import type { ProviderForm } from "./types";

// Model entry with type
interface ModelEntry {
  name: string;
  type: "inference" | "embedding";
}

// Props for SetupDialog
interface SetupDialogProps {
  provider_id?: string;
  form?: ProviderForm;
}

// Main SetupDialog component
export const SetupDialog: React.FC<SetupDialogProps> = ({
  provider_id,
  form,
}) => {
  // Local state for dialog and credentials
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isTableView, setIsTableView] = useState<boolean>(true);
  const [modelsList, setModelsList] = useState<ModelEntry[]>([]);
  const [modelInput, setModelInput] = useState<string>("");
  const [modelType, setModelType] = useState<"inference" | "embedding">("inference");
  const [scope, setScope] = useState<"personal" | "org">("personal");
  const [useRagCredential, setUseRagCredential] = useState<boolean>(true);
  // const [credentials, setCredentials] = useState<ICredential[]>([]);

  // Hooks for API and notifications
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const apiKey = useStore((state) => state.api_key);
  const {
    credentials = [],
    createCredential,
    createRagCredential,
    isCreatingCredential,
    isFetchingCredentials,
  } = useModel({
    enabled: isDialogOpen && isTableView,
    apiKey,
    llmProvider: provider_id,
  });

  // Zod schema for the credential form
  const formSchema = z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .refine(
        (name) =>
          !credentials.some(
            (cred) => cred.name.toLowerCase() === name.toLowerCase(),
          ),
        "A credential with this name already exists",
      ),
    ...Object.fromEntries(
      Object.entries(form?.properties ?? {}).map(([key, value]) => {
        const isRequired = form?.required?.includes(key);
        let schema: z.ZodTypeAny;

        if (value.pattern) {
          const regex = new RegExp(value.pattern);
          if (isRequired) {
            schema = z
              .string()
              .min(1, `${value.title} is required`)
              .regex(regex, `${value.title} does not match the required format`);
          } else {
            schema = z
              .string()
              .optional()
              .refine(
                (val) => !val || val === "" || regex.test(val),
                `${value.title} does not match the required format`,
              );
          }
        } else {
          schema = isRequired
            ? z.string().min(1, `${value.title} is required`)
            : z.string().optional();
        }

        return [key, schema];
      }),
    ),
  });

  // React Hook Form setup
  const rhfForm = useForm({
    resolver: zodResolver(formSchema),
  });

  // Handle form submission
  const handleSubmit = async (values: any) => {

    try {
      let ragCredId: string | undefined;

      // Create RAG credential first if toggle is enabled for Azure
      if (useRagCredential && provider_id === "azure") {
        try {
          // Filter embedding models from the models list by type
          const embeddingModels = modelsList
            .filter((model) => model.type === "embedding")
            .map((model) => model.name);

          const ragPayload = {
            name: values.name,
            provider_id: "azure",
            type: "embedding",
            scope,
            credentials: values,
            meta_data: {
              models: embeddingModels,
            },
          };

          const ragResponse = await createRagCredential(ragPayload);
          ragCredId = ragResponse.data?.credential_id || ragResponse.data?.id;
          console.log("RAG credential created successfully with ID:", ragCredId);
        } catch (error) {
          console.error("Error creating RAG credential:", error);
        }
      }

      const payload = {
        name: values.name,
        type: "llm",
        meta_data: {
          models: modelsList,
          ...(ragCredId ? { rag_cred_id: ragCredId } : {}),
        },
        credentials: values,
        provider_id: provider_id ?? "",
        scope,
      };
      await createCredential(payload);

      // Special handling for AWS Bedrock
      if (provider_id === "aws-bedrock" && values.aws_role_name) {
        try {
          const bedrockLambdaUrl = import.meta.env.VITE_BEDROCK_LAMBDA_URL;
          await axios.post(
            bedrockLambdaUrl,
            { role_arn: values.aws_role_name },
            {
              headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods":
                  "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
              },
            },
          );
          console.log(
            `Bedrock Lambda called successfully with role_arn ${values.aws_role_name}`,
          );
        } catch (error) {
          console.error("Error calling Bedrock Lambda:", error);
        }
      }

      rhfForm.reset({});
      setModelsList([]);
      setModelInput("");
      // Track with Mixpanel
      if (mixpanel.hasOwnProperty("cookie"))
        mixpanel.track("Added credential", values.name);
      toast({ title: `Added ${form?.title} credential` });
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add credential",
        variant: "destructive",
      });
    }
  };

  const handleClose = (open: boolean) => {
    setIsDialogOpen(open);
    setIsTableView(true);
    if (!open) {
      rhfForm.reset({});
      setModelsList([]);
      setModelInput("");
      setModelType("inference");
      setScope("personal");
      setUseRagCredential(true);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings2 className="mr-1 size-4" />
          Setup
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[450px] max-w-3xl flex-col !rounded-xl bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-4">
            <span>{isTableView ? "Credentials" : `Setup ${form?.title}`}</span>
            {isTableView && (
              <Button
                onClick={() => setIsTableView(false)}
                size="sm"
                className="gap-2"
              >
                <Plus className="size-4" />
                Add New
              </Button>
            )}
          </DialogTitle>
          {/* AWS Bedrock instructions */}
          {provider_id === "aws-bedrock" && (
            <DialogDescription className="inline-flex items-center space-x-1">
              <p>Follow these {provider_id}</p>
              <Link
                to="https://www.youtube.com/watch?v=uhYnvs_HjZM"
                target="_blank"
                className="text-link underline-offset-4 hover:underline"
              >
                instructions
              </Link>{" "}
              <p>and here is how you can </p>
              <Link
                download
                to="/lyzr-access-iam.yaml"
                target="_blank"
                className="text-link underline-offset-4 hover:underline"
              >
                download the template
              </Link>
            </DialogDescription>
          )}
        </DialogHeader>
        <Separator />

        {/* Show credential form or credentials list */}
        {!isTableView ? (
          <Form {...rhfForm}>
            <form
              onSubmit={rhfForm.handleSubmit(handleSubmit)}
              className="no-scrollbar flex h-full flex-col overflow-y-auto"
            >
              <div className="flex-1 pb-[80px]">
                <div className="space-y-4">
                  {/* Scope Toggle and RAG Toggle */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center justify-between flex-1">
                        <div className="space-y-0.5">
                          <Label htmlFor="scope-toggle">Share with organization</Label>
                        </div>
                        <Switch
                          id="scope-toggle"
                          checked={scope === "org"}
                          onCheckedChange={(checked) =>
                            setScope(checked ? "org" : "personal")
                          }
                        />
                      </div>
                      {provider_id === "azure" && (
                        <div className="flex items-center justify-between flex-1">
                          <div className="space-y-0.5">
                            <Label htmlFor="rag-toggle">Use for RAG</Label>
                          </div>
                          <Switch
                            id="rag-toggle"
                            checked={useRagCredential}
                            onCheckedChange={setUseRagCredential}
                          />
                        </div>
                      )}
                    </div>
                    {scope === "org" && (
                      <Alert className="flex items-center gap-2 border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-950 [&>svg]:static [&>svg~*]:pl-0 [&>svg+div]:translate-y-0">
                        <Info className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                        <AlertDescription className="text-blue-800 dark:text-blue-200">
                          This credential will be shared with all members of your organization.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  {/* Name field */}
                  <FormField
                    control={rhfForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter credential name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Dynamic fields from form properties */}
                  {Object.entries(form?.properties ?? {}).map(
                    ([key, value]) => {
                      const required = form?.required?.includes(key);

                      if (value.type === "dropdown") {
                        return (
                          <FormField
                            key={key}
                            control={rhfForm.control}
                            name={key}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel required={required}>
                                  {value.title}
                                </FormLabel>
                                <FormControl>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select an option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {value?.options?.map((option) => (
                                        <SelectItem
                                          key={option.value}
                                          value={option.value}
                                        >
                                          {option.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      }

                      return (
                        <FormField
                          key={key}
                          control={rhfForm.control}
                          name={key}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel required={required}>
                                {value.title}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type={
                                    value.type === "number" ? "number" : "text"
                                  }
                                  placeholder={`Enter ${value.title.toLowerCase()}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      );
                    },
                  )}

                  {/* Models List Section */}
                  <div className="space-y-2">
                    <FormLabel>Models</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Add custom model names that will be available for this credential
                    </p>
                    <div className="flex gap-2">
                      <Select
                        value={modelType}
                        onValueChange={(value: "inference" | "embedding") => setModelType(value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inference">Inference</SelectItem>
                          <SelectItem value="embedding">Embedding</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="relative flex-1">
                        <Input
                          value={modelInput}
                          onChange={(e) => setModelInput(e.target.value)}
                          placeholder="Enter model name (e.g., gpt-4)"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const trimmed = modelInput.trim();
                              if (trimmed && !modelsList.some((m) => m.name === trimmed)) {
                                setModelsList([...modelsList, { name: trimmed, type: modelType }]);
                                setModelInput("");
                              }
                            }
                          }}
                        />
                        {modelInput && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setModelInput("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 size-6 text-muted-foreground hover:text-foreground"
                          >
                            <X className="size-4" />
                          </Button>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const trimmed = modelInput.trim();
                          if (trimmed && !modelsList.some((m) => m.name === trimmed)) {
                            setModelsList([...modelsList, { name: trimmed, type: modelType }]);
                            setModelInput("");
                          }
                        }}
                        disabled={!modelInput.trim()}
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                    {modelsList.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {modelsList.map((model, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm"
                          >
                            <span>{model.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({model.type})
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setModelsList(modelsList.filter((_, i) => i !== index))
                              }
                              className="size-5 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Footer with actions */}
              <div className="sticky bottom-0 left-0 right-0 border-t bg-background pt-4">
                <div className="flex items-center justify-between">
                  <a
                    href={form?.help_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="size-3" />
                    View Documentation
                  </a>
                  <DialogFooter className="items-center sm:justify-end">
                    <span className="inline-flex items-baseline gap-1">
                      <p className="text-destructive">*</p>
                      <p className="text-xs">marked as required</p>
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsTableView(true)}
                    >
                      Back
                    </Button>
                    <Button type="submit" loading={isCreatingCredential}>
                      Save
                    </Button>
                  </DialogFooter>
                </div>
              </div>
            </form>
          </Form>
        ) : (
          <CredentialsList
            credentials={credentials}
            provider={{ provider_id, form }}
            isLoading={isFetchingCredentials}
            onDelete={() =>
              queryClient.invalidateQueries({ queryKey: ["getCredentials"] })
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
