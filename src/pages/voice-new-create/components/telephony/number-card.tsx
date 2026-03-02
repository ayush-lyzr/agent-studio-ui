import { Check, Ellipsis, Link2Off, Phone, Settings } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { NumberBinding, ProviderNumber } from "./types";

interface NumberCardProperties {
    number: ProviderNumber;
    binding: NumberBinding | undefined;
    onAssign: (number: ProviderNumber) => void;
    onDisconnect: (bindingId: string) => void;
}

export function NumberCard({
    number,
    binding,
    onAssign,
    onDisconnect,
}: NumberCardProperties) {
    const isBound = !!binding;

    return (
        <Card className="relative hover:translate-y-0 hover:border-input hover:shadow-none focus:outline-none focus-visible:outline-none">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full " +
                                (isBound
                                    ? "bg-green-100 dark:bg-green-950/30"
                                    : "bg-primary/10")
                            }
                        >
                            <Phone
                                className={
                                    "h-5 w-5 " +
                                    (isBound
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-primary")
                                }
                            />
                        </div>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-semibold">
                                {number.e164}
                            </CardTitle>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isBound ? (
                            <Badge
                                variant="default"
                                className="bg-green-600 text-xs"
                            >
                                <Check className="mr-1 h-3 w-3" />
                                Connected
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="text-xs">
                                Available
                            </Badge>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                >
                                    <Ellipsis className="h-4 w-4" />
                                    <span className="sr-only">
                                        Phone number actions
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => onAssign(number)}
                                >
                                    <Settings className="mr-2 h-4 w-4" />
                                    {isBound ? "Reassign Agent" : "Assign Agent"}
                                </DropdownMenuItem>
                                {isBound && binding?.id && (
                                    <DropdownMenuItem
                                        className="cursor-pointer text-destructive focus:text-destructive"
                                        onClick={() =>
                                            onDisconnect(binding.id)
                                        }
                                    >
                                        <Link2Off className="mr-2 h-4 w-4" />
                                        Disconnect
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {isBound && binding ? (
                    <div className="rounded-lg bg-secondary p-3">
                        <div className="mb-1 text-xs font-medium text-muted-foreground">
                            Connected Agent
                        </div>
                        <div className="text-sm font-medium">
                            {binding.agentName ?? binding.agentId}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Not connected to any agent. Assign one to start
                        receiving calls.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
