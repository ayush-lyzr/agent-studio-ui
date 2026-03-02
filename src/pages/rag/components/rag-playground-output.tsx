import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordian";

const RetrievedRag = ({
  response,
  isLoading,
}: {
  response: any;
  isLoading: boolean;
}) => {
  const renderResults = () => {
    if (!response || !response.results) return null;

    return response.results.map((result: any, index: any) => (
      <AccordionItem value={`item-${index}`} key={index}>
        <AccordionTrigger>
          <div className="flex w-full justify-between space-x-20">
            <span className="text-left">
              {(() => {
                let source = result?.metadata?.source;
                if (source?.startsWith("storage/")) {
                  source = source.slice("storage/".length);
                }
                if (source && source.length > 80) {
                  source = source.substring(0, 80) + "...";
                }
                return source;
              })()}
            </span>
            <span
              className={`ml-2 mr-6 text-xl ${result?.score * 100 >= 75 ? "text-green-500" : result?.score * 100 >= 50 ? "text-white" : "text-red-500"}`}
            >
              {(result?.score * 100).toFixed(2)}%
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <p>
            {result?.text?.length > 500
              ? result.text.substring(0, 500) + "..."
              : result?.text}
          </p>
        </AccordionContent>
      </AccordionItem>
    ));
  };

  return (
    <div className="flex flex-col px-4 pt-4">
      <CardHeader>
        <CardTitle>Retrieved Responses</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[30rem] overflow-auto">
        {isLoading ? (
          <>
            <Skeleton className="mb-4 h-4 w-[250px]" />
            <Skeleton className="mb-4 h-4 w-[250px]" />
            <Skeleton className="mb-4 h-4 w-[250px]" />
            <Skeleton className="mb-4 h-4 w-[250px]" />
          </>
        ) : response ? (
          <Accordion type="single" collapsible className="w-full">
            {renderResults()}
          </Accordion>
        ) : (
          <p>Please query the RAG Store to view retrieved chunks.</p>
        )}
      </CardContent>
    </div>
  );
};

export default RetrievedRag;
