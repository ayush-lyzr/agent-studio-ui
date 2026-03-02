import { FileText, Globe, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UploadMethod } from "./UploadWizard";

interface Step1SelectMethodProps {
  onMethodSelect: (method: UploadMethod) => void;
}

export default function Step1SelectMethod({ onMethodSelect }: Step1SelectMethodProps) {
  const methods = [
    {
      id: "files" as UploadMethod,
      icon: FileText,
      title: "File Upload",
      description: "Upload PDF, DOCX, or TXT files",
      details: "Supports up to 5 files with multiple parser options",
    },
    {
      id: "website" as UploadMethod,
      icon: Globe,
      title: "Website Crawling",
      description: "Crawl and extract website content",
      details: "Configure crawl depth, pages, and dynamic content handling",
    },
    {
      id: "text" as UploadMethod,
      icon: Type,
      title: "Raw Text",
      description: "Enter text content directly",
      details: "Paste or type content directly into the system",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Choose Your Upload Source</h3>
        <p className="text-sm text-muted-foreground">
          Select how you'd like to add content to your knowledge base
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {methods.map((method) => {
          const Icon = method.icon;
          return (
            <Card
              key={method.id}
              className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50 group"
              onClick={() => onMethodSelect(method.id)}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-base">{method.title}</CardTitle>
                <CardDescription className="text-xs">
                  {method.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground text-center mb-3">
                  {method.details}
                </p>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMethodSelect(method.id);
                  }}
                >
                  Select
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}