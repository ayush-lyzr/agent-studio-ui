import { useState } from "react";
import { ArrowLeft, LayoutList, Columns3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  categories,
  quarters,
  RoadmapCategory,
  RoadmapItem,
  RoadmapQuarter,
  roadmapItems,
} from "@/data/roadmapData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type ViewMode = "list" | "swimlane";

const categoryConfig: Record<
  RoadmapCategory,
  { short: string; color: string; bg: string; border: string; dot: string }
> = {
  Core: {
    short: "Core",
    color: "text-cat-core",
    bg: "bg-cat-core-light",
    border: "border-l-cat-core",
    dot: "bg-cat-core",
  },
  Eval: {
    short: "Eval",
    color: "text-cat-eval",
    bg: "bg-cat-eval-light",
    border: "border-l-cat-eval",
    dot: "bg-cat-eval",
  },
  "Observability & Guardrails": {
    short: "Guardrails",
    color: "text-cat-guardrails",
    bg: "bg-cat-guardrails-light",
    border: "border-l-cat-guardrails",
    dot: "bg-cat-guardrails",
  },
  RAG: {
    short: "KB",
    color: "text-cat-memory",
    bg: "bg-cat-memory-light",
    border: "border-l-cat-memory",
    dot: "bg-cat-memory",
  },
  Memory: {
    short: "Memory",
    color: "text-cat-traces",
    bg: "bg-cat-traces-light",
    border: "border-l-cat-traces",
    dot: "bg-cat-traces",
  },
  "Tools & Skills": {
    short: "Tools",
    color: "text-cat-tools",
    bg: "bg-cat-tools-light",
    border: "border-l-cat-tools",
    dot: "bg-cat-tools",
  },
  UX: {
    short: "UX",
    color: "text-cat-ux",
    bg: "bg-cat-ux-light",
    border: "border-l-cat-ux",
    dot: "bg-cat-ux",
  },
  Voice: {
    short: "Voice",
    color: "text-cat-voice",
    bg: "bg-cat-voice-light",
    border: "border-l-cat-voice",
    dot: "bg-cat-voice",
  },
};

const quarterConfig: Record<
  RoadmapQuarter,
  { color: string; bg: string; dot: string }
> = {
  "Q1 26": {
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  "Q2 26": {
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
  },
};

type FilterValue = RoadmapCategory | RoadmapQuarter | null;

const ProductRoadmap = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewMode>("swimlane");
  const [filter, setFilter] = useState<FilterValue>(null);

  const filtered = roadmapItems.filter((item: RoadmapItem) => {
    if (filter === null) return true;
    if (quarters.includes(filter as RoadmapQuarter)) {
      return item.quarter === filter;
    }
    return item.category === filter;
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="flex h-full w-full flex-col overflow-hidden px-8 py-4"
    >
      <div className="mb-8 shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="size-5" />
            </Button>
            <PageTitle title="Product Roadmap" />
          </div>

          {/* View Toggle — Always Visible */}
          <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${view === "list"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <LayoutList size={14} />
            </button>
            <button
              onClick={() => {
                setView("swimlane");
                // Swimlane only supports quarter filter
                if (filter !== null && !quarters.includes(filter as RoadmapQuarter)) {
                  setFilter(null);
                }
              }}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${view === "swimlane"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Columns3 size={14} />
            </button>
          </div>
        </div>

        {/* Filters: list view = All + quarters + categories; swimlane view = All + quarters only */}
        {(view === "list" || view === "swimlane") && (
          <>
            <Separator />
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setFilter(null)}
                className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                  filter === null
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({roadmapItems.length})
              </button>
              {quarters.map((q: RoadmapQuarter) => {
                const qCfg = quarterConfig[q];
                const count = roadmapItems.filter(
                  (i: RoadmapItem) => i.quarter === q,
                ).length;
                const isActive = filter === q;
                return (
                  <button
                    key={q}
                    onClick={() => setFilter(isActive ? null : q)}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                      isActive ? `${qCfg.bg} ${qCfg.color}` : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${isActive ? qCfg.dot : "bg-muted-foreground/30"}`}
                    />
                    {q}
                    <span className="opacity-60">{count}</span>
                  </button>
                );
              })}
              {view === "list" &&
                categories.map((cat: RoadmapCategory) => {
                  const cfg = categoryConfig[cat];
                  const count = roadmapItems.filter(
                    (i: RoadmapItem) => i.category === cat,
                  ).length;
                  const isActive = filter === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setFilter(isActive ? null : cat)}
                      className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                        isActive
                          ? `${cfg.bg} ${cfg.color}`
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${isActive ? cfg.dot : "bg-muted-foreground/30"}`}
                      />
                      {cfg.short}
                      <span className="opacity-50">{count}</span>
                    </button>
                  );
                })}
            </div>
          </>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden flex flex-col">
        {view === "list" ? (
          <ScrollArea className="flex-1 min-h-0">
            <ListView items={filtered} />
          </ScrollArea>
        ) : (
          <SwimlaneView filteredItems={filtered} />
        )}
      </div>
    </motion.div>
  );
};

const ListView = ({ items }: { items: RoadmapItem[] }) => (
  <div className="grid gap-3 px-1 pb-4">
    {items.map((item: RoadmapItem, idx: number) => {
      const cfg = categoryConfig[item.category];
      return (
        <div
          key={item.id}
          className={`item-enter rounded-xl border border-l-[3px] border-border bg-card p-4 ${cfg.border} transition-all duration-200 hover:-translate-y-px hover:shadow-lg hover:shadow-foreground/[0.03]`}
          style={{ animationDelay: `${idx * 45}ms` }}
        >
          <div className="mb-1 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold leading-snug tracking-tight text-card-foreground">
              {item.feature}
            </h3>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              <Badge
                variant="secondary"
                className={`text-[9px] font-semibold ${cfg.bg} ${cfg.color} border-0`}
              >
                <span className={`mr-1 h-1 w-1 rounded-full ${cfg.dot}`} />
                {cfg.short}
              </Badge>
              {item.quarter && (() => {
                const qCfg = quarterConfig[item.quarter];
                return (
                  <Badge
                    variant="secondary"
                    className={`text-[9px] font-semibold border-0 ${qCfg.bg} ${qCfg.color}`}
                  >
                    <span className={`mr-1 h-1 w-1 rounded-full ${qCfg.dot}`} />
                    {item.quarter}
                  </Badge>
                );
              })()}
            </div>
          </div>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        </div>
      );
    })}
    {items.length === 0 && (
      <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
        No features match the selected filters.
      </div>
    )}
  </div>
);

const SwimlaneView = ({ filteredItems }: { filteredItems: RoadmapItem[] }) => (
  <div className="flex h-full w-[91vw] gap-3 overflow-x-auto pb-4">
    {categories.map((cat: RoadmapCategory) => {
      const cfg = categoryConfig[cat];
      const items = filteredItems.filter((i: RoadmapItem) => i.category === cat);
      if (items.length === 0) return null;

      return (
        <div
          key={cat}
          className="flex h-full w-[320px] min-w-[320px] shrink-0 flex-col"
        >
          <div
            className={`flex shrink-0 items-center gap-2 rounded-t-xl px-3 py-2.5 ${cfg.bg}`}
          >
            <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
            <span className={`text-xs font-bold ${cfg.color}`}>{cat}</span>
            <span className={`text-[10px] font-medium ${cfg.color} opacity-60`}>
              {items.length}
            </span>
          </div>

          <ScrollArea className="min-h-0 flex-1 pt-2 pb-4">
            <div className="grid grid-cols-1 gap-2 pr-2">
              {items.map((item: RoadmapItem, idx: number) => (
                <div
                  key={item.id}
                  className={`item-enter min-h-[80px] w-full rounded-lg border border-l-[3px] border-border bg-card p-3 ${cfg.border} transition-all duration-200 hover:shadow-md hover:shadow-foreground/[0.03]`}
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <h3 className="min-w-0 flex-1 text-[12px] font-semibold leading-snug tracking-tight text-card-foreground">
                      {item.feature}
                    </h3>
                    {item.quarter && (() => {
                      const qCfg = quarterConfig[item.quarter];
                      return (
                        <Badge
                          variant="secondary"
                          className={`shrink-0 whitespace-nowrap text-[8px] font-semibold border-0 ${qCfg.bg} ${qCfg.color}`}
                        >
                          <span className={`mr-1 h-1 w-1 rounded-full ${qCfg.dot}`} />
                          {item.quarter}
                        </Badge>
                      );
                    })()}
                  </div>
                  <p className="line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      );
    })}
  </div>
);

export default ProductRoadmap;
