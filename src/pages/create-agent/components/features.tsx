import { useState, useEffect, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ConfigureRag } from "./configure-rag";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  FEATURES_SECTIONS,
  FEATURES_CONFIG,
  isToolCallingFeature,
  type FeatureDefinition,
  type ExtraComponentProps,
  type FeatureConfig,
  type UpdateFeaturesOptions,
} from "@/data/features";
import { ConfigureText2Sql } from "./configure-text2sql";
import { isDevEnv, isMixpanelActive, PlanType } from "@/lib/constants";
// import { ConfigurePii } from "./configure-pii";
import { Link } from "react-router-dom";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { ConfigureVoiceAgent } from "./configure-voice";
import { ConfigureResponsibleAI } from "./configure-responsible-ai";
import FeatureBadge from "./feature-badge";
import { ConfigureMemory } from "./configure-memory";
import { ConfigureContext } from "./configure-context";
import { ConfigureScheduler } from "./configure-scheduler";
import { ConfigureTrigger } from "./configure-trigger";
import mixpanel from "mixpanel-browser";
import { NeedsUpgrade } from "@/components/custom/needs-upgrade";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { toast } from "sonner";
import { ConfigureImageAsOutput } from "./configure-image-as-output";
import { useSchedulerService } from "./automation.service";
import useStore from "@/lib/store";
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

const ComingSoonBadge = () => (
  <Badge variant="secondary" className="text-xs">
    Coming Soon
  </Badge>
);

FEATURES_CONFIG.MEMORY.extraComponent = ({
  updateFeatures,
  featureName,
  openDialog,
}: ExtraComponentProps) => (
  <ConfigureMemory
    updateFeatures={updateFeatures}
    featureName={featureName}
    openDialog={openDialog}
  />
);

FEATURES_CONFIG.RAG.extraComponent = ({
  updateFeatures,
  featureName,
  openDialog,
}: ExtraComponentProps) => (
  <ConfigureRag
    updateFeatures={updateFeatures}
    featureName={featureName}
    openDialog={openDialog}
  />
);

FEATURES_CONFIG.TEXT_TO_SQL.extraComponent = ({
  featureName,
  openDialog,
  updateFeatures,
}: ExtraComponentProps) => (
  <ConfigureText2Sql
    featureName={featureName}
    openDialog={openDialog}
    updateFeatures={updateFeatures}
  />
);

FEATURES_CONFIG.VOICE.extraComponent = ({
  featureName,
  openDialog,
  updateFeatures,
}: ExtraComponentProps) => (
  <ConfigureVoiceAgent
    featureName={featureName}
    openDialog={openDialog}
    updateFeatures={updateFeatures}
  />
);

FEATURES_CONFIG.RESPONSIBLE_AI.extraComponent = ({
  featureName,
  openDialog,
  updateFeatures,
}: ExtraComponentProps) => (
  <ConfigureResponsibleAI
    featureName={featureName}
    openDialog={openDialog}
    updateFeatures={updateFeatures}
  />
);

FEATURES_CONFIG.CONTEXT.extraComponent = ({
  featureName,
  openDialog,
  updateFeatures,
}: ExtraComponentProps) => (
  <ConfigureContext
    featureName={featureName}
    openDialog={openDialog}
    updateFeatures={updateFeatures}
  />
);

FEATURES_CONFIG.IMAGEASOUTPUT.extraComponent = ({
  featureName,
  openDialog,
  updateFeatures,
  initialConfig,
}: ExtraComponentProps) => (
  <ConfigureImageAsOutput
    featureName={featureName}
    openDialog={openDialog}
    updateFeatures={updateFeatures}
    config={initialConfig}
  />
);

FEATURES_CONFIG.SCHEDULER.extraComponent = ({
  featureName,
  openDialog,
  updateFeatures,
  initialConfig,
}: ExtraComponentProps) => (
  <ConfigureScheduler
    featureName={featureName}
    openDialog={openDialog}
    updateFeatures={updateFeatures}
    initialConfig={initialConfig}
  />
);

FEATURES_CONFIG.TRIGGER.extraComponent = ({
  featureName,
  openDialog,
  updateFeatures,
  initialConfig,
}: ExtraComponentProps) => (
  <ConfigureTrigger
    featureName={featureName}
    openDialog={openDialog}
    updateFeatures={updateFeatures}
    initialConfig={initialConfig}
  />
);

interface FormValues {
  features: FeatureConfig[];
  name: string;
  description?: string;
  optional_examples?: string;
  tools?: string[];
  provider_id: string;
  model: string;
  temperature: number;
  top_p: number;
  [key: string]: any;
}

interface FeaturesProps {
  form: UseFormReturn<FormValues>;
  onEnabledCountChange?: (count: number) => void;
  agentId?: string;
}

export const Features: React.FC<FeaturesProps> = ({
  form,
  onEnabledCountChange,
  agentId,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [triggerRagDialog, setTriggerRagDialog] = useState(false);
  const [triggerText2sqlDialog, setTriggerText2sqlDialog] = useState(false);
  const [triggerRAIDialog, setTriggerRAIDialog] = useState(false);
  const [triggerMemoryDialog, setTriggerMemoryDialog] = useState(false);
  const [triggerImageAsOutputDialog, setTriggerImageAsOutputDialog] =
    useState(false);
  // const [triggerPiiDialog, setTriggerPiiDialog] = useState(false);
  // const [triggerPromptInjectionDialog, setTriggerPromptInjectionDialog] =
  //   useState(false);
  const [triggerGroundednessDialog, setTriggerGroundednessDialog] =
    useState(false);
  const [triggerVoiceConfigDialog, setTriggerVoiceConfigDialog] =
    useState(false);
  const [triggerContextDialog, setTriggerContextDialog] = useState(false);
  const [triggerSchedulerDialog, setTriggerSchedulerDialog] = useState(false);
  const [showPauseAllDialog, setShowPauseAllDialog] = useState(false);
  const [isPausingAll, setIsPausingAll] = useState(false);
  const [triggerTriggerDialog, setTriggerTriggerDialog] = useState(false);
  const [showPauseAllWebhooksDialog, setShowPauseAllWebhooksDialog] = useState(false);
  const [isPausingAllWebhooks, setIsPausingAllWebhooks] = useState(false);
  const [upgradeVisbile, setUpgradeVisible] = useState<{
    title: string;
    description: string;
    open: boolean;
  }>({
    open: false,
    title: "",
    description: "",
  });
  const features = form.watch("features") || [];
  const fileOutput = form.watch("file_output");
  const imageOutputConfig = form.watch("image_output_config");

  const usage_data = useManageAdminStore((state) => state.usage_data);
  const apiKey = useStore((state) => state?.api_key ?? "");
  const { getScheduleByAgentId, bulkPauseSchedules, webhookAction } = useSchedulerService({ apiKey });

  const isPlanBlocked = [
    PlanType.Community,
    PlanType.Starter,
    PlanType.Pro,
    PlanType.Pro_Yearly,
  ].includes(usage_data?.plan_name as PlanType);

  useEffect(() => {
    Object.values(FEATURES_CONFIG).forEach((f) => form.setValue(f.name, false));

    features.forEach((feature: any) => {
      // Case-insensitive to handle both "memory" and "MEMORY" type variants
      const config = Object.values(FEATURES_CONFIG).find(
        (f) => f.type.toUpperCase() === feature.type?.toUpperCase(),
      );
      if (config) form.setValue(config.name, true);

      if (
        ["LONG_TERM_MEMORY", "SHORT_TERM_MEMORY"].includes(
          feature.type?.toUpperCase(),
        )
      ) {
        form.setValue(FEATURES_CONFIG["MEMORY"].name, true);
      }

      if (feature.type === "SRS") {
        const { modules } = feature.config;
        if (modules.reflection)
          form.setValue(FEATURES_CONFIG.REFLECTION.name, true);
        if (modules.bias) form.setValue(FEATURES_CONFIG.FAIRNESS.name, true);
        // if (!isDevEnv) {
        //   if (modules.toxicity)
        //     form.setValue(FEATURES_CONFIG.TOXICITY_CHECK.name, true);
        // }
      }
    });

    if (fileOutput !== undefined) {
      form.setValue(FEATURES_CONFIG.FILEASOUTPUT.name, fileOutput);
    }

    if (imageOutputConfig !== null && imageOutputConfig !== "") {
      form.setValue("image_output_config", imageOutputConfig);
      let parsedImageConfig = null;
      try {
        parsedImageConfig =
          typeof imageOutputConfig === "string"
            ? JSON.parse(imageOutputConfig)
            : imageOutputConfig;
      } catch (error) {
        console.error("Error parsing image_output_config:", error);
      }

      if (parsedImageConfig && parsedImageConfig.model) {
        form.setValue(FEATURES_CONFIG.IMAGEASOUTPUT.name, true);

        const hasImageOutputFeature = features.some(
          (f) => f.type === "IMAGEASOUTPUT",
        );
        if (!hasImageOutputFeature) {
          const updatedFeatures = [...features];
          updatedFeatures.push({
            type: "IMAGEASOUTPUT",
            config: parsedImageConfig,
            priority: 0,
          });
          form.setValue("features", updatedFeatures);
        }
      }
    }

    const currentFeatures = form.getValues("features") || [];
    let featureCount = 0;
    currentFeatures.forEach((feature) => {
      if (feature.type === "SRS") {
        const { modules } = feature.config;
        if (modules.reflection) featureCount++;
        if (modules.bias) featureCount++;
        // if (modules.toxicity) featureCount++;
      } else if (!isToolCallingFeature(feature)) {
        featureCount++;
      }
    });

    onEnabledCountChange?.(featureCount);
  }, [features, form, onEnabledCountChange, fileOutput, imageOutputConfig]);

  const updateFeatures = (
    featureName: string,
    enabled: boolean,
    ragId?: string,
    ragName?: string,
    config?: {
      params?: {
        top_k?: number;
        retrieval_type?: string;
        score_threshold?: number;
      };
      [key: string]: any;
    },
    options?: UpdateFeaturesOptions,
  ): void => {
    const currentFeatures = form.getValues("features") || [];
    const featureConfig = Object.values(FEATURES_CONFIG).find(
      (f: FeatureDefinition) => f.name === featureName,
    );
    if (!featureConfig) return;

    const shouldDirty = options?.shouldDirty !== false;

    /* Preserve this statement to keep ragName as a prop.
       Can be only removed when the ragName dependency is absolutely removed.
    */
    console.info(ragName);

    form.setValue(featureName, enabled, {
      shouldValidate: true,
      shouldDirty,
    });

    if (featureConfig.type === "PROMPT_INJECTION" && enabled) {
      const updatedFeatures = currentFeatures.filter(
        (f) => f.type !== "PROMPT_INJECTION",
      );
      updatedFeatures.push({
        type: "PROMPT_INJECTION",
        config: config || {},
        priority: 0,
      });
      form.setValue("features", updatedFeatures, { shouldDirty });
      const featureCount = updatedFeatures.filter(
        (f) => !isToolCallingFeature(f),
      ).length;
      onEnabledCountChange?.(featureCount);
      return;
    }

    if (featureConfig.type === "VOICE" && enabled) {
      const updatedFeatures = currentFeatures.filter((f) => f.type !== "VOICE");
      updatedFeatures.push({
        type: "VOICE",
        config: config || {},
        priority: 0,
      });
      form.setValue("features", updatedFeatures, { shouldDirty });
      const featureCount = updatedFeatures.filter(
        (f) => !isToolCallingFeature(f),
      ).length;
      onEnabledCountChange?.(featureCount);
    }

    if (featureConfig.type === "GROUNDEDNESS" && enabled) {
      const updatedFeatures = currentFeatures.filter(
        (f) => f.type !== "GROUNDEDNESS",
      );
      updatedFeatures.push({
        type: "GROUNDEDNESS",
        config: config || {},
        priority: 0,
      });
      form.setValue("features", updatedFeatures, { shouldDirty });
      const featureCount = updatedFeatures.filter(
        (f) => !isToolCallingFeature(f),
      ).length;
      onEnabledCountChange?.(featureCount);
      return;
    }

    if (featureConfig.type === "PII" && enabled) {
      const updatedFeatures = currentFeatures.filter((f) => f.type !== "PII");
      updatedFeatures.push({
        type: "PII",
        config: config || {},
        priority: 0,
      });
      form.setValue("features", updatedFeatures, { shouldDirty });
      const featureCount = updatedFeatures.filter(
        (f) => !isToolCallingFeature(f),
      ).length;
      onEnabledCountChange?.(featureCount);
      return;
    }

    if (featureConfig.type === "FILEASOUTPUT") {
      form.setValue("file_output", enabled, { shouldDirty });
    }

    if (featureConfig.type === "IMAGEASOUTPUT" && enabled) {
      if (!config?.model) {
        setTriggerImageAsOutputDialog(true);
      } else {
        setTriggerImageAsOutputDialog(false);
      }

      form.setValue("image_output_config", JSON.stringify(config || {}), {
        shouldDirty,
      });
      const updatedFeatures = currentFeatures.filter(
        (f) => f.type !== "IMAGEASOUTPUT",
      );
      updatedFeatures.push({
        type: "IMAGEASOUTPUT",
        config: config || {},
        priority: 0,
      });
      form.setValue("features", updatedFeatures, { shouldDirty });
      const featureCount = updatedFeatures.filter(
        (f) => !isToolCallingFeature(f),
      ).length;
      onEnabledCountChange?.(featureCount);
      return;
    }

    if (
      featureConfig.type === "REFLECTION" ||
      featureConfig.type === "FAIRNESS"
    ) {
      const isReflectionEnabled = form.getValues(
        FEATURES_CONFIG.REFLECTION.name,
      );
      const isFairnessEnabled = form.getValues(FEATURES_CONFIG.FAIRNESS.name);

      const updatedFeatures = currentFeatures.filter((f) => f.type !== "SRS");

      if (isReflectionEnabled || isFairnessEnabled) {
        updatedFeatures.push({
          type: "SRS",
          config: {
            max_tries: 1,
            modules: {
              reflection: isReflectionEnabled,
              bias: isFairnessEnabled,
            },
          },
          priority: 0,
        });
      }

      form.setValue("features", updatedFeatures, { shouldDirty });
      const srsCount = Number(isReflectionEnabled) + Number(isFairnessEnabled);
      const otherFeaturesCount = updatedFeatures.filter(
        (f) => !isToolCallingFeature(f) && f.type !== "SRS",
      ).length;
      onEnabledCountChange?.(srsCount + otherFeaturesCount);
      return;
    }

    // Case-insensitive filter to handle both "memory" and "MEMORY" type variants
    let updatedFeatures = currentFeatures.filter(
      (f) => f.type.toUpperCase() !== featureConfig.type.toUpperCase(),
    );

    if (enabled) {
      if (featureName === FEATURES_CONFIG.RAG.name) {
        updatedFeatures.push({
          type: featureConfig.type,
          priority: 0,
          config: {
            ...(config ?? {}),
          },
        });
      } else if (featureName === FEATURES_CONFIG.TEXT_TO_SQL.name) {
        updatedFeatures.push({
          type: featureConfig.type,
          priority: 0,
          config: {
            ...(config ?? {}),
          },
        });
      } else if (featureName === FEATURES_CONFIG.RESPONSIBLE_AI.name) {
        updatedFeatures.push({
          type: featureConfig.type,
          priority: 0,
          config: {
            ...(config ?? {}),
          },
        });
      } else if (featureName === FEATURES_CONFIG.VOICE.name) {
        updatedFeatures.push({
          type: featureConfig.type,
          priority: 0,
          config: {
            voice_id: config?.voice_id || "",
            elevenlabs_key: config?.elevenlabs_key || "",
            deepgram_key: config?.deepgram_key || "",
          },
        });
      } else if (featureName === FEATURES_CONFIG.MEMORY.name) {
        updatedFeatures.push({
          type: featureConfig.type,
          priority: 0,
          config: {
            ...(config ?? {
              provider: "cognis",
              lyzr_memory: {
                provider_type: "cognis",
                params: {
                  cross_session: false,
                },
              },
            }),
          },
        });
      } else if (featureName === FEATURES_CONFIG.CONTEXT.name) {
        updatedFeatures.push({
          type: featureConfig.type,
          priority: 10,
          config: {
            context_id: config?.context_id || "",
            context_name: config?.context_name || "",
          },
        });
      } else if (featureName === FEATURES_CONFIG.SCHEDULER.name) {
        updatedFeatures.push({
          type: featureConfig.type,
          priority: 0,
          config: {
            name: config?.name || "",
          },
        });
      } else {
        updatedFeatures.push({
          type: featureConfig.type,
          priority: 0,
          config: {},
        });
      }
    }

    console.log(
      enabled,
      featureName === FEATURES_CONFIG.MEMORY.name,
      !config?.memory_credential_id || !config?.memory_id || !config?.provider,
    );
    if (
      enabled &&
      featureName === FEATURES_CONFIG.MEMORY.name &&
      config?.provider !== "lyzr" &&
      config?.provider !== "cognis" &&
      (!config?.memory_credential_id || !config?.memory_id || !config?.provider)
    ) {
      setTriggerMemoryDialog(true);
    } else if (
      enabled &&
      featureName === FEATURES_CONFIG.MEMORY.name &&
      (config?.provider === "lyzr" ||
        config?.provider === "cognis" ||
        (config?.memory_credential_id && config?.memory_id && config?.provider))
    ) {
      setTriggerMemoryDialog(false);
    }

    if (!enabled && featureName === FEATURES_CONFIG.IMAGEASOUTPUT.name) {
      setTriggerImageAsOutputDialog(false);
      const updatedFeatures = currentFeatures.filter(
        (f) => f.type !== "IMAGEASOUTPUT",
      );
      form.setValue("features", updatedFeatures, { shouldDirty });
      form.setValue("image_output_config", "", { shouldDirty });
      const featureCount = updatedFeatures.filter(
        (f) => !isToolCallingFeature(f),
      ).length;
      onEnabledCountChange?.(featureCount);
    }

    if (!enabled && featureName === FEATURES_CONFIG.SCHEDULER.name) {
      setTriggerSchedulerDialog(false);
    }

    if (!enabled && featureName === FEATURES_CONFIG.TRIGGER.name) {
      setTriggerTriggerDialog(false);
    }

    if (enabled && featureName === FEATURES_CONFIG.RAG.name && !ragId) {
      setTriggerRagDialog(true);
    } else if (enabled && featureName === FEATURES_CONFIG.RAG.name && ragId) {
      setTriggerRagDialog(false);
    }

    if (enabled && featureName === FEATURES_CONFIG.TEXT_TO_SQL.name && !ragId) {
      setTriggerText2sqlDialog(true);
    } else if (
      enabled &&
      featureName === FEATURES_CONFIG.TEXT_TO_SQL.name &&
      ragId
    ) {
      setTriggerText2sqlDialog(false);
    }

    if (
      enabled &&
      featureName === FEATURES_CONFIG.RESPONSIBLE_AI.name &&
      !ragId
    ) {
      setTriggerRAIDialog(true);
    } else if (
      enabled &&
      featureName === FEATURES_CONFIG.RESPONSIBLE_AI.name &&
      ragId
    ) {
      setTriggerRAIDialog(false);
    }

    if (!isDevEnv) {
      // if (enabled && featureName === FEATURES_CONFIG.PII_REDACTION.name) {
      //   setTriggerPiiDialog(true);
      // }

      // if (enabled && featureName === FEATURES_CONFIG.PROMPT_INJECTION.name) {
      //   setTriggerPromptInjectionDialog(true);
      // }

      if (enabled && featureName === FEATURES_CONFIG.GROUNDEDNESS.name) {
        setTriggerGroundednessDialog(true);
      }
    }

    if (enabled && featureName === FEATURES_CONFIG.VOICE.name) {
      setTriggerVoiceConfigDialog(true);
    }

    if (
      enabled &&
      featureName === FEATURES_CONFIG.CONTEXT.name &&
      !config?.context_id
    ) {
      setTriggerContextDialog(true);
    } else if (
      enabled &&
      featureName === FEATURES_CONFIG.CONTEXT.name &&
      config?.context_id
    ) {
      setTriggerContextDialog(false);
    }

    if (
      enabled &&
      featureName === FEATURES_CONFIG.SCHEDULER.name &&
      !config?.name
    ) {
      setTriggerSchedulerDialog(true);
    } else if (
      enabled &&
      featureName === FEATURES_CONFIG.SCHEDULER.name &&
      config?.name
    ) {
      setTriggerSchedulerDialog(false);
    }

    if (
      enabled &&
      featureName === FEATURES_CONFIG.TRIGGER.name &&
      !config?.webhook_url
    ) {
      setTriggerTriggerDialog(true);
    } else if (
      enabled &&
      featureName === FEATURES_CONFIG.TRIGGER.name &&
      config?.webhook_url
    ) {
      setTriggerTriggerDialog(false);
    }

    form.setValue("features", updatedFeatures, { shouldDirty });
    const featureCount = updatedFeatures.filter(
      (f) => !isToolCallingFeature(f),
    ).length;
    onEnabledCountChange?.(featureCount);
  };

  useEffect(() => {
    const checkScheduler = async () => {
      if (!agentId || !apiKey) return;

      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        const response = await getScheduleByAgentId({
          agentId,
        });

        const schedules = response?.data?.schedules || [];
        // Only enable if at least one schedule is active
        const activeSchedules = schedules.filter(
          (s: any) => s.is_active !== false,
        );

        const schedulerFeatureName = FEATURES_CONFIG.SCHEDULER.name;
        const isSchedulerEnabled = form.getValues(schedulerFeatureName);

        if (activeSchedules.length > 0 && !isSchedulerEnabled) {
          // Enable the feature if there's at least one active schedule
          const schedule = activeSchedules[0];
          const currentFeatures = form.getValues("features") || [];
          const featureConfig = Object.values(FEATURES_CONFIG).find(
            (f: FeatureDefinition) => f.name === schedulerFeatureName,
          );

          if (featureConfig) {
            const updatedFeatures = currentFeatures.filter(
              (f) =>
                f.type.toUpperCase() !== featureConfig.type.toUpperCase(),
            );
            updatedFeatures.push({
              type: featureConfig.type,
              priority: 0,
              config: {
                name: schedule.message || "",
              },
            });

            form.setValue(schedulerFeatureName, true, { shouldDirty: false });
            form.setValue("features", updatedFeatures, {
              shouldDirty: false,
            });

            const featureCount = updatedFeatures.filter(
              (f) => !isToolCallingFeature(f),
            ).length;
            onEnabledCountChange?.(featureCount);
          }
        } else if (activeSchedules.length === 0 && isSchedulerEnabled) {
          // Disable the feature if no active schedules
          const currentFeatures = form.getValues("features") || [];
          const updatedFeatures = currentFeatures.filter(
            (f) => f.type.toUpperCase() !== "SCHEDULER",
          );
          form.setValue(schedulerFeatureName, false, { shouldDirty: false });
          form.setValue("features", updatedFeatures, { shouldDirty: false });

          const featureCount = updatedFeatures.filter(
            (f) => !isToolCallingFeature(f),
          ).length;
          onEnabledCountChange?.(featureCount);
        }
      } catch (error: any) {
        console.error("Error checking for scheduler:", error);
      }
    };

    checkScheduler();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, apiKey]);

  useEffect(() => {
    const checkTrigger = async () => {
      if (!agentId || !apiKey) return;

      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        const response = await getScheduleByAgentId({
          agentId,
        });

        const webhooks = response?.data?.webhooks || [];
        // Only enable if at least one webhook is active
        const activeWebhooks = webhooks.filter(
          (w: any) => w.is_active !== false,
        );

        const triggerFeatureName = FEATURES_CONFIG.TRIGGER.name;
        const isTriggerEnabled = form.getValues(triggerFeatureName);

        if (activeWebhooks.length > 0 && !isTriggerEnabled) {
          // Enable the feature if there's at least one active webhook
          const webhook = activeWebhooks[0];
          const currentFeatures = form.getValues("features") || [];
          const featureConfig = Object.values(FEATURES_CONFIG).find(
            (f: FeatureDefinition) => f.name === triggerFeatureName,
          );

          if (featureConfig) {
            const updatedFeatures = currentFeatures.filter(
              (f) =>
                f.type.toUpperCase() !== featureConfig.type.toUpperCase(),
            );
            updatedFeatures.push({
              type: featureConfig.type,
              priority: 0,
              config: {
                webhook_url: webhook.webhook_url || "",
              },
            });

            form.setValue(triggerFeatureName, true, { shouldDirty: false });
            form.setValue("features", updatedFeatures, {
              shouldDirty: false,
            });

            const featureCount = updatedFeatures.filter(
              (f) => !isToolCallingFeature(f),
            ).length;
            onEnabledCountChange?.(featureCount);
          }
        } else if (activeWebhooks.length === 0 && isTriggerEnabled) {
          // Disable the feature if no active webhooks
          const currentFeatures = form.getValues("features") || [];
          const updatedFeatures = currentFeatures.filter(
            (f) => f.type.toUpperCase() !== "TRIGGER",
          );
          form.setValue(triggerFeatureName, false, { shouldDirty: false });
          form.setValue("features", updatedFeatures, { shouldDirty: false });

          const featureCount = updatedFeatures.filter(
            (f) => !isToolCallingFeature(f),
          ).length;
          onEnabledCountChange?.(featureCount);
        }
      } catch (error: any) {
        console.error("Error checking for trigger:", error);
      }
    };

    checkTrigger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, apiKey]);

  const handlePauseAllAndDisable = useCallback(async () => {
    if (!agentId || !apiKey) return;

    setIsPausingAll(true);
    try {
      const response = await getScheduleByAgentId({ agentId });
      const schedules = response?.data?.schedules || [];
      
      const scheduleIds = schedules
        .map((s: any) => s.id || s._id)
        .filter(Boolean) as string[];

      if (scheduleIds.length > 0) {
        await bulkPauseSchedules(scheduleIds);
      }

      // Disable the feature since all schedules are now paused
      const currentFeatures = form.getValues("features") || [];
      const updatedFeatures = currentFeatures.filter(
        (f) => f.type.toUpperCase() !== "SCHEDULER",
      );
      form.setValue(FEATURES_CONFIG.SCHEDULER.name, false, { shouldDirty: true });
      form.setValue("features", updatedFeatures, { shouldDirty: true });
      setTriggerSchedulerDialog(false);

      const featureCount = updatedFeatures.filter(
        (f) => !isToolCallingFeature(f),
      ).length;
      onEnabledCountChange?.(featureCount);

      toast.success("All schedules have been paused");
    } catch (error) {
      console.error("Error pausing all schedules:", error);
      toast.error("Failed to pause schedulers");
    } finally {
      setIsPausingAll(false);
      setShowPauseAllDialog(false);
    }
  }, [agentId, apiKey, getScheduleByAgentId, bulkPauseSchedules, form, onEnabledCountChange]);

  const handlePauseWebhookAndDisable = useCallback(async () => {
    if (!agentId || !apiKey) return;

    setIsPausingAllWebhooks(true);
    try {
      const response = await getScheduleByAgentId({ agentId });
      const webhooks = response?.data?.webhooks || [];
      const activeWebhook = webhooks.find((w: any) => w.is_active !== false);

      if (activeWebhook?.id) {
        await webhookAction({ webhookId: activeWebhook.id, action: "pause" });
      }

      // Disable the feature since webhook is now paused
      const currentFeatures = form.getValues("features") || [];
      const updatedFeatures = currentFeatures.filter(
        (f) => f.type.toUpperCase() !== "TRIGGER",
      );
      form.setValue(FEATURES_CONFIG.TRIGGER.name, false, { shouldDirty: true });
      form.setValue("features", updatedFeatures, { shouldDirty: true });
      setTriggerTriggerDialog(false);

      const featureCount = updatedFeatures.filter(
        (f) => !isToolCallingFeature(f),
      ).length;
      onEnabledCountChange?.(featureCount);

      toast.success("Webhook paused");
    } catch (error) {
      console.error("Error pausing webhook:", error);
      toast.error("Failed to pause webhook");
    } finally {
      setIsPausingAllWebhooks(false);
      setShowPauseAllWebhooksDialog(false);
    }
  }, [agentId, apiKey, getScheduleByAgentId, webhookAction, form, onEnabledCountChange]);

  const filterFeatures = (
    searchTerm: string,
  ): {
    title: string;
    showTooltip?: boolean;
    needs_upgrade?: boolean;
    description?: string;
    features: FeatureDefinition[];
  }[] => {
    const blockFeatureAsPerPlanMap: Record<string, boolean> = {
      "features.voice": isPlanBlocked,
    };

    const filteredSections: {
      title: string;
      showTooltip?: boolean;
      needs_upgrade?: boolean;
      features: FeatureDefinition[];
    }[] = Object.entries(FEATURES_SECTIONS)
      .map(([_, section]) => ({
        ...section,
        needs_upgrade: isPlanBlocked && section.title !== "Core Features",
        features: Object.values(section.features).filter(
          (feature) =>
            (feature.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              feature.description
                .toLowerCase()
                .includes(searchTerm.toLowerCase())) &&
            feature.isEnabled,
        ),
      }))
      .map((section) => ({
        ...section,
        features: section.features.map((f) => ({
          ...f,
          needs_upgrade: blockFeatureAsPerPlanMap[f.name] ?? false,
        })),
      }));

    return filteredSections.filter((section) => section.features.length > 0);
  };

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden">
        <Form {...form}>
          <div className="flex-none px-2">
            <div className="flex items-center rounded-md border border-input px-2">
              <Search className="size-5" />
              <Input
                placeholder="Search features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-none bg-transparent shadow-none focus:outline-none focus:ring-0"
              />
            </div>
          </div>
          <div className="no-scrollbar mt-4 flex-1 overflow-y-auto px-2">
            <div className="grid grid-cols-1 gap-4 pr-1 sm:gap-6">
              {filterFeatures(searchQuery).map((section) => (
                <div key={section.title}>
                  <div className="sticky top-0 z-20 mb-3 flex items-center gap-2 bg-background sm:mb-4 sm:gap-4">
                    <h3 className="text-sm font-semibold text-primary">
                      {section.title}
                    </h3>
                    <div className="h-px flex-grow bg-gray-200 dark:bg-gray-700" />
                    <div className="pr-4">
                      {section?.needs_upgrade && (
                        <Badge
                          variant="premium"
                          onClick={() =>
                            setUpgradeVisible({
                              title: section.title,
                              description: section?.description ?? "",
                              open: true,
                            })
                          }
                        >
                          Upgrade
                        </Badge>
                      )}
                    </div>
                  </div>
                  {!section?.needs_upgrade && (
                    <div className="grid grid-cols-1 gap-2">
                      {section.features.map((feature: FeatureDefinition) => (
                        <FormField
                          key={feature.name}
                          control={form.control}
                          name={feature.name}
                          render={({ field }) => (
                            <FormItem className="col-span-1">
                              <div className="rounded-xl border border-input p-3 sm:p-4">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <TooltipProvider>
                                        <Tooltip delayDuration={300}>
                                          <TooltipTrigger asChild>
                                            <div className="flex cursor-help items-center gap-2">
                                              <p className="text-[0.8rem] font-medium text-gray-600 underline decoration-muted-foreground/50 decoration-dotted underline-offset-2 hover:decoration-muted-foreground dark:text-gray-300">
                                                {feature.title}
                                              </p>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="w-[200px] whitespace-pre-line">
                                              {feature.description}
                                            </p>
                                            {feature?.doc_link && (
                                              <Link
                                                to={feature?.doc_link}
                                                target="_blank"
                                                className="mt-3 inline-flex items-center text-xs text-link underline-offset-4 hover:underline"
                                                onClick={() => {
                                                  if (
                                                    mixpanel.hasOwnProperty(
                                                      "cookie",
                                                    ) &&
                                                    isMixpanelActive
                                                  )
                                                    mixpanel.track(
                                                      "Docs-clicked",
                                                      {
                                                        feature: feature.title,
                                                      },
                                                    );
                                                }}
                                              >
                                                Docs
                                                <ArrowTopRightIcon className="ml-1 mr-2 size-3" />
                                              </Link>
                                            )}
                                            {feature?.api_link && (
                                              <Link
                                                to={feature?.api_link}
                                                target="_blank"
                                                className="mt-3 inline-flex items-center text-xs text-link underline-offset-4 hover:underline"
                                                onClick={() => {
                                                  if (
                                                    mixpanel.hasOwnProperty(
                                                      "cookie",
                                                    ) &&
                                                    isMixpanelActive
                                                  )
                                                    mixpanel.track(
                                                      "API-clicked",
                                                      {
                                                        feature: feature.title,
                                                      },
                                                    );
                                                }}
                                              >
                                                API
                                                <ArrowTopRightIcon className="ml-1 mr-2 size-3" />
                                              </Link>
                                            )}
                                            {feature?.help_video && (
                                              <Link
                                                to={feature?.help_video}
                                                target="_blank"
                                                className="mt-3 inline-flex items-center text-xs text-link underline-offset-4 hover:underline"
                                                onClick={() => {
                                                  if (
                                                    mixpanel.hasOwnProperty(
                                                      "cookie",
                                                    ) &&
                                                    isMixpanelActive
                                                  )
                                                    mixpanel.track(
                                                      "Video-clicked",
                                                      {
                                                        feature: feature.title,
                                                      },
                                                    );
                                                }}
                                              >
                                                Video
                                                <ArrowTopRightIcon className="ml-1 size-3" />
                                              </Link>
                                            )}
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      {feature.beta && (
                                        <Badge className="bg-neutral-200 font-normal text-black dark:bg-zinc-700 dark:text-zinc-300">
                                          Beta
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {feature?.needs_upgrade ? (
                                        <Badge
                                          variant="premium"
                                          onClick={() =>
                                            setUpgradeVisible({
                                              title: feature?.title,
                                              description:
                                                feature?.description ?? "",
                                              open: true,
                                            })
                                          }
                                        >
                                          Upgrade
                                        </Badge>
                                      ) : feature.isEnabled ? (
                                        <FormControl>
                                          <Switch
                                            checked={field.value}
                                            disabled={
                                              (feature.name ===
                                                  FEATURES_CONFIG.TRIGGER
                                                    .name) &&
                                              !agentId ||
                                              feature.name ===
                                              FEATURES_CONFIG.SCHEDULER
                                                .name && !agentId
                                            }
                                            onCheckedChange={(
                                              checked: boolean,
                                            ) => {
                                              // if (!isDevEnv) {
                                              //   if (
                                              //     feature.name ===
                                              //     FEATURES_CONFIG.PII_REDACTION.name
                                              //   ) {
                                              //     setTriggerPiiDialog(checked);
                                              //   }
                                              // }

                                              if (
                                                field.name ==
                                                "features.memory" &&
                                                checked &&
                                                !form.getValues(
                                                  "store_messages",
                                                )
                                              ) {
                                                toast.error(
                                                  "Please enable the store messages",
                                                );
                                              } else if (
                                                !checked &&
                                                feature.name ===
                                                FEATURES_CONFIG.SCHEDULER.name
                                              ) {
                                                // Don't toggle off yet — show confirmation dialog
                                                setShowPauseAllDialog(true);
                                              } else if (
                                                !checked &&
                                                feature.name ===
                                                FEATURES_CONFIG.TRIGGER.name
                                              ) {
                                                // Don't toggle off yet — show confirmation dialog for webhooks
                                                setShowPauseAllWebhooksDialog(true);
                                              } else {
                                                field.onChange(checked);
                                                updateFeatures(
                                                  feature.name,
                                                  checked,
                                                );
                                              }
                                            }}
                                          />
                                        </FormControl>
                                      ) : (
                                        <ComingSoonBadge />
                                      )}
                                    </div>
                                  </div>
                                  {!agentId &&
                                  feature.name ===
                                    FEATURES_CONFIG.SCHEDULER.name ? (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                      Create agent and then create scheduler
                                    </p>
                                  ) : !agentId &&
                                    feature.name ===
                                      FEATURES_CONFIG.TRIGGER.name ? (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                      Create agent and then create trigger
                                    </p>
                                  ) : null}
                                  {field.value && feature.extraComponent && (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <feature.extraComponent
                                          updateFeatures={updateFeatures}
                                          featureName={feature.name}
                                          openDialog={
                                            (feature.name ===
                                              FEATURES_CONFIG.RAG.name &&
                                              triggerRagDialog) ||
                                            (feature.name ===
                                              FEATURES_CONFIG.TEXT_TO_SQL
                                                .name &&
                                              triggerText2sqlDialog) ||
                                            (feature.name ===
                                              FEATURES_CONFIG.VOICE.name &&
                                              triggerVoiceConfigDialog) ||
                                            (feature.name ===
                                              FEATURES_CONFIG.RESPONSIBLE_AI
                                                .name &&
                                              triggerRAIDialog) ||
                                            (feature.name ===
                                              FEATURES_CONFIG.GROUNDEDNESS
                                                .name &&
                                              triggerGroundednessDialog) ||
                                            (feature.name ===
                                              FEATURES_CONFIG.CONTEXT.name &&
                                              triggerContextDialog) ||
                                            (feature.name ===
                                              FEATURES_CONFIG.MEMORY.name &&
                                              triggerMemoryDialog) ||
                                            (feature.name ===
                                              FEATURES_CONFIG.IMAGEASOUTPUT
                                                .name &&
                                              triggerImageAsOutputDialog) ||
                                            (feature.name ===
                                              FEATURES_CONFIG.SCHEDULER.name &&
                                              triggerSchedulerDialog) ||
                                            (feature.name ===
                                              FEATURES_CONFIG.TRIGGER.name &&
                                              triggerTriggerDialog)
                                          }
                                          initialConfig={
                                            feature.name ===
                                              FEATURES_CONFIG.IMAGEASOUTPUT.name
                                              ? imageOutputConfig
                                              : features.find(
                                                (f) =>
                                                  f.type === feature.type,
                                              )?.config
                                          }
                                        />
                                        <FeatureBadge
                                          feature={feature}
                                          features={features}
                                        />
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Form>
      </div>
      <NeedsUpgrade
        open={upgradeVisbile.open}
        onOpen={() =>
          setUpgradeVisible((prev) => ({ ...prev, open: !prev.open }))
        }
        title={upgradeVisbile.title}
        description={upgradeVisbile.description}
      />
      <AlertDialog open={showPauseAllDialog} onOpenChange={setShowPauseAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pause All Schedules?</AlertDialogTitle>
            <AlertDialogDescription>
              This will pause all active schedules for this agent. They can be
              resumed later from the scheduler configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPausingAll}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPausingAll}
              onClick={handlePauseAllAndDisable}
            >
              {isPausingAll ? "Pausing..." : "Pause All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showPauseAllWebhooksDialog} onOpenChange={setShowPauseAllWebhooksDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pause Webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              This will pause the webhook for this agent. Incoming requests will
              be ignored until you resume it from the webhook configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPausingAllWebhooks}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPausingAllWebhooks}
              onClick={handlePauseWebhookAndDisable}
            >
              {isPausingAllWebhooks ? "Pausing..." : "Pause"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Features;
