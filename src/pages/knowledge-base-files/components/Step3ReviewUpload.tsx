import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import axios from "axios";
import { FileText, Globe, Type, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import useStore from "@/lib/store";
import {
  CRAWL_URL,
  isMixpanelActive,
  RAG_URL,
} from "@/lib/constants";
import {
  startCrawlJob,
  pollCrawlJob,
  getCrawledUrls,
  type CrawlJobStatus,
} from "./crawlApi";
import CrawlUrlSelection from "./CrawlUrlSelection";
import type { FormData, UploadMethod } from "./UploadWizard";
import mixpanel from "mixpanel-browser";

interface Step3ReviewUploadProps {
  form: UseFormReturn<FormData>;
  selectedMethod: UploadMethod | null;
  isGraphRag: boolean;
  data?: any;
  onBack: () => void;
  onReset: () => void;
  onSuccess?: () => void;
  onClose: () => void;
}

export default function Step3ReviewUpload({
  form,
  selectedMethod,
  isGraphRag,
  data,
  onBack,
  onReset,
  onSuccess,
  onClose,
}: Step3ReviewUploadProps) {
  const [loading, setLoading] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState<string>("");
  const [crawlJobId, setCrawlJobId] = useState<string>("");
  const [crawlResults, setCrawlResults] = useState<CrawlJobStatus | null>(null);
  const [showUrlSelection, setShowUrlSelection] = useState(false);
  // const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const { toast } = useToast();
  const apiKey = useStore((state) => state.api_key);
  const ragId = data?._id;

  const handleUrlSelectionConfirm = async (urls: string[],apiKey : string) => {
    // setSelectedUrls(urls);
    setShowUrlSelection(false);
    setLoading(true);

    try {
      setCrawlProgress(`Processing ${urls.length} selected pages...`);

      // For now, create mock content since we need another API to fetch actual content
      // In a real implementation, you'd call an API to fetch content for selected URLs
      const mockDocuments = urls.map((url) => ({
        text: `Content from ${url}`, // This would be replaced with actual content
        source: url,
      }));

      const urlPayload = {
        urls: urls,
      };

      const crawlUrlResponse = await axios.post(`/content`, urlPayload, {
        baseURL: CRAWL_URL,
        headers: { "x-api-key": apiKey },
      });

      if (mockDocuments.length > 0) {
        if (isGraphRag) {
          // Commented out for now as website is need to rework for knowledge graph
          // Process each URL with GraphRAG
          // const graphRagPromises = mockDocuments.map((content) => {
          //   const formData = new FormData();
          //   formData.append("text", content.text);
          //   formData.append("source", content.source);
          // const updatedPayload = crawlUrlResponse.data.results.map(
          //   (result: any) => ({
          //     text: result.markdown,
          //     source: result.url,
          //   }),
          // );
          // await axios.post(`/v4/knowledge_graph/neo4j/text/`, updatedPayload, {
          //   baseURL: RAG_URL,
          //   params: { rag_id: ragId },
          //   headers: { "x-api-key": apiKey },
          // });
          // await Promise.all(graphRagPromises);
        } else {
          const updatedPayload = crawlUrlResponse.data.results.map(
            (result: any) => ({
              text: result.markdown,
              source: result.url,
            }),
          );
          await axios.post(
            `/v3/train/text/`,
            { data: updatedPayload },
            {
              baseURL: RAG_URL,
              params: { rag_id: ragId },
              headers: {
                "x-api-key": apiKey,
                "Content-Type": "application/json",
              },
            },
          );
        }

        onClose();
        onReset();
        toast({
          title: "Upload Successful!",
          description: `Successfully processed ${urls.length} pages from website crawl.`,
        });

        onSuccess?.();
      }
    } catch (error) {
      console.error("URL processing error:", error);
      toast({
        title: "Processing Failed",
        description: "An error occurred while processing the selected URLs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setCrawlProgress("");
      setCrawlJobId("");
    }
  };

  const handleBackToCrawl = () => {
    setShowUrlSelection(false);
    setCrawlResults(null);
    setCrawlProgress("");
    setCrawlJobId("");
  };

  const getMethodInfo = () => {
    switch (selectedMethod) {
      case "files":
        const files = form.getValues("files") || [];
        return {
          icon: FileText,
          title: "File Upload",
          details: `${files.length} file${files.length !== 1 ? "s" : ""} selected`,
          items: files.map((f) => f.name),
        };
      case "website":
        const url = form.getValues("websiteUrl");
        const depth = form.getValues("depth");
        const maxUrls = form.getValues("maxUrls");
        const workers = form.getValues("workers");
        const delay = form.getValues("delay");
        const enableHeadless = form.getValues("enableHeadless");
        return {
          icon: Globe,
          title: "Website Crawling",
          details: `${url}`,
          items: [
            `Depth: ${depth || 2} levels`,
            `Max URLs: ${maxUrls || 1000}`,
            `Workers: ${workers || 10}`,
            `Delay: ${delay || "200ms"}`,
            enableHeadless ? "Headless browser enabled" : "Standard crawling",
          ],
        };
      case "text":
        const text = form.getValues("rawText");
        const charCount = text?.length || 0;
        return {
          icon: Type,
          title: "Raw Text",
          details: `${charCount.toLocaleString()} characters`,
          items: [text ? text.substring(0, 100) + "..." : ""],
        };
      default:
        return null;
    }
  };

  const onRagSubmit = async (values: FormData) => {
    try {
      const parseResponses = [];
      // const crawlPages = values.crawlPages || 1;
      // const crawlDepth = values.crawlDepth || 1;
      // const dynamicWait = values.dynamicWait || 5;

      // File uploads
      const fileUploadPromises = (values.files || [])
        .slice(0, 5)
        .map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);

          let endpoint = "";
          if (file.name.endsWith(".pdf")) {
            endpoint = "/v3/parse/pdf/";
            formData.append("data_parser", values.pdfParser);
          } else if (file.name.endsWith(".docx")) {
            endpoint = "/v3/parse/docx/";
          } else if (file.name.endsWith(".txt")) {
            endpoint = "/v3/parse/txt/";
          } else {
            console.warn(`Unsupported file type: ${file.name}`);
            return null;
          }

          const response = await axios.post(endpoint, formData, {
            baseURL: RAG_URL,
            headers: {
              "Content-Type": "multipart/form-data",
              "x-api-key": apiKey,
            },
          });

          return response.data;
        });

      const fileResponses = (await Promise.all(fileUploadPromises)).filter(
        Boolean,
      );
      parseResponses.push(...fileResponses);

      // Website crawling with new API
      const otherParsingPromises = [];
      if (values.websiteUrl) {
        const crawlRequest = {
          url: values.websiteUrl,
          depth: values.depth || 2,
          max_urls: values.maxUrls || 1000,
          workers: values.workers || 10,
          delay: values.delay || "200ms",
          enable_headless: values.enableHeadless ?? false,
          enable_html: values.enableHtml ?? true,
          enable_sitemap: values.enableSitemap ?? true,
          headless_timeout: values.headlessTimeout || 30,
          wait_for_js: values.waitForJs ?? true,
          chunk_size: values.chunkSize || 1000,
          chunk_overlap: values.chunkOverlap || 100,
        };

        try {
          // Handle crawling separately - don't add to promises yet
          setCrawlProgress("Starting website crawl...");

          const crawlJob = await startCrawlJob(crawlRequest, apiKey);
          setCrawlJobId(crawlJob.job_id);

          // Poll for completion
          const result = await pollCrawlJob(
            crawlJob.job_id,
            apiKey,
            (status: CrawlJobStatus) => {
              setCrawlProgress(status.progress || "Crawling...");
            },
          );

          // Get crawled URLs and show selection UI
          const crawledUrls = getCrawledUrls(result);
          setCrawlResults(result);
          setCrawlProgress(
            `✅ Crawl completed! Found ${crawledUrls.length} pages from ${result.result?.target_url || form.getValues("websiteUrl")}`,
          );

          if (crawledUrls.length > 0) {
            setShowUrlSelection(true);
            setLoading(false); // Stop loading to show URL selection
            return; // Exit early to show URL selection
          } else {
            throw new Error("No URLs found during crawl");
          }
        } catch (crawlError: any) {
          // Handle crawling errors specifically
          if (crawlError.response?.status === 401) {
            setCrawlProgress("❌ Authentication failed");
            throw new Error(
              "CRAWL_AUTH_ERROR: Invalid or missing API key for crawl service",
            );
          } else {
            setCrawlProgress("❌ Crawl failed");
            throw crawlError;
          }
        }
      }
      if (values.youtubeUrl) {
        const formData = new FormData();
        formData.append("urls", values.youtubeUrl);
        otherParsingPromises.push(
          axios
            .post(`/v3/parse/youtube/`, formData, {
              baseURL: RAG_URL,
              headers: { "x-api-key": apiKey },
            })
            .then((res) => res.data),
        );
      }
      if (values.rawText) {
        otherParsingPromises.push(
          axios
            .post(
              `/v3/train/text/`,
              {
                data: [
                  {
                    text: values.rawText,
                    source:
                      values.rawText.length > 50
                        ? values.rawText.slice(0, 50) + "..."
                        : values.rawText,
                  },
                ],
                chunk_size: values.chunkSize,
                chunk_overlap: values.chunkOverlap,
              },
              {
                baseURL: RAG_URL,
                params: { rag_id: ragId },
                headers: { "x-api-key": apiKey },
              },
            )
            .then((res) => res.data),
        );
      }

      const otherResponses = await Promise.all(otherParsingPromises);
      parseResponses.push(...otherResponses);

      // Process parsed documents
      const allDocuments = parseResponses.flatMap(
        (response) => response?.documents ?? [],
      );

      if (values.files && values.files.length > 0) {
        if (allDocuments.length > 0) {
          await axios.post(`v3/rag/train/${ragId}/`, allDocuments, {
            baseURL: RAG_URL,
            headers: { "x-api-key": apiKey },
          });
        } else {
          throw new Error("No documents found to process");
        }
      }
      onClose();
      toast({
        title: "Upload Successful!",
        description: "Your data has been successfully uploaded and processed.",
      });
      onReset();
      onSuccess?.();
    } catch (error: any) {
      console.error("Upload error:", error);

      // Check for CORS error
      if (error.code === "ERR_NETWORK" && error.message === "Network Error") {
        toast({
          title: "Connection Failed",
          description:
            "Cannot connect to crawl service. This may be a CORS issue or the service may be unavailable.",
          variant: "destructive",
        });
      } else if (error.message?.includes("CRAWL_AUTH_ERROR")) {
        toast({
          title: "Crawl Authentication Failed",
          description:
            "Invalid or missing API key for the crawl service. Please check your API key configuration.",
          variant: "destructive",
        });
      } else if (error.response?.status === 401) {
        toast({
          title: "Authentication Failed",
          description:
            "Invalid or missing API key. Please check your configuration.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Upload Failed",
          description:
            error.response?.data?.message ||
            error.message ||
            "An error occurred while processing your request.",
          variant: "destructive",
        });
      }
    }
  };

  const onGraphRagSubmit = async (values: FormData) => {
    try {
      const promises = [];
      // const crawlPages = values.crawlPages || 1;
      // const crawlDepth = values.crawlDepth || 1;
      // const dynamicWait = values.dynamicWait || 5;

      // File uploads
      const fileUploadPromises = (values.files || [])
        .slice(0, 5)
        .map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);

          return axios.post(`/v4/knowledge_graph/neo4j/`, formData, {
            baseURL: RAG_URL,
            params: { rag_id: ragId },
            headers: {
              "Content-Type": "multipart/form-data",
              "x-api-key": apiKey,
            },
          });
        });

      promises.push(...fileUploadPromises);

      // Website crawling with new API for GraphRAG
      if (values.websiteUrl) {
        const crawlRequest = {
          url: values.websiteUrl,
          depth: values.depth || 2,
          max_urls: values.maxUrls || 1000,
          workers: values.workers || 10,
          delay: values.delay || "200ms",
          enable_headless: values.enableHeadless ?? false,
          enable_html: values.enableHtml ?? true,
          enable_sitemap: values.enableSitemap ?? true,
          headless_timeout: values.headlessTimeout || 30,
          wait_for_js: values.waitForJs ?? true,
          chunk_size: values.chunkSize || 1000,
          chunk_overlap: values.chunkOverlap || 100,
        };

        try {
          // Handle crawling separately for GraphRAG too
          setCrawlProgress("Starting website crawl...");

          const crawlJob = await startCrawlJob(crawlRequest,apiKey);
          setCrawlJobId(crawlJob.job_id);

          // Poll for completion
          const result = await pollCrawlJob(
            crawlJob.job_id,
            apiKey,
            (status: CrawlJobStatus) => {
              setCrawlProgress(status.progress || "Crawling...");
            },
          );

          // Get crawled URLs and show selection UI
          const crawledUrls = getCrawledUrls(result);
          setCrawlResults(result);
          setCrawlProgress(
            `✅ Crawl completed! Found ${crawledUrls.length} pages from ${result.result?.target_url || form.getValues("websiteUrl")}`,
          );

          if (crawledUrls.length > 0) {
            setShowUrlSelection(true);
            setLoading(false); // Stop loading to show URL selection
            return; // Exit early to show URL selection
          } else {
            throw new Error("No URLs found during crawl");
          }
        } catch (crawlError: any) {
          // Handle crawling errors specifically for GraphRAG
          if (crawlError.response?.status === 401) {
            setCrawlProgress("❌ Authentication failed");
            throw new Error(
              "CRAWL_AUTH_ERROR: Invalid or missing API key for crawl service",
            );
          } else {
            setCrawlProgress("❌ Crawl failed");
            throw crawlError;
          }
        }
      }
      if (values.rawText) {
        const payload = {
          text: values.rawText,
          source:
            values.rawText.length > 50
              ? values.rawText.slice(0, 50) + "..."
              : values.rawText,
          rag_id: ragId,
        };

        promises.push(
          axios
            .post(`/v4/knowledge_graph/neo4j/text/`, payload, {
              baseURL: RAG_URL,
              params: { rag_id: ragId },
              headers: { "x-api-key": apiKey },
            })
            .then((res) => res.data),
        );
      }

      if (promises.length > 0) {
        await Promise.all(promises);
        onClose();

        toast({
          title: "Upload Successful!",
          description:
            "Your data has been successfully uploaded and processed.",
        });
        onReset();
        onSuccess?.();
      } else {
        throw new Error("No documents found to process");
      }
    } catch (error: any) {
      console.error("Upload error:", error);

      // Check for CORS error
      if (error.code === "ERR_NETWORK" && error.message === "Network Error") {
        toast({
          title: "Connection Failed",
          description:
            "Cannot connect to crawl service. This may be a CORS issue or the service may be unavailable.",
          variant: "destructive",
        });
      } else if (error.message?.includes("CRAWL_AUTH_ERROR")) {
        toast({
          title: "Crawl Authentication Failed",
          description:
            "Invalid or missing API key for the crawl service. Please check your API key configuration.",
          variant: "destructive",
        });
      } else if (error.response?.status === 401) {
        toast({
          title: "Authentication Failed",
          description:
            "Invalid or missing API key. Please check your configuration.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Upload Failed",
          description:
            error.response?.data?.message ||
            error.message ||
            "An error occurred while processing your request.",
          variant: "destructive",
        });
      }
    }
  };

  const onSubmit = async (values: FormData) => {
    toast({
      title: "Upload in progress",
      description: "It may take some time to process and add your files.",
      duration: Infinity,
    });
    setLoading(true);

    try {
      if (isGraphRag) {
        await onGraphRagSubmit(values);
      } else {
        await onRagSubmit(values);
      }
    } finally {
      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
        mixpanel.track(`${selectedMethod} upload clicked`);
      setLoading(false);
      setCrawlProgress("");
      setCrawlJobId("");
    }
  };

  const methodInfo = getMethodInfo();

  if (!methodInfo) {
    return null;
  }

  // Show URL selection if crawl is completed and URLs are available
  if (showUrlSelection && crawlResults && selectedMethod === "website") {
    const crawledUrls = getCrawledUrls(crawlResults);
    const crawlStats = {
      totalUrls: crawlResults.result?.total_urls || crawledUrls.length,
      duration: crawlResults.result?.duration || "Unknown",
      urlsPerSecond: crawlResults.result?.urls_per_second || "0",
      targetUrl:
        crawlResults.result?.target_url || form.getValues("websiteUrl") || "",
    };

    return (
      <CrawlUrlSelection
        urls={crawledUrls}
        crawlStats={crawlStats}
        onSelectionConfirm={(urls : string[]) => handleUrlSelectionConfirm(urls, apiKey)}
        onBack={handleBackToCrawl}
      />
    );
  }

  const Icon = methodInfo.icon;

  return (
    <div className="flex h-full max-h-full flex-col gap-2 overflow-hidden pt-1">
      <Card className="flex-1 space-y-4 overflow-y-auto pr-2">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{methodInfo.title}</CardTitle>
              <CardDescription className="text-sm">
                {methodInfo.details}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {methodInfo.items.map((item, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-4 w-4 flex-shrink-0 text-success" />
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Crawl Progress */}
      {crawlProgress && (
        <div
          className={`rounded-lg p-4 ${
            crawlProgress.includes("✅")
              ? "bg-green-50 dark:bg-green-950/50"
              : "bg-blue-50 dark:bg-blue-950/50"
          }`}
        >
          <div className="flex items-center space-x-3">
            {crawlProgress.includes("✅") ? (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600">
                <span className="text-xs text-white">✓</span>
              </div>
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            )}
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  crawlProgress.includes("✅")
                    ? "text-green-900 dark:text-green-100"
                    : "text-blue-900 dark:text-blue-100"
                }`}
              >
                {crawlProgress.includes("✅")
                  ? "Website Crawling Completed"
                  : "Website Crawling in Progress"}
              </p>
              <p
                className={`mt-1 text-xs ${
                  crawlProgress.includes("✅")
                    ? "text-green-700 dark:text-green-300"
                    : "text-blue-700 dark:text-blue-300"
                }`}
              >
                {crawlProgress}
              </p>
              {crawlJobId && (
                <p
                  className={`mt-1 text-xs ${
                    crawlProgress.includes("✅")
                      ? "text-green-600 dark:text-green-400"
                      : "text-blue-600 dark:text-blue-400"
                  }`}
                >
                  Job ID: {crawlJobId}
                </p>
              )}
            </div>
          </div>

          {/* Show crawled URLs list when completed */}
          {crawlProgress.includes("✅") && crawlResults && (
            <div className="mt-4 border-t border-green-200 pt-4 dark:border-green-800">
              <p className="mb-2 text-sm font-medium text-green-900 dark:text-green-100">
                Crawled URLs Found:
              </p>
              <div className="max-h-32 overflow-y-auto rounded bg-green-100 p-2 dark:bg-green-900/30">
                <div className="space-y-1 text-xs">
                  {getCrawledUrls(crawlResults)
                    .slice(0, 10)
                    .map((url, index) => (
                      <div
                        key={index}
                        className="text-green-700 dark:text-green-300"
                      >
                        {index + 1}. {url}
                      </div>
                    ))}
                  {getCrawledUrls(crawlResults).length > 10 && (
                    <div className="italic text-green-600 dark:text-green-400">
                      ... and {getCrawledUrls(crawlResults).length - 10} more
                      URLs
                    </div>
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                Select pages to add to your knowledge base below ↓
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={loading}
        >
          ← Back
        </Button>
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onReset}
            disabled={loading}
          >
            Reset
          </Button>
          <Button
            type="button"
            onClick={() => onSubmit(form.getValues())}
            loading={loading}
            disabled={loading}
          >
            {loading
              ? crawlProgress
                ? "Processing..."
                : selectedMethod === "files"
                  ? "Uploading..."
                  : selectedMethod === "website"
                    ? "Crawling..."
                    : "Adding..."
              : selectedMethod === "files"
                ? "Upload Files"
                : selectedMethod === "website"
                  ? "Crawl Website"
                  : "Add Text"}
          </Button>
        </div>
      </div>
    </div>
  );
}
