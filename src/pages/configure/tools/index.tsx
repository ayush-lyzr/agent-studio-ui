import { useState, useEffect, useCallback, useMemo } from "react";
import mixpanel from "mixpanel-browser";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Search,
  XCircle,
  RefreshCw,
  Plus,
  Trash2,
  CheckSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ToolCard } from "./tool-card";
import { CustomToolDialog } from "./CustomToolDialog";
import useStore from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { useTools } from "./tools-service";
import { PageTitle } from "@/components/ui/page-title";
import { BASE_URL, isMixpanelActive } from "@/lib/constants";
import { ToolDialog } from "./tool-dialog";
import { ToolForm } from "@/lib/types";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { Link } from "react-router-dom";
import EditToolDialog from "./tool-edit-dialog";
import { toast } from "sonner";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { UpgradePlan } from "@/components/custom/upgrade-plan";
import { FilterToggle } from "@/components/custom/filter-toggle";
import { MCPServerDialog } from "./mcp-server-dialog";
import { ConfirmDialog } from "@/components/custom/confirm-dialog";
import { MCPToolDialog } from "./mcp-tool-dialog";
import { Separator } from "@/components/ui/separator";
import { ApiKeyDialog } from "./api-key-dialog";
import { MyToolsList, type ConnectedAccountParams } from "./my-tools-list";
// import { MCPToolDialog } from "./mcp-tool-dialog";

// interface FormProperty {
//   type: string;
//   description?: string;
// }

// interface ToolResponse {
//   _id: string;
//   key: string;
//   provider_id: string;
//   type: string;
//   description: string;
//   form: {
//     type: string;
//     properties: Record<string, FormProperty>;
//     required: string[];
//   };
//   meta_data: {
//     schema: {
//       info: {
//         title: string;
//         description: string;
//       };
//     };
//   };
// }

// interface ToolMapItem {
//   key: string;
//   name: string;
//   icon: JSX.Element | null;
//   description: string;
//   providerId: string;
//   configFields: Record<string, z.ZodString>;
//   logo?: string;
//   categories?: string[];
//   appId?: string;
//   isGlobalTool?: boolean;
// }

interface Provider {
  _id: string;
  provider_id: string;
  id?: string;
  name?: string;
  display_name?: string;
  description?: string;
  logo?: string;
  categories?: string[];
  functions?: any[];
  security_schemes?: string[];
  form?: {
    [key: string]: {
      value: string;
      type: string;
      description: string;
      display_name: string;
      required: boolean;
      expected_from_customer: boolean;
    };
  };
  meta_data: {
    actions?: object;
    categories: string[];
    description: string;
    logo: string;
    app_id?: string;
  };
  type: string;
  tool_source: string;
  owner_id?: string;
  provider_source?: string;
  custom_app?: boolean;
  auth_type?: string;
}

// interface OpenAPITool {
//   tool_id: string;
//   openapi_config: {
//     base_url: string;
//     default_headers: Record<string, string>;
//     default_query_params: Record<string, string>;
//     default_body_params: Record<string, any>;
//     endpoint_defaults: Record<string, any>;
//     enhanced_descriptions: boolean;
//   };
//   schema: {
//     info: {
//       title: string;
//       description: string;
//       version: string;
//     };
//     paths: Record<
//       string,
//       {
//         get?: {
//           summary: string;
//           description: string;
//         };
//         post?: {
//           summary: string;
//           description: string;
//         };
//       }
//     >;
//   };
//   tool: {
//     name: string;
//     description: string;
//   };
// }
// type TabFilterType = "all" | "configured" | "ready-to-use" | "custom";
type TabFilterType = "tools" | "mcp";

const ToolSkeleton = () => (
  <div className="space-y-3 rounded-lg border p-4">
    <div className="flex items-center space-x-2">
      <Skeleton className="h-8 w-8 rounded" />
      <Skeleton className="h-6 w-[120px]" />
    </div>
    <Skeleton className="h-4 w-[250px]" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-4 w-[170px]" />
    </div>
  </div>
);

if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
  mixpanel.track("Tools page visited");

interface ToolConnection {
  app_id?: string;
  tool_id?: string;
  tool_name: string;
  tool_source?: string;
  id: string;
  connectedAccounts?: ConnectedAccountParams[];
}

export default function Tools() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openDialog, setOpenDialog] = useState(false);
  const apiKey = useStore((state) => state.api_key);
  const {
    getOpenAPITool,
    updateOpenAPITool,
    isGettingOpenAPITool,
    isUpdatingOpenAPITool,
    getMCPServers,
    getMCPServersActions,
    deleteMultiCustomTools,
    isDeletingMultiCustomTools,
    getDefaultMCPTools,
    defaultMCPTools,
    userConnectedAccounts,
    getUserConnectedAccounts,
  } = useTools({
    apiKey,
  });
  const [toolDialog, setToolDialog] = useState(false);
  const [selectedTool, setSelectedTool] = useState<{
    name: string;
    description: string;
    providerId: string;
    categories: string[];
    form: ToolForm;
    toolSource?: string;
    connectionId?: string;
    securityScheme?: string[];
    customACIApp?: boolean;
    appId?: string;
    isMCPTool?: boolean;
    authTypeMCP?: string;
    isMCPConnected?: boolean;
    toolId?: string;
    customToolId?: string;
  } | null>(null);
  const [editToolDialog, setEditToolDialog] = useState(false);
  const [toolData, setToolData] = useState<any>(null);
  const [openApiConfig, setOpenApiConfig] = useState("");
  const [toolDetails, setToolDetails] = useState("");
  const [editingTool, setEditingTool] = useState<{
    name: string;
    providerId: string;
  } | null>(null);
  const [showUpgradePricing, setShowUpgradePricing] = useState(false);
  const [tabFilter, setTabFilter] = useState<TabFilterType>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.size === 0 || urlParams.has("connectedAccountId")
      ? "tools"
      : "mcp";
  });
  const [showAddMCPDialog, setShowAddMCPDialog] = useState(false);
  const [mcpServers, setMcpServers] = useState<any[]>([]);
  const [mcpToolActions, setMcpToolActions] = useState<any[]>([]);
  const [isLoadingMcpActions, setIsLoadingMcpActions] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
  const [isBulkDeletingTools, setIsBulkDeletingTools] = useState(false);
  const [isDeletingTools, setIsDeletingTools] = useState(false);
  const [showMCPToolDialog, setShowMCPToolDialog] = useState(false);
  const [selectedLyzrMCPTool, setSelectedLyzrMCPTool] = useState<{
    name?: string;
    description?: string;
    serverUrl?: string;
    authTypeMCP?: string;
    providerId?: string;
    serverType?: string;
    standardServerId?: string;
  } | null>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  const {
    data: userTools = [],
    refetch: refetchUserTools,
    isFetching: isLoadingUserTools,
  } = useQuery({
    queryKey: ["userTools", apiKey],
    queryFn: async () => {
      const response = await axios.get<ToolConnection[]>(
        `${BASE_URL}/v3/tools/all/user`,
        {
          headers: {
            accept: "application/json",
            "x-api-key": apiKey,
          },
        },
      );
      return response.data || [];
    },
    enabled: !!apiKey,
    refetchOnWindowFocus: false,
  });

  // const {
  //   data: apiTools = [],
  //   refetch: refetchApiTools,
  //   isFetching: isLoadingApiTools,
  // } = useQuery({
  //   queryKey: ["apiTools", apiKey],
  //   queryFn: async () => {
  //     const response = await getTools();
  //     return response?.data || [];
  //   },
  //   enabled: !!apiKey,
  //   refetchOnWindowFocus: false,
  // });

  const {
    data: providers = [],
    refetch: refetchProviders,
    isFetching: isLoadingProviders,
  } = useQuery({
    queryKey: ["providers", apiKey],
    queryFn: async () => {
      const response = await axios.get<Provider[]>(
        `${BASE_URL}/v3/providers/tools/all`,
        {
          headers: {
            accept: "application/json",
            "x-api-key": apiKey,
          },
        },
      );
      return response.data || [];
    },
    enabled: !!apiKey,
    refetchOnWindowFocus: false,
  });

  // const {
  //   data: openApiTools = [],
  //   refetch: refetchOpenApiTools,
  //   isFetching: isLoadingOpenApiTools,
  // } = useQuery({
  //   queryKey: ["openApiTools", apiKey],
  //   queryFn: async () => {
  //     const response = await axios.get<{ tools: OpenAPITool[] }>(
  //       `${BASE_URL}/v3/tools/`,
  //       {
  //         headers: {
  //           accept: "application/json",
  //           "x-api-key": apiKey,
  //         },
  //       },
  //     );
  //     return response.data.tools || [];
  //   },
  //   enabled: !!apiKey,
  //   refetchOnWindowFocus: false,
  // });

  const processedToolName = (name: string) => {
    return name
      .replace(/^Openapi-/i, "")
      .replace(/^./, (str: string) => str.toUpperCase());
  };

  const formatName = (name: string) =>
    name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const customToolMatch = useMemo((): ToolConnection[] => {
    const accounts = Array.isArray(userConnectedAccounts)
      ? userConnectedAccounts
      : [];
    return userTools.map((tool) => {
      const connectedAccounts = accounts.filter(
        (acc: ConnectedAccountParams) => acc.provider_id === tool.tool_id,
      );
      return {
        ...tool,
        connectedAccounts:
          connectedAccounts.length > 0 ? connectedAccounts : undefined,
      };
    });
  }, [userTools, userConnectedAccounts]);

  const isToolConnected = (tool: any) => {
    if (!tool) return false;
    if (tool.toolSource === "aci") {
      // const isConnectedViaUserTools = userTools.some(
      //   (ut) => ut.app_id === tool.appId || ut.tool_name === tool.name,
      // );
      const isConnectedViaAccounts = userConnectedAccounts?.some(
        (uc: any) => uc.provider_uuid === tool.toolId,
      );
      return isConnectedViaAccounts;
    } else {
      // const userToolConnection = userTools.some(
      //   (ut) => ut.tool_name === tool.providerId,
      // );
      const userAccountConnection = userConnectedAccounts?.some(
        (uc: any) => uc.provider_uuid === tool.toolId,
      );
      return userAccountConnection;
    }
  };

  const findProviderForTool = (tool: any) => {
    if (!tool) return null;

    return [...providers, ...(defaultMCPTools?.data?.servers || [])].find(
      (p) => {
        if (p.tool_source === "aci") {
          return (
            p.name === tool.providerId || p.provider_id === tool.providerId
          );
        } else {
          return p.provider_id === tool.providerId || p.id === tool.providerId;
        }
      },
    );
  };

  const getConnectionIdForTool = (tool: any) => {
    if (!tool) return undefined;

    if (tool.toolSource === "aci") {
      const connectionByAppId = userTools.find(
        (ut) => ut.app_id === tool.appId,
      );
      if (connectionByAppId) {
        return connectionByAppId.id || connectionByAppId.tool_id;
      }

      // const connectionByName = userTools.find(
      //   (ut) => ut.tool_name === tool.providerId || ut.tool_name === tool.name,
      // );
      // return connectionByName?.id || connectionByName?.tool_id;
    } else {
      const connectionByName = userTools.find(
        (ut) => ut.tool_name === tool.providerId,
      );
      return connectionByName?.id || connectionByName?.tool_id;
    }
  };

  const handleEditTool = async (toolData: {
    name: string;
    providerId: string;
  }) => {
    setEditingTool(toolData);
    setOpenApiConfig("");
    setToolDetails("");
    setEditToolDialog(true);

    if (toolData.providerId) {
      try {
        const response = await getOpenAPITool({
          providerId: toolData.providerId,
          apiKey: apiKey,
        });
        setToolData(response.data);
      } catch (error) {
        console.error("Error fetching tool data:", error);
        toast.error("Error loading tool data");
      }
    }
  };

  const fetchMCPServers = useCallback(async () => {
    if (!apiKey) return;
    try {
      const response = await getMCPServers();
      if (response?.data?.servers) {
        setMcpServers(response.data.servers);
      }
    } catch (error) {
      console.error("Error fetching MCP servers:", error);
    }
  }, [apiKey, getMCPServers]);

  useEffect(() => {
    if (apiKey) {
      fetchMCPServers();
      getDefaultMCPTools();
    }
  }, [apiKey, fetchMCPServers]);

  useEffect(() => {
    if (apiKey) {
      getUserConnectedAccounts();
    }
  }, [apiKey, getUserConnectedAccounts]);

  useEffect(() => {
    if (toolData) {
      if (toolData.openapi_config) {
        setOpenApiConfig(JSON.stringify(toolData.openapi_config, null, 2));
      }
      if (toolData.tool) {
        const processedName = processedToolName(toolData.tool.name);
        toolData.tool.name = processedName;
        setToolDetails(JSON.stringify(toolData.tool, null, 2));
      }
    }
  }, [toolData]);

  useEffect(() => {
    const fetchMcpActions = async () => {
      if (
        !toolDialog ||
        !selectedTool?.isMCPTool ||
        !selectedTool?.providerId ||
        selectedTool?.isMCPConnected !== true
      ) {
        setMcpToolActions([]);
        setIsLoadingMcpActions(false);
        return;
      }

      setIsLoadingMcpActions(true);
      try {
        const response = await getMCPServersActions(selectedTool.providerId);
        const tools = response?.data?.tools ?? [];
        setMcpToolActions(Array.isArray(tools) ? tools : []);
      } catch (error) {
        console.error("Error fetching MCP tools:", error);
        setMcpToolActions([]);
      } finally {
        setIsLoadingMcpActions(false);
      }
    };

    fetchMcpActions();
  }, [
    getMCPServersActions,
    toolDialog,
    selectedTool?.providerId,
    selectedTool?.isMCPTool,
    selectedTool?.isMCPConnected,
  ]);

  const handleConfirmEdit = async () => {
    try {
      await updateOpenAPITool({
        providerId: editingTool?.providerId!,
        enabled: true,
        openapi_config: JSON.parse(openApiConfig),
        tool: JSON.parse(toolDetails),
      });
      toast.success("Tool updated successfully");
      setEditToolDialog(false);
      refreshAll();
    } catch (error) {
      toast.error("Error updating tool");
      setEditToolDialog(false);
    }
  };

  const selectedProvider = providers.find((p) => {
    if (!selectedTool?.providerId) return false;

    if (p.tool_source === "aci") {
      return (
        p.name === selectedTool.providerId ||
        p.provider_id === selectedTool.providerId
      );
    } else {
      return p.provider_id === selectedTool.providerId;
    }
  });

  const userToolConnection = userTools.find((ut) => {
    if (!selectedTool?.providerId) return false;

    if (selectedTool.toolSource === "aci") {
      return (
        ut.app_id === selectedTool.appId || ut.tool_name === selectedTool.name
      );
    } else {
      return ut.tool_name === selectedTool.providerId;
    }
  });

  const toolActions = selectedProvider?.meta_data?.actions
    ? selectedProvider?.meta_data?.actions
    : selectedProvider?.functions;
  const isUserTool = Boolean(userToolConnection);

  const isLoading =
    isLoadingUserTools ||
    // isLoadingApiTools ||
    isLoadingProviders;
  // isLoadingOpenApiTools;

  const refreshAll = async () => {
    if (!apiKey) return;

    try {
      await Promise.all([
        refetchUserTools(),
        getUserConnectedAccounts(),
        // refetchApiTools(),
        refetchProviders(),
        fetchMCPServers(),
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  const handleCardClick = (toolData: any) => {
    setSelectedTool(toolData);
    setToolDialog(true);
  };

  const allTools = (() => {
    const toolsMap = new Map();

    // apiTools.forEach((tool: ToolResponse) => {
    //   if (tool?.provider_id) {
    //     toolsMap.set(tool.provider_id, {
    //       key: tool.provider_id,
    //       name: tool.meta_data?.schema?.info?.title || tool.provider_id,
    //       icon: <Wrench className="size-4" />,
    //       description:
    //         tool.meta_data?.schema?.info?.description || tool.description || "",
    //       providerId: tool.provider_id,
    //       configFields: Object.entries(tool.form?.properties || {}).reduce<
    //         Record<string, z.ZodString>
    //       >(
    //         (acc, [key, value]) => ({
    //           ...acc,
    //           [key]: z
    //             .string()
    //             .min(1, value?.description || `${key} is required`),
    //         }),
    //         {},
    //       ),
    //     } as ToolMapItem);
    //   }
    // });

    providers.forEach((provider) => {
      if (
        provider.owner_id !== "lyzr" &&
        provider.provider_source !== "openapi"
      ) {
        toolsMap.set(provider._id, {
          key: provider._id,
          providerId: provider.provider_id,
          name: provider.provider_id,
          securityScheme: provider?.auth_type,
          description: provider?.meta_data?.description,
          appId: provider?.meta_data?.app_id,
          categories: ["Custom ACI"],
          customACIApp: true,
          toolSource: provider?.provider_source,
          toolId: provider._id,
        });
      } else if (provider.provider_source === "aci") {
        toolsMap.set(provider.provider_id, {
          key: provider.provider_id,
          name: provider?.name || provider?.provider_id,
          icon: null,
          description: provider?.meta_data?.description || "",
          providerId: provider.name || provider.provider_id,
          logo: provider?.logo || null,
          categories: ["Open-Source"],
          appId: provider?.meta_data?.app_id,
          toolSource: provider?.provider_source,
          isGlobalTool: true,
          securityScheme: provider?.auth_type,
          customACIApp: provider?.custom_app,
          toolId: provider._id,
        });
      }
      // Keeping empty to filter out custom tools
      else if (provider.provider_source === "openapi") {
      } else {
        toolsMap.set(provider.provider_id, {
          key: provider.provider_id,
          name: provider?.name || provider.provider_id,
          icon: null,
          description: provider.meta_data?.description || "",
          providerId: provider.name || provider.provider_id,
          configFields: provider.form
            ? Object.entries(provider.form).reduce(
                (acc, [key, field]) => ({
                  ...acc,
                  [key]: z
                    .string()
                    .min(1, field?.description || `${key} is required`),
                }),
                {},
              )
            : {},
          logo: provider.meta_data?.logo || null,
          categories: ["Composio"],
          // categories: provider.meta_data?.categories || [],
          securityScheme: provider?.auth_type,
          appId: provider.meta_data?.app_id,
          toolSource: provider?.provider_source,
          isGlobalTool: true,
          toolId: provider._id,
        });
      }
    });

    mcpServers.forEach((server) => {
      toolsMap.set(server.id, {
        key: server.id,
        name: server.name,
        icon: null,
        description: server.description,
        providerId: server.id,
        categories: server.server_type === "lyzr_mcp" ? ["Avanade Mcp"] : ["MCP"],
        has_active_token: server.has_active_token ?? null,
        isMCPTool: true,
        authTypeMCP: server.auth_type,
      });
    });

    // openApiTools.forEach((tool) => {
    //   const toolId = providers.find((p) => p.provider_id === tool.tool_id)?._id;
    //   const processedName = processedToolName(tool.tool.name);
    //   toolsMap.set(tool.tool_id, {
    //     key: tool.tool_id,
    //     name: processedName,
    //     icon: <Wrench className="size-4" />,
    //     description: tool.tool.description || "",
    //     providerId: tool.tool_id,
    //     configFields: {},
    //     categories: ["Custom"],
    //     isGlobalTool: false,
    //     customToolId: toolId,
    //   });
    // });

    defaultMCPTools?.data?.servers?.forEach((server: any) => {
      toolsMap.set(server.id, {
        key: server.id,
        name: server.name,
        icon: null,
        serverUrl: server.server_url,
        description: server.description,
        providerId: server.id,
        authTypeMCP: server.auth_type,
        categories: ["Avanade Mcp"],
      });
    });

    return Array.from(toolsMap.values());
  })();

  const handleDeleteMultiCustomTools = async () => {
    if (selectedToolIds.length === 0) return;
    setIsDeletingTools(true);

    const providerUuids = selectedToolIds.map((id) => {
      const fromUserTool = customToolMatch.find((t) => t.tool_id === id);
      return fromUserTool?.connectedAccounts?.[0]?.credential_id ?? id;
    });

    try {
      await deleteMultiCustomTools({ credential_ids: providerUuids });
      toast.success(
        selectedToolIds.length === 1
          ? "Tool deleted successfully"
          : `${selectedToolIds.length} tools deleted successfully`,
      );
      setIsBulkDeletingTools(false);
      setSelectedToolIds([]);
      setIsSelectionMode(false);
      await refreshAll();
    } catch (error) {
      console.error("Error deleting multiple custom tools:", error);
      setIsDeletingTools(false);
    }
  };

  const enterSelectionMode = (toolId?: string) => {
    setIsSelectionMode(true);
    if (toolId) {
      setSelectedToolIds((prev) =>
        prev.includes(toolId) ? prev : [...prev, toolId],
      );
    }
  };

  // @ts-ignore
  const cancelSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedToolIds([]);
  };

  const toggleToolSelection = (toolId: string) => {
    setSelectedToolIds((prev) => {
      const isAlreadySelected = prev.includes(toolId);
      if (isAlreadySelected) {
        const updated = prev.filter((id) => id !== toolId);
        return updated;
      }
      return [...prev, toolId];
    });
  };

  const filteredTools = allTools
    .filter(
      (tool) =>
        tool.name?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
        tool.description?.toLowerCase().includes(searchQuery?.toLowerCase()),
    )
    .sort((a, b) => {
      const aIsUserTool = userTools.some((ut) => ut.tool_name === a.providerId);
      const bIsUserTool = userTools.some((ut) => ut.tool_name === b.providerId);
      if (aIsUserTool && !bIsUserTool) return -1;
      if (!aIsUserTool && bIsUserTool) return 1;
      return 0;
    });

  const { connectedTools, unconnectedTools } = (() => {
    const connected: typeof filteredTools = [];
    const unconnected: typeof filteredTools = [];

    filteredTools.forEach((tool) => {
      const isMCPConnected =
        (tool.categories?.includes("MCP") ||
          tool.categories?.includes("Avanade Mcp")) &&
        (tool.has_active_token === true || tool.has_active_token === null);

      if (isToolConnected(tool) || isMCPConnected) {
        connected.push(tool);
      } else {
        unconnected.push(tool);
      }
    });

    return { connectedTools: connected, unconnectedTools: unconnected };
  })();

  const {
    customTools,
    externalTools,
    aciTools,
    mcpServer,
    defaultLyzrMCPTools,
  } = (() => {
    const custom: typeof unconnectedTools = [];
    const external: typeof unconnectedTools = [];
    const aci: typeof unconnectedTools = [];
    const mcp: typeof unconnectedTools = [];
    const defaultMCP: typeof unconnectedTools = [];

    unconnectedTools.forEach((tool) => {
      // Not adding custom tool into the list
      // if (tool.categories?.includes("Custom")) {
      //   custom.push(tool);
      // } else
      if (tool.categories?.includes("Avanade Mcp")) {
        defaultMCP.push(tool);
      } else if (tool.toolSource === "aci") {
        aci.push(tool);
      } else if (tool.categories?.includes("MCP")) {
        mcp.push(tool);
      } else if (tool.toolSource === "openapi") {
        // Skip openapi tools as we don't want to show in providers
      } else {
        external.push(tool);
      }
    });

    return {
      customTools: custom,
      externalTools: external,
      aciTools: aci,
      mcpServer: mcp,
      defaultLyzrMCPTools: defaultMCP,
    };
  })();

  const availableMCPServers = (() => {
    if (!mcpServers || mcpServers.length === 0) return [];

    return mcpServers.filter((server: any) => {
      // Check if this server is already connected
      const isConnected =
        server.has_active_token === true || server.has_active_token === null;

      return !isConnected;
    });
  })();

  const handleAddTool = () => {
    if (isLimitReached) {
      setShowUpgradePricing(true);
    } else {
      setOpenDialog(true);
    }
  };

  const userToolsCount = userTools.length;
  const mcpServerCount = mcpServers.length;
  const totalToolsCount = userToolsCount + mcpServerCount;
  const { isLimitReached, remainingSlots } = usePlanLimits(
    totalToolsCount,
    "TOOL_LIMIT",
  );

  // Helper function to check if a tool is MCP
  const isMCPTool = (tool: any) => {
    return (
      tool.categories?.includes("MCP") ||
      tool.categories?.includes("Avanade Mcp") ||
      tool.isMCPTool === true
    );
  };

  const { regularTools, mcpToolsList } = (() => {
    const regular: typeof filteredTools = [];
    const mcp: typeof filteredTools = [];

    filteredTools.forEach((tool) => {
      if (isMCPTool(tool)) {
        mcp.push(tool);
      } else {
        regular.push(tool);
      }
    });

    return { regularTools: regular, mcpToolsList: mcp };
  })();

  // const getTools = (tabFilter: TabFilterType) => {
  //   switch (tabFilter) {
  //     case "all":
  //       return filteredTools;
  //     case "configured":
  //       return connectedTools;
  //     case "ready-to-use":
  //       return unconnectedTools;
  //     case "custom":
  //       return filteredTools;
  //     default:
  //       return filteredTools;
  //   }
  // };

  const getTools = (tabFilter: TabFilterType) => {
    switch (tabFilter) {
      case "tools":
        return regularTools;
      case "mcp":
        return mcpToolsList;
      default:
        return regularTools;
    }
  };

  // const totalTools = getTools(tabFilter);
  // const allToolsCount = getTools("all").length;
  // const configuredToolsCount = getTools("configured").length;
  // const readyToUseToolsCount = getTools("ready-to-use").length;
  // const customToolsCount = getTools("custom").length;

  const toolsCount = regularTools.length;

  // Filter out tools that are already in mcpServers
  const availableMCPServerIds = new Set(
    availableMCPServers.map((server: any) => server.id),
  );

  const availableDefaultMCPTools = defaultLyzrMCPTools.filter((tool) => {
    const alreadyConnected = mcpServers.some(
      (server: any) => server.standard_server_id === tool.key,
    );

    const alreadyInAvailableToAdd = availableMCPServerIds.has(tool.key);

    return !alreadyConnected && !alreadyInAvailableToAdd;
  });

  const mcpToolsCount = defaultMCPTools?.data?.servers.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full w-full space-y-4 px-8 py-4"
    >
      <PageTitle
        title="Tools"
        description={
          <span className="inline-flex items-center gap-1 space-x-1 text-sm text-muted-foreground">
            <p>
              Configure and manage external tools and integrations for your
              agents.
            </p>
            <Link
              to="https://www.avanade.com/en-gb/services"
              target="_blank"
              className="flex items-center text-link underline-offset-4 hover:underline"
              onClick={() => {
                if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                  mixpanel.track("Docs-clicked", {
                    feature: "Tools Listing",
                  });
              }}
            >
              Docs
              <ArrowTopRightIcon className="ml-1 size-3" />
            </Link>
            <Link
              to="https://www.avanade.com/en-gb/services"
              target="_blank"
              className="flex items-center text-link underline-offset-4 hover:underline"
              onClick={() => {
                if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                  mixpanel.track("API-clicked", {
                    feature: "Tools Listing",
                  });
              }}
            >
              API
              <ArrowTopRightIcon className="ml-1 size-3" />
            </Link>
          </span>
        }
      />
      <Separator />
      <div className="flex">
        <FilterToggle<TabFilterType>
          value={tabFilter}
          setValue={(value) => setTabFilter(value as TabFilterType)}
          items={[
            { id: "tools", label: "Tools", count: toolsCount },
            {
              id: "mcp",
              label: "MCP",
              count: mcpToolsCount,
            },
          ]}
        />
      </div>
      <div className="grid w-full grid-cols-12 place-content-between gap-2">
        <div className="col-span-4 flex gap-2">
          <span className="flex flex-1 items-center rounded-md border border-input px-2">
            <Search className="size-5" />
            <Input
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs border-none bg-transparent shadow-none"
            />
            <XCircle
              className={cn(
                "size-4 text-slate-400 transition-all ease-in-out hover:text-slate-700",
                searchQuery.length > 0 ? "visible" : "invisible",
              )}
              onClick={() => setSearchQuery("")}
            />
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={refreshAll}
            disabled={isLoading}
            withTooltip="Refresh"
          >
            <RefreshCw
              className={cn("size-4", isLoading ? "animate-spin" : "")}
            />
          </Button>
        </div>
        <div className="col-span-6" />
        {isSelectionMode ? (
          <div className="col-span-2 flex gap-2 place-self-end">
            <Button
              variant="outline"
              size="default"
              onClick={cancelSelectionMode}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="default"
              onClick={() => setIsBulkDeletingTools(true)}
              disabled={selectedToolIds.length === 0}
            >
              <Trash2 className="mr-2 h-5 w-5" />
              {`Delete Selected${selectedToolIds.length > 0 ? ` (${selectedToolIds.length})` : ""}`}
            </Button>
          </div>
        ) : (
          <div className="col-span-2 flex gap-2 place-self-end">
            {tabFilter === "tools" && (
              <>
                <Button variant="outline" onClick={() => enterSelectionMode()}>
                  <CheckSquare className="mr-2 size-4" />
                  Select
                </Button>
                <Button onClick={handleAddTool}>
                  <Plus className="mr-1 size-4" />
                  Add Custom Tool
                </Button>
              </>
            )}
            {tabFilter === "mcp" && (
              <Button onClick={() => setShowAddMCPDialog(true)}>
                <Plus className="mr-1 size-4" />
                Add MCP Server
              </Button>
            )}
          </div>
        )}
      </div>

      <UpgradePlan
        open={showUpgradePricing}
        onOpen={() => setShowUpgradePricing(false)}
        title="Tool Limit Exceeded"
        description="Your current plan doesn't allow adding more tools. Upgrade your plan to increase your tool limit."
      />

      <ConfirmDialog
        open={isBulkDeletingTools}
        onOpenChange={(open) => {
          if (!open && !isDeletingTools) {
            setIsBulkDeletingTools(false);
          }
        }}
        title="Delete Tools"
        description={
          selectedToolIds.length === 1
            ? "Are you sure you want to delete this tool? This action cannot be undone."
            : `Are you sure you want to delete ${selectedToolIds.length} tools? This action cannot be undone.`
        }
        onConfirm={handleDeleteMultiCustomTools}
        isLoading={isDeletingMultiCustomTools}
      />

      <ToolDialog
        name={selectedTool?.name ?? ""}
        description={selectedTool?.description ?? ""}
        providerId={selectedTool?.providerId ?? ""}
        categories={selectedTool?.categories ?? []}
        actions={toolActions ?? {}}
        openToolDialog={toolDialog}
        onOpenToolDialogChange={setToolDialog}
        onCancel={() => setToolDialog(false)}
        isUserTool={isUserTool}
        connectionId={selectedTool?.connectionId}
        appId={selectedTool?.appId}
        isMCPTool={selectedTool?.isMCPTool}
        onDelete={() => {
          refetchUserTools();
          fetchMCPServers();
          // refetchApiTools();
          refetchProviders();
        }}
        onSuccess={() => {
          refetchUserTools();
          fetchMCPServers();
          setToolDialog(false);
        }}
        isLimitReached={isLimitReached}
        toolSource={selectedTool?.toolSource}
        isACITool={selectedTool?.toolSource === "aci"}
        securityScheme={selectedTool?.securityScheme}
        customACIApp={selectedTool?.customACIApp}
        authTypeMCP={selectedTool?.authTypeMCP}
        isMCPConnected={selectedTool?.isMCPConnected}
        mcpTools={mcpToolActions}
        isLoadingMcpTools={isLoadingMcpActions}
        toolId={selectedTool?.toolId}
        customToolId={selectedTool?.customToolId}
        onOpenApiKeyDialog={() => setShowApiKeyDialog(true)}
      />

      <ApiKeyDialog
        open={showApiKeyDialog}
        onOpenChange={setShowApiKeyDialog}
        categories={selectedTool?.categories ?? []}
        providerId={selectedTool?.providerId ?? ""}
        customACIApp={selectedTool?.customACIApp ?? false}
        form={findProviderForTool(selectedTool)?.form}
        securityScheme={selectedTool?.securityScheme}
        onSuccess={() => {
          getUserConnectedAccounts();
          refetchUserTools();
          fetchMCPServers();
          setToolDialog(false);
          setShowApiKeyDialog(false);
        }}
        toolName={formatName(selectedTool?.name ?? "")}
        isLimitReached={isLimitReached ?? false}
        appId={selectedTool?.appId}
        toolId={selectedTool?.toolId}
        isACITool={selectedTool?.toolSource === "aci"}
        isUserTool={isUserTool}
      />

      <CustomToolDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        onSuccess={() => {
          refetchUserTools();
          refetchProviders();
        }}
        isLimitReached={isLimitReached}
        remainingSlots={remainingSlots}
      />

      <MCPServerDialog
        open={showAddMCPDialog}
        onOpenChange={setShowAddMCPDialog}
        onSuccess={() => {
          refreshAll();
        }}
      />

      <MCPToolDialog
        open={showMCPToolDialog}
        onOpenChange={(open) => {
          setShowMCPToolDialog(open);
          if (!open) {
            setSelectedLyzrMCPTool(null);
          }
        }}
        name={selectedLyzrMCPTool?.name}
        description={selectedLyzrMCPTool?.description}
        server_url={selectedLyzrMCPTool?.serverUrl}
        auth_type={selectedLyzrMCPTool?.authTypeMCP}
        server_type={selectedLyzrMCPTool?.serverType}
        standard_server_id={selectedLyzrMCPTool?.standardServerId}
        onSuccess={() => {
          refreshAll();
        }}
        // id={selectedLyzrMCPTool?.providerId}
      />

      <EditToolDialog
        open={editToolDialog}
        onOpenChange={setEditToolDialog}
        name={editingTool?.name ?? ""}
        isLoading={isGettingOpenAPITool}
        isSubmitting={isUpdatingOpenAPITool}
        openApiConfig={openApiConfig}
        onChangeOpenApiConfig={setOpenApiConfig}
        toolDetails={toolDetails}
        onChangeToolDetails={setToolDetails}
        onConfirm={handleConfirmEdit}
      />

      <UpgradePlan
        open={showUpgradePricing}
        onOpen={() => setShowUpgradePricing(false)}
        title="Tool Limit Exceeded"
        description="Your current plan doesn't allow adding more tools. Upgrade your plan to increase your tool limit."
      />

      <div className="no-scrollbar h-[calc(100%-5rem)] space-y-8 overflow-y-auto">
        {!apiKey ? (
          <div className="text-center text-muted-foreground">
            Please enter an API key to view tools
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-4 gap-4">
            <ToolSkeleton />
            <ToolSkeleton />
            <ToolSkeleton />
            <ToolSkeleton />
            <ToolSkeleton />
            <ToolSkeleton />
            <ToolSkeleton />
            <ToolSkeleton />
          </div>
        ) : getTools(tabFilter).length === 0 ? (
          <div className="text-center text-muted-foreground">
            No {tabFilter === "mcp" ? "MCP tools" : "tools"} found
          </div>
        ) : (
          <>
            {tabFilter === "tools" ? (
              <>
                {(connectedTools.filter((tool) => !isMCPTool(tool)).length >
                  0 ||
                  userTools.length > 0) && (
                  <div>
                    <h2 className="font-semibold"> My Tools </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Tools you have connected and configured
                    </p>
                    <div className="my-4 grid grid-cols-4 gap-4">
                      {connectedTools
                        .filter((tool) => !isMCPTool(tool))
                        .map((tool) => {
                          return (
                            <ToolCard
                              key={tool.key}
                              name={tool.name}
                              {...tool}
                              form={findProviderForTool(tool)?.form}
                              isUserTool={isToolConnected(tool)}
                              connectionId={getConnectionIdForTool(tool)}
                              onToolConnected={() => {
                                refetchUserTools();
                                setToolDialog(false);
                              }}
                              onDelete={() => {
                                refetchUserTools();
                              }}
                              onClick={handleCardClick}
                              onEdit={handleEditTool}
                              isLimitReached={isLimitReached}
                              toolSource={tool.toolSource}
                              categories={tool.categories}
                              isSelectionMode={isSelectionMode}
                              isSelected={selectedToolIds.includes(tool.key)}
                              onToggleSelect={() =>
                                toggleToolSelection(tool.key)
                              }
                              onEnterSelectionMode={() => {
                                enterSelectionMode(tool.key);
                              }}
                            />
                          );
                        })}
                      <MyToolsList
                        userTools={customToolMatch}
                        onSuccess={() => {
                          refetchUserTools();
                        }}
                        onEdit={handleEditTool}
                        isSelectionMode={isSelectionMode}
                        isToolSelected={(toolId) =>
                          selectedToolIds.includes(toolId)
                        }
                        onToggleSelect={(toolId) => toggleToolSelection(toolId)}
                        onEnterSelectionMode={(toolId) => {
                          enterSelectionMode(toolId);
                        }}
                      />
                    </div>
                  </div>
                )}

                {(aciTools.length > 0 ||
                  externalTools.length > 0 ||
                  customTools.length > 0) && (
                  <div>
                    <div className="flex justify-between">
                      <div className="flex flex-col">
                        <h2 className="font-semibold">
                          Available Tools to Add
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Choose from tools listed below, or add your own custom
                          tools.
                        </p>
                      </div>
                    </div>
                    <div className="my-4 grid grid-cols-4 gap-4">
                      {customTools.map((tool) => (
                        <ToolCard
                          key={tool.key}
                          name={tool.name}
                          {...tool}
                          form={findProviderForTool(tool)?.form}
                          isUserTool={isToolConnected(tool)}
                          connectionId={getConnectionIdForTool(tool)}
                          onToolConnected={() => {
                            refetchUserTools();
                            setToolDialog(false);
                          }}
                          onDelete={() => {
                            refetchUserTools();
                          }}
                          onClick={handleCardClick}
                          onEdit={handleEditTool}
                          isLimitReached={isLimitReached}
                          isSelectionMode={isSelectionMode}
                          isSelected={selectedToolIds.includes(tool.key)}
                          onToggleSelect={() => toggleToolSelection(tool.key)}
                          onEnterSelectionMode={() => {
                            enterSelectionMode(tool.key);
                          }}
                        />
                      ))}
                      {aciTools.map((tool) => (
                        <ToolCard
                          key={tool.key}
                          {...tool}
                          form={findProviderForTool(tool)?.form}
                          isUserTool={isToolConnected(tool)}
                          connectionId={getConnectionIdForTool(tool)}
                          onToolConnected={() => {
                            refetchUserTools();
                            setToolDialog(false);
                          }}
                          onClick={handleCardClick}
                          isLimitReached={isLimitReached}
                          toolSource={tool.toolSource}
                          categories={tool.categories}
                          securityScheme={tool.securityScheme}
                        />
                      ))}
                      {externalTools.map((tool) => (
                        <ToolCard
                          key={tool.key}
                          {...tool}
                          form={findProviderForTool(tool)?.form}
                          isUserTool={isToolConnected(tool)}
                          connectionId={getConnectionIdForTool(tool)}
                          onToolConnected={() => {
                            refetchUserTools();
                            setToolDialog(false);
                          }}
                          onDelete={() => refetchUserTools()}
                          onClick={handleCardClick}
                          isLimitReached={isLimitReached}
                          toolSource={tool.toolSource}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {connectedTools.filter((tool) => isMCPTool(tool)).length >
                  0 && (
                  <div>
                    <h2 className="font-semibold">My MCP Servers</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      MCP servers you have connected and configured
                    </p>
                    <div className="my-4 grid grid-cols-4 gap-4">
                      {connectedTools
                        .filter((tool) => isMCPTool(tool))
                        .map((tool) => {
                          const isMCPConnected =
                            (tool.categories?.includes("MCP") ||
                              tool.categories?.includes("Avanade Mcp")) &&
                            (tool.has_active_token === true ||
                              tool.has_active_token === null);
                          return (
                            <ToolCard
                              key={tool.key}
                              name={tool.name}
                              {...tool}
                              form={findProviderForTool(tool)?.form}
                              isUserTool={
                                isToolConnected(tool) || isMCPConnected
                              }
                              connectionId={getConnectionIdForTool(tool)}
                              onToolConnected={() => {
                                refetchUserTools();
                                setToolDialog(false);
                              }}
                              onDelete={() => {
                                refetchUserTools();
                              }}
                              onClick={handleCardClick}
                              onEdit={handleEditTool}
                              isLimitReached={isLimitReached}
                              toolSource={tool.toolSource}
                              categories={tool.categories}
                              authTypeMCP={tool.authTypeMCP}
                              isMCPTool={true}
                              isMCPConnected={isMCPConnected}
                              isSelectionMode={isSelectionMode}
                              isSelected={selectedToolIds.includes(tool.key)}
                              onToggleSelect={() =>
                                toggleToolSelection(tool.key)
                              }
                              onEnterSelectionMode={() => {
                                enterSelectionMode(tool.key);
                              }}
                            />
                          );
                        })}
                    </div>
                  </div>
                )}

                {availableMCPServers.length > 0 && (
                  <div>
                    <div className="flex justify-between">
                      <div className="flex flex-col">
                        <h2 className="font-semibold">
                          Available MCP Servers to Add
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          MCP servers from your configured list that are not yet
                          connected.
                        </p>
                      </div>
                    </div>
                    <div className="my-4 grid grid-cols-4 gap-4">
                      {availableMCPServers.map((server: any) => {
                        const tool = allTools.find(
                          (t) => t.providerId === server.id,
                        );
                        const toolData = tool || {
                          key: server.id,
                          name: server.name,
                          description: server.description,
                          providerId: server.id,
                          categories: server.server_type,
                          isMCPTool: true,
                          has_active_token: server.has_active_token,
                          authTypeMCP: server.auth_type,
                        };
                        return (
                          <ToolCard
                            key={server.id}
                            name={server.name}
                            description={server.description}
                            providerId={server.id}
                            onClick={handleCardClick}
                            icon={null}
                            categories={[server.server_type]}
                            isMCPTool={true}
                            // isLimitReached={isLimitReached}
                            connectionId={getConnectionIdForTool(toolData)}
                            authTypeMCP={server.auth_type}
                            isMCPConnected={false}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {(mcpServer.length > 0 ||
                  availableDefaultMCPTools.length > 0) && (
                  <div>
                    <div className="flex justify-between">
                      <div className="flex flex-col">
                        <h2 className="font-semibold">Available MCP Servers</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Choose from MCP servers listed below, or add your own
                          custom MCP server.
                        </p>
                      </div>
                    </div>
                    <div className="my-4 grid grid-cols-4 gap-4">
                      {availableDefaultMCPTools.map((tool) => (
                        <ToolCard
                          key={tool.key}
                          name={tool.name}
                          description={tool.description}
                          providerId={tool.providerId}
                          onClick={() => {
                            setSelectedLyzrMCPTool({
                              name: tool.name,
                              description: tool.description,
                              serverUrl: tool.serverUrl,
                              authTypeMCP: tool.authTypeMCP,
                              providerId: tool.providerId,
                              serverType: tool.categories[0],
                              standardServerId: tool.key,
                            });
                            setShowMCPToolDialog(true);
                          }}
                          icon={null}
                          categories={tool.categories}
                          // isLimitReached={isLimitReached}
                          connectionId={getConnectionIdForTool(tool)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
