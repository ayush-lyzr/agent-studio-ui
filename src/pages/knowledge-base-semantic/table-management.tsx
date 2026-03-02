import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Trash2, Loader2, ArrowRight } from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordian";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/custom/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ISchemaTable, ISemanticTable, ISemanticTableMeta } from "@/lib/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";
import { BASE_URL } from "@/lib/constants";
import useStore from "@/lib/store";
import { AxiosResponse } from "axios";

interface DBTableManagementProps {
  data: ISchemaTable;
  loading: boolean;
  setSchema: Dispatch<SetStateAction<string>>;
  rag_config_id: string;
  metadata?: ISemanticTableMeta;
  onSuccess: () => void;
}

const columns: ColumnDef<ISemanticTable>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    header: "Status",
    cell: (props) => {
      const isAdded = props.row.original.included;
      return (
        <Badge
          variant={isAdded ? "success" : "secondary"}
          className="rounded-full"
        >
          {isAdded ? "Added" : "Not Added"}
        </Badge>
      );
    },
    id: "status",
  },
  {
    header: "",
    id: "action",
    cell: (props) => (
      <Button
        variant="link"
        onClick={() =>
          props.table.options.meta?.setSchema?.(props.row.original?.name)
        }
      >
        Configure <ArrowRight className="size-4" />
      </Button>
    ),
  },
  {
    header: "",
    id: "action",
    cell: (props) => {
      const isAdded = props.row.original.included;
      const { toast } = useToast();
      const [taskId, setTaskId] = useState<string | null>(null);
      const [loading, setLoading] = useState<boolean>(false);
      const [dialogVisible, setDialogVisible] = useState<boolean>(false);
      const apiKey = useStore((state) => state.api_key);

      const { data: taskStatus } = useQuery({
        queryKey: ["getTaskStatus", taskId],
        queryFn: async () =>
          axios.get(`/v3/semantic_model/task/${taskId}`, {
            baseURL: BASE_URL,
            headers: { accept: "application/json", "x-api-key": apiKey },
          }),
        select: (res: AxiosResponse) => res.data,
        enabled: !!taskId,
        refetchInterval: 30 * 1000,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
      });

      const { mutateAsync: deleteTable } = useMutation({
        mutationKey: [
          "deleteTable",
          props.row.original.name,
          props.table.options.meta?.rag_config_id,
        ],
        mutationFn: () =>
          axios.delete(
            `/v3/semantic_model/remove_documentation_task/${props.table.options.meta?.rag_config_id}/${props.row.original.name}`,
            { baseURL: BASE_URL, headers: { "x-api-key": apiKey } },
          ),
      });

      const handleDelete = async () => {
        try {
          toast({
            title: "Deleting ...",
            description:
              "This might take a while, you can come back later to check status.",
          });
          setLoading(true);
          const res = await deleteTable();
          setTaskId(res.data?.task_id);
        } catch (error) {}
      };

      useEffect(() => {
        if (taskStatus?.status === "completed") {
          setTaskId(null);
          toast({
            title: "Removed the table",
            description: `Removed descriptions and schema information for ${taskStatus?.result?.added_table_name} table`,
          });
          setDialogVisible(false);
          props.table.options.meta?.onSuccess?.();
        }
      }, [taskStatus]);

      return isAdded ? (
        <AlertDialog open={dialogVisible} onOpenChange={setDialogVisible}>
          <AlertDialogTrigger
            className={cn(
              buttonVariants({ variant: "link" }),
              "text-destructive",
            )}
          >
            Remove
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will remove the table
                documentation from the knowledge base.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button loading={loading} onClick={handleDelete}>
                <Trash2 className="mr-1 size-4" />
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null;
    },
  },
];

const DbTables = ({
  data,
  setSchema,
  height,
  rag_config_id,
  onSuccess,
}: {
  data: ISemanticTable[];
  setSchema: Dispatch<SetStateAction<string>>;
  height: string;
  rag_config_id: string;
  onSuccess: () => void;
}) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      updateData: () => {},
      setSchema,
      rag_config_id,
      onSuccess,
    },
  });

  return (
    <Table containerClassname={cn("h-fit relative", height)}>
      <TableHeader className="sticky top-0 z-10 bg-white">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow
            key={headerGroup.id}
            className="text-xs hover:bg-transparent"
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
      <TableBody className=" overflow-y-auto">
        {false ? (
          <TableRow className="h-full">
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
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-full">
              <div className="grid place-items-center gap-4 p-4">
                <img src="/images/empty.svg" width={80} alt="Empty state" />
                <p>Nothing to display.</p>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export function DBTableManagement({
  data: response,
  loading,
  setSchema,
  metadata,
  rag_config_id,
  onSuccess,
}: DBTableManagementProps) {
  const data = response?.has_schemas
    ? Object.entries(response?.schemas ?? {})
    : response?.tables;

  return (
    <div className="flex w-[40%] flex-col space-y-6 px-4">
      <span className="inline-flex gap-2 text-sm font-semibold">
        {metadata?.database_name}{" "}
        <p className="text-muted-foreground">
          [{metadata?.database_provider_id}]
        </p>
      </span>
      <Separator />
      <div className="h-full overflow-y-auto">
        {loading ? (
          new Array(4)
            .fill(0)
            .map((_, key) => <Skeleton key={key} className="h-10 w-full" />)
        ) : data?.length ? (
          response?.has_schemas ? (
            <Accordion
              type="single"
              defaultValue={Object.keys(response?.schemas ?? {})?.[0]}
              collapsible
              className="h-full w-[95%]"
            >
              {Object.entries(response?.schemas ?? {})?.map(
                ([schemaName, table]) => (
                  <AccordionItem value={schemaName} key={schemaName}>
                    <AccordionTrigger>{schemaName}</AccordionTrigger>
                    <AccordionContent>
                      <DbTables
                        data={table}
                        setSchema={setSchema}
                        height="max-h-[20rem]"
                        rag_config_id={rag_config_id}
                        onSuccess={onSuccess}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ),
              )}
            </Accordion>
          ) : (
            <DbTables
              data={response?.tables ?? []}
              setSchema={setSchema}
              height="max-h-[100vh]"
              rag_config_id={rag_config_id}
              onSuccess={onSuccess}
            />
          )
        ) : (
          <div className="grid h-[90%] place-items-center rounded-lg text-sm">
            <div className="grid place-items-center gap-4">
              <img src="/images/empty.svg" width={80} />
              <p>No tables</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DBTableManagement;
