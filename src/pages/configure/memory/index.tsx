import { motion } from "framer-motion";
import { MemoryCard } from "./memory-card";
import { useMemory } from "./memory-service";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTitle } from "@/components/ui/page-title";
import mixpanel from "mixpanel-browser";
import { isMixpanelActive } from "@/lib/constants";
import type { IMemoryProvider } from "./types";
import { getMemoryProviderDisplayName } from "./types";
import { Separator } from "@/components/ui/separator";

if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
  mixpanel.track("Memory page visited");

export default function Memory() {
  // const [searchQuery, setSearchQuery] = useState<string>("");

  const { memoryProviders: providers = [], isFetchingProviders } = useMemory({
    providersEnabled: true,
  });

  // Add Lyzr default memory as the first option
  const allProviders: IMemoryProvider[] = [
    {
      _id: "lyzr-memory",
      provider_id: "lyzr",
      type: "memory",
      form: {
        title: "Avanade Memory",
        description:
          "Balanced Memory provider powered by Lyzr. Works out of the box with short term long term memory support.",
        fields: [],
      },
      meta_data: {
        icon: "lyzr",
        category: "memory",
        supports_role_based_auth: false,
        lambda_registration_required: false,
        provisioning_time_seconds: 0,
        documentation_url: "https://www.avanade.com/en-gb/services",
        features: ["Balanced", "Memory Storage"],
      },
    },
    ...providers,
  ];

  const allowedProviderIds = ["cognis", "lyzr", "aws-agentcore"];
  const filteredProviders = allProviders
    .filter((provider) =>
      allowedProviderIds.includes(provider.provider_id),
    )
    .sort(
      (a, b) =>
        allowedProviderIds.indexOf(a.provider_id) -
        allowedProviderIds.indexOf(b.provider_id),
    )
    .map((provider) => ({
      ...provider,
      form: {
        ...provider.form,
        title: getMemoryProviderDisplayName(
          provider.provider_id,
          provider.form?.title,
        ),
      },
    }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full w-full space-y-4 px-8 py-4"
    >
      <PageTitle
        title="Memory Providers"
        description="Configure memory providers for your agents. Enable persistent memory across conversations."
      />
      <Separator />
      {/* <div className="grid w-full grid-cols-12 place-content-between gap-2">
        <span className="col-span-3 flex items-center rounded-md border border-input px-2">
          <Search className="size-5" />
          <Input
            placeholder="Search"
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
      </div> */}
      <div className="h-[calc(100%-5rem)] overflow-y-scroll">
        <div className="grid grid-cols-4 gap-4 px-1 pt-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isFetchingProviders ? (
            <>
              {[...Array(2)].map((_, index) => (
                <Skeleton
                  key={index}
                  className="col-span-1 h-52 w-full rounded-lg"
                />
              ))}
            </>
          ) : (
            filteredProviders
              .filter((item) =>
                (item.form?.title || item.provider_id).toLowerCase(),
              )
              .map((provider) => (
                <MemoryCard key={provider.provider_id} provider={provider} />
              ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
