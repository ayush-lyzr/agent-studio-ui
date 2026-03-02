import React, { useState, useEffect } from "react";
import { X, Code, Maximize2, Minimize2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  agentCode?: string;
  onCodeChange?: (code: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  isOpen,
  onClose,
  agentCode = "",
  onCodeChange,
}) => {
  const [code, setCode] = useState(agentCode || "");
  const [language, setLanguage] = useState("python");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (agentCode) {
      setCode(agentCode);
    }
  }, [agentCode]);

  const handleEditorChange = (value: string) => {
    setCode(value);
    if (onCodeChange) {
      onCodeChange(value);
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed z-50 rounded-lg border border-border bg-card shadow-xl transition-all duration-200",
        isFullScreen
          ? "bottom-0 left-0 right-0 top-0 m-0 rounded-none"
          : "bottom-4 left-4 right-4 top-auto h-[500px] md:left-[20%] md:right-[20%]",
      )}
    >
      <div className="flex items-center justify-between border-b border-border bg-muted p-2">
        <div className="flex items-center">
          <Code className="mr-2 h-5 w-5" />
          <span className="font-medium">Agent Code Editor</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={copyToClipboard}
            title="Copy code"
          >
            {isCopied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullScreen}
            title={isFullScreen ? "Exit full screen" : "Full screen"}
          >
            {isFullScreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} title="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="editor" className="w-full">
        <div className="border-b px-4">
          <TabsList className="mb-0">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="editor" className="mt-0 h-[calc(100%-90px)]">
          <div className="h-full p-4">
            <textarea
              className="h-full w-full resize-none rounded-md border border-input bg-background p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={code}
              onChange={(e) => handleEditorChange(e.target.value)}
              spellCheck={false}
              wrap="off"
            />
          </div>
        </TabsContent>

        <TabsContent
          value="preview"
          className="mt-0 h-[calc(100%-90px)] overflow-auto p-4"
        >
          <pre className="overflow-auto rounded-md bg-muted p-4">
            <code>{code}</code>
          </pre>
        </TabsContent>
      </Tabs>

      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-border bg-muted p-2">
        <div className="flex items-center space-x-2">
          <select
            className="rounded border border-input bg-background px-2 py-1 text-xs"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="json">JSON</option>
          </select>
        </div>
        <div className="text-xs text-muted-foreground">
          {code.split("\n").length} lines
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
