import axios from "axios";
import { CRAWL_URL } from "@/lib/constants";

export interface CrawlRequest {
  url: string;
  depth: number;
  max_urls: number;
  workers: number;
  delay: string;
  enable_headless: boolean;
  enable_html: boolean;
  enable_sitemap: boolean;
  headless_timeout: number;
  wait_for_js: boolean;
  job_id?: string;
}

export interface CrawlJobResponse {
  job_id: string;
  status: "accepted" | "running" | "completed" | "failed";
  message: string;
}

export interface CrawlJobStatus {
  id: string;
  status: "accepted" | "running" | "completed" | "failed";
  progress: string;
  result?: {
    id: string;
    target_url: string;
    crawled_at: string;
    duration: string;
    total_urls: number;
    urls_per_second: string;
    settings: {
      workers: number;
      delay: string;
      depth: number;
    };
    urls:
      | string[]
      | Array<{
          url: string;
          status_code: number;
          content?: string;
          title?: string;
          description?: string;
          keywords?: string;
          html?: string;
        }>
      | null;
  };
  created_at: string;
  updated_at: string;
  request: CrawlRequest;
}

export const startCrawlJob = async (
  request: CrawlRequest,
  apiKey : string,
): Promise<CrawlJobResponse> => {
  const jobId = `crawl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const payload = {
    ...request,
    job_id: jobId,
  };

  try {
    const response = await axios.post(`${CRAWL_URL}/crawl`, payload, {
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Crawl job started successfully:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Crawl job failed:", {
      error: error.response?.data || error.message,
      status: error.response?.status,
    });
    throw error;
  }
};

export const getCrawlJobStatus = async (
  jobId: string,
  apiKey : string
): Promise<CrawlJobStatus> => {
  const response = await axios.get(`${CRAWL_URL}/jobs/${jobId}`, {
    headers: {
      "X-API-Key": apiKey,
    },
  });

  return response.data;
};

export const pollCrawlJob = async (
  jobId: string,
  apiKey : string,
  onProgress?: (status: CrawlJobStatus) => void,
  timeoutMs: number = 300000, // 5 minutes default timeout
): Promise<CrawlJobStatus> => {
  const startTime = Date.now();
  const pollInterval = 2000; // Poll every 2 seconds

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        if (Date.now() - startTime > timeoutMs) {
          reject(new Error("Crawl job timed out"));
          return;
        }

        const status = await getCrawlJobStatus(jobId,apiKey);

        if (onProgress) {
          onProgress(status);
        }

        if (status.status === "completed") {
          resolve(status);
        } else if (status.status === "failed") {
          reject(new Error(`Crawl job failed: ${status.progress}`));
        } else {
          // Job is still running, continue polling
          setTimeout(poll, pollInterval);
        }
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
};

export const getCrawledUrls = (crawlResult: CrawlJobStatus): string[] => {
  if (!crawlResult.result?.urls) {
    return [];
  }

  // Handle both string array and object array formats
  if (
    Array.isArray(crawlResult.result.urls) &&
    crawlResult.result.urls.length > 0
  ) {
    if (typeof crawlResult.result.urls[0] === "string") {
      return crawlResult.result.urls as string[];
    } else {
      return (crawlResult.result.urls as Array<{ url: string }>).map(
        (item) => item.url,
      );
    }
  }

  return [];
};

export const extractCrawlContent = (
  crawlResult: CrawlJobStatus,
): Array<{ text: string; source: string }> => {
  if (!crawlResult.result?.urls) {
    return [];
  }

  if (
    Array.isArray(crawlResult.result.urls) &&
    crawlResult.result.urls.length > 0
  ) {
    if (typeof crawlResult.result.urls[0] === "string") {
      // URLs are just strings, no content yet
      return [];
    } else {
      // URLs are objects with content
      return (
        crawlResult.result.urls as Array<{
          url: string;
          content?: string;
          html?: string;
        }>
      )
        .filter((url) => url.content || url.html)
        .map((url) => ({
          text: url.content || url.html || "",
          source: url.url,
        }));
    }
  }

  return [];
};

// New function to fetch content for selected URLs
export const fetchUrlContent = async (): Promise<
  Array<{ text: string; source: string }>
> => {
  // This would need to be implemented based on your content fetching API
  // For now, return empty array as placeholder
  return [];
};
