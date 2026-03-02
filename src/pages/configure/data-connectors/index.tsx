import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, XCircle } from "lucide-react";
import useStore from "@/lib/store";
import { Input } from "@/components/ui/input";
import { DataConnectorCard } from "./data-connector-card";
import { useDataConnector } from "./data-connector.service";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTitle } from "@/components/ui/page-title";
import mixpanel from "mixpanel-browser";
import { isMixpanelActive } from "@/lib/constants";
import { DataConnector } from "@/lib/types";
import { Link } from "react-router-dom";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { FilterToggle } from "@/components/custom/filter-toggle";

const cardVariants = {
  hidden: () => ({
    opacity: 0,
    x: -20,
    scale: 1,
  }),
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      mass: 0.5,
      delay: index / 10,
    },
    hidden: () => ({
      opacity: 0,
      x: -20,
      scale: 1,
    }),
  }),
};

type TabFilterType = "all" | "vector_store" | "database";

function DataConnectorSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-6 w-[120px]" />
      </div>
      <Skeleton className="h-4 w-[250px]" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[170px]" />
      </div>
    </div>
  );
}

if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
  mixpanel.track("Data connectors page visited");
export default function DataConnectors() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dataConnectors, setDataConnectors] = useState<DataConnector[]>([]);
  const [tabFilter, setTabFilter] = useState<TabFilterType>("all");
  const apiKey = useStore((state: any) => state.api_key);
  const {
    isFetchingVectorStores,
    getVectorStores,
    isFetchingDatabases,
    getDatabases,
  } = useDataConnector({ apiKey });

  useEffect(() => {
    const fetchDataConnectors = async () => {
      const [vectors, databases] = await Promise.all([
        getVectorStores,
        getDatabases,
      ]);
      const data = [...(await vectors()).data, ...(await databases()).data];
      // move azure sql to last
      const azure_index = data.findIndex(
        (row) => row?.provider_id === "azure_sql",
      );
      const azure_sql = data.splice(azure_index, 1)[0];
      data.splice(data?.length, 0, azure_sql);
      setDataConnectors(data);
    };
    fetchDataConnectors();
  }, []);

  const filteredConnectors = (dataConnectors ?? [])?.filter((connector) =>
    connector?.provider_id
      ?.toLowerCase()
      ?.includes((searchQuery ?? "")?.toLowerCase()),
  );

  const getDataConnectors = (tabFilter: TabFilterType) => {
    switch (tabFilter) {
      case "all":
        return filteredConnectors;
      case "vector_store":
        return filteredConnectors.filter(
          (connector) => connector.type === "vector_store",
        );
      case "database":
        return filteredConnectors.filter(
          (connector) => connector.type === "database",
        );
      default:
        return filteredConnectors;
    }
  };

  const allConnectorsCount = getDataConnectors("all").length;
  const vectorConnectorsCount = getDataConnectors("vector_store").length;
  const databaseConnectorsCount = getDataConnectors("database").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full w-full space-y-8 p-8"
    >
      <PageTitle
        title="Data Connectors"
        description={
          <span className="inline-flex items-center space-x-1 text-sm text-muted-foreground">
            <p>
              Set up and manage connections to external data sources and
              services.
            </p>
            <Link
              to="https://www.youtube.com/watch?v=yzn6xOGs9lk&t=2s"
              target="_blank"
              className="flex items-center text-link underline-offset-4 hover:underline"
              onClick={() => {
                if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                  mixpanel.track("Video-clicked", {
                    feature: "Data Connectors",
                  });
              }}
            >
              Video
              <ArrowTopRightIcon className="ml-1 size-3" />
            </Link>
          </span>
        }
      />

      <div className="h-full space-y-3">
        <div className="flex">
          <FilterToggle<TabFilterType>
            value={tabFilter}
            setValue={(value) => setTabFilter(value as TabFilterType)}
            items={[
              { id: "all", label: "All", count: allConnectorsCount },
              {
                id: "database",
                label: "Database",
                count: databaseConnectorsCount,
              },
              {
                id: "vector_store",
                label: "Vector Store",
                count: vectorConnectorsCount,
              },
            ]}
          />
        </div>
        <div className="grid w-full grid-cols-12 place-content-between gap-4">
          <span className="col-span-3 flex items-center rounded-md border border-input px-2">
            <Search className="size-5" />
            <Input
              placeholder="Search data connectors..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="max-w-xs border-none bg-transparent shadow-none"
            />
            {searchQuery.length > 0 && (
              <XCircle
                className="size-3 text-muted-foreground"
                onClick={() => setSearchQuery("")}
              />
            )}
          </span>
        </div>
        <div className="h-[calc(100%-10rem)] overflow-y-scroll">
          <div className="no-scrollbar grid grid-cols-4 gap-8 pt-1">
            {isFetchingDatabases || isFetchingVectorStores
              ? Array.from({ length: 8 }).map((_, index) => (
                  <DataConnectorSkeleton key={index} />
                ))
              : getDataConnectors(tabFilter)?.map((connector, index) => (
                  <motion.div
                    layout
                    key={`connector-grid-${index}`}
                    custom={index}
                    variants={cardVariants}
                    transition={{
                      delay: index / 20,
                    }}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    whileTap="tap"
                    whileDrag="drag"
                  >
                    <DataConnectorCard
                      key={connector?._id}
                      connector={connector}
                      config={Object.entries(connector.form.properties).map(
                        ([key, value]) => ({
                          field_id: key,
                          field_name: value.title,
                          field_description: value.description,
                          field_value: value.default || "",
                          field_type: value.type,
                          field_accepted_formats: value?.accepted_formats,
                          field_multiple: value.multiple,
                          required: connector.form.required.includes(key),
                        }),
                      )}
                      enabled={true}
                      savedConfig={undefined}
                    />
                  </motion.div>
                ))}
          </div>
        </div>
      </div>

      <div className="h-10" />
    </motion.div>
  );
}
