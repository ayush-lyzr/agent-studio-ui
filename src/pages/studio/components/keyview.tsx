import React, { useState } from "react";
import { Button } from "@/components/custom/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

const KeyView = ({ apiKey }: { apiKey: string }) => {
  const [isKeyCopied, setIsKeyCopied] = useState(false);
  const [isEndpointCopied, setIsEndpointCopied] = useState(false);
  const [isKeyVisible, _] = useState(false);
  const endpoint = "https://agent.api.lyzr.app";

  const copyToClipboard = (
    text: string,
    setIsCopied: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      toast({
        title: "Copied!",
        description: `${text} has been copied to your clipboard.`,
      });
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    });
  };

  return (
    <div className="p-6">
      <p className="mb-4">
        Here is your API key for Agent API, passed as{" "}
        <code className="rounded bg-muted p-1">x-api-header</code>:
      </p>
      <div className="mb-4 flex items-center space-x-2">
        <Input
          value={isKeyVisible ? apiKey : "************"}
          readOnly
          className="flex-grow bg-muted"
        />
        <Button
          onClick={() => copyToClipboard(apiKey, setIsKeyCopied)}
          type="button"
        >
          {isKeyCopied ? "Copied!" : "Copy"}
        </Button>
      </div>
      <p className="mb-4">Endpoint for Agent API:</p>
      <div className="mb-4 flex items-center space-x-2">
        <Input value={endpoint} readOnly className="flex-grow bg-muted" />
        <Button
          onClick={() => copyToClipboard(endpoint, setIsEndpointCopied)}
          type="button"
        >
          {isEndpointCopied ? "Copied!" : "Copy"}
        </Button>
      </div>
      <p className="mt-4">
        For more information, please refer to the{" "}
        <a
          href="https://agent.api.lyzr.app/docs"
          target="_blank"
          className="text-blue-500 underline"
        >
          API documentation
        </a>
        .
      </p>
    </div>
  );
};

export default KeyView;
