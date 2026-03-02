import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AgentEvalResultItem } from "../types/agent";

interface TestCaseDetailDrawerProps {
  item: AgentEvalResultItem | null;
  open: boolean;
  onClose: () => void;
}

// Helper function to apply conditional styling for scores
const getScoreClass = (score: number | undefined) => {
  if (score === undefined || score === null) return "";
  return score < 0.75 ? "text-red-600" : "";
};

const TestCaseDetailSidebar = ({ item, open, onClose }: TestCaseDetailDrawerProps) => {
  if (!item) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-[50vw] sm:max-w-none overflow-y-auto" side="right">
        <SheetHeader>
          <SheetTitle>Test Case Details</SheetTitle>
          <SheetDescription className="truncate" title={item.id}>
            ID: {item.id}
          </SheetDescription>
        </SheetHeader>
        <div className="py-6 space-y-6">
          <div>
            <h4 className="font-semibold mb-2">User Input</h4>
            <pre className="p-3 bg-gray-100 rounded-md text-sm whitespace-pre-wrap font-mono">
              {item.user_input || "N/A"}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Expected Output</h4>
            <pre className="p-3 bg-gray-100 rounded-md text-sm whitespace-pre-wrap font-mono">
              {item.expected_output || "N/A"}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Actual Output</h4>
            <pre className="p-3 bg-gray-100 rounded-md text-sm whitespace-pre-wrap font-mono">
              {item.actual_output || "N/A"}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Evaluator Remarks</h4>
            <pre className="p-3 bg-gray-100 rounded-md text-sm whitespace-pre-wrap font-mono">
              {item.details || "No remarks provided."}
            </pre>
          </div>

          {item.scorecard && (
            <div>
              <h4 className="font-semibold mb-2">Scorecard</h4>
              <Table className="border rounded-lg">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Correctness</TableHead>
                    <TableHead className="text-center">Coherence</TableHead>
                    <TableHead className="text-center">Relevance</TableHead>
                    <TableHead className="text-center">Conciseness</TableHead>
                    <TableHead className="text-center">Safety</TableHead>
                    <TableHead className="text-center font-bold">Average</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className={`text-center font-medium ${getScoreClass(item.scorecard.correctness)}`}>
                      {item.scorecard.correctness?.toFixed(2) ?? "N/A"}
                    </TableCell>
                    <TableCell className={`text-center font-medium ${getScoreClass(item.scorecard.coherence)}`}>
                      {item.scorecard.coherence?.toFixed(2) ?? "N/A"}
                    </TableCell>
                    <TableCell className={`text-center font-medium ${getScoreClass(item.scorecard.relevance)}`}>
                      {item.scorecard.relevance?.toFixed(2) ?? "N/A"}
                    </TableCell>
                    <TableCell className={`text-center font-medium ${getScoreClass(item.scorecard.conciseness)}`}>
                      {item.scorecard.conciseness?.toFixed(2) ?? "N/A"}
                    </TableCell>
                    <TableCell className={`text-center font-medium ${getScoreClass(item.scorecard.safety)}`}>
                      {item.scorecard.safety?.toFixed(2) ?? "N/A"}
                    </TableCell>
                    <TableCell className={`text-center font-bold ${getScoreClass(item.scorecard.average)}`}>
                      {item.scorecard.average?.toFixed(2) ?? "N/A"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TestCaseDetailSidebar;
