import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/custom/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/custom/confirm-dialog";
import { cn } from "@/lib/utils";

import type { IntegrationStatus, TelephonyIntegration } from "./types";

interface IntegrationsBarProperties {
    integrations: TelephonyIntegration[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onDisconnect: (id: string) => void;
    isDisconnecting: boolean;
}

const STATUS_STYLE: Record<
    IntegrationStatus,
    { label: string; className: string }
> = {
    active: {
        label: "Active",
        className:
            "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400",
    },
    needs_attention: {
        label: "Needs Attention",
        className:
            "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400",
    },
    disconnected: {
        label: "Disconnected",
        className:
            "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400",
    },
};

export function IntegrationsBar({
    integrations,
    selectedId,
    onSelect,
    onDisconnect,
    isDisconnecting,
}: IntegrationsBarProperties) {
    const [confirmId, setConfirmId] = useState<string | null>(null);

    if (integrations.length === 0) return null;

    const selected = integrations.find((index) => index.integrationId === selectedId);
    const badge = selected ? STATUS_STYLE[selected.status] : null;

    return (
        <>
            <div className="flex flex-wrap items-center gap-3">
                {integrations.length === 1 ? (
                    <div className="flex items-center gap-2.5">
                        <Badge
                            variant="outline"
                            className="shrink-0 text-[10px] font-semibold uppercase tracking-wide"
                        >
                            {integrations[0].provider === 'twilio' ? 'Twilio' : 'Telnyx'}
                        </Badge>
                        <span className="truncate font-mono text-xs text-muted-foreground">
                            {integrations[0].maskedKey}
                        </span>
                        {badge && (
                            <Badge
                                variant="outline"
                                className={cn(
                                    "shrink-0 text-[10px]",
                                    badge.className,
                                )}
                            >
                                {badge.label}
                            </Badge>
                        )}
                    </div>
                ) : (
                    <>
                        <Select
                            value={selectedId ?? undefined}
                            onValueChange={onSelect}
                        >
                            <SelectTrigger className="h-8 w-[260px] text-xs">
                                <SelectValue placeholder="Select integration" />
                            </SelectTrigger>
                            <SelectContent>
                                {integrations.map((index) => (
                                    <SelectItem
                                        key={index.integrationId}
                                        value={index.integrationId}
                                    >
                                        <span className="mr-1.5 text-[10px] font-semibold uppercase text-muted-foreground">
                                            {index.provider === 'twilio' ? 'Twilio' : 'Telnyx'}
                                        </span>
                                        <span className="font-mono">
                                            {index.maskedKey}
                                        </span>
                                        <span className="ml-2 text-muted-foreground">
                                            ({STATUS_STYLE[index.status].label})
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {badge && (
                            <Badge
                                variant="outline"
                                className={cn(
                                    "shrink-0 text-[10px]",
                                    badge.className,
                                )}
                            >
                                {badge.label}
                            </Badge>
                        )}
                    </>
                )}

                {selected && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setConfirmId(selected.integrationId)}
                        leftSection={<Trash2 className="h-3.5 w-3.5" />}
                    >
                        Disconnect
                    </Button>
                )}
            </div>

            <ConfirmDialog
                open={confirmId !== null}
                onOpenChange={(open) => {
                    if (!open) setConfirmId(null);
                }}
                title="Disconnect Integration"
                description="This will disable the stored API key for this integration. Existing number bindings will remain active until you disconnect them."
                onConfirm={() => {
                    if (confirmId) {
                        onDisconnect(confirmId);
                        setConfirmId(null);
                    }
                }}
                isLoading={isDisconnecting}
                loadingLabel="Disconnecting…"
            />
        </>
    );
}
