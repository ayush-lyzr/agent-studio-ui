import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";

import axios from "@/lib/axios";
import { PAGOS_URL } from "@/lib/constants";
import { useOnboardingStore } from "./onboarding.store";

export const useOnboarding = () => {
  const {getToken, userId } = useAuth();
  const token = getToken();

  const {
    refetch: getOnboardingQuestionnaire,
    isLoading: isFetchingQuestionnaire,
  } = useQuery({
    queryKey: ["getOnboardingQuestionnaire"],
    queryFn: (): Promise<AxiosResponse<any, any>> =>
      axios.get("/user/onboarding-questionnaire"),
    enabled: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const {
    mutateAsync: saveOnboardingQuestionnaire,
    isPending: isSavingQuestionnaire,
  } = useMutation({
    mutationKey: ["saveOnboardingQuestionnaire", userId],
    mutationFn: (data: Record<string, string | string[]>) =>
      axios.post(
        "/user/save-onboarding",
        {
          user_id: userId,
          onboarding: data,
        },
        {
          baseURL: PAGOS_URL,
          headers: { Authorization: `Bearer ${token}` },
        },
      ),
    onSuccess: () => {
      useOnboardingStore.setState(() => ({
        onboarding: {},
        lastProgressedStep: 0,
      }));
    },
  });

  return {
    getOnboardingQuestionnaire,
    isFetchingQuestionnaire,
    saveOnboardingQuestionnaire,
    isSavingQuestionnaire,
  };
};
