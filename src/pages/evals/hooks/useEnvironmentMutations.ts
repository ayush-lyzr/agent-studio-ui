import { useMutation } from "@tanstack/react-query";
import useStore from "@/lib/store";
import {
  generatePersonas,
  generateScenarios,
  generateSimulationsJob,
  GenerateSimulationsResponse,
} from "../services/environmentApi";
import { toast } from "sonner";

export const useEnvironmentApi = () => {
  const apiKey = useStore((state) => state.api_key);

  const {
    mutateAsync: generatePersonasMutation,
    isPending: isGeneratingPersonas,
  } = useMutation({
    mutationKey: ["generatePersonas"],
    mutationFn: ({ environmentId }: { environmentId: string }) =>
      generatePersonas(environmentId, apiKey),
    retry: 3,
    retryDelay: 1000,
  });

  const {
    mutateAsync: generateScenariosMutation,
    isPending: isGeneratingScenarios,
  } = useMutation({
    mutationKey: ["generateScenarios"],
    mutationFn: ({ environmentId }: { environmentId: string }) =>
      generateScenarios(environmentId, apiKey),
    retry: (failureCount, _) => {
      if (failureCount > 2) {
        toast.error(
          "Failed to generate scenarios. Please try again using the button given.",
        );
        return false;
      }
      return true;
    },
    retryDelay: 1000,
  });

  const {
    mutateAsync: generateSimulationsMutation,
    isPending: isGeneratingSimulations,
  } = useMutation<
    GenerateSimulationsResponse,
    Error,
    {
      environmentId: string;
      scenarioIds: string[];
      personaIds: string[];
    }
  >({
    mutationKey: ["generateSimulations"],
    mutationFn: ({ environmentId, scenarioIds, personaIds }) =>
      generateSimulationsJob(environmentId, scenarioIds, personaIds, apiKey),
    onSuccess: () => {
      toast.success("Simulation generation job started successfully");
    },
    onError: (error) => {
      console.error("Failed to start simulation generation job:", error);
      toast.error("Failed to start simulation generation");
    },
    retry: (failureCount) => {
      if (failureCount > 2) {
        toast.error(
          "Failed to generate simulations. Please try again using the button given.",
        );
        return false;
      }
      return true;
    },
    retryDelay: 1000,
  });

  return {
    generatePersonasMutation,
    isGeneratingPersonas,
    generateScenariosMutation,
    isGeneratingScenarios,
    generateSimulationsMutation,
    isGeneratingSimulations,
  };
};
