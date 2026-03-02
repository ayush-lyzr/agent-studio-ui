import { Layout } from "@/components/custom/layout";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import EnvironmentTab from "./components/environment-tab";
import AgentTab from "./components/agent-tab";
import InferenceTab from "./components/inference-tab";

export default function Dashboard() {
  return (
    <Layout>
      {/* ===== Main ===== */}
      <Layout.Body>
        <div className="mb-5 flex items-center justify-between space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Studio</h1>
          <div className="flex items-center space-x-2">
            {/* <Button>Refresh</Button> */}
          </div>
        </div>
        <Tabs
          orientation="vertical"
          defaultValue="environment"
          className="space-y-4"
        >
          <div className="w-full overflow-x-auto pb-2">
            <TabsList>
              <TabsTrigger value="environment">Environment</TabsTrigger>
              <TabsTrigger value="agent">Agent</TabsTrigger>
              <TabsTrigger value="inference">Inference</TabsTrigger>
              {/* <TabsTrigger value='notifications'>Notifications</TabsTrigger> */}
            </TabsList>
          </div>
          <EnvironmentTab />
          <AgentTab />
          <InferenceTab />
        </Tabs>
      </Layout.Body>
    </Layout>
  );
}
