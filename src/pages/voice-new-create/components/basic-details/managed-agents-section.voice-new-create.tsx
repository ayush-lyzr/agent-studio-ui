import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    useFieldArray,
    useWatch,
    type FieldArrayWithId,
    type UseFormReturn,
} from 'react-hook-form';
import {
    AlertTriangle,
    Check,
    ChevronDown,
    ExternalLink,
    Plus,
    RefreshCw,
    X,
} from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import useStore from '@/lib/store';
import type { IAgent } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAgentBuilder } from '@/pages/agent-builder/agent-builder.service';
import type { VoiceNewCreateFormValues } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ManagedAgentFormValue = {
    id: string;
    name: string;
    usage_description: string;
};

type ManagedAgentField = FieldArrayWithId<
    VoiceNewCreateFormValues,
    'managed_agents.agents',
    'fieldKey'
>;

interface VoiceNewCreateManagedAgentsSectionProperties {
    form: UseFormReturn<VoiceNewCreateFormValues>;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useEffectiveApiKey(): string {
    const apiKey = useStore((state) => state.api_key);
    return useMemo(() => {
        return (
            apiKey?.trim() ||
            (globalThis.window === undefined
                ? ''
                : (localStorage.getItem('lyzrApiKey') ?? '').trim())
        );
    }, [apiKey]);
}

function useNonVoiceAgents(apiKey: string) {
    const { isFetchingAgents, getAgents } = useAgentBuilder({ apiKey });
    const [agents, setAgents] = useState<IAgent[]>([]);

    const refreshAgents = useCallback(async () => {
        if (!apiKey) return;
        const response = await getAgents();
        const all = Array.isArray(response.data) ? response.data : [];
        setAgents(all.filter((a: IAgent) => !a.voice_config));
    }, [apiKey, getAgents]);

    useEffect(() => {
        if (apiKey) refreshAgents();
    }, [apiKey, refreshAgents]);

    return { agents, refreshAgents, isFetchingAgents };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function WarningBanner() {
    return (
        <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <p className="text-xs text-yellow-500">
                Manager agents perform best with high-reasoning models (e.g., Gemini 2.5+, Claude 4
                series, GPT-5 series)
            </p>
        </div>
    );
}

interface AgentPickerProperties {
    rowIndex: number;
    form: UseFormReturn<VoiceNewCreateFormValues>;
    agents: IAgent[];
    selectedIds: ReadonlySet<string>;
    isFetching: boolean;
    onRefresh: () => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function AgentPicker({
    rowIndex,
    form,
    agents,
    selectedIds,
    isFetching,
    onRefresh,
    open,
    onOpenChange,
}: AgentPickerProperties) {
    const currentId: string =
        useWatch({ control: form.control, name: `managed_agents.agents.${rowIndex}.id` }) ?? '';
    const currentName: string =
        useWatch({ control: form.control, name: `managed_agents.agents.${rowIndex}.name` }) ?? '';

    const handleSelect = useCallback(
        (agentId: string) => {
            const agent = agents.find((a) => a._id === agentId);
            if (!agent) return;
            form.setValue(`managed_agents.agents.${rowIndex}.id`, agent._id, {
                shouldDirty: true,
            });
            form.setValue(`managed_agents.agents.${rowIndex}.name`, agent.name, {
                shouldDirty: true,
            });
            onOpenChange(false);
        },
        [agents, form, rowIndex, onOpenChange],
    );

    return (
        <div className="flex gap-2">
            <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={onRefresh}
                disabled={isFetching}
                className="h-9"
            >
                <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            </Button>

            <div className="w-[200px]">
                <Popover open={open} onOpenChange={onOpenChange}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="h-9 w-[200px] justify-between"
                            type="button"
                        >
                            <span className="w-[90%] truncate">
                                {currentName || 'Select an agent'}
                            </span>
                            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-[260px] p-0">
                        <Command>
                            <CommandInput placeholder="Search agents..." />
                            <CommandList>
                                <CommandEmpty className="p-2 text-sm text-gray-500">
                                    No agents found.
                                </CommandEmpty>
                                <CommandGroup>
                                    {agents.map((a) => {
                                        const takenElsewhere =
                                            selectedIds.has(a._id) && a._id !== currentId;
                                        return (
                                            <CommandItem
                                                key={a._id}
                                                disabled={takenElsewhere}
                                                onSelect={() => handleSelect(a._id)}
                                                className="flex items-center justify-between"
                                                value={a.name}
                                            >
                                                <span className="truncate">{a.name}</span>
                                                {currentId === a._id && (
                                                    <Check className="h-4 w-4 text-green-600" />
                                                )}
                                            </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}

interface AgentRowProperties {
    fieldKey: string;
    rowIndex: number;
    form: UseFormReturn<VoiceNewCreateFormValues>;
    agents: IAgent[];
    selectedIds: ReadonlySet<string>;
    isFetching: boolean;
    onRefresh: () => void;
    openPopoverKey: string | null;
    setOpenPopoverKey: (key: string | null) => void;
    onRemove: (index: number) => void;
}

function AgentRow({
    fieldKey,
    rowIndex,
    form,
    agents,
    selectedIds,
    isFetching,
    onRefresh,
    openPopoverKey,
    setOpenPopoverKey,
    onRemove,
}: AgentRowProperties) {
    const currentId: string =
        useWatch({ control: form.control, name: `managed_agents.agents.${rowIndex}.id` }) ?? '';

    return (
        <div className="flex gap-4">
            <AgentPicker
                rowIndex={rowIndex}
                form={form}
                agents={agents}
                selectedIds={selectedIds}
                isFetching={isFetching}
                onRefresh={onRefresh}
                open={openPopoverKey === fieldKey}
                onOpenChange={(open) => setOpenPopoverKey(open ? fieldKey : null)}
            />

            <div className="flex flex-1 gap-2">
                <div className="relative flex-1">
                    <FormField
                        control={form.control}
                        name={`managed_agents.agents.${rowIndex}.usage_description`}
                        render={({ field }) => (
                            <Input
                                {...field}
                                className="w-full pr-6"
                                placeholder="How would you use this agent?"
                            />
                        )}
                    />
                </div>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link
                            to={currentId ? `/agent-create/${currentId}` : '#'}
                            target={currentId ? '_blank' : undefined}
                            aria-disabled={!currentId}
                            tabIndex={currentId ? 0 : -1}
                            className={cn(
                                buttonVariants({ variant: 'outline', size: 'icon' }),
                                !currentId && 'pointer-events-none opacity-50',
                            )}
                        >
                            <ExternalLink className="h-4 w-4" />
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent>View Agent</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger>
                        <Button
                            variant="outline"
                            size="icon"
                            type="button"
                            className="group"
                            onClick={() => onRemove(rowIndex)}
                        >
                            <X className="h-4 w-4 group-hover:text-destructive" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove Agent</TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
}

interface AgentsFieldsetProperties {
    fields: ManagedAgentField[];
    form: UseFormReturn<VoiceNewCreateFormValues>;
    agents: IAgent[];
    selectedIds: ReadonlySet<string>;
    isFetching: boolean;
    onRefresh: () => void;
    openPopoverKey: string | null;
    setOpenPopoverKey: (key: string | null) => void;
    onRemove: (index: number) => void;
}

function AgentsFieldset({
    fields,
    form,
    agents,
    selectedIds,
    isFetching,
    onRefresh,
    openPopoverKey,
    setOpenPopoverKey,
    onRemove,
}: AgentsFieldsetProperties) {
    if (fields.length === 0) return null;

    return (
        <fieldset className="grid gap-2 rounded-lg border p-2">
            <legend className="text-xxs">Agents</legend>
            {fields.map((field, index) => (
                <AgentRow
                    key={field.fieldKey}
                    fieldKey={field.fieldKey}
                    rowIndex={index}
                    form={form}
                    agents={agents}
                    selectedIds={selectedIds}
                    isFetching={isFetching}
                    onRefresh={onRefresh}
                    openPopoverKey={openPopoverKey}
                    setOpenPopoverKey={setOpenPopoverKey}
                    onRemove={onRemove}
                />
            ))}
        </fieldset>
    );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function VoiceNewCreateManagedAgentsSection({
    form,
}: VoiceNewCreateManagedAgentsSectionProperties) {
    const effectiveApiKey = useEffectiveApiKey();
    const { agents, refreshAgents, isFetchingAgents } = useNonVoiceAgents(effectiveApiKey);

    const [openPopoverKey, setOpenPopoverKey] = useState<string | null>(null);

    const { fields, append, remove } = useFieldArray<
        VoiceNewCreateFormValues,
        'managed_agents.agents',
        'fieldKey'
    >({
        control: form.control,
        name: 'managed_agents.agents',
        keyName: 'fieldKey',
    });

    const watchedAgents = useWatch({
        control: form.control,
        name: 'managed_agents.agents',
    }) as ManagedAgentFormValue[] | undefined;

    const selectedIds = useMemo(() => {
        const list = Array.isArray(watchedAgents) ? watchedAgents : [];
        return new Set<string>(list.map((a) => a.id).filter(Boolean));
    }, [watchedAgents]);

    const handleAdd = useCallback(() => {
        append({ id: '', name: '', usage_description: '' });
    }, [append]);

    const handleRemove = useCallback(
        (index: number) => {
            remove(index);
        },
        [remove],
    );

    return (
        <FormField
            control={form.control}
            name="managed_agents"
            render={() => (
                <FormItem className="mt-4">
                    <WarningBanner />

                    <div className="space-y-4">
                        <AgentsFieldset
                            fields={fields as ManagedAgentField[]}
                            form={form}
                            agents={agents}
                            selectedIds={selectedIds}
                            isFetching={isFetchingAgents}
                            onRefresh={refreshAgents}
                            openPopoverKey={openPopoverKey}
                            setOpenPopoverKey={setOpenPopoverKey}
                            onRemove={handleRemove}
                        />

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full items-center justify-center"
                            size="sm"
                            onClick={handleAdd}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Agent
                        </Button>
                    </div>

                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
