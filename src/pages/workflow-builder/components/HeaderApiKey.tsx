import React, { useState, useEffect } from "react";
import { Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useApiKey } from "@/contexts/ApiKeyContext";
import useStore from "@/lib/store";

const HeaderApiKey: React.FC = () => {
  const { apiKey, setApiKey } = useApiKey();
  const [inputKey, setInputKey] = useState(apiKey);
  const [isOpen, setIsOpen] = useState(false);
  const globalKey = useStore((state) => state.api_key);

  // Set default API key when component mounts if no key is set
  useEffect(() => {
    // if (!apiKey) {
    //   const defaultApiKey = 'ssk-default-obhGvAo6gG9YT9tu6ChjyXLqnw7TxSGY';
    //   setApiKey(defaultApiKey);
    //   setInputKey(defaultApiKey);

    // }
    if (globalKey) {
      setApiKey(globalKey);
      setInputKey(globalKey);
    }
  }, [globalKey, setApiKey]);

  const handleSave = () => {
    setApiKey(inputKey);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <Key className="h-4 w-4" />
          {apiKey ? "API Key Set" : "Set API Key"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lyzr API Key</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-500">
            Enter your Lyzr API key to interact with agents.
          </p>
          <Input
            placeholder="ssk-default-xxxxx"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            className="w-full"
          />
          <div className="flex justify-end">
            <Button onClick={handleSave}>Save Key</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HeaderApiKey;
