import { motion } from "framer-motion";
import { useBlocker, useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { Form } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/custom/button";
import { Path, type IAgent } from "@/lib/types";
import useStore from "@/lib/store";
import AgentApiDialog from "@/pages/voice-agent-create/components/agent-api-dialog";
import { useManageAdminStore } from "../manage-admin/manage-admin.store";
import { VoiceNewBasicDetails } from "./components/basic-details/index.tsx";
import { getVoiceNewCreateDefaultValues } from "./components/form-defaults";
import { VoiceNewFeaturesPanel } from "./components/features.tsx";
import { VoiceNewLivePreviewPanel } from "./components/live-preview-panel.tsx";
import type { VoiceNewCreateFormValues } from "./components/types.ts";
import { useHydrateVoiceNewFormFromAgent } from "./hooks/use-hydrate-voice-new-form-from-agent";
import { useSaveVoiceNewAgent } from "./hooks/use-save-voice-new-agent";

export default function VoiceNewCreate() {
  const navigate = useNavigate();
  const parameters = useParams();
  const agentId = parameters.agentId;
  const apiKey = useStore((state) => state.api_key) ?? "";
  const { toast } = useToast();
  const currentUser = useManageAdminStore((state) => state.current_user);
  const userName = currentUser?.auth?.email ?? "";

  const form = useForm<VoiceNewCreateFormValues>({
    defaultValues: getVoiceNewCreateDefaultValues(apiKey),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  useEffect(() => {
    const trimmedApiKey = apiKey.trim();
    if (!trimmedApiKey) return;

    const currentApiKey = (form.getValues("api_key") ?? "").trim();
    if (currentApiKey) return;

    form.setValue("api_key", trimmedApiKey, { shouldDirty: false });
  }, [apiKey, form]);

  const { isHydratingFromAgent } = useHydrateVoiceNewFormFromAgent({
    agentId,
    form,
    apiKey,
    onError: (error) => {
      toast({
        title: "Failed to load agent",
        description:
          error instanceof Error ? error.message : "Unknown hydration error",
        variant: "destructive",
      });
    },
  });

  const { isSavingAgent, saveAgent } = useSaveVoiceNewAgent({
    agentId,
    form,
    apiKey,
    navigate,
    toast,
  });
  const formValues = useWatch({ control: form.control }) as VoiceNewCreateFormValues;
  const hasUnsavedChanges = Object.keys(form.formState.dirtyFields).length > 0;

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        className="flex h-screen overflow-hidden"
      >
        {/* Main content section */}
        <div className="flex h-full flex-1 flex-col overflow-hidden">
          <div className="flex justify-between">
            <div className="flex gap-2 p-4">
              <ArrowLeft
                onClick={() => navigate(Path.VOICE_NEW)}
                className="mr-2 mt-1 cursor-pointer"
              />
              <div>
                <p className="text-2xl font-medium">Create Voice Agent</p>
                <p className="text-sm text-muted-foreground">
                  {isHydratingFromAgent
                    ? "Loading saved agent configuration…"
                    : "Configure voice session settings for LiveKit"}
                </p>
              </div>
            </div>
            <div className="flex items-center p-4">
              <AgentApiDialog
                agentId={agentId}
                apiKey={apiKey}
                sessionId="<session_id>"
                payload={
                  (() => {
                    // UI-only fields should never be sent as API payload.
                    const { examples, examples_visible, ...rest } =
                      form.getValues();
                    return rest;
                  })() as unknown as Partial<IAgent>
                }
                userName={userName}
                hasUnsavedChanges={hasUnsavedChanges}
              />
            </div>
          </div>

          <Form {...form}>
            <form className="flex h-[calc(100%-5rem)] flex-col overflow-hidden">
              <div className="flex h-full flex-1 gap-2 overflow-hidden">
                {/* Basic Details */}
                <div className="no-scrollbar h-full w-8/12 overflow-y-auto p-4">
                  <VoiceNewBasicDetails />
                </div>
                <div className="h-full w-px bg-border" />
                {/* Features */}
                <div className="w-4/12 overflow-hidden py-4">
                  <VoiceNewFeaturesPanel form={form} />
                </div>
              </div>

              {/* Bottom buttons */}
              <div className="flex justify-end space-x-2 border-t p-4">
                {hasUnsavedChanges && (
                  <div className="flex items-center text-yellow-500">
                    <TriangleAlert className="mr-2 h-5 w-5" />
                    <span className="mr-4 text-sm">You have unsaved changes</span>
                  </div>
                )}
                <Button
                  type="button"
                  loading={isSavingAgent}
                  disabled={isSavingAgent || isHydratingFromAgent}
                  onClick={() => {
                    void saveAgent();
                  }}
                >
                  {agentId ? "Update" : "Save"}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <Separator orientation="vertical" />

        {/* Live Preview column */}
        <div className="h-full w-1/3 p-4">
          <VoiceNewLivePreviewPanel formValues={formValues} agentId={agentId} />
        </div>
      </motion.div>
      <Dialog
        open={blocker?.state === "blocked"}
        onOpenChange={() => blocker?.reset?.()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. If you leave now, your changes will be
              lost. Would you like to save before exiting?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              loading={isSavingAgent}
              onClick={async () => {
                const saved = await saveAgent({ skipCreateNavigate: true });
                if (saved) {
                  blocker?.proceed?.();
                }
              }}
            >
              Save & Exit
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                blocker?.proceed?.();
              }}
            >
              Discard & Exit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
