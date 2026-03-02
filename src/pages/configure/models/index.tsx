import { useState } from "react";
import { Search, XCircleIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ModelCard } from "./model-card";
import useStore from "@/lib/store";
import { useModel } from "./model-service";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTitle } from "@/components/ui/page-title";
import mixpanel from "mixpanel-browser";
import { isMixpanelActive } from "@/lib/constants";
import { NeedsUpgrade } from "@/components/custom/needs-upgrade";
import { ProviderForm } from "./types";
import { IProvider } from "@/lib/types";

if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
  mixpanel.track("Models page visited");
export default function Models() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const providersCount = 9;
  const [upgradeVisbile, setUpgradeVisible] = useState<{
    title: string;
    description: string;
    open: boolean;
  }>({
    open: false,
    title: "",
    description: "",
  });
  const apiKey = useStore((state) => state.api_key);
  const { llmProviders: providers = [], isFetchingProviders } = useModel({
    apiKey,
    providersEnabled: true,
  });

  const reArrangedArray = (): IProvider[] => {
    const awsBedrock = (providers ?? []).find(
      (p) => p.provider_id === "aws-bedrock",
    );

    // Move awsBedrock (if found) to the front, keep the rest in order
    if (!awsBedrock) return providers ?? [];
    return [
      awsBedrock,
      ...providers.filter((p) => p.provider_id !== "aws-bedrock"),
    ];
  };

  const disabledProviders = ["watsonx", "cohere"];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="h-full w-full space-y-8 p-8"
      >
        <PageTitle
          title="Model Providers"
          description="Configure LLM model providers and manage their API settings."
        />
        <div className="grid w-full grid-cols-12 place-content-between gap-2">
          <span className="col-span-3 flex items-center rounded-md border border-input px-2">
            <Search className="size-5" />
            <Input
              placeholder="Search models..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="max-w-xs border-none bg-transparent shadow-none"
            />

            <XCircleIcon
              className={cn(
                "size-4 text-slate-400 transition-all delay-200 duration-200 ease-in-out animate-in animate-out fade-in-0 fade-out-50 hover:text-slate-700",
                searchQuery.length > 0 ? "visible" : "invisible",
              )}
              onClick={() => setSearchQuery("")}
            />
          </span>
        </div>
        <div className="h-[calc(100%-5rem)] overflow-y-scroll">
          <div className="grid grid-cols-4 gap-4 px-1 pt-2">
            {isFetchingProviders ? (
              <>
                {[...Array(providersCount)].map((_, index) => (
                  <Skeleton
                    key={index}
                    className="col-span-1 h-52 w-full rounded-lg"
                  />
                ))}
              </>
            ) : (
              reArrangedArray()
                .filter((item) =>
                  item.provider_id
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()),
                )
                .sort((a, b) => {
                  const aDisabled = disabledProviders.includes(
                    a.provider_id.toLowerCase(),
                  );
                  const bDisabled = disabledProviders.includes(
                    b.provider_id.toLowerCase(),
                  );
                  return aDisabled === bDisabled ? 0 : aDisabled ? 1 : -1;
                })
                .map((item) => (
                  <ModelCard
                    key={item.provider_id}
                    {...item}
                    allowSetup={
                      !disabledProviders.includes(
                        item.provider_id.toLowerCase(),
                      ) &&
                      [
                        "aws-bedrock",
                        "huggingface",
                        "nvidia",
                        "deepgram",
                        "elevenlabs",
                        "azure",
                      ].includes(item.provider_id.toLowerCase())
                    }
                    disabled={
                      disabledProviders.includes(
                        item.provider_id.toLowerCase(),
                      ) || item.disabled
                    }
                    onUpgrade={(item: ProviderForm) => () => {
                      setUpgradeVisible({
                        title: item?.title ?? "",
                        description: item?.description ?? "",
                        open: true,
                      });
                    }}
                    upgradeDisable={item.disabled}
                    className="col-span-1"
                  />
                ))
            )}
          </div>
        </div>
      </motion.div>
      <NeedsUpgrade
        open={upgradeVisbile.open}
        onOpen={() =>
          setUpgradeVisible((prev) => ({ ...prev, open: !prev.open }))
        }
        title={upgradeVisbile.title}
        description={`"Bring your own model" is only available to custom plan users.`}
      />
    </>
  );
}
