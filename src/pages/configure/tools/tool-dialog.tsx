import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState, useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { z } from "zod";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { ACI_REDIRECT_URL } from "@/lib/constants";
import useStore from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTools } from "./tools-service";
import { UpgradePlan } from "@/components/custom/upgrade-plan";

interface ToolDialogProps {
  name: string;
  description: string;
  providerId: string;
  categories: string[];
  actions: object;
  openToolDialog: boolean;
  onOpenToolDialogChange: (open: boolean) => void;
  onCancel: () => void;
  isUserTool: boolean;
  connectionId?: string;
  onDelete?: () => void;
  onSuccess?: () => void;
  isLimitReached?: boolean;
  toolSource?: string;
  isACITool?: boolean;
  securityScheme?: string[];
  customACIApp?: boolean;
  appId?: string;
  isMCPTool?: boolean;
  authTypeMCP?: string;
  isMCPConnected?: boolean;
  mcpTools?: any[];
  isLoadingMcpTools?: boolean;
  toolId?: string;
  onOpenApiKeyDialog?: () => void;
  customToolId?: string;
}

export function ToolDialog({
  name,
  description,
  providerId,
  categories,
  // actions,
  openToolDialog,
  onOpenToolDialogChange,
  onCancel,
  isUserTool,
  connectionId,
  onDelete,
  // onSuccess,
  // isLimitReached = false,
  toolSource,
  isACITool,
  // securityScheme,
  customACIApp,
  appId,
  isMCPTool,
  authTypeMCP,
  isMCPConnected,
  mcpTools = [],
  isLoadingMcpTools = false,
  toolId,
  onOpenApiKeyDialog,
  customToolId,
}: ToolDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const apiKey = useStore((state) => state.api_key);
  const isCustomTool = categories?.includes("Custom");
  const {
    deleteExternalTool,
    deleteCustomTool,
    // connectOAuthTool,
    // isConnectingToolById,
    // connectToolById,
    unlinkACITool,
    deleteACITool,
    deleteCustomAciTool,
    getACIConfigurations,
    initiateMCPOauth,
    deleteMCPServer,
    // oAuthStatusCredential,
    getToolActions,
    isGettingToolActions,
    getUserConnectedAccounts,
    isFetchingUserConnectedAccounts,
    deleteProviderCreds,
    isDeletingProviderCreds,
    deleteProvider,
  } = useTools({ apiKey });
  const [showUpgradePricing, setShowUpgradePricing] = useState(false);
  // const [isOauthCheck, setIsOauthCheck] = useState(false);
  // const [clientId, setClientId] = useState("");
  // const [clientSecret, setClientSecret] = useState("");
  // const [apiKeyValue, setApiKeyValue] = useState("");
  // const [authType, setAuthType] = useState("no_auth");
  // const redirectUrl = ACI_REDIRECT_URL;
  // const [isCopied, setIsCopied] = useState(false);
  const [toolActions, setToolActions] = useState([]);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  // const gmailTool = providerId === "GMAIL" && !customACIApp;
  const composioTool = providerId === "composio_search";

  // const credentialFormSchema = z
  //   .object({
  //     credential_name: z.string().optional(),
  //   })
  //   .superRefine((data, ctx) => {
  //     if (toolId && !data.credential_name?.trim()) {
  //       ctx.addIssue({
  //         path: ["credential_name"],
  //         message: "Credential name is required",
  //         code: z.ZodIssueCode.custom,
  //       });
  //     }
  //   });

  // const form = useForm<z.infer<typeof credentialFormSchema>>({
  //   resolver: zodResolver(credentialFormSchema),
  //   defaultValues: {
  //     credential_name: "",
  //   },
  // });

  useEffect(() => {
    const fetchToolData = async () => {
      if (toolId) {
        if (openToolDialog) {
          setConnectedAccounts([]);
        }

        const [toolActionsResponse, connectedAccountsResponse] =
          await Promise.all([
            getToolActions(toolId),
            getUserConnectedAccounts(),
          ]);

        setToolActions(toolActionsResponse.data);

        const filteredAccounts = connectedAccountsResponse.data.filter(
          (account: any) => account.provider_uuid === toolId,
        );
        setConnectedAccounts(filteredAccounts);
      }
    };

    if (openToolDialog && toolId) {
      fetchToolData();
    }
  }, [openToolDialog, toolId, getToolActions, getUserConnectedAccounts]);

  // useEffect(() => {
  //   if (openToolDialog && gmailTool) {
  //     setIsOauthCheck(true);
  //   }
  //   if (!openToolDialog) {
  //     setIsOauthCheck(false);
  //     form.reset();
  //   }
  // }, [openToolDialog, gmailTool, form]);

  // useEffect(() => {
  //   if (securityScheme?.includes("api_key")) {
  //     setAuthType("api_key");
  //   } else if (securityScheme?.includes("oauth2")) {
  //     setAuthType("oauth2");
  //   } else {
  //     setAuthType("no_auth");
  //   }
  // }, [securityScheme]);

  // useEffect(() => {
  //   const credentialId = sessionStorage.getItem("credentialId");
  //   const checkCredentialStatus = async () => {
  //     if (credentialId) {
  //       await oAuthStatusCredential(credentialId);
  //       sessionStorage.removeItem("credentialId");
  //     }
  //   };
  //   checkCredentialStatus();
  // }, []);

  // const handleSetupClick = async () => {
  //   setIsLoading(true);
  //   try {
  //     const formValues = form.getValues();
  //     const payload: ToolConnection = {
  //       credential_name: formValues.credential_name ?? "",
  //       user_id: userEmail ?? "",
  //       provider_uuid: toolId ?? "",
  //       redirect_url: `${window.location.origin}${Path.TOOLS}`,
  //     };

  //     const response = await connectToolOAuth(payload);
  //     const credentialId = response.data.credential_id;
  //     if (credentialId) {
  //       sessionStorage.setItem("credentialId", credentialId);
  //     }

  //     if (response.data) window.location.href = response.data.auth_url;
  //     // if (credentialId) {
  //     //   await oAuthStatusCredential(credentialId);
  //     // }

  //     // Commenting older system
  //     // const response = await axios.get(
  //     //   `${BASE_URL}/v3/tools/composio/connect/${providerId}`,
  //     //   {
  //     //     headers: { accept: "application/json", "x-api-key": apiKey },
  //     //     params: { redirect_url: `${window.location.origin}${Path.TOOLS}` },
  //     //   },
  //     // );
  //     // if (response.data) window.location.href = response.data;
  //   } catch (error) {
  //     console.error("Error getting connection URL:", error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to get connection URL",
  //       variant: "destructive",
  //     });
  //   }
  //   setIsLoading(false);
  //   onOpenToolDialogChange(false);
  // };

  const handleMCPSetup = async () => {
    setIsLoading(true);
    try {
      const response = await initiateMCPOauth(providerId);
      if (response.data) window.location.href = response.data.auth_url;
    } catch (error) {
      setIsLoading(false);
      console.error("Error getting connection URL:", error);
    }
  };

  // const handleCopy = async () => {
  //   await navigator.clipboard.writeText(redirectUrl);
  //   setIsCopied(true);
  //   setTimeout(() => {
  //     setIsCopied(false);
  //   }, 2000);
  // };

  const checkACIConfigurationExists = (data: any, appName: string) => {
    if (!Array.isArray(data) || !appName) return false;

    return data.some((item: any) => item.app_name === appName);
  };

  // const handleACISetup = async () => {
  //   setIsLoading(true);
  //   try {
  //     let payload;
  //     let params = {};
  //     const formValues = form.getValues();
  //     if (authType === "oauth2") {
  //       if (clientId && clientSecret) {
  //         payload = {
  //           app_id: appId,
  //           security_scheme: "oauth2",
  //           security_scheme_overrides: {
  //             oauth2: {
  //               client_id: clientId,
  //               client_secret: clientSecret,
  //             },
  //           },
  //         };
  //       } else {
  //         payload = {
  //           app_id: appId,
  //           security_scheme: "oauth2",
  //         };
  //       }
  //       params = { redirect_url: `${window.location.origin}${Path.TOOLS}` };
  //     } else if (authType === "api_key") {
  //       payload = {
  //         credential_name: formValues.credential_name ?? "",
  //         user_id: userEmail ?? "",
  //         provider_uuid: toolId ?? "",
  //         credentials: {
  //           api_key: apiKeyValue,
  //         },
  //       };
  //       // payload = {
  //       //   app_id: appId,
  //       //   security_scheme: "api_key",
  //       //   security_scheme_overrides: {
  //       //     api_key: {
  //       //       api_key: apiKeyValue,
  //       //     },
  //       //   },
  //       // };
  //       params = { api_key: apiKeyValue };
  //     } else if (authType === "no_auth") {
  //       payload = {
  //         credential_name: formValues.credential_name ?? "",
  //         user_id: userEmail ?? "",
  //         provider_uuid: toolId ?? "",
  //         credentials: {},
  //         // redirect_url: `${window.location.origin}${Path.TOOLS}`,
  //       };
  //       // payload = {
  //       //   app_id: appId,
  //       //   security_scheme: "no_auth",
  //       // };
  //     } else {
  //       payload = {
  //         app_id: appId,
  //         security_scheme: securityScheme,
  //       };
  //     }
  //     // await connectOAuthTool({ payload });
  //     await createStaticCreds({ payload });
  //     // const appName = response.data.app_name;
  //     const connectTool = await connectToolById({
  //       authType,
  //       appId: appId ?? "",
  //       params,
  //     });

  //     if (connectTool.data) {
  //       if (connectTool.data.url) {
  //         window.location.href = connectTool.data.url;
  //       }
  //       toast({
  //         title: "Success",
  //         description: "Tool connected successfully",
  //       });
  //       onSuccess?.();
  //     }
  //   } catch (error) {
  //     setIsLoading(false);
  //     onOpenToolDialogChange(false);
  //     await deleteACITool(appId ?? "");
  //     console.error("Error connecting OAuth tool:", error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to connect OAuth tool",
  //       variant: "destructive",
  //     });
  //   }
  //   setIsLoading(false);
  //   onOpenToolDialogChange(false);
  // };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      if (connectionId && !isCustomTool) {
        if (isACITool) {
          await unlinkACITool(connectionId);
          await deleteACITool(appId ?? "");
          // if (customACIApp) await deleteCustomAciTool(providerId);
        } else {
          await deleteExternalTool(connectionId);
        }
      } else {
        if (customACIApp) {
          const response = await getACIConfigurations();
          const data = response.data;
          if (checkACIConfigurationExists(data, providerId)) {
            await deleteACITool(appId ?? "");
            await deleteCustomAciTool(providerId);
          } else {
            await deleteCustomAciTool(providerId);
          }
        } else {
          await deleteCustomTool(providerId);
          await deleteProvider(customToolId ?? "");
        }
      }
      toast({
        title: "Success",
        description: connectionId
          ? "Tool disconnected successfully"
          : "Tool deleted successfully",
      });
      onDelete?.();
    } catch (error) {
      console.error("Error deleting tool:", error);
      toast({
        title: "Error",
        description: "Failed to delete tool",
        variant: "destructive",
      });
    }
    setIsLoading(false);
    onOpenToolDialogChange(false);
  };

  const handleDeleteCustomTool = async () => {
    setIsLoading(true);
    try {
      if (customACIApp) {
        if (connectionId) {
          await unlinkACITool(connectionId);
          await deleteACITool(appId ?? "");
          await deleteCustomAciTool(appId ?? "");
        } else {
          await deleteCustomAciTool(appId ?? "");
        }
        toast({
          title: "Success",
          description: "Custom ACI tool deleted successfully",
        });
      } else {
        await deleteMCPServer(providerId);
      }
      onDelete?.();
    } catch (error) {
      console.error("Error deleting custom ACI tool:", error);
      toast({
        title: "Error",
        description: "Failed to delete custom ACI tool",
        variant: "destructive",
      });
    }
    setIsLoading(false);
    onOpenToolDialogChange(false);
  };

  const handleDeleteProviderCreds = async (credentialId: string) => {
    setIsLoading(true);
    try {
      await deleteProviderCreds(credentialId);
      if (isACITool) await deleteACITool(appId ?? "");

      // Refetch connected accounts after deletion
      if (toolId) {
        const connectedAccounts = await getUserConnectedAccounts();
        const filteredAccounts = connectedAccounts.data.filter(
          (account: any) => account.provider_uuid === toolId,
        );
        setConnectedAccounts(filteredAccounts);
      }

      toast({
        title: "Success",
        description: "Account disconnected successfully",
      });
    } catch (error) {
      console.error("Error deleting provider creds:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // const handleAddTool = async () => {
  //   if (authType === "oauth2" && (!clientId || !clientSecret) && isOauthCheck) {
  //     toast({
  //       title: "Error",
  //       description: "Client ID and Client Secret are required.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   if (authType === "api_key" && !apiKeyValue) {
  //     toast({
  //       title: "Error",
  //       description: "API Key is required.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   if (isLimitReached) {
  //     setShowUpgradePricing(true);
  //   } else {
  //     if (isACITool) {
  //       handleACISetup();
  //     } else if (isMCPTool) {
  //       handleMCPSetup();
  //     } else {
  //       handleSetupClick();
  //     }
  //   }
  // };

  // const hasActions = Array.isArray(toolActions)
  //   ? toolActions.length > 0
  //   : toolActions && typeof toolActions === "object"
  //     ? Object.keys(toolActions).length > 0
  //     : false;

  // const showActionsSection = !isCustomTool && (isMCPTool ? true : hasActions);

  return (
    <>
      <Dialog open={openToolDialog} onOpenChange={onOpenToolDialogChange}>
        <DialogContent className="top-[50%] max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-normal">
              {name.charAt(0).toUpperCase() + name.slice(1)}
              {isUserTool && !isCustomTool && (
                <>
                  <Badge variant="success" className="rounded-full">
                    Connected
                  </Badge>
                  <Badge variant="outline" className="rounded-full capitalize">
                    {toolSource}
                  </Badge>
                </>
              )}
            </DialogTitle>
            {!isCustomTool && (
              <DialogDescription className=" text-sm">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
          {!isCustomTool && !isMCPTool && (
            <>
              <Separator />
              <div>
                <div className="flex items-center justify-between">
                  <div className="mb-2 font-medium">Connected Accounts</div>
                  <Button
                    variant="link"
                    className="focus-visible:ring-0 focus-visible:ring-offset-0"
                    onClick={() => onOpenApiKeyDialog?.()}
                  >
                    Add
                  </Button>
                </div>
                {connectedAccounts.length > 0 ||
                isFetchingUserConnectedAccounts ? (
                  <div className="space-y-1 rounded-md bg-secondary p-2">
                    {connectedAccounts.map((account: any, idx: number) => (
                      <div key={idx} className="items-center">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm">
                            {account.credential_name}
                          </div>
                          <Button
                            variant="link"
                            onClick={() =>
                              handleDeleteProviderCreds(account.credential_id)
                            }
                            disabled={isDeletingProviderCreds}
                            className="text-destructive"
                          >
                            Disconnect
                          </Button>
                        </div>
                        {idx !== connectedAccounts.length - 1 && <Separator />}
                      </div>
                    ))}
                    {isFetchingUserConnectedAccounts && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading connected accounts...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No connected accounts found.
                  </div>
                )}
              </div>
              <div className="break-all">
                {/* <div className="mb-2 font-medium">
                  {isMCPConnected
                    ? "Equip your agent with the following capabilities"
                    : showActionsSection
                      ? "Connect to get started"
                      : null}
                </div> */}
                {isMCPTool ? (
                  <div className="space-y-1">
                    {isLoadingMcpTools ? (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading MCP actions...
                      </div>
                    ) : mcpTools.length > 0 ? (
                      mcpTools.map((tool, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 space-y-1"
                        >
                          <Check className="h-4 w-4" />
                          <div className="text-sm">{tool.display_name}</div>
                        </div>
                      ))
                    ) : isMCPConnected ? (
                      <div className="text-sm text-muted-foreground">
                        No actions available for this MCP server.
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <>
                    {isGettingToolActions ? (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading tool actions...
                      </div>
                    ) : Array.isArray(toolActions) && toolActions.length > 0 ? (
                      <Accordion
                        type="single"
                        collapsible
                        className="w-full p-0"
                      >
                        <AccordionItem
                          value="tool-actions"
                          className="border-none"
                        >
                          <AccordionTrigger className="font-medium">
                            Tool Actions
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-1">
                              {toolActions.map((action: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2"
                                >
                                  <Check className="h-4 w-4" />
                                  <div className="text-sm">{action.name}</div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ) : null}
                  </>
                )}
                {/* <Separator className="my-3" /> */}
                {/* {isACITool && !isUserTool && (
                  <div className="flex gap-2">
                    {securityScheme?.includes("api_key") ? (
                      <div className="relative flex-1 space-y-3">
                        <div>
                          <span className="text-sm font-medium">
                            Enter API Key{" "}
                            <span className="text-destructive">*</span>
                          </span>
                          <Input
                            required={true}
                            className="mt-1 w-full pr-8"
                            placeholder="Enter your API Key"
                            value={apiKeyValue}
                            onChange={(e) => setApiKeyValue(e.target.value)}
                          />
                        </div>
                      </div>
                    ) : null}
                    {authType === "oauth2" && (
                      <div className="flex items-center gap-2">
                        <Switch
                          id="oauth-mode"
                          checked={gmailTool ? true : isOauthCheck}
                          onCheckedChange={(checked) =>
                            setIsOauthCheck(checked)
                          }
                          disabled={gmailTool}
                        />
                        <span className="text-sm font-medium">
                          Use your custom Oauth app
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {authType === "oauth2" && isOauthCheck && (
                  <div className="relative flex-1 space-y-3">
                    <div className="mt-4">
                      <span className="text-sm font-medium">Redirect URL</span>
                      <div className="relative mt-1 flex items-center">
                        <InputGroup>
                          <InputGroupInput placeholder={redirectUrl} readOnly />
                        </InputGroup>
                        <InputGroupButton
                          aria-label="Copy"
                          title="Copy"
                          size="icon-xs"
                          className="absolute right-1 h-8 w-8 p-0 hover:bg-none"
                          onClick={handleCopy}
                        >
                          {isCopied ? (
                            <>
                              <Check className="ml-1 size-4" />
                            </>
                          ) : (
                            <>
                              <Copy className="ml-1 size-4" />
                            </>
                          )}
                        </InputGroupButton>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium">
                        Enter Client Id{" "}
                        <span className="text-destructive">*</span>
                      </span>
                      <Input
                        required={true}
                        className="mt-1 w-full pr-8"
                        placeholder="Enter your OAuth2 Client ID"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="text-sm font-medium">
                        Enter Client Secret{" "}
                        <span className="text-destructive">*</span>
                      </span>
                      <Input
                        required={true}
                        className="mt-1 w-full pr-8"
                        placeholder="Enter your OAuth2 Client Secret"
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                      />
                    </div>
                  </div>
                )} */}
              </div>
            </>
          )}
          {(() => {
            const hasReAuthenticateButton =
              isMCPTool && isMCPConnected && authTypeMCP === "oauth";
            const hasDeleteToolButton = customACIApp || isMCPTool;
            const hasDeleteOrDisconnectButton = isCustomTool || isUserTool;
            const hasAnyButton =
              hasReAuthenticateButton ||
              hasDeleteToolButton ||
              hasDeleteOrDisconnectButton;

            if (!hasAnyButton) return null;

            return (
              <div className="mt-4 flex justify-end gap-4">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                {hasReAuthenticateButton && (
                  <Button onClick={handleMCPSetup} disabled={isLoading}>
                    Re-authenticate
                  </Button>
                )}
                {hasDeleteToolButton && (
                  <Button
                    variant="destructive"
                    onClick={handleDeleteCustomTool}
                    disabled={isLoading}
                  >
                    Delete Tool
                  </Button>
                )}
                {isCustomTool ? (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isLoading}
                  >
                    Delete
                  </Button>
                ) : isUserTool ? (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isLoading || composioTool}
                  >
                    Disconnect
                    {/* {connectionId && !isCustomTool ? "Disconnect" : ""} */}
                  </Button>
                ) : isMCPTool && !isMCPConnected ? (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMCPSetup();
                    }}
                    disabled={isLoading || isGettingToolActions}
                  >
                    Connect
                  </Button>
                ) : null}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
      <UpgradePlan
        open={showUpgradePricing}
        onOpen={() => setShowUpgradePricing(false)}
        title="Tool Limit Exceeded"
        description="Your current plan doesn't allow adding more tools. Upgrade your plan to increase your tool limit."
      />
    </>
  );
}
