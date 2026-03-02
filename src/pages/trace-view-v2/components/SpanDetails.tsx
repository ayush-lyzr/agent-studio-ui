import { useTraceViewStore } from '../trace-view.store';
import { formatDuration } from './gantt-utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSpanDisplay } from '@/lib/span-utils';

const SpanDetails = () => {
    const selectedSpan = useTraceViewStore((state) => state.selectedSpan);

    if (!selectedSpan) {
        return (
            <div className="h-full border border-border rounded-lg bg-card p-6 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Select a span to view details</p>
            </div>
        );
    }

    // Check if this is an LLM generation span or inference span
    const lowerSpanName = selectedSpan.span_name.toLowerCase();
    const isLLMGeneration =
        lowerSpanName === 'llm_generation' ||
        lowerSpanName === 'llm_generation_stream' ||
        lowerSpanName === 'async_llm_generation';
    const isInference = lowerSpanName === 'inference';

    // Show input/output prominently for both LLM generation and inference spans
    const shouldShowInputOutput = isLLMGeneration || isInference;

    // Extract input and output from tags if this is an LLM generation or inference span
    const llmInput = shouldShowInputOutput ? selectedSpan.tags.input : null;
    const llmOutput = shouldShowInputOutput ? selectedSpan.tags.output : null;

    // Filter out input and output from other tags for LLM generation and inference spans
    const otherTags = shouldShowInputOutput
        ? Object.entries(selectedSpan.tags).filter(([key]) => key !== 'input' && key !== 'output')
        : Object.entries(selectedSpan.tags);

    // Get readable display name and icon
    // For inference spans, pass the agent_name from tags if available
    const agentName = selectedSpan.tags?.agent_name;
    const spanDisplay = getSpanDisplay(selectedSpan.span_name, agentName);
    const SpanIcon = spanDisplay.icon;

    return (
        <div className="h-full border border-border rounded-lg bg-card overflow-hidden">
            <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                                <SpanIcon className="h-5 w-5 text-muted-foreground" />
                                <h2 className="text-lg font-semibold">{spanDisplay.name}</h2>
                            </div>
                            <Badge variant={selectedSpan.hasError ? 'destructive' : 'default'}>
                                {selectedSpan.hasError ? 'Error' : selectedSpan.statusCode}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{selectedSpan.service_name}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">{selectedSpan.span_name}</p>
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
                                    {new Date(selectedSpan.startTime).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">End Time</span>
                                <span className="font-mono text-xs">
                                    {new Date(selectedSpan.startTime + selectedSpan.duration).toLocaleString()}
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
                                    {/* Show Input and Output at the top for LLM generation and inference spans */}
                                    {shouldShowInputOutput && (llmInput || llmOutput) && (
                                        <>
                                            {llmInput && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-semibold text-foreground">
                                                        Input
                                                    </span>
                                                    <div className="bg-muted rounded p-3 border border-border overflow-x-auto">
                                                        <pre className="text-xs font-mono whitespace-pre-wrap break-all">
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
                                                    <div className="bg-muted rounded p-3 border border-border overflow-x-auto">
                                                        <pre className="text-xs font-mono whitespace-pre-wrap break-all">
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
                                            <span className="text-xs font-medium text-muted-foreground break-words">
                                                {key}
                                            </span>
                                            <div className="bg-muted rounded p-2 overflow-x-auto">
                                                <pre className="text-xs font-mono whitespace-pre-wrap break-all">
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
                                        <div key={index} className="bg-muted rounded p-3 space-y-2">
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="text-sm font-medium break-words">{event.name}</span>
                                                <span className="text-xs text-muted-foreground font-mono shrink-0">
                                                    {new Date(event.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            {event.attributes && Object.keys(event.attributes).length > 0 && (
                                                <div className="space-y-1">
                                                    {Object.entries(event.attributes).map(([key, value]) => (
                                                        <div key={key} className="text-xs break-words">
                                                            <span className="text-muted-foreground break-words">{key}: </span>
                                                            <span className="font-mono break-all">
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