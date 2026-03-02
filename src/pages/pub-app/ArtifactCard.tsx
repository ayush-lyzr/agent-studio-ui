import React from "react";
import {
  FileText,
  Code,
  FileJson,
  Image,
  AlignLeft,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ArtifactCardProps {
  artifact: {
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
    timestamp: string;
  };
  onClick: () => void;
}

const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact, onClick }) => {
  const getIcon = () => {
    switch (artifact.format_type) {
      case "code":
        return <Code className="h-4 w-4" />;
      case "json":
        return <FileJson className="h-4 w-4" />;
      case "markdown":
        return <FileText className="h-4 w-4" />;
      case "matplotlib":
      case "chart":
        return <Image className="h-4 w-4" />;
      case "plotly":
        return <BarChart3 className="h-4 w-4" />;
      case "text":
      default:
        return <AlignLeft className="h-4 w-4" />;
    }
  };

  const getFormatLabel = () => {
    switch (artifact.format_type) {
      case "code":
        return "Code";
      case "json":
        return "JSON";
      case "markdown":
        return "Markdown";
      case "matplotlib":
      case "chart":
        return "Chart";
      case "plotly":
        return "Interactive Chart";
      case "text":
      default:
        return "Text";
    }
  };

  return (
    <div
      className="group relative mt-3 cursor-pointer overflow-hidden rounded-lg border bg-card transition-all hover:bg-card/30 hover:shadow-sm dark:hover:bg-muted/30"
      onClick={onClick}
    >
      <div className="flex items-stretch">
        <div className="flex w-full flex-col p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background shadow-sm">
                {getIcon()}
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground">
                  {artifact.name}
                </h4>
                {artifact.description && (
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {artifact.description}
                  </p>
                )}
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 transition-all group-hover:text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-center space-x-2">
            <Badge variant="secondary" className="h-5 px-2 text-xs">
              {getFormatLabel()}
            </Badge>
            <span className="text-xs text-muted-foreground">
              View in artifacts →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtifactCard;
