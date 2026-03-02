import { Separator } from "@/components/ui/separator";
import React, {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Loader2 } from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  RowData,
  useReactTable,
} from "@tanstack/react-table";
import { AxiosResponse } from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import PreviewTable from "./preview-table";
import { Input } from "@/components/ui/input";
import { BASE_URL } from "@/lib/constants";
import axios from "@/lib/axios";
import useStore from "@/lib/store";
import {
  IOrganization,
  ISchemaTableConfig,
  ISemanticTableMeta,
} from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { capitalize } from "@/lib/utils";
import { useManageAdminStore } from "../manage-admin/manage-admin.store";

type ISchematicModelConfiguration = {
  schema: string;
  rag_config_id?: string;
  metadata?: ISemanticTableMeta;
  onSuccess: () => void;
};

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    current_organization?: IOrganization;
    updateData?: (rowIndex: number, value: string) => void;
    setSchema?: Dispatch<SetStateAction<string>>;
    rag_config_id?: string;
    onSuccess?: () => void;
  }
}

const columns: ColumnDef<{
  name: string;
  description: string;
  type: string;
}>[] = [
  {
    header: "Name",
    accessorKey: "name",
    size: 50,
  },
  {
    header: "Description",
    accessorKey: "description",
    size: 200,
    cell: ({ getValue, row: { index }, column: { id }, table }) => {
      const initialValue = getValue() as string;
      const [value, setValue] = React.useState<string>(initialValue);
      const onBlur = () => {
        table.options.meta?.updateData?.(index, id, value);
      };

      React.useEffect(() => {
        setValue(initialValue);
      }, [initialValue]);

      const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        table.options.meta?.updateData?.(index, id, e.target.value);
      };

      return (
        <Input
          autoFocus={index === 0}
          value={value as string}
          className="w-96 border-none border-b-black ring-primary focus-visible:ring-1"
          onChange={onChange}
          onBlur={onBlur}
        />
      );
    },
  },
  {
    header: "Type",
    accessorKey: "type",
    cell: (props) => (
      <p className="w-36 text-wrap">{capitalize(props.row.original.type)}</p>
    ),
  },
];

function useSkipper() {
  const shouldSkipRef = React.useRef(true);
  const shouldSkip = shouldSkipRef.current;

  // Wrap a function with this to skip a pagination reset temporarily
  const skip = React.useCallback(() => {
    shouldSkipRef.current = false;
  }, []);

  React.useEffect(() => {
    shouldSkipRef.current = true;
  });

  return [shouldSkip, skip] as const;
}

const SchematicModelConfiguration: React.FC<ISchematicModelConfiguration> = ({
  schema,
  metadata,
  rag_config_id,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [tableResponse, setTableResponse] = useState<
    Partial<ISchemaTableConfig>
  >({});
  const [tablePreview] = useState<
    { [key: string]: string | number }[]
  >([]);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { addToTaskQueue, removeFromTaskQueue, task_queue } =
    useManageAdminStore((state) => state);

  const apiKey = useStore((state) => state.api_key);

  const {
    data: ragTable = {},
    isFetching: isFetchingTables,
    status,
  } = useQuery({
    queryKey: ["getRagTable", schema, rag_config_id, metadata?.database_id],
    queryFn: async () =>
      axios.get(
        `/v3/semantic_model/descriptions/${rag_config_id}/${metadata?.database_id}/${schema}`,
        {
          baseURL: BASE_URL,
          headers: { accept: "application/json", "x-api-key": apiKey },
        },
      ),
    select: (res: AxiosResponse) => res.data?.descriptions,
    enabled: !!schema && !!rag_config_id && !!metadata?.database_id,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

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

  const { mutateAsync: saveTableConfig } = useMutation({
    mutationKey: ["saveTableConfig", schema, rag_config_id],
    mutationFn: (input: {
      descriptions: Partial<ISchemaTableConfig>;
      table_preview: { [key: string]: string | number }[];
    }) =>
      axios.post(
        `/v3/semantic_model/save_documentation_task/${rag_config_id}/${schema}`,
        input,
        {
          baseURL: BASE_URL,
          headers: { "x-api-key": apiKey },
        },
      ),
  });

  const handleSave = async () => {
    try {
      toast({
        title: "Saving ...",
        description:
          "This might take a while, you can come back later to check status.",
      });
      setLoading(true);
      const res = await saveTableConfig({
        descriptions: tableResponse,
        table_preview: tablePreview,
      });
      addToTaskQueue(schema, res.data?.task_id);
      setTaskId(res.data?.task_id);
    } catch (error) {}
  };

  const table = useReactTable({
    data: useMemo(
      () => ragTable?.columns,
      [schema, rag_config_id, metadata?.database_id, ragTable?.columns?.length],
    ),
    columns,
    autoResetPageIndex,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnResizing: true,
    defaultColumn: {
      size: 50,
      minSize: 50,
      maxSize: 200,
    },
    meta: {
      updateData: (rowIndex, columnId, value) => {
        // Skip page index reset until after next rerender
        skipAutoResetPageIndex();
        console.log(rowIndex, columnId, value);
        setTableResponse({
          ...tableResponse,
          columns: tableResponse?.columns?.map((row, index) =>
            index === rowIndex ? { ...row, [columnId]: value } : row,
          ),
        });
      },
    },
  });

  useEffect(() => {
    if (status === "success") {
      setTableResponse(ragTable);
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (taskStatus?.status === "completed") {
      setTaskId(null);
      removeFromTaskQueue(schema);
      toast({
        title: "Saved the configuration",
        description: `Changes have been saved for ${taskStatus?.result?.added_table_name} table`,
      });
      setLoading(false);
      onSuccess();
    }

    if (taskStatus?.status === "failed") {
      toast({
        title: "Error",
        variant: "destructive",
        description: taskStatus?.result?.error?.length
          ? taskStatus?.result?.error
          : "Sorry! Your changes could not be saved. Please try again later.",
      });
      setTaskId(null);
      removeFromTaskQueue(schema);
      setLoading(false);
    }
  }, [taskStatus]);

  useEffect(() => {
    if (Boolean(task_queue?.[schema])) {
      setTaskId(task_queue?.[schema]);
    }
  }, [schema]);

  return (
    <div className="flex w-[60%] flex-col space-y-4 px-4">
      {isFetchingTables ? (
        <div className="grid h-full place-items-center rounded-lg text-sm">
          <div className="grid place-items-center">
            <Loader2 className="size-8 animate-spin" />
            <p>Getting tables ...</p>
          </div>
        </div>
      ) : !Boolean(schema) ? (
        <div className="grid h-full place-items-center">
          <div className="grid place-items-center gap-4 text-sm">
            <img src="/images/empty.svg" width={80} />
            <p>Select a schema to configure</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col space-y-2">
          <span>
            <p className="text-sm font-semibold">
              Semantic Model Configuration
            </p>
            <p className="text-xs text-muted-foreground">
              Edit table and column descriptions for better Agent responses
            </p>
          </span>
          <Separator className="mb-4" />
          <p className="text-sm font-semibold">{ragTable?.table_name}</p>
          <p
            autoFocus
            contentEditable
            className="rounded-md border border-primary p-1 text-sm"
            onInputCapture={(e) =>
              setTableResponse({
                ...tableResponse,
                table_description: e.currentTarget.innerText,
              })
            }
          >
            {ragTable?.table_description}
          </p>
          <Table containerClassname="h-fit h-[35rem] relative grow">
            <TableHeader className="sticky top-0 z-10 bg-white text-xs text-secondary-foreground">
              {table?.getHeaderGroups()?.map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup?.headers?.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{
                        width: header.index === 0 ? 50 : "auto",
                      }}
                    >
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
              {isFetchingTables ? (
                <TableRow className="h-[35rem]">
                  <TableCell colSpan={columns?.length} className="text-center">
                    <div className="grid place-items-center">
                      <Loader2 className="animate-spin" />
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : table?.getRowModel()?.rows?.length > 0 ? (
                table?.getRowModel()?.rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row?.getIsSelected() && "selected"}
                  >
                    {row?.getVisibleCells()?.map((cell) => (
                      <TableCell key={cell.id} className="text-wrap">
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
          <Separator />
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setPreviewVisible(true)}>
              Preview table
            </Button>
            <Button loading={loading} onClick={handleSave}>
              Save & Add to Semantic Data Model
            </Button>
          </div>
        </div>
      )}
      <PreviewTable
        open={previewVisible}
        onOpen={setPreviewVisible}
        schema={schema}
        metadata={metadata}
        rag_config_id={rag_config_id}
      />
    </div>
  );
};

export default SchematicModelConfiguration;
