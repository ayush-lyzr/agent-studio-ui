import { Layout } from "@/components/custom/layout";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ChatLogsTab from "./components/chat-logs";

export default function Analytics() {
  return (
    <Layout>
      {/* ===== Main ===== */}
      <Layout.Body>
        <div className="mb-5 flex items-center justify-between space-y-2">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ cursor: "pointer" }}
          >
            Analytics
          </h1>
          <div className="flex items-center space-x-2"></div>
        </div>
        <Tabs
          orientation="vertical"
          defaultValue="chat-logs"
          className="space-y-4"
        >
          <div className="w-full overflow-x-auto pb-2">
            <TabsList>
              <TabsTrigger value="chat-logs">Agent Metrics</TabsTrigger>
            </TabsList>
          </div>
          <ChatLogsTab />
        </Tabs>
      </Layout.Body>
    </Layout>
  );
}
