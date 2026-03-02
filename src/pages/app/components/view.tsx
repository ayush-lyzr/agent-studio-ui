import React, { useState, useEffect, useRef } from "react";
// import ReactMarkdown from "react-markdown";
import axios, { AxiosError } from "axios";
import { useParams } from "react-router-dom";
// import rehypeRaw from "rehype-raw";
import { useAuth } from "@/contexts/AuthContext";
import mixpanel from "mixpanel-browser";
// import TypingAnimation from "@/components/ui/loading-typing-lottie";
import thinking from "../../../assets/thinking.gif";

import ActivityAccordian from "./activity";
// import { DownloadIcon, CopyIcon, Share2Icon } from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Skeleton } from "@/components/ui/skeleton";
import useStore from "@/lib/store";
import { isMixpanelActive, MARKETPLACE_URL } from "@/lib/constants";
import MarkdownRenderer from "@/components/custom/markdown";

function SafeHTMLContent({ htmlContent }: { htmlContent: any }) {
  const ref = useRef(null) as any;

  useEffect(() => {
    if (ref.current && htmlContent) {
      ref.current.innerHTML = htmlContent;
    }
  }, [htmlContent]);

  return (
    <div>
      <div ref={ref} className="mt-10" />
    </div>
  );
}

interface AgentData {
  name: string;
  description: string;
  creator: string;
  agent_id: string;
}

interface LogData {
  content: string;
  module: string;
}

interface Activity {
  session_id: string;
  time_stamp: string;
  log_data: LogData;
  user_id: string;
}

function extractFullHTML(input: any): string {
  const inputString = typeof input === "string" ? input : String(input);
  const htmlRegex = /<html[^>]*>[\s\S]*<\/html>/i;
  const match = inputString.match(htmlRegex);
  return match ? match[0] : "";
}

function removeHTML(input: string): string {
  const htmlTagPattern = /<([^>\s\/]+)[^>]*>/;
  const firstTagMatch = input.match(htmlTagPattern);

  if (!firstTagMatch) {
    return input; // No HTML tag found, return the original string
  }

  const firstTag = firstTagMatch[1];
  const firstTagIndex = firstTagMatch.index!;
  let closingTagPattern = new RegExp(`</${firstTag}>`, "i");
  let closingTagIndex = input.search(closingTagPattern);

  // Handling self-closing tags
  if (input[firstTagIndex + firstTagMatch[0].length - 2] === "/") {
    return (
      input.slice(0, firstTagIndex) +
      input.slice(firstTagIndex + firstTagMatch[0].length)
    );
  }

  let nestedLevel = 0;
  let currentIndex = firstTagIndex + firstTagMatch[0].length;

  while (currentIndex < input.length) {
    const nextOpeningTagMatch = input
      .slice(currentIndex)
      .match(new RegExp(`<${firstTag}[^>]*>`, "i"));
    const nextClosingTagMatch = input
      .slice(currentIndex)
      .match(closingTagPattern);

    if (
      nextClosingTagMatch &&
      (!nextOpeningTagMatch ||
        nextClosingTagMatch.index! < nextOpeningTagMatch.index!)
    ) {
      if (nestedLevel === 0) {
        closingTagIndex =
          currentIndex +
          nextClosingTagMatch.index! +
          nextClosingTagMatch[0].length;
        break;
      } else {
        nestedLevel--;
        currentIndex +=
          nextClosingTagMatch.index! + nextClosingTagMatch[0].length;
      }
    } else if (nextOpeningTagMatch) {
      nestedLevel++;
      currentIndex +=
        nextOpeningTagMatch.index! + nextOpeningTagMatch[0].length;
    } else {
      // No more matching tags found
      break;
    }
  }

  return input.slice(0, firstTagIndex) + input.slice(closingTagIndex);
}

export function generateSessionId(): string {
  // Generates a random session ID using crypto
  return crypto.randomUUID();
}

const sessionId = generateSessionId();
const userId = generateSessionId();

const TwoColumnPage: React.FC = () => {
  const { app_id } = useParams<{ app_id: string }>();
  const { getToken } = useAuth();
  const token = getToken();
  const [markdown, setMarkdown] = useState<string>("");
  const [responseContent, setResponseContent] = useState<string>("");
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [appData, setAppData] = useState<AgentData | null>(null);
  const [activeTab, setActiveTab] = useState<"response" | "activity">(
    "response",
  );
  const [activities, setActivities] = useState<Activity[]>([]);
  const [agent_id, setAgentId] = useState("");
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const apiKey = useStore((state) => state.api_key);

  const handleExpandClick = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        const response = await axios.get<AgentData>(`/app/${app_id}`, {
          baseURL: MARKETPLACE_URL,
          headers: { Authorization: `Bearer ${token}` },
        });
        setAppData(response.data);
        if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
          mixpanel.track(`App page visited`, {
            app: response.data,
          });
        setAgentId(response.data!.agent_id);
      } catch (error) {
        console.error("Error fetching agent data:", error);
      }
    };

    fetchAgentData();
  }, [agent_id]);

  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;

    const fetchActivities = async () => {
      if (!agent_id) return;
      try {
        const response = await axios.get<Activity[]>(
          `${import.meta.env.VITE_BASE_URL}/v2/activities`,
          {
            params: {
              user_id: `${userId}`,
              session_id: `${sessionId}`,
            },
            headers: {
              "x-api-key": apiKey,
            },
          },
        );
        if (response.data.length > activities.length) {
          setActivities(response.data);
          setActiveTab("activity");
        }
      } catch (error) {
        console.error("Error fetching activities:", error);
      }
    };

    if (isPolling) {
      fetchActivities(); // Fetch immediately when polling starts
      pollingInterval = setInterval(fetchActivities, 3000); // Poll every 3 seconds

      // Set a timeout to stop polling after 5 minutes
      pollingTimeoutRef.current = setTimeout(
        () => {
          setIsPolling(false);
        },
        5 * 60 * 1000,
      ); // 5 minutes in milliseconds
    }

    return () => {
      clearInterval(pollingInterval);
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, [agent_id, isPolling, activities]);

  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdown(e.target.value);
  };

  const handleSubmit = async () => {
    if (!agent_id) {
      setResponseContent("Error: agent_id is missing in the URL.");
      return;
    }

    setLoading(true);
    setResponseContent("");
    setIsPolling(true);
    setActiveTab("response");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/v3/inference/chat/`,
        {
          user_id: userId,
          agent_id: agent_id,
          session_id: sessionId,
          message: markdown,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
        },
      );
      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
        mixpanel.track(`App chat`, {
          data: response.data,
          query: markdown,
        });
      setLoading(false);

      const fullHTML = extractFullHTML(response.data.response);
      const cleanMarkdown = removeHTML(response.data.response);

      let markdownIndex = 0;
      let htmlIndex = 0;

      const streamInterval = setInterval(() => {
        const chunkSize = 5; // Reveal 5 characters at a time
        let newMarkdownContent = "";
        let newHtmlContent = "";

        if (markdownIndex < cleanMarkdown.length) {
          newMarkdownContent = cleanMarkdown.slice(
            0,
            markdownIndex + chunkSize,
          );
          setResponseContent(newMarkdownContent);
          markdownIndex += chunkSize;
          setActiveTab("response");
        }

        if (htmlIndex < fullHTML.length) {
          newHtmlContent = fullHTML.slice(0, htmlIndex + chunkSize);
          setHtmlContent(newHtmlContent);
          htmlIndex += chunkSize;
        }

        if (
          markdownIndex >= cleanMarkdown.length &&
          htmlIndex >= fullHTML.length
        ) {
          clearInterval(streamInterval);
        }
      }, 50); // Increased interval to 50ms for more noticeable streaming
    } catch (error: any) {
      console.error("Error sending message:", error);
      if (error instanceof AxiosError) {
        if (error.response?.status === 429) {
          setResponseContent(
            `## **Insufficient credits**\nUpgrade you plan or purchase additional credits to continue: [View Pricing and Plans](/upgrade-plan)`,
          );
        } else {
          setResponseContent(error?.response?.data?.detail);
        }
      }
      setLoading(false);
      setIsPolling(false);
    }
  };

  // function escapeHtml(html: any) {
  //     return html
  //         .replace(/&/g, '&amp;')    // Escape &
  //         .replace(/</g, '&lt;')     // Escape <
  //         .replace(/>/g, '&gt;')     // Escape >
  //         .replace(/"/g, '&quot;')   // Escape "
  //         .replace(/'/g, '&#039;');  // Escape '
  // }

  return (
    <div className="flex h-screen flex-col bg-background md:flex-row">
      <div className="relative w-full border-r p-8 md:w-1/2">
        <div className="flex flex-col rounded-xl border border-input bg-background/80">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">
                Powered by{" "}
                <a
                  href="https://www.avanade.com/en-gb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sidebar-ring underline"
                >
                  Avanade Agent Studio
                </a>{" "}
              </span>
            </div>
            <div className="mt-2 text-4xl font-semibold">
              {appData?.name || <Skeleton className="h-9 w-[250px]" />}
            </div>
            {appData ? (
              <div className="mt-4 text-muted-foreground">
                {appData.description.length > 500 && !isExpanded
                  ? `${appData.description.substring(0, 500)}... `
                  : `${appData.description} `}
                {appData.description.length > 500 && (
                  <span
                    onClick={handleExpandClick}
                    className="cursor-pointer text-sidebar-ring underline"
                  >
                    {isExpanded ? "Read less" : "Read more"}
                  </span>
                )}
              </div>
            ) : (
              <Skeleton className="h-4 w-[300px]" />
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              Created by{" "}
              <span className="font-semibold">
                {appData?.creator || (
                  <Skeleton className="inline-block h-4 w-[100px]" />
                )}
              </span>
            </p>
          </div>
          <div className="mb-5 flex flex-grow flex-col px-6">
            <Textarea
              className="mb-4 h-40 flex-grow resize-none"
              placeholder="Ask your query..."
              value={markdown}
              onChange={handleMarkdownChange}
            />
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Thinking..." : "Submit"}
            </Button>
          </div>
          {/* <div className="mb-5 ml-7 flex items-center justify-between">
            <div className="flex items-center">
              <span className="mr-2 text-lg">Built on</span>
              <LyzrLogo className="mr-1 size-6" />
              <LyzrLogoText className="size-9" />
            </div>
          </div> */}
        </div>
      </div>

      <div className="w-full overflow-auto p-8 md:w-1/2">
        <Tabs
          value={activeTab}
          onValueChange={(value: string) =>
            setActiveTab(value as "response" | "activity")
          }
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="response">Response</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="response">
            <div className="rounded-xl border border-input">
              <div className="p-6 pt-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center">
                    <img
                      src={thinking}
                      alt="Thinking"
                      className="h-32 w-32 opacity-50"
                    />
                    <p className="mt-4 text-muted-foreground">
                      I am thinking...
                    </p>
                  </div>
                ) : responseContent ? (
                  <div className="markdown max-w-none">
                    {/* <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                      {responseContent}
                    </ReactMarkdown> */}
                    <MarkdownRenderer content={responseContent} />
                    {htmlContent && (
                      <SafeHTMLContent htmlContent={htmlContent} />
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Start by submitting a query.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="activity">
            <div className="rounded-xl border border-input">
              <div className="p-6 pt-6">
                <div className="prose max-w-none text-muted-foreground">
                  {activities.length === 0 ? (
                    <p>No activities found.</p>
                  ) : (
                    <ul>
                      <ActivityAccordian
                        activeTab="activity"
                        activities={activities}
                      />
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Floating Buttons */}
        {/* <div className="fixed bottom-8 right-8 flex flex-row gap-4">
          <Button size="icon" variant="outline">
            <DownloadIcon className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline">
            <CopyIcon className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline">
            <Share2Icon className="h-4 w-4" />
          </Button>
        </div> */}
      </div>
    </div>
  );
};

export default TwoColumnPage;
