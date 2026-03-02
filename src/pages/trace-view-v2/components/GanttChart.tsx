import React, { useEffect, useState, useMemo } from "react";
import { SpanTreeNode } from "../trace-view.service";
import TraceSpan from "./TraceSpan";
import { getMetadataFromSpanTree, getSpanPath, getInferenceSpans, isMarkerInInferenceSpan } from "./gantt-utils";

interface GanttChartProps {
  data: SpanTreeNode;
  spanId?: string;
  isExpandAll: boolean;
}

const GanttChart: React.FC<GanttChartProps> = ({
  data,
  spanId = "",
  isExpandAll,
}) => {
  const [activeSelectedId, setActiveSelectedId] = useState<string>(spanId);
  const [activeHoverId, setActiveHoverId] = useState<string>("");
  const [activeSpanPath, setActiveSpanPath] = useState<string[]>([]);

  const metadata = getMetadataFromSpanTree(data);
  const { globalStart, spread: globalSpread } = metadata;

  // Get all inference spans
  const inferenceSpans = useMemo(() => getInferenceSpans(data), [data]);

  useEffect(() => {
    setActiveSpanPath(getSpanPath(data, spanId));
  }, [spanId, data]);

  useEffect(() => {
    setActiveSpanPath(getSpanPath(data, activeSelectedId));
  }, [activeSelectedId, data]);

  // Generate timeline markers
  const generateTimelineMarkers = () => {
    const markers: { position: number; label: string; isInference: boolean }[] = [];
    const numMarkers = 10;

    for (let i = 0; i <= numMarkers; i++) {
      const position = (i / numMarkers) * 100;
      const timeValue = (globalSpread * i) / numMarkers;

      let label: string;
      if (timeValue < 1) {
        label = `${(timeValue * 1000).toFixed(0)}µs`;
      } else if (timeValue < 1000) {
        label = `${timeValue.toFixed(0)}ms`;
      } else {
        label = `${(timeValue / 1000).toFixed(1)}s`;
      }

      const isInference = isMarkerInInferenceSpan(
        position,
        inferenceSpans,
        globalStart,
        globalSpread
      );

      markers.push({ position, label, isInference });
    }

    return markers;
  };

  const timelineMarkers = generateTimelineMarkers();

  return (
    <div className="flex h-full w-full flex-col rounded-lg border border-border bg-card p-2">
      {/* Header */}
      {/* <div className="flex items-center justify-between border-b border-border bg-secondary/20 px-4 py-2">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold">Trace Timeline</h3>
          <div className="text-xs text-muted-foreground">
            {metadata.totalSpans} spans · {metadata.levels} levels
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExpandAll}
          className="h-7 gap-1"
        >
          {isExpandAll ? (
            <>
              <Minimize2 className="h-3 w-3" />
              <span className="text-xs">Collapse All</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-3 w-3" />
              <span className="text-xs">Expand All</span>
            </>
          )}
        </Button>
      </div> */}

      {/* Timeline header */}
      <div className="flex border-b border-border bg-secondary/10">
        <div className="flex w-[300px] items-center border-r border-border px-4 py-2">
          <div className="text-xs font-semibold text-muted-foreground">
            Span Name / Service
          </div>
        </div>
        <div className="relative flex h-12 flex-1 items-center">
          {/* Timeline markers */}
          {timelineMarkers.map((marker, index) => (
            <div
              key={index}
              className="absolute top-1/2 flex h-full -translate-y-1/2 items-center"
              style={{ left: `${marker.position}%` }}
            >
              {/* Vertical line */}
              {/* <div className="w-[1px] h-full bg-border opacity-30" /> */}
              {/* Time label */}
              <div
                className={`absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-semibold ${
                  marker.isInference ? 'text-chart-2' : 'text-muted-foreground'
                }`}
              >
                {marker.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spans */}
      <div className="flex-1 overflow-auto">
        <TraceSpan
          span={data}
          parentSpan={null}
          globalStart={globalStart}
          globalSpread={globalSpread}
          level={0}
          activeSpanPath={activeSpanPath}
          isExpandAll={isExpandAll}
          activeSelectedId={activeSelectedId}
          activeHoverId={activeHoverId}
          setActiveSelectedId={setActiveSelectedId}
          setActiveHoverId={setActiveHoverId}
        />
      </div>
    </div>
  );
};

export default GanttChart;
