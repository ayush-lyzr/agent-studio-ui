import { useState, useCallback, useMemo } from "react";
import { Search, RefreshCcw, Trash2, Loader2 } from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  RowSelectionState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import Loader from "@/components/loader";

interface FileManagementTableProps {
  data: string[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onUpload: () => Promise<void>;
  onDelete: (files: string[]) => Promise<void>;
}

export function FileManagementTable({
  data = [],
  isLoading: tableLoading,
  onRefresh,
  onDelete,
}: FileManagementTableProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [actionStates, setActionStates] = useState({
    refreshing: false,
    uploading: false,
    deleting: false,
  });

  const filteredData = useMemo(() => {
    return (data || []).filter((item) =>
      (item || "").toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [data, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAction = useCallback(
    async (
      action: () => Promise<void>,
      actionType: keyof typeof actionStates,
      successMessage: string,
    ) => {
      try {
        setActionStates((prev) => ({ ...prev, [actionType]: true }));
        await action();
        toast({
          title: "Success",
          description: successMessage,
        });
      } catch (error) {
        console.error(`Error during ${actionType}:`, error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to ${actionType}. Please try again.`,
        });
      } finally {
        setActionStates((prev) => ({ ...prev, [actionType]: false }));
      }
    },
    [toast],
  );

  const handleRefresh = useCallback(
    () => handleAction(onRefresh, "refreshing", "Files refreshed successfully"),
    [handleAction, onRefresh],
  );

  // const handleUpload = useCallback(async () => {
  //   setActionStates((prev) => ({ ...prev, uploading: true }));
  //   try {
  //     await onUpload();
  //   } finally {
  //     setActionStates((prev) => ({ ...prev, uploading: false }));
  //   }
  // }, [onUpload]);

  const handleMassDelete = useCallback(async () => {
    const selectedFiles = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    await handleAction(
      () => onDelete(selectedFiles),
      "deleting",
      `Successfully deleted ${selectedFiles.length} file(s)`,
    );
    setRowSelection({});
  }, [handleAction, onDelete]);

  const columns: ColumnDef<string>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorFn: (str) => str,
      header: "File name",
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  });

  const isLoading = tableLoading || actionStates.refreshing;

  return (
    <div className="mr-5 space-y-4">
      <div className="flex items-center gap-4">
        <span className="flex flex-1 items-center rounded-md border border-input px-2">
          <Search className="size-5" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="border-none bg-transparent shadow-none"
          />
        </span>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={actionStates.refreshing}
        >
          <RefreshCcw
            className={`size-4 ${actionStates.refreshing ? "animate-spin" : ""}`}
          />
        </Button>
        {/* <Button onClick={handleUpload} loading={actionStates.uploading}>
          <Upload className="mr-1 size-4" />
          Upload
        </Button> */}
        {Object.keys(rowSelection).length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="text-destructive"
                disabled={actionStates.deleting}
              >
                {actionStates.deleting ? (
                  <Loader />
                ) : (
                  <Trash2 className="mr-1 size-4" />
                )}
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete{" "}
                  {Object.keys(rowSelection).length} selected file(s).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleMassDelete}
                  disabled={actionStates.deleting}
                >
                  <Trash2 className="mr-1 size-4" /> Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="relative overflow-auto rounded-md border">
        <Table>
          <TableHeader className="sticky top-0">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="h-[20vh]">
                <TableCell colSpan={columns.length} className="text-center">
                  <div className="grid place-items-center">
                    <Loader2 className="animate-spin" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24">
                  <div className="grid place-items-center gap-4 p-4">
                    <img src="/images/empty.svg" width={80} alt="Empty state" />
                    <p>Nothing to display.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default FileManagementTable;
