import React from "react";
import { FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import MarkdownRenderer from "@/components/custom/markdown";

interface BlueprintReadmeProps {
  markdown?: string;
  blueprintName?: string;
  isOpen: boolean;
  onClose: () => void;
}

const BlueprintReadme: React.FC<BlueprintReadmeProps> = ({
  markdown,
  blueprintName,
  isOpen,
  onClose,
}) => {
  if (!markdown) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {blueprintName
              ? `${blueprintName} - Documentation`
              : "Blueprint Documentation"}
          </DialogTitle>
          <DialogDescription>
            This blueprint's documentation and usage instructions
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="prose-sm max-w-none dark:prose-invert">
            <MarkdownRenderer content={markdown} />
            {/* <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="mb-4 text-2xl font-bold">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mb-3 mt-6 text-xl font-semibold">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mb-2 mt-4 text-lg font-medium">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="mb-4 leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-4 list-disc space-y-2 pl-6">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-4 list-decimal space-y-2 pl-6">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li>{children}</li>,
                code: ({ children }) => (
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="mb-4 overflow-x-auto rounded-lg bg-muted p-4">
                    {children}
                  </pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-4 border-l-4 border-primary pl-4 italic">
                    {children}
                  </blockquote>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
                hr: () => <hr className="my-6 border-border" />,
              }}
            >
              {markdown}
            </ReactMarkdown> */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlueprintReadme;
