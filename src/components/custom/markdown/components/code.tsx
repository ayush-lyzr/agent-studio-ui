import React, { Suspense } from "react";
import "katex/dist/katex.min.css";
import { Copy, Check } from "lucide-react";
import {
  vscDarkPlus,
  vs,
} from "react-syntax-highlighter/dist/esm/styles/prism";
// import { Mermaid } from "./mermaid";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
// import { makeid } from "@/lib/utils";

const CodeBlockHeader: React.FC<{
  language: string;
  onCopy: () => void;
  copied: boolean;
}> = ({ language, onCopy, copied }) => (
  <div className="flex items-center justify-between rounded-t-lg border bg-background px-4 py-2 text-sm">
    <span className="capitalize text-primary/60">{language || "code"}</span>
    <button
      onClick={onCopy}
      className="flex items-center gap-1 text-primary transition-colors hover:text-primary/80"
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  </div>
);

const SyntaxHighlighter = React.lazy(() =>
  import("react-syntax-highlighter").then((mod) => ({ default: mod.Prism })),
);

const CodeBlockContent: React.FC<{
  code: string;
  language: string;
}> = ({ code, language }) => {
  const { theme } = useTheme();

  return (
    <Suspense fallback={<div>Loading code...</div>}>
      <SyntaxHighlighter
        language={language}
        style={theme === "light" ? vs : vscDarkPlus}
        showLineNumbers={false}
        wrapLines={true}
        customStyle={{
          margin: 0,
          borderRadius: "0 0 0.5rem 0.5rem",
          padding: "1rem",
          fontSize: "0.875rem",
          lineHeight: "1.5",
          fontFamily:
            "'Space Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </Suspense>
  );
};

// Main Code Block Component
export const CodeBlock: React.FC<{
  node?: any;
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
  theme: string;
  showLineNumbers: boolean;
}> = ({ className, children }) => {
  const [copied, setCopied] = React.useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";

  // Helper function to extract text content from React children
  const extractTextContent = (children: React.ReactNode): string => {
    if (typeof children === "string") {
      return children;
    }
    if (Array.isArray(children)) {
      return children.map((child) => extractTextContent(child)).join("");
    }
    if (React.isValidElement(children)) {
      return extractTextContent(children.props.children);
    }
    return "";
  };

  // Process code content
  const code = React.useMemo(() => {
    const content = extractTextContent(children).replace(/\n$/, " ");

    // Format JSON if applicable
    if (language === "json" || language === "javascript") {
      try {
        const parsed = JSON.parse(content);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return content;
      }
    }
    return content;
  }, [children, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  // if (language === "mermaid") {
  //   const id = makeid(4);
  //   return <Mermaid chart={code} id={id} />;
  // }

  if (language) {
    // Render code block
    return (
      <div className={cn("group relative my-2", className)}>
        <CodeBlockHeader
          language={language}
          onCopy={handleCopy}
          copied={copied}
        />
        <div className="relative overflow-y-auto font-mono">
          <CodeBlockContent code={code} language={language} />
        </div>
      </div>
    );
  }

  return <code className="inline-code">{children}</code>;
};
