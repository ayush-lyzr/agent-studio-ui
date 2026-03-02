import { Cross2Icon } from "@radix-ui/react-icons";
import { ExternalLink, Sparkles } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BRAND } from "@/lib/branding";
import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";

interface ReleaseSection {
  title: string;
  summary: string;
  images?: string[];
  bullets?: string[];
  note?: string;
  link?: string;
}

interface ReleaseEntry {
  date: string;
  isNew?: boolean;
  sections: ReleaseSection[];
}


const releaseNotes: ReleaseEntry[] = [
  {
    date: "Feb 25th, 2026",
    isNew: true,
    sections: [
      {
        title: "New Advanced Memory: Cognis",
        summary:
          "Introducing Cognis Memory — a state-of-the-art memory module built for production-grade workloads. It features temporal awareness, Matryoshka embeddings, and SOTA benchmarking that competes against and wins across several parameters compared to industry leaders.",
          images: ["/release-notes/lyzr-cognis.png"],
      },
      {
        title: "Webhook Based Triggers",
        summary:
          "Call your agents autonomously whenever a webhook gets triggered. Combined with Schedulers, Triggers make autonomous agent execution more powerful and flexible than ever. You now have two complementary ways to fire agents without any manual intervention.",
        images: ["/release-notes/webhook-config.png"],
      },
      {
        title: "Amazon Bedrock Guardrails",
        summary:
          "Alongside Lyzr's built-in Responsible AI guardrails, users can now bring their own AWS credentials to layer in Amazon Bedrock Guardrails for enterprise-grade content governance. Use either independently, or combine both Lyzr and Bedrock guardrails together for maximum safety and reliability.",
        images: ["/release-notes/aws-bedrock-guardrails.png"],
      },
      {
        title: "Excel as Direct Input",
        summary:
          "Agents can now accept one or more Excel files as inputs. They can read and analyze data across multiple sheets and multiple files to generate accurate insights and outputs.",
        images: ["/release-notes/excel-as-direct-input.png"],
        note: "CSV support is coming soon."
      }
    ],
  },
  {
    date: "Feb 11th, 2026",
    isNew: false,
    sections: [
      {
        title: "Audit Log",
        summary:
          "A single place to monitor and track all activity across your team. Every action performed on the platform is logged, giving you full visibility and control over what's happening.",
        images: ["/release-notes/audit-log.png"],
        link: "https://www.avanade.com/en-gb/services",
        bullets: [
          "Access: Available to Owners and Admins",
          "How to open: Go to Manage (from the sidebar) → Audit Log",
        ],
      },
      {
        title: "Schedulers",
        summary:
          "You can now schedule agents to run automatically and operate autonomously. Review past executions anytime to see what ran, when, and how it performed.",
        images: ["/release-notes/schedulers.png"],
        link: "https://www.avanade.com/en-gb/services",
        note: "Schedulers are currently available for agents only. Support for workflows and webhook-based triggers is coming soon.",
      },
    ],
  },
  {
    date: "Feb 3rd, 2026",
    sections: [
      {
        title: "New and Improved Traces",
        summary:
          "We've upgraded tracing with OpenTelemetry for better visibility and insights.",
        images: ["/release-notes/traces.png"],
        link: "https://www.avanade.com/en-gb/services",
        bullets: [
          "New analytics charts in Traces → Analytics",
          "Owners and Admins can view data across all users",
          "Advanced filters for deeper trace analysis",
          "Clear success/failure status at the trace level",
        ],
      },
      {
        title: "New Guardrails (Responsible AI)",
        summary: "Stronger safeguards for safer AI behavior.",
        images: ["/release-notes/guardrails-1.png", "/release-notes/guardrails-2.png"],
        link: "https://www.avanade.com/en-gb/services",
        bullets: [
          "NSFW Detection to block inappropriate content",
          "Enhanced Keyword Guardrails with broader pattern support",
        ],
      },
      {
        title: "Tooling Enhancements",
        summary: "More flexibility when working with tools.",
        images: ["/release-notes/tooling.png"],
        bullets: [
          "Configure tools dynamically with user authentication",
          "Support for multiple accounts per tool",
          "MCP Library for seamless integration with MCP-compatible tools",
        ],
      },
    ],
  },
];

type IReleaseNotesModal = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ReleaseNotesModal: React.FC<IReleaseNotesModal> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/50" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid max-h-[80vh] w-full max-w-5xl translate-x-[-50%] translate-y-[-50%] gap-0 overflow-hidden border bg-background p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          {/* Header */}
          <DialogHeader className="px-8 pt-8 pb-5 border-b bg-gradient-to-b from-primary/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-tight">
                    What's New
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                    Latest updates and improvements to {BRAND.appName}
                  </DialogDescription>
                </div>
              </div>
              <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <Cross2Icon className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </div>
          </DialogHeader>

          {/* Scrollable Content timeline */}
          <ScrollArea className="max-h-[70vh]">
            <div className="px-8 py-8">
              {releaseNotes.map((entry, entryIndex) => (
                <div
                  key={entry.date}
                  className={cn(
                    "flex gap-10",
                    entryIndex !== releaseNotes.length - 1 &&
                    "pb-12 mb-12 border-b border-border/60"
                  )}
                >
                  {/* Left side - Date */}
                  <div className="w-[140px] shrink-0 mt-8">
                    <p className="text-sm font-medium text-muted-foreground sticky top-0 pt-4 bg-background">
                      {entry.date}
                    </p>
                  </div>

                  {/* Right side - All sections for this date */}
                  <div className="flex-1 min-w-0 space-y-14">
                    {entry.sections.map((section, sectionIndex) => (
                      <div key={sectionIndex}>
                        {/* Section Title */}
                        <div className="flex items-center gap-3 mb-3">
                          <h2 className="text-2xl font-bold text-foreground tracking-tight">
                            {section.title}
                          </h2>
                          {entry.isNew && sectionIndex === 0 && (
                            <Badge
                              variant="secondary"
                              className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 font-semibold"
                            >
                              NEW
                            </Badge>
                          )}
                          {section.link && (
                            <a
                              href={section.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors ml-auto shrink-0"
                            >
                              Docs
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>

                        {/* Section Images */}
                        {section.images && section.images.length > 0 && (
                          <div className="space-y-4 mb-5">
                            {section.images.map((img, imgIndex) => (
                              <div
                                key={imgIndex}
                                className="overflow-hidden rounded-xl border bg-secondary/30 shadow-sm"
                              >
                                <img
                                  src={img}
                                  alt={`${section.title} ${section.images!.length > 1 ? imgIndex + 1 : ""}`}
                                  className="w-full h-auto object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Section Summary */}
                        <p className="text-base text-muted-foreground leading-relaxed">
                          {section.summary}
                        </p>

                        {/* Bullet Points */}
                        {section.bullets && section.bullets.length > 0 && (
                          <ul className="mt-3 space-y-1.5">
                            {section.bullets.map((bullet, bulletIndex) => (
                              <li
                                key={bulletIndex}
                                className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed"
                              >
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Note */}
                        {section.note && (
                          <div className="mt-4 rounded-lg bg-secondary/50 border border-border/50 px-4 py-3">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              <span className="font-semibold text-foreground">
                                Note:{" "}
                              </span>
                              {section.note}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="px-8 py-3 border-t bg-secondary/30">
            <p className="text-xs text-center text-muted-foreground">
              Stay tuned for more updates!
            </p>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
