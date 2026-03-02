import { lazy, Suspense, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams, Link } from "react-router-dom";
import Loader from "@/components/loader";
import { PageTitle } from "@/components/ui/page-title";
import { Button } from "@/components/ui/button";
import CreateAgentModal from "./components/CreateAgentModal";
import { Eye, Copy, Save, Share2, Upload, Plus, Pen } from "lucide-react";
import ShareBlueprintModal from "./components/ShareBlueprintModal";
import { CloneBlueprintDialog } from "./components/CloneBlueprintDialog";
import VettedAgentPopup from "./components/VettedAgentPopup";
import mixpanel from "mixpanel-browser";
import { isMixpanelActive, PlanType } from "@/lib/constants";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";

const OrchestrationApp = lazy(() => import("./orchestration-app"));

export default function OrchestrationPage() {
  const [searchParams] = useSearchParams();
  // const [showHeaderButtons, setShowHeaderButtons] = useState(false);
  const [hasBlueprintDocs, setHasBlueprintDocs] = useState(false);
  const [isPublicBlueprint, setIsPublicBlueprint] = useState(false);
  const [isOwnBlueprint, setIsOwnBlueprint] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [blueprintUrl, setBlueprintUrl] = useState("");
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
  const [showVettedAgentPopup, setShowVettedAgentPopup] = useState(false);
  const [blueprintName, setBlueprintName] = useState("");
  const { currentUser } = useCurrentUser();
  const usage_data = useManageAdminStore((state) => state.usage_data);

  const lyzrUser = "@lyzr.ai";
  const isLyzrUser = currentUser?.auth?.email.endsWith(lyzrUser);
  const planName = usage_data?.plan_name;
  const restrictedPlans = [
    PlanType.Community,
    PlanType.Starter,
    PlanType.Pro,
    PlanType.Pro_Yearly,
  ];
  const isRestrictedPlan =
    planName && restrictedPlans.includes(planName as PlanType);

  const handleAgentCreated = (newAgent: any) => {
    // Here you can add logic to update the agent list in the sidebar
    // This could trigger a refresh of the agents list or add the agent directly
    console.log("=== HEADER: New agent created ===", newAgent);

    // You might want to emit a custom event to notify other components
    console.log(
      "=== HEADER: Dispatching orchestration:agent-created event ===",
    );
    window.dispatchEvent(
      new CustomEvent("orchestration:agent-created", {
        detail: { agent: newAgent },
      }),
    );
    console.log("=== HEADER: Event dispatched ===");
  };
  const [showCloneNameDialog, setShowCloneNameDialog] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const blueprintId = searchParams.get("blueprint");
  const cloneParam = searchParams.get("clone");
  const [isCloning, setIsCloning] = useState(false);

  // useEffect(() => {
  //   // Check if we're loading a blueprint
  //   if (blueprintId) {
  //     // We'll receive events from AgentFlowBuilder to update button states
  //     setShowHeaderButtons(true);
  //   }
  // }, [searchParams]);

  useEffect(() => {
    const handleCloneComplete = () => {
      setIsCloning(false);
      setShowCloneNameDialog(false);
    };

    const handleBlueprintLoaded = (event: CustomEvent) => {
      const { blueprintName } = event.detail;
      setBlueprintName(blueprintName);
      setShowVettedAgentPopup(true);
    };

    window.addEventListener(
      "orchestration:clone-complete",
      handleCloneComplete,
    );
    window.addEventListener(
      "orchestration:blueprint-loaded",
      handleBlueprintLoaded as EventListener,
    );

    return () => {
      window.removeEventListener(
        "orchestration:clone-complete",
        handleCloneComplete,
      );
      window.removeEventListener(
        "orchestration:blueprint-loaded",
        handleBlueprintLoaded as EventListener,
      );
    };
  }, []);

  // Handle clone parameter from URL (for post-login clone)
  useEffect(() => {
    if (cloneParam && blueprintId && currentUser) {
      try {
        const decodedCloneName = decodeURIComponent(cloneParam);
        setInputValue(decodedCloneName);
        setShowCloneNameDialog(true);
      } catch (error) {
        console.error("Error handling clone parameter:", error);
      }
    }
  }, [cloneParam, blueprintId, currentUser]);

  // Event handlers that will be called from AgentFlowBuilder
  const handlePublishBlueprint = () => {
    window.dispatchEvent(new CustomEvent("orchestration:publish-blueprint"));
  };

  const handleShowDocs = () => {
    window.dispatchEvent(new CustomEvent("orchestration:show-docs"));
  };

  const handleCloneBlueprint = (blueprintName: string) => {
    window.dispatchEvent(
      new CustomEvent("orchestration:clone-blueprint", {
        detail: {
          blueprintName,
        },
      }),
    );
    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
      mixpanel.track("Clone blueprint clicked", {
        blueprintId,
        nameOfBlueprint: inputValue,
      });
  };

  const handleSaveChanges = () => {
    console.log("=== HEADER SAVE BUTTON CLICKED ===");
    window.dispatchEvent(new CustomEvent("orchestration:save-changes"));
  };

  const handleShareBlueprint = () => {
    if (blueprintId) {
      const blueprintUrl = `${window.location.origin}/blueprint?blueprint=${blueprintId}`;
      setBlueprintUrl(blueprintUrl);
      setShowShareModal(true);
    }
  };

  // Listen for events from AgentFlowBuilder
  useEffect(() => {
    const handleButtonStateUpdate = (event: CustomEvent) => {
      console.log("=== HEADER RECEIVED UPDATE ===");
      console.log("event.detail.pendingUpdates:", event.detail.pendingUpdates);
      console.log("event.detail.saving:", event.detail.saving);
      console.log("event.detail.isOwnBlueprint:", event.detail.isOwnBlueprint);

      // setShowHeaderButtons(event.detail.showButtons);
      setHasBlueprintDocs(event.detail.hasDocs);
      setIsPublicBlueprint(event.detail.isPublicBlueprint || false);
      setIsOwnBlueprint(event.detail.isOwnBlueprint || false);
      setInputValue(event.detail.blueprintName ?? "");
      if (event.detail.pendingUpdates !== undefined) {
        setPendingUpdates(event.detail.pendingUpdates);
      }
      if (event.detail.saving !== undefined) {
        setSaving(event.detail.saving);
      }

      console.log("=== HEADER STATE AFTER UPDATE ===");
      console.log("pendingUpdates:", event.detail.pendingUpdates);
      console.log("saving:", event.detail.saving);
      console.log(
        "Button should be disabled:",
        event.detail.saving || event.detail.pendingUpdates === 0,
      );
    };

    window.addEventListener(
      "orchestration:update-header-buttons",
      handleButtonStateUpdate as EventListener,
    );

    return () => {
      window.removeEventListener(
        "orchestration:update-header-buttons",
        handleButtonStateUpdate as EventListener,
      );
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex h-full w-full flex-col p-8"
    >
      <div className="mb-6 flex items-start justify-between">
        <PageTitle
          title={blueprintName || "Avanade Manager"}
          description={
            <span className="inline-flex items-center gap-1 space-x-1 text-sm text-muted-foreground">
              <p>
                Design and manage multi-agent workflows with visual flow
                builder.
              </p>
              <Link
                to="https://www.avanade.com/en-gb/services"
                target="_blank"
                className="flex items-center text-link underline-offset-4 hover:underline"
                onClick={() => {
                  if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                    mixpanel.track("Docs-clicked", {
                      feature: "Avanade Manager",
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
                      feature: "Avanade Manager",
                    });
                }}
              >
                API
                <ArrowTopRightIcon className="ml-1 size-3" />
              </Link>
              <Link
                to="https://www.youtube.com/watch?v=NwmG-jPZu-g"
                target="_blank"
                className="flex items-center text-link underline-offset-4 hover:underline"
                onClick={() => {
                  if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                    mixpanel.track("Video-clicked", {
                      feature: "Avanade Manager",
                    });
                }}
              >
                Video
                <ArrowTopRightIcon className="ml-1 size-3" />
              </Link>
            </span>
          }
        />

        {/* Header Buttons */}
        <div className="flex items-center gap-2">
          {/* Create Agent Button */}
          <Button
            onClick={() => setShowCreateAgentModal(true)}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Agent
          </Button>

          {/* Save Changes Button - Now handles both agent updates AND blueprint changes */}
          {isOwnBlueprint && (
            <Button
              onClick={handleSaveChanges}
              disabled={saving || pendingUpdates === 0}
              className="text-white disabled:bg-gray-400 disabled:opacity-50"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving
                ? "Saving..."
                : pendingUpdates > 0
                  ? `Save Changes (${pendingUpdates})`
                  : "No Changes"}
            </Button>
          )}

          {/* README Button */}
          {hasBlueprintDocs && (
            <Button
              onClick={handleShowDocs}
              variant="outline"
              className="border-primary/20 hover:border-primary/40"
            >
              <Eye className="mr-2 h-4 w-4" />
              README
            </Button>
          )}

          {/* Share Button - only show for blueprints */}
          {blueprintId && (
            <Button
              onClick={handleShareBlueprint}
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          )}

          {/* Show clone button for public blueprints that are not owned by the user */}
          {isPublicBlueprint && !isOwnBlueprint && (
            <Button
              onClick={() => setShowCloneNameDialog(true)}
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <Copy className="mr-2 h-4 w-4" />
              Clone Blueprint
            </Button>
          )}

          {/* Show publish button for new flows or blueprints owned by the user */}
          {(!isPublicBlueprint || isOwnBlueprint) &&
            (isLyzrUser || !isRestrictedPlan) && (
              <Button
                onClick={handlePublishBlueprint}
                variant="outline"
                className="border-primary text-primary"
              >
                {blueprintId ? (
                  <Pen className="mr-2 h-4 w-4" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {blueprintId ? "Edit Blueprint" : "Publish as Blueprint"}
              </Button>
            )}
        </div>
      </div>

      <div className="-m-8 mt-0 flex-1 overflow-hidden">
        <Suspense fallback={<Loader />}>
          <OrchestrationApp />
        </Suspense>
      </div>

      {/* Share Blueprint Modal */}
      <ShareBlueprintModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        blueprintUrl={blueprintUrl}
      />

      {/* Create Agent Modal */}
      <CreateAgentModal
        isOpen={showCreateAgentModal}
        onClose={() => setShowCreateAgentModal(false)}
        onAgentCreated={handleAgentCreated}
      />
      <CloneBlueprintDialog
        open={showCloneNameDialog}
        onOpenChange={setShowCloneNameDialog}
        onClone={handleCloneBlueprint}
        initialName={inputValue}
        isCloning={isCloning}
        setIsCloning={setIsCloning}
      />

      {/* Verified Agent Template Popup */}
      <VettedAgentPopup
        isVisible={showVettedAgentPopup}
        onClose={() => setShowVettedAgentPopup(false)}
        blueprintName={blueprintName}
        blueprintId={blueprintId || undefined}
      />
    </motion.div>
  );
}
