import { useMemo, useState } from 'react';
import { ArrowRight, Plus, Trash2, Volume2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const MAX_KEYS = 200;
const MAX_VALUE_LENGTH = 256;

function getSortedEntries(record: Record<string, string>) {
    // Keep Array#sort for TS target compatibility in this project.
    // eslint-disable-next-line unicorn/no-array-sort
    return Object.entries(record).sort(([a], [b]) => a.localeCompare(b));
}

export interface PronunciationRulesEditorProperties {
    value: Record<string, string>;
    onChange: (next: Record<string, string>) => void;
}

export function PronunciationRulesEditor({
    value,
    onChange,
}: PronunciationRulesEditorProperties) {
    const [draftKey, setDraftKey] = useState('');
    const [draftValue, setDraftValue] = useState('');
    const [error, setError] = useState<string | null>(null);

    const entries = useMemo(() => getSortedEntries(value), [value]);

    function handleAdd() {
        const key = draftKey.trim();
        if (!key) {
            setError('Term is required.');
            return;
        }
        if (!(key in value) && entries.length >= MAX_KEYS) {
            setError(`You can add at most ${MAX_KEYS} rules.`);
            return;
        }
        const normalizedValue =
            draftValue.length > MAX_VALUE_LENGTH
                ? draftValue.slice(0, MAX_VALUE_LENGTH)
                : draftValue;

        if (draftValue.length > MAX_VALUE_LENGTH) {
            setError(`Pronunciation was truncated to ${MAX_VALUE_LENGTH} characters.`);
        }

        onChange({ ...value, [key]: normalizedValue });
        setDraftKey('');
        setDraftValue('');
    }

    function handleInlineEdit(key: string, nextValueRaw: string) {
        const nextValue =
            nextValueRaw.length > MAX_VALUE_LENGTH
                ? nextValueRaw.slice(0, MAX_VALUE_LENGTH)
                : nextValueRaw;
        if (nextValueRaw.length > MAX_VALUE_LENGTH) {
            setError(`Pronunciation was truncated to ${MAX_VALUE_LENGTH} characters.`);
        } else {
            setError(null);
        }
        onChange({ ...value, [key]: nextValue });
    }

    function handleRemove(key: string) {
        if (!(key in value)) return;
        const next = { ...value };
        delete next[key];
        onChange(next);
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_1.5fr_auto]">
                <div className="space-y-1">
                    <Label className="text-xs font-semibold">Term</Label>
                    <Input
                        type="text"
                        value={draftKey}
                        onChange={(event) => {
                            setDraftKey(event.target.value);
                            setError(null);
                        }}
                        placeholder="API"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs font-semibold">Pronunciation</Label>
                    <Input
                        type="text"
                        value={draftValue}
                        onChange={(event) => {
                            setDraftValue(event.target.value);
                            setError(null);
                        }}
                        placeholder="A P I"
                    />
                </div>
                <Button type="button" onClick={handleAdd} className="w-full md:w-auto">
                    <Plus className="mr-1.5 size-4" />
                    Add
                </Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {entries.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8">
                    <Volume2 className="size-8 text-muted-foreground" />
                    <p className="text-sm font-medium">No pronunciation rules yet</p>
                    <div className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                            API <ArrowRight className="size-3" /> A P I
                        </span>
                        <span className="inline-flex items-center gap-1">
                            NVIDIA <ArrowRight className="size-3" /> en-vee-dee-uh
                        </span>
                        <span className="inline-flex items-center gap-1">
                            SQL <ArrowRight className="size-3" /> sequel
                        </span>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Label className="text-xs font-semibold">Rules</Label>
                            <Badge variant="secondary">{entries.length}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">Sorted A–Z</span>
                    </div>

                    <ScrollArea className="max-h-[320px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Term</TableHead>
                                    <TableHead>Spoken as</TableHead>
                                    <TableHead className="w-[60px]" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {entries.map(([key, currentValue]) => (
                                    <TableRow key={key}>
                                        <TableCell className="truncate font-mono text-xs">
                                            {key}
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="text"
                                                value={currentValue}
                                                onChange={(event) =>
                                                    handleInlineEdit(key, event.target.value)
                                                }
                                                placeholder="Pronunciation"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemove(key)}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            )}
        </div>
    );
}
