import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  Wrench,
  RefreshCw,
  Paperclip,
  Upload,
  Globe,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkflowNode, WorkflowEdge, ParamValue } from "@/types/workflow";
import { useAgents } from "@/hooks/useAgents";
import { toast } from "sonner";
import { useAgentBuilder } from "@/pages/agent-builder/agent-builder.service";
import { IAgent } from "@/lib/types";
import axios from "@/lib/axios";
import { BASE_URL } from "@/lib/constants";
import { useDropzone } from "react-dropzone";
import useStore from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NodeConfigProps {
  node: WorkflowNode | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  onUpdate: (
    nodeId: string,
    data: any,
    fileMapping?: Record<string, { name: string; type: string; size: number }>,
  ) => void;
  onClose: () => void;
  onDelete: (nodeId: string) => void;
  onSaveAndClose?: () => void;
  globalFileMapping?: Record<
    string,
    { name: string; type: string; size: number }
  >;
}

const NodeConfig: React.FC<NodeConfigProps> = ({
  node,
  nodes,
  edges,
  onUpdate,
  onClose,
  onDelete,
  onSaveAndClose,
  globalFileMapping,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [nodeData, setNodeData] = useState<any>(null);
  const { getRandomIds } = useAgents();
  const apiKey = useStore((state) => state.api_key);
  const [agents, setAgents] = useState<IAgent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [configMode, _] = useState<string>("normal");
  const [userMessage, setUserMessage] = useState<string>("");
  const [filteredAgentIds, setFilteredAgentIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const { getAgents } = useAgentBuilder({ apiKey });
  const [uploadedAssets, setUploadedAssets] = useState<
    Array<{
      asset_id: string;
      name: string;
      type: string;
      size: number;
    }>
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [apiConfig, setApiConfig] = useState<{
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: Record<string, string>;
  }>({
    url: "",
    method: "GET",
    headers: {} as Record<string, string>,
  });
  const [headersList, setHeadersList] = useState<
    Array<{ id: string; key: string; value: string }>
  >([]);
  const [queryParamsList, setQueryParamsList] = useState<
    Array<{ id: string; key: string; value: string }>
  >([]);
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [bodyParams, setBodyParams] = useState<Record<string, string>>({});
  const [bodyParamsString, setBodyParamsString] = useState<string>("");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setFilteredAgentIds([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchAgents = async () => {
      if (!apiKey) return;
      
      setIsLoadingAgents(true);
      try {
        const response = await getAgents();
        if (response?.data) {
          setAgents(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch agents:", error);
        toast.error("Failed to load agents");
      } finally {
        setIsLoadingAgents(false);
      }
    };

    fetchAgents();
  }, [apiKey, getAgents]);

  useEffect(() => {
    if (node) {
      if (node.type === "gpt_router") {
        onClose();
        return;
      }
      setNodeData({ ...node.data });
      // Try to extract agent ID from params
      if (node.type === "agent" && node.data.params?.config) {
        const config = node.data.params.config;
        // Check if config is an object with agent_id property
        if (
          typeof config === "object" &&
          config !== null &&
          "agent_id" in config
        ) {
          setSelectedAgentId(config.agent_id as string);
          const agent = agents.find((a) => a._id === config.agent_id);
          setSearchQuery(agent?.name || "");
        } else {
          setSelectedAgentId(node.id as string);
        }
      }

      // Extract user message if it exists
      if (node.type === "agent" && node.data.params?.user_message) {
        const message = node.data.params.user_message;
        if (typeof message === "string") {
          setUserMessage(message);
        } else if (
          typeof message === "object" &&
          message !== null &&
          "value" in message
        ) {
          setUserMessage(message.value || "");
        }
      }

      // Extract uploaded assets if they exist
      if (
        node.type === "agent" &&
        node.data.params?.assets &&
        Array.isArray(node.data.params.assets)
      ) {
        // If we have global file mapping, reconstruct the asset info
        if (globalFileMapping) {
          const reconstructedAssets = node.data.params.assets.map(
            (assetId: string) => {
              const mappingInfo = globalFileMapping[assetId];
              if (mappingInfo) {
                return {
                  asset_id: assetId,
                  name: mappingInfo.name,
                  type: mappingInfo.type,
                  size: mappingInfo.size,
                };
              }
              // Fallback if no mapping found
              return {
                asset_id: assetId,
                name: `File ${assetId.slice(0, 8)}`,
                type: "unknown",
                size: 0,
              };
            },
          );
          setUploadedAssets(reconstructedAssets);
        } else {
          // Legacy handling - just use asset IDs as objects
          const legacyAssets = node.data.params.assets.map(
            (assetId: string) => ({
              asset_id: assetId,
              name: `File ${assetId.slice(0, 8)}`,
              type: "unknown",
              size: 0,
            }),
          );
          setUploadedAssets(legacyAssets);
        }
      } else {
        setUploadedAssets([]);
      }

      // Extract API configuration for API nodes
      if (node.type === "api" && node.data.params?.config) {
        const config = node.data.params.config;
        if (
          typeof config === "object" &&
          config !== null &&
          !("input" in config) &&
          !("depends" in config)
        ) {
          const apiConfigObj = config as any;
          setApiConfig({
            url: apiConfigObj.url || "",
            method: apiConfigObj.method || "GET",
            headers: apiConfigObj.headers || {},
            body: apiConfigObj.body || {},
          });

          console.log({ body: apiConfigObj.body });

          const headersArray = Object.entries(apiConfigObj.headers || {}).map(
            ([key, value], index) => ({
              id: `header_${index}`,
              key,
              value: typeof value === "string" ? value : "",
            }),
          );
          setHeadersList(headersArray);
          setBodyParams(apiConfigObj.body || {});
          setBodyParamsString(JSON.stringify(apiConfigObj.body || {}, null, 2));
        }

        // Extract query and body parameters
        const queryParamsObj: Record<string, string> = {};
        // const bodyParamsObj: Record<string, string> = {};

        Object.entries(node.data.params).forEach(([key, value]) => {
          if (key.startsWith("QUERY_")) {
            const paramName = key.replace("QUERY_", "");
            queryParamsObj[paramName] = typeof value === "string" ? value : "";
          }
        });

        setQueryParams(queryParamsObj);

        const queryParamsArray = Object.entries(queryParamsObj).map(
          ([key, value], index) => ({
            id: `query_${index}`,
            key,
            value: typeof value === "string" ? value : "",
          }),
        );
        setQueryParamsList(queryParamsArray);
      } else if (node.type === "api") {
        // Reset for new API nodes
        setApiConfig({ url: "", method: "GET", headers: {} });
        setHeadersList([]);
        setQueryParamsList([]);
        setQueryParams({});
        setBodyParams({});
      }
    } else {
      setNodeData(null);
    }
  }, [node, globalFileMapping]);


  // File upload functions - declared before useDropzone
  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await axios.post("/v3/assets/upload", formData, {
        baseURL: BASE_URL,
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "multipart/form-data",
        },
      });

      const successfulUploads = response.data.results?.filter(
        (result: any) => result.success,
      );
      const failedUploads = response.data.results?.filter(
        (result: any) => !result.success,
      );

      if (failedUploads.length > 0) {
        const failedFileNames = failedUploads
          .map((result: any) => result.file_name)
          .join(", ");
        toast.error("Upload failed", {
          description: `Failed to upload: ${failedFileNames}`,
        });
      }

      if (successfulUploads.length > 0) {
        const newAssets = successfulUploads.map((result: any) => ({
          asset_id: result.asset_id,
          name: result.file_name,
          type: result.type,
          size: result.file_size,
        }));

        const updatedAssets = [...uploadedAssets, ...newAssets];
        setUploadedAssets(updatedAssets);

        // Update node data with assets array containing asset IDs
        setNodeData({
          ...nodeData,
          params: {
            ...nodeData.params,
            assets: updatedAssets.map((asset) => asset.asset_id),
          },
        });

        toast.success(
          `Successfully uploaded ${successfulUploads.length} file(s)`,
        );
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Upload failed", {
        description: "An error occurred while uploading files.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAsset = (assetId: string) => {
    const updatedAssets = uploadedAssets.filter(
      (asset) => asset.asset_id !== assetId,
    );
    setUploadedAssets(updatedAssets);

    // Update node data
    setNodeData({
      ...nodeData,
      params: {
        ...nodeData.params,
        assets: updatedAssets.map((asset) => asset.asset_id),
      },
    });
  };

  // Always call useDropzone hook (unconditionally) - must be before early return
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    maxFiles: 10,
    disabled: isUploading || !node || node.type !== "agent",
  });

  if (!node || !nodeData) {
    return null;
  }

  const handleChange = (key: string, value: string) => {
    setNodeData({
      ...nodeData,
      [key]: value,
    });
  };

  const handleRefreshAgent = async () => {
    setIsRefreshing(true);
    try {
      const response = await getAgents();
      if (response?.data) {
        setAgents(response.data);
        setFilteredAgentIds(response.data.map((agent: IAgent) => agent._id));
        toast.success("Agents refreshed successfully");
      }
    } catch (error) {
      console.error("Failed to refresh agents:", error);
      toast.error("Failed to refresh agents");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleParamChange = (paramKey: string, field: string, value: any) => {
    setNodeData({
      ...nodeData,
      params: {
        ...nodeData.params,
        [paramKey]: {
          ...(typeof nodeData.params[paramKey] === "object"
            ? nodeData.params[paramKey]
            : {}),
          [field]: value,
        },
      },
    });
  };

  const handleUserMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserMessage(value);

    // Update in node data
    setNodeData({
      ...nodeData,
      params: {
        ...nodeData.params,
        user_message: { value },
      },
    });
  };

  const handleStringParamChange = (paramKey: string, value: string) => {
    setNodeData({
      ...nodeData,
      params: {
        ...nodeData.params,
        [paramKey]: value,
      },
    });
  };

  // API configuration handlers
  const handleApiConfigChange = (field: "url" | "method", value: string) => {
    const updatedConfig = { ...apiConfig, [field]: value };
    setApiConfig(updatedConfig);
    updateApiNodeData(updatedConfig, queryParams, bodyParams);
  };

  const handleBodyParamChange = (paramKey: string, paramValue: string) => {
    const updatedBodyParams = { ...bodyParams };
    if (paramValue === "") {
      delete updatedBodyParams[paramKey];
    } else {
      updatedBodyParams[paramKey] = paramValue;
    }
    setBodyParams(updatedBodyParams);
    setBodyParamsString(JSON.stringify(updatedBodyParams, null, 2));
    updateApiNodeData(apiConfig, queryParams, updatedBodyParams);
  };

  const updateApiNodeData = (
    config: typeof apiConfig,
    queryParamsObj: Record<string, string>,
    bodyParamsObj: Record<string, string>,
  ) => {
    const params: any = {
      config: {
        url: config.url,
        method: config.method,
        headers: config.headers,
        body: bodyParamsObj,
      },
    };

    // Add query parameters with QUERY_ prefix
    Object.entries(queryParamsObj).forEach(([key, value]) => {
      params[`QUERY_${key}`] = value;
    });

    // Add body parameters
    // Object.entries(bodyParamsObj).forEach(([key, value]) => {
    //   params.config.body[key] = value;
    // });

    const updatedNodeData = {
      ...nodeData,
      params,
    };

    setNodeData(updatedNodeData);

    // Immediately save API configuration changes to parent component
    // if (node) {
    //   onUpdate(node.id, updatedNodeData);
    // }
  };

  const updateHeaderKey = (headerId: string, newKey: string) => {
    const updatedHeadersList = headersList.map((header) =>
      header.id === headerId ? { ...header, key: newKey } : header,
    );
    setHeadersList(updatedHeadersList);

    const updatedHeaders = updatedHeadersList.reduce(
      (acc, header) => {
        if (header.key && header.value) {
          acc[header.key] = header.value;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    const updatedConfig = { ...apiConfig, headers: updatedHeaders };
    setApiConfig(updatedConfig);
    updateApiNodeData(updatedConfig, queryParams, bodyParams);
  };

  const updateHeaderValue = (headerId: string, newValue: string) => {
    const updatedHeadersList = headersList.map((header) =>
      header.id === headerId ? { ...header, value: newValue } : header,
    );
    setHeadersList(updatedHeadersList);

    const updatedHeaders = updatedHeadersList.reduce(
      (acc, header) => {
        if (header.key && header.value) {
          acc[header.key] = header.value;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    const updatedConfig = { ...apiConfig, headers: updatedHeaders };
    setApiConfig(updatedConfig);
    updateApiNodeData(updatedConfig, queryParams, bodyParams);
  };

  const removeHeader = (headerId: string) => {
    const updatedHeadersList = headersList.filter(
      (header) => header.id !== headerId,
    );
    setHeadersList(updatedHeadersList);

    const updatedHeaders = updatedHeadersList.reduce(
      (acc, header) => {
        if (header.key && header.value) {
          acc[header.key] = header.value;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    const updatedConfig = { ...apiConfig, headers: updatedHeaders };
    setApiConfig(updatedConfig);
    updateApiNodeData(updatedConfig, queryParams, bodyParams);
  };

  const addApiHeader = () => {
    const newId = `header_${Date.now()}`;
    const newHeader = { id: newId, key: "", value: "" };
    const updatedHeadersList = [...headersList, newHeader];
    setHeadersList(updatedHeadersList);

    const updatedHeaders = updatedHeadersList.reduce(
      (acc, header) => {
        if (header.key && header.value) {
          acc[header.key] = header.value;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    const updatedConfig = { ...apiConfig, headers: updatedHeaders };
    setApiConfig(updatedConfig);
    updateApiNodeData(updatedConfig, queryParams, bodyParams);
  };

  const updateQueryParamKey = (paramId: string, newKey: string) => {
    const updatedQueryParamsList = queryParamsList.map((param) =>
      param.id === paramId ? { ...param, key: newKey } : param,
    );
    setQueryParamsList(updatedQueryParamsList);

    const updatedQueryParams = updatedQueryParamsList.reduce(
      (acc, param) => {
        if (param.key && param.value) {
          acc[param.key] = param.value;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    setQueryParams(updatedQueryParams);
    updateApiNodeData(apiConfig, updatedQueryParams, bodyParams);
  };

  const updateQueryParamValue = (paramId: string, newValue: string) => {
    const updatedQueryParamsList = queryParamsList.map((param) =>
      param.id === paramId ? { ...param, value: newValue } : param,
    );
    setQueryParamsList(updatedQueryParamsList);

    const updatedQueryParams = updatedQueryParamsList.reduce(
      (acc, param) => {
        if (param.key && param.value) {
          acc[param.key] = param.value;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    setQueryParams(updatedQueryParams);
    updateApiNodeData(apiConfig, updatedQueryParams, bodyParams);
  };

  const removeQueryParam = (paramId: string) => {
    const updatedQueryParamsList = queryParamsList.filter(
      (param) => param.id !== paramId,
    );
    setQueryParamsList(updatedQueryParamsList);

    const updatedQueryParams = updatedQueryParamsList.reduce(
      (acc, param) => {
        if (param.key && param.value) {
          acc[param.key] = param.value;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    setQueryParams(updatedQueryParams);
    updateApiNodeData(apiConfig, updatedQueryParams, bodyParams);
  };

  const addQueryParam = () => {
    const newId = `query_${Date.now()}`;
    const newParam = { id: newId, key: "", value: "" };
    const updatedQueryParamsList = [...queryParamsList, newParam];
    setQueryParamsList(updatedQueryParamsList);

    const updatedQueryParams = updatedQueryParamsList.reduce(
      (acc, param) => {
        if (param.key && param.value) {
          acc[param.key] = param.value;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    setQueryParams(updatedQueryParams);
    updateApiNodeData(apiConfig, updatedQueryParams, bodyParams);
  };

  const addBodyParam = () => {
    const newParamKey = `param_${Object.keys(bodyParams).length + 1}`;
    const updatedBodyParams = { ...bodyParams, [newParamKey]: "" };
    setBodyParams(updatedBodyParams);
    updateApiNodeData(apiConfig, queryParams, updatedBodyParams);
  };

  const addParam = () => {
    // Generate a unique param name
    let newParamKey = "";
    let counter = 1;

    // If this is an agent node and we're adding parameter after config
    if (
      node.type === "agent" &&
      Object.keys(nodeData.params).includes("config")
    ) {
      // Find agent nodes that could be connected to this one
      const agentNodes = nodes.filter(
        (n) =>
          n.type === "agent" &&
          n.id !== node.id &&
          !Object.keys(nodeData.params).includes(n.data.name),
      );

      if (agentNodes.length > 0) {
        // Suggest the first available agent node name as parameter key
        newParamKey = agentNodes[0].data.name;
      } else {
        newParamKey = `param_${Object.keys(nodeData.params).length + 1}`;
      }
    } else {
      // Default param name
      newParamKey = `param_${Object.keys(nodeData.params).length + 1}`;
    }

    // Ensure param name is unique
    while (Object.keys(nodeData.params).includes(newParamKey)) {
      newParamKey = `param_${counter++}`;
    }

    setNodeData({
      ...nodeData,
      params: {
        ...nodeData.params,
        [newParamKey]: "",
      },
    });
  };

  const removeParam = (paramKey: string) => {
    const newParams = { ...nodeData.params };
    delete newParams[paramKey];
    setNodeData({
      ...nodeData,
      params: newParams,
    });
  };

  const handleAgentSelection = (agentId: string) => {
    setSelectedAgentId(agentId);

    const selectedAgent = agents.find((agent) => agent._id === agentId);
    if (!selectedAgent) return;
    setSearchQuery(selectedAgent.name);
    setIsDropdownOpen(false);

    // Generate random UUIDs
    const { user_id, session_id } = getRandomIds();

    // Update node data with the selected agent - direct values, no "value" nesting
    const updatedNodeData = {
      ...nodeData,
      name: `agent_${selectedAgent.name.substring(0, 10).replace(/\s+/g, "_")?.toLowerCase()}`,
      tag: selectedAgent.name,
      params: {
        ...nodeData.params,
        config: {
          ...(typeof nodeData.params.config === "object"
            ? nodeData.params.config
            : {}),
          user_id,
          session_id,
          agent_id: selectedAgent._id,
          api_key: apiKey,
          api_url: `${import.meta.env.VITE_BASE_URL}/v3/inference/chat/`,
          agent_name: selectedAgent.name,
          // removed tool_info
        },
      },
    };

    // Keep the user message if it exists
    if (userMessage) {
      updatedNodeData.params.user_message = { value: userMessage };
    }

    // Keep the assets if they exist
    if (uploadedAssets.length > 0) {
      updatedNodeData.params.assets = uploadedAssets.map(
        (asset) => asset.asset_id,
      );
    }

    setNodeData(updatedNodeData);
  };

  const saveChanges = () => {
    // Collect file mapping for agent nodes with uploaded assets
    let fileMapping:
      | Record<string, { name: string; type: string; size: number }>
      | undefined = undefined;

    if (node?.type === "agent" && uploadedAssets.length > 0) {
      fileMapping = {};
      uploadedAssets.forEach((asset) => {
        fileMapping![asset.asset_id] = {
          name: asset.name,
          type: asset.type,
          size: asset.size,
        };
      });
    }

    onUpdate(node.id, nodeData, fileMapping);
    (onSaveAndClose ?? onClose)();
  };

  const isObjectParam = (param: any): param is ParamValue => {
    return typeof param === "object" && param !== null;
  };

  // Helper function to suggest agent nodes that could be connected to this one
  const getSuggestedAgentDependencies = () => {
    return nodes.filter(
      (n) =>
        n.type === "agent" &&
        n.id !== node.id &&
        !Object.keys(nodeData.params).includes(n.data.name),
    );
  };

  // Find the selected agent for tool display
  const selectedAgent = agents.find((agent) => agent._id === selectedAgentId);

  // Helper function to get agents connected to this API node
  const getConnectedAgents = () => {
    if (!node || node.type !== "api") return [];

    return edges
      .filter((edge) => edge.target === node.id)
      .map((edge) => nodes.find((n) => n.id === edge.source))
      .filter(
        (sourceNode): sourceNode is WorkflowNode =>
          sourceNode !== undefined && sourceNode.type === "agent",
      );
  };

  return (
    <div className="glass-panel flex max-h-[calc(100vh-120px)] w-96 flex-col overflow-hidden rounded-lg bg-white dark:bg-gray-800">
      <div className="relative flex items-center justify-between border-b px-6 py-4">
        <h3 className="text-lg font-semibold">Node Configuration</h3>

        {/* Toggle for agent and gpt_conditional nodes positioned in top right */}
        {/* {(node.type === "agent" || node.type === "gpt_conditional") && (
          <div className="absolute right-16 top-4">
            <ToggleGroup
              type="single"
              value={configMode}
              onValueChange={(value) => value && setConfigMode(value)}
              size="sm"
            >
              <ToggleGroupItem value="normal" className="text-xs">
                Simple
              </ToggleGroupItem>
              <ToggleGroupItem value="advanced" className="text-xs">
                Advanced
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        )} */}

        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {/* Normal mode - Only show agent selection and message input for agent nodes */}
        {node.type === "agent" && configMode === "normal" ? (
          <div className="space-y-4">
            <div>
              <Label>Selected Agent</Label>
              <div className="mt-2 grid grid-cols-1 gap-2">
                <div className="relative">
                  <div className="flex gap-2">
                    <Input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      placeholder="Search for an agent..."
                      className="bg-transparent"
                      onFocus={() => {
                        setIsDropdownOpen(true);
                        const allAgentIds = agents.map((a) => a._id);
                        setFilteredAgentIds(allAgentIds);
                      }}
                      onClick={() => {
                        setIsDropdownOpen(true);
                        if (filteredAgentIds.length === 0) {
                          setFilteredAgentIds(agents.map((a) => a._id));
                        }
                      }}
                      onChange={(e) => {
                        const searchTerm = e.target.value;
                        setSearchQuery(searchTerm);
                        setIsDropdownOpen(true);
                        const filtered = agents
                          .filter((a) =>
                            a.name?.toLowerCase().includes(searchTerm.toLowerCase()),
                          )
                          .map((a) => a._id);
                        setFilteredAgentIds(filtered);
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      className="bg-transparent py-4"
                      disabled={isRefreshing || isLoadingAgents}
                      onClick={handleRefreshAgent}
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing || isLoadingAgents ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                  {isDropdownOpen && (isLoadingAgents || filteredAgentIds.length > 0) && (
                    <div
                      ref={dropdownRef}
                      className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-auto rounded-md bg-popover py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    >
                      {isLoadingAgents ? (
                        <div className="px-4 py-3 text-center text-sm text-gray-500">
                          Loading agents...
                        </div>
                      ) : filteredAgentIds.length > 0 ? (
                        filteredAgentIds.map((agentId) => {
                          const agent = agents.find((a) => a._id === agentId);
                          if (!agent) return null;
                          return (
                            <div
                              key={agent._id}
                              className="flex cursor-pointer items-center px-4 py-2 text-sm hover:bg-sidebar-accent"
                              onClick={() => {
                                handleAgentSelection(agent._id);
                              }}
                            >
                              <div className="flex-1">
                                <div className="font-medium">{agent.name}</div>
                                <div className="line-clamp-2 text-xs text-gray-500">
                                  {agent.description}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-4 py-3 text-center text-sm text-gray-500">
                          No agents found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected agent details */}
              {selectedAgent && (
                <div className="mt-4 rounded-lg border border-input bg-transparent p-3">
                  <div className="flex items-start justify-between gap-5">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{selectedAgent.name}</div>
                      <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {selectedAgent.description}
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 flex-shrink-0 p-0"
                          asChild
                        >
                          <Link
                            to={`/agent-create/${selectedAgent._id}`}
                            target="_blank"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" sideOffset={5} className="z-[100]">
                        View Agent
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Display tool info if available */}
                  {selectedAgent.tools && selectedAgent.tools.length > 0 && (
                    <div className="mt-2 flex items-start gap-1.5">
                      <Wrench className="mt-0.5 h-3.5 w-3.5 text-gray-500" />
                      <div className="text-xs">
                        <div className="font-medium text-gray-600">Tools:</div>
                        <div className="text-gray-500">
                          {selectedAgent.tools
                            .map((tool: { name: string }) => tool.name)
                            .join(", ")}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="user-message">User Message</Label>
              <Input
                id="user-message"
                value={userMessage}
                onChange={handleUserMessageChange}
                placeholder="Enter message to send to agent..."
                className="mt-2"
              />
            </div>

            <div>
              <Label>File Attachments</Label>
              <div className="mt-2 space-y-3">
                {/* File upload dropzone */}
                <div
                  {...getRootProps()}
                  className={`cursor-pointer rounded-md border-2 border-dashed p-4 text-center transition-colors ${
                    isDragActive
                      ? "border-primary bg-primary/10"
                      : "border-gray-300 hover:border-gray-400"
                  } ${isUploading ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-2">
                    {isUploading ? (
                      <>
                        <Upload className="h-6 w-6 animate-bounce text-primary" />
                        <p className="text-sm text-gray-600">
                          Uploading files...
                        </p>
                      </>
                    ) : isDragActive ? (
                      <>
                        <Paperclip className="h-6 w-6 text-primary" />
                        <p className="text-sm text-gray-600">
                          Drop files here...
                        </p>
                      </>
                    ) : (
                      <>
                        <Paperclip className="h-6 w-6 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          Drag & drop files here, or click to select
                        </p>
                        <p className="text-xs text-gray-500">
                          Supports PDF, DOCX, JPG, PNG (max 10 files)
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Display uploaded files */}
                {uploadedAssets.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Uploaded Files:
                    </Label>
                    {uploadedAssets.map((asset) => (
                      <div
                        key={asset.asset_id}
                        className="flex items-center justify-between rounded-md border bg-gray-50 p-2"
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">{asset.name}</p>
                            <p className="text-xs text-gray-500">
                              {asset.type} • {(asset.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAsset(asset.asset_id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : node.type === "gpt_conditional" && configMode === "normal" ? (
          // Simple mode for GPT Conditional node - Only show condition field
          <div className="space-y-4">
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Input
                id="condition"
                value={nodeData.params?.condition || ""}
                onChange={(e) =>
                  handleStringParamChange("condition", e.target.value)
                }
                placeholder="Enter condition expression..."
                className="mt-2"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter a condition expression (e.g., "x {">"} 5") that evaluates
                to true or false.
              </p>
            </div>
          </div>
        ) : node.type === "a2a" && configMode === "normal" ? (
          // Simple mode for GPT Conditional node - Only show condition field
          <div className="space-y-4">
            <div>
              <Label htmlFor="base_url">Base URL</Label>
              <Input
                id="base_url"
                value={nodeData.params?.base_url || ""}
                onChange={(e) =>
                  handleStringParamChange("base_url", e.target.value)
                }
                placeholder="Enter base url..."
                className="mt-2"
              />
              <p className="mt-1 text-xs text-gray-500">
                Eg: https://example.com/api/v1
              </p>
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Input
                id="message"
                value={nodeData.params?.message || ""}
                onChange={(e) =>
                  handleStringParamChange("message", e.target.value)
                }
                placeholder="Enter message..."
                className="mt-2"
              />
              <p className="mt-1 text-xs text-gray-500">
                Eg: This agent converts math functions to code
              </p>
            </div>
          </div>
        ) : node.type === "api" ? (
          // API node configuration
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-medium">
              <Globe className="h-5 w-5" />
              <span>API Configuration</span>
            </div>

            {/* Show connected agents */}
            {(() => {
              const connectedAgents = getConnectedAgents();

              if (connectedAgents.length > 0) {
                return (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-900">
                            Connected Agents
                          </h4>
                          <p className="text-sm text-blue-700">
                            {connectedAgents.length} agent
                            {connectedAgents.length > 1 ? "s" : ""} connected to
                            this API node
                          </p>
                        </div>
                      </div>

                      {/* List connected agents (deduplicated) */}
                      <div className="mt-3 space-y-2">
                        {connectedAgents
                          .filter(
                            (agentNode, index, self) =>
                              // Deduplicate by node ID - only keep first occurrence of each unique agent
                              self.findIndex(
                                (agent) => agent.id === agentNode.id,
                              ) === index,
                          )
                          .map((agentNode) => (
                            <div
                              key={agentNode.id}
                              className="flex items-center justify-between rounded border bg-white p-2"
                            >
                              <div>
                                <div className="text-sm font-medium text-blue-900">
                                  {agentNode.data.tag}
                                </div>
                                <div className="text-xs text-blue-700">
                                  {agentNode.data.name}
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if ((window as any).openMappingModal) {
                                    (window as any).openMappingModal(
                                      agentNode,
                                      node,
                                    );
                                  } else {
                                    toast.error("Mapping modal not available");
                                  }
                                }}
                              >
                                <Wrench className="mr-1 h-4 w-4" />
                                Configure Mapping
                              </Button>
                            </div>
                          ))}
                      </div>

                      {/* Show overall configuration summary if it exists */}
                      {node.data.params?.config &&
                        typeof node.data.params.config === "object" &&
                        "default" in node.data.params.config && (
                          <div className="mt-3 border-t border-blue-200 pt-3">
                            <div className="space-y-1 text-xs text-blue-700">
                              {(node.data.params.config as any).default
                                ?.url && (
                                <div>
                                  <span className="font-medium">URL:</span>{" "}
                                  {(node.data.params.config as any).default.url}
                                </div>
                              )}
                              {(node.data.params.config as any).default
                                ?.method && (
                                <div>
                                  <span className="font-medium">Method:</span>{" "}
                                  {
                                    (node.data.params.config as any).default
                                      .method
                                  }
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                );
              }

              return (
                // Regular API node configuration
                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="text-center text-gray-600">
                      <Globe className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                      <p className="text-sm font-medium">No Agents Connected</p>
                      <p className="text-xs text-gray-500">
                        Connect agents to this API node to configure mappings
                      </p>
                    </div>
                  </div>

                  {/* Basic API Configuration */}
                  <div className="space-y-4 rounded-lg border p-4">
                    <h4 className="font-medium">Endpoint Configuration</h4>

                    <div>
                      <Label htmlFor="api-url">API URL</Label>
                      <Input
                        id="api-url"
                        value={apiConfig.url}
                        onChange={(e) =>
                          handleApiConfigChange("url", e.target.value)
                        }
                        placeholder="https://api.example.com/v1/endpoint"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="api-method">HTTP Method</Label>
                      <Select
                        value={apiConfig.method}
                        onValueChange={(value) =>
                          handleApiConfigChange("method", value)
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select HTTP method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                          <SelectItem value="PATCH">PATCH</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Headers */}
                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Headers</h4>
                      <Button variant="ghost" size="sm" onClick={addApiHeader}>
                        <Plus className="mr-1 h-4 w-4" />
                        Add Header
                      </Button>
                    </div>

                    {headersList.length > 0 ? (
                      <div className="space-y-2">
                        {headersList.map((header) => (
                          <div key={header.id} className="flex gap-2">
                            <Input
                              placeholder="Header name"
                              value={header.key}
                              onChange={(e) =>
                                updateHeaderKey(header.id, e.target.value)
                              }
                              className="flex-1"
                            />
                            <Input
                              placeholder="Header value"
                              value={header.value}
                              onChange={(e) =>
                                updateHeaderValue(header.id, e.target.value)
                              }
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeHeader(header.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-sm text-gray-500">
                        No headers configured
                      </div>
                    )}
                  </div>

                  {/* Query Parameters */}
                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Query Parameters</h4>
                      <Button variant="ghost" size="sm" onClick={addQueryParam}>
                        <Plus className="mr-1 h-4 w-4" />
                        Add Query Param
                      </Button>
                    </div>

                    {queryParamsList.length > 0 ? (
                      <div className="space-y-2">
                        {queryParamsList.map((param) => (
                          <div key={param.id} className="flex gap-2">
                            <Input
                              placeholder="Parameter name"
                              value={param.key}
                              onChange={(e) =>
                                updateQueryParamKey(param.id, e.target.value)
                              }
                              className="flex-1"
                            />
                            <Input
                              placeholder="Parameter value"
                              value={param.value}
                              onChange={(e) =>
                                updateQueryParamValue(param.id, e.target.value)
                              }
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQueryParam(param.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-sm text-gray-500">
                        No query parameters configured
                      </div>
                    )}
                  </div>

                  {/* Body Parameters (for POST/PUT/PATCH) */}
                  {["POST", "PUT", "PATCH"].includes(apiConfig.method) && (
                    <div className="space-y-4 rounded-lg border p-4">
                      <Tabs defaultValue="param" className="w-full">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Body Parameters</h4>
                          <TabsList className="h-6 rounded-md">
                            <TabsTrigger
                              value="param"
                              className="h-full rounded-sm text-xs"
                            >
                              Param
                            </TabsTrigger>
                            <TabsTrigger
                              value="json"
                              className="h-full rounded-sm text-xs"
                            >
                              JSON
                            </TabsTrigger>
                          </TabsList>
                        </div>

                        <TabsContent value="param" className="space-y-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={addBodyParam}
                          >
                            <Plus className="mr-1 h-4 w-4" />
                            Add Body Param
                          </Button>
                          {Object.keys(bodyParams).length > 0 ? (
                            <div className="space-y-2">
                              {Object.entries(bodyParams).map(
                                ([key, value]) => (
                                  <div key={key} className="flex gap-2">
                                    <Input
                                      ref={inputRef}
                                      placeholder="Parameter name"
                                      value={key}
                                      onChange={(e) => {
                                        const newBodyParams = { ...bodyParams };
                                        const cursorPosition =
                                          e.target.selectionStart;
                                        delete newBodyParams[key];
                                        newBodyParams[e.target.value] = value;
                                        setBodyParams(newBodyParams);
                                        setBodyParamsString(
                                          JSON.stringify(
                                            newBodyParams,
                                            null,
                                            2,
                                          ),
                                        );
                                        updateApiNodeData(
                                          apiConfig,
                                          queryParams,
                                          newBodyParams,
                                        );

                                        requestAnimationFrame(() => {
                                          if (inputRef.current) {
                                            inputRef.current.focus();
                                            inputRef.current.setSelectionRange(
                                              cursorPosition,
                                              cursorPosition,
                                            );
                                          }
                                        });
                                      }}
                                      className="flex-1"
                                    />
                                    <Input
                                      placeholder="Parameter value"
                                      value={value}
                                      onChange={(e) =>
                                        handleBodyParamChange(
                                          key,
                                          e.target.value,
                                        )
                                      }
                                      className="flex-1"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleBodyParamChange(key, "")
                                      }
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ),
                              )}
                            </div>
                          ) : (
                            <div className="py-4 text-center text-sm text-gray-500">
                              No body parameters configured
                            </div>
                          )}
                        </TabsContent>
                        <TabsContent value="json">
                          <Textarea
                            rows={8}
                            value={bodyParamsString}
                            onChange={(e) => {
                              setBodyParamsString(e.target.value);
                              setBodyParams(JSON.parse(e.target.value));
                              updateApiNodeData(
                                apiConfig,
                                queryParams,
                                JSON.parse(e.target.value),
                              );
                            }}
                          />
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          // Advanced mode for other nodes - Show all configuration options
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Node Name (Unique Identifier)</Label>
              <Input
                id="name"
                value={nodeData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="tag">Human-Readable Name</Label>
              <Input
                id="tag"
                value={nodeData.tag}
                onChange={(e) => handleChange("tag", e.target.value)}
                className="mt-2"
              />
            </div>

            {node.type === "agent" && (
              <div>
                <Label>Agent</Label>
                <Select
                  value={selectedAgentId}
                  onValueChange={handleAgentSelection}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingAgents ? (
                      <div className="p-2 text-center text-sm text-gray-500">
                        Loading agents...
                      </div>
                    ) : agents.length > 0 ? (
                      agents.map((agent) => (
                        <SelectItem key={agent._id} value={agent._id}>
                          {agent.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-gray-500">
                        No agents found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="function">Function Name</Label>
              <Input
                id="function"
                value={nodeData.function}
                onChange={(e) => handleChange("function", e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Parameters</Label>
                <Button variant="ghost" size="sm" onClick={addParam}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </div>

              <div className="mt-2 space-y-4">
                {Object.entries(nodeData.params).map(([key, value]) => (
                  <div key={key} className="rounded-md border border-input p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <Label className="text-sm font-medium">{key}</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeParam(key)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {isObjectParam(value) ? (
                      <div className="mt-2 space-y-2 border-t pt-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1">
                            <Label className="text-xs text-gray-500">
                              Type
                            </Label>
                            <Select
                              value={
                                value.depends
                                  ? "depends"
                                  : value.input
                                    ? "input"
                                    : "value"
                              }
                              onValueChange={(type) => {
                                // Create a new param value based on the selected type
                                let newValue: ParamValue = {};

                                // Keep existing value if possible
                                if (type === "value" && value.value) {
                                  newValue.value = value.value;
                                } else if (type === "input" && value.input) {
                                  newValue.input = value.input;
                                } else if (
                                  type === "depends" &&
                                  value.depends
                                ) {
                                  newValue.depends = value.depends;
                                }
                                // Otherwise set defaults
                                else if (type === "value") {
                                  newValue.value = "";
                                } else if (type === "input") {
                                  newValue.input = "";
                                } else if (type === "depends") {
                                  // Default to first available agent if possible
                                  const suggestedAgents =
                                    getSuggestedAgentDependencies();
                                  newValue.depends =
                                    suggestedAgents.length > 0
                                      ? suggestedAgents[0].data.name
                                      : "";
                                }

                                // Update the parameter
                                setNodeData({
                                  ...nodeData,
                                  params: {
                                    ...nodeData.params,
                                    [key]: newValue,
                                  },
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="value">
                                  Static Value
                                </SelectItem>
                                <SelectItem value="input">
                                  Input Reference
                                </SelectItem>
                                {node.type === "agent" && (
                                  <SelectItem value="depends">
                                    Agent Dependency
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex-1">
                            {value.depends ? (
                              <div>
                                <Label className="text-xs text-gray-500">
                                  Depends On
                                </Label>
                                <Select
                                  value={value.depends}
                                  onValueChange={(val) =>
                                    handleParamChange(key, "depends", val)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select agent" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {/* Show all available agents */}
                                    {nodes
                                      .filter(
                                        (n) =>
                                          n.type === "agent" &&
                                          n.id !== node.id,
                                      )
                                      .map((agentNode) => (
                                        <SelectItem
                                          key={agentNode.id}
                                          value={agentNode.data.name}
                                        >
                                          {agentNode.data.tag}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : value.input ? (
                              <div>
                                <Label className="text-xs text-gray-500">
                                  Input Reference
                                </Label>
                                <Input
                                  value={value.input}
                                  onChange={(e) =>
                                    handleParamChange(
                                      key,
                                      "input",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Reference to input"
                                />
                              </div>
                            ) : (
                              <div>
                                <Label className="text-xs text-gray-500">
                                  Value
                                </Label>
                                <Input
                                  value={value.value || ""}
                                  onChange={(e) =>
                                    handleParamChange(
                                      key,
                                      "value",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Enter value"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Input
                        value={value as string}
                        onChange={(e) =>
                          handleStringParamChange(key, e.target.value)
                        }
                        placeholder="Parameter value"
                      />
                    )}
                  </div>
                ))}

                {Object.keys(nodeData.params).length === 0 && (
                  <div className="rounded-md border border-dashed py-4 text-center text-gray-500">
                    <p>No parameters added yet</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={addParam}
                      className="mt-2"
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add Parameter
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t px-6 py-4">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (confirm("Are you sure you want to delete this node?")) {
              onDelete(node.id);
            }
          }}
        >
          <Trash2 className="mr-1 h-4 w-4" />
          Delete
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          {/* Hide Save Changes button if this is an API node with connected agents (Configure Mapping buttons visible) */}
          {!(node.type === "api" && getConnectedAgents().length > 0) && (
            <Button size="sm" onClick={saveChanges}>
              Save Changes
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodeConfig;
