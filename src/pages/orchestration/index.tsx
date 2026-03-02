import React, { useRef } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Layout } from "@/components/custom/layout";
import DnDFlow from "./components/DnDFlow";
import { Button } from "@/components/custom/button";

const Orchestration: React.FC = () => {
  const dndFlowRef = useRef<{
    onSave: () => void;
    onRestore: () => void;
    onReset: () => void;
  } | null>(null);

  const handleSave = () => {
    dndFlowRef.current?.onSave();
  };

  const handleRestore = () => {
    dndFlowRef.current?.onRestore();
  };

  const handleReset = () => {
    dndFlowRef.current?.onReset();
  };

  return (
    <Layout>
      <Layout.Body>
        <div className="mb-2 flex items-center justify-between space-y-2 pb-4">
          <h1 className="text-2xl font-bold tracking-tight">
            Agent Orchestration
          </h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="default"
              onClick={handleSave}
              className="rounded px-4 py-2"
            >
              Save
            </Button>
            <Button
              variant="outline"
              onClick={handleRestore}
              className="rounded px-4 py-2"
            >
              Restore
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
              className="rounded px-4 py-2"
            >
              Reset
            </Button>
          </div>
        </div>
      </Layout.Body>
      <ReactFlowProvider>
        <DnDFlow ref={dndFlowRef} />
      </ReactFlowProvider>
    </Layout>
  );
};

export default Orchestration;
