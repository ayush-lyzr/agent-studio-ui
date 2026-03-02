import { useState, useEffect } from "react";
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
  VOICE_FEATURES_SECTIONS as FEATURES_SECTIONS,
  VOICE_FEATURES_CONFIG as FEATURES_CONFIG,
  isToolCallingFeature,
  type FeatureDefinition,
  type ExtraComponentProps,
  type FeatureConfig,
} from "@/data/voice-features";
import { isDevEnv, isMixpanelActive, PlanType } from "@/lib/constants";
import { Link } from "react-router-dom";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import FeatureBadge from "./feature-badge";
import mixpanel from "mixpanel-browser";
import { NeedsUpgrade } from "@/components/custom/needs-upgrade";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { toast } from "sonner";

const ComingSoonBadge = () => (
  <Badge variant="secondary" className="text-xs">
    Coming Soon
  </Badge>
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
}

export const Features: React.FC<FeaturesProps> = ({
  form,
  onEnabledCountChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [triggerRagDialog, setTriggerRagDialog] = useState(false);
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
  // const _fileOutput = form.watch("file_output");

  const usage_data = useManageAdminStore((state) => state.usage_data);

  const isPlanBlocked = [
    PlanType.Community,
    PlanType.Starter,
    PlanType.Pro,
    PlanType.Pro_Yearly,
  ].includes(usage_data?.plan_name as PlanType);

  useEffect(() => {
    Object.values(FEATURES_CONFIG).forEach((f) => form.setValue(f.name, false));

    // Always enable features marked as always_on
    Object.values(FEATURES_CONFIG).forEach((f) => {
      if (f.always_on) {
        form.setValue(f.name, true);
      }
    });

    features.forEach((feature: any) => {
      const config = Object.values(FEATURES_CONFIG).find(
        (f) => f.type === feature.type,
      );
      if (config) form.setValue(config.name, true);
    });

    let featureCount = 0;
    features.forEach((feature) => {
      if (!isToolCallingFeature(feature)) {
        featureCount++;
      }
    });

    onEnabledCountChange?.(featureCount);
  }, [features, form, onEnabledCountChange]);

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
  ): void => {
    const currentFeatures = form.getValues("features") || [];
    const featureConfig = Object.values(FEATURES_CONFIG).find(
      (f: FeatureDefinition) => f.name === featureName,
    );
    if (!featureConfig) return;

    /* Preserve this statement to keep ragName as a prop.
       Can be only removed when the ragName dependency is absolutely removed.
    */
    console.info(ragName);

    form.setValue(featureName, enabled, { shouldValidate: true });

    if (featureConfig.type === "PROMPT_INJECTION" && enabled) {
      const updatedFeatures = currentFeatures.filter(
        (f) => f.type !== "PROMPT_INJECTION",
      );
      updatedFeatures.push({
        type: "PROMPT_INJECTION",
        config: config || {},
        priority: 0,
      });
      form.setValue("features", updatedFeatures);
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
      form.setValue("features", updatedFeatures);
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
      form.setValue("features", updatedFeatures);
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
      form.setValue("features", updatedFeatures);
      const featureCount = updatedFeatures.filter(
        (f) => !isToolCallingFeature(f),
      ).length;
      onEnabledCountChange?.(featureCount);
      return;
    }

    if (featureConfig.type === "FILEASOUTPUT") {
      form.setValue("file_output", enabled);
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

      form.setValue("features", updatedFeatures);
      const srsCount = Number(isReflectionEnabled) + Number(isFairnessEnabled);
      const otherFeaturesCount = updatedFeatures.filter(
        (f) => !isToolCallingFeature(f) && f.type !== "SRS",
      ).length;
      onEnabledCountChange?.(srsCount + otherFeaturesCount);
      return;
    }

    let updatedFeatures = currentFeatures.filter(
      (f) => f.type !== featureConfig.type,
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
      } else if (featureName === FEATURES_CONFIG.RESPONSIBLE_AI.name) {
        updatedFeatures.push({
          type: featureConfig.type,
          priority: 0,
          config: {
            ...(config ?? {}),
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
      } else {
        updatedFeatures.push({
          type: featureConfig.type,
          priority: 0,
          config: {},
        });
      }
    }

    if (enabled && featureName === FEATURES_CONFIG.RAG.name && !ragId) {
      setTriggerRagDialog(true);
    } else if (enabled && featureName === FEATURES_CONFIG.RAG.name && ragId) {
      setTriggerRagDialog(false);
    }

    // if (
    //   enabled &&
    //   featureName === FEATURES_CONFIG.RESPONSIBLE_AI.name &&
    //   !ragId
    // ) {
    //   setTriggerRAIDialog(true);
    // } else if (
    //   enabled &&
    //   featureName === FEATURES_CONFIG.RESPONSIBLE_AI.name &&
    //   ragId
    // ) {
    //   setTriggerRAIDialog(false);
    // }

    if (!isDevEnv) {
      // if (enabled && featureName === FEATURES_CONFIG.PII_REDACTION.name) {
      //   setTriggerPiiDialog(true);
      // }
      // if (enabled && featureName === FEATURES_CONFIG.PROMPT_INJECTION.name) {
      //   setTriggerPromptInjectionDialog(true);
      // }
      // if (enabled && featureName === FEATURES_CONFIG.GROUNDEDNESS.name) {
      //   setTriggerGroundednessDialog(true);
      // }
    }

    // if (
    //   enabled &&
    //   featureName === FEATURES_CONFIG.CONTEXT.name &&
    //   !config?.context_id
    // ) {
    //   setTriggerContextDialog(true);
    // } else if (
    //   enabled &&
    //   featureName === FEATURES_CONFIG.CONTEXT.name &&
    //   config?.context_id
    // ) {
    //   setTriggerContextDialog(false);
    // }

    form.setValue("features", updatedFeatures, { shouldDirty: true });
    const featureCount = updatedFeatures.filter(
      (f) => !isToolCallingFeature(f),
    ).length;
    onEnabledCountChange?.(featureCount);
  };

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
            (feature.title?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
              feature.description
                ?.toLowerCase()
                .includes(searchTerm?.toLowerCase())) &&
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
                                      {feature?.always_on ? (
                                        <Badge className="bg-green-100 font-normal text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                          Always On
                                        </Badge>
                                      ) : feature?.needs_upgrade ? (
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
                                            onCheckedChange={(
                                              checked: boolean,
                                            ) => {
                                              field.onChange(checked);
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
                                              } else {
                                                updateFeatures(
                                                  feature.name,
                                                  checked,
                                                );
                                                field.onChange(checked);
                                              }
                                            }}
                                          />
                                        </FormControl>
                                      ) : (
                                        <ComingSoonBadge />
                                      )}
                                    </div>
                                  </div>
                                  {field.value && feature.extraComponent && (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <feature.extraComponent
                                          updateFeatures={updateFeatures}
                                          featureName={feature.name}
                                          openDialog={
                                            feature.name ===
                                              FEATURES_CONFIG.RAG.name &&
                                            triggerRagDialog
                                          }
                                          initialConfig={
                                            features.find(
                                              (f) => f.type === feature.type,
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
    </>
  );
};

export default Features;
