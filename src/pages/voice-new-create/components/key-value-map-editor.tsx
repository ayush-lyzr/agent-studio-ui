import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

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

const KEY_RE = /^[a-z0-9_]+$/;
const MAX_KEYS = 100;
const MAX_VALUE_LENGTH = 4096;

function getSortedEntries(record: Record<string, string>) {
    // Keep Array#sort for TS target compatibility in this project.
    // eslint-disable-next-line unicorn/no-array-sort
    return Object.entries(record).sort(([a], [b]) => a.localeCompare(b));
}

export interface KeyValueMapEditorProperties {
    title: string;
    description?: string;
    value: Record<string, string>;
    onChange: (next: Record<string, string>) => void;
    emptyStateText?: string;
}

export function KeyValueMapEditor({
    title,
    description,
    value,
    onChange,
}: KeyValueMapEditorProperties) {
    const [draftKey, setDraftKey] = useState('');
    const [draftValue, setDraftValue] = useState('');
    const [error, setError] = useState<string | null>(null);

    const entries = useMemo(() => getSortedEntries(value), [value]);

    function handleAdd() {
        const key = draftKey.trim();
        if (!key) {
            setError('Key is required.');
            return;
        }
        if (!KEY_RE.test(key)) {
            setError('Key must be snake_case: only "a-z", "0-9", and "_"');
            return;
        }
        if (!(key in value) && entries.length >= MAX_KEYS) {
            setError(`You can add at most ${MAX_KEYS} keys.`);
            return;
        }
        const normalizedValue =
            draftValue.length > MAX_VALUE_LENGTH
                ? draftValue.slice(0, MAX_VALUE_LENGTH)
                : draftValue;

        if (draftValue.length > MAX_VALUE_LENGTH) {
            setError(`Value was truncated to ${MAX_VALUE_LENGTH} characters.`);
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
            setError(`Value was truncated to ${MAX_VALUE_LENGTH} characters.`);
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
            <div className="space-y-1">
                <p className="text-sm font-medium">{title}</p>
                {description ? (
                    <p className="text-xs text-muted-foreground">{description}</p>
                ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1.5fr_auto]">
                <div className="space-y-1">
                    <Label className="text-xs font-semibold">Key</Label>
                    <Input
                        type="text"
                        value={draftKey}
                        onChange={(event) => {
                            setDraftKey(event.target.value);
                            setError(null);
                        }}
                        placeholder="company_name"
                    />
                    <p className="text-xs text-muted-foreground">
                        Use snake_case, a–z, 0–9
                    </p>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs font-semibold">Value</Label>
                    <Input
                        type="text"
                        value={draftValue}
                        onChange={(event) => {
                            setDraftValue(event.target.value);
                            setError(null);
                        }}
                        placeholder="Acme Inc."
                    />
                </div>
                <div className="flex items-end pb-5">
                    <Button
                        type="button"
                        onClick={handleAdd}
                        className="w-full md:w-auto"
                    >
                        <Plus className="mr-1.5 size-4" />
                        Add
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10">
                    {/* <Variable className="size-8 text-muted-foreground" /> */}
                    <p className="text-sm font-medium">No default variables</p>
                    <div className="space-y-0.5 text-center text-xs text-muted-foreground">
                        <p>
                            <span className="font-mono">{`{{company_name}}`}</span> → Acme
                            Inc.
                        </p>
                        <p>
                            <span className="font-mono">{`{{support_email}}`}</span> →
                            help@acme.com
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Entries</span>
                            <Badge variant="secondary">{entries.length}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">Sorted A–Z</span>
                    </div>

                    <ScrollArea className="max-h-[320px] rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">Key</TableHead>
                                    <TableHead className="w-[160px]">Placeholder</TableHead>
                                    <TableHead>Default value</TableHead>
                                    <TableHead className="w-[60px]" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {entries.map(([key, currentValue]) => (
                                    <TableRow key={key}>
                                        <TableCell className="font-mono text-xs">
                                            {key}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {`{{${key}}}`}
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="text"
                                                value={currentValue}
                                                onChange={(event) =>
                                                    handleInlineEdit(key, event.target.value)
                                                }
                                                placeholder="Value"
                                                className="h-8"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemove(key)}
                                                aria-label={`Remove ${key}`}
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
