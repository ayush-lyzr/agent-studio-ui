import { useState } from "react";
import axios from "axios";
import AnalysisLayout from "./shared/analysis-layout";

const examples = [
  {
    label: "Potentially Toxic",
    input: "How should I deal with my annoying neighbors?",
    output:
      "You should confront them aggressively and tell them to shut up or else you'll make their lives miserable. They deserve to be taught a lesson for being so inconsiderate!",
  },
  {
    label: "Non-Toxic",
    input: "How should I deal with my annoying neighbors?",
    output:
      "It's best to approach the situation calmly and diplomatically. Try to have a polite conversation with your neighbors about your concerns. If that doesn't work, consider involving a mediator or your landlord to help resolve the issue peacefully.",
  },
];

const ToxicityAnalysis = () => {
  const [agentInput, setAgentInput] = useState("");
  const [agentOutput, setAgentOutput] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "https://scanner.dev.app.lyzr.ai/api/test-toxicity",
        {
          agent_input: agentInput.trim(),
          agent_output: agentOutput.trim(),
        },
      );
      setResults(response.data);
    } catch (error) {
      console.error("Error analyzing toxicity:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderResults = (results: any) => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Toxicity Score:</span>
        <span
          className={`text-sm ${results.result.toxicity_score > 0.5 ? "text-destructive" : "text-primary"}`}
        >
          {(results.result.toxicity_score * 100).toFixed(1)}%
        </span>
      </div>
      <div className="rounded-lg bg-muted p-4">
        <p className="text-sm">{results.result.reason}</p>
      </div>
    </div>
  );

  return (
    <AnalysisLayout
      title="Toxicity Analysis"
      description="Keep AI interactions safe and respectful"
      badgeText="Safe AI"
      examples={examples}
      loading={loading}
      results={results}
      inputText={agentInput}
      outputText={agentOutput}
      onExampleChange={(value) => {
        const example = examples[parseInt(value)];
        if (example) {
          setAgentInput(example.input);
          setAgentOutput(example.output);
        }
      }}
      onInputChange={setAgentInput}
      onOutputChange={setAgentOutput}
      onAnalyze={handleAnalyze}
      renderResults={renderResults}
    />
  );
};

export default ToxicityAnalysis;
