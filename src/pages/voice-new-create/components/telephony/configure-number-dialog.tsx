import { useState } from "react";
import { Phone, User } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/custom/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import type { StoredAgent } from "@/lib/livekit/types";
import type { NumberBinding, ProviderNumber } from "./types";

interface ConfigureNumberDialogProperties {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    number: ProviderNumber;
    binding: NumberBinding | undefined;
    agents: StoredAgent[];
    integrationId: string;
    onConfirm: (
        providerNumberId: string,
        phoneNumberE164: string,
        agentId: string,
    ) => Promise<void> | void;
    isSubmitting?: boolean;
}

export function ConfigureNumberDialog({
    open,
    onOpenChange,
    number,
    binding,
    agents,
    onConfirm,
    isSubmitting = false,
}: ConfigureNumberDialogProperties) {
    const [selectedAgentId, setSelectedAgentId] = useState(
        binding?.agentId ?? "",
    );

    const selectedAgent = agents.find((a) => a.id === selectedAgentId);
    const isReassign = !!binding;

    function handleOpenChange(next: boolean) {
        if (!next) setSelectedAgentId(binding?.agentId ?? "");
        onOpenChange(next);
    }

    async function handleConfirm() {
        if (!selectedAgentId) return;
        await onConfirm(number.providerNumberId, number.e164, selectedAgentId);
        handleOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isReassign
                            ? "Reassign Agent"
                            : "Configure Phone Number"}
                    </DialogTitle>
                    <DialogDescription>
                        {isReassign
                            ? "Change which agent this phone number connects to."
                            : "Connect this phone number to a voice agent to start receiving inbound calls."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Phone Number Display */}
                    <div className="rounded-lg border bg-muted/50 p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                <Phone className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <div className="font-semibold">
                                    {number.e164}
                                </div>
                                {isReassign && binding?.agentName && (
                                    <div className="text-xs text-muted-foreground">
                                        Currently assigned to{" "}
                                        <span className="font-medium">
                                            {binding.agentName}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Agent Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="agent-select">
                            Select Voice Agent{" "}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={selectedAgentId}
                            onValueChange={setSelectedAgentId}
                        >
                            <SelectTrigger
                                id="agent-select"
                                className="focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0"
                            >
                                <SelectValue placeholder="Choose an agent…" />
                            </SelectTrigger>
                            <SelectContent>
                                {agents.length === 0 ? (
                                    <div className="p-2 text-center text-sm text-muted-foreground">
                                        No voice agents available
                                    </div>
                                ) : (
                                    agents.map((agent) => (
                                        <SelectItem
                                            key={agent.id}
                                            value={agent.id}
                                        >
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                {agent.config?.agent_name ??
                                                    agent.id}
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>

                        {selectedAgent && (
                            <div className="rounded-md bg-muted p-3 text-sm">
                                <div className="font-medium">
                                    {selectedAgent.config?.agent_name ??
                                        selectedAgent.id}
                                </div>
                                {selectedAgent.config?.agent_description && (
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        {selectedAgent.config.agent_description}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!selectedAgentId}
                        loading={isSubmitting}
                    >
                        {isReassign ? "Reassign" : "Connect"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
