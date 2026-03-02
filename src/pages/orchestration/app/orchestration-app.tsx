import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AgentFlowBuilder from "./components/AgentFlowBuilder";
import "./styles/theme-overrides.css";

const queryClient = new QueryClient();

const OrchestrationApp = () => (
  <QueryClientProvider client={queryClient}>
    <div className="h-full w-full relative">
      <AgentFlowBuilder />
    </div>
  </QueryClientProvider>
);

export default OrchestrationApp;