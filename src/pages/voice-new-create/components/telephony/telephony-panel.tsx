import { useCallback, useEffect, useMemo, useState } from "react";
import { Phone, Plus, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/custom/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import useStore from "@/lib/store";
import type { StoredAgent } from "@/lib/livekit/types";

import type { NumberBinding, ProviderNumber, TelephonyIntegration } from "./types";
import { AddIntegrationDialog } from "./add-integration-dialog";
import { IntegrationsBar } from "./integrations-list";
import { NumberCard } from "./number-card";
import { ConfigureNumberDialog } from "./configure-number-dialog";
import {
    MOCK_INTEGRATIONS,
    MOCK_NUMBERS,
    MOCK_BINDINGS,
    MOCK_AGENTS,
} from "./mock-data";

const USE_MOCK_DATA =
    String(import.meta.env.VITE_TELEPHONY_USE_MOCK).toLowerCase() === "true";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TelephonyPanelProperties {
    agentId?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TelephonyPanel({ agentId }: TelephonyPanelProperties) {
    const { toast } = useToast();
    const apiKey = useStore((state) => state.api_key ?? "");
    const hasApiKey = USE_MOCK_DATA || Boolean(apiKey.trim());

    // ── state ──
    const [integrations, setIntegrations] = useState<TelephonyIntegration[]>([]);
    const [selectedIntegrationId, setSelectedIntegrationId] = useState<
        string | null
    >(null);
    const [numbers, setNumbers] = useState<ProviderNumber[]>([]);
    const [bindings, setBindings] = useState<NumberBinding[]>([]);
    const [agents, setAgents] = useState<StoredAgent[]>([]);

    const [loadingIntegrations, setLoadingIntegrations] = useState(true);
    const [loadingNumbers, setLoadingNumbers] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [configureNumber, setConfigureNumber] =
        useState<ProviderNumber | null>(null);

    // ── data fetching (mock or real) ──

    const fetchIntegrations = useCallback(async () => {
        if (!hasApiKey) {
            setIntegrations([]);
            setLoadingIntegrations(false);
            return;
        }

        setLoadingIntegrations(true);
        if (USE_MOCK_DATA) {
            await delay(400);
            setIntegrations(MOCK_INTEGRATIONS);
        } else {
            const { telephonyApi } = await import("./telephony-api");
            try {
                const [telnyxResponse, twilioResponse] = await Promise.allSettled([
                    telephonyApi.listIntegrations(),
                    telephonyApi.listTwilioIntegrations(),
                ]);
                const all: TelephonyIntegration[] = [
                    ...(telnyxResponse.status === "fulfilled"
                        ? telnyxResponse.value.data
                        : []),
                    ...(twilioResponse.status === "fulfilled"
                        ? twilioResponse.value.data
                        : []),
                ];
                setIntegrations(all);
            } catch {
                toast({
                    title: "Failed to load integrations",
                    variant: "destructive",
                });
            }
        }
        setLoadingIntegrations(false);
    }, [hasApiKey, toast]);

    const fetchBindings = useCallback(async () => {
        if (!hasApiKey) {
            setBindings([]);
            return;
        }

        if (USE_MOCK_DATA) {
            await delay(300);
            setBindings(MOCK_BINDINGS);
        } else {
            const { telephonyApi } = await import("./telephony-api");
            try {
                const response = await telephonyApi.listBindings();
                setBindings(response.data);
            } catch {
                toast({
                    title: "Failed to load bindings",
                    variant: "destructive",
                });
            }
        }
    }, [hasApiKey, toast]);

    const fetchAgents = useCallback(async () => {
        if (!hasApiKey) {
            setAgents([]);
            return;
        }

        if (USE_MOCK_DATA) {
            setAgents(MOCK_AGENTS);
        } else {
            const { backendClient } = await import(
                "@/lib/livekit/backend-client"
            );
            try {
                const response = await backendClient.listAgents();
                setAgents(response.agents);
            } catch {
                /* non-critical */
            }
        }
    }, [hasApiKey]);

    useEffect(() => {
        if (!hasApiKey) {
            setLoadingIntegrations(false);
            setSelectedIntegrationId(null);
            setNumbers([]);
            setBindings([]);
            setAgents([]);
            return;
        }

        void Promise.all([
            fetchIntegrations(),
            fetchBindings(),
            fetchAgents(),
        ]);
    }, [fetchAgents, fetchBindings, fetchIntegrations, hasApiKey]);

    // auto-select first integration
    useEffect(() => {
        if (selectedIntegrationId) return;
        if (integrations.length === 0) return;
        setSelectedIntegrationId(integrations[0]?.integrationId ?? null);
    }, [integrations, selectedIntegrationId]);

    // fetch numbers when integration is selected
    useEffect(() => {
        if (!hasApiKey || !selectedIntegrationId) {
            setNumbers([]);
            return;
        }
        let cancelled = false;
        setLoadingNumbers(true);

        void (async () => {
            try {
                if (USE_MOCK_DATA) {
                    await delay(350);
                    if (!cancelled) {
                        setNumbers(MOCK_NUMBERS[selectedIntegrationId] ?? []);
                    }
                    return;
                }

                const selectedIntegration = integrations.find(
                    (index) => index.integrationId === selectedIntegrationId,
                );
                const { telephonyApi } = await import("./telephony-api");
                const fetchFunction =
                    selectedIntegration?.provider === "twilio"
                        ? telephonyApi.listTwilioNumbers
                        : telephonyApi.listNumbers;

                const response = await fetchFunction(selectedIntegrationId);
                if (!cancelled) setNumbers(response.data);
            } catch {
                if (!cancelled) {
                    toast({
                        title: "Failed to load numbers",
                        variant: "destructive",
                    });
                }
            } finally {
                if (!cancelled) setLoadingNumbers(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [hasApiKey, selectedIntegrationId, integrations, toast]);

    // ── actions (mock or real) ──

    async function handleDisconnectIntegration(id: string) {
        setIsDisconnecting(true);
        if (USE_MOCK_DATA) {
            await delay(500);
            setIntegrations((previous) =>
                previous.filter((index) => index.integrationId !== id),
            );
            setBindings((previous) =>
                previous.filter((b) => b.integrationId !== id),
            );
            if (selectedIntegrationId === id) {
                setSelectedIntegrationId(null);
                setNumbers([]);
            }
            toast({ title: "Disconnected" });
        } else {
            const { telephonyApi } = await import("./telephony-api");
            const integration = integrations.find(
                (index) => index.integrationId === id,
            );
            try {
                await (integration?.provider === "twilio" ? telephonyApi.deleteTwilioIntegration(id) : telephonyApi.deleteIntegration(id));
                toast({ title: "Disconnected" });
                if (selectedIntegrationId === id) {
                    setSelectedIntegrationId(null);
                    setNumbers([]);
                }
                await fetchIntegrations();
                await fetchBindings();
            } catch {
                toast({
                    title: "Disconnect failed",
                    variant: "destructive",
                });
            }
        }
        setIsDisconnecting(false);
    }

    async function handleConnectNumber(
        providerNumberId: string,
        phoneNumberE164: string,
        targetAgentId: string,
    ) {
        if (!selectedIntegrationId) return;
        setIsConnecting(true);
        if (USE_MOCK_DATA) {
            await delay(400);
            const agent = agents.find((a) => a.id === targetAgentId);
            setBindings((previous) => [
                ...previous.filter(
                        (b) =>
                        b.e164 !== phoneNumberE164 ||
                        b.integrationId !== selectedIntegrationId,
                ),
                {
                    id: `bind_${Date.now()}`,
                    provider: "telnyx",
                    integrationId: selectedIntegrationId,
                    e164: phoneNumberE164,
                    agentId: targetAgentId,
                    agentName:
                        agent?.config?.agent_name ?? targetAgentId,
                    enabled: true,
                },
            ]);
            toast({
                title: "Number connected",
                description: `${phoneNumberE164} bound to agent.`,
            });
        } else {
            const { telephonyApi } = await import("./telephony-api");
            const integration = integrations.find(
                (index) => index.integrationId === selectedIntegrationId,
            );
            try {
                const connectFunction =
                    integration?.provider === "twilio"
                        ? telephonyApi.connectTwilioNumber
                        : telephonyApi.connectNumber;
                await connectFunction(
                    providerNumberId,
                    selectedIntegrationId,
                    targetAgentId,
                    { e164: phoneNumberE164 },
                );
                toast({
                    title: "Number connected",
                    description: `${phoneNumberE164} bound to agent.`,
                });
                await fetchBindings();
            } catch {
                toast({
                    title: "Connect failed",
                    variant: "destructive",
                });
            }
        }
        setIsConnecting(false);
    }

    async function handleDisconnectBinding(bindingId: string) {
        if (!selectedIntegrationId) return;
        if (USE_MOCK_DATA) {
            await delay(300);
            setBindings((previous) => previous.filter((b) => b.id !== bindingId));
            toast({ title: "Number disconnected" });
        } else {
            const { telephonyApi } = await import("./telephony-api");
            try {
                await telephonyApi.disconnectBinding(bindingId);
                toast({ title: "Number disconnected" });
                await fetchBindings();
            } catch {
                toast({
                    title: "Disconnect failed",
                    variant: "destructive",
                });
            }
        }
    }

    function handleRefresh() {
        if (!hasApiKey) return;
        if (selectedIntegrationId) {
            // re-trigger number fetch by resetting & re-setting
            const id = selectedIntegrationId;
            setSelectedIntegrationId(null);
            setTimeout(() => setSelectedIntegrationId(id), 0);
        }
        void fetchIntegrations();
        void fetchBindings();
    }

    // ── derived data ──

    const agentsById = useMemo(() => {
        const map = new Map<string, string>();
        for (const a of agents) {
            map.set(a.id, a.config?.agent_name ?? a.id);
        }
        return map;
    }, [agents]);

    const bindingsWithNames = useMemo(() => {
        return bindings.map((b) => ({
            ...b,
            agentName:
                b.agentName ??
                (b.agentId ? agentsById.get(b.agentId) ?? b.agentId : "—"),
        }));
    }, [agentsById, bindings]);

    function findBinding(phoneNumberE164: string): NumberBinding | undefined {
        return bindingsWithNames.find(
            (b) =>
                b.e164 === phoneNumberE164 &&
                b.integrationId === selectedIntegrationId &&
                b.enabled,
        );
    }

    const hasIntegrations = integrations.length > 0;
    const connectedCount = bindingsWithNames.filter(
        (b) =>
            b.integrationId === selectedIntegrationId && b.enabled,
    ).length;
    const availableCount = numbers.length - connectedCount;

    // ── configure dialog target ──
    const configureBinding = configureNumber
        ? findBinding(configureNumber.e164)
        : undefined;

    // ── render ──

    return (
        <div className="flex h-full flex-col space-y-6 overflow-y-auto">
            {/* ───── Header ───── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold">Telephony</h2>
                    <p className="text-sm text-muted-foreground">
                        Connect a Telnyx or Twilio account, then assign phone numbers to
                        your agents.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={loadingIntegrations || loadingNumbers}
                        leftSection={
                            <RefreshCw
                                className={cn(
                                    "h-4 w-4",
                                    loadingNumbers && "animate-spin",
                                )}
                            />
                        }
                    >
                        Refresh
                    </Button>
                    <Button
                        type="button"
                        onClick={() => setAddDialogOpen(true)}
                        leftSection={<Plus className="h-4 w-4" />}
                    >
                        Add Integration
                    </Button>
                </div>
            </div>

            {/* ───── Integration selector bar ───── */}
            {loadingIntegrations ? (
                <Skeleton className="h-9 w-72 rounded" />
            ) : (
                <IntegrationsBar
                    integrations={integrations}
                    selectedId={selectedIntegrationId}
                    onSelect={setSelectedIntegrationId}
                    onDisconnect={handleDisconnectIntegration}
                    isDisconnecting={isDisconnecting}
                />
            )}

            {/* ───── Stat cards ───── */}
            {hasIntegrations && selectedIntegrationId && !loadingNumbers && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <Card className="hover:translate-y-0 hover:border-input hover:shadow-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Connected
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {connectedCount}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="hover:translate-y-0 hover:border-input hover:shadow-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Available
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {availableCount}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="hover:translate-y-0 hover:border-input hover:shadow-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Numbers
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {numbers.length}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ───── Phone Numbers Grid ───── */}
            {selectedIntegrationId && (
                <div className="flex-1">
                    {(() => {
                        if (loadingNumbers) {
                            return (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {[1, 2, 3, 4, 5, 6].map((index) => (
                                        <Skeleton
                                            key={index}
                                            className="h-44 w-full rounded-lg"
                                        />
                                    ))}
                                </div>
                            );
                        }

                        if (numbers.length === 0) {
                            return (
                                <Card className="hover:translate-y-0 hover:border-input hover:shadow-none">
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <Phone className="mb-4 h-12 w-12 text-muted-foreground/50" />
                                        <p className="text-center text-sm text-muted-foreground">
                                            No phone numbers found for this integration.
                                            <br />
                                            Purchase numbers from your provider to get
                                            started.
                                        </p>
                                    </CardContent>
                                </Card>
                            );
                        }

                        return (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {numbers.map((number_) => (
                                    <NumberCard
                                        key={number_.providerNumberId}
                                        number={number_}
                                        binding={findBinding(number_.e164)}
                                        onAssign={(n) => setConfigureNumber(n)}
                                        onDisconnect={handleDisconnectBinding}
                                    />
                                ))}
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* ───── No-integration empty state ───── */}
            {!loadingIntegrations && !hasIntegrations && (
                <Card className="hover:translate-y-0 hover:border-input hover:shadow-none">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="mb-4 rounded-xl border bg-muted/40 p-4">
                            <Phone className="h-10 w-10 text-muted-foreground/60" />
                        </div>
                        <h3 className="text-base font-semibold">
                            No integrations connected
                        </h3>
                        <p className="mt-1 max-w-xs text-center text-sm text-muted-foreground">
                            Connect a Telnyx or Twilio account to import your
                            phone numbers and assign them to agents.
                        </p>
                        <div className="mt-3 flex gap-2">
                            <Badge
                                variant="outline"
                                className="text-[10px] font-semibold uppercase tracking-wide"
                            >
                                Telnyx
                            </Badge>
                            <Badge
                                variant="outline"
                                className="text-[10px] font-semibold uppercase tracking-wide"
                            >
                                Twilio
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ───── Active Bindings Summary ───── */}
            {bindingsWithNames.some((b) => b.enabled) && (
                <div className="space-y-2 border-t pt-4">
                    <h4 className="text-xs font-medium text-muted-foreground">
                        Active Bindings
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {bindingsWithNames
                            .filter((b) => b.enabled)
                            .map((b) => (
                                <div
                                    key={b.id}
                                    className={cn(
                                        "flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs",
                                        b.agentId === agentId
                                            ? "border-primary/30 bg-primary/[0.04]"
                                            : "border-border",
                                    )}
                                >
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                    <span className="font-mono">{b.e164}</span>
                                    <span className="text-muted-foreground">
                                        →
                                    </span>
                                    <span className="font-medium">
                                        {b.agentName ?? b.agentId}
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className="ml-0.5 border-green-200 bg-green-50 text-[9px] text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400"
                                    >
                                        live
                                    </Badge>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* ───── Dialogs ───── */}
            <AddIntegrationDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onIntegrationAdded={() => {
                    void fetchIntegrations();
                }}
            />

            {configureNumber && selectedIntegrationId && (
                <ConfigureNumberDialog
                    open={!!configureNumber}
                    onOpenChange={(open) => {
                        if (!open) setConfigureNumber(null);
                    }}
                    number={configureNumber}
                    binding={configureBinding}
                    agents={agents}
                    integrationId={selectedIntegrationId}
                    onConfirm={handleConnectNumber}
                    isSubmitting={isConnecting}
                />
            )}
        </div>
    );
}

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
