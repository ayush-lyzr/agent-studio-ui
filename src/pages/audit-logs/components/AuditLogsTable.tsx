import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AuditLogResponse } from "../types";
import { createColumns } from "./columns";
import AuditLogDetail from "./AuditLogDetail";
import { UserMap } from "..";

interface AuditLogsTableProps {
  logs: AuditLogResponse[];
  total: number;
  isLoading: boolean;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  userMap: UserMap;
}

const AuditLogsTable = ({
  logs,
  total,
  isLoading,
  pageSize,
  currentPage,
  onPageChange,
  userMap,
}: AuditLogsTableProps) => {
  const [selectedLog, setSelectedLog] = useState<AuditLogResponse | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleViewDetails = (log: AuditLogResponse) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const columns = useMemo(
    () => createColumns(handleViewDetails, userMap),
    [userMap]
  );

  const table = useReactTable({
    data: logs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / pageSize),
    state: {
      pagination: {
        pageIndex: currentPage,
        pageSize,
      },
    },
  });

  const totalPages = Math.ceil(total / pageSize);
  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, total);

  return (
    <div className="space-y-4">
      <Table
        className="w-full border-collapse rounded-md border"
        containerClassname="h-[54vh] overflow-y-scroll"
      >
        <TableHeader className="sticky top-0 bg-secondary text-xs">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="font-semibold hover:bg-transparent"
            >
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-[46vh] text-center text-primary"
              >
                <div className="grid place-items-center">
                  <Loader2 className="size-5 animate-spin" />
                  Loading...
                </div>
              </TableCell>
            </TableRow>
          )}
          {!isLoading &&
            table.getRowModel().rows?.length > 0 &&
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="bg-background text-sm text-primary"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          {!isLoading && table.getRowModel().rows?.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-[46vh] border bg-secondary text-primary"
              >
                <div className="grid place-items-center gap-4 p-4">
                  <img src="/images/empty.svg" width={100} alt="No data" />
                  <p>No audit logs found.</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {total > 0 ? startItem : 0} - {endItem} of {total} results
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(0)}
            disabled={currentPage === 0}
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="mr-1 size-4" />
            Previous
          </Button>
          <span className="px-2 text-sm">
            Page {currentPage + 1} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
          >
            Next
            <ChevronRight className="ml-1 size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages - 1)}
            disabled={currentPage >= totalPages - 1}
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>

      <AuditLogDetail
        log={selectedLog}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedLog(null);
        }}
      />
    </div>
  );
};

export default AuditLogsTable;
