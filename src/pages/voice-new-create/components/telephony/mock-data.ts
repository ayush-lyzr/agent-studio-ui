import type { NumberBinding, ProviderNumber, TelephonyIntegration } from "./types";
import type { StoredAgent } from "@/lib/livekit/types";

export const MOCK_INTEGRATIONS: TelephonyIntegration[] = [
    {
        integrationId: "int_001",
        provider: "telnyx",
        status: "active",
        maskedKey: "****a1b2",
        createdAt: "2025-01-15T10:30:00Z",
    },
    {
        integrationId: "int_002",
        provider: "telnyx",
        status: "needs_attention",
        maskedKey: "****x9z8",
        createdAt: "2025-02-01T08:00:00Z",
    },
];

export const MOCK_NUMBERS: Record<string, ProviderNumber[]> = {
    int_001: [
        { providerNumberId: "pn_101", e164: "+14155550100" },
        { providerNumberId: "pn_102", e164: "+14155550101" },
        { providerNumberId: "pn_103", e164: "+12125550200" },
        { providerNumberId: "pn_104", e164: "+18005550300" },
    ],
    int_002: [
        { providerNumberId: "pn_201", e164: "+44207946000" },
        { providerNumberId: "pn_202", e164: "+44207946001" },
    ],
};

export const MOCK_BINDINGS: NumberBinding[] = [
    {
        id: "bind_001",
        provider: "telnyx",
        integrationId: "int_001",
        e164: "+14155550100",
        agentId: "agent_abc",
        agentName: "Sales Assistant",
        enabled: true,
    },
    {
        id: "bind_002",
        provider: "telnyx",
        integrationId: "int_001",
        e164: "+12125550200",
        agentId: "agent_def",
        agentName: "Support Bot",
        enabled: true,
    },
];

export const MOCK_AGENTS: StoredAgent[] = [
    {
        id: "agent_abc",
        config: { agent_name: "Sales Assistant", agent_description: "Handles inbound sales" },
        createdAt: "2025-01-10T12:00:00Z",
        updatedAt: "2025-02-05T15:30:00Z",
    },
    {
        id: "agent_def",
        config: { agent_name: "Support Bot", agent_description: "Customer support" },
        createdAt: "2025-01-12T09:00:00Z",
        updatedAt: "2025-02-06T11:00:00Z",
    },
    {
        id: "agent_ghi",
        config: { agent_name: "Booking Agent", agent_description: "Appointment scheduling" },
        createdAt: "2025-01-20T14:00:00Z",
        updatedAt: "2025-02-07T10:00:00Z",
    },
];
