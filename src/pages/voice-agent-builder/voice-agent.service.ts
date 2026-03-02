import { AxiosResponse } from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { VOICE_API_URL } from "@/lib/constants";

interface TwilioCredentials {
  account_sid: string;
  auth_token: string;
  label?: string;
}

interface TwilioCredentialsResponse {
  client_id: string;
  account_sid: string;
  label?: string;
  token_saved: boolean;
  created_at?: string;
  updated_at?: string;
}

interface TwilioCredentialsSaveResponse {
  success: boolean;
  client_id: string;
  account_sid: string;
  label?: string;
  token_saved: boolean;
}

interface PhoneNumberConfig {
  agent_id: string;
  agent_name: string;
  friendly_name?: string;
  status: string;
}

interface TwilioPhoneNumber {
  phone_number: string;
  twilio_sid: string;
  twilio_friendly_name?: string;
  current_webhook_url?: string;
  capabilities?: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
  account_sid: string;
  is_configured: boolean;
  is_available: boolean;
  in_use_elsewhere: boolean;
  our_config?: PhoneNumberConfig;
}

interface TwilioAvailableNumbersResponse {
  total_count: number;
  configured_count: number;
  available_count: number;
  in_use_elsewhere_count: number;
  phone_numbers: TwilioPhoneNumber[];
}

interface ConnectPhoneNumberRequest {
  phone_number: string;
  agent_id: string;
  twilio_sid?: string;
  friendly_name?: string;
}

interface ConnectPhoneNumberResponse {
  success: boolean;
  phone_number: string;
  agent_id: string;
  agent_name: string;
  client_id: string;
  account_sid: string;
  webhook_url: string;
  twilio_configured: boolean;
  created_at: string;
}

export const useVoiceAgentService = (clientId: string) => {
  const requestConfig = { baseURL: `${VOICE_API_URL}/api/clients/${clientId}` };

  const { mutateAsync: saveTwilioCredentials, isPending: isSavingCredentials } =
    useMutation({
      mutationKey: ["saveTwilioCredentials", clientId],
      mutationFn: (credentials: TwilioCredentials) =>
        axios.post<TwilioCredentialsSaveResponse>(
          `/twilio/credentials`,
          credentials,
          requestConfig,
        ),
      onSuccess: (res: AxiosResponse<TwilioCredentialsSaveResponse>) =>
        res.data,
    });

  const {
    data: credentialsStatus,
    isFetching: isFetchingCredentials,
    refetch: getTwilioCredentials,
  } = useQuery({
    queryKey: ["getTwilioCredentials", clientId],
    queryFn: async () => {
      try {
        const response = await axios.get<TwilioCredentialsResponse>(
          `/twilio/credentials`,
          requestConfig,
        );
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: false,
    enabled: false,
  });

  const {
    data: twilioNumbers,
    isFetching: isFetchingTwilioNumbers,
    refetch: getTwilioNumbers,
  } = useQuery({
    queryKey: ["getTwilioNumbers", clientId],
    queryFn: () =>
      axios.get<TwilioAvailableNumbersResponse>(
        `/api/clients/${clientId}/phone-numbers/twilio/available`,
        { baseURL: VOICE_API_URL },
      ),
    select: (res: AxiosResponse<TwilioAvailableNumbersResponse>) => res.data,
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: false,
    enabled: false,
  });

  const {
    mutateAsync: connectPhoneNumber,
    isPending: isConnectingPhoneNumber,
  } = useMutation({
    mutationKey: ["connectPhoneNumber", clientId],
    mutationFn: (request: ConnectPhoneNumberRequest) =>
      axios.post<ConnectPhoneNumberResponse>(
        `/phone-numbers/connect`,
        request,
        requestConfig,
      ),
  });

  const { mutateAsync: removePhoneNumber } = useMutation({
    mutationKey: ["removePhoneNumber", clientId],
    mutationFn: (phoneNumber: string) =>
      axios.delete<any>(
        `/api/clients/${clientId}/phone-numbers/${phoneNumber}`,
        { baseURL: VOICE_API_URL },
      ),
  });

  const { mutateAsync: reassignPhoneNumber } = useMutation({
    mutationKey: ["reassignPhoneNumber", clientId],
    mutationFn: ({
      clientId,
      phoneNumber,
      agentId,
    }: {
      clientId: string;
      phoneNumber: string;
      agentId: string;
    }) =>
      axios.patch<any>(
        `/api/clients/${clientId}/phone-numbers/${phoneNumber}`,
        { agent_id: agentId },
        { baseURL: VOICE_API_URL },
      ),
  });

  return {
    // Credentials
    saveTwilioCredentials,
    isSavingCredentials,
    credentialsStatus,
    isFetchingCredentials,
    getTwilioCredentials,
    removePhoneNumber,

    // Twilio Numbers
    twilioNumbers,
    isFetchingTwilioNumbers,
    getTwilioNumbers,
    reassignPhoneNumber,

    connectPhoneNumber,
    isConnectingPhoneNumber,
  };
};
