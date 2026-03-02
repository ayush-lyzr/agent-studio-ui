import { Shield, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

interface Example {
  label: string;
  input?: string;
  output?: string;
  text?: string;
}

interface AnalysisResults {
  [key: string]: any;
}

interface AnalysisLayoutProps {
  title: string;
  description: string;
  badgeText: string;
  examples: Example[];
  loading: boolean;
  results: AnalysisResults | null;
  inputText?: string;
  outputText?: string;
  singleInput?: boolean;
  onExampleChange: (value: string) => void;
  onInputChange: (value: string) => void;
  onOutputChange?: (value: string) => void;
  onAnalyze: () => void;
  renderResults: (results: AnalysisResults) => React.ReactNode;
}

const AnalysisLayout = ({
  title,
  description,
  badgeText,
  examples,
  loading,
  results,
  inputText = "",
  outputText = "",
  singleInput = false,
  onExampleChange,
  onInputChange,
  onOutputChange,
  onAnalyze,
  renderResults,
}: AnalysisLayoutProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">{badgeText}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <Select onValueChange={onExampleChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select an example" />
            </SelectTrigger>
            <SelectContent>
              {examples.map((example, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {example.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            placeholder={
              singleInput
                ? "Enter text to analyze..."
                : "Enter the prompt given to the AI..."
            }
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            className="min-h-[150px]"
            disabled={loading}
          />

          {!singleInput && onOutputChange && (
            <Textarea
              placeholder="Enter the AI's response..."
              value={outputText}
              onChange={(e) => onOutputChange(e.target.value)}
              className="min-h-[150px]"
              disabled={loading}
            />
          )}

          <div className="flex justify-end">
            <Button
              onClick={onAnalyze}
              disabled={
                !inputText.trim() ||
                (!singleInput && !outputText.trim()) ||
                loading
              }
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Analyze
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : results ? (
              renderResults(results)
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Analysis results will appear here
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalysisLayout;
