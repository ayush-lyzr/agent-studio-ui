import { type ChangeEvent, type HTMLAttributes, forwardRef } from "react";
import { useDropzone } from "react-dropzone";
import { UploadIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import { Loader } from "lucide-react";

export interface UploadProps extends HTMLAttributes<HTMLDivElement> {
  multiple?: boolean;
  loading?: boolean;
  disabled?: boolean;
  acceptedFileFormats?: string[];
  onFilesDrop: (acceptedFiles: File[]) => void;
  handleBrowseFiles?: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

export const Upload = forwardRef<HTMLInputElement, UploadProps>(
  (
    {
      className,
      disabled,
      loading,
      acceptedFileFormats,
      onFilesDrop,
      handleBrowseFiles,
      ...props
    },
    ref,
  ) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: onFilesDrop,
      disabled: loading,
    });

    return (
      <div className="h-full space-y-2">
        <div
          {...props}
          {...getRootProps()}
          ref={ref}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "mt-1 flex w-full justify-center rounded-lg border-dashed bg-secondary px-4 py-8 outline-dashed outline-slate-300",
            className,
          )}
        >
          <div className="space-y-3 text-center">
            <UploadIcon className="mx-auto h-12 w-12 text-primary" />
            <div>
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer rounded-md font-medium focus-within:outline-none"
              >
                <p className="inline-flex gap-1 text-xs">
                  {loading
                    ? "Loading ..."
                    : isDragActive
                      ? `Drop the file${props.multiple ? "s" : ""} here ...`
                      : disabled
                        ? "Upload disabled"
                        : `Drag and drop your file${props.multiple ? "s" : ""} or `}
                  {loading ? (
                    <div className="grid place-items-center">
                      <Loader className="size-4 animate-spin" />
                    </div>
                  ) : (
                    <span
                      className={cn(
                        "cursor-pointer text-blue-600",
                        disabled && "cursor-not-allowed opacity-50",
                      )}
                    >
                      Browse file{props.multiple ? "s" : ""}
                    </span>
                  )}
                </p>
                <input
                  {...getInputProps()}
                  disabled={loading || disabled}
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  accept={acceptedFileFormats?.join(", ")}
                  className="sr-only"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    if (e.target.files) onFilesDrop(Array.from(e.target.files));
                  }}
                />
              </label>
            </div>
          </div>
        </div>
        <p className="text-sm text-secondary-foreground">
          Only supports {acceptedFileFormats?.join(", ")} files.
        </p>
      </div>
    );
  },
);
Upload.displayName = "Upload";
