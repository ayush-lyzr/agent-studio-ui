import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { ChevronDown, ChevronRight, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import LabelWithTooltip from "@/components/custom/label-with-tooltip";
import type { FormData } from "./UploadWizard";
import {
  KB_UPLOAD_DISCLAIMER_ONE,
  KB_UPLOAD_DISCLAIMER_TWO,
} from "@/lib/constants";

interface WebsiteCrawlConfigProps {
  form: UseFormReturn<FormData>;
  onContinue: () => void;
}

export default function WebsiteCrawlConfig({
  form,
  onContinue,
}: WebsiteCrawlConfigProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const websiteUrl = form.watch("websiteUrl");

  const isValidUrl = (url: string): boolean => {
    if (!url || url.trim().length === 0) return false;

    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };
  const isUrlValid = isValidUrl(websiteUrl || "");
  const canContinue = isUrlValid;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="websiteUrl"
          render={({ field }) => (
            <FormItem>
              <LabelWithTooltip tooltip="Enter the URL of the website you want to crawl">
                Website URL
              </LabelWithTooltip>
              <FormControl>
                <Input
                  {...field}
                  placeholder="https://example.com"
                  className="text-base"
                />
              </FormControl>
              <FormDescription className="text-xs text-muted-foreground">
                * Due to site-level restrictions, certain content may not be
                retrievable.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Advanced Options Toggle */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
              type="button"
            >
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Advanced Crawling Options</span>
              </div>
              {showAdvanced ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="depth"
                render={({ field }) => (
                  <FormItem>
                    <LabelWithTooltip tooltip="How deep the crawler should go through website links (1-10)">
                      Crawl Depth
                    </LabelWithTooltip>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        {...field}
                        placeholder="2"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxUrls"
                render={({ field }) => (
                  <FormItem>
                    <LabelWithTooltip tooltip="Maximum number of URLs to crawl (1-10000)">
                      Max URLs
                    </LabelWithTooltip>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="10000"
                        {...field}
                        placeholder="1000"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="workers"
                render={({ field }) => (
                  <FormItem>
                    <LabelWithTooltip tooltip="Number of concurrent workers (1-50)">
                      Workers
                    </LabelWithTooltip>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        {...field}
                        placeholder="10"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="delay"
                render={({ field }) => (
                  <FormItem>
                    <LabelWithTooltip tooltip="Delay between requests (e.g., 200ms, 1s)">
                      Request Delay
                    </LabelWithTooltip>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select delay" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="100ms">100ms</SelectItem>
                          <SelectItem value="200ms">200ms</SelectItem>
                          <SelectItem value="500ms">500ms</SelectItem>
                          <SelectItem value="1s">1s</SelectItem>
                          <SelectItem value="2s">2s</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="headlessTimeout"
                render={({ field }) => (
                  <FormItem>
                    <LabelWithTooltip tooltip="Timeout for headless browser operations (5-120 seconds)">
                      Headless Timeout (s)
                    </LabelWithTooltip>
                    <FormControl>
                      <Input
                        type="number"
                        min="5"
                        max="120"
                        {...field}
                        placeholder="30"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value || 1000}
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
                        value={field.value || 100}
                        placeholder="100"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="enableHeadless"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <LabelWithTooltip tooltip="Enable headless browser for JavaScript-heavy sites">
                        Enable Headless Browser
                      </LabelWithTooltip>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enableHtml"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <LabelWithTooltip tooltip="Extract HTML content from pages">
                        Enable HTML Extraction
                      </LabelWithTooltip>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enableSitemap"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <LabelWithTooltip tooltip="Use sitemap.xml to discover URLs">
                        Enable Sitemap Discovery
                      </LabelWithTooltip>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="waitForJs"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <LabelWithTooltip tooltip="Wait for JavaScript to load before extracting content">
                        Wait for JavaScript
                      </LabelWithTooltip>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-md bg-muted/50 p-4">
              <h4 className="mb-2 text-sm font-medium">
                Advanced Crawling Options
              </h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>
                  • <strong>Depth:</strong> How many link levels to follow from
                  the starting URL
                </li>
                <li>
                  • <strong>Workers:</strong> More workers = faster crawling but
                  higher resource usage
                </li>
                <li>
                  • <strong>Delay:</strong> Time between requests to avoid
                  overwhelming the server
                </li>
                <li>
                  • <strong>Headless Browser:</strong> Required for
                  JavaScript-heavy sites
                </li>
                <li>
                  • <strong>Sitemap:</strong> Uses sitemap.xml to discover pages
                  more efficiently
                </li>
              </ul>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="text-xxs text-muted-foreground">
        <p>{KB_UPLOAD_DISCLAIMER_ONE}</p>
        <p>{KB_UPLOAD_DISCLAIMER_TWO}</p>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="button" onClick={onContinue} disabled={!canContinue}>
          Continue →
        </Button>
      </div>
    </div>
  );
}
