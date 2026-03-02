import { UseFormReturn } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LabelWithTooltip from "@/components/custom/label-with-tooltip";
import {
  DEFAULT_MAX_FILE_SIZE_DAG,
  KB_UPLOAD_DISCLAIMER_ONE,
  KB_UPLOAD_DISCLAIMER_TWO,
} from "@/lib/constants";
import type { FormData } from "./UploadWizard";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";

interface FileUploadConfigProps {
  form: UseFormReturn<FormData>;
  maxFileSize: number;
  onContinue: () => void;
}

export default function FileUploadConfig({
  form,
  maxFileSize,
  onContinue,
}: FileUploadConfigProps) {
  const { toast } = useToast();

  const watchPdfParser = form.watch("pdfParser");
  useEffect(() => {
    if (watchPdfParser === "pypdf") {
      if (form.getValues("chunkSize") === undefined) {
        form.setValue("chunkSize", 1000);
      }
      if (form.getValues("chunkOverlap") === undefined) {
        form.setValue("chunkOverlap", 100);
      }
    } else {
      form.setValue("chunkSize", undefined);
      form.setValue("chunkOverlap", undefined);
    }
  }, [watchPdfParser, form]);

  const onDrop = (acceptedFiles: File[]) => {
    const existingFiles = form.getValues("files") || [];
    const mergedFiles = [...existingFiles, ...acceptedFiles];
    if (mergedFiles.length > 5) {
      toast({
        title: "Upload error",
        description: "You can only upload up to 5 files",
        variant: "destructive",
      });
      return;
    }
    const fileMap = new Map<string, File>();
    mergedFiles.forEach((file) => {
      fileMap.set(file.name, file);
    });
    const uniqueFiles = Array.from(fileMap.values()).slice(0, 5);
    form.setValue("files", uniqueFiles);
  };

  const handleRemoveFile = (index: number) => {
    const files = form.getValues("files") || [];
    const newFiles = [...files];
    newFiles.splice(index, 1);
    form.setValue("files", newFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: (fileRejections) => {
      fileRejections.forEach((rejection) => {
        rejection.errors.forEach((e) => {
          toast({
            title: "Upload error",
            description: `${e.message}`,
            variant: "destructive",
          });
        });
      });
    },
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 5,
    validator: (file) => {
      if (file.size > maxFileSize) {
        return {
          code: "large-file",
          message: `File is larger than ${DEFAULT_MAX_FILE_SIZE_DAG} MB`,
        };
      }
      return null;
    },
  });

  const hasPdfFiles = (files: File[] | undefined) => {
    return (
      files?.some((file) => file.name.toLowerCase().endsWith(".pdf")) ?? false
    );
  };

  const files = form.watch("files");
  const canContinue = files && files.length > 0;

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="files"
        render={({ field }) => (
          <FormItem>
            <LabelWithTooltip tooltip="Upload PDF, DOCX, or TXT files (max 5 files)">
              File Upload (.pdf, .docx, .txt)
            </LabelWithTooltip>
            <FormControl>
              <div {...getRootProps()} className="dropzone">
                <input {...getInputProps()} />
                <div className="cursor-pointer rounded-md border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:border-primary/50">
                  {isDragActive ? (
                    <p className="text-primary">Drop the files here...</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-lg">📁</p>
                      <p className="font-medium">
                        Drag & drop up to 5 files here
                      </p>
                      <p className="text-sm text-muted-foreground">
                        or click to select files
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports PDF, DOCX, TXT files
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </FormControl>
            {field.value && field.value.length > 0 && (
              <div className="space-y-4">
                <div className="rounded-md bg-muted/50 p-4">
                  <h4 className="mb-2 text-sm font-medium">Selected Files:</h4>
                  <ul className="space-y-2">
                    {field.value.map((file, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between rounded bg-background px-3 py-2"
                      >
                        <span className="mr-2 truncate text-sm">
                          {file.name}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 justify-center p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>

                {hasPdfFiles(field.value) && (
                  <FormField
                    control={form.control}
                    name="pdfParser"
                    render={({ field }) => (
                      <FormItem>
                        <LabelWithTooltip tooltip="If PDF parsing fails with one parser, try the other">
                          PDF Parser
                        </LabelWithTooltip>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select PDF parser" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="llmsherpa">LLMSherpa</SelectItem>
                            <SelectItem value="pypdf">PyPDF</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        {watchPdfParser === "pypdf" && (
                          <>
                            <FormField
                              control={form.control}
                              name="chunkSize"
                              defaultValue={1000}
                              render={({ field }) => (
                                <FormItem>
                                  <LabelWithTooltip
                                    tooltip="The maximum number of tokens in each split segment of text. 
                                  Larger chunks keep more context together but may be harder to process."
                                  >
                                    Chunk size
                                  </LabelWithTooltip>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="1000"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                      value={
                                        watchPdfParser === "pypdf"
                                          ? (field.value ?? 1000)
                                          : field.value
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="chunkOverlap"
                              defaultValue={100}
                              render={({ field }) => (
                                <FormItem>
                                  <LabelWithTooltip
                                    tooltip="The number of tokens repeated between consecutive chunks. 
                                  Overlap helps maintain context continuity across splits."
                                  >
                                    Chunk overlap
                                  </LabelWithTooltip>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      value={
                                        watchPdfParser === "pypdf"
                                          ? (field.value ?? 100)
                                          : field.value
                                      }
                                      placeholder="100"
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="text-xxs text-muted-foreground">
        <p>{KB_UPLOAD_DISCLAIMER_ONE}</p>
        <p>{KB_UPLOAD_DISCLAIMER_TWO}</p>
      </div>

      <div className="flex justify-end pt-4">
        {/* <Button type="button" variant="outline" onClick={onBack}>
          ← Back
        </Button> */}
        <Button type="button" onClick={onContinue} disabled={!canContinue}>
          Continue →
        </Button>
      </div>
    </div>
  );
}
