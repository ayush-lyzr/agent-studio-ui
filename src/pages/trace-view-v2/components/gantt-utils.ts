import { SpanTreeNode, TraceMetadata } from '../trace-view.service';

export const getMetadataFromSpanTree = (treeData: SpanTreeNode): TraceMetadata => {
    let globalStart = Number.POSITIVE_INFINITY;
    let globalEnd = Number.NEGATIVE_INFINITY;
    let totalSpans = 0;
    let levels = 1;

    const traverse = (treeNode: SpanTreeNode, level = 0): void => {
        if (!treeNode) {
            return;
        }
        totalSpans += 1;
        levels = Math.max(levels, level);

        const { startTime, duration } = treeNode;
        const endTime = startTime + duration;

        globalStart = Math.min(globalStart, startTime);
        globalEnd = Math.max(globalEnd, endTime);

        treeNode.children.forEach((childNode) => {
            traverse(childNode, level + 1);
        });
    };

    traverse(treeData, 1);

    return {
        globalStart,
        globalEnd,
        spread: globalEnd - globalStart,
        totalSpans,
        levels,
    };
};

export const getSpanPath = (tree: SpanTreeNode, spanId: string): string[] => {
    const spanPath: string[] = [];

    const traverse = (treeNode: SpanTreeNode): boolean => {
        if (!treeNode) {
            return false;
        }

        spanPath.push(treeNode.id);

        if (spanId === treeNode.id) {
            return true;
        }

        let foundInChild = false;
        treeNode.children.forEach((childNode) => {
            if (traverse(childNode)) foundInChild = true;
        });

        if (!foundInChild) {
            spanPath.pop();
        }

        return foundInChild;
    };

    traverse(tree);
    return spanPath;
};

export const formatDuration = (durationMs: number): string => {
    if (durationMs < 0.001) return `${(durationMs * 1000000).toFixed(0)}ns`;
    if (durationMs < 1) return `${(durationMs * 1000).toFixed(0)}µs`;
    if (durationMs < 1000) return `${durationMs.toFixed(2)}ms`;
    if (durationMs < 60000) return `${(durationMs / 1000).toFixed(2)}s`;
    return `${(durationMs / 60000).toFixed(2)}m`;
};

// Collect all inference spans from the tree
export const getInferenceSpans = (treeData: SpanTreeNode): SpanTreeNode[] => {
    const inferenceSpans: SpanTreeNode[] = [];

    const traverse = (treeNode: SpanTreeNode): void => {
        if (!treeNode) {
            return;
        }

        if (treeNode.span_name.toLowerCase() === 'inference') {
            inferenceSpans.push(treeNode);
        }

        treeNode.children.forEach((childNode) => {
            traverse(childNode);
        });
    };

    traverse(treeData);
    return inferenceSpans;
};

// Check if a marker position falls within any inference span
export const isMarkerInInferenceSpan = (
    markerPosition: number,
    inferenceSpans: SpanTreeNode[],
    globalStart: number,
    globalSpread: number
): boolean => {
    // Convert marker position percentage to actual time
    const markerTime = globalStart + (markerPosition / 100) * globalSpread;

    // Check if marker time falls within any inference span
    return inferenceSpans.some((span) => {
        const spanStart = span.startTime;
        const spanEnd = span.startTime + span.duration;
        return markerTime >= spanStart && markerTime <= spanEnd;
    });
};
