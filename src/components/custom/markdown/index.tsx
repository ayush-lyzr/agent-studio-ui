import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkEmoji from "remark-emoji";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

import { cn } from "@/lib/utils";
import { LinkRenderer } from "./components/link";
import { CodeBlock } from "./components/code";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  maxWidth?: string;
}

// Main Markdown Renderer Component
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
  maxWidth = "100%",
}) => {
  const config = {
    codeTheme: "monokai",
    mathTheme: "colorful",
    linkTarget: "_blank",
    showLineNumbers: false,
  };

  // Custom components for react-markdown
  const components = {
    code: (props: any) => {
      console.log({ props });
      return <CodeBlock {...props} theme={config.codeTheme} />;
    },
    a: (props: any) => (
      <LinkRenderer linkTarget={config.linkTarget} href={props.href}>
        {props.children}
      </LinkRenderer>
    ),
    // Basic markdown elements with consistent styling
    p: (props: any) => (
      <p className={cn(props?.className, "whitespace-pre-wrap")}>
        {props.children}
      </p>
    ),
    table: (props: any) => (
      <div className="my-4 overflow-x-auto">
        <table
          {...props}
          className="min-w-full border-collapse rounded-lg border"
        />
      </div>
    ),
    thead: (props: any) => <thead {...props} className="bg-background" />,
    tbody: (props: any) => <tbody {...props} />,
    tr: (props: any) => <tr {...props} className="border-b" />,
    th: (props: any) => (
      <th
        {...props}
        className="border px-4 py-2 text-left text-sm font-semibold text-primary/70"
      />
    ),
    td: (props: any) => (
      <td {...props} className="border px-4 py-2 text-sm text-primary/70" />
    ),
    blockquote: (props: any) => (
      <blockquote
        {...props}
        className="border-l-4 border-muted-foreground pl-4 italic text-primary/60"
      />
    ),
  };

  return (
    <div style={{ maxWidth }}>
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,
          [remarkMath, { singleDollarTextMath: false }],
          remarkEmoji,
        ]}
        rehypePlugins={[rehypeRaw, rehypeSlug, rehypeHighlight, rehypeKatex]}
        components={components}
        className={cn("markdown-renderer markdown text-primary", className)}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
