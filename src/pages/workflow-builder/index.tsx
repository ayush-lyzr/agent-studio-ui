import { useParams, useLocation } from "react-router-dom";
import WorkflowBuilder from "./components/WorkflowBuilder";
import WorkflowDashboard from "./components/WorkflowDashboard";
import { WorkflowProvider } from "@/contexts/WorkflowContext";
import { ApiKeyProvider } from "@/contexts/ApiKeyContext";
import { ReactFlowProvider } from "@xyflow/react";

const WorkflowBuilderPage = () => {
  const { workflowName } = useParams();
  const location = useLocation();
  const queryWorkflowName = new URLSearchParams(location.search).get(
    "workflowName",
  );

  // Show the dashboard only on the index route (no workflowName and no queryParam)
  // If workflowName exists (including "new"), show the builder
  const showDashboard = !workflowName && !queryWorkflowName;

  // Only pass initialWorkflowName if it's not "new"
  var initialWorkflowName =
    workflowName === "new"
      ? undefined
      : workflowName || queryWorkflowName || undefined;

  console.log("Route params:", {
    workflowName,
    queryWorkflowName,
    showDashboard,
  });

  return (
    <div className="h-screen w-full">
      <ReactFlowProvider>
        <ApiKeyProvider>
          <WorkflowProvider>
            {showDashboard ? (
              <WorkflowDashboard />
            ) : (
              <WorkflowBuilder initialWorkflowName={initialWorkflowName} />
            )}
          </WorkflowProvider>
        </ApiKeyProvider>
      </ReactFlowProvider>
    </div>
  );
};

export default WorkflowBuilderPage;
