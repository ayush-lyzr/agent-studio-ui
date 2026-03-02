import { z } from "zod";
import { useState, useEffect } from "react";
import { useForm, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  AlertCircle,
  Plus,
  Clock,
  ChevronLeft,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
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
import { cn } from "@/lib/utils";
import LabelWithTooltip from "@/components/custom/label-with-tooltip";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useMemory } from "@/pages/configure/memory/memory-service";
import type {
  IMemoryCredential,
  IMemoryResource,
  IMemoryProvider,
} from "@/pages/configure/memory/types";
import {
  getMemoryProviderDisplayName,
  MEMORY_PROVIDER_TAGS,
} from "@/pages/configure/memory/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";

interface ConfigureMemoryProps {
  updateFeatures: (
    name: string,
    enabled: boolean,
    ragId?: string,
    ragName?: string,
    config?: any,
  ) => void;
  featureName: string;
  openDialog?: boolean;
}

type ViewMode = "provider" | "resources" | "create";

export const ConfigureMemory: React.FC<ConfigureMemoryProps> = ({
  updateFeatures,
  featureName,
  openDialog,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>("provider");
  const [selectedCredential, setSelectedCredential] =
    useState<IMemoryCredential | null>(null);
  const [memoryResources, setMemoryResources] = useState<IMemoryResource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [_resourcesError, setResourcesError] = useState<string | null>(null);
  const [_selectingResourceId, setSelectingResourceId] = useState<
    string | null
  >(null);

  const parentForm = useFormContext();
  const { toast } = useToast();

  const existingFeatures = parentForm?.watch("features") || [];
  // Case-insensitive to handle both "memory" and "MEMORY" type variants
  const existingMemoryConfig = existingFeatures.find(
    (feature: any) => feature.type?.toUpperCase() === "MEMORY",
  );
  const existingMemoryCount =
    existingMemoryConfig?.config?.max_messages_context_count || 10;
  const existingCredentialId =
    existingMemoryConfig?.config?.memory_credential_id || "";
  // Detect provider: if memory_credential_id exists, it's AWS AgentCore
  const existingProvider =
    existingMemoryConfig?.config?.provider ||
    (existingCredentialId ? "aws-agentcore" : "cognis");
  const existingMemoryId = existingMemoryConfig?.config?.memory_id || "";
  const existingCrossSession =
    existingMemoryConfig?.config?.lyzr_memory?.params?.cross_session ?? false;
  const [crossSessionEnabled, setCrossSessionEnabled] = useState(existingCrossSession);
  const [selectedProviderId, setSelectedProviderId] =
    useState<string>(existingProvider);

  // Fetch AWS AgentCore credentials
  const {
    credentials = [],
    getCredentials,
    isFetchingCredentials,
    listMemoryResources,
    isUsingExisting,
    useExistingMemory,
    provisionMemory,
    isProvisioning,
    getMemoryProvider,
    isFetchingMemoryProvider,
    dataProvider,
  } = useMemory({
    enabled: open && !!selectedProviderId && selectedProviderId !== "lyzr" && selectedProviderId !== "cognis",
    providerId: selectedProviderId,
  });

  const lyzrProvider: IMemoryProvider = {
    _id: "lyzr-memory",
    provider_id: "lyzr",
    type: "memory",
    form: {
      title: "Avanade Memory",
      description: "Balanced Memory provider powered by Lyzr. Works out of the box with short term long term memory support.",
      fields: [],
    },
    meta_data: {
      icon: "lyzr",
      category: "memory",
      supports_role_based_auth: false,
      lambda_registration_required: false,
      provisioning_time_seconds: 0,
      documentation_url: "",
    },
  };

  const allowedProviderIds = ["cognis", "lyzr", "aws-agentcore"];
  const allProviders = [lyzrProvider, ...dataProvider]
    .filter((provider) => allowedProviderIds.includes(provider.provider_id))
    .sort(
      (a, b) =>
        allowedProviderIds.indexOf(a.provider_id) -
        allowedProviderIds.indexOf(b.provider_id),
    );

  useEffect(() => {
    getMemoryProvider();
  }, [getMemoryProvider]);

  const formSchema = z.object({
    provider: z.string().default("cognis"),
    memory_credential_id: z.string().optional(),
    memory_id: z.string().optional(),
    max_messages_context_count: z.coerce
      .number()
      .int()
      .min(2)
      .max(50)
      .default(10),
    cross_session: z.boolean().default(false),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider: existingProvider,
      memory_credential_id: existingCredentialId,
      memory_id: existingMemoryId,
      max_messages_context_count: existingMemoryCount,
      cross_session: existingCrossSession,
    },
  });

  // Form for new memory resource creation
  const newMemoryForm = useForm({
    defaultValues: {
      memory_name: "",
      event_expiry_days: 30,
      memory_strategy: "",
    },
  });

  const selectedProvider = form.watch("provider");
  // const selectedMemoryId = form.watch("memory_id");

  const refetchMemoryResources = async (credentialId: string) => {
    try {
      const resources = await listMemoryResources(credentialId);
      setMemoryResources(resources);
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to load memory resources";
      setResourcesError(errorMsg);
      setMemoryResources([]);
    } finally {
      setIsLoadingResources(false);
    }
  };

  // Fetch resources when credential is selected
  const handleCredentialSelect = async (credentialId: string) => {
    const credential = credentials.find(
      (c) => c.credential_id === credentialId,
    );
    if (!credential) return;

    setSelectedCredential(credential);
    form.setValue("memory_credential_id", credentialId);

    // If credential already has a memory_id, use it
    if (credential.meta_data?.memory_id) {
      form.setValue("memory_id", credential.meta_data.memory_id);
    }

    // Fetch resources from AWS
    if (selectedProviderId === "aws-agentcore") {
      setIsLoadingResources(true);
      setResourcesError(null);
      await refetchMemoryResources(credentialId);
    }
  };

  const handleSelectMemoryResource = async (memory_id: string) => {
    const resource: IMemoryResource | undefined = memoryResources.find(
      (memory) => memory.memory_id === memory_id,
    );
    if (!resource) return;
    if (resource.status !== "ACTIVE" || !selectedCredential?.credential_id)
      return;

    setSelectingResourceId(resource.memory_id);
    try {
      // Update credential with selected memory_id
      await useExistingMemory({
        credentialId: selectedCredential.credential_id,
        memoryId: resource.memory_id,
      });

      form.setValue("memory_id", resource.memory_id);
      toast({ title: "Memory resource selected" });
      setViewMode("provider");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to select memory",
        variant: "destructive",
      });
    } finally {
      setSelectingResourceId(null);
    }
  };

  const handleProvisionMemory = async () => {
    if (!selectedCredential) return;

    const values = newMemoryForm.getValues();
    if (!values.memory_name) {
      toast({
        title: "Error",
        description: "Memory name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await provisionMemory({
        credentialId: selectedCredential.credential_id,
        memoryName: values.memory_name,
        eventExpiryDays: values.event_expiry_days,
        memoryStrategy: values.memory_strategy || undefined,
      });
      toast({
        title: "Memory provisioning started",
        description: "This takes 2-3 minutes. You can continue working.",
      });
      newMemoryForm.reset();
      setViewMode("provider");
      // Refresh resources after a delay
      setTimeout(
        () => handleCredentialSelect(selectedCredential.credential_id),
        2000,
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.detail || "Failed to provision memory",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const config: any = {
      provider: values.provider,
    };

    if (values.provider === "cognis") {
      config.lyzr_memory = {
        provider_type: "cognis",
        params: {
          cross_session: values.cross_session,
        },
      };
    } else {
      config.max_messages_context_count = values.max_messages_context_count;
    }

    if (
      values.provider !== "lyzr" &&
      values.provider !== "cognis" &&
      values.memory_credential_id &&
      values.memory_id
    ) {
      config.memory_credential_id = values.memory_credential_id;
      config.memory_id = values.memory_id;
    }

    updateFeatures(
      featureName,
      true,
      values.provider === "cognis" ? "" : String(values.max_messages_context_count),
      "",
      config,
    );

    setCrossSessionEnabled(values.cross_session);
    form.reset(values);
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setOpen(true);
      setViewMode("provider");
    } else {
      form.reset({
        provider: existingProvider,
        memory_credential_id: existingCredentialId,
        memory_id: existingMemoryId,
        max_messages_context_count: existingMemoryCount,
        cross_session: existingCrossSession,
      });
      setOpen(false);
      setViewMode("provider");
      setSelectedCredential(null);
      setMemoryResources([]);
      setSelectingResourceId(null);
      newMemoryForm.reset();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle className="size-4 text-green-500" />;
      case "CREATING":
        return <Clock className="size-4 text-yellow-500" />;
      default:
        return <AlertCircle className="size-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    // const variants: Record<string, "default" | "secondary" | "destructive"> = {
    //   ACTIVE: "default",
    //   CREATING: "secondary",
    //   FAILED: "destructive",
    // };
    return (
      <Badge variant="secondary" size="sm" className="text-xs">
        {status}
      </Badge>
    );
  };

  const hasCredential = !!selectedCredential?.credential_id;
  const hasResource =
    selectedProvider !== "aws-agentcore" ||
    (form.watch("memory_credential_id") && form.watch("memory_id"));
  const canSave =
    !isFetchingCredentials &&
    !isFetchingMemoryProvider &&
    (selectedProvider === "lyzr" || selectedProvider === "cognis" || (hasCredential && hasResource));

  // Handle openDialog prop changes - only open when transitioning from false to true
  useEffect(() => {
    if (openDialog && open) {
      setOpen(true);
    }
  }, [openDialog, open]);

  useEffect(() => {
    const setCredentials = async () => {
      // await getProviderMemory();
      if (existingProvider && existingProvider !== "lyzr" && existingProvider !== "cognis") {
        await getCredentials();
        const credential = credentials.find(
          (c) => c.credential_id === existingCredentialId,
        );
        console.log({ credentials, existingCredentialId });
        form.setValue("memory_credential_id", existingCredentialId);
        setSelectedCredential(credential as IMemoryCredential | null);
      }
    };

    const setMemory = async () => {
      if (existingProvider === "aws-agentcore" && existingCredentialId) {
        await refetchMemoryResources(existingCredentialId);
        form.setValue("memory_id", existingMemoryId);
        setSelectingResourceId(existingMemoryId);
      }
    };
    if (open) {
      setCredentials();
    }
    if (open && existingMemoryId && existingProvider === "aws-agentcore") {
      setMemory();
    }
  }, [
    open,
    existingMemoryId,
    existingCredentialId,
    existingProvider,
    credentials.length,
    getCredentials,
  ]);

  // Reset when switching providers
  useEffect(() => {
    if (selectedProvider === "lyzr" || selectedProvider === "cognis") {
      form.setValue("memory_credential_id", "");
      form.setValue("memory_id", "");
      setSelectedCredential(null);
      setMemoryResources([]);
      setViewMode("provider");
    } else if (selectedProvider) {
      setSelectedCredential(null);
      getCredentials();
    }
  }, [selectedProvider, form, getCredentials]);

  const handleCrossSessionToggle = (checked: boolean) => {
    setCrossSessionEnabled(checked);
    const currentConfig = existingMemoryConfig?.config || {};
    updateFeatures(featureName, true, "", "", {
      ...currentConfig,
      provider: currentConfig.provider || "cognis",
      lyzr_memory: {
        ...currentConfig.lyzr_memory,
        provider_type: "cognis",
        params: {
          ...currentConfig.lyzr_memory?.params,
          cross_session: checked,
        },
      },
    });
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: "link" }),
          "p-0 text-link animate-in slide-in-from-top-2 hover:text-link/80",
        )}
      >
        Configure
        <ArrowTopRightIcon className="size-4" />
      </DialogTrigger>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-4"
        >
          <DialogContent className="max-h-[600px] max-w-xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {viewMode !== "provider" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => setViewMode("provider")}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                )}
                {viewMode === "provider" && "Configure Memory"}
                {viewMode === "resources" && "Select Memory Resource"}
                {viewMode === "create" && "Create Memory Resource"}
              </DialogTitle>
            </DialogHeader>
            <Separator />

            {/* Provider Selection View */}
            {viewMode === "provider" && (
              <>
                {/* Provider Selection */}
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <LabelWithTooltip
                        tooltip="Choose between Lyzr's default memory or bring your own memory provider."
                        required={true}
                      >
                        Memory Provider
                      </LabelWithTooltip>
                      <FormControl>
                        {isFetchingMemoryProvider ? (
                          <Skeleton className="h-9 w-full" />
                        ) : (
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedProviderId(value);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent>
                              {allProviders.map((provider) => (
                                <SelectItem
                                  key={provider.provider_id}
                                  value={provider.provider_id}
                                >
                                  <div className="flex items-center gap-2">
                                    <span>
                                      {getMemoryProviderDisplayName(
                                        provider.provider_id,
                                        provider.form.title,
                                      )}
                                    </span>
                                    {provider.provider_id === "cognis" && (
                                      <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        <CheckCircle className="size-3" />
                                        Default
                                      </span>
                                    )}
                                    {provider.provider_id === "lyzr" && (
                                      <Badge
                                        variant="secondary"
                                        size="sm"
                                        className="text-xs"
                                      >
                                        Balanced
                                      </Badge>
                                    )}
                                    {provider.provider_id === "cognis" && (
                                      <Badge
                                        variant="secondary"
                                        size="sm"
                                        className="text-xs"
                                      >
                                        Advanced
                                      </Badge>
                                    )}
                                    {MEMORY_PROVIDER_TAGS[provider.provider_id] &&
                                      provider.provider_id !== "cognis" && (
                                      <Badge
                                        variant="secondary"
                                        size="sm"
                                        className="text-xs"
                                      >
                                        {MEMORY_PROVIDER_TAGS[provider.provider_id]}
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedProvider && selectedProvider !== "lyzr" && selectedProvider !== "cognis" && (
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="memory_credential_id"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <LabelWithTooltip
                              tooltip="Select credentials, then choose or create a memory resource."
                              required={true}
                            >
                              Credential
                            </LabelWithTooltip>
                            <Button
                              size="icon"
                              variant="link"
                              onClick={() => getCredentials()}
                            >
                              <RefreshCw
                                className={cn(
                                  "size-4",
                                  isFetchingCredentials && "animate-spin",
                                )}
                              />
                            </Button>
                          </div>
                          <FormControl>
                            {isFetchingCredentials ? (
                              <Skeleton className="h-9 w-full" />
                            ) : credentials.length === 0 ? (
                              <div className="rounded-lg border border-dashed p-3 text-center">
                                <AlertCircle className="mx-auto mb-2 size-5 text-warning" />
                                <p className="text-sm text-muted-foreground">
                                  No credentials found for this provider.
                                </p>
                                <Link
                                  to="/configure/memory"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-link hover:underline"
                                >
                                  Configure Memory Credentials
                                </Link>
                              </div>
                            ) : (
                              <Select
                                value={field.value || ""}
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  handleCredentialSelect(value);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select credential" />
                                </SelectTrigger>
                                <SelectContent>
                                  {credentials.map((cred) => (
                                    <SelectItem
                                      key={cred.credential_id}
                                      value={cred.credential_id}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <span>{cred.name}</span>
                                          {selectedProvider ===
                                            "aws-agentcore" &&
                                            cred.credentials
                                              ?.aws_region_name && (
                                              <span className="text-xs text-muted-foreground">
                                                (
                                                {
                                                  cred.credentials
                                                    .aws_region_name
                                                }
                                                )
                                              </span>
                                            )}
                                        </div>
                                        {cred.meta_data?.memory_id && (
                                          <Badge
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            Has Memory
                                          </Badge>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedProvider === "aws-agentcore" && (
                      <FormField
                        control={form.control}
                        name="memory_id"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <LabelWithTooltip
                                tooltip="Select memory resource."
                                required={true}
                              >
                                Memory Resource
                              </LabelWithTooltip>
                              <div className="flex items-center">
                                <Button
                                  type="button"
                                  variant="link"
                                  size="sm"
                                  onClick={() => setViewMode("create")}
                                >
                                  <Plus className="mr-1 size-4" />
                                  Create New Memory Resource
                                </Button>
                                <Button
                                  size="icon"
                                  variant="link"
                                  withTooltip="Refresh memory resources"
                                  onClick={() => {
                                    if (selectedCredential)
                                      handleCredentialSelect(
                                        selectedCredential.credential_id,
                                      );
                                  }}
                                >
                                  <RefreshCw
                                    className={cn(
                                      "size-4",
                                      isLoadingResources && "animate-spin",
                                    )}
                                  />
                                </Button>
                              </div>
                            </div>
                            <FormControl>
                              {isLoadingResources ? (
                                <Skeleton className="h-9 w-full" />
                              ) : (
                                <Select
                                  value={field.value || ""}
                                  disabled={!selectedCredential?.credential_id}
                                  defaultValue={existingMemoryId}
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    handleSelectMemoryResource(value);
                                  }}
                                >
                                  <SelectTrigger>
                                    <div className="flex items-center justify-between">
                                      <SelectValue placeholder="Select memory" />
                                      {isUsingExisting && (
                                        <Loader2 className="ml-1 size-4 animate-spin" />
                                      )}
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {memoryResources.map((resource) => (
                                      <SelectItem
                                        key={resource.memory_id}
                                        value={resource.memory_id}
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-3">
                                            {getStatusIcon(resource.status)}
                                            <div>
                                              <p className="text-sm font-medium">
                                                {resource.name ||
                                                  resource.memory_id}
                                              </p>
                                            </div>
                                          </div>
                                          {getStatusBadge(resource.status)}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Show selected memory info */}
                    {/* {selectedCredential && selectedMemoryId && (
                      <div className="rounded-lg bg-muted p-3 text-sm">
                        <div className="mb-1 flex items-center gap-2">
                          <CheckCircle className="size-4 text-green-500" />
                          <span className="font-medium">
                            Memory Resource Selected
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {selectedMemoryResource?.name || selectedMemoryId}
                        </p>
                      </div>
                    )} */}
                  </div>
                )}

                {/* Max Messages Configuration - hidden for cognis provider */}
                {selectedProvider !== "cognis" && (
                  <FormField
                    control={form.control}
                    name="max_messages_context_count"
                    render={({ field }) => (
                      <FormItem>
                        <LabelWithTooltip
                          tooltip="Messages beyond this limit are summarized and stored as Long-term Memory."
                          required={true}
                        >
                          Max. messages stored as Short-term Memory
                        </LabelWithTooltip>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">2</span>
                          <FormControl>
                            <Slider
                              value={[field.value]}
                              min={2}
                              max={50}
                              className="py-6"
                              onValueChange={(value) =>
                                field.onChange(Number(value))
                              }
                            />
                          </FormControl>
                          <span className="text-sm text-muted-foreground">
                            50
                          </span>
                        </div>
                        <p className="text-sm">{field.value} messages</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Separator />
                <DialogFooter>
                  <DialogClose
                    className={buttonVariants({ variant: "secondary" })}
                  >
                    Close
                  </DialogClose>
                  <Button
                    type="button"
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={!canSave}
                  >
                    Save
                  </Button>
                </DialogFooter>
              </>
            )}

            {/* Resources View - Select or create memory */}
            {/* {viewMode === "resources" && selectedCredential && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Credential:{" "}
                  <span className="font-medium text-foreground">
                    {selectedCredential.name}
                  </span>
                </div>

                {isLoadingResources ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    <span className="text-muted-foreground">
                      Loading memory resources...
                    </span>
                  </div>
                ) : resourcesError ? (
                  <div className="rounded-lg border border-dashed border-destructive/50 bg-destructive/10 p-4 text-center">
                    <AlertCircle className="mx-auto mb-2 size-5 text-destructive" />
                    <p className="text-sm font-medium text-destructive">
                      Failed to load resources
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {resourcesError}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() =>
                        handleCredentialSelect(selectedCredential.credential_id)
                      }
                    >
                      Retry
                    </Button>
                  </div>
                ) : memoryResources.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <p className="text-muted-foreground">
                      No existing memory resources found
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Create a new one below
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Select Existing Resource
                    </p>
                    {memoryResources.map((resource) => (
                      <div
                        key={resource.memory_id}
                        className={cn(
                          "flex items-center justify-between rounded-lg border p-3",
                          resource.status === "ACTIVE" &&
                            "cursor-pointer hover:bg-accent",
                        )}
                        onClick={() => handleSelectMemoryResource(resource)}
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(resource.status)}
                          <div>
                            <p className="text-sm font-medium">
                              {resource.name || resource.memory_id}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {resource.memory_id}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(resource.status)}
                          {resource.status === "ACTIVE" && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectMemoryResource(resource);
                              }}
                              disabled={selectingResourceId !== null}
                              loading={
                                selectingResourceId === resource.memory_id
                              }
                            >
                              Select
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Create New Memory Resource
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode("create")}
                    >
                      <Plus className="mr-1 size-4" />
                      Create New
                    </Button>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setViewMode("provider")}
                  >
                    Back
                  </Button>
                </DialogFooter>
              </div>
            )} */}

            {/* Create Memory View */}
            {viewMode === "create" && selectedProvider === "aws-agentcore" ? (
              selectedCredential ? (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Creating memory for:{" "}
                    <span className="font-medium text-foreground">
                      {selectedCredential.name}
                    </span>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Memory Name *</label>
                    <Input
                      {...newMemoryForm.register("memory_name")}
                      placeholder="my_agent_memory"
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Use lowercase letters, numbers, and underscores only
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">
                        Event Expiry (Days)
                      </label>
                      <Input
                        type="number"
                        {...newMemoryForm.register("event_expiry_days", {
                          valueAsNumber: true,
                        })}
                        className="mt-1"
                        min={1}
                        max={365}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Memory Strategy (Optional)
                      </label>
                      <Select
                        value={newMemoryForm.watch("memory_strategy") || "none"}
                        onValueChange={(v) =>
                          newMemoryForm.setValue(
                            "memory_strategy",
                            v === "none" ? "" : v,
                          )
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select strategy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="semantic">Semantic</SelectItem>
                          <SelectItem value="summary">Summary</SelectItem>
                          <SelectItem value="user_preference">
                            User Preference
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Memory provisioning takes 2-3 minutes. You can continue
                    working while it's being created.
                  </p>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setViewMode("resources")}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={handleProvisionMemory}
                      loading={isProvisioning}
                    >
                      <Plus className="mr-1 size-4" />
                      Create Memory
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <span className="flex items-center gap-1">
                  <p className="text-muted-foreground">
                    {" "}
                    Select a credential to create a memory resource.
                  </p>
                  <Button
                    variant="link"
                    onClick={() => setViewMode("provider")}
                  >
                    Go Back
                  </Button>
                </span>
              )
            ) : null}
          </DialogContent>
        </form>
      </Form>
    </Dialog>
    {/*  Hidden for now */}
    {existingProvider === "cognis" && (
      <div className="flex items-center gap-1.5 hidden">
        <label className="text-xs text-muted-foreground">Cross Session</label>
        <Switch
          checked={crossSessionEnabled}
          onCheckedChange={handleCrossSessionToggle}
        />
      </div>
    )}
    </>
  );
};
