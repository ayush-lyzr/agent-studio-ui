import React, { Dispatch, SetStateAction, useMemo } from "react";
import { Loader2 } from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { AxiosResponse } from "axios";
import { useQuery } from "@tanstack/react-query";

import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useStore from "@/lib/store";
import { BASE_URL } from "@/lib/constants";
import axios from "@/lib/axios";
import { ISemanticTableMeta } from "@/lib/types";

type IPreviewTable = {
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
  schema: string;
  rag_config_id?: string;
  metadata?: ISemanticTableMeta;
};

const PreviewTable: React.FC<IPreviewTable> = ({
  open,
  onOpen,
  schema,
  metadata,
  rag_config_id,
}) => {
  const apiKey = useStore((state) => state.api_key);

  const {
    data: ragTablePreview = [],
    isFetching: isFetchingTablePreview,
  } = useQuery({
    queryKey: ["getRagTablePreview", rag_config_id],
    queryFn: async () =>
      axios.get(
        `/v3/semantic_model/table_preview/${rag_config_id}/${metadata?.database_id}/${schema}`,
        {
          baseURL: BASE_URL,
          headers: { accept: "application/json", "x-api-key": apiKey },
        },
      ),
    select: (res: AxiosResponse) => res.data?.table_preview,
    enabled: !!schema && !!rag_config_id && open,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const columns = Object.keys(ragTablePreview?.[0] ?? {})?.map((key) => ({
    header: key,
    accessorKey: key,
    colSpan: 1,
  }));

  const table = useReactTable({
    data: useMemo(
      () => ragTablePreview,
      [schema, rag_config_id, ragTablePreview?.length, columns?.length],
    ),
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent className="max-h-[40rem] max-w-[55rem]">
        <DialogHeader>
          <DialogTitle>Preview Table</DialogTitle>
          <DialogDescription>
            Preview of the table data
          </DialogDescription>
        </DialogHeader>
        <div className="transition-all ease-in-out">
          {isFetchingTablePreview ? (
            <div className="grid h-[25rem] place-items-center">
              <div className="grid place-items-center">
                <Loader2 className="animate-spin" />
                Loading...
              </div>
            </div>
          ) : (
            <Table containerClassname="h-fit max-h-[25rem] relative max-w-[50rem] overflow-x-auto">
              <TableHeader className="sticky top-0 z-10 bg-transparent text-xs text-secondary-foreground">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="hover:bg-transparent"
                  >
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
              <TableBody className="h-[95%] overflow-y-auto">
                {table.getRowModel()?.rows?.length > 0 ? (
                  table.getRowModel()?.rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row
                        .getVisibleCells()
                        ?.map((cell) => (
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
                    <TableCell colSpan={columns?.length} className="h-24">
                      <div className="grid place-items-center gap-4 p-4">
                        <img
                          src="/images/empty.svg"
                          width={80}
                          alt="Empty state"
                        />
                        <p>Nothing to display.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
        <DialogFooter className="px-4">
          <DialogClose className={buttonVariants({ variant: "outline" })}>
            Close
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewTable;
