export type TelephonyProvider = 'telnyx' | 'twilio';

export type IntegrationStatus = 'active' | 'needs_attention' | 'disconnected';

export interface TelephonyIntegration {
    integrationId: string;
    provider: TelephonyProvider;
    status: IntegrationStatus;
    maskedKey: string;
    label?: string;
    createdAt?: string;
}

/** @deprecated Use TelephonyIntegration */
export type TelnyxIntegration = TelephonyIntegration;

export interface ProviderNumber {
    providerNumberId: string;
    e164: string;
    capabilities?: string[];
}

export interface NumberBinding {
    id: string;
    provider: TelephonyProvider;
    integrationId: string;
    e164: string;
    agentId: string;
    agentName?: string;
    enabled: boolean;
}

export type TelephonyErrorCode =
    | 'AUTH_INVALID'
    | 'INSUFFICIENT_PERMISSIONS'
    | 'RATE_LIMITED'
    | 'PROVIDER_ERROR'
    | 'CONFLICT_BINDING_EXISTS';
