import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { buttonVariants } from "@/components/custom/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ICredential } from "@/lib/types";
import Loader from "@/components/loader";
import { useEffect, useState } from "react";
import useStore from "@/lib/store";
import { useModel } from "./model-service";
import { DeleteKey } from "./delete-key";

export const ModelKeys = () => {
  const apiKey = useStore((state) => state.api_key);
  const [credentials, setCredentials] = useState<ICredential[]>([]);
  const { getCredentials, isFetchingCredentials } = useModel({ apiKey });

  const refreshCredentials = () => {
    getCredentials().then((res) => setCredentials(res.data ?? []));
  };

  const handleDelete = (credentialId: string) => {
    setCredentials((prev) =>
      prev.filter((cred) => cred.credential_id !== credentialId),
    );
  };

  const columns: ColumnDef<ICredential>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "credential",
      header: "Key",
      accessorFn: (row) => {
        const key = Object.values(row.credentials)?.[0];
        return key ? `${key.substring(0, 20)}*******************` : "";
      },
    },
    {
      id: "actions",
      accessorKey: "",
      header: "Actions",
      cell: ({ row: { original } }) => (
        <div className="flex w-full items-center justify-end gap-2">
          <DeleteKey data={original} onDelete={handleDelete} />
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: credentials,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  useEffect(() => {
    refreshCredentials();
  }, []);

  return (
    <Dialog>
      <DialogTrigger className={buttonVariants({ variant: "outline" })}>
        Your keys
      </DialogTrigger>
      <DialogContent className="max-w-3xl !rounded-xl data-[state=closed]:slide-out-to-bottom-[20%] data-[state=open]:slide-in-from-bottom-[20%]">
        <DialogHeader>
          <DialogTitle>Keys</DialogTitle>
        </DialogHeader>
        <Table className="border-separate rounded-md border-none text-black">
          <TableHeader className="first:rounded-tl-md last:rounded-tr-md">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="font-semibold text-black hover:bg-transparent"
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
          <TableBody className="bg-muted shadow-lg">
            {isFetchingCredentials && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="grid place-items-center">
                    <Loader />
                    Loading ...
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isFetchingCredentials &&
              table.getRowModel().rows?.length > 0 &&
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="first:rounded-bl-md last:rounded-br-md"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isFetchingCredentials &&
              table.getRowModel().rows?.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 rounded-lg border bg-neutral-50"
                  >
                    <div className="grid place-items-center gap-4 p-4">
                      <img src="/images/empty.svg" width={100} />
                      <p className="text-lg">Nothing to display.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
};
