import { useTraceViewStore } from '../trace-view.store';
import { formatDuration } from './gantt-utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SpanDetails = () => {
    const selectedSpan = useTraceViewStore((state) => state.selectedSpan);

    if (!selectedSpan) {
        return (
            <div className="w-[30%] border border-border rounded-lg bg-card p-6 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Select a span to view details</p>
            </div>
        );
    }

    // Check if this is an LLM generation span
    const isLLMGeneration =
        selectedSpan.span_name.toLowerCase() === 'llm_generation' ||
        selectedSpan.span_name.toLowerCase() === 'async_llm_generation';

    // Extract input and output from tags if this is an LLM generation span
    const llmInput = isLLMGeneration ? selectedSpan.tags.input : null;
    const llmOutput = isLLMGeneration ? selectedSpan.tags.output : null;

    // Filter out input and output from other tags for LLM generation spans
    const otherTags = isLLMGeneration
        ? Object.entries(selectedSpan.tags).filter(([key]) => key !== 'input' && key !== 'output')
        : Object.entries(selectedSpan.tags);

    return (
        <div className="w-[30%] border border-border rounded-lg bg-card h-full overflow-hidden">
            <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div>
                        <h2 className="text-lg font-semibold mb-1">{selectedSpan.span_name}</h2>
                        <p className="text-sm text-muted-foreground">{selectedSpan.service_name}</p>
                    </div>

                    <Separator />

                    {/* Status and Kind */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Badge variant={selectedSpan.hasError ? 'destructive' : 'default'}>
                                {selectedSpan.hasError ? 'Error' : selectedSpan.statusCode}
                            </Badge>
                        </div>
                    </div>

                    <Separator />

                    {/* Timing Information */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3">Timing</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Duration</span>
                                <span className="font-mono font-medium">
                                    {formatDuration(selectedSpan.duration)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Start Time</span>
                                <span className="font-mono text-xs">
                                    {new Date(selectedSpan.startTime).toLocaleString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        hour12: true,
                                    })}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">End Time</span>
                                <span className="font-mono text-xs">
                                    {new Date(selectedSpan.startTime + selectedSpan.duration).toLocaleString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        hour12: true,
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tabs for Tags and Events */}
                    <Separator />
                    <Tabs defaultValue="tags" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="tags">
                                Tags {Object.keys(selectedSpan.tags).length > 0 && `(${Object.keys(selectedSpan.tags).length})`}
                            </TabsTrigger>
                            <TabsTrigger value="events">
                                Events {selectedSpan.events?.length > 0 && `(${selectedSpan.events.length})`}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="tags" className="mt-4">
                            {Object.keys(selectedSpan.tags).length > 0 ? (
                                <div className="space-y-3">
                                    {/* Show Input and Output at the top for LLM generation spans */}
                                    {isLLMGeneration && (llmInput || llmOutput) && (
                                        <>
                                            {llmInput && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-semibold text-foreground">
                                                        Input
                                                    </span>
                                                    <div className="bg-slate-100 dark:bg-slate-800/50 rounded p-3 border border-slate-200 dark:border-slate-700">
                                                        <pre className="text-xs font-mono whitespace-pre-wrap break-all text-slate-800 dark:text-slate-200">
                                                            {typeof llmInput === 'object'
                                                                ? JSON.stringify(llmInput, null, 2)
                                                                : String(llmInput)}
                                                        </pre>
                                                    </div>
                                                </div>
                                            )}
                                            {llmOutput && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-semibold text-foreground">
                                                        Output
                                                    </span>
                                                    <div className="bg-slate-100 dark:bg-slate-800/50 rounded p-3 border border-slate-200 dark:border-slate-700">
                                                        <pre className="text-xs font-mono whitespace-pre-wrap break-all text-slate-800 dark:text-slate-200">
                                                            {typeof llmOutput === 'object'
                                                                ? JSON.stringify(llmOutput, null, 2)
                                                                : String(llmOutput)}
                                                        </pre>
                                                    </div>
                                                </div>
                                            )}
                                            {otherTags.length > 0 && <Separator />}
                                        </>
                                    )}

                                    {/* Show other tags */}
                                    {otherTags.map(([key, value]) => (
                                        <div key={key} className="flex flex-col gap-1">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {key}
                                            </span>
                                            <div className="bg-slate-100 dark:bg-slate-800/50 rounded p-2 border border-slate-200 dark:border-slate-700">
                                                <pre className="text-xs font-mono whitespace-pre-wrap break-all text-slate-800 dark:text-slate-200">
                                                    {typeof value === 'object'
                                                        ? JSON.stringify(value, null, 2)
                                                        : String(value)}
                                                </pre>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No tags available</p>
                            )}
                        </TabsContent>

                        <TabsContent value="events" className="mt-4">
                            {selectedSpan.events && selectedSpan.events.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedSpan.events.map((event, index) => (
                                        <div key={index} className="bg-slate-100 dark:bg-slate-800/50 rounded p-3 space-y-2 border border-slate-200 dark:border-slate-700">
                                            <div className="flex justify-between items-start">
                                                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{event.name}</span>
                                                <span className="text-xs text-muted-foreground font-mono">
                                                    {new Date(event.timestamp).toLocaleTimeString(undefined, {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit',
                                                        hour12: true,
                                                    })}
                                                </span>
                                            </div>
                                            {event.attributes && Object.keys(event.attributes).length > 0 && (
                                                <div className="space-y-1">
                                                    {Object.entries(event.attributes).map(([key, value]) => (
                                                        <div key={key} className="text-xs">
                                                            <span className="text-muted-foreground">{key}: </span>
                                                            <span className="font-mono text-slate-800 dark:text-slate-200">
                                                                {typeof value === 'object'
                                                                    ? JSON.stringify(value)
                                                                    : String(value)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No events available</p>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </ScrollArea>
        </div>
    );
};

export default SpanDetails;