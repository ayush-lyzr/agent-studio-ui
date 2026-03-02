import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, SquarePen, Trash2, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useFieldArray, UseFormReturn } from "react-hook-form";

import LabelWithTooltip from "@/components/custom/label-with-tooltip";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
// import { ToolResponse } from "../types";
import { IAgent, Path } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateAgentService } from "../create-agent.service";
import useStore from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import mixpanel from "mixpanel-browser";
import { isMixpanelActive } from "@/lib/constants";
import { useTools } from "@/pages/configure/tools/tools-service";

type ToolsSectionProps = {
  form: UseFormReturn<any, any, undefined>;
  agent: Partial<IAgent>;
};
interface UserTool {
  tool_id?: string;
  tool_source?: string;
  tool_name?: string;
  name?: string;
  app_id?: string;
  server_id?: string;
  provider_uuid?: string;
  credential_id?: string;
}

interface ToolAuthenticationRadioGroupProps {
  value: boolean;
  onChange: (value: boolean) => void;
  idPrefix: string;
}

const ToolAuthenticationRadioGroup = ({
  value,
  onChange,
  idPrefix,
}: ToolAuthenticationRadioGroupProps) => {
  return (
    <div className="mt-4 space-y-3 p-1">
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          Tool Authentication when shared/published
        </span>
      </div>
      <TooltipProvider>
        <RadioGroup
          value={value ? "true" : "false"}
          onValueChange={(val) => onChange(val === "true")}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="true"
              id={`use-creator-credentials-${idPrefix}`}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Label
                  htmlFor={`use-creator-credentials-${idPrefix}`}
                  className="cursor-pointer text-sm font-normal"
                >
                  Use creator's credentials
                </Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>Actions run using your connected tools</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="false"
              id={`require-user-signin-${idPrefix}`}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Label
                  htmlFor={`require-user-signin-${idPrefix}`}
                  className="cursor-pointer text-sm font-normal"
                >
                  Require user sign-in
                </Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>Users must connect their own tools</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </RadioGroup>
      </TooltipProvider>
    </div>
  );
};

const ToolsSection: React.FC<ToolsSectionProps> = ({ form, agent }) => {
  // const [apiTools, setApiTools] = useState<ToolResponse[]>([]);
  const [userTools, setUserTools] = useState<UserTool[]>([]);
  const apiKey = useStore((state) => state.api_key);

  const { getUserTools, isFetchingUserTools, getToolsField } =
    useCreateAgentService({
      apiKey,
    });
  const {
    getMCPServers,
    getUserConnectedAccounts,
    getMCPServersActions,
    isGettingMCPServersActions,
    getToolActions,
    isGettingToolActions,
  } = useTools({ apiKey });
  const [toolDialogVisible, setToolDialogVisible] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [editingToolIndex, setEditingToolIndex] = useState<number | null>(null);
  const [showMore, setShowMore] = useState<Record<string, boolean>>({});
  const [mcpActions, setMcpActions] = useState<any[]>([]);
  const [toolsActions, setToolsActions] = useState<any[]>([]);
  const [isLoadingMcpActions, setIsLoadingMcpActions] = useState(false);
  const [toolEnabled, setToolEnabled] = useState(true);

  const getToolName = (tool: UserTool): string => {
    return tool.tool_name || tool.name || "";
  };

  const selectedToolData = userTools.find(
    (tool) => getToolName(tool) === selectedTool,
  );

  const editingToolFormData =
    editingToolIndex !== null
      ? form.getValues(`tools.${editingToolIndex}`)
      : null;

  const toolSource =
    editingToolFormData?.tool_source ?? selectedToolData?.tool_source ?? "";
  const toolAppId = selectedToolData?.app_id ?? "";
  const toolServerId =
    editingToolFormData?.server_id ?? selectedToolData?.server_id ?? "";
  const isMcpSelected = (toolSource || "") === "mcp";
  const providerUuid =
    editingToolFormData?.provider_uuid ?? selectedToolData?.provider_uuid ?? "";
  const credentialId =
    editingToolFormData?.credential_id ?? selectedToolData?.credential_id ?? "";

  /**
   * IMPORTANT:
   * `/providers/tools/actions/{provider_identifier}` accepts either:
   * - provider_uuid (ObjectId) OR
   * - provider_id (e.g. "gmail") + tool_source query param
   *
   * `GET /tools/all/user` returns `tool_id` as a *connection id* for composio,
   * which is NOT a valid provider_identifier for this endpoint.
   *
   * So we must prefer provider_uuid, then fall back to the tool slug/name.
   */
  const providerIdentifier = (() => {
    const raw =
      selectedToolData?.provider_uuid ??
      selectedToolData?.tool_name ??
      selectedToolData?.name ??
      selectedToolData?.tool_id;
    if (raw == null) return undefined;
    const value = String(raw).trim();
    return value ? value : undefined;
  })();

  const {
    data: secondaryOptions = [],
    isLoading: isLoadingActions,
    isError: isErrorGetToolsField,
  } = getToolsField(
    !isMcpSelected ? providerIdentifier : undefined,
    !isMcpSelected ? toolSource : undefined,
    !isMcpSelected ? toolAppId : undefined,
    !isMcpSelected ? toolServerId : undefined,
  );

  useEffect(() => {
    const fetchToolActions = async () => {
      if (selectedToolData?.provider_uuid) {
        try {
          const response = await getToolActions(
            selectedToolData?.provider_uuid,
          );
          setToolsActions(response.data || []);
        } catch (error) {
          console.error("Error fetching tool actions:", error);
          setToolsActions([]);
        }
      } else {
        setToolsActions([]);
      }
    };
    fetchToolActions();
  }, [selectedToolData?.provider_uuid, getToolActions, selectedTool]);

  useEffect(() => {
    const fetchMcpActions = async () => {
      if (
        !toolDialogVisible ||
        !isMcpSelected ||
        !selectedToolData?.server_id ||
        !apiKey
      ) {
        setMcpActions([]);
        setIsLoadingMcpActions(false);
        return;
      }

      try {
        setIsLoadingMcpActions(true);
        const response = await getMCPServersActions(selectedToolData.server_id);
        const tools = response?.data?.tools ?? response?.data ?? [];
        setMcpActions(Array.isArray(tools) ? tools : []);
      } catch (error) {
        console.error("Error fetching MCP tool actions:", error);
        setMcpActions([]);
      } finally {
        setIsLoadingMcpActions(false);
      }
    };

    fetchMcpActions();
  }, [
    apiKey,
    getMCPServersActions,
    isMcpSelected,
    selectedToolData?.server_id,
    toolDialogVisible,
  ]);

  useEffect(() => {
    setShowMore({});
  }, [selectedAction]);

  // Use whichever API call succeeded, with fallback logic
  const actionOptions = isMcpSelected
    ? mcpActions
    : (Array.isArray(secondaryOptions) && secondaryOptions.length > 0
        ? secondaryOptions
        : null) ||
      (Array.isArray(toolsActions) && toolsActions.length > 0
        ? toolsActions
        : null) ||
      [];
  const loadingActions = isMcpSelected
    ? isLoadingMcpActions || isGettingMCPServersActions || isGettingToolActions
    : isLoadingActions && !isErrorGetToolsField;

  useEffect(() => {
    if (
      !toolDialogVisible ||
      editingToolIndex === null ||
      selectedAction ||
      !isMcpSelected ||
      actionOptions.length === 0
    ) {
      return;
    }

    const usageDescription = form.getValues(
      `tools.${editingToolIndex}.usage_description`,
    );

    if (!usageDescription) {
      return;
    }

    const matchedAction = actionOptions.find((action: any) => {
      const displayName = action.name;
      return (
        usageDescription === displayName || usageDescription === action.name
      );
    });

    if (matchedAction) {
      setSelectedAction(matchedAction.name);
    }
  }, [actionOptions, editingToolIndex, selectedAction, toolDialogVisible]);

  const selectedActionDetails = actionOptions.find(
    (action: any) => action.name === selectedAction,
  );

  const parameters = isMcpSelected
    ? selectedActionDetails?.input_schema?.properties || {}
    : selectedActionDetails?.parameters?.properties || {};
  const requiredParams = isMcpSelected
    ? selectedActionDetails?.input_schema?.required || []
    : selectedActionDetails?.required_parameters || [];

  const {
    fields: tools,
    append: appendTool,
    remove: removeTool,
    update: updateTool,
  } = useFieldArray({
    name: "tools",
    control: form.control,
  });

  const handleToolAdd = () => {
    setSelectedTool(null);
    setSelectedAction(null);
    setToolDialogVisible(true);
    setShowMore({});
    setToolEnabled(true);
    setToolsActions([]);
  };

  const handleRemoveTool = (index: number) => {
    removeTool(index);
    setSelectedAction(null);
  };

  const handleConnectTool = () => {
    if (!selectedTool || !selectedAction) return;

    const usageDescription = isMcpSelected
      ? selectedActionDetails?.name
      : selectedAction;

    const persistAuthValue =
      editingToolIndex !== null
        ? (form.getValues(`tools.${editingToolIndex}.persist_auth`) ?? true)
        : toolEnabled;

    const toolData = {
      name: selectedTool,
      usage_description: usageDescription,
      tool_source: toolSource,
      server_id: toolServerId,
      persist_auth: persistAuthValue,
      provider_uuid: providerUuid,
      credential_id: credentialId,
    };

    if (editingToolIndex !== null) {
      updateTool(editingToolIndex, toolData);
    } else {
      appendTool(toolData);
    }

    setToolDialogVisible(false);
    setSelectedTool(null);
    setSelectedAction(null);
    setEditingToolIndex(null);
    setToolsActions([]);
  };

  const fetchTools = useCallback(async () => {
    try {
      const res = await getUserTools();
      const mcpServers = await getMCPServers();
      const userAccounts = await getUserConnectedAccounts();
      if (
        Array.isArray(res.data) ||
        Array.isArray(mcpServers.data.servers) ||
        Array.isArray(userAccounts?.data)
      ) {
        // setApiTools([]);
        const filteredMCPServers = Array.isArray(mcpServers.data.servers)
          ? mcpServers.data.servers
              .filter(
                (server: any) =>
                  server.has_active_token === true ||
                  server.has_active_token === null,
              )
              .map((server: any) => ({
                ...server,
                tool_source: server.tool_source || "mcp",
                name: server.name,
                tool_name: server.tool_name || server.name,
                server_id: server.id,
              }))
          : [];

        const filterUserAccounts = Array.isArray(userAccounts?.data)
          ? userAccounts?.data
              .filter((account: any) => account.provider_uuid !== null)
              .map((account: any) => ({
                ...account,
                tool_source: account.provider_source || "other",
                name: account.credential_name,
                tool_name: `${account.provider_id}-${account.credential_name}`,
                server_id: account.id,
              }))
          : [];
        setUserTools([
          ...res.data,
          ...filteredMCPServers,
          ...filterUserAccounts,
        ]);
      }
    } catch (error) {
      console.error("Error fetching tools:", error);
    }
  }, [apiKey]);

  useEffect(() => {
    if (apiKey) fetchTools();
  }, [form, agent, apiKey]);

  return (
    <div className="col-span-4">
      <div className="flex items-center justify-between">
        <LabelWithTooltip
          tooltip={
            <span>
              <p>Select and configure tools for your agent.</p>
              <Link
                to="https://www.avanade.com/en-gb/services"
                target="_blank"
                className="mt-3 inline-flex items-center text-xs text-link underline-offset-4 hover:underline"
                onClick={() => {
                  if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                    mixpanel.track("Docs-clicked", {
                      feature: "Tools",
                    });
                }}
              >
                Docs
                <ArrowTopRightIcon className="ml-1 size-3" />
              </Link>
              <Link
                to="https://www.avanade.com/en-gb/services"
                target="_blank"
                className="ml-2 mt-3 inline-flex items-center text-xs text-link underline-offset-4 hover:underline"
                onClick={() => {
                  if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                    mixpanel.track("API-clicked", {
                      feature: "Tools",
                    });
                }}
              >
                API
                <ArrowTopRightIcon className="ml-1 size-3" />
              </Link>
            </span>
          }
        >
          Tool Configuration
        </LabelWithTooltip>
        {isFetchingUserTools ? (
          <div className="flex gap-4">
            <Skeleton className="h-10 w-[200px]" />
            <Skeleton className="h-10 flex-1" />
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToolAdd}
            >
              <Plus className="mr-1 size-4" />
              Add
            </Button>
          </div>
        )}
      </div>

      {tools.map((field, index) => {
        const toolName = form.watch(`tools.${index}.name`);
        const usageDescription = form.watch(`tools.${index}.usage_description`);
        const toolSource =
          form.watch(`tools.${index}.tool_source`) ||
          userTools.find((tool) => getToolName(tool) === toolName)?.tool_source;
        if (!toolName) {
          return null;
        }
        return (
          <div
            key={field.id}
            className="mt-4 flex items-center justify-between gap-4 rounded-md bg-secondary p-2"
          >
            <div className="flex-1">
              <FormField
                control={form.control}
                name={`tools.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <p className="text-sm font-medium">
                        {field.value.charAt(0).toUpperCase() +
                          field.value.slice(1)}
                      </p>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`tools.${index}.usage_description`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <p className="break-all text-sm text-muted-foreground">
                        {field.value}
                      </p>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div>
              <SquarePen
                className="h-4 w-4 cursor-pointer"
                onClick={() => {
                  setSelectedTool(toolName);
                  setSelectedAction(
                    toolSource === "mcp" ? null : usageDescription,
                  );
                  setToolDialogVisible(true);
                  setEditingToolIndex(index);
                  const existingPersistAuth = form.watch(
                    `tools.${index}.persist_auth`,
                  );
                  setToolEnabled(existingPersistAuth ?? true);
                }}
              />
            </div>
            <div className="m-0 flex items-center gap-2">
              <Trash2
                className="h-4 w-4 cursor-pointer text-destructive"
                onClick={() => handleRemoveTool(index)}
              />
            </div>
          </div>
        );
      })}

      <FormMessage />

      <Dialog open={toolDialogVisible} onOpenChange={setToolDialogVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add tool</DialogTitle>
          </DialogHeader>
          <DialogDescription>Configure tools</DialogDescription>
          <div className="max-h-[400px] gap-2 overflow-y-auto">
            <div className="flex gap-2 p-1">
              <Select
                value={selectedTool || ""}
                onValueChange={(value) => {
                  setSelectedTool(value);
                  setSelectedAction(null);
                  setShowMore({});
                  setToolsActions([]);
                }}
                disabled={userTools?.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      userTools?.length === 0
                        ? "No tool is configured"
                        : "Select tool"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {userTools.map((tool) => {
                    const toolName = getToolName(tool);
                    return (
                      <SelectItem key={toolName} value={toolName}>
                        {typeof toolName === "string"
                          ? toolName.charAt(0).toUpperCase() + toolName.slice(1)
                          : toolName}{" "}
                        {`(${tool.tool_source === "openapi" ? "Custom" : tool.tool_source === "aci" ? "Open-source" : tool.tool_source === "composio" ? "Composio" : "MCP"})`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={fetchTools}
                  disabled={isFetchingUserTools}
                  className="h-9"
                >
                  <RefreshCw
                    className={cn(
                      "h-4 w-4",
                      isFetchingUserTools && "animate-spin",
                    )}
                  />
                </Button>
              </div>
            </div>
            <div>
              <Link
                to={Path.TOOLS}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({
                    variant: "link",
                    size: "sm",
                  }),
                  "text-link underline-offset-4",
                )}
              >
                Configure more tools
                <ArrowUpRight className="ml-1 size-3" />
              </Link>
            </div>
            {selectedTool && toolSource !== "openapi" && (
              <>
                {editingToolIndex !== null ? (
                  <FormField
                    control={form.control}
                    name={`tools.${editingToolIndex}.persist_auth`}
                    render={({ field }) => (
                      <ToolAuthenticationRadioGroup
                        value={field.value === true}
                        onChange={(value) => field.onChange(value)}
                        idPrefix="edit"
                      />
                    )}
                  />
                ) : (
                  <ToolAuthenticationRadioGroup
                    value={toolEnabled}
                    onChange={(value) => setToolEnabled(value)}
                    idPrefix="new"
                  />
                )}
              </>
            )}
            <div className="p-1">
              {selectedTool && (
                <>
                  {loadingActions ? (
                    <Skeleton className="h-10 w-full" />
                  ) : actionOptions.length > 0 ? (
                    <Select
                      value={selectedAction || ""}
                      onValueChange={(value) => setSelectedAction(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        {actionOptions.map((action: any) => (
                          <SelectItem key={action.name} value={action.name}>
                            {action.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : isMcpSelected ? (
                    <div className="rounded-md p-3 text-sm text-muted-foreground">
                      No actions are available for this MCP server. You need to
                      delete server and add it again.
                    </div>
                  ) : (
                    <Input
                      placeholder="Provide tool instructions"
                      value={selectedAction || ""}
                      onChange={(e) => setSelectedAction(e.target.value)}
                    />
                  )}
                </>
              )}
            </div>
            {selectedAction && Object.keys(parameters).length > 0 && (
              <>
                <Separator className="my-3" />
                <div className="mt-2 flex flex-col overflow-x-hidden p-1">
                  <span className="text-sm font-medium">Parameters</span>
                  <span className="text-sm text-muted-foreground">
                    Add parameters in agent instructions or during conversation
                    with agent. (*) indicates mandatory fields.
                  </span>
                </div>
                {Object.entries(parameters).map(
                  ([paramKey, paramSchema]: [string, any]) => (
                    <div
                      key={paramKey}
                      className="mt-2 rounded-lg bg-secondary p-2"
                    >
                      <span className="text-sm font-medium">
                        {paramSchema.title || paramKey}
                        {requiredParams?.includes(paramKey) && (
                          <span className="text-destructive">*</span>
                        )}
                      </span>
                      <div
                        className={
                          showMore[paramKey]
                            ? "mt-1 text-sm text-foreground/60"
                            : "mt-1 line-clamp-2 text-sm text-foreground/60"
                        }
                      >
                        {paramSchema.description}
                        {paramSchema.examples?.length > 0 && (
                          <div className="text-sm">
                            <div className="font-medium">Examples:</div>
                            <div className="space-y-1">
                              {paramSchema.examples.map(
                                (example: string, idx: number) => (
                                  <div key={idx}>{example}</div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div
                        onClick={() =>
                          setShowMore((prev) => ({
                            ...prev,
                            [paramKey]: !prev[paramKey],
                          }))
                        }
                        className="mt-px cursor-pointer text-xs text-link hover:underline"
                      >
                        {showMore[paramKey] ? "Show less" : "Show more"}
                      </div>
                    </div>
                  ),
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                className="h-9"
                onClick={() => {
                  setToolDialogVisible(false);
                  setSelectedTool(null);
                  setSelectedAction(null);
                  setEditingToolIndex(null);
                  setToolEnabled(false);
                  setToolsActions([]);
                }}
              >
                Cancel
              </Button>
              <Button disabled={!selectedAction} onClick={handleConnectTool}>
                {editingToolIndex !== null ? "Update" : "Connect"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ToolsSection;
