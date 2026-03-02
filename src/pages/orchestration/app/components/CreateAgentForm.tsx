import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SimplifiedBasicDetails } from "./SimplifiedBasicDetails";
import { ConfigureMemory } from "@/pages/create-agent/components/configure-memory";
import { ConfigureRag } from "@/pages/create-agent/components/configure-rag";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  agent_goal: z.string().optional(),
  agent_role: z.string().optional(),
  agent_instructions: z.string().optional(),
  features: z
    .array(
      z.object({
        type: z.string(),
        config: z.record(z.any()),
        priority: z.number(),
      }),
    )
    .default([]),
  tools: z
    .array(
      z.object({
        name: z.string(),
        usage_description: z.string(),
      }),
    )
    .default([]),
  provider_id: z.string().min(1, "Provider is required"),
  model: z.string().min(1, "Model is required"),
  temperature: z.number().min(0).max(1),
  top_p: z.number().min(0).max(1),
  llm_credential_id: z.string().optional(),
  examples: z.string().optional().nullable(),
  examples_visible: z.boolean().optional(),
  response_format: z.enum(["text", "json_object"]).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateAgentFormProps {
  onSubmit: (data: FormValues) => void;
  isLoading?: boolean;
}

export const CreateAgentForm: React.FC<CreateAgentFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      agent_goal: "",
      agent_role: "",
      agent_instructions: "",
      features: [],
      tools: [{ name: "", usage_description: "" }],
      provider_id: "",
      model: "",
      temperature: 0.7,
      top_p: 0.9,
      llm_credential_id: "",
      examples: "",
      examples_visible: false,
      response_format: "text",
    },
  });

  const handleSubmit = (data: FormValues) => {
    try {
      onSubmit(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create agent. Please try again.",
        variant: "destructive",
      });
    }
  };

  const [memoryEnabled, setMemoryEnabled] = useState(false);
  const [knowledgeBaseEnabled, setKnowledgeBaseEnabled] = useState(false);


  const updateFeatures = (
    name: string,
    enabled: boolean,
    ragId?: string,
    ragName?: string,
    config?: any,
  ) => {
    const currentFeatures = form.getValues("features") || [];
    const existingFeatureIndex = currentFeatures.findIndex(
      (feature: any) => feature.type === name,
    );

    if (enabled) {
      const newFeature = {
        type: name,
        enabled: true,
        priority: 1,
        config: config || {},
      };

      if (ragId) {
        newFeature.config.rag_id = ragId;
      }
      if (ragName) {
        newFeature.config.rag_name = ragName;
      }

      if (existingFeatureIndex >= 0) {
        currentFeatures[existingFeatureIndex] = newFeature;
      } else {
        currentFeatures.push(newFeature);
      }
    } else {
      if (existingFeatureIndex >= 0) {
        currentFeatures.splice(existingFeatureIndex, 1);
      }
    }

    form.setValue("features", currentFeatures);

    // Update local state
    if (name === "MEMORY") {
      setMemoryEnabled(enabled);
    } else if (name === "KNOWLEDGE_BASE") {
      setKnowledgeBaseEnabled(enabled);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Details</h3>
            <SimplifiedBasicDetails
              scrollRef={scrollRef}
              form={form}
              agent={undefined}
            />
          </div>

          {/* Features Section - Only Memory and Knowledge Base */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Features</h3>
            
            {/* Memory Feature */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧠</span>
                  <div>
                    <h4 className="font-medium">Memory</h4>
                    <p className="text-sm text-muted-foreground">
                      Enable conversation memory for your agent
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={memoryEnabled}
                  onCheckedChange={(checked) => {
                    setMemoryEnabled(checked);
                    if (checked) {
                      updateFeatures("MEMORY", true, undefined, undefined, {
                        max_messages_context_count: 10,
                      });
                    } else {
                      updateFeatures("MEMORY", false);
                    }
                  }}
                />
                {memoryEnabled && (
                  <ConfigureMemory
                    updateFeatures={updateFeatures}
                    featureName="MEMORY"
                  />
                )}
              </div>
            </div>

            {/* Knowledge Base Feature */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📚</span>
                  <div>
                    <h4 className="font-medium">Knowledge Base (RAG)</h4>
                    <p className="text-sm text-muted-foreground">
                      Connect your agent to a knowledge base
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={knowledgeBaseEnabled}
                  onCheckedChange={(checked) => {
                    setKnowledgeBaseEnabled(checked);
                    if (checked) {
                      updateFeatures("KNOWLEDGE_BASE", true);
                    } else {
                      updateFeatures("KNOWLEDGE_BASE", false);
                    }
                  }}
                />
                {knowledgeBaseEnabled && (
                  <ConfigureRag
                    updateFeatures={updateFeatures}
                    featureName="KNOWLEDGE_BASE"
                    disableAgenticRag={true}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                "Create Agent"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CreateAgentForm;