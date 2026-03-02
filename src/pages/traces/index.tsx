import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import AnalyticsTab from "./analytics-tab";
import TraceabilityTab from "./Traces/traceability-tab";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { isMixpanelActive } from "@/lib/constants";
import mixpanel from "mixpanel-browser";

const Traces = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tab || "traces");

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
    if (isMixpanelActive && mixpanel.hasOwnProperty("cookie")) {
      mixpanel.track("Traces page tab clicked", { tab: value });
    }
  };

  // Sync with URL params on mount and URL changes
  useEffect(() => {
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [tab, activeTab]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full w-full space-y-4 p-6"
    >
      <div>
        <p className="text-xl font-bold">Monitoring</p>
        <p className="text-sm text-muted-foreground">
          Real-time Monitoring of AI Agents
        </p>
      </div>
      <div>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="traces">Traces</TabsTrigger>
          </TabsList>
          <TabsContent value="analytics" className="mt-6">
            <AnalyticsTab />
          </TabsContent>
          <TabsContent value="traces" className="mt-6">
            <TraceabilityTab />
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
};

export default Traces;
