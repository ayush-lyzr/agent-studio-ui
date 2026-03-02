import React, { useState, useEffect } from "react";
import {
  X,
  Code,
  ArrowLeft,
  ArrowRight,
  UploadCloud,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import useStore from "@/lib/store";
import FileExplorer, { FileItem } from "./FileExplorer";
import EnhancedCodeEditor from "./EnhancedCodeEditor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WebIDEProps {
  isOpen: boolean;
  onClose: () => void;
  initialFiles?: FileItem[];
  agentData?: any;
  allAgents?: any[];
  allWorkflows?: any[];
  onSaveAgentData?: (agentData: any, agentId: string) => void;
  onSaveWorkflowData?: (workflowData: any, workflowId: string) => void;
}

// Sample starter template for Python agent
/*
const pythonAgentTemplate = `# Agent Template
import os
import json

class Agent:
    def __init__(self, config=None):
        self.config = config or {}
        self.name = "My Custom Agent"
        self.description = "A customizable agent template"
        
    def process(self, input_text):
        """
        Process the input text and return a response
        """
        # Your agent logic here
        return {
            "response": f"Processed: {input_text}",
            "status": "success"
        }
        
    def get_info(self):
        """
        Return information about this agent
        """
        return {
            "name": self.name,
            "description": self.description,
            "capabilities": ["text_processing"]
        }

# Initialize the agent
agent = Agent()

# Example usage
if __name__ == "__main__":
    test_input = "Hello, agent!"
    result = agent.process(test_input)
    print(json.dumps(result, indent=2))
`;
*/

// Default starter files
const defaultFiles: FileItem[] = [
  // {
  //   id: uuidv4(),
  //   name: 'My Agent',
  //   type: 'folder',
  //   children: [
  //     {
  //       id: uuidv4(),
  //       name: 'agent.py',
  //       type: 'file',
  //       content: pythonAgentTemplate,
  //       language: 'python'
  //     },
  //     {
  //       id: uuidv4(),
  //       name: 'config.json',
  //       type: 'file',
  //       content: JSON.stringify({
  //         "name": "My Custom Agent",
  //         "version": "1.0.0",
  //         "description": "A customizable agent for various tasks",
  //         "settings": {
  //           "max_tokens": 1000,
  //           "temperature": 0.7
  //         }
  //       }, null, 2),
  //       language: 'json'
  //     }
  //   ]
  // }
];

const WebIDE: React.FC<WebIDEProps> = ({
  isOpen,
  onClose,
  initialFiles = defaultFiles,
  agentData,
  allAgents = [],
  allWorkflows = [],
  onSaveAgentData,
  onSaveWorkflowData,
}) => {
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteType, setDeleteType] = useState<"file" | "agent" | "workflow">(
    "file",
  );

  // Force-fetch workflow data whenever the IDE is opened
  useEffect(() => {
    const loadWorkflows = async () => {
      if (!isOpen) return; // Only load when IDE is open

      try {
        // Get the API key from store
        const apiKey = useStore.getState().api_key;
        if (!apiKey) {
          console.warn("⚠️ No API key found for workflow fetch");
          return;
        }

        console.log("🔄 Fetching workflows directly...");
        console.log(
          "API key exists:",
          apiKey ? "Yes (masked: " + apiKey.substring(0, 5) + "...)" : "No",
        );

        // Log base URL
        const baseUrl = import.meta.env.VITE_BASE_URL || "https://api.lyzr.ai";
        console.log("Using API base URL:", baseUrl);

        // Direct API call to get fresh workflow data
        const response = await fetch(`${baseUrl}/v3/workflows/`, {
          headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.error(
            `⛔ Failed to fetch workflows directly: ${response.status}`,
          );
          return;
        }

        let data;
        try {
          const responseText = await response.text();
          console.log(
            "Raw response text (first 100 chars):",
            responseText.substring(0, 100),
          );
          data = JSON.parse(responseText);
        } catch (err) {
          console.error("⛔ Error parsing workflow response:", err);
          return;
        }

        console.log(`✅ Successfully fetched workflows:`, data);

        // Handle different response formats
        let workflowArray = data;

        // Check if response has a data property that contains the workflows
        if (!Array.isArray(data) && data.data && Array.isArray(data.data)) {
          workflowArray = data.data;
          console.log("Using data property of response for workflows");
        }

        // Check if we have a valid array of workflows
        if (!workflowArray || !Array.isArray(workflowArray)) {
          console.error("⛔ Workflow data format unexpected:", data);
          return;
        }

        console.log(`Found ${workflowArray.length} workflows to process`);

        // Map the workflow data to file items
        const workflowFiles = workflowArray.map((workflow: any) => {
          // Extract workflow ID and name, trying multiple possible fields
          const workflowId = workflow._id || workflow.id || workflow.flow_id;
          const name =
            workflow.flow_name || workflow.name || "Unnamed Workflow";

          console.log(`  - Processing workflow: ${name}, ID: ${workflowId}`);

          return {
            id: `workflow-${workflowId}`,
            name: `${name}.json`,
            type: "file" as const,
            content: JSON.stringify(workflow, null, 2),
            language: "json",
            metadata: { workflowId: workflowId },
          };
        });

        // Create a complete new file structure with our fresh workflows
        setFiles((currentFiles) => {
          // Deep copy the current files
          const newFiles = [...currentFiles];

          // Create/update workflows folder
          const workflowsFolder = {
            id: "all-workflows-folder",
            name: "My Workflows",
            type: "folder" as const,
            children: workflowFiles,
          };

          // Replace if exists, add if not
          const existingIndex = newFiles.findIndex(
            (f) => f.id === "all-workflows-folder",
          );
          if (existingIndex >= 0) {
            newFiles[existingIndex] = workflowsFolder;
          } else {
            newFiles.push(workflowsFolder);
          }

          return newFiles;
        });

        console.log(
          "📁 Workflows folder updated with",
          workflowFiles.length,
          "files",
        );
      } catch (error) {
        console.error("⛔ Error fetching workflows:", error);
      }
    };

    // Execute immediately when component mounts or isOpen changes
    loadWorkflows();
  }, [isOpen]); // Only re-run when isOpen changes

  // Update files when agents or workflows data changes
  useEffect(() => {
    let fileStructure = [...initialFiles];
    console.log("Data changed, updating file structure", {
      agentsCount: allAgents?.length || 0,
      workflowsCount: allWorkflows?.length || 0,
      workflowsSample: allWorkflows?.[0] || "No workflows",
    });

    // Add all agents folder first - this should always be visible
    console.log(`Creating files for ${allAgents?.length || 0} agents`);
    const agentFiles =
      allAgents?.map((agent) => ({
        id: `agent-${agent._id}`,
        name: `${agent.name || "Unnamed Agent"}.json`,
        type: "file" as const,
        content: JSON.stringify(agent, null, 2),
        language: "json",
        metadata: { agentId: agent._id },
      })) || [];

    fileStructure = [
      {
        id: "all-agents-folder",
        name: "My Agents",
        type: "folder",
        children: agentFiles,
      },
      ...fileStructure,
    ];

    // Add workflows folder - always show this folder even if empty
    console.log(`Creating files for ${allWorkflows?.length || 0} workflows`);
    console.log(
      "Workflow data keys:",
      allWorkflows?.[0] ? Object.keys(allWorkflows[0]) : "No workflows",
    );

    const workflowFiles =
      allWorkflows?.map((workflow) => {
        // Extract the workflow ID from various possible formats
        const workflowId = workflow._id || workflow.id || workflow.flow_id;
        const name = workflow.flow_name || workflow.name || "Unnamed Workflow";

        console.log(`Processing workflow: ${name}, ID: ${workflowId}`);

        return {
          id: `workflow-${workflowId}`,
          name: `${name}.json`,
          type: "file" as const,
          content: JSON.stringify(workflow, null, 2),
          language: "json",
          metadata: { workflowId: workflowId },
        };
      }) || [];

    // Add workflows folder to the file structure
    fileStructure = [
      ...fileStructure,
      {
        id: "all-workflows-folder",
        name: "My Workflows",
        type: "folder",
        children: workflowFiles,
      },
    ];

    // If a specific agent is selected for editing, add it to a separate folder
    if (agentData) {
      // Create agent JSON file from actual agent data
      const agentJsonFile: FileItem = {
        id: `agent-${agentData._id}`,
        name: `${agentData.name || "Agent"}.json`,
        type: "file",
        content: JSON.stringify(agentData, null, 2),
        language: "json",
        metadata: { agentId: agentData._id },
      };

      fileStructure.push({
        id: "selected-agent-folder",
        name: "Selected Agent",
        type: "folder",
        children: [agentJsonFile],
      });
    }

    setFiles(fileStructure);
  }, [allAgents, agentData, initialFiles]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isExplorerVisible, setIsExplorerVisible] = useState(true);

  // Find file by ID in nested structure
  const findFileById = (items: FileItem[], id: string): FileItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.type === "folder" && item.children) {
        const found = findFileById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Update file content recursively
  const updateFileContent = (
    items: FileItem[],
    id: string,
    content: string,
  ): FileItem[] => {
    return items.map((item) => {
      if (item.id === id) {
        return { ...item, content };
      }
      if (item.type === "folder" && item.children) {
        return {
          ...item,
          children: updateFileContent(item.children, id, content),
        };
      }
      return item;
    });
  };

  // Handle file selection
  const handleFileSelect = (file: FileItem) => {
    if (file.type === "file") {
      setSelectedFileId(file.id);
      setSelectedFile(file);
    }
  };

  // Handle file content change
  const handleFileChange = (fileId: string, content: string) => {
    setFiles((prevFiles) => updateFileContent(prevFiles, fileId, content));

    // Also update the selected file if it's the one being edited
    if (selectedFile && selectedFile.id === fileId) {
      setSelectedFile({ ...selectedFile, content });
    }
  };

  // Create a new file or folder
  const handleFileCreate = (
    parentId: string | null,
    fileType: "file" | "folder",
    name: string,
  ) => {
    const newItem: FileItem = {
      id: uuidv4(),
      name,
      type: fileType,
      content: fileType === "file" ? "" : undefined,
      children: fileType === "folder" ? [] : undefined,
      language: fileType === "file" ? getLanguageFromFilename(name) : undefined,
    };

    if (!parentId) {
      // Add to root
      setFiles([...files, newItem]);
    } else {
      // Add to parent folder
      const addToParent = (items: FileItem[]): FileItem[] => {
        return items.map((item) => {
          if (item.id === parentId) {
            return {
              ...item,
              children: [...(item.children || []), newItem],
            };
          }
          if (item.type === "folder" && item.children) {
            return {
              ...item,
              children: addToParent(item.children),
            };
          }
          return item;
        });
      };

      setFiles(addToParent(files));
    }

    toast.success(`Created ${fileType} "${name}"`);
  };

  // Delete a file or folder
  const handleFileDelete = (fileId: string) => {
    // Find file to delete
    const findFile = (items: FileItem[]): FileItem | null => {
      for (const item of items) {
        if (item.id === fileId) {
          return item;
        }
        if (item.type === "folder" && item.children) {
          const found = findFile(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    const fileToBeDeleted = findFile(files);
    if (!fileToBeDeleted) return;

    // Check if this is an agent file from the My Agents folder
    const isAgentFile =
      fileToBeDeleted.metadata?.agentId &&
      files.some(
        (folder) =>
          folder.id === "all-agents-folder" &&
          folder.children?.some((file) => file.id === fileId),
      );

    // Check if this is a workflow file from the My Workflows folder
    const isWorkflowFile =
      fileToBeDeleted.metadata?.workflowId &&
      files.some(
        (folder) =>
          folder.id === "all-workflows-folder" &&
          folder.children?.some((file) => file.id === fileId),
      );

    if (isAgentFile) {
      // This is an agent file, show confirmation dialog
      setFileToDelete(fileToBeDeleted);
      setDeleteType("agent");
      setShowDeleteDialog(true);
    } else if (isWorkflowFile) {
      // This is a workflow file, show confirmation dialog
      setFileToDelete(fileToBeDeleted);
      setDeleteType("workflow");
      setShowDeleteDialog(true);
    } else {
      // Regular file, delete without confirmation
      const findAndDelete = (items: FileItem[]): FileItem[] => {
        return items.filter((item) => {
          if (item.id === fileId) {
            return false;
          }
          if (item.type === "folder" && item.children) {
            item.children = findAndDelete(item.children);
          }
          return true;
        });
      };

      setFiles(findAndDelete([...files]));
    }
  };

  // Get language from filename
  const getLanguageFromFilename = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    switch (ext) {
      case "js":
        return "javascript";
      case "ts":
        return "typescript";
      case "jsx":
        return "javascript";
      case "tsx":
        return "typescript";
      case "py":
        return "python";
      case "json":
        return "json";
      case "html":
        return "html";
      case "css":
        return "css";
      default:
        return "plaintext";
    }
  };

  // Handle file save
  const handleSave = () => {
    // Save changes to files
    console.log("Saving files:", files);

    // Check if we need to save agent data
    if (
      selectedFile &&
      selectedFile.type === "file" &&
      selectedFile.metadata?.agentId &&
      onSaveAgentData
    ) {
      try {
        // Parse the JSON content
        const updatedAgentData = JSON.parse(selectedFile.content || "{}");
        // Save back to the agent
        onSaveAgentData(updatedAgentData, selectedFile.metadata.agentId);
        toast.success(`Agent "${selectedFile.name}" saved successfully`);
        return;
      } catch (error) {
        console.error("Error parsing agent JSON:", error);
        toast.error("Invalid JSON format in agent configuration");
        return;
      }
    }

    // Check if we need to save workflow data
    if (
      selectedFile &&
      selectedFile.type === "file" &&
      selectedFile.metadata?.workflowId &&
      onSaveWorkflowData
    ) {
      try {
        // Parse the JSON content
        const updatedWorkflowData = JSON.parse(selectedFile.content || "{}");
        // Save back to the workflow
        onSaveWorkflowData(
          updatedWorkflowData,
          selectedFile.metadata.workflowId,
        );
        toast.success(`Workflow "${selectedFile.name}" saved successfully`);
        return;
      } catch (error) {
        console.error("Error parsing workflow JSON:", error);
        toast.error("Invalid JSON format in workflow configuration");
        return;
      }
    }

    toast.success("All changes saved");
  };

  // Handle file run
  const handleRun = () => {
    if (selectedFile?.language === "python") {
      toast.success("Executing Python script");
    } else {
      toast.info("Execution not supported for this file type");
    }
  };

  // Import files from disk
  const handleImportFiles = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ".py,.js,.ts,.json,.html,.css,.txt";

    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (!target.files) return;

      Array.from(target.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const newFile: FileItem = {
              id: uuidv4(),
              name: file.name,
              type: "file",
              content: event.target.result as string,
              language: getLanguageFromFilename(file.name),
            };

            setFiles((prev) => [...prev, newFile]);
          }
        };
        reader.readAsText(file);
      });

      toast.success(`Imported ${target.files.length} file(s)`);
    };

    input.click();
  };

  // Handle confirming item deletion (agents or workflows)
  const confirmDeleteAgent = async () => {
    if (!fileToDelete) {
      setShowDeleteDialog(false);
      return;
    }

    try {
      // Handle agent deletion
      if (
        deleteType === "agent" &&
        fileToDelete.metadata?.agentId &&
        onSaveAgentData
      ) {
        const agentId = fileToDelete.metadata.agentId;

        // Call the delete agent API via onSaveAgentData with special flag
        await onSaveAgentData({ _delete: true }, agentId);
        toast.success("Agent deleted successfully");
      }
      // Handle workflow deletion
      else if (
        deleteType === "workflow" &&
        fileToDelete.metadata?.workflowId &&
        onSaveWorkflowData
      ) {
        const workflowId = fileToDelete.metadata.workflowId;

        // Call the delete workflow API via onSaveWorkflowData with special flag
        await onSaveWorkflowData({ _delete: true }, workflowId);
        toast.success("Workflow deleted successfully");
      }

      // Remove the item from the file list
      const findAndDelete = (items: FileItem[]): FileItem[] => {
        return items.filter((item) => {
          if (item.id === fileToDelete.id) {
            return false;
          }
          if (item.type === "folder" && item.children) {
            item.children = findAndDelete(item.children);
          }
          return true;
        });
      };

      setFiles(findAndDelete([...files]));
    } catch (error) {
      console.error(`Error deleting ${deleteType}:`, error);
      toast.error(`Failed to delete ${deleteType}`);
    }

    setShowDeleteDialog(false);
  };

  // Handle cancel delete
  const cancelDelete = () => {
    setFileToDelete(null);
    setShowDeleteDialog(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed z-50 rounded-lg border border-border bg-card shadow-xl transition-all duration-200",
        isFullScreen
          ? "bottom-0 left-0 right-0 top-0 m-0 rounded-none"
          : "bottom-4 left-4 right-4 top-4 m-0",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-primary/10 p-3 shadow-sm">
        <div className="flex items-center">
          <Code className="mr-2.5 h-5 w-5 text-primary" />
          <span className="text-base font-semibold text-foreground">
            Lyzr Agent Studio IDE
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              window.open(
                "https://github.dev/NeuralgoLyzr/lyzr-agent/tree/dev",
                "_blank",
              )
            }
            title="Open in GitHub.dev"
            className="hover:bg-primary/20"
          >
            <ExternalLink className="h-4 w-4 text-primary" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleImportFiles}
            title="Import Files"
            className="hover:bg-primary/20"
          >
            <UploadCloud className="h-4 w-4 text-primary" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            title="Close IDE"
            className="hover:bg-primary/20"
          >
            <X className="h-4 w-4 text-foreground" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex h-[calc(100%-40px)]">
        {/* File explorer */}
        {isExplorerVisible && (
          <div className="w-64 border-r border-border">
            <FileExplorer
              files={files}
              onFileSelect={handleFileSelect}
              onFileCreate={handleFileCreate}
              onFileDelete={handleFileDelete}
              selectedFileId={selectedFileId}
            />
          </div>
        )}

        {/* Toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-full w-6 rounded-none border-r border-border px-0 py-0"
          onClick={() => setIsExplorerVisible(!isExplorerVisible)}
        >
          {isExplorerVisible ? (
            <ArrowLeft className="h-3 w-3" />
          ) : (
            <ArrowRight className="h-3 w-3" />
          )}
        </Button>

        {/* Code editor */}
        <div className="flex-1">
          <EnhancedCodeEditor
            files={files}
            onFileChange={handleFileChange}
            selectedFile={selectedFile}
            isFullScreen={isFullScreen}
            onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
            onSave={handleSave}
            onRun={handleRun}
          />
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteType === "agent"
                ? "Delete Agent"
                : deleteType === "workflow"
                  ? "Delete Workflow"
                  : "Delete File"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === "agent"
                ? `Are you sure you want to delete the agent "${fileToDelete?.name?.replace(".json", "")}"? This action cannot be undone.`
                : deleteType === "workflow"
                  ? `Are you sure you want to delete the workflow "${fileToDelete?.name?.replace(".json", "")}"? This action cannot be undone.`
                  : `Are you sure you want to delete "${fileToDelete?.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAgent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WebIDE;
