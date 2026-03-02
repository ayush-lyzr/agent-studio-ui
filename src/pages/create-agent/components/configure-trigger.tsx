import { useState, useEffect, useCallback } from "react";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useParams } from "react-router-dom";
import useStore from "@/lib/store";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { useSchedulerService } from "./automation.service";
import type { ExtraComponentProps } from "@/data/features";
import {
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  Webhook,
} from "lucide-react";
import { Button } from "@/components/custom/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { toast } from "sonner";
interface ConfigureTriggerProps extends ExtraComponentProps { }

interface WebhookData {
  id: string;
  agent_id: string;
  user_id: string;
  description: string;
  webhook_url: string;
  is_active: boolean;
  created_at: string;
  last_triggered_at: string | null;
  last_trigger_success: boolean | null;
  trigger_count: number;
}

interface ScheduleData {
  agent_id: string;
  schedules: unknown[];
  webhooks: WebhookData[];
}



export const ConfigureTrigger = ({
  updateFeatures,
  featureName,
  openDialog = false,
  openPauseDialog = false,
}: ConfigureTriggerProps) => {
  const [open, setOpen] = useState(false);
  const [webhook, setWebhook] = useState<WebhookData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newSecretKey, setNewSecretKey] = useState<string | null>(null);
  const [secretKeyCopied, setSecretKeyCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { agentId } = useParams();
  const apiKey = useStore((state) => state?.api_key ?? "");
  const currentUser = useManageAdminStore((state) => state?.current_user);
  const userEmail = currentUser?.auth?.email ?? "";

  const {
    createWebhook,
    isCreatingWebhook,
    getScheduleByAgentId,
    webhookAction,
    deleteWebhook,
    isDeletingWebhook,
  } = useSchedulerService({ apiKey });

  useEffect(() => {
    if (openDialog) {
      setOpen(true);
    }
  }, [openDialog]);

  useEffect(() => {
    const pauseWebhook = async () => {
      if (openPauseDialog && webhook) {
        try {
          await webhookAction({ webhookId: webhook.id, action: "pause" });
          toast.success("Webhook paused");
          await refreshWebhook();
          updateFeatures(featureName, false);
        } catch (error) {
          console.error("Error pausing webhook:", error);
          toast.error("Failed to pause webhook");
        }
      } else if (openPauseDialog && !webhook) {
        updateFeatures(featureName, false);
      }
    };

    pauseWebhook();
  }, [openPauseDialog]);

  useEffect(() => {
    const fetchWebhook = async () => {
      if (open && agentId && apiKey) {
        setIsLoading(true);
        try {
          const response = await getScheduleByAgentId({ agentId });
          const data: ScheduleData = response?.data;
          if (data?.webhooks && Array.isArray(data.webhooks) && data.webhooks.length > 0) {
            setWebhook(data.webhooks[0]);
          } else {
            setWebhook(null);
          }
        } catch (error) {
          console.error("Error fetching webhook:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchWebhook();
  }, [open, agentId, apiKey, getScheduleByAgentId]);

  const refreshWebhook = useCallback(async () => {
    if (agentId && apiKey) {
      try {
        const response = await getScheduleByAgentId({ agentId });
        const data: ScheduleData = response?.data;
        if (data?.webhooks && Array.isArray(data.webhooks) && data.webhooks.length > 0) {
          setWebhook(data.webhooks[0]);
        } else {
          setWebhook(null);
        }
      } catch (error) {
        console.error("Error refreshing webhook:", error);
      }
    }
  }, [agentId, apiKey, getScheduleByAgentId]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setNewSecretKey(null);
    setSecretKeyCopied(false);

    if (webhook?.is_active) {
      updateFeatures(featureName, true, undefined, undefined, { name: "active" });
    } else {
      updateFeatures(featureName, false);
    }
  }, [webhook, featureName, updateFeatures]);

  const handleCreateWebhook = async () => {
    if (!agentId || !userEmail) {
      toast.error("Agent ID or User Email is missing");
      return;
    }

    try {
      const response = await createWebhook({
        agent_id: agentId,
        user_id: userEmail,
      });

      const generatedWebhookUrl = response?.data?.webhook_url ?? "";
      const generatedSecretKey = response?.data?.secret_key ?? "";

      if (!generatedWebhookUrl) {
        toast.error("Failed to create webhook");
        return;
      }

      setNewSecretKey(generatedSecretKey);
      setSecretKeyCopied(false);
      await refreshWebhook();
      toast.success("Webhook created");
    } catch (error) {
      console.error("Error creating webhook:", error);
      toast.error("Failed to create webhook");
    }
  };

  const handleDeleteWebhook = async () => {
    if (!webhook) return;

    try {
      await deleteWebhook(webhook.id);
      toast.success("Webhook deleted");
      setWebhook(null);
      setNewSecretKey(null);
      setSecretKeyCopied(false);
      setShowDeleteDialog(false);
      updateFeatures(featureName, false);
    } catch (error) {
      console.error("Error deleting webhook:", error);
      toast.error("Failed to delete webhook");
    }
  };

  const handleWebhookAction = async (action: "pause" | "resume" | "regenerate-secret") => {
    if (!webhook || !apiKey) return;

    setActionLoading(action);

    try {
      const response = await webhookAction({ webhookId: webhook.id, action });

      if (action === "regenerate-secret") {
        const newSecret = response?.data?.secret_key ?? "";
        if (newSecret) {
          setNewSecretKey(newSecret);
          setSecretKeyCopied(false);
          toast.success("Secret key regenerated");
        } else {
          toast.error("Failed to regenerate secret key");
        }
      } else {
        toast.success(action === "pause" ? "Webhook paused" : "Webhook resumed");
        await refreshWebhook();
      }
    } catch (error) {
      console.error(`Error ${action} webhook:`, error);
      toast.error(`Failed to ${action.replace("-", " ")} webhook`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyUrl = async () => {
    if (!webhook?.webhook_url) return;

    try {
      await navigator.clipboard.writeText(webhook.webhook_url);
      toast.success("Webhook URL copied");
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy");
    }
  };

  const handleCopySecretKey = async () => {
    if (!newSecretKey) return;

    try {
      await navigator.clipboard.writeText(newSecretKey);
      setSecretKeyCopied(true);
      toast.success("Secret key copied");

      setTimeout(() => {
        setNewSecretKey(null);
      }, 500);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy secret key");
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleClose();
          } else {
            setOpen(true);
          }
        }}
      >
        <DialogTrigger
          className={cn(
            buttonVariants({ variant: "link" }),
            "p-0 text-link animate-in slide-in-from-top-2 hover:text-link/80",
          )}
        >
          Configure
          <ArrowTopRightIcon className="size-4" />
        </DialogTrigger>

        <DialogContent className="gap-0 pb-0 sm:max-w-lg bg-background text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Webhook Configuration</DialogTitle>
            <DialogDescription className="flex items-center justify-between text-muted-foreground">
              <span>Trigger your agent via HTTP POST requests.</span>
              <a
                href="/executions"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Executions
                <ExternalLink className="size-3" />
              </a>
            </DialogDescription>
          </DialogHeader>

          <Separator className="mt-4" />

          {!agentId ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Webhook className="mb-4 size-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Create an agent first to configure webhooks
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : webhook ? (
            <div className="space-y-4 p-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Status</span>
                <Badge variant={webhook.is_active ? "default" : "secondary"}>
                  {webhook.is_active ? "Active" : "Paused"}
                </Badge>
              </div>

              {/* Webhook URL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground">Endpoint URL</Label>
                  <Badge variant="outline" className="text-xs">
                    POST
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={webhook.webhook_url}
                    readOnly
                    className="flex-1 bg-muted dark:bg-muted/80 text-foreground font-mono text-xs border-input placeholder:text-muted-foreground"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleCopyUrl}
                          className="shrink-0"
                        >
                          <Copy className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy URL</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* Secret Key - One-time display */}
              {newSecretKey && !secretKeyCopied && (
                <div className="space-y-2 rounded-lg border border-destructive/50 bg-destructive/5 dark:bg-destructive/10 dark:border-destructive/40 p-3">
                  <div className="flex items-center gap-2">
                    <KeyRound className="size-4 text-destructive" />
                    <Label className="text-sm font-medium text-foreground">Secret Key</Label>
                    <span className="text-xs text-destructive">
                      Copy now. You won’t be able to view this again.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="password"
                      value={newSecretKey}
                      readOnly
                      className="flex-1 bg-muted dark:bg-muted/80 text-foreground font-mono text-xs border-input placeholder:text-muted-foreground"
                      autoComplete="off"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleCopySecretKey}
                            className="shrink-0 bg-muted dark:bg-muted/40 border-input dark:border-border hover:bg-muted/60 dark:hover:bg-muted/80"
                          >
                            <Copy className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy secret key</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="space-y-2 rounded-lg bg-muted/50 dark:bg-muted/30 p-3 text-sm border border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="text-foreground">
                    {new Date(webhook.created_at).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}
                  </span>
                </div>
                {webhook.last_triggered_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last triggered</span>
                    <span className="text-foreground">
                      {new Date(webhook.last_triggered_at).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                )}
                {webhook.trigger_count > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total triggers</span>
                    <span className="text-foreground">{webhook.trigger_count}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between border-t pt-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleWebhookAction("regenerate-secret")}
                        disabled={actionLoading === "regenerate-secret"}
                      >
                        {actionLoading === "regenerate-secret" ? (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 size-4" />
                        )}
                        Regenerate Secret
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Generate a new secret key</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {webhook.is_active ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleWebhookAction("pause")}
                            disabled={actionLoading === "pause"}
                          >
                            {actionLoading === "pause" ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Pause className="size-4" />
                            )}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleWebhookAction("resume")}
                            disabled={actionLoading === "resume"}
                          >
                            {actionLoading === "resume" ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Play className="size-4" />
                            )}
                          </Button>
                        )}
                      </TooltipTrigger>
                      <TooltipContent>
                        {webhook.is_active ? "Pause webhook" : "Resume webhook"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setShowDeleteDialog(true)}
                          disabled={isDeletingWebhook}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete webhook</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-muted dark:bg-muted/60 p-4">
                <Webhook className="size-8 text-muted-foreground" />
              </div>
              <h3 className="mb-1 text-sm font-medium text-foreground">No webhook configured</h3>
              <p className="mb-6 max-w-xs text-sm text-muted-foreground">
                Create a webhook endpoint to trigger your agent programmatically using HTTP requests.
              </p>
              <Button onClick={handleCreateWebhook} disabled={isCreatingWebhook}>
                {isCreatingWebhook ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Webhook"
                )}
              </Button>
            </div>
          )}

          <DialogFooter className="py-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={handleClose}>
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this webhook? This action cannot be undone.
              Any integrations using this webhook will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWebhook}
              disabled={isDeletingWebhook}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingWebhook ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
