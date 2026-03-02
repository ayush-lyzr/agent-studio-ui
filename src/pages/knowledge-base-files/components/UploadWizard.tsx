import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { DEFAULT_MAX_FILE_SIZE_DAG } from "@/lib/constants";
import FileUploadConfig from "./FileUploadConfig";
import WebsiteCrawlConfig from "./WebsiteCrawlConfig";
import RawTextConfig from "./RawTextConfig";
import Step3ReviewUpload from "./Step3ReviewUpload";

export type UploadMethod = "files" | "website" | "text";

const formSchema = z.object({
  files: z
    .array(z.instanceof(File))
    .max(5, { message: "Maximum 5 files allowed" })
    .optional(),
  pdfParser: z.enum(["llmsherpa", "pypdf"]).default("llmsherpa"),
  websiteUrl: z
    .string()
    .trim()
    .min(1, { message: "Website URL is required" })
    .url({ message: "Please enter a valid website URL" })
    .refine((val) => /^https?:\/\/.+$/i.test(val), {
      message: "URL must start with http:// or https://",
    })
    .optional(),
  // New crawl parameters
  depth: z.number().min(1).max(10).default(2),
  maxUrls: z.number().min(1).max(10000).default(1000),
  workers: z.number().min(1).max(50).default(10),
  delay: z.string().default("200ms"),
  enableHeadless: z.boolean().default(false),
  enableHtml: z.boolean().default(true),
  enableSitemap: z.boolean().default(true),
  headlessTimeout: z.number().min(5).max(120).default(30),
  waitForJs: z.boolean().default(true),
  chunkSize: z.number().optional(),
  chunkOverlap: z.number().optional(),
  // Keep old parameters for backward compatibility
  crawlPages: z.number().optional(),
  crawlDepth: z.number().optional(),
  dynamicWait: z.number().optional(),
  youtubeUrl: z.union([z.string().url(), z.string().max(0)]).optional(),
  rawText: z.string().optional(),
});

export type FormData = z.infer<typeof formSchema>;

interface UploadWizardProps {
  open: boolean;
  isGraphRag?: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  data?: any;
  onSuccess?: () => void;
  maxFileSize?: number;
  stepCount?: number;
  method?: UploadMethod;
}

export default function UploadWizard({
  open,
  isGraphRag = false,
  onOpenChange,
  data,
  onSuccess,
  maxFileSize = DEFAULT_MAX_FILE_SIZE_DAG * 1024 * 1024,
  stepCount = 1,
  method,
}: UploadWizardProps) {
  const [currentStep, setCurrentStep] = useState(stepCount);
  const [selectedMethod, setSelectedMethod] = useState(method || null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      files: [],
      pdfParser: "llmsherpa",
      websiteUrl: "",
      // New crawl parameters
      depth: 2,
      maxUrls: 1000,
      workers: 10,
      delay: "200ms",
      enableHeadless: false,
      enableHtml: true,
      enableSitemap: true,
      headlessTimeout: 30,
      waitForJs: true,
      chunkSize: 1000,
      chunkOverlap: 100,
      // Old parameters for backward compatibility
      crawlPages: 1,
      crawlDepth: 1,
      dynamicWait: 5,
      youtubeUrl: "",
      rawText: "",
      ...data,
    },
  });

  useEffect(() => {
    if (method) {
      setSelectedMethod(method);
    }
  }, [method]);

  const getDialogContent = () => {
    if (currentStep === 1) {
      return {
        title: "Choose Upload Method",
        description: "Select the input method for your data source.",
      };
    }

    if (currentStep === 2) {
      switch (selectedMethod) {
        case "files":
          return {
            title: "Upload Files",
            description: "Upload your documents (PDF, TXT, DOCX) for analysis.",
          };
        case "website":
          return {
            title: "Website Crawling",
            description: "Provide a website URL to crawl and extract content.",
          };
        case "text":
          return {
            title: "Raw Text Input",
            description: "Paste raw text you want to process.",
          };
        default:
          return { title: "", description: "" };
      }
    }

    if (currentStep === 3) {
      return {
        title: "Review & Upload",
        description: "Review your configuration and start the upload process",
      };
    }

    return { title: "", description: "" };
  };

  const { title, description } = getDialogContent();

  // const handleMethodSelect = (method: UploadMethod) => {
  //   setSelectedMethod(method);
  //   setCurrentStep(2);
  // };

  const handleBack = () => {
    if (currentStep === 3) {
      setCurrentStep(2);
    }
  };

  const handleContinue = () => {
    if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handleReset = () => {
    form.reset({
      files: [],
      pdfParser: "llmsherpa",
      websiteUrl: "",
      // New crawl parameters
      depth: 2,
      maxUrls: 1000,
      workers: 10,
      delay: "200ms",
      enableHeadless: false,
      enableHtml: true,
      enableSitemap: true,
      headlessTimeout: 30,
      waitForJs: true,
      chunkSize: 1000,
      chunkOverlap: 100,
      // Old parameters
      crawlPages: 1,
      crawlDepth: 1,
      dynamicWait: 5,
      youtubeUrl: "",
      rawText: "",
    });
    setCurrentStep(2);
  };

  const handleDialogChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      // Reset wizard when dialog closes
      handleReset();
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return;
      case 2:
        if (!selectedMethod) return null;
        switch (selectedMethod) {
          case "files":
            return (
              <FileUploadConfig
                form={form}
                maxFileSize={maxFileSize}
                onContinue={handleContinue}
              />
            );
          case "website":
            return (
              <WebsiteCrawlConfig form={form} onContinue={handleContinue} />
            );
          case "text":
            return <RawTextConfig form={form} onContinue={handleContinue} />;
          default:
            return null;
        }
      case 3:
        return (
          <Step3ReviewUpload
            form={form}
            selectedMethod={selectedMethod}
            isGraphRag={isGraphRag}
            data={data}
            onBack={handleBack}
            onReset={handleReset}
            onSuccess={onSuccess}
            onClose={() => onOpenChange(false)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogTrigger />
        <DialogContent
          className="top-[50%] flex max-h-[90vh] max-w-2xl flex-col !rounded-xl"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
            {/* <WizardSteps currentStep={currentStep as 1} /> */}
          </DialogHeader>
          <div className="min-h-0 flex-1">{renderCurrentStep()}</div>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
