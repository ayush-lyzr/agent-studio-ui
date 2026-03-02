import { create } from 'zustand';
import { SpanTreeNode } from './trace-view.service';

interface TraceViewStore {
    selectedSpan: SpanTreeNode | null;
    selectedSpanParent: SpanTreeNode | null;
    isDetailsSheetOpen: boolean;
    setSelectedSpan: (span: SpanTreeNode | null) => void;
    setSelectedSpanParent: (span: SpanTreeNode | null) => void;
    setDetailsSheetOpen: (isOpen: boolean) => void;
}

export const useTraceViewStore = create<TraceViewStore>((set) => ({
    selectedSpan: null,
    selectedSpanParent: null,
    isDetailsSheetOpen: false,
    setSelectedSpan: (span) => set({ selectedSpan: span }),
    setSelectedSpanParent: (span) => set({ selectedSpanParent: span }),
    setDetailsSheetOpen: (isOpen) => set({ isDetailsSheetOpen: isOpen }),
}));
