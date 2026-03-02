import { Dispatch, SetStateAction } from "react";
import UploadWizard from "./components/UploadWizard";
import { DEFAULT_MAX_FILE_SIZE_DAG } from "@/lib/constants";

export default function UploadFile({
  open,
  isGraphRag = false,
  onOpenChange,
  data,
  onSuccess,
  maxFileSize = DEFAULT_MAX_FILE_SIZE_DAG * 1024 * 1024,
}: {
  open: boolean;
  isGraphRag?: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  data?: any;
  onSuccess?: () => void;
  maxFileSize?: number;
}) {
  return (
    <UploadWizard
      open={open}
      isGraphRag={isGraphRag}
      onOpenChange={onOpenChange}
      data={data}
      onSuccess={onSuccess}
      maxFileSize={maxFileSize}
    />
  );
}
