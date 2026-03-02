import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface AgentEvalItem {
  id: string;
  purpose: string;
  user_input: string;
  expected_output: string;
  evaluation_notes: string;
}

interface EvalData {
  _id: string;
  created_at: string;
  eval_name: string;
  agent_eval_list: AgentEvalItem[];
}

interface Props {
  evalData: EvalData[];
  onRunTest: (cases: any) => void;
  isRunning?: boolean;
}

const AgentEvalAccordion = ({ evalData, onRunTest, isRunning }: Props) => {
  const sortedData = evalData
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  return (
    <Accordion type="multiple">
      {sortedData.map((data) => (
        <AccordionItem key={data._id} value={data._id}>
          <AccordionTrigger className="p-3">
            <div className="flex w-full items-center justify-between gap-10">
              <div className="flex w-full items-center justify-between">
                <span className="block w-20 truncate text-left">
                  {data.eval_name}
                </span>
                <span className="whitespace-nowrap">
                  {`${data.agent_eval_list.length} Tests`}
                </span>
                <span className="whitespace-nowrap">
                  {new Intl.DateTimeFormat("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  }).format(new Date(data.created_at))}
                </span>
              </div>
              <div className="mr-2 flex items-center gap-2">
                <Button
                  disabled={isRunning}
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRunTest(data);
                  }}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Run test case
                </Button>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-3">
            {data.agent_eval_list.map((item) => (
              <div key={item.id} className="mb-4 rounded border p-3">
                <h4 className="mb-1 text-xs font-bold">{item.id}</h4>
                <p className="mb-1 text-xs">
                  <strong>Purpose:</strong> {item.purpose}
                </p>
                <p className="mb-1 text-xs">
                  <strong>Input:</strong> {item.user_input}
                </p>
                <p className="mb-1 text-xs">
                  <strong>Expected:</strong> {item.expected_output}
                </p>
                <p className="text-xs">
                  <strong>Notes:</strong> {item.evaluation_notes}
                </p>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default AgentEvalAccordion;
