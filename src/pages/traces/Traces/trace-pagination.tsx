import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface Props {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
}

const TracePagination = ({
  currentPage,
  itemsPerPage,
  totalItems,
  totalPages,
  setCurrentPage,
}: Props) => {
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const getPageNumbers = (current: number, total: number) => {
    const delta = 2;
    const range: (number | string)[] = [];

    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= current - delta && i <= current + delta)
      ) {
        range.push(i);
      } else if (range[range.length - 1] !== "...") {
        range.push("...");
      }
    }

    return range;
  };
  return (
    <div className="flex items-center justify-between px-2">
      <p className="text-sm text-muted-foreground">
        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
        {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
        results
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
          disabled={!hasPrevPage}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPageNumbers(currentPage, totalPages).map((page, index) =>
          page === "..." ? (
            <div key={`ellipsis-${index}`} className="px-2">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </div>
          ) : (
            <Button
              key={`page-${page}`}
              variant={currentPage === page ? "default" : "outline"}
              onClick={() => setCurrentPage(Number(page))}
              className="hidden sm:inline-flex"
            >
              {page}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
          disabled={!hasNextPage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default TracePagination;
