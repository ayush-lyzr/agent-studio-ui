import { env } from "@/lib/env";

export interface TwilioPhoneNumber {
  phone_number: string;
  twilio_sid: string;
  twilio_friendly_name: string;
  current_webhook_url: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
  is_configured: boolean;
  is_available: boolean;
  in_use_elsewhere: boolean;
  our_config: {
    agent_id: string;
    agent_name: string;
    friendly_name: string;
    status: string;
  } | null;
}

export interface AvailablePhoneNumbersResponse {
  total_count: number;
  configured_count: number;
  available_count: number;
  in_use_elsewhere_count: number;
  phone_numbers: TwilioPhoneNumber[];
}

export interface ConfiguredPhoneNumber {
  phone_number: string;
  agent_id: string;
  agent_name: string;
  friendly_name: string;
  webhook_url: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ConnectPhoneNumberRequest {
  phone_number: string;
  agent_id: string;
  twilio_sid?: string;
  friendly_name?: string;
}

export interface ConnectPhoneNumberResponse {
  success: boolean;
  phone_number: string;
  agent_id: string;
  agent_name: string;
  webhook_url: string;
  twilio_configured: boolean;
  created_at: string;
}

const VOICE_API_URL = env.VITE_VOICE_API_URL;

export const phoneNumbersService = {
  /**
   * Get all available Twilio phone numbers
   */
  async getAvailablePhoneNumbers(): Promise<AvailablePhoneNumbersResponse> {
    const response = await fetch(
      `${VOICE_API_URL}/api/phone-numbers/twilio/available`,
    );
    if (!response.ok) {
      throw new Error("Failed to fetch available phone numbers");
    }
    return response.json();
  },

  /**
   * Get all configured phone numbers
   */
  async getConfiguredPhoneNumbers(): Promise<{
    phone_numbers: ConfiguredPhoneNumber[];
  }> {
    const response = await fetch(`${VOICE_API_URL}/api/phone-numbers`);
    if (!response.ok) {
      throw new Error("Failed to fetch configured phone numbers");
    }
    return response.json();
  },

  /**
   * Connect a phone number to an agent
   */
  async connectPhoneNumber(
    data: ConnectPhoneNumberRequest,
  ): Promise<ConnectPhoneNumberResponse> {
    const response = await fetch(`${VOICE_API_URL}/api/phone-numbers/connect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to connect phone number");
    }

    return response.json();
  },

  /**
   * Update phone number agent mapping
   */
  async updatePhoneNumber(
    phoneNumber: string,
    agentId: string,
  ): Promise<ConnectPhoneNumberResponse> {
    const encodedPhone = encodeURIComponent(phoneNumber);
    const response = await fetch(
      `${VOICE_API_URL}/api/phone-numbers/${encodedPhone}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agent_id: agentId }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update phone number");
    }

    return response.json();
  },

  /**
   * Remove phone number configuration
   */
  async removePhoneNumber(phoneNumber: string): Promise<{ success: boolean }> {
    const encodedPhone = encodeURIComponent(phoneNumber);
    const response = await fetch(
      `${VOICE_API_URL}/api/phone-numbers/${encodedPhone}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to remove phone number");
    }

    return response.json();
  },
};
