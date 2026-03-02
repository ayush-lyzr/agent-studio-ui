import "@tanstack/react-table";
import { RowData } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    updateData?: (rowIndex: number, columnId: string, value: unknown) => void;
    setSchema?: (schema: string) => void;
    rag_config_id?: string;
    onSuccess?: () => void;
  }
}
