import { useMutation, useQuery } from "@tanstack/react-query";

import axios from "@/lib/axios";
import { RAI_URL } from "@/lib/constants";
import useStore from "@/lib/store";
import {
  IRAIPolicy,
  PatternExamplesResponse,
  PatternTestResponse,
  PatternType,
} from "@/lib/types";
import { z } from "zod";
import { raiPolicySchema } from "./page";

export const useRAIPolicy = () => {
  const apiKey = useStore((state) => state.api_key);

  const { mutateAsync: createPolicy, isPending: isCreatingPOlicy } =
    useMutation({
      mutationKey: ["createPolicy"],
      mutationFn: (input: Partial<IRAIPolicy>) =>
        axios.post(`/v1/rai/policies`, input, {
          baseURL: RAI_URL,
          headers: { accept: "application/json", "x-api-key": apiKey },
        }),
    });

  const { mutateAsync: updatePolicy, isPending: isUpdatingPolicy } =
    useMutation({
      mutationKey: ["updatePolicy"],
      mutationFn: (
        input: Partial<z.infer<typeof raiPolicySchema>> & { policy_id: string },
      ) =>
        axios.put(`/v1/rai/policies/${input.policy_id}`, input, {
          baseURL: RAI_URL,
          headers: { accept: "application/json", "x-api-key": apiKey },
        }),
    });

  const { mutateAsync: deletePolicy, isPending: isDeletingPolicy } =
    useMutation({
      mutationKey: ["deletePolicy"],
      mutationFn: ({ policy_id }: { policy_id: string }) =>
        axios.delete(`/v1/rai/policies/${policy_id}`, {
          baseURL: RAI_URL,
          headers: { accept: "application/json", "x-api-key": apiKey },
        }),
    });

  const { mutateAsync: raiInference, isPending: isInferencingPolicy } =
    useMutation({
      mutationKey: ["raiInference"],
      mutationFn: (input: {
        policy_id: string;
        input_text: string;
        agent_id: string;
        session_id: string;
        run_id: string;
      }) =>
        axios.post(`/v1/rai/inference`, input, {
          baseURL: RAI_URL,
          headers: { accept: "application/json", "x-api-key": apiKey },
        }),
    });

  return {
    createPolicy,
    isCreatingPOlicy,
    updatePolicy,
    isUpdatingPolicy,
    deletePolicy,
    isDeletingPolicy,
    raiInference,
    isInferencingPolicy,
  };
};

export const useCucumberExpression = () => {
  const apiKey = useStore((state) => state.api_key);

  const { mutateAsync: testPattern, isPending: isTestingPattern } = useMutation(
    {
      mutationKey: ["testPattern"],
      mutationFn: (input: {
        pattern: string;
        pattern_type: PatternType;
        test_text: string;
      }) =>
        axios.post<PatternTestResponse>(
          `/v1/cucumber-expressions/test`,
          input,
          {
            baseURL: RAI_URL,
            headers: { accept: "application/json", "x-api-key": apiKey },
          },
        ),
    },
  );

  const { data: patternExamples, isFetching: isFetchingExamples } = useQuery({
    queryKey: ["patternExamples", apiKey],
    queryFn: () =>
      axios.get<PatternExamplesResponse>(`/v1/cucumber-expressions/examples`, {
        baseURL: RAI_URL,
        headers: { accept: "application/json", "x-api-key": apiKey },
      }),
    enabled: !!apiKey,
    staleTime: Infinity, // Examples don't change, so cache forever
  });

  return {
    testPattern,
    isTestingPattern,
    patternExamples: patternExamples?.data,
    isFetchingExamples,
  };
};
