import React from "react";
import { Copy, Check } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import MarkdownRenderer from "@/components/custom/markdown";
import { Button } from "@/components/ui/button";
import PlotlyRenderer from "./PlotlyRenderer";
import { ArtifactDownloader } from "./ArtifactDownloader";
interface ArtifactData {
  id: string;
  name: string;
  description: string;
  format_type:
    | "code"
    | "json"
    | "markdown"
    | "matplotlib"
    | "chart"
    | "text"
    | "plotly";
  data: string;
  timestamp: string;
  metadata?: any;
}

interface ArtifactRendererProps {
  artifact: ArtifactData;
}

const CodeRenderer: React.FC<{ data: string; language?: string }> = ({
  data,
  language = "plaintext",
}) => {
  // const [copied, setCopied] = React.useState(false);

  // const handleCopy = () => {
  //   navigator.clipboard.writeText(data);
  //   setCopied(true);
  //   setTimeout(() => setCopied(false), 2000);
  // };

  return (
    <div className="relative">
      <MarkdownRenderer content={`\`\`\`${language}${data}`} className="my-0" />
      {/* <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-8 w-8"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
      <pre className="overflow-x-auto rounded-lg bg-muted p-4">
        <code className={`language-${language}`}>{data}</code>
      </pre> */}
    </div>
  );
};

const JsonRenderer: React.FC<{ data: string }> = ({ data }) => {
  try {
    const parsed = JSON.parse(data);
    const formatted = JSON.stringify(parsed, null, 2);

    return (
      <div className="relative">
        <MarkdownRenderer content={`\`\`\`json${formatted}`} className="my-0" />
      </div>
    );
  } catch (e) {
    return <CodeRenderer data={data} language="json" />;
  }
};

const MarkdownRendererWrapper: React.FC<{ data: string }> = ({ data }) => {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <MarkdownRenderer content={data} />
    </div>
  );
};

const TextRenderer: React.FC<{ data: string }> = ({ data }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-8 w-8"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
      <div className="whitespace-pre-wrap rounded-lg bg-muted p-4 font-mono text-sm">
        {data}
      </div>
    </div>
  );
};

const ChartRenderer: React.FC<{ data: string }> = ({ data }) => {
  // For matplotlib/chart types, we expect either a base64 image or a URL
  if (data.startsWith("data:image") || data.startsWith("http")) {
    return (
      <div className="flex justify-center">
        <img
          src={data}
          alt="Chart visualization"
          className="max-w-full rounded-lg"
        />
      </div>
    );
  }

  // If it's not an image URL, treat it as code
  return <CodeRenderer data={data} language="python" />;
};

export const ArtifactRenderer: React.FC<ArtifactRendererProps> = ({
  artifact,
}) => {
  const renderContent = () => {
    switch (artifact.format_type) {
      case "code":
        return <CodeRenderer data={artifact.data} />;
      case "json":
        return <JsonRenderer data={artifact.data} />;
      case "markdown":
        return <MarkdownRendererWrapper data={artifact.data} />;
      case "matplotlib":
      case "chart":
        return <ChartRenderer data={artifact.data} />;
      case "plotly":
        return <PlotlyRenderer data={artifact.data} />;
      case "text":
      default:
        return <TextRenderer data={artifact.data} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{artifact.name}</h3>
          <p className="text-sm text-muted-foreground">
            {artifact.description}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }).format(new Date(artifact.timestamp))}
          </p>
        </div>
        <ArtifactDownloader
          artifactId={artifact.id}
          artifactName={artifact.name}
          artifactData={artifact.data}
          formatType={artifact.format_type}
        />
      </div>
      <ScrollArea className="max-h-[25rem] w-full overflow-y-auto rounded-lg border">
        <div className="p-2" id={`artifact-content-${artifact.id}`}>
          {renderContent()}
        </div>
      </ScrollArea>
    </div>
  );
};
