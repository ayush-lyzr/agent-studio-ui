import { useState } from "react";
import { Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface CrawlUrlSelectionProps {
  urls: string[];
  crawlStats: {
    totalUrls: number;
    duration: string;
    urlsPerSecond: string;
    targetUrl: string;
  };
  onSelectionConfirm: (selectedUrls: string[]) => void;
  onBack: () => void;
}

export default function CrawlUrlSelection({
  urls,
  crawlStats,
  onSelectionConfirm,
  onBack,
}: CrawlUrlSelectionProps) {
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const handleUrlToggle = (url: string) => {
    const newSelected = new Set(selectedUrls);
    if (newSelected.has(url)) {
      newSelected.delete(url);
    } else {
      newSelected.add(url);
    }
    setSelectedUrls(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelected = new Set(selectedUrls);
    if (checked) {
      filteredUrls.forEach((url) => newSelected.add(url));
    } else {
      filteredUrls.forEach((url) => newSelected.delete(url));
    }
    setSelectedUrls(newSelected);
  };

  const handleConfirm = () => {
    onSelectionConfirm(Array.from(selectedUrls));
  };

  const getDisplayUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname === "/" ? urlObj.hostname : urlObj.pathname;
    } catch {
      return url;
    }
  };

  const getUrlCategory = (url: string) => {
    const path = url.toLowerCase();
    if (path.includes("about") || path.includes("team")) return "About";
    if (path.includes("product") || path.includes("service")) return "Products";
    if (path.includes("contact") || path.includes("form")) return "Contact";
    if (path.includes("blog") || path.includes("news")) return "Content";
    if (path === crawlStats.targetUrl || path.endsWith("/")) return "Home";
    return "Other";
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredUrls = normalizedQuery
    ? urls.filter((url) => url.toLowerCase().includes(normalizedQuery))
    : urls;

  const allFilteredSelected =
    filteredUrls.length > 0 &&
    filteredUrls.every((url) => selectedUrls.has(url));

  const urlsByCategory = filteredUrls.reduce(
    (acc, url) => {
      const category = getUrlCategory(url);
      if (!acc[category]) acc[category] = [];
      acc[category].push(url);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center space-x-2">
          <Globe className="h-6 w-6 text-green-600" />
          <h3 className="text-lg font-semibold text-green-700">
            Crawl Completed!
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Select which pages you want to add to your knowledge base
        </p>
      </div>

      {/* Crawl Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-base">
            <Globe className="h-5 w-5 text-primary" />
            <span>Crawl Results</span>
          </CardTitle>
          <CardDescription>
            Found {crawlStats.totalUrls} pages from {crawlStats.targetUrl}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-semibold">
                {crawlStats.totalUrls}
              </div>
              <div className="text-muted-foreground">Pages Found</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{crawlStats.duration}</div>
              <div className="text-muted-foreground">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {crawlStats.urlsPerSecond}
              </div>
              <div className="text-muted-foreground">URLs/sec</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* URL Selection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Select Pages</CardTitle>
              <CardDescription>
                {selectedUrls.size} of {urls.length} pages selected
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={allFilteredSelected}
                onCheckedChange={handleSelectAll}
                id="select-all"
                disabled={filteredUrls.length === 0}
              />
              <label
                htmlFor="select-all"
                className="cursor-pointer text-sm font-medium"
              >
                Select All
              </label>
            </div>
          </div>
          <div className="pt-3">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search pages by URL..."
              aria-label="Search pages"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-[300px] w-full">
            <div className="space-y-4">
              {filteredUrls.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No pages match your search.
                </div>
              ) : (
                Object.entries(urlsByCategory).map(
                  ([category, categoryUrls]) => (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {categoryUrls.length} page
                          {categoryUrls.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="ml-4 space-y-1">
                        {categoryUrls.map((url) => (
                          <div
                            key={url}
                            className="flex items-center space-x-3 rounded-md p-2 transition-colors hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={selectedUrls.has(url)}
                              onCheckedChange={() => handleUrlToggle(url)}
                              id={`url-${url}`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2">
                                <label
                                  htmlFor={`url-${url}`}
                                  className="flex-1 cursor-pointer truncate text-sm"
                                  title={url}
                                >
                                  {getDisplayUrl(url)}
                                </label>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground transition-colors hover:text-primary"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                              <div className="break-all text-xs text-muted-foreground">
                                {url}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Back to Crawl
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={selectedUrls.size === 0}
        >
          Process {selectedUrls.size} Page{selectedUrls.size !== 1 ? "s" : ""} →
        </Button>
      </div>
    </div>
  );
}
