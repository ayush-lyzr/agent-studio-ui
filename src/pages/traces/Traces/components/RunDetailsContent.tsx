import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, User, Bot, Search, Wrench } from "lucide-react";
import { useState } from "react";
import { AgentRun } from "../types/trace";

interface RunDetailsContentProps {
  run: AgentRun;
}

const RunDetailsContent: React.FC<RunDetailsContentProps> = ({ run }) => {
  const [isInputExpanded, setIsInputExpanded] = useState(true);
  const [isOutputExpanded, setIsOutputExpanded] = useState(true);

  const toggleInputExpanded = () => setIsInputExpanded(!isInputExpanded);
  const toggleOutputExpanded = () => setIsOutputExpanded(!isOutputExpanded);
  return (
    <ScrollArea className="h-[calc(85vh-12rem)] px-6">
      <div className="space-y-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Input</h3>
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              onClick={toggleInputExpanded}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isInputExpanded ? "rotate-0" : "-rotate-90"}`}
              />
            </Button>
          </div>

          {isInputExpanded && (
            <div className="space-y-3">
              {run.input_messages.slice(1).length > 0 ? (
                run.input_messages.slice(1).map((message, idx) => (
                  <Card key={idx} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                          {message.role === "user" ? (
                            <User className="h-3 w-3" />
                          ) : (
                            <Bot className="h-3 w-3" />
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {message.role.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm leading-relaxed">
                        {message.content}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="shadow-sm border border-muted/50">
                  <CardContent className="p-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
                        <svg
                          className="h-6 w-6 text-muted-foreground"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Messages Not Stored
                        </h4>
                        <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-sm">
                          Conversation messages are not stored for privacy and security reasons. 
                          This ensures your data remains confidential and protected.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Output</h3>
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              onClick={toggleOutputExpanded}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isOutputExpanded ? "rotate-0" : "-rotate-90"}`}
              />
            </Button>
          </div>

          {isOutputExpanded && (
            <>
              {run.output_messages && 
               (run.output_messages.content || 
                run.output_messages.tool_calls || 
                Object.keys(run.output_messages).length > 0) ? (
                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                        <Bot className="h-3 w-3" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        AI
                      </Badge>
                      {run.output_messages?.tool_calls && (
                        <Badge variant="outline" className="text-xs">
                          <Wrench className="mr-1 h-3 w-3" />
                          TOOL CALLS
                        </Badge>
                      )}
                    </div>

                    {run.output_messages?.content && (
                      <div className="mb-4 text-sm leading-relaxed">
                        {run.output_messages.content}
                      </div>
                    )}

                    {run.output_messages?.tool_calls && (
                      <div className="space-y-3">
                        {run.output_messages.tool_calls.map(
                          (toolCall: any, idx: number) => (
                            <div key={idx} className="rounded-lg bg-muted/50 p-3">
                              <div className="mb-2 flex items-center gap-2">
                                <Search className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {toolCall?.function?.name || "search"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  call_{Math.random().toString(36).substr(2, 9)}
                                </span>
                              </div>
                              <div className="rounded bg-background p-3">
                                <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
                                  {toolCall?.function?.arguments || "{}"}
                                </pre>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-sm border border-muted/50">
                  <CardContent className="p-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
                        <svg
                          className="h-6 w-6 text-muted-foreground"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          AI Response Not Stored
                        </h4>
                        <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-sm">
                          AI responses are not stored for privacy and security reasons. 
                          This ensures your conversations remain confidential and protected.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </ScrollArea>
  );
};

export default RunDetailsContent;
