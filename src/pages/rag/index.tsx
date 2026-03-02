import { useState } from "react";
import { Layout } from "@/components/custom/layout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Joyride, { STATUS, Step } from "react-joyride";
import RagConfigure from "./components/rag-configure";
import RagUpload from "./components/rag-upload";
import RagPlayground from "./components/rag-playground";

export default function Dashboard() {
  const [run, setRun] = useState(false);
  const [steps] = useState<Step[]>([
    {
      target: ".rag-configure",
      content: "This is where you can configure your RAG.",
      placement: "bottom",
    },
    {
      target: ".rag-upload",
      content: "Here you can manage your data.",
      placement: "bottom",
    },
    {
      target: ".rag-playground",
      content: "This is the query retrieval section.",
      placement: "bottom",
    },
  ]);

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
    }
  };

  return (
    <>
      <Layout>
        {/* ===== Main ===== */}
        <Layout.Body>
          <div className="mb-5 flex items-center justify-between space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              RAG - Knowledge Base
            </h1>
            <div className="flex items-center space-x-2"></div>
          </div>
          <Tabs
            orientation="vertical"
            defaultValue="rag-configure"
            className="space-y-4"
          >
            <div className="w-full overflow-x-auto pb-2">
              <TabsList>
                <TabsTrigger className="rag-configure" value="rag-configure">
                  Configure
                </TabsTrigger>
                <TabsTrigger className="rag-upload" value="upload">
                  Manage Data
                </TabsTrigger>
                <TabsTrigger className="rag-playground" value="playground">
                  Query Retrieval
                </TabsTrigger>
              </TabsList>
            </div>
            <RagConfigure />
            <RagUpload />
            <RagPlayground />
          </Tabs>
        </Layout.Body>
      </Layout>
      <Joyride
        callback={handleJoyrideCallback}
        run={run}
        steps={steps}
        continuous={true}
        // scrollToFirstStep={true}
        showProgress={true}
        showSkipButton={true}
        styles={{
          options: {
            zIndex: 10000,
          },
          buttonBack: {
            color: "#1A202C",
            backgroundColor: "#F7FAFC",
            boxShadow:
              "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            transition: "all 0.2s ease-in-out",
          },
          buttonClose: {
            color: "#F7FAFC",
          },
          buttonNext: {
            color: "#F7FAFC",
            backgroundColor: "#1A202C",
            boxShadow:
              "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            transition: "all 0.2s ease-in-out",
          },
          buttonSkip: {
            color: "#F7FAFC",
            backgroundColor: "transparent",
            border: "1px solid #F7FAFC",
            transition: "all 0.2s ease-in-out",
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
          tooltip: {
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(128, 128, 128, 0.5)",
            borderRadius: "8px",
            color: "#2D3748",
            padding: "8px",
            boxShadow:
              "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          },
          tooltipContainer: {
            color: "#1A202C",
          },
        }}
      />
    </>
  );
}
