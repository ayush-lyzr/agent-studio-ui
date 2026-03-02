import { useState } from "react";
import { CheckCircle2, XCircle, Lightbulb, TestTube } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/custom/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCucumberExpression } from "../../rai.service";
import { PatternType } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type PatternTestModalProps = {
  disabled?: boolean;
  initialPattern?: string;
  initialPatternType?: PatternType;
};

const PatternTestModal: React.FC<PatternTestModalProps> = ({
  disabled,
  initialPattern = "",
  initialPatternType = "literal",
}) => {
  const [open, setOpen] = useState(false);
  const [pattern, setPattern] = useState(initialPattern);
  const [patternType, setPatternType] = useState<PatternType>(initialPatternType);
  const [testText, setTestText] = useState("");
  const [testResult, setTestResult] = useState<any>(null);

  const { testPattern, isTestingPattern, patternExamples } = useCucumberExpression();

  const handleTest = async () => {
    try {
      const response = await testPattern({
        pattern,
        pattern_type: patternType,
        test_text: testText,
      });
      setTestResult(response.data);
    } catch (error) {
      console.error("Pattern test error:", error);
    }
  };

  const renderPatternTypeDescription = (type: PatternType) => {
    switch (type) {
      case "literal":
        return "Simple case-insensitive substring matching. Example: 'password' matches 'Password', 'PASSWORD', 'my password'.";
      case "regex":
        return "Regular expression patterns. Example: '\\b\\d{3}-\\d{2}-\\d{4}\\b' matches SSN format '123-45-6789'.";
      case "cucumber_expression":
        return "Human-readable patterns with parameter extraction. Example: 'password: {word}' matches 'password: mysecret123'.";
    }
  };

  const renderExamples = () => {
    if (!patternExamples) return null;

    let examples = [];
    switch (patternType) {
      case "literal":
        examples = patternExamples.literal_examples;
        break;
      case "regex":
        examples = patternExamples.regex_examples;
        break;
      case "cucumber_expression":
        examples = patternExamples.cucumber_expression_examples;
        break;
    }

    return (
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="examples">
          <AccordionTrigger className="text-sm">
            <div className="flex items-center gap-2">
              <Lightbulb className="size-4" />
              View Pattern Examples
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              {examples.map((example, idx) => (
                <div key={idx} className="rounded-lg border p-3 text-sm">
                  <div className="font-mono text-xs text-primary mb-2 bg-secondary p-2 rounded">
                    {example.pattern}
                  </div>
                  <p className="text-muted-foreground text-xs mb-2">
                    {example.description}
                  </p>
                  <div className="space-y-1">
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs font-medium">Matches:</span>
                      {example.example_matches.map((match, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          <CheckCircle2 className="mr-1 size-3 text-green-500" />
                          {match}
                        </Badge>
                      ))}
                    </div>
                    {example.example_non_matches && example.example_non_matches.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs font-medium">No Match:</span>
                        {example.example_non_matches.map((match, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            <XCircle className="mr-1 size-3 text-red-500" />
                            {match}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <TestTube className="mr-2 size-4" />
          Test Pattern
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pattern Testing Tool</DialogTitle>
          <DialogDescription>
            Test your pattern matching before adding it to your policy
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Pattern Type</Label>
            <Select
              value={patternType}
              onValueChange={(value) => setPatternType(value as PatternType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="literal">Literal (Substring)</SelectItem>
                <SelectItem value="regex">Regex (Regular Expression)</SelectItem>
                <SelectItem value="cucumber_expression">
                  Cucumber Expression
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {renderPatternTypeDescription(patternType)}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Pattern</Label>
            <Input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder={
                patternType === "literal"
                  ? "password"
                  : patternType === "regex"
                    ? "\\b\\d{3}-\\d{2}-\\d{4}\\b"
                    : "password: {word}"
              }
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Test Text</Label>
            <Input
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Enter text to test against the pattern"
            />
          </div>

          <Button
            onClick={handleTest}
            loading={isTestingPattern}
            disabled={!pattern || !testText}
            className="w-full"
          >
            Test Pattern
          </Button>

          {testResult && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {testResult.match_result.matched ? (
                    <CheckCircle2 className="size-5 text-green-500" />
                  ) : (
                    <XCircle className="size-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    {testResult.match_result.matched ? "Pattern Matched!" : "No Match"}
                  </span>
                </div>

                {testResult.validation && !testResult.validation.valid && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-800 dark:bg-red-950">
                    <p className="font-medium text-red-800 dark:text-red-200">
                      Pattern Error:
                    </p>
                    <p className="text-red-700 dark:text-red-300">
                      {testResult.validation.error}
                    </p>
                    {testResult.validation.error_position !== null && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Error at position: {testResult.validation.error_position}
                      </p>
                    )}
                  </div>
                )}

                {testResult.match_result.matched && (
                  <div className="space-y-2 rounded-lg border bg-muted p-3">
                    <div>
                      <Label className="text-xs">Matched Text:</Label>
                      <p className="font-mono text-sm">
                        {testResult.match_result.matched_text}
                      </p>
                    </div>

                    {testResult.match_result.start !== null && (
                      <div>
                        <Label className="text-xs">Position:</Label>
                        <p className="text-sm">
                          Start: {testResult.match_result.start}, End:{" "}
                          {testResult.match_result.end}
                        </p>
                      </div>
                    )}

                    {testResult.match_result.parameters &&
                      Object.keys(testResult.match_result.parameters).length > 0 && (
                        <div>
                          <Label className="text-xs">Extracted Parameters:</Label>
                          <div className="mt-1 space-y-1">
                            {Object.entries(testResult.match_result.parameters).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <Badge variant="secondary">{key}</Badge>
                                  <span className="font-mono">{value as string}</span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </>
          )}

          <Separator />
          {renderExamples()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PatternTestModal;
