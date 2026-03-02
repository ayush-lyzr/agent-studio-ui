import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AgentRun } from "../types/trace";

interface MetadataDetailsContentProps {
  run: AgentRun;
}

const MetadataDetailsContent: React.FC<MetadataDetailsContentProps> = ({
  run,
}) => {
  const getDuration = () => {
    if (run.start_time && run.end_time) {
      const start = new Date(run.start_time);
      const end = new Date(run.end_time);
      return ((end.getTime() - start.getTime()) / 1000).toFixed(2);
    }
    return (run.latency_ms / 1000).toFixed(2);
  };

 

  const metadataItems = [
    { label: "Agent Name", value: run.agent_name, type: "text" },
    { label: "Agent ID", value: run.agent_id, type: "id" },
    { label: "LLM Provider", value: run.llm_provider, type: "text" },
    { label: "Language Model", value: run.language_model, type: "text" },
    { label: "Duration", value: `${getDuration()}s`, type: "duration" },
    {
      label: "Credits Consumed",
      value: run.actions.toFixed(2),
      type: "credits",
    },
    {
      label: "Total Tokens",
      value : run.num_input_tokens + run.num_output_tokens,
      type: "tokens",
    },
    {
      label: "Input Messages",
      value: run.input_messages?.length - 1 || 0,
      type: "count",
    },
    {
      label: "Tool Calls",
      value: run.output_messages?.tool_calls?.length || 0,
      type: "count",
    },
    { label: "Run ID", value: run.run_id, type: "id" },
    { label: "Trace ID", value: run.trace_id, type: "id" },
    { label: "Log ID", value: run.log_id, type: "id" },
  ];

  const getValueDisplay = (item: any) => {
    switch (item.type) {
      case "id":
        return (
          <span className="rounded bg-blue-50 px-2 py-1 font-mono text-sm text-blue-600">
            {item.value}
          </span>
        );
      case "duration":
        return (
          <span className="text-sm font-medium text-green-600">
            {item.value}
          </span>
        );
      case "credits":
        return (
          <span className="text-sm font-medium text-amber-600">
            {item.value}
          </span>
        );
      case "tokens":
        return (
          <span className="text-sm font-medium text-purple-600">
            {item.value}
          </span>
        );
      case "count":
        return (
          <Badge variant="outline" className="text-xs">
            {item.value}
          </Badge>
        );
      default:
        return <span className="text-sm font-medium">{item.value}</span>;
    }
  };

  return (
    <ScrollArea className="h-[calc(85vh-12rem)] px-6">
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Run Metadata</h3>

          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {metadataItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0"
                  >
                    <span className="text-sm font-medium text-muted-foreground">
                      {item.label}
                    </span>
                    <div className="text-right">{getValueDisplay(item)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Timeline</h3>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium">Start Time</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {run.start_time
                      ? new Date(run.start_time).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <span className="text-sm font-medium">End Time</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {run.end_time
                      ? new Date(run.end_time).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
};

export default MetadataDetailsContent;
