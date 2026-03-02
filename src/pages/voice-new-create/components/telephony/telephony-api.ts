import type {
    NumberBinding,
    ProviderNumber,
    TelephonyIntegration,
} from './types';
import { getOrgApiKey } from '@/lib/livekit/org-api-key';

// ---------------------------------------------------------------------------
// Base helpers (mirrors backendClient.ts pattern)
// ---------------------------------------------------------------------------

function normalizeBaseUrl(url: string): string {
    return url.replace(/\/+$/, '');
}

function toHeaderObject(input: HeadersInit | undefined): Record<string, string> {
    if (!input) return {};
    return Object.fromEntries(new Headers(input).entries());
}

const BACKEND_URL = normalizeBaseUrl(
    import.meta.env.VITE_LIVEKIT_BACKEND_URL ||
        'https://ba-dc3c74596474493fba4d44a9ea25b57f.ecs.us-east-1.on.aws',
);

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const apiKey = getOrgApiKey();
    if (!apiKey) {
        throw new Error('Missing API key (x-api-key) for LiveKit backend');
    }

    const response = await fetch(`${BACKEND_URL}${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            ...toHeaderObject(init?.headers),
        },
    });

    if (response.ok) {
        if (response.status === 204) return undefined as T;
        return (await response.json()) as T;
    }

    const errorData = (await response.json().catch(() => ({}))) as {
        error?: string;
        errorCode?: string;
        details?: string;
    };
    const message = errorData.error || `Request failed (${response.status})`;
    throw new Error(
        errorData.details ? `${message}: ${errorData.details}` : message,
    );
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface VerifyCredentialsResponse {
    valid: true;
}

interface SaveCredentialsResponse {
    integrationId: string;
    provider: string;
    status: string;
}

interface ListIntegrationsResponse {
    integrations: Array<{
        id: string;
        provider: string;
        name: string | null;
        apiKeyFingerprint: string;
        status: 'active' | 'disabled';
        createdAt: string;
        updatedAt: string;
    }>;
}

interface DeleteIntegrationResponse {
    ok: true;
}

interface ListNumbersResponse {
    numbers: Array<{
        id: string;
        phone_number: string;
        status: string;
        connection_id: string | null;
        connection_name: string | null;
    }>;
}

interface ListBindingsResponse {
    bindings: Array<{
        id: string;
        integrationId: string;
        provider: string;
        providerNumberId: string;
        e164: string;
        agentId: string | null;
        enabled: boolean;
        createdAt: string;
        updatedAt: string;
    }>;
}

interface SaveTwilioCredentialsResponse {
    integrationId: string;
    provider: string;
    status: string;
}

interface ListTwilioIntegrationsResponse {
    integrations: Array<{
        id: string;
        provider: string;
        name: string | null;
        apiKeyFingerprint: string;
        status: 'active' | 'disabled';
        createdAt: string;
        updatedAt: string;
    }>;
}

interface ListTwilioNumbersResponse {
    numbers: Array<{
        sid: string;
        phoneNumber: string;
        friendlyName?: string;
    }>;
}

interface ConnectNumberResponse {
    id: string;
    integrationId: string;
    provider: string;
    providerNumberId: string;
    e164: string;
    agentId: string | null;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}

interface DisconnectBindingResponse {
    ok: boolean;
}

// ---------------------------------------------------------------------------
// API client
// ---------------------------------------------------------------------------

function formatFingerprint(fingerprint: string): string {
    const trimmed = fingerprint.trim();
    if (trimmed.length <= 10) return `fp:${trimmed}`;
    return `fp:${trimmed.slice(0, 6)}…${trimmed.slice(-4)}`;
}

function mapIntegrationStatus(status: 'active' | 'disabled'): TelephonyIntegration['status'] {
    return status === 'active' ? 'active' : 'disconnected';
}

function mapIntegration(row: ListIntegrationsResponse['integrations'][number]): TelephonyIntegration {
    return {
        integrationId: row.id,
        provider: 'telnyx',
        status: mapIntegrationStatus(row.status),
        maskedKey: formatFingerprint(row.apiKeyFingerprint),
        createdAt: row.createdAt,
    };
}

function mapNumber(row: ListNumbersResponse['numbers'][number]): ProviderNumber {
    return {
        providerNumberId: row.id,
        e164: row.phone_number,
        capabilities: [],
    };
}

function mapBinding(row: ListBindingsResponse['bindings'][number]): NumberBinding {
    return {
        id: row.id,
        provider: 'telnyx',
        integrationId: row.integrationId,
        e164: row.e164,
        agentId: row.agentId ?? '',
        enabled: Boolean(row.enabled),
    };
}

function mapTwilioIntegration(row: ListTwilioIntegrationsResponse['integrations'][number]): TelephonyIntegration {
    return {
        integrationId: row.id,
        provider: 'twilio',
        status: row.status === 'active' ? 'active' : 'disconnected',
        maskedKey: formatFingerprint(row.apiKeyFingerprint),
        label: row.name ?? undefined,
        createdAt: row.createdAt,
    };
}

function mapTwilioNumber(row: ListTwilioNumbersResponse['numbers'][number]): ProviderNumber {
    return {
        providerNumberId: row.sid,
        e164: row.phoneNumber,
        capabilities: ['voice'],
    };
}

export const telephonyApi = {
    // --- credentials ---

    verifyCredentials(apiKey: string): Promise<VerifyCredentialsResponse> {
        return jsonFetch<VerifyCredentialsResponse>(
            '/telephony/providers/telnyx/credentials/verify',
            {
                method: 'POST',
                body: JSON.stringify({ apiKey }),
            },
        );
    },

    saveCredentials(apiKey: string): Promise<SaveCredentialsResponse> {
        return jsonFetch<SaveCredentialsResponse>(
            '/telephony/providers/telnyx/credentials',
            {
                method: 'POST',
                body: JSON.stringify({ apiKey }),
            },
        );
    },

    // --- integrations ---

    async listIntegrations(): Promise<{ data: TelephonyIntegration[] }> {
        const response = await jsonFetch<ListIntegrationsResponse>(
            '/telephony/providers/telnyx/integrations',
            { method: 'GET' }
        );
        return { data: response.integrations.map((integration) => mapIntegration(integration)) };
    },

    deleteIntegration(
        integrationId: string,
    ): Promise<DeleteIntegrationResponse> {
        return jsonFetch<DeleteIntegrationResponse>(
            `/telephony/providers/telnyx/credentials/${integrationId}`,
            { method: 'DELETE' },
        );
    },

    // --- numbers ---

    async listNumbers(integrationId: string): Promise<{ data: ProviderNumber[] }> {
        const response = await jsonFetch<ListNumbersResponse>(
            `/telephony/providers/telnyx/numbers?integrationId=${encodeURIComponent(integrationId)}`,
            { method: 'GET' }
        );
        return { data: response.numbers.map((number) => mapNumber(number)) };
    },

    // --- bindings ---

    async listBindings(): Promise<{ data: NumberBinding[] }> {
        const response = await jsonFetch<ListBindingsResponse>('/telephony/bindings', {
            method: 'GET',
        });
        return { data: response.bindings.map((binding) => mapBinding(binding)) };
    },

    connectNumber(
        providerNumberId: string,
        integrationId: string,
        agentId: string,
        input: { e164: string },
    ): Promise<ConnectNumberResponse> {
        return jsonFetch<ConnectNumberResponse>(
            `/telephony/providers/telnyx/numbers/${encodeURIComponent(providerNumberId)}/connect?integrationId=${encodeURIComponent(integrationId)}`,
            {
                method: 'POST',
                body: JSON.stringify({
                    e164: input.e164,
                    agentId,
                }),
            },
        );
    },

    disconnectBinding(bindingId: string): Promise<DisconnectBindingResponse> {
        return jsonFetch<DisconnectBindingResponse>(
            `/telephony/providers/telnyx/bindings/${encodeURIComponent(bindingId)}`,
            {
                method: 'DELETE',
            },
        );
    },

    // --- twilio credentials ---

    verifyTwilioCredentials(credentials: {
        accountSid: string;
        authToken: string;
    }): Promise<VerifyCredentialsResponse> {
        return jsonFetch<VerifyCredentialsResponse>(
            '/telephony/providers/twilio/credentials/verify',
            {
                method: 'POST',
                body: JSON.stringify(credentials),
            },
        );
    },

    saveTwilioCredentials(credentials: {
        accountSid: string;
        authToken: string;
        name?: string;
    }): Promise<SaveTwilioCredentialsResponse> {
        return jsonFetch<SaveTwilioCredentialsResponse>(
            '/telephony/providers/twilio/credentials',
            {
                method: 'POST',
                body: JSON.stringify(credentials),
            },
        );
    },

    // --- twilio integrations ---

    async listTwilioIntegrations(): Promise<{ data: TelephonyIntegration[] }> {
        const response = await jsonFetch<ListTwilioIntegrationsResponse>(
            '/telephony/providers/twilio/integrations',
            { method: 'GET' },
        );
        return {
            data: response.integrations.map((integration) => mapTwilioIntegration(integration)),
        };
    },

    deleteTwilioIntegration(integrationId: string): Promise<DeleteIntegrationResponse> {
        return jsonFetch<DeleteIntegrationResponse>(
            `/telephony/providers/twilio/credentials/${integrationId}`,
            { method: 'DELETE' },
        );
    },

    // --- twilio numbers ---

    async listTwilioNumbers(integrationId: string): Promise<{ data: ProviderNumber[] }> {
        const response = await jsonFetch<ListTwilioNumbersResponse>(
            `/telephony/providers/twilio/numbers?integrationId=${encodeURIComponent(integrationId)}`,
            { method: 'GET' },
        );
        return { data: response.numbers.map((number) => mapTwilioNumber(number)) };
    },

    // --- twilio bindings ---

    connectTwilioNumber(
        providerNumberId: string,
        integrationId: string,
        agentId: string,
        input: { e164: string },
    ): Promise<ConnectNumberResponse> {
        return jsonFetch<ConnectNumberResponse>(
            `/telephony/providers/twilio/numbers/${encodeURIComponent(providerNumberId)}/connect?integrationId=${encodeURIComponent(integrationId)}`,
            {
                method: 'POST',
                body: JSON.stringify({
                    e164: input.e164,
                    agentId,
                }),
            },
        );
    },
};
