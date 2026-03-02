import React, { useEffect, useState } from "react";
import { X, Globe, Lock, Users, ChevronRight, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  blueprintApiService,
  BlueprintData,
} from "@/services/blueprintApiService";
import { Agent } from "../types/agent";
import { Edge, Node } from "@xyflow/react";
import MarkdownRenderer from "@/components/custom/markdown";
import { RichTextEditor } from "@/components/custom/RichTextEditor";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
import { useSearchParams } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface PublishBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
  groups?: any[]; // Group data for saving
}

const PublishBlueprintModal: React.FC<PublishBlueprintModalProps> = ({
  isOpen,
  onClose,
  nodes,
  edges,
  // groups = [],
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isPublishing, setIsPublishing] = useState(false);
  const [searchParams] = useSearchParams();
  const { currentUser } = useCurrentUser();
  const lyzrUser = "@lyzr.ai";
  const isLyzrUser = currentUser?.auth?.email.endsWith(lyzrUser);

  // Form state
  const [blueprintName, setBlueprintName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [shareType, setShareType] = useState<
    "private" | "public" | "organization"
  >("private");
  const blueprintId = searchParams.get("blueprint");
  const [markdownContent, setMarkdownContent] =
    useState(`# Blueprint Documentation

## Overview
Describe what this blueprint does and its main purpose.

## How to Use
1. Step 1: ...
2. Step 2: ...
3. Step 3: ...

## Configuration
- **Agent 1**: Description of its role
- **Agent 2**: Description of its role

## Requirements
- List any prerequisites
- Required API keys or credentials
- Other dependencies

## Examples
Provide examples of how to use this blueprint effectively.
`);

  useEffect(() => {
    const fetchBlueprint = async () => {
      if (!blueprintId) return;
      try {
        const blueprint = await blueprintApiService.getBlueprint(blueprintId);

        setBlueprintName(blueprint.name || "");
        setDescription(blueprint.description || "");
        setCategory(blueprint.category || "");
        setTags(blueprint.tags || []);
        setShareType(blueprint.share_type || "private");
        setMarkdownContent(
          blueprint?.blueprint_info?.documentation_data?.markdown || "",
        );
      } catch (err) {
        console.error("Failed to fetch blueprint data", err);
        toast.error("Failed to load blueprint data.");
      }
    };

    fetchBlueprint();
  }, [blueprintId]);

  const findManagerAgent = () => {
    // Find the root node (node with no incoming edges)
    const nodeIds = nodes.map((n) => n.id);
    const targetIds = edges.map((e) => e.target);
    const rootNodes = nodeIds.filter((id) => !targetIds.includes(id));

    if (rootNodes.length > 0) {
      const rootNode = nodes.find((n) => n.id === rootNodes[0]);
      return rootNode?.data as Agent;
    }

    // Fallback: return the first agent marked as MANAGER
    const managerNode = nodes.find(
      (n) => (n.data as Agent).template_type === "MANAGER",
    );
    return managerNode?.data as Agent;
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handlePublish = async () => {
    if (!blueprintName || !description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsPublishing(true);

    try {
      const managerAgent = findManagerAgent();
      if (!managerAgent) {
        toast.error(
          "Could not identify the manager agent in the orchestration",
        );
        return;
      }

      // Prepare tree structure for reconstruction with full agent documents
      const agentsMap: { [key: string]: Agent } = {};

      // Collect all agents
      nodes.forEach((node) => {
        const agent = node.data as Agent;
        agentsMap[agent._id] = agent;
      });

      const treeStructure = {
        nodes: nodes.map((node) => ({
          id: node.id,
          position: node.position,
          type: node.type,
          data: node.data, // Save complete agent data
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
        })),
      };

      const isManagerAgent = managerAgent.managed_agents?.length > 0;
      const blueprintData: BlueprintData = {
        name: blueprintName,
        description,
        orchestration_type: isManagerAgent ? "Manager Agent" : "Single Agent",
        orchestration_name: blueprintName,
        blueprint_data: {
          manager_agent_id: managerAgent._id,
          tree_structure: treeStructure,
          nodes: treeStructure.nodes,
          edges: treeStructure.edges,
          agents: agentsMap, // Include all agent documents
          // groups: groups, // Include group data
        },
        blueprint_info: {
          documentation_data: {
            markdown: markdownContent,
          },
          type: "markdown",
        },
        tags,
        category: category || "general",
        is_template: false,
        share_type: shareType,
        shared_with_users: [],
        shared_with_organizations: [],
      };

      if (blueprintId) {
        await blueprintApiService.updateBlueprint(blueprintId, blueprintData);
        toast.success("Blueprint updated successfully!");
      } else {
        await blueprintApiService.createBlueprint(blueprintData);
        toast.success("Blueprint published successfully!");
        // Reset form
        setBlueprintName("");
        setDescription("");
        setCategory("");
        setTags([]);
        setShareType("private");
        setMarkdownContent("");
      }

      onClose();
      setCurrentStep(1);
    } catch (error) {
      console.error("Failed to publish blueprint:", error);
      toast.error("Failed to publish blueprint");
    } finally {
      setIsPublishing(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="blueprint-name">Blueprint Name *</Label>
        <Input
          id="blueprint-name"
          value={blueprintName}
          onChange={(e) => setBlueprintName(e.target.value)}
          placeholder="Enter a descriptive name for your blueprint"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this blueprint does and when to use it"
          className="mt-2 min-h-[100px]"
        />
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="mt-2 h-9 w-full">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="customer-service">Customer Service</SelectItem>
            <SelectItem value="data-analysis">Data Analysis</SelectItem>
            <SelectItem value="content-creation">Content Creation</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="development">Development</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="Type a tag and press Enter"
          className="mt-2"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="px-2 py-1">
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-2 text-xs hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label>Sharing Options</Label>
        <RadioGroup
          value={shareType}
          onValueChange={(value: any) => setShareType(value)}
          className="mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="private" id="private" />
            <Label
              htmlFor="private"
              className="flex cursor-pointer items-center"
            >
              <Lock className="mr-2 h-4 w-4" />
              Private - Only you can access
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="organization" id="organization" />
            <Label
              htmlFor="organization"
              className="flex cursor-pointer items-center"
            >
              <Users className="mr-2 h-4 w-4" />
              Organization - Share with your organization
            </Label>
          </div>
          {isLyzrUser && (
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="public" id="public" />
              <Label
                htmlFor="public"
                className="flex cursor-pointer items-center"
              >
                <Globe className="mr-2 h-4 w-4" />
                Public - Anyone can access
              </Label>
            </div>
          )}
        </RadioGroup>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <Label>Documentation</Label>
        <p className="mb-2 text-sm text-muted-foreground">
          Use the rich text editor to create documentation. It will
          automatically convert to Markdown.
        </p>

        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="edit">
            <RichTextEditor
              value={markdownContent}
              onChange={setMarkdownContent}
              placeholder="Start writing your documentation..."
              className="mt-2"
            />
          </TabsContent>

          <TabsContent value="preview">
            <div className="min-h-[400px] overflow-y-auto rounded-md border bg-muted/30 p-4">
              <MarkdownRenderer content={markdownContent} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Publish Blueprint - Step {currentStep} of 2
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          {currentStep === 1 ? renderStep1() : renderStep2()}
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          {currentStep === 2 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              disabled={isPublishing}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}

          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isPublishing}>
              Cancel
            </Button>

            {currentStep === 1 ? (
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!blueprintName || !description}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handlePublish} disabled={isPublishing}>
                {isPublishing
                  ? "Publishing..."
                  : blueprintId
                    ? "Update Blueprint"
                    : "Publish Blueprint"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PublishBlueprintModal;
