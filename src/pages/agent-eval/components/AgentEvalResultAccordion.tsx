import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "./ui/badge";
import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TestCaseDetailSidebar from "./TestResultDetailsSidebar";
import { ResultEvalData, AgentEvalResultItem } from "../types/agent";

interface Props {
  evalData: ResultEvalData[];
}

const AgentEvalResultAccordion = ({ evalData }: Props) => {
  const [selectedItem, setSelectedItem] = useState<AgentEvalResultItem | null>(null);

  const sortedData = evalData
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  const passedCount = useMemo(() => {
    return sortedData.map(
      (data) =>
        data.agent_eval_result_list.filter((item) => item.status === "pass")
          .length,
    );
  }, [sortedData]);

    const getScoreColorClass = (score: number | undefined | null): string => {
  if (score === undefined || score === null) {
    return "";
  }
  return score < 0.75 ? "text-red-600" : "";
};

  const totalCount = useMemo(() => {
    return sortedData.map((data) => data.agent_eval_result_list.length);
  }, [sortedData]);

  return (
    <>
      <Accordion type="multiple" className="space-y-3">
        {sortedData.map((data, index) => (
          <AccordionItem
            key={data._id}
            value={data._id}
            className="rounded-lg border shadow-sm"
          >
            <AccordionTrigger className="p-4 transition-colors duration-200 hover:bg-gray-50">
              <div className="flex w-full items-center justify-between">
                <div className="flex w-2/3 items-center justify-between gap-3">
                  <div className="flex w-20 flex-col items-start">
                    <span className="text-sm font-medium">
                      {new Intl.DateTimeFormat("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(data.created_at))}
                    </span>
                    <span className="text-xs">
                      {new Intl.DateTimeFormat("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      }).format(new Date(data.created_at))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="px-2 py-1 text-xs">
                      {totalCount[index]} tests
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium">
                      {passedCount[index]}
                    </span>
                    <span className="text-xs">/</span>
                    <span className="text-sm">
                      {totalCount[index]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 overflow-auto rounded-full bg-gray-200">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{
                        width: `${totalCount[index] > 0 ? (passedCount[index] / totalCount[index]) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs">
                    {totalCount[index] > 0 ? Math.round(
                      (passedCount[index] / totalCount[index]) * 100,
                    ) : 0}
                    %
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="bg-grey-50 p-4 pt-0">
              <div className="overflow-x-auto">
                <Table className="w-full table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[14%]">TC</TableHead>
                      <TableHead className="w-[15%]">Input</TableHead>
                      <TableHead className="w-[15%]">Expected Output</TableHead>
                      <TableHead className="w-[15%]">Actual Output</TableHead>
                      <TableHead className="w-[8%] text-center">Status</TableHead>
                      <TableHead className="w-[8%] text-center">Correctness</TableHead>
                      <TableHead className="w-[8%] text-center">Coherence</TableHead>
                      <TableHead className="w-[8%] text-center">Relevance</TableHead>
                      <TableHead className="w-[8%] text-center">Conciseness</TableHead>
                      <TableHead className="w-[8%] text-center">Safety</TableHead>
                      <TableHead className="w-[8%] text-center font-bold">Average</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.agent_eval_result_list.map((item) => (
                      <TableRow
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        <TableCell className="font-medium truncate overflow-auto" title={item.id}>{item.id}</TableCell>
                        <TableCell className="truncate overflow-auto" title={item.user_input}>{item.user_input}</TableCell>
                        <TableCell className="truncate overflow-auto" title={item.expected_output}>{item.expected_output}</TableCell>
                        <TableCell className="truncate overflow-auto" title={item.actual_output}>{item.actual_output}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={item.status === "pass" ? "default" : "destructive"}
                            className={`px-2 py-1 text-xs font-medium ${
                              item.status === "pass"
                                ? "border-green-200 bg-green-100 text-green-800"
                                : "border-red-200 bg-red-100 text-red-800"
                            }`}
                          >
                            {item.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center"><span className={getScoreColorClass(item.scorecard?.correctness)}>{item.scorecard?.correctness ?? "N/A"}</span></TableCell>
                        <TableCell className="text-center"><span className={getScoreColorClass(item.scorecard?.coherence)}>{item.scorecard?.coherence ?? "N/A"}</span></TableCell>
                        <TableCell className="text-center"><span className={getScoreColorClass(item.scorecard?.relevance)}>{item.scorecard?.relevance ?? "N/A"}</span></TableCell>
                        <TableCell className="text-center"><span className={getScoreColorClass(item.scorecard?.conciseness)}>{item.scorecard?.conciseness ?? "N/A"}</span></TableCell>
                        <TableCell className="text-center"><span className={getScoreColorClass(item.scorecard?.safety)}>{item.scorecard?.safety ?? "N/A"}</span></TableCell>
                        <TableCell className="text-center font-bold"><span className={getScoreColorClass(item.scorecard?.average)}>{item.scorecard?.average?.toFixed(2) ?? "N/A"}</span></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <TestCaseDetailSidebar
        item={selectedItem}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
};

export default AgentEvalResultAccordion;
