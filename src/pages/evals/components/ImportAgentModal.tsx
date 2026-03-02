import React, { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ImportAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => void;
  onA2AImport: (baseUrl: string, name: string) => void;
  isImporting?: boolean;
  isImportingA2A?: boolean;
}

export const ImportAgentModal: React.FC<ImportAgentModalProps> = ({
  isOpen,
  onClose,
  onFileUpload,
  onA2AImport,
  isImporting = false,
  isImportingA2A = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [a2aBaseUrl, setA2aBaseUrl] = useState('');
  const [a2aName, setA2aName] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
      // Don't close the modal - let it show loading state
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleA2ASubmit = () => {
    if (a2aBaseUrl && a2aName) {
      onA2AImport(a2aBaseUrl, a2aName);
      setA2aBaseUrl('');
      setA2aName('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={isImporting ? undefined : onClose}>
      <DialogContent className="max-w-3xl">
        <div className="relative">
          {/* Loading Overlay */}
          {isImporting && (
            <div className="absolute inset-0 bg-white/98 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-lg -m-6 p-6">
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">Processing your file...</p>
                  <p className="text-sm text-gray-600 mt-1">Reading file content</p>
                  <p className="text-sm text-gray-600">Sending to AI agent for analysis</p>
                  <p className="text-sm text-gray-600">Generating agent configuration</p>
                </div>
              </div>
            </div>
          )}

          <DialogHeader>
            <DialogTitle className="text-2xl">Import Agent</DialogTitle>
            <DialogDescription>
              Choose how you want to import your agent into Lyzr Agent Studio
            </DialogDescription>
          </DialogHeader>

        <div className="grid grid-cols-2 gap-6 mt-6">
          {/* Card 1: LangGraph, Crew.ai to Lyzr */}
          <Card className="border-2 hover:border-blue-500 transition-colors cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Framework Migration</span>
                <Badge variant="default" className="bg-blue-600">Available</Badge>
              </CardTitle>
              <CardDescription>Import from other frameworks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">LG</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">LangGraph</p>
                    <p className="text-xs text-gray-500">Convert LangGraph agents</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">CA</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Crew.ai</p>
                    <p className="text-xs text-gray-500">Convert Crew.ai agents</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                 
              
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".py,.json,.yaml,.yml"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                className="w-full group-hover:bg-blue-600 transition-colors"
                onClick={handleUploadClick}
                disabled={isImporting}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isImporting ? "Processing..." : "Upload Agent File"}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Upload Python, JSON, or YAML files from LangGraph, Crew.ai, or other frameworks
              </p>
            </CardContent>
          </Card>

          {/* Card 2: A2A Agent Import */}
          <Card className="border-2 border-purple-200 hover:border-purple-500 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>A2A Agent Import</span>
                <Badge variant="default" className="bg-purple-600">Available</Badge>
              </CardTitle>
              <CardDescription>Agent-to-Agent integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="a2a-name" className="text-sm font-medium">
                    Agent Name
                  </Label>
                  <Input
                    id="a2a-name"
                    placeholder="My A2A Agent"
                    value={a2aName}
                    onChange={(e) => setA2aName(e.target.value)}
                    disabled={isImportingA2A}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="a2a-url" className="text-sm font-medium">
                    Base URL
                  </Label>
                  <Input
                    id="a2a-url"
                    placeholder="http://127.0.0.1:5001"
                    value={a2aBaseUrl}
                    onChange={(e) => setA2aBaseUrl(e.target.value)}
                    disabled={isImportingA2A}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the base URL of your A2A agent server
                  </p>
                </div>
              </div>

              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={handleA2ASubmit}
                disabled={isImportingA2A || !a2aBaseUrl || !a2aName}
              >
                <Plus className="mr-2 h-4 w-4" />
                {isImportingA2A ? "Connecting..." : "Connect A2A Agent"}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Connect agents using the Agent-to-Agent protocol
              </p>
            </CardContent>
          </Card>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
