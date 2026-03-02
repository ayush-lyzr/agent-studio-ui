import { create } from 'zustand';
import { SpanTreeNode } from './trace-view.service';

interface TraceViewStore {
    selectedSpan: SpanTreeNode | null;
    selectedSpanParent: SpanTreeNode | null;
    isDetailsSheetOpen: boolean;
    setSelectedSpan: (span: SpanTreeNode | null) => void;
    setSelectedSpanParent: (span: SpanTreeNode | null) => void;
    setDetailsSheetOpen: (isOpen: boolean) => void;
    hoveredSpanId: string | null;
    setHoveredSpanId: (id: string | null) => void;
}

export const useTraceViewStore = create<TraceViewStore>((set) => ({
    selectedSpan: null,
    selectedSpanParent: null,
    isDetailsSheetOpen: false,
    hoveredSpanId: null,
    setSelectedSpan: (span) => set({ selectedSpan: span }),
    setSelectedSpanParent: (span) => set({ selectedSpanParent: span }),
    setDetailsSheetOpen: (isOpen) => set({ isDetailsSheetOpen: isOpen }),
    setHoveredSpanId: (id) => set({ hoveredSpanId: id }),
}));
